import { useNavigate } from "react-router-dom";

import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  const navigate = useNavigate();

  // USUÁRIO LOGADO
  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);
    localStorage.removeItem("usuario");
  }

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    navigate("/login", { replace: true });
  }

  // TELA
  return (
    <div className="dashboard-layout">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        {/* CABEÇALHO */}
        <div className="sidebar-header">
          <h2>Reconhecimento</h2>
          <span>Facial</span>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">
          {/* DASHBOARD */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          {/* PESSOAS */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/pessoas")}
          >
            Pessoas
          </button>

          {/* AGENTES */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/agentes")}
          >
            Agentes
          </button>

          {/* TELEFONES */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/telefones")}
          >
            Telefones
          </button>

          {/* ENDEREÇOS */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/enderecos")}
          >
            Endereços
          </button>

          {/* PASSAGENS CRIMINAIS */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/passagens-criminais")}
          >
            Passagens criminais
          </button>

          {/* RECONHECIMENTO */}
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/reconhecimento")}
          >
            Reconhecimento facial
          </button>
        </nav>

        {/* RODAPÉ */}
        <div className="sidebar-footer">
          {/* USUÁRIO */}
          <div className="sidebar-user">
            <strong>{usuario?.nome || "Usuário"}</strong>
            <span>{usuario?.usuario || ""}</span>
            {usuario?.perfil && <small>{usuario.perfil}</small>}
          </div>

          {/* LOGOUT */}
          <button
            type="button"
            className="menu-item logout"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO */}
      <main className="dashboard-layout-content">{children}</main>
    </div>
  );
}

export default DashboardLayout;