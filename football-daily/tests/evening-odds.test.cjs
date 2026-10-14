"use strict";
const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const vm=require("node:vm");
const root=path.resolve(__dirname,"..");
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const evening=JSON.parse(read("data/odds/evening/2026-10-14.json"));
const morning=JSON.parse(read("data/odds/2026-10-14.json"));
test("2026-10-14 source sheet has all 18 separate evening rows; morning feed intact",()=>{
 assert.equal(evening.reportDate,"2026-10-14");
 assert.equal(evening.matches.length,18);
 assert.equal(morning.matches.length,15);
 assert.equal(evening.matches.filter(m=>m.identityVerified).length,13);
 assert.equal(evening.matches.filter(m=>!m.identityVerified).length,5);
 assert.equal(evening.matches[0].morningBodyOdds,"2+60");
 assert.equal(evening.matches[0].eveningBodyOdds,"1-65");
 assert.equal(evening.matches[0].morningGoalTotalOdds,"3-100");
 assert.equal(evening.matches[0].eveningGoalTotalOdds,"3-30");
 assert.deepEqual(evening.morningMarketDiscrepancies.map(m=>[m.row,m.field]),[[4,"bodyOdds"],[12,"goalTotalOdds"]]);
});
test("morning original quotes and evening updates remain separate from existing canonical matches",()=>{
 for(const m of evening.matches){
  for(const key of ["morningBodyOdds","eveningBodyOdds","morningGoalTotalOdds","eveningGoalTotalOdds"]){
   assert.match(m[key],/^(?:\d+[+=-]\d*|-\d+)$/,m.row+": "+key);
  }
  if(m.identityVerified){
   const match=morning.matches[m.row-1];
   assert.equal(m.home,match.home);assert.equal(m.away,match.away);
   assert.equal(m.upperTeam,match.upperTeam);
  }else{
   assert.ok(m.sourceHomeLegacy&&m.sourceAwayLegacy);
   assert.ok(!m.homeCrestUrl&&!m.awayCrestUrl);
  }
 }
});
test("all four branded odds pages load the one shared optional evening module",()=>{
 assert.match(read("odds.js"),/evening-odds\.js/);
 const module=read("evening-odds.js");
 assert.match(module,/data\/odds\/evening\//);
 assert.match(module,/ညနေခင်းကြေးပြောင်း/);
 for(const html of ["odds.html","ykz-family/odds.html","bw-sport/odds.html","ko-thet-family/odds.html"]){
  assert.match(read(html),/odds\.js/);
  assert.match(read(html),/oddsList/);
 }
 const css=read("evening-odds.css");
 for(const s of ["--sheet-brand","--sheet-deep","background:#fff","overflow-x:auto"]){
  assert.ok(css.includes(s),s);
 }
});
function loader(){
 const listeners=[],styles=[];
 const document={
  currentScript:{src:"https://example.test/football-daily/evening-odds.js"},
  documentElement:{dataset:{}},
  readyState:"loading",
  createElement(){return {};},
  head:{appendChild(x){styles.push(x)}},
  addEventListener(type,callback){listeners.push({type,callback})}
 };
 const window={};
 vm.runInNewContext(read("evening-odds.js"),{document,window,URL,console});
 assert.equal(styles.length,1);
 assert.equal(listeners[0].type,"DOMContentLoaded");
 return window.FutureCodeEveningOdds;
}
test("quote changes compute point difference on same handicap line and detect line shifts",()=>{
 const o=loader();
 assert.equal(o.difference("-100","-90").text,"+10 မှတ်");
 assert.equal(o.difference("-50","-75").text,"-25 မှတ်");
 assert.equal(o.difference("3-100","3-30").text,"+70 မှတ်");
 assert.equal(o.difference("3+80","3+100").text,"+20 မှတ်");
 assert.equal(o.difference("3=","3=").kind,"same");
 assert.equal(o.difference("2+60","1-65").kind,"line");
 assert.match(o.difference("2+60","1-65").text,/လိုင်း 2 → 1/);
 assert.equal(o.difference("-5","-5").kind,"same");
});
