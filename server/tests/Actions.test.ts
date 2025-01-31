import { Card, StringToCard, PlayerStatus, RoundPhase, MatchPhase, Placement, GameState, GameSettings } from '../../common';
import * as Actions from '../src/Actions';

test('InitializeGameState', () =>
{
  const gameState = new GameState();
  Actions.InitializeGameState(gameState);
  expect(gameState.matchPhase).toBe(MatchPhase.Ongoing);
});

test('DealCards', () =>
{
  const gameState = new GameState();

  let result = Actions.DealCards(gameState, 3);

  expect(result).toBe(false);

  Actions.InitializeGameState(gameState);
  gameState.dealer = 0;
  result = Actions.DealCards(gameState, 3);

  expect(result).toBe(false);
  for (let i = 0; i < 6; i++)
    expect(gameState.players[i].hand.length).toBe(0);

  gameState.dealer = 3;
  result = Actions.DealCards(gameState, 3);

  expect(result).toBe(true);
  for (let i = 0; i < 6; i++)
    expect(gameState.players[i].hand.length).toBe(9);
});

test('GetGameRunningStatus', () =>
{
  const gameState = new GameState();
  expect(Actions.GetGameRunningStatus(gameState)).toBe(false);

  Actions.InitializeGameState(gameState);
  expect(Actions.GetGameRunningStatus(gameState)).toBe(true);
});

test('GetGameState', () =>
{
  const gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.dealer = 3;
  Actions.DealCards(gameState, 3);

  const gameSettings = new GameSettings();
  gameSettings.openCards = true;

  let result = Actions.GetGameState(gameState, gameSettings, 4);
  expect(result.players[0].id).toBe(4);

  for (let i = 0; i < 6; i++)
    expect(result.players[i].hand[0].IsFaceUp()).toBe(true);

  gameSettings.openCards = false;

  result = Actions.GetGameState(gameState, gameSettings, 3);
  expect(result.players[0].id).toBe(3);

  for (let i = 0; i < 6; i++)
    expect(result.players[i].hand[0].IsFaceUp()).toBe(result.players[i].id === 3);
});

test('PlayCards', () =>
{
  let gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.dealer = 3;
  Actions.DealCards(gameState, 3);

  let result = Actions.PlayCards(gameState, 4, []);

  expect(result).toBe(false);

  gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.turn = 2;
  gameState.players[4].hand = [StringToCard('h4')];

  result = Actions.PlayCards(gameState, 4, [StringToCard('h4')]);

  expect(result).toBe(false);

  gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.turn = 4;
  gameState.players[4].hand = [StringToCard('h4')];

  result = Actions.PlayCards(gameState, 4, [StringToCard('h4')]);

  expect(result).toBe(true);

  gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.turn = 4;
  gameState.players[4].hand = [StringToCard('h4')];

  result = Actions.PlayCards(gameState, 4, [StringToCard('h5')]);

  expect(result).toBe(false);

  gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.turn = 4;
  gameState.players[0].hand = [StringToCard('h4')];
  gameState.players[0].status = PlayerStatus.Played;
  gameState.players[1].hand = [StringToCard('h5')];
  gameState.players[1].status = PlayerStatus.Played;
  gameState.players[2].hand = [StringToCard('h6')];
  gameState.players[2].status = PlayerStatus.Played;
  gameState.players[3].hand = [StringToCard('h7')];
  gameState.players[3].status = PlayerStatus.Played;
  gameState.players[4].hand = [StringToCard('h8'), StringToCard('d8')];
  gameState.players[4].status = PlayerStatus.Empty;
  gameState.players[5].hand = [StringToCard('h9')];
  gameState.players[5].status = PlayerStatus.Played;

  result = Actions.PlayCards(gameState, 4, [StringToCard('h8')]);

  expect(result).toBe(true);
  expect(gameState.turn).toBe(5);
  expect(gameState.players[4].status).toBe(PlayerStatus.Played);
  expect(gameState.players[4].hand.length).toBe(1);

  gameState.playedCards.length = 0;

  gameState.turn = 4;
  result = Actions.PlayCards(gameState, 4, [StringToCard('d8')]);

  expect(result).toBe(true);
  expect(gameState.turn).toBe(5);
  expect(gameState.players[4].status).toBe(PlayerStatus.PlayedAndDone);
  expect(gameState.players[4].hand.length).toBe(0);
});

