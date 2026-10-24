// Three-way JSON correction merge. Only owner-edited values are applied to live data.
const equal=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
const object=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const copy=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
const own=(x,k)=>x!=null&&Object.hasOwn(x,k);
const forbidden=new Set(['__proto__','prototype','constructor']);
export function mergeCorrection(base,edited,live,path='',changes=[]){
 if(equal(base,edited))return copy(live);
 if(equal(edited,live))return copy(live);
 if(object(base)&&object(edited)&&object(live)){
  const out=copy(live);
  for(const key of new Set([...Object.keys(base),...Object.keys(edited)])){
   if(forbidden.has(key))throw Error('Unsafe JSON key');
   if(own(base,key)===own(edited,key)&&equal(base[key],edited[key]))continue;
   const next=path+'/'+key.replaceAll('~','~0').replaceAll('/','~1');
   const value=mergeCorrection(base[key],edited[key],live[key],next,changes);
   if(own(edited,key))out[key]=value;else delete out[key];
  }
  return out;
 }
 if(Array.isArray(base)&&Array.isArray(edited)&&Array.isArray(live)&&base.length===edited.length){
  const id=x=>object(x)?x.fixtureId||x.id:null;
  const ids=base.map(id),stable=ids.every(Boolean)&&new Set(ids).size===ids.length&&edited.every((x,i)=>id(x)===ids[i]);
  if(stable){
   if(new Set(live.map(id)).size!==live.length)throw Error('Duplicate live row identity');
   const out=copy(live);
   for(let i=0;i<base.length;i++)if(!equal(base[i],edited[i])){
    const j=live.findIndex(x=>id(x)===ids[i]);if(j<0)throw Error('Edited row was removed: '+ids[i]);
    out[j]=mergeCorrection(base[i],edited[i],live[j],path+'/'+j,changes);
   }
   return out;
  }
  if(base.length===live.length&&base.every((x,i)=>!id(x)||id(x)===id(live[i])))return base.map((x,i)=>mergeCorrection(x,edited[i],live[i],path+'/'+i,changes));
 }
 if(!equal(base,live))throw Error('Concurrent edit conflict at '+(path||'/')+'; reload and review this field');
 changes.push(path||'/');if(changes.length>5000)throw Error('Too many edits in one correction');
 return copy(edited);
}
export function newlyIntroduced(before,after){
 const counts=new Map();for(const e of before)counts.set(e,(counts.get(e)||0)+1);
 return after.filter(e=>{const n=counts.get(e)||0;if(n){counts.set(e,n-1);return false;}return true;});
}
