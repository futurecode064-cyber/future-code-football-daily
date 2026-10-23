export const dateValid = x => typeof x==='string' && /^\d{4}-\d{2}-\d{2}$/.test(x) && !isNaN(Date.parse(x)) && new Date(x+'T00:00:00Z').toISOString().slice(0,10)===x;
export const resourceAllowed = p => p==='data/today.json'||p==='data/news/latest.json'||/^data\/(archive|odds|odds\/evening|fixtures|news\/archive)\/\d{4}-\d{2}-\d{2}\.json$/.test(p) && dateValid(p.slice(-15,-5));
export function yangonDate(now=new Date(),offset=0){return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Yangon',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(+now+offset*86400000));}
export function validateResource(path,value){
 const errors=[];

  if(!resourceAllowed(path)){errors.push(`Disallowed public resource: ${path}`);return errors;}
  if(!value||typeof value!=='object'||Array.isArray(value)){errors.push(`${path}: object required`);return errors;}
  if(path.includes('/news/')) {if(!Array.isArray(value.items))errors.push(`${path}: news items required`);return errors;}
  if(!dateValid(value.reportDate)||!Array.isArray(value.matches)){errors.push(`${path}: date/matches required`);return errors;}
  if(path!=='data/today.json' && value.reportDate!==path.slice(-15,-5))errors.push(`${path}: path/date mismatch`);
  const ids=new Set();
  value.matches.forEach((m,i)=>{
   if(!m||typeof m!=='object'){errors.push(`${path}:${i+1}: match required`);return;}
   if(!m.home||!m.away||m.home===m.away||!m.league)errors.push(`${path}:${i+1}: team/league identity`);
   const id=m.fixtureId||[m.league,m.home,m.away].join('|');
   if(ids.has(id))errors.push(`${path}:${i+1}: duplicate match`);ids.add(id);
   if(m.status==='finished'&&!/^\d{1,2}-\d{1,2}$/.test(m.finalScore||''))errors.push(`${path}:${i+1}: invalid final result`);
  });
 return errors;
}
export function validateResources(resources,day,{migration=false}={}) {
 const errors=[]; const report=resources['data/today.json']; const sheet=resources[`data/odds/${day}.json`];
 if(!dateValid(day)) errors.push('Invalid editorial date');
 for(const [path,value] of Object.entries(resources))errors.push(...validateResource(path,value));
 if(!report||report.reportDate!==day||report.published!==true)errors.push('Published current report/date required');
 if(!sheet||!Array.isArray(sheet.matches)||sheet.reportDate!==day)errors.push('Matching opening odds required');
 if(!migration&&report&&sheet&&Array.isArray(report.matches)&&Array.isArray(sheet.matches)){
  if(report.matches.length!==sheet.matches.length)errors.push('Report/odds count mismatch');
  const rows=new Set();
  report.matches.forEach((m,i)=>{
   const o=sheet.matches[i]; if(!o||!m)return;
   if(!m.fixtureId||m.fixtureId!==o.fixtureId||m.home!==o.canonicalHome||m.away!==o.canonicalAway||m.homeDisplay!==o.home||m.awayDisplay!==o.away||m.league!==o.league)errors.push(`Row ${i+1}: canonical/PDF mapping mismatch`);
   if(!Number.isInteger(o.pdfRow)||rows.has(o.pdfRow)||o.pdfRow!==i+1)errors.push(`Row ${i+1}: PDF order/duplicate`); rows.add(o.pdfRow);
   if(![o.home,o.away].includes(o.upperTeam)||!o.bodyOdds||!o.goalTotalOdds)errors.push(`Row ${i+1}: opening odds/giving team missing`);
   if(!m.dailyPreviewText||!Array.isArray(m.homeLastFive)||m.homeLastFive.length!==5||!Array.isArray(m.awayLastFive)||m.awayLastFive.length!==5)errors.push(`Row ${i+1}: full preview/last five required`);
   if(m.nightEditorialDate!==day||![day,yangonDate(new Date(day+'T12:00:00Z'),1)].includes(m.kickoffCalendarDate))errors.push(`Row ${i+1}: editorial/kickoff date mismatch`);
  });
 }
 return errors;
}
export function reviewErrors(review){
 const gates=['pdfFidelity','fixtureIdentity','editorial','formsAndOdds','results','newsScopeAndImages','allBrands','downloads','mobile'];
 return gates.filter(k=>review?.[k]?.passed!==true||typeof review[k].evidence!=='string'||!review[k].evidence.trim()).map(k=>`Missing verified review: ${k}`);
}
