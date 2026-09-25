
(function(){
  const BUNDLE_KEY='evana_bundle_v1';
  const LEGACY_CLIENTS='evana_clients_v1';
  const LEGACY_INVOICES='evana_invoices_v1';
  const LEGACY_DRAFT='evana_current_draft_v1';
  const META_KEY='evana_bundle_meta_v1';
  let listeners=[]; let timer=null;
  const safe=(x,f)=>{try{return JSON.parse(x)}catch{return f}};
  const cfg=()=>window.EVANA_SUPABASE_CONFIG||{};
  const hasValidConfig=()=>!!(cfg().url&&cfg().anonKey&&!String(cfg().url).includes('PASTE_YOUR')&&!String(cfg().anonKey).includes('PASTE_YOUR'));
  const emit=(message,connected=false,error=false)=>listeners.forEach(fn=>{try{fn({message,connected,error})}catch{}});
  const onStatus=fn=>{if(typeof fn==='function')listeners.push(fn)};
  function normalizeBundle(b={}){
    return {version:1,updatedAt:b.updatedAt||safe(localStorage.getItem(META_KEY),{})?.updatedAt||new Date(0).toISOString(),clients:Array.isArray(b.clients)?b.clients:[],invoices:Array.isArray(b.invoices)?b.invoices:[],currentDraft:b.currentDraft||null};
  }
  function readLocalBundle(){
    const raw=localStorage.getItem(BUNDLE_KEY);
    if(raw) return normalizeBundle(safe(raw,{}));
    return normalizeBundle({clients:safe(localStorage.getItem(LEGACY_CLIENTS),[]),invoices:safe(localStorage.getItem(LEGACY_INVOICES),[]),currentDraft:safe(localStorage.getItem(LEGACY_DRAFT),null),updatedAt:safe(localStorage.getItem(META_KEY),{})?.updatedAt});
  }
  function writeLocalBundle(b){
    const n=normalizeBundle(b); localStorage.setItem(BUNDLE_KEY,JSON.stringify(n)); localStorage.setItem(LEGACY_CLIENTS,JSON.stringify(n.clients)); localStorage.setItem(LEGACY_INVOICES,JSON.stringify(n.invoices)); if(n.currentDraft)localStorage.setItem(LEGACY_DRAFT,JSON.stringify(n.currentDraft)); localStorage.setItem(META_KEY,JSON.stringify({updatedAt:n.updatedAt})); return n;
  }
  const newer=(a,b)=>new Date(a?.updatedAt||0).getTime()>new Date(b?.updatedAt||0).getTime();
  const hasContent=b=>!!(b&&((b.clients||[]).length||(b.invoices||[]).length||(b.currentDraft&&Array.isArray(b.currentDraft.rooms)&&b.currentDraft.rooms.length)));
  function headers(){return {'apikey':cfg().anonKey,'Authorization':'Bearer '+cfg().anonKey,'Content-Type':'application/json'};}
  async function fetchWithTimeout(url,opts={},ms=5000){
    const ctrl=new AbortController(); const t=setTimeout(()=>ctrl.abort(),ms);
    try{return await fetch(url,{...opts,signal:ctrl.signal})}finally{clearTimeout(t)}
  }
  async function init(){
    if(hasValidConfig()) emit('Cloud sync connected.',true,false); else emit('Local autosave only. Add Supabase config to sync phone + computer.',false,false);
    return hasValidConfig();
  }
  async function fetchRemoteBundle(){
    if(!hasValidConfig()) return null;
    const c=cfg(), wid=encodeURIComponent(c.workspaceId||'evana-main');
    try{
      const r=await fetchWithTimeout(`${c.url}/rest/v1/evana_app_state?workspace_id=eq.${wid}&select=payload,updated_at`,{headers:headers()},5000);
      if(!r.ok){emit(`Cloud read failed (${r.status}).`,true,true);return null;}
      const rows=await r.json(); if(!Array.isArray(rows)||!rows.length)return null;
      const row=rows[0], b=normalizeBundle(row.payload||{}); if((!b.updatedAt||b.updatedAt===new Date(0).toISOString())&&row.updated_at)b.updatedAt=row.updated_at; return b;
    }catch(e){console.error(e);emit('Cloud read failed. Using local autosave.',true,true);return null;}
  }
  async function pushBundle(bundle){
    if(!hasValidConfig()) return false;
    const c=cfg(), payload=normalizeBundle(bundle); if(!payload.updatedAt||payload.updatedAt===new Date(0).toISOString())payload.updatedAt=new Date().toISOString();
    emit('Syncing to cloud…',true,false);
    try{
      const r=await fetchWithTimeout(`${c.url}/rest/v1/evana_app_state?on_conflict=workspace_id`,{method:'POST',headers:{...headers(),'Prefer':'resolution=merge-duplicates,return=minimal'},body:JSON.stringify([{workspace_id:c.workspaceId||'evana-main',payload,updated_at:payload.updatedAt}])},5000);
      if(!r.ok){emit(`Cloud save failed (${r.status}).`,true,true);return false;}
      emit(`Cloud synced • ${new Date(payload.updatedAt).toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}`,true,false);return true;
    }catch(e){console.error(e);emit('Cloud save failed. Local copy is safe.',true,true);return false;}
  }
  async function getStartupBundle(){
    let local=writeLocalBundle(readLocalBundle());
    await init();
    const remote=await fetchRemoteBundle();
    let winner=local;
    if(remote&&hasContent(remote)&&(!hasContent(local)||newer(remote,local))) winner=writeLocalBundle(remote);
    else if(hasValidConfig()&&hasContent(local)) setTimeout(()=>pushBundle(local),0);
    return winner;
  }
  async function savePartial(partial,opts={}){
    const cur=readLocalBundle(), next=writeLocalBundle({...cur,...partial,updatedAt:new Date().toISOString()});
    if(timer)clearTimeout(timer);
    if(opts.immediate) await pushBundle(next); else if(hasValidConfig()){emit('Saved locally. Waiting to sync…',true,false);timer=setTimeout(()=>pushBundle(next),opts.delay||900)} else emit('Saved locally in this browser.',false,false);
    return next;
  }
  async function pullLatest(){
    const local=readLocalBundle(); await init(); const remote=await fetchRemoteBundle(); if(remote&&newer(remote,local))return writeLocalBundle(remote); return local;
  }
  window.EvanaSync={init,onStatus,readLocalBundle,writeLocalBundle,getStartupBundle,savePartial,pullLatest,hasValidConfig,settings:cfg,hasContent};
})();
