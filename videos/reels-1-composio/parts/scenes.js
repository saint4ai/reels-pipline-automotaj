/* Библиотека сцен: строит DOM из SB.scenes и вешает твины. Хелперы show/pop/draw, tl, SB даёт сборщик. */
var SC=SB.scenes||[];
var LIME="#B6FF00", ORANGE="#FC5C02", INK="#111214";
var ICONS={
  "send":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/></svg>',
  "message-circle":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/></svg>',
  "message-square":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/><path d="M13 8H7"/><path d="M17 12H7"/></svg>',
  "chart":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>',
  "target":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  "cart":'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>'
};
var root=document.getElementById("scenes"), over=document.getElementById("overlay");
function el(tag,cls,html){var e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;return e;}
function fmt(t){return String(t).replace(/\*\*(.+?)\*\*/g,'<b class="acc-lime">$1</b>').replace(/\^\^(.+?)\^\^/g,'<b class="acc-orange">$1</b>');}
function box(e,b){e.style.left=b.x+"px";e.style.top=b.y+"px";e.style.width=b.w+"px";e.style.height=b.h+"px";}
function hideAt(sel,t){tl.to(sel,{autoAlpha:0,duration:.14,ease:"power2.in"},Math.max(0,t-.14));tl.set(sel,{autoAlpha:0},t);}
function riseIn(sel,t){tl.fromTo(sel,{autoAlpha:0,y:26},{autoAlpha:1,y:0,duration:.22,ease:"power3.out"},t);}
function popIn(sel,t,over){tl.fromTo(sel,{autoAlpha:0,scale:.7},{autoAlpha:1,scale:1,duration:.2,ease:"back.out("+(over||1.5)+")"},t);}

