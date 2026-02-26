export function parsePtBrNumber(raw: string): number | null {
  const value = raw.trim();
  if (!value) return null;

  let normalized = value.replace(/\s/g, "").replace(/[Rr]\$/g, "");

  // Keep digits, separators and minus only.
  normalized = normalized.replace(/[^0-9,.-]/g, "");

  if (!normalized || normalized === "-" || normalized === "," || normalized === ".") {
    return null;
  }

  const lastComma = normalized.lastIndexOf(",");
  const lastDot = normalized.lastIndexOf(".");

  if (lastComma >= 0 && lastDot >= 0) {
    const decimalSeparator = lastComma > lastDot ? "," : ".";
    const thousandSeparator = decimalSeparator === "," ? "." : ",";
    normalized = normalized.split(thousandSeparator).join("");
    if (decimalSeparator === ",") normalized = normalized.replace(",", ".");
  } else if (lastComma >= 0) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else {
    normalized = normalized.replace(/,/g, "");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function sanitizeNumberDraft(raw: string) {
  return raw.replace(/[^\d,.-]/g, "");
}

export function formatNumberPtBr(value: number, decimals = 2) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrencyPtBr(value: number) {
  return formatNumberPtBr(value, 2);
}

export function formatHoursPtBr(value: number) {
  if (!Number.isFinite(value)) return "";
  const hasFraction = Math.abs(value % 1) > 0.000001;
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: hasFraction ? 1 : 0,
    maximumFractionDigits: hasFraction ? 1 : 1,
  });
}
