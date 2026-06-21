// payroll-calc.js — pure calculation helpers for PPh21 & BPJS Indonesia.
// Tidak ada dependency Electron di sini, supaya logic ini mudah ditest/diupdate terpisah.
//
// !! PENTING !!
// PPh21 dihitung dengan metode TER (Tarif Efektif Rata-rata) sesuai PP No. 58 Tahun 2023
// & PMK No. 168 Tahun 2023, yang berlaku sejak 1 Januari 2024 dan masih berlaku per
// pertengahan 2026 (belum ada perubahan tarif resmi). Skemanya:
//   - Masa Pajak Jan–Nov  : PPh21 = Tarif TER x Penghasilan Bruto bulan itu (langsung, tanpa
//                           dikurangi PTKP/biaya jabatan setiap bulan).
//   - Masa Pajak Terakhir (Desember, atau bulan terakhir karyawan bekerja): direkonsiliasi
//                           pakai tarif progresif Pasal 17 atas total setahun, dikurangi
//                           total PPh21 yang sudah dipotong Jan–Nov.
// Tarif & batas (PTKP, tabel TER, persentase BPJS, cap gaji BPJS) DIATUR PEMERINTAH dan BISA
// BERUBAH. Angka di bawah ini disalin dari lampiran resmi PP 58/2023 (tabel TER) dan UU HPP
// (tarif Pasal 17), serta rate BPJS yang berlaku 2026. SELALU cek ulang ke sumber resmi
// (kalkulator.pajak.go.id, bpjs-kesehatan.go.id, bpjsketenagakerjaan.go.id) sebelum dipakai
// untuk pembayaran resmi ke karyawan/negara. Ini adalah estimator internal, BUKAN nasihat
// pajak profesional — konsultasikan ke konsultan pajak terdaftar untuk kepastian.

// PTKP (Penghasilan Tidak Kena Pajak) per tahun + kategori TER, berdasarkan status kawin/tanggungan.
const PTKP_TABLE = {
  'TK/0': { annual: 54000000, ter: 'A' },
  'TK/1': { annual: 58500000, ter: 'A' },
  'K/0': { annual: 58500000, ter: 'A' },
  'TK/2': { annual: 63000000, ter: 'B' },
  'K/1': { annual: 63000000, ter: 'B' },
  'TK/3': { annual: 67500000, ter: 'B' },
  'K/2': { annual: 67500000, ter: 'B' },
  'K/3': { annual: 72000000, ter: 'C' },
};

// Tabel TER bulanan (PP 58/2023, lampiran). Setiap baris: [batas_atas_bruto_bulanan, tarif].
const TER_TABLE = {
  A: [
    [5400000, 0], [5650000, 0.0025], [5950000, 0.005], [6300000, 0.0075],
    [6750000, 0.01], [7500000, 0.0125], [8550000, 0.015], [9650000, 0.0175],
    [10050000, 0.02], [10350000, 0.0225], [10700000, 0.025], [11050000, 0.03],
    [11600000, 0.035], [12500000, 0.04], [13750000, 0.05], [15100000, 0.06],
    [16950000, 0.07], [19750000, 0.08], [24150000, 0.09], [26450000, 0.10],
    [28000000, 0.11], [30050000, 0.12], [32400000, 0.13], [35400000, 0.14],
    [39100000, 0.15], [43850000, 0.16], [47800000, 0.17], [51400000, 0.18],
    [56300000, 0.19], [62200000, 0.20], [68600000, 0.21], [77500000, 0.22],
    [89000000, 0.23], [103000000, 0.24], [125000000, 0.25], [157000000, 0.26],
    [206000000, 0.27], [337000000, 0.28], [454000000, 0.29], [550000000, 0.30],
    [695000000, 0.31], [910000000, 0.32], [1400000000, 0.33], [Infinity, 0.34],
  ],
  B: [
    [6200000, 0], [6500000, 0.0025], [6850000, 0.005], [7300000, 0.0075],
    [9200000, 0.01], [10750000, 0.015], [11250000, 0.02], [11600000, 0.025],
    [12600000, 0.03], [13600000, 0.04], [14950000, 0.05], [16400000, 0.06],
    [18450000, 0.07], [21850000, 0.08], [26000000, 0.09], [27700000, 0.10],
    [29350000, 0.11], [31450000, 0.12], [33950000, 0.13], [37100000, 0.14],
    [41100000, 0.15], [45800000, 0.16], [49500000, 0.17], [53800000, 0.18],
    [58500000, 0.19], [64000000, 0.20], [71000000, 0.21], [80000000, 0.22],
    [93000000, 0.23], [109000000, 0.24], [129000000, 0.25], [163000000, 0.26],
    [211000000, 0.27], [374000000, 0.28], [459000000, 0.29], [555000000, 0.30],
    [704000000, 0.31], [957000000, 0.32], [1405000000, 0.33], [Infinity, 0.34],
  ],
  C: [
    [6600000, 0], [6950000, 0.0025], [7350000, 0.005], [7800000, 0.0075],
    [8850000, 0.01], [9800000, 0.0125], [10950000, 0.015], [11200000, 0.0175],
    [12050000, 0.02], [12950000, 0.03], [14150000, 0.04], [15550000, 0.05],
    [17050000, 0.06], [19500000, 0.07], [22700000, 0.08], [26600000, 0.09],
    [28100000, 0.10], [30100000, 0.11], [32600000, 0.12], [35400000, 0.13],
    [38900000, 0.14], [43000000, 0.15], [47400000, 0.16], [51200000, 0.17],
    [55800000, 0.18], [60400000, 0.19], [66700000, 0.20], [74500000, 0.21],
    [83200000, 0.22], [95600000, 0.23], [110000000, 0.24], [134000000, 0.25],
    [169000000, 0.26], [221000000, 0.27], [390000000, 0.28], [463000000, 0.29],
    [561000000, 0.30], [709000000, 0.31], [965000000, 0.32], [1419000000, 0.33],
    [Infinity, 0.34],
  ],
};

