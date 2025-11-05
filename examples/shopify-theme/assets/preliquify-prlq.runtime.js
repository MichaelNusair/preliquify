
(function(){
  function parseProps(el){
    try { return JSON.parse(el.getAttribute('data-preliq-props')); }
    catch(_) { return {}; }
  }
  function mount(){
    var nodes = document.querySelectorAll('[data-preliq-island]');
    for (var i=0;i<nodes.length;i++){
      var el = nodes[i];
      var name = el.getAttribute('data-preliq-island');
      var id = el.getAttribute('data-preliq-id');
      var Comp = (window.Preliquify||{})[name];
      if (!Comp) continue;
      var props = parseProps(el) || {};
      if (window.preact) {
        window.preact.render(window.preact.h(Comp, props), el);
      }
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
