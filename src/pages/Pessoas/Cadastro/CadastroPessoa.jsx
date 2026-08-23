import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../../services/api";

import "./CadastroPessoa.css";

function CadastroPessoa() {
  const navigate = useNavigate();

  const [nome, setNome] = useState("");
  const [cpf, setCpf] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [sexo, setSexo] = useState("");
  const [nomeMae, setNomeMae] = useState("");
  const [nomePai, setNomePai] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      await api.post("/pessoas", {
        nome,
        cpf,
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,
      });

      navigate("/pessoas");
    } catch (error) {
      console.error(error);
      setErro(
        error.response?.data?.detail ||
          "Não foi possível cadastrar a pessoa."
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="cadastro-pessoa-page">
      {/* CABEÇALHO */}
      <div className="cadastro-pessoa-header">
        <div>
          <h1>Nova pessoa</h1>
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

      {/* CARD DO FORMULÁRIO */}
      <div className="cadastro-pessoa-card">
        {erro && <div className="cadastro-error">{erro}</div>}

        <form onSubmit={handleSubmit}>
          {/* NOME */}
          <div className="form-group">
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Digite o nome completo"
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
              placeholder="Digite o CPF"
              maxLength={11}
              required
            />
            <span className="form-help">
              Informe apenas os 11 números do CPF.
            </span>
          </div>

          {/* DATA DE NASCIMENTO E SEXO */}
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
              placeholder="Digite o nome da mãe"
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
              placeholder="Digite o nome do pai"
              required
            />
          </div>

          {/* BOTÕES DE AÇÃO */}
          <div className="cadastro-actions">
            <button
              type="button"
              className="button-secondary"
              onClick={() => navigate("/pessoas")}
              disabled={carregando}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="button-primary"
              disabled={carregando}
            >
              {carregando ? "Cadastrando..." : "Cadastrar pessoa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CadastroPessoa;