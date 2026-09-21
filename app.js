const A = {
  wedding: {
    couple: 'Ana & Lucas',
    date: '2027-05-15T16:30:00-03:00',
    place: 'Espaço Jardim Secreto',
    guests: 150,
    ceremony: 'Cerimônia religiosa',
    reception: 'Recepção elegante',
    time: '16h30'
  },
  vendors: [
    {id:'espaco', category:'Espaço', name:'Casa de Festas Jardim Secreto', status:'Contratado', amount:15000, paid:10000, phone:'(21) 99845-2100', instagram:'@jardimsecreto', site:'www.jardimsecreto.com.br', note:'Visita técnica concluída. Layout do salão aprovado.'},
    {id:'buffet', category:'Buffet', name:'Sabor & Arte Gastronomia', status:'Contratado', amount:26000, paid:13000, phone:'(21) 99211-7830', instagram:'@saborearte', site:'www.saborearte.com.br', note:'Degustação realizada. Cardápio final será revisado em novembro.'},
    {id:'decoracao', category:'Decoração', name:'Flores & Encantos', status:'Em andamento', amount:8000, paid:4000, phone:'(21) 99115-2341', instagram:'@floreseencantos', site:'www.floreseencantos.com.br', note:'Aguardando aprovação final da paleta e das flores da cerimônia.'},
    {id:'fotografia', category:'Fotografia', name:'Luz e Vida Fotografia', status:'Contratado', amount:5000, paid:2500, phone:'(11) 98765-4321', instagram:'@luz_e_vida_fotografia', site:'www.luzevida.com.br', note:'Responsável: João. Já fizemos o briefing inicial e será feito o pré-wedding.'},
    {id:'filmagem', category:'Filmagem', name:'Memórias Filmes', status:'Em negociação', amount:4500, paid:0, phone:'(21) 99045-8420', instagram:'@memoriasfilmes', site:'www.memoriasfilmes.com.br', note:'Proposta recebida. Aguardando ajustes no pacote.'},
    {id:'musica', category:'Música', name:'Sonorizze Eventos', status:'Pendente', amount:3500, paid:0, phone:'(21) 98847-5201', instagram:'@sonorizze', site:'www.sonorizze.com.br', note:'Ainda falta confirmar repertório e formação da cerimônia.'},
    {id:'bolo', category:'Bolo e Doces', name:'Doce Encanto', status:'Contratado', amount:6000, paid:3500, phone:'(21) 99555-4488', instagram:'@doceencanto', site:'www.doceencanto.com.br', note:'Mesa de doces definida. Falta confirmar sabor do bolo.'},
    {id:'convites', category:'Convites', name:'Ateliê Papel e Amor', status:'Em andamento', amount:2500, paid:1500, phone:'(21) 99632-1277', instagram:'@papeleamor', site:'www.papeleamor.com.br', note:'Prova digital enviada para revisão dos noivos.'}
  ],
  tasks: [
    {id:1,title:'Aprovar decoração',due:'05/10/2026',assignee:'Ana',status:'Pendente',done:false},
    {id:2,title:'Enviar lista de convidados',due:'10/10/2026',assignee:'Ana & Lucas',status:'Pendente',done:false},
    {id:3,title:'Reunião com fotógrafo',due:'12/10/2026',assignee:'Assessoria',status:'Em andamento',done:false},
    {id:4,title:'Definir músicas da cerimônia',due:'15/10/2026',assignee:'Lucas',status:'Pendente',done:false},
    {id:5,title:'Prova do vestido',due:'20/10/2026',assignee:'Ana',status:'Em andamento',done:false},
    {id:6,title:'Escolher local',due:'15/06/2026',assignee:'Ana & Lucas',status:'Concluído',done:true},
    {id:7,title:'Contratar fotografia',due:'20/07/2026',assignee:'Assessoria',status:'Concluído',done:true},
    {id:8,title:'Contratar buffet',due:'08/08/2026',assignee:'Assessoria',status:'Concluído',done:true}
  ],
  meetings: [
    {day:'12',month:'OUT',time:'19h',title:'Reunião com fotógrafo',people:'Ana, Lucas e João',type:'Presencial'},
    {day:'20',month:'OUT',time:'14h',title:'Prova do vestido',people:'Ana e assessora',type:'Ateliê'},
    {day:'02',month:'NOV',time:'18h30',title:'Alinhamento da decoração',people:'Ana, Lucas e Flores & Encantos',type:'Online'},
    {day:'18',month:'NOV',time:'19h',title:'Degustação final do buffet',people:'Ana e Lucas',type:'Presencial'}
  ],
  docs: [
    {name:'Contrato — Espaço',type:'Contrato',date:'18/06/2026'},
    {name:'Contrato — Fotografia',type:'Contrato',date:'02/08/2026'},
    {name:'Contrato — Decoração',type:'Contrato',date:'28/08/2026'},
    {name:'Orçamento — Decoração',type:'Orçamento',date:'20/08/2026'},
    {name:'Lista de convidados',type:'Outro',date:'14/09/2026'},
    {name:'Briefing do casamento',type:'Outro',date:'10/09/2026'}
  ]
};

