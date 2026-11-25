// Dapur Kilat — tiny WebAudio synth: no sound files, every effect is an
// oscillator or a short noise burst made on the spot.
export function createAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, when = 0) {
    const c = ensure();
    if (!c || muted) return;
    const t0 = c.currentTime + when;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function noise(dur, vol) {
    const c = ensure();
    if (!c || muted) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = c.createBufferSource();
    src.buffer = buf;
    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
    src.connect(gain);
    gain.connect(c.destination);
    src.start();
  }

  return {
    unlock() { ensure(); },
    toggleMute() { muted = !muted; return muted; },
    play(event) {
      switch (event) {
        case 'pickup': tone(520, 0.07, 'sine', 0.12); break;
        case 'place': tone(340, 0.07, 'sine', 0.12); break;
        case 'chopDone': noise(0.06, 0.18); tone(700, 0.05, 'square', 0.05); break;
        case 'fryDone': tone(880, 0.08, 'sine', 0.1); tone(1174, 0.1, 'sine', 0.08, 0.07); break;
        case 'serve': tone(660, 0.1, 'sine', 0.14); tone(880, 0.14, 'sine', 0.14, 0.09); tone(1320, 0.18, 'sine', 0.1, 0.18); break;
        case 'reject': tone(160, 0.18, 'sawtooth', 0.1); break;
        case 'expire': tone(220, 0.2, 'sawtooth', 0.12); tone(180, 0.25, 'sawtooth', 0.1, 0.12); break;
        case 'burnt': noise(0.25, 0.15); break;
        case 'levelUp': tone(523, 0.09, 'square', 0.08); tone(659, 0.09, 'square', 0.08, 0.08); tone(784, 0.14, 'square', 0.08, 0.16); break;
        case 'trash': noise(0.08, 0.12); break;
        case 'pickupPlate': tone(440, 0.07, 'sine', 0.12); tone(587, 0.09, 'sine', 0.1, 0.06); break;
        case 'gameOver': tone(330, 0.3, 'sawtooth', 0.1); tone(220, 0.4, 'sawtooth', 0.1, 0.25); break;
        case 'shiftDone': tone(660, 0.12, 'sine', 0.12); tone(880, 0.12, 'sine', 0.12, 0.1); tone(1108, 0.25, 'sine', 0.12, 0.2); break;
        default: break;
      }
    },
  };
}
