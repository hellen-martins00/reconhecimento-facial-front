import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/Layout/DashboardLayout";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  return (
    <DashboardLayout>
      {/* CABEÇALHO */}
      <header className="dashboard-header">
        <div>
          <h1>Dashboard</h1>
          <p>Visão geral do sistema</p>
        </div>

        <div className="user-info">
          <strong>{usuario?.nome || "Usuário"}</strong>
          <span>{usuario?.usuario || ""}</span>
        </div>
      </header>

      {/* CARDS DE MÉTRICAS */}
      <section className="dashboard-cards">
        <div className="dashboard-card">
          <span>Pessoas</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-card">
          <span>Agentes</span>
          <strong>1</strong>
        </div>

        <div className="dashboard-card">
          <span>Reconhecimentos</span>
          <strong>0</strong>
        </div>
      </section>

      {/* CARD DE AÇÃO DE RECONHECIMENTO */}
      <section className="recognition-card">
        <div>
          <h2>Reconhecimento facial</h2>
          <p>
            Realize o reconhecimento facial de uma pessoa cadastrada no
            sistema.
          </p>
        </div>

        <button type="button" onClick={() => navigate("/login")}>
          Iniciar reconhecimento
        </button>
      </section>
    </DashboardLayout>
  );
}

export default Dashboard;