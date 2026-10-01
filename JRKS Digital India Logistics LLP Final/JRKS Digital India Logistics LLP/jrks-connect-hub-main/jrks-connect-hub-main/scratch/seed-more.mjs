import http from "http";

const API_BASE = "http://localhost:3047/api";

const newCompanies = [
  {
    consigneeName: "Reliance Industries Ltd",
    address: "Navi Mumbai, Maharashtra",
    contactPerson: "Mukesh A.",
    mobileNumber: "9876543222",
    gstNumber: "27RELIANCE1234Z",
    billingParty: "Consignor",
    active: true,
  },
  {
    consigneeName: "Tata Motors",
    address: "Pune, Maharashtra",
    contactPerson: "Ratan T.",
    mobileNumber: "9988776644",
    gstNumber: "27TATAMOTORS1Z5",
    billingParty: "Consignee",
    active: true,
  },
  {
    consigneeName: "L&T Construction",
    address: "Chennai, Tamil Nadu",
    contactPerson: "Larsen T.",
    mobileNumber: "9123456788",
    gstNumber: "33LTCONST1234Z9",
    billingParty: "Both",
    active: true,
  }
];

const newVendors = [
  {
    brokerName: "SRI BALAJI TRANSPORT",
    address: "Salem, Tamil Nadu",
    contactPerson: "Balaji V.",
    mobileNumber: "9988771122",
    whatsappNumber: "9988771122",
    panCard: "BALAJ1234T",
    aadharCard: "123456781234",
    gstNumber: "33BALAJ1234T1Z",
    accountNumber: "1234567890",
    bankName: "HDFC Bank",
    branch: "Salem Main",
    ifsc: "HDFC0001234",
    active: true,
  },
  {
    brokerName: "KONGU LOGISTICS",
    address: "Coimbatore, Tamil Nadu",
    contactPerson: "Karthik R.",
    mobileNumber: "8877665544",
    whatsappNumber: "8877665544",
    panCard: "KONGU5678L",
    aadharCard: "987654329876",
    gstNumber: "33KONGU5678L1Z",
    accountNumber: "0987654321",
    bankName: "ICICI Bank",
    branch: "Coimbatore South",
    ifsc: "ICIC0005678",
    active: true,
  },
  {
    brokerName: "NATIONAL CARRIERS",
    address: "Madurai, Tamil Nadu",
    contactPerson: "Muthu K.",
    mobileNumber: "7766554433",
    whatsappNumber: "7766554433",
    panCard: "NATIO9012C",
    aadharCard: "112233445566",
    gstNumber: "33NATIO9012C1Z",
    accountNumber: "1122334455",
    bankName: "State Bank of India",
    branch: "Madurai Central",
    ifsc: "SBIN0009012",
    active: true,
  }
];

async function postData(endpoint, data) {
  return new Promise((resolve, reject) => {
    const dataStr = JSON.stringify(data);
    const req = http.request(
      `${API_BASE}/${endpoint}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(dataStr),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => resolve({ status: res.statusCode, body }));
      },
    );
    req.on("error", reject);
    req.write(dataStr);
    req.end();
  });
}

async function run() {
  console.log("Adding Companies...");
  for (const comp of newCompanies) {
    try {
      const res = await postData("companies", comp);
      console.log(`Added Company: ${comp.consigneeName} -> ${res.status}`);
    } catch(e) { console.error(e); }
  }

  console.log("\nAdding Vendors (Brokers)...");
  for (const vend of newVendors) {
    try {
      const res = await postData("brokers", vend); // Vendors are brokers in this app
      console.log(`Added Vendor: ${vend.brokerName} -> ${res.status}`);
    } catch(e) { console.error(e); }
  }
}

run();
