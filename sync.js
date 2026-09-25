
(function(){
  const BUNDLE_KEY = "evana_bundle_v1";
  const LEGACY_CLIENTS = "evana_clients_v1";
  const LEGACY_INVOICES = "evana_invoices_v1";
  const LEGACY_DRAFT = "evana_current_draft_v1";
  const META_KEY = "evana_bundle_meta_v1";

  let initialized = false;
  let supabaseClient = null;
  let statusListeners = [];
  let saveTimer = null;

  function safeParse(raw, fallback){
    try { return JSON.parse(raw); } catch { return fallback; }
  }
  function settings(){
    return window.EVANA_SUPABASE_CONFIG || {};
  }
  function hasValidConfig(){
    const cfg = settings();
    return !!(
      window.supabase &&
      cfg.url && cfg.anonKey &&
      !String(cfg.url).includes('PASTE_YOUR') &&
      !String(cfg.anonKey).includes('PASTE_YOUR')
    );
  }
  function emit(message, connected=false, error=false){
    const payload = { message, connected, error };
    statusListeners.forEach(fn => {
      try { fn(payload); } catch (err) { console.error(err); }
    });
  }
  function onStatus(fn){
    if(typeof fn === 'function') statusListeners.push(fn);
  }
  function normalizeBundle(bundle={}){
    return {
      version: 1,
      updatedAt: bundle.updatedAt || safeParse(localStorage.getItem(META_KEY), {})?.updatedAt || new Date(0).toISOString(),
      clients: Array.isArray(bundle.clients) ? bundle.clients : [],
      invoices: Array.isArray(bundle.invoices) ? bundle.invoices : [],
      currentDraft: bundle.currentDraft || null
    };
  }
  function hasContent(bundle){
    if(!bundle) return false;
    return !!(
      (bundle.currentDraft && Array.isArray(bundle.currentDraft.rooms) && bundle.currentDraft.rooms.length) ||
      (Array.isArray(bundle.clients) && bundle.clients.length) ||
      (Array.isArray(bundle.invoices) && bundle.invoices.length)
    );
  }
  function readLegacyBundle(){
    const clients = safeParse(localStorage.getItem(LEGACY_CLIENTS), []);
    const invoices = safeParse(localStorage.getItem(LEGACY_INVOICES), []);
    const currentDraft = safeParse(localStorage.getItem(LEGACY_DRAFT), null);
    const meta = safeParse(localStorage.getItem(META_KEY), {});
    return normalizeBundle({ clients, invoices, currentDraft, updatedAt: meta.updatedAt || new Date(0).toISOString() });
  }
  function readLocalBundle(){
    const raw = localStorage.getItem(BUNDLE_KEY);
    if(raw){
      return normalizeBundle(safeParse(raw, {}));
    }
    return readLegacyBundle();
  }
  function writeLocalBundle(bundle){
    const normalized = normalizeBundle(bundle);
    localStorage.setItem(BUNDLE_KEY, JSON.stringify(normalized));
    localStorage.setItem(LEGACY_CLIENTS, JSON.stringify(normalized.clients || []));
    localStorage.setItem(LEGACY_INVOICES, JSON.stringify(normalized.invoices || []));
    if(normalized.currentDraft){
      localStorage.setItem(LEGACY_DRAFT, JSON.stringify(normalized.currentDraft));
    }
    localStorage.setItem(META_KEY, JSON.stringify({ updatedAt: normalized.updatedAt }));
    return normalized;
  }
  function newer(a,b){
    return new Date(a?.updatedAt || 0).getTime() > new Date(b?.updatedAt || 0).getTime();
  }
  async function init(){
    if(initialized) return supabaseClient;
    initialized = true;
    if(hasValidConfig()){
      const cfg = settings();
      supabaseClient = window.supabase.createClient(cfg.url, cfg.anonKey);
      emit('Cloud sync connected.', true, false);
    } else {
      emit('Local autosave only. Add Supabase config to sync phone + computer.', false, false);
    }
    return supabaseClient;
  }
  async function fetchRemoteBundle(){
    if(!await init()) return null;
    const cfg = settings();
    const workspaceId = cfg.workspaceId || 'evana-main';
    const { data, error } = await supabaseClient
      .from('evana_app_state')
      .select('payload, updated_at')
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if(error){
      console.error(error);
      emit('Cloud read failed.', true, true);
      return null;
    }
    if(!data) return null;
    const bundle = normalizeBundle(data.payload || {});
    if((!bundle.updatedAt || bundle.updatedAt === new Date(0).toISOString()) && data.updated_at){
      bundle.updatedAt = data.updated_at;
    }
    return bundle;
  }
  async function pushBundle(bundle){
    if(!await init()) return false;
    const cfg = settings();
    const workspaceId = cfg.workspaceId || 'evana-main';
    const payload = normalizeBundle(bundle);
    if(!payload.updatedAt || payload.updatedAt === new Date(0).toISOString()){
      payload.updatedAt = new Date().toISOString();
    }
    emit('Syncing to cloud…', true, false);
    const { error } = await supabaseClient
      .from('evana_app_state')
      .upsert({
        workspace_id: workspaceId,
        payload,
        updated_at: payload.updatedAt
      });
    if(error){
      console.error(error);
      emit('Cloud save failed.', true, true);
      return false;
    }
    emit(`Cloud synced • ${new Date(payload.updatedAt).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'})}`, true, false);
    return true;
  }
  async function getStartupBundle(){
    const local = readLocalBundle();
    await init();
    const remote = await fetchRemoteBundle();
    let winner = local;
    if(remote && hasContent(remote) && (!hasContent(local) || newer(remote, local))){
      winner = remote;
    }
    winner = writeLocalBundle(winner);
    if(!remote && hasContent(local) && supabaseClient){
      setTimeout(() => { pushBundle(local); }, 0);
    } else if(remote && hasContent(local) && newer(local, remote) && supabaseClient){
      setTimeout(() => { pushBundle(local); }, 0);
    }
    return winner;
  }
  async function savePartial(partial, opts={}){
    const current = readLocalBundle();
    const next = normalizeBundle({ ...current, ...partial, updatedAt: new Date().toISOString() });
    writeLocalBundle(next);
    if(saveTimer) clearTimeout(saveTimer);
    if(opts.immediate){
      await pushBundle(next);
    } else if(supabaseClient || hasValidConfig()){
      emit('Saved locally. Waiting to sync…', !!(supabaseClient || hasValidConfig()), false);
      saveTimer = setTimeout(() => { pushBundle(next); }, opts.delay || 900);
    } else {
      emit('Saved locally in this browser.', false, false);
    }
    return next;
  }
  async function pullLatest(){
    const local = readLocalBundle();
    await init();
    const remote = await fetchRemoteBundle();
    if(remote && newer(remote, local)){
      return writeLocalBundle(remote);
    }
    return local;
  }
  window.EvanaSync = {
    init,
    onStatus,
    readLocalBundle,
    writeLocalBundle,
    getStartupBundle,
    savePartial,
    pullLatest,
    hasValidConfig,
    settings,
    hasContent
  };
})();
