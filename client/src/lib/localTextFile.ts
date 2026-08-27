export const MAX_LOCAL_TEXT_FILE_BYTES = 500_000;

export async function readLocalTextFile(file: Pick<File, "name" | "size" | "text">) {
  if (!file.name.toLowerCase().endsWith(".txt")) throw new Error(".txt 형식의 텍스트 파일만 불러올 수 있어요.");
  if (file.size > MAX_LOCAL_TEXT_FILE_BYTES) throw new Error("텍스트 파일은 500KB 이하로 불러와 주세요.");

  const text = (await file.text()).replace(/\u0000/g, "").trim();
  if (!text) throw new Error("읽을 수 있는 텍스트가 없는 파일이에요.");
  return text;
}
