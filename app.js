const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

const PRICE = {
  drapery: {
    "Euro / Parisian": { range:[120,120], unit:"per width" },
    "Pinch Pleat": { range:[65,85], unit:"per width" },
    "Sheer Rod Pocket": { range:[65,65], unit:"per width" },
    "Sheer Pinch Pleat": { range:[90,90], unit:"per width" },
    "Rod Pocket": { range:[55,65], unit:"per width" },
    "Flat Top": { range:[75,85], unit:"per width" },
    "Goblet Pleat": { range:[85,95], unit:"per width" },
    "Grommet": { range:[85,95], unit:"per width" },
    "Ripple Tape": { range:[75,85], unit:"per width" },
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
    "Brush Fringe / Flange": {18:30,20:35,22:40},
    "Self Cord": {18:35,20:35,22:45},
    "Ruffle + Cord / Four Triangles": {18:50,20:60,22:60},
    "Shirred Cord / Hand Trim / Tassel": {18:55,20:55,22:60},
    "Custom": {18:0,20:0,22:0}
  }
};

const DRAPERY_STYLES = ["Euro / Parisian","Pinch Pleat","Sheer Rod Pocket","Sheer Pinch Pleat","Rod Pocket","Flat Top","Goblet Pleat","Grommet","Ripple Tape","Custom"];
const LININGS = ["No Lining","Lined","Interlined","Blackout","Blackout + Interlined","Bump","Custom"];
const DRAPERY_EXTRAS = ["Pattern Matching","Fabric Band","Trim","Hand Side Hem","Mounted on Board","Attached Valance","Grommets","Hardware","Alteration","Bump","Custom Extra"];
const ROMAN_EXTRAS = ["Motorized","Rowley Lifting System","Cordless Lifting System","Continuous Cord System","Stabilizing Fabric","Tailored Valance","Pattern Match","Inside Mount","Outside Mount","Hardware","Custom Extra"];
const PILLOW_EXTRAS = ["Zipper","Turkish Corners","Box Construction","Pattern Matching","Cut Down Pillow Form","Custom Pillow Form","Down Insert","Trim","Custom Extra"];

const state = {
  docType:"Estimate",
  rooms:[],
  clients:[],
  invoices:[]
};

const LS_CLIENTS = "evana_clients_v1";
const LS_INVOICES = "evana_invoices_v1";

