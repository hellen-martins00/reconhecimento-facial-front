
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import api from "../../services/api";
import "./DashboardLayout.css";

function DashboardLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuAberto, setMenuAberto] = useState(false);
  const [fotoAgente, setFotoAgente] = useState(null);

  const usuarioSalvo = localStorage.getItem("usuario");

  let usuario = null;

  try {
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);
    localStorage.removeItem("usuario");
  }

  useEffect(() => {
    let urlFoto;

    async function carregarFotoAgente() {
      if (!usuario?.id) {
        setFotoAgente(null);
        return;
      }

      try {
        const resposta = await api.get(
          `/agentes/${usuario.id}/foto`,
          { responseType: "blob" }
        );

        urlFoto = URL.createObjectURL(resposta.data);
        setFotoAgente(urlFoto);
      } catch {
        setFotoAgente(null);
      }
    }

    carregarFotoAgente();

    return () => {
      if (urlFoto) {
        URL.revokeObjectURL(urlFoto);
      }
    };
  }, [usuario?.id]);

  useEffect(() => {
    function handleEscape(event) {
      if (event.key === "Escape") {
        setMenuAberto(false);
      }
    }

    window.addEventListener("keydown", handleEscape);

    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, []);

  function handleNavigate(path) {
    navigate(path);
    setMenuAberto(false);
  }

  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    setMenuAberto(false);
    navigate("/login", { replace: true });
  }

  const inicial =
    usuario?.nome?.trim()?.charAt(0)?.toUpperCase() || "U";

  const menuItems = [
    {
      label: "Painel",
      path: "/dashboard",
      active: location.pathname === "/dashboard",
      icon: "▦",
    },
    {
      label: "Pessoas cadastradas",
      path: "/pessoas",
      active: location.pathname.startsWith("/pessoas"),
      icon: "♙",
    },
    {
      label: "Agentes",
      path: "/agentes",
      active: location.pathname.startsWith("/agentes"),
      icon: "♧",
    },
    {
      label: "Busca facial",
      path: "/reconhecimento",
      active: location.pathname.startsWith("/reconhecimento"),
      icon: "⌕",
    },
  ];

  return (
    <div className="dashboard-layout">
      {menuAberto && (
        <div
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
      )}

      <button
        type="button"
        className="menu-toggle-btn"
        onClick={() => setMenuAberto((aberto) => !aberto)}
        aria-label={menuAberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={menuAberto}
        aria-controls="menu-lateral"
      >
        {menuAberto ? "✕" : "☰"}
      </button>

      <aside
        id="menu-lateral"
        className={`sidebar ${menuAberto ? "open" : ""}`}
        aria-label="Menu principal"
        aria-hidden={!menuAberto}
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon" aria-hidden="true">
            <span>R</span>
          </div>

          <div className="sidebar-brand-text">
            <strong>Rede Biométrica</strong>
            <span>Identificação de pessoas</span>
          </div>
        </div>

        <div className="sidebar-profile">
          <div className="sidebar-avatar">
            {fotoAgente ? (
              <img
                src={fotoAgente}
                alt={`Foto de ${usuario?.nome || "agente"}`}
                onError={() => setFotoAgente(null)}
              />
            ) : (
              <span className="sidebar-avatar-initial">
                {inicial}
              </span>
            )}

            <span
              className="sidebar-status"
              title="Sessão ativa"
            />
          </div>

          <div className="sidebar-profile-info">
            <strong>{usuario?.nome || "Usuário"}</strong>

            <span>{usuario?.usuario || ""}</span>

            {usuario?.perfil && (
              <small>{usuario.perfil}</small>
            )}
          </div>
        </div>

        <div className="sidebar-section-label">
          MENU PRINCIPAL
        </div>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.path}
              type="button"
              className={`menu-item ${
                item.active ? "active" : ""
              }`}
              onClick={() => handleNavigate(item.path)}
              aria-current={item.active ? "page" : undefined}
              tabIndex={menuAberto ? 0 : -1}
            >
              <span className="menu-item-icon" aria-hidden="true">
                {item.icon}
              </span>

              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-note">
            Sistema de apoio à identificação
          </div>

          <button
            type="button"
            className="menu-item logout"
            onClick={handleLogout}
            tabIndex={menuAberto ? 0 : -1}
          >
            <span className="menu-item-icon" aria-hidden="true">
              ↪
            </span>

            <span>Sair do sistema</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-layout-content">
        {children}
      </main>
    </div>
  );
}

export default DashboardLayout;
