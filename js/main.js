/* Cycler landing page
   Copyright (C) 2026 Abhiram N J
   Licensed under the GNU Affero General Public License v3.0. See LICENSE. */
(function(){
"use strict";
var $=function(s,r){return (r||document).querySelector(s)}, $$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var fx={};
var reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function spline(pts,closed){ // Catmull-Rom through points, as cubic beziers
  var n=pts.length,d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1),g=function(i){return closed?pts[(i+n)%n]:pts[Math.max(0,Math.min(n-1,i))]};
  for(var i=0;i<(closed?n:n-1);i++){var p0=g(i-1),p1=g(i),p2=g(i+1),p3=g(i+2);
    d+='C'+(p1[0]+(p2[0]-p0[0])/6).toFixed(1)+' '+(p1[1]+(p2[1]-p0[1])/6).toFixed(1)+' '+(p2[0]-(p3[0]-p1[0])/6).toFixed(1)+' '+(p2[1]-(p3[1]-p1[1])/6).toFixed(1)+' '+p2[0].toFixed(1)+' '+p2[1].toFixed(1)}
  return d+(closed?'Z':'')}

/* ---- the loop shape used by hero, share cards and flyover ---- */
(function(){var pts=[],N=40;for(var i=0;i<N;i++){var t=i/N*Math.PI*2+2.2,r=1+.17*Math.sin(3*t+.4)+.1*Math.sin(5*t+1.9)+.05*Math.sin(2*t);pts.push([100+78*r*Math.cos(t)*1.02,80+56*r*Math.sin(t)])}
  var d=spline(pts,true);$$('.js-blob').forEach(function(p){p.setAttribute('d',d)});
  $$('.js-blob-start').forEach(function(c){c.setAttribute('cx',pts[0][0]);c.setAttribute('cy',pts[0][1])})})();

/* ---- a small drawn map ---- */
function drawMap(cv,seed,scale){var r=cv.getBoundingClientRect();if(!r.width)return;var dpr=Math.min(2,devicePixelRatio||1),w=r.width,h=r.height;cv.width=w*dpr;cv.height=h*dpr;
  var c=cv.getContext('2d'),R=rng(seed),s=scale||1;c.scale(dpr,dpr);c.fillStyle='#ECEEE8';c.fillRect(0,0,w,h);
  c.save();c.translate(w/2,h/2);c.rotate(-.09);c.translate(-w/2,-h/2);var X=-w*.2,Y=-h*.2,W=w*1.4,H=h*1.4;
  function blob(x,y,rad,col){c.fillStyle=col;c.beginPath();for(var i=0;i<=24;i++){var a=i/24*6.283,rr=rad*(1+.25*Math.sin(3*a+x)+.12*Math.sin(5*a+y));c.lineTo(x+rr*Math.cos(a)*1.3,y+rr*Math.sin(a))}c.fill()}
  blob(X+W*(.15+R()*.2),Y+H*(.25+R()*.2),90*s,'#DCE5D2');blob(X+W*(.6+R()*.25),Y+H*(.65+R()*.2),120*s,'#DCE5D2');blob(X+W*(.55+R()*.2),Y+H*(.2+R()*.15),60*s,'#CFE0EA');
  c.strokeStyle='#fff';c.lineCap='round';var x=X;while(x<X+W){x+=(46+R()*88)*s;c.lineWidth=(R()<.22?7:3)*s;c.beginPath();c.moveTo(x,Y);c.lineTo(x+(R()-.5)*30,Y+H);c.stroke()}
  var y=Y;while(y<Y+H){y+=(42+R()*80)*s;c.lineWidth=(R()<.22?7:3)*s;c.beginPath();c.moveTo(X,y);c.lineTo(X+W,y+(R()-.5)*30);c.stroke()}
  c.lineWidth=9*s;c.beginPath();c.moveTo(X,Y+H*.85);c.bezierCurveTo(X+W*.3,Y+H*.6,X+W*.55,Y+H*.75,X+W,Y+H*.3);c.stroke();c.restore()}
function maps(){drawMap($('#heroMap'),7,1.15);drawMap($('#planMap'),21,.8);drawMap($('#flyMap'),33,1.2)}

/* ---- elevation: low 819 m, high 982 m, 412 m of climb ---- */
function g(p,m,s){var z=(p-m)/s;return Math.exp(-z*z)}
function elev(p){return 850-31*g(p,.15,.07)+132*g(p,.52,.1)+64*g(p,.84,.055)}
var CL=[0];(function(){var t=0,prev=elev(0);for(var i=1;i<=400;i++){var e=elev(i/400);if(e>prev)t+=e-prev;prev=e;CL.push(t)}for(i=0;i<CL.length;i++)CL[i]=CL[i]/t*412})();
function climbAt(p){return CL[Math.round(Math.max(0,Math.min(1,p))*400)]}
function profPath(w,h,pad){var d='M0 '+h;for(var i=0;i<=100;i++){var p=i/100;d+='L'+(p*w).toFixed(1)+' '+(h-pad-(elev(p)-819)/163*(h-pad*2)).toFixed(1)}return d+'L'+w+' '+h+'Z'}
$('#profHud').setAttribute('d',profPath(400,30,4));$('#profBig').setAttribute('d',profPath(400,150,18));$$('.js-prof').forEach(function(p){p.setAttribute('d',profPath(400,150,18))});

/* ---- planner ---- */
(function(){var km=$('#km'),dir='N',spd=24,DV={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},CF={N:12.7,E:7.9,S:6.1,W:9.6};
  function upd(){var k=+km.value,v=DV[dir],Rd=26+68*Math.log(k/5)/Math.log(40),cx=200,cy=150,sx=cx-v[0]*Rd,sy=cy-v[1]*Rd,t0=Math.atan2(sy-cy,sx-cx),R=rng(k*7+dir.charCodeAt(0)),a=R()*6,b=R()*6,pts=[];
    for(var i=0;i<36;i++){var t=t0+i/36*6.283,wgt=Math.pow(Math.sin((t-t0)/2),2),n=.2*Math.sin(3*t+a)+.13*Math.sin(5*t+b);pts.push([cx+Rd*(1+n*wgt)*Math.cos(t)*1.12,cy+Rd*(1+n*wgt)*Math.sin(t)])}
    $('#planLoop').setAttribute('d',spline(pts,true));$('#planStart').setAttribute('cx',sx);$('#planStart').setAttribute('cy',sy);
    var climb=Math.round(k*CF[dir]),mins=Math.round(k/spd*60+climb/9),per=climb/k;
    $('#kmOut').textContent=k;if(fx.plan)fx.plan(climb,mins);else setPlan(climb,mins);
    $('#pDiff').textContent=k*(1+per/10)<30?'Easy':k*(1+per/10)<95?'Moderate':'Hard'}
  km.addEventListener('input',upd);
  radio('#dirs',function(b){dir=b.dataset.d;upd()});radio('#bikes',function(b){spd=+b.dataset.b;upd()});upd()})();
function setPlan(climb,mins){climb=Math.round(climb);mins=Math.round(mins);$('#pClimb').textContent=climb.toLocaleString('en-IN')+' m';$('#pTime').textContent=(mins>=60?Math.floor(mins/60)+'h ':'')+(mins%60)+'m'}
function radio(sel,fn){var bs=$$(sel+' [role=radio]');bs.forEach(function(b){b.addEventListener('click',function(){bs.forEach(function(x){x.setAttribute('aria-checked',x===b)});fn&&fn(b)})})}
radio('#feel');$$('#tags .chip').forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true')})});

/* ---- title flows from the save page to the share cards ---- */
$$('.js-title-in').forEach(function(inp){inp.addEventListener('input',function(){var v=inp.value.trim()||'Morning ride';$$('.js-title').forEach(function(t){t.textContent=v});$$('.js-title-in').forEach(function(o){if(o!==inp)o.value=inp.value})})});
$('#saveForm').addEventListener('submit',function(e){e.preventDefault();if(fx.save)fx.save(e.submitter||$('#saveForm .btn'));$('#savedNote').textContent='Saved. In the app, this ride now lives in your phone\'s storage and nowhere else.'});

/* ---- the track down the ride ---- */
var ride=$('#ride'),svg=$('#track'),pPlan=$('#trackPlan'),pRec=$('#trackRec'),rider=$('#rider'),pulse=$('#riderPulse'),L=0,LUT=[],y0=0,y1=1;
function off(el){var x=0,y=0;while(el&&el!==ride){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent}return [x,y]}
function build(){var chs=$$('.ch',ride),R=rng(11),pts=[];
  chs.forEach(function(ch,i){var s=$('.stone',ch),so=off(s),inn=$('.ch-in',ch),x=so[0]+s.offsetWidth/2,top=so[1]+s.offsetHeight/2,bot=off(inn)[1]+inn.offsetHeight,amp=Math.min(16,s.offsetWidth/3);
    pts.push([x,top]);if(i===chs.length-1)return;
    for(var y=top+150;y<bot-40;y+=150)pts.push([x+(R()-.5)*2*amp,y]);pts.push([x,bot])});
  var d=spline(pts,false);pPlan.setAttribute('d',d);pRec.setAttribute('d',d);L=pPlan.getTotalLength();pRec.style.strokeDasharray=L+' '+L;
  LUT=[];var n=Math.ceil(L/10);for(var i=0;i<=n;i++){var l=L*i/n;LUT.push([pPlan.getPointAtLength(l).y,l])}
  y0=pts[0][1];y1=pts[pts.length-1][1];
  // kilometre stones agree with the bar
  chs.forEach(function(ch,i){var s=$('.stone',ch),k=lenAt(off(s)[1]+s.offsetHeight/2)/L*32.4;$('.stone b',ch).textContent=i===0?'0':i===chs.length-1?'32.4':k.toFixed(k<10?1:0)});
  frame(true)}
function lenAt(y){if(y<=y0)return 0;if(y>=y1)return L;var lo=0,hi=LUT.length-1;while(hi-lo>1){var m=lo+hi>>1;if(LUT[m][0]<y)lo=m;else hi=m}
  var a=LUT[lo],b=LUT[hi];return a[1]+(b[1]-a[1])*((y-a[0])/Math.max(.001,b[0]-a[0]))}

/* ---- ride state ---- */
var hud=$('#hud'),p=0,speed=0,target=0,lastY=scrollY,lastT=performance.now(),lastMove=0,moving=0,elapsedStart=0,prevFrame=performance.now(),state='';
var els={dist:$$('.js-dist'),speed:$$('.js-speed'),moving:$$('.js-moving'),climb:$$('.js-climb'),status:$$('.js-status'),stops:$$('.js-stop'),elev:$$('.js-elev'),elapsed:$$('.js-elapsed')};
function set(list,v){for(var i=0;i<list.length;i++)if(list[i].textContent!==v)list[i].textContent=v}
function mmss(s){s=Math.floor(s);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
addEventListener('scroll',function(){var now=performance.now(),dt=now-lastT;if(dt>16){target=Math.min(46,Math.abs(scrollY-lastY)/dt*1000/38);lastY=scrollY;lastT=now}lastMove=now},{passive:true});
function frame(force){var now=performance.now(),dt=Math.min(.1,(now-prevFrame)/1000);prevFrame=now;
  var rr=ride.getBoundingClientRect(),vh=innerHeight,vis=rr.top<vh*.75&&rr.bottom>vh*.35;hud.classList.toggle('on',vis);
  if(!vis&&force!==true)return;
  var l=lenAt(vh*.5-rr.top);p=L?l/L:0;
  pRec.style.strokeDashoffset=L-l;var pt=pPlan.getPointAtLength(l);rider.setAttribute('cx',pt.x);rider.setAttribute('cy',pt.y);pulse.setAttribute('cx',pt.x);pulse.setAttribute('cy',pt.y);
  var active=now-lastMove<700&&p>0&&p<1;if(now-lastMove>140)target=0;speed+=(target-speed)*Math.min(1,dt*7);if(!active&&speed<.3)speed=0;
  if(active){moving+=dt;if(!elapsedStart)elapsedStart=now}
  var st=p<=0?'Ready. Scroll to ride':p>=1?'Finished':active?'Recording':'Auto-paused';
  if(st!==state){state=st;set(els.status,st);$('#hudDot').style.background=st==='Recording'?'':'#9B9A97';$('#pauseCard').dataset.state=st==='Auto-paused'?'paused':'recording';if(fx.state)fx.state(st)}
  set(els.dist,(p*32.4).toFixed(2));set(els.speed,(p>=1?0:speed).toFixed(1));set(els.moving,mmss(moving));set(els.climb,Math.round(climbAt(p))+' m');set(els.elev,Math.round(elev(p))+' m');
  set(els.elapsed,elapsedStart?mmss((now-elapsedStart)/1000):'00:00');
  for(var i=0;i<els.stops.length;i++)els.stops[i].setAttribute('offset',p);
  var e=(elev(p)-819)/163;$('#hudMe').style.left=(p*100)+'%';$('#hudMe').style.bottom=(4+e*22)+'px';
  $('#profDot').setAttribute('cx',p*400);$('#profDot').setAttribute('cy',150-18-e*114)}
(function loop(){frame();requestAnimationFrame(loop)})();

/* ---- share cards ---- */
var cards=$('#cards');function step(dir){var w=$('.sc',cards).getBoundingClientRect().width+20;cards.scrollBy({left:dir*w,behavior:reduce?'auto':'smooth'})}
$('#prevCard').addEventListener('click',function(){step(-1)});$('#nextCard').addEventListener('click',function(){step(1)});
cards.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){step(1);e.preventDefault()}if(e.key==='ArrowLeft'){step(-1);e.preventDefault()}});

