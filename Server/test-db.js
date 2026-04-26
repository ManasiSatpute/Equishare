import db from "./config/db.js";

async function run() {
  try {
    const [rows] = await db.promise().query("DESCRIBE equipment");
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
