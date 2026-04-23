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
    headers.forEach((h, i) => obj[h] = String(r[i] || '').trim());
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
