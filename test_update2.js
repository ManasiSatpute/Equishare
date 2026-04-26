import fetch from "node-fetch";

async function test() {
  // 1. Create a brand new owner account
  const rand = Math.floor(Math.random() * 1000);
  const email = `testowner${rand}@example.com`;
  const signupRes = await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password", role: "owner" })
  });
  const signupData = await signupRes.json();
  console.log("Signup:", signupData.success);

  // 2. Login to get token
  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  console.log("Login Token received");

  // 3. Create equipment
  const formData = new FormData();
  formData.append("name", "Test Tractor " + rand);
  formData.append("category", "Tractor");
  formData.append("price", "1000");
  formData.append("location", "Mumbai");
  formData.append("description", "A very nice tractor");

  //! Note: Node fetch's FormData behavior is tricky without 'form-data' package, let's just make a fetch call.
  // Actually I can't easily construct a multipart/form-data payload with node-fetch core without the package.
}
test();
