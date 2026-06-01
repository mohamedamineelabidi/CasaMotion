#!/usr/bin/env python3
"""
Build the CasaMotion PowerPoint deck (casamotion.pptx) from a branded template.

Run:  python build_pptx.py
Requires: python-pptx  (pip install python-pptx)

All content mirrors presentation/index.html and documents/PRESENTATION.md.
Images are pulled from presentation/assets/. Where a live screenshot is needed,
a styled placeholder box is drawn so you can drop the screenshot in later.
"""
from __future__ import annotations
import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, "assets")

# ---- Brand palette -------------------------------------------------------
NAVY   = RGBColor(0x0A, 0x14, 0x30)
NAVY2  = RGBColor(0x0F, 0x1C, 0x44)
CYAN   = RGBColor(0x22, 0xD3, 0xEE)
BLUE   = RGBColor(0x2D, 0x6B, 0xFF)
VIOLET = RGBColor(0x7C, 0x3A, 0xED)
INK    = RGBColor(0xE9, 0xEE, 0xFB)
MUTED  = RGBColor(0x9F, 0xB0, 0xD6)
WHITE  = RGBColor(0xFF, 0xFF, 0xFF)
CARD   = RGBColor(0x14, 0x22, 0x4D)

EMU_W, EMU_H = Inches(13.333), Inches(7.5)

prs = Presentation()
prs.slide_width = EMU_W
prs.slide_height = EMU_H
BLANK = prs.slide_layouts[6]


# ---- helpers -------------------------------------------------------------
def _img(name: str) -> str | None:
    p = os.path.join(ASSETS, name)
    return p if os.path.exists(p) else None


def _no_line(shape):
    shape.line.fill.background()


def fill_bg(slide, color=NAVY):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color


def accent_bar(slide, top=Inches(0.0)):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, top, EMU_W, Inches(0.13))
    bar.fill.solid()
    bar.fill.fore_color.rgb = BLUE
    _no_line(bar)
    # gradient (cyan -> blue -> violet)
    _gradient(bar, [(0.0, CYAN), (0.5, BLUE), (1.0, VIOLET)], angle=0)
    return bar


def _gradient(shape, stops, angle=90):
    """Apply a linear gradient fill to a shape via raw XML."""
    spPr = shape.fill._xPr  # noqa: SLF001
    for tag in ("a:noFill", "a:solidFill", "a:gradFill", "a:blipFill", "a:pattFill", "a:grpFill"):
        e = spPr.find(qn(tag))
        if e is not None:
            spPr.remove(e)
    grad = spPr.makeelement(qn("a:gradFill"), {})
    gsLst = grad.makeelement(qn("a:gsLst"), {})
    for pos, color in stops:
        gs = grad.makeelement(qn("a:gs"), {"pos": str(int(pos * 100000))})
        srgb = grad.makeelement(qn("a:srgbClr"), {"val": "%02X%02X%02X" % (color[0], color[1], color[2])})
        gs.append(srgb)
        gsLst.append(gs)
    grad.append(gsLst)
    lin = grad.makeelement(qn("a:lin"), {"ang": str(int(angle * 60000)), "scaled": "1"})
    grad.append(lin)
    # insert before a:ln if present
    ln = spPr.find(qn("a:ln"))
    if ln is not None:
        ln.addprevious(grad)
    else:
        spPr.append(grad)


def add_text(slide, left, top, width, height, runs, *, align=PP_ALIGN.LEFT,
             anchor=MSO_ANCHOR.TOP, space_after=6):
    """runs: list of paragraphs; each paragraph is list of (text, size, color, bold)."""
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    for i, para in enumerate(runs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        p.space_after = Pt(space_after)
        for (text, size, color, bold) in para:
            r = p.add_run()
            r.text = text
            r.font.size = Pt(size)
            r.font.color.rgb = color
            r.font.bold = bold
            r.font.name = "Segoe UI"
    return tb


def bullets(slide, left, top, width, height, items, *, size=15, gap=6, color=INK):
    tb = slide.shapes.add_textbox(left, top, width, height)
    tf = tb.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(gap)
        p.level = item.get("level", 0) if isinstance(item, dict) else 0
        text = item["t"] if isinstance(item, dict) else item
        bold = item.get("bold", False) if isinstance(item, dict) else False
        # bullet glyph
        rb = p.add_run(); rb.text = ("•  " if p.level == 0 else "–  ")
        rb.font.size = Pt(size); rb.font.color.rgb = CYAN; rb.font.bold = True
        rb.font.name = "Segoe UI"
        rt = p.add_run(); rt.text = text
        rt.font.size = Pt(size - (1 if p.level else 0))
        rt.font.color.rgb = color; rt.font.bold = bold; rt.font.name = "Segoe UI"
    return tb


def heading(slide, kicker, title):
    accent_bar(slide)
    add_text(slide, Inches(0.6), Inches(0.30), Inches(11.5), Inches(0.4),
             [[(kicker.upper(), 13, CYAN, True)]])
    add_text(slide, Inches(0.6), Inches(0.62), Inches(12.1), Inches(0.95),
             [[(title, 28, WHITE, True)]])
    # corner logo watermark
    logo = _img("logowithoubackground.png")
    if logo:
        slide.shapes.add_picture(logo, Inches(11.7), Inches(6.95), height=Inches(0.34))


def placeholder(slide, left, top, width, height, title, path=""):
    box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    box.fill.solid(); box.fill.fore_color.rgb = CARD
    box.line.color.rgb = VIOLET; box.line.width = Pt(1.5)
    box.line.dash_style = None
    tf = box.text_frame; tf.word_wrap = True; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = "📷  " + title
    r.font.size = Pt(13); r.font.bold = True; r.font.color.rgb = WHITE; r.font.name = "Segoe UI"
    if path:
        p2 = tf.add_paragraph(); p2.alignment = PP_ALIGN.CENTER
        r2 = p2.add_run(); r2.text = path
        r2.font.size = Pt(10); r2.font.color.rgb = CYAN; r2.font.name = "Consolas"
    p3 = tf.add_paragraph(); p3.alignment = PP_ALIGN.CENTER
    r3 = p3.add_run(); r3.text = "drop your screenshot here"
    r3.font.size = Pt(9); r3.font.color.rgb = MUTED; r3.font.italic = True; r3.font.name = "Segoe UI"
    return box


def picture_card(slide, name, left, top, width):
    """White card behind an image (logos/diagrams look good on white)."""
    img = _img(name)
    if not img:
        return placeholder(slide, left, top, width, Inches(3.2), name)
    pic = slide.shapes.add_picture(img, left, top, width=width)
    return pic


def table(slide, left, top, width, height, rows, col_widths=None, *, fsize=12):
    nrows, ncols = len(rows), len(rows[0])
    gtbl = slide.shapes.add_table(nrows, ncols, left, top, width, height).table
    if col_widths:
        for i, w in enumerate(col_widths):
            gtbl.columns[i].width = w
    # disable default banding/style by setting plain look via cells
    for r in range(nrows):
        for c in range(ncols):
            cell = gtbl.cell(r, c)
            cell.fill.solid()
            cell.fill.fore_color.rgb = (NAVY2 if r == 0 else (CARD if r % 2 else NAVY))
            cell.margin_left = Inches(0.08); cell.margin_right = Inches(0.08)
            cell.margin_top = Inches(0.03); cell.margin_bottom = Inches(0.03)
            cell.vertical_anchor = MSO_ANCHOR.MIDDLE
            tf = cell.text_frame; tf.word_wrap = True
            p = tf.paragraphs[0]
            run = p.add_run(); run.text = str(rows[r][c])
            run.font.size = Pt(fsize)
            run.font.name = "Segoe UI"
            run.font.bold = (r == 0)
            run.font.color.rgb = WHITE if r == 0 else INK
    return gtbl


def notes(slide, text):
    slide.notes_slide.notes_text_frame.text = text


def new_slide(bg=NAVY):
    s = prs.slides.add_slide(BLANK)
    fill_bg(s, bg)
    return s


def divider(kicker, title, subtitle):
    s = new_slide(NAVY)
    # big gradient band
    band = s.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(2.45), EMU_W, Inches(0.10))
    band.fill.solid(); band.fill.fore_color.rgb = BLUE; _no_line(band)
    _gradient(band, [(0.0, CYAN), (0.5, BLUE), (1.0, VIOLET)], angle=0)
    add_text(s, Inches(0.6), Inches(2.65), Inches(12.1), Inches(0.5),
             [[(kicker.upper(), 15, CYAN, True)]], align=PP_ALIGN.CENTER)
    add_text(s, Inches(0.6), Inches(3.05), Inches(12.1), Inches(1.0),
             [[(title, 40, WHITE, True)]], align=PP_ALIGN.CENTER)
    add_text(s, Inches(0.6), Inches(4.15), Inches(12.1), Inches(0.6),
             [[(subtitle, 17, MUTED, False)]], align=PP_ALIGN.CENTER)
    logo = _img("logowithoubackground.png")
    if logo:
        s.shapes.add_picture(logo, Inches(5.4), Inches(0.7), width=Inches(2.5))
    return s


