import * as C from './Constants';
import { Card } from './Card';

// PlayedAndDone is defined separately from Done because e.g. there is a difference in
// the scenario where the turn is passed around after a player finishes, so that the player
// next to the finished one gets the next turn.
export enum PlayerStatus { Empty, Played, Passed, Done, PlayedAndDone }

export class PlayerGameState
{
  // Players are given separate ids because their order in player lists/arrays is not guaranteed.
  private _id: number;
  private _hand: Card[];
  private _status: PlayerStatus;

  public get id(): number { return this._id; }
  public get hand(): Card[] { return this._hand; }
  public get status(): PlayerStatus { return this._status; }

  public set hand(cards: Card[]) { this._hand = cards; }
  public set status(s: PlayerStatus) { this._status = s; }

  constructor(id?: number)
  {
    this._id = id ?? C.unspecified;
    this._hand = [];
    this._status = PlayerStatus.Empty;
  }
}
