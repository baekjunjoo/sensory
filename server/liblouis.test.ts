import { describe, expect, it } from "vitest";
import { createLiblouisService } from "./liblouis";

describe("Liblouis standard braille service", () => {
  it("uses the Korean grade 2 table and converts Unicode braille into DotPad cells", async () => {
    const translator = async () => "⠠⠝⠒";
    const result = await createLiblouisService(translator).translate({ text: "센", locale: "ko-KR" });

    expect(result).toMatchObject({ braille: "⠠⠝⠒", locale: "ko-KR", table: "ko-g2.ctb", engine: "liblouis" });
    expect(result.cells).toEqual([[6], [1, 3, 4, 5], [2, 5]]);
  });

  it("uses UEB grade 2 for English and rejects output without braille cells", async () => {
    const english = await createLiblouisService(async () => "⠓⠑").translate({ text: "he", locale: "en-US" });
    expect(english.table).toBe("en-ueb-g2.ctb");
    await expect(createLiblouisService(async () => "not braille").translate({ text: "x", locale: "en-US" })).rejects.toThrow("점자 셀");
  });

  it("reports the Liblouis runtime version and supported standard tables", async () => {
    const status = await createLiblouisService(async () => "⠁", async () => "3.38.0").status();
    expect(status).toEqual({ engine: "liblouis", version: "3.38.0", tables: ["ko-g2.ctb", "en-ueb-g2.ctb"] });
  });
});
