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
// Landscape; each column is sized to its longest word/value (long free text
// is capped and wraps at spaces) so headers and values never break mid-word.
// If the columns need more than A4 landscape, the page widens to fit.
export function exportToPDF(filename, title, headers, rows) {
  const FONT = 8;
  const PAD = 3;
  const MARGIN = 14;
  const MAX_COL = 70; // mm, cap for long free-text columns
  const cellText = (c) => (c === null || c === undefined ? "" : String(c));

  const measure = new jsPDF({ orientation: "landscape" });
  measure.setFontSize(FONT);
  const colWidths = headers.map((h, i) => {
    measure.setFont("helvetica", "bold");
    let w = measure.getTextWidth(cellText(h));
    measure.setFont("helvetica", "normal");
    rows.forEach((r) => {
      const text = cellText(r[i]);
      // Unbroken width for short values; for long text, the longest single word.
      const full = measure.getTextWidth(text);
      const widest = full <= MAX_COL - 2 * PAD
        ? full
        : Math.max(...text.split(/\s+/).map((word) => measure.getTextWidth(word)), MAX_COL - 2 * PAD);
      w = Math.max(w, widest);
    });
    return Math.ceil(w + 2 * PAD + 1);
  });

  const tableWidth = colWidths.reduce((a, b) => a + b, 0);
  const a4Landscape = 297;
  const pageWidth = Math.max(a4Landscape, tableWidth + 2 * MARGIN);
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: [pageWidth, 210] });

  doc.setFontSize(14);
  doc.text(title, MARGIN, 16);
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated ${new Date().toLocaleString()}`, MARGIN, 22);

  const columnStyles = {};
  colWidths.forEach((w, i) => { columnStyles[i] = { cellWidth: w }; });

  autoTable(doc, {
    head: [headers],
    body: rows.map((r) => r.map(cellText)),
    startY: 28,
    margin: { left: MARGIN, right: MARGIN },
    tableWidth: "wrap",
    styles: { fontSize: FONT, cellPadding: PAD, overflow: "linebreak" },
    headStyles: { fillColor: [29, 42, 68] }, // matches the dashboard's navy
    columnStyles,
  });

  doc.save(`${filename}.pdf`);
}