function uid(prefix="id"){ return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`; }
function money(n){ return `$${(Number(n)||0).toFixed(2)}`; }
function esc(s=""){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c])); }
function roundQuarter(v){ return Math.round((Number(v)||0)*4)/4; }
function num(v){ return Number(v)||0; }

function seed(){
  try { state.clients = JSON.parse(localStorage.getItem(LS_CLIENTS) || "[]"); } catch { state.clients=[]; }
  try { state.invoices = JSON.parse(localStorage.getItem(LS_INVOICES) || "[]"); } catch { state.invoices=[]; }
  if(!state.clients.length){
    state.clients = [
      {id:uid("client"),name:"Workmon",contact:"Mary Workmon",address:"114 Gregg Street",phones:[""],emails:[""],notes:""},
      {id:uid("client"),name:"Demo Designer",contact:"Sara Designer",address:"Charlotte, NC",phones:["704-555-0101"],emails:["sara@example.com"],notes:"Demo record"}
    ];
    persistClients();
  }
  populateClients();
  $("#docDate").value = new Date().toISOString().slice(0,10);
  $("#invoiceNumber").value = String(nextInvoiceNumber());
  addRoom("Living Room / Dining Room");
  renderPreview();
}

function persistClients(){ localStorage.setItem(LS_CLIENTS, JSON.stringify(state.clients)); }
function persistInvoices(){ localStorage.setItem(LS_INVOICES, JSON.stringify(state.invoices)); }
function nextInvoiceNumber(){
  const nums = state.invoices.map(i=>parseInt(i.invoiceNumber,10)).filter(Number.isFinite);
  return nums.length ? Math.max(...nums)+1 : 1001;
}

function populateClients(){
  const sel=$("#clientSelect"); const current=sel.value;
  sel.innerHTML = state.clients.map(c=>`<option value="${c.id}">${esc(c.name)}${c.contact?` — ${esc(c.contact)}`:""}</option>`).join("");
  if(current && state.clients.some(c=>c.id===current)) sel.value=current;
  if(!$("#projectAddress").value){ const c=selectedClient(); if(c) $("#projectAddress").value=c.address||""; }
  renderClientsList(); renderDashboard();
}
function selectedClient(){ return state.clients.find(c=>c.id===$("#clientSelect").value) || state.clients[0]; }

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
  $(".item-title",node).textContent = ({drapery:"Drapery",roman:"Roman Shade",pillow:"Pillow",custom:"Custom Item"})[item.type];
  $$(".type-tab",node).forEach(btn=>{
    btn.classList.toggle("active",btn.dataset.type===item.type);
    btn.addEventListener("click",()=>{item.type=btn.dataset.type; Object.keys(item).filter(k=>!["id","type","quantity","overridePrice"].includes(k)).forEach(k=>delete item[k]); renderRooms(); renderPreview();});
  });
  $(".remove-item-btn",node).addEventListener("click",()=>{room.items=room.items.filter(x=>x.id!==item.id);renderRooms();renderPreview();});
  const form=$(".item-form",node);
  if(item.type==="drapery") form.innerHTML=draperyForm(item);
  if(item.type==="roman") form.innerHTML=romanForm(item);
  if(item.type==="pillow") form.innerHTML=pillowForm(item);
  if(item.type==="custom") form.innerHTML=customForm(item);
  bindItemForm(node,item);
  renderPriceSummary(node,item);
  return node;
}

function options(arr,selected){ return arr.map(v=>`<option ${v===selected?"selected":""}>${esc(v)}</option>`).join(""); }
function checkChips(arr,selected=[]){ return arr.map(v=>`<label class="check-chip"><input type="checkbox" class="extra-check" value="${esc(v)}" ${selected.includes(v)?"checked":""}>${esc(v)}</label>`).join(""); }

function draperyForm(i){
  i.style ||= DRAPERY_STYLES[0]; i.pieceType ||= "Pair"; i.widths ??= 1; i.fl ??=""; i.fw ??=""; i.lining ||= "Lined"; i.extras ||= []; i.unitPrice ??= PRICE.drapery[i.style]?.range[0]||0; i.quantity ??=1; i.customStyle||=""; i.itemNote||=""; i.showPricing ??= true;
  return `
  <div class="grid grid-3">
    <label>Style<select class="f-style">${options(DRAPERY_STYLES,i.style)}</select></label>
    <label>Pair / Panel<select class="f-piece">${options(["Pair","Panel"],i.pieceType)}</select></label>
    <label>Widths<input class="f-widths" type="number" min="0" step="0.5" value="${i.widths}"></label>
  </div>
  <div class="grid grid-3">
    <label>Finished Length (FL) <input class="f-fl" type="number" min="0" step="0.25" value="${i.fl}"></label>
    <label>Finished Width (FW) <input class="f-fw" type="number" min="0" step="0.25" value="${i.fw}"></label>
    <label>Lining<select class="f-lining">${options(LININGS,i.lining)}</select></label>
  </div>
  ${i.style==="Custom"?`<label>Custom Style<input class="f-custom-style" value="${esc(i.customStyle)}"></label>`:""}
  <div class="subsection">
    <div class="subsection-head"><h4>Extras — select all that apply, then continue</h4><span class="muted">Checkbox group</span></div>
    <div class="choice-grid">${checkChips(DRAPERY_EXTRAS,i.extras)}</div>
  </div>
  <label>Item Description / Custom Note<textarea class="f-item-note" rows="2" placeholder="Hardware, traverse rod, French return, special instructions...">${esc(i.itemNote)}</textarea></label>
  <div class="grid grid-3">
    <label>Price Per Width<input class="f-unit-price" type="number" min="0" step="0.01" value="${i.unitPrice}"></label>
    <label>Quantity (entered last)<input class="f-quantity" type="number" min="1" step="1" value="${i.quantity}"></label>
    <label>Override Final Price<input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional"></label>
  </div>
  <div class="toggle-row"><label class="toggle"><input type="checkbox" class="f-show-pricing" ${i.showPricing?"checked":""}> Show surcharge / pricing details</label><span class="muted">Suggested range: ${rangeText(PRICE.drapery[i.style]?.range)}</span></div>
  `;
}

function romanForm(i){
  i.style ||= "Flat Roman"; i.fl ??=""; i.fw ??=""; i.extras ||= []; i.quantity ??=1; i.unitPrice ??= PRICE.roman[i.style]?.rate||0; i.overridePrice||=""; i.itemNote||=""; i.motorCost ??= 300; i.showPricing ??=true;
  return `
  <div class="grid grid-3">
    <label>Roman Style<select class="f-style">${options(Object.keys(PRICE.roman),i.style)}</select></label>
    <label>Finished Width (FW)<input class="f-fw" type="number" min="0" step="0.25" value="${i.fw}"></label>
    <label>Finished Length (FL)<input class="f-fl" type="number" min="0" step="0.25" value="${i.fl}"></label>
  </div>
  <div class="subsection"><div class="subsection-head"><h4>Extras</h4><span class="muted">Select multiple</span></div><div class="choice-grid">${checkChips(ROMAN_EXTRAS,i.extras)}</div></div>
  ${i.extras.includes("Motorized")?`<label>Motor / Hardware Cost per Shade<input class="f-motor-cost" type="number" min="0" step="0.01" value="${i.motorCost}"></label>`:""}
  <label>Item Description / Custom Note<textarea class="f-item-note" rows="2">${esc(i.itemNote)}</textarea></label>
  <div class="grid grid-3">
    <label>Price Per Sq. Ft.<input class="f-unit-price" type="number" min="0" step="0.01" value="${i.unitPrice}"></label>
    <label>Quantity (entered last)<input class="f-quantity" type="number" min="1" step="1" value="${i.quantity}"></label>
    <label>Override Final Price<input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional"></label>
  </div>
  <div class="toggle-row"><label class="toggle"><input type="checkbox" class="f-show-pricing" ${i.showPricing?"checked":""}> Show size / pricing details</label><span class="muted">Sq. ft. rounds to nearest 0.25</span></div>
  `;
}

function pillowForm(i){
  i.style ||= "Plain"; i.size ||= "18"; i.extras ||= []; i.quantity ??=1; i.customPrice ??=0; i.overridePrice||=""; i.itemNote||=""; i.patternMatchCharge ??=10; i.showPricing ??=true;
  const base = PRICE.pillow[i.style]?.[i.size] ?? 0;
  return `
  <div class="grid grid-3">
    <label>Pillow Style<select class="f-style">${options(Object.keys(PRICE.pillow),i.style)}</select></label>
    <label>Size<select class="f-size">${options(["18","20","22","Custom"],i.size)}</select></label>
    <label>Base Price Each<input class="f-unit-price" type="number" min="0" step="0.01" value="${i.size==="Custom"?(i.customPrice||0):base}"></label>
  </div>
  <div class="subsection"><div class="subsection-head"><h4>Extras</h4><span class="muted">Select multiple</span></div><div class="choice-grid">${checkChips(PILLOW_EXTRAS,i.extras)}</div></div>
  ${i.extras.includes("Pattern Matching")?`<label>Pattern Match Charge Per Pillow<input class="f-pattern-charge" type="number" min="0" step="0.01" value="${i.patternMatchCharge}"></label>`:""}
  <label>Item Description / Custom Note<textarea class="f-item-note" rows="2">${esc(i.itemNote)}</textarea></label>
  <div class="grid grid-2">
    <label>Quantity (entered last)<input class="f-quantity" type="number" min="1" step="1" value="${i.quantity}"></label>
    <label>Override Final Price<input class="f-override" type="number" min="0" step="0.01" value="${i.overridePrice||""}" placeholder="Optional"></label>
  </div>
  <div class="toggle-row"><label class="toggle"><input type="checkbox" class="f-show-pricing" ${i.showPricing?"checked":""}> Show pricing details</label><span class="muted">Zipper +$10; Turkish / box +$10</span></div>
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
}
function rangeText(r){ if(!r) return "Manual"; return r[0]===r[1]?money(r[0]):`${money(r[0])}–${money(r[1])}`; }

