
Object.assign(state,{
  purchases: state.purchases || [],
  purchaseFilter: state.purchaseFilter || 'Todos'
});

if(!navItems.some(([key])=>key==='compras')){
  const vendorIndex=navItems.findIndex(([key])=>key==='fornecedores');
  navItems.splice(vendorIndex>=0?vendorIndex+1:3,0,['compras','Compras','money']);
}

const purchaseCategories=[
  'Decoração',
  'Papelaria',
  'Lembrancinhas',
  'Roupa e acessórios',
  'Beleza',
  'Transporte',
  'Taxas',
  'Presentes',
  'Outros'
];

const vendorPurchasesBaseReset=resetWeddingCollections;
resetWeddingCollections=function(){
  vendorPurchasesBaseReset();
  state.purchases=[];
};

const vendorPurchasesBaseLoad=loadWeddingData;
loadWeddingData=async function(weddingId){
  await vendorPurchasesBaseLoad(weddingId);
  if(!weddingId){
    state.purchases=[];
    return;
  }
  const {data,error}=await sb
    .from('wedding_purchases')
    .select('*')
    .eq('wedding_id',weddingId)
    .order('purchase_date',{ascending:false})
    .order('created_at',{ascending:false});

  if(error){
    console.error(error);
    state.purchases=[];
    return;
  }
  state.purchases=data||[];
};

function vendorSourceLabel(v){
  return v?.masterSupplierId?'Cadastro geral':'Fornecedor próprio';
}

vendorsView=function(){
  const items=state.vendors.filter(v=>state.vendorFilter==='Todos'||v.status===state.vendorFilter);
  const actionLabel=state.role==='admin'?'+ Vincular fornecedor':'+ Cadastrar fornecedor';

  return `<div class="page wedding-vendors-page">
    <div class="page-head">
      <div>
        <h1>Fornecedores</h1>
        <p>${state.role==='client'
          ?'Cadastre seus próprios fornecedores e acompanhe valores, pagamentos e andamento.'
          :'Acompanhe os fornecedores deste casamento e vincule fornecedores próprios ao cadastro geral quando desejar.'}</p>
      </div>
      <button class="btn-primary" id="new-vendor">${actionLabel}</button>
    </div>

    ${state.role==='client'?`<div class="card card-pad vendor-own-info">
      <strong>Fornecedor dos noivos</strong>
      <span>O fornecedor cadastrado aqui fica somente neste casamento. Ele não entra automaticamente no cadastro geral da assessoria.</span>
    </div>`:''}

    <div class="filters">
      ${['Todos','Contratado','Em negociação','Pendente','Em andamento'].map(f=>`
        <button class="filter-btn ${state.vendorFilter===f?'active':''}" data-vendor-filter="${f}">${f}</button>
      `).join('')}
    </div>

    <div class="card list-card vendor-list-card">
      ${items.length?items.map(v=>`
        <div class="vendor-list-item">
          <a href="#/fornecedores/${v.id}" class="list-row vendor-row vendor-row-with-source vendor-list-link">
            <div class="thumb">${esc((v.category||'F')[0])}</div>
            <div class="vendor-name">
              <strong>${esc(v.name)}</strong>
              <span>${esc(v.category)} • ${vendorSourceLabel(v)}</span>
            </div>
            <div class="category">${esc(v.category)}</div>
            <span class="badge ${statusClass(v.status)}">${esc(v.status)}</span>
            ${icons.chevron}
          </a>
        </div>
      `).join(''):emptyState(
        'Ainda não há fornecedores neste filtro.',
        state.role==='client'
          ?'Use “Cadastrar fornecedor” para adicionar um fornecedor do casamento.'
          :'Vincule um fornecedor do cadastro geral ou mantenha um fornecedor próprio deste casamento.'
      )}
    </div>
  </div>`;
};

