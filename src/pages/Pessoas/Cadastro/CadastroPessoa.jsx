
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
  localDesaparecimento: { min: 3, max: 200 },
  descricaoDesaparecimento: { min: 3, max: 500 },
};

const ETAPAS = [
  { numero: 1, titulo: "Identificação", descricao: "Dados pessoais" },
  { numero: 2, titulo: "Telefones", descricao: "Contatos" },
  { numero: 3, titulo: "Endereço", descricao: "Localização" },
  { numero: 4, titulo: "Desaparecimento", descricao: "Registros" },
  { numero: 5, titulo: "Revisão", descricao: "Conferência" },
];

function textoLimpo(valor) {
  return String(valor ?? "").trim();
}

function obterDataHoje() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
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
          data_desaparecimento: "Verifique a data do desaparecimento.",
          local_desaparecimento: "Verifique o local do desaparecimento.",
          descricao: "Verifique a descrição do desaparecimento.",
          pessoa_id: "Verifique a pessoa vinculada ao registro.",
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

        return mensagensPorCampo[campo] || mensagem ||
          "Verifique os dados informados.";
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

  return "Não foi possível concluir o cadastro. Verifique os dados e tente novamente.";
}

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
    { numero: "", tipo: "PESSOAL" },
  ]);

  // ENDEREÇO
  const [logradouro, setLogradouro] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [cep, setCep] = useState("");

  // REGISTROS DE DESAPARECIMENTO
  const [registrosDesaparecimento, setRegistrosDesaparecimento] =
    useState([]);

  // CONTROLE
  const [erro, setErro] = useState("");
  const [erroCPF, setErroCPF] = useState("");
  const [erroDataNascimento, setErroDataNascimento] = useState("");
  const [carregando, setCarregando] = useState(false);

  // TELEFONES
  function adicionarTelefone() {
    setErro("");

    setTelefones((atuais) => [
      ...atuais,
      { numero: "", tipo: "PESSOAL" },
    ]);
  }

  function removerTelefone(index) {
    setErro("");

    setTelefones((atuais) =>
      atuais.filter((_, i) => i !== index)
    );
  }

  function alterarTelefone(index, campo, valor) {
    setErro("");

    setTelefones((atuais) =>
      atuais.map((telefone, i) =>
        i === index
          ? {
              ...telefone,
              [campo]:
                campo === "numero" ? limparTelefone(valor) : valor,
            }
          : telefone
      )
    );
  }

  // REGISTROS DE DESAPARECIMENTO
  function adicionarRegistroDesaparecimento() {
    setErro("");

    setRegistrosDesaparecimento((atuais) => [
      ...atuais,
      {
        data_desaparecimento: "",
        local_desaparecimento: "",
        descricao: "",
      },
    ]);
  }

  function removerRegistroDesaparecimento(index) {
    setErro("");

    setRegistrosDesaparecimento((atuais) =>
      atuais.filter((_, i) => i !== index)
    );
  }

  function alterarRegistroDesaparecimento(index, campo, valor) {
    setErro("");

    setRegistrosDesaparecimento((atuais) =>
      atuais.map((registro, i) =>
        i === index
          ? { ...registro, [campo]: valor }
          : registro
      )
    );
  }

  // VERIFICAÇÃO DO CPF
  async function validarCPFDisponivel() {
    const cpfLimpo = limparCPF(cpf);

    if (cpfLimpo.length !== LIMITES.cpf) {
      setErroCPF("Informe um CPF válido com 11 números.");
      return false;
    }

    try {
      const resposta = await api.get(
        `/pessoas/verificar-cpf/${cpfLimpo}`
      );

      if (!resposta.data?.disponivel) {
        setErroCPF("Já existe uma pessoa cadastrada com este CPF.");
        return false;
      }

      setErroCPF("");
      return true;
    } catch (error) {
      console.error("Erro ao verificar CPF:", error);

      setErro(
        "Não foi possível verificar o CPF. Tente novamente."
      );

      return false;
    }
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

    if (
      nomeValor.length < LIMITES.nome.min ||
      nomeValor.length > LIMITES.nome.max
    ) {
      setErro(
        `O nome deve ter entre ${LIMITES.nome.min} e ${LIMITES.nome.max} caracteres.`
      );
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
      setErroDataNascimento(
        "A data de nascimento não pode ser futura."
      );
      return false;
    }

    setErroDataNascimento("");

    if (!sexo) {
      setErro("Selecione o sexo.");
      return false;
    }

    if (
      maeValor.length < LIMITES.nomeMae.min ||
      maeValor.length > LIMITES.nomeMae.max
    ) {
      setErro(
        `O nome da mãe deve ter entre ${LIMITES.nomeMae.min} e ${LIMITES.nomeMae.max} caracteres.`
      );
      return false;
    }

    if (
      paiValor.length < LIMITES.nomePai.min ||
      paiValor.length > LIMITES.nomePai.max
    ) {
      setErro(
        `O nome do pai deve ter entre ${LIMITES.nomePai.min} e ${LIMITES.nomePai.max} caracteres.`
      );
      return false;
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 2
  function validarTelefones() {
    const preenchidos = telefones.filter(
      (telefone) => limparTelefone(telefone.numero).length > 0
    );

    for (const telefone of preenchidos) {
      const numeroLimpo = limparTelefone(telefone.numero);
      const tipo = textoLimpo(telefone.tipo);

      if (
        numeroLimpo.length < LIMITES.telefone.min ||
        numeroLimpo.length > LIMITES.telefone.max
      ) {
        setErro("Informe um telefone válido com DDD.");
        return false;
      }

      if (
        tipo.length < LIMITES.tipoTelefone.min ||
        tipo.length > LIMITES.tipoTelefone.max
      ) {
        setErro("Informe um tipo de telefone válido.");
        return false;
      }
    }

    const numeros = preenchidos.map((telefone) =>
      limparTelefone(telefone.numero)
    );

    if (new Set(numeros).size !== numeros.length) {
      setErro(
        "Não é permitido cadastrar o mesmo telefone mais de uma vez."
      );
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

    if (
      logradouroValor.length < LIMITES.logradouro.min ||
      logradouroValor.length > LIMITES.logradouro.max
    ) {
      setErro(
        `O logradouro deve ter entre ${LIMITES.logradouro.min} e ${LIMITES.logradouro.max} caracteres.`
      );
      return false;
    }

    if (
      !numeroValor ||
      numeroValor.length > LIMITES.numero.max
    ) {
      setErro(
        `Informe o número do endereço, com até ${LIMITES.numero.max} caracteres.`
      );
      return false;
    }

    if (
      bairroValor.length < LIMITES.bairro.min ||
      bairroValor.length > LIMITES.bairro.max
    ) {
      setErro(
        `O bairro deve ter entre ${LIMITES.bairro.min} e ${LIMITES.bairro.max} caracteres.`
      );
      return false;
    }

    if (
      cidadeValor.length < LIMITES.cidade.min ||
      cidadeValor.length > LIMITES.cidade.max
    ) {
      setErro(
        `A cidade deve ter entre ${LIMITES.cidade.min} e ${LIMITES.cidade.max} caracteres.`
      );
      return false;
    }

    if (
      estadoValor.length !== LIMITES.estado ||
      !/^[A-Za-zÀ-ÿ]{2}$/.test(estadoValor)
    ) {
      setErro("Selecione um estado válido.");
      return false;
    }

    if (cepLimpo.length !== LIMITES.cep) {
      setErro("Informe um CEP válido com 8 números.");
      return false;
    }

    return true;
  }

  // VALIDAÇÃO DA ETAPA 4
  function validarRegistrosDesaparecimento() {
    for (const registro of registrosDesaparecimento) {
      const data = registro.data_desaparecimento;
      const local = textoLimpo(registro.local_desaparecimento);
      const descricao = textoLimpo(registro.descricao);

      // Permite manter um item vazio sem enviá-lo à API.
      if (!data && !local && !descricao) {
        continue;
      }

      if (!data) {
        setErro("Informe a data do desaparecimento.");
        return false;
      }

      if (data > obterDataHoje()) {
        setErro(
          "A data do desaparecimento não pode ser futura."
        );
        return false;
      }

      if (
        local.length < LIMITES.localDesaparecimento.min ||
        local.length > LIMITES.localDesaparecimento.max
      ) {
        setErro(
          `O local deve ter entre ${LIMITES.localDesaparecimento.min} e ${LIMITES.localDesaparecimento.max} caracteres.`
        );
        return false;
      }

      if (
        descricao.length < LIMITES.descricaoDesaparecimento.min ||
        descricao.length > LIMITES.descricaoDesaparecimento.max
      ) {
        setErro(
          `A descrição deve ter entre ${LIMITES.descricaoDesaparecimento.min} e ${LIMITES.descricaoDesaparecimento.max} caracteres.`
        );
        return false;
      }
    }

    return true;
  }

  // AVANÇAR ETAPA
  async function avancarEtapa(event) {
    event?.preventDefault();

    if (carregando || etapaAtual >= 5) {
      return;
    }

    setErro("");

    if (etapaAtual === 1) {
      if (!validarIdentificacao()) {
        return;
      }

      setCarregando(true);

      try {
        const cpfDisponivel = await validarCPFDisponivel();

        if (cpfDisponivel) {
          setEtapaAtual(2);
        }
      } finally {
        setCarregando(false);
      }

      return;
    }

    if (etapaAtual === 2) {
      if (!validarTelefones()) {
        return;
      }

      setEtapaAtual(3);
      return;
    }

    if (etapaAtual === 3) {
      if (!validarEndereco()) {
        return;
      }

      setEtapaAtual(4);
      return;
    }

    if (etapaAtual === 4) {
      if (!validarRegistrosDesaparecimento()) {
        return;
      }

      setEtapaAtual(5);
    }
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

  // VOLTAR PARA UMA ETAPA JÁ CONCLUÍDA
  function irParaEtapa(numeroEtapa) {
    if (numeroEtapa < etapaAtual) {
      setErro("");
      setEtapaAtual(numeroEtapa);
    }
  }

  // CADASTRO FINAL
  async function handleSubmit(event) {
    event.preventDefault();

    if (etapaAtual !== 5 || carregando) {
      return;
    }

    setErro("");

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

    if (!validarRegistrosDesaparecimento()) {
      setEtapaAtual(4);
      return;
    }

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

    const registrosValidos = registrosDesaparecimento
      .filter(
        (registro) =>
          registro.data_desaparecimento &&
          textoLimpo(registro.local_desaparecimento) &&
          textoLimpo(registro.descricao)
      )
      .map((registro) => ({
        data_desaparecimento: registro.data_desaparecimento,
        local_desaparecimento: textoLimpo(
          registro.local_desaparecimento
        ),
        descricao: textoLimpo(registro.descricao),
      }));

    try {
      // 1. Cria a pessoa.
      const respostaPessoa = await api.post(
        "/pessoas",
        dadosPessoa
      );

      const pessoaCriada = respostaPessoa.data;

      if (!pessoaCriada?.id) {
        throw new Error(
          "A API não retornou o identificador da pessoa cadastrada."
        );
      }

      // 2. Cria os telefones informados.
      for (const telefone of telefonesValidos) {
        await api.post("/telefones", {
          pessoa_id: pessoaCriada.id,
          numero: telefone.numero,
          tipo: telefone.tipo,
        });
      }

      // 3. Cria o endereço.
      await api.post("/enderecos", {
        pessoa_id: pessoaCriada.id,
        ...dadosEndereco,
      });

      // 4. Cria os registros de desaparecimento.
      // O backend deve definir o status inicial como DESAPARECIDO.
      for (const registro of registrosValidos) {
        await api.post("/desaparecimentos", {
          pessoa_id: pessoaCriada.id,
          ...registro,
        });
      }

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

  return (
    <div className="cadastro-pessoa-page">
      {/* CABEÇALHO */}
      <div className="cadastro-pessoa-header">
        <div>
          <h1>Adicionar Pessoa</h1>
          <p>Cadastre os dados da pessoa no sistema.</p>
        </div>

        <button
          type="button"
          className="cadastro-voltar"
          onClick={() => navigate("/pessoas")}
        >
          Voltar
        </button>
      </div>

      {/* STEPPER */}
      <div className="cadastro-stepper">
        {ETAPAS.map((etapa, index) => {
          const concluida = etapa.numero < etapaAtual;
          const atual = etapa.numero === etapaAtual;

          return (
            <div
              key={etapa.numero}
              className={`cadastro-step ${
                atual ? "cadastro-step-atual" : ""
              } ${concluida ? "cadastro-step-concluida" : ""}`}
            >
              <button
                type="button"
                className="cadastro-step-button"
                onClick={() => irParaEtapa(etapa.numero)}
                disabled={etapa.numero >= etapaAtual || carregando}
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
                <div className="cadastro-step-linha" />
              )}
            </div>
          );
        })}
      </div>

      {/* CARD PRINCIPAL */}
      <div className="cadastro-pessoa-card">
        {erro && (
          <div
            className="cadastro-error"
            role="alert"
            aria-live="polite"
          >
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* ETAPA 1 - IDENTIFICAÇÃO */}
          {etapaAtual === 1 && (
            <section className="cadastro-etapa">
              <div className="cadastro-etapa-header">
                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 1 DE 5
                  </span>
                  <h2>Dados de identificação</h2>
                  <p>Informe os dados pessoais da pessoa.</p>
                </div>
              </div>

              <div className="cadastro-form-group">
                <label>
                  Nome completo <span>*</span>
                </label>
                <input
                  type="text"
                  value={nome}
                  maxLength={LIMITES.nome.max}
                  onChange={(event) => {
                    setErro("");
                    setNome(event.target.value);
                  }}
                  placeholder="Digite o nome completo"
                  autoComplete="name"
                />
              </div>

              <div className="cadastro-form-row">
                <div className="cadastro-form-group">
                  <label>
                    CPF <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={formatarCPF(cpf)}
                    onChange={(event) => {
                      setErro("");
                      setErroCPF("");
                      setCpf(limparCPF(event.target.value));
                    }}
                    placeholder="000.000.000-00"
                    maxLength={14}
                    inputMode="numeric"
                    autoComplete="off"
                    className={erroCPF ? "campo-com-erro" : ""}
                  />

                  {erroCPF && (
                    <span className="cadastro-campo-erro">
                      {erroCPF}
                    </span>
                  )}
                </div>

                <div className="cadastro-form-group">
                  <label>
                    Data de nascimento <span>*</span>
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    max={obterDataHoje()}
                    className={
                      erroDataNascimento ? "campo-com-erro" : ""
                    }
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
                  Sexo <span>*</span>
                </label>
                <select
                  value={sexo}
                  onChange={(event) => {
                    setSexo(event.target.value);
                    setErro("");
                  }}
                >
                  <option value="">Selecione</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
              </div>

              <div className="cadastro-form-group">
                <label>
                  Nome da mãe <span>*</span>
                </label>
                <input
                  type="text"
                  value={nomeMae}
                  maxLength={LIMITES.nomeMae.max}
                  onChange={(event) => {
                    setErro("");
                    setNomeMae(event.target.value);
                  }}
                  placeholder="Digite o nome da mãe"
                />
              </div>

              <div className="cadastro-form-group">
                <label>
                  Nome do pai <span>*</span>
                </label>
                <input
                  type="text"
                  value={nomePai}
                  maxLength={LIMITES.nomePai.max}
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
                  <h2>Telefones</h2>
                  <p>Cadastre os números de contato da pessoa.</p>
                </div>
              </div>

              <div className="cadastro-section">
                {telefones.map((telefone, index) => (
                  <div className="cadastro-item" key={index}>
                    <div className="cadastro-form-row">
                      <div className="cadastro-form-group">
                        <label>Telefone</label>
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
                          <option value="PESSOAL">Pessoal</option>
                          <option value="TRABALHO">Trabalho</option>
                          <option value="RESIDENCIAL">Residencial</option>
                          <option value="OUTRO">Outro</option>
                        </select>
                      </div>
                    </div>

                    {telefones.length > 1 && (
                      <button
                        type="button"
                        className="cadastro-remover"
                        onClick={() => removerTelefone(index)}
                      >
                        Remover telefone
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  className="cadastro-adicionar"
                  onClick={adicionarTelefone}
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
                  <h2>Endereço</h2>
                  <p>Informe o endereço atual da pessoa.</p>
                </div>
              </div>

              <div className="cadastro-form-group">
                <label>
                  Logradouro <span>*</span>
                </label>
                <input
                  type="text"
                  value={logradouro}
                  maxLength={LIMITES.logradouro.max}
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
                    Número <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={numero}
                    maxLength={LIMITES.numero.max}
                    onChange={(event) => {
                      setErro("");
                      setNumero(event.target.value);
                    }}
                    placeholder="Número"
                  />
                </div>

                <div className="cadastro-form-group">
                  <label>
                    CEP <span>*</span>
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
                    inputMode="numeric"
                  />
                </div>
              </div>

              <div className="cadastro-form-group">
                <label>
                  Bairro <span>*</span>
                </label>
                <input
                  type="text"
                  value={bairro}
                  maxLength={LIMITES.bairro.max}
                  onChange={(event) => {
                    setErro("");
                    setBairro(event.target.value);
                  }}
                  placeholder="Digite o bairro"
                />
              </div>

              <div className="cadastro-form-row">
                <div className="cadastro-form-group">
                  <label>
                    Cidade <span>*</span>
                  </label>
                  <input
                    type="text"
                    value={cidade}
                    maxLength={LIMITES.cidade.max}
                    onChange={(event) => {
                      setErro("");
                      setCidade(event.target.value);
                    }}
                    placeholder="Digite a cidade"
                  />
                </div>

                <div className="cadastro-form-group">
                  <label>
                    Estado <span>*</span>
                  </label>
                  <select
                    value={estado}
                    onChange={(event) => {
                      setErro("");
                      setEstado(event.target.value);
                    }}
                  >
                    <option value="">Selecione</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>
              </div>
            </section>
          )}

          {/* ETAPA 4 - DESAPARECIMENTO */}
          {etapaAtual === 4 && (
            <section className="cadastro-etapa">
              <div className="cadastro-etapa-header">
                <div>
                  <span className="cadastro-etapa-numero-label">
                    ETAPA 4 DE 5
                  </span>
                  <h2>Registros de Desaparecimento</h2>
                  <p>
                    Registre informações sobre o desaparecimento da pessoa.
                  </p>
                </div>
              </div>

              <div className="cadastro-section">
                {registrosDesaparecimento.length === 0 && (
                  <div className="cadastro-vazio">
                    <strong>Nenhum registro de desaparecimento</strong>
                    <p>
                      Caso exista um registro, adicione as informações abaixo.
                    </p>
                  </div>
                )}

                {registrosDesaparecimento.map((registro, index) => (
                  <div className="cadastro-item" key={index}>
                    <div className="cadastro-item-header">
                      <strong>Registro {index + 1}</strong>
                      <button
                        type="button"
                        className="cadastro-remover"
                        onClick={() =>
                          removerRegistroDesaparecimento(index)
                        }
                      >
                        Remover
                      </button>
                    </div>

                    <div className="cadastro-form-group">
                      <label>Data do desaparecimento</label>
                      <input
                        type="date"
                        value={registro.data_desaparecimento}
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

                    <div className="cadastro-form-group">
                      <label>Local do desaparecimento</label>
                      <input
                        type="text"
                        value={registro.local_desaparecimento}
                        maxLength={LIMITES.localDesaparecimento.max}
                        placeholder="Informe o local onde a pessoa foi vista pela última vez"
                        onChange={(event) =>
                          alterarRegistroDesaparecimento(
                            index,
                            "local_desaparecimento",
                            event.target.value
                          )
                        }
                      />
                    </div>

                    <div className="cadastro-form-group">
                      <label>Descrição das circunstâncias</label>
                      <textarea
                        value={registro.descricao}
                        maxLength={LIMITES.descricaoDesaparecimento.max}
                        rows={4}
                        placeholder="Descreva as circunstâncias do desaparecimento"
                        onChange={(event) =>
                          alterarRegistroDesaparecimento(
                            index,
                            "descricao",
                            event.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  className="cadastro-adicionar"
                  onClick={adicionarRegistroDesaparecimento}
                >
                  + Adicionar registro
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
                  <h2>Revisar cadastro</h2>
                  <p>
                    Confira os dados antes de concluir o cadastro.
                  </p>
                </div>
              </div>

              {/* IDENTIFICAÇÃO */}
              <div className="cadastro-revisao-section">
                <div className="cadastro-revisao-header">
                  <div>
                    <span>IDENTIFICAÇÃO</span>
                    <h3>Dados pessoais</h3>
                  </div>
                  <button type="button" onClick={() => irParaEtapa(1)}>
                    Editar
                  </button>
                </div>

                <div className="cadastro-revisao-grid">
                  <div>
                    <small>Nome</small>
                    <strong>{nome}</strong>
                  </div>
                  <div>
                    <small>CPF</small>
                    <strong>{formatarCPF(cpf)}</strong>
                  </div>
                  <div>
                    <small>Data de nascimento</small>
                    <strong>
                      {dataNascimento ? formatarData(dataNascimento) : "-"}
                    </strong>
                  </div>
                  <div>
                    <small>Sexo</small>
                    <strong>
                      {sexo === "M"
                        ? "Masculino"
                        : sexo === "F"
                          ? "Feminino"
                          : "-"}
                    </strong>
                  </div>
                  <div>
                    <small>Nome da mãe</small>
                    <strong>{nomeMae}</strong>
                  </div>
                  <div>
                    <small>Nome do pai</small>
                    <strong>{nomePai}</strong>
                  </div>
                </div>
              </div>

              {/* TELEFONES */}
              <div className="cadastro-revisao-section">
                <div className="cadastro-revisao-header">
                  <div>
                    <span>CONTATOS</span>
                    <h3>Telefones</h3>
                  </div>
                  <button type="button" onClick={() => irParaEtapa(2)}>
                    Editar
                  </button>
                </div>

                {telefones.filter(
                  (telefone) => limparTelefone(telefone.numero)
                ).length === 0 ? (
                  <p className="cadastro-revisao-vazio">
                    Nenhum telefone informado.
                  </p>
                ) : (
                  <div className="cadastro-revisao-lista">
                    {telefones
                      .filter(
                        (telefone) => limparTelefone(telefone.numero)
                      )
                      .map((telefone, index) => (
                        <div
                          key={index}
                          className="cadastro-revisao-item"
                        >
                          <strong>
                            {formatarTelefone(telefone.numero)}
                          </strong>
                          <span>{telefone.tipo}</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* ENDEREÇO */}
              <div className="cadastro-revisao-section">
                <div className="cadastro-revisao-header">
                  <div>
                    <span>LOCALIZAÇÃO</span>
                    <h3>Endereço</h3>
                  </div>
                  <button type="button" onClick={() => irParaEtapa(3)}>
                    Editar
                  </button>
                </div>

                <div className="cadastro-revisao-grid">
                  <div>
                    <small>Logradouro</small>
                    <strong>{logradouro}, {numero}</strong>
                  </div>
                  <div>
                    <small>Bairro</small>
                    <strong>{bairro}</strong>
                  </div>
                  <div>
                    <small>Cidade</small>
                    <strong>{cidade}</strong>
                  </div>
                  <div>
                    <small>Estado</small>
                    <strong>{estado}</strong>
                  </div>
                  <div>
                    <small>CEP</small>
                    <strong>{formatarCEP(cep)}</strong>
                  </div>
                </div>
              </div>

              {/* REGISTROS DE DESAPARECIMENTO */}
              <div className="cadastro-revisao-section">
                <div className="cadastro-revisao-header">
                  <div>
                    <span>REGISTROS</span>
                    <h3>Registros de Desaparecimento</h3>
                  </div>
                  <button type="button" onClick={() => irParaEtapa(4)}>
                    Editar
                  </button>
                </div>

                {registrosDesaparecimento.filter(
                  (registro) =>
                    registro.data_desaparecimento ||
                    textoLimpo(registro.local_desaparecimento) ||
                    textoLimpo(registro.descricao)
                ).length === 0 ? (
                  <p className="cadastro-revisao-vazio">
                    Nenhum registro de desaparecimento informado.
                  </p>
                ) : (
                  <div className="cadastro-revisao-lista">
                    {registrosDesaparecimento
                      .filter(
                        (registro) =>
                          registro.data_desaparecimento ||
                          textoLimpo(registro.local_desaparecimento) ||
                          textoLimpo(registro.descricao)
                      )
                      .map((registro, index) => (
                        <div
                          key={index}
                          className="cadastro-revisao-item"
                        >
                          <div>
                            <strong>Registro {index + 1}</strong>
                            <span>
                              Data:{" "}
                              {registro.data_desaparecimento
                                ? formatarData(
                                    registro.data_desaparecimento
                                  )
                                : "Não informada"}
                            </span>
                            <span>
                              Local:{" "}
                              {registro.local_desaparecimento ||
                                "Não informado"}
                            </span>
                            <span>
                              Descrição:{" "}
                              {registro.descricao || "Não informada"}
                            </span>
                            <span>
                              Status inicial: Desaparecido
                            </span>
                          </div>
                        </div>
                      ))}
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
              {etapaAtual === 1 ? "Cancelar" : "Voltar"}
            </button>

            {etapaAtual < 5 ? (
              <button
                type="button"
                className="button-primary"
                onClick={avancarEtapa}
                disabled={carregando}
              >
                {carregando ? "Verificando..." : "Continuar"}
              </button>
            ) : (
              <button
                type="submit"
                className="button-primary"
                disabled={carregando}
              >
                {carregando ? "Cadastrando..." : "Cadastrar pessoa"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default CadastroPessoa;
