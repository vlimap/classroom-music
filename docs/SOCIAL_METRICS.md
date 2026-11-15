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

## Ativar em produção (Vercel)

1. Criar um banco **Upstash Redis** em https://console.upstash.com/ ou pela
   integração da Vercel. Copiar a **REST URL** e o **REST TOKEN**.
2. No projeto Vercel que atende **classroommusic.vercel.app**, ir a
   Settings > Environment Variables e cadastrar:
   - `UPSTASH_REDIS_REST_URL`: URL HTTPS do Redis.
   - `UPSTASH_REDIS_REST_TOKEN`: token REST secreto.
   - `SOCIAL_ID_SECRET`: segredo aleatório com pelo menos 32 caracteres.
3. Gerar segredo no PowerShell do Windows 11:

   ```powershell
   node --input-type=module -e "import { randomBytes } from 'node:crypto'; console.log(randomBytes(32).toString('hex'))"
   ```

4. Marcar as variáveis para o ambiente **Production** (e Preview, se desejado).
5. Fazer um novo deployment para que a Function `/api/social` receba
   as variáveis. Nunca incluir credenciais no GitHub ou em JavaScript público.

As novas métricas começam em **zero**. Não é possível inferir reproduções
ou curtidas anteriores à ativação do serviço.

### Testar no Windows 11

```powershell
$env:UPSTASH_REDIS_REST_URL="https://seu-redis.upstash.io"
$env:UPSTASH_REDIS_REST_TOKEN="TOKEN-PRIVADO"
$env:SOCIAL_ID_SECRET="SEGREDO-GERADO-ACIMA"
npm run dev
```

Abrir `http://127.0.0.1:4173`. Sem as variáveis, a API retorna HTTP 503;
a interface mostra `—` (indisponível), **nunca inventa contagens**.

## Regras de contabilização

- `GET /api/social`: retorna `stats[id].likes` e `stats[id].listeners`.
- `POST /api/social` com `{id, action, visitorId}`: ação `like`,
  `unlike` ou `listen`.
- Ações aplicadas atomicamente via Lua EVAL e conjuntos Redis para
  deduplicação. O mesmo identificador não aumenta o contador duas vezes.
- O player envia `listen` após acumular 30 segundos de reprodução válida.
  Pausas e saltos grandes de posição não contribuem com esse tempo.
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
