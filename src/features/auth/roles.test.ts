import { describe, expect, it } from "vitest";

import { can } from "./roles";
import type { UserRole } from "@/types/domain";

const ROLES: UserRole[] = ["admin", "agent", "client"];

describe("can — matriz de autorização", () => {
  it("apenas admin gerencia usuários", () => {
    expect(can.manageUsers("admin")).toBe(true);
    for (const r of ["agent", "client"] as UserRole[]) {
      expect(can.manageUsers(r)).toBe(false);
    }
  });

  it("staff (admin/agent) gerencia clientes e responde tickets; client não", () => {
    for (const r of ["admin", "agent"] as UserRole[]) {
      expect(can.manageClients(r)).toBe(true);
      expect(can.respondTickets(r)).toBe(true);
      expect(can.seeInternalNotes(r)).toBe(true);
    }
    expect(can.manageClients("client")).toBe(false);
    expect(can.respondTickets("client")).toBe(false);
    expect(can.seeInternalNotes("client")).toBe(false);
  });

  it("client nunca tem nenhuma capacidade administrativa", () => {
    const caps = Object.values(can).map((fn) => fn("client"));
    expect(caps.every((c) => c === false)).toBe(true);
  });

  it("todas as checagens aceitam qualquer papel sem lançar", () => {
    for (const r of ROLES) {
      for (const fn of Object.values(can)) {
        expect(typeof fn(r)).toBe("boolean");
      }
    }
  });
});
