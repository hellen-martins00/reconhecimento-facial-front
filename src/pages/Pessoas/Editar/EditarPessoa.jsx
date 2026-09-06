import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import {
  formatarCPF,
  limparCPF,
} from "../../../utils/formatarCPF";

import {
  formatarCEP,
  limparCEP,
} from "../../../utils/formatarCEP";

import {
  formatarTelefone,
  limparTelefone,
} from "../../../utils/formatarTelefone";

import "./EditarPessoa.css";

function EditarPessoa() {
  const { id } = useParams();
  const navigate = useNavigate();

  // ETAPA ATUAL
  const [etapaAtual, setEtapaAtual] = useState(1);

  // DADOS DA PESSOA
  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [nomePai, setNomePai] = useState("");

  // TELEFONES
  const [telefones, setTelefones] = useState([]);

  // ENDEREÇO
  const [enderecoId, setEnderecoId] = useState(null);
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  // PASSAGENS
  const [passagens, setPassagens] = useState([]);

  // FOTO
  const [fotoUrl, setFotoUrl] = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);

  // ESTADOS
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // ETAPAS
  const etapas = [
    {
      numero: 1,
      titulo: "Dados pessoais",
      descricao: "Identificação",
    },
    {
      numero: 2,
      titulo: "Telefones",
      descricao: "Contatos",
    },
    {
      numero: 3,
      titulo: "Endereço",
      descricao: "Localização",
    },
    {
      numero: 4,
      titulo: "Passagens",
      descricao: "Registros",
    },
    {
      numero: 5,
      titulo: "Revisão",
      descricao: "Confirmar",
    },
  ];

  // CARREGAR DADOS
  async function carregarPessoa() {
    setCarregando(true);
    setErro("");

    try {
      // PESSOA
      const respostaPessoa = await api.get(`/pessoas/${id}`);
      const pessoa = respostaPessoa.data;

      setNome(pessoa.nome || "");
      setCpf(pessoa.cpf || "");
      setDataNascimento(pessoa.data_nascimento || "");
      setSexo(pessoa.sexo || "");
      setNomeMae(pessoa.nome_mae || "");
      setNomePai(pessoa.nome_pai || "");

      // TELEFONES
      try {
        const respostaTelefones = await api.get(
          `/telefones/pessoa/${id}`
        );

        setTelefones(
          Array.isArray(respostaTelefones.data)
            ? respostaTelefones.data.map((telefone) => ({
                ...telefone,
                novo: false,
              }))
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar telefones:",
          error
        );

        setTelefones([]);
      }

      // ENDEREÇO
      try {
        const respostaEndereco = await api.get(
          `/enderecos/pessoa/${id}`
        );

        const enderecos = Array.isArray(
          respostaEndereco.data
        )
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

      // PASSAGENS
      try {
        const respostaPassagens = await api.get(
          `/passagens/pessoa/${id}`
        );

        setPassagens(
          Array.isArray(respostaPassagens.data)
            ? respostaPassagens.data.map((passagem) => ({
                ...passagem,
                novo: false,
              }))
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar passagens:",
          error
        );

        setPassagens([]);
      }

      // FOTO
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

    return () => {
      if (fotoUrl) {
        URL.revokeObjectURL(fotoUrl);
      }
    };
  }, [id]);

  // FOTO
  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setNovaFoto(arquivo);

    const url = URL.createObjectURL(arquivo);

    setFotoUrl(url);
  }

  // TELEFONES
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

  // PASSAGENS
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

  // VALIDAÇÃO DAS ETAPAS
  function validarEtapa(etapa) {
    setErro("");

    if (etapa === 1) {
      if (!nome.trim()) {
        setErro("Informe o nome da pessoa.");
        return false;
      }

      if (limparCPF(cpf).length !== 11) {
        setErro("Informe um CPF válido com 11 números.");
        return false;
      }

      if (!dataNascimento) {
        setErro("Informe a data de nascimento.");
        return false;
      }

      if (!sexo) {
        setErro("Selecione o sexo.");
        return false;
      }

      if (!nomeMae.trim()) {
        setErro("Informe o nome da mãe.");
        return false;
      }

      if (!nomePai.trim()) {
        setErro("Informe o nome do pai.");
        return false;
      }
    }

    if (etapa === 2) {
      const telefoneInvalido = telefones.some(
        (telefone) => {
          if (
            !telefone.numero ||
            !telefone.numero.trim()
          ) {
            return false;
          }

          const numeros = limparTelefone(
            telefone.numero
          );

          return (
            numeros.length !== 10 &&
            numeros.length !== 11
          );
        }
      );

      if (telefoneInvalido) {
        setErro(
          "Verifique os telefones informados. Eles devem possuir 10 ou 11 números."
        );

        return false;
      }
    }

    if (etapa === 3) {
      const enderecoPreenchido =
        logradouro.trim() !== "" ||
        numero.trim() !== "" ||
        bairro.trim() !== "" ||
        cidade.trim() !== "" ||
        estado.trim() !== "" ||
        cep.trim() !== "";

      if (enderecoPreenchido) {
        if (!logradouro.trim()) {
          setErro("Informe o logradouro.");
          return false;
        }

        if (!numero.trim()) {
          setErro("Informe o número.");
          return false;
        }

        if (!bairro.trim()) {
          setErro("Informe o bairro.");
          return false;
        }

        if (!cidade.trim()) {
          setErro("Informe a cidade.");
          return false;
        }

        if (!estado.trim()) {
          setErro("Informe o estado.");
          return false;
        }

        if (limparCEP(cep).length !== 8) {
          setErro(
            "Informe um CEP válido com 8 números."
          );

          return false;
        }
      }
    }

    if (etapa === 4) {
      const passagemInvalida = passagens.some(
        (passagem) => {
          const crime =
            passagem.crime?.trim() || "";

          const data =
            passagem.data_ocorrencia || "";

          return (
            (crime && !data) ||
            (!crime && data)
          );
        }
      );

      if (passagemInvalida) {
        setErro(
          "Preencha o crime e a data da ocorrência em todas as passagens."
        );

        return false;
      }
    }

    return true;
  }

  // NAVEGAÇÃO ENTRE ETAPAS

  function proximaEtapa() {
    if (!validarEtapa(etapaAtual)) {
      return;
    }

    setEtapaAtual((atual) =>
      Math.min(atual + 1, 5)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function etapaAnterior() {
    setErro("");

    setEtapaAtual((atual) =>
      Math.max(atual - 1, 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function irParaEtapa(etapa) {
    if (etapa >= etapaAtual) {
      return;
    }

    setErro("");
    setEtapaAtual(etapa);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // SALVAR
  async function handleSubmit(event) {
    event.preventDefault();

    if (!validarEtapa(4)) {
      setEtapaAtual(4);
      return;
    }

    setErro("");
    setSalvando(true);

    try {
      // ATUALIZAR PESSOA

      await api.put(`/pessoas/${id}`, {
        nome,
        cpf: limparCPF(cpf),
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,
      });

      // TELEFONES
      const telefonesValidos = telefones.filter(
        (telefone) =>
          telefone.numero &&
          telefone.numero.trim() !== ""
      );

      const novosTelefones =
        telefonesValidos.filter(
          (telefone) => telefone.novo
        );

      await Promise.all(
        novosTelefones.map((telefone) =>
          api.post("/telefones", {
            pessoa_id: id,
            numero: limparTelefone(
              telefone.numero
            ),
            tipo: telefone.tipo,
          })
        )
      );

      const telefonesExistentes =
        telefonesValidos.filter(
          (telefone) =>
            telefone.id &&
            !telefone.novo
        );

      await Promise.all(
        telefonesExistentes.map((telefone) =>
          api.put(
            `/telefones/${telefone.id}`,
            {
              numero: limparTelefone(
                telefone.numero
              ),
              tipo: telefone.tipo,
            }
          )
        )
      );

      // ENDEREÇO
      const enderecoPreenchido =
        logradouro.trim() !== "" ||
        numero.trim() !== "" ||
        bairro.trim() !== "" ||
        cidade.trim() !== "" ||
        estado.trim() !== "" ||
        cep.trim() !== "";

      if (enderecoPreenchido) {
        if (enderecoId) {
          await api.put(
            `/enderecos/${enderecoId}`,
            {
              logradouro,
              numero,
              bairro,
              cidade,
              estado,
              cep: limparCEP(cep),
            }
          );
        } else {
          const respostaEndereco =
            await api.post(
              "/enderecos",
              {
                pessoa_id: id,
                logradouro,
                numero,
                bairro,
                cidade,
                estado,
                cep: limparCEP(cep),
              }
            );

          setEnderecoId(
            respostaEndereco.data.id
          );
        }
      }

      // NOVAS PASSAGENS
      const novasPassagens =
        passagens.filter(
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

      // FOTO
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

      // REDIRECIONAR
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
              const campo =
                Array.isArray(item.loc)
                  ? item.loc[
                      item.loc.length - 1
                    ]
                  : "";

              return `${campo}: ${item.msg}`;
            })
            .join(" | ")
        );
      } else if (
        typeof detalhe === "string"
      ) {
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

  // LOADING
  if (carregando) {
    return (
      <div className="editar-pessoa-page">
        <div className="editar-loading">
          Carregando dados da pessoa...
        </div>
      </div>
    );
  }

  // ERRO INICIAL

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

        <div className="editar-error">
          {erro}
        </div>
      </div>
    );
  }

  // RENDER

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
          disabled={salvando}
        >
          Voltar
        </button>
      </div>

      {/* STEPPER */}
      <div className="editar-stepper">
        {etapas.map((etapa, index) => {
          const concluida =
            etapa.numero < etapaAtual;

          const atual =
            etapa.numero === etapaAtual;

          return (
            <div
              className={`editar-step ${
                atual
                  ? "editar-step-atual"
                  : ""
              } ${
                concluida
                  ? "editar-step-concluida"
                  : ""
              }`}
              key={etapa.numero}
            >
              <button
                type="button"
                className="editar-step-button"
                onClick={() =>
                  irParaEtapa(etapa.numero)
                }
                disabled={
                  !concluida ||
                  salvando
                }
              >
                <span className="editar-step-numero">
                  {concluida
                    ? "✓"
                    : etapa.numero}
                </span>

                <span className="editar-step-info">
                  <strong>
                    {etapa.titulo}
                  </strong>

                  <small>
                    {etapa.descricao}
                  </small>
                </span>
              </button>

              {index <
                etapas.length - 1 && (
                <span className="editar-step-linha" />
              )}
            </div>
          );
        })}
      </div>

      {/* CARD */}
      <div className="editar-pessoa-card">

        {erro && (
          <div className="editar-error">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ETAPA 1 */}

          {etapaAtual === 1 && (
            <section className="editar-etapa">

              <div className="editar-etapa-header">
                <span className="editar-etapa-numero-label">
                  Etapa 01
                </span>

                <h2>Dados pessoais</h2>

                <p>
                  Atualize as informações de
                  identificação da pessoa.
                </p>
              </div>

              {/* FOTO + IDENTIFICAÇÃO */}

              <div className="editar-identificacao">

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

                <div className="editar-identificacao-campos">

                  <div className="editar-form-group">
                    <label htmlFor="nome">
                      Nome <span>*</span>
                    </label>

                    <input
                      id="nome"
                      type="text"
                      value={nome}
                      onChange={(event) =>
                        setNome(
                          event.target.value
                        )
                      }
                      minLength={3}
                      maxLength={150}
                      required
                    />
                  </div>

                  <div className="editar-form-group">
                    <label htmlFor="cpf">
                      CPF <span>*</span>
                    </label>

                    <input
                      id="cpf"
                      type="text"
                      value={formatarCPF(cpf)}
                      onChange={(event) =>
                        setCpf(
                          limparCPF(
                            event.target.value
                          )
                        )
                      }
                      maxLength={14}
                      inputMode="numeric"
                      required
                    />

                    <span className="editar-form-help">
                      Informe apenas os 11 números
                      do CPF.
                    </span>
                  </div>

                </div>
              </div>

              {/* DATA + SEXO */}

              <div className="editar-form-row">

                <div className="editar-form-group">
                  <label htmlFor="dataNascimento">
                    Data de nascimento <span>*</span>
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

                <div className="editar-form-group">
                  <label htmlFor="sexo">
                    Sexo <span>*</span>
                  </label>

                  <select
                    id="sexo"
                    value={sexo}
                    onChange={(event) =>
                      setSexo(
                        event.target.value
                      )
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

              <div className="editar-form-group">
                <label htmlFor="nomeMae">
                  Nome da mãe <span>*</span>
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

              <div className="editar-form-group">
                <label htmlFor="nomePai">
                  Nome do pai <span>*</span>
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

              {/* AÇÕES */}

              <div className="editar-actions">
                <button
                  type="button"
                  className="editar-button-secondary"
                  onClick={() =>
                    navigate(`/pessoas/${id}`)
                  }
                  disabled={salvando}
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  className="editar-button-primary"
                  onClick={proximaEtapa}
                  disabled={salvando}
                >
                  Próximo
                  <span>→</span>
                </button>
              </div>

            </section>
          )}

          {/* ETAPA 2 */}

          {etapaAtual === 2 && (
            <section className="editar-etapa">

              <div className="editar-etapa-header">
                <span className="editar-etapa-numero-label">
                  Etapa 02
                </span>

                <h2>Telefones</h2>

                <p>
                  Gerencie os telefones vinculados
                  à pessoa.
                </p>
              </div>

              <section className="editar-section">

                <div className="editar-section-header">
                  <div>
                    <h3>
                      Telefones cadastrados
                    </h3>

                    <p>
                      Edite, remova ou adicione
                      novos telefones.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="editar-adicionar"
                    onClick={
                      adicionarTelefone
                    }
                  >
                    + Adicionar telefone
                  </button>
                </div>

                <div className="editar-lista">

                  {telefones.length === 0 ? (
                    <div className="editar-vazio">
                      <strong>
                        Nenhum telefone cadastrado
                      </strong>

                      <p>
                        Clique em "Adicionar telefone"
                        para incluir um contato.
                      </p>
                    </div>
                  ) : (
                    telefones.map(
                      (telefone, index) => (
                        <div
                          className="editar-item"
                          key={
                            telefone.id ||
                            `novo-${index}`
                          }
                        >
                          <div className="editar-item-header">
                            <strong>
                              Telefone {index + 1}
                            </strong>

                            <button
                              type="button"
                              className="editar-remover-mobile"
                              onClick={() =>
                                removerTelefone(
                                  index
                                )
                              }
                            >
                              Remover
                            </button>
                          </div>

                          <div className="editar-telefone-fields">

                            <div className="editar-form-group">
                              <label>
                                Número
                              </label>

                              <input
                                type="text"
                                value={formatarTelefone(
                                  telefone.numero
                                )}
                                onChange={(event) =>
                                  alterarTelefone(
                                    index,
                                    "numero",
                                    limparTelefone(
                                      event.target.value
                                    )
                                  )
                                }
                                placeholder="(61) 99999-9999"
                                inputMode="numeric"
                                maxLength={15}
                              />
                            </div>

                            <div className="editar-form-group">
                              <label>
                                Tipo
                              </label>

                              <select
                                value={
                                  telefone.tipo ||
                                  "PESSOAL"
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
                              className="editar-remover"
                              onClick={() =>
                                removerTelefone(
                                  index
                                )
                              }
                            >
                              Remover
                            </button>

                          </div>
                        </div>
                      )
                    )
                  )}

                </div>
              </section>

              <div className="editar-actions">

                <button
                  type="button"
                  className="editar-button-secondary"
                  onClick={etapaAnterior}
                  disabled={salvando}
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  className="editar-button-primary"
                  onClick={proximaEtapa}
                  disabled={salvando}
                >
                  Próximo
                  <span>→</span>
                </button>

              </div>

            </section>
          )}

          {/* ETAPA 3 */}

          {etapaAtual === 3 && (
            <section className="editar-etapa">

              <div className="editar-etapa-header">
                <span className="editar-etapa-numero-label">
                  Etapa 03
                </span>

                <h2>Endereço</h2>

                <p>
                  Atualize o endereço residencial
                  vinculado à pessoa.
                </p>
              </div>

              <section className="editar-section">

                <div className="editar-form-group">
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

                <div className="editar-form-row">

                  <div className="editar-form-group">
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

                  <div className="editar-form-group">
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

                <div className="editar-form-row">

                  <div className="editar-form-group">
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

                  <div className="editar-form-group">
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

                <div className="editar-form-group">
                  <label htmlFor="cep">
                    CEP
                  </label>

                  <input
                    id="cep"
                    type="text"
                    value={formatarCEP(cep)}
                    onChange={(event) =>
                      setCep(
                        limparCEP(
                          event.target.value
                        )
                      )
                    }
                    maxLength={9}
                    inputMode="numeric"
                    placeholder="Digite o CEP"
                  />

                  <span className="editar-form-help">
                    Informe o CEP no formato
                    00000-000.
                  </span>
                </div>

              </section>

              <div className="editar-actions">

                <button
                  type="button"
                  className="editar-button-secondary"
                  onClick={etapaAnterior}
                  disabled={salvando}
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  className="editar-button-primary"
                  onClick={proximaEtapa}
                  disabled={salvando}
                >
                  Próximo
                  <span>→</span>
                </button>

              </div>

            </section>
          )}

          {/* ETAPA 4 */}

          {etapaAtual === 4 && (
            <section className="editar-etapa">

              <div className="editar-etapa-header">
                <span className="editar-etapa-numero-label">
                  Etapa 04
                </span>

                <h2>Passagens criminais</h2>

                <p>
                  Gerencie os registros vinculados
                  à pessoa.
                </p>
              </div>

              <section className="editar-section">

                <div className="editar-section-header">
                  <div>
                    <h3>
                      Registros cadastrados
                    </h3>

                    <p>
                      Edite, remova ou adicione
                      uma nova passagem.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="editar-adicionar"
                    onClick={
                      adicionarPassagem
                    }
                  >
                    + Adicionar passagem
                  </button>
                </div>

                <div className="editar-lista">

                  {passagens.length === 0 ? (
                    <div className="editar-vazio">
                      <strong>
                        Nenhuma passagem criminal
                        cadastrada
                      </strong>

                      <p>
                        Clique em "Adicionar passagem"
                        para incluir um registro.
                      </p>
                    </div>
                  ) : (
                    passagens.map(
                      (passagem, index) => (
                        <div
                          className="editar-item"
                          key={
                            passagem.id ||
                            `nova-passagem-${index}`
                          }
                        >
                          <div className="editar-item-header">
                            <strong>
                              Passagem {index + 1}
                            </strong>

                            <button
                              type="button"
                              className="editar-remover-mobile"
                              onClick={() =>
                                removerPassagem(
                                  index
                                )
                              }
                            >
                              Remover
                            </button>
                          </div>

                          <div className="editar-passagem-fields">

                            <div className="editar-form-group">
                              <label>
                                Crime
                              </label>

                              <input
                                type="text"
                                value={
                                  passagem.crime ||
                                  ""
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

                            <div className="editar-form-group">
                              <label>
                                Data da ocorrência
                              </label>

                              <input
                                type="date"
                                value={
                                  passagem.data_ocorrencia ||
                                  ""
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
                              className="editar-remover"
                              onClick={() =>
                                removerPassagem(
                                  index
                                )
                              }
                            >
                              Remover
                            </button>

                          </div>
                        </div>
                      )
                    )
                  )}

                </div>

              </section>

              <div className="editar-actions">

                <button
                  type="button"
                  className="editar-button-secondary"
                  onClick={etapaAnterior}
                  disabled={salvando}
                >
                  ← Voltar
                </button>

                <button
                  type="button"
                  className="editar-button-primary"
                  onClick={proximaEtapa}
                  disabled={salvando}
                >
                  Revisar alterações
                  <span>→</span>
                </button>

              </div>

            </section>
          )}

          {/* ETAPA 5 - REVISÃO */}

          {etapaAtual === 5 && (
            <section className="editar-etapa">

              <div className="editar-etapa-header">
                <span className="editar-etapa-numero-label">
                  Etapa 05
                </span>

                <h2>Revisão</h2>

                <p>
                  Confira as informações antes de
                  salvar as alterações.
                </p>
              </div>

              {/* DADOS PESSOAIS */}

              <div className="editar-revisao-section">

                <div className="editar-revisao-header">
                  <div>
                    <span>
                      Identificação
                    </span>

                    <h3>
                      Dados pessoais
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      irParaEtapa(1)
                    }
                    disabled={salvando}
                  >
                    Editar
                  </button>
                </div>

                <div className="editar-revisao-identificacao">

                  <div className="editar-revisao-foto">
                    {fotoUrl ? (
                      <img
                        src={fotoUrl}
                        alt={`Foto de ${nome}`}
                      />
                    ) : (
                      <span>
                        Sem foto
                      </span>
                    )}
                  </div>

                  <div className="editar-revisao-grid">

                    <div>
                      <small>Nome</small>
                      <strong>
                        {nome || "—"}
                      </strong>
                    </div>

                    <div>
                      <small>CPF</small>
                      <strong>
                        {formatarCPF(cpf) || "—"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Data de nascimento
                      </small>

                      <strong>
                        {dataNascimento
                          ? dataNascimento
                              .split("-")
                              .reverse()
                              .join("/")
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <small>Sexo</small>

                      <strong>
                        {sexo === "M"
                          ? "Masculino"
                          : sexo === "F"
                          ? "Feminino"
                          : "—"}
                      </strong>
                    </div>

                    <div>
                      <small>Nome da mãe</small>

                      <strong>
                        {nomeMae || "—"}
                      </strong>
                    </div>

                    <div>
                      <small>Nome do pai</small>

                      <strong>
                        {nomePai || "—"}
                      </strong>
                    </div>

                  </div>
                </div>
              </div>

              {/* TELEFONES */}

              <div className="editar-revisao-section">

                <div className="editar-revisao-header">
                  <div>
                    <span>
                      Contatos
                    </span>

                    <h3>
                      Telefones
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      irParaEtapa(2)
                    }
                    disabled={salvando}
                  >
                    Editar
                  </button>
                </div>

                {telefones.filter(
                  (telefone) =>
                    telefone.numero
                ).length > 0 ? (
                  <div className="editar-revisao-lista">
                    {telefones
                      .filter(
                        (telefone) =>
                          telefone.numero
                      )
                      .map(
                        (
                          telefone,
                          index
                        ) => (
                          <div
                            className="editar-revisao-item"
                            key={
                              telefone.id ||
                              `telefone-revisao-${index}`
                            }
                          >
                            <strong>
                              {formatarTelefone(
                                telefone.numero
                              )}
                            </strong>

                            <span>
                              {telefone.tipo ===
                              "RESIDENCIAL"
                                ? "Residencial"
                                : "Pessoal"}
                            </span>
                          </div>
                        )
                      )}
                  </div>
                ) : (
                  <p className="editar-revisao-vazio">
                    Nenhum telefone cadastrado.
                  </p>
                )}

              </div>

              {/* ENDEREÇO */}

              <div className="editar-revisao-section">

                <div className="editar-revisao-header">
                  <div>
                    <span>
                      Localização
                    </span>

                    <h3>
                      Endereço
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      irParaEtapa(3)
                    }
                    disabled={salvando}
                  >
                    Editar
                  </button>
                </div>

                {logradouro ||
                numero ||
                bairro ||
                cidade ||
                estado ||
                cep ? (
                  <div className="editar-revisao-grid">

                    <div className="editar-revisao-endereco-completo">
                      <small>
                        Endereço
                      </small>

                      <strong>
                        {logradouro || "—"}
                        {numero
                          ? `, ${numero}`
                          : ""}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Bairro
                      </small>

                      <strong>
                        {bairro || "—"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Cidade
                      </small>

                      <strong>
                        {cidade || "—"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        Estado
                      </small>

                      <strong>
                        {estado || "—"}
                      </strong>
                    </div>

                    <div>
                      <small>
                        CEP
                      </small>

                      <strong>
                        {formatarCEP(cep) ||
                          "—"}
                      </strong>
                    </div>

                  </div>
                ) : (
                  <p className="editar-revisao-vazio">
                    Nenhum endereço cadastrado.
                  </p>
                )}

              </div>

              {/* PASSAGENS */}

              <div className="editar-revisao-section editar-revisao-passagens">

                <div className="editar-revisao-header">
                  <div>
                    <span>
                      Registros
                    </span>

                    <h3>
                      Passagens criminais
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      irParaEtapa(4)
                    }
                    disabled={salvando}
                  >
                    Editar
                  </button>
                </div>

                {passagens.filter(
                  (passagem) =>
                    passagem.crime &&
                    passagem.data_ocorrencia
                ).length > 0 ? (
                  <div className="editar-revisao-lista">

                    {passagens
                      .filter(
                        (passagem) =>
                          passagem.crime &&
                          passagem.data_ocorrencia
                      )
                      .map(
                        (
                          passagem,
                          index
                        ) => (
                          <div
                            className="editar-revisao-item"
                            key={
                              passagem.id ||
                              `passagem-revisao-${index}`
                            }
                          >
                            <strong>
                              {passagem.crime}
                            </strong>

                            <span>
                              {passagem.data_ocorrencia
                                .split("-")
                                .reverse()
                                .join("/")}
                            </span>
                          </div>
                        )
                      )}

                  </div>
                ) : (
                  <p className="editar-revisao-vazio">
                    Nenhuma passagem criminal
                    cadastrada.
                  </p>
                )}

              </div>

              {/* AÇÕES FINAIS */}

              <div className="editar-actions editar-actions-final">

                <button
                  type="button"
                  className="editar-button-secondary"
                  onClick={etapaAnterior}
                  disabled={salvando}
                >
                  ← Voltar
                </button>

                <button
                  type="submit"
                  className="editar-button-primary"
                  disabled={salvando}
                >
                  {salvando
                    ? "Salvando..."
                    : "Salvar alterações"}
                </button>

              </div>

            </section>
          )}

        </form>
      </div>
    </div>
  );
}

export default EditarPessoa;