/* ---- flyover: slow, fast, slow ---- */
(function(){var tr=$('#flyTrack'),dot=$('#flyDot'),plane=$('#flyPlane'),btn=$('#flyBtn'),len=tr.getTotalLength(),playing=false;
  function at(t){var q=tr.getPointAtLength(len*Math.min(.9999,t));dot.setAttribute('cx',q.x);dot.setAttribute('cy',q.y);tr.setAttribute('stroke-dashoffset',1-t)}
  at(1);btn.addEventListener('click',function(){if(playing)return;playing=true;btn.textContent='Flying…';var t0=performance.now(),dur=reduce?10:6500;
    (function tick(now){var u=Math.min(1,(now-t0)/dur),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;at(e);plane.style.transform='rotateX(58deg) rotateZ('+(-18+36*e)+'deg) scale('+(1+.18*Math.sin(Math.PI*e))+')';
      if(u<1)requestAnimationFrame(tick);else{playing=false;btn.innerHTML='▶&nbsp; Play again'}})(t0)})})();

/* ---- activity chart ---- */
(function(){var D=[[12.4,0,18.6,0,0,32.4,0],[38,0,55,0,0,94,0],[96,0,141,0,0,412,0]],U=['km','','m'],bars=$$('#bars div');
  function show(m){var mx=Math.max.apply(0,D[m]),tot=D[m].reduce(function(a,b){return a+b},0);bars.forEach(function(b,i){b.style.height=(D[m][i]/mx*100)+'%'});
    $('#actTotal').innerHTML=m===1?Math.floor(tot/60)+'h '+(tot%60)+'m':(m===0?tot.toFixed(1):tot)+'<small>'+U[m]+'</small>'}
  radio('#metric',function(b){show(+b.dataset.m)});show(0)})();
