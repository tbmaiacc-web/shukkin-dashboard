// ========================================
// 出勤早見表 - Google Apps Script
// データ元: スプレッドシート gid=1593406827
// ========================================

// ========================================
// Web App API (doGet)
// ========================================
function doGet(e) {
  const p = (e && e.parameter) || {};
  const action = p.action || '';
  let result;

  try {
    if (action === 'upsertShift') {
      result = upsertShift(p);
    } else if (action === 'deleteShift') {
      result = deleteShift(p);
    } else if (action === 'updateEmployee') {
      result = updateEmployee(p);
    } else if (action === 'addEmployee') {
      result = addEmployee(p);
    } else if (action === 'employees') {
      result = getEmployeesJson();
    } else if (action === 'shifts') {
      result = getShiftsJson();
    } else if (action === 'addHistory') {
      result = addHistoryRecord(p);
    } else if (action === 'getHistory') {
      result = getHistoryRecords(Number(p.limit) || 60, p.employeeName || '');
    } else if (action === 'incrementUsedLeave') {
      result = incrementUsedLeave(p);
    } else if (action === 'incrementUsedAnniversaryLeave') {
      result = incrementUsedAnniversaryLeave(p);
    } else if (action === 'verifyAdminPin') {
      result = verifyAdminPin(p);
    } else if (action === 'initLeaveColumns') {
      initEmployeeLeaveColumns();
      result = { ok: true, message: 'initEmployeeLeaveColumns done' };
    } else if (action === 'initAutoGrant') {
      initAutoGrantColumns();
      result = { ok: true, message: 'autoGrant columns initialized' };
    } else if (action === 'runAutoGrant') {
      var grantLog = autoGrantLeave();
      result = { ok: true, log: grantLog };
    } else if (action === 'initAnniversaryLeaveColumns') {
      initAnniversaryLeaveColumns();
      result = { ok: true, message: 'initAnniversaryLeaveColumns done' };
    } else {
      result = { employees: getEmployeesJson(), shifts: getShiftsJson() };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function getEmployeesJson() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return rows.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] instanceof Date
        ? Utilities.formatDate(r[i], 'Asia/Tokyo', 'yyyy-MM-dd')
        : String(r[i] || '').trim();
    });
    return obj;
  });
}

