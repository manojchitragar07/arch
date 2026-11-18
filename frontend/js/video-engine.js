/**
 * AURA Bidirectional Video Engine
 * Hardware-accelerated scrubbing with watchdog anti-deadlock seek queue.
 */

class VideoScrubEngine {
  constructor(videoElement, options = {}) {
    this.video = videoElement;
    this.onProgressUpdate = options.onProgressUpdate || (() => {});
    this.lerpFactor = options.lerpFactor || 0.16;

    this.isReversed = false;
    this.mode = 'scroll'; // 'scroll' | 'autoplay'
    this.targetProgress = 0;
    this.smoothedProgress = 0;

    this.pendingSeekTime = null;
    this.lastSeekTime = 0;
    this.videoDuration = 10.0;

    this.init();
  }

  init() {
    this.video.pause();
    this.video.muted = true;
    this.video.playsInline = true;

    const onReady = () => {
      if (this.video.duration && !isNaN(this.video.duration) && this.video.duration > 0) {
        this.videoDuration = this.video.duration;
      }
      this.onProgressUpdate(this.video.currentTime, this.smoothedProgress, this.videoDuration);
    };

    this.video.addEventListener('loadedmetadata', onReady);
    this.video.addEventListener('canplay', onReady);
    if (this.video.readyState >= 1) onReady();

    // Scroll listeners
    const handleScroll = () => {
      if (this.mode === 'scroll') {
        this.targetProgress = this.calculateScrollProgress();
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Video Seek Acknowledgement
    this.video.addEventListener('seeked', () => {
      if (this.pendingSeekTime !== null) {
        const nextTime = this.pendingSeekTime;
        this.pendingSeekTime = null;
        this.performSeek(nextTime);
      }
    });

    this.video.addEventListener('error', () => {
      this.pendingSeekTime = null;
    });

    // Start animation loop
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);
    this.targetProgress = this.calculateScrollProgress();
  }

  calculateScrollProgress() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const installationTrack = document.querySelector('.installation-track');
    const trackHeight = installationTrack ? installationTrack.offsetHeight : (window.innerHeight * 3.5);
    if (trackHeight <= 0) return 0;
    return Math.min(Math.max(scrollY / trackHeight, 0), 1);
  }

  performSeek(timeInSeconds) {
    if (!this.videoDuration || isNaN(this.videoDuration)) return;
    const clamped = Math.max(0, Math.min(this.videoDuration - 0.001, timeInSeconds));

    if (Math.abs(this.video.currentTime - clamped) < 0.015) {
      return;
    }

    const now = performance.now();
    // Watchdog: If previous seek took longer than 75ms, force seek
    if (this.video.seeking && (now - this.lastSeekTime < 75)) {
      this.pendingSeekTime = clamped;
      return;
    }

    this.lastSeekTime = now;
    this.video.currentTime = clamped;
  }

  animate() {
    if (this.mode === 'scroll') {
      const delta = this.targetProgress - this.smoothedProgress;
      if (Math.abs(delta) > 0.0001) {
        this.smoothedProgress += delta * this.lerpFactor;
      } else {
        this.smoothedProgress = this.targetProgress;
      }

      const effectiveRatio = this.isReversed ? (1 - this.smoothedProgress) : this.smoothedProgress;
      const targetTime = effectiveRatio * this.videoDuration;

      this.performSeek(targetTime);
      this.onProgressUpdate(this.video.currentTime, this.smoothedProgress, this.videoDuration);
    } else if (this.mode === 'autoplay') {
      const ratio = this.videoDuration ? this.video.currentTime / this.videoDuration : 0;
      const effectiveRatio = this.isReversed ? (1 - ratio) : ratio;
      this.onProgressUpdate(this.video.currentTime, effectiveRatio, this.videoDuration);
    }

    requestAnimationFrame(this.animate);
  }

  toggleDirection() {
    this.isReversed = !this.isReversed;
    return this.isReversed;
  }

  togglePlayMode() {
    if (this.mode === 'scroll') {
      this.mode = 'autoplay';
      this.video.loop = true;
      this.video.play().catch(() => {});
    } else {
      this.mode = 'scroll';
      this.video.pause();
      this.targetProgress = this.calculateScrollProgress();
    }
    return this.mode;
  }
}

window.VideoScrubEngine = VideoScrubEngine;