function bindItemForm(node,item){
  const bind=(sel,key,convert=v=>v,rerender=false)=>{ const el=$(sel,node); if(!el) return; const evt=(el.type==="checkbox"||el.tagName==="SELECT")?"change":"input"; el.addEventListener(evt,e=>{ item[key]=convert(el.type==="checkbox"?el.checked:el.value); if(rerender) renderRooms(); else { renderPriceSummary(node,item); renderPreview(); } }); };
  bind(".f-style","style",v=>v,true); bind(".f-piece","pieceType"); bind(".f-widths","widths",num); bind(".f-fl","fl",num); bind(".f-fw","fw",num); bind(".f-lining","lining"); bind(".f-custom-style","customStyle"); bind(".f-item-note","itemNote"); bind(".f-quantity","quantity",num); bind(".f-unit-price","unitPrice",num); bind(".f-override","overridePrice",v=>v===""?"":num(v)); bind(".f-motor-cost","motorCost",num); bind(".f-pattern-charge","patternMatchCharge",num); bind(".f-description","description"); bind(".f-size","size",v=>v,true); bind(".f-show-pricing","showPricing",Boolean);
  $$(".extra-check",node).forEach(ch=>ch.addEventListener("change",()=>{ item.extras=$$(".extra-check:checked",node).map(x=>x.value); renderRooms(); renderPreview(); }));
}

