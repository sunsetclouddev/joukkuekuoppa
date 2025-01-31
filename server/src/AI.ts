import { Utilities, Card, RoundPhase, MatchPhase, GetPlayerIDForPosition, GameState, GameSettings, Rules } from '../../common';

import * as Actions from './Actions';

// "sleep" ideas from: https://stackoverflow.com/questions/37764665/how-to-implement-sleep-function-in-typescript
function sleep(milliseconds: number): Promise<void>
{
  return new Promise(resolve => setTimeout(resolve, milliseconds));
}

function GetExtremalValueCards(cards: Card[]): [Card, Card]
{
  const minValueCard = cards.reduce(
    (resultCard, card) => { return (Rules.GetComparisonValue(resultCard) < Rules.GetComparisonValue(card)) ? resultCard : card; }, cards[0]);

  const maxValueCard = cards.reduce(
    (resultCard, card) => { return (Rules.GetComparisonValue(resultCard) > Rules.GetComparisonValue(card)) ? resultCard : card; }, cards[0]);

  return [minValueCard, maxValueCard];
}

function GetAllSubsets(input: number[]): number[][]
{
  // generates all subsets by:
  // - starting from empty, and
  // - in each iteration taking copies of all elements generated so far and by adding one input element to them

  const result: number[][] = [ [] ];

  for (const element of input)
  {
    const amountOfExisting = result.length;
    for (let i = 0; i < amountOfExisting; i++)
      result.push([...result[i], element]);
  }

  return result;
}

function FilterToLength(input: number[][], correctLength: number): number[][]
{
  return input.filter((element : number[]) => { return (element.length === correctLength); });
}

function Selector(base: Card[], card: Card, selection: Card): Card[]
{
  const copy = Utilities.CopyCard(card);
  copy.SetWildCardSelection(selection);
  return base.concat(copy);
}

function GetWildCardVariations(cards: Card[]): Card[][]
{
  if (Rules.IsPure(cards))
    return [cards];

  // generates hands from given cards by using all possible variations of selections for the wildcards present in cards

  const jokers = cards.filter((c : Card) => { return (c.IsRedJoker() || c.IsBlackJoker()); });
  const twos = cards.filter((c : Card) => { return (c.GetFaceValue() === 2); });
  const normals = cards.filter((c : Card) => { return (!c.IsRedJoker() && !c.IsBlackJoker() && (c.GetFaceValue() !== 2)); });

  const allNonWildCards: Card[] = [];
  for (let i = 0; i < 52; i++)
  {
    if (((i % 13) + 1) === 2)
      continue;
    allNonWildCards.push(Card.CreateFaceUp(i));
  }

  let result : Card[][] = [normals];

  for (const two of twos)
    result = result.flatMap((base: Card[]) => { return normals.map((card: Card) => { return Selector(base, two, card); }); });

  for (const joker of jokers)
    result = result.flatMap((base: Card[]) => { return allNonWildCards.map((card: Card) => { return Selector(base, joker, card); }); });

  return result;
}

function LeastValuablePossibleGroup(gameState: GameState): Card[]
{
  const currentHand = gameState.players[gameState.turn].hand;
  const existingGroup = gameState.playedCards.length > 0 ? gameState.playedCards[gameState.playedCards.length - 1] : [];

  const allIndexSubsets = GetAllSubsets([...Array(currentHand.length).keys()]);

  const indexSubsetsOfCorrectLength = (existingGroup.length !== 0) ? FilterToLength(allIndexSubsets, existingGroup.length) : allIndexSubsets;

  for (const indexSubset of indexSubsetsOfCorrectLength)
  {
    const handSubset = indexSubset.map((index: number) => { return currentHand[index]; });
    const variations = GetWildCardVariations(handSubset);

    for (const variation of variations)
    {
      // @todo: Pick least valuable valid variation instead of first valid variation.
      if (Rules.IsValidPlay(variation, existingGroup))
        return variation;
    }
  }

  return [];
}

