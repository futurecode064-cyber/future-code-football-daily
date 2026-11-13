import {readFileSync, writeFileSync} from 'node:fs';

// Applied to the pinned FC Agent Ledger source.zip by the isolated release workflow.
// No other sites or source files are touched.
const root = 'fc-agent-ledger/staging/FC-Agent-Ledger-Cloudflare-Free/';
function replaceExact(relative, oldValue, newValue) {
  const path = root + relative;
  const current = readFileSync(path, 'utf8');
  if (!current.includes(oldValue)) {
    throw new Error('Password policy source marker is missing: ' + relative);
  }
  writeFileSync(path, current.replace(oldValue, newValue));
}
replaceExact(
  'src/worker.mjs',
  "password.length<12||password.length>160)fail(400,'Password အနည်းဆုံး ၁၂ လုံးဖြည့်ပါ')",
  "password.length===0||new TextEncoder().encode(password).byteLength>4096)fail(400,'Password အလွတ်မထားပါနဲ့ (အများဆုံး 4096 bytes)')"
);
const ui = root + 'public/app.js';
let app = readFileSync(ui, 'utf8');
const original = app.match(/minlength="12"/g) || [];
if (original.length !== 5) throw new Error('Expected five password minLength controls; saw ' + original.length);
app = app.replaceAll('minlength="12"', '');
if (!app.includes('Temporary Password (12+ characters)') || !app.includes('အနည်းဆုံး 12 characters လိုပါတယ်။')) {
  throw new Error('Password form messages changed; review before modifying');
}
app = app.replace('Temporary Password (12+ characters)', 'Temporary Password');
app = app.replace('အနည်းဆုံး 12 characters လိုပါတယ်။', 'Password ကို လိုသလိုသတ်မှတ်နိုင်ပါတယ်။ လုံခြုံရေးအတွက် ရှည်ရှည်ထားရန် အကြံပြုပါတယ်။');
writeFileSync(ui, app);
console.log('FC Agent Ledger password policy: no 12-character minimum on API or account forms.');
