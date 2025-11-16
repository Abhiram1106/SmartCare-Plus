// Professional PDF Generator for Prescriptions and Receipts

export const generatePrescriptionPDF = (prescription) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Prescription - ${prescription.prescriptionNumber}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          border: 2px solid #2563eb;
          padding: 30px;
          position: relative;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          color: rgba(37, 99, 235, 0.05);
          font-weight: bold;
          z-index: 0;
          pointer-events: none;
        }
        
        .content {
          position: relative;
          z-index: 1;
        }
        
        .header {
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: start;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 15px;
        }
        
        .logo-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 28px;
          font-weight: bold;
        }
        
        .logo-text h1 {
          color: #2563eb;
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .logo-text p {
          color: #64748b;
          font-size: 12px;
        }
        
        .prescription-label {
          text-align: right;
        }
        
        .prescription-label h2 {
          color: #2563eb;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .prescription-label p {
          color: #64748b;
          font-size: 14px;
        }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }
        
        .info-section {
          background: #f8fafc;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        
        .info-section h3 {
          color: #2563eb;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        
        .info-label {
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
        }
        
        .info-value {
          color: #1e293b;
          font-size: 13px;
          font-weight: 600;
          text-align: right;
        }
        
        .diagnosis-section {
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .diagnosis-section h3 {
          color: #f59e0b;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .diagnosis-section p {
          color: #92400e;
          font-size: 14px;
          line-height: 1.8;
        }
        
        .medications-section {
          margin-bottom: 30px;
        }
        
        .medications-section h3 {
          color: #2563eb;
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .medication-card {
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        
        .medication-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 15px;
          padding-bottom: 15px;
          border-bottom: 2px solid #f1f5f9;
        }
        
        .medication-name {
          color: #1e293b;
          font-size: 18px;
          font-weight: 700;
        }
        
        .medication-badge {
          background: #dbeafe;
          color: #1e40af;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .medication-details {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .detail-item {
          text-align: center;
          padding: 10px;
          background: #f8fafc;
          border-radius: 6px;
        }
        
        .detail-label {
          color: #64748b;
          font-size: 11px;
          font-weight: 500;
          text-transform: uppercase;
          margin-bottom: 5px;
          letter-spacing: 0.5px;
        }
        
        .detail-value {
          color: #1e293b;
          font-size: 14px;
          font-weight: 700;
        }
        
        .medication-instructions {
          background: #f0fdf4;
          border-left: 3px solid #22c55e;
          padding: 12px;
          border-radius: 4px;
          margin-top: 12px;
        }
        
        .medication-instructions p {
          color: #15803d;
          font-size: 13px;
          line-height: 1.6;
        }
        
        .notes-section {
          background: #fef2f2;
          border-left: 4px solid #ef4444;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        
        .notes-section h3 {
          color: #ef4444;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 10px;
        }
        
        .notes-section p {
          color: #991b1b;
          font-size: 13px;
          line-height: 1.8;
        }
        
        .signature-section {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          padding-top: 30px;
          border-top: 2px solid #e2e8f0;
        }
        
        .signature-box {
          text-align: center;
          min-width: 200px;
        }
        
        .signature-line {
          border-top: 2px solid #1e293b;
          margin-bottom: 10px;
          padding-top: 50px;
        }
        
        .signature-label {
          color: #64748b;
          font-size: 12px;
          font-weight: 500;
        }
        
        .signature-name {
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
          margin-top: 5px;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 2px solid #2563eb;
          text-align: center;
          color: #64748b;
          font-size: 11px;
        }
        
        .footer p {
          margin-bottom: 5px;
        }
        
        .validity-badge {
          display: inline-block;
          background: #dcfce7;
          color: #166534;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          margin-top: 15px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .container {
            border: none;
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">SmartCare+</div>
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">S+</div>
              <div class="logo-text">
                <h1>SmartCare+</h1>
                <p>Digital Healthcare Platform</p>
              </div>
            </div>
            <div class="prescription-label">
              <h2>℞</h2>
              <p><strong>Prescription No:</strong> ${prescription.prescriptionNumber}</p>
              <p>${new Date(prescription.dateIssued).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          
          <!-- Patient and Doctor Info -->
          <div class="info-grid">
            <div class="info-section">
              <h3>👤 Patient Information</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">${prescription.patient?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Age:</span>
                <span class="info-value">${prescription.patient?.age || 'N/A'} years</span>
              </div>
              <div class="info-row">
                <span class="info-label">Gender:</span>
                <span class="info-value">${prescription.patient?.gender || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">${prescription.patient?.phone || 'N/A'}</span>
              </div>
            </div>
            
            <div class="info-section">
              <h3>👨‍⚕️ Doctor Information</h3>
              <div class="info-row">
                <span class="info-label">Name:</span>
                <span class="info-value">Dr. ${prescription.doctor?.name || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Specialization:</span>
                <span class="info-value">${prescription.doctor?.specialization || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">License No:</span>
                <span class="info-value">${prescription.doctor?.licenseNumber || 'N/A'}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Contact:</span>
                <span class="info-value">${prescription.doctor?.phone || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <!-- Diagnosis -->
          <div class="diagnosis-section">
            <h3>🔍 Diagnosis</h3>
            <p>${prescription.diagnosis || 'No diagnosis provided'}</p>
          </div>
          
          <!-- Medications -->
          <div class="medications-section">
            <h3>💊 Prescribed Medications</h3>
            ${prescription.medications?.map((med, index) => `
              <div class="medication-card">
                <div class="medication-header">
                  <div class="medication-name">${index + 1}. ${med.name}</div>
                  <div class="medication-badge">${med.type || 'Medication'}</div>
                </div>
                <div class="medication-details">
                  <div class="detail-item">
                    <div class="detail-label">Dosage</div>
                    <div class="detail-value">${med.dosage}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Frequency</div>
                    <div class="detail-value">${med.frequency}</div>
                  </div>
                  <div class="detail-item">
                    <div class="detail-label">Duration</div>
                    <div class="detail-value">${med.duration}</div>
                  </div>
                </div>
                ${med.instructions ? `
                  <div class="medication-instructions">
                    <p><strong>Instructions:</strong> ${med.instructions}</p>
                  </div>
                ` : ''}
              </div>
            `).join('') || '<p>No medications prescribed</p>'}
          </div>
          
          <!-- Additional Notes -->
          ${prescription.notes ? `
            <div class="notes-section">
              <h3>⚠️ Important Notes</h3>
              <p>${prescription.notes}</p>
            </div>
          ` : ''}
          
          <!-- Follow-up -->
          ${prescription.followUpDate ? `
            <div class="info-section" style="margin-bottom: 30px;">
              <h3>📅 Follow-up</h3>
              <div class="info-row">
                <span class="info-label">Next Visit:</span>
                <span class="info-value">${new Date(prescription.followUpDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          ` : ''}
          
          <!-- Signature -->
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Patient Signature</div>
              <div class="signature-name">${prescription.patient?.name || ''}</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div class="signature-label">Doctor Signature</div>
              <div class="signature-name">Dr. ${prescription.doctor?.name || ''}</div>
              <div style="margin-top: 10px; color: #2563eb; font-size: 12px; font-weight: 600;">
                ${prescription.doctor?.licenseNumber ? `Reg. No: ${prescription.doctor.licenseNumber}` : ''}
              </div>
            </div>
          </div>
          
          <!-- Validity Badge -->
          <div style="text-align: center;">
            <div class="validity-badge">
              ✓ Valid until: ${prescription.validUntil ? new Date(prescription.validUntil).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '30 days from issue date'}
            </div>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p><strong>SmartCare+ Digital Healthcare Platform</strong></p>
            <p>This is a digitally generated prescription. For verification, contact SmartCare+ support.</p>
            <p>📞 Support: 1-800-SMART-CARE | 📧 support@smartcareplus.com | 🌐 www.smartcareplus.com</p>
            <p style="margin-top: 10px; font-size: 10px;">Generated on: ${new Date().toLocaleString('en-US')}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

export const generatePaymentReceiptPDF = (payment) => {
  const printWindow = window.open('', '_blank');
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${payment.transactionId}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 40px;
          background: white;
          color: #333;
          line-height: 1.6;
        }
        
        .container {
          max-width: 700px;
          margin: 0 auto;
          border: 2px solid #10b981;
          padding: 40px;
          position: relative;
        }
        
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 100px;
          color: rgba(16, 185, 129, 0.05);
          font-weight: bold;
          z-index: 0;
          pointer-events: none;
        }
        
        .content {
          position: relative;
          z-index: 1;
        }
        
        .receipt-badge {
          position: absolute;
          top: 30px;
          right: 30px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 15px 30px;
          border-radius: 30px;
          font-size: 20px;
          font-weight: bold;
          box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
        }
        
        .header {
          text-align: center;
          border-bottom: 3px solid #10b981;
          padding-bottom: 25px;
          margin-bottom: 35px;
        }
        
        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .logo-icon {
          width: 70px;
          height: 70px;
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          border-radius: 15px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 32px;
          font-weight: bold;
        }
        
        .logo-text h1 {
          color: #10b981;
          font-size: 32px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .logo-text p {
          color: #64748b;
          font-size: 13px;
        }
        
        .receipt-title {
          color: #10b981;
          font-size: 36px;
          font-weight: bold;
          margin: 20px 0 10px;
          text-transform: uppercase;
          letter-spacing: 2px;
        }
        
        .receipt-subtitle {
          color: #64748b;
          font-size: 14px;
        }
        
        .transaction-info {
          background: #f0fdf4;
          border: 2px dashed #10b981;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .transaction-info .label {
          color: #059669;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        
        .transaction-info .value {
          color: #065f46;
          font-size: 20px;
          font-weight: bold;
          font-family: monospace;
        }
        
        .info-section {
          margin-bottom: 30px;
        }
        
        .info-section h3 {
          color: #10b981;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 15px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 2px solid #d1fae5;
          padding-bottom: 8px;
        }
        
        .info-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .info-table tr {
          border-bottom: 1px solid #e2e8f0;
        }
        
        .info-table tr:last-child {
          border-bottom: none;
        }
        
        .info-table td {
          padding: 12px 0;
        }
        
        .info-table .label {
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          width: 40%;
        }
        
        .info-table .value {
          color: #1e293b;
          font-size: 14px;
          font-weight: 600;
          text-align: right;
        }
        
        .amount-section {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 12px;
          padding: 25px;
          margin: 30px 0;
          text-align: center;
        }
        
        .amount-section .label {
          font-size: 14px;
          font-weight: 500;
          margin-bottom: 10px;
          opacity: 0.9;
        }
        
        .amount-section .amount {
          font-size: 48px;
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .amount-section .words {
          font-size: 13px;
          font-weight: 500;
          opacity: 0.9;
          font-style: italic;
        }
        
        .payment-details {
          background: #f8fafc;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .status-badge {
          display: inline-block;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 600;
          text-transform: uppercase;
        }
        
        .status-success {
          background: #d1fae5;
          color: #065f46;
        }
        
        .status-pending {
          background: #fef3c7;
          color: #92400e;
        }
        
        .status-failed {
          background: #fee2e2;
          color: #991b1b;
        }
        
        .footer {
          margin-top: 50px;
          padding-top: 25px;
          border-top: 2px solid #10b981;
          text-align: center;
        }
        
        .footer-message {
          background: #d1fae5;
          color: #065f46;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          font-weight: 600;
        }
        
        .footer-info {
          color: #64748b;
          font-size: 11px;
          line-height: 1.8;
        }
        
        .footer-info p {
          margin-bottom: 5px;
        }
        
        .qr-placeholder {
          width: 100px;
          height: 100px;
          background: #f1f5f9;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          margin: 20px auto;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 12px;
        }
        
        @media print {
          body {
            padding: 0;
          }
          
          .container {
            border: none;
            page-break-inside: avoid;
          }
          
          .no-print {
            display: none;
          }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="watermark">PAID</div>
        <div class="receipt-badge">✓ PAID</div>
        
        <div class="content">
          <!-- Header -->
          <div class="header">
            <div class="logo">
              <div class="logo-icon">S+</div>
              <div class="logo-text">
                <h1>SmartCare+</h1>
                <p>Digital Healthcare Platform</p>
              </div>
            </div>
            <h2 class="receipt-title">Payment Receipt</h2>
            <p class="receipt-subtitle">Official Transaction Receipt</p>
          </div>
          
          <!-- Transaction ID -->
          <div class="transaction-info">
            <div class="label">Transaction ID</div>
            <div class="value">${payment.transactionId}</div>
          </div>
          
          <!-- Amount Section -->
          <div class="amount-section">
            <div class="label">AMOUNT PAID</div>
            <div class="amount">$${payment.amount?.toFixed(2)}</div>
            <div class="words">${numberToWords(payment.amount)} Dollars Only</div>
          </div>
          
          <!-- Payment Details -->
          <div class="payment-details">
            <h3>💳 Payment Information</h3>
            <table class="info-table">
              <tr>
                <td class="label">Payment Date:</td>
                <td class="value">${new Date(payment.paymentDate || payment.createdAt).toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
              <tr>
                <td class="label">Payment Method:</td>
                <td class="value">${payment.paymentMethod || 'Credit Card'}</td>
              </tr>
              <tr>
                <td class="label">Payment Status:</td>
                <td class="value">
                  <span class="status-badge status-${payment.status === 'completed' ? 'success' : payment.status === 'pending' ? 'pending' : 'failed'}">
                    ${payment.status || 'Completed'}
                  </span>
                </td>
              </tr>
              ${payment.paymentGateway ? `
                <tr>
                  <td class="label">Payment Gateway:</td>
                  <td class="value">${payment.paymentGateway}</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- Appointment Details -->
          <div class="info-section">
            <h3>📋 Appointment Details</h3>
            <table class="info-table">
              <tr>
                <td class="label">Appointment ID:</td>
                <td class="value">${payment.appointment?._id || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Appointment Date:</td>
                <td class="value">${payment.appointment?.appointmentDate ? new Date(payment.appointment.appointmentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Doctor Name:</td>
                <td class="value">Dr. ${payment.appointment?.doctor?.name || payment.doctor?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Specialization:</td>
                <td class="value">${payment.appointment?.doctor?.specialization || payment.doctor?.specialization || 'N/A'}</td>
              </tr>
            </table>
          </div>
          
          <!-- Patient Details -->
          <div class="info-section">
            <h3>👤 Patient Information</h3>
            <table class="info-table">
              <tr>
                <td class="label">Patient Name:</td>
                <td class="value">${payment.patient?.name || 'N/A'}</td>
              </tr>
              <tr>
                <td class="label">Patient ID:</td>
                <td class="value">${payment.patient?._id || 'N/A'}</td>
              </tr>
              ${payment.patient?.email ? `
                <tr>
                  <td class="label">Email:</td>
                  <td class="value">${payment.patient.email}</td>
                </tr>
              ` : ''}
              ${payment.patient?.phone ? `
                <tr>
                  <td class="label">Phone:</td>
                  <td class="value">${payment.patient.phone}</td>
                </tr>
              ` : ''}
            </table>
          </div>
          
          <!-- QR Code Placeholder -->
          <div class="qr-placeholder">
            QR Code
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <div class="footer-message">
              ✓ Thank you for choosing SmartCare+. Your payment has been successfully processed.
            </div>
            
            <div class="footer-info">
              <p><strong>SmartCare+ Digital Healthcare Platform</strong></p>
              <p>This is a computer-generated receipt and does not require a signature.</p>
              <p>For any queries, please contact our support team.</p>
              <p>📞 Support: 1-800-SMART-CARE | 📧 billing@smartcareplus.com | 🌐 www.smartcareplus.com</p>
              <p style="margin-top: 15px; font-size: 10px;">Receipt generated on: ${new Date().toLocaleString('en-US')}</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Helper function to convert number to words
function numberToWords(num) {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  
  const convert = (n) => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
    return '';
  };
  
  const dollars = Math.floor(num);
  const cents = Math.round((num - dollars) * 100);
  
  let result = convert(dollars);
  if (cents > 0) {
    result += ' and ' + cents + '/100';
  }
  
  return result;
}
