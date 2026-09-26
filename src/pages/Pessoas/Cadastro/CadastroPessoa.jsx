import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import { formatarCPF, limparCPF } from "../../../utils/formatarCPF";
import { formatarCEP, limparCEP } from "../../../utils/formatarCEP";
import { formatarData } from "../../../utils/formatarData";
import {
  formatarTelefone,
  limparTelefone,
} from "../../../utils/formatarTelefone";

import "./CadastroPessoa.css";

function CadastroPessoa() {
  const navigate = useNavigate();

  // Limites alinhados aos schemas do backend.
  const LIMITES = {
    nome: { min: 3, max: 150 },
    cpf: 11,
    nomeMae: { min: 3, max: 150 },
    nomePai: { min: 3, max: 150 },
    telefone: { min: 10, max: 11 },
    tipoTelefone: { min: 3, max: 20 },
    logradouro: { min: 3, max: 200 },
    numero: { min: 1, max: 20 },
    bairro: { min: 2, max: 100 },
    cidade: { min: 2, max: 100 },
    estado: 2,
    cep: 8,
    crime: { min: 3, max: 150 },
  };

  function textoLimpo(valor) {
    return String(valor ?? "").trim();
  }

  function obterMensagemErroApi(error) {
    const detalhe = error.response?.data?.detail;

    if (Array.isArray(detalhe)) {
      return detalhe
        .map((item) => {
          const campo = item.loc?.[item.loc.length - 1];
          const mensagem = String(item.msg ?? "")
            .replace(/^Value error,\s*/i, "")
            .trim();

          const mensagensPorCampo = {
            nome: "Verifique o nome.",
            cpf: "Verifique o CPF.",
            data_nascimento: "Verifique a data de nascimento.",
            sexo: "Verifique o sexo.",
            nome_mae: "Verifique o nome da mãe.",
            nome_pai: "Verifique o nome do pai.",
            numero: "Verifique o número do endereço.",
            logradouro: "Verifique o logradouro.",
            bairro: "Verifique o bairro.",
            cidade: "Verifique a cidade.",
            estado: "Verifique o estado.",
            cep: "Verifique o CEP.",
            crime: "Verifique o crime.",
            data_ocorrencia: "Verifique a data da ocorrência.",
            tipo: "Verifique o tipo do telefone.",
          };

          if (campo === "numero" && /no máximo 20/i.test(mensagem)) {
            return "O número do endereço deve ter no máximo 20 caracteres.";
          }

          if (campo === "logradouro" && /no máximo 200/i.test(mensagem)) {
            return "O logradouro deve ter no máximo 200 caracteres.";
          }

          if (campo === "crime" && /no máximo 150/i.test(mensagem)) {
            return "O crime deve ter no máximo 150 caracteres.";
          }

          return mensagensPorCampo[campo] || mensagem || "Verifique os dados informados.";
        })
        .join(" ");
    }

    if (typeof detalhe === "string" && detalhe.trim()) {
      return detalhe.replace(/^Value error,\s*/i, "").trim();
    }

    if (!error.response) {
      return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
    }

    if (error.response.status === 409) {
      return "Não foi possível concluir o cadastro porque um dos dados informados já está cadastrado.";
    }

    return "Não foi possível cadastrar a pessoa. Verifique os dados e tente novamente.";
  }

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
    setErro("");

    setTelefones((telefonesAtuais) => [
      ...telefonesAtuais,
      {
        numero: "",
        tipo: "PESSOAL",
      },
    ]);
  }

  function removerTelefone(index) {
    setErro("");

    setTelefones((telefonesAtuais) =>
      telefonesAtuais.filter(
        (_, telefoneIndex) => telefoneIndex !== index
      )
    );
  }

  function alterarTelefone(index, campo, valor) {
    setErro("");

    setTelefones((telefonesAtuais) =>
      telefonesAtuais.map((telefone, telefoneIndex) =>
        telefoneIndex === index
          ? {
            ...telefone,
            [campo]:
              campo === "numero"
                ? limparTelefone(valor)
                : valor,
          }
          : telefone
      )
    );
  }

  // PASSAGENS
  function adicionarPassagem() {
    setErro("");

    setPassagens((passagensAtuais) => [
      ...passagensAtuais,
      {
        crime: "",
        data_ocorrencia: "",
      },
    ]);
  }

  function removerPassagem(index) {
    setErro("");

    setPassagens((passagensAtuais) =>
      passagensAtuais.filter(
        (_, passagemIndex) => passagemIndex !== index
      )
    );
  }

  function alterarPassagem(index, campo, valor) {
    setErro("");

    setPassagens((passagensAtuais) =>
      passagensAtuais.map((passagem, passagemIndex) =>
        passagemIndex === index
          ? { ...passagem, [campo]: valor }
          : passagem
      )
    );
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
    const nomeValor = textoLimpo(nome);
    const cpfLimpo = limparCPF(cpf);
    const maeValor = textoLimpo(nomeMae);
    const paiValor = textoLimpo(nomePai);

    if (!nomeValor) {
      setErro("Informe o nome da pessoa.");
      return false;
    }

    if (nomeValor.length < LIMITES.nome.min) {
      setErro(`O nome deve ter pelo menos ${LIMITES.nome.min} caracteres.`);
      return false;
    }

    if (nomeValor.length > LIMITES.nome.max) {
      setErro(`O nome deve ter no máximo ${LIMITES.nome.max} caracteres.`);
      return false;
    }

    if (cpfLimpo.length !== LIMITES.cpf) {
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

    if (!maeValor) {
      setErro("Informe o nome da mãe.");
      return false;
    }

    if (maeValor.length < LIMITES.nomeMae.min) {
      setErro(`O nome da mãe deve ter pelo menos ${LIMITES.nomeMae.min} caracteres.`);
      return false;
    }

    if (maeValor.length > LIMITES.nomeMae.max) {
      setErro(`O nome da mãe deve ter no máximo ${LIMITES.nomeMae.max} caracteres.`);
      return false;
    }

    if (!paiValor) {
      setErro("Informe o nome do pai.");
      return false;
    }

    if (paiValor.length < LIMITES.nomePai.min) {
      setErro(`O nome do pai deve ter pelo menos ${LIMITES.nomePai.min} caracteres.`);
      return false;
    }

    if (paiValor.length > LIMITES.nomePai.max) {
      setErro(`O nome do pai deve ter no máximo ${LIMITES.nomePai.max} caracteres.`);
      return false;
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 2
  function validarTelefones() {
    const telefonesPreenchidos = telefones.filter(
      (telefone) => limparTelefone(telefone.numero).length > 0
    );

    for (const telefone of telefonesPreenchidos) {
      const numeroLimpo = limparTelefone(telefone.numero);

      if (
        numeroLimpo.length < LIMITES.telefone.min ||
        numeroLimpo.length > LIMITES.telefone.max
      ) {
        setErro("Informe um telefone válido com DDD.");
        return false;
      }

      const tipo = textoLimpo(telefone.tipo);

      if (
        tipo.length < LIMITES.tipoTelefone.min ||
        tipo.length > LIMITES.tipoTelefone.max
      ) {
        setErro("Informe um tipo de telefone válido.");
        return false;
      }
    }

    // Evita cadastrar o mesmo número duas vezes para a mesma pessoa.
    const numeros = telefonesPreenchidos.map((telefone) =>
      limparTelefone(telefone.numero)
    );

    if (new Set(numeros).size !== numeros.length) {
      setErro("Não é permitido cadastrar o mesmo telefone mais de uma vez.");
      return false;
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 3
  function validarEndereco() {
    const logradouroValor = textoLimpo(logradouro);
    const numeroValor = textoLimpo(numero);
    const bairroValor = textoLimpo(bairro);
    const cidadeValor = textoLimpo(cidade);
    const estadoValor = textoLimpo(estado);
    const cepLimpo = limparCEP(cep);

    if (!logradouroValor) {
      setErro("Informe o logradouro.");
      return false;
    }

    if (logradouroValor.length < LIMITES.logradouro.min) {
      setErro(`O logradouro deve ter pelo menos ${LIMITES.logradouro.min} caracteres.`);
      return false;
    }

    if (logradouroValor.length > LIMITES.logradouro.max) {
      setErro(`O logradouro deve ter no máximo ${LIMITES.logradouro.max} caracteres.`);
      return false;
    }

    if (!numeroValor) {
      setErro("Informe o número.");
      return false;
    }

    if (numeroValor.length > LIMITES.numero.max) {
      setErro(`O número deve ter no máximo ${LIMITES.numero.max} caracteres.`);
      return false;
    }

    if (!bairroValor) {
      setErro("Informe o bairro.");
      return false;
    }

    if (bairroValor.length < LIMITES.bairro.min) {
      setErro(`O bairro deve ter pelo menos ${LIMITES.bairro.min} caracteres.`);
      return false;
    }

    if (bairroValor.length > LIMITES.bairro.max) {
      setErro(`O bairro deve ter no máximo ${LIMITES.bairro.max} caracteres.`);
      return false;
    }

    if (!cidadeValor) {
      setErro("Informe a cidade.");
      return false;
    }

    if (cidadeValor.length < LIMITES.cidade.min) {
      setErro(`A cidade deve ter pelo menos ${LIMITES.cidade.min} caracteres.`);
      return false;
    }

    if (cidadeValor.length > LIMITES.cidade.max) {
      setErro(`A cidade deve ter no máximo ${LIMITES.cidade.max} caracteres.`);
      return false;
    }

    if (!estadoValor) {
      setErro("Informe o estado.");
      return false;
    }

    if (
      estadoValor.length !== LIMITES.estado ||
      !/^[A-Za-zÀ-ÿ]{2}$/.test(estadoValor)
    ) {
      setErro("O estado deve conter exatamente 2 letras.");
      return false;
    }

    if (cepLimpo.length !== LIMITES.cep) {
      setErro("Informe um CEP válido com 8 números.");
      return false;
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 4
  function validarPassagens() {
    for (const passagem of passagens) {
      const crimeValor = textoLimpo(passagem.crime);
      const dataValor = passagem.data_ocorrencia;

      // Linha totalmente vazia é permitida: significa que não há passagem.
      if (!crimeValor && !dataValor) {
        continue;
      }

      if (!crimeValor) {
        setErro("Informe o crime da passagem criminal.");
        return false;
      }

      if (
        crimeValor.length < LIMITES.crime.min ||
        crimeValor.length > LIMITES.crime.max
      ) {
        setErro(
          `O crime deve ter entre ${LIMITES.crime.min} e ${LIMITES.crime.max} caracteres.`
        );
        return false;
      }

      if (!dataValor) {
        setErro("Informe a data da ocorrência da passagem criminal.");
        return false;
      }

      if (dataValor > obterDataHoje()) {
        setErro("A data da ocorrência não pode ser futura.");
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
    event?.preventDefault();

    if (etapaAtual !== 5 || carregando) {
      return;
    }

    // Garante que todos os dados estejam válidos mesmo que o usuário
    // tenha voltado diretamente para a etapa de revisão.
    if (!validarIdentificacao()) {
      setEtapaAtual(1);
      return;
    }

    if (!validarTelefones()) {
      setEtapaAtual(2);
      return;
    }

    if (!validarEndereco()) {
      setEtapaAtual(3);
      return;
    }

    if (!validarPassagens()) {
      setEtapaAtual(4);
      return;
    }

    setErro("");
    setCarregando(true);

    const dadosPessoa = {
      nome: textoLimpo(nome),
      cpf: limparCPF(cpf),
      data_nascimento: dataNascimento,
      sexo,
      nome_mae: textoLimpo(nomeMae),
      nome_pai: textoLimpo(nomePai),
    };

    const telefonesValidos = telefones
      .map((telefone) => ({
        numero: limparTelefone(telefone.numero),
        tipo: textoLimpo(telefone.tipo),
      }))
      .filter((telefone) => telefone.numero);

    const dadosEndereco = {
      logradouro: textoLimpo(logradouro),
      numero: textoLimpo(numero),
      bairro: textoLimpo(bairro),
      cidade: textoLimpo(cidade),
      estado: textoLimpo(estado).toUpperCase(),
      cep: limparCEP(cep),
    };

    const passagensValidas = passagens
      .map((passagem) => ({
        crime: textoLimpo(passagem.crime),
        data_ocorrencia: passagem.data_ocorrencia,
      }))
      .filter(
        (passagem) =>
          passagem.crime && passagem.data_ocorrencia
      );

    try {
      // ATENÇÃO: como o backend possui endpoints separados, o cadastro
      // ainda não é transacional. Se uma etapa posterior falhar, a pessoa
      // poderá ter sido criada parcialmente. O ideal é futuramente expor
      // um endpoint único de cadastro completo no backend.
      const respostaPessoa = await api.post(
        "/pessoas",
        dadosPessoa
      );

      const pessoaCriada = respostaPessoa.data;

      await Promise.all(
        telefonesValidos.map((telefone) =>
          api.post("/telefones", {
            pessoa_id: pessoaCriada.id,
            numero: telefone.numero,
            tipo: telefone.tipo,
          })
        )
      );

      await api.post("/enderecos", {
        pessoa_id: pessoaCriada.id,
        ...dadosEndereco,
      });

      await Promise.all(
        passagensValidas.map((passagem) =>
          api.post("/passagens", {
            pessoa_id: pessoaCriada.id,
            crime: passagem.crime,
            data_ocorrencia: passagem.data_ocorrencia,
          })
        )
      );

      navigate("/pessoas", {
        state: {
          sucesso: "Pessoa cadastrada com sucesso!",
        },
      });
    } catch (error) {
      console.error("Erro no cadastro da pessoa:", error);
      console.error("Resposta da API:", error.response?.data);

      setErro(obterMensagemErroApi(error));
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
          <div
            className="cadastro-error"
            role="alert"
            aria-live="polite"
          >
            {erro}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          noValidate
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
                  maxLength={150}
                  onChange={(event) => {
                    setErro("");
                    setNome(event.target.value);
                  }}
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
                    onChange={(event) => {
                      setErro("");
                      setCpf(limparCPF(event.target.value));
                    }}
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
                    value={dataNascimento}
                    max={obterDataHoje()}
                    className={erroDataNascimento ? "campo-com-erro" : ""}
                    onChange={(event) => {
                      setDataNascimento(event.target.value);
                      setErro("");
                      setErroDataNascimento("");
                    }}
                  />

                  {erroDataNascimento && (
                    <span className="cadastro-campo-erro">
                      {erroDataNascimento}
                    </span>
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
                  maxLength={150}
                  onChange={(event) => {
                    setErro("");
                    setNomeMae(event.target.value);
                  }}
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
                  maxLength={150}
                  onChange={(event) => {
                    setErro("");
                    setNomePai(event.target.value);
                  }}
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
                            value={formatarTelefone(telefone.numero)}
                            onChange={(event) =>
                              alterarTelefone(
                                index,
                                "numero",
                                event.target.value
                              )
                            }
                            placeholder="(61) 99999-9999"
                            inputMode="numeric"
                            autoComplete="tel"
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
                  maxLength={200}
                  onChange={(event) => {
                    setErro("");
                    setLogradouro(event.target.value);
                  }}
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
                    maxLength={20}
                    onChange={(event) =>
                      setNumero(event.target.value)
                    }
                    placeholder="Número"
                    inputMode="text"
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
                    onChange={(event) => {
                      setErro("");
                      setCep(limparCEP(event.target.value));
                    }}
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
                  maxLength={100}
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
                    maxLength={100}
                    onChange={(event) => {
                      setErro("");
                      setCidade(event.target.value);
                    }}
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
                    onChange={(event) => {
                      setErro("");
                      setEstado(event.target.value);
                    }}
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
                            value={passagem.crime}
                            maxLength={150}
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
                        ? formatarData(dataNascimento)
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
                              {formatarTelefone(telefone.numero)}
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
                              {formatarData(passagem.data_ocorrencia)}
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