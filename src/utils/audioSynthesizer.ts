// Web Audio API Ambient Sound Synthesizer for Lo-Fi & Study Atmospheres
class AmbientSoundEngine {
  private audioCtx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private currentType: string = 'lofi-beats';
  private gainNode: GainNode | null = null;
  private loopInterval: number | null = null;
  private rainNode: AudioNode | null = null;
  private volume: number = 0.6;

  private initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      this.gainNode = this.audioCtx.createGain();
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
      this.gainNode.connect(this.audioCtx.destination);
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.gainNode && this.audioCtx) {
      this.gainNode.gain.setValueAtTime(this.volume, this.audioCtx.currentTime);
    }
  }

  public play(type: 'lofi-beats' | 'rain-cafe' | 'ambient-zen' | 'piano-chill') {
    this.initContext();
    this.stop();
    this.isPlaying = true;
    this.currentType = type;

    if (type === 'rain-cafe') {
      this.startRainAtmosphere();
    } else if (type === 'ambient-zen') {
      this.startZenDrone();
    } else if (type === 'piano-chill') {
      this.startPianoMelody();
    } else {
      this.startLoFiChords();
    }
  }

  public stop() {
    this.isPlaying = false;
    if (this.loopInterval) {
      window.clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    if (this.rainNode) {
      try {
        (this.rainNode as AudioBufferSourceNode).stop();
        this.rainNode.disconnect();
      } catch {
        // ignored
      }
      this.rainNode = null;
    }
  }

  public playChime(type: 'start' | 'success' | 'delete' | 'notification') {
    this.initContext();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    if (type === 'start') {
      // Gentle ascending 2-tone chime for microphone activation
      this.playTone(440, now, 0.25, 'sine', 0.6);
      this.playTone(554.37, now + 0.1, 0.35, 'sine', 0.7);
    } else if (type === 'success') {
      // Cheerful 3-tone triumph chord for exam/note added
      this.playTone(523.25, now, 0.25, 'sine', 0.6);
      this.playTone(659.25, now + 0.1, 0.25, 'sine', 0.6);
      this.playTone(783.99, now + 0.2, 0.45, 'triangle', 0.8);
    } else if (type === 'notification') {
      this.playTone(587.33, now, 0.2, 'sine', 0.5);
      this.playTone(880.00, now + 0.1, 0.3, 'sine', 0.6);
    } else {
      this.playTone(330, now, 0.2, 'triangle', 0.5);
      this.playTone(220, now + 0.1, 0.3, 'sine', 0.5);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  private playTone(freq: number, startTime: number, duration: number, type: OscillatorType = 'sine', decay: number = 0.8) {
    if (!this.audioCtx || !this.gainNode) return;
    try {
      const osc = this.audioCtx.createOscillator();
      const noteGain = this.audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      // Smooth attack and soft decay
      noteGain.gain.setValueAtTime(0.001, startTime);
      noteGain.gain.exponentialRampToValueAtTime(0.2, startTime + 0.08);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration * decay);

      osc.connect(noteGain);
      noteGain.connect(this.gainNode);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch {
      // Audio context might be closed
    }
  }

  private startLoFiChords() {
    if (!this.audioCtx) return;
    // Nostalgic Lo-Fi progression: Dm9 -> G13 -> Cmaj9 -> Am7
    const chords = [
      [293.66, 349.23, 440.00, 523.25, 659.25], // Dm9
      [196.00, 246.94, 329.63, 392.00, 523.25], // G13
      [261.63, 329.63, 392.00, 493.88, 587.33], // Cmaj9
      [220.00, 261.63, 329.63, 392.00, 440.00], // Am7
    ];

    let chordIndex = 0;
    const playChordStep = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const currentChord = chords[chordIndex % chords.length];

      // Arpeggiate slightly for cozy lo-fi feel
      currentChord.forEach((freq, i) => {
        this.playTone(freq, now + i * 0.04, 3.2, 'triangle', 0.9);
      });

      // Add gentle sub-bass note
      this.playTone(currentChord[0] / 2, now, 3.0, 'sine', 0.9);

      chordIndex++;
    };

    playChordStep();
    this.loopInterval = window.setInterval(playChordStep, 3500);
  }

  private startPianoMelody() {
    if (!this.audioCtx) return;
    const notes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25]; // Pentatonic calm

    const playMelodyStep = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      const randomNote = notes[Math.floor(Math.random() * notes.length)];
      const randomHarmony = notes[Math.floor(Math.random() * notes.length)];

      this.playTone(randomNote, now, 2.5, 'sine', 0.85);
      if (Math.random() > 0.4) {
        this.playTone(randomHarmony, now + 0.3, 2.2, 'triangle', 0.85);
      }
    };

    playMelodyStep();
    this.loopInterval = window.setInterval(playMelodyStep, 1800);
  }

  private startZenDrone() {
    if (!this.audioCtx) return;
    const bowlFreqs = [216, 432, 540, 648]; // 432Hz tuning zen meditation

    const playZen = () => {
      if (!this.isPlaying || !this.audioCtx) return;
      const now = this.audioCtx.currentTime;
      bowlFreqs.forEach((f, idx) => {
        this.playTone(f, now + idx * 0.2, 5.0, 'sine', 0.95);
      });
    };

    playZen();
    this.loopInterval = window.setInterval(playZen, 5200);
  }

  private startRainAtmosphere() {
    if (!this.audioCtx || !this.gainNode) return;
    try {
      const bufferSize = this.audioCtx.sampleRate * 3;
      const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
      const data = buffer.getChannelData(0);

      // Pink noise synthesis for gentle soothing rain
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
        b6 = white * 0.115926;
      }

      const noise = this.audioCtx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      // Lowpass filter to muffle rain like through a window
      const filter = this.audioCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 800;

      noise.connect(filter);
      filter.connect(this.gainNode);
      noise.start(0);
      this.rainNode = noise;
    } catch {
      // fallback
    }
  }
}

export const soundEngine = new AmbientSoundEngine();
