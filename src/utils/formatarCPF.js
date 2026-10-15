export function limparCPF(valor) {
  if (valor == null || valor === "") return "";

  return String(valor).replace(/\D/g, "");
}

export function formatarCPF(cpf) {
  if (cpf == null || cpf === "") return "";

  const numeros = String(cpf).replace(/\D/g, "");

  if (numeros.length !== 11) return cpf;

  return numeros.replace(
    /(\d{3})(\d{3})(\d{3})(\d{2})/,
    "$1.$2.$3-$4"
  );
}