# ⚽ Brasileirão Draft

Jogo mobile de futebol com tema do **Brasileirão**. A proposta é simples e
viciante, no espírito dos joguinhos virais de Copa:

1. **Clube** — você escolhe um clube brasileiro para **representar**. Cada
   título conquistado conta no **ranking global de títulos por time**.
2. **Formação** — escolha a tática do time (**4-3-3, 4-4-2, 3-5-2,
   4-2-3-1 ou 5-3-2**), que define quantos jogadores de cada posição você terá.
3. **Draft** — o jogo sorteia um **elenco histórico** de um clube brasileiro
   (ex.: *Santos 1962*, *Flamengo 1981*, *Palmeiras 2022*) e você escolhe
   **qualquer jogador** de uma posição ainda em aberto.
4. Repete até completar os **11 titulares**.
5. Com o time pronto, você disputa uma **temporada** com partidas
   **simuladas**: placar dinâmico ao vivo + narração em texto.
5. Termine no topo da **tabela** e seja **campeão**.

> O elenco de jogadores é um conjunto inicial/ilustrativo (homenagem a craques
> do futebol brasileiro), pensado para ser **facilmente expandido** em
> `www/js/data.js`.

## 🧱 Stack

- **HTML5 + CSS + JavaScript puro** (sem etapa de build) em `www/`
- Empacotamento Android via **[Capacitor](https://capacitorjs.com/)**

## ▶️ Rodar no navegador (desenvolvimento)

```bash
npm start
# abre http://localhost:3000
```

Não precisa de dependências para testar a versão web — é um servidor estático
em Node puro (`tools/serve.js`).

## ✅ Testes

Testes de fumaça da lógica do jogo (draft, simulação e temporada), sem
navegador:

```bash
npm test
```

## 📱 Gerar o app Android (APK)

Pré-requisitos: **Node.js**, **Android Studio** (com SDK) e **JDK 17**.

```bash
# 1. Instalar dependências do Capacitor
npm install

# 2. Adicionar a plataforma Android (cria a pasta android/)
npx cap add android

# 3. Sincronizar os arquivos web (www/) para o projeto nativo
npx cap sync

# 4. Abrir no Android Studio para rodar/gerar o APK
npx cap open android
```

No Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
Para sempre que alterar o jogo, basta `npx cap sync` de novo.

## 👤 Contas, estatísticas e ranking (Supabase)

O jogo tem um sistema de contas com **fallback automático**:

- **Sem configurar nada** → *modo local*: estatísticas (títulos, vitórias,
  gols...) e ranking de títulos por time ficam salvos **neste aparelho**.
- **Com Supabase configurado** → *modo nuvem*: login real (e-mail/senha),
  estatísticas na sua conta e **ranking global** de títulos por time entre
  todos os jogadores.

### Como ativar a nuvem

1. Crie um projeto gratuito em **[supabase.com](https://supabase.com)**.
2. No painel: **SQL Editor → New query**, cole todo o conteúdo de
   [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**
   (cria as tabelas, as policies de segurança e a função de ranking).
3. Em **Project Settings → API**, copie a **Project URL** e a **anon key**.
4. Cole as duas em [`www/js/config.js`](www/js/config.js):
   ```js
   global.LFU.config = {
     SUPABASE_URL: 'https://xxxx.supabase.co',
     SUPABASE_ANON_KEY: 'eyJ...'
   };
   ```
5. Pronto. A `anon key` é **pública** e segura no cliente — a segurança vem
   das policies de **Row Level Security** já incluídas no schema.

> Sem internet (ou se o Supabase não carregar), o jogo cai sozinho para o
> modo local.

## 🗂️ Estrutura

```
ProjetoLFU/
├── capacitor.config.json     # config do app Android (id, nome, webDir)
├── package.json
├── www/                      # o jogo (vira o conteúdo do app)
│   ├── index.html
│   ├── css/styles.css
│   └── js/
│       ├── config.js         # chaves do Supabase (vazio = modo local)
│       ├── data.js           # elencos históricos + clubes
│       ├── engine.js         # draft, simulação de partida e temporada
│       ├── store.js          # contas, estatísticas e ranking (nuvem/local)
│       └── ui.js             # telas e narração ao vivo
├── supabase/
│   └── schema.sql            # tabelas, RLS e função de ranking (rodar no Supabase)
└── tools/
    ├── serve.js              # servidor estático de desenvolvimento
    └── test-engine.js        # testes da lógica
```

## 🚀 Próximos passos (ideias)

- Expandir a base de elencos e adicionar escudos/cores dos clubes
- Salvar progresso (localStorage) e histórico de temporadas
- Turno e returno (ida e volta), playoffs e copa
- Habilidades especiais por jogador e cartas de "lendas"
- Sons, vibração (haptics) e animações de gol
