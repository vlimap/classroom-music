# Segurança do Foco.dev

O Foco.dev é um site público sem autenticação. Esta é uma decisão de produto:
qualquer pessoa pode consultar, ouvir e interagir com os podcasts sem conta.

## Proteções implementadas

- **CI/CD e previews:** configurações do `vercel.json` permitem deployments automáticos somente na `main`, evitando expor branches em Preview e ajudando a preservar a quota Hobby. Os PRs continuam testados pelo GitHub Actions. São possíveis deployments manuais conforme a política Vercel.


- **TLS/HTTPS:** hospedagem Vercel; HSTS do domínio atual por 1 ano, sem
  `includeSubDomains` porque o projeto está em `vercel.app`.
- **Content Security Policy (CSP) em modo de bloqueio:** scripts locais e
  script oficial do VLibras; CSS/fontes somente do projeto, VLibras e
  Bootstrap Icons no jsDelivr. Bloqueia JavaScript inline, `object`,
  `base` de terceiros e enquadramento do site. A exceção
  `style-src 'unsafe-inline'` é mantida para o VLibras. Testar a tradução
  após cada atualização do widget.
- **Isolamento do browser:** `nosniff`, `X-Frame-Options: DENY`, política
  de referências e permissões de sensores/câmera/microfone desativadas.
  O compartilhamento nativo e o player não são bloqueados.
- **API /api/social:** somente GET e POST. Mudanças exigem `Origin` idêntico
  ao domínio da requisição; faltando Origin ou com `Sec-Fetch-Site` suspeito,
  a API recusa com HTTP 403. Content-Type é validado e o corpo é limitado a
  256 **bytes mesmo sem Content-Length**, protegendo contra payloads grandes.
- **Antispam de leitura e escrita:** Upstash Redis aplica limitação atômica
  por IP da borda Vercel: GET 30/min e 1.000/dia; POST 60/min e 1.000/dia.
  O bloqueio responde HTTP 429; Redis nunca é exposto ao navegador.
  As chaves de limitação usam HMAC-SHA256 do IP, com TTL de 60 segundos/1 dia.
- **Persistência:** curtidas e ouvintes usam identificadores aleatórios do
  navegador (UUIDv4), armazenados no Redis apenas como HMAC-SHA256. Ações
  nos contadores são atômicas; duas requisições com o mesmo identificador
  não criam duas curtidas/ouvintes.
- **Saídas e dados:** renderização textual usa `textContent` ou escape de
  HTML; links editoriais aceitam apenas HTTPS; erros da API não expõem
  tokens ou stack traces aos clientes. Logs não imprimem IPs nem IDs brutos.
- **Supply chain:** GitHub Actions estão fixados em SHAs imutáveis
  verificados, e Dependabot sugere atualizações periódicas.

## Riscos residuais e limitações importantes

1. **Sem login, não existe identidade humana verificável.** Uma pessoa pode
   apagar os dados locais ou criar vários perfis e parecer vários
   visitantes. As medidas impedem duplicação trivial, não fraude distribuída.
   Também não é possível demonstrar pelo servidor que um bot escutou áudio
   real antes de enviar a ação `listen`. Por isso os contadores representam
   **identificadores de navegadores**, e não ouvintes auditados.
2. **Limite por IP pode afetar redes compartilhadas.** Uma turma de máquinas
   sob um mesmo IP poderá atingir HTTP 429. Ajuste os limites com base em
   monitoramento real, evitando eliminar a proteção.
3. **Rate limit de aplicação não substitui a borda.** Foi ativada no
   Vercel Firewall do projeto `classroommusic` uma regra para `/api/social`
   (GET e POST) de **120 requisições por 60 segundos por IP**, com resposta
   HTTP 429 ao exceder. Essa regra atua antes da Function, complementando
   a limitação mais restritiva por GET/POST existente na aplicação.
   Ataques distribuídos e a quota da plataforma continuam sendo riscos.
4. **Dependências externas:** VLibras executa código oficial de terceiros
   no navegador e Bootstrap Icons carrega CSS da CDN. A CSP limita os
   domínios, mas não elimina vulnerabilidades nos provedores; evitar
   adicionar scripts e domínios sem revisão.
5. **Não há proteção de arquivos de áudio contra download**: os MP4/M4A são
   públicos, como previsto no projeto. `controlslist=nodownload` não é DRM.
6. **Disponibilidade:** serviços Free/Hobby possuem limites, e proteção de
   aplicação não impede ataques distribuídos de grande escala. A Vercel
   oferece mitigação automática de DDoS; não é SLA ou garantia absoluta.
7. **CSP é uma política restritiva:** conferir no navegador os erros
   `Refused to...` do console após cada atualização do VLibras. Adicionar
   apenas os domínios efetivamente necessários, nunca `*` ou
   `'unsafe-inline'` em `script-src`.

## Operação e resposta a incidentes

- Proteger a **conta GitHub e Vercel com MFA**, revisar membros e permissões,
  e manter `SOCIAL_ID_SECRET`, `KV_REST_API_TOKEN` e demais credenciais
  apenas como variáveis Secret na Vercel. Não compartilhar no chat ou no
  repositório.
- Acompanhar aumento de HTTP 429/503 e requisições `/api/social` no
  painel Vercel Firewall/Logs e no Upstash. Em abuso real, aplicar bloqueio
  ou challenge no WAF, com cuidado para não bloquear SEO e acessibilidade.
- Para rotacionar credenciais Upstash, atualizar Secret e fazer deployment.
  Rotacionar `SOCIAL_ID_SECRET` muda os hashes, fazendo visitantes já
  registrados parecerem novos; planejar essa alteração.
- Nunca publicar arquivos `.env`, backups Redis, tokens, UUIDs ou IPs
  em issues públicas. Vulnerabilidades devem ser relatadas ao mantenedor
  por um canal privado, se disponível.
- Testar no Windows 11: `npm run check`, `npm test` e
  `npm run dev`. Validar no ambiente publicado: busca, reprodução,
  curtidas, 30 segundos de áudio, compartilhamento, páginas SEO,
  versão mobile e funcionamento visual do VLibras.

## Privacidade e minimização

O navegador armazena preferências de interface e um UUID local aleatório.
A API usa o UUID apenas para deduplicar interações, convertendo-o em HMAC.
O IP é convertido em HMAC exclusivamente para contenção de abuso com
expiração das chaves de rate limit; a plataforma de hospedagem pode
processar dados técnicos próprios. Os conjuntos de interação não possuem
TTL: os contadores históricos são mantidos enquanto o banco estiver ativo.
Apagar os dados locais não apaga os registros agregados já criados no Redis.
Esta documentação técnica não substitui uma análise de privacidade
e política de retenção conforme a LGPD.

## Referências

- Vercel request headers: https://vercel.com/docs/headers/request-headers
- Vercel Firewall: https://vercel.com/docs/vercel-firewall
- VLibras CSP: https://www.vlibras.gov.br/doc/widget/installation/content-security-policy.html
- OWASP REST API Security: https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html
- OWASP CSP: https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html
