# Screenshots — capture checklist

These 10 live screenshots replace the placeholder cards in the deck.
Start the stack first: `docker compose up -d` then `./scripts/demo-healthcheck.ps1`.

Save each PNG into this folder using the suggested filename, then either:
- drop it onto the matching placeholder card in `casamotion.pptx`, or
- it is already referenced by relative path in `../index.html` (swap the `.ph` card for an `<img src="screenshots/NAME.png">`).

| # | Filename | Where | What to capture |
|---|----------|-------|-----------------|
| 1 | `grafana_geomap.png` | http://localhost:3000 | Live geomap — taxis moving on real roads + demand heatmap |
| 2 | `flink_jobs.png` | http://localhost:8081 | 3 jobs RUNNING (GPS Normalizer, Demand Aggregator, Trip Matcher) |
| 3 | `kafka_ui.png` | http://localhost:8090 | `raw.gps` / `raw.trips` messages flowing |
| 4 | `minio_buckets.png` | http://localhost:9001 | 4 buckets: raw / curated / mldata / kafka-archive |
| 5 | `swagger.png` | http://localhost:8000/docs | 7 endpoints expanded |
| 6 | `cassandra_rows.png` | `cqlsh` | `SELECT … FROM vehicle_positions LIMIT 10;` rows |
| 7 | `spark_ui.png` | http://localhost:8080 | Spark Master — completed ETL/ML apps |
| 8 | `healthcheck.png` | terminal | `demo-healthcheck.ps1` all-green output |
| 9 | `ml_metrics.png` | notebook / mldata | GBT metrics chart (RMSE 3.71 vs 6.84) |
| 10 | `nyc_eda.png` | notebook | NYC→Casa synthesis 8-panel validation figure |
