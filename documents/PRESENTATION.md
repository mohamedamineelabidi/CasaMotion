# CasaMotion — Full Project Presentation

> Real-time urban mobility intelligence platform for Casablanca
> Slide-by-slide deck. Each slide = one section. Convert to PowerPoint/PDF with
> Marp, Pandoc, or `reveal.js`. Screenshots referenced from `img/` and live
> services (Grafana :3000, Flink UI :8081, Kafka UI :8090, Swagger :8000/docs).

---

## Slide 1 — Title

### CasaMotion — Transport as a Service
**Real-time urban mobility simulation platform for Casablanca, Morocco**

- Kafka · Flink · Spark · Cassandra · MinIO · FastAPI · Grafana · Docker
- Kappa streaming architecture, 16-container stack, ML demand forecasting
- Built over 6 delivery weeks + a parallel Phase-4 data-synthesis track

**Visual to attach:** `img/logowithoubackground.png` (logo) + `img/meetourteam.png` (team banner)

**Speaker notes:** "CasaMotion turns Casablanca's fragmented taxi market into a real-time data platform. In the next slides I'll walk through the problem, the architecture, and exactly what we built week by week — from raw GPS streams all the way to a deployed forecasting API and live dashboards."

---

## Slide 2 — The Problem

### Casablanca: 4 million people, zero shared mobility data

- **No shared data layer** — grand taxis, petits taxis, minibuses run with no GPS, no booking, no schedule
- **Demand blindness** — drivers cruise empty; riders wait with no visibility
- **No interoperability** — ONCF rail, BRT, and taxis share no data or ticketing
- **Cash-only** — no trip history, no analytics, no personalization
- **Underserved periphery** — Bouskoura, Sidi Moumen grow faster than routes

> The core problem is not a shortage of vehicles — it is the absence of a data layer connecting supply to demand.

**Visual to attach:** `img/painpoint.png`

**Speaker notes:** "Every pain point here is a *data* problem, not a vehicle problem. That framing is the foundation of the whole project — we treat mobility as a data-engineering challenge."

---

## Slide 3 — The Solution & Objectives

### Treat urban mobility as a data-engineering problem

- **Dynamic rider-vehicle matching** — nearest taxi in under 5 seconds
- **Demand surge forecasting** — trips per zone predicted 30 minutes ahead
- **Unified city-wide visibility** — live heatmaps, KPI dashboards, coverage gaps
- **Data-driven planning** — identify zones where demand exceeds supply

**Project objectives (cahier des charges):** real-time ingestion, event-time stream processing, serving DB, batch ML, dashboards, secured API.

**Visual to attach:** `img/projectoverview.png`

**Speaker notes:** "Four concrete capabilities. Each maps to a measurable target later in the deck — sub-5s match, 30-minute forecast horizon, live dashboards, and zone-level supply/demand."

---

## Slide 4 — Architecture Overview (v2)

### Kappa architecture — Kafka is the single source of truth

- **Producers** → **Kafka (KRaft)** → **Flink (3 jobs)** → **Cassandra** → **Grafana / FastAPI**
- **MinIO** = data lake (raw / curated / mldata / kafka-archive)
- **Spark** = offline only (ETL + ML training), never serves live queries
- 16 Docker containers on one network (`taasim-net`)

**Visual to attach:** `img/architecturev2.png` (full-width authoritative diagram)

**Speaker notes:** "This is the master map. Everything I describe afterward is a block on this diagram. Note the strict rule: Flink does all real-time work; Spark is batch-only. Kafka is replayable and is our system of record — that's what makes this *Kappa*, not Lambda."

---

## Slide 5 — Why These Technologies (key decisions)

### Every choice has a documented rationale (ADR v1)

| Choice | Over | Why |
|---|---|---|
| Kappa | Lambda | One processing layer; Kafka is replayable |
| Kafka KRaft | + ZooKeeper | One fewer service, faster failover |
| Flink | Kafka Streams / Spark Streaming | True event-time windows, sub-second latency |
| Cassandra | Postgres / Redis | Query-driven partitioning, native TTL, write-optimized |
| MinIO | HDFS | S3 API works for Spark + Flink + Connect; no NameNode |
| JSON on wire | Avro | Debuggable in Kafka UI, no schema registry |
| H3 res-9 lookup | point-in-polygon per event | O(1) dict lookup vs O(16) ray-cast |

**Visual to attach:** Screenshot of `documents/07_adr_v1.md` rendered

**Speaker notes:** "These trade-offs are the questions a jury will ask. The headline: MinIO not HDFS because we need an *object store* with an S3 API that three engines all speak; Flink not Spark Streaming because micro-batch latency can't hit sub-5-second matching."

---

## Slide 6 — Week 1: Foundation (Stack + Data + Zones)

### Stand up the platform and prepare the geography

- **Docker Compose stack** provisioned — Kafka, MinIO, Cassandra, Flink, Spark, Grafana, Jupyter
- **Datasets uploaded to MinIO** — Porto (1.8 GiB) + NYC TLC
- **Porto EDA notebook** — understand 1.7M trips, GPS polylines
- **Zone remapping** — Porto bbox → Casablanca, **16 arrondissements** (v4 geographic redesign)
- **Kafka producers v1** — GPS + trip requests

**Problem faced:** Porto coordinates are in Portugal; needed a faithful transform to Casablanca that respects 16 real arrondissement shapes.
**Solution:** linear bbox transform + H3 res-9 lookup table (`h3_zone_lookup.json`) for O(1) zone assignment.

**Visual to attach:** `notebooks/01_porto_eda.ipynb` output + `notebooks/02_zone_remapping_v4.ipynb` Casablanca zone map (`notebooks/casablanca_ae_map.html`)

**Speaker notes:** "Week 1 is the skeleton. The hard part wasn't Docker — it was the geography. We mapped Porto trips onto 16 Casablanca arrondissements and pre-computed an H3 lookup so every later GPS event resolves its zone in O(1)."

---

## Slide 6.1 — Zone Remapping (Step 1): How we draw Casablanca's 16 zones

### Why irregular arrondissements, not a grid or hexagons

