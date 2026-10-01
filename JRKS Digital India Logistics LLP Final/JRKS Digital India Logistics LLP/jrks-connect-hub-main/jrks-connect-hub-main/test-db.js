import mysql from "mysql2/promise";

async function test() {
  const connection = await mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "Digi@2024",
    database: "jrks",
    port: 3306,
  });

  const [rows] = await connection.execute("SELECT * FROM money_receipts");
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}

test();
