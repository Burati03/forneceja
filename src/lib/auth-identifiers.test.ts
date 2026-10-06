import { describe, expect, it } from "vitest";
import { normalizePhone, isValidPhone } from "./auth-identifiers";

describe("phone login identifiers", () => {
  it("normalizes Brazilian phone formats", () => {
    expect(normalizePhone("(11) 99999-9999")).toBe("5511999999999");
    expect(normalizePhone(" 11 99999-9999 ")).toBe("5511999999999");
    expect(normalizePhone("+55 11 99999-9999")).toBe("5511999999999");
  });

  it("accepts only a complete international phone number", () => {
    expect(isValidPhone("5511999999999")).toBe(true);
    expect(isValidPhone("11999999999")).toBe(true);
    expect(isValidPhone("11999")).toBe(false);
  });
});
