import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useMyForms, useDeleteForm } from '../../hooks/useForms';
import { formatRelativeTime, createFormUrl, copyToClipboard } from '../../utils';
import toast from 'react-hot-toast';
import type { Form } from '../../types';

const Dashboard: React.FC = () => {
  const { data: forms, isLoading, error } = useMyForms();
  const deleteFormMutation = useDeleteForm();

  const stats = {
    totalForms: forms?.length || 0,
    totalResponses: forms?.reduce((sum, form) => sum + (form.submissionCount || 0), 0) || 0,
    activeForms: forms?.filter(form => form.isActive).length || 0,
    weeklyResponses: 0 // TODO: Calculate from actual data
  };

  const copyFormUrl = async (slug: string) => {
    const url = createFormUrl(slug);
    const success = await copyToClipboard(url);
    if (success) {
      toast.success('Form linki kopyalandı!');
    } else {
      toast.error('Link kopyalanamadı');
    }
  };

  const deleteForm = async (formId: string, formTitle: string) => {
    if (!confirm(`"${formTitle}" formunu silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
      return;
    }

    deleteFormMutation.mutate(formId);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-responsive">
          <div className="text-center">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p>Formlarınız yükleniyor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-responsive">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Formlarınızı yönetin ve yanıtları inceleyin
            </p>
          </div>
          <Link
            to="/forms/new"
            className="btn-primary"
          >
            🆕 Yeni Form Oluştur
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📝</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Toplam Form
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.totalForms}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📊</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Toplam Yanıt
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.totalResponses}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">⚡</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Aktif Form
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.activeForms}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📈</span>
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Bu Hafta
                    </dt>
                    <dd className="text-lg font-semibold text-gray-900">{stats.weeklyResponses}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Forms List */}
        {forms && forms.length > 0 ? (
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold">Formlarınız</h2>
            </div>
            <div className="divide-y divide-gray-200">
              {forms.map((form: Form) => (
                <div key={form._id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {form.title}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          form.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {form.isActive ? 'Aktif' : 'Pasif'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {form.description || 'Açıklama yok'}
                      </p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>📊 {form.submissionCount || 0} yanıt</span>
                        <span>🕐 {formatRelativeTime(form.updatedAt)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyFormUrl(form.slug)}
                        className="btn btn-outline btn-sm"
                        title="Link Kopyala"
                      >
                        🔗
                      </button>
                      <Link
                        to={`/forms/${form._id}/responses`}
                        className="btn btn-outline btn-sm"
                        title="Yanıtları Görüntüle"
                      >
                        📊
                      </Link>
                      <Link
                        to={`/forms/${form._id}/edit`}
                        className="btn btn-outline btn-sm"
                        title="Formu Düzenle"
                      >
                        ✏️
                      </Link>
                      <Link
                        to={`/${form.slug}`}
                        target="_blank"
                        className="btn btn-primary btn-sm"
                        title="Formu Görüntüle"
                      >
                        👀
                      </Link>
                      <button
                        onClick={() => deleteForm(form._id, form.title)}
                        disabled={deleteFormMutation.isLoading}
                        className="btn btn-outline btn-sm text-red-600 hover:bg-red-50 hover:border-red-300"
                        title="Formu Sil"
                      >
                        {deleteFormMutation.isLoading ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-4">
              İlk formunuzu oluşturun
            </h3>
            <p className="text-gray-600 mb-6">
              Henüz hiç formunuz yok. Hemen başlayın ve ilk formunuzu oluşturun!
            </p>
            <Link
              to="/forms/new"
              className="btn-primary btn-lg"
            >
              🚀 Yeni Form Oluştur
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;