import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Pessoas.css";

function Pessoas() {
  const [pessoas, setPessoas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const navigate = useNavigate();

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

  useEffect(() => {
    carregarPessoas();
  }, []);

  return (
    <div className="pessoas-page">
      {/* CABEÇALHO */}
      <div className="pessoas-header">
        <div>
          <h1>Pessoas</h1>
          <p>Gerencie as pessoas cadastradas no sistema.</p>
        </div>

        <button
          className="pessoas-new-button"
          onClick={() => navigate("/pessoas/nova")}
        >
          + Nova pessoa
        </button>
      </div>

      {erro && <div className="pessoas-error">{erro}</div>}

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
            {/* =========================
      TABELA - DESKTOP
  ========================= */}

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

                      <td>{pessoa.cpf}</td>

                      <td>
                        {pessoa.data_nascimento
                          ? pessoa.data_nascimento.split("-").reverse().join("/")
                          : ""}
                      </td>

                      <td>{pessoa.sexo}</td>

                      <td className="pessoas-actions">
                        <button
                          onClick={() =>
                            navigate(`/pessoas/${pessoa.id}`)
                          }
                        >
                          Visualizar
                        </button>

                        <button
                          onClick={() =>
                            navigate(`/pessoas/${pessoa.id}/editar`)
                          }
                        >
                          Editar
                        </button>
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

                      <span>
                        {pessoa.sexo}
                      </span>
                    </div>

                  </div>


                  {/* INFORMAÇÕES */}
                  <div className="pessoa-mobile-info">

                    <div>
                      <span>CPF</span>

                      <strong>
                        {pessoa.cpf}
                      </strong>
                    </div>

                    <div>
                      <span>Data de nascimento</span>

                      <strong>
                        {pessoa.data_nascimento
                          ? pessoa.data_nascimento.split("-").reverse().join("/")
                          : ""}
                      </strong>
                    </div>

                  </div>


                  {/* AÇÕES */}
                  <div className="pessoa-mobile-actions">

                    <button
                      className="pessoa-visualizar"
                      onClick={() =>
                        navigate(`/pessoas/${pessoa.id}`)
                      }
                    >
                      Visualizar
                    </button>

                    <button
                      className="pessoa-editar"
                      onClick={() =>
                        navigate(`/pessoas/${pessoa.id}/editar`)
                      }
                    >
                      Editar
                    </button>

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