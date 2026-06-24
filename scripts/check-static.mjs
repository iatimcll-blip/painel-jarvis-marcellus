import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const required = [
  "index.html",
  "painel_atrix.html",
  "painel-atrix-redesign.css",
  "painel-atrix-redesign.js",
  "vercel.json",
];

for (const file of required) {
  await access(file);
}

const html = await readFile("painel_atrix.html", "utf8");
const requiredSnippets = [
  '<link rel="stylesheet" href="./painel-atrix-redesign.css">',
  '<script src="./painel-atrix-redesign.js"></script>',
];

for (const snippet of requiredSnippets) {
  if (!html.includes(snippet)) {
    throw new Error(`Trecho obrigatorio ausente em painel_atrix.html: ${snippet}`);
  }
}

if (/\uFFFD|[\u0080-\u009F]/.test(html)) {
  throw new Error("painel_atrix.html contem caracteres corrompidos.");
}

const inlineScripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const tmp = await mkdtemp(join(tmpdir(), "jarvis-static-"));

try {
  for (let i = 0; i < inlineScripts.length; i += 1) {
    const scriptPath = join(tmp, `inline-${i}.js`);
    await writeFile(scriptPath, inlineScripts[i], "utf8");
    const result = spawnSync(process.execPath, ["--check", scriptPath], {
      encoding: "utf8",
    });

    if (result.status !== 0) {
      throw new Error(`JavaScript inline invalido em painel_atrix.html:\n${result.stderr || result.stdout}`);
    }
  }
} finally {
  await rm(tmp, { recursive: true, force: true });
}

console.log("OK: estrutura estatica pronta para GitHub/Vercel.");
