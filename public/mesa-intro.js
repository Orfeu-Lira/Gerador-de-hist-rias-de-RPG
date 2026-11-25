// Abertura independente da API e da inicialização do aplicativo.
(function(){
  const intro=document.getElementById('mesa-abertura');
  if(!intro)return;
  let timer;
  function fechar(){
    clearTimeout(timer);
    document.removeEventListener('pointerdown',fechar);
    document.removeEventListener('keydown',fechar);
    intro.remove();
  }
  let reduzir=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  try{reduzir=reduzir||JSON.parse(localStorage.getItem('mesa-a11y-v1')||'{}').movimento===true;}catch{}
  if(reduzir||new URL(location.href).searchParams.has('reset_token')){fechar();return;}
  intro.addEventListener('animationend',e=>{if(e.target===intro)fechar();});
  timer=setTimeout(fechar,2800);
  document.addEventListener('pointerdown',fechar,{once:true});
  document.addEventListener('keydown',fechar,{once:true});
})();
