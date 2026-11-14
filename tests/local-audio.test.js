import test from "node:test";
import assert from "node:assert/strict";
import {validateAudioFile,MAX_AUDIO_FILES,MAX_FILE_BYTES,MAX_LIBRARY_BYTES,toPlaylistTrack} from "../src/local-audio.js";

test("somente arquivos de áudio suportados podem ser selecionados", () => {
  assert.equal(validateAudioFile({name:"Meu lo-fi.mp3",size:5000,type:"audio/mpeg"}),"Meu lo-fi");
  assert.equal(validateAudioFile({name:"  Faixa.ogg  ",size:5000,type:"audio/ogg"}),"Faixa");
  assert.throws(()=>validateAudioFile({name:"documento.exe",size:5000,type:"application/x-msdownload"}),/Aceitamos/);
  assert.throws(()=>validateAudioFile({name:"faixa.mp3",size:0,type:"audio/mpeg"}),/25 MB/);
  assert.throws(()=>validateAudioFile({name:"faixa.mp3",size:MAX_FILE_BYTES+1,type:"audio/mpeg"}),/25 MB/);
  assert.throws(()=>validateAudioFile({name:"faixa.mp3",size:5000,type:"text/plain"}),/não é identificado/);
});
test("metadados locais não incluem o conteúdo do arquivo",()=>{
  const track=toPlaylistTrack({id:"x",title:"Minha faixa",artist:"Eu",duration:42,blob:{size:5120}});
  assert.equal(track.source,"local-file");
  assert.equal(track.id,"x");
  assert.equal("blob" in track,false);
});
test("limites de armazenamento não dependem da Vercel",()=>{
  assert.equal(MAX_AUDIO_FILES,40);
  assert.equal(MAX_LIBRARY_BYTES,250*1024*1024);
});
