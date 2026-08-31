import { useCallback, useEffect, useRef, useState } from 'react';

// The app is one document, so the browser's back button only knows about entries we put
// in the history ourselves. This hook keeps a stack of views next to the browser's own,
// stamping each entry with its depth so a popstate says which view it landed on: back
// out of a detail returns to the screen underneath it instead of leaving the app.

const KEY = 'ctNav';

interface Entry {
  /** Which run of the app wrote this entry — a reload leaves the old ones behind. */
  run: string;
  /** Position in the app's stack: 0 is the root view. */
  depth: number;
}

function entryOf(state: unknown): Entry | undefined {
  const entry = (state as Record<string, unknown> | null)?.[KEY] as Entry | undefined;
  return entry && typeof entry.depth === 'number' && typeof entry.run === 'string' ? entry : undefined;
}

export interface NavStack<V> {
  view: V;
  /** Opens a view over the current one — browser back returns to what it covered. */
  push: (view: V) => void;
  /** Swaps the current view without deepening the stack: a step inside one flow. */
  replace: (view: V) => void;
  /** What an in-app back button calls, so the browser's history stays in step. */
  back: () => void;
  /** Ends a flow: unwinds every entry the app pushed and lands back on the root view. */
  resetToRoot: () => void;
}

export function useNavStack<V>(root: V, isTrapped: (view: V) => boolean): NavStack<V> {
  // The stack is held in a ref because the popstate listener reads it outside React's
  // render cycle; `view` is the render-visible copy of whatever the ref points at.
  const nav = useRef<{ stack: V[]; index: number }>({ stack: [root], index: 0 });
  const [view, setView] = useState<V>(root);
  const show = useCallback(() => setView(nav.current.stack[nav.current.index]), []);

  // Named when the app mounts rather than during render: an id that changed under a
  // re-render would orphan the entries already stamped with the old one.
  const run = useRef<string>('');
  const stamp = useCallback((depth: number): { [KEY]: Entry } => ({ [KEY]: { run: run.current, depth } }), []);

  const trapped = useRef(isTrapped);
  useEffect(() => {
    trapped.current = isTrapped;
  }, [isTrapped]);

  // Set when the app itself asked the browser to unwind, so the popstate that follows
  // isn't read as a user pressing back.
  const unwinding = useRef(false);

  // However the app was opened — cold, or reloaded onto an entry a previous run had
  // stamped as a detail — it starts at the root, so the entry it starts on says so.
  useEffect(() => {
    run.current ||= Math.random().toString(36).slice(2);
    window.history.replaceState({ ...(window.history.state as object | null), ...stamp(0) }, '');
  }, [stamp]);

  useEffect(() => {
    const onPop = (event: PopStateEvent) => {
      if (unwinding.current) {
        unwinding.current = false;
        return;
      }
      const { stack, index } = nav.current;
      if (trapped.current(stack[index])) {
        // Nothing in the app leaves this view except finishing it, so put the entry the
        // browser just dropped back on and stay where we are.
        window.history.pushState(stamp(index), '');
        return;
      }
      const landed = entryOf(event.state);
      if (!landed || landed.run !== run.current) {
        // An entry from before this run of the app — a reload leaves its stack behind.
        // There is no view here to restore, so keep going the way the user asked; if
        // there is nothing left below, the browser stops and we stay put.
        window.history.back();
        return;
      }
      nav.current = { stack, index: Math.min(landed.depth, stack.length - 1) };
      show();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [show, stamp]);

  const push = useCallback(
    (next: V) => {
      const { stack, index } = nav.current;
      // A new view drops whatever the browser could still have gone forward to.
      nav.current = { stack: [...stack.slice(0, index + 1), next], index: index + 1 };
      window.history.pushState(stamp(index + 1), '');
      show();
    },
    [show, stamp],
  );

  const replace = useCallback(
    (next: V) => {
      const { stack, index } = nav.current;
      const swapped = stack.slice(0, index + 1);
      swapped[index] = next;
      nav.current = { stack: swapped, index };
      window.history.replaceState(stamp(index), '');
      show();
    },
    [show, stamp],
  );

  const back = useCallback(() => {
    window.history.back();
  }, []);

  const resetToRoot = useCallback(() => {
    const { index } = nav.current;
    nav.current = { stack: [root], index: 0 };
    show();
    if (index > 0) {
      unwinding.current = true;
      window.history.go(-index);
    } else {
      window.history.replaceState(stamp(0), '');
    }
  }, [root, show, stamp]);

  return { view, push, replace, back, resetToRoot };
}
