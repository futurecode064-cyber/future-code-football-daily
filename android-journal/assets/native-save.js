(function(){
 if(window.__FCJournalSaveInstalled)return;window.__FCJournalSaveInstalled=true;
 const objects=new Map(),create=URL.createObjectURL.bind(URL),revoke=URL.revokeObjectURL.bind(URL);
 URL.createObjectURL=function(blob){const u=create(blob);if(blob instanceof Blob)objects.set(u,blob);return u};
 URL.revokeObjectURL=function(u){setTimeout(()=>objects.delete(u),60000);return revoke(u)};
 async function save(url,name){try{
  let blob=objects.get(url);if(!blob){const r=await fetch(url);if(!r.ok)throw Error();blob=await r.blob()}
  if(!/^image\/(png|jpeg|webp|gif)$/.test(blob.type)||blob.size>24000000)throw Error();
  const reader=new FileReader();reader.onload=()=>window.FCJournalNative.save(String(reader.result),name||'Future-Code-Sports-Journal.png');reader.onerror=()=>window.FCJournalNative.error();reader.readAsDataURL(blob);
 }catch(e){window.FCJournalNative.error()}}
 window.FCJournalSave=save;
 function take(a){if(!a||!a.hasAttribute('download'))return false;const u=a.href||'';
  if(/^(blob:|data:image\/)/i.test(u)||(/^https:\/\/future-code-football-daily\.pages\.dev\//.test(u)&&/\.(png|jpe?g|webp|gif)(\?|#|$)/i.test(u))){save(u,a.getAttribute('download'));return true}return false}
 const click=HTMLAnchorElement.prototype.click;HTMLAnchorElement.prototype.click=function(){if(take(this))return;return click.apply(this,arguments)};
 document.addEventListener('click',e=>{const a=e.target&&e.target.closest&&e.target.closest('a[download]');if(take(a)){e.preventDefault();e.stopImmediatePropagation()}},true);
 const open=window.open;window.open=function(u){if(typeof u==='string'&&/^(blob:|data:image\/)/i.test(u)){save(u,'Future-Code-Sports-Journal.png');return null}return open.apply(this,arguments)};
})();
