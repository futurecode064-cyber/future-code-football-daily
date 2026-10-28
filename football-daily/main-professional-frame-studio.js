"use strict";
/* Shared main-only frame decorations; does not change source publishing data. */
(function(){
if(document.documentElement.dataset.footballBrandName||!(/^\/(?:index\.html)?$/.test(location.pathname)||/^\/odds(?:\.html)?\/?$/.test(location.pathname)))return;
const labels={results:"ဂိုးရလဒ်",previews:"ပွဲကြိုသုံးသပ်ချက်",specials:"Special Choice",odds:"ပေါက်ကြေး",ai:"AI ခန့်မှန်းချက်",news:"ဘောလုံးသတင်း"},types=Object.keys(labels);
const templates=[["navy","Professional Navy","#16486c"],["gold","Premium Gold","#856119"],["red","Editorial Red","#842630"],["green","Sports Green","#18553d"]].map(a=>({id:a[0],name:a[1],color:a[2],top:110,bottom:75,fit:"contain",topImage:"",bottomImage:"",builtin:true}));

/* Artwork catalogue. Files stay in the repository and are never modified. */
const originalArtwork={"odds-best":{"top":"./assets/table-odds-frames/best-top.jpg","bottom":"./assets/table-odds-frames/best-bottom.jpg"},"odds-htet":{"top":"./assets/table-odds-frames/htet-top.jpg","bottom":"./assets/table-odds-frames/htet-bottom.jpg"},"odds-ggoal":{"full":"./assets/table-odds-frames/ggoal-frame.jpg","t":0.166016,"b":0.052734},"odds-hyper-goal":{"full":"./assets/table-odds-frames/hyper-goal-frame.jpg","t":0.129504,"b":0.101914},"odds-kmm":{"full":"./assets/table-odds-frames/kmm-frame.jpg","t":0.10498,"b":0.064941},"odds-special-one":{"full":"./assets/table-odds-frames/special-one-frame.jpg","t":0.073313,"b":0.037145},"odds-the-freedom":{"full":"./assets/table-odds-frames/the-freedom-frame.jpg","t":0,"b":0},"odds-bcf":{"full":"./assets/table-odds-frames/bcf-frame.jpg","t":0.092773,"b":0.072265},"odds-final-goal":{"full":"./assets/table-odds-frames/final-goal-frame.jpg","t":0.148571,"b":0.037142},"odds-ko-chan":{"full":"./assets/table-odds-frames/ko-chan-frame.jpg","t":0.134645,"b":0},"odds-team-pmm":{"full":"./assets/table-odds-frames/team-pmm-frame.jpg","t":0.15625,"b":0.118652},"odds-thuta":{"full":"./assets/table-odds-frames/thuta-frame.jpg","t":0.131835,"b":0.096679},"odds-ymc":{"full":"./assets/table-odds-frames/ymc-frame.jpg","t":0.160481,"b":0.117352},"odds-ko-tut-pi":{"full":"./assets/table-odds-frames/ko-tut-pi-frame.jpg","t":0.143162,"b":0.142628},"odds-khin-khin-htar":{"full":"./assets/table-odds-frames/khin-khin-htar-frame.jpg","t":0.186757,"b":0.134125},"preview-bcf":{"top":"./assets/preview-frames/bcf-top.jpg","bottom":"./assets/preview-frames/bcf-bottom.jpg"},"preview-daily":{"top":"./assets/preview-frames/daily-top.jpg","bottom":"./assets/preview-frames/daily-bottom.jpg"},"preview-final":{"top":"./assets/preview-frames/final-top.jpg","bottom":"./assets/preview-frames/final-bottom.jpg"},"preview-ggoal":{"top":"./assets/preview-frames/ggoal-top.jpg","bottom":"./assets/preview-frames/ggoal-bottom.jpg"},"preview-ko":{"top":"./assets/preview-frames/ko-top.jpg"},"preview-pmm":{"top":"./assets/preview-frames/pmm-top.jpg"},"preview-htet":{"top":"./assets/preview-frames/htet-top.jpg","bottom":"./assets/preview-frames/htet-bottom.jpg"}};
const allTemplates=[...templates,...[{"id":"odds-best","name":"Best Your Choice · ပေါက်ကြေး","color":"#132ab0","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-htet","name":"Htet Ko · ပေါက်ကြေး","color":"#145800","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-ggoal","name":"GGOAL · ပေါက်ကြေး","color":"#b58100","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-hyper-goal","name":"Hyper Goal · ပေါက်ကြေး","color":"#986100","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-kmm","name":"KMM · ပေါက်ကြေး","color":"#a50918","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-special-one","name":"Special One · ပေါက်ကြေး","color":"#236c87","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-the-freedom","name":"The Freedom · ပေါက်ကြေး","color":"#8b6d24","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-bcf","name":"BCF · ပေါက်ကြေး","color":"#073682","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-final-goal","name":"Final Goal · ပေါက်ကြေး","color":"#876013","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-ko-chan","name":"Ko Chan · ပေါက်ကြေး","color":"#0d1745","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-team-pmm","name":"Team PMM · ပေါက်ကြေး","color":"#5e0814","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-thuta","name":"THUTA · ပေါက်ကြေး","color":"#115136","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-ymc","name":"YMC · ပေါက်ကြေး","color":"#16113d","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-ko-tut-pi","name":"ကိုတွတ်ပီ · ပေါက်ကြေး","color":"#9a1114","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"odds-khin-khin-htar","name":"ခင်ခင်ထား · ပေါက်ကြေး","color":"#77005b","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-bcf","name":"BCF · ပွဲကြို","color":"#16486c","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-daily","name":"Daily Double · ပွဲကြို","color":"#842630","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-final","name":"Final Goal · ပွဲကြို","color":"#856119","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-ggoal","name":"GGOAL · ပွဲကြို","color":"#856119","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-ko","name":"Ko Chan · ပွဲကြို","color":"#16486c","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-pmm","name":"Team PMM · ပွဲကြို","color":"#842630","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true},{"id":"preview-htet","name":"Htet Ko · ပွဲကြို","color":"#18553d","top":110,"bottom":75,"fit":"contain","topImage":"","bottomImage":"","builtin":true}]];
const empty=()=>({version:2,frames:allTemplates.map(x=>({...x,sections:[...types],archived:false})),selected:Object.fromEntries(types.map(x=>[x,"none"]))});
let state=empty(),panel=null,active="navy",queue=Promise.resolve();
const get=id=>state.frames.find(f=>f.id===id);
const color=s=>/^#[\da-f]{6}$/i.test(s||"")?s:"#16486c";
const number=(v,d)=>Number.isFinite(+v)?Math.max(0,Math.min(360,Math.round(+v))):d;
const trim=(s,max=70)=>String(s||"").trim().slice(0,max);
const pic=x=>typeof x==="string"&&/^data:image\/(png|webp|jpeg);base64,/.test(x)&&x.length<1500000?x:"";
function validate(v){
if(!v||v.version!==2||!Array.isArray(v.frames)||v.frames.length>130)throw Error("Frame Backup v2 မမှန်ပါ");
const out=empty(),used=new Set();
out.frames=v.frames.filter(x=>x&&/^[a-z0-9-]{2,60}$/.test(x.id)&&!used.has(x.id)&&used.add(x.id)).map(x=>({
id:x.id,name:trim(x.name)||"My Frame",color:color(x.color),top:number(x.top,110),bottom:number(x.bottom,75),
fit:x.fit==="cover"?"cover":"contain",topImage:pic(x.topImage),bottomImage:pic(x.bottomImage),builtin:allTemplates.some(t=>t.id===x.id),
sections:Array.isArray(x.sections)?types.filter(k=>x.sections.includes(k)):[...types],archived:!!x.archived}));
for(const f of allTemplates)if(!out.frames.some(x=>x.id===f.id))out.frames.push({...f,sections:[...types],archived:false});
for(const k of types){const id=v.selected?.[k];out.selected[k]=getId(id,out.frames,k)?id:"none";}
return out;
}
function getId(id,frames,section){return id==="none"||frames.some(f=>f.id===id&&!f.archived&&(!section||f.sections.includes(section)));}
function openDB(){return new Promise((resolve,reject)=>{
const r=indexedDB.open("future-code-professional-frame-studio-v2",1);
r.onupgradeneeded=()=>r.result.createObjectStore("config");
r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});}
async function load(){const d=await openDB();return new Promise((res,rej)=>{const t=d.transaction("config"),r=t.objectStore("config").get("main");r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);t.oncomplete=()=>d.close();});}
async function persist(){const snapshot=JSON.parse(JSON.stringify(state)),d=await openDB();return new Promise((res,rej)=>{const t=d.transaction("config","readwrite");t.objectStore("config").put(snapshot,"main");t.oncomplete=()=>{d.close();res();};t.onerror=()=>rej(t.error);});}
const crossTab=typeof BroadcastChannel!=="undefined"?new BroadcastChannel("future-code-frame-studio-updates-v2"):null;
function save(){queue=queue.catch(()=>{}).then(persist).then(()=>{crossTab?.postMessage({type:"updated"});});return queue;}
crossTab?.addEventListener("message",async event=>{
 if(event.data?.type!=="updated")return;
 try{await queue;const latest=await load();if(latest){state=validate(latest);if(panel){syncControls();status("အခြား Tab မှ Frame ပြင်ဆင်ချက်များ Sync ပြီး");}}}
 catch(error){console.warn("Frame Studio cross-tab reload failed",error);}
});
const ready=load().then(v=>{if(v)state=validate(v);}).catch(e=>console.warn("Professional frames: browser storage",e));
function shade(hex,scale){return "#"+hex.slice(1).match(/../g).map(v=>Math.round(parseInt(v,16)*scale).toString(16).padStart(2,"0")).join("");}
function image(src){return new Promise((res,rej)=>{const im=new Image();im.onload=()=>res(im);im.onerror=()=>rej(Error("Banner ပုံ ဖတ်မရပါ"));im.src=src;});}
function artwork(ctx,img,w,h,y,fit){
if(!img||h<=0)return;
const iw=img.naturalWidth||img.width,ih=img.naturalHeight||img.height;
ctx.save();ctx.beginPath();ctx.rect(0,y,w,h);ctx.clip();
if(fit==="cover"){const s=Math.max(w/iw,h/ih),cw=w/s,ch=h/s;ctx.drawImage(img,(iw-cw)/2,(ih-ch)/2,cw,ch,0,y,w,h);}
else{const s=Math.min(w/iw,h/ih),dw=iw*s,dh=ih*s;ctx.drawImage(img,(w-dw)/2,y+(h-dh)/2,dw,dh);}
ctx.restore();
}
function band(ctx,w,y,h,hex){
if(!h)return;
const g=ctx.createLinearGradient(0,y,w,y+h);g.addColorStop(0,shade(hex,.35));g.addColorStop(.5,hex);g.addColorStop(1,shade(hex,.4));
ctx.fillStyle=g;ctx.fillRect(0,y,w,h);ctx.fillStyle="rgba(255,255,255,.34)";ctx.fillRect(18,y+h-3,w-36,2);
}
async function composite(source,f){
const w=source.width,top=Math.round(f.top*w/1200),bottom=Math.round(f.bottom*w/1200),pad=Math.max(10,Math.round(w*.012)),h=top+source.height+bottom+pad*2;
if(h>32767||h*w>110000000)throw Error("PNG ပုံအမြင့်များလွန်းပါသည်။ Banner အမြင့်လျှော့ပါ။");
const out=document.createElement("canvas");out.width=w;out.height=h;
const c=out.getContext("2d");if(!c)throw Error("Canvas မရနိုင်ပါ");
c.fillStyle=shade(f.color,.33);c.fillRect(0,0,w,h);band(c,w,0,top,f.color);band(c,w,h-bottom,bottom,f.color);
const [a,b]=await Promise.all([f.topImage?image(f.topImage):null,f.bottomImage?image(f.bottomImage):null]);
const asset=originalArtwork[f.id];
 if(asset){
  if(asset.full){
   const im=await image(asset.full),t=Math.floor(im.height*asset.t),b=Math.floor(im.height*asset.b);
   if(t>0&&top>0)c.drawImage(im,0,0,im.width,t,0,0,w,top);
   if(b>0&&bottom>0)c.drawImage(im,0,im.height-b,im.width,b,0,h-bottom,w,bottom);
  }else{
   if(asset.top&&top>0)artwork(c,await image(asset.top),w,top,0,f.fit);
   if(asset.bottom&&bottom>0)artwork(c,await image(asset.bottom),w,bottom,h-bottom,f.fit);
  }
 }
 artwork(c,a,w,top,0,f.fit);artwork(c,b,w,bottom,h-bottom,f.fit);
c.drawImage(source,0,top+pad);
c.strokeStyle=f.color;c.lineWidth=Math.max(3,Math.floor(pad/2));c.strokeRect(c.lineWidth/2,top+pad+c.lineWidth/2,w-c.lineWidth,source.height-c.lineWidth);
return out;
}
async function wrap(canvas,section){if(!canvas||!types.includes(section))return canvas;await ready;const f=get(state.selected[section]);return f&&!f.archived&&f.sections.includes(section)?composite(canvas,f):canvas;}
window.FutureCodeProfessionalFrames=Object.freeze({wrap,ready,getSelected:async name=>(await ready,state.selected[name]||"none"),sections:labels});
const el=id=>panel?.querySelector("#"+id);
function status(msg,error){const n=el("fcpStatus");if(n){n.textContent=msg;n.style.color=error?"#ff9c9c":"#aef3ca";}}
function preview(){
const f=get(active),canvas=el("fcpPreview");if(!f||!canvas)return;
const src=document.createElement("canvas");src.width=500;src.height=225;const c=src.getContext("2d");
c.fillStyle="#f0f5f8";c.fillRect(0,0,500,225);c.fillStyle="#13283b";c.fillRect(16,18,468,52);
c.fillStyle="#fff";c.font="bold 24px sans-serif";c.fillText("MATCH PREVIEW",30,51);
c.fillStyle="#122a3c";c.font="bold 22px sans-serif";c.fillText("HOME  1 - 1  AWAY",35,124);
c.fillStyle="#6a8491";for(let i=0;i<4;i++)c.fillRect(35,151+i*15,420,6);
composite(src,{...f,topImage:"",bottomImage:""}).then(async base=>{
 const out=canvas.getContext("2d");canvas.width=base.width;canvas.height=base.height;out.drawImage(base,0,0);
 const top=Math.round(f.top*500/1200),bottom=Math.round(f.bottom*500/1200),[a,b]=await Promise.all([f.topImage?image(f.topImage):null,f.bottomImage?image(f.bottomImage):null]);
 if(active!==f.id)return;artwork(out,a,500,top,0,f.fit);artwork(out,b,500,bottom,canvas.height-bottom,f.fit);
}).catch(e=>status(e.message,true));
}
function fill(){
const f=get(active);if(!f)return;
el("fcpFrame").value=f.id;el("fcpName").value=f.name;el("fcpColor").value=f.color;el("fcpTop").value=f.top;el("fcpBottom").value=f.bottom;el("fcpFit").value=f.fit;
el("fcpTopFile").value="";el("fcpBottomFile").value="";
el("fcpTopState").textContent=f.topImage?"အပေါ် Banner ပုံ ထည့်ထားသည်":"အပေါ် Banner မရှိပါ";
el("fcpBottomState").textContent=f.bottomImage?"အောက် Banner ပုံ ထည့်ထားသည်":"အောက် Banner မရှိပါ";
el("fcpDelete").disabled=f.builtin;
 const host=el("fcpVisible");if(host){host.replaceChildren();for(const section of types){
  const label=document.createElement("label"),input=document.createElement("input");input.type="checkbox";input.checked=f.sections.includes(section);
  input.onchange=async()=>{const before=[...f.sections],old={...state.selected};
   f.sections=input.checked?[...new Set([...f.sections,section])]:f.sections.filter(k=>k!==section);
   if(!input.checked&&state.selected[section]===f.id)state.selected[section]="none";
   try{await save();syncControls();status(labels[section]+" Setting သိမ်းပြီး");}catch(e){f.sections=before;state.selected=old;syncControls();status(e.message,true);}};
  label.append(input,document.createTextNode(" "+labels[section]));host.append(label);
 }}
 el("fcpArchive").textContent=f.archived?"Frame ပြန်ဖော်မယ်":"Frame ရွေးစရာမှ ဖြုတ်မယ်";preview();
}
function syncControls(){
if(!panel)return;
const sel=el("fcpFrame");sel.replaceChildren(...state.frames.filter(f=>!f.archived&&f.sections.includes(key)).map(f=>new Option(f.name,f.id)));
if(!get(active))active=state.frames[0].id;sel.value=active;
const host=el("fcpAssignments");host.replaceChildren();
for(const key of types){
const label=document.createElement("label"),select=document.createElement("select");
label.textContent=labels[key];select.dataset.section=key;
select.add(new Option("မူရင်းအတိုင်း (Frame မထည့်)","none"));
state.frames.filter(f=>!f.archived&&f.sections.includes(key)).forEach(f=>select.add(new Option(f.name,f.id)));
select.value=getId(state.selected[key],state.frames,key)?state.selected[key]:"none";
select.onchange=async()=>{const previous=state.selected[key];state.selected[key]=select.value;try{await save();status(labels[key]+" Frame သိမ်းပြီး");syncMini();}catch(e){state.selected[key]=previous;status(e.message,true);}};
label.append(select);host.append(label);
}
fill();syncMini();
}
function syncMini(){
document.querySelectorAll(".fcp-mini select[data-section]").forEach(select=>{
const key=select.dataset.section;select.replaceChildren(new Option("မူရင်းပုံ","none"),...state.frames.map(f=>new Option(f.name,f.id)));
select.value=state.selected[key]||"none";
});
}
function mini(){let created=false;
const targets={results:"#mainResultsFrameStudio",previews:"#brandPreviewStudio",odds:/^\/odds/.test(location.pathname)?"#mainTableOddsFrames":"#brandOddsStudio",ai:"#fcAiExportPanel",news:"#fcNewsSection"};
for(const [key,selector] of Object.entries(targets)){
const target=document.querySelector(selector);if(!target||target.querySelector(".fcp-mini"))continue;
const row=document.createElement("div");row.className="fcp-mini";
const label=document.createElement("label"),select=document.createElement("select"),link=document.createElement("a");
label.textContent="Professional Frame";select.dataset.section=key;label.append(select);
link.href="#fcProfessionalFrameStudio";link.textContent="Frame / Banner ပြင်မယ်";
select.onchange=async()=>{state.selected[key]=select.value;try{await save();const master=el("fcpAssignments")?.querySelector('select[data-section="'+key+'"]');if(master)master.value=select.value;status(labels[key]+" Frame သိမ်းပြီး");}catch(e){status(e.message,true);}};
row.append(label,link);target.prepend(row);created=true;
}if(created)syncMini();
}
async function compress(file){
if(!file)return null;
if(!["image/png","image/jpeg","image/webp"].includes(file.type)||file.size>8000000)throw Error("PNG/JPG/WEBP 8MB အောက် ပုံရွေးပါ။");
const url=URL.createObjectURL(file);
try{
 const im=await image(url);if(im.naturalWidth<250||im.naturalHeight<40)throw Error("Banner အနည်းဆုံး 250×40 px လိုအပ်ပါသည်။");
 const s=Math.min(1,1800/im.naturalWidth,500/im.naturalHeight),c=document.createElement("canvas");
 c.width=Math.round(im.naturalWidth*s);c.height=Math.round(im.naturalHeight*s);c.getContext("2d").drawImage(im,0,0,c.width,c.height);
 const data=c.toDataURL("image/webp",.78);if(data.length>=1500000)throw Error("Banner ပုံအရွယ်အစား လျှော့ပါ။");return data;
}finally{URL.revokeObjectURL(url);}
}
function downloadJson(){const b=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(b),a=document.createElement("a");a.href=url;a.download="future-code-pro-frame-settings-v2.json";document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);}
function init(){
panel=document.createElement("section");panel.id="fcProfessionalFrameStudio";
panel.innerHTML='<div class="fcp-head"><div><small>FUTURE CODE · MAIN WEBSITE</small><h2>Frame Editor — တစ်နေရာတည်း စီမံရန်</h2><p>မူရင်း Frame များနှင့် ကိုယ်ပိုင် Frame အသစ်များကို ဒီနေရာတစ်ခုတည်းမှ ပြင်နိုင်ပါသည်။ Section တစ်ခုချင်းစီအတွက် အသုံးပြု/ဖြုတ်/ပြန်ဖော်၊ Theme Color၊ Top/Bottom Banner ကို သတ်မှတ်နိုင်ပါသည်။ မူရင်း Frame ပုံများကို မဖျက်ပါ။</p></div><a href="./odds.html">ပေါက်ကြေးစာမျက်နှာ</a></div>'+
'<div class="fcp-grid"><div class="fcp-card"><label>Frame ရွေးရန်<select id="fcpFrame"></select></label><label>Frame နာမည်<input id="fcpName" type="text" maxlength="70"></label>'+
'<div class="fcp-pair"><label>Frame အရောင်<input id="fcpColor" type="color"></label><label>Banner Fit<select id="fcpFit"><option value="contain">အပြည့်ပေါ် (မဖြတ်)</option><option value="cover">အပြည့်ဖြည့် (အနားဖြတ်)</option></select></label></div>'+
'<div class="fcp-pair"><label>အပေါ် Banner အမြင့်<input id="fcpTop" type="number" min="0" max="360"></label><label>အောက် Banner အမြင့်<input id="fcpBottom" type="number" min="0" max="360"></label></div>'+
'<div class="fcp-upload"><b>အပေါ် Banner ပုံ (Top)</b><input type="file" id="fcpTopFile" accept="image/png,image/jpeg,image/webp"><small id="fcpTopState"></small><button id="fcpRemoveTop">Top Banner ဖြုတ်</button></div>'+
'<div class="fcp-upload"><b>အောက် Banner ပုံ (Bottom)</b><input type="file" id="fcpBottomFile" accept="image/png,image/jpeg,image/webp"><small id="fcpBottomState"></small><button id="fcpRemoveBottom">Bottom Banner ဖြုတ်</button></div>'+
'<div class="fcp-buttons"><button id="fcpAdd">＋ Frame အသစ်</button><button id="fcpSave">ပြင်ဆင်ချက် သိမ်းမယ်</button><button id="fcpArchive">Frame ရွေးစရာမှ ဖြုတ်မယ်</button><button id="fcpDelete">Frame ဖျက်မယ်</button><button id="fcpReset">မူရင်း Frame ပြန်ထား</button></div><h3>ဒီ Frame ကို အသုံးပြုမည့် Section များ</h3><div id="fcpVisible"></div></div>'+
'<div class="fcp-card"><h3>Frame Preview (Download မပြုမီ နမူနာ)</h3><canvas id="fcpPreview" width="500" height="300"></canvas><p>Download ပုံထဲမှာ စာ/ဇယားကို မဖုံးဘဲ Banner များကို အပေါ်နှင့်အောက် သီးခြားထည့်ပေးပါမည်။</p><h3>Section အလိုက် Frame ချိတ်ဆက်ရန်</h3><div id="fcpAssignments"></div></div></div>'+
'<div class="fcp-buttons"><button id="fcpBackup">Settings Backup Download</button><label>Backup Import<input id="fcpImport" type="file" accept=".json,application/json"></label><span id="fcpStatus" role="status" aria-live="polite"></span></div>'+
'<p>Settings ကို ဒီ Browser ၏ IndexedDB တွင် သိမ်းထားပါသည်။ အခြား Device သို့ ပြောင်းရန် Backup/Import လုပ်ပါ။ Original data မပြောင်းပါ။</p>';
if(/^\/odds/.test(location.pathname))document.querySelector("main")?.prepend(panel);else document.querySelector("main>.hero")?.after(panel);
const css=document.createElement("style");css.textContent='#fcProfessionalFrameStudio{max-width:1180px;box-sizing:border-box;margin:20px auto;padding:24px;background:#102937;color:#ecf5fc;border:1px solid #527b8f;border-radius:17px;font:14px/1.8 "Noto Sans Myanmar",sans-serif}#fcProfessionalFrameStudio *{box-sizing:border-box}#fcProfessionalFrameStudio h2{font-size:25px;margin:0;color:#ffe1ad}#fcProfessionalFrameStudio h3{color:#ffe1ad}#fcProfessionalFrameStudio p,#fcProfessionalFrameStudio small{color:#c9dde6}#fcProfessionalFrameStudio .fcp-head{display:flex;justify-content:space-between;gap:20px}#fcProfessionalFrameStudio a{color:#ffdb9f}#fcProfessionalFrameStudio .fcp-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px;margin:20px 0}#fcProfessionalFrameStudio .fcp-card{padding:18px;background:#1a3848;border:1px solid #446a7c;border-radius:12px}#fcProfessionalFrameStudio label{display:flex;flex-direction:column;gap:5px;margin:8px 0;font-weight:700;color:#fff}#fcProfessionalFrameStudio .fcp-pair{display:grid;grid-template-columns:1fr 1fr;gap:12px}#fcProfessionalFrameStudio select,#fcProfessionalFrameStudio input:not([type=color]){width:100%;min-height:39px;padding:8px;background:#fff;color:#172e3a;border:1px solid #a2bdc8;border-radius:7px;font:inherit}#fcProfessionalFrameStudio input[type=color]{width:100%;height:43px}#fcProfessionalFrameStudio .fcp-upload{border:1px dashed #6f94a6;border-radius:9px;padding:12px;margin:12px 0;display:grid;gap:6px}#fcProfessionalFrameStudio button{background:#f1bf78;color:#203443;padding:9px 12px;border:0;border-radius:8px;font:700 13px "Noto Sans Myanmar",sans-serif;cursor:pointer}#fcProfessionalFrameStudio button:disabled{opacity:.4}#fcProfessionalFrameStudio .fcp-buttons{display:flex;gap:9px;flex-wrap:wrap;align-items:center;margin:15px 0}#fcProfessionalFrameStudio #fcpDelete{background:#ec9292}#fcProfessionalFrameStudio canvas{display:block;width:100%;height:auto;border-radius:6px}#fcProfessionalFrameStudio #fcpAssignments,#fcProfessionalFrameStudio #fcpVisible{display:grid;grid-template-columns:1fr 1fr;gap:8px}#fcProfessionalFrameStudio #fcpVisible label{display:flex;flex-direction:row;align-items:center}#fcProfessionalFrameStudio #fcpArchive{background:#dce4ed}#fcProfessionalFrameStudio #fcpStatus{flex:1 1 100%}.fcp-mini{display:flex;gap:12px;flex-wrap:wrap;align-items:center;margin:10px 0;padding:10px;background:#183d4b;border:1px solid #508095;border-radius:10px;color:#fff}.fcp-mini label{display:flex;align-items:center;gap:8px;color:#fff!important}.fcp-mini select{max-width:260px;min-height:34px;background:#fff;color:#163345;border-radius:6px;padding:5px}.fcp-mini a{color:#ffdda2;text-decoration:underline}@media(max-width:760px){#fcProfessionalFrameStudio .fcp-grid{grid-template-columns:1fr}#fcProfessionalFrameStudio #fcpAssignments{grid-template-columns:1fr}}';document.head.append(css);
el("fcpFrame").onchange=e=>{active=e.target.value;fill();};
el("fcpAdd").onclick=async()=>{if(state.frames.length>=130)return status("Frame အများဆုံး ၁၃၀ မျိုး",true);const id="custom-"+Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);state.frames.push({id,name:"Frame အသစ်",color:"#244c75",top:110,bottom:75,fit:"contain",topImage:"",bottomImage:"",builtin:false,sections:[...types],archived:false});await save();active=id;syncControls();status("Frame အသစ် ဖန်တီးပြီး။ Banner နှစ်ခု ရွေးနိုင်ပါပြီ");};
el("fcpSave").onclick=async()=>{const f=get(active);if(!f)return;try{
const name=trim(el("fcpName").value);if(!name)throw Error("Frame နာမည် ထည့်ပါ။");
const top=number(el("fcpTop").value,110),bottom=number(el("fcpBottom").value,75);
if(top+bottom>650)throw Error("Banner နှစ်ခု၏ အမြင့်များနေသည်။");
const next={...f,name,color:color(el("fcpColor").value),top,bottom,fit:el("fcpFit").value};
if(el("fcpTopFile").files[0])next.topImage=await compress(el("fcpTopFile").files[0]);
if(el("fcpBottomFile").files[0])next.bottomImage=await compress(el("fcpBottomFile").files[0]);
Object.assign(f,next);await save();syncControls();status("Frame နှင့် Banner Settings သိမ်းပြီးပါပြီ။");
}catch(e){status(e.message,true);}};
el("fcpRemoveTop").onclick=async()=>{get(active).topImage="";await save();fill();status("အပေါ် Banner ဖြုတ်ပြီး");};
el("fcpRemoveBottom").onclick=async()=>{get(active).bottomImage="";await save();fill();status("အောက် Banner ဖြုတ်ပြီး");};
el("fcpArchive").onclick=async()=>{const f=get(active);if(!f)return;const before=!!f.archived;
 f.archived=!before;if(f.archived)for(const k of types)if(state.selected[k]===active)state.selected[k]="none";
 try{await save();syncControls();status(f.archived?"Frame ကို ရွေးစရာမှ ဖြုတ်ထားပါသည်၊ မဖျက်ထားပါ":"Frame ပြန်ဖော်ပြီး");}catch(e){f.archived=before;status(e.message,true);}};
 el("fcpDelete").onclick=async()=>{const f=get(active);if(f.builtin||!confirm("ဤ Frame ဖျက်မလား?"))return;state.frames=state.frames.filter(x=>x.id!==active);for(const k of types)if(state.selected[k]===active)state.selected[k]="none";await save();active="navy";syncControls();status("Frame ဖျက်ပြီး");};
el("fcpReset").onclick=async()=>{const f=get(active),t=allTemplates.find(x=>x.id===active);if(!t)return status("မူရင်း Template မဟုတ်ပါ",true);Object.assign(f,{...t,sections:[...types],archived:false});await save();syncControls();status("မူရင်း Frame ပြန်ထားပြီး");};
el("fcpBackup").onclick=downloadJson;
el("fcpImport").onchange=async e=>{try{const file=e.target.files[0];if(!file||file.size>12000000)throw Error("Backup ဖိုင် ကြီးလွန်းသည်");state=validate(JSON.parse(await file.text()));await save();active=state.frames[0].id;syncControls();status("Backup Import ပြီးပါပြီ");}catch(err){status(err.message,true);}finally{e.target.value="";}};
syncControls();mini();
const obs=new MutationObserver(()=>mini());obs.observe(document.body,{childList:true,subtree:false});
const main=document.querySelector("main");if(main)obs.observe(main,{childList:true,subtree:true});
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>ready.then(init),{once:true});else ready.then(init);
})();