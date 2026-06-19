# BarberSystem ✂️

Sistema completo de gestão e agendamento online para barbearias.

## Stack
- **Next.js 14** (App Router) + TypeScript
- **Supabase** (PostgreSQL + Auth)
- **Tailwind CSS**
- **Vercel** (deploy gratuito)

## Funcionalidades

### Área do Cliente
- Landing page com serviços e equipe
- Agendamento em 4 etapas: barbeiro → serviço → data/hora → confirmação
- Prevenção automática de conflito de horários

### Painel Administrativo (`/admin`)
- Dashboard com agenda do dia e receita
- Gerenciamento de agendamentos (filtros, confirmar/concluir/cancelar)
- Cadastro de barbeiros e serviços
- Configuração de horários de trabalho e bloqueios por barbeiro

## Deploy no Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/renanallinn/barbearia-system)

Variáveis de ambiente necessárias:
```
NEXT_PUBLIC_SUPABASE_URL=https://qruryzscnlqijyrslpyy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<sua_anon_key>
```

## Desenvolvimento local

```bash
npm install
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Login Admin
- **Email:** renan.allinn@gmail.com  
- **Senha:** Barbearia@2025!