// ========================================
// Web App API (doPost) - シフト・従業員の更新
// Content-Type: text/plain でJSONを受け取る
// ========================================
function doPost(e) {
  const data = JSON.parse(e.postData.contents);
  const action = data.action;
  let result;

  try {
    if (action === 'upsertShift') {
      result = upsertShift(data);
    } else if (action === 'deleteShift') {
      result = deleteShift(data);
    } else if (action === 'updateEmployee') {
      result = updateEmployee(data);
    } else if (action === 'addEmployee') {
      result = addEmployee(data);
    } else if (action === 'addHistory') {
      result = addHistoryRecord(data);
    } else if (action === 'incrementUsedLeave') {
      result = incrementUsedLeave(data);
    } else if (action === 'incrementUsedAnniversaryLeave') {
      result = incrementUsedAnniversaryLeave(data);
    } else if (action === 'verifyAdminPin') {
      result = verifyAdminPin(data);
    } else {
      result = { error: 'Unknown action' };
    }
  } catch (err) {
    result = { error: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function upsertShift(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  const sheet = sheets.find(s => s.getSheetId() === SOURCE_SHEET_GID) || ss.getSheetByName('shifts');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const dateIdx  = headers.indexOf('date');
  const nameIdx  = headers.indexOf('employeeName');
  const shiftIdx = headers.indexOf('shiftType');
  const noteIdx  = headers.indexOf('notes');
  const locIdx   = headers.indexOf('location');

  // 既存行を探す
  for (let i = 1; i < rows.length; i++) {
    const rowDate = rows[i][dateIdx] instanceof Date
      ? Utilities.formatDate(rows[i][dateIdx], 'Asia/Tokyo', 'yyyy-MM-dd')
      : String(rows[i][dateIdx]);
    if (rowDate === data.date && String(rows[i][nameIdx]).trim() === data.employeeName) {
      sheet.getRange(i + 1, shiftIdx + 1).setValue(data.shiftType);
      if (noteIdx >= 0) sheet.getRange(i + 1, noteIdx + 1).setValue(data.notes || '');
      return { ok: true, action: 'updated' };
    }
  }

  // なければ追加
  const newRow = new Array(headers.length).fill('');
  newRow[dateIdx]  = data.date;
  newRow[nameIdx]  = data.employeeName;
  newRow[shiftIdx] = data.shiftType;
  if (noteIdx >= 0) newRow[noteIdx] = data.notes || '';
  if (locIdx >= 0)  newRow[locIdx]  = data.location || '';
  sheet.appendRow(newRow);
  return { ok: true, action: 'added' };
}

function deleteShift(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  const sheet = sheets.find(s => s.getSheetId() === SOURCE_SHEET_GID) || ss.getSheetByName('shifts');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const dateIdx = headers.indexOf('date');
  const nameIdx = headers.indexOf('employeeName');

  for (let i = rows.length - 1; i >= 1; i--) {
    const rowDate = rows[i][dateIdx] instanceof Date
      ? Utilities.formatDate(rows[i][dateIdx], 'Asia/Tokyo', 'yyyy-MM-dd')
      : String(rows[i][dateIdx]);
    if (rowDate === data.date && String(rows[i][nameIdx]).trim() === data.employeeName) {
      sheet.deleteRow(i + 1);
      return { ok: true };
    }
  }
  return { ok: true, action: 'not_found' };
}

function updateEmployee(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const idIdx = headers.indexOf('id');

  for (let i = 1; i < rows.length; i++) {
    if (String(rows[i][idIdx]) === String(data.id)) {
      headers.forEach((h, j) => {
        if (data[h] !== undefined) sheet.getRange(i + 1, j + 1).setValue(data[h]);
      });
      return { ok: true };
    }
  }
  return { error: 'Employee not found' };
}

function addEmployee(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newId = String(Date.now());
  const row = headers.map(h => h === 'id' ? newId : (data[h] || ''));
  sheet.appendRow(row);
  return { ok: true, id: newId };
}

function getShiftsJson() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  const sheet = sheets.find(s => s.getSheetId() === SOURCE_SHEET_GID) || ss.getSheetByName('shifts');
  if (!sheet) return [];
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  return rows.slice(1).filter(r => r[0]).map(r => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = r[i] instanceof Date
        ? Utilities.formatDate(r[i], 'Asia/Tokyo', 'yyyy-MM-dd')
        : String(r[i] || '').trim();
    });
    return obj;
  });
}

const SPREADSHEET_ID = '16XOFGITIgtRvYUPdVB578PjaCKLlGqVze3XrpxFMyJU';
const SOURCE_SHEET_GID = 1593406827;
const OUTPUT_SHEET_NAME = '出勤早見表';

// シフト種別ごとの背景色
const SHIFT_COLORS = {
  '公休':   '#B0BEC5',  // グレー
  '有休':   '#A5D6A7',  // 緑
  '育休':   '#CE93D8',  // 紫
  '産休':   '#F48FB1',  // ピンク
  'アニ休': '#FFCC80',  // オレンジ
  '研修':   '#90CAF9',  // 青
  '出張':   '#FFF176',  // 黄
  'バイト': '#FFAB91',  // 赤系
};
const DEFAULT_COLOR = '#FFFFFF';
const WEEKEND_COLOR = '#F5F5F5';
const HOLIDAY_HEADER_COLOR = '#FFCDD2';

