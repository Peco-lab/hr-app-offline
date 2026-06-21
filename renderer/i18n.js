// i18n.js — minimal bilingual dictionary (ID/EN), no external library.
// Usage: t('key') returns the string in the current language (state.lang set by app.js).
// Data VALUES (status codes like "Hadir"/"Alpha", roles, leave types) are never translated
// here — only their DISPLAYED labels are, via the *_LABELS maps below, so stored data and
// filtering logic (`r.status === 'Alpha'`) stay stable regardless of UI language.

const DICT = {
  id: {
    // Nav / shell
    nav_dashboard: 'Dashboard', nav_employees: 'Karyawan', nav_attendance: 'Absensi',
    nav_leave: 'Cuti & Izin', nav_payroll: 'Payroll', nav_documents: 'Dokumen',
    nav_settings: 'Pengaturan', nav_profile: 'Profil Saya', logout: 'Keluar',
    loading: 'Memuat...',

    // Common
    save: 'Simpan', cancel: 'Batal', edit: 'Edit', delete: 'Hapus', open: 'Buka',
    name: 'Nama', position: 'Posisi', department: 'Departemen', status: 'Status',
    total: 'Total', period: 'Periode', days: 'Hari', reason: 'Alasan', type: 'Jenis',
    select_employee_ph: 'Pilih karyawan...', not_connected: '- Tidak terhubung -',
    export_csv: '⬇ Export CSV',

    // Dashboard
    greeting_sub: 'Begini ringkasan hari ini.',
    stat_active_employees: 'Total Karyawan Aktif',
    stat_active_sub: '{n} total termasuk nonaktif',
    stat_present_today: 'Hadir Hari Ini',
    stat_pending_leave: 'Pengajuan Cuti Pending',
    stat_pending_sub: 'Perlu di-review',
    stat_payroll_month: 'Payroll Bulan Ini',
    stat_payroll_sub: 'Karyawan sudah digenerate',
    card_missing_attendance: 'Karyawan Belum Absen Hari Ini',
    card_pending_leave: 'Cuti Menunggu Approval',
    all_attendance_done: 'Semua karyawan aktif sudah tercatat hari ini ✅',
    no_pending_leave: 'Tidak ada pengajuan pending 👍',
    view: 'Lihat',

    // Employees
    employees_add: '+ Tambah Karyawan',
    employees_empty_title: 'Belum ada karyawan',
    employees_empty_sub: 'Klik "+ Tambah Karyawan" untuk mulai mendata tim kamu.',
    col_join_date: 'Tgl Masuk', col_base_salary: 'Gaji Pokok',
    emp_form_edit: 'Edit Karyawan', emp_form_add: 'Tambah Karyawan',
    emp_full_name: 'Nama Lengkap', emp_position: 'Posisi / Jabatan',
    emp_department: 'Departemen', emp_join_date: 'Tanggal Masuk',
    emp_status_active: 'Aktif', emp_status_inactive: 'Nonaktif',
    emp_base_salary: 'Gaji Pokok (per bulan)', emp_allowance: 'Tunjangan (per bulan)',
    emp_nik: 'NIK', emp_bank_account: 'No. Rekening Bank',
    emp_tax_status: 'Status Pajak (PTKP)', emp_has_npwp: 'Punya NPWP?',
    emp_npwp_yes: 'Ya', emp_npwp_no: 'Belum (PPh21 +20%)', emp_phone: 'Telepon',
    toast_emp_saved: 'Data karyawan disimpan',
    confirm_emp_delete: 'Hapus karyawan ini? Data absensi/cuti terkait tidak otomatis terhapus.',
    toast_emp_deleted: 'Karyawan dihapus',

    // Attendance
    att_save_today: 'Simpan Absensi Hari Ini',
    col_clock_in: 'Jam Masuk', col_clock_out: 'Jam Keluar', col_notes: 'Catatan',
    opsional: 'opsional',
    att_no_active_employees: 'Belum ada karyawan aktif.',
    att_monthly_recap: 'Rekap Bulanan',
    att_pick_to_view: 'Pilih karyawan & bulan untuk lihat rekap.',
    toast_att_saved: 'Absensi tersimpan',
    csv_att_headers: 'Nama,Tanggal,Jam Masuk,Jam Keluar,Status,Catatan',

    // Leave
    leave_add: '+ Ajukan Cuti/Izin',
    leave_empty_title: 'Belum ada pengajuan',
    leave_empty_sub: 'Cuti & izin yang diajukan tim akan muncul di sini.',
    approve: 'Approve', reject: 'Tolak',
    leave_balance_title: 'Sisa Cuti Tahunan ({year})',
    col_quota_year: 'Jatah/Tahun', col_used: 'Terpakai', col_remaining: 'Sisa',
    leave_form_title: 'Ajukan Cuti / Izin', leave_employee: 'Karyawan',
    leave_start: 'Tanggal Mulai', leave_end: 'Tanggal Selesai',
    leave_submit: 'Ajukan', toast_leave_submitted: 'Pengajuan dikirim',
    toast_leave_approved: 'Cuti disetujui', toast_leave_rejected: 'Cuti ditolak',
    confirm_leave_delete: 'Hapus pengajuan ini?',
    my_leave_title: 'Cuti & Izin Saya', no_leave_yet: 'Belum ada pengajuan.',

    // Payroll
    payroll_generate: 'Generate Payroll Bulan Ini',
    col_gross: 'Gaji Kotor', col_bpjs_employee: 'BPJS Karyawan', col_pph21: 'PPh21',
    col_att_deduction: 'Potongan Absen', col_net: 'Gaji Bersih',
    print_slip: '🖨 Slip', print_slip_pdf: '🖨 Cetak PDF', mark_paid: 'Tandai Paid',
    print_all_slips: '🖨 Cetak Semua Slip',
    toast_building_all_pdf: 'Membuat semua PDF slip gaji... mohon tunggu',
    toast_all_slips_done: '{count}/{total} slip gaji disimpan ke: {folder}',
    toast_all_slips_failed: 'Sebagian gagal dibuat: {names}',
    alert_no_payroll_for_period: 'Belum ada payroll untuk periode ini.',
    badge_paid: 'Paid', badge_draft: 'Draft',
    payroll_empty_title: 'Belum ada payroll bulan ini',
    payroll_empty_sub: 'Klik "Generate Payroll Bulan Ini" untuk menghitung gaji semua karyawan aktif.',
    payroll_tax_off_note: 'BPJS & PPh21 belum diaktifkan — nyalakan di Pengaturan kalau mau hitung otomatis.',
    toast_payroll_generated: 'Payroll digenerate',
    toast_marked_paid: 'Ditandai sudah dibayar',
    toast_building_pdf: 'Membuat PDF slip gaji...',
    toast_slip_saved: 'Slip gaji disimpan: ',
    toast_slip_failed: 'Gagal membuat PDF slip gaji',
    my_payslip_title: 'Slip Gaji Saya', no_payslip_yet: 'Belum ada slip gaji.',

    // Documents
    doc_upload: '+ Upload Dokumen',
    doc_pick_employee: 'Pilih karyawan untuk melihat dokumen.',
    doc_category_prompt: 'Kategori dokumen (contoh: KTP, Kontrak Kerja, Ijazah, NPWP):',
    doc_category_other: 'Lainnya',
    toast_doc_added: 'Dokumen ditambahkan',
    col_filename: 'Nama File', col_category: 'Kategori', col_upload_date: 'Tanggal Upload',
    confirm_doc_delete: 'Hapus dokumen ini dari penyimpanan lokal?',
    toast_doc_deleted: 'Dokumen dihapus',
    doc_empty_title: 'Belum ada dokumen',
    doc_empty_sub: 'KTP, kontrak, atau ijazah karyawan ini bisa di-upload di sini.',

    // Settings
    settings_company_info: 'Informasi Perusahaan',
    settings_company_name: 'Nama Perusahaan', settings_company_address: 'Alamat Perusahaan',
    settings_leave_quota: 'Jatah Cuti Tahunan (hari/tahun)',
    settings_workdays: 'Hari Kerja per Bulan (untuk hitung potongan absen)',
    settings_tax_bpjs: 'Pajak & BPJS',
    settings_tax_disclaimer: 'Tarif/batas BPJS & PPh21 diatur pemerintah dan bisa berubah. Nilai default di bawah adalah yang umum berlaku — cek ulang ke sumber resmi (DJP / BPJS Kesehatan / BPJS Ketenagakerjaan) secara berkala. Ini adalah estimator, bukan nasihat pajak resmi.',
    settings_enable_bpjs: 'Aktifkan Potongan BPJS',
    settings_enable_pph21: 'Aktifkan Potongan PPh21',
    settings_save: 'Simpan Pengaturan',
    settings_backup_title: 'Backup & Lokasi Data',
    settings_backup_desc: 'Semua data tersimpan 100% lokal di komputer ini, tidak ada koneksi internet/cloud sama sekali. Backup otomatis (10 versi terakhir) dibuat tiap kali ada perubahan data. Disarankan export manual secara berkala ke USB/drive eksternal.',
    settings_backup_btn: '📦 Export Backup ke Folder...',
    toast_settings_saved: 'Pengaturan disimpan',
    toast_backup_saved: 'Backup disimpan ke: ',
    settings_users_title: 'Kelola Pengguna',
    settings_users_desc: 'Akun untuk login ke aplikasi ini (Admin = akses penuh, Staff = hanya lihat data diri sendiri)',
    user_add: '+ Tambah Pengguna',
    col_username: 'Username', col_role: 'Role', col_linked_employee: 'Terhubung ke Karyawan',
    reset_password: 'Reset Password',
    users_empty: 'Belum ada pengguna.',
    user_form_title: 'Tambah Pengguna', user_password: 'Password',
    role_staff_label: 'Staff (hanya data diri sendiri)', role_admin_label: 'Admin (akses penuh)',
    user_link_employee: 'Hubungkan ke Karyawan (opsional)',
    toast_user_added: 'Pengguna ditambahkan',
    confirm_user_delete: 'Hapus pengguna ini? Mereka tidak akan bisa login lagi.',
    toast_user_deleted: 'Pengguna dihapus',
    prompt_new_password: 'Password baru (minimal 4 karakter):',
    toast_password_changed: 'Password diganti',
    alert_password_failed: 'Gagal mengganti password',
    alert_user_create_failed: 'Gagal membuat pengguna',
    alert_user_delete_failed: 'Gagal menghapus pengguna.',

    // Profile (staff self-service)
    profile_no_link: 'Akun Anda belum terhubung ke data karyawan. Hubungi Admin untuk menghubungkan akun ini.',
    profile_attendance_month: 'Absensi Bulan Ini ({month})',

    // Auth
    auth_tagline: '"Semua absensi, cuti, dan slip gaji — tersimpan rapi di laptop sendiri."',
    auth_h1: 'Urus karyawan, gak perlu pusing.',
    auth_feature_1: '🕒 Absensi & rekap bulanan',
    auth_feature_2: '💰 Payroll otomatis (BPJS + PPh21)',
    auth_feature_3: '📁 Dokumen karyawan tersimpan rapi',
    auth_feature_4: '🔒 100% offline — tidak ada data ke cloud',
    auth_footer: 'HR App · Offline Edition',
    auth_welcome: 'Selamat Datang 👋',
    auth_setup_sub: 'Belum ada akun. Buat akun Admin pertama untuk mulai memakai aplikasi ini.',
    auth_create_account: 'Buat Akun & Masuk',
    auth_login_sub: 'Masukkan username & password untuk mengakses aplikasi.',
    auth_login_btn: 'Masuk',
    auth_generic_error: 'Terjadi kesalahan.',
    username: 'Username', password: 'Password',

    // Status / type value labels (display-only — stored values stay as-is)
    status_Hadir: 'Hadir', status_Sakit: 'Sakit', status_Izin: 'Izin',
    status_Cuti: 'Cuti', status_Alpha: 'Alpha',
    leavetype_CutiTahunan: 'Cuti Tahunan', leavetype_Sakit: 'Sakit', leavetype_Izin: 'Izin',
    leavetype_TanpaTanggungan: 'Cuti di Luar Tanggungan',
  },

  en: {
    nav_dashboard: 'Dashboard', nav_employees: 'Employees', nav_attendance: 'Attendance',
    nav_leave: 'Leave', nav_payroll: 'Payroll', nav_documents: 'Documents',
    nav_settings: 'Settings', nav_profile: 'My Profile', logout: 'Log Out',
    loading: 'Loading...',

    save: 'Save', cancel: 'Cancel', edit: 'Edit', delete: 'Delete', open: 'Open',
    name: 'Name', position: 'Position', department: 'Department', status: 'Status',
    total: 'Total', period: 'Period', days: 'Days', reason: 'Reason', type: 'Type',
    select_employee_ph: 'Select employee...', not_connected: '- Not linked -',
    export_csv: '⬇ Export CSV',

    greeting_sub: "Here's today's summary.",
    stat_active_employees: 'Active Employees',
    stat_active_sub: '{n} total incl. inactive',
    stat_present_today: 'Present Today',
    stat_pending_leave: 'Pending Leave Requests',
    stat_pending_sub: 'Needs review',
    stat_payroll_month: "This Month's Payroll",
    stat_payroll_sub: 'Employees generated',
    card_missing_attendance: "Employees Without Today's Attendance",
    card_pending_leave: 'Leave Awaiting Approval',
    all_attendance_done: 'All active employees are checked in today ✅',
    no_pending_leave: 'No pending requests 👍',
    view: 'View',

    employees_add: '+ Add Employee',
    employees_empty_title: 'No employees yet',
    employees_empty_sub: 'Click "+ Add Employee" to start building your team list.',
    col_join_date: 'Join Date', col_base_salary: 'Base Salary',
    emp_form_edit: 'Edit Employee', emp_form_add: 'Add Employee',
    emp_full_name: 'Full Name', emp_position: 'Position / Title',
    emp_department: 'Department', emp_join_date: 'Join Date',
    emp_status_active: 'Active', emp_status_inactive: 'Inactive',
    emp_base_salary: 'Base Salary (per month)', emp_allowance: 'Allowance (per month)',
    emp_nik: 'National ID (NIK)', emp_bank_account: 'Bank Account No.',
    emp_tax_status: 'Tax Status (PTKP)', emp_has_npwp: 'Has Tax ID (NPWP)?',
    emp_npwp_yes: 'Yes', emp_npwp_no: 'No (+20% income tax)', emp_phone: 'Phone',
    toast_emp_saved: 'Employee saved',
    confirm_emp_delete: "Delete this employee? Related attendance/leave records won't be deleted automatically.",
    toast_emp_deleted: 'Employee deleted',

    att_save_today: "Save Today's Attendance",
    col_clock_in: 'Clock In', col_clock_out: 'Clock Out', col_notes: 'Notes',
    opsional: 'optional',
    att_no_active_employees: 'No active employees yet.',
    att_monthly_recap: 'Monthly Recap',
    att_pick_to_view: 'Pick an employee & month to see the recap.',
    toast_att_saved: 'Attendance saved',
    csv_att_headers: 'Name,Date,Clock In,Clock Out,Status,Notes',

    leave_add: '+ Request Leave',
    leave_empty_title: 'No requests yet',
    leave_empty_sub: "Your team's leave & permission requests will show up here.",
    approve: 'Approve', reject: 'Reject',
    leave_balance_title: 'Annual Leave Balance ({year})',
    col_quota_year: 'Quota/Year', col_used: 'Used', col_remaining: 'Remaining',
    leave_form_title: 'Request Leave / Permission', leave_employee: 'Employee',
    leave_start: 'Start Date', leave_end: 'End Date',
    leave_submit: 'Submit', toast_leave_submitted: 'Request submitted',
    toast_leave_approved: 'Leave approved', toast_leave_rejected: 'Leave rejected',
    confirm_leave_delete: 'Delete this request?',
    my_leave_title: 'My Leave & Permissions', no_leave_yet: 'No requests yet.',

    payroll_generate: 'Generate This Month\u2019s Payroll',
    col_gross: 'Gross Salary', col_bpjs_employee: 'BPJS (Employee)', col_pph21: 'Income Tax',
    col_att_deduction: 'Attendance Deduction', col_net: 'Net Salary',
    print_slip: '🖨 Slip', print_slip_pdf: '🖨 Print PDF', mark_paid: 'Mark as Paid',
    print_all_slips: '🖨 Print All Payslips',
    toast_building_all_pdf: 'Building all payslip PDFs... please wait',
    toast_all_slips_done: '{count}/{total} payslips saved to: {folder}',
    toast_all_slips_failed: 'Some failed to generate: {names}',
    alert_no_payroll_for_period: 'No payroll for this period yet.',
    badge_paid: 'Paid', badge_draft: 'Draft',
    payroll_empty_title: "No payroll for this month yet",
    payroll_empty_sub: 'Click "Generate This Month\u2019s Payroll" to calculate pay for all active employees.',
    payroll_tax_off_note: 'BPJS & income tax are turned off — enable them in Settings to auto-calculate.',
    toast_payroll_generated: 'Payroll generated',
    toast_marked_paid: 'Marked as paid',
    toast_building_pdf: 'Building payslip PDF...',
    toast_slip_saved: 'Payslip saved: ',
    toast_slip_failed: 'Failed to build payslip PDF',
    my_payslip_title: 'My Payslips', no_payslip_yet: 'No payslips yet.',

    doc_upload: '+ Upload Document',
    doc_pick_employee: 'Select an employee to view documents.',
    doc_category_prompt: 'Document category (e.g. National ID, Contract, Diploma, Tax ID):',
    doc_category_other: 'Other',
    toast_doc_added: 'Document added',
    col_filename: 'File Name', col_category: 'Category', col_upload_date: 'Upload Date',
    confirm_doc_delete: 'Delete this document from local storage?',
    toast_doc_deleted: 'Document deleted',
    doc_empty_title: 'No documents yet',
    doc_empty_sub: "This employee's ID, contract, or diploma can be uploaded here.",

    settings_company_info: 'Company Info',
    settings_company_name: 'Company Name', settings_company_address: 'Company Address',
    settings_leave_quota: 'Annual Leave Quota (days/year)',
    settings_workdays: 'Working Days per Month (for attendance deduction)',
    settings_tax_bpjs: 'Tax & BPJS',
    settings_tax_disclaimer: 'BPJS & income tax rates/caps are set by the government and can change. The defaults below reflect common rates — always double-check against official sources (DJP / BPJS Kesehatan / BPJS Ketenagakerjaan) periodically. This is an estimator, not official tax advice.',
    settings_enable_bpjs: 'Enable BPJS Deductions',
    settings_enable_pph21: 'Enable Income Tax (PPh21) Deductions',
    settings_save: 'Save Settings',
    settings_backup_title: 'Backup & Data Location',
    settings_backup_desc: 'All data stays 100% local on this computer — no internet/cloud connection at all. Automatic backups (last 10 versions) are made on every data change. Manual export to a USB/external drive periodically is recommended.',
    settings_backup_btn: '📦 Export Backup to Folder...',
    toast_settings_saved: 'Settings saved',
    toast_backup_saved: 'Backup saved to: ',
    settings_users_title: 'Manage Users',
    settings_users_desc: 'Accounts for logging into this app (Admin = full access, Staff = own data only)',
    user_add: '+ Add User',
    col_username: 'Username', col_role: 'Role', col_linked_employee: 'Linked Employee',
    reset_password: 'Reset Password',
    users_empty: 'No users yet.',
    user_form_title: 'Add User', user_password: 'Password',
    role_staff_label: 'Staff (own data only)', role_admin_label: 'Admin (full access)',
    user_link_employee: 'Link to Employee (optional)',
    toast_user_added: 'User added',
    confirm_user_delete: "Delete this user? They won't be able to log in anymore.",
    toast_user_deleted: 'User deleted',
    prompt_new_password: 'New password (min. 4 characters):',
    toast_password_changed: 'Password changed',
    alert_password_failed: 'Failed to change password',
    alert_user_create_failed: 'Failed to create user',
    alert_user_delete_failed: 'Failed to delete user.',

    profile_no_link: "Your account isn't linked to an employee record yet. Ask an Admin to link it.",
    profile_attendance_month: 'Attendance This Month ({month})',

    auth_tagline: '"Attendance, leave, and payslips — neatly stored on your own laptop."',
    auth_h1: 'Manage your team, minus the headache.',
    auth_feature_1: '🕒 Attendance & monthly recap',
    auth_feature_2: '💰 Automatic payroll (BPJS + income tax)',
    auth_feature_3: '📁 Employee documents, neatly stored',
    auth_feature_4: '🔒 100% offline — nothing ever goes to the cloud',
    auth_footer: 'HR App · Offline Edition',
    auth_welcome: 'Welcome 👋',
    auth_setup_sub: 'No account yet. Create the first Admin account to start using the app.',
    auth_create_account: 'Create Account & Sign In',
    auth_login_sub: 'Enter your username & password to access the app.',
    auth_login_btn: 'Sign In',
    auth_generic_error: 'Something went wrong.',
    username: 'Username', password: 'Password',

    status_Hadir: 'Present', status_Sakit: 'Sick', status_Izin: 'Permission',
    status_Cuti: 'Leave', status_Alpha: 'Absent',
    leavetype_CutiTahunan: 'Annual Leave', leavetype_Sakit: 'Sick Leave', leavetype_Izin: 'Permission',
    leavetype_TanpaTanggungan: 'Unpaid Leave',
  },
};

function getLang() {
  return (window.state && window.state.lang) || 'id';
}

function t(key, vars) {
  const lang = getLang();
  let str = (DICT[lang] && DICT[lang][key]) ?? DICT.id[key] ?? key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

// Maps stored Indonesian data values -> translation keys, for display only.
const STATUS_KEY_MAP = { Hadir: 'status_Hadir', Sakit: 'status_Sakit', Izin: 'status_Izin', Cuti: 'status_Cuti', Alpha: 'status_Alpha' };
function statusLabel(status) {
  return t(STATUS_KEY_MAP[status] || status);
}

const LEAVE_TYPE_OPTIONS = [
  { value: 'Cuti Tahunan', key: 'leavetype_CutiTahunan' },
  { value: 'Sakit', key: 'leavetype_Sakit' },
  { value: 'Izin', key: 'leavetype_Izin' },
  { value: 'Cuti di Luar Tanggungan', key: 'leavetype_TanpaTanggungan' },
];
function leaveTypeLabel(value) {
  const found = LEAVE_TYPE_OPTIONS.find((o) => o.value === value);
  return found ? t(found.key) : value;
}
