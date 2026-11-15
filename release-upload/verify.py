import base64,hashlib,json,pathlib
root=pathlib.Path('release-upload');out=pathlib.Path('output');out.mkdir(exist_ok=True)
for item in json.loads((root/'inventory.json').read_text()):
 name=item['file']; parts=sorted(root.glob(name+'.b64.*'));assert parts,name
 data=base64.b64decode(''.join(p.read_text() for p in parts),validate=True)
 assert hashlib.sha256(data).hexdigest()==item['sha256'],name
 (out/name).write_bytes(data)
with (out/'SHA256SUMS.txt').open('w') as f:
 for p in sorted(out.glob('*.apk')):f.write(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n')
print('PASS: five signed APK hashes restored')