// ========================================
// メニュー追加（スプレッドシートにバインドした場合のみ動作）
// ========================================
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('出勤早見表')
    .addItem('今月を表示', 'createCurrentMonth')
    .addItem('月を指定して表示...', 'promptMonth')
    .addSeparator()
    .addItem('データを再読み込み', 'createCurrentMonth')
    .addToUi();
}

// ========================================
// 今月の早見表を作成
// ========================================
function createCurrentMonth() {
  const now = new Date();
  createDashboard(now.getFullYear(), now.getMonth() + 1);
}

// ========================================
// 月指定ダイアログ
// ========================================
function promptMonth() {
  const ui = SpreadsheetApp.getUi();
  const result = ui.prompt(
    '月を指定',
    '年月を入力してください（例: 2026-05）',
    ui.ButtonSet.OK_CANCEL
  );
  if (result.getSelectedButton() !== ui.Button.OK) return;

  const input = result.getResponseText().trim();
  const match = input.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) {
    ui.alert('形式が正しくありません。例: 2026-05');
    return;
  }
  createDashboard(parseInt(match[1]), parseInt(match[2]));
}

// ========================================
// 早見表メイン処理
// ========================================
function createDashboard(year, month) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const data = fetchSourceData();
  const filtered = filterByMonth(data, year, month);

  // 出力シートを準備
  let sheet = ss.getSheetByName(OUTPUT_SHEET_NAME);
  if (sheet) {
    sheet.clearContents();
    sheet.clearFormats();
  } else {
    sheet = ss.insertSheet(OUTPUT_SHEET_NAME);
  }

  // 日付リスト（その月の全日）
  const dates = getMonthDates(year, month);

  // 勤務地×従業員リストを構築
  const employees = buildEmployeeList(filtered, data);

  // ヘッダー行を書き込み
  writeHeaders(sheet, dates, year, month);

  // データ行を書き込み
  writeDataRows(sheet, dates, filtered, employees);

  // 書式調整
  formatSheet(sheet, dates.length, employees);

  // 凡例を追加
  writeLegend(sheet, dates.length + 3);

  Logger.log(`${year}年${month}月の出勤早見表を作成しました。シートURL: ${ss.getUrl()}`);
}

// ========================================
// データ取得
// ========================================
function fetchSourceData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheets = ss.getSheets();
  const sourceSheet = sheets.find(s => s.getSheetId() === SOURCE_SHEET_GID) || sheets[0];

  const rows = sourceSheet.getDataRange().getValues();
  if (rows.length < 2) return [];

  const headers = rows[0];
  const dateIdx     = findCol(headers, ['date', '日付']);
  const nameIdx     = findCol(headers, ['employeeName', '従業員名', '氏名', '名前']);
  const shiftIdx    = findCol(headers, ['shiftType', 'シフト', 'シフト種別', '種別']);
  const notesIdx    = findCol(headers, ['notes', '備考', 'メモ']);
  const locationIdx = findCol(headers, ['location', '勤務地', '院']);

  return rows.slice(1)
    .filter(r => r[dateIdx] && r[nameIdx])
    .map(r => ({
      date:     normalizeDate(r[dateIdx]),
      name:     String(r[nameIdx]).trim(),
      shift:    String(r[shiftIdx] || '').trim(),
      notes:    String(r[notesIdx] || '').trim(),
      location: String(r[locationIdx] || '').trim(),
    }));
}

function findCol(headers, candidates) {
  for (const c of candidates) {
    const idx = headers.findIndex(h => String(h).includes(c));
    if (idx >= 0) return idx;
  }
  return -1;
}

