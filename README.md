# CepKontrol AI

Kişisel finans yönetimi ve yapay zekâ destekli tasarruf uygulaması.

Bu proje, QA/SDET, yazılım geliştirme, SQL ve yapay zekâ alanlarında kendini geliştirmek ve GitHub portföyü oluşturmak için hazırlanmıştır.

## Teknolojiler

### Frontend
- React 19
- TypeScript
- Vite
- Tailwind CSS 3.x
- Framer Motion (animasyonlar)
- Recharts (grafikler)
- Lucide React (ikonlar)

### Backend
- Python
- FastAPI
- SQLite
- Pydantic (veri doğrulama)
- Uvicorn (ASGI server)

## Proje Yapısı

```
CepKontrol-Ai/
├── backend/                      # FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI uygulaması ve router kayıtları
│   │   ├── database.py          # SQLite veritabanı bağlantısı ve tablo oluşturma
│   │   ├── models.py            # Pydantic modelleri (veri doğrulama)
│   │   └── api/                 # API endpoint'leri
│   │       ├── categories/      # Kategoriler API
│   │       ├── transactions/    # İşlemler API (CRUD + filtreler)
│   │       ├── budgets/         # Bütçeler API
│   │       ├── goals/           # Tasarruf hedefleri API
│   │       ├── dashboard/       # Dashboard özet API
│   │       ├── reports/         # Finansal raporlar API
│   │       └── ai/              # Kural tabanlı AI önerileri API
│   ├── requirements.txt         # Python bağımlılıkları
│   ├── .env.example             # Ortam değişkenleri örneği
│   └── cepkontrol.db            # SQLite veritabanı (otomatik oluşturulur)
├── frontend/                     # React + TypeScript + Vite
│   ├── src/
│   │   ├── App.tsx              # Ana React bileşeni
│   │   ├── main.tsx             # React giriş noktası
│   │   ├── types.ts             # TypeScript tip tanımları
│   │   ├── lib/
│   │   │   └── api.ts           # API client (tüm API çağrıları)
│   │   ├── hooks/
│   │   │   └── useDashboard.ts  # Dashboard verileri için custom hook
│   │   └── components/
│   │       ├── layout/          # Sidebar ve layout bileşenleri
│   │       ├── dashboard/       # Dashboard bileşenleri
│   │       └── transactions/    # Gelir ve Giderler sayfası
│   ├── package.json             # Node.js bağımlılıkları
│   └── tailwind.config.js       # Tailwind CSS yapılandırması
└── README.md
```

## Veritabanı Yapısı

### Tablolar

#### categories
Kategoriler (gelir/gider)
- id (PRIMARY KEY)
- name (kategori adı)
- type (income/expense)
- icon (emoji)
- color (hex color)
- created_at

#### transactions
Finansal işlemler
- id (PRIMARY KEY)
- description (açıklama)
- amount (tutar, >0)
- type (income/expense)
- category_id (FOREIGN KEY → categories)
- transaction_date (işlem tarihi)
- notes (not, opsiyonel)
- created_at

#### budgets
Bütçeler
- id (PRIMARY KEY)
- name (bütçe adı)
- category_id (FOREIGN KEY → categories)
- period (monthly/custom)
- limit_amount (limit tutarı, >0)
- start_date (başlangıç tarihi)
- end_date (bitiş tarihi)
- created_at

#### savings_goals
Tasarruf hedefleri
- id (PRIMARY KEY)
- name (hedef adı)
- target_amount (hedef tutarı, >0)
- current_amount (birikmiş tutar, >=0)
- target_date (hedef tarihi)
- created_at

## API Endpoint'leri

### Kategoriler
- `GET /api/categories` - Tüm kategorileri listeler (type filtresi ile)
- `GET /api/categories/{id}` - Belirli bir kategoriyi getirir

### İşlemler
- `GET /api/transactions` - İşlemleri listeler (filtreler: type, category_id, start_date, end_date, search, limit, offset)
- `GET /api/transactions/{id}` - Belirli bir işlemi getirir
- `POST /api/transactions` - Yeni işlem oluşturur
- `PUT /api/transactions/{id}` - Bir işlemi günceller
- `DELETE /api/transactions/{id}` - Bir işlemi siler

