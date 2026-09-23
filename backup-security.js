
Object.assign(state,{
  backupSnapshot: state.backupSnapshot || null,
  backupLoadedAt: state.backupLoadedAt || null,
  backupLoading: false
});

const BACKUP_PAGE_SIZE=1000;
const BACKUP_LAST_EXPORT_KEY='magiaDoSimLastBackupExport';

async function backupFetchAll(table,filters=[]){
  const rows=[];
  let from=0;

  while(true){
    let query=sb.from(table).select('*').range(from,from+BACKUP_PAGE_SIZE-1);
    for(const [column,value] of filters){
      query=query.eq(column,value);
    }

    const {data,error}=await query;
    if(error){
      console.error(`backup:${table}`,error);
      throw new Error(`Não foi possível carregar ${table}.`);
    }

    const batch=data||[];
    rows.push(...batch);
    if(batch.length<BACKUP_PAGE_SIZE) break;
    from+=BACKUP_PAGE_SIZE;
  }

  return rows;
}

async function loadBackupSnapshot(force=false){
  if(state.role!=='admin') return null;
  if(state.backupLoading) return state.backupSnapshot;

  const fresh=state.backupLoadedAt && (Date.now()-state.backupLoadedAt<5*60*1000);
  if(!force&&state.backupSnapshot&&fresh) return state.backupSnapshot;

  state.backupLoading=true;
  try{
    const [
      clients,
      weddings,
      guests,
      vendors,
      suppliers,
      payments,
      purchases,
      financialEntries
    ]=await Promise.all([
      backupFetchAll('profiles',[['role','client']]),
      backupFetchAll('weddings'),
      backupFetchAll('wedding_guests'),
      backupFetchAll('vendors'),
      backupFetchAll('suppliers'),
      backupFetchAll('payments'),
      backupFetchAll('wedding_purchases'),
      backupFetchAll('financial_entries')
    ]);

    state.backupSnapshot={
      exported_at:new Date().toISOString(),
      clients,
      weddings,
      guests,
      vendors,
      suppliers,
      payments,
      purchases,
      financial_entries:financialEntries
    };
    state.backupLoadedAt=Date.now();
    return state.backupSnapshot;
  } finally {
    state.backupLoading=false;
  }
}

function backupCount(snapshot,key){
  return Array.isArray(snapshot?.[key])?snapshot[key].length:0;
}

function backupFinanceCount(snapshot){
  return backupCount(snapshot,'payments')
    +backupCount(snapshot,'purchases')
    +backupCount(snapshot,'financial_entries');
}

function backupStatusText(){
  if(state.backupLoading) return 'Verificando dados...';
  if(!state.backupSnapshot) return 'Aguardando verificação';
  return `Dados verificados em ${new Date(state.backupLoadedAt).toLocaleString('pt-BR')}`;
}

