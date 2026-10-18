#!/usr/bin/env python3
"""Compile native journal with official Android SDK tools; no third-party libraries."""
from pathlib import Path
import os,subprocess,zipfile,shutil,json
ROOT=Path(__file__).resolve().parent
sdk=Path(os.environ['ANDROID_HOME']);tools=sdk/'build-tools/35.0.0';android=sdk/'platforms/android-35/android.jar'
out=ROOT/'build';out.mkdir(exist_ok=True)
work=out/'work';shutil.rmtree(work,ignore_errors=True)
for d in ['classes','generated','dex']:(work/d).mkdir(parents=True,exist_ok=True)
def run(*args):subprocess.run([str(x) for x in args],check=True)
def compile_apk(folder,manifest,source,output,classpath=None):
 folder.mkdir(parents=True,exist_ok=True)
 for d in ['classes','generated','dex']:(folder/d).mkdir(exist_ok=True)
 args=[tools/'aapt2','link','-I',android,'--manifest',manifest,'-o',folder/'base.apk','--java',folder/'generated']
 if source==ROOT/'src':
  run(tools/'aapt2','compile','--dir',ROOT/'res','-o',folder/'resources.zip');args.extend(['-A',ROOT/'assets',folder/'resources.zip'])
 run(*args)
 files=[*source.rglob('*.java'),*(folder/'generated').rglob('*.java')]
 cp=str(android)+(os.pathsep+str(classpath) if classpath else '')
 run('javac','-encoding','UTF-8','-source','8','-target','8','-classpath',cp,'-d',folder/'classes',*files)
 run(tools/'d8','--min-api','26','--lib',android,'--output',folder/'dex',*sorted((folder/'classes').rglob('*.class')))
 with zipfile.ZipFile(folder/'base.apk','a',compression=zipfile.ZIP_DEFLATED) as z:
  for f in (folder/'dex').glob('*.dex'):z.write(f,f.name)
 run(tools/'zipalign','-f','-p','4',folder/'base.apk',output)
compile_apk(work,ROOT/'AndroidManifest.xml',ROOT/'src',out/'Future-Code-Sports-Journal-unsigned.apk')
compile_apk(out/'test-work',ROOT/'tests/AndroidManifest.xml',ROOT/'tests/src',out/'journal-tests-unsigned.apk',work/'classes')
with zipfile.ZipFile(out/'android-signing-tools.zip','w',compression=zipfile.ZIP_DEFLATED) as z:z.write(tools/'lib/apksigner.jar','apksigner.jar')
print('Unsigned APK and instrumentation test APK compiled.')