### Bütçeler
- `GET /api/budgets` - Tüm bütçeleri listeler
- `GET /api/budgets/{id}` - Belirli bir bütçeyi getirir
- `POST /api/budgets` - Yeni bütçe oluşturur
- `PUT /api/budgets/{id}` - Bir bütçeyi günceller
- `DELETE /api/budgets/{id}` - Bir bütçeyi siler

### Tasarruf Hedefleri
- `GET /api/goals` - Tüm tasarruf hedeflerini listeler
- `GET /api/goals/{id}` - Belirli bir hedefi getirir
- `POST /api/goals` - Yeni hedef oluşturur
- `PUT /api/goals/{id}` - Bir hedefi günceller
- `DELETE /api/goals/{id}` - Bir hedefi siler
- `POST /api/goals/{id}/add` - Bir hedefe para ekler

### Dashboard
- `GET /api/dashboard/summary` - Dashboard özet verileri (period: month/quarter/year)
- `GET /api/dashboard/category-spending` - Kategori bazlı harcama dağılımı
- `GET /api/dashboard/monthly-data` - Aylık gelir-gider verileri
- `GET /api/dashboard/recent-transactions` - Son işlemler
- `GET /api/dashboard/budget-status` - Bütçe kullanım durumları

### Raporlar
- `GET /api/reports/summary` - Finansal özet raporu (start_date, end_date)

### Yapay Zekâ Asistanı
- `GET /api/ai/recommendations` - Kural tabanlı finansal öneriler

### Sistem
- `GET /api/health` - API sağlık kontrolü
- `GET /` - Ana endpoint
- `GET /docs` - Swagger API dokümantasyonu

## Kurulum

### Ön Koşullar

- Python 3.12 önerilir
- Node.js 20.19+ veya 22.12+
- npm

### GitHub'dan indirip kendi bilgisayarında çalıştırma

1. GitHub deposunda **Code > Download ZIP** seçeneğiyle projeyi indirin ve ZIP dosyasını çıkarın. Git kuruluysa depoyu klonlamak için terminalde `git clone <GitHub depo adresi>` komutunu kullanabilirsiniz.
2. Python ve Node.js'i kurun.
3. Windows'ta proje klasöründeki `Baslat.bat` dosyasına çift tıklayın. Gerekli paketler henüz kurulmadıysa aşağıdaki Backend ve Frontend Kurulumu adımlarını bir kez uygulayın.
4. Kurulum tamamlandıktan sonra `Baslat.bat` dosyası backend ve frontend'i başlatır; uygulama `http://127.0.0.1:5173` adresinde açılır.

Her bilgisayar kendi `backend/cepkontrol.db` SQLite veritabanını oluşturur. Kullanıcı kayıtları bilgisayarlar arasında veya GitHub üzerinden paylaşılmaz.

### Backend Kurulumu

1. Backend klasörüne gidin:
```bash
cd backend
```

2. Sanal ortam oluşturun (önerilir):
```bash
python -m venv venv
```

3. Sanal ortamı aktifleştirin:

**Windows:**
```bash
venv\Scripts\activate
```

**Linux/Mac:**
```bash
source venv/bin/activate
```

4. Bağımlılıkları yükleyin:
```bash
pip install -r requirements.txt
```

5. Ortam değişkenlerini ayarlayın:
```bash
copy .env.example .env
```

### Frontend Kurulumu

1. Frontend klasörüne gidin:
```bash
cd frontend
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

## Çalıştırma

### Windows'ta tek tıkla başlatma

İlk kurulumdan sonra proje klasöründeki `Baslat.bat` dosyasına çift tıklayın. Backend ve frontend ayrı pencerelerde açılır ve tarayıcı `http://127.0.0.1:5173` adresine yönlendirilir. Bilgisayar kapatılıp açıldığında geliştirme sunucuları otomatik başlamaz; uygulamayı kullanmak için bu dosyayı yeniden çalıştırın. Sunucu pencerelerini kapatmak uygulamayı durdurur.

İlk kez kuruyorsanız önce aşağıdaki Backend ve Frontend Kurulumu adımlarını tamamlayın.

### Backend'i Çalıştırma

Backend klasöründe (sanal ortam aktifken):

