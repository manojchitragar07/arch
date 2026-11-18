"""
API Request Handlers for AURA Art Gallery Backend.
Handles health checks, video stream metadata, curated exhibition catalogs, and collector inquiries.
"""

import json
import time
import os
from datetime import datetime
from backend.config import INQUIRIES_FILE, PRIMARY_VIDEO, SOURCE_VIDEO

START_TIME = time.time()

# Curated Artworks Collection featuring the gallery's 6 exhibited masterworks
ARTWORKS_CATALOG = [
    {
        "id": "CAT-01",
        "title": "Symphonie Florale en Vase de Bronze",
        "artist": "Willem van Aelst Circle",
        "year": "c. 1675",
        "medium": "Oil on Fine Belgian Linen",
        "dimensions": "98 × 72 cm",
        "category": "Classical Still Life",
        "room": "Salon des Fleurs // West Gallery",
        "image": "assets/artworks/bouquet-in-urn.jpg",
        "description": "A luxuriant composition of blooming peonies, yellow cabbage roses, delphiniums, and fallen blossoms resting on a marble ledge draped in delicate lace. Demonstrates virtuosic Dutch Golden Age chiaroscuro and microscopic detail in dew-kissed petals.",
        "status": "Available for Acquisition",
        "price": "CHF 285,000"
    },
    {
        "id": "CAT-02",
        "title": "Allegory of Transience with White Peacock",
        "artist": "Giulia Valente",
        "year": "2021",
        "medium": "Archival Pigment on Heavy Cotton & Oil Glazes",
        "dimensions": "120 × 90 cm",
        "category": "Allegory & Vanitas",
        "room": "Nocturne Salon // East Wing",
        "image": "assets/artworks/white-peacock-vanitas.jpg",
        "description": "An albino white peacock perches above ancient leather folios, baroque drapery, and a memento mori skull resting on rich crimson velvet. An ornate bronze urn overflowing with peacock plumes and scattered pomegranates evokes the fleeting nature of worldly grandeur.",
        "status": "On Exhibition",
        "price": "CHF 190,000"
    },
    {
        "id": "CAT-03",
        "title": "Le Banquet au Cacatoès Blanc",
        "artist": "Frans Snyders Circle",
        "year": "c. 1650",
        "medium": "Oil on Cradled Oak Panel",
        "dimensions": "112 × 88 cm",
        "category": "Classical Still Life",
        "room": "Dutch Golden Age Hall",
        "image": "assets/artworks/cockatoo-feast.jpg",
        "description": "An exotic sulphur-crested cockatoo oversees an opulent table laden with glistening Muscat grapes, ripe pears, peaches, and a crystal goblet of ruby vintage wine, framed by crimson damask and Anatolian woven textiles.",
        "status": "Permanent Collection",
        "price": "Private Foundation Archive"
    },
    {
        "id": "CAT-04",
        "title": "Sentinel of the Autumn Wind",
        "artist": "Maren Lindström",
        "year": "2023",
        "medium": "Impasto Oil & Palette Knife on Heavy Canvas",
        "dimensions": "80 × 60 cm",
        "category": "Atmospheric Landscape",
        "room": "Maritime Gallery // North",
        "image": "assets/artworks/solitary-lighthouse.jpg",
        "description": "Heavy textural knife impasto captures the solitary vigilance of a stone beacon perched atop windswept dunes. The cold northern ocean and scumbled grey sky evoke profound Nordic contemplative solitude.",
        "status": "Available for Acquisition",
        "price": "CHF 145,000"
    },
    {
        "id": "CAT-05",
        "title": "Alpine Pastoral with Village Chapel",
        "artist": "Austrian Romanticist School (Anton Doll Circle)",
        "year": "c. 1880",
        "medium": "Oil on Canvas",
        "dimensions": "104 × 82 cm",
        "category": "Atmospheric Landscape",
        "room": "Romantic Landscape Pavilion",
        "image": "assets/artworks/pastoral-alpine-village.jpg",
        "description": "A bucolic idyllic sanctuary nestled in alpine foothills, featuring a whitewashed chapel tower, rustic timber chalets, geese roaming along a sunlit wooden fence, and birds rising into dramatic cumulus clouds.",
        "status": "Available for Acquisition",
        "price": "CHF 310,000"
    },
    {
        "id": "CAT-06",
        "title": "Still Life with Burst Pomegranates & Venetian Glass",
        "artist": "Jan Davidsz. de Heem Studio",
        "year": "c. 1668",
        "medium": "Oil on Fine Canvas",
        "dimensions": "92 × 74 cm",
        "category": "Classical Still Life",
        "room": "Grand Banquet Hall // Level 1",
        "image": "assets/artworks/pomegranate-harvest.jpg",
        "description": "A sumptuous Pronkstilleven banquet displaying ruby-seeded burst pomegranates, translucent emerald grapes, plums, and white blossom sprigs held in a faceted Venetian glass goblet, illuminated by dramatic chiaroscuro candlelight.",
        "status": "Available for Acquisition",
        "price": "CHF 360,000"
    }
]