# =========================================================================
# SLIDE 1 — TITLE
# =========================================================================
s = new_slide(NAVY)
accent_bar(s)
logo = _img("logowithoubackground.png")
if logo:
    s.shapes.add_picture(logo, Inches(2.9), Inches(1.5), width=Inches(7.5))
add_text(s, Inches(1.0), Inches(4.0), Inches(11.3), Inches(0.6),
         [[("Real-Time Urban Mobility Intelligence Platform for Casablanca, Morocco", 18, MUTED, False)]],
         align=PP_ALIGN.CENTER)
add_text(s, Inches(1.0), Inches(4.7), Inches(11.3), Inches(0.5),
         [[("Kafka · Flink · Spark · Cassandra · MinIO · FastAPI · Grafana · Docker", 15, CYAN, True)]],
         align=PP_ALIGN.CENTER)
add_text(s, Inches(1.0), Inches(5.5), Inches(11.3), Inches(0.9),
         [[("Kappa streaming architecture  ·  16-container stack  ·  ML demand forecasting", 14, INK, False)],
          [("Built over 6 delivery weeks + a parallel Phase-4 data-synthesis track", 13, MUTED, False)]],
         align=PP_ALIGN.CENTER)
notes(s, "CasaMotion turns Casablanca's fragmented taxi market into a real-time data platform. "
         "I'll walk through the problem, the architecture, and exactly what we built week by week.")

# =========================================================================
# Content slides defined declaratively where simple; custom where needed
# =========================================================================

# SLIDE 2 — PROBLEM
s = new_slide(); heading(s, "The Problem", "Casablanca: 4 million people, zero shared mobility data")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.1), Inches(4.6), [
    {"t": "No shared data layer — taxis & minibuses run with no GPS, booking, or schedule", "bold": True},
    "Demand blindness — drivers cruise empty; riders wait with no visibility",
    "No interoperability — ONCF rail, BRT and taxis share no data or ticketing",
    "Cash-only — no trip history, no analytics, no personalization",
    "Underserved periphery — Bouskoura, Sidi Moumen grow faster than routes",
    {"t": "Core problem = absence of a DATA LAYER connecting supply to demand", "bold": True},
], size=16, gap=10)
picture_card(s, "painpoint.png", Inches(8.0), Inches(1.9), Inches(4.7))
notes(s, "Every pain point is a data problem, not a vehicle problem. That framing is the foundation of the whole project.")

# SLIDE 3 — SOLUTION
s = new_slide(); heading(s, "The Solution & Objectives", "Treat urban mobility as a data-engineering problem")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.1), Inches(4.6), [
    {"t": "Dynamic rider–vehicle matching — nearest taxi in under 5 seconds", "bold": True},
    {"t": "Demand surge forecasting — trips per zone predicted 30 min ahead", "bold": True},
    {"t": "City-wide visibility — live heatmaps, KPI dashboards, coverage gaps", "bold": True},
    {"t": "Data-driven planning — find zones where demand exceeds supply", "bold": True},
    "Cahier des charges: real-time ingestion, event-time processing, serving DB, batch ML, dashboards, secured API",
], size=16, gap=12)
picture_card(s, "projectoverview.png", Inches(8.0), Inches(1.9), Inches(4.7))
notes(s, "Four concrete capabilities. Each maps to a measurable target later in the deck.")

# SLIDE 4 — ARCHITECTURE
s = new_slide(); heading(s, "Architecture Overview (v2)", "Kappa architecture — Kafka is the single source of truth")
bullets(s, Inches(0.6), Inches(1.7), Inches(5.0), Inches(4.6), [
    {"t": "Producers → Kafka (KRaft) → Flink (3 jobs) → Cassandra → Grafana / FastAPI", "bold": True},
    "MinIO = data lake (raw / curated / mldata / kafka-archive)",
    "Spark = offline only (ETL + ML training), never serves live queries",
    "16 Docker containers on one network (taasim-net)",
], size=15, gap=10)
picture_card(s, "architecturev2.png", Inches(5.9), Inches(1.8), Inches(6.9))
notes(s, "The master map. Flink does all real-time work; Spark is batch-only. Kafka is replayable — that's Kappa, not Lambda.")

