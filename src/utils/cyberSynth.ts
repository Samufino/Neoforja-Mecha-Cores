// Cybersynth Audio Engine using Web Audio API
// Native, zero-dependency, retro-futuristic sound rendering.

let audioCtx: AudioContext | null = null;
let isMutedGlobal = false;

// Initialize or resume the AudioContext safely upon user interaction
const getAudioCtx = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (isMutedGlobal) return null;

  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  } catch (err) {
    console.warn("Navegador no soporta Web Audio API o está bloqueado:", err);
    return null;
  }
};

export const setCyberSynthMuted = (muted: boolean) => {
  isMutedGlobal = muted;
  if (localStorage) {
    localStorage.setItem("neoforja_cyber_audio_muted", muted ? "true" : "false");
  }
};

export const getCyberSynthMuted = (): boolean => {
  if (typeof window !== 'undefined' && localStorage) {
    return localStorage.getItem("neoforja_cyber_audio_muted") === "true";
  }
  return false;
};

// 1. CHIRP / CLICK: Elegant digital interface tap
export const playClickSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(1400, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

  gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.06);
};

// 2. ATTACK A SOUND: Digital laser buzz or energy blast customized per character
export const playAttackASound = (character: string = "") => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const charUpper = character.toUpperCase();

  if (charUpper === "AURUM") {
    // 🔔 AURUM Attack A: Imperial Golden Bell / Synthesized Solar Chord
    const frequencies = [523.25, 659.25, 783.99]; // C Major
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.9, ctx.currentTime + 0.35);

      gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.45);
    });
    return;
  }

  if (charUpper === "CY-DRACO") {
    // 🔥 CY-DRACO Attack A: Plasma Torrent / Searing Draconic sawtooth FM swoop
    const osc = ctx.createOscillator();
    const oscFM = ctx.createOscillator();
    const fmGain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.3);

    oscFM.type = 'sine';
    oscFM.frequency.setValueAtTime(35, ctx.currentTime);
    fmGain.gain.setValueAtTime(120, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    oscFM.connect(fmGain);
    fmGain.connect(osc.frequency);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    oscFM.start();
    osc.stop(ctx.currentTime + 0.4);
    oscFM.stop(ctx.currentTime + 0.4);
    return;
  }

  if (charUpper === "MECHA-YUNQUE") {
    // 🔨 MECHA-YUNQUE Attack A: Gravitational Anvil Slam / Massive tech mallet
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(180, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.28);

    sub.type = 'sawtooth';
    sub.frequency.setValueAtTime(90, ctx.currentTime);
    sub.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.14, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(filter);
    sub.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    sub.start();
    osc.stop(ctx.currentTime + 0.4);
    sub.stop(ctx.currentTime + 0.4);
    return;
  }

  if (charUpper === "VOXEL") {
    // 👾 VOXEL Attack A: Stealth Decoupling Matrix / Quantum glitch arpeggio
    const notes = [440.00, 880.00, 587.33, 1174.66];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      const startTime = ctx.currentTime + (i * 0.05);

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(100, startTime + 0.1);

      gainNode.gain.setValueAtTime(0.05, startTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.12);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
    return;
  }

  if (charUpper === "BYTE") {
    // 🛡️ BYTE Attack A: High-pass Silico Barrier / Digital snap pulse
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.06);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
    return;
  }

  if (charUpper === "BIT") {
    // ⚡ BIT Attack A: Hyper-speed Teleport / Retro 8-bit blip chirp
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(1400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime + 0.15);

    gainNode.gain.setValueAtTime(0.04, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);

    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.18);
    return;
  }

  // Generic fallback Attack A
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(880, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.25);

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(440, ctx.currentTime);
  osc2.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.2);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2000, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.25);

  gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

  osc.connect(filter);
  osc2.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc2.start();
  osc.stop(ctx.currentTime + 0.3);
  osc2.stop(ctx.currentTime + 0.3);
};

