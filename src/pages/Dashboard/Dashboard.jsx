import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [totalPessoas, setTotalPessoas] = useState(0);
  const [totalAgentes, setTotalAgentes] = useState(0);
  const [totalFaces, setTotalFaces] = useState(0);
  const [totalReconhecimentos, setTotalReconhecimentos] = useState(0);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      const [
        pessoasResponse,
        agentesResponse,
        fotosResponse,
        reconhecimentosResponse,
      ] = await Promise.all([
        api.get("/pessoas"),
        api.get("/agentes"),
        api.get("/fotos"),
        api.get("/reconhecimento/total"),
      ]);

      // QUANTIDADE DE PESSOAS
      setTotalPessoas(pessoasResponse.data.length);

      // QUANTIDADE DE AGENTES
      setTotalAgentes(agentesResponse.data.length);

      // QUANTIDADE DE FACES/FOTOS CADASTRADAS
      setTotalFaces(fotosResponse.data.length);

      // QUANTIDADE DE RECONHECIMENTOS
      setTotalReconhecimentos(
        reconhecimentosResponse.data.total
      );

    } catch (error) {
      console.error(
        "Erro ao carregar dados do dashboard:",
        error
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="dashboard-page">

      {/* CABEÇALHO */}
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

        {/* PESSOAS */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-icon">
              👤
            </span>

            <span className="dashboard-card-title">
              Pessoas cadastradas
            </span>
          </div>

          <strong>
            {carregando ? "..." : totalPessoas}
          </strong>
        </div>


        {/* AGENTES */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-icon">
              🛡️
            </span>

            <span className="dashboard-card-title">
              Agentes cadastrados
            </span>
          </div>

          <strong>
            {carregando ? "..." : totalAgentes}
          </strong>
        </div>


        {/* FACES */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-icon">
              📸
            </span>

            <span className="dashboard-card-title">
              Faces cadastradas
            </span>
          </div>

          <strong>
            {carregando ? "..." : totalFaces}
          </strong>
        </div>


        {/* RECONHECIMENTOS */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <span className="dashboard-card-icon">
              🔍
            </span>

            <span className="dashboard-card-title">
              Reconhecimentos realizados
            </span>
          </div>

          <strong>
            {carregando ? "..." : totalReconhecimentos}
          </strong>
        </div>

      </section>


      {/* ÁREA DE RECONHECIMENTO */}
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