# EquiShare Backend API Guide

This document explains the backend API structure you need to implement to connect with the React frontend.

## Quick Start

Your React frontend is **READY TO USE** in VS Code! Just run:

```bash
npm install
npm run dev
```

The frontend will run on `http://localhost:8080`

## Backend Implementation Required

You need to build a Node.js/Express/MySQL backend that provides these API endpoints.

---

## 🔐 Authentication APIs

### 1. User Signup
**POST** `/api/auth/signup`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "role": "user" // or "owner"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "userId": "123",
  "token": "jwt_token_here"
}
```

### 2. User Login
**POST** `/api/auth/login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "123",
  "role": "user",
  "token": "jwt_token_here"
}
```

---

## 👤 User Profile APIs

### 3. Get User Profile
**GET** `/api/users/profile`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "id": "123",
  "email": "user@example.com",
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "phone": "+91 98765 43210",
  "alternatePhone": "+91 98765 43211",
  "address": {
    "street": "123 Village Road",
    "city": "Ludhiana",
    "state": "Punjab",
    "pincode": "141001",
    "country": "India"
  }
}
```

### 4. Update User Profile
**PUT** `/api/users/profile`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "firstName": "Rajesh",
  "lastName": "Kumar",
  "phone": "+91 98765 43210",
  "alternatePhone": "+91 98765 43211",
  "address": {
    "street": "123 Village Road",
    "city": "Ludhiana",
    "state": "Punjab",
    "pincode": "141001"
  }
}
```

---

## 🚜 Equipment APIs

### 5. Get All Equipment (Browse)
**GET** `/api/equipment`

**Query Params:**
- `category` (optional): tractor, harvester, tiller, sprayer
- `location` (optional): city or state
- `search` (optional): search query
- `available` (optional): true/false

**Response:**
```json
{
  "success": true,
  "equipment": [
    {
      "id": "1",
      "name": "John Deere Tractor 5075E",
      "category": "Tractor",
      "description": "Powerful and reliable tractor...",
      "price": 2500,
      "location": "Punjab, India",
      "image": "url_to_image",
      "available": true,
      "ownerId": "456",
      "ownerName": "Ramesh Singh",
      "specifications": {
        "enginePower": "75 HP",
        "fuelType": "Diesel",
        "year": "2022",
        "condition": "Excellent"
      }
    }
  ]
}
```

### 6. Get Single Equipment Details
**GET** `/api/equipment/:id`

**Response:**
```json
{
  "success": true,
  "equipment": {
    "id": "1",
    "name": "John Deere Tractor 5075E",
    "category": "Tractor",
    "description": "Powerful and reliable tractor...",
    "price": 2500,
    "location": "Punjab, India",
    "image": "url_to_image",
    "available": true,
    "owner": {
      "id": "456",
      "name": "Ramesh Singh",
      "rating": 4.8,
      "totalRentals": 45
    },
    "specifications": {
      "enginePower": "75 HP",
      "fuelType": "Diesel",
      "year": "2022",
      "condition": "Excellent"
    }
  }
}
```

### 7. Create Equipment (Owner)
**POST** `/api/equipment`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "name": "John Deere Tractor 5075E",
  "category": "Tractor",
  "description": "Powerful and reliable tractor...",
  "price": 2500,
  "location": "Punjab, India",
  "image": "base64_or_url",
  "specifications": {
    "enginePower": "75 HP",
    "fuelType": "Diesel",
    "year": "2022",
    "condition": "Excellent"
  }
}
```

### 8. Update Equipment (Owner)
**PUT** `/api/equipment/:id`

**Headers:** `Authorization: Bearer {token}`

### 9. Delete Equipment (Owner)
**DELETE** `/api/equipment/:id`

**Headers:** `Authorization: Bearer {token}`

---

## 🛒 Cart APIs

### 10. Get Cart Items
**GET** `/api/cart`

**Headers:** `Authorization: Bearer {token}`

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": "cart_item_1",
      "equipmentId": "1",
      "name": "John Deere Tractor 5075E",
      "price": 2500,
      "days": 3,
      "image": "url"
    }
  ]
}
```

### 11. Add to Cart
**POST** `/api/cart`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "equipmentId": "1",
  "days": 3
}
```

### 12. Remove from Cart
**DELETE** `/api/cart/:itemId`

**Headers:** `Authorization: Bearer {token}`

---

## ❤️ Wishlist APIs

### 13. Get Wishlist
**GET** `/api/wishlist`

**Headers:** `Authorization: Bearer {token}`

