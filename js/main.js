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

/* ---- a small drawn map ---- */
function drawMap(cv,seed,scale){var w=cv.offsetWidth,h=cv.offsetHeight;if(!w)return;var dpr=Math.min(2,devicePixelRatio||1); // layout size, so a tilted or scaled canvas still draws square
  cv.width=w*dpr;cv.height=h*dpr;
  var c=cv.getContext('2d'),R=rng(seed),s=scale||1;c.scale(dpr,dpr);c.fillStyle='#ECEEE8';c.fillRect(0,0,w,h);
  c.save();c.translate(w/2,h/2);c.rotate(-.09);c.translate(-w/2,-h/2);var X=-w*.2,Y=-h*.2,W=w*1.4,H=h*1.4;
  function blob(x,y,rad,col){c.fillStyle=col;c.beginPath();for(var i=0;i<=24;i++){var a=i/24*6.283,rr=rad*(1+.25*Math.sin(3*a+x)+.12*Math.sin(5*a+y));c.lineTo(x+rr*Math.cos(a)*1.3,y+rr*Math.sin(a))}c.fill()}
  blob(X+W*(.15+R()*.2),Y+H*(.25+R()*.2),90*s,'#DCE5D2');blob(X+W*(.6+R()*.25),Y+H*(.65+R()*.2),120*s,'#DCE5D2');blob(X+W*(.55+R()*.2),Y+H*(.2+R()*.15),60*s,'#CFE0EA');
  c.strokeStyle='#fff';c.lineCap='round';var x=X;while(x<X+W){x+=(46+R()*88)*s;c.lineWidth=(R()<.22?7:3)*s;c.beginPath();c.moveTo(x,Y);c.lineTo(x+(R()-.5)*30,Y+H);c.stroke()}
  var y=Y;while(y<Y+H){y+=(42+R()*80)*s;c.lineWidth=(R()<.22?7:3)*s;c.beginPath();c.moveTo(X,y);c.lineTo(X+W,y+(R()-.5)*30);c.stroke()}
  c.lineWidth=9*s;c.beginPath();c.moveTo(X,Y+H*.85);c.bezierCurveTo(X+W*.3,Y+H*.6,X+W*.55,Y+H*.75,X+W,Y+H*.3);c.stroke();c.restore()}
function maps(){drawMap($('#heroMap'),7,1.15);drawMap($('#phoneMap'),7,.5);drawMap($('#planMap'),21,.8);drawMap($('#flyMap'),33,1.2)}

/* ---- the ride that the whole page describes ----
   Starts as the example ride. The planner replaces it with a real loop. */
var RIDE={real:false,name:'Nandi foothills at sunrise',place:'Nandi foothills',km:32.4,climb:412,min:94,date:'Wed 18 Nov 2026',low:819,high:982,prof:[]},CL=[0],titleEdited=false;
function g(p,m,s){var z=(p-m)/s;return Math.exp(-z*z)}
(function(){for(var i=0;i<=400;i++){var p=i/400;RIDE.prof.push(850-31*g(p,.15,.07)+132*g(p,.52,.1)+64*g(p,.84,.055))}})();
function elev(p){var a=RIDE.prof,x=Math.max(0,Math.min(1,p))*(a.length-1),i=Math.floor(x),j=Math.min(a.length-1,i+1);return a[i]+(a[j]-a[i])*(x-i)}
/* 0..1 height for charts. Flat routes are not stretched to fill the chart. */
function eNorm(p){return (elev(p)-RIDE.low)/Math.max(60,RIDE.high-RIDE.low)}
function climbAt(p){return CL[Math.round(Math.max(0,Math.min(1,p))*(CL.length-1))]}
function profPath(w,h,pad){var d='M0 '+h;for(var i=0;i<=100;i++){var p=i/100;d+='L'+(p*w).toFixed(1)+' '+(h-pad-eNorm(p)*(h-pad*2)).toFixed(1)}return d+'L'+w+' '+h+'Z'}
function fmtH(m){m=Math.round(m);return (m>=60?Math.floor(m/60)+'h ':'')+(m%60)+'m'}
function fmtC(m){m=Math.round(m);return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')}
function difficulty(km,asc){var e=km+asc/40;return e<20?'Easy':e<50?'Moderate':e<95?'Hard':'Very hard'}

/* the loop shape used by the hero, share cards and flyover: points in a 200 x 160 box, start first */
function setShape(pts,smooth){var d;
  if(smooth)d=spline(pts,true);else{d='M'+pts[0][0].toFixed(1)+' '+pts[0][1].toFixed(1);for(var i=1;i<pts.length;i++)d+='L'+pts[i][0].toFixed(1)+' '+pts[i][1].toFixed(1);d+='Z'}
  $$('.js-blob').forEach(function(p){p.setAttribute('d',d)});
  $$('.js-blob-start').forEach(function(c){c.setAttribute('cx',pts[0][0]);c.setAttribute('cy',pts[0][1])})}
(function(){var pts=[],N=40;for(var i=0;i<N;i++){var t=i/N*Math.PI*2+2.2,r=1+.17*Math.sin(3*t+.4)+.1*Math.sin(5*t+1.9)+.05*Math.sin(2*t);pts.push([100+78*r*Math.cos(t)*1.02,80+56*r*Math.sin(t)])}setShape(pts,true)})();

/* push RIDE into every number, chart and label on the page */
function applyRide(){var a=RIDE.prof,lo=1e9,hi=-1e9,t=0,i;CL=[0];
  for(i=0;i<a.length;i++){lo=Math.min(lo,a[i]);hi=Math.max(hi,a[i]);if(i){if(a[i]>a[i-1])t+=a[i]-a[i-1];CL.push(t)}}
  RIDE.low=Math.round(lo);RIDE.high=Math.round(hi);for(i=0;i<CL.length;i++)CL[i]=t>0?CL[i]/t*RIDE.climb:0;
  $('#profHud').setAttribute('d',profPath(400,30,4));$('#profBig').setAttribute('d',profPath(400,150,18));$$('.js-prof').forEach(function(p){p.setAttribute('d',profPath(400,150,18))});
  var v={km:RIDE.km.toFixed(1),climb:Math.round(RIDE.climb).toLocaleString('en-IN'),movH:fmtH(RIDE.min),movC:fmtC(RIDE.min),avg:(RIDE.km/(RIDE.min/60)).toFixed(1),low:'low '+RIDE.low+' m',high:'high '+RIDE.high+' m',date:RIDE.date,place:RIDE.place};
  $$('[data-r]').forEach(function(el){if(v[el.dataset.r]!=null)el.textContent=v[el.dataset.r]});
  var tk=$('#tickerRow');if(tk){var items=[v.km+' km',v.climb+' m up',v.movH,v.avg+' km/h'],h='';for(i=0;i<12;i++)h+='<span>'+items[i%4]+'</span>';tk.innerHTML=h}
  if(!titleEdited){$$('.js-title').forEach(function(el){el.textContent=RIDE.name});$$('.js-title-in').forEach(function(el){el.value=RIDE.name})}
  if(L)build()}

/* ---- planner ----
   Before a place is chosen it sketches a loop. With a place it plans a real one the way the app
   does: Photon finds the place, BRouter routes a circle of waypoints on real roads. */
var PL={place:null,dir:'N',prof:'fastbike',spd:24,cache:{},ctl:null,timer:0,last:null,gl:null,glP:null,glOff:false};
var BEAR={N:0,E:90,S:180,W:270},ERR={off:'Could not reach the route server. Check your connection and try again.',busy:'The route server is busy or could not find a route. Try again in a moment.',none:'No route found from here in that direction. Try another direction or a different start.'};
function rad(d){return d*Math.PI/180}
function hav(a,b){var dla=rad(b[1]-a[1]),dlo=rad(b[0]-a[0]),s=Math.sin(dla/2)*Math.sin(dla/2)+Math.cos(rad(a[1]))*Math.cos(rad(b[1]))*Math.sin(dlo/2)*Math.sin(dlo/2);return 12742000*Math.asin(Math.sqrt(s))}
function dest(lat,lon,brg,dist){var br=rad(brg),la1=rad(lat),lo1=rad(lon),ad=dist/6371000,la2=Math.asin(Math.sin(la1)*Math.cos(ad)+Math.cos(la1)*Math.sin(ad)*Math.cos(br)),lo2=lo1+Math.atan2(Math.sin(br)*Math.sin(ad)*Math.cos(la1),Math.cos(ad)-Math.sin(la1)*Math.sin(la2));return {lat:la2*180/Math.PI,lon:lo2*180/Math.PI}}
/* waypoints on a circle through the start; roads wiggle, so the circle is smaller than the target */
function loopWaypoints(start,brg,target){var radius=target/1.3/(2*Math.PI),c=dest(start.lat,start.lon,brg,radius),back=brg+180;
  return [start].concat([90,180,270].map(function(a){return dest(c.lat,c.lon,back+a,radius)}),[start])}
function brouter(points,profile,signal){var ll=points.map(function(p){return p.lon.toFixed(6)+','+p.lat.toFixed(6)}).join('|');
  return fetch('https://brouter.de/brouter?lonlats='+encodeURIComponent(ll)+'&profile='+profile+'&alternativeidx=0&format=geojson',{signal:signal}).then(function(r){return r.text()}).then(function(body){var f;
    try{f=JSON.parse(body).features[0]}catch(e){throw new Error(body.trim().slice(0,160)||'no route found')}
    var pr=f.properties,pts=f.geometry.coordinates,dist=parseFloat(pr['track-length']),asc=parseFloat(pr['filtered ascend']),time=parseFloat(pr['total-time']);
    if(isNaN(dist)){dist=0;for(var i=1;i<pts.length;i++)dist+=hav(pts[i-1],pts[i])}
    return {pts:pts,dist:dist,asc:isNaN(asc)?0:asc,time:isNaN(time)?dist/5:time}})}
function photon(q,signal){var u='https://photon.komoot.io/api/?limit=6&q='+encodeURIComponent(q);if(PL.place)u+='&lat='+PL.place.lat.toFixed(2)+'&lon='+PL.place.lon.toFixed(2);
  return fetch(u,{signal:signal}).then(function(r){return r.json()}).then(function(j){var out=[];(j.features||[]).forEach(function(f){var p=f.properties||{},parts=[];
    ['name','street','city','state','country'].forEach(function(k){if(p[k]&&parts.indexOf(p[k])<0)parts.push(p[k])});if(!parts.length)return;
    var c=f.geometry.coordinates;out.push({label:parts.join(', '),short:p.name||parts[0],lat:c[1],lon:c[0]})});return out})}

/* turn a routed loop into the page's ride */
function useRoute(res,place){var c=res.pts,n=c.length,cum=[0],i;for(i=1;i<n;i++)cum.push(cum[i-1]+hav(c[i-1],c[i]));
  var total=cum[n-1]||1,prof=[],j=0,last=0;
  for(i=0;i<n;i++){if(c[i].length>2&&!isNaN(c[i][2])){last=c[i][2];break}}
  for(var k=0;k<=400;k++){var tgt=k/400*total;while(j<n-2&&cum[j+1]<tgt)j++;var seg=cum[j+1]-cum[j],f=seg>0?(tgt-cum[j])/seg:0,e0=c[j].length>2?c[j][2]:last,e1=c[j+1].length>2?c[j+1][2]:e0;last=e0+(e1-e0)*f;prof.push(last)}
  var la0=c[0][1],kx=Math.cos(rad(la0)),xs=[],ys=[],step=Math.max(1,Math.floor(n/260)),pts=[];
  for(i=0;i<n;i+=step){xs.push((c[i][0]-c[0][0])*kx);ys.push(-(c[i][1]-la0))}
  var x0=Math.min.apply(0,xs),x1=Math.max.apply(0,xs),y0b=Math.min.apply(0,ys),y1b=Math.max.apply(0,ys),sc=Math.min(170/Math.max(1e-9,x1-x0),130/Math.max(1e-9,y1b-y0b));
  for(i=0;i<xs.length;i++)pts.push([100+(xs[i]-(x0+x1)/2)*sc,80+(ys[i]-(y0b+y1b)/2)*sc]);
  RIDE={real:true,name:place.name||place.short+' loop',place:place.short,km:res.dist/1000,climb:res.asc,min:Math.max(1,res.time/60),date:new Date().toLocaleDateString('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric'}).replace(',',''),low:0,high:0,prof:prof};
  setShape(pts,false);applyRide();if(fx.ride)fx.ride()}

