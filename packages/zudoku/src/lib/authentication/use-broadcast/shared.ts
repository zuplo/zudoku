// https://github.com/Romainlg29/use-broadcast/

import { StateCreator, StoreMutatorIdentifier } from "zustand";

export type SharedOptions = {
  /**
   * The name of the broadcast channel
   * It must be unique
   */
  name?: string;

  /**
   * Main timeout
   * If the main tab / window doesn't respond in this time, this tab / window will become the main
   * @default 100 ms
   */
  mainTimeout?: number;

  /**
   * If true, the store will only synchronize once with the main tab. After that, the store will be unsynchronized.
   * @default false
   */
  unsync?: boolean;

  /**
   * Callback when this tab / window becomes the main tab / window
   * Triggered only in the main tab / window
   */
  onBecomeMain?: (id: number) => void;

  /**
   * Callback when a new tab is opened / closed
   * Triggered only in the main tab / window
   */
  onTabsChange?: (ids: number[]) => void;
};

/**
 * The Shared type
 */
export type Shared = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  options?: SharedOptions,
) => StateCreator<T, Mps, Mcs>;

/**
 * Type implementation of the Shared function
 */
type SharedImpl = <T>(
  f: StateCreator<T, [], []>,
  options?: SharedOptions,
) => StateCreator<T, [], []>;

/**
 * Shared implementation
 * @param f Zustand state creator
 * @param options The options
 */
const sharedImpl: SharedImpl = (f, options) => (set, get, store) => {
  /**
   * The broadcast channel is not supported in SSR
   */
  if (
    typeof window === "undefined" &&
    !(
      typeof WorkerGlobalScope !== "undefined" &&
      self instanceof WorkerGlobalScope
    )
  ) {
    // eslint-disable-next-line no-console
    console.warn(
      "BroadcastChannel is not supported in this environment. The store will not be shared.",
    );
    return f(set, get, store);
  }

  /**
   * If BroadcastChannel is not supported, return the basic store
   */
  if (typeof BroadcastChannel === "undefined") {
    // eslint-disable-next-line no-console
    console.warn(
      "BroadcastChannel is not supported in this browser. The store will not be shared.",
    );
    return f(set, get, store);
  }

  /**
   * Types
   */
  type Item = { [key: string]: unknown };
  type Message =
    | {
        action: "sync";
      }
    | {
        action: "change";
        state: Item;
      }
    | {
        action: "add_new_tab";
        id: number;
      }
    | {
        action: "close";
        id: number;
      }
    | {
        action: "change_main";
        id: number;
        tabs: number[];
      };

  /**
   * Is the store synced with the other tabs
   */
  let isSynced = get() !== undefined;

  /**
   * Is this tab / window the main tab / window
   * When a new tab / window is opened, it will be synced with the main
   */
  let isMain = false;

  /**
   * The broadcast channel name
   */
  const name = options?.name ?? f.toString();

  /**
   * The id of the tab / window
   */
  let id = 0;

  /**
   * Store a list of all the tabs / windows
   * Only for the main tab / window
   */
  const tabs: number[] = [0];

  /**
   * Create the broadcast channel
   */
  const channel = new BroadcastChannel(name);

  /**
   * Handle the Zustand set function
   * Trigger a postMessage to all the other tabs
   */
  const onSet: typeof set = (...args) => {
    /**
     * Get the previous states
     */
    const previous = get() as Item;

    /**
     * Update the states
     */
    set(...(args as Parameters<typeof set>));

    /**
     * If the stores should not be synced, return.
     */
    if (options?.unsync) {
      return;
    }

    /**
     * Get the fresh states
     */
    const updated = get() as Item;

    /**
     * Get the states that changed
     */
    const state = Object.entries(updated).reduce((obj, [key, val]) => {
      if (previous[key] !== val) {
        obj = { ...obj, [key]: val };
      }
      return obj;
    }, {} as Item);

    /**
     * Send the states to all the other tabs
     */
    channel.postMessage({ action: "change", state } as Message);
  };

  /**
   * Subscribe to the broadcast channel
   */
  channel.onmessage = (e) => {
    if ((e.data as Message).action === "sync") {
      /**
       * If this tab / window is not the main, return
       */
      if (!isMain) {
        return;
      }

      /**
       * Remove all the functions and symbols from the store
       */
      const state = Object.entries(get() as Item).reduce((obj, [key, val]) => {
        if (typeof val !== "function" && typeof val !== "symbol") {
          obj = { ...obj, [key]: val };
        }
        return obj;
      }, {});

      /**
       * Send the state to the other tabs
       */
      channel.postMessage({ action: "change", state } as Message);

      /**
       * Set the new tab / window id
       */
      const new_id = tabs[tabs.length - 1]! + 1;
      tabs.push(new_id);

      options?.onTabsChange?.(tabs);

      channel.postMessage({ action: "add_new_tab", id: new_id } as Message);

      return;
    }

    /**
     * Set an id for the tab / window if it doesn't have one
     */
    if ((e.data as Message).action === "add_new_tab" && !isMain && id === 0) {
      id = e.data.id;
      return;
    }

    /**
     * On receiving a new state, update the state
     */
    if ((e.data as Message).action === "change") {
      /**
       * Update the state
       */
      set(e.data.state);

      /**
       * Set the synced attribute
       */
      isSynced = true;
    }

    /**
     * On receiving a close message, remove the tab / window id from the list
     */
    if ((e.data as Message).action === "close") {
      if (!isMain) {
        return;
      }

      const index = tabs.indexOf(e.data.id);
      if (index !== -1) {
        tabs.splice(index, 1);

        options?.onTabsChange?.(tabs);
      }
    }

    /**
     * On receiving a change_main message, change the main tab / window
     */
    if ((e.data as Message).action === "change_main") {
      if (e.data.id === id) {
        isMain = true;
        tabs.splice(0, tabs.length, ...e.data.tabs);

        options?.onBecomeMain?.(id);
      }
    }
  };

  /**
   * Synchronize with the main tab
   */
  const synchronize = (): void => {
    channel.postMessage({ action: "sync" } as Message);

    /**
     * If isSynced is false after 100ms, this tab is the main tab
     */
    setTimeout(() => {
      if (!isSynced) {
        isMain = true;
        isSynced = true;

        options?.onBecomeMain?.(id);
      }
    }, options?.mainTimeout ?? 100);
  };

  /**
   * Handle case when the tab / window is closed
   */
  const onClose = (): void => {
    channel.postMessage({ action: "close", id } as Message);

    /**
     * If we're closing the main, make the second the new main
     */
    if (isMain) {
      /**
       * If there is only one tab left, close the channel and return
       */
      if (tabs.length === 1) {
        /**
         * Clean up
         */
        channel.close();
        return;
      }

      const remaining_tabs = tabs.filter((tab) => tab !== id);
      channel.postMessage({
        action: "change_main",
        id: remaining_tabs[0],
        tabs: remaining_tabs,
      } as Message);

      return;
    }
  };

  /**
   * Add close event listener
   */
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", onClose);
  }

  /**
   * Synchronize with the main tab
   */
  if (!isSynced) {
    synchronize();
  }

  /**
   * Modify and return the Zustand store
   */
  store.setState = onSet;

  return f(onSet, get, store);
};

/**
 * Shared middleware
 *
 * @example
 * import { create } from 'zustand';
 * import { shared } from 'use-broadcast-ts';
 *
 * const useStore = create(
 *      shared(
 *          (set) => ({ count: 0 }),
 *          { name: 'my-store' }
 *      )
 * );
 */
export const shared = sharedImpl as Shared;
