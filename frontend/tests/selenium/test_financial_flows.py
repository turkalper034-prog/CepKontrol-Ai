import json
import urllib.error
import urllib.request
from datetime import date

from selenium.webdriver.common.by import By
from selenium.common.exceptions import StaleElementReferenceException
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select, WebDriverWait


def goal_card_with_amount(browser, amount):
    try:
        card = browser.find_element(
            By.XPATH, "//article[.//h2[normalize-space()='Selenium goal']]"
        )
        return card if f"₺{amount},00 /" in card.text else False
    except StaleElementReferenceException:
        return False


def wait_for_heading(wait, title):
    return wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, f"//h1[normalize-space()='{title}']")
        )
    )


def test_transaction_create_filter_refresh_update_delete_and_dashboard(driver, app_url):
    wait = WebDriverWait(driver, 15)
    description = "Selenium transaction"
    driver.get(f"{app_url}/#/income-expense")
    wait_for_heading(wait, "Gelir ve Giderler")

    form = wait.until(
        EC.visibility_of_element_located((By.ID, "transaction-entry-form"))
    )
    form.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem açıklaması']").send_keys(
        description
    )
    form.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem tutarı']").send_keys("237")
    category_select = Select(
        form.find_element(By.CSS_SELECTOR, "select[aria-label='Gider kategorisi']")
    )
    food_category = next(option for option in category_select.options if "Yemek" in option.text)
    category_select.select_by_value(food_category.get_attribute("value"))
    form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    wait.until(EC.visibility_of_element_located((By.XPATH, "//*[text()='Gider kaydedildi.']")))
    row = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, f"//tr[.//div[normalize-space()='{description}']]")
        )
    )
    assert "237" in row.text

    driver.refresh()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, f"//tr[.//div[normalize-space()='{description}']]")
        )
    )

    search = driver.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem ara']")
    search.send_keys("transaction")
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, f"//tr[.//div[normalize-space()='{description}']]")
        )
    )

    row = driver.find_element(
        By.XPATH, f"//tr[.//div[normalize-space()='{description}']]"
    )
    row.find_element(
        By.CSS_SELECTOR, f"button[aria-label='{description} işlemini düzenle']"
    ).click()
    dialog = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='dialog']")))
    amount = dialog.find_element(
        By.CSS_SELECTOR, "input[aria-label='Düzenlenecek işlem tutarı']"
    )
    amount.clear()
    amount.send_keys("300")
    dialog.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    def updated_row(browser):
        try:
            current = browser.find_element(
                By.XPATH, f"//tr[.//div[normalize-space()='{description}']]"
            )
            return current if "300" in current.text else False
        except StaleElementReferenceException:
            return False

    row = wait.until(updated_row)
    row.find_element(
        By.CSS_SELECTOR, f"button[aria-label='{description} işlemini sil']"
    ).click()
    driver.switch_to.alert.accept()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='İşlem bulunamadı']")
        )
    )

    driver.find_element(
        By.XPATH, "//button[normalize-space()='Ana sayfaya dön']"
    ).click()
    wait_for_heading(wait, "Finansal kontrol sende.")
    wait.until(
        lambda browser: "Henüz işlem kaydı bulunmuyor."
        in browser.find_element(By.TAG_NAME, "main").text
    )
    assert "Henüz işlem kaydı bulunmuyor." in driver.find_element(By.TAG_NAME, "main").text


def test_dashboard_loading_content_period_and_navigation(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/")
    wait_for_heading(wait, "Finansal kontrol sende.")
    main = driver.find_element(By.TAG_NAME, "main")
    wait.until(lambda browser: "Henüz işlem kaydı bulunmuyor." in main.text)
    assert "Toplam Gelir" in main.text
    assert "Gelir ve Gider Analizi" in main.text
    assert "Harcama Dağılımı" in main.text

    driver.find_element(By.XPATH, "//button[.//span[normalize-space()='Bu ay']]").click()
    driver.find_element(By.XPATH, "//button[normalize-space()='Bu çeyrek']").click()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//button[.//span[normalize-space()='Bu çeyrek']]")
        )
    )
    screens = [
        ("Gelir ve Giderler", "income-expense", "Gelir ve Giderler"),
        ("Bütçelerim", "budgets", "Bütçelerim"),
        ("Finansal Raporlar", "reports", "Finansal Raporlar"),
        ("Yapay Zekâ Asistanı", "ai-assistant", "Yapay Zekâ Asistanı"),
        ("Tasarruf Hedeflerim", "savings", "Tasarruf Hedeflerim"),
        ("Ayarlar", "settings", "Ayarlar"),
        ("Genel Bakış", "", "Finansal kontrol sende."),
    ]
    for label, route, heading in screens:
        driver.find_element(
            By.XPATH,
            f"//nav[@aria-label='Ana gezinme']//button[.//span[normalize-space()='{label}']]",
        ).click()
        wait_for_heading(wait, heading)
        if route:
            wait.until(lambda browser: browser.current_url.endswith(f"#/{route}"))
        else:
            wait.until(lambda browser: browser.current_url.endswith("#/"))
    driver.refresh()
    wait_for_heading(wait, "Finansal kontrol sende.")