# SLIDE 5 — WHY TECH
s = new_slide(); heading(s, "Why These Technologies", "Every choice has a documented rationale (ADR v1)")
table(s, Inches(0.6), Inches(1.75), Inches(12.1), Inches(4.9), [
    ["Choice", "Over", "Why"],
    ["Kappa", "Lambda", "One processing layer; Kafka is replayable"],
    ["Kafka KRaft", "+ ZooKeeper", "One fewer service, faster failover"],
    ["Flink", "Kafka Streams / Spark Streaming", "True event-time windows, sub-second latency"],
    ["Cassandra", "Postgres / Redis", "Query-driven partitioning, native TTL, write-optimized"],
    ["MinIO", "HDFS", "S3 API for Spark + Flink + Connect; no NameNode"],
    ["JSON on wire", "Avro", "Debuggable in Kafka UI, no schema registry"],
    ["H3 res-9 lookup", "point-in-polygon", "O(1) dict lookup vs O(16) ray-cast"],
], col_widths=[Inches(2.4), Inches(3.4), Inches(6.3)], fsize=13)
notes(s, "These trade-offs are the questions a jury will ask. MinIO not HDFS; Flink not Spark Streaming for sub-5s matching.")

# DIVIDER WEEK 1
divider("Delivery Timeline", "Week 1 — Foundation", "Stack · Datasets · Zone Geography · Producers")

# SLIDE 6 — WEEK 1
s = new_slide(); heading(s, "Week 1: Foundation", "Stand up the platform and prepare the geography")
bullets(s, Inches(0.6), Inches(1.7), Inches(6.2), Inches(4.6), [
    {"t": "Docker Compose stack — Kafka, MinIO, Cassandra, Flink, Spark, Grafana, Jupyter", "bold": True},
    "Datasets → MinIO — Porto (1.8 GiB) + NYC TLC",
    "Porto EDA — 1.7M trips, GPS polylines",
    "Zone remapping — Porto bbox → Casablanca, 16 arrondissements (v4)",
    "Kafka producers v1 — GPS + trip requests",
], size=15, gap=10)
add_text(s, Inches(7.1), Inches(1.9), Inches(5.6), Inches(3.6),
         [[("Problem: ", 14, CYAN, True), ("Porto coordinates are in Portugal; needed a faithful transform to Casablanca respecting 16 real arrondissement shapes.", 14, INK, False)],
          [("Solution: ", 14, CYAN, True), ("linear bbox transform + H3 res-9 lookup (h3_zone_lookup.json) for O(1) zone assignment.", 14, INK, False)]],
         space_after=12)
notes(s, "The hard part wasn't Docker — it was the geography. We pre-computed an H3 lookup so every GPS event resolves its zone in O(1).")

# SLIDE 6.1 — ZONE STEP 1
s = new_slide(); heading(s, "Zone Remapping · Step 1", "How we draw Casablanca's 16 zones")
table(s, Inches(0.6), Inches(1.75), Inches(6.0), Inches(2.0), [
    ["Approach", "Why rejected"],
    ["Uniform 500 m grid", "Splits real neighbourhoods"],
    ["H3 res-8 hex (~260)", "Too many, no admin meaning"],
    ["Irregular polygons ✅", "Match real admin boundaries"],
], col_widths=[Inches(2.9), Inches(3.1)], fsize=12)
bullets(s, Inches(7.0), Inches(1.75), Inches(5.7), Inches(3.4), [
    {"t": "9 zones = official OpenStreetMap admin-boundary polygons", "bold": True},
    {"t": "7 zones = Voronoi cells on named OSM place-nodes (northern suburbs), clipped to urban boundary", "bold": True},
    "All polygons clipped to remove ocean slivers/overlaps",
    "Output: zone_mapping_v4.csv + casablanca_ae_map.html",
], size=13, gap=8)
add_text(s, Inches(0.6), Inches(4.9), Inches(12.1), Inches(1.4),
         [[("Honesty note: ", 13, CYAN, True), ("the 7 Voronoi zones are a demand-aggregation scaffold, not a cartographic claim — every downstream stage treats all 16 as abstract zone_ids.", 13, INK, False)]])
notes(s, "Real, irregular arrondissement shapes because demand follows neighbourhoods, not squares.")

# SLIDE 6.2 — A-E SCORE
s = new_slide(); heading(s, "Zone Remapping · Step 2 — A–E Activity Score", "An activity tier from a weighted multi-source formula")
add_text(s, Inches(0.6), Inches(1.7), Inches(12.1), Inches(0.6),
         [[("score_z = 0.30·c_z + 0.40·ρ_z + 0.20·d_z + 0.10·t_z   (all features min-max normalised to [0,1])", 16, CYAN, True)]],
         align=PP_ALIGN.CENTER)
table(s, Inches(0.6), Inches(2.5), Inches(7.3), Inches(2.6), [
    ["Feature", "Source", "Weight"],
    ["Population density ρ", "HCP 2024 census", "0.40"],
    ["Commerce weight c", "Glovo", "0.30"],
    ["POI diversity d", "Glovo", "0.20"],
    ["Transit hubs t", "OpenStreetMap", "0.10"],
], col_widths=[Inches(3.0), Inches(2.8), Inches(1.5)], fsize=13)
bullets(s, Inches(8.2), Inches(2.5), Inches(4.5), Inches(3.4), [
    "Population dominates (0.40): demand scales with residents/km²",
    {"t": "Quantile cut [2,4,5,4,1] → A=dense CBD … E=lowest", "bold": True},
    {"t": "Reconciles to HCP's 3.28 M", "bold": True},
], size=13, gap=10)
notes(s, "Each zone's tier is computed from four real signals; we verify the summed population equals HCP's 3.28 million.")

# SLIDE 6.3 — PORTO WARPING
s = new_slide(); heading(s, "Porto Simulation Strategy", "Warping real GPS onto Casablanca roads (7 stages)")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.1), Inches(4.8), [
    {"t": "LOAD — Porto polylines; filter 1.5–18 km, 3–30 min", "bold": True},
    {"t": "SAMPLE — stratify by length → 500 trips", "bold": True},
    {"t": "ASSIGN — A–E transition matrix → zone by population", "bold": True},
    {"t": "AFFINE — linear Porto bbox → Casa bbox (cahier transform)", "bold": True},
    {"t": "ANCHOR — pull to centroid (α=0.80) + jitter σ≈160 m", "bold": True},
    {"t": "OSRM — route on real Casa street network", "bold": True},
    {"t": "PERSIST — curated_trajectories_v4.parquet", "bold": True},
], size=14, gap=8)
placeholder(s, Inches(8.0), Inches(1.9), Inches(4.7), Inches(3.6),
            "Warped trajectories on real streets", "notebooks/casablanca_trajectories_v4.html")
notes(s, "Porto gives authentic motion; OSRM routes it along actual Casablanca streets using OSM road data.")

