import * as XLSX from "xlsx";
import * as fs from "fs";

const ws = XLSX.utils.json_to_sheet([{ a: "-", b: 2 }]);
ws["A2"].s = { alignment: { horizontal: "center" } };
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
XLSX.writeFile(wb, "test.xlsx", { cellStyles: true });
console.log("Written test.xlsx");
