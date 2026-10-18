
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../../services/api";
import { formatarCPF, limparCPF, validarCPF } from "../../../utils/formatarCPF";
import "./CadastroPessoa.css";

const ETAPAS = [
  {
    numero: 1,
    titulo: "Identificação",
    descricao: "Dados pessoais",
  },
  {
    numero: 2,
    titulo: "Desaparecimento",
    descricao: "Registro opcional",
  },
  {
    numero: 3,
    titulo: "Revisão",
    descricao: "Conferência",
  },
];

function obterDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterMensagemErroApi(erro) {
  const detalhe = erro?.response?.data?.detail;

  if (typeof detalhe === "string") {
    return detalhe;
  }

  if (Array.isArray(detalhe)) {
    return detalhe
      .map((item) => item.msg || "Verifique os dados informados.")
      .join(" ");
  }

  return "Não foi possível concluir a operação. Tente novamente.";
}

function CadastroPessoa() {
  const navigate = useNavigate();

  const [etapaAtual, setEtapaAtual] = useState(1);

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");

  const [registros, setRegistros] = useState([
    {
      data_desaparecimento: "",
      local_desaparecimento: "",
      descricao: "",
    },
  ]);

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const registroPreenchido = (registro) =>
    Boolean(
      registro.data_desaparecimento ||
      registro.local_desaparecimento.trim() ||
      registro.descricao.trim()
    );

  function atualizarRegistro(index, campo, valor) {
    setRegistros((atuais) =>
      atuais.map((registro, i) =>
        i === index
          ? { ...registro, [campo]: valor }
          : registro
      )
    );
  }

  function adicionarRegistro() {
    setRegistros((atuais) => [
      ...atuais,
      {
        data_desaparecimento: "",
        local_desaparecimento: "",
        descricao: "",
      },
    ]);
  }

  function removerRegistro(index) {
    setRegistros((atuais) =>
      atuais.filter((_, i) => i !== index)
    );
  }

  async function validarIdentificacao() {
    const nomeLimpo = nome.trim();
    const cpfLimpo = limparCPF(cpf);

    if (nomeLimpo.length < 3 || nomeLimpo.length > 150) {
      setErro("O nome deve ter entre 3 e 150 caracteres.");
      return false;
    }

    if (cpfLimpo && !validarCPF(cpfLimpo)) {
      setErro("Informe um CPF válido ou deixe o campo vazio.");
      return false;
    }

    if (dataNascimento && dataNascimento > obterDataHoje()) {
      setErro("A data de nascimento não pode ser futura.");
      return false;
    }

    if (cpfLimpo) {
      try {
        await api.get(`/pessoas/verificar-cpf/${cpfLimpo}`);
      } catch (error) {
        setErro(obterMensagemErroApi(error));
        return false;
      }
    }

    return true;
  }

  function validarRegistros() {
    for (let i = 0; i < registros.length; i += 1) {
      const registro = registros[i];

      if (!registroPreenchido(registro)) {
        continue;
      }

      if (!registro.data_desaparecimento) {
        setErro(
          `Informe a data do desaparecimento no registro ${i + 1}.`
        );
        return false;
      }

      if (registro.data_desaparecimento > obterDataHoje()) {
        setErro(
          `A data do desaparecimento no registro ${i + 1} não pode ser futura.`
        );
        return false;
      }

      const local = registro.local_desaparecimento.trim();
      const descricao = registro.descricao.trim();

      if (local.length < 3 || local.length > 200) {
        setErro(
          `O local do registro ${i + 1} deve ter entre 3 e 200 caracteres.`
        );
        return false;
      }

      if (descricao.length < 3 || descricao.length > 500) {
        setErro(
          `A descrição do registro ${i + 1} deve ter entre 3 e 500 caracteres.`
        );
        return false;
      }
    }

    return true;
  }

  async function avancarEtapa() {
    setErro("");

    if (etapaAtual === 1) {
      const valido = await validarIdentificacao();

      if (!valido) {
        return;
      }
    }

    if (etapaAtual === 2 && !validarRegistros()) {
      return;
    }

    setEtapaAtual((atual) => Math.min(atual + 1, 3));
  }

  function voltarEtapa() {
    setErro("");
    setEtapaAtual((atual) => Math.max(atual - 1, 1));
  }

  function irParaEtapa(numero) {
    if (numero < etapaAtual) {
      setErro("");
      setEtapaAtual(numero);
    }
  }

  async function handleSubmit(event) {
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    setErro("");

    if (carregando || etapaAtual !== 3) {
      return;
    }

    const identificacaoValida = await validarIdentificacao();

    if (!identificacaoValida || !validarRegistros()) {
      setEtapaAtual(identificacaoValida ? 2 : 1);
      return;
    }

    setCarregando(true);

    let pessoaCriada = null;

    try {
      const dadosPessoa = {
        nome: nome.trim(),
      };

      const cpfLimpo = limparCPF(cpf);

      if (cpfLimpo) {
        dadosPessoa.cpf = cpfLimpo;
      }

      if (dataNascimento) {
        dadosPessoa.data_nascimento = dataNascimento;
      }

      if (sexo) {
        dadosPessoa.sexo = sexo;
      }

      const respostaPessoa = await api.post(
        "/pessoas",
        dadosPessoa
      );

      pessoaCriada = respostaPessoa.data;

      const registrosValidos = registros.filter(
        registroPreenchido
      );

      for (const registro of registrosValidos) {
        await api.post("/desaparecimentos", {
          pessoa_id: pessoaCriada.id,
          data_desaparecimento:
            registro.data_desaparecimento,
          local_desaparecimento:
            registro.local_desaparecimento.trim(),
          descricao: registro.descricao.trim(),
          status: "DESAPARECIDO",
        });
      }

      navigate("/pessoas", {
        state: {
          sucesso: registrosValidos.length
            ? "Pessoa e registro(s) de desaparecimento cadastrados com sucesso."
            : "Pessoa cadastrada com sucesso.",
        },
      });
    } catch (error) {
      const mensagem = obterMensagemErroApi(error);

      if (pessoaCriada) {
        navigate("/pessoas", {
          state: {
            erro:
              "A pessoa foi cadastrada, mas houve uma falha ao salvar um registro de desaparecimento. Verifique os registros da pessoa antes de tentar novamente. Detalhe: " +
              mensagem,
          },
        });
        return;
      }

      setErro(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cadastro-pessoa-page">
      <header className="cadastro-pessoa-header">
        <div>
          <h1>Cadastrar pessoa</h1>
          <p>
            Cadastre os dados disponíveis para apoiar a
            identificação de pessoas desaparecidas.
          </p>
        </div>

        <button
          type="button"
          className="cadastro-voltar"
          onClick={() => navigate("/pessoas")}
        >
          Voltar para pessoas
        </button>
      </header>

      <nav
        className="cadastro-stepper"
        aria-label="Etapas do cadastro"
      >
        {ETAPAS.map((etapa, index) => {
          const concluida = etapa.numero < etapaAtual;
          const atual = etapa.numero === etapaAtual;

          return (
            <div
              key={etapa.numero}
              className={[
                "cadastro-step",
                atual ? "cadastro-step-atual" : "",
                concluida ? "cadastro-step-concluida" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <button
                type="button"
                className="cadastro-step-button"
                disabled={!concluida}
                onClick={() => irParaEtapa(etapa.numero)}
                aria-current={atual ? "step" : undefined}
              >
                <span className="cadastro-step-numero">
                  {concluida ? "✓" : etapa.numero}
                </span>

                <span className="cadastro-step-info">
                  <strong>{etapa.titulo}</strong>
                  <small>{etapa.descricao}</small>
                </span>
              </button>

              {index < ETAPAS.length - 1 && (
                <span className="cadastro-step-linha" />
              )}
            </div>
          );
        })}
      </nav>

      <form
        className="cadastro-pessoa-card"
        onSubmit={(event) => {
          // Previne qualquer submissão automática do formulário via Enter/Navegador
          event.preventDefault();
        }}
        noValidate
      >
        {erro && (
          <div className="cadastro-error" role="alert">
            {erro}
          </div>
        )}

        {etapaAtual === 1 && (
          <section className="cadastro-etapa">
            <div className="cadastro-etapa-header">
              <span className="cadastro-etapa-numero-label">
                ETAPA 1 DE 3
              </span>
              <h2>Identificação da pessoa</h2>
              <p>
                Informe o nome e, se disponíveis, os demais
                dados pessoais. Somente o nome é obrigatório.
              </p>
            </div>

            <div className="cadastro-form-group">
              <label htmlFor="nome">
                Nome completo <span>*</span>
              </label>
              <input
                id="nome"
                name="nome"
                type="text"
                autoComplete="name"
                maxLength={150}
                placeholder="Digite o nome completo"
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                required
              />
            </div>

            <div className="cadastro-form-group campo-cpf">
              <label htmlFor="cpf">CPF</label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="000.000.000-00"
                maxLength={14}
                value={cpf}
                onChange={(event) =>
                  setCpf(formatarCPF(event.target.value))
                }
              />
              <small className="cadastro-campo-erro">
                Campo opcional. Se informado, o CPF será verificado.
              </small>
            </div>

            <div className="cadastro-form-row">
              <div className="cadastro-form-group">
                <label htmlFor="dataNascimento">
                  Data de nascimento
                </label>
                <input
                  id="dataNascimento"
                  name="dataNascimento"
                  type="date"
                  max={obterDataHoje()}
                  value={dataNascimento}
                  onChange={(event) =>
                    setDataNascimento(event.target.value)
                  }
                />
              </div>

              <div className="cadastro-form-group">
                <label htmlFor="sexo">Sexo</label>
                <select
                  id="sexo"
                  name="sexo"
                  value={sexo}
                  onChange={(event) => setSexo(event.target.value)}
                >
                  <option value="">Não informado</option>
                  <option value="F">Feminino</option>
                  <option value="M">Masculino</option>
                </select>
              </div>
            </div>
          </section>
        )}

        {etapaAtual === 2 && (
          <section className="cadastro-etapa">
            <div className="cadastro-etapa-header">
              <span className="cadastro-etapa-numero-label">
                ETAPA 2 DE 3
              </span>
              <h2>Registro de desaparecimento</h2>
              <p>
                Se a pessoa estiver desaparecida, registre as
                informações disponíveis. Esta etapa é opcional.
              </p>
            </div>

            <div className="cadastro-section">
              {registros.map((registro, index) => (
                <div className="cadastro-item" key={index}>
                  <div className="cadastro-item-header">
                    <strong>
                      Registro {index + 1}
                    </strong>

                    {registros.length > 1 && (
                      <button
                        type="button"
                        className="cadastro-remover"
                        onClick={() => removerRegistro(index)}
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="cadastro-form-group">
                    <label htmlFor={`data-desaparecimento-${index}`}>
                      Data do desaparecimento
                    </label>
                    <input
                      id={`data-desaparecimento-${index}`}
                      type="date"
                      max={obterDataHoje()}
                      value={registro.data_desaparecimento}
                      onChange={(event) =>
                        atualizarRegistro(
                          index,
                          "data_desaparecimento",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="cadastro-form-group">
                    <label htmlFor={`local-desaparecimento-${index}`}>
                      Local do desaparecimento
                    </label>
                    <input
                      id={`local-desaparecimento-${index}`}
                      type="text"
                      maxLength={200}
                      placeholder="Ex.: Rodoviária de Brasília"
                      value={registro.local_desaparecimento}
                      onChange={(event) =>
                        atualizarRegistro(
                          index,
                          "local_desaparecimento",
                          event.target.value
                        )
                      }
                    />
                  </div>

                  <div className="cadastro-form-group">
                    <label htmlFor={`descricao-desaparecimento-${index}`}>
                      Descrição
                    </label>
                    <textarea
                      id={`descricao-desaparecimento-${index}`}
                      maxLength={500}
                      placeholder="Descreva as circunstâncias e outras informações relevantes."
                      value={registro.descricao}
                      onChange={(event) =>
                        atualizarRegistro(
                          index,
                          "descricao",
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="cadastro-adicionar"
              onClick={adicionarRegistro}
            >
              + Adicionar outro registro
            </button>

            <p className="cadastro-revisao-vazio">
              Se não houver informações sobre desaparecimento,
              deixe os campos vazios e continue.
            </p>
          </section>
        )}

        {etapaAtual === 3 && (
          <section className="cadastro-etapa">
            <div className="cadastro-etapa-header">
              <span className="cadastro-etapa-numero-label">
                ETAPA 3 DE 3
              </span>
              <h2>Revise os dados</h2>
              <p>
                Confira as informações antes de concluir o cadastro.
              </p>
            </div>

            <div className="cadastro-revisao-section">
              <div className="cadastro-revisao-header">
                <div>
                  <span>IDENTIFICAÇÃO</span>
                  <h3>Dados pessoais</h3>
                </div>

                <button
                  type="button"
                  onClick={() => irParaEtapa(1)}
                >
                  Editar
                </button>
              </div>

              <div className="cadastro-revisao-grid">
                <div>
                  <small>Nome completo</small>
                  <strong>{nome.trim() || "Não informado"}</strong>
                </div>

                <div>
                  <small>CPF</small>
                  <strong>{cpf.trim() || "Não informado"}</strong>
                </div>

                <div>
                  <small>Data de nascimento</small>
                  <strong>{dataNascimento || "Não informado"}</strong>
                </div>

                <div>
                  <small>Sexo</small>
                  <strong>
                    {sexo === "F"
                      ? "Feminino"
                      : sexo === "M"
                        ? "Masculino"
                        : "Não informado"}
                  </strong>
                </div>
              </div>
            </div>

            <div className="cadastro-revisao-section">
              <div className="cadastro-revisao-header">
                <div>
                  <span>DESAPARECIMENTO</span>
                  <h3>Registros informados</h3>
                </div>

                <button
                  type="button"
                  onClick={() => irParaEtapa(2)}
                >
                  Editar
                </button>
              </div>

              {registros.filter(registroPreenchido).length === 0 ? (
                <p className="cadastro-revisao-vazio">
                  Nenhum registro de desaparecimento informado.
                </p>
              ) : (
                <div className="cadastro-section">
                  {registros
                    .filter(registroPreenchido)
                    .map((registro, index) => (
                      <div
                        className="cadastro-item"
                        key={index}
                      >
                        <div className="cadastro-revisao-grid">
                          <div>
                            <small>Data</small>
                            <strong>
                              {registro.data_desaparecimento}
                            </strong>
                          </div>

                          <div>
                            <small>Local</small>
                            <strong>
                              {registro.local_desaparecimento}
                            </strong>
                          </div>

                          <div>
                            <small>Descrição</small>
                            <strong>{registro.descricao}</strong>
                          </div>

                          <div>
                            <small>Status inicial</small>
                            <strong>Desaparecido</strong>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </section>
        )}

        <div className="cadastro-actions">
          <button
            type="button"
            className="button-secondary"
            onClick={() =>
              etapaAtual === 1
                ? navigate("/pessoas")
                : voltarEtapa()
            }
            disabled={carregando}
          >
            {etapaAtual === 1 ? "Cancelar" : "Voltar"}
          </button>

          {etapaAtual < 3 ? (
            <button
              type="button"
              className="button-primary"
              onClick={avancarEtapa}
              disabled={carregando}
            >
              Continuar
            </button>
          ) : (
            <button
              type="button"
              className="button-primary"
              disabled={carregando}
              onClick={(e) => {
                e.preventDefault();
                handleSubmit(e);
              }}
            >
              {carregando ? "Cadastrando..." : "Cadastrar pessoa"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default CadastroPessoa;
