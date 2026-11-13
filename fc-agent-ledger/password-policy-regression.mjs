
test('password length is user-selected (owner, admin, agent, change password)', async () => {
 const env=createEnv();
 let x=await send(env,'/api/bootstrap','POST',{setupToken:env.SETUP_TOKEN,email:'short-owner@ledger.test',displayName:'Owner',password:'x'});
 assert.equal(x.status,201,JSON.stringify(x.body));
 const owner=(await send(env,'/api/login','POST',{email:'short-owner@ledger.test',password:'x'})).cookie;
 assert.ok(owner,'short owner password must login');
 x=await send(env,'/api/tenants','POST',{name:'Short Test',email:'short-admin@ledger.test',displayName:'Admin',password:'123',planDays:30,planName:'TEST'},owner);
 assert.equal(x.status,201,JSON.stringify(x.body));
 const admin=(await send(env,'/api/login','POST',{email:'short-admin@ledger.test',password:'123'})).cookie;
 assert.ok(admin,'short admin password must login');
 x=await send(env,'/api/agents','POST',{displayName:'Agent',email:'short-agent@ledger.test',password:'မြန်မာ'},admin);
 assert.equal(x.status,201,JSON.stringify(x.body));
 const agent=(await send(env,'/api/login','POST',{email:'short-agent@ledger.test',password:'မြန်မာ'})).cookie;
 assert.ok(agent,'short Unicode agent password must login');
 x=await send(env,'/api/change-password','POST',{currentPassword:'မြန်မာ',newPassword:'z'},agent);
 assert.equal(x.status,200,JSON.stringify(x.body));
 x=await send(env,'/api/login','POST',{email:'short-agent@ledger.test',password:'z'});
 assert.equal(x.status,200,JSON.stringify(x.body));
 x=await send(env,'/api/change-password','POST',{currentPassword:'z',newPassword:''},x.cookie);
 assert.equal(x.status,400,'empty passwords must still be rejected');
});