test('PassTurn', () =>
{
  let gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.turn = 4;

  let result = Actions.PassTurn(gameState, 4);

  expect(result).toBe(false);

  for (let i = 0; i < 6; i++)
    expect(gameState.players[i].status).not.toBe(PlayerStatus.Passed);

  gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.turn = 2;
  gameState.players[2].hand = [StringToCard('c5')];
  Actions.PlayCards(gameState, 2, [StringToCard('c5')]);

  expect(gameState.turn).toBe(3);

  result = Actions.PassTurn(gameState, 4);

  expect(result).toBe(false);

  result = Actions.PassTurn(gameState, 3);

  expect(result).toBe(true);
  expect(gameState.players[3].status).toBe(PlayerStatus.Passed);

  gameState = new GameState();
  Actions.InitializeGameState(gameState);

  gameState.turn = 0;
  gameState.players[0].hand = [StringToCard('c5')];
  Actions.PlayCards(gameState, 0, [StringToCard('c5')]);

  result = Actions.PassTurn(gameState, 1);
  expect(result).toBe(true);

  result = Actions.PassTurn(gameState, 2);
  expect(result).toBe(true);

  result = Actions.PassTurn(gameState, 3);
  expect(result).toBe(true);

  result = Actions.PassTurn(gameState, 4);
  expect(result).toBe(true);

  result = Actions.PassTurn(gameState, 5);
  expect(result).toBe(true);

  expect(gameState.turn).toBe(1);
});

test('GiveHandoverCard', () =>
{
  const joker1Card = StringToCard('j1');
  const joker2Card = StringToCard('j2');

  const gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.dealer = 3;
  Actions.DealCards(gameState, 3);

  gameState.players[4].hand = [joker1Card];
  gameState.players[5].hand = [joker2Card];

  const dummy: Placement = { };
  dummy[0] = 0;
  dummy[1] = 1;
  dummy[2] = 2;
  dummy[3] = 3;
  dummy[4] = 4;
  dummy[5] = 5;

  gameState.placements.push(dummy);

  // wrong round phase
  expect(gameState.roundPhase).toBe(RoundPhase.Normal);
  let result = Actions.GiveHandoverCard(gameState, 4, joker1Card);
  expect(result).toBe(false);

  gameState.roundPhase = RoundPhase.HandoverPhase1Give;

  // card not in hand
  gameState.players[4].hand = [];
  result = Actions.GiveHandoverCard(gameState, 4, joker1Card);
  expect(result).toBe(false);

  // no placements
  gameState.players[4].hand = [joker1Card];
  gameState.placements.length = 0;
  result = Actions.GiveHandoverCard(gameState, 4, joker1Card);
  expect(result).toBe(false);

  // success
  gameState.placements.push(dummy);
  result = Actions.GiveHandoverCard(gameState, 4, joker1Card);
  expect(result).toBe(true);
  result = Actions.GiveHandoverCard(gameState, 5, joker2Card);
  expect(result).toBe(true);
  expect(gameState.roundPhase).toBe(RoundPhase.HandoverPhase1Receive);
  expect(gameState.players[4].hand.length).toBe(0);
  expect(gameState.players[5].hand.length).toBe(0);
  expect(gameState.handoverCard1.IsSpecified()).toBe(true);
  expect(gameState.handoverCard2.IsSpecified()).toBe(true);

  // not giving best card
  gameState.roundPhase = RoundPhase.HandoverPhase1Give;
  gameState.players[4].hand = [joker1Card, joker2Card];
  gameState.handoverCard1 = new Card();
  gameState.handoverCard2 = new Card();
  result = Actions.GiveHandoverCard(gameState, 4, joker2Card);
  expect(result).toBe(false);
  result = Actions.GiveHandoverCard(gameState, 4, joker1Card);
  expect(result).toBe(true);
});

test('ReceiveHandoverCard', () =>
{
  const joker1Card = StringToCard('j1');
  const joker2Card = StringToCard('j2');

  const gameState = new GameState();
  Actions.InitializeGameState(gameState);
  gameState.dealer = 3;
  Actions.DealCards(gameState, 3);

  const dummy: Placement = { };
  dummy[0] = 0;
  dummy[1] = 1;
  dummy[2] = 2;
  dummy[3] = 3;
  dummy[4] = 4;
  dummy[5] = 5;

  gameState.placements.push(dummy);

  gameState.handoverCard1 = joker1Card;
  gameState.handoverCard2 = joker2Card;

  // wrong round phase
  expect(gameState.roundPhase).toBe(RoundPhase.Normal);
  let result = Actions.ReceiveHandoverCard(gameState, 0, true);
  expect(result).toBe(false);

  gameState.roundPhase = RoundPhase.HandoverPhase1Receive;

  // handover card not available
  gameState.handoverCard1 = new Card();
  result = Actions.ReceiveHandoverCard(gameState, 0, true);
  expect(result).toBe(false);

  // no placements
  gameState.handoverCard1 = joker1Card;
  gameState.placements.length = 0;
  result = Actions.ReceiveHandoverCard(gameState, 0, true);
  expect(result).toBe(false);

  // success
  gameState.placements.push(dummy);
  result = Actions.ReceiveHandoverCard(gameState, 0, true);
  expect(result).toBe(true);
  expect(gameState.roundPhase).toBe(RoundPhase.HandoverPhase2Give);
  expect(gameState.players[0].hand.length).toBe(10);
  expect(gameState.players[1].hand.length).toBe(10);
  expect(gameState.handoverCard1.IsSpecified()).toBe(false);
  expect(gameState.handoverCard2.IsSpecified()).toBe(false);
});