| Approach | Why we rejected it |
|---|---|
| Uniform 500 m grid | Splits real neighbourhoods (Sidi Belyout) in half, merges others |
| H3 res-8 hexagons (~260) | Too many to reason about, no administrative meaning |
| **Irregular arrondissement polygons** ✅ | Match real admin boundaries, survive OSM renames |

**How the 16 polygons are built (`notebooks/02_zone_remapping_v4.ipynb`):**

- **9 zones** = official **OpenStreetMap** admin-boundary polygons (clean, published)
- **7 zones** = **Voronoi cells** seeded on named OSM place-nodes for northern suburbs OSM hasn't published yet, then clipped to the Casa urban-area boundary
- All polygons clipped to remove ocean slivers and overlaps
- Output: `data/zone_mapping_v4.csv` + `notebooks/casablanca_ae_map.html`

> **Honesty note:** the 7 Voronoi zones are a *demand-aggregation scaffold*, not a cartographic claim — every downstream stage treats all 16 as abstract `zone_id`s.

**Visual to attach:** `notebooks/casablanca_ae_map.html` rendered (16 coloured polygons) + an OSM admin-boundary screenshot

**Speaker notes:** "We deliberately use real, irregular arrondissement shapes instead of a grid because demand follows neighbourhoods, not squares. Nine come straight from OpenStreetMap admin boundaries; for the seven northern suburbs OSM hasn't drawn yet, we generate Voronoi cells around named OSM place-nodes and clip them to the city. This keeps every zone geographically meaningful."

---

## Slide 6.2 — Zone Remapping (Step 2): The A–E activity score (population + OSM + commerce)

### Every zone gets an activity tier from a weighted multi-source formula

$$\text{score}_z = 0.30\,c_z + 0.40\,\rho_z + 0.20\,d_z + 0.10\,t_z$$

(all four features min-max normalised to [0, 1])

| Symbol | Feature | How computed | Source | Weight |
|---|---|---|---|---:|
| $\rho_z$ | Population density | `pop_2024 / area_km²` | **HCP 2024 census** | **0.40** |
| $c_z$ | Commerce weight | Glovo `commerce_weight_sum` of H3 cells in zone | **Glovo** | **0.30** |
| $d_z$ | POI diversity | distinct `commerce_types` in zone | **Glovo** | **0.20** |
| $t_z$ | Transit hubs | tram / BRT stops inside zone (spatial join) | **OpenStreetMap** | **0.10** |

**Why these weights:** population density dominates (0.40) because taxi demand scales with residents/km²; commerce (0.30) captures business-district pull beyond residents; diversity (0.20) drives cross-zone trips; transit (0.10) is a positive last-mile transfer signal.

**A–E quantile cut `[2, 4, 5, 4, 1]`** → A = dense CBD (Sidi Belyout, Sbata) … E = lowest activity. Total population reconciles to HCP's **3.28 M**.

**Visual to attach:** `zone_mapping_v4.csv` opened (ae_score / ae_class columns) + A–E choropleth of Casablanca

**Speaker notes:** "This is the calculation the question is about. Each zone's activity tier is not guessed — it's computed from four real signals: HCP 2024 population density does most of the work, Glovo commerce data adds business pull, OSM transit stops add last-mile demand. We min-max normalise, weight, and quantile-cut into A–E tiers that drive every demand multiplier downstream. We verify the summed population equals HCP's 3.28 million."

---

## Slide 6.3 — Porto Simulation Strategy: warping real GPS onto Casablanca roads

### The strategic 7-stage method (`notebooks/03_porto_trajectory_warping.ipynb`)

A naive linear transform plants Porto taxis *inside Casablanca buildings*. Our strategy keeps the real motion shape but re-routes it on the actual Casa road grid:

1. **LOAD** — parse Porto `train.csv` polylines; filter 1.5–18 km, 3–30 min, 8–65 km/h
2. **SAMPLE** — stratify by trip length → 500 representative trips
3. **ASSIGN** — sample origin/dest **class** from the A–E transition matrix, then zone within class weighted by **population**
4. **AFFINE** — linear warp Porto bbox → Casa bbox (endpoints) — *this is the cahier's required linear transform*
5. **ANCHOR** — pull each endpoint toward its zone centroid (α = 0.80) + Gaussian jitter σ ≈ 160 m
6. **OSRM** — one routing call per trip → optimal **road-following** polyline on the real Casa street network
7. **PERSIST** — `curated_trajectories_v4.parquet` + `casablanca_trajectories_v4.html`

**Why OSRM over in-process A\*:** zero zigzags, uses the full OSM driving profile, no 400 MB graph in memory, responses cached for warm re-runs.

**Visual to attach:** `notebooks/casablanca_trajectories_v4.html` (warped routes on real streets) + before/after (straight-line vs road-snapped)

**Speaker notes:** "This is the Porto simulation strategy. Porto gives us authentic taxi *motion* — hundreds of GPS pings per trip with real curves. But it's in Portugal. So we sample which Casa zones a trip connects using population-weighted A–E sampling, do the linear bbox transform the spec requires, anchor the endpoints to real zone centroids, and then ask OSRM to route the trip along actual Casablanca streets using OpenStreetMap road data. The result is motion that looks like a real Moroccan taxi on real roads."

---

## Slide 6.4 — Putting it together: population + OSM drive realistic demand

### How the calculations chain into a believable Casablanca stream

```
HCP 2024 population ─┐
Glovo commerce ──────┼─► A–E activity score per zone ─► demand multipliers
OSM transit hubs ────┘                                    {A:1.8 … E:0.5}
                                                                │
OSM admin boundaries ─► 16 zone polygons ─► population-weighted │
                                            origin sampling ────┤
OSM road network (OSRM) ─► road-snapped Porto trajectories ─────┤
NYC temporal fingerprint ─► hourly/DoW curve ──────────────────►├─► casa_trip_requests
                                                                    (500K, 90 days)
```

