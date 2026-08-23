import { Navigate } from "react-router-dom";

/**
 * Componente wrapper para proteger rotas privadas.
 * Se houver token no localStorage, renderiza a rota filha;
 * caso contrário, redireciona o usuário para a página de login.
 */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;