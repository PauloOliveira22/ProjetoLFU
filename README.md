# ⚽ Brasileirão Draft

Jogo mobile de futebol com tema do **Brasileirão**. A proposta é simples e
viciante, no espírito dos joguinhos virais de Copa:

1. **Clube** — você escolhe um clube brasileiro para **representar**. Cada
   título conquistado conta no **ranking global de títulos por time**.
2. **Formação** — escolha a tática (**4-3-3, 4-4-2, 3-5-2, 4-2-3-1 ou 5-3-2**),
   expressa nas **7 posições** reais: goleiro, zagueiro, lateral, volante,
   meia, ponta e atacante.
3. **Draft** — o jogo sorteia um **elenco real da Série A (2003–2025)** e você
   escolhe **qualquer jogador** de uma posição ainda em aberto. As **notas
   (overall) ficam ocultas** durante o draft — só aparecem no resumo do time.
4. Repete até completar os **11 titulares**.
5. Com o time pronto, você disputa o **Brasileirão Série A (20 times, ida e
   volta = 38 rodadas)** com partidas **simuladas**: placar dinâmico ao vivo +
   narração em texto. Termine no topo e seja **campeão** — ou caia entre os 4
   últimos e seja **rebaixado**.

> Os elencos vêm de um dataset real (`data/brasileirao_2003_2025.csv`) com
> ~9.200 jogadores. O arquivo `www/js/data.js` é **gerado** a partir dele
> (veja "Dataset" abaixo).

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

### 🔒 Validação server-side (anti-trapaça)

No modo nuvem, **o cliente nunca grava estatísticas nem títulos** — ele só lê.
Quem decide o resultado é uma **Edge Function** que roda no servidor:

1. O app envia apenas o **elenco escalado** (clube, formação e os 11 jogadores
   por `clube/ano/nome`).
2. A função [`submit-season`](supabase/functions/submit-season/index.ts):
   - exige usuário **autenticado**;
   - **valida** o elenco contra o dataset canônico do servidor
     ([`_shared/dataset.ts`](supabase/functions/_shared/dataset.ts)) — posição e
     rating vêm do servidor, então **não dá para inflar atributos** nem
     escalar jogadores inexistentes;
   - **simula a temporada no servidor** com uma *seed* (auditável);
   - grava estatísticas e título com a **service role** (a tabela é fechada por
     RLS para o cliente);
   - devolve a temporada para o app apenas **reproduzir** (o jogo que você
     assiste é exatamente o que foi registrado).

**Deploy da função** (precisa do [Supabase CLI](https://supabase.com/docs/guides/cli)):

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase functions deploy submit-season    # ou: npm run supabase:deploy
```

As variáveis `SUPABASE_URL`, `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`
já são injetadas automaticamente no ambiente da função.

> **Limitação atual:** o sorteio do draft ainda acontece no cliente — o
> servidor valida o *elenco final*, mas não dirige o sorteio. Tornar o draft
> 100% autoritativo (servidor sorteia e registra cada escolha) é o próximo
> passo natural.

## 📦 Dataset (elencos do draft)

A fonte é `data/brasileirao_2003_2025.csv` (`ano, clube, jogador, posicao,
overall, jogos`). O pipeline gera os dois lados a partir dela:

```bash
npm run data:build   # = import:csv (CSV -> data.js) + gen:dataset (data.js -> dataset.ts)
```

- `import:csv` mapeia as posições do CSV para as **7 do jogo**
  (Goleiro→GK, Zagueiro→ZAG, Lateral→LAT, Volante→VOL, Meia→MEI, Ponta→PON,
  Atacante→ATA) e descarta elencos com poucos dados (< 16 jogadores).
- `gen:dataset` regenera o dataset canônico do servidor a partir do `data.js`,
  garantindo paridade. `npm run test:parity` confere as quantidades.

Para adicionar/ajustar jogadores, edite o CSV e rode `npm run data:build`.

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
│       ├── data.js           # GERADO: elencos reais 2003-2025 + clubes
│       ├── engine.js         # draft, simulação de partida e temporada
│       ├── store.js          # contas, estatísticas e ranking (nuvem/local)
│       └── ui.js             # telas e narração ao vivo
├── data/
│   └── brasileirao_2003_2025.csv  # fonte dos elencos (entrada do pipeline)
├── supabase/
│   ├── schema.sql            # tabelas, RLS e função de ranking (rodar no Supabase)
│   └── functions/
│       ├── _shared/
│       │   ├── dataset.ts    # dataset canônico (servidor)
│       │   ├── engine.ts     # simulação autoritativa (seed)
│       │   └── validate.ts   # validação do elenco
│       └── submit-season/
│           └── index.ts      # Edge Function: valida + simula + grava
└── tools/
    ├── serve.js              # servidor estático de desenvolvimento
    ├── import-csv.js         # CSV -> www/js/data.js
    ├── gen-dataset.js        # data.js -> dataset.ts (servidor)
    ├── test-engine.js        # testes da lógica
    └── test-parity.js        # confere cliente x servidor (dataset)
```

## 🚀 Próximos passos (ideias)

- Expandir a base de elencos e adicionar escudos/cores dos clubes
- Salvar progresso (localStorage) e histórico de temporadas
- Turno e returno (ida e volta), playoffs e copa
- Habilidades especiais por jogador e cartas de "lendas"
- Sons, vibração (haptics) e animações de gol
