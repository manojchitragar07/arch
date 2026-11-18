/**
 * AURA Audio Synthesizer Module
 * Generates an atmospheric ambient soundscape using Web Audio API.
 */

class AudioSynthesizer {
  constructor(toggleButtonSelector) {
    this.button = document.querySelector(toggleButtonSelector);
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.oscillators = [];

    if (this.button) {
      this.button.addEventListener('click', () => this.toggle());
    }
  }

  init() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Celestial chord frequencies (F minor 9th / ambient horizon)
    const baseFreqs = [87.31, 130.81, 174.61, 220.00, 261.63];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420 + idx * 70, this.ctx.currentTime);

      oscGain.gain.setValueAtTime(0.07 / (idx + 1), this.ctx.currentTime);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(this.masterGain);

      osc.start();
      this.oscillators.push(osc);
    });
  }

  toggle() {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = !this.isPlaying;
    const now = this.ctx.currentTime;

    if (this.isPlaying) {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.3, now, 1.2);
      if (this.button) {
        this.button.classList.add('active');
        const text = this.button.querySelector('.btn-text');
        if (text) text.textContent = 'Sound: On';
      }
    } else {
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(0.0001, now, 0.8);
      if (this.button) {
        this.button.classList.remove('active');
        const text = this.button.querySelector('.btn-text');
        if (text) text.textContent = 'Sound: Off';
      }
    }
  }
}

window.AudioSynthesizer = AudioSynthesizer;
