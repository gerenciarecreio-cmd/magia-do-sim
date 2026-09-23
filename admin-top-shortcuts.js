
(function(){
  const adminTopBaseShellView=shellView;

  shellView=function(r,content){
    let html=adminTopBaseShellView(r,content);
    if(state.role!=='admin') return html;

    const active=r.startsWith('eventos/')?'calendario-eventos':r;
    const shortcuts=[
      ['admin','Painel admin','admin'],
      ['dashboard-empresa','Dashboard','admin'],
      ['crm','CRM','users'],
      ['agenda-comercial','Reuniões','meeting'],
      ['calendario-eventos','Eventos','calendar'],
      ['financeiro-empresa','Financeiro','money'],
      ['cadastros-gerais','Cadastros','users'],
      ['backup-seguranca','Backup','file']
    ];

    const bar=`
      <nav class="admin-top-shortcuts" aria-label="Atalhos administrativos">
        <div class="admin-top-shortcuts-inner">
          ${shortcuts.map(([key,label,icon])=>`
            <a href="#/${key}" class="admin-top-shortcut ${active===key?'active':''}">
              <span class="admin-top-shortcut-icon">${icons[icon]||icons.file}</span>
              <span>${label}</span>
            </a>
          `).join('')}
        </div>
      </nav>
    `;

    return html.replace('</header>','</header>'+bar);
  };
})();