function backupSecurityView(){
  const s=state.backupSnapshot;
  const lastExport=localStorage.getItem(BACKUP_LAST_EXPORT_KEY);

  return `<div class="page backup-security-page">
    <div class="page-head backup-page-head">
      <div>
        <h1>Backup e Segurança</h1>
        <p>Exporte cópias dos dados da A Magia do Sim e mantenha um arquivo independente do sistema.</p>
      </div>
      <button class="btn-secondary" id="refresh-backup-data">${state.backupLoading?'Verificando...':'Atualizar verificação'}</button>
    </div>

    <div class="card backup-status-card">
      <div class="backup-status-icon">✓</div>
      <div>
        <strong>Banco de dados conectado</strong>
        <span>${esc(backupStatusText())}</span>
      </div>
      <div class="backup-last-export">
        <small>Última exportação neste aparelho</small>
        <strong>${lastExport?esc(new Date(lastExport).toLocaleString('pt-BR')):'Ainda não realizada'}</strong>
      </div>
    </div>

    <div class="backup-kpis">
      <div class="card backup-kpi"><span>Clientes</span><strong>${s?backupCount(s,'clients'):'—'}</strong><small>cadastros de clientes</small></div>
      <div class="card backup-kpi"><span>Casamentos</span><strong>${s?backupCount(s,'weddings'):'—'}</strong><small>ativos, finalizados e arquivados</small></div>
      <div class="card backup-kpi"><span>Convidados</span><strong>${s?backupCount(s,'guests'):'—'}</strong><small>lista e confirmações</small></div>
      <div class="card backup-kpi"><span>Fornecedores</span><strong>${s?backupCount(s,'vendors'):'—'}</strong><small>vínculos dos casamentos</small></div>
      <div class="card backup-kpi"><span>Financeiro</span><strong>${s?backupFinanceCount(s):'—'}</strong><small>lançamentos financeiros</small></div>
    </div>

    <div class="card card-pad backup-main-card">
      <div class="backup-main-copy">
        <span class="backup-kicker">BACKUP COMPLETO</span>
        <h2>Baixar todos os dados em Excel</h2>
        <p>Gera um único arquivo com abas separadas para clientes, casamentos, convidados, fornecedores e financeiro.</p>
      </div>
      <div class="backup-main-actions">
        <button class="btn-primary" data-backup-export="all-xlsx">Baixar backup completo (.xlsx)</button>
        <button class="btn-secondary" data-backup-export="all-json">Backup técnico (.json)</button>
      </div>
    </div>

    <div class="backup-export-grid">
      ${backupExportCard('Clientes','Nome, e-mail, situação do cadastro e identificadores.','clients','users')}
      ${backupExportCard('Casamentos','Dados dos noivos, data, local, situação e vínculo com o cliente.','weddings','heart')}
      ${backupExportCard('Convidados','Lista completa, família/grupo, confirmação e check-in.','guests','users')}
      ${backupExportCard('Fornecedores','Fornecedores de cada casamento e o Cadastro Geral.','vendors','users')}
      ${backupExportCard('Financeiro','Pagamentos de fornecedores, Outros Gastos, Lua de mel e financeiro da empresa.','finance','money')}
    </div>

    <div class="grid grid-2 backup-notes">
      <div class="card card-pad">
        <div class="card-title"><h2>O que entra no backup?</h2></div>
        <div class="backup-check-list">
          <span>✓ Clientes, inclusive registros finalizados/arquivados</span>
          <span>✓ Casamentos e seus identificadores</span>
          <span>✓ Convidados e respostas do RSVP</span>
          <span>✓ Fornecedores próprios e Cadastro Geral</span>
          <span>✓ Pagamentos, Outros Gastos, Lua de mel e financeiro da empresa</span>
        </div>
      </div>
      <div class="card card-pad backup-warning-card">
        <div class="card-title"><h2>Arquivos e senhas</h2></div>
        <p>Esta exportação protege os <strong>dados cadastrados</strong>. Os PDFs, imagens e documentos enviados permanecem armazenados no Storage e não são incluídos dentro do Excel.</p>
        <p>Senhas de clientes não fazem parte da exportação e continuam protegidas pelo sistema de autenticação.</p>
      </div>
    </div>
  </div>`;
}

function backupExportCard(title,description,type,icon){
  return `<div class="card backup-export-card">
    <div class="backup-export-icon">${icons[icon]||icons.file}</div>
    <div class="backup-export-copy">
      <h3>${title}</h3>
      <p>${description}</p>
    </div>
    <button class="btn-secondary" data-backup-export="${type}">Exportar Excel</button>
  </div>`;
}