function normalizeDate(val) {
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

// ========================================
// 月でフィルタ
// ========================================
function filterByMonth(data, year, month) {
  return data.filter(r => {
    if (!r.date) return false;
    return r.date.getFullYear() === year && r.date.getMonth() + 1 === month;
  });
}

// ========================================
// 従業員リスト（勤務地順）
// ========================================
function buildEmployeeList(filtered, allData) {
  // その月に登場する従業員 + 勤務地を収集
  const map = new Map();
  const sources = filtered.length > 0 ? filtered : allData;
  for (const r of sources) {
    if (!map.has(r.name)) map.set(r.name, r.location);
  }
  // 勤務地でソート → 名前でソート
  return Array.from(map.entries())
    .sort((a, b) => a[1].localeCompare(b[1], 'ja') || a[0].localeCompare(b[0], 'ja'))
    .map(([name, location]) => ({ name, location }));
}

// ========================================
// その月の全日付を返す
// ========================================
function getMonthDates(year, month) {
  const dates = [];
  const lastDay = new Date(year, month, 0).getDate();
  for (let d = 1; d <= lastDay; d++) {
    dates.push(new Date(year, month - 1, d));
  }
  return dates;
}

// ========================================
// ヘッダー行を書く
// ========================================
function writeHeaders(sheet, dates, year, month) {
  const DOW = ['日', '月', '火', '水', '木', '金', '土'];

  // 1行目: 年月タイトル
  sheet.getRange(1, 1).setValue(`${year}年${month}月 出勤早見表`);

  // 2行目: 固定ラベル + 日付
  const row2 = ['勤務地', '氏名'];
  const row3 = ['', ''];
  for (const d of dates) {
    row2.push(d.getDate());
    row3.push(DOW[d.getDay()]);
  }
  sheet.getRange(2, 1, 1, row2.length).setValues([row2]);
  sheet.getRange(3, 1, 1, row3.length).setValues([row3]);

  // 土日の列に色付け
  dates.forEach((d, i) => {
    const col = i + 3;
    const dow = d.getDay();
    if (dow === 0) {
      sheet.getRange(3, col).setBackground('#FFCDD2').setFontWeight('bold');
    } else if (dow === 6) {
      sheet.getRange(3, col).setBackground('#BBDEFB').setFontWeight('bold');
    }
  });
}

// ========================================
// データ行を書く
// ========================================
function writeDataRows(sheet, dates, filtered, employees) {
  // 高速化のため2次元配列で一括書き込み
  const values = [];
  const bgColors = [];

  // 勤務地グループのラベルを管理
  let prevLocation = null;

  employees.forEach(emp => {
    const row = [];
    const colors = [];

    // 勤務地（グループ変化時のみ表示）
    row.push(emp.location !== prevLocation ? emp.location : '');
    colors.push('#E3F2FD');
    prevLocation = emp.location;

    // 氏名
    row.push(emp.name);
    colors.push('#E3F2FD');

    // 各日のシフト
    dates.forEach(d => {
      const entry = filtered.find(r =>
        r.name === emp.name &&
        r.date instanceof Date &&
        r.date.getFullYear() === d.getFullYear() &&
        r.date.getMonth() === d.getMonth() &&
        r.date.getDate() === d.getDate()
      );

      const dow = d.getDay();
      if (entry) {
        const label = entry.notes ? `${entry.shift}\n${entry.notes}` : entry.shift;
        row.push(label);
        colors.push(SHIFT_COLORS[entry.shift] || '#FFE082');
      } else {
        row.push('');
        colors.push(dow === 0 || dow === 6 ? WEEKEND_COLOR : DEFAULT_COLOR);
      }
    });

    values.push(row);
    bgColors.push(colors);
  });

  if (values.length === 0) return;

  const startRow = 4;
  const numCols = values[0].length;
  sheet.getRange(startRow, 1, values.length, numCols).setValues(values);
  sheet.getRange(startRow, 1, values.length, numCols).setBackgrounds(bgColors);
}

// ========================================
// 書式調整
// ========================================
function formatSheet(sheet, numDateCols, employees) {
  const totalCols = numDateCols + 2;
  const totalRows = employees.length + 3;

  // ウィンドウ枠の固定は結合より先に行う
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(2);

  // タイトル行（列固定後に結合）
  sheet.getRange(1, 1, 1, totalCols).merge()
    .setFontSize(14).setFontWeight('bold')
    .setBackground('#1565C0').setFontColor('#FFFFFF')
    .setHorizontalAlignment('center');

  // ヘッダー2・3行
  sheet.getRange(2, 1, 2, totalCols)
    .setFontWeight('bold')
    .setHorizontalAlignment('center')
    .setBackground('#1E88E5')
    .setFontColor('#FFFFFF');

  // 罫線
  sheet.getRange(2, 1, totalRows, totalCols)
    .setBorder(true, true, true, true, true, true,
      '#BDBDBD', SpreadsheetApp.BorderStyle.SOLID);

  // 列幅
  sheet.setColumnWidth(1, 100); // 勤務地
  sheet.setColumnWidth(2, 90);  // 氏名
  for (let c = 3; c <= totalCols; c++) {
    sheet.setColumnWidth(c, 55);
  }

  // 行の折り返し・高さ
  sheet.getRange(4, 1, employees.length, totalCols)
    .setWrap(true)
    .setVerticalAlignment('middle')
    .setHorizontalAlignment('center');
  sheet.setRowHeights(4, employees.length, 40);

  // 氏名列は左揃え
  sheet.getRange(4, 2, employees.length, 1).setHorizontalAlignment('left');
}

// ========================================
// シフト変更履歴
// ========================================

function addHistoryRecord(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName('history');
  if (!sheet) {
    sheet = ss.insertSheet('history');
    sheet.appendRow(['id', 'date', 'employeeName', 'oldShift', 'newShift', 'changedAt']);
  }
  const id = String(Date.now());
  const changedAt = new Date().toISOString();
  sheet.appendRow([id, data.date || '', data.employeeName || '', data.oldShift || '', data.newShift || '', changedAt]);
  return { ok: true };
}

function getHistoryRecords(limit, employeeName) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('history');
  if (!sheet) return { history: [] };
  const rows = sheet.getDataRange().getValues();
  if (rows.length < 2) return { history: [] };
  const headers = rows[0];
  const idIdx  = headers.indexOf('id');
  const dtIdx  = headers.indexOf('date');
  const empIdx = headers.indexOf('employeeName');
  const oldIdx = headers.indexOf('oldShift');
  const newIdx = headers.indexOf('newShift');
  const catIdx = headers.indexOf('changedAt');
  var dataRows = rows.slice(1);
  // employeeName フィルタ
  if (employeeName) {
    dataRows = dataRows.filter(function(r) {
      return String(r[empIdx] || '').trim() === String(employeeName).trim();
    });
  }
  const history = dataRows.reverse().slice(0, limit).map(function(r) {
    return {
      id:           String(r[idIdx]  || ''),
      date:         String(r[dtIdx]  || ''),
      employeeName: String(r[empIdx] || ''),
      oldShift:     String(r[oldIdx] || ''),
      newShift:     String(r[newIdx] || ''),
      changedAt:    r[catIdx] instanceof Date ? r[catIdx].toISOString() : String(r[catIdx] || '')
    };
  });
  return { history: history };
}

