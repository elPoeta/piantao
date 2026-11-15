var tc=Object.defineProperty;var nc=(i,e,t)=>e in i?tc(i,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):i[e]=t;var Ne=(i,e,t)=>nc(i,typeof e!="symbol"?e+"":e,t);import{P as ic,c as rc,C as ts,a as sc,b as ac,p as oc,B as lc,A as Ft,h as Yn,y as er,u as Ce,d as Qa}from"./index-FEV-xsge.js";const Hi={on:.34,off:.52};function cc(i){Hi.on=mt(i,.2,.6),Hi.off=Hi.on+.18}const uc=70,ja=45,hc=.6,dc=.12,Pi={tap:.85,row:.8,orbit:1,ring:1.2,close:1.2},fc=1,pc=24,mc=1800,tr={gain:.006,max:1.15},eo=700,gc=38,ai=.14,Li={min:.4,max:3.2},nr={min:.4,max:3},to=.8,mt=(i,e,t)=>Math.max(e,Math.min(t,i)),kt=(i,e)=>Math.hypot(i.x-e.x,i.y-e.y);function _c(i,e){const t=Math.max(e.cw/e.vw,e.ch/e.vh),n=e.vw*t,r=e.vh*t;let s=(e.cw-n)/2+(e.mirror?1-i.x:i.x)*n,a=(e.ch-r)/2+i.y*r;return e.amp&&e.amp!==1&&(s=mt(e.cw/2+(s-e.cw/2)*e.amp,0,e.cw),a=mt(e.ch/2+(a-e.ch/2)*e.amp,0,e.ch)),{x:s,y:a}}class no{constructor(e=2.2,t=.02,n=1){Ne(this,"px",null);Ne(this,"dx",{x:0,y:0});Ne(this,"t",0);this.minCutoff=e,this.beta=t,this.dCutoff=n}alpha(e,t){return 1/(1+1/(2*Math.PI*e)/t)}filter(e,t){if(!this.px||t-this.t>.5)return this.px={...e},this.dx={x:0,y:0},this.t=t,{...e};const n=Math.max(.001,t-this.t);this.t=t;const r=this.alpha(this.dCutoff,n),s={x:(e.x-this.px.x)/n,y:(e.y-this.px.y)/n};this.dx={x:this.dx.x+r*(s.x-this.dx.x),y:this.dx.y+r*(s.y-this.dx.y)};const a=Math.hypot(this.dx.x,this.dx.y),o=this.alpha(this.minCutoff+this.beta*a,n);return this.px={x:this.px.x+o*(e.x-this.px.x),y:this.px.y+o*(e.y-this.px.y)},{...this.px}}reset(){this.px=null}}const io=.85,xc=.4;function vc(i,e){if(i.length!==21)return null;const t=c=>({x:c.x*e,y:c.y}),n=kt(t(i[0]),t(i[9]));if(n<1e-4)return null;const r=kt(t(i[4]),t(i[8]))/n,s={x:i[4].x,y:i[4].y},a={x:i[8].x,y:i[8].y},o=mt((io-r)/(io-xc),0,1);return{palm:n,pinch:r,thumb:s,index:a,cursor:{x:a.x+((s.x+a.x)/2-a.x)*o,y:a.y+((s.y+a.y)/2-a.y)*o}}}class ro{constructor(){Ne(this,"on",!1);Ne(this,"run",0)}update(e){const t=this.on?e<Hi.off:e<Hi.on;return t===this.on?(this.run=0,this.on):(++this.run>=2&&(this.on=t,this.run=0),this.on)}reset(){this.on=!1,this.run=0}}class Sc{constructor(){Ne(this,"wrists",[null,null]);Ne(this,"filters",[new ro,new ro]);Ne(this,"smooth",[new no,new no]);Ne(this,"clock",0)}process(e,t,n,r){const s=r??(this.clock+=.041666666666666664),a=e.map(f=>vc(f,t)).filter(f=>f!==null).slice(0,2),o=f=>({x:e[f][0].x,y:e[f][0].y}),c=[null,null],l=[];if(a.length===1){const f=o(0),d=[0,1].filter(_=>this.wrists[_]!==null&&kt(this.wrists[_],f)<.35);d.sort((_,S)=>kt(this.wrists[_],f)-kt(this.wrists[S],f));const h=[0,1].find(_=>this.wrists[_]===null);l.push(d.length?d[0]:h??0)}else if(a.length===2){const f=o(0),d=o(1),[h,_]=this.wrists,S=(h?kt(h,f):0)+(_?kt(_,d):0),m=(h?kt(h,d):0)+(_?kt(_,f):0);l.push(...S<=m?[0,1]:[1,0])}const u=new Set;a.forEach((f,d)=>{const h=l[d];u.add(h),this.wrists[h]=o(d),c[h]={cursor:this.smooth[h].filter(_c(f.cursor,n),s),pinching:this.filters[h].update(f.pinch)}});for(const f of[0,1])u.has(f)||(this.wrists[f]=null,this.filters[f].reset(),this.smooth[f].reset());return c}reset(){this.wrists=[null,null],this.filters.forEach(e=>e.reset()),this.smooth.forEach(e=>e.reset())}}const ir="@ring",ns=()=>({visible:!1,pinching:!1,cursor:{x:0,y:0},grab:null,off:{x:0,y:0},hover:null,last:{x:0,y:0},lastT:0,start:{x:0,y:0},startT:0,hist:[],dwell:0,dwellKey:null,dwellAnchor:{x:0,y:0},dwellT0:0,dwellDone:null,mode:"none",hold:0,anchor:{x:0,y:0},anchorT:0,zone:null,rotBase:null,moved:!1});class Mc{constructor(){Ne(this,"cards",new Map);Ne(this,"board",{scale:1,tx:0,ty:0});Ne(this,"ring",{x:0,y:0,r:62,open:!1,bloom:0});Ne(this,"orbitIds",[]);Ne(this,"orbits",[]);Ne(this,"slots",[ns(),ns(),ns()]);Ne(this,"events",[]);Ne(this,"zoom",null);Ne(this,"cw",800);Ne(this,"ch",600);Ne(this,"zc",1);Ne(this,"placed",0);Ne(this,"ringMoved",!1)}setSize(e,t){this.cw=e,this.ch=t,this.ringMoved?(this.ring.x=mt(this.ring.x,this.ring.r,e-this.ring.r),this.ring.y=mt(this.ring.y,this.ring.r,t-this.ring.r)):(this.ring.x=Math.min(170,e/2),this.ring.y=Math.min(130,t*.22))}setOrbits(e){this.orbitIds=e,this.layoutOrbits()}setOpen(e){this.ring.open=e}layoutOrbits(){const e=this.orbitIds.length,t=(this.ring.r+82)*this.ring.bloom,n=34*this.ring.bloom,r=this.ring.y<this.ch*.55?1:-1,s=Math.min(Math.PI*.8,.5*Math.PI+.1*e);this.orbits=this.orbitIds.map((a,o)=>{const c=e===1?Math.PI/2:Math.PI/2-s/2+s*o/(e-1);return{id:a,x:this.ring.x+Math.cos(c)*t,y:this.ring.y+r*Math.sin(c)*t,r:n}})}addCard(e,t,n,r={}){const s=r.kind??"card",a={id:e,w:t,h:n,scale:1,rot:0,rx:0,ry:0,z:++this.zc,vx:0,vy:0,held:null,hover:!1,closable:r.closable!==!1,kind:s,titleH:r.titleH??0,rows:r.rows??[],flick:!1,x:0,y:0};if(s==="window"){a.scale=mt(Math.min((this.ch-160)/n,(this.cw-30)/t,1),Li.min,1);const o=[...this.cards.values()].filter(l=>l.kind==="window").length%6,c=this.toBoard({x:this.cw/2+28*o,y:(56+this.ch-70)/2+24*o});a.x=c.x,a.y=c.y}else{const o=this.freeSpot(t,n);a.x=o.x,a.y=o.y}return this.cards.set(e,a),this.placed++,a}resize(e,t,n,r=[]){const s=this.cards.get(e);s&&(s.w=t,s.h=n,s.rows=r)}area(){return{x0:16,y0:Math.min(this.ring.y+this.ring.r+24,this.ch*.3),x1:this.cw-16,y1:this.ch-84}}freeSpot(e,t){const n=this.area(),r=14,s=[...this.cards.values()].map(u=>{const f=this.toScreenFromBoard({x:u.x,y:u.y});return{x:f.x,y:f.y,hw:u.w*u.scale*this.board.scale/2+r,hh:u.h*u.scale*this.board.scale/2+r}}),a=(u,f)=>s.every(d=>Math.abs(d.x-u)>=d.hw+e/2||Math.abs(d.y-f)>=d.hh+t/2),o=[n.x0+e/2,...s.map(u=>u.x+u.hw+e/2)].filter(u=>u<=n.x1-e/2).sort((u,f)=>u-f),c=[n.y0+t/2,...s.map(u=>u.y+u.hh+t/2)].filter(u=>u<=n.y1-t/2).sort((u,f)=>u-f);for(const u of c)for(const f of o)if(a(f,u))return this.toBoard({x:f,y:u});const l=this.placed%8;return this.toBoard({x:mt(n.x0+e/2+30*l,e/2,this.cw-e/2),y:mt(n.y0+t/2+24*l,t/2,this.ch-t/2-70)})}arrange(e){this.resetView();const t=[...this.cards.values()].filter(s=>s.kind!=="window"&&(!e||e.includes(s.id))).sort((s,a)=>s.z-a.z);if(t.length===0)return;const n=this.area(),r=14;for(let s=1;s>=.4-1e-9;s-=.05){const a=[];let o=n.x0,c=n.y0,l=0,u=!0;for(const f of t){const d=f.w*s,h=f.h*s;if(o+d>n.x1&&o>n.x0&&(o=n.x0,c+=l+r,l=0),c+h>n.y1){u=!1;break}a.push({x:o+d/2,y:c+h/2}),o+=d+r,l=Math.max(l,h)}if(u||s<.4+1e-9){t.forEach((f,d)=>{const h=a[d]??{x:this.cw/2,y:this.ch/2};f.scale=s,f.rot=f.rx=f.ry=0,f.x=h.x,f.y=h.y,f.vx=f.vy=0});return}}}removeCard(e){this.cards.delete(e);for(const t of this.slots)t.grab===e&&(t.grab=null,t.mode="none");this.zoom&&this.zoom.target===e&&(this.zoom=null)}clear(){this.cards.clear(),this.zoom=null;for(const e of this.slots)e.grab=null,e.mode="none";this.placed=0}toBoard(e){return{x:(e.x-this.board.tx)/this.board.scale,y:(e.y-this.board.ty)/this.board.scale}}toScreenFromBoard(e){return{x:e.x*this.board.scale+this.board.tx,y:e.y*this.board.scale+this.board.ty}}localOf(e,t){const n=this.toBoard(t),r=n.x-e.x,s=n.y-e.y,a=Math.cos(-e.rot),o=Math.sin(-e.rot);return{x:(r*a-s*o)/e.scale,y:(r*o+s*a)/e.scale}}cardAt(e,t=0){let n=null,r=1/0;for(const s of this.cards.values()){const a=this.localOf(s,e),o=t/(s.scale*this.board.scale),c=Math.max(0,Math.abs(a.x)-s.w/2),l=Math.max(0,Math.abs(a.y)-s.h/2);if(c>o||l>o)continue;const u=Math.hypot(c,l);(u<r-1e-6||Math.abs(u-r)<=1e-6&&n&&s.z>n.z)&&(n=s,r=u)}return n}raise(e){const t=this.cards.get(e);t&&(t.z=++this.zc)}windowAt(e){const t=this.cardAt(e,0);return t&&t.kind==="window"?t:null}zoneOf(e,t){const n=this.localOf(e,t),r=n.y+e.h/2;if(e.kind==="window")return r<=e.titleH?{t:"title"}:{t:"body"};if(e.closable&&Math.hypot(n.x-(e.w/2-20),n.y-(-e.h/2+20))<=24)return{t:"close"};if(e.kind==="list"){const s=e.rows.find(a=>r>=a.y0&&r<a.y1&&Math.abs(n.x)<=e.w/2);if(s)return{t:"row",row:s.id}}return{t:"body"}}overUi(e){if(this.ring.bloom>.6){for(const t of this.orbits)if(Math.hypot(e.x-t.x,e.y-t.y)<=t.r)return{type:"orbit",id:t.id}}return Math.hypot(e.x-this.ring.x,e.y-this.ring.y)<=this.ring.r?{type:"ring"}:null}update(e,t){this.events=[];const n=this.slots.some(r=>r.lastT)?Math.min(.1,Math.max(.001,t-Math.max(...this.slots.map(r=>r.lastT)))):.016;this.ring.bloom+=((this.ring.open?1:0)-this.ring.bloom)*Math.min(1,n*9),Math.abs(this.ring.bloom-(this.ring.open?1:0))<.002&&(this.ring.bloom=this.ring.open?1:0),this.layoutOrbits();for(let r=0;r<3;r++)this.updateSlot(r,e[r]??null,t,n);this.updateZoom(),this.stepInertia(n);for(const r of this.cards.values())r.hover=this.slots.some(s=>s.visible&&s.hover===r.id);return this.events}histAt(e,t){for(const n of e.hist)if(n.t>=t)return{x:n.x,y:n.y};return{...e.cursor}}target(e){const t=this.overUi(e);return{over:t,card:t?null:this.cardAt(e,uc),p:e}}updateSlot(e,t,n,r){const s=this.slots[e];if(!t){s.pinching&&this.release(e,n,!0),s.visible=!1,s.hover=null,s.hist=[],s.hold=0,this.resetDwell(s);return}const a=!s.visible;for(s.visible=!0,s.cursor=a?{...t.cursor}:{x:s.cursor.x+to*(t.cursor.x-s.cursor.x),y:s.cursor.y+to*(t.cursor.y-s.cursor.y)},s.hist.push({t:n,x:s.cursor.x,y:s.cursor.y});s.hist.length>2&&n-s.hist[0].t>.4;)s.hist.shift();const o=this.target(s.cursor);if(s.hover=o.card?o.card.id:null,t.pinching&&!s.pinching){s.pinching=!0,this.resetDwell(s);let c=o;if(e<2){const l=this.target(this.histAt(s,n-dc));(l.over||l.card)&&(c=l)}this.pinchStart(e,s,c,n,!!t.rotate)}else!t.pinching&&s.pinching?this.release(e,n):s.pinching&&s.grab&&!this.zoom&&this.drag(s,n);s.pinching?this.resetDwell(s):e<2&&!this.zoom&&(this.dwellStep(s,o,n),this.hoverScroll(s,r))}resetDwell(e){e.dwell=0,e.dwellKey=null,e.dwellDone=null}dwellStep(e,t,n){let r=null,s=Pi.tap;if(t.over)r=t.over.type==="ring"?"ring":`orbit:${t.over.id}`,s=t.over.type==="ring"?Pi.ring:Pi.orbit;else{const a=this.cardAt(e.cursor,0);if(a){const o=this.zoneOf(a,e.cursor);o.t==="close"||o.t==="title"?(r=`close:${a.id}`,s=Pi.close):o.t==="row"?(r=`row:${a.id}:${o.row}`,s=Pi.row):a.kind==="card"&&(r=`tap:${a.id}`)}}this.dwellRun(e,r,s,n)}dwellRun(e,t,n,r){if(!t){this.resetDwell(e);return}if(t!==e.dwellKey){e.dwellKey=t,e.dwellAnchor={...e.cursor},e.dwellT0=r,e.dwell=0,e.dwellDone!==t&&(e.dwellDone=null);return}if(e.dwellDone===t){e.dwell=0;return}if(kt(e.cursor,e.dwellAnchor)>gc){e.dwellAnchor={...e.cursor},e.dwellT0=r,e.dwell=0;return}if(e.dwell=mt((r-e.dwellT0)/n,0,1),!(e.dwell<1))if(e.dwellDone=t,e.dwell=0,t==="ring")this.events.push({type:"ring"});else if(t.startsWith("orbit:"))this.events.push({type:"orbit",id:t.slice(6)});else if(t.startsWith("close:")){const s=t.slice(6);this.events.push({type:"close",id:s}),this.removeCard(s)}else if(t.startsWith("row:")){const[,s,a]=t.split(":");this.events.push({type:"row",id:s,row:a})}else t.startsWith("tap:")&&this.events.push({type:"tap",id:t.slice(4)})}hoverScroll(e,t){const n=this.cardAt(e.cursor,0);if(!n||n.kind!=="window")return;const s=this.localOf(n,e.cursor).y+n.h/2-n.titleH,a=n.h-n.titleH;if(s<0||s>a)return;const o=s/a;o<ai?this.events.push({type:"scroll",id:n.id,dy:-((ai-o)/ai)*eo*t}):o>1-ai&&this.events.push({type:"scroll",id:n.id,dy:(o-(1-ai))/ai*eo*t})}pinchStart(e,t,n,r,s){if(t.start={...t.cursor},t.startT=r,t.moved=!1,t.hold=0,t.mode="none",t.zone=null,t.anchor={...t.cursor},t.anchorT=r,n.over&&n.over.type==="orbit"){this.events.push({type:"orbit",id:n.over.id});return}if(n.over&&n.over.type==="ring"){t.grab=ir,t.mode="move",t.zone={t:"body"},t.off={x:t.cursor.x-this.ring.x,y:t.cursor.y-this.ring.y},t.last={...t.cursor},t.lastT=r;return}const a=n.card;if(!a)return;const o=this.zoneOf(a,n.p);t.zone=o;const c=this.toBoard(t.cursor);t.grab=a.id,t.off={x:c.x-a.x,y:c.y-a.y},t.last={...t.cursor},t.lastT=r,a.z=++this.zc,a.held=e,a.vx=a.vy=0,a.flick=!1,t.mode=s?"rotate":a.kind==="window"&&o.t==="body"?"scroll":"move",t.mode==="rotate"&&(t.rotBase={rx:a.rx,ry:a.ry,at:{...t.cursor}}),this.events.push({type:"grab",id:a.id})}drag(e,t){if(kt(e.cursor,e.start)>ja&&(e.moved=!0),kt(e.cursor,e.anchor)>pc?(e.anchor={...e.cursor},e.anchorT=t,e.hold=0):e.hold=mt((t-e.anchorT)/fc,0,1),e.grab===ir){this.ring.x=mt(e.cursor.x-e.off.x,this.ring.r,this.cw-this.ring.r),this.ring.y=mt(e.cursor.y-e.off.y,this.ring.r,this.ch-this.ring.r),e.moved&&(this.ringMoved=!0);return}const n=e.grab?this.cards.get(e.grab):null;if(!n)return;if(e.hold>=1&&e.mode==="scroll"){e.mode="move";const a=this.toBoard(e.cursor);e.off={x:a.x-n.x,y:a.y-n.y},e.hold=0,e.anchor={...e.cursor},e.anchorT=t}else e.hold>=1&&e.mode==="move"&&e.moved&&(e.mode="rotate",e.rotBase={rx:n.rx,ry:n.ry,at:{...e.cursor}},e.hold=0,e.anchor={...e.cursor},e.anchorT=t,n.vx=n.vy=0);if(e.mode==="rotate"){const a=e.rotBase??{rx:n.rx,ry:n.ry,at:{...e.cursor}};n.ry=mt(a.ry+(e.cursor.x-a.at.x)*tr.gain,-1.15,tr.max),n.rx=mt(a.rx+(e.cursor.y-a.at.y)*tr.gain,-1.15,tr.max);return}if(e.mode==="scroll"){const a=(e.last.y-e.cursor.y)/(n.scale*this.board.scale);a!==0&&this.events.push({type:"scroll",id:n.id,dy:a}),e.last={...e.cursor},e.lastT=t;return}const r=this.toBoard(e.cursor);n.x=r.x-e.off.x,n.y=r.y-e.off.y;const s=t-e.lastT;s>.004&&(n.vx=.6*n.vx+.4*(e.cursor.x-e.last.x)/s/this.board.scale,n.vy=.6*n.vy+.4*(e.cursor.y-e.last.y)/s/this.board.scale,e.last={...e.cursor},e.lastT=t)}release(e,t,n=!1){const r=this.slots[e],s=this.zoom!==null&&e<2,a=!n&&!s&&!r.moved&&r.mode!=="rotate"&&t-r.startT<=hc&&kt(r.cursor,r.start)<=ja;if(r.pinching=!1,r.hold=0,r.grab===ir){a&&this.events.push({type:"ring"}),r.grab=null,r.mode="none";return}if(r.grab){const o=this.cards.get(r.grab);if(o){o.held=null;const c=r.zone;let l=!1;if(a&&c&&(c.t==="close"||c.t==="title"?(this.events.push({type:"close",id:o.id}),this.removeCard(o.id),l=!0):c.t==="row"?this.events.push({type:"row",id:o.id,row:c.row}):o.kind==="card"&&this.events.push({type:"tap",id:o.id})),!l){(s||t-r.lastT>.15)&&(o.vx=o.vy=0);const u=Math.hypot(o.vx,o.vy)*this.board.scale;o.flick=r.mode==="move"&&u>=mc,o.flick||this.keepInside(o),this.events.push({type:"drop",id:o.id})}}r.grab=null}if(r.mode="none",s){this.zoom=null;for(const o of this.slots.slice(0,2))o.grab=null,o.mode="none"}}keepInside(e){const t=this.toBoard({x:40,y:40}),n=this.toBoard({x:this.cw-40,y:this.ch-70});e.x=mt(e.x,t.x,n.x),e.y=mt(e.y,t.y,n.y)}updateZoom(){const e=this.slots[0],t=this.slots[1];if(!(e.visible&&t.visible&&e.pinching&&t.pinching)){this.zoom&&!(e.pinching&&t.pinching)&&(this.zoom=null);return}const r=Math.max(20,kt(e.cursor,t.cursor)),s=Math.atan2(t.cursor.y-e.cursor.y,t.cursor.x-e.cursor.x),a={x:(e.cursor.x+t.cursor.x)/2,y:(e.cursor.y+t.cursor.y)/2};if(!this.zoom){const l=[e.grab,t.grab].find(d=>d&&d!==ir)??"board",u=l==="board"?null:this.cards.get(l)??null,f=u?l:"board";this.zoom={d0:r,a0:s,target:f,s0:u?u.scale:this.board.scale,r0:u?u.rot:0,world0:this.toBoard(a),mid0:a,t0:{x:this.board.tx,y:this.board.ty}},u&&(u.vx=u.vy=0);return}const o=this.zoom,c=r/o.d0;if(o.target==="board"){const l=mt(o.s0*c,nr.min,nr.max);this.board.scale=l,this.board.tx=a.x-o.world0.x*l,this.board.ty=a.y-o.world0.y*l}else{const l=this.cards.get(o.target);l&&(l.scale=mt(o.s0*c,Li.min,Li.max),l.rot=o.r0+(s-o.a0))}}stepInertia(e){for(const t of[...this.cards.values()]){if(t.held!==null||Math.abs(t.vx)<5&&Math.abs(t.vy)<5){t.held===null&&(t.vx=t.vy=0);continue}if(t.x+=t.vx*e,t.y+=t.vy*e,t.flick){const a=this.toScreenFromBoard({x:t.x,y:t.y});if(a.x<-t.w*t.scale*.2||a.x>this.cw+t.w*t.scale*.2||a.y<-t.h*t.scale*.2||a.y>this.ch+t.h*t.scale*.2)this.events.push({type:"close",id:t.id}),this.removeCard(t.id);else{const o=Math.exp(-e*1.2);t.vx*=o,t.vy*=o,Math.hypot(t.vx,t.vy)<300&&(t.flick=!1,this.keepInside(t))}continue}const n=Math.exp(-e*4);t.vx*=n,t.vy*=n;const r=this.toBoard({x:30,y:30}),s=this.toBoard({x:this.cw-30,y:this.ch-30});t.x<r.x?(t.x=r.x,t.vx=Math.abs(t.vx)*.4):t.x>s.x&&(t.x=s.x,t.vx=-Math.abs(t.vx)*.4),t.y<r.y?(t.y=r.y,t.vy=Math.abs(t.vy)*.4):t.y>s.y&&(t.y=s.y,t.vy=-Math.abs(t.vy)*.4)}}wheel(e,t){const n=this.cardAt(e);if(n){n.scale=mt(n.scale*t,Li.min,Li.max);return}const r=this.toBoard(e);this.board.scale=mt(this.board.scale*t,nr.min,nr.max),this.board.tx=e.x-r.x*this.board.scale,this.board.ty=e.y-r.y*this.board.scale}resetView(){this.board={scale:1,tx:0,ty:0}}ownsHands(){return this.slots[0].pinching||this.slots[1].pinching}}const jt=300,Kn=16,is=19,rs=46,so=420,Gn=2,Ec={model:"Piantao",user:"vos",system:"sistema",file:"archivo"};function rl(i,e,t){const n=[];for(const r of e.split(`
`)){if(r.trim()===""){n.push("");continue}let s="";for(const a of r.split(/\s+/)){let o=a;for(;i(o)>t&&o.length>1;){let l=o.length-1;for(;l>1&&i(o.slice(0,l))>t;)l--;s&&(n.push(s),s=""),n.push(o.slice(0,l)),o=o.slice(l)}const c=s?`${s} ${o}`:o;i(c)<=t?s=c:(n.push(s),s=o)}n.push(s)}return n}function Tn(i,e,t,n,r,s){i.beginPath(),i.moveTo(e+s,t),i.arcTo(e+n,t,e+n,t+r,s),i.arcTo(e+n,t+r,e,t+r,s),i.arcTo(e,t+r,e,t,s),i.arcTo(e,t,e+n,t,s),i.closePath()}function yc(i){const e=document.createElement("canvas").getContext("2d");e.font="14px system-ui, sans-serif";const t=jt-Kn*2;let n=i.text?rl(_=>e.measureText(_).width,i.text,t):[];const r=i.image&&i.image.naturalWidth>0?i.image:null,s=r?Math.min(300,Math.round(t*r.naturalHeight/r.naturalWidth)):0,a=Math.floor((so-rs-Kn-(r?s+8:0))/is);let o=!1;n.length>a&&(n=n.slice(0,Math.max(1,a)),o=!0,n[n.length-1]=n[n.length-1].replace(/.{0,2}$/,"")+"…");const c=Math.min(so,Math.max(110,rs+Kn+(r?s+8:0)+n.length*is)),l=document.createElement("canvas");l.width=jt*Gn,l.height=c*Gn;const u=l.getContext("2d");u.scale(Gn,Gn),Tn(u,1,1,jt-2,c-2,14);const f=u.createLinearGradient(0,0,0,c);f.addColorStop(0,"rgba(76,201,240,0.22)"),f.addColorStop(1,"rgba(12,24,38,0.78)"),u.fillStyle=f,u.fill(),u.lineWidth=1.5,u.strokeStyle=i.origin==="model"?"rgba(76,201,240,0.9)":"rgba(244,162,97,0.9)",u.stroke(),u.textBaseline="top",u.fillStyle="#e6edf5",u.font="600 16px system-ui, sans-serif";let d=i.title;for(;d.length>1&&u.measureText(d).width>jt-78;)d=d.slice(0,-1);u.fillText(d===i.title?d:d+"…",Kn,14),u.fillStyle="#8a9bb0",u.font="11px system-ui, sans-serif",u.fillText(Ec[i.origin]??i.origin,Kn,32),u.beginPath(),u.arc(jt-20,20,14,0,Math.PI*2),u.fillStyle="rgba(239,71,111,0.25)",u.fill(),u.strokeStyle="#ef476f",u.lineWidth=2,u.beginPath(),u.moveTo(jt-25,15),u.lineTo(jt-15,25),u.moveTo(jt-15,15),u.lineTo(jt-25,25),u.stroke();let h=rs;r&&(u.drawImage(r,Kn,h,t,s),h+=s+8),u.fillStyle="#dbe7f3",u.font="14px system-ui, sans-serif";for(const _ of n)u.fillText(_,Kn,h),h+=is;return o&&(u.fillStyle="#8a9bb0",u.font="11px system-ui, sans-serif",u.fillText("(recortado)",jt-78,c-18)),{canvas:l,w:jt,h:c}}function bc(i,e,t,n,r){if(i.save(),i.translate(t,n),i.strokeStyle=r,i.fillStyle=r,i.lineWidth=2,i.lineJoin="round",i.lineCap="round",e==="dir"||e==="root")Tn(i,1,6,22,15,3),i.stroke(),i.beginPath(),i.moveTo(1,6),i.lineTo(8,2),i.lineTo(12,6),i.stroke();else if(e==="image")i.strokeRect(2,4,20,16),i.beginPath(),i.moveTo(3,19),i.lineTo(9,11),i.lineTo(14,16),i.lineTo(17,12),i.lineTo(21,19),i.stroke(),i.beginPath(),i.arc(16,8,1.8,0,7),i.fill();else if(e==="up")i.beginPath(),i.moveTo(5,14),i.lineTo(12,6),i.lineTo(19,14),i.moveTo(12,6),i.lineTo(12,20),i.stroke();else if(e==="more")for(const s of[5,12,19])i.beginPath(),i.arc(s,12,2,0,7),i.fill();else{i.strokeRect(4,2,16,20);for(let s=0;s<3;s++)i.beginPath(),i.moveTo(8,8+s*5),i.lineTo(16,8+s*5),i.stroke()}i.restore()}const Kt=340,$n=42,ss=50;function Tc(i,e,t){const n=ss+Math.max(1,t.length)*$n+10,r=document.createElement("canvas");r.width=Kt*Gn,r.height=n*Gn;const s=r.getContext("2d");s.scale(Gn,Gn),Tn(s,1,1,Kt-2,n-2,14);const a=s.createLinearGradient(0,0,0,n);a.addColorStop(0,"rgba(244,162,97,0.20)"),a.addColorStop(1,"rgba(12,24,38,0.82)"),s.fillStyle=a,s.fill(),s.lineWidth=1.5,s.strokeStyle="rgba(244,162,97,0.9)",s.stroke(),s.textBaseline="middle",s.fillStyle="#e6edf5",s.font="600 16px system-ui, sans-serif";let o=i;for(;o.length>1&&s.measureText(o).width>Kt-80;)o=o.slice(0,-1);s.fillText(o===i?o:o+"…",16,20),s.fillStyle="#8a9bb0",s.font="11px system-ui, sans-serif",s.fillText(e,16,38),s.beginPath(),s.arc(Kt-20,20,14,0,Math.PI*2),s.fillStyle="rgba(239,71,111,0.25)",s.fill(),s.strokeStyle="#ef476f",s.lineWidth=2,s.beginPath(),s.moveTo(Kt-25,15),s.lineTo(Kt-15,25),s.moveTo(Kt-15,15),s.lineTo(Kt-25,25),s.stroke();const c=[];return t.forEach((l,u)=>{const f=ss+u*$n;c.push({id:l.id,y0:f,y1:f+$n}),Tn(s,8,f+3,Kt-16,$n-6,8),s.fillStyle=u%2?"rgba(255,255,255,0.03)":"rgba(255,255,255,0.07)",s.fill();const d=l.kind==="dir"||l.kind==="root"||l.kind==="up"||l.kind==="more"?"#f4a261":"#4cc9f0";bc(s,l.kind,16,f+9,d),s.fillStyle="#e6edf5",s.font="14px system-ui, sans-serif",s.textAlign="left";let h=l.label;const _=Kt-56-(l.hint?62:16);for(;h.length>1&&s.measureText(h).width>_;)h=h.slice(0,-1);s.fillText(h===l.label?h:h+"…",48,f+$n/2),l.hint&&(s.fillStyle="#8a9bb0",s.font="11px system-ui, sans-serif",s.textAlign="right",s.fillText(l.hint,Kt-16,f+$n/2),s.textAlign="left")}),t.length===0&&(s.fillStyle="#8a9bb0",s.font="13px system-ui, sans-serif",s.fillText("(vacío)",20,ss+$n/2)),{canvas:r,w:Kt,h:n,rows:c}}const At=560,Ht=680,Gt=48,rr=1.5,xn=22,Ac={model:"Piantao",user:"vos",system:"sistema",file:"archivo"};class wc{constructor(e){Ne(this,"canvas",document.createElement("canvas"));Ne(this,"lines",[]);Ne(this,"imgH",0);Ne(this,"contentH",0);Ne(this,"scroll",0);this.doc=e,this.canvas.width=Math.round(At*rr),this.canvas.height=Math.round(Ht*rr);const t=this.canvas.getContext("2d"),n=At-xn*2-10,r=e.image&&e.image.naturalWidth>0?e.image:null;r&&(this.imgH=Math.round(n*r.naturalHeight/r.naturalWidth));let s=!1;for(const a of e.text.split(`
`)){if(e.md&&a.trim().startsWith("```")){s=!s;continue}let o="14.5px system-ui, sans-serif",c="#dbe7f3",l=21,u=0,f=a;if(s)o="13px ui-monospace, monospace",c="#b8d8ff",l=19,u=8;else if(e.md){const h=/^(#{1,4})\s+(.*)$/.exec(a);if(h){const _=h[1].length;o=`700 ${[24,20,17,15.5][_-1]}px system-ui, sans-serif`,c="#ffffff",l=[34,29,26,24][_-1],f=h[2]}else/^\s*[-*]\s+/.test(a)&&(f="•  "+a.replace(/^\s*[-*]\s+/,""),u=6);f=f.replace(/\*\*(.+?)\*\*/g,"$1").replace(/`([^`]+)`/g,"$1")}else o="13px ui-monospace, monospace",l=19;t.font=o;const d=f===""?[""]:rl(h=>t.measureText(h).width,f,n-u);for(const h of d)this.lines.push({text:h,font:o,color:c,h:l,x:u});e.md&&!s&&/^#{1,4}\s/.test(a)&&this.lines.push({text:"",font:o,color:c,h:4,x:0})}this.contentH=(r?this.imgH+14:0)+this.lines.reduce((a,o)=>a+o.h,0)+xn}get title(){return this.doc.title}get viewH(){return Ht-Gt}get maxScroll(){return Math.max(0,this.contentH-this.viewH+xn)}scrollBy(e){const t=Math.min(this.maxScroll,Math.max(0,this.scroll+e)),n=t!==this.scroll;return this.scroll=t,n}render(){const e=this.canvas.getContext("2d");e.setTransform(rr,0,0,rr,0,0),e.clearRect(0,0,At,Ht),Tn(e,1,1,At-2,Ht-2,16);const t=e.createLinearGradient(0,0,0,Ht);t.addColorStop(0,"rgba(14,30,48,0.96)"),t.addColorStop(1,"rgba(8,16,28,0.96)"),e.fillStyle=t,e.fill(),e.save(),Tn(e,1,1,At-2,Ht-2,16),e.clip(),e.save(),e.beginPath(),e.rect(0,Gt,At,Ht-Gt),e.clip();let n=Gt+10-this.scroll;const r=this.doc.image&&this.doc.image.naturalWidth>0?this.doc.image:null;r&&(e.drawImage(r,xn,n,At-xn*2-10,this.imgH),n+=this.imgH+14),e.textBaseline="top";for(const a of this.lines)n+a.h>=Gt&&n<=Ht&&(e.font=a.font,e.fillStyle=a.color,e.fillText(a.text,xn+a.x,n+1)),n+=a.h;if(e.restore(),this.maxScroll>0){const a=e.createLinearGradient(0,Gt,0,Gt+26);a.addColorStop(0,"rgba(8,16,28,0.9)"),a.addColorStop(1,"rgba(8,16,28,0)"),this.scroll>0&&(e.fillStyle=a,e.fillRect(0,Gt,At,26));const o=e.createLinearGradient(0,Ht-34,0,Ht);o.addColorStop(0,"rgba(8,16,28,0)"),o.addColorStop(1,"rgba(8,16,28,0.95)"),this.scroll<this.maxScroll&&(e.fillStyle=o,e.fillRect(0,Ht-34,At,34));const c=this.viewH-16,l=Math.max(36,c*this.viewH/(this.contentH+xn)),u=Gt+8+(c-l)*(this.scroll/this.maxScroll);e.fillStyle="rgba(76,201,240,0.15)",Tn(e,At-11,Gt+8,5,c,2.5),e.fill(),e.fillStyle="rgba(76,201,240,0.85)",Tn(e,At-11,u,5,l,2.5),e.fill()}e.fillStyle="rgba(76,201,240,0.16)",e.fillRect(0,0,At,Gt),e.fillStyle="rgba(76,201,240,0.7)",e.fillRect(0,Gt-1.5,At,1.5),e.textBaseline="middle",e.fillStyle="#ffffff",e.font="600 16px system-ui, sans-serif";let s=this.doc.title;for(;s.length>1&&e.measureText(s).width>At-190;)s=s.slice(0,-1);return e.fillText(s===this.doc.title?s:s+"…",xn,18),e.fillStyle="#8fb4cf",e.font="11px system-ui, sans-serif",e.fillText(`${Ac[this.doc.origin]??this.doc.origin} · arrastrá la barra para mover`,xn,36),e.textAlign="right",e.fillStyle="#ff8fa8",e.font="600 13px system-ui, sans-serif",e.fillText("tocar = cerrar  ✕",At-18,Gt/2),e.textAlign="left",e.restore(),e.lineWidth=2,e.strokeStyle="rgba(76,201,240,0.9)",Tn(e,1,1,At-2,Ht-2,16),e.stroke(),this.canvas}}/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */const Aa="187",Rc=0,ao=1,Cc=2,Pr=1,Pc=2,Bi=3,ti=0,Wt=1,Zt=2,Si=0,ki=1,Or=2,oo=3,lo=4,Lc=5,vi=100,Dc=101,Ic=102,Nc=103,Uc=104,Fc=200,Oc=201,Bc=202,zc=203,sl=204,al=205,Gc=206,Hc=207,kc=208,Vc=209,Wc=210,Xc=211,qc=212,Yc=213,Kc=214,Bs=0,zs=1,Gs=2,Wi=3,Hs=4,ks=5,Vs=6,Ws=7,ol=0,$c=1,Zc=2,wn=0,ll=1,cl=2,ul=3,hl=4,dl=5,fl=6,pl=7,ml=300,Ei=301,Xi=302,as=303,os=304,Xs=1e3,An=1001,qs=1002,Rt=1003,Jc=1004,sr=1005,Vt=1006,ls=1007,Hn=1008,Jt=1009,gl=1010,_l=1011,qi=1012,wa=1013,mn=1014,dn=1015,gn=1016,Ra=1017,Ca=1018,yi=1020,xl=35902,vl=35899,Sl=1021,Ml=1022,fn=1023,Vn=1026,kn=1027,El=1028,Pa=1029,ni=1030,La=1031,Da=1033,Lr=33776,Dr=33777,Ir=33778,Nr=33779,Ys=35840,Ks=35841,$s=35842,Zs=35843,Js=36196,Qs=37492,js=37496,ea=37488,ta=37489,Br=37490,na=37491,ia=37808,ra=37809,sa=37810,aa=37811,oa=37812,la=37813,ca=37814,ua=37815,ha=37816,da=37817,fa=37818,pa=37819,ma=37820,ga=37821,_a=36492,xa=36494,va=36495,Sa=36283,Ma=36284,zr=36285,Ea=36286,Qc=3200,co=0,jc=1,zn="",zt="srgb",Gr="srgb-linear",Hr="linear",rt="srgb",cs=7680,eu=519,tu=512,nu=513,iu=514,yl=515,ru=516,su=517,bl=518,Tl=519,au=35044,uo="300 es",an=2e3,kr=2001;function ou(i){for(let e=i.length-1;e>=0;--e)if(i[e]>=65535)return!0;return!1}function Vr(i){return document.createElementNS("http://www.w3.org/1999/xhtml",i)}function lu(){const i=Vr("canvas");return i.style.display="block",i}const ho={};function fo(...i){const e="THREE."+i.shift();console.log(e,...i)}function Al(i){const e=i[0];if(typeof e=="string"&&e.startsWith("TSL:")){const t=i[1];t&&t.isStackTrace?i[0]+=" "+t.getLocation():i[1]='Stack trace not available. Enable "THREE.Node.captureStackTrace" to capture stack traces.'}return i}function Ue(...i){i=Al(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.warn(t.getError(e)):console.warn(e,...i)}}function et(...i){i=Al(i);const e="THREE."+i.shift();{const t=i[0];t&&t.isStackTrace?console.error(t.getError(e)):console.error(e,...i)}}function Ur(...i){const e=i.join(" ");e in ho||(ho[e]=!0,Ue(...i))}function cu(i,e,t){return new Promise(function(n,r){function s(){switch(i.clientWaitSync(e,i.SYNC_FLUSH_COMMANDS_BIT,0)){case i.WAIT_FAILED:r();break;case i.TIMEOUT_EXPIRED:setTimeout(s,t);break;default:n()}}setTimeout(s,t)})}const uu={[Bs]:Bs,[Gs]:Vs,[Hs]:Hs,[Wi]:ks,[zs]:zs,[Vs]:Gs,[Ws]:Ws,[ks]:Wi};class si{addEventListener(e,t){this._listeners===void 0&&(this._listeners={});const n=this._listeners;n[e]===void 0&&(n[e]=[]),n[e].indexOf(t)===-1&&n[e].push(t)}hasEventListener(e,t){const n=this._listeners;return n===void 0?!1:n[e]!==void 0&&n[e].indexOf(t)!==-1}removeEventListener(e,t){const n=this._listeners;if(n===void 0)return;const r=n[e];if(r!==void 0){const s=r.indexOf(t);s!==-1&&r.splice(s,1)}}dispatchEvent(e){const t=this._listeners;if(t===void 0)return;const n=t[e.type];if(n!==void 0){e.target=this;const r=n.slice(0);for(let s=0,a=r.length;s<a;s++)r[s].call(this,e);e.target=null}}}const Lt=["00","01","02","03","04","05","06","07","08","09","0a","0b","0c","0d","0e","0f","10","11","12","13","14","15","16","17","18","19","1a","1b","1c","1d","1e","1f","20","21","22","23","24","25","26","27","28","29","2a","2b","2c","2d","2e","2f","30","31","32","33","34","35","36","37","38","39","3a","3b","3c","3d","3e","3f","40","41","42","43","44","45","46","47","48","49","4a","4b","4c","4d","4e","4f","50","51","52","53","54","55","56","57","58","59","5a","5b","5c","5d","5e","5f","60","61","62","63","64","65","66","67","68","69","6a","6b","6c","6d","6e","6f","70","71","72","73","74","75","76","77","78","79","7a","7b","7c","7d","7e","7f","80","81","82","83","84","85","86","87","88","89","8a","8b","8c","8d","8e","8f","90","91","92","93","94","95","96","97","98","99","9a","9b","9c","9d","9e","9f","a0","a1","a2","a3","a4","a5","a6","a7","a8","a9","aa","ab","ac","ad","ae","af","b0","b1","b2","b3","b4","b5","b6","b7","b8","b9","ba","bb","bc","bd","be","bf","c0","c1","c2","c3","c4","c5","c6","c7","c8","c9","ca","cb","cc","cd","ce","cf","d0","d1","d2","d3","d4","d5","d6","d7","d8","d9","da","db","dc","dd","de","df","e0","e1","e2","e3","e4","e5","e6","e7","e8","e9","ea","eb","ec","ed","ee","ef","f0","f1","f2","f3","f4","f5","f6","f7","f8","f9","fa","fb","fc","fd","fe","ff"],us=Math.PI/180,ya=180/Math.PI;function Yi(){const i=Math.random()*4294967295|0,e=Math.random()*4294967295|0,t=Math.random()*4294967295|0,n=Math.random()*4294967295|0;return(Lt[i&255]+Lt[i>>8&255]+Lt[i>>16&255]+Lt[i>>24&255]+"-"+Lt[e&255]+Lt[e>>8&255]+"-"+Lt[e>>16&15|64]+Lt[e>>24&255]+"-"+Lt[t&63|128]+Lt[t>>8&255]+"-"+Lt[t>>16&255]+Lt[t>>24&255]+Lt[n&255]+Lt[n>>8&255]+Lt[n>>16&255]+Lt[n>>24&255]).toLowerCase()}function Ke(i,e,t){return Math.max(e,Math.min(t,i))}function hu(i,e){return(i%e+e)%e}function hs(i,e,t){return(1-t)*i+t*e}function du(i){return Math.pow(2,Math.floor(Math.log(i)/Math.LN2))}function Ia(i){switch(i.constructor){case Uint32Array:return 4294967295;case Uint16Array:return 65535;case Uint8Array:case Uint8ClampedArray:return 255;case Int32Array:return 2147483647;case Int16Array:return 32767;case Int8Array:return 127;default:return}}function fu(i,e){if(e.constructor===Float32Array)return i;const t=Ia(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.max(i/t,-1)}function pu(i,e){if(e.constructor===Float32Array)return i;const t=Ia(e);if(t===void 0)throw new Error("THREE.MathUtils: Invalid component type.");return Math.round(i*t)}const Oa=class Oa{constructor(e=0,t=0){this.x=e,this.y=t}get width(){return this.x}set width(e){this.x=e}get height(){return this.y}set height(e){this.y=e}set(e,t){return this.x=e,this.y=t,this}setScalar(e){return this.x=e,this.y=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;default:throw new Error("THREE.Vector2: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;default:throw new Error("THREE.Vector2: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y)}copy(e){return this.x=e.x,this.y=e.y,this}add(e){return this.x+=e.x,this.y+=e.y,this}addScalar(e){return this.x+=e,this.y+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this}subScalar(e){return this.x-=e,this.y-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this}multiply(e){return this.x*=e.x,this.y*=e.y,this}multiplyScalar(e){return this.x*=e,this.y*=e,this}divide(e){return this.x/=e.x,this.y/=e.y,this}divideScalar(e){return this.multiplyScalar(1/e)}applyMatrix3(e){const t=this.x,n=this.y,r=e.elements;return this.x=r[0]*t+r[3]*n+r[6],this.y=r[1]*t+r[4]*n+r[7],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this}negate(){return this.x=-this.x,this.y=-this.y,this}dot(e){return this.x*e.x+this.y*e.y}cross(e){return this.x*e.y-this.y*e.x}lengthSq(){return this.x*this.x+this.y*this.y}length(){return Math.sqrt(this.x*this.x+this.y*this.y)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)}normalize(){return this.divideScalar(this.length()||1)}angle(){return Math.atan2(-this.y,-this.x)+Math.PI}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y;return t*t+n*n}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this}equals(e){return e.x===this.x&&e.y===this.y}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this}rotateAround(e,t){const n=Math.cos(t),r=Math.sin(t),s=this.x-e.x,a=this.y-e.y;return this.x=s*n-a*r+e.x,this.y=s*r+a*n+e.y,this}random(){return this.x=Math.random(),this.y=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y}};Oa.prototype.isVector2=!0;let Ze=Oa;class wi{constructor(e=0,t=0,n=0,r=1){this.isQuaternion=!0,this._x=e,this._y=t,this._z=n,this._w=r}static slerpFlat(e,t,n,r,s,a,o){let c=n[r+0],l=n[r+1],u=n[r+2],f=n[r+3],d=s[a+0],h=s[a+1],_=s[a+2],S=s[a+3];if(f!==S||c!==d||l!==h||u!==_){let m=c*d+l*h+u*_+f*S;m<0&&(d=-d,h=-h,_=-_,S=-S,m=-m);let p=1-o;if(m<.9995){const M=Math.acos(m),w=Math.sin(M);p=Math.sin(p*M)/w,o=Math.sin(o*M)/w,c=c*p+d*o,l=l*p+h*o,u=u*p+_*o,f=f*p+S*o}else{c=c*p+d*o,l=l*p+h*o,u=u*p+_*o,f=f*p+S*o;const M=1/Math.sqrt(c*c+l*l+u*u+f*f);c*=M,l*=M,u*=M,f*=M}}e[t]=c,e[t+1]=l,e[t+2]=u,e[t+3]=f}static multiplyQuaternionsFlat(e,t,n,r,s,a){const o=n[r],c=n[r+1],l=n[r+2],u=n[r+3],f=s[a],d=s[a+1],h=s[a+2],_=s[a+3];return e[t]=o*_+u*f+c*h-l*d,e[t+1]=c*_+u*d+l*f-o*h,e[t+2]=l*_+u*h+o*d-c*f,e[t+3]=u*_-o*f-c*d-l*h,e}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get w(){return this._w}set w(e){this._w=e,this._onChangeCallback()}set(e,t,n,r){return this._x=e,this._y=t,this._z=n,this._w=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._w)}copy(e){return this._x=e.x,this._y=e.y,this._z=e.z,this._w=e.w,this._onChangeCallback(),this}setFromEuler(e,t=!0){const n=e._x,r=e._y,s=e._z,a=e._order,o=Math.cos,c=Math.sin,l=o(n/2),u=o(r/2),f=o(s/2),d=c(n/2),h=c(r/2),_=c(s/2);switch(a){case"XYZ":this._x=d*u*f+l*h*_,this._y=l*h*f-d*u*_,this._z=l*u*_+d*h*f,this._w=l*u*f-d*h*_;break;case"YXZ":this._x=d*u*f+l*h*_,this._y=l*h*f-d*u*_,this._z=l*u*_-d*h*f,this._w=l*u*f+d*h*_;break;case"ZXY":this._x=d*u*f-l*h*_,this._y=l*h*f+d*u*_,this._z=l*u*_+d*h*f,this._w=l*u*f-d*h*_;break;case"ZYX":this._x=d*u*f-l*h*_,this._y=l*h*f+d*u*_,this._z=l*u*_-d*h*f,this._w=l*u*f+d*h*_;break;case"YZX":this._x=d*u*f+l*h*_,this._y=l*h*f+d*u*_,this._z=l*u*_-d*h*f,this._w=l*u*f-d*h*_;break;case"XZY":this._x=d*u*f-l*h*_,this._y=l*h*f-d*u*_,this._z=l*u*_+d*h*f,this._w=l*u*f+d*h*_;break;default:Ue("Quaternion: .setFromEuler() encountered an unknown order: "+a)}return t===!0&&this._onChangeCallback(),this}setFromAxisAngle(e,t){const n=t/2,r=Math.sin(n);return this._x=e.x*r,this._y=e.y*r,this._z=e.z*r,this._w=Math.cos(n),this._onChangeCallback(),this}setFromRotationMatrix(e){const t=e.elements,n=t[0],r=t[4],s=t[8],a=t[1],o=t[5],c=t[9],l=t[2],u=t[6],f=t[10],d=n+o+f;if(d>0){const h=.5/Math.sqrt(d+1);this._w=.25/h,this._x=(u-c)*h,this._y=(s-l)*h,this._z=(a-r)*h}else if(n>o&&n>f){const h=2*Math.sqrt(1+n-o-f);this._w=(u-c)/h,this._x=.25*h,this._y=(r+a)/h,this._z=(s+l)/h}else if(o>f){const h=2*Math.sqrt(1+o-n-f);this._w=(s-l)/h,this._x=(r+a)/h,this._y=.25*h,this._z=(c+u)/h}else{const h=2*Math.sqrt(1+f-n-o);this._w=(a-r)/h,this._x=(s+l)/h,this._y=(c+u)/h,this._z=.25*h}return this._onChangeCallback(),this}setFromUnitVectors(e,t){let n=e.dot(t)+1;return n<1e-8?(n=0,Math.abs(e.x)>Math.abs(e.z)?(this._x=-e.y,this._y=e.x,this._z=0,this._w=n):(this._x=0,this._y=-e.z,this._z=e.y,this._w=n)):(this._x=e.y*t.z-e.z*t.y,this._y=e.z*t.x-e.x*t.z,this._z=e.x*t.y-e.y*t.x,this._w=n),this.normalize()}angleTo(e){return 2*Math.acos(Math.abs(Ke(this.dot(e),-1,1)))}rotateTowards(e,t){const n=this.angleTo(e);if(n===0)return this;const r=Math.min(1,t/n);return this.slerp(e,r),this}identity(){return this.set(0,0,0,1)}invert(){return this.conjugate()}conjugate(){return this._x*=-1,this._y*=-1,this._z*=-1,this._onChangeCallback(),this}dot(e){return this._x*e._x+this._y*e._y+this._z*e._z+this._w*e._w}lengthSq(){return this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w}length(){return Math.sqrt(this._x*this._x+this._y*this._y+this._z*this._z+this._w*this._w)}normalize(){let e=this.length();return e===0?(this._x=0,this._y=0,this._z=0,this._w=1):(e=1/e,this._x=this._x*e,this._y=this._y*e,this._z=this._z*e,this._w=this._w*e),this._onChangeCallback(),this}multiply(e){return this.multiplyQuaternions(this,e)}premultiply(e){return this.multiplyQuaternions(e,this)}multiplyQuaternions(e,t){const n=e._x,r=e._y,s=e._z,a=e._w,o=t._x,c=t._y,l=t._z,u=t._w;return this._x=n*u+a*o+r*l-s*c,this._y=r*u+a*c+s*o-n*l,this._z=s*u+a*l+n*c-r*o,this._w=a*u-n*o-r*c-s*l,this._onChangeCallback(),this}slerp(e,t){let n=e._x,r=e._y,s=e._z,a=e._w,o=this.dot(e);o<0&&(n=-n,r=-r,s=-s,a=-a,o=-o);let c=1-t;if(o<.9995){const l=Math.acos(o),u=Math.sin(l);c=Math.sin(c*l)/u,t=Math.sin(t*l)/u,this._x=this._x*c+n*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this._onChangeCallback()}else this._x=this._x*c+n*t,this._y=this._y*c+r*t,this._z=this._z*c+s*t,this._w=this._w*c+a*t,this.normalize();return this}slerpQuaternions(e,t,n){return this.copy(e).slerp(t,n)}random(){const e=2*Math.PI*Math.random(),t=2*Math.PI*Math.random(),n=Math.random(),r=Math.sqrt(1-n),s=Math.sqrt(n);return this.set(r*Math.sin(e),r*Math.cos(e),s*Math.sin(t),s*Math.cos(t))}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._w===this._w}fromArray(e,t=0){return this._x=e[t],this._y=e[t+1],this._z=e[t+2],this._w=e[t+3],this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._w,e}fromBufferAttribute(e,t){return this._x=e.getX(t),this._y=e.getY(t),this._z=e.getZ(t),this._w=e.getW(t),this._onChangeCallback(),this}toJSON(){return this.toArray()}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._w}}const Ba=class Ba{constructor(e=0,t=0,n=0){this.x=e,this.y=t,this.z=n}set(e,t,n){return n===void 0&&(n=this.z),this.x=e,this.y=t,this.z=n,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;default:throw new Error("THREE.Vector3: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;default:throw new Error("THREE.Vector3: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this}multiplyVectors(e,t){return this.x=e.x*t.x,this.y=e.y*t.y,this.z=e.z*t.z,this}applyEuler(e){return this.applyQuaternion(po.setFromEuler(e))}applyAxisAngle(e,t){return this.applyQuaternion(po.setFromAxisAngle(e,t))}applyMatrix3(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[3]*n+s[6]*r,this.y=s[1]*t+s[4]*n+s[7]*r,this.z=s[2]*t+s[5]*n+s[8]*r,this}applyNormalMatrix(e){return this.applyMatrix3(e).normalize()}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=e.elements,a=1/(s[3]*t+s[7]*n+s[11]*r+s[15]);return this.x=(s[0]*t+s[4]*n+s[8]*r+s[12])*a,this.y=(s[1]*t+s[5]*n+s[9]*r+s[13])*a,this.z=(s[2]*t+s[6]*n+s[10]*r+s[14])*a,this}applyQuaternion(e){const t=this.x,n=this.y,r=this.z,s=e.x,a=e.y,o=e.z,c=e.w,l=2*(a*r-o*n),u=2*(o*t-s*r),f=2*(s*n-a*t);return this.x=t+c*l+a*f-o*u,this.y=n+c*u+o*l-s*f,this.z=r+c*f+s*u-a*l,this}project(e){return this.applyMatrix4(e.matrixWorldInverse).applyMatrix4(e.projectionMatrix)}unproject(e){return this.applyMatrix4(e.projectionMatrixInverse).applyMatrix4(e.matrixWorld)}transformDirection(e){const t=this.x,n=this.y,r=this.z,s=e.elements;return this.x=s[0]*t+s[4]*n+s[8]*r,this.y=s[1]*t+s[5]*n+s[9]*r,this.z=s[2]*t+s[6]*n+s[10]*r,this.normalize()}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this}divideScalar(e){return this.multiplyScalar(1/e)}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this.z=Ke(this.z,e.z,t.z),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this.z=Ke(this.z,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this}cross(e){return this.crossVectors(this,e)}crossVectors(e,t){const n=e.x,r=e.y,s=e.z,a=t.x,o=t.y,c=t.z;return this.x=r*c-s*o,this.y=s*a-n*c,this.z=n*o-r*a,this}projectOnVector(e){const t=e.lengthSq();if(t===0)return this.set(0,0,0);const n=e.dot(this)/t;return this.copy(e).multiplyScalar(n)}projectOnPlane(e){return ds.copy(this).projectOnVector(e),this.sub(ds)}reflect(e){return this.sub(ds.copy(e).multiplyScalar(2*this.dot(e)))}angleTo(e){const t=Math.sqrt(this.lengthSq()*e.lengthSq());if(t===0)return Math.PI/2;const n=this.dot(e)/t;return Math.acos(Ke(n,-1,1))}distanceTo(e){return Math.sqrt(this.distanceToSquared(e))}distanceToSquared(e){const t=this.x-e.x,n=this.y-e.y,r=this.z-e.z;return t*t+n*n+r*r}manhattanDistanceTo(e){return Math.abs(this.x-e.x)+Math.abs(this.y-e.y)+Math.abs(this.z-e.z)}setFromSpherical(e){return this.setFromSphericalCoords(e.radius,e.phi,e.theta)}setFromSphericalCoords(e,t,n){const r=Math.sin(t)*e;return this.x=r*Math.sin(n),this.y=Math.cos(t)*e,this.z=r*Math.cos(n),this}setFromCylindrical(e){return this.setFromCylindricalCoords(e.radius,e.theta,e.y)}setFromCylindricalCoords(e,t,n){return this.x=e*Math.sin(t),this.y=n,this.z=e*Math.cos(t),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this}setFromMatrixScale(e){const t=this.setFromMatrixColumn(e,0).length(),n=this.setFromMatrixColumn(e,1).length(),r=this.setFromMatrixColumn(e,2).length();return this.x=t,this.y=n,this.z=r,this}setFromMatrixColumn(e,t){return this.fromArray(e.elements,t*4)}setFromMatrix3Column(e,t){return this.fromArray(e.elements,t*3)}setFromEuler(e){return this.x=e._x,this.y=e._y,this.z=e._z,this}setFromColor(e){return this.x=e.r,this.y=e.g,this.z=e.b,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this}randomDirection(){const e=Math.random()*Math.PI*2,t=Math.random()*2-1,n=Math.sqrt(1-t*t);return this.x=n*Math.cos(e),this.y=t,this.z=n*Math.sin(e),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z}};Ba.prototype.isVector3=!0;let H=Ba;const ds=new H,po=new wi,za=class za{constructor(e,t,n,r,s,a,o,c,l){this.elements=[1,0,0,0,1,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,c,l)}set(e,t,n,r,s,a,o,c,l){const u=this.elements;return u[0]=e,u[1]=r,u[2]=o,u[3]=t,u[4]=s,u[5]=c,u[6]=n,u[7]=a,u[8]=l,this}identity(){return this.set(1,0,0,0,1,0,0,0,1),this}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],this}extractBasis(e,t,n){return e.setFromMatrix3Column(this,0),t.setFromMatrix3Column(this,1),n.setFromMatrix3Column(this,2),this}setFromMatrix4(e){const t=e.elements;return this.set(t[0],t[4],t[8],t[1],t[5],t[9],t[2],t[6],t[10]),this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[3],c=n[6],l=n[1],u=n[4],f=n[7],d=n[2],h=n[5],_=n[8],S=r[0],m=r[3],p=r[6],M=r[1],w=r[4],b=r[7],R=r[2],A=r[5],g=r[8];return s[0]=a*S+o*M+c*R,s[3]=a*m+o*w+c*A,s[6]=a*p+o*b+c*g,s[1]=l*S+u*M+f*R,s[4]=l*m+u*w+f*A,s[7]=l*p+u*b+f*g,s[2]=d*S+h*M+_*R,s[5]=d*m+h*w+_*A,s[8]=d*p+h*b+_*g,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[3]*=e,t[6]*=e,t[1]*=e,t[4]*=e,t[7]*=e,t[2]*=e,t[5]*=e,t[8]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],u=e[8];return t*a*u-t*o*l-n*s*u+n*o*c+r*s*l-r*a*c}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],u=e[8],f=u*a-o*l,d=o*c-u*s,h=l*s-a*c,_=t*f+n*d+r*h;if(_===0)return this.set(0,0,0,0,0,0,0,0,0);const S=1/_;return e[0]=f*S,e[1]=(r*l-u*n)*S,e[2]=(o*n-r*a)*S,e[3]=d*S,e[4]=(u*t-r*c)*S,e[5]=(r*s-o*t)*S,e[6]=h*S,e[7]=(n*c-l*t)*S,e[8]=(a*t-n*s)*S,this}transpose(){let e;const t=this.elements;return e=t[1],t[1]=t[3],t[3]=e,e=t[2],t[2]=t[6],t[6]=e,e=t[5],t[5]=t[7],t[7]=e,this}getNormalMatrix(e){return this.setFromMatrix4(e).invert().transpose()}transposeIntoArray(e){const t=this.elements;return e[0]=t[0],e[1]=t[3],e[2]=t[6],e[3]=t[1],e[4]=t[4],e[5]=t[7],e[6]=t[2],e[7]=t[5],e[8]=t[8],this}setUvTransform(e,t,n,r,s,a,o){const c=Math.cos(s),l=Math.sin(s);return this.set(n*c,n*l,-n*(c*a+l*o)+a+e,-r*l,r*c,-r*(-l*a+c*o)+o+t,0,0,1),this}scale(e,t){return Ur("Matrix3: .scale() is deprecated. Use .makeScale() instead."),this.premultiply(fs.makeScale(e,t)),this}rotate(e){return Ur("Matrix3: .rotate() is deprecated. Use .makeRotation() instead."),this.premultiply(fs.makeRotation(-e)),this}translate(e,t){return Ur("Matrix3: .translate() is deprecated. Use .makeTranslation() instead."),this.premultiply(fs.makeTranslation(e,t)),this}makeTranslation(e,t){return e.isVector2?this.set(1,0,e.x,0,1,e.y,0,0,1):this.set(1,0,e,0,1,t,0,0,1),this}makeRotation(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,n,t,0,0,0,1),this}makeScale(e,t){return this.set(e,0,0,0,t,0,0,0,1),this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<9;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<9;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e}clone(){return new this.constructor().fromArray(this.elements)}};za.prototype.isMatrix3=!0;let Be=za;const fs=new Be,mo=new Be().set(.4123908,.3575843,.1804808,.212639,.7151687,.0721923,.0193308,.1191948,.9505322),go=new Be().set(3.2409699,-1.5373832,-.4986108,-.9692436,1.8759675,.0415551,.0556301,-.203977,1.0569715);function mu(){const i={enabled:!0,workingColorSpace:Gr,spaces:{},convert:function(r,s,a){return this.enabled===!1||s===a||!s||!a||(this.spaces[s].transfer===rt&&(r.r=Rn(r.r),r.g=Rn(r.g),r.b=Rn(r.b)),this.spaces[s].primaries!==this.spaces[a].primaries&&(r.applyMatrix3(this.spaces[s].toXYZ),r.applyMatrix3(this.spaces[a].fromXYZ)),this.spaces[a].transfer===rt&&(r.r=Mi(r.r),r.g=Mi(r.g),r.b=Mi(r.b))),r},workingToColorSpace:function(r,s){return this.convert(r,this.workingColorSpace,s)},colorSpaceToWorking:function(r,s){return this.convert(r,s,this.workingColorSpace)},getPrimaries:function(r){return this.spaces[r].primaries},getTransfer:function(r){return r===zn?Hr:this.spaces[r].transfer},getToneMappingMode:function(r){return this.spaces[r].outputColorSpaceConfig.toneMappingMode||"standard"},getLuminanceCoefficients:function(r,s=this.workingColorSpace){return r.fromArray(this.spaces[s].luminanceCoefficients)},define:function(r){Object.assign(this.spaces,r)},_getMatrix:function(r,s,a){return r.copy(this.spaces[a].fromXYZ).multiply(this.spaces[s].toXYZ)},_getDrawingBufferColorSpace:function(r){return this.spaces[r].outputColorSpaceConfig.drawingBufferColorSpace},_getUnpackColorSpace:function(r=this.workingColorSpace){return this.spaces[r].workingColorSpaceConfig.unpackColorSpace}},e=[.64,.33,.3,.6,.15,.06],t=[.2126,.7152,.0722],n=[.3127,.329];return i.define({[Gr]:{primaries:e,whitePoint:n,transfer:Hr,toXYZ:mo,fromXYZ:go,luminanceCoefficients:t,workingColorSpaceConfig:{unpackColorSpace:zt},outputColorSpaceConfig:{drawingBufferColorSpace:zt}},[zt]:{primaries:e,whitePoint:n,transfer:rt,toXYZ:mo,fromXYZ:go,luminanceCoefficients:t,outputColorSpaceConfig:{drawingBufferColorSpace:zt}}}),i}const Ye=mu();function Rn(i){return i<.04045?i*.0773993808:Math.pow(i*.9478672986+.0521327014,2.4)}function Mi(i){return i<.0031308?i*12.92:1.055*Math.pow(i,.41666)-.055}let oi;class gu{static getDataURL(e,t="image/png"){if(/^data:/i.test(e.src)||typeof HTMLCanvasElement>"u")return e.src;let n;if(e instanceof HTMLCanvasElement)n=e;else{oi===void 0&&(oi=Vr("canvas")),oi.width=e.width,oi.height=e.height;const r=oi.getContext("2d");e instanceof ImageData?r.putImageData(e,0,0):r.drawImage(e,0,0,e.width,e.height),n=oi}return n.toDataURL(t)}static sRGBToLinear(e){if(typeof HTMLImageElement<"u"&&e instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&e instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&e instanceof ImageBitmap){const t=Vr("canvas");t.width=e.width,t.height=e.height;const n=t.getContext("2d");n.drawImage(e,0,0,e.width,e.height);const r=n.getImageData(0,0,e.width,e.height),s=r.data;for(let a=0;a<s.length;a++)s[a]=Rn(s[a]/255)*255;return n.putImageData(r,0,0),t}else if(e.data){const t=e.data.slice(0);for(let n=0;n<t.length;n++)t instanceof Uint8Array||t instanceof Uint8ClampedArray?t[n]=Math.floor(Rn(t[n]/255)*255):t[n]=Rn(t[n]);return{data:t,width:e.width,height:e.height}}else return Ue("ImageUtils.sRGBToLinear(): Unsupported image type. No color space conversion applied."),e}}let _u=0;class Na{constructor(e=null){this.isTextureSource=!0,Object.defineProperty(this,"id",{value:_u++}),this.uuid=Yi(),this.data=e,this.dataReady=!0,this.version=0}getSize(e){const t=this.data;return typeof HTMLVideoElement<"u"&&t instanceof HTMLVideoElement?e.set(t.videoWidth,t.videoHeight,0):typeof VideoFrame<"u"&&t instanceof VideoFrame?e.set(t.displayWidth,t.displayHeight,0):t!==null?e.set(t.width||0,t.height||0,t.depth||0):e.set(0,0,0),e}set needsUpdate(e){e===!0&&this.version++}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.images[this.uuid]!==void 0)return e.images[this.uuid];const n={uuid:this.uuid,url:""},r=this.data;if(r!==null){let s;if(Array.isArray(r)){s=[];for(let a=0,o=r.length;a<o;a++)r[a].isDataTexture?s.push(ps(r[a].image)):s.push(ps(r[a]))}else s=ps(r);n.url=s}return t||(e.images[this.uuid]=n),n}}function ps(i){return typeof HTMLImageElement<"u"&&i instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&i instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&i instanceof ImageBitmap?gu.getDataURL(i):i.data?{data:Array.from(i.data),width:i.width,height:i.height,type:i.data.constructor.name}:(Ue("Texture: Unable to serialize Texture."),{})}let xu=0;const ms=new H;class It extends si{constructor(e=It.DEFAULT_IMAGE,t=It.DEFAULT_MAPPING,n=An,r=An,s=Vt,a=Hn,o=fn,c=Jt,l=It.DEFAULT_ANISOTROPY,u=zn){super(),this.isTexture=!0,Object.defineProperty(this,"id",{value:xu++}),this.uuid=Yi(),this.name="",this.source=new Na(e),this.mipmaps=[],this.mapping=t,this.channel=0,this.wrapS=n,this.wrapT=r,this.magFilter=s,this.minFilter=a,this.anisotropy=l,this.format=o,this.internalFormat=null,this.type=c,this.offset=new Ze(0,0),this.repeat=new Ze(1,1),this.center=new Ze(0,0),this.rotation=0,this.matrixAutoUpdate=!0,this.matrix=new Be,this.generateMipmaps=!0,this.mipmapsAutoUpdate=!0,this.premultiplyAlpha=!1,this.flipY=!0,this.unpackAlignment=4,this.colorSpace=u,this.userData={},this.updateRanges=[],this.version=0,this.onUpdate=null,this.renderTarget=null,this.isRenderTargetTexture=!1,this.isArrayTexture=!!(e&&e.depth&&e.depth>1),this.pmremVersion=0,this.isPMREMTexture=!1,this.normalized=!1}get width(){return this.source.getSize(ms).x}get height(){return this.source.getSize(ms).y}get depth(){return this.source.getSize(ms).z}get image(){return this.source.data}set image(e){this.source.data=e}updateMatrix(){this.matrix.setUvTransform(this.offset.x,this.offset.y,this.repeat.x,this.repeat.y,this.rotation,this.center.x,this.center.y)}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}clone(){return new this.constructor().copy(this)}copy(e){return this.name=e.name,this.source=e.source,this.mipmaps=e.mipmaps.slice(0),this.mapping=e.mapping,this.channel=e.channel,this.wrapS=e.wrapS,this.wrapT=e.wrapT,this.magFilter=e.magFilter,this.minFilter=e.minFilter,this.anisotropy=e.anisotropy,this.format=e.format,this.internalFormat=e.internalFormat,this.type=e.type,this.normalized=e.normalized,this.offset.copy(e.offset),this.repeat.copy(e.repeat),this.center.copy(e.center),this.rotation=e.rotation,this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrix.copy(e.matrix),this.generateMipmaps=e.generateMipmaps,this.mipmapsAutoUpdate=e.mipmapsAutoUpdate,this.premultiplyAlpha=e.premultiplyAlpha,this.flipY=e.flipY,this.unpackAlignment=e.unpackAlignment,this.colorSpace=e.colorSpace,this.renderTarget=e.renderTarget,this.isRenderTargetTexture=e.isRenderTargetTexture,this.isPMREMTexture=e.isPMREMTexture,this.isArrayTexture=e.isArrayTexture,this.userData=JSON.parse(JSON.stringify(e.userData)),this.needsUpdate=!0,this}setValues(e){for(const t in e){const n=e[t];if(n===void 0){Ue(`Texture.setValues(): parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ue(`Texture.setValues(): property '${t}' does not exist.`);continue}r&&n&&r.isVector2&&n.isVector2||r&&n&&r.isVector3&&n.isVector3||r&&n&&r.isMatrix3&&n.isMatrix3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";if(!t&&e.textures[this.uuid]!==void 0)return e.textures[this.uuid];const n={metadata:{version:4.7,type:"Texture",generator:"Texture.toJSON"},uuid:this.uuid,name:this.name,image:this.source.toJSON(e).uuid,mapping:this.mapping,channel:this.channel,repeat:[this.repeat.x,this.repeat.y],offset:[this.offset.x,this.offset.y],center:[this.center.x,this.center.y],rotation:this.rotation,wrap:[this.wrapS,this.wrapT],format:this.format,internalFormat:this.internalFormat,type:this.type,normalized:this.normalized,colorSpace:this.colorSpace,minFilter:this.minFilter,magFilter:this.magFilter,anisotropy:this.anisotropy,flipY:this.flipY,generateMipmaps:this.generateMipmaps,mipmapsAutoUpdate:this.mipmapsAutoUpdate,premultiplyAlpha:this.premultiplyAlpha,unpackAlignment:this.unpackAlignment};return Object.keys(this.userData).length>0&&(n.userData=this.userData),t||(e.textures[this.uuid]=n),n}dispose(){this.dispatchEvent({type:"dispose"})}transformUv(e){if(this.mapping!==ml)return e;if(e.applyMatrix3(this.matrix),e.x<0||e.x>1)switch(this.wrapS){case Xs:e.x=e.x-Math.floor(e.x);break;case An:e.x=e.x<0?0:1;break;case qs:Math.abs(Math.floor(e.x)%2)===1?e.x=Math.ceil(e.x)-e.x:e.x=e.x-Math.floor(e.x);break}if(e.y<0||e.y>1)switch(this.wrapT){case Xs:e.y=e.y-Math.floor(e.y);break;case An:e.y=e.y<0?0:1;break;case qs:Math.abs(Math.floor(e.y)%2)===1?e.y=Math.ceil(e.y)-e.y:e.y=e.y-Math.floor(e.y);break}return this.flipY&&(e.y=1-e.y),e}set needsUpdate(e){e===!0&&(this.version++,this.source.needsUpdate=!0)}set needsPMREMUpdate(e){e===!0&&this.pmremVersion++}}It.DEFAULT_IMAGE=null;It.DEFAULT_MAPPING=ml;It.DEFAULT_ANISOTROPY=1;const Ga=class Ga{constructor(e=0,t=0,n=0,r=1){this.x=e,this.y=t,this.z=n,this.w=r}get width(){return this.z}set width(e){this.z=e}get height(){return this.w}set height(e){this.w=e}set(e,t,n,r){return this.x=e,this.y=t,this.z=n,this.w=r,this}setScalar(e){return this.x=e,this.y=e,this.z=e,this.w=e,this}setX(e){return this.x=e,this}setY(e){return this.y=e,this}setZ(e){return this.z=e,this}setW(e){return this.w=e,this}setComponent(e,t){switch(e){case 0:this.x=t;break;case 1:this.y=t;break;case 2:this.z=t;break;case 3:this.w=t;break;default:throw new Error("THREE.Vector4: index is out of range: "+e)}return this}getComponent(e){switch(e){case 0:return this.x;case 1:return this.y;case 2:return this.z;case 3:return this.w;default:throw new Error("THREE.Vector4: index is out of range: "+e)}}clone(){return new this.constructor(this.x,this.y,this.z,this.w)}copy(e){return this.x=e.x,this.y=e.y,this.z=e.z,this.w=e.w!==void 0?e.w:1,this}add(e){return this.x+=e.x,this.y+=e.y,this.z+=e.z,this.w+=e.w,this}addScalar(e){return this.x+=e,this.y+=e,this.z+=e,this.w+=e,this}addVectors(e,t){return this.x=e.x+t.x,this.y=e.y+t.y,this.z=e.z+t.z,this.w=e.w+t.w,this}addScaledVector(e,t){return this.x+=e.x*t,this.y+=e.y*t,this.z+=e.z*t,this.w+=e.w*t,this}sub(e){return this.x-=e.x,this.y-=e.y,this.z-=e.z,this.w-=e.w,this}subScalar(e){return this.x-=e,this.y-=e,this.z-=e,this.w-=e,this}subVectors(e,t){return this.x=e.x-t.x,this.y=e.y-t.y,this.z=e.z-t.z,this.w=e.w-t.w,this}multiply(e){return this.x*=e.x,this.y*=e.y,this.z*=e.z,this.w*=e.w,this}multiplyScalar(e){return this.x*=e,this.y*=e,this.z*=e,this.w*=e,this}applyMatrix4(e){const t=this.x,n=this.y,r=this.z,s=this.w,a=e.elements;return this.x=a[0]*t+a[4]*n+a[8]*r+a[12]*s,this.y=a[1]*t+a[5]*n+a[9]*r+a[13]*s,this.z=a[2]*t+a[6]*n+a[10]*r+a[14]*s,this.w=a[3]*t+a[7]*n+a[11]*r+a[15]*s,this}divide(e){return this.x/=e.x,this.y/=e.y,this.z/=e.z,this.w/=e.w,this}divideScalar(e){return this.multiplyScalar(1/e)}setAxisAngleFromQuaternion(e){this.w=2*Math.acos(e.w);const t=Math.sqrt(1-e.w*e.w);return t<1e-4?(this.x=1,this.y=0,this.z=0):(this.x=e.x/t,this.y=e.y/t,this.z=e.z/t),this}setAxisAngleFromRotationMatrix(e){let t,n,r,s;const c=e.elements,l=c[0],u=c[4],f=c[8],d=c[1],h=c[5],_=c[9],S=c[2],m=c[6],p=c[10];if(Math.abs(u-d)<.01&&Math.abs(f-S)<.01&&Math.abs(_-m)<.01){if(Math.abs(u+d)<.1&&Math.abs(f+S)<.1&&Math.abs(_+m)<.1&&Math.abs(l+h+p-3)<.1)return this.set(1,0,0,0),this;t=Math.PI;const w=(l+1)/2,b=(h+1)/2,R=(p+1)/2,A=(u+d)/4,g=(f+S)/4,y=(_+m)/4;return w>b&&w>R?w<.01?(n=0,r=.707106781,s=.707106781):(n=Math.sqrt(w),r=A/n,s=g/n):b>R?b<.01?(n=.707106781,r=0,s=.707106781):(r=Math.sqrt(b),n=A/r,s=y/r):R<.01?(n=.707106781,r=.707106781,s=0):(s=Math.sqrt(R),n=g/s,r=y/s),this.set(n,r,s,t),this}let M=Math.sqrt((m-_)*(m-_)+(f-S)*(f-S)+(d-u)*(d-u));return Math.abs(M)<.001&&(M=1),this.x=(m-_)/M,this.y=(f-S)/M,this.z=(d-u)/M,this.w=Math.acos((l+h+p-1)/2),this}setFromMatrixPosition(e){const t=e.elements;return this.x=t[12],this.y=t[13],this.z=t[14],this.w=t[15],this}min(e){return this.x=Math.min(this.x,e.x),this.y=Math.min(this.y,e.y),this.z=Math.min(this.z,e.z),this.w=Math.min(this.w,e.w),this}max(e){return this.x=Math.max(this.x,e.x),this.y=Math.max(this.y,e.y),this.z=Math.max(this.z,e.z),this.w=Math.max(this.w,e.w),this}clamp(e,t){return this.x=Ke(this.x,e.x,t.x),this.y=Ke(this.y,e.y,t.y),this.z=Ke(this.z,e.z,t.z),this.w=Ke(this.w,e.w,t.w),this}clampScalar(e,t){return this.x=Ke(this.x,e,t),this.y=Ke(this.y,e,t),this.z=Ke(this.z,e,t),this.w=Ke(this.w,e,t),this}clampLength(e,t){const n=this.length();return this.divideScalar(n||1).multiplyScalar(Ke(n,e,t))}floor(){return this.x=Math.floor(this.x),this.y=Math.floor(this.y),this.z=Math.floor(this.z),this.w=Math.floor(this.w),this}ceil(){return this.x=Math.ceil(this.x),this.y=Math.ceil(this.y),this.z=Math.ceil(this.z),this.w=Math.ceil(this.w),this}round(){return this.x=Math.round(this.x),this.y=Math.round(this.y),this.z=Math.round(this.z),this.w=Math.round(this.w),this}roundToZero(){return this.x=Math.trunc(this.x),this.y=Math.trunc(this.y),this.z=Math.trunc(this.z),this.w=Math.trunc(this.w),this}negate(){return this.x=-this.x,this.y=-this.y,this.z=-this.z,this.w=-this.w,this}dot(e){return this.x*e.x+this.y*e.y+this.z*e.z+this.w*e.w}lengthSq(){return this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w}length(){return Math.sqrt(this.x*this.x+this.y*this.y+this.z*this.z+this.w*this.w)}manhattanLength(){return Math.abs(this.x)+Math.abs(this.y)+Math.abs(this.z)+Math.abs(this.w)}normalize(){return this.divideScalar(this.length()||1)}setLength(e){return this.normalize().multiplyScalar(e)}lerp(e,t){return this.x+=(e.x-this.x)*t,this.y+=(e.y-this.y)*t,this.z+=(e.z-this.z)*t,this.w+=(e.w-this.w)*t,this}lerpVectors(e,t,n){return this.x=e.x+(t.x-e.x)*n,this.y=e.y+(t.y-e.y)*n,this.z=e.z+(t.z-e.z)*n,this.w=e.w+(t.w-e.w)*n,this}equals(e){return e.x===this.x&&e.y===this.y&&e.z===this.z&&e.w===this.w}fromArray(e,t=0){return this.x=e[t],this.y=e[t+1],this.z=e[t+2],this.w=e[t+3],this}toArray(e=[],t=0){return e[t]=this.x,e[t+1]=this.y,e[t+2]=this.z,e[t+3]=this.w,e}fromBufferAttribute(e,t){return this.x=e.getX(t),this.y=e.getY(t),this.z=e.getZ(t),this.w=e.getW(t),this}random(){return this.x=Math.random(),this.y=Math.random(),this.z=Math.random(),this.w=Math.random(),this}*[Symbol.iterator](){yield this.x,yield this.y,yield this.z,yield this.w}};Ga.prototype.isVector4=!0;let ft=Ga;class vu extends si{constructor(e=1,t=1,n={}){super(),n=Object.assign({generateMipmaps:!1,internalFormat:null,minFilter:Vt,depthBuffer:!0,stencilBuffer:!1,resolveColorBuffer:!0,resolveDepthBuffer:!0,resolveStencilBuffer:!0,storeMultisampledColorBuffer:!0,storeMultisampledDepthBuffer:!0,storeMultisampledStencilBuffer:!0,depthTexture:null,samples:0,count:1,depth:1,multiview:!1,useArrayDepthTexture:!1},n),this.isRenderTarget=!0,this.width=e,this.height=t,this.depth=n.depth,this.scissor=new ft(0,0,e,t),this.scissorTest=!1,this.viewport=new ft(0,0,e,t),this.textures=[];const r=n.count;for(let s=0;s<r;s++)this.textures[s]=new It({width:e,height:t,depth:n.depth}),this.textures[s].isRenderTargetTexture=!0,this.textures[s].renderTarget=this;this._setTextureOptions(n),this.depthBuffer=n.depthBuffer,this.stencilBuffer=n.stencilBuffer,this.resolveColorBuffer=n.resolveColorBuffer,this.resolveDepthBuffer=n.resolveDepthBuffer,this.resolveStencilBuffer=n.resolveStencilBuffer,this.storeMultisampledColorBuffer=n.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=n.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=n.storeMultisampledStencilBuffer,this._depthTexture=null,this.depthTexture=n.depthTexture,this.samples=n.samples,this.multiview=n.multiview,this.useArrayDepthTexture=n.useArrayDepthTexture}_setTextureOptions(e={}){const t={minFilter:Vt,generateMipmaps:!1,flipY:!1,internalFormat:null};e.mapping!==void 0&&(t.mapping=e.mapping),e.wrapS!==void 0&&(t.wrapS=e.wrapS),e.wrapT!==void 0&&(t.wrapT=e.wrapT),e.wrapR!==void 0&&(t.wrapR=e.wrapR),e.magFilter!==void 0&&(t.magFilter=e.magFilter),e.minFilter!==void 0&&(t.minFilter=e.minFilter),e.format!==void 0&&(t.format=e.format),e.type!==void 0&&(t.type=e.type),e.anisotropy!==void 0&&(t.anisotropy=e.anisotropy),e.colorSpace!==void 0&&(t.colorSpace=e.colorSpace),e.flipY!==void 0&&(t.flipY=e.flipY),e.generateMipmaps!==void 0&&(t.generateMipmaps=e.generateMipmaps),e.mipmapsAutoUpdate!==void 0&&(t.mipmapsAutoUpdate=e.mipmapsAutoUpdate),e.internalFormat!==void 0&&(t.internalFormat=e.internalFormat);for(let n=0;n<this.textures.length;n++)this.textures[n].setValues(t)}get texture(){return this.textures[0]}set texture(e){this.textures[0]=e}set depthTexture(e){this._depthTexture!==null&&this._depthTexture.renderTarget===this&&(this._depthTexture.renderTarget=null),e!==null&&e.renderTarget===null&&(e.renderTarget=this),this._depthTexture=e}get depthTexture(){return this._depthTexture}setSize(e,t,n=1){if(this.width!==e||this.height!==t||this.depth!==n){this.width=e,this.height=t,this.depth=n;for(let r=0,s=this.textures.length;r<s;r++)this.textures[r].image.width=e,this.textures[r].image.height=t,this.textures[r].image.depth=n,this.textures[r].isData3DTexture!==!0&&(this.textures[r].isArrayTexture=this.textures[r].image.depth>1);this.dispose()}this.viewport.set(0,0,e,t),this.scissor.set(0,0,e,t)}clone(){return new this.constructor().copy(this)}copy(e){this.width=e.width,this.height=e.height,this.depth=e.depth,this.scissor.copy(e.scissor),this.scissorTest=e.scissorTest,this.viewport.copy(e.viewport),this.textures.length=0;for(let t=0,n=e.textures.length;t<n;t++){this.textures[t]=e.textures[t].clone(),this.textures[t].isRenderTargetTexture=!0,this.textures[t].renderTarget=this;const r=Object.assign({},e.textures[t].image);this.textures[t].source=new Na(r)}if(this.depthBuffer=e.depthBuffer,this.stencilBuffer=e.stencilBuffer,this.resolveColorBuffer=e.resolveColorBuffer,this.resolveDepthBuffer=e.resolveDepthBuffer,this.resolveStencilBuffer=e.resolveStencilBuffer,this.storeMultisampledColorBuffer=e.storeMultisampledColorBuffer,this.storeMultisampledDepthBuffer=e.storeMultisampledDepthBuffer,this.storeMultisampledStencilBuffer=e.storeMultisampledStencilBuffer,e.depthTexture!==null)if(e.depthTexture.renderTarget===e){const t=e.depthTexture.clone();t.renderTarget=null,this.depthTexture=t}else this.depthTexture=e.depthTexture;else this.depthTexture=null;return this.samples=e.samples,this.multiview=e.multiview,this.useArrayDepthTexture=e.useArrayDepthTexture,this}dispose(){this.dispatchEvent({type:"dispose"})}}class pn extends vu{constructor(e=1,t=1,n={}){super(e,t,n),this.isWebGLRenderTarget=!0}}class wl extends It{constructor(e=null,t=1,n=1,r=1){super(null),this.isDataArrayTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=An,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1,this.layerUpdates=new Set}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}addLayerUpdate(e){this.layerUpdates.add(e)}clearLayerUpdates(){this.layerUpdates.clear()}}class Su extends It{constructor(e=null,t=1,n=1,r=1){super(null),this.isData3DTexture=!0,this.image={data:e,width:t,height:n,depth:r},this.magFilter=Rt,this.minFilter=Rt,this.wrapR=An,this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}copy(e){return super.copy(e),this.wrapR=e.wrapR,this}}const $r=class $r{constructor(e,t,n,r,s,a,o,c,l,u,f,d,h,_,S,m){this.elements=[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1],e!==void 0&&this.set(e,t,n,r,s,a,o,c,l,u,f,d,h,_,S,m)}set(e,t,n,r,s,a,o,c,l,u,f,d,h,_,S,m){const p=this.elements;return p[0]=e,p[4]=t,p[8]=n,p[12]=r,p[1]=s,p[5]=a,p[9]=o,p[13]=c,p[2]=l,p[6]=u,p[10]=f,p[14]=d,p[3]=h,p[7]=_,p[11]=S,p[15]=m,this}identity(){return this.set(1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1),this}clone(){return new $r().fromArray(this.elements)}copy(e){const t=this.elements,n=e.elements;return t[0]=n[0],t[1]=n[1],t[2]=n[2],t[3]=n[3],t[4]=n[4],t[5]=n[5],t[6]=n[6],t[7]=n[7],t[8]=n[8],t[9]=n[9],t[10]=n[10],t[11]=n[11],t[12]=n[12],t[13]=n[13],t[14]=n[14],t[15]=n[15],this}copyPosition(e){const t=this.elements,n=e.elements;return t[12]=n[12],t[13]=n[13],t[14]=n[14],this}setFromMatrix3(e){const t=e.elements;return this.set(t[0],t[3],t[6],0,t[1],t[4],t[7],0,t[2],t[5],t[8],0,0,0,0,1),this}extractBasis(e,t,n){return this.determinantAffine()===0?(e.set(1,0,0),t.set(0,1,0),n.set(0,0,1),this):(e.setFromMatrixColumn(this,0),t.setFromMatrixColumn(this,1),n.setFromMatrixColumn(this,2),this)}makeBasis(e,t,n){return this.set(e.x,t.x,n.x,0,e.y,t.y,n.y,0,e.z,t.z,n.z,0,0,0,0,1),this}extractRotation(e){if(e.determinantAffine()===0)return this.identity();const t=this.elements,n=e.elements,r=1/li.setFromMatrixColumn(e,0).length(),s=1/li.setFromMatrixColumn(e,1).length(),a=1/li.setFromMatrixColumn(e,2).length();return t[0]=n[0]*r,t[1]=n[1]*r,t[2]=n[2]*r,t[3]=0,t[4]=n[4]*s,t[5]=n[5]*s,t[6]=n[6]*s,t[7]=0,t[8]=n[8]*a,t[9]=n[9]*a,t[10]=n[10]*a,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromEuler(e){const t=this.elements,n=e.x,r=e.y,s=e.z,a=Math.cos(n),o=Math.sin(n),c=Math.cos(r),l=Math.sin(r),u=Math.cos(s),f=Math.sin(s);if(e.order==="XYZ"){const d=a*u,h=a*f,_=o*u,S=o*f;t[0]=c*u,t[4]=-c*f,t[8]=l,t[1]=h+_*l,t[5]=d-S*l,t[9]=-o*c,t[2]=S-d*l,t[6]=_+h*l,t[10]=a*c}else if(e.order==="YXZ"){const d=c*u,h=c*f,_=l*u,S=l*f;t[0]=d+S*o,t[4]=_*o-h,t[8]=a*l,t[1]=a*f,t[5]=a*u,t[9]=-o,t[2]=h*o-_,t[6]=S+d*o,t[10]=a*c}else if(e.order==="ZXY"){const d=c*u,h=c*f,_=l*u,S=l*f;t[0]=d-S*o,t[4]=-a*f,t[8]=_+h*o,t[1]=h+_*o,t[5]=a*u,t[9]=S-d*o,t[2]=-a*l,t[6]=o,t[10]=a*c}else if(e.order==="ZYX"){const d=a*u,h=a*f,_=o*u,S=o*f;t[0]=c*u,t[4]=_*l-h,t[8]=d*l+S,t[1]=c*f,t[5]=S*l+d,t[9]=h*l-_,t[2]=-l,t[6]=o*c,t[10]=a*c}else if(e.order==="YZX"){const d=a*c,h=a*l,_=o*c,S=o*l;t[0]=c*u,t[4]=S-d*f,t[8]=_*f+h,t[1]=f,t[5]=a*u,t[9]=-o*u,t[2]=-l*u,t[6]=h*f+_,t[10]=d-S*f}else if(e.order==="XZY"){const d=a*c,h=a*l,_=o*c,S=o*l;t[0]=c*u,t[4]=-f,t[8]=l*u,t[1]=d*f+S,t[5]=a*u,t[9]=h*f-_,t[2]=_*f-h,t[6]=o*u,t[10]=S*f+d}return t[3]=0,t[7]=0,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,this}makeRotationFromQuaternion(e){return this.compose(Mu,e,Eu)}lookAt(e,t,n){const r=this.elements;return qt.subVectors(e,t),qt.lengthSq()===0&&(qt.z=1),qt.normalize(),Ln.crossVectors(n,qt),Ln.lengthSq()===0&&(Math.abs(n.z)===1?qt.x+=1e-4:qt.z+=1e-4,qt.normalize(),Ln.crossVectors(n,qt)),Ln.normalize(),ar.crossVectors(qt,Ln),r[0]=Ln.x,r[4]=ar.x,r[8]=qt.x,r[1]=Ln.y,r[5]=ar.y,r[9]=qt.y,r[2]=Ln.z,r[6]=ar.z,r[10]=qt.z,this}multiply(e){return this.multiplyMatrices(this,e)}premultiply(e){return this.multiplyMatrices(e,this)}multiplyMatrices(e,t){const n=e.elements,r=t.elements,s=this.elements,a=n[0],o=n[4],c=n[8],l=n[12],u=n[1],f=n[5],d=n[9],h=n[13],_=n[2],S=n[6],m=n[10],p=n[14],M=n[3],w=n[7],b=n[11],R=n[15],A=r[0],g=r[4],y=r[8],z=r[12],D=r[1],U=r[5],G=r[9],K=r[13],P=r[2],Y=r[6],Z=r[10],X=r[14],ie=r[3],q=r[7],j=r[11],ee=r[15];return s[0]=a*A+o*D+c*P+l*ie,s[4]=a*g+o*U+c*Y+l*q,s[8]=a*y+o*G+c*Z+l*j,s[12]=a*z+o*K+c*X+l*ee,s[1]=u*A+f*D+d*P+h*ie,s[5]=u*g+f*U+d*Y+h*q,s[9]=u*y+f*G+d*Z+h*j,s[13]=u*z+f*K+d*X+h*ee,s[2]=_*A+S*D+m*P+p*ie,s[6]=_*g+S*U+m*Y+p*q,s[10]=_*y+S*G+m*Z+p*j,s[14]=_*z+S*K+m*X+p*ee,s[3]=M*A+w*D+b*P+R*ie,s[7]=M*g+w*U+b*Y+R*q,s[11]=M*y+w*G+b*Z+R*j,s[15]=M*z+w*K+b*X+R*ee,this}multiplyScalar(e){const t=this.elements;return t[0]*=e,t[4]*=e,t[8]*=e,t[12]*=e,t[1]*=e,t[5]*=e,t[9]*=e,t[13]*=e,t[2]*=e,t[6]*=e,t[10]*=e,t[14]*=e,t[3]*=e,t[7]*=e,t[11]*=e,t[15]*=e,this}determinant(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[12],a=e[1],o=e[5],c=e[9],l=e[13],u=e[2],f=e[6],d=e[10],h=e[14],_=e[3],S=e[7],m=e[11],p=e[15],M=c*h-l*d,w=o*h-l*f,b=o*d-c*f,R=a*h-l*u,A=a*d-c*u,g=a*f-o*u;return t*(S*M-m*w+p*b)-n*(_*M-m*R+p*A)+r*(_*w-S*R+p*g)-s*(_*b-S*A+m*g)}determinantAffine(){const e=this.elements,t=e[0],n=e[4],r=e[8],s=e[1],a=e[5],o=e[9],c=e[2],l=e[6],u=e[10];return t*(a*u-o*l)-n*(s*u-o*c)+r*(s*l-a*c)}transpose(){const e=this.elements;let t;return t=e[1],e[1]=e[4],e[4]=t,t=e[2],e[2]=e[8],e[8]=t,t=e[6],e[6]=e[9],e[9]=t,t=e[3],e[3]=e[12],e[12]=t,t=e[7],e[7]=e[13],e[13]=t,t=e[11],e[11]=e[14],e[14]=t,this}setPosition(e,t,n){const r=this.elements;return e.isVector3?(r[12]=e.x,r[13]=e.y,r[14]=e.z):(r[12]=e,r[13]=t,r[14]=n),this}invert(){const e=this.elements,t=e[0],n=e[1],r=e[2],s=e[3],a=e[4],o=e[5],c=e[6],l=e[7],u=e[8],f=e[9],d=e[10],h=e[11],_=e[12],S=e[13],m=e[14],p=e[15],M=t*o-n*a,w=t*c-r*a,b=t*l-s*a,R=n*c-r*o,A=n*l-s*o,g=r*l-s*c,y=u*S-f*_,z=u*m-d*_,D=u*p-h*_,U=f*m-d*S,G=f*p-h*S,K=d*p-h*m,P=M*K-w*G+b*U+R*D-A*z+g*y;if(P===0)return this.set(0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);const Y=1/P;return e[0]=(o*K-c*G+l*U)*Y,e[1]=(r*G-n*K-s*U)*Y,e[2]=(S*g-m*A+p*R)*Y,e[3]=(d*A-f*g-h*R)*Y,e[4]=(c*D-a*K-l*z)*Y,e[5]=(t*K-r*D+s*z)*Y,e[6]=(m*b-_*g-p*w)*Y,e[7]=(u*g-d*b+h*w)*Y,e[8]=(a*G-o*D+l*y)*Y,e[9]=(n*D-t*G-s*y)*Y,e[10]=(_*A-S*b+p*M)*Y,e[11]=(f*b-u*A-h*M)*Y,e[12]=(o*z-a*U-c*y)*Y,e[13]=(t*U-n*z+r*y)*Y,e[14]=(S*w-_*R-m*M)*Y,e[15]=(u*R-f*w+d*M)*Y,this}scale(e){const t=this.elements,n=e.x,r=e.y,s=e.z;return t[0]*=n,t[4]*=r,t[8]*=s,t[1]*=n,t[5]*=r,t[9]*=s,t[2]*=n,t[6]*=r,t[10]*=s,t[3]*=n,t[7]*=r,t[11]*=s,this}getMaxScaleOnAxis(){const e=this.elements,t=e[0]*e[0]+e[1]*e[1]+e[2]*e[2],n=e[4]*e[4]+e[5]*e[5]+e[6]*e[6],r=e[8]*e[8]+e[9]*e[9]+e[10]*e[10];return Math.sqrt(Math.max(t,n,r))}makeTranslation(e,t,n){return e.isVector3?this.set(1,0,0,e.x,0,1,0,e.y,0,0,1,e.z,0,0,0,1):this.set(1,0,0,e,0,1,0,t,0,0,1,n,0,0,0,1),this}makeRotationX(e){const t=Math.cos(e),n=Math.sin(e);return this.set(1,0,0,0,0,t,-n,0,0,n,t,0,0,0,0,1),this}makeRotationY(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,0,n,0,0,1,0,0,-n,0,t,0,0,0,0,1),this}makeRotationZ(e){const t=Math.cos(e),n=Math.sin(e);return this.set(t,-n,0,0,n,t,0,0,0,0,1,0,0,0,0,1),this}makeRotationAxis(e,t){const n=Math.cos(t),r=Math.sin(t),s=1-n,a=e.x,o=e.y,c=e.z,l=s*a,u=s*o;return this.set(l*a+n,l*o-r*c,l*c+r*o,0,l*o+r*c,u*o+n,u*c-r*a,0,l*c-r*o,u*c+r*a,s*c*c+n,0,0,0,0,1),this}makeScale(e,t,n){return this.set(e,0,0,0,0,t,0,0,0,0,n,0,0,0,0,1),this}makeShear(e,t,n,r,s,a){return this.set(1,n,s,0,e,1,a,0,t,r,1,0,0,0,0,1),this}compose(e,t,n){const r=this.elements,s=t._x,a=t._y,o=t._z,c=t._w,l=s+s,u=a+a,f=o+o,d=s*l,h=s*u,_=s*f,S=a*u,m=a*f,p=o*f,M=c*l,w=c*u,b=c*f,R=n.x,A=n.y,g=n.z;return r[0]=(1-(S+p))*R,r[1]=(h+b)*R,r[2]=(_-w)*R,r[3]=0,r[4]=(h-b)*A,r[5]=(1-(d+p))*A,r[6]=(m+M)*A,r[7]=0,r[8]=(_+w)*g,r[9]=(m-M)*g,r[10]=(1-(d+S))*g,r[11]=0,r[12]=e.x,r[13]=e.y,r[14]=e.z,r[15]=1,this}decompose(e,t,n){const r=this.elements;e.x=r[12],e.y=r[13],e.z=r[14];const s=this.determinantAffine();if(s===0)return n.set(1,1,1),t.identity(),this;let a=li.set(r[0],r[1],r[2]).length();const o=li.set(r[4],r[5],r[6]).length(),c=li.set(r[8],r[9],r[10]).length();s<0&&(a=-a),en.copy(this);const l=1/a,u=1/o,f=1/c;return en.elements[0]*=l,en.elements[1]*=l,en.elements[2]*=l,en.elements[4]*=u,en.elements[5]*=u,en.elements[6]*=u,en.elements[8]*=f,en.elements[9]*=f,en.elements[10]*=f,t.setFromRotationMatrix(en),n.x=a,n.y=o,n.z=c,this}makePerspective(e,t,n,r,s,a,o=an,c=!1){const l=this.elements,u=2*s/(t-e),f=2*s/(n-r),d=(t+e)/(t-e),h=(n+r)/(n-r);let _,S;if(c)_=s/(a-s),S=a*s/(a-s);else if(o===an)_=-(a+s)/(a-s),S=-2*a*s/(a-s);else if(o===kr)_=-a/(a-s),S=-a*s/(a-s);else throw new Error("THREE.Matrix4.makePerspective(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=d,l[12]=0,l[1]=0,l[5]=f,l[9]=h,l[13]=0,l[2]=0,l[6]=0,l[10]=_,l[14]=S,l[3]=0,l[7]=0,l[11]=-1,l[15]=0,this}makeOrthographic(e,t,n,r,s,a,o=an,c=!1){const l=this.elements,u=2/(t-e),f=2/(n-r),d=-(t+e)/(t-e),h=-(n+r)/(n-r);let _,S;if(c)_=1/(a-s),S=a/(a-s);else if(o===an)_=-2/(a-s),S=-(a+s)/(a-s);else if(o===kr)_=-1/(a-s),S=-s/(a-s);else throw new Error("THREE.Matrix4.makeOrthographic(): Invalid coordinate system: "+o);return l[0]=u,l[4]=0,l[8]=0,l[12]=d,l[1]=0,l[5]=f,l[9]=0,l[13]=h,l[2]=0,l[6]=0,l[10]=_,l[14]=S,l[3]=0,l[7]=0,l[11]=0,l[15]=1,this}equals(e){const t=this.elements,n=e.elements;for(let r=0;r<16;r++)if(t[r]!==n[r])return!1;return!0}fromArray(e,t=0){for(let n=0;n<16;n++)this.elements[n]=e[n+t];return this}toArray(e=[],t=0){const n=this.elements;return e[t]=n[0],e[t+1]=n[1],e[t+2]=n[2],e[t+3]=n[3],e[t+4]=n[4],e[t+5]=n[5],e[t+6]=n[6],e[t+7]=n[7],e[t+8]=n[8],e[t+9]=n[9],e[t+10]=n[10],e[t+11]=n[11],e[t+12]=n[12],e[t+13]=n[13],e[t+14]=n[14],e[t+15]=n[15],e}};$r.prototype.isMatrix4=!0;let pt=$r;const li=new H,en=new pt,Mu=new H(0,0,0),Eu=new H(1,1,1),Ln=new H,ar=new H,qt=new H,_o=new pt,xo=new wi;class ii{constructor(e=0,t=0,n=0,r=ii.DEFAULT_ORDER){this.isEuler=!0,this._x=e,this._y=t,this._z=n,this._order=r}get x(){return this._x}set x(e){this._x=e,this._onChangeCallback()}get y(){return this._y}set y(e){this._y=e,this._onChangeCallback()}get z(){return this._z}set z(e){this._z=e,this._onChangeCallback()}get order(){return this._order}set order(e){this._order=e,this._onChangeCallback()}set(e,t,n,r=this._order){return this._x=e,this._y=t,this._z=n,this._order=r,this._onChangeCallback(),this}clone(){return new this.constructor(this._x,this._y,this._z,this._order)}copy(e){return this._x=e._x,this._y=e._y,this._z=e._z,this._order=e._order,this._onChangeCallback(),this}setFromRotationMatrix(e,t=this._order,n=!0){const r=e.elements,s=r[0],a=r[4],o=r[8],c=r[1],l=r[5],u=r[9],f=r[2],d=r[6],h=r[10];switch(t){case"XYZ":this._y=Math.asin(Ke(o,-1,1)),Math.abs(o)<.9999999?(this._x=Math.atan2(-u,h),this._z=Math.atan2(-a,s)):(this._x=Math.atan2(d,l),this._z=0);break;case"YXZ":this._x=Math.asin(-Ke(u,-1,1)),Math.abs(u)<.9999999?(this._y=Math.atan2(o,h),this._z=Math.atan2(c,l)):(this._y=Math.atan2(-f,s),this._z=0);break;case"ZXY":this._x=Math.asin(Ke(d,-1,1)),Math.abs(d)<.9999999?(this._y=Math.atan2(-f,h),this._z=Math.atan2(-a,l)):(this._y=0,this._z=Math.atan2(c,s));break;case"ZYX":this._y=Math.asin(-Ke(f,-1,1)),Math.abs(f)<.9999999?(this._x=Math.atan2(d,h),this._z=Math.atan2(c,s)):(this._x=0,this._z=Math.atan2(-a,l));break;case"YZX":this._z=Math.asin(Ke(c,-1,1)),Math.abs(c)<.9999999?(this._x=Math.atan2(-u,l),this._y=Math.atan2(-f,s)):(this._x=0,this._y=Math.atan2(o,h));break;case"XZY":this._z=Math.asin(-Ke(a,-1,1)),Math.abs(a)<.9999999?(this._x=Math.atan2(d,l),this._y=Math.atan2(o,s)):(this._x=Math.atan2(-u,h),this._y=0);break;default:Ue("Euler: .setFromRotationMatrix() encountered an unknown order: "+t)}return this._order=t,n===!0&&this._onChangeCallback(),this}setFromQuaternion(e,t,n){return _o.makeRotationFromQuaternion(e),this.setFromRotationMatrix(_o,t,n)}setFromVector3(e,t=this._order){return this.set(e.x,e.y,e.z,t)}reorder(e){return xo.setFromEuler(this),this.setFromQuaternion(xo,e)}equals(e){return e._x===this._x&&e._y===this._y&&e._z===this._z&&e._order===this._order}fromArray(e){return this._x=e[0],this._y=e[1],this._z=e[2],e[3]!==void 0&&(this._order=e[3]),this._onChangeCallback(),this}toArray(e=[],t=0){return e[t]=this._x,e[t+1]=this._y,e[t+2]=this._z,e[t+3]=this._order,e}_onChange(e){return this._onChangeCallback=e,this}_onChangeCallback(){}*[Symbol.iterator](){yield this._x,yield this._y,yield this._z,yield this._order}}ii.DEFAULT_ORDER="XYZ";class Rl{constructor(){this.mask=1}set(e){this.mask=(1<<e|0)>>>0}enable(e){this.mask|=1<<e|0}enableAll(){this.mask=-1}toggle(e){this.mask^=1<<e|0}disable(e){this.mask&=~(1<<e|0)}disableAll(){this.mask=0}test(e){return(this.mask&e.mask)!==0}isEnabled(e){return(this.mask&(1<<e|0))!==0}}let yu=0;const vo=new H,ci=new wi,vn=new pt,or=new H,Di=new H,bu=new H,Tu=new wi,So=new H(1,0,0),Mo=new H(0,1,0),Eo=new H(0,0,1),yo={type:"added"},Au={type:"removed"},ui={type:"childadded",child:null},gs={type:"childremoved",child:null};class Xt extends si{constructor(){super(),this.isObject3D=!0,Object.defineProperty(this,"id",{value:yu++}),this.uuid=Yi(),this.name="",this.type="Object3D",this.parent=null,this.children=[],this.up=Xt.DEFAULT_UP.clone();const e=new H,t=new ii,n=new wi,r=new H(1,1,1);function s(){n.setFromEuler(t,!1)}function a(){t.setFromQuaternion(n,void 0,!1)}t._onChange(s),n._onChange(a),Object.defineProperties(this,{position:{configurable:!0,enumerable:!0,value:e},rotation:{configurable:!0,enumerable:!0,value:t},quaternion:{configurable:!0,enumerable:!0,value:n},scale:{configurable:!0,enumerable:!0,value:r},modelViewMatrix:{value:new pt},normalMatrix:{value:new Be}}),this.matrix=new pt,this.matrixWorld=new pt,this.matrixAutoUpdate=Xt.DEFAULT_MATRIX_AUTO_UPDATE,this.matrixWorldAutoUpdate=Xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE,this.matrixWorldNeedsUpdate=!1,this.layers=new Rl,this.visible=!0,this.castShadow=!1,this.receiveShadow=!1,this.frustumCulled=!0,this.renderOrder=0,this.animations=[],this.customDepthMaterial=void 0,this.customDistanceMaterial=void 0,this.static=!1,this.userData={},this.pivot=null}onBeforeShadow(){}onAfterShadow(){}onBeforeRender(){}onAfterRender(){}applyMatrix4(e){this.matrixAutoUpdate&&this.updateMatrix(),this.matrix.premultiply(e),this.matrix.decompose(this.position,this.quaternion,this.scale),this.pivot!==null&&this.position.copy(this.pivot).applyMatrix4(this.matrix).sub(this.pivot)}applyQuaternion(e){return this.quaternion.premultiply(e),this}setRotationFromAxisAngle(e,t){this.quaternion.setFromAxisAngle(e,t)}setRotationFromEuler(e){this.quaternion.setFromEuler(e,!0)}setRotationFromMatrix(e){this.quaternion.setFromRotationMatrix(e)}setRotationFromQuaternion(e){this.quaternion.copy(e)}rotateOnAxis(e,t){return ci.setFromAxisAngle(e,t),this.quaternion.multiply(ci),this}rotateOnWorldAxis(e,t){return ci.setFromAxisAngle(e,t),this.quaternion.premultiply(ci),this}rotateX(e){return this.rotateOnAxis(So,e)}rotateY(e){return this.rotateOnAxis(Mo,e)}rotateZ(e){return this.rotateOnAxis(Eo,e)}translateOnAxis(e,t){return vo.copy(e).applyQuaternion(this.quaternion),this.position.add(vo.multiplyScalar(t)),this}translateX(e){return this.translateOnAxis(So,e)}translateY(e){return this.translateOnAxis(Mo,e)}translateZ(e){return this.translateOnAxis(Eo,e)}localToWorld(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(this.matrixWorld)}worldToLocal(e){return this.updateWorldMatrix(!0,!1),e.applyMatrix4(vn.copy(this.matrixWorld).invert())}lookAt(e,t,n){e.isVector3?or.copy(e):or.set(e,t,n);const r=this.parent;this.updateWorldMatrix(!0,!1),Di.setFromMatrixPosition(this.matrixWorld),this.isCamera||this.isLight?vn.lookAt(Di,or,this.up):vn.lookAt(or,Di,this.up),this.quaternion.setFromRotationMatrix(vn),r&&(vn.extractRotation(r.matrixWorld),ci.setFromRotationMatrix(vn),this.quaternion.premultiply(ci.invert()))}add(e){if(arguments.length>1){for(let t=0;t<arguments.length;t++)this.add(arguments[t]);return this}return e===this?(et("Object3D.add: object can't be added as a child of itself.",e),this):(e&&e.isObject3D?(e.removeFromParent(),e.parent=this,this.children.push(e),e.dispatchEvent(yo),ui.child=e,this.dispatchEvent(ui),ui.child=null):et("Object3D.add: object not an instance of THREE.Object3D.",e),this)}remove(e){if(arguments.length>1){for(let n=0;n<arguments.length;n++)this.remove(arguments[n]);return this}const t=this.children.indexOf(e);return t!==-1&&(e.parent=null,this.children.splice(t,1),e.dispatchEvent(Au),gs.child=e,this.dispatchEvent(gs),gs.child=null),this}removeFromParent(){const e=this.parent;return e!==null&&e.remove(this),this}clear(){return this.remove(...this.children)}attach(e){return this.updateWorldMatrix(!0,!1),vn.copy(this.matrixWorld).invert(),e.parent!==null&&(e.parent.updateWorldMatrix(!0,!1),vn.multiply(e.parent.matrixWorld)),e.applyMatrix4(vn),e.removeFromParent(),e.parent=this,this.children.push(e),e.updateWorldMatrix(!1,!0),e.dispatchEvent(yo),ui.child=e,this.dispatchEvent(ui),ui.child=null,this}getObjectById(e){return this.getObjectByProperty("id",e)}getObjectByName(e){return this.getObjectByProperty("name",e)}getObjectByProperty(e,t){if(this[e]===t)return this;for(let n=0,r=this.children.length;n<r;n++){const a=this.children[n].getObjectByProperty(e,t);if(a!==void 0)return a}}getObjectsByProperty(e,t,n=[]){this[e]===t&&n.push(this);const r=this.children;for(let s=0,a=r.length;s<a;s++)r[s].getObjectsByProperty(e,t,n);return n}getWorldPosition(e){return this.updateWorldMatrix(!0,!1),e.setFromMatrixPosition(this.matrixWorld)}getWorldQuaternion(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Di,e,bu),e}getWorldScale(e){return this.updateWorldMatrix(!0,!1),this.matrixWorld.decompose(Di,Tu,e),e}getWorldDirection(e){this.updateWorldMatrix(!0,!1);const t=this.matrixWorld.elements;return e.set(t[8],t[9],t[10]).normalize()}raycast(){}intersectsFrustum(){return!0}traverse(e){e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverse(e)}traverseVisible(e){if(this.visible===!1)return;e(this);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].traverseVisible(e)}traverseAncestors(e){const t=this.parent;t!==null&&(e(t),t.traverseAncestors(e))}updateMatrix(){this.matrix.compose(this.position,this.quaternion,this.scale);const e=this.pivot;if(e!==null){const t=e.x,n=e.y,r=e.z,s=this.matrix.elements;s[12]+=t-s[0]*t-s[4]*n-s[8]*r,s[13]+=n-s[1]*t-s[5]*n-s[9]*r,s[14]+=r-s[2]*t-s[6]*n-s[10]*r}this.matrixWorldNeedsUpdate=!0}updateMatrixWorld(e){this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||e)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,e=!0);const t=this.children;for(let n=0,r=t.length;n<r;n++)t[n].updateMatrixWorld(e)}updateWorldMatrix(e,t,n=!1){const r=this.parent;if(e===!0&&r!==null&&r.updateWorldMatrix(!0,!1),this.matrixAutoUpdate&&this.updateMatrix(),(this.matrixWorldNeedsUpdate||n)&&(this.matrixWorldAutoUpdate===!0&&(this.parent===null?this.matrixWorld.copy(this.matrix):this.matrixWorld.multiplyMatrices(this.parent.matrixWorld,this.matrix)),this.matrixWorldNeedsUpdate=!1,n=!0),t===!0){const s=this.children;for(let a=0,o=s.length;a<o;a++)s[a].updateWorldMatrix(!1,!0,n)}}toJSON(e){const t=e===void 0||typeof e=="string",n={};t&&(e={geometries:{},materials:{},textures:{},images:{},shapes:{},skeletons:{},animations:{},nodes:{}},n.metadata={version:4.7,type:"Object",generator:"Object3D.toJSON"});const r={};r.uuid=this.uuid,r.type=this.type,r.name=this.name,r.castShadow=this.castShadow,r.receiveShadow=this.receiveShadow,r.visible=this.visible,r.frustumCulled=this.frustumCulled,r.renderOrder=this.renderOrder,r.static=this.static,r.matrixAutoUpdate=this.matrixAutoUpdate,Object.keys(this.userData).length>0&&(r.userData=this.userData),r.layers=this.layers.mask,r.matrix=this.matrix.toArray(),r.up=this.up.toArray(),this.pivot!==null&&(r.pivot=this.pivot.toArray()),this.morphTargetDictionary!==void 0&&(r.morphTargetDictionary=Object.assign({},this.morphTargetDictionary)),this.morphTargetInfluences!==void 0&&(r.morphTargetInfluences=this.morphTargetInfluences.slice()),this.isInstancedMesh&&(r.type="InstancedMesh",r.count=this.count,r.instanceMatrix=this.instanceMatrix.toJSON(),this.instanceColor!==null&&(r.instanceColor=this.instanceColor.toJSON())),this.isBatchedMesh&&(r.type="BatchedMesh",r.perObjectFrustumCulled=this.perObjectFrustumCulled,r.sortObjects=this.sortObjects,r.drawRanges=this._drawRanges,r.reservedRanges=this._reservedRanges,r.geometryInfo=this._geometryInfo.map(o=>({...o,boundingBox:o.boundingBox?o.boundingBox.toJSON():void 0,boundingSphere:o.boundingSphere?o.boundingSphere.toJSON():void 0})),r.instanceInfo=this._instanceInfo.map(o=>({...o})),r.availableInstanceIds=this._availableInstanceIds.slice(),r.availableGeometryIds=this._availableGeometryIds.slice(),r.nextIndexStart=this._nextIndexStart,r.nextVertexStart=this._nextVertexStart,r.geometryCount=this._geometryCount,r.maxInstanceCount=this._maxInstanceCount,r.maxVertexCount=this._maxVertexCount,r.maxIndexCount=this._maxIndexCount,r.geometryInitialized=this._geometryInitialized,r.matricesTexture=this._matricesTexture.toJSON(e),r.indirectTexture=this._indirectTexture.toJSON(e),this._colorsTexture!==null&&(r.colorsTexture=this._colorsTexture.toJSON(e)),this.boundingSphere!==null&&(r.boundingSphere=this.boundingSphere.toJSON()),this.boundingBox!==null&&(r.boundingBox=this.boundingBox.toJSON()));function s(o,c){return o[c.uuid]===void 0&&(o[c.uuid]=c.toJSON(e)),c.uuid}if(this.isScene)this.background&&(this.background.isColor?r.background=this.background.toJSON():this.background.isTexture&&(r.background=this.background.toJSON(e).uuid)),this.environment&&this.environment.isTexture&&this.environment.isRenderTargetTexture!==!0&&(r.environment=this.environment.toJSON(e).uuid);else if(this.isMesh||this.isLine||this.isPoints){r.geometry=s(e.geometries,this.geometry);const o=this.geometry.parameters;if(o!==void 0&&o.shapes!==void 0){const c=o.shapes;if(Array.isArray(c))for(let l=0,u=c.length;l<u;l++){const f=c[l];s(e.shapes,f)}else s(e.shapes,c)}}if(this.isSkinnedMesh&&(r.bindMode=this.bindMode,r.bindMatrix=this.bindMatrix.toArray(),this.skeleton!==void 0&&(s(e.skeletons,this.skeleton),r.skeleton=this.skeleton.uuid)),this.material!==void 0)if(Array.isArray(this.material)){const o=[];for(let c=0,l=this.material.length;c<l;c++)o.push(s(e.materials,this.material[c]));r.material=o}else r.material=s(e.materials,this.material);if(this.children.length>0){r.children=[];for(let o=0;o<this.children.length;o++)r.children.push(this.children[o].toJSON(e).object)}if(this.animations.length>0){r.animations=[];for(let o=0;o<this.animations.length;o++){const c=this.animations[o];r.animations.push(s(e.animations,c))}}if(t){const o=a(e.geometries),c=a(e.materials),l=a(e.textures),u=a(e.images),f=a(e.shapes),d=a(e.skeletons),h=a(e.animations),_=a(e.nodes);o.length>0&&(n.geometries=o),c.length>0&&(n.materials=c),l.length>0&&(n.textures=l),u.length>0&&(n.images=u),f.length>0&&(n.shapes=f),d.length>0&&(n.skeletons=d),h.length>0&&(n.animations=h),_.length>0&&(n.nodes=_)}return n.object=r,n;function a(o){const c=[];for(const l in o){const u=o[l];delete u.metadata,c.push(u)}return c}}clone(e){return new this.constructor().copy(this,e)}copy(e,t=!0){if(this.name=e.name,this.up.copy(e.up),this.position.copy(e.position),this.rotation.order=e.rotation.order,this.quaternion.copy(e.quaternion),this.scale.copy(e.scale),this.pivot=e.pivot!==null?e.pivot.clone():null,this.matrix.copy(e.matrix),this.matrixWorld.copy(e.matrixWorld),this.matrixAutoUpdate=e.matrixAutoUpdate,this.matrixWorldAutoUpdate=e.matrixWorldAutoUpdate,this.matrixWorldNeedsUpdate=e.matrixWorldNeedsUpdate,this.layers.mask=e.layers.mask,this.visible=e.visible,this.castShadow=e.castShadow,this.receiveShadow=e.receiveShadow,this.frustumCulled=e.frustumCulled,this.renderOrder=e.renderOrder,this.static=e.static,this.animations=e.animations.slice(),this.userData=JSON.parse(JSON.stringify(e.userData)),t===!0)for(let n=0;n<e.children.length;n++){const r=e.children[n];this.add(r.clone())}return this}dispose(){this.dispatchEvent({type:"dispose"})}}Xt.DEFAULT_UP=new H(0,1,0);Xt.DEFAULT_MATRIX_AUTO_UPDATE=!0;Xt.DEFAULT_MATRIX_WORLD_AUTO_UPDATE=!0;class zi extends Xt{constructor(){super(),this.isGroup=!0,this.type="Group"}}const wu={type:"move"};class _s{constructor(){this._targetRay=null,this._grip=null,this._hand=null}getHandSpace(){return this._hand===null&&(this._hand=new zi,this._hand.matrixAutoUpdate=!1,this._hand.visible=!1,this._hand.joints={},this._hand.inputState={pinching:!1}),this._hand}getTargetRaySpace(){return this._targetRay===null&&(this._targetRay=new zi,this._targetRay.matrixAutoUpdate=!1,this._targetRay.visible=!1,this._targetRay.hasLinearVelocity=!1,this._targetRay.linearVelocity=new H,this._targetRay.hasAngularVelocity=!1,this._targetRay.angularVelocity=new H),this._targetRay}getGripSpace(){return this._grip===null&&(this._grip=new zi,this._grip.matrixAutoUpdate=!1,this._grip.visible=!1,this._grip.hasLinearVelocity=!1,this._grip.linearVelocity=new H,this._grip.hasAngularVelocity=!1,this._grip.angularVelocity=new H,this._grip.eventsEnabled=!1),this._grip}dispatchEvent(e){return this._targetRay!==null&&this._targetRay.dispatchEvent(e),this._grip!==null&&this._grip.dispatchEvent(e),this._hand!==null&&this._hand.dispatchEvent(e),this}connect(e){if(e&&e.hand){const t=this._hand;if(t)for(const n of e.hand.values())this._getHandJoint(t,n)}return this.dispatchEvent({type:"connected",data:e}),this}disconnect(e){return this.dispatchEvent({type:"disconnected",data:e}),this._targetRay!==null&&(this._targetRay.visible=!1),this._grip!==null&&(this._grip.visible=!1),this._hand!==null&&(this._hand.visible=!1),this}update(e,t,n){let r=null,s=null,a=null;const o=this._targetRay,c=this._grip,l=this._hand;if(e&&t.session.visibilityState!=="visible-blurred"){if(l&&e.hand){a=!0;for(const S of e.hand.values()){const m=t.getJointPose(S,n),p=this._getHandJoint(l,S);m!==null&&(p.matrix.fromArray(m.transform.matrix),p.matrix.decompose(p.position,p.quaternion,p.scale),p.matrixWorldNeedsUpdate=!0,p.jointRadius=m.radius),p.visible=m!==null}const u=l.joints["index-finger-tip"],f=l.joints["thumb-tip"],d=u.position.distanceTo(f.position),h=.02,_=.005;l.inputState.pinching&&d>h+_?(l.inputState.pinching=!1,this.dispatchEvent({type:"pinchend",handedness:e.handedness,target:this})):!l.inputState.pinching&&d<=h-_&&(l.inputState.pinching=!0,this.dispatchEvent({type:"pinchstart",handedness:e.handedness,target:this}))}else c!==null&&e.gripSpace&&(s=t.getPose(e.gripSpace,n),s!==null&&(c.matrix.fromArray(s.transform.matrix),c.matrix.decompose(c.position,c.quaternion,c.scale),c.matrixWorldNeedsUpdate=!0,s.linearVelocity?(c.hasLinearVelocity=!0,c.linearVelocity.copy(s.linearVelocity)):c.hasLinearVelocity=!1,s.angularVelocity?(c.hasAngularVelocity=!0,c.angularVelocity.copy(s.angularVelocity)):c.hasAngularVelocity=!1,c.eventsEnabled&&c.dispatchEvent({type:"gripUpdated",data:e,target:this})));o!==null&&(r=t.getPose(e.targetRaySpace,n),r===null&&s!==null&&(r=s),r!==null&&(o.matrix.fromArray(r.transform.matrix),o.matrix.decompose(o.position,o.quaternion,o.scale),o.matrixWorldNeedsUpdate=!0,r.linearVelocity?(o.hasLinearVelocity=!0,o.linearVelocity.copy(r.linearVelocity)):o.hasLinearVelocity=!1,r.angularVelocity?(o.hasAngularVelocity=!0,o.angularVelocity.copy(r.angularVelocity)):o.hasAngularVelocity=!1,this.dispatchEvent(wu)))}return o!==null&&(o.visible=r!==null),c!==null&&(c.visible=s!==null),l!==null&&(l.visible=a!==null),this}_getHandJoint(e,t){if(e.joints[t.jointName]===void 0){const n=new zi;n.matrixAutoUpdate=!1,n.visible=!1,e.joints[t.jointName]=n,e.add(n)}return e.joints[t.jointName]}}const Cl={aliceblue:15792383,antiquewhite:16444375,aqua:65535,aquamarine:8388564,azure:15794175,beige:16119260,bisque:16770244,black:0,blanchedalmond:16772045,blue:255,blueviolet:9055202,brown:10824234,burlywood:14596231,cadetblue:6266528,chartreuse:8388352,chocolate:13789470,coral:16744272,cornflowerblue:6591981,cornsilk:16775388,crimson:14423100,cyan:65535,darkblue:139,darkcyan:35723,darkgoldenrod:12092939,darkgray:11119017,darkgreen:25600,darkgrey:11119017,darkkhaki:12433259,darkmagenta:9109643,darkolivegreen:5597999,darkorange:16747520,darkorchid:10040012,darkred:9109504,darksalmon:15308410,darkseagreen:9419919,darkslateblue:4734347,darkslategray:3100495,darkslategrey:3100495,darkturquoise:52945,darkviolet:9699539,deeppink:16716947,deepskyblue:49151,dimgray:6908265,dimgrey:6908265,dodgerblue:2003199,firebrick:11674146,floralwhite:16775920,forestgreen:2263842,fuchsia:16711935,gainsboro:14474460,ghostwhite:16316671,gold:16766720,goldenrod:14329120,gray:8421504,green:32768,greenyellow:11403055,grey:8421504,honeydew:15794160,hotpink:16738740,indianred:13458524,indigo:4915330,ivory:16777200,khaki:15787660,lavender:15132410,lavenderblush:16773365,lawngreen:8190976,lemonchiffon:16775885,lightblue:11393254,lightcoral:15761536,lightcyan:14745599,lightgoldenrodyellow:16448210,lightgray:13882323,lightgreen:9498256,lightgrey:13882323,lightpink:16758465,lightsalmon:16752762,lightseagreen:2142890,lightskyblue:8900346,lightslategray:7833753,lightslategrey:7833753,lightsteelblue:11584734,lightyellow:16777184,lime:65280,limegreen:3329330,linen:16445670,magenta:16711935,maroon:8388608,mediumaquamarine:6737322,mediumblue:205,mediumorchid:12211667,mediumpurple:9662683,mediumseagreen:3978097,mediumslateblue:8087790,mediumspringgreen:64154,mediumturquoise:4772300,mediumvioletred:13047173,midnightblue:1644912,mintcream:16121850,mistyrose:16770273,moccasin:16770229,navajowhite:16768685,navy:128,oldlace:16643558,olive:8421376,olivedrab:7048739,orange:16753920,orangered:16729344,orchid:14315734,palegoldenrod:15657130,palegreen:10025880,paleturquoise:11529966,palevioletred:14381203,papayawhip:16773077,peachpuff:16767673,peru:13468991,pink:16761035,plum:14524637,powderblue:11591910,purple:8388736,rebeccapurple:6697881,red:16711680,rosybrown:12357519,royalblue:4286945,saddlebrown:9127187,salmon:16416882,sandybrown:16032864,seagreen:3050327,seashell:16774638,sienna:10506797,silver:12632256,skyblue:8900331,slateblue:6970061,slategray:7372944,slategrey:7372944,snow:16775930,springgreen:65407,steelblue:4620980,tan:13808780,teal:32896,thistle:14204888,tomato:16737095,turquoise:4251856,violet:15631086,wheat:16113331,white:16777215,whitesmoke:16119285,yellow:16776960,yellowgreen:10145074},Dn={h:0,s:0,l:0},lr={h:0,s:0,l:0};function xs(i,e,t){return t<0&&(t+=1),t>1&&(t-=1),t<1/6?i+(e-i)*6*t:t<1/2?e:t<2/3?i+(e-i)*6*(2/3-t):i}class tt{constructor(e,t,n){return this.isColor=!0,this.r=1,this.g=1,this.b=1,this.set(e,t,n)}set(e,t,n){if(t===void 0&&n===void 0){const r=e;r&&r.isColor?this.copy(r):typeof r=="number"?this.setHex(r):typeof r=="string"&&this.setStyle(r)}else this.setRGB(e,t,n);return this}setScalar(e){return this.r=e,this.g=e,this.b=e,this}setHex(e,t=zt){return e=Math.floor(e),this.r=(e>>16&255)/255,this.g=(e>>8&255)/255,this.b=(e&255)/255,Ye.colorSpaceToWorking(this,t),this}setRGB(e,t,n,r=Ye.workingColorSpace){return this.r=e,this.g=t,this.b=n,Ye.colorSpaceToWorking(this,r),this}setHSL(e,t,n,r=Ye.workingColorSpace){if(e=hu(e,1),t=Ke(t,0,1),n=Ke(n,0,1),t===0)this.r=this.g=this.b=n;else{const s=n<=.5?n*(1+t):n+t-n*t,a=2*n-s;this.r=xs(a,s,e+1/3),this.g=xs(a,s,e),this.b=xs(a,s,e-1/3)}return Ye.colorSpaceToWorking(this,r),this}setStyle(e,t=zt){function n(s){s!==void 0&&parseFloat(s)<1&&Ue("Color: Alpha component of "+e+" will be ignored.")}let r;if(r=/^(\w+)\(([^\)]*)\)/.exec(e)){let s;const a=r[1],o=r[2];switch(a){case"rgb":case"rgba":if(s=/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(255,parseInt(s[1],10))/255,Math.min(255,parseInt(s[2],10))/255,Math.min(255,parseInt(s[3],10))/255,t);if(s=/^\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(s[4]),this.setRGB(Math.min(100,parseFloat(s[1]))/100,Math.min(100,parseFloat(s[2]))/100,Math.min(100,parseFloat(s[3]))/100,t);break;case"hsl":case"hsla":if(s=/^\s*([+-]?(?:\d+(?:\.\d+)?|\.\d+))\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*,\s*(\d+(?:\.\d+)?|\.\d+)\%\s*(?:,\s*(\d+(?:\.\d+)?|\.\d+)\s*)?$/.exec(o))return n(s[4]),this.setHSL(parseFloat(s[1])/360,parseFloat(s[2])/100,parseFloat(s[3])/100,t);break;default:Ue("Color: Unknown color model "+e)}}else if(r=/^\#([A-Fa-f\d]+)$/.exec(e)){const s=r[1],a=s.length;if(a===3)return this.setRGB(parseInt(s.charAt(0),16)/15,parseInt(s.charAt(1),16)/15,parseInt(s.charAt(2),16)/15,t);if(a===6)return this.setHex(parseInt(s,16),t);Ue("Color: Invalid hex color "+e)}else if(e&&e.length>0)return this.setColorName(e,t);return this}setColorName(e,t=zt){const n=Cl[e.toLowerCase()];return n!==void 0?this.setHex(n,t):Ue("Color: Unknown color "+e),this}clone(){return new this.constructor(this.r,this.g,this.b)}copy(e){return this.r=e.r,this.g=e.g,this.b=e.b,this}copySRGBToLinear(e){return this.r=Rn(e.r),this.g=Rn(e.g),this.b=Rn(e.b),this}copyLinearToSRGB(e){return this.r=Mi(e.r),this.g=Mi(e.g),this.b=Mi(e.b),this}convertSRGBToLinear(){return this.copySRGBToLinear(this),this}convertLinearToSRGB(){return this.copyLinearToSRGB(this),this}getHex(e=zt){return Ye.workingToColorSpace(Dt.copy(this),e),Math.round(Ke(Dt.r*255,0,255))*65536+Math.round(Ke(Dt.g*255,0,255))*256+Math.round(Ke(Dt.b*255,0,255))}getHexString(e=zt){return("000000"+this.getHex(e).toString(16)).slice(-6)}getHSL(e,t=Ye.workingColorSpace){Ye.workingToColorSpace(Dt.copy(this),t);const n=Dt.r,r=Dt.g,s=Dt.b,a=Math.max(n,r,s),o=Math.min(n,r,s);let c,l;const u=(o+a)/2;if(o===a)c=0,l=0;else{const f=a-o;switch(l=u<=.5?f/(a+o):f/(2-a-o),a){case n:c=(r-s)/f+(r<s?6:0);break;case r:c=(s-n)/f+2;break;case s:c=(n-r)/f+4;break}c/=6}return e.h=c,e.s=l,e.l=u,e}getRGB(e,t=Ye.workingColorSpace){return Ye.workingToColorSpace(Dt.copy(this),t),e.r=Dt.r,e.g=Dt.g,e.b=Dt.b,e}getStyle(e=zt){Ye.workingToColorSpace(Dt.copy(this),e);const t=Dt.r,n=Dt.g,r=Dt.b;return e!==zt?`color(${e} ${t.toFixed(3)} ${n.toFixed(3)} ${r.toFixed(3)})`:`rgb(${Math.round(t*255)},${Math.round(n*255)},${Math.round(r*255)})`}offsetHSL(e,t,n){return this.getHSL(Dn),this.setHSL(Dn.h+e,Dn.s+t,Dn.l+n)}add(e){return this.r+=e.r,this.g+=e.g,this.b+=e.b,this}addColors(e,t){return this.r=e.r+t.r,this.g=e.g+t.g,this.b=e.b+t.b,this}addScalar(e){return this.r+=e,this.g+=e,this.b+=e,this}sub(e){return this.r=Math.max(0,this.r-e.r),this.g=Math.max(0,this.g-e.g),this.b=Math.max(0,this.b-e.b),this}multiply(e){return this.r*=e.r,this.g*=e.g,this.b*=e.b,this}multiplyScalar(e){return this.r*=e,this.g*=e,this.b*=e,this}lerp(e,t){return this.r+=(e.r-this.r)*t,this.g+=(e.g-this.g)*t,this.b+=(e.b-this.b)*t,this}lerpColors(e,t,n){return this.r=e.r+(t.r-e.r)*n,this.g=e.g+(t.g-e.g)*n,this.b=e.b+(t.b-e.b)*n,this}lerpHSL(e,t){this.getHSL(Dn),e.getHSL(lr);const n=hs(Dn.h,lr.h,t),r=hs(Dn.s,lr.s,t),s=hs(Dn.l,lr.l,t);return this.setHSL(n,r,s),this}setFromVector3(e){return this.r=e.x,this.g=e.y,this.b=e.z,this}applyMatrix3(e){const t=this.r,n=this.g,r=this.b,s=e.elements;return this.r=s[0]*t+s[3]*n+s[6]*r,this.g=s[1]*t+s[4]*n+s[7]*r,this.b=s[2]*t+s[5]*n+s[8]*r,this}equals(e){return e.r===this.r&&e.g===this.g&&e.b===this.b}fromArray(e,t=0){return this.r=e[t],this.g=e[t+1],this.b=e[t+2],this}toArray(e=[],t=0){return e[t]=this.r,e[t+1]=this.g,e[t+2]=this.b,e}fromBufferAttribute(e,t){return this.r=e.getX(t),this.g=e.getY(t),this.b=e.getZ(t),this}toJSON(){return this.getHex()}*[Symbol.iterator](){yield this.r,yield this.g,yield this.b}}const Dt=new tt;tt.NAMES=Cl;class Ru extends Xt{constructor(){super(),this.isScene=!0,this.type="Scene",this.background=null,this.environment=null,this.fog=null,this.backgroundBlurriness=0,this.backgroundIntensity=1,this.backgroundRotation=new ii,this.environmentIntensity=1,this.environmentRotation=new ii,this.overrideMaterial=null,typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}copy(e,t){return super.copy(e,t),this.background=e.background!==null?e.background.clone():null,this.environment=e.environment!==null?e.environment.clone():null,this.fog=e.fog!==null?e.fog.clone():null,this.backgroundBlurriness=e.backgroundBlurriness,this.backgroundIntensity=e.backgroundIntensity,this.backgroundRotation.copy(e.backgroundRotation),this.environmentIntensity=e.environmentIntensity,this.environmentRotation.copy(e.environmentRotation),this.overrideMaterial=e.overrideMaterial!==null?e.overrideMaterial.clone():null,this.matrixAutoUpdate=e.matrixAutoUpdate,this}toJSON(e){const t=super.toJSON(e);return this.fog!==null&&(t.object.fog=this.fog.toJSON()),t.object.backgroundBlurriness=this.backgroundBlurriness,t.object.backgroundIntensity=this.backgroundIntensity,t.object.backgroundRotation=this.backgroundRotation.toArray(),t.object.environmentIntensity=this.environmentIntensity,t.object.environmentRotation=this.environmentRotation.toArray(),t}}const tn=new H,Sn=new H,vs=new H,Mn=new H,hi=new H,di=new H,bo=new H,Ss=new H,Ms=new H,Es=new H,ys=new ft,bs=new ft,Ts=new ft;class sn{constructor(e=new H,t=new H,n=new H){this.a=e,this.b=t,this.c=n}static getNormal(e,t,n,r){r.subVectors(n,t),tn.subVectors(e,t),r.cross(tn);const s=r.lengthSq();return s>0?r.multiplyScalar(1/Math.sqrt(s)):r.set(0,0,0)}static getBarycoord(e,t,n,r,s){tn.subVectors(r,t),Sn.subVectors(n,t),vs.subVectors(e,t);const a=tn.dot(tn),o=tn.dot(Sn),c=tn.dot(vs),l=Sn.dot(Sn),u=Sn.dot(vs),f=a*l-o*o;if(f===0)return s.set(0,0,0),null;const d=1/f,h=(l*c-o*u)*d,_=(a*u-o*c)*d;return s.set(1-h-_,_,h)}static containsPoint(e,t,n,r){return this.getBarycoord(e,t,n,r,Mn)===null?!1:Mn.x>=0&&Mn.y>=0&&Mn.x+Mn.y<=1}static getInterpolation(e,t,n,r,s,a,o,c){return this.getBarycoord(e,t,n,r,Mn)===null?(c.x=0,c.y=0,"z"in c&&(c.z=0),"w"in c&&(c.w=0),null):(c.setScalar(0),c.addScaledVector(s,Mn.x),c.addScaledVector(a,Mn.y),c.addScaledVector(o,Mn.z),c)}static getInterpolatedAttribute(e,t,n,r,s,a){return ys.setScalar(0),bs.setScalar(0),Ts.setScalar(0),ys.fromBufferAttribute(e,t),bs.fromBufferAttribute(e,n),Ts.fromBufferAttribute(e,r),a.setScalar(0),a.addScaledVector(ys,s.x),a.addScaledVector(bs,s.y),a.addScaledVector(Ts,s.z),a}static isFrontFacing(e,t,n,r){return tn.subVectors(n,t),Sn.subVectors(e,t),tn.cross(Sn).dot(r)<0}set(e,t,n){return this.a.copy(e),this.b.copy(t),this.c.copy(n),this}setFromPointsAndIndices(e,t,n,r){return this.a.copy(e[t]),this.b.copy(e[n]),this.c.copy(e[r]),this}setFromAttributeAndIndices(e,t,n,r){return this.a.fromBufferAttribute(e,t),this.b.fromBufferAttribute(e,n),this.c.fromBufferAttribute(e,r),this}clone(){return new this.constructor().copy(this)}copy(e){return this.a.copy(e.a),this.b.copy(e.b),this.c.copy(e.c),this}getArea(){return tn.subVectors(this.c,this.b),Sn.subVectors(this.a,this.b),tn.cross(Sn).length()*.5}getMidpoint(e){return e.addVectors(this.a,this.b).add(this.c).multiplyScalar(1/3)}getNormal(e){return sn.getNormal(this.a,this.b,this.c,e)}getPlane(e){return e.setFromCoplanarPoints(this.a,this.b,this.c)}getBarycoord(e,t){return sn.getBarycoord(e,this.a,this.b,this.c,t)}getInterpolation(e,t,n,r,s){return sn.getInterpolation(e,this.a,this.b,this.c,t,n,r,s)}containsPoint(e){return sn.containsPoint(e,this.a,this.b,this.c)}isFrontFacing(e){return sn.isFrontFacing(this.a,this.b,this.c,e)}intersectsBox(e){return e.intersectsTriangle(this)}closestPointToPoint(e,t){const n=this.a,r=this.b,s=this.c;let a,o;hi.subVectors(r,n),di.subVectors(s,n),Ss.subVectors(e,n);const c=hi.dot(Ss),l=di.dot(Ss);if(c<=0&&l<=0)return t.copy(n);Ms.subVectors(e,r);const u=hi.dot(Ms),f=di.dot(Ms);if(u>=0&&f<=u)return t.copy(r);const d=c*f-u*l;if(d<=0&&c>=0&&u<=0&&c-u>0)return a=c/(c-u),t.copy(n).addScaledVector(hi,a);Es.subVectors(e,s);const h=hi.dot(Es),_=di.dot(Es);if(_>=0&&h<=_)return t.copy(s);const S=h*l-c*_;if(S<=0&&l>=0&&_<=0)return o=l/(l-_),t.copy(n).addScaledVector(di,o);const m=u*_-h*f;if(m<=0&&f-u>=0&&h-_>=0)return bo.subVectors(s,r),o=(f-u)/(f-u+(h-_)),t.copy(r).addScaledVector(bo,o);const p=1/(m+S+d);return a=S*p,o=d*p,t.copy(n).addScaledVector(hi,a).addScaledVector(di,o)}equals(e){return e.a.equals(this.a)&&e.b.equals(this.b)&&e.c.equals(this.c)}}class Ki{constructor(e=new H(1/0,1/0,1/0),t=new H(-1/0,-1/0,-1/0)){this.isBox3=!0,this.min=e,this.max=t}set(e,t){return this.min.copy(e),this.max.copy(t),this}setFromArray(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t+=3)this.expandByPoint(nn.fromArray(e,t));return this}setFromBufferAttribute(e){this.makeEmpty();for(let t=0,n=e.count;t<n;t++)this.expandByPoint(nn.fromBufferAttribute(e,t));return this}setFromPoints(e){this.makeEmpty();for(let t=0,n=e.length;t<n;t++)this.expandByPoint(e[t]);return this}setFromCenterAndSize(e,t){const n=nn.copy(t).multiplyScalar(.5);return this.min.copy(e).sub(n),this.max.copy(e).add(n),this}setFromObject(e,t=!1){return this.makeEmpty(),this.expandByObject(e,t)}clone(){return new this.constructor().copy(this)}copy(e){return this.min.copy(e.min),this.max.copy(e.max),this}makeEmpty(){return this.min.x=this.min.y=this.min.z=1/0,this.max.x=this.max.y=this.max.z=-1/0,this}isEmpty(){return this.max.x<this.min.x||this.max.y<this.min.y||this.max.z<this.min.z}getCenter(e){return this.isEmpty()?e.set(0,0,0):e.addVectors(this.min,this.max).multiplyScalar(.5)}getSize(e){return this.isEmpty()?e.set(0,0,0):e.subVectors(this.max,this.min)}expandByPoint(e){return this.min.min(e),this.max.max(e),this}expandByVector(e){return this.min.sub(e),this.max.add(e),this}expandByScalar(e){return this.min.addScalar(-e),this.max.addScalar(e),this}expandByObject(e,t=!1){e.updateWorldMatrix(!1,!1);const n=e.geometry;if(n!==void 0){const s=n.getAttribute("position");if(t===!0&&s!==void 0&&e.isInstancedMesh!==!0&&e.isBatchedMesh!==!0)for(let a=0,o=s.count;a<o;a++)e.isMesh===!0?e.getVertexPosition(a,nn):nn.fromBufferAttribute(s,a),nn.applyMatrix4(e.matrixWorld),this.expandByPoint(nn);else e.boundingBox!==void 0?(e.boundingBox===null&&e.computeBoundingBox(),cr.copy(e.boundingBox)):(n.boundingBox===null&&n.computeBoundingBox(),cr.copy(n.boundingBox)),cr.applyMatrix4(e.matrixWorld),this.union(cr)}const r=e.children;for(let s=0,a=r.length;s<a;s++)this.expandByObject(r[s],t);return this}containsPoint(e){return e.x>=this.min.x&&e.x<=this.max.x&&e.y>=this.min.y&&e.y<=this.max.y&&e.z>=this.min.z&&e.z<=this.max.z}containsBox(e){return this.min.x<=e.min.x&&e.max.x<=this.max.x&&this.min.y<=e.min.y&&e.max.y<=this.max.y&&this.min.z<=e.min.z&&e.max.z<=this.max.z}getParameter(e,t){return t.set((e.x-this.min.x)/(this.max.x-this.min.x),(e.y-this.min.y)/(this.max.y-this.min.y),(e.z-this.min.z)/(this.max.z-this.min.z))}intersectsBox(e){return e.max.x>=this.min.x&&e.min.x<=this.max.x&&e.max.y>=this.min.y&&e.min.y<=this.max.y&&e.max.z>=this.min.z&&e.min.z<=this.max.z}intersectsSphere(e){return this.clampPoint(e.center,nn),nn.distanceToSquared(e.center)<=e.radius*e.radius}intersectsPlane(e){let t,n;return e.normal.x>0?(t=e.normal.x*this.min.x,n=e.normal.x*this.max.x):(t=e.normal.x*this.max.x,n=e.normal.x*this.min.x),e.normal.y>0?(t+=e.normal.y*this.min.y,n+=e.normal.y*this.max.y):(t+=e.normal.y*this.max.y,n+=e.normal.y*this.min.y),e.normal.z>0?(t+=e.normal.z*this.min.z,n+=e.normal.z*this.max.z):(t+=e.normal.z*this.max.z,n+=e.normal.z*this.min.z),t<=-e.constant&&n>=-e.constant}intersectsTriangle(e){if(this.isEmpty())return!1;this.getCenter(Ii),ur.subVectors(this.max,Ii),fi.subVectors(e.a,Ii),pi.subVectors(e.b,Ii),mi.subVectors(e.c,Ii),In.subVectors(pi,fi),Nn.subVectors(mi,pi),Zn.subVectors(fi,mi);let t=[0,-In.z,In.y,0,-Nn.z,Nn.y,0,-Zn.z,Zn.y,In.z,0,-In.x,Nn.z,0,-Nn.x,Zn.z,0,-Zn.x,-In.y,In.x,0,-Nn.y,Nn.x,0,-Zn.y,Zn.x,0];return!As(t,fi,pi,mi,ur)||(t=[1,0,0,0,1,0,0,0,1],!As(t,fi,pi,mi,ur))?!1:(hr.crossVectors(In,Nn),t=[hr.x,hr.y,hr.z],As(t,fi,pi,mi,ur))}clampPoint(e,t){return t.copy(e).clamp(this.min,this.max)}distanceToPoint(e){return this.clampPoint(e,nn).distanceTo(e)}getBoundingSphere(e){return this.isEmpty()?e.makeEmpty():(this.getCenter(e.center),e.radius=this.getSize(nn).length()*.5),e}intersect(e){return this.min.max(e.min),this.max.min(e.max),this.isEmpty()&&this.makeEmpty(),this}union(e){return this.min.min(e.min),this.max.max(e.max),this}applyMatrix4(e){return this.isEmpty()?this:(En[0].set(this.min.x,this.min.y,this.min.z).applyMatrix4(e),En[1].set(this.min.x,this.min.y,this.max.z).applyMatrix4(e),En[2].set(this.min.x,this.max.y,this.min.z).applyMatrix4(e),En[3].set(this.min.x,this.max.y,this.max.z).applyMatrix4(e),En[4].set(this.max.x,this.min.y,this.min.z).applyMatrix4(e),En[5].set(this.max.x,this.min.y,this.max.z).applyMatrix4(e),En[6].set(this.max.x,this.max.y,this.min.z).applyMatrix4(e),En[7].set(this.max.x,this.max.y,this.max.z).applyMatrix4(e),this.setFromPoints(En),this)}translate(e){return this.min.add(e),this.max.add(e),this}equals(e){return e.min.equals(this.min)&&e.max.equals(this.max)}toJSON(){return{min:this.min.toArray(),max:this.max.toArray()}}fromJSON(e){return this.min.fromArray(e.min),this.max.fromArray(e.max),this}}const En=[new H,new H,new H,new H,new H,new H,new H,new H],nn=new H,cr=new Ki,fi=new H,pi=new H,mi=new H,In=new H,Nn=new H,Zn=new H,Ii=new H,ur=new H,hr=new H,Jn=new H;function As(i,e,t,n,r){for(let s=0,a=i.length-3;s<=a;s+=3){Jn.fromArray(i,s);const o=r.x*Math.abs(Jn.x)+r.y*Math.abs(Jn.y)+r.z*Math.abs(Jn.z),c=e.dot(Jn),l=t.dot(Jn),u=n.dot(Jn);if(Math.max(-Math.max(c,l,u),Math.min(c,l,u))>o)return!1}return!0}const vt=new H,dr=new Ze;let Cu=0;class ei extends si{constructor(e,t,n=!1){if(super(),Array.isArray(e))throw new TypeError("THREE.BufferAttribute: array should be a Typed Array.");this.isBufferAttribute=!0,Object.defineProperty(this,"id",{value:Cu++}),this.name="",this.array=e,this.itemSize=t,this.count=e!==void 0?e.length/t:0,this.normalized=n,this.usage=au,this.updateRanges=[],this.gpuType=dn,this.version=0,this._normalizationScale=e!==void 0?Ia(e):void 0}onUploadCallback(){}set needsUpdate(e){e===!0&&this.version++}setUsage(e){return this.usage=e,this}addUpdateRange(e,t){this.updateRanges.push({start:e,count:t})}clearUpdateRanges(){this.updateRanges.length=0}copy(e){return this.name=e.name,this.array=new e.array.constructor(e.array),this.itemSize=e.itemSize,this.count=e.count,this.normalized=e.normalized,this.usage=e.usage,this.gpuType=e.gpuType,this._normalizationScale=e._normalizationScale,this}copyAt(e,t,n){e*=this.itemSize,n*=t.itemSize;for(let r=0,s=this.itemSize;r<s;r++)this.array[e+r]=t.array[n+r];return this}copyArray(e){return this.array.set(e),this}applyMatrix3(e){if(this.itemSize===2)for(let t=0,n=this.count;t<n;t++)dr.fromBufferAttribute(this,t),dr.applyMatrix3(e),this.setXY(t,dr.x,dr.y);else if(this.itemSize===3)for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix3(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyMatrix4(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyMatrix4(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}applyNormalMatrix(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.applyNormalMatrix(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}transformDirection(e){for(let t=0,n=this.count;t<n;t++)vt.fromBufferAttribute(this,t),vt.transformDirection(e),this.setXYZ(t,vt.x,vt.y,vt.z);return this}set(e,t=0){return this.array.set(e,t),this}getComponent(e,t){let n=this.array[e*this.itemSize+t];return this.normalized&&(n=this._denormalize(n)),n}setComponent(e,t,n){return this.normalized&&(n=this._normalize(n)),this.array[e*this.itemSize+t]=n,this}getX(e){let t=this.array[e*this.itemSize];return this.normalized&&(t=this._denormalize(t)),t}setX(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize]=t,this}getY(e){let t=this.array[e*this.itemSize+1];return this.normalized&&(t=this._denormalize(t)),t}setY(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+1]=t,this}getZ(e){let t=this.array[e*this.itemSize+2];return this.normalized&&(t=this._denormalize(t)),t}setZ(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+2]=t,this}getW(e){let t=this.array[e*this.itemSize+3];return this.normalized&&(t=this._denormalize(t)),t}setW(e,t){return this.normalized&&(t=this._normalize(t)),this.array[e*this.itemSize+3]=t,this}setXY(e,t,n){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n)),this.array[e+0]=t,this.array[e+1]=n,this}setXYZ(e,t,n,r){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this}setXYZW(e,t,n,r,s){return e*=this.itemSize,this.normalized&&(t=this._normalize(t),n=this._normalize(n),r=this._normalize(r),s=this._normalize(s)),this.array[e+0]=t,this.array[e+1]=n,this.array[e+2]=r,this.array[e+3]=s,this}onUpload(e){return this.onUploadCallback=e,this}clone(){return new this.constructor(this.array,this.itemSize).copy(this)}toJSON(){const e={itemSize:this.itemSize,type:this.array.constructor.name,array:Array.from(this.array),normalized:this.normalized};return e.name=this.name,e.usage=this.usage,e.gpuType=this.gpuType,e}dispose(){this.dispatchEvent({type:"dispose"})}_denormalize(e){const t=this._normalizationScale;return t!==void 0?Math.max(e/t,-1):fu(e,this.array)}_normalize(e){const t=this._normalizationScale;return t!==void 0?Math.round(e*t):pu(e,this.array)}}class Pl extends ei{constructor(e,t,n){super(new Uint16Array(e),t,n)}}class Ll extends ei{constructor(e,t,n){super(new Uint32Array(e),t,n)}}class Nt extends ei{constructor(e,t,n){super(new Float32Array(e),t,n)}}const Pu=new Ki,Ni=new H,ws=new H;class Zr{constructor(e=new H,t=-1){this.isSphere=!0,this.center=e,this.radius=t}set(e,t){return this.center.copy(e),this.radius=t,this}setFromPoints(e,t){const n=this.center;t!==void 0?n.copy(t):Pu.setFromPoints(e).getCenter(n);let r=0;for(let s=0,a=e.length;s<a;s++)r=Math.max(r,n.distanceToSquared(e[s]));return this.radius=Math.sqrt(r),this}copy(e){return this.center.copy(e.center),this.radius=e.radius,this}isEmpty(){return this.radius<0}makeEmpty(){return this.center.set(0,0,0),this.radius=-1,this}containsPoint(e){return e.distanceToSquared(this.center)<=this.radius*this.radius}distanceToPoint(e){return e.distanceTo(this.center)-this.radius}intersectsSphere(e){const t=this.radius+e.radius;return e.center.distanceToSquared(this.center)<=t*t}intersectsBox(e){return e.intersectsSphere(this)}intersectsPlane(e){return Math.abs(e.distanceToPoint(this.center))<=this.radius}clampPoint(e,t){const n=this.center.distanceToSquared(e);return t.copy(e),n>this.radius*this.radius&&(t.sub(this.center).normalize(),t.multiplyScalar(this.radius).add(this.center)),t}getBoundingBox(e){return this.isEmpty()?(e.makeEmpty(),e):(e.set(this.center,this.center),e.expandByScalar(this.radius),e)}applyMatrix4(e){return this.center.applyMatrix4(e),this.radius=this.radius*e.getMaxScaleOnAxis(),this}translate(e){return this.center.add(e),this}expandByPoint(e){if(this.isEmpty())return this.center.copy(e),this.radius=0,this;Ni.subVectors(e,this.center);const t=Ni.lengthSq();if(t>this.radius*this.radius){const n=Math.sqrt(t),r=(n-this.radius)*.5;this.center.addScaledVector(Ni,r/n),this.radius+=r}return this}union(e){return e.isEmpty()?this:this.isEmpty()?(this.copy(e),this):(this.center.equals(e.center)===!0?this.radius=Math.max(this.radius,e.radius):(ws.subVectors(e.center,this.center).setLength(e.radius),this.expandByPoint(Ni.copy(e.center).add(ws)),this.expandByPoint(Ni.copy(e.center).sub(ws))),this)}equals(e){return e.center.equals(this.center)&&e.radius===this.radius}clone(){return new this.constructor().copy(this)}toJSON(){return{radius:this.radius,center:this.center.toArray()}}fromJSON(e){return this.radius=e.radius,this.center.fromArray(e.center),this}}let Lu=0;const $t=new pt,Rs=new Xt,gi=new H,Yt=new Ki,Ui=new Ki,Tt=new H;class on extends si{constructor(){super(),this.isBufferGeometry=!0,Object.defineProperty(this,"id",{value:Lu++}),this.uuid=Yi(),this.name="",this.type="BufferGeometry",this.index=null,this.indirect=null,this.indirectOffset=0,this.attributes={},this.morphAttributes={},this.morphTargetsRelative=!1,this.groups=[],this.boundingBox=null,this.boundingSphere=null,this.drawRange={start:0,count:1/0},this.userData={},this._transformed=!1}getIndex(){return this.index}setIndex(e){return Array.isArray(e)?this.index=new(ou(e)?Ll:Pl)(e,1):this.index=e,this}setIndirect(e,t=0){return this.indirect=e,this.indirectOffset=t,this}getIndirect(){return this.indirect}getAttribute(e){return this.attributes[e]}setAttribute(e,t){return this.attributes[e]=t,this}deleteAttribute(e){return delete this.attributes[e],this}hasAttribute(e){return this.attributes[e]!==void 0}addGroup(e,t,n=0){this.groups.push({start:e,count:t,materialIndex:n})}clearGroups(){this.groups=[]}setDrawRange(e,t){this.drawRange.start=e,this.drawRange.count=t}applyMatrix4(e){const t=this.attributes.position;t!==void 0&&(t.applyMatrix4(e),t.needsUpdate=!0);const n=this.attributes.normal;if(n!==void 0){const s=new Be().getNormalMatrix(e);n.applyNormalMatrix(s),n.needsUpdate=!0}const r=this.attributes.tangent;return r!==void 0&&(r.transformDirection(e),r.needsUpdate=!0),this.boundingBox!==null&&this.computeBoundingBox(),this.boundingSphere!==null&&this.computeBoundingSphere(),this._transformed=!0,this}applyQuaternion(e){return $t.makeRotationFromQuaternion(e),this.applyMatrix4($t),this}rotateX(e){return $t.makeRotationX(e),this.applyMatrix4($t),this}rotateY(e){return $t.makeRotationY(e),this.applyMatrix4($t),this}rotateZ(e){return $t.makeRotationZ(e),this.applyMatrix4($t),this}translate(e,t,n){return $t.makeTranslation(e,t,n),this.applyMatrix4($t),this}scale(e,t,n){return $t.makeScale(e,t,n),this.applyMatrix4($t),this}lookAt(e){return Rs.lookAt(e),Rs.updateMatrix(),this.applyMatrix4(Rs.matrix),this}center(){return this.computeBoundingBox(),this.boundingBox.getCenter(gi).negate(),this.translate(gi.x,gi.y,gi.z),this}setFromPoints(e){const t=this.getAttribute("position");if(t===void 0){const n=[];for(let r=0,s=e.length;r<s;r++){const a=e[r];n.push(a.x,a.y,a.z||0)}this.setAttribute("position",new Nt(n,3))}else{const n=Math.min(e.length,t.count);for(let r=0;r<n;r++){const s=e[r];t.setXYZ(r,s.x,s.y,s.z||0)}e.length>t.count&&Ue("BufferGeometry: Buffer size too small for points data. Use .dispose() and create a new geometry."),t.needsUpdate=!0}return this}computeBoundingBox(){this.boundingBox===null&&(this.boundingBox=new Ki);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){et("BufferGeometry.computeBoundingBox(): GLBufferAttribute requires a manual bounding box.",this),this.boundingBox.set(new H(-1/0,-1/0,-1/0),new H(1/0,1/0,1/0));return}if(e!==void 0){if(this.boundingBox.setFromBufferAttribute(e),t)for(let n=0,r=t.length;n<r;n++){const s=t[n];Yt.setFromBufferAttribute(s),this.morphTargetsRelative?(Tt.addVectors(this.boundingBox.min,Yt.min),this.boundingBox.expandByPoint(Tt),Tt.addVectors(this.boundingBox.max,Yt.max),this.boundingBox.expandByPoint(Tt)):(this.boundingBox.expandByPoint(Yt.min),this.boundingBox.expandByPoint(Yt.max))}}else this.boundingBox.makeEmpty();(isNaN(this.boundingBox.min.x)||isNaN(this.boundingBox.min.y)||isNaN(this.boundingBox.min.z))&&et('BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',this)}computeBoundingSphere(){this.boundingSphere===null&&(this.boundingSphere=new Zr);const e=this.attributes.position,t=this.morphAttributes.position;if(e&&e.isGLBufferAttribute){et("BufferGeometry.computeBoundingSphere(): GLBufferAttribute requires a manual bounding sphere.",this),this.boundingSphere.set(new H,1/0);return}if(e){const n=this.boundingSphere.center;if(Yt.setFromBufferAttribute(e),t)for(let s=0,a=t.length;s<a;s++){const o=t[s];Ui.setFromBufferAttribute(o),this.morphTargetsRelative?(Tt.addVectors(Yt.min,Ui.min),Yt.expandByPoint(Tt),Tt.addVectors(Yt.max,Ui.max),Yt.expandByPoint(Tt)):(Yt.expandByPoint(Ui.min),Yt.expandByPoint(Ui.max))}Yt.getCenter(n);let r=0;for(let s=0,a=e.count;s<a;s++)Tt.fromBufferAttribute(e,s),r=Math.max(r,n.distanceToSquared(Tt));if(t)for(let s=0,a=t.length;s<a;s++){const o=t[s],c=this.morphTargetsRelative;for(let l=0,u=o.count;l<u;l++)Tt.fromBufferAttribute(o,l),c&&(gi.fromBufferAttribute(e,l),Tt.add(gi)),r=Math.max(r,n.distanceToSquared(Tt))}this.boundingSphere.radius=Math.sqrt(r),isNaN(this.boundingSphere.radius)&&et('BufferGeometry.computeBoundingSphere(): Computed radius is NaN. The "position" attribute is likely to have NaN values.',this)}}computeTangents(){const e=this.index,t=this.attributes;if(e===null||t.position===void 0||t.normal===void 0||t.uv===void 0){et("BufferGeometry: .computeTangents() failed. Missing required attributes (index, position, normal or uv)");return}const n=t.position,r=t.normal,s=t.uv;let a=this.getAttribute("tangent");(a===void 0||a.count!==n.count)&&(a=new ei(new Float32Array(4*n.count),4),this.setAttribute("tangent",a));const o=[],c=[],l=new Uint8Array(n.count);for(let z=0;z<n.count;z++)o[z]=new H,c[z]=new H;const u=new H,f=new H,d=new H,h=new Ze,_=new Ze,S=new Ze,m=new H,p=new H;function M(z,D,U){l[z]=l[D]=l[U]=1,u.fromBufferAttribute(n,z),f.fromBufferAttribute(n,D),d.fromBufferAttribute(n,U),h.fromBufferAttribute(s,z),_.fromBufferAttribute(s,D),S.fromBufferAttribute(s,U),f.sub(u),d.sub(u),_.sub(h),S.sub(h);const G=1/(_.x*S.y-S.x*_.y);isFinite(G)&&(m.copy(f).multiplyScalar(S.y).addScaledVector(d,-_.y).multiplyScalar(G),p.copy(d).multiplyScalar(_.x).addScaledVector(f,-S.x).multiplyScalar(G),o[z].add(m),o[D].add(m),o[U].add(m),c[z].add(p),c[D].add(p),c[U].add(p))}let w=this.groups;w.length===0&&(w=[{start:0,count:e.count}]);for(let z=0,D=w.length;z<D;++z){const U=w[z],G=U.start,K=U.count;for(let P=G,Y=G+K;P<Y;P+=3)M(e.getX(P+0),e.getX(P+1),e.getX(P+2))}const b=new H,R=new H,A=new H,g=new H;function y(z){A.fromBufferAttribute(r,z),g.copy(A);const D=o[z];b.copy(D),b.sub(A.multiplyScalar(A.dot(D))).normalize(),R.crossVectors(g,D);const G=R.dot(c[z])<0?-1:1;a.setXYZW(z,b.x,b.y,b.z,G)}for(let z=0,D=n.count;z<D;++z)l[z]&&y(z);this._transformed=!0}computeVertexNormals(){const e=this.index,t=this.getAttribute("position");if(t!==void 0){let n=this.getAttribute("normal");if(n===void 0||n.count!==t.count)n=new ei(new Float32Array(t.count*3),3),this.setAttribute("normal",n);else for(let d=0,h=n.count;d<h;d++)n.setXYZ(d,0,0,0);const r=new H,s=new H,a=new H,o=new H,c=new H,l=new H,u=new H,f=new H;if(e)for(let d=0,h=e.count;d<h;d+=3){const _=e.getX(d+0),S=e.getX(d+1),m=e.getX(d+2);r.fromBufferAttribute(t,_),s.fromBufferAttribute(t,S),a.fromBufferAttribute(t,m),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),o.fromBufferAttribute(n,_),c.fromBufferAttribute(n,S),l.fromBufferAttribute(n,m),o.add(u),c.add(u),l.add(u),n.setXYZ(_,o.x,o.y,o.z),n.setXYZ(S,c.x,c.y,c.z),n.setXYZ(m,l.x,l.y,l.z)}else for(let d=0,h=t.count;d<h;d+=3)r.fromBufferAttribute(t,d+0),s.fromBufferAttribute(t,d+1),a.fromBufferAttribute(t,d+2),u.subVectors(a,s),f.subVectors(r,s),u.cross(f),n.setXYZ(d+0,u.x,u.y,u.z),n.setXYZ(d+1,u.x,u.y,u.z),n.setXYZ(d+2,u.x,u.y,u.z);this.normalizeNormals(),n.needsUpdate=!0}}normalizeNormals(){const e=this.attributes.normal;for(let t=0,n=e.count;t<n;t++)Tt.fromBufferAttribute(e,t),Tt.normalize(),e.setXYZ(t,Tt.x,Tt.y,Tt.z)}toNonIndexed(){function e(o,c){const l=o.array,u=o.itemSize,f=o.normalized,d=new l.constructor(c.length*u);let h=0,_=0;for(let S=0,m=c.length;S<m;S++){o.isInterleavedBufferAttribute?h=c[S]*o.data.stride+o.offset:h=c[S]*u;for(let p=0;p<u;p++)d[_++]=l[h++]}return new ei(d,u,f)}if(this.index===null)return Ue("BufferGeometry.toNonIndexed(): BufferGeometry is already non-indexed."),this;const t=new on,n=this.index.array,r=this.attributes;for(const o in r){const c=r[o],l=e(c,n);t.setAttribute(o,l)}const s=this.morphAttributes;for(const o in s){const c=[],l=s[o];for(let u=0,f=l.length;u<f;u++){const d=l[u],h=e(d,n);c.push(h)}t.morphAttributes[o]=c}t.morphTargetsRelative=this.morphTargetsRelative;const a=this.groups;for(let o=0,c=a.length;o<c;o++){const l=a[o];t.addGroup(l.start,l.count,l.materialIndex)}return t}toJSON(){const e={metadata:{version:4.7,type:"BufferGeometry",generator:"BufferGeometry.toJSON"}};if(e.uuid=this.uuid,e.type=this.parameters!==void 0&&this._transformed===!0?"BufferGeometry":this.type,e.name=this.name,Object.keys(this.userData).length>0&&(e.userData=this.userData),this.parameters!==void 0&&this._transformed!==!0){const c=this.parameters;for(const l in c)c[l]!==void 0&&(e[l]=c[l]);return e}e.data={attributes:{}};const t=this.index;t!==null&&(e.data.index={type:t.array.constructor.name,array:Array.prototype.slice.call(t.array)});const n=this.attributes;for(const c in n){const l=n[c];e.data.attributes[c]=l.toJSON(e.data)}const r={};let s=!1;for(const c in this.morphAttributes){const l=this.morphAttributes[c],u=[];for(let f=0,d=l.length;f<d;f++){const h=l[f];u.push(h.toJSON(e.data))}u.length>0&&(r[c]=u,s=!0)}s&&(e.data.morphAttributes=r,e.data.morphTargetsRelative=this.morphTargetsRelative);const a=this.groups;a.length>0&&(e.data.groups=JSON.parse(JSON.stringify(a)));const o=this.boundingSphere;return o!==null&&(e.data.boundingSphere=o.toJSON()),e}clone(){return new this.constructor().copy(this)}copy(e){this.index=null,this.attributes={},this.morphAttributes={},this.groups=[],this.boundingBox=null,this.boundingSphere=null;const t={};this.name=e.name;const n=e.index;n!==null&&this.setIndex(n.clone());const r=e.attributes;for(const l in r){const u=r[l];this.setAttribute(l,u.clone(t))}const s=e.morphAttributes;for(const l in s){const u=[],f=s[l];for(let d=0,h=f.length;d<h;d++)u.push(f[d].clone(t));this.morphAttributes[l]=u}this.morphTargetsRelative=e.morphTargetsRelative;const a=e.groups;for(let l=0,u=a.length;l<u;l++){const f=a[l];this.addGroup(f.start,f.count,f.materialIndex)}const o=e.boundingBox;o!==null&&(this.boundingBox=o.clone());const c=e.boundingSphere;return c!==null&&(this.boundingSphere=c.clone()),this.drawRange.start=e.drawRange.start,this.drawRange.count=e.drawRange.count,this.userData=e.userData,this._transformed=e._transformed,this}dispose(){this.dispatchEvent({type:"dispose"})}}const Cs=new H,Du=new H,Iu=new Be;class Bn{constructor(e=new H(1,0,0),t=0){this.isPlane=!0,this.normal=e,this.constant=t}set(e,t){return this.normal.copy(e),this.constant=t,this}setComponents(e,t,n,r){return this.normal.set(e,t,n),this.constant=r,this}setFromNormalAndCoplanarPoint(e,t){return this.normal.copy(e),this.constant=-t.dot(this.normal),this}setFromCoplanarPoints(e,t,n){const r=Cs.subVectors(n,t).cross(Du.subVectors(e,t)).normalize();return this.setFromNormalAndCoplanarPoint(r,e),this}copy(e){return this.normal.copy(e.normal),this.constant=e.constant,this}normalize(){const e=1/this.normal.length();return this.normal.multiplyScalar(e),this.constant*=e,this}negate(){return this.constant*=-1,this.normal.negate(),this}distanceToPoint(e){return this.normal.dot(e)+this.constant}distanceToSphere(e){return this.distanceToPoint(e.center)-e.radius}projectPoint(e,t){return t.copy(e).addScaledVector(this.normal,-this.distanceToPoint(e))}intersectLine(e,t,n=!0){const r=e.delta(Cs),s=this.normal.dot(r);if(s===0)return this.distanceToPoint(e.start)===0?t.copy(e.start):null;const a=-(e.start.dot(this.normal)+this.constant)/s;return n===!0&&(a<0||a>1)?null:t.copy(e.start).addScaledVector(r,a)}intersectsLine(e){const t=this.distanceToPoint(e.start),n=this.distanceToPoint(e.end);return t<0&&n>0||n<0&&t>0}intersectsBox(e){return e.intersectsPlane(this)}intersectsSphere(e){return e.intersectsPlane(this)}coplanarPoint(e){return e.copy(this.normal).multiplyScalar(-this.constant)}applyMatrix4(e,t){const n=t||Iu.getNormalMatrix(e),r=this.coplanarPoint(Cs).applyMatrix4(e),s=this.normal.applyMatrix3(n).normalize();return this.constant=-r.dot(s),this}translate(e){return this.constant-=e.dot(this.normal),this}equals(e){return e.normal.equals(this.normal)&&e.constant===this.constant}clone(){return new this.constructor().copy(this)}toJSON(){return{normal:this.normal.toArray(),constant:this.constant}}fromJSON(e){return this.normal.fromArray(e.normal),this.constant=e.constant,this}}let Nu=0;class $i extends si{constructor(){super(),this.isMaterial=!0,Object.defineProperty(this,"id",{value:Nu++}),this.uuid=Yi(),this.name="",this.type="Material",this.blending=ki,this.side=ti,this.vertexColors=!1,this.opacity=1,this.transparent=!1,this.alphaHash=!1,this.blendSrc=sl,this.blendDst=al,this.blendEquation=vi,this.blendSrcAlpha=null,this.blendDstAlpha=null,this.blendEquationAlpha=null,this.blendColor=new tt(0,0,0),this.blendAlpha=0,this.depthFunc=Wi,this.depthTest=!0,this.depthWrite=!0,this.stencilWriteMask=255,this.stencilFunc=eu,this.stencilRef=0,this.stencilFuncMask=255,this.stencilFail=cs,this.stencilZFail=cs,this.stencilZPass=cs,this.stencilWrite=!1,this.clippingPlanes=null,this.clipIntersection=!1,this.clipShadows=!1,this.shadowSide=null,this.colorWrite=!0,this.precision=null,this.polygonOffset=!1,this.polygonOffsetFactor=0,this.polygonOffsetUnits=0,this.dithering=!1,this.alphaToCoverage=!1,this.premultipliedAlpha=!1,this.forceSinglePass=!1,this.allowOverride=!0,this.visible=!0,this.toneMapped=!0,this.userData={},this.version=0,this._alphaTest=0}get alphaTest(){return this._alphaTest}set alphaTest(e){this._alphaTest>0!=e>0&&this.version++,this._alphaTest=e}onBeforeRender(){}onBeforeCompile(){}customProgramCacheKey(){return this.onBeforeCompile.toString()}setValues(e){if(e!==void 0)for(const t in e){const n=e[t];if(n===void 0){Ue(`Material: parameter '${t}' has value of undefined.`);continue}const r=this[t];if(r===void 0){Ue(`Material: '${t}' is not a property of THREE.${this.type}.`);continue}r&&r.isColor?r.set(n):r&&r.isVector2&&n&&n.isVector2||r&&r.isEuler&&n&&n.isEuler||r&&r.isVector3&&n&&n.isVector3?r.copy(n):this[t]=n}}toJSON(e){const t=e===void 0||typeof e=="string";t&&(e={textures:{},images:{}});const n={metadata:{version:4.7,type:"Material",generator:"Material.toJSON"}};n.uuid=this.uuid,n.type=this.type,n.blending=this.blending,n.side=this.side,n.shadowSide=this.shadowSide,n.vertexColors=this.vertexColors,n.opacity=this.opacity,n.transparent=this.transparent,n.blendSrc=this.blendSrc,n.blendDst=this.blendDst,n.blendEquation=this.blendEquation,n.blendSrcAlpha=this.blendSrcAlpha,n.blendDstAlpha=this.blendDstAlpha,n.blendEquationAlpha=this.blendEquationAlpha,n.blendColor=this.blendColor.getHex(),n.blendAlpha=this.blendAlpha,n.depthFunc=this.depthFunc,n.depthTest=this.depthTest,n.depthWrite=this.depthWrite,n.colorWrite=this.colorWrite,n.clipIntersection=this.clipIntersection,n.clipShadows=this.clipShadows,n.stencilWriteMask=this.stencilWriteMask,n.stencilFunc=this.stencilFunc,n.stencilRef=this.stencilRef,n.stencilFuncMask=this.stencilFuncMask,n.stencilFail=this.stencilFail,n.stencilZFail=this.stencilZFail,n.stencilZPass=this.stencilZPass,n.stencilWrite=this.stencilWrite,n.polygonOffset=this.polygonOffset,n.polygonOffsetFactor=this.polygonOffsetFactor,n.polygonOffsetUnits=this.polygonOffsetUnits,n.dithering=this.dithering,n.alphaTest=this.alphaTest,n.alphaHash=this.alphaHash,n.alphaToCoverage=this.alphaToCoverage,n.premultipliedAlpha=this.premultipliedAlpha,n.forceSinglePass=this.forceSinglePass,n.allowOverride=this.allowOverride,n.visible=this.visible,n.toneMapped=this.toneMapped,n.name=this.name,this.color&&this.color.isColor&&(n.color=this.color.getHex()),this.roughness!==void 0&&(n.roughness=this.roughness),this.metalness!==void 0&&(n.metalness=this.metalness),this.sheen!==void 0&&(n.sheen=this.sheen),this.sheenColor&&this.sheenColor.isColor&&(n.sheenColor=this.sheenColor.getHex()),this.sheenRoughness!==void 0&&(n.sheenRoughness=this.sheenRoughness),this.emissive&&this.emissive.isColor&&(n.emissive=this.emissive.getHex()),this.emissiveIntensity!==void 0&&(n.emissiveIntensity=this.emissiveIntensity),this.specular&&this.specular.isColor&&(n.specular=this.specular.getHex()),this.specularIntensity!==void 0&&(n.specularIntensity=this.specularIntensity),this.specularColor&&this.specularColor.isColor&&(n.specularColor=this.specularColor.getHex()),this.shininess!==void 0&&(n.shininess=this.shininess),this.clearcoat!==void 0&&(n.clearcoat=this.clearcoat),this.clearcoatRoughness!==void 0&&(n.clearcoatRoughness=this.clearcoatRoughness),this.diffuseRoughness!==void 0&&(n.diffuseRoughness=this.diffuseRoughness),this.diffuseRoughnessMap&&this.diffuseRoughnessMap.isTexture&&(n.diffuseRoughnessMap=this.diffuseRoughnessMap.toJSON(e).uuid),this.clearcoatMap&&this.clearcoatMap.isTexture&&(n.clearcoatMap=this.clearcoatMap.toJSON(e).uuid),this.clearcoatRoughnessMap&&this.clearcoatRoughnessMap.isTexture&&(n.clearcoatRoughnessMap=this.clearcoatRoughnessMap.toJSON(e).uuid),this.clearcoatNormalMap&&this.clearcoatNormalMap.isTexture&&(n.clearcoatNormalMap=this.clearcoatNormalMap.toJSON(e).uuid,n.clearcoatNormalScale=this.clearcoatNormalScale.toArray()),this.sheenColorMap&&this.sheenColorMap.isTexture&&(n.sheenColorMap=this.sheenColorMap.toJSON(e).uuid),this.sheenRoughnessMap&&this.sheenRoughnessMap.isTexture&&(n.sheenRoughnessMap=this.sheenRoughnessMap.toJSON(e).uuid),this.dispersion!==void 0&&(n.dispersion=this.dispersion),this.retroreflectivity!==void 0&&(n.retroreflectivity=this.retroreflectivity),this.iridescence!==void 0&&(n.iridescence=this.iridescence),this.iridescenceIOR!==void 0&&(n.iridescenceIOR=this.iridescenceIOR),this.iridescenceThicknessMinimum!==void 0&&(n.iridescenceThicknessMinimum=this.iridescenceThicknessMinimum),this.iridescenceThicknessMaximum!==void 0&&(n.iridescenceThicknessMaximum=this.iridescenceThicknessMaximum),this.iridescenceMap&&this.iridescenceMap.isTexture&&(n.iridescenceMap=this.iridescenceMap.toJSON(e).uuid),this.iridescenceThicknessMap&&this.iridescenceThicknessMap.isTexture&&(n.iridescenceThicknessMap=this.iridescenceThicknessMap.toJSON(e).uuid),this.anisotropy!==void 0&&(n.anisotropy=this.anisotropy),this.anisotropyRotation!==void 0&&(n.anisotropyRotation=this.anisotropyRotation),this.anisotropyMap&&this.anisotropyMap.isTexture&&(n.anisotropyMap=this.anisotropyMap.toJSON(e).uuid),this.map&&this.map.isTexture&&(n.map=this.map.toJSON(e).uuid),this.matcap&&this.matcap.isTexture&&(n.matcap=this.matcap.toJSON(e).uuid),this.alphaMap&&this.alphaMap.isTexture&&(n.alphaMap=this.alphaMap.toJSON(e).uuid),this.lightMap&&this.lightMap.isTexture&&(n.lightMap=this.lightMap.toJSON(e).uuid,n.lightMapIntensity=this.lightMapIntensity),this.aoMap&&this.aoMap.isTexture&&(n.aoMap=this.aoMap.toJSON(e).uuid,n.aoMapIntensity=this.aoMapIntensity),this.bumpMap&&this.bumpMap.isTexture&&(n.bumpMap=this.bumpMap.toJSON(e).uuid,n.bumpScale=this.bumpScale),this.normalMap&&this.normalMap.isTexture&&(n.normalMap=this.normalMap.toJSON(e).uuid,n.normalMapType=this.normalMapType,n.normalScale=this.normalScale.toArray()),this.displacementMap&&this.displacementMap.isTexture&&(n.displacementMap=this.displacementMap.toJSON(e).uuid,n.displacementScale=this.displacementScale,n.displacementBias=this.displacementBias),this.roughnessMap&&this.roughnessMap.isTexture&&(n.roughnessMap=this.roughnessMap.toJSON(e).uuid),this.metalnessMap&&this.metalnessMap.isTexture&&(n.metalnessMap=this.metalnessMap.toJSON(e).uuid),this.emissiveMap&&this.emissiveMap.isTexture&&(n.emissiveMap=this.emissiveMap.toJSON(e).uuid),this.specularMap&&this.specularMap.isTexture&&(n.specularMap=this.specularMap.toJSON(e).uuid),this.specularIntensityMap&&this.specularIntensityMap.isTexture&&(n.specularIntensityMap=this.specularIntensityMap.toJSON(e).uuid),this.specularColorMap&&this.specularColorMap.isTexture&&(n.specularColorMap=this.specularColorMap.toJSON(e).uuid),this.envMap&&this.envMap.isTexture&&(n.envMap=this.envMap.toJSON(e).uuid,this.combine!==void 0&&(n.combine=this.combine)),this.envMapRotation!==void 0&&(n.envMapRotation=this.envMapRotation.toArray()),this.envMapIntensity!==void 0&&(n.envMapIntensity=this.envMapIntensity),this.reflectivity!==void 0&&(n.reflectivity=this.reflectivity),this.refractionRatio!==void 0&&(n.refractionRatio=this.refractionRatio),this.gradientMap&&this.gradientMap.isTexture&&(n.gradientMap=this.gradientMap.toJSON(e).uuid),this.transmission!==void 0&&(n.transmission=this.transmission),this.transmissionMap&&this.transmissionMap.isTexture&&(n.transmissionMap=this.transmissionMap.toJSON(e).uuid),this.thickness!==void 0&&(n.thickness=this.thickness),this.thicknessMap&&this.thicknessMap.isTexture&&(n.thicknessMap=this.thicknessMap.toJSON(e).uuid),this.attenuationDistance!==void 0&&(n.attenuationDistance=this.attenuationDistance),this.attenuationColor!==void 0&&(n.attenuationColor=this.attenuationColor.getHex()),this.size!==void 0&&(n.size=this.size),this.sizeAttenuation!==void 0&&(n.sizeAttenuation=this.sizeAttenuation),Array.isArray(this.clippingPlanes)&&this.clippingPlanes.length>0&&(n.clippingPlanes=this.clippingPlanes.map(s=>s.toJSON())),this.rotation!==void 0&&(n.rotation=this.rotation),this.depthPacking!==void 0&&(n.depthPacking=this.depthPacking),this.linewidth!==void 0&&(n.linewidth=this.linewidth),this.linecap!==void 0&&(n.linecap=this.linecap),this.linejoin!==void 0&&(n.linejoin=this.linejoin),this.dashSize!==void 0&&(n.dashSize=this.dashSize),this.gapSize!==void 0&&(n.gapSize=this.gapSize),this.scale!==void 0&&(n.scale=this.scale),this.wireframe!==void 0&&(n.wireframe=this.wireframe),this.wireframeLinewidth!==void 0&&(n.wireframeLinewidth=this.wireframeLinewidth),this.wireframeLinecap!==void 0&&(n.wireframeLinecap=this.wireframeLinecap),this.wireframeLinejoin!==void 0&&(n.wireframeLinejoin=this.wireframeLinejoin),this.flatShading!==void 0&&(n.flatShading=this.flatShading),this.fog!==void 0&&(n.fog=this.fog),Object.keys(this.userData).length>0&&(n.userData=this.userData);function r(s){const a=[];for(const o in s){const c=s[o];delete c.metadata,a.push(c)}return a}if(t){const s=r(e.textures),a=r(e.images);s.length>0&&(n.textures=s),a.length>0&&(n.images=a)}return n}fromJSON(e,t){if(e.uuid!==void 0&&(this.uuid=e.uuid),e.name!==void 0&&(this.name=e.name),e.color!==void 0&&this.color!==void 0&&this.color.setHex(e.color),e.roughness!==void 0&&(this.roughness=e.roughness),e.metalness!==void 0&&(this.metalness=e.metalness),e.sheen!==void 0&&(this.sheen=e.sheen),e.sheenColor!==void 0&&(this.sheenColor=new tt().setHex(e.sheenColor)),e.sheenRoughness!==void 0&&(this.sheenRoughness=e.sheenRoughness),e.emissive!==void 0&&this.emissive!==void 0&&this.emissive.setHex(e.emissive),e.specular!==void 0&&this.specular!==void 0&&this.specular.setHex(e.specular),e.specularIntensity!==void 0&&(this.specularIntensity=e.specularIntensity),e.specularColor!==void 0&&this.specularColor!==void 0&&this.specularColor.setHex(e.specularColor),e.shininess!==void 0&&(this.shininess=e.shininess),e.clearcoat!==void 0&&(this.clearcoat=e.clearcoat),e.clearcoatRoughness!==void 0&&(this.clearcoatRoughness=e.clearcoatRoughness),e.diffuseRoughness!==void 0&&(this.diffuseRoughness=e.diffuseRoughness),e.dispersion!==void 0&&(this.dispersion=e.dispersion),e.retroreflectivity!==void 0&&(this.retroreflectivity=e.retroreflectivity),e.iridescence!==void 0&&(this.iridescence=e.iridescence),e.iridescenceIOR!==void 0&&(this.iridescenceIOR=e.iridescenceIOR),e.iridescenceThicknessMinimum!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessMinimum),e.iridescenceThicknessMaximum!==void 0&&(this.iridescenceThicknessMaximum=e.iridescenceThicknessMaximum),e.iridescenceThicknessRange!==void 0&&(this.iridescenceThicknessMinimum=e.iridescenceThicknessRange[0],this.iridescenceThicknessMaximum=e.iridescenceThicknessRange[1]),e.transmission!==void 0&&(this.transmission=e.transmission),e.thickness!==void 0&&(this.thickness=e.thickness),e.attenuationDistance!==void 0&&(this.attenuationDistance=e.attenuationDistance),e.attenuationColor!==void 0&&this.attenuationColor!==void 0&&this.attenuationColor.setHex(e.attenuationColor),e.anisotropy!==void 0&&(this.anisotropy=e.anisotropy),e.anisotropyRotation!==void 0&&(this.anisotropyRotation=e.anisotropyRotation),e.fog!==void 0&&(this.fog=e.fog),e.flatShading!==void 0&&(this.flatShading=e.flatShading),e.blending!==void 0&&(this.blending=e.blending),e.combine!==void 0&&(this.combine=e.combine),e.side!==void 0&&(this.side=e.side),e.shadowSide!==void 0&&(this.shadowSide=e.shadowSide),e.opacity!==void 0&&(this.opacity=e.opacity),e.transparent!==void 0&&(this.transparent=e.transparent),e.alphaTest!==void 0&&(this.alphaTest=e.alphaTest),e.alphaHash!==void 0&&(this.alphaHash=e.alphaHash),e.depthFunc!==void 0&&(this.depthFunc=e.depthFunc),e.depthTest!==void 0&&(this.depthTest=e.depthTest),e.depthWrite!==void 0&&(this.depthWrite=e.depthWrite),e.colorWrite!==void 0&&(this.colorWrite=e.colorWrite),e.clippingPlanes!==void 0&&(this.clippingPlanes=e.clippingPlanes.map(n=>new Bn().fromJSON(n))),e.clipIntersection!==void 0&&(this.clipIntersection=e.clipIntersection),e.clipShadows!==void 0&&(this.clipShadows=e.clipShadows),e.depthPacking!==void 0&&(this.depthPacking=e.depthPacking),e.blendSrc!==void 0&&(this.blendSrc=e.blendSrc),e.blendDst!==void 0&&(this.blendDst=e.blendDst),e.blendEquation!==void 0&&(this.blendEquation=e.blendEquation),e.blendSrcAlpha!==void 0&&(this.blendSrcAlpha=e.blendSrcAlpha),e.blendDstAlpha!==void 0&&(this.blendDstAlpha=e.blendDstAlpha),e.blendEquationAlpha!==void 0&&(this.blendEquationAlpha=e.blendEquationAlpha),e.blendColor!==void 0&&this.blendColor!==void 0&&this.blendColor.setHex(e.blendColor),e.blendAlpha!==void 0&&(this.blendAlpha=e.blendAlpha),e.stencilWriteMask!==void 0&&(this.stencilWriteMask=e.stencilWriteMask),e.stencilFunc!==void 0&&(this.stencilFunc=e.stencilFunc),e.stencilRef!==void 0&&(this.stencilRef=e.stencilRef),e.stencilFuncMask!==void 0&&(this.stencilFuncMask=e.stencilFuncMask),e.stencilFail!==void 0&&(this.stencilFail=e.stencilFail),e.stencilZFail!==void 0&&(this.stencilZFail=e.stencilZFail),e.stencilZPass!==void 0&&(this.stencilZPass=e.stencilZPass),e.stencilWrite!==void 0&&(this.stencilWrite=e.stencilWrite),e.wireframe!==void 0&&(this.wireframe=e.wireframe),e.wireframeLinewidth!==void 0&&(this.wireframeLinewidth=e.wireframeLinewidth),e.wireframeLinecap!==void 0&&(this.wireframeLinecap=e.wireframeLinecap),e.wireframeLinejoin!==void 0&&(this.wireframeLinejoin=e.wireframeLinejoin),e.rotation!==void 0&&(this.rotation=e.rotation),e.linewidth!==void 0&&(this.linewidth=e.linewidth),e.linecap!==void 0&&(this.linecap=e.linecap),e.linejoin!==void 0&&(this.linejoin=e.linejoin),e.dashSize!==void 0&&(this.dashSize=e.dashSize),e.gapSize!==void 0&&(this.gapSize=e.gapSize),e.scale!==void 0&&(this.scale=e.scale),e.polygonOffset!==void 0&&(this.polygonOffset=e.polygonOffset),e.polygonOffsetFactor!==void 0&&(this.polygonOffsetFactor=e.polygonOffsetFactor),e.polygonOffsetUnits!==void 0&&(this.polygonOffsetUnits=e.polygonOffsetUnits),e.dithering!==void 0&&(this.dithering=e.dithering),e.alphaToCoverage!==void 0&&(this.alphaToCoverage=e.alphaToCoverage),e.premultipliedAlpha!==void 0&&(this.premultipliedAlpha=e.premultipliedAlpha),e.forceSinglePass!==void 0&&(this.forceSinglePass=e.forceSinglePass),e.allowOverride!==void 0&&(this.allowOverride=e.allowOverride),e.visible!==void 0&&(this.visible=e.visible),e.toneMapped!==void 0&&(this.toneMapped=e.toneMapped),e.userData!==void 0&&(this.userData=e.userData),e.vertexColors!==void 0&&(typeof e.vertexColors=="number"?this.vertexColors=e.vertexColors>0:this.vertexColors=e.vertexColors),e.size!==void 0&&(this.size=e.size),e.sizeAttenuation!==void 0&&(this.sizeAttenuation=e.sizeAttenuation),e.map!==void 0&&(this.map=t[e.map]||null),e.matcap!==void 0&&(this.matcap=t[e.matcap]||null),e.alphaMap!==void 0&&(this.alphaMap=t[e.alphaMap]||null),e.bumpMap!==void 0&&(this.bumpMap=t[e.bumpMap]||null),e.bumpScale!==void 0&&(this.bumpScale=e.bumpScale),e.normalMap!==void 0&&(this.normalMap=t[e.normalMap]||null),e.normalMapType!==void 0&&(this.normalMapType=e.normalMapType),e.normalScale!==void 0){let n=e.normalScale;Array.isArray(n)===!1&&(n=[n,n]),this.normalScale=new Ze().fromArray(n)}return e.displacementMap!==void 0&&(this.displacementMap=t[e.displacementMap]||null),e.displacementScale!==void 0&&(this.displacementScale=e.displacementScale),e.displacementBias!==void 0&&(this.displacementBias=e.displacementBias),e.roughnessMap!==void 0&&(this.roughnessMap=t[e.roughnessMap]||null),e.metalnessMap!==void 0&&(this.metalnessMap=t[e.metalnessMap]||null),e.emissiveMap!==void 0&&(this.emissiveMap=t[e.emissiveMap]||null),e.emissiveIntensity!==void 0&&(this.emissiveIntensity=e.emissiveIntensity),e.specularMap!==void 0&&(this.specularMap=t[e.specularMap]||null),e.specularIntensityMap!==void 0&&(this.specularIntensityMap=t[e.specularIntensityMap]||null),e.specularColorMap!==void 0&&(this.specularColorMap=t[e.specularColorMap]||null),e.envMap!==void 0&&(this.envMap=t[e.envMap]||null),e.envMapRotation!==void 0&&this.envMapRotation.fromArray(e.envMapRotation),e.envMapIntensity!==void 0&&(this.envMapIntensity=e.envMapIntensity),e.reflectivity!==void 0&&(this.reflectivity=e.reflectivity),e.refractionRatio!==void 0&&(this.refractionRatio=e.refractionRatio),e.lightMap!==void 0&&(this.lightMap=t[e.lightMap]||null),e.lightMapIntensity!==void 0&&(this.lightMapIntensity=e.lightMapIntensity),e.aoMap!==void 0&&(this.aoMap=t[e.aoMap]||null),e.aoMapIntensity!==void 0&&(this.aoMapIntensity=e.aoMapIntensity),e.gradientMap!==void 0&&(this.gradientMap=t[e.gradientMap]||null),e.clearcoatMap!==void 0&&(this.clearcoatMap=t[e.clearcoatMap]||null),e.clearcoatRoughnessMap!==void 0&&(this.clearcoatRoughnessMap=t[e.clearcoatRoughnessMap]||null),e.clearcoatNormalMap!==void 0&&(this.clearcoatNormalMap=t[e.clearcoatNormalMap]||null),e.clearcoatNormalScale!==void 0&&(this.clearcoatNormalScale=new Ze().fromArray(e.clearcoatNormalScale)),e.diffuseRoughnessMap!==void 0&&(this.diffuseRoughnessMap=t[e.diffuseRoughnessMap]||null),e.iridescenceMap!==void 0&&(this.iridescenceMap=t[e.iridescenceMap]||null),e.iridescenceThicknessMap!==void 0&&(this.iridescenceThicknessMap=t[e.iridescenceThicknessMap]||null),e.transmissionMap!==void 0&&(this.transmissionMap=t[e.transmissionMap]||null),e.thicknessMap!==void 0&&(this.thicknessMap=t[e.thicknessMap]||null),e.anisotropyMap!==void 0&&(this.anisotropyMap=t[e.anisotropyMap]||null),e.sheenColorMap!==void 0&&(this.sheenColorMap=t[e.sheenColorMap]||null),e.sheenRoughnessMap!==void 0&&(this.sheenRoughnessMap=t[e.sheenRoughnessMap]||null),this}clone(){return new this.constructor().copy(this)}copy(e){this.name=e.name,this.blending=e.blending,this.side=e.side,this.vertexColors=e.vertexColors,this.opacity=e.opacity,this.transparent=e.transparent,this.blendSrc=e.blendSrc,this.blendDst=e.blendDst,this.blendEquation=e.blendEquation,this.blendSrcAlpha=e.blendSrcAlpha,this.blendDstAlpha=e.blendDstAlpha,this.blendEquationAlpha=e.blendEquationAlpha,this.blendColor.copy(e.blendColor),this.blendAlpha=e.blendAlpha,this.depthFunc=e.depthFunc,this.depthTest=e.depthTest,this.depthWrite=e.depthWrite,this.stencilWriteMask=e.stencilWriteMask,this.stencilFunc=e.stencilFunc,this.stencilRef=e.stencilRef,this.stencilFuncMask=e.stencilFuncMask,this.stencilFail=e.stencilFail,this.stencilZFail=e.stencilZFail,this.stencilZPass=e.stencilZPass,this.stencilWrite=e.stencilWrite;const t=e.clippingPlanes;let n=null;if(t!==null){const r=t.length;n=new Array(r);for(let s=0;s!==r;++s)n[s]=t[s].clone()}return this.clippingPlanes=n,this.clipIntersection=e.clipIntersection,this.clipShadows=e.clipShadows,this.shadowSide=e.shadowSide,this.colorWrite=e.colorWrite,this.precision=e.precision,this.polygonOffset=e.polygonOffset,this.polygonOffsetFactor=e.polygonOffsetFactor,this.polygonOffsetUnits=e.polygonOffsetUnits,this.dithering=e.dithering,this.alphaTest=e.alphaTest,this.alphaHash=e.alphaHash,this.alphaToCoverage=e.alphaToCoverage,this.premultipliedAlpha=e.premultipliedAlpha,this.forceSinglePass=e.forceSinglePass,this.allowOverride=e.allowOverride,this.visible=e.visible,this.toneMapped=e.toneMapped,this.userData=JSON.parse(JSON.stringify(e.userData)),this}dispose(){this.dispatchEvent({type:"dispose"})}set needsUpdate(e){e===!0&&this.version++}}const yn=new H,Ps=new H,fr=new H,pr=new H;class Dl{constructor(e=new H,t=new H(0,0,-1)){this.origin=e,this.direction=t}set(e,t){return this.origin.copy(e),this.direction.copy(t),this}copy(e){return this.origin.copy(e.origin),this.direction.copy(e.direction),this}at(e,t){return t.copy(this.origin).addScaledVector(this.direction,e)}lookAt(e){return this.direction.copy(e).sub(this.origin).normalize(),this}recast(e){return this.origin.copy(this.at(e,yn)),this}closestPointToPoint(e,t){t.subVectors(e,this.origin);const n=t.dot(this.direction);return n<0?t.copy(this.origin):t.copy(this.origin).addScaledVector(this.direction,n)}distanceToPoint(e){return Math.sqrt(this.distanceSqToPoint(e))}distanceSqToPoint(e){const t=yn.subVectors(e,this.origin).dot(this.direction);return t<0?this.origin.distanceToSquared(e):(yn.copy(this.origin).addScaledVector(this.direction,t),yn.distanceToSquared(e))}distanceSqToSegment(e,t,n,r){Ps.copy(e).add(t).multiplyScalar(.5),fr.copy(t).sub(e).normalize(),pr.copy(this.origin).sub(Ps);const s=e.distanceTo(t)*.5,a=-this.direction.dot(fr),o=pr.dot(this.direction),c=-pr.dot(fr),l=pr.lengthSq(),u=Math.abs(1-a*a);let f,d,h,_;if(u>0)if(f=a*c-o,d=a*o-c,_=s*u,f>=0)if(d>=-_)if(d<=_){const S=1/u;f*=S,d*=S,h=f*(f+a*d+2*o)+d*(a*f+d+2*c)+l}else d=s,f=Math.max(0,-(a*d+o)),h=-f*f+d*(d+2*c)+l;else d=-s,f=Math.max(0,-(a*d+o)),h=-f*f+d*(d+2*c)+l;else d<=-_?(f=Math.max(0,-(-a*s+o)),d=f>0?-s:Math.min(Math.max(-s,-c),s),h=-f*f+d*(d+2*c)+l):d<=_?(f=0,d=Math.min(Math.max(-s,-c),s),h=d*(d+2*c)+l):(f=Math.max(0,-(a*s+o)),d=f>0?s:Math.min(Math.max(-s,-c),s),h=-f*f+d*(d+2*c)+l);else d=a>0?-s:s,f=Math.max(0,-(a*d+o)),h=-f*f+d*(d+2*c)+l;return n&&n.copy(this.origin).addScaledVector(this.direction,f),r&&r.copy(Ps).addScaledVector(fr,d),h}intersectSphere(e,t){if(e.radius<0)return null;yn.subVectors(e.center,this.origin);const n=yn.dot(this.direction),r=yn.dot(yn)-n*n,s=e.radius*e.radius;if(r>s)return null;const a=Math.sqrt(s-r),o=n-a,c=n+a;return c<0?null:o<0?this.at(c,t):this.at(o,t)}intersectsSphere(e){return e.radius<0?!1:this.distanceSqToPoint(e.center)<=e.radius*e.radius}distanceToPlane(e){const t=e.normal.dot(this.direction);if(t===0)return e.distanceToPoint(this.origin)===0?0:null;const n=-(this.origin.dot(e.normal)+e.constant)/t;return n>=0?n:null}intersectPlane(e,t){const n=this.distanceToPlane(e);return n===null?null:this.at(n,t)}intersectsPlane(e){const t=e.distanceToPoint(this.origin);return t===0||e.normal.dot(this.direction)*t<0}intersectBox(e,t){let n,r,s,a,o,c;const l=1/this.direction.x,u=1/this.direction.y,f=1/this.direction.z,d=this.origin;return l>=0?(n=(e.min.x-d.x)*l,r=(e.max.x-d.x)*l):(n=(e.max.x-d.x)*l,r=(e.min.x-d.x)*l),u>=0?(s=(e.min.y-d.y)*u,a=(e.max.y-d.y)*u):(s=(e.max.y-d.y)*u,a=(e.min.y-d.y)*u),n>a||s>r||((s>n||isNaN(n))&&(n=s),(a<r||isNaN(r))&&(r=a),f>=0?(o=(e.min.z-d.z)*f,c=(e.max.z-d.z)*f):(o=(e.max.z-d.z)*f,c=(e.min.z-d.z)*f),n>c||o>r)||((o>n||n!==n)&&(n=o),(c<r||r!==r)&&(r=c),r<0)?null:this.at(n>=0?n:r,t)}intersectsBox(e){return this.intersectBox(e,yn)!==null}intersectTriangle(e,t,n,r,s){const a=this.origin,o=this.direction,c=o.x,l=o.y,u=o.z,f=e.x-a.x,d=e.y-a.y,h=e.z-a.z,_=t.x-a.x,S=t.y-a.y,m=t.z-a.z,p=n.x-a.x,M=n.y-a.y,w=n.z-a.z,b=Math.abs(c),R=Math.abs(l),A=Math.abs(u);let g,y,z,D,U,G,K,P,Y,Z,X,ie;if(b>=R&&b>=A?(z=c,G=f,Y=_,ie=p,c>=0?(g=l,y=u,D=d,U=h,K=S,P=m,Z=M,X=w):(g=u,y=l,D=h,U=d,K=m,P=S,Z=w,X=M)):R>=A?(z=l,G=d,Y=S,ie=M,l>=0?(g=u,y=c,D=h,U=f,K=m,P=_,Z=w,X=p):(g=c,y=u,D=f,U=h,K=_,P=m,Z=p,X=w)):(z=u,G=h,Y=m,ie=w,u>=0?(g=c,y=l,D=f,U=d,K=_,P=S,Z=p,X=M):(g=l,y=c,D=d,U=f,K=S,P=_,Z=M,X=p)),z===0)return null;const q=g/z,j=y/z,ee=1/z,Se=D-q*G,Fe=U-j*G,J=K-q*Y,pe=P-j*Y,ve=Z-q*ie,Pe=X-j*ie,me=ve*pe-Pe*J,Oe=Se*Pe-Fe*ve,ht=J*Fe-pe*Se;if(r){if(me<0||Oe<0||ht<0)return null}else if((me<0||Oe<0||ht<0)&&(me>0||Oe>0||ht>0))return null;const De=me+Oe+ht;if(De===0)return null;const Je=ee*(me*G+Oe*Y+ht*ie);return(De>0?Je<0:Je>0)?null:this.at(Je/De,s)}applyMatrix4(e){return this.origin.applyMatrix4(e),this.direction.transformDirection(e),this}equals(e){return e.origin.equals(this.origin)&&e.direction.equals(this.direction)}clone(){return new this.constructor().copy(this)}}class bn extends $i{constructor(e){super(),this.isMeshBasicMaterial=!0,this.type="MeshBasicMaterial",this.color=new tt(16777215),this.map=null,this.lightMap=null,this.lightMapIntensity=1,this.aoMap=null,this.aoMapIntensity=1,this.specularMap=null,this.alphaMap=null,this.envMap=null,this.envMapRotation=new ii,this.combine=ol,this.reflectivity=1,this.refractionRatio=.98,this.wireframe=!1,this.wireframeLinewidth=1,this.wireframeLinecap="round",this.wireframeLinejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.lightMap=e.lightMap,this.lightMapIntensity=e.lightMapIntensity,this.aoMap=e.aoMap,this.aoMapIntensity=e.aoMapIntensity,this.specularMap=e.specularMap,this.alphaMap=e.alphaMap,this.envMap=e.envMap,this.envMapRotation.copy(e.envMapRotation),this.combine=e.combine,this.reflectivity=e.reflectivity,this.refractionRatio=e.refractionRatio,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.wireframeLinecap=e.wireframeLinecap,this.wireframeLinejoin=e.wireframeLinejoin,this.fog=e.fog,this}}const To=new pt,Qn=new Dl,mr=new Zr,Ao=new H,gr=new H,_r=new H,xr=new H,Ls=new H,vr=new H,wo=new H,Sr=new H;class Bt extends Xt{constructor(e=new on,t=new bn){super(),this.isMesh=!0,this.type="Mesh",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.count=1,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}getVertexPosition(e,t){const n=this.geometry,r=n.attributes.position,s=n.morphAttributes.position,a=n.morphTargetsRelative;t.fromBufferAttribute(r,e);const o=this.morphTargetInfluences;if(s&&o){vr.set(0,0,0);for(let c=0,l=s.length;c<l;c++){const u=o[c],f=s[c];u!==0&&(Ls.fromBufferAttribute(f,e),a?vr.addScaledVector(Ls,u):vr.addScaledVector(Ls.sub(t),u))}t.add(vr)}return t}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,r=this.material,s=this.matrixWorld;r!==void 0&&(n.boundingSphere===null&&n.computeBoundingSphere(),mr.copy(n.boundingSphere),mr.applyMatrix4(s),Qn.copy(e.ray).recast(e.near),!(mr.containsPoint(Qn.origin)===!1&&(Qn.intersectSphere(mr,Ao)===null||Qn.origin.distanceToSquared(Ao)>(e.far-e.near)**2))&&(To.copy(s).invert(),Qn.copy(e.ray).applyMatrix4(To),!(n.boundingBox!==null&&Qn.intersectsBox(n.boundingBox)===!1)&&this._computeIntersections(e,t,Qn)))}_computeIntersections(e,t,n){let r;const s=this.geometry,a=this.material,o=s.index,c=s.attributes.position,l=s.attributes.uv,u=s.attributes.uv1,f=s.attributes.normal,d=s.groups,h=s.drawRange;if(o!==null)if(Array.isArray(a))for(let _=0,S=d.length;_<S;_++){const m=d[_],p=a[m.materialIndex],M=Math.max(m.start,h.start),w=Math.min(o.count,Math.min(m.start+m.count,h.start+h.count));for(let b=M,R=w;b<R;b+=3){const A=o.getX(b),g=o.getX(b+1),y=o.getX(b+2);r=Mr(this,p,e,n,l,u,f,A,g,y),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const _=Math.max(0,h.start),S=Math.min(o.count,h.start+h.count);for(let m=_,p=S;m<p;m+=3){const M=o.getX(m),w=o.getX(m+1),b=o.getX(m+2);r=Mr(this,a,e,n,l,u,f,M,w,b),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}else if(c!==void 0)if(Array.isArray(a))for(let _=0,S=d.length;_<S;_++){const m=d[_],p=a[m.materialIndex],M=Math.max(m.start,h.start),w=Math.min(c.count,Math.min(m.start+m.count,h.start+h.count));for(let b=M,R=w;b<R;b+=3){const A=b,g=b+1,y=b+2;r=Mr(this,p,e,n,l,u,f,A,g,y),r&&(r.faceIndex=Math.floor(b/3),r.face.materialIndex=m.materialIndex,t.push(r))}}else{const _=Math.max(0,h.start),S=Math.min(c.count,h.start+h.count);for(let m=_,p=S;m<p;m+=3){const M=m,w=m+1,b=m+2;r=Mr(this,a,e,n,l,u,f,M,w,b),r&&(r.faceIndex=Math.floor(m/3),t.push(r))}}}}function Uu(i,e,t,n,r,s,a,o){let c;if(e.side===Wt?c=n.intersectTriangle(a,s,r,!0,o):c=n.intersectTriangle(r,s,a,e.side===ti,o),c===null)return null;Sr.copy(o),Sr.applyMatrix4(i.matrixWorld);const l=t.ray.origin.distanceTo(Sr);return l<t.near||l>t.far?null:{distance:l,point:Sr.clone(),object:i}}function Mr(i,e,t,n,r,s,a,o,c,l){i.getVertexPosition(o,gr),i.getVertexPosition(c,_r),i.getVertexPosition(l,xr);const u=Uu(i,e,t,n,gr,_r,xr,wo);if(u){const f=new H;sn.getBarycoord(wo,gr,_r,xr,f),r&&(u.uv=sn.getInterpolatedAttribute(r,o,c,l,f,new Ze)),s&&(u.uv1=sn.getInterpolatedAttribute(s,o,c,l,f,new Ze)),a&&(u.normal=sn.getInterpolatedAttribute(a,o,c,l,f,new H),u.normal.dot(n.direction)>0&&u.normal.multiplyScalar(-1));const d={a:o,b:c,c:l,normal:new H,materialIndex:0};sn.getNormal(gr,_r,xr,d.normal),u.face=d,u.barycoord=f}return u}class Fu extends It{constructor(e=null,t=1,n=1,r,s,a,o,c,l=Rt,u=Rt,f,d){super(null,a,o,c,l,u,r,s,f,d),this.isDataTexture=!0,this.image={data:e,width:t,height:n},this.generateMipmaps=!1,this.flipY=!1,this.unpackAlignment=1}}const jn=new Zr,Ou=new Ze(.5,.5),Er=new H;class Wr{constructor(e=new Bn,t=new Bn,n=new Bn,r=new Bn,s=new Bn,a=new Bn){this.planes=[e,t,n,r,s,a]}set(e,t,n,r,s,a){const o=this.planes;return o[0].copy(e),o[1].copy(t),o[2].copy(n),o[3].copy(r),o[4].copy(s),o[5].copy(a),this}copy(e){const t=this.planes;for(let n=0;n<6;n++)t[n].copy(e.planes[n]);return this}setFromProjectionMatrix(e,t=an,n=!1){const r=this.planes,s=e.elements,a=s[0],o=s[1],c=s[2],l=s[3],u=s[4],f=s[5],d=s[6],h=s[7],_=s[8],S=s[9],m=s[10],p=s[11],M=s[12],w=s[13],b=s[14],R=s[15];if(r[0].setComponents(l-a,h-u,p-_,R-M).normalize(),r[1].setComponents(l+a,h+u,p+_,R+M).normalize(),r[2].setComponents(l+o,h+f,p+S,R+w).normalize(),r[3].setComponents(l-o,h-f,p-S,R-w).normalize(),n)r[4].setComponents(c,d,m,b).normalize(),r[5].setComponents(l-c,h-d,p-m,R-b).normalize();else if(r[4].setComponents(l-c,h-d,p-m,R-b).normalize(),t===an)r[5].setComponents(l+c,h+d,p+m,R+b).normalize();else if(t===kr)r[5].setComponents(c,d,m,b).normalize();else throw new Error("THREE.Frustum.setFromProjectionMatrix(): Invalid coordinate system: "+t);return this}intersectsObject(e){if(e.boundingSphere!==void 0)e.boundingSphere===null&&e.computeBoundingSphere(),jn.copy(e.boundingSphere).applyMatrix4(e.matrixWorld);else{const t=e.geometry;t.boundingSphere===null&&t.computeBoundingSphere(),jn.copy(t.boundingSphere).applyMatrix4(e.matrixWorld)}return this.intersectsSphere(jn)}intersectsSprite(e){jn.center.set(0,0,0);const t=Ou.distanceTo(e.center);return jn.radius=.7071067811865476+t,jn.applyMatrix4(e.matrixWorld),this.intersectsSphere(jn)}intersectsSphere(e){const t=this.planes,n=e.center,r=-e.radius;for(let s=0;s<6;s++)if(t[s].distanceToPoint(n)<r)return!1;return!0}intersectsBox(e){const t=this.planes;for(let n=0;n<6;n++){const r=t[n];if(Er.x=r.normal.x>0?e.max.x:e.min.x,Er.y=r.normal.y>0?e.max.y:e.min.y,Er.z=r.normal.z>0?e.max.z:e.min.z,r.distanceToPoint(Er)<0)return!1}return!0}containsPoint(e){const t=this.planes;for(let n=0;n<6;n++)if(t[n].distanceToPoint(e)<0)return!1;return!0}clone(){return new this.constructor().copy(this)}}const Ro=new pt;class Ua{constructor(){this.coordinateSystem=an,this._frustums=[],this._count=0}setFromArrayCamera(e){const t=e.cameras,n=this._frustums;for(let r=0;r<t.length;r++){const s=t[r];Ro.multiplyMatrices(s.projectionMatrix,s.matrixWorldInverse),n[r]===void 0&&(n[r]=new Wr),n[r].setFromProjectionMatrix(Ro,s.coordinateSystem,s.reversedDepth)}return this._count=t.length,this}getFrustum(e){return this._frustums[e]}intersectsObject(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsObject(e))return!0;return!1}intersectsSprite(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSprite(e))return!0;return!1}intersectsSphere(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsSphere(e))return!0;return!1}intersectsBox(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].intersectsBox(e))return!0;return!1}containsPoint(e){const t=this._frustums;for(let n=0;n<this._count;n++)if(t[n].containsPoint(e))return!0;return!1}copy(e){this.coordinateSystem=e.coordinateSystem;const t=this._frustums,n=e._frustums;for(let r=0;r<e._count;r++)t[r]===void 0&&(t[r]=new Wr),t[r].copy(n[r]);return this._count=e._count,this}clone(){return new Ua().copy(this)}}class Il extends $i{constructor(e){super(),this.isLineBasicMaterial=!0,this.type="LineBasicMaterial",this.color=new tt(16777215),this.map=null,this.linewidth=1,this.linecap="round",this.linejoin="round",this.fog=!0,this.setValues(e)}copy(e){return super.copy(e),this.color.copy(e.color),this.map=e.map,this.linewidth=e.linewidth,this.linecap=e.linecap,this.linejoin=e.linejoin,this.fog=e.fog,this}}const Xr=new H,qr=new H,Co=new pt,Fi=new Dl,yr=new Zr,Ds=new H,Po=new H;class Bu extends Xt{constructor(e=new on,t=new Il){super(),this.isLine=!0,this.type="Line",this.geometry=e,this.material=t,this.morphTargetDictionary=void 0,this.morphTargetInfluences=void 0,this.updateMorphTargets()}copy(e,t){return super.copy(e,t),e.morphTargetInfluences!==void 0?this.morphTargetInfluences=e.morphTargetInfluences.slice():this.morphTargetInfluences=void 0,e.morphTargetDictionary!==void 0?this.morphTargetDictionary=Object.assign({},e.morphTargetDictionary):this.morphTargetDictionary=void 0,this.material=Array.isArray(e.material)?e.material.slice():e.material,this.geometry=e.geometry,this}computeLineDistances(){const e=this.geometry;if(e.index===null){const t=e.attributes.position,n=[0];for(let r=1,s=t.count;r<s;r++)Xr.fromBufferAttribute(t,r-1),qr.fromBufferAttribute(t,r),n[r]=n[r-1],n[r]+=Xr.distanceTo(qr);e.setAttribute("lineDistance",new Nt(n,1))}else Ue("Line.computeLineDistances(): Computation only possible with non-indexed BufferGeometry.");return this}intersectsFrustum(e){return e.intersectsObject(this)}raycast(e,t){const n=this.geometry,r=this.matrixWorld,s=e.params.Line.threshold,a=n.drawRange;if(n.boundingSphere===null&&n.computeBoundingSphere(),yr.copy(n.boundingSphere),yr.applyMatrix4(r),yr.radius+=s,e.ray.intersectsSphere(yr)===!1)return;Co.copy(r).invert(),Fi.copy(e.ray).applyMatrix4(Co);const o=s/((this.scale.x+this.scale.y+this.scale.z)/3),c=o*o,l=this.isLineSegments?2:1,u=n.index,d=n.attributes.position;if(u!==null){const h=Math.max(0,a.start),_=Math.min(u.count,a.start+a.count);for(let S=h,m=_-1;S<m;S+=l){const p=u.getX(S),M=u.getX(S+1),w=br(this,e,Fi,c,p,M,S);w&&t.push(w)}if(this.isLineLoop){const S=u.getX(_-1),m=u.getX(h),p=br(this,e,Fi,c,S,m,_-1);p&&t.push(p)}}else{const h=Math.max(0,a.start),_=Math.min(d.count,a.start+a.count);for(let S=h,m=_-1;S<m;S+=l){const p=br(this,e,Fi,c,S,S+1,S);p&&t.push(p)}if(this.isLineLoop){const S=br(this,e,Fi,c,_-1,h,_-1);S&&t.push(S)}}}updateMorphTargets(){const t=this.geometry.morphAttributes,n=Object.keys(t);if(n.length>0){const r=t[n[0]];if(r!==void 0){this.morphTargetInfluences=[],this.morphTargetDictionary={};for(let s=0,a=r.length;s<a;s++){const o=r[s].name||String(s);this.morphTargetInfluences.push(0),this.morphTargetDictionary[o]=s}}}}}function br(i,e,t,n,r,s,a){const o=i.geometry.attributes.position;if(Xr.fromBufferAttribute(o,r),qr.fromBufferAttribute(o,s),t.distanceSqToSegment(Xr,qr,Ds,Po)>n)return;Ds.applyMatrix4(i.matrixWorld);const l=e.ray.origin.distanceTo(Ds);if(!(l<e.near||l>e.far))return{distance:l,point:Po.clone().applyMatrix4(i.matrixWorld),index:a,face:null,faceIndex:null,barycoord:null,object:i}}class Nl extends It{constructor(e=[],t=Ei,n,r,s,a,o,c,l,u){super(e,t,n,r,s,a,o,c,l,u),this.isCubeTexture=!0,this.flipY=!1}get images(){return this.image}set images(e){this.image=e}}class Is extends It{constructor(e,t,n,r,s,a,o,c,l){super(e,t,n,r,s,a,o,c,l),this.isCanvasTexture=!0,this.needsUpdate=!0}}class bi extends It{constructor(e,t,n=mn,r,s,a,o=Rt,c=Rt,l,u=Vn,f=1){if(u!==Vn&&u!==kn)throw new Error("THREE.DepthTexture: format must be either THREE.DepthFormat or THREE.DepthStencilFormat");const d={width:e,height:t,depth:f};super(d,r,s,a,o,c,u,n,l),this.isDepthTexture=!0,this.flipY=!1,this.generateMipmaps=!1,this.compareFunction=null}copy(e){return super.copy(e),this.source=new Na(Object.assign({},e.image)),this.compareFunction=e.compareFunction,this}toJSON(e){const t=super.toJSON(e);return t.compareFunction=this.compareFunction,t}}class Ul extends bi{constructor(e,t=mn,n=Ei,r,s,a=Rt,o=Rt,c,l=Vn){const u={width:e,height:e,depth:1},f=[u,u,u,u,u,u];super(e,e,t,n,r,s,a,o,c,l),this.image=f,this.isCubeDepthTexture=!0,this.isCubeTexture=!0}get images(){return this.image}set images(e){this.image=e}}class Fl extends It{constructor(e=null){super(),this.sourceTexture=e,this.isExternalTexture=!0}copy(e){return super.copy(e),this.sourceTexture=e.sourceTexture,this}}class Zi extends on{constructor(e=1,t=1,n=1,r=1,s=1,a=1){super(),this.type="BoxGeometry",this.parameters={width:e,height:t,depth:n,widthSegments:r,heightSegments:s,depthSegments:a};const o=this;r=Math.floor(r),s=Math.floor(s),a=Math.floor(a);const c=[],l=[],u=[],f=[];let d=0,h=0;_("z","y","x",-1,-1,n,t,e,a,s,0),_("z","y","x",1,-1,n,t,-e,a,s,1),_("x","z","y",1,1,e,n,t,r,a,2),_("x","z","y",1,-1,e,n,-t,r,a,3),_("x","y","z",1,-1,e,t,n,r,s,4),_("x","y","z",-1,-1,e,t,-n,r,s,5),this.setIndex(c),this.setAttribute("position",new Nt(l,3)),this.setAttribute("normal",new Nt(u,3)),this.setAttribute("uv",new Nt(f,2));function _(S,m,p,M,w,b,R,A,g,y,z){const D=b/g,U=R/y,G=b/2,K=R/2,P=A/2,Y=g+1,Z=y+1;let X=0,ie=0;const q=new H;for(let j=0;j<Z;j++){const ee=j*U-K;for(let Se=0;Se<Y;Se++){const Fe=Se*D-G;q[S]=Fe*M,q[m]=ee*w,q[p]=P,l.push(q.x,q.y,q.z),q[S]=0,q[m]=0,q[p]=A>0?1:-1,u.push(q.x,q.y,q.z),f.push(Se/g),f.push(1-j/y),X+=1}}for(let j=0;j<y;j++)for(let ee=0;ee<g;ee++){const Se=d+ee+Y*j,Fe=d+ee+Y*(j+1),J=d+(ee+1)+Y*(j+1),pe=d+(ee+1)+Y*j;c.push(Se,Fe,pe),c.push(Fe,J,pe),ie+=6}o.addGroup(h,ie,z),h+=ie,d+=X}}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Zi(e.width,e.height,e.depth,e.widthSegments,e.heightSegments,e.depthSegments)}}class Yr extends on{constructor(e=1,t=32,n=0,r=Math.PI*2){super(),this.type="CircleGeometry",this.parameters={radius:e,segments:t,thetaStart:n,thetaLength:r},t=Math.max(3,t);const s=[],a=[],o=[],c=[],l=new H,u=new Ze;a.push(0,0,0),o.push(0,0,1),c.push(.5,.5);for(let f=0,d=3;f<=t;f++,d+=3){const h=n+f/t*r;l.x=e*Math.cos(h),l.y=e*Math.sin(h),a.push(l.x,l.y,l.z),o.push(0,0,1),u.x=(a[d]/e+1)/2,u.y=(a[d+1]/e+1)/2,c.push(u.x,u.y)}for(let f=1;f<=t;f++)s.push(f,f+1,0);this.setIndex(s),this.setAttribute("position",new Nt(a,3)),this.setAttribute("normal",new Nt(o,3)),this.setAttribute("uv",new Nt(c,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Yr(e.radius,e.segments,e.thetaStart,e.thetaLength)}}class Ti extends on{constructor(e=1,t=1,n=1,r=1){super(),this.type="PlaneGeometry",this.parameters={width:e,height:t,widthSegments:n,heightSegments:r};const s=e/2,a=t/2,o=Math.floor(n),c=Math.floor(r),l=o+1,u=c+1,f=e/o,d=t/c,h=[],_=[],S=[],m=[];for(let p=0;p<u;p++){const M=p*d-a;for(let w=0;w<l;w++){const b=w*f-s;_.push(b,-M,0),S.push(0,0,1),m.push(w/o),m.push(1-p/c)}}for(let p=0;p<c;p++)for(let M=0;M<o;M++){const w=M+l*p,b=M+l*(p+1),R=M+1+l*(p+1),A=M+1+l*p;h.push(w,b,A),h.push(b,R,A)}this.setIndex(h),this.setAttribute("position",new Nt(_,3)),this.setAttribute("normal",new Nt(S,3)),this.setAttribute("uv",new Nt(m,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Ti(e.width,e.height,e.widthSegments,e.heightSegments)}}class Vi extends on{constructor(e=.5,t=1,n=32,r=1,s=0,a=Math.PI*2){super(),this.type="RingGeometry",this.parameters={innerRadius:e,outerRadius:t,thetaSegments:n,phiSegments:r,thetaStart:s,thetaLength:a},n=Math.max(3,n),r=Math.max(1,r);const o=[],c=[],l=[],u=[];let f=e;const d=(t-e)/r,h=new H,_=new Ze;for(let S=0;S<=r;S++){for(let m=0;m<=n;m++){const p=s+m/n*a;h.x=f*Math.cos(p),h.y=f*Math.sin(p),c.push(h.x,h.y,h.z),l.push(0,0,1),_.x=(h.x/t+1)/2,_.y=(h.y/t+1)/2,u.push(_.x,_.y)}f+=d}for(let S=0;S<r;S++){const m=S*(n+1);for(let p=0;p<n;p++){const M=p+m,w=M,b=M+n+1,R=M+n+2,A=M+1;o.push(w,b,A),o.push(b,R,A)}}this.setIndex(o),this.setAttribute("position",new Nt(c,3)),this.setAttribute("normal",new Nt(l,3)),this.setAttribute("uv",new Nt(u,2))}copy(e){return super.copy(e),this.parameters=Object.assign({},e.parameters),this}static fromJSON(e){return new Vi(e.innerRadius,e.outerRadius,e.thetaSegments,e.phiSegments,e.thetaStart,e.thetaLength)}}function Ai(i){const e={};for(const t in i){e[t]={};for(const n in i[t]){const r=i[t][n];if(Lo(r))r.isRenderTargetTexture?(Ue("UniformsUtils: Textures of render targets cannot be cloned via cloneUniforms() or mergeUniforms()."),e[t][n]=null):e[t][n]=r.clone();else if(Array.isArray(r))if(Lo(r[0])){const s=[];for(let a=0,o=r.length;a<o;a++)s[a]=r[a].clone();e[t][n]=s}else e[t][n]=r.slice();else e[t][n]=r}}return e}function Ot(i){const e={};for(let t=0;t<i.length;t++){const n=Ai(i[t]);for(const r in n)e[r]=n[r]}return e}function Lo(i){return i&&(i.isColor||i.isMatrix3||i.isMatrix4||i.isVector2||i.isVector3||i.isVector4||i.isTexture||i.isQuaternion)}function zu(i){const e=[];for(let t=0;t<i.length;t++)e.push(i[t].clone());return e}function Ol(i){const e=i.getRenderTarget();return e===null?i.outputColorSpace:e.isXRRenderTarget===!0?e.texture.colorSpace:Ye.workingColorSpace}const Gu={clone:Ai,merge:Ot};var Hu=`void main() {
	gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`,ku=`void main() {
	gl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
}`;class ri extends $i{constructor(e){super(),this.isShaderMaterial=!0,this.type="ShaderMaterial",this.defines={},this.uniforms={},this.uniformsGroups=[],this.vertexShader=Hu,this.fragmentShader=ku,this.linewidth=1,this.wireframe=!1,this.wireframeLinewidth=1,this.fog=!1,this.lights=!1,this.clipping=!1,this.forceSinglePass=!0,this.extensions={clipCullDistance:!1,multiDraw:!1},this.defaultAttributeValues={color:[1,1,1],uv:[0,0],uv1:[0,0]},this.index0AttributeName=void 0,this.uniformsNeedUpdate=!1,this.glslVersion=null,e!==void 0&&this.setValues(e)}copy(e){return super.copy(e),this.fragmentShader=e.fragmentShader,this.vertexShader=e.vertexShader,this.uniforms=Ai(e.uniforms),this.uniformsGroups=zu(e.uniformsGroups),this.defines=Object.assign({},e.defines),this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this.fog=e.fog,this.lights=e.lights,this.clipping=e.clipping,this.extensions=Object.assign({},e.extensions),this.glslVersion=e.glslVersion,this.defaultAttributeValues=Object.assign({},e.defaultAttributeValues),this.index0AttributeName=e.index0AttributeName,this.uniformsNeedUpdate=e.uniformsNeedUpdate,this}toJSON(e){const t=super.toJSON(e);t.glslVersion=this.glslVersion,t.uniforms={};for(const r in this.uniforms){const a=this.uniforms[r].value;a&&a.isTexture?t.uniforms[r]={type:"t",value:a.toJSON(e).uuid}:a&&a.isColor?t.uniforms[r]={type:"c",value:a.getHex()}:a&&a.isVector2?t.uniforms[r]={type:"v2",value:a.toArray()}:a&&a.isVector3?t.uniforms[r]={type:"v3",value:a.toArray()}:a&&a.isVector4?t.uniforms[r]={type:"v4",value:a.toArray()}:a&&a.isMatrix3?t.uniforms[r]={type:"m3",value:a.toArray()}:a&&a.isMatrix4?t.uniforms[r]={type:"m4",value:a.toArray()}:t.uniforms[r]={value:a}}Object.keys(this.defines).length>0&&(t.defines=this.defines),t.vertexShader=this.vertexShader,t.fragmentShader=this.fragmentShader,t.lights=this.lights,t.clipping=this.clipping;const n={};for(const r in this.extensions)this.extensions[r]===!0&&(n[r]=!0);return Object.keys(n).length>0&&(t.extensions=n),t}fromJSON(e,t){if(super.fromJSON(e,t),e.uniforms!==void 0)for(const n in e.uniforms){const r=e.uniforms[n];switch(this.uniforms[n]={},r.type){case"t":this.uniforms[n].value=t[r.value]||null;break;case"c":this.uniforms[n].value=new tt().setHex(r.value);break;case"v2":this.uniforms[n].value=new Ze().fromArray(r.value);break;case"v3":this.uniforms[n].value=new H().fromArray(r.value);break;case"v4":this.uniforms[n].value=new ft().fromArray(r.value);break;case"m3":this.uniforms[n].value=new Be().fromArray(r.value);break;case"m4":this.uniforms[n].value=new pt().fromArray(r.value);break;default:this.uniforms[n].value=r.value}}if(e.defines!==void 0&&(this.defines=e.defines),e.vertexShader!==void 0&&(this.vertexShader=e.vertexShader),e.fragmentShader!==void 0&&(this.fragmentShader=e.fragmentShader),e.glslVersion!==void 0&&(this.glslVersion=e.glslVersion),e.extensions!==void 0)for(const n in e.extensions)this.extensions[n]=e.extensions[n];return e.lights!==void 0&&(this.lights=e.lights),e.clipping!==void 0&&(this.clipping=e.clipping),this}}class Vu extends ri{constructor(e){super(e),this.isRawShaderMaterial=!0,this.type="RawShaderMaterial"}}class Wu extends $i{constructor(e){super(),this.isMeshDepthMaterial=!0,this.type="MeshDepthMaterial",this.depthPacking=Qc,this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.wireframe=!1,this.wireframeLinewidth=1,this.setValues(e)}copy(e){return super.copy(e),this.depthPacking=e.depthPacking,this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this.wireframe=e.wireframe,this.wireframeLinewidth=e.wireframeLinewidth,this}}class Xu extends $i{constructor(e){super(),this.isMeshDistanceMaterial=!0,this.type="MeshDistanceMaterial",this.map=null,this.alphaMap=null,this.displacementMap=null,this.displacementScale=1,this.displacementBias=0,this.setValues(e)}copy(e){return super.copy(e),this.map=e.map,this.alphaMap=e.alphaMap,this.displacementMap=e.displacementMap,this.displacementScale=e.displacementScale,this.displacementBias=e.displacementBias,this}}const Tr=new H,Ar=new wi,ln=new H;class Bl extends Xt{constructor(){super(),this.isCamera=!0,this.type="Camera",this.matrixWorldInverse=new pt,this.projectionMatrix=new pt,this.projectionMatrixInverse=new pt,this.coordinateSystem=an,this._reversedDepth=!1}get reversedDepth(){return this._reversedDepth}copy(e,t){return super.copy(e,t),this.matrixWorldInverse.copy(e.matrixWorldInverse),this.projectionMatrix.copy(e.projectionMatrix),this.projectionMatrixInverse.copy(e.projectionMatrixInverse),this.coordinateSystem=e.coordinateSystem,this}getWorldDirection(e){return super.getWorldDirection(e).negate()}updateMatrixWorld(e){super.updateMatrixWorld(e),this.matrixWorld.decompose(Tr,Ar,ln),ln.x===1&&ln.y===1&&ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Tr,Ar,ln.set(1,1,1)).invert()}updateWorldMatrix(e,t,n=!1){super.updateWorldMatrix(e,t,n),this.matrixWorld.decompose(Tr,Ar,ln),ln.x===1&&ln.y===1&&ln.z===1?this.matrixWorldInverse.copy(this.matrixWorld).invert():this.matrixWorldInverse.compose(Tr,Ar,ln.set(1,1,1)).invert()}clone(){return new this.constructor().copy(this)}}const Un=new H,Do=new Ze,Io=new Ze;class rn extends Bl{constructor(e=50,t=1,n=.1,r=2e3){super(),this.isPerspectiveCamera=!0,this.type="PerspectiveCamera",this.fov=e,this.zoom=1,this.near=n,this.far=r,this.focus=10,this.aspect=t,this.view=null,this.filmGauge=35,this.filmOffset=0,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.fov=e.fov,this.zoom=e.zoom,this.near=e.near,this.far=e.far,this.focus=e.focus,this.aspect=e.aspect,this.view=e.view===null?null:Object.assign({},e.view),this.filmGauge=e.filmGauge,this.filmOffset=e.filmOffset,this}setFocalLength(e){const t=.5*this.getFilmHeight()/e;this.fov=ya*2*Math.atan(t),this.updateProjectionMatrix()}getFocalLength(){const e=Math.tan(us*.5*this.fov);return .5*this.getFilmHeight()/e}getEffectiveFOV(){return ya*2*Math.atan(Math.tan(us*.5*this.fov)/this.zoom)}getFilmWidth(){return this.filmGauge*Math.min(this.aspect,1)}getFilmHeight(){return this.filmGauge/Math.max(this.aspect,1)}getViewBounds(e,t,n){Un.set(-1,-1,.5).applyMatrix4(this.projectionMatrixInverse),t.set(Un.x,Un.y).multiplyScalar(-e/Un.z),Un.set(1,1,.5).applyMatrix4(this.projectionMatrixInverse),n.set(Un.x,Un.y).multiplyScalar(-e/Un.z)}getViewSize(e,t){return this.getViewBounds(e,Do,Io),t.subVectors(Io,Do)}setViewOffset(e,t,n,r,s,a){this.aspect=e/t,this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=this.near;let t=e*Math.tan(us*.5*this.fov)/this.zoom,n=2*t,r=this.aspect*n,s=-.5*r;const a=this.view;if(this.view!==null&&this.view.enabled){const c=a.fullWidth,l=a.fullHeight;s+=a.offsetX*r/c,t-=a.offsetY*n/l,r*=a.width/c,n*=a.height/l}const o=this.filmOffset;o!==0&&(s+=e*o/this.getFilmWidth()),this.projectionMatrix.makePerspective(s,s+r,t,t-n,e,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.fov=this.fov,t.object.zoom=this.zoom,t.object.near=this.near,t.object.far=this.far,t.object.focus=this.focus,t.object.aspect=this.aspect,this.view!==null&&(t.object.view=Object.assign({},this.view)),t.object.filmGauge=this.filmGauge,t.object.filmOffset=this.filmOffset,t}}class qu extends Bl{constructor(e=-1,t=1,n=1,r=-1,s=.1,a=2e3){super(),this.isOrthographicCamera=!0,this.type="OrthographicCamera",this.zoom=1,this.view=null,this.left=e,this.right=t,this.top=n,this.bottom=r,this.near=s,this.far=a,this.updateProjectionMatrix()}copy(e,t){return super.copy(e,t),this.left=e.left,this.right=e.right,this.top=e.top,this.bottom=e.bottom,this.near=e.near,this.far=e.far,this.zoom=e.zoom,this.view=e.view===null?null:Object.assign({},e.view),this}setViewOffset(e,t,n,r,s,a){this.view===null&&(this.view={enabled:!0,fullWidth:1,fullHeight:1,offsetX:0,offsetY:0,width:1,height:1}),this.view.enabled=!0,this.view.fullWidth=e,this.view.fullHeight=t,this.view.offsetX=n,this.view.offsetY=r,this.view.width=s,this.view.height=a,this.updateProjectionMatrix()}clearViewOffset(){this.view!==null&&(this.view.enabled=!1),this.updateProjectionMatrix()}updateProjectionMatrix(){const e=(this.right-this.left)/(2*this.zoom),t=(this.top-this.bottom)/(2*this.zoom),n=(this.right+this.left)/2,r=(this.top+this.bottom)/2;let s=n-e,a=n+e,o=r+t,c=r-t;if(this.view!==null&&this.view.enabled){const l=(this.right-this.left)/this.view.fullWidth/this.zoom,u=(this.top-this.bottom)/this.view.fullHeight/this.zoom;s+=l*this.view.offsetX,a=s+l*this.view.width,o-=u*this.view.offsetY,c=o-u*this.view.height}this.projectionMatrix.makeOrthographic(s,a,o,c,this.near,this.far,this.coordinateSystem,this.reversedDepth),this.projectionMatrixInverse.copy(this.projectionMatrix).invert()}toJSON(e){const t=super.toJSON(e);return t.object.zoom=this.zoom,t.object.left=this.left,t.object.right=this.right,t.object.top=this.top,t.object.bottom=this.bottom,t.object.near=this.near,t.object.far=this.far,this.view!==null&&(t.object.view=Object.assign({},this.view)),t}}const _i=-90,xi=1;class ba extends Xt{constructor(e,t,n){super(),this.type="CubeCamera",this.renderTarget=n,this.coordinateSystem=null,this.activeMipmapLevel=0;const r=new rn(_i,xi,e,t);r.layers=this.layers,this.add(r);const s=new rn(_i,xi,e,t);s.layers=this.layers,this.add(s);const a=new rn(_i,xi,e,t);a.layers=this.layers,this.add(a);const o=new rn(_i,xi,e,t);o.layers=this.layers,this.add(o);const c=new rn(_i,xi,e,t);c.layers=this.layers,this.add(c);const l=new rn(_i,xi,e,t);l.layers=this.layers,this.add(l)}updateCoordinateSystem(){const e=this.coordinateSystem,t=this.children.concat(),[n,r,s,a,o,c]=t;for(const l of t)this.remove(l);if(e===an)n.up.set(0,1,0),n.lookAt(1,0,0),r.up.set(0,1,0),r.lookAt(-1,0,0),s.up.set(0,0,-1),s.lookAt(0,1,0),a.up.set(0,0,1),a.lookAt(0,-1,0),o.up.set(0,1,0),o.lookAt(0,0,1),c.up.set(0,1,0),c.lookAt(0,0,-1);else if(e===kr)n.up.set(0,-1,0),n.lookAt(-1,0,0),r.up.set(0,-1,0),r.lookAt(1,0,0),s.up.set(0,0,1),s.lookAt(0,1,0),a.up.set(0,0,-1),a.lookAt(0,-1,0),o.up.set(0,-1,0),o.lookAt(0,0,1),c.up.set(0,-1,0),c.lookAt(0,0,-1);else throw new Error("THREE.CubeCamera.updateCoordinateSystem(): Invalid coordinate system: "+e);for(const l of t)this.add(l),l.updateMatrixWorld()}update(e,t){this.parent===null&&this.updateMatrixWorld();const{renderTarget:n,activeMipmapLevel:r}=this;this.coordinateSystem!==e.coordinateSystem&&(this.coordinateSystem=e.coordinateSystem,this.updateCoordinateSystem());const[s,a,o,c,l,u]=this.children,f=e.getRenderTarget(),d=e.getActiveCubeFace(),h=e.getActiveMipmapLevel(),_=e.xr.enabled;e.xr.enabled=!1;const S=n.texture.mipmapsAutoUpdate;n.texture.mipmapsAutoUpdate=!1;let m=!1;e.isWebGLRenderer===!0?m=e.state.buffers.depth.getReversed():m=e.reversedDepthBuffer,e.setRenderTarget(n,0,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,s),e.setRenderTarget(n,1,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,a),e.setRenderTarget(n,2,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,o),e.setRenderTarget(n,3,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,c),e.setRenderTarget(n,4,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,l),n.texture.mipmapsAutoUpdate=S,e.setRenderTarget(n,5,r),m&&e.autoClear===!1&&e.clearDepth(),e.render(t,u),e.setRenderTarget(f,d,h),e.xr.enabled=_,n.texture.needsPMREMUpdate=!0}}class Yu extends rn{constructor(e=[]){super(),this.isArrayCamera=!0,this.isMultiViewCamera=!1,this.cameras=e,this.perCameraFrustumCulled=!1}}function No(i,e,t,n){const r=Ku(n);switch(t){case Sl:return i*e;case El:return i*e/r.components*r.byteLength;case Pa:return i*e/r.components*r.byteLength;case ni:return i*e*2/r.components*r.byteLength;case La:return i*e*2/r.components*r.byteLength;case Ml:return i*e*3/r.components*r.byteLength;case fn:return i*e*4/r.components*r.byteLength;case Da:return i*e*4/r.components*r.byteLength;case Lr:case Dr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case Ir:case Nr:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case Ks:case Zs:return Math.max(i,16)*Math.max(e,8)/4;case Ys:case $s:return Math.max(i,8)*Math.max(e,8)/2;case Js:case Qs:case ea:case ta:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*8;case js:case Br:case na:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ia:return Math.floor((i+3)/4)*Math.floor((e+3)/4)*16;case ra:return Math.floor((i+4)/5)*Math.floor((e+3)/4)*16;case sa:return Math.floor((i+4)/5)*Math.floor((e+4)/5)*16;case aa:return Math.floor((i+5)/6)*Math.floor((e+4)/5)*16;case oa:return Math.floor((i+5)/6)*Math.floor((e+5)/6)*16;case la:return Math.floor((i+7)/8)*Math.floor((e+4)/5)*16;case ca:return Math.floor((i+7)/8)*Math.floor((e+5)/6)*16;case ua:return Math.floor((i+7)/8)*Math.floor((e+7)/8)*16;case ha:return Math.floor((i+9)/10)*Math.floor((e+4)/5)*16;case da:return Math.floor((i+9)/10)*Math.floor((e+5)/6)*16;case fa:return Math.floor((i+9)/10)*Math.floor((e+7)/8)*16;case pa:return Math.floor((i+9)/10)*Math.floor((e+9)/10)*16;case ma:return Math.floor((i+11)/12)*Math.floor((e+9)/10)*16;case ga:return Math.floor((i+11)/12)*Math.floor((e+11)/12)*16;case _a:case xa:case va:return Math.ceil(i/4)*Math.ceil(e/4)*16;case Sa:case Ma:return Math.ceil(i/4)*Math.ceil(e/4)*8;case zr:case Ea:return Math.ceil(i/4)*Math.ceil(e/4)*16}throw new Error(`Unable to determine texture byte length for ${t} format.`)}function Ku(i){switch(i){case Jt:case gl:return{byteLength:1,components:1};case qi:case _l:case gn:return{byteLength:2,components:1};case Ra:case Ca:return{byteLength:2,components:4};case mn:case wa:case dn:return{byteLength:4,components:1};case xl:case vl:return{byteLength:4,components:3}}throw new Error(`THREE.TextureUtils: Unknown texture type ${i}.`)}typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("register",{detail:{revision:Aa}}));typeof window<"u"&&(window.__THREE__?Ue("WARNING: Multiple instances of Three.js being imported."):window.__THREE__=Aa);/**
 * @license
 * Copyright 2010-2026 Three.js Authors
 * SPDX-License-Identifier: MIT
 */function zl(){let i=null,e=!1,t=null,n=null;function r(s,a){n=i.requestAnimationFrame(r),t(s,a)}return{start:function(){e!==!0&&t!==null&&i!==null&&(n=i.requestAnimationFrame(r),e=!0)},stop:function(){i!==null&&i.cancelAnimationFrame(n),e=!1},setAnimationLoop:function(s){t=s},setContext:function(s){i=s}}}function $u(i){const e=new WeakMap;function t(o,c){const l=o.array,u=o.usage,f=l.byteLength,d=i.createBuffer();i.bindBuffer(c,d),i.bufferData(c,l,u),o.onUploadCallback();let h;if(l instanceof Float32Array)h=i.FLOAT;else if(typeof Float16Array<"u"&&l instanceof Float16Array)h=i.HALF_FLOAT;else if(l instanceof Uint16Array)o.isFloat16BufferAttribute?h=i.HALF_FLOAT:h=i.UNSIGNED_SHORT;else if(l instanceof Int16Array)h=i.SHORT;else if(l instanceof Uint32Array)h=i.UNSIGNED_INT;else if(l instanceof Int32Array)h=i.INT;else if(l instanceof Int8Array)h=i.BYTE;else if(l instanceof Uint8Array)h=i.UNSIGNED_BYTE;else if(l instanceof Uint8ClampedArray)h=i.UNSIGNED_BYTE;else throw new Error("THREE.WebGLAttributes: Unsupported buffer data format: "+l);return{buffer:d,type:h,bytesPerElement:l.BYTES_PER_ELEMENT,version:o.version,size:f}}function n(o,c,l){const u=c.array,f=c.updateRanges;if(i.bindBuffer(l,o),f.length===0)i.bufferSubData(l,0,u);else{f.sort((h,_)=>h.start-_.start);let d=0;for(let h=1;h<f.length;h++){const _=f[d],S=f[h];S.start<=_.start+_.count+1?_.count=Math.max(_.count,S.start+S.count-_.start):(++d,f[d]=S)}f.length=d+1;for(let h=0,_=f.length;h<_;h++){const S=f[h];i.bufferSubData(l,S.start*u.BYTES_PER_ELEMENT,u,S.start,S.count)}c.clearUpdateRanges()}c.onUploadCallback()}function r(o){return o.isInterleavedBufferAttribute&&(o=o.data),e.get(o)}function s(o){o.isInterleavedBufferAttribute&&(o=o.data);const c=e.get(o);c&&(i.deleteBuffer(c.buffer),e.delete(o))}function a(o,c){if(o.isInterleavedBufferAttribute&&(o=o.data),o.isGLBufferAttribute){const u=e.get(o);(!u||u.version<o.version)&&e.set(o,{buffer:o.buffer,type:o.type,bytesPerElement:o.elementSize,version:o.version});return}const l=e.get(o);if(l===void 0)e.set(o,t(o,c));else if(l.version<o.version){if(l.size!==o.array.byteLength)throw new Error("THREE.WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.");n(l.buffer,o,c),l.version=o.version}}return{get:r,remove:s,update:a}}var Zu=`#ifdef USE_ALPHAHASH
	if ( diffuseColor.a < getAlphaHashThreshold( vPosition ) ) discard;
#endif`,Ju=`#ifdef USE_ALPHAHASH
	const float ALPHA_HASH_SCALE = 0.05;
	float hash2D( vec2 value ) {
		return fract( 1.0e4 * sin( 17.0 * value.x + 0.1 * value.y ) * ( 0.1 + abs( sin( 13.0 * value.y + value.x ) ) ) );
	}
	float hash3D( vec3 value ) {
		return hash2D( vec2( hash2D( value.xy ), value.z ) );
	}
	float getAlphaHashThreshold( vec3 position ) {
		float maxDeriv = max(
			length( dFdx( position.xyz ) ),
			length( dFdy( position.xyz ) )
		);
		float pixScale = 1.0 / ( ALPHA_HASH_SCALE * maxDeriv );
		vec2 pixScales = vec2(
			exp2( floor( log2( pixScale ) ) ),
			exp2( ceil( log2( pixScale ) ) )
		);
		vec2 alpha = vec2(
			hash3D( floor( pixScales.x * position.xyz ) ),
			hash3D( floor( pixScales.y * position.xyz ) )
		);
		float lerpFactor = fract( log2( pixScale ) );
		float x = ( 1.0 - lerpFactor ) * alpha.x + lerpFactor * alpha.y;
		float a = min( lerpFactor, 1.0 - lerpFactor );
		vec3 cases = vec3(
			x * x / ( 2.0 * a * ( 1.0 - a ) ),
			( x - 0.5 * a ) / ( 1.0 - a ),
			1.0 - ( ( 1.0 - x ) * ( 1.0 - x ) / ( 2.0 * a * ( 1.0 - a ) ) )
		);
		float threshold = ( x < ( 1.0 - a ) )
			? ( ( x < a ) ? cases.x : cases.y )
			: cases.z;
		return clamp( threshold , 1.0e-6, 1.0 );
	}
#endif`,Qu=`#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, vAlphaMapUv ).g;
#endif`,ju=`#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,eh=`#ifdef USE_ALPHATEST
	#ifdef ALPHA_TO_COVERAGE
	diffuseColor.a = smoothstep( alphaTest, alphaTest + fwidth( diffuseColor.a ), diffuseColor.a );
	if ( diffuseColor.a == 0.0 ) discard;
	#else
	if ( diffuseColor.a < alphaTest ) discard;
	#endif
#endif`,th=`#ifdef USE_ALPHATEST
	uniform float alphaTest;
#endif`,nh=`#ifdef USE_AOMAP
	float ambientOcclusion = ( texture2D( aoMap, vAoMapUv ).r - 1.0 ) * aoMapIntensity + 1.0;
	reflectedLight.indirectDiffuse *= ambientOcclusion;
	#if defined( USE_CLEARCOAT ) 
		clearcoatSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_SHEEN ) 
		sheenSpecularIndirect *= ambientOcclusion;
	#endif
	#if defined( USE_ENVMAP ) && defined( STANDARD )
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
	#endif
#endif`,ih=`#ifdef USE_AOMAP
	uniform sampler2D aoMap;
	uniform float aoMapIntensity;
#endif`,rh=`#ifdef USE_BATCHING
	#if ! defined( GL_ANGLE_multi_draw )
	#define gl_DrawID _gl_DrawID
	uniform int _gl_DrawID;
	#endif
	uniform highp sampler2D batchingTexture;
	uniform highp usampler2D batchingIdTexture;
	mat4 getBatchingMatrix( const in float i ) {
		int size = textureSize( batchingTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( batchingTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( batchingTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( batchingTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( batchingTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
	float getIndirectIndex( const in int i ) {
		int size = textureSize( batchingIdTexture, 0 ).x;
		int x = i % size;
		int y = i / size;
		return float( texelFetch( batchingIdTexture, ivec2( x, y ), 0 ).r );
	}
#endif
#ifdef USE_BATCHING_COLOR
	uniform sampler2D batchingColorTexture;
	vec4 getBatchingColor( const in float i ) {
		int size = textureSize( batchingColorTexture, 0 ).x;
		int j = int( i );
		int x = j % size;
		int y = j / size;
		return texelFetch( batchingColorTexture, ivec2( x, y ), 0 );
	}
#endif`,sh=`#ifdef USE_BATCHING
	mat4 batchingMatrix = getBatchingMatrix( getIndirectIndex( gl_DrawID ) );
#endif`,ah=`vec3 transformed = vec3( position );
#ifdef USE_ALPHAHASH
	vPosition = vec3( position );
#endif`,oh=`vec3 objectNormal = vec3( normal );
#ifdef USE_TANGENT
	vec3 objectTangent = vec3( tangent.xyz );
#endif`,lh=`float G_BlinnPhong_Implicit( ) {
	return 0.25;
}
float D_BlinnPhong( const in float shininess, const in float dotNH ) {
	return RECIPROCAL_PI * ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );
}
vec3 BRDF_BlinnPhong( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 specularColor, const in float shininess ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( specularColor, 1.0, dotVH );
	float G = G_BlinnPhong_Implicit( );
	float D = D_BlinnPhong( shininess, dotNH );
	return F * ( G * D );
} // validated`,ch=`#ifdef USE_IRIDESCENCE
	const mat3 XYZ_TO_REC709 = mat3(
		 3.2404542, -0.9692660,  0.0556434,
		-1.5371385,  1.8760108, -0.2040259,
		-0.4985314,  0.0415560,  1.0572252
	);
	vec3 Fresnel0ToIor( vec3 fresnel0 ) {
		vec3 sqrtF0 = sqrt( fresnel0 );
		return ( vec3( 1.0 ) + sqrtF0 ) / ( vec3( 1.0 ) - sqrtF0 );
	}
	vec3 IorToFresnel0( vec3 transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - vec3( incidentIor ) ) / ( transmittedIor + vec3( incidentIor ) ) );
	}
	float IorToFresnel0( float transmittedIor, float incidentIor ) {
		return pow2( ( transmittedIor - incidentIor ) / ( transmittedIor + incidentIor ));
	}
	vec3 evalSensitivity( float OPD, vec3 shift ) {
		float phase = 2.0 * PI * OPD * 1.0e-9;
		vec3 val = vec3( 5.4856e-13, 4.4201e-13, 5.2481e-13 );
		vec3 pos = vec3( 1.6810e+06, 1.7953e+06, 2.2084e+06 );
		vec3 var = vec3( 4.3278e+09, 9.3046e+09, 6.6121e+09 );
		vec3 xyz = val * sqrt( 2.0 * PI * var ) * cos( pos * phase + shift ) * exp( - pow2( phase ) * var );
		xyz.x += 9.7470e-14 * sqrt( 2.0 * PI * 4.5282e+09 ) * cos( 2.2399e+06 * phase + shift[ 0 ] ) * exp( - 4.5282e+09 * pow2( phase ) );
		xyz /= 1.0685e-7;
		vec3 rgb = XYZ_TO_REC709 * xyz;
		return rgb;
	}
	vec3 evalIridescence( float outsideIOR, float eta2, float cosTheta1, float thinFilmThickness, vec3 baseF0 ) {
		vec3 I;
		float iridescenceIOR = mix( outsideIOR, eta2, smoothstep( 0.0, 0.03, thinFilmThickness ) );
		float sinTheta2Sq = pow2( outsideIOR / iridescenceIOR ) * ( 1.0 - pow2( cosTheta1 ) );
		float cosTheta2Sq = 1.0 - sinTheta2Sq;
		if ( cosTheta2Sq < 0.0 ) {
			return vec3( 1.0 );
		}
		float cosTheta2 = sqrt( cosTheta2Sq );
		float R0 = IorToFresnel0( iridescenceIOR, outsideIOR );
		float R12 = F_Schlick( R0, 1.0, cosTheta1 );
		float T121 = 1.0 - R12;
		float phi12 = 0.0;
		if ( iridescenceIOR < outsideIOR ) phi12 = PI;
		float phi21 = PI - phi12;
		vec3 baseIOR = Fresnel0ToIor( clamp( baseF0, 0.0, 0.9999 ) );		vec3 R1 = IorToFresnel0( baseIOR, iridescenceIOR );
		vec3 R23 = F_Schlick( R1, 1.0, cosTheta2 );
		vec3 phi23 = vec3( 0.0 );
		if ( baseIOR[ 0 ] < iridescenceIOR ) phi23[ 0 ] = PI;
		if ( baseIOR[ 1 ] < iridescenceIOR ) phi23[ 1 ] = PI;
		if ( baseIOR[ 2 ] < iridescenceIOR ) phi23[ 2 ] = PI;
		float OPD = 2.0 * iridescenceIOR * thinFilmThickness * cosTheta2;
		vec3 phi = vec3( phi21 ) + phi23;
		vec3 R123 = clamp( R12 * R23, 1e-5, 0.9999 );
		vec3 r123 = sqrt( R123 );
		vec3 Rs = pow2( T121 ) * R23 / ( vec3( 1.0 ) - R123 );
		vec3 C0 = R12 + Rs;
		I = C0;
		vec3 Cm = Rs - T121;
		for ( int m = 1; m <= 2; ++ m ) {
			Cm *= r123;
			vec3 Sm = 2.0 * evalSensitivity( float( m ) * OPD, float( m ) * phi );
			I += Cm * Sm;
		}
		return max( I, vec3( 0.0 ) );
	}
#endif`,uh=`#ifdef USE_BUMPMAP
	uniform sampler2D bumpMap;
	uniform float bumpScale;
	vec2 dHdxy_fwd() {
		vec2 dSTdx = dFdx( vBumpMapUv );
		vec2 dSTdy = dFdy( vBumpMapUv );
		float Hll = bumpScale * texture2D( bumpMap, vBumpMapUv ).x;
		float dBx = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdx ).x - Hll;
		float dBy = bumpScale * texture2D( bumpMap, vBumpMapUv + dSTdy ).x - Hll;
		return vec2( dBx, dBy );
	}
	vec3 perturbNormalArb( vec3 surf_pos, vec3 surf_norm, vec2 dHdxy, float faceDirection ) {
		vec3 vSigmaX = normalize( dFdx( surf_pos.xyz ) );
		vec3 vSigmaY = normalize( dFdy( surf_pos.xyz ) );
		vec3 vN = surf_norm;
		vec3 R1 = cross( vSigmaY, vN );
		vec3 R2 = cross( vN, vSigmaX );
		float fDet = dot( vSigmaX, R1 ) * faceDirection;
		vec3 vGrad = sign( fDet ) * ( dHdxy.x * R1 + dHdxy.y * R2 );
		return normalize( abs( fDet ) * surf_norm - vGrad );
	}
#endif`,hh=`#if NUM_CLIPPING_PLANES > 0
	vec4 plane;
	#ifdef ALPHA_TO_COVERAGE
		float distanceToPlane, distanceGradient;
		float clipOpacity = 1.0;
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
			distanceGradient = fwidth( distanceToPlane ) / 2.0;
			clipOpacity *= smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			if ( clipOpacity == 0.0 ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			float unionClipOpacity = 1.0;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				distanceToPlane = - dot( vClipPosition, plane.xyz ) + plane.w;
				distanceGradient = fwidth( distanceToPlane ) / 2.0;
				unionClipOpacity *= 1.0 - smoothstep( - distanceGradient, distanceGradient, distanceToPlane );
			}
			#pragma unroll_loop_end
			clipOpacity *= 1.0 - unionClipOpacity;
		#endif
		diffuseColor.a *= clipOpacity;
		if ( diffuseColor.a == 0.0 ) discard;
	#else
		#pragma unroll_loop_start
		for ( int i = 0; i < UNION_CLIPPING_PLANES; i ++ ) {
			plane = clippingPlanes[ i ];
			if ( dot( vClipPosition, plane.xyz ) > plane.w ) discard;
		}
		#pragma unroll_loop_end
		#if UNION_CLIPPING_PLANES < NUM_CLIPPING_PLANES
			bool clipped = true;
			#pragma unroll_loop_start
			for ( int i = UNION_CLIPPING_PLANES; i < NUM_CLIPPING_PLANES; i ++ ) {
				plane = clippingPlanes[ i ];
				clipped = ( dot( vClipPosition, plane.xyz ) > plane.w ) && clipped;
			}
			#pragma unroll_loop_end
			if ( clipped ) discard;
		#endif
	#endif
#endif`,dh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
	uniform vec4 clippingPlanes[ NUM_CLIPPING_PLANES ];
#endif`,fh=`#if NUM_CLIPPING_PLANES > 0
	varying vec3 vClipPosition;
#endif`,ph=`#if NUM_CLIPPING_PLANES > 0
	vClipPosition = - mvPosition.xyz;
#endif`,mh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	diffuseColor *= vColor;
#endif`,gh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
	varying vec4 vColor;
#endif`,_h=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	varying vec4 vColor;
#endif`,xh=`#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR ) || defined( USE_BATCHING_COLOR )
	vColor = vec4( 1.0 );
#endif
#ifdef USE_COLOR_ALPHA
	vColor *= color;
#elif defined( USE_COLOR )
	vColor.rgb *= color;
#endif
#ifdef USE_INSTANCING_COLOR
	vColor.rgb *= instanceColor.rgb;
#endif
#ifdef USE_BATCHING_COLOR
	vColor *= getBatchingColor( getIndirectIndex( gl_DrawID ) );
#endif`,vh=`#define PI 3.141592653589793
#define PI2 6.283185307179586
#define PI_HALF 1.5707963267948966
#define RECIPROCAL_PI 0.3183098861837907
#define RECIPROCAL_PI2 0.15915494309189535
#define EPSILON 1e-6
#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
#define whiteComplement( a ) ( 1.0 - saturate( a ) )
float pow2( const in float x ) { return x*x; }
vec3 pow2( const in vec3 x ) { return x*x; }
float pow3( const in float x ) { return x*x*x; }
float pow4( const in float x ) { float x2 = x*x; return x2*x2; }
float max3( const in vec3 v ) { return max( max( v.x, v.y ), v.z ); }
float average( const in vec3 v ) { return dot( v, vec3( 0.3333333 ) ); }
highp float rand( const in vec2 uv ) {
	const highp float a = 12.9898, b = 78.233, c = 43758.5453;
	highp float dt = dot( uv.xy, vec2( a,b ) ), sn = mod( dt, PI );
	return fract( sin( sn ) * c );
}
#ifdef HIGH_PRECISION
	float precisionSafeLength( vec3 v ) { return length( v ); }
#else
	float precisionSafeLength( vec3 v ) {
		float maxComponent = max3( abs( v ) );
		return length( v / maxComponent ) * maxComponent;
	}
#endif
struct IncidentLight {
	vec3 color;
	vec3 direction;
	bool visible;
};
struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};
#ifdef USE_ALPHAHASH
	varying vec3 vPosition;
#endif
vec3 transformDirection( in vec3 dir, in mat4 matrix ) {
	return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );
}
#define inverseTransformDirection transformDirectionByInverseViewMatrix
vec3 transformNormalByInverseViewMatrix( in vec3 normal, in mat4 viewMatrix ) {
	return normalize( ( vec4( normal, 0.0 ) * viewMatrix ).xyz );
}
vec3 transformDirectionByInverseViewMatrix( in vec3 dir, in mat4 viewMatrix ) {
	return normalize( ( vec4( dir, 0.0 ) * viewMatrix ).xyz );
}
bool isPerspectiveMatrix( mat4 m ) {
	return m[ 2 ][ 3 ] == - 1.0;
}
vec2 equirectUv( in vec3 dir ) {
	float u = atan( dir.z, dir.x ) * RECIPROCAL_PI2 + 0.5;
	float v = asin( clamp( dir.y, - 1.0, 1.0 ) ) * RECIPROCAL_PI + 0.5;
	return vec2( u, v );
}
vec3 BRDF_Lambert( const in vec3 diffuseColor ) {
	return RECIPROCAL_PI * diffuseColor;
}
vec3 F_Schlick( const in vec3 f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
}
float F_Schlick( const in float f0, const in float f90, const in float dotVH ) {
	float fresnel = exp2( ( - 5.55473 * dotVH - 6.98316 ) * dotVH );
	return f0 * ( 1.0 - fresnel ) + ( f90 * fresnel );
} // validated`,Sh=`vec3 transformedNormal = objectNormal;
#ifdef USE_TANGENT
	vec3 transformedTangent = objectTangent;
#endif
#ifdef USE_BATCHING
	mat3 bm = mat3( batchingMatrix );
	transformedNormal /= vec3( dot( bm[ 0 ], bm[ 0 ] ), dot( bm[ 1 ], bm[ 1 ] ), dot( bm[ 2 ], bm[ 2 ] ) );
	transformedNormal = bm * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = bm * transformedTangent;
	#endif
#endif
#ifdef USE_INSTANCING
	mat3 im = mat3( instanceMatrix );
	transformedNormal /= vec3( dot( im[ 0 ], im[ 0 ] ), dot( im[ 1 ], im[ 1 ] ), dot( im[ 2 ], im[ 2 ] ) );
	transformedNormal = im * transformedNormal;
	#ifdef USE_TANGENT
		transformedTangent = im * transformedTangent;
	#endif
#endif
transformedNormal = normalMatrix * transformedNormal;
#ifdef FLIP_SIDED
	transformedNormal = - transformedNormal;
#endif
#ifdef USE_TANGENT
	transformedTangent = ( modelViewMatrix * vec4( transformedTangent, 0.0 ) ).xyz;
#endif`,Mh=`#ifdef USE_DISPLACEMENTMAP
	uniform sampler2D displacementMap;
	uniform float displacementScale;
	uniform float displacementBias;
#endif`,Eh=`#ifdef USE_DISPLACEMENTMAP
	transformed += normalize( objectNormal ) * ( texture2D( displacementMap, vDisplacementMapUv ).x * displacementScale + displacementBias );
#endif`,yh=`#ifdef USE_EMISSIVEMAP
	vec4 emissiveColor = texture2D( emissiveMap, vEmissiveMapUv );
	#ifdef DECODE_VIDEO_TEXTURE_EMISSIVE
		emissiveColor = sRGBTransferEOTF( emissiveColor );
	#endif
	totalEmissiveRadiance *= emissiveColor.rgb;
#endif`,bh=`#ifdef USE_EMISSIVEMAP
	uniform sampler2D emissiveMap;
#endif`,Th="gl_FragColor = linearToOutputTexel( gl_FragColor );",Ah=`vec4 LinearTransferOETF( in vec4 value ) {
	return value;
}
vec4 sRGBTransferEOTF( in vec4 value ) {
	return vec4( mix( pow( value.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), value.rgb * 0.0773993808, vec3( lessThanEqual( value.rgb, vec3( 0.04045 ) ) ) ), value.a );
}
vec4 sRGBTransferOETF( in vec4 value ) {
	return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}`,wh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vec3 cameraToFrag;
		if ( isOrthographic ) {
			cameraToFrag = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToFrag = normalize( vWorldPosition - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vec3 reflectVec = reflect( cameraToFrag, worldNormal );
		#else
			vec3 reflectVec = refract( cameraToFrag, worldNormal, refractionRatio );
		#endif
	#else
		vec3 reflectVec = vReflect;
	#endif
	#ifdef ENVMAP_TYPE_CUBE
		vec4 envColor = textureCube( envMap, envMapRotation * reflectVec );
		#ifdef ENVMAP_BLENDING_MULTIPLY
			outgoingLight = mix( outgoingLight, outgoingLight * envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_MIX )
			outgoingLight = mix( outgoingLight, envColor.xyz, specularStrength * reflectivity );
		#elif defined( ENVMAP_BLENDING_ADD )
			outgoingLight += envColor.xyz * specularStrength * reflectivity;
		#endif
	#endif
#endif`,Rh=`#ifdef USE_ENVMAP
	uniform float envMapIntensity;
	uniform mat3 envMapRotation;
	uniform samplerCube envMap;
	#ifdef ENVMAP_TYPE_PMREM
		float roughnessToMip( const in float roughness ) {
			float r = clamp( roughness, 0.0, 1.0 );
			return ENVMAP_MAX_LOD * r * ( 2.0 - r );
		}
	#endif
#endif`,Ch=`#ifdef USE_ENVMAP
	uniform float reflectivity;
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		varying vec3 vWorldPosition;
		uniform float refractionRatio;
	#else
		varying vec3 vReflect;
	#endif
#endif`,Ph=`#ifdef USE_ENVMAP
	#if defined( USE_BUMPMAP ) || defined( USE_NORMALMAP ) || defined( PHONG ) || defined( LAMBERT )
		#define ENV_WORLDPOS
	#endif
	#ifdef ENV_WORLDPOS
		
		varying vec3 vWorldPosition;
	#else
		varying vec3 vReflect;
		uniform float refractionRatio;
	#endif
#endif`,Lh=`#ifdef USE_ENVMAP
	#ifdef ENV_WORLDPOS
		vWorldPosition = worldPosition.xyz;
	#else
		vec3 cameraToVertex;
		if ( isOrthographic ) {
			cameraToVertex = normalize( vec3( - viewMatrix[ 0 ][ 2 ], - viewMatrix[ 1 ][ 2 ], - viewMatrix[ 2 ][ 2 ] ) );
		} else {
			cameraToVertex = normalize( worldPosition.xyz - cameraPosition );
		}
		vec3 worldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
		#ifdef ENVMAP_MODE_REFLECTION
			vReflect = reflect( cameraToVertex, worldNormal );
		#else
			vReflect = refract( cameraToVertex, worldNormal, refractionRatio );
		#endif
	#endif
#endif`,Dh=`#ifdef USE_FOG
	vFogDepth = - mvPosition.z;
#endif`,Ih=`#ifdef USE_FOG
	varying float vFogDepth;
#endif`,Nh=`#ifdef USE_FOG
	#ifdef FOG_EXP2
		float fogFactor = 1.0 - exp( - fogDensity * fogDensity * vFogDepth * vFogDepth );
	#else
		float fogFactor = smoothstep( fogNear, fogFar, vFogDepth );
	#endif
	gl_FragColor.rgb = mix( gl_FragColor.rgb, fogColor, fogFactor );
#endif`,Uh=`#ifdef USE_FOG
	uniform vec3 fogColor;
	varying float vFogDepth;
	#ifdef FOG_EXP2
		uniform float fogDensity;
	#else
		uniform float fogNear;
		uniform float fogFar;
	#endif
#endif`,Fh=`#ifdef USE_GRADIENTMAP
	uniform sampler2D gradientMap;
#endif
vec3 getGradientIrradiance( vec3 normal, vec3 lightDirection ) {
	float dotNL = dot( normal, lightDirection );
	vec2 coord = vec2( dotNL * 0.5 + 0.5, 0.0 );
	#ifdef USE_GRADIENTMAP
		return vec3( texture2D( gradientMap, coord ).r );
	#else
		vec2 fw = fwidth( coord ) * 0.5;
		return mix( vec3( 0.7 ), vec3( 1.0 ), smoothstep( 0.7 - fw.x, 0.7 + fw.x, coord.x ) );
	#endif
}`,Oh=`#ifdef USE_LIGHTMAP
	uniform sampler2D lightMap;
	uniform float lightMapIntensity;
#endif`,Bh=`LambertMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularStrength = specularStrength;`,zh=`varying vec3 vViewPosition;
struct LambertMaterial {
	vec3 diffuseColor;
	float specularStrength;
};
void RE_Direct_Lambert( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Lambert( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in LambertMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Lambert
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Lambert`,Gh=`uniform bool receiveShadow;
uniform vec3 ambientLightColor;
#if defined( USE_LIGHT_PROBES )
	uniform vec3 lightProbe[ 9 ];
#endif
vec3 shGetIrradianceAt( in vec3 normal, in vec3 shCoefficients[ 9 ] ) {
	float x = normal.x, y = normal.y, z = normal.z;
	vec3 result = shCoefficients[ 0 ] * 0.886227;
	result += shCoefficients[ 1 ] * 2.0 * 0.511664 * y;
	result += shCoefficients[ 2 ] * 2.0 * 0.511664 * z;
	result += shCoefficients[ 3 ] * 2.0 * 0.511664 * x;
	result += shCoefficients[ 4 ] * 2.0 * 0.429043 * x * y;
	result += shCoefficients[ 5 ] * 2.0 * 0.429043 * y * z;
	result += shCoefficients[ 6 ] * ( 0.743125 * z * z - 0.247708 );
	result += shCoefficients[ 7 ] * 2.0 * 0.429043 * x * z;
	result += shCoefficients[ 8 ] * 0.429043 * ( x * x - y * y );
	return result;
}
vec3 getLightProbeIrradiance( const in vec3 lightProbe[ 9 ], const in vec3 normal ) {
	vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec3 irradiance = shGetIrradianceAt( worldNormal, lightProbe );
	return irradiance;
}
vec3 getAmbientLightIrradiance( const in vec3 ambientLightColor ) {
	vec3 irradiance = ambientLightColor;
	return irradiance;
}
float getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {
	float distanceFalloff = 1.0 / max( pow( lightDistance, decayExponent ), 0.01 );
	if ( cutoffDistance > 0.0 ) {
		distanceFalloff *= pow2( saturate( 1.0 - pow4( lightDistance / cutoffDistance ) ) );
	}
	return distanceFalloff;
}
float getSpotAttenuation( const in float coneCosine, const in float penumbraCosine, const in float angleCosine ) {
	return smoothstep( coneCosine, penumbraCosine, angleCosine );
}
#if NUM_SUN_LIGHTS > 0
	struct SunLight {
		vec3 direction;
		vec3 color;
	};
	uniform SunLight sunLights[ NUM_SUN_LIGHTS ];
	void getSunLightInfo( const in SunLight sunLight, out IncidentLight light ) {
		light.color = sunLight.color;
		light.direction = sunLight.direction;
		light.visible = true;
	}
#endif
#if NUM_DIR_LIGHTS > 0
	struct DirectionalLight {
		vec3 direction;
		vec3 color;
	};
	uniform DirectionalLight directionalLights[ NUM_DIR_LIGHTS ];
	void getDirectionalLightInfo( const in DirectionalLight directionalLight, out IncidentLight light ) {
		light.color = directionalLight.color;
		light.direction = directionalLight.direction;
		light.visible = true;
	}
#endif
#if NUM_POINT_LIGHTS > 0
	struct PointLight {
		vec3 position;
		vec3 color;
		float distance;
		float decay;
	};
	uniform PointLight pointLights[ NUM_POINT_LIGHTS ];
	void getPointLightInfo( const in PointLight pointLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = pointLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float lightDistance = length( lVector );
		light.color = pointLight.color;
		light.color *= getDistanceAttenuation( lightDistance, pointLight.distance, pointLight.decay );
		light.visible = ( light.color != vec3( 0.0 ) );
	}
#endif
#if NUM_SPOT_LIGHTS > 0
	struct SpotLight {
		vec3 position;
		vec3 direction;
		vec3 color;
		float distance;
		float decay;
		float coneCos;
		float penumbraCos;
	};
	uniform SpotLight spotLights[ NUM_SPOT_LIGHTS ];
	void getSpotLightInfo( const in SpotLight spotLight, const in vec3 geometryPosition, out IncidentLight light ) {
		vec3 lVector = spotLight.position - geometryPosition;
		light.direction = normalize( lVector );
		float angleCos = dot( light.direction, spotLight.direction );
		float spotAttenuation = getSpotAttenuation( spotLight.coneCos, spotLight.penumbraCos, angleCos );
		if ( spotAttenuation > 0.0 ) {
			float lightDistance = length( lVector );
			light.color = spotLight.color * spotAttenuation;
			light.color *= getDistanceAttenuation( lightDistance, spotLight.distance, spotLight.decay );
			light.visible = ( light.color != vec3( 0.0 ) );
		} else {
			light.color = vec3( 0.0 );
			light.visible = false;
		}
	}
#endif
#if NUM_RECT_AREA_LIGHTS > 0
	struct RectAreaLight {
		vec3 color;
		vec3 position;
		vec3 halfWidth;
		vec3 halfHeight;
	};
	uniform sampler2D ltc_1;	uniform sampler2D ltc_2;
	uniform RectAreaLight rectAreaLights[ NUM_RECT_AREA_LIGHTS ];
#endif
#if NUM_HEMI_LIGHTS > 0
	struct HemisphereLight {
		vec3 direction;
		vec3 skyColor;
		vec3 groundColor;
	};
	uniform HemisphereLight hemisphereLights[ NUM_HEMI_LIGHTS ];
	vec3 getHemisphereLightIrradiance( const in HemisphereLight hemiLight, const in vec3 normal ) {
		float dotNL = dot( normal, hemiLight.direction );
		float hemiDiffuseWeight = 0.5 * dotNL + 0.5;
		vec3 irradiance = mix( hemiLight.groundColor, hemiLight.skyColor, hemiDiffuseWeight );
		return irradiance;
	}
#endif
#include <lightprobes_pars_fragment>`,Hh=`#ifdef USE_ENVMAP
	vec3 getIBLIrradiance( const in vec3 normal ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 worldNormal = transformNormalByInverseViewMatrix( normal, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * worldNormal, ENVMAP_MAX_LOD );
			return PI * envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	vec3 getIBLRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
		#ifdef ENVMAP_TYPE_PMREM
			vec3 reflectVec = reflect( - viewDir, normal );
			reflectVec = normalize( mix( reflectVec, normal, pow4( roughness ) ) );
			reflectVec = transformDirectionByInverseViewMatrix( reflectVec, viewMatrix );
			vec4 envMapColor = textureLod( envMap, envMapRotation * reflectVec, roughnessToMip( roughness ) );
			return envMapColor.rgb * envMapIntensity;
		#else
			return vec3( 0.0 );
		#endif
	}
	#ifdef USE_RETROREFLECTION
		vec3 getIBLRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 retroVec = normalize( mix( viewDir, normal, pow4( roughness ) ) );
				retroVec = transformDirectionByInverseViewMatrix( retroVec, viewMatrix );
				vec4 envMapColor = textureLod( envMap, envMapRotation * retroVec, roughnessToMip( roughness ) );
				return envMapColor.rgb * envMapIntensity;
			#else
				return vec3( 0.0 );
			#endif
		}
	#endif
	#ifdef USE_ANISOTROPY
		vec3 getIBLAnisotropyRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
			#ifdef ENVMAP_TYPE_PMREM
				vec3 bentNormal = cross( bitangent, viewDir );
				bentNormal = normalize( cross( bentNormal, bitangent ) );
				bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
				return getIBLRadiance( viewDir, bentNormal, roughness );
			#else
				return vec3( 0.0 );
			#endif
		}
		#ifdef USE_RETROREFLECTION
			vec3 getIBLAnisotropyRetroRadiance( const in vec3 viewDir, const in vec3 normal, const in float roughness, const in vec3 bitangent, const in float anisotropy ) {
				#ifdef ENVMAP_TYPE_PMREM
					vec3 bentNormal = cross( bitangent, viewDir );
					bentNormal = normalize( cross( bentNormal, bitangent ) );
					bentNormal = normalize( mix( bentNormal, normal, pow2( pow2( 1.0 - anisotropy * ( 1.0 - roughness ) ) ) ) );
					return getIBLRetroRadiance( viewDir, bentNormal, roughness );
				#else
					return vec3( 0.0 );
				#endif
			}
		#endif
	#endif
#endif`,kh=`ToonMaterial material;
material.diffuseColor = diffuseColor.rgb;`,Vh=`varying vec3 vViewPosition;
struct ToonMaterial {
	vec3 diffuseColor;
};
void RE_Direct_Toon( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 irradiance = getGradientIrradiance( geometryNormal, directLight.direction ) * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
void RE_IndirectDiffuse_Toon( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in ToonMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_Toon
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Toon`,Wh=`BlinnPhongMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.specularColor = specular;
material.specularShininess = shininess;
material.specularStrength = specularStrength;`,Xh=`varying vec3 vViewPosition;
struct BlinnPhongMaterial {
	vec3 diffuseColor;
	vec3 specularColor;
	float specularShininess;
	float specularStrength;
};
void RE_Direct_BlinnPhong( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	reflectedLight.directDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
	reflectedLight.directSpecular += irradiance * BRDF_BlinnPhong( directLight.direction, geometryViewDir, geometryNormal, material.specularColor, material.specularShininess ) * material.specularStrength;
}
void RE_IndirectDiffuse_BlinnPhong( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in BlinnPhongMaterial material, inout ReflectedLight reflectedLight ) {
	reflectedLight.indirectDiffuse += irradiance * BRDF_Lambert( material.diffuseColor );
}
#define RE_Direct				RE_Direct_BlinnPhong
#define RE_IndirectDiffuse		RE_IndirectDiffuse_BlinnPhong`,qh=`PhysicalMaterial material;
material.diffuseColor = diffuseColor.rgb;
material.diffuseContribution = diffuseColor.rgb * ( 1.0 - metalnessFactor );
material.metalness = metalnessFactor;
vec3 dxy = max( abs( dFdx( nonPerturbedNormal ) ), abs( dFdy( nonPerturbedNormal ) ) );
float geometryRoughness = max( max( dxy.x, dxy.y ), dxy.z );
material.roughness = max( roughnessFactor, 0.045 );
material.roughness += geometryRoughness;
material.roughness = min( material.roughness, 1.0 );
#ifdef USE_DIFFUSE_ROUGHNESS
	float diffuseRoughnessFactor = diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		diffuseRoughnessFactor *= texture2D( diffuseRoughnessMap, vDiffuseRoughnessMapUv ).r;
	#endif
	material.diffuseRoughness = saturate( diffuseRoughnessFactor );
#endif
#ifdef IOR
	material.ior = ior;
	#ifdef USE_SPECULAR
		float specularIntensityFactor = specularIntensity;
		vec3 specularColorFactor = specularColor;
		#ifdef USE_SPECULAR_COLORMAP
			specularColorFactor *= texture2D( specularColorMap, vSpecularColorMapUv ).rgb;
		#endif
		#ifdef USE_SPECULAR_INTENSITYMAP
			specularIntensityFactor *= texture2D( specularIntensityMap, vSpecularIntensityMapUv ).a;
		#endif
		material.specularF90 = mix( specularIntensityFactor, 1.0, metalnessFactor );
	#else
		float specularIntensityFactor = 1.0;
		vec3 specularColorFactor = vec3( 1.0 );
		material.specularF90 = 1.0;
	#endif
	material.specularColor = min( pow2( ( material.ior - 1.0 ) / ( material.ior + 1.0 ) ) * specularColorFactor, vec3( 1.0 ) ) * specularIntensityFactor;
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
#else
	material.specularColor = vec3( 0.04 );
	material.specularColorBlended = mix( material.specularColor, diffuseColor.rgb, metalnessFactor );
	material.specularF90 = 1.0;
#endif
#ifdef USE_CLEARCOAT
	material.clearcoat = clearcoat;
	material.clearcoatRoughness = clearcoatRoughness;
	material.clearcoatF0 = vec3( 0.04 );
	material.clearcoatF90 = 1.0;
	#ifdef USE_CLEARCOATMAP
		material.clearcoat *= texture2D( clearcoatMap, vClearcoatMapUv ).x;
	#endif
	#ifdef USE_CLEARCOAT_ROUGHNESSMAP
		material.clearcoatRoughness *= texture2D( clearcoatRoughnessMap, vClearcoatRoughnessMapUv ).y;
	#endif
	material.clearcoat = saturate( material.clearcoat );	material.clearcoatRoughness = max( material.clearcoatRoughness, 0.045 );
	material.clearcoatRoughness += geometryRoughness;
	material.clearcoatRoughness = min( material.clearcoatRoughness, 1.0 );
#endif
#ifdef USE_DISPERSION
	material.dispersion = dispersion;
#endif
#ifdef USE_RETROREFLECTION
	material.retroreflectivity = retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	material.iridescence = iridescence;
	material.iridescenceIOR = iridescenceIOR;
	#ifdef USE_IRIDESCENCEMAP
		material.iridescence *= texture2D( iridescenceMap, vIridescenceMapUv ).r;
	#endif
	#ifdef USE_IRIDESCENCE_THICKNESSMAP
		material.iridescenceThickness = (iridescenceThicknessMaximum - iridescenceThicknessMinimum) * texture2D( iridescenceThicknessMap, vIridescenceThicknessMapUv ).g + iridescenceThicknessMinimum;
	#else
		material.iridescenceThickness = iridescenceThicknessMaximum;
	#endif
#endif
#ifdef USE_SHEEN
	material.sheenColor = sheenColor;
	#ifdef USE_SHEEN_COLORMAP
		material.sheenColor *= texture2D( sheenColorMap, vSheenColorMapUv ).rgb;
	#endif
	material.sheenRoughness = clamp( sheenRoughness, 0.0001, 1.0 );
	#ifdef USE_SHEEN_ROUGHNESSMAP
		material.sheenRoughness *= texture2D( sheenRoughnessMap, vSheenRoughnessMapUv ).a;
	#endif
#endif
#ifdef USE_ANISOTROPY
	#ifdef USE_ANISOTROPYMAP
		mat2 anisotropyMat = mat2( anisotropyVector.x, anisotropyVector.y, - anisotropyVector.y, anisotropyVector.x );
		vec3 anisotropyPolar = texture2D( anisotropyMap, vAnisotropyMapUv ).rgb;
		vec2 anisotropyV = anisotropyMat * normalize( 2.0 * anisotropyPolar.rg - vec2( 1.0 ) ) * anisotropyPolar.b;
	#else
		vec2 anisotropyV = anisotropyVector;
	#endif
	material.anisotropy = length( anisotropyV );
	if( material.anisotropy == 0.0 ) {
		anisotropyV = vec2( 1.0, 0.0 );
	} else {
		anisotropyV /= material.anisotropy;
		material.anisotropy = saturate( material.anisotropy );
	}
	material.alphaT = mix( pow2( material.roughness ), 1.0, pow2( material.anisotropy ) );
	material.anisotropyT = tbn[ 0 ] * anisotropyV.x + tbn[ 1 ] * anisotropyV.y;
	material.anisotropyB = tbn[ 1 ] * anisotropyV.x - tbn[ 0 ] * anisotropyV.y;
#endif`,Yh=`uniform sampler2D dfgLUT;
struct PhysicalMaterial {
	vec3 diffuseColor;
	vec3 diffuseContribution;
	vec3 specularColor;
	vec3 specularColorBlended;
	float roughness;
	float metalness;
	float specularF90;
	float dispersion;
	vec2 dfg;
	vec3 multiScatteringCompensation;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float diffuseRoughness;
	#endif
	#ifdef USE_RETROREFLECTION
		float retroreflectivity;
	#endif
	#ifdef USE_CLEARCOAT
		float clearcoat;
		float clearcoatRoughness;
		vec3 clearcoatF0;
		float clearcoatF90;
	#endif
	#ifdef USE_IRIDESCENCE
		float iridescence;
		float iridescenceIOR;
		float iridescenceThickness;
		vec3 iridescenceFresnel;
		vec3 iridescenceF0Dielectric;
		vec3 iridescenceF0Metallic;
	#endif
	#ifdef USE_SHEEN
		vec3 sheenColor;
		float sheenRoughness;
	#endif
	#ifdef IOR
		float ior;
	#endif
	#ifdef USE_TRANSMISSION
		float transmission;
		float transmissionAlpha;
		float thickness;
		float attenuationDistance;
		vec3 attenuationColor;
	#endif
	#ifdef USE_ANISOTROPY
		float anisotropy;
		float alphaT;
		vec3 anisotropyT;
		vec3 anisotropyB;
	#endif
};
vec3 clearcoatSpecularDirect = vec3( 0.0 );
vec3 clearcoatSpecularIndirect = vec3( 0.0 );
vec3 sheenSpecularDirect = vec3( 0.0 );
vec3 sheenSpecularIndirect = vec3(0.0 );
vec3 Schlick_to_F0( const in vec3 f, const in float f90, const in float dotVH ) {
    float x = clamp( 1.0 - dotVH, 0.0, 1.0 );
    float x2 = x * x;
    float x5 = clamp( x * x2 * x2, 0.0, 0.9999 );
    return ( f - vec3( f90 ) * x5 ) / ( 1.0 - x5 );
}
#ifdef USE_DIFFUSE_ROUGHNESS
	const float EON_EPSILON = 1e-7;
	float FON_DirectionalAlbedo( const in float mu, const in float roughness, const in float A ) {
		float muComp = 1.0 - mu;
		float gOverPi = muComp * ( 0.0571085289 + muComp * ( 0.491881867 + muComp * ( - 0.332181442 + muComp * 0.0714429953 ) ) );
		return A * ( 1.0 + roughness * gOverPi );
	}
	vec3 BRDF_EON( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in vec3 diffuseColor, const in float roughness ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return BRDF_Lambert( rho );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float s = dot( lightDir, viewDir ) - dotNL * dotNV;
		float sOverT = ( s > 0.0 ) ? s / max( max( dotNL, dotNV ), EON_EPSILON ) : s;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		vec3 singleScatter = rho * RECIPROCAL_PI * A * ( 1.0 + roughness * sOverT );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		float albedoV = FON_DirectionalAlbedo( dotNV, roughness, A );
		float albedoL = FON_DirectionalAlbedo( dotNL, roughness, A );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		vec3 multiScatter = rhoMultiScatter * RECIPROCAL_PI
			* max( EON_EPSILON, 1.0 - albedoV )
			* max( EON_EPSILON, 1.0 - albedoL )
			/ max( EON_EPSILON, 1.0 - averageAlbedo );
		return singleScatter + multiScatter;
	}
	vec3 EON_DirectionalAlbedo( const in vec3 diffuseColor, const in float roughness, const in float dotNV ) {
		vec3 rho = saturate( diffuseColor );
		if ( roughness <= EON_EPSILON ) return rho;
		float A = 1.0 / ( 1.0 + ( 0.5 - 2.0 / ( 3.0 * PI ) ) * roughness );
		float directionalAlbedo = FON_DirectionalAlbedo( dotNV, roughness, A );
		float averageAlbedo = A * ( 1.0 + ( 2.0 / 3.0 - 28.0 / ( 15.0 * PI ) ) * roughness );
		vec3 rhoMultiScatter = rho * rho * averageAlbedo / max( vec3( EON_EPSILON ), vec3( 1.0 ) - rho * ( 1.0 - averageAlbedo ) );
		return rho * directionalAlbedo + rhoMultiScatter * ( 1.0 - directionalAlbedo );
	}
#endif
float V_GGX_SmithCorrelated( const in float alpha, const in float dotNL, const in float dotNV ) {
	float a2 = pow2( alpha );
	float gv = dotNL * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNV ) );
	float gl = dotNV * sqrt( a2 + ( 1.0 - a2 ) * pow2( dotNL ) );
	return 0.5 / max( gv + gl, EPSILON );
}
float D_GGX( const in float alpha, const in float dotNH ) {
	float a2 = pow2( alpha );
	float denom = pow2( dotNH ) * ( a2 - 1.0 ) + 1.0;
	return RECIPROCAL_PI * a2 / pow2( denom );
}
#ifdef USE_ANISOTROPY
	float V_GGX_SmithCorrelated_Anisotropic( const in float alphaT, const in float alphaB, const in float dotTV, const in float dotBV, const in float dotTL, const in float dotBL, const in float dotNV, const in float dotNL ) {
		float gv = dotNL * length( vec3( alphaT * dotTV, alphaB * dotBV, dotNV ) );
		float gl = dotNV * length( vec3( alphaT * dotTL, alphaB * dotBL, dotNL ) );
		return 0.5 / max( gv + gl, EPSILON );
	}
	float D_GGX_Anisotropic( const in float alphaT, const in float alphaB, const in float dotNH, const in float dotTH, const in float dotBH ) {
		float a2 = alphaT * alphaB;
		highp vec3 v = vec3( alphaB * dotTH, alphaT * dotBH, a2 * dotNH );
		highp float v2 = dot( v, v );
		float w2 = a2 / v2;
		return RECIPROCAL_PI * a2 * pow2 ( w2 );
	}
#endif
#ifdef USE_CLEARCOAT
	vec3 BRDF_GGX_Clearcoat( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material) {
		vec3 f0 = material.clearcoatF0;
		float f90 = material.clearcoatF90;
		float roughness = max( material.clearcoatRoughness, 0.045 );
		float alpha = pow2( roughness );
		vec3 halfDir = normalize( lightDir + viewDir );
		float dotNL = saturate( dot( normal, lightDir ) );
		float dotNV = saturate( dot( normal, viewDir ) );
		float dotNH = saturate( dot( normal, halfDir ) );
		float dotVH = saturate( dot( viewDir, halfDir ) );
		vec3 F = F_Schlick( f0, f90, dotVH );
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
		return F * ( V * D );
	}
#endif
vec3 BRDF_GGX( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, const in PhysicalMaterial material ) {
	vec3 f0 = material.specularColorBlended;
	float f90 = material.specularF90;
	float roughness = max( material.roughness, 0.045 );
	float alpha = pow2( roughness );
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float dotVH = saturate( dot( viewDir, halfDir ) );
	vec3 F = F_Schlick( f0, f90, dotVH );
	#ifdef USE_IRIDESCENCE
		F = mix( F, material.iridescenceFresnel, material.iridescence );
	#endif
	#ifdef USE_ANISOTROPY
		float dotTL = dot( material.anisotropyT, lightDir );
		float dotTV = dot( material.anisotropyT, viewDir );
		float dotTH = dot( material.anisotropyT, halfDir );
		float dotBL = dot( material.anisotropyB, lightDir );
		float dotBV = dot( material.anisotropyB, viewDir );
		float dotBH = dot( material.anisotropyB, halfDir );
		float alphaT = max( material.alphaT, alpha );
		float V = V_GGX_SmithCorrelated_Anisotropic( alphaT, alpha, dotTV, dotBV, dotTL, dotBL, dotNV, dotNL );
		float D = D_GGX_Anisotropic( alphaT, alpha, dotNH, dotTH, dotBH );
	#else
		float V = V_GGX_SmithCorrelated( alpha, dotNL, dotNV );
		float D = D_GGX( alpha, dotNH );
	#endif
	return F * ( V * D );
}
vec2 LTC_Uv( const in vec3 N, const in vec3 V, const in float roughness ) {
	const float LUT_SIZE = 64.0;
	const float LUT_SCALE = ( LUT_SIZE - 1.0 ) / LUT_SIZE;
	const float LUT_BIAS = 0.5 / LUT_SIZE;
	float dotNV = saturate( dot( N, V ) );
	vec2 uv = vec2( roughness, sqrt( 1.0 - dotNV ) );
	uv = uv * LUT_SCALE + LUT_BIAS;
	return uv;
}
float LTC_ClippedSphereFormFactor( const in vec3 f ) {
	float l = length( f );
	return max( ( l * l + f.z ) / ( l + 1.0 ), 0.0 );
}
vec3 LTC_EdgeVectorFormFactor( const in vec3 v1, const in vec3 v2 ) {
	float x = dot( v1, v2 );
	float y = abs( x );
	float a = 0.8543985 + ( 0.4965155 + 0.0145206 * y ) * y;
	float b = 3.4175940 + ( 4.1616724 + y ) * y;
	float v = a / b;
	float theta_sintheta = ( x > 0.0 ) ? v : 0.5 * inversesqrt( max( 1.0 - x * x, 1e-7 ) ) - v;
	return cross( v1, v2 ) * theta_sintheta;
}
vec3 LTC_Evaluate( const in vec3 N, const in vec3 V, const in vec3 P, const in mat3 mInv, const in vec3 rectCoords[ 4 ] ) {
	vec3 v1 = rectCoords[ 1 ] - rectCoords[ 0 ];
	vec3 v2 = rectCoords[ 3 ] - rectCoords[ 0 ];
	vec3 lightNormal = cross( v1, v2 );
	if( dot( lightNormal, P - rectCoords[ 0 ] ) < 0.0 ) return vec3( 0.0 );
	vec3 T1, T2;
	T1 = normalize( V - N * dot( V, N ) );
	T2 = - cross( N, T1 );
	mat3 mat = mInv * transpose( mat3( T1, T2, N ) );
	vec3 coords[ 4 ];
	coords[ 0 ] = mat * ( rectCoords[ 0 ] - P );
	coords[ 1 ] = mat * ( rectCoords[ 1 ] - P );
	coords[ 2 ] = mat * ( rectCoords[ 2 ] - P );
	coords[ 3 ] = mat * ( rectCoords[ 3 ] - P );
	coords[ 0 ] = normalize( coords[ 0 ] );
	coords[ 1 ] = normalize( coords[ 1 ] );
	coords[ 2 ] = normalize( coords[ 2 ] );
	coords[ 3 ] = normalize( coords[ 3 ] );
	vec3 vectorFormFactor = vec3( 0.0 );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 0 ], coords[ 1 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 1 ], coords[ 2 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 2 ], coords[ 3 ] );
	vectorFormFactor += LTC_EdgeVectorFormFactor( coords[ 3 ], coords[ 0 ] );
	float result = LTC_ClippedSphereFormFactor( vectorFormFactor );
	return vec3( result );
}
#if defined( USE_SHEEN )
float D_Charlie( float roughness, float dotNH ) {
	float alpha = pow2( roughness );
	float invAlpha = 1.0 / alpha;
	float cos2h = dotNH * dotNH;
	float sin2h = max( 1.0 - cos2h, 0.0078125 );
	return ( 2.0 + invAlpha ) * pow( sin2h, invAlpha * 0.5 ) / ( 2.0 * PI );
}
float V_Neubelt( float dotNV, float dotNL ) {
	return saturate( 1.0 / ( 4.0 * ( dotNL + dotNV - dotNL * dotNV ) ) );
}
vec3 BRDF_Sheen( const in vec3 lightDir, const in vec3 viewDir, const in vec3 normal, vec3 sheenColor, const in float sheenRoughness ) {
	vec3 halfDir = normalize( lightDir + viewDir );
	float dotNL = saturate( dot( normal, lightDir ) );
	float dotNV = saturate( dot( normal, viewDir ) );
	float dotNH = saturate( dot( normal, halfDir ) );
	float D = D_Charlie( sheenRoughness, dotNH );
	float V = V_Neubelt( dotNV, dotNL );
	return sheenColor * ( D * V );
}
#endif
float IBLSheenBRDF( const in vec3 normal, const in vec3 viewDir, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	float r2 = roughness * roughness;
	float rInv = 1.0 / ( roughness + 0.1 );
	float a = -1.9362 + 1.0678 * roughness + 0.4573 * r2 - 0.8469 * rInv;
	float b = -0.6014 + 0.5538 * roughness - 0.4670 * r2 - 0.1255 * rInv;
	float DG = exp( a * dotNV + b );
	return saturate( DG );
}
vec3 EnvironmentBRDF( const in vec3 normal, const in vec3 viewDir, const in vec3 specularColor, const in float specularF90, const in float roughness ) {
	float dotNV = saturate( dot( normal, viewDir ) );
	vec2 fab = texture2D( dfgLUT, vec2( roughness, dotNV ) ).rg;
	return specularColor * fab.x + specularF90 * fab.y;
}
#ifdef USE_IRIDESCENCE
void computeMultiscatteringIridescence( const in vec2 fab, const in vec3 specularColor, const in float specularF90, const in float iridescence, const in vec3 iridescenceF0, inout vec3 singleScatter, inout vec3 multiScatter ) {
#else
void computeMultiscattering( const in vec2 fab, const in vec3 specularColor, const in float specularF90, inout vec3 singleScatter, inout vec3 multiScatter ) {
#endif
	#ifdef USE_IRIDESCENCE
		vec3 Fr = mix( specularColor, iridescenceF0, iridescence );
	#else
		vec3 Fr = specularColor;
	#endif
	vec3 FssEss = Fr * fab.x + specularF90 * fab.y;
	float Ess = fab.x + fab.y;
	float Ems = 1.0 - Ess;
	vec3 Favg = Fr + ( 1.0 - Fr ) * 0.047619;	vec3 Fms = FssEss * Favg / ( 1.0 - Ems * Favg );
	singleScatter += FssEss;
	multiScatter += Fms * Ems;
}
#if NUM_RECT_AREA_LIGHTS > 0
	void RE_Direct_RectArea_Physical( const in RectAreaLight rectAreaLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
		vec3 normal = geometryNormal;
		vec3 viewDir = geometryViewDir;
		vec3 position = geometryPosition;
		vec3 lightPos = rectAreaLight.position;
		vec3 halfWidth = rectAreaLight.halfWidth;
		vec3 halfHeight = rectAreaLight.halfHeight;
		vec3 lightColor = rectAreaLight.color;
		float roughness = material.roughness;
		vec3 rectCoords[ 4 ];
		rectCoords[ 0 ] = lightPos + halfWidth - halfHeight;		rectCoords[ 1 ] = lightPos - halfWidth - halfHeight;
		rectCoords[ 2 ] = lightPos - halfWidth + halfHeight;
		rectCoords[ 3 ] = lightPos + halfWidth + halfHeight;
		vec2 uv = LTC_Uv( normal, viewDir, roughness );
		vec4 t1 = texture2D( ltc_1, uv );
		vec4 t2 = texture2D( ltc_2, uv );
		mat3 mInv = mat3(
			vec3( t1.x, 0, t1.y ),
			vec3(    0, 1,    0 ),
			vec3( t1.z, 0, t1.w )
		);
		vec3 fresnel = ( material.specularColorBlended * t2.x + ( material.specularF90 - material.specularColorBlended ) * t2.y );
		reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );
		reflectedLight.directDiffuse += lightColor * material.diffuseContribution * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );
		#ifdef USE_CLEARCOAT
			vec3 Ncc = geometryClearcoatNormal;
			vec2 uvClearcoat = LTC_Uv( Ncc, viewDir, material.clearcoatRoughness );
			vec4 t1Clearcoat = texture2D( ltc_1, uvClearcoat );
			vec4 t2Clearcoat = texture2D( ltc_2, uvClearcoat );
			mat3 mInvClearcoat = mat3(
				vec3( t1Clearcoat.x, 0, t1Clearcoat.y ),
				vec3(             0, 1,             0 ),
				vec3( t1Clearcoat.z, 0, t1Clearcoat.w )
			);
			vec3 fresnelClearcoat = material.clearcoatF0 * t2Clearcoat.x + ( material.clearcoatF90 - material.clearcoatF0 ) * t2Clearcoat.y;
			clearcoatSpecularDirect += lightColor * fresnelClearcoat * LTC_Evaluate( Ncc, viewDir, position, mInvClearcoat, rectCoords );
		#endif
	}
#endif
void RE_Direct_Physical( const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	float dotNL = saturate( dot( geometryNormal, directLight.direction ) );
	vec3 irradiance = dotNL * directLight.color;
	#ifdef USE_CLEARCOAT
		float dotNLcc = saturate( dot( geometryClearcoatNormal, directLight.direction ) );
		vec3 ccIrradiance = dotNLcc * directLight.color;
		clearcoatSpecularDirect += ccIrradiance * BRDF_GGX_Clearcoat( directLight.direction, geometryViewDir, geometryClearcoatNormal, material );
	#endif
	#ifdef USE_SHEEN
 
 		sheenSpecularDirect += irradiance * BRDF_Sheen( directLight.direction, geometryViewDir, geometryNormal, material.sheenColor, material.sheenRoughness );
 
 		float sheenAlbedoV = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
 		float sheenAlbedoL = IBLSheenBRDF( geometryNormal, directLight.direction, material.sheenRoughness );
 
 		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * max( sheenAlbedoV, sheenAlbedoL );
 
 		irradiance *= sheenEnergyComp;
 
 	#endif
	vec3 specularBRDF = BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );
	#ifdef USE_RETROREFLECTION
		vec3 retroViewDir = reflect( - geometryViewDir, geometryNormal );
		vec3 retroSpecularBRDF = BRDF_GGX( directLight.direction, retroViewDir, geometryNormal, material );
		specularBRDF = mix( specularBRDF, retroSpecularBRDF, saturate( material.retroreflectivity ) );
	#endif
	reflectedLight.directSpecular += irradiance * specularBRDF * material.multiScatteringCompensation;
	vec3 halfDir = normalize( directLight.direction + geometryViewDir );
	float dotVH = saturate( dot( geometryViewDir, halfDir ) );
	vec3 F = F_Schlick( material.specularColor, material.specularF90, dotVH );
	#ifdef USE_RETROREFLECTION
		vec3 retroHalfDir = normalize( directLight.direction + retroViewDir );
		float dotRetroVH = saturate( dot( retroViewDir, retroHalfDir ) );
		vec3 retroF = F_Schlick( material.specularColor, material.specularF90, dotRetroVH );
		F = mix( F, retroF, saturate( material.retroreflectivity ) );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		vec3 diffuseBRDF = BRDF_EON( directLight.direction, geometryViewDir, geometryNormal, material.diffuseColor, material.diffuseRoughness ) * ( 1.0 - material.metalness );
	#else
		vec3 diffuseBRDF = BRDF_Lambert( material.diffuseContribution );
	#endif
	reflectedLight.directDiffuse += irradiance * diffuseBRDF * ( 1.0 - F );
}
void RE_IndirectDiffuse_Physical( const in vec3 irradiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight ) {
	vec3 singleScattering = vec3( 0.0 );
	vec3 multiScattering = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScattering, multiScattering );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScattering, multiScattering );
	#endif
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuseAlbedo = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness );
		vec3 diffuse = irradiance * RECIPROCAL_PI * diffuseAlbedo * ( 1.0 - singleScattering - multiScattering );
	#else
		vec3 diffuse = irradiance * BRDF_Lambert( material.diffuseContribution ) * ( 1.0 - singleScattering - multiScattering );
	#endif
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		sheenSpecularIndirect += irradiance * material.sheenColor * sheenAlbedo * RECIPROCAL_PI;
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		diffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectDiffuse += diffuse;
}
void RE_IndirectSpecular_Physical( const in vec3 radiance, const in vec3 irradiance, const in vec3 clearcoatRadiance, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, const in PhysicalMaterial material, inout ReflectedLight reflectedLight) {
	#ifdef USE_CLEARCOAT
		clearcoatSpecularIndirect += clearcoatRadiance * EnvironmentBRDF( geometryClearcoatNormal, geometryViewDir, material.clearcoatF0, material.clearcoatF90, material.clearcoatRoughness );
	#endif
	#ifdef USE_SHEEN
		sheenSpecularIndirect += irradiance * material.sheenColor * IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness ) * RECIPROCAL_PI;
 	#endif
	vec3 singleScatteringDielectric = vec3( 0.0 );
	vec3 multiScatteringDielectric = vec3( 0.0 );
	vec3 singleScatteringMetallic = vec3( 0.0 );
	vec3 multiScatteringMetallic = vec3( 0.0 );
	#ifdef USE_IRIDESCENCE
		computeMultiscatteringIridescence( material.dfg, material.specularColor, material.specularF90, material.iridescence, material.iridescenceF0Dielectric, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscatteringIridescence( material.dfg, material.diffuseColor, material.specularF90, material.iridescence, material.iridescenceF0Metallic, singleScatteringMetallic, multiScatteringMetallic );
	#else
		computeMultiscattering( material.dfg, material.specularColor, material.specularF90, singleScatteringDielectric, multiScatteringDielectric );
		computeMultiscattering( material.dfg, material.diffuseColor, material.specularF90, singleScatteringMetallic, multiScatteringMetallic );
	#endif
	vec3 singleScattering = mix( singleScatteringDielectric, singleScatteringMetallic, material.metalness );
	vec3 multiScattering = mix( multiScatteringDielectric, multiScatteringMetallic, material.metalness );
	vec3 totalScatteringDielectric = singleScatteringDielectric + multiScatteringDielectric;
	#ifdef USE_DIFFUSE_ROUGHNESS
		float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
		vec3 diffuse = EON_DirectionalAlbedo( material.diffuseColor, material.diffuseRoughness, dotNV ) * ( 1.0 - material.metalness ) * ( 1.0 - totalScatteringDielectric );
	#else
		vec3 diffuse = material.diffuseContribution * ( 1.0 - totalScatteringDielectric );
	#endif
	vec3 cosineWeightedIrradiance = irradiance * RECIPROCAL_PI;
	vec3 indirectSpecular = radiance * singleScattering;
	indirectSpecular += multiScattering * cosineWeightedIrradiance;
	vec3 indirectDiffuse = diffuse * cosineWeightedIrradiance;
	#ifdef USE_SHEEN
		float sheenAlbedo = IBLSheenBRDF( geometryNormal, geometryViewDir, material.sheenRoughness );
		float sheenEnergyComp = 1.0 - max3( material.sheenColor ) * sheenAlbedo;
		indirectSpecular *= sheenEnergyComp;
		indirectDiffuse *= sheenEnergyComp;
	#endif
	reflectedLight.indirectSpecular += indirectSpecular;
	reflectedLight.indirectDiffuse += indirectDiffuse;
}
#define RE_Direct				RE_Direct_Physical
#define RE_Direct_RectArea		RE_Direct_RectArea_Physical
#define RE_IndirectDiffuse		RE_IndirectDiffuse_Physical
#define RE_IndirectSpecular		RE_IndirectSpecular_Physical
float computeSpecularOcclusion( const in float dotNV, const in float ambientOcclusion, const in float roughness ) {
	return saturate( pow( dotNV + ambientOcclusion, exp2( - 16.0 * roughness - 1.0 ) ) - 1.0 + ambientOcclusion );
}`,Kh=`
vec3 geometryPosition = - vViewPosition;
vec3 geometryNormal = normal;
vec3 geometryViewDir = ( isOrthographic ) ? vec3( 0, 0, 1 ) : normalize( vViewPosition );
vec3 geometryClearcoatNormal = vec3( 0.0 );
#ifdef USE_CLEARCOAT
	geometryClearcoatNormal = clearcoatNormal;
#endif
#ifdef USE_IRIDESCENCE
	float dotNVi = saturate( dot( normal, geometryViewDir ) );
	if ( material.iridescenceThickness == 0.0 ) {
		material.iridescence = 0.0;
	} else {
		material.iridescence = saturate( material.iridescence );
	}
	if ( material.iridescence > 0.0 ) {
		vec3 iridescenceFresnelDielectric = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.specularColor );
		vec3 iridescenceFresnelMetallic = evalIridescence( 1.0, material.iridescenceIOR, dotNVi, material.iridescenceThickness, material.diffuseColor );
		material.iridescenceFresnel = mix( iridescenceFresnelDielectric, iridescenceFresnelMetallic, material.metalness );
		material.iridescenceF0Dielectric = Schlick_to_F0( iridescenceFresnelDielectric, 1.0, dotNVi );
		material.iridescenceF0Metallic = Schlick_to_F0( iridescenceFresnelMetallic, 1.0, dotNVi );
	}
#endif
#ifdef STANDARD
	float dotNVms = saturate( dot( geometryNormal, geometryViewDir ) );
	material.dfg = texture2D( dfgLUT, vec2( material.roughness, dotNVms ) ).rg;
	#if ( NUM_SUN_LIGHTS > 0 || NUM_DIR_LIGHTS > 0 || NUM_POINT_LIGHTS > 0 || NUM_SPOT_LIGHTS > 0 )
		float EssMs = material.dfg.x + material.dfg.y;
		material.multiScatteringCompensation = 1.0 + material.specularColorBlended * ( 1.0 / EssMs - 1.0 );
	#endif
#endif
IncidentLight directLight;
#if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )
	PointLight pointLight;
	#if defined( USE_SHADOWMAP ) && NUM_POINT_LIGHT_SHADOWS > 0
	PointLightShadow pointLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {
		pointLight = pointLights[ i ];
		getPointLightInfo( pointLight, geometryPosition, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_POINT_LIGHT_SHADOWS ) && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
		pointLightShadow = pointLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getPointShadow( pointShadowMap[ i ], pointLightShadow.shadowMapSize, pointLightShadow.shadowIntensity, pointLightShadow.shadowBias, pointLightShadow.shadowRadius, vPointShadowCoord[ i ], pointLightShadow.shadowCameraNear, pointLightShadow.shadowCameraFar ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SPOT_LIGHTS > 0 ) && defined( RE_Direct )
	SpotLight spotLight;
	vec4 spotColor;
	vec3 spotLightCoord;
	bool inSpotLightMap;
	#if defined( USE_SHADOWMAP ) && NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHTS; i ++ ) {
		spotLight = spotLights[ i ];
		getSpotLightInfo( spotLight, geometryPosition, directLight );
		#if ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#define SPOT_LIGHT_MAP_INDEX UNROLLED_LOOP_INDEX
		#elif ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		#define SPOT_LIGHT_MAP_INDEX NUM_SPOT_LIGHT_MAPS
		#else
		#define SPOT_LIGHT_MAP_INDEX ( UNROLLED_LOOP_INDEX - NUM_SPOT_LIGHT_SHADOWS + NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS )
		#endif
		#if ( SPOT_LIGHT_MAP_INDEX < NUM_SPOT_LIGHT_MAPS )
			spotLightCoord = vSpotLightCoord[ i ].xyz / vSpotLightCoord[ i ].w;
			inSpotLightMap = all( lessThan( abs( spotLightCoord * 2. - 1. ), vec3( 1.0 ) ) );
			spotColor = texture2D( spotLightMap[ SPOT_LIGHT_MAP_INDEX ], spotLightCoord.xy );
			directLight.color = inSpotLightMap ? directLight.color * spotColor.rgb : directLight.color;
		#endif
		#undef SPOT_LIGHT_MAP_INDEX
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
		spotLightShadow = spotLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( spotShadowMap[ i ], spotLightShadow.shadowMapSize, spotLightShadow.shadowIntensity, spotLightShadow.shadowBias, spotLightShadow.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_SUN_LIGHTS > 0 ) && defined( RE_Direct )
	SunLight sunLight;
	#if defined( USE_SHADOWMAP ) && NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHTS; i ++ ) {
		sunLight = sunLights[ i ];
		getSunLightInfo( sunLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_SUN_LIGHT_SHADOWS )
		sunLightShadow = sunLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getSunShadow( sunShadowMap[ i ], sunLightShadow, UNROLLED_LOOP_INDEX ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )
	DirectionalLight directionalLight;
	#if defined( USE_SHADOWMAP ) && NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLightShadow;
	#endif
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {
		directionalLight = directionalLights[ i ];
		getDirectionalLightInfo( directionalLight, directLight );
		#if defined( USE_SHADOWMAP ) && ( UNROLLED_LOOP_INDEX < NUM_DIR_LIGHT_SHADOWS )
		directionalLightShadow = directionalLightShadows[ i ];
		directLight.color *= ( directLight.visible && receiveShadow ) ? getShadow( directionalShadowMap[ i ], directionalLightShadow.shadowMapSize, directionalLightShadow.shadowIntensity, directionalLightShadow.shadowBias, directionalLightShadow.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
		#endif
		RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if ( NUM_RECT_AREA_LIGHTS > 0 ) && defined( RE_Direct_RectArea )
	RectAreaLight rectAreaLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_RECT_AREA_LIGHTS; i ++ ) {
		rectAreaLight = rectAreaLights[ i ];
		RE_Direct_RectArea( rectAreaLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
	}
	#pragma unroll_loop_end
#endif
#if defined( RE_IndirectDiffuse )
	vec3 iblIrradiance = vec3( 0.0 );
	vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );
	#if defined( USE_LIGHT_PROBES )
		irradiance += getLightProbeIrradiance( lightProbe, geometryNormal );
	#endif
	#if ( NUM_HEMI_LIGHTS > 0 )
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {
			irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometryNormal );
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_LIGHT_PROBE_GRIDS > 0
		vec3 probeWorldPos = ( ( vec4( geometryPosition, 1.0 ) - viewMatrix[ 3 ] ) * viewMatrix ).xyz;
		vec3 probeWorldNormal = transformNormalByInverseViewMatrix( geometryNormal, viewMatrix );
		int probeGrid = - 1;
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( isInsideLightProbeGrid( probeWorldPos, probeWorldNormal, probesMin[ i ], probesMax[ i ], probesResolution[ i ] ) ) probeGrid = UNROLLED_LOOP_INDEX;
		}
		#pragma unroll_loop_end
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_LIGHT_PROBE_GRIDS; i ++ ) {
			if ( probeGrid == UNROLLED_LOOP_INDEX ) irradiance += getLightProbeGridIrradiance( probesSH[ i ], probesMin[ i ], probesMax[ i ], probesResolution[ i ], probeWorldPos, probeWorldNormal );
		}
		#pragma unroll_loop_end
	#endif
#endif
#if defined( RE_IndirectSpecular )
	vec3 radiance = vec3( 0.0 );
	vec3 clearcoatRadiance = vec3( 0.0 );
#endif`,$h=`#if defined( RE_IndirectDiffuse )
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		vec3 lightMapIrradiance = lightMapTexel.rgb * lightMapIntensity;
		irradiance += lightMapIrradiance;
	#endif
	#if defined( USE_ENVMAP ) && defined( ENVMAP_TYPE_PMREM )
		#if defined( STANDARD ) || defined( LAMBERT ) || defined( PHONG )
			iblIrradiance += getIBLIrradiance( geometryNormal );
		#endif
	#endif
#endif
#if defined( USE_ENVMAP ) && defined( RE_IndirectSpecular )
	#ifdef USE_ANISOTROPY
		vec3 iblRadiance = getIBLAnisotropyRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
	#else
		vec3 iblRadiance = getIBLRadiance( geometryViewDir, geometryNormal, material.roughness );
	#endif
	#ifdef USE_RETROREFLECTION
		#ifdef USE_ANISOTROPY
			vec3 retroIBLRadiance = getIBLAnisotropyRetroRadiance( geometryViewDir, geometryNormal, material.roughness, material.anisotropyB, material.anisotropy );
		#else
			vec3 retroIBLRadiance = getIBLRetroRadiance( geometryViewDir, geometryNormal, material.roughness );
		#endif
		iblRadiance = mix( iblRadiance, retroIBLRadiance, saturate( material.retroreflectivity ) );
	#endif
	radiance += iblRadiance;
	#ifdef USE_CLEARCOAT
		clearcoatRadiance += getIBLRadiance( geometryViewDir, geometryClearcoatNormal, material.clearcoatRoughness );
	#endif
#endif`,Zh=`#if defined( RE_IndirectDiffuse )
	#if defined( LAMBERT ) || defined( PHONG )
		irradiance += iblIrradiance;
	#endif
	RE_IndirectDiffuse( irradiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif
#if defined( RE_IndirectSpecular )
	RE_IndirectSpecular( radiance, iblIrradiance, clearcoatRadiance, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
#endif`,Jh=`#if NUM_LIGHT_PROBE_GRIDS > 0
uniform highp sampler3D probesSH[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMin[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesMax[ NUM_LIGHT_PROBE_GRIDS ];
uniform vec3 probesResolution[ NUM_LIGHT_PROBE_GRIDS ];
bool isInsideLightProbeGrid( vec3 worldPos, vec3 worldNormal, vec3 probesMin, vec3 probesMax, vec3 probesResolution ) {
	vec3 spacing = ( probesMax - probesMin ) / probesResolution;
	vec3 samplePos = worldPos + worldNormal * spacing * 0.5;
	vec3 margin = spacing * 0.01;
	return all( greaterThanEqual( samplePos, probesMin - margin ) ) && all( lessThanEqual( samplePos, probesMax + margin ) );
}
vec3 getLightProbeGridIrradiance( highp sampler3D probesSH, vec3 probesMin, vec3 probesMax, vec3 probesResolution, vec3 worldPos, vec3 worldNormal ) {
	vec3 res = probesResolution;
	vec3 gridRange = probesMax - probesMin;
	vec3 probeSpacing = gridRange / res;
	vec3 samplePos = worldPos + worldNormal * probeSpacing * 0.5;
	vec3 uvw = clamp( ( samplePos - probesMin ) / gridRange, 0.5 / res, 1.0 - 0.5 / res );
	float nz          = res.z;
	float paddedSlices = nz + 2.0;
	float atlasDepth  = 7.0 * paddedSlices;
	float uvZBase     = uvw.z * nz + 1.0;
	vec4 s0 = texture( probesSH, vec3( uvw.xy, ( uvZBase                       ) / atlasDepth ) );
	vec4 s1 = texture( probesSH, vec3( uvw.xy, ( uvZBase +       paddedSlices   ) / atlasDepth ) );
	vec4 s2 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 2.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s3 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 3.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s4 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 4.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s5 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 5.0 * paddedSlices   ) / atlasDepth ) );
	vec4 s6 = texture( probesSH, vec3( uvw.xy, ( uvZBase + 6.0 * paddedSlices   ) / atlasDepth ) );
	vec3 c0 = s0.xyz;
	vec3 c1 = vec3( s0.w, s1.xy );
	vec3 c2 = vec3( s1.zw, s2.x );
	vec3 c3 = s2.yzw;
	vec3 c4 = s3.xyz;
	vec3 c5 = vec3( s3.w, s4.xy );
	vec3 c6 = vec3( s4.zw, s5.x );
	vec3 c7 = s5.yzw;
	vec3 c8 = s6.xyz;
	float x = worldNormal.x, y = worldNormal.y, z = worldNormal.z;
	vec3 result = c0 * 0.886227;
	result += c1 * 2.0 * 0.511664 * y;
	result += c2 * 2.0 * 0.511664 * z;
	result += c3 * 2.0 * 0.511664 * x;
	result += c4 * 2.0 * 0.429043 * x * y;
	result += c5 * 2.0 * 0.429043 * y * z;
	result += c6 * ( 0.743125 * z * z - 0.247708 );
	result += c7 * 2.0 * 0.429043 * x * z;
	result += c8 * 0.429043 * ( x * x - y * y );
	return max( result, vec3( 0.0 ) );
}
#endif`,Qh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	gl_FragDepth = vIsPerspective == 0.0 ? gl_FragCoord.z : log2( vFragDepth ) * logDepthBufFC * 0.5;
#endif`,jh=`#if defined( USE_LOGARITHMIC_DEPTH_BUFFER )
	uniform float logDepthBufFC;
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,ed=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	varying float vFragDepth;
	varying float vIsPerspective;
#endif`,td=`#ifdef USE_LOGARITHMIC_DEPTH_BUFFER
	vFragDepth = 1.0 + gl_Position.w;
	vIsPerspective = float( isPerspectiveMatrix( projectionMatrix ) );
#endif`,nd=`#ifdef USE_MAP
	vec4 sampledDiffuseColor = texture2D( map, vMapUv );
	#ifdef DECODE_VIDEO_TEXTURE
		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );
	#endif
	diffuseColor *= sampledDiffuseColor;
#endif`,id=`#ifdef USE_MAP
	uniform sampler2D map;
#endif`,rd=`#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
	#if defined( USE_POINTS_UV )
		vec2 uv = vUv;
	#else
		vec2 uv = ( uvTransform * vec3( gl_PointCoord.x, 1.0 - gl_PointCoord.y, 1 ) ).xy;
	#endif
#endif
#ifdef USE_MAP
	diffuseColor *= texture2D( map, uv );
#endif
#ifdef USE_ALPHAMAP
	diffuseColor.a *= texture2D( alphaMap, uv ).g;
#endif`,sd=`#if defined( USE_POINTS_UV )
	varying vec2 vUv;
#else
	#if defined( USE_MAP ) || defined( USE_ALPHAMAP )
		uniform mat3 uvTransform;
	#endif
#endif
#ifdef USE_MAP
	uniform sampler2D map;
#endif
#ifdef USE_ALPHAMAP
	uniform sampler2D alphaMap;
#endif`,ad=`float metalnessFactor = metalness;
#ifdef USE_METALNESSMAP
	vec4 texelMetalness = texture2D( metalnessMap, vMetalnessMapUv );
	metalnessFactor *= texelMetalness.b;
#endif`,od=`#ifdef USE_METALNESSMAP
	uniform sampler2D metalnessMap;
#endif`,ld=`#ifdef USE_INSTANCING_MORPH
	float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	float morphTargetBaseInfluence = texelFetch( morphTexture, ivec2( 0, gl_InstanceID ), 0 ).r;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		morphTargetInfluences[i] =  texelFetch( morphTexture, ivec2( i + 1, gl_InstanceID ), 0 ).r;
	}
#endif`,cd=`#if defined( USE_MORPHCOLORS )
	#if defined( USE_COLOR_ALPHA )
		vColor *= morphTargetBaseInfluence;
	#elif defined( USE_COLOR )
		vColor.rgb *= morphTargetBaseInfluence;
	#endif
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		#if defined( USE_COLOR_ALPHA )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor += getMorph( gl_VertexID, i, 2 ) * morphTargetInfluences[ i ];
		#elif defined( USE_COLOR )
			if ( morphTargetInfluences[ i ] != 0.0 ) vColor.rgb += getMorph( gl_VertexID, i, 2 ).rgb * morphTargetInfluences[ i ];
		#endif
	}
#endif`,ud=`#ifdef USE_MORPHNORMALS
	objectNormal *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) objectNormal += getMorph( gl_VertexID, i, 1 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,hd=`#ifdef USE_MORPHTARGETS
	#ifndef USE_INSTANCING_MORPH
		uniform float morphTargetBaseInfluence;
		uniform float morphTargetInfluences[ MORPHTARGETS_COUNT ];
	#endif
	uniform sampler2DArray morphTargetsTexture;
	uniform ivec2 morphTargetsTextureSize;
	vec4 getMorph( const in int vertexIndex, const in int morphTargetIndex, const in int offset ) {
		int texelIndex = vertexIndex * MORPHTARGETS_TEXTURE_STRIDE + offset;
		int y = texelIndex / morphTargetsTextureSize.x;
		int x = texelIndex - y * morphTargetsTextureSize.x;
		ivec3 morphUV = ivec3( x, y, morphTargetIndex );
		return texelFetch( morphTargetsTexture, morphUV, 0 );
	}
#endif`,dd=`#ifdef USE_MORPHTARGETS
	transformed *= morphTargetBaseInfluence;
	for ( int i = 0; i < MORPHTARGETS_COUNT; i ++ ) {
		if ( morphTargetInfluences[ i ] != 0.0 ) transformed += getMorph( gl_VertexID, i, 0 ).xyz * morphTargetInfluences[ i ];
	}
#endif`,fd=`float faceDirection = gl_FrontFacing ? 1.0 : - 1.0;
#ifdef FLAT_SHADED
	vec3 fdx = dFdx( vViewPosition );
	vec3 fdy = dFdy( vViewPosition );
	vec3 normal = normalize( cross( fdx, fdy ) );
#else
	vec3 normal = normalize( vNormal );
	#ifdef DOUBLE_SIDED
		normal *= faceDirection;
	#endif
#endif
#if defined( USE_NORMALMAP_TANGENTSPACE ) || defined( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY )
	#ifdef USE_TANGENT
		mat3 tbn = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn = getTangentFrame( - vViewPosition, normal,
		#if defined( USE_NORMALMAP )
			vNormalMapUv
		#elif defined( USE_CLEARCOAT_NORMALMAP )
			vClearcoatNormalMapUv
		#else
			vUv
		#endif
		);
	#endif
	#ifdef DOUBLE_SIDED
		tbn[0] *= faceDirection;
		tbn[1] *= faceDirection;
	#endif
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	#ifdef USE_TANGENT
		mat3 tbn2 = mat3( normalize( vTangent ), normalize( vBitangent ), normal );
	#else
		mat3 tbn2 = getTangentFrame( - vViewPosition, normal, vClearcoatNormalMapUv );
	#endif
	#ifdef DOUBLE_SIDED
		tbn2[0] *= faceDirection;
		tbn2[1] *= faceDirection;
	#endif
#endif
vec3 nonPerturbedNormal = normal;`,pd=`#ifdef USE_NORMALMAP_OBJECTSPACE
	normal = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#ifdef FLIP_SIDED
		normal = - normal;
	#endif
	#ifdef DOUBLE_SIDED
		normal = normal * faceDirection;
	#endif
	normal = normalize( normalMatrix * normal );
#elif defined( USE_NORMALMAP_TANGENTSPACE )
	vec3 mapN = texture2D( normalMap, vNormalMapUv ).xyz * 2.0 - 1.0;
	#if defined( USE_PACKED_NORMALMAP )
		mapN = vec3( mapN.xy, sqrt( saturate( 1.0 - dot( mapN.xy, mapN.xy ) ) ) );
	#endif
	mapN.xy *= normalScale;
	normal = normalize( tbn * mapN );
#elif defined( USE_BUMPMAP )
	normal = perturbNormalArb( - vViewPosition, normal, dHdxy_fwd(), faceDirection );
#endif`,md=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,gd=`#ifndef FLAT_SHADED
	varying vec3 vNormal;
	#ifdef USE_TANGENT
		varying vec3 vTangent;
		varying vec3 vBitangent;
	#endif
#endif`,_d=`#ifndef FLAT_SHADED
	vNormal = normalize( transformedNormal );
	#ifdef USE_TANGENT
		vTangent = normalize( transformedTangent );
		vBitangent = normalize( cross( vNormal, vTangent ) * tangent.w );
		#ifdef FLIP_SIDED
			vBitangent = - vBitangent;
		#endif
	#endif
#endif`,xd=`#ifdef USE_NORMALMAP
	uniform sampler2D normalMap;
	uniform vec2 normalScale;
#endif
#ifdef USE_NORMALMAP_OBJECTSPACE
	uniform mat3 normalMatrix;
#endif
#if ! defined ( USE_TANGENT ) && ( defined ( USE_NORMALMAP_TANGENTSPACE ) || defined ( USE_CLEARCOAT_NORMALMAP ) || defined( USE_ANISOTROPY ) )
	mat3 getTangentFrame( vec3 eye_pos, vec3 surf_norm, vec2 uv ) {
		vec3 q0 = dFdx( eye_pos.xyz );
		vec3 q1 = dFdy( eye_pos.xyz );
		vec2 st0 = dFdx( uv.st );
		vec2 st1 = dFdy( uv.st );
		vec3 N = surf_norm;
		vec3 q1perp = cross( q1, N );
		vec3 q0perp = cross( N, q0 );
		vec3 T = q1perp * st0.x + q0perp * st1.x;
		vec3 B = q1perp * st0.y + q0perp * st1.y;
		float det = max( dot( T, T ), dot( B, B ) );
		float scale = ( det == 0.0 ) ? 0.0 : inversesqrt( det );
		return mat3( T * scale, B * scale, N );
	}
#endif`,vd=`#ifdef USE_CLEARCOAT
	vec3 clearcoatNormal = nonPerturbedNormal;
#endif`,Sd=`#ifdef USE_CLEARCOAT_NORMALMAP
	vec3 clearcoatMapN = texture2D( clearcoatNormalMap, vClearcoatNormalMapUv ).xyz * 2.0 - 1.0;
	clearcoatMapN.xy *= clearcoatNormalScale;
	clearcoatNormal = normalize( tbn2 * clearcoatMapN );
#endif`,Md=`#ifdef USE_CLEARCOATMAP
	uniform sampler2D clearcoatMap;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform sampler2D clearcoatNormalMap;
	uniform vec2 clearcoatNormalScale;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform sampler2D clearcoatRoughnessMap;
#endif`,Ed=`#ifdef USE_IRIDESCENCEMAP
	uniform sampler2D iridescenceMap;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform sampler2D iridescenceThicknessMap;
#endif`,yd=`#ifdef OPAQUE
diffuseColor.a = 1.0;
#endif
#ifdef USE_TRANSMISSION
diffuseColor.a *= material.transmissionAlpha;
#endif
gl_FragColor = vec4( outgoingLight, diffuseColor.a );`,bd=`vec3 packNormalToRGB( const in vec3 normal ) {
	return normalize( normal ) * 0.5 + 0.5;
}
vec3 unpackRGBToNormal( const in vec3 rgb ) {
	return 2.0 * rgb.xyz - 1.0;
}
const float PackUpscale = 256. / 255.;const float UnpackDownscale = 255. / 256.;const float ShiftRight8 = 1. / 256.;
const float Inv255 = 1. / 255.;
const vec4 PackFactors = vec4( 1.0, 256.0, 256.0 * 256.0, 256.0 * 256.0 * 256.0 );
const vec2 UnpackFactors2 = vec2( UnpackDownscale, 1.0 / PackFactors.g );
const vec3 UnpackFactors3 = vec3( UnpackDownscale / PackFactors.rg, 1.0 / PackFactors.b );
const vec4 UnpackFactors4 = vec4( UnpackDownscale / PackFactors.rgb, 1.0 / PackFactors.a );
vec4 packDepthToRGBA( const in float v ) {
	if( v <= 0.0 )
		return vec4( 0., 0., 0., 0. );
	if( v >= 1.0 )
		return vec4( 1., 1., 1., 1. );
	float vuf;
	float af = modf( v * PackFactors.a, vuf );
	float bf = modf( vuf * ShiftRight8, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec4( vuf * Inv255, gf * PackUpscale, bf * PackUpscale, af );
}
vec3 packDepthToRGB( const in float v ) {
	if( v <= 0.0 )
		return vec3( 0., 0., 0. );
	if( v >= 1.0 )
		return vec3( 1., 1., 1. );
	float vuf;
	float bf = modf( v * PackFactors.b, vuf );
	float gf = modf( vuf * ShiftRight8, vuf );
	return vec3( vuf * Inv255, gf * PackUpscale, bf );
}
vec2 packDepthToRG( const in float v ) {
	if( v <= 0.0 )
		return vec2( 0., 0. );
	if( v >= 1.0 )
		return vec2( 1., 1. );
	float vuf;
	float gf = modf( v * 256., vuf );
	return vec2( vuf * Inv255, gf );
}
float unpackRGBAToDepth( const in vec4 v ) {
	return dot( v, UnpackFactors4 );
}
float unpackRGBToDepth( const in vec3 v ) {
	return dot( v, UnpackFactors3 );
}
float unpackRGToDepth( const in vec2 v ) {
	return v.r * UnpackFactors2.r + v.g * UnpackFactors2.g;
}
vec4 pack2HalfToRGBA( const in vec2 v ) {
	vec4 r = vec4( v.x, fract( v.x * 255.0 ), v.y, fract( v.y * 255.0 ) );
	return vec4( r.x - r.y / 255.0, r.y, r.z - r.w / 255.0, r.w );
}
vec2 unpackRGBATo2Half( const in vec4 v ) {
	return vec2( v.x + ( v.y / 255.0 ), v.z + ( v.w / 255.0 ) );
}
float viewZToOrthographicDepth( const in float viewZ, const in float near, const in float far ) {
	return ( viewZ + near ) / ( near - far );
}
float orthographicDepthToViewZ( const in float depth, const in float near, const in float far ) {
	#ifdef USE_REVERSED_DEPTH_BUFFER
	
		return depth * ( far - near ) - far;
	#else
		return depth * ( near - far ) - near;
	#endif
}
float viewZToPerspectiveDepth( const in float viewZ, const in float near, const in float far ) {
	return ( ( near + viewZ ) * far ) / ( ( far - near ) * viewZ );
}
float perspectiveDepthToViewZ( const in float depth, const in float near, const in float far ) {
	
	#ifdef USE_REVERSED_DEPTH_BUFFER
		return ( near * far ) / ( ( near - far ) * depth - near );
	#else
		return ( near * far ) / ( ( far - near ) * depth - far );
	#endif
}`,Td=`#ifdef PREMULTIPLIED_ALPHA
	gl_FragColor.rgb *= gl_FragColor.a;
#endif`,Ad=`vec4 mvPosition = vec4( transformed, 1.0 );
#ifdef USE_BATCHING
	mvPosition = batchingMatrix * mvPosition;
#endif
#ifdef USE_INSTANCING
	mvPosition = instanceMatrix * mvPosition;
#endif
mvPosition = modelViewMatrix * mvPosition;
gl_Position = projectionMatrix * mvPosition;`,wd=`#ifdef DITHERING
	gl_FragColor.rgb = dithering( gl_FragColor.rgb );
#endif`,Rd=`#ifdef DITHERING
	vec3 dithering( vec3 color ) {
		float grid_position = rand( gl_FragCoord.xy );
		vec3 dither_shift_RGB = vec3( 0.25 / 255.0, -0.25 / 255.0, 0.25 / 255.0 );
		dither_shift_RGB = mix( 2.0 * dither_shift_RGB, -2.0 * dither_shift_RGB, grid_position );
		return color + dither_shift_RGB;
	}
#endif`,Cd=`float roughnessFactor = roughness;
#ifdef USE_ROUGHNESSMAP
	vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv );
	roughnessFactor *= texelRoughness.g;
#endif`,Pd=`#ifdef USE_ROUGHNESSMAP
	uniform sampler2D roughnessMap;
#endif`,Ld=`#if NUM_SPOT_LIGHT_COORDS > 0
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#if NUM_SPOT_LIGHT_MAPS > 0
	uniform sampler2D spotLightMap[ NUM_SPOT_LIGHT_MAPS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		#define SUN_LIGHT_CASCADES 2
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#else
			uniform sampler2D sunShadowMap[ NUM_SUN_LIGHT_SHADOWS ];
		#endif
		uniform mat4 sunShadowMatrix[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		uniform vec4 sunShadowCascade[ NUM_SUN_LIGHT_SHADOWS * SUN_LIGHT_CASCADES ];
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
		struct SunLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SunLightShadow sunLightShadows[ NUM_SUN_LIGHT_SHADOWS ];
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#else
			uniform sampler2D directionalShadowMap[ NUM_DIR_LIGHT_SHADOWS ];
		#endif
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform sampler2DShadow spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#else
			uniform sampler2D spotShadowMap[ NUM_SPOT_LIGHT_SHADOWS ];
		#endif
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#if defined( SHADOWMAP_TYPE_PCF )
			uniform samplerCubeShadow pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#elif defined( SHADOWMAP_TYPE_BASIC )
			uniform samplerCube pointShadowMap[ NUM_POINT_LIGHT_SHADOWS ];
		#endif
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float interleavedGradientNoise( vec2 position ) {
			return fract( 52.9829189 * fract( dot( position, vec2( 0.06711056, 0.00583715 ) ) ) );
		}
		vec2 vogelDiskSample( int sampleIndex, int samplesCount, float phi ) {
			const float goldenAngle = 2.399963229728653;
			float r = sqrt( ( float( sampleIndex ) + 0.5 ) / float( samplesCount ) );
			float theta = float( sampleIndex ) * goldenAngle + phi;
			return vec2( cos( theta ), sin( theta ) ) * r;
		}
	#endif
	#if defined( SHADOWMAP_TYPE_PCF )
		float getShadow( sampler2DShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 texelSize = vec2( 1.0 ) / shadowMapSize;
				vec2 radius = shadowRadius * texelSize;
				float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
				shadow = (
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 0, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 1, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 2, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 3, 5, phi ) * radius, shadowCoord.z ) ) +
					texture( shadowMap, vec3( shadowCoord.xy + vogelDiskSample( 4, 5, phi ) * radius, shadowCoord.z ) )
				) * 0.2;
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#elif defined( SHADOWMAP_TYPE_VSM )
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				vec2 distribution = texture2D( shadowMap, shadowCoord.xy ).rg;
				float mean = distribution.x;
				float variance = distribution.y * distribution.y;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					float hard_shadow = step( mean, shadowCoord.z );
				#else
					float hard_shadow = step( shadowCoord.z, mean );
				#endif
				
				if ( hard_shadow == 1.0 ) {
					shadow = 1.0;
				} else {
					variance = max( variance, 0.0000001 );
					float d = shadowCoord.z - mean;
					float p_max = variance / ( variance + d * d );
					p_max = clamp( ( p_max - 0.3 ) / 0.65, 0.0, 1.0 );
					shadow = max( hard_shadow, p_max );
				}
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#else
		float getShadow( sampler2D shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord ) {
			float shadow = 1.0;
			shadowCoord.xyz /= shadowCoord.w;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				shadowCoord.z -= shadowBias;
			#else
				shadowCoord.z += shadowBias;
			#endif
			bool inFrustum = shadowCoord.x >= 0.0 && shadowCoord.x <= 1.0 && shadowCoord.y >= 0.0 && shadowCoord.y <= 1.0;
			bool frustumTest = inFrustum && shadowCoord.z <= 1.0;
			if ( frustumTest ) {
				float depth = texture2D( shadowMap, shadowCoord.xy ).r;
				#ifdef USE_REVERSED_DEPTH_BUFFER
					shadow = step( depth, shadowCoord.z );
				#else
					shadow = step( shadowCoord.z, depth );
				#endif
			}
			return mix( 1.0, shadow, shadowIntensity );
		}
	#endif
	#if NUM_SUN_LIGHT_SHADOWS > 0
		float getSunShadow(
			#if defined( SHADOWMAP_TYPE_PCF )
				sampler2DShadow shadowMap,
			#else
				sampler2D shadowMap,
			#endif
			SunLightShadow sunLightShadow,
			int shadowIndex
		) {
			vec4 shadowWorldPosition = vec4( vSunShadowWorldPosition.xyz + vSunShadowWorldNormal * sunLightShadow.shadowNormalBias, 1.0 );
			float viewDepth = vSunShadowWorldPosition.w;
			int cascadeOffset = shadowIndex * SUN_LIGHT_CASCADES;
			float shadow = 1.0;
			for ( int i = SUN_LIGHT_CASCADES - 1; i >= 0; i -- ) {
				vec4 cascade = sunShadowCascade[ cascadeOffset + i ];
				if ( viewDepth >= cascade.x && viewDepth < cascade.y ) {
					float cascadeShadow = getShadow(
						shadowMap,
						sunLightShadow.shadowMapSize,
						sunLightShadow.shadowIntensity,
						sunLightShadow.shadowBias,
						sunLightShadow.shadowRadius,
						sunShadowMatrix[ cascadeOffset + i ] * shadowWorldPosition
					);
					shadow = mix( cascadeShadow, shadow, smoothstep( cascade.z, cascade.y, viewDepth ) );
				}
			}
			return shadow;
		}
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
	#if defined( SHADOWMAP_TYPE_PCF )
	float getPointShadow( samplerCubeShadow shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 bd3D = normalize( lightToPosition );
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float lightDistance = length( lightToPosition );
			float depthRange = shadowCameraFar - shadowCameraNear;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				float depthA = - shadowCameraNear / depthRange - shadowBias;
				float depthB = shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#else
				float depthA = shadowCameraFar / depthRange + shadowBias;
				float depthB = - shadowCameraNear * shadowCameraFar / ( depthRange * lightDistance );
			#endif
			float texelSize = shadowRadius / shadowMapSize.x;
			vec3 absDir = abs( bd3D );
			vec3 tangent = absDir.x > absDir.z ? vec3( 0.0, 1.0, 0.0 ) : vec3( 1.0, 0.0, 0.0 );
			tangent = normalize( cross( bd3D, tangent ) );
			vec3 bitangent = cross( bd3D, tangent );
			float phi = interleavedGradientNoise( gl_FragCoord.xy ) * PI2;
			shadow = 0.0;
			for ( int i = 0; i < 5; i ++ ) {
				vec2 offset = vogelDiskSample( i, 5, phi );
				vec3 direction = bd3D + ( tangent * offset.x + bitangent * offset.y ) * texelSize;
				vec3 absDirection = abs( direction );
				float dp = depthA + depthB / max( max( absDirection.x, absDirection.y ), absDirection.z );
				shadow += texture( shadowMap, vec4( direction, dp ) );
			}
			shadow *= 0.2;
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#elif defined( SHADOWMAP_TYPE_BASIC )
	float getPointShadow( samplerCube shadowMap, vec2 shadowMapSize, float shadowIntensity, float shadowBias, float shadowRadius, vec4 shadowCoord, float shadowCameraNear, float shadowCameraFar ) {
		float shadow = 1.0;
		vec3 lightToPosition = shadowCoord.xyz;
		vec3 absVec = abs( lightToPosition );
		float viewSpaceZ = max( max( absVec.x, absVec.y ), absVec.z );
		if ( viewSpaceZ - shadowCameraFar <= 0.0 && viewSpaceZ - shadowCameraNear >= 0.0 ) {
			float dp = ( shadowCameraFar * ( viewSpaceZ - shadowCameraNear ) ) / ( viewSpaceZ * ( shadowCameraFar - shadowCameraNear ) );
			dp += shadowBias;
			vec3 bd3D = normalize( lightToPosition );
			float depth = textureCube( shadowMap, bd3D ).r;
			#ifdef USE_REVERSED_DEPTH_BUFFER
				depth = 1.0 - depth;
			#endif
			shadow = step( dp, depth );
		}
		return mix( 1.0, shadow, shadowIntensity );
	}
	#endif
	#endif
#endif`,Dd=`#if NUM_SPOT_LIGHT_COORDS > 0
	uniform mat4 spotLightMatrix[ NUM_SPOT_LIGHT_COORDS ];
	varying vec4 vSpotLightCoord[ NUM_SPOT_LIGHT_COORDS ];
#endif
#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
		varying vec4 vSunShadowWorldPosition;
		varying vec3 vSunShadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		uniform mat4 directionalShadowMatrix[ NUM_DIR_LIGHT_SHADOWS ];
		varying vec4 vDirectionalShadowCoord[ NUM_DIR_LIGHT_SHADOWS ];
		struct DirectionalLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform DirectionalLightShadow directionalLightShadows[ NUM_DIR_LIGHT_SHADOWS ];
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
		struct SpotLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
		};
		uniform SpotLightShadow spotLightShadows[ NUM_SPOT_LIGHT_SHADOWS ];
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		uniform mat4 pointShadowMatrix[ NUM_POINT_LIGHT_SHADOWS ];
		varying vec4 vPointShadowCoord[ NUM_POINT_LIGHT_SHADOWS ];
		struct PointLightShadow {
			float shadowIntensity;
			float shadowBias;
			float shadowNormalBias;
			float shadowRadius;
			vec2 shadowMapSize;
			float shadowCameraNear;
			float shadowCameraFar;
		};
		uniform PointLightShadow pointLightShadows[ NUM_POINT_LIGHT_SHADOWS ];
	#endif
#endif`,Id=`#if ( defined( USE_SHADOWMAP ) && ( NUM_DIR_LIGHT_SHADOWS > 0 || NUM_SUN_LIGHT_SHADOWS > 0 || NUM_POINT_LIGHT_SHADOWS > 0 ) ) || ( NUM_SPOT_LIGHT_COORDS > 0 )
	#ifdef HAS_NORMAL
		vec3 shadowWorldNormal = transformNormalByInverseViewMatrix( transformedNormal, viewMatrix );
	#else
		vec3 shadowWorldNormal = vec3( 0.0 );
	#endif
	vec4 shadowWorldPosition;
#endif
#if defined( USE_SHADOWMAP )
	#if NUM_SUN_LIGHT_SHADOWS > 0
		vSunShadowWorldPosition = vec4( worldPosition.xyz, - mvPosition.z );
		vSunShadowWorldNormal = shadowWorldNormal;
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * directionalLightShadows[ i ].shadowNormalBias, 0 );
			vDirectionalShadowCoord[ i ] = directionalShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0
		#pragma unroll_loop_start
		for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
			shadowWorldPosition = worldPosition + vec4( shadowWorldNormal * pointLightShadows[ i ].shadowNormalBias, 0 );
			vPointShadowCoord[ i ] = pointShadowMatrix[ i ] * shadowWorldPosition;
		}
		#pragma unroll_loop_end
	#endif
#endif
#if NUM_SPOT_LIGHT_COORDS > 0
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_COORDS; i ++ ) {
		shadowWorldPosition = worldPosition;
		#if ( defined( USE_SHADOWMAP ) && UNROLLED_LOOP_INDEX < NUM_SPOT_LIGHT_SHADOWS )
			shadowWorldPosition.xyz += shadowWorldNormal * spotLightShadows[ i ].shadowNormalBias;
		#endif
		vSpotLightCoord[ i ] = spotLightMatrix[ i ] * shadowWorldPosition;
	}
	#pragma unroll_loop_end
#endif`,Nd=`float getShadowMask() {
	float shadow = 1.0;
	#ifdef USE_SHADOWMAP
	#if NUM_SUN_LIGHT_SHADOWS > 0
	SunLightShadow sunLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SUN_LIGHT_SHADOWS; i ++ ) {
		sunLight = sunLightShadows[ i ];
		shadow *= receiveShadow ? getSunShadow( sunShadowMap[ i ], sunLight, UNROLLED_LOOP_INDEX ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_DIR_LIGHT_SHADOWS > 0
	DirectionalLightShadow directionalLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_DIR_LIGHT_SHADOWS; i ++ ) {
		directionalLight = directionalLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowIntensity, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_SPOT_LIGHT_SHADOWS > 0
	SpotLightShadow spotLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_SPOT_LIGHT_SHADOWS; i ++ ) {
		spotLight = spotLightShadows[ i ];
		shadow *= receiveShadow ? getShadow( spotShadowMap[ i ], spotLight.shadowMapSize, spotLight.shadowIntensity, spotLight.shadowBias, spotLight.shadowRadius, vSpotLightCoord[ i ] ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#if NUM_POINT_LIGHT_SHADOWS > 0 && ( defined( SHADOWMAP_TYPE_PCF ) || defined( SHADOWMAP_TYPE_BASIC ) )
	PointLightShadow pointLight;
	#pragma unroll_loop_start
	for ( int i = 0; i < NUM_POINT_LIGHT_SHADOWS; i ++ ) {
		pointLight = pointLightShadows[ i ];
		shadow *= receiveShadow ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowIntensity, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;
	}
	#pragma unroll_loop_end
	#endif
	#endif
	return shadow;
}`,Ud=`#ifdef USE_SKINNING
	mat4 boneMatX = getBoneMatrix( skinIndex.x );
	mat4 boneMatY = getBoneMatrix( skinIndex.y );
	mat4 boneMatZ = getBoneMatrix( skinIndex.z );
	mat4 boneMatW = getBoneMatrix( skinIndex.w );
#endif`,Fd=`#ifdef USE_SKINNING
	uniform mat4 bindMatrix;
	uniform mat4 bindMatrixInverse;
	uniform highp sampler2D boneTexture;
	mat4 getBoneMatrix( const in float i ) {
		int size = textureSize( boneTexture, 0 ).x;
		int j = int( i ) * 4;
		int x = j % size;
		int y = j / size;
		vec4 v1 = texelFetch( boneTexture, ivec2( x, y ), 0 );
		vec4 v2 = texelFetch( boneTexture, ivec2( x + 1, y ), 0 );
		vec4 v3 = texelFetch( boneTexture, ivec2( x + 2, y ), 0 );
		vec4 v4 = texelFetch( boneTexture, ivec2( x + 3, y ), 0 );
		return mat4( v1, v2, v3, v4 );
	}
#endif`,Od=`#ifdef USE_SKINNING
	vec4 skinVertex = bindMatrix * vec4( transformed, 1.0 );
	vec4 skinned = vec4( 0.0 );
	skinned += boneMatX * skinVertex * skinWeight.x;
	skinned += boneMatY * skinVertex * skinWeight.y;
	skinned += boneMatZ * skinVertex * skinWeight.z;
	skinned += boneMatW * skinVertex * skinWeight.w;
	transformed = ( bindMatrixInverse * skinned ).xyz;
#endif`,Bd=`#ifdef USE_SKINNING
	mat4 skinMatrix = mat4( 0.0 );
	skinMatrix += skinWeight.x * boneMatX;
	skinMatrix += skinWeight.y * boneMatY;
	skinMatrix += skinWeight.z * boneMatZ;
	skinMatrix += skinWeight.w * boneMatW;
	skinMatrix = bindMatrixInverse * skinMatrix * bindMatrix;
	objectNormal = vec4( skinMatrix * vec4( objectNormal, 0.0 ) ).xyz;
	#ifdef USE_TANGENT
		objectTangent = vec4( skinMatrix * vec4( objectTangent, 0.0 ) ).xyz;
	#endif
#endif`,zd=`float specularStrength;
#ifdef USE_SPECULARMAP
	vec4 texelSpecular = texture2D( specularMap, vSpecularMapUv );
	specularStrength = texelSpecular.r;
#else
	specularStrength = 1.0;
#endif`,Gd=`#ifdef USE_SPECULARMAP
	uniform sampler2D specularMap;
#endif`,Hd=`#if defined( TONE_MAPPING )
	gl_FragColor.rgb = toneMapping( gl_FragColor.rgb );
#endif`,kd=`#ifndef saturate
#define saturate( a ) clamp( a, 0.0, 1.0 )
#endif
uniform float toneMappingExposure;
vec3 LinearToneMapping( vec3 color ) {
	return saturate( toneMappingExposure * color );
}
vec3 ReinhardToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	return saturate( color / ( vec3( 1.0 ) + color ) );
}
vec3 CineonToneMapping( vec3 color ) {
	color *= toneMappingExposure;
	color = max( vec3( 0.0 ), color - 0.004 );
	return pow( ( color * ( 6.2 * color + 0.5 ) ) / ( color * ( 6.2 * color + 1.7 ) + 0.06 ), vec3( 2.2 ) );
}
vec3 RRTAndODTFit( vec3 v ) {
	vec3 a = v * ( v + 0.0245786 ) - 0.000090537;
	vec3 b = v * ( 0.983729 * v + 0.4329510 ) + 0.238081;
	return a / b;
}
vec3 ACESFilmicToneMapping( vec3 color ) {
	const mat3 ACESInputMat = mat3(
		vec3( 0.59719, 0.07600, 0.02840 ),		vec3( 0.35458, 0.90834, 0.13383 ),
		vec3( 0.04823, 0.01566, 0.83777 )
	);
	const mat3 ACESOutputMat = mat3(
		vec3(  1.60475, -0.10208, -0.00327 ),		vec3( -0.53108,  1.10813, -0.07276 ),
		vec3( -0.07367, -0.00605,  1.07602 )
	);
	color *= toneMappingExposure / 0.6;
	color = ACESInputMat * color;
	color = RRTAndODTFit( color );
	color = ACESOutputMat * color;
	return saturate( color );
}
const mat3 LINEAR_REC2020_TO_LINEAR_SRGB = mat3(
	vec3( 1.6605, - 0.1246, - 0.0182 ),
	vec3( - 0.5876, 1.1329, - 0.1006 ),
	vec3( - 0.0728, - 0.0083, 1.1187 )
);
const mat3 LINEAR_SRGB_TO_LINEAR_REC2020 = mat3(
	vec3( 0.6274, 0.0691, 0.0164 ),
	vec3( 0.3293, 0.9195, 0.0880 ),
	vec3( 0.0433, 0.0113, 0.8956 )
);
vec3 agxDefaultContrastApprox( vec3 x ) {
	vec3 x2 = x * x;
	vec3 x4 = x2 * x2;
	return + 15.5 * x4 * x2
		- 40.14 * x4 * x
		+ 31.96 * x4
		- 6.868 * x2 * x
		+ 0.4298 * x2
		+ 0.1191 * x
		- 0.00232;
}
vec3 AgXToneMapping( vec3 color ) {
	const mat3 AgXInsetMatrix = mat3(
		vec3( 0.856627153315983, 0.137318972929847, 0.11189821299995 ),
		vec3( 0.0951212405381588, 0.761241990602591, 0.0767994186031903 ),
		vec3( 0.0482516061458583, 0.101439036467562, 0.811302368396859 )
	);
	const mat3 AgXOutsetMatrix = mat3(
		vec3( 1.1271005818144368, - 0.1413297634984383, - 0.14132976349843826 ),
		vec3( - 0.11060664309660323, 1.157823702216272, - 0.11060664309660294 ),
		vec3( - 0.016493938717834573, - 0.016493938717834257, 1.2519364065950405 )
	);
	const float AgxMinEv = - 12.47393;	const float AgxMaxEv = 4.026069;
	color *= toneMappingExposure;
	color = LINEAR_SRGB_TO_LINEAR_REC2020 * color;
	color = AgXInsetMatrix * color;
	color = max( color, 1e-10 );	color = log2( color );
	color = ( color - AgxMinEv ) / ( AgxMaxEv - AgxMinEv );
	color = clamp( color, 0.0, 1.0 );
	color = agxDefaultContrastApprox( color );
	color = AgXOutsetMatrix * color;
	color = pow( max( vec3( 0.0 ), color ), vec3( 2.2 ) );
	color = LINEAR_REC2020_TO_LINEAR_SRGB * color;
	color = clamp( color, 0.0, 1.0 );
	return color;
}
vec3 NeutralToneMapping( vec3 color ) {
	const float StartCompression = 0.8 - 0.04;
	const float Desaturation = 0.15;
	color *= toneMappingExposure;
	float x = min( color.r, min( color.g, color.b ) );
	float offset = x < 0.08 ? x - 6.25 * x * x : 0.04;
	color -= offset;
	float peak = max( color.r, max( color.g, color.b ) );
	if ( peak < StartCompression ) return color;
	float d = 1. - StartCompression;
	float newPeak = 1. - d * d / ( peak + d - StartCompression );
	color *= newPeak / peak;
	float g = 1. - 1. / ( Desaturation * ( peak - newPeak ) + 1. );
	return mix( color, vec3( newPeak ), g );
}
vec3 CustomToneMapping( vec3 color ) { return color; }`,Vd=`#ifdef USE_TRANSMISSION
	material.transmission = transmission;
	material.transmissionAlpha = 1.0;
	material.thickness = thickness;
	material.attenuationDistance = attenuationDistance;
	material.attenuationColor = attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		material.transmission *= texture2D( transmissionMap, vTransmissionMapUv ).r;
	#endif
	#ifdef USE_THICKNESSMAP
		material.thickness *= texture2D( thicknessMap, vThicknessMapUv ).g;
	#endif
	vec3 pos = vWorldPosition;
	vec3 v = normalize( cameraPosition - pos );
	vec3 n = transformNormalByInverseViewMatrix( normal, viewMatrix );
	vec4 transmitted = getIBLVolumeRefraction(
		n, v, material.roughness, material.diffuseContribution, material.specularColorBlended, material.specularF90,
		pos, modelMatrix, viewMatrix, projectionMatrix, material.dispersion, material.ior, material.thickness,
		material.attenuationColor, material.attenuationDistance );
	material.transmissionAlpha = mix( material.transmissionAlpha, transmitted.a, material.transmission );
	totalDiffuse = mix( totalDiffuse, transmitted.rgb, material.transmission );
#endif`,Wd=`#ifdef USE_TRANSMISSION
	uniform float transmission;
	uniform float thickness;
	uniform float attenuationDistance;
	uniform vec3 attenuationColor;
	#ifdef USE_TRANSMISSIONMAP
		uniform sampler2D transmissionMap;
	#endif
	#ifdef USE_THICKNESSMAP
		uniform sampler2D thicknessMap;
	#endif
	uniform vec2 transmissionSamplerSize;
	uniform sampler2D transmissionSamplerMap;
	uniform mat4 modelMatrix;
	uniform mat4 projectionMatrix;
	varying vec3 vWorldPosition;
	float w0( float a ) {
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - a + 3.0 ) - 3.0 ) + 1.0 );
	}
	float w1( float a ) {
		return ( 1.0 / 6.0 ) * ( a *  a * ( 3.0 * a - 6.0 ) + 4.0 );
	}
	float w2( float a ){
		return ( 1.0 / 6.0 ) * ( a * ( a * ( - 3.0 * a + 3.0 ) + 3.0 ) + 1.0 );
	}
	float w3( float a ) {
		return ( 1.0 / 6.0 ) * ( a * a * a );
	}
	float g0( float a ) {
		return w0( a ) + w1( a );
	}
	float g1( float a ) {
		return w2( a ) + w3( a );
	}
	float h0( float a ) {
		return - 1.0 + w1( a ) / ( w0( a ) + w1( a ) );
	}
	float h1( float a ) {
		return 1.0 + w3( a ) / ( w2( a ) + w3( a ) );
	}
	vec4 bicubic( sampler2D tex, vec2 uv, vec4 texelSize, float lod ) {
		uv = uv * texelSize.zw + 0.5;
		vec2 iuv = floor( uv );
		vec2 fuv = fract( uv );
		float g0x = g0( fuv.x );
		float g1x = g1( fuv.x );
		float h0x = h0( fuv.x );
		float h1x = h1( fuv.x );
		float h0y = h0( fuv.y );
		float h1y = h1( fuv.y );
		vec2 p0 = ( vec2( iuv.x + h0x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p1 = ( vec2( iuv.x + h1x, iuv.y + h0y ) - 0.5 ) * texelSize.xy;
		vec2 p2 = ( vec2( iuv.x + h0x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		vec2 p3 = ( vec2( iuv.x + h1x, iuv.y + h1y ) - 0.5 ) * texelSize.xy;
		return g0( fuv.y ) * ( g0x * textureLod( tex, p0, lod ) + g1x * textureLod( tex, p1, lod ) ) +
			g1( fuv.y ) * ( g0x * textureLod( tex, p2, lod ) + g1x * textureLod( tex, p3, lod ) );
	}
	vec4 textureBicubic( sampler2D sampler, vec2 uv, float lod ) {
		vec2 fLodSize = vec2( textureSize( sampler, int( lod ) ) );
		vec2 cLodSize = vec2( textureSize( sampler, int( lod + 1.0 ) ) );
		vec2 fLodSizeInv = 1.0 / fLodSize;
		vec2 cLodSizeInv = 1.0 / cLodSize;
		vec4 fSample = bicubic( sampler, uv, vec4( fLodSizeInv, fLodSize ), floor( lod ) );
		vec4 cSample = bicubic( sampler, uv, vec4( cLodSizeInv, cLodSize ), ceil( lod ) );
		return mix( fSample, cSample, fract( lod ) );
	}
	vec3 getVolumeTransmissionRay( const in vec3 n, const in vec3 v, const in float thickness, const in float ior, const in mat4 modelMatrix ) {
		vec3 refractionVector = refract( - v, normalize( n ), 1.0 / ior );
		vec3 modelScale;
		modelScale.x = length( vec3( modelMatrix[ 0 ].xyz ) );
		modelScale.y = length( vec3( modelMatrix[ 1 ].xyz ) );
		modelScale.z = length( vec3( modelMatrix[ 2 ].xyz ) );
		return normalize( refractionVector ) * thickness * modelScale;
	}
	float applyIorToRoughness( const in float roughness, const in float ior ) {
		return roughness * clamp( ior * 2.0 - 2.0, 0.0, 1.0 );
	}
	vec4 getTransmissionSample( const in vec2 fragCoord, const in float roughness, const in float ior ) {
		float lod = log2( transmissionSamplerSize.x ) * applyIorToRoughness( roughness, ior );
		return textureBicubic( transmissionSamplerMap, fragCoord.xy, lod );
	}
	vec3 volumeAttenuation( const in float transmissionDistance, const in vec3 attenuationColor, const in float attenuationDistance ) {
		if ( isinf( attenuationDistance ) ) {
			return vec3( 1.0 );
		} else {
			vec3 attenuationCoefficient = -log( attenuationColor ) / attenuationDistance;
			vec3 transmittance = exp( - attenuationCoefficient * transmissionDistance );			return transmittance;
		}
	}
	vec4 getIBLVolumeRefraction( const in vec3 n, const in vec3 v, const in float roughness, const in vec3 diffuseColor,
		const in vec3 specularColor, const in float specularF90, const in vec3 position, const in mat4 modelMatrix,
		const in mat4 viewMatrix, const in mat4 projMatrix, const in float dispersion, const in float ior, const in float thickness,
		const in vec3 attenuationColor, const in float attenuationDistance ) {
		vec4 transmittedLight;
		vec3 transmittance;
		#ifdef USE_DISPERSION
			float halfSpread = ( ior - 1.0 ) * 0.025 * dispersion;
			vec3 iors = vec3( ior - halfSpread, ior, ior + halfSpread );
			for ( int i = 0; i < 3; i ++ ) {
				vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, iors[ i ], modelMatrix );
				vec3 refractedRayExit = position + transmissionRay;
				vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
				vec2 refractionCoords = ndcPos.xy / ndcPos.w;
				refractionCoords += 1.0;
				refractionCoords /= 2.0;
				vec4 transmissionSample = getTransmissionSample( refractionCoords, roughness, iors[ i ] );
				transmittedLight[ i ] = transmissionSample[ i ];
				transmittedLight.a += transmissionSample.a;
				transmittance[ i ] = diffuseColor[ i ] * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance )[ i ];
			}
			transmittedLight.a /= 3.0;
		#else
			vec3 transmissionRay = getVolumeTransmissionRay( n, v, thickness, ior, modelMatrix );
			vec3 refractedRayExit = position + transmissionRay;
			vec4 ndcPos = projMatrix * viewMatrix * vec4( refractedRayExit, 1.0 );
			vec2 refractionCoords = ndcPos.xy / ndcPos.w;
			refractionCoords += 1.0;
			refractionCoords /= 2.0;
			transmittedLight = getTransmissionSample( refractionCoords, roughness, ior );
			transmittance = diffuseColor * volumeAttenuation( length( transmissionRay ), attenuationColor, attenuationDistance );
		#endif
		vec3 attenuatedColor = transmittance * transmittedLight.rgb;
		vec3 F = EnvironmentBRDF( n, v, specularColor, specularF90, roughness );
		float transmittanceFactor = ( transmittance.r + transmittance.g + transmittance.b ) / 3.0;
		return vec4( ( 1.0 - F ) * attenuatedColor, 1.0 - ( 1.0 - transmittedLight.a ) * transmittanceFactor );
	}
#endif`,Xd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_SPECULARMAP
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,qd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	varying vec2 vUv;
#endif
#ifdef USE_MAP
	uniform mat3 mapTransform;
	varying vec2 vMapUv;
#endif
#ifdef USE_ALPHAMAP
	uniform mat3 alphaMapTransform;
	varying vec2 vAlphaMapUv;
#endif
#ifdef USE_LIGHTMAP
	uniform mat3 lightMapTransform;
	varying vec2 vLightMapUv;
#endif
#ifdef USE_AOMAP
	uniform mat3 aoMapTransform;
	varying vec2 vAoMapUv;
#endif
#ifdef USE_BUMPMAP
	uniform mat3 bumpMapTransform;
	varying vec2 vBumpMapUv;
#endif
#ifdef USE_NORMALMAP
	uniform mat3 normalMapTransform;
	varying vec2 vNormalMapUv;
#endif
#ifdef USE_DISPLACEMENTMAP
	uniform mat3 displacementMapTransform;
	varying vec2 vDisplacementMapUv;
#endif
#ifdef USE_EMISSIVEMAP
	uniform mat3 emissiveMapTransform;
	varying vec2 vEmissiveMapUv;
#endif
#ifdef USE_METALNESSMAP
	uniform mat3 metalnessMapTransform;
	varying vec2 vMetalnessMapUv;
#endif
#ifdef USE_ROUGHNESSMAP
	uniform mat3 roughnessMapTransform;
	varying vec2 vRoughnessMapUv;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	uniform mat3 diffuseRoughnessMapTransform;
	varying vec2 vDiffuseRoughnessMapUv;
#endif
#ifdef USE_ANISOTROPYMAP
	uniform mat3 anisotropyMapTransform;
	varying vec2 vAnisotropyMapUv;
#endif
#ifdef USE_CLEARCOATMAP
	uniform mat3 clearcoatMapTransform;
	varying vec2 vClearcoatMapUv;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	uniform mat3 clearcoatNormalMapTransform;
	varying vec2 vClearcoatNormalMapUv;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	uniform mat3 clearcoatRoughnessMapTransform;
	varying vec2 vClearcoatRoughnessMapUv;
#endif
#ifdef USE_SHEEN_COLORMAP
	uniform mat3 sheenColorMapTransform;
	varying vec2 vSheenColorMapUv;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	uniform mat3 sheenRoughnessMapTransform;
	varying vec2 vSheenRoughnessMapUv;
#endif
#ifdef USE_IRIDESCENCEMAP
	uniform mat3 iridescenceMapTransform;
	varying vec2 vIridescenceMapUv;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	uniform mat3 iridescenceThicknessMapTransform;
	varying vec2 vIridescenceThicknessMapUv;
#endif
#ifdef USE_SPECULARMAP
	uniform mat3 specularMapTransform;
	varying vec2 vSpecularMapUv;
#endif
#ifdef USE_SPECULAR_COLORMAP
	uniform mat3 specularColorMapTransform;
	varying vec2 vSpecularColorMapUv;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	uniform mat3 specularIntensityMapTransform;
	varying vec2 vSpecularIntensityMapUv;
#endif
#ifdef USE_TRANSMISSIONMAP
	uniform mat3 transmissionMapTransform;
	varying vec2 vTransmissionMapUv;
#endif
#ifdef USE_THICKNESSMAP
	uniform mat3 thicknessMapTransform;
	varying vec2 vThicknessMapUv;
#endif`,Yd=`#if defined( USE_UV ) || defined( USE_ANISOTROPY )
	vUv = vec3( uv, 1 ).xy;
#endif
#ifdef USE_MAP
	vMapUv = ( mapTransform * vec3( MAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ALPHAMAP
	vAlphaMapUv = ( alphaMapTransform * vec3( ALPHAMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_LIGHTMAP
	vLightMapUv = ( lightMapTransform * vec3( LIGHTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_AOMAP
	vAoMapUv = ( aoMapTransform * vec3( AOMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_BUMPMAP
	vBumpMapUv = ( bumpMapTransform * vec3( BUMPMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_NORMALMAP
	vNormalMapUv = ( normalMapTransform * vec3( NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DISPLACEMENTMAP
	vDisplacementMapUv = ( displacementMapTransform * vec3( DISPLACEMENTMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_EMISSIVEMAP
	vEmissiveMapUv = ( emissiveMapTransform * vec3( EMISSIVEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_METALNESSMAP
	vMetalnessMapUv = ( metalnessMapTransform * vec3( METALNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ROUGHNESSMAP
	vRoughnessMapUv = ( roughnessMapTransform * vec3( ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_DIFFUSE_ROUGHNESSMAP
	vDiffuseRoughnessMapUv = ( diffuseRoughnessMapTransform * vec3( DIFFUSE_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_ANISOTROPYMAP
	vAnisotropyMapUv = ( anisotropyMapTransform * vec3( ANISOTROPYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOATMAP
	vClearcoatMapUv = ( clearcoatMapTransform * vec3( CLEARCOATMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_NORMALMAP
	vClearcoatNormalMapUv = ( clearcoatNormalMapTransform * vec3( CLEARCOAT_NORMALMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_CLEARCOAT_ROUGHNESSMAP
	vClearcoatRoughnessMapUv = ( clearcoatRoughnessMapTransform * vec3( CLEARCOAT_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCEMAP
	vIridescenceMapUv = ( iridescenceMapTransform * vec3( IRIDESCENCEMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_IRIDESCENCE_THICKNESSMAP
	vIridescenceThicknessMapUv = ( iridescenceThicknessMapTransform * vec3( IRIDESCENCE_THICKNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_COLORMAP
	vSheenColorMapUv = ( sheenColorMapTransform * vec3( SHEEN_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SHEEN_ROUGHNESSMAP
	vSheenRoughnessMapUv = ( sheenRoughnessMapTransform * vec3( SHEEN_ROUGHNESSMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULARMAP
	vSpecularMapUv = ( specularMapTransform * vec3( SPECULARMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_COLORMAP
	vSpecularColorMapUv = ( specularColorMapTransform * vec3( SPECULAR_COLORMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_SPECULAR_INTENSITYMAP
	vSpecularIntensityMapUv = ( specularIntensityMapTransform * vec3( SPECULAR_INTENSITYMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_TRANSMISSIONMAP
	vTransmissionMapUv = ( transmissionMapTransform * vec3( TRANSMISSIONMAP_UV, 1 ) ).xy;
#endif
#ifdef USE_THICKNESSMAP
	vThicknessMapUv = ( thicknessMapTransform * vec3( THICKNESSMAP_UV, 1 ) ).xy;
#endif`,Kd=`#if defined( USE_ENVMAP ) || defined( DISTANCE ) || defined ( USE_SHADOWMAP ) || defined ( USE_TRANSMISSION ) || NUM_SPOT_LIGHT_COORDS > 0
	vec4 worldPosition = vec4( transformed, 1.0 );
	#ifdef USE_BATCHING
		worldPosition = batchingMatrix * worldPosition;
	#endif
	#ifdef USE_INSTANCING
		worldPosition = instanceMatrix * worldPosition;
	#endif
	worldPosition = modelMatrix * worldPosition;
#endif`;const $d=`varying vec2 vUv;
uniform mat3 uvTransform;
void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	gl_Position = vec4( position.xy, 1.0, 1.0 );
}`,Zd=`uniform sampler2D t2D;
uniform float backgroundIntensity;
varying vec2 vUv;
void main() {
	vec4 texColor = texture2D( t2D, vUv );
	#ifdef DECODE_VIDEO_TEXTURE
		texColor = vec4( mix( pow( texColor.rgb * 0.9478672986 + vec3( 0.0521327014 ), vec3( 2.4 ) ), texColor.rgb * 0.0773993808, vec3( lessThanEqual( texColor.rgb, vec3( 0.04045 ) ) ) ), texColor.w );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,Jd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,Qd=`uniform float backgroundBlurriness;
uniform float backgroundIntensity;
uniform mat3 backgroundRotation;
varying vec3 vWorldDirection;
#include <envmap_common_pars_fragment>
void main() {
	#ifdef ENVMAP_TYPE_PMREM
		vec4 texColor = textureLod( envMap, backgroundRotation * vWorldDirection, roughnessToMip( backgroundBlurriness ) );
	#else
		vec4 texColor = textureCube( envMap, backgroundRotation * vWorldDirection );
	#endif
	texColor.rgb *= backgroundIntensity;
	gl_FragColor = texColor;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,jd=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
	gl_Position.z = gl_Position.w;
}`,ef=`uniform samplerCube tCube;
uniform float tFlip;
uniform float opacity;
varying vec3 vWorldDirection;
void main() {
	vec4 texColor = textureCube( tCube, vec3( tFlip * vWorldDirection.x, vWorldDirection.yz ) );
	gl_FragColor = texColor;
	gl_FragColor.a *= opacity;
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,tf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
varying vec2 vHighPrecisionZW;
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vHighPrecisionZW = gl_Position.zw;
}`,nf=`#if DEPTH_PACKING == 3200
	uniform float opacity;
#endif
#include <common>
#include <packing>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
varying vec2 vHighPrecisionZW;
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#if DEPTH_PACKING == 3200
		diffuseColor.a = opacity;
	#endif
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <logdepthbuf_fragment>
	#ifdef USE_REVERSED_DEPTH_BUFFER
		float fragCoordZ = vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ];
	#else
		float fragCoordZ = 0.5 * vHighPrecisionZW[ 0 ] / vHighPrecisionZW[ 1 ] + 0.5;
	#endif
	#if DEPTH_PACKING == 3200
		gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );
	#elif DEPTH_PACKING == 3201
		gl_FragColor = packDepthToRGBA( fragCoordZ );
	#elif DEPTH_PACKING == 3202
		gl_FragColor = vec4( packDepthToRGB( fragCoordZ ), 1.0 );
	#elif DEPTH_PACKING == 3203
		gl_FragColor = vec4( packDepthToRG( fragCoordZ ), 0.0, 1.0 );
	#endif
}`,rf=`#define DISTANCE
varying vec3 vWorldPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <skinbase_vertex>
	#include <morphinstance_vertex>
	#ifdef USE_DISPLACEMENTMAP
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <worldpos_vertex>
	#include <clipping_planes_vertex>
	vWorldPosition = worldPosition.xyz;
}`,sf=`#define DISTANCE
uniform vec3 referencePosition;
uniform float nearDistance;
uniform float farDistance;
varying vec3 vWorldPosition;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 1.0 );
	#include <clipping_planes_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	float dist = length( vWorldPosition - referencePosition );
	dist = ( dist - nearDistance ) / ( farDistance - nearDistance );
	dist = saturate( dist );
	gl_FragColor = vec4( dist, 0.0, 0.0, 1.0 );
}`,af=`varying vec3 vWorldDirection;
#include <common>
void main() {
	vWorldDirection = transformDirection( position, modelMatrix );
	#include <begin_vertex>
	#include <project_vertex>
}`,of=`uniform sampler2D tEquirect;
varying vec3 vWorldDirection;
#include <common>
void main() {
	vec3 direction = normalize( vWorldDirection );
	vec2 sampleUV = equirectUv( direction );
	gl_FragColor = texture2D( tEquirect, sampleUV );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
}`,lf=`uniform float scale;
attribute float lineDistance;
varying float vLineDistance;
#include <common>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	vLineDistance = scale * lineDistance;
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,cf=`uniform vec3 diffuse;
uniform float opacity;
uniform float dashSize;
uniform float totalSize;
varying float vLineDistance;
#include <common>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	if ( mod( vLineDistance, totalSize ) > dashSize ) {
		discard;
	}
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,uf=`#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#if defined ( USE_ENVMAP ) || defined ( USE_SKINNING )
		#include <beginnormal_vertex>
		#include <morphnormal_vertex>
		#include <skinbase_vertex>
		#include <skinnormal_vertex>
		#include <defaultnormal_vertex>
	#endif
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <fog_vertex>
}`,hf=`uniform vec3 diffuse;
uniform float opacity;
#ifndef FLAT_SHADED
	varying vec3 vNormal;
#endif
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <fog_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	#ifdef USE_LIGHTMAP
		vec4 lightMapTexel = texture2D( lightMap, vLightMapUv );
		reflectedLight.indirectDiffuse += lightMapTexel.rgb * lightMapIntensity * RECIPROCAL_PI;
	#else
		reflectedLight.indirectDiffuse += vec3( 1.0 );
	#endif
	#include <aomap_fragment>
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,df=`#define LAMBERT
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,ff=`#define LAMBERT
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_lambert_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_lambert_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,pf=`#define MATCAP
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <color_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
	vViewPosition = - mvPosition.xyz;
}`,mf=`#define MATCAP
uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D matcap;
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	vec3 viewDir = normalize( vViewPosition );
	vec3 x = normalize( vec3( viewDir.z, 0.0, - viewDir.x ) );
	vec3 y = cross( viewDir, x );
	vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5;
	#ifdef USE_MATCAP
		vec4 matcapColor = texture2D( matcap, uv );
	#else
		vec4 matcapColor = vec4( vec3( mix( 0.2, 0.8, uv.y ) ), 1.0 );
	#endif
	vec3 outgoingLight = diffuseColor.rgb * matcapColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,gf=`#define NORMAL
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	vViewPosition = - mvPosition.xyz;
#endif
}`,_f=`#define NORMAL
uniform float opacity;
#if defined( FLAT_SHADED ) || defined( USE_BUMPMAP ) || defined( USE_NORMALMAP_TANGENTSPACE )
	varying vec3 vViewPosition;
#endif
#include <uv_pars_fragment>
#include <normal_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( 0.0, 0.0, 0.0, opacity );
	#include <clipping_planes_fragment>
	#include <logdepthbuf_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	gl_FragColor = vec4( normalize( normal ) * 0.5 + 0.5, diffuseColor.a );
	#ifdef OPAQUE
		gl_FragColor.a = 1.0;
	#endif
}`,xf=`#define PHONG
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <envmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <envmap_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,vf=`#define PHONG
uniform vec3 diffuse;
uniform vec3 emissive;
uniform vec3 specular;
uniform float shininess;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_phong_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <specularmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <specularmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_phong_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;
	#include <envmap_fragment>
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Sf=`#define STANDARD
varying vec3 vViewPosition;
#ifdef USE_TRANSMISSION
	varying vec3 vWorldPosition;
#endif
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
#ifdef USE_TRANSMISSION
	vWorldPosition = worldPosition.xyz;
#endif
}`,Mf=`#define STANDARD
#ifdef PHYSICAL
	#define IOR
	#define USE_SPECULAR
#endif
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float roughness;
uniform float metalness;
uniform float opacity;
#ifdef IOR
	uniform float ior;
#endif
#ifdef USE_SPECULAR
	uniform float specularIntensity;
	uniform vec3 specularColor;
	#ifdef USE_SPECULAR_COLORMAP
		uniform sampler2D specularColorMap;
	#endif
	#ifdef USE_SPECULAR_INTENSITYMAP
		uniform sampler2D specularIntensityMap;
	#endif
#endif
#ifdef USE_CLEARCOAT
	uniform float clearcoat;
	uniform float clearcoatRoughness;
#endif
#ifdef USE_DIFFUSE_ROUGHNESS
	uniform float diffuseRoughness;
	#ifdef USE_DIFFUSE_ROUGHNESSMAP
		uniform sampler2D diffuseRoughnessMap;
	#endif
#endif
#ifdef USE_DISPERSION
	uniform float dispersion;
#endif
#ifdef USE_RETROREFLECTION
	uniform float retroreflectivity;
#endif
#ifdef USE_IRIDESCENCE
	uniform float iridescence;
	uniform float iridescenceIOR;
	uniform float iridescenceThicknessMinimum;
	uniform float iridescenceThicknessMaximum;
#endif
#ifdef USE_SHEEN
	uniform vec3 sheenColor;
	uniform float sheenRoughness;
	#ifdef USE_SHEEN_COLORMAP
		uniform sampler2D sheenColorMap;
	#endif
	#ifdef USE_SHEEN_ROUGHNESSMAP
		uniform sampler2D sheenRoughnessMap;
	#endif
#endif
#ifdef USE_ANISOTROPY
	uniform vec2 anisotropyVector;
	#ifdef USE_ANISOTROPYMAP
		uniform sampler2D anisotropyMap;
	#endif
#endif
varying vec3 vViewPosition;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <iridescence_fragment>
#include <envmap_common_pars_fragment>
#include <envmap_physical_pars_fragment>
#include <fog_pars_fragment>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_physical_pars_fragment>
#include <transmission_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <clearcoat_pars_fragment>
#include <iridescence_pars_fragment>
#include <roughnessmap_pars_fragment>
#include <metalnessmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <roughnessmap_fragment>
	#include <metalnessmap_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <clearcoat_normal_fragment_begin>
	#include <clearcoat_normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_physical_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 totalDiffuse = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
	vec3 totalSpecular = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
	#include <transmission_fragment>
	vec3 outgoingLight = totalDiffuse + totalSpecular + totalEmissiveRadiance;
	#ifdef USE_SHEEN
 
		outgoingLight = outgoingLight + sheenSpecularDirect + sheenSpecularIndirect;
 
 	#endif
	#ifdef USE_CLEARCOAT
		float dotNVcc = saturate( dot( geometryClearcoatNormal, geometryViewDir ) );
		vec3 Fcc = F_Schlick( material.clearcoatF0, material.clearcoatF90, dotNVcc );
		outgoingLight = outgoingLight * ( 1.0 - material.clearcoat * Fcc ) + ( clearcoatSpecularDirect + clearcoatSpecularIndirect ) * material.clearcoat;
	#endif
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,Ef=`#define TOON
varying vec3 vViewPosition;
#include <common>
#include <batching_pars_vertex>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <normal_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <normal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <displacementmap_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	vViewPosition = - mvPosition.xyz;
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,yf=`#define TOON
uniform vec3 diffuse;
uniform vec3 emissive;
uniform float opacity;
#include <common>
#include <dithering_pars_fragment>
#include <color_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <aomap_pars_fragment>
#include <lightmap_pars_fragment>
#include <emissivemap_pars_fragment>
#include <gradientmap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <normal_pars_fragment>
#include <lights_toon_pars_fragment>
#include <shadowmap_pars_fragment>
#include <bumpmap_pars_fragment>
#include <normalmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	vec3 totalEmissiveRadiance = emissive;
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <color_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	#include <normal_fragment_begin>
	#include <normal_fragment_maps>
	#include <emissivemap_fragment>
	#include <lights_toon_fragment>
	#include <lights_fragment_begin>
	#include <lights_fragment_maps>
	#include <lights_fragment_end>
	#include <aomap_fragment>
	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
	#include <dithering_fragment>
}`,bf=`uniform float size;
uniform float scale;
#include <common>
#include <color_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
#ifdef USE_POINTS_UV
	varying vec2 vUv;
	uniform mat3 uvTransform;
#endif
void main() {
	#ifdef USE_POINTS_UV
		vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	#endif
	#include <color_vertex>
	#include <morphinstance_vertex>
	#include <morphcolor_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <project_vertex>
	gl_PointSize = size;
	#ifdef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) gl_PointSize *= ( scale / - mvPosition.z );
	#endif
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <worldpos_vertex>
	#include <fog_vertex>
}`,Tf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <color_pars_fragment>
#include <map_particle_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_particle_fragment>
	#include <color_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Af=`#include <common>
#include <batching_pars_vertex>
#include <fog_pars_vertex>
#include <morphtarget_pars_vertex>
#include <skinning_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <shadowmap_pars_vertex>
void main() {
	#include <batching_vertex>
	#include <beginnormal_vertex>
	#include <morphinstance_vertex>
	#include <morphnormal_vertex>
	#include <skinbase_vertex>
	#include <skinnormal_vertex>
	#include <defaultnormal_vertex>
	#include <begin_vertex>
	#include <morphtarget_vertex>
	#include <skinning_vertex>
	#include <project_vertex>
	#include <logdepthbuf_vertex>
	#include <worldpos_vertex>
	#include <shadowmap_vertex>
	#include <fog_vertex>
}`,wf=`uniform vec3 color;
uniform float opacity;
#include <common>
#include <fog_pars_fragment>
#include <bsdfs>
#include <lights_pars_begin>
#include <logdepthbuf_pars_fragment>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
	#include <logdepthbuf_fragment>
	gl_FragColor = vec4( color, opacity * ( 1.0 - getShadowMask() ) );
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
	#include <premultiplied_alpha_fragment>
}`,Rf=`uniform float rotation;
uniform vec2 center;
#include <common>
#include <uv_pars_vertex>
#include <fog_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>
void main() {
	#include <uv_vertex>
	vec4 mvPosition = modelViewMatrix[ 3 ];
	vec2 scale = vec2( length( modelMatrix[ 0 ].xyz ), length( modelMatrix[ 1 ].xyz ) );
	#ifndef USE_SIZEATTENUATION
		bool isPerspective = isPerspectiveMatrix( projectionMatrix );
		if ( isPerspective ) scale *= - mvPosition.z;
	#endif
	vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;
	vec2 rotatedPosition;
	rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;
	rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;
	mvPosition.xy += rotatedPosition;
	gl_Position = projectionMatrix * mvPosition;
	#include <logdepthbuf_vertex>
	#include <clipping_planes_vertex>
	#include <fog_vertex>
}`,Cf=`uniform vec3 diffuse;
uniform float opacity;
#include <common>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <alphatest_pars_fragment>
#include <alphahash_pars_fragment>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>
void main() {
	vec4 diffuseColor = vec4( diffuse, opacity );
	#include <clipping_planes_fragment>
	vec3 outgoingLight = vec3( 0.0 );
	#include <logdepthbuf_fragment>
	#include <map_fragment>
	#include <alphamap_fragment>
	#include <alphatest_fragment>
	#include <alphahash_fragment>
	outgoingLight = diffuseColor.rgb;
	#include <opaque_fragment>
	#include <tonemapping_fragment>
	#include <colorspace_fragment>
	#include <fog_fragment>
}`,Ve={alphahash_fragment:Zu,alphahash_pars_fragment:Ju,alphamap_fragment:Qu,alphamap_pars_fragment:ju,alphatest_fragment:eh,alphatest_pars_fragment:th,aomap_fragment:nh,aomap_pars_fragment:ih,batching_pars_vertex:rh,batching_vertex:sh,begin_vertex:ah,beginnormal_vertex:oh,bsdfs:lh,iridescence_fragment:ch,bumpmap_pars_fragment:uh,clipping_planes_fragment:hh,clipping_planes_pars_fragment:dh,clipping_planes_pars_vertex:fh,clipping_planes_vertex:ph,color_fragment:mh,color_pars_fragment:gh,color_pars_vertex:_h,color_vertex:xh,common:vh,defaultnormal_vertex:Sh,displacementmap_pars_vertex:Mh,displacementmap_vertex:Eh,emissivemap_fragment:yh,emissivemap_pars_fragment:bh,colorspace_fragment:Th,colorspace_pars_fragment:Ah,envmap_fragment:wh,envmap_common_pars_fragment:Rh,envmap_pars_fragment:Ch,envmap_pars_vertex:Ph,envmap_physical_pars_fragment:Hh,envmap_vertex:Lh,fog_vertex:Dh,fog_pars_vertex:Ih,fog_fragment:Nh,fog_pars_fragment:Uh,gradientmap_pars_fragment:Fh,lightmap_pars_fragment:Oh,lights_lambert_fragment:Bh,lights_lambert_pars_fragment:zh,lights_pars_begin:Gh,lights_toon_fragment:kh,lights_toon_pars_fragment:Vh,lights_phong_fragment:Wh,lights_phong_pars_fragment:Xh,lights_physical_fragment:qh,lights_physical_pars_fragment:Yh,lights_fragment_begin:Kh,lights_fragment_maps:$h,lights_fragment_end:Zh,lightprobes_pars_fragment:Jh,logdepthbuf_fragment:Qh,logdepthbuf_pars_fragment:jh,logdepthbuf_pars_vertex:ed,logdepthbuf_vertex:td,map_fragment:nd,map_pars_fragment:id,map_particle_fragment:rd,map_particle_pars_fragment:sd,metalnessmap_fragment:ad,metalnessmap_pars_fragment:od,morphinstance_vertex:ld,morphcolor_vertex:cd,morphnormal_vertex:ud,morphtarget_pars_vertex:hd,morphtarget_vertex:dd,normal_fragment_begin:fd,normal_fragment_maps:pd,normal_pars_fragment:md,normal_pars_vertex:gd,normal_vertex:_d,normalmap_pars_fragment:xd,clearcoat_normal_fragment_begin:vd,clearcoat_normal_fragment_maps:Sd,clearcoat_pars_fragment:Md,iridescence_pars_fragment:Ed,opaque_fragment:yd,packing:bd,premultiplied_alpha_fragment:Td,project_vertex:Ad,dithering_fragment:wd,dithering_pars_fragment:Rd,roughnessmap_fragment:Cd,roughnessmap_pars_fragment:Pd,shadowmap_pars_fragment:Ld,shadowmap_pars_vertex:Dd,shadowmap_vertex:Id,shadowmask_pars_fragment:Nd,skinbase_vertex:Ud,skinning_pars_vertex:Fd,skinning_vertex:Od,skinnormal_vertex:Bd,specularmap_fragment:zd,specularmap_pars_fragment:Gd,tonemapping_fragment:Hd,tonemapping_pars_fragment:kd,transmission_fragment:Vd,transmission_pars_fragment:Wd,uv_pars_fragment:Xd,uv_pars_vertex:qd,uv_vertex:Yd,worldpos_vertex:Kd,background_vert:$d,background_frag:Zd,backgroundCube_vert:Jd,backgroundCube_frag:Qd,cube_vert:jd,cube_frag:ef,depth_vert:tf,depth_frag:nf,distance_vert:rf,distance_frag:sf,equirect_vert:af,equirect_frag:of,linedashed_vert:lf,linedashed_frag:cf,meshbasic_vert:uf,meshbasic_frag:hf,meshlambert_vert:df,meshlambert_frag:ff,meshmatcap_vert:pf,meshmatcap_frag:mf,meshnormal_vert:gf,meshnormal_frag:_f,meshphong_vert:xf,meshphong_frag:vf,meshphysical_vert:Sf,meshphysical_frag:Mf,meshtoon_vert:Ef,meshtoon_frag:yf,points_vert:bf,points_frag:Tf,shadow_vert:Af,shadow_frag:wf,sprite_vert:Rf,sprite_frag:Cf},_e={common:{diffuse:{value:new tt(16777215)},opacity:{value:1},map:{value:null},mapTransform:{value:new Be},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0}},specularmap:{specularMap:{value:null},specularMapTransform:{value:new Be}},envmap:{envMap:{value:null},envMapRotation:{value:new Be},reflectivity:{value:1},ior:{value:1.5},refractionRatio:{value:.98},dfgLUT:{value:null}},aomap:{aoMap:{value:null},aoMapIntensity:{value:1},aoMapTransform:{value:new Be}},lightmap:{lightMap:{value:null},lightMapIntensity:{value:1},lightMapTransform:{value:new Be}},bumpmap:{bumpMap:{value:null},bumpMapTransform:{value:new Be},bumpScale:{value:1}},normalmap:{normalMap:{value:null},normalMapTransform:{value:new Be},normalScale:{value:new Ze(1,1)}},displacementmap:{displacementMap:{value:null},displacementMapTransform:{value:new Be},displacementScale:{value:1},displacementBias:{value:0}},emissivemap:{emissiveMap:{value:null},emissiveMapTransform:{value:new Be}},metalnessmap:{metalnessMap:{value:null},metalnessMapTransform:{value:new Be}},roughnessmap:{roughnessMap:{value:null},roughnessMapTransform:{value:new Be}},gradientmap:{gradientMap:{value:null}},fog:{fogDensity:{value:25e-5},fogNear:{value:1},fogFar:{value:2e3},fogColor:{value:new tt(16777215)}},lights:{ambientLightColor:{value:[]},lightProbe:{value:[]},sunLights:{value:[],properties:{direction:{},color:{}}},sunLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},sunShadowMatrix:{value:[]},sunShadowCascade:{value:[]},directionalLights:{value:[],properties:{direction:{},color:{}}},directionalLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},directionalShadowMatrix:{value:[]},spotLights:{value:[],properties:{color:{},position:{},direction:{},distance:{},coneCos:{},penumbraCos:{},decay:{}}},spotLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{}}},spotLightMap:{value:[]},spotLightMatrix:{value:[]},pointLights:{value:[],properties:{color:{},position:{},decay:{},distance:{}}},pointLightShadows:{value:[],properties:{shadowIntensity:1,shadowBias:{},shadowNormalBias:{},shadowRadius:{},shadowMapSize:{},shadowCameraNear:{},shadowCameraFar:{}}},pointShadowMatrix:{value:[]},hemisphereLights:{value:[],properties:{direction:{},skyColor:{},groundColor:{}}},rectAreaLights:{value:[],properties:{color:{},position:{},width:{},height:{}}},ltc_1:{value:null},ltc_2:{value:null},probesSH:{value:[]},probesMin:{value:[]},probesMax:{value:[]},probesResolution:{value:[]}},points:{diffuse:{value:new tt(16777215)},opacity:{value:1},size:{value:1},scale:{value:1},map:{value:null},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0},uvTransform:{value:new Be}},sprite:{diffuse:{value:new tt(16777215)},opacity:{value:1},center:{value:new Ze(.5,.5)},rotation:{value:0},map:{value:null},mapTransform:{value:new Be},alphaMap:{value:null},alphaMapTransform:{value:new Be},alphaTest:{value:0}}},hn={basic:{uniforms:Ot([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.fog]),vertexShader:Ve.meshbasic_vert,fragmentShader:Ve.meshbasic_frag},lambert:{uniforms:Ot([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new tt(0)},envMapIntensity:{value:1}}]),vertexShader:Ve.meshlambert_vert,fragmentShader:Ve.meshlambert_frag},phong:{uniforms:Ot([_e.common,_e.specularmap,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,_e.lights,{emissive:{value:new tt(0)},specular:{value:new tt(1118481)},shininess:{value:30},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphong_vert,fragmentShader:Ve.meshphong_frag},standard:{uniforms:Ot([_e.common,_e.envmap,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.roughnessmap,_e.metalnessmap,_e.fog,_e.lights,{emissive:{value:new tt(0)},roughness:{value:1},metalness:{value:0},envMapIntensity:{value:1}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag},toon:{uniforms:Ot([_e.common,_e.aomap,_e.lightmap,_e.emissivemap,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.gradientmap,_e.fog,_e.lights,{emissive:{value:new tt(0)}}]),vertexShader:Ve.meshtoon_vert,fragmentShader:Ve.meshtoon_frag},matcap:{uniforms:Ot([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,_e.fog,{matcap:{value:null}}]),vertexShader:Ve.meshmatcap_vert,fragmentShader:Ve.meshmatcap_frag},points:{uniforms:Ot([_e.points,_e.fog]),vertexShader:Ve.points_vert,fragmentShader:Ve.points_frag},dashed:{uniforms:Ot([_e.common,_e.fog,{scale:{value:1},dashSize:{value:1},totalSize:{value:2}}]),vertexShader:Ve.linedashed_vert,fragmentShader:Ve.linedashed_frag},depth:{uniforms:Ot([_e.common,_e.displacementmap]),vertexShader:Ve.depth_vert,fragmentShader:Ve.depth_frag},normal:{uniforms:Ot([_e.common,_e.bumpmap,_e.normalmap,_e.displacementmap,{opacity:{value:1}}]),vertexShader:Ve.meshnormal_vert,fragmentShader:Ve.meshnormal_frag},sprite:{uniforms:Ot([_e.sprite,_e.fog]),vertexShader:Ve.sprite_vert,fragmentShader:Ve.sprite_frag},background:{uniforms:{uvTransform:{value:new Be},t2D:{value:null},backgroundIntensity:{value:1}},vertexShader:Ve.background_vert,fragmentShader:Ve.background_frag},backgroundCube:{uniforms:{envMap:{value:null},backgroundBlurriness:{value:0},backgroundIntensity:{value:1},backgroundRotation:{value:new Be}},vertexShader:Ve.backgroundCube_vert,fragmentShader:Ve.backgroundCube_frag},cube:{uniforms:{tCube:{value:null},tFlip:{value:-1},opacity:{value:1}},vertexShader:Ve.cube_vert,fragmentShader:Ve.cube_frag},equirect:{uniforms:{tEquirect:{value:null}},vertexShader:Ve.equirect_vert,fragmentShader:Ve.equirect_frag},distance:{uniforms:Ot([_e.common,_e.displacementmap,{referencePosition:{value:new H},nearDistance:{value:1},farDistance:{value:1e3}}]),vertexShader:Ve.distance_vert,fragmentShader:Ve.distance_frag},shadow:{uniforms:Ot([_e.lights,_e.fog,{color:{value:new tt(0)},opacity:{value:1}}]),vertexShader:Ve.shadow_vert,fragmentShader:Ve.shadow_frag}};hn.physical={uniforms:Ot([hn.standard.uniforms,{clearcoat:{value:0},clearcoatMap:{value:null},clearcoatMapTransform:{value:new Be},clearcoatNormalMap:{value:null},clearcoatNormalMapTransform:{value:new Be},clearcoatNormalScale:{value:new Ze(1,1)},clearcoatRoughness:{value:0},clearcoatRoughnessMap:{value:null},clearcoatRoughnessMapTransform:{value:new Be},diffuseRoughness:{value:0},diffuseRoughnessMap:{value:null},diffuseRoughnessMapTransform:{value:new Be},dispersion:{value:0},retroreflectivity:{value:0},iridescence:{value:0},iridescenceMap:{value:null},iridescenceMapTransform:{value:new Be},iridescenceIOR:{value:1.3},iridescenceThicknessMinimum:{value:100},iridescenceThicknessMaximum:{value:400},iridescenceThicknessMap:{value:null},iridescenceThicknessMapTransform:{value:new Be},sheen:{value:0},sheenColor:{value:new tt(0)},sheenColorMap:{value:null},sheenColorMapTransform:{value:new Be},sheenRoughness:{value:1},sheenRoughnessMap:{value:null},sheenRoughnessMapTransform:{value:new Be},transmission:{value:0},transmissionMap:{value:null},transmissionMapTransform:{value:new Be},transmissionSamplerSize:{value:new Ze},transmissionSamplerMap:{value:null},thickness:{value:0},thicknessMap:{value:null},thicknessMapTransform:{value:new Be},attenuationDistance:{value:0},attenuationColor:{value:new tt(0)},specularColor:{value:new tt(1,1,1)},specularColorMap:{value:null},specularColorMapTransform:{value:new Be},specularIntensity:{value:1},specularIntensityMap:{value:null},specularIntensityMapTransform:{value:new Be},anisotropyVector:{value:new Ze},anisotropyMap:{value:null},anisotropyMapTransform:{value:new Be}}]),vertexShader:Ve.meshphysical_vert,fragmentShader:Ve.meshphysical_frag};const wr={r:0,b:0,g:0},Pf=new pt,Gl=new Be;Gl.set(-1,0,0,0,1,0,0,0,1);function Lf(i,e,t,n,r,s){const a=new tt(0);let o=r===!0?0:1,c,l,u=null,f=0,d=null;function h(M){let w=M.isScene===!0?M.background:null;if(w&&w.isTexture){const b=M.backgroundBlurriness>0;w=e.get(w,b)}return w}function _(M){let w=!1;const b=h(M);b===null?m(a,o):b&&b.isColor&&(m(b,1),w=!0);const R=i.xr.getEnvironmentBlendMode();R==="additive"?t.buffers.color.setClear(0,0,0,1,s):R==="alpha-blend"&&t.buffers.color.setClear(0,0,0,0,s),(i.autoClear||w)&&(t.buffers.depth.setTest(!0),t.buffers.depth.setMask(!0),t.buffers.color.setMask(!0),i.clear(i.autoClearColor,i.autoClearDepth,i.autoClearStencil))}function S(M,w){const b=h(w);b&&b.isCubeTexture?(l===void 0&&(l=new Bt(new Zi(1,1,1),new ri({name:"BackgroundCubeMaterial",uniforms:Ai(hn.backgroundCube.uniforms),vertexShader:hn.backgroundCube.vertexShader,fragmentShader:hn.backgroundCube.fragmentShader,side:Wt,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),l.geometry.deleteAttribute("normal"),l.geometry.deleteAttribute("uv"),l.onBeforeRender=function(R,A,g){this.matrixWorld.copyPosition(g.matrixWorld)},Object.defineProperty(l.material,"envMap",{get:function(){return this.uniforms.envMap.value}}),n.update(l)),l.material.uniforms.envMap.value=b,l.material.uniforms.backgroundBlurriness.value=w.backgroundBlurriness,l.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,l.material.uniforms.backgroundRotation.value.setFromMatrix4(Pf.makeRotationFromEuler(w.backgroundRotation)).transpose(),b.isRenderTargetTexture===!1&&l.material.uniforms.backgroundRotation.value.premultiply(Gl),l.material.toneMapped=Ye.getTransfer(b.colorSpace)!==rt,(u!==b||f!==b.version||d!==i.toneMapping)&&(l.material.needsUpdate=!0,u=b,f=b.version,d=i.toneMapping),l.layers.enableAll(),M.unshift(l,l.geometry,l.material,0,0,null)):b&&b.isTexture&&(c===void 0&&(c=new Bt(new Ti(2,2),new ri({name:"BackgroundMaterial",uniforms:Ai(hn.background.uniforms),vertexShader:hn.background.vertexShader,fragmentShader:hn.background.fragmentShader,side:ti,depthTest:!1,depthWrite:!1,fog:!1,allowOverride:!1})),c.geometry.deleteAttribute("normal"),Object.defineProperty(c.material,"map",{get:function(){return this.uniforms.t2D.value}}),n.update(c)),c.material.uniforms.t2D.value=b,c.material.uniforms.backgroundIntensity.value=w.backgroundIntensity,c.material.toneMapped=Ye.getTransfer(b.colorSpace)!==rt,b.matrixAutoUpdate===!0&&b.updateMatrix(),c.material.uniforms.uvTransform.value.copy(b.matrix),(u!==b||f!==b.version||d!==i.toneMapping)&&(c.material.needsUpdate=!0,u=b,f=b.version,d=i.toneMapping),c.layers.enableAll(),M.unshift(c,c.geometry,c.material,0,0,null))}function m(M,w){M.getRGB(wr,Ol(i)),t.buffers.color.setClear(wr.r,wr.g,wr.b,w,s)}function p(){l!==void 0&&(l.geometry.dispose(),l.material.dispose(),l=void 0),c!==void 0&&(c.geometry.dispose(),c.material.dispose(),c=void 0)}return{getClearColor:function(){return a},setClearColor:function(M,w=1){a.set(M),o=w,m(a,o)},getClearAlpha:function(){return o},setClearAlpha:function(M){o=M,m(a,o)},render:_,addToRenderList:S,dispose:p}}function Df(i,e){const t=i.getParameter(i.MAX_VERTEX_ATTRIBS),n={},r=d(null);let s=r,a=!1;function o(U,G,K,P,Y){let Z=!1;const X=f(U,P,K,G);s!==X&&(s=X,l(s.object)),Z=h(U,P,K,Y),Z&&_(U,P,K,Y),Y!==null&&e.update(Y,i.ELEMENT_ARRAY_BUFFER),(Z||a)&&(a=!1,b(U,G,K,P),Y!==null&&i.bindBuffer(i.ELEMENT_ARRAY_BUFFER,e.get(Y).buffer))}function c(){return i.createVertexArray()}function l(U){return i.bindVertexArray(U)}function u(U){return i.deleteVertexArray(U)}function f(U,G,K,P){const Y=P.wireframe===!0;let Z=n[G.id];Z===void 0&&(Z={},n[G.id]=Z);const X=U.isInstancedMesh===!0?U.id:0;let ie=Z[X];ie===void 0&&(ie={},Z[X]=ie);let q=ie[K.id];q===void 0&&(q={},ie[K.id]=q);let j=q[Y];return j===void 0&&(j=d(c()),q[Y]=j),j}function d(U){const G=[],K=[],P=[];for(let Y=0;Y<t;Y++)G[Y]=0,K[Y]=0,P[Y]=0;return{geometry:null,program:null,wireframe:!1,newAttributes:G,enabledAttributes:K,attributeDivisors:P,object:U,attributes:{},index:null}}function h(U,G,K,P){const Y=s.attributes,Z=G.attributes;let X=0;const ie=K.getAttributes();for(const q in ie)if(ie[q].location>=0){const ee=Y[q];let Se=Z[q];if(Se===void 0&&(q==="instanceMatrix"&&U.instanceMatrix&&(Se=U.instanceMatrix),q==="instanceColor"&&U.instanceColor&&(Se=U.instanceColor)),ee===void 0||ee.attribute!==Se||Se&&ee.data!==Se.data)return!0;X++}return s.attributesNum!==X||s.index!==P}function _(U,G,K,P){const Y={},Z=G.attributes;let X=0;const ie=K.getAttributes();for(const q in ie)if(ie[q].location>=0){let ee=Z[q];ee===void 0&&(q==="instanceMatrix"&&U.instanceMatrix&&(ee=U.instanceMatrix),q==="instanceColor"&&U.instanceColor&&(ee=U.instanceColor));const Se={};Se.attribute=ee,ee&&ee.data&&(Se.data=ee.data),Y[q]=Se,X++}s.attributes=Y,s.attributesNum=X,s.index=P}function S(){const U=s.newAttributes;for(let G=0,K=U.length;G<K;G++)U[G]=0}function m(U){p(U,0)}function p(U,G){const K=s.newAttributes,P=s.enabledAttributes,Y=s.attributeDivisors;K[U]=1,P[U]===0&&(i.enableVertexAttribArray(U),P[U]=1),Y[U]!==G&&(i.vertexAttribDivisor(U,G),Y[U]=G)}function M(){const U=s.newAttributes,G=s.enabledAttributes;for(let K=0,P=G.length;K<P;K++)G[K]!==U[K]&&(i.disableVertexAttribArray(K),G[K]=0)}function w(U,G,K,P,Y,Z,X){X===!0?i.vertexAttribIPointer(U,G,K,Y,Z):i.vertexAttribPointer(U,G,K,P,Y,Z)}function b(U,G,K,P){S();const Y=P.attributes,Z=K.getAttributes(),X=G.defaultAttributeValues;for(const ie in Z){const q=Z[ie];if(q.location>=0){let j=Y[ie];if(j===void 0&&(ie==="instanceMatrix"&&U.instanceMatrix&&(j=U.instanceMatrix),ie==="instanceColor"&&U.instanceColor&&(j=U.instanceColor)),j!==void 0){const ee=j.normalized,Se=j.itemSize,Fe=e.get(j);if(Fe===void 0)continue;const J=Fe.buffer,pe=Fe.type,ve=Fe.bytesPerElement,Pe=pe===i.INT||pe===i.UNSIGNED_INT||j.gpuType===wa;if(j.isInterleavedBufferAttribute){const me=j.data,Oe=me.isInterleavedBuffer===!0?me.stride:me.itemSize,ht=j.offset;if(me.isInstancedInterleavedBuffer||me.isInstancedBufferAttribute){for(let De=0;De<q.locationSize;De++)p(q.location+De,me.meshPerAttribute);U.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=me.meshPerAttribute*me.count)}else for(let De=0;De<q.locationSize;De++)m(q.location+De);i.bindBuffer(i.ARRAY_BUFFER,J);for(let De=0;De<q.locationSize;De++)w(q.location+De,Se/q.locationSize,pe,ee,Oe*ve,(ht+Se/q.locationSize*De)*ve,Pe)}else{if(j.isInstancedBufferAttribute){for(let me=0;me<q.locationSize;me++)p(q.location+me,j.meshPerAttribute);U.isInstancedMesh!==!0&&P._maxInstanceCount===void 0&&(P._maxInstanceCount=j.meshPerAttribute*j.count)}else for(let me=0;me<q.locationSize;me++)m(q.location+me);i.bindBuffer(i.ARRAY_BUFFER,J);for(let me=0;me<q.locationSize;me++)w(q.location+me,Se/q.locationSize,pe,ee,Se*ve,Se/q.locationSize*me*ve,Pe)}}else if(X!==void 0){const ee=X[ie];if(ee!==void 0)switch(ee.length){case 2:i.vertexAttrib2fv(q.location,ee);break;case 3:i.vertexAttrib3fv(q.location,ee);break;case 4:i.vertexAttrib4fv(q.location,ee);break;default:i.vertexAttrib1fv(q.location,ee)}}}}M()}function R(){z();for(const U in n){const G=n[U];for(const K in G){const P=G[K];for(const Y in P){const Z=P[Y];for(const X in Z)u(Z[X].object),delete Z[X];delete P[Y]}}delete n[U]}}function A(U){if(n[U.id]===void 0)return;const G=n[U.id];for(const K in G){const P=G[K];for(const Y in P){const Z=P[Y];for(const X in Z)u(Z[X].object),delete Z[X];delete P[Y]}}delete n[U.id]}function g(U){for(const G in n){const K=n[G];for(const P in K){const Y=K[P];if(Y[U.id]===void 0)continue;const Z=Y[U.id];for(const X in Z)u(Z[X].object),delete Z[X];delete Y[U.id]}}}function y(U){for(const G in n){const K=n[G],P=U.isInstancedMesh===!0?U.id:0,Y=K[P];if(Y!==void 0){for(const Z in Y){const X=Y[Z];for(const ie in X)u(X[ie].object),delete X[ie];delete Y[Z]}delete K[P],Object.keys(K).length===0&&delete n[G]}}}function z(){D(),a=!0,s!==r&&(s=r,l(s.object))}function D(){r.geometry=null,r.program=null,r.wireframe=!1}return{setup:o,reset:z,resetDefaultState:D,dispose:R,releaseStatesOfGeometry:A,releaseStatesOfObject:y,releaseStatesOfProgram:g,initAttributes:S,enableAttribute:m,disableUnusedAttributes:M}}function If(i,e,t){let n;function r(c){n=c}function s(c,l){i.drawArrays(n,c,l),t.update(l,n,1)}function a(c,l,u){u!==0&&(i.drawArraysInstanced(n,c,l,u),t.update(l,n,u))}function o(c,l,u){if(u===0)return;e.get("WEBGL_multi_draw").multiDrawArraysWEBGL(n,c,0,l,0,u);let d=0;for(let h=0;h<u;h++)d+=l[h];t.update(d,n,1)}this.setMode=r,this.render=s,this.renderInstances=a,this.renderMultiDraw=o}function Nf(i,e,t,n){let r;function s(){if(r!==void 0)return r;if(e.has("EXT_texture_filter_anisotropic")===!0){const g=e.get("EXT_texture_filter_anisotropic");r=i.getParameter(g.MAX_TEXTURE_MAX_ANISOTROPY_EXT)}else r=0;return r}function a(g){return!(g!==fn&&n.convert(g)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_FORMAT))}function o(g){const y=g===gn&&(e.has("EXT_color_buffer_half_float")||e.has("EXT_color_buffer_float"));return!(g!==Jt&&g!==dn&&!y&&n.convert(g)!==i.getParameter(i.IMPLEMENTATION_COLOR_READ_TYPE))}function c(g){if(g==="highp"){if(i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.HIGH_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.HIGH_FLOAT).precision>0)return"highp";g="mediump"}return g==="mediump"&&i.getShaderPrecisionFormat(i.VERTEX_SHADER,i.MEDIUM_FLOAT).precision>0&&i.getShaderPrecisionFormat(i.FRAGMENT_SHADER,i.MEDIUM_FLOAT).precision>0?"mediump":"lowp"}let l=t.precision!==void 0?t.precision:"highp";const u=c(l);u!==l&&(Ue("WebGLRenderer:",l,"not supported, using",u,"instead."),l=u);const f=t.reversedDepthBuffer===!0&&e.has("EXT_clip_control"),d=t.logarithmicDepthBuffer===!0&&f===!1;t.reversedDepthBuffer===!0&&f===!1&&Ue("WebGLRenderer: Unable to use reversed depth buffer due to missing EXT_clip_control extension. Fallback to default depth buffer."),t.logarithmicDepthBuffer===!0&&f===!0&&Ue("WebGLRenderer: Logarithmic depth buffer is ignored when reversed depth buffer is enabled.");const h=i.getParameter(i.MAX_TEXTURE_IMAGE_UNITS),_=i.getParameter(i.MAX_VERTEX_TEXTURE_IMAGE_UNITS),S=i.getParameter(i.MAX_TEXTURE_SIZE),m=i.getParameter(i.MAX_CUBE_MAP_TEXTURE_SIZE),p=i.getParameter(i.MAX_VERTEX_ATTRIBS),M=i.getParameter(i.MAX_VERTEX_UNIFORM_VECTORS),w=i.getParameter(i.MAX_VARYING_VECTORS),b=i.getParameter(i.MAX_FRAGMENT_UNIFORM_VECTORS),R=i.getParameter(i.MAX_SAMPLES),A=i.getParameter(i.SAMPLES);return{isWebGL2:!0,getMaxAnisotropy:s,getMaxPrecision:c,textureFormatReadable:a,textureTypeReadable:o,precision:l,logarithmicDepthBuffer:d,reversedDepthBuffer:f,maxTextures:h,maxVertexTextures:_,maxTextureSize:S,maxCubemapSize:m,maxAttributes:p,maxVertexUniforms:M,maxVaryings:w,maxFragmentUniforms:b,maxSamples:R,samples:A}}function Uf(i){const e=this;let t=null,n=0,r=!1,s=!1;const a=new Bn,o=new Be,c={value:null,needsUpdate:!1};this.uniform=c,this.numPlanes=0,this.numIntersection=0,this.init=function(f,d){const h=f.length!==0||d||n!==0||r;return r=d,n=f.length,h},this.beginShadows=function(){s=!0,u(null)},this.endShadows=function(){s=!1},this.setGlobalState=function(f,d){t=u(f,d,0)},this.setState=function(f,d,h){const _=f.clippingPlanes,S=f.clipIntersection,m=f.clipShadows,p=i.get(f);if(!r||_===null||_.length===0||s&&!m)s?u(null):l();else{const M=s?0:n,w=M*4;let b=p.clippingState||null;c.value=b,b=u(_,d,w,h);for(let R=0;R!==w;++R)b[R]=t[R];p.clippingState=b,this.numIntersection=S?this.numPlanes:0,this.numPlanes+=M}};function l(){c.value!==t&&(c.value=t,c.needsUpdate=n>0),e.numPlanes=n,e.numIntersection=0}function u(f,d,h,_){const S=f!==null?f.length:0;let m=null;if(S!==0){if(m=c.value,_!==!0||m===null){const p=h+S*4,M=d.matrixWorldInverse;o.getNormalMatrix(M),(m===null||m.length<p)&&(m=new Float32Array(p));for(let w=0,b=h;w!==S;++w,b+=4)a.copy(f[w]).applyMatrix4(M,o),a.normal.toArray(m,b),m[b+3]=a.constant}c.value=m,c.needsUpdate=!0}return e.numPlanes=S,e.numIntersection=0,m}}class Fa extends pn{constructor(e=1,t={}){super(e,e,t),this.isWebGLCubeRenderTarget=!0;const n={width:e,height:e,depth:1},r=[n,n,n,n,n,n];this.texture=new Nl(r),this._setTextureOptions(t),this.texture.isRenderTargetTexture=!0}fromEquirectangularTexture(e,t){this.texture.type=t.type,this.texture.colorSpace=t.colorSpace,this.texture.generateMipmaps=t.generateMipmaps,this.texture.minFilter=t.minFilter,this.texture.magFilter=t.magFilter;const n={uniforms:{tEquirect:{value:null}},vertexShader:`

				varying vec3 vWorldDirection;

				vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

					return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

				}

				void main() {

					vWorldDirection = transformDirection( position, modelMatrix );

					#include <begin_vertex>
					#include <project_vertex>

				}
			`,fragmentShader:`

				uniform sampler2D tEquirect;

				varying vec3 vWorldDirection;

				#include <common>

				void main() {

					vec3 direction = normalize( vWorldDirection );

					vec2 sampleUV = equirectUv( direction );

					gl_FragColor = texture2D( tEquirect, sampleUV );

				}
			`},r=new Zi(5,5,5),s=new ri({name:"CubemapFromEquirect",uniforms:Ai(n.uniforms),vertexShader:n.vertexShader,fragmentShader:n.fragmentShader,side:Wt,blending:Si});s.uniforms.tEquirect.value=t;const a=new Bt(r,s),o=t.minFilter;return t.minFilter===Hn&&(t.minFilter=Vt),new ba(1,10,this).update(e,a),t.minFilter=o,a.geometry.dispose(),a.material.dispose(),this}clear(e,t=!0,n=!0,r=!0){const s=e.getRenderTarget();for(let a=0;a<6;a++)e.setRenderTarget(this,a),e.clear(t,n,r);e.setRenderTarget(s)}}const Uo=256,Ff=3,Of=20,Hl=256,kl=16,Bf=3,zf=new H,Gf=new tt;class Kr{constructor(e){this._renderer=e,this._cubeSize=0,this._sourceTarget=null,this._cubeCamera=new ba(1,10,null),this._boxMesh=new Bt(new Zi(5,5,5),null),this._cubemapMaterial=null,this._equirectMaterial=null,this._blurMaterial=null,this._ggxMaterial=null,this._integrationMaterial=null}fromScene(e,t=0,n=.1,r=100,s={}){const{size:a=256,position:o=zf}=s,c=this._renderer;this._setSize(a);const l=this._allocateTarget(),u=this._getSourceTarget(!0);t>0&&(u.texture.mipmapsAutoUpdate=!1);const f=c.autoClear,d=c.autoClearColor,h=c.autoClearDepth,_=c.autoClearStencil,S=e.background;c.autoClear=!0,c.autoClearColor=!0,c.autoClearDepth=!0,c.autoClearStencil=!0,S===null&&(e.background=c.getClearColor(Gf));const m=new ba(n,r,u);return m.position.copy(o),m.update(c,e),c.autoClear=f,c.autoClearColor=d,c.autoClearDepth=h,c.autoClearStencil=_,e.background=S,t>0&&(u.texture.mipmapsAutoUpdate=!0,this._blur(l,t)),this._applyPMREM(l),l}fromEquirectangular(e,t=null){return this._fromTexture(e,t)}fromCubemap(e,t=null){return this._fromTexture(e,t)}compileCubemapShader(){this._cubemapMaterial===null&&(this._cubemapMaterial=Bo(),this._compileMaterial(this._cubemapMaterial))}compileEquirectangularShader(){this._equirectMaterial===null&&(this._equirectMaterial=Oo(),this._compileMaterial(this._equirectMaterial))}dispose(){this._sourceTarget!==null&&this._sourceTarget.dispose(),this._cubemapMaterial!==null&&this._cubemapMaterial.dispose(),this._equirectMaterial!==null&&this._equirectMaterial.dispose(),this._blurMaterial!==null&&this._blurMaterial.dispose(),this._ggxMaterial!==null&&this._ggxMaterial.dispose(),this._integrationMaterial!==null&&this._integrationMaterial.dispose(),this._boxMesh.geometry.dispose()}static lodToRoughness(e,t){return t>0?1-Math.sqrt(1-e/t):0}_setSize(e){this._cubeSize=Math.max(Uo,du(e))}_fromTexture(e,t){e.mapping===Ei||e.mapping===Xi?this._setSize(e.image.length===0?Uo:e.image[0].width||e.image[0].image.width):this._setSize(e.image.width/4);const n=t||this._allocateTarget();return this._textureToCubemap(e),this._applyPMREM(n),n}_allocateTarget(){const e=this._cubeSize,t=Fo(e,!1,!1),n=Math.log2(e)-Ff;for(let r=0;r<=n;r++)t.texture.mipmaps.push({width:e>>r,height:e>>r});return t.texture.name="PMREM",t.texture.isPMREMTexture=!0,t}_getSourceTarget(e=!1){const t=this._cubeSize,n=this._sourceTarget;return(n===null||n.width!==t||e&&n.depthBuffer===!1)&&(n!==null&&n.dispose(),this._sourceTarget=Fo(t,!0,e)),this._sourceTarget}_compileMaterial(e){this._boxMesh.material=e,this._renderer.compile(this._boxMesh,this._cubeCamera.children[0])}_renderCube(e,t,n){const r=this._boxMesh,s=this._cubeCamera;r.material=n,s.renderTarget=e,s.activeMipmapLevel=t;const a=e.width>>t;e.viewport.set(0,0,a,a),s.update(this._renderer,r),e.viewport.set(0,0,e.width,e.height)}_textureToCubemap(e){let t;e.mapping===Ei||e.mapping===Xi?(this._cubemapMaterial===null&&(this._cubemapMaterial=Bo()),t=this._cubemapMaterial,t.uniforms.flipEnvMap.value=e.isRenderTargetTexture===!1?-1:1):(this._equirectMaterial===null&&(this._equirectMaterial=Oo()),t=this._equirectMaterial),t.uniforms.envMap.value=e,this._renderCube(this._getSourceTarget(),0,t)}_applyPMREM(e){this._ggxMaterial===null&&(this._ggxMaterial=Hf(),this._integrationMaterial=kf());const t=this._cubeSize,n=e.texture.mipmaps.length-1,r=this._ggxMaterial.uniforms;r.envMap.value=this._sourceTarget.texture;const s=this._integrationMaterial.uniforms;s.envMap.value=this._sourceTarget.texture,s.sourceLod.value=Math.log2(t/kl);for(let a=0;a<=n;a++){const o=Kr.lodToRoughness(a,n);if(a>n-Bf)s.roughness.value=o,this._renderCube(e,a,this._integrationMaterial);else{const c=o>0?Math.log2(t)+.5*Math.log2(6/(Hl*Math.pow(o,4)))+.5:0;r.roughness.value=o,r.lodBias.value=c,this._renderCube(e,a,this._ggxMaterial)}}}_blur(e,t){this._blurMaterial===null&&(this._blurMaterial=Vf());const n=this._blurMaterial,r=n.uniforms,s=this._sourceTarget;r.sigma.value=Math.min(t,Math.PI)/Math.SQRT2,r.envMap.value=s.texture,this._renderCube(e,0,n),r.envMap.value=e.texture,this._renderCube(s,0,n)}}function Fo(i,e,t){return new Fa(i,{minFilter:Hn,generateMipmaps:e,type:gn,colorSpace:Gr,depthBuffer:t})}function Ji(i,e,t){return new ri({name:i,uniforms:e,vertexShader:Ve.cube_vert,fragmentShader:t,side:Wt,blending:Si,depthTest:!1,depthWrite:!1})}function Hf(){return Ji("PMREMGGXConvolution",{envMap:{value:null},roughness:{value:0},lodBias:{value:0}},`

		#define GGX_SAMPLES ${Hl}u

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float lodBias;

		#include <common>

		// Van der Corput radical inverse
		float radicalInverse_VdC( uint bits ) {

			bits = ( bits << 16u ) | ( bits >> 16u );
			bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
			bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
			bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
			bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
			return float( bits ) * 2.3283064365386963e-10; // / 0x100000000

		}

		// Hammersley sequence
		vec2 hammersley( uint i, uint N ) {

			return vec2( float( i ) / float( N ), radicalInverse_VdC( i ) );

		}

		void main() {

			vec3 N = normalize( vWorldDirection );

			// For very low roughness, just sample the environment directly
			if ( roughness < 0.001 ) {

				gl_FragColor = vec4( textureLod( envMap, N, 0.0 ).rgb, 1.0 );
				return;

			}

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			// Tangent space basis for VNDF sampling
			vec3 up = abs( N.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, N ) );
			vec3 bitangent = cross( N, tangent );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			for ( uint i = 0u; i < GGX_SAMPLES; i ++ ) {

				vec2 Xi = hammersley( i, GGX_SAMPLES );

				// With V = N, sample the reflected direction directly.
				float invQ = 1.0 / ( 1.0 - Xi.x + alpha2 * Xi.x );
				float NdotL = ( 1.0 - Xi.x - alpha2 * Xi.x ) * invQ;

				if ( NdotL > 0.0 ) {

					float phi = 2.0 * PI * Xi.y;
					float sinTheta = 2.0 * alpha * sqrt( Xi.x * ( 1.0 - Xi.x ) ) * invQ;
					vec3 L = N * NdotL + ( tangent * cos( phi ) + bitangent * sin( phi ) ) * sinTheta;

					// Match the source mip to the sample's solid angle. The terms
					// independent of the sample are precomputed in lodBias.
					float d = alpha2 * invQ;
					float lod = max( log2( d ) + lodBias, 0.0 );

					// Weight by NdotL for the split-sum approximation
					prefilteredColor += textureLod( envMap, L, lod ).rgb * NdotL;
					totalWeight += NdotL;

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function kf(){return Ji("PMREMGGXIntegration",{envMap:{value:null},roughness:{value:0},sourceLod:{value:0},sourceSize:{value:kl}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float roughness;
		uniform float sourceLod;
		uniform int sourceSize;

		void main() {

			vec3 N = normalize( vWorldDirection );

			float alpha = roughness * roughness;
			float alpha2 = alpha * alpha;

			float texelSize = 2.0 / float( sourceSize );

			vec3 prefilteredColor = vec3( 0.0 );
			float totalWeight = 0.0;

			// Pair opposite texels: only the one in N's hemisphere contributes.
			for ( int face = 0; face < 3; face ++ ) {

				for ( int y = 0; y < sourceSize; y ++ ) {

					for ( int x = 0; x < sourceSize; x ++ ) {

						vec2 uv = ( vec2( x, y ) + 0.5 ) * texelSize - 1.0;
						vec3 texelDirection = face == 0 ? vec3( 1.0, uv ) : ( face == 1 ? vec3( uv.x, 1.0, uv.y ) : vec3( uv, 1.0 ) );

						float invDistance = inversesqrt( 1.0 + dot( uv, uv ) );
						float NdotL = dot( N, texelDirection );
						texelDirection *= NdotL < 0.0 ? - 1.0 : 1.0;
						NdotL = abs( NdotL ) * invDistance;

						// With V = N, NdotH squared is ( 1 + NdotL ) / 2. Common factors
						// in the GGX distribution and texel solid angle cancel when normalized.
						float d = 1.0 + alpha2 + ( alpha2 - 1.0 ) * NdotL;
						float weight = NdotL * invDistance * invDistance * invDistance / ( d * d );

						prefilteredColor += textureLod( envMap, texelDirection, sourceLod ).rgb * weight;
						totalWeight += weight;

					}

				}

			}

			gl_FragColor = vec4( prefilteredColor / totalWeight, 1.0 );

		}
	`)}function Vf(){return Ji("PMREMSphericalGaussianBlur",{envMap:{value:null},sigma:{value:0}},`

		#define SAMPLES ${Of}
		#define GOLDEN_ANGLE 2.39996322973

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float sigma;

		#include <common>

		void main() {

			vec3 outputDirection = normalize( vWorldDirection );

			vec3 up = abs( outputDirection.z ) < 0.999 ? vec3( 0.0, 0.0, 1.0 ) : vec3( 1.0, 0.0, 0.0 );
			vec3 tangent = normalize( cross( up, outputDirection ) );
			vec3 bitangent = cross( outputDirection, tangent );

			// Truncate the kernel at three standard deviations or at the antipode.
			float thetaMax = min( 3.0 * sigma, PI );
			float truncation = 1.0 - exp( - 0.5 * thetaMax * thetaMax / ( sigma * sigma ) );

			vec3 accumColor = vec3( 0.0 );
			float accumWeight = 0.0;

			for ( int i = 0; i < SAMPLES; i ++ ) {

				// Stratified inverse-CDF sampling of the Gaussian, placed on a golden-angle spiral.
				float stratum = ( float( i ) + 0.5 ) / float( SAMPLES );
				float theta = sigma * sqrt( - 2.0 * log( 1.0 - stratum * truncation ) );
				float phi = float( i ) * GOLDEN_ANGLE;

				vec3 offset = cos( phi ) * tangent + sin( phi ) * bitangent;
				vec3 sampleDirection = cos( theta ) * outputDirection + sin( theta ) * offset;

				// Correct the planar sample density to solid angle.
				float weight = sin( theta ) / theta;

				accumColor += weight * textureLod( envMap, sampleDirection, 0.0 ).rgb;
				accumWeight += weight;

			}

			gl_FragColor = vec4( accumColor / accumWeight, 1.0 );

		}
	`)}function Oo(){return Ji("PMREMEquirectangularToCubemap",{envMap:{value:null}},`

		varying vec3 vWorldDirection;

		uniform sampler2D envMap;

		#include <common>

		void main() {

			// Average four subpixel samples to preserve small, bright features.
			vec3 direction = normalize( vWorldDirection );
			vec3 dx = dFdx( direction ) * 0.25;
			vec3 dy = dFdy( direction ) * 0.25;

			vec3 color = textureLod( envMap, equirectUv( normalize( direction - dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx - dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction - dx + dy ) ), 0.0 ).rgb;
			color += textureLod( envMap, equirectUv( normalize( direction + dx + dy ) ), 0.0 ).rgb;
			gl_FragColor = vec4( color * 0.25, 1.0 );

		}
	`)}function Bo(){return Ji("PMREMCubemapToCubemap",{envMap:{value:null},flipEnvMap:{value:-1}},`

		varying vec3 vWorldDirection;

		uniform samplerCube envMap;
		uniform float flipEnvMap;

		void main() {

			gl_FragColor = vec4( textureCube( envMap, vec3( flipEnvMap * vWorldDirection.x, vWorldDirection.yz ) ).rgb, 1.0 );

		}
	`)}function Wf(i){let e=new WeakMap,t=new WeakMap,n=null;function r(d,h=!1){return d==null?null:h?a(d):s(d)}function s(d){if(d&&d.isTexture){const h=d.mapping;if(h===as||h===os)if(e.has(d)){const _=e.get(d).texture;return o(_,d.mapping)}else{const _=d.image;if(_&&_.height>0){const S=new Fa(_.height);return S.fromEquirectangularTexture(i,d),e.set(d,S),d.addEventListener("dispose",l),o(S.texture,d.mapping)}else return null}}return d}function a(d){if(d&&d.isTexture&&d.isPMREMTexture!==!0){const h=d.mapping,_=h===as||h===os,S=h===Ei||h===Xi;if(_||S){let m=t.get(d);const p=m!==void 0?m.texture.pmremVersion:0;if(d.isRenderTargetTexture&&d.pmremVersion!==p)return n===null&&(n=new Kr(i)),m=_?n.fromEquirectangular(d,m):n.fromCubemap(d,m),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),m.texture;if(m!==void 0)return m.texture;{const M=d.image;return _&&M&&M.height>0||S&&M&&c(M)?(n===null&&(n=new Kr(i)),m=_?n.fromEquirectangular(d):n.fromCubemap(d),m.texture.pmremVersion=d.pmremVersion,t.set(d,m),d.addEventListener("dispose",u),m.texture):null}}}return d}function o(d,h){return h===as?d.mapping=Ei:h===os&&(d.mapping=Xi),d}function c(d){let h=0;const _=6;for(let S=0;S<_;S++)d[S]!==void 0&&h++;return h===_}function l(d){const h=d.target;h.removeEventListener("dispose",l);const _=e.get(h);_!==void 0&&(e.delete(h),_.dispose())}function u(d){const h=d.target;h.removeEventListener("dispose",u);const _=t.get(h);_!==void 0&&(t.delete(h),_.dispose())}function f(){e=new WeakMap,t=new WeakMap,n!==null&&(n.dispose(),n=null)}return{get:r,dispose:f}}function Xf(i){const e={};function t(n){if(e[n]!==void 0)return e[n];const r=i.getExtension(n);return e[n]=r,r}return{has:function(n){return t(n)!==null},init:function(){t("EXT_color_buffer_float"),t("WEBGL_clip_cull_distance"),t("OES_texture_float_linear"),t("EXT_color_buffer_half_float"),t("WEBGL_multisampled_render_to_texture"),t("WEBGL_render_shared_exponent")},get:function(n){const r=t(n);return r===null&&Ur("WebGLRenderer: "+n+" extension not supported."),r}}}function qf(i,e,t,n){const r={},s=new WeakMap,a=new FinalizationRegistry(_=>delete r[_]);function o(_){c(_.target)}function c(_){_.index!==null&&e.remove(_.index);for(const m in _.attributes)e.remove(_.attributes[m]);_.removeEventListener("dispose",o),delete r[_.id],a.unregister(_);const S=s.get(_);S&&(e.remove(S),s.delete(_)),n.releaseStatesOfGeometry(_),_.isInstancedBufferGeometry===!0&&delete _._maxInstanceCount,t.memory.geometries--}function l(_,S){return r[S.id]!==void 0||(S.addEventListener("dispose",o),r[S.id]=new WeakRef(S),a.register(S,S.id,S),t.memory.geometries++),S}function u(_){const S=_.attributes;for(const m in S)e.update(S[m],i.ARRAY_BUFFER)}function f(_){const S=_.index,m=_.attributes.position;let p=0;if(m===void 0)return;const M=S!==null?S.array.length:m.array.length/3-1,w=m.count>=65535?Ll:Pl,b=new w(Math.ceil(M/3)*6,1),R=b.array;if(S!==null){const g=S.array;p=S.version;for(let y=0,z=0;y<M;y+=3){const D=g[y+0],U=g[y+1],G=g[y+2];R[z++]=D,R[z++]=U,R[z++]=U,R[z++]=G,R[z++]=G,R[z++]=D}}else{p=m.version;for(let g=0,y=0;g<M;g+=3){const z=g+0,D=g+1,U=g+2;R[y++]=z,R[y++]=D,R[y++]=D,R[y++]=U,R[y++]=U,R[y++]=z}}b.version=p;const A=s.get(_);A&&e.remove(A),s.set(_,b)}function d(_){const S=s.get(_);if(S){const m=_.index;m!==null&&S.version<m.version&&f(_)}else f(_);return s.get(_)}function h(){for(const _ in r){const S=r[_].deref();S!==void 0&&c(S)}}return{get:l,update:u,getWireframeAttribute:d,dispose:h}}function Yf(i,e,t){let n;function r(f){n=f}let s,a;function o(f){s=f.type,a=f.bytesPerElement}function c(f,d){i.drawElements(n,d,s,f*a),t.update(d,n,1)}function l(f,d,h){h!==0&&(i.drawElementsInstanced(n,d,s,f*a,h),t.update(d,n,h))}function u(f,d,h){if(h===0)return;e.get("WEBGL_multi_draw").multiDrawElementsWEBGL(n,d,0,s,f,0,h);let S=0;for(let m=0;m<h;m++)S+=d[m];t.update(S,n,1)}this.setMode=r,this.setIndex=o,this.render=c,this.renderInstances=l,this.renderMultiDraw=u}function Kf(i){const e={geometries:0,textures:0},t={frame:0,calls:0,triangles:0,points:0,lines:0};function n(s,a,o){switch(t.calls++,a){case i.TRIANGLES:t.triangles+=o*(s/3);break;case i.LINES:t.lines+=o*(s/2);break;case i.LINE_STRIP:t.lines+=o*(s-1);break;case i.LINE_LOOP:t.lines+=o*s;break;case i.POINTS:t.points+=o*s;break;default:et("WebGLInfo: Unknown draw mode:",a);break}}function r(){t.calls=0,t.triangles=0,t.points=0,t.lines=0}return{memory:e,render:t,programs:null,autoReset:!0,reset:r,update:n}}function $f(i,e,t){const n=new WeakMap,r=new ft;function s(a,o,c){const l=a.morphTargetInfluences,u=o.morphAttributes.position||o.morphAttributes.normal||o.morphAttributes.color,f=u!==void 0?u.length:0;let d=n.get(o);if(d===void 0||d.count!==f){let z=function(){g.dispose(),n.delete(o),o.removeEventListener("dispose",z)};d!==void 0&&d.texture.dispose();const h=o.morphAttributes.position!==void 0,_=o.morphAttributes.normal!==void 0,S=o.morphAttributes.color!==void 0,m=o.morphAttributes.position||[],p=o.morphAttributes.normal||[],M=o.morphAttributes.color||[];let w=0;h===!0&&(w=1),_===!0&&(w=2),S===!0&&(w=3);let b=o.attributes.position.count*w,R=1;b>e.maxTextureSize&&(R=Math.ceil(b/e.maxTextureSize),b=e.maxTextureSize);const A=new Float32Array(b*R*4*f),g=new wl(A,b,R,f);g.type=dn,g.needsUpdate=!0;const y=w*4;for(let D=0;D<f;D++){const U=m[D],G=p[D],K=M[D],P=b*R*4*D;for(let Y=0;Y<U.count;Y++){const Z=Y*y;h===!0&&(r.fromBufferAttribute(U,Y),A[P+Z+0]=r.x,A[P+Z+1]=r.y,A[P+Z+2]=r.z,A[P+Z+3]=0),_===!0&&(r.fromBufferAttribute(G,Y),A[P+Z+4]=r.x,A[P+Z+5]=r.y,A[P+Z+6]=r.z,A[P+Z+7]=0),S===!0&&(r.fromBufferAttribute(K,Y),A[P+Z+8]=r.x,A[P+Z+9]=r.y,A[P+Z+10]=r.z,A[P+Z+11]=K.itemSize===4?r.w:1)}}d={count:f,texture:g,size:new Ze(b,R)},n.set(o,d),o.addEventListener("dispose",z)}if(a.isInstancedMesh===!0&&a.morphTexture!==null)c.getUniforms().setValue(i,"morphTexture",a.morphTexture,t);else{let h=0;for(let S=0;S<l.length;S++)h+=l[S];const _=o.morphTargetsRelative?1:1-h;c.getUniforms().setValue(i,"morphTargetBaseInfluence",_),c.getUniforms().setValue(i,"morphTargetInfluences",l)}c.getUniforms().setValue(i,"morphTargetsTexture",d.texture,t),c.getUniforms().setValue(i,"morphTargetsTextureSize",d.size)}return{update:s}}function Zf(i,e,t,n,r){let s=new WeakMap;function a(l){const u=r.render.frame,f=l.geometry,d=e.get(l,f);if(s.get(d)!==u&&(e.update(d),s.set(d,u)),l.isInstancedMesh&&(l.hasEventListener("dispose",c)===!1&&l.addEventListener("dispose",c),s.get(l)!==u&&(t.update(l.instanceMatrix,i.ARRAY_BUFFER),l.instanceColor!==null&&t.update(l.instanceColor,i.ARRAY_BUFFER),s.set(l,u))),l.isSkinnedMesh){const h=l.skeleton;s.get(h)!==u&&(h.update(),s.set(h,u))}return d}function o(){s=new WeakMap}function c(l){const u=l.target;u.removeEventListener("dispose",c),n.releaseStatesOfObject(u),t.remove(u.instanceMatrix),u.instanceColor!==null&&t.remove(u.instanceColor)}return{update:a,dispose:o}}const Jf={[ll]:"LINEAR_TONE_MAPPING",[cl]:"REINHARD_TONE_MAPPING",[ul]:"CINEON_TONE_MAPPING",[hl]:"ACES_FILMIC_TONE_MAPPING",[fl]:"AGX_TONE_MAPPING",[pl]:"NEUTRAL_TONE_MAPPING",[dl]:"CUSTOM_TONE_MAPPING"};function Qf(i,e,t,n,r,s){const a=new pn(e,t,{type:i,depthBuffer:r,stencilBuffer:s,samples:n?4:0,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,resolveDepthBuffer:!1,resolveStencilBuffer:!1});let o=null,c=null,l=null;const u=new on;u.setAttribute("position",new Nt([-1,3,0,-1,-1,0,3,-1,0],3)),u.setAttribute("uv",new Nt([0,2,0,0,2,0],2));const f=new Vu({uniforms:{tDiffuse:{value:null}},vertexShader:`
			precision highp float;

			uniform mat4 modelViewMatrix;
			uniform mat4 projectionMatrix;

			attribute vec3 position;
			attribute vec2 uv;

			varying vec2 vUv;

			void main() {
				vUv = uv;
				gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
			}`,fragmentShader:`
			precision highp float;

			uniform sampler2D tDiffuse;

			varying vec2 vUv;

			#include <tonemapping_pars_fragment>
			#include <colorspace_pars_fragment>

			void main() {
				gl_FragColor = texture2D( tDiffuse, vUv );

				#ifdef LINEAR_TONE_MAPPING
					gl_FragColor.rgb = LinearToneMapping( gl_FragColor.rgb );
				#elif defined( REINHARD_TONE_MAPPING )
					gl_FragColor.rgb = ReinhardToneMapping( gl_FragColor.rgb );
				#elif defined( CINEON_TONE_MAPPING )
					gl_FragColor.rgb = CineonToneMapping( gl_FragColor.rgb );
				#elif defined( ACES_FILMIC_TONE_MAPPING )
					gl_FragColor.rgb = ACESFilmicToneMapping( gl_FragColor.rgb );
				#elif defined( AGX_TONE_MAPPING )
					gl_FragColor.rgb = AgXToneMapping( gl_FragColor.rgb );
				#elif defined( NEUTRAL_TONE_MAPPING )
					gl_FragColor.rgb = NeutralToneMapping( gl_FragColor.rgb );
				#elif defined( CUSTOM_TONE_MAPPING )
					gl_FragColor.rgb = CustomToneMapping( gl_FragColor.rgb );
				#endif

				#ifdef SRGB_TRANSFER
					gl_FragColor = sRGBTransferOETF( gl_FragColor );
				#endif
			}`,depthTest:!1,depthWrite:!1}),d=new Bt(u,f),h=new qu(-1,1,1,-1,0,1);let _=null,S=null,m=!1,p,M=null,w=[],b=!1;this.setSize=function(R,A){a.setSize(R,A),o!==null&&o.setSize(R,A),c!==null&&c.setSize(R,A);for(let g=0;g<w.length;g++){const y=w[g];y.setSize&&y.setSize(R,A)}},this.setEffects=function(R){w=R,b=w.length>0&&w[0].isRenderPass===!0;const A=a.width,g=a.height;w.length>0&&o===null&&(o=new pn(A,g,{type:gn,depthBuffer:!1,stencilBuffer:!1}),c=new pn(A,g,{type:gn,depthBuffer:!1,stencilBuffer:!1}));const y=r===!0&&w.some(z=>z.needsDepthTexture===!0);y!==(a.depthTexture!==null)&&(y===!0&&l===null&&(l=new bi(A,g),s===!0&&(l.format=kn,l.type=yi)),a.dispose(),a.depthTexture=y?l:null,a.resolveDepthBuffer=y,a.storeMultisampledDepthBuffer=y);for(let z=0;z<w.length;z++){const D=w[z];D.setSize&&D.setSize(A,g),y&&D.needsDepthTexture===!0&&D.setDepthTexture&&D.setDepthTexture(l)}},this.begin=function(R,A){if(m||R.toneMapping===wn&&w.length===0)return!1;if(M=A,A!==null){const g=A.width,y=A.height;(a.width!==g||a.height!==y)&&this.setSize(g,y)}return b===!1&&R.setRenderTarget(a),p=R.toneMapping,R.toneMapping=wn,!0},this.hasRenderPass=function(){return b},this.end=function(R,A){R.toneMapping=p,m=!0;let g=a,y=o;for(let z=0;z<w.length;z++){const D=w[z];D.enabled!==!1&&(D.render(R,y,g,A),D.needsSwap!==!1&&(g=y,y=y===o?c:o))}if(_!==R.outputColorSpace||S!==R.toneMapping){_=R.outputColorSpace,S=R.toneMapping,f.defines={},Ye.getTransfer(_)===rt&&(f.defines.SRGB_TRANSFER="");const z=Jf[S];z&&(f.defines[z]=""),f.needsUpdate=!0}f.uniforms.tDiffuse.value=g.texture,R.setRenderTarget(M),R.render(d,h),M=null,m=!1},this.isCompositing=function(){return m},this.dispose=function(){a.dispose(),o!==null&&o.dispose(),c!==null&&c.dispose(),u.dispose(),f.dispose()}}const Vl=new It,Wl=new bi(1,1),Xl=new Ul(1),ql=new wl,Yl=new Su,Kl=new Nl,zo=[],Go=[],Ho=new Float32Array(16),ko=new Float32Array(9),Vo=new Float32Array(4);function Ri(i,e,t){const n=i[0];if(n<=0||n>0)return i;const r=e*t;let s=zo[r];if(s===void 0&&(s=new Float32Array(r),zo[r]=s),e!==0){n.toArray(s,0);for(let a=1,o=0;a!==e;++a)o+=t,i[a].toArray(s,o)}return s}function Mt(i,e){if(i.length!==e.length)return!1;for(let t=0,n=i.length;t<n;t++)if(i[t]!==e[t])return!1;return!0}function Et(i,e){for(let t=0,n=e.length;t<n;t++)i[t]=e[t]}function Jr(i,e){let t=Go[e];t===void 0&&(t=new Int32Array(e),Go[e]=t);for(let n=0;n!==e;++n)t[n]=i.allocateTextureUnit();return t}function jf(i,e){const t=this.cache;t[0]!==e&&(i.uniform1f(this.addr,e),t[0]=e)}function ep(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2f(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;i.uniform2fv(this.addr,e),Et(t,e)}}function tp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3f(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else if(e.r!==void 0)(t[0]!==e.r||t[1]!==e.g||t[2]!==e.b)&&(i.uniform3f(this.addr,e.r,e.g,e.b),t[0]=e.r,t[1]=e.g,t[2]=e.b);else{if(Mt(t,e))return;i.uniform3fv(this.addr,e),Et(t,e)}}function np(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4f(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;i.uniform4fv(this.addr,e),Et(t,e)}}function ip(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Mt(t,e))return;i.uniformMatrix2fv(this.addr,!1,e),Et(t,e)}else{if(Mt(t,n))return;Vo.set(n),i.uniformMatrix2fv(this.addr,!1,Vo),Et(t,n)}}function rp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Mt(t,e))return;i.uniformMatrix3fv(this.addr,!1,e),Et(t,e)}else{if(Mt(t,n))return;ko.set(n),i.uniformMatrix3fv(this.addr,!1,ko),Et(t,n)}}function sp(i,e){const t=this.cache,n=e.elements;if(n===void 0){if(Mt(t,e))return;i.uniformMatrix4fv(this.addr,!1,e),Et(t,e)}else{if(Mt(t,n))return;Ho.set(n),i.uniformMatrix4fv(this.addr,!1,Ho),Et(t,n)}}function ap(i,e){const t=this.cache;t[0]!==e&&(i.uniform1i(this.addr,e),t[0]=e)}function op(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2i(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;i.uniform2iv(this.addr,e),Et(t,e)}}function lp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3i(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;i.uniform3iv(this.addr,e),Et(t,e)}}function cp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4i(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;i.uniform4iv(this.addr,e),Et(t,e)}}function up(i,e){const t=this.cache;t[0]!==e&&(i.uniform1ui(this.addr,e),t[0]=e)}function hp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y)&&(i.uniform2ui(this.addr,e.x,e.y),t[0]=e.x,t[1]=e.y);else{if(Mt(t,e))return;i.uniform2uiv(this.addr,e),Et(t,e)}}function dp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z)&&(i.uniform3ui(this.addr,e.x,e.y,e.z),t[0]=e.x,t[1]=e.y,t[2]=e.z);else{if(Mt(t,e))return;i.uniform3uiv(this.addr,e),Et(t,e)}}function fp(i,e){const t=this.cache;if(e.x!==void 0)(t[0]!==e.x||t[1]!==e.y||t[2]!==e.z||t[3]!==e.w)&&(i.uniform4ui(this.addr,e.x,e.y,e.z,e.w),t[0]=e.x,t[1]=e.y,t[2]=e.z,t[3]=e.w);else{if(Mt(t,e))return;i.uniform4uiv(this.addr,e),Et(t,e)}}function Qr(i){return i.version===0&&(i.compareFunction=Tl,i.needsUpdate=!0),i}function pp(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_2D_SHADOW?s=Qr(Wl):s=Vl,t.setTexture2D(e||s,r)}function mp(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture3D(e||Yl,r)}function gp(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r);let s;this.type===i.SAMPLER_CUBE_SHADOW?s=Qr(Xl):s=Kl,t.setTextureCube(e||s,r)}function _p(i,e,t){const n=this.cache,r=t.allocateTextureUnit();n[0]!==r&&(i.uniform1i(this.addr,r),n[0]=r),t.setTexture2DArray(e||ql,r)}function xp(i){switch(i){case 5126:return jf;case 35664:return ep;case 35665:return tp;case 35666:return np;case 35674:return ip;case 35675:return rp;case 35676:return sp;case 5124:case 35670:return ap;case 35667:case 35671:return op;case 35668:case 35672:return lp;case 35669:case 35673:return cp;case 5125:return up;case 36294:return hp;case 36295:return dp;case 36296:return fp;case 35678:case 36198:case 36298:case 36306:case 35682:return pp;case 35679:case 36299:case 36307:return mp;case 35680:case 36300:case 36308:case 36293:return gp;case 36289:case 36303:case 36311:case 36292:return _p}}function vp(i,e){i.uniform1fv(this.addr,e)}function Sp(i,e){const t=Ri(e,this.size,2);i.uniform2fv(this.addr,t)}function Mp(i,e){const t=Ri(e,this.size,3);i.uniform3fv(this.addr,t)}function Ep(i,e){const t=Ri(e,this.size,4);i.uniform4fv(this.addr,t)}function yp(i,e){const t=Ri(e,this.size,4);i.uniformMatrix2fv(this.addr,!1,t)}function bp(i,e){const t=Ri(e,this.size,9);i.uniformMatrix3fv(this.addr,!1,t)}function Tp(i,e){const t=Ri(e,this.size,16);i.uniformMatrix4fv(this.addr,!1,t)}function Ap(i,e){i.uniform1iv(this.addr,e)}function wp(i,e){i.uniform2iv(this.addr,e)}function Rp(i,e){i.uniform3iv(this.addr,e)}function Cp(i,e){i.uniform4iv(this.addr,e)}function Pp(i,e){i.uniform1uiv(this.addr,e)}function Lp(i,e){i.uniform2uiv(this.addr,e)}function Dp(i,e){i.uniform3uiv(this.addr,e)}function Ip(i,e){i.uniform4uiv(this.addr,e)}function Np(i,e,t){const n=this.cache,r=e.length,s=Jr(t,r);Mt(n,s)||(i.uniform1iv(this.addr,s),Et(n,s));let a;this.type===i.SAMPLER_2D_SHADOW?a=Qr(Wl):a=Vl;for(let o=0;o!==r;++o)t.setTexture2D(e[o]||a,s[o])}function Up(i,e,t){const n=this.cache,r=e.length,s=Jr(t,r);Mt(n,s)||(i.uniform1iv(this.addr,s),Et(n,s));for(let a=0;a!==r;++a)t.setTexture3D(e[a]||Yl,s[a])}function Fp(i,e,t){const n=this.cache,r=e.length,s=Jr(t,r);Mt(n,s)||(i.uniform1iv(this.addr,s),Et(n,s));let a;this.type===i.SAMPLER_CUBE_SHADOW?a=Qr(Xl):a=Kl;for(let o=0;o!==r;++o)t.setTextureCube(e[o]||a,s[o])}function Op(i,e,t){const n=this.cache,r=e.length,s=Jr(t,r);Mt(n,s)||(i.uniform1iv(this.addr,s),Et(n,s));for(let a=0;a!==r;++a)t.setTexture2DArray(e[a]||ql,s[a])}function Bp(i){switch(i){case 5126:return vp;case 35664:return Sp;case 35665:return Mp;case 35666:return Ep;case 35674:return yp;case 35675:return bp;case 35676:return Tp;case 5124:case 35670:return Ap;case 35667:case 35671:return wp;case 35668:case 35672:return Rp;case 35669:case 35673:return Cp;case 5125:return Pp;case 36294:return Lp;case 36295:return Dp;case 36296:return Ip;case 35678:case 36198:case 36298:case 36306:case 35682:return Np;case 35679:case 36299:case 36307:return Up;case 35680:case 36300:case 36308:case 36293:return Fp;case 36289:case 36303:case 36311:case 36292:return Op}}class zp{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.setValue=xp(t.type)}}class Gp{constructor(e,t,n){this.id=e,this.addr=n,this.cache=[],this.type=t.type,this.size=t.size,this.setValue=Bp(t.type)}}class Hp{constructor(e){this.id=e,this.seq=[],this.map={}}setValue(e,t,n){const r=this.seq;for(let s=0,a=r.length;s!==a;++s){const o=r[s];o.setValue(e,t[o.id],n)}}}const Ns=/(\w+)(\])?(\[|\.)?/g;function Wo(i,e){i.seq.push(e),i.map[e.id]=e}function kp(i,e,t){const n=i.name,r=n.length;for(Ns.lastIndex=0;;){const s=Ns.exec(n),a=Ns.lastIndex;let o=s[1];const c=s[2]==="]",l=s[3];if(c&&(o=o|0),l===void 0||l==="["&&a+2===r){Wo(t,l===void 0?new zp(o,i,e):new Gp(o,i,e));break}else{let f=t.map[o];f===void 0&&(f=new Hp(o),Wo(t,f)),t=f}}}class Fr{constructor(e,t){this.seq=[],this.map={};const n=e.getProgramParameter(t,e.ACTIVE_UNIFORMS);for(let a=0;a<n;++a){const o=e.getActiveUniform(t,a),c=e.getUniformLocation(t,o.name);kp(o,c,this)}const r=[],s=[];for(const a of this.seq)a.type===e.SAMPLER_2D_SHADOW||a.type===e.SAMPLER_CUBE_SHADOW||a.type===e.SAMPLER_2D_ARRAY_SHADOW?r.push(a):s.push(a);r.length>0&&(this.seq=r.concat(s))}setValue(e,t,n,r){const s=this.map[t];s!==void 0&&s.setValue(e,n,r)}setOptional(e,t,n){const r=t[n];r!==void 0&&this.setValue(e,n,r)}static upload(e,t,n,r){for(let s=0,a=t.length;s!==a;++s){const o=t[s],c=n[o.id];c.needsUpdate!==!1&&o.setValue(e,c.value,r)}}static seqWithValue(e,t){const n=[];for(let r=0,s=e.length;r!==s;++r){const a=e[r];a.id in t&&n.push(a)}return n}}function Xo(i,e,t){const n=i.createShader(e);return i.shaderSource(n,t),i.compileShader(n),n}const Vp=37297;let Wp=0;function Xp(i,e){const t=i.split(`
`),n=[],r=Math.max(e-6,0),s=Math.min(e+6,t.length);for(let a=r;a<s;a++){const o=a+1;n.push(`${o===e?">":" "} ${o}: ${t[a]}`)}return n.join(`
`)}const qo=new Be;function qp(i){Ye._getMatrix(qo,Ye.workingColorSpace,i);const e=`mat3( ${qo.elements.map(t=>t.toFixed(4))} )`;switch(Ye.getTransfer(i)){case Hr:return[e,"LinearTransferOETF"];case rt:return[e,"sRGBTransferOETF"];default:return Ue("WebGLProgram: Unsupported color space: ",i),[e,"LinearTransferOETF"]}}function Yo(i,e,t){const n=i.getShaderParameter(e,i.COMPILE_STATUS),s=(i.getShaderInfoLog(e)||"").trim();if(n&&s==="")return"";const a=/ERROR: 0:(\d+)/.exec(s);if(a){const o=parseInt(a[1]);return t.toUpperCase()+`

`+s+`

`+Xp(i.getShaderSource(e),o)}else return s}function Yp(i,e){const t=qp(e);return[`vec4 ${i}( vec4 value ) {`,`	return ${t[1]}( vec4( ${t[0]} * value.rgb, value.a ) );`,"}"].join(`
`)}const Kp={[ll]:"Linear",[cl]:"Reinhard",[ul]:"Cineon",[hl]:"ACESFilmic",[fl]:"AgX",[pl]:"Neutral",[dl]:"Custom"};function $p(i,e){const t=Kp[e];return t===void 0?(Ue("WebGLProgram: Unsupported toneMapping:",e),"vec3 "+i+"( vec3 color ) { return LinearToneMapping( color ); }"):"vec3 "+i+"( vec3 color ) { return "+t+"ToneMapping( color ); }"}const Rr=new H;function Zp(){Ye.getLuminanceCoefficients(Rr);const i=Rr.x.toFixed(4),e=Rr.y.toFixed(4),t=Rr.z.toFixed(4);return["float luminance( const in vec3 rgb ) {",`	const vec3 weights = vec3( ${i}, ${e}, ${t} );`,"	return dot( weights, rgb );","}"].join(`
`)}function Jp(i){return[i.extensionClipCullDistance?"#extension GL_ANGLE_clip_cull_distance : require":"",i.extensionMultiDraw?"#extension GL_ANGLE_multi_draw : require":""].filter(Gi).join(`
`)}function Qp(i){const e=[];for(const t in i){const n=i[t];n!==!1&&e.push("#define "+t+" "+n)}return e.join(`
`)}function jp(i,e){const t={},n=i.getProgramParameter(e,i.ACTIVE_ATTRIBUTES);for(let r=0;r<n;r++){const s=i.getActiveAttrib(e,r),a=s.name;let o=1;s.type===i.FLOAT_MAT2&&(o=2),s.type===i.FLOAT_MAT3&&(o=3),s.type===i.FLOAT_MAT4&&(o=4),t[a]={type:s.type,location:i.getAttribLocation(e,a),locationSize:o}}return t}function Gi(i){return i!==""}function Ko(i,e){const t=e.numSpotLightShadows+e.numSpotLightMaps-e.numSpotLightShadowsWithMaps;return i.replace(/NUM_SUN_LIGHTS/g,e.numSunLights).replace(/NUM_DIR_LIGHTS/g,e.numDirLights).replace(/NUM_SPOT_LIGHTS/g,e.numSpotLights).replace(/NUM_SPOT_LIGHT_MAPS/g,e.numSpotLightMaps).replace(/NUM_SPOT_LIGHT_COORDS/g,t).replace(/NUM_RECT_AREA_LIGHTS/g,e.numRectAreaLights).replace(/NUM_POINT_LIGHTS/g,e.numPointLights).replace(/NUM_HEMI_LIGHTS/g,e.numHemiLights).replace(/NUM_SUN_LIGHT_SHADOWS/g,e.numSunLightShadows).replace(/NUM_DIR_LIGHT_SHADOWS/g,e.numDirLightShadows).replace(/NUM_SPOT_LIGHT_SHADOWS_WITH_MAPS/g,e.numSpotLightShadowsWithMaps).replace(/NUM_SPOT_LIGHT_SHADOWS/g,e.numSpotLightShadows).replace(/NUM_POINT_LIGHT_SHADOWS/g,e.numPointLightShadows).replace(/NUM_LIGHT_PROBE_GRIDS/g,e.numLightProbeGrids)}function $o(i,e){return i.replace(/NUM_CLIPPING_PLANES/g,e.numClippingPlanes).replace(/UNION_CLIPPING_PLANES/g,e.numClippingPlanes-e.numClipIntersection)}const em=/^[ \t]*#include +<([\w\d./]+)>/gm;function Ta(i){return i.replace(em,tm)}function tm(i,e){const t=Ve[e];if(t===void 0)throw new Error("THREE.WebGLProgram: Can not resolve #include <"+e+">");return Ta(t)}const nm=/#pragma unroll_loop_start\s+for\s*\(\s*int\s+i\s*=\s*(\d+)\s*;\s*i\s*<\s*(\d+)\s*;\s*i\s*\+\+\s*\)\s*{([\s\S]+?)}\s+#pragma unroll_loop_end/g;function Zo(i){return i.replace(nm,im)}function im(i,e,t,n){let r="";for(let s=parseInt(e);s<parseInt(t);s++)r+=n.replace(/\[\s*i\s*\]/g,"[ "+s+" ]").replace(/UNROLLED_LOOP_INDEX/g,s);return r}function Jo(i){let e=`precision ${i.precision} float;
	precision ${i.precision} int;
	precision ${i.precision} sampler2D;
	precision ${i.precision} samplerCube;
	precision ${i.precision} sampler3D;
	precision ${i.precision} sampler2DArray;
	precision ${i.precision} sampler2DShadow;
	precision ${i.precision} samplerCubeShadow;
	precision ${i.precision} sampler2DArrayShadow;
	precision ${i.precision} isampler2D;
	precision ${i.precision} isampler3D;
	precision ${i.precision} isamplerCube;
	precision ${i.precision} isampler2DArray;
	precision ${i.precision} usampler2D;
	precision ${i.precision} usampler3D;
	precision ${i.precision} usamplerCube;
	precision ${i.precision} usampler2DArray;
	`;return i.precision==="highp"?e+=`
#define HIGH_PRECISION`:i.precision==="mediump"?e+=`
#define MEDIUM_PRECISION`:i.precision==="lowp"&&(e+=`
#define LOW_PRECISION`),e}const rm={[Pr]:"SHADOWMAP_TYPE_PCF",[Bi]:"SHADOWMAP_TYPE_VSM"};function sm(i){return rm[i.shadowMapType]||"SHADOWMAP_TYPE_BASIC"}const am={[Xi]:"ENVMAP_MODE_REFRACTION"};function om(i){return i.envMap===!1?"ENVMAP_MODE_REFLECTION":am[i.envMapMode]||"ENVMAP_MODE_REFLECTION"}const lm={[ol]:"ENVMAP_BLENDING_MULTIPLY",[$c]:"ENVMAP_BLENDING_MIX",[Zc]:"ENVMAP_BLENDING_ADD"};function cm(i){return i.envMap===!1?"ENVMAP_BLENDING_NONE":lm[i.combine]||"ENVMAP_BLENDING_NONE"}function um(i,e,t,n){const r=i.getContext(),s=t.defines;let a=t.vertexShader,o=t.fragmentShader;const c=sm(t),l=t.envMapPMREM===!0?"ENVMAP_TYPE_PMREM":"ENVMAP_TYPE_CUBE",u=om(t),f=cm(t),d=Jp(t),h=Qp(s),_=r.createProgram();let S,m,p=t.glslVersion?"#version "+t.glslVersion+`
`:"";t.isRawShaderMaterial?(S=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,h].filter(Gi).join(`
`),S.length>0&&(S+=`
`),m=["#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,h].filter(Gi).join(`
`),m.length>0&&(m+=`
`)):(S=[Jo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,h,t.extensionClipCullDistance?"#define USE_CLIP_DISTANCE":"",t.batching?"#define USE_BATCHING":"",t.batchingColor?"#define USE_BATCHING_COLOR":"",t.instancing?"#define USE_INSTANCING":"",t.instancingColor?"#define USE_INSTANCING_COLOR":"",t.instancingMorph?"#define USE_INSTANCING_MORPH":"",t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.map?"#define USE_MAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+u:"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.displacementMap?"#define USE_DISPLACEMENTMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.mapUv?"#define MAP_UV "+t.mapUv:"",t.alphaMapUv?"#define ALPHAMAP_UV "+t.alphaMapUv:"",t.lightMapUv?"#define LIGHTMAP_UV "+t.lightMapUv:"",t.aoMapUv?"#define AOMAP_UV "+t.aoMapUv:"",t.emissiveMapUv?"#define EMISSIVEMAP_UV "+t.emissiveMapUv:"",t.bumpMapUv?"#define BUMPMAP_UV "+t.bumpMapUv:"",t.normalMapUv?"#define NORMALMAP_UV "+t.normalMapUv:"",t.displacementMapUv?"#define DISPLACEMENTMAP_UV "+t.displacementMapUv:"",t.metalnessMapUv?"#define METALNESSMAP_UV "+t.metalnessMapUv:"",t.roughnessMapUv?"#define ROUGHNESSMAP_UV "+t.roughnessMapUv:"",t.anisotropyMapUv?"#define ANISOTROPYMAP_UV "+t.anisotropyMapUv:"",t.clearcoatMapUv?"#define CLEARCOATMAP_UV "+t.clearcoatMapUv:"",t.clearcoatNormalMapUv?"#define CLEARCOAT_NORMALMAP_UV "+t.clearcoatNormalMapUv:"",t.clearcoatRoughnessMapUv?"#define CLEARCOAT_ROUGHNESSMAP_UV "+t.clearcoatRoughnessMapUv:"",t.diffuseRoughnessMapUv?"#define DIFFUSE_ROUGHNESSMAP_UV "+t.diffuseRoughnessMapUv:"",t.iridescenceMapUv?"#define IRIDESCENCEMAP_UV "+t.iridescenceMapUv:"",t.iridescenceThicknessMapUv?"#define IRIDESCENCE_THICKNESSMAP_UV "+t.iridescenceThicknessMapUv:"",t.sheenColorMapUv?"#define SHEEN_COLORMAP_UV "+t.sheenColorMapUv:"",t.sheenRoughnessMapUv?"#define SHEEN_ROUGHNESSMAP_UV "+t.sheenRoughnessMapUv:"",t.specularMapUv?"#define SPECULARMAP_UV "+t.specularMapUv:"",t.specularColorMapUv?"#define SPECULAR_COLORMAP_UV "+t.specularColorMapUv:"",t.specularIntensityMapUv?"#define SPECULAR_INTENSITYMAP_UV "+t.specularIntensityMapUv:"",t.transmissionMapUv?"#define TRANSMISSIONMAP_UV "+t.transmissionMapUv:"",t.thicknessMapUv?"#define THICKNESSMAP_UV "+t.thicknessMapUv:"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexNormals?"#define HAS_NORMAL":"",t.vertexColors?"#define USE_COLOR":"",t.vertexAlphas?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.flatShading?"#define FLAT_SHADED":"",t.skinning?"#define USE_SKINNING":"",t.morphTargets?"#define USE_MORPHTARGETS":"",t.morphNormals&&t.flatShading===!1?"#define USE_MORPHNORMALS":"",t.morphColors?"#define USE_MORPHCOLORS":"",t.morphTargetsCount>0?"#define MORPHTARGETS_TEXTURE_STRIDE "+t.morphTextureStride:"",t.morphTargetsCount>0?"#define MORPHTARGETS_COUNT "+t.morphTargetsCount:"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.sizeAttenuation?"#define USE_SIZEATTENUATION":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 modelMatrix;","uniform mat4 modelViewMatrix;","uniform mat4 projectionMatrix;","uniform mat4 viewMatrix;","uniform mat3 normalMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;","#ifdef USE_INSTANCING","	attribute mat4 instanceMatrix;","#endif","#ifdef USE_INSTANCING_COLOR","	attribute vec3 instanceColor;","#endif","#ifdef USE_INSTANCING_MORPH","	uniform sampler2D morphTexture;","#endif","attribute vec3 position;","attribute vec3 normal;","attribute vec2 uv;","#ifdef USE_UV1","	attribute vec2 uv1;","#endif","#ifdef USE_UV2","	attribute vec2 uv2;","#endif","#ifdef USE_UV3","	attribute vec2 uv3;","#endif","#ifdef USE_TANGENT","	attribute vec4 tangent;","#endif","#if defined( USE_COLOR_ALPHA )","	attribute vec4 color;","#elif defined( USE_COLOR )","	attribute vec3 color;","#endif","#ifdef USE_SKINNING","	attribute vec4 skinIndex;","	attribute vec4 skinWeight;","#endif",`
`].filter(Gi).join(`
`),m=[Jo(t),"#define SHADER_TYPE "+t.shaderType,"#define SHADER_NAME "+t.shaderName,h,t.useFog&&t.fog?"#define USE_FOG":"",t.useFog&&t.fogExp2?"#define FOG_EXP2":"",t.alphaToCoverage?"#define ALPHA_TO_COVERAGE":"",t.map?"#define USE_MAP":"",t.matcap?"#define USE_MATCAP":"",t.envMap?"#define USE_ENVMAP":"",t.envMap?"#define "+l:"",t.envMap?"#define "+u:"",t.envMap?"#define "+f:"",t.envMapPMREM?"#define ENVMAP_MAX_LOD "+t.envMapMaxLod+".0":"",t.envMapPMREM?"#define ENVMAP_SIZE "+t.envMapSize+".0":"",t.lightMap?"#define USE_LIGHTMAP":"",t.aoMap?"#define USE_AOMAP":"",t.bumpMap?"#define USE_BUMPMAP":"",t.normalMap?"#define USE_NORMALMAP":"",t.normalMapObjectSpace?"#define USE_NORMALMAP_OBJECTSPACE":"",t.normalMapTangentSpace?"#define USE_NORMALMAP_TANGENTSPACE":"",t.packedNormalMap?"#define USE_PACKED_NORMALMAP":"",t.emissiveMap?"#define USE_EMISSIVEMAP":"",t.anisotropy?"#define USE_ANISOTROPY":"",t.anisotropyMap?"#define USE_ANISOTROPYMAP":"",t.clearcoat?"#define USE_CLEARCOAT":"",t.clearcoatMap?"#define USE_CLEARCOATMAP":"",t.clearcoatRoughnessMap?"#define USE_CLEARCOAT_ROUGHNESSMAP":"",t.clearcoatNormalMap?"#define USE_CLEARCOAT_NORMALMAP":"",t.diffuseRoughness?"#define USE_DIFFUSE_ROUGHNESS":"",t.diffuseRoughnessMap?"#define USE_DIFFUSE_ROUGHNESSMAP":"",t.dispersion?"#define USE_DISPERSION":"",t.retroreflection?"#define USE_RETROREFLECTION":"",t.iridescence?"#define USE_IRIDESCENCE":"",t.iridescenceMap?"#define USE_IRIDESCENCEMAP":"",t.iridescenceThicknessMap?"#define USE_IRIDESCENCE_THICKNESSMAP":"",t.specularMap?"#define USE_SPECULARMAP":"",t.specularColorMap?"#define USE_SPECULAR_COLORMAP":"",t.specularIntensityMap?"#define USE_SPECULAR_INTENSITYMAP":"",t.roughnessMap?"#define USE_ROUGHNESSMAP":"",t.metalnessMap?"#define USE_METALNESSMAP":"",t.alphaMap?"#define USE_ALPHAMAP":"",t.alphaTest?"#define USE_ALPHATEST":"",t.alphaHash?"#define USE_ALPHAHASH":"",t.sheen?"#define USE_SHEEN":"",t.sheenColorMap?"#define USE_SHEEN_COLORMAP":"",t.sheenRoughnessMap?"#define USE_SHEEN_ROUGHNESSMAP":"",t.transmission?"#define USE_TRANSMISSION":"",t.transmissionMap?"#define USE_TRANSMISSIONMAP":"",t.thicknessMap?"#define USE_THICKNESSMAP":"",t.vertexTangents&&t.flatShading===!1?"#define USE_TANGENT":"",t.vertexColors||t.instancingColor?"#define USE_COLOR":"",t.vertexAlphas||t.batchingColor?"#define USE_COLOR_ALPHA":"",t.vertexUv1s?"#define USE_UV1":"",t.vertexUv2s?"#define USE_UV2":"",t.vertexUv3s?"#define USE_UV3":"",t.pointsUvs?"#define USE_POINTS_UV":"",t.gradientMap?"#define USE_GRADIENTMAP":"",t.flatShading?"#define FLAT_SHADED":"",t.doubleSided?"#define DOUBLE_SIDED":"",t.flipSided?"#define FLIP_SIDED":"",t.shadowMapEnabled?"#define USE_SHADOWMAP":"",t.shadowMapEnabled?"#define "+c:"",t.premultipliedAlpha?"#define PREMULTIPLIED_ALPHA":"",t.numLightProbes>0?"#define USE_LIGHT_PROBES":"",t.decodeVideoTexture?"#define DECODE_VIDEO_TEXTURE":"",t.decodeVideoTextureEmissive?"#define DECODE_VIDEO_TEXTURE_EMISSIVE":"",t.logarithmicDepthBuffer?"#define USE_LOGARITHMIC_DEPTH_BUFFER":"",t.reversedDepthBuffer?"#define USE_REVERSED_DEPTH_BUFFER":"","uniform mat4 viewMatrix;","uniform vec3 cameraPosition;","uniform bool isOrthographic;",t.toneMapping!==wn?"#define TONE_MAPPING":"",t.toneMapping!==wn?Ve.tonemapping_pars_fragment:"",t.toneMapping!==wn?$p("toneMapping",t.toneMapping):"",t.dithering?"#define DITHERING":"",t.opaque?"#define OPAQUE":"",Ve.colorspace_pars_fragment,Yp("linearToOutputTexel",t.outputColorSpace),Zp(),t.useDepthPacking?"#define DEPTH_PACKING "+t.depthPacking:"",`
`].filter(Gi).join(`
`)),a=Ta(a),a=Ko(a,t),a=$o(a,t),o=Ta(o),o=Ko(o,t),o=$o(o,t),a=Zo(a),o=Zo(o),t.isRawShaderMaterial!==!0&&(p=`#version 300 es
`,S=[d,"#define attribute in","#define varying out","#define texture2D texture"].join(`
`)+`
`+S,m=["#define varying in",t.glslVersion===uo?"":"layout(location = 0) out highp vec4 pc_fragColor;",t.glslVersion===uo?"":"#define gl_FragColor pc_fragColor","#define gl_FragDepthEXT gl_FragDepth","#define texture2D texture","#define textureCube texture","#define texture2DProj textureProj","#define texture2DLodEXT textureLod","#define texture2DProjLodEXT textureProjLod","#define textureCubeLodEXT textureLod","#define texture2DGradEXT textureGrad","#define texture2DProjGradEXT textureProjGrad","#define textureCubeGradEXT textureGrad"].join(`
`)+`
`+m);const M=p+S+a,w=p+m+o,b=Xo(r,r.VERTEX_SHADER,M),R=Xo(r,r.FRAGMENT_SHADER,w);r.attachShader(_,b),r.attachShader(_,R),t.index0AttributeName!==void 0?r.bindAttribLocation(_,0,t.index0AttributeName):t.hasPositionAttribute===!0&&r.bindAttribLocation(_,0,"position"),r.linkProgram(_);function A(D){if(i.debug.checkShaderErrors){const U=r.getProgramInfoLog(_)||"",G=r.getShaderInfoLog(b)||"",K=r.getShaderInfoLog(R)||"",P=U.trim(),Y=G.trim(),Z=K.trim();let X=!0,ie=!0;if(r.getProgramParameter(_,r.LINK_STATUS)===!1)if(X=!1,typeof i.debug.onShaderError=="function")i.debug.onShaderError(r,_,b,R);else{const q=Yo(r,b,"vertex"),j=Yo(r,R,"fragment");et("WebGLProgram: Shader Error "+r.getError()+" - VALIDATE_STATUS "+r.getProgramParameter(_,r.VALIDATE_STATUS)+`

Material Name: `+D.name+`
Material Type: `+D.type+`

Program Info Log: `+P+`
`+q+`
`+j)}else P!==""?Ue("WebGLProgram: Program Info Log:",P):(Y===""||Z==="")&&(ie=!1);ie&&(D.diagnostics={runnable:X,programLog:P,vertexShader:{log:Y,prefix:S},fragmentShader:{log:Z,prefix:m}})}r.deleteShader(b),r.deleteShader(R),g=new Fr(r,_),y=jp(r,_)}let g;this.getUniforms=function(){return g===void 0&&A(this),g};let y;this.getAttributes=function(){return y===void 0&&A(this),y};let z=t.rendererExtensionParallelShaderCompile===!1;return this.isReady=function(){return z===!1&&(z=r.getProgramParameter(_,Vp)),z},this.destroy=function(){n.releaseStatesOfProgram(this),r.deleteProgram(_),this.program=void 0},this.type=t.shaderType,this.name=t.shaderName,this.id=Wp++,this.cacheKey=e,this.usedTimes=1,this.program=_,this.vertexShader=b,this.fragmentShader=R,this}let hm=0;class dm{constructor(){this.shaderCache=new Map,this.materialCache=new Map}update(e,t,n){const r=this._getShaderCacheForMaterial(e);return r.has(t)===!1&&(r.add(t),t.usedTimes++),r.has(n)===!1&&(r.add(n),n.usedTimes++),this}remove(e){const t=this.materialCache.get(e);for(const n of t)n.usedTimes--,n.usedTimes===0&&this.shaderCache.delete(n.code);return this.materialCache.delete(e),this}getVertexShaderStage(e){return this._getShaderStage(e.vertexShader)}getFragmentShaderStage(e){return this._getShaderStage(e.fragmentShader)}dispose(){this.shaderCache.clear(),this.materialCache.clear()}_getShaderCacheForMaterial(e){const t=this.materialCache;let n=t.get(e);return n===void 0&&(n=new Set,t.set(e,n)),n}_getShaderStage(e){const t=this.shaderCache;let n=t.get(e);return n===void 0&&(n=new fm(e),t.set(e,n)),n}}class fm{constructor(e){this.id=hm++,this.code=e,this.usedTimes=0}}function pm(i){return i===ni||i===Br||i===zr}function mm(i,e,t,n,r,s){const a=new Rl,o=new dm,c=new Set,l=[],u=new Map,f=n.logarithmicDepthBuffer,d={MeshDepthMaterial:"depth",MeshDistanceMaterial:"distance",MeshNormalMaterial:"normal",MeshBasicMaterial:"basic",MeshLambertMaterial:"lambert",MeshPhongMaterial:"phong",MeshToonMaterial:"toon",MeshStandardMaterial:"physical",MeshPhysicalMaterial:"physical",MeshMatcapMaterial:"matcap",LineBasicMaterial:"basic",LineDashedMaterial:"dashed",PointsMaterial:"points",ShadowMaterial:"shadow",SpriteMaterial:"sprite"};function h(g){return c.add(g),g===0?"uv":`uv${g}`}function _(g,y,z,D,U,G){const K=D.fog,P=U.geometry,Y=g.isMeshStandardMaterial||g.isMeshLambertMaterial||g.isMeshPhongMaterial?D.environment:null,Z=g.isMeshStandardMaterial||g.isMeshLambertMaterial&&!g.envMap||g.isMeshPhongMaterial&&!g.envMap,X=e.get(g.envMap||Y,Z),ie=d[g.type];let q=n.precision;g.precision!==null&&(q=n.getMaxPrecision(g.precision),q!==g.precision&&Ue("WebGLProgram.getParameters:",g.precision,"not supported, using",q,"instead."));const j=P.morphAttributes.position||P.morphAttributes.normal||P.morphAttributes.color,ee=j!==void 0?j.length:0;let Se=0;P.morphAttributes.position!==void 0&&(Se=1),P.morphAttributes.normal!==void 0&&(Se=2),P.morphAttributes.color!==void 0&&(Se=3);let Fe,J,pe,ve;if(ie){const ge=hn[ie];Fe=ge.vertexShader,J=ge.fragmentShader}else{Fe=g.vertexShader,J=g.fragmentShader;const ge=o.getVertexShaderStage(g),it=o.getFragmentShaderStage(g);o.update(g,ge,it),pe=ge.id,ve=it.id}const Pe=i.getRenderTarget(),me=i.state.buffers.depth.getReversed(),Oe=U.isInstancedMesh===!0,ht=U.isBatchedMesh===!0,De=!!g.map,Je=!!g.matcap,Qe=!!X,We=Qe&&X.isPMREMTexture===!0,gt=!!g.aoMap,ot=!!g.lightMap,St=!!g.bumpMap&&g.wireframe===!1,lt=!!g.normalMap,I=!!g.displacementMap,te=!!g.emissiveMap,Me=!!g.metalnessMap,Te=!!g.roughnessMap,ct=g.anisotropy>0,L=g.clearcoat>0,_t=g.diffuseRoughness>0,nt=g.dispersion>0,ze=g.retroreflectivity>0,ae=g.iridescence>0,st=g.sheen>0,we=g.transmission>0,Ie=ct&&!!g.anisotropyMap,E=L&&!!g.clearcoatMap,x=L&&!!g.clearcoatNormalMap,F=L&&!!g.clearcoatRoughnessMap,re=_t&&!!g.diffuseRoughnessMap,Q=ae&&!!g.iridescenceMap,le=ae&&!!g.iridescenceThicknessMap,ce=st&&!!g.sheenColorMap,$=st&&!!g.sheenRoughnessMap,N=!!g.specularMap,ne=!!g.specularColorMap,T=!!g.specularIntensityMap,k=we&&!!g.transmissionMap,V=we&&!!g.thicknessMap,he=!!g.gradientMap,oe=!!g.alphaMap,ue=g.alphaTest>0,Re=!!g.alphaHash,ke=!!g.extensions;let se=wn;g.toneMapped&&(Pe===null||Pe.isXRRenderTarget===!0)&&(se=i.toneMapping);const Le=We?X.isCompressedCubeTexture?X.image[0].mipmaps:X.mipmaps:null,He={shaderID:ie,shaderType:g.type,shaderName:g.name,vertexShader:Fe,fragmentShader:J,defines:g.defines,customVertexShaderID:pe,customFragmentShaderID:ve,isRawShaderMaterial:g.isRawShaderMaterial===!0,glslVersion:g.glslVersion,precision:q,batching:ht,batchingColor:ht&&U._colorsTexture!==null,instancing:Oe,instancingColor:Oe&&U.instanceColor!==null,instancingMorph:Oe&&U.morphTexture!==null,outputColorSpace:Pe===null?i.outputColorSpace:Pe.isXRRenderTarget===!0?Pe.texture.colorSpace:Ye.workingColorSpace,alphaToCoverage:!!g.alphaToCoverage,map:De,matcap:Je,envMap:Qe,envMapMode:Qe&&X.mapping,envMapPMREM:We,envMapMaxLod:We?Le.length-1:null,envMapSize:We?Le[0].width:null,aoMap:gt,lightMap:ot,bumpMap:St,normalMap:lt,displacementMap:I,emissiveMap:te,normalMapObjectSpace:lt&&g.normalMapType===jc,normalMapTangentSpace:lt&&g.normalMapType===co,packedNormalMap:lt&&g.normalMapType===co&&pm(g.normalMap.format),metalnessMap:Me,roughnessMap:Te,anisotropy:ct,anisotropyMap:Ie,clearcoat:L,clearcoatMap:E,clearcoatNormalMap:x,clearcoatRoughnessMap:F,diffuseRoughness:_t,diffuseRoughnessMap:re,dispersion:nt,retroreflection:ze,iridescence:ae,iridescenceMap:Q,iridescenceThicknessMap:le,sheen:st,sheenColorMap:ce,sheenRoughnessMap:$,specularMap:N,specularColorMap:ne,specularIntensityMap:T,transmission:we,transmissionMap:k,thicknessMap:V,gradientMap:he,opaque:g.transparent===!1&&g.blending===ki&&g.alphaToCoverage===!1,alphaMap:oe,alphaTest:ue,alphaHash:Re,combine:g.combine,mapUv:De&&h(g.map.channel),aoMapUv:gt&&h(g.aoMap.channel),lightMapUv:ot&&h(g.lightMap.channel),bumpMapUv:St&&h(g.bumpMap.channel),normalMapUv:lt&&h(g.normalMap.channel),displacementMapUv:I&&h(g.displacementMap.channel),emissiveMapUv:te&&h(g.emissiveMap.channel),metalnessMapUv:Me&&h(g.metalnessMap.channel),roughnessMapUv:Te&&h(g.roughnessMap.channel),anisotropyMapUv:Ie&&h(g.anisotropyMap.channel),clearcoatMapUv:E&&h(g.clearcoatMap.channel),clearcoatNormalMapUv:x&&h(g.clearcoatNormalMap.channel),clearcoatRoughnessMapUv:F&&h(g.clearcoatRoughnessMap.channel),diffuseRoughnessMapUv:re&&h(g.diffuseRoughnessMap.channel),iridescenceMapUv:Q&&h(g.iridescenceMap.channel),iridescenceThicknessMapUv:le&&h(g.iridescenceThicknessMap.channel),sheenColorMapUv:ce&&h(g.sheenColorMap.channel),sheenRoughnessMapUv:$&&h(g.sheenRoughnessMap.channel),specularMapUv:N&&h(g.specularMap.channel),specularColorMapUv:ne&&h(g.specularColorMap.channel),specularIntensityMapUv:T&&h(g.specularIntensityMap.channel),transmissionMapUv:k&&h(g.transmissionMap.channel),thicknessMapUv:V&&h(g.thicknessMap.channel),alphaMapUv:oe&&h(g.alphaMap.channel),vertexTangents:!!P.attributes.tangent&&(lt||ct),vertexNormals:!!P.attributes.normal,vertexColors:g.vertexColors,vertexAlphas:g.vertexColors===!0&&!!P.attributes.color&&P.attributes.color.itemSize===4,pointsUvs:U.isPoints===!0&&!!P.attributes.uv&&(De||oe),fog:!!K,useFog:g.fog===!0,fogExp2:!!K&&K.isFogExp2,flatShading:g.wireframe===!1&&(g.flatShading===!0||P.attributes.normal===void 0&&lt===!1&&(g.isMeshLambertMaterial||g.isMeshPhongMaterial||g.isMeshStandardMaterial||g.isMeshPhysicalMaterial)),sizeAttenuation:g.sizeAttenuation===!0,logarithmicDepthBuffer:f,reversedDepthBuffer:me,skinning:U.isSkinnedMesh===!0,hasPositionAttribute:P.attributes.position!==void 0,morphTargets:P.morphAttributes.position!==void 0,morphNormals:P.morphAttributes.normal!==void 0,morphColors:P.morphAttributes.color!==void 0,morphTargetsCount:ee,morphTextureStride:Se,numSunLights:y.sun.length,numDirLights:y.directional.length,numPointLights:y.point.length,numSpotLights:y.spot.length,numSpotLightMaps:y.spotLightMap.length,numRectAreaLights:y.rectArea.length,numHemiLights:y.hemi.length,numSunLightShadows:y.sunShadowMap.length,numDirLightShadows:y.directionalShadowMap.length,numPointLightShadows:y.pointShadowMap.length,numSpotLightShadows:y.spotShadowMap.length,numSpotLightShadowsWithMaps:y.numSpotLightShadowsWithMaps,numLightProbes:y.numLightProbes,numLightProbeGrids:G.filter(ge=>ge.texture!==null).length,numClippingPlanes:s.numPlanes,numClipIntersection:s.numIntersection,dithering:g.dithering,shadowMapEnabled:i.shadowMap.enabled&&z.length>0,shadowMapType:i.shadowMap.type,toneMapping:se,decodeVideoTexture:De&&g.map.isVideoTexture===!0&&Ye.getTransfer(g.map.colorSpace)===rt,decodeVideoTextureEmissive:te&&g.emissiveMap.isVideoTexture===!0&&Ye.getTransfer(g.emissiveMap.colorSpace)===rt,premultipliedAlpha:g.premultipliedAlpha,doubleSided:g.side===Zt,flipSided:g.side===Wt,useDepthPacking:g.depthPacking>=0,depthPacking:g.depthPacking||0,index0AttributeName:g.index0AttributeName,extensionClipCullDistance:ke&&g.extensions.clipCullDistance===!0&&t.has("WEBGL_clip_cull_distance"),extensionMultiDraw:(ke&&g.extensions.multiDraw===!0||ht)&&t.has("WEBGL_multi_draw"),rendererExtensionParallelShaderCompile:t.has("KHR_parallel_shader_compile"),customProgramCacheKey:g.customProgramCacheKey()};return He.vertexUv1s=c.has(1),He.vertexUv2s=c.has(2),He.vertexUv3s=c.has(3),c.clear(),He}function S(g){const y=[];if(g.shaderID?y.push(g.shaderID):(y.push(g.customVertexShaderID),y.push(g.customFragmentShaderID)),g.defines!==void 0)for(const z in g.defines)y.push(z),y.push(g.defines[z]);return g.isRawShaderMaterial===!1&&(m(y,g),p(y,g),y.push(i.outputColorSpace)),y.push(g.customProgramCacheKey),y.join()}function m(g,y){g.push(y.precision),g.push(y.outputColorSpace),g.push(y.envMapMode),g.push(y.envMapPMREM),g.push(y.envMapMaxLod),g.push(y.envMapSize),g.push(y.mapUv),g.push(y.alphaMapUv),g.push(y.lightMapUv),g.push(y.aoMapUv),g.push(y.bumpMapUv),g.push(y.normalMapUv),g.push(y.displacementMapUv),g.push(y.emissiveMapUv),g.push(y.metalnessMapUv),g.push(y.roughnessMapUv),g.push(y.anisotropyMapUv),g.push(y.clearcoatMapUv),g.push(y.clearcoatNormalMapUv),g.push(y.clearcoatRoughnessMapUv),g.push(y.diffuseRoughnessMapUv),g.push(y.iridescenceMapUv),g.push(y.iridescenceThicknessMapUv),g.push(y.sheenColorMapUv),g.push(y.sheenRoughnessMapUv),g.push(y.specularMapUv),g.push(y.specularColorMapUv),g.push(y.specularIntensityMapUv),g.push(y.transmissionMapUv),g.push(y.thicknessMapUv),g.push(y.combine),g.push(y.fogExp2),g.push(y.sizeAttenuation),g.push(y.morphTargetsCount),g.push(y.numSunLights),g.push(y.numDirLights),g.push(y.numPointLights),g.push(y.numSpotLights),g.push(y.numSpotLightMaps),g.push(y.numHemiLights),g.push(y.numRectAreaLights),g.push(y.numSunLightShadows),g.push(y.numDirLightShadows),g.push(y.numPointLightShadows),g.push(y.numSpotLightShadows),g.push(y.numSpotLightShadowsWithMaps),g.push(y.numLightProbes),g.push(y.numLightProbeGrids),g.push(y.shadowMapType),g.push(y.toneMapping),g.push(y.numClippingPlanes),g.push(y.numClipIntersection),g.push(y.depthPacking)}function p(g,y){a.disableAll(),y.instancing&&a.enable(0),y.instancingColor&&a.enable(1),y.instancingMorph&&a.enable(2),y.matcap&&a.enable(3),y.envMap&&a.enable(4),y.normalMapObjectSpace&&a.enable(5),y.normalMapTangentSpace&&a.enable(6),y.clearcoat&&a.enable(7),y.iridescence&&a.enable(8),y.alphaTest&&a.enable(9),y.vertexColors&&a.enable(10),y.vertexAlphas&&a.enable(11),y.vertexUv1s&&a.enable(12),y.vertexUv2s&&a.enable(13),y.vertexUv3s&&a.enable(14),y.vertexTangents&&a.enable(15),y.anisotropy&&a.enable(16),y.alphaHash&&a.enable(17),y.batching&&a.enable(18),y.dispersion&&a.enable(19),y.retroreflection&&a.enable(24),y.diffuseRoughness&&a.enable(25),y.batchingColor&&a.enable(20),y.gradientMap&&a.enable(21),y.packedNormalMap&&a.enable(22),y.vertexNormals&&a.enable(23),g.push(a.mask),a.disableAll(),y.fog&&a.enable(0),y.useFog&&a.enable(1),y.flatShading&&a.enable(2),y.logarithmicDepthBuffer&&a.enable(3),y.reversedDepthBuffer&&a.enable(4),y.skinning&&a.enable(5),y.morphTargets&&a.enable(6),y.morphNormals&&a.enable(7),y.morphColors&&a.enable(8),y.premultipliedAlpha&&a.enable(9),y.shadowMapEnabled&&a.enable(10),y.doubleSided&&a.enable(11),y.flipSided&&a.enable(12),y.useDepthPacking&&a.enable(13),y.dithering&&a.enable(14),y.transmission&&a.enable(15),y.sheen&&a.enable(16),y.opaque&&a.enable(17),y.pointsUvs&&a.enable(18),y.decodeVideoTexture&&a.enable(19),y.decodeVideoTextureEmissive&&a.enable(20),y.alphaToCoverage&&a.enable(21),y.numLightProbeGrids>0&&a.enable(22),y.hasPositionAttribute&&a.enable(23),g.push(a.mask)}function M(g){const y=d[g.type];let z;if(y){const D=hn[y];z=Gu.clone(D.uniforms)}else z=g.uniforms;return z}function w(g,y){let z=u.get(y);return z!==void 0?++z.usedTimes:(z=new um(i,y,g,r),l.push(z),u.set(y,z)),z}function b(g){if(--g.usedTimes===0){const y=l.indexOf(g);l[y]=l[l.length-1],l.pop(),u.delete(g.cacheKey),g.destroy()}}function R(g){o.remove(g)}function A(){o.dispose()}return{getParameters:_,getProgramCacheKey:S,getUniforms:M,acquireProgram:w,releaseProgram:b,releaseShaderCache:R,programs:l,dispose:A}}function gm(){let i=new WeakMap;function e(a){return i.has(a)}function t(a){let o=i.get(a);return o===void 0&&(o={},i.set(a,o)),o}function n(a){i.delete(a)}function r(a,o,c){i.get(a)[o]=c}function s(){i=new WeakMap}return{has:e,get:t,remove:n,update:r,dispose:s}}function _m(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.material.id!==e.material.id?i.material.id-e.material.id:i.materialVariant!==e.materialVariant?i.materialVariant-e.materialVariant:i.z!==e.z?i.z-e.z:i.id-e.id}function Qo(i,e){return i.groupOrder!==e.groupOrder?i.groupOrder-e.groupOrder:i.renderOrder!==e.renderOrder?i.renderOrder-e.renderOrder:i.z!==e.z?e.z-i.z:i.id-e.id}function jo(){const i=[];let e=0;const t=[],n=[],r=[];function s(){e=0,t.length=0,n.length=0,r.length=0}function a(d){let h=0;return d.isInstancedMesh&&(h+=2),d.isSkinnedMesh&&(h+=1),h}function o(d,h,_,S,m,p){let M=i[e];return M===void 0?(M={id:d.id,object:d,geometry:h,material:_,materialVariant:a(d),groupOrder:S,renderOrder:d.renderOrder,z:m,group:p},i[e]=M):(M.id=d.id,M.object=d,M.geometry=h,M.material=_,M.materialVariant=a(d),M.groupOrder=S,M.renderOrder=d.renderOrder,M.z=m,M.group=p),e++,M}function c(d,h,_,S,m,p,M){M.reversedDepth===!0&&(m=-m);const w=o(d,h,_,S,m,p);_.transmission>0?n.push(w):_.transparent===!0?r.push(w):t.push(w)}function l(d,h,_,S,m,p){const M=o(d,h,_,S,m,p);_.transmission>0?n.unshift(M):_.transparent===!0?r.unshift(M):t.unshift(M)}function u(d,h){t.length>1&&t.sort(d||_m),n.length>1&&n.sort(h||Qo),r.length>1&&r.sort(h||Qo)}function f(){for(let d=e,h=i.length;d<h;d++){const _=i[d];if(_.id===null)break;_.id=null,_.object=null,_.geometry=null,_.material=null,_.group=null}}return{opaque:t,transmissive:n,transparent:r,init:s,push:c,unshift:l,finish:f,sort:u}}function xm(){let i=new WeakMap;function e(n,r){const s=i.get(n);let a;return s===void 0?(a=new jo,i.set(n,[a])):r>=s.length?(a=new jo,s.push(a)):a=s[r],a}function t(){i=new WeakMap}return{get:e,dispose:t}}function vm(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={direction:new H,color:new tt};break;case"SpotLight":t={position:new H,direction:new H,color:new tt,distance:0,coneCos:0,penumbraCos:0,decay:0};break;case"PointLight":t={position:new H,color:new tt,distance:0,decay:0};break;case"HemisphereLight":t={direction:new H,skyColor:new tt,groundColor:new tt};break;case"RectAreaLight":t={color:new tt,position:new H,halfWidth:new H,halfHeight:new H};break}return i[e.id]=t,t}}}function Sm(){const i={};return{get:function(e){if(i[e.id]!==void 0)return i[e.id];let t;switch(e.type){case"SunLight":case"DirectionalLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ze};break;case"SpotLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ze};break;case"PointLight":t={shadowIntensity:1,shadowBias:0,shadowNormalBias:0,shadowRadius:1,shadowMapSize:new Ze,shadowCameraNear:1,shadowCameraFar:1e3};break}return i[e.id]=t,t}}}let Mm=0;function Em(i,e){return(e.castShadow?2:0)-(i.castShadow?2:0)+(e.map?1:0)-(i.map?1:0)}function ym(i){const e=new vm,t=Sm(),n={version:0,hash:{sunLength:-1,directionalLength:-1,pointLength:-1,spotLength:-1,rectAreaLength:-1,hemiLength:-1,numSunShadows:-1,numDirectionalShadows:-1,numPointShadows:-1,numSpotShadows:-1,numSpotMaps:-1,numLightProbes:-1},ambient:[0,0,0],probe:[],sun:[],sunShadow:[],sunShadowMap:[],sunShadowMatrix:[],sunShadowCascade:[],directional:[],directionalShadow:[],directionalShadowMap:[],directionalShadowMatrix:[],spot:[],spotLightMap:[],spotShadow:[],spotShadowMap:[],spotLightMatrix:[],rectArea:[],rectAreaLTC1:null,rectAreaLTC2:null,point:[],pointShadow:[],pointShadowMap:[],pointShadowMatrix:[],hemi:[],numSpotLightShadowsWithMaps:0,numLightProbes:0};for(let l=0;l<9;l++)n.probe.push(new H);const r=new H,s=new pt,a=new pt;function o(l){let u=0,f=0,d=0;for(let G=0;G<9;G++)n.probe[G].set(0,0,0);let h=0,_=0,S=0,m=0,p=0,M=0,w=0,b=0,R=0,A=0,g=0,y=0,z=0,D=0;l.sort(Em);for(let G=0,K=l.length;G<K;G++){const P=l[G],Y=P.color,Z=P.intensity,X=P.distance;let ie=null;if(P.shadow&&P.shadow.map&&(P.shadow.map.texture.format===ni?ie=P.shadow.map.texture:ie=P.shadow.map.depthTexture||P.shadow.map.texture),P.isAmbientLight)u+=Y.r*Z,f+=Y.g*Z,d+=Y.b*Z;else if(P.isLightProbe){for(let q=0;q<9;q++)n.probe[q].addScaledVector(P.sh.coefficients[q],Z);D++}else if(P.isSunLight){const q=e.get(P);if(q.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const j=P.shadow,ee=t.get(P);ee.shadowIntensity=j.intensity,ee.shadowBias=j.bias,ee.shadowNormalBias=j.normalBias,ee.shadowRadius=j.radius,ee.shadowMapSize.copy(j.mapSize).multiply(j.getFrameExtents()),n.sunShadow[_]=ee,n.sunShadowMap[_]=ie;const Se=j.getViewportCount();for(let Fe=0;Fe<Se;Fe++)n.sunShadowMatrix[S+Fe]=j.getMatrix(Fe),n.sunShadowCascade[S+Fe]=j._cascadeData[Fe];S+=Se,_++}n.sun[h]=q,h++}else if(P.isDirectionalLight){const q=e.get(P);if(q.color.copy(P.color).multiplyScalar(P.intensity),P.castShadow){const j=P.shadow,ee=t.get(P);ee.shadowIntensity=j.intensity,ee.shadowBias=j.bias,ee.shadowNormalBias=j.normalBias,ee.shadowRadius=j.radius,ee.shadowMapSize=j.mapSize,n.directionalShadow[m]=ee,n.directionalShadowMap[m]=ie,n.directionalShadowMatrix[m]=P.shadow.matrix,R++}n.directional[m]=q,m++}else if(P.isSpotLight){const q=e.get(P);q.position.setFromMatrixPosition(P.matrixWorld),q.color.copy(Y).multiplyScalar(Z),q.distance=X,q.coneCos=Math.cos(P.angle),q.penumbraCos=Math.cos(P.angle*(1-P.penumbra)),q.decay=P.decay,n.spot[M]=q;const j=P.shadow;if(P.map&&(n.spotLightMap[y]=P.map,y++,j.updateMatrices(P),P.castShadow&&z++),n.spotLightMatrix[M]=j.matrix,P.castShadow){const ee=t.get(P);ee.shadowIntensity=j.intensity,ee.shadowBias=j.bias,ee.shadowNormalBias=j.normalBias,ee.shadowRadius=j.radius,ee.shadowMapSize=j.mapSize,n.spotShadow[M]=ee,n.spotShadowMap[M]=ie,g++}M++}else if(P.isRectAreaLight){const q=e.get(P);q.color.copy(Y).multiplyScalar(Z),q.halfWidth.set(P.width*.5,0,0),q.halfHeight.set(0,P.height*.5,0),n.rectArea[w]=q,w++}else if(P.isPointLight){const q=e.get(P);if(q.color.copy(P.color).multiplyScalar(P.intensity),q.distance=P.distance,q.decay=P.decay,P.castShadow){const j=P.shadow,ee=t.get(P);ee.shadowIntensity=j.intensity,ee.shadowBias=j.bias,ee.shadowNormalBias=j.normalBias,ee.shadowRadius=j.radius,ee.shadowMapSize=j.mapSize,ee.shadowCameraNear=j.camera.near,ee.shadowCameraFar=j.camera.far,n.pointShadow[p]=ee,n.pointShadowMap[p]=ie,n.pointShadowMatrix[p]=P.shadow.matrix,A++}n.point[p]=q,p++}else if(P.isHemisphereLight){const q=e.get(P);q.skyColor.copy(P.color).multiplyScalar(Z),q.groundColor.copy(P.groundColor).multiplyScalar(Z),n.hemi[b]=q,b++}}w>0&&(i.has("OES_texture_float_linear")===!0?(n.rectAreaLTC1=_e.LTC_FLOAT_1,n.rectAreaLTC2=_e.LTC_FLOAT_2):(n.rectAreaLTC1=_e.LTC_HALF_1,n.rectAreaLTC2=_e.LTC_HALF_2)),n.ambient[0]=u,n.ambient[1]=f,n.ambient[2]=d;const U=n.hash;(U.sunLength!==h||U.directionalLength!==m||U.pointLength!==p||U.spotLength!==M||U.rectAreaLength!==w||U.hemiLength!==b||U.numSunShadows!==_||U.numDirectionalShadows!==R||U.numPointShadows!==A||U.numSpotShadows!==g||U.numSpotMaps!==y||U.numLightProbes!==D)&&(n.sun.length=h,n.directional.length=m,n.spot.length=M,n.rectArea.length=w,n.point.length=p,n.hemi.length=b,n.sunShadow.length=_,n.sunShadowMap.length=_,n.sunShadowMatrix.length=S,n.sunShadowCascade.length=S,n.directionalShadow.length=R,n.directionalShadowMap.length=R,n.directionalShadowMatrix.length=R,n.pointShadow.length=A,n.pointShadowMap.length=A,n.pointShadowMatrix.length=A,n.spotShadow.length=g,n.spotShadowMap.length=g,n.spotLightMatrix.length=g+y-z,n.spotLightMap.length=y,n.numSpotLightShadowsWithMaps=z,n.numLightProbes=D,U.sunLength=h,U.directionalLength=m,U.pointLength=p,U.spotLength=M,U.rectAreaLength=w,U.hemiLength=b,U.numSunShadows=_,U.numDirectionalShadows=R,U.numPointShadows=A,U.numSpotShadows=g,U.numSpotMaps=y,U.numLightProbes=D,n.version=Mm++)}function c(l,u){let f=0,d=0,h=0,_=0,S=0,m=0;const p=u.matrixWorldInverse;for(let M=0,w=l.length;M<w;M++){const b=l[M];if(b.isSunLight){const R=n.sun[f];R.direction.setFromMatrixPosition(b.matrixWorld),R.direction.transformDirection(p),f++}else if(b.isDirectionalLight){const R=n.directional[d];R.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),R.direction.sub(r),R.direction.transformDirection(p),d++}else if(b.isSpotLight){const R=n.spot[_];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(p),R.direction.setFromMatrixPosition(b.matrixWorld),r.setFromMatrixPosition(b.target.matrixWorld),R.direction.sub(r),R.direction.transformDirection(p),_++}else if(b.isRectAreaLight){const R=n.rectArea[S];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(p),a.identity(),s.copy(b.matrixWorld),s.premultiply(p),a.extractRotation(s),R.halfWidth.set(b.width*.5,0,0),R.halfHeight.set(0,b.height*.5,0),R.halfWidth.applyMatrix4(a),R.halfHeight.applyMatrix4(a),S++}else if(b.isPointLight){const R=n.point[h];R.position.setFromMatrixPosition(b.matrixWorld),R.position.applyMatrix4(p),h++}else if(b.isHemisphereLight){const R=n.hemi[m];R.direction.setFromMatrixPosition(b.matrixWorld),R.direction.transformDirection(p),m++}}}return{setup:o,setupView:c,state:n}}function el(i){const e=new ym(i),t=[],n=[],r=[];function s(f){u.camera=f,t.length=0,n.length=0,r.length=0}function a(f){f.isLightProbeGrid?r.push(f):t.push(f)}function o(f){n.push(f)}function c(){e.setup(t),r.sort((f,d)=>f.priority-d.priority||f.id-d.id)}function l(f){e.setupView(t,f)}const u={lightsArray:t,shadowsArray:n,lightProbeGridArray:r,camera:null,lights:e,transmissionRenderTarget:{},textureUnits:0};return{init:s,state:u,setupLights:c,setupLightsView:l,pushLight:a,pushShadow:o}}function bm(i){let e=new WeakMap;function t(r,s=0){const a=e.get(r);let o;return a===void 0?(o=new el(i),e.set(r,[o])):s>=a.length?(o=new el(i),a.push(o)):o=a[s],o}function n(){e=new WeakMap}return{get:t,dispose:n}}const Tm=`void main() {
	gl_Position = vec4( position, 1.0 );
}`,Am=`uniform sampler2D shadow_pass;
uniform vec2 resolution;
uniform float radius;
void main() {
	const float samples = float( VSM_SAMPLES );
	float mean = 0.0;
	float squared_mean = 0.0;
	float uvStride = samples <= 1.0 ? 0.0 : 2.0 / ( samples - 1.0 );
	float uvStart = samples <= 1.0 ? 0.0 : - 1.0;
	for ( float i = 0.0; i < samples; i ++ ) {
		float uvOffset = uvStart + i * uvStride;
		#ifdef HORIZONTAL_PASS
			vec2 distribution = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( uvOffset, 0.0 ) * radius ) / resolution ).rg;
			mean += distribution.x;
			squared_mean += distribution.y * distribution.y + distribution.x * distribution.x;
		#else
			float depth = texture2D( shadow_pass, ( gl_FragCoord.xy + vec2( 0.0, uvOffset ) * radius ) / resolution ).r;
			mean += depth;
			squared_mean += depth * depth;
		#endif
	}
	mean = mean / samples;
	squared_mean = squared_mean / samples;
	float std_dev = sqrt( max( 0.0, squared_mean - mean * mean ) );
	gl_FragColor = vec4( mean, std_dev, 0.0, 1.0 );
}`,wm=[new H(1,0,0),new H(-1,0,0),new H(0,1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1)],Rm=[new H(0,-1,0),new H(0,-1,0),new H(0,0,1),new H(0,0,-1),new H(0,-1,0),new H(0,-1,0)],tl=new pt,Oi=new H,Us=new H;function Cm(i,e,t){let n=new Wr;const r=new Ze,s=new Ze,a=new ft,o=new Wu,c=new Xu,l={},u=t.maxTextureSize,f={[ti]:Wt,[Wt]:ti,[Zt]:Zt},d=new ri({defines:{VSM_SAMPLES:8},uniforms:{shadow_pass:{value:null},resolution:{value:new Ze},radius:{value:4}},vertexShader:Tm,fragmentShader:Am}),h=d.clone();h.defines.HORIZONTAL_PASS=1;const _=new on;_.setAttribute("position",new ei(new Float32Array([-1,-1,.5,3,-1,.5,-1,3,.5]),3));const S=new Bt(_,d),m=this;this.enabled=!1,this.autoUpdate=!0,this.needsUpdate=!1,this.type=Pr;let p=this.type;this.render=function(A,g,y){if(m.enabled===!1||m.autoUpdate===!1&&m.needsUpdate===!1||A.length===0)return;this.type===Pc&&(Ue("WebGLShadowMap: PCFSoftShadowMap has been removed. Using PCFShadowMap instead."),this.type=Pr);const z=i.getRenderTarget(),D=i.getActiveCubeFace(),U=i.getActiveMipmapLevel(),G=i.state;G.setBlending(Si),G.buffers.depth.getReversed()===!0?G.buffers.color.setClear(0,0,0,0):G.buffers.color.setClear(1,1,1,1),G.buffers.depth.setTest(!0),G.setScissorTest(!1);const K=p!==this.type;K&&g.traverse(function(P){P.material&&(Array.isArray(P.material)?P.material.forEach(Y=>Y.needsUpdate=!0):P.material.needsUpdate=!0)});for(let P=0,Y=A.length;P<Y;P++){const Z=A[P],X=Z.shadow;if(X===void 0){Ue("WebGLShadowMap:",Z,"has no shadow.");continue}if(X.autoUpdate===!1&&X.needsUpdate===!1)continue;r.copy(X.mapSize);const ie=X.getFrameExtents();r.multiply(ie),s.copy(X.mapSize),(r.x>u||r.y>u)&&(r.x>u&&(s.x=Math.floor(u/ie.x),r.x=s.x*ie.x,X.mapSize.x=s.x),r.y>u&&(s.y=Math.floor(u/ie.y),r.y=s.y*ie.y,X.mapSize.y=s.y));const q=i.state.buffers.depth.getReversed();if(X.camera._reversedDepth=q,X.map===null||K===!0){if(X.map!==null&&(X.map.depthTexture!==null&&(X.map.depthTexture.dispose(),X.map.depthTexture=null),X.map.dispose()),this.type===Bi){if(Z.isPointLight){Ue("WebGLShadowMap: VSM shadow maps are not supported for PointLights. Use PCF or BasicShadowMap instead.");continue}X.map=new pn(r.x,r.y,{format:ni,type:gn,minFilter:Vt,magFilter:Vt,generateMipmaps:!1}),X.map.texture.name=Z.name+".shadowMap",X.map.depthTexture=new bi(r.x,r.y,dn),X.map.depthTexture.name=Z.name+".shadowMapDepth",X.map.depthTexture.format=Vn,X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=Rt,X.map.depthTexture.magFilter=Rt}else Z.isPointLight?(X.map=new Fa(r.x),X.map.depthTexture=new Ul(r.x,mn)):(X.map=new pn(r.x,r.y),X.map.depthTexture=new bi(r.x,r.y,mn)),X.map.depthTexture.name=Z.name+".shadowMap",X.map.depthTexture.format=Vn,this.type===Pr?(X.map.depthTexture.compareFunction=q?bl:yl,X.map.depthTexture.minFilter=Vt,X.map.depthTexture.magFilter=Vt):(X.map.depthTexture.compareFunction=null,X.map.depthTexture.minFilter=Rt,X.map.depthTexture.magFilter=Rt);X.camera.updateProjectionMatrix()}X.map.isWebGLCubeRenderTarget!==!0&&(X.map.width!==r.x||X.map.height!==r.y)&&X.map.setSize(r.x,r.y);const j=X.map.isWebGLCubeRenderTarget?6:X.getViewportCount();Z.isPointLight!==!0&&X.updateMatrices(Z,y);const ee=X.camera.layers.mask&4294967294?X.camera.layers:y.layers;for(let Se=0;Se<j;Se++){const Fe=X.getCamera(Se);if(Z.isPointLight){const J=X.camera,pe=X.matrix,ve=Z.distance||J.far;ve!==J.far&&(J.far=ve,J.updateProjectionMatrix()),Oi.setFromMatrixPosition(Z.matrixWorld),J.position.copy(Oi),Us.copy(J.position),Us.add(wm[Se]),J.up.copy(Rm[Se]),J.lookAt(Us),J.updateMatrixWorld(),pe.makeTranslation(-Oi.x,-Oi.y,-Oi.z),tl.multiplyMatrices(J.projectionMatrix,J.matrixWorldInverse),X._frustum.setFromProjectionMatrix(tl,J.coordinateSystem,J.reversedDepth)}if(X.map.isWebGLCubeRenderTarget)i.setRenderTarget(X.map,Se),i.clear();else{Se===0&&(i.setRenderTarget(X.map),i.clear());const J=X.getViewport(Se);a.set(s.x*J.x,s.y*J.y,s.x*J.z,s.y*J.w),G.viewport(a)}n=X.getFrustum(Se),b(g,y,Fe,Z,ee,this.type)}X.isPointLightShadow!==!0&&this.type===Bi&&M(X,y),X.needsUpdate=!1}p=this.type,m.needsUpdate=!1,i.setRenderTarget(z,D,U)};function M(A,g){const y=e.update(S);d.defines.VSM_SAMPLES!==A.blurSamples&&(d.defines.VSM_SAMPLES=A.blurSamples,h.defines.VSM_SAMPLES=A.blurSamples,d.needsUpdate=!0,h.needsUpdate=!0),A.mapPass===null?A.mapPass=new pn(r.x,r.y,{format:ni,type:gn}):(A.mapPass.width!==A.map.width||A.mapPass.height!==A.map.height)&&A.mapPass.setSize(A.map.width,A.map.height),d.uniforms.shadow_pass.value=A.map.depthTexture,d.uniforms.resolution.value.set(A.map.width,A.map.height),d.uniforms.radius.value=A.radius,i.setRenderTarget(A.mapPass),i.clear(),i.renderBufferDirect(g,null,y,d,S,null),h.uniforms.shadow_pass.value=A.mapPass.texture,h.uniforms.resolution.value.set(A.map.width,A.map.height),h.uniforms.radius.value=A.radius,i.setRenderTarget(A.map),i.clear(),i.renderBufferDirect(g,null,y,h,S,null)}function w(A,g,y,z){let D=null;const U=y.isPointLight===!0?A.customDistanceMaterial:A.customDepthMaterial;if(U!==void 0)D=U;else if(D=y.isPointLight===!0?c:o,i.localClippingEnabled&&g.clipShadows===!0&&Array.isArray(g.clippingPlanes)&&g.clippingPlanes.length!==0||g.displacementMap&&g.displacementScale!==0||g.alphaMap&&g.alphaTest>0||g.map&&g.alphaTest>0||g.alphaToCoverage===!0){const G=D.uuid,K=g.uuid;let P=l[G];P===void 0&&(P={},l[G]=P);let Y=P[K];Y===void 0&&(Y=D.clone(),P[K]=Y,g.addEventListener("dispose",R)),D=Y}if(D.visible=g.visible,D.wireframe=g.wireframe,z===Bi?D.side=g.shadowSide!==null?g.shadowSide:g.side:D.side=g.shadowSide!==null?g.shadowSide:f[g.side],D.alphaMap=g.alphaMap,D.alphaTest=g.alphaToCoverage===!0?.5:g.alphaTest,D.map=g.map,D.clipShadows=g.clipShadows,D.clippingPlanes=g.clippingPlanes,D.clipIntersection=g.clipIntersection,D.displacementMap=g.displacementMap,D.displacementScale=g.displacementScale,D.displacementBias=g.displacementBias,D.wireframeLinewidth=g.wireframeLinewidth,D.linewidth=g.linewidth,y.isPointLight===!0&&D.isMeshDistanceMaterial===!0){const G=i.properties.get(D);G.light=y}return D}function b(A,g,y,z,D,U){if(A.visible===!1)return;if(A.layers.test(D)&&(A.isMesh||A.isLine||A.isPoints)&&(A.castShadow||A.receiveShadow&&U===Bi)&&(!A.frustumCulled||A.intersectsFrustum(n))){A.modelViewMatrix.multiplyMatrices(y.matrixWorldInverse,A.matrixWorld);const P=e.update(A),Y=A.material;if(Array.isArray(Y)){const Z=P.groups;for(let X=0,ie=Z.length;X<ie;X++){const q=Z[X],j=Y[q.materialIndex];if(j&&j.visible){const ee=w(A,j,z,U);A.onBeforeShadow(i,A,g,y,P,ee,q),i.renderBufferDirect(y,null,P,ee,A,q),A.onAfterShadow(i,A,g,y,P,ee,q)}}}else if(Y.visible){const Z=w(A,Y,z,U);A.onBeforeShadow(i,A,g,y,P,Z,null),i.renderBufferDirect(y,null,P,Z,A,null),A.onAfterShadow(i,A,g,y,P,Z,null)}}const K=A.children;for(let P=0,Y=K.length;P<Y;P++)b(K[P],g,y,z,D,U)}function R(A){A.target.removeEventListener("dispose",R);for(const y in l){const z=l[y],D=A.target.uuid;D in z&&(z[D].dispose(),delete z[D])}}}function Pm(i,e){function t(){let T=!1;const k=new ft;let V=null;const he=new ft(0,0,0,0);return{setMask:function(oe){V!==oe&&!T&&(i.colorMask(oe,oe,oe,oe),V=oe)},setLocked:function(oe){T=oe},setClear:function(oe,ue,Re,ke,se){se===!0&&(oe*=ke,ue*=ke,Re*=ke),k.set(oe,ue,Re,ke),he.equals(k)===!1&&(i.clearColor(oe,ue,Re,ke),he.copy(k))},reset:function(){T=!1,V=null,he.set(-1,0,0,0)}}}function n(){let T=!1,k=!1,V=null,he=null,oe=null;return{setReversed:function(ue){if(k!==ue){const Re=e.get("EXT_clip_control");ue?Re.clipControlEXT(Re.LOWER_LEFT_EXT,Re.ZERO_TO_ONE_EXT):Re.clipControlEXT(Re.LOWER_LEFT_EXT,Re.NEGATIVE_ONE_TO_ONE_EXT),k=ue;const ke=oe;oe=null,this.setClear(ke)}},getReversed:function(){return k},setTest:function(ue){ue?me(i.DEPTH_TEST):Oe(i.DEPTH_TEST)},setMask:function(ue){V!==ue&&!T&&(i.depthMask(ue),V=ue)},setFunc:function(ue){if(k&&(ue=uu[ue]),he!==ue){switch(ue){case Bs:i.depthFunc(i.NEVER);break;case zs:i.depthFunc(i.ALWAYS);break;case Gs:i.depthFunc(i.LESS);break;case Wi:i.depthFunc(i.LEQUAL);break;case Hs:i.depthFunc(i.EQUAL);break;case ks:i.depthFunc(i.GEQUAL);break;case Vs:i.depthFunc(i.GREATER);break;case Ws:i.depthFunc(i.NOTEQUAL);break;default:i.depthFunc(i.LEQUAL)}he=ue}},setLocked:function(ue){T=ue},setClear:function(ue){oe!==ue&&(oe=ue,k&&(ue=1-ue),i.clearDepth(ue))},reset:function(){T=!1,V=null,he=null,oe=null,k=!1}}}function r(){let T=!1,k=null,V=null,he=null,oe=null,ue=null,Re=null,ke=null,se=null;return{setTest:function(Le){T||(Le?me(i.STENCIL_TEST):Oe(i.STENCIL_TEST))},setMask:function(Le){k!==Le&&!T&&(i.stencilMask(Le),k=Le)},setFunc:function(Le,He,ge){(V!==Le||he!==He||oe!==ge)&&(i.stencilFunc(Le,He,ge),V=Le,he=He,oe=ge)},setOp:function(Le,He,ge){(ue!==Le||Re!==He||ke!==ge)&&(i.stencilOp(Le,He,ge),ue=Le,Re=He,ke=ge)},setLocked:function(Le){T=Le},setClear:function(Le){se!==Le&&(i.clearStencil(Le),se=Le)},reset:function(){T=!1,k=null,V=null,he=null,oe=null,ue=null,Re=null,ke=null,se=null}}}const s=new t,a=new n,o=new r;let c={};const l=new WeakMap;let u={},f={},d={},h=new WeakMap,_=[],S=null,m=!1,p=null,M=null,w=null,b=null,R=null,A=null,g=null,y=new tt(0,0,0),z=0,D=!1,U=null,G=null,K=null,P=null,Y=null;const Z=i.getParameter(i.MAX_COMBINED_TEXTURE_IMAGE_UNITS);let X=!1,ie=0;const q=i.getParameter(i.VERSION);q.indexOf("WebGL")!==-1?(ie=parseFloat(/^WebGL (\d)/.exec(q)[1]),X=ie>=1):q.indexOf("OpenGL ES")!==-1&&(ie=parseFloat(/^OpenGL ES (\d)/.exec(q)[1]),X=ie>=2);let j=null,ee={};const Se=i.getParameter(i.SCISSOR_BOX),Fe=i.getParameter(i.VIEWPORT),J=new ft().fromArray(Se),pe=new ft().fromArray(Fe);function ve(T,k,V,he){const oe=new Uint8Array(4),ue=i.createTexture();i.bindTexture(T,ue),i.texParameteri(T,i.TEXTURE_MIN_FILTER,i.NEAREST),i.texParameteri(T,i.TEXTURE_MAG_FILTER,i.NEAREST);for(let Re=0;Re<V;Re++)T===i.TEXTURE_3D||T===i.TEXTURE_2D_ARRAY?i.texImage3D(k,0,i.RGBA,1,1,he,0,i.RGBA,i.UNSIGNED_BYTE,oe):i.texImage2D(k+Re,0,i.RGBA,1,1,0,i.RGBA,i.UNSIGNED_BYTE,oe);return ue}const Pe={};Pe[i.TEXTURE_2D]=ve(i.TEXTURE_2D,i.TEXTURE_2D,1),Pe[i.TEXTURE_CUBE_MAP]=ve(i.TEXTURE_CUBE_MAP,i.TEXTURE_CUBE_MAP_POSITIVE_X,6),Pe[i.TEXTURE_2D_ARRAY]=ve(i.TEXTURE_2D_ARRAY,i.TEXTURE_2D_ARRAY,1,1),Pe[i.TEXTURE_3D]=ve(i.TEXTURE_3D,i.TEXTURE_3D,1,1),s.setClear(0,0,0,1),a.setClear(1),o.setClear(0),me(i.DEPTH_TEST),a.setFunc(Wi),St(!1),lt(ao),me(i.CULL_FACE),gt(Si);function me(T){u[T]!==!0&&(i.enable(T),u[T]=!0)}function Oe(T){u[T]!==!1&&(i.disable(T),u[T]=!1)}function ht(T,k){return d[T]!==k?(i.bindFramebuffer(T,k),d[T]=k,T===i.DRAW_FRAMEBUFFER&&(d[i.FRAMEBUFFER]=k),T===i.FRAMEBUFFER&&(d[i.DRAW_FRAMEBUFFER]=k),!0):!1}function De(T,k){let V=_,he=!1;if(T){V=h.get(k),V===void 0&&(V=[],h.set(k,V));const oe=T.textures;if(V.length!==oe.length||V[0]!==i.COLOR_ATTACHMENT0){for(let ue=0,Re=oe.length;ue<Re;ue++)V[ue]=i.COLOR_ATTACHMENT0+ue;V.length=oe.length,he=!0}}else V[0]!==i.BACK&&(V[0]=i.BACK,he=!0);he&&i.drawBuffers(V)}function Je(T){return S!==T?(i.useProgram(T),S=T,!0):!1}const Qe={[vi]:i.FUNC_ADD,[Dc]:i.FUNC_SUBTRACT,[Ic]:i.FUNC_REVERSE_SUBTRACT};Qe[Nc]=i.MIN,Qe[Uc]=i.MAX;const We={[Fc]:i.ZERO,[Oc]:i.ONE,[Bc]:i.SRC_COLOR,[sl]:i.SRC_ALPHA,[Wc]:i.SRC_ALPHA_SATURATE,[kc]:i.DST_COLOR,[Gc]:i.DST_ALPHA,[zc]:i.ONE_MINUS_SRC_COLOR,[al]:i.ONE_MINUS_SRC_ALPHA,[Vc]:i.ONE_MINUS_DST_COLOR,[Hc]:i.ONE_MINUS_DST_ALPHA,[Xc]:i.CONSTANT_COLOR,[qc]:i.ONE_MINUS_CONSTANT_COLOR,[Yc]:i.CONSTANT_ALPHA,[Kc]:i.ONE_MINUS_CONSTANT_ALPHA};function gt(T,k,V,he,oe,ue,Re,ke,se,Le){if(T===Si){m===!0&&(Oe(i.BLEND),m=!1);return}if(m===!1&&(me(i.BLEND),m=!0),T!==Lc){if(T!==p||Le!==D){if((M!==vi||R!==vi)&&(i.blendEquation(i.FUNC_ADD),M=vi,R=vi),Le)switch(T){case ki:i.blendFuncSeparate(i.ONE,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Or:i.blendFunc(i.ONE,i.ONE);break;case oo:i.blendFuncSeparate(i.ZERO,i.ONE_MINUS_SRC_COLOR,i.ZERO,i.ONE);break;case lo:i.blendFuncSeparate(i.DST_COLOR,i.ONE_MINUS_SRC_ALPHA,i.ZERO,i.ONE);break;default:et("WebGLState: Invalid blending: ",T);break}else switch(T){case ki:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE_MINUS_SRC_ALPHA,i.ONE,i.ONE_MINUS_SRC_ALPHA);break;case Or:i.blendFuncSeparate(i.SRC_ALPHA,i.ONE,i.ONE,i.ONE);break;case oo:et("WebGLState: SubtractiveBlending requires material.premultipliedAlpha = true");break;case lo:et("WebGLState: MultiplyBlending requires material.premultipliedAlpha = true");break;default:et("WebGLState: Invalid blending: ",T);break}w=null,b=null,A=null,g=null,y.set(0,0,0),z=0,p=T,D=Le}return}oe=oe||k,ue=ue||V,Re=Re||he,(k!==M||oe!==R)&&(i.blendEquationSeparate(Qe[k],Qe[oe]),M=k,R=oe),(V!==w||he!==b||ue!==A||Re!==g)&&(i.blendFuncSeparate(We[V],We[he],We[ue],We[Re]),w=V,b=he,A=ue,g=Re),(ke.equals(y)===!1||se!==z)&&(i.blendColor(ke.r,ke.g,ke.b,se),y.copy(ke),z=se),p=T,D=!1}function ot(T,k){T.side===Zt?Oe(i.CULL_FACE):me(i.CULL_FACE);let V=T.side===Wt;k&&(V=!V),St(V),T.blending===ki&&T.transparent===!1?gt(Si):gt(T.blending,T.blendEquation,T.blendSrc,T.blendDst,T.blendEquationAlpha,T.blendSrcAlpha,T.blendDstAlpha,T.blendColor,T.blendAlpha,T.premultipliedAlpha),a.setFunc(T.depthFunc),a.setTest(T.depthTest),a.setMask(T.depthWrite),s.setMask(T.colorWrite);const he=T.stencilWrite;o.setTest(he),he&&(o.setMask(T.stencilWriteMask),o.setFunc(T.stencilFunc,T.stencilRef,T.stencilFuncMask),o.setOp(T.stencilFail,T.stencilZFail,T.stencilZPass)),te(T.polygonOffset,T.polygonOffsetFactor,T.polygonOffsetUnits),T.alphaToCoverage===!0?me(i.SAMPLE_ALPHA_TO_COVERAGE):Oe(i.SAMPLE_ALPHA_TO_COVERAGE)}function St(T){U!==T&&(T?i.frontFace(i.CW):i.frontFace(i.CCW),U=T)}function lt(T){T!==Rc?(me(i.CULL_FACE),T!==G&&(T===ao?i.cullFace(i.BACK):T===Cc?i.cullFace(i.FRONT):i.cullFace(i.FRONT_AND_BACK))):Oe(i.CULL_FACE),G=T}function I(T){T!==K&&(X&&i.lineWidth(T),K=T)}function te(T,k,V){T?(me(i.POLYGON_OFFSET_FILL),(P!==k||Y!==V)&&(P=k,Y=V,a.getReversed()&&(k=-k,V=-V),i.polygonOffset(k,V))):Oe(i.POLYGON_OFFSET_FILL)}function Me(T){T?me(i.SCISSOR_TEST):Oe(i.SCISSOR_TEST)}function Te(T){T===void 0&&(T=i.TEXTURE0+Z-1),j!==T&&(i.activeTexture(T),j=T)}function ct(T,k,V){V===void 0&&(j===null?V=i.TEXTURE0+Z-1:V=j);let he=ee[V];he===void 0&&(he={type:void 0,texture:void 0},ee[V]=he),(he.type!==T||he.texture!==k)&&(j!==V&&(i.activeTexture(V),j=V),i.bindTexture(T,k||Pe[T]),he.type=T,he.texture=k)}function L(){const T=ee[j];T!==void 0&&T.type!==void 0&&(i.bindTexture(T.type,null),T.type=void 0,T.texture=void 0)}function _t(){try{i.compressedTexImage2D(...arguments)}catch(T){et("WebGLState:",T)}}function nt(){try{i.compressedTexImage3D(...arguments)}catch(T){et("WebGLState:",T)}}function ze(){try{i.texSubImage2D(...arguments)}catch(T){et("WebGLState:",T)}}function ae(){try{i.texSubImage3D(...arguments)}catch(T){et("WebGLState:",T)}}function st(){try{i.compressedTexSubImage2D(...arguments)}catch(T){et("WebGLState:",T)}}function we(){try{i.compressedTexSubImage3D(...arguments)}catch(T){et("WebGLState:",T)}}function Ie(){try{i.texStorage2D(...arguments)}catch(T){et("WebGLState:",T)}}function E(){try{i.texStorage3D(...arguments)}catch(T){et("WebGLState:",T)}}function x(){try{i.texImage2D(...arguments)}catch(T){et("WebGLState:",T)}}function F(){try{i.texImage3D(...arguments)}catch(T){et("WebGLState:",T)}}function re(T){return f[T]!==void 0?f[T]:i.getParameter(T)}function Q(T,k){f[T]!==k&&(i.pixelStorei(T,k),f[T]=k)}function le(T){J.equals(T)===!1&&(i.scissor(T.x,T.y,T.z,T.w),J.copy(T))}function ce(T){pe.equals(T)===!1&&(i.viewport(T.x,T.y,T.z,T.w),pe.copy(T))}function $(T,k){let V=l.get(k);V===void 0&&(V=new WeakMap,l.set(k,V));let he=V.get(T);he===void 0&&(he=i.getUniformBlockIndex(k,T.name),i.uniformBlockBinding(k,he,he),V.set(T,he))}function N(T,k,V){const oe=l.get(k).get(T);c[oe]!==V&&(i.bindBufferBase(i.UNIFORM_BUFFER,oe,V),c[oe]=V)}function ne(){i.disable(i.BLEND),i.disable(i.CULL_FACE),i.disable(i.DEPTH_TEST),i.disable(i.POLYGON_OFFSET_FILL),i.disable(i.SCISSOR_TEST),i.disable(i.STENCIL_TEST),i.disable(i.SAMPLE_ALPHA_TO_COVERAGE),i.blendEquation(i.FUNC_ADD),i.blendFunc(i.ONE,i.ZERO),i.blendFuncSeparate(i.ONE,i.ZERO,i.ONE,i.ZERO),i.blendColor(0,0,0,0),i.colorMask(!0,!0,!0,!0),i.clearColor(0,0,0,0),i.depthMask(!0),i.depthFunc(i.LESS),a.setReversed(!1),i.clearDepth(1),i.stencilMask(4294967295),i.stencilFunc(i.ALWAYS,0,4294967295),i.stencilOp(i.KEEP,i.KEEP,i.KEEP),i.clearStencil(0),i.cullFace(i.BACK),i.frontFace(i.CCW),i.polygonOffset(0,0),i.activeTexture(i.TEXTURE0),i.bindFramebuffer(i.FRAMEBUFFER,null),i.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),i.bindFramebuffer(i.READ_FRAMEBUFFER,null),i.useProgram(null),i.lineWidth(1),i.scissor(0,0,i.canvas.width,i.canvas.height),i.viewport(0,0,i.canvas.width,i.canvas.height),i.pixelStorei(i.PACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_ALIGNMENT,4),i.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,!1),i.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,!1),i.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,i.BROWSER_DEFAULT_WEBGL),i.pixelStorei(i.PACK_ROW_LENGTH,0),i.pixelStorei(i.PACK_SKIP_PIXELS,0),i.pixelStorei(i.PACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_ROW_LENGTH,0),i.pixelStorei(i.UNPACK_IMAGE_HEIGHT,0),i.pixelStorei(i.UNPACK_SKIP_PIXELS,0),i.pixelStorei(i.UNPACK_SKIP_ROWS,0),i.pixelStorei(i.UNPACK_SKIP_IMAGES,0),u={},f={},j=null,ee={},d={},c={},h=new WeakMap,_=[],S=null,m=!1,p=null,M=null,w=null,b=null,R=null,A=null,g=null,y=new tt(0,0,0),z=0,D=!1,U=null,G=null,K=null,P=null,Y=null,J.set(0,0,i.canvas.width,i.canvas.height),pe.set(0,0,i.canvas.width,i.canvas.height),s.reset(),a.reset(),o.reset()}return{buffers:{color:s,depth:a,stencil:o},enable:me,disable:Oe,bindFramebuffer:ht,drawBuffers:De,useProgram:Je,setBlending:gt,setMaterial:ot,setFlipSided:St,setCullFace:lt,setLineWidth:I,setPolygonOffset:te,setScissorTest:Me,activeTexture:Te,bindTexture:ct,unbindTexture:L,compressedTexImage2D:_t,compressedTexImage3D:nt,texImage2D:x,texImage3D:F,pixelStorei:Q,getParameter:re,updateUBOMapping:$,uniformBlockBinding:N,texStorage2D:Ie,texStorage3D:E,texSubImage2D:ze,texSubImage3D:ae,compressedTexSubImage2D:st,compressedTexSubImage3D:we,scissor:le,viewport:ce,reset:ne}}function Lm(i,e,t,n,r,s,a){const o=e.has("WEBGL_multisampled_render_to_texture")?e.get("WEBGL_multisampled_render_to_texture"):null,c=typeof navigator>"u"?!1:/OculusBrowser/g.test(navigator.userAgent),l=new Ze,u=new WeakMap,f=new Set;let d;const h=new WeakMap,_=new Set,S=new FinalizationRegistry(E=>_.delete(E));let m=!1;try{m=typeof OffscreenCanvas<"u"&&new OffscreenCanvas(1,1).getContext("2d")!==null}catch{}function p(E,x){return m?new OffscreenCanvas(E,x):Vr("canvas")}function M(E,x,F){let re=1;const Q=Ie(E);if((Q.width>F||Q.height>F)&&(re=F/Math.max(Q.width,Q.height)),re<1)if(typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement||typeof HTMLCanvasElement<"u"&&E instanceof HTMLCanvasElement||typeof ImageBitmap<"u"&&E instanceof ImageBitmap||typeof VideoFrame<"u"&&E instanceof VideoFrame){const le=Math.floor(re*Q.width),ce=Math.floor(re*Q.height);d===void 0&&(d=p(le,ce));const $=x?p(le,ce):d;return $.width=le,$.height=ce,$.getContext("2d").drawImage(E,0,0,le,ce),Ue("WebGLRenderer: Texture has been resized from ("+Q.width+"x"+Q.height+") to ("+le+"x"+ce+")."),$}else return"data"in E&&Ue("WebGLRenderer: Image in DataTexture is too big ("+Q.width+"x"+Q.height+")."),E;return E}function w(E){return E.generateMipmaps}function b(E){i.generateMipmap(E)}function R(E){return E.isWebGLCubeRenderTarget?i.TEXTURE_CUBE_MAP:E.isWebGL3DRenderTarget?i.TEXTURE_3D:E.isWebGLArrayRenderTarget||E.isCompressedArrayTexture?i.TEXTURE_2D_ARRAY:i.TEXTURE_2D}function A(E,x,F,re,Q,le=!1){if(E!==null){if(i[E]!==void 0)return i[E];Ue("WebGLRenderer: Attempt to use non-existing WebGL internal format '"+E+"'")}let ce;re&&(ce=e.get("EXT_texture_norm16"),ce||Ue("WebGLRenderer: Unable to use normalized textures without EXT_texture_norm16 extension"));let $=x;if(x===i.RED&&(F===i.FLOAT&&($=i.R32F),F===i.HALF_FLOAT&&($=i.R16F),F===i.UNSIGNED_BYTE&&($=i.R8),F===i.UNSIGNED_SHORT&&ce&&($=ce.R16_EXT),F===i.SHORT&&ce&&($=ce.R16_SNORM_EXT)),x===i.RED_INTEGER&&(F===i.UNSIGNED_BYTE&&($=i.R8UI),F===i.UNSIGNED_SHORT&&($=i.R16UI),F===i.UNSIGNED_INT&&($=i.R32UI),F===i.BYTE&&($=i.R8I),F===i.SHORT&&($=i.R16I),F===i.INT&&($=i.R32I)),x===i.RG&&(F===i.FLOAT&&($=i.RG32F),F===i.HALF_FLOAT&&($=i.RG16F),F===i.UNSIGNED_BYTE&&($=i.RG8),F===i.UNSIGNED_SHORT&&ce&&($=ce.RG16_EXT),F===i.SHORT&&ce&&($=ce.RG16_SNORM_EXT)),x===i.RG_INTEGER&&(F===i.UNSIGNED_BYTE&&($=i.RG8UI),F===i.UNSIGNED_SHORT&&($=i.RG16UI),F===i.UNSIGNED_INT&&($=i.RG32UI),F===i.BYTE&&($=i.RG8I),F===i.SHORT&&($=i.RG16I),F===i.INT&&($=i.RG32I)),x===i.RGB_INTEGER&&(F===i.UNSIGNED_BYTE&&($=i.RGB8UI),F===i.UNSIGNED_SHORT&&($=i.RGB16UI),F===i.UNSIGNED_INT&&($=i.RGB32UI),F===i.BYTE&&($=i.RGB8I),F===i.SHORT&&($=i.RGB16I),F===i.INT&&($=i.RGB32I)),x===i.RGBA_INTEGER&&(F===i.UNSIGNED_BYTE&&($=i.RGBA8UI),F===i.UNSIGNED_SHORT&&($=i.RGBA16UI),F===i.UNSIGNED_INT&&($=i.RGBA32UI),F===i.BYTE&&($=i.RGBA8I),F===i.SHORT&&($=i.RGBA16I),F===i.INT&&($=i.RGBA32I)),x===i.RGB&&(F===i.UNSIGNED_SHORT&&ce&&($=ce.RGB16_EXT),F===i.SHORT&&ce&&($=ce.RGB16_SNORM_EXT),F===i.UNSIGNED_INT_5_9_9_9_REV&&($=i.RGB9_E5),F===i.UNSIGNED_INT_10F_11F_11F_REV&&($=i.R11F_G11F_B10F)),x===i.RGBA){const N=le?Hr:Ye.getTransfer(Q);F===i.FLOAT&&($=i.RGBA32F),F===i.HALF_FLOAT&&($=i.RGBA16F),F===i.UNSIGNED_BYTE&&($=N===rt?i.SRGB8_ALPHA8:i.RGBA8),F===i.UNSIGNED_SHORT&&ce&&($=ce.RGBA16_EXT),F===i.SHORT&&ce&&($=ce.RGBA16_SNORM_EXT),F===i.UNSIGNED_SHORT_4_4_4_4&&($=i.RGBA4),F===i.UNSIGNED_SHORT_5_5_5_1&&($=i.RGB5_A1)}return($===i.R16F||$===i.R32F||$===i.RG16F||$===i.RG32F||$===i.RGBA16F||$===i.RGBA32F)&&e.get("EXT_color_buffer_float"),$}function g(E,x){let F;return E?x===null||x===mn||x===yi?F=i.DEPTH24_STENCIL8:x===dn?F=i.DEPTH32F_STENCIL8:x===qi&&(F=i.DEPTH24_STENCIL8,Ue("DepthTexture: 16 bit depth attachment is not supported with stencil. Using 24-bit attachment.")):x===null||x===mn||x===yi?F=i.DEPTH_COMPONENT24:x===dn?F=i.DEPTH_COMPONENT32F:x===qi&&(F=i.DEPTH_COMPONENT16),F}function y(E,x){return w(E)===!0||E.isFramebufferTexture&&E.minFilter!==Rt&&E.minFilter!==Vt?Math.log2(Math.max(x.width,x.height))+1:E.mipmaps.length>0?E.mipmaps.length:E.isCompressedTexture&&Array.isArray(E.image)?x.mipmaps.length:1}function z(E){const x=new WeakRef(E);n.get(E).__ref=x,_.add(x),S.register(E,x,x)}function D(E){const x=n.get(E).__ref;x!==void 0&&(_.delete(x),S.unregister(x))}function U(E){K(E.target)}function G(E){P(E.target)}function K(E){E.removeEventListener("dispose",U),D(E),Z(E),E.isVideoTexture&&u.delete(E),E.isHTMLTexture&&f.delete(E)}function P(E){E.removeEventListener("dispose",G),D(E),ie(E)}function Y(){for(const E of _){const x=E.deref();x!==void 0&&(x.isRenderTarget===!0?P(x):K(x))}_.clear(),f.clear()}function Z(E){const x=n.get(E);if(x.__webglInit===void 0)return;const F=E.source,re=h.get(F);if(re){const Q=re[x.__cacheKey];Q.usedTimes--,Q.usedTimes===0&&X(E),Object.keys(re).length===0&&h.delete(F)}n.remove(E)}function X(E){const x=n.get(E);i.deleteTexture(x.__webglTexture);const F=E.source,re=h.get(F);delete re[x.__cacheKey],a.memory.textures--}function ie(E){const x=n.get(E);x.__depthDisposeCallback&&x.__depthDisposeCallback();const F=E.depthTexture;if(F&&F.renderTarget===E&&K(F),E.isWebGLCubeRenderTarget)for(let Q=0;Q<6;Q++){if(Array.isArray(x.__webglFramebuffer[Q]))for(let le=0;le<x.__webglFramebuffer[Q].length;le++)i.deleteFramebuffer(x.__webglFramebuffer[Q][le]);else i.deleteFramebuffer(x.__webglFramebuffer[Q]);x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer[Q])}else{if(Array.isArray(x.__webglFramebuffer))for(let Q=0;Q<x.__webglFramebuffer.length;Q++)i.deleteFramebuffer(x.__webglFramebuffer[Q]);else i.deleteFramebuffer(x.__webglFramebuffer);if(x.__webglDepthbuffer&&i.deleteRenderbuffer(x.__webglDepthbuffer),x.__webglMultisampledFramebuffer&&i.deleteFramebuffer(x.__webglMultisampledFramebuffer),x.__webglColorRenderbuffer)for(let Q=0;Q<x.__webglColorRenderbuffer.length;Q++)x.__webglColorRenderbuffer[Q]&&i.deleteRenderbuffer(x.__webglColorRenderbuffer[Q]);x.__webglDepthRenderbuffer&&i.deleteRenderbuffer(x.__webglDepthRenderbuffer)}const re=E.textures;for(let Q=0,le=re.length;Q<le;Q++){const ce=n.get(re[Q]);ce.__webglTexture&&(i.deleteTexture(ce.__webglTexture),a.memory.textures--),n.remove(re[Q])}n.remove(E)}let q=0;function j(){q=0}function ee(){return q}function Se(E){q=E}function Fe(){const E=q;return E>=r.maxTextures&&Ue("WebGLTextures: Trying to use "+(E+1)+" texture units while this GPU supports only "+r.maxTextures),q+=1,E}function J(E){const x=[];return x.push(E.wrapS),x.push(E.wrapT),x.push(E.wrapR||0),x.push(E.magFilter),x.push(E.minFilter),x.push(E.anisotropy),x.push(E.internalFormat),x.push(E.format),x.push(E.type),x.push(E.generateMipmaps),x.push(E.mipmapsAutoUpdate),x.push(E.premultiplyAlpha),x.push(E.flipY),x.push(E.unpackAlignment),x.push(E.colorSpace),x.join()}function pe(E,x){const F=n.get(E);if(E.isVideoTexture&&st(E),E.isRenderTargetTexture===!1&&E.isExternalTexture!==!0&&E.version>0&&F.__version!==E.version){const re=E.image;if(re===null)Ue("WebGLRenderer: Texture marked for update but no image data found.");else if(re.complete===!1)Ue("WebGLRenderer: Texture marked for update but image is incomplete");else{ot(F,E,x);return}}else E.isExternalTexture&&(F.__webglTexture=E.sourceTexture?E.sourceTexture:null);t.bindTexture(i.TEXTURE_2D,F.__webglTexture,i.TEXTURE0+x)}function ve(E,x){const F=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&F.__version!==E.version){ot(F,E,x);return}else E.isExternalTexture&&(F.__webglTexture=E.sourceTexture?E.sourceTexture:null);t.bindTexture(i.TEXTURE_2D_ARRAY,F.__webglTexture,i.TEXTURE0+x)}function Pe(E,x){const F=n.get(E);if(E.isRenderTargetTexture===!1&&E.version>0&&F.__version!==E.version){ot(F,E,x);return}t.bindTexture(i.TEXTURE_3D,F.__webglTexture,i.TEXTURE0+x)}function me(E,x){const F=n.get(E);if(E.version>0&&F.__version!==E.version){St(F,E,x);return}t.bindTexture(i.TEXTURE_CUBE_MAP,F.__webglTexture,i.TEXTURE0+x)}const Oe={[Xs]:i.REPEAT,[An]:i.CLAMP_TO_EDGE,[qs]:i.MIRRORED_REPEAT},ht={[Rt]:i.NEAREST,[Jc]:i.NEAREST_MIPMAP_NEAREST,[sr]:i.NEAREST_MIPMAP_LINEAR,[Vt]:i.LINEAR,[ls]:i.LINEAR_MIPMAP_NEAREST,[Hn]:i.LINEAR_MIPMAP_LINEAR},De={[tu]:i.NEVER,[Tl]:i.ALWAYS,[nu]:i.LESS,[yl]:i.LEQUAL,[iu]:i.EQUAL,[bl]:i.GEQUAL,[ru]:i.GREATER,[su]:i.NOTEQUAL};function Je(E,x){if(x.type===dn&&e.has("OES_texture_float_linear")===!1&&(x.magFilter===Vt||x.magFilter===ls||x.magFilter===sr||x.magFilter===Hn||x.minFilter===Vt||x.minFilter===ls||x.minFilter===sr||x.minFilter===Hn)&&Ue("WebGLRenderer: Unable to use linear filtering with floating point textures. OES_texture_float_linear not supported on this device."),i.texParameteri(E,i.TEXTURE_WRAP_S,Oe[x.wrapS]),i.texParameteri(E,i.TEXTURE_WRAP_T,Oe[x.wrapT]),(E===i.TEXTURE_3D||E===i.TEXTURE_2D_ARRAY)&&i.texParameteri(E,i.TEXTURE_WRAP_R,Oe[x.wrapR]),i.texParameteri(E,i.TEXTURE_MAG_FILTER,ht[x.magFilter]),i.texParameteri(E,i.TEXTURE_MIN_FILTER,ht[x.minFilter]),x.compareFunction&&(i.texParameteri(E,i.TEXTURE_COMPARE_MODE,i.COMPARE_REF_TO_TEXTURE),i.texParameteri(E,i.TEXTURE_COMPARE_FUNC,De[x.compareFunction])),e.has("EXT_texture_filter_anisotropic")===!0){if(x.magFilter===Rt||x.minFilter!==sr&&x.minFilter!==Hn||x.type===dn&&e.has("OES_texture_float_linear")===!1)return;if(x.anisotropy>1||n.get(x).__currentAnisotropy){const F=e.get("EXT_texture_filter_anisotropic");i.texParameterf(E,F.TEXTURE_MAX_ANISOTROPY_EXT,Math.min(x.anisotropy,r.getMaxAnisotropy())),n.get(x).__currentAnisotropy=x.anisotropy}}}function Qe(E,x){let F=!1;E.__webglInit===void 0&&(E.__webglInit=!0,x.addEventListener("dispose",U),z(x));const re=x.source;let Q=h.get(re);Q===void 0&&(Q={},h.set(re,Q));const le=J(x);if(le!==E.__cacheKey){Q[le]===void 0&&(Q[le]={texture:i.createTexture(),usedTimes:0},a.memory.textures++,F=!0),Q[le].usedTimes++;const ce=Q[E.__cacheKey];ce!==void 0&&(Q[E.__cacheKey].usedTimes--,ce.usedTimes===0&&X(x)),E.__cacheKey=le,E.__webglTexture=Q[le].texture}return F}function We(E,x,F){return Math.floor(Math.floor(E/F)/x)}function gt(E,x,F,re){const le=E.updateRanges;if(le.length===0)t.texSubImage2D(i.TEXTURE_2D,0,0,0,x.width,x.height,F,re,x.data);else{le.sort((T,k)=>T.start-k.start);let ce=0;for(let T=1;T<le.length;T++){const k=le[ce],V=le[T],he=k.start+k.count,oe=We(V.start,x.width,4),ue=We(k.start,x.width,4);V.start<=he+1&&oe===ue&&We(V.start+V.count-1,x.width,4)===oe?k.count=Math.max(k.count,V.start+V.count-k.start):(++ce,le[ce]=V)}le.length=ce+1;const $=t.getParameter(i.UNPACK_ROW_LENGTH),N=t.getParameter(i.UNPACK_SKIP_PIXELS),ne=t.getParameter(i.UNPACK_SKIP_ROWS);t.pixelStorei(i.UNPACK_ROW_LENGTH,x.width);for(let T=0,k=le.length;T<k;T++){const V=le[T],he=Math.floor(V.start/4),oe=Math.ceil(V.count/4),ue=he%x.width,Re=Math.floor(he/x.width),ke=oe,se=1;t.pixelStorei(i.UNPACK_SKIP_PIXELS,ue),t.pixelStorei(i.UNPACK_SKIP_ROWS,Re),t.texSubImage2D(i.TEXTURE_2D,0,ue,Re,ke,se,F,re,x.data)}E.clearUpdateRanges(),t.pixelStorei(i.UNPACK_ROW_LENGTH,$),t.pixelStorei(i.UNPACK_SKIP_PIXELS,N),t.pixelStorei(i.UNPACK_SKIP_ROWS,ne)}}function ot(E,x,F){let re=i.TEXTURE_2D;(x.isDataArrayTexture||x.isCompressedArrayTexture)&&(re=i.TEXTURE_2D_ARRAY),x.isData3DTexture&&(re=i.TEXTURE_3D);const Q=Qe(E,x),le=x.source;t.bindTexture(re,E.__webglTexture,i.TEXTURE0+F);const ce=n.get(le);if(le.version!==ce.__version||Q===!0){if(t.activeTexture(i.TEXTURE0+F),(typeof ImageBitmap<"u"&&x.image instanceof ImageBitmap)===!1){const se=Ye.getPrimaries(Ye.workingColorSpace),Le=x.colorSpace===zn?null:Ye.getPrimaries(x.colorSpace),He=x.colorSpace===zn||se===Le?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,He)}t.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment);let N=M(x.image,!1,r.maxTextureSize);N=we(x,N);const ne=s.convert(x.format,x.colorSpace),T=s.convert(x.type);let k=A(x.internalFormat,ne,T,x.normalized,x.colorSpace,x.isVideoTexture);Je(re,x);let V;const he=x.mipmaps,oe=x.isVideoTexture!==!0,ue=ce.__version===void 0||Q===!0,Re=le.dataReady,ke=y(x,N);if(x.isDepthTexture)k=g(x.format===kn,x.type),ue&&(oe?t.texStorage2D(i.TEXTURE_2D,1,k,N.width,N.height):t.texImage2D(i.TEXTURE_2D,0,k,N.width,N.height,0,ne,T,null));else if(x.isDataTexture)if(he.length>0){oe&&ue&&t.texStorage2D(i.TEXTURE_2D,ke,k,he[0].width,he[0].height);for(let se=0,Le=he.length;se<Le;se++)V=he[se],oe?Re&&t.texSubImage2D(i.TEXTURE_2D,se,0,0,V.width,V.height,ne,T,V.data):t.texImage2D(i.TEXTURE_2D,se,k,V.width,V.height,0,ne,T,V.data);x.generateMipmaps=!1}else oe?(ue&&t.texStorage2D(i.TEXTURE_2D,ke,k,N.width,N.height),Re&&gt(x,N,ne,T)):t.texImage2D(i.TEXTURE_2D,0,k,N.width,N.height,0,ne,T,N.data);else if(x.isCompressedTexture)if(x.isCompressedArrayTexture){oe&&ue&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ke,k,he[0].width,he[0].height,N.depth);for(let se=0,Le=he.length;se<Le;se++)if(V=he[se],x.format!==fn)if(ne!==null)if(oe){if(Re)if(x.layerUpdates.size>0){const He=No(V.width,V.height,x.format,x.type);for(const ge of x.layerUpdates){const it=V.data.subarray(ge*He/V.data.BYTES_PER_ELEMENT,(ge+1)*He/V.data.BYTES_PER_ELEMENT);t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,se,0,0,ge,V.width,V.height,1,ne,it)}}else t.compressedTexSubImage3D(i.TEXTURE_2D_ARRAY,se,0,0,0,V.width,V.height,N.depth,ne,V.data)}else t.compressedTexImage3D(i.TEXTURE_2D_ARRAY,se,k,V.width,V.height,N.depth,0,V.data,0,0);else Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()");else oe?Re&&t.texSubImage3D(i.TEXTURE_2D_ARRAY,se,0,0,0,V.width,V.height,N.depth,ne,T,V.data):t.texImage3D(i.TEXTURE_2D_ARRAY,se,k,V.width,V.height,N.depth,0,ne,T,V.data);x.layerUpdates.size>0&&x.clearLayerUpdates()}else{oe&&ue&&t.texStorage2D(i.TEXTURE_2D,ke,k,he[0].width,he[0].height);for(let se=0,Le=he.length;se<Le;se++)V=he[se],x.format!==fn?ne!==null?oe?Re&&t.compressedTexSubImage2D(i.TEXTURE_2D,se,0,0,V.width,V.height,ne,V.data):t.compressedTexImage2D(i.TEXTURE_2D,se,k,V.width,V.height,0,V.data):Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .uploadTexture()"):oe?Re&&t.texSubImage2D(i.TEXTURE_2D,se,0,0,V.width,V.height,ne,T,V.data):t.texImage2D(i.TEXTURE_2D,se,k,V.width,V.height,0,ne,T,V.data)}else if(x.isDataArrayTexture)if(oe){if(ue&&t.texStorage3D(i.TEXTURE_2D_ARRAY,ke,k,N.width,N.height,N.depth),Re)if(x.layerUpdates.size>0){const se=No(N.width,N.height,x.format,x.type);for(const Le of x.layerUpdates){const He=N.data.subarray(Le*se/N.data.BYTES_PER_ELEMENT,(Le+1)*se/N.data.BYTES_PER_ELEMENT);t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,Le,N.width,N.height,1,ne,T,He)}x.clearLayerUpdates()}else t.texSubImage3D(i.TEXTURE_2D_ARRAY,0,0,0,0,N.width,N.height,N.depth,ne,T,N.data)}else t.texImage3D(i.TEXTURE_2D_ARRAY,0,k,N.width,N.height,N.depth,0,ne,T,N.data);else if(x.isData3DTexture)oe?(ue&&t.texStorage3D(i.TEXTURE_3D,ke,k,N.width,N.height,N.depth),Re&&t.texSubImage3D(i.TEXTURE_3D,0,0,0,0,N.width,N.height,N.depth,ne,T,N.data)):t.texImage3D(i.TEXTURE_3D,0,k,N.width,N.height,N.depth,0,ne,T,N.data);else if(x.isFramebufferTexture){if(ue)if(oe)t.texStorage2D(i.TEXTURE_2D,ke,k,N.width,N.height);else{let se=N.width,Le=N.height;for(let He=0;He<ke;He++)t.texImage2D(i.TEXTURE_2D,He,k,se,Le,0,ne,T,null),se>>=1,Le>>=1}}else if(x.isHTMLTexture){if("texElementImage2D"in i){const se=i.canvas;if(se.hasAttribute("layoutsubtree")||se.setAttribute("layoutsubtree","true"),N.parentNode!==se){se.appendChild(N),f.add(x),se.onpaint=Le=>{const He=Le.changedElements;for(const ge of f)He.includes(ge.image)&&(ge.needsUpdate=!0)},se.requestPaint();return}if(i.texElementImage2D.length===3)i.texElementImage2D(i.TEXTURE_2D,i.RGBA8,N);else{const He=i.RGBA,ge=i.RGBA,it=i.UNSIGNED_BYTE;i.texElementImage2D(i.TEXTURE_2D,0,He,ge,it,N)}i.texParameteri(i.TEXTURE_2D,i.TEXTURE_MIN_FILTER,i.LINEAR),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_S,i.CLAMP_TO_EDGE),i.texParameteri(i.TEXTURE_2D,i.TEXTURE_WRAP_T,i.CLAMP_TO_EDGE)}}else if(he.length>0){if(oe&&ue){const se=Ie(he[0]);t.texStorage2D(i.TEXTURE_2D,ke,k,se.width,se.height)}for(let se=0,Le=he.length;se<Le;se++)V=he[se],oe?Re&&t.texSubImage2D(i.TEXTURE_2D,se,0,0,ne,T,V):t.texImage2D(i.TEXTURE_2D,se,k,ne,T,V);x.generateMipmaps=!1}else if(oe){if(ue){const se=Ie(N);t.texStorage2D(i.TEXTURE_2D,ke,k,se.width,se.height)}Re&&t.texSubImage2D(i.TEXTURE_2D,0,0,0,ne,T,N)}else t.texImage2D(i.TEXTURE_2D,0,k,ne,T,N);w(x)&&x.mipmapsAutoUpdate===!0&&b(re),ce.__version=le.version,x.onUpdate&&x.onUpdate(x)}E.__version=x.version}function St(E,x,F){if(x.image.length!==6)return;const re=Qe(E,x),Q=x.source;t.bindTexture(i.TEXTURE_CUBE_MAP,E.__webglTexture,i.TEXTURE0+F);const le=n.get(Q);if(Q.version!==le.__version||re===!0){t.activeTexture(i.TEXTURE0+F);const ce=Ye.getPrimaries(Ye.workingColorSpace),$=x.colorSpace===zn?null:Ye.getPrimaries(x.colorSpace),N=x.colorSpace===zn||ce===$?i.NONE:i.BROWSER_DEFAULT_WEBGL;t.pixelStorei(i.UNPACK_FLIP_Y_WEBGL,x.flipY),t.pixelStorei(i.UNPACK_PREMULTIPLY_ALPHA_WEBGL,x.premultiplyAlpha),t.pixelStorei(i.UNPACK_ALIGNMENT,x.unpackAlignment),t.pixelStorei(i.UNPACK_COLORSPACE_CONVERSION_WEBGL,N);const ne=x.isCompressedTexture||x.image[0].isCompressedTexture,T=x.image[0]&&x.image[0].isDataTexture,k=[];for(let ge=0;ge<6;ge++)!ne&&!T?k[ge]=M(x.image[ge],!0,r.maxCubemapSize):k[ge]=T?x.image[ge].image:x.image[ge],k[ge]=we(x,k[ge]);const V=k[0],he=s.convert(x.format,x.colorSpace),oe=s.convert(x.type);let ue=A(x.internalFormat,he,oe,x.normalized,x.colorSpace);const Re=x.isVideoTexture!==!0,ke=le.__version===void 0||re===!0,se=Q.dataReady;let Le=y(x,V);Je(i.TEXTURE_CUBE_MAP,x);let He;if(x.isDepthTexture){if(ue=g(x.format===kn,x.type),ke)if(Re)t.texStorage2D(i.TEXTURE_CUBE_MAP,1,ue,V.width,V.height);else for(let ge=0;ge<6;ge++)t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,ue,V.width,V.height,0,he,oe,null)}else if(ne){Re&&ke&&t.texStorage2D(i.TEXTURE_CUBE_MAP,Le,ue,V.width,V.height);for(let ge=0;ge<6;ge++){He=k[ge].mipmaps;for(let it=0;it<He.length;it++){const yt=He[it];x.format!==fn?he!==null?Re?se&&t.compressedTexSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it,0,0,yt.width,yt.height,he,yt.data):t.compressedTexImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it,ue,yt.width,yt.height,0,yt.data):Ue("WebGLRenderer: Attempt to load unsupported compressed texture format in .setTextureCube()"):Re?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it,0,0,yt.width,yt.height,he,oe,yt.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it,ue,yt.width,yt.height,0,he,oe,yt.data)}}}else{if(He=x.mipmaps,Re&&ke){He.length>0&&Le++;const ge=Ie(k[0]);t.texStorage2D(i.TEXTURE_CUBE_MAP,Le,ue,ge.width,ge.height)}for(let ge=0;ge<6;ge++)if(T){Re?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,0,0,k[ge].width,k[ge].height,he,oe,k[ge].data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,ue,k[ge].width,k[ge].height,0,he,oe,k[ge].data);for(let it=0;it<He.length;it++){const Cn=He[it].image[ge].image;Re?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it+1,0,0,Cn.width,Cn.height,he,oe,Cn.data):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it+1,ue,Cn.width,Cn.height,0,he,oe,Cn.data)}}else{Re?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,0,0,he,oe,k[ge]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,0,ue,he,oe,k[ge]);for(let it=0;it<He.length;it++){const yt=He[it];Re?se&&t.texSubImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it+1,0,0,he,oe,yt.image[ge]):t.texImage2D(i.TEXTURE_CUBE_MAP_POSITIVE_X+ge,it+1,ue,he,oe,yt.image[ge])}}}w(x)&&x.mipmapsAutoUpdate===!0&&b(i.TEXTURE_CUBE_MAP),le.__version=Q.version,x.onUpdate&&x.onUpdate(x)}E.__version=x.version}function lt(E,x,F,re,Q,le){const ce=s.convert(F.format,F.colorSpace),$=s.convert(F.type),N=A(F.internalFormat,ce,$,F.normalized,F.colorSpace),ne=n.get(x),T=n.get(F);if(T.__renderTarget=x,!ne.__hasExternalTextures){const k=Math.max(1,x.width>>le),V=Math.max(1,x.height>>le);Q===i.TEXTURE_3D||Q===i.TEXTURE_2D_ARRAY?t.texImage3D(Q,le,N,k,V,x.depth,0,ce,$,null):t.texImage2D(Q,le,N,k,V,0,ce,$,null)}t.bindFramebuffer(i.FRAMEBUFFER,E),ae(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,re,Q,T.__webglTexture,0,ze(x)):(Q===i.TEXTURE_2D||Q>=i.TEXTURE_CUBE_MAP_POSITIVE_X&&Q<=i.TEXTURE_CUBE_MAP_NEGATIVE_Z)&&i.framebufferTexture2D(i.FRAMEBUFFER,re,Q,T.__webglTexture,le),t.bindFramebuffer(i.FRAMEBUFFER,null)}function I(E,x,F){if(i.bindRenderbuffer(i.RENDERBUFFER,E),x.depthBuffer){const re=x.depthTexture,Q=re&&re.isDepthTexture?re.type:null,le=g(x.stencilBuffer,Q),ce=x.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;ae(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ze(x),le,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,ze(x),le,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,le,x.width,x.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,ce,i.RENDERBUFFER,E)}else{const re=x.textures;for(let Q=0;Q<re.length;Q++){const le=re[Q],ce=s.convert(le.format,le.colorSpace),$=s.convert(le.type),N=A(le.internalFormat,ce,$,le.normalized,le.colorSpace);ae(x)?o.renderbufferStorageMultisampleEXT(i.RENDERBUFFER,ze(x),N,x.width,x.height):F?i.renderbufferStorageMultisample(i.RENDERBUFFER,ze(x),N,x.width,x.height):i.renderbufferStorage(i.RENDERBUFFER,N,x.width,x.height)}}i.bindRenderbuffer(i.RENDERBUFFER,null)}function te(E,x,F){const re=x.isWebGLCubeRenderTarget===!0;if(t.bindFramebuffer(i.FRAMEBUFFER,E),!(x.depthTexture&&x.depthTexture.isDepthTexture))throw new Error("THREE.WebGLTextures: renderTarget.depthTexture must be an instance of THREE.DepthTexture.");const Q=n.get(x.depthTexture);Q.__renderTarget=x;const le=re?x.depthTexture.image[0]:x.depthTexture.image;(!Q.__webglTexture||le.width!==x.width||le.height!==x.height)&&(le.width=x.width,le.height=x.height,x.depthTexture.needsUpdate=!0),re?me(x.depthTexture,0):pe(x.depthTexture,0);const ce=Q.__webglTexture,$=ze(x),N=re?i.TEXTURE_CUBE_MAP_POSITIVE_X+F:i.TEXTURE_2D,ne=x.depthTexture.format===kn?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;if(x.depthTexture.format===Vn)ae(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ne,N,ce,0,$):i.framebufferTexture2D(i.FRAMEBUFFER,ne,N,ce,0);else if(x.depthTexture.format===kn)ae(x)?o.framebufferTexture2DMultisampleEXT(i.FRAMEBUFFER,ne,N,ce,0,$):i.framebufferTexture2D(i.FRAMEBUFFER,ne,N,ce,0);else throw new Error("THREE.WebGLTextures: Unknown depthTexture format.")}function Me(E){const x=n.get(E),F=E.isWebGLCubeRenderTarget===!0;if(x.__boundDepthTexture!==E.depthTexture){const re=E.depthTexture;if(x.__depthDisposeCallback&&x.__depthDisposeCallback(),re){const Q=()=>{delete x.__boundDepthTexture,delete x.__depthDisposeCallback,re.removeEventListener("dispose",Q)};re.addEventListener("dispose",Q),x.__depthDisposeCallback=Q}x.__boundDepthTexture=re}if(E.depthTexture&&!x.__autoAllocateDepthBuffer)if(F)for(let re=0;re<6;re++)te(x.__webglFramebuffer[re],E,re);else E.texture.mipmaps.length>0?te(x.__webglFramebuffer[0],E,0):te(x.__webglFramebuffer,E,0);else if(F){x.__webglDepthbuffer=[];for(let re=0;re<6;re++)if(t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[re]),x.__webglDepthbuffer[re]===void 0)x.__webglDepthbuffer[re]=i.createRenderbuffer(),I(x.__webglDepthbuffer[re],E,!1);else{const Q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,le=x.__webglDepthbuffer[re];i.bindRenderbuffer(i.RENDERBUFFER,le),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,le)}}else if(E.texture.mipmaps.length>0?t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer[0]):t.bindFramebuffer(i.FRAMEBUFFER,x.__webglFramebuffer),x.__webglDepthbuffer===void 0)x.__webglDepthbuffer=i.createRenderbuffer(),I(x.__webglDepthbuffer,E,!1);else{const Q=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,le=x.__webglDepthbuffer;i.bindRenderbuffer(i.RENDERBUFFER,le),i.framebufferRenderbuffer(i.FRAMEBUFFER,Q,i.RENDERBUFFER,le)}t.bindFramebuffer(i.FRAMEBUFFER,null)}function Te(E,x,F){const re=n.get(E);x!==void 0&&lt(re.__webglFramebuffer,E,E.texture,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,0),F!==void 0&&Me(E)}function ct(E){const x=E.texture,F=n.get(E),re=n.get(x);E.addEventListener("dispose",G),z(E);const Q=E.textures,le=E.isWebGLCubeRenderTarget===!0,ce=Q.length>1;if(ce||(re.__webglTexture===void 0&&(re.__webglTexture=i.createTexture()),re.__version=x.version,a.memory.textures++),le){F.__webglFramebuffer=[];for(let $=0;$<6;$++)if(x.mipmaps.length>0){F.__webglFramebuffer[$]=[];for(let N=0;N<x.mipmaps.length;N++)F.__webglFramebuffer[$][N]=i.createFramebuffer()}else F.__webglFramebuffer[$]=i.createFramebuffer()}else{if(x.mipmaps.length>0){F.__webglFramebuffer=[];for(let $=0;$<x.mipmaps.length;$++)F.__webglFramebuffer[$]=i.createFramebuffer()}else F.__webglFramebuffer=i.createFramebuffer();if(ce)for(let $=0,N=Q.length;$<N;$++){const ne=n.get(Q[$]);ne.__webglTexture===void 0&&(ne.__webglTexture=i.createTexture(),a.memory.textures++)}if(E.samples>0&&ae(E)===!1){F.__webglMultisampledFramebuffer=i.createFramebuffer(),F.__webglColorRenderbuffer=[],t.bindFramebuffer(i.FRAMEBUFFER,F.__webglMultisampledFramebuffer);for(let $=0;$<Q.length;$++){const N=Q[$];F.__webglColorRenderbuffer[$]=i.createRenderbuffer(),i.bindRenderbuffer(i.RENDERBUFFER,F.__webglColorRenderbuffer[$]);const ne=s.convert(N.format,N.colorSpace),T=s.convert(N.type),k=A(N.internalFormat,ne,T,N.normalized,N.colorSpace,E.isXRRenderTarget===!0),V=ze(E);i.renderbufferStorageMultisample(i.RENDERBUFFER,V,k,E.width,E.height),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+$,i.RENDERBUFFER,F.__webglColorRenderbuffer[$])}i.bindRenderbuffer(i.RENDERBUFFER,null),E.depthBuffer&&(F.__webglDepthRenderbuffer=i.createRenderbuffer(),I(F.__webglDepthRenderbuffer,E,!0)),t.bindFramebuffer(i.FRAMEBUFFER,null)}}if(le){t.bindTexture(i.TEXTURE_CUBE_MAP,re.__webglTexture),Je(i.TEXTURE_CUBE_MAP,x);for(let $=0;$<6;$++)if(x.mipmaps.length>0)for(let N=0;N<x.mipmaps.length;N++)lt(F.__webglFramebuffer[$][N],E,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,N);else lt(F.__webglFramebuffer[$],E,x,i.COLOR_ATTACHMENT0,i.TEXTURE_CUBE_MAP_POSITIVE_X+$,0);w(x)?b(i.TEXTURE_CUBE_MAP):x.mipmaps.length>0&&i.texParameteri(i.TEXTURE_CUBE_MAP,i.TEXTURE_MAX_LEVEL,x.mipmaps.length-1),t.unbindTexture()}else if(ce){for(let $=0,N=Q.length;$<N;$++){const ne=Q[$],T=n.get(ne);let k=i.TEXTURE_2D;(E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&(k=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture(k,T.__webglTexture),Je(k,ne),lt(F.__webglFramebuffer,E,ne,i.COLOR_ATTACHMENT0+$,k,0),w(ne)&&b(k)}t.unbindTexture()}else{let $=i.TEXTURE_2D;if((E.isWebGL3DRenderTarget||E.isWebGLArrayRenderTarget)&&($=E.isWebGL3DRenderTarget?i.TEXTURE_3D:i.TEXTURE_2D_ARRAY),t.bindTexture($,re.__webglTexture),Je($,x),x.mipmaps.length>0)for(let N=0;N<x.mipmaps.length;N++)lt(F.__webglFramebuffer[N],E,x,i.COLOR_ATTACHMENT0,$,N);else lt(F.__webglFramebuffer,E,x,i.COLOR_ATTACHMENT0,$,0);w(x)?b($):x.mipmaps.length>0&&i.texParameteri($,i.TEXTURE_MAX_LEVEL,x.mipmaps.length-1),t.unbindTexture()}E.depthBuffer&&Me(E)}function L(E){const x=E.textures;for(let F=0,re=x.length;F<re;F++){const Q=x[F];if(w(Q)&&Q.mipmapsAutoUpdate===!0){const le=R(E),ce=n.get(Q).__webglTexture;t.bindTexture(le,ce),b(le),t.unbindTexture()}}}const _t=[];function nt(E){if(E.samples>0){if(ae(E)===!1){const x=E.textures,F=E.width,re=E.height;let Q=i.COLOR_BUFFER_BIT;const le=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT,ce=n.get(E),$=x.length>1;if($)for(let ne=0;ne<x.length;ne++)t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ne,i.RENDERBUFFER,null),t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ne,i.TEXTURE_2D,null,0);t.bindFramebuffer(i.READ_FRAMEBUFFER,ce.__webglMultisampledFramebuffer),E.texture.mipmaps.length>0?t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglFramebuffer[0]):t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglFramebuffer);for(let ne=0;ne<x.length;ne++){if(E.resolveDepthBuffer&&(E.depthBuffer&&(Q|=i.DEPTH_BUFFER_BIT),E.stencilBuffer&&E.resolveStencilBuffer&&(Q|=i.STENCIL_BUFFER_BIT)),$){i.framebufferRenderbuffer(i.READ_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.RENDERBUFFER,ce.__webglColorRenderbuffer[ne]);const T=n.get(x[ne]).__webglTexture;i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0,i.TEXTURE_2D,T,0)}i.blitFramebuffer(0,0,F,re,0,0,F,re,Q,i.NEAREST),c===!0&&(_t.length=0,_t.push(i.COLOR_ATTACHMENT0+ne),E.depthBuffer&&E.storeMultisampledDepthBuffer===!1&&_t.push(le),i.invalidateFramebuffer(i.READ_FRAMEBUFFER,_t))}if(t.bindFramebuffer(i.READ_FRAMEBUFFER,null),t.bindFramebuffer(i.DRAW_FRAMEBUFFER,null),$)for(let ne=0;ne<x.length;ne++){t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglMultisampledFramebuffer),i.framebufferRenderbuffer(i.FRAMEBUFFER,i.COLOR_ATTACHMENT0+ne,i.RENDERBUFFER,ce.__webglColorRenderbuffer[ne]);const T=n.get(x[ne]).__webglTexture;t.bindFramebuffer(i.FRAMEBUFFER,ce.__webglFramebuffer),i.framebufferTexture2D(i.DRAW_FRAMEBUFFER,i.COLOR_ATTACHMENT0+ne,i.TEXTURE_2D,T,0)}t.bindFramebuffer(i.DRAW_FRAMEBUFFER,ce.__webglMultisampledFramebuffer)}else if(E.depthBuffer&&E.storeMultisampledDepthBuffer===!1&&c){const x=E.stencilBuffer?i.DEPTH_STENCIL_ATTACHMENT:i.DEPTH_ATTACHMENT;i.invalidateFramebuffer(i.DRAW_FRAMEBUFFER,[x])}}}function ze(E){return Math.min(r.maxSamples,E.samples)}function ae(E){const x=n.get(E);return E.samples>0&&e.has("WEBGL_multisampled_render_to_texture")===!0&&x.__useRenderToTexture!==!1}function st(E){const x=a.render.frame;u.get(E)!==x&&(u.set(E,x),E.update())}function we(E,x){const F=E.colorSpace,re=E.format,Q=E.type;return E.isCompressedTexture===!0||E.isVideoTexture===!0||F!==Gr&&F!==zn&&(Ye.getTransfer(F)===rt?(re!==fn||Q!==Jt)&&Ue("WebGLTextures: sRGB encoded textures have to use RGBAFormat and UnsignedByteType."):et("WebGLTextures: Unsupported texture color space:",F)),x}function Ie(E){return typeof HTMLImageElement<"u"&&E instanceof HTMLImageElement?(l.width=E.naturalWidth||E.width,l.height=E.naturalHeight||E.height):typeof VideoFrame<"u"&&E instanceof VideoFrame?(l.width=E.displayWidth,l.height=E.displayHeight):(l.width=E.width,l.height=E.height),l}this.allocateTextureUnit=Fe,this.resetTextureUnits=j,this.getTextureUnits=ee,this.setTextureUnits=Se,this.setTexture2D=pe,this.setTexture2DArray=ve,this.setTexture3D=Pe,this.setTextureCube=me,this.rebindTextures=Te,this.setupRenderTarget=ct,this.updateRenderTargetMipmap=L,this.updateMultisampleRenderTarget=nt,this.setupDepthRenderbuffer=Me,this.setupFrameBufferTexture=lt,this.useMultisampledRTT=ae,this.dispose=Y}function Dm(i,e){function t(n,r=zn){let s;const a=Ye.getTransfer(r);if(n===Jt)return i.UNSIGNED_BYTE;if(n===Ra)return i.UNSIGNED_SHORT_4_4_4_4;if(n===Ca)return i.UNSIGNED_SHORT_5_5_5_1;if(n===xl)return i.UNSIGNED_INT_5_9_9_9_REV;if(n===vl)return i.UNSIGNED_INT_10F_11F_11F_REV;if(n===gl)return i.BYTE;if(n===_l)return i.SHORT;if(n===qi)return i.UNSIGNED_SHORT;if(n===wa)return i.INT;if(n===mn)return i.UNSIGNED_INT;if(n===dn)return i.FLOAT;if(n===gn)return i.HALF_FLOAT;if(n===Sl)return i.ALPHA;if(n===Ml)return i.RGB;if(n===fn)return i.RGBA;if(n===Vn)return i.DEPTH_COMPONENT;if(n===kn)return i.DEPTH_STENCIL;if(n===El)return i.RED;if(n===Pa)return i.RED_INTEGER;if(n===ni)return i.RG;if(n===La)return i.RG_INTEGER;if(n===Da)return i.RGBA_INTEGER;if(n===Lr||n===Dr||n===Ir||n===Nr)if(a===rt)if(s=e.get("WEBGL_compressed_texture_s3tc_srgb"),s!==null){if(n===Lr)return s.COMPRESSED_SRGB_S3TC_DXT1_EXT;if(n===Dr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT1_EXT;if(n===Ir)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT3_EXT;if(n===Nr)return s.COMPRESSED_SRGB_ALPHA_S3TC_DXT5_EXT}else return null;else if(s=e.get("WEBGL_compressed_texture_s3tc"),s!==null){if(n===Lr)return s.COMPRESSED_RGB_S3TC_DXT1_EXT;if(n===Dr)return s.COMPRESSED_RGBA_S3TC_DXT1_EXT;if(n===Ir)return s.COMPRESSED_RGBA_S3TC_DXT3_EXT;if(n===Nr)return s.COMPRESSED_RGBA_S3TC_DXT5_EXT}else return null;if(n===Ys||n===Ks||n===$s||n===Zs)if(s=e.get("WEBGL_compressed_texture_pvrtc"),s!==null){if(n===Ys)return s.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;if(n===Ks)return s.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;if(n===$s)return s.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;if(n===Zs)return s.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG}else return null;if(n===Js||n===Qs||n===js||n===ea||n===ta||n===Br||n===na)if(s=e.get("WEBGL_compressed_texture_etc"),s!==null){if(n===Js||n===Qs)return a===rt?s.COMPRESSED_SRGB8_ETC2:s.COMPRESSED_RGB8_ETC2;if(n===js)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ETC2_EAC:s.COMPRESSED_RGBA8_ETC2_EAC;if(n===ea)return s.COMPRESSED_R11_EAC;if(n===ta)return s.COMPRESSED_SIGNED_R11_EAC;if(n===Br)return s.COMPRESSED_RG11_EAC;if(n===na)return s.COMPRESSED_SIGNED_RG11_EAC}else return null;if(n===ia||n===ra||n===sa||n===aa||n===oa||n===la||n===ca||n===ua||n===ha||n===da||n===fa||n===pa||n===ma||n===ga)if(s=e.get("WEBGL_compressed_texture_astc"),s!==null){if(n===ia)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_4x4_KHR:s.COMPRESSED_RGBA_ASTC_4x4_KHR;if(n===ra)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x4_KHR:s.COMPRESSED_RGBA_ASTC_5x4_KHR;if(n===sa)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_5x5_KHR:s.COMPRESSED_RGBA_ASTC_5x5_KHR;if(n===aa)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x5_KHR:s.COMPRESSED_RGBA_ASTC_6x5_KHR;if(n===oa)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_6x6_KHR:s.COMPRESSED_RGBA_ASTC_6x6_KHR;if(n===la)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x5_KHR:s.COMPRESSED_RGBA_ASTC_8x5_KHR;if(n===ca)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x6_KHR:s.COMPRESSED_RGBA_ASTC_8x6_KHR;if(n===ua)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_8x8_KHR:s.COMPRESSED_RGBA_ASTC_8x8_KHR;if(n===ha)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x5_KHR:s.COMPRESSED_RGBA_ASTC_10x5_KHR;if(n===da)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x6_KHR:s.COMPRESSED_RGBA_ASTC_10x6_KHR;if(n===fa)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x8_KHR:s.COMPRESSED_RGBA_ASTC_10x8_KHR;if(n===pa)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_10x10_KHR:s.COMPRESSED_RGBA_ASTC_10x10_KHR;if(n===ma)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x10_KHR:s.COMPRESSED_RGBA_ASTC_12x10_KHR;if(n===ga)return a===rt?s.COMPRESSED_SRGB8_ALPHA8_ASTC_12x12_KHR:s.COMPRESSED_RGBA_ASTC_12x12_KHR}else return null;if(n===_a||n===xa||n===va)if(s=e.get("EXT_texture_compression_bptc"),s!==null){if(n===_a)return a===rt?s.COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT:s.COMPRESSED_RGBA_BPTC_UNORM_EXT;if(n===xa)return s.COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT;if(n===va)return s.COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT}else return null;if(n===Sa||n===Ma||n===zr||n===Ea)if(s=e.get("EXT_texture_compression_rgtc"),s!==null){if(n===Sa)return s.COMPRESSED_RED_RGTC1_EXT;if(n===Ma)return s.COMPRESSED_SIGNED_RED_RGTC1_EXT;if(n===zr)return s.COMPRESSED_RED_GREEN_RGTC2_EXT;if(n===Ea)return s.COMPRESSED_SIGNED_RED_GREEN_RGTC2_EXT}else return null;return n===yi?i.UNSIGNED_INT_24_8:i[n]!==void 0?i[n]:null}return{convert:t}}const Im=`
void main() {

	gl_Position = vec4( position, 1.0 );

}`,Nm=`
uniform sampler2DArray depthColor;
uniform float depthWidth;
uniform float depthHeight;

void main() {

	vec2 coord = vec2( gl_FragCoord.x / depthWidth, gl_FragCoord.y / depthHeight );

	if ( coord.x >= 1.0 ) {

		gl_FragDepth = texture( depthColor, vec3( coord.x - 1.0, coord.y, 1 ) ).r;

	} else {

		gl_FragDepth = texture( depthColor, vec3( coord.x, coord.y, 0 ) ).r;

	}

}`;class Um{constructor(){this.texture=null,this.mesh=null,this.depthNear=0,this.depthFar=0}init(e,t){if(this.texture===null){const n=new Fl(e.texture);(e.depthNear!==t.depthNear||e.depthFar!==t.depthFar)&&(this.depthNear=e.depthNear,this.depthFar=e.depthFar),this.texture=n}}getMesh(e){if(this.texture!==null&&this.mesh===null){const t=e.cameras[0].viewport,n=new ri({vertexShader:Im,fragmentShader:Nm,uniforms:{depthColor:{value:this.texture},depthWidth:{value:t.z},depthHeight:{value:t.w}}});this.mesh=new Bt(new Ti(20,20),n)}return this.mesh}reset(){this.texture=null,this.mesh=null}getDepthTexture(){return this.texture}}class Fm extends si{constructor(e,t){super();const n=this;let r=null,s=1,a=null,o="local-floor",c=1,l=null,u=null,f=null,d=null,h=null,_=null;const S=typeof XRWebGLBinding<"u",m=new Um,p={},M=t.getContextAttributes();let w=null,b=null;const R=[],A=[],g=new Ze;let y=null,z=null;const D=new rn;D.viewport=new ft;const U=new rn;U.viewport=new ft;const G=[D,U],K=new Yu;let P=null,Y=null;this.cameraAutoUpdate=!0,this.enabled=!1,this.isPresenting=!1,this.getController=function(J){let pe=R[J];return pe===void 0&&(pe=new _s,R[J]=pe),pe.getTargetRaySpace()},this.getControllerGrip=function(J){let pe=R[J];return pe===void 0&&(pe=new _s,R[J]=pe),pe.getGripSpace()},this.getHand=function(J){let pe=R[J];return pe===void 0&&(pe=new _s,R[J]=pe),pe.getHandSpace()};function Z(J){const pe=A.indexOf(J.inputSource);if(pe===-1)return;const ve=R[pe];ve!==void 0&&(ve.update(J.inputSource,J.frame,l||a),ve.dispatchEvent({type:J.type,data:J.inputSource}))}function X(){r.removeEventListener("select",Z),r.removeEventListener("selectstart",Z),r.removeEventListener("selectend",Z),r.removeEventListener("squeeze",Z),r.removeEventListener("squeezestart",Z),r.removeEventListener("squeezeend",Z),r.removeEventListener("end",X),r.removeEventListener("inputsourceschange",ie);for(let J=0;J<R.length;J++){const pe=A[J];pe!==null&&(A[J]=null,R[J].disconnect(pe))}P=null,Y=null,m.reset();for(const J in p)delete p[J];if(e.setRenderTarget(w),h=null,d=null,f=null,r=null,b=null,Fe.stop(),n.isPresenting=!1,e.setPixelRatio(y),e.setSize(g.width,g.height,!1),z!==null){const J=z.camera;J.fov=z.fov,J.zoom=z.zoom,J.updateProjectionMatrix(),z=null}n.dispatchEvent({type:"sessionend"})}this.setFramebufferScaleFactor=function(J){s=J,n.isPresenting===!0&&Ue("WebXRManager: Cannot change framebuffer scale while presenting.")},this.setReferenceSpaceType=function(J){o=J,n.isPresenting===!0&&Ue("WebXRManager: Cannot change reference space type while presenting.")},this.getReferenceSpace=function(){return l||a},this.setReferenceSpace=function(J){l=J},this.getBaseLayer=function(){return d!==null?d:h},this.getBinding=function(){return f===null&&S&&(f=new XRWebGLBinding(r,t)),f},this.getFrame=function(){return _},this.getSession=function(){return r},this.setSession=async function(J){if(r=J,r!==null){if(w=e.getRenderTarget(),r.addEventListener("select",Z),r.addEventListener("selectstart",Z),r.addEventListener("selectend",Z),r.addEventListener("squeeze",Z),r.addEventListener("squeezestart",Z),r.addEventListener("squeezeend",Z),r.addEventListener("end",X),r.addEventListener("inputsourceschange",ie),M.xrCompatible!==!0&&await t.makeXRCompatible(),y=e.getPixelRatio(),e.getSize(g),S&&"createProjectionLayer"in XRWebGLBinding.prototype){let ve=null,Pe=null,me=null;M.depth&&(me=M.stencil?t.DEPTH24_STENCIL8:t.DEPTH_COMPONENT24,ve=M.stencil?kn:Vn,Pe=M.stencil?yi:mn);const Oe={colorFormat:t.RGBA8,depthFormat:me,scaleFactor:s};f=this.getBinding(),d=f.createProjectionLayer(Oe),r.updateRenderState({layers:[d]}),e.setPixelRatio(1),e.setSize(d.textureWidth,d.textureHeight,!1),b=new pn(d.textureWidth,d.textureHeight,{format:fn,type:Jt,depthTexture:new bi(d.textureWidth,d.textureHeight,Pe,void 0,void 0,void 0,void 0,void 0,void 0,ve),stencilBuffer:M.stencil,colorSpace:e.outputColorSpace,samples:M.antialias?4:0,resolveDepthBuffer:d.ignoreDepthValues===!1,resolveStencilBuffer:d.ignoreDepthValues===!1,storeMultisampledDepthBuffer:d.ignoreDepthValues===!1,storeMultisampledStencilBuffer:d.ignoreDepthValues===!1})}else{const ve={antialias:M.antialias,alpha:!0,depth:M.depth,stencil:M.stencil,framebufferScaleFactor:s};h=new XRWebGLLayer(r,t,ve),r.updateRenderState({baseLayer:h}),e.setPixelRatio(1),e.setSize(h.framebufferWidth,h.framebufferHeight,!1),b=new pn(h.framebufferWidth,h.framebufferHeight,{format:fn,type:Jt,colorSpace:e.outputColorSpace,stencilBuffer:M.stencil,resolveDepthBuffer:h.ignoreDepthValues===!1,resolveStencilBuffer:h.ignoreDepthValues===!1,storeMultisampledDepthBuffer:h.ignoreDepthValues===!1,storeMultisampledStencilBuffer:h.ignoreDepthValues===!1})}b.isXRRenderTarget=!0,this.setFoveation(c),l=null,a=await r.requestReferenceSpace(o),Fe.setContext(r),Fe.start(),n.isPresenting=!0,n.dispatchEvent({type:"sessionstart"})}},this.getEnvironmentBlendMode=function(){if(r!==null)return r.environmentBlendMode},this.getDepthTexture=function(){return m.getDepthTexture()};function ie(J){for(let pe=0;pe<J.removed.length;pe++){const ve=J.removed[pe],Pe=A.indexOf(ve);Pe>=0&&(A[Pe]=null,R[Pe].disconnect(ve))}for(let pe=0;pe<J.added.length;pe++){const ve=J.added[pe];let Pe=A.indexOf(ve);if(Pe===-1){for(let Oe=0;Oe<R.length;Oe++)if(Oe>=A.length){A.push(ve),Pe=Oe;break}else if(A[Oe]===null){A[Oe]=ve,Pe=Oe;break}if(Pe===-1)break}const me=R[Pe];me&&me.connect(ve)}}function q(J,pe){pe===null?J.matrixWorld.copy(J.matrix):J.matrixWorld.multiplyMatrices(pe.matrixWorld,J.matrix),J.matrixWorldInverse.copy(J.matrixWorld).invert()}this.updateCamera=function(J){if(r===null)return;let pe=J.near,ve=J.far;m.texture!==null&&(m.depthNear>0&&(pe=m.depthNear),m.depthFar>0&&(ve=m.depthFar)),K.near=U.near=D.near=pe,K.far=U.far=D.far=ve,(P!==K.near||Y!==K.far)&&(r.updateRenderState({depthNear:K.near,depthFar:K.far}),P=K.near,Y=K.far),K.layers.mask=J.layers.mask|6,D.layers.mask=K.layers.mask&-5,U.layers.mask=K.layers.mask&-3;const Pe=J.parent,me=K.cameras;q(K,Pe);for(let Oe=0;Oe<me.length;Oe++)q(me[Oe],Pe);K.projectionMatrix.copy(D.projectionMatrix),K.projectionMatrixInverse.copy(D.projectionMatrixInverse),z===null&&J.isPerspectiveCamera&&(z={camera:J,fov:J.fov,zoom:J.zoom}),j(J,K,Pe)};function j(J,pe,ve){ve===null?J.matrix.copy(pe.matrixWorld):(J.matrix.copy(ve.matrixWorld),J.matrix.invert(),J.matrix.multiply(pe.matrixWorld)),J.matrix.decompose(J.position,J.quaternion,J.scale),J.updateMatrixWorld(!0),J.projectionMatrix.copy(pe.projectionMatrix),J.projectionMatrixInverse.copy(pe.projectionMatrixInverse),J.isPerspectiveCamera&&(J.fov=ya*2*Math.atan(1/J.projectionMatrix.elements[5]),J.zoom=1)}this.getCamera=function(){return K},this.getFoveation=function(){if(!(d===null&&h===null))return c},this.setFoveation=function(J){c=J,d!==null&&(d.fixedFoveation=J),h!==null&&h.fixedFoveation!==void 0&&(h.fixedFoveation=J)},this.hasDepthSensing=function(){return m.texture!==null},this.getDepthSensingMesh=function(){return m.getMesh(K)},this.getCameraTexture=function(J){return p[J]};let ee=null;function Se(J,pe){if(u=pe.getViewerPose(l||a),_=pe,u!==null){const ve=u.views;h!==null&&(e.setRenderTargetFramebuffer(b,h.framebuffer),e.setRenderTarget(b));let Pe=!1;ve.length!==K.cameras.length&&(K.cameras.length=0,Pe=!0);for(let De=0;De<ve.length;De++){const Je=ve[De];let Qe=null;if(h!==null)Qe=h.getViewport(Je);else{const gt=f.getViewSubImage(d,Je);Qe=gt.viewport,De===0&&(e.setRenderTargetTextures(b,gt.colorTexture,gt.depthStencilTexture),e.setRenderTarget(b))}let We=G[De];We===void 0&&(We=new rn,We.layers.enable(De),We.viewport=new ft,G[De]=We),We.matrix.fromArray(Je.transform.matrix),We.matrix.decompose(We.position,We.quaternion,We.scale),We.projectionMatrix.fromArray(Je.projectionMatrix),We.projectionMatrixInverse.copy(We.projectionMatrix).invert(),We.viewport.set(Qe.x,Qe.y,Qe.width,Qe.height),De===0&&(K.matrix.copy(We.matrix),K.matrix.decompose(K.position,K.quaternion,K.scale)),Pe===!0&&K.cameras.push(We)}const me=r.enabledFeatures;if(me&&me.includes("depth-sensing")&&r.depthUsage=="gpu-optimized"&&S){f=n.getBinding();const De=f.getDepthInformation(ve[0]);De&&De.isValid&&De.texture&&m.init(De,r.renderState)}if(me&&me.includes("camera-access")&&S){e.state.unbindTexture(),f=n.getBinding();for(let De=0;De<ve.length;De++){const Je=ve[De].camera;if(Je){let Qe=p[Je];Qe||(Qe=new Fl,p[Je]=Qe);const We=f.getCameraImage(Je);Qe.sourceTexture=We}}}}for(let ve=0;ve<R.length;ve++){const Pe=A[ve],me=R[ve];Pe!==null&&me!==void 0&&me.update(Pe,pe,l||a)}ee&&ee(J,pe),pe.detectedPlanes&&n.dispatchEvent({type:"planesdetected",data:pe}),_=null}const Fe=new zl;Fe.setAnimationLoop(Se),this.setAnimationLoop=function(J){ee=J},this.dispose=function(){}}}const Om=new pt,$l=new Be;$l.set(-1,0,0,0,1,0,0,0,1);function Bm(i,e){function t(m,p){m.matrixAutoUpdate===!0&&m.updateMatrix(),p.value.copy(m.matrix)}function n(m,p){p.color.getRGB(m.fogColor.value,Ol(i)),p.isFog?(m.fogNear.value=p.near,m.fogFar.value=p.far):p.isFogExp2&&(m.fogDensity.value=p.density)}function r(m,p,M,w,b){p.isNodeMaterial?p.uniformsNeedUpdate=!1:p.isMeshBasicMaterial?s(m,p):p.isMeshLambertMaterial?(s(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshToonMaterial?(s(m,p),f(m,p)):p.isMeshPhongMaterial?(s(m,p),u(m,p),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)):p.isMeshStandardMaterial?(s(m,p),d(m,p),p.isMeshPhysicalMaterial&&h(m,p,b)):p.isMeshMatcapMaterial?(s(m,p),_(m,p)):p.isMeshDepthMaterial?s(m,p):p.isMeshDistanceMaterial?(s(m,p),S(m,p)):p.isMeshNormalMaterial?s(m,p):p.isLineBasicMaterial?(a(m,p),p.isLineDashedMaterial&&o(m,p)):p.isPointsMaterial?c(m,p,M,w):p.isSpriteMaterial?l(m,p):p.isShadowMaterial?(m.color.value.copy(p.color),m.opacity.value=p.opacity):p.isShaderMaterial&&(p.uniformsNeedUpdate=!1)}function s(m,p){m.opacity.value=p.opacity,p.color&&m.diffuse.value.copy(p.color),p.emissive&&m.emissive.value.copy(p.emissive).multiplyScalar(p.emissiveIntensity),p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.bumpMap&&(m.bumpMap.value=p.bumpMap,t(p.bumpMap,m.bumpMapTransform),m.bumpScale.value=p.bumpScale,p.side===Wt&&(m.bumpScale.value*=-1)),p.normalMap&&(m.normalMap.value=p.normalMap,t(p.normalMap,m.normalMapTransform),m.normalScale.value.copy(p.normalScale),p.side===Wt&&m.normalScale.value.negate()),p.displacementMap&&(m.displacementMap.value=p.displacementMap,t(p.displacementMap,m.displacementMapTransform),m.displacementScale.value=p.displacementScale,m.displacementBias.value=p.displacementBias),p.emissiveMap&&(m.emissiveMap.value=p.emissiveMap,t(p.emissiveMap,m.emissiveMapTransform)),p.specularMap&&(m.specularMap.value=p.specularMap,t(p.specularMap,m.specularMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest);const M=e.get(p),w=M.envMap,b=M.envMapRotation;w&&(m.envMap.value=w,m.envMapRotation.value.setFromMatrix4(Om.makeRotationFromEuler(b)).transpose(),w.isCubeTexture&&w.isRenderTargetTexture===!1&&m.envMapRotation.value.premultiply($l),m.reflectivity.value=p.reflectivity,m.ior.value=p.ior,m.refractionRatio.value=p.refractionRatio),p.lightMap&&(m.lightMap.value=p.lightMap,m.lightMapIntensity.value=p.lightMapIntensity,t(p.lightMap,m.lightMapTransform)),p.aoMap&&(m.aoMap.value=p.aoMap,m.aoMapIntensity.value=p.aoMapIntensity,t(p.aoMap,m.aoMapTransform))}function a(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform))}function o(m,p){m.dashSize.value=p.dashSize,m.totalSize.value=p.dashSize+p.gapSize,m.scale.value=p.scale}function c(m,p,M,w){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.size.value=p.size*M,m.scale.value=w*.5,p.map&&(m.map.value=p.map,t(p.map,m.uvTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function l(m,p){m.diffuse.value.copy(p.color),m.opacity.value=p.opacity,m.rotation.value=p.rotation,p.map&&(m.map.value=p.map,t(p.map,m.mapTransform)),p.alphaMap&&(m.alphaMap.value=p.alphaMap,t(p.alphaMap,m.alphaMapTransform)),p.alphaTest>0&&(m.alphaTest.value=p.alphaTest)}function u(m,p){m.specular.value.copy(p.specular),m.shininess.value=Math.max(p.shininess,1e-4)}function f(m,p){p.gradientMap&&(m.gradientMap.value=p.gradientMap)}function d(m,p){m.metalness.value=p.metalness,p.metalnessMap&&(m.metalnessMap.value=p.metalnessMap,t(p.metalnessMap,m.metalnessMapTransform)),m.roughness.value=p.roughness,p.roughnessMap&&(m.roughnessMap.value=p.roughnessMap,t(p.roughnessMap,m.roughnessMapTransform)),p.envMap&&(m.envMapIntensity.value=p.envMapIntensity)}function h(m,p,M){m.ior.value=p.ior,p.diffuseRoughness>0&&(m.diffuseRoughness.value=p.diffuseRoughness,p.diffuseRoughnessMap&&(m.diffuseRoughnessMap.value=p.diffuseRoughnessMap,t(p.diffuseRoughnessMap,m.diffuseRoughnessMapTransform))),p.sheen>0&&(m.sheenColor.value.copy(p.sheenColor).multiplyScalar(p.sheen),m.sheenRoughness.value=p.sheenRoughness,p.sheenColorMap&&(m.sheenColorMap.value=p.sheenColorMap,t(p.sheenColorMap,m.sheenColorMapTransform)),p.sheenRoughnessMap&&(m.sheenRoughnessMap.value=p.sheenRoughnessMap,t(p.sheenRoughnessMap,m.sheenRoughnessMapTransform))),p.clearcoat>0&&(m.clearcoat.value=p.clearcoat,m.clearcoatRoughness.value=p.clearcoatRoughness,p.clearcoatMap&&(m.clearcoatMap.value=p.clearcoatMap,t(p.clearcoatMap,m.clearcoatMapTransform)),p.clearcoatRoughnessMap&&(m.clearcoatRoughnessMap.value=p.clearcoatRoughnessMap,t(p.clearcoatRoughnessMap,m.clearcoatRoughnessMapTransform)),p.clearcoatNormalMap&&(m.clearcoatNormalMap.value=p.clearcoatNormalMap,t(p.clearcoatNormalMap,m.clearcoatNormalMapTransform),m.clearcoatNormalScale.value.copy(p.clearcoatNormalScale),p.side===Wt&&m.clearcoatNormalScale.value.negate())),p.dispersion>0&&(m.dispersion.value=p.dispersion),p.retroreflectivity>0&&(m.retroreflectivity.value=p.retroreflectivity),p.iridescence>0&&(m.iridescence.value=p.iridescence,m.iridescenceIOR.value=p.iridescenceIOR,m.iridescenceThicknessMinimum.value=p.iridescenceThicknessMinimum,m.iridescenceThicknessMaximum.value=p.iridescenceThicknessMaximum,p.iridescenceMap&&(m.iridescenceMap.value=p.iridescenceMap,t(p.iridescenceMap,m.iridescenceMapTransform)),p.iridescenceThicknessMap&&(m.iridescenceThicknessMap.value=p.iridescenceThicknessMap,t(p.iridescenceThicknessMap,m.iridescenceThicknessMapTransform))),p.transmission>0&&(m.transmission.value=p.transmission,m.transmissionSamplerMap.value=M.texture,m.transmissionSamplerSize.value.set(M.width,M.height),p.transmissionMap&&(m.transmissionMap.value=p.transmissionMap,t(p.transmissionMap,m.transmissionMapTransform)),m.thickness.value=p.thickness,p.thicknessMap&&(m.thicknessMap.value=p.thicknessMap,t(p.thicknessMap,m.thicknessMapTransform)),m.attenuationDistance.value=p.attenuationDistance,m.attenuationColor.value.copy(p.attenuationColor)),p.anisotropy>0&&(m.anisotropyVector.value.set(p.anisotropy*Math.cos(p.anisotropyRotation),p.anisotropy*Math.sin(p.anisotropyRotation)),p.anisotropyMap&&(m.anisotropyMap.value=p.anisotropyMap,t(p.anisotropyMap,m.anisotropyMapTransform))),m.specularIntensity.value=p.specularIntensity,m.specularColor.value.copy(p.specularColor),p.specularColorMap&&(m.specularColorMap.value=p.specularColorMap,t(p.specularColorMap,m.specularColorMapTransform)),p.specularIntensityMap&&(m.specularIntensityMap.value=p.specularIntensityMap,t(p.specularIntensityMap,m.specularIntensityMapTransform))}function _(m,p){p.matcap&&(m.matcap.value=p.matcap)}function S(m,p){const M=e.get(p).light;m.referencePosition.value.setFromMatrixPosition(M.matrixWorld),m.nearDistance.value=M.shadow.camera.near,m.farDistance.value=M.shadow.camera.far}return{refreshFogUniforms:n,refreshMaterialUniforms:r}}function zm(i,e,t,n){let r={},s={};function a(M,w){const b=w.program;n.uniformBlockBinding(M,b,r[M.id])}function o(M,w){let b=r[M.id];b===void 0&&(_(M),b=c(M),r[M.id]=b,M.addEventListener("dispose",m));const R=w.program;n.updateUBOMapping(M,R);const A=e.render.frame;s[M.id]!==A&&(l(M),s[M.id]=A)}function c(M){const w=i.createBuffer(),b=M.__size,R=M.usage;return i.bindBuffer(i.UNIFORM_BUFFER,w),i.bufferData(i.UNIFORM_BUFFER,b,R),i.bindBuffer(i.UNIFORM_BUFFER,null),w}function l(M){const w=r[M.id],b=M.uniforms,R=M.__cache;i.bindBuffer(i.UNIFORM_BUFFER,w);for(let A=0,g=b.length;A<g;A++){const y=b[A];if(Array.isArray(y))for(let z=0,D=y.length;z<D;z++)u(y[z],A,z,R);else u(y,A,0,R)}i.bindBuffer(i.UNIFORM_BUFFER,null)}function u(M,w,b,R){if(d(M,w,b,R)===!0){const A=M.__offset,g=M.value;if(Array.isArray(g)){let y=0;for(let z=0;z<g.length;z++){const D=g[z],U=S(D,!0);f(D,M.__data,y),y+=U.storage/Float32Array.BYTES_PER_ELEMENT}}else f(g,M.__data,0);i.bufferSubData(i.UNIFORM_BUFFER,A,M.__data)}}function f(M,w,b){typeof M=="number"||typeof M=="boolean"?w[b]=M:M.isMatrix3?(w[b]=M.elements[0],w[b+1]=M.elements[1],w[b+2]=M.elements[2],w[b+3]=0,w[b+4]=M.elements[3],w[b+5]=M.elements[4],w[b+6]=M.elements[5],w[b+7]=0,w[b+8]=M.elements[6],w[b+9]=M.elements[7],w[b+10]=M.elements[8],w[b+11]=0):ArrayBuffer.isView(M)?w.set(M.subarray(0,w.length-b),b):M.toArray(w,b)}function d(M,w,b,R){const A=M.value,g=w+"_"+b;if(Array.isArray(A)){R[g]===void 0&&(R[g]=[]);const y=R[g];let z=!1;for(let D=0;D<A.length;D++)h(A[D],y,D)===!0&&(z=!0);return z}return h(A,R,g)}function h(M,w,b){if(w[b]===void 0)return typeof M=="number"||typeof M=="boolean"?w[b]=M:ArrayBuffer.isView(M)?w[b]=M.slice():w[b]=M.clone(),!0;{const R=w[b];if(typeof M=="number"||typeof M=="boolean"){if(R!==M)return w[b]=M,!0}else{if(ArrayBuffer.isView(M))return!0;if(R.equals(M)===!1)return R.copy(M),!0}}return!1}function _(M){const w=M.uniforms;let b=0;const R=16;for(let g=0,y=w.length;g<y;g++){const z=Array.isArray(w[g])?w[g]:[w[g]];for(let D=0,U=z.length;D<U;D++){const G=z[D],K=Array.isArray(G.value)?G.value:[G.value],P=Array.isArray(w[g])||Array.isArray(G.value);let Y=b;for(let X=0,ie=K.length;X<ie;X++){const q=K[X],j=S(q,P),ee=b%R,Se=ee%j.boundary,Fe=ee+Se;b+=Se,Fe!==0&&R-Fe<j.storage&&(b+=R-Fe),X===0&&(Y=b),b+=j.storage}const Z=G.type==="int"?Int32Array:G.type==="uint"?Uint32Array:Float32Array;G.__data=new Z((b-Y)/Float32Array.BYTES_PER_ELEMENT),G.__offset=Y}}const A=b%R;return A>0&&(b+=R-A),M.__size=b,M.__cache={},this}function S(M,w){const b={boundary:0,storage:0};return typeof M=="number"||typeof M=="boolean"?(b.boundary=4,b.storage=4):M.isVector2?(b.boundary=8,b.storage=8):M.isVector3||M.isColor?(b.boundary=16,b.storage=12):M.isVector4?(b.boundary=16,b.storage=16):M.isMatrix3?(b.boundary=16,b.storage=48):M.isMatrix4?(b.boundary=16,b.storage=64):M.isTexture?Ue("WebGLRenderer: Texture samplers can not be part of an uniforms group."):ArrayBuffer.isView(M)?(b.boundary=16,b.storage=M.byteLength):Ue("WebGLRenderer: Unsupported uniform value type.",M),w===!0&&(b.boundary=16,b.storage=Math.ceil(b.storage/16)*16),b}function m(M){const w=M.target;w.removeEventListener("dispose",m),i.deleteBuffer(r[w.id]),delete r[w.id],delete s[w.id]}function p(){for(const M in r)i.deleteBuffer(r[M]);r={},s={}}return{bind:a,update:o,dispose:p}}const Gm=new Uint16Array([12469,15057,12620,14925,13266,14620,13807,14376,14323,13990,14545,13625,14713,13328,14840,12882,14931,12528,14996,12233,15039,11829,15066,11525,15080,11295,15085,10976,15082,10705,15073,10495,13880,14564,13898,14542,13977,14430,14158,14124,14393,13732,14556,13410,14702,12996,14814,12596,14891,12291,14937,11834,14957,11489,14958,11194,14943,10803,14921,10506,14893,10278,14858,9960,14484,14039,14487,14025,14499,13941,14524,13740,14574,13468,14654,13106,14743,12678,14818,12344,14867,11893,14889,11509,14893,11180,14881,10751,14852,10428,14812,10128,14765,9754,14712,9466,14764,13480,14764,13475,14766,13440,14766,13347,14769,13070,14786,12713,14816,12387,14844,11957,14860,11549,14868,11215,14855,10751,14825,10403,14782,10044,14729,9651,14666,9352,14599,9029,14967,12835,14966,12831,14963,12804,14954,12723,14936,12564,14917,12347,14900,11958,14886,11569,14878,11247,14859,10765,14828,10401,14784,10011,14727,9600,14660,9289,14586,8893,14508,8533,15111,12234,15110,12234,15104,12216,15092,12156,15067,12010,15028,11776,14981,11500,14942,11205,14902,10752,14861,10393,14812,9991,14752,9570,14682,9252,14603,8808,14519,8445,14431,8145,15209,11449,15208,11451,15202,11451,15190,11438,15163,11384,15117,11274,15055,10979,14994,10648,14932,10343,14871,9936,14803,9532,14729,9218,14645,8742,14556,8381,14461,8020,14365,7603,15273,10603,15272,10607,15267,10619,15256,10631,15231,10614,15182,10535,15118,10389,15042,10167,14963,9787,14883,9447,14800,9115,14710,8665,14615,8318,14514,7911,14411,7507,14279,7198,15314,9675,15313,9683,15309,9712,15298,9759,15277,9797,15229,9773,15166,9668,15084,9487,14995,9274,14898,8910,14800,8539,14697,8234,14590,7790,14479,7409,14367,7067,14178,6621,15337,8619,15337,8631,15333,8677,15325,8769,15305,8871,15264,8940,15202,8909,15119,8775,15022,8565,14916,8328,14804,8009,14688,7614,14569,7287,14448,6888,14321,6483,14088,6171,15350,7402,15350,7419,15347,7480,15340,7613,15322,7804,15287,7973,15229,8057,15148,8012,15046,7846,14933,7611,14810,7357,14682,7069,14552,6656,14421,6316,14251,5948,14007,5528,15356,5942,15356,5977,15353,6119,15348,6294,15332,6551,15302,6824,15249,7044,15171,7122,15070,7050,14949,6861,14818,6611,14679,6349,14538,6067,14398,5651,14189,5311,13935,4958,15359,4123,15359,4153,15356,4296,15353,4646,15338,5160,15311,5508,15263,5829,15188,6042,15088,6094,14966,6001,14826,5796,14678,5543,14527,5287,14377,4985,14133,4586,13869,4257,15360,1563,15360,1642,15358,2076,15354,2636,15341,3350,15317,4019,15273,4429,15203,4732,15105,4911,14981,4932,14836,4818,14679,4621,14517,4386,14359,4156,14083,3795,13808,3437,15360,122,15360,137,15358,285,15355,636,15344,1274,15322,2177,15281,2765,15215,3223,15120,3451,14995,3569,14846,3567,14681,3466,14511,3305,14344,3121,14037,2800,13753,2467,15360,0,15360,1,15359,21,15355,89,15346,253,15325,479,15287,796,15225,1148,15133,1492,15008,1749,14856,1882,14685,1886,14506,1783,14324,1608,13996,1398,13702,1183]);let cn=null;function Hm(){return cn===null&&(cn=new Fu(Gm,16,16,ni,gn),cn.name="DFG_LUT",cn.minFilter=Vt,cn.magFilter=Vt,cn.wrapS=An,cn.wrapT=An,cn.generateMipmaps=!1,cn.needsUpdate=!0),cn}class km{constructor(e={}){const{canvas:t=lu(),context:n=null,depth:r=!0,stencil:s=!1,alpha:a=!1,antialias:o=!1,premultipliedAlpha:c=!0,preserveDrawingBuffer:l=!1,powerPreference:u="default",failIfMajorPerformanceCaveat:f=!1,reversedDepthBuffer:d=!1,outputBufferType:h=Jt}=e;this.isWebGLRenderer=!0;let _;if(n!==null){if(typeof WebGLRenderingContext<"u"&&n instanceof WebGLRenderingContext)throw new Error("THREE.WebGLRenderer: WebGL 1 is not supported since r163.");_=n.getContextAttributes().alpha}else _=a;const S=h,m=new Set([Da,La,Pa]),p=new Set([Jt,mn,qi,yi,Ra,Ca]),M=new Uint32Array(4),w=new Int32Array(4),b={textures:[],min:[],max:[],resolution:[]};let R=null,A=null;const g=[],y=[];let z=null;this.domElement=t,this.debug={checkShaderErrors:!0,diagnostics:{keywords:!1},onShaderError:null},this.autoClear=!0,this.autoClearColor=!0,this.autoClearDepth=!0,this.autoClearStencil=!0,this.sortObjects=!0,this.clippingPlanes=[],this.localClippingEnabled=!1,this.toneMapping=wn,this.toneMappingExposure=1,this.transmissionResolutionScale=1;const D=this;let U=!1,G=null,K=null,P=null,Y=null;this._outputColorSpace=zt;let Z=0,X=0,ie=null,q=-1,j=null;const ee=new ft,Se=new ft;let Fe=null;const J=new tt(0);let pe=0,ve=t.width,Pe=t.height,me=1,Oe=null,ht=null;const De=new ft(0,0,ve,Pe),Je=new ft(0,0,ve,Pe);let Qe=!1;const We=new Wr,gt=new Ua;let ot=!1,St=!1;const lt=new pt,I=new H,te=new ft,Me={background:null,fog:null,environment:null,overrideMaterial:null,isScene:!0};let Te=!1;function ct(){return ie===null?me:1}let L=n;function _t(v,C){return t.getContext(v,C)}let nt,ze,ae,st,we,Ie,E,x,F,re,Q,le,ce,$,N,ne,T,k,V,he,oe,ue,Re;try{const v={alpha:!0,depth:r,stencil:s,antialias:o,premultipliedAlpha:c,preserveDrawingBuffer:l,powerPreference:u,failIfMajorPerformanceCaveat:f};if("setAttribute"in t&&t.setAttribute("data-engine",`three.js r${Aa}`),t.addEventListener("webglcontextlost",Le,!1),t.addEventListener("webglcontextrestored",He,!1),t.addEventListener("webglcontextcreationerror",ge,!1),L===null){const C="webgl2";if(L=_t(C,v),L===null)throw _t(C)?new Error("THREE.WebGLRenderer: Error creating WebGL context with your selected attributes."):new Error("THREE.WebGLRenderer: Error creating WebGL context.")}ke()}catch(v){throw t.removeEventListener("webglcontextlost",Le,!1),t.removeEventListener("webglcontextrestored",He,!1),t.removeEventListener("webglcontextcreationerror",ge,!1),et("WebGLRenderer: "+v.message),v}function ke(){nt=new Xf(L),nt.init(),oe=new Dm(L,nt),ze=new Nf(L,nt,e,oe),ae=new Pm(L,nt),ze.reversedDepthBuffer&&d&&ae.buffers.depth.setReversed(!0),K=L.createFramebuffer(),P=L.createFramebuffer(),Y=L.createFramebuffer(),st=new Kf(L),we=new gm,Ie=new Lm(L,nt,ae,we,ze,oe,st),E=new Wf(D),x=new $u(L),ue=new Df(L,x),F=new qf(L,x,st,ue),re=new Zf(L,F,x,ue,st),k=new $f(L,ze,Ie),N=new Uf(we),Q=new mm(D,E,nt,ze,ue,N),le=new Bm(D,we),ce=new xm,$=new bm(nt),T=new Lf(D,E,ae,re,_,c),ne=new Cm(D,re,ze),Re=new zm(L,st,ze,ae),V=new If(L,nt,st),he=new Yf(L,nt,st),st.programs=Q.programs,D.capabilities=ze,D.extensions=nt,D.properties=we,D.renderLists=ce,D.shadowMap=ne,D.state=ae,D.info=st}S!==Jt&&(z=new Qf(S,t.width,t.height,o,r,s));const se=new Fm(D,L);this.xr=se,this.getContext=function(){return L},this.getContextAttributes=function(){return L.getContextAttributes()},this.forceContextLoss=function(){const v=nt.get("WEBGL_lose_context");v&&v.loseContext()},this.forceContextRestore=function(){const v=nt.get("WEBGL_lose_context");v&&v.restoreContext()},this.getPixelRatio=function(){return me},this.setPixelRatio=function(v){v!==void 0&&(me=v,this.setSize(ve,Pe,!1))},this.getSize=function(v){return v.set(ve,Pe)},this.setSize=function(v,C,W=!0){if(se.isPresenting){Ue("WebGLRenderer: Can't change size while VR device is presenting.");return}ve=v,Pe=C,t.width=Math.floor(v*me),t.height=Math.floor(C*me),W===!0&&(t.style.width=v+"px",t.style.height=C+"px"),z!==null&&z.setSize(t.width,t.height),this.setViewport(0,0,v,C)},this.getDrawingBufferSize=function(v){return v.set(ve*me,Pe*me).floor()},this.setDrawingBufferSize=function(v,C,W){ve=v,Pe=C,me=W,t.width=Math.floor(v*W),t.height=Math.floor(C*W),this.setViewport(0,0,v,C)},this.setEffects=function(v){if(S===Jt){et("WebGLRenderer: setEffects() requires outputBufferType set to HalfFloatType or FloatType.");return}if(v){for(let C=0;C<v.length;C++)if(v[C].isOutputPass===!0){Ue("WebGLRenderer: OutputPass is not needed in setEffects(). Tone mapping and color space conversion are applied automatically.");break}}z.setEffects(v||[])},this.getCurrentViewport=function(v){return v.copy(ee)},this.getViewport=function(v){return v.copy(De)},this.setViewport=function(v,C,W,O){v.isVector4?De.set(v.x,v.y,v.z,v.w):De.set(v,C,W,O),ae.viewport(ee.copy(De).multiplyScalar(ct()).round())},this.getScissor=function(v){return v.copy(Je)},this.setScissor=function(v,C,W,O){v.isVector4?Je.set(v.x,v.y,v.z,v.w):Je.set(v,C,W,O),ae.scissor(Se.copy(Je).multiplyScalar(ct()).round())},this.getScissorTest=function(){return Qe},this.setScissorTest=function(v){ae.setScissorTest(Qe=v)},this.setOpaqueSort=function(v){Oe=v},this.setTransparentSort=function(v){ht=v},this.getClearColor=function(v){return v.copy(T.getClearColor())},this.setClearColor=function(){T.setClearColor(...arguments)},this.getClearAlpha=function(){return T.getClearAlpha()},this.setClearAlpha=function(){T.setClearAlpha(...arguments)},this.clear=function(v=!0,C=!0,W=!0){let O=0;if(v){let B=!1;if(ie!==null){const fe=ie.texture.format;B=m.has(fe)}if(B){const fe=ie.texture.type,Ee=p.has(fe),de=T.getClearColor(),xe=T.getClearAlpha(),Ae=de.r,Ge=de.g,Xe=de.b;Ee?(M[0]=Ae,M[1]=Ge,M[2]=Xe,M[3]=xe,L.clearBufferuiv(L.COLOR,0,M)):(w[0]=Ae,w[1]=Ge,w[2]=Xe,w[3]=xe,L.clearBufferiv(L.COLOR,0,w))}else O|=L.COLOR_BUFFER_BIT}C&&(O|=L.DEPTH_BUFFER_BIT,this.state.buffers.depth.setMask(!0)),W&&(O|=L.STENCIL_BUFFER_BIT,this.state.buffers.stencil.setMask(4294967295)),O!==0&&L.clear(O)},this.clearColor=function(){this.clear(!0,!1,!1)},this.clearDepth=function(){this.clear(!1,!0,!1)},this.clearStencil=function(){this.clear(!1,!1,!0)},this.setNodesHandler=function(v){v.setRenderer(this),G=v},this.dispose=function(){t.removeEventListener("webglcontextlost",Le,!1),t.removeEventListener("webglcontextrestored",He,!1),t.removeEventListener("webglcontextcreationerror",ge,!1),T.dispose(),ce.dispose(),$.dispose(),Ie.dispose(),we.dispose(),E.dispose(),re.dispose(),F.dispose(),ue.dispose(),Re.dispose(),Q.dispose(),se.dispose(),se.removeEventListener("sessionstart",ka),se.removeEventListener("sessionend",Va),Wn.stop()};function Le(v){v.preventDefault(),fo("WebGLRenderer: Context Lost."),U=!0}function He(){fo("WebGLRenderer: Context Restored."),U=!1;const v=st.autoReset,C=ne.enabled,W=ne.autoUpdate,O=ne.needsUpdate,B=ne.type;ke(),st.autoReset=v,ne.enabled=C,ne.autoUpdate=W,ne.needsUpdate=O,ne.type=B}function ge(v){et("WebGLRenderer: A WebGL context could not be created. Reason: ",v.statusMessage)}function it(v){const C=v.target;C.removeEventListener("dispose",it),yt(C)}function yt(v){Cn(v),we.remove(v)}function Cn(v){const C=we.get(v).programs;C!==void 0&&(C.forEach(function(W){Q.releaseProgram(W)}),v.isShaderMaterial&&Q.releaseShaderCache(v))}this.renderBufferDirect=function(v,C,W,O,B,fe){C===null&&(C=Me);const Ee=B.isMesh&&B.matrixWorld.determinantAffine()<0,de=Ql(v,C,W,O,B);ae.setMaterial(O,Ee);let xe=W.index,Ae=1;if(O.wireframe===!0){if(xe=F.getWireframeAttribute(W),xe===void 0)return;Ae=2}const Ge=W.drawRange,Xe=W.attributes.position;let ye=Ge.start*Ae,qe=(Ge.start+Ge.count)*Ae;fe!==null&&(ye=Math.max(ye,fe.start*Ae),qe=Math.min(qe,(fe.start+fe.count)*Ae)),xe!==null?(ye=Math.max(ye,0),qe=Math.min(qe,xe.count)):Xe!=null&&(ye=Math.max(ye,0),qe=Math.min(qe,Xe.count));const xt=qe-ye;if(xt<0||xt===1/0)return;ue.setup(B,O,de,W,xe);let ut,at=V;if(xe!==null&&(ut=x.get(xe),at=he,at.setIndex(ut)),B.isMesh)O.wireframe===!0?(ae.setLineWidth(O.wireframeLinewidth*ct()),at.setMode(L.LINES)):at.setMode(L.TRIANGLES);else if(B.isLine){let Ct=O.linewidth;Ct===void 0&&(Ct=1),ae.setLineWidth(Ct*ct()),B.isLineSegments?at.setMode(L.LINES):B.isLineLoop?at.setMode(L.LINE_LOOP):at.setMode(L.LINE_STRIP)}else B.isPoints?at.setMode(L.POINTS):B.isSprite&&at.setMode(L.TRIANGLES);if(B.isBatchedMesh)if(nt.get("WEBGL_multi_draw"))at.renderMultiDraw(B._multiDrawStarts,B._multiDrawCounts,B._multiDrawCount);else{const Ct=B._multiDrawStarts,be=B._multiDrawCounts,Ut=B._multiDrawCount,je=xe?x.get(xe).bytesPerElement:1,Xn=we.get(O).currentProgram.getUniforms();for(let Pt=0;Pt<Ut;Pt++)Xn.setValue(L,"_gl_DrawID",Pt),at.render(Ct[Pt]/je,be[Pt])}else if(B.isInstancedMesh)at.renderInstances(ye,xt,B.count);else if(W.isInstancedBufferGeometry){const Ct=W._maxInstanceCount!==void 0?W._maxInstanceCount:1/0,be=Math.min(W.instanceCount,Ct);at.renderInstances(ye,xt,be)}else at.render(ye,xt)};function Ha(v,C,W,O){G!==null&&v.isNodeMaterial&&G.setObject(O,v),ot===!0&&N.setState(v,W,!1),v.transparent===!0&&v.side===Zt&&v.forceSinglePass===!1?(v.side=Wt,v.needsUpdate=!0,Ci(v,C,O),v.side=ti,v.needsUpdate=!0,Ci(v,C,O),v.side=Zt):Ci(v,C,O)}this.compile=function(v,C,W=null){W===null&&(W=v),G!==null&&G.renderStart(v,C,W),A=$.get(W),A.init(C),y.push(A),W.traverseVisible(function(B){B.isLight&&B.layers.test(C.layers)&&(A.pushLight(B),B.castShadow&&A.pushShadow(B))}),v!==W&&v.traverseVisible(function(B){B.isLight&&B.layers.test(C.layers)&&(A.pushLight(B),B.castShadow&&A.pushShadow(B))}),A.setupLights(),G!==null&&G.updateLights(A.state.lightsArray),St=this.localClippingEnabled,ot=N.init(this.clippingPlanes,St),ot===!0&&N.setGlobalState(this.clippingPlanes,C),G!==null&&ne.render(A.state.shadowsArray,W,C);const O=new Set;return v.traverse(function(B){if(!(B.isMesh||B.isPoints||B.isLine||B.isSprite))return;const fe=B.material;if(fe)if(Array.isArray(fe))for(let Ee=0;Ee<fe.length;Ee++){const de=fe[Ee];Ha(de,W,C,B),O.add(de)}else Ha(fe,W,C,B),O.add(fe)}),A=y.pop(),G!==null&&G.renderEnd(),O},this.compileAsync=function(v,C,W=null){const O=this.compile(v,C,W);return new Promise(B=>{function fe(){if(O.forEach(function(Ee){const xe=we.get(Ee).currentProgram;(xe===void 0||xe.isReady())&&O.delete(Ee)}),O.size===0){B(v);return}setTimeout(fe,10)}nt.get("KHR_parallel_shader_compile")!==null?fe():setTimeout(fe,10)})};let jr=null;function Zl(v){jr&&jr(v)}function ka(){Wn.stop()}function Va(){Wn.start()}const Wn=new zl;Wn.setAnimationLoop(Zl),typeof self<"u"&&Wn.setContext(self),this.setAnimationLoop=function(v){jr=v,se.setAnimationLoop(v),v===null?Wn.stop():Wn.start()},se.addEventListener("sessionstart",ka),se.addEventListener("sessionend",Va),this.render=function(v,C){if(C!==void 0&&C.isCamera!==!0){et("WebGLRenderer.render: camera is not an instance of THREE.Camera.");return}if(U===!0)return;G!==null&&G.renderStart(v,C);const W=se.enabled===!0&&se.isPresenting===!0,O=z!==null&&(ie===null||W)&&z.begin(D,ie);if(v.matrixWorldAutoUpdate===!0&&v.updateMatrixWorld(),C.parent===null&&C.matrixWorldAutoUpdate===!0&&C.updateMatrixWorld(),se.enabled===!0&&se.isPresenting===!0&&(z===null||z.isCompositing()===!1)&&(se.cameraAutoUpdate===!0&&se.updateCamera(C),C=se.getCamera()),v.isScene===!0&&v.onBeforeRender(D,v,C,ie),A=$.get(v,y.length),A.init(C),A.state.textureUnits=Ie.getTextureUnits(),y.push(A),lt.multiplyMatrices(C.projectionMatrix,C.matrixWorldInverse),C.isArrayCamera?gt.setFromArrayCamera(C):We.setFromProjectionMatrix(lt,an,C.reversedDepth),St=this.localClippingEnabled,ot=N.init(this.clippingPlanes,St),R=ce.get(v,g.length),R.init(),g.push(R),this.info.render.frame++,se.enabled===!0&&se.isPresenting===!0){const Ee=D.xr.getDepthSensingMesh();Ee!==null&&es(Ee,C,-1/0,D.sortObjects)}es(v,C,0,D.sortObjects),R.finish(),G!==null&&G.updateLights(A.state.lightsArray),D.sortObjects===!0&&R.sort(Oe,ht),Te=se.enabled===!1||se.isPresenting===!1||se.hasDepthSensing()===!1,Te&&T.addToRenderList(R,v),this.info.autoReset===!0&&this.info.reset(),ot===!0&&N.beginShadows();const B=A.state.shadowsArray;if(ne.render(B,v,C),ot===!0&&N.endShadows(),(O&&z.hasRenderPass())===!1){const Ee=R.opaque,de=R.transmissive;if(A.setupLights(),C.isArrayCamera){const xe=C.cameras;if(de.length>0)for(let Ae=0,Ge=xe.length;Ae<Ge;Ae++){const Xe=xe[Ae];Xa(Ee,de,v,Xe)}Te&&T.render(v);for(let Ae=0,Ge=xe.length;Ae<Ge;Ae++){const Xe=xe[Ae];Wa(R,v,Xe,Xe.viewport)}}else de.length>0&&Xa(Ee,de,v,C),Te&&T.render(v),Wa(R,v,C)}ie!==null&&X===0&&(Ie.updateMultisampleRenderTarget(ie),Ie.updateRenderTargetMipmap(ie)),O&&z.end(D),v.isScene===!0&&v.onAfterRender(D,v,C),ue.resetDefaultState(),q=-1,j=null,y.pop(),y.length>0?(A=y[y.length-1],Ie.setTextureUnits(A.state.textureUnits),ot===!0&&N.setGlobalState(D.clippingPlanes,A.state.camera)):A=null,g.pop(),g.length>0?R=g[g.length-1]:R=null,G!==null&&G.renderEnd()};function es(v,C,W,O){if(v.visible===!1)return;if(v.layers.test(C.layers)){if(v.isGroup)W=v.renderOrder;else if(v.isLOD)v.autoUpdate===!0&&v.update(C);else if(v.isLight)A.pushLight(v),v.castShadow&&A.pushShadow(v);else if(v.isSprite){const Ee=C.isArrayCamera?gt:We;if(!v.frustumCulled||v.intersectsFrustum(Ee)){O&&te.setFromMatrixPosition(v.matrixWorld).applyMatrix4(lt);const de=re.update(v),xe=v.material;xe.visible&&R.push(v,de,xe,W,te.z,null,C)}}else if(v.isMesh||v.isLine||v.isPoints){const Ee=C.isArrayCamera?gt:We;if(!v.frustumCulled||v.intersectsFrustum(Ee)){const de=re.update(v),xe=v.material;if(O&&(v.boundingSphere!==void 0?(v.boundingSphere===null&&v.computeBoundingSphere(),te.copy(v.boundingSphere.center)):(de.boundingSphere===null&&de.computeBoundingSphere(),te.copy(de.boundingSphere.center)),te.applyMatrix4(v.matrixWorld).applyMatrix4(lt)),Array.isArray(xe)){const Ae=de.groups;for(let Ge=0,Xe=Ae.length;Ge<Xe;Ge++){const ye=Ae[Ge],qe=xe[ye.materialIndex];qe&&qe.visible&&R.push(v,de,qe,W,te.z,ye,C)}}else xe.visible&&R.push(v,de,xe,W,te.z,null,C)}}}const fe=v.children;for(let Ee=0,de=fe.length;Ee<de;Ee++)es(fe[Ee],C,W,O)}function Wa(v,C,W,O){const{opaque:B,transmissive:fe,transparent:Ee}=v;A.setupLightsView(W),ot===!0&&N.setGlobalState(D.clippingPlanes,W),O&&ae.viewport(ee.copy(O)),B.length>0&&Qi(B,C,W),fe.length>0&&Qi(fe,C,W),Ee.length>0&&Qi(Ee,C,W),ae.buffers.depth.setTest(!0),ae.buffers.depth.setMask(!0),ae.buffers.color.setMask(!0),ae.setPolygonOffset(!1)}function Xa(v,C,W,O){if((W.isScene===!0?W.overrideMaterial:null)!==null)return;if(A.state.transmissionRenderTarget[O.id]===void 0){const ye=nt.has("EXT_color_buffer_half_float")||nt.has("EXT_color_buffer_float");A.state.transmissionRenderTarget[O.id]=new pn(1,1,{generateMipmaps:!0,type:ye?gn:Jt,minFilter:Hn,samples:Math.max(4,ze.samples),stencilBuffer:s,resolveDepthBuffer:!1,resolveStencilBuffer:!1,storeMultisampledDepthBuffer:!1,storeMultisampledStencilBuffer:!1,colorSpace:Ye.workingColorSpace})}const fe=A.state.transmissionRenderTarget[O.id],Ee=O.viewport||ee;fe.setSize(Ee.z*D.transmissionResolutionScale,Ee.w*D.transmissionResolutionScale);const de=D.getRenderTarget(),xe=D.getActiveCubeFace(),Ae=D.getActiveMipmapLevel();D.setRenderTarget(fe),D.getClearColor(J),pe=D.getClearAlpha(),pe<1&&D.setClearColor(16777215,.5),D.clear(),Te&&T.render(W);const Ge=D.toneMapping;D.toneMapping=wn;const Xe=O.viewport;if(O.viewport!==void 0&&(O.viewport=void 0),A.setupLightsView(O),ot===!0&&N.setGlobalState(D.clippingPlanes,O),Qi(v,W,O),Ie.updateMultisampleRenderTarget(fe),Ie.updateRenderTargetMipmap(fe),nt.has("WEBGL_multisampled_render_to_texture")===!1){let ye=!1;for(let qe=0,xt=C.length;qe<xt;qe++){const ut=C[qe],{object:at,geometry:Ct,material:be,group:Ut}=ut;if(be.side===Zt&&at.layers.test(O.layers)){const je=be.side;be.side=Wt,be.needsUpdate=!0,qa(at,W,O,Ct,be,Ut),be.side=je,be.needsUpdate=!0,ye=!0}}ye===!0&&(Ie.updateMultisampleRenderTarget(fe),Ie.updateRenderTargetMipmap(fe))}D.setRenderTarget(de,xe,Ae),D.setClearColor(J,pe),Xe!==void 0&&(O.viewport=Xe),D.toneMapping=Ge}function Qi(v,C,W){const O=C.isScene===!0?C.overrideMaterial:null;for(let B=0,fe=v.length;B<fe;B++){const Ee=v[B],{object:de,geometry:xe,group:Ae}=Ee;let Ge=Ee.material;Ge.allowOverride===!0&&O!==null&&(Ge=O),de.layers.test(W.layers)&&qa(de,C,W,xe,Ge,Ae)}}function qa(v,C,W,O,B,fe){G!==null&&B.isNodeMaterial&&G.setObject(v,B),v.onBeforeRender(D,C,W,O,B,fe),v.modelViewMatrix.multiplyMatrices(W.matrixWorldInverse,v.matrixWorld),v.normalMatrix.getNormalMatrix(v.modelViewMatrix),B.onBeforeRender(D,C,W,O,v,fe),B.transparent===!0&&B.side===Zt&&B.forceSinglePass===!1?(B.side=Wt,B.needsUpdate=!0,D.renderBufferDirect(W,C,O,B,v,fe),B.side=ti,B.needsUpdate=!0,D.renderBufferDirect(W,C,O,B,v,fe),B.side=Zt):D.renderBufferDirect(W,C,O,B,v,fe),v.onAfterRender(D,C,W,O,B,fe)}function Ya(v){let C=0;for(const W of v)W.texture!==null&&C++;return C}function Ci(v,C,W){C.isScene!==!0&&(C=Me);const O=we.get(v),B=A.state.lights,fe=A.state.shadowsArray,Ee=B.state.version,de=Q.getParameters(v,B.state,fe,C,W,A.state.lightProbeGridArray),xe=Q.getProgramCacheKey(de);let Ae=O.programs;O.environment=v.isMeshStandardMaterial||v.isMeshLambertMaterial||v.isMeshPhongMaterial?C.environment:null,O.fog=C.fog;const Ge=v.isMeshStandardMaterial||v.isMeshLambertMaterial&&!v.envMap||v.isMeshPhongMaterial&&!v.envMap;O.envMap=E.get(v.envMap||O.environment,Ge),O.envMapRotation=O.environment!==null&&v.envMap===null?C.environmentRotation:v.envMapRotation,Ae===void 0&&(v.addEventListener("dispose",it),Ae=new Map,O.programs=Ae,O.programVariants=new Map);let Xe=Ae.get(xe);if(Xe!==void 0){if(O.currentProgram===Xe&&O.lightsStateVersion===Ee)return $a(v,de),Xe}else de.uniforms=Q.getUniforms(v),G!==null&&v.isNodeMaterial&&G.build(v,W,de),v.onBeforeCompile(de,D),Xe=Q.acquireProgram(de,xe),Ae.set(xe,Xe),O.uniforms=de.uniforms;const ye=O.uniforms;return(!v.isShaderMaterial&&!v.isRawShaderMaterial||v.clipping===!0)&&(ye.clippingPlanes=N.uniform),$a(v,de),O.needsLights=ec(v),O.lightsStateVersion=Ee,O.needsLights&&(ye.ambientLightColor.value=B.state.ambient,ye.lightProbe.value=B.state.probe,ye.sunLights.value=B.state.sun,ye.sunLightShadows.value=B.state.sunShadow,ye.directionalLights.value=B.state.directional,ye.directionalLightShadows.value=B.state.directionalShadow,ye.spotLights.value=B.state.spot,ye.spotLightShadows.value=B.state.spotShadow,ye.rectAreaLights.value=B.state.rectArea,ye.ltc_1.value=B.state.rectAreaLTC1,ye.ltc_2.value=B.state.rectAreaLTC2,ye.pointLights.value=B.state.point,ye.pointLightShadows.value=B.state.pointShadow,ye.hemisphereLights.value=B.state.hemi,ye.sunShadowMatrix.value=B.state.sunShadowMatrix,ye.sunShadowCascade.value=B.state.sunShadowCascade,ye.directionalShadowMatrix.value=B.state.directionalShadowMatrix,ye.spotLightMatrix.value=B.state.spotLightMatrix,ye.spotLightMap.value=B.state.spotLightMap,ye.pointShadowMatrix.value=B.state.pointShadowMatrix),O.numLightProbeGrids=Ya(A.state.lightProbeGridArray),O.currentProgram=Xe,O.uniformsList=null,Xe}function Jl(v,C,W,O,B){const fe=we.get(v),Ee=fe.currentProgram.id+","+O+","+B;let de=fe.programVariants.get(Ee);return de===void 0?(de=Ci(v,C,W),fe.programVariants.set(Ee,de)):(fe.currentProgram=de,fe.uniformsList=null,fe.outputColorSpace=O,fe.toneMapping=B),de}function Ka(v){if(v.uniformsList===null){const C=v.currentProgram.getUniforms();v.uniformsList=Fr.seqWithValue(C.seq,v.uniforms)}return v.uniformsList}function $a(v,C){const W=we.get(v);W.outputColorSpace=C.outputColorSpace,W.batching=C.batching,W.batchingColor=C.batchingColor,W.instancing=C.instancing,W.instancingColor=C.instancingColor,W.instancingMorph=C.instancingMorph,W.skinning=C.skinning,W.morphTargets=C.morphTargets,W.morphNormals=C.morphNormals,W.morphColors=C.morphColors,W.morphTargetsCount=C.morphTargetsCount,W.numClippingPlanes=C.numClippingPlanes,W.numIntersection=C.numClipIntersection,W.vertexAlphas=C.vertexAlphas,W.vertexTangents=C.vertexTangents,W.toneMapping=C.toneMapping}function Ql(v,C,W,O,B){C.isScene!==!0&&(C=Me),Ie.resetTextureUnits();const fe=C.fog,Ee=O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial?C.environment:null,de=ie===null?D.outputColorSpace:ie.isXRRenderTarget===!0?ie.texture.colorSpace:Ye.workingColorSpace,xe=O.isMeshStandardMaterial||O.isMeshLambertMaterial&&!O.envMap||O.isMeshPhongMaterial&&!O.envMap,Ae=E.get(O.envMap||Ee,xe),Ge=O.vertexColors===!0&&!!W.attributes.color&&W.attributes.color.itemSize===4,Xe=!!W.attributes.tangent&&(!!O.normalMap||O.anisotropy>0),ye=!!W.morphAttributes.position,qe=!!W.morphAttributes.normal,xt=!!W.morphAttributes.color;let ut=wn;O.toneMapped&&(ie===null||ie.isXRRenderTarget===!0)&&(ut=D.toneMapping);const at=W.morphAttributes.position||W.morphAttributes.normal||W.morphAttributes.color,Ct=at!==void 0?at.length:0,be=we.get(O),Ut=A.state.lights;if(ot===!0&&(St===!0||v!==j)){const dt=v===j&&O.id===q;N.setState(O,v,dt)}let je=!1,Xn=!1;O.version===be.__version?be.needsLights&&be.lightsStateVersion!==Ut.state.version||B.isBatchedMesh&&be.batching===!1||!B.isBatchedMesh&&be.batching===!0||B.isBatchedMesh&&be.batchingColor===!0&&B._colorsTexture===null||B.isBatchedMesh&&be.batchingColor===!1&&B._colorsTexture!==null||B.isInstancedMesh&&be.instancing===!1||!B.isInstancedMesh&&be.instancing===!0||B.isSkinnedMesh&&be.skinning===!1||!B.isSkinnedMesh&&be.skinning===!0||B.isInstancedMesh&&be.instancingColor===!0&&B.instanceColor===null||B.isInstancedMesh&&be.instancingColor===!1&&B.instanceColor!==null||B.isInstancedMesh&&be.instancingMorph===!0&&B.morphTexture===null||B.isInstancedMesh&&be.instancingMorph===!1&&B.morphTexture!==null||be.envMap!==Ae||O.fog===!0&&be.fog!==fe||be.numClippingPlanes!==void 0&&(be.numClippingPlanes!==N.numPlanes||be.numIntersection!==N.numIntersection)||be.vertexAlphas!==Ge||be.vertexTangents!==Xe||be.morphTargets!==ye||be.morphNormals!==qe||be.morphColors!==xt||be.morphTargetsCount!==Ct||be.numLightProbeGrids!==Ya(A.state.lightProbeGridArray)?je=!0:(be.outputColorSpace!==de||be.toneMapping!==ut)&&(Xn=!0):(je=!0,be.__version=O.version);let Pt=be.currentProgram;(je===!0||Xn===!0)&&(Pt=Xn===!0?Jl(O,C,B,de,ut):Ci(O,C,B),G&&O.isNodeMaterial&&G.onUpdateProgram(O,Pt,be));let ji=!1,Pn=!1,qn=!1;const $e=Pt.getUniforms(),wt=be.uniforms;if(ae.useProgram(Pt.program)&&(ji=!0,Pn=!0,qn=!0),O.id!==q&&(q=O.id,Pn=!0),ji||j!==v){ae.buffers.depth.getReversed()&&v.reversedDepth!==!0&&(v._reversedDepth=!0,v.updateProjectionMatrix()),$e.setValue(L,"projectionMatrix",v.projectionMatrix),$e.setValue(L,"viewMatrix",v.matrixWorldInverse);const bt=$e.map.cameraPosition;bt!==void 0&&bt.setValue(L,I.setFromMatrixPosition(v.matrixWorld)),ze.logarithmicDepthBuffer&&$e.setValue(L,"logDepthBufFC",2/(Math.log(v.far+1)/Math.LN2)),(O.isMeshPhongMaterial||O.isMeshToonMaterial||O.isMeshLambertMaterial||O.isMeshBasicMaterial||O.isMeshStandardMaterial||O.isShaderMaterial)&&$e.setValue(L,"isOrthographic",v.isOrthographicCamera===!0),j!==v&&(j=v,Pn=!0,qn=!0)}if(be.needsLights&&(Ut.state.sunShadowMap.length>0&&$e.setValue(L,"sunShadowMap",Ut.state.sunShadowMap,Ie),Ut.state.directionalShadowMap.length>0&&$e.setValue(L,"directionalShadowMap",Ut.state.directionalShadowMap,Ie),Ut.state.spotShadowMap.length>0&&$e.setValue(L,"spotShadowMap",Ut.state.spotShadowMap,Ie),Ut.state.pointShadowMap.length>0&&$e.setValue(L,"pointShadowMap",Ut.state.pointShadowMap,Ie)),B.isSkinnedMesh){$e.setOptional(L,B,"bindMatrix"),$e.setOptional(L,B,"bindMatrixInverse");const dt=B.skeleton;dt&&(dt.boneTexture===null&&dt.computeBoneTexture(),$e.setValue(L,"boneTexture",dt.boneTexture,Ie))}B.isBatchedMesh&&($e.setOptional(L,B,"batchingTexture"),$e.setValue(L,"batchingTexture",B._matricesTexture,Ie),$e.setOptional(L,B,"batchingIdTexture"),$e.setValue(L,"batchingIdTexture",B._indirectTexture,Ie),$e.setOptional(L,B,"batchingColorTexture"),B._colorsTexture!==null&&$e.setValue(L,"batchingColorTexture",B._colorsTexture,Ie));const Qt=W.morphAttributes;if((Qt.position!==void 0||Qt.normal!==void 0||Qt.color!==void 0)&&k.update(B,W,Pt),(Pn||be.receiveShadow!==B.receiveShadow)&&(be.receiveShadow=B.receiveShadow,$e.setValue(L,"receiveShadow",B.receiveShadow)),(O.isMeshStandardMaterial||O.isMeshLambertMaterial||O.isMeshPhongMaterial)&&O.envMap===null&&C.environment!==null&&(wt.envMapIntensity.value=C.environmentIntensity),wt.dfgLUT!==void 0&&(wt.dfgLUT.value=Hm()),Pn){if($e.setValue(L,"toneMappingExposure",D.toneMappingExposure),be.needsLights&&jl(wt,qn),fe&&O.fog===!0&&le.refreshFogUniforms(wt,fe),le.refreshMaterialUniforms(wt,O,me,Pe,A.state.transmissionRenderTarget[v.id]),be.needsLights&&be.numLightProbeGrids>0){const dt=b;let bt=0;for(const _n of A.state.lightProbeGridArray)_n.texture!==null&&(dt.textures[bt]=_n.texture,dt.min[bt]=_n.boundingBox.min,dt.max[bt]=_n.boundingBox.max,dt.resolution[bt]=_n.resolution,bt++);for(const _n in dt)dt[_n].length=bt;wt.probesSH.value=dt.textures,wt.probesMin.value=dt.min,wt.probesMax.value=dt.max,wt.probesResolution.value=dt.resolution}Fr.upload(L,Ka(be),wt,Ie)}if(O.isShaderMaterial&&O.uniformsNeedUpdate===!0&&(Fr.upload(L,Ka(be),wt,Ie),O.uniformsNeedUpdate=!1),O.isSpriteMaterial&&$e.setValue(L,"center",B.center),$e.setValue(L,"modelViewMatrix",B.modelViewMatrix),$e.setValue(L,"normalMatrix",B.normalMatrix),$e.setValue(L,"modelMatrix",B.matrixWorld),O.uniformsGroups!==void 0){const dt=O.uniformsGroups;for(let bt=0,_n=dt.length;bt<_n;bt++){const Ja=dt[bt];Re.update(Ja,Pt),Re.bind(Ja,Pt)}}return Pt}function jl(v,C){v.ambientLightColor.needsUpdate=C,v.lightProbe.needsUpdate=C,v.sunLights.needsUpdate=C,v.sunLightShadows.needsUpdate=C,v.directionalLights.needsUpdate=C,v.directionalLightShadows.needsUpdate=C,v.pointLights.needsUpdate=C,v.pointLightShadows.needsUpdate=C,v.spotLights.needsUpdate=C,v.spotLightShadows.needsUpdate=C,v.rectAreaLights.needsUpdate=C,v.hemisphereLights.needsUpdate=C}function ec(v){return v.isMeshLambertMaterial||v.isMeshToonMaterial||v.isMeshPhongMaterial||v.isMeshStandardMaterial||v.isShadowMaterial||v.isShaderMaterial&&v.lights===!0}this.getActiveCubeFace=function(){return Z},this.getActiveMipmapLevel=function(){return X},this.getRenderTarget=function(){return ie},this.setRenderTargetTextures=function(v,C,W){const O=we.get(v);O.__autoAllocateDepthBuffer=v.resolveDepthBuffer===!1,O.__autoAllocateDepthBuffer===!1&&(O.__useRenderToTexture=!1),we.get(v.texture).__webglTexture=C,we.get(v.depthTexture).__webglTexture=O.__autoAllocateDepthBuffer?void 0:W,O.__hasExternalTextures=!0},this.setRenderTargetFramebuffer=function(v,C){const W=we.get(v);W.__webglFramebuffer=C,W.__useDefaultFramebuffer=C===void 0},this.setRenderTarget=function(v,C=0,W=0){ie=v,Z=C,X=W;let O=null,B=!1,fe=!1;if(v){const de=we.get(v);if(de.__useDefaultFramebuffer!==void 0){ae.bindFramebuffer(L.FRAMEBUFFER,de.__webglFramebuffer),ee.copy(v.viewport),Se.copy(v.scissor),Fe=v.scissorTest,ae.viewport(ee),ae.scissor(Se),ae.setScissorTest(Fe),q=-1;return}else if(de.__webglFramebuffer===void 0)Ie.setupRenderTarget(v);else if(de.__hasExternalTextures)Ie.rebindTextures(v,we.get(v.texture).__webglTexture,we.get(v.depthTexture).__webglTexture);else if(v.depthBuffer){const Ge=v.depthTexture;if(de.__boundDepthTexture!==Ge){if(Ge!==null&&we.has(Ge)&&(v.width!==Ge.image.width||v.height!==Ge.image.height))throw new Error("THREE.WebGLRenderer: Attached DepthTexture is initialized to the incorrect size.");Ie.setupDepthRenderbuffer(v)}}const xe=v.texture;(xe.isData3DTexture||xe.isDataArrayTexture||xe.isCompressedArrayTexture)&&(fe=!0);const Ae=we.get(v).__webglFramebuffer;v.isWebGLCubeRenderTarget?(Array.isArray(Ae[C])?O=Ae[C][W]:O=Ae[C],B=!0):v.samples>0&&Ie.useMultisampledRTT(v)===!1?O=we.get(v).__webglMultisampledFramebuffer:Array.isArray(Ae)?O=Ae[W]:O=Ae,ee.copy(v.viewport),Se.copy(v.scissor),Fe=v.scissorTest}else ee.copy(De).multiplyScalar(me).floor(),Se.copy(Je).multiplyScalar(me).floor(),Fe=Qe;if(W!==0&&(O=K),ae.bindFramebuffer(L.FRAMEBUFFER,O)&&ae.drawBuffers(v,O),ae.viewport(ee),ae.scissor(Se),ae.setScissorTest(Fe),B){const de=we.get(v.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_CUBE_MAP_POSITIVE_X+C,de.__webglTexture,W)}else if(fe){const de=C;for(let xe=0;xe<v.textures.length;xe++){const Ae=we.get(v.textures[xe]);L.framebufferTextureLayer(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0+xe,Ae.__webglTexture,W,de)}}else if(v!==null&&W!==0){const de=we.get(v.texture);L.framebufferTexture2D(L.FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,de.__webglTexture,W)}q=-1};function Za(v){const C=we.get(v);return(C.__readFormat!==v.format||C.__readType!==v.type)&&(C.__readFormat=v.format,C.__readType=v.type,C.__formatReadable=ze.textureFormatReadable(v.format),C.__typeReadable=ze.textureTypeReadable(v.type)),C}this.readRenderTargetPixels=function(v,C,W,O,B,fe,Ee,de=0){if(!(v&&v.isWebGLRenderTarget)){et("WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");return}let xe=we.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&Ee!==void 0&&(xe=xe[Ee],Array.isArray(xe)&&(xe=xe[0])),xe){ae.bindFramebuffer(L.FRAMEBUFFER,xe);try{const Ae=v.textures[de],Ge=Ae.format,Xe=Ae.type;v.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+de);const ye=Za(Ae);if(ye.__formatReadable===!1){et("WebGLRenderer.readRenderTargetPixels: renderTarget is not in RGBA or implementation defined format.");return}if(ye.__typeReadable===!1){et("WebGLRenderer.readRenderTargetPixels: renderTarget is not in UnsignedByteType or implementation defined type.");return}C>=0&&C<=v.width-O&&W>=0&&W<=v.height-B&&L.readPixels(C,W,O,B,oe.convert(Ge),oe.convert(Xe),fe)}finally{const Ae=ie!==null?we.get(ie).__webglFramebuffer:null;ae.bindFramebuffer(L.FRAMEBUFFER,Ae)}}},this.readRenderTargetPixelsAsync=async function(v,C,W,O,B,fe,Ee,de=0){if(!(v&&v.isWebGLRenderTarget))throw new Error("THREE.WebGLRenderer.readRenderTargetPixels: renderTarget is not THREE.WebGLRenderTarget.");let xe=we.get(v).__webglFramebuffer;if(v.isWebGLCubeRenderTarget&&Ee!==void 0&&(xe=xe[Ee],Array.isArray(xe)&&(xe=xe[0])),xe)if(C>=0&&C<=v.width-O&&W>=0&&W<=v.height-B){ae.bindFramebuffer(L.FRAMEBUFFER,xe);const Ae=v.textures[de],Ge=Ae.format,Xe=Ae.type;v.textures.length>1&&L.readBuffer(L.COLOR_ATTACHMENT0+de);const ye=Za(Ae);if(ye.__formatReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in RGBA or implementation defined format.");if(ye.__typeReadable===!1)throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: renderTarget is not in UnsignedByteType or implementation defined type.");const qe=L.createBuffer();L.bindBuffer(L.PIXEL_PACK_BUFFER,qe),L.bufferData(L.PIXEL_PACK_BUFFER,fe.byteLength,L.STREAM_READ),L.readPixels(C,W,O,B,oe.convert(Ge),oe.convert(Xe),0),L.bindBuffer(L.PIXEL_PACK_BUFFER,null);const xt=ie!==null?we.get(ie).__webglFramebuffer:null;ae.bindFramebuffer(L.FRAMEBUFFER,xt);const ut=L.fenceSync(L.SYNC_GPU_COMMANDS_COMPLETE,0);return L.flush(),await cu(L,ut,4),L.bindBuffer(L.PIXEL_PACK_BUFFER,qe),L.getBufferSubData(L.PIXEL_PACK_BUFFER,0,fe),L.bindBuffer(L.PIXEL_PACK_BUFFER,null),L.deleteBuffer(qe),L.deleteSync(ut),fe}else throw new Error("THREE.WebGLRenderer.readRenderTargetPixelsAsync: requested read bounds are out of range.")},this.copyFramebufferToTexture=function(v,C=null,W=0){const O=Math.pow(2,-W),B=Math.floor(v.image.width*O),fe=Math.floor(v.image.height*O),Ee=C!==null?C.x:0,de=C!==null?C.y:0;Ie.setTexture2D(v,0),L.copyTexSubImage2D(L.TEXTURE_2D,W,0,0,Ee,de,B,fe),ae.unbindTexture()},this.copyTextureToTexture=function(v,C,W=null,O=null,B=0,fe=0){let Ee,de,xe,Ae,Ge,Xe,ye,qe,xt;const ut=v.isCompressedTexture?v.mipmaps[fe]:v.image;if(W!==null)Ee=W.max.x-W.min.x,de=W.max.y-W.min.y,xe=W.isBox3?W.max.z-W.min.z:1,Ae=W.min.x,Ge=W.min.y,Xe=W.isBox3?W.min.z:0;else{const $e=Math.pow(2,-B);Ee=Math.floor(ut.width*$e),de=Math.floor(ut.height*$e),v.isDataArrayTexture?xe=ut.depth:v.isData3DTexture?xe=Math.floor(ut.depth*$e):xe=1,Ae=0,Ge=0,Xe=0}O!==null?(ye=O.x,qe=O.y,xt=O.z):(ye=0,qe=0,xt=0);const at=oe.convert(C.format),Ct=oe.convert(C.type);let be;C.isData3DTexture?(Ie.setTexture3D(C,0),be=L.TEXTURE_3D):C.isDataArrayTexture||C.isCompressedArrayTexture?(Ie.setTexture2DArray(C,0),be=L.TEXTURE_2D_ARRAY):(Ie.setTexture2D(C,0),be=L.TEXTURE_2D),ae.activeTexture(L.TEXTURE0),ae.pixelStorei(L.UNPACK_FLIP_Y_WEBGL,C.flipY),ae.pixelStorei(L.UNPACK_PREMULTIPLY_ALPHA_WEBGL,C.premultiplyAlpha),ae.pixelStorei(L.UNPACK_ALIGNMENT,C.unpackAlignment);const Ut=ae.getParameter(L.UNPACK_ROW_LENGTH),je=ae.getParameter(L.UNPACK_IMAGE_HEIGHT),Xn=ae.getParameter(L.UNPACK_SKIP_PIXELS),Pt=ae.getParameter(L.UNPACK_SKIP_ROWS),ji=ae.getParameter(L.UNPACK_SKIP_IMAGES);ae.pixelStorei(L.UNPACK_ROW_LENGTH,ut.width),ae.pixelStorei(L.UNPACK_IMAGE_HEIGHT,ut.height),ae.pixelStorei(L.UNPACK_SKIP_PIXELS,Ae),ae.pixelStorei(L.UNPACK_SKIP_ROWS,Ge),ae.pixelStorei(L.UNPACK_SKIP_IMAGES,Xe);const Pn=v.isDataArrayTexture||v.isData3DTexture,qn=C.isDataArrayTexture||C.isData3DTexture;if(v.isDepthTexture){const $e=we.get(v),wt=we.get(C),Qt=we.get($e.__renderTarget),dt=we.get(wt.__renderTarget);ae.bindFramebuffer(L.READ_FRAMEBUFFER,Qt.__webglFramebuffer),ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,dt.__webglFramebuffer);for(let bt=0;bt<xe;bt++)Pn&&(L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,we.get(v).__webglTexture,B,Xe+bt),L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,we.get(C).__webglTexture,fe,xt+bt)),L.blitFramebuffer(Ae,Ge,Ae+Ee,Ge+de,ye,qe,ye+Ee,qe+de,L.DEPTH_BUFFER_BIT,L.NEAREST);ae.bindFramebuffer(L.READ_FRAMEBUFFER,null),ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else if(B!==0||v.isRenderTargetTexture||we.has(v)){const $e=we.get(v),wt=we.get(C);ae.bindFramebuffer(L.READ_FRAMEBUFFER,P),ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,Y);for(let Qt=0;Qt<xe;Qt++)Pn?L.framebufferTextureLayer(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,$e.__webglTexture,B,Xe+Qt):L.framebufferTexture2D(L.READ_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,$e.__webglTexture,B),qn?L.framebufferTextureLayer(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,wt.__webglTexture,fe,xt+Qt):L.framebufferTexture2D(L.DRAW_FRAMEBUFFER,L.COLOR_ATTACHMENT0,L.TEXTURE_2D,wt.__webglTexture,fe),B!==0?L.blitFramebuffer(Ae,Ge,Ae+Ee,Ge+de,ye,qe,ye+Ee,qe+de,L.COLOR_BUFFER_BIT,L.NEAREST):qn?L.copyTexSubImage3D(be,fe,ye,qe,xt+Qt,Ae,Ge,Ee,de):L.copyTexSubImage2D(be,fe,ye,qe,Ae,Ge,Ee,de);ae.bindFramebuffer(L.READ_FRAMEBUFFER,null),ae.bindFramebuffer(L.DRAW_FRAMEBUFFER,null)}else qn?v.isDataTexture||v.isData3DTexture?L.texSubImage3D(be,fe,ye,qe,xt,Ee,de,xe,at,Ct,ut.data):C.isCompressedArrayTexture?L.compressedTexSubImage3D(be,fe,ye,qe,xt,Ee,de,xe,at,ut.data):L.texSubImage3D(be,fe,ye,qe,xt,Ee,de,xe,at,Ct,ut):v.isDataTexture?L.texSubImage2D(L.TEXTURE_2D,fe,ye,qe,Ee,de,at,Ct,ut.data):v.isCompressedTexture?L.compressedTexSubImage2D(L.TEXTURE_2D,fe,ye,qe,ut.width,ut.height,at,ut.data):L.texSubImage2D(L.TEXTURE_2D,fe,ye,qe,Ee,de,at,Ct,ut);ae.pixelStorei(L.UNPACK_ROW_LENGTH,Ut),ae.pixelStorei(L.UNPACK_IMAGE_HEIGHT,je),ae.pixelStorei(L.UNPACK_SKIP_PIXELS,Xn),ae.pixelStorei(L.UNPACK_SKIP_ROWS,Pt),ae.pixelStorei(L.UNPACK_SKIP_IMAGES,ji),fe===0&&C.generateMipmaps===!0&&C.mipmapsAutoUpdate===!0&&L.generateMipmap(be),ae.unbindTexture()},this.initRenderTarget=function(v){we.get(v).__webglFramebuffer===void 0&&Ie.setupRenderTarget(v)},this.initTexture=function(v){v.isCubeTexture?Ie.setTextureCube(v,0):v.isData3DTexture?Ie.setTexture3D(v,0):v.isDataArrayTexture||v.isCompressedArrayTexture?Ie.setTexture2DArray(v,0):Ie.setTexture2D(v,0),ae.unbindTexture()},this.resetState=function(){Z=0,X=0,ie=null,ae.reset(),ue.reset()},typeof __THREE_DEVTOOLS__<"u"&&__THREE_DEVTOOLS__.dispatchEvent(new CustomEvent("observe",{detail:this}))}get coordinateSystem(){return an}get outputColorSpace(){return this._outputColorSpace}set outputColorSpace(e){this._outputColorSpace=e;const t=this.getContext();t.drawingBufferColorSpace=Ye._getDrawingBufferColorSpace(e),t.unpackColorSpace=Ye._getUnpackColorSpace()}}const Vm="/assets/piantao-sprite-CdzCIqUC.webp",Fn=(i,e)=>{i.renderOrder=e,i.material.depthTest=!1};class Wm{constructor(e){Ne(this,"ok",!1);Ne(this,"renderer");Ne(this,"scene",new Ru);Ne(this,"cam",new rn(40,800/600,10,8e3));Ne(this,"board",new zi);Ne(this,"meshes",new Map);Ne(this,"ringOuter");Ne(this,"ringCore");Ne(this,"ringHalo");Ne(this,"medal");Ne(this,"poseTex",new Map);Ne(this,"shownPose","");Ne(this,"cursors",[]);Ne(this,"link");Ne(this,"dwell",[]);Ne(this,"hold",[]);Ne(this,"arcs",[]);Ne(this,"orbitMeshes",[]);Ne(this,"disposables",[]);try{this.renderer=new km({canvas:e,alpha:!0,antialias:!0}),this.renderer.setClearColor(0,0),this.ok=!0}catch{return}this.scene.add(this.board);const t=(r,s,a,o)=>{const c=new Bt(new Vi(r,s,64),new bn({color:a,transparent:!0,opacity:o,blending:Or,depthWrite:!1}));return Fn(c,8e4),this.scene.add(c),this.disposables.push(c.geometry,c.material),c};this.ringOuter=t(.92,1,5032432,.95),this.ringHalo=t(.55,.9,5032432,.18),this.ringCore=new Bt(new Yr(.4,40),new bn({color:5032432,transparent:!0,opacity:.5,blending:Or,depthWrite:!1})),Fn(this.ringCore,8e4),this.scene.add(this.ringCore),this.disposables.push(this.ringCore.geometry,this.ringCore.material),this.medal=new Bt(new Yr(1,48),new bn({transparent:!0,depthWrite:!1})),this.medal.visible=!1,Fn(this.medal,80002),this.scene.add(this.medal),this.disposables.push(this.medal.geometry,this.medal.material),this.loadPoses();for(let r=0;r<3;r++){const s=new Bt(new Vi(.7,1,32),new bn({color:16777215,transparent:!0,opacity:.9,depthWrite:!1}));s.visible=!1,Fn(s,1e5),this.scene.add(s),this.cursors.push(s),this.disposables.push(s.geometry,s.material)}for(let r=1;r<=24;r++){const s=new Vi(1.25,1.55,40,1,Math.PI/2,-2*Math.PI*r/24);this.arcs.push(s),this.disposables.push(s)}for(let r=0;r<2;r++){const s=new Bt(this.arcs[0],new bn({color:6219432,transparent:!0,opacity:.95,depthWrite:!1,side:Zt}));s.visible=!1,Fn(s,100001),this.scene.add(s),this.dwell.push(s);const a=new Bt(this.arcs[0],new bn({color:16032353,transparent:!0,opacity:.95,depthWrite:!1,side:Zt}));a.visible=!1,Fn(a,100002),this.scene.add(a),this.hold.push(a),this.disposables.push(a.material),this.disposables.push(s.material)}const n=new on().setFromPoints([new H,new H]);this.link=new Bu(n,new Il({color:6219432,transparent:!0,opacity:.8})),this.link.visible=!1,Fn(this.link,99999),this.scene.add(this.link),this.disposables.push(n,this.link.material)}loadPoses(){const e=new Image;e.onload=()=>{for(const n of ic){const{col:r,row:s}=rc(n),a=document.createElement("canvas");a.width=a.height=256;const o=a.getContext("2d");if(!o)continue;o.drawImage(e,r*ts+20,s*sc+30,ts-40,ts-40,0,0,256,256),o.globalCompositeOperation="destination-in";const c=o.createRadialGradient(256/2,256/2,256*.36,256/2,256/2,256*.5);c.addColorStop(0,"#000"),c.addColorStop(1,"#0000"),o.fillStyle=c,o.fillRect(0,0,256,256);const l=new Is(a);l.colorSpace=zt,this.poseTex.set(n,l),this.disposables.push(l)}this.shownPose=""},e.src=Vm}resize(e,t){if(!this.ok)return;this.renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1)),this.renderer.setSize(e,t,!1);const n=40,r=t/2/Math.tan(n*Math.PI/360);this.cam.fov=n,this.cam.aspect=e/t,this.cam.near=10,this.cam.far=r*6,this.cam.position.set(e/2,-t/2,r),this.cam.lookAt(e/2,-t/2,0),this.cam.updateProjectionMatrix()}setCard(e,t,n,r){if(!this.ok)return;this.removeCard(e);const s=new Is(t);s.colorSpace=zt,s.anisotropy=4;const a=new bn({map:s,transparent:!0,depthWrite:!1,depthTest:!1,side:Zt}),o=new Bt(new Ti(n,r),a);this.meshes.set(e,o),this.board.add(o)}removeCard(e){var n;const t=this.meshes.get(e);t&&(this.board.remove(t),(n=t.material.map)==null||n.dispose(),t.material.dispose(),t.geometry.dispose(),this.meshes.delete(e))}touchCard(e){const t=this.meshes.get(e),n=t==null?void 0:t.material;n!=null&&n.map&&(n.map.needsUpdate=!0)}clearCards(){for(const e of[...this.meshes.keys()])this.removeCard(e)}setOrbits(e){var t;if(this.ok){for(const n of this.orbitMeshes)this.scene.remove(n),(t=n.material.map)==null||t.dispose(),n.material.dispose(),n.geometry.dispose();this.orbitMeshes=e.map(n=>{const r=document.createElement("canvas");r.width=r.height=128;const s=r.getContext("2d");s.beginPath(),s.arc(64,64,60,0,Math.PI*2),s.fillStyle="rgba(76,201,240,0.16)",s.fill(),s.lineWidth=3,s.strokeStyle="rgba(76,201,240,0.9)",s.stroke(),s.fillStyle="#e6edf5",s.font="600 22px system-ui, sans-serif",s.textAlign="center",s.textBaseline="middle";const a=n.label.split(" ");a.forEach((l,u)=>s.fillText(l,64,64+(u-(a.length-1)/2)*24));const o=new Is(r);o.colorSpace=zt;const c=new Bt(new Ti(2,2),new bn({map:o,transparent:!0,depthWrite:!1}));return Fn(c,9e4),this.scene.add(c),c})}}render(e,t,n,r){if(!this.ok)return;this.board.position.set(e.board.tx,-e.board.ty,0),this.board.scale.setScalar(e.board.scale);for(const[h,_]of this.meshes){const S=e.cards.get(h);if(!S){_.visible=!1;continue}_.visible=!0,_.position.set(S.x,-S.y,0),_.renderOrder=S.z+(S.held!==null?1e3:0),_.scale.setScalar(S.scale*(S.hover||S.held!==null?1.03:1)),_.rotation.set(-S.rx,S.ry,-S.rot,"ZXY"),_.material.opacity=S.held!==null?1:S.hover?.98:.9}const s=ac(t),a=1+.05*Math.sin(r*3)+Math.min(.5,n*3),o=e.ring.r,c=e.ring.bloom;for(const h of[this.ringOuter,this.ringHalo,this.ringCore])h.material.color.setHex(s),h.position.set(e.ring.x,-e.ring.y,0);this.ringOuter.scale.setScalar(o),this.ringOuter.rotation.z=r*(.4+1.6*c),this.ringHalo.scale.setScalar(o*a*(1+.15*c)),this.ringCore.scale.setScalar(o*(.8+.2*a)),this.ringCore.material.opacity=.35+.3*c;const l=oc(t),u=this.poseTex.get(l);if(this.medal.visible=!!u,this.ringCore.visible=!u,u){this.shownPose!==l&&(this.medal.material.map=u,this.medal.material.needsUpdate=!0,this.shownPose=l);const h=lc[t]??1.2;this.medal.position.set(e.ring.x,-e.ring.y,0),this.medal.scale.setScalar(o*.94*(1+.025*Math.sin(r*Math.PI*2/h)+Math.min(.2,n*1.5)))}this.orbitMeshes.forEach((h,_)=>{const S=e.orbits[_];if(!S||S.r<2){h.visible=!1;return}h.visible=!0,h.position.set(S.x,-S.y,0),h.scale.setScalar(S.r)}),this.cursors.forEach((h,_)=>{const S=e.slots[_];h.visible=S.visible,S.visible&&(h.position.set(S.cursor.x,-S.cursor.y,0),h.scale.setScalar(S.pinching?10:16),h.material.color.setHex(S.mode==="rotate"?16032353:S.pinching?6219432:_===2?15134197:5032432))}),this.dwell.forEach((h,_)=>{const S=e.slots[_];h.visible=S.visible&&S.dwell>.03,h.visible&&(h.geometry=this.arcs[Math.min(23,Math.floor(S.dwell*24))],h.position.set(S.cursor.x,-S.cursor.y,0),h.scale.setScalar(20))}),this.hold.forEach((h,_)=>{const S=e.slots[_];h.visible=S.visible&&S.pinching&&S.hold>.05,h.visible&&(h.geometry=this.arcs[Math.min(23,Math.floor(S.hold*24))],h.position.set(S.cursor.x,-S.cursor.y,0),h.scale.setScalar(26))});const f=e.slots[0],d=e.slots[1];if(this.link.visible=!!e.zoom,e.zoom){const h=this.link.geometry.attributes.position;h.setXYZ(0,f.cursor.x,-f.cursor.y,0),h.setXYZ(1,d.cursor.x,-d.cursor.y,0),h.needsUpdate=!0}this.renderer.render(this.scene,this.cam)}dispose(){this.ok&&(this.clearCards(),this.setOrbits([]),this.disposables.forEach(e=>e.dispose()),this.renderer.dispose())}}const nl=[{id:"files",label:"Archivos"},{id:"mic",label:"Mic"},{id:"arrange",label:"Ordenar"},{id:"clear",label:"Limpiar"}],On="files-list",un=7,Xm=600,qm={dir:"carpeta",image:"imagen",text:"texto",pdf:"PDF",other:"otro"},Fs=i=>i>1048576?`${(i/1048576).toFixed(1)} MiB`:i>1024?`${Math.round(i/1024)} KiB`:`${i} B`,Ym=()=>{try{const i=parseFloat(localStorage.getItem("piantao.pinch")??"");return i>=.25&&i<=.6?i:.34}catch{return .34}},Cr=(i,e)=>i?`${i}/${e}`:e;function il(i){return new Promise(e=>{const t=new Image;t.onload=()=>e(t),t.onerror=()=>e(null),t.src=i})}const Os=i=>i.startsWith("/")?i:`/media/${encodeURIComponent(i)}`;function Zm(i){var lt;const e=Ft(null),t=Ft(null),n=Ft(null),r=Ft(new Mc),s=Ft(),a=Ft(i);a.current=i;const o=Ft(new Set),c=Ft(new Map),l=Ft(new Map),u=Ft(new Map),f=Ft(new Map),d=Ft(null),h=Ft({ring:()=>{},orbit:I=>{},row:(I,te)=>{},tap:I=>{},close:I=>{},scroll:(I,te)=>{}}),[_,S]=Yn([]),[m,p]=Yn([]),[M,w]=Yn(null),[b,R]=Yn(!0),[A,g]=Yn(""),[y,z]=Yn(""),[D,U]=Yn(Ym),G=I=>{z(I),window.setTimeout(()=>z(""),4e3)},K=()=>{S([...o.current].map(I=>{var te;return{id:I,title:((te=c.current.get(I))==null?void 0:te.title)??I}})),p([...u.current.entries()].map(([I,te])=>({id:I,title:te.title}))),Y()},P=Ft("[]"),Y=(I=!1)=>{const te=[...u.current.keys()].map(Te=>{const ct=/^win-file-(\d+)-([\s\S]*)$/.exec(Te);return ct?{root:Number(ct[1]),path:ct[2]}:{card:Te.slice(4)}}),Me=JSON.stringify(te);!I&&Me===P.current||(P.current=Me,a.current.link.command("ui_context",{items:te}).catch(()=>{P.current="[]"}))},Z=I=>{d.current=I,w(I)};async function X(I){var ct;if(o.current.has(I.id))return;o.current.add(I.id),c.current.set(I.id,{title:I.title}),l.current.set(I.id,{title:I.title,text:I.full??I.text,image:I.image?Os(I.image):null,origin:I.origin,md:I.md??(I.origin==="model"||I.origin==="user")});const te=I.image?await il(Os(I.image)):null;if(!o.current.has(I.id))return;const Me=I.image&&!te?(I.text?I.text+`
`:"")+"(no se pudo cargar la imagen)":I.text,Te=yc({id:I.id,title:I.title,text:Me,origin:I.origin,image:te});r.current.addCard(I.id,Te.w,Te.h),(ct=s.current)==null||ct.setCard(I.id,Te.canvas,Te.w,Te.h),K()}function ie(I,te=!0){var Me;o.current.has(I)&&(o.current.delete(I),c.current.delete(I),l.current.delete(I),r.current.removeCard(I),(Me=s.current)==null||Me.removeCard(I),te&&a.current.onCloseCard(I),K())}async function q(I,te){var _t;const Me=`win-${I}`;if(r.current.cards.has(Me)){r.current.raise(Me);return}const Te=te.image?await il(Os(te.image)):null;if(r.current.cards.has(Me))return;const ct=te.image&&!Te?(te.text?te.text+`
`:"")+"(no se pudo cargar la imagen)":te.text,L=new wc({title:te.title,text:ct,image:Te,md:te.md,origin:te.origin});L.render(),u.current.set(Me,L),r.current.addCard(Me,At,Ht,{kind:"window",titleH:Gt}),(_t=s.current)==null||_t.setCard(Me,L.canvas,At,Ht),K()}function j(I){var te;u.current.delete(I),r.current.removeCard(I),(te=s.current)==null||te.removeCard(I),K()}function ee(I,te){var Te;const Me=u.current.get(I);Me&&Me.scrollBy(te)&&(Me.render(),(Te=s.current)==null||Te.touchCard(I))}function Se(I){var _t,nt;Z(I),f.current.clear();const te=[],Me=(ze,ae,st,we,Ie)=>{te.push({id:ze,label:ae,kind:st,hint:we}),f.current.set(ze,Ie)},Te=Math.max(1,Math.ceil(I.entries.length/un));I.root===null?I.roots.forEach(ze=>Me(`r${ze.root}`,ze.name,"root","carpeta",()=>void ve(ze.root,""))):(I.parent!==null?Me("up","Subir","up",void 0,()=>void ve(I.root,I.parent)):I.roots.length>1&&Me("up","Carpetas","up",void 0,()=>void pe()),I.entries.slice(I.page*un,I.page*un+un).forEach((ze,ae)=>Me(`e${ae}`,ze.name,ze.kind,ze.kind==="dir"?void 0:Fs(ze.size),()=>ze.kind==="dir"?void ve(I.root,Cr(I.path,ze.name)):void Pe(I.root,Cr(I.path,ze.name)))),I.page>0&&Me("prev","Anteriores","more",`${I.page}/${Te}`,()=>Se({...I,page:I.page-1})),I.page+1<Te&&Me("next","Más","more",`${I.page+2}/${Te}`,()=>Se({...I,page:I.page+1})));const ct=I.root===null?"Carpetas autorizadas":`/${((_t=I.roots.find(ze=>ze.root===I.root))==null?void 0:_t.name)??""}${I.path?"/"+I.path:""}`,L=Tc(ct,I.root===null?`${I.roots.length} carpetas`:`${I.entries.length} elementos`,te);r.current.cards.has(On)?r.current.resize(On,L.w,L.h,L.rows):r.current.addCard(On,L.w,L.h,{kind:"list",rows:L.rows}),(nt=s.current)==null||nt.setCard(On,L.canvas,L.w,L.h)}function Fe(){var I;Z(null),f.current.clear(),r.current.removeCard(On),(I=s.current)==null||I.removeCard(On)}async function J(){try{return(await a.current.link.command("files_roots")).filter(I=>I.exists)}catch{return[]}}async function pe(){try{const I=await J();if(I.length===0){G("No hay carpetas autorizadas para mostrar (permissions.yaml → file_access.allowed_dirs).");return}if(I.length===1){await ve(I[0].root,"",I);return}Se({root:null,path:"",parent:null,entries:[],page:0,roots:I})}catch(I){G(I.message)}}async function ve(I,te,Me){try{const Te=await a.current.link.command("files_list",{root:I,path:te});Se({root:I,path:Te.path,parent:Te.parent,entries:Te.entries,page:0,roots:Me??await J()}),Te.entries.length===0?G("Carpeta vacía"):Te.total>Te.entries.length&&G(`Se muestran ${Te.entries.length} de ${Te.total} elementos`)}catch(Te){G(Te.message)}}async function Pe(I,te){try{const Me=await a.current.link.command("files_read",{root:I,path:te});let Te=Me.text??"";Me.kind==="other"?Te=`Sin vista previa para este tipo de archivo (${Fs(Me.size)}).`:Me.kind==="pdf"&&!Te?Te="PDF sin texto extraíble (puede ser un escaneo).":Me.truncated&&(Te+=`
…`),await q(`file-${I}-${te}`,{title:Me.name,text:Me.kind==="image"?"":Te,image:Me.kind==="image"?Me.url??null:null,origin:"file",md:/\.(md|markdown)$/i.test(Me.name)})}catch(Me){G(Me.message)}}function me(){d.current?Fe():pe()}function Oe(){r.current.arrange()}function ht(){for(const I of[..._])ie(I.id);a.current.onClearBoard()}function De(){const I=!r.current.ring.open;r.current.setOpen(I);const te=a.current;te.vui.available&&(I&&te.vui.state==="off"||!I&&te.vui.state!=="off")&&te.onToggleMic()}h.current={ring:De,orbit:I=>{I==="files"?me():I==="mic"?a.current.onToggleMic():I==="arrange"?Oe():I==="clear"&&ht()},row:(I,te)=>{var Me;I===On&&((Me=f.current.get(te))==null||Me())},tap:I=>{const te=l.current.get(I);te&&q(I,te)},close:I=>{var te,Me;I===On?(Z(null),f.current.clear(),(te=s.current)==null||te.removeCard(I)):u.current.has(I)?(u.current.delete(I),(Me=s.current)==null||Me.removeCard(I),K()):ie(I)},scroll:ee},er(()=>{cc(D);try{localStorage.setItem("piantao.pinch",String(D))}catch{}},[D]),er(()=>{const I=e.current,te=t.current,Me=new Wm(te);s.current=Me,R(Me.ok);const Te=r.current;location.hash==="#holo-debug"&&(window.__holo=Te),Te.setOrbits(nl.map(N=>N.id)),Me.setOrbits(nl);const ct=()=>{const N=I.getBoundingClientRect();Te.setSize(N.width,N.height),Me.resize(N.width,N.height)};ct();const L=new ResizeObserver(ct);L.observe(I);const _t=new Sc;let nt=[null,null],ze=0;const ae=a.current.vision;ae.attach(n.current,null),ae.hands=(N,ne)=>{const T=I.getBoundingClientRect(),k=n.current,V={vw:(k==null?void 0:k.videoWidth)||640,vh:(k==null?void 0:k.videoHeight)||480,cw:T.width,ch:T.height,mirror:!0};nt=_t.process(N,ne,V),ze=performance.now()},ae.owner=()=>Te.ownsHands();let st=null;const we=(N,ne)=>{const T=te.getBoundingClientRect();return{x:N-T.left,y:ne-T.top}},Ie=N=>{st={cursor:we(N.clientX,N.clientY),pinching:!!(N.buttons&1),rotate:N.shiftKey}},E=N=>{N.button===0&&(te.setPointerCapture(N.pointerId),te.focus(),st={cursor:we(N.clientX,N.clientY),pinching:!0,rotate:N.shiftKey})},x=N=>{st={cursor:we(N.clientX,N.clientY),pinching:!1},N.pointerType!=="mouse"&&(st=null)},F=()=>{st=null},re=N=>{N.preventDefault();const ne=we(N.clientX,N.clientY),T=Te.windowAt(ne);T&&!N.ctrlKey?ee(T.id,N.deltaY/(T.scale*Te.board.scale)):Te.wheel(ne,Math.exp(-N.deltaY*.0015))},Q=()=>[...u.current.keys()].map(N=>Te.cards.get(N)).filter(N=>!!N).sort((N,ne)=>ne.z-N.z)[0]??null,le=N=>{const ne=N.target;if(ne&&(ne.tagName==="INPUT"||ne.tagName==="TEXTAREA"))return;const T=Q();if(!T)return;const k=u.current.get(T.id);if(N.key===" "&&a.current.vui.state!=="off"&&a.current.vui.mode==="ptt")return;const V={ArrowDown:60,ArrowUp:-60,PageDown:k.viewH*.9,PageUp:-k.viewH*.9," ":k.viewH*.9,Home:-1e9,End:1e9};N.key==="Escape"?(j(T.id),N.preventDefault()):N.key in V&&(ee(T.id,V[N.key]),N.preventDefault())};te.addEventListener("pointermove",Ie),te.addEventListener("pointerdown",E),te.addEventListener("pointerup",x),te.addEventListener("pointercancel",F),te.addEventListener("pointerleave",F),te.addEventListener("wheel",re,{passive:!1}),window.addEventListener("keydown",le);let ce=0;const $=()=>{ce=requestAnimationFrame($);const N=performance.now(),ne=N-ze>Xm?[null,null]:nt;for(const k of Te.update([ne[0]??null,ne[1]??null,st],N/1e3)){const V=h.current;k.type==="close"?V.close(k.id):k.type==="ring"?V.ring():k.type==="orbit"?V.orbit(k.id):k.type==="row"?V.row(k.id,k.row):k.type==="tap"?V.tap(k.id):k.type==="scroll"&&V.scroll(k.id,k.dy)}const T=a.current;Me.render(Te,T.state,T.vui.state==="listening"?T.vui.level:0,N/1e3)};return $(),()=>{cancelAnimationFrame(ce),L.disconnect(),te.removeEventListener("pointermove",Ie),te.removeEventListener("pointerdown",E),te.removeEventListener("pointerup",x),te.removeEventListener("pointercancel",F),te.removeEventListener("pointerleave",F),te.removeEventListener("wheel",re),window.removeEventListener("keydown",le),ae.hands=null,ae.owner=null,ae.attach(null,null),P.current="[]",a.current.link.command("ui_context",{items:[]}).catch(()=>{}),Me.dispose(),s.current=void 0,o.current.clear(),c.current.clear(),l.current.clear(),u.current.clear(),f.current.clear(),Te.clear()}},[]),er(()=>{const I=new Set(i.cards.map(te=>te.id));for(const te of i.cards)X({...te,full:te.text});for(const te of[...o.current])I.has(te)||ie(te,!1);K()},[i.cards]);const Je=[...i.msgs].reverse().find(I=>I.role==="assistant"),Qe=Je?Je.parts.filter(I=>I.k==="text").map(I=>I.t).join(""):"",We=i.busy?Qe.slice(-320):"",gt=Ft(i.busy);er(()=>{gt.current&&!i.busy&&Qe.trim()&&i.onPin(Qe.trim()),gt.current=i.busy},[i.busy]);const ot=i.vis.state==="on",St=i.vui.state!=="off";return Ce("div",{class:"holo",ref:e,children:[Ce("video",{ref:n,class:"holo-video",playsInline:!0,muted:!0,"aria-hidden":"true",style:{opacity:ot?.4:0}}),Ce("canvas",{ref:t,class:"holo-scene",tabIndex:0,"aria-label":"Tablero holográfico"}),Ce("div",{class:"holo-top",children:[Ce("button",{type:"button",class:"ghost",onClick:i.onExit,children:"← Volver al chat"}),Ce("details",{class:"holo-list",children:[Ce("summary",{children:["Tarjetas (",_.length,")"]}),_.length===0?Ce("p",{class:"muted small",children:"No hay tarjetas. Pedile a Piantao que te muestre algo."}):Ce("ul",{children:_.map(I=>Ce("li",{children:[Ce("span",{children:I.title})," ",Ce("span",{children:[Ce("button",{type:"button",class:"ghost",onClick:()=>{const te=l.current.get(I.id);te&&q(I.id,te)},children:"Abrir"})," ",Ce("button",{type:"button",class:"ghost",onClick:()=>ie(I.id),children:"Cerrar"})]})]},I.id))}),m.length>0&&Ce(Qa,{children:[Ce("p",{class:"small muted",children:"Ventanas abiertas"}),Ce("ul",{children:m.map(I=>Ce("li",{children:[Ce("span",{children:I.title})," ",Ce("button",{type:"button",class:"ghost",onClick:()=>j(I.id),children:"Cerrar"})]},I.id))})]})]}),Ce("details",{class:"holo-list holo-textfiles",open:!!M,children:[Ce("summary",{children:"Explorador (texto)"}),Ce("nav",{class:"holo-files","aria-label":"Explorador de archivos",children:M?Ce(Qa,{children:[Ce("p",{class:"small muted",children:M.root===null?"Carpetas autorizadas":`/${((lt=M.roots.find(I=>I.root===M.root))==null?void 0:lt.name)??""}${M.path?"/"+M.path:""}`}),Ce("ul",{children:[M.root!==null&&M.parent!==null&&Ce("li",{children:Ce("button",{type:"button",class:"linklike",onClick:()=>void ve(M.root,M.parent),children:"⬑ Subir"})}),M.root!==null&&M.parent===null&&M.roots.length>1&&Ce("li",{children:Ce("button",{type:"button",class:"linklike",onClick:()=>void pe(),children:"⬑ Carpetas"})}),M.root===null&&M.roots.map(I=>Ce("li",{children:Ce("button",{type:"button",class:"linklike",onClick:()=>void ve(I.root,""),children:["📁 ",I.name]})},I.root)),M.root!==null&&M.entries.slice(M.page*un,M.page*un+un).map(I=>Ce("li",{children:[Ce("button",{type:"button",class:"linklike",onClick:()=>I.kind==="dir"?void ve(M.root,Cr(M.path,I.name)):void Pe(M.root,Cr(M.path,I.name)),children:I.name})," ",Ce("span",{class:"small muted",children:[qm[I.kind]??I.kind,I.kind!=="dir"?` · ${Fs(I.size)}`:""]})]},I.name))]}),M.root!==null&&M.entries.length>un&&Ce("p",{class:"small",children:[Ce("button",{type:"button",class:"ghost",disabled:M.page===0,onClick:()=>Se({...M,page:M.page-1}),children:"◂"})," ",M.page+1,"/",Math.ceil(M.entries.length/un)," ",Ce("button",{type:"button",class:"ghost",disabled:(M.page+1)*un>=M.entries.length,onClick:()=>Se({...M,page:M.page+1}),children:"▸"})]})]}):Ce("p",{children:Ce("button",{type:"button",class:"linklike",onClick:me,children:"Abrir explorador"})})})]}),Ce("span",{class:"small muted holo-help",children:[St&&i.vui.mode==="ptt"?"Mantené la barra espaciadora para hablar · ":"",ot?"Tocá el núcleo para desplegar · apuntá y esperá 1 s = clic · pellizco: mover · quieto 1 s: girar en 3D · dos manos: zoom":"Clic en una tarjeta para abrirla · arrastrar: mover · Shift+arrastrar: girar 3D · rueda: zoom o desplazar"]}),!b&&Ce("p",{class:"error small",role:"alert",children:"Este navegador no pudo iniciar WebGL: usá las listas de texto."}),y&&Ce("p",{class:"error small",role:"alert",children:y})]}),We&&Ce("p",{class:"holo-caption",role:"status","aria-live":"polite",children:We}),Ce("form",{class:"holo-bar",onSubmit:I=>{I.preventDefault();const te=A.trim();te&&!i.busy&&i.connected&&(i.onSend(te),g(""))},children:[Ce("input",{class:"holo-input",value:A,maxLength:8e3,"aria-label":"Mensaje",placeholder:i.connected?"Escribile a Piantao...":"Sin conexion...",onInput:I=>g(I.target.value)}),i.busy?Ce("button",{type:"button",class:"stop",onClick:i.onStop,children:"Detener"}):Ce("button",{type:"submit",disabled:!A.trim()||!i.connected,children:"Enviar"}),i.vui.available&&Ce("button",{type:"button",class:St?"mic mic-on":"ghost","aria-pressed":St,onClick:i.onToggleMic,children:St?"Apagar mic":"Micrófono"}),i.vis.available&&Ce("button",{type:"button",class:ot?"mic mic-on":"ghost","aria-pressed":ot,disabled:i.vis.state==="loading",onClick:i.onToggleCam,children:ot?"Apagar cámara":i.vis.state==="loading"?"Cargando...":"Cámara y manos"}),Ce("button",{type:"button",class:"ghost",onClick:me,children:"Archivos"}),Ce("button",{type:"button",class:"ghost",onClick:Oe,children:"Ordenar"}),Ce("button",{type:"button",class:"ghost",onClick:()=>r.current.resetView(),children:"Vista 1:1"}),Ce("button",{type:"button",class:"ghost",disabled:_.length===0,onClick:ht,children:"Limpiar"}),ot&&Ce("label",{class:"small holo-sens",title:"Más a la derecha = pellizca con más facilidad",children:["Pellizco ",Ce("input",{type:"range",min:"0.25",max:"0.6",step:"0.01",value:D,"aria-label":"Sensibilidad del pellizco",onInput:I=>U(parseFloat(I.target.value))})]})]}),i.vis.error&&Ce("p",{class:"error small holo-err",role:"alert",children:i.vis.error})]})}export{Zm as Holo};
