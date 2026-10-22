import test from 'node:test';import assert from 'node:assert/strict';
import {validateEditorial} from '../src/editorial-validation.mjs';
test('accepted exact plain Special Choice closing line remains valid',()=>{
 const row={home:'home',away:'away',homeDisplay:'အိမ်ရှင်',awayDisplay:'ဧည့်သည်',league:'TEST CUP',
  kickoffYangon:'ည ၁၀ နာရီ',kickoffCalendarDate:'2026-10-22',nightEditorialDate:'2026-10-22',
  fixtureSourceUrl:'https://example.org/test',specialChoice:true,specialChoiceRank:1,
  specialAnalysisParagraphs:['အထောက်အထားကို အခြေခံထားသော ရွေးချယ်မှု။','ဒီပွဲကို ရွေးချယ်ပါတယ်'],
  dailyPreviewText:'ဒီဟာဟာ နမူနာ သုံးသပ်ချက်ဖြစ်ပါတယ်။ '.repeat(30)+' **အိမ်ရှင်ကို ရွေးချယ်ပါတယ်။**',
  previewJournalist:{status:'owner_approved_published'},
  homeLastFive:[],awayLastFive:[],myanmarOdds:{upperTeam:'အိမ်ရှင်',bodyOdds:'1-40',goalTotalOdds:'3='}};
 const f={result:'W',teamGoals:1,opponentGoals:0,sourceUrl:'https://example.org/results',competition:'League One',date:'2026-10-12'};
 row.homeLastFive=Array.from({length:5},()=>({...f}));
 row.awayLastFive=Array.from({length:5},()=>({...f}));
 const bundle={report:{reportDate:'2026-10-22',published:true,matchDateTimezone:'Asia/Yangon',
 noFixturesLeagues:[],matches:[row]},odds:{reportDate:'2026-10-22',matches:[{
 home:'အိမ်ရှင်',away:'ဧည့်သည်',canonicalHome:'home',canonicalAway:'away',league:'TEST CUP',
 upperTeam:'အိမ်ရှင်',bodyOdds:'1-40',goalTotalOdds:'3='}]}};
 const errors=validateEditorial(bundle,'2026-10-22');
 assert.ok(!errors.some(e=>e.includes('Special စာမူ')),errors.join('\n'));
 row.specialAnalysisParagraphs.at(-1);
 row.specialAnalysisParagraphs[1]='ဒီပွဲကို မရွေးချယ်ပါ';
 assert.ok(validateEditorial(bundle,'2026-10-22').some(e=>e.includes('Special စာမူ')));
});
