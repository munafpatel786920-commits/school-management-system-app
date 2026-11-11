'use client'

import type { Student, School, ExamSchedule, SubscriptionPlan } from '@/lib/types'
import { getRegionLabels, formatMoney } from '@/lib/utils'

/**
 * Global Document Templates Engine with Elite School Branding
 */

const formatDate = (dateStr: string, locale: string = 'en-US') => {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  } catch (e) {
    return dateStr
  }
}

const calculateGrade = (percent: number): string => {
    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B+';
    if (percent >= 60) return 'B';
    if (percent >= 50) return 'C';
    if (percent >= 35) return 'D';
    return 'F';
}

const getStyles = () => `
  <style>
    @media print {
      @page { size: A4 portrait; margin: 1cm; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; color: #333; background: #fff; }
    .doc-wrapper { padding: 30px; max-width: 800px; margin: auto; position: relative; border: 1px solid #eee; }
    .header { display: flex; align-items: flex-start; justify-content: space-between; border-bottom: 2px solid #1a237e; padding-bottom: 15px; margin-bottom: 20px; }
    .logo-container { width: 80px; text-align: left; }
    .logo-container img { max-height: 60px; max-width: 80px; object-fit: contain; }
    .school-info { flex: 1; text-align: center; padding: 0 15px; }
    .school-info h1 { margin: 0; font-size: 20px; color: #1a237e; text-transform: uppercase; font-weight: 900; letter-spacing: 0.5px; }
    .school-info .affiliation { font-size: 10px; color: #d32f2f; font-weight: bold; text-transform: uppercase; margin: 2px 0; }
    .school-info .address { font-size: 9px; color: #666; line-height: 1.3; }
    .reg-info { width: 140px; text-align: right; font-size: 9px; font-weight: bold; color: #444; }
    .doc-title { text-align: center; margin: 15px 0; font-size: 16px; font-weight: 900; color: #1a237e; text-transform: uppercase; border-bottom: 1px solid #1a237e; display: inline-block; width: 100%; padding-bottom: 3px; }
    .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 12px; }
    .details-grid b { color: #555; text-transform: uppercase; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
    th, td { border: 1px solid #ddd; padding: 10px; text-align: center; font-size: 11px; }
    th { background: #f8f9fa; color: #1a237e; font-weight: bold; }
    .footer-sigs { margin-top: 50px; display: flex; justify-content: space-between; font-size: 12px; font-weight: bold; }
    .sig-box { width: 150px; border-top: 1.5px solid #333; text-align: center; padding-top: 5px; color: #1a237e; }
    .highlight-box { background: #f0f4ff; padding: 12px; border-radius: 6px; border: 1px solid #1a237e; margin: 15px 0; display: flex; justify-content: space-between; align-items: center; }
  </style>
`

