import { access, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";

const required = [
  "index.html",
  "painel_atrix.html",
  "central_dados.html",
  "painel-atrix-redesign.css",
  "painel-atrix-redesign.js",
  "vercel.json",
];

for (const file of required) {
  await access(file);
}

const html = await readFile("painel_atrix.html", "utf8");
if (!html.includes("Jarvis MCLL") || !html.includes("Dashboard com Regras")) {
  throw new Error("painel_atrix.html nao contem o layout principal do Jarvis MCLL.");
}

function assertNoBrokenChars(file, content) {
  if (/\uFFFD|[\u0080-\u009F]/.test(content)) {
    throw new Error(`${file} contem caracteres corrompidos.`);
  }
}

async function checkInlineScripts(file) {
  const content = await readFile(file, "utf8");
  const inlineScripts = [...content.matchAll(/<script>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
  const tmp = await mkdtemp(join(tmpdir(), "jarvis-static-"));

  for (let i = 0; i < inlineScripts.length; i += 1) {
    const scriptPath = join(tmp, `inline-${i}.js`);
    await writeFile(scriptPath, inlineScripts[i], "utf8");
    const result = spawnSync(process.execPath, ["--check", scriptPath], {
      encoding: "utf8",
    });

    if (result.status !== 0) {
      await rm(tmp, { recursive: true, force: true });
      throw new Error(`JavaScript inline invalido em ${file}:\n${result.stderr || result.stdout}`);
    }
  }

  await rm(tmp, { recursive: true, force: true });
}

assertNoBrokenChars("painel_atrix.html", html);
await checkInlineScripts("painel_atrix.html");
await checkInlineScripts("central_dados.html");

console.log("OK: estrutura estatica pronta para GitHub/Vercel.");