# SLIDE 6.4 — CHAIN
s = new_slide(); heading(s, "Putting It Together", "Population + OSM drive realistic demand")
add_text(s, Inches(0.6), Inches(1.7), Inches(12.1), Inches(3.0), [
    [("HCP population + Glovo commerce + OSM transit  →  A–E activity score  →  demand multipliers {A:1.8 … E:0.5}", 14, INK, False)],
    [("OSM admin boundaries  →  16 zone polygons  →  population-weighted origin sampling", 14, INK, False)],
    [("OSM road network (OSRM)  →  road-snapped Porto trajectories", 14, INK, False)],
    [("NYC temporal fingerprint  →  hourly / DoW curve", 14, INK, False)],
    [("⇒  casa_trip_requests  (500K trips, 90 days)", 16, CYAN, True)],
], space_after=10)
bullets(s, Inches(0.6), Inches(4.9), Inches(12.1), Inches(1.6), [
    {"t": "Origin weight: origin_p[z] = pop_2024[z] × ae_mult[z]", "bold": True},
    "Validation 8/8: A/E ratio ≈ 3.6×, twin peaks 08:00/18:00, Fri-high/Sun-low, 70/30 petit/grand",
], size=13, gap=8)
notes(s, "OSM gives shapes, transit, roads. HCP+Glovo give tiers→multipliers. NYC sets WHEN. Eight panels confirm realism.")

# SLIDE 7 — PRODUCERS
s = new_slide(); heading(s, "Week 1 Deep Dive: Producers", "Two Python producers replay Casa traffic into Kafka")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.0), Inches(4.6), [
    {"t": "vehicle_gps_producer.py → raw.gps, key=taxi_id", "bold": True},
    {"t": "COUPLED: interpolate OSRM polyline, ±20 m noise, 5% blackout, road-snap", "level": 1},
    {"t": "H3 res-9 → zone, ring fallback r=1..5", "level": 1},
    {"t": "trip_request_producer.py → raw.trips, key=origin_zone", "bold": True},
    {"t": "Hourly multiplier (peaks 08/18), petit/grand split, MAD tariffs", "level": 1},
    {"t": "Wire: JSON, acks=all, retries=3", "bold": True},
], size=14, gap=7)
picture_card(s, "flink_architecture.png", Inches(7.9), Inches(1.9), Inches(4.8))
notes(s, "Coupled mode pairs each trip with a real routed polyline so taxis move on actual streets. Keys let Flink keyBy without reshuffle.")

# DIVIDER WEEK 2
divider("Delivery Timeline", "Week 2 — Storage Layer", "Kafka Connect · Cassandra Schema · ADR v1")

# SLIDE 8 — STORAGE
s = new_slide(); heading(s, "Week 2: Storage Layer", "Persist the streams and lock the data model")
bullets(s, Inches(0.6), Inches(1.7), Inches(12.1), Inches(1.1), [
    {"t": "Kafka Connect S3 Sink — raw.gps + raw.trips → s3://kafka-archive/YYYY/MM/DD/HH/", "bold": True},
    "Cassandra schema — 3 tables, INSERT + SELECT tested · ADR v1 written",
], size=14, gap=6)
table(s, Inches(0.6), Inches(3.0), Inches(12.1), Inches(2.0), [
    ["Table", "Partition key", "Clustering", "TTL"],
    ["vehicle_positions", "(city, zone_id)", "event_time DESC", "24 h"],
    ["demand_zones", "(city, zone_id)", "window_start DESC", "7 d"],
    ["trips", "(city, date_bucket)", "created_at DESC", "—"],
], fsize=13)
add_text(s, Inches(0.6), Inches(5.3), Inches(12.1), Inches(1.0),
         [[("Problem: ", 13, CYAN, True), ("an unbounded trips partition grows forever.  ", 13, INK, False),
           ("Solution: ", 13, CYAN, True), ("date_bucket caps each partition (< 100 MB guidance).", 13, INK, False)]])
notes(s, "Tables are designed around the queries. The ADR documents every decision for defensibility.")

# DIVIDER WEEK 3
divider("Delivery Timeline", "Week 3 — Real-Time Processing", "Flink Jobs 1–3 · Matching · Anonymization")

# SLIDE 9 — FLINK JOBS
s = new_slide(); heading(s, "Week 3: Real-Time Processing", "Three PyFlink jobs turn raw events into serving state")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.1), Inches(4.6), [
    {"t": "Job 1 · GPS Normalizer — raw.gps → validate, dedup, H3 zone, road-snap → vehicle_positions", "bold": True},
    {"t": "Job 2 · Demand Aggregator — 30 s tumbling windows → demand_zones", "bold": True},
    {"t": "Job 3 · Trip Matcher — keyBy zone, MapState, adjacent fan-out + dedup → trips", "bold": True},
    "Checkpoints: RocksDB, EXACTLY_ONCE, 60 s → MinIO",
    "Watermarks: 3-min (Job 1); 10 s + idleness (Jobs 2/3)",
], size=13, gap=8)
picture_card(s, "streamproce_architec.png", Inches(7.9), Inches(1.9), Inches(4.8))
notes(s, "Watermarks let Flink emit correct windows even when pings arrive late. We use cassandra-driver execute_async, not the official connector.")

# SLIDE 10 — MATCHING
s = new_slide(); heading(s, "Week 3 Deep Dive: Matching & Anonymization", "Sub-second matching + privacy by design")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.0), Inches(3.2), [
    {"t": "Cost: 0.7·haversine_km + 0.3·idle_bonus", "bold": True},
    "Adjacent fan-out: neighbours compete; first free taxi wins via shared Set<trip_id> dedup",
    {"t": "Match P95 ≈ 1.2 s (target < 5 s)", "bold": True},
    "Anonymization: snap to centroid + hash jitter — raw lat/lon never persisted",
], size=14, gap=9)
# metric chips
for i, (val, lbl) in enumerate([("1.2 s", "P95 match latency"), ("21%", "matched (fleet 2000 @ 50×)")]):
    bx = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0 + i * 2.45), Inches(1.9), Inches(2.25), Inches(1.5))
    bx.fill.solid(); bx.fill.fore_color.rgb = CARD; bx.line.color.rgb = BLUE; bx.line.width = Pt(1)
    tf = bx.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = val; r.font.size = Pt(30); r.font.bold = True; r.font.color.rgb = CYAN
    p2 = tf.add_paragraph(); p2.alignment = PP_ALIGN.CENTER
    r2 = p2.add_run(); r2.text = lbl; r2.font.size = Pt(10); r2.font.color.rgb = MUTED
add_text(s, Inches(8.0), Inches(3.7), Inches(4.7), Inches(2.0),
         [[("Problem: ", 12, CYAN, True), ("match rate only 4.2% (fleet 500, 10×).  ", 12, INK, False),
           ("Solution: ", 12, CYAN, True), ("scaled to fleet 2000 @ 50× → 21%.", 12, INK, False)]])
notes(s, "Adjacent-zone fan-out gives 1.2s P95; anonymization proves the raw coordinate never reaches the database.")

