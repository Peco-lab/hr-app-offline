// app.js — renderer process. Plain JS, no build step, no framework.
// Talks to the main process only through window.hrAPI (exposed in preload.js).
// `state` is declared with var (not const) so it's reachable as window.state,
// which i18n.js reads to know the current language.

var state = {
  view: 'dashboard',
  lang: 'id',
  currentUser: null,
  employees: [],
  attendance: [],
  leave: [],
  payroll: [],
  documents: [],
  settings: {
    companyName: 'Perusahaan Saya',
    annualLeaveQuota: 12,
    workDaysPerMonth: 25,
    enableBpjs: false,
    enablePph21: false,
    language: 'id',
  },
  attendanceDate: todayStr(),
  payrollPeriod: monthStr(),
  selectedDocEmployeeId: null,
};

// ---------------- utils ----------------
function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function monthStr(d = new Date()) {
  return d.toISOString().slice(0, 7);
}
function formatIDR(n) {
  n = Number(n) || 0;
  return 'Rp ' + n.toLocaleString('id-ID', { maximumFractionDigits: 0 });
}
function formatDateID(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const locale = getLang() === 'en' ? 'en-US' : 'id-ID';
  return d.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' });
}
function uid() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
function greetingText() {
  const h = new Date().getHours();
  const en = getLang() === 'en';
  if (h < 10) return en ? 'Good Morning ☀️' : 'Selamat Pagi ☀️';
  if (h < 15) return en ? 'Good Afternoon 🌤️' : 'Selamat Siang 🌤️';
  if (h < 18) return en ? 'Good Evening 🌇' : 'Selamat Sore 🌇';
  return en ? 'Good Night 🌙' : 'Selamat Malam 🌙';
}

