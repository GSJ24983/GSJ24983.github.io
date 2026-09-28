/* Shared behaviour.
   - The audience tab (ft / con / tr) travels between pages as ?for=
   - Elements with data-show="ft con" appear only for those tabs
   - A container with data-order-ft="a b c" reorders its [data-k] children per tab
   - Links to #something open any collapsed section that holds the target */
(function(){
  var TABS=['ft','con','tr'];
  function current(){
    var p=new URLSearchParams(location.search).get('for');
    if(TABS.indexOf(p)>-1) return p;
    try{var s=sessionStorage.getItem('gj-for');if(TABS.indexOf(s)>-1)return s;}catch(e){}
    return 'ft';
  }
  function carry(t){
    document.querySelectorAll('a[data-keep]').forEach(function(a){
      var h=a.getAttribute('href'),hash='',i=h.indexOf('#');
      if(i>-1){hash=h.slice(i);h=h.slice(0,i);}
      h=h.split('?')[0];
      a.setAttribute('href',h+'?for='+t+hash);
    });
  }
  function apply(t){
    document.body.dataset.for=t;
    document.querySelectorAll('.tab').forEach(function(b){var on=b.dataset.t===t;b.classList.toggle('on',on);b.setAttribute('aria-selected',on)});
    document.querySelectorAll('[data-show]').forEach(function(el){el.hidden=el.dataset.show.split(' ').indexOf(t)<0});
    document.querySelectorAll('[data-order-'+t+']').forEach(function(box){
      box.getAttribute('data-order-'+t).split(' ').forEach(function(k){var c=box.querySelector(':scope > [data-k="'+k+'"]');if(c)box.appendChild(c)});
    });
    try{sessionStorage.setItem('gj-for',t)}catch(e){}
    if(document.querySelector('.tab')){
      var u=new URL(location.href);u.searchParams.set('for',t);history.replaceState(null,'',u);
    }
    carry(t);
  }
  function openHash(){
    if(!location.hash) return;
    var el=document.getElementById(location.hash.slice(1));if(!el) return;
    if(el.tagName==='DETAILS') el.open=true;
    var d=el.closest('details');while(d){d.open=true;d=d.parentElement&&d.parentElement.closest('details');}
    setTimeout(function(){el.scrollIntoView({block:'start'})},30);
  }
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){
      apply(b.dataset.t);window.scrollTo({top:0,behavior:'auto'});
      var w=document.querySelector('.open-enter');if(w){w.style.animation='none';void w.offsetWidth;w.style.animation='';}
    })});
    var nav=document.querySelector('header.nav'),mb=document.querySelector('.menu-btn');
    if(mb) mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
    apply(current());
    openHash();
  });
  window.addEventListener('hashchange',openHash);
})();

/* Pop-up dialogs: [data-dialog="id"] opens, [data-close] or a click on the backdrop closes */
(function(){
  document.addEventListener('DOMContentLoaded',function(){
    document.querySelectorAll('[data-dialog]').forEach(function(b){
      var d=document.getElementById(b.dataset.dialog);if(!d||!d.showModal) return;
      b.addEventListener('click',function(){d.showModal();document.body.classList.add('dlg-open');});
    });
    document.querySelectorAll('dialog').forEach(function(d){
      d.addEventListener('close',function(){document.body.classList.remove('dlg-open');});
      d.addEventListener('click',function(e){
        if(e.target.closest('[data-close]')){d.close();return;}
        if(e.target===d){var r=d.getBoundingClientRect();
          if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom) d.close();}
      });
    });
  });
})();
