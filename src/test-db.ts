import db from "./config/db";

async function testConnection() {
  try {
    const [rows] = await db.query("SELECT 1 + 1 AS result");
    console.log("✅ Conexión exitosa:", rows);
  } catch (err) {
    console.error("❌ Error en la conexión:", err);
  }
}

testConnection();