# DIVIDER WEEK 5
divider("Delivery Timeline", "Week 5 — Batch ETL (Spark)", "Porto + NYC → Curated Parquet · Offline only")

# SLIDE 11 — SPARK ETL
s = new_slide(); heading(s, "Week 5: Batch ETL with Spark (offline)", "Spark cleans donor datasets into curated Parquet")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.0), Inches(3.4), [
    {"t": "Porto ETL — 1,710,670 → 1,660,794 valid → s3://curated/trips/ (43 MiB)", "bold": True},
    {"t": "NYC TLC ETL — 9.38M → 8.81M → 192K demand rows", "bold": True},
    "KPI analytics — 6 datasets (trips/zone, hourly, heatmap, gaps…)",
    {"t": "Kappa rule: NYC is batch-only — never enters Kafka", "bold": True},
], size=14, gap=9)
add_text(s, Inches(0.6), Inches(5.1), Inches(7.0), Inches(1.2),
         [[("Problem: ", 13, CYAN, True), ("Spark image lacked numpy.  ", 13, INK, False),
           ("Solution: ", 13, CYAN, True), ("install numpy at startup; bump RAM (worker 4g, master 3g).", 13, INK, False)]])
placeholder(s, Inches(8.0), Inches(1.9), Inches(4.7), Inches(3.0), "Spark Master UI — completed apps", "http://localhost:8080")
notes(s, "Spark is strictly offline. Porto gives motion; NYC gives demand patterns; both become curated Parquet for the ML stage.")

# SLIDE 12 — NYC STORY
s = new_slide(); heading(s, "The NYC Data Story", "NYC = demand fingerprint, never streamed, never trains the model")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.0), Inches(4.4), [
    {"t": "Role 1 · Trip synthesis — borrow NYC curve/DoW/OD → 500K Casa trips / 90 days", "bold": True},
    {"t": "Role 2 · Batch ETL exercise — prove Spark handles multi-GB data (cahier §2.2)", "bold": True},
    "Re-anchored to Casa with HCP 2024 + Glovo",
    "Validation 8/8 (70.6% petit / 29.4% grand, A/E 3.65×)",
], size=14, gap=10)
placeholder(s, Inches(8.0), Inches(1.9), Inches(4.7), Inches(3.4), "NYC→Casa synthesis EDA (8-panel)", "data/casa_synthesis/eda_figures.png")
notes(s, "Why New York? No open Casablanca taxi dataset. We borrow patterns, not values, then re-anchor with census+commerce. NYC never streams.")

# DIVIDER WEEK 6
divider("Delivery Timeline", "Week 6 — Machine Learning + API", "Features · GBT Model · FastAPI Serving")

# SLIDE 13 — FEATURE ENG
s = new_slide(); heading(s, "Week 6: Feature Engineering", "Build a leakage-free feature matrix (183,981 rows)")
bullets(s, Inches(0.6), Inches(1.7), Inches(12.1), Inches(2.4), [
    {"t": "Input: s3://curated/trips/  →  Output: s3://mldata/features/", "bold": True},
    "Target: demand = trips per zone per 30-min slot (48 slots/day)",
    "Features: hour_of_day, day_of_week, is_weekend, is_peak, slot_of_day, zone_idx, demand_lag_1d, demand_lag_7d, rolling_7d_mean",
], size=15, gap=9)
add_text(s, Inches(0.6), Inches(4.4), Inches(12.1), Inches(2.0),
         [[("The critical fix: ", 15, CYAN, True),
           ("an earlier draft included supply and supply_demand_ratio — both from the SAME 30-min slot as the target → label leakage. "
            "Removed both; kept only retrospective lag/rolling features. Temporal split (not random) at 2014-05-01.", 15, INK, False)]])
notes(s, "We caught and removed label leakage — the difference between a notebook model and a production one. Temporal split because it's a time series.")

# SLIDE 14 — SELECTION VS IMPORTANCE
s = new_slide(); heading(s, "Week 6: Feature Selection vs Importance", "Two different concepts — we did both")
bullets(s, Inches(0.6), Inches(1.8), Inches(6.4), Inches(3.0), [
    {"t": "Selection (before): allow only if knowable in advance & non-leaking → removed supply*", "bold": True},
    {"t": "Importance (after): GBT featureImportances shows what trees split on", "bold": True},
], size=15, gap=12)
table(s, Inches(7.2), Inches(1.85), Inches(5.5), Inches(2.2), [
    ["#", "Feature", "Importance"],
    ["1", "demand_lag_1d", "~0.38"],
    ["2", "rolling_7d_mean", "~0.24"],
    ["3", "hour_of_day", "~0.17"],
], col_widths=[Inches(0.7), Inches(3.0), Inches(1.8)], fsize=14)
notes(s, "We selected nine features on causal grounds and report importances as evidence. Lag-1-day dominating is exactly what an analyst expects.")

# SLIDE 15 — GBT RESULTS
s = new_slide(); heading(s, "Week 6: GBT Model Training & Results", "Gradient Boosted Trees beat the baseline by 45.8%")
bullets(s, Inches(0.6), Inches(1.7), Inches(7.0), Inches(4.4), [
    {"t": "Algorithm: Spark MLlib GBTRegressor (maxDepth=5, maxIter=50, stepSize=0.1)", "bold": True},
    "Pipeline: StringIndexer → VectorAssembler → GBTRegressor",
    "Split: temporal — Train 151,911 / Test 32,070",
    "Every one of 16 zones beats the baseline",
], size=14, gap=10)
metrics = [("3.71", "RMSE (vs 6.84)"), ("0.75", "R²"), ("2.11", "MAE"), ("−45.8%", "vs baseline")]
for i, (val, lbl) in enumerate(metrics):
    col, row = i % 2, i // 2
    bx = s.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(8.0 + col * 2.45), Inches(1.9 + row * 1.7), Inches(2.25), Inches(1.5))
    bx.fill.solid(); bx.fill.fore_color.rgb = CARD; bx.line.color.rgb = BLUE; bx.line.width = Pt(1)
    tf = bx.text_frame; tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]; p.alignment = PP_ALIGN.CENTER
    r = p.add_run(); r.text = val; r.font.size = Pt(28); r.font.bold = True; r.font.color.rgb = CYAN
    p2 = tf.add_paragraph(); p2.alignment = PP_ALIGN.CENTER
    r2 = p2.add_run(); r2.text = lbl; r2.font.size = Pt(10); r2.font.color.rgb = MUTED
notes(s, "We beat the mandatory naive 7-day-lag baseline globally by 45.8% and in every zone. R² 0.75 on a held-out future window is strong and honest.")

