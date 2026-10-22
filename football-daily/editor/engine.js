'use strict';
(()=>{
 const $=id=>document.getElementById(id),base='/api/editor/engine/';let importKey=crypto.randomUUID();
 const show=v=>{$('result').textContent=JSON.stringify(v,null,2);};
 async function api(name,body){const r=await fetch(base+name,{method:body?'POST':'GET',headers:body?{'Content-Type':'application/json','X-Football-Editor':'1','Idempotency-Key':importKey}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});const data=await r.json();if(!r.ok)throw Error(data.error||JSON.stringify(data.errors)||'Request failed');return data;}
 const action=(id,fn)=>{$(id).addEventListener('click',async()=>{const button=$(id);button.disabled=true;try{await fn();}catch(e){show({error:e.message});}finally{button.disabled=false;}});};
 async function refresh(){try{const a=await api('state');$('generation').value=a.generation;$('status').textContent=a.version_id?'လက်ရှိ Version: '+a.version_id:'စစ်ဆေးပြီး publication မရှိသေးပါ';show(a);}catch(e){$('status').textContent=e.message;}}
 $('file').addEventListener('change',async()=>{const f=$('file').files[0];if(f){$('payload').value=await f.text();importKey=crypto.randomUUID();}});
 $('payload').addEventListener('input',()=>{importKey=crypto.randomUUID();});
 action('refresh',refresh);action('history',async()=>show(await api('history')));
 action('save',async()=>{const data=await api('import',JSON.parse($('payload').value));$('version').value=data.version;show(data);});
 action('draft',async()=>show(await api('draft?version='+encodeURIComponent($('version').value))));
 action('validate',async()=>show(await api('validate',{version:$('version').value,review:JSON.parse($('review').value)})));
 for(const op of ['publish','rollback'])action(op,async()=>{if(!$('confirm').checked)throw Error('ထုတ်ဝေရန် အတည်ပြုချက် ရွေးပါ');const data=await api(op,{version:$('version').value,expectedGeneration:Number($('generation').value)});$('generation').value=data.generation;$('confirm').checked=false;show(data);});
 refresh();
})();
