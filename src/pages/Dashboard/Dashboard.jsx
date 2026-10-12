import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const [totalPessoas, setTotalPessoas] = useState(0);
  const [totalAgentes, setTotalAgentes] = useState(0);
  const [totalFaces, setTotalFaces] = useState(0);
  const [totalReconhecimentos, setTotalReconhecimentos] =
    useState(0);

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

      setTotalPessoas(pessoasResponse.data.length);
      setTotalAgentes(agentesResponse.data.length);
      setTotalFaces(fotosResponse.data.length);
      setTotalReconhecimentos(
        reconhecimentosResponse.data.total
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dados do painel:",
        error
      );
    } finally {
      setCarregando(false);
    }
  }

  const indicadores = [
    {
      titulo: "Pessoas cadastradas",
      valor: totalPessoas,
      icone: "👤",
      descricao: "Registros disponíveis",
    },
    {
      titulo: "Registros faciais",
      valor: totalFaces,
      icone: "📸",
      descricao: "Imagens cadastradas",
    },
    {
      titulo: "Agentes cadastrados",
      valor: totalAgentes,
      icone: "👮",
      descricao: "Usuários do sistema",
    },
    {
      titulo: "Buscas faciais realizadas",
      valor: totalReconhecimentos,
      icone: "🔎",
      descricao: "Consultas registradas",
    },
  ];

  return (
    <div className="dashboard-page">
      <header className="dashboard-header">
        <div>
          <h1>Painel</h1>
          <p>
            Visão geral da rede de identificação de pessoas
            desaparecidas.
          </p>
        </div>
      </header>

      <section className="dashboard-cards">
        {indicadores.map((indicador) => (
          <article
            className="dashboard-card"
            key={indicador.titulo}
          >
            <div className="dashboard-card-header">
              <span className="dashboard-card-icon">
                {indicador.icone}
              </span>

              <div className="dashboard-card-info">
                <span className="dashboard-card-title">
                  {indicador.titulo}
                </span>

                <span className="dashboard-card-description">
                  {indicador.descricao}
                </span>
              </div>
            </div>

            <strong>
              {carregando ? "..." : indicador.valor}
            </strong>
          </article>
        ))}
      </section>

      <section className="recognition-card">
        <div className="recognition-card-content">
          <span className="recognition-main-icon">
            <span aria-hidden="true">⌕</span>
          </span>

          <div>
            <h2>Buscar correspondência facial</h2>

            <p>
              Compare uma imagem com os registros faciais
              disponíveis e consulte possíveis correspondências.
            </p>

            <span className="recognition-note">
              O resultado é indicativo e requer análise humana.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate("/reconhecimento")}
        >
          Iniciar busca facial
          <span aria-hidden="true"> →</span>
        </button>
      </section>
    </div>
  );
}

export default Dashboard;