const state = {
  logged: localStorage.getItem('magiaLogged') === '1',
  role: localStorage.getItem('magiaRole') || 'client',
  vendorFilter: 'Todos',
  taskFilter: 'Todos',
  docFilter: 'Todos',
  tasks: JSON.parse(localStorage.getItem('magiaTasks') || 'null') || A.tasks,
  menuOpen: false
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
  plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  admin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
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

function statusClass(status){
  if(status==='Contratado'||status==='Concluído') return 'success';
  if(status==='Em andamento') return 'warning';
  if(status==='Em negociação') return 'info';
  return 'danger';
}
function brl(n){ return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0}); }
function pct(v,t){ return Math.round((v/t)*100); }
function route(){ return (location.hash || '#/dashboard').replace('#/','').split('?')[0]; }
function goto(r){ location.hash = '#/' + r; }
function toast(text){
  const el=document.createElement('div'); el.className='toast'; el.textContent=text;
  document.getElementById('toast-root').appendChild(el);
  setTimeout(()=>el.remove(),2600);
}
function saveTasks(){ localStorage.setItem('magiaTasks',JSON.stringify(state.tasks)); }

function render(){
  if(!state.logged){ app.innerHTML=loginView(); bindLogin(); return; }
  const r=route();
  app.innerHTML = shellView(r, viewFor(r));
  bindGlobal();
  bindView(r);
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
        <div class="field"><label for="email">E-mail</label><div class="input-wrap"><span class="ico">✉</span><input class="input" id="email" type="email" value="ana@exemplo.com" required></div></div>
        <div class="field"><label for="password">Senha</label><div class="input-wrap"><span class="ico">⌑</span><input class="input" id="password" type="password" value="123456" required></div></div>
        <button class="login-btn" type="submit">Entrar</button>
        <div class="login-meta"><button class="link-btn" type="button" id="forgot">Esqueci minha senha</button><button class="link-btn" type="button" id="admin-login">Entrar como assessora</button></div>
        <div class="demo-box">Demonstração pronta: qualquer e-mail e senha válidos liberam a área dos noivos. Use “Entrar como assessora” para visualizar o painel administrativo.</div>
        <div class="brand-signoff">A Magia do Sim<br><span class="small">Onde os sonhos se tornam alianças.</span></div>
      </form>
    </section>
  </main>`;
}

function shellView(r,content){
  const active = r.startsWith('fornecedores/') ? 'fornecedores' : r;
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
        <div class="topbar-label small muted">Área dos Noivos — <strong>A Magia do Sim</strong></div>
        <div class="topbar-right"><button class="icon-btn" id="bell" aria-label="Notificações">${icons.bell}</button><div class="profile-chip"><div class="avatar">A</div><span class="small">${state.role==='admin'?'Bruna':'Ana'}⌄</span></div></div>
      </header>
      ${content}
    </main>
    <nav class="mobile-nav">
      ${[['dashboard','Início','home'],['fornecedores','Fornecedores','users'],['checklist','Checklist','check'],['cronograma','Cronograma','calendar'],['menu','Mais','menu']].map(([k,l,i])=>`<a href="${k==='menu'?'#':`#/${k}`}" data-mobile="${k}" class="${active===k?'active':''}">${icons[i]}<span>${l}</span></a>`).join('')}
    </nav>
  </div>`;
}

