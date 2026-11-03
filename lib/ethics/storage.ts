import fs from "fs";
import path from "path";

const STORAGE_ROOT = path.join(process.cwd(), "storage", "private", "ethics");

function ensureDirectoryExists() {
  if (!fs.existsSync(STORAGE_ROOT)) {
    fs.mkdirSync(STORAGE_ROOT, { recursive: true });
  }
}

export async function saveEthicsDocument(
  studyId: string,
  originalFilename: string,
  buffer: Buffer
): Promise<string> {
  ensureDirectoryExists();
  const ext = path.extname(originalFilename) || ".pdf";
  const cleanId = studyId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeFilename = `${cleanId}_${Date.now()}${ext}`;
  const absolutePath = path.join(STORAGE_ROOT, safeFilename);

  await fs.promises.writeFile(absolutePath, buffer);
  return safeFilename; // Store relative safe filename
}

export async function getEthicsDocument(storedFilename: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  filename: string;
} | null> {
  const safeFilename = path.basename(storedFilename);
  const absolutePath = path.join(STORAGE_ROOT, safeFilename);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const buffer = await fs.promises.readFile(absolutePath);
  const ext = path.extname(safeFilename).toLowerCase();
  let mimeType = "application/pdf";
  if (ext === ".png") mimeType = "image/png";
  if (ext === ".jpg" || ext === ".jpeg") mimeType = "image/jpeg";

  return {
    buffer,
    mimeType,
    filename: safeFilename,
  };
}
