import * as C from '../src/Constants';
import { Card } from '../src/Card';

test('create face down without identity', () =>
{
  const card = Card.CreateFaceDown();

  expect(card.identifier).toBe(C.unspecified);
  expect(card.IsSpecified()).toBe(false);
  expect(card.IsFaceUp()).toBe(false);
  expect(card.IsRedJoker()).toBe(false);
  expect(card.IsBlackJoker()).toBe(false);
  expect(card.GetSuit()).toBe(C.unspecified);
  expect(card.GetFaceValue()).toBe(C.unspecified);
});

test('create face down with identity', () =>
{
  const id = 47;
  const card = Card.CreateFaceDown(id);

  expect(card.identifier).toBe(id);
  expect(card.IsSpecified()).toBe(false);
  expect(card.IsFaceUp()).toBe(false);
  expect(card.IsRedJoker()).toBe(false);
  expect(card.IsBlackJoker()).toBe(false);
  expect(card.GetSuit()).toBe(C.unspecified);
  expect(card.GetFaceValue()).toBe(C.unspecified);
});

test('create face up without identity', () =>
{
  const index = 18;
  const card = Card.CreateFaceUp(index);

  expect(card.identifier).toBe(C.unspecified);
  expect(card.IsSpecified()).toBe(true);
  expect(card.IsFaceUp()).toBe(true);
  expect(card.IsRedJoker()).toBe(false);
  expect(card.IsBlackJoker()).toBe(false);
  expect(card.GetSuit()).toBe(2);
  expect(card.GetFaceValue()).toBe(6);
});

test('create face up with identity', () =>
{
  const index = 32;
  const id = 22;
  const card = Card.CreateFaceUp(index, id);

  expect(card.identifier).toBe(id);
  expect(card.IsSpecified()).toBe(true);
  expect(card.IsFaceUp()).toBe(true);
  expect(card.IsRedJoker()).toBe(false);
  expect(card.IsBlackJoker()).toBe(false);
  expect(card.GetSuit()).toBe(3);
  expect(card.GetFaceValue()).toBe(7);
});

test('create jokers', () =>
{
  const index = C.redJokerIndex;
  const card = Card.CreateFaceUp(index);

  expect(card.identifier).toBe(C.unspecified);
  expect(card.IsSpecified()).toBe(true);
  expect(card.IsFaceUp()).toBe(true);
  expect(card.IsRedJoker()).toBe(true);
  expect(card.IsBlackJoker()).toBe(false);
  expect(card.GetSuit()).toBe(C.unspecified);
  expect(card.GetFaceValue()).toBe(C.unspecified);

  const index2 = C.blackJokerIndex;
  const card2 = Card.CreateFaceUp(index2);

  expect(card2.identifier).toBe(C.unspecified);
  expect(card2.IsSpecified()).toBe(true);
  expect(card2.IsFaceUp()).toBe(true);
  expect(card2.IsRedJoker()).toBe(false);
  expect(card2.IsBlackJoker()).toBe(true);
  expect(card2.GetSuit()).toBe(C.unspecified);
  expect(card2.GetFaceValue()).toBe(C.unspecified);
});

test('AreSame scenarios', () =>
{
  const downWithoutIdentity = Card.CreateFaceDown();
  const downWithIdentity = Card.CreateFaceDown(2);
  const upWithIdentity = Card.CreateFaceUp(7, 12);

  const basic1 = Card.CreateFaceUp(45);
  const basic2 = Card.CreateFaceUp(46);
  const joker1 = Card.CreateFaceUp(C.redJokerIndex);
  const joker2 = Card.CreateFaceUp(C.blackJokerIndex);

  expect(Card.AreSame(downWithoutIdentity, downWithoutIdentity)).toBe(false);
  expect(Card.AreSame(downWithIdentity, downWithIdentity)).toBe(false);
  expect(Card.AreSame(upWithIdentity, upWithIdentity)).toBe(true);
  expect(Card.AreSame(downWithIdentity, upWithIdentity)).toBe(false);

  expect(Card.AreSame(basic1, basic1)).toBe(true);
  expect(Card.AreSame(basic1, basic2)).toBe(false);

  expect(Card.AreSame(joker1, joker2)).toBe(false);
  expect(Card.AreSame(joker1, basic1)).toBe(false);
});