// ========================================
// 有給残日数管理
// ========================================

function incrementUsedLeave(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  if (!sheet) return { ok: false, error: 'employees sheet not found' };
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const nameIdx = headers.indexOf('name');
  const usedIdx = headers.indexOf('paidLeaveUsed');
  if (nameIdx < 0 || usedIdx < 0) return { ok: false, error: 'paidLeaveUsed column not found' };
  var amount = data.amount != null ? Number(data.amount) : 1;
  if (isNaN(amount) || amount <= 0) amount = 1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][nameIdx]).trim() === String(data.employeeName || '').trim()) {
      var current = Number(rows[i][usedIdx]) || 0;
      var newValue = Math.round((current + amount) * 10) / 10;
      sheet.getRange(i + 1, usedIdx + 1).setValue(newValue);
      return { ok: true, newValue: newValue };
    }
  }
  return { ok: false, error: 'Employee not found' };
}

function initEmployeeLeaveColumns() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  if (!sheet) { Logger.log('employees sheet not found'); return; }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  if (headers.indexOf('hireDate') < 0) {
    var colH = sheet.getLastColumn() + 1;
    sheet.getRange(1, colH).setValue('hireDate');
    Logger.log('hireDate 追加完了');
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  if (headers.indexOf('paidLeaveAllotted') < 0) {
    var col = sheet.getLastColumn() + 1;
    sheet.getRange(1, col).setValue('paidLeaveAllotted');
    var numRows = sheet.getLastRow() - 1;
    if (numRows > 0) sheet.getRange(2, col, numRows, 1).setValue(10);
    Logger.log('paidLeaveAllotted 追加完了');
    headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  }
  if (headers.indexOf('paidLeaveUsed') < 0) {
    var col2 = sheet.getLastColumn() + 1;
    sheet.getRange(1, col2).setValue('paidLeaveUsed');
    var numRows2 = sheet.getLastRow() - 1;
    if (numRows2 > 0) sheet.getRange(2, col2, numRows2, 1).setValue(0);
    Logger.log('paidLeaveUsed 追加完了');
  }
  Logger.log('initEmployeeLeaveColumns 完了');
}