function buildObject(o,scene,idx){
  var id="ob-"+scene.id+"-"+idx, e=null, until=o.until!=null?o.until:scene.to;
  var onTop=(scene.kind==="screen"||scene.kind==="overlay");
  var host=onTop?over:(scene.node||root);
  var ox=0,oy=0; if(onTop&&scene.kind==="screen"){var z=scene.zone||{x:96,y:96}; ox=z.x; oy=z.y;}
  function place(el,b){box(el,{x:b.x+ox,y:b.y+oy,w:b.w,h:b.h});}
  if(o.kind==="clock"){
    e=el("div","clock",'<svg viewBox="0 0 300 300"><circle cx="150" cy="150" r="140"/>'+
      [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){var a=i*30*Math.PI/180,x1=150+Math.sin(a)*118,y1=150-Math.cos(a)*118,x2=150+Math.sin(a)*132,y2=150-Math.cos(a)*132;return '<line class="tick" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';}).join("")+
      '<line class="hand h" x1="150" y1="150" x2="150" y2="80"/><line id="'+id+'-m" class="hand" x1="150" y1="150" x2="150" y2="40"/></svg>');
    e.id=id; box(e,o.box); root.appendChild(e);
    popIn("#"+id,o.at,1.3); tl.to("#"+id+"-m",{rotation:120,duration:until-o.at,ease:"none"},o.at); hideAt("#"+id,until);
  }else if(o.kind==="socket"){
    e=el("div","socket-row"); e.id=id; box(e,o.box);
    e.innerHTML='<div class="sk-chip"><img src="assets/brand/claude.svg" alt=""><span>CLAUDE</span></div><div class="sk-wire"></div>'+
      '<div id="'+id+'-c" class="sk-chip composio"><img src="assets/brand/composio.svg" alt=""></div><div class="sk-wire"></div>'+
      '<div class="sk-chip"><img src="assets/brand/instagram.svg" alt=""><span>INSTAGRAM</span></div>';
    scene.node.appendChild(e); riseIn("#"+id,o.at+.1); popIn("#"+id+"-c",o.composioAt,1.6);
    tl.to("#"+id+" .sk-wire",{borderTopColor:LIME,borderTopStyle:"solid",duration:.25},o.composioAt+.1);
  }else if(o.kind==="arrow"){
    var f=o.from,t=o.to,cx=(f.x+t.x)/2+140,cy=(f.y+t.y)/2-40;
    var d="M "+f.x+" "+f.y+" Q "+cx+" "+cy+" "+t.x+" "+t.y;
    document.getElementById("arrow-path").setAttribute("d",d);
    var ang=Math.atan2(t.y-cy,t.x-cx),L=34,W=18,hx=t.x,hy=t.y;
    var p1x=hx-Math.cos(ang)*L+Math.sin(ang)*W,p1y=hy-Math.sin(ang)*L-Math.cos(ang)*W,p2x=hx-Math.cos(ang)*L-Math.sin(ang)*W,p2y=hy-Math.sin(ang)*L+Math.cos(ang)*W;
    document.getElementById("arrow-head").setAttribute("d","M "+hx+" "+hy+" L "+p1x.toFixed(1)+" "+p1y.toFixed(1)+" L "+p2x.toFixed(1)+" "+p2y.toFixed(1)+" Z");
    draw("#arrow-path",o.at,.27,1200); tl.fromTo("#arrow-head",{autoAlpha:0,scale:.4},{autoAlpha:1,scale:1,duration:.12,ease:"back.out(2)"},o.at+.22);
    hideAt("#arrow-path",until); hideAt("#arrow-head",until);
  }else if(o.kind==="highlight"){
    e=el("div","highlight"+(o.color==="lime"?" lime":"")); e.id=id; box(e,o.box); over.appendChild(e);
    popIn("#"+id,o.at,1.2); hideAt("#"+id,until);
  }else if(o.kind==="bubble"){
    e=el("div","bubble",o.text); e.id=id; place(e,o.box); host.appendChild(e); popIn("#"+id,o.at,1.5); hideAt("#"+id,until);
  }else if(o.kind==="stamp"){
    e=el("div","stamp "+(o.color||"lime"),o.text); e.id=id; place(e,o.box); e.style.fontSize=Math.round(o.box.h*.62)+"px"; host.appendChild(e);
    tl.fromTo("#"+id,{autoAlpha:0,scale:.55,rotation:(o.rotate||0)-8},{autoAlpha:1,scale:1,rotation:o.rotate||0,duration:.22,ease:"back.out(1.8)"},o.at); hideAt("#"+id,until);
  }else if(o.kind==="note"){
    e=el("div","note",o.text); e.id=id; place(e,o.box); host.appendChild(e);
    tl.fromTo("#"+id,{autoAlpha:0,rotation:-3,y:10},{autoAlpha:1,rotation:-3,y:0,duration:.22,ease:"power3.out"},o.at); hideAt("#"+id,until);
  }else if(o.kind==="chip"){
    e=el("div","chip-cta",o.text); e.id=id; box(e,o.box); over.appendChild(e); popIn("#"+id,o.at,1.4); hideAt("#"+id,until);
  }else if(o.kind==="chart"){
    e=el("div","chart"); e.id=id; box(e,o.box);
    var n=o.bars.length, mx=Math.max.apply(null,o.bars);
    o.bars.forEach(function(v,i){var b=el("i",v===mx?"top":"");b.style.height=Math.round(v*100)+"%";b.id=id+"-b"+i;e.appendChild(b);});
    if(onTop) place(e,o.box); host.appendChild(e); riseIn("#"+id,o.at);
    tl.fromTo("#"+id+" i",{scaleY:0},{scaleY:1,duration:.35,ease:"power3.out",stagger:.06},o.at+.05); hideAt("#"+id,until);
  }
  if(e && !e.parentNode) root.appendChild(e);
}

