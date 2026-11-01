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
                    where py >nul 2>nul || (echo ERROR: Python Launcher not found. Install Python 3.12 and enable the py launcher on this Windows agent.& exit /b 1)
                    py -3.12 --version || (echo ERROR: Python 3.12 is required.& exit /b 1)
                    where node >nul 2>nul || (echo ERROR: Node.js not found on PATH.& exit /b 1)
                    where npm >nul 2>nul || (echo ERROR: npm not found on PATH.& exit /b 1)
                    where mvn >nul 2>nul || (echo ERROR: Maven not found on PATH.& exit /b 1)
                    mvn -version | findstr /C:"Java version: 21." >nul || (echo ERROR: Maven must run with JDK 21.& exit /b 1)
                    where newman >nul 2>nul || (echo ERROR: Newman is not installed on the Jenkins agent. Install Newman 6.x and add it to PATH.& exit /b 1)
                    if not exist "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" (
                        echo ERROR: Google Chrome is required at the Selenium fixture's configured path.
                        exit /b 1
                    )
                    if not exist backend\\venv\\Scripts\\python.exe py -3.12 -m venv backend\\venv
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
