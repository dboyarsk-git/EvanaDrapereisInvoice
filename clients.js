const $=(s,r=document)=>r.querySelector(s);
const esc=(s="")=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=n=>`$${(Number(n)||0).toFixed(2)}`;
function formatPhone(value=""){
  const digits=String(value).replace(/\D/g,"").slice(0,10);
  if(digits.length===0) return "";
  if(digits.length<4) return `(${digits}`;
  if(digits.length<7) return `(${digits.slice(0,3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
}
const uid=(p="id")=>`${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const LS_CLIENTS="evana_clients_v1", LS_INVOICES="evana_invoices_v1";

let clients=[], invoices=[];
function load(){
  try{clients=JSON.parse(localStorage.getItem(LS_CLIENTS)||"[]")}catch{clients=[]}
  try{invoices=JSON.parse(localStorage.getItem(LS_INVOICES)||"[]")}catch{invoices=[]}
  render();
}
function persist(){ localStorage.setItem(LS_CLIENTS,JSON.stringify(clients)); }

function render(){
  const q=($("#clientSearch")?.value||"").toLowerCase();
  const list=clients.filter(c=>[c.name,c.contact,c.address,...(c.phones||[]),...(c.emails||[])].join(" ").toLowerCase().includes(q));
  $("#clientCards").innerHTML=list.map(c=>{
    const inv=invoices.filter(i=>i.clientId===c.id);
    const cash=inv.filter(i=>i.status==="Complete").reduce((s,i)=>s+(Number(i.total)||0),0);
    return `<article class="client-detail-card">
      <div class="client-detail-head">
        <div>
          <div class="client-company">${esc(c.name)}</div>
          <div class="client-contact">${esc(c.contact||"No contact person listed")}</div>
        </div>
        <button class="mini-btn edit-client-btn" data-id="${c.id}">Edit</button>
      </div>
      <div class="client-detail-grid">
        <div><span>Address</span><strong>${esc(c.address||"—")}</strong></div>
        <div><span>Phone 1</span><strong>${esc((c.phones||[])[0]?formatPhone((c.phones||[])[0]):"—")}</strong></div>
        <div><span>Phone 2</span><strong>${esc((c.phones||[])[1]?formatPhone((c.phones||[])[1]):"—")}</strong></div>
        <div><span>Email 1</span><strong>${esc((c.emails||[])[0]||"—")}</strong></div>
        <div><span>Email 2</span><strong>${esc((c.emails||[])[1]||"—")}</strong></div>
        <div><span>Completed Cash Flow</span><strong>${money(cash)}</strong></div>
      </div>
      ${c.notes?`<div class="client-notes-box"><span>Notes</span>${esc(c.notes)}</div>`:""}
      <details class="client-history">
        <summary>Invoice History <span>${inv.length}</span></summary>
        ${inv.length?`<table class="dashboard-table"><thead><tr><th>Invoice #</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>
          ${inv.map(i=>`<tr><td>${esc(i.invoiceNumber)}</td><td>${esc(i.description)}</td><td><span class="status-pill">${esc(i.status)}</span></td><td>${money(i.total)}</td></tr>`).join("")}
        </tbody></table>`:`<p class="muted">No saved invoices yet.</p>`}
      </details>
    </article>`;
  }).join("") || `<div class="empty-state">No clients found.</div>`;
  document.querySelectorAll(".edit-client-btn").forEach(b=>b.addEventListener("click",()=>openEdit(b.dataset.id)));
}
function openEdit(id){
  const c=clients.find(x=>x.id===id); if(!c)return;
  $("#clientDialogTitle").textContent="Edit Client";
  $("#editClientId").value=c.id;
  $("#pcName").value=c.name||""; $("#pcContact").value=c.contact||""; $("#pcAddress").value=c.address||"";
  $("#pcPhone1").value=(c.phones||[])[0]||""; $("#pcPhone2").value=(c.phones||[])[1]||"";
  $("#pcEmail1").value=(c.emails||[])[0]||""; $("#pcEmail2").value=(c.emails||[])[1]||"";
  $("#pcNotes").value=c.notes||"";
  $("#clientPageDialog").showModal();
}
function openNew(){
  $("#clientDialogTitle").textContent="Add Client";
  $("#clientPageForm").reset(); $("#editClientId").value="";
  $("#clientPageDialog").showModal();
}
$("#addClientPageBtn").addEventListener("click",openNew);
$("#clientSearch").addEventListener("input",render);
$("#clientPageForm").addEventListener("submit",e=>{
  if(e.submitter?.value==="cancel")return;
  e.preventDefault();
  const id=$("#editClientId").value;
  const data={id:id||uid("client"),name:$("#pcName").value.trim(),contact:$("#pcContact").value.trim(),address:$("#pcAddress").value.trim(),phones:[$("#pcPhone1").value.trim(),$("#pcPhone2").value.trim()],emails:[$("#pcEmail1").value.trim(),$("#pcEmail2").value.trim()],notes:$("#pcNotes").value.trim()};
  if(!data.name)return;
  if(id){clients=clients.map(c=>c.id===id?data:c)}else{clients.push(data)}
  persist(); $("#clientPageDialog").close(); render();
});

["#pcPhone1","#pcPhone2"].forEach(sel=>{
  const el=$(sel);
  if(!el) return;
  el.addEventListener("input",()=>{ el.value=formatPhone(el.value); });
});

load();