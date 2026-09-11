import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import { formatarCPF, limparCPF } from "../../../utils/formatarCPF";
import { formatarCEP, limparCEP } from "../../../utils/formatarCEP";
import {
  formatarTelefone,
  limparTelefone,
} from "../../../utils/formatarTelefone";

import "./CadastroPessoa.css";

function CadastroPessoa() {
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
  const [telefones, setTelefones] = useState([
    {
      numero: "",
      tipo: "PESSOAL",
    },
  ]);

  // ENDEREÇO
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  // PASSAGENS CRIMINAIS
  const [passagens, setPassagens] = useState([]);

  // CONTROLE
  const [erro, setErro] = useState("");
  const [erroDataNascimento, setErroDataNascimento] = useState("");
  const [carregando, setCarregando] = useState(false);

  // CONFIGURAÇÃO DAS ETAPAS
  const etapas = [
    {
      numero: 1,
      titulo: "Identificação",
      descricao: "Dados pessoais",
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
      descricao: "Antecedentes",
    },
    {
      numero: 5,
      titulo: "Revisão",
      descricao: "Conferência",
    },
  ];

  // TELEFONES
  function adicionarTelefone() {
    setTelefones([
      ...telefones,
      {
        numero: "",
        tipo: "PESSOAL",
      },
    ]);
  }

  function removerTelefone(index) {
    setTelefones(
      telefones.filter(
        (_, telefoneIndex) => telefoneIndex !== index
      )
    );
  }

  function alterarTelefone(index, campo, valor) {
    const novosTelefones = [...telefones];

    if (campo === "numero") {
      novosTelefones[index][campo] = formatarTelefone(valor);
    } else {
      novosTelefones[index][campo] = valor;
    }

    setTelefones(novosTelefones);
  }

  // PASSAGENS
  function adicionarPassagem() {
    setPassagens([
      ...passagens,
      {
        crime: "",
        data_ocorrencia: "",
      },
    ]);
  }

  function removerPassagem(index) {
    setPassagens(
      passagens.filter(
        (_, passagemIndex) => passagemIndex !== index
      )
    );
  }

  function alterarPassagem(index, campo, valor) {
    const novasPassagens = [...passagens];

    novasPassagens[index][campo] = valor;

    setPassagens(novasPassagens);
  }

  function obterDataHoje() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, "0");
    const dia = String(hoje.getDate()).padStart(2, "0");

    return `${ano}-${mes}-${dia}`;
  }

  // VALIDAÇÃO DA ETAPA 1
  function validarIdentificacao() {
    if (!nome.trim()) {
      setErro("Informe o nome da pessoa.");
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
      setErroDataNascimento("A data de nascimento não pode ser futura.")
      return false;
    }
    setErroDataNascimento("");

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

    return true;
  }

  // VALIDAÇÃO DA ETAPA 2
  function validarTelefones() {
    const telefonesPreenchidos = telefones.filter(
      (telefone) => telefone.numero.trim() !== ""
    );

    /*
     * O backend atual permite cadastrar a pessoa sem telefone.
     * Por isso, não vamos obrigar o preenchimento de telefone.
     */

    for (const telefone of telefonesPreenchidos) {
      const numeroLimpo = limparTelefone(telefone.numero);

      if (
        numeroLimpo.length !== 10 &&
        numeroLimpo.length !== 11
      ) {
        setErro(
          "Informe um telefone válido com DDD."
        );

        return false;
      }
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 3
  function validarEndereco() {
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

    const cepLimpo = limparCEP(cep);

    if (cepLimpo.length !== 8) {
      setErro("Informe um CEP válido com 8 números.");
      return false;
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 4
  function validarPassagens() {
    for (const passagem of passagens) {
      const crimePreenchido = passagem.crime.trim() !== "";
      const dataPreenchida =
        passagem.data_ocorrencia !== "";

      /*
       * Se começou a preencher uma passagem,
       * os dois campos passam a ser obrigatórios.
       */

      if (crimePreenchido && !dataPreenchida) {
        setErro(
          "Informe a data da ocorrência da passagem criminal."
        );

        return false;
      }

      if (!crimePreenchido && dataPreenchida) {
        setErro(
          "Informe o crime da passagem criminal."
        );

        return false;
      }
    }

    return true;
  }

  // AVANÇAR ETAPA
  function avancarEtapa() {
    setErro("");

    let podeAvancar = true;

    if (etapaAtual === 1) {
      podeAvancar = validarIdentificacao();
    }

    if (etapaAtual === 2) {
      podeAvancar = validarTelefones();
    }

    if (etapaAtual === 3) {
      podeAvancar = validarEndereco();
    }

    if (etapaAtual === 4) {
      podeAvancar = validarPassagens();
    }

    if (!podeAvancar) {
      return;
    }

    setEtapaAtual((etapa) => etapa + 1);
  }

  // VOLTAR ETAPA
  function voltarEtapa() {
    setErro("");

    if (etapaAtual === 1) {
      navigate("/pessoas");
      return;
    }

    setEtapaAtual((etapa) => etapa - 1);
  }

  // IR DIRETAMENTE PARA UMA ETAPA
  function irParaEtapa(numeroEtapa) {
    /*
     * Só permitimos voltar para etapas já concluídas.
     * Isso evita pular etapas obrigatórias.
     */

    if (numeroEtapa < etapaAtual) {
      setErro("");
      setEtapaAtual(numeroEtapa);
    }
  }

  // CADASTRO FINAL
  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      // CRIA A PESSOA
      const respostaPessoa = await api.post("/pessoas", {
        nome,
        cpf: limparCPF(cpf),
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,
      });

      const pessoaCriada = respostaPessoa.data;

      // CRIA OS TELEFONES
      const telefonesValidos = telefones.filter(
        (telefone) =>
          telefone.numero.trim() !== ""
      );

      await Promise.all(
        telefonesValidos.map((telefone) =>
          api.post("/telefones", {
            pessoa_id: pessoaCriada.id,
            numero: limparTelefone(
              telefone.numero
            ),
            tipo: telefone.tipo,
          })
        )
      );

      // CRIA O ENDEREÇO
      await api.post("/enderecos", {
        pessoa_id: pessoaCriada.id,
        logradouro,
        numero,
        bairro,
        cidade,
        estado,
        cep: limparCEP(cep),
      });

      // CRIA AS PASSAGENS
      const passagensValidas = passagens.filter(
        (passagem) =>
          passagem.crime.trim() !== "" &&
          passagem.data_ocorrencia !== ""
      );

      await Promise.all(
        passagensValidas.map((passagem) =>
          api.post("/passagens", {
            pessoa_id: pessoaCriada.id,
            crime: passagem.crime,
            data_ocorrencia:
              passagem.data_ocorrencia,
          })
        )
      );

      // FINALIZA
      navigate("/pessoas", {
        state: {
          sucesso:
            "Pessoa cadastrada com sucesso!",
        },
      });
    } catch (error) {
      console.error(
        "ERRO COMPLETO:",
        error
      );

      console.error(
        "RESPOSTA DA API:",
        error.response?.data
      );

      const detalhe =
        error.response?.data?.detail;

      if (Array.isArray(detalhe)) {
        setErro(
          detalhe
            .map(
              (erro) =>
                `${erro.loc?.join(
                  " → "
                )}: ${erro.msg}`
            )
            .join(" | ")
        );
      } else if (
        typeof detalhe === "string"
      ) {
        setErro(detalhe);
      } else {
        setErro(
          "Não foi possível cadastrar a pessoa."
        );
      }

      /*
       * Caso aconteça algum erro no cadastro final,
       * continuamos na etapa de revisão para que o usuário
       * possa tentar novamente.
       */
    } finally {
      setCarregando(false);
    }
  }

  // RENDERIZAÇÃO
  return (
    <div className="cadastro-pessoa-page">

      {/* CABEÇALHO */}
      <div className="cadastro-pessoa-header">

        <div>
          <h1>Adicionar Pessoa</h1>

          <p>
            Cadastre os dados da pessoa no sistema.
          </p>
        </div>

        <button
          type="button"
          className="cadastro-voltar"
          onClick={() =>
            navigate("/pessoas")
          }
        >
          Voltar
        </button>

      </div>

      {/* STEPPER */}
      <div className="cadastro-stepper">

        {etapas.map((etapa, index) => {

          const concluida =
            etapa.numero < etapaAtual;

          const atual =
            etapa.numero === etapaAtual;

          return (
            <div
              key={etapa.numero}
              className={`cadastro-step ${atual
                ? "cadastro-step-atual"
                : ""
                } ${concluida
                  ? "cadastro-step-concluida"
                  : ""
                }`}
            >

              <button
                type="button"
                className="cadastro-step-button"
                onClick={() =>
                  irParaEtapa(
                    etapa.numero
                  )
                }
                disabled={
                  etapa.numero >=
                  etapaAtual
                }
              >
                <span className="cadastro-step-numero">

                  {concluida
                    ? "✓"
                    : etapa.numero}

                </span>

                <span className="cadastro-step-info">

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
                  <div className="cadastro-step-linha" />
                )}

            </div>
          );
        })}

      </div>

      {/* CARD PRINCIPAL */}
      <div className="cadastro-pessoa-card">

        {/* ERRO */}
        {erro && (
          <div className="cadastro-error">
            {erro}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          {/* ETAPA 1 - IDENTIFICAÇÃO */}
          {etapaAtual === 1 && (
            <section className="cadastro-etapa">

              <div className="cadastro-etapa-header">

                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 1 DE 5
                  </span>

                  <h2>
                    Dados de identificação
                  </h2>

                  <p>
                    Informe os dados pessoais da pessoa.
                  </p>
                </div>

              </div>

              <div className="cadastro-form-group">

                <label>
                  Nome completo
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={nome}
                  onChange={(event) =>
                    setNome(
                      event.target.value
                    )
                  }
                  placeholder="Digite o nome completo"
                />

              </div>

              <div className="cadastro-form-row">

                <div className="cadastro-form-group">

                  <label>
                    CPF
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    value={formatarCPF(cpf)}
                    onChange={(event) =>
                      setCpf(
                        limparCPF(
                          event.target.value
                        )
                      )
                    }
                    placeholder="000.000.000-00"
                    maxLength={14}
                  />

                </div>

                <div className="cadastro-form-group">
                  <label>
                    Data de nascimento
                    <span>*</span>
                  </label>

                  <input
                    type="date"
                    max={obterDataHoje}
                    value={dataNascimento}
                    onChange={(event) => {
                      setDataNascimento(event.target.value);
                      setErroDataNascimento("");
                    }}
                  />

                  {erroDataNascimento && (
                    <span className="cadastro-campo-erro">{erroDataNascimento}</span>
                  )}
                </div>

              </div>

              <div className="cadastro-form-group">

                <label>
                  Sexo
                  <span>*</span>
                </label>

                <select
                  value={sexo}
                  onChange={(event) =>
                    setSexo(
                      event.target.value
                    )
                  }
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

              <div className="cadastro-form-group">

                <label>
                  Nome da mãe
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={nomeMae}
                  onChange={(event) =>
                    setNomeMae(
                      event.target.value
                    )
                  }
                  placeholder="Digite o nome da mãe"
                />

              </div>

              <div className="cadastro-form-group">

                <label>
                  Nome do pai
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={nomePai}
                  onChange={(event) =>
                    setNomePai(
                      event.target.value
                    )
                  }
                  placeholder="Digite o nome do pai"
                />

              </div>

            </section>
          )}

          {/* ETAPA 2 - TELEFONES */}
          {etapaAtual === 2 && (
            <section className="cadastro-etapa">

              <div className="cadastro-etapa-header">

                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 2 DE 5
                  </span>

                  <h2>
                    Telefones
                  </h2>

                  <p>
                    Cadastre os números de contato da pessoa.
                  </p>
                </div>

              </div>

              <div className="cadastro-section">

                {telefones.map(
                  (telefone, index) => (
                    <div
                      className="cadastro-item"
                      key={index}
                    >

                      <div className="cadastro-form-row">

                        <div className="cadastro-form-group">

                          <label>
                            Telefone
                          </label>

                          <input
                            type="text"
                            value={
                              telefone.numero
                            }
                            onChange={(event) =>
                              alterarTelefone(
                                index,
                                "numero",
                                event.target.value
                              )
                            }
                            placeholder="(61) 99999-9999"
                            maxLength={15}
                          />

                        </div>

                        <div className="cadastro-form-group">

                          <label>
                            Tipo
                          </label>

                          <select
                            value={
                              telefone.tipo
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

                            <option value="TRABALHO">
                              Trabalho
                            </option>

                            <option value="RESIDENCIAL">
                              Residencial
                            </option>

                            <option value="OUTRO">
                              Outro
                            </option>

                          </select>

                        </div>

                      </div>

                      {telefones.length >
                        1 && (
                          <button
                            type="button"
                            className="cadastro-remover"
                            onClick={() =>
                              removerTelefone(
                                index
                              )
                            }
                          >
                            Remover telefone
                          </button>
                        )}

                    </div>
                  )
                )}

                <button
                  type="button"
                  className="cadastro-adicionar"
                  onClick={
                    adicionarTelefone
                  }
                >
                  + Adicionar telefone
                </button>

              </div>

            </section>
          )}

          {/* ETAPA 3 - ENDEREÇO */}
          {etapaAtual === 3 && (
            <section className="cadastro-etapa">

              <div className="cadastro-etapa-header">

                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 3 DE 5
                  </span>

                  <h2>
                    Endereço
                  </h2>

                  <p>
                    Informe o endereço atual da pessoa.
                  </p>
                </div>

              </div>

              <div className="cadastro-form-group">

                <label>
                  Logradouro
                  <span>*</span>
                </label>

                <input
                  type="text"
                  value={logradouro}
                  onChange={(event) =>
                    setLogradouro(
                      event.target.value
                    )
                  }
                  placeholder="Rua, avenida, praça..."
                />

              </div>

              <div className="cadastro-form-row">

                <div className="cadastro-form-group">

                  <label>
                    Número
                    <span>*</span>
                  </label>

                  <input
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

                <div className="cadastro-form-group">

                  <label>
                    CEP
                    <span>*</span>
                  </label>

                  <input
                    type="text"
                    value={formatarCEP(cep)}
                    onChange={(event) =>
                      setCep(
                        limparCEP(
                          event.target.value
                        )
                      )
                    }
                    placeholder="00000-000"
                    maxLength={9}
                  />

                </div>

              </div>

              <div className="cadastro-form-group">

                <label>
                  Bairro
                  <span>*</span>
                </label>

                <input
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

              <div className="cadastro-form-row">

                <div className="cadastro-form-group">

                  <label>
                    Cidade
                    <span>*</span>
                  </label>

                  <input
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

                <div className="cadastro-form-group">

                  <label>
                    Estado
                    <span>*</span>
                  </label>

                  <select
                    value={estado}
                    onChange={(event) =>
                      setEstado(
                        event.target.value
                      )
                    }
                  >

                    <option value="">
                      Selecione
                    </option>

                    <option value="AC">
                      Acre
                    </option>

                    <option value="AL">
                      Alagoas
                    </option>

                    <option value="AP">
                      Amapá
                    </option>

                    <option value="AM">
                      Amazonas
                    </option>

                    <option value="BA">
                      Bahia
                    </option>

                    <option value="CE">
                      Ceará
                    </option>

                    <option value="DF">
                      Distrito Federal
                    </option>

                    <option value="ES">
                      Espírito Santo
                    </option>

                    <option value="GO">
                      Goiás
                    </option>

                    <option value="MA">
                      Maranhão
                    </option>

                    <option value="MT">
                      Mato Grosso
                    </option>

                    <option value="MS">
                      Mato Grosso do Sul
                    </option>

                    <option value="MG">
                      Minas Gerais
                    </option>

                    <option value="PA">
                      Pará
                    </option>

                    <option value="PB">
                      Paraíba
                    </option>

                    <option value="PR">
                      Paraná
                    </option>

                    <option value="PE">
                      Pernambuco
                    </option>

                    <option value="PI">
                      Piauí
                    </option>

                    <option value="RJ">
                      Rio de Janeiro
                    </option>

                    <option value="RN">
                      Rio Grande do Norte
                    </option>

                    <option value="RS">
                      Rio Grande do Sul
                    </option>

                    <option value="RO">
                      Rondônia
                    </option>

                    <option value="RR">
                      Roraima
                    </option>

                    <option value="SC">
                      Santa Catarina
                    </option>

                    <option value="SP">
                      São Paulo
                    </option>

                    <option value="SE">
                      Sergipe
                    </option>

                    <option value="TO">
                      Tocantins
                    </option>

                  </select>

                </div>

              </div>

            </section>
          )}

          {/* ETAPA 4 - PASSAGENS */}
          {etapaAtual === 4 && (
            <section className="cadastro-etapa">

              <div className="cadastro-etapa-header">

                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 4 DE 5
                  </span>

                  <h2>
                    Passagens criminais
                  </h2>

                  <p>
                    Cadastre ocorrências relacionadas à pessoa.
                  </p>
                </div>

              </div>

              <div className="cadastro-section">

                {passagens.length === 0 && (
                  <div className="cadastro-vazio">

                    <strong>
                      Nenhuma passagem cadastrada
                    </strong>

                    <p>
                      Caso a pessoa possua registros,
                      adicione uma passagem abaixo.
                    </p>

                  </div>
                )}

                {passagens.map(
                  (passagem, index) => (
                    <div
                      className="cadastro-item"
                      key={index}
                    >

                      <div className="cadastro-item-header">

                        <strong>
                          Passagem {index + 1}
                        </strong>

                        <button
                          type="button"
                          className="cadastro-remover"
                          onClick={() =>
                            removerPassagem(
                              index
                            )
                          }
                        >
                          Remover
                        </button>

                      </div>

                      <div className="cadastro-form-row">

                        <div className="cadastro-form-group">

                          <label>
                            Crime
                          </label>

                          <input
                            type="text"
                            value={
                              passagem.crime
                            }
                            onChange={(event) =>
                              alterarPassagem(
                                index,
                                "crime",
                                event.target.value
                              )
                            }
                            placeholder="Informe o crime"
                          />

                        </div>

                        <div className="cadastro-form-group">

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

                      </div>

                    </div>
                  )
                )}

                <button
                  type="button"
                  className="cadastro-adicionar"
                  onClick={
                    adicionarPassagem
                  }
                >
                  + Adicionar passagem
                </button>

              </div>

            </section>
          )}

          {/* ETAPA 5 - REVISÃO */}

          {etapaAtual === 5 && (
            <section className="cadastro-etapa">

              <div className="cadastro-etapa-header">

                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 5 DE 5
                  </span>

                  <h2>
                    Revisar cadastro
                  </h2>

                  <p>
                    Confira os dados antes de concluir o cadastro.
                  </p>
                </div>

              </div>

              {/* IDENTIFICAÇÃO */}
              <div className="cadastro-revisao-section">

                <div className="cadastro-revisao-header">

                  <div>
                    <span>
                      IDENTIFICAÇÃO
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
                  >
                    Editar
                  </button>

                </div>

                <div className="cadastro-revisao-grid">

                  <div>
                    <small>
                      Nome
                    </small>

                    <strong>
                      {nome}
                    </strong>
                  </div>

                  <div>
                    <small>
                      CPF
                    </small>

                    <strong>
                      {formatarCPF(cpf)}
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
                        : "-"}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Sexo
                    </small>

                    <strong>
                      {sexo === "M"
                        ? "Masculino"
                        : sexo === "F"
                          ? "Feminino"
                          : "-"}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Nome da mãe
                    </small>

                    <strong>
                      {nomeMae}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Nome do pai
                    </small>

                    <strong>
                      {nomePai}
                    </strong>
                  </div>

                </div>

              </div>

              {/* TELEFONES */}
              <div className="cadastro-revisao-section">

                <div className="cadastro-revisao-header">

                  <div>
                    <span>
                      CONTATOS
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
                  >
                    Editar
                  </button>

                </div>

                {telefones.filter(
                  (telefone) =>
                    telefone.numero.trim() !== ""
                ).length === 0 ? (
                  <p className="cadastro-revisao-vazio">
                    Nenhum telefone informado.
                  </p>
                ) : (
                  <div className="cadastro-revisao-lista">

                    {telefones
                      .filter(
                        (telefone) =>
                          telefone.numero.trim() !== ""
                      )
                      .map(
                        (
                          telefone,
                          index
                        ) => (
                          <div
                            key={index}
                            className="cadastro-revisao-item"
                          >

                            <strong>
                              {telefone.numero}
                            </strong>

                            <span>
                              {telefone.tipo}
                            </span>

                          </div>
                        )
                      )}

                  </div>
                )}

              </div>

              {/* ENDEREÇO */}
              <div className="cadastro-revisao-section">

                <div className="cadastro-revisao-header">

                  <div>
                    <span>
                      LOCALIZAÇÃO
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
                  >
                    Editar
                  </button>

                </div>

                <div className="cadastro-revisao-grid">

                  <div>
                    <small>
                      Logradouro
                    </small>

                    <strong>
                      {logradouro}, {numero}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Bairro
                    </small>

                    <strong>
                      {bairro}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Cidade
                    </small>

                    <strong>
                      {cidade}
                    </strong>
                  </div>

                  <div>
                    <small>
                      Estado
                    </small>

                    <strong>
                      {estado}
                    </strong>
                  </div>

                  <div>
                    <small>
                      CEP
                    </small>

                    <strong>
                      {formatarCEP(cep)}
                    </strong>
                  </div>

                </div>

              </div>

              {/* PASSAGENS */}
              <div className="cadastro-revisao-section">

                <div className="cadastro-revisao-header">

                  <div>
                    <span>
                      ANTECEDENTES
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
                  >
                    Editar
                  </button>

                </div>

                {passagens.filter(
                  (passagem) =>
                    passagem.crime.trim() !== "" &&
                    passagem.data_ocorrencia !== ""
                ).length === 0 ? (
                  <p className="cadastro-revisao-vazio">
                    Nenhuma passagem criminal informada.
                  </p>
                ) : (
                  <div className="cadastro-revisao-lista">

                    {passagens
                      .filter(
                        (passagem) =>
                          passagem.crime.trim() !== "" &&
                          passagem.data_ocorrencia !== ""
                      )
                      .map(
                        (
                          passagem,
                          index
                        ) => (
                          <div
                            key={index}
                            className="cadastro-revisao-item"
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
                )}

              </div>

            </section>
          )}

          {/* AÇÕES */}
          <div className="cadastro-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={voltarEtapa}
              disabled={carregando}
            >
              {etapaAtual === 1
                ? "Cancelar"
                : "Voltar"}
            </button>

            {etapaAtual < 5 ? (
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
                type="submit"
                className="button-primary"
                disabled={carregando}
              >
                {carregando
                  ? "Cadastrando..."
                  : "Cadastrar pessoa"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CadastroPessoa;