(function(){var km=$('#km'),box=$('#planBox'),stat=$('#planStatus'),retry=$('#planRetry'),go=$('#rideBtn'),note=$('#mapNote'),q=$('#placeQ'),list=$('#placeList'),DV={N:[0,-1],E:[1,0],S:[0,1],W:[-1,0]},CF={N:12.7,E:7.9,S:6.1,W:9.6};
  function say(t,err){stat.textContent=t;stat.classList.toggle('err',!!err);retry.hidden=!err}
  function numbers(k,climb,mins){$('#pDiff').textContent=difficulty(k,climb);if(fx.plan)fx.plan(climb,mins,k);else setPlan(climb,mins,k)}

  /* sketch: what the widget shows until a place is chosen */
  function sketch(){var k=+km.value,v=DV[PL.dir],Rd=26+68*Math.log(k/5)/Math.log(40),cx=200,cy=150,sx=cx-v[0]*Rd,sy=cy-v[1]*Rd,t0=Math.atan2(sy-cy,sx-cx),R=rng(k*7+PL.dir.charCodeAt(0)),a=R()*6,b=R()*6,pts=[];
    for(var i=0;i<36;i++){var t=t0+i/36*6.283,wgt=Math.pow(Math.sin((t-t0)/2),2),n=.2*Math.sin(3*t+a)+.13*Math.sin(5*t+b);pts.push([cx+Rd*(1+n*wgt)*Math.cos(t)*1.12,cy+Rd*(1+n*wgt)*Math.sin(t)])}
    $('#planLoop').setAttribute('d',spline(pts,true));$('#planStart').setAttribute('cx',sx);$('#planStart').setAttribute('cy',sy);
    var climb=Math.round(k*CF[PL.dir]);numbers(k,climb,Math.round(k/PL.spd*60+climb/9));if(fx.planDraw)fx.planDraw()}

  /* the real map, loaded only when it is first needed */
  function glMap(){if(PL.glP)return PL.glP;var cdn='https://cdnjs.cloudflare.com/ajax/libs/maplibre-gl/4.7.1/';
    PL.glP=new Promise(function(res,rej){var l=document.createElement('link');l.rel='stylesheet';l.href=cdn+'maplibre-gl.min.css';document.head.appendChild(l);
      var s=document.createElement('script');s.src=cdn+'maplibre-gl.min.js';s.onerror=function(){rej(new Error('map library blocked'))};
      s.onload=function(){try{var gl=$('#planGL');gl.hidden=false;var done=false,
          m=new maplibregl.Map({container:gl,style:'https://tiles.openfreemap.org/styles/positron',center:[PL.place.lon,PL.place.lat],zoom:11,cooperativeGestures:true,attributionControl:{compact:true}});
        m.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
        m.on('load',function(){if(done)return;done=true;
          m.addSource('route',{type:'geojson',data:{type:'FeatureCollection',features:[]}});
          m.addLayer({id:'route-case',type:'line',source:'route',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#FFFFFF','line-width':8}});
          m.addLayer({id:'route',type:'line',source:'route',layout:{'line-join':'round','line-cap':'round'},paint:{'line-color':'#2563EB','line-width':4.5}});
          var el=document.createElement('div');el.className='gl-start';PL.marker=new maplibregl.Marker({element:el}).setLngLat([PL.place.lon,PL.place.lat]).addTo(m);
          box.classList.add('gl');PL.gl=m;res(m)});
        m.on('error',function(e){if(done)return;done=true;rej(e&&e.error||new Error('map failed'))});
        setTimeout(function(){if(!done){done=true;rej(new Error('map timed out'))}},15000)}catch(e){rej(e)}};
      document.head.appendChild(s)}).catch(function(){PL.glOff=true;$('#planGL').hidden=true;box.classList.remove('gl');return null});
    return PL.glP}
  function drawRoute(res){var c=res.pts,w=1e9,e=-1e9,s=1e9,n=-1e9,i;for(i=0;i<c.length;i++){w=Math.min(w,c[i][0]);e=Math.max(e,c[i][0]);s=Math.min(s,c[i][1]);n=Math.max(n,c[i][1])}
    /* shape on the sketch map straight away, so there is something to see while tiles load */
    var kx=Math.cos(rad((s+n)/2)),sc=Math.min(330/Math.max(1e-9,(e-w)*kx),230/Math.max(1e-9,n-s)),step=Math.max(1,Math.floor(c.length/300)),d='',P=function(p){return [200+(p[0]-(w+e)/2)*kx*sc,150-(p[1]-(s+n)/2)*sc]};
    for(i=0;i<c.length;i+=step){var xy=P(c[i]);d+=(i?'L':'M')+xy[0].toFixed(1)+' '+xy[1].toFixed(1)}
    var st=P(c[0]);$('#planLoop').setAttribute('d',d+'Z');$('#planStart').setAttribute('cx',st[0]);$('#planStart').setAttribute('cy',st[1]);if(fx.planDraw)fx.planDraw();
    box.classList.add('real');if(!PL.glWanted){note.textContent='';return}
    note.textContent='Loading the map…';
    glMap().then(function(m){if(!m){note.textContent='Map tiles are not available here. This is the shape of your route.';return}
      if(PL.last!==res)return;note.textContent='';
      m.getSource('route').setData({type:'Feature',properties:{},geometry:{type:'LineString',coordinates:c.map(function(p){return [p[0],p[1]]})}});
      PL.marker.setLngLat([c[0][0],c[0][1]]);m.resize();m.fitBounds([[w,s],[e,n]],{padding:48,duration:reduce?0:1100})})}

  function show(res){PL.last=res;var k=res.dist/1000;numbers(k,res.asc,res.time/60);drawRoute(res);useRoute(res,PL.place);
    say('Planned on real roads from '+PL.place.short+'. The rest of this page now follows your loop.');go.hidden=false}
  function plan(){clearTimeout(PL.timer);if(!PL.place)return sketch();
    var target=+km.value*1000,key=[PL.place.lat.toFixed(5),PL.place.lon.toFixed(5),PL.dir,PL.prof,target].join('|');if(PL.ctl)PL.ctl.abort();
    if(PL.cache[key])return show(PL.cache[key]);
    var ctl=PL.ctl=new AbortController(),timed=false,to=setTimeout(function(){timed=true;ctl.abort()},90000);
    say('Routing '+km.value+' km on real roads…');box.classList.add('busy');go.hidden=true;
    brouter(loopWaypoints(PL.place,BEAR[PL.dir],target),PL.prof,ctl.signal).then(function(best){var ratio=best.dist/target;
      if(ratio<=1.15&&ratio>=.85)return best;
      /* too long or too short: resize the circle once and keep whichever is closer */
      return brouter(loopWaypoints(PL.place,BEAR[PL.dir],target/ratio),PL.prof,ctl.signal).then(function(alt){return Math.abs(alt.dist-target)<Math.abs(best.dist-target)?alt:best},function(e){if(e&&e.name==='AbortError')throw e;return best})
    }).then(function(res){clearTimeout(to);box.classList.remove('busy');PL.cache[key]=res;if(PL.ctl===ctl)show(res)}).catch(function(e){clearTimeout(to);if(PL.ctl!==ctl)return;box.classList.remove('busy');
      if(e&&e.name==='AbortError'&&!timed)return;var t=String(e&&e.message||'').toLowerCase(),none=['no track found','not mapped','no route found','datafile','island'].some(function(x){return t.indexOf(x)>=0});
      say(timed?ERR.busy:navigator.onLine===false||e instanceof TypeError?ERR.off:none?ERR.none:ERR.busy,true);go.hidden=!RIDE.real})}
  function soon(){PL.glWanted=true;clearTimeout(PL.timer);PL.timer=setTimeout(plan,450)}

  function weather(pl){fetch('https://api.open-meteo.com/v1/forecast?latitude='+pl.lat.toFixed(3)+'&longitude='+pl.lon.toFixed(3)+'&current=temperature_2m,wind_speed_10m,wind_direction_10m&hourly=precipitation_probability&forecast_hours=3&timezone=auto').then(function(r){return r.json()}).then(function(o){
      if(PL.place!==pl||!o.current)return;var c=o.current,pr=o.hourly&&o.hourly.precipitation_probability||[],rain=0;pr.forEach(function(x){rain=Math.max(rain,x||0)});
      var from=['N','NE','E','SE','S','SW','W','NW'][Math.floor((((c.wind_direction_10m%360)+360)%360+22.5)/45)%8],t=Math.round(c.temperature_2m),wd=Math.round(c.wind_speed_10m);
      $('#startWx').textContent=t+'°, wind '+wd+' km/h '+from+', rain '+rain+'%. Now, at '+pl.short+'.';
      $('.wx').innerHTML=t+'°<span>'+wd+' km/h '+from+'</span><span>Rain '+rain+'%</span>'}).catch(function(){})}
  function choose(pl){PL.glWanted=true;PL.place=pl;q.value=pl.label;close();$$('#presets [data-lat]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.label===pl.label)});plan();weather(pl)}

  /* search box with suggestions */
  var sctl=null,stimer=0,items=[],sel=-1;
  function close(){list.hidden=true;q.setAttribute('aria-expanded','false');sel=-1}
  function render(msg){list.innerHTML='';if(msg){var li=document.createElement('li');li.className='none';li.textContent=msg;list.appendChild(li)}
    items.forEach(function(it,i){var li=document.createElement('li');li.setAttribute('role','option');li.id='pl'+i;li.textContent=it.label;li.addEventListener('mousedown',function(e){e.preventDefault();choose(it)});list.appendChild(li)});
    list.hidden=false;q.setAttribute('aria-expanded','true')}
  function mark(){$$('li[role=option]',list).forEach(function(li,i){li.setAttribute('aria-selected',i===sel)});if(sel>=0)q.setAttribute('aria-activedescendant','pl'+sel);else q.removeAttribute('aria-activedescendant')}
  function search(now){clearTimeout(stimer);var text=q.value.trim();if(text.length<3){items=[];close();return}
    stimer=setTimeout(function(){if(sctl)sctl.abort();var c=sctl=new AbortController();items=[];render('Searching…');
      photon(text,c.signal).then(function(r){if(sctl!==c)return;items=r;sel=-1;render(r.length?'':'No places found. Try a town or landmark name.');if(now&&r.length)choose(r[0])}).catch(function(e){if(e&&e.name==='AbortError')return;items=[];render('Search is not available right now.')})},now?0:350)}
  q.addEventListener('input',function(){search(false)});
  q.addEventListener('keydown',function(e){if(e.key==='ArrowDown'||e.key==='ArrowUp'){if(!items.length)return;e.preventDefault();sel=(sel+(e.key==='ArrowDown'?1:-1)+items.length)%items.length;mark()}
    else if(e.key==='Escape')close()});
  q.addEventListener('blur',function(){setTimeout(close,150)});
  $('#planForm').addEventListener('submit',function(e){e.preventDefault();if(items.length&&!list.hidden)choose(items[Math.max(0,sel)]);else search(true)});
  $$('#presets [data-lat]').forEach(function(b){b.addEventListener('click',function(){choose({label:b.dataset.label,short:b.dataset.short,name:b.dataset.name,lat:+b.dataset.lat,lon:+b.dataset.lon})})});
  $('#geoBtn').addEventListener('click',function(){var b=this;if(!navigator.geolocation){say('Location is not available in this browser.',false);return}
    b.textContent='Finding you…';navigator.geolocation.getCurrentPosition(function(pos){b.textContent='Use my location';choose({label:'My location',short:'your location',name:'Morning loop',lat:pos.coords.latitude,lon:pos.coords.longitude})},
      function(){b.textContent='Use my location';say('Could not get your location. Search for a place instead.',false)},{timeout:12000,maximumAge:600000})});
  retry.addEventListener('click',plan);

  km.addEventListener('input',function(){$('#kmOut').textContent=km.value;if(!PL.place)sketch()});
  km.addEventListener('change',function(){if(PL.place)soon()});
  radio('#dirs',function(b){PL.dir=b.dataset.d;PL.place?soon():sketch()});
  radio('#bikes',function(b){PL.prof=b.dataset.p;PL.spd=+b.dataset.b;PL.place?soon():sketch()});

  /* open on the stored default loop: a real ride, with no request until the planner is on screen */
  var D=window.CYCLER_DEFAULT;
  if(D&&D.route&&D.route.pts&&D.route.pts.length>1){PL.place=D.place;PL.dir=D.dir;PL.prof=D.prof;km.value=D.km;$('#kmOut').textContent=D.km;q.value=D.place.label;
    $$('#dirs [role=radio]').forEach(function(b){b.setAttribute('aria-checked',b.dataset.d===D.dir)});
    $$('#bikes [role=radio]').forEach(function(b){b.setAttribute('aria-checked',b.dataset.p===D.prof);if(b.dataset.p===D.prof)PL.spd=+b.dataset.b});
    $$('#presets [data-lat]').forEach(function(b){b.setAttribute('aria-pressed',b.dataset.label===D.place.label)});
    PL.cache[[D.place.lat.toFixed(5),D.place.lon.toFixed(5),D.dir,D.prof,D.km*1000].join('|')]=D.route;show(D.route);say('A loop from '+D.place.short+' to start with. Search anywhere to plan your own.');
    var wake=function(){if(PL.glWanted)return;PL.glWanted=true;if(PL.last)drawRoute(PL.last);weather(PL.place)};
    if('IntersectionObserver' in window){var io=new IntersectionObserver(function(en){if(en[0].isIntersecting){io.disconnect();wake()}},{rootMargin:'400px'});io.observe(box)}else wake()}
  else sketch()})();
function setPlan(climb,mins,k){$('#pClimb').textContent=Math.round(climb).toLocaleString('en-IN')+' m';$('#pTime').textContent=fmtH(mins);if(k!=null)$('#pDist').textContent=(k>=100?Math.round(k):+(+k).toFixed(1))+' km'}
function radio(sel,fn){var bs=$$(sel+' [role=radio]');bs.forEach(function(b){b.addEventListener('click',function(){bs.forEach(function(x){x.setAttribute('aria-checked',x===b)});fn&&fn(b)})})}
radio('#feel');$$('#tags .chip').forEach(function(b){b.addEventListener('click',function(){b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true')})});

/* ---- title flows from the save page to the share cards ---- */
$$('.js-title-in').forEach(function(inp){inp.addEventListener('input',function(){titleEdited=true;var v=inp.value.trim()||'Morning ride';$$('.js-title').forEach(function(t){t.textContent=v});$$('.js-title-in').forEach(function(o){if(o!==inp)o.value=inp.value})})});
$('#saveForm').addEventListener('submit',function(e){e.preventDefault();if(fx.save)fx.save(e.submitter||$('#saveForm .btn'));/* after the burst, offer a share card. The popup says the ride is saved; the line of text is only for a browser with no <dialog> */
  if($('#cardBox').showModal)setTimeout(function(){if(fx.card)fx.card('Ride saved')},fx.save?750:0);else $('#savedNote').textContent='Saved. In the app, this ride now lives in your phone\'s storage and nowhere else.'});

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
  chs.forEach(function(ch,i){var s=$('.stone',ch),k=lenAt(off(s)[1]+s.offsetHeight/2)/L*RIDE.km;$('.stone b',ch).textContent=i===0?'0':i===chs.length-1?String(+RIDE.km.toFixed(1)):String(k<10&&RIDE.km<100?+k.toFixed(1):Math.round(k))});
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
  if((!vis&&force!==true)||!L)return;
  var l=lenAt(vh*.5-rr.top);p=L?l/L:0;
  pRec.style.strokeDashoffset=L-l;var pt=pPlan.getPointAtLength(l);rider.setAttribute('cx',pt.x);rider.setAttribute('cy',pt.y);pulse.setAttribute('cx',pt.x);pulse.setAttribute('cy',pt.y);
  var active=now-lastMove<700&&p>0&&p<1;if(now-lastMove>140)target=0;speed+=(target-speed)*Math.min(1,dt*7);if(!active&&speed<.3)speed=0;
  if(active){moving+=dt;if(!elapsedStart)elapsedStart=now}
  var st=p<=0?'Ready. Scroll to ride':p>=1?'Finished':active?'Recording':'Auto-paused';
  if(st!==state){state=st;set(els.status,st);$('#hudDot').style.background=st==='Recording'?'':'#9B9A97';$('#pauseCard').dataset.state=st==='Auto-paused'?'paused':'recording';if(fx.state)fx.state(st)}
  set(els.dist,(p*RIDE.km).toFixed(2));set(els.speed,(p>=1?0:speed).toFixed(1));set(els.moving,mmss(moving));set(els.climb,Math.round(climbAt(p))+' m');set(els.elev,Math.round(elev(p))+' m');
  set(els.elapsed,elapsedStart?mmss((now-elapsedStart)/1000):'00:00');
  for(var i=0;i<els.stops.length;i++)els.stops[i].setAttribute('offset',p);
  var e=eNorm(p);$('#hudMe').style.left=(p*100)+'%';$('#hudMe').style.bottom=(4+e*22)+'px';
  $('#profDot').setAttribute('cx',p*400);$('#profDot').setAttribute('cy',150-18-e*114)}
/* ---- top bar: gathers into a pill, follows the section, goes dark over night, records progress ---- */
var topBar=$('.top'),navA=$$('.links a',topBar),navInd=$('.ind',topBar),navProg=$('.prog i',topBar),navSec=navA.map(function(a){return document.getElementById(a.getAttribute('href').slice(1))}),darkEls=$$('.plan,.dawn,.ch.dark'),heroEl=$('.hero'),dawnEl=$('#dawn'),navAct=-1,navHov=-1,navAt=-2,navP=-1;
function navMark(){var i=navHov>=0?navHov:navAct;if(i===navAt)return;navAt=i;if(i<0){navInd.style.opacity=0;return}var a=navA[i];navInd.style.opacity=1;navInd.style.width=a.offsetWidth+'px';navInd.style.transform='translateX('+a.offsetLeft+'px)'}
function navTick(){var y=scrollY,line=42,i,r,dark=false,act=-1,pr;
  topBar.classList.toggle('stuck',y>24);
  r=heroEl.getBoundingClientRect();
  if(r.top<=line&&r.bottom>line)dark=fx.heroDark?fx.heroDark():false;
  else for(i=0;i<darkEls.length;i++){r=darkEls[i].getBoundingClientRect();if(r.top<=line&&r.bottom>line){dark=!(darkEls[i]===dawnEl&&fx.dawnLight);break}}
  topBar.classList.toggle('dark',dark);
  for(i=0;i<navSec.length;i++)if(navSec[i]&&navSec[i].getBoundingClientRect().top<=innerHeight*.45)act=i;
  if(act!==navAct){navAct=act;navA.forEach(function(a,j){if(j===act)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current')});navMark()}
  pr=Math.max(0,Math.min(1,y/Math.max(1,document.documentElement.scrollHeight-innerHeight)));if(Math.abs(pr-navP)>.0005){navP=pr;navProg.style.transform='scaleX('+pr.toFixed(4)+')'}}
navA.forEach(function(a,i){a.addEventListener('pointerenter',function(){navHov=i;navMark()});a.addEventListener('focus',function(){navHov=i;navMark()});a.addEventListener('blur',function(){navHov=-1;navMark()})});
$('.links',topBar).addEventListener('pointerleave',function(){navHov=-1;navMark()});
addEventListener('resize',function(){navAt=-2;navMark()});
(function(){var btn=$('.menu',topBar);function open(v){topBar.classList.toggle('open',v);btn.setAttribute('aria-expanded',v)}
  btn.addEventListener('click',function(){open(!topBar.classList.contains('open'))});
  topBar.addEventListener('click',function(e){if(e.target.closest('a'))open(false)});
  document.addEventListener('click',function(e){if(!topBar.contains(e.target))open(false)});
  addEventListener('keydown',function(e){if(e.key==='Escape'&&topBar.classList.contains('open')){open(false);btn.focus()}})})();

(function loop(){frame();navTick();requestAnimationFrame(loop)})();

/* ---- scroll speed cap ----
   The page is a story told by scrolling, so a hard flick of the wheel or trackpad cannot skip
   it: wheel input moves a target, and the page follows it at no more than about one and a half
   screens a second. The story ends at the yellow ticker. From there the cap eases off over one
   screen and then scrolling is the browser's own again, because what follows is reference to
   skim. Keyboard, the scrollbar and in-page links are never capped. Touch is handled in the
   GSAP layer. Off under reduced motion. */
(function(){if(reduce)return;var tgt=null,pos=0,raf=0,last=0,tk=document.querySelector('.ticker');
  /* 0 inside the story, rising to 1 as the ticker crosses the screen and leaves the top */
  function free(y){if(!tk)return 0;var b=tk.getBoundingClientRect().bottom+scrollY;return Math.max(0,Math.min(1,(y-(b-innerHeight))/innerHeight))}
  fx.free=function(){return free(scrollY)};
  function vmax(y){var f=free(y);return Math.max(900,innerHeight*1.5)*(1+f*f*5)}
  function stop(){tgt=null;if(raf)cancelAnimationFrame(raf);raf=0}
  function nested(el,dy){for(;el&&el.nodeType===1&&el!==document.body&&el!==document.documentElement;el=el.parentNode){var o=getComputedStyle(el).overflowY;if((o==='auto'||o==='scroll')&&el.scrollHeight>el.clientHeight+1&&(dy<0?el.scrollTop>0:el.scrollTop+el.clientHeight<el.scrollHeight-1))return true}return false}
  function step(now){var dt=Math.min(.05,(now-last)/1000)||.016;last=now;if(tgt===null){raf=0;return}
    var d=tgt-pos,mv=d*(1-Math.exp(-dt*11)),cap=vmax(pos)*dt;if(Math.abs(mv)>cap)mv=d<0?-cap:cap;
    if(Math.abs(d)<.5){pos=tgt;tgt=null;raf=0}else{pos+=mv;raf=requestAnimationFrame(step)}
    scrollTo({top:pos,behavior:'instant'})}
  addEventListener('wheel',function(e){if(e.ctrlKey||e.metaKey||e.defaultPrevented)return;if(document.querySelector('dialog[open]'))return;var dy=e.deltaY;if(!dy||Math.abs(e.deltaX)>Math.abs(dy)||nested(e.target,dy))return;
    if(tgt===null&&free(scrollY)>=1)return; // past the story: leave the wheel to the browser
    if(e.deltaMode===1)dy*=18;else if(e.deltaMode===2)dy*=innerHeight;e.preventDefault();
    if(tgt===null){pos=scrollY;tgt=pos}
    var lead=vmax(pos)*.4,top=document.documentElement.scrollHeight-innerHeight;
    tgt=Math.max(0,Math.min(top,Math.max(pos-lead,Math.min(pos+lead,tgt+dy))));
    if(!raf){last=performance.now();raf=requestAnimationFrame(step)}},{passive:false});
  addEventListener('keydown',function(e){if(/^(Arrow|Page|Home|End| $)/.test(e.key))stop()});
  addEventListener('pointerdown',stop);addEventListener('touchstart',stop,{passive:true});document.addEventListener('click',stop,true)})();

/* ---- pick one of several: share card styles, gallery tabs ---- */
function picker(btns,panels,attr){function show(i,focus){btns.forEach(function(b,j){b.setAttribute(attr,j===i);b.tabIndex=j===i?0:-1});panels.forEach(function(p,j){p.classList.toggle('on',j===i)});if(focus)btns[i].focus()}
  btns.forEach(function(b,i){b.addEventListener('click',function(){show(i)});
    b.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(d){e.preventDefault();show((i+d+btns.length)%btns.length,true)}})})}
var cards=document.getElementById('cards');

/* ---- share cards: one style at a time, and a popup to take one away as an image ----
   The popup is opened by Save ride and by "Download this card". The image is drawn on a canvas
   here in the page, to the same layout as the cards above, so nothing is uploaded. */
(function(){
  var A=function(sel,r){return Array.prototype.slice.call((r||document).querySelectorAll(sel))},
      scs=A('.sc',cards),groups=[A('#cardStyles button'),A('#cbStyles button')],box=document.getElementById('cardBox'),cv=document.getElementById('cardCv'),note=document.getElementById('cbNote'),note0=note.textContent,style=0,INK='#1C1C1A';
  function title(){return (document.querySelector('.js-title').textContent||'').trim()||'Morning ride'}
  function rr(c,x,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  /* st: 0 dark, 1 panel, 2 blue, 3 elevation, 4 clear. All sizes are the stylesheet's, times k */
  function drawCard(cv,st,W){
    var H=Math.round(W*16/9),k=W/310,c=cv.getContext('2d'),fg=st===1||st===3?INK:'#fff',i,g,
        F=function(wt,px){c.font=wt+' '+(px*k).toFixed(2)+'px "Hanken Grotesk",system-ui,sans-serif'};
    cv.width=W;cv.height=H;c.clearRect(0,0,W,H);
    if(st===0){g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#27364F');g.addColorStop(.62,'#0B0C10');g.addColorStop(1,'#0B0C10');c.fillStyle=g;c.fillRect(0,0,W,H)}
    else if(st===1){var q=32*k,ix,iy;c.fillStyle='#ECEEE8';c.fillRect(0,0,W,H);c.fillStyle='#DADFD3';for(iy=0;iy*q<H;iy++)for(ix=0;ix*q<W;ix++)if((ix+iy)%2)c.fillRect(ix*q,iy*q,q+1,q+1)}
    else if(st===2){c.fillStyle='#2563EB';c.fillRect(0,0,W,H)}
    else if(st===3){c.fillStyle='#fff';c.fillRect(0,0,W,H)}
    /* the loop, from the same path the page draws */
    var tr=document.getElementById('heroTrack'),len=tr.getTotalLength(),n=220,lw=st===3?W*.22:W*.76,lx=st===3?W*.70:W*.12,ly=st===3?H*.05:H*.09,u=lw/200,p0;
    c.save();if(st===4){c.shadowColor='rgba(0,0,0,.4)';c.shadowBlur=5*k;c.shadowOffsetY=2*k}
    c.strokeStyle=c.fillStyle=st===1||st===3?'#E5484D':'#fff';c.lineWidth=3.2*u;c.lineJoin=c.lineCap='round';c.beginPath();
    for(i=0;i<=n;i++){var q2=tr.getPointAtLength(len*(i%n)/n);if(!i){p0=q2;c.moveTo(lx+q2.x*u,ly+q2.y*u)}else c.lineTo(lx+q2.x*u,ly+q2.y*u)}
    c.stroke();c.beginPath();c.arc(lx+p0.x*u,ly+p0.y*u,4.2*u,0,6.2832);c.fill();c.restore();
    /* the text block, laid out upwards from the bottom edge */
    var pad=(st===1?26:22)*k,gap=(st===1?12:14)*k,x=pad,cw=W-pad*2,col=(cw-14*k)/2,bottom=H-pad,cell=53*k,
        stats=[['Distance',RIDE.km.toFixed(1),'km'],['Moving time',fmtC(RIDE.min),'h'],['Climb',Math.round(RIDE.climb).toLocaleString('en-IN'),'m'],['Avg speed',(RIDE.km/(RIDE.min/60)).toFixed(1),'km/h']],
        words=title().split(/\s+/),lines=[''],lh=25.5*k;
    F(600,22.1);words.forEach(function(w){var t=lines[lines.length-1],tt=t?t+' '+w:w;if(t&&c.measureText(tt).width>cw)lines.push(w);else lines[lines.length-1]=tt});lines=lines.slice(0,3);
    var total=lines.length*lh+(gap-8*k)+20*k+gap+cell*2+14*k+gap+19*k,top=bottom-total,y=top;
    if(st===1){c.fillStyle='#fff';rr(c,10*k,top-16*k,W-20*k,total+32*k,18*k);c.fill()}
    if(st===3){var pt=H*.14,ph=Math.min(H*.42,top-14*k-pt),pp=ph*.12;c.beginPath();c.moveTo(0,pt+ph);for(i=0;i<=100;i++)c.lineTo(i/100*W,pt+ph-pp-eNorm(i/100)*(ph-pp*2));c.lineTo(W,pt+ph);c.closePath();c.globalAlpha=.85;c.fillStyle='#2563EB';c.fill();c.globalAlpha=1} // the profile stops short of the title, however many lines it takes
    c.save();if(st===4){c.shadowColor='rgba(0,0,0,.45)';c.shadowBlur=6*k;c.shadowOffsetY=1*k}
    c.fillStyle=fg;c.textBaseline='alphabetic';c.textAlign='left';
    F(600,22.1);lines.forEach(function(t){c.fillText(t,x,y+lh*.8);y+=lh});
    y+=gap-8*k;F(400,13);c.globalAlpha=.75;c.fillText(RIDE.date,x,y+14.5*k);c.globalAlpha=1;y+=20*k+gap;
    stats.forEach(function(sv,j){var sx=x+(j%2)*(col+14*k),sy=y+Math.floor(j/2)*(cell+14*k);
      F(600,10.5);c.globalAlpha=.75;if('letterSpacing' in c)c.letterSpacing=(.5*k).toFixed(2)+'px';c.fillText(sv[0].toUpperCase(),sx,sy+11.5*k);if('letterSpacing' in c)c.letterSpacing='0px';c.globalAlpha=1;
      F(600,27.2);c.fillText(sv[1],sx,sy+45*k);var vw=c.measureText(sv[1]).width;F(500,12.75);c.fillText(sv[2],sx+vw+3*k,sy+45*k)});
    y+=cell*2+14*k+gap;F(600,12);c.fillText('Cycler',x,y+14*k);c.restore()}
  function setStyle(i,focus){style=i;scs.forEach(function(el,j){el.classList.toggle('on',j===i)});
    groups.forEach(function(bs){bs.forEach(function(b,j){b.setAttribute('aria-checked',j===i);b.tabIndex=j===i?0:-1})});
    if(focus)focus[i].focus();if(box.open)drawCard(cv,style,540)}
  groups.forEach(function(bs){bs.forEach(function(b,i){b.addEventListener('click',function(){setStyle(i)});
    b.addEventListener('keydown',function(e){var d=e.key==='ArrowRight'||e.key==='ArrowDown'?1:e.key==='ArrowLeft'||e.key==='ArrowUp'?-1:0;if(d){e.preventDefault();setStyle((i+d+bs.length)%bs.length,bs)}})})});
  function blob(done){var big=document.createElement('canvas');drawCard(big,style,1080);big.toBlob(function(b){done(b,'cycler-'+(title().toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'ride')+'.png')},'image/png')}
  function open(label){if(!box.showModal)return;document.getElementById('cbWhen').textContent=label;note.textContent=note0;box.showModal();
    var go=function(){drawCard(cv,style,540)};go();if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go)}
  fx.card=open;
  document.getElementById('cardGet').addEventListener('click',function(){open('Share card')});
  box.addEventListener('click',function(e){if(e.target===box)box.close()}); // a click on the backdrop closes it
  document.getElementById('cbDown').addEventListener('click',function(){blob(function(b,name){var a=document.createElement('a'),u=URL.createObjectURL(b);a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(u)},4000);note.textContent='Saved '+name+' to your downloads.'})});
  /* Share appears only where the browser can hand an image to other apps */
  var sh=document.getElementById('cbShare');
  try{if(navigator.canShare&&navigator.canShare({files:[new File([''],'x.png',{type:'image/png'})]}))sh.hidden=false}catch(e){}
  sh.addEventListener('click',function(){blob(function(b,name){navigator.share({files:[new File([b],name,{type:'image/png'})],title:title()}).catch(function(){})})});
})();
picker(Array.prototype.slice.call(document.querySelectorAll('#galTabs button')),Array.prototype.slice.call(document.querySelectorAll('#galStage figure')),'aria-selected');

/* ---- flyover: slow, fast, slow ---- */
(function(){var tr=$('#flyTrack'),dot=$('#flyDot'),plane=$('#flyPlane'),btn=$('#flyBtn'),playing=false;
  function at(t){var q=tr.getPointAtLength(tr.getTotalLength()*Math.min(.9999,t));dot.setAttribute('cx',q.x);dot.setAttribute('cy',q.y);tr.setAttribute('stroke-dashoffset',1-t)}
  at(1);btn.addEventListener('click',function(){if(playing)return;playing=true;btn.textContent='Flying…';var t0=performance.now(),dur=reduce?10:6500;
    (function tick(now){var u=Math.min(1,(now-t0)/dur),e=u<.5?4*u*u*u:1-Math.pow(-2*u+2,3)/2;at(e);plane.style.transform='rotateX(58deg) rotateZ('+(-18+36*e)+'deg) scale('+(1+.18*Math.sin(Math.PI*e))+')';
      if(u<1)requestAnimationFrame(tick);else{playing=false;btn.innerHTML='▶&nbsp; Play again'}})(t0)})})();

/* ---- activity chart ---- */
(function(){var D=[[12.4,0,18.6,0,0,32.4,0],[38,0,55,0,0,94,0],[96,0,141,0,0,412,0]],U=['km','','m'],bars=$$('#bars div');
  function show(m){var mx=Math.max.apply(0,D[m]),tot=D[m].reduce(function(a,b){return a+b},0);bars.forEach(function(b,i){b.style.height=(D[m][i]/mx*100)+'%'});
    $('#actTotal').innerHTML=m===1?Math.floor(tot/60)+'h '+(tot%60)+'m':(m===0?tot.toFixed(1):tot)+'<small>'+U[m]+'</small>'}
  radio('#metric',function(b){show(+b.dataset.m)});show(0)})();
$('#lubeBtn').addEventListener('click',function(){$('#lubeTxt').textContent='0 of 250 km since today';$('#lubeBar').className='bar';$('#lubeBar').firstElementChild.style.width='1%';this.textContent='Done today';this.disabled=true});

/* ---- in-page links scroll smoothly; CSS smooth scrolling stays off for ScrollTrigger ---- */
$$('a[href^="#"]').forEach(function(a){a.addEventListener('click',function(e){var t=document.getElementById(a.getAttribute('href').slice(1));if(!t)return;e.preventDefault();t.scrollIntoView({behavior:reduce?'auto':'smooth',block:'start'});if(a.classList.contains('skip')){t.setAttribute('tabindex','-1');t.focus({preventScroll:true})}})});

/* ---- boot ---- */
function layout(){maps();build()}
applyRide();
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
function count(el,to,dec,trig,suffix){var c={v:0};gsap.to(c,{v:to,duration:1.5,ease:'power2.out',scrollTrigger:{trigger:trig||el,start:'top 82%',once:true},onUpdate:function(){el.innerHTML=c.v.toFixed(dec)+(suffix||'')}})}

/* ---- 1. hero ----
   Each element has one owner per property, so the load sequence, the pointer and the scroll
   never fight: load animates letters, the phone and the inner chips; scroll animates the
   words, .hero-sub, the rig and the chip wrappers; the pointer tilts .rig-ptr. */
var introDone=false,hero=$('.hero'),stage=$('.hero-stage'),rig=$('.phone-rig'),ptr=$('.rig-ptr'),night=$('.hero-night'),h1=$('.hero h1'),heroP=0;
function offTo(el,stop){var x=0,y=0;while(el&&el!==stop){x+=el.offsetLeft;y+=el.offsetTop;el=el.offsetParent}return [x,y]}
function mk(c){var e=document.createElement('span');e.className=c;return e}
/* headline into words > masks > letters. The underline moves into its word's wrapper */
var HS=(function(){var u=$('.hl-u',h1),hl=$('.hl',h1),hlWord=hl?hl.textContent.trim():'',label=h1.textContent.replace(/\s+/g,' ').trim(),chars=[],inners=[],outs=[];
  h1.setAttribute('aria-label',label);h1.textContent='';
  label.split(' ').forEach(function(w,i,a){var o=mk('hw'),m=mk('w'),n=mk('wi');o.setAttribute('aria-hidden','true');
    w.split('').forEach(function(ch){var c=mk('c');c.textContent=ch;n.appendChild(c);chars.push(c)});
    m.appendChild(n);o.appendChild(m);if(u&&w===hlWord){o.classList.add('hl');o.appendChild(u)}
    h1.appendChild(o);if(i<a.length-1)h1.appendChild(document.createTextNode(' '));inners.push(n);outs.push(o)});
  return {chars:chars,inners:inners,outs:outs}})();
gsap.set(rig,{rotationY:-18,rotationX:7,rotation:3});

/* Load sequence. Everything in it is a transform or an opacity, so the browser never lays the
   page out mid-flight, and it starts only after the fonts are in and ScrollTrigger has measured.
   The loader is fixed to the screen. Its dot ends by flying to a target and reads where that
   target is on every frame, closing k of the distance, so at k = 1 it is locked on even though
   the target is still moving into place. */
var LD={el:$('.loader'),iris:$('.ld-iris'),dot:$('.ld-dot'),loop:$('.ld-loop'),label:$('.ld-label'),k:0,target:null,at:function(){var r=LD.target.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2]}};
function ldFollow(){var t=LD.at(),x=(t[0]-innerWidth/2)*LD.k,y=(t[1]-innerHeight/2)*LD.k;LD.sx[0](x);LD.sx[1](x);LD.sy[0](y);LD.sy[1](y)}
function ldStart(){LD.sx=[gsap.quickSetter(LD.dot,'x','px'),gsap.quickSetter(LD.iris,'x','px')];LD.sy=[gsap.quickSetter(LD.dot,'y','px'),gsap.quickSetter(LD.iris,'y','px')];
  gsap.set(LD.el,{display:'block'});gsap.ticker.add(ldFollow);root.classList.remove('pre')}
function ldEnd(){gsap.ticker.remove(ldFollow);LD.el.style.display='none';introDone=true}
/* what never stops: the comet on the phone's route, the float, the wandering speed */
function idle(delay){
  gsap.to('#heroComet',{strokeDashoffset:-1,duration:6,ease:'none',repeat:-1});
  gsap.to(ptr,{y:-12,duration:3.2,ease:'sine.inOut',yoyo:true,repeat:-1,delay:delay});
  Array.prototype.forEach.call(document.querySelectorAll('.fl-in'),function(f,i){gsap.to(f,{y:i%2?9:-9,duration:2.3+i*.5,ease:'sine.inOut',yoyo:true,repeat:-1,delay:delay+.8+i*.4})});
  var spd=document.querySelectorAll('.js-hspd'),k=0;setInterval(function(){if(document.hidden||heroP>=1)return;k++;var v=RIDE.km/(RIDE.min/60)+Math.sin(k*1.7)*1.4+Math.sin(k*.6)*.8;set(spd,v.toFixed(1))},1100)}
/* At the top of the page. Beats: the dark draws back into the recording dot, the headline rises,
   the phone swings in, the supporting copy follows, the dot lands on the ride's start point and
   the ride records itself out of it. */
function intro(){
  var track=$('#heroTrack'),dot=$('.ph-route .js-blob-start'),len=track.getTotalLength(),km=$('#hpKm'),kmTxt='';
  LD.target=dot;ldStart();
  gsap.timeline({defaults:{ease:'power4.out'}})
    .fromTo(LD.iris,{scale:15},{scale:0,duration:1.25,ease:'power3.inOut'},0)
    .to(LD,{k:1,duration:1.25,ease:'power3.inOut'},0)
    .to(LD.dot,{scale:0,duration:.4,ease:'power2.in',onComplete:ldEnd},1.4)
    .from('#heroMap',{scale:1.22,duration:2.4,ease:'power3.out'},0)
    .from(HS.chars,{yPercent:112,duration:1,stagger:.014},.45)
    .from('.hl-u path',{strokeDashoffset:1,duration:.9,ease:'power3.inOut'},1.25)
    .from('.hero-sub>*',{y:26,autoAlpha:0,duration:1,stagger:.1},.85)
    .from('.navbar',{y:-28,autoAlpha:0,duration:1,clearProps:'transform'},.95)
    .from('.phone',{yPercent:34,rotationY:-38,rotationX:16,rotation:-5,autoAlpha:0,duration:1.7,ease:'expo.out'},.55)
    .from('.sheet',{yPercent:105,duration:1.1,ease:'expo.out'},1.15)
    .from('.wx',{y:-10,autoAlpha:0,duration:.7},1.5)
    .fromTo(track,{strokeDashoffset:1},{strokeDashoffset:0,duration:2.4,ease:'power2.inOut',onUpdate:function(){var t=1-gsap.getProperty(track,'strokeDashoffset'),q=track.getPointAtLength(len*Math.min(.9999,t)),v=(RIDE.km*t).toFixed(1);dot.setAttribute('cx',q.x);dot.setAttribute('cy',q.y);if(v!==kmTxt){kmTxt=v;km.textContent=v}}},1.8)
    .from('.fl-in',{scale:.6,autoAlpha:0,duration:.8,stagger:.12,ease:'back.out(1.8)'},1.9)
    .from('.hero-cue',{autoAlpha:0,duration:1,ease:'power2.out'},2.3)
    .to('#heroComet',{opacity:.9,duration:.6},4.2);
  idle(2)}
/* Anywhere else on the page (a reload part-way down, or a link to a section). The dot draws the
   whole loop and comes back to where it started, a line under it says where you are picking up,
   then you fall through the loop as the dark draws back, and the dot flies to your place: the
   rider on the route line if you are on the ride, otherwise the tip of the top bar's progress
   line. The top bar and the ride bar arrive as it lands. */
function introAway(){
  var path=$('path',LD.loop),tr=$('#heroTrack'),s0=tr.getPointAtLength(0),u=LD.loop.getBoundingClientRect().width/200||1.5,onRide=p>0&&p<1&&hud.classList.contains('on'),
      names={plan:'the night before',dawn:'the night',ride:'the ride',share:'the share cards',lookback:'the weeks after',features:'the feature list',privacy:'privacy',install:'install',faq:'the questions'},where='',mid=innerHeight/2;
  $$('main>section[id],main .pin-spacer>section[id]').forEach(function(sc){if(sc.getBoundingClientRect().top<=mid&&names[sc.id])where=names[sc.id]});
  LD.label.textContent=onRide?'Resuming at '+(p*RIDE.km).toFixed(1)+' km':where?'Picking up at '+where:'Picking up where you left off';
  LD.target=onRide?rider:$('.prog i');if(!onRide)LD.at=function(){var r=LD.target.getBoundingClientRect();return [r.right,r.top+r.height/2]};
  /* the loop is placed so that its start point is under the dot, and it grows from there */
  gsap.set(LD.loop,{left:innerWidth/2-s0.x*u,top:innerHeight/2-s0.y*u,transformOrigin:(s0.x*u).toFixed(1)+'px '+(s0.y*u).toFixed(1)+'px',visibility:'visible'});
  gsap.set('#heroComet',{opacity:.9});ldStart();
  gsap.timeline({defaults:{ease:'power3.out'}})
    .fromTo(path,{strokeDashoffset:1},{strokeDashoffset:0,duration:.85,ease:'power2.inOut'},0)
    .fromTo(LD.label,{y:12,autoAlpha:0},{y:0,autoAlpha:1,duration:.5},.2)
    .to(LD.label,{y:-12,autoAlpha:0,duration:.3,ease:'power2.in'},.95)
    .to(LD.loop,{scale:14,rotation:28,duration:1.05,ease:'power3.in'},.9)
    .to(LD.loop,{autoAlpha:0,duration:.35,ease:'power1.in'},1.6)
    .fromTo(LD.iris,{scale:15},{scale:0,duration:1.05,ease:'power3.inOut'},1)
    .to(LD,{k:1,duration:1.05,ease:'power3.inOut'},1)
    .from('.navbar',{y:-28,autoAlpha:0,duration:.9,clearProps:'transform'},1.35)
    .fromTo(hud,{opacity:0},{opacity:1,duration:.7,clearProps:'opacity'},1.5) // opacity only: its position is a stylesheet transform
    .to(LD.dot,{scale:0,duration:.4,ease:'power2.in',onComplete:ldEnd},2.15);
  idle(0)}
/* measure first, then give the browser two quiet frames before the first beat */
var started=false;function go(){if(started)return;started=true;ScrollTrigger.refresh();requestAnimationFrame(function(){requestAnimationFrame(function(){
  var away=heroP>.03||hero.getBoundingClientRect().bottom<innerHeight*.5;(away?introAway:intro)()})})}
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(go);setTimeout(go,1500);

/* hero: scroll. On a screen with room the hero pins: the copy leaves through its masks, the phone
   lies flat in the middle and switches to the big-number screen, then the night spreads out from
   behind it and stays for the planner. Small screens get the same idea without the pin. */
var mm=gsap.matchMedia(),heroPinned=false;
fx.heroDark=function(){return heroP>(heroPinned?.8:.62)}; // when the night has reached the top bar
mm.add('(min-width:821px) and (min-height:680px)',function(){
  var cx,cy,dx,dy,S,R;
  function measure(){var o=offTo(rig,stage),w=rig.offsetWidth,h=rig.offsetHeight,W=stage.offsetWidth,H=Math.min(stage.offsetHeight,innerHeight);cx=W/2;cy=H/2;dx=cx-(o[0]+w/2);dy=cy-(o[1]+h/2);S=Math.min(1.25,H*.8/h);R=Math.hypot(cx,stage.offsetHeight-cy)+30}
  function circle(r){return 'circle('+r.toFixed(1)+'px at '+cx.toFixed(1)+'px '+cy.toFixed(1)+'px)'}
  measure();gsap.set(night,{opacity:1});heroPinned=true;
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:hero,start:'top top',end:'+=130%',pin:true,scrub:.6,invalidateOnRefresh:true,refreshPriority:1,onUpdate:function(s){heroP=s.progress;if(heroP>.02&&tilt)tilt(0,0)}}})
    .fromTo(HS.inners,{yPercent:0},{yPercent:-118,duration:.2,stagger:.014,ease:'power2.in'},0)
    .fromTo('.hl-u',{opacity:1},{opacity:0,duration:.08},0)
    .fromTo('.hero-sub',{y:0,opacity:1},{y:-50,opacity:0,duration:.22,ease:'power1.in'},.02)
    .set('.hero-sub',{pointerEvents:'none'},.2)
    .fromTo('.fl',{opacity:1},{opacity:0,duration:.14,stagger:.03},0)
    .fromTo('.hero-cue',{opacity:1},{opacity:0,duration:.1},0)
    .fromTo(rig,{x:0,y:0,rotationY:-18,rotationX:7,rotation:3,scale:1},{x:function(){measure();return dx},y:function(){return dy},rotationY:0,rotationX:0,rotation:0,scale:function(){return S},duration:.58,ease:'power2.inOut'},0)
    .fromTo('.hero-bg',{scale:1},{scale:1.3,duration:1},0)
    .fromTo('.soff',{opacity:0},{opacity:1,duration:.16},.36)
    .fromTo(night,{clipPath:function(){return circle(0)}},{clipPath:function(){return circle(R)},duration:.5,ease:'power2.in'},.44)
    .fromTo('.hero-dark .w>span',{yPercent:118},{yPercent:0,duration:.18,stagger:.06,ease:'power3.out'},.76)
    /* once the night covers everything, take the map away so no light edge shows above the planner */
    .set('.hero-bg',{visibility:'hidden'},.96).set(stage,{backgroundColor:'#111214'},.96);
  ScrollTrigger.sort();
});
mm.add('(max-width:820px), (max-height:679px)',function(){
  heroPinned=false;
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:hero,start:'top top',end:'bottom top',scrub:true,refreshPriority:1,onUpdate:function(s){heroP=s.progress}}})
    .fromTo('.hero-bg',{scale:1},{scale:1.25,duration:1},0)
    .fromTo('.hero-copy',{opacity:1},{opacity:0,duration:.45},.05)
    .fromTo('.fl',{opacity:1},{opacity:0,duration:.3},.2)
    .fromTo(rig,{rotationY:-18,rotationX:7,rotation:3},{rotationY:0,rotationX:0,rotation:0,duration:.6,ease:'power1.inOut'},0)
    .fromTo('.soff',{opacity:0},{opacity:1,duration:.09},.36)
    .fromTo(night,{opacity:0},{opacity:1,duration:.7,ease:'power2.in'},.2)
    .set('.hero-bg',{visibility:'hidden'},.92).set(stage,{backgroundColor:'#111214'},.92);
  ScrollTrigger.sort();
});
/* touch: a flick may carry the page a little way, not through whole chapters */
if(ScrollTrigger.isTouch)ScrollTrigger.normalizeScroll({type:'touch',allowNestedScroll:true,ignore:'input,textarea,select,.mapbox,#cards',momentum:function(self){var f=fx.free?fx.free():0;return Math.min(.5+f*1.7,Math.abs(self.velocityY)/(3200-f*2200))}}); // past the story a flick carries as far as usual
/* pointer: the phone leans towards the cursor, the map drifts the other way, buttons pull */
var tilt=null;
if(fine){var rx=gsap.quickTo(ptr,'rotationX',{duration:.9,ease:'power3'}),ry=gsap.quickTo(ptr,'rotationY',{duration:.9,ease:'power3'}),bgx=gsap.quickTo('.hero-bg','x',{duration:1.2,ease:'power3'}),bgy=gsap.quickTo('.hero-bg','y',{duration:1.2,ease:'power3'});
  tilt=function(px,py){ry(px*22);rx(py*-16);bgx(px*-26);bgy(py*-18)};
  hero.addEventListener('pointermove',function(e){if(heroP>.02||!introDone)return; // the phone holds still until the dot has landed on it
    var r=hero.getBoundingClientRect();tilt((e.clientX-r.left)/r.width-.5,(e.clientY-r.top)/r.height-.5)});
  hero.addEventListener('pointerleave',function(){tilt(0,0)});
  /* buttons lean a few pixels towards the cursor. The pull is measured from where the button
     rests, not where it has moved to, and is capped, so it can never chase the cursor or
     slide over its neighbour */
  Array.prototype.forEach.call(document.querySelectorAll('.hero-cta .btn'),function(b){var qx=gsap.quickTo(b,'x',{duration:.4,ease:'power3'}),qy=gsap.quickTo(b,'y',{duration:.4,ease:'power3'}),cl=gsap.utils.clamp;
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),hx=r.left+r.width/2-gsap.getProperty(b,'x'),hy=r.top+r.height/2-gsap.getProperty(b,'y');qx(cl(-5,5,(e.clientX-hx)*.12));qy(cl(-3,3,(e.clientY-hy)*.2))});
    b.addEventListener('pointerleave',function(){qx(0);qy(0)})})}