// 3. ATTACK B SOUND: Heavier shockwave / plasma explosion customized per character
export const playAttackBSound = (character: string = "") => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const charUpper = character.toUpperCase();

  if (charUpper === "AURUM") {
    // 🌟 AURUM Attack B: Solar Singularity / Grand Solar Chorus major sweep
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, ctx.currentTime); // A4
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.45); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, ctx.currentTime); // lower oct
    osc2.frequency.exponentialRampToValueAtTime(554.37, ctx.currentTime + 0.45); // C#5 major chord

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1500, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.45);
    filter.Q.value = 6;

    gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
    return;
  }

  if (charUpper === "CY-DRACO") {
    // 🌋 CY-DRACO Attack B: Thermonuclear Purge / Low sub-bass explosion & crackle
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.5);

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(100, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.5);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.16, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc.connect(filter);
    subOsc.connect(filter);

    const bufferSize = ctx.sampleRate * 0.5;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 450;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.04, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    subOsc.start();
    noise.start();

    osc.stop(ctx.currentTime + 0.6);
    subOsc.stop(ctx.currentTime + 0.6);
    noise.stop(ctx.currentTime + 0.6);
    return;
  }

  if (charUpper === "MECHA-YUNQUE") {
    // 🔩 MECHA-YUNQUE Attack B: Repercussion Shockwave / Dual metallic hammer anvil impact
    const osc = ctx.createOscillator();
    const oscAnvil = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(20, ctx.currentTime + 0.5);

    oscAnvil.type = 'square';
    oscAnvil.frequency.setValueAtTime(400, ctx.currentTime);
    oscAnvil.frequency.setValueAtTime(120, ctx.currentTime + 0.1);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(50, ctx.currentTime + 0.5);
    filter.Q.value = 5;

    gainNode.gain.setValueAtTime(0.16, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

    osc.connect(filter);
    oscAnvil.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    oscAnvil.start();
    osc.stop(ctx.currentTime + 0.6);
    oscAnvil.stop(ctx.currentTime + 0.6);
    return;
  }

  if (charUpper === "VOXEL" || charUpper === "MECHA_YUNQUE") {
    // 💻 VOXEL Attack B: Pixels Decorrelation / Modular phase-scrambled signal
    const osc = ctx.createOscillator();
    const modularOsc = ctx.createOscillator();
    const modGain = ctx.createGain();
    const gainNode = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.45);

    modularOsc.type = 'sine';
    modularOsc.frequency.setValueAtTime(80, ctx.currentTime);
    modGain.gain.setValueAtTime(400, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.06, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    modularOsc.connect(modGain);
    modGain.connect(osc.frequency);
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    modularOsc.start();
    osc.stop(ctx.currentTime + 0.5);
    modularOsc.stop(ctx.currentTime + 0.5);
    return;
  }

  if (charUpper === "BYTE") {
    // 📡 BYTE Attack B: Cyber Firewall Deflect / Resonant bandpass sweep build-up
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.4);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(300, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(2500, ctx.currentTime + 0.4);
    filter.Q.value = 8;

    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.45);
    return;
  }

  if (charUpper === "BIT") {
    // 🛸 BIT Attack B: Portal Warp Blitz / Sci-fi frequency laser sweep arpeggios
    const notes = [600, 1200, 1000, 2000, 1800, 3600];
    notes.forEach((freq, idx) => {
      const time = ctx.currentTime + (idx * 0.04);
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.3, time + 0.08);

      gainNode.gain.setValueAtTime(0.03, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + 0.1);
    });
    return;
  }

  // Fallback Attack B
  const osc = ctx.createOscillator();
  const subOsc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(45, ctx.currentTime + 0.45);

  subOsc.type = 'triangle';
  subOsc.frequency.setValueAtTime(120, ctx.currentTime);
  subOsc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.45);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(1200, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.45);

  gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

  osc.connect(filter);
  subOsc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  subOsc.start();
  osc.stop(ctx.currentTime + 0.5);
  subOsc.stop(ctx.currentTime + 0.5);
};

// 4. LEVEL UP CHIME: Ascending synthesized major pentatonic scale
export const playLevelUpSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 659.25, 783.99, 1046.50]; // Beautiful sweeping scale notes
  const noteDuration = 0.08;
  const totalDuration = notes.length * noteDuration + 0.3;

  notes.forEach((freq, idx) => {
    const time = ctx.currentTime + idx * noteDuration;
    
    // Smooth synth bell oscillator
    const osc = ctx.createOscillator();
    const subOsc = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);

    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(freq * 1.5, time); // Harmony interval

    gainNode.gain.setValueAtTime(0.0, time);
    gainNode.gain.linearRampToValueAtTime(0.08, time + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.3);

    osc.connect(gainNode);
    subOsc.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(time);
    subOsc.start(time);
    osc.stop(time + 0.35);
    subOsc.stop(time + 0.35);
  });
};

// 5. ERROR / WARNING: Cybernetic threat alarm
export const playErrorSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(120, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(100, ctx.currentTime + 0.3);

  osc2.type = 'square';
  osc2.frequency.setValueAtTime(123, ctx.currentTime); // Beat frequency for nasty grating buzz
  osc2.frequency.linearRampToValueAtTime(103, ctx.currentTime + 0.3);

  gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.15);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

  osc.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc2.start();
  
  osc.stop(ctx.currentTime + 0.4);
  osc2.stop(ctx.currentTime + 0.4);
};

// 6. SYNC / NFC CLAIM SUCCESS: Dual-tone ascending synth pulse
export const playSyncSuccessSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'triangle';

  osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
  osc1.frequency.setValueAtTime(783.99, ctx.currentTime + 0.12); // G5
  osc1.frequency.exponentialRampToValueAtTime(1318.51, ctx.currentTime + 0.32); // E6

  osc2.frequency.setValueAtTime(261.63, ctx.currentTime); // C4
  osc2.frequency.setValueAtTime(392.00, ctx.currentTime + 0.12); // G4
  osc2.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.32); // E5

  gainNode.gain.setValueAtTime(0.0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.09, ctx.currentTime + 0.05);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

  osc1.connect(gainNode);
  osc2.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc1.start();
  osc2.start();

  osc1.stop(ctx.currentTime + 0.5);
  osc2.stop(ctx.currentTime + 0.5);
};

// 7. RECYCLE / DISSOLVE AUDIO: Digital fizzing dissolution
export const playRecycleSound = () => {
  const ctx = getAudioCtx();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(900, ctx.currentTime);
  osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.5);

  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1500, ctx.currentTime);
  filter.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + 0.5);
  filter.Q.setValueAtTime(10, ctx.currentTime);

  gainNode.gain.setValueAtTime(0.14, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.2);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.55);

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.6);
};
