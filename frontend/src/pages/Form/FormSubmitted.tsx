const FormSubmitted: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-2xl">✅</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Teşekkürler!
        </h1>
        <p className="text-gray-600">
          Formunuz başarıyla gönderildi.
        </p>
      </div>
    </div>
  );
};

export default FormSubmitted;