const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('hrAPI', {
  employees: {
    getAll: () => ipcRenderer.invoke('employees:getAll'),
    save: (emp) => ipcRenderer.invoke('employees:save', emp),
    delete: (id) => ipcRenderer.invoke('employees:delete', id),
  },
  attendance: {
    getByDate: (date) => ipcRenderer.invoke('attendance:getByDate', date),
    getByEmployeeMonth: (employeeId, month) =>
      ipcRenderer.invoke('attendance:getByEmployeeMonth', { employeeId, month }),
    getByMonth: (month) => ipcRenderer.invoke('attendance:getByMonth', month),
    saveBulk: (records) => ipcRenderer.invoke('attendance:saveBulk', records),
  },
  leave: {
    getAll: () => ipcRenderer.invoke('leave:getAll'),
    save: (rec) => ipcRenderer.invoke('leave:save', rec),
    delete: (id) => ipcRenderer.invoke('leave:delete', id),
  },
  payroll: {
    getByPeriod: (period) => ipcRenderer.invoke('payroll:getByPeriod', period),
    getAll: () => ipcRenderer.invoke('payroll:getAll'),
    generate: (period) => ipcRenderer.invoke('payroll:generate', period),
    markPaid: (id) => ipcRenderer.invoke('payroll:markPaid', id),
    printSlip: (payrollId) => ipcRenderer.invoke('payroll:printSlip', payrollId),
    printAllSlips: (period) => ipcRenderer.invoke('payroll:printAllSlips', period),
  },
  documents: {
    getByEmployee: (employeeId) => ipcRenderer.invoke('documents:getByEmployee', employeeId),
    upload: (employeeId, category) =>
      ipcRenderer.invoke('documents:upload', { employeeId, category }),
    open: (storedPath) => ipcRenderer.invoke('documents:open', storedPath),
    delete: (id) => ipcRenderer.invoke('documents:delete', id),
  },
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    save: (s) => ipcRenderer.invoke('settings:save', s),
  },
  backup: {
    export: () => ipcRenderer.invoke('backup:export'),
    getDataPath: () => ipcRenderer.invoke('backup:getDataPath'),
  },
  auth: {
    hasUsers: () => ipcRenderer.invoke('auth:hasUsers'),
    setupFirstAdmin: (data) => ipcRenderer.invoke('auth:setupFirstAdmin', data),
    login: (data) => ipcRenderer.invoke('auth:login', data),
    logout: () => ipcRenderer.invoke('auth:logout'),
    listUsers: () => ipcRenderer.invoke('auth:listUsers'),
    createUser: (data) => ipcRenderer.invoke('auth:createUser', data),
    deleteUser: (id) => ipcRenderer.invoke('auth:deleteUser', id),
    resetPassword: (data) => ipcRenderer.invoke('auth:resetPassword', data),
  },
});