function draperyCalc(i){
  const entered=num(i.widths), billable=Math.ceil(entered);
  const base = billable*num(i.unitPrice)*Math.max(1,num(i.quantity));
  let pct=0; const reasons=[];
  if(i.pieceType==="Pair"){
    if(billable>=8){pct+=100;reasons.push("8+ widths per pair: +100% (double)");}
    else if(billable>=6){pct+=20;reasons.push("6–7 widths per pair: +20%");}
  }
  const fl=num(i.fl);
  if(fl>=160){pct+=100;reasons.push("Length 160\"+: +100% (double)");}
  else if(fl>=120){pct+=50;reasons.push("Length 120–159\": +50%");}
  else if(fl>96){pct+=20;reasons.push("Length 97–119\": +20%");}
  if((i.extras||[]).includes("Pattern Matching")){pct+=20;reasons.push("Pattern matching: +20%");}
  if(i.lining==="Bump" || (i.extras||[]).includes("Bump")){pct+=20;reasons.push("Bump: +20%");}
  const calculated=base*(1+pct/100);
  const final = i.overridePrice!=="" ? num(i.overridePrice) : calculated;
  return {base,pct,reasons,calculated,final,billable,entered};
}

function romanCalc(i){
  const sqftRaw=(num(i.fw)*num(i.fl))/144;
  const sqft=roundQuarter(sqftRaw);
  let pct=0; const reasons=[]; const maxDim=Math.max(num(i.fw),num(i.fl));
  if(maxDim>=80){pct=100;reasons.push("Either dimension 80\"+: +100% (double)");}
  else if(maxDim>=60){pct=20;reasons.push("Either dimension 60–79\": +20%");}
  let each = sqft*num(i.unitPrice)*(1+pct/100);
  const extras=i.extras||[]; let extrasEach=0;
  if(extras.includes("Motorized")) extrasEach += num(i.motorCost||300);
  if(extras.includes("Rowley Lifting System")) extrasEach += 50;
  if(extras.includes("Cordless Lifting System")) extrasEach += 75;
  if(extras.includes("Continuous Cord System")) extrasEach += 100;
  if(extras.includes("Stabilizing Fabric")) extrasEach += sqft*2;
  if(extras.includes("Tailored Valance")) extrasEach += 20;
  each += extrasEach;
  const calculated = each*Math.max(1,num(i.quantity));
  const final = i.overridePrice!=="" ? num(i.overridePrice) : calculated;
  return {sqftRaw,sqft,pct,reasons,extrasEach,calculated,final};
}

