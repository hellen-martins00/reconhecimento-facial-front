export function formatarData(data) {
  if (!data) return "";

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}