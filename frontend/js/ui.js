/**
 * PALAIS DE L'AURA // UI Coordinator & Gallery Exhibition Manager
 * Coordinates floating installation captions, collection filtering, high-resolution artwork inspection,
 * and collector concierge acquisitions.
 */

class UIController {
  constructor() {
    this.progressBar = document.getElementById('progressBar');
    this.hudTime = document.getElementById('hudTime');
    this.hudPercent = document.getElementById('hudPercent');
    this.minimalHud = document.getElementById('minimalHud');
    this.captionsWrapper = document.getElementById('captionsWrapper');
    this.captions = [
      document.getElementById('cap0'),
      document.getElementById('cap1'),
      document.getElementById('cap2'),
      document.getElementById('cap3')
    ];

    this.artworksGrid = document.getElementById('artworksGrid');
    this.filterTabs = document.querySelectorAll('.filter-tab');

    // Collector Inquiry Modal
    this.modalOverlay = document.getElementById('inquiryModal');
    this.closeModalBtn = document.getElementById('closeModalBtn');
    this.inquiryForm = document.getElementById('inquiryForm');
    this.modalFeedback = document.getElementById('modalFeedback');
    this.modalArtworkSelect = document.getElementById('modalArtwork');

    // Artwork Lightbox Modal
    this.lightboxOverlay = document.getElementById('artworkLightbox');
    this.lightboxCloseBtn = document.getElementById('closeLightboxBtn');

    this.artworksData = [];
    this.bindEvents();
    this.loadArtworks('all');
  }

