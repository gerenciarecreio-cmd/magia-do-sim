const SUPABASE_URL = 'https://yruwsmjmnssovojsdbah.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_54PNMN8dAUNOliQ1tt1hQg_CVZRwXXw';
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
});

const state = {
  loading: true,
  session: null,
  user: null,
  profile: null,
  role: 'client',
  weddings: [],
  clients: [],
  selectedWeddingId: null,
  wedding: null,
  vendors: [],
  tasks: [],
  meetings: [],
  docs: [],
  payments: [],
  vendorFilter: 'Todos',
  taskFilter: 'Todos',
  docFilter: 'Todos'
};

const app = document.getElementById('app');

const icons = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 10.8 12 3l9 7.8v9.2a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M8 2v4M16 2v4M3 10h18"/></svg>',
  file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>',
  money: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 9h.01M17 15h.01M12 9c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/></svg>',
  meeting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M8 7V3m8 4V3M4 11h16"/><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 15h3M13 15h3"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M10 17l5-5-5-5M15 12H3"/><path d="M13 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6"/></svg>',
  chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m9 18 6-6-6-6"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>'
};

const navItems = [
  ['dashboard','Início','home'],
  ['meu-casamento','Meu casamento','heart'],
  ['fornecedores','Fornecedores','users'],
  ['checklist','Checklist','check'],
  ['cronograma','Cronograma','calendar'],
  ['documentos','Documentos','file'],
  ['financeiro','Financeiro','money'],
  ['reunioes','Reuniões','meeting']
];

