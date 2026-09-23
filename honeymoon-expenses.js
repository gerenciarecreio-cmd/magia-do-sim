
Object.assign(state,{
  otherExpenseFilter: state.otherExpenseFilter || 'Todos',
  honeymoonFilter: state.honeymoonFilter || 'Todos'
});

const expensesNavIndex=navItems.findIndex(([key])=>key==='compras');
if(expensesNavIndex>=0){
  navItems[expensesNavIndex]=['outros-gastos','Outros Gastos','money'];
}
if(!navItems.some(([key])=>key==='lua-de-mel')){
  const idx=navItems.findIndex(([key])=>key==='outros-gastos');
  navItems.splice(idx>=0?idx+1:4,0,['lua-de-mel','Lua de mel','heart']);
}

const otherExpenseCategories=[
  'Decoração complementar',
  'Papelaria',
  'Lembrancinhas',
  'Roupa e acessórios',
  'Beleza',
  'Transporte',
  'Taxas',
  'Presentes',
  'Emergências',
  'Outros'
];

const honeymoonCategories=[
  'Passagens',
  'Hospedagem',
  'Passeios',
  'Alimentação',
  'Transporte',
  'Seguro viagem',
  'Documentos e vistos',
  'Compras',
  'Taxas',
  'Outros'
];

function expenseGroupOf(item){
  return item?.expense_group==='honeymoon'?'honeymoon':'other';
}

function expenseItems(group){
  return state.purchases.filter(item=>expenseGroupOf(item)===group);
}

function expenseTotals(group){
  const items=expenseItems(group);
  const all=items.reduce((s,p)=>s+Number(p.amount||0),0);
  const paid=items
    .filter(p=>p.status==='Pago')
    .reduce((s,p)=>s+Number(p.amount||0),0);
  const pending=items
    .filter(p=>p.status==='Pendente')
    .reduce((s,p)=>s+Number(p.amount||0),0);
  return {all,paid,pending,count:items.length};
}

purchaseTotals=function(group){
  if(group==='other'||group==='honeymoon') return expenseTotals(group);
  const other=expenseTotals('other');
  const honeymoon=expenseTotals('honeymoon');
  return {
    all:other.all+honeymoon.all,
    paid:other.paid+honeymoon.paid,
    pending:other.pending+honeymoon.pending,
    count:other.count+honeymoon.count
  };
};

