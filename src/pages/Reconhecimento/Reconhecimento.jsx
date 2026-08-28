import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Reconhecimento.css";

function Reconhecimento() {
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const fotosUrlsRef = useRef([]);

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [imagemCapturada, setImagemCapturada] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [fotosPessoa, setFotosPessoa] = useState([]);
  const [carregandoFotos, setCarregandoFotos] = useState(false);
  const [reconhecendo, setReconhecendo] = useState(false);
  const [erro, setErro] = useState("");

  // LIMPEZA DE BLOB URLS
  const limparUrlsFotos = () => {
    fotosUrlsRef.current.forEach((url) => {
      if (url) URL.revokeObjectURL(url);
    });
    fotosUrlsRef.current = [];
  };

  // INICIAR CÂMERA
  async function iniciarCamera() {
    setErro("");

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      streamRef.current = mediaStream;
      setCameraAtiva(true);

      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current.play().catch((error) => {
              console.error("Erro ao reproduzir câmera:", error);
            });
          };
        }
      }, 100);
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      setCameraAtiva(false);
      setErro(
        "Não foi possível acessar a câmera. Verifique se o navegador possui permissão para utilizá-la."
      );
    }
  }

  // PARAR CÂMERA
  function pararCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraAtiva(false);
  }

  // CAPTURAR FOTO
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

    if (
      !imagem ||
      imagem === "data:," ||
      !imagem.startsWith("data:image/")
    ) {
      setErro("Não foi possível capturar a imagem. Tente novamente.");
      return;
    }

    setImagemCapturada(imagem);
    setResultado(null);
    pararCamera();
  }

  // CARREGAR FOTOS DA PESSOA
  async function carregarFotosPessoa(pessoaId, fotoCorrespondenteId) {
    setCarregandoFotos(true);
    limparUrlsFotos();

    try {
      const resposta = await api.get(`/fotos/pessoa/${pessoaId}`);
      const fotos = resposta.data;

      const fotosComUrl = await Promise.all(
        fotos.map(async (foto) => {
          try {
            const respostaArquivo = await api.get(
              `/fotos/${foto.id}/arquivo`,
              { responseType: "blob" }
            );

            const url = URL.createObjectURL(respostaArquivo.data);
            fotosUrlsRef.current.push(url);

            return {
              ...foto,
              url,
              correspondente: foto.id === fotoCorrespondenteId
            };
          } catch (error) {
            console.error(`Erro ao carregar foto ${foto.id}:`, error);
            return null;
          }
        })
      );

      setFotosPessoa(fotosComUrl.filter(Boolean));
    } catch (error) {
      console.error("Erro ao carregar fotos da pessoa:", error);
      setFotosPessoa([]);
    } finally {
      setCarregandoFotos(false);
    }
  }

  // RECONHECER
  async function reconhecer() {
    if (!imagemCapturada) {
      setErro("Nenhuma imagem foi capturada.");
      return;
    }

    setReconhecendo(true);
    setErro("");
    setResultado(null);

    try {
      const respostaBase64 = await fetch(imagemCapturada);
      const blob = await respostaBase64.blob();

      if (!blob || blob.size === 0) {
        throw new Error("A imagem capturada está vazia.");
      }

      const arquivo = new File([blob], "reconhecimento.jpg", {
        type: "image/jpeg"
      });

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const resposta = await api.post("/reconhecimento", formData);
      const dados = resposta.data;

      setResultado(dados);

      if (dados.reconhecido && dados.pessoa?.id) {
        await carregarFotosPessoa(dados.pessoa.id, dados.foto?.id);
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

  // NOVA CONSULTA
  function novaConsulta() {
    limparUrlsFotos();
    setFotosPessoa([]);
    setImagemCapturada(null);
    setResultado(null);
    setErro("");
    iniciarCamera();
  }

  // LIMPEZA AO DESMONTAREM
  useEffect(() => {
    return () => {
      pararCamera();
      limparUrlsFotos();
    };
  }, []);

  return (
    <div className="reconhecimento-page">
      <div className="reconhecimento-header">
        <div>
          <h1>Reconhecimento facial</h1>
          <p>Capture uma imagem para verificar se a pessoa está cadastrada.</p>
        </div>

        <button
          type="button"
          className="reconhecimento-voltar"
          onClick={() => {
            pararCamera();
            navigate("/dashboard");
          }}
        >
          Voltar
        </button>
      </div>

      <div className="reconhecimento-card">
        {erro && <div className="reconhecimento-error">{erro}</div>}

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
                  <span>Câmera desligada</span>
                  <button
                    type="button"
                    className="button-primary"
                    onClick={iniciarCamera}
                  >
                    Abrir câmera
                  </button>
                </div>
              )}
            </div>

            {cameraAtiva && (
              <button
                type="button"
                className="button-primary"
                onClick={capturarFoto}
              >
                Capturar foto
              </button>
            )}
          </div>
        )}

        {imagemCapturada && !resultado && (
          <div className="reconhecimento-preview">
            <h2>Foto capturada</h2>
            <img
              src={imagemCapturada}
              alt="Imagem capturada para reconhecimento"
              className="reconhecimento-preview-image"
            />

            <div className="reconhecimento-actions">
              <button
                type="button"
                className="button-secondary"
                onClick={novaConsulta}
                disabled={reconhecendo}
              >
                Tirar outra foto
              </button>

              <button
                type="button"
                className="button-primary"
                onClick={reconhecer}
                disabled={reconhecendo}
              >
                {reconhecendo ? "Reconhecendo..." : "Reconhecer pessoa"}
              </button>
            </div>
          </div>
        )}

        {resultado && (
          <div className="reconhecimento-resultado">
            {resultado.reconhecido ? (
              <>
                <div className="reconhecimento-sucesso">
                  <h2>Pessoa reconhecida</h2>
                  <p>Foi encontrada uma correspondência na base de dados.</p>
                </div>

                <div className="reconhecimento-pessoa">
                  <h3>{resultado.pessoa.nome}</h3>
                  <p>
                    <strong>CPF:</strong> {resultado.pessoa.cpf}
                  </p>
                  <p>
                    <strong>Distância:</strong>{" "}
                    {resultado.distancia?.toFixed(4)}
                  </p>
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
                              alt={`Foto de ${resultado.pessoa.nome}`}
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
                      navigate(`/pessoas/${resultado.pessoa.id}`)
                    }
                  >
                    Ver detalhes
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="reconhecimento-nao-encontrado">
                  <h2>Pessoa não encontrada</h2>
                  <p>
                    Não foi encontrada uma correspondência na base de dados.
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
                        state: { foto: imagemCapturada }
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

        <canvas ref={canvasRef} style={{ display: "none" }} />
      </div>
    </div>
  );
}

export default Reconhecimento;