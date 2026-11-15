# Métricas sociais por podcast

## Objetivo

O Foco.dev exibe a quantidade compartilhada de curtidas e de navegadores que
ouviram cada episódio por pelo menos **30 segundos efetivos**. Um mesmo
navegador conta apenas uma vez por episódio, mesmo em novas reproduções.
Não é uma contagem de pessoas identificadas, sessões ou downloads.

As curtidas podem ser adicionadas ou removidas, sem criar uma conta. O cliente
guarda um identificador aleatório (UUID v4) no localStorage. O servidor armazena
apenas um hash HMAC-SHA256 desse identificador, sem nome ou e-mail.
IP também é transformado em hash para limitação de requisições (TTL de 60s).

## Ativar a persistência pela Vercel (recomendado)

O serviço é o **Upstash for Redis**, criado e gerenciado pelo Vercel
Marketplace. Não usar `@vercel/kv`: o Vercel KV foi descontinuado.

1. Acessar https://vercel.com/dashboard e selecionar o projeto que publica
   `https://classroommusic.vercel.app` (verificar o domínio em Settings > Domains).
2. Abrir **Infrastructure > Storage** (ou a aba **Storage**, dependendo do painel),
   selecionar **Create Database** e escolher **Upstash for Redis**.
   Link direto para o provedor: https://vercel.com/marketplace/upstash/upstash-kv
3. Instalar a integração. É possível criar uma conta Upstash gerenciada pela
   Vercel; escolher um nome como `focodev-social`, região próxima à função e
   o plano Free enquanto o volume permitir. Para estatísticas históricas,
   **não habilitar eviction**; se o limite de armazenamento for atingido,
   aumentar o plano em vez de descartar dados antigos.
4. Selecionar **Connect Project**, escolher o projeto que atende o domínio
   `classroommusic.vercel.app` e habilitar **Production**. Se quiser
   ambientes de preview, usar preferencialmente um banco separado para que
   testes não contaminem as contagens de produção.
5. Em **Settings > Environment Variables**, conferir que a integração
   incluiu credenciais. Este código aceita um dos pares:
   - `KV_REST_API_URL` e `KV_REST_API_TOKEN` (nomes do Marketplace);
   - `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` (nomes Upstash).

   Nenhuma cópia manual desses valores é necessária quando o Marketplace
   já os injeta no projeto.
6. Adicionar manualmente **uma** variável de ambiente em Production:
   `SOCIAL_ID_SECRET`, com no mínimo 32 caracteres aleatórios. Gerar
   o valor no PowerShell (Windows 11):

   ```powershell
   node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"
   ```

   Manter esse segredo estável entre deploys: trocá-lo altera os hashes
   de deduplicação dos navegadores.
7. Fazer **Redeploy** da implantação de produção para carregar as variáveis
   recém-adicionadas, caso a integração não crie um novo deployment.
8. Acessar `https://classroommusic.vercel.app/api/social`. Com a conexão
   ativa, a API deve responder HTTP 200 e devolver `{"stats":{...}}` com
   os episódios; antes de configurar, devolve HTTP 503.
   Abrir o site, curtir um episódio, atualizar e confirmar que a curtida
   persiste; iniciar reprodução e acumular 30 segundos efetivos para
   contabilizar um navegador ouvinte.

Para inspecionar os registros persistentes, o painel da Vercel oferece
**Infrastructure > Storage > banco Redis > Browser / CLI** para proprietários
da equipe. Chaves de exemplo: `foco:social:likes:javascript-em-10-dias`
e `foco:social:listeners:javascript-em-10-dias`.

As contagens começam em **zero** quando o banco é criado: não há como
recuperar reproduções nem curtidas anteriores à sua ativação.

Referências oficiais:
- https://vercel.com/docs/marketplace-storage
- https://vercel.com/docs/redis
- https://upstash.com/docs/redis/howto/vercelintegration
- https://upstash.com/docs/redis/features/durability

### Testar no Windows 11

```powershell
$env:UPSTASH_REDIS_REST_URL="https://seu-redis.upstash.io"
$env:UPSTASH_REDIS_REST_TOKEN="TOKEN-PRIVADO"
$env:SOCIAL_ID_SECRET="SEGREDO-GERADO-ACIMA"
npm run dev
```

Abrir `http://127.0.0.1:4173`. Sem as credenciais e o segredo, a API retorna HTTP 503;
a interface mostra `—` (indisponível), **nunca inventa contagens**.

## Ordenação por popularidade

Os cards da página Explorar (inclusive após filtrar pela busca) e da lista de podcasts são priorizados pelas métricas reais armazenadas no Redis:

1. Maior soma de curtidas e ouvintes únicos por navegador.
2. Em caso de empate, maior número de ouvintes.
3. Persistindo o empate ou sem métricas disponíveis, ordem editorial do catálogo.

A ordem é recalculada no carregamento da página e após uma interação confirmada (curtida, descurtida ou novo ouvinte contabilizado). Os elementos já renderizados são movidos sem perder ações e foco. Não há polling constante entre navegadores, para respeitar a quota gratuita do Redis: interações de outras pessoas aparecerão quando a página for reaberta ou atualizada. A fila do player não é modificada.

## Regras de contabilização

- `GET /api/social`: retorna `stats[id].likes` e `stats[id].listeners`.
- `POST /api/social` com `{id, action, visitorId}`: ação `like`,
  `unlike` ou `listen`.
- Ações aplicadas atomicamente via Lua EVAL e conjuntos Redis para
  deduplicação. O mesmo identificador não aumenta o contador duas vezes.
- O player envia `listen` após 30 segundos dos trechos efetivamente
  reproduzidos segundo `HTMLMediaElement.played`. O navegador contabiliza
  `TimeRanges` em vez de diferenças entre eventos `timeupdate`, que podem
  ocorrer com menor frequência no Android. Avançar na barra não contribui.
- O registro só atualiza o total após a confirmação da API. Se falhar,
  o cliente informa o problema e tenta novamente após uma janela de 30s.
  A lista **Fila** também apresenta a contagem e sinaliza a faixa em reprodução.
- Uma nova instalação, navegador, perfil ou limpeza do armazenamento pode
  gerar outro identificador; usuários com a mesma máquina/navegador
  compartilham um identificador. **Não é uma medição de ouvintes únicos
  verificados por conta**, nem de conclusão de episódios.
- O endpoint possui validação de ID/ação/UUID, checagem de Origin
  e limitação básica de 60 POSTs por minuto por IP de origem, mas
  a contagem anônima não é à prova de automação maliciosa.
- Sem Redis, o controle de curtir fica desabilitado e os totais são exibidos
  como indisponíveis; o player e o catálogo continuam funcionais.

## Privacidade e manutenção

Documentar no aviso de privacidade do projeto o UUID persistente e o uso
do Redis para contagens agregadas. Não registrar o token, UUID bruto ou
IP em logs da aplicação. Os conjuntos Redis não possuem expiração porque
preservam contagens históricas; aplicar política de retenção se necessário.

## Ativação inicial em produção

Após conectar o banco `focodev-social` e adicionar `SOCIAL_ID_SECRET` no projeto Vercel `classroommusic`, uma nova implantação automática da branch `main` aplica as variáveis. Validar `GET /api/social` com HTTP 200 e confirmar os contadores no site. Não publicar nem registrar segredos no repositório.
