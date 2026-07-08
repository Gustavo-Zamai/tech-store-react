import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'ts_session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadSession);

  const login = (funcionario) => {
    const session = {
      id: funcionario.id,
      nomeCompleto: funcionario.nomeCompleto,
      email: funcionario.email,
      cargo: funcionario.cargo ?? '',
      nivelAcesso: funcionario.nivelAcesso ?? '',
      imagemUrl: funcionario.imagemUrl ?? '',
      idEmpresa: funcionario.idEmpresa,
      nomeEmpresa: funcionario.nomeEmpresa ?? '',
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    sessionStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
}
