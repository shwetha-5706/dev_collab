import { useContext } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppContext, AppProvider } from './contexts/AppContext';
import Shell from './components/layout/Shell';
import AuthLanding from './pages/AuthLanding';
import './styles/global.css';

const AppRoutes = () => {
  const ctx = useContext(AppContext);
  if (!ctx) return null;

  return (
    <Routes>
      <Route path="/" element={<AuthLanding />} />
      <Route path="/verify" element={<AuthLanding verify />} />
      <Route path="/*" element={ctx.auth.isAuthenticated ? <Shell /> : <Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}

export default App;
