const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const PRICE = {
  drapery: {
    "Pinch Pleat": { range:[65,85], unit:"per width" },
    "Euro Pleat": { range:[120,120], unit:"per width" },
    "Euro Pinch Pleat": { range:[120,120], unit:"per width" },
    "Flat Top": { range:[75,85], unit:"per width" },
    "Flat Top w/ Tape": { range:[75,85], unit:"per width" },
    "Goblet": { range:[85,95], unit:"per width" },
    "Ripple Fold": { range:[75,85], unit:"per width" },
    "Tape": { range:[75,85], unit:"per width" },
    "Custom": { range:[0,0], unit:"manual" }
  },
  roman: {
    "Flat Roman": { rate:21 },
    "Hobbled Roman": { rate:22.5 },
    "Mock Roman": { rate:33.5 },
    "Faux Hobbled": { rate:45 },
    "Custom": { rate:0 }
  },
  pillow: {
    "Plain": {18:25,20:30,22:30},
    "Flange": {18:30,20:35,22:40},
    "Self Cord": {18:35,20:35,22:45},
    "Brush Fringe": {18:30,20:35,22:40},
    "Contrast Flange": {18:30,20:35,22:40},
    "Ruffle Cord": {18:50,20:60,22:60},
    "Bolster": {18:0,20:0,22:0},
    "Custom": {18:0,20:0,22:0}
  }
};

const DRAPERY_STYLES = ["Pinch Pleat","Euro Pleat","Euro Pinch Pleat","Flat Top","Flat Top w/ Tape","Goblet","Ripple Fold","Tape","Custom"];
const LININGS = ["Unlined","Lined","L/I","Combo Lining","Blackout","Blackout / Interlined"];
const DRAPERY_EXTRAS = ["Match Print","Fabric Band","Trim","Hand Side Hem","Mounted on Board","Attached Valance","Grommets","Hardware","Alteration","Bump","Custom"];
const ROMAN_EXTRAS = ["Motorized","Rowley Lifting System","Cordless Lifting System","Continuous Cord System","Stabilizing Fabric","Hardware","Match Print","Custom"];
const PILLOW_EXTRAS = ["Turkish Corners","4 Triangles","Match Print","Cut Down Pillow Form","Custom Pillow Form","Down Insert","Custom"];

const state = {
  docType:"Estimate",
  rooms:[],
  clients:[],
  invoices:[]
};

const LS_CLIENTS = "evana_clients_v1";
const LS_INVOICES = "evana_invoices_v1";
const LS_DRAFT = "evana_current_draft_v1";
const INVOICE_START = 692;
let applyingExternalState = false;
let lastLoadedBundleStamp = "";

