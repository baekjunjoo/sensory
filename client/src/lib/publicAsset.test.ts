import { describe, expect, it } from "vitest";
import { publicAsset } from "./publicAsset";

describe("public asset paths", () => {
  it("keeps the same-origin path while the app serves its own assets", () => {
    expect(publicAsset("/manus-storage/scene.png")).toBe("/manus-storage/scene.png");
  });
});