$('#lubeBtn').addEventListener('click',function(){$('#lubeTxt').textContent='0 of 250 km since today';$('#lubeBar').className='bar';$('#lubeBar').firstElementChild.style.width='1%';this.textContent='Done today';this.disabled=true});

/* ---- boot ---- */
function layout(){maps();build()}
layout();var rt;addEventListener('resize',function(){clearTimeout(rt);rt=setTimeout(layout,150)});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(build);addEventListener('load',build);
if('ResizeObserver' in window)new ResizeObserver(function(){clearTimeout(rt);rt=setTimeout(build,150)}).observe(ride);

/* ================= GSAP layer =================
   Everything above works without it. This adds the choreography. */
(function(){
var root=document.documentElement;
if(reduce||!window.gsap||!window.ScrollTrigger){root.classList.remove('pre');return}
gsap.registerPlugin(ScrollTrigger);root.classList.add('gs');
var fine=matchMedia('(hover:hover) and (pointer:fine)').matches,wide=matchMedia('(min-width:901px)').matches;

function splitWords(el){var txt=el.textContent.trim(),words=txt.split(/\s+/);el.setAttribute('aria-label',txt);el.textContent='';
  return words.map(function(w,i){var o=document.createElement('span'),n=document.createElement('span');o.className='w';o.setAttribute('aria-hidden','true');n.textContent=w;o.appendChild(n);el.appendChild(o);if(i<words.length-1)el.appendChild(document.createTextNode(' '));return n})}
function splitLines(el){var inner=splitWords(el),lines=[],last=null,cur;
  inner.forEach(function(n){var o=n.parentNode,t=o.offsetTop;if(last===null||Math.abs(t-last)>6){cur=[];lines.push(cur);last=t}cur.push(o)});
  el.textContent='';lines.forEach(function(ws){var d=document.createElement('span');d.className='hline';ws.forEach(function(o,i){d.appendChild(o);if(i<ws.length-1)d.appendChild(document.createTextNode(' '))});el.appendChild(d)});return inner}
function count(el,to,dec,trig,suffix){var c={v:0};gsap.to(c,{v:to,duration:1.5,ease:'power2.out',scrollTrigger:{trigger:trig||el,start:'top 82%',once:true},onUpdate:function(){el.innerHTML=c.v.toFixed(dec)+(suffix||'')}})}

/* ---- 1. hero: load sequence ---- */
function intro(){
  var h1=$('.hero h1'),label=h1.textContent,ws=splitLines(h1),track=$('#heroTrack'),dot=$('.hero-map .js-blob-start'),len=track.getTotalLength();
  root.classList.remove('pre');
  gsap.timeline({defaults:{ease:'expo.out'}})
    .from('#heroMap',{autoAlpha:0,duration:1.8,ease:'power2.out'},0)
    .from('.top .wrap>*',{y:-30,autoAlpha:0,duration:.9,stagger:.1},.2)
    .from(ws,{yPercent:125,fontWeight:400,duration:1.3,stagger:.08},.15)
    .from('.hero-copy p',{y:26,autoAlpha:0,duration:1},.8)
    .from('.hero-facts li',{scale:.4,autoAlpha:0,duration:.7,stagger:.06,ease:'back.out(2.2)'},1)
    .from('.hero-cta .btn',{y:30,autoAlpha:0,duration:.9,stagger:.1,clearProps:'transform'},1.15)
    .from('.hero-map svg',{scale:.6,rotation:-30,autoAlpha:0,duration:1.7,transformOrigin:'50% 50%'},.3)
    .fromTo(track,{strokeDashoffset:1},{strokeDashoffset:0,duration:2.6,ease:'power2.inOut',onUpdate:function(){var q=track.getPointAtLength(len*Math.min(.9999,1-gsap.getProperty(track,'strokeDashoffset')));dot.setAttribute('cx',q.x);dot.setAttribute('cy',q.y)}},.6)
    .from('.wx',{scale:.5,autoAlpha:0,duration:.8,ease:'back.out(2)'},1.7)
    .add(function(){h1.textContent=label;h1.removeAttribute('aria-label')},2.3)
    .to('#heroComet',{opacity:.9,duration:.6},3.2);
  gsap.to('#heroComet',{strokeDashoffset:-1,duration:6,ease:'none',repeat:-1});
}
var started=false;function go(){if(started)return;started=true;intro();ScrollTrigger.refresh()}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);setTimeout(go,1200);

/* hero: scroll out into the night */
gsap.timeline({scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:true}})
  .fromTo('#heroMap',{scale:1},{scale:1.25,ease:'none'},0)
  .to('.hero-map',{rotation:28,scale:1.3,yPercent:12,ease:'none'},0)
  .to('.hero-copy',{yPercent:-16,ease:'none'},0)
  .to('.hero-night',{opacity:1,ease:'power2.in'},0);