function uid(prefix="id"){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function money(n){ return `$${(Number(n)||0).toFixed(2)}`; }
function esc(s=""){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function roundQuarter(v){ return Math.round((Number(v)||0)*4)/4; }
function num(v){ return Number(v)||0; }

function localISODate(d=new Date()){
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,"0");
  const day=String(d.getDate()).padStart(2,"0");
  return `${y}-${m}-${day}`;
}
function formatPhone(value=""){
  const digits=String(value||"").replace(/\D/g,"").slice(0,10);
  if(!digits) return "";
  if(digits.length<4) return `(${digits}`;
  if(digits.length<7) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}
function normalizeDesigner(c={}){
  const phones=Array.isArray(c.phones)?c.phones:[c.phone1||c.clientPhone1||c.phone||"",c.phone2||c.clientPhone2||""];
  const emails=Array.isArray(c.emails)?c.emails:[c.email1||c.clientEmail1||c.email||"",c.email2||c.clientEmail2||""];
  return {...c,id:c.id||uid("designer"),name:c.name||c.companyName||c.clientName||"",contact:c.contact||c.contactName||"",address:c.address||c.projectAddress||c.billingAddress||"",phones:[formatPhone(phones[0]||""),formatPhone(phones[1]||"")],emails:[emails[0]||"",emails[1]||""],notes:c.notes||""};
}
function clientPhone1(c={}){return ((c.phones||[])[0]||c.phone1||c.clientPhone1||c.phone||"");}
function clientPhone2(c={}){return ((c.phones||[])[1]||c.phone2||c.clientPhone2||"");}
function clientEmail1(c={}){return ((c.emails||[])[0]||c.email1||c.clientEmail1||c.email||"");}
function clientEmail2(c={}){return ((c.emails||[])[1]||c.email2||c.clientEmail2||"");}



const IMPORTED_DESIGNERS_V318 = [
  {id:"designer_import_michelle_mcswain",name:"Michelle McSwain",contact:"",address:"",phones:["(704) 691-4314",""],emails:["michellemcswain29@yahoo.com",""],notes:""},
  {id:"designer_import_clarissa_michael",name:"Clarissa + Michael",contact:"",address:"",phones:["(917) 575-7710",""],emails:["",""],notes:"Email not provided."},
  {id:"designer_import_new_old_mary_ludemann",name:"New Old",contact:"Mary Ludemann",address:"",phones:["(407) 267-4450",""],emails:["mary@newold.com",""],notes:""},
  {id:"designer_import_beth_lomas",name:"Beth Lomas",contact:"",address:"",phones:["(704) 771-6370",""],emails:["Lomasinteriors@gmail.com",""],notes:""},
  {id:"designer_import_philip_mchugh",name:"Philip McHugh",contact:"",address:"",phones:["(704) 421-4644",""],emails:["",""],notes:"Email: TBD"},
  {id:"designer_import_lauren_casella",name:"Lauren Casella",contact:"",address:"",phones:["(704) 604-5515",""],emails:["Lauren.e.casella@gmail.com",""],notes:""}
];

function seedImportedDesignersV318(){
  const phoneKey=v=>String(v||"").replace(/\D/g,"").slice(-10);
  const emailKey=v=>String(v||"").trim().toLowerCase();
  const nameKey=v=>String(v||"").trim().toLowerCase().replace(/\s+/g," ");

  let changed=false;

  IMPORTED_DESIGNERS_V318.forEach(raw=>{
    const seed=normalizeDesigner(raw);
    const seedPhones=(seed.phones||[]).map(phoneKey).filter(Boolean);
    const seedEmails=(seed.emails||[]).map(emailKey).filter(Boolean);

    let existing=state.clients.find(c=>{
      const cPhones=(c.phones||[]).map(phoneKey).filter(Boolean);
      const cEmails=(c.emails||[]).map(emailKey).filter(Boolean);

      if(seedPhones.some(p=>cPhones.includes(p))) return true;
      if(seedEmails.some(e=>cEmails.includes(e))) return true;

      return nameKey(c.name)===nameKey(seed.name) &&
             nameKey(c.contact||"")===nameKey(seed.contact||"");
    });

    if(!existing){
      state.clients.push(seed);
      changed=true;
      return;
    }

    existing.phones=Array.isArray(existing.phones)?existing.phones:["",""];
    existing.emails=Array.isArray(existing.emails)?existing.emails:["",""];

    if(!existing.name && seed.name){existing.name=seed.name;changed=true;}
    if(!existing.contact && seed.contact){existing.contact=seed.contact;changed=true;}
    if(!existing.address && seed.address){existing.address=seed.address;changed=true;}
    if(!existing.phones[0] && seed.phones[0]){existing.phones[0]=seed.phones[0];changed=true;}
    if(!existing.phones[1] && seed.phones[1]){existing.phones[1]=seed.phones[1];changed=true;}
    if(!existing.emails[0] && seed.emails[0]){existing.emails[0]=seed.emails[0];changed=true;}
    if(!existing.emails[1] && seed.emails[1]){existing.emails[1]=seed.emails[1];changed=true;}
    if(!existing.notes && seed.notes){existing.notes=seed.notes;changed=true;}
  });

  if(changed) persistClients();
  return changed;
}

function updateDocTypeUI(){
  $$(".seg").forEach(b=>b.classList.toggle("active", b.dataset.docType===state.docType));
  const title=$("#builderTitle");
  if(title) title.textContent=`Create ${state.docType}`;
}
function currentDraftSnapshot(){
  return {
    rooms: JSON.parse(JSON.stringify(state.rooms || [])),
    projectAddress: $("#projectAddress")?.value || "",
    date: $("#docDate")?.value || localISODate(),
    invoiceNumber: $("#invoiceNumber")?.value || String(nextInvoiceNumber()),
    status: $("#invoiceStatus")?.value || "Open",
    install: $("#installationTotal")?.value || "",
    discountType: $("#discountType")?.value || "",
    discountValue: $("#discountValue")?.value || "",
    discountLabel: $("#discountLabel")?.value || "",
    clientId: $("#clientSelect")?.value || "",
    docType: state.docType || "Estimate"
  };
}
function applyBundleToState(bundle){
  if(!bundle) return;
  applyingExternalState = true;
  lastLoadedBundleStamp = bundle.updatedAt || "";
  state.clients = (bundle.clients || []).map(normalizeDesigner);
  state.invoices = bundle.invoices || [];
  seedImportedDesignersV318();
  populateClients();
  const draft = bundle.currentDraft;
  if(draft){
    state.docType = draft.docType || "Estimate";
    updateDocTypeUI();
    $("#docDate").value = draft.date || localISODate();
    const draftNo = Number(draft.invoiceNumber)||0;
    $("#invoiceNumber").value = String(Math.max(INVOICE_START, draftNo, nextInvoiceNumber()));
    $("#invoiceStatus").value = draft.status || "Open";
    $("#projectAddress").value = draft.projectAddress || "";
    $("#installationTotal").value = draft.install || "";
    $("#discountType").value = draft.discountType || "";
    $("#discountValue").value = draft.discountValue || "";
    $("#discountLabel").value = draft.discountLabel || "";
    if(draft.clientId) $("#clientSelect").value = draft.clientId;
    state.rooms = Array.isArray(draft.rooms) ? draft.rooms : [];
  } else {
    state.docType = state.docType || "Estimate";
    updateDocTypeUI();
    $("#docDate").value = localISODate();
    $("#invoiceNumber").value = String(nextInvoiceNumber());
    state.rooms = [];
  }
  if(!state.rooms.length){
    state.rooms = [{id:uid("room"),name:"Living Room / Dining Room",notes:"",items:[{id:uid("item"),type:"drapery",quantity:1,manualDescription:"",overridePrice:""}]}];
  }
  renderRooms();
  renderPreview();
  renderDiscountSummary();
  applyingExternalState = false;
}
function syncPayload(){
  return { clients: state.clients, invoices: state.invoices, currentDraft: currentDraftSnapshot() };
}
function syncStatus(message){
  const el = $("#syncStatusText");
  if(el) el.textContent = message;
}
async function autosaveAll(immediate=false){
  if(applyingExternalState) return;
  const draft = currentDraftSnapshot();
  localStorage.setItem(LS_DRAFT, JSON.stringify(draft));
  localStorage.setItem("evana_bundle_meta_v1", JSON.stringify({updatedAt:new Date().toISOString()}));
  if(window.EvanaSync){
    await window.EvanaSync.savePartial(syncPayload(), { immediate });
  } else {
    syncStatus("Saved locally in this browser.");
  }
}
async function initSyncUI(){
  if(!window.EvanaSync) return;
  window.EvanaSync.onStatus(({message})=>syncStatus(message));
  await window.EvanaSync.init();
  syncStatus(window.EvanaSync.hasValidConfig() ? "Cloud sync connected." : "Local autosave enabled.");
  const syncBtn = $("#syncNowBtn");
  const loadBtn = $("#loadCloudBtn");
  if(syncBtn) syncBtn.addEventListener("click", async()=>{ await autosaveAll(true); alert("Saved and synced."); });
  if(loadBtn) loadBtn.addEventListener("click", async()=>{
    const latest = await window.EvanaSync.pullLatest();
    if(latest && latest.updatedAt !== lastLoadedBundleStamp){
      applyBundleToState(latest);
      alert("Loaded latest cloud data.");
    } else {
      alert("You already have the latest data loaded.");
    }
  });
  window.addEventListener("focus", async()=>{
    const latest = await window.EvanaSync.pullLatest();
    if(latest && latest.updatedAt && latest.updatedAt !== lastLoadedBundleStamp && new Date(latest.updatedAt).getTime() > new Date(lastLoadedBundleStamp || 0).getTime()){
      applyBundleToState(latest);
    }
  });
}

async function seed(){
  return (async()=>{
    let startupBundle = null;
    if(window.EvanaSync){
      startupBundle = await window.EvanaSync.getStartupBundle();
    }
    if(startupBundle){
      applyBundleToState(startupBundle);
    } else {
      try { state.clients = JSON.parse(localStorage.getItem(LS_CLIENTS) || "[]"); } catch { state.clients=[]; }
      try { state.invoices = JSON.parse(localStorage.getItem(LS_INVOICES) || "[]"); } catch { state.invoices=[]; }
      state.clients = state.clients.map(normalizeDesigner);
      seedImportedDesignersV318();
      persistClients();
      populateClients();
      $("#docDate").value = localISODate();
      $("#invoiceNumber").value = String(nextInvoiceNumber());
      updateDocTypeUI();
      addRoom("Living Room / Dining Room");
      renderPreview();
    }
    await initSyncUI();
    await autosaveAll(false);
  })();
}
function persistClients(){ localStorage.setItem(LS_CLIENTS, JSON.stringify(state.clients)); }
function persistInvoices(){ localStorage.setItem(LS_INVOICES, JSON.stringify(state.invoices)); }
function nextInvoiceNumber(){
  const nums = state.invoices
    .map(i=>parseInt(i.invoiceNumber,10))
    .filter(n=>Number.isFinite(n) && n>=INVOICE_START);
  return nums.length ? Math.max(...nums)+1 : INVOICE_START;
}

function populateClients(){
  const sel=$("#clientSelect"); const current=sel.value;
  if(!state.clients.length){
    sel.innerHTML=`<option value="">No designers yet — add one</option>`;
    $("#projectAddress").value="";
    renderClientsList(); renderDashboard();
    return;
  }
  sel.innerHTML=state.clients.map(c=>`<option value="${c.id}">${esc(c.name)}${c.contact?` — ${esc(c.contact)}`:""}</option>`).join("");
  if(current && state.clients.some(c=>c.id===current)) sel.value=current;
  if(!sel.value && state.clients[0]) sel.value=state.clients[0].id;
  if(!$("#projectAddress").value){const c=selectedClient(); if(c) $("#projectAddress").value=c.address||"";}
  renderClientsList(); renderDashboard();
}
function selectedClient(){ return state.clients.find(c=>c.id===$("#clientSelect").value) || null; }

function addRoom(name=""){
  const room={id:uid("room"),name,notes:"",items:[]}; state.rooms.push(room);
  renderRooms();
  setTimeout(()=>addItem(room.id,"drapery"),0);
}
function addItem(roomId,type="drapery"){
  const room=state.rooms.find(r=>r.id===roomId); if(!room) return;
  room.items.push({id:uid("item"),type,quantity:1,manualDescription:"",overridePrice:""});
  renderRooms(); renderPreview();
}

function renderRooms(){
  const container=$("#roomsContainer"); container.innerHTML="";
  state.rooms.forEach((room,ri)=>{
    const node=$("#roomTemplate").content.firstElementChild.cloneNode(true);
    node.dataset.roomId=room.id;
    $(".room-name",node).value=room.name;
    $(".room-notes",node).value=room.notes;
    $(".room-name",node).addEventListener("input",e=>{room.name=e.target.value; renderPreview();});
    $(".room-notes",node).addEventListener("input",e=>{room.notes=e.target.value; renderPreview();});
    $(".add-item-btn",node).addEventListener("click",()=>addItem(room.id,"drapery"));
    $(".remove-room-btn",node).addEventListener("click",()=>{state.rooms=state.rooms.filter(r=>r.id!==room.id);renderRooms();renderPreview();});
    const itemsWrap=$(".items",node);
    room.items.forEach((item,ii)=>itemsWrap.appendChild(renderItem(room,item,ii)));
    container.appendChild(node);
  });
}

function renderItem(room,item,index){
  const node=$("#itemTemplate").content.firstElementChild.cloneNode(true);
  node.dataset.itemId=item.id;
  $(".item-number",node).textContent=index+1;
  $(".item-title",node).textContent = ({drapery:"Drapery",roman:"Roman Shade",pillow:"Pillow",supply:"Supply",custom:"Custom Item"})[item.type];
  $$(".type-tab",node).forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.type===item.type);
    btn.addEventListener("click",()=>{item.type=btn.dataset.type; Object.keys(item).filter(k=>!["id","type","quantity","overridePrice"].includes(k)).forEach(k=>delete item[k]); renderRooms(); renderPreview();});
  });
  $(".remove-item-btn",node).addEventListener("click",()=>{room.items=room.items.filter(x=>x.id!==item.id);renderRooms();renderPreview();});
  const form=$(".item-form",node);
  if(item.type==="drapery") form.innerHTML=draperyForm(item);
  if(item.type==="roman") form.innerHTML=romanForm(item);
  if(item.type==="pillow") form.innerHTML=pillowForm(item);
  if(item.type==="supply") form.innerHTML=supplyForm(item);
  if(item.type==="custom") form.innerHTML=customForm(item);
  bindItemForm(node,item);
  renderPriceSummary(node,item);
  return node;
}

function options(arr,selected){ return arr.map(v=>`<option ${v===selected?"selected":""}>${esc(v)}</option>`).join(""); }
function checkChips(arr,selected=[]){ return arr.map(v=>`<label class="check-chip"><input type="checkbox" class="extra-check" value="${esc(v)}" ${selected.includes(v)?"checked":""}>${esc(v)}</label>`).join(""); }


function legacyMeasurementFromItem(i){
  return {
    quantity: Math.max(1,num(i.quantity)||1),
    pieceType: i.pieceType || "Pair",
    widths: i.widths ?? 1,
    fl: i.fl ?? "",
    includeFW: i.includeFW !== false,
    fw: i.fw ?? "",
    includeReturn: !!i.includeReturn,
    returnValue: i.returnValue ?? "",
    includeOverlap: !!i.includeOverlap,
    overlapValue: i.overlapValue ?? ""
  };
}