# SLIDE 16 — FASTAPI
s = new_slide(); heading(s, "Week 6: Serving API (FastAPI)", "Seven JWT-secured REST endpoints")
table(s, Inches(0.6), Inches(1.8), Inches(7.3), Inches(3.2), [
    ["Method", "Path", "Purpose"],
    ["POST", "/api/auth/token", "Issue HS256 JWT"],
    ["POST", "/api/demand/forecast", "Predict demand"],
    ["POST", "/api/trips", "Publish to raw.trips"],
    ["GET", "/api/zones · /{id}", "Zone catalog"],
    ["GET", "/api/vehicles/{zone_id}", "Latest vehicles"],
    ["GET", "/api/health", "Liveness + model_loaded"],
], col_widths=[Inches(1.4), Inches(3.3), Inches(2.6)], fsize=12)
bullets(s, Inches(8.2), Inches(1.85), Inches(4.5), Inches(3.4), [
    {"t": "Heuristic mode (default) — deterministic, <5 ms, slim image", "bold": True},
    {"t": "PySpark mode — PYSPARK_ENABLED=1 loads GBT model", "bold": True},
    "Lazy init — Cassandra/Kafka on first call",
], size=13, gap=10)
placeholder(s, Inches(8.2), Inches(5.0), Inches(4.5), Inches(1.2), "Swagger UI", "http://localhost:8000/docs")
notes(s, "Smart fallback: heuristic by default so it runs in a tiny image; Spark only when enabled. /api/trips closes the loop into Kafka→Flink.")

# DIVIDER PLATFORM
divider("Cross-Cutting", "Storage · Observability · Deployment", "MinIO · Grafana · Docker Compose · Testing")

# SLIDE 17 — MINIO
s = new_slide(); heading(s, "Storage & Data Lake (MinIO)", "One S3-compatible lake, four lifecycle zones")
table(s, Inches(0.6), Inches(1.8), Inches(7.3), Inches(2.6), [
    ["Bucket", "Writer", "Reader"],
    ["raw/", "manual upload", "Spark ETL"],
    ["curated/", "Spark ETL, Flink ckpt", "Spark ML, recovery"],
    ["mldata/", "Spark ML", "FastAPI"],
    ["kafka-archive/", "Kafka Connect", "Spark replay"],
], fsize=13)
bullets(s, Inches(0.6), Inches(4.7), Inches(7.3), Inches(1.2), [
    {"t": "Why MinIO not HDFS: single binary, S3 API for all engines, no NameNode", "bold": True},
], size=14)
placeholder(s, Inches(8.2), Inches(1.9), Inches(4.5), Inches(3.2), "MinIO console — 4 buckets", "http://localhost:9001")
notes(s, "MinIO is the connective tissue. Spark, Flink, Connect all use one S3 API. HDFS would need different connectors + a NameNode.")

# SLIDE 18 — GRAFANA
s = new_slide(); heading(s, "Observability (Grafana)", "Live dashboards read Cassandra directly")
bullets(s, Inches(0.6), Inches(1.8), Inches(7.0), Inches(4.0), [
    "Plugin: hadesarchitect-cassandra-datasource (CQL :9042)",
    "Dashboard 'CasaMotion — Live Pipeline', 5 s refresh, $date_bucket",
    {"t": "Panels: road-snapped geomap, demand heatmap, active vehicles, pending requests, trips-by-status", "bold": True},
    "snap_dist_m surfaced for road-realism checks",
], size=14, gap=10)
placeholder(s, Inches(8.0), Inches(1.9), Inches(4.7), Inches(3.4), "Grafana — taxis on streets + demand", "http://localhost:3000")
notes(s, "Grafana talks straight to Cassandra. The geomap shows taxis on real roads; we expose snap distance for verification.")

# SLIDE 19 — REALISM FIX
s = new_slide(); heading(s, "Engineering Case Study", "The vehicle-map realism fix")
bullets(s, Inches(0.6), Inches(1.8), Inches(12.0), Inches(3.5), [
    {"t": "Symptom: taxis fixed/off-road (centroid+jitter overwrote live coords)", "bold": True},
    "Fixes: GPS_DISPLAY_MODE=road default; producer road-snaps after noise, rejects > 80 m; added snap_dist_m; 32 dashboard queries updated",
    {"t": "Verify: check-vehicle-movement.ps1 — 4 checks PASS", "bold": True},
    "The bug spanned FOUR layers: producer, Flink, Cassandra schema, Grafana — all fixed + automated checker",
], size=15, gap=12)
notes(s, "A great full-pipeline debugging example: the bug spanned four layers; we fixed all and wrote a checker to prevent regression.")

# SLIDE 20 — DEPLOYMENT
s = new_slide(); heading(s, "Deployment (Docker Compose)", "One command brings up 16 containers")
bullets(s, Inches(0.6), Inches(1.8), Inches(12.0), Inches(3.0), [
    {"t": "docker compose up -d → Kafka, Connect, Kafka UI, MinIO, Cassandra, Flink, Spark, Grafana, Jupyter, producers, API", "bold": True},
    "Healthchecks gate dependent services; named volumes persist state; network taasim-net",
    "Ops scripts: register-connectors, ensure-cassandra-schema, submit-flink-jobs, verify-flink-jobs",
], size=15, gap=11)
placeholder(s, Inches(0.6), Inches(4.9), Inches(12.1), Inches(1.4), "docker compose ps (all healthy) + demo-healthcheck.ps1", "")
notes(s, "Reproducible from a single compose file. The healthcheck script verifies all 16 containers, 3 Flink jobs, and data freshness.")

# SLIDE 21 — TESTING
s = new_slide(); heading(s, "Testing & Validation", "Evidence-driven, not claim-driven")
bullets(s, Inches(0.6), Inches(1.8), Inches(12.0), Inches(4.2), [
    {"t": "Demo healthcheck: 16 checks — containers, Flink RUNNING, vehicle_positions 3.5 s, demand_zones 84 s, trips today", "bold": True},
    {"t": "Movement realism: 4 checks pass (8/8 distinct, 139/139 moving, 200/200 within 100 m, 80/80 in bbox)", "bold": True},
    "Late-event/watermark test: scripts/test_late_events.py",
    "ML validation: temporal split, baseline-beat table, per-zone RMSE",
], size=15, gap=12)
notes(s, "Everything we claim, we verify with a script. Freshness numbers and realism checks are reproducible live during the demo.")

# SLIDE 22 — PERFORMANCE
s = new_slide(); heading(s, "Performance — Targets vs Measured", "We meet or beat every measured target")
table(s, Inches(0.6), Inches(1.8), Inches(12.1), Inches(4.6), [
    ["Metric", "Target", "Measured"],
    ["Trip match latency (P95)", "< 5 s", "≈ 1.2 s ✅"],
    ["GPS position freshness", "< 15 s", "≈ 4 s ✅"],
    ["Demand zone updates", "every 30 s", "30 s tumbling ✅"],
    ["Spark Porto ETL (1.7M)", "< 5 min", "43 MiB Parquet ✅"],
    ["Flink checkpoints", "60 s cadence", "25 consecutive, 0 failures ✅"],
    ["ML forecast API", "< 500 ms @ 20 RPS", "🟡 Locust run pending"],
], col_widths=[Inches(4.6), Inches(3.3), Inches(4.2)], fsize=13)
notes(s, "We meet or beat every measured target. The open item is a formal load test of the forecast API — queued in Week 7.")