def test_budget_empty_create_edit_delete_flow(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/")
    wait_for_heading(wait, "Finansal kontrol sende.")
    driver.execute_script(
        "window.__seleniumOriginalFetch = window.fetch; "
        "window.fetch = () => new Promise(() => {});"
    )
    driver.find_element(
        By.XPATH,
        "//nav[@aria-label='Ana gezinme']//button[.//span[normalize-space()='Bütçelerim']]",
    ).click()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[@role='status' and normalize-space()='Bütçeler yükleniyor...']")
        )
    )
    driver.execute_script("window.fetch = window.__seleniumOriginalFetch;")
    driver.find_element(
        By.XPATH,
        "//nav[@aria-label='Ana gezinme']//button[.//span[normalize-space()='Genel Bakış']]",
    ).click()
    driver.get(f"{app_url}/#/budgets")
    wait_for_heading(wait, "Bütçelerim")
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[contains(., 'Henüz bütçe yok.')]")
        )
    )

    driver.find_element(By.CSS_SELECTOR, "input[aria-label='Bütçe adı']").send_keys(
        "Selenium budget"
    )
    Select(driver.find_element(By.CSS_SELECTOR, "select[aria-label='Gider kategorisi']")).select_by_visible_text(
        next(
            option.text
            for option in Select(
                driver.find_element(By.CSS_SELECTOR, "select[aria-label='Gider kategorisi']")
            ).options
            if "Yemek" in option.text
        )
    )
    driver.find_element(By.CSS_SELECTOR, "input[aria-label='Bütçe limiti']").send_keys("1000")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    card = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//article[.//h2[normalize-space()='Selenium budget']]")
        )
    )
    assert "Kalan" in card.text

    card.find_element(By.XPATH, ".//button[normalize-space()='Düzenle']").click()
    limit = driver.find_element(By.CSS_SELECTOR, "input[aria-label='Bütçe limiti']")
    limit.clear()
    limit.send_keys("1500")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    card = wait.until(
        lambda browser: (
            current
            if "1.500"
            in (
                current := browser.find_element(
                    By.XPATH, "//article[.//h2[normalize-space()='Selenium budget']]"
                )
            ).text
            else False
        )
    )
    assert "1.500" in card.text
    card.find_element(By.XPATH, ".//button[normalize-space()='Sil']").click()
    driver.switch_to.alert.accept()
    wait.until(EC.visibility_of_element_located((By.XPATH, "//*[contains(., 'Henüz bütçe yok.')]")))


def test_savings_goal_create_contribute_edit_and_delete(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/savings")
    wait_for_heading(wait, "Tasarruf Hedeflerim")
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='Henüz tasarruf hedefi yok.']")
        )
    )

    driver.find_element(By.CSS_SELECTOR, "input[aria-label='Hedef adı']").send_keys(
        "Selenium goal"
    )
    driver.find_element(By.CSS_SELECTOR, "input[aria-label='Hedef tutarı']").send_keys("500")
    driver.find_element(By.CSS_SELECTOR, "input[aria-label='Mevcut birikim']").send_keys("100")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    card = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//article[.//h2[normalize-space()='Selenium goal']]")
        )
    )
    assert "Kalan" in card.text

    card.find_element(By.XPATH, ".//button[normalize-space()='Birikim Ekle']").click()
    prompt = wait.until(EC.alert_is_present())
    prompt.send_keys("50")
    prompt.accept()
    card = wait.until(lambda browser: goal_card_with_amount(browser, 150))

    card.find_element(By.XPATH, ".//button[normalize-space()='Düzenle']").click()
    current_amount = driver.find_element(By.CSS_SELECTOR, "input[aria-label='Mevcut birikim']")
    current_amount.clear()
    current_amount.send_keys("200")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    card = wait.until(lambda browser: goal_card_with_amount(browser, 200))
    assert "200" in card.text
    card.find_element(By.XPATH, ".//button[normalize-space()='Sil']").click()
    driver.switch_to.alert.accept()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='Henüz tasarruf hedefi yok.']")
        )
    )


