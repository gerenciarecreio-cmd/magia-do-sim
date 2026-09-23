const sb=window.supabase.createClient(
  'https://yruwsmjmnssovojsdbah.supabase.co',
  'sb_publishable_54PNMN8dAUNOliQ1tt1hQg_CVZRwXXw'
);
const root=document.getElementById('app');
const code=new URLSearchParams(location.search).get('code')||'';
let data=null,tab='agenda';
const esc=v=>String(v??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
const valid=v=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
const t=v=>v?String(v).slice(0,5):'—';
const d=v=>v?new Date(v+'T12:00:00').toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'}):'Data a definir';
function section(s){if(s==='Cronograma')return'Agenda';if(s==='Momentos especiais')return'Momentos';if(['Cortejo','Músicas','Responsáveis','Fornecedores','Observações'].includes(s))return'Cerimônia';return['Roteiro','Agenda','Cerimônia','Momentos'].includes(s)?s:'Agenda';}
function items(){return Array.isArray(data?.items)?data.items:[]}
function agenda(){return [...items()].filter(x=>x.scheduled_time).sort((a,b)=>String(a.scheduled_time).localeCompare(String(b.scheduled_time))||Number(a.order_index||0)-Number(b.order_index||0))}
function by(s){return [...items()].filter(x=>section(x.section)===s).sort((a,b)=>Number(a.order_index||0)-Number(b.order_index||0))}
function empty(){return'<div class="empty">Nenhum item cadastrado nesta área.</div>'}
function agendaView(){const rows=agenda();return `<div class="panel">${rows.length?rows.map(x=>`<div class="row"><div class="time"><strong>${t(x.scheduled_time)}</strong><span>${esc(section(x.section))}</span></div><div class="copy"><strong>${esc(x.title)}</strong><span>${esc([x.location,x.responsible,x.participants].filter(Boolean).join(' • '))}</span>${x.music?`<small>♫ ${esc(x.music)}</small>`:''}${x.notes?`<p>${esc(x.notes)}</p>`:''}</div></div>`).join(''):empty()}</div>`}
function roteiroView(){const rows=by('Roteiro');return `<div class="panel">${rows.length?rows.map(x=>`<div class="check"><div class="dot">${x.completed?'✓':'○'}</div><div class="copy"><strong>${esc(x.title)}</strong><span>${esc([x.scheduled_time?t(x.scheduled_time):'',x.responsible].filter(Boolean).join(' • '))}</span>${x.notes?`<p>${esc(x.notes)}</p>`:''}</div></div>`).join(''):empty()}</div>`}
function seqView(s){const rows=by(s);return `<div class="panel">${rows.length?rows.map((x,i)=>`<div class="seq"><div class="num">${String(i+1).padStart(2,'0')}</div><div class="copy"><strong>${esc(x.title)}</strong><span>${esc([x.scheduled_time?t(x.scheduled_time):'',x.responsible,x.location].filter(Boolean).join(' • '))}</span>${x.music?`<small>♫ ${esc(x.music)}</small>`:''}${x.notes?`<p>${esc(x.notes)}</p>`:''}</div></div>`).join(''):empty()}</div>`}
function body(){if(tab==='roteiro')return roteiroView();if(tab==='cerimonia')return seqView('Cerimônia');if(tab==='momentos')return seqView('Momentos');return agendaView()}
function render(){const w=data.wedding||{};root.innerHTML=`<div class="wrap"><div class="brand"><div class="mark">A</div><div><strong>A Magia do Sim</strong><span>Cerimonial • somente visualização</span></div></div><section class="hero"><div><span style="font-size:9px;letter-spacing:.12em">CERIMONIAL</span><h1>${esc(w.couple_name||'Casamento')}</h1><p>${esc(d(w.wedding_date))}${w.wedding_time?' • '+t(w.wedding_time):''}${w.venue?' • '+esc(w.venue):''}</p></div><span class="pill">Somente leitura</span></section><nav class="tabs">${[['agenda','Agenda'],['roteiro','Roteiro'],['cerimonia','Cerimônia'],['momentos','Momentos']].map(([k,l])=>`<button class="${tab===k?'active':''}" data-tab="${k}">${l}</button>`).join('')}</nav>${body()}<footer>A Magia do Sim • Onde os sonhos se tornam alianças.</footer></div>`;root.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;render();window.scrollTo({top:0,behavior:'smooth'})})}
function invalid(){root.innerHTML='<div class="wrap"><div class="empty"><h1>Link indisponível</h1><p>O Cerimonial não está disponível ou o link foi desativado.</p></div></div>'}
(async()=>{if(!valid(code)){invalid();return}const {data:r,error}=await sb.rpc('ceremony_public_snapshot',{link_code:code});if(error||!r){console.error(error);invalid();return}data=r;render()})();