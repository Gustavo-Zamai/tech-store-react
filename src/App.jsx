import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Produtos from './pages/Produtos';
import Clientes from './pages/Clientes';
import Vendas from './pages/Vendas';
import Funcionarios from './pages/Funcionarios';
import Empresas from './pages/Empresas';
import Fornecedores from './pages/Fornecedores';
import Grupos from './pages/Grupos';
import Marcas from './pages/Marcas';
import UnidadesMedida from './pages/UnidadesMedida';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              element={(
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              )}
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/produtos" element={<Produtos />} />
              <Route path="/clientes" element={<Clientes />} />
              <Route path="/vendas" element={<Vendas />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/empresas" element={<Empresas />} />
              <Route path="/fornecedores" element={<Fornecedores />} />
              <Route path="/grupos" element={<Grupos />} />
              <Route path="/marcas" element={<Marcas />} />
              <Route path="/unidades-medida" element={<UnidadesMedida />} />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