function viewFor(r){
  if(r==='dashboard') return dashboardView();
  if(r==='meu-casamento') return weddingView();
  if(r==='fornecedores') return vendorsView();
  if(r.startsWith('fornecedores/')) return vendorDetailView(r.split('/')[1]);
  if(r==='checklist') return checklistView();
  if(r==='cronograma') return timelineView();
  if(r==='documentos') return docsView();
  if(r==='financeiro') return financeView();
  if(r==='reunioes') return meetingsView();
  if(r==='perfil') return profileView();
  if(r==='admin' && state.role==='admin') return adminView();
  return dashboardView();
}

function countdown(){
  const d=new Date(A.wedding.date), now=new Date(), diff=d-now;
  if(diff<=0) return {days:0,months:0,hours:0, text:'É HOJE! ♡'};
  const days=Math.floor(diff/86400000), months=Math.floor(days/30.44), hours=Math.floor((diff%86400000)/3600000);
  return {days,months,hours,text:null};
}
function completion(){ return Math.round(state.tasks.filter(t=>t.done).length/state.tasks.length*100); }

function dashboardView(){
  const c=countdown(), comp=completion();
  const next=state.tasks.filter(t=>!t.done).slice(0,3);
  const contracted=A.vendors.filter(v=>v.status==='Contratado').length;
  const negotiating=A.vendors.filter(v=>v.status==='Em negociação').length;
  const pending=A.vendors.filter(v=>v.status==='Pendente').length;
  return `<div class="page">
    <section class="hero">
      <div class="card hero-main"><h1 class="hero-title">Olá, Ana & Lucas! ♡</h1><p class="hero-sub">Que bom ter você por aqui. Vamos juntos até o grande dia.</p><div class="date">${icons.calendar} 15 de maio de 2027</div></div>
      <div class="card countdown">${c.text?`<div><span class="countdown-label">O grande dia chegou</span><div class="countdown-number" style="font-size:38px">${c.text}</div></div>`:`<div><span class="countdown-label">Faltam</span><div class="countdown-number">${c.days}</div><span class="countdown-unit">dias para o grande dia ♡</span></div><div class="countdown-mini"><div><strong>${c.months}</strong><span>meses</span></div><div><strong>${c.days}</strong><span>dias</span></div><div><strong>${c.hours}</strong><span>horas</span></div></div>`}</div>
    </section>
    <section class="dashboard-main">
      <div class="card card-pad">
        <div class="card-title"><h2>Seu planejamento</h2><span class="sub">${comp}% concluído</span></div>
        <div class="progress-track"><div class="progress-fill" style="width:${comp}%"></div></div>
        <div class="steps">${[['Local','done'],['Fotografia','done'],['Buffet','done'],['Decoração','current'],['Música','']].map(([t,s])=>`<div class="step ${s}"><div class="step-dot">${s==='done'?'✓':s==='current'?'◐':'○'}</div>${t}</div>`).join('')}</div>
      </div>
      <div class="card card-pad"><div class="card-title"><h2>Próximos passos</h2><a href="#/checklist" class="sub">Ver todos ›</a></div><div class="next-list">${next.map((t,i)=>`<a class="next-item" href="#/checklist"><div class="next-num">0${i+1}</div><div><strong>${t.title}</strong><span>Prazo: ${t.due}</span></div>${icons.chevron}</a>`).join('')}</div></div>
    </section>
    <section class="summary-cards">
      <div class="card kpi-card"><div class="kpi-head">${icons.users} Fornecedores</div><div class="kpi-list"><div><strong>${contracted}</strong> contratados</div><div><strong>${negotiating}</strong> em negociação</div><div><strong>${pending}</strong> pendentes</div><a href="#/fornecedores" class="small" style="margin-top:9px;color:var(--brown)">Ver todos ›</a></div></div>
      <div class="card kpi-card"><div class="kpi-head">${icons.calendar} Próximos compromissos</div><div class="kpi-list"><div><strong>Reunião com fotógrafo</strong><br>12/10 às 19h</div><div><strong>Prova do vestido</strong><br>20/10 às 14h</div><a href="#/reunioes" class="small" style="margin-top:9px;color:var(--brown)">Ver calendário ›</a></div></div>
      <div class="card kpi-card"><div class="kpi-head">${icons.check} Pendências <span class="badge danger">${state.tasks.filter(t=>!t.done).length}</span></div><div class="kpi-list">${state.tasks.filter(t=>!t.done).slice(0,3).map(t=>`<div>${t.title}</div>`).join('')}<a href="#/checklist" class="small" style="margin-top:9px;color:var(--brown)">Ver todas ›</a></div></div>
      <div class="card inspiration"><blockquote>“Cada detalhe tem um propósito... e tudo se encaixa no tempo certo.” ♡</blockquote></div>
    </section>
  </div>`;
}

