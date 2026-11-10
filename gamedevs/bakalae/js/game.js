const $=s=>document.querySelector(s),V=THREE.Vector3,PI=Math.PI,rnd=(a,b)=>a+Math.random()*(b-a),lerp=(a,b,t)=>a+(b-a)*t,R=10;
let ren;try{ren=new THREE.WebGLRenderer({canvas:$('#c'),antialias:true,powerPreference:'high-performance'})}catch(e){document.body.innerHTML='<p style="padding:30px">WebGL tidak didukung di browser ini.</p>';throw e}
ren.setPixelRatio(Math.min(devicePixelRatio,1.75));ren.shadowMap.enabled=true;ren.shadowMap.type=THREE.PCFSoftShadowMap;ren.toneMapping=THREE.ACESFilmicToneMapping;ren.toneMappingExposure=1.25;ren.outputEncoding=THREE.sRGBEncoding;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0x2a3a64,30,95);
const cam=new THREE.PerspectiveCamera(58,1,.1,300);
function rs(){const w=innerWidth,h=innerHeight;ren.setSize(w,h,false);cam.aspect=w/h;cam.fov=w/h<1.3?74:58;cam.updateProjectionMatrix()}
addEventListener('resize',rs);rs();

/* ===== Lingkungan Arena ===== */
scene.add(new THREE.Mesh(new THREE.SphereGeometry(150,24,16),new THREE.ShaderMaterial({side:THREE.BackSide,fog:false,depthWrite:false,vertexShader:'varying float h;void main(){h=normalize(position).y;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying float h;void main(){vec3 a=vec3(.98,.55,.4),b=vec3(.2,.3,.6),c=vec3(.03,.06,.18);gl_FragColor=vec4(mix(mix(a,b,smoothstep(-.05,.28,h)),c,smoothstep(.2,.85,h)),1.);}'})));
const sp=[];for(let i=0;i<300;i++){const a=rnd(0,PI*2),e=rnd(.15,1.4);sp.push(Math.cos(a)*Math.cos(e)*120,Math.sin(e)*120,Math.sin(a)*Math.cos(e)*120)}
const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sp,3));scene.add(new THREE.Points(sg,new THREE.PointsMaterial({size:1.6,sizeAttenuation:false,fog:false,color:0xcfe6ff})));
scene.add(new THREE.HemisphereLight(0xaecdff,0x2b2440,.8));
const sun=new THREE.DirectionalLight(0xffd7a8,1.3);sun.position.set(-8,16,10);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:1,far:45});sun.shadow.camera.updateProjectionMatrix();sun.shadow.bias=-.0006;scene.add(sun);
[[0x2ee6c8,-9,-9],[0xff4d5e,9,9]].forEach(([c,x,z])=>{const l=new THREE.PointLight(c,1.5,24);l.position.set(x,4,z);scene.add(l)});
const stone=c=>new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.85});
const tx=(()=>{const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');for(let y=0;y<4;y++)for(let x=0;x<4;x++){const v=96+((x+y)&1)*16+rnd(0,14)|0;g.fillStyle=`rgb(${v},${v+8},${v+22})`;g.fillRect(x*64,y*64,64,64);g.strokeStyle='rgba(5,10,25,.55)';g.lineWidth=4;g.strokeRect(x*64,y*64,64,64)}const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(3,3);t.encoding=THREE.sRGBEncoding;t.anisotropy=4;return t})();
const fl=new THREE.Mesh(new THREE.CylinderGeometry(11.4,12.6,1.4,10),new THREE.MeshStandardMaterial({map:tx,flatShading:true,roughness:.8}));fl.position.y=-.7;fl.receiveShadow=true;scene.add(fl);
const rg=(a,b,c,o)=>{const m=new THREE.Mesh(new THREE.RingGeometry(a,b,48),new THREE.MeshBasicMaterial({color:c,transparent:true,opacity:o,side:THREE.DoubleSide}));m.rotation.x=-PI/2;m.position.y=.03;scene.add(m)};
rg(9.7,9.95,0x2ee6c8,.85);rg(4.3,4.45,0x4da6ff,.6);rg(.01,.3,0x4da6ff,.7);
const gm=stone(0x6b7896),gd=stone(0x3b4666);
for(let i=0;i<24;i++){const a=i/24*PI*2,b=new THREE.Mesh(new THREE.BoxGeometry(2.2,.5+(i%2)*.25,.9),gd);b.position.set(Math.cos(a)*10.7,.2,Math.sin(a)*10.7);b.rotation.y=-a+PI/2;b.castShadow=b.receiveShadow=true;scene.add(b)}
const FL=[];
for(let i=0;i<8;i++){const a=i/8*PI*2+PI/8,c=i%2?0xff4d5e:0x2ee6c8,p=new THREE.Group();p.position.set(Math.cos(a)*12.9,0,Math.sin(a)*12.9);p.rotation.y=-a;
 const add=(g,m,y)=>{const o=new THREE.Mesh(g,m);o.position.y=y;o.castShadow=o.receiveShadow=true;p.add(o);return o};
 add(new THREE.BoxGeometry(2,.8,2),gd,.4);add(new THREE.CylinderGeometry(.6,.8,7,6),gm,4.3);add(new THREE.BoxGeometry(1.6,.5,1.6),gd,8);add(new THREE.IcosahedronGeometry(.4,0),new THREE.MeshBasicMaterial({color:c}),8.8);
 const fg=new THREE.PlaneGeometry(2,1.1,8,3),f=new THREE.Mesh(fg,new THREE.MeshStandardMaterial({color:c,side:THREE.DoubleSide,flatShading:true,emissive:c,emissiveIntensity:.3}));f.position.set(-1.7,6.4,0);p.add(f);FL.push([fg,i]);scene.add(p)}
const mm=new THREE.MeshStandardMaterial({color:0x1d2a52,flatShading:true,roughness:1});
for(let i=0;i<18;i++){const h=rnd(14,36),a=i/18*PI*2,m=new THREE.Mesh(new THREE.ConeGeometry(rnd(9,18),h,5),mm),d=rnd(58,80);m.position.set(Math.cos(a)*d,h/2-4,Math.sin(a)*d);scene.add(m)}
const RK=[];for(let i=0;i<10;i++){const m=new THREE.Mesh(new THREE.IcosahedronGeometry(rnd(.8,2.2),0),gm),a=rnd(0,PI*2),d=rnd(20,36);m.position.set(Math.cos(a)*d,rnd(3,13),Math.sin(a)*d);m.castShadow=true;scene.add(m);RK.push(m)}

/* ===== Petarung ===== */
const ATK={punch:{dur:.38,hit:.14,dmg:9,cd:.38,range:1.95,arc:.55,kb:1.5,stun:.28,fr:.05,sh:.05,col:0xffd166},kick:{dur:.58,hit:.24,dmg:15,cd:.62,range:2.35,arc:.55,kb:3,stun:.4,fr:.08,sh:.1,col:0xff9a3c},skill:{dur:.85,hit:.38,dmg:26,cd:5.5,range:4.3,arc:.1,kb:8,stun:.7,fr:.12,sh:.3,col:0x2ee6c8}};
const CDT={punch:.38,kick:.62,skill:5.5,dodge:.9};

function playAnim(f,name,loop=false,timeScale=1.0){
 if(!f.actions||!f.actions[name])return;
 const next=f.actions[name];
 if(f.curAction===next&&next.isRunning()&&loop)return;
 next.reset();
 next.setLoop(loop?THREE.LoopRepeat:THREE.LoopOnce,loop?Infinity:1);
 next.clampWhenFinished=!loop;
 next.timeScale=timeScale;
 if(f.curAction&&f.curAction!==next){
  f.curAction.fadeOut(0.12);
  next.fadeIn(0.12);
 }
 next.play();
 f.curAction=next;
}

function mk(name,col,acc){
 const g=new THREE.Group(),fm=[];g.rotation.order='YXZ';
 const boxGroup=new THREE.Group();g.add(boxGroup);
 const M=c=>{const m=new THREE.MeshStandardMaterial({color:c,flatShading:true,roughness:.65,metalness:.15,emissive:0xffffff,emissiveIntensity:0});fm.push(m);return m};
 const cl=M(col),ac=M(acc),sk=M(0xe8b894),dk=M(0x1a2236),vz=new THREE.MeshBasicMaterial({color:acc});
 const bx=(w,h,d,m,x,y,z,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o};
 const hip=new THREE.Group();hip.position.y=1.2;boxGroup.add(hip);bx(.7,.35,.45,dk,0,0,0,hip);
 const to=new THREE.Group();to.position.y=.15;hip.add(to);
 bx(.95,.95,.55,cl,0,.5,0,to);bx(.97,.22,.57,ac,0,.1,0,to);bx(.5,.5,.06,ac,0,.65,.3,to);
 const hd=new THREE.Group();hd.position.y=1.3;to.add(hd);bx(.5,.5,.5,sk,0,.25,0,hd);bx(.56,.2,.56,dk,0,.47,0,hd);bx(.4,.1,.06,vz,0,.28,.26,hd);
 const lb=(par,x,y,u,l,w,m1,m2,m3,ft)=>{const a=new THREE.Group();a.position.set(x,y,0);par.add(a);bx(w,u,w,m1,0,-u/2,0,a);const b=new THREE.Group();b.position.y=-u;a.add(b);bx(w*.9,l,w*.9,m2,0,-l/2,0,b);bx(w*1.15,ft?.18:w*1.15,ft?w*2:w*1.15,m3,0,-l,ft?.1:0,b);return[a,b]};
 const ring=new THREE.Mesh(new THREE.RingGeometry(.9,1,40),new THREE.MeshBasicMaterial({color:acc,transparent:true,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=-PI/2;ring.visible=false;ring.userData.t=0;scene.add(ring);
 scene.add(g);
 return{
  name,g,boxGroup,hip,to,hd,fm,ring,ph:rnd(0,6),mx:0,mz:0,
  la:lb(to,-.62,.88,.45,.45,.24,cl,sk,sk),ra:lb(to,.62,.88,.45,.45,.24,cl,sk,sk),
  ll:lb(hip,-.22,-.1,.55,.55,.3,dk,dk,ac,1),rl:lb(hip,.22,-.1,.55,.55,.3,dk,dk,ac,1),
  mesh3d:null,mixer:null,actions:{},curAction:null,mats3d:[]
 };
}

const PL=mk('KAEL',0x1c8fb5,0x2ee6c8),AI=mk('VORAX',0x8f2535,0xff4d5e);

function rf(f,x,yaw){
 Object.assign(f,{hp:100,state:'idle',t:0,at:null,type:'',hit:false,cd:{punch:0,kick:0,skill:0,dodge:0},inv:0,flash:0,combo:0,comboT:0,blk:false,hand:0,walk:0,stun:0,kv:new V(),dv:new V(),yaw,th:.8,mode:'chase',sd:1,mx:0,mz:0});
 f.g.position.set(x,0,0);
 f.g.rotation.set(0,yaw,0);
 f.ring.visible=false;
 if(f.mesh3d){
  f.mesh3d.rotation.set(0,0,0);
  f.mesh3d.position.set(0,0,0);
  playAnim(f,'idle',true,1.0);
 }
}
rf(PL,-3,PI/2);rf(AI,3,-PI/2);

/* ===== Audio Prosedural Arena (Web Audio API) ===== */
const snd=(()=>{
 let ctx=null;
 function getCtx(){
  if(!ctx&&(window.AudioContext||window.webkitAudioContext)){
   ctx=new(window.AudioContext||window.webkitAudioContext)();
  }
  if(ctx&&ctx.state==='suspended')ctx.resume();
  return ctx;
 }
 function noise(c,dur,gainVal,fStart,fEnd){
  const now=c.currentTime,bSize=c.sampleRate*dur,buf=c.createBuffer(1,bSize,c.sampleRate),data=buf.getChannelData(0);
  for(let i=0;i<bSize;i++)data[i]=(Math.random()*2-1)*Math.exp(-i/(c.sampleRate*(dur*0.4)));
  const src=c.createBufferSource();src.buffer=buf;
  const flt=c.createBiquadFilter();flt.type='lowpass';
  flt.frequency.setValueAtTime(fStart,now);flt.frequency.exponentialRampToValueAtTime(fEnd,now+dur);
  const g=c.createGain();g.gain.setValueAtTime(gainVal,now);g.gain.exponentialRampToValueAtTime(0.001,now+dur);
  src.connect(flt);flt.connect(g);g.connect(c.destination);
  src.start(now);
 }
 function tone(c,freq,dur,type='sine',gainVal=0.3,fEnd=null){
  const now=c.currentTime,osc=c.createOscillator(),g=c.createGain();
  osc.type=type;osc.frequency.setValueAtTime(freq,now);
  if(fEnd)osc.frequency.exponentialRampToValueAtTime(fEnd,now+dur);
  g.gain.setValueAtTime(gainVal,now);g.gain.exponentialRampToValueAtTime(0.001,now+dur);
  osc.connect(g);g.connect(c.destination);
  osc.start(now);osc.stop(now+dur+0.01);
 }
 return{
  init:getCtx,
  punch:()=>{const c=getCtx();if(!c)return;noise(c,0.12,0.35,1200,300);tone(c,160,0.14,'triangle',0.45,45)},
  kick:()=>{const c=getCtx();if(!c)return;noise(c,0.18,0.45,900,200);tone(c,240,0.22,'sawtooth',0.5,38)},
  block:()=>{const c=getCtx();if(!c)return;tone(c,1100,0.15,'triangle',0.4,400);tone(c,820,0.18,'sine',0.3,300);noise(c,0.06,0.25,2200,800)},
  dodge:()=>{const c=getCtx();if(!c)return;noise(c,0.15,0.2,800,250)},
  skill:()=>{const c=getCtx();if(!c)return;tone(c,180,0.45,'sawtooth',0.55,750);setTimeout(()=>{const c2=getCtx();if(!c2)return;noise(c2,0.4,0.6,1800,150);tone(c2,90,0.5,'sine',0.7,30)},300)},
  ko:()=>{const c=getCtx();if(!c)return;noise(c,0.6,0.8,1400,100);tone(c,120,0.8,'sawtooth',0.8,25)},
  win:()=>{const c=getCtx();if(!c)return;const notes=[261.63,329.63,392.00,523.25];notes.forEach((freq,i)=>{setTimeout(()=>{const c3=getCtx();if(!c3)return;tone(c3,freq,0.35,'triangle',0.35)},i*110)})},
  tick:()=>{const c=getCtx();if(!c)return;tone(c,880,0.06,'sine',0.25)}
 };
})();
['pointerdown','keydown'].forEach(evt=>window.addEventListener(evt,()=>snd.init(),{once:true}));

/* ===== Partikel & HUD ===== */
const pg=new THREE.TetrahedronGeometry(.12,0),PS=[],tv=new V(),pv=new V();
for(let i=0;i<64;i++){const m=new THREE.Mesh(pg,new THREE.MeshBasicMaterial({color:0xffffff}));m.visible=false;scene.add(m);PS.push({m,v:new V(),l:0})}
function burst(p,c,n,s){for(const q of PS){if(n<=0)break;if(q.l>0)continue;q.l=.5;q.m.visible=true;q.m.material.color.setHex(c);q.m.position.copy(p);q.v.set(rnd(-1,1),rnd(.3,1.5),rnd(-1,1)).multiplyScalar(s);n--}}
function pop(t,p,c){const e=document.createElement('div');e.className='pop '+c;e.textContent=t;pv.set(p.x,2.9,p.z).project(cam);e.style.left=(pv.x*.5+.5)*innerWidth+'px';e.style.top=(-pv.y*.5+.5)*innerHeight+'px';$('#fx').appendChild(e);setTimeout(()=>e.remove(),900)}
const flash=e=>{e.classList.remove('on');void e.offsetWidth;e.classList.add('on')};
function setHP(f){const k=f===PL?'P':'A';$('#f'+k).style.width=$('#g'+k).style.width=f.hp+'%';$('#v'+k).textContent=Math.ceil(f.hp);$('#f'+k).parentElement.parentElement.classList.toggle('low',f.hp<30)}

/* ===== Game State & Pertarungan ===== */
const G={st:'START',time:90,freeze:0,shake:0,slow:0,t:0};let endT=0,buf={type:'',t:0};
const setS=s=>{G.st=s;document.body.dataset.s=s};

function act(f,type){
 if(G.st!=='PLAYING'||(f.state!=='idle'&&f.state!=='block')||f.cd[type]>0)return false;
 f.t=0;
 if(type==='dodge'){
  f.cd.dodge=.9;f.state='dodge';f.inv=.3;
  let x=f.mx,z=f.mz,l=Math.hypot(x,z);
  if(l<.1){x=-Math.sin(f.yaw);z=-Math.cos(f.yaw);l=1}
  f.dv.set(x/l,0,z/l);tv.set(f.g.position.x,.2,f.g.position.z);
  burst(tv,0x8ffff2,8,3);snd.dodge();
  playAnim(f,'dodge',false,2.2);
 }else{
  const A=ATK[type];f.at=A;f.type=type;f.state='atk';f.hit=false;f.cd[type]=A.cd;f.hand^=1;
  if(type==='skill')snd.skill();
  const speed=type==='punch'?1.4:type==='kick'?1.5:1.25;
  playAnim(f,type,false,speed);
 }
 return true;
}

function strike(a,d){
 if(G.st!=='PLAYING')return;
 const A=a.at,ap=a.g.position,dp=d.g.position,dx=dp.x-ap.x,dz=dp.z-ap.z,dist=Math.hypot(dx,dz)||1;
 if(a.type==='skill'){a.ring.visible=true;a.ring.userData.t=0;a.ring.position.set(ap.x,.1,ap.z);tv.set(ap.x,.4,ap.z);burst(tv,0x2ee6c8,20,6);a.kv.set(Math.sin(a.yaw)*5,0,Math.cos(a.yaw)*5);G.shake=Math.max(G.shake,.15)}
 const dot=(dx*Math.sin(a.yaw)+dz*Math.cos(a.yaw))/dist;
 if(dist>A.range||dot<A.arc||d.state==='ko')return;
 if(d.inv>0){pop('DODGE!',dp,'dg');snd.dodge();return}
 const bl=d.state==='block'&&(-dx*Math.sin(d.yaw)-dz*Math.cos(d.yaw))/dist>.2,dmg=Math.round(A.dmg*(bl?.25:1));
 d.hp=Math.max(0,d.hp-dmg);setHP(d);
 tv.set(dp.x,1.8,dp.z);burst(tv,bl?0x9fd8ff:A.col,bl?8:16,bl?4:6.5);
 d.flash=bl?.4:1;const k=A.kb*(bl?.5:1);d.kv.set(dx/dist*k,0,dz/dist*k);
 if(!bl){d.state='hit';d.t=0;d.stun=A.stun;if(a.type==='punch')snd.punch();else if(a.type==='kick')snd.kick()}
 else{snd.block()}
 G.freeze=bl?.03:A.fr;G.shake=Math.max(G.shake,bl?.06:A.sh);
 pop(bl?'BLOCK -'+dmg:'-'+dmg,dp,bl?'bk':d===PL?'pl':'ai');
 if(d===PL&&!bl)flash($('#vig'));
 if(!bl){a.combo=a.comboT>0?a.combo+1:1;a.comboT=1.6;if(a===PL&&a.combo>1){const c=$('#combo');c.textContent=a.combo+' HIT COMBO!';flash(c)}}
 if(d.hp<=0)finish(a,'ko');
}

function finish(w,why){
 if(G.st!=='PLAYING')return;setS('FINISHED');G.slow=1;
 if(why==='ko')snd.ko();
 for(const f of[PL,AI]){f.blk=false;if(f.hp<=0){f.state='ko';f.t=0}else{f.state=w===f?'win':'idle';playAnim(f,'idle',true,1.0)}}
 const win=w===PL,dr=!w;
 if(win){try{localStorage.setItem('gamedev_meta_arena_champion','1');localStorage.setItem('gamedev_meta_arena_wins',(parseInt(localStorage.getItem('gamedev_meta_arena_wins')||0)+1).toString());}catch(e){};setTimeout(()=>snd.win(),300)}
 $('#rI').textContent=dr?'＝':win?'✔':'✖';$('#rT').textContent=dr?'SERI':win?'MENANG':'KALAH';$('#ovEnd').dataset.r=dr?'d':win?'w':'l';
 $('#rS').textContent=why==='ko'?(win?'K.O.! VORAX tumbang.':'K.O. — KAEL dikalahkan VORAX.'):dr?'Waktu habis, HP sama kuat.':win?'Waktu habis — HP kamu lebih tinggi.':'Waktu habis — HP VORAX lebih tinggi.';
 $('#rH').textContent=`KAEL ${Math.ceil(PL.hp)} HP  ·  VORAX ${Math.ceil(AI.hp)} HP`;
 endT=setTimeout(()=>$('#ovEnd').classList.add('on'),1100);
}

function start(){
 clearTimeout(endT);rf(PL,-3,PI/2);rf(AI,3,-PI/2);setHP(PL);setHP(AI);G.time=90;G.slow=G.freeze=G.shake=0;buf.t=0;
 PS.forEach(q=>{q.l=0;q.m.visible=false});$('#ovEnd').classList.remove('on');$('#combo').classList.remove('on');setS('PLAYING');document.activeElement&&document.activeElement.blur();
}
const pause=()=>{if(G.st==='PLAYING'){PL.blk=false;setS('PAUSED')}},resume=()=>{if(G.st==='PAUSED')setS('PLAYING')};

/* ===== AI ===== */
function ai(dt){
 const a=AI,p=PL,dx=p.g.position.x-a.g.position.x,dz=p.g.position.z-a.g.position.z,d=Math.hypot(dx,dz)||1,nx=dx/d,nz=dz/d;
 a.th-=dt;
 if(a.th<=0){
  const r=Math.random(),q=Math.random();a.th=rnd(.22,.5);a.sd=q<.5?-1:1;
  if(d>2.35){a.mode=r<.78?'chase':'strafe';if(d<4.1&&a.cd.skill<=0&&r>.95)act(a,'skill')}
  else if(p.state==='atk'&&r<.42){a.mode='guard';a.th=rnd(.4,.7)}
  else if(p.state==='atk'&&r<.52){act(a,'dodge');a.mode='back'}
  else if(r<.58){a.mode='fight';act(a,a.cd.skill<=0&&q<.2?'skill':q<.5?'kick':'punch')}
  else if(r<.78){a.mode='guard';a.th=rnd(.3,.6)}
  else a.mode=q<.5?'strafe':'back'}
 if(a.mode==='guard'&&p.state!=='atk'&&d>2.1){a.mode='chase';a.th=rnd(.15,.35)}
 a.blk=a.mode==='guard';let mx=0,mz=0;
 if(a.mode==='chase'&&d>1.8){mx=nx;mz=nz}else if(a.mode==='strafe'){mx=-nz*a.sd+nx*.3;mz=nx*a.sd+nz*.3}else if(a.mode==='back'){mx=-nx;mz=-nz}
 a.mx=mx;a.mz=mz;
}

/* ===== Update Pose & Animasi ===== */
function upd(f,o,dt,sp){
 const g=f.g.position,op=o.g.position;f.t+=dt;f.inv=Math.max(0,f.inv-dt);f.flash=Math.max(0,f.flash-dt*3.5);f.comboT-=dt;
 for(const k in f.cd)f.cd[k]=Math.max(0,f.cd[k]-dt);
 const S=f.state;
 if(G.st==='PLAYING'){
  if(S==='idle'||S==='block'){f.state=f.blk?'block':'idle';const m=f.blk?.45:1;g.x+=f.mx*sp*m*dt;g.z+=f.mz*sp*m*dt;f.walk+=Math.hypot(f.mx,f.mz)*dt*9}
  else if(S==='dodge'){const v=12*(1-f.t/.28)+3;g.x+=f.dv.x*v*dt;g.z+=f.dv.z*v*dt;if(f.t>.28){f.state='idle';playAnim(f,'idle',true,1.0)}}
  else if(S==='atk'){if(!f.hit&&f.t>=f.at.hit){f.hit=true;strike(f,o)}if(f.t>=f.at.dur&&f.state==='atk'){f.state='idle';playAnim(f,'idle',true,1.0)}}
  else if(S==='hit'&&f.t>=f.stun){f.state='idle';playAnim(f,'idle',true,1.0)}
 }
 g.addScaledVector(f.kv,dt);f.kv.multiplyScalar(Math.exp(-9*dt));
 const h=Math.hypot(g.x,g.z);if(h>R){g.x*=R/h;g.z*=R/h}
 if(f.state!=='dodge'&&f.state!=='ko'){const d=Math.atan2(op.x-g.x,op.z-g.z)-f.yaw;f.yaw+=Math.atan2(Math.sin(d),Math.cos(d))*Math.min(1,dt*14)}
 f.g.rotation.y=f.yaw;

 if(f.mixer){
  f.mixer.update(dt);
  // Tangani transisi aksi block vs idle
  if(f.state==='block'&&f.curAction!==f.actions.block){
   playAnim(f,'block',true,1.0);
  }else if(f.state==='idle'&&f.curAction===f.actions.block){
   playAnim(f,'idle',true,1.0);
  }
  // Langkah kaki / gait saat berjalan
  if(f.mesh3d){
   if(f.state==='idle'&&Math.hypot(f.mx,f.mz)>0.05){
    f.mesh3d.position.y=Math.abs(Math.sin(f.walk))*0.04;
    f.mesh3d.rotation.z=Math.sin(f.walk)*0.04;
   }else if(f.state==='hit'){
    f.mesh3d.rotation.x=-0.25*Math.sin(Math.min(PI,f.t*25));
   }else if(f.state==='ko'){
    f.mesh3d.rotation.x=lerp(f.mesh3d.rotation.x,-PI/2,Math.min(1,dt*8));
    f.mesh3d.position.y=0.15;
   }else if(f.state!=='dodge'){
    f.mesh3d.rotation.x=0;
    f.mesh3d.rotation.z=0;
    f.mesh3d.position.y=0;
   }
   for(const m of f.mats3d){
    if(m.emissive){
     m.emissive.setHex(f.flash>0?0xffffff:0x000000);
     m.emissiveIntensity=f.flash*0.8;
    }
   }
  }
 }else{
  pose(f,dt);
 }
}

function pose(f,dt){
 const S=f.state,k=1-Math.exp(-18*dt),T={la:[-.7,-1.6],ra:[-.7,-1.6],ll:[-.2,.35],rl:[.2,.35],tw:0,tx:.06,hy:1.2+Math.sin(G.t*3+f.ph)*.025,rx:0,py:0},sw=Math.sin(f.walk)*.6;
 if(S==='idle'||S==='block'){T.ll[0]+=sw;T.rl[0]-=sw;T.hy-=Math.abs(sw)*.05}
 if(S==='block'){T.la=[-1,-1.9];T.ra=[-1,-1.9];T.tx=.15;T.hy=1.08}
 else if(S==='atk'){
  const A=f.at,p=f.t/A.dur,h=A.hit/A.dur,s=p<h?p/h:Math.max(0,1-(p-h)/(1-h));
  if(f.type==='punch'){const a=f.hand?T.ra:T.la;a[0]=lerp(-.7,-1.5,s);a[1]=lerp(-1.6,-.05,s);T.tw=(f.hand?-.55:.55)*s;T.ll=[-.35,.5];T.rl=[.35,.4]}
  else if(f.type==='kick'){T.rl=[lerp(.2,-1.55,s),lerp(.5,.05,s)];T.ll=[-.15,.45];T.tx=-.35*s;T.hy=1.1}
  else if(p<h){const c=p/h;T.la=[lerp(-.7,.5,c),-.9];T.ra=[lerp(-.7,.5,c),-.9];T.hy=1.2-.35*c;T.tx=-.3*c;f.flash=Math.max(f.flash,.25+.2*Math.sin(f.t*50))}
  else{T.la=[-1.57,-.05];T.ra=[-1.57,-.05];T.tx=.4;T.hy=1.1;T.ll=[-.5,.5];T.rl=[.5,.3]}}
 else if(S==='hit'){T.tx=-.45;T.la=[.3,-.3];T.ra=[.3,-.3];T.hy=1.1}
 else if(S==='dodge'){T.tx=.7;T.hy=.75;T.la=[-.4,-1.2];T.ra=[-.4,-1.2];T.ll=[-.8,1];T.rl=[-.8,1]}
 else if(S==='win'){T.la=[-2.9,-.1];T.ra=[-2.9,-.1];T.tx=-.1}
 else if(S==='ko'){T.la=[.4,-.2];T.ra=[.4,-.2];T.ll=[.15,.15];T.rl=[.15,.15];T.tx=0;T.hy=1;T.rx=-1.5;T.py=.35}
 const ap=(j,v)=>{j[0].rotation.x+=(v[0]-j[0].rotation.x)*k;j[1].rotation.x+=(v[1]-j[1].rotation.x)*k};
 ap(f.la,T.la);ap(f.ra,T.ra);ap(f.ll,T.ll);ap(f.rl,T.rl);
 f.to.rotation.y+=(T.tw-f.to.rotation.y)*k;f.to.rotation.x+=(T.tx-f.to.rotation.x)*k;f.hip.position.y+=(T.hy-f.hip.position.y)*k;
 f.g.rotation.x+=(T.rx-f.g.rotation.x)*k*.6;f.g.position.y+=(T.py-f.g.position.y)*k*.6;
 for(const m of f.fm)m.emissiveIntensity=f.flash;
}

/* ===== Input Pengendali ===== */
const K=new Set(),joy={x:0,y:0},go=a=>{if(!act(PL,a))buf={type:a,t:.18}},KM={KeyJ:'punch',KeyK:'kick',Space:'skill',ShiftLeft:'dodge',ShiftRight:'dodge'};
addEventListener('keydown',e=>{
 if(e.code==='Escape'){e.preventDefault();G.st==='PLAYING'?pause():resume();return}
 if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
 K.add(e.code);if(e.repeat)return;
 if(e.code==='KeyL')PL.blk=true;else if(KM[e.code])go(KM[e.code])});
addEventListener('keyup',e=>{K.delete(e.code);if(e.code==='KeyL')PL.blk=false});
addEventListener('blur',()=>{K.clear();PL.blk=false});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pause()});
const AB=[...document.querySelectorAll('.ab')];
AB.forEach(b=>{const a=b.dataset.a;b.addEventListener('pointerdown',e=>{e.preventDefault();a==='block'?PL.blk=true:go(a)});['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,()=>{if(a==='block')PL.blk=false}))});
const jb=$('#joy'),kn=$('#knob');let jid=null;
const jm=e=>{const r=jb.getBoundingClientRect(),h=r.width/2;let dx=e.clientX-r.left-h,dy=e.clientY-r.top-h;const l=Math.hypot(dx,dy);if(l>h){dx*=h/l;dy*=h/l}joy.x=dx/h;joy.y=-dy/h;kn.style.transform=`translate(${dx}px,${dy}px)`};
jb.addEventListener('pointerdown',e=>{jid=e.pointerId;jb.setPointerCapture(jid);jm(e)});
jb.addEventListener('pointermove',e=>{if(e.pointerId===jid)jm(e)});
const je=e=>{if(e.pointerId===jid){jid=null;joy.x=joy.y=0;kn.style.transform=''}};jb.addEventListener('pointerup',je);jb.addEventListener('pointercancel',je);
$('#bStart').onclick=$('#bRe1').onclick=$('#bRe2').onclick=start;$('#bRes').onclick=resume;$('#bPause').onclick=pause;

/* ===== Device Mode Switcher (Laptop vs HP) ===== */
let curMode=localStorage.getItem('game_device_mode')||(('ontouchstart' in window||navigator.maxTouchPoints>0)?'hp':'laptop');
const bLap=$('#btnModeLaptop'),bHP=$('#btnModeHP');
function applyDevMode(m){
 curMode=m;try{localStorage.setItem('game_device_mode',m)}catch(e){}
 if(m==='hp'){
  document.body.classList.add('mode-hp');document.body.classList.remove('mode-laptop');
  bHP?.classList.add('active');bLap?.classList.remove('active');
 }else{
  document.body.classList.add('mode-laptop');document.body.classList.remove('mode-hp');
  bLap?.classList.add('active');bHP?.classList.remove('active');
 }
}
if(bLap&&bHP){
 bLap.onclick=()=>applyDevMode('laptop');
 bHP.onclick=()=>applyDevMode('hp');
 applyDevMode(curMode);
}

/* ===== Simulasi, Kamera & Game Loop ===== */
function sim(dt){
 if(G.st==='PLAYING'){
  const P=PL.g.position,A=AI.g.position;let fx=A.x-P.x,fz=A.z-P.z;const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l;
  const ix=(K.has('KeyD')||K.has('ArrowRight')?1:0)-(K.has('KeyA')||K.has('ArrowLeft')?1:0)+joy.x,iy=(K.has('KeyW')||K.has('ArrowUp')?1:0)-(K.has('KeyS')||K.has('ArrowDown')?1:0)+joy.y,m=Math.hypot(ix,iy),s=m>1?1/m:1;
  PL.mx=(fx*iy-fz*ix)*s;PL.mz=(fz*iy+fx*ix)*s;
  if(buf.t>0){buf.t-=dt;if(act(PL,buf.type))buf.t=0}
  ai(dt);G.time-=dt;if(G.time<=0){G.time=0;finish(PL.hp>AI.hp?PL:AI.hp>PL.hp?AI:null,'time')}
 }else PL.mx=PL.mz=AI.mx=AI.mz=0;
 upd(PL,AI,dt,5.4);upd(AI,PL,dt,3.8);
 const a=PL.g.position,b=AI.g.position,dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);
 if(d<1.15&&d>0.001){const p=Math.min(0.18,(1.15-d)*0.5);const nx=dx/d,nz=dz/d;a.x-=nx*p;a.z-=nz*p;b.x+=nx*p;b.z+=nz*p}
 for(const q of PS)if(q.l>0){q.l-=dt;q.v.y-=14*dt;q.m.position.addScaledVector(q.v,dt);q.m.scale.setScalar(Math.max(0,q.l*2.2));q.m.rotation.x+=dt*9;if(q.l<=0)q.m.visible=false}
 for(const f of[PL,AI]){const r=f.ring;if(r.visible){const t=r.userData.t+=dt*3;r.scale.setScalar(1+t*4.2);r.material.opacity=Math.max(0,1-t);if(t>=1)r.visible=false}}
}

const cp=new V(15,4.5,0),cl=new V(0,1.3,0),ct=new V();cam.position.copy(cp);
function camU(dt){
 const P=PL.g.position,A=AI.g.position,l=1-Math.exp(-6*dt);
 if(G.st==='PLAYING'){
  let fx=A.x-P.x,fz=A.z-P.z;const d=Math.hypot(fx,fz)||1;fx/=d;fz/=d;const back=6.4+d*.1;
  cp.set(P.x-fx*back-fz*1.2,3.9+d*.06,P.z-fz*back+fx*1.2);const h=Math.hypot(cp.x,cp.z);if(h>16){cp.x*=16/h;cp.z*=16/h}
  ct.set(P.x+fx*d*.45,1.7,P.z+fz*d*.45);
 }else{
  const a=G.t*.18,r=G.st==='START'?15:10.5;cp.set(Math.cos(a)*r,G.st==='START'?4.5:3.4,Math.sin(a)*r);ct.set(0,1.4,0);
 }
 cam.position.lerp(cp,l);cl.lerp(ct,l);cam.lookAt(cl);
 cam.position.x+=rnd(-1,1)*G.shake;cam.position.y+=rnd(-1,1)*G.shake;G.shake*=Math.exp(-9*dt);
}

let last=performance.now(),lt=-1;
function loop(now){
 requestAnimationFrame(loop);
 const rd=Math.min((now-last)/1000,.05);last=now;G.t+=rd;let sd=rd;
 if(G.freeze>0){G.freeze-=rd;sd=0}else if(G.slow>0){G.slow-=rd;sd=rd*.35}
 if(G.st!=='PAUSED'){sim(sd);camU(rd)}
 for(const[fg,i]of FL){const P=fg.attributes.position;for(let j=0;j<P.count;j++){const x=P.getX(j);P.setZ(j,Math.sin(x*2.6+G.t*4+i)*.22*(1-x)/2)}P.needsUpdate=true}
 RK.forEach((m,i)=>{m.rotation.y+=rd*.2;m.position.y+=Math.sin(G.t+i)*.003});
 const tt=Math.ceil(G.time);if(tt!==lt){lt=tt;$('#tm').textContent=tt;const isLow=tt<=10&&G.st==='PLAYING';$('#tm').classList.toggle('low',isLow);if(tt<=5&&G.st==='PLAYING')snd.tick()}
 for(const b of AB){const a=b.dataset.a,c=PL.cd[a];if(c===undefined)continue;b.style.setProperty('--cd',c/CDT[a]);if(a==='skill')b.classList.toggle('rdy',c<=0&&G.st==='PLAYING')}
 ren.render(scene,cam);
}
requestAnimationFrame(loop);

/* ===== 3D FBX Character & Skeletal Animation Loader ===== */
function init3DCharacters(){
 const stEl=$('#loadStatus');
 const setSt=(msg,done=false)=>{
  if(!stEl)return;
  stEl.textContent=msg;
  if(done)setTimeout(()=>stEl.classList.add('done'),2500);
 };

 if(typeof THREE.FBXLoader==='undefined'||typeof fflate==='undefined'){
  setSt('⚡ Mode Model Prosedural Aktif',true);
  return;
 }

 const manager=new THREE.LoadingManager();
 manager.onProgress=(url,itemsLoaded,itemsTotal)=>{
  setSt(`⚡ MEMUAT KARAKTER 3D: ${itemsLoaded}/${itemsTotal}`);
 };

 const loader=new THREE.FBXLoader(manager);
 const texLoader=new THREE.TextureLoader(manager);

 // Load textures
 const tSkin=texLoader.load('character/Textures/TexCharacterVersion-VA_skin_BaseColor.png');
 tSkin.encoding=THREE.sRGBEncoding;
 const tCloth=texLoader.load('character/Textures/TexCharacterVersion-VA_Clothing_BaseColor.png');
 tCloth.encoding=THREE.sRGBEncoding;
 const nSkin=texLoader.load('character/Textures/TexCharacterVersion-VA_skin_Normal.png');
 const nCloth=texLoader.load('character/Textures/TexCharacterVersion-VA_Clothing_Normal.png');

 const animFiles={
  punch:'anmiation/Punching.fbx',
  kick:'anmiation/Mma Kick.fbx',
  block:'anmiation/block.fbx',
  dodge:'anmiation/Dodging Back.fbx',
  skill:'anmiation/skil;.fbx'
 };

 const loadedAnimObjects={};
 let rawCharacterObj=null;

 function checkReady(){
  if(!rawCharacterObj)return;
  for(const k in animFiles){
   if(!loadedAnimObjects[k])return;
  }
  setupRigAndFighters();
 }

 setSt('⚡ MEMUAT MODEL & ANIMASI 3D...');

 // 1. Load Character Mesh
 loader.load('character/FBX/CharacterMesh-VA.fbx',obj=>{
  rawCharacterObj=obj;
  checkReady();
 },xhr=>{
  if(xhr.total>0){
   const p=Math.round(xhr.loaded/xhr.total*100);
   setSt(`⚡ MEMUAT MESH 3D: ${p}%`);
  }
 },err=>{
  console.warn('Gagal memuat character FBX:',err);
  setSt('⚡ Menggunakan Model Prosedural',true);
 });

 // 2. Load Animations
 Object.entries(animFiles).forEach(([key,path])=>{
  loader.load(path,obj=>{
   loadedAnimObjects[key]=obj;
   checkReady();
  },null,err=>console.warn(`Gagal memuat animasi ${key}:`,err));
 });

 function setupRigAndFighters(){
  try{
   setSt('⚡ MEMPROSES RIGGING & TULANG 3D...');
   let meshNode=null;
   rawCharacterObj.traverse(c=>{if(!meshNode&&c.isMesh)meshNode=c});
   if(!meshNode){
    console.warn('Mesh tidak ditemukan dalam FBX karakter');
    return;
   }

   const baseArmature=loadedAnimObjects.punch;
   baseArmature.updateMatrixWorld(true);

   // Dapatkan daftar tulang dari armature
   const bones=[];
   baseArmature.traverse(c=>{if(c.isBone)bones.push(c)});
   const boneMap=new Map();
   bones.forEach((b,idx)=>boneMap.set(b.name,idx));

   // Putar geometri 180 derajat (PI) agar karakter menghadap depan (+Z) menuju musuh
   // dan skala agar tinggi mesh (234.6cm) pas 100% dengan tinggi armature Mixamo (182cm)
   const geom=meshNode.geometry.clone();
   geom.rotateY(Math.PI);
   geom.scale(0.776,0.776,0.776);
   const pos=geom.attributes.position;

   // Tulang utama untuk perhitungan segmen bobot kulit (skinning), termasuk buku & ruas jari kepalan
   const keyBoneNames=[
    'mixamorigHips','mixamorigSpine','mixamorigSpine1','mixamorigSpine2','mixamorigNeck','mixamorigHead',
    'mixamorigLeftShoulder','mixamorigLeftArm','mixamorigLeftForeArm','mixamorigLeftHand',
    'mixamorigLeftHandIndex1','mixamorigLeftHandIndex2','mixamorigLeftHandIndex3',
    'mixamorigLeftHandMiddle1','mixamorigLeftHandMiddle2','mixamorigLeftHandMiddle3',
    'mixamorigLeftHandRing1','mixamorigLeftHandRing2','mixamorigLeftHandRing3',
    'mixamorigLeftHandPinky1','mixamorigLeftHandPinky2','mixamorigLeftHandPinky3',
    'mixamorigLeftHandThumb1','mixamorigLeftHandThumb2','mixamorigLeftHandThumb3',
    'mixamorigRightShoulder','mixamorigRightArm','mixamorigRightForeArm','mixamorigRightHand',
    'mixamorigRightHandIndex1','mixamorigRightHandIndex2','mixamorigRightHandIndex3',
    'mixamorigRightHandMiddle1','mixamorigRightHandMiddle2','mixamorigRightHandMiddle3',
    'mixamorigRightHandRing1','mixamorigRightHandRing2','mixamorigRightHandRing3',
    'mixamorigRightHandPinky1','mixamorigRightHandPinky2','mixamorigRightHandPinky3',
    'mixamorigRightHandThumb1','mixamorigRightHandThumb2','mixamorigRightHandThumb3',
    'mixamorigLeftUpLeg','mixamorigLeftLeg','mixamorigLeftFoot','mixamorigLeftToeBase',
    'mixamorigRightUpLeg','mixamorigRightLeg','mixamorigRightFoot','mixamorigRightToeBase'
   ];

   const segments=[];
   keyBoneNames.forEach(name=>{
    const b=baseArmature.getObjectByName(name);
    if(!b)return;
    const idx=boneMap.get(name);
    const p1=new THREE.Vector3();
    b.getWorldPosition(p1);
    let childBone=b.children.find(c=>c.isBone);
    if(childBone){
     const p2=new THREE.Vector3();
     childBone.getWorldPosition(p2);
     segments.push({
      name,idx1:idx,idx2:boneMap.get(childBone.name),
      x1:p1.x,y1:p1.y,z1:p1.z,
      x2:p2.x,y2:p2.y,z2:p2.z,
      vx:p2.x-p1.x,vy:p2.y-p1.y,vz:p2.z-p1.z,
      lenSq:Math.max(0.0001,(p2.x-p1.x)**2+(p2.y-p1.y)**2+(p2.z-p1.z)**2)
     });
    }else{
     segments.push({
      name,idx1:idx,idx2:idx,
      x1:p1.x,y1:p1.y,z1:p1.z,
      x2:p1.x,y2:p1.y,z2:p1.z,
      vx:0,vy:0,vz:0,lenSq:0.0001
     });
    }
   });

   // Zero-allocation skinning loop (blazing fast ~100ms)
   const skinIndices=new Uint16Array(pos.count*4);
   const skinWeights=new Float32Array(pos.count*4);

   for(let i=0;i<pos.count;i++){
    const px=pos.getX(i),py=pos.getY(i),pz=pos.getZ(i);
    let bestDist1=1e9,bestIdx1=0;
    let bestDist2=1e9,bestIdx2=0;

    for(let s=0;s<segments.length;s++){
     const seg=segments[s];
     if(seg.name.includes('Left')&&px<-3)continue;
     if(seg.name.includes('Right')&&px>3)continue;

     const wx=px-seg.x1,wy=py-seg.y1,wz=pz-seg.z1;
     const c1=wx*seg.vx+wy*seg.vy+wz*seg.vz;
     let dSq,boneIdx;
     if(c1<=0){
      dSq=wx*wx+wy*wy+wz*wz;
      boneIdx=seg.idx1;
     }else if(c1>=seg.lenSq){
      const dx=px-seg.x2,dy=py-seg.y2,dz=pz-seg.z2;
      dSq=dx*dx+dy*dy+dz*dz;
      boneIdx=seg.idx2;
     }else{
      const t=c1/seg.lenSq;
      const qx=seg.x1+seg.vx*t-px;
      const qy=seg.y1+seg.vy*t-py;
      const qz=seg.z1+seg.vz*t-pz;
      dSq=qx*qx+qy*qy+qz*qz;
      boneIdx=t<0.5?seg.idx1:seg.idx2;
     }

     if(dSq<bestDist1){
      bestDist2=bestDist1;bestIdx2=bestIdx1;
      bestDist1=dSq;bestIdx1=boneIdx;
     }else if(dSq<bestDist2&&boneIdx!==bestIdx1){
      bestDist2=dSq;bestIdx2=boneIdx;
     }
    }

    const d1=Math.sqrt(bestDist1)+0.1;
    const d2=Math.sqrt(bestDist2)+0.1;
    const w1=1/d1,w2=1/d2,sum=w1+w2;
    skinIndices[i*4]=bestIdx1;
    skinWeights[i*4]=w1/sum;
    skinIndices[i*4+1]=bestIdx2;
    skinWeights[i*4+1]=w2/sum;
   }

   geom.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(skinIndices,4));
   geom.setAttribute('skinWeight',new THREE.Float32BufferAttribute(skinWeights,4));

   // Persiapkan klip animasi
   const clips={};
   for(const k in loadedAnimObjects){
    const obj=loadedAnimObjects[k];
    if(obj.animations&&obj.animations.length>0){
     const clip=obj.animations[0].clone();
     clip.name=k;
     // Kunci gerakan horizontal dodge agar posisi petarung tetap presisi
     if(k==='dodge'){
      const posTrack=clip.tracks.find(t=>t.name.includes('.position'));
      if(posTrack){
       const startX=posTrack.values[0],startZ=posTrack.values[2];
       for(let i=0;i<posTrack.values.length;i+=3){
        posTrack.values[i]=startX;
        posTrack.values[i+2]=startZ;
       }
      }
     }
     clips[k]=clip;
    }
   }

   // Buat klip idle dinamis bersiklus nafas dari pose siap t=0
   if(clips.punch){
    const punchClip=clips.punch;
    const idleTracks=[];
    punchClip.tracks.forEach(track=>{
     const itemSize=track.getValueSize();
     const v0=Array.from(track.values.slice(0,itemSize));
     const TrackType=track.constructor;
     if(track.name.includes('Hips.position')){
      const times=[0,1.0,2.0];
      const val0=[...v0];
      const val1=[...v0];val1[1]+=2.0;
      idleTracks.push(new TrackType(track.name,times,[...val0,...val1,...val0]));
     }else if(track.name.includes('Spine.quaternion')){
      const times=[0,1.0,2.0];
      const q0=new THREE.Quaternion().fromArray(v0);
      const q1=q0.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1,0,0),0.04));
      idleTracks.push(new TrackType(track.name,times,[...q0.toArray(),...q1.toArray(),...q0.toArray()]));
     }else{
      const times=[0,2.0];
      idleTracks.push(new TrackType(track.name,times,[...v0,...v0]));
     }
    });
    clips.idle=new THREE.AnimationClip('idle',2.0,idleTracks);
   }

   // Bangun petarung 3D untuk KAEL (Player) dan VORAX (AI)
   function buildFighterModel(fighter,isPlayer){
    const armature=baseArmature.clone(true);
    const fighterBones=[];
    armature.traverse(c=>{if(c.isBone)fighterBones.push(c)});
    const skeleton=new THREE.Skeleton(fighterBones);

    // PENTING: skinning: true wajib diset agar WebGLRenderer Three.js r128 mengaktifkan GPU skeletal animation
    const mSkin=new THREE.MeshStandardMaterial({
     map:tSkin,normalMap:nSkin,roughness:.65,metalness:.15,
     color:isPlayer?0xffffff:0xd4b0a0,
     skinning:true
    });
    const mCloth=new THREE.MeshStandardMaterial({
     map:tCloth,normalMap:nCloth,roughness:.7,metalness:.2,
     color:isPlayer?0xffffff:0xff5566,
     emissive:isPlayer?0x113344:0x330005,
     emissiveIntensity:0.2,
     skinning:true
    });

    const materials=[mSkin,mCloth];
    const skinnedMesh=new THREE.SkinnedMesh(geom,materials);
    skinnedMesh.castShadow=true;
    skinnedMesh.receiveShadow=true;
    skinnedMesh.add(armature);
    skinnedMesh.bind(skeleton);

    const scale=0.01;
    skinnedMesh.scale.set(scale,scale,scale);
    skinnedMesh.position.set(0,0,0);

    const mixer=new THREE.AnimationMixer(skinnedMesh);
    const actions={};
    for(const name in clips){
     actions[name]=mixer.clipAction(clips[name]);
    }

    mixer.addEventListener('finished',()=>{
     if(fighter.state!=='ko'&&fighter.state!=='block'){
      playAnim(fighter,'idle',true,1.0);
     }
    });

    fighter.mesh3d=skinnedMesh;
    fighter.mixer=mixer;
    fighter.actions=actions;
    fighter.mats3d=materials;

    // Sembunyikan balok prosedural dan tambahkan model 3D
    fighter.boxGroup.visible=false;
    fighter.g.add(skinnedMesh);

    playAnim(fighter,'idle',true,1.0);
   }

   buildFighterModel(PL,true);
   buildFighterModel(AI,false);

   setSt('✅ KARAKTER 3D & ANIMASI AKTIF!',true);
  }catch(e){
   console.error('Terjadi kesalahan saat memproses rig 3D:',e);
   setSt('⚡ Menggunakan Model Prosedural',true);
  }
 }
}

/* ===== Arena Fullscreen Portal Loading Screen ===== */
function initArenaPortalTransitions(){
 const screen = document.getElementById('arena-loading-screen');
 const titleEl = document.getElementById('arenaLoaderTitle');
 const subEl = document.getElementById('arenaLoaderSubtitle');
 const barEl = document.getElementById('arenaLoaderBar');
 const pctEl = document.getElementById('arenaLoaderPct');

 function showLoading(title, subtitle, onComplete){
  if(!screen){
   if(onComplete) onComplete();
   return;
  }
  if(titleEl) titleEl.textContent = title;
  if(subEl) subEl.textContent = subtitle;
  screen.style.opacity = '1';
  screen.style.pointerEvents = 'auto';

  const duration = 1100;
  const start = performance.now();

  function step(){
   const elapsed = performance.now() - start;
   const p = Math.min(1, elapsed / duration);
   const pct = Math.round(p * 100);
   if(barEl) barEl.style.width = pct + '%';
   if(pctEl) pctEl.textContent = pct + '%';

   if(p < 1){
    requestAnimationFrame(step);
   } else {
    if(onComplete){
     onComplete();
    } else {
     try { if(typeof ren !== 'undefined' && ren && sc && cam) ren.render(sc, cam); } catch(e){}
     screen.style.opacity = '0';
     setTimeout(() => { screen.style.pointerEvents = 'none'; }, 400);
    }
   }
  }
  requestAnimationFrame(step);
 }

 // Loading awal saat masuk arena
 showLoading('MEMASUKI BATTLE ARENA', 'Menginisialisasi ring pertarungan & robot Vorax...', null);

 // Pasang transisi loading mulus untuk setiap tombol kembali ke dunia 3D
 document.querySelectorAll('a[href*="main.html"]').forEach(btn => {
  btn.addEventListener('click', (e) => {
   e.preventDefault();
   const href = btn.getAttribute('href');
   showLoading('KEMBALI KE DUNIA 3D', 'Menyimpan statistik pertarungan & memuat alun-alun...', () => {
    window.location.href = href;
   });
  });
 });
}

window.addEventListener('load', () => {
 init3DCharacters();
 initArenaPortalTransitions();
});
if(document.readyState==='complete') {
 init3DCharacters();
 initArenaPortalTransitions();
}
