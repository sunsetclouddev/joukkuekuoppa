import * as C from './Constants';
import { Card } from './Card';
import { PlayerGameState } from './Player';

export enum RoundPhase
{
  Initial,
  HandoverPhase1Give,
  HandoverPhase1Receive,
  HandoverPhase2Give,
  HandoverPhase2Receive,
  Normal,
  Finished
}

export enum MatchPhase { NotStarted, Ongoing, Completed }

// @note: Intentionally trying an "indexable type" for Placement, although a plain array would probably work just fine.
// @todo: Also consider using actual Map type (from ES6) instead of "indexable type".
export type Placement =
{
  [id: number]: number;
}

export function GetPlayerIDForPosition(placement: Placement, position: number): number
{
  for (const key in placement)
  {
    if (placement[Number(key)] === position)
      return Number(key);
  }

  return C.unspecified;
}

export class GameState
{
  private _players: PlayerGameState[];
  private _handoverCard1: Card;
  private _handoverCard2: Card;
  private _dealer: number;
  private _turn: number;
  private _playedCards: Card[][];
  private _roundPhase: RoundPhase;
  private _roundPlacement: number[];
  private _placements: Placement[];
  private _matchPhase: MatchPhase;
  private _matchWinner: number;

  // @note: An alternative to having a number of setters would be to treat GameState as an immutable object.
  // This would require at least modifying server/Actions so that they would each construct a new GameState
  // instead of modifying the existing one.

  public get players(): PlayerGameState[] { return this._players; };
  public get handoverCard1(): Card { return this._handoverCard1; };
  public get handoverCard2(): Card { return this._handoverCard2; };
  public get dealer(): number { return this._dealer; };
  public get turn(): number { return this._turn; };
  public get playedCards(): Card[][] { return this._playedCards; };
  public get roundPhase(): RoundPhase { return this._roundPhase; };
  public get roundPlacement(): number[] { return this._roundPlacement; };
  public get placements(): Placement[] { return this._placements; };
  public get matchPhase(): MatchPhase { return this._matchPhase; };
  public get matchWinner(): number { return this._matchWinner; };

  public set players(p: PlayerGameState[]) { this._players = p; };
  public set handoverCard1(c: Card) { this._handoverCard1 = c; };
  public set handoverCard2(c: Card) { this._handoverCard2 = c; };
  public set dealer(n: number) { this._dealer = n; };
  public set turn(n: number) { this._turn = n; };
  public set roundPhase(r: RoundPhase) { this._roundPhase = r; };
  public set matchPhase(m: MatchPhase) { this._matchPhase = m; };
  public set matchWinner(n: number) { this._matchWinner = n; };

  // @todo: Is there a way to reuse code between constructor and Initialize? (not assigning in constructor gives warning/error)
  constructor(players?: PlayerGameState[])
  {
    this._players = players ?? [];
    this._handoverCard1 = new Card();
    this._handoverCard2 = new Card();
    this._dealer = C.unspecified;
    this._turn = C.unspecified;
    this._playedCards = [];
    this._roundPhase = RoundPhase.Initial;
    this._roundPlacement = [];
    this._placements = [];
    this._matchPhase = MatchPhase.NotStarted;
    this._matchWinner = C.unspecified;
  }

  public Initialize(players?: PlayerGameState[])
  {
    this._players = players ?? [];
    this._handoverCard1 = new Card();
    this._handoverCard2 = new Card();
    this._dealer = C.unspecified;
    this._turn = C.unspecified;
    this._playedCards = [];
    this._roundPhase = RoundPhase.Initial;
    this._roundPlacement = [];
    this._placements = [];
    this._matchPhase = MatchPhase.NotStarted;
    this._matchWinner = C.unspecified;
  }
}