# Gallery Exhibitions
EXHIBITIONS = [
    {
        "id": "EXH-2026-01",
        "title": "THE HARMONY OF LIGHT // Masterpieces of Still Life & Atmosphere",
        "dates": "NOVEMBER 15, 2026 – APRIL 30, 2027",
        "curator": "Madame Vivienne Laurent",
        "location": "Palais de l'AURA // Zurich & Tokyo Pavilions",
        "description": "A landmark curation examining the sublime tension between nature, mortality, and celestial architecture. Unites classical Dutch Golden Age still life, allegorical vanitas, and Scandinavian plein-air landscapes."
    },
    {
        "id": "EXH-2027-02",
        "title": "NORDIC NOCTURNES & ALLEGORICAL HORIZONS",
        "dates": "MAY 15 – SEPTEMBER 28, 2027",
        "curator": "Julian De Vries & Giulia Valente",
        "location": "Palais de l'AURA // Paris Salon, Place Vendôme",
        "description": "An intimate exploration of solitude, transience, and light across European classical and modern collections."
    }
]

def get_health():
    """Return backend server status and uptime."""
    return {
        "status": "online",
        "service": "PALAIS DE L'AURA // Gallery of Fine Arts & Kinetic Pavilion",
        "version": "3.2.0",
        "theme": "Museum Obsidian & Champagne Gilt",
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "total_artworks": len(ARTWORKS_CATALOG),
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

def get_artworks(category=None):
    """Return curated artworks collection with optional category filter."""
    if category and category.lower() != "all":
        return [art for art in ARTWORKS_CATALOG if art["category"].lower() == category.lower()]
    return ARTWORKS_CATALOG

def get_exhibitions():
    """Return list of current and upcoming exhibitions."""
    return EXHIBITIONS

def get_video_info():
    """Return technical specs of the kinetic installation video stream."""
    primary_exists = PRIMARY_VIDEO.exists()
    return {
        "installation_video": {
            "title": "Kinetic Architectural Pavilion Loop",
            "file": PRIMARY_VIDEO.name,
            "duration": 10.0,
            "keyframes": 9,
            "optimized_for_scrubbing": True,
            "year": 2026
        }
    }

def save_inquiry(payload):
    """Save collector acquisition inquiry or private tour reservation."""
    if not isinstance(payload, dict):
        raise ValueError("Payload must be a JSON object")

    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip()

    if not name or not email:
        raise ValueError("Name and email are required fields")

    inquiry = {
        "id": f"INQ-{int(time.time() * 1000)}",
        "name": name,
        "email": email,
        "artwork": payload.get("artwork", "General Collection Inquiry"),
        "city_pavilion": payload.get("city", "Zurich"),
        "phone": payload.get("phone", ""),
        "created_at": datetime.utcnow().isoformat() + "Z"
    }

    inquiries = []
    if INQUIRIES_FILE.exists():
        try:
            with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
                inquiries = json.load(f)
        except Exception:
            inquiries = []

    inquiries.append(inquiry)

    INQUIRIES_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(INQUIRIES_FILE, "w", encoding="utf-8") as f:
        json.dump(inquiries, f, indent=2)

    return {
        "success": True,
        "message": f"Dossier request registered for '{inquiry['artwork']}'. A Senior Curator will contact your office with the authenticated provenance file.",
        "inquiry_id": inquiry["id"]
    }

def get_inquiries():
    """Return all stored inquiries."""
    if not INQUIRIES_FILE.exists():
        return []
    try:
        with open(INQUIRIES_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []
