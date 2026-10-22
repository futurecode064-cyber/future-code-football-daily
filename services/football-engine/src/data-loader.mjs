// Explicit opt-in adapter. Production HTML does not load this module yet.
// Load the complete resource set BEFORE exposing any new data to renderers/exporters.
export async function loadPublishedBundle({apiBase,paths,brand='main',fetcher=fetch,storage=null}) {
 let key;
 try {
  const base=new URL(apiBase);if(base.protocol!=='https:'&&base.hostname!=='localhost')throw Error('HTTPS API required');
  // Never reuse another environment's or brand's publication after an outage.
  key=`fc-football-last-complete-bundle-v2:${JSON.stringify([base.origin,brand])}`;
  const manifestResponse=await fetcher(new URL('/api/football/manifest',base),{cache:'no-store'});
  if(!manifestResponse.ok)throw Error('Manifest unavailable');
  const manifest=await manifestResponse.json();if(!manifest.version)throw Error('No active version');
  const values=await Promise.all(paths.map(async path=>{
   const url=new URL('/api/football/resource',base);url.searchParams.set('path',path);url.searchParams.set('version',manifest.version);url.searchParams.set('brand',brand);
   const response=await fetcher(url);if(!response.ok||response.headers.get('X-Football-Version')!==manifest.version)throw Error('Incomplete publication bundle');
   return [path,await response.json()];
  }));
  const bundle={version:manifest.version,publishedAt:manifest.publishedAt,fetchedAt:new Date().toISOString(),resources:Object.fromEntries(values),stale:false};
  try{storage?.setItem(key,JSON.stringify(bundle));}catch{}
  return bundle;
 } catch(error) {
  try{const prior=key?JSON.parse(storage?.getItem(key)||'null'):null;if(prior?.version&&paths.every(p=>prior.resources?.[p]))return {...prior,stale:true,error:'API unavailable; showing saved publication'};}catch{}
  // Caller keeps its existing static data/UI. Never replace it with empty/partial data.
  return {fallback:'static',stale:true,error:'API unavailable; keep existing static data'};
 }
}
