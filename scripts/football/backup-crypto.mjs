// GitHub Actions artifact encryption, using HKDF domain separation and AES-256-GCM.
// Restore requires the same secret used at encryption. No plaintext ever enters public artifacts.
import {randomBytes,hkdfSync,createCipheriv,createDecipheriv,createHash,timingSafeEqual} from 'node:crypto';
import {gzipSync,gunzipSync} from 'node:zlib';
const fmt='future-code-encrypted-d1-sql-v1';
const context=Buffer.from('future-code-football/staging-d1-backup/2026-v1');
function derive(secret,salt){
 if(typeof secret!=='string'||secret.length<32)throw Error('A 32+ character recovery secret is required');
 return Buffer.from(hkdfSync('sha256',Buffer.from(secret,'utf8'),salt,context,32));
}
export function encryptBackup(sql,secret,metadata={}){
 const input=Buffer.isBuffer(sql)?sql:Buffer.from(sql);
 if(input.length<100)throw Error('Backup SQL unexpectedly small');
 const salt=randomBytes(32),nonce=randomBytes(12),key=derive(secret,salt),compressed=gzipSync(input);
 const cipher=createCipheriv('aes-256-gcm',key,nonce);
 cipher.setAAD(context);
 const bytes=Buffer.concat([cipher.update(compressed),cipher.final()]);
 return {format:fmt,algorithm:'AES-256-GCM+HKDF-SHA256+GZIP',
  createdAt:new Date().toISOString(),keySource:metadata.keySource||'workflow-secret',
  source:metadata.source||'staging',
  originalBytes:input.length,sqlSha256:createHash('sha256').update(input).digest('hex'),
  salt:salt.toString('base64'),nonce:nonce.toString('base64'),
  ciphertext:bytes.toString('base64'),tag:cipher.getAuthTag().toString('base64')};
}
export function decryptBackup(bundle,secret){
 if(!bundle||bundle.format!==fmt||bundle.algorithm!=='AES-256-GCM+HKDF-SHA256+GZIP')throw Error('Unsupported backup format');
 const key=derive(secret,Buffer.from(bundle.salt,'base64')),nonce=Buffer.from(bundle.nonce,'base64');
 if(nonce.length!==12)throw Error('Invalid nonce');
 const decipher=createDecipheriv('aes-256-gcm',key,nonce);decipher.setAAD(context);
 decipher.setAuthTag(Buffer.from(bundle.tag,'base64'));
 const gzip=Buffer.concat([decipher.update(Buffer.from(bundle.ciphertext,'base64')),decipher.final()]);
 const sql=gunzipSync(gzip,{maxOutputLength:100*1024*1024});
 const actual=createHash('sha256').update(sql).digest(),expected=Buffer.from(bundle.sqlSha256,'hex');
 if(expected.length!==32||!timingSafeEqual(actual,expected)||sql.length!==bundle.originalBytes)throw Error('Backup integrity check failed');
 return sql;
}
