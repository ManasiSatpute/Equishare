import fetch from "node-fetch";

async function test() {
  const res = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", password: "password" })
  });
  
  if (!res.ok) {
    console.log("Login failed", await res.text());
    return;
  }
  const data = await res.json();
  const token = data.token;
  
  const mineRes = await fetch("http://localhost:3000/api/equipment/mine", {
    headers: { "Authorization": `Bearer ${token}` }
  });
  
  const mineData = await mineRes.json();
  if (mineData.length === 0) {
     console.log("No equipment");
     return;
  }
  
  console.log("Found equipment to update:", mineData[0].id);
  
  // Make a put request without FormData (just json, as our controller doesn't STRICTLY need form data)
  // Wait, multer expects multipart/form-data. So we might need FormData. 
  // Let's just use JSON since multer handles both? No, multer ignores JSON!
  // It only parses multipart! 
  // But wait, the controller expects req.body. Let's see if express.json() is active. 
}

test();
