
Object.assign(state,{
  allWeddings: state.allWeddings || [],
  activeWeddings: state.activeWeddings || [],
  completedWeddings: state.completedWeddings || []
});

function lifecycleStatus(w){
  return w?.lifecycle_status || 'active';
}

function isPastWedding(w){
  if(!w?.wedding_date) return false;
  const today=new Date();
  today.setHours(0,0,0,0);
  const eventDate=new Date(w.wedding_date+'T12:00:00');
  return eventDate < today;
}

const lifecycleBaseLoadAdminData=loadAdminData;
loadAdminData=async function(){
  await lifecycleBaseLoadAdminData();

  const all=Array.isArray(state.weddings)?state.weddings:[];
  state.allWeddings=all;
  state.weddings=all.filter(w=>lifecycleStatus(w)!=='deleted');
  state.activeWeddings=state.weddings.filter(w=>lifecycleStatus(w)==='active');
  state.completedWeddings=state.weddings.filter(w=>lifecycleStatus(w)==='completed');

  const {data:clients,error}=await sb
    .from('profiles')
    .select('id,full_name,role,email,client_status,deleted_at')
    .eq('role','client')
    .order('full_name',{ascending:true});

  if(error){
    console.error(error);
  }else{
    state.clients=(clients||[]).filter(c=>(c.client_status||'active')!=='deleted');
  }

  if(state.selectedWeddingId){
    const selected=state.weddings.find(w=>w.id===state.selectedWeddingId);
    if(!selected){
      state.selectedWeddingId=null;
      state.wedding=null;
      resetWeddingCollections();
    }else{
      state.wedding=selected;
    }
  }
};

const lifecycleBaseHydrateSession=hydrateSession;
hydrateSession=async function(session){
  await lifecycleBaseHydrateSession(session);
  if(state.role==='client' && state.profile?.client_status==='deleted'){
    state.wedding=null;
    state.selectedWeddingId=null;
    resetWeddingCollections();
    state.couplePhotoUrl='';
    state.loading=false;
    render();
  }
};

const lifecycleBaseNoWeddingView=noWeddingView;
noWeddingView=function(){
  if(state.role==='client' && state.profile?.client_status==='deleted'){
    return `<div class="page"><div class="card card-pad lifecycle-access-ended"><h1>Acesso encerrado</h1><p>Este cadastro foi encerrado pela assessoria. Se precisar de alguma informação sobre o evento, entre em contato com A Magia do Sim.</p></div></div>`;
  }
  return lifecycleBaseNoWeddingView();
};

function lifecycleWeddingCard(w,completed=false){
  const past=isPastWedding(w);
  return `<div class="card wedding-card lifecycle-wedding-card ${completed?'is-completed':''}">
    <div class="lifecycle-card-top">
      <div>
        <div class="lifecycle-status-line">
          <span class="badge ${completed?'info':past?'warning':'success'}">${completed?'Finalizado':past?'Evento realizado':'Ativo'}</span>
        </div>
        <h3>${esc(w.couple_name)}</h3>
        <p>${dateBR(w.wedding_date)} • ${esc(w.venue||'Local a definir')}</p>
      </div>
    </div>
    <div class="action-row lifecycle-card-actions">
      <button class="btn-primary" data-open-wedding="${w.id}">Gerenciar</button>
      <button class="btn-secondary" data-edit-admin-wedding="${w.id}">Editar</button>
      ${completed
        ? `<button class="btn-secondary" data-reopen-wedding="${w.id}">Reabrir</button>`
        : `<button class="btn-secondary lifecycle-finish-btn" data-finalize-wedding="${w.id}">Finalizar cliente</button>`}
      <button class="btn-danger" data-delete-client-wedding="${w.id}">Excluir cliente</button>
    </div>
  </div>`;
}