// ========================================
// アニバーサリー休暇残日数管理
// ========================================

function incrementUsedAnniversaryLeave(data) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  if (!sheet) return { ok: false, error: 'employees sheet not found' };
  const rows = sheet.getDataRange().getValues();
  const headers = rows[0];
  const nameIdx = headers.indexOf('name');
  const usedIdx = headers.indexOf('anniversaryLeaveUsed');
  if (nameIdx < 0 || usedIdx < 0) return { ok: false, error: 'anniversaryLeaveUsed column not found' };
  // amount: 1=全日, 0.5=AM/PM半日
  var amount = parseFloat(data.amount) || 1;
  for (var i = 1; i < rows.length; i++) {
    if (String(rows[i][nameIdx]).trim() === String(data.employeeName || '').trim()) {
      var current = Number(rows[i][usedIdx]) || 0;
      var newVal = Math.round((current + amount) * 10) / 10; // 浮動小数点誤差回避
      sheet.getRange(i + 1, usedIdx + 1).setValue(newVal);
      return { ok: true, newValue: newVal };
    }
  }
  return { ok: false, error: 'Employee not found' };
}

function initAnniversaryLeaveColumns() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('employees');
  if (!sheet) { Logger.log('employees sheet not found'); return; }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('anniversaryLeaveAllotted') < 0) {
    var col = sheet.getLastColumn() + 1;
    sheet.getRange(1, col).setValue('anniversaryLeaveAllotted');
    var numRows = sheet.getLastRow() - 1;
    if (numRows > 0) sheet.getRange(2, col, numRows, 1).setValue(5);
    Logger.log('anniversaryLeaveAllotted 追加完了');
  }
  headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  if (headers.indexOf('anniversaryLeaveUsed') < 0) {
    var col2 = sheet.getLastColumn() + 1;
    sheet.getRange(1, col2).setValue('anniversaryLeaveUsed');
    var numRows2 = sheet.getLastRow() - 1;
    if (numRows2 > 0) sheet.getRange(2, col2, numRows2, 1).setValue(0);
    Logger.log('anniversaryLeaveUsed 追加完了');
  }
  Logger.log('initAnniversaryLeaveColumns 完了');
}

// ========================================
// 管理者 PIN 認証
// ========================================

function verifyAdminPin(data) {
  var pin = String(data.pin || '').trim();
  if (!pin) return { ok: false };
  var stored = PropertiesService.getScriptProperties().getProperty('ADMIN_PIN');
  if (!stored) return { ok: false, error: 'ADMIN_PIN not set' };
  return { ok: pin === stored };
}