```bash
cd backend
venv\Scripts\activate  # Windows
.\venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Backend şunları sağlar:
- API dokümantasyonu: http://localhost:8000/docs
- Sağlık kontrolü: http://localhost:8000/api/health
- Ana endpoint: http://localhost:8000/

### Frontend'i Çalıştırma

Frontend klasöründe (yeni terminal):

```bash
cd frontend
npm run dev
```

Frontend şu adreste çalışır: http://localhost:5173 (veya başka bir port kullanılıyorsa terminalde belirtilen adres)

## Portföy demosunu yayımlama

Render ve Vercel için başlangıç yapılandırmaları sırasıyla `render.yaml` ve `frontend/vercel.json` içindedir. Bu yapılandırmalar tek başına uygulamayı internete yayımlamaz; GitHub deposu ve Render/Vercel hesaplarında yetkilendirme gerekir. Bu projede henüz canlı demo adresi yoktur.

1. Projeyi bir GitHub deposuna gönderin ve Render'da bu depodan Blueprint oluşturup `render.yaml` dosyasını dağıtın.
2. Render'ın verdiği API adresini Vercel projesinde `VITE_API_BASE_URL` ortam değişkeni olarak tanımlayın; `VITE_DEMO_READ_ONLY=true` ayarını da ekleyin.
3. Vercel'de `frontend` klasörünü proje kökü olarak seçip dağıtın. Özel bir alan adı kullanılırsa Render'daki `CORS_ORIGIN_REGEX` ayarının bu alan adına izin verdiğini doğrulayın.

Herkese açık demo yalnızca sentetik kayıtlar kullanır. `DEMO_MODE=true` başlangıçta boş bir veritabanını demo verileriyle doldurur; demo kayıtları tekrar eklenmez ve finansal kayıt içeren bilinmeyen bir veritabanıyla başlatma güvenlik amacıyla reddedilir. Demo API'sindeki yazma istekleri 403 ile engellenir. Render ücretsiz hizmetlerinde `/tmp` verileri kalıcı değildir; bu nedenle burada kullanıcı verisi saklanmamalıdır.

## Mevcut Özellikler

Dashboard, işlemler, bütçeler, tasarruf hedefleri ve raporlar SQLite veritabanındaki gerçek verileri kullanır.

**Backend:**
- SQLite veritabanı ile tam entegrasyon
- Kategoriler API (listeleme ve işlem türüne göre filtreleme)
- İşlemler API (CRUD + gelişmiş filtreleme)
- Bütçeler API (CRUD + otomatik harcama hesaplama)
- Tasarruf hedefleri API (CRUD + ilerleme hesaplama)
- Dashboard özet API (dönem bazlı hesaplamalar)
- Finansal raporlar API
- Kural tabanlı AI önerileri API
- Pydantic ile veri doğrulama
- CORS yapılandırması
- Otomatik tablo oluşturma ve varsayılan kategoriler

**Frontend:**
- Modern, animasyonlu Türkçe arayüz
- Sol navigasyon menüsü (mobil uyumlu)
- Dashboard (gerçek API verileriyle)
- Gelir ve Giderler sayfası (tam işlevli):
  - İşlem ekleme formu
  - İşlem düzenleme
  - İşlem silme
  - Gelişmiş filtreleme (tür, kategori, tarih aralığı, arama)
  - Tablo görünümü
- API client ile backend entegrasyonu
- Custom hooks

### Tamamlanan frontend sayfaları

**Frontend:**
- Bütçelerim: bütçe CRUD ve işlem verilerinden otomatik harcama durumu
- Tasarruf hedefleri: hedef CRUD ve birikim ekleme
- Finansal raporlar: dönem filtresi, karşılaştırma grafiği ve kategori dağılımı
- Yapay Zekâ Asistanı: gerçek kayıtlarla kural tabanlı analiz (LLM değildir)
- Ayarlar: uygulama bilgisi ve backend sağlık kontrolü

## Test Senaryoları

Backend testleri izole geçici SQLite kullanır:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
```

Selenium arayüz testi geçici bir backend veritabanı ve Vite sunucusu başlatır. Google Chrome ve Selenium Manager'ın ChromeDriver'ı edinmek için ilk çalıştırmada internet erişimi gerekir:

```powershell
cd backend
.\venv\Scripts\python.exe -m pip install -r requirements-dev.txt
.\venv\Scripts\python.exe -m pytest ..\frontend\tests\selenium -q
```

Frontend tür kontrolü, üretim derlemesi ve lint:

```powershell
cd frontend
npm run build
npm run lint
```