const ICONS = {
  people: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><circle cx="17.3" cy="7.3" r="2.3"/><path d="M16 13.3c2.4.5 4 2.4 4 4.7"/></svg>`,
  calendar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><circle cx="9" cy="14" r="1"/><circle cx="9" cy="17.3" r="1"/><circle cx="12.5" cy="14" r="1"/><circle cx="16" cy="14" r="1"/></svg>`,
  folder: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 7.5a2 2 0 0 1 2-2h4l2 2.3h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/></svg>`,
  coins: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><ellipse cx="9" cy="7.3" rx="5.3" ry="2.8"/><path d="M3.7 7.3V13c0 1.55 2.37 2.8 5.3 2.8s5.3-1.25 5.3-2.8V7.3"/><path d="M3.7 10.15C3.7 11.7 6.07 13 9 13"/><ellipse cx="15.7" cy="14.2" rx="4.3" ry="2.2"/><path d="M11.4 14.2v2.9c0 1.2 1.92 2.2 4.3 2.2s4.3-1 4.3-2.2v-2.9"/></svg>`,
};
function emptyState(icon, title, sub) {
  return `<div class="empty-state">${ICONS[icon] || ''}<div class="empty-title">${title}</div><div class="empty-sub">${sub || ''}</div></div>`;
}
function el(html) {
  const tpl = document.createElement('template');
  tpl.innerHTML = html.trim();
  return tpl.content.firstChild;
}
function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2200);
}
function daysBetween(startStr, endStr) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const diff = Math.round((end - start) / 86400000) + 1;
  return Math.max(diff, 0);
}
function downloadCSV(filename, rows) {
  const csv = rows.map((r) => r.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function csvEscape(v) {
  const s = String(v ?? '');
  if (/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

// ---------------- modal ----------------
function openModal(html) {
  document.getElementById('modalBox').innerHTML = html;
  document.getElementById('modalBackdrop').classList.add('open');
}
function closeModal() {
  document.getElementById('modalBackdrop').classList.remove('open');
  document.getElementById('modalBox').innerHTML = '';
}
document.getElementById('modalBackdrop').addEventListener('click', (e) => {
  if (e.target.id === 'modalBackdrop') closeModal();
});

// ---------------- data loading ----------------
async function loadAll() {
  state.employees = await window.hrAPI.employees.getAll();
  state.leave = await window.hrAPI.leave.getAll();
  state.payroll = await window.hrAPI.payroll.getAll();
  state.settings = await window.hrAPI.settings.get();
  state.lang = state.settings.language || 'id';
  document.getElementById('brandCompany').textContent = state.settings.companyName || 'HR App';
}

function activeEmployees() {
  return state.employees.filter((e) => e.status !== 'Nonaktif');
}
function empName(id) {
  const e = state.employees.find((x) => x.id === id);
  return e ? e.name : `(${t('delete').toLowerCase()})`;
}

// ---------------- language ----------------
async function setLang(lang) {
  state.lang = lang;
  try {
    await window.hrAPI.settings.save({ language: lang });
  } catch (e) { /* not logged in yet — fine, applies to this session only */ }
  const authScreen = document.getElementById('authScreen');
  if (authScreen && !authScreen.classList.contains('hidden')) {
    renderAuthScreen();
  } else {
    renderNav();
    document.getElementById('viewTitle').textContent = viewTitles()[state.view];
    await render();
  }
}
function langToggleHtml() {
  return `
    <div class="lang-toggle">
      <button class="lang-btn ${state.lang === 'id' ? 'active' : ''}" data-lang="id">🇮🇩 ID</button>
      <button class="lang-btn ${state.lang === 'en' ? 'active' : ''}" data-lang="en">🇬🇧 EN</button>
    </div>
  `;
}
function wireLangToggle(container) {
  container.querySelectorAll('.lang-btn').forEach((btn) => {
    btn.onclick = () => setLang(btn.dataset.lang);
  });
}

// ---------------- navigation ----------------
function viewTitles() {
  return {
    dashboard: t('nav_dashboard'), employees: t('nav_employees'), attendance: t('nav_attendance'),
    leave: t('nav_leave'), payroll: t('nav_payroll'), documents: t('nav_documents'),
    settings: t('nav_settings'), profile: t('nav_profile'),
  };
}
function adminNav() {
  return [
    { view: 'dashboard', icon: '📊', label: t('nav_dashboard') },
    { view: 'employees', icon: '👤', label: t('nav_employees') },
    { view: 'attendance', icon: '🕒', label: t('nav_attendance') },
    { view: 'leave', icon: '📅', label: t('nav_leave') },
    { view: 'payroll', icon: '💰', label: t('nav_payroll') },
    { view: 'documents', icon: '📁', label: t('nav_documents') },
    { view: 'settings', icon: '⚙️', label: t('nav_settings') },
  ];
}
function staffNav() {
  return [{ view: 'profile', icon: '🙋', label: t('nav_profile') }];
}

function renderNav() {
  const items = state.currentUser?.role === 'Admin' ? adminNav() : staffNav();
  const navList = document.getElementById('navList');
  navList.innerHTML = items
    .map((it) => `<button class="nav-item ${it.view === state.view ? 'active' : ''}" data-view="${it.view}">${it.icon} ${it.label}</button>`)
    .join('');
  navList.querySelectorAll('.nav-item').forEach((btn) => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  const footer = document.getElementById('sidebarFooter');
  footer.innerHTML = `
    ${langToggleHtml()}
    <div class="user-chip">
      <div>
        <div class="name">${state.currentUser?.name || ''}</div>
        <div class="role">${state.currentUser?.role || ''}</div>
      </div>
      <button class="logout-btn" id="btnLogout">${t('logout')}</button>
    </div>
  `;
  wireLangToggle(footer);
  document.getElementById('btnLogout').onclick = logout;
}

async function switchView(view) {
  state.view = view;
  document.querySelectorAll('#navList .nav-item').forEach((b) => b.classList.toggle('active', b.dataset.view === view));
  document.getElementById('viewTitle').textContent = viewTitles()[view];
  await render();
}

async function render() {
  const root = document.getElementById('viewContent');
  const actions = document.getElementById('topbarActions');
  actions.innerHTML = '';
  root.innerHTML = `<div class="empty-state">${t('loading')}</div>`;

  switch (state.view) {
    case 'dashboard': return renderDashboard(root, actions);
    case 'employees': return renderEmployees(root, actions);
    case 'attendance': return renderAttendance(root, actions);
    case 'leave': return renderLeave(root, actions);
    case 'payroll': return renderPayroll(root, actions);
    case 'documents': return renderDocuments(root, actions);
    case 'settings': return renderSettings(root, actions);
    case 'profile': return renderProfile(root, actions);
  }
}

// ==================================================================
// DASHBOARD
// ==================================================================
async function renderDashboard(root, actions) {
  const todayAtt = await window.hrAPI.attendance.getByDate(todayStr());
  const active = activeEmployees();
  const presentToday = todayAtt.filter((a) => a.status === 'Hadir').length;
  const pendingLeave = state.leave.filter((l) => l.status === 'Pending').length;
  const thisMonthPayroll = state.payroll.filter((p) => p.period === monthStr());

  root.innerHTML = `
    <div class="greeting">${greetingText()}, ${state.currentUser?.name?.split(' ')[0] || ''}. ${t('greeting_sub')}</div>
    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">${t('stat_active_employees')}</div>
        <div class="value">${active.length}</div>
        <div class="sub">${t('stat_active_sub', { n: state.employees.length })}</div>
      </div>
      <div class="stat-card accent-teal">
        <div class="label">${t('stat_present_today')}</div>
        <div class="value">${presentToday} / ${active.length}</div>
        <div class="sub">${formatDateID(todayStr())}</div>
      </div>
      <div class="stat-card">
        <div class="label">${t('stat_pending_leave')}</div>
        <div class="value">${pendingLeave}</div>
        <div class="sub">${t('stat_pending_sub')}</div>
      </div>
      <div class="stat-card accent-gold">
        <div class="label">${t('stat_payroll_month')}</div>
        <div class="value">${thisMonthPayroll.length}/${active.length}</div>
        <div class="sub">${t('stat_payroll_sub')}</div>
      </div>
    </div>

    <div class="card">
      <h3>${t('card_missing_attendance')}</h3>
      ${renderMissingAttendanceTable(active, todayAtt)}
    </div>

    <div class="card">
      <h3>${t('card_pending_leave')}</h3>
      ${renderPendingLeaveTable()}
    </div>
  `;
}

function renderMissingAttendanceTable(active, todayAtt) {
  const presentIds = new Set(todayAtt.map((a) => a.employeeId));
  const missing = active.filter((e) => !presentIds.has(e.id));
  if (!missing.length) return `<div class="empty-state">${t('all_attendance_done')}</div>`;
  return `<table><thead><tr><th>${t('name')}</th><th>${t('position')}</th></tr></thead><tbody>
    ${missing.map((e) => `<tr><td>${e.name}</td><td>${e.position || '-'}</td></tr>`).join('')}
  </tbody></table>`;
}

function renderPendingLeaveTable() {
  const pending = state.leave.filter((l) => l.status === 'Pending');
  if (!pending.length) return `<div class="empty-state">${t('no_pending_leave')}</div>`;
  return `<table><thead><tr><th>${t('name')}</th><th>${t('type')}</th><th>${t('period')}</th><th>${t('days')}</th><th></th></tr></thead><tbody>
    ${pending
      .map(
        (l) => `<tr>
        <td>${empName(l.employeeId)}</td>
        <td>${leaveTypeLabel(l.type)}</td>
        <td>${formatDateID(l.startDate)} – ${formatDateID(l.endDate)}</td>
        <td>${daysBetween(l.startDate, l.endDate)}</td>
        <td><button class="btn btn-sm" onclick="switchView('leave')">${t('view')}</button></td>
      </tr>`
      )
      .join('')}
  </tbody></table>`;
}

// ==================================================================
// EMPLOYEES
// ==================================================================
async function renderEmployees(root, actions) {
  actions.innerHTML = `<button class="btn btn-primary" id="btnAddEmp">${t('employees_add')}</button>`;
  document.getElementById('btnAddEmp').onclick = () => openEmployeeForm();

  const rows = state.employees
    .map(
      (e) => `<tr>
      <td><strong>${e.name}</strong><br><span class="text-muted">${e.nik || ''}</span></td>
      <td>${e.position || '-'}</td>
      <td>${e.department || '-'}</td>
      <td>${formatDateID(e.joinDate)}</td>
      <td>${formatIDR(e.baseSalary)}</td>
      <td>${statusBadge(e.status)}</td>
      <td class="text-right">
        <button class="btn btn-sm" onclick="openEmployeeForm('${e.id}')">${t('edit')}</button>
        <button class="btn btn-sm btn-danger" onclick="deleteEmployee('${e.id}')">${t('delete')}</button>
      </td>
    </tr>`
    )
    .join('');

  root.innerHTML = `
    <div class="card">
      ${
        state.employees.length
          ? `<table><thead><tr>
            <th>${t('name')}</th><th>${t('position')}</th><th>${t('department')}</th><th>${t('col_join_date')}</th><th>${t('col_base_salary')}</th><th>${t('status')}</th><th></th>
          </tr></thead><tbody>${rows}</tbody></table>`
          : emptyState('people', t('employees_empty_title'), t('employees_empty_sub'))
      }
    </div>
  `;
}

function statusBadge(status) {
  if (status === 'Nonaktif') return `<span class="badge badge-gray">${t('emp_status_inactive')}</span>`;
  return `<span class="badge badge-green">${t('emp_status_active')}</span>`;
}

function openEmployeeForm(id) {
  const emp = id ? state.employees.find((e) => e.id === id) : null;
  openModal(`
    <h2>${emp ? t('emp_form_edit') : t('emp_form_add')}</h2>
    <form id="empForm">
      <div class="form-grid">
        <div class="form-group full">
          <label>${t('emp_full_name')}</label>
          <input name="name" required value="${emp?.name || ''}" />
        </div>
        <div class="form-group">
          <label>${t('emp_position')}</label>
          <input name="position" value="${emp?.position || ''}" />
        </div>
        <div class="form-group">
          <label>${t('emp_department')}</label>
          <input name="department" value="${emp?.department || ''}" />
        </div>
        <div class="form-group">
          <label>${t('emp_join_date')}</label>
          <input type="date" name="joinDate" value="${emp?.joinDate || todayStr()}" />
        </div>
        <div class="form-group">
          <label>${t('status')}</label>
          <select name="status">
            <option value="Aktif" ${emp?.status !== 'Nonaktif' ? 'selected' : ''}>${t('emp_status_active')}</option>
            <option value="Nonaktif" ${emp?.status === 'Nonaktif' ? 'selected' : ''}>${t('emp_status_inactive')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${t('emp_base_salary')}</label>
          <input type="number" name="baseSalary" min="0" value="${emp?.baseSalary || ''}" />
        </div>
        <div class="form-group">
          <label>${t('emp_allowance')}</label>
          <input type="number" name="allowance" min="0" value="${emp?.allowance || 0}" />
        </div>
        <div class="form-group">
          <label>${t('emp_nik')}</label>
          <input name="nik" value="${emp?.nik || ''}" />
        </div>
        <div class="form-group">
          <label>${t('emp_bank_account')}</label>
          <input name="bankAccount" value="${emp?.bankAccount || ''}" />
        </div>
        <div class="form-group">
          <label>${t('emp_tax_status')}</label>
          <select name="taxStatus">
            ${['TK/0', 'TK/1', 'TK/2', 'TK/3', 'K/0', 'K/1', 'K/2', 'K/3']
              .map((s) => `<option value="${s}" ${(emp?.taxStatus || 'TK/0') === s ? 'selected' : ''}>${s}</option>`)
              .join('')}
          </select>
        </div>
        <div class="form-group">
          <label>${t('emp_has_npwp')}</label>
          <select name="hasNpwp">
            <option value="true" ${emp?.hasNpwp !== false ? 'selected' : ''}>${t('emp_npwp_yes')}</option>
            <option value="false" ${emp?.hasNpwp === false ? 'selected' : ''}>${t('emp_npwp_no')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${t('emp_phone')}</label>
          <input name="phone" value="${emp?.phone || ''}" />
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  `);

  document.getElementById('empForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const record = {
      id: emp?.id,
      name: fd.get('name').trim(),
      position: fd.get('position').trim(),
      department: fd.get('department').trim(),
      joinDate: fd.get('joinDate'),
      status: fd.get('status'),
      baseSalary: Number(fd.get('baseSalary')) || 0,
      allowance: Number(fd.get('allowance')) || 0,
      nik: fd.get('nik').trim(),
      bankAccount: fd.get('bankAccount').trim(),
      taxStatus: fd.get('taxStatus'),
      hasNpwp: fd.get('hasNpwp') !== 'false',
      phone: fd.get('phone').trim(),
    };
    await window.hrAPI.employees.save(record);
    await loadAll();
    closeModal();
    toast(t('toast_emp_saved'));
    render();
  };
}

async function deleteEmployee(id) {
  if (!confirm(t('confirm_emp_delete'))) return;
  await window.hrAPI.employees.delete(id);
  await loadAll();
  render();
  toast(t('toast_emp_deleted'));
}

// ==================================================================
// ATTENDANCE
// ==================================================================
async function renderAttendance(root, actions) {
  actions.innerHTML = `<button class="btn" id="btnExportAtt">${t('export_csv')}</button>`;

  const date = state.attendanceDate;
  const dayRecords = await window.hrAPI.attendance.getByDate(date);
  const recordMap = {};
  dayRecords.forEach((r) => (recordMap[r.employeeId] = r));
  const active = activeEmployees();

  const STATUSES = ['Hadir', 'Sakit', 'Izin', 'Cuti', 'Alpha'];

  root.innerHTML = `
    <div class="toolbar">
      <input type="date" id="attDate" value="${date}" />
      <button class="btn btn-primary" id="btnSaveAtt">${t('att_save_today')}</button>
    </div>
    <div class="card">
      ${
        active.length
          ? `<table><thead><tr><th>${t('name')}</th><th>${t('col_clock_in')}</th><th>${t('col_clock_out')}</th><th>${t('status')}</th><th>${t('col_notes')}</th></tr></thead>
            <tbody>${active
              .map((e) => {
                const r = recordMap[e.id] || {};
                return `<tr data-emp="${e.id}">
                  <td>${e.name}</td>
                  <td><input type="time" class="att-in" value="${r.clockIn || ''}" /></td>
                  <td><input type="time" class="att-out" value="${r.clockOut || ''}" /></td>
                  <td><select class="att-status">
                    ${STATUSES.map((s) => `<option value="${s}" ${r.status === s ? 'selected' : ''}>${statusLabel(s)}</option>`).join('')}
                  </select></td>
                  <td><input type="text" class="att-note" value="${r.notes || ''}" placeholder="${t('opsional')}" /></td>
                </tr>`;
              })
              .join('')}</tbody></table>`
          : `<div class="empty-state">${t('att_no_active_employees')}</div>`
      }
    </div>

    <div class="card">
      <h3>${t('att_monthly_recap')}</h3>
      <div class="toolbar">
        <select id="attEmpSelect">
          <option value="">${t('select_employee_ph')}</option>
          ${active.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
        </select>
        <input type="month" id="attMonth" value="${monthStr()}" />
      </div>
      <div id="attMonthlyResult"><div class="empty-state">${t('att_pick_to_view')}</div></div>
    </div>
  `;

  document.getElementById('attDate').onchange = (e) => {
    state.attendanceDate = e.target.value;
    render();
  };

  document.getElementById('btnSaveAtt').onclick = async () => {
    const rows = root.querySelectorAll('tbody tr[data-emp]');
    const records = [];
    rows.forEach((row) => {
      const employeeId = row.dataset.emp;
      const existing = recordMap[employeeId];
      records.push({
        id: existing?.id,
        employeeId,
        date,
        clockIn: row.querySelector('.att-in').value,
        clockOut: row.querySelector('.att-out').value,
        status: row.querySelector('.att-status').value,
        notes: row.querySelector('.att-note').value,
      });
    });
    await window.hrAPI.attendance.saveBulk(records);
    toast(t('toast_att_saved'));
  };

  document.getElementById('btnExportAtt').onclick = async () => {
    const month = monthStr();
    const data = await window.hrAPI.attendance.getByMonth(month);
    const rows = [t('csv_att_headers').split(',')];
    data.forEach((r) => rows.push([empName(r.employeeId), r.date, r.clockIn || '', r.clockOut || '', statusLabel(r.status), r.notes || '']));
    downloadCSV(`absensi_${month}.csv`, rows);
  };

  const refreshMonthly = async () => {
    const empId = document.getElementById('attEmpSelect').value;
    const month = document.getElementById('attMonth').value;
    const box = document.getElementById('attMonthlyResult');
    if (!empId) {
      box.innerHTML = `<div class="empty-state">${t('att_pick_to_view')}</div>`;
      return;
    }
    const recs = await window.hrAPI.attendance.getByEmployeeMonth(empId, month);
    const counts = { Hadir: 0, Sakit: 0, Izin: 0, Cuti: 0, Alpha: 0 };
    recs.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });
    box.innerHTML = `<div class="stat-grid">
      ${Object.entries(counts).map(([k, v]) => `<div class="stat-card"><div class="label">${statusLabel(k)}</div><div class="value">${v}</div></div>`).join('')}
    </div>`;
  };
  document.getElementById('attEmpSelect').onchange = refreshMonthly;
  document.getElementById('attMonth').onchange = refreshMonthly;
}

// ==================================================================
// LEAVE
// ==================================================================
async function renderLeave(root, actions) {
  actions.innerHTML = `<button class="btn btn-primary" id="btnAddLeave">${t('leave_add')}</button>`;
  document.getElementById('btnAddLeave').onclick = () => openLeaveForm();

  const sorted = [...state.leave].sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));

  root.innerHTML = `
    <div class="card">
      ${
        sorted.length
          ? `<table><thead><tr><th>${t('name')}</th><th>${t('type')}</th><th>${t('period')}</th><th>${t('days')}</th><th>${t('reason')}</th><th>${t('status')}</th><th></th></tr></thead>
            <tbody>${sorted
              .map(
                (l) => `<tr>
                <td>${empName(l.employeeId)}</td>
                <td>${leaveTypeLabel(l.type)}</td>
                <td>${formatDateID(l.startDate)} – ${formatDateID(l.endDate)}</td>
                <td>${daysBetween(l.startDate, l.endDate)}</td>
                <td>${l.reason || '-'}</td>
                <td>${leaveBadge(l.status)}</td>
                <td class="text-right">
                  ${
                    l.status === 'Pending'
                      ? `<button class="btn btn-sm btn-success" onclick="setLeaveStatus('${l.id}','Approved')">${t('approve')}</button>
                         <button class="btn btn-sm btn-danger" onclick="setLeaveStatus('${l.id}','Rejected')">${t('reject')}</button>`
                      : `<button class="btn btn-sm" onclick="deleteLeave('${l.id}')">${t('delete')}</button>`
                  }
                </td>
              </tr>`
              )
              .join('')}</tbody></table>`
          : emptyState('calendar', t('leave_empty_title'), t('leave_empty_sub'))
      }
    </div>

    <div class="card">
      <h3>${t('leave_balance_title', { year: new Date().getFullYear() })}</h3>
      ${renderLeaveBalanceTable()}
    </div>
  `;
}

