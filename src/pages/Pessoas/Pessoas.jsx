import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./Pessoas.css";
import { formatarCPF } from "../../utils/formatarCPF";

function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [menuAberto, setMenuAberto] = useState(null);
  const [busca, setBusca] = useState("");

  const usuarioSalvo = localStorage.getItem("usuario");
  const usuarioLogado = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;

  const [menuAbrirParaCima, setMenuAbrirParaCima] = useState(false);
  const menuContainerRef = useRef(null);
  const [detalhesAbertos, setDetalhesAbertos] = useState(null);

  const [pessoaParaExcluir, setPessoaParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);

  const isAdmin = usuarioLogado?.perfil === "ADMIN";

  const navigate = useNavigate();
  const location = useLocation();

  async function carregarPessoas() {
    setCarregando(true);
    setErro("");

    try {
      const [respostaPessoas, respostaDesaparecimentos] = await Promise.all([
        api.get("/pessoas"),
        api.get("/desaparecimentos"),
      ]);

      const registros = Array.isArray(respostaDesaparecimentos.data)
        ? respostaDesaparecimentos.data
        : [];

      const pessoasComRegistros = respostaPessoas.data.map((pessoa) => {
        const registrosDaPessoa = registros
          .filter((registro) => registro.pessoa_id === pessoa.id)
          .sort((a, b) =>
            (b.data_desaparecimento || "").localeCompare(a.data_desaparecimento || "")
          );

        return {
          ...pessoa,
          registro_desaparecimento: registrosDaPessoa[0] || null,
        };
      });

      const pessoasComFotos = await Promise.all(
        pessoasComRegistros.map(async (pessoa) => {
          if (!pessoa.foto_id) {
            return { ...pessoa, foto_url: null };
          }

          try {
            const respostaFoto = await api.get(`/fotos/${pessoa.foto_id}/arquivo`, {
              responseType: "blob",
            });

            return {
              ...pessoa,
              foto_url: URL.createObjectURL(respostaFoto.data),
            };
          } catch (error) {
            console.error(`Erro ao carregar foto da pessoa ${pessoa.id}:`, error);
            return { ...pessoa, foto_url: null };
          }
        })
      );

      setPessoas(pessoasComFotos);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.detail || "Não foi possível carregar as pessoas e os registros."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function marcarComoLocalizada(pessoa) {
    const registro = pessoa.registro_desaparecimento;

    if (!registro) {
      setErro("Essa pessoa não possui registro de desaparecimento.");
      return;
    }

    const confirmar = window.confirm(`Confirma que ${pessoa.nome} foi localizada?`);
    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      await api.put(`/desaparecimentos/${registro.id}`, { status: "LOCALIZADO" });
      await carregarPessoas();

      setSucesso(`O caso de ${pessoa.nome} foi atualizado para LOCALIZADO.`);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.detail || "Não foi possível atualizar o status do caso."
      );
    }
  }

  function solicitarExclusao(pessoa) {
    setErro("");
    setSucesso("");
    setPessoaParaExcluir({
      id: pessoa.id,
      nome: pessoa.nome,
    });
  }

  function cancelarExclusao() {
    if (excluindo) return;
    setPessoaParaExcluir(null);
  }

  async function excluirPessoa() {
    if (!pessoaParaExcluir || excluindo) return;

    const { id, nome } = pessoaParaExcluir;

    try {
      setExcluindo(true);
      setErro("");
      setSucesso("");

      await api.delete(`/pessoas/${id}`);

      setPessoas((pessoasAtuais) =>
        pessoasAtuais.filter((pessoa) => pessoa.id !== id)
      );

      setPessoaParaExcluir(null);
      setSucesso(`Pessoa "${nome}" excluída com sucesso.`);

      setTimeout(() => {
        setSucesso("");
      }, 4000);
    } catch (error) {
      console.error(error);

      setErro(
        error.response?.data?.detail ||
        "Não foi possível excluir a pessoa."
      );
    } finally {
      setExcluindo(false);
    }
  }

  // MENSAGEM DE SUCESSO VINDO DO CADASTRO
  useEffect(() => {
    if (!location.state?.sucesso) return;

    setSucesso(location.state.sucesso);

    // Remove o state da URL/histórico para não exibir novamente ao atualizar a página
    navigate(location.pathname, { replace: true, state: null });

    const timer = setTimeout(() => {
      setSucesso("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  // CARREGAR PESSOAS
  useEffect(() => {
    carregarPessoas();
  }, []);

  const pessoasFiltradas = pessoas.filter((pessoa) => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return true;

    const nome = (pessoa.nome || "").toLowerCase();
    const cpf = (pessoa.cpf || "").replace(/\D/g, "");
    const buscaCpf = termo.replace(/\D/g, "");

    return nome.includes(termo) || (buscaCpf !== "" && cpf.includes(buscaCpf));
  });

  return (
    <div className="pessoas-page">
      {/* CABEÇALHO */}
      <div className="pessoas-header">
        <div>
          <h1>Pessoas desaparecidas</h1>
          <p>Consulte os registros de desaparecimento.</p>
        </div>
      </div>

      {/* BUSCA E BOTÃO DE NOVA PESSOA */}
      <div className="pessoas-filtros-acoes">
        <div className="pessoas-search">
          <span aria-hidden="true">⌕</span>
          <input
            type="search"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar pessoa por nome ou CPF"
          />
        </div>

        <button
          type="button"
          className="pessoas-new-button"
          onClick={() => navigate("/pessoas/nova")}
        >
          <span aria-hidden="true">+</span>
          <span>Nova pessoa</span>
        </button>
      </div>

      {/* CONTADOR DE REGISTROS E FILTROS */}
      <div className="pessoas-lista-info">
        <span>
          {carregando
            ? "Carregando registros..."
            : `${pessoasFiltradas.length} ${pessoasFiltradas.length === 1
              ? "registro encontrado"
              : "registros encontrados"
            }`}
        </span>

        {busca.trim() !== "" && (
          <button
            type="button"
            className="pessoas-limpar-busca"
            onClick={() => setBusca("")}
          >
            Limpar busca
          </button>
        )}
      </div>

      {/* MENSAGEM DE ERRO */}
      {erro && <div className="pessoas-error">{erro}</div>}

      {/* MENSAGEM DE SUCESSO */}
      {sucesso && (
        <div className="pessoas-success">
          <span className="pessoas-success-icon">✓</span>
          <span>{sucesso}</span>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="pessoas-card">
        {carregando ? (
          <div className="pessoas-loading">Carregando pessoas...</div>
        ) : pessoas.length === 0 ? (
          <div className="pessoas-empty">
            <h2>Nenhuma pessoa cadastrada</h2>
            <p>Ainda não existem pessoas cadastradas no sistema.</p>
          </div>
        ) : pessoasFiltradas.length === 0 ? (
          <div className="pessoas-empty">
            <h2>Nenhum resultado encontrado</h2>
            <p>Não encontramos pessoas com esse nome ou CPF.</p>
          </div>
        ) : (
          <>
            {/* TABELA - DESKTOP */}
            <div className="pessoas-table-container">
              <table className="pessoas-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>CPF</th>
                    <th>Data de nascimento</th>
                    <th>Sexo</th>
                    <th>Data do desaparecimento</th>
                    <th>Local do desaparecimento</th>
                    <th>Status do caso</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {pessoasFiltradas.map((pessoa) => (
                    <tr key={pessoa.id}>
                      <td>
                        <div className="pessoa-nome">
                          {pessoa.foto_url ? (
                            <img
                              src={pessoa.foto_url}
                              alt={`Foto de ${pessoa.nome}`}
                              className="pessoa-foto"
                            />
                          ) : (
                            <div className="pessoa-sem-foto">Sem foto</div>
                          )}
                          <span>{pessoa.nome}</span>
                        </div>
                      </td>

                      <td>{formatarCPF(pessoa.cpf)}</td>

                      <td>
                        {pessoa.data_nascimento
                          ? pessoa.data_nascimento.split("-").reverse().join("/")
                          : "—"}
                      </td>

                      <td>{pessoa.sexo || "—"}</td>

                      <td>
                        {pessoa.registro_desaparecimento?.data_desaparecimento
                          ? pessoa.registro_desaparecimento.data_desaparecimento
                            .split("-")
                            .reverse()
                            .join("/")
                          : "—"}
                      </td>

                      <td>
                        {pessoa.registro_desaparecimento?.local_desaparecimento ||
                          "—"}
                      </td>

                      <td>
                        {pessoa.registro_desaparecimento ? (
                          <span
                            className={`status-caso status-${pessoa.registro_desaparecimento.status === "LOCALIZADO"
                              ? "localizado"
                              : "desaparecido"
                              }`}
                          >
                            {pessoa.registro_desaparecimento.status === "LOCALIZADO"
                              ? "Localizado"
                              : "Desaparecido"}
                          </span>
                        ) : (
                          <span className="status-sem-registro">Sem registro</span>
                        )}
                      </td>

                      <td className="pessoas-actions">
                        <div className="pessoa-menu-container">
                          <button
                            type="button"
                            className="pessoa-menu-button"
                            aria-label={`Ações para ${pessoa.nome}`}
                            aria-expanded={menuAberto === pessoa.id}
                            onClick={(e) => {
                              e.stopPropagation();

                              if (menuAberto === pessoa.id) {
                                setMenuAberto(null);
                                return;
                              }

                              const botao = e.currentTarget;
                              const containerTabela = botao.closest(
                                ".pessoas-table-container"
                              );
                              const retanguloBotao = botao.getBoundingClientRect();
                              const retanguloContainer =
                                containerTabela?.getBoundingClientRect();

                              const espacoAbaixo = retanguloContainer
                                ? retanguloContainer.bottom - retanguloBotao.bottom
                                : window.innerHeight - retanguloBotao.bottom;

                              const espacoAcima = retanguloContainer
                                ? retanguloBotao.top - retanguloContainer.top
                                : retanguloBotao.top;

                              setMenuAbrirParaCima(
                                espacoAbaixo < 190 &&
                                espacoAcima > espacoAbaixo
                              );

                              setMenuAberto(pessoa.id);
                            }}
                          >
                            ⋮
                          </button>

                          {menuAberto === pessoa.id && (
                            <div
                              ref={menuContainerRef}
                              className={`pessoa-menu ${menuAbrirParaCima ? "pessoa-menu-acima" : ""
                                }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAberto(null);
                                  navigate(`/pessoas/${pessoa.id}`);
                                }}
                              >
                                Visualizar
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAberto(null);
                                  navigate(`/pessoas/${pessoa.id}/editar`);
                                }}
                              >
                                Editar
                              </button>

                              {isAdmin && (
                                <button
                                  type="button"
                                  className="pessoa-menu-excluir"
                                  onClick={() => {
                                    setMenuAberto(null);
                                    solicitarExclusao(pessoa);
                                  }}
                                >
                                  Excluir
                                </button>
                              )}

                              {pessoa.registro_desaparecimento?.status ===
                                "DESAPARECIDO" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMenuAberto(null);
                                      marcarComoLocalizada(pessoa);
                                    }}
                                  >
                                    Marcar como localizada
                                  </button>
                                )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CARDS - MOBILE */}
            <div className="pessoas-mobile-list">
              {pessoasFiltradas.map((pessoa) => {
                const detalhesExpandidos = detalhesAbertos === pessoa.id;
                const registro = pessoa.registro_desaparecimento;

                const dataDesaparecimento = registro?.data_desaparecimento
                  ? registro.data_desaparecimento.split("-").reverse().join("/")
                  : "—";

                const status = registro?.status;

                return (
                  <article className="pessoa-mobile-card" key={pessoa.id}>
                    {/* TOPO: FOTO, NOME, SEXO E MENU */}
                    <div className="pessoa-mobile-header">
                      {pessoa.foto_url ? (
                        <img
                          src={pessoa.foto_url}
                          alt={`Foto de ${pessoa.nome}`}
                          className="pessoa-mobile-foto"
                        />
                      ) : (
                        <div className="pessoa-mobile-sem-foto">Sem foto</div>
                      )}

                      <div className="pessoa-mobile-nome">
                        <h3>{pessoa.nome}</h3>

                        <span>CPF: {formatarCPF(pessoa.cpf)}</span>

                        {status && (
                          <span
                            className={`status-caso ${status === "LOCALIZADO"
                              ? "status-localizado"
                              : "status-desaparecido"
                              }`}
                          >
                            {status === "LOCALIZADO"
                              ? "Localizado"
                              : "Desaparecido"}
                          </span>
                        )}
                      </div>

                      {/* MENU DE AÇÕES */}
                      <div className="pessoa-mobile-menu-container">
                        <button
                          type="button"
                          className="pessoa-mobile-menu-button"
                          onClick={() =>
                            setMenuAberto(
                              menuAberto === pessoa.id ? null : pessoa.id
                            )
                          }
                          aria-label={`Ações para ${pessoa.nome}`}
                          aria-expanded={menuAberto === pessoa.id}
                        >
                          ⋮
                        </button>

                        {menuAberto === pessoa.id && (
                          <div className="pessoa-mobile-menu">
                            <button
                              type="button"
                              onClick={() => {
                                setMenuAberto(null);
                                navigate(`/pessoas/${pessoa.id}`);
                              }}
                            >
                              Visualizar
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setMenuAberto(null);
                                navigate(`/pessoas/${pessoa.id}/editar`);
                              }}
                            >
                              Editar
                            </button>

                            {isAdmin && (
                              <button
                                type="button"
                                className="pessoa-menu-excluir"
                                onClick={() => {
                                  setMenuAberto(null);
                                  solicitarExclusao(pessoa);
                                }}
                              >
                                Excluir
                              </button>
                            )}

                            {status === "DESAPARECIDO" && (
                              <button
                                type="button"
                                onClick={() => {
                                  setMenuAberto(null);
                                  marcarComoLocalizada(pessoa);
                                }}
                              >
                                Marcar como localizada
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* RESUMO */}
                    <div className="pessoa-mobile-resumo">
                      <div>
                        <span>Desaparecimento</span>
                        <strong>{dataDesaparecimento}</strong>
                      </div>
                    </div>

                    {/* EXPANDIR DETALHES */}
                    <button
                      type="button"
                      className="pessoa-mobile-detalhes-button"
                      aria-expanded={detalhesExpandidos}
                      onClick={() =>
                        setDetalhesAbertos(
                          detalhesExpandidos ? null : pessoa.id
                        )
                      }
                    >
                      {detalhesExpandidos
                        ? "Ocultar detalhes"
                        : "Ver detalhes"}

                      <span aria-hidden="true">
                        {detalhesExpandidos ? "⌃" : "⌄"}
                      </span>
                    </button>

                    {/* DETALHES */}
                    {detalhesExpandidos && (
                      <div className="pessoa-mobile-detalhes">
                        <div className="pessoa-mobile-campo">
                          <span>Data de nascimento</span>
                          <strong>
                            {pessoa.data_nascimento
                              ? pessoa.data_nascimento
                                .split("-")
                                .reverse()
                                .join("/")
                              : "—"}
                          </strong>
                        </div>

                        <div className="pessoa-mobile-campo">
                          <span>Sexo</span>
                          <strong>{pessoa.sexo || "Não informado"}</strong>
                        </div>

                        <div className="pessoa-mobile-campo">
                          <span>Local do desaparecimento</span>
                          <strong>{registro?.local_desaparecimento || "—"}</strong>
                        </div>

                        <div className="pessoa-mobile-campo">
                          <span>Status do caso</span>

                          {registro ? (
                            <strong
                              className={`status-caso ${status === "LOCALIZADO"
                                ? "status-localizado"
                                : "status-desaparecido"
                                }`}
                            >
                              {status === "LOCALIZADO"
                                ? "Localizado"
                                : "Desaparecido"}
                            </strong>
                          ) : (
                            <strong className="status-sem-registro">
                              Sem registro
                            </strong>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>

      {pessoaParaExcluir && (
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
              Excluir pessoa?
            </h2>

            <p
              id="confirmacao-descricao"
              className="confirmacao-texto"
            >
              Tem certeza de que deseja excluir o cadastro de:
            </p>

            <div className="confirmacao-pessoa">
              <span className="confirmacao-avatar" aria-hidden="true">
                {pessoaParaExcluir.nome?.charAt(0)?.toUpperCase() || "P"}
              </span>

              <div className="confirmacao-dados">
                <strong>{pessoaParaExcluir.nome}</strong>
                <span>Cadastro de pessoa</span>
              </div>
            </div>

            <div className="confirmacao-aviso">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M12 11V16"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="8" r="1" fill="currentColor" />
              </svg>
            </div>

            <div className="confirmacao-acoes">
              <button
                type="button"
                className="confirmacao-botao-cancelar"
                onClick={cancelarExclusao}
                disabled={excluindo}
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
                    Excluir pessoa
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

export default Pessoas;