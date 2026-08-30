import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [totalPessoas, setTotalPessoas] = useState(0);
  const [totalAgentes, setTotalAgentes] = useState(0);
  const [totalReconhecimentos, setTotalReconhecimentos] = useState(0);

  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);

      // BUSCA PESSOAS E AGENTES AO MESMO TEMPO
      const [pessoasResponse, agentesResponse] = await Promise.all([
        api.get("/pessoas"),
        api.get("/agentes"),
      ]);

      // QUANTIDADE DE PESSOAS
      setTotalPessoas(pessoasResponse.data.length);

      // QUANTIDADE DE AGENTES
      setTotalAgentes(agentesResponse.data.length);

      /*
        RECONHECIMENTOS

        Por enquanto permanece 0 porque precisamos
        verificar qual endpoint/tabela registra
        os reconhecimentos realizados.
      */

      setTotalReconhecimentos(0);

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

          <strong>
            {carregando ? "..." : totalPessoas}
          </strong>
        </div>

        <div className="dashboard-card">
          <span>Agentes cadastrados</span>

          <strong>
            {carregando ? "..." : totalAgentes}
          </strong>
        </div>

        <div className="dashboard-card">
          <span>Reconhecimentos realizados</span>

          <strong>
            {carregando ? "..." : totalReconhecimentos}
          </strong>
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