function weddingView(){
  return `<div class="page"><div class="page-head"><div><h1>Meu casamento</h1><p>As principais informações do grande dia em um só lugar.</p></div><button class="btn-primary" id="edit-wedding">Editar informações</button></div>
  <div class="card detail-hero"><p class="small muted">CASAMENTO</p><h2 class="couple-name">${A.wedding.couple}</h2><div class="detail-grid">
    <div class="detail-box"><span>Data</span><strong>15 de maio de 2027</strong></div><div class="detail-box"><span>Horário</span><strong>${A.wedding.time}</strong></div><div class="detail-box"><span>Local</span><strong>${A.wedding.place}</strong></div><div class="detail-box"><span>Convidados</span><strong>${A.wedding.guests} pessoas</strong></div><div class="detail-box"><span>Tipo de cerimônia</span><strong>${A.wedding.ceremony}</strong></div><div class="detail-box"><span>Recepção</span><strong>${A.wedding.reception}</strong></div>
  </div></div></div>`;
}

function vendorsView(){
  const items=A.vendors.filter(v=>state.vendorFilter==='Todos'||v.status===state.vendorFilter);
  return `<div class="page"><div class="page-head"><div><h1>Fornecedores</h1><p>Acompanhe todos os fornecedores do seu casamento.</p></div><button class="btn-primary" id="new-vendor">+ Novo fornecedor</button></div>
  <div class="filters">${['Todos','Contratado','Em negociação','Pendente','Em andamento'].map(f=>`<button class="filter-btn ${state.vendorFilter===f?'active':''}" data-vendor-filter="${f}">${f}</button>`).join('')}</div>
  <div class="card list-card">${items.map(v=>`<a href="#/fornecedores/${v.id}" class="list-row vendor-row"><div class="thumb">${v.category[0]}</div><div class="vendor-name"><strong>${v.name}</strong><span>${v.category}</span></div><div class="category">${v.category}</div><span class="badge ${statusClass(v.status)}">${v.status}</span>${icons.chevron}</a>`).join('')||emptyState('Ainda não há fornecedores neste filtro.','Altere o filtro para visualizar outros fornecedores.')}</div></div>`;
}
function vendorDetailView(id){
  const v=A.vendors.find(x=>x.id===id) || A.vendors[3];
  const balance=v.amount-v.paid;
  return `<div class="page"><div class="page-head"><div><button class="link-btn" onclick="history.back()">← Voltar</button><h1 style="margin-top:8px">${v.category}</h1><p>${v.name}</p></div><span class="badge ${statusClass(v.status)}">${v.status}</span></div>
  <div class="supplier-detail">
    <div class="card card-pad"><div class="supplier-profile"><div class="supplier-big-avatar">${v.category[0]}</div><div><h2 class="serif" style="margin:0;color:var(--brown);font-weight:500">${v.name}</h2><span class="small muted">${v.category}</span></div></div><div class="contact-list"><div class="contact-item">☎ ${v.phone}</div><div class="contact-item">◎ ${v.instagram}</div><div class="contact-item">⌁ ${v.site}</div></div><div class="action-row"><button class="btn-secondary" id="edit-vendor">Editar fornecedor</button><button class="btn-secondary" id="add-note">Adicionar observação</button></div><div class="notes"><strong style="color:var(--brown)">Observações</strong><br>${v.note}</div></div>
    <div class="card card-pad"><div class="card-title"><h2>Informações do contrato</h2></div><div class="contract-lines"><div class="contract-line"><span>Valor contratado</span><strong>${brl(v.amount)}</strong></div><div class="contract-line"><span>Valor pago</span><strong>${brl(v.paid)} (${pct(v.paid,v.amount)}%)</strong></div><div class="contract-line"><span>Saldo</span><strong>${brl(balance)}</strong></div><div class="contract-line"><span>Data de contratação</span><strong>10/08/2026</strong></div><div class="contract-line"><span>Data limite</span><strong>10/05/2027</strong></div></div><div class="action-row"><button class="btn-secondary" id="view-contract">Ver contrato</button><button class="btn-primary" id="register-payment">Registrar pagamento</button></div></div>
  </div></div>`;
}

function checklistView(){
  const items=state.tasks.filter(t=> state.taskFilter==='Todos' || (state.taskFilter==='Concluídos'?t.done:t.status===state.taskFilter));
  return `<div class="page"><div class="page-head"><div><h1>Checklist</h1><p>Confira o que já foi feito e o que ainda precisa ser realizado.</p></div><button class="btn-primary" id="new-task">+ Nova tarefa</button></div>
  <div class="filters">${['Todos','Pendentes','Em andamento','Concluídos'].map(f=>`<button class="filter-btn ${state.taskFilter===f?'active':''}" data-task-filter="${f}">${f}</button>`).join('')}</div>
  <div class="card list-card">${items.map(t=>`<div class="list-row task-row ${t.done?'task-done':''}"><button class="checkbox ${t.done?'checked':''}" data-toggle-task="${t.id}" aria-label="Marcar tarefa">${t.done?'✓':''}</button><div class="task-title"><strong>${t.title}</strong><span>Responsável: ${t.assignee}</span></div><div class="deadline small">${t.due}</div><div class="assignee small muted">${t.assignee}</div><span class="badge ${statusClass(t.done?'Concluído':t.status)}">${t.done?'Concluído':t.status}</span><button class="link-btn" data-edit-task="${t.id}">⋮</button></div>`).join('')||emptyState('Nenhuma tarefa encontrada.','Adicione uma nova tarefa para começar.')}</div></div>`;
}

function timelineView(){
  const items=[
    ['05','OUT','Aprovar decoração','Prazo final','Pendente'],['10','OUT','Enviar lista de convidados','Prazo final','Pendente'],['12','OUT','Reunião com fotógrafo','19h','Em andamento'],['15','OUT','Definir músicas da cerimônia','Prazo final','Pendente'],['20','OUT','Prova do vestido','14h','Em andamento'],['02','NOV','Alinhamento da decoração','18h30','Em andamento'],['18','NOV','Degustação final do buffet','19h','Pendente']
  ];
  return `<div class="page"><div class="page-head"><div><h1>Cronograma</h1><p>Acompanhe o planejamento do seu casamento por data.</p></div><button class="btn-primary" id="new-event">+ Novo evento</button></div>
  <div class="card card-pad"><div class="timeline-month">Outubro e novembro de 2026</div><div class="timeline">${items.map(x=>`<div class="timeline-item"><div class="timeline-date"><strong>${x[0]}</strong><span>${x[1]}</span></div><div class="timeline-text"><strong>${x[2]}</strong><span>${x[3]}</span></div><span class="badge ${statusClass(x[4])}">${x[4]}</span></div>`).join('')}</div></div></div>`;
}

function docsView(){
  const items=A.docs.filter(d=>state.docFilter==='Todos'||d.type===state.docFilter);
  return `<div class="page"><div class="page-head"><div><h1>Documentos</h1><p>Acesse seus contratos, orçamentos e arquivos importantes.</p></div><button class="btn-primary" id="upload-doc">+ Enviar arquivo</button></div>
  <div class="filters">${['Todos','Contrato','Orçamento','Outro'].map(f=>`<button class="filter-btn ${state.docFilter===f?'active':''}" data-doc-filter="${f}">${f}</button>`).join('')}</div>
  <div class="card list-card">${items.map(d=>`<div class="list-row doc-row"><div class="doc-icon">${icons.file}</div><div class="vendor-name"><strong>${d.name}</strong><span>Arquivo do casamento</span></div><div class="doc-type small muted">${d.type}</div><div class="doc-date small muted">${d.date}</div><button class="btn-secondary" data-view-doc="${d.name}">Visualizar</button></div>`).join('')}</div></div>`;
}

function financeView(){
  const total=A.vendors.reduce((s,v)=>s+v.amount,0), paid=A.vendors.reduce((s,v)=>s+v.paid,0), balance=total-paid;
  return `<div class="page"><div class="page-head"><div><h1>Financeiro</h1><p>Acompanhe seus pagamentos de forma simples e tranquila.</p></div><button class="btn-primary" id="new-payment">Registrar pagamento</button></div>
  <div class="finance-totals"><div class="card money-card"><span>Valor total contratado</span><strong>${brl(total)}</strong></div><div class="card money-card"><span>Valor pago</span><strong>${brl(paid)}</strong></div><div class="card money-card"><span>Saldo restante</span><strong>${brl(balance)}</strong></div></div>
  <div class="card list-card">${A.vendors.map(v=>`<div class="list-row payment-row"><div class="vendor-name"><strong>${v.category}</strong><span>${v.name}</span></div><div class="small">${brl(v.amount)}</div><div class="paid small muted">${brl(v.paid)}</div><div class="balance small muted">${brl(v.amount-v.paid)}</div><div><div class="mini-progress"><div style="width:${pct(v.paid,v.amount)}%"></div></div><span class="tiny muted">${pct(v.paid,v.amount)}% pago</span></div></div>`).join('')}</div></div>`;
}

function meetingsView(){
  return `<div class="page"><div class="page-head"><div><h1>Reuniões</h1><p>Organize seus próximos encontros e alinhamentos.</p></div><button class="btn-primary" id="new-meeting">+ Nova reunião</button></div><div class="meeting-grid">${A.meetings.map(m=>`<div class="card meeting-card"><div class="meeting-date"><div><strong>${m.day}</strong><span>${m.month}</span></div></div><div class="meeting-info"><strong>${m.title}</strong><span>${m.time} • ${m.type}</span><span>${m.people}</span></div></div>`).join('')}</div></div>`;
}

function profileView(){
  return `<div class="page"><div class="page-head"><div><h1>Perfil</h1><p>Seus dados e preferências de acesso.</p></div></div><div class="grid grid-2"><div class="card card-pad"><div class="card-title"><h2>Dados pessoais</h2></div><div class="field"><label>Nome</label><input class="input" style="padding-left:13px" value="Ana"></div><div class="field"><label>E-mail</label><input class="input" style="padding-left:13px" value="ana@exemplo.com"></div><button class="btn-primary" id="save-profile">Salvar alterações</button></div><div class="card card-pad"><div class="card-title"><h2>Seu casamento</h2></div><div class="contract-lines"><div class="contract-line"><span>Noivos</span><strong>Ana & Lucas</strong></div><div class="contract-line"><span>Data</span><strong>15/05/2027</strong></div><div class="contract-line"><span>Assessoria</span><strong>A Magia do Sim</strong></div></div></div></div></div>`;
}

function adminView(){
  const weddings=[['Ana & Lucas','15/05/2027',68],['Mariana & Pedro','22/08/2027',42],['Júlia & Rafael','10/10/2027',25]];
  return `<div class="page"><div class="card admin-banner"><h1>Olá, Bruna.</h1><p>Veja como estão os seus casamentos.</p></div><div class="admin-kpis"><div class="card admin-kpi"><span>Casamentos ativos</span><strong>3</strong></div><div class="card admin-kpi"><span>Fornecedores cadastrados</span><strong>28</strong></div><div class="card admin-kpi"><span>Pendências</span><strong>9</strong></div><div class="card admin-kpi"><span>Reuniões próximas</span><strong>6</strong></div></div>
  <div class="grid grid-2"><div class="card card-pad"><div class="card-title"><h2>Casamentos ativos</h2><button class="btn-primary" id="new-wedding">+ Criar casamento</button></div><div class="wedding-cards">${weddings.map(w=>`<div class="card wedding-card"><h3>${w[0]}</h3><p>${w[1]}</p><div class="progress-track" style="margin:8px 0"><div class="progress-fill" style="width:${w[2]}%"></div></div><span class="tiny muted">${w[2]}% concluído</span></div>`).join('')}</div></div><div class="card card-pad"><div class="card-title"><h2>Alertas</h2></div><div class="alert-row"><span>3 fornecedores aguardando retorno</span><span class="badge warning">Atenção</span></div><div class="alert-row"><span>2 tarefas vencem esta semana</span><span class="badge danger">Prazo</span></div><div class="alert-row"><span>1 contrato ainda não foi enviado</span><span class="badge info">Documento</span></div></div></div></div>`;
}

