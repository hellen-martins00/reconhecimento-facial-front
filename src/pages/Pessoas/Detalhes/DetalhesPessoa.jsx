import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import "./DetalhesPessoa.css";

function DetalhesPessoa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pessoa, setPessoa] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [fotoUrl, setFotoUrl] = useState(null);

  async function carregarPessoa() {
    setCarregando(true);
    setErro("");

    try {
      const resposta = await api.get(`/pessoas/${id}`);
      const pessoaDados = resposta.data;

      setPessoa(pessoaDados);

      // Buscar fotos da pessoa
      try {
        const respostaFotos = await api.get(`/fotos/pessoa/${id}`);
        const fotos = respostaFotos.data;

        if (fotos.length > 0) {
          // Ordenação por segurança no frontend caso a API não ordene
          const fotosOrdenadas = [...fotos].sort(
            (a, b) => new Date(b.data_upload) - new Date(a.data_upload)
          );

          const fotoMaisRecente = fotosOrdenadas[0];

          const respostaFoto = await api.get(
            `/fotos/${fotoMaisRecente.id}/arquivo`,
            {
              responseType: "blob",
            }
          );

          const url = URL.createObjectURL(respostaFoto.data);
          setFotoUrl(url);
        } else {
          setFotoUrl(null);
        }
      } catch (error) {
        console.error("Erro ao carregar foto:", error);
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

  if (carregando) {
    return (
      <div className="detalhes-pessoa-page">
        <div className="detalhes-loading">
          Carregando dados da pessoa...
        </div>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="detalhes-pessoa-page">
        <div className="detalhes-header">
          <div>
            <h1>Pessoa</h1>
            <p>Detalhes do cadastro</p>
          </div>

          <button
            className="detalhes-voltar"
            onClick={() => navigate("/pessoas")}
          >
            Voltar
          </button>
        </div>

        <div className="detalhes-error">{erro}</div>
      </div>
    );
  }

  return (
    <div className="detalhes-pessoa-page">
      {/* CABEÇALHO */}
      <div className="detalhes-header">
        <div>
          <h1>{pessoa.nome}</h1>
          <p>Dados cadastrais da pessoa</p>
        </div>
      </div>

      {/* FOTO */}
      {fotoUrl && (
        <div className="detalhes-foto-container">
          <img
            src={fotoUrl}
            alt={`Foto de ${pessoa.nome}`}
            className="detalhes-foto"
          />
        </div>
      )}

      {/* DADOS */}
      <div className="detalhes-card">
        <div className="detalhes-grid">
          <div className="detalhes-field">
            <span>Nome</span>
            <strong>{pessoa.nome}</strong>
          </div>

          <div className="detalhes-field">
            <span>CPF</span>
            <strong>{pessoa.cpf}</strong>
          </div>

          <div className="detalhes-field">
            <span>Data de nascimento</span>
            <strong>{pessoa.data_nascimento}</strong>
          </div>

          <div className="detalhes-field">
            <span>Sexo</span>
            <strong>{pessoa.sexo}</strong>
          </div>

          <div className="detalhes-field">
            <span>Nome da mãe</span>
            <strong>{pessoa.nome_mae}</strong>
          </div>

          <div className="detalhes-field">
            <span>Nome do pai</span>
            <strong>{pessoa.nome_pai}</strong>
          </div>
        </div>

        {/* AÇÕES */}
        <div className="detalhes-actions">
          <button
            className="button-secondary"
            onClick={() => navigate("/pessoas")}
          >
            Voltar
          </button>

          <button
            className="button-primary"
            onClick={() => navigate(`/pessoas/${pessoa.id}/editar`)}
          >
            Editar pessoa
          </button>
        </div>
      </div>
    </div>
  );
}

export default DetalhesPessoa;