if(fine){var hx=gsap.quickTo('.hero-map svg','x',{duration:.8,ease:'power3'}),hy=gsap.quickTo('.hero-map svg','y',{duration:.8,ease:'power3'}),wx=gsap.quickTo('.wx','x',{duration:1,ease:'power3'}),wy=gsap.quickTo('.wx','y',{duration:1,ease:'power3'});
  $('.hero').addEventListener('pointermove',function(e){var r=this.getBoundingClientRect(),px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;hx(px*26);hy(py*20);wx(px*-34);wy(py*-24)});
  $$('.hero-cta .btn').forEach(function(b){var qx=gsap.quickTo(b,'x',{duration:.45,ease:'power3'}),qy=gsap.quickTo(b,'y',{duration:.45,ease:'power3'});
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();qx((e.clientX-r.left-r.width/2)*.28);qy((e.clientY-r.top-r.height/2)*.4)});
    b.addEventListener('pointerleave',function(){qx(0);qy(0)})})}

/* ---- section headings: words rise out of a mask ---- */
function head(h){var hd=$('h2',h);if(!hd)return;var ws=splitWords(hd);
  gsap.timeline({scrollTrigger:{trigger:h,start:'top 82%',once:true}})
    .from(ws,{yPercent:120,duration:1,ease:'expo.out',stagger:.045})
    .from($$('.when,p,.btn',h),{y:24,autoAlpha:0,duration:.8,stagger:.08,ease:'power3.out'},.15)}