async function GiveHighOrLow(gameState: GameState, gameSettings: GameSettings, position: number, giveHigh: boolean): Promise<boolean>
{
  const indexPlayerID = (gameState.placements.length > 0) ? GetPlayerIDForPosition(gameState.placements[gameState.placements.length - 1], position) : -1;
  if (indexPlayerID === -1 || !gameSettings.IsAIPlayer(indexPlayerID))
    return false;

  const [lowCard, highCard] = GetExtremalValueCards(gameState.players[indexPlayerID].hand);

  await sleep(5000);
  if (gameState.matchPhase !== MatchPhase.Ongoing)
    return true;

  Actions.GiveHandoverCard(gameState, indexPlayerID, giveHigh ? highCard : lowCard);
  return true;
}

async function Receive(gameState: GameState, gameSettings: GameSettings, position: number): Promise<boolean>
{
  if (!gameState.handoverCard1.IsSpecified() || !gameState.handoverCard2.IsSpecified())
    return false;

  const indexPlayerID = (gameState.placements.length > 0) ? GetPlayerIDForPosition(gameState.placements[gameState.placements.length - 1], position) : -1;
  if (indexPlayerID === -1 || !gameSettings.IsAIPlayer(indexPlayerID))
    return false;

  await sleep(5000);
  if (gameState.matchPhase !== MatchPhase.Ongoing)
    return true;

  Actions.ReceiveHandoverCard(gameState, indexPlayerID, Rules.GetComparisonValue(gameState.handoverCard1) > Rules.GetComparisonValue(gameState.handoverCard2));
  return true;
}

async function RunAIHelper(gameState: GameState, gameSettings: GameSettings): Promise<void>
{
  if (gameState.matchPhase !== MatchPhase.Ongoing)
    return;

  // dealer AI action

  if (gameState.turn === gameState.dealer && gameSettings.IsAIPlayer(gameState.turn) &&
    ((gameState.roundPhase === RoundPhase.Initial) || (gameState.roundPhase === RoundPhase.Finished)))
  {
    await sleep(5000);
    if (gameState.matchPhase !== MatchPhase.Ongoing)
      return;

    Actions.DealCards(gameState, gameState.turn);
    return;
  }

  // handover AI action

  if ((gameState.roundPhase === RoundPhase.HandoverPhase1Give) || (gameState.roundPhase === RoundPhase.HandoverPhase2Give))
  {
    const isPhase1 = (gameState.roundPhase === RoundPhase.HandoverPhase1Give);
    const position1 = isPhase1 ? 4 : 0;
    const position2 = isPhase1 ? 5 : 1;

    if (!gameState.handoverCard1.IsSpecified() && await GiveHighOrLow(gameState, gameSettings, position1, isPhase1))
      return;

    if (!gameState.handoverCard2.IsSpecified() && await GiveHighOrLow(gameState, gameSettings, position2, isPhase1))
      return;
  }

  if ((gameState.roundPhase === RoundPhase.HandoverPhase1Receive) || (gameState.roundPhase === RoundPhase.HandoverPhase2Receive))
  {
    const isPhase1 = (gameState.roundPhase === RoundPhase.HandoverPhase1Receive);
    const position = isPhase1 ? 0 : 4;

    if (await Receive(gameState, gameSettings, position))
      return;
  }

  // normal play AI action

  if (gameState.turn === -1 || !gameSettings.IsAIPlayer(gameState.turn))
    return;

  // @todo: Improve the AI:
  // - In most cases, do not play over cards that a team mate has played.
  // - Instead of just finding something to play, have some planning on how to actually get rid of all cards in hand.

  // find the least valuable possible group to play
  const groupToPlay = LeastValuablePossibleGroup(gameState);
  if (groupToPlay.length !== 0)
  {
    Actions.PlayCards(gameState, gameState.turn, groupToPlay);
    return;
  }

  // if none found, pass
  Actions.PassTurn(gameState, gameState.turn);
}

let runningAI = false;
export async function RunAI(gameState: GameState, gameSettings: GameSettings): Promise<void>
{
  if (runningAI)
    return;

  runningAI = true;

  await RunAIHelper(gameState, gameSettings);

  runningAI = false;
}
