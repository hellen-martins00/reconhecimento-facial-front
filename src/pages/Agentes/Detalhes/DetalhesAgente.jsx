import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import api from "../../../services/api";

import "./DetalhesAgente.css";

function DetalhesAgente() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [agente, setAgente] = useState(null);
    const [fotoUrl, setFotoUrl] = useState(null);

    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    // USUÁRIO LOGADO E PERMISSÕES

    const usuarioSalvo = localStorage.getItem("usuario");

    let usuario = null;

    try {
        usuario = usuarioSalvo
            ? JSON.parse(usuarioSalvo)
            : null;
    } catch (error) {
        console.error(
            "Erro ao recuperar usuário logado:",
            error
        );
    }

    const isAdmin = usuario?.perfil === "ADMIN";

    const isProprioAgente =
        String(usuario?.id) === String(id);

    const podeEditar =
        isAdmin || isProprioAgente;

    // CARREGAR AGENTE

    useEffect(() => {
        let isMounted = true;
        let objectUrl = null;

        async function carregarAgente() {
            setCarregando(true);
            setErro("");

            try {
                // DADOS DO AGENTE
                const resposta = await api.get(
                    `/agentes/${id}`
                );

                if (!isMounted) return;

                setAgente(resposta.data);

                // FOTO DO AGENTE
                try {
                    const respostaFoto = await api.get(
                        `/agentes/${id}/foto`,
                        {
                            responseType: "blob",
                        }
                    );

                    if (!isMounted) return;

                    objectUrl = URL.createObjectURL(
                        respostaFoto.data
                    );

                    setFotoUrl(objectUrl);
                } catch (errorFoto) {
                    if (!isMounted) return;

                    setFotoUrl(null);

                    // 404 = agente sem foto.
                    // Outros erros devem ser registrados.
                    if (
                        errorFoto.response?.status !== 404
                    ) {
                        console.error(
                            "Erro ao carregar foto do agente:",
                            errorFoto
                        );
                    }
                }
            } catch (error) {
                if (!isMounted) return;

                console.error(
                    "Erro ao carregar agente:",
                    error
                );

                setErro(
                    error.response?.data?.detail ||
                    "Não foi possível carregar os dados do agente."
                );
            } finally {
                if (isMounted) {
                    setCarregando(false);
                }
            }
        }

        carregarAgente();

        return () => {
            isMounted = false;

            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [id]);

    // FORMATAÇÕES

    function formatarData(data) {
        if (!data) {
            return "-";
        }

        return new Date(data).toLocaleDateString(
            "pt-BR"
        );
    }

    function formatarPerfil(perfil) {
        if (!perfil) {
            return "-";
        }

        return perfil;
    }

    // CARREGANDO

    if (carregando) {
        return (
            <div className="detalhes-agente-page">
                <div className="detalhes-agente-loading">
                    Carregando dados do agente...
                </div>
            </div>
        );
    }

    // ERRO

    if (erro || !agente) {
        return (
            <div className="detalhes-agente-page">

                <div className="detalhes-agente-header">
                    <div>
                        <h1>Agente</h1>

                        <p>
                            Detalhes do cadastro
                        </p>
                    </div>

                    <button
                        type="button"
                        className="detalhes-agente-btn-voltar"
                        onClick={() =>
                            navigate("/agentes")
                        }
                    >
                        Voltar
                    </button>
                </div>

                <div className="detalhes-agente-error">
                    {erro ||
                        "Agente não encontrado."}
                </div>

            </div>
        );
    }

    // TELA

    return (
        <div className="detalhes-agente-page">

            {/* CABEÇALHO */}

            <div className="detalhes-agente-header">

                <div>
                    <h1>Agente</h1>

                    <p>
                        Visualização dos dados
                        cadastrais
                    </p>
                </div>

                <button
                    type="button"
                    className="detalhes-agente-btn-voltar"
                    onClick={() =>
                        navigate("/agentes")
                    }
                >
                    Voltar
                </button>

            </div>

            {/* CARD PRINCIPAL */}

            <div className="detalhes-agente-card">

                {/* PERFIL */}

                <section className="detalhes-agente-profile">

                    {/* FOTO */}

                    <div className="detalhes-agente-foto-wrapper">

                        {fotoUrl ? (
                            <img
                                src={fotoUrl}
                                alt={`Foto de ${agente.nome}`}
                                className="detalhes-agente-foto"
                            />
                        ) : (
                            <div className="detalhes-agente-sem-foto">
                                <span>
                                    Sem foto
                                </span>

                                {podeEditar && (
                                    <button
                                        type="button"
                                        onClick={() =>
                                            navigate(
                                                `/agentes/${agente.id}/editar`
                                            )
                                        }
                                        className="detalhes-agente-btn-foto"
                                    >
                                        Adicionar foto
                                    </button>
                                )}
                            </div>
                        )}

                    </div>

                    {/* IDENTIDADE */}

                    <div className="detalhes-agente-identidade">

                        <span className="detalhes-agente-label">
                            AGENTE
                        </span>

                        <h2>
                            {agente.nome}
                        </h2>

                        <p>
                            Usuário:{" "}
                            <strong>
                                {agente.usuario}
                            </strong>
                        </p>

                        <span
                            className={`detalhes-agente-perfil ${
                                agente.perfil ===
                                "ADMIN"
                                    ? "admin"
                                    : "agente"
                            }`}
                        >
                            {formatarPerfil(
                                agente.perfil
                            )}
                        </span>

                    </div>

                </section>

                {/* DADOS CADASTRAIS */}

                <section className="detalhes-agente-dados">

                    <div className="detalhes-agente-section-header">

                        <span>
                            DADOS CADASTRAIS
                        </span>

                        <h2>
                            Informações do agente
                        </h2>

                    </div>

                    <div className="detalhes-agente-grid">

                        <div className="detalhes-agente-field">
                            <span>
                                Nome
                            </span>

                            <strong>
                                {agente.nome ||
                                    "-"}
                            </strong>
                        </div>

                        <div className="detalhes-agente-field">
                            <span>
                                Usuário
                            </span>

                            <strong>
                                {agente.usuario ||
                                    "-"}
                            </strong>
                        </div>

                        <div className="detalhes-agente-field">
                            <span>
                                Perfil
                            </span>

                            <strong>
                                {agente.perfil ||
                                    "-"}
                            </strong>
                        </div>

                        <div className="detalhes-agente-field">
                            <span>
                                Data de cadastro
                            </span>

                            <strong>
                                {formatarData(
                                    agente.created_at
                                )}
                            </strong>
                        </div>

                    </div>

                </section>

                {/* AÇÕES */}

                <div className="detalhes-agente-actions">

                    <button
                        type="button"
                        className="detalhes-agente-btn-secondary"
                        onClick={() =>
                            navigate("/agentes")
                        }
                    >
                        Voltar
                    </button>

                    {podeEditar && (
                        <button
                            type="button"
                            className="detalhes-agente-btn-primary"
                            onClick={() =>
                                navigate(
                                    `/agentes/${agente.id}/editar`
                                )
                            }
                        >
                            Editar agente
                        </button>
                    )}

                </div>

            </div>
        </div>
    );
}

export default DetalhesAgente;