- **Origin weight** per zone: `origin_p[z] = pop_2024[z] × ae_mult[z]` — denser, higher-tier zones generate more rides
- **Destination** sampled from tier T±1, population-weighted → realistic cross-city flow
- **Validation (8/8):** A/E per-capita demand ratio ≈ 3.6×, twin peaks 08:00/18:00, Fri-high/Sun-low, 70/30 petit/grand split

**Visual to attach:** `data/casa_synthesis/eda_figures.png` (8-panel validation) + `casa_od_matrix.parquet` 16×16 OD heatmap

**Speaker notes:** "Here's the full chain that answers 'how do you calculate all this with population and OpenStreetMap?' OSM gives us the zone shapes, the transit stops, and the road network for routing. HCP population density and Glovo commerce give each zone an activity tier, which becomes a demand multiplier. We weight trip origins by population times that multiplier, so dense central zones legitimately produce more rides than sparse peripheral ones. Finally NYC's temporal fingerprint sets *when* trips happen. Eight validation panels confirm the synthetic stream behaves like real Casablanca — a 3.6× demand gap between the busiest and quietest zones, twin rush-hour peaks, and the correct petit/grand taxi split."

---

## Slide 7 — Week 1 Deep Dive: Producers

### Two Python producers replay synthesized Casa traffic into Kafka

- **`vehicle_gps_producer.py`** → `raw.gps`, key = `taxi_id`
  - COUPLED mode (default): interpolate along OSRM polyline, ±20 m noise, 5% blackout, road-snap
  - H3 res-9 → zone lookup, ring fallback r=1..5
- **`trip_request_producer.py`** → `raw.trips`, key = `origin_zone`
  - Hourly demand multiplier (peaks 08:00 / 18:00), petit/grand fleet split, MAD tariffs
- **Wire format:** JSON (`json.dumps().encode()`), `acks=all`, `retries=3`

**Visual to attach:** `img/flink_architecture.png` (producer architecture) + Kafka UI showing `raw.gps` / `raw.trips` messages

**Speaker notes:** "Producers are the data source. Coupled mode is the clever bit: each trip request is paired with a real routed polyline so taxis move on actual streets, not in straight lines. Partition keys are chosen so Flink can keyBy without a reshuffle."

---

## Slide 8 — Week 2: Storage Layer (Connect + Cassandra + ADR)

### Persist the streams and lock the data model

- **Kafka Connect S3 Sink** — `raw.gps` + `raw.trips` → `s3://kafka-archive/YYYY/MM/DD/HH/`
- **Cassandra schema** — 3 tables, INSERT + SELECT tested
- **ADR v1 written** — Kappa, partition keys, MinIO zones, retention

**Cassandra schema (query-driven, not normalized):**

| Table | Partition key | Clustering | TTL |
|---|---|---|---|
| `vehicle_positions` | `(city, zone_id)` | `event_time DESC` | 24 h |
| `demand_zones` | `(city, zone_id)` | `window_start DESC` | 7 d |
| `trips` | `(city, date_bucket)` | `created_at DESC` | — |

**Problem faced:** an unbounded `casablanca` partition for trips would grow forever.
**Solution:** `date_bucket` ("YYYY-MM-DD") caps each partition (< 100 MB Cassandra guidance).

**Visual to attach:** MinIO console showing `kafka-archive/` hourly folders + `cqlsh DESCRIBE TABLE` output

**Speaker notes:** "Cassandra tables are designed around the *queries* — 'all vehicles in a zone', 'trips on a day'. That's why the partition keys look the way they do. The ADR documents every one of these decisions for defensibility."

---

## Slide 9 — Week 3: Real-Time Processing (Flink Jobs 1–3)

### Three PyFlink jobs turn raw events into serving state

- **Job 1 — GPS Normalizer:** `raw.gps` → validate, dedup (ValueState), H3 zone, road-snap/anonymize → `vehicle_positions` + `processed.gps`
- **Job 2 — Demand Aggregator:** `processed.gps` + `raw.trips` → 30s tumbling event-time windows → `demand_zones` + `processed.demand`
- **Job 3 — Trip Matcher:** keyBy zone, MapState of vehicles, immediate adjacent-zone fan-out + dedup → `trips` + `processed.matches`
- **Checkpoints:** RocksDB, EXACTLY_ONCE, 60s, to `s3://curated/flink-checkpoints`
- **Watermarks:** 3-min lateness (Job 1) covers producer blackouts; 10s + idleness (Jobs 2/3)

**Visual to attach:** `img/streamproce_architec.png` + Flink Web UI (:8081) showing 3 RUNNING jobs / 12 slots

**Speaker notes:** "This is the heart of the system. Watermarks are key — they let Flink emit correct 30-second demand windows even when GPS pings arrive late after a blackout. Note we use the cassandra-driver inside the process function with execute_async, not the official connector, because PyFlink integration is cleaner that way."

---

## Slide 10 — Week 3 Deep Dive: Trip Matching & Anonymization

### Sub-second matching + privacy by design

- **Matching cost:** `0.7 · haversine_km + 0.3 · idle_bonus`
- **Adjacent fan-out:** if origin zone has no free taxi, neighbors compete in parallel; first with a vehicle wins via a shared `Set<trip_id>` dedup
- **Measured match latency P95 ≈ 1.2 s** (target < 5 s)
- **Anonymization mode:** `GPS_DISPLAY_MODE=anonymized` snaps to zone centroid + deterministic hash jitter — raw lat/lon never persisted

**Problem faced:** initial match rate only 4.2% (fleet 500, 10× speed).
**Solution:** scaled to fleet 2000 @ 50× → **21% matched**; remaining no_vehicle is density-bound (coupled taxis only emit during active trips).

**Visual to attach:** Grafana "Trips by Status" pie (matched vs no_vehicle) + Cassandra `trips` sample row

**Speaker notes:** "Two things to highlight: the adjacent-zone fan-out gives us 1.2s P95, and the anonymization mode satisfies the privacy requirement — we can prove the raw coordinate never reaches the database."

---

## Slide 11 — Week 5: Batch ETL with Spark (offline)

### Spark cleans the donor datasets into curated Parquet