# SLIDE 23 — DEMO FLOW
s = new_slide(); heading(s, "Final Demo Flow", "End-to-end in five live steps")
bullets(s, Inches(0.6), Inches(1.9), Inches(12.0), Inches(4.4), [
    {"t": "1.  docker compose up -d → demo-healthcheck.ps1 (all green)", "bold": True},
    {"t": "2.  Open Grafana → taxis moving on roads, demand heatmap updating", "bold": True},
    {"t": "3.  POST /api/auth/token then POST /api/trips in Swagger", "bold": True},
    {"t": "4.  Watch the trip get matched in Grafana + Cassandra row appear", "bold": True},
    {"t": "5.  POST /api/demand/forecast → 30-min-ahead prediction", "bold": True},
], size=16, gap=13)
notes(s, "One loop tells the whole story: request a trip via API → Kafka → Flink → matched → live on dashboard → then forecast 30 min ahead.")

# SLIDE 24 — KEY RESULTS
s = new_slide(); heading(s, "Key Results", "What we delivered")
bullets(s, Inches(0.6), Inches(1.7), Inches(6.1), Inches(3.4), [
    "✅ Full Kappa pipeline end-to-end",
    "✅ Sub-second matching (P95 ≈ 1.2 s), GPS freshness ≈ 4 s",
    "✅ GBT forecaster: RMSE 3.71 / R² 0.75 / −45.8%",
    "✅ Secured FastAPI (JWT, 7 routes), dual mode",
], size=14, gap=9)
bullets(s, Inches(6.8), Inches(1.7), Inches(5.9), Inches(3.4), [
    "✅ 500K synthetic Casa trips (NYC + Porto + HCP)",
    "✅ Road-snapped live vehicle map + auto verification",
    "✅ 16-container reproducible stack, healthcheck-validated",
], size=14, gap=9)
picture_card(s, "architecturev2.png", Inches(2.9), Inches(4.5), Inches(7.5))
notes(s, "Seven concrete deliverables, all verifiable. The platform runs end-to-end today.")

# SLIDE 25 — CHALLENGES
s = new_slide(); heading(s, "Challenges & Solutions", "Real problems, real fixes")
table(s, Inches(0.6), Inches(1.8), Inches(12.1), Inches(4.6), [
    ["Challenge", "Solution"],
    ["Porto coords in Portugal", "Linear bbox transform + H3 res-9 lookup"],
    ["Taxis off-road / frozen", "Road-snap + GPS_DISPLAY_MODE=road + snap_dist_m"],
    ["Low match rate (4.2%)", "Fleet 2000 @ 50× → 21%; adjacent fan-out"],
    ["Label leakage in features", "Removed supply*, temporal split, lag-only"],
    ["No open Casablanca dataset", "Synthesize from NYC + Porto + HCP/Glovo"],
    ["API needs Spark, image slim", "Heuristic fallback + optional PYSPARK_ENABLED"],
], col_widths=[Inches(4.8), Inches(7.3)], fsize=13)
notes(s, "Each row is a real problem and a real fix. The leakage catch and road-snap fix show the most technical depth.")

# SLIDE 26 — FUTURE
s = new_slide(); heading(s, "Future Improvements (Week 7–8)", "What's next")
bullets(s, Inches(0.6), Inches(1.8), Inches(12.0), Inches(4.4), [
    {"t": "Security hardening: rotate JWT_SECRET, HTTPS/TLS, Kafka SASL + topic ACLs", "bold": True},
    "Integration tests: pytest + GitHub Actions, assert P95 < 5 s over 200 trips",
    "SLA load test: Locust, 20 RPS, forecast API p99 < 500 ms",
    "Checkpoint-recovery demo: kill a TaskManager, prove resume from MinIO, no duplicates",
    "Idle-cruising GPS behavior to raise match rate further",
    "Week 8: live demo, pitch deck, technical report",
], size=15, gap=11)
notes(s, "Feature-complete through Week 6. Week 7 = hardening + SLAs; Week 8 = polished demo. Open cahier items: Kafka ACLs + checkpoint-recovery recording.")

# DIVIDER TECHNICAL
divider("Backup / For the Jury", "Technical Deep-Dive", "Serialization · Kafka · Flink · MinIO vs HDFS · GBT · Guarantees")

# T1 — SERIALIZATION
s = new_slide(); heading(s, "T1 · Serialization & Deserialization", "How events become bytes and back")
bullets(s, Inches(0.6), Inches(1.8), Inches(12.0), Inches(3.6), [
    {"t": "Serialize = object → bytes for Kafka. Deserialize = bytes → object on consume.", "bold": True},
    "Format = JSON: producers json.dumps(event).encode('utf-8'); Flink json.loads(bytes)",
    "Why JSON over Avro/Protobuf: human-readable + debuggable in Kafka UI, no schema-registry service",
    "Inside Flink: state serialized into RocksDB, then checkpointed to MinIO",
], size=15, gap=11)
add_text(s, Inches(0.6), Inches(5.5), Inches(12.0), Inches(1.0),
         [[("Trade-off (honest): ", 14, CYAN, True), ("Avro/Protobuf would be more compact and schema-enforced — a documented future optimization.", 14, INK, False)]])
notes(s, "Everything on the wire is JSON for readability and zero-ops. Flink serializes keyed state into RocksDB, checkpointed to MinIO.")

# T2 — KAFKA CONTRACT
s = new_slide(); heading(s, "T2 · Kafka Topic & Partition-Key Contract", "Deliberate keys, no wasted shuffle")
table(s, Inches(0.6), Inches(1.8), Inches(12.1), Inches(3.4), [
    ["Topic", "Key", "Produced by", "Consumed by"],
    ["raw.gps", "taxi_id", "GPS producer", "Flink Job 1"],
    ["raw.trips", "origin_zone", "trip producer", "Flink Jobs 2 & 3"],
    ["processed.gps", "taxi_id", "Job 1", "Job 2"],
    ["processed.demand", "zone_id", "Job 2", "dashboards"],
    ["processed.matches", "trip_id", "Job 3", "dashboards"],
], fsize=13)
add_text(s, Inches(0.6), Inches(5.5), Inches(12.0), Inches(0.8),
         [[("4 partitions · 7-day retention · JSON. Keys align with Flink keyBy → no network reshuffle.", 14, INK, True)]])
