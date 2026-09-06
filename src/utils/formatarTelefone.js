export function limparTelefone(valor) {
  return String(valor ?? "")
    .replace(/\D/g, "")
    .slice(0, 11);
}

export function formatarTelefone(valor) {
  const numeros = limparTelefone(valor);

  if (numeros.length <= 2) {
    return numeros;
  }

  if (numeros.length <= 6) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
  }

  if (numeros.length <= 10) {
    return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 6)}-${numeros.slice(6)}`;
  }

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7)}`;
}