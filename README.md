# A Magia do Sim — Área dos Noivos

Protótipo funcional e responsivo da plataforma **A Magia do Sim**, criado a partir do briefing visual e funcional fornecido.

## O que está incluído

- Login da cliente e acesso demonstrativo da assessora
- Dashboard com contagem regressiva dinâmica
- Meu casamento
- Fornecedores e detalhe do fornecedor
- Checklist interativo com persistência em `localStorage`
- Cronograma
- Documentos
- Financeiro
- Reuniões
- Perfil
- Painel administrativo da assessora
- Layout responsivo para desktop, tablet e celular
- Modais, filtros, badges, barras de progresso e notificações
- Identidade visual em creme, verde oliva, marrom e dourado
- Logo oficial em `assets/logo-oficial.png`

## Como testar localmente

Como o projeto é estático, não precisa instalar dependências.

### Opção 1 — abrir direto
Abra `index.html` no navegador.

### Opção 2 — servidor local
Se tiver Python instalado:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Login de demonstração

Na tela de login, qualquer e-mail e senha válidos entram na área dos noivos.

Para visualizar a área da assessora, clique em **Entrar como assessora**.

## Subir no GitHub

1. Crie um repositório novo no GitHub.
2. Envie todos os arquivos e pastas deste projeto para a raiz do repositório.
3. Faça o commit.
4. Em **Settings > Pages**, selecione **Deploy from a branch**.
5. Escolha a branch `main` e a pasta `/ (root)`.
6. Salve. O GitHub Pages publicará o site.

## Estrutura

```text
magia-do-sim/
├── index.html
├── styles.css
├── app.js
├── README.md
├── .gitignore
└── assets/
    ├── logo-oficial.png
    └── referencia-visual.png
```

## Observação sobre o backend

Esta entrega é um protótipo de frontend funcional. Os dados são demonstrativos e ficam no navegador. Para uso real com múltiplos clientes, autenticação, upload de contratos e pagamentos, conecte o frontend a um backend como Supabase/Firebase ou a uma API própria.