Lint komutu mevcut `react(set-state-in-effect)` uyarılarını raporlayabilir.

Selenium/Pytest arayüz testleri ana sayfaları ve temel kullanıcı akışlarını otomatik kontrol eder. Testler Chrome'u headless çalıştırır; Selenium Manager ilk kullanımda uyumlu ChromeDriver'ı edinmek için internet erişimine ihtiyaç duyabilir.

### Postman / Newman API testleri

Kökteki `CepKontrol AI - API Tests.postman_collection.json` koleksiyonu sağlık kontrolü, gelir oluşturma ve geçersiz istek doğrulamalarını içerir. Newman komut satırı aracı ayrı kurulur (`npm install --global newman@6`). Test istekleri kayıt oluşturduğu için koleksiyonu kişisel veritabanına bağlı uygulamaya doğrudan çalıştırmayın. Güvenli, geçici SQLite kullanan runner'ı proje kökünde çalıştırın:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-Newman.ps1
```

Jenkins'te `scripts/Run-Newman.ps1` geçici SQLite veritabanı ve boş port kullanan ayrı API sunucusu başlatır; testlerden sonra yalnızca kendi başlattığı süreci durdurur. Newman'ın yerleşik JSON raporu `test-results/newman.json` dosyasına yazılır ve build artifact'i olarak saklanır. Backend ve Selenium Pytest JUnit XML raporları Jenkins `junit` adımıyla yayımlanır.

### Jenkins CI/CD Pipeline

Kökteki `Jenkinsfile`, Windows etiketli bir Jenkins ajanında checkout, araç/bağımlılık kontrolü, backend pytest, Newman API testleri, Selenium arayüz testleri, frontend build/lint, Maven/Cucumber kontrolü ve JUnit raporlarının yayımlanması aşamalarını tanımlar. Başarısız test veya build Pipeline'ı başarısız yapar. Raporlar derleme sonuçlarına eklenir; üretilen çıktı klasörleri Git'te tutulmaz.

Jenkins Windows ajanı için gerekli olanlar:

- Git ve Jenkins Pipeline, Git, JUnit eklentileri
- Python 3.12
- Node.js 20.19+ veya 22.12+ ve npm
- Newman 6.x PATH üzerinde
- Google Chrome şu konumda: `C:\Program Files\Google\Chrome\Application\chrome.exe`
- Maven 3.9.16 `C:\Program Files\apache-maven-3.9.16` konumunda ve Maven'in kullandığı JDK 21
- Selenium Manager'ın ChromeDriver edinmesi için ağ erişimi (veya ajan üzerinde uyumlu ChromeDriver yapılandırması)

Jenkins'te yeni bir **Pipeline** işi oluşturun; **Pipeline script from SCM** seçin, Git SCM ve GitHub depo adresini tanımlayın, `main` branch'ini seçin ve Script Path olarak `Jenkinsfile` girin. Sonra Build Now çalıştırın. Kaynak GitHub'a yüklenmiştir; ancak Jenkins kurulumu/build'i bu ortamda doğrulanmamıştır.

Jenkins Windows servisi, etkileşimli kullanıcı hesabının PATH ayarlarını görmeyebilir. Python kurulu olduğu hâlde bulunamazsa **Manage Jenkins > System > Global properties > Environment variables** altında `PYTHON312` değişkenini Jenkins ajanında erişilebilir `python.exe` dosyasının tam yolu olarak tanımlayın. Pipeline ayrıca `C:\Users\turka\AppData\Local\Programs\Python\Python312\python.exe`, PATH'teki `python` ve `py -3.12` yollarını dener; seçilen yorumlayıcının Python 3.12 olduğunu doğrular.

### Cucumber / Java API sağlık senaryosu

Kullanıcının ayrı Maven projesindeki Cucumber senaryosu `tests/cucumber` altına alındı. `api-health.feature`, `GET /api/health` isteğinin HTTP 200 dönmesini ve JSON içindeki `durum` alanının `sağlıklı` olmasını doğrular. TestRunner JSON ve Maven Surefire JUnit XML raporu üretir.

API'yi ve test veritabanını otomatik olarak başlatıp durduran güvenli çalıştırma komutu (Windows PowerShell):

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Run-Cucumber.ps1
```

