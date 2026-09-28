import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Downloads a CSV file (opens directly in Excel/Sheets) built from a
// simple array-of-arrays table, with the first row as headers.
export function exportToCSV(filename, headers, rows) {
  const escapeCell = (cell) => {
    const str = String(cell ?? "");
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(","));
  const csvContent = lines.join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Downloads a PDF file with a title and a formatted table.
export function exportToPDF(filename, title, headers, rows) {
  const doc = new jsPDF();
  doc.setFontSize(14);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 22);

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 28,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [29, 42, 68] }, // matches the dashboard's navy
  });

  doc.save(`${filename}.pdf`);
}
