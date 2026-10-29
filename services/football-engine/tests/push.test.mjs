import test from "node:test";
import assert from "node:assert/strict";
import {BRANDS,MORNING_BODY,EVENING_BODY,EVENING_TITLE,notificationReadiness,previousDay,firebaseMessage,dispatchPublicationNotifications} from "../src/push.mjs";
const day="2026-10-29",prev="2026-10-28";
function resources(){
 return {
  "data/today.json":{reportDate:day,published:true,matches:[
   {fixtureId:"a",dailyPreviewText:"Analysis",specialChoice:true},
   {fixtureId:"b",dailyPreviewText:"Analysis",specialChoice:true}
  ]},
  ["data/odds/"+day+".json"]:{reportDate:day,matches:[{fixtureId:"a",bodyOdds:"1-25"},{fixtureId:"b",bodyOdds:"2+05"}]},
  ["data/archive/"+prev+".json"]:{reportDate:prev,published:true,matches:[{status:"finished",finalScore:"2-1"}]},
  ["data/odds/evening/"+day+".json"]:{reportDate:day,matches:[{fixtureId:"a",eveningBodyOdds:"1-20"},{fixtureId:"b",eveningGoalTotalOdds:"2-70"}]}
 };
}
test("previous day and source gating",()=>{
 assert.equal(previousDay("2026-11-01"),"2026-10-31");
 assert.deepEqual(notificationReadiness(day,resources()).morning,true);
 assert.deepEqual(notificationReadiness(day,resources()).afternoon,true);
 const r=resources();delete r["data/archive/"+prev+".json"];
 assert.equal(notificationReadiness(day,r).morning,false);
 assert.equal(notificationReadiness(day,r).afternoon,true);
 const q=resources();q["data/today.json"].matches[1].specialChoice=false;
 assert.equal(notificationReadiness(day,q).morning,false);
 const p=resources();p["data/today.json"].published=false;
 assert.equal(notificationReadiness(day,p).morning,false);
 assert.equal(notificationReadiness(day,p).afternoon,false);
 const k=resources();k["data/odds/evening/"+day+".json"].matches[1].eveningGoalTotalOdds="";
 assert.equal(notificationReadiness(day,k).afternoon,false);
});
test("exact Myanmar copy and seven separate topics",()=>{
 assert.equal(MORNING_BODY.split("\n").length,3);
 assert.equal(EVENING_TITLE,"ညနေကြေးများ ရပါပြီ");
 assert.equal(EVENING_BODY,"နောက်ဆုံးပြောင်းလဲသွားသော ပေါက်ကြေးများကို ဝင်ရောက်ကြည့်ရှုနိုင်ပါပြီ။");
 assert.equal(Object.keys(BRANDS).length,7);
 assert.equal(new Set(Object.values(BRANDS).map(b=>b.topic)).size,7);
 for(const brand of Object.keys(BRANDS)){
  const m=firebaseMessage(brand,"morning",day).message;
  assert.equal(m.data.noticeId,brand+":"+day+":morning");
  assert.equal(m.notification.body,MORNING_BODY);
  assert.match(m.data.route,/^https:\/\/future-code-football-daily\.pages\.dev\//);
 }
});
test("FCM disabled and not-ready modes never write to database or network",async()=>{
 const r=resources();let called=false;
 const env={DB:{prepare(){called=true;throw new Error("DB shouldn't be used");}},FC_PUSH_ENABLED:"false"};
 assert.equal((await dispatchPublicationNotifications(env,"v1",day,r)).status,"disabled");
 assert.equal(called,false);
 env.FC_PUSH_ENABLED="true";env.FIREBASE_SERVICE_ACCOUNT_JSON='{"project_id":"example"}';
 const n=resources();n["data/today.json"].published=false;
 assert.equal((await dispatchPublicationNotifications(env,"v1",day,n)).status,"not-ready");
 assert.equal(called,false);
});
