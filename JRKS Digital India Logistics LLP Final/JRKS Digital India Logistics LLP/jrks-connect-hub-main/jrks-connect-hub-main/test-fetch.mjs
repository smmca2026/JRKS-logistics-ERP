async function test() {
  const res = await fetch("http://localhost:3047/api/money-receipts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
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
    }),
  });
  console.log(await res.json());
}
test();