/* цветные радиалы фона: по сцене, кроссфейд 0.4 с, лежат под карточками и спикером */
["lime","orange","blue"].forEach(function(k){var d=el("div","tint tint-"+k); d.id="tint-"+k; root.insertBefore(d,root.firstChild);});
tl.set(".tint",{autoAlpha:0},0);
SC.forEach(function(s,si){
  if(s.tint){ var nx=SC[si+1]; tl.to("#tint-"+s.tint,{autoAlpha:1,duration:.4,ease:"power2.out"},s.from);
    if(!(nx&&nx.tint===s.tint&&Math.abs(nx.from-s.to)<0.06)){ tl.to("#tint-"+s.tint,{autoAlpha:0,duration:.3,ease:"power2.in"},s.to-.3); } }
});
/* рисованный маркер-переход (Codex markerTransition): штрих лаймом через кадр за 0.24 с */
(SB.markers||[]).forEach(function(m,i){
  var sv=document.createElementNS("http://www.w3.org/2000/svg","svg"); sv.setAttribute("viewBox","0 0 1080 1920"); sv.setAttribute("class","marker"); sv.id="marker-"+i;
  var pth=document.createElementNS("http://www.w3.org/2000/svg","path"); pth.setAttribute("d","M-60 900 C 180 820 300 1040 540 940 C 780 840 900 1060 1140 960"); pth.id="marker-"+i+"-p"; sv.appendChild(pth); over.appendChild(sv);
  tl.set("#"+sv.id,{autoAlpha:0},0);
  tl.set("#"+pth.id,{strokeDasharray:1400,strokeDashoffset:1400},m.at);
  tl.to("#"+sv.id,{autoAlpha:.9,duration:.06,ease:"power2.out"},m.at);
  tl.to("#"+pth.id,{strokeDashoffset:0,duration:.24,ease:"power3.out"},m.at);
  tl.to("#"+sv.id,{autoAlpha:0,duration:.12,ease:"power2.in"},m.at+.24);
  tl.set("#"+sv.id,{autoAlpha:0},m.at+.36);
});
SC.forEach(function(s){
  var node=el("div","scene"); node.id="sc-"+s.id; if(s.zone) box(node,s.zone);
  s.node=node;
  if(s.kind==="card"){
    var card=el("div","scene-card"); node.appendChild(card);
    card.appendChild(el("div","eyebrow",s.eyebrow||""));
    var h=el("div","headline"+(s.headlineStyle==="script"?" script":""),fmt(s.headline||"")); card.appendChild(h);
    if(s.subline){var sl=el("div","subline"+(s.subline.style==="sans"?" sans":""),s.subline.text); sl.id=node.id+"-sub"; card.appendChild(sl);}
    if(s.list){var list=el("div","list"); card.appendChild(list);
      s.list.forEach(function(li,i){var line=el("div","line",'<span class="n">'+String(i+1).padStart(2,"0")+'</span>'+(ICONS[li.icon]||"")+'<span class="t">'+li.text+'</span>'); line.id=node.id+"-l"+i; list.appendChild(line);});}
    if(s.chips){var row=el("div","chips"); card.appendChild(row);
      s.chips.forEach(function(c,i){var ch=el("div","pchip",'<img src="'+c.icon+'" alt=""><span>'+c.text+'</span>'); ch.id=node.id+"-c"+i; row.appendChild(ch);});}
    // объекты карточки живут внутри карточки (координаты относительно карточки)
    s.node=card;
  }else if(s.kind==="kinetic"){
    if(s.kicker){var kk=el("div","kicker",s.kicker); kk.id=node.id+"-kicker"; kk.style.marginBottom="18px"; node.appendChild(kk);}
    var st=el("div","stack"); if(s.kicker){st.style.position="relative";st.style.marginTop="0";} node.appendChild(st);
    s.stack.forEach(function(k,i){var line=el("div","kl "+k.role+(k.color?" "+k.color:""));
      line.innerHTML=(k.icon?'<img class="ico" src="'+k.icon+'" alt="">':'')+'<span>'+k.text+'</span>'+(k.sticker?'<img class="sticker" src="'+k.sticker+'" alt="">':'');
      line.id=node.id+"-k"+i; st.appendChild(line);});
  }else if(s.kind==="screen"){
    var scr=el("div","screen"); box(scr,{x:s.screen.x-96,y:s.screen.y-96,w:s.screen.w,h:s.screen.h}); node.appendChild(scr);
    if(s.screen.bar){scr.appendChild(el("div","screen-bar",s.screen.bar));}
    // рамка окна под клипами этой сцены
    (SB.clips||[]).filter(function(c){return c.at>=s.from-0.01&&c.at<s.to;}).slice(0,1).forEach(function(c){
      var fr=el("div","screen-frame"); box(fr,{x:c.box.x-96-8,y:c.box.y-96-8,w:c.box.w+16,h:c.box.h+16}); node.appendChild(fr);});
    var lab=el("div","labels"); lab.style.left="0";lab.style.top="0"; node.appendChild(lab);
    (s.labels||[]).forEach(function(l,i){var e=el("div","label"+(l.color?" "+l.color:""),(l.icon?'<img class="lico" src="'+l.icon+'" alt="">':'')+l.text); e.id=node.id+"-lab"+i; lab.appendChild(e);});
  }else if(s.kind==="overlay"){
    node.style.left="0";node.style.top="0";node.style.width="1080px";node.style.height="1920px";
  }
  if(s.fullscreen){ tl.to("#spk",{autoAlpha:0,duration:.14,ease:"power2.in"},s.from); tl.set("#spk",{autoAlpha:0},s.from+.14); tl.to("#spk",{autoAlpha:1,duration:.14,ease:"power2.out"},s.to-.02); }
  root.appendChild(node);
  /* тайминги сцены */
  tl.set("#"+node.id,{autoAlpha:0},0);
  if(s.kind==="overlay"){tl.set("#"+node.id,{autoAlpha:1},s.from);}else{riseIn("#"+node.id,s.from);}
  hideAt("#"+node.id,s.to);
  if(s.subline){tl.set("#"+node.id+"-sub",{autoAlpha:0},0); riseIn("#"+node.id+"-sub",s.subline.at);}
  (s.list||[]).forEach(function(li,i){var sel="#"+node.id+"-l"+i; tl.set(sel,{autoAlpha:0},0);
    tl.fromTo(sel,{autoAlpha:0,x:-24},{autoAlpha:1,x:0,duration:.22,ease:"power3.out"},li.at);
    tl.to(sel,{backgroundColor:"#B6FF00",duration:.12},li.at);
    if(i>0) tl.to("#"+node.id+"-l"+(i-1),{backgroundColor:"rgba(182,255,0,0)",duration:.2},li.at);});
  (s.chips||[]).forEach(function(c,i){var sel="#"+node.id+"-c"+i; tl.set(sel,{autoAlpha:0},0); popIn(sel,c.at,1.5);});
  (s.stack||[]).forEach(function(k,i){var sel="#"+node.id+"-k"+i; tl.set(sel,{autoAlpha:0},0);
    if(k.role==="number"){popIn(sel,k.at,1.7);}else{tl.fromTo(sel,{autoAlpha:0,y:14},{autoAlpha:1,y:0,duration:.1,ease:"power2.out"},k.at);}
    if(k.sticker){tl.fromTo(sel+" .sticker",{scale:.4,rotation:-20},{scale:1,rotation:0,duration:.22,ease:"back.out(1.8)"},k.at+.05);}});
  (s.labels||[]).forEach(function(l,i){var sel="#"+node.id+"-lab"+i; tl.set(sel,{autoAlpha:0},0); riseIn(sel,l.at);
    var nxt=s.labels[i+1]; hideAt(sel,nxt?nxt.at:s.to);});
  (s.objects||[]).forEach(function(o,i){buildObject(o,s,i);});
});
