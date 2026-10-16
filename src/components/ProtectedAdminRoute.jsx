import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const usuarioSalvo = localStorage.getItem("usuario");

  if (!token || !usuarioSalvo) {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    return <Navigate to="/login" replace />;
  }

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);

    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    return <Navigate to="/login" replace />;
  }

  // Usuário não autenticado
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // Somente ADMIN
  if (usuario.perfil !== "ADMIN") {
    return <Navigate to="/agentes" replace />;
  }

  return children;
}

export default ProtectedAdminRoute;