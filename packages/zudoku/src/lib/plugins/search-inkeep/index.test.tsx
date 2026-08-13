/**
 * @vitest-environment happy-dom
 */

import type { InkeepJS } from "@inkeep/cxkit-types";
import { QueryClient } from "@tanstack/react-query";
import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ZudokuProvider } from "../../components/context/ZudokuProvider.js";
import { Search } from "../../components/Search.js";
import { ZudokuContext } from "../../core/ZudokuContext.js";
import { inkeepSearchPlugin, type InkeepSearchPluginOptions } from "./index.js";

type ModalSettings = {
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
  shortcutKey?: string | null;
};

/**
 * Minimal stand-in for `@inkeep/cxkit-js`, mirroring the behavior of the real
 * widget that the plugin has to cooperate with:
 *
 * - the shortcut is bound on `document` and calls `stopPropagation()`, so it
 *   runs before (and can swallow) anything bound on `window`
 * - open state goes through Radix' `useControllableState`, so once
 *   `modalSettings.isOpen` is passed the widget can no longer open or close
 *   itself, it can only report the request via `onOpenChange`
 * - `update()` deep merges into the props it was mounted with
 */
const createInkeepMock = () => {
  const instances: Array<{
    isOpen: () => boolean;
    modalSettings: () => ModalSettings;
    unmount: () => void;
  }> = [];

  const ModalSearchAndChat = (props: { modalSettings?: ModalSettings }) => {
    let currentProps = props;
    let uncontrolledOpen = false;

    const modalSettings = () => currentProps.modalSettings ?? {};
    const isOpen = () => modalSettings().isOpen ?? uncontrolledOpen;

    const setOpen = (nextOpen: boolean) => {
      const controlledOpen = modalSettings().isOpen;
      if (controlledOpen === undefined) {
        uncontrolledOpen = nextOpen;
        modalSettings().onOpenChange?.(nextOpen);
        return;
      }
      if (nextOpen !== controlledOpen) modalSettings().onOpenChange?.(nextOpen);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      const { shortcutKey } = modalSettings();
      if (
        shortcutKey &&
        (event.metaKey || event.ctrlKey) &&
        event.key.toLowerCase() === shortcutKey.toLowerCase()
      ) {
        event.preventDefault();
        event.stopPropagation();
        setOpen(true);
      }
      if (event.key === "Escape" && isOpen()) {
        event.preventDefault();
        setOpen(false);
      }
    };

    document.addEventListener("keydown", onKeyDown);

    const instance = {
      isOpen,
      modalSettings,
      update: (nextProps: { modalSettings?: ModalSettings }) => {
        currentProps = {
          ...currentProps,
          ...nextProps,
          modalSettings: {
            ...currentProps.modalSettings,
            ...nextProps.modalSettings,
          },
        };
      },
      unmount: () => document.removeEventListener("keydown", onKeyDown),
      remount: () => document.addEventListener("keydown", onKeyDown),
    };

    instances.push(instance);

    return instance;
  };

  return { instances, ModalSearchAndChat };
};

let inkeep: ReturnType<typeof createInkeepMock>;

const renderSearch = async (
  options: Partial<InkeepSearchPluginOptions> = {},
) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext(
    {
      plugins: [
        inkeepSearchPlugin({ primaryBrandColor: "#26D6FF", ...options }),
      ],
    },
    queryClient,
    {},
  );

  await act(async () => {
    render(
      <ZudokuProvider context={context}>
        <Search />
      </ZudokuProvider>,
    );
  });

  return inkeep.instances;
};

const pressKey = async (key: string, modifiers: KeyboardEventInit = {}) => {
  await act(async () => {
    document.body.dispatchEvent(
      new KeyboardEvent("keydown", {
        key,
        bubbles: true,
        cancelable: true,
        ...modifiers,
      }),
    );
  });
};

beforeEach(() => {
  inkeep = createInkeepMock();
  window.Inkeep = {
    ModalSearchAndChat: inkeep.ModalSearchAndChat,
  } as unknown as InkeepJS;
});

afterEach(() => {
  for (const instance of inkeep.instances) instance.unmount();
  window.Inkeep = undefined;
});

describe("inkeepSearchPlugin", () => {
  it("opens the modal on ⌘K", async () => {
    const [instance] = await renderSearch();

    expect(instance?.isOpen()).toBe(false);

    await pressKey("k", { metaKey: true });

    expect(instance?.isOpen()).toBe(true);
  });

  it("opens the modal on Ctrl+K", async () => {
    const [instance] = await renderSearch();

    await pressKey("k", { ctrlKey: true });

    expect(instance?.isOpen()).toBe(true);
  });

  it("disables Inkeep's own shortcut so it cannot swallow the event", async () => {
    const [instance] = await renderSearch();

    expect(instance?.modalSettings().shortcutKey).toBeNull();
  });

  it("opens the modal when the search button is clicked", async () => {
    const [instance] = await renderSearch();

    await act(async () => {
      screen.getByRole("button", { name: /search/i }).click();
    });

    expect(instance?.isOpen()).toBe(true);
  });

  it("closes the modal when Inkeep reports it was closed", async () => {
    const [instance] = await renderSearch();

    await pressKey("k", { metaKey: true });
    expect(instance?.isOpen()).toBe(true);

    // Handled by Inkeep itself, it only reports back through `onOpenChange`
    await pressKey("Escape");

    expect(instance?.isOpen()).toBe(false);
  });

  it("reopens the modal after it was closed", async () => {
    const [instance] = await renderSearch();

    await pressKey("k", { metaKey: true });
    await pressKey("Escape");
    await pressKey("k", { metaKey: true });

    expect(instance?.isOpen()).toBe(true);
  });

  it("honors a configured shortcut key", async () => {
    const [instance] = await renderSearch({
      modalSettings: { shortcutKey: "j" },
    });

    expect(instance?.modalSettings().shortcutKey).toBe("j");

    await pressKey("j", { metaKey: true });

    expect(instance?.isOpen()).toBe(true);
  });

  it("forwards Inkeep initiated changes to a user supplied onOpenChange", async () => {
    const changes: boolean[] = [];
    await renderSearch({
      modalSettings: { onOpenChange: (isOpen) => changes.push(isOpen) },
    });

    await pressKey("k", { metaKey: true });
    await pressKey("Escape");

    expect(changes).toEqual([false]);
  });

  it("mounts a single widget across re-renders", async () => {
    const instances = await renderSearch();

    // Opening and closing re-renders the component; mounting a widget per
    // render would leave stray modals listening for keyboard events
    await act(async () => {
      screen.getByRole("button", { name: /search/i }).click();
    });
    await pressKey("Escape");
    await pressKey("k", { metaKey: true });

    expect(instances).toHaveLength(1);
  });
});
