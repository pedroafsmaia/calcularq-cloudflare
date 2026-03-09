import { describe, expect, it } from "vitest";

import { parsePtBrNumber, sanitizeNumberDraft } from "./numberFormat";

describe("numberFormat", () => {
  it("remove caracteres inválidos do draft e preserva apenas um sinal negativo inicial", () => {
    expect(sanitizeNumberDraft("R$ -1a2b3")).toBe("-123");
    expect(sanitizeNumberDraft("--1,2")).toBe("-1,2");
  });

  it("mantém separadores válidos e colapsa repetições imediatas", () => {
    expect(sanitizeNumberDraft("1..234,,56")).toBe("1.234,56");
    expect(sanitizeNumberDraft("1.234,56")).toBe("1.234,56");
  });

  it("faz parse de valores pt-BR sanitizados", () => {
    expect(parsePtBrNumber(sanitizeNumberDraft("R$ 1.234,56"))).toBe(1234.56);
    expect(parsePtBrNumber(sanitizeNumberDraft("220,5"))).toBe(220.5);
  });
});
