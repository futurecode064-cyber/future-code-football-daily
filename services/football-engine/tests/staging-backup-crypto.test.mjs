import test from 'node:test';
import assert from 'node:assert/strict';
import {encryptBackup,decryptBackup} from '../../../scripts/football/backup-crypto.mjs';
const password='synthetic-independent-recovery-secret-000000000000000000';
const data=Buffer.from('CREATE TABLE example(id INTEGER PRIMARY KEY,name TEXT);'.repeat(10));
test('encrypted D1 backups restore exactly and never contain plaintext SQL',()=>{
 const encrypted=encryptBackup(data,password);
 assert.equal(encrypted.keySource,'workflow-secret');
 assert.deepEqual(decryptBackup(encrypted,password),data);
 assert.ok(!JSON.stringify(encrypted).includes('CREATE TABLE'));
});
test('wrong secret and tampering are rejected',()=>{
 const encrypted=encryptBackup(data,password);
 assert.throws(()=>decryptBackup(encrypted,'another-incorrect-recovery-key-00000000000'));
 const corrupt={...encrypted,ciphertext:'A'+encrypted.ciphertext.slice(1)};
 assert.throws(()=>decryptBackup(corrupt,password));
});
test('weak or malformed key/format is rejected',()=>{
 assert.throws(()=>encryptBackup(data,'short'));
 assert.throws(()=>decryptBackup({format:'plaintext'},password));
});