function ensureDraperyMeasurements(i){
  if(!Array.isArray(i.measurements) || !i.measurements.length){
    i.measurements=[legacyMeasurementFromItem(i)];
  }
  i.measurements=i.measurements.map(m=>({
    quantity: Math.max(1,num(m.quantity)||1),
    pieceType: m.pieceType || "Pair",
    widths: m.widths ?? 1,
    fl: m.fl ?? "",
    includeFW: m.includeFW !== false,
    fw: m.fw ?? "",
    includeReturn: !!m.includeReturn,
    returnValue: m.returnValue ?? "",
    includeOverlap: !!m.includeOverlap,
    overlapValue: m.overlapValue ?? ""
  }));
  return i.measurements;
}

function measurementLineHTML(m,index,canRemove){
  return `
    <div class="measurement-set" data-measure-index="${index}">
      <div class="measurement-set-head">
        <span class="measurement-set-title">${index===0?"Primary Measurement":`Additional Measurement ${index}`}</span>
        ${canRemove?`<button type="button" class="remove-measurement-btn" data-measure-index="${index}">Remove</button>`:""}
      </div>

      <div class="measurement-toggle-row">
        <label class="measurement-toggle ${m.includeFW?"active":""}">
          <input type="checkbox" class="m-include-fw" ${m.includeFW?"checked":""}>
          <span>FW</span>
        </label>
        <label class="measurement-toggle ${m.includeReturn?"active":""}">
          <input type="checkbox" class="m-include-return" ${m.includeReturn?"checked":""}>
          <span>Return</span>
        </label>
        <label class="measurement-toggle ${m.includeOverlap?"active":""}">
          <input type="checkbox" class="m-include-overlap" ${m.includeOverlap?"checked":""}>
          <span>Overlap</span>
        </label>
      </div>

      <div class="drapery-measure-row drapery-measure-row-flex">
        <label class="tiny-qty">Q
          <input class="m-quantity" type="number" min="1" max="99" step="1" value="${m.quantity}" inputmode="numeric">
        </label>
        <label>Pair / Panel
          <select class="m-piece">${options(["Pair","Panel"],m.pieceType)}</select>
        </label>
        <label>Q Width
          <input class="m-widths" type="number" min="0" step="0.5" value="${m.widths}">
        </label>
        <label>FL
          <div class="inch-field"><input class="m-fl" type="number" min="0" step="0.25" value="${m.fl}"><span>"</span></div>
        </label>
        ${m.includeFW?`<label>FW
          <div class="inch-field"><input class="m-fw" type="number" min="0" step="0.25" value="${m.fw}"><span>"</span></div>
        </label>`:""}
        ${m.includeReturn?`<label>Return
          <div class="inch-field"><span class="measurement-prefix">R-</span><input class="m-return" type="number" min="0" step="0.25" value="${m.returnValue}"><span>"</span></div>
        </label>`:""}
        ${m.includeOverlap?`<label>Overlap
          <div class="inch-field"><input class="m-overlap" type="number" min="0" step="0.25" value="${m.overlapValue}"><span>"</span></div>
        </label>`:""}
      </div>
    </div>
  `;
}
function draperyForm(i){
  i.style ||= "Euro Pinch Pleat";
  i.lining ||= "Lined";
  i.extras ||= [];
  i.unitPrice ??= PRICE.drapery[i.style]?.range[0]||0;
  i.customStyle||="";
  i.itemNote||="";
  i.showPricing ??= true;
  i.fanfold ??= false;
  i.fanfoldCharge ??= 0;
  i.pin ??= false;
  i.pinCharge ??= 0;
  ensureDraperyMeasurements(i);

  const calc = draperyCalc(i);
  const surchargeBadges = calc.reasons.length
    ? calc.reasons.map(r=>`<span class="surcharge-badge">${esc(r)}</span>`).join("")
    : `<span class="no-surcharge">No automatic surcharge currently applies.</span>`;

  return `
  <div class="workflow-label">STYLE</div>
  <div class="grid grid-1">
    <label>Drapery Style
      <select class="f-style">${options(DRAPERY_STYLES,i.style)}</select>
    </label>
  </div>

  <div class="workflow-label">MEASUREMENTS</div>
  <div class="measurement-sets-wrap">
    ${i.measurements.map((m,idx)=>measurementLineHTML(m,idx,idx>0)).join("")}
  </div>

  <button type="button" class="btn add-measurement-btn">+ Add Another Measurement</button>
  <div class="measurement-copy-note">New measurement rows duplicate every value from the previous row. Change only what is different.</div>

  <div class="grid grid-2 drapery-common-fields">
    <label>Lining
      <select class="f-lining">${options(LININGS,i.lining)}</select>
    </label>
    <label>Price Per Width
      <input class="f-unit-price" type="number" min="0" step="0.01" value="${i.unitPrice}">
    </label>
  </div>

  ${i.style==="Custom"?`<label>Custom Style<input class="f-custom-style" value="${esc(i.customStyle)}"></label>`:""}

  <div class="subsection surcharge-section">
    <div class="subsection-head">
      <h4>Automatic Additional Charges</h4>
      <label class="switch-label">
        <input type="checkbox" class="f-show-pricing" ${i.showPricing?"checked":""}>
        <span class="switch"></span>
        <span>${i.showPricing?"Shown":"Hidden"}</span>
      </label>
    </div>
    <div class="surcharge-live ${i.showPricing===false?"is-hidden":""}">
      ${surchargeBadges}
    </div>
  </div>

  <div class="subsection finishing-charge-section">
    <div class="subsection-head">
      <h4>Additional Charges</h4>
      <span class="muted">Check the service, then enter the charge</span>
    </div>

    <div class="finishing-charge-grid">
      <label class="finishing-charge-card ${i.fanfold?"selected":""}">
        <div class="finishing-charge-name">
          <input type="checkbox" class="f-fanfold" ${i.fanfold?"checked":""}>
          <span>Fanfold</span>
        </div>
        ${i.fanfold?`<div class="charge-input"><span>$</span><input class="f-fanfold-charge" type="number" min="0" step="0.01" value="${i.fanfoldCharge}"></div>`:""}
      </label>

      <label class="finishing-charge-card ${i.pin?"selected":""}">
        <div class="finishing-charge-name">
          <input type="checkbox" class="f-pin" ${i.pin?"checked":""}>
          <span>Pin</span>
        </div>
        ${i.pin?`<div class="charge-input"><span>$</span><input class="f-pin-charge" type="number" min="0" step="0.01" value="${i.pinCharge}"></div>`:""}
      </label>
    </div>
  </div>

  <div class="subsection">
    <div class="subsection-head"><h4>Optional Details</h4><span class="muted">Select everything that applies</span></div>
    <div class="choice-grid">${checkChips(DRAPERY_EXTRAS,i.extras)}</div>
  </div>

  <label>Custom Description / Notes
    <textarea class="f-item-note" rows="2" placeholder="Traverse rod, French return, special instructions, custom wording...">${esc(i.itemNote)}</textarea>
  </label>

  <div class="grid grid-2">
    <label>Override Final Price
      <input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional">
    </label>
    <div class="suggested-price-card">
      <span>Suggested price range</span>
      <strong>${rangeText(PRICE.drapery[i.style]?.range)}</strong>
    </div>
  </div>
  `;
}
function romanForm(i){
  i.style ||= "Flat Roman";
  i.mount ||= "Inside Mount";
  i.fl ??="";
  i.fw ??="";
  i.proj ??="";
  i.extras ||= [];
  i.quantity ??=1;
  i.unitPrice ??= PRICE.roman[i.style]?.rate||0;
  i.overridePrice||="";
  i.itemNote||="";
  i.showPricing ??=true;

  // V3.14: migrate older Flaps / Valance data into one 3-way selector.
  if(!i.topTreatment){
    i.topTreatment = i.hasFlaps ? "Flaps" : (i.hasValance ? "Valance" : "None");
  }
  if(i.topTreatmentFL==null) i.topTreatmentFL="";
  if(i.topTreatmentPrice==null){
    const legacyPrice = i.topTreatment==="Flaps" ? num(i.flapsPrice) : (i.topTreatment==="Valance" ? num(i.valancePrice) : 0);
    i.topTreatmentPrice = legacyPrice || 20;
  }

  // Keep legacy values in sync for older saved jobs / migration safety.
  i.hasFlaps = i.topTreatment === "Flaps";
  i.hasValance = i.topTreatment === "Valance";
  if(i.hasFlaps) i.flapsPrice = i.topTreatmentPrice;
  if(i.hasValance) i.valancePrice = i.topTreatmentPrice;

  return `
  <div class="workflow-label">MOUNT</div>
  <div class="segmented-choice roman-mount-choice">
    <label class="${i.mount==="Inside Mount"?"selected":""}">
      <input type="radio" class="f-mount" name="mount-${i.id||""}" value="Inside Mount" ${i.mount==="Inside Mount"?"checked":""}>
      <span>Inside Mount</span>
    </label>
    <label class="${i.mount==="Outside Mount"?"selected":""}">
      <input type="radio" class="f-mount" name="mount-${i.id||""}" value="Outside Mount" ${i.mount==="Outside Mount"?"checked":""}>
      <span>Outside Mount</span>
    </label>
  </div>

  <div class="workflow-label">MEASUREMENTS</div>
  <div class="grid grid-3">
    <label>FW
      <div class="inch-field"><input class="f-fw" type="number" min="0" step="0.25" value="${i.fw}"><span>"</span></div>
    </label>
    <label>FL
      <div class="inch-field"><input class="f-fl" type="number" min="0" step="0.25" value="${i.fl}"><span>"</span></div>
    </label>
    <label>Proj
      <div class="inch-field"><input class="f-proj" type="number" min="0" step="0.25" value="${i.proj}"><span>"</span></div>
    </label>
  </div>

  <div class="workflow-label">SHADE STYLE</div>
  <div class="grid grid-2">
    <label>Roman Style
      <select class="f-style">${options(Object.keys(PRICE.roman),i.style)}</select>
    </label>
    <label>Price Per Sq. Ft.
      <input class="f-unit-price" type="number" min="0" step="0.01" value="${i.unitPrice}">
    </label>
  </div>

  <div class="subsection">
    <div class="subsection-head">
      <h4>Top Treatment</h4>
      <span class="muted">Choose one</span>
    </div>

    <div class="segmented-choice roman-top-treatment-choice three-choice">
      ${["None","Flaps","Valance"].map(v=>`
        <label class="${i.topTreatment===v?"selected":""}">
          <input type="radio" class="f-top-treatment" name="top-treatment-${i.id||""}" value="${v}" ${i.topTreatment===v?"checked":""}>
          <span>${v}</span>
        </label>
      `).join("")}
    </div>

    ${i.topTreatment!=="None"?`
      <div class="roman-treatment-popup">
        <div class="roman-treatment-popup-title">${i.topTreatment} Details</div>
        <div class="grid grid-2">
          <label>FL
            <div class="inch-field"><input class="f-top-treatment-fl" type="number" min="0" step="0.25" value="${i.topTreatmentFL}"><span>"</span></div>
          </label>
          <label>Price
            <div class="charge-input"><span>$</span><input class="f-top-treatment-price" type="number" min="0" step="0.01" value="${i.topTreatmentPrice}"></div>
          </label>
        </div>
        <div class="roman-rate-note">Default ${i.topTreatment.toLowerCase()} price is $20. You can change it for any job.</div>
      </div>
    `:""}
  </div>

  <div class="subsection">
    <div class="subsection-head"><h4>Lift / Motor / Extras</h4><span class="muted">Select multiple</span></div>
    <div class="choice-grid">${checkChips(ROMAN_EXTRAS,i.extras)}</div>
    <div class="roman-rate-note">Motorized $450 · Rowley Lift $75 · Cordless $120 · Continuous Cord $100</div>
  </div>

  <label>Item Description / Custom Note<textarea class="f-item-note" rows="2">${esc(i.itemNote)}</textarea></label>

  <div class="grid grid-2">
    <label>Quantity (entered last)<input class="f-quantity" type="number" min="1" step="1" value="${i.quantity}"></label>
    <label>Override Final Price<input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional"></label>
  </div>

  <div class="toggle-row">
    <label class="toggle"><input type="checkbox" class="f-show-pricing" ${i.showPricing?"checked":""}> Show size / pricing details</label>
    <span class="muted">Sq. ft. rounds to nearest 0.25</span>
  </div>
  `;
}
function pillowForm(i){
  i.style ||= "Plain";
  i.size ||= "18";
  i.extras ||= [];
  i.quantity ??=1;
  i.customPrice ??=0;
  i.overridePrice||="";
  i.itemNote||="";
  i.matchPrintCharge ??=10;
  i.showPricing ??=true;
  i.zipper ??= true;
  i.hasTrim ??= false;
  i.trimPosition ||= "Outside";
  i.trimHandSewn ??= false;
  i.trimCharge ??= 0;
  i.hasCord ??= false;
  i.cordType ||= "Ruffle Cord";
  i.cordCharge ??= 0;

  const base = PRICE.pillow[i.style]?.[i.size] ?? 0;

  return `
  <div class="workflow-label">ZIPPER</div>
  <div class="segmented-choice zipper-choice">
    <label class="${i.zipper?"selected":""}">
      <input type="radio" class="f-zipper-choice" name="zipper-${i.id||""}" value="yes" ${i.zipper?"checked":""}>
      <span>Zipper</span>
    </label>
    <label class="${!i.zipper?"selected":""}">
      <input type="radio" class="f-zipper-choice" name="zipper-${i.id||""}" value="no" ${!i.zipper?"checked":""}>
      <span>No Zipper</span>
    </label>
  </div>

  <div class="workflow-label">PILLOW</div>
  <div class="grid grid-3">
    <label>Pillow Style
      <select class="f-style">${options(["Plain","Flange","Self Cord","Brush Fringe","Contrast Flange","Ruffle Cord","Bolster","Custom"],i.style)}</select>
    </label>
    <label>Size
      <select class="f-size">${options(["18","20","22","Custom"],i.size)}</select>
    </label>
    <label>Base Price Each
      <input class="f-unit-price" type="number" min="0" step="0.01" value="${i.size==="Custom"?(i.customPrice||0):base}">
    </label>
  </div>

  <div class="subsection">
    <div class="subsection-head"><h4>Trim</h4><span class="muted">Optional</span></div>
    <label class="feature-toggle-card ${i.hasTrim?"selected":""}">
      <input type="checkbox" class="f-has-trim" ${i.hasTrim?"checked":""}>
      <span>Add Trim</span>
    </label>
    ${i.hasTrim?`
      <div class="pillow-detail-panel">
        <div class="segmented-choice trim-position-choice">
          <label class="${i.trimPosition==="Outside"?"selected":""}">
            <input type="radio" class="f-trim-position" name="trim-${i.id||""}" value="Outside" ${i.trimPosition==="Outside"?"checked":""}>
            <span>Outside</span>
          </label>
          <label class="${i.trimPosition==="Inside"?"selected":""}">
            <input type="radio" class="f-trim-position" name="trim-${i.id||""}" value="Inside" ${i.trimPosition==="Inside"?"checked":""}>
            <span>Inside</span>
          </label>
        </div>
        <div class="grid grid-2 compact-top">
          <label class="feature-toggle-card inline-toggle">
            <input type="checkbox" class="f-trim-hand-sewn" ${i.trimHandSewn?"checked":""}>
            <span>Hand Sewn</span>
          </label>
          <label>Trim Charge
            <div class="charge-input"><span>$</span><input class="f-trim-charge" type="number" min="0" step="0.01" value="${i.trimCharge}"></div>
          </label>
        </div>
      </div>
    `:""}
  </div>

  <div class="subsection">
    <div class="subsection-head"><h4>Cord</h4><span class="muted">Optional</span></div>
    <label class="feature-toggle-card ${i.hasCord?"selected":""}">
      <input type="checkbox" class="f-has-cord" ${i.hasCord?"checked":""}>
      <span>Add Cord</span>
    </label>
    ${i.hasCord?`
      <div class="pillow-detail-panel grid grid-2">
        <label>Cord Type
          <select class="f-cord-type">${options(["Ruffle Cord","Sheer Cord","Mini","Small","Large","Big","Jumbo"],i.cordType)}</select>
        </label>
        <label>Cord Charge
          <div class="charge-input"><span>$</span><input class="f-cord-charge" type="number" min="0" step="0.01" value="${i.cordCharge}"></div>
        </label>
      </div>
    `:""}
  </div>

  <div class="subsection">
    <div class="subsection-head"><h4>Extras</h4><span class="muted">Select multiple</span></div>
    <div class="choice-grid">${checkChips(PILLOW_EXTRAS,i.extras)}</div>
  </div>

  ${i.extras.includes("Match Print")||i.extras.includes("Pattern Matching")?`
    <label>Match Print Charge Per Pillow
      <input class="f-pattern-charge" type="number" min="0" step="0.01" value="${i.matchPrintCharge}">
    </label>
  `:""}

  <label>Item Description / Custom Note<textarea class="f-item-note" rows="2">${esc(i.itemNote)}</textarea></label>

  <div class="grid grid-2">
    <label>Quantity (entered last)<input class="f-quantity" type="number" min="1" step="1" value="${i.quantity}"></label>
    <label>Override Final Price<input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional"></label>
  </div>

  <div class="toggle-row">
    <label class="toggle"><input type="checkbox" class="f-show-pricing" ${i.showPricing?"checked":""}> Show pricing details</label>
    <span class="muted">Zipper +$10 · 4 Triangles +$10 · trim / cord charges are editable</span>
  </div>
  `;
}

