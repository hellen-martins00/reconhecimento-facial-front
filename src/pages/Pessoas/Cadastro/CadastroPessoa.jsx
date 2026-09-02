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

  const [telefones, setTelefones] = useState([
    {
      numero: "",
      tipo: "PESSOAL",
    },
  ]);

  const [passagens, setPassagens] = useState([]);

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
      telefones.filter((_, telefoneIndex) => telefoneIndex !== index)
    );
  }

  function alterarTelefone(index, campo, valor) {
    const novosTelefones = [...telefones];

    novosTelefones[index][campo] = valor;

    setTelefones(novosTelefones);
  }

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
      passagens.filter((_, passagemIndex) => passagemIndex !== index)
    );
  }

  function alterarPassagem(index, campo, valor) {
    const novasPassagens = [...passagens];

    novasPassagens[index][campo] = valor;

    setPassagens(novasPassagens);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      // 1. Criar pessoa
      const respostaPessoa = await api.post("/pessoas", {
        nome,
        cpf,
        data_nascimento: dataNascimento,
        sexo,
        nome_mae: nomeMae,
        nome_pai: nomePai,
      });

      const pessoaCriada = respostaPessoa.data;

      // 2. Filtrar telefones preenchidos
      const telefonesValidos = telefones.filter(
        (telefone) => telefone.numero.trim() !== ""
      );

      // 3. Criar telefones
      await Promise.all(
        telefonesValidos.map((telefone) =>
          api.post("/telefones", {
            pessoa_id: pessoaCriada.id,
            numero: telefone.numero,
            tipo: telefone.tipo,
          })
        )
      );

      // 4. Filtrar apenas passagens preenchidas
      const passagensValidas = passagens.filter(
        (passagem) =>
          passagem.crime.trim() !== "" &&
          passagem.data_ocorrencia !== ""
      );

      // 5. Criar passagens criminais
      await Promise.all(
        passagensValidas.map((passagem) =>
          api.post("/passagens", {
            pessoa_id: pessoaCriada.id,
            crime: passagem.crime,
            data_ocorrencia: passagem.data_ocorrencia,
          })
        )
      );

      // 4. Voltar para pessoas
      navigate("/pessoas");

    } catch (error) {
      console.error("ERRO COMPLETO:", error);
      console.error("RESPOSTA DA API:", error.response?.data);

      const detalhe = error.response?.data?.detail;

      if (Array.isArray(detalhe)) {
        setErro(
          detalhe
            .map((erro) => `${erro.loc?.join(" → ")}: ${erro.msg}`)
            .join(" | ")
        );
      } else if (typeof detalhe === "string") {
        setErro(detalhe);
      } else {
        setErro("Não foi possível cadastrar a pessoa.");
      }


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

      {/* CARD */}
      <div className="cadastro-pessoa-card">

        {erro && (
          <div className="cadastro-error">
            {erro}
          </div>
        )}

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

          {/* TELEFONES */}
          <section className="telefones-section">

            <div className="telefones-header">

              <div>
                <h3>Telefones</h3>

                <p>
                  Adicione um ou mais telefones vinculados à pessoa.
                </p>
              </div>

              <button
                type="button"
                className="adicionar-telefone-button"
                onClick={adicionarTelefone}
              >
                + Adicionar telefone
              </button>

            </div>

            <div className="telefones-lista">

              {telefones.map((telefone, index) => (

                <div
                  className="telefone-item"
                  key={index}
                >

                  <div className="telefone-item-header">
                    <span>
                      Telefone {index + 1}
                    </span>

                    {telefones.length > 1 && (
                      <button
                        type="button"
                        className="remover-telefone-mobile"
                        onClick={() => removerTelefone(index)}
                      >
                        Remover
                      </button>
                    )}
                  </div>

                  <div className="telefone-fields">

                    <div className="form-group">
                      <label>Número</label>

                      <input
                        type="text"
                        value={telefone.numero}
                        onChange={(event) =>
                          alterarTelefone(
                            index,
                            "numero",
                            event.target.value
                          )
                        }
                        placeholder="Digite o telefone"
                      />
                    </div>

                    <div className="form-group">
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
                        <option value="PESSOAL">
                          Pessoal
                        </option>

                        <option value="RESIDENCIAL">
                          Residencial
                        </option>
                      </select>
                    </div>

                    {telefones.length > 1 && (
                      <button
                        type="button"
                        className="remover-telefone-button"
                        onClick={() => removerTelefone(index)}
                      >
                        Remover
                      </button>
                    )}

                  </div>

                </div>

              ))}

            </div>

          </section>

          {/* PASSAGENS CRIMINAIS */}
          <section className="passagens-section">

            <div className="passagens-header">

              <div>
                <h3>Passagens criminais</h3>

                <p>
                  Adicione passagens criminais vinculadas à pessoa, caso existam.
                </p>
              </div>

              <button
                type="button"
                className="adicionar-passagem-button"
                onClick={adicionarPassagem}
              >
                + Adicionar passagem
              </button>

            </div>

            <div className="passagens-lista">

              {passagens.map((passagem, index) => (

                <div
                  className="passagem-item"
                  key={index}
                >

                  <div className="passagem-item-header">

                    <span>
                      Passagem {index + 1}
                    </span>

                    {passagens.length > 1 && (
                      <button
                        type="button"
                        className="remover-passagem-mobile"
                        onClick={() => removerPassagem(index)}
                      >
                        Remover
                      </button>
                    )}

                  </div>

                  <div className="passagem-fields">

                    <div className="form-group">

                      <label>Crime</label>

                      <input
                        type="text"
                        value={passagem.crime}
                        onChange={(event) =>
                          alterarPassagem(
                            index,
                            "crime",
                            event.target.value
                          )
                        }
                        placeholder="Ex.: Furto"
                      />

                    </div>

                    <div className="form-group">

                      <label>Data da ocorrência</label>

                      <input
                        type="date"
                        value={passagem.data_ocorrencia}
                        onChange={(event) =>
                          alterarPassagem(
                            index,
                            "data_ocorrencia",
                            event.target.value
                          )
                        }
                      />

                    </div>

                    {passagens.length > 1 && (
                      <button
                        type="button"
                        className="remover-passagem-button"
                        onClick={() => removerPassagem(index)}
                      >
                        Remover
                      </button>
                    )}

                  </div>

                </div>

              ))}

            </div>

          </section>

          {/* DATA E SEXO */}
          <div className="form-row">

            <div className="form-group">
              <label htmlFor="dataNascimento">
                Data de nascimento
              </label>

              <input
                id="dataNascimento"
                type="date"
                value={dataNascimento}
                onChange={(event) =>
                  setDataNascimento(event.target.value)
                }
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="sexo">Sexo</label>

              <select
                id="sexo"
                value={sexo}
                onChange={(event) =>
                  setSexo(event.target.value)
                }
                required
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

          </div>

          {/* MÃE */}
          <div className="form-group">
            <label htmlFor="nomeMae">
              Nome da mãe
            </label>

            <input
              id="nomeMae"
              type="text"
              value={nomeMae}
              onChange={(event) =>
                setNomeMae(event.target.value)
              }
              placeholder="Digite o nome da mãe"
              required
            />
          </div>

          {/* PAI */}
          <div className="form-group">
            <label htmlFor="nomePai">
              Nome do pai
            </label>

            <input
              id="nomePai"
              type="text"
              value={nomePai}
              onChange={(event) =>
                setNomePai(event.target.value)
              }
              placeholder="Digite o nome do pai"
              required
            />
          </div>

          {/* AÇÕES */}
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
              {carregando
                ? "Cadastrando..."
                : "Cadastrar pessoa"}
            </button>

          </div>

        </form>

      </div>

    </div>
  );
}

export default CadastroPessoa;