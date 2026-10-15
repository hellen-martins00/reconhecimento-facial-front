export function limparCPF(valor) {
  return valor.replace(/\D/g, "");
}

export function formatarCPF(cpf) {
  if (!cpf) return "";

  const numeros = String(cpf).replace(/\D/g, "");

  if (numeros.length !== 11) return cpf;

  return numeros.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}

export function limparCPF(cpf) {
  if (!cpf) return "";

  return String(cpf).replace(/\D/g, "");
}