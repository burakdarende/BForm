# BForm - Modern Form Builder

**BForm**, Typeform benzeri modern bir form oluşturma ve yönetim sistemidir. Sürükle-bırak arayüzü ile form oluşturun, randevu sistemleri kurun ve yanıtları yönetin.

## 🚀 Özellikler

- **Sürükle-Bırak Form Builder**: Typeform benzeri modern arayüz
- **Randevu Yönetimi**: Otomatik takvim entegrasyonu
- **E-posta Bildirimleri**: Nodemailer ile otomatik e-posta gönderimi
- **WhatsApp Entegrasyonu**: Twilio ile mesaj gönderimi
- **Google Calendar API**: Otomatik randevu oluşturma
- **Responsive Tasarım**: Mobil uyumlu arayüz
- **Admin Paneli**: Form yönetimi ve analitik
- **Gerçek Zamanlı**: Modern React + TypeScript

## 🛠️ Teknolojiler

### Frontend
- **React 18** + TypeScript
- **TailwindCSS** - Modern styling
- **React Hook Form** - Form validasyonu
- **DnD Kit** - Sürükle-bırak arayüzü
- **Framer Motion** - Animasyonlar
- **React Query** - Veri yönetimi

### Backend
- **Node.js** + Express
- **MongoDB** + Mongoose
- **JWT** Authentication
- **Nodemailer** - Email servisi
- **Google Calendar API**
- **Twilio** - WhatsApp entegrasyonu

### DevOps
- **Docker** + Docker Compose
- **Vite** - Frontend build tool
- **ESLint** + Prettier

## 📋 Kurulum

### Gereksinimler

1. **Node.js** (v18+) - [nodejs.org](https://nodejs.org)
2. **Docker Desktop** - [docker.com](https://www.docker.com/products/docker-desktop/)
3. **Git** - [git-scm.com](https://git-scm.com/)

### Adım 1: Projeyi Klonlayın

\`\`\`bash
git clone <repository-url>
cd BForm
\`\`\`

### Adım 2: Ortam Değişkenlerini Ayarlayın

\`\`\`bash
# .env dosyasını oluşturun
copy env-example.txt .env

# Kendi bilgilerinizi girin
notepad .env
\`\`\`

### Adım 3: Docker ile Çalıştırın

\`\`\`bash
# Tüm servisleri başlat
docker-compose up --build

# Arka planda çalıştırmak için
docker-compose up -d --build
\`\`\`

### Adım 4: Uygulamayı Açın

- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MongoDB**: localhost:27017

## ⚙️ Yapılandırma

### Email Ayarları (Gmail)

1. Gmail hesabınıza giriş yapın
2. 2FA'yı aktifleştirin
3. Uygulama şifresi oluşturun: [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
4. \`.env\` dosyasında ayarlayın:

\`\`\`env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-character-app-password
\`\`\`

### Google Calendar API

1. [Google Cloud Console](https://console.cloud.google.com/) açın
2. Yeni proje oluşturun
3. Calendar API'yi aktifleştirin
4. OAuth 2.0 credentials oluşturun
5. \`.env\` dosyasında ayarlayın:

\`\`\`env
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5000/auth/google/callback
\`\`\`

### Twilio WhatsApp (Opsiyonel)

1. [Twilio Console](https://console.twilio.com/) hesabı açın
2. WhatsApp sandbox'ı aktifleştirin
3. Credentials'ları \`.env\` dosyasına ekleyin:

\`\`\`env
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
\`\`\`

## 🏗️ Proje Yapısı

\`\`\`
BForm/
├── backend/                 # Node.js API
│   ├── models/             # MongoDB modelleri
│   ├── routes/             # API route'ları
│   ├── services/           # Email, Calendar, WhatsApp
│   ├── middleware/         # Auth middleware
│   └── utils/              # Yardımcı fonksiyonlar
├── frontend/               # React uygulaması
│   ├── src/
│   │   ├── components/     # React bileşenleri
│   │   ├── pages/          # Sayfa bileşenleri
│   │   ├── hooks/          # Custom hooks
│   │   ├── api/            # API client
│   │   ├── types/          # TypeScript tipler
│   │   └── utils/          # Yardımcı fonksiyonlar
│   └── public/
├── docker-compose.yml      # Docker yapılandırması
└── .env                    # Ortam değişkenleri
\`\`\`

## 🚀 Kullanım

### 1. Hesap Oluşturun

- [http://localhost:3000/register](http://localhost:3000/register) adresinden kayıt olun
- İlk kullanıcı otomatik olarak admin olur

### 2. Form Oluşturun

- Dashboard'a gidin
- "Yeni Form" butonuna tıklayın
- Sürükle-bırak ile alanları ekleyin
- Form ayarlarını yapılandırın

### 3. Formu Paylaşın

- Form oluşturduktan sonra public link alın
- Örnek: \`http://localhost:3000/randevu-formu\`
- Sosyal medyada veya web sitenizde paylaşın

### 4. Yanıtları Yönetin

- Dashboard'dan form yanıtlarını görün
- CSV olarak dışa aktarın
- Durum güncellemeleri yapın

## 🔧 Geliştirme

### Local Geliştirme (Docker olmadan)

\`\`\`bash
# Backend
cd backend
npm install
npm run dev

# Frontend (yeni terminal)
cd frontend
npm install
npm run dev

# MongoDB (Docker ile)
docker run -d -p 27017:27017 --name bform-mongo mongo:7
\`\`\`

### Kod Formatlama

\`\`\`bash
# Frontend
cd frontend
npm run lint
npm run format

# Backend
cd backend
npm run lint
\`\`\`

## 📝 API Endpoints

### Authentication
- \`POST /api/auth/register\` - Kayıt ol
- \`POST /api/auth/login\` - Giriş yap
- \`GET /api/auth/me\` - Kullanıcı bilgisi

### Forms
- \`GET /api/forms/public\` - Public formlar
- \`GET /api/forms/my\` - Kullanıcının formları
- \`POST /api/forms\` - Yeni form oluştur
- \`PUT /api/forms/:id\` - Form güncelle

### Responses
- \`POST /api/responses/submit/:slug\` - Form gönder
- \`GET /api/responses/form/:formId\` - Form yanıtları

## 🐛 Sorun Giderme

### Port Çakışması
\`\`\`bash
# Kullanılan portları kontrol et
netstat -ano | findstr :3000
netstat -ano | findstr :5000

# Docker containers'ı yeniden başlat
docker-compose down
docker-compose up --build
\`\`\`

### MongoDB Bağlantı Hatası
\`\`\`bash
# MongoDB container'ını kontrol et
docker ps
docker logs bform-mongo

# Veritabanını sıfırla
docker-compose down -v
docker-compose up --build
\`\`\`

### Email Gönderememe
- Gmail uygulama şifresini kontrol edin
- 2FA aktif olduğundan emin olun
- \`.env\` dosyasındaki credentials'ları kontrol edin

## 📄 Lisans

MIT License - Detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 🤝 Katkıda Bulunun

1. Fork yapın
2. Feature branch oluşturun (\`git checkout -b feature/amazing-feature\`)
3. Commit yapın (\`git commit -m 'feat: add amazing feature'\`)
4. Push yapın (\`git push origin feature/amazing-feature\`)
5. Pull Request açın

## 📞 Destek

Herhangi bir sorunuz varsa:
- Issue açın: [GitHub Issues](https://github.com/youruser/bform/issues)
- Email: your-email@domain.com

---

**Not**: Bu proje Typeform'dan ilham alınarak oluşturulmuştur ve sadece eğitim/kişisel kullanım amaçlıdır.