function expenseView(group){
  const honeymoon=group==='honeymoon';
  const filterKey=honeymoon?'honeymoonFilter':'otherExpenseFilter';
  const filter=state[filterKey]||'Todos';
  const totals=expenseTotals(group);
  const items=expenseItems(group).filter(p=>filter==='Todos'||p.status===filter);

  const title=honeymoon?'Lua de mel':'Outros Gastos';
  const subtitle=honeymoon
    ?'Organize os gastos da viagem: passagens, hospedagem, passeios, alimentação e demais despesas.'
    :'Registre gastos complementares que não fazem parte dos contratos principais com fornecedores.';
  const button=honeymoon?'+ Novo gasto da viagem':'+ Novo gasto';

  return `<div class="page purchases-page ${honeymoon?'honeymoon-page':'other-expenses-page'}">
    <div class="page-head">
      <div>
        <h1>${title}</h1>
        <p>${subtitle} Valores pagos entram automaticamente no gasto total.</p>
      </div>
      <button class="btn-primary" id="new-purchase">${button}</button>
    </div>

    ${honeymoon?`<div class="card card-pad honeymoon-intro">
      <strong>Planejamento da lua de mel ♡</strong>
      <span>Use esta área para acompanhar o custo da viagem separado dos demais gastos do casamento.</span>
    </div>`:''}

    <div class="purchase-kpis">
      <div class="card purchase-kpi">
        <span>${honeymoon?'Total da viagem':'Total registrado'}</span>
        <strong>${brl(totals.all)}</strong>
        <small>${totals.count} lançamento(s)</small>
      </div>
      <div class="card purchase-kpi paid">
        <span>Pago</span>
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
        <button class="filter-btn ${filter===f?'active':''}" data-expense-filter="${f}" data-expense-group="${group}">${f}</button>
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
      `).join(''):emptyState(
        honeymoon?'Nenhum gasto de lua de mel registrado':'Nenhum gasto complementar registrado',
        honeymoon
          ?'Use “Novo gasto da viagem” para começar o planejamento financeiro da lua de mel.'
          :'Use “Novo gasto” para registrar despesas complementares do casamento.'
      )}
    </div>
  </div>`;
}

purchasesView=function(){
  return expenseView('other');
};

function honeymoonView(){
  return expenseView('honeymoon');
}

openPurchaseEditor=function(purchase){
  const routeName=route();
  const group=purchase
    ?expenseGroupOf(purchase)
    :(routeName==='lua-de-mel'?'honeymoon':'other');
  const honeymoon=group==='honeymoon';
  const categories=honeymoon?honeymoonCategories:otherExpenseCategories;

  const body=
    field(honeymoon?'Descrição do gasto':'Descrição','description',purchase?.description||'','text','required')+
    selectField('Categoria','category',categories,purchase?.category||categories[categories.length-1])+
    field(honeymoon?'Local / empresa / destino':'Loja / estabelecimento','store_name',purchase?.store_name||'')+
    field('Valor','amount',purchase?.amount||'','number','step="0.01" min="0.01" required')+
    field(honeymoon?'Data / vencimento':'Data','purchase_date',purchase?.purchase_date||'','date')+
    selectField(
      'Forma de pagamento',
      'payment_method',
      ['Pix','Cartão de crédito','Cartão de débito','Dinheiro','Boleto','Transferência','Outro'],
      purchase?.payment_method||'Pix'
    )+
    selectField('Status','status',['Pago','Pendente'],purchase?.status||'Pago')+
    `<div class="field"><label>Observações</label><textarea class="input purchase-notes-input" name="notes">${esc(purchase?.notes||'')}</textarea></div>`;

  modal(
    purchase
      ?(honeymoon?'Editar gasto da lua de mel':'Editar gasto')
      :(honeymoon?'Novo gasto da lua de mel':'Novo gasto'),
    body,
    purchase?'Salvar':'Registrar',
    async back=>{
      const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
      const description=String(f.description||'').trim();
      const amount=Number(f.amount||0);

      if(!description||amount<=0){
        toast('Informe a descrição e um valor válido.');
        return false;
      }

      const payload={
        wedding_id:state.wedding.id,
        expense_group:group,
        description,
        category:f.category||categories[categories.length-1],
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
        toast(honeymoon?'Não foi possível salvar o gasto da lua de mel.':'Não foi possível salvar o gasto.');
        return false;
      }

      await loadWeddingData(state.wedding.id);
      toast(
        purchase
          ?'Gasto atualizado.'
          :honeymoon?'Gasto da lua de mel registrado.':'Gasto complementar registrado.'
      );
      render();
      return true;
    }
  );
};

deletePurchase=async function(purchaseId){
  const purchase=state.purchases.find(p=>p.id===purchaseId);
  if(!purchase) return;

  const group=expenseGroupOf(purchase);
  const label=group==='honeymoon'?'gasto da lua de mel':'gasto';
  const ok=confirm(`Excluir o ${label} “${purchase.description}” de ${brl(Number(purchase.amount||0))}?`);
  if(!ok) return;

  const {error}=await sb.from('wedding_purchases').delete().eq('id',purchaseId);
  if(error){
    console.error(error);
    toast('Não foi possível excluir o gasto.');
    return;
  }

  await loadWeddingData(state.wedding.id);
  toast('Gasto excluído.');
  render();
};

financeView=function(){
  const vendorTotal=state.vendors.reduce((s,v)=>s+Number(v.amount||0),0);
  const vendorPaid=state.vendors.reduce((s,v)=>s+Number(v.paid||0),0);
  const vendorBalance=vendorTotal-vendorPaid;
  const other=expenseTotals('other');
  const honeymoon=expenseTotals('honeymoon');
  const totalSpent=vendorPaid+other.paid+honeymoon.paid;

  return `<div class="page wedding-finance-page">
    <div class="page-head">
      <div>
        <h1>Financeiro</h1>
        <p>Fornecedores, outros gastos e lua de mel reunidos em uma visão financeira completa.</p>
      </div>
      <div class="action-row">
        <button class="btn-secondary" onclick="location.hash='#/outros-gastos'">Outros Gastos</button>
        <button class="btn-secondary" onclick="location.hash='#/lua-de-mel'">Lua de mel</button>
        <button class="btn-primary" id="new-payment">Registrar pagamento</button>
      </div>
    </div>

    <div class="finance-totals finance-totals-5">
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
        <span>Outros gastos pagos</span>
        <strong>${brl(other.paid)}</strong>
        <small>Pendente: ${brl(other.pending)}</small>
      </div>
      <div class="card money-card honeymoon-money-card">
        <span>Lua de mel paga</span>
        <strong>${brl(honeymoon.paid)}</strong>
        <small>Pendente: ${brl(honeymoon.pending)}</small>
      </div>
      <div class="card money-card total-spent-card">
        <span>Gasto total geral</span>
        <strong>${brl(totalSpent)}</strong>
        <small>Fornecedores + outros gastos + lua de mel pagos</small>
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

    <div class="grid grid-2 expense-finance-sections">
      <div class="card card-pad finance-section-head">
        <div class="card-title"><h2>Outros Gastos</h2><a href="#/outros-gastos" class="sub">Ver todos ›</a></div>
        ${expenseItems('other').length
          ?expenseItems('other').slice(0,5).map(p=>`
            <div class="finance-purchase-row">
              <div><strong>${esc(p.description)}</strong><span>${dateBR(p.purchase_date)} • ${esc(p.category||'Outros')}</span></div>
              <span class="badge ${p.status==='Pago'?'success':'warning'}">${esc(p.status)}</span>
              <strong>${brl(Number(p.amount||0))}</strong>
            </div>
          `).join('')
          :emptyState('Nenhum outro gasto','Despesas complementares aparecerão aqui.')}
      </div>

      <div class="card card-pad finance-section-head honeymoon-finance-section">
        <div class="card-title"><h2>Lua de mel</h2><a href="#/lua-de-mel" class="sub">Ver planejamento ›</a></div>
        ${expenseItems('honeymoon').length
          ?expenseItems('honeymoon').slice(0,5).map(p=>`
            <div class="finance-purchase-row">
              <div><strong>${esc(p.description)}</strong><span>${dateBR(p.purchase_date)} • ${esc(p.category||'Outros')}</span></div>
              <span class="badge ${p.status==='Pago'?'success':'warning'}">${esc(p.status)}</span>
              <strong>${brl(Number(p.amount||0))}</strong>
            </div>
          `).join('')
          :emptyState('Lua de mel ainda sem gastos','Passagens, hospedagem, passeios e demais despesas aparecerão aqui.')}
      </div>
    </div>
  </div>`;
};

const honeymoonBaseViewFor=viewFor;
viewFor=function(r){
  if((r==='outros-gastos'||r==='compras')&&state.wedding) return expenseView('other');
  if(r==='lua-de-mel'&&state.wedding) return honeymoonView();
  return honeymoonBaseViewFor(r);
};

const honeymoonBaseBindView=bindView;
bindView=function(r){
  honeymoonBaseBindView(r);

  document.querySelectorAll('[data-expense-filter]').forEach(btn=>{
    btn.onclick=()=>{
      const group=btn.dataset.expenseGroup;
      if(group==='honeymoon') state.honeymoonFilter=btn.dataset.expenseFilter;
      else state.otherExpenseFilter=btn.dataset.expenseFilter;
      render();
    };
  });
};