function supplyForm(i){
  i.description ||= "";
  i.unitPrice ??= 0;
  i.quantity ??= 1;
  i.overridePrice ||= "";
  i.showPricing ??= true;
  i.depositRequired ??= true;
  i.depositPercent ??= 100;

  return `
  <div class="workflow-label">SUPPLY ITEM</div>
  <label>Description
    <textarea class="f-description" rows="3" placeholder="Lining, interlining, blackout, hardware, motor, trim, etc.">${esc(i.description)}</textarea>
  </label>

  <div class="grid grid-3">
    <label>Quantity
      <input class="f-quantity" type="number" min="0" step="0.25" value="${i.quantity}">
    </label>
    <label>Price Per Unit
      <input class="f-unit-price" type="number" min="0" step="0.01" value="${i.unitPrice}">
    </label>
    <label>Override Final Price
      <input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional">
    </label>
  </div>

  <div class="subsection supply-deposit-box">
    <div class="subsection-head"><h4>Required Deposit</h4><span class="muted">Due before the job starts</span></div>
    <div class="grid grid-2">
      <label class="feature-toggle-card ${i.depositRequired?"selected":""}">
        <input type="checkbox" class="f-deposit-required" ${i.depositRequired?"checked":""}>
        <span>Deposit Required</span>
      </label>
      ${i.depositRequired?`
        <label>Deposit %
          <input class="f-deposit-percent" type="number" min="0" max="100" step="1" value="${i.depositPercent}">
        </label>
      `:""}
    </div>
  </div>
  `;
}
function customForm(i){
  i.description ||= ""; i.unitPrice ??=0; i.quantity ??=1; i.overridePrice||=""; i.showPricing ??=true;
  return `
  <label>Description<textarea class="f-description" rows="4" placeholder="Type exactly what you want on the invoice...">${esc(i.description)}</textarea></label>
  <div class="grid grid-3">
    <label>Price Per Unit<input class="f-unit-price" type="number" min="0" step="0.01" value="${i.unitPrice}"></label>
    <label>Quantity<input class="f-quantity" type="number" min="1" step="1" value="${i.quantity}"></label>
    <label>Override Final Price<input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional"></label>
  </div>`;
  autosaveAll(false);
}
function rangeText(r){ if(!r) return "Manual"; return r[0]===r[1]?money(r[0]):`${money(r[0])}–${money(r[1])}`; }

