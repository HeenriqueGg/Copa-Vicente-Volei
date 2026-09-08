# Passo a Passo - Guardar os dados na nuvem (Supabase)

Seguindo este guia, os times, jogos, jogadores e noticias ficam salvos **na nuvem** e voce
verá os mesmos dados de qualquer lugar (outro computador, celular, internet). Leva cerca
de **10 a 15 minutos** e é gratuito.

> Se voce **ja criou equipes** usando o site antes, não se preocupe: depois de configurar
> tudo, a primeira vez que o admin fizer login no site, os dados locais sao enviados
> automaticamente para a nuvem.

---

## Etapa 1 - Criar a conta e o projeto no Supabase

1. Abra <https://supabase.com> e clique em **Start your project** (ou **Sign up**).
2. Faça login (pode entrar com GitHub ou Google).
3. Clique em **New project**.
4. Preencha:
   - **Name**: `Copa Vicente Volei`
   - **Database Password**: invente uma senha forte e **anote em algum lugar** (o banco fica protegido com ela)
   - **Region**: escolha um servidor perto de voce (ex: `South America (São Paulo)`)
5. Clique em **Create new project** e **aguarde 1 a 2 minutos** até o projeto ficar pronto.

---

## Etapa 2 - Criar a tabela que guarda os dados

1. No painel do projeto, no menu da esquerda, clique em **SQL Editor**.
2. Clique em **New query**.
3. Apague o texto que aparece e cole **todo o conteúdo** do arquivo:
   `supabase/migrations/0001_init.sql` (deste projeto).
4. Clique em **Run**.
5. Deve aparecer verde com algo como *"Success. No rows returned"*.

> O SQL agora é seguro para rodar de novo: se você rodou antes e deu erro, é só
> colar o conteúdo ATUAL do arquivo e clicar em **Run** de novo — ele corrige sozinho.

Pronto: agora existe uma tabela `site_data` que guarda tudo, e a leitura é liberada para
qualquer visitante (mas só quem sabe a senha consegue escrever).

---

## Etapa 3 - Copiar o endereço e a chave do projeto

1. No menu da esquerda, clique em **Settings** (engrenagem) e depois em **API**.
2. Copie o valor de **Project URL** (parece `https://abcdefghij.supabase.co`).
3. Copie a **anon public key** (a chave mais longa).
4. Abra o arquivo `index.html` com o Bloco de Notas ou VS Code.
5. Vá até a linha ~689 (seção `SUPABASE CONFIG`) e cole os dois valores, **dentro das aspas**:

```js
const SUPABASE_URL = 'https://SEU-PROJETO.supabase.co';
const SUPABASE_ANON_KEY = 'sua-anon-key-aqui';
```

6. **Salve** o arquivo.

> Atenção: as aspas `' '` precisam ficar em volta dos valores.

---

## Etapa 4 - Publicar as funções de segurança (Edge Functions)

Estas funções verificam a senha do admin no servidor, para a senha nunca ficar no site
visível para os outros.

### 4.1 Instalar o Node.js (se ainda não tiver)

1. Abra <https://nodejs.org> e baixe a versão **LTS**.
2. Instale (clique em "Next" até terminar).

### 4.2 Instalar o programa do Supabase (CLI)

1. Abra o **PowerShell** (menu Iniciar, digite "PowerShell").
2. Rode este comando e aguarde terminar:

```powershell
npm install -g supabase
```

### 4.3 Rodar o script de configuração

1. No mesmo PowerShell, entre na pasta do projeto.
   (No Windows Explorer, abra a pasta `Copa-Vicente-Volei` → na barrinha de endereço,
   digite `powershell` e aperte Enter.)
2. Rode:

```powershell
powershell -ExecutionPolicy Bypass -File .\supabase-config.ps1
```

3. O script vai pedir:
   - **PROJECT REF**: abra seu projeto no painel e olhe o endereço do navegador.
     Ele é o código depois de `supabase.com/dashboard/project/` (12 letras/números).
     Copie e cole no script.
   - **Senha do admin**: a senha que voce vai digitar no site para editar (ex: `copa2026`).
     Guarde bem, pois sem ela não dá para editar.
4. O script faz login no navegador, publica as funções e define a segurança sozinho.
5. No final deve aparecer: **"Pronto! Funcoes publicadas e seguranca definida."**

> Se o script reclamar que `supabase` não foi encontrado, feche e reabra o PowerShell
> e rode `npm install -g supabase` de novo antes.

---

## Etapa 5 - Testar (o momento da verdade)

1. Abra o site: dê dois cliques em `index.html` (ou abra via VS Code com "Open with Live Server").
2. No fim da página, o rodapé deve mostrar: **"Sincronizado com a nuvem - seus dados nao se perdem."**
3. Clique em **+ Nova Equipe**, digite a senha do admin e cadastre uma equipe de teste.
4. Confirme na tabela:
   - No painel do Supabase: menu esquerdo → **Table Editor** → tabela `site_data`.
   - A coluna `payload` deve conter a equipe que voce cadastrou.
5. **Teste em outro lugar**: abra `index.html` em outro navegador (ou em outra aba anônima
   `Ctrl+Shift+N`) → a equipe deve aparecer lá também. Funcionou!

> O script `supabase-config.ps1` só precisa ser rodado UMA vez. Depois, o site já
> sincroniza sozinho sempre que o admin logar e editar.

---

## Etapa 6 - (Recomendado) Publicar na internet

Assim qualquer pessoa online vê o site, sem precisar abrir o arquivo local.

1. Crie um repositório no GitHub e suba esta pasta (use o GitHub Desktop se preferir).
2. No repositório: **Settings** → **Pages** → em **Branch** escolha `main` → **Save**.
3. Aguarde 1-2 minutos e abra o link `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

---

## Dúvidas comuns

- **"O rodapé diz que está salvo só neste navegador":** o Supabase não está configurado.
  Verifique a Etapa 3 (valores dentro das aspas em `index.html`) e a Etapa 4.
- **"Sessão expirada" ao editar:** é só digitar a senha de novo (a sessão dura 2 minutos, é normal).
- **Esqueci a senha do admin:** rode de novo o script da Etapa 4.3, ele define uma nova.
- **Quero começar do zero:** no rodapé do site existe o botão "Resetar Dados".

---

## Resumo em 6 linhas

1. Criar projeto em supabase.com
2. Rodar o SQL de `supabase/migrations/0001_init.sql`
3. Colar URL + chave em `index.html` (linha ~689)
4. Rodar `supabase-config.ps1`
5. Testar: logar, cadastrar equipe, abrir em outra aba
6. (Opcional) Publicar no GitHub Pages