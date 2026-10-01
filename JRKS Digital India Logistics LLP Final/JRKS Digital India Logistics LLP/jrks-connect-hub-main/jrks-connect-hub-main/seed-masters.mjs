import http from "http";

const API_BASE = "http://localhost:3047/api";

const mockData = {
  trucks: {
    vehicleNumber: "TN 99 XX 9999",
    ownerName: "Mock Truck Owner",
    address: "Mock Address, Chennai",
    mobileNumber: "9876543210",
    panCard: "MOCKT1234K",
    vehicleType: "Lorry",
    engineNumber: "ENG9999XX",
    chassisNumber: "CHS9999XX",
    nationalPermit: { number: "NP-MOCK-1", validUpto: "2027-12-31" },
    insurance: { number: "INS-MOCK-1", validUpto: "2027-12-31" },
    pollution: { number: "PUC-MOCK-1", validUpto: "2027-12-31" },
    taxReceipt: { number: "TAX-MOCK-1", validUpto: "2027-12-31" },
    fitness: { number: "FIT-MOCK-1", validUpto: "2027-12-31" },
  },
  companies: {
    consigneeName: "Mock Company Ltd.",
    address: "100 Mock Street, Bangalore",
    contactPerson: "Mr. Mock",
    mobileNumber: "9988776655",
    gstNumber: "29MOCKC1234D1Z5",
    billingParty: "Consignee",
    active: true,
  },
  banks: {
    accountHolder: "Mock Account Holder",
    accountNumber: "12345678901234",
    accountType: "Current",
    bankName: "Mock Bank",
    branch: "Mock Branch",
    ifsc: "MOCK0001234",
    mobileNumber: "9123456789",
    active: true,
  },
  brokers: {
    brokerName: "Mock Broker Agency",
    address: "200 Mock Avenue, Mumbai",
    contactPerson: "Mrs. Mock Broker",
    mobileNumber: "9876543211",
    whatsappNumber: "9876543211",
    panCard: "MOCKB5678L",
    aadharCard: "123456789012",
    gstNumber: "27MOCKB5678L1Z9",
    accountNumber: "98765432109876",
    bankName: "Mock Broker Bank",
    branch: "Mock Broker Branch",
    ifsc: "MBBK0005678",
    active: true,
  },
  drivers: {
    driverName: "Mock Driver",
    driverMobile: "9988776611",
  },
};

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
  for (const [key, value] of Object.entries(mockData)) {
    try {
      console.log(`Adding mock data for ${key}...`);
      const res = await postData(key, value);
      console.log(`Response for ${key}: ${res.status} - ${res.body}`);
    } catch (e) {
      console.error(`Failed to add mock data for ${key}:`, e);
    }
  }
}

run();