function leaveBadge(status) {
  if (status === 'Approved') return `<span class="badge badge-green">Approved</span>`;
  if (status === 'Rejected') return `<span class="badge badge-red">Rejected</span>`;
  return `<span class="badge badge-yellow">Pending</span>`;
}

function renderLeaveBalanceTable() {
  const year = String(new Date().getFullYear());
  const quota = Number(state.settings.annualLeaveQuota) || 12;
  const active = activeEmployees();
  const rows = active.map((e) => {
    const used = state.leave
      .filter((l) => l.employeeId === e.id && l.type === 'Cuti Tahunan' && l.status === 'Approved' && l.startDate.startsWith(year))
      .reduce((sum, l) => sum + daysBetween(l.startDate, l.endDate), 0);
    return `<tr><td>${e.name}</td><td>${quota}</td><td>${used}</td><td><strong>${Math.max(quota - used, 0)}</strong></td></tr>`;
  });
  if (!rows.length) return `<div class="empty-state">${t('att_no_active_employees')}</div>`;
  return `<table><thead><tr><th>${t('name')}</th><th>${t('col_quota_year')}</th><th>${t('col_used')}</th><th>${t('col_remaining')}</th></tr></thead><tbody>${rows.join('')}</tbody></table>`;
}

function openLeaveForm(fixedEmployeeId) {
  const active = activeEmployees();
  openModal(`
    <h2>${t('leave_form_title')}</h2>
    <form id="leaveForm">
      <div class="form-grid">
        ${
          fixedEmployeeId
            ? `<input type="hidden" name="employeeId" value="${fixedEmployeeId}" />`
            : `<div class="form-group full">
                <label>${t('leave_employee')}</label>
                <select name="employeeId" required>
                  <option value="">${t('select_employee_ph')}</option>
                  ${active.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
                </select>
              </div>`
        }
        <div class="form-group">
          <label>${t('type')}</label>
          <select name="type">
            ${LEAVE_TYPE_OPTIONS.map((o) => `<option value="${o.value}">${t(o.key)}</option>`).join('')}
          </select>
        </div>
        <div class="form-group"></div>
        <div class="form-group">
          <label>${t('leave_start')}</label>
          <input type="date" name="startDate" required value="${todayStr()}" />
        </div>
        <div class="form-group">
          <label>${t('leave_end')}</label>
          <input type="date" name="endDate" required value="${todayStr()}" />
        </div>
        <div class="form-group full">
          <label>${t('reason')}</label>
          <textarea name="reason" rows="3"></textarea>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('leave_submit')}</button>
      </div>
    </form>
  `);

  document.getElementById('leaveForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    if (!fd.get('employeeId')) return;
    await window.hrAPI.leave.save({
      employeeId: fd.get('employeeId'),
      type: fd.get('type'),
      startDate: fd.get('startDate'),
      endDate: fd.get('endDate'),
      reason: fd.get('reason').trim(),
      status: 'Pending',
      requestedAt: new Date().toISOString(),
    });
    await loadAll();
    closeModal();
    toast(t('toast_leave_submitted'));
    render();
  };
}

async function setLeaveStatus(id, status) {
  const rec = state.leave.find((l) => l.id === id);
  if (!rec) return;
  await window.hrAPI.leave.save({ ...rec, status });
  await loadAll();
  render();
  toast(status === 'Approved' ? t('toast_leave_approved') : t('toast_leave_rejected'));
}

async function deleteLeave(id) {
  if (!confirm(t('confirm_leave_delete'))) return;
  await window.hrAPI.leave.delete(id);
  await loadAll();
  render();
}

// ==================================================================
// PAYROLL
// ==================================================================
async function renderPayroll(root, actions) {
  actions.innerHTML = `
    <button class="btn" id="btnPrintAll">${t('print_all_slips')}</button>
    <button class="btn" id="btnExportPay">${t('export_csv')}</button>
  `;

  const period = state.payrollPeriod;
  const existing = await window.hrAPI.payroll.getByPeriod(period);
  const existingMap = {};
  existing.forEach((p) => (existingMap[p.employeeId] = p));

  root.innerHTML = `
    <div class="toolbar">
      <input type="month" id="payPeriod" value="${period}" />
      <button class="btn btn-primary" id="btnGenerate">${t('payroll_generate')}</button>
    </div>
    <div class="card">
      <div id="payTableBox"><div class="empty-state">${t('loading')}</div></div>
    </div>
  `;

  document.getElementById('payPeriod').onchange = (e) => {
    state.payrollPeriod = e.target.value;
    render();
  };

  document.getElementById('btnGenerate').onclick = async () => {
    await window.hrAPI.payroll.generate(period);
    await loadAll();
    toast(t('toast_payroll_generated'));
    render();
  };

  document.getElementById('btnPrintAll').onclick = async () => {
    await printAllSlips(period);
  };

  document.getElementById('btnExportPay').onclick = async () => {
    const data = await window.hrAPI.payroll.getByPeriod(period);
    const rows = [[t('name'), t('period'), t('col_gross'), t('col_bpjs_employee'), t('col_pph21'), t('col_att_deduction'), t('col_net'), t('status')]];
    data.forEach((p) =>
      rows.push([
        empName(p.employeeId),
        p.period,
        p.grossSalary ?? (p.baseSalary + p.allowance),
        p.bpjsEmployee?.total ?? 0,
        p.pph21 ?? 0,
        p.attendanceDeduction ?? p.deductions ?? 0,
        p.netSalary,
        p.status,
      ])
    );
    downloadCSV(`payroll_${period}.csv`, rows);
  };

  renderPayrollTable(existing);
}

function renderPayrollTable(records) {
  const box = document.getElementById('payTableBox');
  if (!box) return;
  if (!records.length) {
    box.innerHTML = emptyState('coins', t('payroll_empty_title'), t('payroll_empty_sub'));
    return;
  }
  const total = records.reduce((s, r) => s + r.netSalary, 0);
  box.innerHTML = `
    <table><thead><tr>
      <th>${t('name')}</th><th>${t('col_gross')}</th><th>${t('col_bpjs_employee')}</th><th>${t('col_pph21')}</th><th>${t('col_att_deduction')}</th><th>${t('col_net')}</th><th>${t('status')}</th><th></th>
    </tr></thead><tbody>
      ${records
        .map((p) => {
          const gross = p.grossSalary ?? (p.baseSalary + p.allowance);
          const bpjsTotal = p.bpjsEmployee?.total ?? 0;
          const pph21 = p.pph21 ?? 0;
          const attDed = p.attendanceDeduction ?? p.deductions ?? 0;
          return `<tr>
          <td>${empName(p.employeeId)}</td>
          <td>${formatIDR(gross)}</td>
          <td>${formatIDR(bpjsTotal)}</td>
          <td>${formatIDR(pph21)}</td>
          <td>${formatIDR(attDed)}</td>
          <td><strong>${formatIDR(p.netSalary)}</strong></td>
          <td>${p.status === 'Paid' ? `<span class="badge badge-green">${t('badge_paid')}</span>` : `<span class="badge badge-yellow">${t('badge_draft')}</span>`}</td>
          <td class="text-right">
            <button class="btn btn-sm" onclick="printSlip('${p.id}')">${t('print_slip')}</button>
            ${p.status !== 'Paid' ? `<button class="btn btn-sm btn-success" onclick="markPaid('${p.id}')">${t('mark_paid')}</button>` : ''}
          </td>
        </tr>`;
        })
        .join('')}
    </tbody>
    <tfoot><tr><td colspan="5" class="text-right"><strong>${t('total')}</strong></td><td><strong>${formatIDR(total)}</strong></td><td colspan="2"></td></tr></tfoot>
    </table>
    ${state.settings.enableBpjs || state.settings.enablePph21 ? '' : `<p class="text-muted" style="margin-top:10px;font-size:12px;">${t('payroll_tax_off_note')}</p>`}
  `;
}

async function markPaid(id) {
  await window.hrAPI.payroll.markPaid(id);
  await loadAll();
  render();
  toast(t('toast_marked_paid'));
}

async function printSlip(id) {
  toast(t('toast_building_pdf'));
  try {
    const savedPath = await window.hrAPI.payroll.printSlip(id);
    if (savedPath) toast(t('toast_slip_saved') + savedPath);
  } catch (err) {
    toast(t('toast_slip_failed'));
  }
}

async function printAllSlips(period) {
  toast(t('toast_building_all_pdf'));
  try {
    const result = await window.hrAPI.payroll.printAllSlips(period);
    if (result?.canceled) return;
    if (!result?.success) {
      toast(result?.error || t('alert_no_payroll_for_period'));
      return;
    }
    toast(t('toast_all_slips_done', { count: result.count, total: result.total, folder: result.folder }));
    if (result.failed && result.failed.length) {
      setTimeout(() => toast(t('toast_all_slips_failed', { names: result.failed.join(', ') })), 2400);
    }
  } catch (err) {
    toast(t('toast_slip_failed'));
  }
}

// ==================================================================
// DOCUMENTS
// ==================================================================
async function renderDocuments(root, actions) {
  const active = state.employees;
  actions.innerHTML = '';

  root.innerHTML = `
    <div class="toolbar">
      <select id="docEmpSelect">
        <option value="">${t('select_employee_ph')}</option>
        ${active.map((e) => `<option value="${e.id}" ${state.selectedDocEmployeeId === e.id ? 'selected' : ''}>${e.name}</option>`).join('')}
      </select>
      <button class="btn btn-primary" id="btnUploadDoc" ${state.selectedDocEmployeeId ? '' : 'disabled'}>${t('doc_upload')}</button>
    </div>
    <div class="card" id="docListBox"><div class="empty-state">${t('doc_pick_employee')}</div></div>
  `;

  document.getElementById('docEmpSelect').onchange = async (e) => {
    state.selectedDocEmployeeId = e.target.value || null;
    render();
  };

  if (state.selectedDocEmployeeId) {
    document.getElementById('btnUploadDoc').onclick = async () => {
      const category = prompt(t('doc_category_prompt'), t('doc_category_other'));
      const doc = await window.hrAPI.documents.upload(state.selectedDocEmployeeId, category || t('doc_category_other'));
      if (doc) {
        toast(t('toast_doc_added'));
        refreshDocList();
      }
    };
    await refreshDocList();
  }
}

async function refreshDocList() {
  const box = document.getElementById('docListBox');
  if (!box || !state.selectedDocEmployeeId) return;
  const docs = await window.hrAPI.documents.getByEmployee(state.selectedDocEmployeeId);
  if (!docs.length) {
    box.innerHTML = emptyState('folder', t('doc_empty_title'), t('doc_empty_sub'));
    return;
  }
  box.innerHTML = `<table><thead><tr><th>${t('col_filename')}</th><th>${t('col_category')}</th><th>${t('col_upload_date')}</th><th></th></tr></thead><tbody>
    ${docs
      .map(
        (d) => `<tr>
        <td>${d.fileName}</td>
        <td><span class="badge badge-blue">${d.category}</span></td>
        <td>${formatDateID(d.uploadedAt)}</td>
        <td class="text-right">
          <button class="btn btn-sm" onclick="openDoc('${d.storedPath.replace(/\\/g, '\\\\')}')">${t('open')}</button>
          <button class="btn btn-sm btn-danger" onclick="deleteDoc('${d.id}')">${t('delete')}</button>
        </td>
      </tr>`
      )
      .join('')}
  </tbody></table>`;
}

function openDoc(storedPath) {
  window.hrAPI.documents.open(storedPath);
}
async function deleteDoc(id) {
  if (!confirm(t('confirm_doc_delete'))) return;
  await window.hrAPI.documents.delete(id);
  refreshDocList();
  toast(t('toast_doc_deleted'));
}

// ==================================================================
// SETTINGS
// ==================================================================
async function renderSettings(root, actions) {
  actions.innerHTML = '';
  const dataPath = await window.hrAPI.backup.getDataPath();
  const s = state.settings;

  root.innerHTML = `
    <div class="card">
      <h3>${t('settings_company_info')}</h3>
      <form id="settingsForm">
        <div class="form-grid">
          <div class="form-group">
            <label>${t('settings_company_name')}</label>
            <input name="companyName" value="${s.companyName}" />
          </div>
          <div class="form-group">
            <label>${t('settings_company_address')}</label>
            <input name="companyAddress" value="${s.companyAddress || ''}" />
          </div>
          <div class="form-group">
            <label>${t('settings_leave_quota')}</label>
            <input type="number" name="annualLeaveQuota" min="0" value="${s.annualLeaveQuota}" />
          </div>
          <div class="form-group">
            <label>${t('settings_workdays')}</label>
            <input type="number" name="workDaysPerMonth" min="1" value="${s.workDaysPerMonth}" />
          </div>
        </div>

        <h3 style="margin-top:22px;">${t('settings_tax_bpjs')}</h3>
        <p class="text-muted" style="font-size:12px;margin-top:-6px;">
          ${t('settings_tax_disclaimer')}
        </p>
        <div class="form-grid">
          <div class="form-group">
            <label><input type="checkbox" name="enableBpjs" ${s.enableBpjs ? 'checked' : ''} /> ${t('settings_enable_bpjs')}</label>
          </div>
          <div class="form-group">
            <label><input type="checkbox" name="enablePph21" ${s.enablePph21 ? 'checked' : ''} /> ${t('settings_enable_pph21')}</label>
          </div>
          <div class="form-group">
            <label>BPJS Kesehatan — Karyawan (%)</label>
            <input type="number" step="0.01" name="bpjsKesehatanEmployeeRate" value="${s.bpjsKesehatanEmployeeRate}" />
          </div>
          <div class="form-group">
            <label>BPJS Kesehatan — Perusahaan (%)</label>
            <input type="number" step="0.01" name="bpjsKesehatanEmployerRate" value="${s.bpjsKesehatanEmployerRate}" />
          </div>
          <div class="form-group">
            <label>Batas Gaji BPJS Kesehatan (Rp)</label>
            <input type="number" name="bpjsKesehatanCap" value="${s.bpjsKesehatanCap}" />
          </div>
          <div class="form-group"></div>
          <div class="form-group">
            <label>BPJS TK (JHT) — Karyawan (%)</label>
            <input type="number" step="0.01" name="bpjsTkJhtEmployeeRate" value="${s.bpjsTkJhtEmployeeRate}" />
          </div>
          <div class="form-group">
            <label>BPJS TK (JHT) — Perusahaan (%)</label>
            <input type="number" step="0.01" name="bpjsTkJhtEmployerRate" value="${s.bpjsTkJhtEmployerRate}" />
          </div>
          <div class="form-group">
            <label>BPJS TK (JP) — Karyawan (%)</label>
            <input type="number" step="0.01" name="bpjsTkJpEmployeeRate" value="${s.bpjsTkJpEmployeeRate}" />
          </div>
          <div class="form-group">
            <label>BPJS TK (JP) — Perusahaan (%)</label>
            <input type="number" step="0.01" name="bpjsTkJpEmployerRate" value="${s.bpjsTkJpEmployerRate}" />
          </div>
          <div class="form-group">
            <label>Batas Gaji BPJS JP (Rp)</label>
            <input type="number" name="bpjsTkJpCap" value="${s.bpjsTkJpCap}" />
          </div>
          <div class="form-group"></div>
          <div class="form-group">
            <label>BPJS TK (JKK) — Perusahaan (%)</label>
            <input type="number" step="0.01" name="bpjsTkJkkRate" value="${s.bpjsTkJkkRate}" />
          </div>
          <div class="form-group">
            <label>BPJS TK (JKM) — Perusahaan (%)</label>
            <input type="number" step="0.01" name="bpjsTkJkmRate" value="${s.bpjsTkJkmRate}" />
          </div>
        </div>
        <div class="form-actions">
          <button type="submit" class="btn btn-primary">${t('settings_save')}</button>
        </div>
      </form>
    </div>

    <div class="card">
      <h3>${t('settings_backup_title')}</h3>
      <p class="text-muted">${t('settings_backup_desc')}</p>
      <p class="mono text-muted" style="word-break:break-all">${dataPath}</p>
      <button class="btn btn-primary" id="btnBackupExport">${t('settings_backup_btn')}</button>
    </div>

    <div class="card">
      <h3>${t('settings_users_title')}</h3>
      <div class="toolbar">
        <span class="text-muted">${t('settings_users_desc')}</span>
        <button class="btn btn-primary btn-sm" id="btnAddUser">${t('user_add')}</button>
      </div>
      <div id="userListBox"><div class="empty-state">${t('loading')}</div></div>
    </div>
  `;

  document.getElementById('settingsForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    state.settings = await window.hrAPI.settings.save({
      companyName: fd.get('companyName').trim(),
      companyAddress: fd.get('companyAddress').trim(),
      annualLeaveQuota: Number(fd.get('annualLeaveQuota')) || 12,
      workDaysPerMonth: Number(fd.get('workDaysPerMonth')) || 25,
      enableBpjs: fd.get('enableBpjs') === 'on',
      enablePph21: fd.get('enablePph21') === 'on',
      bpjsKesehatanEmployeeRate: Number(fd.get('bpjsKesehatanEmployeeRate')) || 0,
      bpjsKesehatanEmployerRate: Number(fd.get('bpjsKesehatanEmployerRate')) || 0,
      bpjsKesehatanCap: Number(fd.get('bpjsKesehatanCap')) || 0,
      bpjsTkJhtEmployeeRate: Number(fd.get('bpjsTkJhtEmployeeRate')) || 0,
      bpjsTkJhtEmployerRate: Number(fd.get('bpjsTkJhtEmployerRate')) || 0,
      bpjsTkJpEmployeeRate: Number(fd.get('bpjsTkJpEmployeeRate')) || 0,
      bpjsTkJpEmployerRate: Number(fd.get('bpjsTkJpEmployerRate')) || 0,
      bpjsTkJpCap: Number(fd.get('bpjsTkJpCap')) || 0,
      bpjsTkJkkRate: Number(fd.get('bpjsTkJkkRate')) || 0,
      bpjsTkJkmRate: Number(fd.get('bpjsTkJkmRate')) || 0,
    });
    document.getElementById('brandCompany').textContent = state.settings.companyName;
    toast(t('toast_settings_saved'));
  };

  document.getElementById('btnBackupExport').onclick = async () => {
    const target = await window.hrAPI.backup.export();
    if (target) toast(t('toast_backup_saved') + target);
  };

  document.getElementById('btnAddUser').onclick = () => openUserForm();
  await refreshUserList();
}

