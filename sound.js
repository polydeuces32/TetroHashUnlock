class TetroHashSoundEngine {
  constructor() {
    this.audioContext = null;
    this.enabled = false;
  }

  boot() {
    if (this.audioContext) return;

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    try {
      this.audioContext = new AudioContext();
      this.enabled = true;
    } catch {
      this.enabled = false;
    }
  }

  tone(frequency, duration = 0.08, type = "square", gainValue = 0.035) {
    if (!this.enabled || !this.audioContext) return;

    const oscillator = this.audioContext.createOscillator();
    const gain = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(gainValue, this.audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0001,
      this.audioContext.currentTime + duration
    );

    oscillator.connect(gain);
    gain.connect(this.audioContext.destination);

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  move() {
    this.tone(220, 0.04, "square", 0.018);
  }

  rotate() {
    this.tone(330, 0.05, "triangle", 0.025);
  }

  drop() {
    this.tone(130, 0.06, "sawtooth", 0.025);
  }

  lock() {
    this.tone(90, 0.08, "square", 0.03);
  }

  clear() {
    this.tone(440, 0.08, "triangle", 0.035);
    setTimeout(() => this.tone(660, 0.08, "triangle", 0.035), 70);
    setTimeout(() => this.tone(880, 0.1, "triangle", 0.035), 140);
  }

  mine() {
    this.tone(520, 0.035, "square", 0.018);
  }

  validBlock() {
    this.tone(392, 0.1, "triangle", 0.04);
    setTimeout(() => this.tone(523, 0.1, "triangle", 0.04), 90);
    setTimeout(() => this.tone(784, 0.16, "triangle", 0.04), 180);
  }

  fail() {
    this.tone(80, 0.14, "sawtooth", 0.035);
  }

  levelUp() {
    this.tone(600, 0.08, "triangle", 0.04);
    setTimeout(() => this.tone(760, 0.08, "triangle", 0.04), 90);
    setTimeout(() => this.tone(980, 0.14, "triangle", 0.04), 180);
  }
}

window.TetroHashSoundEngine = TetroHashSoundEngine;
