
async function test() {
  const rand = Math.floor(Math.random() * 1000);
  const email = `testowner${rand}@example.com`;
  
  await fetch("http://localhost:3000/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password", role: "owner" })
  });

  const loginRes = await fetch("http://localhost:3000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: "password" })
  });
  const token = (await loginRes.json()).token;

  // Let's create an item
  // But wait, the API accepts multipart!
  // I will use FormData from 'formdata-node' or just construct multipart text
  const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
  let body = "";
  body += `--${boundary}\r\nContent-Disposition: form-data; name="name"\r\n\r\nTest Tractor\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="category"\r\n\r\nTractor\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="price"\r\n\r\n1000\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="location"\r\n\r\nMumbai\r\n`;
  body += `--${boundary}\r\nContent-Disposition: form-data; name="description"\r\n\r\nNice\r\n`;
  body += `--${boundary}--\r\n`;

  const createRes = await fetch("http://localhost:3000/api/equipment", {
    method: "POST",
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body
  });
  
  const createData = await createRes.json();
  console.log("Create Data:", createData);

  const equipId = createData.data.id;

  // Now UPDATE it!
  const updateRes = await fetch(`http://localhost:3000/api/equipment/${equipId}`, {
    method: "PUT",
    headers: { 
      "Authorization": `Bearer ${token}`,
      "Content-Type": `multipart/form-data; boundary=${boundary}`
    },
    body
  });
  
  const updateData = await updateRes.json();
  console.log("Update Data:", updateData);
}
test();
