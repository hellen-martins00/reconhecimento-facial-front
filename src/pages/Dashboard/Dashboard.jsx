import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function DashboardLayout({ children }) {
  const [menuAberto, setMenuAberto] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  const handleNavigate = (path) => {
    navigate(path);

    // Fecha o menu após navegar
    setMenuAberto(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    localStorage.removeItem("access_token");

    navigate("/login");
  };

  return (
    <div className={`dashboard ${menuAberto ? "menu-open" : ""}`}>

      {/* OVERLAY */}
      {menuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* BOTÃO MENU */}
      <button
        type="button"
        className="menu-toggle-btn"
        onClick={() => setMenuAberto(!menuAberto)}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
      >
        {menuAberto ? "✕" : "☰"}
      </button>

      {/* SIDEBAR */}
      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>

        <div className="sidebar-header">
          <h2>Reconhecimento</h2>
          <span>Facial</span>
        </div>

        <nav className="sidebar-menu">

          <button
            className={`menu-item ${
              location.pathname === "/dashboard" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/dashboard")}
          >
            Painel
          </button>

          <button
            className={`menu-item ${
              location.pathname === "/pessoas" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/pessoas")}
          >
            Pessoas
          </button>

          <button
            className={`menu-item ${
              location.pathname === "/agentes" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/agentes")}
          >
            Agentes
          </button>

          <button
            className={`menu-item ${
              location.pathname === "/telefones" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/telefones")}
          >
            Telefones
          </button>

          <button
            className={`menu-item ${
              location.pathname === "/enderecos" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/enderecos")}
          >
            Endereços
          </button>

          <button
            className={`menu-item ${
              location.pathname === "/passagens" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/passagens")}
          >
            Passagens criminais
          </button>

          <button
            className={`menu-item ${
              location.pathname === "/reconhecimento" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/reconhecimento")}
          >
            Reconhecimento facial
          </button>

          <button
            className="menu-item logout"
            onClick={handleLogout}
          >
            Sair
          </button>

        </nav>

      </aside>

      {/* CONTEÚDO */}
      <main className="dashboard-content">
        {children}
      </main>

    </div>
  );
}

export default DashboardLayout;