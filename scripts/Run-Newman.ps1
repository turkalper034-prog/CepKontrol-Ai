$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot "backend"
$python = Join-Path $backendRoot "venv\Scripts\python.exe"
$collection = Join-Path $projectRoot "CepKontrol AI - API Tests.postman_collection.json"
$results = Join-Path $projectRoot "test-results"
$runtime = Join-Path $results ("newman-" + [Guid]::NewGuid().ToString("N"))
$database = Join-Path $runtime "isolated.db"
$stdoutLog = Join-Path $runtime "api.stdout.log"
$stderrLog = Join-Path $runtime "api.stderr.log"
$jsonReport = Join-Path $results "newman.json"
$server = $null

New-Item -ItemType Directory -Force -Path $results | Out-Null

if (-not (Test-Path $python)) {
    throw "Backend virtual environment not found: $python. Run the Jenkins dependency setup first."
}
if (-not (Test-Path $collection)) {
    throw "Postman collection not found: $collection"
}
if (-not (Get-Command newman -ErrorAction SilentlyContinue)) {
    throw "Newman CLI not found. Install it with: npm install --global newman@6"
}

New-Item -ItemType Directory -Force -Path $runtime | Out-Null
$portListener = [System.Net.Sockets.TcpListener]::new([System.Net.IPAddress]::Loopback, 0)
$portListener.Start()
$port = ([System.Net.IPEndPoint]$portListener.LocalEndpoint).Port
$portListener.Stop()

$env:DATABASE_URL = $database
$env:DEMO_MODE = "false"
$server = Start-Process `
    -FilePath $python `
    -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "$port") `
    -WorkingDirectory $backendRoot `
    -RedirectStandardOutput $stdoutLog `
    -RedirectStandardError $stderrLog `
    -PassThru

try {
    $healthUrl = "http://127.0.0.1:$port/api/health"
    $deadline = (Get-Date).AddSeconds(45)
    $healthy = $false
    while ((Get-Date) -lt $deadline) {
        if ($server.HasExited) {
            throw "Temporary API process exited before becoming healthy. See $stderrLog"
        }
        try {
            $health = Invoke-WebRequest -Uri $healthUrl -TimeoutSec 2
            if ($health.StatusCode -eq 200) {
                $healthy = $true
                break
            }
        }
        catch {
            Start-Sleep -Milliseconds 500
        }
    }
    if (-not $healthy) {
        throw "Temporary API did not become healthy at $healthUrl. See $stderrLog"
    }

    & newman run $collection `
        --env-var "baseUrl=http://127.0.0.1:$port" `
        --reporters json `
        --reporter-json-export $jsonReport
    $newmanExitCode = $LASTEXITCODE
    if ($newmanExitCode -ne 0) {
        throw "Newman failed with exit code $newmanExitCode."
    }
    if (-not (Test-Path $jsonReport)) {
        throw "Newman exited successfully but did not create its expected JSON report: $jsonReport"
    }
}
finally {
    if ($null -ne $server -and -not $server.HasExited) {
        Stop-Process -Id $server.Id
        $server.WaitForExit()
    }
    Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
    Remove-Item Env:DEMO_MODE -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $runtime) {
        foreach ($log in @(
            @{ Source = $stdoutLog; Name = "newman-api.stdout.log" },
            @{ Source = $stderrLog; Name = "newman-api.stderr.log" }
        )) {
            if (Test-Path -LiteralPath $log.Source) {
                Move-Item -LiteralPath $log.Source -Destination (Join-Path $results $log.Name) -Force
            }
        }
        Remove-Item -LiteralPath $runtime -Recurse -Force
    }
}
