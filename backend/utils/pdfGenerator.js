const PDFDocument = require('pdfkit');

/**
 * Generate a professional payment receipt PDF
 */
function generateReceiptPDF(receiptData) {
  return new Promise((resolve, reject) => {
    try {
      // Create a new PDF document
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      // Collect PDF data in buffers
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });
      doc.on('error', reject);

      // Modern Color Palette
      const primaryColor = '#1e40af'; // Deep Blue
      const secondaryColor = '#475569'; // Slate Gray
      const accentColor = '#059669'; // Emerald Green
      const lightBg = '#f1f5f9'; // Light Slate
      const borderColor = '#cbd5e1'; // Border Gray

      // ==================== HEADER SECTION ====================
      // Top accent bar
      doc.rect(0, 0, doc.page.width, 8).fill(primaryColor);
      
      // Header background with gradient effect (simulated with overlapping rectangles)
      doc.rect(0, 8, doc.page.width, 140).fill('#ffffff');
      doc.rect(0, 8, doc.page.width, 140).strokeColor(borderColor).stroke();
      
      // Company Logo Area (circular background)
      doc.circle(70, 60, 35).fill(primaryColor);
      doc.fillColor('#ffffff')
         .fontSize(24)
         .font('Helvetica-Bold')
         .text('SC+', 45, 48);
      
      // Company Name and Details
      doc.fillColor(primaryColor)
         .fontSize(32)
         .font('Helvetica-Bold')
         .text('SmartCare+', 120, 35);
      
      doc.fillColor(secondaryColor)
         .fontSize(11)
         .font('Helvetica')
         .text('Medical Center', 120, 70);
      
      doc.fontSize(9)
         .fillColor(secondaryColor)
         .text(`📍 ${receiptData.clinicDetails.address}`, 120, 90)
         .text(`📞 ${receiptData.clinicDetails.phone}`, 120, 105)
         .text(`✉️  ${receiptData.clinicDetails.email}`, 120, 120);

      // Receipt Title Box (Right Side)
      const receiptBoxX = doc.page.width - 200;
      doc.roundedRect(receiptBoxX, 25, 180, 110, 5)
         .fill(lightBg);
      
      doc.fillColor(primaryColor)
         .fontSize(22)
         .font('Helvetica-Bold')
         .text('RECEIPT', receiptBoxX + 10, 35, { width: 160, align: 'center' });
      
      // Receipt Number with background
      doc.roundedRect(receiptBoxX + 10, 65, 160, 25, 3)
         .fill('#ffffff')
         .stroke();
      
      doc.fillColor(secondaryColor)
         .fontSize(10)
         .font('Helvetica')
         .text('Receipt No.', receiptBoxX + 10, 70, { width: 160, align: 'center' });
      
      doc.fillColor(primaryColor)
         .fontSize(14)
         .font('Helvetica-Bold')
         .text(receiptData.receiptNumber, receiptBoxX + 10, 80, { width: 160, align: 'center' });
      
      // Date
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text(`Date: ${new Date(receiptData.paymentDetails.paymentDate).toLocaleDateString('en-US', {
           year: 'numeric',
           month: 'short',
           day: 'numeric'
         })}`, receiptBoxX + 10, 105, { width: 160, align: 'center' });

      // Divider Line
      doc.strokeColor(primaryColor)
         .lineWidth(2)
         .moveTo(50, 145)
         .lineTo(doc.page.width - 50, 145)
         .stroke();

      let yPosition = 170;

      // ==================== PATIENT INFORMATION SECTION ====================
      // Section Header with background
      doc.roundedRect(50, yPosition, doc.page.width - 100, 30, 5)
         .fill(primaryColor);
      
      doc.fillColor('#ffffff')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PATIENT INFORMATION', 60, yPosition + 9);
      
      yPosition += 40;
      
      // Patient details in a card-like box
      doc.roundedRect(50, yPosition, doc.page.width - 100, 90, 5)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();
      
      yPosition += 15;
      
      // Patient Name
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Patient Name:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(receiptData.patient.name, 200, yPosition);
      
      yPosition += 25;
      
      // Email
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Email Address:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica')
         .text(receiptData.patient.email, 200, yPosition);
      
      yPosition += 25;
      
      // Phone
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Phone Number:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica')
         .text(receiptData.patient.phone, 200, yPosition);

      yPosition += 45;

      // ==================== APPOINTMENT DETAILS SECTION ====================
      // Section Header
      doc.roundedRect(50, yPosition, doc.page.width - 100, 30, 5)
         .fill(primaryColor);
      
      doc.fillColor('#ffffff')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('APPOINTMENT DETAILS', 60, yPosition + 9);
      
      yPosition += 40;
      
      // Appointment details card
      doc.roundedRect(50, yPosition, doc.page.width - 100, 115, 5)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();
      
      yPosition += 15;
      
      // Doctor Name
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Consulting Doctor:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(receiptData.appointmentDetails.doctor, 200, yPosition);
      
      yPosition += 25;
      
      // Specialization
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Specialization:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica')
         .text(receiptData.appointmentDetails.specialization, 200, yPosition);
      
      yPosition += 25;
      
      // Appointment Date
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Appointment Date:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica')
         .text(new Date(receiptData.appointmentDetails.date).toLocaleDateString('en-US', {
           weekday: 'long',
           year: 'numeric',
           month: 'long',
           day: 'numeric'
         }), 200, yPosition);
      
      yPosition += 25;
      
      // Time Slot
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Time Slot:', 70, yPosition);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica')
         .text(receiptData.appointmentDetails.timeSlot, 200, yPosition);

      yPosition += 45;

      // ==================== PAYMENT BREAKDOWN SECTION ====================
      // Section Header
      doc.roundedRect(50, yPosition, doc.page.width - 100, 30, 5)
         .fill(primaryColor);
      
      doc.fillColor('#ffffff')
         .fontSize(14)
         .font('Helvetica-Bold')
         .text('PAYMENT BREAKDOWN', 60, yPosition + 9);
      
      yPosition += 40;

      // Professional Table with alternating rows
      const tableTop = yPosition;
      const tableLeft = 50;
      const tableWidth = doc.page.width - 100;
      const col1Width = tableWidth * 0.6;
      const col2Width = tableWidth * 0.4;

      // Table Header with gradient-like effect
      doc.rect(tableLeft, tableTop, tableWidth, 35).fill(lightBg);
      
      doc.fillColor(primaryColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text('DESCRIPTION', tableLeft + 15, tableTop + 12)
         .text('AMOUNT', tableLeft + col1Width + 15, tableTop + 12);

      yPosition = tableTop + 35;

      // Service Description Row
      doc.rect(tableLeft, yPosition, tableWidth, 35).fillAndStroke('#ffffff', borderColor);
      
      doc.fillColor('#1f2937')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Consultation Fee', tableLeft + 15, yPosition + 12);
      
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text(receiptData.appointmentDetails.specialization, tableLeft + 15, yPosition + 25);
      
      doc.fillColor('#1f2937')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(`$${receiptData.paymentDetails.amount.toFixed(2)}`, tableLeft + col1Width + 15, yPosition + 12);

      yPosition += 35;

      // Subtotal Row
      doc.rect(tableLeft, yPosition, tableWidth, 30).fill(lightBg);
      
      doc.fillColor(secondaryColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('Subtotal:', tableLeft + 15, yPosition + 10);
      
      doc.fillColor('#1f2937')
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(`$${receiptData.paymentDetails.amount.toFixed(2)}`, tableLeft + col1Width + 15, yPosition + 10);

      yPosition += 30;

      // Total Amount Row (Highlighted)
      doc.roundedRect(tableLeft, yPosition, tableWidth, 40, 5)
         .fill(accentColor);
      
      doc.fillColor('#ffffff')
         .fontSize(13)
         .font('Helvetica-Bold')
         .text('TOTAL AMOUNT PAID', tableLeft + 15, yPosition + 13);
      
      doc.fontSize(16)
         .font('Helvetica-Bold')
         .text(`$${receiptData.paymentDetails.amount.toFixed(2)}`, tableLeft + col1Width + 15, yPosition + 13);

      yPosition += 55;

      // ==================== TRANSACTION DETAILS ====================
      // Transaction Info Box
      doc.roundedRect(50, yPosition, (doc.page.width - 100) / 2 - 10, 80, 5)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();
      
      doc.roundedRect(50 + (doc.page.width - 100) / 2 + 10, yPosition, (doc.page.width - 100) / 2 - 10, 80, 5)
         .strokeColor(borderColor)
         .lineWidth(1)
         .stroke();
      
      // Payment Method
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Payment Method', 65, yPosition + 15);
      
      doc.fillColor('#1f2937')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text(receiptData.paymentDetails.method.toUpperCase(), 65, yPosition + 35);
      
      // Transaction ID
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Transaction ID', 65 + (doc.page.width - 100) / 2 + 10, yPosition + 15);
      
      doc.fillColor('#1f2937')
         .fontSize(10)
         .font('Helvetica-Bold')
         .text(receiptData.paymentDetails.transactionId, 65 + (doc.page.width - 100) / 2 + 10, yPosition + 35, {
        width: (doc.page.width - 100) / 2 - 30
      });
      
      // Payment Status Badge
      const statusBadgeColor = receiptData.paymentDetails.status === 'completed' ? accentColor : '#ef4444';
      doc.roundedRect(65, yPosition + 55, 80, 18, 9)
         .fill(statusBadgeColor);
      
      doc.fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(receiptData.paymentDetails.status.toUpperCase(), 65, yPosition + 59, {
        width: 80,
        align: 'center'
      });

      yPosition += 105;

      // ==================== FOOTER SECTION ====================
      // Terms & Conditions Box
      doc.roundedRect(50, yPosition, doc.page.width - 100, 75, 5)
         .fill(lightBg);
      
      doc.fillColor(primaryColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('TERMS & CONDITIONS', 60, yPosition + 12);
      
      doc.fillColor(secondaryColor)
         .fontSize(8)
         .font('Helvetica')
         .text('• This is a computer-generated receipt and does not require a physical signature.', 60, yPosition + 28)
         .text('• All payments are non-refundable unless otherwise stated in our cancellation policy.', 60, yPosition + 42)
         .text('• For queries or concerns, contact us at billing@smartcareplus.com or call +1-800-SMARTCARE', 60, yPosition + 56);

      yPosition += 90;

      // Signature Section
      doc.strokeColor(borderColor)
         .lineWidth(1)
         .moveTo(doc.page.width - 250, yPosition + 30)
         .lineTo(doc.page.width - 50, yPosition + 30)
         .stroke();
      
      doc.fillColor(secondaryColor)
         .fontSize(9)
         .font('Helvetica')
         .text('Authorized Signature', doc.page.width - 250, yPosition + 38);

      // Bottom bar with thank you message
      const bottomBarY = doc.page.height - 50;
      doc.rect(0, bottomBarY, doc.page.width, 50).fill(primaryColor);
      
      doc.fillColor('#ffffff')
         .fontSize(12)
         .font('Helvetica-Bold')
         .text('Thank You for Choosing SmartCare+', 0, bottomBarY + 12, {
        width: doc.page.width,
        align: 'center'
      });
      
      doc.fontSize(9)
         .font('Helvetica')
         .text('Your health is our priority | Available 24/7 for emergency care', 0, bottomBarY + 30, {
        width: doc.page.width,
        align: 'center'
      });

      // ==================== WATERMARK ====================
      // Professional PAID watermark in the center
      if (receiptData.paymentDetails.status === 'completed') {
        doc.save();
        
        // Position watermark in center
        doc.rotate(-45, { origin: [doc.page.width / 2, doc.page.height / 2] });
        
        // Outer stroke for depth
        doc.fontSize(120)
           .font('Helvetica-Bold')
           .fillOpacity(0.08)
           .fillColor(accentColor)
           .text('PAID', 0, doc.page.height / 2 - 60, {
             width: doc.page.width,
             align: 'center'
           });
        
        doc.restore();
      }

      // Finalize PDF
      doc.end();

    } catch (error) {
      reject(error);
    }
  });
}

module.exports = { generateReceiptPDF };