/* ---- 2. plan ---- */
head($('.plan .sec-head'));
gsap.set('#planLoop',{strokeDasharray:1,strokeDashoffset:1});
var pv={c:0,m:0};
fx.planDraw=function(){gsap.fromTo('#planLoop',{strokeDashoffset:1},{strokeDashoffset:0,duration:.9,ease:'power2.out',overwrite:true});gsap.fromTo('#planStart',{attr:{r:15}},{attr:{r:7},duration:.7,ease:'back.out(3)',overwrite:true})};
fx.plan=function(c,m){gsap.to(pv,{c:c,m:m,duration:.5,ease:'power2.out',overwrite:true,onUpdate:function(){setPlan(pv.c,pv.m)}});fx.planDraw()};
gsap.timeline({scrollTrigger:{trigger:'.planner',start:'top 78%',once:true}})
  .fromTo('.planner .mapbox',{clipPath:'inset(0% 100% 0% 0% round 20px)'},{clipPath:'inset(0% 0% 0% 0% round 20px)',duration:1.3,ease:'expo.inOut'})
  .from('#planMap',{scale:1.5,duration:1.8,ease:'power3.out'},0)
  .from('.ctl',{x:70,autoAlpha:0,duration:1,ease:'power3.out'},.25)
  .from('.ctl .row,.ctl .result>div',{y:22,autoAlpha:0,stagger:.07,duration:.6,ease:'power3.out'},.55)
  .add(function(){pv.c=0;pv.m=0;$('#km').dispatchEvent(new Event('input'))},.8);
