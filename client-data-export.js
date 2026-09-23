
Object.assign(state,{
  clientBackupSnapshot: state.clientBackupSnapshot || null,
  clientBackupLoadedAt: state.clientBackupLoadedAt || null,
  clientBackupLoading: false
});

const CLIENT_BACKUP_PAGE_SIZE=1000;
const CLIENT_BACKUP_LAST_EXPORT_KEY='magiaDoSimClientLastBackupExport';

function syncClientBackupNav(){
  const key='meus-dados';
  const idx=navItems.findIndex(item=>item[0]===key);

  if(state.role==='client'){
    if(idx<0) navItems.push([key,'Meus dados','file']);
  }else if(idx>=0){
    navItems.splice(idx,1);
  }
}

async function clientBackupFetchAll(table,weddingId){
  const rows=[];
  let from=0;

  while(true){
    let query=sb
      .from(table)
      .select('*')
      .eq('wedding_id',weddingId)
      .range(from,from+CLIENT_BACKUP_PAGE_SIZE-1);

    const {data,error}=await query;
    if(error){
      console.error(`client-backup:${table}`,error);
      throw new Error(`Não foi possível carregar ${table}.`);
    }

    const batch=data||[];
    rows.push(...batch);
    if(batch.length<CLIENT_BACKUP_PAGE_SIZE) break;
    from+=CLIENT_BACKUP_PAGE_SIZE;
  }

  return rows;
}

async function loadClientBackupSnapshot(force=false){
  if(state.role!=='client'||!state.wedding) return null;
  if(state.clientBackupLoading) return state.clientBackupSnapshot;

  const fresh=state.clientBackupLoadedAt && (Date.now()-state.clientBackupLoadedAt<5*60*1000);
  if(!force&&state.clientBackupSnapshot&&fresh) return state.clientBackupSnapshot;

  state.clientBackupLoading=true;
  try{
    const weddingId=state.wedding.id;

    const [
      guests,
      vendors,
      payments,
      purchases,
      tasks,
      meetings,
      documents
    ]=await Promise.all([
      clientBackupFetchAll('wedding_guests',weddingId),
      clientBackupFetchAll('vendors',weddingId),
      clientBackupFetchAll('payments',weddingId),
      clientBackupFetchAll('wedding_purchases',weddingId),
      clientBackupFetchAll('tasks',weddingId),
      clientBackupFetchAll('meetings',weddingId),
      clientBackupFetchAll('documents',weddingId)
    ]);

    const supplierIds=[...new Set(vendors.map(v=>v.supplier_id).filter(Boolean))];
    let suppliers=[];
    if(supplierIds.length){
      const {data,error}=await sb.from('suppliers').select('*').in('id',supplierIds);
      if(error){
        console.error('client-backup:suppliers',error);
        throw new Error('Não foi possível carregar os fornecedores vinculados.');
      }
      suppliers=data||[];
    }

    state.clientBackupSnapshot={
      exported_at:new Date().toISOString(),
      profile:state.profile?{...state.profile}:null,
      wedding:{...state.wedding},
      guests,
      vendors,
      suppliers,
      payments,
      purchases,
      tasks,
      meetings,
      documents
    };
    state.clientBackupLoadedAt=Date.now();
    return state.clientBackupSnapshot;
  } finally {
    state.clientBackupLoading=false;
  }
}

function clientBackupCount(snapshot,key){
  return Array.isArray(snapshot?.[key])?snapshot[key].length:0;
}

function clientBackupFinanceCount(snapshot){
  return clientBackupCount(snapshot,'payments')+clientBackupCount(snapshot,'purchases');
}

function clientBackupStatusText(){
  if(state.clientBackupLoading) return 'Verificando seus dados...';
  if(!state.clientBackupSnapshot) return 'Aguardando verificação';
  return `Dados verificados em ${new Date(state.clientBackupLoadedAt).toLocaleString('pt-BR')}`;
}