// ========================================
// 凡例
// ========================================
function writeLegend(sheet, startRow) {
  sheet.getRange(startRow, 1).setValue('【凡例】').setFontWeight('bold');
  let col = 2;
  for (const [label, color] of Object.entries(SHIFT_COLORS)) {
    sheet.getRange(startRow, col).setValue(label)
      .setBackground(color)
      .setHorizontalAlignment('center')
      .setBorder(true, true, true, true, false, false,
        '#9E9E9E', SpreadsheetApp.BorderStyle.SOLID);
    col++;
  }
}

// ========================================
// 有給・アニバーサリー休暇 自動付与
// ========================================

var PAID_LEAVE_TABLE_GAS = [
  { months: 6,  days: 10 },
  { months: 18, days: 11 },
  { months: 30, days: 12 },
  { months: 42, days: 14 },
  { months: 54, days: 16 },
  { months: 66, days: 18 },
  { months: 78, days: 20 }, // 6.5年以降は毎年20日
];

function addMonthsGas(date, months) {
  var d = new Date(date.getTime());
  d.setMonth(d.getMonth() + months);
  return d;
}
function addYearsGas(date, years) {
  var d = new Date(date.getTime());
  d.setFullYear(d.getFullYear() + years);
  return d;
}
function toMidnight(date) {
  var d = new Date(date.getTime());
  d.setHours(0, 0, 0, 0);
  return d;
}

// 本日時点で「最後に到来した付与日」とその日数を返す
function getLastPaidLeaveGrant(hireDate, today) {
  var lastGrant = null;
  for (var i = 0; i < PAID_LEAVE_TABLE_GAS.length; i++) {
    var grantDate = toMidnight(addMonthsGas(hireDate, PAID_LEAVE_TABLE_GAS[i].months));
    if (grantDate <= today) {
      lastGrant = { date: grantDate, days: PAID_LEAVE_TABLE_GAS[i].days };
    }
  }
  // 6.5年以降：毎年付与
  var base = toMidnight(addMonthsGas(hireDate, 78));
  if (base <= today) {
    var grantDate = base;
    while (true) {
      var next = toMidnight(addYearsGas(grantDate, 1));
      if (next <= today) { grantDate = next; } else { break; }
    }
    lastGrant = { date: grantDate, days: 20 };
  }
  return lastGrant;
}

// スプレッドシートに付与管理列を追加（初回のみ）
function initAutoGrantColumns() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('employees');
  if (!sheet) return;
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var cols = ['paidLeaveGrantedAt', 'anniversaryLeaveGrantedAt'];
  cols.forEach(function(col) {
    if (headers.indexOf(col) < 0) {
      sheet.getRange(1, sheet.getLastColumn() + 1).setValue(col);
      Logger.log(col + ' 列追加完了');
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    }
  });
  Logger.log('initAutoGrantColumns 完了');
}

