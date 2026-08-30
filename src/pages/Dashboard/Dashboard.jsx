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
    setMenuAberto(false); // Fecha o menu ao clicar em uma rota no mobile
  };

  const handleLogout = () => {
    localStorage.removeItem("usuario");
    navigate("/login");
  };

  return (
    <div className="dashboard">
      {/* OVERLAY PARA FECHAR O MENU EM TELAS PEQUENAS AO CLICAR FORA */}
      {menuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
        />
      )}

      {/* BOTÃO DE 3 PONTINHOS / TOGGLE DO MENU */}
      <button
        className="menu-toggle-btn"
        onClick={() => setMenuAberto(!menuAberto)}
        title="Abrir Menu"
      >
        &#8942; {/* Ícone de 3 pontinhos verticais */}
      </button>

      {/* SIDEBAR RETRÁTIL */}
      <aside className={`sidebar ${menuAberto ? "open" : "collapsed"}`}>
        <div className="sidebar-header">
          <h2>Reconhecimento</h2>
          <span>Facial</span>
        </div>

        <nav className="sidebar-menu">
          <button
            className={`menu-item ${location.pathname === "/dashboard" ? "active" : ""}`}
            onClick={() => handleNavigate("/dashboard")}
          >
            Painel
          </button>
          <button
            className={`menu-item ${location.pathname === "/pessoas" ? "active" : ""}`}
            onClick={() => handleNavigate("/pessoas")}
          >
            Pessoas
          </button>
          <button
            className={`menu-item ${location.pathname === "/agentes" ? "active" : ""}`}
            onClick={() => handleNavigate("/agentes")}
          >
            Agentes
          </button>
          <button
            className={`menu-item ${location.pathname === "/telefones" ? "active" : ""}`}
            onClick={() => handleNavigate("/telefones")}
          >
            Telefones
          </button>
          <button
            className={`menu-item ${location.pathname === "/enderecos" ? "active" : ""}`}
            onClick={() => handleNavigate("/enderecos")}
          >
            Endereços
          </button>
          <button
            className={`menu-item ${location.pathname === "/passagens" ? "active" : ""}`}
            onClick={() => handleNavigate("/passagens")}
          >
            Passageiros criminosos
          </button>
          <button
            className={`menu-item ${location.pathname === "/reconhecimento" ? "active" : ""}`}
            onClick={() => handleNavigate("/reconhecimento")}
          >
            Reconhecimento facial
          </button>

          <button className="menu-item logout" onClick={handleLogout}>
            Sair
          </button>
        </nav>
      </aside>

      {/* CONTEÚDO DA PÁGINA */}
      <main className="dashboard-content">{children}</main>
    </div>
  );
}

export default DashboardLayout;