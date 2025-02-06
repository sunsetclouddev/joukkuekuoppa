import type { Placement } from '../../common';
import { C, Utilities, Card, PlayerStatus, PlayerGameState, RoundPhase, MatchPhase,
  GetPlayerIDForPosition, GameState, GameSettings, Rules } from '../../common';

import { PickDealer, ShuffleNumberArray } from './Random';

export function InitializeGameState(gameState: GameState): void
{
  gameState.Initialize();

  gameState.players.length = 0;
  for (let i = 0; i < C.players; i++)
    gameState.players.push(new PlayerGameState(i));

  gameState.dealer = PickDealer();
  gameState.turn = gameState.dealer;

  gameState.roundPhase = RoundPhase.Initial;
  gameState.matchPhase = MatchPhase.Ongoing;

  // for testing purposes
  /*
  const dummy : Placement = { };
  dummy[0] = 0;
  dummy[1] = 1;
  dummy[2] = 2;
  dummy[3] = 3;
  dummy[4] = 4;
  dummy[5] = 5;

  gameState.placements.push(dummy);
  */
}

export function DealCards(gameState: GameState, playerID: number): boolean
{
  if (gameState.players.length < C.players)
    return false;

  if ((gameState.roundPhase !== RoundPhase.Initial) && (gameState.roundPhase !== RoundPhase.Finished))
    return false;

  if (gameState.dealer !== playerID)
    return false;

  const identifiers: number[] = Array.from({ length: C.deckSize }, (value, key) => key);
  ShuffleNumberArray(identifiers);

  const indices: number[] = Array.from({ length: C.deckSize }, (value, key) => key);
  ShuffleNumberArray(indices);

  const handSize = C.deckSize / C.players;

  for (let i = 0; i < C.players; i++)
  {
    const hand = [];

    for (let j = 0; j < handSize; j++)
      hand.push(Card.CreateFaceUp(indices[i * handSize + j], identifiers[i * handSize + j]));

    gameState.players[i].hand = hand;
    gameState.players[i].status = PlayerStatus.Empty;
  }

  gameState.roundPhase = (gameState.placements.length === 0) ? RoundPhase.Normal : RoundPhase.HandoverPhase1Give;
  gameState.turn = (gameState.roundPhase === RoundPhase.Normal) ? gameState.dealer : C.unspecified;

  return true;
}

export function GetGameRunningStatus(gameState: GameState): boolean
{
  return (gameState.matchPhase === MatchPhase.Ongoing);
}

export function GetGameState(gameState: GameState, gameSettings: GameSettings, playerID: number): GameState
{
  // create a copy and override the player part of the copy, to avoid modifying original player information
  const result = Utilities.CopyGameState(gameState);
  result.players = [];

  if (gameState.players.length < C.players)
    return result;

  for (let i = 0; i < C.players; i++)
  {
    const index = (playerID + i) % C.players;

    // create a result where the contents of playerID will be in the first element, the contents of playerID+1 in the second, etc.
    const pgs = Utilities.CopyPlayerGameState(gameState.players[index]);

    // when cards are visible to everyone, the whole information can be sent as-is
    // otherwise the hands of other players need to be sent as face down without card content identifying information
    if (!gameSettings.PlayingWithOpenCards() && (index !== playerID))
    {
      pgs.hand = pgs.hand.map((card: Card) => { return Card.CreateFaceDown(card.identifier); });
    }

    result.players.push(pgs);
  }

  return result;
}

function MoveTurn(gameState: GameState): void
{
  // Finds and moves the turn to the player that next needs to take action.

  // initially move turn by one
  const original = gameState.turn;
  gameState.turn = (gameState.turn + 1) % C.players;

  // then move turn as long as the target player is done, or until the original player is reached
  while ((gameState.players[gameState.turn].status === PlayerStatus.Done) ||
    (gameState.players[gameState.turn].status === PlayerStatus.PlayedAndDone))
  {
    if (gameState.players[gameState.turn].status === PlayerStatus.PlayedAndDone)
      gameState.players[gameState.turn].status = PlayerStatus.Done;

    if (gameState.turn === original)
      break;

    gameState.turn = (gameState.turn + 1) % C.players;
  }
}

function ProcessEndOfTrick(gameState: GameState): void
{
  // Determines whether the end of trick has been reached, which happens when all other active players than the currently targeted one have passed.

  // @note: Currently special case handling is applied when a player plays their last cards, as they would become non-active, but in the case that all
  // other players pass after, the turn should move to the player next to the one that played their last cards. To avoid reaching the end of trick
  // too early, a special status of PlayedAndDone is used, which will be turned into Done by MoveTurn when the turn moves to the correct player.
  // @todo: This is too implicit and brittle behavior, find a way to refactor the logic to be more explicit.

  let endOfTrickReached = true;
  for (let i = 0; i < C.players; i++)
  {
    if (gameState.turn === i)
      continue;

    if ((gameState.players[i].status !== PlayerStatus.Passed) && (gameState.players[i].status !== PlayerStatus.Done))
      endOfTrickReached = false;
  }

  if (endOfTrickReached)
  {
    gameState.playedCards.length = 0;
    gameState.players.forEach((player) => { player.status = (player.status === PlayerStatus.Done) ? PlayerStatus.Done : PlayerStatus.Empty; });
  }
}

function ProcessEndOfRound(gameState: GameState): void
{
  // round ends when all players are Done
  if (gameState.players.find((player) => { return (player.status !== PlayerStatus.Done); }) !== undefined)
    return;

  gameState.dealer = gameState.roundPlacement[2];

  const placement : Placement = { };
  for (let i = 0; i < gameState.roundPlacement.length; i++)
    placement[gameState.roundPlacement[i]] = i;

  gameState.placements.push(placement);

  gameState.roundPlacement.length = 0;
  gameState.roundPhase = RoundPhase.Finished;
  gameState.turn = gameState.dealer;
}

