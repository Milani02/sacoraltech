import { describe, expect, it } from "vitest";

import { TOPICS, getTopic } from "./topics";

describe("topics — tópicos de abertura do cliente", () => {
  it("getTopic resolve por id e retorna undefined p/ inexistente", () => {
    expect(getTopic("produto-defeito")?.label).toBe("Produto com desvio");
    expect(getTopic("nao-existe")).toBeUndefined();
  });

  it("todo tópico tem label, descrição e ao menos um campo", () => {
    for (const t of TOPICS) {
      expect(t.label.length).toBeGreaterThan(0);
      expect(t.description.length).toBeGreaterThan(0);
      expect(t.fields.length).toBeGreaterThan(0);
    }
  });

  it("rótulos atualizados: CPF/CNPJ, Nome ou Razão Social, Produto / Lote", () => {
    const byKey = new Map<string, string>();
    for (const t of TOPICS) for (const f of t.fields) byKey.set(f.key, f.label);
    expect(byKey.get("cnpj")).toBe("Número do CPF ou CNPJ");
    expect(byKey.get("razao_social")).toBe("Nome ou Razão Social");
    expect(byKey.get("produto")).toBe("Produto / Lote");
  });

  it("NF não é obrigatória e não exibe sufixo '(opcional)'", () => {
    const nfFields = TOPICS.flatMap((t) => t.fields).filter((f) => f.key === "nf");
    expect(nfFields.length).toBeGreaterThan(0);
    for (const f of nfFields) {
      expect(f.required).toBeFalsy();
      expect(f.hideOptionalHint).toBe(true);
    }
  });

  it("razão social e CNPJ permanecem obrigatórios", () => {
    for (const t of TOPICS) {
      for (const f of t.fields) {
        if (f.key === "razao_social" || f.key === "cnpj") {
          expect(f.required).toBe(true);
        }
      }
    }
  });

  it("ids dos tópicos são únicos", () => {
    const ids = TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
