import { Navigate } from "react-router-dom";

/**
 * Protege rotas que exigem autenticação.
 *
 * Se o usuário não estiver autenticado,
 * redireciona para o login.
 *
 * Quando "perfisPermitidos" for informado,
 * também verifica se o perfil do usuário
 * possui permissão para acessar a rota.
 */
function ProtectedRoute({ children, perfisPermitidos = [] }) {
  const token = localStorage.getItem("access_token");
  const usuarioSalvo = localStorage.getItem("usuario");

  // Usuário não autenticado
  if (!token) {
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

  // Se a rota exigir perfis específicos,
  // verifica o perfil do usuário.
  if (
    perfisPermitidos.length > 0 &&
    !perfisPermitidos.includes(usuario?.perfil)
  ) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;