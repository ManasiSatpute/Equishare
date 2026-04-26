import db from "../config/db.js";
import dayjs from "dayjs";

// --- UTILS ---
const getTransaction = async () => {
    const connection = await db.promise().getConnection();
    await connection.beginTransaction();
    return connection;
};

const handleTransactionError = async (connection, error) => {
    if (connection) {
        try {
            await connection.rollback();
        } catch (rollbackError) {
            console.error('Rollback failed:', rollbackError);
        } finally {
            connection.release();
        }
    }
    console.error('Transaction error:', error);
    return { error: error.message || 'An error occurred during the transaction' };
};

// --- CORE CONTROLLERS ---

export const checkoutRental = async (req, res) => {
    let connection = null;
    try {
        connection = await getTransaction();
        const userId = req.user.id;
        const { items, address, paymentMethod, startDate, endDate, totalAmount } = req.body;

        if (!items?.length) return res.status(400).json({ message: 'No items in cart' });
        
        const results = [];
        let calculatedTotal = 0;

        for (const item of items) {
            const equipmentId = item.equipment_id || item.equipmentId || item.id;
            const rentDays = Number(item.days || 1);
            const quantityToRent = Number(item.quantity || 1);

            const [equipRows] = await connection.query(
                'SELECT * FROM equipment WHERE id = ? AND available = TRUE FOR UPDATE',
                [equipmentId]
            );
            const equip = equipRows[0];
            if (!equip || equip.quantity < quantityToRent) {
                throw new Error(`Equipment ${equipmentId} is not available or lacks sufficient quantity`);
            }

            const rStartDate = startDate || dayjs().format('YYYY-MM-DD');
            const rEndDate = endDate || dayjs(rStartDate).add(rentDays, 'day').format('YYYY-MM-DD');
            const amount = Number(equip.price) * rentDays * quantityToRent;
            calculatedTotal += amount;

            // Generate 4-digit OTPs
            const pickupOtp = Math.floor(1000 + Math.random() * 9000).toString();
            const dropoffOtp = Math.floor(1000 + Math.random() * 9000).toString();

            const fakeOrderId = "ORDER_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
            const fakePaymentId = "PAY_" + Math.random().toString(36).substring(2, 10).toUpperCase();

            // Insert into rentals table. Check if quantity column exists.
            // If it doesn't exist, this might fail, but based on the previous confirmPayment, it was used.
            const [rentalResult] = await connection.query(
                `INSERT INTO rentals (
                  user_id, equipment_id, owner_id, days, start_date, end_date,
                  total_amount, payment_status, delivery_status,
                  pickup_otp, dropoff_otp, razorpay_order_id, razorpay_payment_id
                ) VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', 'pending', ?, ?, ?, ?)`,
                [userId, equipmentId, equip.owner_id, rentDays, rStartDate, rEndDate, amount, pickupOtp, dropoffOtp, fakeOrderId, fakePaymentId]
            );

            // Update equipment limits (decrement quantity)
            await connection.query("UPDATE equipment SET quantity = GREATEST(quantity - ?, 0) WHERE id = ?", [quantityToRent, equipmentId]);
            await connection.query("UPDATE equipment SET available = FALSE WHERE id = ? AND quantity <= 0", [equipmentId]);
            
            results.push({ rental_id: rentalResult.insertId, pickupOtp });
        }

        // Clear user's entire cart upon checkout completion
        await connection.query('DELETE FROM cart WHERE user_id = ?', [userId]);

        await connection.commit();
        return res.status(201).json({ 
            success: true, 
            message: "Transaction successful! Rentals created.",
            data: results,
            order: {
              total_amount: calculatedTotal,
              payment_status: "Success"
            }
        });
    } catch (error) {
        await handleTransactionError(connection, error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const getDashboardData = async (req, res) => {
    try {
        const ownerId = req.user.id;

        // Fetch deliveries including OTPs for the UI
        const [deliveries] = await db.promise().query(
            `SELECT r.*, e.name AS equipment_name 
             FROM rentals r 
             JOIN equipment e ON e.id = r.equipment_id 
             WHERE r.owner_id = ? AND r.delivery_status NOT IN ('returned', 'DELIVERED')`, 
             [ownerId]
        );

        // Fetch notifications for the specific "Notifications" tab
        const [notifications] = await db.promise().query(
            `SELECT r.*, e.name AS equipment_name, u.first_name, u.email 
             FROM rentals r 
             JOIN equipment e ON e.id = r.equipment_id 
             JOIN users u ON u.id = r.user_id
             WHERE r.owner_id = ? AND r.delivery_status = 'pending'`, 
             [ownerId]
        );

        return res.json({ success: true, data: { deliveries, notifications } });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

export const verifyDeliveryOTP = async (req, res) => {
    let connection = null;
    try {
        connection = await getTransaction();
        const { rentalId, enteredOtp, type } = req.body; // type: 'PICKUP' or 'DELIVERY'

        const [rows] = await connection.query('SELECT * FROM rentals WHERE id = ? FOR UPDATE', [rentalId]);
        const rental = rows[0];

        if (!rental) throw new Error("Rental record not found");

        const correctOtp = type === 'PICKUP' ? rental.pickup_otp : rental.dropoff_otp;
        
        // Legacy support: if correctOtp is totally missing/null from an old order, bypass.
        if (correctOtp && enteredOtp !== correctOtp) {
            throw new Error("Invalid Security Code. Handshake failed.");
        }

        const nextStatus = type === 'PICKUP' ? 'OUT_FOR_DELIVERY' : 'DELIVERED';
        
        await connection.query('UPDATE rentals SET delivery_status = ? WHERE id = ?', [nextStatus, rentalId]);

        await connection.commit();
        return res.json({ success: true, message: `Status updated to ${nextStatus}` });
    } catch (error) {
        await handleTransactionError(connection, error);
        return res.status(400).json({ success: false, message: error.message });
    }
};

// Existing logic for other routes
export const getUserHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const [rows] = await db.promise().execute(
            `SELECT r.*, e.name AS equipment_name FROM rentals r JOIN equipment e ON r.equipment_id = e.id WHERE r.user_id = ? ORDER BY r.start_date DESC`, 
            [userId]
        );
        res.status(200).json({ success: true, data: { history: rows } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const getOwnerHistory = async (req, res) => {
    try {
        const ownerId = req.user.id;
        const [history] = await db.promise().execute(
            `SELECT r.*, e.name AS equipment_name FROM rentals r JOIN equipment e ON r.equipment_id = e.id WHERE r.owner_id = ? AND r.delivery_status = 'returned'`, 
            [ownerId]
        );
        res.status(200).json({ success: true, data: history });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

export const updateDeliveryStatus = async (req, res) => {
    try {
        const { status } = req.body;
        await db.promise().query('UPDATE rentals SET delivery_status = ? WHERE id = ?', [status, req.params.deliveryId]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};

export const markDamaged = async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT equipment_id FROM rentals WHERE id = ?', [req.params.id]);
        await db.promise().query('UPDATE equipment SET equipment_condition = "Damaged" WHERE id = ?', [rows[0].equipment_id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};

export const returnRental = async (req, res) => {
    try {
        await db.promise().query('UPDATE rentals SET delivery_status = "returned" WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) { res.status(500).json({ success: false }); }
};