export const generateConsolidatedFeeReceipt = (student: Student, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const currency = schoolProfile.currency || 'INR'
  const labels = getRegionLabels(locale)
  const today = new Date().toLocaleDateString(locale)

  return `
    <html>
    <head>${getStyles()}</head>
    <body>
      <div class="doc-wrapper">
        <div class="header">
          <div class="logo-container">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <div class="affiliation">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</div>
            <div class="address">${schoolProfile.address}</div>
          </div>
          <div class="reg-info">
            <div>${labels.regLabel}: ${schoolProfile.udiseCode || 'N/A'}</div>
            <div>${labels.affLabel}: ${schoolProfile.affiliationNo || 'N/A'}</div>
          </div>
        </div>
        <div class="doc-title">Statement of Account - Session ${schoolProfile.academicYear}</div>
        <div class="details-grid">
          <div>
            <div><b>Student Name:</b> ${student.name}</div>
            <div><b>${labels.idLabel}:</b> ${student.grNo}</div>
            <div><b>Class / Section:</b> ${student.class} '${student.section}'</div>
          </div>
          <div style="text-align:right">
            <div><b>Date:</b> ${today}</div>
            <div><b>Status:</b> ${student.status || 'Active'}</div>
          </div>
        </div>
        <table>
          <thead><tr><th style="text-align:left">Fee Head / Description</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            <tr><td style="text-align:left">Annual Tuition & Combined Charges</td><td style="text-align:right">${formatMoney(student.totalFees, locale, currency)}</td></tr>
            <tr><td style="text-align:left">Total Credits / Received Amount</td><td style="text-align:right; color:green; font-weight:bold;">${formatMoney(student.feesPaid, locale, currency)}</td></tr>
          </tbody>
        </table>
        <div class="highlight-box">
          <span style="font-weight:bold;">NET OUTSTANDING BALANCE</span>
          <span style="font-size:18px; font-weight:900; color:#d32f2f;">${formatMoney(student.totalFees - student.feesPaid, locale, currency)}</span>
        </div>
        <div class="footer-sigs" style="margin-top: 80px;">
          <div class="sig-box">Parent/Guardian</div>
          <div class="sig-box">Accountant</div>
          <div class="sig-box">Principal / Seal</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateFeeReceiptForPayment = (student: Student, amount: number, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const currency = schoolProfile.currency || 'INR'
  const labels = getRegionLabels(locale)
  const today = new Date().toLocaleDateString(locale)
  const receiptNo = `R-${Date.now().toString().slice(-6)}`

  return `
    <html>
    <head>
      <style>
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
        body { font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #f0f0f0; }
        .receipt-container {
          width: 210mm;
          height: 148.5mm; /* Half of A4 */
          padding: 10mm;
          box-sizing: border-box;
          background: #fff;
          border: 1px solid #ddd;
          position: relative;
          overflow: hidden;
          margin: 0 auto;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        
        /* Professional Watermark */
        .watermark {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 80px;
          color: rgba(26, 35, 126, 0.05);
          white-space: nowrap;
          pointer-events: none;
          z-index: 0;
          font-weight: 900;
          text-transform: uppercase;
        }

        .inner-border {
          border: 2px solid #1a237e;
          height: 100%;
          padding: 8mm;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
        }

        .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #1a237e; padding-bottom: 10px; }
        .logo-box { width: 80px; }
        .logo-box img { max-height: 60px; max-width: 80px; object-fit: contain; }
        .school-info { flex: 1; text-align: center; }
        .school-info h1 { margin: 0; font-size: 22px; color: #1a237e; text-transform: uppercase; font-weight: 900; letter-spacing: 1px; }
        .school-info p { margin: 2px 0; font-size: 10px; color: #444; font-weight: bold; }
        
        .receipt-meta { display: flex; justify-content: space-between; margin: 15px 0; font-size: 12px; font-weight: bold; color: #1a237e; }
        .receipt-meta span { background: #f0f4ff; padding: 4px 12px; border-radius: 4px; border: 1px solid #1a237e; }

        .doc-title { text-align: center; margin: 5px 0; font-size: 16px; font-weight: 900; color: #fff; background: #1a237e; padding: 5px; border-radius: 4px; text-transform: uppercase; }
        
        .student-details { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-top: 15px; font-size: 13px; line-height: 1.6; }
        .detail-row { border-bottom: 1px dotted #ccc; display: flex; justify-content: space-between; padding-bottom: 2px; }
        .detail-row b { color: #1a237e; font-size: 11px; text-transform: uppercase; }

        .amount-section { margin-top: 25px; border: 2px solid #1a237e; border-radius: 8px; overflow: hidden; display: flex; }
        .amount-label { background: #1a237e; color: #fff; padding: 15px; font-weight: 900; font-size: 14px; display: flex; align-items: center; justify-content: center; width: 150px; }
        .amount-value { flex: 1; background: #f8f9ff; color: #1a237e; font-size: 32px; font-weight: 900; padding: 10px 20px; display: flex; align-items: center; font-family: 'Courier New', Courier, monospace; }

        .words-section { margin-top: 10px; font-size: 11px; color: #666; font-style: italic; border-bottom: 1px solid #eee; padding-bottom: 5px; }

        .footer { display: flex; justify-content: space-between; margin-top: 40px; }
        .sig-container { text-align: center; width: 160px; }
        .sig-line { border-top: 1.5px solid #333; margin-bottom: 5px; }
        .sig-label { font-size: 11px; font-weight: bold; color: #1a237e; text-transform: uppercase; }

        .paid-stamp {
          position: absolute;
          bottom: 20mm;
          right: 40mm;
          border: 4px double #d32f2f;
          color: #d32f2f;
          padding: 5px 15px;
          font-size: 24px;
          font-weight: 900;
          text-transform: uppercase;
          transform: rotate(-15deg);
          border-radius: 8px;
          opacity: 0.8;
          z-index: 2;
        }
      </style>
    </head>
    <body>
      <div class="receipt-container">
        <div class="watermark">${schoolProfile.name}</div>
        <div class="paid-stamp">PAID</div>
        <div class="inner-border">
          <div class="header">
            <div class="logo-box">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
            <div class="school-info">
              <h1>${schoolProfile.name}</h1>
              <p>${schoolProfile.address}</p>
              <p>Affiliated to ${schoolProfile.educationBoard || 'National Board'} | ${labels.regLabel}: ${schoolProfile.udiseCode || 'N/A'}</p>
            </div>
            <div style="width: 80px;"></div>
          </div>

          <div class="doc-title">Fee Collection Receipt</div>

          <div class="receipt-meta">
            <span>No: ${receiptNo}</span>
            <span>Date: ${today}</span>
          </div>

          <div class="student-details">
            <div class="left-col">
              <div class="detail-row"><b>Student Name:</b> <span>${student.name}</span></div>
              <div class="detail-row"><b>Father's Name:</b> <span>${student.fatherName}</span></div>
              <div class="detail-row"><b>${labels.idLabel}:</b> <span>${student.grNo}</span></div>
            </div>
            <div class="right-col">
              <div class="detail-row"><b>Class / Section:</b> <span>${student.class} - ${student.section}</span></div>
              <div class="detail-row"><b>Roll Number:</b> <span>${student.rollNo || 'N/A'}</span></div>
              <div class="detail-row"><b>Session:</b> <span>${schoolProfile.academicYear}</span></div>
            </div>
          </div>

          <div class="amount-section">
            <div class="amount-label">RECEIVED SUM</div>
            <div class="amount-value">${formatMoney(amount, locale, currency)}</div>
          </div>

          <div class="words-section">
            <b>Note:</b> Payment received towards school tuition and academic fees for the current session.
          </div>

          <div class="footer">
            <div class="sig-container">
              <div class="sig-line"></div>
              <div class="sig-label">Student/Parent</div>
            </div>
            <div class="sig-container">
              <div class="sig-line"></div>
              <div class="sig-label">Cashier / Accountant</div>
            </div>
            <div class="sig-container">
              <div class="sig-line"></div>
              <div class="sig-label">Principal / Seal</div>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateSaaSReceiptHtml = (school: School, plan: SubscriptionPlan, platformName: string): string => {
  const today = new Date().toLocaleDateString('en-IN')
  const receiptNo = `INV-${Date.now().toString().slice(-8)}`
  
  return `
    <html>
    <head>
      <style>
        @media print { @page { size: A4 portrait; margin: 1cm; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        body { font-family: 'Inter', sans-serif; color: #333; line-height: 1.6; }
        .receipt-card { border: 2px solid #333; padding: 40px; max-width: 800px; margin: auto; position: relative; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
        .brand { font-size: 28px; font-weight: 900; color: #1a237e; text-transform: uppercase; }
        .doc-type { background: #333; color: white; padding: 5px 15px; font-size: 14px; font-weight: bold; }
        .meta-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
        .meta-box h4 { margin: 0 0 10px; font-size: 12px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        .meta-box p { margin: 0; font-weight: bold; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 30px 0; }
        th { text-align: left; background: #f4f4f4; padding: 12px; border-bottom: 2px solid #333; font-size: 12px; text-transform: uppercase; }
        td { padding: 15px 12px; border-bottom: 1px solid #eee; font-size: 14px; }
        .total-row { display: flex; justify-content: flex-end; margin-top: 20px; }
        .total-box { background: #333; color: white; padding: 20px; width: 250px; text-align: right; }
        .total-box div { font-size: 10px; text-transform: uppercase; opacity: 0.8; }
        .total-box span { font-size: 24px; font-weight: 900; display: block; }
        .footer { margin-top: 100px; display: flex; justify-content: space-between; align-items: flex-end; }
        .stamp { border: 3px double #1a237e; color: #1a237e; padding: 10px; font-weight: 900; transform: rotate(-5deg); font-size: 14px; opacity: 0.6; }
        .sig { border-top: 2px solid #333; width: 200px; text-align: center; padding-top: 10px; font-weight: bold; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <div class="header">
          <div class="brand">${platformName}</div>
          <div class="doc-type">SUBSCRIPTION RECEIPT</div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-box">
            <h4>Billed To (School)</h4>
            <p>${school.name}</p>
            <p style="font-weight: normal;">${school.adminEmail || 'Admin Account'}</p>
            <p style="font-weight: normal; font-size: 11px;">Tenant ID: ${school.id}</p>
          </div>
          <div class="meta-box" style="text-align: right;">
            <h4>Receipt Details</h4>
            <p>Receipt #: ${receiptNo}</p>
            <p>Date: ${today}</p>
            <p>Payment Mode: Online / License Key</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Description</th>
              <th>Quantity</th>
              <th style="text-align: right;">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <strong>${plan.name} License</strong><br/>
                <span style="font-size: 11px; color: #666;">Includes student management up to ${plan.studentLimit} records, AI features, and cloud hosting. Valid until ${formatDate(school.expiryDate)}</span>
              </td>
              <td>1 Instance</td>
              <td style="text-align: right; font-weight: bold;">₹${plan.monthlyPrice.toLocaleString('en-IN')}</td>
            </tr>
          </tbody>
        </table>

        <div class="total-row">
          <div class="total-box">
            <div>Total Amount Paid</div>
            <span>₹${plan.monthlyPrice.toLocaleString('en-IN')}</span>
          </div>
        </div>

        <div class="footer">
          <div class="stamp">OFFICIAL PAYMENT RECEIVED<br/>DIGITAL SOFTWARE LICENSE</div>
          <div class="sig">
            Authorized Signatory<br/>
            ${platformName} Operations
          </div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateLeavingCertificate = (student: Student, schoolProfile: School, isDuplicate: boolean = false): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const labels = getRegionLabels(locale)
  
  return `
    <html>
    <head>${getStyles()}</head>
    <body>
      <div class="doc-wrapper" style="border: 10px double #1a237e; padding: 40px;">
        <div class="header">
          <div class="logo-container">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <div class="affiliation">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</div>
            <div class="address">${schoolProfile.address}</div>
          </div>
          <div class="reg-info">
            <div>${labels.regLabel}: ${schoolProfile.udiseCode || 'N/A'}</div>
            <div>${labels.affLabel}: ${schoolProfile.affiliationNo || 'N/A'}</div>
          </div>
        </div>
        <div class="doc-title" style="color:#d32f2f; font-size:20px; border:none; text-decoration:underline;">Transfer / Leaving Certificate</div>
        ${isDuplicate ? '<div style="text-align:center; font-weight:bold; color:#666; margin-bottom:10px;">(DUPLICATE COPY)</div>' : ''}
        <div style="font-size: 16px; line-height: 2; text-align: justify; margin-top: 20px;">
          This is to certify that Master/Miss <b style="color:#1a237e">${student.name}</b>, bearing <b>${labels.idLabel} ${student.grNo}</b>, son/daughter of <b>${student.fatherName}</b> and <b>${student.motherName}</b>, was a bonafide student of this institution.
          His/Her Date of Birth as recorded in the admission register is <b>${formatDate(student.dob, locale)}</b>. 
          He/She was studying in <b>Class ${student.class}</b> during the academic session <b>${schoolProfile.academicYear}</b>. 
          His/Her character and conduct have been <b>Good</b>. All dues to the school have been cleared.
        </div>
        <div class="footer-sigs" style="margin-top: 100px;">
          <div class="sig-box">Class Teacher</div>
          <div class="sig-box">Principal Signature</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateBonafideCertificate = (student: Student, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const labels = getRegionLabels(locale)

  return `
    <html>
    <head>${getStyles()}</head>
    <body>
      <div class="doc-wrapper" style="border: 2px solid #1a237e; min-height: 70vh;">
        <div class="header">
          <div class="logo-container">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <div class="affiliation">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</div>
            <div class="address">${schoolProfile.address}</div>
          </div>
          <div class="reg-info">
            <div>${labels.regLabel}: ${schoolProfile.udiseCode || 'N/A'}</div>
            <div>${labels.affLabel}: ${schoolProfile.affiliationNo || 'N/A'}</div>
          </div>
        </div>
        <div class="doc-title" style="margin: 40px 0; font-size: 22px;">Bonafide Certificate</div>
        <div style="font-size: 18px; line-height: 2.2; text-align: justify;">
          This is to certify that Master/Miss <b style="color:#1a237e">${student.name}</b>, 
          son/daughter of <b>${student.fatherName}</b>, is a regular and bonafide student 
          of this school for the academic year <b>${schoolProfile.academicYear}</b>. 
          He/She is currently studying in <b>Class ${student.class}</b> Section <b>'${student.section}'</b>. 
          As per school records, his/her date of birth is <b>${formatDate(student.dob, locale)}</b>.
        </div>
        <div class="footer-sigs" style="margin-top: auto; padding-top: 80px;">
          <div class="sig-box" style="margin-left: auto;">Principal Signature</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateMarksheetHtml = (student: Student, schoolProfile: School, examName: string, marks: any[], remarks?: string): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const labels = getRegionLabels(locale)
  let totalMax = 0, totalGot = 0

  const rows = marks.map((m) => {
    const got = Number(m.theoryGot || 0) + Number(m.practicalGot || 0) + Number(m.internalGot || 0)
    const max = Number(m.theoryMax || 0) + Number(m.practicalMax || 0) + Number(m.internalMax || 0)
    totalMax += max; totalGot += got
    const subjectPercent = max > 0 ? (got / max) * 100 : 0
    return `<tr><td style="text-align:left; font-weight:bold;">${m.subject}</td><td>${m.theoryGot}/${m.theoryMax}</td><td>${m.practicalGot}/${m.practicalMax}</td><td>${m.internalGot}/${m.internalMax}</td><td style="background:#f0f4ff; font-weight:bold;">${got}/${max}</td><td>${calculateGrade(subjectPercent)}</td></tr>`
  }).join('')

  const percentage = totalMax > 0 ? ((totalGot / totalMax) * 100).toFixed(2) : '0.00'

  return `
    <html>
    <head>${getStyles()}</head>
    <body>
      <div class="doc-wrapper">
        <div class="header">
          <div class="logo-container">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <div class="affiliation">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</div>
            <div class="address">${schoolProfile.address}</div>
          </div>
          <div class="reg-info">
            <div>SESSION: ${schoolProfile.academicYear}</div>
            <div>${labels.idLabel}: ${student.grNo}</div>
          </div>
        </div>
        <div class="doc-title" style="background:#1a237e; color:white; padding:8px;">${examName.toUpperCase()} - RESULT SHEET</div>
        <div class="details-grid">
          <div><b>Candidate Name:</b> ${student.name}</div>
          <div style="text-align:right"><b>Class / Sect:</b> ${student.class} - ${student.section}</div>
        </div>
        <table>
          <thead><tr><th>Subject</th><th>Theory</th><th>Practical</th><th>Internal</th><th>Total</th><th>Grade</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="highlight-box">
          <div style="text-align:center"><b>OVERALL PERCENTAGE</b><div style="font-size:20px; font-weight:900;">${percentage}%</div></div>
          <div style="text-align:center"><b>FINAL RESULT</b><div style="font-size:20px; font-weight:900; color:${Number(percentage) >= 35 ? 'green' : 'red'};">${Number(percentage) >= 35 ? 'PASSED' : 'FAILED'}</div></div>
        </div>
        ${remarks ? `<div style="margin-top:15px; border:1px dashed #ccc; padding:8px; font-size:10px;"><b>Evaluator Remarks:</b> ${remarks}</div>` : ''}
        <div class="footer-sigs">
          <div class="sig-box">Class Teacher</div>
          <div class="sig-box">Principal</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateBulkIdCardsHtml = (students: Student[], schoolProfile: School): string => {
  const cards = students.map((s) => generateIdCard(s, schoolProfile)).join('')
  return `<html><body style="display:flex; flex-wrap:wrap; gap:15px; background:#f4f4f4; padding:20px; justify-content:center;">${cards}</body></html>`
}

export const generateAdmissionForm = (student: Student, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const labels = getRegionLabels(locale)

  return `
    <html>
    <head>${getStyles()}</head>
    <body>
      <div class="doc-wrapper" style="border: 2px solid #000;">
        <div class="header">
          <div class="logo-container">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <div class="affiliation">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</div>
            <div class="address">${schoolProfile.address}</div>
          </div>
          <div class="reg-info">
            <div>ADM. YEAR: ${schoolProfile.academicYear}</div>
          </div>
        </div>
        <div class="doc-title" style="background:#eee;">STUDENT ADMISSION FORM</div>
        <div style="display:flex; justify-content:space-between; margin-bottom:20px;">
          <div style="flex:1; line-height:2.2;">
            <div><b>Full Name:</b> ${student.name}</div>
            <div><b>Father's Name:</b> ${student.fatherName}</div>
            <div><b>Mother's Name:</b> ${student.motherName}</div>
            <div><b>Class Applied:</b> ${student.class}</div>
            <div><b>Date of Birth:</b> ${formatDate(student.dob, locale)}</div>
            <div><b>Contact No:</b> ${student.mobile}</div>
          </div>
          <div style="width:100px; height:130px; border:2px solid #1a237e; display:flex; align-items:center; justify-content:center; background:#f9f9f9; overflow:hidden;">
            ${student.photoUrl ? `<img src="${student.photoUrl}" style="width:100%; height:100%; object-fit:cover;">` : 'PHOTO'}
          </div>
        </div>
        <div style="border:1px solid #eee; padding:12px; font-size:11px; min-height:80px;"><b>Residential Address:</b><br/>${student.address}</div>
        <div class="footer-sigs" style="margin-top:80px;">
          <div class="sig-box">Parent Signature</div>
          <div class="sig-box">Admission Officer</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateExamAdmitCard = (student: Student, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const labels = getRegionLabels(locale)
  return `
    <div style="width: 450px; height: 280px; border: 3px solid #1a237e; border-radius: 12px; overflow: hidden; font-family: sans-serif; background: #fff; margin: 10px; display: inline-block; position: relative; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
      <div style="background:#1a237e; color:white; padding:12px; display:flex; align-items:center; gap:12px;">
        ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" style="width:40px; height:40px; background:#fff; border-radius:50%; padding:2px;">` : ''}
        <div style="flex:1;"><h3 style="margin:0; font-size:14px; text-transform:uppercase;">${schoolProfile.name}</h3><p style="margin:0; font-size:9px; font-weight:bold;">EXAMINATION HALL TICKET - ${schoolProfile.academicYear}</p></div>
      </div>
      <div style="padding:15px; display:flex; gap:20px;">
        <div style="width:100px; height:120px; border:2px solid #eee; background:#f9f9f9;"><img src="${student.photoUrl}" style="width:100%; height:100%; object-fit:cover;"></div>
        <div style="flex:1; font-size:11px; line-height:1.8;">
          <div style="font-size:16px; font-weight:900; color:#1a237e; border-bottom:1px solid #eee; margin-bottom:5px;">${student.name}</div>
          <div><b>Class / Sect:</b> ${student.class} - ${student.section}</div>
          <div><b>${labels.idLabel}:</b> ${student.grNo}</div>
          <div><b>Roll No:</b> ${student.rollNo || 'N/A'}</div>
          <div><b>Session:</b> ${schoolProfile.academicYear}</div>
        </div>
      </div>
      <div style="position:absolute; bottom:10px; right:20px; font-size:9px; border-top:1px solid #333; width:100px; text-align:center; padding-top:2px;">Principal Signature</div>
    </div>
  `
}

export const generateBulkExamPassesHtml = (students: Student[], schoolProfile: School): string => {
  const passes = students.map((s) => generateExamAdmitCard(s, schoolProfile)).join('')
  return `<html><body style="background:#f0f0f0; display:flex; flex-wrap:wrap; justify-content:center; padding:20px; gap:20px;">${passes}</body></html>`
}

export const generateExamScheduleHtml = (schedule: ExamSchedule, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const rows = schedule.schedules.map(s => `<tr><td>${formatDate(s.date, locale)}</td><td style="text-align:left; font-weight:bold;">${s.subject}</td><td>${s.time}</td></tr>`).join('')
  
  return `
    <html>
    <head>${getStyles()}</head>
    <body>
      <div class="doc-wrapper">
        <div class="header">
          <div class="logo-container">${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}">` : ''}</div>
          <div class="school-info">
            <h1>${schoolProfile.name}</h1>
            <div class="affiliation">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</div>
            <div class="address">${schoolProfile.address}</div>
          </div>
          <div class="reg-info">
            <div>DATE: ${new Date().toLocaleDateString(locale)}</div>
          </div>
        </div>
        <div class="doc-title" style="background:#f0f4ff; border:1px solid #1a237e;">DATE SHEET: ${schedule.examName.toUpperCase()}</div>
        <div style="text-align:center; font-weight:bold; margin-bottom:12px; color:#d32f2f;">TARGET: CLASS ${schedule.class}</div>
        <table>
          <thead><tr><th>Exam Date</th><th style="text-align:left">Subject Name</th><th>Timing / Slot</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top:20px; font-size:10px; color:#666;">
          <b>Instructions:</b> 1. Students must carry their hall tickets. 2. Reporting time is 15 minutes before the exam starts.
        </div>
        <div class="footer-sigs" style="margin-top:50px;">
          <div class="sig-box" style="margin-left:auto;">Exam In-charge</div>
        </div>
      </div>
    </body>
    </html>
  `
}

export const generateBulkExamSlipsHtml = (schedule: ExamSchedule, students: Student[], schoolProfile: School): string => {
    const slips = students.map(s => {
        const labels = getRegionLabels(schoolProfile.locale || 'en-IN');
        return `
            <div style="width: 100%; border: 2px dashed #333; padding: 15px; margin-bottom: 25px; page-break-inside: avoid;">
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #1a237e; pb:8px; mb:8px;">
                    ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" style="height:35px;">` : ''}
                    <div style="text-align:center"><h2 style="margin:0; font-size:12px;">${schoolProfile.name}</h2><p style="margin:0; font-size:8px;">${schedule.examName}</p></div>
                    <div style="text-align:right; font-size:9px;"><b>${s.name}</b><br/>Class ${s.class} | Roll: ${s.rollNo}</div>
                </div>
                <table style="width:100%; border-collapse:collapse; font-size:9px;">
                    <thead style="background:#f9f9f9"><tr><th style="border:1px solid #ddd; p:3px;">Date</th><th style="border:1px solid #ddd; p:3px; text-align:left">Subject</th><th style="border:1px solid #ddd; p:3px;">Time</th></tr></thead>
                    <tbody>
                        ${schedule.schedules.map(slot => `<tr><td style="border:1px solid #ddd; p:3px; text-align:center">${formatDate(slot.date)}</td><td style="border:1px solid #ddd; p:3px;">${slot.subject}</td><td style="border:1px solid #ddd; p:3px; text-align:center">${slot.time}</td></tr>`).join('')}
                    </tbody>
                </table>
            </div>
        `
    }).join('')
    return `<html><head><style>body { font-family: sans-serif; padding: 15px; }</style></head><body>${slips}</body></html>`
}

export const generateIdCard = (student: Student, schoolProfile: School): string => {
  const locale = schoolProfile.locale || 'en-IN'
  const labels = getRegionLabels(locale)

  return `
    <div style="width: 280px; height: 450px; border: 1px solid #1a237e; border-radius: 12px; overflow: hidden; font-family: sans-serif; background: #fff; margin: 10px; display: inline-block; vertical-align: top; position: relative; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
      <div style="background: #1a237e; color: white; padding: 15px; text-align: center;">
        ${schoolProfile.logoUrl ? `<img src="${schoolProfile.logoUrl}" style="height:45px; width:45px; border-radius:50%; background:#fff; padding:2px; margin-bottom: 5px;">` : ''}
        <h3 style="margin:0; font-size: 12px; text-transform: uppercase; font-weight: 900;">${schoolProfile.name}</h3>
        <p style="margin:2px 0 0; font-size: 7px; opacity: 0.8; font-weight: bold;">Affiliated to ${schoolProfile.educationBoard || 'National Board'}</p>
      </div>
      <div style="padding: 20px; text-align: center;">
        <div style="width: 120px; height: 140px; border-radius: 8px; border: 3px solid #f0f0f0; overflow: hidden; margin: 0 auto 15px;"><img src="${student.photoUrl}" style="width: 100%; height: 100%; object-fit: cover;"></div>
        <h2 style="margin: 0; color: #1a237e; font-size: 18px; font-weight: 900; text-transform: uppercase;">${student.name}</h2>
        <p style="margin: 5px 0; font-weight: bold; color: #d32f2f; font-size: 12px;">STUDENT ID CARD</p>
        <div style="margin-top: 15px; text-align: left; display: grid; gap: 6px; font-size: 10px; border-top: 1px solid #eee; pt: 10px;">
          <div style="display:flex; justify-content:space-between;"><b>CLASS:</b> <span>${student.class} - ${student.section}</span></div>
          <div style="display:flex; justify-content:space-between;"><b>${labels.idLabel}:</b> <span>${student.grNo}</span></div>
          <div style="display:flex; justify-content:space-between;"><b>PHONE:</b> <span>${student.mobile}</span></div>
        </div>
      </div>
      <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #1a237e; color: white; padding: 8px; font-size: 8px; text-align: center;">SESSION ${schoolProfile.academicYear}</div>
    </div>
  `
}
