/**
 * AURA Application Bootstrap
 * Initializes subsystems, connects backend telemetry, and binds keyboard hotkeys.
 */

document.addEventListener('DOMContentLoaded', () => {
  const video = document.getElementById('bgVideo');
  if (!video) return;

  const ui = new UIController();
  const synth = new AudioSynthesizer('#audioToggleBtn');

  const engine = new VideoScrubEngine(video, {
    lerpFactor: 0.16,
    onProgressUpdate: (currentSec, progressRatio, totalSec) => {
      ui.updateTelemetry(currentSec, progressRatio, totalSec);
    }
  });

  // Direction Toggle Button
  const reverseBtn = document.getElementById('reverseToggleBtn');
  const reverseLabel = document.getElementById('reverseLabel');

  function updateDirectionUI(isReversed) {
    if (reverseLabel) {
      reverseLabel.textContent = isReversed ? 'Direction: Inverted' : 'Direction: Normal';
    }
    if (reverseBtn) {
      reverseBtn.classList.toggle('active', isReversed);
    }
  }

  if (reverseBtn) {
    reverseBtn.addEventListener('click', () => {
      const isReversed = engine.toggleDirection();
      updateDirectionUI(isReversed);
    });
  }

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Ignore hotkeys when typing in input fields
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
      if (e.key === 'Escape') {
        ui.closeModal();
        ui.closeLightbox();
      }
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      engine.togglePlayMode();
    } else if (e.key === 'i' || e.key === 'I') {
      const isReversed = engine.toggleDirection();
      updateDirectionUI(isReversed);
    } else if (e.key === 'm' || e.key === 'M') {
      synth.toggle();
    } else if (e.key === 'r' || e.key === 'R') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (e.key === 'Escape') {
      ui.closeModal();
      ui.closeLightbox();
    }
  });

  // Verify Backend Health & Video Metadata
  fetch('/api/health')
    .then(r => r.json())
    .then(data => {
      console.log('✦ AURA Backend Connected:', data);
    })
    .catch(() => {
      console.warn('Backend API offline (running standalone mode)');
    });

  fetch('/api/video-info')
    .then(r => r.json())
    .then(info => {
      console.log('✦ Video Stream Metadata:', info);
    })
    .catch(() => {});
});
