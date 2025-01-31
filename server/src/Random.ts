import { C } from '../../common';

// @note: this file contains all random generation utilization, so that the specific random generator can be picked here

export function PickDealer(): number
{
  return Math.floor(Math.random() * C.players);
}

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
export function ShuffleNumberArray(array : number[]): void
{
  for (let i = array.length - 1; i > 0; i--)
  {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
}
