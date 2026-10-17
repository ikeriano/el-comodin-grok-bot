# Voces NUEVAS por personaje (aprobadas en /workspace/redub_samples/mapping.json) + voces derivadas del mismo estilo.
import json
M = {x['file'][:-4]: x for x in json.load(open('/workspace/redub_samples/mapping.json'))}
def V(model, spk, ls, ns, nw, semi, fx=''):
    return {'model': model, 'spk': spk, 'ls': ls, 'ns': ns, 'nw': nw, 'semi': semi, 'fx': fx}
def fromsample(k):
    x = M[k]
    if 'styles' in x: return {'model': x['model'][:-5], 'spk': x['speaker_id'], 'ls': 0.85, 'ns': 0.75, 'nw': 0.9, 'semi': x['pitch_semitones'], 'fx': x['ffmpeg_filter'], 'styles': True}
    return V(x['model'][:-5], x['speaker_id'], x['length_scale'], x['noise_scale'], x['noise_w'], x['pitch_semitones'], x['ffmpeg_filter'])
EQ = lambda f, g: f'equalizer=f={f}:t=q:w=1:g={g}'
D, S, A, C, N = 'es_ES-davefx-medium', 'es_ES-sharvard-medium', 'es_MX-ald-medium', 'es_MX-claude-high', 'es_AR-daniela-high'
AC = {
 'adrian': fromsample('adrian_vega'), 'marga': fromsample('marga'), 'bruno': fromsample('bruno'), 'rita': fromsample('rita'),
 'quique': fromsample('quique'), 'tano': fromsample('tano'), 'central': fromsample('concursante_central'), 'buzz': fromsample('buzz'),
 'arturo': fromsample('don_arturo'), 'off': fromsample('voz_en_off'),
 # 10 oponentes (c1..c10 = op1..op10 = a1..a10): Paco y Lola son las muestras aprobadas, el resto en el mismo estilo
 'o1': fromsample('oponente_hombre'),                       # Paco
 'o2': fromsample('oponente_mujer'),                        # Lola
 'o3': V(A, None, 1.05, 0.6, 0.7, -1.0, EQ(300, 3)),        # Ramón
 'o4': V(S, 1, 0.95, 0.667, 0.8, 0.5, EQ(1300, 5)),         # Conchi
 'o5': V(S, 0, 0.95, 0.7, 0.8, 1.0, EQ(2800, 3)),           # Tomás
 'o6': V(S, 1, 0.88, 0.7, 0.8, 2.5, EQ(3000, 2)),           # Marisa
 'o7': V(A, None, 0.88, 0.75, 0.85, 2.0, EQ(3000, 2)),      # Javi
 'o8': V(N, None, 1.0, 0.6, 0.7, 0.0, EQ(250, 2) + ',lowpass=f=5000'),  # Rocío
 'o9': V(D, None, 1.05, 0.6, 0.7, -2.0, EQ(180, 4)),        # Manolo
 'o10': V(C, None, 0.92, 0.7, 0.8, 3.5, EQ(4000, 2)),       # Pili
 # equipo del plató / copresentadores (voz antigua -> personaje)
 'toni': V(A, None, 0.92, 0.65, 0.8, -1.5, EQ(1500, 3)),    # carlfm: Toni regidor
 'rober': V(S, 0, 1.0, 0.6, 0.7, 1.0, EQ(900, 4)),          # mls_10246: Rober sonido
 'luis': V(D, None, 0.95, 0.6, 0.75, -1.0, EQ(200, 3)),     # ald: Luis catering
 'manolo_pub': V(A, None, 0.9, 0.75, 0.85, 2.5, EQ(2500, 3)),  # claude: Manolo público
 'jefe': V(A, None, 1.1, 0.5, 0.6, -4.5, EQ(120, 5)),       # sharvard_m: «El jefe»
 'anuncios': V(D, None, 0.9, 0.6, 0.7, 0.5, 'acompressor=threshold=-18dB:ratio=3,' + EQ(3000, 3)),  # sharvard: locutor de anuncios
 'fiesta_dave': V(S, 0, 1.0, 0.6, 0.7, -2.0, EQ(200, 3)),   # davefx (st): locutor del Modo Fiesta
 'lola_dir': V(S, 1, 0.92, 0.65, 0.8, 1.5, EQ(2000, 2)),    # daniela: Lola directora
 'nuria': V(C, None, 0.92, 0.7, 0.8, 3.0, EQ(3500, 2)),     # sharvard_f: Nuria maquillaje
 'carmen': V(S, 1, 1.0, 0.6, 0.7, -2.5, EQ(250, 3)),        # mls_9972: Carmen público
}
KS = {k: fromsample('ks_' + s) for k, s in [('narr', 'narrador'), ('kemal', 'kemal'), ('nihan', 'nihan'), ('ozan', 'ozan'), ('onder', 'onder'), ('zeynep', 'zeynep'), ('asu', 'asu'), ('leyla', 'leyla'), ('vildan', 'vildan'), ('tarik', 'tarik')]}
KS.update({
 'selin': V(N, None, 0.98, 0.6, 0.7, 1.0, EQ(2500, 2)),      # antes sharvard F +0.8 st
 'burak': V(A, None, 0.95, 0.65, 0.8, 1.0, EQ(2500, 2)),     # antes davefx -0.9 st
 'defne': V(S, 1, 1.0, 0.667, 0.8, 1.5, EQ(3000, 2)),        # antes sharvard F -0.7 st
 'director': V(D, None, 0.97, 0.6, 0.75, 1.0, EQ(1500, 3)),  # antes sharvard M -0.9 st
 'galip': V(A, None, 1.12, 0.5, 0.6, -4.0, EQ(120, 5)),      # antes sharvard M -2.6 st
 'banu': V(C, None, 0.95, 0.6, 0.75, 1.0, ''), 'fehime': V(N, None, 1.1, 0.5, 0.6, -3.0, EQ(200, 3)), 'huseyin': V(D, None, 1.1, 0.5, 0.6, -2.0, EQ(150, 4)),
})
# Presentadores de las otras apps (antes todos con es_ES-davefx-medium): cada uno con su propia voz nueva
HOSTS = {
 'tenable': V(S, 0, 0.92, 0.6, 0.75, 0.5, EQ(2000, 2)),
 'comodin': V(S, 0, 0.95, 0.667, 0.8, 2.5, EQ(3000, 3)),
 'circulo': V(A, None, 0.92, 0.7, 0.85, 1.5, EQ(3000, 3) + ',aecho=0.8:0.5:35|70:0.15|0.08'),
 'el1': V(S, 0, 1.0, 0.6, 0.75, -1.5, EQ(200, 3)),
}