- **Porto ETL** — 1,710,670 raw → 1,660,794 valid trips → `s3://curated/trips/` (43 MiB, 12 partitions)
- **NYC TLC ETL** — 9.38M raw → 8.81M cleaned → **192K demand-aggregation rows** → `s3://curated/nyc-demand/`
- **KPI analytics** — 6 datasets: trips_per_zone, hourly_demand, daily_pattern, zone_hour_heatmap, coverage_gaps, call_type_breakdown

**Key rule (Kappa):** NYC is **batch-only** — it never enters Kafka.

**Problem faced:** Spark image lacked numpy; jobs failed.
**Solution:** added numpy install to spark-master/worker startup; bumped RAM (worker 4g, master 3g).

**Visual to attach:** Spark Master UI (:8080) completed apps + MinIO `curated/` Parquet listing

**Speaker notes:** "Spark is strictly offline. Porto gives realistic motion; NYC gives realistic demand patterns. Both are cleaned here into curated Parquet that the ML stage consumes next."

---

## Slide 12 — The NYC Data Story (why a New York dataset?)

### NYC = demand fingerprint, never streamed, never trains the model

- **Role 1 — Trip synthesis:** borrow NYC's hourly curve, day-of-week weights, and OD-pair frequency → generate **500K Casa trip requests / 90 days** (`casa_trip_requests.parquet`)
- **Role 2 — Batch ETL exercise:** prove Spark handles a multi-GB real dataset (cahier §2.2)
- Spatial weights corrected to Casa with **HCP 2024 census + Glovo** activity
- Validation: 8/8 checks (fleet 70.6% petit / 29.4% grand, A/E ratio 3.65×, peaks 08/18/19)

**Visual to attach:** `notebooks/04_nyc_to_casa_synthesis.ipynb` EDA figures (`data/casa_synthesis/eda_figures.png`)

**Speaker notes:** "Common jury question: 'why New York?' Answer: there is no open Casablanca taxi dataset. We borrow *patterns* — not values — from NYC, then re-anchor them to Casablanca geography with census and commerce data. NYC never streams and never trains the forecaster."

---

## Slide 13 — Week 6: Feature Engineering

### Build a leakage-free feature matrix (183,981 rows)

- **Input:** `s3://curated/trips/` → **Output:** `s3://mldata/features/`
- **Target:** `demand` = trips per zone per 30-min slot (48 slots/day)
- **Features:** `hour_of_day, day_of_week, is_weekend, is_peak, slot_of_day, zone_idx, demand_lag_1d, demand_lag_7d, rolling_7d_mean`

**Problem faced (the critical fix):** an earlier draft included `supply` and `supply_demand_ratio` — both computed from the *same* 30-min slot as the target → **label leakage**.
**Solution:** removed both; kept only retrospective lag/rolling features. Used a **temporal split** (not random) at `2014-05-01`.

**Visual to attach:** screenshot of `spark/feature_engineering.py` leakage comment block + features Parquet schema

**Speaker notes:** "This slide is where we show engineering maturity. We caught and removed label leakage — that's the difference between a model that looks great in notebooks and one that fails in production. Temporal split, not random, because this is a time series."

---

## Slide 14 — Week 6: Feature Selection vs Feature Importance

### Two different concepts — we did both

- **Selection (before training):** a feature is allowed in only if it is *knowable in advance* and *doesn't leak the target* → removed `supply`, `supply_demand_ratio`
- **Importance (after training):** GBT `featureImportances` reports which inputs the trees actually split on

| Rank | Feature | Importance | Why |
|---|---|---|---|
| 1 | `demand_lag_1d` | ~0.38 | yesterday-same-slot |
| 2 | `rolling_7d_mean` | ~0.24 | the zone's normal level |
| 3 | `hour_of_day` | ~0.17 | morning/evening peaks |

**Visual to attach:** training-log screenshot showing the 9 logged importances

**Speaker notes:** "We didn't hand-pick three features. We selected nine on causal grounds, trained on all nine, and *report* the importances as evidence the model learned something sensible. Lag-1-day dominating is exactly what a transport analyst would expect."

---

## Slide 15 — Week 6: GBT Model Training & Results

### Gradient Boosted Trees beat the mandatory baseline by 45.8%

- **Algorithm:** Spark MLlib `GBTRegressor` (`maxDepth=5, maxIter=50, stepSize=0.1`)
- **Pipeline:** `StringIndexer → VectorAssembler → GBTRegressor`
- **Split:** temporal — Train 151,911 / Test 32,070
- **Artifact:** `s3://mldata/models/demand_v1/`

| Metric | GBT v1 | Naive 7d-lag | Improvement |
|---|---:|---:|---:|
| RMSE | **3.71** | 6.84 | **−45.8%** |
| MAE | **2.11** | — | — |
| R² | **0.75** | — | — |

Every one of the 16 zones beats the baseline (per-zone RMSE Parquet).

**Visual to attach:** metrics table from `documents/10_week6_ml_pipeline.md` + per-zone RMSE bar chart

**Speaker notes:** "The cahier requires beating a naive 7-day-lag baseline. We beat it globally by 45.8% and in every single zone. R² of 0.75 on a held-out future window is a strong, honest result."

---

## Slide 16 — Week 6: Serving API (FastAPI)

### Seven JWT-secured REST endpoints

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/token` | Issue HS256 JWT (rider/admin) |
| POST | `/api/demand/forecast` | Predict demand for (zone, datetime) |
| POST | `/api/trips` | Publish trip request to `raw.trips` |
| GET | `/api/zones` · `/api/zones/{id}` | Zone catalog |
| GET | `/api/vehicles/{zone_id}` | Latest vehicles from Cassandra |
| GET | `/api/health` | Liveness + `model_loaded` |

- **Heuristic mode (default)** — deterministic curve, <5 ms, slim image
- **PySpark mode** — `PYSPARK_ENABLED=1` loads the GBT PipelineModel
- **Lazy init** — Cassandra & Kafka clients created on first call

**Visual to attach:** Swagger UI at `http://localhost:8000/docs`