vendorDetailView=function(id){
  const v=state.vendors.find(x=>x.id===id);
  if(!v) return noWeddingView();
  const balance=v.amount-v.paid;
  const canDelete=state.role==='admin'||!v.masterSupplierId;

  return `<div class="page">
    <div class="page-head">
      <div>
        <button class="link-btn" onclick="history.back()">← Voltar</button>
        <h1 style="margin-top:8px">${esc(v.category)}</h1>
        <p>${esc(v.name)} • ${vendorSourceLabel(v)}</p>
      </div>
      <span class="badge ${statusClass(v.status)}">${esc(v.status)}</span>
    </div>

    <div class="supplier-detail">
      <div class="card card-pad">
        <div class="supplier-profile">
          <div class="supplier-big-avatar">${esc((v.category||'F')[0])}</div>
          <div>
            <h2 class="serif" style="margin:0;color:var(--brown);font-weight:500">${esc(v.name)}</h2>
            <span class="small muted">${esc(v.category)} • ${vendorSourceLabel(v)}</span>
          </div>
        </div>
        <div class="contact-list">
          <div class="contact-item">☎ ${esc(v.phone)}</div>
          <div class="contact-item">◎ ${esc(v.instagram)}</div>
          <div class="contact-item">⌁ ${esc(v.site)}</div>
        </div>
        <div class="action-row">
          <button class="btn-secondary" id="edit-vendor">Editar fornecedor</button>
          <button class="btn-secondary" id="add-note">Adicionar observação</button>
          ${state.role==='admin'&&!v.masterSupplierId?`<button class="btn-secondary" data-promote-vendor="${v.id}">Adicionar ao cadastro geral</button>`:''}\n          ${canDelete?`<button class="btn-danger" data-delete-vendor="${v.id}">Excluir fornecedor</button>`:''}
        </div>
        <div class="notes"><strong style="color:var(--brown)">Observações</strong><br>${esc(v.note)}</div>
      </div>

      <div class="card card-pad">
        <div class="card-title"><h2>Informações financeiras</h2></div>
        <div class="contract-lines">
          <div class="contract-line"><span>Valor contratado</span><strong>${brl(v.amount)}</strong></div>
          <div class="contract-line"><span>Valor pago</span><strong>${brl(v.paid)} (${pct(v.paid,v.amount)}%)</strong></div>
          <div class="contract-line"><span>Saldo</span><strong>${brl(balance)}</strong></div>
          <div class="contract-line"><span>Data da contratação</span><strong>${dateBR(v.contractDate)}</strong></div>
          <div class="contract-line"><span>Data limite</span><strong>${dateBR(v.dueDate)}</strong></div>
        </div>
        <div class="action-row">
          <button class="btn-secondary" id="view-contract">Ver contrato</button>
          <button class="btn-primary" id="register-payment" data-vendor="${v.id}">Registrar pagamento</button>
        </div>
      </div>
    </div>
  </div>`;
};

