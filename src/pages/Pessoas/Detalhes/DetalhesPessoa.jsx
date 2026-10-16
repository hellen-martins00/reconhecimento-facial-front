
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import {
  UserRound,
  Images,
  ClipboardList,
} from "lucide-react";

import api from "../../../services/api";

import { formatarCPF } from "../../../utils/formatarCPF";
import { formatarData } from "../../../utils/formatarData";

import "./DetalhesPessoa.css";

function DetalhesPessoa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pessoa, setPessoa] = useState(null);
  const [registrosDesaparecimento, setRegistrosDesaparecimento] = useState([]);

  const [fotos, setFotos] = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [abaAtiva, setAbaAtiva] = useState("dados");

  const fotosUrlsRef = useRef([]);

  // LIMPAR URLS DAS FOTOS
  function limparUrlsFotos() {
    fotosUrlsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

    fotosUrlsRef.current = [];
  }

  // CARREGAR FOTOS
  async function carregarFotos() {
    setCarregandoFotos(true);
    limparUrlsFotos();

    try {
      const respostaFotos = await api.get(`/fotos/pessoa/${id}`);
      const fotosCadastradas = respostaFotos.data;

      if (
        !Array.isArray(fotosCadastradas) ||
        fotosCadastradas.length === 0
      ) {
        setFotos([]);
        return;
      }

      const fotosOrdenadas = [...fotosCadastradas].sort(
        (a, b) =>
          new Date(b.data_upload) - new Date(a.data_upload)
      );

      const fotosComUrl = await Promise.all(
        fotosOrdenadas.map(async (foto) => {
          try {
            const respostaArquivo = await api.get(
              `/fotos/${foto.id}/arquivo`,
              { responseType: "blob" }
            );

            const url = URL.createObjectURL(respostaArquivo.data);
            fotosUrlsRef.current.push(url);

            return {
              ...foto,
              url,
            };
          } catch (error) {
            console.error(`Erro ao carregar foto ${foto.id}:`, error);
            return null;
          }
        })
      );

      setFotos(fotosComUrl.filter(Boolean));
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
      setFotos([]);
    } finally {
      setCarregandoFotos(false);
    }
  }

  // CARREGAR DADOS DA PESSOA
  async function carregarPessoa() {
    setCarregando(true);
    setErro("");

    try {
      // DADOS PESSOAIS
      const respostaPessoa = await api.get(`/pessoas/${id}`);
      setPessoa(respostaPessoa.data);

      // REGISTROS DE DESAPARECIMENTO
      try {
        const respostaRegistros = await api.get(
          `/desaparecimentos/pessoa/${id}`
        );

        setRegistrosDesaparecimento(
          Array.isArray(respostaRegistros.data)
            ? respostaRegistros.data
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar registros de desaparecimento:",
          error
        );

        setRegistrosDesaparecimento([]);
      }

      // FOTOS
      await carregarFotos();
    } catch (error) {
      console.error("Erro ao carregar pessoa:", error);

      setErro(
        error.response?.data?.detail ||
          "Não foi possível carregar os dados da pessoa."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPessoa();

    return () => {
      limparUrlsFotos();
    };
  }, [id]);

  // CARREGAMENTO
  if (carregando) {
    return (
      <div className="detalhes-pessoa-page">
        <div className="detalhes-loading">
          Carregando dados da pessoa...
        </div>
      </div>
    );
  }

  // ERRO
  if (erro) {
    return (
      <div className="detalhes-pessoa-page">
        <div className="detalhes-header">
          <div>
            <h1>Detalhes da pessoa</h1>
            <p>Informações do cadastro</p>
          </div>

          <button
            className="detalhes-voltar"
            onClick={() => navigate("/pessoas")}
          >
            Voltar
          </button>
        </div>

        <div className="detalhes-error">{erro}</div>
      </div>
    );
  }

  const fotoPrincipal = fotos[0];

  const registrosOrdenados = [...registrosDesaparecimento].sort(
    (a, b) =>
      new Date(b.data_desaparecimento) -
      new Date(a.data_desaparecimento)
  );

  return (
    <div className="detalhes-pessoa-page">
      {/* IDENTIFICAÇÃO */}
      <section className="detalhes-identificacao">
        <div className="detalhes-identificacao-foto">
          {fotoPrincipal ? (
            <img
              src={fotoPrincipal.url}
              alt={`Foto de ${pessoa.nome}`}
            />
          ) : (
            <div className="detalhes-sem-foto">Sem foto</div>
          )}
        </div>

        <div className="detalhes-identificacao-info">
          <span className="detalhes-identificacao-label">
            Pessoa cadastrada
          </span>

          <h1>{pessoa.nome}</h1>

          <div className="detalhes-identificacao-cpf">
            CPF: {formatarCPF(pessoa.cpf)}
          </div>

          <div className="detalhes-indicadores">
            <div className="detalhes-indicador">
              <strong>{fotos.length}</strong>
              <span>
                {fotos.length === 1
                  ? "foto cadastrada"
                  : "fotos cadastradas"}
              </span>
            </div>

            <div
              className={
                registrosDesaparecimento.length > 0
                  ? "detalhes-indicador detalhes-indicador-desaparecimento"
                  : "detalhes-indicador"
              }
            >
              <strong>{registrosDesaparecimento.length}</strong>
              <span>
                {registrosDesaparecimento.length === 1
                  ? "registro de desaparecimento"
                  : "registros de desaparecimento"}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ALERTA DE DESAPARECIMENTO */}
      {registrosDesaparecimento.length > 0 && (
        <div className="detalhes-alerta">
          <span className="detalhes-alerta-icon">!</span>

          <div>
            <strong>
              Atenção: registros de desaparecimento encontrados
            </strong>

            <p>
              Esta pessoa possui{" "}
              {registrosDesaparecimento.length}{" "}
              {registrosDesaparecimento.length === 1
                ? "registro de desaparecimento."
                : "registros de desaparecimento."}
            </p>
          </div>
        </div>
      )}

      {/* ABAS */}
      <div className="detalhes-tabs">
        <button
          className={
            abaAtiva === "dados"
              ? "detalhes-tab ativa"
              : "detalhes-tab"
          }
          onClick={() => setAbaAtiva("dados")}
        >
          <UserRound size={17} strokeWidth={2} />
          Dados pessoais
        </button>

        <button
          className={
            abaAtiva === "fotos"
              ? "detalhes-tab ativa"
              : "detalhes-tab"
          }
          onClick={() => setAbaAtiva("fotos")}
        >
          <Images size={17} strokeWidth={2} />
          Fotos

          <span className="detalhes-tab-contador">
            {fotos.length}
          </span>
        </button>

        <button
          className={
            abaAtiva === "desaparecimentos"
              ? "detalhes-tab ativa"
              : "detalhes-tab detalhes-tab-desaparecimento"
          }
          onClick={() => setAbaAtiva("desaparecimentos")}
        >
          <ClipboardList size={17} strokeWidth={2} />
          Desaparecimentos

          {registrosDesaparecimento.length > 0 && (
            <span className="detalhes-tab-alerta">
              {registrosDesaparecimento.length}
            </span>
          )}
        </button>
      </div>

      {/* CONTEÚDO DAS ABAS */}
      <div className="detalhes-conteudo">
        {/* DADOS PESSOAIS */}
        {abaAtiva === "dados" && (
          <section className="detalhes-card">
            <div className="detalhes-section-header">
              <div>
                <h2>Dados pessoais</h2>
                <p>Informações pessoais cadastradas.</p>
              </div>
            </div>

            <div className="detalhes-grid">
              <div className="detalhes-field">
                <span>Nome</span>
                <strong>{pessoa.nome}</strong>
              </div>

              <div className="detalhes-field">
                <span>CPF</span>
                <strong>{formatarCPF(pessoa.cpf)}</strong>
              </div>

              <div className="detalhes-field">
                <span>Data de nascimento</span>
                <strong>
                  {formatarData(pessoa.data_nascimento)}
                </strong>
              </div>

              <div className="detalhes-field">
                <span>Sexo</span>
                <strong>
                  {pessoa.sexo === "M"
                    ? "Masculino"
                    : pessoa.sexo === "F"
                      ? "Feminino"
                      : pessoa.sexo || "Não informado"}
                </strong>
              </div>
            </div>
          </section>
        )}

        {/* FOTOS */}
        {abaAtiva === "fotos" && (
          <section className="detalhes-card">
            <div className="detalhes-section-header">
              <div>
                <h2>Fotos cadastradas</h2>
                <p>Fotos vinculadas à pessoa no sistema.</p>
              </div>
            </div>

            {carregandoFotos ? (
              <div className="detalhes-vazio">
                Carregando fotos...
              </div>
            ) : fotos.length === 0 ? (
              <div className="detalhes-vazio">
                Nenhuma foto cadastrada.
              </div>
            ) : (
              <div className="detalhes-fotos-grid">
                {fotos.map((foto, index) => (
                  <div
                    className={
                      index === 0
                        ? "detalhes-foto-item principal"
                        : "detalhes-foto-item"
                    }
                    key={foto.id}
                  >
                    <img
                      src={foto.url}
                      alt={`Foto ${index + 1} de ${pessoa.nome}`}
                    />

                    {index === 0 && (
                      <span className="detalhes-foto-badge">
                        Foto principal
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* REGISTROS DE DESAPARECIMENTO */}
        {abaAtiva === "desaparecimentos" && (
          <section
            className={
              registrosDesaparecimento.length > 0
                ? "detalhes-card detalhes-desaparecimentos-card alerta"
                : "detalhes-card"
            }
          >
            <div className="detalhes-section-header">
              <div>
                <h2>Registros de desaparecimento</h2>
                <p>
                  Informações sobre ocorrências de desaparecimento
                  vinculadas à pessoa.
                </p>
              </div>
            </div>

            {registrosOrdenados.length === 0 ? (
              <div className="detalhes-vazio">
                Nenhum registro de desaparecimento cadastrado.
              </div>
            ) : (
              <div className="detalhes-lista">
                {registrosOrdenados.map((registro) => (
                  <article
                    className="detalhes-desaparecimento-item"
                    key={registro.id}
                  >
                    <div className="detalhes-desaparecimento-cabecalho">
                      <div className="detalhes-desaparecimento-icon">
                        <ClipboardList size={18} />
                      </div>

                      <div>
                        <strong>Registro de desaparecimento</strong>
                        <span>
                          Data:{" "}
                          {formatarData(
                            registro.data_desaparecimento
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="detalhes-desaparecimento-info">
                      <div>
                        <span>Data do desaparecimento</span>
                        <strong>
                          {formatarData(
                            registro.data_desaparecimento
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>Local do desaparecimento</span>
                        <strong>
                          {registro.local_desaparecimento ||
                            "Não informado"}
                        </strong>
                      </div>

                      <div className="detalhes-desaparecimento-descricao">
                        <span>Descrição</span>
                        <p>
                          {registro.descricao || "Não informada"}
                        </p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* AÇÕES */}
      <div className="detalhes-actions">
        <button
          type="button"
          className="button-secondary"
          onClick={() => navigate("/pessoas")}
        >
          Voltar
        </button>

        <button
          type="button"
          className="button-primary"
          onClick={() => navigate(`/pessoas/${pessoa.id}/editar`)}
        >
          Editar
        </button>
      </div>
    </div>
  );
}

export default DetalhesPessoa;