**Speaker notes:** "The API has a smart fallback: it serves a heuristic forecast by default so it runs in a tiny Python image, and only spins up Spark when explicitly enabled. The `/api/trips` route closes the loop — a POST here becomes a Kafka event that Flink matches in real time."

---

## Slide 17 — Storage & Data Lake (MinIO)

### One S3-compatible lake, four lifecycle zones

| Bucket | Writer | Reader |
|---|---|---|
| `raw/` | manual upload | Spark ETL |
| `curated/` | Spark ETL, Flink checkpoints | Spark ML, Flink recovery |
| `mldata/` | Spark ML | FastAPI |
| `kafka-archive/` | Kafka Connect | Spark replay |

- **Why MinIO not HDFS:** single binary, S3 API for all engines, no NameNode
- S3A config in `config/spark-defaults.conf`; Flink checkpoints via S3 plugin

**Visual to attach:** MinIO console (:9001) showing the four buckets

**Speaker notes:** "MinIO is the connective tissue. Spark writes Parquet, Flink writes checkpoints, Kafka Connect writes archives — all through the same S3 API. With HDFS each of those would need a different connector and a NameNode to babysit."

---

## Slide 18 — Observability (Grafana)

### Live dashboards read Cassandra directly

- Plugin: `hadesarchitect-cassandra-datasource` (CQL over :9042)
- Dashboard: "CasaMotion — Live Pipeline (Casablanca)", 5s refresh, `$date_bucket` variable
- Panels: **road-snapped vehicle geomap**, demand heatmap, active vehicles, pending requests, trips-by-status, recent GPS events
- `snap_dist_m` surfaced for road-realism inspection

**Visual to attach:** Grafana dashboard (:3000) — geomap with taxis on streets + demand panels

**Speaker notes:** "Grafana talks straight to Cassandra — no aggregation service in between. The geomap shows taxis on actual roads thanks to the road-snap work; we even expose the snap distance so anyone can verify markers are near real streets."

---

## Slide 19 — The Vehicle-Map Realism Fix (engineering case study)

### From off-road, frozen markers → road-snapped live movement

- **Symptom:** taxis appeared fixed/off-road (centroid+jitter overwrote live coords)
- **Fixes:** `GPS_DISPLAY_MODE=road` default; producer road-snaps after noise, rejects > `GPS_MAX_SNAP_DIST_M` (80 m); added `vehicle_positions.snap_dist_m`; renamed panel; 32 dashboard queries updated
- **Verification:** `scripts/check-vehicle-movement.ps1` — 4 checks all PASS (distinct positions, speed/status consistency, snap threshold, bbox)

**Visual to attach:** before/after Grafana geomap screenshots

**Speaker notes:** "A great example of debugging a full pipeline: the bug spanned the producer, Flink, the Cassandra schema, and Grafana. We fixed all four layers and wrote an automated checker so the fix can't silently regress."

---

## Slide 20 — Deployment (Docker Compose)

### One command brings up 16 containers

- `docker compose up -d` → Kafka, Connect, Kafka UI, MinIO (+init), Cassandra (+init), Flink JM + TMs, Spark master/worker, Grafana, Jupyter, gps/trip producers, API
- Healthchecks gate dependent services; named volumes persist state; network `taasim-net`
- Operational scripts: `register-connectors.ps1`, `ensure-cassandra-schema.ps1`, `submit-flink-jobs.ps1`, `verify-flink-jobs.ps1`

**Visual to attach:** terminal `docker compose ps` (all healthy) + `scripts/demo-healthcheck.ps1` output

**Speaker notes:** "The whole platform is reproducible from a single compose file. The healthcheck script verifies all 16 containers, the 3 Flink jobs, data freshness, and prints service URLs — that's our pre-demo confidence check."

---

## Slide 21 — Testing & Validation

### Evidence-driven, not claim-driven

- **Demo healthcheck:** 16 checks — containers, Flink jobs RUNNING, `vehicle_positions` freshness 3.5 s, `demand_zones` 84 s, trips today
- **Movement realism:** 4 automated checks pass (8/8 taxis distinct, 139/139 moving rows speed ≥ 1, 200/200 within 100 m, 80/80 in bbox)
- **Late-event/watermark test:** `scripts/test_late_events.py`
- **ML validation:** temporal split, baseline-beat table, per-zone RMSE

**Visual to attach:** `scripts/check-vehicle-movement.ps1` + `scripts/demo-healthcheck.ps1` "ALL CHECKS PASSED" output

**Speaker notes:** "Everything we claim, we verify with a script. The freshness numbers and the realism checks are reproducible live during the demo."

---

## Slide 22 — Performance — Targets vs Measured

| Metric | Target | Measured |
|---|---|---|
| Trip match latency (P95) | < 5 s | **≈ 1.2 s** ✅ |
| GPS position freshness | < 15 s | **≈ 4 s** ✅ |
| Demand zone updates | every 30 s | 30 s tumbling ✅ |
| Spark Porto ETL (1.7M) | < 5 min | 43 MiB Parquet ✅ |
| Flink checkpoints | 60 s cadence | 25 consecutive, 0 failures ✅ |
| ML forecast API | < 500 ms @ 20 RPS | 🟡 Locust run pending |

**Visual to attach:** Grafana KPI stat panels

**Speaker notes:** "We meet or beat every measured target. The one open item is a formal load test of the forecast API — that's queued in Week 7."

---

## Slide 23 — Final Demo Flow

### End-to-end in five live steps

1. `docker compose up -d` → `scripts/demo-healthcheck.ps1` (all green)
2. Open **Grafana** → taxis moving on roads, demand heatmap updating
3. **POST `/api/auth/token`** then **POST `/api/trips`** in Swagger
4. Watch the trip get **matched** in Grafana "Trips by Status" + Cassandra row appear
5. **POST `/api/demand/forecast`** → 30-min-ahead prediction for a zone

**Visual to attach:** composite — Swagger + Grafana side by side

**Speaker notes:** "The demo tells the full story in one loop: I request a trip through the API, it flows through Kafka and Flink, gets matched, and shows up live on the dashboard — then I ask the model what demand will look like in 30 minutes."

---

## Slide 24 — Key Results

### What we delivered

