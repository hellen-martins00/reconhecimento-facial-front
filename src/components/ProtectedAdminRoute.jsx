import { Navigate } from "react-router-dom";

function ProtectedAdminRoute({ children }) {
  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);

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