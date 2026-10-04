import PDFDocument from "pdfkit";

// Streams a landscape A4 certificate PDF directly to the HTTP response.
export function streamCertificate({ res, studentName, courseTitle, teacherName, completionDate }) {
  const doc = new PDFDocument({ layout: "landscape", size: "A4", margin: 0 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="certificate-${courseTitle.replace(/[^a-z0-9]/gi, "-")}.pdf"`);
  doc.pipe(res);

  const { width, height } = doc.page;

  // Border frame
  doc.rect(24, 24, width - 48, height - 48).lineWidth(2).stroke("#0E6E63");
  doc.rect(34, 34, width - 68, height - 68).lineWidth(1).stroke("#8C7FE0");

  doc
    .font("Helvetica-Bold")
    .fontSize(14)
    .fillColor("#8C7FE0")
    .text("STACKUP", 0, 80, { align: "center", characterSpacing: 3 });

  doc
    .font("Times-Bold")
    .fontSize(34)
    .fillColor("#12201D")
    .text("Certificate of Completion", 0, 130, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#12201D")
    .text("This is to certify that", 0, 210, { align: "center" });

  doc
    .font("Times-BoldItalic")
    .fontSize(28)
    .fillColor("#0E6E63")
    .text(studentName, 0, 240, { align: "center" });

  doc
    .font("Helvetica")
    .fontSize(14)
    .fillColor("#12201D")
    .text("has successfully completed the course", 0, 290, { align: "center" });

  doc
    .font("Times-Bold")
    .fontSize(22)
    .fillColor("#12201D")
    .text(courseTitle, 60, 320, { align: "center", width: width - 120 });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#555555")
    .text(`Instructor: ${teacherName}`, 0, height - 120, { align: "center" })
    .text(`Completed on ${completionDate}`, 0, height - 100, { align: "center" });

  doc.end();
}
