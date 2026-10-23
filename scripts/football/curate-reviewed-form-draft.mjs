// Editorial candidate builder for 2026-10-22. NEVER writes source, publishes, or changes Cloudflare.
// Output is a REVIEW DRAFT; approval, remaining 32-match review and PDF fidelity are separate gates.
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {isNonCompetitiveFormMatch,validateEditorial} from '../../services/football-engine/src/editorial-validation.mjs';
const [sourceRootArg,outArg]=process.argv.slice(2);
if(!sourceRootArg||!outArg)throw Error('Usage: node scripts/football/curate-reviewed-form-draft.mjs SOURCE_ROOT OUTPUT_DIR');
const root=resolve(sourceRootArg),out=resolve(outArg);
if(out===root||out.startsWith(root+'/'))throw Error('Review output must be outside source directory');
const src=JSON.parse(readFileSync(root+'/data/archive/2026-10-22.json','utf8'));
const odds=JSON.parse(readFileSync(root+'/data/odds/2026-10-22.json','utf8'));
assert.equal(src.reportDate,'2026-10-22');assert.equal(src.matches.length,36);
assert.equal(odds.matches.length,36);
const copied=structuredClone(src);
const replacements=[
 {row:1,fixtureId:'fc-20261022-01',side:'home',old:1,new:[
 ['2026-10-18','Premier League','BKMA',1,0,'away','https://www.soccerbase.com/teams/team.sd?teamTabs=results&team_id=6946'],
 ['2026-10-15','UEFA Europa League','Jagiellonia',1,3,'away','https://www.uefa.com/uefaeuropaleague/news/02a8-2177782493b9-69ba3288701d-1000--europa-league-league-phase-fixtures-and-results-by-team/'],
 ['2026-10-10','Premier League','Alashkert',1,1,'home','https://www.soccerbase.com/teams/team.sd?teamTabs=results&team_id=6946'],
 ['2026-09-20','Premier League','Shirak',3,1,'away','https://www.soccerbase.com/teams/team.sd?teamTabs=results&team_id=6946'],
 ['2026-09-16','UEFA Europa League','Sparta Prague',1,4,'home','https://www.laliga.com/en-CA/match/temporada-2026-2027-europa-league-ararat-armenia-sparta-praga-1']]},
 {row:4,fixtureId:'fc-20261022-04',side:'home',old:1,new:[
 ['2026-10-18','Ekstraklasa','Korona Kielce',6,1,'home','https://www.lechpoznan.pl/en/terminarz,47.html'],
 ['2026-10-15','UEFA Europa League','Bayer Leverkusen',0,4,'home','https://datencenter.dfb.de/en/data-center/europa-league/2026-2027/2/2429687'],
 ['2026-10-10','Ekstraklasa','Śląsk Wrocław',4,1,'away','https://www.lechpoznan.pl/en/terminarz,47.html'],
 ['2026-09-20','Ekstraklasa','Radomiak Radom',5,1,'home','https://www.lechpoznan.pl/en/terminarz,47.html'],
 ['2026-09-17','UEFA Europa League','Crystal Palace',0,4,'away','https://www.uefa.com/uefaeuropaleague/match/2050070/']]},
 {row:12,fixtureId:'fc-20261022-12',side:'home',old:2,new:[
 ['2026-10-18','Ekstraklasa','Zagłębie Lubin',0,1,'away','https://www.jagiellonia.net/mecze.html'],
 ['2026-10-15','UEFA Europa League','Ararat-Armenia',3,1,'home','https://www.jagiellonia.net/mecze.html'],
 ['2026-10-10','Ekstraklasa','Górnik Zabrze',1,3,'home','https://www.jagiellonia.net/mecze.html'],
 ['2026-09-20','Ekstraklasa','Legia Warszawa',1,3,'home','https://www.jagiellonia.net/mecze.html'],
 ['2026-09-16','UEFA Europa League','Olympiacos',1,2,'away','https://www.jagiellonia.net/mecze.html']]},
 {row:12,fixtureId:'fc-20261022-12',side:'away',old:1,new:[
 ['2026-10-18','Belgian Cup','Beerschot VA',1,2,'away','https://www.beerschot.be/nl/live-verslag.php?id=135'],
 ['2026-10-15','UEFA Europa League','Dinamo Zagreb',0,1,'away','https://www.uefa.com/uefaeuropaleague/news/02a8-2177782493b9-69ba3288701d-1000--europa-league-league-phase-fixtures-and-results-by-team/'],
 ['2026-10-10','Belgian Pro League','Cercle Brugge',2,1,'away','https://fbref.com/en/squads/08ad393c/2026-2027/matchlogs/c37/schedule/Anderlecht-Scores-and-Fixtures-Belgian-Pro-League'],
 ['2026-09-19','Belgian Pro League','Zulte Waregem',3,0,'home','https://fbref.com/en/squads/08ad393c/2026-2027/matchlogs/c37/schedule/Anderlecht-Scores-and-Fixtures-Belgian-Pro-League'],
 ['2026-09-16','UEFA Europa League','Lyon',1,2,'home','https://www.uefa.com/news-media/mediaservices/informationkits/competitions/uefaeuropaleague/2027/match/2050060/']]},
 {row:27,fixtureId:'fc-20261022-27',side:'away',old:1,new:[
 ['2026-10-18','Virslīga','Super Nova',2,1,'home','https://rigafc.lv/en/'],
 ['2026-10-15','UEFA Conference League','Kairat Almaty',1,1,'home','https://www.laliga.com/en-MA/match/temporada-2026-2027-europa-conference-league-riga-fc-fc-kairat-almaty-1'],
 ['2026-10-10','Virslīga','Tukums 2000',2,0,'away','https://rigafc.lv/en/results/'],
 ['2026-09-19','Virslīga','FS Jelgava',1,0,'away','https://rigafc.lv/en/results/'],
 ['2026-09-15','Virslīga','SK Super Nova',1,0,'away','https://rigafc.lv/en/results/']]}
];
function toRecord([date,competition,opponent,teamGoals,opponentGoals,venueSide,sourceUrl]){
 const result=teamGoals>opponentGoals?'W':teamGoals<opponentGoals?'L':'D';
 return {date,competition,opponent,teamGoals,opponentGoals,venueSide,result,status:'STATUS_FULL_TIME',sourceUrl,sourceVerification:'SOURCE_REVIEW_CANDIDATE_PENDING_OWNER_QA',opponentCrestUrl:null};
}
const audits=[];
for(const replacement of replacements){
 const m=copied.matches[replacement.row-1];
 assert.equal(m.fixtureId,replacement.fixtureId);
 const k=replacement.side+'LastFive',former=m[k];
 assert.equal(former.length,5);
 assert.equal(former.filter(x=>isNonCompetitiveFormMatch(x.competition)).length,replacement.old,'Source has changed; review manually');
 const candidate=replacement.new.map(toRecord);
 assert.ok(candidate.every(x=>!isNonCompetitiveFormMatch(x.competition)));
 assert.ok(candidate.every((x,i)=>i===0||candidate[i-1].date>=x.date),'Dates out of order');
 assert.equal(new Set(candidate.map(x=>x.date+'|'+x.opponent)).size,5);
 m[k]=candidate;
 audits.push({row:replacement.row,fixtureId:replacement.fixtureId,side:replacement.side,
   former:former.map(x=>({date:x.date,opponent:x.opponent,competition:x.competition,result:x.result,score:x.teamGoals+'-'+x.opponentGoals})),
   proposed:candidate.map(x=>({date:x.date,opponent:x.opponent,competition:x.competition,result:x.result,score:x.teamGoals+'-'+x.opponentGoals,sourceUrl:x.sourceUrl}))});
}
assert.equal(copied.matches.flatMap(m=>[...(m.homeLastFive||[]),...(m.awayLastFive||[])]).filter(x=>isNonCompetitiveFormMatch(x.competition)).length,0);
assert.deepEqual(copied.matches.map(x=>x.fixtureId),src.matches.map(x=>x.fixtureId));
assert.deepEqual(odds.matches.map(x=>x.fixtureId),src.matches.map(x=>x.fixtureId));
for(let i=0;i<36;i++){
 const x=structuredClone(src.matches[i]),y=structuredClone(copied.matches[i]);
 delete x.homeLastFive;delete x.awayLastFive;delete y.homeLastFive;delete y.awayLastFive;
 assert.deepEqual(y,x,'No other match fields may change');
}
const errors=validateEditorial({report:copied,odds},'2026-10-22');
const status={createdAt:new Date().toISOString(),kind:'REVIEW_CANDIDATE_NOT_PUBLISHED',
 fixtureCount:36,oddsCount:36,sourceFormsCorrected:replacements.length,removedFriendlyResults:6,
 reviewComplete:false,sourcePdfFullyReconciled:false,productionPublishAllowed:false,
 publicationAttempted:false,otherEditorialErrors:errors,changes:audits,
 IMPORTANT:'Candidate score/form research and original editorial commentary must be owner-reviewed before publication; output NOT automatically imported into Cloudflare.'};
mkdirSync(out,{recursive:true});
writeFileSync(out+'/today-reviewed-candidate.json',JSON.stringify(copied,null,2)+'\n');
writeFileSync(out+'/review-report.json',JSON.stringify(status,null,2)+'\n');
console.log(JSON.stringify({candidateCreated:true,fixtureCount:36,removedFriendlies:6,
 editorialErrors:errors.length,productionPublishAllowed:false,sourceUnchanged:true}));
