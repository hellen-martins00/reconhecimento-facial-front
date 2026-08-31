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
        usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch (error) {
        console.error("Erro ao recuperar usuário:", error);
    }

    const isAdmin = usuario?.perfil === "ADMIN";
    
    // Correção: Conversão explícita para String evita erros de comparação tipo number vs string
    const isProprioAgente = String(usuario?.id) === String(id);
    const podeEditar = isAdmin || isProprioAgente;

    // CARREGAR AGENTE E FOTO
    useEffect(() => {
        let isMounted = true;
        let objectUrlCriado = null;

        async function carregar() {
            setCarregando(true);
            setErro("");

            try {
                // 1. BUSCAR AGENTE
                const resposta = await api.get(`/agentes/${id}`);
                
                if (!isMounted) return;
                setAgente(resposta.data);

                // 2. BUSCAR FOTO
                try {
                    const respostaFoto = await api.get(`/agentes/${id}/foto`, {
                        responseType: "blob",
                    });

                    if (isMounted) {
                        objectUrlCriado = URL.createObjectURL(respostaFoto.data);
                        setFotoUrl(objectUrlCriado);
                    }
                } catch (errorFoto) {
                    if (isMounted) {
                        setFotoUrl(null);

                        // 404 significa apenas que o agente ainda não possui foto registrada
                        if (errorFoto.response?.status !== 404) {
                            console.error(
                                "Erro ao carregar foto do agente:",
                                errorFoto
                            );
                        }
                    }
                }
            } catch (error) {
                if (isMounted) {
                    console.error(error);
                    setErro(
                        error.response?.data?.detail ||
                        "Não foi possível carregar os dados do agente."
                    );
                }
            } finally {
                if (isMounted) {
                    setCarregando(false);
                }
            }
        }

        carregar();

        // Limpeza da URL Blob da foto e cancelamento de atualizações em componentes desmontados
        return () => {
            isMounted = false;
            if (objectUrlCriado) {
                URL.revokeObjectURL(objectUrlCriado);
            }
        };
    }, [id]);

    // ESTADO: CARREGANDO
    if (carregando) {
        return (
            <div className="detalhes-agente-page">
                <div className="detalhes-agente-loading">
                    Carregando dados do agente...
                </div>
            </div>
        );
    }

    // ESTADO: ERRO OU AGENTE NÃO ENCONTRADO
    if (erro || !agente) {
        return (
            <div className="detalhes-agente-page">
                <div className="detalhes-agente-header">
                    <div>
                        <h1>Agente</h1>
                        <p>Detalhes do cadastro</p>
                    </div>

                    <button
                        type="button"
                        className="detalhes-agente-voltar"
                        onClick={() => navigate("/agentes")}
                    >
                        Voltar
                    </button>
                </div>

                <div className="detalhes-agente-error">
                    {erro || "Agente não encontrado."}
                </div>
            </div>
        );
    }

    // RENDEREZAÇÃO PRINCIPAL
    return (
        <div className="detalhes-agente-page">
            <div className="detalhes-agente-header">
                <div>
                    <h1>{agente.nome}</h1>
                    <p>Dados cadastrais do agente</p>
                </div>
            </div>

            <div className="detalhes-agente-card">
                {/* FOTO */}
                <div className="detalhes-agente-foto-container">
                    {fotoUrl ? (
                        <img
                            src={fotoUrl}
                            alt={`Foto de ${agente.nome}`}
                            className="detalhes-agente-foto"
                        />
                    ) : (
                        <div className="detalhes-agente-sem-foto">
                            <span>Sem foto</span>
                            {podeEditar && (
                                <button
                                    type="button"
                                    onClick={() =>
                                        navigate(`/agentes/${agente.id}/editar`)
                                    }
                                >
                                    Adicionar foto
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* DADOS */}
                <div className="detalhes-agente-grid">
                    <div className="detalhes-agente-field">
                        <span>Nome</span>
                        <strong>{agente.nome}</strong>
                    </div>

                    <div className="detalhes-agente-field">
                        <span>Usuário</span>
                        <strong>{agente.usuario}</strong>
                    </div>

                    <div className="detalhes-agente-field">
                        <span>Perfil</span>
                        <strong>{agente.perfil}</strong>
                    </div>

                    <div className="detalhes-agente-field">
                        <span>Data de cadastro</span>
                        <strong>
                            {agente.created_at
                                ? new Date(agente.created_at).toLocaleDateString("pt-BR")
                                : "-"}
                        </strong>
                    </div>
                </div>

                {/* AÇÕES */}
                <div className="detalhes-agente-actions">
                    <button
                        type="button"
                        className="button-secondary"
                        onClick={() => navigate("/agentes")}
                    >
                        Voltar
                    </button>

                    {podeEditar && (
                        <button
                            type="button"
                            className="button-primary"
                            onClick={() =>
                                navigate(`/agentes/${agente.id}/editar`)
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