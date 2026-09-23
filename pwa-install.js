(function(){
  let deferredPrompt=null;

  function isStandalone(){
    return window.matchMedia?.('(display-mode: standalone)').matches===true ||
      window.navigator.standalone===true;
  }

  function isIOS(){
    return /iphone|ipad|ipod/i.test(navigator.userAgent);
  }

  function showInstructions(){
    const ios=isIOS();
    const body=ios
      ? `<div class="pwa-help">
          <div class="pwa-help-icon">♡</div>
          <p><strong>Adicionar A Magia do Sim à Tela de Início</strong></p>
          <ol>
            <li>Toque no botão <strong>Compartilhar</strong> do Safari.</li>
            <li>Role as opções e toque em <strong>Adicionar à Tela de Início</strong>.</li>
            <li>Depois toque em <strong>Adicionar</strong>.</li>
          </ol>
          <p class="muted">O site ficará com ícone na tela do celular e abrirá como um app.</p>
        </div>`
      : `<div class="pwa-help">
          <div class="pwa-help-icon">♡</div>
          <p><strong>Instalar A Magia do Sim</strong></p>
          <p>Abra o menu do navegador e escolha <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</p>
          <p class="muted">Depois, o sistema abrirá pelo ícone como um aplicativo.</p>
        </div>`;

    if(typeof modal==='function'){
      modal('Adicionar à tela inicial',body,'Entendi',()=>true);
    }else{
      alert(ios
        ? 'No Safari: toque em Compartilhar > Adicionar à Tela de Início > Adicionar.'
        : 'Abra o menu do navegador e escolha Instalar app ou Adicionar à tela inicial.'
      );
    }
  }

  async function installOrExplain(){
    if(isStandalone()){
      if(typeof toast==='function') toast('A Magia do Sim já está instalada neste celular.');
      return;
    }

    if(deferredPrompt){
      deferredPrompt.prompt();
      const choice=await deferredPrompt.userChoice;
      deferredPrompt=null;
      if(choice?.outcome==='accepted' && typeof toast==='function'){
        toast('A Magia do Sim foi adicionada ao seu celular.');
      }
      return;
    }

    showInstructions();
  }

  window.addEventListener('beforeinstallprompt',event=>{
    event.preventDefault();
    deferredPrompt=event;
    window.dispatchEvent(new CustomEvent('ams-pwa-install-ready'));
  });

  window.addEventListener('appinstalled',()=>{
    deferredPrompt=null;
    window.dispatchEvent(new CustomEvent('ams-pwa-installed'));
  });

  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{
      navigator.serviceWorker.register('./service-worker.js',{scope:'./'})
        .catch(error=>console.error('PWA service worker:',error));
    });
  }

  window.AMSPWA={
    installOrExplain,
    isStandalone
  };
})();