function updateDraperySurcharges(node,item){
  if(item.type!=="drapery") return;
  const wrap=$(".surcharge-live",node);
  if(!wrap) return;
  const c=draperyCalc(item);
  wrap.innerHTML=c.reasons.length
    ? c.reasons.map(r=>`<span class="surcharge-badge">${esc(r)}</span>`).join("")
    : `<span class="no-surcharge">No automatic surcharge currently applies.</span>`;
}

function syncDraperyMeasurementsFromDOM(node,item){
  ensureDraperyMeasurements(item);

  $$(".measurement-set",node).forEach(setNode=>{
    const idx=Number(setNode.dataset.measureIndex);
    const m=item.measurements[idx];
    if(!m) return;

    const qty=$(".m-quantity",setNode);
    const piece=$(".m-piece",setNode);
    const widths=$(".m-widths",setNode);
    const fl=$(".m-fl",setNode);
    const fw=$(".m-fw",setNode);
    const fwToggle=$(".m-include-fw",setNode);
    const returnToggle=$(".m-include-return",setNode);
    const returnValue=$(".m-return",setNode);
    const overlapToggle=$(".m-include-overlap",setNode);
    const overlapValue=$(".m-overlap",setNode);

    if(qty) m.quantity=Math.max(1,num(qty.value)||1);
    if(piece) m.pieceType=piece.value;
    if(widths) m.widths=widths.value===""?"":num(widths.value);
    if(fl) m.fl=fl.value===""?"":num(fl.value);

    if(fwToggle) m.includeFW=fwToggle.checked;
    if(fw) m.fw=fw.value===""?"":num(fw.value);

    if(returnToggle) m.includeReturn=returnToggle.checked;
    if(returnValue) m.returnValue=returnValue.value===""?"":num(returnValue.value);

    if(overlapToggle) m.includeOverlap=overlapToggle.checked;
    if(overlapValue) m.overlapValue=overlapValue.value===""?"":num(overlapValue.value);
  });
}

