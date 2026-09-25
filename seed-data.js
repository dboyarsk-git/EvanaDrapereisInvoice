
(function(){
  const CLIENTS_KEY='evana_clients_v1';
  const BUNDLE_KEY='evana_bundle_v1';
  const META_KEY='evana_bundle_meta_v1';
  const imported=[
    {id:'designer_import_michelle_mcswain',name:'Michelle McSwain',contact:'',address:'',phones:['(704) 691-4314',''],emails:['michellemcswain29@yahoo.com',''],notes:''},
    {id:'designer_import_clarissa_michael',name:'Clarissa + Michael',contact:'',address:'',phones:['(917) 575-7710',''],emails:['',''],notes:'Email not provided.'},
    {id:'designer_import_new_old_mary_ludemann',name:'New Old',contact:'Mary Ludemann',address:'',phones:['(407) 267-4450',''],emails:['mary@newold.com',''],notes:''},
    {id:'designer_import_beth_lomas',name:'Beth Lomas',contact:'',address:'',phones:['(704) 771-6370',''],emails:['Lomasinteriors@gmail.com',''],notes:''},
    {id:'designer_import_philip_mchugh',name:'Philip McHugh',contact:'',address:'',phones:['(704) 421-4644',''],emails:['',''],notes:'Email: TBD'},
    {id:'designer_import_lauren_casella',name:'Lauren Casella',contact:'',address:'',phones:['(704) 604-5515',''],emails:['Lauren.e.casella@gmail.com',''],notes:''}
  ];
  const safe=(x,f)=>{try{return JSON.parse(x)}catch{return f}};
  const phone=v=>String(v||'').replace(/\D/g,'').slice(-10);
  const email=v=>String(v||'').trim().toLowerCase();
  const nm=v=>String(v||'').trim().toLowerCase().replace(/\s+/g,' ');
  let clients=safe(localStorage.getItem(CLIENTS_KEY),[]);
  if(!Array.isArray(clients)) clients=[];
  let changed=false;
  imported.forEach(seed=>{
    const sp=(seed.phones||[]).map(phone).filter(Boolean), se=(seed.emails||[]).map(email).filter(Boolean);
    let ex=clients.find(c=>{
      const cp=(c.phones||[]).map(phone).filter(Boolean), ce=(c.emails||[]).map(email).filter(Boolean);
      if(sp.some(p=>cp.includes(p))) return true;
      if(se.some(e=>ce.includes(e))) return true;
      return nm(c.name)===nm(seed.name) && nm(c.contact||'')===nm(seed.contact||'');
    });
    if(!ex){clients.push(JSON.parse(JSON.stringify(seed)));changed=true;return;}
    ex.phones=Array.isArray(ex.phones)?ex.phones:['','']; ex.emails=Array.isArray(ex.emails)?ex.emails:['',''];
    if(!ex.name&&seed.name){ex.name=seed.name;changed=true}
    if(!ex.contact&&seed.contact){ex.contact=seed.contact;changed=true}
    if(!ex.phones[0]&&seed.phones[0]){ex.phones[0]=seed.phones[0];changed=true}
    if(!ex.emails[0]&&seed.emails[0]){ex.emails[0]=seed.emails[0];changed=true}
    if(!ex.notes&&seed.notes){ex.notes=seed.notes;changed=true}
  });
  localStorage.setItem(CLIENTS_KEY,JSON.stringify(clients));
  let bundle=safe(localStorage.getItem(BUNDLE_KEY),{});
  if(!bundle||typeof bundle!=='object') bundle={};
  bundle.clients=clients;
  bundle.invoices=Array.isArray(bundle.invoices)?bundle.invoices:safe(localStorage.getItem('evana_invoices_v1'),[]);
  bundle.currentDraft=bundle.currentDraft||safe(localStorage.getItem('evana_current_draft_v1'),null);
  if(changed || !bundle.updatedAt) bundle.updatedAt=new Date().toISOString();
  bundle.version=1;
  localStorage.setItem(BUNDLE_KEY,JSON.stringify(bundle));
  localStorage.setItem(META_KEY,JSON.stringify({updatedAt:bundle.updatedAt}));
  window.EVANA_IMPORTED_DESIGNERS=imported;
})();