openVendorEditor=function(v){
  const isAdmin=state.role==='admin';
  const isLinked=!!v?.masterSupplierId;

  const supplierOptions=[{value:'',label:'Não vincular ao cadastro geral'}].concat(
    (state.suppliers||[])
      .filter(s=>s.active!==false||s.id===v?.masterSupplierId)
      .map(s=>({value:s.id,label:`${s.category||'Fornecedor'} — ${s.name}`}))
  );

  let identityFields='';

  if(isAdmin){
    identityFields+=selectField(
      'Vincular ao cadastro geral (opcional)',
      'supplier_id',
      supplierOptions,
      v?.masterSupplierId||''
    );
    identityFields+=`<div class="field vendor-link-help">
      <small class="muted">Se escolher um cadastro geral, os dados principais serão vinculados a ele. Se deixar sem vínculo, este fornecedor continuará exclusivo deste casamento.</small>
    </div>`;
  }

  if(state.role==='client'&&isLinked){
    identityFields+=`
      <div class="vendor-linked-summary">
        <strong>${esc(v.name)}</strong>
        <span>${esc(v.category)} • vinculado pela assessoria</span>
      </div>`;
  }else{
    identityFields+=
      field('Nome do fornecedor','name',v?.name||'','text','required')+
      field('Categoria / serviço','category',v?.category||'','text','required')+
      field('Telefone','phone',(v?.phone&&v.phone!=='—')?v.phone:'','tel')+
      field('Instagram','instagram',(v?.instagram&&v.instagram!=='—')?v.instagram:'')+
      field('Site','website',(v?.site&&v.site!=='—')?v.site:'','url');
  }

  const body=identityFields+
    selectField('Status deste casamento','status',['Pendente','Em negociação','Em andamento','Contratado'],v?.status||'Pendente')+
    field('Valor contratado','contract_value',v?.amount||0,'number','step="0.01" min="0"')+
    field('Valor pago','paid_value',v?.paid||0,'number','step="0.01" min="0"')+
    field('Data da contratação','contract_date',v?.contractDate||'','date')+
    field('Data limite','due_date',v?.dueDate||'','date')+
    `<div class="field"><label>Observações</label><textarea class="input vendor-editor-notes" name="notes">${esc(v?.note==='Sem observações.'?'':v?.note||'')}</textarea></div>`;

  modal(
    v?'Editar fornecedor':(isAdmin?'Vincular fornecedor':'Cadastrar fornecedor'),
    body,
    v?'Salvar':'Cadastrar',
    async back=>{
      const form=back.querySelector('.modal');
      const f=Object.fromEntries(new FormData(form).entries());

      let master=null;
      if(isAdmin&&f.supplier_id){
        master=state.suppliers.find(s=>s.id===f.supplier_id)||null;
        if(!master){
          toast('Fornecedor do cadastro geral não encontrado.');
          return false;
        }
      }

      const manualName=String(f.name||v?.name||'').trim();
      const manualCategory=String(f.category||v?.category||'').trim();

      if(!master&&(!manualName||!manualCategory)){
        toast('Informe o nome e a categoria do fornecedor.');
        return false;
      }

      const payload={
        wedding_id:state.wedding.id,
        supplier_id:isAdmin?(f.supplier_id||null):(v?.masterSupplierId||null),
        category:master?.category||manualCategory,
        name:master?.name||manualName,
        phone:master?.phone||String(f.phone||((v?.phone&&v.phone!=='—')?v.phone:'')).trim()||null,
        instagram:master?.instagram||String(f.instagram||((v?.instagram&&v.instagram!=='—')?v.instagram:'')).trim()||null,
        website:master?.website||String(f.website||((v?.site&&v.site!=='—')?v.site:'')).trim()||null,
        status:f.status||'Pendente',
        contract_value:Number(f.contract_value||0),
        paid_value:Number(f.paid_value||0),
        contract_date:f.contract_date||null,
        due_date:f.due_date||null,
        notes:String(f.notes||'').trim()||null
      };

      const res=v
        ? await sb.from('vendors').update(payload).eq('id',v.id)
        : await sb.from('vendors').insert(payload);

      if(res.error){
        console.error(res.error);
        toast('Não foi possível salvar o fornecedor.');
        return false;
      }

      await loadWeddingData(state.wedding.id);
      toast(
        master
          ?'Fornecedor salvo e vinculado ao cadastro geral.'
          :v?'Fornecedor atualizado.':'Fornecedor cadastrado neste casamento.'
      );
      render();
      return true;
    }
  );
};

async function promoteVendorToMaster(vendorId){
  const vendor=state.vendors.find(v=>v.id===vendorId);
  if(!vendor||state.role!=='admin'||vendor.masterSupplierId) return;

  const ok=confirm(`Adicionar “${vendor.name}” ao cadastro geral de fornecedores?\\n\\nEle continuará vinculado a este casamento e também ficará disponível para outros eventos.`);
  if(!ok) return;

  const {data:master,error:createError}=await sb
    .from('suppliers')
    .insert({
      name:vendor.name,
      category:vendor.category||null,
      phone:vendor.phone&&vendor.phone!=='—'?vendor.phone:null,
      instagram:vendor.instagram&&vendor.instagram!=='—'?vendor.instagram:null,
      website:vendor.site&&vendor.site!=='—'?vendor.site:null,
      notes:vendor.note&&vendor.note!=='Sem observações.'?vendor.note:null,
      active:true
    })
    .select()
    .single();

  if(createError){
    console.error(createError);
    toast('Não foi possível adicionar ao cadastro geral.');
    return;
  }

  const {error:linkError}=await sb
    .from('vendors')
    .update({supplier_id:master.id})
    .eq('id',vendorId);

  if(linkError){
    console.error(linkError);
    await sb.from('suppliers').delete().eq('id',master.id);
    toast('Não foi possível vincular o fornecedor ao cadastro geral.');
    return;
  }

  await loadAdminData();
  if(state.wedding) await loadWeddingData(state.wedding.id);
  toast('Fornecedor adicionado ao cadastro geral e vinculado ao casamento.');
  render();
}

