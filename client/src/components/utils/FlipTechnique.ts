// simple "FLIP technique" implementation
// for more info, see: https://css-tricks.com/animating-layouts-with-the-flip-technique/

const transitionEndEvent = 'transitionend';
const nearInstantTransform = 'transform 0.001s';
const easedTransform = 'transform 0.5s ease-in-out';

const FlipElementIdentifier = 'flipElement';
const FlipIDIdentifier = 'flipID';

const otherHandsIdentifier = 'otherhands';

let currentlyDraggedFlipElementID: number = -1;

export function DragStart(evt: any): void
{
  // @note: evt.target cannot be used here, because e.g. in case of a ul containing li elements with flip ids,
  // 'target' refers to the ul element whereas 'item' refers to the li.
  // Then again, Event or DragEvent type does not have 'item', so 'any' type is used in lieu of finding the exact type used in input.
  const element = evt.item;
  if (element === null || !(element instanceof HTMLElement))
    return;

  const id = element.getAttribute(FlipIDIdentifier);
  currentlyDraggedFlipElementID = (id !== null) ? Number(id) : -1;
}

export function DragEnd(evt: Event): void
{
  currentlyDraggedFlipElementID = -1;
}

class FlipInfo
{
  readonly element: HTMLElement;
  readonly id: string;
  readonly x: number;
  readonly y: number;

  constructor(element_: HTMLElement, id_ : string, x_ : number, y_ : number)
  {
    this.element = element_;
    this.id = id_;
    this.x = x_;
    this.y = y_;
  }
}

export function CollectFlipData(): FlipInfo[]
{
  const flipData: FlipInfo[] = [];

  const flipElements = document.querySelectorAll<HTMLElement>('.' + FlipElementIdentifier);
  for (const element of flipElements)
  {
    const elementID = element.getAttribute(FlipIDIdentifier) ?? '';
    if (elementID === '')
      continue;

    const rect = element.getBoundingClientRect();

    flipData.push(new FlipInfo(element, elementID, rect.left + rect.width / 2, rect.top + rect.height / 2));
  }

  return flipData;
}

export function ApplyFlipTechnique(storedFlipData : FlipInfo[]): void
{
  const currentFlipData: FlipInfo[] = CollectFlipData();

  for (const flipDataElement of currentFlipData)
  {
    const element = flipDataElement.element;
    const elementID = element.getAttribute(FlipIDIdentifier) ?? '';
    if (elementID === '')
      continue;

    // special case: prevent flipping elements that are currently being dragged
    if (Number(elementID) === currentlyDraggedFlipElementID)
      continue;

    // special case: prevent flipping elements of other players' hands
    // (This is prevented because other players' hands are rotated, and the rotation is currently not taken into account in flipping.)
    // @note: It might not make sense to make special case handling for rotations, instead, if all the cards would just
    // get a universal transform, the flipping technique could be applied to them without any special handling.
    if (element.classList.contains(otherHandsIdentifier))
      continue;

    const foundElement = storedFlipData.find((storedElement: FlipInfo) =>
    {
      return (storedElement.id === elementID && ((storedElement.x !== flipDataElement.x) || (storedElement.y !== flipDataElement.y)));
    });

    if (foundElement === undefined)
      continue;

    // flip step 1: instantly transform element to old location, and set a callback for next step

    const moveX = foundElement.x - flipDataElement.x;
    const moveY = foundElement.y - flipDataElement.y;

    element.addEventListener(transitionEndEvent, FlipCallbackPhase1);
    // @todo: This transition should really be instant, however currently a near-instant transition is used to catch
    // the end of the transition in a callback. Find out how to catch the end of an immediate transition.
    element.style.transition = nearInstantTransform;
    element.style.transform = 'translate(' + moveX + 'px, ' + moveY + 'px)';
  }
}

function FlipCallbackPhase1(evt: Event): void
{
  const element = evt.target;
  if (element === null || !(element instanceof HTMLElement))
    return;

  // flip step 2: add an eased transform transition and remove previously set transform, switch callback to next step

  element.style.transition = easedTransform;
  element.style.transform = '';
  element.removeEventListener(transitionEndEvent, FlipCallbackPhase1);
  element.addEventListener(transitionEndEvent, FlipCallbackPhase2);
}

function FlipCallbackPhase2(evt: Event): void
{
  const element = evt.target;
  if (element === null || !(element instanceof HTMLElement))
    return;

  // flip step 3: cleanup, remove transform transition and callback

  element.style.transition = '';
  element.removeEventListener(transitionEndEvent, FlipCallbackPhase2);
}