function pillowCalc(i){
  const size = i.size==="Custom"?"18":i.size;
  let baseEach = num(i.unitPrice);
  let extraEach=0; const reasons=[]; const ex=i.extras||[];
  if(ex.includes("Zipper")){extraEach+=10;reasons.push("Zipper +$10");}
  if(ex.includes("Turkish Corners")){extraEach+=10;reasons.push("Turkish corners +$10");}
  if(ex.includes("Box Construction")){extraEach+=10;reasons.push("Box construction +$10");}
  if(ex.includes("Cut Down Pillow Form")){extraEach+=10;reasons.push("Cut down pillow form +$10");}
  if(ex.includes("Custom Pillow Form")){extraEach+=10;reasons.push("Custom pillow form +$10");}
  if(ex.includes("Pattern Matching")){extraEach+=num(i.patternMatchCharge||10);reasons.push(`Pattern matching +${money(i.patternMatchCharge||10)}`);}
  const calculated=(baseEach+extraEach)*Math.max(1,num(i.quantity));
  const final=i.overridePrice!==""?num(i.overridePrice):calculated;
  return {baseEach,extraEach,reasons,calculated,final};
}
function customCalc(i){ const calculated=num(i.unitPrice)*Math.max(1,num(i.quantity)); return {calculated,final:i.overridePrice!==""?num(i.overridePrice):calculated}; }
function calcItem(i){ return i.type==="drapery"?draperyCalc(i):i.type==="roman"?romanCalc(i):i.type==="pillow"?pillowCalc(i):customCalc(i); }

function renderPriceSummary(node,item){
  const box=$(".price-summary",node); if(!box) return; const c=calcItem(item);
  let details="";
  if(item.type==="drapery") details=`<div>Entered widths: ${c.entered} → Billable widths: <strong>${c.billable}</strong></div><div>Base: ${money(c.base)}</div>${c.reasons.map(r=>`<div>${esc(r)}</div>`).join("")}<div>Total surcharge: +${c.pct}%</div>`;
  if(item.type==="roman") details=`<div>Sq. ft.: ${c.sqftRaw.toFixed(4)} → <strong>${c.sqft.toFixed(2)}</strong></div>${c.reasons.map(r=>`<div>${esc(r)}</div>`).join("")}<div>Extras per shade: ${money(c.extrasEach)}</div>`;
  if(item.type==="pillow") details=`<div>Base each: ${money(c.baseEach)}</div>${c.reasons.map(r=>`<div>${esc(r)}</div>`).join("")}<div>Extras each: ${money(c.extraEach)}</div>`;
  if(item.type==="custom") details=`<div>Manual line item</div>`;
  box.innerHTML=`<div class="total-line"><span>Calculated</span><strong>${money(c.calculated)}</strong></div>${item.overridePrice!==""?`<div class="total-line"><span>Override in use</span><strong>${money(c.final)}</strong></div>`:""}<div class="pricing-detail ${item.showPricing===false?"hidden":""}">${details}</div>`;
}

function itemDescription(i){
  if(i.type==="drapery"){
    const style=i.style==="Custom"?(i.customStyle||"Custom Drapery"):i.style;
    const bits=[`${style} ${i.pieceType||""}`.trim(), i.lining && i.lining!=="No Lining"?i.lining.toLowerCase():"unlined", `${i.pieceType||"Pair"} • ${i.widths||0} width${num(i.widths)===1?"":"s"}`, `FL-${num(i.fl)||""}\", FW-${num(i.fw)||""}\"`];
    if(i.extras?.length) bits.push(`Extras: ${i.extras.join(", ")}`);
    if(i.itemNote) bits.push(i.itemNote);
    return bits.filter(Boolean).join("\n");
  }
  if(i.type==="roman"){
    const c=romanCalc(i); const bits=[i.style||"Roman Shade",`FW-${num(i.fw)||""}\", FL-${num(i.fl)||""}\" [${c.sqft.toFixed(2)} sq. ft.]`];
    if(i.extras?.length) bits.push(`Extras: ${i.extras.join(", ")}`);
    if(i.itemNote) bits.push(i.itemNote); return bits.join("\n");
  }
  if(i.type==="pillow"){
    const bits=[`${i.size||""}${i.size&&i.size!=="Custom"?'" ':''}${i.style||"Pillow"}`.trim()]; if(i.extras?.length) bits.push(`Extras: ${i.extras.join(", ")}`); if(i.itemNote) bits.push(i.itemNote); return bits.join("\n");
  }
  return i.description||"Custom item";
}
function itemUnitPrice(i){
  if(i.type==="roman") return num(i.unitPrice);
  if(i.type==="pillow") return num(i.unitPrice);
  return num(i.unitPrice);
}

