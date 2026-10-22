// Derived from the existing owner editor validation contract; keep stricter checks during migration.
import {dateValid} from './validation.mjs';
// Never count friendly/exhibition/pre-season games in competitive last-five form.
export function isNonCompetitiveFormMatch(competition){
 return /\b(?:friendlies|friendly|exhibition|testimonial|pre[\s-]?season)\b|ခြေစမ်း/iu.test(String(competition||''));
}
function validSpecialEnding(raw){
 const last=String(raw||'').trim();
 return last==='ဒီပွဲကို ရွေးချယ်ပါတယ်'||/\\*\\*[^*]+\\s*ကို ရွေးချယ်ပါတယ်။\\*\\*$/.test(last);
}
const EDITOR_LEAGUE_SIZES = {'Premier League':20,Championship:24,'League One':24,'La Liga':20,'La Liga 2':22,'Serie A':20,'Serie B':20,Bundesliga:18,'2. Bundesliga':18,'Ligue 1':18,'Ligue 2':18};

export function validateEditorial(bundle,day){
 const editorDate=dateValid;
 const editorDay=(offset=0)=>new Date(Date.parse(day+'T00:00:00Z')+offset*86400000).toISOString().slice(0,10);
 const editorUrl=value=>{try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password;}catch{return false;}};
