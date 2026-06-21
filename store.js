// store.js — runs in the Electron MAIN process only.
// Plain JSON-file storage. No native modules (better-sqlite3 etc.) so `npm install`
// never needs a C++ build toolchain. Good enough for 5-20 employees worth of data.
//
// Safety features:
//  - atomic write (write to .tmp then rename) so a crash mid-write can't corrupt the file
//  - rotating backups (last 10 per collection) so a corrupted file can self-heal
//  - manual "export backup to folder" for the user to copy onto a USB / cloud drive

const fs = require('fs');
const path = require('path');

const COLLECTIONS = ['employees', 'attendance', 'leave', 'payroll', 'documents', 'users'];

class Store {
  constructor(baseDir) {
    this.baseDir = baseDir;
    this.dataDir = path.join(baseDir, 'data');
    this.backupDir = path.join(baseDir, 'backups');
    fs.mkdirSync(this.dataDir, { recursive: true });
    fs.mkdirSync(this.backupDir, { recursive: true });

    this.cache = {};
    COLLECTIONS.forEach((name) => this._load(name));
    this._loadSettings();
  }

  _filePath(name) {
    return path.join(this.dataDir, `${name}.json`);
  }

  _load(name) {
    const fp = this._filePath(name);
    if (fs.existsSync(fp)) {
      try {
        this.cache[name] = JSON.parse(fs.readFileSync(fp, 'utf-8'));
      } catch (err) {
        console.error(`[store] ${name}.json corrupted, trying backup recovery`, err);
        this.cache[name] = this._recoverFromBackup(name) || [];
      }
    } else {
      this.cache[name] = [];
    }
  }

  _recoverFromBackup(name) {
    const backups = fs
      .readdirSync(this.backupDir)
      .filter((f) => f.startsWith(`${name}_`))
      .sort()
      .reverse();
    for (const b of backups) {
      try {
        return JSON.parse(fs.readFileSync(path.join(this.backupDir, b), 'utf-8'));
      } catch (e) {
        continue;
      }
    }
    return null;
  }

  _persist(name) {
    const fp = this._filePath(name);
    const tmp = `${fp}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.cache[name], null, 2));
    fs.renameSync(tmp, fp); // atomic on the same volume
    this._rotateBackup(name);
  }

  _rotateBackup(name) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(this.backupDir, `${name}_${stamp}.json`);
    fs.copyFileSync(this._filePath(name), backupFile);

    const all = fs
      .readdirSync(this.backupDir)
      .filter((f) => f.startsWith(`${name}_`))
      .sort();
    while (all.length > 10) {
      fs.unlinkSync(path.join(this.backupDir, all.shift()));
    }
  }

  getAll(name) {
    return this.cache[name] || [];
  }

  getOne(name, id) {
    return (this.cache[name] || []).find((r) => r.id === id);
  }

  query(name, predicate) {
    return (this.cache[name] || []).filter(predicate);
  }

  save(name, record) {
    if (!record.id) {
      record.id = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    }
    const list = this.cache[name];
    const idx = list.findIndex((r) => r.id === record.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...record };
    } else {
      list.push(record);
    }
    this._persist(name);
    return record;
  }

  remove(name, id) {
    this.cache[name] = this.cache[name].filter((r) => r.id !== id);
    this._persist(name);
    return true;
  }

  _loadSettings() {
    const fp = path.join(this.dataDir, 'settings.json');
    if (fs.existsSync(fp)) {
      try {
        this.settings = JSON.parse(fs.readFileSync(fp, 'utf-8'));
        return;
      } catch (e) {
        // fall through to default
      }
    }
    this.settings = this._defaultSettings();
  }

  _defaultSettings() {
    return {
      companyName: 'Perusahaan Saya',
      companyAddress: '',
      language: 'id',
      annualLeaveQuota: 12,
      workDaysPerMonth: 25,
      enableBpjs: false,
      enablePph21: false,
      bpjsKesehatanEmployeeRate: 1,
      bpjsKesehatanEmployerRate: 4,
      bpjsKesehatanCap: 12000000,
      bpjsTkJhtEmployeeRate: 2,
      bpjsTkJhtEmployerRate: 3.7,
      bpjsTkJpEmployeeRate: 1,
      bpjsTkJpEmployerRate: 2,
      bpjsTkJpCap: 10547400,
      bpjsTkJkkRate: 0.24,
      bpjsTkJkmRate: 0.3,
    };
  }

  getSettings() {
    return this.settings;
  }

  saveSettings(s) {
    this.settings = { ...this.settings, ...s };
    fs.writeFileSync(
      path.join(this.dataDir, 'settings.json'),
      JSON.stringify(this.settings, null, 2)
    );
    return this.settings;
  }

  backupTo(destDir) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const target = path.join(destDir, `hr-app-backup_${stamp}`);
    fs.mkdirSync(target, { recursive: true });
    COLLECTIONS.forEach((name) => {
      const fp = this._filePath(name);
      if (fs.existsSync(fp)) fs.copyFileSync(fp, path.join(target, `${name}.json`));
    });
    const settingsFp = path.join(this.dataDir, 'settings.json');
    if (fs.existsSync(settingsFp)) {
      fs.copyFileSync(settingsFp, path.join(target, 'settings.json'));
    }
    return target;
  }
}

module.exports = Store;
