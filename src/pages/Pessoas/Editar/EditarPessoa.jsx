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
  // ENDEREÇO
  // =========================

  const [enderecoId, setEnderecoId] = useState(null);
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

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
      // =========================
      // PESSOA
      // =========================

      const respostaPessoa = await api.get(`/pessoas/${id}`);
      const pessoa = respostaPessoa.data;

      setNome(pessoa.nome || "");
      setCpf(pessoa.cpf || "");
      setDataNascimento(pessoa.data_nascimento || "");
      setSexo(pessoa.sexo || "");
      setNomeMae(pessoa.nome_mae || "");
      setNomePai(pessoa.nome_pai || "");

      // =========================
      // TELEFONES
      // =========================

      try {
        const respostaTelefones = await api.get(
          `/telefones/pessoa/${id}`
        );

        setTelefones(
          Array.isArray(respostaTelefones.data)
            ? respostaTelefones.data
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar telefones:",
          error
        );

        setTelefones([]);
      }

      // =========================
      // ENDEREÇO
      // =========================

      try {
        const respostaEndereco = await api.get(
          `/enderecos/pessoa/${id}`
        );

        const enderecos = Array.isArray(respostaEndereco.data)
          ? respostaEndereco.data
          : [];

        if (enderecos.length > 0) {
          const endereco = enderecos[0];

          setEnderecoId(endereco.id || null);
          setLogradouro(endereco.logradouro || "");
          setNumero(endereco.numero || "");
          setBairro(endereco.bairro || "");
          setCidade(endereco.cidade || "");
          setEstado(endereco.estado || "");
          setCep(endereco.cep || "");
        } else {
          setEnderecoId(null);
          setLogradouro("");
          setNumero("");
          setBairro("");
          setCidade("");
          setEstado("");
          setCep("");
        }
      } catch (error) {
        console.error(
          "Erro ao carregar endereço:",
          error
        );

        setEnderecoId(null);
        setLogradouro("");
        setNumero("");
        setBairro("");
        setCidade("");
        setEstado("");
        setCep("");
      }

      // =========================
      // PASSAGENS
      // =========================

      try {
        const respostaPassagens = await api.get(
          `/passagens/pessoa/${id}`
        );

        setPassagens(
          Array.isArray(respostaPassagens.data)
            ? respostaPassagens.data
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar passagens:",
          error
        );

        setPassagens([]);
      }

      // =========================
      // FOTO
      // =========================

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
        if (error.response?.status !== 404) {
          console.error(
            "Erro ao carregar foto:",
            error
          );
        }

        setFotoUrl(null);
      }
    } catch (error) {
      console.error(error);

      const detalhe = error.response?.data?.detail;

      if (typeof detalhe === "string") {
        setErro(detalhe);
      } else {
        setErro(
          "Não foi possível carregar os dados da pessoa."
        );
      }
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
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setNovaFoto(arquivo);

    const url = URL.createObjectURL(arquivo);

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

  function alterarTelefone(index, campo, valor) {
    const novosTelefones = [...telefones];

    novosTelefones[index] = {
      ...novosTelefones[index],
      [campo]: valor,
    };

    setTelefones(novosTelefones);
  }

  async function removerTelefone(index) {
    const telefone = telefones[index];

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

  function alterarPassagem(index, campo, valor) {
    const novasPassagens = [...passagens];

    novasPassagens[index] = {
      ...novasPassagens[index],
      [campo]: valor,
    };

    setPassagens(novasPassagens);
  }

  async function removerPassagem(index) {
    const passagem = passagens[index];

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
      // =========================
      // ATUALIZAR PESSOA
      // =========================

      await api.put(`/pessoas/${id}`, {
        nome,
        cpf,
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,
      });

      // =========================
      // TELEFONES
      // =========================

      const telefonesValidos = telefones.filter(
        (telefone) =>
          telefone.numero &&
          telefone.numero.trim() !== ""
      );

      // Novos telefones
      const novosTelefones = telefonesValidos.filter(
        (telefone) => telefone.novo
      );

      await Promise.all(
        novosTelefones.map((telefone) =>
          api.post("/telefones", {
            pessoa_id: id,
            numero: telefone.numero,
            tipo: telefone.tipo,
          })
        )
      );

      // Telefones existentes alterados
      const telefonesExistentes = telefonesValidos.filter(
        (telefone) =>
          telefone.id &&
          !telefone.novo
      );

      await Promise.all(
        telefonesExistentes.map((telefone) =>
          api.put(`/telefones/${telefone.id}`, {
            numero: telefone.numero,
            tipo: telefone.tipo,
          })
        )
      );

      // =========================
      // ENDEREÇO
      // =========================

      const enderecoPreenchido =
        logradouro.trim() !== "" ||
        numero.trim() !== "" ||
        bairro.trim() !== "" ||
        cidade.trim() !== "" ||
        estado.trim() !== "" ||
        cep.trim() !== "";

      if (enderecoPreenchido) {
        if (enderecoId) {
          // Atualizar endereço existente
          await api.put(
            `/enderecos/${enderecoId}`,
            {
              logradouro,
              numero,
              bairro,
              cidade,
              estado,
              cep,
            }
          );
        } else {
          // Criar endereço caso a pessoa ainda não tenha
          const respostaEndereco = await api.post(
            "/enderecos",
            {
              pessoa_id: id,
              logradouro,
              numero,
              bairro,
              cidade,
              estado,
              cep,
            }
          );

          setEnderecoId(
            respostaEndereco.data.id
          );
        }
      }

      // =========================
      // NOVAS PASSAGENS
      // =========================

      const novasPassagens = passagens.filter(
        (passagem) =>
          passagem.novo &&
          passagem.crime &&
          passagem.crime.trim() !== "" &&
          passagem.data_ocorrencia !== ""
      );

      await Promise.all(
        novasPassagens.map((passagem) =>
          api.post("/passagens", {
            pessoa_id: id,
            crime: passagem.crime,
            data_ocorrencia:
              passagem.data_ocorrencia,
          })
        )
      );

      // =========================
      // FOTO
      // =========================

      if (novaFoto) {
        const formData = new FormData();

        formData.append(
          "arquivo",
          novaFoto
        );

        await api.post(
          `/fotos?pessoa_id=${id}`,
          formData
        );
      }

      // =========================
      // REDIRECIONAR
      // =========================

      navigate(`/pessoas/${id}`);
    } catch (error) {
      console.error(
        "Erro ao atualizar pessoa:",
        error
      );

      console.error(
        "Resposta da API:",
        error.response?.data
      );

      const detalhe =
        error.response?.data?.detail;

      if (Array.isArray(detalhe)) {
        setErro(
          detalhe
            .map((item) => {
              const campo = Array.isArray(item.loc)
                ? item.loc[item.loc.length - 1]
                : "";

              return `${campo}: ${item.msg}`;
            })
            .join(" | ")
        );
      } else if (typeof detalhe === "string") {
        setErro(detalhe);
      } else {
        setErro(
          "Não foi possível atualizar a pessoa."
        );
      }
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

          {/* =========================
              DADOS PESSOAIS
          ========================= */}

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
              minLength={3}
              maxLength={150}
              required
            />
          </div>

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

            <span className="form-help">
              Informe apenas os 11 números do CPF.
            </span>
          </div>

          {/* DATA + SEXO */}

          <div className="form-row">

            <div className="form-group">
              <label htmlFor="dataNascimento">
                Data de nascimento
              </label>

              <input
                id="dataNascimento"
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
              <label htmlFor="sexo">
                Sexo
              </label>

              <select
                id="sexo"
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
            <label htmlFor="nomeMae">
              Nome da mãe
            </label>

            <input
              id="nomeMae"
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
            <label htmlFor="nomePai">
              Nome do pai
            </label>

            <input
              id="nomePai"
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

          {/* =========================
              TELEFONES
          ========================= */}

          <section className="editar-telefones-section">

            <div className="editar-section-header">

              <div>
                <h3>
                  Telefones
                </h3>

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
                      telefone.id || `novo-${index}`
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

                        <label>
                          Número
                        </label>

                        <input
                          type="text"
                          value={
                            telefone.numero || ""
                          }
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

                        <label>
                          Tipo
                        </label>

                        <select
                          value={
                            telefone.tipo || "PESSOAL"
                          }
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

          {/* =========================
              ENDEREÇO
          ========================= */}

          <section className="editar-endereco-section">

            <div className="editar-section-header">

              <div>
                <h3>
                  Endereço
                </h3>

                <p>
                  Endereço residencial vinculado à pessoa.
                </p>
              </div>

            </div>

            <div className="form-group">

              <label htmlFor="logradouro">
                Logradouro
              </label>

              <input
                id="logradouro"
                type="text"
                value={logradouro}
                onChange={(event) =>
                  setLogradouro(
                    event.target.value
                  )
                }
                placeholder="Digite o logradouro"
              />

            </div>

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="numero">
                  Número
                </label>

                <input
                  id="numero"
                  type="text"
                  value={numero}
                  onChange={(event) =>
                    setNumero(
                      event.target.value
                    )
                  }
                  placeholder="Número"
                />

              </div>

              <div className="form-group">

                <label htmlFor="bairro">
                  Bairro
                </label>

                <input
                  id="bairro"
                  type="text"
                  value={bairro}
                  onChange={(event) =>
                    setBairro(
                      event.target.value
                    )
                  }
                  placeholder="Digite o bairro"
                />

              </div>

            </div>

            <div className="form-row">

              <div className="form-group">

                <label htmlFor="cidade">
                  Cidade
                </label>

                <input
                  id="cidade"
                  type="text"
                  value={cidade}
                  onChange={(event) =>
                    setCidade(
                      event.target.value
                    )
                  }
                  placeholder="Digite a cidade"
                />

              </div>

              <div className="form-group">

                <label htmlFor="estado">
                  Estado
                </label>

                <input
                  id="estado"
                  type="text"
                  value={estado}
                  onChange={(event) =>
                    setEstado(
                      event.target.value
                        .toUpperCase()
                        .slice(0, 2)
                    )
                  }
                  maxLength={2}
                  placeholder="UF"
                />

              </div>

            </div>

            <div className="form-group">

              <label htmlFor="cep">
                CEP
              </label>

              <input
                id="cep"
                type="text"
                value={cep}
                onChange={(event) =>
                  setCep(
                    event.target.value
                      .replace(/\D/g, "")
                      .slice(0, 8)
                  )
                }
                maxLength={8}
                placeholder="Digite o CEP"
              />

              <span className="form-help">
                Informe apenas os 8 números do CEP.
              </span>

            </div>

          </section>

          {/* =========================
              PASSAGENS
          ========================= */}

          <section className="editar-passagens-section">

            <div className="editar-section-header">

              <div>
                <h3>
                  Passagens criminais
                </h3>

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
                      passagem.id ||
                      `nova-passagem-${index}`
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

                        <label>
                          Crime
                        </label>

                        <input
                          type="text"
                          value={
                            passagem.crime || ""
                          }
                          onChange={(event) =>
                            alterarPassagem(
                              index,
                              "crime",
                              event.target.value
                            )
                          }
                          placeholder="Ex.: Furto"
                        />

                      </div>

                      <div className="form-group">

                        <label>
                          Data da ocorrência
                        </label>

                        <input
                          type="date"
                          value={
                            passagem.data_ocorrencia || ""
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

          {/* =========================
              AÇÕES
          ========================= */}

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