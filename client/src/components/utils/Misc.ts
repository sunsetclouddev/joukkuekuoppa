import type { Ref } from 'vue';
import { toRaw, nextTick } from 'vue';

import { Utilities, Card, PlayerStatus, RoundPhase, GameState, Rules } from '../../../../common/index.js';

import { CollectFlipData, ApplyFlipTechnique } from './FlipTechnique.js';

// Updates gameStateRef and aboutToPlayRef based on newGameState.
export function UpdateGameState(gameStateRef: Ref<GameState>, aboutToPlayRef: Ref<Card[]>, newGameState: GameState): void
{
  const storedFlipData = CollectFlipData();

  const cards = gameStateRef.value.players.length > 0 ? gameStateRef.value.players[0].hand : [];
  const aboutToPlayCards = toRaw(aboutToPlayRef.value);

  // ensure full objects

  for (let i = 0; i < newGameState.players.length; i++)
  {
    newGameState.players[i] = Utilities.CopyPlayerGameState(newGameState.players[i]);
    newGameState.players[i].hand = Utilities.CopyCards(newGameState.players[i].hand);
  }

  for (let i = 0; i < newGameState.playedCards.length; i++)
  {
    newGameState.playedCards[i] = Utilities.CopyCards(newGameState.playedCards[i]);
  }

  newGameState.handoverCard1 = Utilities.CopyCard(newGameState.handoverCard1);
  newGameState.handoverCard2 = Utilities.CopyCard(newGameState.handoverCard2);

  // @note: newGameState comes from the server. The order of the cards in player hand and the contents and
  // the order in about-to-play are transient from server's perspective, so retain the client order and
  // contents where applicable by not directly taking the server contents, but by going through
  // the contents and changing cards one-by-one where needed.

  const newCards = newGameState.players.length > 0 ? newGameState.players[0].hand : [];

  // remove cards from hand if they are not in the new hand
  for (let i = 0; i < cards.length; i++)
  {
    if (!newCards.find((card: Card) => Card.AreSame(card, cards[i])))
    {
      cards.splice(i, 1);
      i = -1;
    }
  }

  // remove cards from about-to-play if they are not in the new hand
  for (let i = 0; i < aboutToPlayCards.length; i++)
  {
    if (!newCards.find((card: Card) => Card.AreSame(card, aboutToPlayCards[i])))
    {
      aboutToPlayCards.splice(i, 1);
      i = -1;
    }
  }

  // add cards to hand if they are in the new hand and not already in hand or in about-to-play
  for (const newCard of newCards)
  {
    if (!cards.find((card: Card) => Card.AreSame(card, newCard)) &&
      !aboutToPlayCards.find((card: Card) => Card.AreSame(card, newCard)))
    {
      cards.push(newCard);
    }
  }

  if (newGameState.players.length > 0)
    newGameState.players[0].hand = [...cards];

  gameStateRef.value = newGameState;

  aboutToPlayRef.value = [...aboutToPlayCards];

  nextTick().then(function () { ApplyFlipTechnique(storedFlipData); });
}

export function IsTurn(gameStateRef: Ref<GameState>, playerID: number): boolean
{
  return (gameStateRef.value.turn === playerID);
}

export function IsPlayEnabled(gameStateRef: Ref<GameState>, aboutToPlayRef: Ref<Card[]>, playerID: number): boolean
{
  const existingGroupsAmount = gameStateRef.value.playedCards.length;
  const existingCards = existingGroupsAmount > 0 ? gameStateRef.value.playedCards[existingGroupsAmount - 1] : [];

  return (IsTurn(gameStateRef, playerID) && (aboutToPlayRef.value.length > 0) && Rules.IsValidPlay(aboutToPlayRef.value, existingCards));
}

export function IsPassEnabled(gameStateRef: Ref<GameState>, playerID: number): boolean
{
  return (IsTurn(gameStateRef, playerID) && (gameStateRef.value.playedCards.length > 0));
}

export function IsGiveEnabled(gameStateRef: Ref<GameState>, aboutToPlayRef: Ref<Card[]>): boolean
{
  // @note: in phase1, only valid handover card can be given, in phase 2, any card can be given
  return ((aboutToPlayRef.value.length === 1) &&
    ((gameStateRef.value.roundPhase === RoundPhase.HandoverPhase2Give) ||
      Rules.IsValidHandover(aboutToPlayRef.value[0], gameStateRef.value.players[0].hand)));
}

export function IsDealerActionNeeded(gameStateRef: Ref<GameState>, playerID: number): boolean
{
  return (gameStateRef.value.dealer === playerID &&
    ((gameStateRef.value.roundPhase === RoundPhase.Initial) || (gameStateRef.value.roundPhase === RoundPhase.Finished)));
}

