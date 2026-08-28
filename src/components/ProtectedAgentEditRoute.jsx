import { Navigate, useParams } from "react-router-dom";

function ProtectedAgentEditRoute({ children }) {
  const { id } = useParams();

  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);

    return <Navigate to="/login" replace />;
  }

  // Sem usuário autenticado
  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  // ADMIN pode editar qualquer agente
  const isAdmin = usuario.perfil === "ADMIN";

  // AGENTE pode editar somente o próprio cadastro
  const isProprioAgente = usuario.id === id;

  // Se não for ADMIN nem o próprio agente
  if (!isAdmin && !isProprioAgente) {
    return <Navigate to="/agentes" replace />;
  }

  return children;
}

export default ProtectedAgentEditRoute;