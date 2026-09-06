export function limparCPF(valor) {
  return valor.replace(/\D/g, "");
}

export function formatarCPF(valor) {
  // Mantém somente números
  const cpf = valor.replace(/\D/g, "").slice(0, 11);

  if (cpf.length <= 3) {
    return cpf;
  }

  if (cpf.length <= 6) {
    return cpf.replace(
      /^(\d{3})(\d+)/,
      "$1.$2"
    );
  }

  if (cpf.length <= 9) {
    return cpf.replace(
      /^(\d{3})(\d{3})(\d+)/,
      "$1.$2.$3"
    );
  }

  return cpf.replace(
    /^(\d{3})(\d{3})(\d{3})(\d{2})$/,
    "$1.$2.$3-$4"
  );
}
