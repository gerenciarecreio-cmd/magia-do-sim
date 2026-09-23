/* A Magia do Sim — módulos da assessoria
   Cerimonial + Organização da Casa + Lua de Mel
   ADMIN e NOIVOS podem editar o casamento selecionado/próprio.
*/

Object.assign(state,{
  ceremonyItems:state.ceremonyItems||[],
  ceremonyFinance:state.ceremonyFinance||[],
  ceremonyShare:state.ceremonyShare||null,
  ceremonyTab:state.ceremonyTab||'agenda',
  homeItems:state.homeItems||[],
  homePayments:state.homePayments||[],
  homeTab:state.homeTab||'dashboard',
  homeFilter:state.homeFilter||'Todos',
  honeymoonPlannerItems:state.honeymoonPlannerItems||[],
  honeymoonTab:state.honeymoonTab||'dashboard'
});

const AMS_HOME_ROOMS=[
  'Cozinha','Sala','Quarto','Banheiro','Lavanderia',
  'Cama, mesa e banho','Eletrodomésticos','Decoração','Organização','Presentes e compras'
];

const AMS_ENXOVAL_SUGGESTIONS=[
  {title:'Cozinha — panelas e preparo',room:'Cozinha',items:['Faqueiro completo','Jogo de panelas','Panela de pressão','Cuscuzeira','Frigideira pequena','Assadeiras retangulares','Forma para bolos','Forma de pizza','Tigelas e potes pequenos','Kit de tábuas','Escorredor de macarrão','Ralador','Descascador de batata']},
  {title:'Eletroportáteis',room:'Eletrodomésticos',items:['Liquidificador','Batedeira','Mixer','Chaleira','Cafeteira','Sanduicheira','Air fryer','Aspirador de pó','Ferro de passar']},
  {title:'Café, bebidas e café da manhã',room:'Cozinha',items:['Kit de copos','Jogo de xícaras','Jogo de xícaras com pires','Garrafa de café','Garrafa para suco','Jarra para suco','Leiteira','Bandeja para café da manhã','Cesta para pães']},
  {title:'Louças e mesa posta',room:'Cama, mesa e banho',items:['Pratos rasos','Pratos fundos','Pratos de sobremesa','Cumbucas pequenas','Jogo de sousplats','Guardanapos de tecido','Porta-guardanapos','Taças para água e suco','Taças para vinho']},
  {title:'Cama',room:'Quarto',items:['Cobertor','Manta','Colcha ou cobre-leito','Jogos de lençol completos','Lençóis de elástico','Fronhas extras','Travesseiros','Protetores de travesseiro','Protetor impermeável de colchão','Edredom']},
  {title:'Banheiro e lavabo',room:'Banheiro',items:['Tapetes para lavabo','Porta-papel higiênico','Toalhas de rosto','Toalhas de banho','Difusor ou aromatizador','Lixeira pequena','Saboneteira','Dispenser para sabonete líquido','Porta-escovas de dentes']},
  {title:'Lavanderia e limpeza',room:'Lavanderia',items:['Potes para sabão em pó','Cesto para roupas limpas','Varal','Balde','Bacia','Vassoura','Rodo','Pá de lixo','Panos de chão','Esponjas de limpeza','Escovas de limpeza']},
  {title:'Organização de roupas',room:'Organização',items:['Cabides','Colmeias organizadoras','Organizadores de roupas íntimas','Organizadores para sapatos','Caixas organizadoras','Sacos a vácuo','Cestos organizadores']}
];

function amsNormalize(v){return String(v||'').trim().toLocaleLowerCase('pt-BR');}
async function amsQuery(builder){
  const {data,error}=await builder;
  if(error){console.warn('A Magia do Sim módulos:',error);return [];}
  return data||[];
}

const amsBaseReset=resetWeddingCollections;
resetWeddingCollections=function(){
  amsBaseReset();
  state.ceremonyItems=[];
  state.ceremonyFinance=[];
  state.ceremonyShare=null;
  state.homeItems=[];
  state.homePayments=[];
  state.honeymoonPlannerItems=[];
};

async function amsLoadModules(weddingId){
  if(!weddingId)return;
  const [ceremony,finance,share,home,payments,honeymoon]=await Promise.all([
    amsQuery(sb.from('ceremony_items').select('*').eq('wedding_id',weddingId).order('order_index',{ascending:true}).order('scheduled_time',{ascending:true})),
    amsQuery(sb.from('module_financial_entries').select('*').eq('wedding_id',weddingId).eq('module_slug','cerimonial').order('due_date',{ascending:true})),
    amsQuery(sb.from('ceremony_share_links').select('share_code,active').eq('wedding_id',weddingId).limit(1)),
    amsQuery(sb.from('home_organization_items').select('*').eq('wedding_id',weddingId).order('room').order('item_name')),
    amsQuery(sb.from('home_item_payments').select('*').eq('wedding_id',weddingId).order('payment_date',{ascending:false})),
    amsQuery(sb.from('honeymoon_planner_items').select('*').eq('wedding_id',weddingId).order('item_date',{ascending:true}).order('item_time',{ascending:true}))
  ]);
  state.ceremonyItems=ceremony;
  state.ceremonyFinance=finance;
  state.ceremonyShare=share[0]||null;
  state.homeItems=home;
  state.homePayments=payments;
  state.honeymoonPlannerItems=honeymoon;
}

