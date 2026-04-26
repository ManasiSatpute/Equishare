import db from "../config/db.js";
import dayjs from 'dayjs';


// ✅ GET /api/cart
export const getCart = async (req, res) => {
  try {
  console.log("\n[DEBUG] GET /api/cart Request:");
  console.log("User object:", req.user);
  console.log("User ID:", req.user?.id);
  console.log("Auth Header:", req.headers.authorization);
  console.log("Headers:", req.headers);
    
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });

    // First verify if cart table has items
    const [cartCheck] = await db.promise().query(
      'SELECT COUNT(*) as count FROM cart WHERE user_id = ?',
      [userId]
    );
    console.log('[DEBUG] Cart count:', cartCheck[0].count);

    // Get cart items with equipment details
    const [cartItems] = await db.promise().query(
      `SELECT 
        c.id AS cart_id,
        c.equipment_id,
        c.days,
        c.quantity,
        e.name,
        e.price,
        e.image_url
      FROM cart c
      INNER JOIN equipment e ON e.id = c.equipment_id
      WHERE c.user_id = ?`,
      [userId]
    );

    console.log('[DEBUG] Cart items query result:', {
      count: cartItems.length,
      items: JSON.stringify(cartItems, null, 2)
    });

    // If no cart items, return empty array
    if (!cartItems.length) {
      console.log('[DEBUG] No cart items found');
      return res.json([]);
    }

    // Format the response
    const result = cartItems.map(item => ({
      id: item.cart_id, // Using the aliased cart_id
      equipment_id: item.equipment_id,
      days: item.days,
      quantity: item.quantity || 1,
      name: item.name,
      price: parseFloat(item.price), // Ensure price is a number
      image_url: item.image_url
    }));

    console.log('[DEBUG] Formatted response:', JSON.stringify(result, null, 2));
    return res.json(result);
  } catch (error) {
    console.error("❌ Error fetching cart:", error);
    console.error(error.stack);
    return res.status(500).json({ message: "Server error while fetching cart" });
  }
};



// ✅ POST /api/cart/add
export const addToCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });

    const equipmentId = Number(req.body?.equipmentId);
    const days = Math.max(1, Number(req.body?.days || 1));
    const quantity = Math.max(1, Number(req.body?.quantity || 1));

    if (!Number.isInteger(equipmentId) || equipmentId <= 0) {
      return res.status(400).json({ message: "Valid equipmentId is required" });
    }

    // ✅ Check equipment exists and has sufficient stock safely
    const [[equip]] = await db.promise().query(
      "SELECT * FROM equipment WHERE id = ?",
      [equipmentId]
    );
    if (!equip) return res.status(404).json({ message: "Equipment not found" });

    const equipQuantity = equip.quantity !== undefined && equip.quantity !== null ? equip.quantity : Infinity;
    if (!equip.available || equipQuantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    // ✅ Avoid duplicates in cart
    const [[existing]] = await db.promise().query(
      "SELECT id FROM cart WHERE user_id = ? AND equipment_id = ?",
      [userId, equipmentId]
    );
    if (existing)
      return res.status(409).json({ message: "Item already in cart" });

    console.log('[addToCart] Adding item:', { userId, equipmentId, days, quantity });
    
    const [result] = await db
      .promise()
      .query(
        "INSERT INTO cart (user_id, equipment_id, days, quantity, created_at) VALUES (?, ?, ?, ?, NOW())",
        [userId, equipmentId, days, quantity]
      );
    
    console.log('[addToCart] Insert result:', result);
    
    // Get the newly created cart item with equipment details
    const [[newItem]] = await db
      .promise()
      .query(
        `SELECT 
          c.id AS cart_id,
          c.equipment_id,
          c.days,
          c.quantity,
          e.name,
          e.price,
          e.image_url
         FROM cart c
         JOIN equipment e ON e.id = c.equipment_id
         WHERE c.id = ?`,
        [result.insertId]
      );
    
    console.log('[DEBUG] New cart item:', JSON.stringify(newItem, null, 2));
    
    const formattedItem = {
      id: newItem.cart_id,
      equipment_id: newItem.equipment_id,
      days: newItem.days,
      quantity: newItem.quantity,
      name: newItem.name,
      price: parseFloat(newItem.price),
      image_url: newItem.image_url
    };
    
    return res.status(201).json({
      message: "Added to cart successfully",
      item: formattedItem
    });
  } catch (error) {
    console.error("❌ Error adding to cart:", error);
    return res.status(500).json({ message: "Server error while adding to cart" });
  }
};



