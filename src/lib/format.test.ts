import { describe, expect, it } from "vitest";

import { formatRelative, initials } from "./format";

describe("initials", () => {
  it("usa as duas primeiras iniciais maiúsculas", () => {
    expect(initials("Maria Silva")).toBe("MS");
    expect(initials("joão pedro alves")).toBe("JP");
  });
  it("lida com nome único e espaços extras", () => {
    expect(initials("Plano")).toBe("P");
    expect(initials("  ana   beatriz ")).toBe("AB");
  });
  it("string vazia não quebra", () => {
    expect(initials("")).toBe("");
  });
});

describe("formatRelative", () => {
  it("retorna 'agora' para o instante atual", () => {
    expect(formatRelative(new Date().toISOString())).toBe("agora");
  });
  it("usa minutos e horas conforme a distância", () => {
    const min5 = new Date(Date.now() - 5 * 60_000).toISOString();
    expect(formatRelative(min5)).toBe("há 5 min");
    const h3 = new Date(Date.now() - 3 * 3_600_000).toISOString();
    expect(formatRelative(h3)).toBe("há 3 h");
    const d2 = new Date(Date.now() - 2 * 86_400_000).toISOString();
    expect(formatRelative(d2)).toBe("há 2 d");
  });
});
