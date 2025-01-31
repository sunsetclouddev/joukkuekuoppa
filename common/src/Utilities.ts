import { Card } from './Card';
import { PlayerGameState } from './Player';
import { GameState } from './GameState';
import { GameSettings } from './GameSettings';

// utility methods to (shallow) copy or restore the full object (including methods) for an object that may only contain member data

// @todo: Determine if there is a more standard way to do this, or whether e.g. DTOs should be used.
// One possibility is to use a "schema builder" such as: https://www.npmjs.com/package/yup.

export function CopyCard(card: Card): Card
{
  return Object.assign(new Card(), card);
}

export function CopyCards(cards: Card[]): Card[]
{
  return cards.map((card: Card) => { return CopyCard(card); });
}

export function CopyPlayerGameState(pgs: PlayerGameState): PlayerGameState
{
  return Object.assign(new PlayerGameState(), pgs);
}

export function CopyGameState(gameState: GameState): GameState
{
  return Object.assign(new GameState(), gameState);
}

export function CopyGameSettings(gameSettings: GameSettings): GameSettings
{
  return Object.assign(new GameSettings(), gameSettings);
}