  bindEvents() {
    // Open Acquisition Modal
    document.addEventListener('click', (e) => {
      const openBtn = e.target.closest('.open-modal-btn');
      if (openBtn) {
        e.preventDefault();
        const artworkName = openBtn.getAttribute('data-artwork');
        if (artworkName && this.modalArtworkSelect) {
          this.modalArtworkSelect.value = artworkName;
        }
        this.openModal();
      }
    });

    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.closeModal());
    }

    if (this.modalOverlay) {
      this.modalOverlay.addEventListener('click', (e) => {
        if (e.target === this.modalOverlay) this.closeModal();
      });
    }

    if (this.inquiryForm) {
      this.inquiryForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    // Lightbox Close
    if (this.lightboxCloseBtn) {
      this.lightboxCloseBtn.addEventListener('click', () => this.closeLightbox());
    }
    if (this.lightboxOverlay) {
      this.lightboxOverlay.addEventListener('click', (e) => {
        if (e.target === this.lightboxOverlay) this.closeLightbox();
      });
    }

    // Inspect Artwork Frame Click
    document.addEventListener('click', (e) => {
      const frame = e.target.closest('.artwork-frame');
      if (frame) {
        const id = frame.getAttribute('data-art-id');
        const item = this.artworksData.find(a => a.id === id);
        if (item) this.openLightbox(item);
      }
    });

    // Filter Tabs
    this.filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        this.filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const cat = tab.getAttribute('data-category');
        this.loadArtworks(cat);
      });
    });
  }

  async loadArtworks(category = 'all') {
    if (!this.artworksGrid) return;
    this.artworksGrid.innerHTML = '<div style="color: #d4af37; font-family: monospace; grid-column: 1/-1; text-align: center; padding: 2.5rem;">Accessing Palais de l\'AURA Curatorial Vault...</div>';

    try {
      const url = category === 'all' ? '/api/artworks' : `/api/artworks?category=${encodeURIComponent(category)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to load catalog');
      const data = await res.json();
      this.artworksData = data;
      this.renderArtworks(data);
    } catch (err) {
      console.warn('API error, using local fallback:', err);
      this.renderFallbackArtworks(category);
    }
  }

  renderArtworks(artworks) {
    if (!this.artworksGrid) return;
    if (!artworks || artworks.length === 0) {
      this.artworksGrid.innerHTML = '<div style="color: #888; grid-column: 1/-1; text-align: center; padding: 2.5rem;">No masterworks currently listed in this category.</div>';
      return;
    }

    this.artworksGrid.innerHTML = artworks.map(art => `
      <article class="artwork-card">
        <!-- Picture Frame with Zoom Feature -->
        <div class="artwork-frame" data-art-id="${art.id}" title="Click to inspect brushwork and high-resolution details">
          <img src="${art.image}" alt="${art.title}" class="artwork-img" loading="lazy">
          <div class="artwork-frame-overlay">
            <span class="zoom-hint">🔍 Inspect Masterwork</span>
          </div>
        </div>

        <div class="artwork-cat-badge">${art.id} // ${art.category}</div>
        <h3 class="artwork-title">${art.title}</h3>
        <div class="artwork-artist">${art.artist} (${art.year})</div>
        
        <div class="artwork-meta-list">
          <div class="artwork-meta-row">
            <span class="meta-label">Medium</span>
            <span class="meta-value">${art.medium}</span>
          </div>
          <div class="artwork-meta-row">
            <span class="meta-label">Dimensions</span>
            <span class="meta-value">${art.dimensions}</span>
          </div>
          <div class="artwork-meta-row">
            <span class="meta-label">Location</span>
            <span class="meta-value">${art.room}</span>
          </div>
        </div>

        <p class="artwork-desc">${art.description}</p>

        <div class="artwork-footer">
          <div class="artwork-status">${art.status}</div>
          <button class="acquire-link open-modal-btn" data-artwork="${art.title} (${art.artist})">
            Acquire / Inquire →
          </button>
        </div>
      </article>
    `).join('');
  }

  renderFallbackArtworks(category) {
    const fallbackList = [
      {
        id: "CAT-01",
        title: "Symphonie Florale en Vase de Bronze",
        artist: "Willem van Aelst Circle",
        year: "c. 1675",
        medium: "Oil on Fine Belgian Linen",
        dimensions: "98 × 72 cm",
        category: "Classical Still Life",
        room: "Salon des Fleurs",
        image: "assets/artworks/bouquet-in-urn.jpg",
        description: "A luxuriant composition of blooming peonies, yellow cabbage roses, and dropped blossoms resting on a marble ledge draped with fine lace.",
        status: "Available for Acquisition"
      },
      {
        id: "CAT-02",
        title: "Allegory of Transience with White Peacock",
        artist: "Giulia Valente",
        year: "2021",
        medium: "Archival Pigment on Heavy Cotton & Oil Glazes",
        dimensions: "120 × 90 cm",
        category: "Allegory & Vanitas",
        room: "Nocturne Salon",
        image: "assets/artworks/white-peacock-vanitas.jpg",
        description: "An albino white peacock perches above ancient folios and a memento mori skull resting on rich crimson velvet.",
        status: "On Exhibition"
      },
      {
        id: "CAT-03",
        title: "Le Banquet au Cacatoès Blanc",
        artist: "Frans Snyders Circle",
        year: "c. 1650",
        medium: "Oil on Cradled Oak Panel",
        dimensions: "112 × 88 cm",
        category: "Classical Still Life",
        room: "Dutch Golden Age Hall",
        image: "assets/artworks/cockatoo-feast.jpg",
        description: "An exotic sulphur-crested cockatoo oversees an opulent table laden with grapes, pears, peaches, and ruby wine.",
        status: "Permanent Collection"
      },
      {
        id: "CAT-04",
        title: "Sentinel of the Autumn Wind",
        artist: "Maren Lindström",
        year: "2023",
        medium: "Impasto Oil & Palette Knife",
        dimensions: "80 × 60 cm",
        category: "Atmospheric Landscape",
        room: "Maritime Gallery",
        image: "assets/artworks/solitary-lighthouse.jpg",
        description: "Heavy textural knife impasto captures the solitary vigilance of a stone beacon perched atop windswept dunes.",
        status: "Available for Acquisition"
      },
      {
        id: "CAT-05",
        title: "Alpine Pastoral with Village Chapel",
        artist: "Austrian Romanticist School",
        year: "c. 1880",
        medium: "Oil on Canvas",
        dimensions: "104 × 82 cm",
        category: "Atmospheric Landscape",
        room: "Romantic Landscape Pavilion",
        image: "assets/artworks/pastoral-alpine-village.jpg",
        description: "A bucolic idyllic sanctuary nestled in alpine foothills, featuring a whitewashed chapel tower and rustic timber chalets.",
        status: "Available for Acquisition"
      },
      {
        id: "CAT-06",
        title: "Still Life with Burst Pomegranates & Venetian Glass",
        artist: "Jan Davidsz. de Heem Studio",
        year: "c. 1668",
        medium: "Oil on Fine Canvas",
        dimensions: "92 × 74 cm",
        category: "Classical Still Life",
        room: "Grand Banquet Hall",
        image: "assets/artworks/pomegranate-harvest.jpg",
        description: "A sumptuous banquet displaying ruby-seeded burst pomegranates and emerald grapes held in a faceted Venetian glass goblet.",
        status: "Available for Acquisition"
      }
    ];

    const filtered = category === 'all' 
      ? fallbackList 
      : fallbackList.filter(a => a.category.toLowerCase() === category.toLowerCase());

    this.artworksData = fallbackList;
    this.renderArtworks(filtered);
  }

  openLightbox(art) {
    if (!this.lightboxOverlay) return;
    const mediaEl = document.getElementById('lightboxMedia');
    const tagEl = document.getElementById('lightboxTag');
    const titleEl = document.getElementById('lightboxTitle');
    const artistEl = document.getElementById('lightboxArtist');
    const descEl = document.getElementById('lightboxDesc');
    const specsEl = document.getElementById('lightboxSpecs');
    const acquireBtn = document.getElementById('lightboxAcquireBtn');

    if (mediaEl) {
      mediaEl.innerHTML = `<img src="${art.image}" alt="${art.title}">`;
    }
    if (tagEl) tagEl.textContent = `${art.id} // ${art.category}`;
    if (titleEl) titleEl.textContent = art.title;
    if (artistEl) artistEl.textContent = `${art.artist} (${art.year})`;
    if (descEl) descEl.textContent = art.description;

    if (specsEl) {
      specsEl.innerHTML = `
        <div class="lightbox-specs-row"><span>Medium</span><span>${art.medium}</span></div>
        <div class="lightbox-specs-row"><span>Dimensions</span><span>${art.dimensions}</span></div>
        <div class="lightbox-specs-row"><span>Gallery Location</span><span>${art.room}</span></div>
        <div class="lightbox-specs-row"><span>Acquisition Price</span><span>${art.price || 'Upon Request'}</span></div>
      `;
    }

    if (acquireBtn) {
      acquireBtn.setAttribute('data-artwork', `${art.title} (${art.artist})`);
    }

    this.lightboxOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  closeLightbox() {
    if (this.lightboxOverlay) {
      this.lightboxOverlay.classList.remove('open');
      if (!this.modalOverlay || !this.modalOverlay.classList.contains('open')) {
        document.body.style.overflow = '';
      }
    }
  }

  openModal() {
    this.closeLightbox();
    if (this.modalOverlay) {
      this.modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    if (this.modalOverlay) {
      this.modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  async handleFormSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('modalName').value.trim();
    const email = document.getElementById('modalEmail').value.trim();
    const artwork = document.getElementById('modalArtwork').value;
    const city = document.getElementById('modalCity').value;
    const submitBtn = document.getElementById('submitModalBtn');

    if (!name || !email) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Encrypting & Dispatching Request...';

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, artwork, city })
      });

      const data = await response.json();
      if (data.success) {
        if (this.modalFeedback) {
          this.modalFeedback.innerHTML = `<strong>✓ Request Received</strong><br>${data.message}<br><small style="color:#d4af37">Registration Ref: ${data.inquiry_id}</small>`;
          this.modalFeedback.classList.add('visible');
        }
        submitBtn.textContent = 'Dossier Registered';
        setTimeout(() => {
          this.closeModal();
          this.inquiryForm.reset();
          submitBtn.disabled = false;
          submitBtn.textContent = 'Request Confidential Dossier →';
          if (this.modalFeedback) this.modalFeedback.classList.remove('visible');
        }, 3000);
      } else {
        throw new Error(data.error || 'Submission failed');
      }
    } catch (err) {
      alert(`Concierge error: ${err.message}`);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Request Confidential Dossier →';
    }
  }

  formatTime(seconds) {
    if (isNaN(seconds)) seconds = 0;
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}.${String(ms).padStart(2, '0')}`;
  }

  updateTelemetry(currentSec, progressRatio, totalSec) {
    const percent = Math.round(progressRatio * 100);
    if (this.progressBar) {
      this.progressBar.style.width = `${percent}%`;
    }
    if (this.hudPercent) {
      this.hudPercent.textContent = `${percent}%`;
    }
    if (this.hudTime) {
      this.hudTime.textContent = `${this.formatTime(currentSec)} / ${this.formatTime(totalSec)}`;
    }
    this.updateCaptions(progressRatio);

    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const installationTrack = document.querySelector('.installation-track');
    if (installationTrack) {
      const trackHeight = installationTrack.offsetHeight;
      if (scrollY > trackHeight * 0.85) {
        if (this.captionsWrapper) this.captionsWrapper.style.opacity = '0';
        if (this.minimalHud) this.minimalHud.style.opacity = '0';
      } else {
        if (this.captionsWrapper) this.captionsWrapper.style.opacity = '1';
        if (this.minimalHud) this.minimalHud.style.opacity = '1';
      }
    }
  }

  updateCaptions(p) {
    let activeIndex = 0;
    if (p < 0.25) activeIndex = 0;
    else if (p < 0.52) activeIndex = 1;
    else if (p < 0.78) activeIndex = 2;
    else activeIndex = 3;

    this.captions.forEach((cap, idx) => {
      if (!cap) return;
      if (idx === activeIndex) {
        cap.classList.add('active');
      } else {
        cap.classList.remove('active');
      }
    });
  }
}

window.UIController = UIController;