gsap.from('.plan-more li',{y:40,autoAlpha:0,stagger:.12,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.plan-more',start:'top 90%',once:true}});

/* ---- 3. dawn: the clock runs through the night, pinned ---- */
(function(){var ck=$('#clock'),dl=$('#dawnLine'),o={m:21*60+40},phase=-1,lines=['Route saved. Lights out.','Still dark. Still quiet.','The alarm goes off before the traffic does.'];
  function tick(){var m=Math.round(o.m)%1440,h=Math.floor(m/60);ck.textContent=(h%12||12)+':'+String(m%60).padStart(2,'0')+(h<12?' am':' pm')}
  gsap.set('.dawn-sky',{opacity:0});gsap.set('.dawn-stars',{opacity:1});gsap.set('.dawn-sun',{yPercent:170});gsap.set('.dawn-in',{color:'#EDEDEB'});tick();dl.textContent=lines[0];
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#dawn',start:'top top',end:'+=170%',pin:true,scrub:.6,onUpdate:function(s){var ph=s.progress<.3?0:s.progress<.74?1:2;if(ph!==phase){phase=ph;dl.textContent=lines[ph];gsap.fromTo(dl,{y:14,autoAlpha:0},{y:0,autoAlpha:1,duration:.5,ease:'power3.out'})}}}})
    .to(o,{m:29*60+52,duration:1,ease:'power1.inOut',onUpdate:tick},0)
    .fromTo('.clock',{scale:.78},{scale:1.06,duration:1},0)
    .to('.dawn-stars',{opacity:0,yPercent:-6,duration:.32},.28)
    .to('.dawn-sky',{opacity:1,duration:.4},.34)
    .to('.dawn-sun',{yPercent:-12,duration:.56,ease:'power1.out'},.42)
    .to('.dawn-hills',{color:'#8FA08A',duration:.3},.6)
    .to('.dawn-in',{color:'#1C1C1A',duration:.2},.6)
    .to('.dawn-day',{opacity:1,duration:.13},.87)})();

/* ---- 4. the ride ---- */
gsap.fromTo('#riderPulse',{attr:{r:9},opacity:.55},{attr:{r:32},opacity:0,duration:1.4,repeat:-1,ease:'power2.out'});
$$('.ch').forEach(function(ch){var st=$('.stone',ch),tx=$('.ch-text',ch),demo=$('.ch-body',ch).children[1],ws=splitWords($('h2',tx));
  gsap.timeline({scrollTrigger:{trigger:$('.ch-in',ch),start:'top 74%',once:true}})
    .from(st,{y:-150,rotation:-28,autoAlpha:0,duration:1.05,ease:'bounce.out',transformOrigin:'50% 100%'})
    .from(ws,{yPercent:120,duration:1,ease:'expo.out',stagger:.045},.1)
    .from($$('.when,p,li',tx),{y:22,autoAlpha:0,duration:.75,stagger:.07,ease:'power3.out'},.25)
    .from(demo,{autoAlpha:0,scale:.88,rotationX:16,transformPerspective:900,transformOrigin:'50% 100%',duration:1.15,ease:'power3.out'},.25);
  if(wide)gsap.fromTo(demo,{y:56},{y:-56,ease:'none',scrollTrigger:{trigger:ch,start:'top bottom',end:'bottom top',scrub:true}})});

count($('#startKm'),24.6,1,'#start .panel');
gsap.from('#start .bar span',{scaleX:0,transformOrigin:'0 50%',duration:1.5,ease:'power3.out',scrollTrigger:{trigger:'#start .panel',start:'top 82%',once:true}});
gsap.fromTo('.bignum .huge',{scale:.62},{scale:1,ease:'none',transformOrigin:'50% 60%',scrollTrigger:{trigger:'.bignum',start:'top 95%',end:'top 35%',scrub:.4}});

/* follow a route: the junction plays out as you scroll */
(function(){var plan=$('#navPlan'),rec=$('#navRec'),dot=$('#navDot'),turn=$('#navTurn'),dist=$('#navDist'),len=plan.getTotalLength(),t1=155,t2=261;
  rec.setAttribute('d',plan.getAttribute('d'));rec.style.strokeDasharray=len+' '+len;
  function at(pr){var l=len*(.12+pr*.86);rec.style.strokeDashoffset=len-l;var q=plan.getPointAtLength(l);dot.setAttribute('cx',q.x);dot.setAttribute('cy',q.y);
    var txt,d;if(l<t1){txt='↱ Turn right';d=t1-l}else if(l<t2){txt='↰ Turn left';d=t2-l}else{txt='↑ Straight on';d=-1}
    if(turn.textContent!==txt){turn.textContent=txt;gsap.fromTo(turn.parentNode,{scale:1.14},{scale:1,duration:.45,ease:'back.out(3)',transformOrigin:'0 50%'})}
    dist.textContent=d<0?'11.2 km to go':d<4?'now':'in '+Math.round(d*1.7/10)*10+' m'}
  at(0);ScrollTrigger.create({trigger:'.minimap',start:'top 85%',end:'bottom 20%',scrub:.5,onUpdate:function(s){at(s.progress)}})})();

/* climb: the profile springs up, the interval clock runs */
gsap.from('#profBig',{scaleY:0,transformOrigin:'50% 100%',duration:1.7,ease:'elastic.out(1,.55)',scrollTrigger:{trigger:'.climb',start:'top 72%',once:true}});
(function(){var t={s:151},el=$('#wkTime');gsap.to(t,{s:0,duration:151,ease:'none',scrollTrigger:{trigger:'.climb',start:'top 80%',once:true},onUpdate:function(){el.textContent=mmss(Math.ceil(t.s))}});
  gsap.to('#wkBar',{width:'100%',duration:151,ease:'none',scrollTrigger:{trigger:'.climb',start:'top 80%',once:true}})})();

/* tea stop: steam rises only while you are paused */
var steam=gsap.timeline({repeat:-1,paused:true});
$$('.chai .steam path').forEach(function(pth,i){steam.fromTo(pth,{y:8,autoAlpha:0},{y:-12,autoAlpha:.95,duration:.9,ease:'power1.out'},i*.35).to(pth,{y:-26,autoAlpha:0,duration:.8,ease:'power1.in'},i*.35+.9)});
steam.pause(0);
var done=false;
fx.state=function(st){if(st==='Auto-paused')steam.play();else steam.pause(0);
  gsap.fromTo('#hud .st',{scale:1.14},{scale:1,duration:.5,ease:'back.out(3)',transformOrigin:'0 50%'});
  if(st==='Finished'&&!done){done=true;gsap.fromTo('#hud',{backgroundColor:'#F4C20D'},{backgroundColor:'#FFFFFF',duration:1.4,ease:'power2.out'});gsap.to('#finish .stone',{keyframes:[{y:-30,duration:.22,ease:'power2.out'},{y:0,duration:.5,ease:'bounce.out'}]})}};

/* no signal: the bars drop away */
(function(){var bars=$$('.sb'),txt=$('#sigTxt');ScrollTrigger.create({trigger:'#offline .panel',start:'top 88%',end:'top 32%',scrub:true,onUpdate:function(s){var n=Math.max(0,4-Math.floor(s.progress*4.999));bars.forEach(function(b,i){b.setAttribute('fill',i<n?'#1C1C1A':'#D8DBD2')});txt.textContent=n?'4G':'No service'}})})();

/* finish: save bursts in the route's colours */
fx.save=function(btn){var f=$('#saveForm'),r=btn.getBoundingClientRect(),fr=f.getBoundingClientRect(),cols=['#E5484D','#2563EB','#F4C20D','#1C1C1A'];
  for(var i=0;i<30;i++){var d=document.createElement('i');d.style.cssText='position:absolute;left:'+(r.left-fr.left+r.width/2)+'px;top:'+(r.top-fr.top+r.height/2)+'px;width:9px;height:9px;border-radius:'+(i%3?'50%':'2px')+';background:'+cols[i%4]+';pointer-events:none;z-index:3';f.appendChild(d);
    var a=Math.random()*6.283,ds=80+Math.random()*170;
    gsap.timeline({onComplete:(function(n){return function(){n.remove()}})(d)}).to(d,{x:Math.cos(a)*ds,y:Math.sin(a)*ds-70,rotation:Math.random()*540,scale:.3+Math.random(),duration:.9+Math.random()*.5,ease:'power3.out'}).to(d,{autoAlpha:0,duration:.4},'-=.4')}
  gsap.fromTo(btn,{scale:.92},{scale:1,duration:.7,ease:'elastic.out(1,.4)'})};

/* ---- 5. stat ticker: drifts with scroll, leans with speed ---- */
(function(){var row=$('.ticker-row'),sk=gsap.quickTo(row,'skewX',{duration:.5,ease:'power3'});
  gsap.fromTo(row,{xPercent:2},{xPercent:-48,ease:'none',scrollTrigger:{trigger:'.ticker',start:'top bottom',end:'bottom top',scrub:.4,onUpdate:function(s){sk(gsap.utils.clamp(-16,16,s.getVelocity()/-180))}}});
  ScrollTrigger.addEventListener('scrollEnd',function(){sk(0)})})();

/* ---- 6. share: a deck that deals itself out ---- */
head($('.share .sec-head'));
(function(){var scs=$$('.sc');
  gsap.from(scs,{x:function(i){return -i*(scs[0].offsetWidth+20)},rotation:function(i){return [-8,6,-4,9,-6][i]},y:function(i){return -i*10},ease:'power2.out',scrollTrigger:{trigger:'#cards',start:'top 95%',end:'top 35%',scrub:.6,invalidateOnRefresh:true}});
  if(fine)scs.forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();gsap.to(c,{rotationY:((e.clientX-r.left)/r.width-.5)*18,rotationX:((e.clientY-r.top)/r.height-.5)*-14,transformPerspective:800,duration:.4,ease:'power2.out'})});
    c.addEventListener('pointerleave',function(){gsap.to(c,{rotationY:0,rotationX:0,duration:.8,ease:'elastic.out(1,.5)'})})})})();
