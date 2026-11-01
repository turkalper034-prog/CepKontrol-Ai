import os
import shutil
import socket
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path

import pytest
from selenium import webdriver


ROOT = Path(__file__).resolve().parents[3]
BACKEND = ROOT / "backend"
FRONTEND = ROOT / "frontend"


class AppServer(str):
    def __new__(cls, web_url, api_url):
        instance = super().__new__(cls, web_url)
        instance.api_url = api_url
        return instance


def available_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def wait_for_http(url, process, log_path, timeout=40):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError(f"Server exited early. Output:\n{log_path.read_text(errors='replace')}")
        try:
            with urllib.request.urlopen(url, timeout=1) as response:
                if response.status < 500:
                    return
        except (urllib.error.URLError, TimeoutError):
            time.sleep(0.25)
    raise TimeoutError(f"Server did not start at {url}. Output:\n{log_path.read_text(errors='replace')}")


def start_app(runtime, demo_mode=False):
    runtime.mkdir(parents=True, exist_ok=True)
    api_port = available_port()
    web_port = available_port()
    api_log = runtime / "api.log"
    web_log = runtime / "web.log"
    api_output = api_log.open("w", encoding="utf-8")
    web_output = web_log.open("w", encoding="utf-8")

    env = os.environ.copy()
    env["DATABASE_URL"] = str(runtime / "selenium-test.db")
    if demo_mode:
        env["DEMO_MODE"] = "true"
    else:
        env.pop("DEMO_MODE", None)
    api_process = subprocess.Popen(
        [
            str(BACKEND / "venv" / "Scripts" / "python.exe"),
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(api_port),
        ],
        cwd=BACKEND,
        env=env,
        stdout=api_output,
        stderr=subprocess.STDOUT,
    )

    node = shutil.which("node")
    if node is None:
        api_process.terminate()
        api_output.close()
        web_output.close()
        raise RuntimeError("Node.js bulunamadı; Selenium UI testi için Node.js gereklidir.")

    frontend_env = env.copy()
    frontend_env["VITE_API_BASE_URL"] = f"http://127.0.0.1:{api_port}"
    frontend_env["VITE_DEMO_READ_ONLY"] = "true" if demo_mode else "false"
    web_process = subprocess.Popen(
        [
            node,
            str(FRONTEND / "node_modules" / "vite" / "bin" / "vite.js"),
            "--host",
            "127.0.0.1",
            "--port",
            str(web_port),
            "--strictPort",
        ],
        cwd=FRONTEND,
        env=frontend_env,
        stdout=web_output,
        stderr=subprocess.STDOUT,
    )

    try:
        wait_for_http(f"http://127.0.0.1:{api_port}/api/health", api_process, api_log)
        wait_for_http(f"http://127.0.0.1:{web_port}/", web_process, web_log)
        return (
            AppServer(
                f"http://127.0.0.1:{web_port}",
                f"http://127.0.0.1:{api_port}",
            ),
            (web_process, api_process),
            (api_output, web_output),
        )
    except Exception:
        for process in (web_process, api_process):
            if process.poll() is None:
                process.terminate()
        api_output.close()
        web_output.close()
        raise


def stop_app(processes, outputs):
    for process in processes:
        if process.poll() is None:
            process.terminate()
            try:
                process.wait(timeout=10)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
    for output in outputs:
        output.close()


@pytest.fixture
def app_url(tmp_path):
    url, processes, outputs = start_app(tmp_path / "regular", demo_mode=False)
    try:
        yield url
    finally:
        stop_app(processes, outputs)


@pytest.fixture
def demo_app_url(tmp_path):
    url, processes, outputs = start_app(tmp_path / "demo", demo_mode=True)
    try:
        yield url
    finally:
        stop_app(processes, outputs)


@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,1200")
    options.add_argument("--disable-background-networking")
    chrome = Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe")
    if chrome.exists():
        options.binary_location = str(chrome)
    browser = webdriver.Chrome(options=options)
    yield browser
    browser.quit()
