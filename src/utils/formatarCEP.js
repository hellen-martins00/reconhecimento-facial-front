export function formatarCEP(cep) {
  if (!cep)
    return "";

  const apenasNumeros = String(cep)
    .replace(/\D/g, "")
    .slice(0, 8);

  if (apenasNumeros.length <= 5) {
    return apenasNumeros;
  }

  return apenasNumeros.replace(
    /^(\d{5})(\d{1,3})$/,
    "$1-$2"
  );
}

export function limparCEP(cep) {
  if (!cep) return "";

  return String(cep)
    .replace(/\D/g, "")
    .slice(0, 8);
}