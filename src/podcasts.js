import { PODCAST_CATEGORY } from "./music.js";

const summaries = Object.freeze({
  "javascript-em-10-dias": "Em 1995, a Netscape precisava de uma linguagem que tornasse a web mais dinâmica — e precisava dela rapidamente. Este episódio acompanha a pressão enfrentada por Brendan Eich, as decisões que moldaram a primeira versão do JavaScript e as consequências de criar uma tecnologia que se tornaria parte da vida digital.",
  "margaret-hamilton-apollo-11": "A missão Apollo 11 dependia de software confiável em um cenário no qual cada segundo e cada recurso de processamento importavam. O episódio apresenta o trabalho de Margaret Hamilton, a lógica de priorização de tarefas e as escolhas de engenharia que ajudaram o computador de bordo a lidar com momentos críticos do pouso lunar.",
  "da-apollo-11-ao-caos-do-javascript": "Um episódio especial que conecta duas histórias de engenharia: sistemas críticos projetados para levar pessoas à Lua e uma linguagem criada em ritmo acelerado para a web. A conversa explora como restrições, improviso e decisões técnicas deixam marcas duradouras na tecnologia.",
  "morris-worm-1988": "Em 1988, um programa experimental se espalhou por computadores conectados e revelou como uma rede ainda jovem podia ser afetada em escala global. A história do Morris Worm ajuda a entender os primeiros desafios de segurança, confiança e responsabilidade na internet.",
  "linus-torvalds-linux-e-git": "A trajetória de Linus Torvalds reúne duas respostas a problemas práticos: um sistema operacional aberto para estudar e experimentar, e uma ferramenta de controle de versão capaz de acompanhar projetos distribuídos. O episódio mostra como colaboração, escala e autonomia transformaram o desenvolvimento de software.",
  "knight-capital-2012": "Uma implantação incompleta e uma rotina antiga foram suficientes para desencadear uma crise financeira em poucos minutos. O caso da Knight Capital é usado para discutir deploy seguro, feature flags, observabilidade, rollback e a responsabilidade de operar software em ambientes de alto risco."
  ,"bug-ariane-5": "O lançamento do Ariane 5 terminou em uma falha catastrófica poucos segundos depois da decolagem. Este episódio investiga como uma conversão numérica, uma decisão de reutilização de software e a ausência de uma proteção adequada transformaram um detalhe técnico em uma grande lição de engenharia.",
  "bug-do-milenio": "Na virada para o ano 2000, empresas e governos revisaram sistemas que armazenavam anos com apenas dois dígitos. Este episódio explica por que o problema parecia ameaçador, como equipes se prepararam e o que essa mobilização ensinou sobre dependências antigas, testes e manutenção de software."
});

// Episódios editoriais em produção. Os botões de reprodução só aparecem após
// o arquivo correspondente ser colocado em audio/podcasts/.
const episode = (id, title, year, description, audioName, artwork = PODCAST_CATEGORY.artwork) => Object.freeze({
  id, type: "podcast", source: "published", categoryId: PODCAST_CATEGORY.id,
  title, shortTitle: title, date: year, description, summary: summaries[id] || description, artist: "Foco.dev",
  producer: "vlimap", credits: "Produção e curadoria: vlimap",
  artwork, audio: "/audio/podcasts/" + audioName,
  duration: 0, sourceLinks: Object.freeze([])
});

export const PODCAST_EPISODES = Object.freeze([
  Object.freeze({
    ...episode("javascript-em-10-dias", "Os 10 dias que criaram o JavaScript", "1995", "Como Brendan Eich desenvolveu o JavaScript na Netscape sob extrema pressão de tempo.", "javascript-em-10-dias.m4a", "/covers/podcasts/javascript-em-10-dias.png"),
    duration: 1821.443
  }),
  Object.freeze({
    ...episode("margaret-hamilton-apollo-11", "Margaret Hamilton e a Apollo 11", "1969", "A engenharia de software e o sistema de priorização de tarefas por trás do pouso na Lua.", "margaret-hamilton-apollo-11.m4a", "/covers/podcasts/margaret-hamilton-apollo-11.png"),
    duration: 1165.735
  }),
  Object.freeze({
    ...episode("da-apollo-11-ao-caos-do-javascript", "Da Apollo 11 ao caos do JavaScript", "Especial", "Episódio especial sobre histórias marcantes de engenharia de software e tecnologia.", "da-apollo-11-ao-caos-do-javascript.m4a", "/covers/podcasts/da-apollo-11-ao-caos-do-javascript.png"),
    duration: 726.251
  }),
  Object.freeze({
    ...episode("morris-worm-1988", "O Morris Worm", "1988", "A história do worm que expôs a fragilidade da primeira internet em escala inédita.", "morris-worm-1988.m4a", "/covers/podcasts/morris-worm-1988.png"),
    duration: 1091.129
  }),
  Object.freeze({
    ...episode("linus-torvalds-linux-e-git", "Linus Torvalds, Linux e Git", "1991–2005", "Como a busca por alternativas abertas transformou sistemas operacionais e controle de versão.", "linus-torvalds-linux-e-git.m4a", "/covers/podcasts/linus-torvalds-linux-e-git.png"),
    duration: 1000.618
  }),
  Object.freeze({
    ...episode("bug-ariane-5", "O bug que destruiu o Ariane 5", "1996", "Como uma falha de software transformou um detalhe técnico em uma das histórias mais conhecidas da engenharia aeroespacial.", "bug-ariane-5.m4a", "/covers/podcasts/bug-ariane-5.png"),
    duration: 749.099
  }),
  Object.freeze({
    ...episode("bug-do-milenio", "O Bug do Milênio", "2000", "Como equipes de tecnologia se prepararam para o problema dos dois dígitos no ano e evitaram falhas em sistemas essenciais.", "bug-do-milenio.m4a", "/covers/podcasts/bug-do-milenio.png"),
    duration: 1382.818
  }),
  episode("knight-capital-2012", "O bug da Knight Capital", "2012", "Como uma falha de implantação de código provocou uma perda de centenas de milhões de dólares em minutos.", "knight-capital-2012.mp3", "/covers/podcasts/knight-capital-2012.png")
]);

export const canonicalPodcastId = id => id;
export const getPodcast = id => PODCAST_EPISODES.find(item => item.id === canonicalPodcastId(id)) ?? null;
