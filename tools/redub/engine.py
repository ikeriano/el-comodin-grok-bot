# Motor común del redoblaje: Piper (voz NUEVA) -> tono -> efectos -> ajuste a la duración del clip original -> MP3.
import json, os, re, subprocess, wave, sys, multiprocessing as mp
P = '/workspace/piper'
_vz = {}
def _voice(m):
    if m not in _vz:
        import onnxruntime, piper.voice as pv
        if not getattr(pv, '_rdb1', False):
            _SO = onnxruntime.SessionOptions
            def so():
                o = _SO(); o.intra_op_num_threads = 1; o.inter_op_num_threads = 1; return o
            pv.onnxruntime = type('M', (), {'SessionOptions': staticmethod(so), 'InferenceSession': onnxruntime.InferenceSession})
            pv._rdb1 = True
        from piper import PiperVoice
        _vz[m] = PiperVoice.load(f'{P}/{m}.onnx')
    return _vz[m]
def probe(f):
    o = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration:stream=bit_rate,sample_rate', '-of', 'json', f], capture_output=True, text=True).stdout
    j = json.loads(o); s = (j.get('streams') or [{}])[0]
    return float(j['format']['duration']), int(s.get('bit_rate') or 64000), int(s.get('sample_rate') or 22050)
def _synth(m, spk, txt, ls, ns, nw, dst):
    from piper import SynthesisConfig
    with wave.open(dst, 'wb') as w:
        _voice(m).synthesize_wav(txt, w, syn_config=SynthesisConfig(speaker_id=spk, length_scale=ls, noise_scale=ns, noise_w_scale=nw))
    with wave.open(dst) as w: return w.getnframes() / w.getframerate()
def _tempo(r):  # cadena de atempo (cada uno entre 0.5 y 2)
    out = []
    while r > 2.0: out.append('atempo=2.0'); r /= 2.0
    while r < 0.5: out.append('atempo=0.5'); r /= 0.5
    out.append(f'atempo={r:.5f}'); return out
def _trimsil(wav, tmp):  # quita silencios del principio y del final de la síntesis (para medir solo la voz)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', wav, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,areverse,silenceremove=start_periods=1:start_threshold=-50dB,areverse', tmp], check=True)
    with wave.open(tmp) as w: return w.getnframes() / w.getframerate()
STY = {'hype': (0.70, 2.0, 0.9), 'normal': (0.85, 0.0, 0.75), 'solemne': (1.25, -3.0, 0.5), 'risa': (0.75, 3.0, 0.95), 'susurro': (1.4, -1.0, 0.3)}
def render(job):
    """job: dst, text, v{model,spk,ls,ns,nw,semi,fx[,styles]}, target (s) o src (clip original), br, sr, lead (s de silencio inicial del original)"""
    try:
        if os.path.exists(job['dst']) and not job.get('force'):
            T0 = probe(job['src'])[0] if job.get('src') and os.path.exists(job['src']) else None
            return job['dst'], None, None, round(probe(job['dst'])[0], 2), round(T0, 2) if T0 else None
        v = job['v']; tag = f"/tmp/rdb_{os.getpid()}"; os.makedirs(os.path.dirname(job['dst']), exist_ok=True)
        if job.get('src') and os.path.exists(job['src']): T, br, _ = probe(job['src'])
        else: T, br = job.get('target'), job.get('br', 64000)
        br = min(br, job.get('maxbr', 64000)); br = max(24000, br)
        txt = job.get('say', job['text'])
        if v.get('styles') or '[' in txt:  # Buzz: trozos con estilo
            parts = []; est = 'normal'; i = 0
            for mt in re.finditer(r'\[(hype|normal|solemne|pausa|risa|susurro)\]|([^\[]+)', txt):
                if mt.group(1) == 'pausa': parts.append(('pausa', None)); continue
                if mt.group(1): est = mt.group(1); continue
                if mt.group(2).strip(): parts.append((est, mt.group(2).strip()))
            files = []
            for est, t in parts:
                f = f'{tag}_p{i}.wav'; i += 1
                if est == 'pausa':
                    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'anullsrc=r=22050:cl=mono', '-t', '0.8', f], check=True)
                else:
                    ls, ds, ns = STY[est]; raw = f + '.raw.wav'; _synth(v['model'], v['spk'], t, ls, ns, 0.9, raw)
                    fr = 2 ** ((v['semi'] + ds) / 12)
                    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', raw, '-af', f'aresample=22050,asetrate={22050*fr:.1f},aresample=22050,atempo={1/fr:.5f},apad=pad_dur=0.1', '-ac', '1', '-ar', '22050', f], check=True); os.remove(raw)
                files.append(f)
            lst = f'{tag}.txt'; open(lst, 'w').write(''.join(f"file '{x}'\n" for x in files))
            raw = f'{tag}_raw.wav'; subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lst, '-ar', '22050', '-ac', '1', raw], check=True)
            for x in files: os.remove(x)
            semi = 0
        else:
            raw = f'{tag}_raw.wav'; ls = v['ls']
            _synth(v['model'], v['spk'], txt, ls, v['ns'], v['nw'], raw); semi = v['semi']
        d = _trimsil(raw, f'{tag}_t.wav'); src = f'{tag}_t.wav'
        if d < 0.05: d = _trimsil(raw, f'{tag}_t.wav') or 0.1; src = raw
        # hueco para la voz: duración del original menos un poco de margen al principio y al final
        lead = min(0.08, T * 0.05); room = max(0.15, T - lead - 0.06)
        r = d / room
        if not (v.get('styles') or '[' in txt) and (r > 1.18 or r < 0.82):  # mejor rehacer con la velocidad de Piper que estirar mucho
            ls2 = max(0.55, min(1.7, v['ls'] / r)); _synth(v['model'], v['spk'], txt, ls2, v['ns'], v['nw'], raw)
            d = _trimsil(raw, f'{tag}_t.wav'); r = d / room
        rr = max(0.75, min(job.get('maxtempo', 1.5), r)); T2 = max(T, d / rr + lead + 0.06) if rr != r and r > rr else T
        r = rr; fr = 2 ** (semi / 12)
        af = ['aresample=22050', f'asetrate={22050*fr:.1f}', 'aresample=22050'] if semi else ['aresample=22050']
        af += _tempo(r / fr if semi else r)
        if v.get('fx'): af.append(v['fx'])
        af += ['loudnorm=I=-16:TP=-1.5:LRA=11', 'aresample=22050', f'adelay={int(lead*1000)}', 'apad', f'atrim=duration={T2:.3f}', 'afade=t=out:st=%.3f:d=0.03' % max(0, T2 - 0.03)]
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', ','.join(af), '-ac', '1', '-ar', '22050', '-b:a', str(br), job['dst']], check=True)
        for x in (raw, f'{tag}_t.wav'): os.path.exists(x) and os.remove(x)
        return job['dst'], round(r, 3), None, round(T2, 2), round(T, 2)
    except Exception as e:
        return job.get('dst'), None, repr(e)
def run(jobs, n=7, log=None):
    res = []
    with mp.Pool(n) as pool:
        for i, x in enumerate(pool.imap_unordered(render, jobs, chunksize=4)):
            res.append(x)
            if log and i % 100 == 0: print(f'{i}/{len(jobs)}', x, file=log, flush=True)
    return res