function ProcessEndOfMatch(gameState: GameState): void
{
  if (gameState.matchPhase === MatchPhase.Completed)
    return;

  // match ends when a score threshold is reached (and/or surpassed) and the teams' scores are not equal

  const team1Score = Rules.CalculateTotalScore(gameState.placements, C.team1Indices);
  const team2Score = Rules.CalculateTotalScore(gameState.placements, C.team2Indices);

  if ((team1Score < C.scoreToWin && team2Score < C.scoreToWin) || ((team1Score - team2Score) === 0))
    return;

  gameState.turn = C.unspecified;
  gameState.dealer = C.unspecified;

  gameState.matchPhase = MatchPhase.Completed;
  gameState.matchWinner = (team1Score > team2Score) ? 1 : 2;
}

function EndOfActionProcessing(gameState: GameState): void
{
  MoveTurn(gameState);
  ProcessEndOfTrick(gameState);
  ProcessEndOfRound(gameState);
  ProcessEndOfMatch(gameState);
}

export function PlayCards(gameState: GameState, playerID: number, cards: Card[]): boolean
{
  if (gameState.turn !== playerID)
    return false;

  const player = gameState.players[playerID];

  // cards must exist in player hand
  if (cards.find((card) => { return (player.hand.find((handCard) => { return Card.AreSame(card, handCard); }) === undefined); }) !== undefined)
    return false;

  if (!Rules.IsValidPlay(cards, gameState.playedCards.length > 0 ? gameState.playedCards[gameState.playedCards.length - 1] : []))
    return false;

  // remove from player hand
  cards.forEach((card) => { player.hand = player.hand.filter((c : Card) => { return (!Card.AreSame(c, card)); }); });

  // add to played cards
  gameState.playedCards.push(cards);

  player.status = (player.hand.length === 0) ? PlayerStatus.PlayedAndDone : PlayerStatus.Played;
  if (player.status === PlayerStatus.PlayedAndDone)
    gameState.roundPlacement.push(playerID);

  EndOfActionProcessing(gameState);

  return true;
}

export function PassTurn(gameState: GameState, playerID: number): boolean
{
  if (gameState.turn !== playerID)
    return false;

  if (!Rules.IsValidToPass(gameState.playedCards))
    return false;

  gameState.players[playerID].status = PlayerStatus.Passed;

  EndOfActionProcessing(gameState);

  return true;
}

export function GiveHandoverCard(gameState: GameState, playerID: number, card: Card): boolean
{
  if ((gameState.roundPhase !== RoundPhase.HandoverPhase1Give) && (gameState.roundPhase !== RoundPhase.HandoverPhase2Give))
    return false;

  if (gameState.placements.length === 0)
    return false;

  const isPhase1 = (gameState.roundPhase === RoundPhase.HandoverPhase1Give);
  const position1 = isPhase1 ? 4 : 0;
  const position2 = isPhase1 ? 5 : 1;

  const playerPosition = gameState.placements[gameState.placements.length - 1][playerID];

  if ((playerPosition !== position1) && (playerPosition !== position2))
    return false;

  const handoverCard = (playerPosition === position1) ? gameState.handoverCard1 : gameState.handoverCard2;

  if (handoverCard.IsSpecified())
    return false;

  if (!Rules.IsValidHandover(card, gameState.players[playerID].hand, isPhase1))
    return false;

  // remove from player hand
  gameState.players[playerID].hand = gameState.players[playerID].hand.filter((c : Card) => { return (!Card.AreSame(c, card)); });

  // add to handover slot
  if (playerPosition === position1)
    gameState.handoverCard1 = card;
  else
    gameState.handoverCard2 = card;

  // change round phase
  if (gameState.handoverCard1.IsSpecified() && gameState.handoverCard2.IsSpecified())
  {
    gameState.roundPhase = isPhase1 ? RoundPhase.HandoverPhase1Receive : RoundPhase.HandoverPhase2Receive;
  }

  return true;
}

export function ReceiveHandoverCard(gameState: GameState, playerID: number, isFirstCard: boolean): boolean
{
  if ((gameState.roundPhase !== RoundPhase.HandoverPhase1Receive) && (gameState.roundPhase !== RoundPhase.HandoverPhase2Receive))
    return false;

  if (gameState.placements.length === 0)
    return false;

  if (!gameState.handoverCard1.IsSpecified() || !gameState.handoverCard2.IsSpecified())
    return false;

  const isPhase1 = (gameState.roundPhase === RoundPhase.HandoverPhase1Receive);
  const position1 = isPhase1 ? 0 : 4;
  const position2 = isPhase1 ? 1 : 5;

  if (gameState.placements[gameState.placements.length - 1][playerID] !== position1)
    return false;

  const otherPlayerID = GetPlayerIDForPosition(gameState.placements[gameState.placements.length - 1], position2);
  if (otherPlayerID === C.unspecified)
    return false;

  const selectedCard = isFirstCard ? gameState.handoverCard1 : gameState.handoverCard2;
  const otherCard = isFirstCard ? gameState.handoverCard2 : gameState.handoverCard1;

  // add to player hands
  gameState.players[playerID].hand.push(selectedCard);
  gameState.players[otherPlayerID].hand.push(otherCard);

  // remove from handover slots
  gameState.handoverCard1 = new Card();
  gameState.handoverCard2 = new Card();

  // change round phase
  gameState.roundPhase = isPhase1 ? RoundPhase.HandoverPhase2Give : RoundPhase.Normal;
  if (gameState.roundPhase === RoundPhase.Normal)
    gameState.turn = gameState.dealer;

  return true;
}
