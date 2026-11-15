import json,pathlib,subprocess,time,os
items=json.loads(pathlib.Path('release-upload/inventory.json').read_text());out=pathlib.Path('qa-output');out.mkdir(exist_ok=True)
def run(args):return subprocess.check_output(args,text=True,stderr=subprocess.STDOUT)
results=[]
try:
 for m in items:
  brand=m['brand'];pkg=m['package'];old=list(pathlib.Path('previous').glob('FC-'+brand+'-*.apk'));assert len(old)==1
  oldsig=run([os.environ['ANDROID_HOME']+'/build-tools/35.0.0/apksigner','verify','--print-certs',str(old[0])])
  newsig=run([os.environ['ANDROID_HOME']+'/build-tools/35.0.0/apksigner','verify','--print-certs','output/'+m['file']])
  assert m['certificateSha256'] in oldsig and m['certificateSha256'] in newsig
  assert 'Success' in run(['adb','install',str(old[0])])
  assert 'Success' in run(['adb','install','-r','output/'+m['file']])
  dump=run(['adb','shell','dumpsys','package',pkg]);assert 'versionCode='+str(m['versionCode']) in dump and 'versionName='+m['versionName'] in dump
  run(['adb','shell','monkey','-p',pkg,'-c','android.intent.category.LAUNCHER','1']);time.sleep(4)
  assert run(['adb','shell','pidof',pkg]).strip()
  with (out/(brand+'.png')).open('wb') as f:subprocess.run(['adb','exec-out','screencap','-p'],stdout=f,check=True)
  results.append({'brand':brand,'sameCertificate':True,'updateWithoutUninstall':True,'versionCorrect':True,'launch':True});print('PASS',brand,flush=True)
finally:
 (out/'results.json').write_text(json.dumps(results,indent=2))
 (out/'logcat.txt').write_text(run(['adb','logcat','-d','-t','1000']))
assert len(results)==5