/* ---- section headings: words rise out of a mask ---- */
function head(h){var hd=$('h2',h);if(!hd)return;var ws=splitWords(hd);
  gsap.timeline({scrollTrigger:{trigger:h,start:'top 82%',once:true}})
    .from(ws,{yPercent:120,duration:1,ease:'expo.out',stagger:.045})
    .from($$('.when,p,.btn',h),{y:24,autoAlpha:0,duration:.8,stagger:.08,ease:'power3.out'},.15)}

/* ---- 2. plan ---- */
head($('.plan .sec-head'));
gsap.set('#planLoop',{strokeDasharray:1,strokeDashoffset:1});var planShown=false;
var pv={c:0,m:0,k:32};
fx.planDraw=function(){if(!planShown)return;gsap.fromTo('#planLoop',{strokeDashoffset:1},{strokeDashoffset:0,duration:.9,ease:'power2.out',overwrite:true});gsap.fromTo('#planStart',{attr:{r:15}},{attr:{r:7},duration:.7,ease:'back.out(3)',overwrite:true})};
fx.plan=function(c,m,k){gsap.to(pv,{c:c,m:m,k:k,duration:.6,ease:'power2.out',overwrite:true,onUpdate:function(){setPlan(pv.c,pv.m,pv.k)}})};
/* a real loop arrived: the page below changed, so re-measure and point at the way on */
var rt2;fx.ride=function(){gsap.fromTo('#rideBtn',{scale:.7,autoAlpha:0},{scale:1,autoAlpha:1,duration:.6,ease:'back.out(2.2)',clearProps:'transform'});gsap.fromTo('.result>div',{y:10},{y:0,duration:.5,stagger:.05,ease:'power3.out'});clearTimeout(rt2);rt2=setTimeout(function(){ScrollTrigger.refresh()},300)};
gsap.timeline({scrollTrigger:{trigger:'.planner',start:'top 78%',once:true}})
  .fromTo('.planner .mapbox',{clipPath:'inset(0% 100% 0% 0% round 20px)'},{clipPath:'inset(0% 0% 0% 0% round 20px)',duration:1.3,ease:'expo.inOut'})
  .from('#planMap',{scale:1.5,duration:1.8,ease:'power3.out'},0)
  .from('.ctl',{x:70,autoAlpha:0,duration:1,ease:'power3.out'},.25)
  .from('.ctl .row,.ctl .result>div',{y:22,autoAlpha:0,stagger:.07,duration:.6,ease:'power3.out',clearProps:'transform'},.55)
  .add(function(){planShown=true;pv.c=0;pv.m=0;pv.k=0;fx.planDraw();if(PL.last)fx.plan(PL.last.asc,PL.last.time/60,PL.last.dist/1000);else $('#km').dispatchEvent(new Event('input'))},.8);