// 自動付与メイン処理
function autoGrantLeave() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName('employees');
  if (!sheet) return [];
  var rows = sheet.getDataRange().getValues();
  var headers = rows[0];

  var idx = function(name) { return headers.indexOf(name); };
  var nameIdx        = idx('name');
  var hireDateIdx    = idx('hireDate');
  var paidAlIdx      = idx('paidLeaveAllotted');
  var paidUsedIdx    = idx('paidLeaveUsed');
  var paidGrantedIdx = idx('paidLeaveGrantedAt');
  var annivAlIdx     = idx('anniversaryLeaveAllotted');
  var annivUsedIdx   = idx('anniversaryLeaveUsed');
  var annivGrantedIdx= idx('anniversaryLeaveGrantedAt');

  var today = toMidnight(new Date());
  var log = [];

  for (var i = 1; i < rows.length; i++) {
    var row = rows[i];
    if (!row[nameIdx]) continue;
    var hireDateVal = row[hireDateIdx];
    if (!hireDateVal) continue;
    var hireDate = toMidnight(hireDateVal instanceof Date ? hireDateVal : new Date(hireDateVal));
    if (isNaN(hireDate.getTime())) continue;

    // ── 有給休暇 ──
    if (paidAlIdx >= 0 && paidGrantedIdx >= 0) {
      var lastGrant = getLastPaidLeaveGrant(hireDate, today);
      if (lastGrant) {
        var lastGrantedRaw = row[paidGrantedIdx];
        var lastGrantedDate = lastGrantedRaw
          ? toMidnight(lastGrantedRaw instanceof Date ? lastGrantedRaw : new Date(lastGrantedRaw))
          : null;
        var shouldGrant = !lastGrantedDate || lastGrantedDate < lastGrant.date;
        if (shouldGrant) {
          // 繰越 = 未消化残日数（最大20日まで）
          var currentAl = Number(row[paidAlIdx]) || 0;
          var currentUsed = Number(row[paidUsedIdx]) || 0;
          var carryOver = Math.min(20, Math.max(0, currentAl - currentUsed));
          var newAl = carryOver + lastGrant.days;
          sheet.getRange(i + 1, paidAlIdx + 1).setValue(newAl);
          if (paidUsedIdx >= 0) sheet.getRange(i + 1, paidUsedIdx + 1).setValue(0);
          sheet.getRange(i + 1, paidGrantedIdx + 1).setValue(
            Utilities.formatDate(lastGrant.date, 'Asia/Tokyo', 'yyyy-MM-dd'));
          var msg = row[nameIdx] + ': 有給付与 繰越' + carryOver + '+新規' + lastGrant.days + '=' + newAl + '日';
          log.push(msg);
          Logger.log(msg);
        }
      }
    }

    // ── アニバーサリー休暇 ──
    if (annivAlIdx >= 0 && annivGrantedIdx >= 0) {
      // 今年の記念日（入社日の今年版）
      var thisYearAnniv = toMidnight(new Date(hireDate.getTime()));
      thisYearAnniv.setFullYear(today.getFullYear());
      // 入社1年後以降かつ今日以前
      var firstAnniv = toMidnight(addYearsGas(hireDate, 1));
      if (thisYearAnniv >= firstAnniv && thisYearAnniv <= today) {
        var annivGrantedRaw = row[annivGrantedIdx];
        var annivGrantedDate = annivGrantedRaw
          ? toMidnight(annivGrantedRaw instanceof Date ? annivGrantedRaw : new Date(annivGrantedRaw))
          : null;
        var annivShouldGrant = !annivGrantedDate ||
          annivGrantedDate.getFullYear() < today.getFullYear();
        if (annivShouldGrant) {
          var annivDays = Number(row[annivAlIdx]) || 5;
          sheet.getRange(i + 1, annivAlIdx + 1).setValue(annivDays);
          if (annivUsedIdx >= 0) sheet.getRange(i + 1, annivUsedIdx + 1).setValue(0);
          sheet.getRange(i + 1, annivGrantedIdx + 1).setValue(
            Utilities.formatDate(thisYearAnniv, 'Asia/Tokyo', 'yyyy-MM-dd'));
          var amsg = row[nameIdx] + ': アニバーサリー付与 ' + annivDays + '日 リセット';
          log.push(amsg);
          Logger.log(amsg);
        }
      }
    }
  }
  Logger.log('autoGrantLeave 完了: ' + log.length + '件処理');
  return log;
}

// 毎日7時に autoGrantLeave を実行するトリガーを設定
function initAutoGrantTrigger() {
  // 既存の同名トリガーを削除
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'autoGrantLeave') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('autoGrantLeave')
    .timeBased()
    .everyDays(1)
    .atHour(7)
    .create();
  Logger.log('autoGrantLeave トリガー設定完了（毎日7:00）');
}
