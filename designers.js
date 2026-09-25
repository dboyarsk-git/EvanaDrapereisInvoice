
const $=(s,r=document)=>r.querySelector(s);
const esc=(s="")=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=n=>`$${(Number(n)||0).toFixed(2)}`;
const uid=(p="id")=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const LS_CLIENTS="evana_clients_v1", LS_INVOICES="evana_invoices_v1";
function formatPhone(value=""){const d=String(value||"").replace(/\D/g,"").slice(0,10);if(!d)return "";if(d.length<4)return `(${d}`;if(d.length<7)return `(${d.slice(0,3)}) ${d.slice(3)}`;return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;}
function normalizeDesigner(c={}){const phones=Array.isArray(c.phones)?c.phones:[c.phone1||c.clientPhone1||c.phone||"",c.phone2||c.clientPhone2||""];const emails=Array.isArray(c.emails)?c.emails:[c.email1||c.clientEmail1||c.email||"",c.email2||c.clientEmail2||""];return {...c,id:c.id||uid("designer"),name:c.name||c.companyName||c.clientName||"",contact:c.contact||c.contactName||"",address:c.address||c.projectAddress||c.billingAddress||"",phones:[formatPhone(phones[0]||""),formatPhone(phones[1]||"")],emails:[emails[0]||"",emails[1]||""],notes:c.notes||""};}
let clients=[],invoices=[],lastLoadedBundleStamp="";
function syncStatus(message){const el=$("#syncStatusText"); if(el) el.textContent=message;}
function persistLocal(){localStorage.setItem(LS_CLIENTS,JSON.stringify(clients));localStorage.setItem(LS_INVOICES,JSON.stringify(invoices));}
async function persistAll(immediate=false){persistLocal(); if(window.EvanaSync){await window.EvanaSync.savePartial({clients,invoices}, {immediate});}}
function applyBundle(bundle){if(!bundle) return; clients=(bundle.clients||[]).map(normalizeDesigner); invoices=bundle.invoices||[]; lastLoadedBundleStamp=bundle.updatedAt||""; persistLocal(); render();}
async function load(){
  if(window.EvanaSync){
    window.EvanaSync.onStatus(({message})=>syncStatus(message));
    const bundle=await window.EvanaSync.getStartupBundle();
    applyBundle(bundle);
    await window.EvanaSync.init();
  } else {
    try{clients=JSON.parse(localStorage.getItem(LS_CLIENTS)||"[]").map(normalizeDesigner)}catch{clients=[]}
    try{invoices=JSON.parse(localStorage.getItem(LS_INVOICES)||"[]")}catch{invoices=[]}
    persistLocal();
    render();
  }
  const syncBtn=$("#syncNowBtn"), loadBtn=$("#loadCloudBtn");
  if(syncBtn) syncBtn.addEventListener("click", async()=>{await persistAll(true); alert("Saved and synced.");});
  if(loadBtn) loadBtn.addEventListener("click", async()=>{if(!window.EvanaSync) return; const latest=await window.EvanaSync.pullLatest(); if(latest && latest.updatedAt!==lastLoadedBundleStamp){applyBundle(latest); alert("Loaded latest cloud data.");} else {alert("You already have the latest data loaded.");}});
  window.addEventListener("focus", async()=>{if(!window.EvanaSync) return; const latest=await window.EvanaSync.pullLatest(); if(latest && latest.updatedAt && latest.updatedAt!==lastLoadedBundleStamp){applyBundle(latest);}});
}
function render(){const q=(( $("#clientSearch")?.value)||"").toLowerCase();const list=clients.filter(c=>[c.name,c.contact,c.address,...(c.phones||[]),...(c.emails||[])].join(" ").toLowerCase().includes(q));$("#clientCards").innerHTML=list.map(c=>{const inv=invoices.filter(i=>i.clientId===c.id);const cash=inv.filter(i=>i.status==="Complete").reduce((s,i)=>s+(Number(i.total)||0),0);return `<article class="client-detail-card"><div class="client-detail-head"><div><div class="client-company">${esc(c.name)}</div><div class="client-contact">${esc(c.contact||"No contact person listed")}</div></div><div class="designer-actions"><button class="mini-btn edit-client-btn" data-id="${c.id}">Edit</button><button class="mini-btn danger delete-client-btn" data-id="${c.id}">Delete</button></div></div><div class="client-detail-grid"><div><span>Address</span><strong>${esc(c.address||"—")}</strong></div><div><span>Phone 1</span><strong>${esc((c.phones||[])[0]||"—")}</strong></div><div><span>Phone 2</span><strong>${esc((c.phones||[])[1]||"—")}</strong></div><div><span>Email 1</span><strong>${esc((c.emails||[])[0]||"—")}</strong></div><div><span>Email 2</span><strong>${esc((c.emails||[])[1]||"—")}</strong></div><div><span>Completed Cash Flow</span><strong>${money(cash)}</strong></div></div>${c.notes?`<div class="client-notes-box"><span>Notes</span>${esc(c.notes)}</div>`:""}<details class="client-history"><summary>Invoice History <span>${inv.length}</span></summary>${inv.length?`<table class="dashboard-table"><thead><tr><th>Invoice #</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>${inv.map(i=>`<tr><td>${esc(i.invoiceNumber)}</td><td>${esc(i.description)}</td><td><span class="status-pill">${esc(i.status)}</span></td><td>${money(i.total)}</td></tr>`).join("")}</tbody></table>`:`<p class="muted">No saved invoices yet.</p>`}</details></article>`}).join("")||`<div class="empty-state">No designers found.</div>`;document.querySelectorAll(".edit-client-btn").forEach(b=>b.addEventListener("click",()=>openEdit(b.dataset.id)));document.querySelectorAll(".delete-client-btn").forEach(b=>b.addEventListener("click",()=>deleteDesigner(b.dataset.id)));}
function openEdit(id){const c=clients.find(x=>x.id===id);if(!c)return;$("#clientDialogTitle").textContent="Edit Designer";$("#editClientId").value=c.id;$("#pcName").value=c.name||"";$("#pcContact").value=c.contact||"";$("#pcAddress").value=c.address||"";$("#pcPhone1").value=(c.phones||[])[0]||"";$("#pcPhone2").value=(c.phones||[])[1]||"";$("#pcEmail1").value=(c.emails||[])[0]||"";$("#pcEmail2").value=(c.emails||[])[1]||"";$("#pcNotes").value=c.notes||"";$("#clientPageDialog").showModal();}
function openNew(){$("#clientDialogTitle").textContent="Add Designer";$("#clientPageForm").reset();$("#editClientId").value="";$("#clientPageDialog").showModal();}
function deleteDesigner(id){const c=clients.find(x=>x.id===id);if(!c)return;const related=invoices.filter(i=>i.clientId===id);const extra=related.length?`\n\nThis will also delete ${related.length} saved invoice${related.length===1?"":"s"} for this designer.`:"";if(!confirm(`Delete ${c.name}?${extra}\n\nThis cannot be undone.`))return;clients=clients.filter(x=>x.id!==id);invoices=invoices.filter(i=>i.clientId!==id);persistAll(false);render();}
$("#addClientPageBtn").addEventListener("click",openNew);$("#clientSearch").addEventListener("input",render);$("#clientPageForm").addEventListener("submit",async e=>{if(e.submitter?.value==="cancel")return;e.preventDefault();const id=$("#editClientId").value;const data=normalizeDesigner({id:id||uid("designer"),name:$("#pcName").value.trim(),contact:$("#pcContact").value.trim(),address:$("#pcAddress").value.trim(),phones:[$("#pcPhone1").value.trim(),$("#pcPhone2").value.trim()],emails:[$("#pcEmail1").value.trim(),$("#pcEmail2").value.trim()],notes:$("#pcNotes").value.trim()});if(!data.name)return;if(id){clients=clients.map(c=>c.id===id?data:c)}else{clients.push(data)}await persistAll(false);$("#clientPageDialog").close();render();});["#pcPhone1","#pcPhone2"].forEach(sel=>{const el=$(sel);if(el)el.addEventListener("input",()=>el.value=formatPhone(el.value));});
load();