function esc(v=''){
  return String(v ?? '').replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function route(){ return (location.hash || '#/dashboard').replace('#/','').split('?')[0]; }
function goto(r){ location.hash = '#/' + r; }
function brl(n){ return Number(n||0).toLocaleString('pt-BR',{style:'currency',currency:'BRL'}); }
function pct(v,t){ return Number(t)>0 ? Math.round((Number(v||0)/Number(t))*100) : 0; }
function dateBR(v){ if(!v) return '—'; const [y,m,d]=String(v).split('-'); return `${d}/${m}/${y}`; }
function dateLong(v){ if(!v) return 'Data a definir'; const [y,m,d]=String(v).split('-').map(Number); return new Date(y,m-1,d).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'}); }
function timeBR(v){ return v ? String(v).slice(0,5).replace(':','h') : '—'; }
function statusClass(status){
  if(['Contratado','Concluído','Pago'].includes(status)) return 'success';
  if(status==='Em andamento') return 'warning';
  if(status==='Em negociação') return 'info';
  return 'danger';
}
function toast(text){
  const root=document.getElementById('toast-root'); if(!root) return;
  const el=document.createElement('div'); el.className='toast'; el.textContent=text; root.appendChild(el);
  setTimeout(()=>el.remove(),3200);
}
function emptyState(title,desc){ return `<div class="state-box"><div class="state-icon">♡</div><h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`; }
function loadingView(){ return `<div class="login-page" style="display:grid;place-items:center;min-height:100vh"><div class="card card-pad" style="max-width:420px;text-align:center"><img src="assets/logo-oficial.png" alt="A Magia do Sim" style="max-width:180px"><p class="muted">Carregando sua área exclusiva...</p></div></div>`; }

async function bootstrap(){
  app.innerHTML = loadingView();
  const { data:{ session } } = await sb.auth.getSession();
  if(session) await hydrateSession(session);
  else { state.loading=false; render(); }
}

async function hydrateSession(session){
  state.loading=true; state.session=session; state.user=session.user;
  const { data: profile, error } = await sb.from('profiles').select('*').eq('id', session.user.id).maybeSingle();
  if(error){ console.error(error); await sb.auth.signOut(); state.session=null; state.user=null; state.loading=false; render(); return; }
  state.profile = profile || { id: session.user.id, full_name: session.user.email?.split('@')[0] || 'Cliente', role:'client', email:session.user.email };
  state.role = state.profile.role || 'client';
  if(state.role==='admin'){
    await loadAdminData();
  } else {
    const { data:wedding } = await sb.from('weddings').select('*').eq('client_user_id', session.user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
    state.wedding = wedding || null;
    state.selectedWeddingId = wedding?.id || null;
    if(wedding) await loadWeddingData(wedding.id);
    else resetWeddingCollections();
  }
  state.loading=false;
  if(state.role==='admin' && (!location.hash || route()==='dashboard')) goto('admin');
  render();
}

async function loadAdminData(){
  const [{data:weddings,error:wErr},{data:clients,error:cErr}] = await Promise.all([
    sb.from('weddings').select('*').order('wedding_date',{ascending:true}),
    sb.from('profiles').select('id,full_name,role,email').eq('role','client').order('full_name',{ascending:true})
  ]);
  if(wErr) console.error(wErr); if(cErr) console.error(cErr);
  state.weddings = weddings || [];
  state.clients = clients || [];
  if(state.selectedWeddingId){
    const selected = state.weddings.find(w=>w.id===state.selectedWeddingId);
    if(selected){ state.wedding=selected; await loadWeddingData(selected.id); return; }
  }
  state.wedding=null; resetWeddingCollections();
}

function resetWeddingCollections(){ state.vendors=[]; state.tasks=[]; state.meetings=[]; state.docs=[]; state.payments=[]; }

async function loadWeddingData(weddingId){
  if(!weddingId){ resetWeddingCollections(); return; }
  const [{data:vendors},{data:tasks},{data:meetings},{data:docs},{data:payments}] = await Promise.all([
    sb.from('vendors').select('*').eq('wedding_id',weddingId).order('created_at',{ascending:true}),
    sb.from('tasks').select('*').eq('wedding_id',weddingId).order('due_date',{ascending:true}),
    sb.from('meetings').select('*').eq('wedding_id',weddingId).order('meeting_date',{ascending:true}),
    sb.from('documents').select('*').eq('wedding_id',weddingId).order('created_at',{ascending:false}),
    sb.from('payments').select('*').eq('wedding_id',weddingId).order('payment_date',{ascending:false})
  ]);
  state.vendors=(vendors||[]).map(v=>({
    id:v.id, category:v.category||'Fornecedor', name:v.name, status:v.status||'Pendente', phone:v.phone||'—', instagram:v.instagram||'—', site:v.website||'—', amount:Number(v.contract_value||0), paid:Number(v.paid_value||0), note:v.notes||'Sem observações.', contractDate:v.contract_date, dueDate:v.due_date
  }));
  state.tasks=(tasks||[]).map(t=>({id:t.id,title:t.title,due:t.due_date?dateBR(t.due_date):'Sem prazo',dueISO:t.due_date||'',assignee:t.responsible||'Assessoria',status:t.status||'Pendente',done:!!t.completed}));
  state.meetings=(meetings||[]).map(m=>({id:m.id,title:m.title,date:m.meeting_date,time:m.meeting_time,people:m.participants||'—',notes:m.notes||'',link:m.meeting_link||'',type:m.meeting_link?'Online':'Presencial'}));
  state.docs=(docs||[]).map(d=>({id:d.id,name:d.name,type:d.document_type||'Outro',date:d.created_at?dateBR(d.created_at.slice(0,10)):'—',path:d.file_path||''}));
  state.payments=payments||[];
}

function currentCouple(){ return state.wedding?.couple_name || 'Seu casamento'; }
function partnerNames(){
  if(state.wedding?.partner1_name || state.wedding?.partner2_name) return [state.wedding?.partner1_name,state.wedding?.partner2_name].filter(Boolean).join(' & ');
  return currentCouple();
}
function completion(){ return state.tasks.length ? Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100) : 0; }
function countdown(){
  if(!state.wedding?.wedding_date) return {days:0,months:0,hours:0,text:'Data a definir'};
  const d=new Date(`${state.wedding.wedding_date}T${state.wedding.wedding_time||'12:00:00'}`), now=new Date(), diff=d-now;
  if(diff<=0 && diff>-86400000) return {days:0,months:0,hours:0,text:'É HOJE! ♡'};
  if(diff<=0) return {days:0,months:0,hours:0,text:'O grande dia já aconteceu ♡'};
  const days=Math.floor(diff/86400000), months=Math.floor(days/30.44), hours=Math.floor((diff%86400000)/3600000);
  return {days,months,hours,text:null};
}

function render(){
  if(state.loading){ app.innerHTML=loadingView(); return; }
  if(!state.session){ app.innerHTML=loginView(); bindLogin(); return; }
  const r=route();
  if(state.role!=='admin' && r==='admin'){ goto('dashboard'); return; }
  app.innerHTML=shellView(r,viewFor(r)); bindGlobal(); bindView(r);
}

function loginView(){
  return `<main class="login-page">
    <section class="login-art" aria-hidden="true">
      <div class="botanical left"><div class="branch"></div><div class="leaf"></div><div class="leaf"></div><div class="leaf"></div><div class="leaf"></div></div>
      <div class="botanical right"><div class="branch"></div><div class="leaf"></div><div class="leaf"></div><div class="leaf"></div><div class="leaf"></div></div>
      <div class="login-brand-card"><img src="assets/logo-oficial.png" alt="Logo A Magia do Sim"><div class="rings"><div class="ring one"></div><div class="ring two"></div></div></div>
    </section>
    <section class="login-form-wrap">
      <form class="login-form" id="login-form">
        <div class="eyebrow">Área exclusiva dos noivos</div>
        <h1>Bem-vinda à sua jornada.</h1>
        <p>Seu casamento, organizado em um só lugar.</p>
        <div class="field"><label for="email">E-mail</label><div class="input-wrap"><span class="ico">✉</span><input class="input" id="email" type="email" autocomplete="email" placeholder="seu@email.com" required></div></div>
        <div class="field"><label for="password">Senha</label><div class="input-wrap"><span class="ico">⌑</span><input class="input" id="password" type="password" autocomplete="current-password" placeholder="Sua senha" required></div></div>
        <button class="login-btn" id="login-submit" type="submit">Entrar</button>
        <div id="login-error" class="small" style="color:#9e3d2f;min-height:18px;margin-top:8px"></div>
        <div class="login-meta"><button class="link-btn" type="button" id="forgot">Esqueci minha senha</button><button class="link-btn" type="button" id="admin-login">Acesso da assessora</button></div>
        <div class="demo-box">Acesso protegido pelo Supabase. Clientes entram apenas na própria área; a conta administradora acessa o painel de todos os casamentos.</div>
        <div class="brand-signoff">A Magia do Sim<br><span class="small">Onde os sonhos se tornam alianças.</span></div>
      </form>
    </section>
  </main>`;
}

function shellView(r,content){
  const active=r.startsWith('fornecedores/')?'fornecedores':r;
  const displayName=state.profile?.full_name || (state.role==='admin'?'Assessoria':'Cliente');
  const first=(displayName||'A').trim()[0]?.toUpperCase()||'A';
  const adminContext=state.role==='admin' && state.wedding ? `<span class="small muted">Gerenciando: <strong>${esc(currentCouple())}</strong></span>` : '';
  return `<div class="app-shell">
    <aside class="sidebar">
      <div class="sidebar-brand"><div class="sidebar-logo"><img src="assets/logo-oficial.png" alt="A Magia do Sim"></div><div class="sidebar-name">A Magia<br>do Sim</div></div>
      <nav class="nav">${navItems.map(([k,l,i])=>`<a href="#/${k}" class="nav-item ${active===k?'active':''}">${icons[i]}<span>${l}</span></a>`).join('')}</nav>
      <div class="sidebar-bottom">
        ${state.role==='admin'?`<a href="#/admin" class="nav-item ${active==='admin'?'active':''}">${icons.admin}<span>Painel admin</span></a>`:''}
        <a href="#/perfil" class="nav-item ${active==='perfil'?'active':''}">${icons.user}<span>Perfil</span></a>
        <button class="nav-item" id="logout" style="border:0;background:none;text-align:left;width:100%">${icons.logout}<span>Sair</span></button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <button class="icon-btn mobile-menu" id="mobile-menu" aria-label="Abrir menu">${icons.menu}</button>
        <div class="topbar-label small muted">Área dos Noivos — <strong>A Magia do Sim</strong> ${adminContext}</div>
        <div class="topbar-right"><button class="icon-btn" id="bell" aria-label="Notificações">${icons.bell}</button><div class="profile-chip"><div class="avatar">${first}</div><span class="small">${esc(displayName)}⌄</span></div></div>
      </header>
      ${content}
    </main>
    <nav class="mobile-nav">${[['dashboard','Início','home'],['fornecedores','Fornecedores','users'],['checklist','Checklist','check'],['cronograma','Cronograma','calendar'],['menu','Mais','menu']].map(([k,l,i])=>`<a href="${k==='menu'?'#':`#/${k}`}" data-mobile="${k}" class="${active===k?'active':''}">${icons[i]}<span>${l}</span></a>`).join('')}</nav>
  </div>`;
}

function noWeddingView(){
  const msg=state.role==='admin'?'Abra um casamento no Painel admin para gerenciar esta área.':'Sua conta ainda não foi vinculada a um casamento. Entre em contato com a assessoria.';
  return `<div class="page"><div class="page-head"><div><h1>Área dos Noivos</h1><p>${msg}</p></div>${state.role==='admin'?'<a class="btn-primary" href="#/admin">Ir para o painel</a>':''}</div>${emptyState('Nenhum casamento selecionado',msg)}</div>`;
}

function viewFor(r){
  if(r==='admin' && state.role==='admin') return adminView();
  if(r==='perfil') return profileView();
  if(!state.wedding) return noWeddingView();
  if(r==='dashboard') return dashboardView();
  if(r==='meu-casamento') return weddingView();
  if(r==='fornecedores') return vendorsView();
  if(r.startsWith('fornecedores/')) return vendorDetailView(r.split('/')[1]);
  if(r==='checklist') return checklistView();
  if(r==='cronograma') return timelineView();
  if(r==='documentos') return docsView();
  if(r==='financeiro') return financeView();
  if(r==='reunioes') return meetingsView();
  return dashboardView();
}

function dashboardView(){
  const c=countdown(), comp=completion();
  const next=state.tasks.filter(t=>!t.done).slice(0,3);
  const contracted=state.vendors.filter(v=>v.status==='Contratado').length;
  const negotiating=state.vendors.filter(v=>v.status==='Em negociação').length;
  const pending=state.vendors.filter(v=>v.status==='Pendente').length;
  const nextMeetings=state.meetings.slice(0,2);
  return `<div class="page">
    <section class="hero">
      <div class="card hero-main"><h1 class="hero-title">Olá, ${esc(partnerNames())}! ♡</h1><p class="hero-sub">Que bom ter você por aqui. Vamos juntos até o grande dia.</p><div class="date">${icons.calendar} ${esc(dateLong(state.wedding.wedding_date))}</div></div>
      <div class="card countdown">${c.text?`<div><span class="countdown-label">Contagem regressiva</span><div class="countdown-number" style="font-size:38px">${esc(c.text)}</div></div>`:`<div><span class="countdown-label">Faltam</span><div class="countdown-number">${c.days}</div><span class="countdown-unit">dias para o grande dia ♡</span></div><div class="countdown-mini"><div><strong>${c.months}</strong><span>meses</span></div><div><strong>${c.days}</strong><span>dias</span></div><div><strong>${c.hours}</strong><span>horas</span></div></div>`}</div>
    </section>
    <section class="dashboard-main">
      <div class="card card-pad"><div class="card-title"><h2>Seu planejamento</h2><span class="sub">${comp}% concluído</span></div><div class="progress-track"><div class="progress-fill" style="width:${comp}%"></div></div><div class="steps">${[['Local',!!state.wedding.venue],['Fotografia',state.vendors.some(v=>v.category==='Fotografia'&&v.status==='Contratado')],['Buffet',state.vendors.some(v=>v.category==='Buffet'&&v.status==='Contratado')],['Decoração',state.vendors.some(v=>v.category==='Decoração'&&v.status!=='Pendente')],['Música',state.vendors.some(v=>v.category==='Música'&&v.status==='Contratado')]].map(([t,done])=>`<div class="step ${done?'done':''}"><div class="step-dot">${done?'✓':'○'}</div>${t}</div>`).join('')}</div></div>
      <div class="card card-pad"><div class="card-title"><h2>Próximos passos</h2><a href="#/checklist" class="sub">Ver todos ›</a></div><div class="next-list">${next.length?next.map((t,i)=>`<a class="next-item" href="#/checklist"><div class="next-num">0${i+1}</div><div><strong>${esc(t.title)}</strong><span>Prazo: ${esc(t.due)}</span></div>${icons.chevron}</a>`).join(''):emptyState('Tudo em dia!','Nenhuma tarefa pendente no momento.')}</div></div>
    </section>
    <section class="summary-cards">
      <div class="card kpi-card"><div class="kpi-head">${icons.users} Fornecedores</div><div class="kpi-list"><div><strong>${contracted}</strong> contratados</div><div><strong>${negotiating}</strong> em negociação</div><div><strong>${pending}</strong> pendentes</div><a href="#/fornecedores" class="small" style="margin-top:9px;color:var(--brown)">Ver todos ›</a></div></div>
      <div class="card kpi-card"><div class="kpi-head">${icons.calendar} Próximos compromissos</div><div class="kpi-list">${nextMeetings.length?nextMeetings.map(m=>`<div><strong>${esc(m.title)}</strong><br>${dateBR(m.date)} às ${timeBR(m.time)}</div>`).join(''):'<div class="muted">Nenhuma reunião cadastrada.</div>'}<a href="#/reunioes" class="small" style="margin-top:9px;color:var(--brown)">Ver calendário ›</a></div></div>
      <div class="card kpi-card"><div class="kpi-head">${icons.check} Pendências <span class="badge danger">${state.tasks.filter(t=>!t.done).length}</span></div><div class="kpi-list">${state.tasks.filter(t=>!t.done).slice(0,3).map(t=>`<div>${esc(t.title)}</div>`).join('')||'<div class="muted">Nenhuma pendência.</div>'}<a href="#/checklist" class="small" style="margin-top:9px;color:var(--brown)">Ver todas ›</a></div></div>
      <div class="card inspiration"><blockquote>“Cada detalhe tem um propósito... e tudo se encaixa no tempo certo.” ♡</blockquote></div>
    </section>
  </div>`;
}

function weddingView(){
  const w=state.wedding;
  return `<div class="page"><div class="page-head"><div><h1>Meu casamento</h1><p>As principais informações do grande dia em um só lugar.</p></div><button class="btn-primary" id="edit-wedding">Editar informações</button></div>
  <div class="card detail-hero"><p class="small muted">CASAMENTO</p><h2 class="couple-name">${esc(w.couple_name)}</h2><div class="detail-grid">
    <div class="detail-box"><span>Data</span><strong>${esc(dateLong(w.wedding_date))}</strong></div><div class="detail-box"><span>Horário</span><strong>${esc(timeBR(w.wedding_time))}</strong></div><div class="detail-box"><span>Local</span><strong>${esc(w.venue||'A definir')}</strong></div><div class="detail-box"><span>Convidados</span><strong>${Number(w.guests||0)} pessoas</strong></div><div class="detail-box"><span>Tipo de cerimônia</span><strong>${esc(w.ceremony_type||'A definir')}</strong></div><div class="detail-box"><span>Recepção</span><strong>${esc(w.reception_type||'A definir')}</strong></div>
  </div></div></div>`;
}

function vendorsView(){
  const items=state.vendors.filter(v=>state.vendorFilter==='Todos'||v.status===state.vendorFilter);
  return `<div class="page"><div class="page-head"><div><h1>Fornecedores</h1><p>Acompanhe todos os fornecedores do seu casamento.</p></div><button class="btn-primary" id="new-vendor">+ Novo fornecedor</button></div>
  <div class="filters">${['Todos','Contratado','Em negociação','Pendente','Em andamento'].map(f=>`<button class="filter-btn ${state.vendorFilter===f?'active':''}" data-vendor-filter="${f}">${f}</button>`).join('')}</div>
  <div class="card list-card">${items.length?items.map(v=>`<a href="#/fornecedores/${v.id}" class="list-row vendor-row"><div class="thumb">${esc((v.category||'F')[0])}</div><div class="vendor-name"><strong>${esc(v.name)}</strong><span>${esc(v.category)}</span></div><div class="category">${esc(v.category)}</div><span class="badge ${statusClass(v.status)}">${esc(v.status)}</span>${icons.chevron}</a>`).join(''):emptyState('Ainda não há fornecedores neste filtro.','Adicione um fornecedor ou altere o filtro.')}</div></div>`;
}

function vendorDetailView(id){
  const v=state.vendors.find(x=>x.id===id); if(!v) return noWeddingView();
  const balance=v.amount-v.paid;
  return `<div class="page"><div class="page-head"><div><button class="link-btn" onclick="history.back()">← Voltar</button><h1 style="margin-top:8px">${esc(v.category)}</h1><p>${esc(v.name)}</p></div><span class="badge ${statusClass(v.status)}">${esc(v.status)}</span></div>
  <div class="supplier-detail">
    <div class="card card-pad"><div class="supplier-profile"><div class="supplier-big-avatar">${esc((v.category||'F')[0])}</div><div><h2 class="serif" style="margin:0;color:var(--brown);font-weight:500">${esc(v.name)}</h2><span class="small muted">${esc(v.category)}</span></div></div><div class="contact-list"><div class="contact-item">☎ ${esc(v.phone)}</div><div class="contact-item">◎ ${esc(v.instagram)}</div><div class="contact-item">⌁ ${esc(v.site)}</div></div><div class="action-row"><button class="btn-secondary" id="edit-vendor">Editar fornecedor</button><button class="btn-secondary" id="add-note">Adicionar observação</button></div><div class="notes"><strong style="color:var(--brown)">Observações</strong><br>${esc(v.note)}</div></div>
    <div class="card card-pad"><div class="card-title"><h2>Informações do contrato</h2></div><div class="contract-lines"><div class="contract-line"><span>Valor contratado</span><strong>${brl(v.amount)}</strong></div><div class="contract-line"><span>Valor pago</span><strong>${brl(v.paid)} (${pct(v.paid,v.amount)}%)</strong></div><div class="contract-line"><span>Saldo</span><strong>${brl(balance)}</strong></div><div class="contract-line"><span>Data de contratação</span><strong>${dateBR(v.contractDate)}</strong></div><div class="contract-line"><span>Data limite</span><strong>${dateBR(v.dueDate)}</strong></div></div><div class="action-row"><button class="btn-secondary" id="view-contract">Ver contrato</button><button class="btn-primary" id="register-payment" data-vendor="${v.id}">Registrar pagamento</button></div></div>
  </div></div>`;
}

function checklistView(){
  const items=state.tasks.filter(t=>state.taskFilter==='Todos'||(state.taskFilter==='Concluídos'?t.done:(state.taskFilter==='Pendentes'?(!t.done&&t.status==='Pendente'):t.status===state.taskFilter)));
  return `<div class="page"><div class="page-head"><div><h1>Checklist</h1><p>Confira o que já foi feito e o que ainda precisa ser realizado.</p></div><button class="btn-primary" id="new-task">+ Nova tarefa</button></div>
  <div class="filters">${['Todos','Pendentes','Em andamento','Concluídos'].map(f=>`<button class="filter-btn ${state.taskFilter===f?'active':''}" data-task-filter="${f}">${f}</button>`).join('')}</div>
  <div class="card list-card">${items.length?items.map(t=>`<div class="list-row task-row ${t.done?'task-done':''}"><button class="checkbox ${t.done?'checked':''}" data-toggle-task="${t.id}" aria-label="Marcar tarefa">${t.done?'✓':''}</button><div class="task-title"><strong>${esc(t.title)}</strong><span>Responsável: ${esc(t.assignee)}</span></div><div class="deadline small">${esc(t.due)}</div><div class="assignee small muted">${esc(t.assignee)}</div><span class="badge ${statusClass(t.done?'Concluído':t.status)}">${esc(t.done?'Concluído':t.status)}</span><button class="link-btn" data-edit-task="${t.id}">⋮</button></div>`).join(''):emptyState('Nenhuma tarefa encontrada.','Adicione uma nova tarefa para começar.')}</div></div>`;
}

function timelineView(){
  const events=[...state.tasks.filter(t=>t.dueISO).map(t=>({date:t.dueISO,title:t.title,meta:'Prazo',status:t.done?'Concluído':t.status})),...state.meetings.filter(m=>m.date).map(m=>({date:m.date,title:m.title,meta:timeBR(m.time),status:'Em andamento'}))].sort((a,b)=>a.date.localeCompare(b.date));
  return `<div class="page"><div class="page-head"><div><h1>Cronograma</h1><p>Acompanhe o planejamento do seu casamento por data.</p></div></div><div class="card card-pad"><div class="timeline-month">Próximos eventos</div><div class="timeline">${events.length?events.map(x=>{const [y,m,d]=x.date.split('-');const mon=['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][Number(m)-1];return `<div class="timeline-item"><div class="timeline-date"><strong>${d}</strong><span>${mon}</span></div><div class="timeline-text"><strong>${esc(x.title)}</strong><span>${esc(x.meta)}</span></div><span class="badge ${statusClass(x.status)}">${esc(x.status)}</span></div>`}).join(''):emptyState('Cronograma vazio','Adicione tarefas e reuniões para montar o cronograma.')}</div></div></div>`;
}

function docsView(){
  const items=state.docs.filter(d=>state.docFilter==='Todos'||d.type===state.docFilter);
  return `<div class="page"><div class="page-head"><div><h1>Documentos</h1><p>Acesse seus contratos, orçamentos e arquivos importantes.</p></div><button class="btn-primary" id="upload-doc">+ Cadastrar documento</button></div>
  <div class="filters">${['Todos','Contrato','Orçamento','Outro'].map(f=>`<button class="filter-btn ${state.docFilter===f?'active':''}" data-doc-filter="${f}">${f}</button>`).join('')}</div>
  <div class="card list-card">${items.length?items.map(d=>`<div class="list-row doc-row"><div class="doc-icon">${icons.file}</div><div class="vendor-name"><strong>${esc(d.name)}</strong><span>Arquivo do casamento</span></div><div class="doc-type small muted">${esc(d.type)}</div><div class="doc-date small muted">${esc(d.date)}</div><button class="btn-secondary" data-view-doc="${d.id}">Visualizar</button></div>`).join(''):emptyState('Ainda não há documentos.','Cadastre documentos do casamento aqui.')}</div></div>`;
}

function financeView(){
  const total=state.vendors.reduce((s,v)=>s+v.amount,0), paid=state.vendors.reduce((s,v)=>s+v.paid,0), balance=total-paid;
  return `<div class="page"><div class="page-head"><div><h1>Financeiro</h1><p>Acompanhe seus pagamentos de forma simples e tranquila.</p></div><button class="btn-primary" id="new-payment">Registrar pagamento</button></div>
  <div class="finance-totals"><div class="card money-card"><span>Valor total contratado</span><strong>${brl(total)}</strong></div><div class="card money-card"><span>Valor pago</span><strong>${brl(paid)}</strong></div><div class="card money-card"><span>Saldo restante</span><strong>${brl(balance)}</strong></div></div>
  <div class="card list-card">${state.vendors.length?state.vendors.map(v=>`<div class="list-row payment-row"><div class="vendor-name"><strong>${esc(v.category)}</strong><span>${esc(v.name)}</span></div><div class="small">${brl(v.amount)}</div><div class="paid small muted">${brl(v.paid)}</div><div class="balance small muted">${brl(v.amount-v.paid)}</div><div><div class="mini-progress"><div style="width:${pct(v.paid,v.amount)}%"></div></div><span class="tiny muted">${pct(v.paid,v.amount)}% pago</span></div></div>`).join(''):emptyState('Sem dados financeiros','Cadastre fornecedores e valores de contrato.')}</div></div>`;
}

function meetingsView(){
  return `<div class="page"><div class="page-head"><div><h1>Reuniões</h1><p>Organize seus próximos encontros e alinhamentos.</p></div><button class="btn-primary" id="new-meeting">+ Nova reunião</button></div><div class="meeting-grid">${state.meetings.length?state.meetings.map(m=>{const [y,mo,d]=(m.date||'---').split('-');const mon=mo?['JAN','FEV','MAR','ABR','MAI','JUN','JUL','AGO','SET','OUT','NOV','DEZ'][Number(mo)-1]:'—';return `<div class="card meeting-card"><div class="meeting-date"><div><strong>${d||'—'}</strong><span>${mon}</span></div></div><div class="meeting-info"><strong>${esc(m.title)}</strong><span>${timeBR(m.time)} • ${esc(m.type)}</span><span>${esc(m.people)}</span></div></div>`}).join(''):emptyState('Nenhuma reunião cadastrada','Adicione reuniões e compromissos do casamento.')}</div></div>`;
}

function profileView(){
  return `<div class="page"><div class="page-head"><div><h1>Perfil</h1><p>Seus dados e preferências de acesso.</p></div></div><div class="grid grid-2"><div class="card card-pad"><div class="card-title"><h2>Dados pessoais</h2></div><div class="field"><label>Nome</label><input class="input" style="padding-left:13px" id="profile-name" value="${esc(state.profile?.full_name||'')}"></div><div class="field"><label>E-mail</label><input class="input" style="padding-left:13px" value="${esc(state.user?.email||state.profile?.email||'')}" disabled></div><button class="btn-primary" id="save-profile">Salvar nome</button></div><div class="card card-pad"><div class="card-title"><h2>${state.role==='admin'?'Acesso administrativo':'Seu casamento'}</h2></div><div class="contract-lines"><div class="contract-line"><span>Perfil</span><strong>${state.role==='admin'?'Administrador':'Cliente'}</strong></div><div class="contract-line"><span>Casamento</span><strong>${esc(state.wedding?.couple_name||'Ainda não vinculado')}</strong></div><div class="contract-line"><span>Assessoria</span><strong>A Magia do Sim</strong></div></div></div></div></div>`;
}

function adminView(){
  const totalVendors=state.wedding?state.vendors.length:'—';
  return `<div class="page"><div class="card admin-banner"><h1>Olá, ${esc(state.profile?.full_name||'Assessoria')}.</h1><p>Gerencie os casamentos cadastrados na A Magia do Sim.</p></div>
  <div class="admin-kpis"><div class="card admin-kpi"><span>Casamentos ativos</span><strong>${state.weddings.length}</strong></div><div class="card admin-kpi"><span>Clientes cadastrados</span><strong>${state.clients.length}</strong></div><div class="card admin-kpi"><span>Fornecedor do casamento aberto</span><strong>${totalVendors}</strong></div><div class="card admin-kpi"><span>Casamento em edição</span><strong style="font-size:18px">${esc(state.wedding?.couple_name||'Nenhum')}</strong></div></div>
  <div class="grid grid-2"><div class="card card-pad"><div class="card-title"><h2>Casamentos</h2><button class="btn-primary" id="new-wedding">+ Criar casamento</button></div><div class="wedding-cards">${state.weddings.length?state.weddings.map(w=>`<div class="card wedding-card"><h3>${esc(w.couple_name)}</h3><p>${dateBR(w.wedding_date)} • ${esc(w.venue||'Local a definir')}</p><div class="action-row"><button class="btn-primary" data-open-wedding="${w.id}">Gerenciar</button><button class="btn-secondary" data-edit-admin-wedding="${w.id}">Editar</button></div></div>`).join(''):emptyState('Nenhum casamento cadastrado','Crie o primeiro casamento e vincule a um cliente.')}</div></div>
  <div class="card card-pad"><div class="card-title"><h2>Clientes disponíveis</h2></div><p class="small muted">Os usuários são criados em Supabase → Authentication → Users. Depois aparecem aqui para serem vinculados ao casamento.</p><div class="contract-lines">${state.clients.length?state.clients.map(c=>`<div class="contract-line"><span>${esc(c.full_name||'Cliente')}</span><strong>${esc(c.email||'e-mail não registrado')}</strong></div>`).join(''):'<div class="muted">Nenhum cliente cadastrado.</div>'}</div></div></div></div>`;
}

function modal(title,body,saveText='Salvar',onSave){
  const back=document.createElement('div'); back.className='modal-backdrop';
  back.innerHTML=`<div class="modal"><div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn modal-close">${icons.close}</button></div>${body}<div class="modal-actions"><button class="btn-secondary modal-close">Cancelar</button><button class="btn-primary modal-save">${esc(saveText)}</button></div></div>`;
  document.body.appendChild(back);
  back.querySelectorAll('.modal-close').forEach(b=>b.onclick=()=>back.remove());
  back.addEventListener('click',e=>{if(e.target===back)back.remove()});
  back.querySelector('.modal-save').onclick=async()=>{const btn=back.querySelector('.modal-save');btn.disabled=true;try{const ok=onSave?await onSave(back):true;if(ok!==false) back.remove();}finally{btn.disabled=false;}};
  return back;
}

function field(label,name,value='',type='text',extra=''){
  return `<div class="field"><label>${esc(label)}</label><input class="input" style="padding-left:13px" name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}
function selectField(label,name,options,value=''){
  return `<div class="field"><label>${esc(label)}</label><select class="input" style="padding-left:13px" name="${esc(name)}">${options.map(o=>{const val=typeof o==='string'?o:o.value;const lab=typeof o==='string'?o:o.label;return `<option value="${esc(val)}" ${String(val)===String(value)?'selected':''}>${esc(lab)}</option>`}).join('')}</select></div>`;
}

function bindLogin(){
  const form=document.getElementById('login-form');
  form.onsubmit=async e=>{
    e.preventDefault();
    const btn=document.getElementById('login-submit'), err=document.getElementById('login-error');
    btn.disabled=true; btn.textContent='Entrando...'; err.textContent='';
    const email=document.getElementById('email').value.trim(), password=document.getElementById('password').value;
    const {data,error}=await sb.auth.signInWithPassword({email,password});
    if(error){err.textContent='E-mail ou senha inválidos.';btn.disabled=false;btn.textContent='Entrar';return;}
    await hydrateSession(data.session); btn.disabled=false; btn.textContent='Entrar';
  };
  document.getElementById('admin-login').onclick=()=>{toast('A assessora entra pelo mesmo formulário usando o e-mail administrativo.');document.getElementById('email').focus();};
  document.getElementById('forgot').onclick=async()=>{
    const email=document.getElementById('email').value.trim();
    if(!email){toast('Digite seu e-mail primeiro.');return;}
    const redirectTo=location.origin+location.pathname;
    const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo});
    toast(error?'Não foi possível enviar o e-mail.':'Enviamos um link de recuperação para seu e-mail.');
  };
}

function bindGlobal(){
  const logout=document.getElementById('logout'); if(logout) logout.onclick=async()=>{await sb.auth.signOut();state.session=null;state.user=null;state.profile=null;state.wedding=null;resetWeddingCollections();location.hash='';render();};
  const bell=document.getElementById('bell'); if(bell) bell.onclick=()=>toast(`Você tem ${state.tasks.filter(t=>!t.done).length} pendência(s).`);
  document.querySelectorAll('[data-mobile="menu"]').forEach(a=>a.onclick=e=>{e.preventDefault();modal('Mais opções',`<div class="grid">${navItems.slice(4).map(([k,l])=>`<a class="btn-secondary" href="#/${k}" onclick="document.querySelector('.modal-backdrop')?.remove()">${l}</a>`).join('')}<a class="btn-secondary" href="#/perfil" onclick="document.querySelector('.modal-backdrop')?.remove()">Perfil</a>${state.role==='admin'?'<a class="btn-secondary" href="#/admin" onclick="document.querySelector(\'.modal-backdrop\')?.remove()">Painel admin</a>':''}</div>`,'Fechar',()=>true);});
}

async function refreshCurrentWedding(){
  if(state.role==='admin'){
    const {data:weddings}=await sb.from('weddings').select('*').order('wedding_date',{ascending:true}); state.weddings=weddings||[];
    if(state.selectedWeddingId){ state.wedding=state.weddings.find(w=>w.id===state.selectedWeddingId)||null; }
  }else{
    const {data:w}=await sb.from('weddings').select('*').eq('client_user_id',state.user.id).limit(1).maybeSingle(); state.wedding=w||null; state.selectedWeddingId=w?.id||null;
  }
  if(state.wedding) await loadWeddingData(state.wedding.id); else resetWeddingCollections();
}

function bindView(r){
  document.querySelectorAll('[data-vendor-filter]').forEach(b=>b.onclick=()=>{state.vendorFilter=b.dataset.vendorFilter;render();});
  document.querySelectorAll('[data-task-filter]').forEach(b=>b.onclick=()=>{state.taskFilter=b.dataset.taskFilter;render();});
  document.querySelectorAll('[data-doc-filter]').forEach(b=>b.onclick=()=>{state.docFilter=b.dataset.docFilter;render();});

  document.querySelectorAll('[data-open-wedding]').forEach(b=>b.onclick=async()=>{state.selectedWeddingId=b.dataset.openWedding;state.wedding=state.weddings.find(w=>w.id===state.selectedWeddingId)||null;if(state.wedding)await loadWeddingData(state.wedding.id);goto('dashboard');render();});
  document.querySelectorAll('[data-edit-admin-wedding]').forEach(b=>b.onclick=()=>openWeddingEditor(state.weddings.find(w=>w.id===b.dataset.editAdminWedding)));

  document.querySelectorAll('[data-toggle-task]').forEach(b=>b.onclick=async()=>{
    const t=state.tasks.find(x=>x.id===b.dataset.toggleTask); if(!t)return;
    const done=!t.done; const {error}=await sb.from('tasks').update({completed:done,status:done?'Concluído':'Pendente'}).eq('id',t.id);
    if(error){toast('Não foi possível atualizar a tarefa.');return;} await loadWeddingData(state.wedding.id);toast(done?'Tarefa concluída!':'Tarefa reaberta.');render();
  });
  document.querySelectorAll('[data-edit-task]').forEach(b=>b.onclick=()=>openTaskEditor(state.tasks.find(x=>x.id===b.dataset.editTask)));
  document.querySelectorAll('[data-view-doc]').forEach(b=>b.onclick=()=>{const d=state.docs.find(x=>x.id===b.dataset.viewDoc); if(d?.path) window.open(d.path,'_blank','noopener'); else toast('Este documento ainda não possui arquivo vinculado.');});

  const nw=document.getElementById('new-wedding'); if(nw) nw.onclick=()=>openWeddingEditor(null);
  const nv=document.getElementById('new-vendor'); if(nv) nv.onclick=()=>openVendorEditor(null);
  const nt=document.getElementById('new-task'); if(nt) nt.onclick=()=>openTaskEditor(null);
  const nm=document.getElementById('new-meeting'); if(nm) nm.onclick=()=>openMeetingEditor();
  const ud=document.getElementById('upload-doc'); if(ud) ud.onclick=()=>openDocumentEditor();
  const ep=document.getElementById('edit-wedding'); if(ep) ep.onclick=()=>openWeddingEditor(state.wedding);
  const ew=document.getElementById('edit-vendor'); if(ew){const id=route().split('/')[1];ew.onclick=()=>openVendorEditor(state.vendors.find(v=>v.id===id));}
  const an=document.getElementById('add-note'); if(an){const id=route().split('/')[1];an.onclick=()=>openNoteEditor(state.vendors.find(v=>v.id===id));}
  const vc=document.getElementById('view-contract'); if(vc) vc.onclick=()=>toast('Vincule o contrato em Documentos. O upload de arquivos será habilitado com Supabase Storage.');
  const rp=document.getElementById('register-payment'); if(rp) rp.onclick=()=>openPaymentEditor(rp.dataset.vendor||null);
  const np=document.getElementById('new-payment'); if(np) np.onclick=()=>openPaymentEditor(null);
  const sp=document.getElementById('save-profile'); if(sp) sp.onclick=saveProfile;
}

function openWeddingEditor(w){
  const isNew=!w;
  const clientOptions=[{value:'',label:'Selecione um cliente'}].concat(state.clients.map(c=>({value:c.id,label:`${c.full_name||'Cliente'} — ${c.email||''}`})));
  const body=(state.role==='admin'?selectField('Cliente vinculado','client_user_id',clientOptions,w?.client_user_id||''):'')+
    field('Nome dos noivos','couple_name',w?.couple_name||'')+field('Nome 1','partner1_name',w?.partner1_name||'')+field('Nome 2','partner2_name',w?.partner2_name||'')+
    field('Data','wedding_date',w?.wedding_date||'','date')+field('Horário','wedding_time',(w?.wedding_time||'').slice(0,5),'time')+field('Local','venue',w?.venue||'')+
    field('Número de convidados','guests',w?.guests||0,'number')+field('Tipo de cerimônia','ceremony_type',w?.ceremony_type||'')+field('Tipo de recepção','reception_type',w?.reception_type||'');
  modal(isNew?'Criar casamento':'Editar casamento',body,isNew?'Criar':'Salvar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    const payload={couple_name:f.couple_name,partner1_name:f.partner1_name||null,partner2_name:f.partner2_name||null,wedding_date:f.wedding_date||null,wedding_time:f.wedding_time||null,venue:f.venue||null,guests:Number(f.guests||0),ceremony_type:f.ceremony_type||null,reception_type:f.reception_type||null,updated_at:new Date().toISOString()};
    if(state.role==='admin') payload.client_user_id=f.client_user_id||null;
    if(!payload.couple_name){toast('Informe o nome dos noivos.');return false;}
    const res=isNew?await sb.from('weddings').insert(payload).select().single():await sb.from('weddings').update(payload).eq('id',w.id).select().single();
    if(res.error){console.error(res.error);toast('Não foi possível salvar o casamento.');return false;}
    state.selectedWeddingId=res.data.id; await loadAdminData(); if(state.role!=='admin') await refreshCurrentWedding(); toast('Casamento salvo.'); render(); return true;
  });
}

function openVendorEditor(v){
  const body=field('Categoria','category',v?.category||'')+field('Nome do fornecedor','name',v?.name||'')+selectField('Status','status',['Pendente','Em negociação','Em andamento','Contratado'],v?.status||'Pendente')+
    field('Telefone','phone',v?.phone==='—'?'':v?.phone||'')+field('Instagram','instagram',v?.instagram==='—'?'':v?.instagram||'')+field('Site','website',v?.site==='—'?'':v?.site||'')+
    field('Valor contratado','contract_value',v?.amount||0,'number','step="0.01"')+field('Valor pago','paid_value',v?.paid||0,'number','step="0.01"')+field('Data da contratação','contract_date',v?.contractDate||'','date')+field('Data limite','due_date',v?.dueDate||'','date');
  modal(v?'Editar fornecedor':'Novo fornecedor',body,v?'Salvar':'Adicionar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    const payload={wedding_id:state.wedding.id,category:f.category,name:f.name,status:f.status,phone:f.phone||null,instagram:f.instagram||null,website:f.website||null,contract_value:Number(f.contract_value||0),paid_value:Number(f.paid_value||0),contract_date:f.contract_date||null,due_date:f.due_date||null};
    if(!payload.name){toast('Informe o nome do fornecedor.');return false;}
    const res=v?await sb.from('vendors').update(payload).eq('id',v.id):await sb.from('vendors').insert(payload);
    if(res.error){console.error(res.error);toast('Não foi possível salvar o fornecedor.');return false;} await loadWeddingData(state.wedding.id);toast('Fornecedor salvo.');render();return true;
  });
}

function openNoteEditor(v){
  if(!v)return;
  modal('Adicionar observação',`<div class="field"><label>Observação</label><textarea class="input" style="padding:13px;min-height:120px" name="notes">${esc(v.note==='Sem observações.'?'':v.note)}</textarea></div>`,'Salvar',async back=>{
    const notes=back.querySelector('[name=notes]').value; const {error}=await sb.from('vendors').update({notes}).eq('id',v.id); if(error){toast('Erro ao salvar observação.');return false;}await loadWeddingData(state.wedding.id);toast('Observação atualizada.');render();return true;
  });
}

function openTaskEditor(t){
  const body=field('Título','title',t?.title||'')+field('Prazo','due_date',t?.dueISO||'','date')+field('Responsável','responsible',t?.assignee||'')+selectField('Status','status',['Pendente','Em andamento','Concluído'],t?.done?'Concluído':t?.status||'Pendente');
  modal(t?'Editar tarefa':'Nova tarefa',body,t?'Salvar':'Adicionar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries()); const payload={wedding_id:state.wedding.id,title:f.title,due_date:f.due_date||null,responsible:f.responsible||null,status:f.status,completed:f.status==='Concluído'};
    if(!payload.title){toast('Informe o título da tarefa.');return false;} const res=t?await sb.from('tasks').update(payload).eq('id',t.id):await sb.from('tasks').insert(payload); if(res.error){console.error(res.error);toast('Não foi possível salvar a tarefa.');return false;}await loadWeddingData(state.wedding.id);toast('Tarefa salva.');render();return true;
  });
}

function openMeetingEditor(){
  const body=field('Título','title','')+field('Data','meeting_date','','date')+field('Hora','meeting_time','','time')+field('Participantes','participants','')+field('Link da reunião','meeting_link','');
  modal('Nova reunião',body,'Criar reunião',async back=>{const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());const {error}=await sb.from('meetings').insert({wedding_id:state.wedding.id,title:f.title,meeting_date:f.meeting_date||null,meeting_time:f.meeting_time||null,participants:f.participants||null,meeting_link:f.meeting_link||null});if(error){console.error(error);toast('Não foi possível criar a reunião.');return false;}await loadWeddingData(state.wedding.id);toast('Reunião criada.');render();return true;});
}

function openDocumentEditor(){
  const body=field('Nome do documento','name','')+selectField('Tipo','document_type',['Contrato','Orçamento','Outro'],'Outro')+field('Link do arquivo (opcional)','file_path','', 'url');
  modal('Cadastrar documento',body,'Salvar',async back=>{const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());const {error}=await sb.from('documents').insert({wedding_id:state.wedding.id,name:f.name,document_type:f.document_type,file_path:f.file_path||null});if(error){console.error(error);toast('Não foi possível cadastrar o documento.');return false;}await loadWeddingData(state.wedding.id);toast('Documento cadastrado.');render();return true;});
}

function openPaymentEditor(vendorId){
  const options=[{value:'',label:'Selecione o fornecedor'}].concat(state.vendors.map(v=>({value:v.id,label:`${v.category} — ${v.name}`})));
  const body=selectField('Fornecedor','vendor_id',options,vendorId||'')+field('Descrição','description','Pagamento')+field('Valor','amount','','number','step="0.01"')+field('Data','payment_date','','date')+selectField('Status','status',['Pago','Pendente'],'Pago');
  modal('Registrar pagamento',body,'Registrar',async back=>{const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());const amount=Number(f.amount||0);if(!f.vendor_id||amount<=0){toast('Selecione o fornecedor e informe o valor.');return false;}const {error}=await sb.from('payments').insert({wedding_id:state.wedding.id,vendor_id:f.vendor_id,description:f.description||null,amount,payment_date:f.payment_date||null,status:f.status});if(error){console.error(error);toast('Não foi possível registrar o pagamento.');return false;}const v=state.vendors.find(x=>x.id===f.vendor_id);if(v&&f.status==='Pago')await sb.from('vendors').update({paid_value:Number(v.paid||0)+amount}).eq('id',v.id);await loadWeddingData(state.wedding.id);toast('Pagamento registrado.');render();return true;});
}

async function saveProfile(){
  const name=document.getElementById('profile-name').value.trim(); if(!name)return;
  const {error}=await sb.from('profiles').update({full_name:name}).eq('id',state.user.id);
  if(error){toast('Seu banco ainda não permite editar o perfil.');return;}state.profile.full_name=name;toast('Nome atualizado.');render();
}

sb.auth.onAuthStateChange((event,session)=>{
  if(event==='SIGNED_OUT'){state.session=null;state.user=null;state.profile=null;state.wedding=null;state.loading=false;render();}
  if(event==='PASSWORD_RECOVERY' && session){
    setTimeout(()=>modal('Criar nova senha',field('Nova senha','password','','password','minlength="6"'),'Atualizar',async back=>{const password=back.querySelector('[name=password]').value;if(password.length<6){toast('Use pelo menos 6 caracteres.');return false;}const {error}=await sb.auth.updateUser({password});if(error){toast('Não foi possível atualizar a senha.');return false;}toast('Senha atualizada com sucesso.');return true;}),50);
  }
});

window.addEventListener('hashchange',render);
bootstrap();
