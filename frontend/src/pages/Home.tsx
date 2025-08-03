import { Link } from 'react-router-dom';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-primary text-white py-20">
        <div className="container-responsive text-center">
          <h1 className="text-5xl font-bold mb-6">
            Modern Form Builder
          </h1>
          <p className="text-xl mb-8 text-blue-100 max-w-2xl mx-auto">
            Typeform benzeri güzel formlar oluşturun. Randevu sistemleri, 
            anketler ve başvuru formları için mükemmel çözüm.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register" className="btn btn-lg bg-white text-blue-600 hover:bg-gray-100">
              Ücretsiz Başla
            </Link>
            <Link to="/demo" className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-blue-600">
              Demo'yu İzle
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Neden BForm?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Modern, kullanıcı dostu ve güçlü özelliklerle dolu form builder'ımız 
              ile profesyonel formlar oluşturun.
            </p>
          </div>

          <div className="grid-responsive">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎨</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sürükle & Bırak</h3>
              <p className="text-gray-600">
                Typeform benzeri modern arayüz ile kolayca form oluşturun
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📅</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Randevu Sistemi</h3>
              <p className="text-gray-600">
                Google Calendar entegrasyonu ile otomatik randevu oluşturma
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📱</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Mobil Uyumlu</h3>
              <p className="text-gray-600">
                Tüm cihazlarda mükemmel görünüm ve kullanım deneyimi
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📧</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Email Bildirimleri</h3>
              <p className="text-gray-600">
                Otomatik email gönderimi ve bildirim sistemi
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">WhatsApp Entegrasyonu</h3>
              <p className="text-gray-600">
                Twilio ile WhatsApp mesaj gönderimi desteği
              </p>
            </div>

            <div className="text-center p-6">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Analitik & Raporlar</h3>
              <p className="text-gray-600">
                Detaylı form istatistikleri ve yanıt analizleri
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-50">
        <div className="container-responsive text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Hemen Başlayın
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            İlk formunuzu oluşturun ve BForm'un gücünü keşfedin. 
            Ücretsiz hesap açın ve hemen kullanmaya başlayın.
          </p>
          <Link to="/register" className="btn-primary btn-xl">
            Ücretsiz Hesap Aç
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;