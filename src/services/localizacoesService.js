
import api from "./api";

const localizacoesService = {
  async listar() {
    const response = await api.get("/localizacoes");
    return response.data;
  },

  async cadastrar(dados) {
    const response = await api.post("/localizacoes", dados);
    return response.data;
  },

  async listarPorRegistro(registroDesaparecimentoId) {
    const response = await api.get(
      `/localizacoes/registro/${registroDesaparecimentoId}`
    );
    return response.data;
  },
};

export default localizacoesService;
