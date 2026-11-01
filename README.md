<div align="center">

# 💳 CepKontrol AI

**Kişisel gelir ve giderlerinizi takip edin, bütçenizi yönetin ve finansal durumunuzu tek ekranda görün.**

React tabanlı arayüzü, FastAPI servisi ve SQLite veritabanıyla geliştirilen Türkçe kişisel finans uygulaması.

[![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=20232A)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)](https://www.sqlite.org/)
[![Pytest](https://img.shields.io/badge/Tests-Pytest-0A9EDC?logo=pytest&logoColor=white)](https://pytest.org/)
[![Selenium](https://img.shields.io/badge/UI-Selenium-43B02A?logo=selenium&logoColor=white)](https://www.selenium.dev/)
[![Newman](https://img.shields.io/badge/API-Newman-FF6C37?logo=postman&logoColor=white)](https://www.postman.com/)
[![Jenkins](https://img.shields.io/badge/CI-Jenkins-D24939?logo=jenkins&logoColor=white)](https://www.jenkins.io/)
[![Maven](https://img.shields.io/badge/Tests-Maven%20%2F%20Cucumber-C71A36?logo=apachemaven&logoColor=white)](https://maven.apache.org/)

</div>

---

## ✨ Özellikler

- Gelir ve gider işlemleri: ekleme, düzenleme, silme, arama ve filtreleme
- Tür bazında kategoriler; kategori, tarih aralığı ve işlem türüne göre filtreleme
- Bütçe ve tasarruf hedefleri oluşturma, takip etme ve güncelleme
- Dashboard özetleri ve tarih aralığına göre finansal raporlar
- Kural tabanlı AI finans önerileri
- Verilerin FastAPI üzerinden SQLite'a kalıcı kaydı
- Salt okunur sentetik verilerle demo görünümü
- Selenium ile temel ekran ve finansal akışların tarayıcı otomasyonu

## 🧰 Teknolojiler

| Alan | Teknolojiler |
|---|---|
| Arayüz | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion, Recharts, lucide-react |
| API ve veri | Python 3.12, FastAPI, Pydantic, SQLite |
| Test | Pytest, HTTPX, Selenium, Postman/Newman, Java 21, Maven, Cucumber |
| CI | Windows Jenkins pipeline |

## 📁 Proje yapısı

```text
.
├── backend/
│   ├── app/                  # FastAPI uygulaması, API router'ları ve veri katmanı
│   ├── tests/                # İzole SQLite kullanan API testleri
│   ├── requirements.txt
│   └── requirements-dev.txt
├── frontend/
│   ├── src/                  # React arayüzü
│   ├── tests/selenium/       # Selenium ekran ve kullanıcı akışı testleri
│   └── package.json
├── scripts/
│   ├── Run-Newman.ps1        # Geçici veritabanı ve port ile API testleri
│   └── Run-Cucumber.ps1      # Geçici API ve veritabanı ile Cucumber testi
├── tests/cucumber/           # Maven, Cucumber feature ve Java testleri
├── Jenkinsfile
├── CepKontrol AI - API Tests.postman_collection.json
└── Baslat.bat                # Windows'ta uygulamayı yerel başlatma yardımcısı
```

## 🚀 Yerel kurulum

Gereksinimler: Windows, Python 3.12, Node.js/npm. Cucumber testleri için ayrıca Java 21 ve Maven gerekir.

1. Depoyu klonlayıp proje dizinine geçin:

   ```powershell
   git clone https://github.com/turkalper034-prog/CepKontrol-Ai.git
   cd CepKontrol-Ai
   ```

2. Backend sanal ortamını oluşturup bağımlılıkları kurun:

   ```powershell
   cd backend
   py -3.12 -m venv venv
   .\venv\Scripts\python.exe -m pip install -r requirements.txt -r requirements-dev.txt
   cd ..
   ```

3. Frontend bağımlılıklarını kurun:

   ```powershell
   cd frontend
   npm install
   cd ..
   ```

4. Uygulamayı başlatın:

   ```powershell
   .\Baslat.bat
   ```

   Yardımcı betik backend ve Vite geliştirme sunucularını başlatır. Varsayılan adresler `http://127.0.0.1:8000` ve `http://127.0.0.1:5173`'tür. Gizli veya makineye özel `.env` dosyalarını depoya eklemeyin.

## 🧪 Testleri çalıştırma

### Backend API — Pytest

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
cd ..
```

Test fixture'ları geçici SQLite veritabanı kullanır; kullanıcı veritabanını sıfırlamaz.

### Frontend — build ve lint

```powershell
cd frontend
npm run build
npm run lint
cd ..
```

### API — Postman/Newman

Newman'ı bir kez kurun ve izole API test betiğini çalıştırın:

```powershell
npm install --global newman
.\scripts\Run-Newman.ps1
```

### Tarayıcı — Selenium

Backend bağımlılıkları ve frontend npm paketleri kurulu olmalıdır. Selenium testleri Chrome kullanır; Selenium Manager'ın ChromeDriver'ı edinmesi için ağ erişimi gerekebilir.

```powershell
.\backend\venv\Scripts\python.exe -m pytest .\frontend\tests\selenium -q
```

### API sağlık senaryosu — Maven/Cucumber

Java 21 ve Maven PATH üzerinde olmalıdır:

```powershell
.\scripts\Run-Cucumber.ps1
```

## ⚙️ Jenkins pipeline

`Jenkinsfile`, Windows ajanı için aşağıdaki aşamaları tanımlar:

| Aşama | Görev |
|---|---|
| Checkout | Kaynak kodu çalışma alanına alır. |
| Environment and dependencies | Python, Maven ve Java sürümlerini doğrular; backend ve frontend bağımlılıklarını hazırlar. |
| Backend API tests | Pytest API testlerini çalıştırır. |
| Newman API tests | İzole API üzerinde Postman koleksiyonunu çalıştırır. |
| Selenium UI tests | Tarayıcı üzerinden finansal ekran akışlarını test eder. |
| Frontend build and lint | Frontend lint ve üretim build adımlarını çalıştırır. |
| Maven and Cucumber tests | Sağlık kontrolü senaryosunu Maven/Cucumber ile çalıştırır. |
| Post actions | JUnit sonuçlarını Jenkins'e yayımlar ve `test-results` ile Cucumber raporlarını arşivler. |

### Test raporları

- Newman JSON raporu: `test-results/newman.json`
- Cucumber JSON raporu: `tests/cucumber/target/cucumber.json`
- Maven Surefire JUnit XML: `tests/cucumber/target/surefire-reports/`
- Pytest/Selenium JUnit XML: Jenkins çalışma alanındaki `test-results/`

Üretilen raporlar ve build çıktıları Git tarafından izlenmez. Jenkins'e ait herkese açık bir job/build URL'si doğrulanmadığı için bu README'de durum bildiren CI rozeti kullanılmıyor; üstteki Jenkins rozeti yalnızca teknolojiyi belirtir.

## ✅ Doğrulanmış test sonuçları

Bu çalışma kopyasında doğrulanan sonuçlar:

| Kontrol | Sonuç |
|---|---:|
| Backend API / Pytest | 7 test geçti |
| Selenium UI | 9 test geçti |
| Newman API | 4 istek, 10 assertion, 0 hata |
| Maven/Cucumber | 1 senaryo geçti |
| Frontend build | Başarılı |
| Frontend lint | Başarılı; 9 uyarı raporlandı |

**Jenkins durumu:** Paylaşılan son Jenkins günlüğü başarısızdı; `app.api.reports` modülünün bulunamadığını gösteriyordu. Kaynakların ve `.gitignore` kuralının düzeltilmesinden sonra bu commit için başarılı bir Jenkins çalışması doğrulanmış değil. Bu nedenle Jenkins başarısı iddia edilmiyor.

## 🔭 Geliştirme fikirleri

- Kullanıcı hesabı ve birden fazla kullanıcıya uygun veri ayrımı
- Kullanıcı tanımlı kategori ve yinelenen işlem desteği
- Yapay zekâ destekli, açıklanabilir finans önerileri
- Raporları dışa aktarma ve erişilebilirlik iyileştirmeleri
- Uygulama dağıtımı ve yayınlanmış demo

---

<div align="center">

**CepKontrol AI** · Kişisel finans takibi için Türkçe bir proje

</div>
