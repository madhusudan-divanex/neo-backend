import PDFDocument from "pdfkit";


export const generateReportPDF = (appointment, tests, testReports,ptData,labData) => {
    const title = labData?.name || "Laboratory Test Report";
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const buffers = [];

    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    // ---- PDF CONTENT ----
    doc.fontSize(20).text(title, { align: "center" });
    doc.moveDown();

    doc.fontSize(12).text(`Patient: ${ptData.name}`);
    doc.text(`Appointment ID: ${appointment?.customId}`);
    doc.text(`Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown();

    doc.fontSize(16).text("Test Results", { underline: true });
    doc.moveDown();

    tests.forEach(test => {
    doc.fontSize(14).text(test.shortName);

    const report = testReports.find(r => r.testId?.toString() == test._id?.toString());
    if (report) {
        report.component.forEach(c => {
            const compName = test.component.find(t => t._id.toString() === c.cmpId.toString())?.name || "Unknown";
            // console.log(`${compName}: ${c.result} (${c.status})`)
            doc.fontSize(12).text(`${compName}: ${c.result} (${c.status?.toUpperCase()})`);
            
        });
        doc.fontSize(12).text(`Comment :${report.upload.comment})`);
    }

    doc.moveDown();
});


    doc.end();
  });
};

