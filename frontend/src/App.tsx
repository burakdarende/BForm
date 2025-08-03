import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import Layout from './components/Layout/Layout';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import FormBuilder from './pages/FormBuilder/FormBuilder';
import FormView from './pages/Form/FormView';
import FormSubmitted from './pages/Form/FormSubmitted';
import FormResponses from './pages/Dashboard/FormResponses';
import FormAnalytics from './pages/Dashboard/FormAnalytics';
import ThemeManager from './pages/Dashboard/ThemeManager';
import Settings from './pages/Settings/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/Auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Protected Admin Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/forms/new" element={
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          } />
          <Route path="/forms/:formId/edit" element={
            <ProtectedRoute>
              <FormBuilder />
            </ProtectedRoute>
          } />
          <Route path="/forms/:formId/responses" element={
            <ProtectedRoute>
              <FormResponses />
            </ProtectedRoute>
          } />
          <Route path="/forms/:formId/analytics" element={
            <ProtectedRoute>
              <FormAnalytics />
            </ProtectedRoute>
          } />
          <Route path="/themes" element={
            <ProtectedRoute>
              <ThemeManager />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />
        </Route>

        {/* Public Form Routes */}
        <Route path="/preview" element={<FormView />} />
        <Route path="/:slug" element={<FormView />} />
        <Route path="/:slug/submitted" element={<FormSubmitted />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;