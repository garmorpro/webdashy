import { ZipArchive } from "archiver";
import { PassThrough } from "node:stream";

export async function buildZipBuffer(files, issuedAt) {
  const output = new PassThrough();
  const chunks = [];
  output.on("data", (chunk) => chunks.push(chunk));
  const complete = new Promise((resolve, reject) => {
    output.on("end", () => resolve(Buffer.concat(chunks)));
    output.on("error", reject);
  });
  const archive = new ZipArchive({ zlib: { level: 9 } });
  archive.on("error", (error) => output.destroy(error));
  archive.pipe(output);
  for (const file of files) archive.append(file.buffer, { name: file.filename, date: new Date(issuedAt), mode: 0o644 });
  await archive.finalize();
  return complete;
}
