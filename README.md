# Copa Vicente Rijo — Voleibol

Site estático para o campeonato, com dados compartilhados entre todos os visitantes e
persistência em nuvem usando **Supabase**.

## Como funciona

- **Qualquer visitante** vê as mesmas informações (jogos, classificação, equipes, notícias).
- **Só o admin** (quem sabe a senha) pode editar.
- Os dados ficam salvos numa tabela PostgreSQL do Supabase, então não se perdem ao
  fechar o navegador nem dependem do computador de quem abriu o site.
- **GitHub Pages** (ou qualquer hospedagem estática) serve o site; o Supabase guarda os dados.

> Se o Supabase **não** estiver configurado, o site usa `localStorage` (dados locais ao
> navegador) apenas para desenvolvimento/visualização. Configure o Supabase para o uso real.
>
> 💡 **Migração automática:** se você já criou equipes antes de configurar o Supabase,
> na primeira vez que o admin fizer login eles são enviados automaticamente para a nuvem.
> O rodapé do site mostra o status ("Sincronizado com a nuvem" vs "salvo só neste navegador").

---

## Passo a passo de configuração

### 1. Criar o projeto no Supabase

1. Crie uma conta gratuita em <https://supabase.com>.
2. Crie um **New project** (escolha um nome, senha do banco e uma região perto de você).
3. Aguarde o projeto ser criado.

### 2. Criar a tabela de dados

1. No painel, vá em **SQL Editor** > **New query**.
2. Cole o conteúdo de `supabase/migrations/0001_init.sql` e clique em **Run**.
   - Isso cria a tabela `site_data`, libera a leitura pública e bloqueia escrita pela internet
     (a escrita só acontece pela Edge Function autorizada).

### 3. Configurar a página

1. No painel, vá em **Settings** > **API**.
2. Copie o **Project URL** e a **anon public key**.
3. No arquivo `index.html`, na seção `// ==== SUPABASE CONFIG ====`, cole esses valores:

```js
const SUPABASE_URL = 'https://SEU-REF.supabase.co';
const SUPABASE_ANON_KEY = 'sua-anon-key-aqui';
```

### 4. Deploy das Edge Functions (segurança da senha)

As Edge Functions verificam a senha do admin **no servidor** (nunca exposta no código do site).

> **No Windows**, rode o script automático e pule os passos abaixo daqui até o fim deste item:

```powershell
powershell -ExecutionPolicy Bypass -File .\supabase-config.ps1
```

Ele faz o login, vincula o projeto, publica as funções e define a senha do admin e a chave de segurança.

**Manualmente**, faça:

1. Instale a CLI do Supabase: <https://supabase.com/docs/guides/cli>
2. No terminal, dentro desta pasta:

```bash
supabase login
supabase link --project-ref SEU-REF
supabase functions deploy admin-verify
supabase functions deploy save-data
```

3. Defina as variáveis de ambiente das funções em **Dashboard** > **Edge Functions** > a função > **Secrets** (ou via CLI):

   - `ADMIN_PASS`: a senha que você vai usar para editar o site (ex: `minhasenha123`)
   - `TOKEN_SECRET`: uma string aleatória de segurança (gere com `openssl rand -hex 32`)

   Defina as duas para **ambas** as funções (`admin-verify` e `save-data`).

### 5. Publicar o site

1. Suba este repositório para o GitHub.
2. Configure o **GitHub Pages** (Settings > Pages > branch `main`).
3. Pronto! Qualquer pessoa que abrir o site vê os dados, e só quem sabe a senha edita.

---

## Estrutura

```
index.html                    Site (frontend)
supabase-config.ps1           Script de configuracao automatica (Windows)
supabase/
  migrations/0001_init.sql    Tabela + regras de acesso
  functions/
    admin-verify/             Verifica a senha e gera token curto
    save-data/                Salva os dados (exige token valido)
  config.toml                 Configuracao de deploy das funcoes
```

## Segurança

- A senha do admin **nunca** fica no código do site — fica na variável de ambiente
  `ADMIN_PASS` das Edge Functions.
- A escrita no banco é bloqueada pela internet (RLS); só a Edge Function (com a
  service role key, que não é exposta) consegue escrever.
- O token de escrita gerado no login expira em 2 minutos.
