# CasaMotion — Defense Presentation

Branded presentation package for the CasaMotion project defense. Two formats are
included so you can present from a browser **or** from PowerPoint, plus a
flashcards page for the oral Q&A.

```
presentation/
├── index.html          ← main slide deck (Reveal.js, ~45 slides, branded)
├── qa.html             ← 15 defense Q&A flashcards (searchable)
├── casamotion.pptx     ← PowerPoint version (45 slides, editable)
├── build_pptx.py       ← regenerates casamotion.pptx
├── assets/             ← logo + 9 architecture diagrams (used by both formats)
├── screenshots/        ← drop your 10 live screenshots here (see its README)
└── README.md           ← this file
```

## 1. Present from the browser (recommended)

Open `index.html` in Chrome/Edge. No internet needed for content, but the
Reveal.js engine + KaTeX load from a CDN, so keep a connection on demo day.

**Keyboard:**
| Key | Action |
|-----|--------|
| `→` / `Space` | next slide |
| `←` | previous |
| `S` | **speaker view** (notes + timer + next-slide preview) |
| `F` | fullscreen |
| `O` / `Esc` | slide overview grid |
| `B` | black-out the screen |
| `Alt`+click | zoom into a region |

**Export to PDF:** open `index.html?print-pdf` then use the browser's
*Print → Save as PDF* (Background graphics ON, margins None, Landscape).

## 2. Present from PowerPoint

Open `casamotion.pptx`. Every slide already has **speaker notes** in the notes
pane. Placeholder boxes (cyan-dashed, "📷 …") mark where the 10 live
screenshots go — drag a PNG from `screenshots/` onto each one.

To regenerate the file after editing `build_pptx.py`:

```powershell
.\.venv\Scripts\python.exe presentation\build_pptx.py
```

(Requires `python-pptx`, already installed in `.venv`.)

## 3. Q&A flashcards

Open `qa.html` on a second screen during questions. Type in the search box to
filter (e.g. `MinIO`, `GBT`, `leakage`, `watermark`), click a card to reveal the
answer. All 15 answers are code-accurate and match Appendix D of
`../documents/PRESENTATION.md`.

## 4. Adding the live screenshots

1. `docker compose up -d` then `./scripts/demo-healthcheck.ps1` (wait for green).
2. Capture the 10 screenshots listed in [screenshots/README.md](screenshots/README.md).
3. Save them with the suggested filenames into `screenshots/`.
4. In PowerPoint: drop each onto its placeholder card.
   In HTML: replace the matching `.ph` card with `<img src="screenshots/NAME.png">`.

## Branding

Colours are taken from the CasaMotion logo (`assets/logowithoubackground.png`):
cyan `#22d3ee` → blue `#2d6bff` → violet `#7c3aed` on a navy `#0a1430` background.
The logo appears on the title, every section divider, and as a corner watermark.

## Content source

All slide text mirrors `../documents/PRESENTATION.md` (slides 1–27, technical
deep-dive T1–T6, and the appendices). Update that file first if you change the
narrative, then mirror edits here.
