import * as C from './Constants';

export class Card
{
  // The card has two identifiers:
  // a) 'identifier' is unique (per draw of the deck), but does not identify which suit or value the card has.
  //    It can be used e.g. to track the card in the UI.
  // b) 'index' identifies the suit and value.
  // 'realIndexForWildCard' is used when an actual card is selected for a wild card.
  private _identifier: number;
  private _faceUp: boolean;
  private _index: number;
  private _realIndexForWildCard: number;

  public get identifier(): number { return this._identifier; }

  constructor()
  {
    this._identifier = C.unspecified;
    this._faceUp = false;
    this._index = C.unspecified;
    this._realIndexForWildCard = C.unspecified;
  }

  // @todo: Only CreateFaceDown and CreateFaceUp are really needed.
  // Is there a way to avoid duplicating constructing code? It seems that there is no constructor overloading available ...

  static CreateFaceDown(identifier?: number): Card
  {
    const card = new Card();
    card._identifier = identifier ?? C.unspecified;
    card._faceUp = false;
    card._index = C.unspecified;
    card._realIndexForWildCard = C.unspecified;
    return card;
  }

  static CreateFaceUp(index: number, identifier?: number): Card
  {
    const card = new Card();
    card._identifier = identifier ?? C.unspecified;
    card._faceUp = true;
    card._index = index;
    card._realIndexForWildCard = C.unspecified;
    return card;
  }

  static AreSame(card1: Card, card2: Card) { return (card1.IsSpecified() && (card1._index === card2._index)); }

  public IsSpecified(): boolean { return (this._index !== C.unspecified); }
  public IsFaceUp(): boolean { return this._faceUp; }
  public IsRedJoker(): boolean { return (this._index === C.redJokerIndex); }
  public IsBlackJoker(): boolean { return (this._index === C.blackJokerIndex); }
  public GetSuit(): number { return ((this._index >= 0) && (this._index < C.suitedDeckSize)) ? (Math.floor(this._index / C.valuesPerSuit) + 1) : C.unspecified; }
  public GetFaceValue(): number { return ((this._index >= 0) && (this._index < C.suitedDeckSize)) ? ((this._index % C.valuesPerSuit) + 1) : C.unspecified; }

  // @todo: simplify, consider giving selection on creation removing the need for a setter
  public GetWildCardSelection(): Card | null { return (this._realIndexForWildCard === C.unspecified) ? null : Card.CreateFaceUp(this._realIndexForWildCard); }
  public SetWildCardSelection(selection: Card) { this._realIndexForWildCard = selection._index; }
}

// utility method for e.g. testing
export function StringToCard(str: string): Card
{
  const isRedJoker = (str.charAt(0) === 'j') && (str.charAt(1) === '1');
  const isBlackJoker = (str.charAt(0) === 'j') && (str.charAt(1) === '2');
  const isTwo = (str.charAt(0) !== 'j') && (str.charAt(1) === '2');

  const suitChar = str.charAt(0);
  const suit = (suitChar === 's') ? 0 : (suitChar === 'c') ? 1 : (suitChar === 'd') ? 2 : (suitChar === 'h') ? 3 : -1;
  const faceValue = isTwo ? 2 : Number(str.substring(1, str.length));

  const card: Card = Card.CreateFaceUp(isRedJoker ? 52 : isBlackJoker ? 53 : suit * 13 + (faceValue - 1));

  if (isRedJoker || isBlackJoker || isTwo)
  {
    const selected = str.substring(2, str.length);
    if (selected.length > 0)
      card.SetWildCardSelection(StringToCard(selected));
  }

  return card;
}
