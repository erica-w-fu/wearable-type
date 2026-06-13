import { createContext, useContext } from 'react';

/** Called when the user turns a grid letter (horizontal drag reaches cw/ccw). */
export const GridTurnContext = createContext<(() => void) | null>(null);

export function useGridTurnDismiss() {
  return useContext(GridTurnContext);
}
