export function formatarCEP(cep) {
  if (!cep) return "";

  const apenasNumeros = cep.replace(/\D/g, "");

  return apenasNumeros.replace(/^(\d{5})(\d{3})$/, "$1-$2");
}