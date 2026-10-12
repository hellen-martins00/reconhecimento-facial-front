
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  ScanFace,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronRight,
} from "lucide-react";

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
    let cancelado = false;

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

        if (cancelado) return;

        urlFoto = URL.createObjectURL(resposta.data);
        setFotoAgente(urlFoto);
      } catch {
        if (!cancelado) {
          setFotoAgente(null);
        }
      }
    }

    carregarFotoAgente();

    return () => {
      cancelado = true;

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

  // Fecha o menu móvel ao trocar de página.
  useEffect(() => {
    setMenuAberto(false);
  }, [location.pathname]);

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
      icon: LayoutDashboard,
      active: location.pathname === "/dashboard",
    },
    {
      label: "Pessoas desaparecidas",
      path: "/pessoas",
      icon: Users,
      active: location.pathname.startsWith("/pessoas"),
    },
    {
      label: "Agentes de segurança",
      path: "/agentes",
      icon: ShieldCheck,
      active: location.pathname.startsWith("/agentes"),
    },
    {
      label: "Busca biométrica",
      path: "/reconhecimento",
      icon: ScanFace,
      active: location.pathname.startsWith("/reconhecimento"),
    },
  ];

  return (
    <div className="dashboard-layout">
      {menuAberto && (
        <button
          type="button"
          className="sidebar-overlay"
          onClick={() => setMenuAberto(false)}
          aria-label="Fechar menu"
          tabIndex={-1}
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
        {menuAberto ? <X size={22} /> : <Menu size={22} />}
      </button>

      <aside
        id="menu-lateral"
        className={`sidebar ${menuAberto ? "open" : ""}`}
        aria-label="Menu principal"
      >
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <ScanFace size={25} />
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
          {menuItems.map((item) => {
            const Icone = item.icon;

            return (
              <button
                key={item.path}
                type="button"
                className={`menu-item ${
                  item.active ? "active" : ""
                }`}
                onClick={() => handleNavigate(item.path)}
                aria-current={item.active ? "page" : undefined}
              >
                <Icone
                  className="menu-item-icon"
                  size={19}
                  strokeWidth={1.8}
                />

                <span>{item.label}</span>

                {item.active && (
                  <ChevronRight
                    className="menu-item-arrow"
                    size={16}
                  />
                )}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-footer-note">
            <span className="sidebar-footer-indicator" />
            Sistema de apoio à identificação
          </div>

          <button
            type="button"
            className="menu-item logout"
            onClick={handleLogout}
          >
            <LogOut size={19} className="menu-item-icon" />
            <span>Sair do sistema</span>
          </button>

          <div className="sidebar-version">
            REDE BIOMÉTRICA · SISTEMA DE APOIO
          </div>
        </div>
      </aside>

      <main className="dashboard-layout-content">
        <header className="dashboard-topbar">
          <div className="topbar-context">
            <span className="topbar-overline">
              SISTEMA DE LOCALIZAÇÃO DE PESSOAS DESAPARECIDAS
            </span>

            <span className="topbar-page">
              {menuItems.find((item) => item.active)?.label ||
                "Detalhes"}
            </span>
          </div>

          <div className="topbar-actions">
            <span className="topbar-status">
              <span className="status-dot" />
              Sistema disponível
            </span>

            <div className="topbar-divider" />

            <div className="topbar-user">
              <div className="topbar-user-info">
                <strong>{usuario?.nome || "Usuário"}</strong>
                <span>{usuario?.perfil || "Acesso autorizado"}</span>
              </div>

              <div className="topbar-avatar">
                {fotoAgente ? (
                  <img
                    src={fotoAgente}
                    alt=""
                  />
                ) : (
                  inicial
                )}
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-page-content">
          {children}
        </div>

        <footer className="dashboard-footer">
          <span>
            Rede Biométrica — Sistema de apoio à identificação
          </span>
          <span>Área restrita a usuários autorizados</span>
        </footer>
      </main>
    </div>
  );
}

export default DashboardLayout;
