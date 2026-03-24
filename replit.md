# Krav Magá IPIRANGA Manager

Sistema de gestão para a escola de Krav Magá Ipiranga.

## Stack

- **Framework:** Next.js 15 (App Router) com TypeScript
- **Banco de dados / Auth:** Firebase Firestore + Firebase Authentication
- **UI:** shadcn/ui + Tailwind CSS + Radix UI
- **Formulários:** react-hook-form + zod
- **Gráficos:** recharts
- **Runtime:** Node.js ≥ 20

## Desenvolvimento

```bash
npm run dev   # inicia na porta 5000
npm run build
npm run typecheck
```

## Estrutura principal

```
src/
  app/           # Rotas Next.js (App Router)
  components/    # Componentes por domínio
  firebase/      # Config e hooks Firebase
  lib/           # Tipos, utilitários, templates de mensagem
  hooks/         # Hooks globais (use-toast, etc.)
```

## Rotas públicas (sem autenticação)

- `/login` — login admin
- `/register` — cadastro admin
- `/login-aluno` — login do aluno
- `/portal-aluno` — portal do aluno
- `/mes-das-mulheres/registro` — formulário da campanha Mês das Mulheres

## Funcionalidades ativas

| Área | Rota |
|---|---|
| Dashboard | `/dashboard` |
| Alunos | `/alunos` |
| Chamada | `/chamada` |
| Pagamentos | `/pagamentos` |
| Vendas | `/vendas` |
| Planos Vencidos | `/planos-vencidos` |
| Leads | `/leads` |
| Agendamentos | `/agendamentos` |
| Exames | `/exames` |
| Indicadores | `/indicadores`, `/indicadores-internos` |
| Central de Mensagens | `/central-de-mensagens` |
| Mês das Mulheres | `/mes-das-mulheres` |
| Empresas | `/empresas` |
| Seminários | `/seminarios` |
| Uniformes | `/uniformes` |
| Créditos | `/creditos` |
| Lista de Tarefas | `/lista-de-tarefas` |
| Apostila | `/apostila` |
| Configurações | `/configuracoes` |

## Integrações externas

- **Firebase** (Firestore + Auth) — backend principal
- **WhatsApp (`wa.me`)** — envio manual de mensagens, cobranças e recibos
- **PIX** — chave CNPJ `31.116.136/0001-95`; QR code estático via `api.qrserver.com`
- **Google Fonts / Gmail** — uso via links `mailto:` no frontend

## Funcionalidades removidas

- **Gift Card** — página, formulário e embed HTML removidos (incompleto; sem envio de e-mail automatizado nem geração de PDF)
- **Genkit / Google AI** — integração de IA removida (nunca foi utilizada na aplicação; não havia flows implementados)
- **googleapis** — pacote removido (sem uso no código-fonte)
- **firebase-admin** — pacote removido (sem uso no código-fonte; nenhuma API route server-side existente)
- **dotenv** — pacote removido (Next.js carrega `.env.local` nativamente)
- **patch-package** — pacote removido (sem patches configurados)

## Notas de segurança

Overrides de dependências transitivas definidos em `package.json → overrides`:
- `@hono/node-server@1.19.10`
- `express-rate-limit@8.2.2`
- `fast-xml-parser@5.5.6`
- `hono@4.12.4`
- `minimatch@9.0.7`