function backupExcelSafeValue(value){
  if(typeof value!=='string') return value;
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function backupExcelSafeRows(rows){
  return (rows||[]).map(row=>{
    const safe={};
    for(const [key,value] of Object.entries(row||{})){
      safe[key]=backupExcelSafeValue(value);
    }
    return safe;
  });
}

function backupReadableData(snapshot){
  const clients=snapshot.clients||[];
  const weddings=snapshot.weddings||[];
  const suppliers=snapshot.suppliers||[];
  const vendors=snapshot.vendors||[];

  const clientMap=new Map(clients.map(x=>[x.id,x]));
  const weddingMap=new Map(weddings.map(x=>[x.id,x]));
  const supplierMap=new Map(suppliers.map(x=>[x.id,x]));
  const vendorMap=new Map(vendors.map(x=>[x.id,x]));

  return {
    clients:clients.map(c=>({
      ...c,
      status_cliente:c.client_status||'active'
    })),
    weddings:weddings.map(w=>({
      ...w,
      cliente_nome:clientMap.get(w.client_user_id)?.full_name||'',
      cliente_email:clientMap.get(w.client_user_id)?.email||''
    })),
    guests:(snapshot.guests||[]).map(g=>({
      ...g,
      casamento:weddingMap.get(g.wedding_id)?.couple_name||''
    })),
    vendors:vendors.map(v=>({
      ...v,
      casamento:weddingMap.get(v.wedding_id)?.couple_name||'',
      origem:v.supplier_id?'Cadastro Geral':'Fornecedor próprio',
      fornecedor_geral:supplierMap.get(v.supplier_id)?.name||''
    })),
    suppliers:suppliers.map(s=>({...s})),
    payments:(snapshot.payments||[]).map(p=>({
      ...p,
      casamento:weddingMap.get(p.wedding_id)?.couple_name||'',
      fornecedor:vendorMap.get(p.vendor_id)?.name||''
    })),
    purchases:(snapshot.purchases||[]).map(p=>({
      ...p,
      casamento:weddingMap.get(p.wedding_id)?.couple_name||'',
      grupo:p.expense_group==='honeymoon'?'Lua de mel':'Outros Gastos'
    })),
    financial_entries:(snapshot.financial_entries||[]).map(x=>({...x}))
  };
}

function backupAddSheet(workbook,name,rows){
  const prepared=backupExcelSafeRows(rows);
  const data=prepared.length?prepared:[{Informação:'Sem registros'}];
  const sheet=XLSX.utils.json_to_sheet(data);
  const headers=Object.keys(data[0]||{});
  sheet['!cols']=headers.map(header=>{
    let width=String(header).length+2;
    for(const row of data.slice(0,250)){
      width=Math.max(width,String(row[header]??'').length+2);
    }
    return {wch:Math.min(Math.max(width,12),38)};
  });
  XLSX.utils.book_append_sheet(workbook,sheet,name.slice(0,31));
}

function backupFileStamp(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

function backupMarkExport(){
  const now=new Date().toISOString();
  localStorage.setItem(BACKUP_LAST_EXPORT_KEY,now);
}

function backupWriteWorkbook(filename,sheets){
  if(!window.XLSX){
    toast('Não foi possível carregar o recurso de Excel. Atualize a página e tente novamente.');
    return;
  }

  const workbook=XLSX.utils.book_new();
  for(const [name,rows] of sheets){
    backupAddSheet(workbook,name,rows);
  }
  XLSX.writeFile(workbook,filename);
  backupMarkExport();
}

function backupDownloadJson(snapshot){
  const blob=new Blob(
    [JSON.stringify({
      backup_version:1,
      system:'A Magia do Sim',
      generated_at:new Date().toISOString(),
      data:snapshot
    },null,2)],
    {type:'application/json;charset=utf-8'}
  );
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`A_Magia_do_Sim_Backup_${backupFileStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  backupMarkExport();
}

async function exportBackup(type){
  try{
    const snapshot=await loadBackupSnapshot();
    if(!snapshot) return;
    const data=backupReadableData(snapshot);
    const stamp=backupFileStamp();

    if(type==='all-json'){
      backupDownloadJson(snapshot);
      toast('Backup técnico gerado.');
      return;
    }

    if(type==='all-xlsx'){
      backupWriteWorkbook(`A_Magia_do_Sim_Backup_Completo_${stamp}.xlsx`,[
        ['Clientes',data.clients],
        ['Casamentos',data.weddings],
        ['Convidados',data.guests],
        ['Fornecedores',data.vendors],
        ['Cadastro Geral',data.suppliers],
        ['Pagamentos',data.payments],
        ['Outros e Lua de Mel',data.purchases],
        ['Financeiro Empresa',data.financial_entries]
      ]);
      toast('Backup completo gerado.');
      return;
    }

    if(type==='clients'){
      backupWriteWorkbook(`A_Magia_do_Sim_Clientes_${stamp}.xlsx`,[['Clientes',data.clients]]);
    }else if(type==='weddings'){
      backupWriteWorkbook(`A_Magia_do_Sim_Casamentos_${stamp}.xlsx`,[['Casamentos',data.weddings]]);
    }else if(type==='guests'){
      backupWriteWorkbook(`A_Magia_do_Sim_Convidados_${stamp}.xlsx`,[['Convidados',data.guests]]);
    }else if(type==='vendors'){
      backupWriteWorkbook(`A_Magia_do_Sim_Fornecedores_${stamp}.xlsx`,[
        ['Fornecedores',data.vendors],
        ['Cadastro Geral',data.suppliers]
      ]);
    }else if(type==='finance'){
      backupWriteWorkbook(`A_Magia_do_Sim_Financeiro_${stamp}.xlsx`,[
        ['Pagamentos',data.payments],
        ['Outros e Lua de Mel',data.purchases],
        ['Financeiro Empresa',data.financial_entries]
      ]);
    }

    toast('Arquivo de exportação gerado.');
  }catch(error){
    console.error(error);
    toast(error?.message||'Não foi possível gerar o backup.');
  }
}

const backupBaseViewFor=viewFor;
viewFor=function(r){
  if(r==='backup-seguranca'&&state.role==='admin') return backupSecurityView();
  return backupBaseViewFor(r);
};

const backupBaseRender=render;
render=function(){
  if(state.session&&state.role!=='admin'&&route()==='backup-seguranca'){
    goto('dashboard');
    return;
  }
  return backupBaseRender();
};

const backupBaseShellView=shellView;
shellView=function(r,content){
  let html=backupBaseShellView(r,content);
  if(state.role!=='admin') return html;

  const active=r==='backup-seguranca'?'active':'';
  const item=`<a href="#/backup-seguranca" class="nav-item ${active}">${icons.file}<span>Backup e Segurança</span></a>`;
  return html.replace('<div class="sidebar-bottom">',item+'<div class="sidebar-bottom">');
};

const backupBaseBindGlobal=bindGlobal;
bindGlobal=function(){
  backupBaseBindGlobal();

  if(state.role==='admin'){
    document.querySelectorAll('[data-mobile="menu"]').forEach(a=>{
      a.onclick=e=>{
        e.preventDefault();
        modal(
          'Mais opções',
          `<div class="grid">
            ${navItems.slice(4).map(([k,l])=>`<a class="btn-secondary" href="#/${k}" onclick="document.querySelector('.modal-backdrop')?.remove()">${l}</a>`).join('')}
            <a class="btn-secondary" href="#/backup-seguranca" onclick="document.querySelector('.modal-backdrop')?.remove()">Backup e Segurança</a>
            <a class="btn-secondary" href="#/perfil" onclick="document.querySelector('.modal-backdrop')?.remove()">Perfil</a>
            <a class="btn-secondary" href="#/cadastros-gerais" onclick="document.querySelector('.modal-backdrop')?.remove()">Cadastros gerais</a>
            <a class="btn-secondary" href="#/admin" onclick="document.querySelector('.modal-backdrop')?.remove()">Painel admin</a>
          </div>`,
          'Fechar',
          ()=>true
        );
      };
    });
  }
};

const backupBaseBindView=bindView;
bindView=function(r){
  backupBaseBindView(r);

  if(r!=='backup-seguranca'||state.role!=='admin') return;

  if(!state.backupSnapshot&&!state.backupLoading){
    loadBackupSnapshot()
      .then(()=>render())
      .catch(error=>{
        console.error(error);
        toast(error?.message||'Não foi possível verificar os dados.');
        render();
      });
  }

  const refresh=document.getElementById('refresh-backup-data');
  if(refresh){
    refresh.onclick=async()=>{
      refresh.disabled=true;
      refresh.textContent='Verificando...';
      try{
        await loadBackupSnapshot(true);
        toast('Dados verificados com sucesso.');
        render();
      }catch(error){
        console.error(error);
        toast(error?.message||'Não foi possível verificar os dados.');
        refresh.disabled=false;
        refresh.textContent='Atualizar verificação';
      }
    };
  }

  document.querySelectorAll('[data-backup-export]').forEach(btn=>{
    btn.onclick=async()=>{
      const original=btn.textContent;
      btn.disabled=true;
      btn.textContent='Preparando...';
      try{
        await exportBackup(btn.dataset.backupExport);
        render();
      }finally{
        btn.disabled=false;
        btn.textContent=original;
      }
    };
  });
};
