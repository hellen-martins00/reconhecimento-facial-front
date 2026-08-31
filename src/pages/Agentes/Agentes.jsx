import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Agentes.css";

function Agentes() {
  const [agentes, setAgentes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [excluindo, setExcluindo] = useState(null);

  const navigate = useNavigate();

  // Guardar referências das URLs geradas para garantir o cleanup no unmount
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

  // Revogar URLs das fotos
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

      // Revoga fotos da busca anterior
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

            // AGENTE NÃO POSSUI FOTO
            if (respostaFoto.status === 204) {
              return {
                ...agente,
                foto_url: null,
              };
            }

            // FOTO ENCONTRADA
            const fotoUrl = URL.createObjectURL(
              respostaFoto.data
            );

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

  // EXCLUIR AGENTE
  async function handleExcluir(agente) {
    if (!isAdmin) return;

    const confirmar = window.confirm(
      `Tem certeza que deseja excluir o agente "${agente.nome}"?`
    );

    if (!confirmar) return;

    setErro("");
    setExcluindo(agente.id);

    try {
      await api.delete(`/agentes/${agente.id}`);

      if (agente.foto_url) {
        URL.revokeObjectURL(agente.foto_url);

        fotosUrlsRef.current =
          fotosUrlsRef.current.filter(
            (url) => url !== agente.foto_url
          );
      }

      setAgentes((agentesAtuais) =>
        agentesAtuais.filter(
          (item) => item.id !== agente.id
        )
      );
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

  // FORMATAR DATA
  function formatarData(data) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR");
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
      {erro && (
        <div className="agentes-error">
          {erro}
        </div>
      )}

      {/* CONTEÚDO */}
      <div className="agentes-card">
        {carregando ? (
          <div className="agentes-loading">
            Carregando agentes...
          </div>
        ) : agentes.length === 0 ? (
          <div className="agentes-empty">
            <h2>Nenhum agente cadastrado</h2>
            <p>
              Ainda não existem agentes cadastrados no sistema.
            </p>
          </div>
        ) : (
          <>
            {/* TABELA - DESKTOP */}
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
                      {/* NOME */}
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

                      {/* USUÁRIO */}
                      <td>
                        {agente.usuario}
                      </td>

                      {/* PERFIL */}
                      <td>
                        {agente.perfil}
                      </td>

                      {/* DATA */}
                      <td>
                        {formatarData(agente.created_at)}
                      </td>

                      {/* AÇÕES */}
                      <td className="agentes-actions">
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/agentes/${agente.id}`)
                          }
                          disabled={
                            excluindo === agente.id
                          }
                        >
                          Visualizar
                        </button>

                        {(isAdmin ||
                          usuario?.id === agente.id) && (
                          <button
                            type="button"
                            onClick={() =>
                              navigate(
                                `/agentes/${agente.id}/editar`
                              )
                            }
                            disabled={
                              excluindo === agente.id
                            }
                          >
                            Editar
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            type="button"
                            className="agente-excluir"
                            onClick={() =>
                              handleExcluir(agente)
                            }
                            disabled={
                              excluindo === agente.id
                            }
                          >
                            {excluindo === agente.id
                              ? "Excluindo..."
                              : "Excluir"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* CARDS - MOBILE */}
            <div className="agentes-mobile-list">
              {agentes.map((agente) => (
                <div
                  className="agente-mobile-card"
                  key={agente.id}
                >
                  {/* TOPO */}
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
                      <h3>
                        {agente.nome}
                      </h3>

                      <span>
                        {agente.perfil}
                      </span>
                    </div>
                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="agente-mobile-info">
                    <div>
                      <span>Usuário</span>
                      <strong>
                        {agente.usuario}
                      </strong>
                    </div>

                    <div>
                      <span>Perfil</span>
                      <strong>
                        {agente.perfil}
                      </strong>
                    </div>

                    <div>
                      <span>Data de cadastro</span>
                      <strong>
                        {formatarData(agente.created_at)}
                      </strong>
                    </div>
                  </div>

                  {/* AÇÕES */}
                  <div className="agente-mobile-actions">
                    <button
                      className="agente-visualizar"
                      type="button"
                      onClick={() =>
                        navigate(`/agentes/${agente.id}`)
                      }
                      disabled={
                        excluindo === agente.id
                      }
                    >
                      Visualizar
                    </button>

                    {(isAdmin ||
                      usuario?.id === agente.id) && (
                      <button
                        className="agente-editar"
                        type="button"
                        onClick={() =>
                          navigate(
                            `/agentes/${agente.id}/editar`
                          )
                        }
                        disabled={
                          excluindo === agente.id
                        }
                      >
                        Editar
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        className="agente-excluir"
                        type="button"
                        onClick={() =>
                          handleExcluir(agente)
                        }
                        disabled={
                          excluindo === agente.id
                        }
                      >
                        {excluindo === agente.id
                          ? "Excluindo..."
                          : "Excluir"}
                      </button>
                    )}
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

export default Agentes;