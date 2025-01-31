import { Card, StringToCard } from '../src/Card';
import type { Placement } from '../src/GameState';
import * as Rules from '../src/Rules';

function IsValidPlayScenario(playCardsString: string[], existingCardsString: string[], expected: boolean)
{
  const playCards: Card[] = playCardsString.map((item: string) => { return StringToCard(item); });
  const existingCards: Card[] = existingCardsString.map((item: string) => { return StringToCard(item); });

  expect(Rules.IsValidPlay(playCards, existingCards)).toBe(expected);
}

test('GetComparisonValue', () =>
{
  expect(Rules.GetComparisonValue(StringToCard('h4'))).toBe(4);
  expect(Rules.GetComparisonValue(StringToCard('h1'))).toBe(14);
  expect(Rules.GetComparisonValue(StringToCard('h2'))).toBe(15);
  expect(Rules.GetComparisonValue(StringToCard('j2'))).toBe(16);
  expect(Rules.GetComparisonValue(StringToCard('j1'))).toBe(17);
});

test('IsWildCard', () =>
{
  expect(Rules.IsWildCard(StringToCard('d7'))).toBe(false);
  expect(Rules.IsWildCard(StringToCard('j1'))).toBe(true);
  expect(Rules.IsWildCard(StringToCard('j2'))).toBe(true);
  expect(Rules.IsWildCard(StringToCard('c2'))).toBe(true);
});

test('HasOnlyWildCards', () =>
{
  expect(Rules.HasOnlyWildCards([StringToCard('d7')])).toBe(false);
  expect(Rules.HasOnlyWildCards([StringToCard('d7'), StringToCard('h2')])).toBe(false);
  expect(Rules.HasOnlyWildCards([StringToCard('j2'), StringToCard('h2')])).toBe(true);
});

test('IsPure', () =>
{
  expect(Rules.IsPure([StringToCard('d7')])).toBe(true);
  expect(Rules.IsPure([StringToCard('d7'), StringToCard('h2')])).toBe(false);
  expect(Rules.IsPure([StringToCard('d2'), StringToCard('h2')])).toBe(true);
  expect(Rules.IsPure([StringToCard('j2'), StringToCard('h2')])).toBe(false);
  expect(Rules.IsPure([StringToCard('j1'), StringToCard('j2')])).toBe(true);
});

test('IsValidPlay basic groups', () =>
{
  IsValidPlayScenario([], [], false);
  IsValidPlayScenario(['s1'], [], true);
  IsValidPlayScenario(['h8', 'c8'], [], true);
  IsValidPlayScenario(['h9', 'c8'], [], false);
  IsValidPlayScenario(['s5', 'c5', 'h5'], [], true);
  IsValidPlayScenario(['s5', 'c4', 'h5'], [], false);
  IsValidPlayScenario(['s7', 's8'], [], false);
  IsValidPlayScenario(['s1', 's2', 's3'], [], false);
  IsValidPlayScenario(['s1', 's12', 's13'], [], true);
  IsValidPlayScenario(['d4', 's3', 'h7', 'c6', 'c5'], [], true);
  IsValidPlayScenario(['h8', 'd8', 's9', 'h9', 'h10', 'c10'], [], true);
  IsValidPlayScenario(['h8', 'd9', 's9', 'h9', 'h10', 'c10'], [], false);
  IsValidPlayScenario(['h8', 'd8', 'c8', 's9', 'h9', 'd9', 'h10', 'c10', 's10'], [], true);
  IsValidPlayScenario(['h8', 'd8', 'c8', 's9', 'h9', 'd9', 'c9', 'c10', 's10'], [], false);
});

