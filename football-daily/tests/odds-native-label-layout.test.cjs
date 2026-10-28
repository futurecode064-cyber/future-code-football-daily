'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../main-odds-dom-frame.js'),'utf8');
test('native league repaint replaces the existing html2canvas transform and paints each label once',()=>{
 const calls=[];
 const ctx={save(){},restore(){},setTransform(...x){calls.push(['transform',...x]);},beginPath(){},rect(){},clip(){},measureText(s){return{width:s.length*8}},fillText(...x){calls.push(['text',...x]);}};
 const labels=['အင်္ဂလန် ကာရာဘောင်း ဖလား','စပိန် ဘုရင့်ဖလား'].map((text,i)=>({textContent:text,getBoundingClientRect:()=>({left:80,top:50+i*300,width:1100,height:54})}));
 const window={};
 vm.runInNewContext(source.replace('window.FutureCodeOddsDomFrame={draw};','window.FutureCodeOddsDomFrame={draw,repaintLeagueLabels};'),{window,location:{pathname:'/bet-city-family/odds'},getComputedStyle:()=>({paddingLeft:'0',paddingRight:'0',color:'#fff',fontSize:'26px',fontWeight:'700'})});
 window.FutureCodeOddsDomFrame.repaintLeagueLabels({width:2560,getContext:()=>ctx},{getBoundingClientRect:()=>({left:0,top:0,width:1280}),querySelectorAll:()=>labels});
 assert.deepEqual(calls.filter(c=>c[0]==='transform'),[['transform',2,0,0,2,0,0],['transform',2,0,0,2,0,0]]);
 assert.deepEqual(calls.filter(c=>c[0]==='text').map(c=>c.slice(1,4)),labels.map((l,i)=>[l.textContent,82,77+i*300]));
 assert.match(source,/onclone:doc=>/);
 assert.match(source,/setProperty\("visibility","hidden","important"\)/);
});
