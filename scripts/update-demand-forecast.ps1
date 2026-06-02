#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Populate taasim.demand_forecast with demand_v1 predictions for all 16 zones.

.DESCRIPTION
    Calls the CasaMotion API (POST /api/demand/forecast) for each Casablanca
    zone and writes the predicted demand for the upcoming 30-minute slot into
    Cassandra table taasim.demand_forecast. Grafana reads this table to render
    the "Predicted Demand (demand_v1)" overlay required by the Week 6 spec.

    Model source: the API serves model_version "demand_v1". In the default
    container it runs in heuristic mode (PYSPARK_ENABLED=0); the trained GBT
    PipelineModel artifact lives in MinIO at s3a://mldata/models/demand_v1/.

.PARAMETER ApiBase
    Base URL of the API. Default http://localhost:8000

.PARAMETER Loop
    If set, refreshes continuously every -IntervalSec seconds (for live demo).

.PARAMETER IntervalSec
    Refresh interval in seconds when -Loop is set. Default 30.

.EXAMPLE
    .\scripts\update-demand-forecast.ps1            # one-shot, all 16 zones
    .\scripts\update-demand-forecast.ps1 -Loop      # live demo mode
#>
param(
    [string]$ApiBase = "http://localhost:8000",
    [switch]$Loop,
    [int]$IntervalSec = 30
)

$ErrorActionPreference = "Stop"
$CITY = "casablanca"
$CASSANDRA = "taasim-cassandra"

function Get-Token {
    $resp = Invoke-RestMethod -Uri "$ApiBase/api/auth/token" -Method Post `
        -ContentType 'application/json' `
        -Body '{"username":"admin","password":"admin"}'
    return $resp.access_token
}

function Update-Forecasts {
    $token = Get-Token
    $headers = @{ Authorization = "Bearer $token" }
    # Forecast the upcoming 30-minute slot.
    $slot = (Get-Date).ToUniversalTime().AddMinutes(30)
    $slotIso = $slot.ToString("yyyy-MM-ddTHH:mm:ss")
    $slotCql = $slot.ToString("yyyy-MM-dd HH:mm:ss")

    $written = 0
    foreach ($zone in 1..16) {
        try {
            $body = (@{ zone_id = $zone; datetime = $slotIso } | ConvertTo-Json -Compress)
            $f = Invoke-RestMethod -Uri "$ApiBase/api/demand/forecast" -Method Post `
                -Headers $headers -ContentType 'application/json' -Body $body
            $pred = [double]$f.predicted_demand
            $ver = $f.model_version
            $cql = "INSERT INTO taasim.demand_forecast (city, zone_id, slot_start, predicted_demand, model_version) VALUES ('$CITY', $zone, '$slotCql', $pred, '$ver');"
            docker exec $CASSANDRA cqlsh -e $cql 2>&1 | Out-Null
            $written++
        } catch {
            Write-Host "  zone $zone failed: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
    $ts = (Get-Date).ToString("HH:mm:ss")
    Write-Host "[$ts] Wrote $written/16 zone forecasts for slot $slotIso (model: $ver)" -ForegroundColor Green
}

Write-Host "=== CasaMotion Demand Forecast Writer (demand_v1) ===" -ForegroundColor Cyan
if ($Loop) {
    Write-Host "Live mode: refreshing every $IntervalSec s. Ctrl+C to stop." -ForegroundColor Cyan
    while ($true) {
        Update-Forecasts
        Start-Sleep -Seconds $IntervalSec
    }
} else {
    Update-Forecasts
    Write-Host "Done. Re-run with -Loop for continuous live updates." -ForegroundColor Cyan
}