function bindDraperyMeasurements(node,item){
  ensureDraperyMeasurements(item);

  const refreshItem=()=>{
    // Capture every typed value BEFORE rebuilding the form.
    syncDraperyMeasurementsFromDOM(node,item);
    renderRooms();
    renderPreview();
    renderDiscountSummary();
  };

  $$(".measurement-set",node).forEach(setNode=>{
    const idx=Number(setNode.dataset.measureIndex);
    const m=item.measurements[idx];
    if(!m) return;

    const bindTextNumber=(sel,key,convert=v=>v)=>{
      const el=$(sel,setNode);
      if(!el) return;
      const evt=el.tagName==="SELECT" ? "change" : "input";
      el.addEventListener(evt,()=>{
        const raw=el.value;
        m[key]=raw==="" ? "" : convert(raw);
        updateDraperySurcharges(node,item);
        renderPriceSummary(node,item);
        renderPreview();
        renderDiscountSummary();
      });
    };

    bindTextNumber(".m-quantity","quantity",v=>Math.max(1,num(v)||1));
    bindTextNumber(".m-piece","pieceType",v=>v);
    bindTextNumber(".m-widths","widths",num);
    bindTextNumber(".m-fl","fl",num);
    bindTextNumber(".m-fw","fw",num);
    bindTextNumber(".m-return","returnValue",num);
    bindTextNumber(".m-overlap","overlapValue",num);

    const fwToggle=$(".m-include-fw",setNode);
    if(fwToggle){
      fwToggle.addEventListener("change",()=>{
        // Preserve every other entered field before this checkbox causes a rerender.
        syncDraperyMeasurementsFromDOM(node,item);
        item.measurements[idx].includeFW=fwToggle.checked;
        renderRooms();
        renderPreview();
        renderDiscountSummary();
      });
    }

    const returnToggle=$(".m-include-return",setNode);
    if(returnToggle){
      returnToggle.addEventListener("change",()=>{
        syncDraperyMeasurementsFromDOM(node,item);
        item.measurements[idx].includeReturn=returnToggle.checked;
        renderRooms();
        renderPreview();
        renderDiscountSummary();
      });
    }

    const overlapToggle=$(".m-include-overlap",setNode);
    if(overlapToggle){
      overlapToggle.addEventListener("change",()=>{
        syncDraperyMeasurementsFromDOM(node,item);
        item.measurements[idx].includeOverlap=overlapToggle.checked;
        renderRooms();
        renderPreview();
        renderDiscountSummary();
      });
    }
  });

  const addBtn=$(".add-measurement-btn",node);
  if(addBtn){
    addBtn.addEventListener("click",()=>{
      // Critical fix: pull the current values directly from the form first.
      // This prevents the previous row from being cleared when the UI rerenders.
      syncDraperyMeasurementsFromDOM(node,item);
      ensureDraperyMeasurements(item);

      const last=item.measurements[item.measurements.length-1] || legacyMeasurementFromItem(item);

      // Deep-clone the PREVIOUS row exactly, then allow the new row to be edited independently.
      const copy=JSON.parse(JSON.stringify(last));
      item.measurements.push(copy);

      renderRooms();
      renderPreview();
      renderDiscountSummary();
    });
  }

  $$(".remove-measurement-btn",node).forEach(btn=>{
    btn.addEventListener("click",()=>{
      syncDraperyMeasurementsFromDOM(node,item);
      const idx=Number(btn.dataset.measureIndex);
      if(Number.isInteger(idx) && idx>0 && item.measurements.length>1){
        item.measurements.splice(idx,1);
        renderRooms();
        renderPreview();
        renderDiscountSummary();
      }
    });
  });
}
function bindItemForm(node,item){
  const bind=(sel,key,convert=v=>v,rerender=false)=>{
    const el=$(sel,node);
    if(!el) return;
    const evt=(el.type==="checkbox"||el.type==="radio"||el.tagName==="SELECT")?"change":"input";
    el.addEventListener(evt,()=>{
      const value=el.type==="checkbox" ? el.checked : el.value;
      item[key]=convert(value);
      if(rerender){
        renderRooms();
        renderPreview();
        renderDiscountSummary();
      }else{
        updateDraperySurcharges(node,item);
        renderPriceSummary(node,item);
        renderPreview();
        renderDiscountSummary();
      }
    });
  };

  if(item.type==="drapery"){
    bindDraperyMeasurements(node,item);
    bind(".f-style","style",v=>v,true);
    bind(".f-lining","lining",v=>v,true);
    bind(".f-custom-style","customStyle");
    bind(".f-item-note","itemNote");
    bind(".f-unit-price","unitPrice",num);
    bind(".f-override","overridePrice",v=>v===""?"":num(v));
    bind(".f-show-pricing","showPricing",Boolean,true);
    bind(".f-fanfold","fanfold",Boolean,true);
    bind(".f-fanfold-charge","fanfoldCharge",num);
    bind(".f-pin","pin",Boolean,true);
    bind(".f-pin-charge","pinCharge",num);
  }

  if(item.type==="roman"){
    $$(".f-mount",node).forEach(r=>r.addEventListener("change",()=>{
      if(r.checked){ item.mount=r.value; renderRooms(); renderPreview(); renderDiscountSummary(); }
    }));
    bind(".f-style","style",v=>v,true);
    bind(".f-fw","fw",num);
    bind(".f-fl","fl",num);
    bind(".f-proj","proj",num);
    bind(".f-unit-price","unitPrice",num);
    bind(".f-quantity","quantity",num);
    bind(".f-override","overridePrice",v=>v===""?"":num(v));
    bind(".f-item-note","itemNote");
    bind(".f-show-pricing","showPricing",Boolean,true);
    $$(".f-top-treatment",node).forEach(r=>r.addEventListener("change",()=>{
      if(r.checked){
        item.topTreatment=r.value;
        item.hasFlaps=r.value==="Flaps";
        item.hasValance=r.value==="Valance";
        if(item.topTreatment!=="None" && !num(item.topTreatmentPrice)) item.topTreatmentPrice=20;
        renderRooms(); renderPreview(); renderDiscountSummary();
      }
    }));
    bind(".f-top-treatment-fl","topTreatmentFL",num);
    bind(".f-top-treatment-price","topTreatmentPrice",num);
  }

  if(item.type==="pillow"){
    $$(".f-zipper-choice",node).forEach(r=>r.addEventListener("change",()=>{
      if(r.checked){ item.zipper=r.value==="yes"; renderRooms(); renderPreview(); renderDiscountSummary(); }
    }));
    $$(".f-trim-position",node).forEach(r=>r.addEventListener("change",()=>{
      if(r.checked){ item.trimPosition=r.value; renderRooms(); renderPreview(); }
    }));
    bind(".f-style","style",v=>v,true);
    bind(".f-size","size",v=>v,true);
    bind(".f-unit-price","unitPrice",num);
    bind(".f-quantity","quantity",num);
    bind(".f-override","overridePrice",v=>v===""?"":num(v));
    bind(".f-item-note","itemNote");
    bind(".f-show-pricing","showPricing",Boolean,true);
    bind(".f-pattern-charge","matchPrintCharge",num);
    bind(".f-has-trim","hasTrim",Boolean,true);
    bind(".f-trim-hand-sewn","trimHandSewn",Boolean,true);
    bind(".f-trim-charge","trimCharge",num);
    bind(".f-has-cord","hasCord",Boolean,true);
    bind(".f-cord-type","cordType",v=>v,true);
    bind(".f-cord-charge","cordCharge",num);
  }

  if(item.type==="supply"){
    bind(".f-description","description");
    bind(".f-quantity","quantity",num);
    bind(".f-unit-price","unitPrice",num);
    bind(".f-override","overridePrice",v=>v===""?"":num(v));
    bind(".f-deposit-required","depositRequired",Boolean,true);
    bind(".f-deposit-percent","depositPercent",num);
  }

  if(item.type==="custom"){
    bind(".f-description","description");
    bind(".f-quantity","quantity",num);
    bind(".f-unit-price","unitPrice",num);
    bind(".f-override","overridePrice",v=>v===""?"":num(v));
  }

  $$(".extra-check",node).forEach(ch=>ch.addEventListener("change",()=>{
    item.extras=$$(".extra-check:checked",node).map(x=>x.value);
    renderRooms();
    renderPreview();
    renderDiscountSummary();
  }));
}
function draperyCalc(i){
  const measurements=ensureDraperyMeasurements(i);
  const globalPct =
    (((i.extras||[]).includes("Match Print") || (i.extras||[]).includes("Pattern Matching")) ? 20 : 0) +
    ((i.lining==="Bump" || (i.extras||[]).includes("Bump")) ? 20 : 0);

  let base=0;
  let calculated=0;
  let totalQty=0;
  const reasons=[];
  const lines=[];

  measurements.forEach((m,idx)=>{
    const entered=num(m.widths);
    const billable=Math.ceil(entered);
    const qty=Math.max(1,num(m.quantity)||1);
    totalQty += qty;

    const lineBase=billable*num(i.unitPrice)*qty;
    base += lineBase;

    let linePct=0;
    const lineReasons=[];

    if(m.pieceType==="Pair"){
      if(billable>=8){
        linePct+=100;
        lineReasons.push("8+ widths per pair: +100% (double)");
      }else if(billable>=6){
        linePct+=20;
        lineReasons.push("6–7 widths per pair: +20%");
      }
    }

    const fl=num(m.fl);
    if(fl>=160){
      linePct+=100;
      lineReasons.push('Length 160"+: +100% (double)');
    }else if(fl>=120){
      linePct+=50;
      lineReasons.push('Length 120–159": +50%');
    }else if(fl>96){
      linePct+=20;
      lineReasons.push('Length 97–119": +20%');
    }

    const lineCalculated=lineBase*(1+(linePct+globalPct)/100);
    calculated += lineCalculated;

    lines.push({
      entered,billable,qty,
      base:lineBase,
      pct:linePct+globalPct,
      localPct:linePct,
      reasons:lineReasons,
      calculated:lineCalculated
    });

    lineReasons.forEach(r=>{
      reasons.push(measurements.length>1 ? `Measurement ${idx+1}: ${r}` : r);
    });
  });

  if((i.extras||[]).includes("Match Print") || (i.extras||[]).includes("Pattern Matching")) reasons.push("Match print: +20%");
  if(i.lining==="Bump" || (i.extras||[]).includes("Bump")) reasons.push("Bump: +20%");

  const finishingCharges =
    (i.fanfold ? num(i.fanfoldCharge) : 0) +
    (i.pin ? num(i.pinCharge) : 0);

  calculated += finishingCharges;

  if(i.fanfold) reasons.push(`Fanfold: +${money(num(i.fanfoldCharge))}`);
  if(i.pin) reasons.push(`Pin: +${money(num(i.pinCharge))}`);

  const final=i.overridePrice!=="" ? num(i.overridePrice) : calculated;
  return {
    base,
    globalPct,
    reasons,
    calculated,
    finishingCharges,
    final,
    totalQty,
    lines,
    measurements
  };
}
function romanCalc(i){
  const sqftRaw=(num(i.fw)*num(i.fl))/144;
  const sqft=roundQuarter(sqftRaw);
  let pct=0;
  const reasons=[];
  const maxDim=Math.max(num(i.fw),num(i.fl));

  if(maxDim>=80){ pct=100; reasons.push('Either dimension 80"+: +100% (double)'); }
  else if(maxDim>=60){ pct=20; reasons.push('Either dimension 60–79": +20%'); }

  let each=sqft*num(i.unitPrice)*(1+pct/100);
  const extras=i.extras||[];
  let extrasEach=0;

  if(extras.includes("Motorized")) extrasEach+=450;
  if(extras.includes("Rowley Lifting System")) extrasEach+=75;
  if(extras.includes("Cordless Lifting System")) extrasEach+=120;
  if(extras.includes("Continuous Cord System")) extrasEach+=100;
  if(extras.includes("Stabilizing Fabric")) extrasEach+=sqft*2;

  const topTreatment = i.topTreatment || (i.hasFlaps ? "Flaps" : (i.hasValance ? "Valance" : "None"));
  if(topTreatment!=="None"){
    const legacyPrice = topTreatment==="Flaps" ? num(i.flapsPrice) : num(i.valancePrice);
    extrasEach += num(i.topTreatmentPrice) || legacyPrice || 20;
  }

  each+=extrasEach;
  const calculated=each*Math.max(1,num(i.quantity));
  const final=i.overridePrice!==""?num(i.overridePrice):calculated;
  return {sqftRaw,sqft,pct,reasons,extrasEach,calculated,final};
}
function pillowCalc(i){
  const baseEach=num(i.unitPrice);
  let extraEach=0;
  const reasons=[];
  const ex=i.extras||[];

  if(i.zipper){ extraEach+=10; reasons.push("Zipper +$10"); }
  if(ex.includes("Turkish Corners")){ extraEach+=10; reasons.push("Turkish corners +$10"); }
  if(ex.includes("4 Triangles")){ extraEach+=10; reasons.push("4 triangles +$10"); }
  if(ex.includes("Cut Down Pillow Form")){ extraEach+=10; reasons.push("Cut down pillow form +$10"); }
  if(ex.includes("Custom Pillow Form")){ extraEach+=10; reasons.push("Custom pillow form +$10"); }

  if(ex.includes("Match Print") || ex.includes("Pattern Matching")){
    const charge=num(i.matchPrintCharge||10);
    extraEach+=charge;
    reasons.push(`Match print +${money(charge)}`);
  }

  if(i.hasTrim){
    extraEach+=num(i.trimCharge);
    reasons.push(`Trim (${i.trimPosition||"Outside"}${i.trimHandSewn?", hand sewn":""}) +${money(num(i.trimCharge))}`);
  }

  if(i.hasCord){
    extraEach+=num(i.cordCharge);
    reasons.push(`${i.cordType||"Cord"} +${money(num(i.cordCharge))}`);
  }

  const calculated=(baseEach+extraEach)*Math.max(1,num(i.quantity));
  const final=i.overridePrice!==""?num(i.overridePrice):calculated;
  return {baseEach,extraEach,reasons,calculated,final};
}
function supplyCalc(i){
  const calculated=num(i.unitPrice)*Math.max(0,num(i.quantity));
  const final=i.overridePrice!==""?num(i.overridePrice):calculated;
  const depositPercent=i.depositRequired===false?0:Math.max(0,Math.min(100,num(i.depositPercent ?? 100)));
  const depositDue=final*(depositPercent/100);
  return {calculated,final,depositPercent,depositDue};
}
function customCalc(i){ const calculated=num(i.unitPrice)*Math.max(1,num(i.quantity)); return {calculated,final:i.overridePrice!==""?num(i.overridePrice):calculated}; }
function calcItem(i){ return i.type==="drapery"?draperyCalc(i):i.type==="roman"?romanCalc(i):i.type==="pillow"?pillowCalc(i):i.type==="supply"?supplyCalc(i):customCalc(i); }

