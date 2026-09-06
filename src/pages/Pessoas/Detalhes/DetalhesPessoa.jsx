import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import { formatarCPF } from "../../../utils/formatarCPF";
import { formatarTelefone } from "../../../utils/formatarTelefone";
import { formatarData } from "../../../utils/formatarData";
import { formatarCEP } from "../../../utils/formatarCEP";

import "./DetalhesPessoa.css";

function DetalhesPessoa() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [pessoa, setPessoa] = useState(null);
  const [telefones, setTelefones] = useState([]);
  const [passagens, setPassagens] = useState([]);
  const [endereco, setEndereco] = useState(null);

  const [fotos, setFotos] = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const fotosUrlsRef = useRef([]);

  // LIMPAR URLS DAS FOTOS
  function limparUrlsFotos() {
    fotosUrlsRef.current.forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url);
      }
    });

    fotosUrlsRef.current = [];
  }

  // CARREGAR FOTOS
  async function carregarFotos() {
    setCarregandoFotos(true);

    limparUrlsFotos();

    try {
      const respostaFotos = await api.get(
        `/fotos/pessoa/${id}`
      );

      const fotosCadastradas = respostaFotos.data;

      if (!Array.isArray(fotosCadastradas) || fotosCadastradas.length === 0) {
        setFotos([]);
        return;
      }

      // Ordenar da mais recente para a mais antiga
      const fotosOrdenadas = [...fotosCadastradas].sort(
        (a, b) =>
          new Date(b.data_upload) -
          new Date(a.data_upload)
      );

      const fotosComUrl = await Promise.all(
        fotosOrdenadas.map(async (foto) => {
          try {
            const respostaArquivo = await api.get(
              `/fotos/${foto.id}/arquivo`,
              {
                responseType: "blob",
              }
            );

            const url = URL.createObjectURL(
              respostaArquivo.data
            );

            fotosUrlsRef.current.push(url);

            return {
              ...foto,
              url,
            };
          } catch (error) {
            console.error(
              `Erro ao carregar foto ${foto.id}:`,
              error
            );

            return null;
          }
        })
      );

      setFotos(
        fotosComUrl.filter(Boolean)
      );
    } catch (error) {
      console.error(
        "Erro ao carregar fotos:",
        error
      );

      setFotos([]);
    } finally {
      setCarregandoFotos(false);
    }
  }

  async function carregarPessoa() {
    setCarregando(true);
    setErro("");

    try {
      // Buscar dados da pessoa
      const respostaPessoa = await api.get(
        `/pessoas/${id}`
      );

      setPessoa(respostaPessoa.data);

      // Buscar telefones
      try {
        const respostaTelefones = await api.get(
          `/telefones/pessoa/${id}`
        );

        setTelefones(respostaTelefones.data);
      } catch (error) {
        console.error(
          "Erro ao carregar telefones:",
          error
        );

        setTelefones([]);
      }

      // Buscar endereço
      try {
        const respostaEndereco = await api.get(
          `/enderecos/pessoa/${id}`
        );

        const enderecos = respostaEndereco.data;

        if (
          Array.isArray(enderecos) &&
          enderecos.length > 0
        ) {
          setEndereco(enderecos[0]);
        } else {
          setEndereco(null);
        }
      } catch (error) {
        console.error(
          "Erro ao carregar endereço:",
          error
        );

        setEndereco(null);
      }

      // Buscar passagens criminais
      try {
        const respostaPassagens = await api.get(
          `/passagens/pessoa/${id}`
        );

        setPassagens(respostaPassagens.data);
      } catch (error) {
        console.error(
          "Erro ao carregar passagens:",
          error
        );

        setPassagens([]);
      }

      // Buscar fotos
      await carregarFotos();
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

    return () => {
      limparUrlsFotos();
    };
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

        <div className="detalhes-error">
          {erro}
        </div>
      </div>
    );
  }

  return (
    <div className="detalhes-pessoa-page">
      {/* CABEÇALHO */}
      <div className="detalhes-header">
        <div>
          <h1>{pessoa.nome}</h1>

          <p>
            Dados completos do cadastro da pessoa
          </p>
        </div>

        <button
          className="detalhes-voltar"
          onClick={() => navigate("/pessoas")}
        >
          Voltar
        </button>
      </div>

      {/* FOTOS */}
      <section className="detalhes-card detalhes-fotos-section">
        <div className="detalhes-section-header">
          <div>
            <h2>Fotos cadastradas</h2>

            <p>
              Fotos vinculadas à pessoa no sistema.
            </p>
          </div>
        </div>

        {carregandoFotos ? (
          <div className="detalhes-vazio">
            Carregando fotos...
          </div>
        ) : fotos.length === 0 ? (
          <div className="detalhes-vazio">
            Nenhuma foto cadastrada.
          </div>
        ) : (
          <div className="detalhes-fotos-grid">
            {fotos.map((foto) => (
              <div
                className="detalhes-foto-item"
                key={foto.id}
              >
                <img
                  src={foto.url}
                  alt={`Foto de ${pessoa.nome}`}
                  className="detalhes-foto"
                />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* DADOS CADASTRAIS */}
      <section className="detalhes-card">
        <div className="detalhes-section-header">
          <div>
            <h2>Dados cadastrais</h2>

            <p>
              Informações pessoais cadastradas.
            </p>
          </div>
        </div>

        <div className="detalhes-grid">
          <div className="detalhes-field">
            <span>Nome</span>

            <strong>
              {pessoa.nome}
            </strong>
          </div>

          <div className="detalhes-field">
            <span>CPF</span>

            <strong>
              {formatarCPF(pessoa.cpf)}
            </strong>
          </div>

          <div className="detalhes-field">
            <span>Data de nascimento</span>

            <strong>
              {formatarData(
                pessoa.data_nascimento
              )}
            </strong>
          </div>

          <div className="detalhes-field">
            <span>Sexo</span>

            <strong>
              {pessoa.sexo === "M"
                ? "Masculino"
                : pessoa.sexo === "F"
                  ? "Feminino"
                  : pessoa.sexo}
            </strong>
          </div>

          <div className="detalhes-field">
            <span>Nome da mãe</span>

            <strong>
              {pessoa.nome_mae}
            </strong>
          </div>

          <div className="detalhes-field">
            <span>Nome do pai</span>

            <strong>
              {pessoa.nome_pai}
            </strong>
          </div>
        </div>
      </section>

      {/* TELEFONES */}
      <section className="detalhes-card detalhes-lista-section">
        <div className="detalhes-section-header">
          <div>
            <h2>Telefones</h2>

            <p>
              Telefones vinculados à pessoa.
            </p>
          </div>
        </div>

        {telefones.length === 0 ? (
          <div className="detalhes-vazio">
            Nenhum telefone cadastrado.
          </div>
        ) : (
          <div className="detalhes-lista">
            {telefones.map((telefone) => (
              <div
                className="detalhes-lista-item"
                key={telefone.id}
              >
                <div>
                  <span className="detalhes-item-label">
                    Número
                  </span>

                  <strong>
                    {formatarTelefone(
                      telefone.numero
                    )}
                  </strong>
                </div>

                <div>
                  <span className="detalhes-item-label">
                    Tipo
                  </span>

                  <strong>
                    {telefone.tipo === "PESSOAL"
                      ? "Pessoal"
                      : telefone.tipo === "RESIDENCIAL"
                        ? "Residencial"
                        : telefone.tipo}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ENDEREÇO */}
      <section className="detalhes-card detalhes-lista-section">
        <div className="detalhes-section-header">
          <div>
            <h2>Endereço</h2>

            <p>
              Endereço residencial vinculado à pessoa.
            </p>
          </div>
        </div>

        {!endereco ? (
          <div className="detalhes-vazio">
            Nenhum endereço cadastrado.
          </div>
        ) : (
          <div className="detalhes-grid">
            <div className="detalhes-field">
              <span>Logradouro</span>

              <strong>
                {endereco.logradouro}
              </strong>
            </div>

            <div className="detalhes-field">
              <span>Número</span>

              <strong>
                {endereco.numero}
              </strong>
            </div>

            <div className="detalhes-field">
              <span>Bairro</span>

              <strong>
                {endereco.bairro}
              </strong>
            </div>

            <div className="detalhes-field">
              <span>Cidade</span>

              <strong>
                {endereco.cidade}
              </strong>
            </div>

            <div className="detalhes-field">
              <span>Estado</span>

              <strong>
                {endereco.estado}
              </strong>
            </div>

            <div className="detalhes-field">
              <span>CEP</span>

              <strong>
                {formatarCEP(endereco.cep)}
              </strong>
            </div>
          </div>
        )}
      </section>

      {/* PASSAGENS CRIMINAIS */}
      <section className="detalhes-card detalhes-lista-section">
        <div className="detalhes-section-header">
          <div>
            <h2>Passagens criminais</h2>

            <p>
              Registros vinculados à pessoa.
            </p>
          </div>
        </div>

        {passagens.length === 0 ? (
          <div className="detalhes-vazio">
            Nenhuma passagem criminal cadastrada.
          </div>
        ) : (
          <div className="detalhes-lista">
            {passagens.map((passagem) => (
              <div
                className="detalhes-lista-item"
                key={passagem.id}
              >
                <div>
                  <span className="detalhes-item-label">
                    Crime
                  </span>

                  <strong>
                    {passagem.crime}
                  </strong>
                </div>

                <div>
                  <span className="detalhes-item-label">
                    Data da ocorrência
                  </span>

                  <strong>
                    {formatarData(
                      passagem.data_ocorrencia
                    )}
                  </strong>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

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
          onClick={() =>
            navigate(
              `/pessoas/${pessoa.id}/editar`
            )
          }
        >
          Editar pessoa
        </button>
      </div>
    </div>
  );
}

export default DetalhesPessoa;