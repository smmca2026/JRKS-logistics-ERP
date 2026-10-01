const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

if (!content.includes('import { setupOutstandingAccounts }')) {
  content = content.replace(
    'import { getPool } from "./db.js";',
    'import { getPool } from "./db.js";\nimport { setupOutstandingAccounts } from "./outstanding-accounts.js";'
  );
}

const voucherCodesEndpoints = `
// --- VOUCHER CODES API ---
app.get("/api/voucher-codes", async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query("SELECT * FROM voucher_codes");
    res.json(rows);
  } catch (err) {
    console.error("GET /api/voucher-codes error:", err);
    res.status(500).json({ error: "Failed to fetch voucher codes" });
  }
});

app.post("/api/voucher-codes", async (req, res) => {
  try {
    const pool = getPool();
    const id = uid();
    const body = req.body;
    const date = today();
    await pool.query(
      "INSERT INTO voucher_codes (id, code, expenseAccountName, description, active, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [id, body.code, body.expenseAccountName, body.description, body.active !== undefined ? body.active : 1, date, body.createdBy || "Admin"]
    );
    res.status(201).json({ id, ...body, createdAt: date, active: body.active !== undefined ? body.active : 1 });
  } catch (err) {
    console.error("POST /api/voucher-codes error:", err);
    res.status(500).json({ error: "Failed to create voucher code" });
  }
});

app.put("/api/voucher-codes/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    const body = req.body;
    const date = today();
    await pool.query(
      "UPDATE voucher_codes SET code=?, expenseAccountName=?, description=?, active=?, updatedAt=?, updatedBy=? WHERE id=?",
      [body.code, body.expenseAccountName, body.description, body.active !== undefined ? body.active : 1, date, body.updatedBy || "Admin", id]
    );
    res.json({ id, ...body, updatedAt: date });
  } catch (err) {
    console.error("PUT /api/voucher-codes error:", err);
    res.status(500).json({ error: "Failed to update voucher code" });
  }
});

app.delete("/api/voucher-codes/:id", async (req, res) => {
  try {
    const pool = getPool();
    const { id } = req.params;
    await pool.query("DELETE FROM voucher_codes WHERE id=?", [id]);
    res.json({ success: true, message: "Voucher code deleted" });
  } catch (err) {
    console.error("DELETE /api/voucher-codes error:", err);
    res.status(500).json({ error: "Failed to delete voucher code" });
  }
});

setupOutstandingAccounts(app);
`;

if (!content.includes('/api/voucher-codes')) {
  // Find the place to inject before SSR
  const ssrIndex = content.indexOf('app.use(async (req, res, next) => {');
  if (ssrIndex !== -1) {
    content = content.slice(0, ssrIndex) + voucherCodesEndpoints + '\n' + content.slice(ssrIndex);
    fs.writeFileSync('server/index.js', content, 'utf8');
    console.log("Missing routes injected successfully!");
  } else {
    console.log("Could not find insertion point.");
  }
} else {
  console.log("Routes already exist.");
}
