
(function(){
  window.__PRELIQUIFY__||(window.__PRELIQUIFY__={});
  window.__PRELIQUIFY__.register=function(name,comp){
    window.__PRELIQUIFY__[name]=comp;
    // Trigger hydration when component registers (handles defer script timing)
    if(document.body&&window.__PRELIQUIFY__.hydrate)window.__PRELIQUIFY__.hydrate();
  };
  window.__PRELIQUIFY__.hydrate=function(){
    var nodes=document.querySelectorAll('[data-preliq-island]');
    for(var i=0;i<nodes.length;i++){
      var el=nodes[i];
      var name=el.getAttribute('data-preliq-island');
      var Comp=window.__PRELIQUIFY__[name];
      if(!Comp)continue;
      var propsEl=el.querySelector('script[data-preliq-props]');
      var props={};
      try{props=JSON.parse(propsEl?propsEl.textContent:el.getAttribute('data-preliq-props')||'{}');}catch(_){}
      if(window.preact){
        try{
          window.preact.render(window.preact.h(Comp,props),el);
          el.setAttribute('data-preliq-hydrated','true');
        }catch(e){
          el.setAttribute('data-preliq-error','true');
          console.error('[Preliquify] Hydration error:',e);
        }
      }else{
        el.setAttribute('data-preliq-error','preact-not-available');
        console.error('[Preliquify] Preact not available, cannot hydrate:',name);
      }
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.__PRELIQUIFY__.hydrate);
  else window.__PRELIQUIFY__.hydrate();
})();
