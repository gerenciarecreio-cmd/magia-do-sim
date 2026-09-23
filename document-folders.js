
Object.assign(state,{
  docFolder: state.docFolder || 'Todos'
});

const documentFolders=[
  {key:'Contratos',type:'Contrato',slug:'contratos',label:'Contratos',description:'Contratos assinados e documentos contratuais.'},
  {key:'Pagamentos',type:'Pagamento',slug:'pagamentos',label:'Pagamentos',description:'Comprovantes, recibos e documentos financeiros.'},
  {key:'Outros docs',type:'Outro',slug:'outros',label:'Outros docs',description:'Demais arquivos importantes do casamento.'}
];

function folderForDocument(doc){
  if(doc?.type==='Contrato') return 'Contratos';
  if(doc?.type==='Pagamento') return 'Pagamentos';
  return 'Outros docs';
}

function docsInFolder(folder){
  if(folder==='Todos') return state.docs;
  return state.docs.filter(doc=>folderForDocument(doc)===folder);
}

function documentFolderCard(folder){
  const count=docsInFolder(folder.key).length;
  const active=state.docFolder===folder.key;
  return `<button type="button" class="doc-folder-card ${active?'active':''}" data-doc-folder="${folder.key}">
    <span class="doc-folder-icon">${icons.file}</span>
    <span class="doc-folder-copy">
      <strong>${folder.label}</strong>
      <small>${folder.description}</small>
    </span>
    <span class="doc-folder-count">${count}</span>
  </button>`;
}

docsView=function(){
  const current=state.docFolder||'Todos';
  const items=docsInFolder(current);
  const currentLabel=current==='Todos'?'Todos os documentos':current;

  return `<div class="page documents-folder-page">
    <div class="page-head">
      <div>
        <h1>Documentos</h1>
        <p>Envie e organize os arquivos do casamento em três pastas.</p>
      </div>
      <button class="btn-primary" id="upload-doc">+ Enviar documento</button>
    </div>

    <div class="doc-folder-grid">
      ${documentFolders.map(documentFolderCard).join('')}
    </div>

    <div class="doc-folder-toolbar">
      <div>
        <strong>${esc(currentLabel)}</strong>
        <span>${items.length} arquivo(s)</span>
      </div>
      <div class="doc-folder-toolbar-actions">
        ${current!=='Todos'?`<button class="btn-secondary" data-upload-folder="${esc(current)}">+ Enviar para ${esc(current)}</button>`:''}
        <button class="filter-btn ${current==='Todos'?'active':''}" data-doc-folder="Todos">Ver todos</button>
      </div>
    </div>

    <div class="card list-card doc-folder-list">
      ${items.length?items.map(d=>{
        const folder=folderForDocument(d);
        return `<div class="list-row doc-row">
          <div class="doc-icon">${icons.file}</div>
          <div class="vendor-name">
            <strong>${esc(d.name)}</strong>
            <span>${esc(folder)} • Arquivo do casamento</span>
          </div>
          <div class="doc-type small muted">${esc(folder)}</div>
          <div class="doc-date small muted">${esc(d.date)}</div>
          <button class="btn-secondary" data-view-doc="${d.id}">Visualizar</button>
        </div>`;
      }).join(''):emptyState(
        current==='Todos'?'Ainda não há documentos.':`A pasta ${current} está vazia.`,
        'Use o botão Enviar documento para adicionar um arquivo.'
      )}
    </div>

    <div class="card card-pad doc-upload-info">
      <div class="card-title"><h2>Quem pode enviar?</h2></div>
      <p class="small muted">A assessoria e os noivos podem enviar documentos. Cada cliente acessa somente os arquivos do próprio casamento.</p>
    </div>
  </div>`;
};

function openDocumentFolderEditor(preselectedFolder=''){
  if(!state.wedding){
    toast('Nenhum casamento selecionado.');
    return;
  }

  const selected=documentFolders.find(f=>f.key===preselectedFolder) || documentFolders[2];

  const body=
    selectField('Pasta','folder',documentFolders.map(f=>({value:f.key,label:f.label})),selected.key)+
    field('Nome do documento','name','')+
    `<div class="field">
      <label>Arquivo</label>
      <input class="input" type="file" name="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp" required>
      <small class="muted">PDF, Word, Excel ou imagem.</small>
    </div>`;

  modal('Enviar documento',body,'Enviar',async back=>{
    const form=back.querySelector('.modal');
    const fd=new FormData(form);
    const folderKey=String(fd.get('folder')||'Outros docs');
    const folder=documentFolders.find(f=>f.key===folderKey) || documentFolders[2];
    const file=form.querySelector('[name=file]')?.files?.[0];

    if(!file){
      toast('Selecione um arquivo.');
      return false;
    }

    let name=String(fd.get('name')||'').trim();
    if(!name){
      name=file.name.replace(/\.[^.]+$/,'').trim() || file.name;
    }

    const allowed=[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if(file.type && !allowed.includes(file.type)){
      toast('Formato não permitido. Use PDF, Word, Excel ou imagem.');
      return false;
    }

    const safeName=file.name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9._-]/g,'_');

    const path=`${state.wedding.id}/${folder.slug}/${Date.now()}-${safeName}`;

    const {error:uploadError}=await sb.storage
      .from('wedding-documents')
      .upload(path,file,{upsert:false,contentType:file.type||undefined});

    if(uploadError){
      console.error(uploadError);
      toast('Não foi possível enviar o arquivo.');
      return false;
    }

    const {error:dbError}=await sb
      .from('documents')
      .insert({
        wedding_id:state.wedding.id,
        name,
        document_type:folder.type,
        file_path:path
      });

    if(dbError){
      console.error(dbError);
      await sb.storage.from('wedding-documents').remove([path]);
      toast('Não foi possível cadastrar o documento.');
      return false;
    }

    state.docFolder=folder.key;
    await loadWeddingData(state.wedding.id);
    toast('Documento enviado com sucesso.');
    render();
    return true;
  });
}

openDocumentEditor=function(){
  openDocumentFolderEditor(state.docFolder==='Todos'?'':state.docFolder);
};

const documentFoldersBaseBindView=bindView;
bindView=function(r){
  documentFoldersBaseBindView(r);

  document.querySelectorAll('[data-doc-folder]').forEach(btn=>{
    btn.onclick=()=>{
      state.docFolder=btn.dataset.docFolder||'Todos';
      render();
    };
  });

  document.querySelectorAll('[data-upload-folder]').forEach(btn=>{
    btn.onclick=()=>openDocumentFolderEditor(btn.dataset.uploadFolder||'');
  });
};