const amsBaseLoadWeddingData=loadWeddingData;
loadWeddingData=async function(weddingId){
  await amsBaseLoadWeddingData(weddingId);
  await amsLoadModules(weddingId);
};

if(!navItems.some(x=>x[0]==='cerimonial')){
  const i=navItems.findIndex(x=>x[0]==='cronograma');
  navItems.splice(i>=0?i+1:navItems.length,0,['cerimonial','Cerimonial','calendar']);
}
if(!navItems.some(x=>x[0]==='organizacao-casa')){
  const i=navItems.findIndex(x=>x[0]==='cerimonial');
  navItems.splice(i>=0?i+1:navItems.length,0,['organizacao-casa','Organização da casa','home']);
}

function amsCanonicalCeremony(section){
  if(section==='Cronograma')return 'Agenda';
  if(section==='Momentos especiais')return 'Momentos';
  if(['Cortejo','Músicas','Responsáveis','Fornecedores','Observações'].includes(section))return 'Cerimônia';
  return ['Roteiro','Agenda','Cerimônia','Momentos'].includes(section)?section:'Agenda';
}
function amsCeremonyRows(section){
  if(section==='Agenda'){
    return [...state.ceremonyItems].filter(x=>x.scheduled_time).sort((a,b)=>String(a.scheduled_time).localeCompare(String(b.scheduled_time))||Number(a.order_index||0)-Number(b.order_index||0));
  }
  return [...state.ceremonyItems].filter(x=>amsCanonicalCeremony(x.section)===section).sort((a,b)=>Number(a.order_index||0)-Number(b.order_index||0));
}
function amsNextCeremonyOrder(section){
  return amsCeremonyRows(section).reduce((m,x)=>Math.max(m,Number(x.order_index||0)),0)+1;
}
function amsOpenCeremonyEditor(section,item){
  const s=section||amsCanonicalCeremony(item?.section||'Agenda');
  let body=field('Título / atividade','title',item?.title||'');
  if(s!=='Roteiro')body+=field('Horário','scheduled_time',item?.scheduled_time?String(item.scheduled_time).slice(0,5):'','time');
  else body+=field('Horário opcional','scheduled_time',item?.scheduled_time?String(item.scheduled_time).slice(0,5):'','time');
  body+=field('Responsável','responsible',item?.responsible||'');
  if(s!=='Roteiro'){
    body+=field('Participantes','participants',item?.participants||'')+
      field('Música','music',item?.music||'')+
      field('Fornecedor','vendor',item?.vendor||'')+
      field('Local','location',item?.location||'');
  }
  if(['Cerimônia','Momentos'].includes(s))body+=field('Ordem','order_index',item?.order_index||amsNextCeremonyOrder(s),'number','min="1"');
  body+=`<div class="field"><label>Observações</label><textarea class="input ams-textarea" name="notes">${esc(item?.notes||'')}</textarea></div>`;
  modal(item?'Editar item':'Adicionar item',body,item?'Salvar':'Adicionar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    if(!String(f.title||'').trim()){toast('Informe o título.');return false;}
    const payload={
      wedding_id:state.wedding.id,section:s,title:String(f.title).trim(),
      scheduled_time:f.scheduled_time||null,
      order_index:['Cerimônia','Momentos'].includes(s)?Math.max(1,Number(f.order_index||1)):Number(item?.order_index||amsNextCeremonyOrder(s)),
      responsible:String(f.responsible||'').trim()||null,
      participants:String(f.participants||'').trim()||null,
      music:String(f.music||'').trim()||null,
      vendor:String(f.vendor||'').trim()||null,
      location:String(f.location||'').trim()||null,
      notes:String(f.notes||'').trim()||null,
      completed:!!item?.completed,
      updated_at:new Date().toISOString()
    };
    const res=item?await sb.from('ceremony_items').update(payload).eq('id',item.id):await sb.from('ceremony_items').insert(payload);
    if(res.error){console.error(res.error);toast('Não foi possível salvar.');return false;}
    await loadWeddingData(state.wedding.id);render();return true;
  });
}
async function amsToggleCeremony(id){
  const item=state.ceremonyItems.find(x=>x.id===id); if(!item)return;
  const {error}=await sb.from('ceremony_items').update({completed:!item.completed,updated_at:new Date().toISOString()}).eq('id',id);
  if(error){toast('Não foi possível atualizar.');return;}
  await loadWeddingData(state.wedding.id);render();
}
async function amsMoveCeremony(id,dir){
  const item=state.ceremonyItems.find(x=>x.id===id); if(!item)return;
  const rows=amsCeremonyRows(amsCanonicalCeremony(item.section)),i=rows.findIndex(x=>x.id===id),j=i+dir;
  if(j<0||j>=rows.length)return;
  const other=rows[j],a=Number(item.order_index||i+1),b=Number(other.order_index||j+1);
  await sb.from('ceremony_items').update({order_index:b}).eq('id',item.id);
  await sb.from('ceremony_items').update({order_index:a}).eq('id',other.id);
  await loadWeddingData(state.wedding.id);render();
}
async function amsDeleteCeremony(id){
  if(!confirm('Excluir este item do Cerimonial?'))return;
  await sb.from('ceremony_items').delete().eq('id',id);
  await loadWeddingData(state.wedding.id);render();
}

