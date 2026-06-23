import { access, readFile } from "node:fs/promises";

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
    throw new Error(`Trecho obrigatório ausente em painel_atrix.html: ${snippet}`);
  }
}

console.log("OK: estrutura estática pronta para GitHub/Vercel.");