def test_reports_totals_charts_and_empty_data_state(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/income-expense")
    form = wait.until(
        EC.visibility_of_element_located((By.ID, "transaction-entry-form"))
    )
    form.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem açıklaması']").send_keys(
        "Report income"
    )
    form.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem tutarı']").send_keys("1234")
    income_category = Select(
        form.find_element(By.CSS_SELECTOR, "select[aria-label='Gider kategorisi']")
    )
    form.find_element(By.XPATH, ".//button[normalize-space()='Gelir']").click()
    income_category = Select(
        form.find_element(By.CSS_SELECTOR, "select[aria-label='Gelir kategorisi']")
    )
    income_option = next(option for option in income_category.options if "Maaş" in option.text)
    income_category.select_by_value(income_option.get_attribute("value"))
    form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    wait.until(EC.visibility_of_element_located((By.XPATH, "//*[text()='Gelir kaydedildi.']")))

    form.find_element(By.XPATH, ".//button[normalize-space()='Gider']").click()
    form.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem açıklaması']").send_keys(
        "Report expense"
    )
    form.find_element(By.CSS_SELECTOR, "input[aria-label='İşlem tutarı']").send_keys("321")
    expense_category = Select(
        form.find_element(By.CSS_SELECTOR, "select[aria-label='Gider kategorisi']")
    )
    expense_option = next(option for option in expense_category.options if "Yemek" in option.text)
    expense_category.select_by_value(expense_option.get_attribute("value"))
    form.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    wait.until(EC.visibility_of_element_located((By.XPATH, "//*[text()='Gider kaydedildi.']")))

    driver.find_element(
        By.XPATH,
        "//nav[@aria-label='Ana gezinme']//button[.//span[normalize-space()='Finansal Raporlar']]",
    ).click()
    wait_for_heading(wait, "Finansal Raporlar")
    income_total = wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='Toplam gelir']/following-sibling::p")
        )
    )
    expense_total = driver.find_element(
        By.XPATH, "//*[normalize-space()='Toplam gider']/following-sibling::p"
    )
    assert "1.234" in income_total.text
    assert "321" in expense_total.text
    assert "Dönemsel gelir-gider" in driver.find_element(By.TAG_NAME, "main").text
    assert "Yemek" in driver.find_element(By.TAG_NAME, "main").text



def test_reports_empty_data_state(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/reports")
    wait_for_heading(wait, "Finansal Raporlar")
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='Bu dönemde kategorili gider bulunmuyor.']")
        )
    )


def test_ai_assistant_empty_state_and_refresh(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/ai-assistant")
    wait_for_heading(wait, "Yapay Zekâ Asistanı")
    assert "Kural Tabanlı Finansal Analiz" in driver.find_element(By.TAG_NAME, "main").text
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='Yeterli Veri Yok']")
        )
    )
    refresh = driver.find_element(By.XPATH, "//button[normalize-space()='Önerileri Yenile']")
    refresh.click()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[normalize-space()='Yeterli Veri Yok']")
        )
    )


def test_settings_backend_health_and_error_state(driver, app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{app_url}/#/settings")
    wait_for_heading(wait, "Ayarlar")
    assert "Yerel SQLite veritabanı" in driver.find_element(By.TAG_NAME, "main").text
    button = driver.find_element(
        By.XPATH, "//button[normalize-space()='Backend bağlantısını kontrol et']"
    )
    button.click()
    wait.until(
        EC.visibility_of_element_located(
            (By.XPATH, "//*[contains(., 'backend çalışıyor')]")
        )
    )

    driver.execute_script(
        "window.fetch = () => Promise.reject(new Error('Selenium simulated network error'));"
    )
    button.click()
    alert = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[role='alert']")))
    assert "Backend sunucusuna bağlanılamadı." in alert.text


def test_demo_is_synthetic_read_only_and_rejects_api_writes(driver, demo_app_url):
    wait = WebDriverWait(driver, 15)
    driver.get(f"{demo_app_url}/#/income-expense")
    wait_for_heading(wait, "Gelir ve Giderler")
    assert "Portföy demosu" in driver.find_element(By.TAG_NAME, "main").text
    assert len(driver.find_elements(By.CSS_SELECTOR, "button[aria-label$='işlemini düzenle']")) == 0
    assert len(driver.find_elements(By.CSS_SELECTOR, "button[aria-label$='işlemini sil']")) == 0
    assert driver.find_element(
        By.CSS_SELECTOR, "#transaction-entry-form button[type='submit']"
    ).get_attribute("disabled") is not None
    categories = json.loads(
        urllib.request.urlopen(
            f"{demo_app_url.api_url}/api/categories?type=expense", timeout=5
        ).read()
    )
    request = urllib.request.Request(
        f"{demo_app_url.api_url}/api/transactions",
        data=json.dumps(
            {
                "description": "Read only probe",
                "amount": 1,
                "type": "expense",
                "category_id": categories[0]["id"],
                "transaction_date": date.today().isoformat(),
            }
        ).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        urllib.request.urlopen(request, timeout=5)
        assert False, "Demo API must reject write requests."
    except urllib.error.HTTPError as error:
        assert error.code == 403
        assert "salt okunurdur" in json.loads(error.read())["detail"]

    driver.find_element(
        By.XPATH,
        "//nav[@aria-label='Ana gezinme']//button[.//span[normalize-space()='Bütçelerim']]",
    ).click()
    wait_for_heading(wait, "Bütçelerim")
    assert len(driver.find_elements(By.XPATH, "//button[normalize-space()='Bütçe Ekle']")) == 0
    assert len(driver.find_elements(By.XPATH, "//article//button[normalize-space()='Düzenle']")) == 0
    driver.find_element(
        By.XPATH,
        "//nav[@aria-label='Ana gezinme']//button[.//span[normalize-space()='Tasarruf Hedeflerim']]",
    ).click()
    wait_for_heading(wait, "Tasarruf Hedeflerim")
    assert len(driver.find_elements(By.XPATH, "//button[normalize-space()='Hedef Ekle']")) == 0
    assert len(driver.find_elements(By.XPATH, "//article//button[normalize-space()='Birikim Ekle']")) == 0
