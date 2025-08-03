import { Link } from 'react-router-dom';

const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300">404</h1>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Sayfa Bulunamadı
        </h2>
        <p className="text-lg text-gray-600 mb-8 max-w-md">
          Aradığınız sayfa mevcut değil veya taşınmış olabilir.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/" className="btn-primary">
            Ana Sayfaya Dön
          </Link>
          <Link to="/dashboard" className="btn-outline">
            Dashboard'a Git
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;