async function deleteWeddingVendor(vendorId){
  const vendor=state.vendors.find(v=>v.id===vendorId);
  if(!vendor) return;
  if(state.role!=='admin'&&vendor.masterSupplierId){
    toast('Este fornecedor está vinculado pela assessoria.');
    return;
  }

  const linkedPayments=(state.payments||[]).filter(p=>p.vendor_id===vendorId);
  const paymentWarning=linkedPayments.length
    ? `\n\nTambém serão excluídos ${linkedPayments.length} pagamento(s) vinculado(s) a este fornecedor neste casamento.`
    : '';

  const ok=confirm(
    `Excluir o fornecedor “${vendor.name}” deste casamento?${paymentWarning}\n\nEsta ação não exclui o fornecedor do cadastro geral da assessoria.`
  );
  if(!ok) return;

  if(linkedPayments.length){
    const {error:paymentError}=await sb
      .from('payments')
      .delete()
      .eq('wedding_id',state.wedding.id)
      .eq('vendor_id',vendorId);

    if(paymentError){
      console.error(paymentError);
      toast('Não foi possível excluir os pagamentos vinculados ao fornecedor.');
      return;
    }
  }

  const {error}=await sb
    .from('vendors')
    .delete()
    .eq('wedding_id',state.wedding.id)
    .eq('id',vendorId);

  if(error){
    console.error(error);
    toast('Não foi possível excluir o fornecedor.');
    return;
  }

  await loadWeddingData(state.wedding.id);
  if(route().startsWith('fornecedores/')) goto('fornecedores');
  else render();
  toast('Fornecedor excluído deste casamento.');
}

function purchaseTotals(){
  const all=state.purchases.reduce((s,p)=>s+Number(p.amount||0),0);
  const paid=state.purchases
    .filter(p=>p.status==='Pago')
    .reduce((s,p)=>s+Number(p.amount||0),0);
  const pending=state.purchases
    .filter(p=>p.status==='Pendente')
    .reduce((s,p)=>s+Number(p.amount||0),0);
  return {all,paid,pending,count:state.purchases.length};
}

function purchasesView(){
  const totals=purchaseTotals();
  const items=state.purchases.filter(p=>state.purchaseFilter==='Todos'||p.status===state.purchaseFilter);

  return `<div class="page purchases-page">
    <div class="page-head">
      <div>
        <h1>Compras</h1>
        <p>Registre compras e pagamentos avulsos do casamento. Os valores pagos entram automaticamente no gasto total.</p>
      </div>
      <button class="btn-primary" id="new-purchase">+ Nova compra</button>
    </div>

    <div class="purchase-kpis">
      <div class="card purchase-kpi">
        <span>Total registrado</span>
        <strong>${brl(totals.all)}</strong>
        <small>${totals.count} lançamento(s)</small>
      </div>
      <div class="card purchase-kpi paid">
        <span>Compras pagas</span>
        <strong>${brl(totals.paid)}</strong>
        <small>Incluído no gasto total</small>
      </div>
      <div class="card purchase-kpi pending">
        <span>Pendente</span>
        <strong>${brl(totals.pending)}</strong>
        <small>Ainda não entra no gasto total</small>
      </div>
    </div>

    <div class="filters">
      ${['Todos','Pago','Pendente'].map(f=>`
        <button class="filter-btn ${state.purchaseFilter===f?'active':''}" data-purchase-filter="${f}">${f}</button>
      `).join('')}
    </div>

    <div class="card purchase-list">
      ${items.length?items.map(p=>`
        <div class="purchase-row">
          <div class="purchase-row-main">
            <strong>${esc(p.description)}</strong>
            <span>${esc(p.category||'Outros')}${p.store_name?` • ${esc(p.store_name)}`:''}${p.payment_method?` • ${esc(p.payment_method)}`:''}</span>
          </div>
          <div class="purchase-date">${dateBR(p.purchase_date)}</div>
          <span class="badge ${p.status==='Pago'?'success':'warning'}">${esc(p.status)}</span>
          <strong class="purchase-amount">${brl(Number(p.amount||0))}</strong>
          <div class="purchase-actions">
            <button class="btn-secondary" data-edit-purchase="${p.id}">Editar</button>
            <button class="btn-danger" data-delete-purchase="${p.id}">Excluir</button>
          </div>
        </div>
      `).join(''):emptyState('Nenhuma compra registrada','Use “Nova compra” para lançar pagamentos avulsos do casamento.')}
    </div>
  </div>`;
}