// ✅ DELETE /api/cart/remove/:id
// Here :id refers to the cart_id
export const removeFromCart = async (req, res) => {
  try {
  const userId = req.user?.id;
  const cartId = req.params?.id;
  console.log("[removeFromCart] User ID:", userId);
  console.log("[removeFromCart] Cart ID param:", cartId);
  console.log("[removeFromCart] Auth Header:", req.headers.authorization);

    if (!userId) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!cartId) {
      return res.status(400).json({ message: "Cart ID is required" });
    }

    const parsedCartId = Number(cartId);
    if (!Number.isInteger(parsedCartId) || parsedCartId <= 0) {
      return res.status(400).json({ message: "Valid cart ID is required" });
    }

    // Delete the cart item and check if it existed
    const [result] = await db
      .promise()
      .query(
        "DELETE FROM cart WHERE id = ? AND user_id = ?",
        [parsedCartId, userId]
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Item not found in your cart" });
    }

    console.log("[removeFromCart] Successfully removed cart item:", cartId);
    return res.json({ message: "Item removed from cart" });
  } catch (error) {
    console.error("❌ Error removing from cart:", error);
    console.error(error.stack);
    return res.status(500).json({
      message: "Server error while removing item",
      error: error.message,
    });
  }
};



// ✅ DELETE /api/cart/clear
export const clearCart = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "User not found" });

    await db.promise().query("DELETE FROM cart WHERE user_id = ?", [userId]);
    return res.json({ message: "All items removed from cart" });
  } catch (error) {
    console.error("❌ Error clearing cart:", error);
    return res.status(500).json({ message: "Server error while clearing cart" });
  }
};



// // ✅ POST /api/cart/confirm-payment
// export const confirmPayment = async (req, res) => {
//   console.log('\n[Payment] Starting payment confirmation...');
//   console.log('[Payment] Auth headers:', req.headers);
//   console.log('[Payment] Auth user:', req.user);
//   console.log('[Payment] Request body:', {
//     ...req.body,
//     cartItems: req.body.cartItems?.length + ' items' // Log count to avoid huge output
//   });
  
//   if (!req.headers.authorization) {
//     console.log('[Payment] Missing Authorization header');
//     return res.status(401).json({ message: "No authorization header provided" });
//   }

//   if (!req.user) {
//     console.log('[Payment] Missing user object');
//     return res.status(401).json({ message: "Authentication required" });
//   }

//   console.log('[Payment] Getting database connection...');
//   const connection = await db.promise().getConnection();
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ message: "User ID not found in token" });

//     const { cartItems, address, startDate, endDate, totalAmount } = req.body;
    
//     console.log('[Payment] Received request data:', {
//       userId,
//       cartItemsCount: cartItems?.length,
//       address,
//       startDate,
//       endDate,
//       totalAmount
//     });

//     if (!cartItems?.length) {
//       return res.status(400).json({ message: "Cart is empty" });
//     }

//     // First verify all cart items belong to this user
//     const cartItemIds = cartItems.map(item => item.id).filter(Boolean);
//     console.log('[Payment] Validating cart items:', cartItemIds);
    
//     const [userCartItems] = await connection.query(
//       `SELECT c.id, c.equipment_id, c.days, c.user_id, 
//               e.name, e.price, e.owner_id, e.available,
//               u.role as owner_role
//        FROM cart c
//        INNER JOIN equipment e ON c.equipment_id = e.id
//        INNER JOIN users u ON e.owner_id = u.id
//        WHERE c.id IN (?) AND c.user_id = ?`,
//       [cartItemIds, userId]
//     );

//     console.log('[Payment] Found user cart items:', userCartItems);

//     if (userCartItems.length !== cartItemIds.length) {
//       console.error('[Payment] Some cart items not found or don\'t belong to user', {
//         requested: cartItemIds,
//         found: userCartItems.map(i => i.id)
//       });
//       await connection.rollback();
//       return res.status(400).json({ 
//         message: "Some cart items are invalid or don't belong to you"
//       });
//     }

//     if (!address || !startDate || !endDate) {
//       return res.status(400).json({ message: "Missing required fields" });
//     }

//     // Validate date formats
//     if (!dayjs(startDate).isValid() || !dayjs(endDate).isValid()) {
//       return res.status(400).json({ message: "Invalid date format" });
//     }

//     await connection.beginTransaction();

//     console.log('Starting payment confirmation with data:', { 
//       userId, 
//       itemCount: cartItems.length,
//       startDate,
//       endDate
//     });

//     console.log('Validating cart items:', cartItems);

//     // First, fetch and validate all equipment details
//     const validatedItems = [];
//     for (const item of cartItems) {
//       if (!item.equipment_id) {
//         await connection.rollback();
//         return res.status(400).json({ 
//           message: "Invalid cart item: missing equipment_id",
//           item
//         });
//       }

//       // Get equipment details with owner info
//       const [equipmentRows] = await connection.query(
//         `SELECT 
//           e.id as equipment_id,
//           e.name,
//           e.price,
//           e.owner_id,
//           e.available,
//           u.id as verified_owner_id,
//           u.role as owner_role
//          FROM equipment e 
//          INNER JOIN users u ON e.owner_id = u.id 
//          WHERE e.id = ? AND e.available = TRUE
//          AND u.role = 'owner'`,
//         [item.equipment_id]
//       );
      
