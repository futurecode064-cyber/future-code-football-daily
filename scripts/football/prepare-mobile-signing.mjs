#!/usr/bin/env node
// Persistent, repo-encrypted APK signing identity for future fresh-install releases.
// Uses the owner's EXISTING protected FOOTBALL_BACKUP_RECOVERY_KEY, domain separated via HKDF.
// Never emit the raw keystore, passwords or master secret to logs/source/artifacts.
import {readFileSync,writeFileSync,existsSync,mkdirSync,chmodSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {hkdfSync,randomBytes,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
import {dirname,resolve} from 'node:path';

const master=process.env.FOOTBALL_BACKUP_RECOVERY_KEY||'';
if(master.length<32)throw Error('BLOCKED: protected durable signing recovery secret unavailable');
const relative='config/football/mobile-release-signing-v1.enc.json';
const recoveryFile=resolve(relative);
const plainFile=resolve(process.env.RUNNER_TEMP||'/tmp','future-code-football-2026-release.p12');
const kdf=(label,len)=>Buffer.from(hkdfSync('sha256',Buffer.from(master),Buffer.from('future-code-football/mobile-release/v1'),Buffer.from(label),len));
const encryptionKey=kdf('aes-256-gcm-encrypted-signing-backup',32);
const keyPassword=kdf('pkcs12-signing-password',24).toString('hex');
const alias='fc-football-release';
process.stdout.write('::add-mask::'+keyPassword+'\n');
mkdirSync(dirname(recoveryFile),{recursive:true});
let created=false;
if(existsSync(recoveryFile)){
  const saved=JSON.parse(readFileSync(recoveryFile,'utf8'));
  if(saved.format!=='fc-mobile-p12-aes256gcm-hkdf-v1')throw Error('BLOCKED: unknown signing backup format');
  const decipher=createDecipheriv('aes-256-gcm',encryptionKey,Buffer.from(saved.iv,'base64'));
  decipher.setAuthTag(Buffer.from(saved.tag,'base64'));
  const key=Buffer.concat([decipher.update(Buffer.from(saved.ciphertext,'base64')),decipher.final()]);
  if(createHash('sha256').update(key).digest('hex')!==saved.sha256)throw Error('BLOCKED: signing keystore backup checksum mismatch');
  writeFileSync(plainFile,key,{mode:0o600});
  console.log('Existing encrypted signing key recovered (identity preserved)');
}else{
  const env={...process.env,FC_KEYPASS:keyPassword};
  execFileSync('keytool',['-genkeypair','-keyalg','RSA','-keysize','3072','-validity','10000',
    '-storetype','PKCS12','-keystore',plainFile,'-alias',alias,'-dname','CN=Future Code Football APK, O=Future Code AI Studio, C=MM',
    '-storepass:env','FC_KEYPASS','-keypass:env','FC_KEYPASS','-noprompt'],{env,stdio:['ignore','pipe','pipe']});
  chmodSync(plainFile,0o600);
  const key=readFileSync(plainFile),iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',encryptionKey,iv);
  const ciphertext=Buffer.concat([cipher.update(key),cipher.final()]);
  writeFileSync(recoveryFile,JSON.stringify({format:'fc-mobile-p12-aes256gcm-hkdf-v1',
    sha256:createHash('sha256').update(key).digest('hex'),iv:iv.toString('base64'),
    tag:cipher.getAuthTag().toString('base64'),ciphertext:ciphertext.toString('base64')})+'\n',{mode:0o600});
  created=true;
  console.log('Created new persistent signing key; public repo receives ENCRYPTED backup only');
}
execFileSync('keytool',['-list','-storetype','PKCS12','-keystore',plainFile,'-storepass:env','FC_KEYPASS','-alias',alias],
 {env:{...process.env,FC_KEYPASS:keyPassword},stdio:['ignore','pipe','pipe']});
const contents=readFileSync(plainFile).toString('base64');
if(!process.env.GITHUB_ENV)throw Error('GitHub environment output path unavailable');
writeFileSync(process.env.GITHUB_ENV,
  'FC_APK_RELEASE_KEYSTORE_B64='+contents+'\n'+
  'FC_APK_RELEASE_STOREPASS='+keyPassword+'\n'+
  'FC_APK_RELEASE_KEYPASS='+keyPassword+'\n'+
  'FC_APK_RELEASE_ALIAS='+alias+'\n',
  {flag:'a'});
console.log('Signing keystore validated; Android build env is prepared. Encrypted backup created='+created);