function clientBackupView(){
  const s=state.clientBackupSnapshot;
  const lastExport=localStorage.getItem(CLIENT_BACKUP_LAST_EXPORT_KEY);

  return `<div class="page client-backup-page">
    <div class="page-head client-backup-page-head">
      <div>
        <h1>Meus dados</h1>
        <p>Baixe uma cópia das informações do seu casamento sempre que quiser.</p>
      </div>
      <button class="btn-secondary" id="refresh-client-backup">${state.clientBackupLoading?'Verificando...':'Atualizar verificação'}</button>
    </div>

    <div class="card client-backup-status-card">
      <div class="client-backup-status-icon">✓</div>
      <div>
        <strong>Seus dados estão disponíveis para exportação</strong>
        <span>${esc(clientBackupStatusText())}</span>
      </div>
      <div class="client-backup-last-export">
        <small>Último download neste aparelho</small>
        <strong>${lastExport?esc(new Date(lastExport).toLocaleString('pt-BR')):'Ainda não realizado'}</strong>
      </div>
    </div>

    <div class="client-backup-kpis">
      <div class="card client-backup-kpi"><span>Casamento</span><strong>${state.wedding?'1':'0'}</strong><small>cadastro principal</small></div>
      <div class="card client-backup-kpi"><span>Convidados</span><strong>${s?clientBackupCount(s,'guests'):'—'}</strong><small>lista e RSVP</small></div>
      <div class="card client-backup-kpi"><span>Fornecedores</span><strong>${s?clientBackupCount(s,'vendors'):'—'}</strong><small>vinculados ao casamento</small></div>
      <div class="card client-backup-kpi"><span>Financeiro</span><strong>${s?clientBackupFinanceCount(s):'—'}</strong><small>pagamentos e gastos</small></div>
      <div class="card client-backup-kpi"><span>Documentos</span><strong>${s?clientBackupCount(s,'documents'):'—'}</strong><small>referências dos arquivos</small></div>
    </div>

    <div class="card card-pad client-backup-main-card">
      <div class="client-backup-main-copy">
        <span class="client-backup-kicker">CÓPIA COMPLETA</span>
        <h2>Baixar todos os meus dados</h2>
        <p>Gera um arquivo Excel com abas separadas para cadastro, casamento, convidados, fornecedores, financeiro, checklist, reuniões e documentos.</p>
      </div>
      <div class="client-backup-main-actions">
        <button class="btn-primary" data-client-export="all-xlsx">Baixar tudo (.xlsx)</button>
        <button class="btn-secondary" data-client-export="all-json">Cópia técnica (.json)</button>
      </div>
    </div>

    <div class="client-backup-export-grid">
      ${clientBackupExportCard('Cadastro e casamento','Seus dados de cadastro e informações principais do casamento.','profile-wedding','heart')}
      ${clientBackupExportCard('Convidados','Lista completa, grupos, respostas do RSVP e check-in.','guests','users')}
      ${clientBackupExportCard('Fornecedores','Fornecedores próprios e vinculados ao seu casamento.','vendors','users')}
      ${clientBackupExportCard('Financeiro','Pagamentos de fornecedores, Outros Gastos e Lua de mel.','finance','money')}
      ${clientBackupExportCard('Planejamento','Checklist, reuniões e referências de documentos.','planning','calendar')}
    </div>

    <div class="card card-pad client-backup-note">
      <div class="card-title"><h2>Sobre seus arquivos</h2></div>
      <p>O Excel inclui a relação dos documentos cadastrados, mas não incorpora os arquivos PDF, imagens ou outros anexos dentro da planilha. Esses arquivos continuam disponíveis normalmente na área <strong>Documentos</strong>.</p>
      <p>Por segurança, sua senha nunca faz parte de nenhuma exportação.</p>
    </div>
  </div>`;
}

