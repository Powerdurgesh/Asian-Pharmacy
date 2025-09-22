# Pharmacy Billing (Offline) - Ready-to-run Node.js project

What this does
- Frontend: billing form to add medicines, patient details (name, number, age, address).
- Backend: generates a PDF invoice using **PDFKit**, saves it under `/bills/{patientName}/{YYYY-MM-DD}/` and emails it automatically to the **admin email**.
- GST set to **0%** (as requested).
- Print option available from the browser (Print button opens PDF in new tab and triggers print).

Admin email (where bills are sent): **chintalapowerdurgesh2003@gmail.com**

## Setup (locally)
1. Install Node.js (v16+ recommended).
2. Unzip project and `cd pharmacy_billing`.
3. Run `npm install` to install dependencies.
4. Copy `.env.example` to `.env` and fill SMTP details (for sending emails):
   - SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS
   - FROM_EMAIL (sender)
   Example (Gmail via OAuth/ App Passwords or other SMTP provider).
5. Start server: `npm start`
6. Open browser: `http://localhost:3000`

## Notes
- Bills are saved at `./bills/{patientName}/{YYYY-MM-DD}/bill_{timestamp}.pdf`.
- The server will attempt to email the generated PDF to the admin email defined in the .env (`ADMIN_EMAIL`) after saving.
- GST is fixed at 0% per your request. You can change tax logic in `server.js` if needed.

If you want, I can also adapt this to use a nicer invoice template (HTML->PDF) or add authentication for admin.