import express, { Express, Request, Response } from 'express';

import { Utilities, GameState, GameSettings } from '../../common';

import * as Actions from './Actions';
import * as AI from './AI';

const getSuccess = 200; // OK
const putSuccessNoContent = 204; // No Content
const failure = 400; // Bad Request

const defaultResponse = 'joukkuekuoppa server default response';
const invalidRequestBody = 'invalid request body';
const notAcceptedByAPI = 'request not accepted by API';

const port = 3001;
const aiInterval = 1000;

let gameState = new GameState();
let gameSettings = new GameSettings();

function ValidateRequest(req: Request, res: Response): boolean
{
  if (req.body !== undefined)
    return true;

  res.status(failure).send(invalidRequestBody);
  return false;
}

function ProcessGet(handler: (req: Request) => any): (req: Request, res: Response) => void
{
  return (req: Request, res: Response) =>
  {
    if (!ValidateRequest(req, res))
      return;

    // operate
    const result = handler(req);

    // define response
    res.status(getSuccess).json(result);
  };
}

function ProcessPut(handler: (req: Request) => boolean): (req: Request, res: Response) => void
{
  return (req: Request, res: Response) =>
  {
    if (!ValidateRequest(req, res))
      return;

    // operate
    const success = handler(req);

    // define response
    if (success)
      res.status(putSuccessNoContent).send();
    else
      res.status(failure).send(notAcceptedByAPI);
  };
}

async function StartServer()
{
  const app: Express = express();
  app.use(express.json());

  app.get('/', ProcessGet((req: Request) => { return defaultResponse; }));

  app.get('/api/gamerunningstatus', ProcessGet((req: Request) => { return Actions.GetGameRunningStatus(gameState); }));

  app.get('/api/gamestate/:playerID', ProcessGet((req: Request) => { return Actions.GetGameState(gameState, gameSettings, Number(req.params.playerID)); }));

  app.get('/api/gamesettings', ProcessGet((req: Request) => { return gameSettings; }));

  app.put('/api/play', ProcessPut((req: Request) => { return Actions.PlayCards(gameState, req.body.playerID, Utilities.CopyCards(req.body.cards)); }));

  app.put('/api/pass', ProcessPut((req: Request) => { return Actions.PassTurn(gameState, req.body.playerID); }));

  app.put('/api/deal', ProcessPut((req: Request) => { return Actions.DealCards(gameState, req.body.playerID); }));

  app.put('/api/handovergive', ProcessPut((req: Request) => { return Actions.GiveHandoverCard(gameState, req.body.playerID, Utilities.CopyCard(req.body.card)); }));

  app.put('/api/handoverreceive', ProcessPut((req: Request) => { return Actions.ReceiveHandoverCard(gameState, req.body.playerID, req.body.isFirstCard); }));

  app.put('/api/startorrestartgame', ProcessPut((req: Request) => { Actions.InitializeGameState(gameState); return true; }));

  app.put('/api/stopgame', ProcessPut((req: Request) => { gameState = new GameState(); return true; }));

  app.put('/api/setgamesettings', ProcessPut((req: Request) => { gameSettings = Utilities.CopyGameSettings(req.body.gameSettings); return true; }));

  app.listen(port, () => { console.log(`listening ${port}`); });

  setInterval(function () { AI.RunAI(gameState, gameSettings); }, aiInterval);
}

StartServer();