function editorErrors(bundle){
 const errors=[], report=bundle?.report, sheet=bundle?.odds;
 if(!report||!sheet||!Array.isArray(report.matches)||!Array.isArray(sheet.matches))return ['ပွဲနှင့် ပေါက်ကြေးဖိုင် ပုံစံမမှန်ပါ'];
 if(report.reportDate!==editorDay()||sheet.reportDate!==report.reportDate)errors.push('ယနေ့ မြန်မာရက်စွဲနှင့် report/odds ရက်စွဲတို့ ကိုက်ညီရမည်');
 if(report.published!==true||report.matchDateTimezone!=='Asia/Yangon')errors.push('Published နှင့် Asia/Yangon သတ်မှတ်ချက်လိုအပ်သည်');
 if(!report.matches.length||report.matches.length>120)errors.push('ပွဲအရေအတွက် ၁ မှ ၁၂၀ အတွင်း ဖြစ်ရမည်');
 if(!Array.isArray(report.noFixturesLeagues))errors.push('noFixturesLeagues စာရင်းလိုအပ်သည်');
 if(sheet.matches.length!==report.matches.length)errors.push('ပွဲနှင့် ကြေး အရေအတွက် မတူပါ');
 const seen=new Set(),ranks=new Set();
 report.matches.forEach((m,i)=>{
  const prefix='ပွဲ '+(i+1)+' · ',e=text=>errors.push(prefix+text);
  if(!m||typeof m!=='object'){e('ပုံစံမမှန်ပါ');return;}
  for(const k of ['home','away','homeDisplay','awayDisplay','league','kickoffYangon'])if(typeof m[k]!=='string'||!m[k].trim()||m[k].length>200)e(k+' ဖြည့်ပါ');
  if(m.home===m.away)e('အိမ်ရှင်နှင့် ဧည့်သည် တူနေသည်');
  const identity=[m.league,m.home,m.away].join('|');if(seen.has(identity))e('ပွဲထပ်နေသည်');seen.add(identity);
  if(!editorDate(m.kickoffCalendarDate)||![report.reportDate,editorDay(1)].includes(m.kickoffCalendarDate)||m.nightEditorialDate!==report.reportDate)e('ကန်မည့်ရက် / ညစာရင်းရက် စစ်ပါ');
  const preview=m.dailyPreviewText;
  if(typeof preview!=='string'||preview.trim().length<300||preview.length>20000||/\n/.test(preview)||!preview.endsWith('။**'))e('ပွဲကြိုစာမူ စာလုံး ၃၀၀ အထက်၊ စာပိုဒ်တစ်ခုနှင့် bold ရွေးချယ်စာသားအဆုံးသတ် လိုအပ်သည်');
  if(/ခန့်မှန်း\s*ဂိုးရလဒ်/.test(preview||''))e('ပုံမှန်ပွဲကြိုတွင် ခန့်မှန်းဂိုး မထည့်ပါနှင့်');
  if(m.previewJournalist?.status!=='owner_approved_published')e('ပိုင်ရှင်အတည်ပြုစာမူ metadata လိုအပ်သည်');
  if(!editorUrl(m.fixtureSourceUrl||m.previewV2?.fixtureSourceUrl||m.researchSources?.[0]))e('ပွဲအချက်အလက်ရင်းမြစ် HTTPS URL ဖြည့်ပါ');
  for(const side of ['home','away']){
   if(m[side+'CrestUrl']&&!editorUrl(m[side+'CrestUrl']))e(side+' Logo HTTPS URL မမှန်ပါ');
   const form=m[side+'LastFive'];
   if(!Array.isArray(form)||form.length!==5||form.some(x=>!x||(!/^[WDL]$/.test(x.result||'')&&!(Number.isInteger(x.teamGoals)&&x.teamGoals>=0&&Number.isInteger(x.opponentGoals)&&x.opponentGoals>=0))||!editorUrl(x.sourceUrl)))e(side+' နောက်ဆုံး ၅ ပွဲနှင့် ရင်းမြစ် စစ်ပါ');
   if(Array.isArray(form)){
    form.forEach((entry,j)=>{
     if(isNonCompetitiveFormMatch(entry?.competition))e(side+' နောက်ဆုံး ၅ ပွဲ #'+(j+1)+' သည် Friendly/Exhibition ဖြစ်သည်');
    });
   }
   if(EDITOR_LEAGUE_SIZES[m.league]){
    const r=m[side+'Standing'];if(!r||['played','wins','draws','losses','points','position'].some(k=>!Number.isInteger(r[k])||r[k]<0)||r.played!==r.wins+r.draws+r.losses||r.position<1||r.position>EDITOR_LEAGUE_SIZES[m.league])e(side+' standings (ကစားပြီး = နိုင်+သရေ+ရှုံး၊ အဆင့်၊ ရမှတ်) စစ်ပါ');
   }
  }
  if(EDITOR_LEAGUE_SIZES[m.league]&&!editorUrl(m.standingsSourceUrl))e('Standings ရင်းမြစ် HTTPS URL ဖြည့်ပါ');
  const prices=[m.homeOdds,m.drawOdds,m.awayOdds];if(prices.some(x=>x!==null&&x!==undefined&&x!=='')){
   if(prices.some(x=>!Number.isFinite(Number(x))||Number(x)<=1)||!m.oddsProvider||!editorUrl(m.oddsSourceUrl))e('1X2 သုံးခုလုံး ၁ ထက်ကြီးသောကြေးနှင့် bookmaker/source ဖြည့်ပါ');
  }
  if(m.specialChoice===true){if(!Number.isInteger(m.specialChoiceRank)||m.specialChoiceRank<1||ranks.has(m.specialChoiceRank))e('Special နံပါတ် မထပ်စေရ');ranks.add(m.specialChoiceRank);
   const p=m.specialAnalysisParagraphs;if(!Array.isArray(p)||!p.length||p.some(x=>typeof x!=='string'||x.length>20000)||!validSpecialEnding(p[p.length-1]))e('Special စာမူကို bold ရွေးချယ်စာသားဖြင့် အဆုံးသတ်ပါ');
  }
  const o=sheet.matches[i];if(!o||o.league!==m.league||o.canonicalHome!==m.home||o.canonicalAway!==m.away||o.home!==m.homeDisplay||o.away!==m.awayDisplay){e('ပွဲနှင့် ကြေး အသင်းအစဉ်မကိုက်ပါ');return;}
  for(const k of ['bodyOdds','goalTotalOdds'])if(typeof o[k]!=='string'||!o[k].trim()||o[k].length>40)e('မူလ '+k+' ဖြည့်ပါ');
  for(const k of ['currentBodyOdds','currentGoalTotalOdds','pdfLastColumn'])if(o[k]!==undefined&&(typeof o[k]!=='string'||o[k].length>40))e(k+' ပုံစံမမှန်ပါ');
  for(const k of ['currentBodyOdds','currentGoalTotalOdds'])if(o[k]&&!/^(?:-\d+|\d+[+-]\d+|\d+=)$/.test(o[k]))e(k+' ကို -70၊ 1-30၊ 3+95၊ 1= ပုံစံဖြည့်ပါ');
  if(![m.homeDisplay,m.awayDisplay].includes(o.upperTeam))e('ကြေးပေးအသင်းသည် ပွဲထဲကအသင်း ဖြစ်ရမည်');
  if(!m.myanmarOdds||['upperTeam','bodyOdds','goalTotalOdds'].some(k=>m.myanmarOdds[k]!==o[k]))e('ကတ်နှင့် table မြန်မာကြေးမကိုက်ပါ');
 });
 if(bundle.results){const r=bundle.results;if(r.reportDate!==editorDay(-1)||!Array.isArray(r.matches)||r.matches.length>200)errors.push('မနေ့ကရလဒ် report မမှန်ပါ');else r.matches.forEach((m,i)=>{if(m.status==='finished'&&(!/^\d{1,2}-\d{1,2}$/.test(m.finalScore||'')||!editorUrl(m.resultSourceUrl)||!editorDate(m.resultVerifiedDate)))errors.push('မနေ့က ပွဲ '+(i+1)+' · FT ဂိုးနှင့် ရင်းမြစ် စစ်ပါ');});}
 return errors.slice(0,150);
}

 return editorErrors(bundle);
}
