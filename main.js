const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const Store = require('./store');
const { calcBpjs, calcPph21Monthly, calcPph21December } = require('./payroll-calc');
const { buildSlipHtml } = require('./slip-template');

let mainWindow;
let store;
let currentSession = null; // { id, username, name, role, employeeId } — set on login, cleared on logout

function requireLogin() {
  if (!currentSession) throw new Error('Belum login.');
}
function isAdmin() {
  return !!currentSession && currentSession.role === 'Admin';
}
function requireAdmin() {
  requireLogin();
  if (!isAdmin()) throw new Error('Akses ditolak. Hanya admin yang bisa melakukan ini.');
}
function ownEmployeeId() {
  return currentSession?.employeeId || null;
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1320,
    height: 840,
    minWidth: 1000,
    minHeight: 650,
    title: 'HR App — Offline',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(() => {
  store = new Store(app.getPath('userData'));
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

function registerIpcHandlers() {
  // ---------- Employees ----------
  ipcMain.handle('employees:getAll', () => {
    requireLogin();
    return isAdmin() ? store.getAll('employees') : store.getAll('employees').filter((e) => e.id === ownEmployeeId());
  });
  ipcMain.handle('employees:save', (e, emp) => {
    requireAdmin();
    return store.save('employees', emp);
  });
  ipcMain.handle('employees:delete', (e, id) => {
    requireAdmin();
    return store.remove('employees', id);
  });

  // ---------- Attendance ----------
  ipcMain.handle('attendance:getByDate', (e, date) => {
    requireAdmin();
    return store.query('attendance', (r) => r.date === date);
  });
  ipcMain.handle('attendance:getByEmployeeMonth', (e, { employeeId, month }) => {
    requireLogin();
    if (!isAdmin() && employeeId !== ownEmployeeId()) return [];
    return store.query('attendance', (r) => r.employeeId === employeeId && r.date.startsWith(month));
  });
  ipcMain.handle('attendance:getByMonth', (e, month) => {
    requireAdmin();
    return store.query('attendance', (r) => r.date.startsWith(month));
  });
  ipcMain.handle('attendance:saveBulk', (e, records) => {
    requireAdmin();
    records.forEach((r) => store.save('attendance', r));
    return true;
  });

  // ---------- Leave ----------
  ipcMain.handle('leave:getAll', () => {
    requireLogin();
    return isAdmin() ? store.getAll('leave') : store.query('leave', (r) => r.employeeId === ownEmployeeId());
  });
  ipcMain.handle('leave:save', (e, rec) => {
    requireLogin();
    if (rec.id) {
      // Editing an existing record (e.g. approve/reject) — Admin only.
      requireAdmin();
      return store.save('leave', rec);
    }
    // New submission — Staff can only submit for themselves, and only as Pending
    // (can't self-approve by passing a different status).
    if (!isAdmin()) {
      rec.employeeId = ownEmployeeId();
      rec.status = 'Pending';
    }
    return store.save('leave', rec);
  });
  ipcMain.handle('leave:delete', (e, id) => {
    requireAdmin();
    return store.remove('leave', id);
  });

  // ---------- Payroll ----------
  ipcMain.handle('payroll:getByPeriod', (e, period) => {
    requireLogin();
    const records = store.query('payroll', (r) => r.period === period);
    return isAdmin() ? records : records.filter((r) => r.employeeId === ownEmployeeId());
  });
  ipcMain.handle('payroll:getAll', () => {
    requireLogin();
    return isAdmin() ? store.getAll('payroll') : store.query('payroll', (r) => r.employeeId === ownEmployeeId());
  });
  ipcMain.handle('payroll:markPaid', (e, id) => {
    requireAdmin();
    const rec = store.getOne('payroll', id);
    if (!rec) return null;
    return store.save('payroll', { ...rec, status: 'Paid' });
  });

  ipcMain.handle('payroll:generate', (e, period) => {
    requireAdmin();
    const settings = store.getSettings();
    const workDays = Number(settings.workDaysPerMonth) || 25;
    const employees = store.getAll('employees').filter((emp) => emp.status !== 'Nonaktif');
    const monthAtt = store.query('attendance', (r) => r.date.startsWith(period));
    const existingForPeriod = store.query('payroll', (r) => r.period === period);
    const year = period.slice(0, 4);
    const isDecember = period.endsWith('-12');

    return employees.map((emp) => {
      const empAtt = monthAtt.filter((a) => a.employeeId === emp.id);
      const alphaDays = empAtt.filter((a) => a.status === 'Alpha').length;
      const dailyRate = (Number(emp.baseSalary) || 0) / workDays;
      const attendanceDeduction = Math.round(alphaDays * dailyRate);

      const baseSalary = Number(emp.baseSalary) || 0;
      const allowance = Number(emp.allowance) || 0;
      const grossSalary = baseSalary + allowance;

      let bpjsEmployee = { kesehatan: 0, jht: 0, jp: 0, total: 0 };
      let bpjsEmployer = { kesehatan: 0, jht: 0, jp: 0, jkk: 0, jkm: 0, total: 0 };
      if (settings.enableBpjs) {
        const bpjs = calcBpjs(grossSalary, settings);
        bpjsEmployee = bpjs.employee;
        bpjsEmployer = bpjs.employer;
      }

      // Premi JKK+JKM yang dibayar perusahaan ikut jadi penghasilan bruto kena pajak
      // karyawan (PMK 168/2023). Pengurang absen (Alpha) sudah mencerminkan penghasilan
      // riil yang diterima bulan itu, jadi ikut dikurangkan dari bruto kena pajak juga.
      const taxableGross = Math.max(grossSalary - attendanceDeduction + bpjsEmployer.jkk + bpjsEmployer.jkm, 0);

      let pph21 = 0;
      let pph21Detail = null;
      if (settings.enablePph21) {
        if (isDecember) {
          const priorMonths = store
            .query('payroll', (r) => r.employeeId === emp.id && r.period.startsWith(`${year}-`) && r.period < period)
            .map((r) => r.taxableGross ?? r.grossSalary ?? 0);
          const priorWithheld = store
            .query('payroll', (r) => r.employeeId === emp.id && r.period.startsWith(`${year}-`) && r.period < period)
            .reduce((sum, r) => sum + (r.pph21 || 0), 0);
          const employeePensionAnnual = store
            .query('payroll', (r) => r.employeeId === emp.id && r.period.startsWith(`${year}-`) && r.period < period)
            .reduce((sum, r) => sum + ((r.bpjsEmployee && r.bpjsEmployee.jp) || 0), 0) + bpjsEmployee.jp;

          pph21Detail = calcPph21December({
            grossMonths: [...priorMonths, taxableGross],
            employeePensionAnnual,
            taxStatus: emp.taxStatus || 'TK/0',
            alreadyWithheldJanNov: priorWithheld,
          });
          pph21 = pph21Detail.pphDecember;
        } else {
          pph21 = calcPph21Monthly({
            grossMonthly: taxableGross,
            taxStatus: emp.taxStatus || 'TK/0',
            hasNpwp: emp.hasNpwp !== false,
          });
        }
      }

      const totalDeductions = attendanceDeduction + bpjsEmployee.total + pph21;
      const netSalary = Math.max(grossSalary - totalDeductions, 0);
      const prior = existingForPeriod.find((p) => p.employeeId === emp.id);

      return store.save('payroll', {
        id: prior?.id,
        employeeId: emp.id,
        period,
        baseSalary,
        allowance,
        grossSalary,
        taxableGross,
        attendanceDeduction,
        bpjsEmployee,
        bpjsEmployer,
        pph21,
        pph21Method: isDecember ? 'Pasal17-Desember' : 'TER',
        pph21Detail,
        totalDeductions,
        netSalary,
        status: prior?.status || 'Draft',
        generatedAt: new Date().toISOString(),
      });
    });
  });

  ipcMain.handle('payroll:printSlip', async (e, payrollId) => {
    requireLogin();
    const payroll = store.getOne('payroll', payrollId);
    if (!payroll) return null;
    if (!isAdmin() && payroll.employeeId !== ownEmployeeId()) {
      throw new Error('Akses ditolak.');
    }
    const employee = store.getOne('employees', payroll.employeeId);
    const settings = store.getSettings();
    const html = buildSlipHtml(payroll, employee, settings);

    const slipWin = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
    try {
      await slipWin.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html));
      const pdfBuffer = await slipWin.webContents.printToPDF({
        printBackground: true,
        pageSize: 'A4',
      });
      slipWin.close();

      const safeName = (employee?.name || 'karyawan').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
      const defaultName = `Slip_Gaji_${safeName}_${payroll.period}.pdf`;
      const saveResult = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultName,
        filters: [{ name: 'PDF', extensions: ['pdf'] }],
      });
      if (saveResult.canceled || !saveResult.filePath) return null;
      fs.writeFileSync(saveResult.filePath, pdfBuffer);
      shell.showItemInFolder(saveResult.filePath);
      return saveResult.filePath;
    } catch (err) {
      if (!slipWin.isDestroyed()) slipWin.close();
      console.error('Failed to generate payslip PDF', err);
      throw err;
    }
  });

  ipcMain.handle('payroll:printAllSlips', async (e, period) => {
    requireAdmin();
    const records = store.query('payroll', (r) => r.period === period);
    if (!records.length) return { success: false, error: 'Belum ada payroll untuk periode ini.' };

    const folderResult = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (folderResult.canceled || !folderResult.filePaths.length) return { success: false, canceled: true };
    const destDir = folderResult.filePaths[0];

    const settings = store.getSettings();
    const slipWin = new BrowserWindow({ show: false, webPreferences: { offscreen: false } });
    let count = 0;
    const failed = [];
    try {
      for (const payroll of records) {
        const employee = store.getOne('employees', payroll.employeeId);
        try {
          const html = buildSlipHtml(payroll, employee, settings);
          await slipWin.loadURL('data:text/html;charset=UTF-8,' + encodeURIComponent(html));
          const pdfBuffer = await slipWin.webContents.printToPDF({ printBackground: true, pageSize: 'A4' });
          const safeName = (employee?.name || 'karyawan').replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_');
          fs.writeFileSync(path.join(destDir, `Slip_Gaji_${safeName}_${payroll.period}.pdf`), pdfBuffer);
          count++;
        } catch (err) {
          console.error('Failed to generate payslip for', employee?.name, err);
          failed.push(employee?.name || payroll.employeeId);
        }
      }
    } finally {
      if (!slipWin.isDestroyed()) slipWin.close();
    }

    shell.openPath(destDir);
    return { success: true, count, total: records.length, failed, folder: destDir };
  });

  // ---------- Documents ----------
  ipcMain.handle('documents:getByEmployee', (e, employeeId) => {
    requireAdmin();
    return store.query('documents', (r) => r.employeeId === employeeId);
  });
  ipcMain.handle('documents:upload', async (e, { employeeId, category }) => {
    requireAdmin();
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openFile'] });
    if (result.canceled || !result.filePaths.length) return null;
    const srcPath = result.filePaths[0];
    const fileName = path.basename(srcPath);
    const destDir = path.join(app.getPath('userData'), 'documents', employeeId);
    fs.mkdirSync(destDir, { recursive: true });
    const destPath = path.join(destDir, `${Date.now()}_${fileName}`);
    fs.copyFileSync(srcPath, destPath);
    const doc = {
      employeeId,
      fileName,
      category: category || 'Lainnya',
      storedPath: destPath,
      uploadedAt: new Date().toISOString(),
    };
    return store.save('documents', doc);
  });
  ipcMain.handle('documents:open', (e, storedPath) => {
    requireAdmin();
    return shell.openPath(storedPath);
  });
  ipcMain.handle('documents:delete', (e, id) => {
    requireAdmin();
    const doc = store.getOne('documents', id);
    if (doc && fs.existsSync(doc.storedPath)) {
      try {
        fs.unlinkSync(doc.storedPath);
      } catch (err) {
        console.error('Failed to delete file on disk', err);
      }
    }
    return store.remove('documents', id);
  });

  // ---------- Auth / Users ----------
  ipcMain.handle('auth:hasUsers', () => store.getAll('users').length > 0);

  ipcMain.handle('auth:setupFirstAdmin', (e, { username, password, name }) => {
    if (store.getAll('users').length > 0) {
      return { success: false, error: 'Sudah ada akun terdaftar.' };
    }
    if (!username || !password || password.length < 4) {
      return { success: false, error: 'Username wajib diisi, password minimal 4 karakter.' };
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const user = store.save('users', {
      username: username.trim().toLowerCase(),
      passwordHash,
      salt,
      role: 'Admin',
      name: name?.trim() || username,
      employeeId: null,
      createdAt: new Date().toISOString(),
    });
    currentSession = sanitizeUser(user);
    return { success: true, user: currentSession };
  });

  ipcMain.handle('auth:login', (e, { username, password }) => {
    const user = store.getAll('users').find((u) => u.username === (username || '').trim().toLowerCase());
    if (!user) return { success: false, error: 'Username tidak ditemukan.' };
    const hash = hashPassword(password || '', user.salt);
    if (hash !== user.passwordHash) return { success: false, error: 'Password salah.' };
    currentSession = sanitizeUser(user);
    return { success: true, user: currentSession };
  });

  ipcMain.handle('auth:logout', () => {
    currentSession = null;
    return true;
  });

  ipcMain.handle('auth:listUsers', () => {
    requireAdmin();
    return store.getAll('users').map(sanitizeUser);
  });

  ipcMain.handle('auth:createUser', (e, { username, password, role, name, employeeId }) => {
    requireAdmin();
    if (!username || !password || password.length < 4) {
      return { success: false, error: 'Username wajib diisi, password minimal 4 karakter.' };
    }
    const uname = username.trim().toLowerCase();
    const exists = store.getAll('users').some((u) => u.username === uname);
    if (exists) return { success: false, error: 'Username sudah dipakai.' };
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(password, salt);
    const user = store.save('users', {
      username: uname,
      passwordHash,
      salt,
      role: role === 'Admin' ? 'Admin' : 'Staff',
      name: name?.trim() || username,
      employeeId: employeeId || null,
      createdAt: new Date().toISOString(),
    });
    return { success: true, user: sanitizeUser(user) };
  });

  ipcMain.handle('auth:deleteUser', (e, id) => {
    requireAdmin();
    const target = store.getOne('users', id);
    if (!target) return { success: false, error: 'Pengguna tidak ditemukan.' };
    const remainingAdmins = store
      .getAll('users')
      .filter((u) => u.role === 'Admin' && u.id !== id);
    if (target.role === 'Admin' && remainingAdmins.length === 0) {
      return { success: false, error: 'Tidak bisa menghapus admin terakhir — minimal harus ada 1 admin.' };
    }
    store.remove('users', id);
    return { success: true };
  });

  ipcMain.handle('auth:resetPassword', (e, { id, newPassword }) => {
    requireAdmin();
    const user = store.getOne('users', id);
    if (!user) return { success: false, error: 'User tidak ditemukan.' };
    if (!newPassword || newPassword.length < 4) {
      return { success: false, error: 'Password minimal 4 karakter.' };
    }
    const salt = crypto.randomBytes(16).toString('hex');
    const passwordHash = hashPassword(newPassword, salt);
    store.save('users', { ...user, salt, passwordHash });
    return { success: true };
  });

  // ---------- Settings / Backup ----------
  ipcMain.handle('settings:get', () => store.getSettings());
  ipcMain.handle('settings:save', (e, s) => {
    requireAdmin();
    return store.saveSettings(s);
  });
  ipcMain.handle('backup:export', async () => {
    requireAdmin();
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] });
    if (result.canceled || !result.filePaths.length) return null;
    return store.backupTo(result.filePaths[0]);
  });
  ipcMain.handle('backup:getDataPath', () => {
    requireAdmin();
    return app.getPath('userData');
  });
}

function hashPassword(password, salt) {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
}

function sanitizeUser(u) {
  const { passwordHash, salt, ...rest } = u;
  return rest;
}
