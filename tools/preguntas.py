import json
def rd(f,n): return [l.rstrip('\n').split('|') for l in open('tools/'+f,encoding='utf8') if l.strip()][:]
P4={'a':rd('p4_a.txt',5),'b':rd('p4_b.txt',5),'c':rd('p4_c.txt',5)}
P2=rd('p2.txt',3)
open('www/js/preguntas.js','w',encoding='utf8').write('export const P4='+json.dumps(P4,ensure_ascii=False)+';\nexport const P2='+json.dumps(P2,ensure_ascii=False)+';\n')
print({k:len(v) for k,v in P4.items()},len(P2))