//       const equipment = equipmentRows[0];
//       console.log('Equipment query result:', {
//         itemId: item.equipment_id,
//         equipment: equipment ? {
//           ...equipment,
//           owner_id: equipment.owner_id,
//           verified_owner_id: equipment.verified_owner_id,
//           owner_role: equipment.owner_role
//         } : null,
//         rowCount: equipmentRows.length
//       });
      
//       if (!equipment) {
//         await connection.rollback();
//         return res.status(404).json({ 
//           message: `Equipment with ID ${item.equipment_id} not found, unavailable, or has no valid owner`
//         });
//       }

//       // Verify owner exists
//       const [ownerRows] = await connection.query(
//         'SELECT id FROM users WHERE id = ?',
//         [equipment.verified_owner_id]
//       );

//       if (!ownerRows.length) {
//         await connection.rollback();
//         return res.status(400).json({ 
//           message: `Invalid owner for equipment ${item.equipment_id}`
//         });
//       }

//       validatedItems.push({
//         ...item,
//         name: equipment.name,
//         price: equipment.price,
//         owner_id: equipment.verified_owner_id
//       });
//     }

//     // If we get here, all items are validated. Now create the rentals.
//     try {
//       // We already have a connection and transaction from earlier

//       // Create rentals for validated items
//       for (const item of validatedItems) {
//         // Calculate total amount
//         const itemPrice = Number(item.price);
//         const itemDays = Number(item.days || 1);
        
//         if (isNaN(itemPrice) || isNaN(itemDays)) {
//           await connection.rollback();
//           return res.status(400).json({
//             message: "Invalid price or days",
//             item: {
//               equipment_id: item.equipment_id,
//               price: item.price,
//               days: item.days
//             }
//           });
//         }

//         const totalAmount = itemPrice * itemDays;
        
//         console.log('Creating rental:', {
//           userId,
//           equipmentId: item.equipment_id,
//           ownerId: item.owner_id,
//           days: itemDays,
//           price: itemPrice,
//           totalAmount,
//           startDate,
//           endDate
//         });

//         try {
//           console.log('[Payment] Inserting rental with values:', {
//             userId,
//             equipment_id: item.equipment_id,
//             owner_id: item.owner_id,
//             days: itemDays,
//             startDate,
//             endDate,
//             totalAmount
//           });

//           // Verify owner exists and has owner role before insert
//           const [ownerCheck] = await connection.query(
//             'SELECT id FROM users WHERE id = ? AND role = ?',
//             [item.owner_id, 'owner']
//           );

//           if (!ownerCheck.length) {
//             console.error('[Payment] Valid owner not found:', {
//               owner_id: item.owner_id,
//               validationError: 'User either does not exist or is not an owner'
//             });
//             await connection.rollback();
//             return res.status(400).json({ 
//               message: `Invalid owner ID ${item.owner_id}: User either does not exist or is not an owner`
//             });
//           }

//           // Insert the rental
//           const [rentalResult] = await connection.query(
//             `INSERT INTO rentals (
//               user_id, equipment_id, owner_id, days, start_date, end_date, 
//               total_amount, payment_status, delivery_status,
//               razorpay_order_id, razorpay_payment_id
//             ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
//             [
//               userId,
//               item.equipment_id,
//               item.owner_id,
//               itemDays,
//               startDate,
//               endDate,
//               totalAmount,
//               'pending',
//               'pending',
//               null,
//               null
//             ]
//           );

//           console.log('[Payment] Rental insert result:', rentalResult);

//           // Mark equipment as unavailable
//           await connection.query(
//             'UPDATE equipment SET available = FALSE WHERE id = ?',
//             [item.equipment_id]
//           );
//         } catch (err) {
//           console.error('Error creating rental:', err);
//           await connection.rollback();
//           throw err;
//         }

//         // Update equipment availability
//         await connection.query(
//           'UPDATE equipment SET available = FALSE WHERE id = ?',
//           [item.equipment_id]
//         );
//       }

//       try {
//         // Clear the cart after all rentals are created
//         await connection.query(
//           "DELETE FROM cart WHERE user_id = ?",
//           [userId]
//         );

//         await connection.commit();
//         return res.json({ 
//           message: "Payment successful and rentals created!",
//           rentals: validatedItems.map(item => ({
//             equipment_id: item.equipment_id,
//             name: item.name,
//             days: item.days,
//             total_amount: Number(item.price) * Number(item.days)
//           }))
//         });
//       } catch (err) {
//         console.error('Error in final steps:', err);
//         await connection.rollback();
//         throw err;
//       }
//     } catch (error) {
//       console.error("❌ Error confirming payment:", error);
//       // Don't expose internal error details to client
//       return res.status(500).json({ 
//         message: "Server error while confirming payment", 
//         error: error.message 
//       });
//     } finally {
//       if (connection) {
//         try {
//           connection.release();
//         } catch (err) {
//           console.error('Error releasing connection:', err);
//         }
//       }
//     }
//   } catch (error) {
//     console.error("❌ Error in payment confirmation (outer):", error);
//     return res.status(500).json({ 
//       message: "Server error while confirming payment", 
//       error: error.message 
//     });
//   }
// };
