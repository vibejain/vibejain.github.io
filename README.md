# AI Portfolio — retro scrollable one-pager

A single-page, OG-retro personal landing page (pixel/terminal vibe) with
tasteful micro-interactions. Pure static HTML/CSS/JS — no build step, no
backend, nothing sensitive. Ready for GitHub Pages. Reuses Kenney pixel-art
building tiles as small decorative accents (skyline + section icons) so it still
feels like a retro game without being a full isometric world.

## Structure

```
.
├── index.html              # The whole one-pager
├── assets/
│   ├── css/retro.css       # All styling + palette variables (:root)
│   ├── js/main.js          # Micro-interactions
│   └── img/tiles/          # Kenney CC0 pixel tiles (used as accents)
├── llms.txt                # Public summary for AI crawlers
├── .gitignore
└── README.md
```

## Micro-interactions
- **Typewriter** hero phrase that rotates (business outcomes → hours saved → …)
- **Scroll progress bar** styled like an XP meter (top of page)
- **Scroll-reveal** of sections/cards with staggered delays
- **Scrollspy** — nav highlights the section you're viewing
- **Hover lifts** on cards, tags, buttons, and skyline buildings
- **CRT scanline** toggle (footer button)
- **Shift + click the logo** cycles the colour palette (small easter egg)
- Subtle floating pixel particles in the background

All effects respect `prefers-reduced-motion`.

## Make it yours
1. Find & replace `YOUR NAME` in `index.html`.
2. Edit the hero tagline, About, Skills tags, and Projects.
3. Update the contact links (`mailto:`, GitHub, LinkedIn).
4. Swap project thumbnails via `background-image` on `.project__thumb`.
5. Re-skin the whole site from the `:root` palette in `assets/css/retro.css`.

## Preview locally
```bash
python3 -m http.server 8000
# visit http://localhost:8000
```

## Deploy to GitHub Pages
1. Create a repo (`yourusername.github.io`, or any repo + custom domain).
2. Push these files to `main`.
3. Settings → Pages → Source: **Deploy from branch → main / root**.

## Asset credits
Pixel building/tree/lamp tiles by **Kenney** (https://kenney.nl) — licensed
**CC0 1.0 (Public Domain)**. Free for commercial use, no attribution required.
See `assets/img/tiles/KENNEY-LICENSE-CC0.txt`.

## Safety notes
- Keep client names, pricing, API keys, and real ROI numbers OUT of this repo.
- Put unpublished work in `private/` or `*-draft.md` files (gitignored).