function emptyState(title,desc){ return `<div class="state-box"><div class="state-icon">♡</div><h3>${title}</h3><p>${desc}</p></div>`; }

function modal(title,body,saveText='Salvar',onSave){
  const back=document.createElement('div'); back.className='modal-backdrop';
  back.innerHTML=`<div class="modal"><div class="modal-head"><h3>${title}</h3><button class="icon-btn modal-close">${icons.close}</button></div>${body}<div class="modal-actions"><button class="btn-secondary modal-close">Cancelar</button><button class="btn-primary modal-save">${saveText}</button></div></div>`;
  document.body.appendChild(back);
  back.querySelectorAll('.modal-close').forEach(b=>b.onclick=()=>back.remove());
  back.addEventListener('click',e=>{if(e.target===back)back.remove()});
  back.querySelector('.modal-save').onclick=()=>{ if(onSave) onSave(back); else toast('Alterações salvas.'); back.remove(); };
}

function bindLogin(){
  document.getElementById('login-form').onsubmit=e=>{e.preventDefault(); state.logged=true; state.role='client'; localStorage.setItem('magiaLogged','1'); localStorage.setItem('magiaRole','client'); goto('dashboard'); render();};
  document.getElementById('admin-login').onclick=()=>{state.logged=true;state.role='admin';localStorage.setItem('magiaLogged','1');localStorage.setItem('magiaRole','admin');goto('admin');render();};
  document.getElementById('forgot').onclick=()=>toast('Link de recuperação simulado enviado para o e-mail cadastrado.');
}
function bindGlobal(){
  const logout=document.getElementById('logout'); if(logout) logout.onclick=()=>{localStorage.removeItem('magiaLogged');localStorage.removeItem('magiaRole');state.logged=false;state.role='client';location.hash='';render();};
  const bell=document.getElementById('bell'); if(bell) bell.onclick=()=>toast('Você tem 3 pendências e 2 compromissos próximos.');
  document.querySelectorAll('[data-mobile="menu"]').forEach(a=>a.onclick=e=>{e.preventDefault(); modal('Mais opções',`<div class="grid">${navItems.slice(4).map(([k,l,i])=>`<a class="btn-secondary" href="#/${k}" onclick="document.querySelector('.modal-backdrop')?.remove()">${l}</a>`).join('')}<a class="btn-secondary" href="#/perfil" onclick="document.querySelector('.modal-backdrop')?.remove()">Perfil</a>${state.role==='admin'?'<a class="btn-secondary" href="#/admin" onclick="document.querySelector(\'.modal-backdrop\')?.remove()">Painel admin</a>':''}</div>`,'Fechar');});
}
function bindView(r){
  document.querySelectorAll('[data-vendor-filter]').forEach(b=>b.onclick=()=>{state.vendorFilter=b.dataset.vendorFilter;render();});
  document.querySelectorAll('[data-task-filter]').forEach(b=>b.onclick=()=>{state.taskFilter=b.dataset.taskFilter;render();});
  document.querySelectorAll('[data-doc-filter]').forEach(b=>b.onclick=()=>{state.docFilter=b.dataset.docFilter;render();});
  document.querySelectorAll('[data-toggle-task]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id==b.dataset.toggleTask);t.done=!t.done;t.status=t.done?'Concluído':'Pendente';saveTasks();toast(t.done?'Tarefa concluída!':'Tarefa reaberta.');render();});
  document.querySelectorAll('[data-edit-task]').forEach(b=>b.onclick=()=>{const t=state.tasks.find(x=>x.id==b.dataset.editTask); modal('Editar tarefa',taskForm(t),'Salvar',back=>{t.title=back.querySelector('[name=title]').value;t.due=back.querySelector('[name=due]').value;t.assignee=back.querySelector('[name=assignee]').value;saveTasks();toast('Tarefa atualizada.');render();});});
  document.querySelectorAll('[data-view-doc]').forEach(b=>b.onclick=()=>toast(`Visualização de “${b.dataset.viewDoc}” simulada.`));

  const nv=document.getElementById('new-vendor'); if(nv) nv.onclick=()=>modal('Novo fornecedor',genericForm([['Categoria','category'],['Nome do fornecedor','name'],['Telefone','phone']]),'Adicionar',()=>toast('Fornecedor adicionado na demonstração.'));
  const nt=document.getElementById('new-task'); if(nt) nt.onclick=()=>modal('Nova tarefa',taskForm(),'Adicionar',back=>{state.tasks.push({id:Date.now(),title:back.querySelector('[name=title]').value||'Nova tarefa',due:back.querySelector('[name=due]').value||'Sem prazo',assignee:back.querySelector('[name=assignee]').value||'Assessoria',status:'Pendente',done:false});saveTasks();toast('Tarefa adicionada.');render();});
  const nm=document.getElementById('new-meeting'); if(nm) nm.onclick=()=>modal('Nova reunião',genericForm([['Título','title'],['Data','date','date'],['Hora','time','time'],['Participantes','participants'],['Link da reunião','link']]),'Criar reunião',()=>toast('Reunião criada na demonstração.'));
  const ne=document.getElementById('new-event'); if(ne) ne.onclick=()=>modal('Novo evento',genericForm([['Título','title'],['Data','date','date'],['Horário','time','time']]),'Adicionar',()=>toast('Evento adicionado ao cronograma.'));
  const ud=document.getElementById('upload-doc'); if(ud) ud.onclick=()=>modal('Enviar documento','<div class="field"><label>Nome do documento</label><input class="input" style="padding-left:13px" value="Novo documento"></div><div class="field"><label>Arquivo</label><input class="input" style="padding-left:13px" type="file"></div>','Enviar',()=>toast('Upload simulado concluído.'));
  const ep=document.getElementById('edit-wedding'); if(ep) ep.onclick=()=>modal('Editar informações do casamento',genericForm([['Nome dos noivos','couple'],['Data','date','date'],['Horário','time','time'],['Local','place'],['Número de convidados','guests','number']]),'Salvar',()=>toast('Informações atualizadas na demonstração.'));
  const ew=document.getElementById('edit-vendor'); if(ew) ew.onclick=()=>modal('Editar fornecedor',genericForm([['Nome','name'],['Telefone','phone'],['Instagram','instagram']]),'Salvar',()=>toast('Fornecedor atualizado.'));
  const an=document.getElementById('add-note'); if(an) an.onclick=()=>modal('Adicionar observação','<div class="field"><label>Observação</label><textarea class="input" style="padding-left:13px" placeholder="Escreva uma observação..."></textarea></div>','Adicionar',()=>toast('Observação adicionada.'));
  const vc=document.getElementById('view-contract'); if(vc) vc.onclick=()=>toast('Contrato de demonstração: conecte seu armazenamento para abrir arquivos reais.');
  const rp=document.getElementById('register-payment'); if(rp) rp.onclick=paymentModal;
  const np=document.getElementById('new-payment'); if(np) np.onclick=paymentModal;
  const sp=document.getElementById('save-profile'); if(sp) sp.onclick=()=>toast('Perfil atualizado.');
  const nw=document.getElementById('new-wedding'); if(nw) nw.onclick=()=>modal('Criar casamento',genericForm([['Nome dos noivos','couple'],['Data','date','date'],['Local','place']]),'Criar',()=>toast('Casamento criado na demonstração.'));
}
function taskForm(t={title:'',due:'',assignee:''}){return `<div class="field"><label>Título</label><input class="input" style="padding-left:13px" name="title" value="${t.title||''}"></div><div class="field"><label>Prazo</label><input class="input" style="padding-left:13px" name="due" value="${t.due||''}" placeholder="dd/mm/aaaa"></div><div class="field"><label>Responsável</label><input class="input" style="padding-left:13px" name="assignee" value="${t.assignee||''}"></div>`;}
function genericForm(fields){return fields.map(([label,name,type='text'])=>`<div class="field"><label>${label}</label><input class="input" style="padding-left:13px" name="${name}" type="${type}"></div>`).join('');}
function paymentModal(){modal('Registrar pagamento',`<div class="field"><label>Fornecedor</label><select class="input" style="padding-left:13px">${A.vendors.map(v=>`<option>${v.category} — ${v.name}</option>`).join('')}</select></div><div class="field"><label>Valor</label><input class="input" style="padding-left:13px" type="number" placeholder="0,00"></div><div class="field"><label>Data</label><input class="input" style="padding-left:13px" type="date"></div>`,'Registrar',()=>toast('Pagamento registrado na demonstração.'));}

window.addEventListener('hashchange',render);
render();
