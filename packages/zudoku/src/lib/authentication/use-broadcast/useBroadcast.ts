// https://github.com/Romainlg29/use-broadcast/
import { useEffect, useRef, useState } from "react";

/**
 * Our hook will return an object with three properties:
 * - send: a function that will send a message to all other tabs
 * - state: the current state of the broadcast
 * - subscribe: a function that will subscribe to the broadcast (Only if options.subscribe is true)
 */
export type UseBroadcastReturn<T> = {
  send: (val: T) => void;
  state: T | undefined;
  subscribe: (callback: (e: T) => void) => () => void;
};

/**
 * The options for the useBroadcast hook
 */
export type UseBroadcastOptions = {
  subscribe?: boolean;
};

/**
 *
 * @param name The name of the broadcast channel
 * @param val The initial value of the broadcast
 * @returns Returns an object with three properties: send, state and subscribe
 */
export const useBroadcast = <T>(
  name: string,
  val?: T,
  options?: UseBroadcastOptions,
): UseBroadcastReturn<T> => {
  /**
   * Store the state of the broadcast
   */
  const [state, setState] = useState<T | undefined>(val);

  /**
   * Store the BroadcastChannel instance
   */
  const channel = useRef<BroadcastChannel | null>(null);

  /**
   * Store the listeners
   */
  const listeners = useRef<((e: T) => void)[]>([]);

  /**
   * This function send the value to all the other tabs
   * @param val The value to send
   */
  const send = (val: T) => {
    if (!channel.current) {
      return;
    }

    /**
     * Send the value to all the other tabs
     */
    channel.current.postMessage(val);

    if (!options?.subscribe) {
      setState(val);
    }

    /**
     * Dispatch the event to the listeners
     */
    listeners.current.forEach((listener) => listener(val));
  };

  /**
   * This function subscribe to the broadcast
   * @param callback The callback function
   * @returns Returns a function that unsubscribe the callback
   */
  const subscribe = (callback: (e: T) => void) => {
    /**
     * Add the callback to the listeners
     */
    listeners.current.push(callback);

    /**
     * Return a function that unsubscribe the callback
     */
    return () =>
      listeners.current.splice(listeners.current.indexOf(callback), 1);
  };

  useEffect(() => {
    /**
     * If BroadcastChannel is not supported, we log an error and return
     */
    if (typeof window === "undefined") {
      // eslint-disable-next-line no-console
      console.error("Window is undefined!");
      return;
    }

    if (!window.BroadcastChannel) {
      // eslint-disable-next-line no-console
      console.error("BroadcastChannel is not supported!");
      return;
    }

    /**
     * If the channel is null, we create a new one
     */
    if (!channel.current) {
      channel.current = new BroadcastChannel(name);
    }

    /**
     * Subscribe to the message event
     * @param e The message event
     */
    channel.current.onmessage = (e) => {
      /**
       * Update the state
       */
      if (!options?.subscribe) {
        setState(e.data);
      }

      /**
       * Dispatch an event to the listeners
       */
      listeners.current.forEach((listener) => listener(e.data));
    };

    /**
     * Cleanup
     */
    return () => {
      if (!channel.current) {
        return;
      }

      channel.current.close();
      channel.current = null;
    };
  }, [name, options]);

  return { send, state, subscribe };
};