function renderPriceSummary(node,item){
  const box=$(".price-summary",node); if(!box) return; const c=calcItem(item);
  let details="";
  if(item.type==="drapery") details=`
    ${c.lines.map((line,idx)=>`
      <div class="pricing-measure-line">
        <strong>Measurement ${idx+1}</strong>
        <span>Widths: ${line.entered} → ${line.billable} billable</span>
        <span>Base: ${money(line.base)}</span>
        <span>Surcharge: +${line.pct}%</span>
        <span>Calculated: ${money(line.calculated)}</span>
      </div>
    `).join("")}
    <div>Combined base: ${money(c.base)}</div>
  `;
  if(item.type==="roman") details=`<div>Sq. ft.: ${c.sqftRaw.toFixed(4)} → <strong>${c.sqft.toFixed(2)}</strong></div>${c.reasons.map(r=>`<div>${esc(r)}</div>`).join("")}<div>Extras per shade: ${money(c.extrasEach)}</div>`;
  if(item.type==="pillow") details=`<div>Base each: ${money(c.baseEach)}</div>${c.reasons.map(r=>`<div>${esc(r)}</div>`).join("")}<div>Extras each: ${money(c.extraEach)}</div>`;
  if(item.type==="supply") details=`<div>Supply line item</div><div>Required deposit: <strong>${c.depositPercent}% = ${money(c.depositDue)}</strong></div>`;
  if(item.type==="custom") details=`<div>Manual line item</div>`;
  box.innerHTML=`<div class="total-line"><span>Calculated</span><strong>${money(c.calculated)}</strong></div>${item.overridePrice!==""?`<div class="total-line"><span>Override in use</span><strong>${money(c.final)}</strong></div>`:""}<div class="pricing-detail ${item.showPricing===false?"hidden":""}">${details}</div>`;
}

function itemDescription(i){
  if(i.type==="drapery"){
    const style=i.style==="Custom"?(i.customStyle||"Custom Drapery"):i.style;
    const c=draperyCalc(i);
    const liningText = i.lining==="L/I"
      ? "L/I"
      : (i.lining==="Unlined" ? "unlined" : String(i.lining||"").toLowerCase());
    const bits=[`${style} (${liningText})`];

    c.measurements.forEach(m=>{
      const piece=String(m.pieceType||"Pair").toLowerCase();
      const qty=Math.max(1,num(m.quantity)||1);
      const widths=num(m.widths)||0;
      const measurements=[];
      measurements.push(`FL-${num(m.fl)||""}"`);
      if(m.includeFW) measurements.push(`FW-${num(m.fw)||""}"`);
      if(m.includeReturn) measurements.push(`R-${num(m.returnValue)||""}"`);
      if(m.includeOverlap) measurements.push(`Overlap-${num(m.overlapValue)||""}"`);

      bits.push(`${qty} ${piece}${qty>1?"s":""}, ${widths} width${widths===1?"":"s"}${measurements.length?`, ${measurements.join(", ")}`:""}`);
    });

    c.reasons
      .filter(r=>!r.startsWith("Fanfold:") && !r.startsWith("Pin:"))
      .forEach(r=>bits.push(r));

    if(i.fanfold) bits.push("Fanfold");
    if(i.pin) bits.push("Pin");

    (i.extras||[]).forEach(x=>{
      if((x==="Match Print" || x==="Pattern Matching") && c.reasons.some(r=>r.toLowerCase().includes("match print"))) return;
      bits.push(x);
    });

    if(i.itemNote) bits.push(i.itemNote);
    return bits.filter(Boolean).join("\n");
  }
  if(i.type==="roman"){
    const c=romanCalc(i);
    const measurements=`FW-${num(i.fw)||""}", FL-${num(i.fl)||""}"${i.proj!==""&&i.proj!=null?`, Proj-${num(i.proj)||""}"`:""} [${c.sqft.toFixed(2)} sq. ft.]`;
    const bits=[i.style||"Roman Shade",i.mount||"Inside Mount",measurements];

    const topTreatment = i.topTreatment || (i.hasFlaps ? "Flaps" : (i.hasValance ? "Valance" : "None"));
    if(topTreatment!=="None"){
      const treatmentFL = i.topTreatmentFL!=="" && i.topTreatmentFL!=null ? ` — FL-${num(i.topTreatmentFL)}"` : "";
      bits.push(`${topTreatment}${treatmentFL}`);
    }

    (i.extras||[]).forEach(x=>bits.push(
      x==="Pattern Match"||x==="Pattern Matching" ? "Match Print" : x
    ));

    if(i.itemNote) bits.push(i.itemNote);
    return bits.filter(Boolean).join("\n");
  }

  if(i.type==="pillow"){
    const bits=[
      `${i.size||""}${i.size&&i.size!=="Custom"?'" ':''}${i.style||"Pillow"}`.trim(),
      i.zipper ? "Zipper" : "No Zipper"
    ];

    if(i.hasTrim) bits.push(`Trim — ${i.trimPosition||"Outside"}${i.trimHandSewn?", Hand Sewn":""}`);
    if(i.hasCord) bits.push(`Cord — ${i.cordType||"Cord"}`);

    (i.extras||[]).forEach(x=>bits.push(
      x==="Pattern Matching" ? "Match Print" :
      x==="Box Construction" ? "4 Triangles" :
      x
    ));

    if(i.itemNote) bits.push(i.itemNote);
    return bits.filter(Boolean).join("\n");
  }

  if(i.type==="supply"){
    const c=supplyCalc(i);
    return `${i.description||"Supply"}${i.depositRequired===false?"":`\nRequired Deposit: ${c.depositPercent}%`}`;
  }
  return i.description||"Custom item";
}
function itemUnitPrice(i){
  if(i.type==="roman") return num(i.unitPrice);
  if(i.type==="pillow") return num(i.unitPrice);
  return num(i.unitPrice);
}


function discountCalc(subtotal){
  const type=$("#discountType")?.value||"none";
  const raw=Math.max(0,num($("#discountValue")?.value));
  let amount=0;
  let display="";
  if(type==="percent" && raw>0){
    amount=subtotal*(raw/100);
    display=`${raw}%`;
  }else if(type==="flat" && raw>0){
    amount=raw;
    display=money(raw);
  }
  amount=Math.min(amount,subtotal);
  const label=($("#discountLabel")?.value||"Discount").trim()||"Discount";
  return {type,raw,amount,display,label};
}
function invoiceBuckets(){
  let labor=0, supply=0, requiredDeposit=0;
  state.rooms.forEach(r=>r.items.forEach(i=>{
    const val=calcItem(i).final;
    if(i.type==="supply"){
      supply+=val;
      requiredDeposit+=supplyCalc(i).depositDue;
    }else{
      labor+=val;
    }
  }));
  return {labor,supply,requiredDeposit};
}
function renderDiscountSummary(){
  const box=$("#discountSummary");
  if(!box) return;
  const {labor,supply}=invoiceBuckets();
  const install=num($("#installationTotal").value);
  const subtotal=supply+labor+install;
  const d=discountCalc(subtotal);
  if(!d.amount){
    box.innerHTML=`<span>No discount applied.</span><strong>${money(subtotal)} current total</strong>`;
    return;
  }
  box.innerHTML=`<span>${esc(d.label)}: ${esc(d.display)}</span><strong>-${money(d.amount)} → ${money(subtotal-d.amount)}</strong>`;
}

