
const mobileBaseShellView = shellView;
shellView = function(r,content){
  const active=r.startsWith('fornecedores/')?'fornecedores':r;
  const displayName=state.profile?.full_name || (state.role==='admin'?'Assessoria':'Cliente');
  const first=(displayName||'A').trim()[0]?.toUpperCase()||'A';
  const adminContext=state.role==='admin' && state.wedding
    ? `<span class="small muted">Gerenciando: <strong>${esc(currentCouple())}</strong></span>`
    : '';

  const avatarHtml=state.role==='client' && state.couplePhotoUrl
    ? `<div class="avatar mobile-profile-photo"><img src="${esc(state.couplePhotoUrl)}" alt="Foto do casal"></div>`
    : `<div class="avatar">${first}</div>`;

  const profileArea=state.role==='client'
    ? `<div class="client-userbox">
        <div class="client-user-copy">
          <strong>${esc(displayName)}</strong>
          <button type="button" class="client-logout-link" data-client-logout>Sair</button>
        </div>
        ${avatarHtml}
      </div>`
    : `<div class="profile-chip">${avatarHtml}<span class="small">${esc(displayName)}⌄</span></div>`;

  return `<div class="app-shell ${state.role==='client'?'client-app-shell':'admin-app-shell'}">
    <aside class="sidebar">
      <div class="sidebar-brand"><div class="sidebar-logo"><img src="assets/logo-oficial.png" alt="A Magia do Sim"></div><div class="sidebar-name">A Magia<br>do Sim</div></div>
      <nav class="nav">${navItems.map(([k,l,i])=>`<a href="#/${k}" class="nav-item ${active===k?'active':''}">${icons[i]}<span>${l}</span></a>`).join('')}</nav>
      <div class="sidebar-bottom">
        ${state.role==='admin'?`<a href="#/cadastros-gerais" class="nav-item ${active==='cadastros-gerais'?'active':''}">${icons.users}<span>Cadastros gerais</span></a><a href="#/admin" class="nav-item ${active==='admin'?'active':''}">${icons.admin}<span>Painel admin</span></a>`:''}
        <a href="#/perfil" class="nav-item ${active==='perfil'?'active':''}">${icons.user}<span>Perfil</span></a>
        <button class="nav-item" id="logout" style="border:0;background:none;text-align:left;width:100%">${icons.logout}<span>Sair</span></button>
      </div>
    </aside>
    <main class="main">
      <header class="topbar">
        <button class="icon-btn mobile-menu" id="mobile-menu" aria-label="Abrir menu">${icons.menu}</button>
        <div class="mobile-app-brand"><img src="assets/logo-oficial.png" alt="A Magia do Sim"><div><strong>A Magia do Sim</strong><span>Área dos Noivos</span></div></div>
        <div class="topbar-label small muted">Área dos Noivos — <strong>A Magia do Sim</strong> ${adminContext}</div>
        <div class="topbar-right"><button class="icon-btn" id="bell" aria-label="Notificações">${icons.bell}</button>${profileArea}</div>
      </header>
      ${content}
    </main>
    <nav class="mobile-nav">${[['dashboard','Início','home'],['fornecedores','Fornecedores','users'],['checklist','Checklist','check'],['cronograma','Cronograma','calendar'],['menu','Mais','menu']].map(([k,l,i])=>`<a href="${k==='menu'?'#':`#/${k}`}" data-mobile="${k}" class="${active===k?'active':''}">${icons[i]}<span>${l}</span></a>`).join('')}</nav>
  </div>`;
};

