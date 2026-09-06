import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import "./EditarAgente.css";

function EditarAgente() {
  const { id } = useParams();
  const navigate = useNavigate();

  // =========================================
  // ESTADOS
  // =========================================

  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [perfil, setPerfil] = useState("");
  const [senha, setSenha] = useState("");

  const [fotoUrl, setFotoUrl] = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);
  const [novaFotoPreview, setNovaFotoPreview] = useState(null);

  const [possuiCadastroFacial, setPossuiCadastroFacial] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // =========================================
  // USUÁRIO LOGADO E PERMISSÕES
  // =========================================

  const usuarioSalvo = localStorage.getItem("usuario");

  let usuarioLogado = null;

  try {
    usuarioLogado = usuarioSalvo
      ? JSON.parse(usuarioSalvo)
      : null;
  } catch (error) {
    console.error(
      "Erro ao recuperar usuário logado:",
      error
    );
  }

  const isAdmin = usuarioLogado?.perfil === "ADMIN";

  const isProprioAgente =
    String(usuarioLogado?.id) === String(id);

  const podeEditar =
    isAdmin || isProprioAgente;

  // =========================================
  // CARREGAR AGENTE
  // =========================================

  useEffect(() => {
    let isMounted = true;
    let objectUrlCarregado = null;

    async function carregarAgente() {
      setCarregando(true);
      setErro("");

      try {
        // DADOS DO AGENTE
        const resposta = await api.get(
          `/agentes/${id}`
        );

        if (!isMounted) return;

        const agente = resposta.data;

        setNome(agente.nome || "");
        setUsuario(agente.usuario || "");
        setPerfil(agente.perfil || "");

        // FOTO FACIAL
        try {
          const respostaFoto = await api.get(
            `/agentes/${id}/foto`,
            {
              responseType: "blob",
            }
          );

          if (isMounted) {
            objectUrlCarregado =
              URL.createObjectURL(
                respostaFoto.data
              );

            setFotoUrl(objectUrlCarregado);
            setPossuiCadastroFacial(true);
          }
        } catch (errorFoto) {
          if (isMounted) {
            setFotoUrl(null);
            setPossuiCadastroFacial(false);

            if (
              errorFoto.response?.status !== 404
            ) {
              console.error(
                "Erro ao carregar foto:",
                errorFoto
              );
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error(error);

          setErro(
            error.response?.data?.detail ||
              "Não foi possível carregar os dados do agente."
          );
        }
      } finally {
        if (isMounted) {
          setCarregando(false);
        }
      }
    }

    carregarAgente();

    return () => {
      isMounted = false;

      if (objectUrlCarregado) {
        URL.revokeObjectURL(
          objectUrlCarregado
        );
      }
    };
  }, [id]);

  // =========================================
  // LIMPAR PREVIEW DA NOVA FOTO
  // =========================================

  useEffect(() => {
    return () => {
      if (novaFotoPreview) {
        URL.revokeObjectURL(
          novaFotoPreview
        );
      }
    };
  }, [novaFotoPreview]);

  // =========================================
  // SELECIONAR NOVA FOTO
  // =========================================

  function handleFotoChange(event) {
    const arquivo =
      event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
    ];

    if (
      !tiposPermitidos.includes(
        arquivo.type
      )
    ) {
      setErro(
        "Formato de imagem não permitido. Use JPG, JPEG ou PNG."
      );

      event.target.value = "";
      return;
    }

    setErro("");

    if (novaFotoPreview) {
      URL.revokeObjectURL(
        novaFotoPreview
      );
    }

    setNovaFoto(arquivo);

    const url =
      URL.createObjectURL(arquivo);

    setNovaFotoPreview(url);
  }

  // =========================================
  // SALVAR ALTERAÇÕES
  // =========================================

  async function handleSubmit(event) {
    event.preventDefault();

    if (!podeEditar) {
      setErro(
        "Você não tem permissão para editar este agente."
      );
      return;
    }

    setErro("");
    setSalvando(true);

    try {
      // =====================================
      // 1. ATUALIZAR DADOS
      // =====================================

      const dadosAgente = {
        nome: nome.trim(),
        usuario: usuario.trim(),
      };

      // Só envia senha se o usuário digitou
      // uma nova senha.
      if (senha.trim() !== "") {
        dadosAgente.senha = senha;
      }

      await api.put(
        `/agentes/${id}`,
        dadosAgente
      );

      // =====================================
      // 2. ATUALIZAR/CADASTRAR FOTO
      // =====================================

      if (novaFoto) {
        const formData = new FormData();

        formData.append(
          "arquivo",
          novaFoto
        );

        if (possuiCadastroFacial) {
          await api.put(
            `/agentes/${id}/foto`,
            formData
          );
        } else {
          await api.post(
            `/agentes/${id}/foto`,
            formData
          );
        }
      }

      // =====================================
      // 3. ATUALIZAR USUÁRIO LOGADO
      // =====================================

      if (isProprioAgente) {
        const usuarioAtualizado = {
          ...usuarioLogado,
          nome: nome.trim(),
          usuario: usuario.trim(),
        };

        localStorage.setItem(
          "usuario",
          JSON.stringify(
            usuarioAtualizado
          )
        );
      }

      // =====================================
      // 4. VOLTAR PARA DETALHES
      // =====================================

      navigate(`/agentes/${id}`);
    } catch (error) {
      console.error(
        "Erro ao salvar agente:",
        error
      );

      const mensagemErro =
        error.response?.data?.detail ||
        (error.response?.status === 403
          ? "Você não tem permissão para editar este agente."
          : "Não foi possível atualizar o agente.");

      setErro(mensagemErro);
    } finally {
      setSalvando(false);
    }
  }

  // =========================================
  // CARREGANDO
  // =========================================

  if (carregando) {
    return (
      <div className="editar-agente-page">
        <div className="editar-agente-loading">
          Carregando dados do agente...
        </div>
      </div>
    );
  }

  // =========================================
  // ERRO AO CARREGAR
  // =========================================

  if (erro && !nome) {
    return (
      <div className="editar-agente-page">

        <div className="editar-agente-header">
          <div>
            <h1>Editar agente</h1>
            <p>
              Atualize os dados cadastrais.
            </p>
          </div>

          <button
            type="button"
            className="editar-agente-voltar"
            onClick={() =>
              navigate("/agentes")
            }
          >
            Voltar
          </button>
        </div>

        <div className="editar-agente-error">
          {erro}
        </div>

      </div>
    );
  }

  // =========================================
  // SEM PERMISSÃO
  // =========================================

  if (!podeEditar) {
    return (
      <div className="editar-agente-page">

        <div className="editar-agente-header">
          <div>
            <h1>Acesso não permitido</h1>

            <p>
              Você não pode editar este agente.
            </p>
          </div>

          <button
            type="button"
            className="editar-agente-voltar"
            onClick={() =>
              navigate(`/agentes/${id}`)
            }
          >
            Voltar
          </button>
        </div>

        <div className="editar-agente-error">
          Você só pode editar seus próprios
          dados.
        </div>

      </div>
    );
  }

  // =========================================
  // TELA
  // =========================================

  return (
    <div className="editar-agente-page">

      {/* CABEÇALHO */}
      <div className="editar-agente-header">

        <div>
          <h1>Editar agente</h1>

          <p>
            Atualize os dados cadastrais e a
            foto facial.
          </p>
        </div>

        <button
          type="button"
          className="editar-agente-voltar"
          onClick={() =>
            navigate(`/agentes/${id}`)
          }
          disabled={salvando}
        >
          Voltar
        </button>

      </div>

      {/* CARD */}
      <div className="editar-agente-card">

        {erro && (
          <div className="editar-agente-error">
            {erro}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* =================================
              DADOS DO AGENTE
          ================================= */}

          <section className="editar-agente-section">

            <div className="editar-agente-section-header">

              <div>
                <span className="editar-agente-section-label">
                  DADOS DO AGENTE
                </span>

                <h2>
                  Informações de acesso
                </h2>

                <p>
                  Atualize as informações
                  utilizadas para acessar o
                  sistema.
                </p>
              </div>

            </div>

            <div className="editar-agente-form-grid">

              {/* NOME */}

              <div className="editar-agente-form-group editar-agente-full">

                <label htmlFor="nome">
                  Nome
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
                  disabled={salvando}
                />

              </div>

              {/* USUÁRIO */}

              <div className="editar-agente-form-group">

                <label htmlFor="usuario">
                  Usuário
                </label>

                <input
                  id="usuario"
                  type="text"
                  value={usuario}
                  onChange={(event) =>
                    setUsuario(
                      event.target.value
                    )
                  }
                  minLength={3}
                  maxLength={100}
                  required
                  disabled={salvando}
                />

              </div>

              {/* PERFIL */}

              <div className="editar-agente-form-group">

                <label htmlFor="perfil">
                  Perfil
                </label>

                <input
                  id="perfil"
                  type="text"
                  value={perfil}
                  disabled
                />

                <span className="editar-agente-help">
                  O perfil não pode ser
                  alterado nesta tela.
                </span>

              </div>

              {/* NOVA SENHA */}

              <div className="editar-agente-form-group editar-agente-full">

                <label htmlFor="senha">
                  Nova senha
                </label>

                <input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(event) =>
                    setSenha(
                      event.target.value
                    )
                  }
                  minLength={6}
                  maxLength={100}
                  placeholder="Digite apenas se quiser alterar"
                  disabled={salvando}
                />

                <span className="editar-agente-help">
                  Deixe em branco para manter
                  a senha atual.
                </span>

              </div>

            </div>

          </section>

          {/* =================================
              FOTO FACIAL
          ================================= */}

          <section className="editar-agente-section">

            <div className="editar-agente-section-header">

              <div>
                <span className="editar-agente-section-label">
                  IDENTIFICAÇÃO
                </span>

                <h2>
                  Foto facial
                </h2>

                <p>
                  {possuiCadastroFacial
                    ? "Atualize a foto facial cadastrada."
                    : "Este agente ainda não possui uma foto facial cadastrada."}
                </p>
              </div>

            </div>

            <div className="editar-agente-foto-area">

              <div className="editar-agente-foto-input">

                <label htmlFor="foto">
                  {possuiCadastroFacial
                    ? "Alterar foto facial"
                    : "Cadastrar foto facial"}
                </label>

                <input
                  id="foto"
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFotoChange}
                  disabled={salvando}
                />

                <span className="editar-agente-help">
                  Selecione uma imagem JPG ou
                  PNG.
                </span>

              </div>

              {/* FOTO */}
              <div className="editar-agente-foto-preview">

                {novaFotoPreview ? (
                  <img
                    src={novaFotoPreview}
                    alt="Nova foto selecionada"
                  />
                ) : fotoUrl ? (
                  <img
                    src={fotoUrl}
                    alt={`Foto de ${nome}`}
                  />
                ) : (
                  <div className="editar-agente-sem-foto">
                    Sem foto
                  </div>
                )}

              </div>

            </div>

          </section>

          {/* =================================
              AÇÕES
          ================================= */}

          <div className="editar-agente-actions">

            <button
              type="button"
              className="button-secondary"
              onClick={() =>
                navigate(`/agentes/${id}`)
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

export default EditarAgente;