
import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Agentes.css";

function Agentes() {
  const [agentes, setAgentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [menuAberto, setMenuAberto] = useState(null);
  const [menuAbrirParaCima, setMenuAbrirParaCima] = useState(false);

  const [agenteParaExcluir, setAgenteParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(null);

  const navigate = useNavigate();

  const fotosUrlsRef = useRef([]);

  // USUÁRIO LOGADO
  let usuario = null;

  try {
    const usuarioSalvo = localStorage.getItem("usuario");
    usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);
  }

  const isAdmin = usuario?.perfil === "ADMIN";

  // REVOGAR URLs DAS FOTOS
  const revogarTodasFotos = useCallback(() => {
    fotosUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    fotosUrlsRef.current = [];
  }, []);

  // CARREGAR AGENTES
  const carregarAgentes = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await api.get("/agentes");

      revogarTodasFotos();

      const novasUrls = [];

      const agentesComFotos = await Promise.all(
        resposta.data.map(async (agente) => {
          try {
            const respostaFoto = await api.get(
              `/agentes/${agente.id}/foto`,
              {
                responseType: "blob",
                validateStatus: (status) =>
                  status === 200 || status === 204,
              }
            );

            if (respostaFoto.status === 204) {
              return {
                ...agente,
                foto_url: null,
              };
            }

            const fotoUrl = URL.createObjectURL(respostaFoto.data);
            novasUrls.push(fotoUrl);

            return {
              ...agente,
              foto_url: fotoUrl,
            };
          } catch (error) {
            console.error(
              `Erro ao carregar foto do agente ${agente.id}:`,
              error
            );

            return {
              ...agente,
              foto_url: null,
            };
          }
        })
      );

      fotosUrlsRef.current = novasUrls;
      setAgentes(agentesComFotos);
    } catch (error) {
      console.error(error);

      setErro(
        error.response?.data?.detail ||
        "Não foi possível carregar os agentes."
      );
    } finally {
      setCarregando(false);
    }
  }, [revogarTodasFotos]);

  // CARREGAR AO ABRIR A PÁGINA
  useEffect(() => {
    carregarAgentes();

    return () => {
      revogarTodasFotos();
    };
  }, [carregarAgentes, revogarTodasFotos]);

  // ABRIR MENU CONFORME O ESPAÇO DISPONÍVEL
  function alternarMenuDesktop(evento, agenteId) {
    evento.stopPropagation();

    if (menuAberto === agenteId) {
      setMenuAberto(null);
      return;
    }

    const botao = evento.currentTarget;
    const containerTabela = botao.closest(".agentes-table-container");

    const retanguloBotao = botao.getBoundingClientRect();
    const retanguloContainer = containerTabela?.getBoundingClientRect();

    const espacoAbaixo = retanguloContainer
      ? retanguloContainer.bottom - retanguloBotao.bottom
      : window.innerHeight - retanguloBotao.bottom;

    const espacoAcima = retanguloContainer
      ? retanguloBotao.top - retanguloContainer.top
      : retanguloBotao.top;

    setMenuAbrirParaCima(
      espacoAbaixo < 150 && espacoAcima > espacoAbaixo
    );

    setMenuAberto(agenteId);
  }

  // EXCLUIR AGENTE
  function handleExcluir(agente) {
    if (!isAdmin || excluindo !== null) return;

    setMenuAberto(null);
    setAgenteParaExcluir(agente);
  }

  // CONFIRMAR EXCLUSÃO DO AGENTE
  async function confirmarExclusao() {
    if (!agenteParaExcluir || !isAdmin || excluindo !== null) {
      return;
    }

    const agente = agenteParaExcluir;

    setErro("");
    setExcluindo(agente.id);

    try {
      await api.delete(`/agentes/${agente.id}`);

      if (agente.foto_url) {
        URL.revokeObjectURL(agente.foto_url);

        fotosUrlsRef.current = fotosUrlsRef.current.filter(
          (url) => url !== agente.foto_url
        );
      }

      setAgentes((agentesAtuais) =>
        agentesAtuais.filter(
          (item) => item.id !== agente.id
        )
      );

      setAgenteParaExcluir(null);
    } catch (error) {
      console.error(error);

      setErro(
        error.response?.data?.detail ||
        "Não foi possível excluir o agente."
      );
    } finally {
      setExcluindo(null);
    }
  }

  // CANCELAR EXCLUSÃO
  function cancelarExclusao() {
    if (excluindo !== null) return;

    setAgenteParaExcluir(null);
  }

  // FORMATAR DATA
  function formatarData(data) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  // MENU DE AÇÕES REUTILIZADO
  function renderizarAcoes(agente) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            setMenuAberto(null);
            navigate(`/agentes/${agente.id}`);
          }}
          disabled={excluindo === agente.id}
        >
          Visualizar
        </button>

        {(isAdmin || String(usuario?.id) === String(agente.id)) && (
          <button
            type="button"
            onClick={() => {
              setMenuAberto(null);
              navigate(`/agentes/${agente.id}/editar`);
            }}
            disabled={excluindo === agente.id}
          >
            Editar
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            className="agente-menu-excluir"
            onClick={(evento) => {
              evento.preventDefault();
              evento.stopPropagation();
              handleExcluir(agente);
            }}
            disabled={excluindo !== null}
          >
            Excluir
          </button>
        )}
      </>
    );
  }

  return (
    <div className="agentes-page">
      {/* CABEÇALHO */}
      <div className="agentes-header">
        <div>
          <h1>Agentes</h1>
          <p>Gerencie os agentes cadastrados no sistema.</p>
        </div>

        {isAdmin && (
          <button
            type="button"
            className="agentes-new-button"
            onClick={() => navigate("/agentes/novo")}
          >
            + Novo agente
          </button>
        )}
      </div>

      {/* ERRO */}
      {erro && <div className="agentes-error">{erro}</div>}

      {/* CONTEÚDO */}
      <div className="agentes-card">
        {carregando ? (
          <div className="agentes-loading">Carregando agentes...</div>
        ) : agentes.length === 0 ? (
          <div className="agentes-empty">
            <h2>Nenhum agente cadastrado</h2>
            <p>Ainda não existem agentes cadastrados no sistema.</p>
          </div>
        ) : (
          <>
            {/* TABELA DESKTOP */}
            <div className="agentes-table-container">
              <table className="agentes-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Usuário</th>
                    <th>Perfil</th>
                    <th>Data de cadastro</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {agentes.map((agente) => (
                    <tr key={agente.id}>
                      <td>
                        <div className="agente-nome">
                          {agente.foto_url ? (
                            <img
                              src={agente.foto_url}
                              alt={`Foto de ${agente.nome}`}
                              className="agente-foto"
                            />
                          ) : (
                            <div className="agente-sem-foto">
                              Sem foto
                            </div>
                          )}

                          <span>{agente.nome}</span>
                        </div>
                      </td>

                      <td>{agente.usuario}</td>
                      <td>{agente.perfil}</td>
                      <td>{formatarData(agente.created_at)}</td>

                      <td className="agentes-actions">
                        <div className="agente-menu-container">
                          <button
                            type="button"
                            className="agente-menu-button"
                            aria-label={`Ações para ${agente.nome}`}
                            aria-expanded={menuAberto === agente.id}
                            onClick={(evento) =>
                              alternarMenuDesktop(evento, agente.id)
                            }
                          >
                            ⋮
                          </button>

                          {menuAberto === agente.id && (
                            <div
                              className={`agente-menu ${menuAbrirParaCima
                                ? "agente-menu-acima"
                                : ""
                                }`}
                              onClick={(evento) => evento.stopPropagation()}
                            >
                              {renderizarAcoes(agente)}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CARDS MOBILE */}
            <div className="agentes-mobile-list">
              {agentes.map((agente) => (
                <div className="agente-mobile-card" key={agente.id}>
                  <div className="agente-mobile-header">
                    {agente.foto_url ? (
                      <img
                        src={agente.foto_url}
                        alt={`Foto de ${agente.nome}`}
                        className="agente-mobile-foto"
                      />
                    ) : (
                      <div className="agente-mobile-sem-foto">
                        Sem foto
                      </div>
                    )}

                    <div className="agente-mobile-nome">
                      <h3>{agente.nome}</h3>
                      <span>{agente.perfil}</span>
                    </div>

                    <div className="agente-mobile-menu-container">
                      <button
                        type="button"
                        className="agente-mobile-menu-button"
                        aria-label={`Ações para ${agente.nome}`}
                        aria-expanded={menuAberto === agente.id}
                        onClick={(evento) => {
                          evento.stopPropagation();
                          setMenuAberto(
                            menuAberto === agente.id ? null : agente.id
                          );
                        }}
                      >
                        ⋮
                      </button>

                      {menuAberto === agente.id && (
                        <div
                          className="agente-mobile-menu"
                          onClick={(evento) => evento.stopPropagation()}
                        >
                          {renderizarAcoes(agente)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="agente-mobile-info">
                    <div>
                      <span>Usuário</span>
                      <strong>{agente.usuario}</strong>
                    </div>

                    <div>
                      <span>Perfil</span>
                      <strong>{agente.perfil}</strong>
                    </div>

                    <div>
                      <span>Data de cadastro</span>
                      <strong>{formatarData(agente.created_at)}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {agenteParaExcluir && (
        <div
          className="confirmacao-overlay"
          onMouseDown={(e) => {
            if (
              e.target === e.currentTarget &&
              !excluindo
            ) {
              cancelarExclusao();
            }
          }}
        >
          <section
            className="confirmacao-modal"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirmacao-titulo"
            aria-describedby="confirmacao-descricao"
          >
            <div className="confirmacao-icone">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 3L22 20H2L12 3Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                />
                <path
                  d="M12 9V13"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="16.5" r="1" fill="currentColor" />
              </svg>
            </div>

            <h2 id="confirmacao-titulo">
              Excluir agente?
            </h2>

            <p
              id="confirmacao-descricao"
              className="confirmacao-texto"
            >
              Tem certeza de que deseja excluir o cadastro de agente:
            </p>

            <div className="confirmacao-agente">
              <span className="confirmacao-avatar" aria-hidden="true">
                {agenteParaExcluir.nome?.charAt(0)?.toUpperCase() || "A"}
              </span>

              <div className="confirmacao-dados">
                <strong>{agenteParaExcluir.nome}</strong>
                <span>Cadastro de agente</span>
              </div>
            </div>
            
            <div className="confirmacao-acoes">
              <button
                type="button"
                className="confirmacao-botao-cancelar"
                onClick={cancelarExclusao}
                disabled={excluindo !== null}
              >
                Cancelar
              </button>

              <button
                type="button"
                className="confirmacao-botao-excluir"
                onClick={excluirPessoa}
                disabled={excluindo}
              >
                {excluindo ? (
                  <>
                    <span className="confirmacao-spinner" />
                    Excluindo...
                  </>
                ) : (
                  <>
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 7H20M10 11V17M14 11V17M6 7L7 20H17L18 7M9 7V4H15V7"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Excluir agente
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Agentes;