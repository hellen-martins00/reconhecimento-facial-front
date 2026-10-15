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

  async function excluirPessoa(id, nome) {
    const confirmar = window.confirm(`Tem certeza que deseja excluir a pessoa "${nome}"?`);
    if (!confirmar) return;

    try {
      setErro("");
      setSucesso("");

      await api.delete(`/pessoas/${id}`);
      setPessoas((pessoasAtuais) => pessoasAtuais.filter((pessoa) => pessoa.id !== id));
      setSucesso(`Pessoa "${nome}" excluída com sucesso.`);

      setTimeout(() => {
        setSucesso("");
      }, 4000);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.detail || "Não foi possível excluir a pessoa."
      );
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
          <p>
            Consulte e gerencie os registros utilizados no processo de identificação facial.
          </p>
        </div>

        <button
          type="button"
          className="pessoas-new-button"
          onClick={() => navigate("/pessoas/nova")}
        >
          + Cadastrar pessoa desaparecida
        </button>
      </div>

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
                          : ""}
                      </td>

                      <td>{pessoa.sexo}</td>

                      <td>
                        {pessoa.registro_desaparecimento?.data_desaparecimento
                          ? pessoa.registro_desaparecimento.data_desaparecimento
                            .split("-")
                            .reverse()
                            .join("/")
                          : "—"}
                      </td>

                      <td>
                        {pessoa.registro_desaparecimento?.local_desaparecimento || "—"}
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
                          "Sem registro"
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
                              const containerTabela = botao.closest(".pessoas-table-container");
                              const retanguloBotao = botao.getBoundingClientRect();
                              const retanguloContainer = containerTabela?.getBoundingClientRect();

                              const espacoAbaixo = retanguloContainer
                                ? retanguloContainer.bottom - retanguloBotao.bottom
                                : window.innerHeight - retanguloBotao.bottom;

                              const espacoAcima = retanguloContainer
                                ? retanguloBotao.top - retanguloContainer.top
                                : retanguloBotao.top;

                              setMenuAbrirParaCima(
                                espacoAbaixo < 190 && espacoAcima > espacoAbaixo
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
                                    excluirPessoa(pessoa.id, pessoa.nome);
                                  }}
                                >
                                  Excluir
                                </button>
                              )}

                              {pessoa.registro_desaparecimento?.status === "DESAPARECIDO" && (
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
                        <div className="pessoa-mobile-sem-foto">
                          Sem foto
                        </div>
                      )}

                      <div className="pessoa-mobile-nome">
                        <h3>{pessoa.nome}</h3>

                        <span>
                          CPF: {formatarCPF(pessoa.cpf)}
                        </span>

                        {status && (
                          <span
                            className={`status-caso ${status === "LOCALIZADO"
                                ? "status-localizado"
                                : "status-desaparecido"
                              }`}
                          >
                            {status === "LOCALIZADO" ? "Localizado" : "Desaparecido"}
                          </span>
                        )}
                      </div>

                      {/* MENU DE AÇÕES */}
                      <div className="pessoa-mobile-menu-container">
                        <button
                          type="button"
                          className="pessoa-mobile-menu-button"
                          onClick={() =>
                            setMenuAberto(menuAberto === pessoa.id ? null : pessoa.id)
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
                                  excluirPessoa(pessoa.id, pessoa.nome);
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
                        setDetalhesAbertos(detalhesExpandidos ? null : pessoa.id)
                      }
                    >
                      {detalhesExpandidos ? "Ocultar detalhes" : "Ver detalhes"}

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
                              ? pessoa.data_nascimento.split("-").reverse().join("/")
                              : "—"}
                          </strong>
                        </div>

                        <div className="pessoa-mobile-campo">
                          <span>Sexo</span>
                          <strong>{pessoa.sexo || "Não informado"}</strong>
                        </div>

                        <div className="pessoa-mobile-campo">
                          <span>Local do desaparecimento</span>
                          <strong>
                            {registro?.local_desaparecimento || "—"}
                          </strong>
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
                              {status === "LOCALIZADO" ? "Localizado" : "Desaparecido"}
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
    </div>
  );
}

export default Pessoas;