import XLSX from "xlsx-js-style";

/** Minimal client-side CSV export for master tables. */
export function exportToCsv(filename: string, columns: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [columns, ...rows].map((r) => r.map(escape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function formatDate(iso: string) {
  if (!iso) return "—";
  try {
    const parts = iso.split("-");
    
    // Fast path: handle YYYY-MM-DD directly
    if (parts.length === 3 && parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    
    // If it's already DD-MM-YYYY, return as is
    if (parts.length === 3 && parts[2].length === 4 && parts[0].length <= 2) {
      return iso;
    }

    // Fallback for other formats (like ISO 8601 timestamps)
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  } catch {
    return iso;
  }
}

/** Robust Excel export using xlsx library. */
export function exportToExcel(filename: string, data: any[], sheetName = "Sheet1") {
  // Replace empty values with "-"
  const processedData = data.map((row) => {
    const newRow: any = {};
    for (const key in row) {
      let val = row[key];
      if (val === null || val === undefined || String(val).trim() === "") {
        val = "-";
      }
      newRow[key] = val;
    }
    return newRow;
  });

  // Create a new workbook
  const wb = XLSX.utils.book_new();

  // Convert JSON to worksheet
  const ws = XLSX.utils.json_to_sheet(processedData);

  // Center align cells with "-"
  const range = XLSX.utils.decode_range(ws["!ref"] || "A1");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = { c: C, r: R };
      const cellRef = XLSX.utils.encode_cell(cellAddress);
      const cell = ws[cellRef];
      if (cell && cell.v === "-") {
        cell.s = { alignment: { horizontal: "center", vertical: "center" } };
      }
    }
  }

  // Auto-size columns based on content
  const colWidths = [];
  const keys = Object.keys(data[0] || {});

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    let max = key.length;
    for (let j = 0; j < processedData.length; j++) {
      const val = processedData[j][key];
      if (val !== null && val !== undefined) {
        const len = String(val).length;
        if (len > max) max = len;
      }
    }
    // Set a reasonable max width
    colWidths.push({ wch: Math.min(Math.max(max, 10), 100) });
  }

  ws["!cols"] = colWidths;

  // Append worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate and download Excel file
  XLSX.writeFile(wb, filename);
}
