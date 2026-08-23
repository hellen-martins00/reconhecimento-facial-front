import { useNavigate } from "react-router-dom";

import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  const navigate = useNavigate();

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    navigate("/login");
  }

  return (
    <div className="dashboard-layout">
      {/* MENU LATERAL */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Reconhecimento</h2>
          <span>Facial</span>
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className="menu-item"
            onClick={() => navigate("/pessoas")}
          >
            Pessoas
          </button>

          <button type="button" className="menu-item">
            Agentes
          </button>

          <button type="button" className="menu-item">
            Telefones
          </button>

          <button type="button" className="menu-item">
            Endereços
          </button>

          <button type="button" className="menu-item">
            Passagens criminais
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{usuario?.nome || "Usuário"}</strong>
            <span>{usuario?.usuario || ""}</span>
          </div>

          <button
            type="button"
            className="menu-item logout"
            onClick={handleLogout}
          >
            Sair
          </button>
        </div>
      </aside>

      {/* CONTEÚDO DA PÁGINA */}
      <main className="dashboard-layout-content">{children}</main>
    </div>
  );
}

export default DashboardLayout;