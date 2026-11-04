// Open your Google Sheet > Extensions > Apps Script, paste this file, then run setup once.
// Deploy as a web app: execute as Me, access Anyone. No mail is sent by this script.
const RUNOGRAPH_SIGNUP = Object.freeze({
  sheetName: 'Runograph subscribers',
  origins: ['https://runograph.com', 'https://www.runograph.com', 'https://run-roam-journal-mk.markuskaljuste.chatgpt.site'],
  consentVersion: '2026-11-04-v2',
  consentText: 'I agree to receive occasional Runograph emails about new stories and updates.',
  headers: ['Joined at (UTC)', 'Email', 'Consent', 'Consent version', 'Source', 'Status', 'ID'],
  dailyLimit: 1000
});

function setup() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from your Google Sheet using Extensions > Apps Script.');
  const lock = LockService.getScriptLock();lock.waitLock(10000);
  try {
    subscriberSheet_(spreadsheet);
    PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', spreadsheet.getId());
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
}

function doGet() {
  return ContentService.createTextOutput(JSON.stringify({service:'runograph-signup',version:1,consentVersion:RUNOGRAPH_SIGNUP.consentVersion})).setMimeType(ContentService.MimeType.JSON);
}

function doPost(event) {
  const p = event && event.parameter || {};
  const origin = RUNOGRAPH_SIGNUP.origins.indexOf(p.origin) >= 0 ? p.origin : '';
  const nonce = /^[a-f0-9]{48}$/.test(p.nonce || '') ? p.nonce : '';
  if (!origin || !nonce) return acknowledgement_('', '', false, 'invalid');
  if (Number(event.contentLength || 0) > 4096) return acknowledgement_(origin, nonce, false, 'invalid');
  const email = String(p.email || '').trim().toLowerCase();
  const elapsed = Date.now() - Number(p.startedAt);
  if (p.website || p.consent !== 'yes' || p.version !== RUNOGRAPH_SIGNUP.consentVersion ||
      !Number.isFinite(elapsed) || elapsed < 1200 || elapsed > 86400000 ||
      email.length > 254 || !/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?\.[a-z]{2,63}$/i.test(email) || /\s/.test(email)) {
    return acknowledgement_(origin, nonce, false, 'invalid');
  }
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return acknowledgement_(origin, nonce, false, 'busy');
  try {
    const properties = PropertiesService.getScriptProperties(), id = properties.getProperty('SPREADSHEET_ID');
    if (!id) throw new Error('Run setup from the Google Sheet before enabling the web app.');
    const sheet = subscriberSheet_(SpreadsheetApp.openById(id)), lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      const emails = sheet.getRange(2, 2, lastRow - 1, 1).getValues();
      if (emails.some(row => String(row[0]).replace(/^'/, '').trim().toLowerCase() === email)) return acknowledgement_(origin, nonce, true, 'saved');
    }
    const day = new Date().toISOString().slice(0, 10), stored = String(properties.getProperty('SIGNUP_DAILY') || '').split(':');
    const count = stored[0] === day ? Number(stored[1]) || 0 : 0;
    if (count >= RUNOGRAPH_SIGNUP.dailyLimit) return acknowledgement_(origin, nonce, false, 'busy');
    if (lastRow >= sheet.getMaxRows()) sheet.insertRowsAfter(sheet.getMaxRows(), 200);
    const textEmail = /^[=+\-@]/.test(email) ? "'" + email : email;
    sheet.getRange(lastRow + 1, 1, 1, RUNOGRAPH_SIGNUP.headers.length).setValues([[
      new Date().toISOString(), textEmail, RUNOGRAPH_SIGNUP.consentText, RUNOGRAPH_SIGNUP.consentVersion,
      'runograph.com/coming-soon', 'collected', Utilities.getUuid()
    ]]);
    SpreadsheetApp.flush();
    properties.setProperty('SIGNUP_DAILY', day + ':' + (count + 1));
    return acknowledgement_(origin, nonce, true, 'saved');
  } catch (error) {
    return acknowledgement_(origin, nonce, false, 'unavailable');
  } finally { lock.releaseLock(); }
}

function subscriberSheet_(spreadsheet) {
  let sheet = spreadsheet.getSheetByName(RUNOGRAPH_SIGNUP.sheetName);
  if (!sheet) sheet = spreadsheet.insertSheet(RUNOGRAPH_SIGNUP.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, RUNOGRAPH_SIGNUP.headers.length).setValues([RUNOGRAPH_SIGNUP.headers.slice()]);
    sheet.setFrozenRows(1);
  } else {
    const header = sheet.getRange(1, 1, 1, RUNOGRAPH_SIGNUP.headers.length).getValues()[0];
    if (RUNOGRAPH_SIGNUP.headers.some((value, index) => value !== header[index])) throw new Error('The subscriber tab has different columns; no data was changed.');
  }
  return sheet;
}

function acknowledgement_(origin, nonce, ok, code) {
  const result = JSON.stringify({type:'runograph-signup-result',nonce:nonce,ok:ok,code:code}).replace(/</g, '\\u003c');
  const script = origin ? '<script>window.top.postMessage(' + result + ',' + JSON.stringify(origin) + ');</script>' : '';
  return HtmlService.createHtmlOutput('<!doctype html><html><head><meta charset="utf-8"><title>Runograph signup</title></head><body>' + script + '</body></html>').setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
