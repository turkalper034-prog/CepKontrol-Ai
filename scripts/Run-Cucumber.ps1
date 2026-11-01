$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$backendRoot = Join-Path $projectRoot "backend"
$cucumberRoot = Join-Path $projectRoot "tests\cucumber"
$python = Join-Path $backendRoot "venv\Scripts\python.exe"
$results = Join-Path $projectRoot "test-results"
$runtime = Join-Path $results ("cucumber-" + [Guid]::NewGuid().ToString("N"))
$database = Join-Path $runtime "isolated.db"
$stdoutLog = Join-Path $runtime "api.stdout.log"
$stderrLog = Join-Path $runtime "api.stderr.log"
$server = $null

if (-not (Test-Path $python)) {
    throw "Backend virtual environment not found: $python. Run the Jenkins dependency setup first."
}
if (-not (Test-Path (Join-Path $cucumberRoot "pom.xml"))) {
    throw "Cucumber Maven project is missing: $cucumberRoot"
}
if (-not (Get-Command mvn -ErrorAction SilentlyContinue)) {
    throw "Maven is not available on PATH."
}

$mavenVersion = (& mvn -version 2>&1 | Out-String)
if ($mavenVersion -notmatch "Java version:\s+21\.") {
    throw "Cucumber tests require Maven running on JDK 21. Detected: $($mavenVersion.Trim())"
}

New-Item -ItemType Directory -Force -Path $results | Out-Null
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

    Push-Location $cucumberRoot
    try {
        & mvn -B test "-DcepKontrolApiBaseUrl=http://127.0.0.1:$port"
        $mavenExitCode = $LASTEXITCODE
    }
    finally {
        Pop-Location
    }
    if ($mavenExitCode -ne 0) {
        throw "Cucumber Maven tests failed with exit code $mavenExitCode."
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
            @{ Source = $stdoutLog; Name = "cucumber-api.stdout.log" },
            @{ Source = $stderrLog; Name = "cucumber-api.stderr.log" }
        )) {
            if (Test-Path -LiteralPath $log.Source) {
                Move-Item -LiteralPath $log.Source -Destination (Join-Path $results $log.Name) -Force
            }
        }
        Remove-Item -LiteralPath $runtime -Recurse -Force
    }
}
