import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import "./EditarPessoa.css";

function EditarPessoa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [nomePai, setNomePai] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  const [fotoUrl, setFotoUrl] = useState(null);
  const [novaFoto, setNovaFoto] = useState(null);

  async function carregarPessoa() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await api.get(`/pessoas/${id}`);
      const pessoa = resposta.data;

      setNome(pessoa.nome);
      setCpf(pessoa.cpf);
      setDataNascimento(pessoa.data_nascimento);
      setSexo(pessoa.sexo);
      setNomeMae(pessoa.nome_mae);
      setNomePai(pessoa.nome_pai);

      // Buscar a foto mais recente da pessoa
      try {
        const respostaFoto = await api.get(
          `/fotos/pessoa/${id}/mais-recente/arquivo`,
          {
            responseType: "blob",
          }
        );

        const url = URL.createObjectURL(respostaFoto.data);
        setFotoUrl(url);
      } catch (error) {
        // 404 significa que a pessoa ainda não possui foto
        if (error.response?.status !== 404) {
          console.error("Erro ao carregar foto:", error);
        }
        setFotoUrl(null);
      }
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.detail ||
          "Não foi possível carregar os dados da pessoa."
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPessoa();
  }, [id]);

  function selecionarFoto(event) {
    const arquivo = event.target.files?.[0];

    if (!arquivo) {
      return;
    }

    setNovaFoto(arquivo);

    // Mostra imediatamente a nova foto na tela
    const url = URL.createObjectURL(arquivo);
    setFotoUrl(url);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setSalvando(true);

    try {
      // 1. Atualizar dados da pessoa
      await api.put(`/pessoas/${id}`, {
        nome,
        cpf,
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,
      });

      // 2. Se escolheu uma nova foto, cadastrar
      // uma nova foto para a pessoa
      if (novaFoto) {
        const formData = new FormData();
        formData.append("arquivo", novaFoto);

        await api.post(`/fotos?pessoa_id=${id}`, formData);
      }

      navigate(`/pessoas/${id}`);
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.detail ||
          "Não foi possível atualizar a pessoa."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="editar-pessoa-page">
        <div className="editar-loading">Carregando dados da pessoa...</div>
      </div>
    );
  }

  if (erro && !nome) {
    return (
      <div className="editar-pessoa-page">
        <div className="editar-header">
          <div>
            <h1>Editar pessoa</h1>
            <p>Atualize os dados cadastrais.</p>
          </div>

          <button
            className="editar-voltar"
            onClick={() => navigate("/pessoas")}
          >
            Voltar
          </button>
        </div>

        <div className="editar-error">{erro}</div>
      </div>
    );
  }

  return (
    <div className="editar-pessoa-page">
      {/* CABEÇALHO */}
      <div className="editar-header">
        <div>
          <h1>Editar pessoa</h1>
          <p>Atualize os dados cadastrais da pessoa.</p>
        </div>

        <button
          type="button"
          className="editar-voltar"
          onClick={() => navigate(`/pessoas/${id}`)}
        >
          Voltar
        </button>
      </div>

      {/* FORMULÁRIO */}
      <div className="editar-pessoa-card">
        <div className="editar-foto-container">
          {fotoUrl ? (
            <img
              src={fotoUrl}
              alt={`Foto de ${nome}`}
              className="editar-foto"
            />
          ) : (
            <div className="editar-sem-foto">Sem foto</div>
          )}

          <label htmlFor="novaFoto" className="editar-foto-button">
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

        {erro && <div className="editar-error">{erro}</div>}

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
            />
          </div>

          {/* CPF */}
          <div className="form-group">
            <label htmlFor="cpf">CPF</label>
            <input
              id="cpf"
              type="text"
              value={cpf}
              onChange={(event) => setCpf(event.target.value)}
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
              <label htmlFor="dataNascimento">Data de nascimento</label>
              <input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(event) => setDataNascimento(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sexo">Sexo</label>
              <select
                id="sexo"
                value={sexo}
                onChange={(event) => setSexo(event.target.value)}
                required
              >
                <option value="">Selecione</option>
                <option value="M">Masculino</option>
                <option value="F">Feminino</option>
              </select>
            </div>
          </div>

          {/* MÃE */}
          <div className="form-group">
            <label htmlFor="nomeMae">Nome da mãe</label>
            <input
              id="nomeMae"
              type="text"
              value={nomeMae}
              onChange={(event) => setNomeMae(event.target.value)}
              required
            />
          </div>

          {/* PAI */}
          <div className="form-group">
            <label htmlFor="nomePai">Nome do pai</label>
            <input
              id="nomePai"
              type="text"
              value={nomePai}
              onChange={(event) => setNomePai(event.target.value)}
              required
            />
          </div>

          {/* BOTÕES */}
          <div className="editar-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate(`/pessoas/${id}`)}
              disabled={salvando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button-primary"
              disabled={salvando}
            >
              {salvando ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditarPessoa;