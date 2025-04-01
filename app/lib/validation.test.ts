import { describe, expect, it } from "vitest";
import { CreateItemException } from "../exception/exceptions";
import { validateForm } from "./validation";

describe("validateForm", () => {
  it("正常系 - 日本語", () => {
    const formData = new FormData();
    formData.append("name", "山田太郎");

    expect(() => validateForm(formData)).not.toThrow();
  });
  
  it("正常系 - 英数字記号", () => {
    const formData = new FormData();
    formData.append("name", "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijolmnopqrstuvwxyz1234567890@*:;<>/!?");

    expect(() => validateForm(formData)).not.toThrow();
  });

  it("name が空文字の場合に例外が発生すること", () => {
    const formData = new FormData();
    formData.append("name", "");

    expect(() => validateForm(formData)).toThrow(CreateItemException);
  });

  it("name が存在しない場合に例外が発生すること", () => {
    const formData = new FormData();

    expect(() => validateForm(formData)).toThrow(CreateItemException);
  });
});