function openPurchaseEditor(purchase){
  const body=
    field('Descrição','description',purchase?.description||'','text','required')+
    selectField('Categoria','category',purchaseCategories,purchase?.category||'Outros')+
    field('Loja / estabelecimento','store_name',purchase?.store_name||'')+
    field('Valor','amount',purchase?.amount||'','number','step="0.01" min="0.01" required')+
    field('Data','purchase_date',purchase?.purchase_date||'','date')+
    selectField(
      'Forma de pagamento',
      'payment_method',
      ['Pix','Cartão de crédito','Cartão de débito','Dinheiro','Boleto','Transferência','Outro'],
      purchase?.payment_method||'Pix'
    )+
    selectField('Status','status',['Pago','Pendente'],purchase?.status||'Pago')+
    `<div class="field"><label>Observações</label><textarea class="input purchase-notes-input" name="notes">${esc(purchase?.notes||'')}</textarea></div>`;

  modal(purchase?'Editar compra':'Nova compra',body,purchase?'Salvar':'Registrar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    const description=String(f.description||'').trim();
    const amount=Number(f.amount||0);

    if(!description||amount<=0){
      toast('Informe a descrição e um valor válido.');
      return false;
    }

    const payload={
      wedding_id:state.wedding.id,
      description,
      category:f.category||'Outros',
      store_name:String(f.store_name||'').trim()||null,
      amount,
      purchase_date:f.purchase_date||null,
      payment_method:f.payment_method||null,
      status:f.status||'Pago',
      notes:String(f.notes||'').trim()||null
    };

    const res=purchase
      ?await sb.from('wedding_purchases').update(payload).eq('id',purchase.id)
      :await sb.from('wedding_purchases').insert(payload);

    if(res.error){
      console.error(res.error);
      toast('Não foi possível salvar a compra.');
      return false;
    }

    await loadWeddingData(state.wedding.id);
    toast(purchase?'Compra atualizada.':'Compra registrada no gasto do casamento.');
    render();
    return true;
  });
}

async function deletePurchase(purchaseId){
  const purchase=state.purchases.find(p=>p.id===purchaseId);
  if(!purchase) return;

  const ok=confirm(`Excluir a compra “${purchase.description}” de ${brl(Number(purchase.amount||0))}?`);
  if(!ok) return;

  const {error}=await sb.from('wedding_purchases').delete().eq('id',purchaseId);
  if(error){
    console.error(error);
    toast('Não foi possível excluir a compra.');
    return;
  }

  await loadWeddingData(state.wedding.id);
  toast('Compra excluída.');
  render();
}

