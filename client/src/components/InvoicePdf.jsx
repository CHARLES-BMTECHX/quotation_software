import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import rupeeImg from "../assets/rupee.jpg";
import { fetchQuotation } from "../api/api";
import { FileDown } from "lucide-react";

export default function PDFDownloadButton({ id }) {
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      if (!src) return reject();
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });

  const formatINR = (num) => {
    const n = Number(num) || 0;
    return n.toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const generatePDF = async () => {
    try {
      const res = await fetchQuotation(id);
      const data = res?.data?.data || {};
      const items = Array.isArray(data.items) ? data.items : [];

      const storeName = data.storeName || "RITHU ALERT EYE CCTV SOLUTION";
      const modelName = data.modelName || "Customer";
      const validity = data.validity ?? "-";
      const date = data.date
        ? new Date(data.date).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB");
      const gstPercent = data.gstPercent ?? 0;
      const logoUrl = data.logo || null;

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 50;
      const gold = [182, 140, 40];
      const dark = "#1a1a1a";

      let y = 60;
      let imgElement = null;

      if (logoUrl) {
        try {
          imgElement = await loadImage(logoUrl);
        } catch (e) {
          console.warn("Logo failed:", e);
        }
      }

      // === HEADER - Gold Bar ===
      pdf.setFillColor(...gold);
      pdf.rect(0, 0, pageWidth, 110, "F");

      if (imgElement) {
        pdf.addImage(imgElement, "PNG", margin, 20, 70, 70);
      }

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(26);
      pdf.text("RITHU ALERT EYE", margin + (imgElement ? 85 : 0), 45);
      pdf.setFontSize(24);
      pdf.text("CCTV SOLUTION", margin + (imgElement ? 85 : 0), 75);

      pdf.setFont("times", "italic");
      pdf.setFontSize(14);
      pdf.text("“Your Safety, Our Priority.”", margin + (imgElement ? 85 : 0), 100);

      y = 130;

      // === ADDRESS & DATE ===
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      const address = [
        "No. 9, Villupuram Main Road, Kottaimeadu,",
        "Villianur, Puducherry – 605110",
        "Phone: 9790 034824",
      ];
      address.forEach((line, i) => {
        pdf.text(line, margin + (imgElement ? 85 : 0), y + i * 18);
      });

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.text(`Date: ${date}`, pageWidth - margin, y, { align: "right" });
      pdf.text(`Validity: ${validity} Days`, pageWidth - margin, y + 20, { align: "right" });

      y += 70;

      // === INVOICE TITLE ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(28);
      pdf.setTextColor(...gold);
      pdf.text("INVOICE", pageWidth / 2, y, { align: "center" });
      y += 35;

      // === CUSTOMER INFO ===
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(13);
      pdf.setTextColor("#000");
      pdf.text("Bill To:", margin, y);
      y += 22;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.text(modelName, margin, y);
      y += 22;

      if (storeName && storeName !== "RITHU ALERT EYE CCTV SOLUTION") {
        pdf.text(storeName, margin, y);
        y += 28;
      } else {
        y += 10;
      }

      // === TABLE ===
      const rows = items.map((it) => {
        const qty = Number(it.quantity) || 0;
        const rate = Number(it.rate) || 0;
        const taxable = qty * rate;
        const gst = (taxable * gstPercent) / 100;
        const amount = taxable + gst;
        return [
          it.productDescription || "-",
          qty,
          formatINR(rate),
          formatINR(gst),
          formatINR(amount),
        ];
      });

      const totalTaxable = items.reduce((s, it) => s + (it.quantity * it.rate), 0);
      const totalGST = (totalTaxable * gstPercent) / 100;
      const grandTotal = totalTaxable + totalGST;

      autoTable(pdf, {
        startY: y,
        head: [["Description", "Qty", "Rate (Rs.)", "GST (Rs.)", "Amount (Rs.)"]], // Clean headers
        body: rows,
        headStyles: {
          fillColor: gold,
          textColor: 255,
          fontSize: 12,
          fontStyle: "bold",
          halign: "center",
          cellPadding: 8,
        },
        bodyStyles: {
          fontSize: 11,
          cellPadding: 8,
        },
        columnStyles: {
          0: { cellWidth: 200, halign: "left" },
          1: { cellWidth: 60, halign: "center" },
          2: { cellWidth: 80, halign: "right" },
          3: { cellWidth: 80, halign: "right" },
          4: { cellWidth: 90, halign: "right" },
        },
        theme: "grid",
        styles: { lineColor: [180, 180, 180], lineWidth: 0.5 },
        margin: { left: margin, right: margin },
      });

      const finalY = pdf.lastAutoTable.finalY + 40;

      // === TOTAL SECTION - Clean Key:Value, No Artifacts ===
      const totalBoxY = finalY;
      const totalBoxHeight = 100;

      pdf.setFillColor(255, 255, 255);
      pdf.setDrawColor(...gold);
      pdf.setLineWidth(2);
      pdf.rect(margin, totalBoxY, pageWidth - 2 * margin, totalBoxHeight, "FD");

      let sumY = totalBoxY + 30;

      const addLine = (label, value, bold = false, size = 14) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(size);
        pdf.setTextColor("#000");

        // Label (left)
        pdf.text(label, margin + 25, sumY);

        // Value (right)
        pdf.text(value, pageWidth - margin - 25, sumY, { align: "right" });

        sumY += 26;
      };

      addLine("Subtotal:", `Rs.${formatINR(totalTaxable)}`, false, 14);
      addLine(`GST (${gstPercent}%):`, `Rs.${formatINR(totalGST)}`, false, 14);
      addLine("GRAND TOTAL:", `Rs.${formatINR(grandTotal)}`, true, 18);

      // Rupee icon next to Grand Total
    //   try {
    //     const rupee = await loadImage(rupeeImg);
    //     pdf.addImage(rupee, "PNG", pageWidth - margin - 115, totalBoxY + 65, 16, 16);
    //   } catch (e) {}

      // === FOOTER ===
      pdf.setFont("helvetica", "italic");
      pdf.setFontSize(11);
      pdf.setTextColor("#555");
      pdf.text("Thank you for choosing RITHU ALERT EYE CCTV SOLUTION!", pageWidth / 2, pageHeight - 40, { align: "center" });

      pdf.save(`${modelName.replace(/\s+/g, "_")}_Invoice.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate invoice.");
    }
  };

  return (
    <button
      onClick={generatePDF}
      className="p-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition shadow-sm cursor-pointer"
      title="Download Invoice"
    >
      <FileDown className="w-5 h-5" />
    </button>
  );
}