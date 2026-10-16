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

export function validarCPF(valor) {
  const cpf = limparCPF(valor);

  if (!/^\d{11}$/.test(cpf)) {
    return false;
  }

  // Rejeita sequências com todos os dígitos iguais.
  if (/^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  // Calcula o primeiro dígito verificador.
  let soma = 0;

  for (let i = 0; i < 9; i++) {
    soma += Number(cpf[i]) * (10 - i);
  }

  let resto = (soma * 10) % 11;
  const primeiroDigito = resto === 10 ? 0 : resto;

  if (primeiroDigito !== Number(cpf[9])) {
    return false;
  }

  // Calcula o segundo dígito verificador.
  soma = 0;

  for (let i = 0; i < 10; i++) {
    soma += Number(cpf[i]) * (11 - i);
  }

  resto = (soma * 10) % 11;
  const segundoDigito = resto === 10 ? 0 : resto;

  return segundoDigito === Number(cpf[10]);
}