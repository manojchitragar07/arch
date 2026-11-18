# PALAIS DE L'AURA // Gallery of Contemporary Art & Kinetic Forms

A full-stack museum and contemporary art gallery application. Combines an editorial **Obsidian & Champagne Gilt** aesthetic, interactive scroll-driven kinetic sculpture installation, curated exhibitions, dynamic collection filtering, and collector concierge services.

---

## Architecture Overview

```
building/
├── backend/
│   ├── app.py                 # REST API + High-performance HTTP 206 Video Streaming Server
│   ├── config.py              # Environment paths, port, buffer settings
│   ├── requirements.txt       # Dependencies (Standard library, 0 external pip packages)
│   ├── handlers/
│   │   ├── api.py             # Curated catalog, exhibitions, video metadata, inquiries
│   │   └── static.py          # HTTP 206 Partial Content video streaming handler
│   └── data/
│       └── inquiries.json     # Encrypted client acquisition requests & private viewings
│
├── frontend/
│   ├── index.html             # Semantic gallery markup (installation + exhibition flow)
│   ├── css/
│   │   ├── style.css          # Museum Obsidian & Gilt theme, serif typography, collection grid
│   │   └── hud.css            # Header, floating captions, telemetry HUD, modal
│   ├── js/
│   │   ├── video-engine.js    # Bidirectional seek engine (anti-deadlock queue)
│   │   ├── audio-synth.js     # Web Audio API ambient gallery acoustic pad
│   │   ├── ui.js              # Curated artwork filtering, telemetry, modal dialog
│   │   └── main.js            # App bootstrap, backend health sync, hotkey listeners
│   └── assets/
│       ├── favicon.svg        # Gold museum emblem
│       └── videos/
│           ├── optimized_video.mp4           # 9-keyframe stream (smooth reverse scrub)
│           └── gemini_generated_video_beb49dc7.mp4 # Original video source
│
├── run.sh                     # Quickstart bash script (./run.sh)
├── server.py                  # Root entrypoint delegating to backend.app
└── README.md                  # System documentation
```

---

## Gallery Sections

1. **Centerpiece Kinetic Installation (*Monolith in Perpetual Motion*)**:
   - Fixed video background with smooth bidirectional scroll scrubbing.
   - Editorial captions in `Cormorant Garamond` serif dissolving as you traverse the installation.
   - Direction toggle (`⇄ Motion`) and Web Audio ambient acoustic soundscape.

2. **Current Exhibition (*Forms in Suspension: The Architecture of Light*)**:
   - Curatorial statement by Madame Vivienne Laurent (Zurich & Tokyo).
   - Key exhibition metrics (commissions, permanent masterworks, kinetic height).

3. **The Curated Collection Grid**:
   - Filter by discipline: *All Works*, *Kinetic Sculpture*, *Light Installations*, *Monumental Sculpture*, *Living Bio-Art*.
   - Populated dynamically from `/api/artworks`.
   - Artwork metadata: medium, dimensions, gallery hall, curatorial notes.
   - Direct *Acquire / View* trigger opening pre-selected collector modal.

4. **Represented Masters (Artist Monographs)**:
   - Spotlight on Valentin Vaneau (Lyon/Tokyo), Elena Rostova (Zurich/Venice), Kenzo Takahashi (Kyoto/London), and Dr. Sarah Al-Mansoor (Dubai/Berlin).

5. **Visit the Pavilions & Concierge**:
   - Pavilion locations: Zurich (*Bahnhofstrasse*), Tokyo (*Ginza*), Paris (*Place Vendôme*).
   - Visiting hours and private salon appointment scheduling.

6. **Collector Concierge Modal**:
   - Connected to `POST /api/inquiry` saving to `backend/data/inquiries.json`.

---

## Quick Start

```bash
# Option 1: Via the executable script
./run.sh

# Option 2: Directly via python
python3 backend/app.py
```

Live in browser at: **`http://127.0.0.1:8080/`**

### Keyboard Shortcuts
- **`I`**: Invert kinetic installation scroll direction
- **`Spacebar`**: Toggle auto-play on/off
- **`M`**: Toggle atmospheric gallery soundscape
- **`R`**: Reset scroll back to the top
- **`Esc`**: Close collector inquiry modal
