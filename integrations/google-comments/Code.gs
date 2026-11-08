// Paste into the comments spreadsheet's Extensions > Apps Script. Run setup once.
// Deploy as Web app: Execute as Me; Who has access: Anyone. Keep the Sheet private.
const COMMENTS = Object.freeze({
  sheet: 'Comments', version: 1, pageSize: 30, dailyLimit: 200, maxRows: 10000,
  origins: ['https://runograph.com','https://www.runograph.com'],
  headers: ['ID','Created at (UTC)','Story','Name','Comment','Status','Author reply','Reply at (UTC)','Notification','Request ID','Client hash']
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Runograph comments')
    .addItem('Reply to selected', 'replyToSelected').addItem('Hide selected', 'hideSelected')
    .addItem('Show selected', 'showSelected').addItem('Delete selected permanently', 'deleteSelected')
    .addSeparator().addItem('Send pending notifications', 'notifyPendingComments').addItem('Setup / change email', 'setup').addToUi();
}
function setup() {
  const ss=SpreadsheetApp.getActiveSpreadsheet(),ui=SpreadsheetApp.getUi();
  if(!ss)throw Error('Open this script from the comments spreadsheet.');
  const props=PropertiesService.getScriptProperties();
  const prompt=ui.prompt('Runograph notifications','Notification email (for example runograph01@gmail.com):',ui.ButtonSet.OK_CANCEL);
  if(prompt.getSelectedButton()!==ui.Button.OK)return;
  const email=prompt.getResponseText().trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error('Enter a valid notification email.');
  props.setProperty('COMMENTS_SHEET_ID',ss.getId());props.setProperty('COMMENTS_EMAIL',email);
  if(!props.getProperty('COMMENTS_SECRET'))props.setProperty('COMMENTS_SECRET',Utilities.getUuid()+Utilities.getUuid());
  const sheet=commentSheet_();sheet.setFrozenRows(1);
  sheet.getRange(1,1,1,11).setFontWeight('bold').setBackground('#eeeeee').setWrap(true);
  sheet.setColumnWidth(5,420);sheet.setColumnWidth(7,420);
  sheet.getRange(2,6,sheet.getMaxRows()-1,1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['visible','hidden'],true).setAllowInvalid(false).build());
  if(!ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='notifyPendingComments'))ScriptApp.newTrigger('notifyPendingComments').timeBased().everyHours(1).create();
  SpreadsheetApp.flush();onOpen();ui.alert('Ready. Deploy as Web app (Me / Anyone), then send the /exec URL to connect the website. Keep this spreadsheet private.');
}
function commentSheet_() {
  const id=PropertiesService.getScriptProperties().getProperty('COMMENTS_SHEET_ID');if(!id)throw Error('Run setup first.');
  const ss=SpreadsheetApp.openById(id);let sheet=ss.getSheetByName(COMMENTS.sheet);if(!sheet)sheet=ss.insertSheet(COMMENTS.sheet);
  if(!sheet.getLastRow())sheet.getRange(1,1,1,11).setValues([COMMENTS.headers.slice()]);
  const header=sheet.getRange(1,1,1,11).getDisplayValues()[0];
  if(COMMENTS.headers.some((h,i)=>header[i]!==h))throw Error('Unexpected comment columns. No records were changed.');
  return sheet;
}
function rows_(sheet) {const last=sheet.getLastRow();if(last>COMMENTS.maxRows)throw Error('Archive older comments before accepting more.');return last>1?sheet.getRange(2,1,last-1,11).getDisplayValues():[];}
function digest_(value) {return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value).map(b=>('0'+((b+256)%256).toString(16)).slice(-2)).join('');}
function signature_(value) {const secret=PropertiesService.getScriptProperties().getProperty('COMMENTS_SECRET');if(!secret)throw Error('Run setup first.');return Utilities.base64EncodeWebSafe(Utilities.computeHmacSha256Signature(value,secret)).replace(/=+$/,'');}
function challenge_(story,client) {
  const a=Math.floor(Math.random()*8)+1,b=Math.floor(Math.random()*8)+1;
  const payload=Utilities.base64EncodeWebSafe(JSON.stringify({story:story,client:client,t:Date.now(),id:Utilities.getUuid(),a:a,b:b})).replace(/=+$/,'');
  return {token:payload+'.'+signature_(payload),question:'What is '+a+' + '+b+'?'};
}
function verifyChallenge_(token,story,client,answer) {
  const parts=String(token||'').split('.');if(parts.length!==2||parts[0].length>1200||signature_(parts[0])!==parts[1])throw Error('invalid');
  const c=JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(parts[0])).getDataAsString());
  const age=Date.now()-c.t;
  if(c.story!==story||c.client!==client||age<1200||age>1800000||String(c.a+c.b)!==String(answer).trim())throw Error('invalid');
  return c;
}
function allowedOrigins_() {
  const extra=PropertiesService.getScriptProperties().getProperty('COMMENTS_PREVIEW_ORIGIN');
  return COMMENTS.origins.concat(extra&&/^https:\/\/[^/]+$/.test(extra)?[extra]:[]);
}
function parameters_(e) {
  const p=e&&e.parameter||{};
  if(allowedOrigins_().indexOf(p.origin)<0||!/^[a-f0-9]{48}$/.test(p.nonce||''))throw Error('invalid');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(p.story||'')||p.story.length>100||!/^[a-f0-9]{32}$/.test(p.client||''))throw Error('invalid');
  return p;
}
function doGet(e) {
  if(!(e&&e.parameter&&e.parameter.action))return ContentService.createTextOutput(JSON.stringify({service:'runograph-comments',version:COMMENTS.version})).setMimeType(ContentService.MimeType.JSON);
  let p;try {
    p=parameters_(e);if(p.action!=='list')return response_(p,false,'invalid');
    const cache=CacheService.getScriptCache(),key='read:'+digest_(p.client),count=Number(cache.get(key)||0);
    if(count>=60)return response_(p,false,'busy');cache.put(key,String(count+1),60);
    const offset=Number(p.offset||0);if(!Number.isInteger(offset)||offset<0||offset>COMMENTS.maxRows)return response_(p,false,'invalid');
    const all=rows_(commentSheet_()).filter(r=>r[2]===p.story&&r[5]==='visible').reverse();
    const items=all.slice(offset,offset+COMMENTS.pageSize).map(r=>({id:r[0],date:r[1],name:r[3],body:r[4],reply:r[6],replyDate:r[7]}));
    return response_(p,true,'loaded',{items:items,nextOffset:offset+COMMENTS.pageSize<all.length?offset+COMMENTS.pageSize:null,challenge:challenge_(p.story,p.client)});
  }catch(error){return response_(p||{},false,'unavailable');}
}
function doPost(e) {
  let p;try{p=parameters_(e);}catch(error){return response_({},false,'invalid');}
  if(p.action!=='add'||Number(e.contentLength||0)>16000||p.website)return response_(p,false,'invalid');
  const name=String(p.name||'').trim(),body=String(p.body||'').trim();
  if(name.length<1||name.length>60||body.length<3||body.length>3000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(name+body)||(body.match(/https?:\/\//gi)||[]).length>2)return response_(p,false,'invalid');
  let c;try{c=verifyChallenge_(p.token,p.story,p.client,p.answer);}catch(error){return response_(p,false,'invalid');}
  const lock=LockService.getScriptLock();if(!lock.tryLock(10000))return response_(p,false,'busy');
  let result;
  try {
    const sheet=commentSheet_(),rows=rows_(sheet),clientHash=digest_(p.client),prior=rows.find(r=>r[9]===c.id);
    if(prior)return response_(p,prior[2]===p.story&&prior[3]===name&&prior[4]===body&&prior[10]===clientHash,'saved');
    const last=rows.filter(r=>r[10]===clientHash).reduce((n,r)=>Math.max(n,Date.parse(r[1])||0),0);
    if(Date.now()-last<60000)return response_(p,false,'busy');
    const props=PropertiesService.getScriptProperties(),day=new Date().toISOString().slice(0,10),daily=String(props.getProperty('COMMENTS_DAILY')||'').split(':');
    const count=daily[0]===day?Number(daily[1])||0:0;if(count>=COMMENTS.dailyLimit||sheet.getLastRow()>=COMMENTS.maxRows)return response_(p,false,'busy');
    const index=sheet.getLastRow()+1;if(index>sheet.getMaxRows())sheet.insertRowsAfter(sheet.getMaxRows(),100);
    const values=[Utilities.getUuid(),new Date().toISOString(),p.story,name,body,'visible','','','pending',c.id,clientHash];
    // Every text cell is escaped; submitted content can never become a spreadsheet formula.
    sheet.getRange(index,1,1,11).setValues([values.map(v=>typeof v==='string'?"'"+v:v)]);SpreadsheetApp.flush();
    props.setProperty('COMMENTS_DAILY',day+':'+(count+1));result=response_(p,true,'saved');
  }catch(error){return response_(p,false,'unavailable');}finally{lock.releaseLock();}
  try{notifyPendingComments();}catch(error){/* Saved comments remain visible; hourly trigger retries notification. */}
  return result;
}
function response_(p,ok,code,data) {
  const valid=allowedOrigins_().indexOf(p.origin)>=0&&/^[a-f0-9]{48}$/.test(p.nonce||'');
  const payload=JSON.stringify({type:'runograph-comments-result',nonce:p.nonce||'',ok:ok,code:code,data:data||null}).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  return HtmlService.createHtmlOutput('<!doctype html><meta charset="utf-8"><title>Runograph comments</title>'+(valid?'<script>window.top.postMessage('+payload+','+JSON.stringify(p.origin)+');</script>':'' )).setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
function notifyPendingComments() {
  const lock=LockService.getScriptLock();if(!lock.tryLock(5000))return;
  try {
    const props=PropertiesService.getScriptProperties(),email=props.getProperty('COMMENTS_EMAIL');if(!email)return;
    const sheet=commentSheet_(),rows=rows_(sheet),pending=rows.map((r,i)=>({r:r,index:i+2})).filter(x=>x.r[8]==='pending');
    if(!pending.length)return;
    // Do not notify about comments already hidden by the owner.
    for(const x of pending.filter(x=>x.r[5]!=='visible'))sheet.getRange(x.index,9).setValue('skipped');
    const visible=pending.filter(x=>x.r[5]==='visible');if(!visible.length||MailApp.getRemainingDailyQuota()<1)return;
    const day=new Date().toISOString().slice(0,10),sent=String(props.getProperty('COMMENTS_MAIL_DAILY')||'').split(':');
    const count=sent[0]===day?Number(sent[1])||0:0;if(count>=40)return;
    const message=visible.slice(0,20).map(x=>x.r[3]+' on '+x.r[2]+':\n'+x.r[4]+'\nhttps://runograph.com/journal/'+x.r[2]+'/').join('\n\n');
    MailApp.sendEmail(email,'Runograph: '+visible.length+' new comment'+(visible.length===1?'':'s'),message+'\n\nReply, hide or delete in your private spreadsheet:\n'+SpreadsheetApp.openById(props.getProperty('COMMENTS_SHEET_ID')).getUrl());
    for(const x of visible.slice(0,20))sheet.getRange(x.index,9).setValue('sent');
    props.setProperty('COMMENTS_MAIL_DAILY',day+':'+(count+1));
  }finally{lock.releaseLock();}
}
function selected_() {
  const ss=SpreadsheetApp.getActiveSpreadsheet(),sheet=ss.getActiveSheet(),range=sheet.getActiveRange();
  if(sheet.getName()!==COMMENTS.sheet||!range||range.getRow()<2||range.getNumRows()!==1)throw Error('Select one comment row in Comments first.');
  if(!sheet.getRange(range.getRow(),1).getDisplayValue())throw Error('This row has no comment.');
  return {sheet:sheet,row:range.getRow()};
}
function hideSelected(){const s=selected_();s.sheet.getRange(s.row,6).setValue('hidden');}
function showSelected(){const s=selected_();s.sheet.getRange(s.row,6).setValue('visible');}
function deleteSelected(){const s=selected_(),ui=SpreadsheetApp.getUi();if(ui.alert('Delete this comment permanently?','This cannot be undone.',ui.ButtonSet.YES_NO)===ui.Button.YES)s.sheet.deleteRow(s.row);}
function replyToSelected(){const s=selected_(),ui=SpreadsheetApp.getUi(),p=ui.prompt('Your reply','Shown below the comment as Markus · Author. Leave blank to remove the reply.',ui.ButtonSet.OK_CANCEL);if(p.getSelectedButton()!==ui.Button.OK)return;const reply=p.getResponseText().trim();if(reply.length>3000)throw Error('Reply must be 3,000 characters or fewer.');s.sheet.getRange(s.row,7).setValue("'"+reply);s.sheet.getRange(s.row,8).setValue(reply?new Date().toISOString():'');}
