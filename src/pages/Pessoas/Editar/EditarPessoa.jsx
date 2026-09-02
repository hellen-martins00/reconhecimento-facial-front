import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import "./EditarPessoa.css";

function EditarPessoa() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =========================
  // DADOS DA PESSOA
  // =========================

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [nomePai, setNomePai] = useState("");

  // =========================
  // TELEFONES
  // =========================

  const [telefones, setTelefones] = useState([]);

  // =========================
  // PASSAGENS
  // =========================

  const [passagens, setPassagens] = useState([]);

  // =========================
  // ESTADOS
  // =========================

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // =========================
  // FOTO
  // =========================

  const [fotoUrl, setFotoUrl] = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);

  // =========================
  // CARREGAR DADOS
  // =========================

  async function carregarPessoa() {
    setCarregando(true);
    setErro("");

    try {
      // Pessoa
      const respostaPessoa = await api.get(`/pessoas/${id}`);
      const pessoa = respostaPessoa.data;

      setNome(pessoa.nome);
      setCpf(pessoa.cpf);
      setDataNascimento(pessoa.data_nascimento);
      setSexo(pessoa.sexo);
      setNomeMae(pessoa.nome_mae);
      setNomePai(pessoa.nome_pai);

      // Telefones
      try {
        const respostaTelefones = await api.get(
          `/telefones/pessoa/${id}`
        );

        setTelefones(respostaTelefones.data);
      } catch (error) {
        console.error(
          "Erro ao carregar telefones:",
          error
        );

        setTelefones([]);
      }

      // Passagens
      try {
        const respostaPassagens = await api.get(
          `/passagens/pessoa/${id}`
        );

        setPassagens(respostaPassagens.data);
      } catch (error) {
        console.error(
          "Erro ao carregar passagens:",
          error
        );

        setPassagens([]);
      }

      // Foto
      try {
        const respostaFoto = await api.get(
          `/fotos/pessoa/${id}/mais-recente/arquivo`,
          {
            responseType: "blob",
          }
        );

        const url = URL.createObjectURL(
          respostaFoto.data
        );

        setFotoUrl(url);

      } catch (error) {

        if (
          error.response?.status !== 404
        ) {
          console.error(
            "Erro ao carregar foto:",
            error
          );
        }

        setFotoUrl(null);
      }

    } catch (error) {

      console.error(error);

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

  }, [id]);

  // =========================
  // FOTO
  // =========================

  function selecionarFoto(event) {

    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setNovaFoto(arquivo);

    const url =
      URL.createObjectURL(arquivo);

    setFotoUrl(url);
  }

  // =========================
  // TELEFONES
  // =========================

  function adicionarTelefone() {

    setTelefones([
      ...telefones,
      {
        numero: "",
        tipo: "PESSOAL",
        novo: true,
      },
    ]);
  }

  function alterarTelefone(
    index,
    campo,
    valor
  ) {

    const novosTelefones =
      [...telefones];

    novosTelefones[index][campo] =
      valor;

    setTelefones(novosTelefones);
  }

  async function removerTelefone(index) {

    const telefone =
      telefones[index];

    // Se já existe no banco
    if (telefone.id) {

      try {

        await api.delete(
          `/telefones/${telefone.id}`
        );

      } catch (error) {

        console.error(
          "Erro ao remover telefone:",
          error
        );

        setErro(
          "Não foi possível remover o telefone."
        );

        return;
      }
    }

    setTelefones(
      telefones.filter(
        (_, telefoneIndex) =>
          telefoneIndex !== index
      )
    );
  }

  // =========================
  // PASSAGENS
  // =========================

  function adicionarPassagem() {

    setPassagens([
      ...passagens,
      {
        crime: "",
        data_ocorrencia: "",
        novo: true,
      },
    ]);
  }

  function alterarPassagem(
    index,
    campo,
    valor
  ) {

    const novasPassagens =
      [...passagens];

    novasPassagens[index][campo] =
      valor;

    setPassagens(novasPassagens);
  }

  async function removerPassagem(index) {

    const passagem =
      passagens[index];

    // Se já existe no banco
    if (passagem.id) {

      try {

        await api.delete(
          `/passagens/${passagem.id}`
        );

      } catch (error) {

        console.error(
          "Erro ao remover passagem:",
          error
        );

        setErro(
          "Não foi possível remover a passagem criminal."
        );

        return;
      }
    }

    setPassagens(
      passagens.filter(
        (_, passagemIndex) =>
          passagemIndex !== index
      )
    );
  }

  // =========================
  // SALVAR
  // =========================

  async function handleSubmit(event) {

    event.preventDefault();

    setErro("");
    setSalvando(true);

    try {

      // =====================
      // ATUALIZAR PESSOA
      // =====================

      await api.put(`/pessoas/${id}`, {

        nome,
        cpf,
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,

      });


      // =====================
      // NOVOS TELEFONES
      // =====================

      const novosTelefones =
        telefones.filter(
          (telefone) =>
            telefone.novo &&
            telefone.numero.trim() !== ""
        );

      await Promise.all(

        novosTelefones.map(
          (telefone) =>

            api.post(
              "/telefones",
              {

                pessoa_id: id,
                numero: telefone.numero,
                tipo: telefone.tipo,

              }
            )
        )
      );


      // =====================
      // NOVAS PASSAGENS
      // =====================

      const novasPassagens =
        passagens.filter(
          (passagem) =>
            passagem.novo &&
            passagem.crime.trim() !== "" &&
            passagem.data_ocorrencia !== ""
        );

      await Promise.all(

        novasPassagens.map(
          (passagem) =>

            api.post(
              "/passagens",
              {

                pessoa_id: id,
                crime: passagem.crime,
                data_ocorrencia:
                  passagem.data_ocorrencia,

              }
            )
        )
      );


      // =====================
      // FOTO
      // =====================

      if (novaFoto) {

        const formData =
          new FormData();

        formData.append(
          "arquivo",
          novaFoto
        );

        await api.post(
          `/fotos?pessoa_id=${id}`,
          formData
        );
      }


      // =====================
      // REDIRECIONAR
      // =====================

      navigate(`/pessoas/${id}`);

    } catch (error) {

      console.error(error);

      setErro(
        error.response?.data?.detail ||
        "Não foi possível atualizar a pessoa."
      );

    } finally {

      setSalvando(false);

    }
  }

  // =========================
  // LOADING
  // =========================

  if (carregando) {

    return (

      <div className="editar-pessoa-page">

        <div className="editar-loading">

          Carregando dados da pessoa...

        </div>

      </div>
    );
  }


  // =========================
  // ERRO INICIAL
  // =========================

  if (erro && !nome) {

    return (

      <div className="editar-pessoa-page">

        <div className="editar-header">

          <div>

            <h1>Editar pessoa</h1>

            <p>
              Atualize os dados cadastrais.
            </p>

          </div>

        </div>

        <div className="editar-error">

          {erro}

        </div>

      </div>
    );
  }


  // =========================
  // TELA
  // =========================

  return (

    <div className="editar-pessoa-page">


      {/* CABEÇALHO */}

      <div className="editar-header">

        <div>

          <h1>Editar pessoa</h1>

          <p>
            Atualize os dados cadastrais da pessoa.
          </p>

        </div>

        <button
          type="button"
          className="editar-voltar"
          onClick={() =>
            navigate(`/pessoas/${id}`)
          }
        >

          Voltar

        </button>

      </div>


      {/* CARD */}

      <div className="editar-pessoa-card">


        {/* FOTO */}

        <div className="editar-foto-container">

          {fotoUrl ? (

            <img
              src={fotoUrl}
              alt={`Foto de ${nome}`}
              className="editar-foto"
            />

          ) : (

            <div className="editar-sem-foto">

              Sem foto

            </div>

          )}

          <label
            htmlFor="novaFoto"
            className="editar-foto-button"
          >

            Alterar foto

          </label>

          <input
            id="novaFoto"
            type="file"
            accept="image/jpeg,image/png"
            onChange={selecionarFoto}
            hidden
          />

        </div>


        {erro && (

          <div className="editar-error">

            {erro}

          </div>

        )}


        <form onSubmit={handleSubmit}>


          {/* NOME */}

          <div className="form-group">

            <label htmlFor="nome">

              Nome

            </label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.target.value)
              }
              required
            />

          </div>


          {/* CPF */}

          <div className="form-group">

            <label htmlFor="cpf">

              CPF

            </label>

            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(event) =>
                setCpf(event.target.value)
              }
              maxLength={11}
              required
            />

          </div>


          {/* TELEFONES */}

          <section className="editar-telefones-section">

            <div className="editar-section-header">

              <div>

                <h3>Telefones</h3>

                <p>
                  Telefones vinculados à pessoa.
                </p>

              </div>

              <button
                type="button"
                className="adicionar-telefone-button"
                onClick={adicionarTelefone}
              >

                + Adicionar telefone

              </button>

            </div>


            <div className="editar-lista">

              {telefones.map(
                (telefone, index) => (

                  <div
                    className="editar-item"
                    key={
                      telefone.id || index
                    }
                  >

                    <div className="editar-item-header">

                      <span>

                        Telefone {index + 1}

                      </span>

                      <button
                        type="button"
                        className="remover-mobile"
                        onClick={() =>
                          removerTelefone(index)
                        }
                      >

                        Remover

                      </button>

                    </div>


                    <div className="editar-telefone-fields">

                      <div className="form-group">

                        <label>Número</label>

                        <input
                          type="text"
                          value={telefone.numero}
                          onChange={(event) =>
                            alterarTelefone(
                              index,
                              "numero",
                              event.target.value
                            )
                          }
                        />

                      </div>


                      <div className="form-group">

                        <label>Tipo</label>

                        <select
                          value={telefone.tipo}
                          onChange={(event) =>
                            alterarTelefone(
                              index,
                              "tipo",
                              event.target.value
                            )
                          }
                        >

                          <option value="PESSOAL">
                            Pessoal
                          </option>

                          <option value="RESIDENCIAL">
                            Residencial
                          </option>

                        </select>

                      </div>


                      <button
                        type="button"
                        className="remover-button"
                        onClick={() =>
                          removerTelefone(index)
                        }
                      >

                        Remover

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>


          {/* PASSAGENS */}

          <section className="editar-passagens-section">

            <div className="editar-section-header">

              <div>

                <h3>Passagens criminais</h3>

                <p>
                  Registros vinculados à pessoa.
                </p>

              </div>

              <button
                type="button"
                className="adicionar-passagem-button"
                onClick={adicionarPassagem}
              >

                + Adicionar passagem

              </button>

            </div>


            <div className="editar-lista">

              {passagens.map(
                (passagem, index) => (

                  <div
                    className="editar-item"
                    key={
                      passagem.id || index
                    }
                  >

                    <div className="editar-item-header">

                      <span>

                        Passagem {index + 1}

                      </span>

                      <button
                        type="button"
                        className="remover-mobile"
                        onClick={() =>
                          removerPassagem(index)
                        }
                      >

                        Remover

                      </button>

                    </div>


                    <div className="editar-passagem-fields">

                      <div className="form-group">

                        <label>Crime</label>

                        <input
                          type="text"
                          value={passagem.crime}
                          onChange={(event) =>
                            alterarPassagem(
                              index,
                              "crime",
                              event.target.value
                            )
                          }
                        />

                      </div>


                      <div className="form-group">

                        <label>
                          Data da ocorrência
                        </label>

                        <input
                          type="date"
                          value={
                            passagem.data_ocorrencia
                          }
                          onChange={(event) =>
                            alterarPassagem(
                              index,
                              "data_ocorrencia",
                              event.target.value
                            )
                          }
                        />

                      </div>


                      <button
                        type="button"
                        className="remover-button"
                        onClick={() =>
                          removerPassagem(index)
                        }
                      >

                        Remover

                      </button>

                    </div>

                  </div>

                )
              )}

            </div>

          </section>


          {/* DATA + SEXO */}

          <div className="form-row">

            <div className="form-group">

              <label>
                Data de nascimento
              </label>

              <input
                type="date"
                value={dataNascimento}
                onChange={(event) =>
                  setDataNascimento(
                    event.target.value
                  )
                }
                required
              />

            </div>


            <div className="form-group">

              <label>Sexo</label>

              <select
                value={sexo}
                onChange={(event) =>
                  setSexo(event.target.value)
                }
                required
              >

                <option value="">
                  Selecione
                </option>

                <option value="M">
                  Masculino
                </option>

                <option value="F">
                  Feminino
                </option>

              </select>

            </div>

          </div>


          {/* MÃE */}

          <div className="form-group">

            <label>
              Nome da mãe
            </label>

            <input
              type="text"
              value={nomeMae}
              onChange={(event) =>
                setNomeMae(
                  event.target.value
                )
              }
              required
            />

          </div>


          {/* PAI */}

          <div className="form-group">

            <label>
              Nome do pai
            </label>

            <input
              type="text"
              value={nomePai}
              onChange={(event) =>
                setNomePai(
                  event.target.value
                )
              }
              required
            />

          </div>


          {/* BOTÕES */}

          <div className="editar-actions">

            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                navigate(`/pessoas/${id}`)
              }
              disabled={salvando}
            >

              Cancelar

            </button>


            <button
              type="submit"
              className="button-primary"
              disabled={salvando}
            >

              {salvando
                ? "Salvando..."
                : "Salvar alterações"}

            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default EditarPessoa;