function amsCeremonyAgenda(){
  const rows=amsCeremonyRows('Agenda');
  return `<div class="card ams-agenda">${rows.length?rows.map((x,i)=>`<div class="ams-agenda-row">
    <div class="ams-time"><strong>${timeBR(x.scheduled_time)}</strong><span>${esc(amsCanonicalCeremony(x.section))}</span></div>
    <div class="ams-agenda-copy"><strong>${esc(x.title)}</strong><span>${esc([x.location,x.responsible,x.participants].filter(Boolean).join(' • '))}</span>${x.music?`<small>♫ ${esc(x.music)}</small>`:''}</div>
    <button class="btn-secondary" data-ams-edit-ceremony="${x.id}">Editar</button>
  </div>`).join(''):emptyState('Agenda vazia','Adicione horários no Roteiro, Cerimônia ou Momentos.')}</div>`;
}
function amsCeremonyChecklist(){
  const rows=amsCeremonyRows('Roteiro');
  return `<div class="card">${rows.length?rows.map(x=>`<div class="ams-check-row ${x.completed?'done':''}">
    <button class="checkbox ${x.completed?'checked':''}" data-ams-toggle-ceremony="${x.id}">${x.completed?'✓':''}</button>
    <div><strong>${esc(x.title)}</strong><span>${esc([x.scheduled_time?timeBR(x.scheduled_time):'',x.responsible].filter(Boolean).join(' • ')||'Sem horário')}</span></div>
    <div class="action-row"><button class="btn-secondary" data-ams-edit-ceremony="${x.id}">Editar</button><button class="btn-danger" data-ams-delete-ceremony="${x.id}">Excluir</button></div>
  </div>`).join(''):emptyState('Roteiro vazio','Adicione itens ao checklist do Cerimonial.')}</div>`;
}
function amsCeremonySequence(section){
  const rows=amsCeremonyRows(section);
  return `<div class="card">${rows.length?rows.map((x,i)=>`<div class="ams-sequence-row">
    <div class="ams-sequence-number">${String(i+1).padStart(2,'0')}</div>
    <div><strong>${esc(x.title)}</strong><span>${esc([x.scheduled_time?timeBR(x.scheduled_time):'',x.responsible,x.location].filter(Boolean).join(' • '))}</span></div>
    <div class="ams-order"><button data-ams-move="${x.id}" data-dir="-1" ${i===0?'disabled':''}>↑</button><button data-ams-move="${x.id}" data-dir="1" ${i===rows.length-1?'disabled':''}>↓</button></div>
    <div class="action-row"><button class="btn-secondary" data-ams-edit-ceremony="${x.id}">Editar</button><button class="btn-danger" data-ams-delete-ceremony="${x.id}">Excluir</button></div>
  </div>`).join(''):emptyState('Nenhum item','Monte a sequência do grande dia.')}</div>`;
}
function amsCeremonyFinanceView(){
  const total=state.ceremonyFinance.reduce((s,x)=>s+Number(x.amount||0),0),paid=state.ceremonyFinance.reduce((s,x)=>s+Number(x.paid_amount||0),0);
  return `<div class="ams-kpis"><div class="card"><span>Previsto</span><strong>${brl(total)}</strong></div><div class="card"><span>Pago</span><strong>${brl(paid)}</strong></div><div class="card"><span>Pendente</span><strong>${brl(Math.max(0,total-paid))}</strong></div></div>
  <div class="card">${state.ceremonyFinance.length?state.ceremonyFinance.map(x=>`<div class="ams-fin-row"><div><strong>${esc(x.description)}</strong><span>${esc(x.category||'Cerimonial')}</span></div><strong>${brl(x.amount)}</strong><span class="badge ${x.status==='Pago'?'success':'warning'}">${esc(x.status)}</span><div class="action-row"><button class="btn-secondary" data-ams-edit-cer-fin="${x.id}">Editar</button><button class="btn-danger" data-ams-delete-cer-fin="${x.id}">Excluir</button></div></div>`).join(''):emptyState('Sem lançamentos','Cadastre os custos do Cerimonial.')}</div>`;
}
function amsOpenCerFinance(row){
  const body=field('Descrição','description',row?.description||'')+field('Categoria','category',row?.category||'')+field('Valor total','amount',row?.amount||0,'number','min="0" step="0.01"')+field('Valor pago','paid_amount',row?.paid_amount||0,'number','min="0" step="0.01"')+field('Vencimento','due_date',row?.due_date||'','date');
  modal(row?'Editar lançamento':'Novo lançamento',body,row?'Salvar':'Adicionar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries()),amount=Number(f.amount||0),paid=Number(f.paid_amount||0);
    const payload={wedding_id:state.wedding.id,module_slug:'cerimonial',description:String(f.description||'').trim(),category:String(f.category||'').trim()||null,amount,paid_amount:paid,due_date:f.due_date||null,status:amount>0&&paid>=amount?'Pago':paid>0?'Parcial':'Pendente',updated_at:new Date().toISOString()};
    if(!payload.description){toast('Informe a descrição.');return false;}
    const res=row?await sb.from('module_financial_entries').update(payload).eq('id',row.id):await sb.from('module_financial_entries').insert(payload);
    if(res.error){console.error(res.error);toast('Não foi possível salvar.');return false;}
    await loadWeddingData(state.wedding.id);render();return true;
  });
}
function amsCeremonyShareUrl(code){const u=new URL('cerimonial-publico.html',location.href);u.search='';u.hash='';u.searchParams.set('code',code);return u.toString();}
function amsCeremonyShareView(){
  const url=state.ceremonyShare?.share_code?amsCeremonyShareUrl(state.ceremonyShare.share_code):'';
  return `<div class="card card-pad ams-share"><h2>Link somente de visualização</h2><p class="muted">A noiva ou a assessoria podem gerar um link para familiares, padrinhos e fornecedores. O financeiro não aparece.</p>${url?`<div class="ams-share-line"><input class="input" value="${esc(url)}" readonly><button class="btn-secondary" id="ams-copy-share">Copiar</button></div><div class="action-row"><button class="btn-primary" id="ams-open-share">Abrir</button><button class="btn-secondary" id="ams-regenerate-share">Novo link</button><button class="btn-secondary" id="ams-toggle-share">${state.ceremonyShare.active===false?'Reativar':'Desativar'}</button></div>`:`<button class="btn-primary" id="ams-create-share">Criar link</button>`}</div>`;
}
function amsCeremonyView(){
  const tab=state.ceremonyTab;
  const body=tab==='roteiro'?amsCeremonyChecklist():tab==='cerimonia'?amsCeremonySequence('Cerimônia'):tab==='momentos'?amsCeremonySequence('Momentos'):tab==='financeiro'?amsCeremonyFinanceView():tab==='compartilhar'?amsCeremonyShareView():amsCeremonyAgenda();
  return `<div class="page ams-workspace"><div class="page-head"><div><h1>Cerimonial</h1><p>Assessoria e noivos podem editar juntos todas as etapas do grande dia.</p></div>${tab==='roteiro'?'<button class="btn-primary" data-ams-new-ceremony="Roteiro">+ Item</button>':tab==='agenda'?'<button class="btn-primary" data-ams-new-ceremony="Agenda">+ Agenda</button>':tab==='cerimonia'?'<button class="btn-primary" data-ams-new-ceremony="Cerimônia">+ Etapa</button>':tab==='momentos'?'<button class="btn-primary" data-ams-new-ceremony="Momentos">+ Momento</button>':tab==='financeiro'?'<button class="btn-primary" id="ams-new-cer-fin">+ Lançamento</button>':''}</div>
    <nav class="ams-tabs">${[['roteiro','Roteiro'],['agenda','Agenda'],['cerimonia','Cerimônia'],['momentos','Momentos'],['financeiro','Financeiro'],['compartilhar','Compartilhar']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-ams-cer-tab="${k}">${l}</button>`).join('')}</nav>${body}</div>`;
}

function amsHomePaid(itemId){return state.homePayments.filter(p=>p.item_id===itemId).reduce((s,p)=>s+Number(p.amount||0),0);}
function amsHomeExpected(x){return Number(x.unit_value||0)*Math.max(1,Number(x.quantity||1));}
function amsHomeRemaining(x){return (x.acquisition_status==='Comprado'||x.acquisition_status==='Presenteado')?0:Math.max(0,Number(x.quantity||1)-Number(x.owned_quantity||0));}
function amsOpenHomeItem(item){
  const body=selectField('Setor','room',AMS_HOME_ROOMS,item?.room||'Cozinha')+field('Item','item_name',item?.item_name||'')+field('Já tenho','owned_quantity',item?.owned_quantity||0,'number','min="0"')+field('Quero ter','quantity',item?.quantity||1,'number','min="1"')+field('Tamanho / modelo','item_size',item?.item_size||'')+selectField('Prioridade','priority',['Essencial','Importante','Desejo'],item?.priority||'Importante')+selectField('Situação','acquisition_status',['Falta','Comprado','Presenteado'],item?.acquisition_status||'Falta')+field('Valor por unidade','unit_value',item?.unit_value||0,'number','min="0" step="0.01"')+field('Loja','store_name',item?.store_name||'')+field('Link do produto','item_link',item?.item_link||'','url');
  modal(item?'Editar item':'Adicionar item',body,item?'Salvar':'Adicionar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    const payload={wedding_id:state.wedding.id,room:f.room,item_name:String(f.item_name||'').trim(),owned_quantity:Math.max(0,Number(f.owned_quantity||0)),quantity:Math.max(1,Number(f.quantity||1)),item_size:String(f.item_size||'').trim()||null,priority:f.priority,acquisition_status:f.acquisition_status,unit_value:Number(f.unit_value||0),store_name:String(f.store_name||'').trim()||null,item_link:String(f.item_link||'').trim()||null,updated_at:new Date().toISOString()};
    if(!payload.item_name){toast('Informe o item.');return false;}
    const res=item?await sb.from('home_organization_items').update(payload).eq('id',item.id):await sb.from('home_organization_items').insert(payload);
    if(res.error){console.error(res.error);toast('Não foi possível salvar.');return false;}await loadWeddingData(state.wedding.id);render();return true;
  });
}
function amsOpenHomePayment(row,itemId){
  const opts=state.homeItems.map(x=>({value:x.id,label:`${x.room} — ${x.item_name}`}));
  const body=selectField('Item','item_id',opts,itemId||row?.item_id||state.homeItems[0]?.id||'')+field('Valor pago','amount',row?.amount||0,'number','min="0.01" step="0.01"')+field('Data','payment_date',row?.payment_date||new Date().toISOString().slice(0,10),'date')+selectField('Forma','payment_method',['PIX','Cartão de crédito','Cartão de débito','Dinheiro','Transferência','Boleto','Outro'],row?.payment_method||'PIX');
  modal(row?'Editar pagamento':'Lançar pagamento',body,row?'Salvar':'Lançar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    const payload={wedding_id:state.wedding.id,item_id:f.item_id,amount:Number(f.amount||0),payment_date:f.payment_date||null,payment_method:f.payment_method||null,updated_at:new Date().toISOString()};
    if(!payload.item_id||payload.amount<=0){toast('Selecione o item e informe o valor.');return false;}
    const res=row?await sb.from('home_item_payments').update(payload).eq('id',row.id):await sb.from('home_item_payments').insert(payload);
    if(res.error){console.error(res.error);toast('Não foi possível salvar.');return false;}await loadWeddingData(state.wedding.id);state.homeTab='financeiro';render();return true;
  });
}
function amsHomeDashboard(){
  const total=state.homeItems.length,resolved=state.homeItems.filter(x=>amsHomeRemaining(x)===0).length,planned=state.homeItems.reduce((s,x)=>s+amsHomeExpected(x),0),paid=state.homePayments.reduce((s,x)=>s+Number(x.amount||0),0);
  return `<div class="ams-kpis"><div class="card"><span>Itens</span><strong>${total}</strong></div><div class="card"><span>Resolvidos</span><strong>${resolved}</strong></div><div class="card"><span>A comprar</span><strong>${state.homeItems.reduce((s,x)=>s+amsHomeRemaining(x),0)}</strong></div><div class="card"><span>Pago</span><strong>${brl(paid)}</strong></div></div>
  <div class="card card-pad"><div class="card-title"><h2>Progresso por setor</h2><span class="sub">${total?Math.round(resolved/total*100):0}% concluído</span></div><div class="ams-sector-grid">${AMS_HOME_ROOMS.map(room=>{const rows=state.homeItems.filter(x=>x.room===room),done=rows.filter(x=>amsHomeRemaining(x)===0).length,p=rows.length?Math.round(done/rows.length*100):0;return `<button data-ams-open-room="${esc(room)}"><strong>${esc(room)}</strong><span>${rows.length} itens • ${p}%</span></button>`;}).join('')}</div></div>`;
}
function amsHomeList(){
  const rows=state.homeItems.filter(x=>state.homeFilter==='Todos'||x.room===state.homeFilter);
  return `<div class="filters">${['Todos',...AMS_HOME_ROOMS].map(r=>`<button class="filter-btn ${state.homeFilter===r?'active':''}" data-ams-home-filter="${esc(r)}">${esc(r)}</button>`).join('')}</div><div class="card ams-home-list">${rows.length?rows.map(x=>`<div class="ams-home-row"><div><strong>${esc(x.item_name)}</strong><span>${esc(x.room)} • ${esc(x.item_size||'sem medida')}</span></div><div><span>Já tenho</span><strong>${Number(x.owned_quantity||0)}</strong></div><div><span>Quero</span><strong>${Number(x.quantity||1)}</strong></div><div><span>Comprar</span><strong>${amsHomeRemaining(x)}</strong></div><div><span>Previsto</span><strong>${brl(amsHomeExpected(x))}</strong></div><div><span>Pago</span><strong>${brl(amsHomePaid(x.id))}</strong></div><div class="action-row"><button class="btn-secondary" data-ams-home-pay="${x.id}">Pagamento</button><button class="btn-secondary" data-ams-edit-home="${x.id}">Editar</button><button class="btn-danger" data-ams-delete-home="${x.id}">Excluir</button></div></div>`).join(''):emptyState('Lista vazia','Adicione itens ou use as sugestões.')}</div>`;
}
function amsHomeSuggestions(){
  return `<div class="ams-suggestion-grid">${AMS_ENXOVAL_SUGGESTIONS.map((g,gi)=>`<div class="card card-pad"><div class="card-title"><h2>${esc(g.title)}</h2><span class="sub">${esc(g.room)}</span></div><div class="ams-suggestions">${g.items.map((name,ii)=>{const exists=state.homeItems.some(x=>x.room===g.room&&amsNormalize(x.item_name)===amsNormalize(name));return `<button ${exists?'disabled':''} class="${exists?'done':''}" data-ams-add-suggestion="${gi}" data-item="${ii}">${exists?'✓':'+'} ${esc(name)}</button>`;}).join('')}</div><button class="btn-secondary" data-ams-add-suggestion-group="${gi}">+ Adicionar o que falta</button></div>`).join('')}</div>`;
}
function amsHomeFinance(){
  const planned=state.homeItems.reduce((s,x)=>s+amsHomeExpected(x),0),paid=state.homePayments.reduce((s,x)=>s+Number(x.amount||0),0);
  return `<div class="ams-kpis"><div class="card"><span>Previsto</span><strong>${brl(planned)}</strong></div><div class="card"><span>Pago</span><strong>${brl(paid)}</strong></div><div class="card"><span>Saldo</span><strong>${brl(Math.max(0,planned-paid))}</strong></div></div><div class="card">${state.homePayments.length?state.homePayments.map(p=>{const item=state.homeItems.find(x=>x.id===p.item_id);return `<div class="ams-fin-row"><div><strong>${esc(item?.item_name||'Item removido')}</strong><span>${esc(item?.room||'')} • ${dateBR(p.payment_date)}</span></div><strong>${brl(p.amount)}</strong><span>${esc(p.payment_method||'')}</span><div class="action-row"><button class="btn-secondary" data-ams-edit-home-pay="${p.id}">Editar</button><button class="btn-danger" data-ams-delete-home-pay="${p.id}">Excluir</button></div></div>`;}).join(''):emptyState('Sem pagamentos','Lance pagamentos vinculados aos itens.')}</div>`;
}
function amsHomeView(){
  const tab=state.homeTab;
  const body=tab==='lista'?amsHomeList():tab==='sugestoes'?amsHomeSuggestions():tab==='financeiro'?amsHomeFinance():amsHomeDashboard();
  return `<div class="page ams-workspace"><div class="page-head"><div><h1>Organização da casa</h1><p>Assessoria e noivos compartilham a mesma lista de enxoval e financeiro.</p></div>${tab==='lista'?'<button class="btn-primary" id="ams-new-home">+ Item</button>':tab==='financeiro'?'<button class="btn-primary" id="ams-new-home-pay">+ Pagamento</button>':''}</div><nav class="ams-tabs">${[['dashboard','Dashboard'],['lista','Lista de enxoval'],['sugestoes','Sugestões'],['financeiro','Financeiro']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-ams-home-tab="${k}">${l}</button>`).join('')}</nav>${body}</div>`;
}

const AMS_HONEY_SECTIONS=['Roteiro','Reservas','Documentos'];
function amsOpenHoneymoonItem(section,item){
  const body=selectField('Área','section',AMS_HONEY_SECTIONS,section||item?.section||'Roteiro')+field('Título','title',item?.title||'')+field('Data','item_date',item?.item_date||'','date')+field('Horário','item_time',item?.item_time?String(item.item_time).slice(0,5):'','time')+field('Categoria','category',item?.category||'')+field('Local / destino','location',item?.location||'')+field('Empresa / fornecedor','provider',item?.provider||'')+field('Código / reserva','confirmation_code',item?.confirmation_code||'')+field('Link','item_link',item?.item_link||'','url')+selectField('Status','status',['Planejado','Reservado','Confirmado','Concluído'],item?.status||'Planejado')+`<div class="field"><label>Observações</label><textarea class="input ams-textarea" name="notes">${esc(item?.notes||'')}</textarea></div>`;
  modal(item?'Editar item da Lua de Mel':'Adicionar à Lua de Mel',body,item?'Salvar':'Adicionar',async back=>{
    const f=Object.fromEntries(new FormData(back.querySelector('.modal')).entries());
    const payload={wedding_id:state.wedding.id,section:f.section,title:String(f.title||'').trim(),item_date:f.item_date||null,item_time:f.item_time||null,category:String(f.category||'').trim()||null,location:String(f.location||'').trim()||null,provider:String(f.provider||'').trim()||null,confirmation_code:String(f.confirmation_code||'').trim()||null,item_link:String(f.item_link||'').trim()||null,status:f.status||'Planejado',notes:String(f.notes||'').trim()||null,updated_at:new Date().toISOString()};
    if(!payload.title){toast('Informe o título.');return false;}
    const res=item?await sb.from('honeymoon_planner_items').update(payload).eq('id',item.id):await sb.from('honeymoon_planner_items').insert(payload);
    if(res.error){console.error(res.error);toast('Não foi possível salvar.');return false;}await loadWeddingData(state.wedding.id);render();return true;
  });
}
function amsHoneymoonRows(section){return state.honeymoonPlannerItems.filter(x=>x.section===section).sort((a,b)=>String(a.item_date||'9999-12-31').localeCompare(String(b.item_date||'9999-12-31'))||String(a.item_time||'99:99').localeCompare(String(b.item_time||'99:99')));}
function amsHoneymoonDashboard(){
  const costs=typeof expenseTotals==='function'?expenseTotals('honeymoon'):{all:0,paid:0,pending:0,count:0};
  return `<div class="ams-kpis"><div class="card"><span>Roteiro</span><strong>${amsHoneymoonRows('Roteiro').length}</strong></div><div class="card"><span>Reservas</span><strong>${amsHoneymoonRows('Reservas').length}</strong></div><div class="card"><span>Documentos</span><strong>${amsHoneymoonRows('Documentos').length}</strong></div><div class="card"><span>Pago</span><strong>${brl(costs.paid)}</strong></div></div><div class="card card-pad"><div class="card-title"><h2>Próximos itens da viagem</h2></div>${state.honeymoonPlannerItems.length?state.honeymoonPlannerItems.filter(x=>x.item_date).slice(0,6).map(x=>`<div class="ams-honey-next"><strong>${dateBR(x.item_date)} ${x.item_time?timeBR(x.item_time):''}</strong><span>${esc(x.title)} • ${esc(x.section)}</span></div>`).join(''):emptyState('Viagem ainda sem roteiro','Adicione passeios, reservas e documentos.')}</div>`;
}
function amsHoneymoonSection(section){
  const rows=amsHoneymoonRows(section);
  return `<div class="card">${rows.length?rows.map(x=>`<div class="ams-home-row"><div><strong>${esc(x.title)}</strong><span>${esc([x.item_date?dateBR(x.item_date):'',x.item_time?timeBR(x.item_time):'',x.location].filter(Boolean).join(' • '))}</span></div><div><span>Status</span><strong>${esc(x.status)}</strong></div><div><span>Fornecedor</span><strong>${esc(x.provider||'—')}</strong></div><div><span>Reserva</span><strong>${esc(x.confirmation_code||'—')}</strong></div><div class="action-row"><button class="btn-secondary" data-ams-edit-honey="${x.id}">Editar</button><button class="btn-danger" data-ams-delete-honey="${x.id}">Excluir</button></div></div>`).join(''):emptyState('Nenhum item','Adicione informações desta área da viagem.')}</div>`;
}
function amsHoneymoonView(){
  const tab=state.honeymoonTab,section=tab==='reservas'?'Reservas':tab==='documentos'?'Documentos':'Roteiro';
  const body=tab==='dashboard'?amsHoneymoonDashboard():tab==='financeiro'?(typeof expenseView==='function'?expenseView('honeymoon'):emptyState('Financeiro indisponível','Atualize a página.')):amsHoneymoonSection(section);
  return `<div class="page ams-workspace ams-honeymoon"><div class="page-head"><div><h1>Lua de mel</h1><p>Roteiro, reservas, documentos e financeiro em uma única área compartilhada.</p></div>${['roteiro','reservas','documentos'].includes(tab)?`<button class="btn-primary" data-ams-new-honey="${section}">+ Adicionar</button>`:''}</div><nav class="ams-tabs">${[['dashboard','Dashboard'],['roteiro','Roteiro'],['reservas','Reservas'],['documentos','Documentos'],['financeiro','Financeiro']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-ams-honey-tab="${k}">${l}</button>`).join('')}</nav>${body}</div>`;
}

const amsBaseViewFor=viewFor;
viewFor=function(r){
  if(r==='cerimonial')return state.wedding?amsCeremonyView():noWeddingView();
  if(r==='organizacao-casa')return state.wedding?amsHomeView():noWeddingView();
  if(r==='lua-de-mel')return state.wedding?amsHoneymoonView():noWeddingView();
  return amsBaseViewFor(r);
};

async function amsAddSuggestion(groupIndex,itemIndex=null){
  const g=AMS_ENXOVAL_SUGGESTIONS[groupIndex];if(!g)return;
  const names=itemIndex===null?g.items:[g.items[itemIndex]];
  const existing=new Set(state.homeItems.filter(x=>x.room===g.room).map(x=>amsNormalize(x.item_name)));
  const rows=names.filter(Boolean).filter(n=>!existing.has(amsNormalize(n))).map(n=>({wedding_id:state.wedding.id,room:g.room,item_name:n,quantity:1,owned_quantity:0,priority:'Importante',acquisition_status:'Falta',unit_value:0}));
  if(!rows.length){toast('Estas sugestões já estão na lista.');return;}
  const {error}=await sb.from('home_organization_items').insert(rows);if(error){console.error(error);toast('Não foi possível adicionar.');return;}await loadWeddingData(state.wedding.id);render();
}

const amsBaseBindView=bindView;
bindView=function(r){
  amsBaseBindView(r);

  document.querySelectorAll('[data-ams-cer-tab]').forEach(b=>b.onclick=()=>{state.ceremonyTab=b.dataset.amsCerTab;render();});
  document.querySelectorAll('[data-ams-new-ceremony]').forEach(b=>b.onclick=()=>amsOpenCeremonyEditor(b.dataset.amsNewCeremony,null));
  document.querySelectorAll('[data-ams-toggle-ceremony]').forEach(b=>b.onclick=()=>amsToggleCeremony(b.dataset.amsToggleCeremony));
  document.querySelectorAll('[data-ams-edit-ceremony]').forEach(b=>b.onclick=()=>{const x=state.ceremonyItems.find(i=>i.id===b.dataset.amsEditCeremony);if(x)amsOpenCeremonyEditor(amsCanonicalCeremony(x.section),x);});
  document.querySelectorAll('[data-ams-delete-ceremony]').forEach(b=>b.onclick=()=>amsDeleteCeremony(b.dataset.amsDeleteCeremony));
  document.querySelectorAll('[data-ams-move]').forEach(b=>b.onclick=()=>amsMoveCeremony(b.dataset.amsMove,Number(b.dataset.dir||0)));

  const ncf=document.getElementById('ams-new-cer-fin');if(ncf)ncf.onclick=()=>amsOpenCerFinance(null);
  document.querySelectorAll('[data-ams-edit-cer-fin]').forEach(b=>b.onclick=()=>amsOpenCerFinance(state.ceremonyFinance.find(x=>x.id===b.dataset.amsEditCerFin)));
  document.querySelectorAll('[data-ams-delete-cer-fin]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir lançamento?')){await sb.from('module_financial_entries').delete().eq('id',b.dataset.amsDeleteCerFin);await loadWeddingData(state.wedding.id);render();}});

  const createShare=document.getElementById('ams-create-share');if(createShare)createShare.onclick=async()=>{const {data,error}=await sb.rpc('ceremony_get_or_create_share_link',{wedding_uuid:state.wedding.id});if(error){console.error(error);toast('Não foi possível criar o link.');return;}state.ceremonyShare={share_code:data,active:true};render();};
  const copyShare=document.getElementById('ams-copy-share');if(copyShare)copyShare.onclick=async()=>{const url=amsCeremonyShareUrl(state.ceremonyShare.share_code);try{await navigator.clipboard.writeText(url);toast('Link copiado.');}catch{prompt('Copie o link:',url);}};
  const openShare=document.getElementById('ams-open-share');if(openShare)openShare.onclick=()=>window.open(amsCeremonyShareUrl(state.ceremonyShare.share_code),'_blank','noopener');
  const regen=document.getElementById('ams-regenerate-share');if(regen)regen.onclick=async()=>{if(!confirm('Gerar novo link e invalidar o anterior?'))return;const {data,error}=await sb.rpc('ceremony_regenerate_share_link',{wedding_uuid:state.wedding.id});if(!error){state.ceremonyShare={share_code:data,active:true};render();}};
  const toggle=document.getElementById('ams-toggle-share');if(toggle)toggle.onclick=async()=>{const enabled=state.ceremonyShare.active===false;const {error}=await sb.rpc('ceremony_set_share_active',{wedding_uuid:state.wedding.id,enabled});if(!error){state.ceremonyShare.active=enabled;render();}};

  document.querySelectorAll('[data-ams-home-tab]').forEach(b=>b.onclick=()=>{state.homeTab=b.dataset.amsHomeTab;render();});
  document.querySelectorAll('[data-ams-open-room]').forEach(b=>b.onclick=()=>{state.homeFilter=b.dataset.amsOpenRoom;state.homeTab='lista';render();});
  document.querySelectorAll('[data-ams-home-filter]').forEach(b=>b.onclick=()=>{state.homeFilter=b.dataset.amsHomeFilter;render();});
  const nh=document.getElementById('ams-new-home');if(nh)nh.onclick=()=>amsOpenHomeItem(null);
  document.querySelectorAll('[data-ams-edit-home]').forEach(b=>b.onclick=()=>amsOpenHomeItem(state.homeItems.find(x=>x.id===b.dataset.amsEditHome)));
  document.querySelectorAll('[data-ams-delete-home]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir item?')){await sb.from('home_organization_items').delete().eq('id',b.dataset.amsDeleteHome);await loadWeddingData(state.wedding.id);render();}});
  document.querySelectorAll('[data-ams-home-pay]').forEach(b=>b.onclick=()=>amsOpenHomePayment(null,b.dataset.amsHomePay));
  const nhp=document.getElementById('ams-new-home-pay');if(nhp)nhp.onclick=()=>amsOpenHomePayment(null,null);
  document.querySelectorAll('[data-ams-edit-home-pay]').forEach(b=>b.onclick=()=>amsOpenHomePayment(state.homePayments.find(x=>x.id===b.dataset.amsEditHomePay),null));
  document.querySelectorAll('[data-ams-delete-home-pay]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir pagamento?')){await sb.from('home_item_payments').delete().eq('id',b.dataset.amsDeleteHomePay);await loadWeddingData(state.wedding.id);render();}});
  document.querySelectorAll('[data-ams-add-suggestion]').forEach(b=>b.onclick=()=>amsAddSuggestion(Number(b.dataset.amsAddSuggestion),Number(b.dataset.item)));
  document.querySelectorAll('[data-ams-add-suggestion-group]').forEach(b=>b.onclick=()=>amsAddSuggestion(Number(b.dataset.amsAddSuggestionGroup),null));

  document.querySelectorAll('[data-ams-honey-tab]').forEach(b=>b.onclick=()=>{state.honeymoonTab=b.dataset.amsHoneyTab;render();});
  document.querySelectorAll('[data-ams-new-honey]').forEach(b=>b.onclick=()=>amsOpenHoneymoonItem(b.dataset.amsNewHoney,null));
  document.querySelectorAll('[data-ams-edit-honey]').forEach(b=>b.onclick=()=>{const x=state.honeymoonPlannerItems.find(i=>i.id===b.dataset.amsEditHoney);if(x)amsOpenHoneymoonItem(x.section,x);});
  document.querySelectorAll('[data-ams-delete-honey]').forEach(b=>b.onclick=async()=>{if(confirm('Excluir item da Lua de Mel?')){await sb.from('honeymoon_planner_items').delete().eq('id',b.dataset.amsDeleteHoney);await loadWeddingData(state.wedding.id);render();}});
};

setTimeout(()=>{
  if(state.session&&state.wedding){
    amsLoadModules(state.wedding.id).then(()=>render()).catch(console.error);
  }
},0);
