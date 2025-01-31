import * as C from './Constants';

// @note: Not using 'export default' here or in other places where there is only one export,
// due to reasons given e.g. in here: https://basarat.gitbook.io/typescript/main-1/defaultisbad

export class GameSettings
{
  // 'true' for players that are driven by AI
  private _aiPlayers: boolean[];

  // 'true' if all cards should be sent face up to all players (for e.g. testing or teaching purposes)
  private _openCards: boolean;

  public get aiPlayers(): boolean[] { return this._aiPlayers; }
  public get openCards(): boolean { return this._openCards; }

  public set aiPlayers(b: boolean[]) { this._aiPlayers = b; }
  public set openCards(b: boolean) { this._openCards = b; }

  constructor()
  {
    this._aiPlayers = [];
    this._aiPlayers.push(false);
    for (let i = 1; i < C.players; i++)
      this._aiPlayers.push(true);

    this._openCards = false;
  }

  public IsAIPlayer(n: number) : boolean { return ((n >= 0) && (n < C.players) && this._aiPlayers[n]); }
  public PlayingWithOpenCards() : boolean { return this._openCards; }
}
