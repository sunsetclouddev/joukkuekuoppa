import type { Placement } from './GameState';
import { Card } from './Card';

export function GetComparisonValue(card: Card): number
{
  if (card.IsRedJoker())
    return 17;

  if (card.IsBlackJoker())
    return 16;

  const value = card.GetFaceValue();

  return (value === 2) ? 15 : (value === 1) ? 14 : value;
}

export function IsWildCard(card: Card): boolean
{
  return (card.IsRedJoker() || card.IsBlackJoker() || (card.GetFaceValue() === 2));
}

function WildCardCount(cards: Card[]): number
{
  return cards.reduce((amount, card) => { return amount + (IsWildCard(card) ? 1 : 0); }, 0);
}

export function HasOnlyWildCards(cards: Card[]): boolean
{
  return (WildCardCount(cards) === cards.length);
}

export function IsPure(cards: Card[]): boolean
{
  // For a set of cards that contain non-wildcards, the purity is based on whether the cards contain wildcards.
  // For a set of cards that contain only wildcards, the purity depends on whether the cards have mixed jokers and twos.

  const amount = WildCardCount(cards);

  if (amount === 0)
    return true;

  if (amount !== cards.length)
    return false;

  const foundJoker = cards.reduce((found, card) => { return (found || (card.GetFaceValue() !== 2)); }, false);
  const foundTwo = cards.reduce((found, card) => { return (found || (card.GetFaceValue() === 2)); }, false);

  return (foundJoker !== foundTwo);
}

enum CompareAs { Group, Individual };
function GetHighestComparisonValue(cards: Card[], compareAs: CompareAs): number
{
  const values = cards.map((card: Card) => { return GetComparisonValue(card); });
  return (values.length === 0) ? -1 : ((compareAs === CompareAs.Group && HasOnlyWildCards(cards)) ? Math.min(...values) : Math.max(...values));
}

enum UniquesOf { FaceValue, Suit }
function GetUniques(cards: Card[], valueType: UniquesOf): number[]
{
  const values = cards.map((card: Card) => { return valueType === UniquesOf.FaceValue ? card.GetFaceValue() : card.GetSuit(); });
  return Array.from(new Set<number>(values).values());
}

function IsSameValue(cards: Card[]): boolean
{
  if (cards.length === 0)
    return false;

  if (HasOnlyWildCards(cards))
    return true;

  return (GetUniques(cards, UniquesOf.FaceValue).length === 1);
}

function IsSameSuit(cards: Card[]): boolean
{
  if (cards.length === 0)
    return false;

  if (HasOnlyWildCards(cards))
    return false;

  return (GetUniques(cards, UniquesOf.Suit).length === 1);
}

function IsNStraight(cards: Card[], n: number): boolean
{
  // number of cards must be divisible by n, and the division result must be at least 3 (minimum straight length)
  if (((cards.length % n) !== 0) || ((cards.length / n) < 3))
    return false;

  // @note: Assumption: the input cards are either all wildcards, or there are no wildcards in the input.
  // @todo: This assumption currently holds due to the calls being based on IsValidPlay which resolves wildcards, but this is a bit too implicit.
  if (HasOnlyWildCards(cards))
    return false;

  // check that in the cards sorted by their comparison value, the order has n card groups with same values

  const values = cards.map((card: Card) => { return GetComparisonValue(card); }).sort((a, b) => { return a - b; });

  for (let i = 0; i < values.length; i += n)
  {
    for (let j = 0; j < n; j++)
      if (values[i] != values[i + j])
        return false;
  }

  // check that there are "number of cards divided by n" distinct values in the cards, and
  // that the difference between maximum and minimum value is equivalent to amount of distinct values, meaning that the values are in a straight

  const uniques = Array.from(new Set<number>(values));

  const minValue = Math.min(...uniques);
  const maxValue = Math.max(...uniques);

  return ((uniques.length === (values.length / n)) && ((maxValue - minValue) === (uniques.length - 1)));
}

