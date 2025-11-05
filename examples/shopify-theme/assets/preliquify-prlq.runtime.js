
(function(){
  window.__PRELIQUIFY__||(window.__PRELIQUIFY__={});
  window.__PRELIQUIFY__.register=function(name,comp){window.__PRELIQUIFY__[name]=comp;};
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
      if(window.preact)window.preact.render(window.preact.h(Comp,props),el);
      el.setAttribute('data-preliq-hydrated','true');
    }
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',window.__PRELIQUIFY__.hydrate);
  else window.__PRELIQUIFY__.hydrate();
})();
