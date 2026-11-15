import { PODCAST_CATEGORY } from "./music.js";

const summaries = Object.freeze({
  "javascript-em-10-dias": "Em 1995, a Netscape precisava de uma linguagem que tornasse a web mais dinâmica — e precisava dela rapidamente. Este episódio acompanha a pressão enfrentada por Brendan Eich, as decisões que moldaram a primeira versão do JavaScript e as consequências de criar uma tecnologia que se tornaria parte da vida digital.",
  "margaret-hamilton-apollo-11": "A missão Apollo 11 dependia de software confiável em um cenário no qual cada segundo e cada recurso de processamento importavam. O episódio apresenta o trabalho de Margaret Hamilton, a lógica de priorização de tarefas e as escolhas de engenharia que ajudaram o computador de bordo a lidar com momentos críticos do pouso lunar.",
  "da-apollo-11-ao-caos-do-javascript": "Um episódio especial que conecta duas histórias de engenharia: sistemas críticos projetados para levar pessoas à Lua e uma linguagem criada em ritmo acelerado para a web. A conversa explora como restrições, improviso e decisões técnicas deixam marcas duradouras na tecnologia.",
  "morris-worm-1988": "Em 1988, um programa experimental se espalhou por computadores conectados e revelou como uma rede ainda jovem podia ser afetada em escala global. A história do Morris Worm ajuda a entender os primeiros desafios de segurança, confiança e responsabilidade na internet.",
  "linus-torvalds-linux-e-git": "A trajetória de Linus Torvalds reúne duas respostas a problemas práticos: um sistema operacional aberto para estudar e experimentar, e uma ferramenta de controle de versão capaz de acompanhar projetos distribuídos. O episódio mostra como colaboração, escala e autonomia transformaram o desenvolvimento de software.",
  "bug-ariane-5": "O lançamento do Ariane 5 terminou em uma falha catastrófica poucos segundos depois da decolagem. Este episódio investiga como uma conversão numérica, uma decisão de reutilização de software e a ausência de uma proteção adequada transformaram um detalhe técnico em uma grande lição de engenharia.",
  "bug-do-milenio": "Na virada para o ano 2000, empresas e governos revisaram sistemas que armazenavam anos com apenas dois dígitos. Este episódio explica por que o problema parecia ameaçador, como equipes se prepararam e o que essa mobilização ensinou sobre dependências antigas, testes e manutenção de software.",
  "dez-dolares-wannacry": "Em 2017, uma vulnerabilidade conhecida e um pagamento de apenas dez dólares ajudaram a revelar a escala global do WannaCry. O episódio acompanha a cadeia de decisões, o impacto em hospitais e empresas e as lições sobre atualizações, resposta a incidentes e segurança por padrão.",
  "ada-lovelace-primeiro-algoritmo": "Ada Lovelace percebeu que a máquina analítica poderia manipular símbolos e não apenas números. Este episódio apresenta a visão que levou ao primeiro algoritmo publicado para uma máquina e por que suas ideias continuam presentes na computação.",
  "eliza-ao-gpt-4o": "Da conversa simulada de ELIZA aos modelos multimodais contemporâneos, este episódio percorre as mudanças na relação entre pessoas e computadores. A história mostra o que evoluiu, o que permanece igual e como a linguagem virou uma interface de computação.",
  "alan-turing-enigma": "Alan Turing ajudou a transformar a quebra de códigos em um problema de computação sistemática. O episódio conecta a Enigma, as máquinas de criptoanálise e o legado de Turing para a computação moderna.",
  "leis-de-asimov": "As Leis de Asimov parecem simples, mas situações reais revelam conflitos entre ordens, segurança e autonomia. Este episódio discute por que regras bem-intencionadas falham quando não conseguem prever contexto, ambiguidades e consequências inesperadas."
});

// Episódios editoriais em produção. Os botões de reprodução só aparecem após
// o arquivo correspondente ser colocado em audio/podcasts/.
const episode = (id, title, year, description, audioName, artwork = PODCAST_CATEGORY.artwork) => Object.freeze({
  id, type: "podcast", source: "published", categoryId: PODCAST_CATEGORY.id,
  title, shortTitle: title, date: year, description, summary: summaries[id] || description, artist: "Foco.dev",
  producer: "vlimap", credits: "Produção e curadoria: vlimap",
  artwork,
  cardArtwork: artwork.startsWith("/covers/podcasts/") ? artwork.replace(/\.webp$/, "-card.webp") : artwork,
  audio: "/audio/podcasts/" + audioName,
  duration: 0, sourceLinks: Object.freeze([])
});