### 14. Add to Wishlist
**POST** `/api/wishlist`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "equipmentId": "1"
}
```

### 15. Remove from Wishlist
**DELETE** `/api/wishlist/:equipmentId`

**Headers:** `Authorization: Bearer {token}`

---

## 💳 Payment & Rental APIs

### 16. Create Rental Order
**POST** `/api/rentals`

**Headers:** `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "equipmentId": "1",
  "days": 3,
  "totalAmount": 7700
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_123",
  "razorpayOrderId": "razorpay_order_id",
  "amount": 7700
}
```

### 17. Verify Payment
**POST** `/api/rentals/verify-payment`

**Request Body:**
```json
{
  "orderId": "order_123",
  "razorpayPaymentId": "payment_id",
  "razorpaySignature": "signature"
}
```

---

## 🗺️ Map/Location APIs

### 18. Find Nearby Equipment
**GET** `/api/equipment/nearby`

**Query Params:**
- `latitude`: user's latitude
- `longitude`: user's longitude
- `radius`: search radius in km (default: 50)

---

## 📦 MySQL Database Schema

Create these tables in your MySQL database:

```sql
-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('user', 'owner') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    alternate_phone VARCHAR(20),
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE equipment (
    id INT PRIMARY KEY AUTO_INCREMENT,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    category ENUM('Tractor', 'Harvester', 'Tiller', 'Sprayer', 'Other') NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    location VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    image_url VARCHAR(500),
    available BOOLEAN DEFAULT true,
    engine_power VARCHAR(50),
    fuel_type VARCHAR(50),
    year VARCHAR(10),
    equipment_condition VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Cart table
CREATE TABLE cart (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    days INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE
);

-- Wishlist table
CREATE TABLE wishlist (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (equipment_id) REFERENCES equipment(id) ON DELETE CASCADE,
    UNIQUE KEY unique_wishlist (user_id, equipment_id)
);

-- Rentals table
CREATE TABLE rentals (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    equipment_id INT NOT NULL,
    owner_id INT NOT NULL,
    days INT NOT NULL,
    start_date DATE,
    end_date DATE,
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
    razorpay_order_id VARCHAR(255),
    razorpay_payment_id VARCHAR(255),
    delivery_status ENUM('pending', 'in_transit', 'delivered', 'returned') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Delivery tracking table
CREATE TABLE deliveries (
    id INT PRIMARY KEY AUTO_INCREMENT,
    rental_id INT NOT NULL,
    current_location VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    status ENUM('pending', 'picked_up', 'in_transit', 'delivered', 'returned') DEFAULT 'pending',
    estimated_delivery_time DATETIME,
    actual_delivery_time DATETIME,
    delivery_person_name VARCHAR(100),
    delivery_person_phone VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE
);
```

---

## 🔗 Connecting Frontend to Backend

In your frontend code, update the API calls from:

```javascript
// Current placeholder
// const response = await fetch('YOUR_BACKEND_URL/api/auth/login', ...);
```

To:

```javascript
const response = await fetch('http://localhost:3000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});
```

Replace `http://localhost:3000` with your actual backend URL.

---

## 🚀 Setup Instructions

### Frontend (This project):
```bash
npm install
npm run dev
```
Runs on `http://localhost:8080`

### Backend (You need to create):

1. Create a new folder: `backend/`
2. Initialize: `npm init -y`
3. Install dependencies:
   ```bash
   npm install express mysql2 bcryptjs jsonwebtoken cors dotenv razorpay
   ```
4. Create `server.js` and implement the APIs above
5. Run: `node server.js` (on port 3000)

### Database:
1. Install MySQL
2. Create database: `CREATE DATABASE equishare;`
3. Run the schema SQL provided above

---

## 💰 Payment Integration (Razorpay)

1. Sign up at https://razorpay.com/
2. Get API keys from Dashboard
3. Install: `npm install razorpay`
4. Example code:

```javascript
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Create order
const order = await razorpay.orders.create({
  amount: totalAmount * 100, // in paise
  currency: 'INR',
  receipt: 'order_' + Date.now()
});
```

Frontend integration example is already in the code (commented out).

---

## 🤖 AI Assistant Integration

For AI help feature, you can use OpenAI API:

```javascript
const openai = require('openai');

app.post('/api/ai/help', async (req, res) => {
  const { question } = req.body;
  
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      {
        role: "system",
        content: "You are a helpful assistant for an equipment rental platform in India."
      },
      {
        role: "user",
        content: question
      }
    ]
  });
  
  res.json({ answer: response.choices[0].message.content });
});
```

---

## 📍 Map Integration

The frontend is ready for Mapbox integration. You need to:

1. Get API key from https://mapbox.com/
2. Add environment variable: `VITE_MAPBOX_TOKEN=your_token`
3. Implement map component (we can add this later)

---

## 🎨 Frontend Features Already Implemented

✅ Beautiful Indian-themed UI with farm imagery  
✅ Responsive design for mobile and desktop  
✅ User authentication pages (login/signup)  
✅ User dashboard (browse equipment)  
✅ Owner dashboard (list equipment)  
✅ Profile page with Indian address fields  
✅ Shopping cart  
✅ Wishlist  
✅ Equipment details page  
✅ Navbar with all navigation  
✅ Toast notifications  
✅ Form validation  

---

## 📝 Next Steps

1. **Run the frontend** (it works right now!)
2. **Create the backend** following this API guide
3. **Set up MySQL** with the provided schema
4. **Connect them** by updating API URLs
5. **Add Razorpay** for payments
6. **(Optional) Add map integration**
7. **(Optional) Add AI assistant**

---

## 🆘 Need Help?

The frontend is fully functional and ready to connect. Focus on building the backend APIs following this guide. All TODO comments in the code show where to connect your backend.

**Total work remaining:** Backend implementation (~4-6 hours for experienced developer)
