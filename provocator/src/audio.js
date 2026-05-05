// Простой WebAudio синтезатор звуков. Без файлов.

let ctx = null;
let muted = false;

function ac() {
  if (!ctx) {
    try {
      const C = window.AudioContext || window.webkitAudioContext;
      ctx = new C();
    } catch (e) {
      ctx = null;
    }
  }
  return ctx;
}

export function setMuted(v) { muted = !!v; }
export function isMuted() { return muted; }

function tone({ freq = 440, dur = 0.12, type = "sine", vol = 0.18, freqEnd = null, attack = 0.005, release = 0.05, when = 0 }) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const t = c.currentTime + when;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd != null) o.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + attack);
  g.gain.linearRampToValueAtTime(0, t + dur + release);
  o.connect(g).connect(c.destination);
  o.start(t);
  o.stop(t + dur + release + 0.05);
}

function noise({ dur = 0.1, vol = 0.06, when = 0, hp = 800 }) {
  if (muted) return;
  const c = ac();
  if (!c) return;
  if (c.state === "suspended") c.resume();
  const t = c.currentTime + when;
  const len = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = c.createBufferSource();
  src.buffer = buf;
  const filt = c.createBiquadFilter();
  filt.type = "highpass";
  filt.frequency.value = hp;
  const g = c.createGain();
  g.gain.value = vol;
  src.connect(filt).connect(g).connect(c.destination);
  src.start(t);
}

// === Высокоуровневые SFX ===
export const sfx = {
  msgIn() { tone({ freq: 880, freqEnd: 1100, dur: 0.06, type: "sine", vol: 0.08 }); },
  toxic() { tone({ freq: 220, freqEnd: 110, dur: 0.18, type: "sawtooth", vol: 0.13 }); },
  ping() { tone({ freq: 1200, dur: 0.08, type: "triangle", vol: 0.1 }); tone({ freq: 1600, dur: 0.06, type: "triangle", vol: 0.09, when: 0.05 }); },
  complaint() { tone({ freq: 600, freqEnd: 900, dur: 0.12, type: "square", vol: 0.1 }); tone({ freq: 900, freqEnd: 600, dur: 0.12, type: "square", vol: 0.08, when: 0.12 }); },
  ban() { tone({ freq: 220, freqEnd: 60, dur: 0.3, type: "sawtooth", vol: 0.18 }); noise({ dur: 0.12, vol: 0.06 }); },
  delete() { tone({ freq: 550, freqEnd: 200, dur: 0.14, type: "triangle", vol: 0.12 }); },
  warn() { tone({ freq: 440, dur: 0.08, type: "square", vol: 0.1 }); tone({ freq: 660, dur: 0.08, type: "square", vol: 0.1, when: 0.1 }); },
  pin() { tone({ freq: 880, dur: 0.08, type: "triangle", vol: 0.12 }); tone({ freq: 1320, dur: 0.12, type: "triangle", vol: 0.1, when: 0.06 }); },
  shadow() { tone({ freq: 350, freqEnd: 180, dur: 0.18, type: "sine", vol: 0.1 }); tone({ freq: 220, freqEnd: 110, dur: 0.15, type: "sine", vol: 0.08, when: 0.08 }); },
  modpost() { tone({ freq: 440, freqEnd: 880, dur: 0.18, type: "square", vol: 0.12 }); },
  combo(level) { tone({ freq: 600 + level * 80, freqEnd: 1200 + level * 100, dur: 0.1, type: "triangle", vol: 0.1 }); },
  win() {
    [440, 554, 659, 880].forEach((f, i) => tone({ freq: f, dur: 0.18, type: "triangle", vol: 0.13, when: i * 0.12 }));
  },
  lose() {
    [400, 320, 240, 160].forEach((f, i) => tone({ freq: f, dur: 0.22, type: "sawtooth", vol: 0.15, when: i * 0.13 }));
  },
  adminAlert() {
    tone({ freq: 1200, dur: 0.12, type: "sine", vol: 0.14 });
    tone({ freq: 800, dur: 0.12, type: "sine", vol: 0.14, when: 0.18 });
    tone({ freq: 1200, dur: 0.12, type: "sine", vol: 0.14, when: 0.36 });
  },
  raid() {
    noise({ dur: 0.4, vol: 0.08, hp: 200 });
    tone({ freq: 200, freqEnd: 80, dur: 0.4, type: "sawtooth", vol: 0.14 });
  },
  celeb() {
    [660, 880, 1320, 1760].forEach((f, i) => tone({ freq: f, dur: 0.12, type: "triangle", vol: 0.11, when: i * 0.08 }));
  },
  rankS() {
    [523, 659, 783, 1046, 1318].forEach((f, i) => tone({ freq: f, dur: 0.16, type: "triangle", vol: 0.14, when: i * 0.12 }));
  }
};