- ✅ Full Kappa pipeline: Producers → Kafka → Flink (3 jobs) → Cassandra → Grafana/API
- ✅ Sub-second matching (P95 ≈ 1.2 s), GPS freshness ≈ 4 s
- ✅ GBT forecaster: RMSE 3.71 / R² 0.75 / −45.8% vs baseline, every zone improves
- ✅ Secured FastAPI (JWT, 7 routes) + heuristic/PySpark dual mode
- ✅ 500K synthetic Casa trips from NYC fingerprint + Porto motion + HCP weights
- ✅ Road-snapped live vehicle map + automated realism verification
- ✅ 16-container reproducible stack, healthcheck-validated

**Visual to attach:** `img/architecturev2.png` with green check overlays

**Speaker notes:** "Seven concrete deliverables, all verifiable. The platform runs end-to-end today."

---

## Slide 25 — Challenges & Solutions

| Challenge | Solution |
|---|---|
| Porto coords in Portugal | Linear bbox transform + H3 res-9 lookup (O(1) zones) |
| Taxis appeared off-road / frozen | Road-snap in producer + `GPS_DISPLAY_MODE=road` + schema `snap_dist_m` |
| Low match rate (4.2%) | Scale fleet 2000 @ 50× → 21%; adjacent-zone fan-out |
| Label leakage in features | Removed `supply*`, temporal split, lag-only signals |
| No open Casablanca dataset | Synthesize from NYC patterns + Porto motion + HCP/Glovo weights |
| Spark image missing numpy | Install on master/worker startup; raise RAM |
| API needs Spark but image is slim | Heuristic fallback + optional `PYSPARK_ENABLED` |

**Visual to attach:** simple before/after split graphic

**Speaker notes:** "Each row is a real problem we hit and a real fix we shipped. The leakage catch and the road-snap fix are the two I'd emphasize for technical depth."

---

## Slide 26 — Future Improvements (Week 7–8 roadmap)

### What's next

- **Security hardening:** rotate `JWT_SECRET`, HTTPS/TLS, Kafka SASL + topic ACLs
- **Integration test suite:** pytest + GitHub Actions, assert P95 < 5 s over 200 trips
- **SLA load test:** Locust, 20 RPS, forecast API p99 < 500 ms
- **Checkpoint-recovery demo:** kill a TaskManager, prove resume from MinIO, no duplicates
- **Idle-cruising GPS behavior** to raise match rate further
- **Week 8:** live demo, pitch deck, technical report

**Visual to attach:** roadmap table from `documents/00_master_status.md`

**Speaker notes:** "We're feature-complete through Week 6. Week 7 is about hardening and proving SLAs; Week 8 is the polished final demo. The two open cahier items are Kafka ACLs and the checkpoint-recovery recording."

---

## Slide 27 — Team & Closing

### CasaMotion — built by a focused engineering team

- Real-time mobility intelligence for Casablanca
- Kappa architecture, 16 containers, ML-backed, fully reproducible
- Repository: `mohamedamineelabidi/CasaMotion`

**Visual to attach:** `img/meetourteam.png` + `img/casamotionlogo.png`

**Speaker notes:** "Thank you. To summarize: we built a complete, real-time, ML-powered mobility platform for Casablanca from raw streams to a deployed API and live dashboards — and every claim in this deck is backed by code and a verification script. Happy to take questions or run the live demo."

---

# Technical Deep-Dive Slides (optional / backup)

> Promote any of these into the main flow if the audience is technical, or keep them as backup slides to answer jury questions.

---

## Slide T1 — Serialization & Deserialization on the Wire

### How events become bytes and back again

- **Serialization** = in-memory object → bytes for Kafka. **Deserialization** = bytes → object on consume.
- **Format = JSON.** Producers do `json.dumps(event).encode("utf-8")`; Flink consumers `json.loads(bytes)`.
- **Why JSON over Avro/Protobuf:** human-readable + debuggable in Kafka UI, no schema-registry service to run — fine at this volume.
- **Inside Flink:** state is serialized by Flink's own serializers into **RocksDB**, then checkpointed to MinIO.

**Trade-off (stated honestly):** Avro/Protobuf would be more compact and schema-enforced — a documented future optimization.

**Visual to attach:** Kafka UI message view (JSON payload) + a `json.dumps`/`json.loads` code snippet

**Speaker notes:** "On the wire everything is JSON. We chose readability and zero-ops over the compactness of Avro because at our event volume the difference is negligible and debuggability during a demo is worth a lot. Internally, Flink serializes its keyed state into RocksDB, which is what gets checkpointed to MinIO."

---

## Slide T2 — Kafka Topic & Partition-Key Contract

### Five topics, deliberate keys, no wasted shuffle

| Topic | Key | Produced by | Consumed by |
|---|---|---|---|
| `raw.gps` | `taxi_id` | GPS producer | Flink Job 1 |
| `raw.trips` | `origin_zone` | trip producer | Flink Jobs 2 & 3 |
| `processed.gps` | `taxi_id` | Flink Job 1 | Job 2 |
| `processed.demand` | `zone_id` | Flink Job 2 | dashboards/analytics |
| `processed.matches` | `trip_id` | Flink Job 3 | dashboards/analytics |

- **4 partitions · 7-day retention · JSON values**
- Keys are chosen so the downstream Flink `keyBy` **aligns with the partition key** → no network reshuffle.
- `taxi_id` keeps a taxi's pings ordered on one partition; `origin_zone` co-locates demand by zone.

**Visual to attach:** Kafka UI topic list + partition view

**Speaker notes:** "Partition keys aren't arbitrary. By keying GPS on taxi_id and trips on origin_zone, the Flink keyBy lines up with the Kafka partitioning, so we avoid an extra shuffle across the network. It's a small decision with a real performance payoff."

---

## Slide T3 — Flink Internals (JobManager / TaskManager / State)

### How the real-time engine is wired

