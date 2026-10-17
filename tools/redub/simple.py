# Apps sencillas: tools/voz.json (clave -> texto) + carpeta voz/<clave>.mp3 del presentador.
import json, sys, os, shutil
sys.path.insert(0, '/workspace/redub'); import engine; from voices import HOSTS
app, vozjson, vozdir, host = sys.argv[1:5]
L = json.load(open(vozjson)); out = f'/workspace/redub/{app}/out'; bk = f'/workspace/redub/{app}/orig_backup'
os.makedirs(out, exist_ok=True); os.makedirs(bk, exist_ok=True)
jobs = []
for k, t in L.items():
    src = os.path.join(vozdir, k + '.mp3')
    if not os.path.exists(src): continue
    if not os.path.exists(os.path.join(bk, k + '.mp3')): shutil.copy2(src, bk)
    jobs.append({'dst': f'{out}/{k}.mp3', 'src': os.path.join(bk, k + '.mp3'), 'text': t, 'say': t, 'who': host, 'v': HOSTS[host], 'maxbr': 64000})
res = engine.run(jobs, 7); err = [x for x in res if x[2]]
print(app, len(jobs), 'errores', err)
json.dump({'jobs': jobs, 'res': res}, open(f'/workspace/redub/{app}/res.json', 'w'), ensure_ascii=False)