const mobileBaseDashboardView = dashboardView;
dashboardView = function(){
  const c=countdown(), comp=completion();
  const next=state.tasks.filter(t=>!t.done).slice(0,3);
  const contracted=state.vendors.filter(v=>v.status==='Contratado').length;
  const negotiating=state.vendors.filter(v=>v.status==='Em negociação').length;
  const pending=state.vendors.filter(v=>v.status==='Pendente').length;
  const nextMeetings=state.meetings.slice(0,2);
  const pendingCount=state.tasks.filter(t=>!t.done).length;
  const mobileCountdown=c.text
    ? `<strong class="mobile-countdown-text">${esc(c.text)}</strong>`
    : `<strong>${c.days}</strong><span>dias</span>`;

  return `<div class="page mobile-client-home">
    <section class="mobile-app-home-card">
      <div class="mobile-home-copy">
        <span class="mobile-home-kicker">SEU GRANDE DIA</span>
        <h1>Olá, ${esc(partnerNames())}! ♡</h1>
        <p>${esc(dateLong(state.wedding.wedding_date))}</p>
      </div>
      <div class="mobile-home-count">${mobileCountdown}</div>
      <div class="mobile-home-progress">
        <div class="mobile-progress-head"><span>Planejamento</span><strong>${comp}%</strong></div>
        <div class="progress-track"><div class="progress-fill" style="width:${comp}%"></div></div>
      </div>
    </section>

    <section class="mobile-app-quick-actions">
      <a href="#/fornecedores"><span class="quick-icon">${icons.users}</span><strong>Fornecedores</strong></a>
      <a href="#/checklist"><span class="quick-icon">${icons.check}</span><strong>Checklist</strong></a>
      <a href="#/cronograma"><span class="quick-icon">${icons.calendar}</span><strong>Cronograma</strong></a>
      <a href="#/documentos"><span class="quick-icon">${icons.file}</span><strong>Documentos</strong></a>
    </section>

    <section class="hero desktop-dashboard-hero">
      <div class="card hero-main"><h1 class="hero-title">Olá, ${esc(partnerNames())}! ♡</h1><p class="hero-sub">Que bom ter você por aqui. Vamos juntos até o grande dia.</p><div class="date">${icons.calendar} ${esc(dateLong(state.wedding.wedding_date))}</div></div>
      <div class="card countdown">${c.text?`<div><span class="countdown-label">Contagem regressiva</span><div class="countdown-number" style="font-size:38px">${esc(c.text)}</div></div>`:`<div><span class="countdown-label">Faltam</span><div class="countdown-number">${c.days}</div><span class="countdown-unit">dias para o grande dia ♡</span></div><div class="countdown-mini"><div><strong>${c.months}</strong><span>meses</span></div><div><strong>${c.days}</strong><span>dias</span></div><div><strong>${c.hours}</strong><span>horas</span></div></div>`}</div>
    </section>

    <section class="dashboard-main">
      <div class="card card-pad"><div class="card-title"><h2>Seu planejamento</h2><span class="sub">${comp}% concluído</span></div><div class="progress-track"><div class="progress-fill" style="width:${comp}%"></div></div><div class="steps">${[['Local',!!state.wedding.venue],['Fotografia',state.vendors.some(v=>v.category==='Fotografia'&&v.status==='Contratado')],['Buffet',state.vendors.some(v=>v.category==='Buffet'&&v.status==='Contratado')],['Decoração',state.vendors.some(v=>v.category==='Decoração'&&v.status!=='Pendente')],['Música',state.vendors.some(v=>v.category==='Música'&&v.status==='Contratado')]].map(([t,done])=>`<div class="step ${done?'done':''}"><div class="step-dot">${done?'✓':'○'}</div>${t}</div>`).join('')}</div></div>
      <div class="card card-pad mobile-next-steps-card">
        <div class="card-title"><h2>Próximos passos</h2><a href="#/checklist" class="sub">Ver todos ›</a></div>
        <div class="mobile-next-steps">
          ${next.length?next.map(t=>`
            <a class="mobile-next-step" href="#/checklist" aria-label="Abrir checklist: ${esc(t.title)}">
              <span class="mobile-next-check" aria-hidden="true"></span>
              <span class="mobile-next-copy">
                <strong>${esc(t.title)}</strong>
                <small>${esc(t.due==='Sem prazo'?'Sem prazo':`Prazo: ${t.due}`)}</small>
              </span>
              <span class="mobile-next-arrow" aria-hidden="true">›</span>
            </a>
          `).join(''):emptyState('Tudo em dia!','Nenhuma tarefa pendente no momento.')}
        </div>
      </div>
    </section>

    <section class="summary-cards">
      <div class="card kpi-card"><div class="kpi-head">${icons.users} Fornecedores</div><div class="kpi-list"><div><strong>${contracted}</strong> contratados</div><div><strong>${negotiating}</strong> em negociação</div><div><strong>${pending}</strong> pendentes</div><a href="#/fornecedores" class="small" style="margin-top:9px;color:var(--brown)">Ver todos ›</a></div></div>
      <div class="card kpi-card"><div class="kpi-head">${icons.calendar} Próximos compromissos</div><div class="kpi-list">${nextMeetings.length?nextMeetings.map(m=>`<div><strong>${esc(m.title)}</strong><br>${dateBR(m.date)} às ${timeBR(m.time)}</div>`).join(''):'<div class="muted">Nenhuma reunião cadastrada.</div>'}<a href="#/reunioes" class="small" style="margin-top:9px;color:var(--brown)">Ver calendário ›</a></div></div>
      <div class="card kpi-card"><div class="kpi-head">${icons.check} Pendências <span class="badge danger">${pendingCount}</span></div><div class="kpi-list">${state.tasks.filter(t=>!t.done).slice(0,3).map(t=>`<div>${esc(t.title)}</div>`).join('')||'<div class="muted">Nenhuma pendência.</div>'}<a href="#/checklist" class="small" style="margin-top:9px;color:var(--brown)">Ver todas ›</a></div></div>
      <div class="card inspiration"><blockquote>“Cada detalhe tem um propósito... e tudo se encaixa no tempo certo.” ♡</blockquote></div>
    </section>
  </div>`;
};

const mobileBaseBindGlobal = bindGlobal;
bindGlobal = function(){
  mobileBaseBindGlobal();
  document.querySelectorAll('[data-client-logout]').forEach(btn=>{
    btn.onclick=async()=>{
      await sb.auth.signOut();
      state.session=null;
      state.user=null;
      state.profile=null;
      state.wedding=null;
      state.couplePhotoUrl='';
      resetWeddingCollections();
      location.hash='';
      render();
    };
  });
};
