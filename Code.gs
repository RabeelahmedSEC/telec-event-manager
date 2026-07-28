/* TELEC Smart Event Manager — Google Apps Script shared database */
const SHEET_NAME = 'Events';
const HEADERS = ['ID','Event Date','Event Time','Family / Person Name','Event Type','Day','Venue / Location','City','Google Maps','Details','Status','Created At','Updated At','Created By','Updated By','Revision'];

function doGet(e) {
  const action = String((e && e.parameter && e.parameter.action) || 'getEvents');
  return handle_({action: action});
}
function doPost(e) {
  try { return handle_(JSON.parse((e && e.postData && e.postData.contents) || '{}')); }
  catch (err) { return output_({success:false,message:String(err.message || err)}); }
}
function handle_(data) {
  const action = String(data.action || '');
  if (action === 'addEvent') return addEvent_(data.event || data);
  if (action === 'updateEvent') return updateEvent_(data.event || data);
  if (action === 'deleteEvent') return deleteEvent_(data.id || (data.event && data.event.id));
  if (action === 'getEvents' || action === 'listEvents' || action === 'test') return output_({success:true,events:getEvents_(),message:'Google Sheet connection successful.'});
  return output_({success:false,message:'Invalid action: ' + action});
}
function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}
function eventRow_(e,id) {
  return [id,e.eventDate||'',e.eventTime||'',e.familyPersonName||'',e.eventType||'Meeting',e.day||'',e.venueLocation||'',e.city||'',e.googleMapsLink||'',e.details||'',e.status||'Pending',e.createdAt||new Date().toISOString(),e.updatedAt||new Date().toISOString(),e.createdBy||'',e.updatedBy||'',Number(e.revision||1)];
}
function addEvent_(e) {
  const sh=sheet_(), id=e.id||Utilities.getUuid(), row=eventRow_(e,id), values=sh.getDataRange().getValues();
  const idIndex=values.slice(1).findIndex(r=>String(r[0])===String(id));
  if(idIndex>=0){ sh.getRange(idIndex+2,1,1,HEADERS.length).setValues([row]); return output_({success:true,id:id,message:'Event updated.'}); }
  const duplicate=values.slice(1).some(r=>String(r[1])===String(row[1])&&String(r[2])===String(row[2])&&String(r[3]).toLowerCase()===String(row[3]).toLowerCase()&&String(r[6]).toLowerCase()===String(row[6]).toLowerCase());
  if(!duplicate) sh.appendRow(row);
  return output_({success:true,id:id,message:duplicate?'Event already exists.':'Event saved.'});
}
function updateEvent_(e) {
  const sh=sheet_(), values=sh.getDataRange().getValues(), id=String(e.id||'');
  let idx=values.slice(1).findIndex(r=>String(r[0])===id);
  if(idx<0){
    idx=values.slice(1).findIndex(r=>String(r[1])===String(e.eventDate||'')&&String(r[2])===String(e.eventTime||'')&&String(r[3]).toLowerCase()===String(e.familyPersonName||'').toLowerCase()&&String(r[6]).toLowerCase()===String(e.venueLocation||'').toLowerCase());
  }
  if(idx<0) return addEvent_(e);
  const existing=values[idx+1], finalId=id||String(existing[0])||Utilities.getUuid();
  if(!e.createdAt)e.createdAt=existing[11]; if(!e.createdBy)e.createdBy=existing[13];
  sh.getRange(idx+2,1,1,HEADERS.length).setValues([eventRow_(e,finalId)]);
  return output_({success:true,id:finalId,message:'Event status/details updated.'});
}
function deleteEvent_(id) {
  const sh=sheet_(), values=sh.getDataRange().getValues(), idx=values.slice(1).findIndex(r=>String(r[0])===String(id||''));
  if(idx>=0)sh.deleteRow(idx+2);
  return output_({success:true,message:idx>=0?'Event deleted.':'Event not found.'});
}
function getEvents_() {
  const sh=sheet_(), values=sh.getDataRange().getDisplayValues();
  if(values.length<2)return [];
  return values.slice(1).filter(r=>r.some(Boolean)).map(r=>({id:r[0],eventDate:normalDate_(r[1]),eventTime:normalTime_(r[2]),familyPersonName:r[3],eventType:r[4],day:r[5],venueLocation:r[6],city:r[7],googleMapsLink:r[8],details:r[9],status:r[10]||'Pending',createdAt:r[11],updatedAt:r[12],createdBy:r[13],updatedBy:r[14],revision:Number(r[15]||1)}));
}
function normalDate_(v){if(!v)return '';const m=String(v).match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);return m?m[3]+'-'+('0'+m[2]).slice(-2)+'-'+('0'+m[1]).slice(-2):String(v)}
function normalTime_(v){if(!v)return '';const m=String(v).match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);if(!m)return String(v);let h=Number(m[1]);const ap=(m[3]||'').toUpperCase();if(ap==='PM'&&h<12)h+=12;if(ap==='AM'&&h===12)h=0;return ('0'+h).slice(-2)+':'+m[2]}
function output_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
