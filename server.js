require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'chintalapowerdurgesh2003@gmail.com';

function sanitizeName(name){ return name.replace(/[^a-zA-Z0-9_\- ]/g,'').trim() || 'Unknown'; }

function createInvoicePDF(data, outPath){ 
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40 });
    const writeStream = fs.createWriteStream(outPath);
    doc.pipe(writeStream);

    // Header
    doc.fontSize(20).text(data.pharmacyName || 'Pharmacy', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).text(data.pharmacyAddress || '', { align: 'center' });
    doc.moveDown(1);

    // Patient & meta
    doc.fontSize(12).text(`Patient Name: ${data.patientName}`);
    doc.text(`Phone: ${data.patientNumber}    Age: ${data.patientAge}`);
    doc.text(`Address: ${data.patientAddress}`);
    doc.moveDown(0.5);
    doc.text(`Date: ${data.date}`);
    doc.moveDown(0.5);

    // Table header
    doc.fontSize(11).text('No',50,200);
    doc.text('Medicine',90,200);
    doc.text('Qty',330,200);
    doc.text('Rate',380,200);
    doc.text('Amount',450,200);
    doc.moveTo(50, 215).lineTo(540, 215).stroke();

    let y = 225;
    let i = 1;
    let subTotal = 0;
    for(const item of data.items){
      const amount = Number(item.qty) * Number(item.price);
      subTotal += amount;
      doc.fontSize(11).text(i,50,y);
      doc.text(item.name,90,y, { width: 220 });
      doc.text(item.qty,330,y);
      doc.text(Number(item.price).toFixed(2),380,y);
      doc.text(amount.toFixed(2),450,y);
      y += 20;
      i++;
      if(y > 700){ doc.addPage(); y = 50; }
    }

    doc.moveTo(50, y+5).lineTo(540, y+5).stroke();
    const gst = 0.00;
    const gstAmount = subTotal * gst / 100.0;
    const total = subTotal + gstAmount;

    doc.fontSize(11).text(`Sub Total:`, 380, y+20);
    doc.text(subTotal.toFixed(2), 470, y+20);
    doc.text(`GST (${gst.toFixed(2)}%):`, 380, y+40);
    doc.text(gstAmount.toFixed(2), 470, y+40);
    doc.text(`Total:`, 380, y+60);
    doc.text(total.toFixed(2), 470, y+60);

    doc.moveDown(2);
    doc.fontSize(10).text('Thank you for visiting. Get well soon!', { align: 'center' });

    doc.end();
    writeStream.on('finish', ()=> resolve());
    writeStream.on('error', (e)=> reject(e));
  });
}

async function sendEmailWithAttachment(toEmail, subject, text, attachmentPath){
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER,
    to: toEmail,
    subject,
    text,
    attachments: [
      { filename: path.basename(attachmentPath), path: attachmentPath }
    ]
  });
  return info;
}

app.post('/generate', async (req, res) => {
  try{
    const body = req.body;
    // Expected body: pharmacyName, pharmacyAddress, patientName, patientNumber, patientAge, patientAddress, items (array)
    const date = new Date();
    const dateStr = date.toISOString().slice(0,10);
    const timestamp = date.getTime();
    const patientSafe = sanitizeName(body.patientName || 'Unknown');
    const baseDir = path.join(__dirname, 'bills', patientSafe, dateStr);
    fs.mkdirSync(baseDir, { recursive: true });
    const filename = `bill_${timestamp}.pdf`;
    const outPath = path.join(baseDir, filename);

    const data = {
      pharmacyName: body.pharmacyName || 'Pharmacy',
      pharmacyAddress: body.pharmacyAddress || '',
      patientName: body.patientName || '',
      patientNumber: body.patientNumber || '',
      patientAge: body.patientAge || '',
      patientAddress: body.patientAddress || '',
      items: Array.isArray(body.items) ? body.items : JSON.parse(body.items || '[]'),
      date: new Date().toLocaleString()
    };

    await createInvoicePDF(data, outPath);

    // Send to admin email
    const adminEmail = process.env.ADMIN_EMAIL || '${ADMIN_EMAIL}';
    await sendEmailWithAttachment(adminEmail, `New Bill - ${data.patientName} - ${dateStr}`, `Attached is the bill for ${data.patientName}`, outPath);

    res.json({ ok: true, path: outPath, filename });
  } catch(err){
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(process.env.PORT || 3000, ()=>{
  console.log('Server started on port', process.env.PORT || 3000);
});