function clientBackupExportCard(title,description,type,icon){
  return `<div class="card client-backup-export-card">
    <div class="client-backup-export-icon">${icons[icon]||icons.file}</div>
    <div class="client-backup-export-copy">
      <h3>${title}</h3>
      <p>${description}</p>
    </div>
    <button class="btn-secondary" data-client-export="${type}">Exportar Excel</button>
  </div>`;
}

function clientBackupExcelSafeValue(value){
  if(typeof value!=='string') return value;
  return /^[=+\-@]/.test(value)?`'${value}`:value;
}

function clientBackupSafeRows(rows){
  return (rows||[]).map(row=>{
    const safe={};
    for(const [key,value] of Object.entries(row||{})){
      safe[key]=clientBackupExcelSafeValue(value);
    }
    return safe;
  });
}

function clientBackupReadable(snapshot){
  const wedding=snapshot.wedding||{};
  const suppliers=snapshot.suppliers||[];
  const supplierMap=new Map(suppliers.map(s=>[s.id,s]));
  const vendorMap=new Map((snapshot.vendors||[]).map(v=>[v.id,v]));

  return {
    profile:snapshot.profile?[{
      ...snapshot.profile,
      senha:'Não exportada por segurança'
    }]:[],
    wedding:wedding?[{...wedding}]:[],
    guests:(snapshot.guests||[]).map(g=>({...g})),
    vendors:(snapshot.vendors||[]).map(v=>({
      ...v,
      origem:v.supplier_id?'Cadastro Geral':'Fornecedor próprio',
      fornecedor_geral:supplierMap.get(v.supplier_id)?.name||''
    })),
    payments:(snapshot.payments||[]).map(p=>({
      ...p,
      fornecedor:vendorMap.get(p.vendor_id)?.name||''
    })),
    purchases:(snapshot.purchases||[]).map(p=>({
      ...p,
      grupo:p.expense_group==='honeymoon'?'Lua de mel':'Outros Gastos'
    })),
    tasks:(snapshot.tasks||[]).map(t=>({...t})),
    meetings:(snapshot.meetings||[]).map(m=>({...m})),
    documents:(snapshot.documents||[]).map(d=>({...d}))
  };
}

