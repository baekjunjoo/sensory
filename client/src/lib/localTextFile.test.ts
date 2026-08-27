import { describe, expect, it } from "vitest";
import { MAX_LOCAL_TEXT_FILE_BYTES, readLocalTextFile } from "./localTextFile";

describe("readLocalTextFile", () => {
  it("reads local txt text while removing null characters", async () => {
    await expect(readLocalTextFile({ name: "lesson.txt", size: 18, text: async () => " 첫 문장.\u0000 다음 문장. " })).resolves.toBe("첫 문장. 다음 문장.");
  });

  it("rejects unsupported, oversized, and empty files", async () => {
    await expect(readLocalTextFile({ name: "lesson.pdf", size: 10, text: async () => "text" })).rejects.toThrow(".txt");
    await expect(readLocalTextFile({ name: "long.txt", size: MAX_LOCAL_TEXT_FILE_BYTES + 1, text: async () => "text" })).rejects.toThrow("500KB");
    await expect(readLocalTextFile({ name: "empty.txt", size: 0, text: async () => "  " })).rejects.toThrow("텍스트가 없는");
  });
});