function renderPreview(){
  const c=selectedClient()||{}; const docType=state.docType; const date=$("#docDate").value; const invoiceNo=$("#invoiceNumber").value; const addr=$("#projectAddress").value;
  let labor=0, supply=0, requiredDeposit=0;
  const rows=[];
  state.rooms.forEach(room=>{
    let first=true;
    room.items.forEach(i=>{
      const calc=calcItem(i);
      if(i.type==="supply"){ supply+=calc.final; requiredDeposit+=supplyCalc(i).depositDue; } else labor+=calc.final;
      const desc=`${first?`<div class="room-title">${esc(room.name||"Untitled Room")}</div>`:""}${esc(itemDescription(i)).replace(/\n/g,"<br>")}${first&&room.notes?`<br><span>${esc(room.notes)}</span>`:""}`;
      const displayQty = i.type==="drapery" ? (calc.totalQty||1) : (num(i.quantity)||1);
      rows.push(`<tr><td class="invoice-number-cell">${displayQty}</td><td class="invoice-desc">${desc}</td><td class="invoice-money-cell">${money(itemUnitPrice(i))}</td><td class="invoice-money-cell">${money(calc.final)}</td></tr>`); first=false;
    });
    if(!room.items.length && room.notes){ rows.push(`<tr><td></td><td class="invoice-desc"><div class="room-title">${esc(room.name||"Untitled Room")}</div>${esc(room.notes)}</td><td></td><td></td></tr>`); }
  });
  const install=num($("#installationTotal").value); const subtotal=supply+labor+install; const discount=discountCalc(subtotal); const total=subtotal-discount.amount;
  $("#invoicePreview").innerHTML=`<div class="invoice-wrap"><div class="watermark"><span>${esc(docType.toUpperCase())}</span></div>
    <div class="invoice-top">
      <div class="invoice-brand"><h1>Evana Draperies</h1><div>8200 Hornwood Ct</div><div>Charlotte NC 28215</div><br><div>Phone: 704-236-6032</div><div>Fax: 704-568-8078</div><div>Email: Evanadraperies1@gmail.com</div></div>
      <div class="invoice-doc"><h1>${esc(docType)}</h1><div class="right-block"><div>Date: ${formatDate(date)}</div><div>Invoice # ${esc(invoiceNo||"")}</div><div>Bill To: ${esc(c.name||"")}</div><div>Phone: ${esc(formatPhone(clientPhone1(c)))}</div><div>Email: ${esc(clientEmail1(c))}</div>${addr?`<div>Project: ${esc(addr)}</div>`:""}</div></div>
    </div>
    <table class="invoice-table"><thead><tr><th>Quantity</th><th>Description</th><th>Price Per Unit</th><th>Final Price</th></tr></thead><tbody>${rows.join("")||`<tr><td>&nbsp;</td><td class="invoice-desc">Add rooms and items to begin.</td><td></td><td></td></tr>`}</tbody></table>
    <div class="invoice-bottom"><div><div>Check Make to: Inna Boyarskiy</div><div>Venmo: @Inna_Boyarskiy</div><div>Cash App: $InnaBoyarskiy</div></div><div class="totals"><div class="total-row"><span>Supply:</span><span>${money(supply)}</span></div><div class="total-row"><span>Labor:</span><span>${money(labor)}</span></div><div class="total-row"><span>Installation:</span><span>${money(install)}</span></div>${requiredDeposit>0?`<div class="total-row deposit-row"><span>Required Deposit:</span><span>${money(requiredDeposit)}</span></div>`:""}${discount.amount?`<div class="total-row discount-row"><span>${esc(discount.label)}${discount.type==="percent"?` (${discount.raw}%)`:""}:</span><span>-${money(discount.amount)}</span></div>`:""}<div class="total-row subtotal-row"><span>Subtotal:</span><span>${money(subtotal)}</span></div><div class="total-row grand"><span>Total:</span><span>${money(total)}</span></div></div></div>
  </div>`;
}
function formatDate(v){ if(!v) return ""; const d=new Date(v+"T00:00:00"); return d.toLocaleDateString("en-US"); }

function collectInvoice(){
  const c=selectedClient()||{};
  const {labor,supply,requiredDeposit}=invoiceBuckets();
  const install=num($("#installationTotal").value);
  const subtotal=supply+labor+install;
  const discount=discountCalc(subtotal);
  return {id:uid("inv"),clientId:c.id,clientName:c.name,invoiceNumber:$("#invoiceNumber").value,description:state.rooms.map(r=>r.name).filter(Boolean).join(" / ")||"Project",status:$("#invoiceStatus").value,date:$("#docDate").value,total:subtotal-discount.amount,subtotal,supply,labor,installation:install,requiredDeposit,discount:{type:discount.type,value:discount.raw,amount:discount.amount,label:discount.label},docType:state.docType,projectAddress:$("#projectAddress").value,rooms:JSON.parse(JSON.stringify(state.rooms))};
}

function renderClientsList(){
  const wrap=$("#clientsList"); if(!wrap) return;
  wrap.innerHTML=state.clients.map(c=>`<div class="client-row"><h3>${esc(c.name)}</h3><div class="client-meta">${esc(c.contact||"")} ${c.address?`• ${esc(c.address)}`:""}</div><div class="client-meta">${[clientPhone1(c),clientPhone2(c)].filter(Boolean).map(formatPhone).map(esc).join(" / ")}</div><div class="client-meta">${[clientEmail1(c),clientEmail2(c)].filter(Boolean).map(esc).join(" / ")}</div>${c.notes?`<div class="client-meta">${esc(c.notes)}</div>`:""}</div>`).join("");
}
function renderDashboard(){
  const wrap=$("#dashboardList"); if(!wrap) return;
  wrap.innerHTML=state.clients.map(c=>{
    const inv=state.invoices.filter(i=>i.clientId===c.id); const cash=inv.filter(i=>i.status==="Complete").reduce((s,i)=>s+num(i.total),0);
    return `<details class="dashboard-client"><summary><strong>${esc(c.name)}</strong><span>${money(cash)} completed cash flow</span></summary>${inv.length?`<table class="dashboard-table"><thead><tr><th>Invoice #</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>${inv.map(i=>`<tr><td>${esc(i.invoiceNumber)}</td><td>${esc(i.description)}</td><td><span class="status-pill">${esc(i.status)}</span></td><td>${money(i.total)}</td></tr>`).join("")}</tbody></table>`:`<p class="muted">No saved invoices yet.</p>`}</details>`;
  }).join("");
}

// top-level bindings
$$(".seg").forEach(btn=>btn.addEventListener("click",()=>{
  state.docType=btn.dataset.docType;
  $$(".seg").forEach(b=>b.classList.toggle("active",b===btn));
  const title=$("#builderTitle");
  if(title) title.textContent=`Create ${state.docType}`;
  renderPreview();
  const wm=$("#invoicePreview .watermark span");
  if(wm) wm.textContent=state.docType.toUpperCase();
}));
$("#addRoomBtn").addEventListener("click",()=>addRoom(""));
$("#clientSelect").addEventListener("change",()=>{const c=selectedClient(); if(c) $("#projectAddress").value=c.address||""; renderPreview();});
["#projectAddress","#docDate","#invoiceStatus","#installationTotal","#discountType","#discountValue","#discountLabel"].forEach(sel=>$(sel).addEventListener("input",()=>{renderPreview();renderDiscountSummary();}));
$("#refreshPreviewBtn").addEventListener("click",renderPreview);
$("#printBtn").addEventListener("click",()=>{renderPreview(); window.print();});
$("#newClientBtn").addEventListener("click",()=>$("#clientDialog").showModal());
$("#clientsBtn").addEventListener("click",()=>{ window.location.href="designers.html"; });
$("#dashboardBtn").addEventListener("click",()=>{renderDashboard();$("#dashboardDialog").showModal();});
$("#closeClientsDialog").addEventListener("click",()=>$("#clientsDialog").close());
$("#closeDashboardDialog").addEventListener("click",()=>$("#dashboardDialog").close());
$("#clientForm").addEventListener("submit",e=>{
  if(e.submitter?.value==="cancel") return;
  e.preventDefault();
  const c=normalizeDesigner({id:uid("designer"),name:$("#clientName").value.trim(),contact:$("#contactName").value.trim(),address:$("#clientAddress").value.trim(),phones:[$("#clientPhone1").value.trim(),$("#clientPhone2").value.trim()],emails:[$("#clientEmail1").value.trim(),$("#clientEmail2").value.trim()],notes:$("#clientNotes").value.trim()});
  if(!c.name) return;
  state.clients.push(c); persistClients(); populateClients(); $("#clientSelect").value=c.id; $("#projectAddress").value=c.address; $("#clientForm").reset(); $("#clientDialog").close(); renderPreview(); autosaveAll(false);
});
$("#saveInvoiceBtn").addEventListener("click", async()=>{
  const inv=collectInvoice();
  state.invoices.push(inv);
  persistInvoices();
  await autosaveAll(true);
  renderDashboard();
  alert(`Saved ${inv.docType} #${inv.invoiceNumber} to ${inv.clientName}.`);
  $("#invoiceNumber").value = String(nextInvoiceNumber());
  const title=$("#builderTitle"); if(title) title.textContent=`Create ${state.docType}`;
  renderPreview();
});
$("#saveDraftBtn").addEventListener("click", async()=>{ await autosaveAll(true); alert("Draft saved locally and to cloud if configured.");});

["#clientPhone1","#clientPhone2"].forEach(sel=>{
  const el=$(sel); if(!el) return;
  el.addEventListener("input",()=>{el.value=formatPhone(el.value);});
});

seed().then(()=>renderDiscountSummary());