- **JobManager** = coordinator; **TaskManagers** = workers (12 task slots total).
- Each job is a **dataflow graph**: Kafka source → `keyBy` → stateful process function → sinks (Cassandra + Kafka).
- **State backend = RocksDB** (on-disk, handles large keyed state).
- **Checkpoints every 60 s to `s3://curated/flink-checkpoints`**, mode **EXACTLY_ONCE**; Kafka offsets commit with the checkpoint.
- **Event-time + watermarks** drive windows so output is correct despite late/out-of-order events.
- Cassandra writes use `cassandra-driver` `execute_async` inside the process function (cleaner than the official connector for PyFlink).

**Visual to attach:** `img/flink_architecture.png` + Flink Web UI checkpoint history

**Speaker notes:** "This is what makes the real-time layer trustworthy: RocksDB holds the state, checkpoints snapshot it to MinIO every minute together with the Kafka offsets, and exactly-once means a crash resumes with no duplicate matches."

---

## Slide T4 — MinIO vs HDFS (architecture comparison)

### Why an object store, not a block file system

| | HDFS | MinIO (chosen) |
|---|---|---|
| Model | Distributed **file system** (blocks, POSIX-like) | **Object store** (key → object, S3 API) |
| Metadata | Central **NameNode** (single point of failure) | No central namenode |
| Redundancy | 128 MB blocks ×3 replicas | **Erasure coding** (less overhead) |
| Access | `hdfs://` client | `s3a://` / S3 REST — Spark, Flink, Connect all speak it |
| Ops | NameNode + DataNodes + JournalNode quorum | Single stateless container |
| Best for | Hadoop-cluster batch | Cloud-native, multi-engine lake |

**One line:** HDFS is a block file system with a central metadata server; MinIO is a stateless S3 object store — a better fit for our container-based, multi-engine Kappa stack.

**Visual to attach:** side-by-side architecture sketch (NameNode+DataNodes vs MinIO erasure set)

**Speaker notes:** "The deciding factor was that three different engines all need the same storage. With MinIO they share one S3 API; with HDFS each would need its own connector plus a NameNode we'd have to keep alive. For a demo stack in Docker, MinIO is simpler and cloud-portable."

---

## Slide T5 — GBT vs Random Forest vs Naive Baseline

### Why boosting won

| | Naive 7d-lag | Random Forest | GBT (chosen) |
|---|---|---|---|
| Logic | repeat last week | average of parallel deep trees (bagging) | sequential trees, each fixes prior error (boosting) |
| Error driver | — | reduces variance | reduces **bias** → best on tabular |
| RMSE | 6.84 | (higher than GBT) | **3.71** |
| Role | mandatory floor | candidate | deployed model |

- GBT handles **non-linear demand**, **mixed feature types** (no scaling), and **interactions** for free.
- Tuned `maxDepth=5, maxIter=50, stepSize=0.1`; **temporal split** guards against overfitting.
- **Result: −45.8% RMSE vs baseline, R² 0.75, every one of 16 zones improves.**

**Visual to attach:** metrics bar chart (baseline vs GBT) + feature-importance ranking

**Speaker notes:** "Random Forest averages independent trees to cut variance; GBT builds trees in sequence where each corrects the residual of the ensemble so far, which lowers bias and wins on structured tabular data. The naive 7-day-lag is just the floor the cahier requires us to beat — we beat it by 45.8%."

---

## Slide T6 — Two Correctness Guarantees: Exactly-Once & Anonymization

### Trust the numbers, protect the rider

- **Exactly-once processing:** Flink checkpoints (RocksDB → MinIO every 60 s) commit **together** with Kafka offsets → a crash resumes with **no duplicate** matches or demand counts.
- **Out-of-order safety:** 3-minute watermarks in Job 1 absorb the producer's 5% blackout (60–180 s late pings).
- **Privacy by design:** in `GPS_DISPLAY_MODE=anonymized`, Job 1 snaps raw lat/lon to the **zone centroid + deterministic hash jitter before** the Cassandra write — the raw coordinate **never persists**.

**Visual to attach:** Flink checkpoint history (0 failures) + a Cassandra `vehicle_positions` row showing snapped coords

**Speaker notes:** "Two guarantees a jury cares about: correctness and privacy. Exactly-once means our match counts aren't inflated by retries; anonymization means we can prove a real GPS coordinate never reaches the database — it's centroid-snapped inside Flink first."

---

## Appendix A — Repository Map (for Q&A)

```
producers/    GPS + trip Kafka producers (config.py shared boot)
flink/jobs/   gps_normalizer · demand_aggregator · trip_matcher · zone_data
spark/        etl_porto · etl_nyc · feature_engineering · train_demand_model · compute_kpis
api/          FastAPI main.py (JWT, forecast, trips, zones, vehicles)
config/       cassandra-init.cql · grafana-* · connect-s3-sink-* · spark-defaults.conf
data/         zone_mapping_v4.csv · h3_zone_lookup.json · casa_synthesis/
scripts/      submit-flink-jobs · ensure-cassandra-schema · demo-healthcheck · check-vehicle-movement
documents/    weekly evidence + ADR + deep-dive analyses
img/          architecture & branding diagrams
```

## Appendix B — Live Service URLs (for the demo)

| Service | URL | Creds |
|---|---|---|
| Grafana | http://localhost:3000 | admin / admin |
| Flink UI | http://localhost:8081 | — |
| Spark Master | http://localhost:8080 | — |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin |
| Kafka UI | http://localhost:8090 | — |
| FastAPI Swagger | http://localhost:8000/docs | JWT |

## Appendix C — Screenshot Capture Checklist

Capture these before the presentation (most slides reference them):

