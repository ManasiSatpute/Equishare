import db from "../config/db.js";
import dayjs from 'dayjs';


//  GET /api/cart
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



//  POST /api/cart/add
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

    //  Check equipment exists and has sufficient stock safely
    const [[equip]] = await db.promise().query(
      "SELECT * FROM equipment WHERE id = ?",
      [equipmentId]
    );
    if (!equip) return res.status(404).json({ message: "Equipment not found" });

    const equipQuantity = equip.quantity !== undefined && equip.quantity !== null ? equip.quantity : Infinity;
    if (!equip.available || equipQuantity < quantity) {
      return res.status(400).json({ message: "Insufficient stock available" });
    }

    //  Avoid duplicates in cart
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



//  DELETE /api/cart/remove/:id
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



//  DELETE /api/cart/clear
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



