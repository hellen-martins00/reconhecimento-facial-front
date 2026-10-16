import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  MapPin,
  CalendarDays,
  Clock,
  Search,
  Plus,
  RefreshCw,
  UserRound,
  FileText,
  MapPinned,
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";

import api from "../../services/api";
import localizacoesService from "../../services/localizacoesService";
import "./Localizacoes.css";

function obterDataAtual() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = String(agora.getMonth() + 1).padStart(2, "0");
  const dia = String(agora.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

function obterHorarioAtual() {
  const agora = new Date();
  const horas = String(agora.getHours()).padStart(2, "0");
  const minutos = String(agora.getMinutes()).padStart(2, "0");

  return `${horas}:${minutos}`;
}

function formatarData(data) {
  if (!data) return "Não informada";

  const valor = String(data).slice(0, 10);
  const partes = valor.split("-");

  if (partes.length !== 3) return valor;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(dataHora) {
  if (!dataHora) return "Data não informada";

  const data = String(dataHora);
  const partes = data.split("T");

  const dataFormatada = formatarData(partes[0]);
  const horario = partes[1] ? partes[1].slice(0, 5) : "";

  return horario
    ? `${dataFormatada} às ${horario}`
    : dataFormatada;
}

function normalizarStatus(status) {
  if (!status) return "Não informado";

  return String(status)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^./, (letra) => letra.toUpperCase());
}

function obterLista(resposta) {
  if (Array.isArray(resposta)) return resposta;
  if (Array.isArray(resposta?.data)) return resposta.data;
  if (Array.isArray(resposta?.items)) return resposta.items;

  return [];
}

function Localizacoes() {
  const location = useLocation();

  const pessoaIdRecebida = location.state?.pessoaId;
  const registroIdRecebido = location.state?.registroDesaparecimentoId;

  const [localizacoes, setLocalizacoes] = useState([]);
  const [pessoas, setPessoas] = useState([]);
  const [desaparecimentos, setDesaparecimentos] = useState([]);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [busca, setBusca] = useState("");

  const [pessoaSelecionada, setPessoaSelecionada] = useState(null);
  const [fotoSelecionada, setFotoSelecionada] = useState("");
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  const [formulario, setFormulario] = useState({
    registro_desaparecimento_id: "",
    local_informado: "",
    data: obterDataAtual(),
    horario: obterHorarioAtual(),
    descricao: "",
  });

  // Preenche o registro recebido da tela de reconhecimento facial.
  useEffect(() => {
    if (!pessoaIdRecebida && !registroIdRecebido) return;

    setFormulario((anterior) => ({
      ...anterior,
      registro_desaparecimento_id: registroIdRecebido
        ? String(registroIdRecebido)
        : anterior.registro_desaparecimento_id,
    }));
  }, [pessoaIdRecebida, registroIdRecebido]);

  const carregarDados = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [
        respostaLocalizacoes,
        respostaPessoas,
        respostaDesaparecimentos,
      ] = await Promise.all([
        localizacoesService.listar(),
        api.get("/pessoas"),
        api.get("/desaparecimentos"),
      ]);

      setLocalizacoes(obterLista(respostaLocalizacoes));
      setPessoas(obterLista(respostaPessoas));
      setDesaparecimentos(obterLista(respostaDesaparecimentos));
    } catch (error) {
      console.error("Erro ao carregar localizações:", error);

      setErro(
        error.response?.data?.detail ||
          "Não foi possível carregar os dados. Verifique sua conexão e tente novamente."
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const atualizarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));

    setErro("");
    setSucesso("");
  };

  const obterPessoaDoRegistro = (registro) => {
    if (!registro) return null;

    return pessoas.find(
      (pessoa) =>
        String(pessoa.id) === String(registro.pessoa_id)
    ) || null;
  };

  const obterNomePessoa = (registro) => {
    const pessoa = obterPessoaDoRegistro(registro);

    return (
      pessoa?.nome ||
      `Registro ${String(registro?.id || "").slice(0, 8)}`
    );
  };

  const obterRegistroDaLocalizacao = (localizacao) => {
    return desaparecimentos.find(
      (registro) =>
        String(registro.id) ===
        String(localizacao.registro_desaparecimento_id)
    );
  };

  const obterNomeNaLocalizacao = (localizacao) => {
    const registro = obterRegistroDaLocalizacao(localizacao);

    return registro
      ? obterNomePessoa(registro)
      : `Registro ${String(
          localizacao.registro_desaparecimento_id || ""
        ).slice(0, 8)}`;
  };

  // Atualiza a pessoa exibida quando o registro é selecionado.
  // Funciona tanto para seleção manual quanto para navegação pelo reconhecimento.
  useEffect(() => {
    const registroId = formulario.registro_desaparecimento_id;

    if (!registroId || desaparecimentos.length === 0 || pessoas.length === 0) {
      setPessoaSelecionada(null);
      return;
    }

    const registro = desaparecimentos.find(
      (item) => String(item.id) === String(registroId)
    );

    if (!registro) {
      setPessoaSelecionada(null);
      return;
    }

    const pessoa = obterPessoaDoRegistro(registro);

    setPessoaSelecionada(pessoa);
  }, [
    formulario.registro_desaparecimento_id,
    desaparecimentos,
    pessoas,
  ]);

  // Busca a primeira foto cadastrada para a pessoa selecionada.
  useEffect(() => {
    let urlTemporaria = "";

    const carregarFoto = async () => {
      if (!pessoaSelecionada?.id) {
        setFotoSelecionada("");
        setCarregandoFoto(false);
        return;
      }

      setCarregandoFoto(true);
      setFotoSelecionada("");

      try {
        const resposta = await api.get(
          `/fotos/pessoa/${pessoaSelecionada.id}`
        );

        const fotos = obterLista(resposta);

        if (fotos.length === 0 || !fotos[0]?.id) {
          return;
        }

        const respostaArquivo = await api.get(
          `/fotos/${fotos[0].id}/arquivo`,
          { responseType: "blob" }
        );

        urlTemporaria = URL.createObjectURL(respostaArquivo.data);
        setFotoSelecionada(urlTemporaria);
      } catch (error) {
        console.error("Erro ao carregar foto da pessoa:", error);
      } finally {
        setCarregandoFoto(false);
      }
    };

    carregarFoto();

    return () => {
      if (urlTemporaria) {
        URL.revokeObjectURL(urlTemporaria);
      }
    };
  }, [pessoaSelecionada?.id]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErro("");
    setSucesso("");

    if (!formulario.registro_desaparecimento_id) {
      setErro("Selecione o registro de desaparecimento.");
      return;
    }

    if (!formulario.local_informado.trim()) {
      setErro("Informe o local do avistamento.");
      return;
    }

    if (!formulario.data || !formulario.horario) {
      setErro("Informe a data e o horário do avistamento.");
      return;
    }

    const dataHora = `${formulario.data}T${formulario.horario}:00`;
    const dataSelecionada = new Date(dataHora);
    const agora = new Date();

    if (
      Number.isNaN(dataSelecionada.getTime()) ||
      dataSelecionada > agora
    ) {
      setErro("A data e o horário não podem estar no futuro.");
      return;
    }

    const dados = {
      registro_desaparecimento_id:
        formulario.registro_desaparecimento_id,
      local_informado: formulario.local_informado.trim(),
      data_hora: dataHora,
      descricao: formulario.descricao.trim() || null,
    };

    setSalvando(true);

    try {
      await localizacoesService.cadastrar(dados);

      setSucesso("Avistamento registrado com sucesso!");

      setFormulario({
        registro_desaparecimento_id: "",
        local_informado: "",
        data: obterDataAtual(),
        horario: obterHorarioAtual(),
        descricao: "",
      });

      await carregarDados();
    } catch (error) {
      console.error("Erro ao registrar avistamento:", error);

      const detalhe = error.response?.data?.detail;

      setErro(
        typeof detalhe === "string"
          ? detalhe
          : "Não foi possível registrar o avistamento. Verifique os dados e tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  };

  const limparFormulario = () => {
    setFormulario({
      registro_desaparecimento_id: "",
      local_informado: "",
      data: obterDataAtual(),
      horario: obterHorarioAtual(),
      descricao: "",
    });

    setErro("");
    setSucesso("");
  };

  const localizacoesFiltradas = localizacoes
    .filter((localizacao) => {
      const termo = busca.trim().toLowerCase();

      if (!termo) return true;

      const nome = obterNomeNaLocalizacao(localizacao);
      const local = localizacao.local_informado || "";
      const descricao = localizacao.descricao || "";

      return [nome, local, descricao].some((valor) =>
        String(valor).toLowerCase().includes(termo)
      );
    })
    .sort((a, b) => {
      return (
        new Date(b.data_hora || 0).getTime() -
        new Date(a.data_hora || 0).getTime()
      );
    });

  const desaparecimentosEmAberto = desaparecimentos.filter(
    (registro) =>
      String(registro.status || "").toUpperCase() === "DESAPARECIDO"
  );

  return (
    <div className="localizacoes-page">
      <header className="localizacoes-header">
        <div className="localizacoes-header-texto">
          <div className="localizacoes-titulo-icone">
            <MapPinned size={25} />
          </div>

          <div>
            <h1>Localizações</h1>
            <p>
              Registre avistamentos e consulte os locais informados
              sobre pessoas desaparecidas.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="localizacoes-btn-atualizar"
          onClick={carregarDados}
          disabled={carregando}
        >
          <RefreshCw
            size={17}
            className={carregando ? "localizacoes-girando" : ""}
          />
          Atualizar
        </button>
      </header>

      {erro && (
        <div className="localizacoes-alerta localizacoes-alerta-erro">
          <AlertCircle size={19} />
          <span>{erro}</span>
        </div>
      )}

      {sucesso && (
        <div className="localizacoes-alerta localizacoes-alerta-sucesso">
          <CheckCircle2 size={19} />
          <span>{sucesso}</span>
        </div>
      )}

      <section className="localizacoes-resumo">
        <div className="localizacoes-resumo-icone">
          <MapPin size={23} />
        </div>

        <div>
          <span>Total de avistamentos registrados</span>
          <strong>{carregando ? "—" : localizacoes.length}</strong>
        </div>
      </section>

      <section className="localizacoes-card">
        <div className="localizacoes-card-header">
          <div className="localizacoes-card-header-icone">
            <Plus size={21} />
          </div>

          <div>
            <h2>Registrar avistamento</h2>
            <p>
              Preencha as informações sobre o local onde a pessoa
              foi vista.
            </p>
          </div>
        </div>

        {pessoaSelecionada && (
          <div className="localizacoes-pessoa-selecionada">
            {carregandoFoto ? (
              <div className="localizacoes-foto-placeholder">
                <LoaderCircle
                  size={22}
                  className="localizacoes-girando"
                />
              </div>
            ) : fotoSelecionada ? (
              <img
                src={fotoSelecionada}
                alt={`Foto de ${pessoaSelecionada.nome}`}
                className="localizacoes-foto-pessoa"
              />
            ) : (
              <div className="localizacoes-foto-placeholder">
                <UserRound size={28} />
              </div>
            )}

            <div>
              <span>Pessoa selecionada para localização</span>
              <h3>{pessoaSelecionada.nome}</h3>
              <p>
                Confira a identificação antes de registrar o avistamento.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="localizacoes-form">
          <div className="localizacoes-campo localizacoes-campo-largo">
            <label htmlFor="registro_desaparecimento_id">
              Pessoa desaparecida <span>*</span>
            </label>

            <select
              id="registro_desaparecimento_id"
              value={formulario.registro_desaparecimento_id}
              onChange={(event) =>
                atualizarCampo(
                  "registro_desaparecimento_id",
                  event.target.value
                )
              }
              required
              disabled={carregando || salvando}
            >
              <option value="">Selecione um registro</option>

              {desaparecimentosEmAberto.map((registro) => (
                <option key={registro.id} value={registro.id}>
                  {obterNomePessoa(registro)}
                  {" — "}
                  {formatarData(registro.data_desaparecimento)}
                  {" — "}
                  {normalizarStatus(registro.status)}
                </option>
              ))}
            </select>

            {!carregando && desaparecimentosEmAberto.length === 0 && (
              <small>
                Nenhum caso com situação de desaparecido está disponível
                para registrar avistamentos.
              </small>
            )}
          </div>

          <div className="localizacoes-campo localizacoes-campo-largo">
            <label htmlFor="local_informado">
              Local do avistamento <span>*</span>
            </label>

            <div className="localizacoes-input-icone">
              <MapPin size={18} />

              <input
                id="local_informado"
                type="text"
                placeholder="Ex.: Rodoviária de Brasília"
                value={formulario.local_informado}
                onChange={(event) =>
                  atualizarCampo(
                    "local_informado",
                    event.target.value
                  )
                }
                maxLength={500}
                required
                disabled={salvando}
              />
            </div>
          </div>

          <div className="localizacoes-form-linha">
            <div className="localizacoes-campo">
              <label htmlFor="data_avistamento">
                Data do avistamento <span>*</span>
              </label>

              <div className="localizacoes-input-icone">
                <CalendarDays size={18} />

                <input
                  id="data_avistamento"
                  type="date"
                  value={formulario.data}
                  max={obterDataAtual()}
                  onChange={(event) =>
                    atualizarCampo("data", event.target.value)
                  }
                  required
                  disabled={salvando}
                />
              </div>
            </div>

            <div className="localizacoes-campo">
              <label htmlFor="horario_avistamento">
                Horário do avistamento <span>*</span>
              </label>

              <div className="localizacoes-input-icone">
                <Clock size={18} />

                <input
                  id="horario_avistamento"
                  type="time"
                  value={formulario.horario}
                  onChange={(event) =>
                    atualizarCampo("horario", event.target.value)
                  }
                  required
                  disabled={salvando}
                />
              </div>
            </div>
          </div>

          <div className="localizacoes-campo localizacoes-campo-largo">
            <label htmlFor="descricao_avistamento">
              Descrição complementar
            </label>

            <textarea
              id="descricao_avistamento"
              placeholder="Informe detalhes relevantes sobre o avistamento (opcional)."
              value={formulario.descricao}
              onChange={(event) =>
                atualizarCampo("descricao", event.target.value)
              }
              rows={4}
              maxLength={2000}
              disabled={salvando}
            />

            <small>{formulario.descricao.length}/2000 caracteres</small>
          </div>

          <div className="localizacoes-form-acoes">
            <button
              type="button"
              className="localizacoes-btn-secundario"
              onClick={limparFormulario}
              disabled={salvando}
            >
              Limpar campos
            </button>

            <button
              type="submit"
              className="localizacoes-btn-principal"
              disabled={
                salvando ||
                carregando ||
                desaparecimentosEmAberto.length === 0
              }
            >
              {salvando ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="localizacoes-girando"
                  />
                  Salvando...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Registrar avistamento
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <section className="localizacoes-card localizacoes-historico">
        <div className="localizacoes-card-header localizacoes-historico-header">
          <div className="localizacoes-card-header-icone">
            <MapPinned size={21} />
          </div>

          <div>
            <h2>Histórico de localizações</h2>
            <p>
              Consulte os avistamentos registrados no sistema.
            </p>
          </div>
        </div>

        <div className="localizacoes-lista-toolbar">
          <div className="localizacoes-busca">
            <Search size={18} />

            <input
              type="search"
              placeholder="Buscar por pessoa, local ou descrição..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </div>

          <span className="localizacoes-contagem">
            {localizacoesFiltradas.length}{" "}
            {localizacoesFiltradas.length === 1
              ? "registro"
              : "registros"}
          </span>
        </div>

        {carregando ? (
          <div className="localizacoes-estado">
            <LoaderCircle
              size={30}
              className="localizacoes-girando"
            />
            <p>Carregando localizações...</p>
          </div>
        ) : localizacoesFiltradas.length === 0 ? (
          <div className="localizacoes-estado">
            <div className="localizacoes-estado-icone">
              <MapPin size={29} />
            </div>

            <h3>
              {busca
                ? "Nenhum resultado encontrado"
                : "Nenhuma localização registrada"}
            </h3>

            <p>
              {busca
                ? "Tente pesquisar usando outro nome ou local."
                : "Os avistamentos cadastrados aparecerão aqui."}
            </p>
          </div>
        ) : (
          <div className="localizacoes-lista">
            {localizacoesFiltradas.map((localizacao) => {
              const registro = obterRegistroDaLocalizacao(localizacao);

              return (
                <article
                  className="localizacoes-item"
                  key={localizacao.id}
                >
                  <div className="localizacoes-item-icone">
                    <MapPin size={22} />
                  </div>

                  <div className="localizacoes-item-conteudo">
                    <div className="localizacoes-item-topo">
                      <h3>
                        {localizacao.local_informado ||
                          "Local não informado"}
                      </h3>

                      <span className="localizacoes-data">
                        <CalendarDays size={15} />
                        {formatarDataHora(localizacao.data_hora)}
                      </span>
                    </div>

                    <div className="localizacoes-item-pessoa">
                      <UserRound size={16} />
                      <span>
                        {obterNomeNaLocalizacao(localizacao)}
                      </span>
                    </div>

                    {registro && (
                      <div className="localizacoes-item-status">
                        <span className="localizacoes-status-label">
                          Situação do caso:
                        </span>

                        <span className="localizacoes-status">
                          {normalizarStatus(registro.status)}
                        </span>
                      </div>
                    )}

                    {localizacao.descricao && (
                      <div className="localizacoes-item-descricao">
                        <FileText size={16} />
                        <p>{localizacao.descricao}</p>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Localizacoes;