// Bracket PPh21 progresif tahunan (Pasal 17 ayat 1 huruf a UU PPh jo. UU HPP).
// Dipakai HANYA untuk rekonsiliasi Masa Pajak Terakhir (Desember).
const TAX_BRACKETS = [
  { upTo: 60000000, rate: 0.05 },
  { upTo: 250000000, rate: 0.15 },
  { upTo: 500000000, rate: 0.25 },
  { upTo: 5000000000, rate: 0.3 },
  { upTo: Infinity, rate: 0.35 },
];

function calcBiayaJabatan(grossMonthly) {
  const capMonthly = 500000; // maks Rp500.000/bulan (Rp6.000.000/tahun)
  return Math.min(grossMonthly * 0.05, capMonthly);
}

function calcAnnualTaxFromPkp(pkpAnnual) {
  let remaining = Math.max(pkpAnnual, 0);
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of TAX_BRACKETS) {
    const bracketSize = bracket.upTo - lowerBound;
    const taxableInBracket = Math.max(Math.min(remaining, bracketSize), 0);
    tax += taxableInBracket * bracket.rate;
    remaining -= taxableInBracket;
    lowerBound = bracket.upTo;
    if (remaining <= 0) break;
  }
  return tax;
}

function getTerRate(category, bruto) {
  const table = TER_TABLE[category] || TER_TABLE.A;
  for (const [upTo, rate] of table) {
    if (bruto <= upTo) return rate;
  }
  return table[table.length - 1][1];
}

function calcBpjs(grossMonthly, settings = {}) {
  const kesEmployeeRate = (settings.bpjsKesehatanEmployeeRate ?? 1) / 100;
  const kesEmployerRate = (settings.bpjsKesehatanEmployerRate ?? 4) / 100;
  const kesCap = settings.bpjsKesehatanCap ?? 12000000;
  const kesBasis = Math.min(grossMonthly, kesCap);

  const jhtEmployeeRate = (settings.bpjsTkJhtEmployeeRate ?? 2) / 100;
  const jhtEmployerRate = (settings.bpjsTkJhtEmployerRate ?? 3.7) / 100;

  const jpEmployeeRate = (settings.bpjsTkJpEmployeeRate ?? 1) / 100;
  const jpEmployerRate = (settings.bpjsTkJpEmployerRate ?? 2) / 100;
  const jpCap = settings.bpjsTkJpCap ?? 10547400;
  const jpBasis = Math.min(grossMonthly, jpCap);

  const jkkRate = (settings.bpjsTkJkkRate ?? 0.24) / 100;
  const jkmRate = (settings.bpjsTkJkmRate ?? 0.3) / 100;

  const employee = {
    kesehatan: Math.round(kesBasis * kesEmployeeRate),
    jht: Math.round(grossMonthly * jhtEmployeeRate),
    jp: Math.round(jpBasis * jpEmployeeRate),
  };
  employee.total = employee.kesehatan + employee.jht + employee.jp;

  const employer = {
    kesehatan: Math.round(kesBasis * kesEmployerRate),
    jht: Math.round(grossMonthly * jhtEmployerRate),
    jp: Math.round(jpBasis * jpEmployerRate),
    jkk: Math.round(grossMonthly * jkkRate),
    jkm: Math.round(grossMonthly * jkmRate),
  };
  employer.total = employer.kesehatan + employer.jht + employer.jp + employer.jkk + employer.jkm;

  return { employee, employer };
}

function calcPph21Monthly({ grossMonthly, taxStatus = 'TK/0', hasNpwp = true }) {
  const info = PTKP_TABLE[taxStatus] || PTKP_TABLE['TK/0'];
  let rate = getTerRate(info.ter, Math.max(grossMonthly, 0));
  if (!hasNpwp) rate *= 1.2;
  return Math.round(grossMonthly * rate);
}

function calcPph21December({ grossMonths = [], employeePensionAnnual = 0, taxStatus = 'TK/0', alreadyWithheldJanNov = 0 }) {
  const grossAnnual = grossMonths.reduce((a, b) => a + (Number(b) || 0), 0);
  const biayaJabatanAnnual = Math.min(grossAnnual * 0.05, 6000000);
  const netAnnual = Math.max(grossAnnual - biayaJabatanAnnual - (Number(employeePensionAnnual) || 0), 0);
  const info = PTKP_TABLE[taxStatus] || PTKP_TABLE['TK/0'];
  let pkp = Math.max(netAnnual - info.annual, 0);
  pkp = Math.floor(pkp / 1000) * 1000;
  const taxAnnual = Math.round(calcAnnualTaxFromPkp(pkp));
  const pphDecember = Math.max(taxAnnual - (Number(alreadyWithheldJanNov) || 0), 0);
  return { grossAnnual, biayaJabatanAnnual, netAnnual, pkp, taxAnnual, pphDecember };
}

module.exports = {
  PTKP_TABLE,
  TER_TABLE,
  TAX_BRACKETS,
  calcBiayaJabatan,
  calcAnnualTaxFromPkp,
  getTerRate,
  calcBpjs,
  calcPph21Monthly,
  calcPph21December,
};
