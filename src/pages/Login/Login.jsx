import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [modo, setModo] = useState("senha");
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");

  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  // SALVAR AUTENTICAÇÃO
  function salvarAutenticacao(dados) {
    const usuarioInfo = {
      id: dados.id,
      nome: dados.nome,
      usuario: dados.usuario,
      perfil: dados.perfil,
    };

    localStorage.setItem("access_token", dados.access_token);
    localStorage.setItem("usuario", JSON.stringify(usuarioInfo));

    navigate("/");
  }

  // LOGIN COM USUÁRIO E SENHA
  async function handleLogin(event) {
    event.preventDefault();

    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post("/login", {
        usuario,
        senha,
      });

      console.log("RESPOSTA DO LOGIN:", resposta.data);
      salvarAutenticacao(resposta.data);
    } catch (error) {
      if (error.response?.status === 401) {
        setErro("Usuário ou senha incorretos.");
      } else {
        setErro(
          error.response?.data?.detail ||
            "Não foi possível realizar o login."
        );
      }
    } finally {
      setCarregando(false);
    }
  }

  // INICIAR CÂMERA
  async function iniciarCamera() {
    try {
      setErro("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Erro ao acessar câmera:", error);
      setErro(
        "Não foi possível acessar a câmera. Verifique as permissões do navegador."
      );
    }
  }

  // PARAR CÂMERA
  function pararCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }

  // CAPTURAR FOTO E RECONHECER
  async function capturarRosto() {
    if (!videoRef.current || !canvasRef.current) return;

    setErro("");
    setCarregando(true);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const contexto = canvas.getContext("2d");
      contexto.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.9);
      });

      if (!blob) {
        throw new Error("Não foi possível capturar a imagem.");
      }

      const arquivo = new File([blob], "captura-facial.jpg", {
        type: "image/jpeg",
      });

      const formData = new FormData();
      formData.append("arquivo", arquivo);

      const resposta = await api.post("/login/facial", formData);
      const dados = resposta.data;

      if (!dados.autenticado) {
        setErro(
          "Rosto não reconhecido. Posicione-se corretamente e tente novamente."
        );
        return;
      }

      pararCamera();
      salvarAutenticacao(dados);
    } catch (error) {
      console.error("Erro no reconhecimento facial:", error);
      setErro(
        error.response?.data?.detail ||
          "Não foi possível realizar o reconhecimento facial."
      );
    } finally {
      setCarregando(false);
    }
  }

  // TROCA DE MODO
  function alterarModo(novoModo) {
    setErro("");
    setModo(novoModo);

    if (novoModo !== "facial") {
      pararCamera();
    }
  }

  // CICLO DE VIDA DA CÂMERA
  useEffect(() => {
    if (modo === "facial") {
      iniciarCamera();
    }

    return () => {
      pararCamera();
    };
  }, [modo]);

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Reconhecimento Facial</h1>
          <p>Entre para acessar o sistema</p>
        </div>

        {/* SELEÇÃO DO TIPO DE LOGIN */}
        <div className="login-options">
          <button
            type="button"
            className={`login-option ${modo === "senha" ? "active" : ""}`}
            onClick={() => alterarModo("senha")}
          >
            Usuário e senha
          </button>

          <button
            type="button"
            className={`login-option ${modo === "facial" ? "active" : ""}`}
            onClick={() => alterarModo("facial")}
          >
            Reconhecimento facial
          </button>
        </div>

        {/* LOGIN POR USUÁRIO E SENHA */}
        {modo === "senha" && (
          <form onSubmit={handleLogin}>
            <div className="login-form-group">
              <label htmlFor="usuario">Usuário</label>
              <input
                id="usuario"
                type="text"
                placeholder="Digite seu usuário"
                value={usuario}
                onChange={(event) => setUsuario(event.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="senha">Senha</label>
              <input
                id="senha"
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
            </div>

            {erro && <div className="login-error">{erro}</div>}

            <button
              type="submit"
              className="login-submit"
              disabled={carregando}
            >
              {carregando ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        {/* LOGIN FACIAL */}
        {modo === "facial" && (
          <div className="login-facial-login">
            <p className="login-facial-description">
              Posicione seu rosto na câmera para realizar o reconhecimento.
            </p>

            <div className="login-camera-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="login-camera-video"
              />
            </div>

            <canvas ref={canvasRef} className="login-camera-canvas" />

            {erro && <div className="login-error">{erro}</div>}

            <button
              type="button"
              className="login-submit"
              disabled={carregando}
              onClick={capturarRosto}
            >
              {carregando ? "Reconhecendo..." : "Reconhecer rosto"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;