// slip-template.js — builds the HTML string for a payslip, used by main.js with
// webContents.printToPDF(). Plain string templating, no extra dependency.

function formatIDR(n) {
  n = Math.round(Number(n) || 0);
  return 'Rp ' + n.toLocaleString('id-ID');
}

function formatPeriod(period) {
  const [y, m] = period.split('-');
  const names = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];
  return `${names[Number(m) - 1]} ${y}`;
}

function buildSlipHtml(payroll, employee, settings) {
  const gross = payroll.grossSalary ?? (Number(payroll.baseSalary || 0) + Number(payroll.allowance || 0));
  const attendanceDeduction = payroll.attendanceDeduction ?? payroll.deductions ?? 0;
  const bpjsEmployee = payroll.bpjsEmployee || { kesehatan: 0, jht: 0, jp: 0, total: 0 };
  const pph21 = payroll.pph21 ?? 0;
  const totalDeductions = payroll.totalDeductions ?? (attendanceDeduction + bpjsEmployee.total + pph21);
  const net = payroll.netSalary ?? Math.max(gross - totalDeductions, 0);

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 12.5px; margin: 0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 18px; }
  .company { font-size: 17px; font-weight: 700; }
  .company-sub { font-size: 11px; color: #6b7280; margin-top: 2px; }
  .doc-title { text-align: right; }
  .doc-title h1 { font-size: 16px; margin: 0; }
  .doc-title span { font-size: 11.5px; color: #6b7280; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 24px; margin-bottom: 20px; font-size: 12.5px; }
  .info-row { display: flex; justify-content: space-between; border-bottom: 1px dotted #d1d5db; padding: 3px 0; }
  .info-row .label { color: #6b7280; }
  table.breakdown { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
  table.breakdown th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: #6b7280; border-bottom: 1px solid #111827; padding: 6px 4px; }
  table.breakdown td { padding: 6px 4px; border-bottom: 1px solid #e5e7eb; }
  table.breakdown td.amount { text-align: right; font-family: 'Courier New', monospace; }
  .cols { display: flex; gap: 24px; margin-bottom: 14px; }
  .col { flex: 1; }
  .total-row td { font-weight: 700; border-top: 2px solid #111827; border-bottom: none; }
  .net-box { margin-top: 18px; background: #f3f4f6; border-radius: 8px; padding: 14px 16px; display: flex; justify-content: space-between; align-items: center; }
  .net-box .label { font-size: 13px; font-weight: 600; }
  .net-box .value { font-size: 20px; font-weight: 800; }
  .signatures { display: flex; justify-content: space-between; margin-top: 60px; }
  .sign-box { text-align: center; width: 200px; font-size: 12px; }
  .sign-line { margin-top: 50px; border-top: 1px solid #111827; padding-top: 4px; }
  .footer-note { margin-top: 26px; font-size: 9.5px; color: #9ca3af; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="company">${escapeHtml(settings?.companyName || 'Perusahaan')}</div>
      <div class="company-sub">${escapeHtml(settings?.companyAddress || '')}</div>
    </div>
    <div class="doc-title">
      <h1>SLIP GAJI</h1>
      <span>Periode ${formatPeriod(payroll.period)}</span>
    </div>
  </div>

  <div class="info-grid">
    <div class="info-row"><span class="label">Nama Karyawan</span><span>${escapeHtml(employee?.name || '-')}</span></div>
    <div class="info-row"><span class="label">No. Rekening</span><span>${escapeHtml(employee?.bankAccount || '-')}</span></div>
    <div class="info-row"><span class="label">Posisi</span><span>${escapeHtml(employee?.position || '-')}</span></div>
    <div class="info-row"><span class="label">Status Pajak</span><span>${escapeHtml(employee?.taxStatus || 'TK/0')}</span></div>
    <div class="info-row"><span class="label">Departemen</span><span>${escapeHtml(employee?.department || '-')}</span></div>
    <div class="info-row"><span class="label">NIK</span><span>${escapeHtml(employee?.nik || '-')}</span></div>
  </div>

  <div class="cols">
    <div class="col">
      <table class="breakdown">
        <thead><tr><th colspan="2">Pendapatan</th></tr></thead>
        <tbody>
          <tr><td>Gaji Pokok</td><td class="amount">${formatIDR(payroll.baseSalary)}</td></tr>
          <tr><td>Tunjangan</td><td class="amount">${formatIDR(payroll.allowance)}</td></tr>
          <tr class="total-row"><td>Total Pendapatan</td><td class="amount">${formatIDR(gross)}</td></tr>
        </tbody>
      </table>
    </div>
    <div class="col">
      <table class="breakdown">
        <thead><tr><th colspan="2">Potongan</th></tr></thead>
        <tbody>
          <tr><td>BPJS Kesehatan</td><td class="amount">${formatIDR(bpjsEmployee.kesehatan)}</td></tr>
          <tr><td>BPJS JHT</td><td class="amount">${formatIDR(bpjsEmployee.jht)}</td></tr>
          <tr><td>BPJS JP</td><td class="amount">${formatIDR(bpjsEmployee.jp)}</td></tr>
          <tr><td>PPh 21</td><td class="amount">${formatIDR(pph21)}</td></tr>
          <tr><td>Potongan Absensi</td><td class="amount">${formatIDR(attendanceDeduction)}</td></tr>
          <tr class="total-row"><td>Total Potongan</td><td class="amount">${formatIDR(totalDeductions)}</td></tr>
        </tbody>
      </table>
    </div>
  </div>

  <div class="net-box">
    <span class="label">GAJI BERSIH (TAKE HOME PAY)</span>
    <span class="value">${formatIDR(net)}</span>
  </div>

  <div class="signatures">
    <div class="sign-box"><div class="sign-line">Karyawan</div></div>
    <div class="sign-box"><div class="sign-line">HRD / Pemilik Usaha</div></div>
  </div>

  <div class="footer-note">
    Dokumen ini dibuat otomatis oleh aplikasi HR internal pada ${new Date().toLocaleString('id-ID')}.
    PPh21 dihitung dengan metode ${payroll.pph21Method === 'Pasal17-Desember' ? 'tarif progresif Pasal 17 (rekonsiliasi Masa Pajak Terakhir)' : 'TER (Tarif Efektif Rata-rata, PP 58/2023)'}.
    Estimasi PPh21/BPJS — mohon verifikasi ke peraturan resmi terbaru (kalkulator.pajak.go.id) bila diperlukan.
  </div>
</body>
</html>`;
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

module.exports = { buildSlipHtml };
