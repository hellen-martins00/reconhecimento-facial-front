import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import { formatarCPF, limparCPF, } from "../../../utils/formatarCPF";

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

  // REGISTROS DE DESAPARECIMENTO
  const [registrosDesaparecimento, setRegistrosDesaparecimento] = useState([]);

  // FOTO
  const [fotoUrl, setFotoUrl] = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);

  // ESTADOS
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [erroDataNascimento, setErroDataNascimento] = useState("");

  const erroRef = useRef(null);

  function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  // ETAPAS
  const etapas = [
    {
      numero: 1,
      titulo: "Dados pessoais",
      descricao: "Identificação",
    },
    {
      numero: 2,
      titulo: "Desaparecimentos",
      descricao: "Registros",
    },
    {
      numero: 3,
      titulo: "Revisão",
      descricao: "Confirmar",
    },
  ];

  function formatarErroApi(error) {
    const detalhe = error.response?.data?.detail;

    if (Array.isArray(detalhe)) {
      return detalhe
        .map((item) => {
          const campo =
            Array.isArray(item.loc)
              ? item.loc[item.loc.length - 1]
              : "";

          const mensagens = {
            data_nascimento:
              "A data de nascimento não pode ser futura.",

            cpf:
              "Informe um CPF válido.",

            nome:
              "Informe um nome válido.",

            sexo:
              "Selecione o sexo.",
          };

          return (
            mensagens[campo] ||
            item.msg?.replace(/^Value error,?\s*/i, "") ||
            "Verifique os dados informados."
          );
        })
        .join(" ");
    }

    if (typeof detalhe === "string") {
      return detalhe.replace(
        /^Value error,?\s*/i,
        ""
      );
    }

    return "Não foi possível atualizar a pessoa. Verifique os dados informados.";
  }

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

      // REGISTROS DE DESAPARECIMENTO
      try {
        const respostaRegistros = await api.get(
          `/desaparecimentos/pessoa/${id}`
        );

        setRegistrosDesaparecimento(
          Array.isArray(respostaRegistros.data)
            ? respostaRegistros.data.map((registro) => ({
              ...registro,
              novo: false,
            }))
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar registros de desaparecimento:",
          error
        );

        setRegistrosDesaparecimento([]);
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

  useEffect(() => {
    if (!erro) {
      return;
    }

    const timer = setTimeout(() => {
      if (erroRef.current) {
        erroRef.current.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [erro]);

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

  // REGISTROS DE DESAPARECIMENTO
  function adicionarRegistroDesaparecimento() {
    setRegistrosDesaparecimento([
      ...registrosDesaparecimento,
      {
        data_desaparecimento: "",
        local_desaparecimento: "",
        descricao: "",
        novo: true,
      },
    ]);
  }

  function alterarRegistroDesaparecimento(index, campo, valor) {
    const novosRegistros = [...registrosDesaparecimento];

    novosRegistros[index] = {
      ...novosRegistros[index],
      [campo]: valor,
    };

    setRegistrosDesaparecimento(novosRegistros);
  }

  async function removerRegistroDesaparecimento(index) {
    const registro = registrosDesaparecimento[index];

    if (registro.id) {
      try {
        await api.delete(`/desaparecimentos/${registro.id}`);
      } catch (error) {
        console.error(
          "Erro ao remover registro de desaparecimento:",
          error
        );

        setErro("Não foi possível remover o registro de desaparecimento.");
        return;
      }
    }

    setRegistrosDesaparecimento(
      registrosDesaparecimento.filter(
        (_, registroIndex) => registroIndex !== index
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

      if (nome.trim().length > 150) {
        setErro("O nome deve ter no máximo 150 caracteres.");
        return false;
      }

      if (!cpf.trim()) {
        setErro("Informe o CPF.");
        return false;
      }

      const cpfLimpo = limparCPF(cpf);

      if (cpfLimpo.length !== 11) {
        setErro("Informe um CPF válido com 11 números.");
        return false;
      }

      if (!dataNascimento) {
        setErroDataNascimento("Informe a data de nascimento.");
        return false;
      }

      if (dataNascimento > obterDataHoje()) {
        setErroDataNascimento("A data de nascimento não pode ser futura.");
        return false;
      }

      setErroDataNascimento("");

      if (!sexo) {
        setErro("Selecione o sexo.");
        return false;
      }
    }

    if (etapa === 2) {
      const registroInvalido = registrosDesaparecimento.some(
        (registro) => {
          const data = registro.data_desaparecimento || "";
          const local = registro.local_desaparecimento?.trim() || "";
          const descricao = registro.descricao?.trim() || "";

          const preenchido = data || local || descricao;

          if (!preenchido) {
            return false;
          }

          return (
            !data ||
            !local ||
            !descricao ||
            data > obterDataHoje()
          );
        }
      );

      if (registroInvalido) {
        setErro(
          "Preencha a data, o local e a descrição de todos os registros. A data não pode ser futura."
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
      Math.min(atual + 1, 3)
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

    if (!validarEtapa(2)) {
      setEtapaAtual(2);
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
      });

      // NOVOS REGISTROS DE DESAPARECIMENTO
      const novosRegistros = registrosDesaparecimento.filter(
        (registro) =>
          registro.novo &&
          registro.data_desaparecimento &&
          registro.local_desaparecimento?.trim() &&
          registro.descricao?.trim()
      );

      await Promise.all(
        novosRegistros.map((registro) =>
          api.post("/desaparecimentos", {
            pessoa_id: id,
            data_desaparecimento: registro.data_desaparecimento,
            local_desaparecimento: registro.local_desaparecimento.trim(),
            descricao: registro.descricao.trim(),
          })
        )
      );

      // ATUALIZAR REGISTROS EXISTENTES
      const registrosExistentes = registrosDesaparecimento.filter(
        (registro) =>
          registro.id &&
          !registro.novo &&
          registro.data_desaparecimento &&
          registro.local_desaparecimento?.trim() &&
          registro.descricao?.trim()
      );

      await Promise.all(
        registrosExistentes.map((registro) =>
          api.put(`/desaparecimentos/${registro.id}`, {
            data_desaparecimento: registro.data_desaparecimento,
            local_desaparecimento: registro.local_desaparecimento.trim(),
            descricao: registro.descricao.trim(),
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
      navigate("/pessoas");

    } catch (error) {
      console.error(
        "Erro ao atualizar pessoa:",
        error
      );

      console.error(
        "Resposta da API:",
        error.response?.data
      );

      setErro(formatarErroApi(error));

      // Garante que o usuário veja o erro
      // mesmo estando no final da página.
      window.scrollTo({ top: 0, behavior: "smooth", });
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
              className={`editar-step ${atual
                ? "editar-step-atual"
                : ""
                } ${concluida
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
          <div
            ref={erroRef}
            className="editar-error"
          >
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

                <div className="editar-form-row">

                  <div className="editar-form-group">
                    <label htmlFor="dataNascimento">
                      Data de nascimento <span>*</span>
                    </label>

                    <input
                      id="dataNascimento"
                      type="date"
                      value={dataNascimento}
                      max={obterDataHoje()}
                      className={
                        erroDataNascimento
                          ? "editar-input-erro"
                          : ""
                      }
                      onChange={(event) => {
                        setDataNascimento(event.target.value);
                        setErroDataNascimento("");
                      }}
                      required
                    />

                    {erroDataNascimento && (
                      <span className="editar-form-error">
                        {erroDataNascimento}
                      </span>
                    )}
                  </div>

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

          {/* ETAPA 02 - REGISTROS DE DESAPARECIMENTO */}

          {etapaAtual === 2 && (
            <section className="editar-etapa">
              <div className="editar-etapa-header">
                <span className="editar-etapa-numero-label">
                  Etapa 02
                </span>

                <h2>Registros de desaparecimento</h2>

                <p>
                  Gerencie os registros de desaparecimento vinculados à pessoa.
                </p>
              </div>

              <section className="editar-section">
                <div className="editar-section-header">
                  <div>
                    <h3>Registros cadastrados</h3>

                    <p>
                      Edite, remova ou adicione registros de desaparecimento.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="editar-adicionar"
                    onClick={adicionarRegistroDesaparecimento}
                    disabled={salvando}
                  >
                    + Adicionar registro
                  </button>
                </div>

                <div className="editar-lista">
                  {registrosDesaparecimento.length === 0 ? (
                    <div className="editar-vazio">
                      <strong>Nenhum registro de desaparecimento cadastrado</strong>

                      <p>
                        Clique em "Adicionar registro" para incluir um registro.
                      </p>
                    </div>
                  ) : (
                    registrosDesaparecimento.map((registro, index) => (
                      <div
                        className="editar-item"
                        key={registro.id || `novo-registro-${index}`}
                      >
                        <div className="editar-item-header">
                          <strong>Registro {index + 1}</strong>

                          <button
                            type="button"
                            className="editar-remover-mobile"
                            onClick={() =>
                              removerRegistroDesaparecimento(index)
                            }
                            disabled={salvando}
                          >
                            Remover
                          </button>
                        </div>

                        <div className="editar-desaparecimento-fields">
                          <div className="editar-form-group">
                            <label>Data do desaparecimento</label>

                            <input
                              type="date"
                              value={registro.data_desaparecimento || ""}
                              max={obterDataHoje()}
                              onChange={(event) =>
                                alterarRegistroDesaparecimento(
                                  index,
                                  "data_desaparecimento",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          <div className="editar-form-group">
                            <label>Local do desaparecimento</label>

                            <input
                              type="text"
                              value={registro.local_desaparecimento || ""}
                              maxLength={200}
                              placeholder="Informe o local"
                              onChange={(event) =>
                                alterarRegistroDesaparecimento(
                                  index,
                                  "local_desaparecimento",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          <div className="editar-form-group">
                            <label>Descrição</label>

                            <textarea
                              value={registro.descricao || ""}
                              maxLength={500}
                              rows={3}
                              placeholder="Descreva as informações do desaparecimento"
                              onChange={(event) =>
                                alterarRegistroDesaparecimento(
                                  index,
                                  "descricao",
                                  event.target.value
                                )
                              }
                            />
                          </div>

                          <button
                            type="button"
                            className="editar-remover"
                            onClick={() =>
                              removerRegistroDesaparecimento(index)
                            }
                            disabled={salvando}
                          >
                            Remover
                          </button>
                        </div>
                      </div>
                    ))
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

          {/* ETAPA 03 - REVISÃO */}
          {etapaAtual === 3 && (
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
                  </div>
                </div>
              </div>

              {/* REGISTROS DE DESAPARECIMENTO */}

              <div className="editar-revisao-section editar-revisao-desaparecimento">
                <div className="editar-revisao-header">
                  <div>
                    <span>Registros</span>

                    <h3>Desaparecimentos</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => irParaEtapa(2)}
                    disabled={salvando}
                  >
                    Editar
                  </button>
                </div>

                {registrosDesaparecimento.some(
                  (registro) =>
                    registro.data_desaparecimento ||
                    registro.local_desaparecimento ||
                    registro.descricao
                ) ? (
                  <div className="editar-revisao-lista">
                    {registrosDesaparecimento
                      .filter(
                        (registro) =>
                          registro.data_desaparecimento ||
                          registro.local_desaparecimento ||
                          registro.descricao
                      )
                      .map((registro, index) => (
                        <div
                          className="editar-revisao-item"
                          key={registro.id || `registro-revisao-${index}`}
                        >
                          <strong>
                            {registro.local_desaparecimento || "Local não informado"}
                          </strong>

                          <span>
                            {registro.data_desaparecimento
                              ? registro.data_desaparecimento
                                .split("-")
                                .reverse()
                                .join("/")
                              : "Data não informada"}
                          </span>

                          <p>{registro.descricao || "Sem descrição"}</p>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="editar-revisao-vazio">
                    Nenhum registro de desaparecimento cadastrado.
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