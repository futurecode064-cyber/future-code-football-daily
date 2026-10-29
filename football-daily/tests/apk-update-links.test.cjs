'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const entries=[
 ['future-code-journal','1.0.2','https://github.com/futurecode064-cyber/future-code-football-daily/releases/download/fc-goal-zone-v1.0.2-fcm-preview/FC-Goal-Zone-v1.0.2-FCM-FRESH-INSTALL.apk'],
 ['ykz-family','1.2.0','https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/download/fc-ykz-v1.2.0-preview/YKZ-Soccer-Tips.apk'],
 ['bw-sport','1.0.1','https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/download/fc-bw-v1.0.1-preview/BW-Sport-Journal.apk'],
 ['ko-thet-family','1.0.2','https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/download/fc-ko-thet-v1.0.2-preview/Ko-Thet-Family-Journal.apk'],
 ['kmm-sport-hub','1.0.1','https://github.com/futurecode064-cyber/AI-Recap-GitHub/releases/download/fc-kmm-v1.0.1-preview/KMM-Sport-Hub.apk'],
 ['bet-city-family','1.0.1','https://github.com/futurecode064-cyber/future-code-football-daily/releases/download/fc-bcf-v1.0.1-fcm-preview/FC-BCF-v1.0.1-FCM-FRESH-INSTALL.apk']
];
const note='Note: Update APK install ပါက version အဟောင်းကို အရင် Uninstall လုပ်ဖို့ လိုပါတယ်။';
for(const [brand,version,url] of entries){
 test(brand+' new APK is direct-linked from relevant website section and download page',()=>{
  const main=fs.readFileSync(path.join(root,brand,'index.html'),'utf8');
  const download=fs.readFileSync(path.join(root,brand,'android','index.html'),'utf8');
  const extract=(text)=>[...text.matchAll(/<a\b[^>]*data-fc-apk-download[^>]*>/g)].map(([a])=>a);
  assert.match(main,/<section class="fc-apk-update-box"/);
  assert.match(main,/Update Version APK ယူရန်/);
  assert.equal(extract(main).length,1,'Exactly one update link in section');
  assert.equal(extract(download).length,1,'Exactly one download link on Android page');
  assert.ok(extract(main)[0].includes('href="'+url+'"'),'main link must match brand release');
  assert.ok(extract(download)[0].includes('href="'+url+'"'),'download link must match brand release');
  assert.ok(main.includes(note),'main note is owner requested exact note');
  assert.ok(download.includes(note),'download page note is owner requested exact note');
  assert.match(main,new RegExp('v'+version.replaceAll('.','\\.')));
  assert.match(download,new RegExp('v'+version.replaceAll('.','\\.')));
  assert.ok(!/App Data ပျောက်|Data ပျောက်|data loss/i.test(main+download),'No unwanted data warning');
  assert.ok(fs.existsSync(path.join(root,'apk-update-section.css')),'isolated styling');
 });
}