test('IsValidPlay wild cards', () =>
{
  IsValidPlayScenario(['j1'], [], true);
  IsValidPlayScenario(['j2'], [], true);
  IsValidPlayScenario(['s2'], [], true);
  IsValidPlayScenario(['c2', 'h2'], [], true);
  IsValidPlayScenario(['j1', 'j2'], [], true);
  IsValidPlayScenario(['j1', 'h2'], [], true);
  IsValidPlayScenario(['j1', 'h2', 'j2'], [], true);

  IsValidPlayScenario(['j1', 'd8'], [], false);
  IsValidPlayScenario(['j1d8', 'd8'], [], true);
  IsValidPlayScenario(['j1h8', 'd8'], [], true);
  IsValidPlayScenario(['j1d5', 'd8'], [], false);
  IsValidPlayScenario(['j1d6', 'd8', 'd7'], [], true);

  IsValidPlayScenario(['d2', 'd8'], [], false);
  IsValidPlayScenario(['d2d8', 'd8'], [], true);
  IsValidPlayScenario(['d2h8', 'd8'], [], false);
  IsValidPlayScenario(['d2d6', 'd8', 'd7'], [], false);
});

test('IsValidPlay continuations', () =>
{
  IsValidPlayScenario([], ['h12'], false);
  IsValidPlayScenario(['d13'], ['h12'], true);
  IsValidPlayScenario(['d12'], ['h12'], false);
  IsValidPlayScenario(['d11'], ['h12'], false);
  IsValidPlayScenario(['d1'], ['h12'], true);

  IsValidPlayScenario(['d1'], ['h4', 's4'], false);
  IsValidPlayScenario(['d1', 'c1'], ['h4', 's4'], true);

  IsValidPlayScenario(['d5', 'c7', 'h6'], ['h4', 's5', 'c6'], true);
  IsValidPlayScenario(['d5', 's6', 's4'], ['h4', 's5', 'c6'], false);
  IsValidPlayScenario(['d4', 'c5', 's3'], ['h4', 's5', 'c6'], false);
  IsValidPlayScenario(['d4', 'd5', 'd3'], ['h4', 's5', 'c6'], true);
});

test('IsValidPlay wild card continuations', () =>
{
  IsValidPlayScenario(['j1'], ['h12'], true);
  IsValidPlayScenario(['j2'], ['h12'], true);
  IsValidPlayScenario(['d2'], ['h12'], true);

  IsValidPlayScenario(['j1', 'j2'], ['h4', 's4'], true);
  IsValidPlayScenario(['s2', 'd2'], ['h4', 's4'], true);
  IsValidPlayScenario(['s2c5', 'c5'], ['h4', 's4'], true);
  IsValidPlayScenario(['s2c4', 'c4'], ['h4', 's4'], false);

  IsValidPlayScenario(['d5', 'j1', 'h6'], ['h4', 's5', 'c6'], false);
  IsValidPlayScenario(['d5', 'j1c7', 'h6'], ['h4', 's5', 'c6'], true);

  IsValidPlayScenario(['h1', 'c1'], ['s1', 'd2s1'], true);
  IsValidPlayScenario(['h2', 'c2'], ['s1', 'd2s1'], true);
  IsValidPlayScenario(['h2', 'c2'], ['s1', 'd2s1'], true);
  IsValidPlayScenario(['j1', 's2'], ['h2', 'c2'], false);
  IsValidPlayScenario(['j1', 's2'], ['j2', 'c2'], false);
  IsValidPlayScenario(['j1', 'j2'], ['h2', 'c2'], true);
});

test('IsValidToPass', () =>
{
  expect(Rules.IsValidToPass([])).toBe(false);
  expect(Rules.IsValidToPass([[StringToCard('d7')]])).toBe(true);
});

test('IsValidHandover', () =>
{
  expect(Rules.IsValidHandover(StringToCard('d7'), [StringToCard('d7')])).toBe(true);
  expect(Rules.IsValidHandover(StringToCard('d7'), [StringToCard('d8')])).toBe(false);
});

test('CalculateRoundScore', () =>
{
  expect(Rules.CalculateRoundScore([0, 1, 2])).toBe(6);
  expect(Rules.CalculateRoundScore([0, 1, 5])).toBe(5);
  expect(Rules.CalculateRoundScore([2, 3, 4])).toBe(1);
  expect(Rules.CalculateRoundScore([3, 4, 5])).toBe(0);
});

test('CalculateTotalScore', () =>
{
  const placement1 : Placement = { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5 };
  const placement2 : Placement = { 0: 5, 1: 4, 2: 3, 3: 2, 4: 1, 5: 0 };

  expect(Rules.CalculateTotalScore([placement1, placement2], [0, 2, 4])).toBe(6);
});
