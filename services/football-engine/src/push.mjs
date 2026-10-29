// Optional FCM publication outbox. Disabled unless FC_PUSH_ENABLED=true.
// Requires a private FIREBASE_SERVICE_ACCOUNT_JSON Worker secret and D1 migration 0005.
export const BRANDS = Object.freeze({
 main: {topic:"fc_football_main",title:"Future Code Football",path:"/"},
 goal_zone: {topic:"fc_football_goal_zone",title:"Goal Zone",path:"/future-code-journal/"},
 ykz: {topic:"fc_football_ykz",title:"YKZ Family",path:"/ykz-family/"},
 bw: {topic:"fc_football_bw",title:"BW Sport",path:"/bw-sport/"},
 ko_thet: {topic:"fc_football_ko_thet",title:"Ko Thet Family",path:"/ko-thet-family/"},
 kmm: {topic:"fc_football_kmm",title:"KMM Sport Hub",path:"/kmm-sport-hub/"},
 bcf: {topic:"fc_football_bcf",title:"BCF Bet City Family",path:"/bet-city-family/"}
});
export const MORNING_BODY=[
 "ယနေ့ပွဲစဉ်များနှင့် မနက်ပိုင်းပေါက်ကြေးများကို ကြည့်ရှုနိုင်ပါပြီ။",
 "ယနေ့ပွဲကြိုသုံးသပ်ချက်များနှင့် Special Choice များကို ဖတ်ရှုနိုင်ပါပြီ။",
 "မနေ့က ယှဉ်ပြိုင်ခဲ့သော ပွဲစဉ်များ၏ ရလဒ်များကို ကြည့်ရှုနိုင်ပါပြီ။"
].join("\n");
export const EVENING_TITLE="ညနေကြေးများ ရပါပြီ";
export const EVENING_BODY="နောက်ဆုံးပြောင်းလဲသွားသော ပေါက်ကြေးများကို ဝင်ရောက်ကြည့်ရှုနိုင်ပါပြီ။";
export function previousDay(day){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new Error("Invalid editorial day");
 const value=new Date(day+"T12:00:00Z");value.setUTCDate(value.getUTCDate()-1);
 return value.toISOString().slice(0,10);
}
const text=s=>typeof s==="string"&&s.trim().length>0;
const hasPrice=m=>text(m?.bodyOdds)||text(m?.goalTotalOdds);
const hasEveningPrice=m=>text(m?.eveningBodyOdds)||text(m?.eveningGoalTotalOdds);
export function notificationReadiness(day,resources){
 const report=resources["data/today.json"];
 const odds=resources["data/odds/"+day+".json"];
 const archive=resources["data/archive/"+previousDay(day)+".json"];
 const evening=resources["data/odds/evening/"+day+".json"];
 const matches=Array.isArray(report?.matches)?report.matches:[];
 const eligible=matches.filter(m=>m.eligibleForPreview!==false);
 const previewsReady=eligible.length>0&&eligible.every(m=>text(m.dailyPreviewText));
 const specialReady=matches.filter(m=>m.specialChoice===true&&text(m.dailyPreviewText)).length>=2;
 const rows=Array.isArray(odds?.matches)?odds.matches:[];
 const fixtureIds=new Set(matches.map(m=>m.fixtureId).filter(Boolean));
 const oddsReady=odds?.reportDate===day&&rows.length>0&&rows.every(m=>fixtureIds.has(m.fixtureId)&&hasPrice(m));
 const oldMatches=Array.isArray(archive?.matches)?archive.matches:[];
 const resultsReady=archive?.published===true&&archive?.reportDate===previousDay(day)&&oldMatches.length>0&&
  oldMatches.every(m=>m.status==="finished"&&text(m.finalScore));
 const morning=report?.published===true&&report?.reportDate===day&&matches.length>0&&previewsReady&&specialReady&&oddsReady&&resultsReady;
 const eveningRows=Array.isArray(evening?.matches)?evening.matches:[];
 const afternoon=report?.published===true&&report?.reportDate===day&&evening?.reportDate===day&&
  eveningRows.length>0&&eveningRows.every(m=>fixtureIds.has(m.fixtureId)&&hasEveningPrice(m));
 return {morning:Boolean(morning),afternoon:Boolean(afternoon),
  checks:{fixtures:matches.length>0,morningOdds:oddsReady,previews:previewsReady,specialChoice:specialReady,previousResults:resultsReady,eveningOdds:afternoon}};
}
const bytes=s=>new TextEncoder().encode(s);
const b64u=input=>btoa(String.fromCharCode(...input)).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const encode=s=>b64u(bytes(s));
async function oauthToken(credentials,fetcher){
 if(!credentials?.client_email||!credentials?.private_key||!credentials?.project_id)throw new Error("FCM service account incomplete");
 const header=encode(JSON.stringify({alg:"RS256",typ:"JWT"}));
 const now=Math.floor(Date.now()/1000);
 const claim=encode(JSON.stringify({iss:credentials.client_email,scope:"https://www.googleapis.com/auth/firebase.messaging",
  aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3500}));
 const pem=credentials.private_key.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g,"");
 const raw=Uint8Array.from(atob(pem),c=>c.charCodeAt(0));
 const key=await crypto.subtle.importKey("pkcs8",raw,{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);
 const sig=b64u(new Uint8Array(await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,bytes(header+"."+claim))));
 const response=await fetcher("https://oauth2.googleapis.com/token",{method:"POST",
  headers:{"Content-Type":"application/x-www-form-urlencoded"},
  body:new URLSearchParams({grant_type:"urn:ietf:params:oauth:grant-type:jwt-bearer",assertion:header+"."+claim+"."+sig}).toString()});
 if(!response.ok)throw new Error("FCM OAuth rejected "+response.status);
 const result=await response.json();
 if(!result.access_token)throw new Error("FCM OAuth token missing");
 return result.access_token;
}
export function firebaseMessage(brand,kind,day){
 const info=BRANDS[brand];
 if(!info||!["morning","afternoon"].includes(kind))throw new Error("Invalid brand/kind");
 const route="https://future-code-football-daily.pages.dev"+info.path;
 const title=kind==="morning"?info.title:EVENING_TITLE;
 const body=kind==="morning"?MORNING_BODY:EVENING_BODY;
 return {message:{topic:info.topic,notification:{title,body},
  data:{brand,kind,day,route,noticeId:brand+":"+day+":"+kind},
  android:{priority:"HIGH",collapse_key:day+"-"+kind,notification:{channel_id:"journal_content",click_action:"FC_OPEN_NOTIFICATION"}},
  webpush:{fcm_options:{link:route}}}};
}
// Topic sends are single backend dispatches, not guarantees of exactly-once device delivery.
export async function dispatchPublicationNotifications(env,versionId,day,resources,fetcher=fetch){
 if(env.FC_PUSH_ENABLED!=="true")return {status:"disabled"};
 if(!env.FIREBASE_SERVICE_ACCOUNT_JSON)return {status:"missing-firebase-secret"};
 const checks=notificationReadiness(day,resources);
 const kinds=["morning","afternoon"].filter(k=>checks[k]);
 if(!kinds.length)return {status:"not-ready",checks:checks.checks};
 const credentials=JSON.parse(env.FIREBASE_SERVICE_ACCOUNT_JSON),db=env.DB;
 // Reserve every day/brand/kind before making network requests. No replay on ambiguous failure.
 const reserved=[];
 for(const kind of kinds)for(const brand of Object.keys(BRANDS)){
  const id=brand+":"+day+":"+kind;
  const row=await db.prepare("INSERT INTO notification_outbox(id,brand,editorial_date,kind,version_id,status,created_at) VALUES(?,?,?,?,?,'reserved',?) ON CONFLICT(id) DO NOTHING")
   .bind(id,brand,day,kind,versionId,new Date().toISOString()).run();
  if(row.meta?.changes===1)reserved.push({id,brand,kind});
 }
 if(!reserved.length)return {status:"already-dispatched",checks:checks.checks};
 let token;
 try{token=await oauthToken(credentials,fetcher);}
 catch(e){
  for(const item of reserved)await db.prepare("UPDATE notification_outbox SET status='failed',error=?,completed_at=? WHERE id=? AND status='reserved'")
   .bind("OAuth unavailable",new Date().toISOString(),item.id).run();
  return {status:"failed",reason:"OAuth unavailable",count:reserved.length};
 }
 let sent=0,failed=0;
 for(const item of reserved){
  try{
   const res=await fetcher("https://fcm.googleapis.com/v1/projects/"+encodeURIComponent(credentials.project_id)+"/messages:send",
    {method:"POST",headers:{"Authorization":"Bearer "+token,"Content-Type":"application/json"},
     body:JSON.stringify(firebaseMessage(item.brand,item.kind,day))});
   if(!res.ok)throw new Error("FCM HTTP "+res.status);
   const data=await res.json();
   await db.prepare("UPDATE notification_outbox SET status='sent',fcm_message_id=?,completed_at=? WHERE id=? AND status='reserved'")
    .bind(data.name||"",new Date().toISOString(),item.id).run();
   sent++;
  }catch(e){
   await db.prepare("UPDATE notification_outbox SET status='failed',error=?,completed_at=? WHERE id=? AND status='reserved'")
    .bind(String(e.message||e).slice(0,200),new Date().toISOString(),item.id).run();
   failed++;
  }
 }
 return {status:failed?"partial":"sent",sent,failed,checks:checks.checks};
}
