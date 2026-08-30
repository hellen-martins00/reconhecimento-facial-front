import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  // CONTROLA ABERTURA/FECHAMENTO DO MENU
  const [menuAberto, setMenuAberto] = useState(false);

  // USUÁRIO LOGADO
  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);
    localStorage.removeItem("usuario");
  }

  // NAVEGAÇÃO
  function handleNavigate(path) {
    navigate(path);

    // Fecha o menu após clicar em uma opção
    // Isso é especialmente importante no celular
    setMenuAberto(false);
  }

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    setMenuAberto(false);

    navigate("/login", { replace: true });
  }

  return (
    <div className="dashboard-layout">

      {/* OVERLAY - aparece quando o menu está aberto */}
      {menuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* BOTÃO PARA ABRIR/FECHAR MENU */}
      <button
        type="button"
        className="menu-toggle-btn"
        onClick={() => setMenuAberto(!menuAberto)}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
      >
        {menuAberto ? "✕" : "☰"}
      </button>

      {/* MENU LATERAL */}
      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>

        {/* CABEÇALHO */}
        <div className="sidebar-header">
          <h2>Reconhecimento</h2>
          <span>Facial</span>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">

          <button
            type="button"
            className={`menu-item ${
              location.pathname === "/dashboard" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={`menu-item ${
              location.pathname.startsWith("/pessoas") ? "active" : ""
            }`}
            onClick={() => handleNavigate("/pessoas")}
          >
            Pessoas
          </button>

          <button
            type="button"
            className={`menu-item ${
              location.pathname.startsWith("/agentes") ? "active" : ""
            }`}
            onClick={() => handleNavigate("/agentes")}
          >
            Agentes
          </button>

          <button
            type="button"
            className={`menu-item ${
              location.pathname === "/telefones" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/telefones")}
          >
            Telefones
          </button>

          <button
            type="button"
            className={`menu-item ${
              location.pathname === "/enderecos" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/enderecos")}
          >
            Endereços
          </button>

          <button
            type="button"
            className={`menu-item ${
              location.pathname === "/passagens-criminais"
                ? "active"
                : ""
            }`}
            onClick={() => handleNavigate("/passagens-criminais")}
          >
            Passagens criminais
          </button>

          <button
            type="button"
            className={`menu-item ${
              location.pathname === "/reconhecimento" ? "active" : ""
            }`}
            onClick={() => handleNavigate("/reconhecimento")}
          >
            Reconhecimento facial
          </button>

        </nav>

        {/* RODAPÉ */}
        <div className="sidebar-footer">

          <div className="sidebar-user">
            <strong>{usuario?.nome || "Usuário"}</strong>

            <span>{usuario?.usuario || ""}</span>

            {usuario?.perfil && (
              <small>{usuario.perfil}</small>
            )}
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

      {/* CONTEÚDO */}
      <main className="dashboard-layout-content">
        {children}
      </main>

    </div>
  );
}

export default DashboardLayout;