head($('.fly-text'));
gsap.from('.fly-stage',{clipPath:'inset(12% 12% 12% 12% round 24px)',scale:.92,duration:1.4,ease:'expo.out',scrollTrigger:{trigger:'.fly-stage',start:'top 80%',once:true}});
ScrollTrigger.create({trigger:'.fly-stage',start:'top 62%',once:true,onEnter:function(){$('#flyBtn').click()}});

/* ---- 7. look back ---- */
head($('#lookback .sec-head'));
gsap.from('.back-grid>*',{y:70,autoAlpha:0,duration:1,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:'.back-grid',start:'top 82%',once:true}});
gsap.from('#bars div',{scaleY:0,transformOrigin:'50% 100%',duration:1.1,stagger:.08,ease:'back.out(1.6)',scrollTrigger:{trigger:'#bars',start:'top 88%',once:true}});
count($('#actTotal'),63.4,1,'#bars','<small>km</small>');
gsap.from('.care .bar span',{scaleX:0,transformOrigin:'0 50%',duration:1.3,stagger:.15,ease:'power3.out',scrollTrigger:{trigger:'.care',start:'top 80%',once:true}});
gsap.from('.rank>*',{x:-18,autoAlpha:0,stagger:.04,duration:.6,ease:'power3.out',scrollTrigger:{trigger:'.rank',start:'top 88%',once:true}});
(function(){var sc=$('.screens');sc.style.scrollSnapType='none';
  gsap.to(sc,{scrollLeft:function(){return sc.scrollWidth-sc.clientWidth},ease:'none',scrollTrigger:{trigger:sc,start:'top 85%',end:'bottom 15%',scrub:.6,invalidateOnRefresh:true}})})();

