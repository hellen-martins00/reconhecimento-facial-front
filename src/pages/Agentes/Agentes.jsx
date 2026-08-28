import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";

import "./Agentes.css";

function Agentes() {
    const [agentes, setAgentes] = useState([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");
    const [excluindo, setExcluindo] = useState(null);

    const navigate = useNavigate();

    // Guardar referências das URLs geradas para garantir o cleanup no unmount
    const fotosUrlsRef = useRef([]);

    // USUÁRIO LOGADO
    let usuario = null;
    try {
        const usuarioSalvo = localStorage.getItem("usuario");
        usuario = usuarioSalvo ? JSON.parse(usuarioSalvo) : null;
    } catch (error) {
        console.error("Erro ao recuperar usuário:", error);
    }

    const isAdmin = usuario?.perfil === "ADMIN";

    // Função auxiliar para revogar URLs mantidas em memória
    const revogarTodasFotos = useCallback(() => {
        fotosUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
        fotosUrlsRef.current = [];
    }, []);

    // CARREGAR AGENTES
    const carregarAgentes = useCallback(async () => {
        setCarregando(true);
        setErro("");

        try {
            const resposta = await api.get("/agentes");

            // Revoga fotos da busca anterior para evitar acúmulo de blobs
            revogarTodasFotos();

            const novasUrls = [];

            const agentesComFotos = await Promise.all(
                resposta.data.map(async (agente) => {
                    try {
                        const respostaFoto = await api.get(
                            `/agentes/${agente.id}/foto`,
                            { responseType: "blob" }
                        );

                        const fotoUrl = URL.createObjectURL(respostaFoto.data);
                        novasUrls.push(fotoUrl);

                        return {
                            ...agente,
                            foto_url: fotoUrl,
                        };
                    } catch (error) {
                        if (error.response?.status !== 404) {
                            console.error(
                                `Erro ao carregar foto do agente ${agente.id}:`,
                                error
                            );
                        }
                        return {
                            ...agente,
                            foto_url: null,
                        };
                    }
                })
            );

            fotosUrlsRef.current = novasUrls;
            setAgentes(agentesComFotos);
        } catch (error) {
            console.error(error);
            setErro(
                error.response?.data?.detail ||
                "Não foi possível carregar os agentes."
            );
        } finally {
            setCarregando(false);
        }
    }, [revogarTodasFotos]);

    // CARREGAR AO ABRIR A PÁGINA (COM CLEANUP CORRETO)
    useEffect(() => {
        carregarAgentes();

        // Limpeza executada quando o componente é desmontado
        return () => {
            revogarTodasFotos();
        };
    }, [carregarAgentes, revogarTodasFotos]);

    // EXCLUIR AGENTE
    async function handleExcluir(agente) {
        if (!isAdmin) return;

        const confirmar = window.confirm(
            `Tem certeza que deseja excluir o agente "${agente.nome}"?`
        );

        if (!confirmar) return;

        setErro("");
        setExcluindo(agente.id);

        try {
            await api.delete(`/agentes/${agente.id}`);

            // Revoga e limpa do tracking do useRef
            if (agente.foto_url) {
                URL.revokeObjectURL(agente.foto_url);
                fotosUrlsRef.current = fotosUrlsRef.current.filter(
                    (url) => url !== agente.foto_url
                );
            }

            // Remover o agente da lista
            setAgentes((agentesAtuais) =>
                agentesAtuais.filter((item) => item.id !== agente.id)
            );
        } catch (error) {
            console.error(error);
            setErro(
                error.response?.data?.detail ||
                "Não foi possível excluir o agente."
            );
        } finally {
            setExcluindo(null);
        }
    }

    // TELA
    return (
        <div className="agentes-page">
            <div className="agentes-header">
                <div>
                    <h1>Agentes</h1>
                    <p>Gerencie os agentes cadastrados no sistema.</p>
                </div>

                {isAdmin && (
                    <button
                        type="button"
                        className="agentes-new-button"
                        onClick={() => navigate("/agentes/novo")}
                    >
                        + Novo agente
                    </button>
                )}
            </div>

            {erro && <div className="agentes-error">{erro}</div>}

            <div className="agentes-card">
                {carregando ? (
                    <div className="agentes-loading">Carregando agentes...</div>
                ) : agentes.length === 0 ? (
                    <div className="agentes-empty">
                        <h2>Nenhum agente cadastrado</h2>
                        <p>Ainda não existem agentes cadastrados no sistema.</p>
                    </div>
                ) : (
                    <div className="agentes-table-container">
                        <table className="agentes-table">
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Usuário</th>
                                    <th>Perfil</th>
                                    <th>Data de cadastro</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {agentes.map((agente) => (
                                    <tr key={agente.id}>
                                        <td>
                                            <div className="agente-nome">
                                                {agente.foto_url ? (
                                                    <img
                                                        src={agente.foto_url}
                                                        alt={`Foto de ${agente.nome}`}
                                                        className="agente-foto"
                                                    />
                                                ) : (
                                                    <div className="agente-sem-foto">
                                                        Sem foto
                                                    </div>
                                                )}
                                                <span>{agente.nome}</span>
                                            </div>
                                        </td>
                                        <td>{agente.usuario}</td>
                                        <td>{agente.perfil}</td>
                                        <td>
                                            {new Date(
                                                agente.created_at
                                            ).toLocaleDateString("pt-BR")}
                                        </td>
                                        <td className="agentes-actions">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/agentes/${agente.id}`)
                                                }
                                                disabled={excluindo === agente.id}
                                            >
                                                Visualizar
                                            </button>

                                            {(isAdmin || usuario?.id === agente.id) && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/agentes/${agente.id}/editar`
                                                        )
                                                    }
                                                    disabled={excluindo === agente.id}
                                                >
                                                    Editar
                                                </button>
                                            )}

                                            {isAdmin && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleExcluir(agente)
                                                    }
                                                    disabled={excluindo === agente.id}
                                                >
                                                    {excluindo === agente.id
                                                        ? "Excluindo..."
                                                        : "Excluir"}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Agentes;