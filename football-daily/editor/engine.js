'use strict';
(()=>{
 const $=id=>document.getElementById(id),M=window.FootballDraftModel,base='/api/editor/engine/';
 let editBase=null,savedCorrection=null;
 let draft=null,original=null,section='overview',selected=null,importKey=crypto.randomUUID(),baseDraft=null,dirty=false;
 const show=v=>{$('result').textContent=JSON.stringify(v,null,2);};
 function download(name,body){const url=URL.createObjectURL(new Blob([body],{type:'application/octet-stream'})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);}
 async function api(name,body,key=importKey){const r=await fetch(base+name,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json','X-Football-Editor':'1','Idempotency-Key':key}:{},body:body?JSON.stringify(body):undefined,cache:'no-store'});let data;try{data=await r.json();}catch{throw Error('Server response မမှန်ပါ ('+r.status+')');}if(!r.ok){const e=Error(data.error||data.errors?.join('\n')||'Request failed ('+r.status+')');e.report=data;throw e;}return data;}
 async function snapshot(name){const b=await api(name+(name.includes('?')?'&':'?')+'metadata=1');const resources={};for(let i=0;i<b.resourceManifest.length;i+=4){await Promise.all(b.resourceManifest.slice(i,i+4).map(async row=>{resources[row.path]=await api('resource?version='+encodeURIComponent(b.version.id)+'&path='+encodeURIComponent(row.path));}));}return {...b,resources};}
 const action=(id,fn)=>{$(id).addEventListener('click',async()=>{const b=$(id);b.disabled=true;try{await fn();}catch(e){show(e.report||{error:e.message});}finally{b.disabled=false;}});};
 function loaded(b){const local=!(b.version&&typeof b.version==='object'),before=local?(original||{resources:{}}):null;draft=M.normalize(b);original=before||M.copy(draft);editBase=b.version?.ever_published?b.version.id:null;savedCorrection=null;$('editStatus').textContent=editBase?'Live Version ကို ပြန်ပြင်နိုင်ပါပြီ':'လက်ရှိ Live ကို ဖွင့်ပြီး ပြန်ပြင်ပါ';baseDraft=null;dirty=local;if(dirty)$('version').value='';selected=null;importKey=crypto.randomUUID();$('payload').value=JSON.stringify(draft,null,2);$('sourceManifest').value=JSON.stringify(draft.sourceManifest,null,2);render();}
 function changed(){dirty=true;importKey=crypto.randomUUID();$('payload').value=JSON.stringify(draft,null,2);render();}
 function cell(tr,value){const td=document.createElement('td');td.textContent=value;tr.append(td);return td;}
 function render(){
  const rowSections=!['overview','sources','preview','validation','history','usage'].includes(section);
  for(const id of ['overview','sources','rowEditor','preview','validation'])$(id).hidden=id==='rowEditor'?!rowSections:id!==section;
  $('sectionTitle').textContent=M.sections.find(x=>x[0]===section)?.[1]||section;
  for(const b of $('sections').children)b.setAttribute('aria-current',String(b.dataset.section===section));
  if(!draft){$('counts').textContent='Import JSON ဖွင့်ပါ၊ သို့မဟုတ် လက်ရှိ Publication / Draft ဖွင့်ပါ။';$('rows').replaceChildren();return;}
  const s=M.summary(draft);$('counts').textContent=JSON.stringify({...s,previewCoverage:s.previews+'/'+s.fixtures,formCoverage:s.forms+'/'+s.fixtures,unsaved:dirty},null,2);
  $('diff').textContent=JSON.stringify(M.changes(original,draft),null,2);
  if(rowSections){
   const all=M.rows(draft,section),filter=$('search').value.toLowerCase(),league=$('league').value;
   const leagues=[...new Set(all.map(r=>r.value.league).filter(Boolean))].sort();$('league').replaceChildren();
   for(const l of ['',...leagues]){const o=document.createElement('option');o.value=l;o.textContent=l||'အားလုံး';$('league').append(o);}$('league').value=leagues.includes(league)?league:'';
   const rows=all.filter(r=>(!league||r.value.league===league)&&(!filter||JSON.stringify(r.value).toLowerCase().includes(filter)));
   $('rowCount').textContent=rows.length+' / '+all.length+' rows';$('rows').replaceChildren();
   for(const r of rows){const m=r.value,tr=document.createElement('tr');cell(tr,(m.pdfRow||r.index+1)+' · '+r.path);cell(tr,[m.league,m.homeDisplay||m.home,m.awayDisplay||m.away,m.title].filter(Boolean).join(' / '));cell(tr,m.status||m.verificationStatus||'စစ်ဆေးရန်');const td=cell(tr,''),b=document.createElement('button');b.textContent='ပြင်ရန်';b.onclick=()=>{selected=r;$('selected').hidden=false;$('selectedTitle').textContent=(m.fixtureId||m.id||'Row '+(r.index+1))+' · '+$('sectionTitle').textContent;$('rowJson').value=JSON.stringify(M.sectionValue(r,section),null,2);$('plainPreviewLabel').hidden=section!=='previews';$('rowJsonLabel').hidden=section==='previews';$('plainPreview').value=m.dailyPreviewText||'';};td.append(b);$('rows').append(tr);}
  }
  $('previewLinks').replaceChildren();const version=$('version').value;
  for(const [name,path] of [['Main','/'],['Goal Zone','/future-code-journal/'],['BW Sport','/bw-sport/'],['YKZ','/ykz-family/'],['Ko Thet','/ko-thet-family/']]){
   for(const [label,suffix] of [['ပွဲကြို',''],['ပေါက်ကြေး','odds.html']]){const a=document.createElement('a'),u=new URL(path+suffix,location.origin);u.searchParams.set('fcDraft',version);u.searchParams.set('date',draft.editorialDate);a.href=u.href;a.target='_blank';a.rel='noopener';a.textContent=name+' '+label;$('previewLinks').append(a);}
  }
 }
 for(const [id,label] of M.sections){const b=document.createElement('button');b.textContent=label;b.dataset.section=id;b.onclick=()=>{section=id;$('selected').hidden=true;render();if(id==='history')$('history').click();if(id==='usage')$('usage').click();};$('sections').append(b);}
 async function refresh(){const a=await api('state');$('generation').value=a.generation;$('status').textContent=a.version_id?'Published Version: '+a.version_id+' · Generation '+a.generation:'စစ်ဆေးပြီး Publication မရှိသေးပါ';if(a.version_id&&!dirty){$('version').value=a.version_id;loaded(await snapshot('export'));}show(a);}
 $('file').addEventListener('change',async()=>{try{const f=$('file').files[0];if(f){if(f.size>12*1024*1024)throw Error('JSON file ကြီးလွန်းသည်');loaded(JSON.parse(await f.text()));}}catch(e){show({error:e.message});}});
 $('sourceFile').addEventListener('change',async()=>{try{if(!draft)throw Error('Draft အရင်ဖွင့်ပါ');const f=$('sourceFile').files[0];if(!f)return;if(f.size>30*1024*1024)throw Error('Source file ကြီးလွန်းသည်');const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await f.arrayBuffer())),n=>n.toString(16).padStart(2,'0')).join('');const sources=JSON.parse($('sourceManifest').value);sources.files=sources.files||[];sources.files=sources.files.filter(x=>x.name!==f.name);sources.files.push({name:f.name,sha256:hash});$('sourceManifest').value=JSON.stringify(sources,null,2);show({sourceHashed:true,name:f.name,sha256:hash,uploaded:false});}catch(e){show({error:e.message});}});
 for(const id of ['search','league'])$(id).addEventListener(id==='search'?'input':'change',render);
 action('refresh',refresh);action('history',async()=>show(await api('history')));action('usage',async()=>show(await api('usage')));
 action('applyPayload',async()=>{const value=JSON.parse($('payload').value);if(!draft)loaded(value);else{draft=M.normalize(value);changed();}});
 action('applySource',async()=>{if(!draft)throw Error('Draft အရင်ဖွင့်ပါ');const value=JSON.parse($('sourceManifest').value);if(!Array.isArray(value.files))throw Error('files array လိုအပ်သည်');draft.sourceManifest=value;changed();show({sourceLedgerUpdated:true});});
 action('applyRow',async()=>{if(!selected)throw Error('Row ရွေးပါ');M.updateSection(draft,selected,section,section==='previews'?{dailyPreviewText:$('plainPreview').value}:JSON.parse($('rowJson').value));changed();show({rowUpdated:true,path:selected.path,row:selected.index+1});});
 action('downloadDraft',async()=>{if(!draft)throw Error('Draft အရင်ဖွင့်ပါ');download('football-private-draft-'+draft.editorialDate+'.json',JSON.stringify(draft,null,2));});
 action('backup',async()=>{const b=await snapshot('export'+($('version').value?'?version='+encodeURIComponent($('version').value):'')),text=JSON.stringify(b),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),n=>n.toString(16).padStart(2,'0')).join('');download('football-backup-'+b.version.id+'.json',text);download('football-backup-'+b.version.id+'.json.sha256',hash+'\n');show({backupDownloaded:true,version:b.version.id,resources:Object.keys(b.resources).length});});
 async function saveCorrection(){
  if(!editBase||!draft)throw Error('လက်ရှိ Live ကို အရင်ဖွင့်ပါ');
  const resources=Object.fromEntries(M.changes(original,draft).map(x=>[x.path,x.after]));
  if(!Object.keys(resources).length)throw Error('ပြောင်းထားသော အချက်အလက် မရှိပါ');
  const body={editorialDate:draft.editorialDate,expectedGeneration:Number($('generation').value),correction:{baseVersion:editBase,reason:$('editReason').value},resources};
  if(Object.keys(resources).length>20||new TextEncoder().encode(JSON.stringify(body)).length>1450000)throw Error('ပြင်ဆင်ချက်များကို အပိုင်းခွဲ၍ သိမ်းပါ');
  const result=await api('import',body,importKey);savedCorrection=result.version;$('version').value=result.version;$('generation').value=result.generation;dirty=false;render();$('editStatus').textContent='ပြင်ဆင်ချက် Draft သိမ်းပြီးပါပြီ · '+result.version;show({...result,published:false});return result;
 }
 action('editLive',async()=>{if(dirty&&!window.confirm('မသိမ်းရသေးသော ပြင်ဆင်ချက်များ ရှိသည်။ လက်ရှိ Live ကို ပြန်ဖွင့်မလား။'))return;dirty=false;await refresh();});
 action('importPreviewTexts',async()=>{
  if(!editBase)throw Error('လက်ရှိ Live ကို အရင်ဖွင့်ပါ');
  const version=$('previewSourceVersion').value.trim();if(!/^[a-f0-9-]{36}$/.test(version))throw Error('Draft Version မမှန်ပါ');
  const source=await api('resource?version='+encodeURIComponent(version)+'&path=data%2Ftoday.json');
  if(source.reportDate!==draft.editorialDate)throw Error('Draft ရက်စွဲ မတူပါ');
  const rows=M.rows(draft,'previews'),ids=new Set(source.matches?.map(m=>m.fixtureId));
  if(!Array.isArray(source.matches)||ids.size!==source.matches.length||source.matches.length!==rows.length||source.matches.some(m=>!m.fixtureId||typeof m.dailyPreviewText!=='string'||!m.dailyPreviewText.trim()))throw Error('Draft ပွဲနှင့် စာသား မပြည့်စုံပါ');
  const text=new Map(source.matches.map(m=>[m.fixtureId,m]));
  for(const row of rows){const m=text.get(row.value.fixtureId);if(!m||m.home!==row.value.home||m.away!==row.value.away||m.league!==row.value.league)throw Error('Draft ပွဲအစဉ်နှင့် အသင်းမကိုက်ပါ');}
  for(const row of rows)M.updateSection(draft,row,'previews',{dailyPreviewText:text.get(row.value.fixtureId).dailyPreviewText});
  changed();show({previewTextsCopied:rows.length,sourceVersion:version,published:false});
 });
 action('saveCorrection',saveCorrection);
 action('publishCorrection',async()=>{
  if(!editBase)throw Error('လက်ရှိ Live ကို အရင်ဖွင့်ပါ');
  if(dirty||!savedCorrection)await saveCorrection();
  const result=await api('publish',{version:savedCorrection,expectedGeneration:Number($('generation').value)});
  $('generation').value=result.generation;dirty=false;await refresh();show({...result,published:true});$('editStatus').textContent='ပြင်ဆင်ချက် Live ဖြစ်ပါပြီ · Generation '+result.generation;
 });
 action('save',async()=>{
  if(editBase){await saveCorrection();return;}if(!draft)throw Error('Draft အရင်ဖွင့်ပါ');const batches=M.batches(draft,Number($('generation').value),baseDraft);let version;
  for(let i=0;i<batches.length;i++){const payload={...batches[i],...(version?{baseDraft:version}:{})};const saved=await api('import',payload,importKey+'-'+i);version=saved.version;$('status').textContent='Draft batch '+(i+1)+' / '+batches.length;}
  $('version').value=version;dirty=false;original=M.copy(draft);baseDraft=null;render();show({draftSaved:true,version,batches:batches.length,published:false});
 });
 action('draft',async()=>{const b=await snapshot('draft?version='+encodeURIComponent($('version').value));loaded(b);if(!b.version.validated_at&&!b.version.ever_published)baseDraft=b.version.id;show({draftLoaded:true,version:b.version.id});});
 action('validate',async()=>{if(dirty)throw Error('ပြင်ဆင်ချက်များကို Draft သိမ်းပြီးမှ Validation စစ်ပါ');show(await api('validate',{version:$('version').value,review:JSON.parse($('review').value),...($('migration').checked?{mode:'migration'}:{})}));});
 for(const op of ['publish','rollback'])action(op,async()=>{if(dirty)throw Error('မသိမ်းရသေးသော ပြင်ဆင်ချက် ရှိနေသည်');if(!$('confirm').checked)throw Error('ထုတ်ဝေရန် အတည်ပြုချက် ရွေးပါ');const data=await api(op,{version:$('version').value,expectedGeneration:Number($('generation').value)});$('generation').value=data.generation;$('confirm').checked=false;show(data);});
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 render();refresh().catch(e=>{$('status').textContent=e.message;});
})();
