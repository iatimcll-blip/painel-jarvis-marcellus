# Deploy GitHub + Vercel

## Preparar Git

```bash
git init -b main
git add .
git commit -m "Preparar painel Jarvis para Vercel"
```

Se o Git pedir identidade:

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

## Enviar para GitHub

```bash
git remote add origin https://github.com/SEU_USUARIO/painel-jarvis-marcellus.git
git push -u origin main
```

## Importar na Vercel

1. Acesse a Vercel e escolha `Add New Project`.
2. Importe o repositório `painel-jarvis-marcellus`.
3. Use `Other` como preset.
4. Deixe `Build Command` e `Output Directory` vazios.
5. Publique.

Rotas esperadas:

- `/`
- `/painel_atrix`
- `/painel_atrix.html`