export function IsHandoverGiveActionNeeded(gameStateRef: Ref<GameState>, playerID: number): boolean
{
  // @todo: consider refactoring the common parts between here and server -> Actions -> GiveHandoverCard into e.g. utilities under 'common'

  if ((gameStateRef.value.roundPhase !== RoundPhase.HandoverPhase1Give) && (gameStateRef.value.roundPhase !== RoundPhase.HandoverPhase2Give))
    return false;

  if (gameStateRef.value.placements.length === 0)
    return false;

  const isPhase1 = (gameStateRef.value.roundPhase === RoundPhase.HandoverPhase1Give);
  const position1 = isPhase1 ? 4 : 0;
  const position2 = isPhase1 ? 5 : 1;

  const playerPosition = gameStateRef.value.placements[gameStateRef.value.placements.length - 1][playerID];
  if ((playerPosition !== position1) && (playerPosition !== position2))
    return false;

  const handoverCard = (playerPosition === position1) ? gameStateRef.value.handoverCard1 : gameStateRef.value.handoverCard2;
  if (handoverCard.IsSpecified())
    return false;

  return true;
}

export function IsHandoverReceiveActionNeeded(gameStateRef: Ref<GameState>, playerID: number): boolean
{
  // @todo: consider refactoring the common parts between here and server -> Actions -> ReceiveHandoverCard into e.g. utilities under 'common'

  if ((gameStateRef.value.roundPhase !== RoundPhase.HandoverPhase1Receive) && (gameStateRef.value.roundPhase !== RoundPhase.HandoverPhase2Receive))
    return false;

  if (gameStateRef.value.placements.length === 0)
    return false;

  if (!gameStateRef.value.handoverCard1.IsSpecified() || !gameStateRef.value.handoverCard2.IsSpecified())
    return false;

  const isPhase1 = (gameStateRef.value.roundPhase === RoundPhase.HandoverPhase1Receive);
  const position1 = isPhase1 ? 0 : 4;

  if (gameStateRef.value.placements[gameStateRef.value.placements.length - 1][playerID] !== position1)
    return false;

  return true;
}

export function CreateAllNonWildCards(): Card[][]
{
  const suits = Array.from({ length: 4 }, (v, k) => { return k; });

  return suits.map((i: number) =>
  {
    const values = Array.from({ length: 11 }, (v, k) => { return k + 2; });
    values.push(0);

    return values.map((j: number) => { return Card.CreateFaceUp(i * 13 + j); });
  });
}

export function UseWildCardSelection(card: Card, hand: Card[], aboutToPlayRef: Ref<Card[]>): boolean
{
  return (Rules.IsWildCard(card) && !Rules.HasOnlyWildCards(hand ?? aboutToPlayRef.value));
}

export function ShowStatusAsString(gameStateRef: Ref<GameState>, playerID: number, index: number): string
{
  if (IsDealerActionNeeded(gameStateRef, playerID))
    return 'dealer';

  if (IsTurn(gameStateRef, playerID))
    return 'TURN';

  switch (gameStateRef.value.players[index].status)
  {
    case PlayerStatus.Empty: { return ''; }
    case PlayerStatus.Played: { return 'played'; }
    case PlayerStatus.Passed: { return 'passed'; }
    case PlayerStatus.Done: { return 'done'; }
    case PlayerStatus.PlayedAndDone: { return 'played & done'; }
    default: { return ''; }
  }
}

export function ShowPlacementScore(placement: number): string
{
  switch (placement)
  {
    case 0: { return '3'; }
    case 1: { return '2'; }
    case 2: { return 'J'; }
    case 3: { return '-'; }
    case 4: { return 'K'; }
    case 5: { return 'P'; }
    default: { return ''; }
  }
}

export function GetCardRotation(index: number, amount: number): string
{
  const extremal = 20.0;

  const degrees = (amount === 0) ? 0 : (extremal * (((2 * index) / amount) - 1));

  return 'transform: rotate(' + degrees + 'deg) translateY(' + -((extremal - Math.abs(degrees)) / 2.5) + 'px)';
}

function SuitNumberToString(n: number): string
{
  return (n === 1) ? 'S' : (n === 2) ? 'C' : (n === 3) ? 'D' : /*(n === 4)*/'H';
}

function FaceValueToString(n: number): string
{
  return (n === 1) ? 'A' : (n === 10) ? 'T' : (n === 11) ? 'J' : (n === 12) ? 'Q' : (n === 13) ? 'K' : String(n);
}

export function GetCardStyle(card: Card): string
{
  let choice = '';

  if (!card.IsFaceUp())
    choice = 'back';
  else if (card.IsRedJoker())
    choice = '1J';
  else if (card.IsBlackJoker())
    choice = '2J';
  else
    choice = FaceValueToString(card.GetFaceValue()) + SuitNumberToString(card.GetSuit());

  return 'background-image: url("/src/assets/cards/' + choice + '.svg");';
}

export function GetWildCardStyle(card: Card, allNonWildCards: Card[][]): string
{
  const wildCard = card.GetWildCardSelection();

  if (wildCard === null)
    return '';

  const suit = wildCard.GetSuit() - 1;
  const value = wildCard.GetFaceValue() - 1;

  const usedValue = (value === 0) ? 11 : (value - 2);

  return GetCardStyle(allNonWildCards[suit][usedValue]);
}
