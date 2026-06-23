# Painel Jarvis - Marcellus

Projeto estático pronto para publicação no GitHub e na Vercel.

## Estrutura

- `index.html`: entrada local, redireciona para o painel.
- `painel_atrix.html`: painel principal preservando a rota/arquivo esperada.
- `painel-atrix-redesign.css`: camada visual reversível.
- `painel-atrix-redesign.js`: camada aditiva de tema, cabeçalho e organização visual.
- `assets/`: coloque `Logomarca.png` e `jarvis.png` aqui.
- `data/local/`: planilhas locais de operação. Esta pasta fica fora do Git.

## Rodar localmente

```bash
npm run check
npm run dev
```

Depois acesse `http://localhost:3000/painel_atrix`.

## Publicar na Vercel

1. Crie um repositório no GitHub.
2. Envie esta pasta para o repositório.
3. Na Vercel, importe o repositório.
4. Framework preset: `Other`.
5. Build command: deixe vazio.
6. Output directory: deixe vazio.

A rota `/painel_atrix` é redirecionada para `painel_atrix.html` pelo `vercel.json`.

## Observação de segurança

As planilhas e CSVs operacionais não devem ir para o GitHub. O `.gitignore` e o `.vercelignore` já bloqueiam `*.xlsx`, `*.xls`, `*.csv`, `Jarvis_mcll/` e `data/local/`.
