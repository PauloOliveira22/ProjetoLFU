/*
 * data.js - Base de dados do jogo.
 *
 * SQUADS: elencos historicos com plantel ampliado (~23 jogadores cada) para
 * dar muitas opcoes no draft. Os craques/titulares sao fieis; parte das
 * reservas e aproximada (homenagem) e facil de ajustar.
 *
 * CLUBS: os 20 clubes da Serie A (liga/representacao).
 *
 * Posicoes: GK (goleiro), DEF (defensor), MID (meio-campo), FWD (ataque).
 * Distribuicao por elenco: 3 GK, 7 DEF, 7 MID, 6 FWD.
 *
 * IMPORTANTE: o dataset do servidor (supabase/functions/_shared/dataset.ts) e
 * GERADO a partir deste arquivo por tools/gen-dataset.js. Apos editar aqui,
 * rode: npm run gen:dataset
 */
(function (global) {
  'use strict';

  const SQUADS = [
    { club: 'Santos', year: 1962, players: [
      { name: 'Gilmar', pos: 'GK', rating: 88 }, { name: 'Laercio', pos: 'GK', rating: 75 }, { name: 'Cejas', pos: 'GK', rating: 74 },
      { name: 'Mauro Ramos', pos: 'DEF', rating: 85 }, { name: 'Olavo', pos: 'DEF', rating: 80 }, { name: 'Calvet', pos: 'DEF', rating: 82 },
      { name: 'Dalmo', pos: 'DEF', rating: 80 }, { name: 'Getulio', pos: 'DEF', rating: 78 }, { name: 'Geraldino', pos: 'DEF', rating: 76 }, { name: 'Haroldo', pos: 'DEF', rating: 74 },
      { name: 'Zito', pos: 'MID', rating: 87 }, { name: 'Mengalvio', pos: 'MID', rating: 84 }, { name: 'Lima', pos: 'MID', rating: 81 },
      { name: 'Dorval', pos: 'MID', rating: 83 }, { name: 'Modesto', pos: 'MID', rating: 77 }, { name: 'Negreiros', pos: 'MID', rating: 75 }, { name: 'Mariano', pos: 'MID', rating: 74 },
      { name: 'Pele', pos: 'FWD', rating: 99 }, { name: 'Coutinho', pos: 'FWD', rating: 90 }, { name: 'Pepe', pos: 'FWD', rating: 88 },
      { name: 'Pagao', pos: 'FWD', rating: 82 }, { name: 'Toninho Guerreiro', pos: 'FWD', rating: 81 }, { name: 'Abel', pos: 'FWD', rating: 76 }
    ] },
    { club: 'Flamengo', year: 1981, players: [
      { name: 'Raul', pos: 'GK', rating: 84 }, { name: 'Cantarele', pos: 'GK', rating: 76 }, { name: 'Ze Carlos', pos: 'GK', rating: 73 },
      { name: 'Leandro', pos: 'DEF', rating: 90 }, { name: 'Junior', pos: 'DEF', rating: 89 }, { name: 'Marinho', pos: 'DEF', rating: 84 },
      { name: 'Mozer', pos: 'DEF', rating: 82 }, { name: 'Rondinelli', pos: 'DEF', rating: 80 }, { name: 'Figueiredo', pos: 'DEF', rating: 77 }, { name: 'Geraldo', pos: 'DEF', rating: 74 },
      { name: 'Andrade', pos: 'MID', rating: 86 }, { name: 'Adilio', pos: 'MID', rating: 84 }, { name: 'Tita', pos: 'MID', rating: 84 },
      { name: 'Ze Sergio', pos: 'MID', rating: 80 }, { name: 'Carpegiani', pos: 'MID', rating: 79 }, { name: 'Lico', pos: 'MID', rating: 76 }, { name: 'Vitor', pos: 'MID', rating: 74 },
      { name: 'Zico', pos: 'FWD', rating: 96 }, { name: 'Nunes', pos: 'FWD', rating: 86 }, { name: 'Anselmo', pos: 'FWD', rating: 78 },
      { name: 'Claudio Adao', pos: 'FWD', rating: 77 }, { name: 'Baroninho', pos: 'FWD', rating: 75 }, { name: 'Reinaldo', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Gremio', year: 1983, players: [
      { name: 'Mazaropi', pos: 'GK', rating: 85 }, { name: 'Puchkas', pos: 'GK', rating: 75 }, { name: 'Polozzi', pos: 'GK', rating: 73 },
      { name: 'De Leon', pos: 'DEF', rating: 87 }, { name: 'Mauro Galvao', pos: 'DEF', rating: 80 }, { name: 'China', pos: 'DEF', rating: 80 },
      { name: 'Baidek', pos: 'DEF', rating: 79 }, { name: 'Paulo Cesar', pos: 'DEF', rating: 78 }, { name: 'Hugo', pos: 'DEF', rating: 76 }, { name: 'Edson', pos: 'DEF', rating: 74 },
      { name: 'Tarciso', pos: 'MID', rating: 84 }, { name: 'Paulo Roberto', pos: 'MID', rating: 83 }, { name: 'Valdo', pos: 'MID', rating: 80 },
      { name: 'Tite', pos: 'MID', rating: 79 }, { name: 'Osvaldo', pos: 'MID', rating: 78 }, { name: 'Bonamigo', pos: 'MID', rating: 76 }, { name: 'Tonho', pos: 'MID', rating: 74 },
      { name: 'Renato Gaucho', pos: 'FWD', rating: 90 }, { name: 'Caio', pos: 'FWD', rating: 82 }, { name: 'Mario Sergio', pos: 'FWD', rating: 80 },
      { name: 'Cesar', pos: 'FWD', rating: 78 }, { name: 'Andre Catimba', pos: 'FWD', rating: 76 }, { name: 'Tota', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Sao Paulo', year: 1992, players: [
      { name: 'Zetti', pos: 'GK', rating: 86 }, { name: 'Gilmar', pos: 'GK', rating: 76 }, { name: 'Sergio', pos: 'GK', rating: 73 },
      { name: 'Cafu', pos: 'DEF', rating: 90 }, { name: 'Ronaldao', pos: 'DEF', rating: 84 }, { name: 'Dinho', pos: 'DEF', rating: 82 },
      { name: 'Antonio Carlos', pos: 'DEF', rating: 80 }, { name: 'Valber', pos: 'DEF', rating: 78 }, { name: 'Adilson', pos: 'DEF', rating: 76 }, { name: 'Vitor', pos: 'DEF', rating: 74 },
      { name: 'Rai', pos: 'MID', rating: 92 }, { name: 'Toninho Cerezo', pos: 'MID', rating: 86 }, { name: 'Pintado', pos: 'MID', rating: 80 },
      { name: 'Doriva', pos: 'MID', rating: 78 }, { name: 'Ivair', pos: 'MID', rating: 77 }, { name: 'Dye', pos: 'MID', rating: 76 }, { name: 'Axel', pos: 'MID', rating: 74 },
      { name: 'Muller', pos: 'FWD', rating: 87 }, { name: 'Palhinha', pos: 'FWD', rating: 84 }, { name: 'Elivelton', pos: 'FWD', rating: 80 },
      { name: 'Gerson', pos: 'FWD', rating: 77 }, { name: 'Caturam', pos: 'FWD', rating: 75 }, { name: 'Pavao', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Palmeiras', year: 1999, players: [
      { name: 'Marcos', pos: 'GK', rating: 90 }, { name: 'Sergio', pos: 'GK', rating: 76 }, { name: 'Velloso', pos: 'GK', rating: 75 },
      { name: 'Roque Junior', pos: 'DEF', rating: 86 }, { name: 'Junior Baiano', pos: 'DEF', rating: 84 }, { name: 'Arce', pos: 'DEF', rating: 83 },
      { name: 'Cleber', pos: 'DEF', rating: 80 }, { name: 'Joao Carlos', pos: 'DEF', rating: 78 }, { name: 'Daniel', pos: 'DEF', rating: 76 }, { name: 'Anderson', pos: 'DEF', rating: 74 },
      { name: 'Alex', pos: 'MID', rating: 90 }, { name: 'Cesar Sampaio', pos: 'MID', rating: 85 }, { name: 'Zinho', pos: 'MID', rating: 84 },
      { name: 'Rogerio', pos: 'MID', rating: 80 }, { name: 'Galeano', pos: 'MID', rating: 78 }, { name: 'Pedrinho', pos: 'MID', rating: 76 }, { name: 'Claudecir', pos: 'MID', rating: 74 },
      { name: 'Evair', pos: 'FWD', rating: 85 }, { name: 'Oseas', pos: 'FWD', rating: 82 }, { name: 'Paulo Nunes', pos: 'FWD', rating: 81 },
      { name: 'Euller', pos: 'FWD', rating: 80 }, { name: 'Alex Alves', pos: 'FWD', rating: 77 }, { name: 'Tuta', pos: 'FWD', rating: 76 }
    ] },
    { club: 'Corinthians', year: 1998, players: [
      { name: 'Dida', pos: 'GK', rating: 87 }, { name: 'Ronaldo', pos: 'GK', rating: 75 }, { name: 'Doni', pos: 'GK', rating: 74 },
      { name: 'Gamarra', pos: 'DEF', rating: 86 }, { name: 'Kleber', pos: 'DEF', rating: 82 }, { name: 'Fabio Luciano', pos: 'DEF', rating: 79 },
      { name: 'Joao Carlos', pos: 'DEF', rating: 80 }, { name: 'Indio', pos: 'DEF', rating: 78 }, { name: 'Adilson', pos: 'DEF', rating: 77 }, { name: 'Silvio', pos: 'DEF', rating: 74 },
      { name: 'Vampeta', pos: 'MID', rating: 85 }, { name: 'Rincon', pos: 'MID', rating: 86 }, { name: 'Ricardinho', pos: 'MID', rating: 84 },
      { name: 'Marcelinho Carioca', pos: 'MID', rating: 89 }, { name: 'Doriva', pos: 'MID', rating: 80 }, { name: 'Fernando', pos: 'MID', rating: 76 }, { name: 'Cris', pos: 'MID', rating: 74 },
      { name: 'Edilson', pos: 'FWD', rating: 86 }, { name: 'Luizao', pos: 'FWD', rating: 84 }, { name: 'Dinei', pos: 'FWD', rating: 78 },
      { name: 'Marques', pos: 'FWD', rating: 77 }, { name: 'Gilmar', pos: 'FWD', rating: 75 }, { name: 'Edu', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Vasco', year: 1997, players: [
      { name: 'Carlos Germano', pos: 'GK', rating: 84 }, { name: 'Helton', pos: 'GK', rating: 75 }, { name: 'Gilmar', pos: 'GK', rating: 73 },
      { name: 'Mauro Galvao', pos: 'DEF', rating: 84 }, { name: 'Ramon', pos: 'DEF', rating: 80 }, { name: 'Odvan', pos: 'DEF', rating: 78 },
      { name: 'Wagner', pos: 'DEF', rating: 78 }, { name: 'Galego', pos: 'DEF', rating: 76 }, { name: 'Alex Oliveira', pos: 'DEF', rating: 75 }, { name: 'Luizinho', pos: 'DEF', rating: 74 },
      { name: 'Juninho Pernambucano', pos: 'MID', rating: 88 }, { name: 'Felipe', pos: 'MID', rating: 86 }, { name: 'Pedrinho', pos: 'MID', rating: 83 },
      { name: 'Amaral', pos: 'MID', rating: 80 }, { name: 'Nasa', pos: 'MID', rating: 78 }, { name: 'Luisinho', pos: 'MID', rating: 77 }, { name: 'Marcelo', pos: 'MID', rating: 75 },
      { name: 'Edmundo', pos: 'FWD', rating: 91 }, { name: 'Luizao', pos: 'FWD', rating: 82 }, { name: 'Donizete', pos: 'FWD', rating: 84 },
      { name: 'Valdir', pos: 'FWD', rating: 80 }, { name: 'Vivinho', pos: 'FWD', rating: 76 }, { name: 'Carlos Alberto', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Cruzeiro', year: 2003, players: [
      { name: 'Gomes', pos: 'GK', rating: 86 }, { name: 'Artur', pos: 'GK', rating: 75 }, { name: 'Aristoteles', pos: 'GK', rating: 73 },
      { name: 'Maicon', pos: 'DEF', rating: 86 }, { name: 'Cris', pos: 'DEF', rating: 85 }, { name: 'Sorin', pos: 'DEF', rating: 85 },
      { name: 'Edu Dracena', pos: 'DEF', rating: 80 }, { name: 'Cleiton', pos: 'DEF', rating: 76 }, { name: 'Rodrigo', pos: 'DEF', rating: 75 }, { name: 'William', pos: 'DEF', rating: 74 },
      { name: 'Alex', pos: 'MID', rating: 90 }, { name: 'Mota', pos: 'MID', rating: 84 }, { name: 'Augusto Recife', pos: 'MID', rating: 82 },
      { name: 'Ricardinho', pos: 'MID', rating: 80 }, { name: 'Jussie', pos: 'MID', rating: 78 }, { name: 'Felipe Melo', pos: 'MID', rating: 77 }, { name: 'Leandro Guerreiro', pos: 'MID', rating: 76 },
      { name: 'Aristizabal', pos: 'FWD', rating: 86 }, { name: 'Deivid', pos: 'FWD', rating: 84 }, { name: 'Guilherme', pos: 'FWD', rating: 80 },
      { name: 'Reinaldo', pos: 'FWD', rating: 76 }, { name: 'Wendell', pos: 'FWD', rating: 75 }, { name: 'Joao Paulo', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Santos', year: 2011, players: [
      { name: 'Rafael', pos: 'GK', rating: 82 }, { name: 'Aranha', pos: 'GK', rating: 80 }, { name: 'Vladimir', pos: 'GK', rating: 74 },
      { name: 'Danilo', pos: 'DEF', rating: 84 }, { name: 'Edu Dracena', pos: 'DEF', rating: 81 }, { name: 'Durval', pos: 'DEF', rating: 80 },
      { name: 'Leo', pos: 'DEF', rating: 80 }, { name: 'Bruno Rodrigo', pos: 'DEF', rating: 76 }, { name: 'Juan', pos: 'DEF', rating: 75 }, { name: 'Bruno Aguiar', pos: 'DEF', rating: 74 },
      { name: 'Ganso', pos: 'MID', rating: 87 }, { name: 'Elano', pos: 'MID', rating: 85 }, { name: 'Arouca', pos: 'MID', rating: 82 },
      { name: 'Henrique', pos: 'MID', rating: 78 }, { name: 'Adriano', pos: 'MID', rating: 77 }, { name: 'Ibson', pos: 'MID', rating: 78 }, { name: 'Roberto Brum', pos: 'MID', rating: 75 },
      { name: 'Neymar', pos: 'FWD', rating: 92 }, { name: 'Borges', pos: 'FWD', rating: 83 }, { name: 'Andre', pos: 'FWD', rating: 80 },
      { name: 'Alan Kardec', pos: 'FWD', rating: 78 }, { name: 'Ze Eduardo', pos: 'FWD', rating: 77 }, { name: 'Keirrison', pos: 'FWD', rating: 76 }
    ] },
    { club: 'Internacional', year: 2006, players: [
      { name: 'Clemer', pos: 'GK', rating: 82 }, { name: 'Renan', pos: 'GK', rating: 76 }, { name: 'Lauro', pos: 'GK', rating: 74 },
      { name: 'Bolivar', pos: 'DEF', rating: 83 }, { name: 'Indio', pos: 'DEF', rating: 82 }, { name: 'Ceara', pos: 'DEF', rating: 79 },
      { name: 'Wellington Monteiro', pos: 'DEF', rating: 78 }, { name: 'Fabiano Eller', pos: 'DEF', rating: 77 }, { name: 'Wagner', pos: 'DEF', rating: 75 }, { name: 'Danny Morais', pos: 'DEF', rating: 74 },
      { name: 'Tinga', pos: 'MID', rating: 82 }, { name: 'Iarley', pos: 'MID', rating: 83 }, { name: 'Jorge Wagner', pos: 'MID', rating: 80 },
      { name: 'Edinho', pos: 'MID', rating: 79 }, { name: 'Wellington', pos: 'MID', rating: 78 }, { name: 'Perdigao', pos: 'MID', rating: 76 }, { name: 'Marcao', pos: 'MID', rating: 75 },
      { name: 'Fernandao', pos: 'FWD', rating: 85 }, { name: 'Rafael Sobis', pos: 'FWD', rating: 84 }, { name: 'Alexandre Pato', pos: 'FWD', rating: 84 },
      { name: 'Luizao', pos: 'FWD', rating: 80 }, { name: 'Adriano Gabiru', pos: 'FWD', rating: 79 }, { name: 'Michel', pos: 'FWD', rating: 75 }
    ] },
    { club: 'Corinthians', year: 2012, players: [
      { name: 'Cassio', pos: 'GK', rating: 86 }, { name: 'Julio Cesar', pos: 'GK', rating: 76 }, { name: 'Danilo Fernandes', pos: 'GK', rating: 74 },
      { name: 'Chicao', pos: 'DEF', rating: 82 }, { name: 'Leandro Castan', pos: 'DEF', rating: 82 }, { name: 'Paulo Andre', pos: 'DEF', rating: 81 },
      { name: 'Alessandro', pos: 'DEF', rating: 81 }, { name: 'Fabio Santos', pos: 'DEF', rating: 81 }, { name: 'Wallace', pos: 'DEF', rating: 76 }, { name: 'Fabio Ferreira', pos: 'DEF', rating: 74 },
      { name: 'Paulinho', pos: 'MID', rating: 86 }, { name: 'Ralf', pos: 'MID', rating: 82 }, { name: 'Danilo', pos: 'MID', rating: 83 },
      { name: 'Alex', pos: 'MID', rating: 82 }, { name: 'Jorge Henrique', pos: 'MID', rating: 80 }, { name: 'Willian', pos: 'MID', rating: 78 }, { name: 'Edenilson', pos: 'MID', rating: 77 },
      { name: 'Guerrero', pos: 'FWD', rating: 86 }, { name: 'Emerson Sheik', pos: 'FWD', rating: 83 }, { name: 'Liedson', pos: 'FWD', rating: 81 },
      { name: 'Romarinho', pos: 'FWD', rating: 78 }, { name: 'Wallyson', pos: 'FWD', rating: 75 }, { name: 'Giovanni', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Atletico-MG', year: 2013, players: [
      { name: 'Victor', pos: 'GK', rating: 84 }, { name: 'Giovanni', pos: 'GK', rating: 75 }, { name: 'Helton', pos: 'GK', rating: 73 },
      { name: 'Rever', pos: 'DEF', rating: 83 }, { name: 'Leonardo Silva', pos: 'DEF', rating: 82 }, { name: 'Marcos Rocha', pos: 'DEF', rating: 80 },
      { name: 'Junior Cesar', pos: 'DEF', rating: 78 }, { name: 'Pierre', pos: 'DEF', rating: 79 }, { name: 'Gabriel', pos: 'DEF', rating: 76 }, { name: 'Michel', pos: 'DEF', rating: 74 },
      { name: 'Ronaldinho Gaucho', pos: 'MID', rating: 90 }, { name: 'Bernard', pos: 'MID', rating: 84 }, { name: 'Josue', pos: 'MID', rating: 80 },
      { name: 'Leandro Donizete', pos: 'MID', rating: 79 }, { name: 'Datolo', pos: 'MID', rating: 80 }, { name: 'Serginho', pos: 'MID', rating: 77 }, { name: 'Fernandinho', pos: 'MID', rating: 76 },
      { name: 'Jo', pos: 'FWD', rating: 83 }, { name: 'Diego Tardelli', pos: 'FWD', rating: 83 }, { name: 'Luan', pos: 'FWD', rating: 80 },
      { name: 'Alecsandro', pos: 'FWD', rating: 79 }, { name: 'Guilherme', pos: 'FWD', rating: 78 }, { name: 'Rosinei', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Fluminense', year: 2012, players: [
      { name: 'Diego Cavalieri', pos: 'GK', rating: 83 }, { name: 'Ricardo Berna', pos: 'GK', rating: 74 }, { name: 'Elias', pos: 'GK', rating: 73 },
      { name: 'Gum', pos: 'DEF', rating: 80 }, { name: 'Leandro Euzebio', pos: 'DEF', rating: 78 }, { name: 'Carlinhos', pos: 'DEF', rating: 80 },
      { name: 'Mariano', pos: 'DEF', rating: 80 }, { name: 'Bruno', pos: 'DEF', rating: 78 }, { name: 'Digao', pos: 'DEF', rating: 76 }, { name: 'Anderson', pos: 'DEF', rating: 74 },
      { name: 'Deco', pos: 'MID', rating: 85 }, { name: 'Thiago Neves', pos: 'MID', rating: 84 }, { name: 'Jean', pos: 'MID', rating: 80 },
      { name: 'Wagner', pos: 'MID', rating: 78 }, { name: 'Diguinho', pos: 'MID', rating: 77 }, { name: 'Valencia', pos: 'MID', rating: 78 }, { name: 'Marquinho', pos: 'MID', rating: 76 },
      { name: 'Fred', pos: 'FWD', rating: 87 }, { name: 'Wellington Nem', pos: 'FWD', rating: 81 }, { name: 'Rafael Moura', pos: 'FWD', rating: 80 },
      { name: 'Samuel', pos: 'FWD', rating: 76 }, { name: 'Emerson', pos: 'FWD', rating: 75 }, { name: 'Cleber', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Gremio', year: 2017, players: [
      { name: 'Marcelo Grohe', pos: 'GK', rating: 82 }, { name: 'Bruno Grassi', pos: 'GK', rating: 74 }, { name: 'Leo', pos: 'GK', rating: 73 },
      { name: 'Pedro Geromel', pos: 'DEF', rating: 85 }, { name: 'Kannemann', pos: 'DEF', rating: 84 }, { name: 'Marcelo Oliveira', pos: 'DEF', rating: 79 },
      { name: 'Edilson', pos: 'DEF', rating: 79 }, { name: 'Bressan', pos: 'DEF', rating: 78 }, { name: 'Leonardo', pos: 'DEF', rating: 78 }, { name: 'Rafael Thyere', pos: 'DEF', rating: 74 },
      { name: 'Arthur', pos: 'MID', rating: 85 }, { name: 'Maicon', pos: 'MID', rating: 83 }, { name: 'Ramiro', pos: 'MID', rating: 80 },
      { name: 'Cicero', pos: 'MID', rating: 79 }, { name: 'Jailson', pos: 'MID', rating: 79 }, { name: 'Michel', pos: 'MID', rating: 76 }, { name: 'Kaio', pos: 'MID', rating: 74 },
      { name: 'Luan', pos: 'FWD', rating: 86 }, { name: 'Everton Cebolinha', pos: 'FWD', rating: 82 }, { name: 'Lucas Barrios', pos: 'FWD', rating: 80 },
      { name: 'Fernandinho', pos: 'FWD', rating: 78 }, { name: 'Jael', pos: 'FWD', rating: 76 }, { name: 'Beto da Silva', pos: 'FWD', rating: 74 }
    ] },
    { club: 'Palmeiras', year: 2022, players: [
      { name: 'Weverton', pos: 'GK', rating: 85 }, { name: 'Marcelo Lomba', pos: 'GK', rating: 76 }, { name: 'Vinicius', pos: 'GK', rating: 73 },
      { name: 'Gustavo Gomez', pos: 'DEF', rating: 86 }, { name: 'Murilo', pos: 'DEF', rating: 82 }, { name: 'Piquerez', pos: 'DEF', rating: 83 },
      { name: 'Marcos Rocha', pos: 'DEF', rating: 80 }, { name: 'Mayke', pos: 'DEF', rating: 79 }, { name: 'Luan', pos: 'DEF', rating: 80 }, { name: 'Kuscevic', pos: 'DEF', rating: 75 },
      { name: 'Raphael Veiga', pos: 'MID', rating: 85 }, { name: 'Ze Rafael', pos: 'MID', rating: 82 }, { name: 'Gustavo Scarpa', pos: 'MID', rating: 84 },
      { name: 'Danilo', pos: 'MID', rating: 82 }, { name: 'Gabriel Menino', pos: 'MID', rating: 80 }, { name: 'Bruno Tabata', pos: 'MID', rating: 78 }, { name: 'Jailson', pos: 'MID', rating: 76 },
      { name: 'Dudu', pos: 'FWD', rating: 84 }, { name: 'Rony', pos: 'FWD', rating: 82 }, { name: 'Endrick', pos: 'FWD', rating: 80 },
      { name: 'Rafael Navarro', pos: 'FWD', rating: 78 }, { name: 'Wesley', pos: 'FWD', rating: 77 }, { name: 'Breno Lopes', pos: 'FWD', rating: 76 }
    ] },
    { club: 'Atletico-MG', year: 2021, players: [
      { name: 'Everson', pos: 'GK', rating: 83 }, { name: 'Rafael', pos: 'GK', rating: 75 }, { name: 'Matheus Mendes', pos: 'GK', rating: 73 },
      { name: 'Junior Alonso', pos: 'DEF', rating: 82 }, { name: 'Nathan Silva', pos: 'DEF', rating: 80 }, { name: 'Guilherme Arana', pos: 'DEF', rating: 83 },
      { name: 'Mariano', pos: 'DEF', rating: 79 }, { name: 'Rever', pos: 'DEF', rating: 80 }, { name: 'Dodo', pos: 'DEF', rating: 78 }, { name: 'Bueno', pos: 'DEF', rating: 74 },
      { name: 'Nacho Fernandez', pos: 'MID', rating: 84 }, { name: 'Zaracho', pos: 'MID', rating: 82 }, { name: 'Allan', pos: 'MID', rating: 80 },
      { name: 'Jair', pos: 'MID', rating: 80 }, { name: 'Tche Tche', pos: 'MID', rating: 77 }, { name: 'Guga', pos: 'MID', rating: 76 }, { name: 'Calebe', pos: 'MID', rating: 75 },
      { name: 'Hulk', pos: 'FWD', rating: 88 }, { name: 'Keno', pos: 'FWD', rating: 83 }, { name: 'Diego Costa', pos: 'FWD', rating: 80 },
      { name: 'Savarino', pos: 'FWD', rating: 80 }, { name: 'Vargas', pos: 'FWD', rating: 79 }, { name: 'Marrony', pos: 'FWD', rating: 74 }
    ] }
  ];

  // Os 20 clubes da Serie A (liga e representacao).
  const CLUBS = [
    { name: 'Flamengo', overall: 87 }, { name: 'Palmeiras', overall: 86 },
    { name: 'Botafogo', overall: 84 }, { name: 'Cruzeiro', overall: 82 },
    { name: 'Sao Paulo', overall: 83 }, { name: 'Atletico-MG', overall: 83 },
    { name: 'Fluminense', overall: 82 }, { name: 'Internacional', overall: 82 },
    { name: 'Gremio', overall: 81 }, { name: 'Corinthians', overall: 81 },
    { name: 'Bahia', overall: 80 }, { name: 'RB Bragantino', overall: 80 },
    { name: 'Fortaleza', overall: 80 }, { name: 'Vasco', overall: 79 },
    { name: 'Santos', overall: 79 }, { name: 'Vitoria', overall: 76 },
    { name: 'Juventude', overall: 75 }, { name: 'Mirassol', overall: 75 },
    { name: 'Ceara', overall: 75 }, { name: 'Sport', overall: 74 }
  ];

  global.LFU = global.LFU || {};
  global.LFU.data = { SQUADS, CLUBS };
})(typeof window !== 'undefined' ? window : globalThis);
