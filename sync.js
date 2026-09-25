
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

  const IMPORTED_DESIGNERS = [
    {
      id: "designer_import_michelle_mcswain",
      name: "Michelle McSwain",
      contact: "",
      address: "",
      phones: ["(704) 691-4314", ""],
      emails: ["michellemcswain29@yahoo.com", ""],
      notes: ""
    },
    {
      id: "designer_import_clarissa_michael",
      name: "Clarissa + Michael",
      contact: "",
      address: "",
      phones: ["(917) 575-7710", ""],
      emails: ["", ""],
      notes: "Email not provided."
    },
    {
      id: "designer_import_new_old_mary_ludemann",
      name: "New Old",
      contact: "Mary Ludemann",
      address: "",
      phones: ["(407) 267-4450", ""],
      emails: ["mary@newold.com", ""],
      notes: ""
    },
    {
      id: "designer_import_beth_lomas",
      name: "Beth Lomas",
      contact: "",
      address: "",
      phones: ["(704) 771-6370", ""],
      emails: ["Lomasinteriors@gmail.com", ""],
      notes: ""
    },
    {
      id: "designer_import_philip_mchugh",
      name: "Philip McHugh",
      contact: "",
      address: "",
      phones: ["(704) 421-4644", ""],
      emails: ["", ""],
      notes: "Email: TBD"
    },
    {
      id: "designer_import_lauren_casella",
      name: "Lauren Casella",
      contact: "",
      address: "",
      phones: ["(704) 604-5515", ""],
      emails: ["Lauren.e.casella@gmail.com", ""],
      notes: ""
    }
  ];

  function cleanPhone(value=""){
    return String(value||"").replace(/\D/g,"").slice(-10);
  }
  function cleanEmail(value=""){
    return String(value||"").trim().toLowerCase();
  }
  function cleanName(value=""){
    return String(value||"").trim().toLowerCase().replace(/\s+/g," ");
  }

  function findMatchingDesigner(clients, seed){
    const seedPhones = (seed.phones||[]).map(cleanPhone).filter(Boolean);
    const seedEmails = (seed.emails||[]).map(cleanEmail).filter(Boolean);

    return clients.find(c=>{
      const cPhones = (c.phones||[]).map(cleanPhone).filter(Boolean);
      const cEmails = (c.emails||[]).map(cleanEmail).filter(Boolean);

      if(seedPhones.some(p=>cPhones.includes(p))) return true;
      if(seedEmails.some(e=>cEmails.includes(e))) return true;

      // Name fallback only if phone/email are unavailable.
      return cleanName(c.name) === cleanName(seed.name) &&
             cleanName(c.contact||"") === cleanName(seed.contact||"");
    });
  }

  function mergeImportedDesigners(bundle){
    const normalized = normalizeBundle(bundle);
    const clients = Array.isArray(normalized.clients) ? [...normalized.clients] : [];
    let changed = false;

    IMPORTED_DESIGNERS.forEach(seed=>{
      const existing = findMatchingDesigner(clients, seed);

      if(!existing){
        clients.push(JSON.parse(JSON.stringify(seed)));
        changed = true;
        return;
      }

      // Fill missing information without overwriting anything the user already edited.
      if(!existing.name && seed.name){ existing.name = seed.name; changed = true; }
      if(!existing.contact && seed.contact){ existing.contact = seed.contact; changed = true; }
      if(!existing.address && seed.address){ existing.address = seed.address; changed = true; }

      existing.phones = Array.isArray(existing.phones) ? existing.phones : ["",""];
      existing.emails = Array.isArray(existing.emails) ? existing.emails : ["",""];

      if(!existing.phones[0] && seed.phones[0]){ existing.phones[0] = seed.phones[0]; changed = true; }
      if(!existing.phones[1] && seed.phones[1]){ existing.phones[1] = seed.phones[1]; changed = true; }
      if(!existing.emails[0] && seed.emails[0]){ existing.emails[0] = seed.emails[0]; changed = true; }
      if(!existing.emails[1] && seed.emails[1]){ existing.emails[1] = seed.emails[1]; changed = true; }

      if(!existing.notes && seed.notes){ existing.notes = seed.notes; changed = true; }
    });

    normalized.clients = clients;
    if(changed){
      normalized.updatedAt = new Date().toISOString();
    }

    return { bundle: normalized, changed };
  }


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

    const merged = mergeImportedDesigners(winner);
    winner = writeLocalBundle(merged.bundle);

    const remoteNeedsUpdate =
      !!supabaseClient &&
      (
        !remote ||
        merged.changed ||
        newer(winner, remote)
      );

    if(remoteNeedsUpdate){
      setTimeout(() => { pushBundle(winner); }, 0);
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

    let winner = local;
    if(remote && newer(remote, local)){
      winner = remote;
    }

    const merged = mergeImportedDesigners(winner);
    winner = writeLocalBundle(merged.bundle);

    if(merged.changed && supabaseClient){
      setTimeout(() => { pushBundle(winner); }, 0);
    }

    return winner;
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
