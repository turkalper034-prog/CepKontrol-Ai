pipeline {
    agent { label 'windows' }

    options {
        timestamps()
        timeout(time: 45, unit: 'MINUTES')
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment and dependencies') {
            steps {
                bat '''
                    @echo off
                    if not exist test-results mkdir test-results
                    set "PYTHON_EXE="
                    if defined PYTHON312 if exist "%PYTHON312%" set "PYTHON_EXE=%PYTHON312%"
                    if not defined PYTHON_EXE if exist "C:\\Users\\turka\\AppData\\Local\\Programs\\Python\\Python312\\python.exe" set "PYTHON_EXE=C:\\Users\\turka\\AppData\\Local\\Programs\\Python\\Python312\\python.exe"
                    if not defined PYTHON_EXE (
                        for /f "delims=" %%P in ('where python 2^>nul') do (
                            "%%P" -c "import sys; raise SystemExit(0 if sys.version_info[:2] == (3, 12) else 1)" >nul 2>nul
                            if not errorlevel 1 set "PYTHON_EXE=%%P"
                        )
                    )
                    if not defined PYTHON_EXE (
                        for /f "delims=" %%P in ('py -3.12 -c "import sys; print(sys.executable)" 2^>nul') do set "PYTHON_EXE=%%P"
                    )
                    if not defined PYTHON_EXE (
                        echo ERROR: Python 3.12 not found. Set Jenkins environment variable PYTHON312 to the full python.exe path.
                        exit /b 1
                    )
                    "%PYTHON_EXE%" --version || (echo ERROR: Could not start Python: %PYTHON_EXE%& exit /b 1)
                    "%PYTHON_EXE%" -c "import sys; raise SystemExit(0 if sys.version_info[:2] == (3, 12) else 1)" || (echo ERROR: Jenkins selected a Python version other than 3.12: %PYTHON_EXE%& exit /b 1)
                    where node >nul 2>nul || (echo ERROR: Node.js not found on PATH.& exit /b 1)
                    where npm >nul 2>nul || (echo ERROR: npm not found on PATH.& exit /b 1)
                    where mvn >nul 2>nul || (echo ERROR: Maven not found on PATH.& exit /b 1)
                    mvn -version | findstr /C:"Java version: 21." >nul || (echo ERROR: Maven must run with JDK 21.& exit /b 1)
                    where newman >nul 2>nul || (echo ERROR: Newman is not installed on the Jenkins agent. Install Newman 6.x and add it to PATH.& exit /b 1)
                    if not exist "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" (
                        echo ERROR: Google Chrome is required at the Selenium fixture's configured path.
                        exit /b 1
                    )
                    if not exist backend\\venv\\Scripts\\python.exe "%PYTHON_EXE%" -m venv backend\\venv || exit /b 1
                    backend\\venv\\Scripts\\python.exe -m pip install -r backend\\requirements.txt -r backend\\requirements-dev.txt || exit /b 1
                    call npm --prefix frontend ci || exit /b 1
                '''
            }
        }

        stage('Backend API tests') {
            steps {
                bat '''
                    @echo off
                    if not exist test-results mkdir test-results
                    backend\\venv\\Scripts\\python.exe -m pytest backend\\tests -q --junitxml=test-results\\backend.xml
                '''
            }
        }

        stage('Newman API tests') {
            steps {
                bat '''
                    @echo off
                    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\\Run-Newman.ps1
                '''
            }
        }

        stage('Selenium UI tests') {
            steps {
                bat '''
                    @echo off
                    if not exist test-results mkdir test-results
                    backend\\venv\\Scripts\\python.exe -m pytest frontend\\tests\\selenium -q --junitxml=test-results\\selenium.xml
                '''
            }
        }

        stage('Frontend build and lint') {
            steps {
                bat '''
                    @echo off
                    call npm --prefix frontend run build || exit /b 1
                    call npm --prefix frontend run lint
                '''
            }
        }

        stage('Maven and Cucumber tests') {
            steps {
                bat '''
                    @echo off
                    if not exist test-results mkdir test-results
                    powershell.exe -NoProfile -ExecutionPolicy Bypass -File scripts\\Run-Cucumber.ps1
                '''
            }
        }
    }

    post {
        always {
            junit testResults: 'test-results/**/*.xml,tests/cucumber/target/surefire-reports/*.xml', allowEmptyResults: true
            archiveArtifacts artifacts: 'test-results/*.xml,test-results/*.json,test-results/*.log,tests/cucumber/target/cucumber.json,tests/cucumber/target/surefire-reports/*.xml', allowEmptyArchive: true
        }
    }
}
