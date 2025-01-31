import type { Ref } from 'vue';

import { Utilities, Card, GameState, GameSettings } from '../../../../common/index.js';

import { UpdateGameState } from './Misc.js';

const getSuccess = 200; // OK
const putSuccessNoContent = 204; // No Content

// The purpose of this class is to keep call interfaces short and clean in the vue component code.
export class ServerCalls
{
  // @note: Using members to support storing references to some call data to avoid the need to send them as parameters on each call.
  // Alternative: could just send the parameters each time to be more explicit.
  private _gameStateRef: Ref<GameState> | null;
  private _aboutToPlayRef: Ref<Card[]> | null;
  private _playerID: number | null;
  private _gameRunningStatusRef: Ref<boolean> | null;
  private _gameSettingsRef: Ref<GameSettings> | null;

  private async GetCall(url: string): Promise<any>
  {
    const response = await fetch(url);
    if (response.status !== getSuccess)
      return undefined;

    return await response.json();
  }

  private async PutCall(url: string, body: string): Promise<void>
  {
    const response = await fetch(url,
    {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body
    });

    if (response.status !== putSuccessNoContent)
      return;

    await this.FetchGameState();
  }

  constructor()
  {
    this._gameStateRef = null;
    this._aboutToPlayRef = null;
    this._playerID = null;
    this._gameRunningStatusRef = null;
    this._gameSettingsRef = null;
  }

  public InitializeForGameState(gameStateRef: Ref<GameState>, aboutToPlayRef: Ref<Card[]>, playerID: number): void
  {
    this._gameStateRef = gameStateRef;
    this._aboutToPlayRef = aboutToPlayRef;
    this._playerID = playerID;
  }

  public InitializeForGameSettings(gameRunningStatusRef: Ref<boolean>, gameSettingsRef: Ref<GameSettings>): void
  {
    this._gameRunningStatusRef = gameRunningStatusRef;
    this._gameSettingsRef = gameSettingsRef;
  }

  public async FetchGameState(): Promise<void>
  {
    if ((this._gameStateRef === null) || (this._aboutToPlayRef === null) || (this._playerID === null))
      return;

    const responseJson = await this.GetCall('/api/gamestate/' + this._playerID);
    if (responseJson === undefined)
      return;

    const newGameState: GameState = Utilities.CopyGameState(responseJson);

    UpdateGameState(this._gameStateRef, this._aboutToPlayRef, newGameState);
  }

  public async DealCards(): Promise<void>
  {
    this.PutCall('/api/deal', JSON.stringify({ 'playerID': this._playerID }));
  }

  public async SelectHandoverCard(isFirstCard: boolean): Promise<void>
  {
    this.PutCall('/api/handoverreceive', JSON.stringify({ 'playerID': this._playerID, 'isFirstCard' : isFirstCard }));
  }

  public async HandoverSelectedCard(): Promise<void>
  {
    if ((this._aboutToPlayRef === null) || (this._aboutToPlayRef.value.length !== 1))
      return;

    this.PutCall('/api/handovergive', JSON.stringify({ 'playerID': this._playerID, 'card' : this._aboutToPlayRef.value[0] }));
  }

  public async PlaySelectedCards(): Promise<void>
  {
    if (this._aboutToPlayRef === null)
      return;

    this.PutCall('/api/play', JSON.stringify({ 'playerID': this._playerID, 'cards' : this._aboutToPlayRef.value }));
  }

  public async PassTurn(): Promise<void>
  {
    this.PutCall('/api/pass', JSON.stringify({ 'playerID': this._playerID }));
  }

  public async FetchGameRunningStatus(): Promise<void>
  {
    if (this._gameRunningStatusRef === null)
      return;

    const responseJson = await this.GetCall('/api/gamerunningstatus');
    if (responseJson === undefined)
      return;

    this._gameRunningStatusRef.value = responseJson;
  }

  public async FetchGameSettings(): Promise<void>
  {
    if (this._gameSettingsRef === null)
      return;

    const responseJson = await this.GetCall('/api/gamesettings');
    if (responseJson === undefined)
      return;

    this._gameSettingsRef.value = Utilities.CopyGameSettings(responseJson);
  }

  public async SetGameSettings(): Promise<void>
  {
    if (this._gameSettingsRef === null)
      return;

    this.PutCall('/api/setgamesettings', JSON.stringify({ 'gameSettings': this._gameSettingsRef.value }));
  }

  public async StartOrRestartGame(): Promise<void>
  {
    this.PutCall('/api/startorrestartgame', '');
  }

  public async StopGame(): Promise<void>
  {
    this.PutCall('/api/stopgame', '');
  }
}