1. Grafana dashboard — geomap with taxis on roads (Slide 18, 19, 23)
2. Flink Web UI — 3 RUNNING jobs, 12 slots (Slide 9)
3. Kafka UI — `raw.gps` / `raw.trips` live messages (Slide 7)
4. MinIO console — 4 buckets + `kafka-archive/` folders (Slide 8, 17)
5. Swagger UI — 7 endpoints, a forecast response (Slide 16, 23)
6. `cqlsh` — `vehicle_positions` / `trips` sample rows (Slide 8, 10)
7. Spark Master UI — completed ETL/ML apps (Slide 11)
8. `demo-healthcheck.ps1` + `check-vehicle-movement.ps1` — all-pass output (Slide 20, 21)
9. ML metrics table / per-zone RMSE chart (Slide 15)
10. NYC→Casa synthesis EDA figures (Slide 12)
```

---

# Appendix D — Anticipated Professor Questions (Defense Q&A)

> 15 high-probability oral-defense questions with short, code-accurate answers. Use as flashcards.

## Q1 — Why MinIO and not HDFS / Hadoop?
- **One S3 API for three engines** — Spark, Flink, Kafka Connect all use the same `s3a://` paths.
- **Single stateless binary** — HDFS needs a NameNode (SPOF) + DataNodes + JournalNode quorum for HA.
- **Object semantics fit the workload** — immutable Parquet, checkpoints, archives.
- **Cloud-portable** — `s3a://` swaps to AWS S3 with zero code change.

## Q2 — Architectural difference between MinIO and HDFS?
HDFS = distributed **block file system** with a central **NameNode** (SPOF), 128 MB blocks ×3 replicas, `hdfs://` access. MinIO = **object store** (key→object), no central namenode, **erasure coding**, S3 `s3a://` API. **One line:** block file system + central metadata server vs stateless S3 object store.

## Q3 — Why GBT for the ML?
- Demand is **non-linear** → trees split on thresholds.
- Handles **mixed types** (categorical `zone_idx` + numeric lags), **no scaling**.
- Learns **interactions for free**; **boosting beats bagging** on tabular (lower bias than Random Forest).
- Built-in `featureImportances`, native in Spark MLlib.
- **RMSE 3.71 vs 6.84 baseline = −45.8%**, R² 0.75.

## Q4 — Why each technology?
Kafka (replayable log, KRaft, no ZooKeeper) · Flink (event-time windows + watermarks + exactly-once) · Spark (offline ETL + MLlib) · Cassandra (write-optimized, query-driven, native TTL) · MinIO (S3 API for all engines) · FastAPI (async, Swagger, JWT) · Grafana (reads Cassandra directly) · Docker Compose (one-command 16 containers) · H3 (O(1) zone lookup).

## Q5 — Serialization / deserialization?
- **Serialize** = object → bytes for Kafka; **deserialize** = bytes → object on consume.
- **JSON:** producers `json.dumps(event).encode("utf-8")`; Flink `json.loads`.
- **Why JSON:** debuggable in Kafka UI, no schema registry. Trade-off: Avro/Protobuf = more compact (future).
- Flink state serialized into **RocksDB**, checkpointed to MinIO.

## Q6 — What does each Flink job do?
- **Job 1 — GPS Normalizer:** `raw.gps` → validate, dedup, H3 zone, road-snap/anonymize → `vehicle_positions` + `processed.gps`; 3-min watermarks.
- **Job 2 — Demand Aggregator:** `processed.gps` + `raw.trips` → 30 s tumbling event-time windows → `demand_zones` + `processed.demand`.
- **Job 3 — Trip Matcher:** keyBy zone, vehicles in MapState, nearest-match + adjacent-zone fan-out + dedup → `trips` + `processed.matches`; P95 ≈ 1.2 s.

## Q7 — Flink architecture?
JobManager (coordinator) + TaskManagers (12 slots). Each job = Kafka source → keyBy → stateful process fn → sinks. **RocksDB** state, **60 s checkpoints to MinIO, EXACTLY_ONCE**, event-time + watermarks, Cassandra via `execute_async`.

## Q8 — Kafka reads from which file?
Kafka reads no files — **producers publish**. `trip_request_producer.py` reads `data/casa_synthesis/casa_trip_requests.parquet` → `raw.trips`. `vehicle_gps_producer.py` reads `gps_trajectory_index.json` + `casablanca_road_nodes.npy` → `raw.gps`.

## Q9 — Kafka topics and keys (partitioning)?
`raw.gps` key=`taxi_id`; `raw.trips` key=`origin_zone`; plus `processed.gps/demand/matches`. **4 partitions, 7-day retention, JSON.** Keys align with Flink `keyBy` → no extra shuffle.

## Q10 — Why Cassandra, how modeled?
Write-optimized, query-driven. `vehicle_positions` PK `(city, zone_id)` clustered `event_time DESC`, **TTL 24 h**. `demand_zones` TTL 7 d. `trips` partitioned by `date_bucket` (caps < 100 MB). Native TTL auto-expires; Grafana reads directly.

## Q11 — ML features and leakage?
**9 features:** `hour_of_day, day_of_week, is_weekend, is_peak, zone_idx, slot_of_day, demand_lag_1d, demand_lag_7d, rolling_7d_mean`. Target = `demand`. **Leakage fix:** removed `supply` + `supply_demand_ratio` (same-slot as target). **Temporal split** at `2014-05-01`.

## Q12 — Spark + MinIO + model connection?
`s3a://curated/trips/` → `feature_engineering.py` → `s3a://mldata/features/` → `train_demand_model.py` → `s3a://mldata/models/demand_v1/` + `metrics/`. Spark = engine (no local disk); MinIO = S3 storage; FastAPI loads the model from MinIO (`PYSPARK_ENABLED=1`).

## Q13 — Late / out-of-order events?
Producer injects 5% blackout (60–180 s late). Flink Job 1 uses **3-min bounded-out-of-orderness watermarks** → late pings still land in the right window. Satisfies the cahier.

## Q14 — How is the simulation realistic?
**Porto** = real motion (warped onto Casa roads via OSRM/OSM). **NYC** = temporal fingerprint (statistics only, never streamed). **HCP population + Glovo + OSM transit** = A–E tiers; origins weighted `population × ae_mult`. Validated: A/E ≈ 3.6×, peaks 08/18, 70/30 petit/grand.

## Q15 — Exactly-once and privacy guarantees?
**Exactly-once:** Flink checkpoints (RocksDB→MinIO every 60 s) + Kafka offset commit → resume with no duplicates. **Privacy:** `GPS_DISPLAY_MODE=anonymized` snaps raw lat/lon to zone centroid + hash jitter **before** Cassandra write — raw coords never persist.
