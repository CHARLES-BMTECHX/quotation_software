import React from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import rupeeImg from "../assets/rupee.jpg";
import { fetchQuotation } from "../api/api";
import { IndianRupee } from "lucide-react";

export default function PDFDownloadButton({ id }) {
  const loadImage = (src) =>
    new Promise((resolve, reject) => {
      if (!src) return reject(new Error("No image"));
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load"));
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

      const storeName = data.storeName || "";
      const modelName = data.modelName || "Quotation";
      const validity = data.validity ?? "-";
      const date = data.date
        ? new Date(data.date).toLocaleDateString("en-GB")
        : new Date().toLocaleDateString("en-GB");
      const gstPercent = data.gstPercent ?? 0;
      const logoUrl = data.logo || null;

      const pdf = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const margin = 50;
      const gold = "#b68c28";
      const dark = "#222222";

      let imgElement = null;
      if (logoUrl) {
        try {
          imgElement = await loadImage(logoUrl);
        } catch (e) {
          console.warn("Logo load failed:", e);
        }
      }

      // === COVER PAGE (unchanged, beautiful) ===
      let y = 80;
      const centerX = pageWidth / 2;

      if (imgElement) {
        const imgSize = 120;
        const imgX = centerX - imgSize / 2;
        pdf.addImage(imgElement, "PNG", imgX, y, imgSize, imgSize);
        y += imgSize + 30;
      }

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(38);
      pdf.setTextColor(gold);
      pdf.text("RITHU ALERT EYE", centerX, y, { align: "center" });
      y += 45;

      pdf.setFontSize(36);
      pdf.text("CCTV SOLUTION", centerX, y, { align: "center" });
      y += 50;

      pdf.setFont("times", "italic");
      pdf.setFontSize(20);
      pdf.setTextColor(dark);
      pdf.text("“Your Safety, Our Priority.”", centerX, y, { align: "center" });
      y += 60;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(32);
      pdf.setTextColor(dark);
      // QUOTATION removed as per your comment

      pdf.setFontSize(16);
      pdf.setTextColor("#000");
      pdf.text("Quotation For:", centerX, y, { align: "center" });
      y += 28;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(20);
      pdf.text(modelName.toUpperCase(), centerX, y, { align: "center" });
      y += 50;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(14);
      pdf.text(`Date: ${date}`, centerX, y, { align: "center" });
      y += 28;
      pdf.text(`Validity: ${validity} Days`, centerX, y, { align: "center" });
      y += 60;

      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.setTextColor(gold);
      pdf.text("RITHU ALERT EYE CCTV SOLUTION", centerX, y, { align: "center" });
      y += 40;

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(13);
      pdf.setTextColor(dark);
      const address = [
        "No. 9, Villupuram Main Road, Kottaimeadu,",
        "Villianur, Puducherry – 605110",
        "Phone: 9790 034824",
      ];
      address.forEach((line) => {
        pdf.text(line, centerX, y, { align: "center" });
        y += 24;
      });

      // === SECOND PAGE ===
      pdf.addPage();
      y = 60;

      const titleStartX = imgElement ? margin + 75 : margin;

      // Logo
      if (imgElement) {
        pdf.addImage(imgElement, "PNG", margin, y, 60, 60);
      }

      // Title: Two lines, aligned to logo's right
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(24);
      pdf.setTextColor(gold);
      pdf.text("RITHU ALERT EYE", titleStartX, y + 20);
      pdf.setFontSize(22);
      pdf.text("CCTV SOLUTION", titleStartX, y + 45);

      y += 80;

      // Tagline
      pdf.setFont("times", "italic");
      pdf.setFontSize(11);
      pdf.setTextColor(dark);
      pdf.text("“Your Safety, Our Priority.”", titleStartX, y);
      y += 25;

      // Address
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(11);
      pdf.setTextColor("#000");
      pdf.text("No. 9, Villupuram Main Road, Kottaimeadu, Villianur,", titleStartX, y);
      y += 18;
      pdf.text("Puducherry – 605110", titleStartX, y);
      y += 18;
      pdf.text("Phone: 9790 034824", titleStartX, y);
      y += 40;

      // === Store Name (Gold) ===
      if (storeName) {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(14);
        pdf.setTextColor(gold);
        pdf.text(storeName, margin, y);
        y += 30;
      }

      // === Customer Info: Key (bold black), Value (normal) ===
      const addKV = (key, value, spacing = 22) => {
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(12);
        pdf.setTextColor("#000");
        pdf.text(`${key}:`, margin, y);

        pdf.setFont("helvetica", "normal");
        pdf.text(value, margin + 100, y);
        y += spacing;
      };

      addKV("Quotation For", modelName);
      addKV("Date", date);
      addKV("Validity", `${validity} Days`, 35);

      // === Table with GST ===
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

      const totalTaxable = items.reduce((s, it) => s + it.quantity * it.rate, 0);
      const totalGST = (totalTaxable * gstPercent) / 100;
      const grandTotal = totalTaxable + totalGST;

      autoTable(pdf, {
        startY: y,
        head: [["Description", "Qty", "Rate", "GST", "Amount"]],
        body: rows,
        headStyles: {
          fillColor: [182, 140, 40],
          textColor: 255,
          fontSize: 11,
          halign: "center",
        },
        bodyStyles: { fontSize: 10, halign: "center" },
        columnStyles: {
          0: { cellWidth: 220 },
          1: { cellWidth: 50 },
          2: { cellWidth: 70 },
          3: { cellWidth: 70 },
          4: { cellWidth: 80 },
        },
        theme: "grid",
        styles: { lineColor: [220, 220, 220], lineWidth: 0.5 },
        margin: { left: margin, right: margin },
      });

      const finalY = pdf.lastAutoTable.finalY + 30;
      const rightX = pageWidth - margin;
      let summaryY = finalY;

      const addSummary = (label, value, bold = false) => {
        pdf.setFont("helvetica", bold ? "bold" : "normal");
        pdf.setFontSize(11);
        pdf.text(label, rightX - 120, summaryY, { align: "right" });
        pdf.text(value, rightX, summaryY, { align: "right" });
        summaryY += 18;
      };

      addSummary("Subtotal:", formatINR(totalTaxable));
      addSummary(`GST (${gstPercent}%):`, formatINR(totalGST));
      addSummary("Grand Total:", formatINR(grandTotal), true);

      // Rupee icon
      try {
        const rupeeImgEl = await loadImage(rupeeImg);
        pdf.addImage(rupeeImgEl, "PNG", rightX - 135, summaryY - 25, 10, 10);
      } catch (e) {
        console.warn("Rupee icon failed:", e);
      }

      pdf.save(`${modelName.replace(/\s+/g, "_")}_Quotation.pdf`);
    } catch (err) {
      console.error("PDF Error:", err);
      alert("Failed to generate PDF.");
    }
  };

  return (
<button
  onClick={generatePDF}
  className="p-2 bg-yellow-600 cursor-pointer text-white rounded hover:bg-yellow-700 transition"
  title="Download PDF"
>
  <IndianRupee className="w-5 h-5" />
</button>
  );
}