function renderPreview(){
  const c=selectedClient()||{}; const docType=state.docType; const date=$("#docDate").value; const invoiceNo=$("#invoiceNumber").value; const addr=$("#projectAddress").value;
  let labor=0;
  const rows=[];
  state.rooms.forEach(room=>{
    let first=true;
    room.items.forEach(i=>{
      const calc=calcItem(i); labor+=calc.final;
      const desc=`${first?`<div class="room-title">${esc(room.name||"Untitled Room")}</div>`:""}${esc(itemDescription(i)).replace(/\n/g,"<br>")}${first&&room.notes?`<br><span>${esc(room.notes)}</span>`:""}`;
      rows.push(`<tr><td class="invoice-number-cell">${num(i.quantity)||1}</td><td class="invoice-desc">${desc}</td><td class="invoice-money-cell">${money(itemUnitPrice(i))}</td><td class="invoice-money-cell">${money(calc.final)}</td></tr>`); first=false;
    });
    if(!room.items.length && room.notes){ rows.push(`<tr><td></td><td class="invoice-desc"><div class="room-title">${esc(room.name||"Untitled Room")}</div>${esc(room.notes)}</td><td></td><td></td></tr>`); }
  });
  const supply=num($("#supplyTotal").value); const install=num($("#installationTotal").value); const total=supply+labor+install;
  $("#invoicePreview").innerHTML=`<div class="invoice-wrap"><div class="watermark"><span>ESTIMATE</span></div>
    <div class="invoice-top">
      <div class="invoice-brand"><h1>Evana Draperies</h1><div>8200 Hornwood Ct</div><div>Charlotte NC 28215</div><br><div>Phone: 704-236-6032</div><div>Fax: 704-568-8078</div><div>Email: Evanadraperies1@gmail.com</div></div>
      <div class="invoice-doc"><h1>${esc(docType)}</h1><div class="right-block"><div>Date: ${formatDate(date)}</div><div>Invoice # ${esc(invoiceNo||"")}</div><div>Bill To: ${esc(c.contact||c.name||"")}</div><div>Phone: ${esc((c.phones||[]).filter(Boolean).join(" / ")||"")}</div><div>Email: ${esc((c.emails||[]).filter(Boolean).join(" / ")||"")}</div>${addr?`<div>Project: ${esc(addr)}</div>`:""}</div></div>
    </div>
    <table class="invoice-table"><thead><tr><th>Quantity</th><th>Description</th><th>Price Per Unit</th><th>Final Price</th></tr></thead><tbody>${rows.join("")||`<tr><td>&nbsp;</td><td class="invoice-desc">Add rooms and items to begin.</td><td></td><td></td></tr>`}</tbody></table>
    <div class="invoice-bottom"><div><div>Check Make to: Inna Boyarskiy</div><div>Venmo: @Inna_Boyarskiy</div><div>Cash App: $InnaBoyarskiy</div></div><div class="totals"><div class="total-row"><span>Supply:</span><span>${money(supply)}</span></div><div class="total-row"><span>Labor:</span><span>${money(labor)}</span></div><div class="total-row"><span>Installation:</span><span>${money(install)}</span></div><div class="total-row grand"><span>Total:</span><span>${money(total)}</span></div></div></div>
  </div>`;
}
function formatDate(v){ if(!v) return ""; const d=new Date(v+"T00:00:00"); return d.toLocaleDateString("en-US"); }

function collectInvoice(){
  const c=selectedClient()||{}; let labor=0; state.rooms.forEach(r=>r.items.forEach(i=>labor+=calcItem(i).final));
  const supply=num($("#supplyTotal").value), install=num($("#installationTotal").value);
  return {id:uid("inv"),clientId:c.id,clientName:c.name,invoiceNumber:$("#invoiceNumber").value,description:state.rooms.map(r=>r.name).filter(Boolean).join(" / ")||"Project",status:$("#invoiceStatus").value,date:$("#docDate").value,total:supply+labor+install,supply,labor,installation:install,docType:state.docType,projectAddress:$("#projectAddress").value,rooms:JSON.parse(JSON.stringify(state.rooms))};
}

