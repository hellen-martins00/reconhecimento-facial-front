import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import "./CadastroAgente.css";

function CadastroAgente() {
  const navigate = useNavigate();

  // USUÁRIO LOGADO
  const usuarioSalvo = localStorage.getItem("usuario");
  let usuarioLogado = null;

  try {
    usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
  } catch (error) {
    console.error("Erro ao recuperar usuário:", error);
  }

  const isAdmin = usuarioLogado?.perfil === "ADMIN";

  // ESTADOS
  const [nome, setNome] = useState("");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [foto, setFoto] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // LIMPAR URL DA FOTO AO SAIR
  useEffect(() => {
    return () => {
      if (fotoPreview) {
        URL.revokeObjectURL(fotoPreview);
      }
    };
  }, [fotoPreview]);

  // FOTO
  function handleFotoChange(event) {
    const arquivo = event.target.files[0];

    if (!arquivo) {
      return;
    }

    // Liberar preview anterior
    if (fotoPreview) {
      URL.revokeObjectURL(fotoPreview);
    }

    setFoto(arquivo);

    const url = URL.createObjectURL(arquivo);
    setFotoPreview(url);
  }

  // CADASTRAR AGENTE
  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSalvando(true);

    try {
      // 1. CRIAR AGENTE
      const resposta = await api.post("/agentes", {
        nome,
        usuario,
        senha,
      });

      const agente = resposta.data;

      // 2. CADASTRAR FOTO, SE INFORMADA
      if (foto) {
        try {
          const formData = new FormData();
          formData.append("arquivo", foto);

          await api.post(`/agentes/${agente.id}/foto`, formData);
        } catch (errorFoto) {
          /*
           * A falha da foto NÃO impede
           * o cadastro do agente.
           */
          console.error(
            "Agente cadastrado, mas houve erro ao cadastrar a foto:",
            errorFoto
          );
        }
      }

      // 3. IR PARA OS DETALHES
      navigate(`/agentes/${agente.id}`);
    } catch (error) {
      console.error(error);

      setErro(
        error.response?.data?.detail ||
          "Não foi possível cadastrar o agente."
      );
    } finally {
      setSalvando(false);
    }
  }

  // PROTEÇÃO FRONTEND
  if (!isAdmin) {
    return (
      <div className="cadastro-agente-page">
        <div className="cadastro-agente-header">
          <div>
            <h1>Acesso negado</h1>
            <p>Apenas administradores podem cadastrar novos agentes.</p>
          </div>

          <button
            type="button"
            className="cadastro-agente-voltar"
            onClick={() => navigate("/agentes")}
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  // TELA
  return (
    <div className="cadastro-agente-page">
      {/* CABEÇALHO */}
      <div className="cadastro-agente-header">
        <div>
          <h1>Novo agente</h1>
          <p>Cadastre um novo agente no sistema.</p>
        </div>

        <button
          type="button"
          className="cadastro-agente-voltar"
          onClick={() => navigate("/agentes")}
          disabled={salvando}
        >
          Voltar
        </button>
      </div>

      {/* CARD */}
      <div className="cadastro-agente-card">
        {erro && <div className="cadastro-agente-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          {/* NOME */}
          <div className="form-group">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              minLength={3}
              maxLength={150}
              required
              disabled={salvando}
            />
          </div>

          {/* USUÁRIO */}
          <div className="form-group">
            <label htmlFor="usuario">Usuário</label>
            <input
              id="usuario"
              type="text"
              value={usuario}
              onChange={(event) => setUsuario(event.target.value)}
              minLength={3}
              maxLength={100}
              required
              disabled={salvando}
            />
            <span className="form-help">
              Informe o usuário utilizado para acessar o sistema.
            </span>
          </div>

          {/* SENHA */}
          <div className="form-group">
            <label htmlFor="senha">Senha</label>
            <input
              id="senha"
              type="password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              minLength={6}
              maxLength={100}
              required
              disabled={salvando}
            />
            <span className="form-help">
              A senha deve possuir pelo menos 6 caracteres.
            </span>
          </div>

          {/* FOTO */}
          <div className="form-group">
            <label htmlFor="foto">Foto facial</label>
            <input
              id="foto"
              type="file"
              accept="image/jpeg,image/png"
              onChange={handleFotoChange}
              disabled={salvando}
            />
            <span className="form-help">
              A foto é opcional. Caso não seja cadastrada agora, poderá ser
              adicionada posteriormente.
            </span>
          </div>

          {/* PREVIEW */}
          {fotoPreview && (
            <div className="cadastro-agente-foto-preview">
              <img
                src={fotoPreview}
                alt={`Pré-visualização de ${nome}`}
              />
            </div>
          )}

          {/* AÇÕES */}
          <div className="cadastro-agente-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/agentes")}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button-primary"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Cadastrar agente"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CadastroAgente;