Komut, izole SQLite ve boş port kullanan geçici bir FastAPI süreci başlatır; test bittiğinde kendi başlattığı süreci kapatıp geçici veritabanını temizler. Maven JDK 21 ile çalışmalıdır. Cucumber POM'u Java release 21 kullanır ve API adresini `-DcepKontrolApiBaseUrl=...` üzerinden alır. Jenkins `Run-Cucumber.ps1` çalıştırır ve JSON/JUnit raporlarını build artifact'i olarak saklar.

Son doğrulanmış yerel sonuçlar: backend pytest **7 geçti**; Selenium/Pytest **9 geçti**; Newman **4 istek ve 10 assertion, 0 başarısız**; Cucumber **1 senaryo geçti**; frontend `npm run build` başarılı oldu. `npm run lint` başarılı çıkış verdi ancak 9 `react(set-state-in-effect)` uyarısı raporladı. Bu sonuçlar yerel çalıştırmaya aittir; Jenkins build sonucu değildir.

### 1. Backend Kurulumu ve Çalıştırma

Backend'in doğru kurulduğunu ve çalıştığını doğrulayın:

```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Ardından tarayıcıda şu adresleri test edin:
- http://localhost:8000/api/health - "sağlıklı" yanıtını görmelisiniz
- http://localhost:8000/docs - Swagger dokümantasyonunu görmelisiniz

### 2. Gelir ve Giderler Sayfası Testi

Frontend çalıştıktan sonra:

1. **Sayfaya Erişim:**
   - Sol menüden "Gelir ve Giderler" seçeneğine tıklayın
   - Sayfanın düzgün açıldığını ve "Yeni İşlem" butonunu gördüğünüzü doğrulayın

2. **İşlem Ekleme:**
   - "Yeni İşlem" butonuna tıklayın
   - Formun açıldığını doğrulayın
   - İşlem türü olarak "Gelir" seçin
   - Tutar: 5000 girin
   - Açıklama: "Test geliri" girin
   - Kategori: "Maaş" seçin
   - Tarih: bugünü seçin
   - "Kaydet" butonuna tıklayın
   - İşlemin listeye eklendiğini doğrulayın

3. **İşlem Düzenleme:**
   - Listeden eklediğiniz işlemin düzenleme ikonuna tıklayın
   - Tutarı 6000 olarak değiştirin
   - "Kaydet" butonuna tıklayın
   - İşlemin güncellendiğini doğrulayın

4. **İşlem Silme:**
   - İşlemin silme ikonuna tıklayın
   - Onay istendiğinde "Tamam" deyin
   - İşlemin silindiğini doğrulayın

5. **Filtreleme:**
   - "Gider" türü filtresini seçin
   - Arama kutusuna bir metin girin
   - Tarih aralığı filtresi uygulayın
   - Filtrelerin doğru çalıştığını doğrulayın

6. **API Testi (Opsiyonel):**
   - Swagger dokümantasyonunda /api/transactions endpoint'ini test edin
   - POST ile yeni işlem oluşturun
   - GET ile işlemleri listeleyin
   - PUT ile işlem güncelleyin
   - DELETE ile işlem silin

## Geliştirme Notları

- Backend ve frontend ayrı portlarda çalışır (8000 ve 5173/5174)
- CORS ayarları frontend ile backend arasındaki iletişim için yapılandırılmıştır
- SQLite veritabanı uygulama ilk başladığında otomatik olarak oluşturulur
- Eksik varsayılan kategoriler otomatik ve tekrarlanabilir biçimde eklenir; mevcut kullanıcı kategorileri korunur
- Frontend API adresi `VITE_API_BASE_URL` ile değiştirilebilir; varsayılan `http://127.0.0.1:8000`'dır
- Tüm kullanıcıya görünen metinler Türkçe olarak hazırlanmıştır
- Tutarlar Türk lirası formatında gösterilir
- Tarihler Türkçe yerel ayarına uygun formatlanır

## Kapsam Dışı / Gelecek Çalışmalar

- Kullanıcı hesabı, kimlik doğrulama ve birden fazla kullanıcı desteği
- Gerçek LLM entegrasyonu (şu an AI endpoint'i kural tabanlıdır)
- Tema ve para birimi tercihlerini kaydetme
- Kategori oluşturma/düzenleme arayüzü ve API'si
- GitHub/Render/Vercel yetkilendirmesi ve canlı dağıtım (henüz canlı URL yok)

## Lisans

Bu proje eğitim ve portföy amaçlıdır.