function renderClientsList(){
  const wrap=$("#clientsList"); if(!wrap) return;
  wrap.innerHTML=state.clients.map(c=>`<div class="client-row"><h3>${esc(c.name)}</h3><div class="client-meta">${esc(c.contact||"")} ${c.address?`• ${esc(c.address)}`:""}</div><div class="client-meta">${esc((c.phones||[]).filter(Boolean).join(" / "))}</div><div class="client-meta">${esc((c.emails||[]).filter(Boolean).join(" / "))}</div>${c.notes?`<div class="client-meta">${esc(c.notes)}</div>`:""}</div>`).join("");
}
function renderDashboard(){
  const wrap=$("#dashboardList"); if(!wrap) return;
  wrap.innerHTML=state.clients.map(c=>{
    const inv=state.invoices.filter(i=>i.clientId===c.id); const cash=inv.filter(i=>i.status==="Complete").reduce((s,i)=>s+num(i.total),0);
    return `<details class="dashboard-client"><summary><strong>${esc(c.name)}</strong><span>${money(cash)} completed cash flow</span></summary>${inv.length?`<table class="dashboard-table"><thead><tr><th>Invoice #</th><th>Description</th><th>Status</th><th>Amount</th></tr></thead><tbody>${inv.map(i=>`<tr><td>${esc(i.invoiceNumber)}</td><td>${esc(i.description)}</td><td><span class="status-pill">${esc(i.status)}</span></td><td>${money(i.total)}</td></tr>`).join("")}</tbody></table>`:`<p class="muted">No saved invoices yet.</p>`}</details>`;
  }).join("");
}

// top-level bindings
$$(".seg").forEach(btn=>btn.addEventListener("click",()=>{state.docType=btn.dataset.docType; $$(".seg").forEach(b=>b.classList.toggle("active",b===btn)); renderPreview();}));
$("#addRoomBtn").addEventListener("click",()=>addRoom(""));
$("#clientSelect").addEventListener("change",()=>{const c=selectedClient(); if(c) $("#projectAddress").value=c.address||""; renderPreview();});
["#projectAddress","#docDate","#invoiceNumber","#invoiceStatus","#supplyTotal","#installationTotal"].forEach(sel=>$(sel).addEventListener("input",renderPreview));
$("#refreshPreviewBtn").addEventListener("click",renderPreview);
$("#printBtn").addEventListener("click",()=>{renderPreview(); window.print();});
$("#newClientBtn").addEventListener("click",()=>$("#clientDialog").showModal());
$("#clientsBtn").addEventListener("click",()=>{renderClientsList();$("#clientsDialog").showModal();});
$("#dashboardBtn").addEventListener("click",()=>{renderDashboard();$("#dashboardDialog").showModal();});
$("#closeClientsDialog").addEventListener("click",()=>$("#clientsDialog").close());
$("#closeDashboardDialog").addEventListener("click",()=>$("#dashboardDialog").close());
$("#clientForm").addEventListener("submit",e=>{
  if(e.submitter?.value==="cancel") return;
  e.preventDefault();
  const c={id:uid("client"),name:$("#clientName").value.trim(),contact:$("#contactName").value.trim(),address:$("#clientAddress").value.trim(),phones:[$("#clientPhone1").value.trim(),$("#clientPhone2").value.trim()],emails:[$("#clientEmail1").value.trim(),$("#clientEmail2").value.trim()],notes:$("#clientNotes").value.trim()};
  if(!c.name) return;
  state.clients.push(c); persistClients(); populateClients(); $("#clientSelect").value=c.id; $("#projectAddress").value=c.address; $("#clientForm").reset(); $("#clientDialog").close(); renderPreview();
});
$("#saveInvoiceBtn").addEventListener("click",()=>{const inv=collectInvoice(); state.invoices.push(inv); persistInvoices(); renderDashboard(); alert(`Saved ${inv.docType} #${inv.invoiceNumber} to ${inv.clientName}.`);});
$("#saveDraftBtn").addEventListener("click",()=>{localStorage.setItem("evana_current_draft_v1",JSON.stringify({rooms:state.rooms,projectAddress:$("#projectAddress").value,date:$("#docDate").value,invoiceNumber:$("#invoiceNumber").value,status:$("#invoiceStatus").value,supply:$("#supplyTotal").value,install:$("#installationTotal").value,clientId:$("#clientSelect").value,docType:state.docType})); alert("Draft saved in this browser.");});

seed();