function clientBackupAddSheet(workbook,name,rows){
  const prepared=clientBackupSafeRows(rows);
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

function clientBackupFileStamp(){
  const d=new Date();
  const p=n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

function clientBackupMarkExport(){
  localStorage.setItem(CLIENT_BACKUP_LAST_EXPORT_KEY,new Date().toISOString());
}

function clientBackupWriteWorkbook(filename,sheets){
  if(!window.XLSX){
    toast('Não foi possível carregar o recurso de Excel. Atualize a página e tente novamente.');
    return;
  }
  const workbook=XLSX.utils.book_new();
  for(const [name,rows] of sheets){
    clientBackupAddSheet(workbook,name,rows);
  }
  XLSX.writeFile(workbook,filename);
  clientBackupMarkExport();
}

function clientBackupDownloadJson(snapshot){
  const cleanSnapshot=JSON.parse(JSON.stringify(snapshot));
  if(cleanSnapshot.profile) delete cleanSnapshot.profile.password;
  const blob=new Blob(
    [JSON.stringify({
      backup_version:1,
      system:'A Magia do Sim',
      generated_at:new Date().toISOString(),
      scope:'Dados do cliente e do próprio casamento',
      data:cleanSnapshot
    },null,2)],
    {type:'application/json;charset=utf-8'}
  );
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`A_Magia_do_Sim_Meus_Dados_${clientBackupFileStamp()}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  clientBackupMarkExport();
}

async function exportClientBackup(type){
  try{
    const snapshot=await loadClientBackupSnapshot();
    if(!snapshot) return;
    const data=clientBackupReadable(snapshot);
    const stamp=clientBackupFileStamp();

    if(type==='all-json'){
      clientBackupDownloadJson(snapshot);
      toast('Cópia dos seus dados gerada.');
      return;
    }

    if(type==='all-xlsx'){
      clientBackupWriteWorkbook(`A_Magia_do_Sim_Meus_Dados_${stamp}.xlsx`,[
        ['Meu Cadastro',data.profile],
        ['Meu Casamento',data.wedding],
        ['Convidados',data.guests],
        ['Fornecedores',data.vendors],
        ['Pagamentos',data.payments],
        ['Outros e Lua de Mel',data.purchases],
        ['Checklist',data.tasks],
        ['Reuniões',data.meetings],
        ['Documentos',data.documents]
      ]);
      toast('Seus dados foram exportados.');
      return;
    }

    if(type==='profile-wedding'){
      clientBackupWriteWorkbook(`A_Magia_do_Sim_Cadastro_Casamento_${stamp}.xlsx`,[
        ['Meu Cadastro',data.profile],
        ['Meu Casamento',data.wedding]
      ]);
    }else if(type==='guests'){
      clientBackupWriteWorkbook(`A_Magia_do_Sim_Convidados_${stamp}.xlsx`,[['Convidados',data.guests]]);
    }else if(type==='vendors'){
      clientBackupWriteWorkbook(`A_Magia_do_Sim_Fornecedores_${stamp}.xlsx`,[['Fornecedores',data.vendors]]);
    }else if(type==='finance'){
      clientBackupWriteWorkbook(`A_Magia_do_Sim_Financeiro_${stamp}.xlsx`,[
        ['Pagamentos',data.payments],
        ['Outros e Lua de Mel',data.purchases]
      ]);
    }else if(type==='planning'){
      clientBackupWriteWorkbook(`A_Magia_do_Sim_Planejamento_${stamp}.xlsx`,[
        ['Checklist',data.tasks],
        ['Reuniões',data.meetings],
        ['Documentos',data.documents]
      ]);
    }

    toast('Arquivo gerado.');
  }catch(error){
    console.error(error);
    toast(error?.message||'Não foi possível exportar seus dados.');
  }
}

const clientBackupBaseViewFor=viewFor;
viewFor=function(r){
  if(r==='meus-dados'&&state.role==='client'&&state.wedding) return clientBackupView();
  return clientBackupBaseViewFor(r);
};

const clientBackupBaseRender=render;
render=function(){
  syncClientBackupNav();
  if(state.session&&state.role!=='client'&&route()==='meus-dados'){
    goto(state.role==='admin'?'admin':'dashboard');
    return;
  }
  return clientBackupBaseRender();
};

const clientBackupBaseShellView=shellView;
shellView=function(r,content){
  syncClientBackupNav();
  return clientBackupBaseShellView(r,content);
};

const clientBackupBaseBindView=bindView;
bindView=function(r){
  clientBackupBaseBindView(r);

  if(r!=='meus-dados'||state.role!=='client') return;

  if(!state.clientBackupSnapshot&&!state.clientBackupLoading){
    loadClientBackupSnapshot()
      .then(()=>render())
      .catch(error=>{
        console.error(error);
        toast(error?.message||'Não foi possível verificar seus dados.');
        render();
      });
  }

  const refresh=document.getElementById('refresh-client-backup');
  if(refresh){
    refresh.onclick=async()=>{
      refresh.disabled=true;
      refresh.textContent='Verificando...';
      try{
        await loadClientBackupSnapshot(true);
        toast('Seus dados foram verificados.');
        render();
      }catch(error){
        console.error(error);
        toast(error?.message||'Não foi possível verificar seus dados.');
        refresh.disabled=false;
        refresh.textContent='Atualizar verificação';
      }
    };
  }

  document.querySelectorAll('[data-client-export]').forEach(btn=>{
    btn.onclick=async()=>{
      const original=btn.textContent;
      btn.disabled=true;
      btn.textContent='Preparando...';
      try{
        await exportClientBackup(btn.dataset.clientExport);
        render();
      }finally{
        btn.disabled=false;
        btn.textContent=original;
      }
    };
  });
};