export const PODCAST_EPISODES = Object.freeze([
  Object.freeze({
    ...episode("javascript-em-10-dias", "Os 10 dias que criaram o JavaScript", "1995", "Como Brendan Eich desenvolveu o JavaScript na Netscape sob extrema pressão de tempo.", "javascript-em-10-dias.m4a", "/covers/podcasts/javascript-em-10-dias.webp"),
    duration: 1821.443
  }),
  Object.freeze({
    ...episode("margaret-hamilton-apollo-11", "Margaret Hamilton e a Apollo 11", "1969", "A engenharia de software e o sistema de priorização de tarefas por trás do pouso na Lua.", "margaret-hamilton-apollo-11.m4a", "/covers/podcasts/margaret-hamilton-apollo-11.webp"),
    duration: 1165.735
  }),
  Object.freeze({
    ...episode("da-apollo-11-ao-caos-do-javascript", "Da Apollo 11 ao caos do JavaScript", "Especial", "Episódio especial sobre histórias marcantes de engenharia de software e tecnologia.", "da-apollo-11-ao-caos-do-javascript.m4a", "/covers/podcasts/da-apollo-11-ao-caos-do-javascript.webp"),
    duration: 726.251
  }),
  Object.freeze({
    ...episode("morris-worm-1988", "O Morris Worm", "1988", "A história do worm que expôs a fragilidade da primeira internet em escala inédita.", "morris-worm-1988.m4a", "/covers/podcasts/morris-worm-1988.webp"),
    duration: 1091.129
  }),
  Object.freeze({
    ...episode("linus-torvalds-linux-e-git", "Linus Torvalds, Linux e Git", "1991–2005", "Como a busca por alternativas abertas transformou sistemas operacionais e controle de versão.", "linus-torvalds-linux-e-git.m4a", "/covers/podcasts/linus-torvalds-linux-e-git.webp"),
    duration: 1000.618
  }),
  Object.freeze({
    ...episode("bug-ariane-5", "O bug que destruiu o Ariane 5", "1996", "Como uma falha de software transformou um detalhe técnico em uma das histórias mais conhecidas da engenharia aeroespacial.", "bug-ariane-5.m4a", "/covers/podcasts/bug-ariane-5.webp"),
    duration: 749.099
  }),
  Object.freeze({
    ...episode("bug-do-milenio", "O Bug do Milênio", "2000", "Como equipes de tecnologia se prepararam para o problema dos dois dígitos no ano e evitaram falhas em sistemas essenciais.", "bug-do-milenio.m4a", "/covers/podcasts/bug-do-milenio.webp"),
    duration: 1382.818
  }),
  Object.freeze({
    ...episode("dez-dolares-wannacry", "Como dez dólares pararam o WannaCry", "2017", "Como uma vulnerabilidade e uma resposta de baixo custo ajudaram a conter um dos maiores ataques de ransomware da história.", "dez-dolares-wannacry.m4a", "/covers/podcasts/dez-dolares-wannacry.webp"),
    duration: 2232.250
  }),
  Object.freeze({
    ...episode("ada-lovelace-primeiro-algoritmo", "Como Ada Lovelace criou o primeiro algoritmo", "1843", "A visão de Ada Lovelace sobre a máquina analítica e o primeiro algoritmo publicado para uma máquina.", "ada-lovelace-primeiro-algoritmo.m4a", "/covers/podcasts/ada-lovelace-primeiro-algoritmo.webp"),
    duration: 1067.212
  }),
  Object.freeze({
    ...episode("eliza-ao-gpt-4o", "De ELIZA ao GPT-4o", "1966–2024", "Como a conversa entre pessoas e computadores evoluiu dos primeiros programas de linguagem aos modelos multimodais.", "eliza-ao-gpt-4o.m4a", "/covers/podcasts/eliza-ao-gpt-4o.webp"),
    duration: 831.762
  }),
  Object.freeze({
    ...episode("alan-turing-enigma", "Alan Turing: da Enigma à computação moderna", "1939–1950", "A história de Alan Turing, da criptoanálise da Enigma às ideias que ajudaram a fundar a computação moderna.", "alan-turing-enigma.m4a", "/covers/podcasts/alan-turing-enigma.webp"),
    duration: 1110.448
  }),
  Object.freeze({
    ...episode("leis-de-asimov", "Por que as Leis de Asimov falham", "1942–1985", "Por que regras simples para robôs entram em conflito quando enfrentam situações reais, ambiguidades e consequências inesperadas.", "leis-de-asimov.m4a", "/covers/podcasts/leis-de-asimov.webp"),
    duration: 1301.293
  })
]);

export const canonicalPodcastId = id => id;
export const getPodcast = id => PODCAST_EPISODES.find(item => item.id === canonicalPodcastId(id)) ?? null;
