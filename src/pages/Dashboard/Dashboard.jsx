
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Users,
  Camera,
  ShieldCheck,
  ScanFace,
  ArrowUpRight,
  Search,
  UserPlus,
  Database,
  RefreshCw,
  Activity,
} from "lucide-react";

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
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setCarregando(true);
      setErro("");

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

      setTotalPessoas(
        Array.isArray(pessoasResponse.data)
          ? pessoasResponse.data.length
          : 0
      );

      setTotalAgentes(
        Array.isArray(agentesResponse.data)
          ? agentesResponse.data.length
          : 0
      );

      setTotalFaces(
        Array.isArray(fotosResponse.data)
          ? fotosResponse.data.length
          : 0
      );

      setTotalReconhecimentos(
        Number(reconhecimentosResponse.data?.total ?? 0)
      );
    } catch (error) {
      console.error(
        "Erro ao carregar dados do painel:",
        error
      );

      setErro(
        "Não foi possível carregar todos os indicadores. Tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }

  const indicadores = [
    {
      titulo: "Pessoas Desaparecidas Cadastradas",
      valor: totalPessoas,
      descricao: "Pessoas registradas no sistema",
      icone: Users,
      cor: "cyan",
      destino: "/pessoas",
    },
    {
      titulo: "Registros faciais",
      valor: totalFaces,
      descricao: "Imagens cadastradas",
      icone: Camera,
      cor: "blue",
      destino: "/pessoas",
    },
    {
      titulo: "Agentes cadastrados",
      valor: totalAgentes,
      descricao: "Usuários do sistema",
      icone: ShieldCheck,
      cor: "purple",
      destino: "/agentes",
    },
    {
      titulo: "Buscas faciais",
      valor: totalReconhecimentos,
      descricao: "Consultas contabilizadas",
      icone: ScanFace,
      cor: "green",
      destino: "/reconhecimento",
    },
  ];

  return (
    <div className="dashboard-page">
      {/* CABEÇALHO */}
      <header className="dashboard-header">
        <div className="dashboard-heading">
          <span className="dashboard-eyebrow">
            CENTRAL DE OPERAÇÕES
          </span>

          <h1>Painel de controle</h1>

          <p>
            Visão geral do sistema de reconhecimento facial
            e identificação de pessoas.
          </p>
        </div>

        <button
          type="button"
          className="dashboard-refresh"
          onClick={carregarDados}
          disabled={carregando}
        >
          <RefreshCw
            size={16}
            className={carregando ? "refresh-spinning" : ""}
          />
          <span>Atualizar dados</span>
        </button>
      </header>

      {/* INDICADORES */}
      <section className="dashboard-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Visão geral</h2>
            <p>Indicadores do sistema</p>
          </div>

          <span className="dashboard-live-label">
            <span />
            Dados da aplicação
          </span>
        </div>

        {erro && (
          <div className="dashboard-error" role="alert">
            <span>{erro}</span>

            <button
              type="button"
              onClick={carregarDados}
            >
              Tentar novamente
            </button>
          </div>
        )}

        <div className="dashboard-cards">
          {indicadores.map((indicador) => {
            const Icone = indicador.icone;

            return (
              <button
                type="button"
                className={`dashboard-card dashboard-card-${indicador.cor}`}
                key={indicador.titulo}
                onClick={() => navigate(indicador.destino)}
                aria-label={`Abrir ${indicador.titulo}`}
              >
                <div className="dashboard-card-top">
                  <div className="dashboard-card-icon">
                    <Icone size={21} strokeWidth={1.8} />
                  </div>

                  <ArrowUpRight
                    className="dashboard-card-arrow"
                    size={18}
                  />
                </div>

                <div className="dashboard-card-info">
                  <span className="dashboard-card-title">
                    {indicador.titulo}
                  </span>

                  <strong className="dashboard-card-value">
                    {carregando
                      ? "—"
                      : indicador.valor.toLocaleString("pt-BR")}
                  </strong>

                  <span className="dashboard-card-description">
                    {indicador.descricao}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* BUSCA FACIAL */}
      <section className="dashboard-recognition">
        <div className="recognition-decoration recognition-decoration-one" />
        <div className="recognition-decoration recognition-decoration-two" />

        <div className="recognition-content">
          <div className="recognition-icon">
            <ScanFace size={31} strokeWidth={1.6} />
          </div>

          <div className="recognition-text">
            <span className="recognition-eyebrow">
              FERRAMENTA DE IDENTIFICAÇÃO
            </span>

            <h2>Reconhecimento facial</h2>

            <p>
              Submeta ou capture uma fotografia para realizar o cruzamento biométrico automatizado com a base do Cadastro de Pessoas Desaparecidas.
            </p>

            <div className="recognition-disclaimer">
              <ShieldCheck size={15} />
              <span>
                Os resultados devem ser avaliados por um agente.
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="recognition-button"
          onClick={() => navigate("/reconhecimento")}
        >
          Iniciar busca
          <ArrowUpRight size={17} />
        </button>
      </section>

      {/* ACESSOS RÁPIDOS */}
      <section className="dashboard-section dashboard-quick-section">
        <div className="dashboard-section-heading">
          <div>
            <h2>Acessos rápidos</h2>
            <p>Atalhos para as principais funcionalidades</p>
          </div>
        </div>

        <div className="dashboard-quick-grid">
          <button
            type="button"
            className="dashboard-quick-card"
            onClick={() => navigate("/pessoas/nova")}
          >
            <span className="quick-icon quick-icon-cyan">
              <UserPlus size={21} />
            </span>

            <span className="quick-text">
              <strong>Cadastrar pessoa</strong>
              <small>Adicionar um novo cadastro</small>
            </span>

            <ArrowUpRight size={17} className="quick-arrow" />
          </button>

          <button
            type="button"
            className="dashboard-quick-card"
            onClick={() => navigate("/pessoas")}
          >
            <span className="quick-icon quick-icon-blue">
              <Database size={21} />
            </span>

            <span className="quick-text">
              <strong>Consultar pessoas</strong>
              <small>Visualizar cadastros existentes</small>
            </span>

            <ArrowUpRight size={17} className="quick-arrow" />
          </button>

          <button
            type="button"
            className="dashboard-quick-card"
            onClick={() => navigate("/reconhecimento")}
          >
            <span className="quick-icon quick-icon-purple">
              <Search size={21} />
            </span>

            <span className="quick-text">
              <strong>Realizar busca facial</strong>
              <small>Consultar possíveis correspondências</small>
            </span>

            <ArrowUpRight size={17} className="quick-arrow" />
          </button>

          <button
            type="button"
            className="dashboard-quick-card"
            onClick={() => navigate("/agentes")}
          >
            <span className="quick-icon quick-icon-green">
              <Activity size={21} />
            </span>

            <span className="quick-text">
              <strong>Consultar agentes</strong>
              <small>Visualizar usuários cadastrados</small>
            </span>

            <ArrowUpRight size={17} className="quick-arrow" />
          </button>
        </div>
      </section>

      <div className="dashboard-bottom-note">
        <ShieldCheck size={16} />

        <span>
          Sistema de apoio à identificação e localização de pessoas desaparecidas. Os resultados do cruzamento biométrico devem ser validados por agentes habilitados.
        </span>
      </div>
    </div>
  );
}

export default Dashboard;
