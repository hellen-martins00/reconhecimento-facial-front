import { useEffect, useState } from "react";
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

  const navigate = useNavigate();
  const location = useLocation();

  async function carregarPessoas() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await api.get("/pessoas");

      const pessoasComFotos = await Promise.all(
        resposta.data.map(async (pessoa) => {
          if (!pessoa.foto_id) {
            return {
              ...pessoa,
              foto_url: null,
            };
          }

          try {
            const respostaFoto = await api.get(
              `/fotos/${pessoa.foto_id}/arquivo`,
              {
                responseType: "blob",
              }
            );

            const fotoUrl = URL.createObjectURL(respostaFoto.data);

            return {
              ...pessoa,
              foto_url: fotoUrl,
            };
          } catch (error) {
            console.error(
              `Erro ao carregar foto da pessoa ${pessoa.id}:`,
              error
            );

            return {
              ...pessoa,
              foto_url: null,
            };
          }
        })
      );

      setPessoas(pessoasComFotos);
    } catch (error) {
      console.error(error);

      setErro(
        error.response?.data?.detail ||
        "Não foi possível carregar as pessoas."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function excluirPessoa(id, nome) {
    const confirmar = window.confirm(
      `Tem certeza que deseja excluir a pessoa "${nome}"?`
    );

    if (!confirmar) {
      return;
    }

    try {
      setErro("");
      setSucesso("");

      await api.delete(`/pessoas/${id}`);

      setPessoas((pessoasAtuais) =>
        pessoasAtuais.filter((pessoa) => pessoa.id !== id)
      );

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
    }
  }

  // MENSAGEM DE SUCESSO VINDO DO CADASTRO
  useEffect(() => {
    if (!location.state?.sucesso) {
      return;
    }

    setSucesso(location.state.sucesso);

    // Remove o state da URL/histórico
    // para não exibir novamente ao atualizar a página
    navigate(location.pathname, {
      replace: true,
      state: null,
    });

    const timer = setTimeout(() => {
      setSucesso("");
    }, 4000);

    return () => clearTimeout(timer);
  }, [location, navigate]);

  // CARREGAR PESSOAS
  useEffect(() => {
    carregarPessoas();
  }, []);

  return (
    <div className="pessoas-page">
      {/* CABEÇALHO */}
      <div className="pessoas-header">
        <div>
          <h1>Pessoas</h1>

          <p>
            Gerencie as pessoas cadastradas no sistema.
          </p>
        </div>

        <button
          className="pessoas-new-button"
          onClick={() => navigate("/pessoas/nova")}
        >
          + Adicionar Pessoa
        </button>
      </div>

      {/* MENSAGEM DE ERRO */}
      {erro && (
        <div className="pessoas-error">
          {erro}
        </div>
      )}

      {/* MENSAGEM DE SUCESSO */}
      {sucesso && (
        <div className="pessoas-success">
          <span className="pessoas-success-icon">
            ✓
          </span>

          <span>{sucesso}</span>
        </div>
      )}

      {/* CONTEÚDO PRINCIPAL */}
      <div className="pessoas-card">
        {carregando ? (
          <div className="pessoas-loading">
            Carregando pessoas...
          </div>
        ) : pessoas.length === 0 ? (
          <div className="pessoas-empty">
            <h2>Nenhuma pessoa cadastrada</h2>

            <p>
              Ainda não existem pessoas cadastradas no sistema.
            </p>
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
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {pessoas.map((pessoa) => (
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
                            <div className="pessoa-sem-foto">
                              Sem foto
                            </div>
                          )}

                          <span>{pessoa.nome}</span>
                        </div>
                      </td>

                      <td>
                        {formatarCPF(pessoa.cpf)}
                      </td>

                      <td>
                        {pessoa.data_nascimento
                          ? pessoa.data_nascimento
                            .split("-")
                            .reverse()
                            .join("/")
                          : ""}
                      </td>

                      <td>{pessoa.sexo}</td>

                      <td className="pessoas-actions">
                        <div className="pessoa-menu-container">
                          <button
                            className="pessoa-menu-button"
                            onClick={() =>
                              setMenuAberto(
                                menuAberto === pessoa.id ? null : pessoa.id
                              )
                            }
                            aria-label={`Ações para ${pessoa.nome}`}
                          >
                            ⋮
                          </button>

                          {menuAberto === pessoa.id && (
                            <div className="pessoa-menu">
                              <button
                                onClick={() => {
                                  setMenuAberto(null);
                                  navigate(`/pessoas/${pessoa.id}`);
                                }}
                              >
                                Visualizar
                              </button>

                              <button
                                onClick={() => {
                                  setMenuAberto(null);
                                  navigate(`/pessoas/${pessoa.id}/editar`);
                                }}
                              >
                                Editar
                              </button>

                              <button
                                type="button"
                                className="pessoa-menu-excluir"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setMenuAberto(null);
                                  excluirPessoa(pessoa.id, pessoa.nome);
                                }}
                              >
                                Excluir
                              </button>
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
              {pessoas.map((pessoa) => (
                <div
                  className="pessoa-mobile-card"
                  key={pessoa.id}
                >
                  {/* TOPO */}

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
                      <span>{pessoa.sexo}</span>
                    </div>

                    <div className="pessoa-mobile-menu-container">
                      <button
                        className="pessoa-mobile-menu-button"
                        onClick={() =>
                          setMenuAberto(
                            menuAberto === pessoa.id ? null : pessoa.id
                          )
                        }
                        aria-label={`Ações para ${pessoa.nome}`}
                      >
                        ⋮
                      </button>

                      {menuAberto === pessoa.id && (
                        <div className="pessoa-mobile-menu">
                          <button
                            onClick={() => {
                              setMenuAberto(null);
                              navigate(`/pessoas/${pessoa.id}`);
                            }}
                          >
                            Visualizar
                          </button>

                          <button
                            onClick={() => {
                              setMenuAberto(null);
                              navigate(`/pessoas/${pessoa.id}/editar`);
                            }}
                          >
                            Editar
                          </button>

                          <button
                            type="button"
                            className="pessoa-menu-excluir"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setMenuAberto(null);
                              excluirPessoa(pessoa.id, pessoa.nome);
                            }}
                          >
                            Excluir
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* INFORMAÇÕES */}

                  <div className="pessoa-mobile-info">
                    <div>
                      <span>CPF</span>

                      <strong>
                        {formatarCPF(pessoa.cpf)}
                      </strong>
                    </div>

                    <div>
                      <span>Data de nascimento</span>

                      <strong>
                        {pessoa.data_nascimento
                          ? pessoa.data_nascimento
                            .split("-")
                            .reverse()
                            .join("/")
                          : ""}
                      </strong>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Pessoas;