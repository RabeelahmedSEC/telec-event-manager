/* TELEC Smart Event Manager — GitHub Pages Demo API
   Runs fully in the browser. Data is stored in localStorage.
   This is for management demonstration only, not production security. */
(() => {
  const DB_KEY = 'telecGithubDemoDbV1';
  const SESSION_KEY = 'telecGithubDemoSession';
  const originalFetch = window.fetch.bind(window);
  const uid = p => p + Math.random().toString(36).slice(2) + Date.now().toString(36);
  const now = () => new Date().toISOString();
  const initial = () => ({
    version: 1,
    users: [{id:'u1',name:'Administrator',username:'admin',password:'Telec@2026',role:'admin',active:true,createdAt:now()}],
    events: [],
    audit: [],
    settings: {
      geminiApiKey: '',
      appsScriptUrl: 'https://script.google.com/macros/s/AKfycbxLiidZz0j7e65Pn8m-FavIvE_7p-vn7i4-CSrgO5cYm2YiYP0JmES7AEY1OMHLYuxuEA/exec',
      autoSheetSync: true
    }
  });
  const read = () => { try { return JSON.parse(localStorage.getItem(DB_KEY)) || initial(); } catch { return initial(); } };
  const save = db => localStorage.setItem(DB_KEY, JSON.stringify(db));
  if (!localStorage.getItem(DB_KEY)) save(initial());
  const json = (data,status=200) => new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});
  const body = async opt => { try { return JSON.parse(opt?.body || '{}'); } catch { return {}; } };
  const authUser = () => { const s=JSON.parse(localStorage.getItem(SESSION_KEY)||'null'); if(!s)return null; return read().users.find(u=>u.id===s.id&&u.active)||null; };
  const audit = (db,u,action,detail) => db.audit.unshift({id:uid('a'),at:now(),user:u.name,username:u.username,action,detail});
  const safeUser = u => { const {password,...x}=u; return x; };
  const cleanEvent = x => ({
    eventDate:String(x.eventDate||''), eventTime:String(x.eventTime||''), familyPersonName:String(x.familyPersonName||'').trim(),
    eventType:String(x.eventType||'').trim(), day:String(x.day||''), venueLocation:String(x.venueLocation||'').trim(),
    city:String(x.city||'').trim(), googleMapsLink:String(x.googleMapsLink||'').trim(), details:String(x.details||'').trim(),
    status:['Pending','Confirmed','Tentative','Regretted'].includes(x.status)?x.status:'Pending', posterName:String(x.posterName||'')
  });
  async function sheetCall(url,payload={action:'test'}) {
    if(!url) throw new Error('Google Apps Script URL is required.');
    const r=await originalFetch(url,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(payload)});
    let d={}; try{d=await r.json()}catch{d={ok:r.ok,message:'Request sent to Google Sheet.'}}
    if(!r.ok||d.success===false||d.ok===false) throw new Error(d.message||'Google Sheet request failed.');
    return d;
  }
  async function geminiGenerate(key,parts){
    if(!key) throw new Error('Gemini API key is required.');
    const models=['gemini-2.5-flash','gemini-2.0-flash']; let last='Gemini request failed.';
    for(const model of models){
      try{
        const r=await originalFetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts}]})});
        const d=await r.json(); if(!r.ok) throw new Error(d?.error?.message||`Gemini error ${r.status}`);
        return {text:d?.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('')||'',model};
      }catch(e){last=e.message}
    }
    throw new Error(last);
  }
  const extractJson = text => { const m=text.match(/\{[\s\S]*\}/); if(!m) throw new Error('AI response did not contain event data.'); return JSON.parse(m[0]); };

  const pick = (o,...keys) => { for (const k of keys) if (o && o[k] != null && String(o[k]).trim() !== '') return o[k]; return ''; };
  const normaliseRemoteEvent = (row,index=0) => {
    if (Array.isArray(row)) {
      row = {eventDate:row[0],eventTime:row[1],familyPersonName:row[2],eventType:row[3],day:row[4],venueLocation:row[5],city:row[6],googleMapsLink:row[7],details:row[8],status:row[9]};
    }
    const e=cleanEvent({
      eventDate:pick(row,'eventDate','Event Date','date','Date'),
      eventTime:pick(row,'eventTime','Event Time','time','Time'),
      familyPersonName:pick(row,'familyPersonName','Family / Person Name','person','Person','name','Name'),
      eventType:pick(row,'eventType','Event Type','type','Type')||'Meeting',
      day:pick(row,'day','Day'),
      venueLocation:pick(row,'venueLocation','Venue / Location','venue','Venue','location','Location'),
      city:pick(row,'city','City'), googleMapsLink:pick(row,'googleMapsLink','Google Maps','mapsLink'),
      details:pick(row,'details','Details','Additional Details'), status:pick(row,'status','Status')||'Pending', posterName:pick(row,'posterName')
    });
    if (/^\d{1,2}[\/-]\d{1,2}[\/-]\d{4}$/.test(e.eventDate)) {
      const [d,m,y]=e.eventDate.split(/[\/-]/); e.eventDate=`${y}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`;
    }
    if (/^\d{1,2}:\d{2}\s*(am|pm)$/i.test(e.eventTime)) {
      const m=e.eventTime.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i); let h=+m[1]; if(m[3].toLowerCase()==='pm'&&h<12)h+=12;if(m[3].toLowerCase()==='am'&&h===12)h=0;e.eventTime=`${String(h).padStart(2,'0')}:${m[2]}`;
    }
    return {id:String(pick(row,'id','ID')||`sheet-${index}-${e.eventDate}-${e.eventTime}-${e.familyPersonName}`),...e,createdAt:pick(row,'createdAt')||now(),updatedAt:pick(row,'updatedAt')||now(),createdBy:pick(row,'createdBy')||'Google Sheet',updatedBy:pick(row,'updatedBy')||'Google Sheet',revision:Number(pick(row,'revision')||1),remote:true};
  };
  async function loadSheetEvents(url){
    if(!url) return [];
    const attempts=[
      {method:'POST',body:JSON.stringify({action:'getEvents'})},
      {method:'POST',body:JSON.stringify({action:'listEvents'})},
      {method:'GET',url:url+(url.includes('?')?'&':'?')+'action=getEvents'}
    ];
    let last='';
    for(const a of attempts){
      try{
        const r=await originalFetch(a.url||url,{method:a.method,headers:a.method==='POST'?{'Content-Type':'text/plain;charset=utf-8'}:undefined,body:a.body});
        const d=await r.json();
        if(!r.ok||d.success===false||d.ok===false){last=d.message||'Unable to read Google Sheet';continue;}
        const rows=Array.isArray(d)?d:(d.events||d.data||d.rows||[]);
        if(Array.isArray(rows)) return rows.map(normaliseRemoteEvent).filter(e=>e.eventDate&&e.eventTime&&e.familyPersonName);
      }catch(e){last=e.message}
    }
    console.warn('Google Sheet read unavailable:',last); return [];
  }
  const eventKey = e => [e.eventDate,e.eventTime,String(e.familyPersonName||'').toLowerCase(),String(e.venueLocation||'').toLowerCase()].join('|');
  const mergeEvents = (local,remote) => {
    const map=new Map();
    for(const e of [...remote,...local]){
      const key=eventKey(e), current=map.get(key);
      if(!current || Number(e.revision||1)>Number(current.revision||1) || (Number(e.revision||1)===Number(current.revision||1) && String(e.updatedAt||'')>String(current.updatedAt||''))) map.set(key,e);
    }
    return [...map.values()];
  };
  async function reconcileLocalUpdates(db,remoteEvents){
    if(!db.settings.autoSheetSync||!db.settings.appsScriptUrl||!remoteEvents.length) return;
    const remoteByKey=new Map(remoteEvents.map(e=>[eventKey(e),e]));
    for(const local of db.events){
      const remote=remoteByKey.get(eventKey(local));
      if(remote && Number(local.revision||1)>Number(remote.revision||1)){
        try{ await sheetCall(db.settings.appsScriptUrl,{action:'updateEvent',event:local,...local}); }
        catch(err){ console.warn('Google Sheet update reconciliation failed:',err.message); }
      }
    }
  }

  window.fetch = async (input,opt={}) => {
    const raw=typeof input==='string'?input:input.url;
    const u=new URL(raw,location.href);
    if(!u.pathname.startsWith('/api/')) return originalFetch(input,opt);
    const path=u.pathname, method=(opt.method||'GET').toUpperCase(), data=await body(opt), db=read();
    if(path==='/api/login'&&method==='POST'){
      const found=db.users.find(x=>x.username.toLowerCase()===String(data.username||'').toLowerCase()&&x.password===String(data.password||'')&&x.active);
      if(!found)return json({error:'Invalid username or password.'},401);
      localStorage.setItem(SESSION_KEY,JSON.stringify({id:found.id})); audit(db,found,'LOGIN','Successful login'); save(db); return json({token:'github-pages-demo'});
    }
    const user=authUser(); if(!user)return json({error:'Session expired. Please sign in again.'},401);
    if(path==='/api/bootstrap'){
      let remoteEvents=await loadSheetEvents(db.settings.appsScriptUrl);
      await reconcileLocalUpdates(db,remoteEvents);
      remoteEvents=await loadSheetEvents(db.settings.appsScriptUrl);
      const allEvents=mergeEvents(db.events,remoteEvents);
      return json({user:safeUser(user),events:allEvents,users:user.role==='admin'?db.users.map(safeUser):[],audit:user.role==='admin'?db.audit.slice(0,200):[],network:['GitHub Pages — multi-device Google Sheet sync',remoteEvents.length?`${remoteEvents.length} events loaded from Google Sheet`:'Google Sheet connected; no shared events returned'],settings:user.role==='admin'?{geminiConfigured:!!db.settings.geminiApiKey,appsScriptUrl:db.settings.appsScriptUrl||'',sheetConfigured:!!db.settings.appsScriptUrl,autoSheetSync:db.settings.autoSheetSync!==false}:{}});
    }
    if(path==='/api/logout'){ localStorage.removeItem(SESSION_KEY); return json({ok:true}); }
    if(path==='/api/events'&&method==='POST'){
      const e=cleanEvent(data); if(!e.eventDate||!e.eventTime||!e.familyPersonName||!e.eventType)return json({error:'Event Date, Event Time, Family / Person Name and Event Type are required.'},400);
      if(db.events.some(x=>x.eventDate===e.eventDate&&x.eventTime===e.eventTime&&x.familyPersonName.toLowerCase()===e.familyPersonName.toLowerCase()&&x.venueLocation.toLowerCase()===e.venueLocation.toLowerCase()))return json({error:'This event already exists.'},409);
      const row={id:uid('e'),...e,createdAt:now(),updatedAt:now(),createdBy:user.name,updatedBy:user.name,revision:1}; db.events.push(row); audit(db,user,'EVENT_CREATED',`${e.familyPersonName} - ${e.eventType}`); save(db);
      let sheetSync={success:false,skipped:true}; if(db.settings.autoSheetSync&&db.settings.appsScriptUrl){try{await sheetCall(db.settings.appsScriptUrl,{action:'addEvent',event:row,...row});sheetSync={success:true}}catch(err){sheetSync={success:false,error:err.message}}}
      return json({...row,sheetSync});
    }
    const eventMatch=path.match(/^\/api\/events\/([^/]+)$/);
    if(eventMatch&&method==='PUT'){
      const e=cleanEvent(data); let i=db.events.findIndex(x=>x.id===eventMatch[1]);
      const base=i>=0?db.events[i]:{id:eventMatch[1],createdAt:now(),createdBy:user.name,revision:Number(data.revision||1)};
      if(i>=0 && +data.revision!==Number(base.revision||1))return json({error:'Another update was detected. Refresh and try again.'},409);
      const updated={...base,...e,id:eventMatch[1],updatedAt:now(),updatedBy:user.name,revision:Number(base.revision||1)+1};
      if(i>=0) db.events[i]=updated; else db.events.push(updated);
      audit(db,user,'EVENT_UPDATED',`${e.familyPersonName} - ${e.eventType}`); save(db);
      let sheetSync={success:false,skipped:true};
      if(db.settings.autoSheetSync&&db.settings.appsScriptUrl){try{await sheetCall(db.settings.appsScriptUrl,{action:'updateEvent',event:updated,...updated});sheetSync={success:true}}catch(err){sheetSync={success:false,error:err.message}}}
      return json({...updated,sheetSync});
    }
    if(eventMatch&&method==='DELETE'){
      if(user.role!=='admin')return json({error:'Administrator access required.'},403); const i=db.events.findIndex(x=>x.id===eventMatch[1]); const e=i>=0?db.events.splice(i,1)[0]:{id:eventMatch[1],familyPersonName:'Shared event'}; audit(db,user,'EVENT_DELETED',e.familyPersonName); save(db);
      let sheetSync={success:false,skipped:true}; if(db.settings.autoSheetSync&&db.settings.appsScriptUrl){try{await sheetCall(db.settings.appsScriptUrl,{action:'deleteEvent',id:eventMatch[1]});sheetSync={success:true}}catch(err){sheetSync={success:false,error:err.message}}}
      return json({ok:true,sheetSync});
    }
    if(path==='/api/users'&&method==='POST'){
      if(user.role!=='admin')return json({error:'Administrator access required.'},403); const username=String(data.username||'').trim(); if(!username||!data.name||String(data.password||'').length<8)return json({error:'Complete all user fields. Password must be at least 8 characters.'},400); if(db.users.some(x=>x.username.toLowerCase()===username.toLowerCase()))return json({error:'Username already exists.'},409);
      const n={id:uid('u'),name:String(data.name).trim(),username,password:String(data.password),role:['admin','editor','viewer'].includes(data.role)?data.role:'viewer',active:true,createdAt:now()}; db.users.push(n); audit(db,user,'USER_CREATED',username); save(db); return json(safeUser(n));
    }
    const userMatch=path.match(/^\/api\/users\/([^/]+)$/);
    if(userMatch&&method==='PATCH'){
      if(user.role!=='admin')return json({error:'Administrator access required.'},403); const x=db.users.find(v=>v.id===userMatch[1]); if(!x)return json({error:'User not found.'},404); x.active=!!data.active; audit(db,user,'USER_UPDATED',x.username); save(db); return json(safeUser(x));
    }
    if(path==='/api/settings'&&method==='POST'){
      if(user.role!=='admin')return json({error:'Administrator access required.'},403); if(String(data.geminiApiKey||'').trim())db.settings.geminiApiKey=String(data.geminiApiKey).trim(); if('appsScriptUrl'in data)db.settings.appsScriptUrl=String(data.appsScriptUrl||'').trim(); if(typeof data.autoSheetSync==='boolean')db.settings.autoSheetSync=data.autoSheetSync; audit(db,user,'SETTINGS_UPDATED','Demo connections updated'); save(db); return json({ok:true,geminiConfigured:!!db.settings.geminiApiKey,sheetConfigured:!!db.settings.appsScriptUrl,appsScriptUrl:db.settings.appsScriptUrl,autoSheetSync:db.settings.autoSheetSync!==false});
    }
    if(path==='/api/settings/test-sheet'&&method==='POST'){
      try{
        const d=await sheetCall(String(data.appsScriptUrl||'').trim()||db.settings.appsScriptUrl);
        return json({ok:true,message:d.message||'Google Sheet connection successful.'});
      }catch(e){
        // Older TELEC Apps Script deployments do not implement action "test".
        // Receiving this response still proves that the deployed Web App URL is reachable.
        if(/invalid action:\s*test/i.test(String(e.message||''))){
          return json({ok:true,message:'Google Sheet Web App is active. Test action is not required; new events will sync using addEvent.'});
        }
        return json({error:e.message},400);
      }
    }
    if(path==='/api/settings/test-gemini'&&method==='POST'){try{const r=await geminiGenerate(String(data.geminiApiKey||'').trim()||db.settings.geminiApiKey,[{text:'Reply with only the word OK.'}]);return json({ok:true,message:`Gemini connection successful (${r.model}).`})}catch(e){return json({error:e.message},400)}}
    if(path==='/api/poster/parse'&&method==='POST'){
      try{const base64=String(data.dataUrl||'').split(',')[1],mime=String(data.dataUrl||'').match(/^data:([^;]+)/)?.[1]||'image/jpeg'; const prompt='Read this event poster and return ONLY valid JSON with keys eventDate (YYYY-MM-DD), eventTime (HH:MM 24-hour), familyPersonName, eventType, day, venueLocation, city, googleMapsLink, details. Use empty strings when unknown.'; const r=await geminiGenerate(db.settings.geminiApiKey,[{text:prompt},{inlineData:{mimeType:mime,data:base64}}]); return json(extractJson(r.text));}catch(e){return json({error:e.message},400)}
    }
    if(path==='/api/backup'&&method==='POST'){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`TELEC_Demo_Backup_${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);audit(db,user,'BACKUP_CREATED','Browser backup downloaded');save(db);return json({ok:true})}
    return json({error:'Demo endpoint not found.'},404);
  };
})();
