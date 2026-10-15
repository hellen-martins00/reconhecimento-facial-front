
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import "./Reconhecimento.css";

const TAMANHO_MAXIMO_IMAGEM = 10 * 1024 * 1024;
const TIPOS_IMAGEM = ["image/jpeg", "image/png"];

function Reconhecimento() {
  const navigate = useNavigate();

  // REFS
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fotosUrlsRef = useRef([]);
  const arquivoInputRef = useRef(null);

  // ESTADOS
  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [imagemCapturada, setImagemCapturada] = useState(null);
  const [resultado, setResultado] = useState(null);

  const [fotosPessoa, setFotosPessoa] = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);

  const [registroDesaparecimento, setRegistroDesaparecimento] =
    useState(null);

  const [carregandoDesaparecimento, setCarregandoDesaparecimento] =
    useState(false);

  const [reconhecendo, setReconhecendo] = useState(false);
  const [erro, setErro] = useState("");

  // LIMPAR URLS DAS FOTOS CADASTRADAS
  function limparUrlsFotos() {
    fotosUrlsRef.current.forEach((url) => {
      URL.revokeObjectURL(url);
    });

    fotosUrlsRef.current = [];
  }

  // INICIAR CÂMERA
  async function iniciarCamera() {
    setErro("");

    if (streamRef.current) {
      pararCamera();
    }

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia
    ) {
      setErro(
        "Este navegador não permite acesso à câmera."
      );
      return;
    }

    try {
      const mediaStream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 1280 },
            height: { ideal: 960 },
          },
          audio: false,
        });

      streamRef.current = mediaStream;
      setCameraAtiva(true);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);

      setCameraAtiva(false);

      if (error.name === "NotAllowedError") {
        setErro(
          "A permissão para acessar a câmera foi negada. Autorize o uso da câmera no navegador e tente novamente."
        );
      } else if (error.name === "NotFoundError") {
        setErro(
          "Nenhuma câmera foi encontrada neste dispositivo."
        );
      } else {
        setErro(
          "Não foi possível acessar a câmera. Verifique as permissões do navegador."
        );
      }
    }
  }

  // VINCULAR CÂMERA AO VÍDEO
  useEffect(() => {
    if (
      !cameraAtiva ||
      !videoRef.current ||
      !streamRef.current
    ) {
      return;
    }

    const video = videoRef.current;
    video.srcObject = streamRef.current;

    video.play().catch((error) => {
      console.error("Erro ao reproduzir câmera:", error);
    });
  }, [cameraAtiva]);

  // PARAR CÂMERA
  function pararCamera() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAtiva(false);
  }

  // LIMPAR RESULTADOS ANTERIORES
  function limparResultadoAnterior() {
    limparUrlsFotos();
    setFotosPessoa([]);
    setResultado(null);
    setRegistroDesaparecimento(null);
    setCarregandoDesaparecimento(false);
  }

  // CAPTURAR FOTO PELA CÂMERA
  function capturarFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      setErro("Não foi possível acessar a câmera.");
      return;
    }

    if (
      video.readyState < 2 ||
      video.videoWidth === 0 ||
      video.videoHeight === 0
    ) {
      setErro(
        "A câmera ainda não está pronta. Aguarde um instante e tente novamente."
      );
      return;
    }

    const largura = video.videoWidth;
    const altura = video.videoHeight;

    canvas.width = largura;
    canvas.height = altura;

    const contexto = canvas.getContext("2d");

    if (!contexto) {
      setErro("Não foi possível processar a imagem.");
      return;
    }

    contexto.drawImage(video, 0, 0, largura, altura);

    const imagem = canvas.toDataURL("image/jpeg", 0.9);

    if (!imagem || !imagem.startsWith("data:image/")) {
      setErro(
        "Não foi possível capturar a imagem. Tente novamente."
      );
      return;
    }

    limparResultadoAnterior();
    setImagemCapturada(imagem);
    setErro("");

    pararCamera();
  }

  // ABRIR SELETOR DE ARQUIVOS
  function abrirSeletorImagem() {
    if (reconhecendo) return;

    setErro("");
    arquivoInputRef.current?.click();
  }

  // SELECIONAR IMAGEM DO COMPUTADOR OU CELULAR
  function selecionarImagem(event) {
    const arquivo = event.target.files?.[0];

    // Permite selecionar o mesmo arquivo novamente depois.
    event.target.value = "";

    if (!arquivo) return;

    setErro("");

    if (!TIPOS_IMAGEM.includes(arquivo.type)) {
      setErro(
        "Formato inválido. Selecione uma imagem JPG, JPEG ou PNG."
      );
      return;
    }

    if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
      setErro(
        "A imagem deve ter no máximo 10 MB."
      );
      return;
    }

    const leitor = new FileReader();

    leitor.onload = () => {
      if (
        typeof leitor.result !== "string" ||
        !leitor.result.startsWith("data:image/")
      ) {
        setErro("Não foi possível carregar a imagem selecionada.");
        return;
      }

      pararCamera();
      limparResultadoAnterior();

      setImagemCapturada(leitor.result);
      setErro("");
    };

    leitor.onerror = () => {
      setErro(
        "Não foi possível abrir a imagem. Tente selecionar outro arquivo."
      );
    };

    leitor.readAsDataURL(arquivo);
  }

  // CARREGAR FOTOS CADASTRADAS DA PESSOA
  async function carregarFotosPessoa(
    pessoaId,
    fotoCorrespondenteId
  ) {
    setCarregandoFotos(true);
    limparUrlsFotos();
    setFotosPessoa([]);

    try {
      const resposta = await api.get(
        `/fotos/pessoa/${pessoaId}`
      );

      const fotos = Array.isArray(resposta.data)
        ? resposta.data
        : [];

      const fotosComUrl = await Promise.all(
        fotos.map(async (foto) => {
          try {
            const respostaArquivo = await api.get(
              `/fotos/${foto.id}/arquivo`,
              { responseType: "blob" }
            );

            const url = URL.createObjectURL(
              respostaArquivo.data
            );

            fotosUrlsRef.current.push(url);

            return {
              ...foto,
              url,
              correspondente:
                String(foto.id) ===
                String(fotoCorrespondenteId),
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

      setFotosPessoa(fotosComUrl.filter(Boolean));
    } catch (error) {
      console.error(
        "Erro ao carregar fotos da pessoa:",
        error
      );

      setFotosPessoa([]);
    } finally {
      setCarregandoFotos(false);
    }
  }

  // RECONHECER PESSOA
  async function reconhecer() {
    if (!imagemCapturada || reconhecendo) return;

    setReconhecendo(true);
    setErro("");
    setResultado(null);
    limparUrlsFotos();
    setFotosPessoa([]);

    try {
      const respostaImagem = await fetch(imagemCapturada);
      const blob = await respostaImagem.blob();

      if (!blob || blob.size === 0) {
        throw new Error("A imagem selecionada está vazia.");
      }

      const tipoImagem = TIPOS_IMAGEM.includes(blob.type)
        ? blob.type
        : "image/jpeg";

      const extensao =
        tipoImagem === "image/png" ? "png" : "jpg";

      const arquivo = new File(
        [blob],
        `reconhecimento.${extensao}`,
        { type: tipoImagem }
      );

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const resposta = await api.post(
        "/reconhecimento",
        formData
      );

      const dados = resposta.data;
      setResultado(dados);

      if (dados.reconhecido && dados.pessoa?.id) {
        await Promise.all([
          carregarFotosPessoa(
            dados.pessoa.id,
            dados.foto?.id
          ),
          carregarRegistroDesaparecimento(
            dados.pessoa.id
          ),
        ]);
      }
    } catch (error) {
      console.error("Erro no reconhecimento:", error);

      setErro(
        error.response?.data?.detail ||
        error.message ||
        "Não foi possível realizar o reconhecimento facial."
      );
    } finally {
      setReconhecendo(false);
    }
  }

  // CARREGAR REGISTRO DE DESAPARECIMENTO DA PESSOA
  async function carregarRegistroDesaparecimento(pessoaId) {
    setCarregandoDesaparecimento(true);
    setRegistroDesaparecimento(null);

    try {
      const resposta = await api.get(
        `/desaparecimentos/pessoa/${pessoaId}`
      );

      const registros = Array.isArray(resposta.data)
        ? resposta.data
        : resposta.data
          ? [resposta.data]
          : [];

      // Prioriza um caso que ainda esteja em aberto.
      const registroEmAberto = registros.find(
        (registro) =>
          String(registro.status || "").toUpperCase() ===
          "DESAPARECIDO"
      );

      setRegistroDesaparecimento(
        registroEmAberto || registros[0] || null
      );
    } catch (error) {
      console.error(
        "Erro ao carregar registro de desaparecimento:",
        error
      );

      setRegistroDesaparecimento(null);
    } finally {
      setCarregandoDesaparecimento(false);
    }
  }

  // NOVA CONSULTA
  function novaConsulta() {
    pararCamera();
    limparUrlsFotos();

    setFotosPessoa([]);
    setImagemCapturada(null);
    setResultado(null);
    setErro("");
    setRegistroDesaparecimento(null);
    setCarregandoDesaparecimento(false);

    iniciarCamera();
  }

  // LIMPEZA AO SAIR DA TELA
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());

        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      limparUrlsFotos();
    };
  }, []);

  // RENDERIZAÇÃO
  return (
    <div className="reconhecimento-page">
      <div className="reconhecimento-header">
        <div>
          <h1>Reconhecimento facial</h1>
          <p>
            Capture uma foto ou selecione uma imagem para
            verificar possíveis correspondências.
          </p>
        </div>

        <button
          type="button"
          className="reconhecimento-voltar"
          onClick={() => {
            pararCamera();
            navigate("/dashboard");
          }}
          disabled={reconhecendo}
        >
          Voltar
        </button>
      </div>

      <div className="reconhecimento-card">
        {erro && (
          <div
            className="reconhecimento-error"
            role="alert"
          >
            {erro}
          </div>
        )}

        {/* INPUT DE IMAGEM */}
        <input
          ref={arquivoInputRef}
          type="file"
          accept="image/jpeg,image/png,.jpg,.jpeg,.png"
          onChange={selecionarImagem}
          className="reconhecimento-input-arquivo"
          aria-label="Selecionar imagem para reconhecimento"
        />

        {/* CÂMERA */}
        {!imagemCapturada && !resultado && (
          <div className="reconhecimento-camera">
            <div className="reconhecimento-video-container">
              {cameraAtiva ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="reconhecimento-video"
                />
              ) : (
                <div className="reconhecimento-camera-placeholder">
                  <span>Pronto para iniciar a busca</span>

                  <div className="reconhecimento-opcoes-imagem">
                    <button
                      type="button"
                      className="button-primary"
                      onClick={iniciarCamera}
                    >
                      <span className="reconhecimento-icone"></span>
                      Abrir câmera
                    </button>

                    <button
                      type="button"
                      className="reconhecimento-button-secondary"
                      onClick={abrirSeletorImagem}
                    >
                      <span className="reconhecimento-icone"></span>
                      Selecionar imagem
                    </button>
                  </div>
                </div>
              )}
            </div>

            {cameraAtiva && (
              <div className="reconhecimento-opcoes-camera">
                <button
                  type="button"
                  className="reconhecimento-button-primary"
                  onClick={capturarFoto}
                >
                  Capturar foto
                </button>

                <button
                  type="button"
                  className="reconhecimento-button-secondary"
                  onClick={() => {
                    pararCamera();
                    abrirSeletorImagem();
                  }}
                >
                  Selecionar imagem
                </button>
              </div>
            )}
          </div>
        )}

        {/* PRÉ-VISUALIZAÇÃO */}
        {imagemCapturada && !resultado && (
          <div className="reconhecimento-preview">
            <h2>Imagem para reconhecimento</h2>

            <img
              src={imagemCapturada}
              alt="Imagem selecionada para reconhecimento facial"
              className="reconhecimento-preview-image"
            />

            <div className="reconhecimento-actions">
              <button
                type="button"
                className="reconhecimento-button-secondary"
                onClick={novaConsulta}
                disabled={reconhecendo}
              >
                Nova imagem
              </button>

              <button
                type="button"
                className="reconhecimento-button-secondary"
                onClick={abrirSeletorImagem}
                disabled={reconhecendo}
              >
                Trocar imagem
              </button>

              <button
                type="button"
                className="button-primary"
                onClick={reconhecer}
                disabled={reconhecendo}
              >
                {reconhecendo
                  ? "Reconhecendo..."
                  : "Reconhecer pessoa"}
              </button>
            </div>
          </div>
        )}

        {/* RESULTADO */}
        {resultado && (
          <div className="reconhecimento-resultado">
            {resultado.reconhecido && resultado.pessoa ? (
              <>
                <div className="reconhecimento-sucesso">
                  <h2>Possível correspondência encontrada</h2>
                  <p>
                    O sistema encontrou uma correspondência
                    na base de dados. Confira as informações
                    antes de tirar conclusões.
                  </p>
                </div>

                <div className="reconhecimento-pessoa">
                  <h3>{resultado.pessoa.nome}</h3>

                  <p>
                    <strong>CPF:</strong>{" "}
                    {resultado.pessoa.cpf}
                  </p>

                  <p>
                    <strong>Distância facial:</strong>{" "}
                    {resultado.distancia != null
                      ? resultado.distancia.toFixed(4)
                      : "-"}
                  </p>

                  <p className="reconhecimento-aviso">
                    A distância facial não representa uma
                    porcentagem de certeza da identidade.
                    A correspondência precisa ser verificada
                    por um agente.
                  </p>
                </div>

                {/* SITUAÇÃO DO DESAPARECIMENTO */}
                <div className="reconhecimento-desaparecimento">
                  <div className="reconhecimento-desaparecimento-header">
                    <h3>Situacão do desaparecimento</h3>
                    <span className="reconhecimento-desaparecimento-icone">
                      <i className="lucide-map-pin" />
                    </span>
                  </div>

                  {carregandoDesaparecimento ? (
                    <p>Consultando situação do caso...</p>
                  ) : registroDesaparecimento ? (
                    <>
                      <div className="reconhecimento-desaparecimento-status">
                        <span
                          className={
                            String(registroDesaparecimento.status || "")
                              .toUpperCase() === "LOCALIZADO"
                              ? "status-localizado"
                              : "status-desaparecido"
                          }
                        >
                          {registroDesaparecimento.status || "Não informado"}
                        </span>
                      </div>

                      <div className="reconhecimento-desaparecimento-detalhes">
                        <p>
                          <strong>Data do desaparecimento:</strong>{" "}
                          {registroDesaparecimento.data_desaparecimento
                            ? new Date(
                              `${registroDesaparecimento.data_desaparecimento}T00:00:00`
                            ).toLocaleDateString("pt-BR")
                            : "Não informada"}
                        </p>

                        <p>
                          <strong>Local do desaparecimento:</strong>{" "}
                          {registroDesaparecimento.local_desaparecimento ||
                            "Não informado"}
                        </p>

                        {registroDesaparecimento.descricao && (
                          <p>
                            <strong>Descrição:</strong>{" "}
                            {registroDesaparecimento.descricao}
                          </p>
                        )}
                      </div>

                      {String(registroDesaparecimento.status || "")
                        .toUpperCase() === "DESAPARECIDO" && (
                          <div className="reconhecimento-localizacao-aviso">
                            <p>
                              A pessoa possui um caso de desaparecimento em aberto.
                              A correspondência facial precisa ser verificada antes
                              de registrar uma localização.
                            </p>

                            <button
                              type="button"
                              className="reconhecimento-button-primary"
                              onClick={() =>
                                navigate("/localizacoes", {
                                  state: {
                                    pessoaId: resultado.pessoa.id,
                                    pessoaNome: resultado.pessoa.nome,
                                    registroDesaparecimentoId:
                                      registroDesaparecimento.id,
                                  },
                                })
                              }
                            >
                              Registrar localização
                            </button>
                          </div>
                        )}

                      {String(registroDesaparecimento.status || "")
                        .toUpperCase() === "LOCALIZADO" && (
                          <div className="reconhecimento-localizacao-confirmada">
                            Esta pessoa já consta como localizada no sistema.
                            Consulte os registros de localização para obter
                            mais informações.
                          </div>
                        )}
                    </>
                  ) : (
                    <p>
                      Nenhum registro de desaparecimento foi encontrado
                      para esta pessoa.
                    </p>
                  )}
                </div>

                <div className="reconhecimento-fotos">
                  <h3>Fotos cadastradas</h3>

                  {carregandoFotos ? (
                    <div className="reconhecimento-fotos-loading">
                      Carregando fotos...
                    </div>
                  ) : fotosPessoa.length === 0 ? (
                    <div className="reconhecimento-fotos-vazia">
                      Nenhuma foto cadastrada.
                    </div>
                  ) : (
                    <div className="reconhecimento-fotos-grid">
                      {fotosPessoa.map((foto) => (
                        <div
                          key={foto.id}
                          className={
                            foto.correspondente
                              ? "reconhecimento-foto-item correspondente"
                              : "reconhecimento-foto-item"
                          }
                        >
                          <div className="reconhecimento-foto-image-container">
                            <img
                              src={foto.url}
                              alt={`Foto cadastrada de ${resultado.pessoa.nome}`}
                              className="reconhecimento-foto-image"
                            />
                          </div>

                          {foto.correspondente && (
                            <span className="reconhecimento-foto-badge">
                              Foto correspondente
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="reconhecimento-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={novaConsulta}
                  >
                    Nova consulta
                  </button>

                  <button
                    type="button"
                    className="button-primary"
                    onClick={() =>
                      navigate(
                        `/pessoas/${resultado.pessoa.id}`
                      )
                    }
                  >
                    Ver detalhes
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="reconhecimento-nao-encontrado">
                  <h2>Nenhuma correspondência encontrada</h2>
                  <p>
                    Não foi encontrada uma correspondência
                    na base de dados. Isso não confirma que
                    a pessoa não esteja cadastrada ou que
                    seja uma pessoa desaparecida.
                  </p>
                </div>

                <div className="reconhecimento-actions">
                  <button
                    type="button"
                    className="button-secondary"
                    onClick={novaConsulta}
                  >
                    Nova consulta
                  </button>

                  <button
                    type="button"
                    className="button-primary"
                    onClick={() =>
                      navigate("/pessoas/cadastro", {
                        state: {
                          foto: imagemCapturada,
                        },
                      })
                    }
                  >
                    Cadastrar pessoa
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <canvas
          ref={canvasRef}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default Reconhecimento;
