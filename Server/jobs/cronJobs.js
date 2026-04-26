import cron from "node-cron";
import db from "../config/db.js";

// Run every minute for demonstration (in production this would be '0 0 * * *' for daily midnight)
export const initCronJobs = () => {
    // Schedule task
    cron.schedule("* * * * *", async () => {
        try {
            const pool = db.promise();
            
            // 1. Auto-update delivery status to DELIVERED if expected_delivery_date is reached
            // "based on the distance the order will be placed"
            const [deliveryRes] = await pool.query(`
                UPDATE delivery_status 
                SET status = 'DELIVERED', 
                    actual_delivery_date = CURDATE(),
                    updated_at = NOW()
                WHERE expected_delivery_date <= CURDATE() 
                  AND status NOT IN ('DELIVERED', 'CANCELLED')
            `);
            
            // 2. Auto-return logic
            // "after a fixed period the product will be automatically turned as available ans status should be update as available for return"
            // We use return_requested to show it on OwnerDashboard as "available for return"
            const [returnRes] = await pool.query(`
                UPDATE equipment e
                JOIN rentals r ON e.id = r.equipment_id
                SET e.available = TRUE, 
                    r.delivery_status = 'return_requested',
                    r.updated_at = NOW()
                WHERE r.end_date <= CURDATE() 
                  AND r.delivery_status NOT IN ('return_requested', 'returned')
            `);

            if (returnRes.affectedRows > 0 || deliveryRes.affectedRows > 0) {
                console.log(`[Cron] Auto-processed: ${deliveryRes.affectedRows} deliveries assumed placed, ${returnRes.affectedRows} rentals made available for return.`);
            }

        } catch (error) {
            console.error("[Cron Job Error]", error);
        }
    });

    console.log("Cron jobs initialized.");
};
