/*
 * data.js - Base de dados do jogo.
 *
 * SQUADS: elencos historicos de clubes brasileiros. Cada elenco e sorteado
 * no draft; o jogador entao escolhe UM atleta daquele time.
 * Conjunto inicial/ilustrativo (homenagem) - facil de expandir.
 *
 * Posicoes: GK (goleiro), DEF (defensor), MID (meio-campo), FWD (ataque).
 * rating: 70-99 (forca do atleta).
 */
(function (global) {
  'use strict';

  const SQUADS = [
    {
      club: 'Santos', year: 1962, players: [
        { name: 'Gilmar', pos: 'GK', rating: 88 },
        { name: 'Mauro Ramos', pos: 'DEF', rating: 85 },
        { name: 'Calvet', pos: 'DEF', rating: 82 },
        { name: 'Zito', pos: 'MID', rating: 87 },
        { name: 'Mengalvio', pos: 'MID', rating: 84 },
        { name: 'Dorval', pos: 'MID', rating: 83 },
        { name: 'Pele', pos: 'FWD', rating: 99 },
        { name: 'Coutinho', pos: 'FWD', rating: 90 },
        { name: 'Pepe', pos: 'FWD', rating: 88 }
      ]
    },
    {
      club: 'Flamengo', year: 1981, players: [
        { name: 'Raul', pos: 'GK', rating: 84 },
        { name: 'Leandro', pos: 'DEF', rating: 90 },
        { name: 'Marinho', pos: 'DEF', rating: 84 },
        { name: 'Junior', pos: 'DEF', rating: 89 },
        { name: 'Andrade', pos: 'MID', rating: 86 },
        { name: 'Adilio', pos: 'MID', rating: 84 },
        { name: 'Tita', pos: 'MID', rating: 84 },
        { name: 'Zico', pos: 'FWD', rating: 96 },
        { name: 'Nunes', pos: 'FWD', rating: 86 }
      ]
    },
    {
      club: 'Gremio', year: 1983, players: [
        { name: 'Mazaropi', pos: 'GK', rating: 85 },
        { name: 'De Leon', pos: 'DEF', rating: 87 },
        { name: 'China', pos: 'DEF', rating: 80 },
        { name: 'Paulo Roberto', pos: 'MID', rating: 83 },
        { name: 'Tarciso', pos: 'MID', rating: 84 },
        { name: 'Renato Gaucho', pos: 'FWD', rating: 90 },
        { name: 'Caio', pos: 'FWD', rating: 82 }
      ]
    },
    {
      club: 'Sao Paulo', year: 1992, players: [
        { name: 'Zetti', pos: 'GK', rating: 86 },
        { name: 'Cafu', pos: 'DEF', rating: 90 },
        { name: 'Ronaldao', pos: 'DEF', rating: 84 },
        { name: 'Dinho', pos: 'DEF', rating: 82 },
        { name: 'Toninho Cerezo', pos: 'MID', rating: 86 },
        { name: 'Rai', pos: 'MID', rating: 92 },
        { name: 'Muller', pos: 'FWD', rating: 87 },
        { name: 'Palhinha', pos: 'FWD', rating: 84 }
      ]
    },
    {
      club: 'Palmeiras', year: 1999, players: [
        { name: 'Marcos', pos: 'GK', rating: 90 },
        { name: 'Roque Junior', pos: 'DEF', rating: 86 },
        { name: 'Junior Baiano', pos: 'DEF', rating: 84 },
        { name: 'Arce', pos: 'DEF', rating: 83 },
        { name: 'Cesar Sampaio', pos: 'MID', rating: 85 },
        { name: 'Alex', pos: 'MID', rating: 90 },
        { name: 'Zinho', pos: 'MID', rating: 84 },
        { name: 'Evair', pos: 'FWD', rating: 85 },
        { name: 'Oseas', pos: 'FWD', rating: 82 }
      ]
    },
    {
      club: 'Corinthians', year: 1998, players: [
        { name: 'Dida', pos: 'GK', rating: 87 },
        { name: 'Gamarra', pos: 'DEF', rating: 86 },
        { name: 'Kleber', pos: 'DEF', rating: 82 },
        { name: 'Vampeta', pos: 'MID', rating: 85 },
        { name: 'Rincon', pos: 'MID', rating: 86 },
        { name: 'Ricardinho', pos: 'MID', rating: 84 },
        { name: 'Marcelinho Carioca', pos: 'FWD', rating: 89 },
        { name: 'Edilson', pos: 'FWD', rating: 86 }
      ]
    },
    {
      club: 'Vasco', year: 1997, players: [
        { name: 'Carlos Germano', pos: 'GK', rating: 84 },
        { name: 'Mauro Galvao', pos: 'DEF', rating: 84 },
        { name: 'Ramon', pos: 'DEF', rating: 80 },
        { name: 'Felipe', pos: 'MID', rating: 86 },
        { name: 'Juninho Pernambucano', pos: 'MID', rating: 88 },
        { name: 'Pedrinho', pos: 'MID', rating: 83 },
        { name: 'Edmundo', pos: 'FWD', rating: 91 },
        { name: 'Donizete', pos: 'FWD', rating: 84 }
      ]
    },
    {
      club: 'Cruzeiro', year: 2003, players: [
        { name: 'Gomes', pos: 'GK', rating: 86 },
        { name: 'Maicon', pos: 'DEF', rating: 86 },
        { name: 'Cris', pos: 'DEF', rating: 85 },
        { name: 'Sorin', pos: 'DEF', rating: 85 },
        { name: 'Augusto Recife', pos: 'MID', rating: 82 },
        { name: 'Alex', pos: 'MID', rating: 90 },
        { name: 'Mota', pos: 'MID', rating: 84 },
        { name: 'Aristizabal', pos: 'FWD', rating: 86 },
        { name: 'Deivid', pos: 'FWD', rating: 84 }
      ]
    },
    {
      club: 'Santos', year: 2011, players: [
        { name: 'Rafael', pos: 'GK', rating: 82 },
        { name: 'Durval', pos: 'DEF', rating: 80 },
        { name: 'Leo', pos: 'DEF', rating: 80 },
        { name: 'Danilo', pos: 'DEF', rating: 84 },
        { name: 'Arouca', pos: 'MID', rating: 82 },
        { name: 'Elano', pos: 'MID', rating: 85 },
        { name: 'Ganso', pos: 'MID', rating: 87 },
        { name: 'Neymar', pos: 'FWD', rating: 92 },
        { name: 'Borges', pos: 'FWD', rating: 83 }
      ]
    },
    {
      club: 'Internacional', year: 2006, players: [
        { name: 'Clemer', pos: 'GK', rating: 82 },
        { name: 'Bolivar', pos: 'DEF', rating: 83 },
        { name: 'Indio', pos: 'DEF', rating: 82 },
        { name: 'Tinga', pos: 'MID', rating: 82 },
        { name: 'Iarley', pos: 'MID', rating: 83 },
        { name: 'Fernandao', pos: 'FWD', rating: 85 },
        { name: 'Rafael Sobis', pos: 'FWD', rating: 84 },
        { name: 'Alexandre Pato', pos: 'FWD', rating: 84 }
      ]
    },
    {
      club: 'Corinthians', year: 2012, players: [
        { name: 'Cassio', pos: 'GK', rating: 86 },
        { name: 'Chicao', pos: 'DEF', rating: 82 },
        { name: 'Alessandro', pos: 'DEF', rating: 81 },
        { name: 'Ralf', pos: 'MID', rating: 82 },
        { name: 'Paulinho', pos: 'MID', rating: 86 },
        { name: 'Danilo', pos: 'MID', rating: 83 },
        { name: 'Jorge Henrique', pos: 'FWD', rating: 80 },
        { name: 'Emerson Sheik', pos: 'FWD', rating: 83 },
        { name: 'Guerrero', pos: 'FWD', rating: 86 }
      ]
    },
    {
      club: 'Atletico-MG', year: 2013, players: [
        { name: 'Victor', pos: 'GK', rating: 84 },
        { name: 'Rever', pos: 'DEF', rating: 83 },
        { name: 'Leonardo Silva', pos: 'DEF', rating: 82 },
        { name: 'Pierre', pos: 'MID', rating: 80 },
        { name: 'Ronaldinho Gaucho', pos: 'MID', rating: 90 },
        { name: 'Bernard', pos: 'FWD', rating: 84 },
        { name: 'Jo', pos: 'FWD', rating: 83 },
        { name: 'Luan', pos: 'FWD', rating: 80 }
      ]
    },
    {
      club: 'Fluminense', year: 2012, players: [
        { name: 'Diego Cavalieri', pos: 'GK', rating: 83 },
        { name: 'Carlinhos', pos: 'DEF', rating: 80 },
        { name: 'Gum', pos: 'DEF', rating: 80 },
        { name: 'Jean', pos: 'MID', rating: 80 },
        { name: 'Deco', pos: 'MID', rating: 85 },
        { name: 'Thiago Neves', pos: 'MID', rating: 84 },
        { name: 'Fred', pos: 'FWD', rating: 87 },
        { name: 'Wellington Nem', pos: 'FWD', rating: 81 }
      ]
    },
    {
      club: 'Gremio', year: 2017, players: [
        { name: 'Grohe', pos: 'GK', rating: 82 },
        { name: 'Pedro Geromel', pos: 'DEF', rating: 85 },
        { name: 'Kannemann', pos: 'DEF', rating: 84 },
        { name: 'Maicon', pos: 'MID', rating: 83 },
        { name: 'Arthur', pos: 'MID', rating: 85 },
        { name: 'Ramiro', pos: 'MID', rating: 80 },
        { name: 'Luan', pos: 'FWD', rating: 86 },
        { name: 'Fernandinho', pos: 'FWD', rating: 79 }
      ]
    },
    {
      club: 'Palmeiras', year: 2022, players: [
        { name: 'Weverton', pos: 'GK', rating: 85 },
        { name: 'Gustavo Gomez', pos: 'DEF', rating: 86 },
        { name: 'Murilo', pos: 'DEF', rating: 82 },
        { name: 'Piquerez', pos: 'DEF', rating: 83 },
        { name: 'Ze Rafael', pos: 'MID', rating: 82 },
        { name: 'Raphael Veiga', pos: 'MID', rating: 85 },
        { name: 'Gabriel Menino', pos: 'MID', rating: 80 },
        { name: 'Dudu', pos: 'FWD', rating: 84 },
        { name: 'Rony', pos: 'FWD', rating: 82 }
      ]
    },
    {
      club: 'Atletico-MG', year: 2021, players: [
        { name: 'Everson', pos: 'GK', rating: 83 },
        { name: 'Junior Alonso', pos: 'DEF', rating: 82 },
        { name: 'Nathan Silva', pos: 'DEF', rating: 80 },
        { name: 'Jair', pos: 'MID', rating: 80 },
        { name: 'Nacho Fernandez', pos: 'MID', rating: 84 },
        { name: 'Zaracho', pos: 'MID', rating: 82 },
        { name: 'Hulk', pos: 'FWD', rating: 88 },
        { name: 'Keno', pos: 'FWD', rating: 83 }
      ]
    }
  ];

  // Clubes adversarios da temporada (forca geral = overall).
  const CLUBS = [
    { name: 'Flamengo', overall: 87 },
    { name: 'Palmeiras', overall: 87 },
    { name: 'Atletico-MG', overall: 84 },
    { name: 'Botafogo', overall: 83 },
    { name: 'Sao Paulo', overall: 83 },
    { name: 'Gremio', overall: 82 },
    { name: 'Internacional', overall: 82 },
    { name: 'Corinthians', overall: 82 },
    { name: 'Fluminense', overall: 82 },
    { name: 'Cruzeiro', overall: 81 },
    { name: 'Athletico-PR', overall: 81 },
    { name: 'Bragantino', overall: 80 },
    { name: 'Santos', overall: 80 },
    { name: 'Fortaleza', overall: 80 },
    { name: 'Bahia', overall: 79 },
    { name: 'Vasco', overall: 79 }
  ];

  global.LFU = global.LFU || {};
  global.LFU.data = { SQUADS, CLUBS };
})(typeof window !== 'undefined' ? window : globalThis);
