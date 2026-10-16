# Voz del presentador: Piper es_ES-davefx-medium (sin voces reales)
import subprocess,os,json
L={
'hola':'¡Muy buenas noches y bienvenidos a El Comodín de La Uno!',
'reglas':'Diez preguntas, siete comodines y una escalera de premios. Cada acierto te sube un escalón. Cada fallo te quita tres comodines.',
'presenta1':'Vamos a conocer a nuestro primer concursante.',
'presenta2':'Y ahora, nuestro segundo concursante.',
'empezamos':'¡Que empiece el juego!',
'pregunta':'Atención a la pregunta.',
'acierto':'¡Respuesta correcta! Subes un escalón.',
'acierto_top':'¡Correcta! Ya estás en lo más alto.',
'fallo':'Lo siento, no es correcta. Pierdes tres comodines.',
'fallo_esc':'No es correcta, y ya no quedan comodines. Bajas tres escalones.',
'tiempo':'¡Se acabó el tiempo!',
'pulsador':'Usas un comodín. Eliminamos una respuesta incorrecta y tienes quince segundos más.',
'super':'¡Super comodín! Tu acompañante te ayuda con esta pregunta.',
'bonus':'Llega el comodín bonus. Tu acompañante tiene noventa segundos. Cada cinco aciertos, un comodín más.',
'bonus_fin':'¡Se acabó el tiempo del comodín bonus!',
'plantarse':'Llegamos a la última pregunta. ¿Te plantas con el premio de un escalón menos, o te la juegas?',
'planta_si':'Te plantas. ¡Enhorabuena!',
'juega':'¡Valiente! Vamos con la décima pregunta.',
'ultima':'Última pregunta.',
'fin_bien':'¡Enhorabuena! Te llevas el premio.',
'fin_cero':'Esta vez no ha habido suerte. Te vas sin premio, pero con un gran aplauso.',
'resultados':'Vamos a ver cómo ha quedado el programa.',
'despedida':'Gracias por acompañarnos. ¡Hasta el próximo programa de El Comodín!',
'ganador':'¡Y el mejor premio de la noche es para...!',
}
for i,n in enumerate(['primera','segunda','tercera','cuarta','quinta','sexta','séptima','octava','novena','décima'],1):
  L['q%d'%i]=f'{n.capitalize()} pregunta.'
for v in [0,200,400,500,1000,2000,3000,6000,10000,20000,30000,60000]:
  L['e%d'%v]= 'Cero euros.' if v==0 else f'{v} euros.'
O='www/voz/';os.makedirs(O,exist_ok=True)
for k,t in L.items():
  subprocess.run(['/workspace/piperenv/bin/piper','-m','/workspace/piper/es_ES-davefx-medium.onnx','-f','/tmp/vc.wav','--length_scale','0.95'],input=t.encode(),check=True,capture_output=True)
  subprocess.run(['ffmpeg','-loglevel','error','-y','-i','/tmp/vc.wav','-af','loudnorm=I=-16','-ac','1','-ar','22050','-b:a','40k',O+k+'.mp3'],check=True)
json.dump(L,open('tools/voz.json','w'),ensure_ascii=False,indent=1)
print(len(L))