gsap.from('.plan-more li',{y:40,autoAlpha:0,stagger:.12,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.plan-more',start:'top 90%',once:true}});

/* ---- 3. dawn: the clock runs through the night, pinned ---- */
(function(){var ck=$('#clock'),dl=$('#dawnLine'),o={m:21*60+40},phase=-1,lines=['Route saved. Lights out.','Still dark. Still quiet.','The alarm goes off before the traffic does.'];
  function tick(){var m=Math.round(o.m)%1440,h=Math.floor(m/60);ck.textContent=(h%12||12)+':'+String(m%60).padStart(2,'0')+(h<12?' am':' pm')}
  gsap.set('.dawn-sky',{opacity:0});gsap.set('.dawn-stars',{opacity:1});gsap.set('.dawn-sun',{yPercent:170});gsap.set('.dawn-in',{color:'#EDEDEB'});tick();dl.textContent=lines[0];
  gsap.timeline({defaults:{ease:'none'},scrollTrigger:{trigger:'#dawn',start:'top top',end:'+=170%',pin:true,scrub:.6,onUpdate:function(s){fx.dawnLight=s.progress>.62;var ph=s.progress<.3?0:s.progress<.74?1:2;if(ph!==phase){phase=ph;dl.textContent=lines[ph];gsap.fromTo(dl,{y:14,autoAlpha:0},{y:0,autoAlpha:1,duration:.5,ease:'power3.out'})}}}})
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

/* ---- 6. after the ride: quiet reveals. Things rise a little and fade in, once ---- */
function rise(sel,trig,o){o=o||{};gsap.from(sel,{y:o.y||28,autoAlpha:0,duration:o.d||.9,stagger:o.s||0,ease:'power3.out',scrollTrigger:{trigger:trig||sel,start:'top 85%',once:true}})}
head($('.share .sec-head'));
rise('.share-side>*:not(.sec-head)','.share-side',{y:18,s:.08});
rise('#cards','#cards',{y:44,d:1.1});
if(fine)$$('.sc').forEach(function(c){c.addEventListener('pointermove',function(e){var r=c.getBoundingClientRect();gsap.to(c,{rotationY:((e.clientX-r.left)/r.width-.5)*10,rotationX:((e.clientY-r.top)/r.height-.5)*-8,transformPerspective:900,duration:.5,ease:'power2.out'})});
  c.addEventListener('pointerleave',function(){gsap.to(c,{rotationY:0,rotationX:0,duration:.9,ease:'power3.out'})})});
head($('.fly-text'));
rise('.fly-stage','.fly-stage',{y:36,d:1.1});
ScrollTrigger.create({trigger:'.fly-stage',start:'top 62%',once:true,onEnter:function(){$('#flyBtn').click()}});

head($('#lookback .sec-head'));
rise('.back-grid>*','.back-grid',{y:32,s:.1});
gsap.from('#bars div',{scaleY:0,transformOrigin:'50% 100%',duration:1,stagger:.06,ease:'power3.out',scrollTrigger:{trigger:'#bars',start:'top 88%',once:true}});
count($('#actTotal'),63.4,1,'#bars','<small>km</small>');
gsap.from('.care .bar span',{scaleX:0,transformOrigin:'0 50%',duration:1.2,stagger:.12,ease:'power3.out',scrollTrigger:{trigger:'.care',start:'top 80%',once:true}});
rise('.gallery');

head($('.feat .sec-head'));
rise('.fgroup','.feat-grid',{y:24,s:.1});

head($('.priv .sec-head'));
rise('.leaves>div','.leaves',{y:16,s:.07,d:.7});
(function(){var ws=splitWords($('#install h2'));
  gsap.timeline({scrollTrigger:{trigger:'#install',start:'top 78%',once:true}})
    .from(ws,{yPercent:120,duration:1,ease:'expo.out',stagger:.045})
    .from('.steps li',{y:16,autoAlpha:0,stagger:.1,duration:.7,ease:'power3.out'},.2)
    .from('#install .hero-cta .btn',{y:16,autoAlpha:0,stagger:.08,duration:.7,ease:'power3.out',clearProps:'transform'},.5)
    .from('.meta>*',{y:14,autoAlpha:0,stagger:.05,duration:.6,ease:'power3.out'},.3)})();

head($('.faq .sec-head'));
rise('.faq-list details','.faq-list',{y:14,s:.04,d:.6});

addEventListener('load',function(){ScrollTrigger.refresh()});
})();

})();
