const fetch = require("node-fetch"); // node-fetch might not be available, I will use http

const http = require("http");

const data = JSON.stringify({
  mrNo: "MR001",
  lrNo: "LR001",
  branch: "Kattur, Trichy",
  receiptDate: "2026-07-17",
  partyName: "Test Party",
  paymentFor: "Freight Bill",
  amountReceived: "100.00",
  amountInWords: "Rupees One Hundred Only",
  narration: "Test",
  items: [
    {
      billNo: "B001",
      billDate: "2026-07-17",
      billAmount: "100.00",
      tdsPercentage: "0",
      tdsAmount: "0.00",
      receivedAmount: "100.00",
    },
  ],
});

const req = http.request(
  {
    hostname: "localhost",
    port: 3047,
    path: "/api/money-receipts",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": data.length,
    },
  },
  (res) => {
    let body = "";
    res.on("data", (chunk) => (body += chunk));
    res.on("end", () => console.log("Response:", res.statusCode, body));
  },
);

req.on("error", (error) => console.error(error));
req.write(data);
req.end();