adminView=function(){
  const active=[...(state.activeWeddings||[])].sort((a,b)=>String(a.wedding_date||'').localeCompare(String(b.wedding_date||'')));
  const completed=[...(state.completedWeddings||[])].sort((a,b)=>String(b.completed_at||b.wedding_date||'').localeCompare(String(a.completed_at||a.wedding_date||'')));
  const activeClientIds=new Set(active.map(w=>w.client_user_id).filter(Boolean));
  const pastPending=active.filter(isPastWedding);
  const totalVendors=state.wedding?state.vendors.length:'—';

  return `<div class="page lifecycle-admin-page">
    <div class="card admin-banner">
      <h1>Olá, ${esc(state.profile?.full_name||'Assessoria')}.</h1>
      <p>Gerencie os clientes ativos e arquive os eventos que já foram concluídos.</p>
    </div>

    <div class="admin-kpis">
      <div class="card admin-kpi"><span>Clientes ativos</span><strong>${activeClientIds.size}</strong></div>
      <div class="card admin-kpi"><span>Eventos finalizados</span><strong>${completed.length}</strong></div>
      <div class="card admin-kpi"><span>Aguardando finalização</span><strong>${pastPending.length}</strong></div>
      <div class="card admin-kpi"><span>Casamento em edição</span><strong style="font-size:18px">${esc(state.wedding?.couple_name||'Nenhum')}</strong></div>
    </div>

    ${pastPending.length?`<div class="card lifecycle-alert">
      <div>
        <strong>${pastPending.length} evento(s) já passaram.</strong>
        <span>Você pode usar “Finalizar cliente” para removê-los da página inicial sem apagar os dados.</span>
      </div>
    </div>`:''}

    <div class="grid grid-2 lifecycle-admin-grid">
      <div class="card card-pad">
        <div class="card-title">
          <h2>Clientes ativos</h2>
          <div class="action-row">
            <button class="btn-primary" id="new-client">+ Novo cliente</button>
            <button class="btn-secondary" id="new-wedding">+ Vincular casamento</button>
          </div>
        </div>
        <div class="wedding-cards">
          ${active.length
            ? active.map(w=>lifecycleWeddingCard(w,false)).join('')
            : emptyState('Nenhum cliente ativo','Quando você cadastrar um novo cliente, ele aparecerá aqui.')}
        </div>
      </div>

      <div class="card card-pad">
        <div class="card-title">
          <h2>Clientes cadastrados</h2>
          <button class="btn-secondary" id="new-client-side">+ Novo cliente</button>
        </div>
        <p class="small muted">Clientes finalizados continuam preservados no sistema, mas saem da lista principal de eventos ativos.</p>
        <div class="contract-lines">
          ${state.clients.length?state.clients.map(c=>{
            const wedding=state.weddings.find(w=>w.client_user_id===c.id);
            const status=wedding?lifecycleStatus(wedding):'sem_casamento';
            return `<div class="contract-line lifecycle-client-line">
              <span>
                <strong>${esc(c.full_name||'Cliente')}</strong>
                <small>${esc(c.email||'e-mail não registrado')}</small>
              </span>
              <span class="badge ${status==='completed'?'info':status==='active'?'success':'warning'}">${status==='completed'?'Finalizado':status==='active'?'Ativo':'Sem casamento'}</span>
            </div>`;
          }).join(''):'<div class="muted">Nenhum cliente cadastrado.</div>'}
        </div>
      </div>
    </div>

    <div class="card card-pad lifecycle-completed-section">
      <div class="card-title">
        <div>
          <h2>Clientes finalizados</h2>
          <p class="small muted">Arquivo de eventos concluídos. Eles não aparecem mais na sua página inicial.</p>
        </div>
        <span class="lifecycle-count">${completed.length}</span>
      </div>
      <div class="wedding-cards">
        ${completed.length
          ? completed.map(w=>lifecycleWeddingCard(w,true)).join('')
          : emptyState('Nenhum cliente finalizado','Ao finalizar um evento, ele será movido para esta área.')}
      </div>
    </div>
  </div>`;
};

async function finalizeLifecycleWedding(weddingId){
  const wedding=state.weddings.find(w=>w.id===weddingId);
  if(!wedding) return;
  const ok=confirm(`Finalizar o cliente “${wedding.couple_name}”?\\n\\nO evento sairá da página inicial e ficará guardado em Clientes finalizados. Nenhum dado será apagado.`);
  if(!ok) return;

  const {error}=await sb.rpc('admin_finalize_client',{wedding_uuid:weddingId});
  if(error){
    console.error(error);
    toast('Não foi possível finalizar o cliente.');
    return;
  }

  if(state.selectedWeddingId===weddingId){
    state.selectedWeddingId=null;
    state.wedding=null;
    resetWeddingCollections();
  }

  await loadAdminData();
  goto('admin');
  toast('Cliente finalizado e arquivado com sucesso.');
  render();
}

async function reopenLifecycleWedding(weddingId){
  const wedding=state.weddings.find(w=>w.id===weddingId);
  if(!wedding) return;
  const ok=confirm(`Reabrir o cliente “${wedding.couple_name}”?\\n\\nEle voltará para a lista de clientes ativos.`);
  if(!ok) return;

  const {error}=await sb.rpc('admin_reopen_client',{wedding_uuid:weddingId});
  if(error){
    console.error(error);
    toast('Não foi possível reabrir o cliente.');
    return;
  }

  await loadAdminData();
  toast('Cliente reaberto e movido para ativos.');
  render();
}

async function deleteLifecycleClient(weddingId){
  const wedding=state.weddings.find(w=>w.id===weddingId);
  if(!wedding) return;
  const ok=confirm(`Excluir o cliente “${wedding.couple_name}”?\\n\\nEle será removido do painel e perderá o acesso à área dos noivos. Os dados ficam preservados no banco por segurança.`);
  if(!ok) return;

  const second=confirm('Confirma a exclusão deste cliente do painel?');
  if(!second) return;

  const {error}=await sb.rpc('admin_soft_delete_client',{wedding_uuid:weddingId});
  if(error){
    console.error(error);
    toast('Não foi possível excluir o cliente.');
    return;
  }

  if(state.selectedWeddingId===weddingId){
    state.selectedWeddingId=null;
    state.wedding=null;
    resetWeddingCollections();
  }

  await loadAdminData();
  goto('admin');
  toast('Cliente excluído do painel.');
  render();
}

const lifecycleBaseBindView=bindView;
bindView=function(r){
  lifecycleBaseBindView(r);

  document.querySelectorAll('[data-finalize-wedding]').forEach(btn=>{
    btn.onclick=()=>finalizeLifecycleWedding(btn.dataset.finalizeWedding);
  });

  document.querySelectorAll('[data-reopen-wedding]').forEach(btn=>{
    btn.onclick=()=>reopenLifecycleWedding(btn.dataset.reopenWedding);
  });

  document.querySelectorAll('[data-delete-client-wedding]').forEach(btn=>{
    btn.onclick=()=>deleteLifecycleClient(btn.dataset.deleteClientWedding);
  });
};