async function refreshUserList() {
  const box = document.getElementById('userListBox');
  if (!box) return;
  const users = await window.hrAPI.auth.listUsers();
  if (!users.length) {
    box.innerHTML = `<div class="empty-state">${t('users_empty')}</div>`;
    return;
  }
  box.innerHTML = `<table><thead><tr><th>${t('name')}</th><th>${t('col_username')}</th><th>${t('col_role')}</th><th>${t('col_linked_employee')}</th><th></th></tr></thead><tbody>
    ${users
      .map(
        (u) => `<tr>
        <td>${u.name}</td>
        <td>${u.username}</td>
        <td><span class="badge ${u.role === 'Admin' ? 'badge-blue' : 'badge-gray'}">${u.role}</span></td>
        <td>${u.employeeId ? empName(u.employeeId) : '-'}</td>
        <td class="text-right">
          <button class="btn btn-sm" onclick="resetUserPassword('${u.id}')">${t('reset_password')}</button>
          ${u.id !== state.currentUser?.id ? `<button class="btn btn-sm btn-danger" onclick="deleteUser('${u.id}')">${t('delete')}</button>` : ''}
        </td>
      </tr>`
      )
      .join('')}
  </tbody></table>`;
}

function openUserForm() {
  const active = state.employees;
  openModal(`
    <h2>${t('user_form_title')}</h2>
    <form id="userForm">
      <div class="form-grid">
        <div class="form-group full">
          <label>${t('name')}</label>
          <input name="name" required />
        </div>
        <div class="form-group">
          <label>${t('col_username')}</label>
          <input name="username" required />
        </div>
        <div class="form-group">
          <label>${t('user_password')}</label>
          <input type="password" name="password" required minlength="4" />
        </div>
        <div class="form-group">
          <label>${t('col_role')}</label>
          <select name="role">
            <option value="Staff">${t('role_staff_label')}</option>
            <option value="Admin">${t('role_admin_label')}</option>
          </select>
        </div>
        <div class="form-group">
          <label>${t('user_link_employee')}</label>
          <select name="employeeId">
            <option value="">${t('not_connected')}</option>
            ${active.map((e) => `<option value="${e.id}">${e.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button type="button" class="btn" onclick="closeModal()">${t('cancel')}</button>
        <button type="submit" class="btn btn-primary">${t('save')}</button>
      </div>
    </form>
  `);

  document.getElementById('userForm').onsubmit = async (ev) => {
    ev.preventDefault();
    const fd = new FormData(ev.target);
    const result = await window.hrAPI.auth.createUser({
      name: fd.get('name').trim(),
      username: fd.get('username').trim(),
      password: fd.get('password'),
      role: fd.get('role'),
      employeeId: fd.get('employeeId') || null,
    });
    if (!result.success) {
      alert(result.error || t('alert_user_create_failed'));
      return;
    }
    closeModal();
    toast(t('toast_user_added'));
    refreshUserList();
  };
}

async function deleteUser(id) {
  if (!confirm(t('confirm_user_delete'))) return;
  const result = await window.hrAPI.auth.deleteUser(id);
  if (result && result.success === false) {
    alert(result.error || t('alert_user_delete_failed'));
    return;
  }
  refreshUserList();
  toast(t('toast_user_deleted'));
}

async function resetUserPassword(id) {
  const newPassword = prompt(t('prompt_new_password'));
  if (!newPassword) return;
  const result = await window.hrAPI.auth.resetPassword({ id, newPassword });
  if (result.success) toast(t('toast_password_changed'));
  else alert(result.error || t('alert_password_failed'));
}

// ==================================================================
// PROFILE (Staff role — self-service)
// ==================================================================
async function renderProfile(root, actions) {
  actions.innerHTML = '';
  const employeeId = state.currentUser?.employeeId;

  if (!employeeId) {
    root.innerHTML = `<div class="card"><div class="empty-state">${t('profile_no_link')}</div></div>`;
    return;
  }

  const emp = state.employees.find((e) => e.id === employeeId);
  const month = monthStr();
  const monthAtt = await window.hrAPI.attendance.getByEmployeeMonth(employeeId, month);
  const counts = { Hadir: 0, Sakit: 0, Izin: 0, Cuti: 0, Alpha: 0 };
  monthAtt.forEach((r) => { if (counts[r.status] !== undefined) counts[r.status]++; });

  const myLeave = state.leave.filter((l) => l.employeeId === employeeId).sort((a, b) => (b.requestedAt || '').localeCompare(a.requestedAt || ''));
  const myPayroll = state.payroll.filter((p) => p.employeeId === employeeId).sort((a, b) => b.period.localeCompare(a.period));

  root.innerHTML = `
    <div class="card">
      <h3>${emp?.name || t('nav_employees')}</h3>
      <p class="text-muted">${emp?.position || '-'} · ${emp?.department || '-'}</p>
    </div>

    <div class="card">
      <h3>${t('profile_attendance_month', { month })}</h3>
      <div class="stat-grid">
        ${Object.entries(counts).map(([k, v]) => `<div class="stat-card"><div class="label">${statusLabel(k)}</div><div class="value">${v}</div></div>`).join('')}
      </div>
    </div>

    <div class="card">
      <div class="toolbar">
        <h3 style="margin:0;">${t('my_leave_title')}</h3>
        <button class="btn btn-primary btn-sm" id="btnMyLeave">${t('leave_add')}</button>
      </div>
      ${
        myLeave.length
          ? `<table><thead><tr><th>${t('type')}</th><th>${t('period')}</th><th>${t('days')}</th><th>${t('status')}</th></tr></thead><tbody>
            ${myLeave
              .map(
                (l) => `<tr>
                <td>${leaveTypeLabel(l.type)}</td>
                <td>${formatDateID(l.startDate)} – ${formatDateID(l.endDate)}</td>
                <td>${daysBetween(l.startDate, l.endDate)}</td>
                <td>${leaveBadge(l.status)}</td>
              </tr>`
              )
              .join('')}</tbody></table>`
          : `<div class="empty-state">${t('no_leave_yet')}</div>`
      }
    </div>

    <div class="card">
      <h3>${t('my_payslip_title')}</h3>
      ${
        myPayroll.length
          ? `<table><thead><tr><th>${t('period')}</th><th>${t('col_net')}</th><th>${t('status')}</th><th></th></tr></thead><tbody>
            ${myPayroll
              .map(
                (p) => `<tr>
                <td>${p.period}</td>
                <td>${formatIDR(p.netSalary)}</td>
                <td>${p.status === 'Paid' ? `<span class="badge badge-green">${t('badge_paid')}</span>` : `<span class="badge badge-yellow">${t('badge_draft')}</span>`}</td>
                <td class="text-right"><button class="btn btn-sm" onclick="printSlip('${p.id}')">${t('print_slip_pdf')}</button></td>
              </tr>`
              )
              .join('')}</tbody></table>`
          : `<div class="empty-state">${t('no_payslip_yet')}</div>`
      }
    </div>
  `;

  document.getElementById('btnMyLeave').onclick = () => openLeaveForm(employeeId);
}

// ==================================================================
// AUTH (login / first-time setup)
// ==================================================================
function authBrandPanel() {
  return `
    <div class="auth-brand">
      <div>
        <div class="brand-mark">HR</div>
        <h1>${t('auth_h1')}</h1>
        <p class="tagline">${t('auth_tagline')}</p>
        <ul class="features">
          <li>${t('auth_feature_1')}</li>
          <li>${t('auth_feature_2')}</li>
          <li>${t('auth_feature_3')}</li>
          <li>${t('auth_feature_4')}</li>
        </ul>
      </div>
      <div class="foot">${t('auth_footer')}</div>
    </div>
  `;
}

async function renderAuthScreen() {
  try {
    const s = await window.hrAPI.settings.get();
    state.lang = s.language || state.lang || 'id';
  } catch (e) { /* ignore */ }

  const hasUsers = await window.hrAPI.auth.hasUsers();
  const authScreen = document.getElementById('authScreen');

  if (!hasUsers) {
    authScreen.innerHTML = `
      <div class="auth-card">
        ${authBrandPanel()}
        <div class="auth-form-pane">
          <div class="auth-top-row">
            <h2>${t('auth_welcome')}</h2>
            ${langToggleHtml()}
          </div>
          <p class="sub">${t('auth_setup_sub')}</p>
          <div id="authError"></div>
          <form id="setupForm">
            <div class="form-group"><label>${t('name')}</label><input name="name" required /></div>
            <div class="form-group"><label>${t('username')}</label><input name="username" required /></div>
            <div class="form-group"><label>${t('password')}</label><input type="password" name="password" required minlength="4" /></div>
            <button type="submit" class="btn btn-primary">${t('auth_create_account')}</button>
          </form>
        </div>
      </div>
    `;
    wireLangToggle(authScreen);
    document.getElementById('setupForm').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const result = await window.hrAPI.auth.setupFirstAdmin({
        name: fd.get('name'),
        username: fd.get('username'),
        password: fd.get('password'),
      });
      if (!result.success) {
        showAuthError(result.error);
        return;
      }
      await enterApp(result.user);
    };
  } else {
    authScreen.innerHTML = `
      <div class="auth-card">
        ${authBrandPanel()}
        <div class="auth-form-pane">
          <div class="auth-top-row">
            <h2>${greetingText()}</h2>
            ${langToggleHtml()}
          </div>
          <p class="sub">${t('auth_login_sub')}</p>
          <div id="authError"></div>
          <form id="loginForm">
            <div class="form-group"><label>${t('username')}</label><input name="username" required autofocus /></div>
            <div class="form-group"><label>${t('password')}</label><input type="password" name="password" required /></div>
            <button type="submit" class="btn btn-primary">${t('auth_login_btn')}</button>
          </form>
        </div>
      </div>
    `;
    wireLangToggle(authScreen);
    document.getElementById('loginForm').onsubmit = async (ev) => {
      ev.preventDefault();
      const fd = new FormData(ev.target);
      const result = await window.hrAPI.auth.login({
        username: fd.get('username'),
        password: fd.get('password'),
      });
      if (!result.success) {
        showAuthError(result.error);
        return;
      }
      await enterApp(result.user);
    };
  }
}

function showAuthError(msg) {
  document.getElementById('authError').innerHTML = `<div class="auth-error">${msg || t('auth_generic_error')}</div>`;
}

async function enterApp(user) {
  state.currentUser = user;
  document.getElementById('authScreen').classList.add('hidden');
  document.getElementById('appShell').classList.remove('hidden');
  await loadAll();
  state.view = user.role === 'Admin' ? 'dashboard' : 'profile';
  renderNav();
  document.getElementById('viewTitle').textContent = viewTitles()[state.view];
  await render();
}

function logout() {
  window.hrAPI.auth.logout();
  state.currentUser = null;
  document.getElementById('appShell').classList.add('hidden');
  document.getElementById('authScreen').classList.remove('hidden');
  renderAuthScreen();
}

// ---------------- init ----------------
(async function init() {
  await renderAuthScreen();
})();