financeView=function(){
  const vendorTotal=state.vendors.reduce((s,v)=>s+Number(v.amount||0),0);
  const vendorPaid=state.vendors.reduce((s,v)=>s+Number(v.paid||0),0);
  const vendorBalance=vendorTotal-vendorPaid;
  const purchases=purchaseTotals();
  const totalSpent=vendorPaid+purchases.paid;

  return `<div class="page wedding-finance-page">
    <div class="page-head">
      <div>
        <h1>Financeiro</h1>
        <p>Fornecedores e compras avulsas reunidos no gasto total do casamento.</p>
      </div>
      <div class="action-row">
        <button class="btn-secondary" onclick="location.hash='#/compras'">Abrir compras</button>
        <button class="btn-primary" id="new-payment">Registrar pagamento</button>
      </div>
    </div>

    <div class="finance-totals finance-totals-4">
      <div class="card money-card">
        <span>Valor contratado</span>
        <strong>${brl(vendorTotal)}</strong>
        <small>Contratos com fornecedores</small>
      </div>
      <div class="card money-card">
        <span>Pago a fornecedores</span>
        <strong>${brl(vendorPaid)}</strong>
        <small>Saldo: ${brl(vendorBalance)}</small>
      </div>
      <div class="card money-card">
        <span>Compras avulsas pagas</span>
        <strong>${brl(purchases.paid)}</strong>
        <small>Pendente: ${brl(purchases.pending)}</small>
      </div>
      <div class="card money-card total-spent-card">
        <span>Gasto total</span>
        <strong>${brl(totalSpent)}</strong>
        <small>Fornecedores pagos + compras pagas</small>
      </div>
    </div>

    <div class="card card-pad finance-section-head">
      <div class="card-title"><h2>Fornecedores</h2><a href="#/fornecedores" class="sub">Ver fornecedores ›</a></div>
      <div class="list-card finance-inner-list">
        ${state.vendors.length?state.vendors.map(v=>`
          <div class="list-row payment-row">
            <div class="vendor-name"><strong>${esc(v.category)}</strong><span>${esc(v.name)}</span></div>
            <div class="small">${brl(v.amount)}</div>
            <div class="paid small muted">${brl(v.paid)}</div>
            <div class="balance small muted">${brl(v.amount-v.paid)}</div>
            <div><div class="mini-progress"><div style="width:${pct(v.paid,v.amount)}%"></div></div><span class="tiny muted">${pct(v.paid,v.amount)}% pago</span></div>
          </div>
        `).join(''):emptyState('Sem fornecedores financeiros','Cadastre fornecedores e valores de contrato.')}
      </div>
    </div>

    <div class="card card-pad finance-section-head">
      <div class="card-title"><h2>Compras avulsas</h2><a href="#/compras" class="sub">Ver todas ›</a></div>
      ${state.purchases.length
        ?state.purchases.slice(0,5).map(p=>`
          <div class="finance-purchase-row">
            <div><strong>${esc(p.description)}</strong><span>${dateBR(p.purchase_date)} • ${esc(p.category||'Outros')}</span></div>
            <span class="badge ${p.status==='Pago'?'success':'warning'}">${esc(p.status)}</span>
            <strong>${brl(Number(p.amount||0))}</strong>
          </div>
        `).join('')
        :emptyState('Nenhuma compra avulsa','As compras registradas aparecerão aqui e, quando pagas, serão somadas ao gasto total.')}
    </div>
  </div>`;
};

const vendorPurchasesBaseViewFor=viewFor;
viewFor=function(r){
  if(r==='compras'&&state.wedding) return purchasesView();
  return vendorPurchasesBaseViewFor(r);
};

const vendorPurchasesBaseBind=bindView;
bindView=function(r){
  vendorPurchasesBaseBind(r);

  document.querySelectorAll('[data-promote-vendor]').forEach(btn=>{
    btn.onclick=()=>promoteVendorToMaster(btn.dataset.promoteVendor);
  });

  document.querySelectorAll('[data-delete-vendor]').forEach(btn=>{
    btn.onclick=()=>deleteWeddingVendor(btn.dataset.deleteVendor);
  });

  document.querySelectorAll('[data-purchase-filter]').forEach(btn=>{
    btn.onclick=()=>{
      state.purchaseFilter=btn.dataset.purchaseFilter;
      render();
    };
  });

  const newPurchase=document.getElementById('new-purchase');
  if(newPurchase) newPurchase.onclick=()=>openPurchaseEditor(null);

  document.querySelectorAll('[data-edit-purchase]').forEach(btn=>{
    btn.onclick=()=>openPurchaseEditor(state.purchases.find(p=>p.id===btn.dataset.editPurchase));
  });

  document.querySelectorAll('[data-delete-purchase]').forEach(btn=>{
    btn.onclick=()=>deletePurchase(btn.dataset.deletePurchase);
  });
};
