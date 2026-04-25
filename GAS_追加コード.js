// ============================================================
// GAS 追加コード  ─  以下を既存の doGet() の case 文に追加してください
// ============================================================

// ─── doGet の switch 文に追加する case ───────────────────────

case 'addHistory':
  return addHistoryRecord(
    params.date,
    params.employeeName,
    params.oldShift,
    params.newShift
  );

case 'getHistory':
  return getHistoryRecords(Number(params.limit) || 60);

case 'incrementUsedLeave':
  return incrementUsedLeave(params.employeeName);

// ─── また、action=all の従業員データに有給フィールドを追加する ──
// 既存の getAll() 内で employees を組み立てる部分に追記してください:
//
//   paidLeaveAllotted: Number(row[4]) || 10,
//   paidLeaveUsed:     Number(row[5]) || 0,
//
// (row[4], row[5] はスプレッドシートの列番号に合わせて調整)

// ─── 新規関数 ────────────────────────────────────────────────

/**
 * 変更履歴を「History」シートに追記する
 */
function addHistoryRecord(date, employeeName, oldShift, newShift) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName('History');
  if (!sheet) {
    sheet = ss.insertSheet('History');
    sheet.appendRow(['ID', 'date', 'employeeName', 'oldShift', 'newShift', 'changedAt']);
  }
  const id = Utilities.getUuid();
  const changedAt = new Date().toISOString();
  sheet.appendRow([id, date, employeeName, oldShift, newShift, changedAt]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * History シートから最新 limit 件を返す
 */
function getHistoryRecords(limit) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('History');
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ history: [] }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const data = sheet.getDataRange().getValues();
  // 先頭行はヘッダー、最新順に並べる
  const rows = data.slice(1).reverse().slice(0, limit);
  const history = rows.map(r => ({
    id:           String(r[0]),
    date:         String(r[1]),
    employeeName: String(r[2]),
    oldShift:     String(r[3]),
    newShift:     String(r[4]),
    changedAt:    r[5] instanceof Date ? r[5].toISOString() : String(r[5]),
  }));
  return ContentService
    .createTextOutput(JSON.stringify({ history }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 従業員の使用済み有給日数を +1 する
 * ※ Employees シートの「paidLeaveUsed」列 (F列 = index 5 を想定) を更新
 */
function incrementUsedLeave(employeeName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Employees'); // シート名を確認して変更
  if (!sheet) return ContentService
    .createTextOutput(JSON.stringify({ ok: false, error: 'sheet not found' }))
    .setMimeType(ContentService.MimeType.JSON);

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][1] === employeeName) { // B列 = 名前 (index 1)
      const currentUsed = Number(data[i][5]) || 0;
      sheet.getRange(i + 1, 6).setValue(currentUsed + 1); // F列
      break;
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 従業員情報の更新（有給フィールド対応版）
 * 既存の updateEmployee 関数を以下で置き換えてください
 */
function updateEmployee(id, name, role, location, paidLeaveAllotted, paidLeaveUsed) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Employees');
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.getRange(i + 1, 2).setValue(name);
      sheet.getRange(i + 1, 3).setValue(role);
      sheet.getRange(i + 1, 4).setValue(location);
      sheet.getRange(i + 1, 5).setValue(Number(paidLeaveAllotted) || 10); // E列
      sheet.getRange(i + 1, 6).setValue(Number(paidLeaveUsed) || 0);      // F列
      break;
    }
  }
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 従業員の追加（有給フィールド対応版）
 * 既存の addEmployee 関数を以下で置き換えてください
 */
function addEmployee(name, role, location, paidLeaveAllotted, paidLeaveUsed) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Employees');
  const id = Utilities.getUuid();
  sheet.appendRow([id, name, role, location,
    Number(paidLeaveAllotted) || 10,
    Number(paidLeaveUsed) || 0]);
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, id }))
    .setMimeType(ContentService.MimeType.JSON);
}
