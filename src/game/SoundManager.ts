class SoundManager {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private _volume: number = 0.3;

  private bgmOscillators: OscillatorNode[] = [];
  private bgmGain: GainNode | null = null;
  private isPlayingBGM = false;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = this._volume;
    this.masterGain.connect(this.audioContext.destination);
  }

  setVolume(value: number) {
    this._volume = Math.max(0, Math.min(1, value));
    this.masterGain.gain.setValueAtTime(this._volume, this.audioContext.currentTime);
  }

  getVolume(): number {
    return this._volume;
  }

  stopAll() {
    this.stopBGM();
    // We can't easily stop all fire/hit sounds as they are fire-and-forget, 
    // but they are short enough to not matter. 
  }

  playBGM() {
    if (this.isPlayingBGM) return;
    this.isPlayingBGM = true;
    this.bgmGain = this.audioContext.createGain();
    this.bgmGain.gain.value = 0.1;
    this.bgmGain.connect(this.masterGain);

    // Simple drone / ambient loop
    const osc1 = this.audioContext.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 55; // A1
    osc1.connect(this.bgmGain);
    osc1.start();
    this.bgmOscillators.push(osc1);

    const osc2 = this.audioContext.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 110; // A2
    osc2.detune.value = 5;
    osc2.connect(this.bgmGain);
    osc2.start();
    this.bgmOscillators.push(osc2);

    // Rhythmic pulse
    const lfo = this.audioContext.createOscillator();
    lfo.type = 'square';
    lfo.frequency.value = 2; // 2 Hz pulse
    const lfoGain = this.audioContext.createGain();
    lfoGain.gain.value = 500;
    
    const filter = this.audioContext.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;
    
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    const noiseBufferSize = this.audioContext.sampleRate * 2;
    const buffer = this.audioContext.createBuffer(1, noiseBufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < noiseBufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = this.audioContext.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    noise.connect(filter);
    filter.connect(this.bgmGain);
    noise.start();
    
    this.bgmOscillators.push(lfo);
    this.bgmOscillators.push(noise as any);
    lfo.start();
  }

  stopBGM() {
    this.isPlayingBGM = false;
    this.bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch(e) {}
      osc.disconnect();
    });
    this.bgmOscillators = [];
    if (this.bgmGain) {
      this.bgmGain.disconnect();
      this.bgmGain = null;
    }
  }

  playShoot(type: 'rifle' | 'smg' | 'sniper') {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;

    if (type === 'rifle') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    } else if (type === 'smg') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.08);
      gain.gain.setValueAtTime(0.8, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'sniper') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(100, now);
      osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.3);
      gain.gain.setValueAtTime(1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  }

  playHit() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playJump() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.linearRampToValueAtTime(400, now + 0.1);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.1);

    osc.start(now);
    osc.stop(now + 0.1);
  }

  playEnemyDeath() {
    const osc = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    const now = this.audioContext.currentTime;
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, now);
    osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.2);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const soundManager = new SoundManager();
