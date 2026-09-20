import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import api from "../../services/api";
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

  // FOTO DO AGENTE
  const [fotoAgente, setFotoAgente] = useState(null);

  useEffect(() => {
    async function carregarFotoAgente() {
      if (!usuario?.id) {
        return;
      }

      try {
        const resposta = await api.get(`/agentes/${usuario.id}/foto`, {responseType: "blob", });

        const url = URL.createObjectURL(resposta.data);

        setFotoAgente(url);
      } catch (error) {
        // Agente sem foto cadastrada
        setFotoAgente(null);
      }
    }

    carregarFotoAgente();

    return () => {
      if (fotoAgente) {
        URL.revokeObjectURL(fotoAgente);
      }
    };
  }, [usuario?.id]);

  // NAVEGAÇÃO
  function handleNavigate(path) {
    navigate(path);
    setMenuAberto(false);
  }

  // LOGOUT
  function handleLogout() {
    localStorage.removeItem("access_token");
    localStorage.removeItem("usuario");

    setMenuAberto(false);

    navigate("/login", { replace: true });
  }

  // PRIMEIRA LETRA DO NOME
  const inicial =
    usuario?.nome?.trim()?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="dashboard-layout">

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

      {/* MENU LATERAL */}
      <aside className={`sidebar ${menuAberto ? "open" : ""}`}>

        {/* PERFIL DO AGENTE */}
        <div className="sidebar-profile">

          <div className="sidebar-avatar">

            {fotoAgente ? (
              <img
                src={fotoAgente}
                alt={`Foto de ${usuario?.nome || "agente"}`}
              />
            ) : (
              <span>{inicial}</span>
            )}

            {/* INDICADOR DE SESSÃO */}
            <span
              className="sidebar-status"
              title="Sessão ativa"
            />
          </div>

          <div className="sidebar-profile-info">

            <strong>
              {usuario?.nome || "Usuário"}
            </strong>

            <span>
              {usuario?.usuario || ""}
            </span>

            {usuario?.perfil && (
              <small>
                {usuario.perfil}
              </small>
            )}

          </div>

        </div>

        {/* IDENTIDADE DO SISTEMA */}
        <div className="sidebar-header">
          <h2>Reconhecimento</h2>
          <span>Facial</span>
        </div>

        {/* MENU */}
        <nav className="sidebar-menu">

          <button
            type="button"
            className={`menu-item ${location.pathname === "/dashboard"
                ? "active"
                : ""
              }`}
            onClick={() => handleNavigate("/dashboard")}
          >
            Dashboard
          </button>

          <button
            type="button"
            className={`menu-item ${location.pathname.startsWith("/pessoas")
                ? "active"
                : ""
              }`}
            onClick={() => handleNavigate("/pessoas")}
          >
            Pessoas
          </button>

          <button
            type="button"
            className={`menu-item ${location.pathname.startsWith("/agentes")
                ? "active"
                : ""
              }`}
            onClick={() => handleNavigate("/agentes")}
          >
            Agentes
          </button>

          <button
            type="button"
            className={`menu-item ${location.pathname === "/reconhecimento"
                ? "active"
                : ""
              }`}
            onClick={() =>
              handleNavigate("/reconhecimento")
            }
          >
            Reconhecimento facial
          </button>

        </nav>

        {/* RODAPÉ */}
        <div className="sidebar-footer">

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