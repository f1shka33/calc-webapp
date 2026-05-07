// track-ai.js — AI Track Evaluator + Auto-Mix engine
// Pure-browser, no backend. Uses Web Audio API + OfflineAudioContext.
//
// Public surface: window.TrackAI.mount(rootElement)
(function () {
  const TWO_PI = Math.PI * 2;

  // ────────────────────────────────────────────────────────────────────────
  // Utilities
  // ────────────────────────────────────────────────────────────────────────
  const dbfs = (x) => (x <= 1e-12 ? -120 : 20 * Math.log10(x));
  const lin  = (db) => Math.pow(10, db / 20);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  function mergeToMono(audioBuffer) {
    const ch = audioBuffer.numberOfChannels;
    const len = audioBuffer.length;
    const out = new Float32Array(len);
    if (ch === 1) {
      out.set(audioBuffer.getChannelData(0));
      return out;
    }
    const data = [];
    for (let c = 0; c < ch; c++) data.push(audioBuffer.getChannelData(c));
    for (let i = 0; i < len; i++) {
      let s = 0;
      for (let c = 0; c < ch; c++) s += data[c][i];
      out[i] = s / ch;
    }
    return out;
  }

  function getChannel(audioBuffer, c) {
    if (c < audioBuffer.numberOfChannels) return audioBuffer.getChannelData(c);
    return audioBuffer.getChannelData(0);
  }

  // ────────────────────────────────────────────────────────────────────────
  // Peak, RMS, clipping, crest factor
  // ────────────────────────────────────────────────────────────────────────
  function computePeakAndClipping(audioBuffer) {
    let peak = 0;
    let clipped = 0;
    let total = 0;
    for (let c = 0; c < audioBuffer.numberOfChannels; c++) {
      const data = audioBuffer.getChannelData(c);
      for (let i = 0; i < data.length; i++) {
        const a = Math.abs(data[i]);
        if (a > peak) peak = a;
        if (a >= 0.997) clipped++;
        total++;
      }
    }
    return { peakDbfs: dbfs(peak), clippingPct: (clipped / total) * 100 };
  }

  function computeRmsDbfs(mono) {
    let s = 0;
    for (let i = 0; i < mono.length; i++) s += mono[i] * mono[i];
    return dbfs(Math.sqrt(s / mono.length));
  }

  // Dynamic Range estimate (DR-style: top 20% RMS minus bottom 20% RMS, dB).
  // Computed on 1-second frames of mono signal.
  function computeDynamicRangeDb(mono, sr) {
    const win = sr; // 1 sec
    const n = Math.floor(mono.length / win);
    if (n < 4) return 0;
    const rmsArr = new Float32Array(n);
    for (let f = 0; f < n; f++) {
      let s = 0;
      const off = f * win;
      for (let i = 0; i < win; i++) { const v = mono[off + i]; s += v * v; }
      rmsArr[f] = Math.sqrt(s / win);
    }
    const sorted = Array.from(rmsArr).sort((a, b) => a - b);
    const lo = sorted[Math.floor(sorted.length * 0.20)];
    const hi = sorted[Math.floor(sorted.length * 0.80)];
    if (lo <= 0 || hi <= 0) return 0;
    return dbfs(hi) - dbfs(lo);
  }

  // ────────────────────────────────────────────────────────────────────────
  // K-weighted loudness (LUFS) — simplified BS.1770-style.
  // Two biquads (high-shelf + high-pass) approximating the K filter,
  // then mean-square integrated over the whole track. Channel weights
  // are 1.0/1.0 for stereo; the absolute value is calibrated against
  // a -20 dBFS sine to read ≈-23 LUFS.
  // ────────────────────────────────────────────────────────────────────────
  function biquadProcess(input, b0, b1, b2, a1, a2) {
    const out = new Float32Array(input.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < input.length; i++) {
      const x = input[i];
      const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      out[i] = y;
    }
    return out;
  }

  // Coefficients designed for 48k. We rescale by sample rate using
  // bilinear-transform-style remapping (a coarse but acceptable approx
  // for relative-loudness purposes).
  function kWeightFilter(samples, sr) {
    // Stage 1: pre-filter (high-shelf, +4 dB at ~1681 Hz)
    let stage1 = biquadProcess(samples,
      1.53512485958697, -2.69169618940638, 1.19839281085285,
     -1.69065929318241,  0.73248077421585);
    // Stage 2: RLB (high-pass at ~38 Hz)
    let stage2 = biquadProcess(stage1,
      1.0, -2.0, 1.0,
     -1.99004745483398, 0.99007225036621);
    // For sr != 48k the response shifts; at 44.1k the deviation is small (<0.5 dB).
    if (Math.abs(sr - 48000) > 6000) {
      // Coarse correction: a tiny first-order bilinear scale.
      const scale = 48000 / sr;
      // Apply a gentle one-pole compensation with the same -3 dB at 38*scale Hz.
      const fc = 38 * scale;
      const k = Math.tan(Math.PI * fc / sr);
      const norm = 1 / (1 + k);
      const b0 = 1 * norm, b1 = -1 * norm, a1 = (k - 1) * norm;
      const fixed = new Float32Array(stage2.length);
      let x1 = 0, y1 = 0;
      for (let i = 0; i < stage2.length; i++) {
        const x = stage2[i];
        const y = b0 * x + b1 * x1 - a1 * y1;
        x1 = x; y1 = y;
        fixed[i] = y;
      }
      stage2 = fixed;
    }
    return stage2;
  }

  function computeLufsIntegrated(audioBuffer) {
    const sr = audioBuffer.sampleRate;
    const block = Math.floor(sr * 0.4); // 400 ms
    const hop = Math.floor(block * 0.25); // 75% overlap → hop = 100 ms
    const ch = audioBuffer.numberOfChannels;
    const filtered = [];
    for (let c = 0; c < ch; c++) filtered.push(kWeightFilter(audioBuffer.getChannelData(c), sr));
    const len = filtered[0].length;
    const numBlocks = Math.max(0, Math.floor((len - block) / hop) + 1);
    if (numBlocks <= 0) return -70;

    const blockLoudness = new Float32Array(numBlocks);
    const blockMS = new Float32Array(numBlocks);
    for (let b = 0; b < numBlocks; b++) {
      const start = b * hop;
      let ms = 0;
      for (let c = 0; c < ch; c++) {
        const arr = filtered[c];
        let s = 0;
        for (let i = 0; i < block; i++) { const v = arr[start + i]; s += v * v; }
        ms += s / block; // weight 1.0 per channel for L/R; ignore surround
      }
      blockMS[b] = ms;
      blockLoudness[b] = ms > 0 ? -0.691 + 10 * Math.log10(ms) : -120;
    }

    // Absolute gating at -70 LUFS
    let sum = 0, count = 0;
    for (let b = 0; b < numBlocks; b++) {
      if (blockLoudness[b] > -70) { sum += blockMS[b]; count++; }
    }
    if (count === 0) return -70;
    const meanAbs = sum / count;
    const absLufs = -0.691 + 10 * Math.log10(meanAbs);
    // Relative gating at absLufs - 10
    const relGate = absLufs - 10;
    sum = 0; count = 0;
    for (let b = 0; b < numBlocks; b++) {
      if (blockLoudness[b] > -70 && blockLoudness[b] > relGate) {
        sum += blockMS[b]; count++;
      }
    }
    if (count === 0) return absLufs;
    const meanRel = sum / count;
    return -0.691 + 10 * Math.log10(meanRel);
  }

  // ────────────────────────────────────────────────────────────────────────
  // FFT (radix-2 Cooley-Tukey, in-place)
  // ────────────────────────────────────────────────────────────────────────
  function fftRadix2(re, im) {
    const n = re.length;
    // bit reversal
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) {
        let t = re[i]; re[i] = re[j]; re[j] = t;
        t = im[i]; im[i] = im[j]; im[j] = t;
      }
    }
    for (let size = 2; size <= n; size <<= 1) {
      const half = size >> 1;
      const tableStep = -TWO_PI / size;
      for (let i = 0; i < n; i += size) {
        for (let k = 0; k < half; k++) {
          const angle = tableStep * k;
          const cos = Math.cos(angle), sin = Math.sin(angle);
          const evenRe = re[i + k], evenIm = im[i + k];
          const oddRe = re[i + k + half] * cos - im[i + k + half] * sin;
          const oddIm = re[i + k + half] * sin + im[i + k + half] * cos;
          re[i + k] = evenRe + oddRe;
          im[i + k] = evenIm + oddIm;
          re[i + k + half] = evenRe - oddRe;
          im[i + k + half] = evenIm - oddIm;
        }
      }
    }
  }

  function hannWindow(n) {
    const w = new Float32Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 - 0.5 * Math.cos((TWO_PI * i) / (n - 1));
    return w;
  }

  // Average magnitude spectrum across frames (returns N/2 bins).
  function averageSpectrum(mono, sr, fftSize = 4096) {
    const half = fftSize / 2;
    const window = hannWindow(fftSize);
    const re = new Float32Array(fftSize);
    const im = new Float32Array(fftSize);
    const sum = new Float32Array(half);
    const hop = fftSize / 2;
    const numFrames = Math.max(1, Math.floor((mono.length - fftSize) / hop) + 1);
    for (let f = 0; f < numFrames; f++) {
      const off = f * hop;
      for (let i = 0; i < fftSize; i++) {
        re[i] = (mono[off + i] || 0) * window[i];
        im[i] = 0;
      }
      fftRadix2(re, im);
      for (let k = 0; k < half; k++) {
        sum[k] += Math.sqrt(re[k] * re[k] + im[k] * im[k]);
      }
    }
    for (let k = 0; k < half; k++) sum[k] /= numFrames;
    return { mags: sum, sr, fftSize };
  }

  // Energy in five logarithmic bands, returned as relative percentages
  // and absolute dB (vs. reference unity-spectrum).
  function spectralBands(spectrum) {
    const { mags, sr, fftSize } = spectrum;
    const half = mags.length;
    const binHz = sr / fftSize;
    const bands = [
      { name: 'Sub',     lo: 20,    hi: 60 },
      { name: 'Bass',    lo: 60,    hi: 200 },
      { name: 'LowMid',  lo: 200,   hi: 500 },
      { name: 'Mid',     lo: 500,   hi: 2000 },
      { name: 'HighMid', lo: 2000,  hi: 6000 },
      { name: 'Air',     lo: 6000,  hi: 16000 },
    ];
    const energies = bands.map(b => {
      const k0 = Math.max(1, Math.floor(b.lo / binHz));
      const k1 = Math.min(half - 1, Math.ceil(b.hi / binHz));
      let s = 0;
      for (let k = k0; k <= k1; k++) s += mags[k] * mags[k];
      return { ...b, energy: s };
    });
    const total = energies.reduce((a, b) => a + b.energy, 0) || 1;
    return energies.map(b => ({
      ...b,
      pct: (b.energy / total) * 100,
      db: dbfs(Math.sqrt(b.energy / Math.max(1, b.hi - b.lo))),
    }));
  }

  // ────────────────────────────────────────────────────────────────────────
  // BPM via energy-envelope autocorrelation
  // ────────────────────────────────────────────────────────────────────────
  function estimateBPM(mono, sr) {
    // 1. Downsample to ~4 kHz
    const ds = 4000;
    const factor = Math.max(1, Math.floor(sr / ds));
    const dsLen = Math.floor(mono.length / factor);
    const dsArr = new Float32Array(dsLen);
    for (let i = 0; i < dsLen; i++) {
      let s = 0;
      const off = i * factor;
      for (let j = 0; j < factor; j++) s += mono[off + j];
      dsArr[i] = s / factor;
    }
    // 2. Energy envelope: |x|^2 smoothed
    const envHop = 32;
    const envLen = Math.floor(dsLen / envHop);
    const env = new Float32Array(envLen);
    for (let i = 0; i < envLen; i++) {
      let s = 0;
      const off = i * envHop;
      for (let j = 0; j < envHop; j++) { const v = dsArr[off + j]; s += v * v; }
      env[i] = Math.sqrt(s / envHop);
    }
    const envSr = ds / envHop;
    // 3. Half-wave rectified derivative (onset signal)
    const onset = new Float32Array(envLen);
    for (let i = 1; i < envLen; i++) {
      const d = env[i] - env[i - 1];
      onset[i] = d > 0 ? d : 0;
    }
    // 4. Autocorrelation in BPM range 60..200 → lags
    const minLag = Math.floor(envSr * 60 / 200);
    const maxLag = Math.floor(envSr * 60 / 60);
    let bestLag = minLag, bestVal = -Infinity;
    for (let lag = minLag; lag <= maxLag; lag++) {
      let s = 0;
      const N = onset.length - lag;
      for (let i = 0; i < N; i++) s += onset[i] * onset[i + lag];
      if (s > bestVal) { bestVal = s; bestLag = lag; }
    }
    let bpm = 60 * envSr / bestLag;
    // Confidence: refine ±2 lags by parabolic interpolation
    if (bestLag > minLag && bestLag < maxLag) {
      const aL = autocorrAt(onset, bestLag - 1);
      const aC = bestVal;
      const aR = autocorrAt(onset, bestLag + 1);
      const denom = (aL - 2 * aC + aR);
      const p = denom !== 0 ? 0.5 * (aL - aR) / denom : 0;
      bpm = 60 * envSr / (bestLag + p);
    }
    // Clamp into musical range (octave issues): if <70, double; if >180, halve.
    while (bpm < 70) bpm *= 2;
    while (bpm > 180) bpm /= 2;
    return Math.round(bpm * 10) / 10;
  }
  function autocorrAt(x, lag) {
    let s = 0; const N = x.length - lag;
    for (let i = 0; i < N; i++) s += x[i] * x[i + lag];
    return s;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Key estimation via Krumhansl-Schmuckler
  // ────────────────────────────────────────────────────────────────────────
  const KS_MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88];
  const KS_MINOR = [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
  const PITCH_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

  function chromaFromSpectrum(spectrum) {
    const { mags, sr, fftSize } = spectrum;
    const binHz = sr / fftSize;
    const chroma = new Float32Array(12);
    for (let k = 1; k < mags.length; k++) {
      const f = k * binHz;
      if (f < 80 || f > 5000) continue; // focus on tonal range
      // pitch class relative to C (where A4=440). A4 is pitch-class 9.
      const semis = 12 * Math.log2(f / 440) + 69;
      const pc = ((Math.round(semis) % 12) + 12) % 12;
      chroma[pc] += mags[k];
    }
    // normalize
    let total = 0;
    for (let i = 0; i < 12; i++) total += chroma[i];
    if (total > 0) for (let i = 0; i < 12; i++) chroma[i] /= total;
    return chroma;
  }

  function pearson(a, b) {
    const n = a.length;
    let sa = 0, sb = 0;
    for (let i = 0; i < n; i++) { sa += a[i]; sb += b[i]; }
    const ma = sa / n, mb = sb / n;
    let num = 0, da = 0, db_ = 0;
    for (let i = 0; i < n; i++) {
      const xa = a[i] - ma, xb = b[i] - mb;
      num += xa * xb; da += xa * xa; db_ += xb * xb;
    }
    const den = Math.sqrt(da * db_);
    return den === 0 ? 0 : num / den;
  }

  function estimateKey(spectrum) {
    const chroma = chromaFromSpectrum(spectrum);
    let best = { score: -Infinity, name: 'C', mode: 'major', tonic: 0 };
    for (let tonic = 0; tonic < 12; tonic++) {
      const rotMaj = new Float32Array(12);
      const rotMin = new Float32Array(12);
      for (let i = 0; i < 12; i++) {
        rotMaj[i] = KS_MAJOR[(i - tonic + 12) % 12];
        rotMin[i] = KS_MINOR[(i - tonic + 12) % 12];
      }
      const sMaj = pearson(chroma, rotMaj);
      const sMin = pearson(chroma, rotMin);
      if (sMaj > best.score) best = { score: sMaj, name: PITCH_NAMES[tonic], mode: 'major', tonic };
      if (sMin > best.score) best = { score: sMin, name: PITCH_NAMES[tonic], mode: 'minor', tonic };
    }
    return best;
  }

  // ────────────────────────────────────────────────────────────────────────
  // Stereo correlation / width
  // ────────────────────────────────────────────────────────────────────────
  function computeStereo(audioBuffer) {
    if (audioBuffer.numberOfChannels < 2) {
      return { correlation: 1, midDb: -60, sideDb: -120, widthPct: 0, isMono: true };
    }
    const L = audioBuffer.getChannelData(0);
    const R = audioBuffer.getChannelData(1);
    const N = L.length;
    let sumL = 0, sumR = 0, sumLR = 0, sumM = 0, sumS = 0;
    for (let i = 0; i < N; i++) {
      const l = L[i], r = R[i];
      const m = (l + r) * 0.5;
      const s = (l - r) * 0.5;
      sumL += l * l; sumR += r * r; sumLR += l * r;
      sumM += m * m; sumS += s * s;
    }
    const corr = sumLR / Math.sqrt((sumL * sumR) || 1);
    const midDb = dbfs(Math.sqrt(sumM / N));
    const sideDb = dbfs(Math.sqrt(sumS / N));
    // Width % roughly: 0% mono (corr=1) → 100% (corr=-1)
    const widthPct = clamp((1 - corr) * 50, 0, 100);
    return { correlation: corr, midDb, sideDb, widthPct, isMono: false };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Master analysis
  // ────────────────────────────────────────────────────────────────────────
  async function analyzeAudio(audioBuffer, onProgress = () => {}) {
    onProgress(0.05, 'merge mono');
    const mono = mergeToMono(audioBuffer);

    onProgress(0.15, 'peak/clip');
    const { peakDbfs, clippingPct } = computePeakAndClipping(audioBuffer);
    const rmsDbfs = computeRmsDbfs(mono);
    const crestDb = peakDbfs - rmsDbfs;

    onProgress(0.30, 'LUFS');
    const lufs = computeLufsIntegrated(audioBuffer);

    onProgress(0.45, 'DR');
    const drDb = computeDynamicRangeDb(mono, audioBuffer.sampleRate);

    onProgress(0.55, 'spectrum');
    const spectrum = averageSpectrum(mono, audioBuffer.sampleRate, 4096);
    const bands = spectralBands(spectrum);

    onProgress(0.75, 'BPM');
    const bpm = estimateBPM(mono, audioBuffer.sampleRate);

    onProgress(0.88, 'key');
    const key = estimateKey(spectrum);

    onProgress(0.95, 'stereo');
    const stereo = computeStereo(audioBuffer);

    onProgress(1, 'done');
    return {
      duration: audioBuffer.duration,
      sampleRate: audioBuffer.sampleRate,
      channels: audioBuffer.numberOfChannels,
      peakDbfs, clippingPct, rmsDbfs, crestDb, lufs, drDb,
      bands, spectrum, bpm, key, stereo,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Verdict / scoring + recommendations
  // ────────────────────────────────────────────────────────────────────────
  function evaluate(report) {
    const issues = [];
    const goods = [];
    const recs = [];

    // Loudness
    if (report.lufs > -8) {
      issues.push({ k: 'LUFS', s: 'Слишком громко (>-8 LUFS) — потеря динамики, кламп на стримингах.' });
      recs.push('Нормализуй до -10..-14 LUFS. На стриминги (Spotify/Apple) цель -14 LUFS.');
    } else if (report.lufs > -12) {
      goods.push({ k: 'LUFS', s: 'Громко и плотно (≈ клубный уровень).' });
    } else if (report.lufs > -16) {
      goods.push({ k: 'LUFS', s: 'Громкость в стриминговом окне (-16..-12).' });
    } else if (report.lufs > -22) {
      issues.push({ k: 'LUFS', s: 'Тихо для современного релиза.' });
      recs.push('Подними лимитером/мастер-гейном до целевых -10..-14 LUFS.');
    } else {
      issues.push({ k: 'LUFS', s: 'Очень тихо — звучит как демо/превью.' });
      recs.push('Серьёзная мастеринговая компрессия + лимитер до -12 LUFS.');
    }

    // Peak / clipping
    if (report.peakDbfs > -0.1) {
      issues.push({ k: 'Peak', s: `Пик ${report.peakDbfs.toFixed(2)} dBFS — почти 0, риск клиппинга на интерсемпле.` });
      recs.push('Установи потолок лимитера на -1 dBTP.');
    } else if (report.peakDbfs > -0.5) {
      goods.push({ k: 'Peak', s: `Пик ${report.peakDbfs.toFixed(2)} dBFS — комфортно.` });
    }
    if (report.clippingPct > 0.01) {
      issues.push({ k: 'Clip', s: `Найдено клиппинг-сэмплов: ${report.clippingPct.toFixed(3)}% — это уже слышимые искажения.` });
      recs.push('Сделай тише на 2-3 dB перед лимитером, проверь файл на интер-сэмпл-пики.');
    }

    // Crest / DR
    if (report.crestDb < 7) {
      issues.push({ k: 'DR', s: `Динамика ${report.crestDb.toFixed(1)} dB — пере-сжато (брикволл).` });
      recs.push('Откати компрессию: ratio 1.5-2:1, поднимай порог.');
    } else if (report.crestDb < 10) {
      goods.push({ k: 'DR', s: `Динамика ${report.crestDb.toFixed(1)} dB — типично для современного мастеринга.` });
    } else {
      goods.push({ k: 'DR', s: `Динамика ${report.crestDb.toFixed(1)} dB — живой, "дышащий" звук.` });
    }

    // Spectrum
    const sub = report.bands.find(b => b.name === 'Sub').pct;
    const bass = report.bands.find(b => b.name === 'Bass').pct;
    const lowmid = report.bands.find(b => b.name === 'LowMid').pct;
    const mid = report.bands.find(b => b.name === 'Mid').pct;
    const himid = report.bands.find(b => b.name === 'HighMid').pct;
    const air = report.bands.find(b => b.name === 'Air').pct;

    if (sub > 25) {
      issues.push({ k: 'Sub', s: `Слишком много суб-баса (${sub.toFixed(0)}%).` });
      recs.push('Срез HPF на 30-40 Гц + low-shelf -2 dB на 50 Гц.');
    }
    if (lowmid > 30) {
      issues.push({ k: 'LowMid', s: `Низкая середина перегружена (${lowmid.toFixed(0)}%) — "грязь" в миксе.` });
      recs.push('Колокольный срез -2..-3 dB на 250-350 Гц.');
    }
    if (himid < 8) {
      issues.push({ k: 'HighMid', s: `Не хватает презенса 2-6 кГц (${himid.toFixed(0)}%).` });
      recs.push('Подними shelf +2 dB на 3 кГц для разборчивости.');
    }
    if (air < 4) {
      issues.push({ k: 'Air', s: `Тёмный верх (${air.toFixed(0)}% выше 6 кГц) — не хватает "воздуха".` });
      recs.push('High-shelf +2..+3 dB на 12 кГц.');
    } else if (air > 18) {
      issues.push({ k: 'Air', s: `Жёсткий верх (${air.toFixed(0)}% выше 6 кГц).` });
      recs.push('Срежь shelf -2 dB на 10 кГц или подави де-эссером.');
    }

    // Stereo
    if (report.stereo.isMono) {
      issues.push({ k: 'Stereo', s: 'Моно-файл.' });
    } else if (report.stereo.correlation < 0) {
      issues.push({ k: 'Stereo', s: `Корреляция ${report.stereo.correlation.toFixed(2)} — фазовые проблемы.` });
      recs.push('Проверь полярность канала, моно-совместимость.');
    } else if (report.stereo.correlation < 0.2) {
      goods.push({ k: 'Stereo', s: 'Очень широкая стерео-картина.' });
    } else if (report.stereo.correlation > 0.95) {
      issues.push({ k: 'Stereo', s: 'Почти моно — нет стерео-ощущения.' });
      recs.push('Добавь стерео-расширение для пэдов/ревербов или используй M/S-EQ.');
    } else {
      goods.push({ k: 'Stereo', s: `Корреляция ${report.stereo.correlation.toFixed(2)} — здоровая стереокартина.` });
    }

    // Score 0..100
    let score = 100;
    score -= Math.max(0, (-12 - report.lufs)) * 1.2;            // tihiy
    score -= Math.max(0, (report.lufs - -8)) * 2.0;              // peregruz
    score -= report.clippingPct * 50;
    score -= Math.max(0, 8 - report.crestDb) * 2.5;
    score -= Math.max(0, sub - 25) * 0.7;
    score -= Math.max(0, lowmid - 30) * 0.7;
    score -= Math.max(0, 6 - himid) * 1.0;
    score -= Math.max(0, 4 - air) * 1.0;
    if (report.stereo.isMono) score -= 6;
    if (!report.stereo.isMono && report.stereo.correlation < 0) score -= 12;
    score = clamp(Math.round(score), 0, 100);

    let grade = 'D';
    if (score >= 90) grade = 'S';
    else if (score >= 80) grade = 'A';
    else if (score >= 70) grade = 'B';
    else if (score >= 55) grade = 'C';
    return { score, grade, issues, goods, recs };
  }

  // ────────────────────────────────────────────────────────────────────────
  // Auto-Mix engine: render via OfflineAudioContext, return AudioBuffer
  // Decisions are derived from the analysis report.
  // ────────────────────────────────────────────────────────────────────────
  // Compression intensity presets: how aggressively the glue compressor squeezes.
  // soft = audiophile (light), medium = standard streaming master, hard = club/IG-loud.
  const INTENSITY_PRESETS = {
    soft:   { thresholdDelta: +4, ratioMul: 0.65, kneeDelta: +2, attack: 0.020, release: 0.220 },
    medium: { thresholdDelta:  0, ratioMul: 1.00, kneeDelta:  0, attack: 0.010, release: 0.180 },
    hard:   { thresholdDelta: -4, ratioMul: 1.50, kneeDelta: -2, attack: 0.005, release: 0.120 },
  };

  async function autoMix(audioBuffer, report, opts = {}) {
    const targetLufs = clamp(opts.targetLufs ?? -12, -24, -4);
    const maxTruePeak = opts.maxTruePeakDb ?? -1.0;
    const intensityKey = (opts.intensity || 'medium').toLowerCase();
    const intensity = INTENSITY_PRESETS[intensityKey] || INTENSITY_PRESETS.medium;

    const sub = report.bands.find(b => b.name === 'Sub').pct;
    const lowmid = report.bands.find(b => b.name === 'LowMid').pct;
    const himid = report.bands.find(b => b.name === 'HighMid').pct;
    const air = report.bands.find(b => b.name === 'Air').pct;

    const ctx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;

    // 1) HPF 30 Hz — clear sub rumble
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 30;
    hpf.Q.value = 0.7;

    // 2) Low-shelf 80 Hz: tame too-much-sub or boost weak bass
    const lowShelf = ctx.createBiquadFilter();
    lowShelf.type = 'lowshelf';
    lowShelf.frequency.value = 80;
    lowShelf.gain.value = sub > 25 ? -2.5 : (sub < 8 ? +1.5 : 0);

    // 3) Bell at 300 Hz for mud control
    const mudBell = ctx.createBiquadFilter();
    mudBell.type = 'peaking';
    mudBell.frequency.value = 320;
    mudBell.Q.value = 1.2;
    mudBell.gain.value = lowmid > 35 ? -3.5 : (lowmid > 30 ? -2.5 : 0);

    // 4) Bell at 3 kHz for presence
    const presBell = ctx.createBiquadFilter();
    presBell.type = 'peaking';
    presBell.frequency.value = 3200;
    presBell.Q.value = 0.9;
    presBell.gain.value = himid < 8 ? +2.0 : (himid > 18 ? -1.5 : 0);

    // 5) High-shelf 10 kHz for air
    const airShelf = ctx.createBiquadFilter();
    airShelf.type = 'highshelf';
    airShelf.frequency.value = 10000;
    airShelf.gain.value = air < 4 ? +2.5 : (air > 18 ? -1.5 : +0.5);

    // 6) Glue compressor (master bus). Intensity preset offsets the auto-derived
    //    base values (driven by report.crestDb).
    const baseThreshold = report.crestDb < 8 ? -10 : -16;
    const baseRatio = report.crestDb < 8 ? 1.6 : 2.5;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = clamp(baseThreshold + intensity.thresholdDelta, -30, -3);
    comp.knee.value = clamp(8 + intensity.kneeDelta, 0, 18);
    comp.ratio.value = clamp(baseRatio * intensity.ratioMul, 1.05, 12);
    comp.attack.value = intensity.attack;
    comp.release.value = intensity.release;

    // 7) Make-up gain pre-limiter (we'll refine via two-pass loudness measurement)
    const makeup = ctx.createGain();
    makeup.gain.value = 1.0; // adjusted below

    // 8) Brickwall limiter (DynamicsCompressor with ratio 20:1, hard knee)
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = maxTruePeak; // dB
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.05;

    // Wire chain
    src.connect(hpf);
    hpf.connect(lowShelf);
    lowShelf.connect(mudBell);
    mudBell.connect(presBell);
    presBell.connect(airShelf);
    airShelf.connect(comp);
    comp.connect(makeup);
    makeup.connect(limiter);
    limiter.connect(ctx.destination);

    src.start(0);

    // First render at unity makeup
    const firstRender = await ctx.startRendering();

    // Measure new loudness, then re-render with adjusted makeup if needed
    const lufs1 = computeLufsIntegrated(firstRender);
    let delta = targetLufs - lufs1; // positive ⇒ need louder
    delta = clamp(delta, -10, 10); // sanity

    const eqApplied = {
      lowShelf: lowShelf.gain.value,
      mud: mudBell.gain.value,
      presence: presBell.gain.value,
      air: airShelf.gain.value,
    };
    const compApplied = {
      compThreshold: comp.threshold.value,
      compRatio: comp.ratio.value,
    };

    if (Math.abs(delta) < 0.5) {
      return {
        rendered: firstRender,
        makeupDb: 0,
        lufsBefore: report.lufs,
        lufsAfter: lufs1,
        eq: eqApplied,
        ...compApplied,
      };
    }

    // Second pass with corrected makeup
    const ctx2 = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const src2 = ctx2.createBufferSource(); src2.buffer = audioBuffer;
    const hpf2 = ctx2.createBiquadFilter(); hpf2.type = 'highpass'; hpf2.frequency.value = 30; hpf2.Q.value = 0.7;
    const lowShelf2 = ctx2.createBiquadFilter(); lowShelf2.type = 'lowshelf'; lowShelf2.frequency.value = 80; lowShelf2.gain.value = lowShelf.gain.value;
    const mudBell2 = ctx2.createBiquadFilter(); mudBell2.type = 'peaking'; mudBell2.frequency.value = 320; mudBell2.Q.value = 1.2; mudBell2.gain.value = mudBell.gain.value;
    const presBell2 = ctx2.createBiquadFilter(); presBell2.type = 'peaking'; presBell2.frequency.value = 3200; presBell2.Q.value = 0.9; presBell2.gain.value = presBell.gain.value;
    const airShelf2 = ctx2.createBiquadFilter(); airShelf2.type = 'highshelf'; airShelf2.frequency.value = 10000; airShelf2.gain.value = airShelf.gain.value;
    const comp2 = ctx2.createDynamicsCompressor();
    comp2.threshold.value = comp.threshold.value; comp2.knee.value = comp.knee.value; comp2.ratio.value = comp.ratio.value; comp2.attack.value = comp.attack.value; comp2.release.value = comp.release.value;
    const makeup2 = ctx2.createGain(); makeup2.gain.value = lin(delta);
    const limiter2 = ctx2.createDynamicsCompressor();
    limiter2.threshold.value = maxTruePeak; limiter2.knee.value = 0; limiter2.ratio.value = 20; limiter2.attack.value = 0.001; limiter2.release.value = 0.05;

    src2.connect(hpf2); hpf2.connect(lowShelf2); lowShelf2.connect(mudBell2); mudBell2.connect(presBell2);
    presBell2.connect(airShelf2); airShelf2.connect(comp2); comp2.connect(makeup2); makeup2.connect(limiter2);
    limiter2.connect(ctx2.destination);
    src2.start(0);

    const rendered2 = await ctx2.startRendering();
    const lufs2 = computeLufsIntegrated(rendered2);

    return {
      rendered: rendered2,
      makeupDb: delta,
      lufsBefore: report.lufs,
      lufsAfter: lufs2,
      eq: {
        lowShelf: lowShelf.gain.value,
        mud: mudBell.gain.value,
        presence: presBell.gain.value,
        air: airShelf.gain.value,
      },
      compThreshold: comp.threshold.value,
      compRatio: comp.ratio.value,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // WAV encoder (16-bit PCM)
  // ────────────────────────────────────────────────────────────────────────
  function audioBufferToWavBlob(buffer) {
    const numCh = buffer.numberOfChannels;
    const sr = buffer.sampleRate;
    const len = buffer.length;
    const interleaved = new Float32Array(len * numCh);
    for (let c = 0; c < numCh; c++) {
      const data = buffer.getChannelData(c);
      for (let i = 0; i < len; i++) interleaved[i * numCh + c] = data[i];
    }
    const dataBytes = interleaved.length * 2;
    const headerBytes = 44;
    const ab = new ArrayBuffer(headerBytes + dataBytes);
    const view = new DataView(ab);

    function ws(off, str) { for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i)); }

    ws(0, 'RIFF');
    view.setUint32(4, 36 + dataBytes, true);
    ws(8, 'WAVE');
    ws(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);                  // PCM
    view.setUint16(22, numCh, true);
    view.setUint32(24, sr, true);
    view.setUint32(28, sr * numCh * 2, true);     // byte rate
    view.setUint16(32, numCh * 2, true);          // block align
    view.setUint16(34, 16, true);                 // bits/sample
    ws(36, 'data');
    view.setUint32(40, dataBytes, true);

    let off = 44;
    for (let i = 0; i < interleaved.length; i++) {
      let s = clamp(interleaved[i], -1, 1);
      view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
      off += 2;
    }
    return new Blob([ab], { type: 'audio/wav' });
  }

  // ────────────────────────────────────────────────────────────────────────
  // Lyrics (Whisper via @xenova/transformers, browser WASM, no backend)
  // ────────────────────────────────────────────────────────────────────────
  // Lazy-loaded singleton pipeline. The model + tokenizer download (~40 MB
  // quantized) only happens on the first call and is cached by the browser.
  const TRANSFORMERS_CDN = 'https://cdn.jsdelivr.net/npm/@xenova/transformers@2.17.2';
  let _whisperPipe = null;
  let _whisperLoading = null;

  async function loadWhisperPipeline(onProgress) {
    if (_whisperPipe) return _whisperPipe;
    if (_whisperLoading) return _whisperLoading;
    _whisperLoading = (async () => {
      const mod = await import(TRANSFORMERS_CDN);
      const { pipeline, env } = mod;
      env.allowLocalModels = false;
      env.useBrowserCache = true;
      const transcriber = await pipeline('automatic-speech-recognition', 'Xenova/whisper-tiny', {
        quantized: true,
        progress_callback: (p) => {
          if (!onProgress) return;
          if (p && p.status === 'progress' && p.file) {
            onProgress(clamp((p.progress || 0) / 100, 0, 0.95), `модель: ${p.file} ${Math.round(p.progress || 0)}%`);
          } else if (p && p.status === 'done') {
            onProgress(0.95, `модель готова`);
          }
        },
      });
      _whisperPipe = transcriber;
      return transcriber;
    })();
    try { return await _whisperLoading; } finally { _whisperLoading = null; }
  }

  // Linearly resample mono Float32Array to 16 kHz (Whisper's required sample rate).
  function resampleToWhisper(audioBuffer) {
    const mono = mergeToMono(audioBuffer);
    const target = 16000;
    if (audioBuffer.sampleRate === target) return mono;
    const ratio = audioBuffer.sampleRate / target;
    const outLen = Math.floor(mono.length / ratio);
    const out = new Float32Array(outLen);
    for (let i = 0; i < outLen; i++) {
      const idx = i * ratio;
      const i0 = Math.floor(idx);
      const frac = idx - i0;
      out[i] = mono[i0] * (1 - frac) + (mono[i0 + 1] || 0) * frac;
    }
    return out;
  }

  async function transcribe(audioBuffer, onProgress = () => {}) {
    onProgress(0.02, 'загрузка whisper-tiny…');
    const transcriber = await loadWhisperPipeline(onProgress);
    onProgress(0.96, 'ресемпл в 16 kHz…');
    const audio = resampleToWhisper(audioBuffer);
    onProgress(0.98, 'распознавание…');
    const result = await transcriber(audio, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
      task: 'transcribe',
    });
    onProgress(1, 'готово');
    return result; // { text, chunks: [{ text, timestamp: [start, end] }] }
  }

  function analyzeLyrics(whisperResult, durationSec) {
    const text = (whisperResult && whisperResult.text || '').trim();
    const chunks = (whisperResult && whisperResult.chunks) || [];
    const lines = chunks.map(c => (c.text || '').trim()).filter(Boolean);
    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;
    const tokenize = (s) => s.toLowerCase()
      .replace(/[^\p{L}\p{N}\s']/gu, ' ')
      .split(/\s+/).filter(Boolean);
    const tokens = tokenize(text);
    const uniqueWords = new Set(tokens).size;
    const vocabDiversity = tokens.length > 0 ? uniqueWords / tokens.length : 0;
    const lineCount = lines.length;
    const avgLineLen = lineCount > 0
      ? lines.reduce((s, l) => s + tokenize(l).length, 0) / lineCount
      : 0;
    const dur = Math.max(1, durationSec || 1);
    const wpm = wordCount > 0 ? wordCount / (dur / 60) : 0;

    // Repeat detection: lines whose normalized form appears 2+ times → likely chorus / hook.
    const lineCounts = new Map();
    lines.forEach(l => {
      const norm = tokenize(l).join(' ');
      if (!norm || tokenize(l).length < 3) return;
      lineCounts.set(norm, (lineCounts.get(norm) || 0) + 1);
    });
    const repeats = [...lineCounts.entries()]
      .filter(([_, n]) => n >= 2)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([line, count]) => ({ line, count }));

    // Cheap language guess: look at the chunks' detected langs if Whisper exposed it,
    // otherwise infer from script (Cyrillic vs Latin) of the dominant tokens.
    let cyr = 0, lat = 0;
    for (const t of tokens) {
      for (const ch of t) {
        const code = ch.codePointAt(0);
        if ((code >= 0x0400 && code <= 0x04FF) || (code >= 0x0500 && code <= 0x052F)) cyr++;
        else if ((code >= 0x41 && code <= 0x5A) || (code >= 0x61 && code <= 0x7A)) lat++;
      }
    }
    const language = cyr > lat ? 'ru' : (lat > 0 ? 'en' : 'unknown');

    return {
      text, chunks, lines, language,
      wordCount, uniqueWords, vocabDiversity, lineCount, avgLineLen, wpm,
      repeats,
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // UI
  // ────────────────────────────────────────────────────────────────────────
  function fmt(n, d = 1) { return Number(n).toFixed(d); }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function drawSpectrum(canvas, spectrum) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.clientWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.clearRect(0, 0, W, H);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, 'rgba(34,211,238,0.95)');
    grad.addColorStop(1, 'rgba(139,92,246,0.6)');
    const { mags, sr, fftSize } = spectrum;
    const half = mags.length;
    const binHz = sr / fftSize;
    const minF = 20, maxF = Math.min(sr / 2, 20000);
    const logMin = Math.log10(minF), logMax = Math.log10(maxF);
    let maxMag = 0;
    for (let k = 1; k < half; k++) if (mags[k] > maxMag) maxMag = mags[k];
    if (maxMag <= 0) return;

    ctx.fillStyle = grad;
    const bars = 96;
    for (let b = 0; b < bars; b++) {
      const f0 = Math.pow(10, logMin + (b / bars) * (logMax - logMin));
      const f1 = Math.pow(10, logMin + ((b + 1) / bars) * (logMax - logMin));
      const k0 = Math.max(1, Math.floor(f0 / binHz));
      const k1 = Math.min(half - 1, Math.ceil(f1 / binHz));
      let v = 0;
      for (let k = k0; k <= k1; k++) if (mags[k] > v) v = mags[k];
      const norm = v / maxMag;
      const dB = 20 * Math.log10(Math.max(1e-4, norm));
      const h = clamp((dB + 60) / 60, 0, 1) * H;
      const x = (b / bars) * W;
      const w = (W / bars) - 2;
      ctx.fillRect(x, H - h, w, h);
    }
    // Axis labels (very light)
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${10 * window.devicePixelRatio}px Inter,system-ui`;
    [50, 100, 250, 500, 1000, 2500, 5000, 10000].forEach(f => {
      const x = ((Math.log10(f) - logMin) / (logMax - logMin)) * W;
      ctx.fillText(f >= 1000 ? `${f / 1000}k` : `${f}`, x + 2, H - 4);
    });
  }

  function drawWaveform(canvas, audioBuffer) {
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.clientWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.clientHeight * window.devicePixelRatio;
    ctx.clearRect(0, 0, W, H);
    const data = audioBuffer.getChannelData(0);
    const step = Math.max(1, Math.floor(data.length / W));
    ctx.strokeStyle = 'rgba(139,92,246,0.85)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x < W; x++) {
      const off = x * step;
      let mn = 1, mx = -1;
      for (let i = 0; i < step; i++) {
        const v = data[off + i] || 0;
        if (v < mn) mn = v;
        if (v > mx) mx = v;
      }
      const y1 = H / 2 - mx * (H / 2);
      const y2 = H / 2 - mn * (H / 2);
      ctx.moveTo(x, y1);
      ctx.lineTo(x, y2);
    }
    ctx.stroke();
  }

  // ────────────────────────────────────────────────────────────────────────
  // Mount UI
  // ────────────────────────────────────────────────────────────────────────
  function mount(root) {
    root.innerHTML = `
      <h2 class="ai-h2">ИИ-оценщик трека</h2>
      <div class="card ai-hero">
        <div class="ai-drop" id="ai-drop">
          <input id="ai-file" type="file" accept="audio/*" hidden />
          <div class="ai-drop-inner">
            <div class="ai-drop-emoji">🎧</div>
            <div class="ai-drop-title">Перетащи трек или <span class="ai-link">выбери файл</span></div>
            <div class="ai-drop-sub muted">MP3, WAV, FLAC, M4A — всё считается на устройстве, без серверов</div>
          </div>
        </div>
        <div class="ai-meta hidden" id="ai-meta"></div>
        <canvas id="ai-wave" class="ai-wave hidden"></canvas>
        <div class="ai-actions hidden" id="ai-buttons">
          <button id="ai-analyze" class="btn primary">🔬 Анализ</button>
          <button id="ai-automix" class="btn ghost" disabled>🎚 Авто-сведение</button>
          <button id="ai-lyrics" class="btn ghost" disabled>📝 Текст трека</button>
        </div>
        <div id="ai-progress" class="ai-progress hidden"><div class="ai-progress-bar"></div><div class="ai-progress-label">…</div></div>
      </div>

      <div class="card hidden" id="ai-results">
        <div class="ai-grade">
          <div class="ai-grade-letter" id="ai-grade-letter">—</div>
          <div class="ai-grade-meta">
            <div class="ai-grade-score"><span id="ai-score">0</span>/100</div>
            <div class="muted ai-grade-sub">Оценка трека</div>
          </div>
        </div>
        <div class="ai-metrics" id="ai-metrics"></div>
        <h3>Спектр</h3>
        <canvas id="ai-spec" class="ai-spec"></canvas>
        <div class="ai-bands" id="ai-bands"></div>
        <h3>Что хорошо</h3>
        <ul class="ai-list good" id="ai-goods"></ul>
        <h3>Что чинить</h3>
        <ul class="ai-list bad" id="ai-issues"></ul>
        <h3>Рекомендации</h3>
        <ul class="ai-list rec" id="ai-recs"></ul>
      </div>

      <div class="card hidden" id="ai-mix-controls">
        <h3>🎛 Параметры авто-сведения</h3>
        <div class="ai-slider-group">
          <div class="ai-slider-head">
            <span>Целевая громкость (LUFS)</span>
            <span class="ai-slider-val" id="ai-lufs-val">−12.0</span>
          </div>
          <input id="ai-lufs-slider" type="range" min="-20" max="-6" step="0.5" value="-12" class="ai-range" />
          <div class="ai-slider-scale"><span>−20 (тихо)</span><span>−14 стрим</span><span>−9 клуб</span><span>−6 макс</span></div>
        </div>

        <div class="ai-intensity">
          <div class="ai-slider-head" style="margin-bottom:8px"><span>Интенсивность компрессии</span><span class="ai-slider-val" id="ai-intensity-val">medium</span></div>
          <div class="ai-intensity-row">
            <button class="ai-int-btn" data-intensity="soft">Мягко</button>
            <button class="ai-int-btn active" data-intensity="medium">Средне</button>
            <button class="ai-int-btn" data-intensity="hard">Жёстко</button>
          </div>
          <div class="muted ai-intensity-hint" id="ai-intensity-hint">Стандартный мастеринг под стриминг.</div>
        </div>
        <button id="ai-render" class="btn primary w100" style="margin-top:14px">🎚 Свести с этими настройками</button>
      </div>

      <div class="card hidden" id="ai-mix-result">
        <h3>🎚 Авто-сведение готово</h3>
        <div class="ai-mix-stats" id="ai-mix-stats"></div>
        <div class="row">
          <button id="ai-play-orig" class="btn ghost w100">▶ Оригинал</button>
          <button id="ai-play-mix" class="btn primary w100">▶ Сведение</button>
        </div>
        <button id="ai-download" class="btn ghost w100" style="margin-top:10px">⬇ Скачать WAV</button>
      </div>

      <div class="card hidden" id="ai-lyrics-card">
        <h3>📝 Текст трека</h3>
        <div class="ai-lyrics-badges" id="ai-lyrics-badges"></div>
        <div class="ai-lyrics-text" id="ai-lyrics-text"></div>
        <h3 style="margin-top:16px">🔁 Повторы (потенциальный припев)</h3>
        <ul class="ai-list rec" id="ai-lyrics-repeats"></ul>
      </div>
    `;

    const $ = (sel) => root.querySelector(sel);
    const drop = $('#ai-drop');
    const fileInput = $('#ai-file');
    const meta = $('#ai-meta');
    const waveCv = $('#ai-wave');
    const buttons = $('#ai-buttons');
    const progress = $('#ai-progress');
    const results = $('#ai-results');
    const mixControls = $('#ai-mix-controls');
    const mixResult = $('#ai-mix-result');
    const lyricsCard = $('#ai-lyrics-card');

    let audioBuffer = null;
    let report = null;
    let mixed = null;
    let player = null; // current HTMLAudioElement
    let mixedBlobUrl = null;
    let origBlob = null;
    let origBlobUrl = null;
    let lastFileName = 'track';
    let intensity = 'medium';
    let targetLufs = -12;
    let lyrics = null;

    const intensityHints = {
      soft:   'Мягко: лёгкий «glue», бережёт динамику, для джаза/инди/акустики.',
      medium: 'Средне: стандартный streaming-мастер, баланс громкости и динамики.',
      hard:   'Жёстко: максимально плотно, в ущерб динамике — для трапа, EDM, IG-рилсов.',
    };

    function toast(msg, kind = 'info') {
      const t = document.createElement('div');
      t.className = `ai-toast ${kind}`;
      t.textContent = msg;
      document.body.appendChild(t);
      setTimeout(() => t.classList.add('show'), 10);
      setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 2400);
    }

    function pickFile() { fileInput.click(); }
    drop.addEventListener('click', pickFile);
    drop.addEventListener('dragover', e => { e.preventDefault(); drop.classList.add('drag'); });
    drop.addEventListener('dragleave', () => drop.classList.remove('drag'));
    drop.addEventListener('drop', e => {
      e.preventDefault(); drop.classList.remove('drag');
      const f = e.dataTransfer.files?.[0];
      if (f) handleFile(f);
    });
    fileInput.addEventListener('change', e => {
      const f = e.target.files?.[0];
      if (f) handleFile(f);
    });

    async function handleFile(file) {
      lastFileName = file.name.replace(/\.[^.]+$/, '');
      const safeName = escapeHtml(file.name);
      meta.classList.remove('hidden');
      meta.innerHTML = `<div class="muted">📂 ${safeName} — ${(file.size / 1048576).toFixed(2)} MB</div><div class="muted">Декодирую…</div>`;
      results.classList.add('hidden');
      mixControls.classList.add('hidden');
      mixResult.classList.add('hidden');
      lyricsCard.classList.add('hidden');
      buttons.classList.add('hidden');
      waveCv.classList.add('hidden');
      report = null;
      mixed = null;
      lyrics = null;
      try {
        const ab = await file.arrayBuffer();
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        audioBuffer = await ctx.decodeAudioData(ab.slice(0));
        ctx.close && ctx.close();
        origBlob = file;
        if (origBlobUrl) URL.revokeObjectURL(origBlobUrl);
        origBlobUrl = URL.createObjectURL(file);

        meta.innerHTML = `
          <div><b>${safeName}</b></div>
          <div class="muted">${audioBuffer.numberOfChannels} ch · ${audioBuffer.sampleRate} Hz · ${fmtTime(audioBuffer.duration)}</div>
        `;
        waveCv.classList.remove('hidden');
        buttons.classList.remove('hidden');
        $('#ai-automix').disabled = true;
        $('#ai-lyrics').disabled = false;
        requestAnimationFrame(() => drawWaveform(waveCv, audioBuffer));
      } catch (err) {
        console.error(err);
        meta.innerHTML = `<div class="muted">Не удалось декодировать: ${escapeHtml(err && err.message || err)}</div>`;
      }
    }

    function fmtTime(s) {
      const m = Math.floor(s / 60), ss = Math.floor(s % 60);
      return `${m}:${ss.toString().padStart(2, '0')}`;
    }

    function setProgress(pct, label) {
      progress.classList.remove('hidden');
      progress.querySelector('.ai-progress-bar').style.width = `${Math.round(pct * 100)}%`;
      progress.querySelector('.ai-progress-label').textContent = label || '';
    }
    function hideProgress() { progress.classList.add('hidden'); }

    $('#ai-analyze').addEventListener('click', async () => {
      if (!audioBuffer) return;
      try {
        $('#ai-analyze').disabled = true;
        report = await analyzeAudio(audioBuffer, setProgress);
        const verdict = evaluate(report);
        renderReport(report, verdict);
        $('#ai-automix').disabled = false;
        results.classList.remove('hidden');
        mixControls.classList.remove('hidden');
        toast('Анализ готов');
      } catch (e) {
        console.error(e);
        toast('Ошибка анализа: ' + (e.message || e), 'err');
      } finally {
        $('#ai-analyze').disabled = false;
        hideProgress();
      }
    });

    // ── Mix controls (LUFS slider + intensity buttons) ──────────────────
    const lufsSlider = $('#ai-lufs-slider');
    const lufsVal = $('#ai-lufs-val');
    lufsSlider.addEventListener('input', () => {
      targetLufs = parseFloat(lufsSlider.value);
      lufsVal.textContent = `−${Math.abs(targetLufs).toFixed(1)}`;
    });
    root.querySelectorAll('.ai-int-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        intensity = btn.dataset.intensity;
        root.querySelectorAll('.ai-int-btn').forEach(b => b.classList.toggle('active', b === btn));
        $('#ai-intensity-val').textContent = intensity;
        $('#ai-intensity-hint').textContent = intensityHints[intensity] || '';
      });
    });

    async function runMix() {
      if (!audioBuffer || !report) {
        toast('Сначала анализ', 'err');
        return;
      }
      try {
        $('#ai-automix').disabled = true;
        $('#ai-render').disabled = true;
        setProgress(0.1, `рендер: цель ${targetLufs} LUFS · ${intensity}…`);
        mixed = await autoMix(audioBuffer, report, { targetLufs, intensity });
        setProgress(0.85, 'кодирую WAV…');
        const blob = audioBufferToWavBlob(mixed.rendered);
        if (mixedBlobUrl) URL.revokeObjectURL(mixedBlobUrl);
        mixedBlobUrl = URL.createObjectURL(blob);
        renderMixResult(mixed, blob);
        mixResult.classList.remove('hidden');
        toast('Авто-сведение готово 🔥');
      } catch (e) {
        console.error(e);
        toast('Ошибка сведения: ' + (e.message || e), 'err');
      } finally {
        hideProgress();
        $('#ai-automix').disabled = false;
        $('#ai-render').disabled = false;
      }
    }
    $('#ai-automix').addEventListener('click', () => {
      if (!report) {
        toast('Сначала анализ', 'err');
        return;
      }
      mixControls.classList.remove('hidden');
      mixControls.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      runMix();
    });
    $('#ai-render').addEventListener('click', runMix);

    // ── Lyrics (Whisper) ────────────────────────────────────────────────
    $('#ai-lyrics').addEventListener('click', async () => {
      if (!audioBuffer) return;
      try {
        $('#ai-lyrics').disabled = true;
        setProgress(0.01, 'инициализация whisper…');
        const result = await transcribe(audioBuffer, setProgress);
        lyrics = analyzeLyrics(result, audioBuffer.duration);
        renderLyrics(lyrics);
        lyricsCard.classList.remove('hidden');
        toast('Текст распознан');
      } catch (e) {
        console.error(e);
        toast('Ошибка распознавания: ' + (e.message || e), 'err');
      } finally {
        hideProgress();
        $('#ai-lyrics').disabled = false;
      }
    });

    function renderReport(r, v) {
      $('#ai-grade-letter').textContent = v.grade;
      $('#ai-grade-letter').className = 'ai-grade-letter grade-' + v.grade;
      $('#ai-score').textContent = v.score;

      const m = $('#ai-metrics');
      m.innerHTML = '';
      const metrics = [
        ['LUFS',     `${fmt(r.lufs, 1)}`,      'Громкость по BS.1770'],
        ['Peak',     `${fmt(r.peakDbfs, 2)} dBFS`, 'Истинный пик'],
        ['Crest',    `${fmt(r.crestDb, 1)} dB`, 'Пик − RMS'],
        ['DR',       `${fmt(r.drDb, 1)} dB`, 'Динамический диапазон'],
        ['BPM',      `${fmt(r.bpm, 1)}`,      'Темп'],
        ['Key',      `${r.key.name} ${r.key.mode === 'minor' ? 'min' : 'maj'}`, 'Тональность'],
        ['Stereo',   r.stereo.isMono ? 'mono' : `${fmt(r.stereo.correlation, 2)} corr`, 'Корреляция L/R'],
        ['Clip',     `${fmt(r.clippingPct, 3)}%`, 'Клиппинг'],
      ];
      metrics.forEach(([k, val, sub]) => {
        const el = document.createElement('div');
        el.className = 'ai-metric';
        el.innerHTML = `<div class="ai-metric-k">${k}</div><div class="ai-metric-v">${val}</div><div class="ai-metric-sub muted">${sub}</div>`;
        m.appendChild(el);
      });

      requestAnimationFrame(() => drawSpectrum($('#ai-spec'), r.spectrum));

      const bandsEl = $('#ai-bands');
      bandsEl.innerHTML = '';
      r.bands.forEach(b => {
        const row = document.createElement('div');
        row.className = 'ai-band';
        row.innerHTML = `
          <div class="ai-band-name">${b.name}</div>
          <div class="ai-band-bar"><div style="width:${clamp(b.pct * 3, 0, 100)}%"></div></div>
          <div class="ai-band-pct">${fmt(b.pct, 1)}%</div>
        `;
        bandsEl.appendChild(row);
      });

      const goodsUl = $('#ai-goods'); goodsUl.innerHTML = '';
      v.goods.forEach(g => goodsUl.innerHTML += `<li><b>${g.k}.</b> ${g.s}</li>`);
      if (!v.goods.length) goodsUl.innerHTML = '<li class="muted">—</li>';

      const issUl = $('#ai-issues'); issUl.innerHTML = '';
      v.issues.forEach(g => issUl.innerHTML += `<li><b>${g.k}.</b> ${g.s}</li>`);
      if (!v.issues.length) issUl.innerHTML = '<li class="muted">Чисто.</li>';

      const recUl = $('#ai-recs'); recUl.innerHTML = '';
      v.recs.forEach(g => recUl.innerHTML += `<li>${g}</li>`);
      if (!v.recs.length) recUl.innerHTML = '<li class="muted">Ничего.</li>';
    }

    function renderMixResult(m, blob) {
      const eq = m.eq || {};
      $('#ai-mix-stats').innerHTML = `
        <div class="ai-mix-row"><b>Цель:</b> ${fmt(targetLufs, 1)} LUFS · интенсивность <b>${intensity}</b></div>
        <div class="ai-mix-row"><b>LUFS:</b> ${fmt(m.lufsBefore, 1)} → ${fmt(m.lufsAfter, 1)}</div>
        <div class="ai-mix-row"><b>Make-up:</b> ${m.makeupDb >= 0 ? '+' : ''}${fmt(m.makeupDb, 1)} dB</div>
        <div class="ai-mix-row"><b>EQ:</b> low ${fmt(eq.lowShelf || 0, 1)} dB · mud ${fmt(eq.mud || 0, 1)} dB · presence ${fmt(eq.presence || 0, 1)} dB · air ${fmt(eq.air || 0, 1)} dB</div>
        <div class="ai-mix-row"><b>Comp:</b> threshold ${fmt(m.compThreshold, 1)} dB · ratio ${fmt(m.compRatio, 1)}:1</div>
        <div class="ai-mix-row"><b>Размер:</b> ${(blob.size / 1048576).toFixed(2)} MB</div>
      `;
    }

    function renderLyrics(L) {
      const langLabel = L.language === 'ru' ? '🇷🇺 русский' : (L.language === 'en' ? '🇬🇧 english' : '🌐 ' + L.language);
      $('#ai-lyrics-badges').innerHTML = `
        <span class="ai-badge">${langLabel}</span>
        <span class="ai-badge">${L.wordCount} слов</span>
        <span class="ai-badge">${L.uniqueWords} уник.</span>
        <span class="ai-badge">${fmt(L.vocabDiversity * 100, 0)}% разнообразие</span>
        <span class="ai-badge">${fmt(L.wpm, 0)} слов/мин</span>
        <span class="ai-badge">${L.lineCount} строк · ср. ${fmt(L.avgLineLen, 1)} слов</span>
      `;
      const text = $('#ai-lyrics-text');
      if (L.chunks && L.chunks.length) {
        text.innerHTML = L.chunks.map(c => {
          const t0 = (c.timestamp && typeof c.timestamp[0] === 'number') ? c.timestamp[0] : 0;
          const m = Math.floor(t0 / 60), s = Math.floor(t0 % 60);
          const stamp = `${m}:${s.toString().padStart(2, '0')}`;
          return `<div class="ai-lyrics-line"><span class="ai-lyrics-ts">${stamp}</span><span>${escapeHtml(c.text || '')}</span></div>`;
        }).join('');
      } else {
        text.innerHTML = `<div>${escapeHtml(L.text)}</div>`;
      }
      const repUl = $('#ai-lyrics-repeats'); repUl.innerHTML = '';
      if (L.repeats.length) {
        L.repeats.forEach(r => {
          repUl.innerHTML += `<li><b>×${r.count}</b> ${escapeHtml(r.line)}</li>`;
        });
      } else {
        repUl.innerHTML = '<li class="muted">Повторяющихся строк не нашёл — мало структурного припева.</li>';
      }
    }

    $('#ai-play-orig').addEventListener('click', () => {
      stopPlayer();
      if (!origBlobUrl) return;
      player = new Audio(origBlobUrl);
      player.play();
    });
    $('#ai-play-mix').addEventListener('click', () => {
      stopPlayer();
      if (!mixedBlobUrl) return;
      player = new Audio(mixedBlobUrl);
      player.play();
    });
    function stopPlayer() {
      if (player) { try { player.pause(); } catch (e) {} player = null; }
    }
    $('#ai-download').addEventListener('click', () => {
      if (!mixedBlobUrl) return;
      const a = document.createElement('a');
      a.href = mixedBlobUrl;
      a.download = `${lastFileName}.automix.wav`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    });
  }

  window.TrackAI = { mount, analyzeAudio, autoMix, audioBufferToWavBlob, transcribe, analyzeLyrics };
})();
