import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { formatRelativeTime } from '../../utils';

interface FormResponse {
  _id: string;
  responses: Array<{
    fieldId: string;
    fieldLabel: string;
    fieldType: string;
    value: any;
  }>;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    timestamp: string;
  };
  submitterInfo: {
    name?: string;
    email?: string;
    phone?: string;
  };
  status: string;
  createdAt: string;
}

interface FormData {
  _id: string;
  title: string;
  description?: string;
  submissionCount: number;
}

const FormResponses: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<FormData | null>(null);
  const [responses, setResponses] = useState<FormResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('FormResponses mounted, formId:', formId);
    if (formId) {
      loadFormAndResponses();
    } else {
      setError('Form ID bulunamadı');
      setIsLoading(false);
    }
  }, [formId]);

  const loadFormAndResponses = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Loading form and responses for formId:', formId);

      // Load form info
      console.log('Fetching form info...');
      const formResponse = await fetch(`/api/forms/${formId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      console.log('Form response status:', formResponse.status);

      if (formResponse.ok) {
        const formData = await formResponse.json();
        console.log('Form data loaded:', formData);
        setForm(formData);

        // Load responses
        console.log('Fetching responses...');
        const responsesResponse = await fetch(`/api/responses/form/${formId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });

        console.log('Responses response status:', responsesResponse.status);

        if (responsesResponse.ok) {
          const responsesData = await responsesResponse.json();
          console.log('Responses data loaded:', responsesData);
          setResponses(responsesData.responses || responsesData || []);
        } else {
          console.log('Responses failed, but form loaded - showing empty responses');
          setResponses([]);
        }
      } else {
        const errorData = await formResponse.json();
        console.error('Form load failed:', errorData);
        setError(errorData.message || 'Form yüklenemedi');
        toast.error('Form bulunamadı');
      }
    } catch (error) {
      console.error('Load error:', error);
      setError('Yükleme hatası oluştu');
      toast.error('Yükleme hatası');
    } finally {
      setIsLoading(false);
    }
  };

  const getFieldValue = (response: FormResponse, fieldLabel: string) => {
    const field = response.responses.find(r => r.fieldLabel === fieldLabel);
    return field?.value || '-';
  };

  const exportToCsv = () => {
    if (!responses.length) return;

    // Get all unique field labels
    const allFields = new Set<string>();
    responses.forEach(response => {
      response.responses.forEach(field => {
        allFields.add(field.fieldLabel);
      });
    });

    const headers = ['Gönderim Tarihi', 'Email', 'Telefon', 'Ad', ...Array.from(allFields)];
    
    const csvData = responses.map(response => {
      return [
        new Date(response.createdAt).toLocaleDateString('tr-TR'),
        response.submitterInfo?.email || '-',
        response.submitterInfo?.phone || '-',
        response.submitterInfo?.name || '-',
        ...Array.from(allFields).map(field => getFieldValue(response, field))
      ].map(value => `"${value}"`).join(',');
    });

    const csvContent = [headers.join(','), ...csvData].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${form?.title || 'form'}-responses.csv`;
    link.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-responsive">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p>Yanıtlar yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || (!isLoading && !form)) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-responsive">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Form bulunamadı'}
            </h1>
            <p className="text-gray-600 mb-4">
              Form ID: {formId}
            </p>
            <Link to="/dashboard" className="btn-primary">
              Dashboard'a Dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-responsive">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">
                ← Dashboard
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{form.title}</h1>
            <p className="text-gray-600 mt-2">
              {form.description || 'Form yanıtlarını görüntüleyin ve yönetin'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-2xl font-bold text-blue-600">{responses.length}</p>
              <p className="text-sm text-gray-500">Toplam Yanıt</p>
            </div>
            {responses.length > 0 && (
              <button
                onClick={exportToCsv}
                className="btn btn-outline"
              >
                📊 CSV İndir
              </button>
            )}
          </div>
        </div>

        {responses.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              Henüz yanıt yok
            </h3>
            <p className="text-gray-600 mb-6">
              Bu form için henüz hiç yanıt gelmemiş. Form linkinizi paylaştığınızdan emin olun.
            </p>
            <Link to={`/forms/${formId}/edit`} className="btn-primary">
              Formu Düzenle
            </Link>
          </div>
        ) : (
          <>
            {/* Responses Table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Gönderim Tarihi
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Kişi Bilgileri
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Yanıt Özeti
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Durum
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {responses.map((response) => (
                      <tr key={response._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {new Date(response.createdAt).toLocaleDateString('tr-TR')}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatRelativeTime(response.createdAt)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {response.submitterInfo?.name || 'İsimsiz'}
                          </div>
                          {response.submitterInfo?.email && (
                            <div className="text-sm text-gray-500">
                              📧 {response.submitterInfo.email}
                            </div>
                          )}
                          {response.submitterInfo?.phone && (
                            <div className="text-sm text-gray-500">
                              📞 {response.submitterInfo.phone}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 max-w-xs truncate">
                            {response.responses.slice(0, 2).map((field, idx) => (
                              <div key={idx} className="mb-1">
                                <span className="font-medium">{field.fieldLabel}:</span> {field.value}
                              </div>
                            ))}
                            {response.responses.length > 2 && (
                              <div className="text-gray-500">
                                +{response.responses.length - 2} daha...
                              </div>
                            )}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            response.status === 'processed' 
                              ? 'bg-green-100 text-green-800'
                              : response.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {response.status === 'processed' ? 'İşlendi' : 
                             response.status === 'pending' ? 'Beklemede' : 'Hata'}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setSelectedResponse(response)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Detayları Gör
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Response Detail Modal */}
        {selectedResponse && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Yanıt Detayları</h3>
                  <button
                    onClick={() => setSelectedResponse(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                {/* Submitter Info */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Gönderen Bilgileri</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <div><span className="font-medium">Ad:</span> {selectedResponse.submitterInfo?.name || '-'}</div>
                    <div><span className="font-medium">Email:</span> {selectedResponse.submitterInfo?.email || '-'}</div>
                    <div><span className="font-medium">Telefon:</span> {selectedResponse.submitterInfo?.phone || '-'}</div>
                    <div><span className="font-medium">Tarih:</span> {new Date(selectedResponse.createdAt).toLocaleString('tr-TR')}</div>
                  </div>
                </div>

                {/* Responses */}
                <div className="mb-6">
                  <h4 className="font-medium text-gray-900 mb-3">Yanıtlar</h4>
                  <div className="space-y-4">
                    {selectedResponse.responses.map((field, index) => (
                      <div key={index} className="border-b border-gray-100 pb-3">
                        <div className="font-medium text-gray-700 mb-1">{field.fieldLabel}</div>
                        <div className="text-gray-900">{field.value}</div>
                        <div className="text-xs text-gray-500 mt-1">Tip: {field.fieldType}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Metadata */}
                <div className="text-xs text-gray-500">
                  <div>IP: {selectedResponse.metadata.ipAddress || '-'}</div>
                  <div>Tarayıcı: {selectedResponse.metadata.userAgent || '-'}</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormResponses;