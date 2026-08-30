import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Painel</h1>

          <p>
            Visão geral do sistema de reconhecimento facial.
          </p>
        </div>
      </header>

      {/* CARDS */}
      <section className="dashboard-cards">

        <div className="dashboard-card">
          <span>Pessoas cadastradas</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-card">
          <span>Agentes cadastrados</span>
          <strong>0</strong>
        </div>

        <div className="dashboard-card">
          <span>Reconhecimentos realizados</span>
          <strong>0</strong>
        </div>

      </section>

      {/* RECONHECIMENTO */}
      <section className="recognition-card">
        <div>
          <h2>Reconhecimento Facial</h2>

          <p>
            Realize uma nova identificação facial utilizando a câmera.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate("/reconhecimento")}
        >
          Iniciar reconhecimento
        </button>
      </section>
    </div>
  );
}

export default Dashboard;