/* ---- 8. privacy and install ---- */
head($('.priv .sec-head'));
gsap.from('.never li',{scale:0,autoAlpha:0,stagger:.08,duration:.6,ease:'back.out(2.4)',scrollTrigger:{trigger:'.never',start:'top 88%',once:true}});
gsap.from('.leaves>div',{x:-60,autoAlpha:0,stagger:.14,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.leaves',start:'top 82%',once:true}});
(function(){var ws=splitWords($('#install h2'));
  gsap.timeline({scrollTrigger:{trigger:'#install',start:'top 75%',once:true}})
    .from(ws,{yPercent:120,duration:1,ease:'expo.out',stagger:.045})
    .from('.steps li',{x:-40,autoAlpha:0,stagger:.14,duration:.8,ease:'power3.out'},.2)
    .from('#install .hero-cta .btn',{y:24,autoAlpha:0,stagger:.1,duration:.7,ease:'power3.out',clearProps:'transform'},.6)
    .from('.meta',{y:60,autoAlpha:0,rotation:3,duration:1.1,ease:'power3.out'},.2)
    .from('.meta>div',{y:18,autoAlpha:0,stagger:.06,duration:.6,ease:'power3.out'},.5)})();

addEventListener('load',function(){ScrollTrigger.refresh()});
})();

})();