notes(s, "Keying GPS on taxi_id and trips on origin_zone lines up the keyBy with Kafka partitioning, avoiding an extra network shuffle.")

# T3 — FLINK INTERNALS
s = new_slide(); heading(s, "T3 · Flink Internals", "How the real-time engine is wired")
bullets(s, Inches(0.6), Inches(1.8), Inches(7.0), Inches(4.2), [
    {"t": "JobManager = coordinator; TaskManagers = workers (12 slots)", "bold": True},
    "Each job = Kafka source → keyBy → stateful process fn → sinks",
    {"t": "State = RocksDB (on-disk, large keyed state)", "bold": True},
    {"t": "Checkpoints 60 s → MinIO, EXACTLY_ONCE; offsets commit with checkpoint", "bold": True},
    "Event-time + watermarks; Cassandra via execute_async",
], size=14, gap=10)
picture_card(s, "flink_architecture.png", Inches(7.9), Inches(1.9), Inches(4.8))
notes(s, "RocksDB holds state; checkpoints snapshot it to MinIO every minute with Kafka offsets; exactly-once means crashes resume with no duplicates.")

# T4 — MINIO VS HDFS
s = new_slide(); heading(s, "T4 · MinIO vs HDFS", "Why an object store, not a block file system")
table(s, Inches(0.6), Inches(1.8), Inches(12.1), Inches(3.4), [
    ["", "HDFS", "MinIO (chosen)"],
    ["Model", "Distributed file system (blocks)", "Object store (key→object, S3)"],
    ["Metadata", "Central NameNode (SPOF)", "No central namenode"],
    ["Redundancy", "128 MB blocks ×3", "Erasure coding"],
    ["Access", "hdfs:// client", "s3a:// — Spark, Flink, Connect"],
    ["Ops", "NameNode + DataNodes + quorum", "Single stateless container"],
], col_widths=[Inches(2.2), Inches(4.7), Inches(5.2)], fsize=13)
add_text(s, Inches(0.6), Inches(5.6), Inches(12.0), Inches(0.9),
         [[("One line: ", 14, CYAN, True), ("HDFS = block file system + central metadata server; MinIO = stateless S3 object store — better for a multi-engine Kappa stack.", 14, INK, False)]])
notes(s, "Three engines all need the same storage. MinIO shares one S3 API; HDFS would need separate connectors + a NameNode to keep alive.")

# T5 — GBT VS RF
s = new_slide(); heading(s, "T5 · GBT vs Random Forest vs Baseline", "Why boosting won")
table(s, Inches(0.6), Inches(1.8), Inches(12.1), Inches(3.0), [
    ["", "Naive 7d-lag", "Random Forest", "GBT (chosen)"],
    ["Logic", "repeat last week", "average parallel trees (bagging)", "sequential trees fix error (boosting)"],
    ["Reduces", "—", "variance", "bias → best on tabular"],
    ["RMSE", "6.84", "> GBT", "3.71"],
], col_widths=[Inches(1.8), Inches(2.8), Inches(3.7), Inches(3.8)], fsize=13)
add_text(s, Inches(0.6), Inches(5.2), Inches(12.0), Inches(1.0),
         [[("GBT handles non-linear demand, mixed types (no scaling), interactions for free. ", 14, INK, False),
           ("−45.8% vs baseline, R² 0.75, all 16 zones improve.", 14, CYAN, True)]])
notes(s, "Random Forest cuts variance via bagging; GBT lowers bias via boosting and wins on tabular. We beat the mandatory baseline by 45.8%.")

# T6 — GUARANTEES
s = new_slide(); heading(s, "T6 · Two Correctness Guarantees", "Trust the numbers, protect the rider")
bullets(s, Inches(0.6), Inches(1.9), Inches(12.0), Inches(4.2), [
    {"t": "Exactly-once: Flink checkpoints (RocksDB→MinIO every 60 s) commit together with Kafka offsets → crash resumes with NO duplicate matches/counts", "bold": True},
    {"t": "Out-of-order safety: 3-min watermarks in Job 1 absorb the producer's 5% blackout (60–180 s late pings)", "bold": True},
    {"t": "Privacy by design: GPS_DISPLAY_MODE=anonymized snaps raw lat/lon to centroid + hash jitter BEFORE the Cassandra write — raw coordinate never persists", "bold": True},
], size=15, gap=14)
notes(s, "Two guarantees a jury cares about: exactly-once correctness (no inflated counts) and privacy (raw coordinate never reaches the DB).")

# SLIDE 27 — CLOSING
s = new_slide(NAVY)
accent_bar(s)
logo = _img("logowithoubackground.png")
if logo:
    s.shapes.add_picture(logo, Inches(3.4), Inches(0.7), width=Inches(6.5))
add_text(s, Inches(0.6), Inches(2.6), Inches(12.1), Inches(0.7),
         [[("Thank you", 32, WHITE, True)]], align=PP_ALIGN.CENTER)
team = _img("meetourteam.png")
if team:
    s.shapes.add_picture(team, Inches(3.7), Inches(3.5), width=Inches(6.0))
add_text(s, Inches(0.6), Inches(6.6), Inches(12.1), Inches(0.7),
         [[("Real-time mobility intelligence · Kappa architecture · 16 containers · ML-backed   ·   github.com/mohamedamineelabidi/CasaMotion", 12, MUTED, False)]],
         align=PP_ALIGN.CENTER)
notes(s, "We built a complete, real-time, ML-powered mobility platform for Casablanca — every claim backed by code and a verification script.")

# APPENDIX — URLS
s = new_slide(); heading(s, "Appendix · Live Service URLs", "Where everything runs")
table(s, Inches(0.6), Inches(1.8), Inches(12.1), Inches(3.6), [
    ["Service", "URL", "Creds"],
    ["Grafana", "http://localhost:3000", "admin / admin"],
    ["Flink UI", "http://localhost:8081", "—"],
    ["Spark Master", "http://localhost:8080", "—"],
    ["MinIO Console", "http://localhost:9001", "minioadmin / minioadmin"],
    ["Kafka UI", "http://localhost:8090", "—"],
    ["FastAPI Swagger", "http://localhost:8000/docs", "JWT"],
], col_widths=[Inches(3.0), Inches(5.6), Inches(3.5)], fsize=13)
add_text(s, Inches(0.6), Inches(5.7), Inches(12.0), Inches(0.6),
         [[("Defense Q&A flashcards (15 questions) are in presentation/qa.html", 13, CYAN, True)]])
notes(s, "The six URLs I'll open during the live demo. The Q&A page covers the 15 most likely jury questions.")

# =========================================================================
out = os.path.join(HERE, "casamotion.pptx")
prs.save(out)
print(f"Saved {out}  ({len(prs.slides.__iter__.__self__._sldIdLst)} slides)")
