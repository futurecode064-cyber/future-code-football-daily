import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isNonCompetitiveFormMatch,validateEditorial} from '../src/editorial-validation.mjs';

test('non-competitive friendly, exhibition and pre-season matches are prohibited',()=>{
 for(const competition of ['Friendlies Clubs','Club Friendly','International Friendlies',
  'Exhibition Match','Pre-Season','pre season tournament','ခြေစမ်းပွဲ']){
  assert.equal(isNonCompetitiveFormMatch(competition),true,competition);
 }
 for(const competition of ['UEFA Europa League','FA Cup','League One','Regular Season','Premier League']){
  assert.equal(isNonCompetitiveFormMatch(competition),false,competition);
 }
});

test('publication editorial QA pinpoints excluded last-five results',()=>{
 const day='2026-10-22';
 const fixture={league:'SYNTHETIC VALIDATION LEAGUE',fixtureId:'QA-1',home:'Test Home',away:'Test Away',
  homeDisplay:'စမ်းသပ်အိမ်ရှင်',awayDisplay:'စမ်းသပ်ဧည့်သည်',kickoffYangon:'ည ၁၀ နာရီ',
  kickoffCalendarDate:day,nightEditorialDate:day,
  dailyPreviewText:('စမ်းသပ်မှုအတွက် ရေးထားသော သုံးသပ်ချက်တစ်ခုဖြစ်ပြီး အချက်အလက်မှန်အဖြစ် အသုံးမပြုပါနှင့်။ ').repeat(9)+' **အိမ်ရှင်ကို ရွေးချယ်ပါတယ်။**',
  previewJournalist:{status:'owner_approved_published'},
  fixtureSourceUrl:'https://example.org/fixture',
  myanmarOdds:{upperTeam:'စမ်းသပ်အိမ်ရှင်',bodyOdds:'1-40',goalTotalOdds:'3='},
  homeLastFive:[],awayLastFive:[]};
 const f=(competition)=>({competition,sourceUrl:'https://example.org/results',result:'W',
  teamGoals:1,opponentGoals:0,date:'2026-10-12'});
 fixture.homeLastFive=Array.from({length:5},(_,i)=>f(i===2?'Friendlies Clubs':'League One'));
 fixture.awayLastFive=Array.from({length:5},()=>f('League One'));
 const odds={league:fixture.league,canonicalHome:fixture.home,canonicalAway:fixture.away,
  home:fixture.homeDisplay,away:fixture.awayDisplay,upperTeam:fixture.homeDisplay,
  bodyOdds:'1-40',goalTotalOdds:'3=',currentBodyOdds:'',currentGoalTotalOdds:''};
 const bundle={report:{reportDate:day,published:true,matchDateTimezone:'Asia/Yangon',
  noFixturesLeagues:[],matches:[fixture]},odds:{reportDate:day,matches:[odds]}};
 const errors=validateEditorial(bundle,day);
 assert.ok(errors.some(x=>x.includes('Friendly/Exhibition')&&x.includes('home')&&x.includes('#3')),errors.join('\n'));
 fixture.homeLastFive[2].competition='League One';
 const fixed=validateEditorial(bundle,day);
 assert.equal(fixed.filter(x=>x.includes('Friendly/Exhibition')).length,0,fixed.join('\n'));
});
