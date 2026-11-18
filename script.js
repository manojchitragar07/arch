/**
 * AURA // BIDIRECTIONAL SCROLL-DRIVEN VIDEO ENGINE
 * Supports silky-smooth forward AND reverse scrolling.
 * Hardware-accelerated with native seeking and watchdog anti-deadlock queue.
 */

(function () {
  'use strict';

  // --- Elements ---
  const video = document.getElementById('bgVideo');
  const progressBar = document.getElementById('progressBar');
  const hudTime = document.getElementById('hudTime');
  const hudPercent = document.getElementById('hudPercent');
  const reverseToggleBtn = document.getElementById('reverseToggleBtn');
  const reverseLabel = document.getElementById('reverseLabel');
  const audioToggleBtn = document.getElementById('audioToggleBtn');

  const cap0 = document.getElementById('cap0');
  const cap1 = document.getElementById('cap1');
  const cap2 = document.getElementById('cap2');
  const cap3 = document.getElementById('cap3');

  // --- State ---
  let isReversed = false; // Default: normal direction (scroll down moves 0 -> 10s)
  let mode = 'scroll';    // 'scroll' | 'autoplay'
  let targetProgress = 0;
  let smoothedProgress = 0;
  const LERP_FACTOR = 0.16; // Responsive and smooth interpolation

  let pendingSeekTime = null;
  let lastSeekTime = 0;
  let videoDuration = 10.0;

  // --- Video Initialization ---
  video.pause();
  video.muted = true;
  video.playsInline = true;

  function onVideoReady() {
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      videoDuration = video.duration;
    }
    updateTelemetry(video.currentTime, smoothedProgress);
  }

  video.addEventListener('loadedmetadata', onVideoReady);
  video.addEventListener('canplay', onVideoReady);

  if (video.readyState >= 1) {
    onVideoReady();
  }

  // --- Scroll Calculation (Bidirectional) ---
  function calculateScrollProgress() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const maxScroll = (document.documentElement.scrollHeight || document.body.scrollHeight) - window.innerHeight;
    if (maxScroll <= 0) return 0;
    return Math.min(Math.max(scrollY / maxScroll, 0), 1);
  }

  function onScroll() {
    if (mode === 'scroll') {
      targetProgress = calculateScrollProgress();
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  // --- Bidirectional Seeking Engine (Zero Stutter, No FastSeek Keyframe Snapping) ---
  function performSeek(timeInSeconds) {
    if (!videoDuration || isNaN(videoDuration)) return;
    const clampedTime = Math.max(0, Math.min(videoDuration - 0.001, timeInSeconds));

    // Sub-frame delta threshold (~0.015s is half a frame at 30fps)
    if (Math.abs(video.currentTime - clampedTime) < 0.015) {
      return;
    }

    const now = performance.now();
    // If the hardware decoder is currently seeking, queue the newest position
    // Watchdog: If seek takes longer than 75ms, bypass lock to prevent any freeze
    if (video.seeking && (now - lastSeekTime < 75)) {
      pendingSeekTime = clampedTime;
      return;
    }

    lastSeekTime = now;
    video.currentTime = clampedTime;
  }

  video.addEventListener('seeked', () => {
    if (pendingSeekTime !== null) {
      const next = pendingSeekTime;
      pendingSeekTime = null;
      performSeek(next);
    }
  });

  video.addEventListener('error', () => {
    pendingSeekTime = null;
  });

  // --- Telemetry & Captions ---
  function formatTime(seconds) {
    if (isNaN(seconds)) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }

  function updateCaptions(p) {
    if (p < 0.22) {
      setActiveCaption(cap0);
    } else if (p >= 0.22 && p < 0.52) {
      setActiveCaption(cap1);
    } else if (p >= 0.52 && p < 0.80) {
      setActiveCaption(cap2);
    } else {
      setActiveCaption(cap3);
    }
  }

  function setActiveCaption(activeEl) {
    [cap0, cap1, cap2, cap3].forEach(el => {
      if (!el) return;
      if (el === activeEl) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });
  }

  function updateTelemetry(currentSec, progressRatio) {
    const percent = Math.round(progressRatio * 100);
    if (progressBar) {
      progressBar.style.width = `${percent}%`;
    }
    if (hudPercent) {
      hudPercent.textContent = `${percent}%`;
    }
    if (hudTime) {
      hudTime.textContent = `${formatTime(currentSec)} / ${formatTime(videoDuration)}`;
    }
    updateCaptions(progressRatio);
  }

  // --- Animation Loop (Supports forward down-scroll and backward up-scroll) ---
  function animationLoop() {
    if (mode === 'scroll') {
      const delta = targetProgress - smoothedProgress;
      if (Math.abs(delta) > 0.0001) {
        smoothedProgress += delta * LERP_FACTOR;
      } else {
        smoothedProgress = targetProgress;
      }

      // Compute playback position taking direction into account
      const effectiveRatio = isReversed ? (1 - smoothedProgress) : smoothedProgress;
      const targetTime = effectiveRatio * videoDuration;

      performSeek(targetTime);
      updateTelemetry(video.currentTime, smoothedProgress);
    } else if (mode === 'autoplay') {
      const ratio = video.duration ? video.currentTime / video.duration : 0;
      const effectiveRatio = isReversed ? (1 - ratio) : ratio;
      updateTelemetry(video.currentTime, effectiveRatio);
    }

    requestAnimationFrame(animationLoop);
  }

  requestAnimationFrame(animationLoop);

  // --- Direction Toggle ---
  function toggleDirection() {
    isReversed = !isReversed;
    if (reverseLabel) {
      reverseLabel.textContent = isReversed ? 'Direction: Inverted' : 'Direction: Normal';
    }
    if (reverseToggleBtn) {
      reverseToggleBtn.classList.toggle('active', isReversed);
    }
  }

  if (reverseToggleBtn) {
    reverseToggleBtn.addEventListener('click', toggleDirection);
  }

  // --- Ambient Web Audio Synthesizer ---
  let audioCtx = null;
  let isAudioPlaying = false;
  let ambientOscs = [];
  let masterGain = null;

  function initAmbientAudio() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    audioCtx = new AudioContextClass();

    masterGain = audioCtx.createGain();
    masterGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
    masterGain.connect(audioCtx.destination);

    const baseFreqs = [87.31, 130.81, 174.61, 220.00, 261.63];

    baseFreqs.forEach((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      const filter = audioCtx.createBiquadFilter();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      osc.detune.setValueAtTime((Math.random() - 0.5) * 10, audioCtx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(420 + idx * 70, audioCtx.currentTime);

      oscGain.gain.setValueAtTime(0.07 / (idx + 1), audioCtx.currentTime);

      osc.connect(filter);
      filter.connect(oscGain);
      oscGain.connect(masterGain);

      osc.start();
      ambientOscs.push(osc);
    });
  }

  function toggleAudio() {
    if (!audioCtx) initAmbientAudio();
    if (!audioCtx) return;

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    isAudioPlaying = !isAudioPlaying;
    if (isAudioPlaying) {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setTargetAtTime(0.3, audioCtx.currentTime, 1.2);
      audioToggleBtn.classList.add('active');
      audioToggleBtn.querySelector('.btn-text').textContent = 'Sound: On';
    } else {
      masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
      masterGain.gain.setTargetAtTime(0.0001, audioCtx.currentTime, 0.8);
      audioToggleBtn.classList.remove('active');
      audioToggleBtn.querySelector('.btn-text').textContent = 'Sound: Off';
    }
  }

  if (audioToggleBtn) {
    audioToggleBtn.addEventListener('click', toggleAudio);
  }

  // --- Keyboard Shortcuts ---
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (mode === 'scroll') {
        mode = 'autoplay';
        video.loop = true;
        video.play().catch(() => {});
      } else {
        mode = 'scroll';
        video.pause();
        targetProgress = calculateScrollProgress();
      }
    } else if (e.key === 'i' || e.key === 'I') {
      toggleDirection();
    } else if (e.key === 'm' || e.key === 'M') {
      toggleAudio();
    } else if (e.key === 'r' || e.key === 'R') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Initial Calculation
  targetProgress = calculateScrollProgress();
})();