function IdentifyGroup(cards: Card[]): number
{
  return (IsSameValue(cards) ? 1 : IsNStraight(cards, 1) ? 2 : IsNStraight(cards, 2) ? 3 : IsNStraight(cards, 3) ? 4 : -1);
}

function CardExistsInCards(target: Card, cards: Card[]): boolean
{
  return (cards.find((card: Card) => { return Card.AreSame(target, card); }) !== undefined);
}

function AreWildCardSelectionsValid(cards: Card[]): boolean
{
  for (const card of cards)
  {
    if (!IsWildCard(card))
      continue;

    if (card.GetWildCardSelection() === null)
      return false;

    // jokers can represent any card, twos can only represent a copy of a card that already exists in given cards
    if ((card.GetFaceValue() === 2) && !CardExistsInCards(card.GetWildCardSelection() ?? new Card(), cards))
      return false;
  }

  return true;
}

function ResolveWildCards(cards: Card[]): Card[]
{
  if (HasOnlyWildCards(cards))
    return cards;

  if (!AreWildCardSelectionsValid(cards))
    return [];

  return cards.map((card: Card) => { return IsWildCard(card) ? (card.GetWildCardSelection() ?? new Card()) : card; });
}

export function IsValidPlay(playCards: Card[], existingCards: Card[]): boolean
{
  // The rules for whether given cards can be played on top of certain existing cards are:
  // - The given cards must be a valid group (single card, 2+ cards with same value, 3+ cards in single straight / double straight / triple straight).
  // - If there are no existing cards, the play is valid as-is. Otherwise:
  // - The given cards' amount and group must be the same as in the existing cards.
  //   - Exception: If the existing group is a single straight, both straight and straight flush are possible for the given cards.
  //   - Straight flush always beats straight.
  // - The given cards must (as a group) have a higher comparison value than the existing cards (as a group).
  //   - Exception: If the given cards are a pure group and existing cards are an impure group, it is enough for the comparison value to be the same.

  const playedPureOverImpure = (IsPure(playCards) && !IsPure(existingCards));

  const resolvedPlayCards = ResolveWildCards(playCards);
  const resolvedExistingCards = ResolveWildCards(existingCards);

  if (IdentifyGroup(resolvedPlayCards) === -1)
    return false;

  if (resolvedExistingCards.length === 0)
    return true;

  if (resolvedPlayCards.length !== resolvedExistingCards.length)
    return false;

  if (IdentifyGroup(resolvedPlayCards) !== IdentifyGroup(resolvedExistingCards))
    return false;

  // suit check only for single straight, not double or triple straight
  if (IsNStraight(resolvedPlayCards, 1) && (IsSameSuit(resolvedPlayCards) !== IsSameSuit(resolvedExistingCards)))
    return IsSameSuit(resolvedPlayCards);

  const comparison = GetHighestComparisonValue(resolvedPlayCards, CompareAs.Group) - GetHighestComparisonValue(resolvedExistingCards, CompareAs.Group);

  return playedPureOverImpure ? (comparison >= 0) : (comparison > 0);
}

export function IsValidToPass(playedCards: Card[][]): boolean
{
  return (playedCards.length > 0);
}

export function IsValidHandover(card: Card, hand: Card[]): boolean
{
  // card must exist in hand
  if (hand.find((handCard) => { return Card.AreSame(card, handCard); }) === undefined)
    return false;

  return GetComparisonValue(card) >= GetHighestComparisonValue(hand, CompareAs.Individual);
}

export function CalculateRoundScore(placementNumbers: number[]): number
{
  // first place gives 3 points, second place gives 2 points, not having last place gives 1 point
  return placementNumbers.reduce(
    (score, placement) => { return score + ((placement === 0) ? 3 : (placement === 1) ? 2 : (placement === 5) ? -1 : 0); },
    1);
}

export function CalculateTotalScore(placements: Placement[], indices: number[]): number
{
  return placements.reduce(
    (totalScore, placement) => { return totalScore + CalculateRoundScore(indices.map((index: number) => { return placement[index]; })); },
    0);
}
