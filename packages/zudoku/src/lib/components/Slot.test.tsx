import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  type RenderResult,
  screen,
  render as testRender,
} from "@testing-library/react";
import type { PropsWithChildren, ReactNode } from "react";
import { useEffect, useState } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { ZudokuContext } from "../core/ZudokuContext.js";
import { SlotProvider } from "./context/SlotProvider.js";
import { ZudokuProvider } from "./context/ZudokuProvider.js";
import { Slot } from "./Slot.js";

/**
 * @vitest-environment happy-dom
 */

const createWrapper = (slots: Record<string, ReactNode> = {}) => {
  const queryClient = new QueryClient();
  const context = new ZudokuContext({}, queryClient, {});

  const wrapper = ({ children }: PropsWithChildren) => (
    <MemoryRouter initialEntries={["/", "/page"]}>
      <QueryClientProvider client={queryClient}>
        <ZudokuProvider context={context}>
          <SlotProvider slots={slots}>{children}</SlotProvider>
        </ZudokuProvider>
      </QueryClientProvider>
    </MemoryRouter>
  );

  return { context, wrapper };
};

// We wrap every render function with `act` because of Suspense:
// https://github.com/testing-library/react-testing-library/issues/1375
const render = async (
  element: ReactNode,
  slots: Record<string, ReactNode> = {},
) => {
  let renderResult: unknown;
  const { wrapper } = createWrapper(slots);

  await act(async () => {
    renderResult = testRender(element, { wrapper });
  });

  return renderResult as RenderResult;
};

describe("Slot", () => {
  describe("Slot.Target", () => {
    it("renders fallback when no slot content is provided", async () => {
      await render(
        <Slot.Target
          name="footer-after"
          fallback={<div>Fallback content</div>}
        />,
      );

      expect(screen.getByText("Fallback content")).toBeInTheDocument();
    });

    it("renders nothing when no slot content and no fallback", async () => {
      const { container } = await render(<Slot.Target name="footer-after" />);
      expect(container.firstChild).toBeNull();
    });

    it("renders slot content when provided via SlotProvider", async () => {
      await render(
        <Slot.Target
          name="footer-after"
          fallback={<div>Fallback content</div>}
        />,
        { "footer-after": <div>Provider content</div> },
      );

      expect(screen.getByText("Provider content")).toBeInTheDocument();
      expect(screen.queryByText("Fallback content")).not.toBeInTheDocument();
    });
  });

  describe("Slot.Source", () => {
    it("renders content in target slot with replace type (default)", async () => {
      await render(
        <>
          <Slot.Source name="footer-after">
            <div>Source content</div>
          </Slot.Source>
          <Slot.Target
            name="footer-after"
            fallback={<div>Fallback content</div>}
          />
        </>,
      );

      expect(screen.getByText("Source content")).toBeInTheDocument();
      expect(screen.queryByText("Fallback content")).not.toBeInTheDocument();
    });

    it("renders content in target slot with explicit replace type", async () => {
      await render(
        <>
          <Slot.Source name="footer-after" type="replace">
            <div>Replace content</div>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
      );

      expect(screen.getByText("Replace content")).toBeInTheDocument();
    });

    it("prepends content when type is prepend", async () => {
      const { container } = await render(
        <>
          <Slot.Source name="footer-after" type="prepend">
            <span>Prepended</span>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
        {
          "footer-after": <span>Original</span>,
        },
      );

      expect(container.textContent).toBe("PrependedOriginal");
    });

    it("appends content when type is append", async () => {
      const { container } = await render(
        <>
          <Slot.Source name="footer-after" type="append">
            <span>Appended</span>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
        { "footer-after": <span>Original</span> },
      );

      expect(container.textContent).toBe("OriginalAppended");
    });

    it("handles multiple sources with different types in correct order", async () => {
      const { container } = await render(
        <>
          <Slot.Source name="footer-after" type="append">
            <span>Appended</span>
          </Slot.Source>
          <Slot.Source name="footer-after" type="prepend">
            <span>Prepended</span>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
        {
          "footer-after": <span>Original</span>,
        },
      );

      expect(container.textContent).toBe("PrependedOriginalAppended");
    });

    it("replaces content when multiple replace sources are provided", async () => {
      await render(
        <>
          <Slot.Source name="footer-after" type="replace">
            <span>First replace</span>
          </Slot.Source>
          <Slot.Source name="footer-after" type="replace">
            <span>Second replace</span>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
      );

      expect(screen.getByText("Second replace")).toBeInTheDocument();
      expect(screen.queryByText("First replace")).not.toBeInTheDocument();
    });

    it("cleans up slot content when component unmounts", async () => {
      const { rerender } = await render(
        <>
          <Slot.Source name="footer-after">
            <div>Source content</div>
          </Slot.Source>
          <Slot.Target
            name="footer-after"
            fallback={<div>Fallback content</div>}
          />
        </>,
      );

      expect(screen.getByText("Source content")).toBeInTheDocument();

      rerender(
        <Slot.Target
          name="footer-after"
          fallback={<div>Fallback content</div>}
        />,
      );

      expect(screen.getByText("Fallback content")).toBeInTheDocument();
      expect(screen.queryByText("Source content")).not.toBeInTheDocument();
    });

    it("handles multiple prepend sources in correct order", async () => {
      const { container } = await render(
        <>
          <Slot.Source name="footer-after" type="prepend">
            <span>First prepend</span>
          </Slot.Source>
          <Slot.Source name="footer-after" type="prepend">
            <span>Second prepend</span>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
        { "footer-after": <span>Original</span> },
      );

      expect(container.textContent).toBe("Second prependFirst prependOriginal");
    });

    it("handles multiple append sources in correct order", async () => {
      const { container } = await render(
        <>
          <Slot.Source name="footer-after" type="append">
            <span>First append</span>
          </Slot.Source>
          <Slot.Source name="footer-after" type="append">
            <span>Second append</span>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
        { "footer-after": <span>Original</span> },
      );

      expect(container.textContent).toBe("OriginalFirst appendSecond append");
    });

    it("handles empty children in Source", async () => {
      const { container } = await render(
        <>
          <Slot.Source name="footer-after">{null}</Slot.Source>
          <Slot.Target name="footer-after" fallback={<span>Fallback</span>} />
        </>,
      );

      // Empty children should be ignored, showing fallback
      expect(container.textContent).toBe("Fallback");
    });

    it("renders content when Target is defined before Source", async () => {
      await render(
        <>
          <Slot.Target name="footer-after" />
          <Slot.Source name="footer-after">
            <div>Source content</div>
          </Slot.Source>
        </>,
      );

      expect(screen.getByText("Source content")).toBeInTheDocument();
    });

    it("renders content when Source is defined before Target", async () => {
      await render(
        <>
          <Slot.Source name="footer-after">
            <div>Source content</div>
          </Slot.Source>
          <Slot.Target name="footer-after" />
        </>,
      );

      expect(screen.getByText("Source content")).toBeInTheDocument();
    });
  });

  describe("Multiple slots", () => {
    it("handles multiple independent slots", async () => {
      await render(
        <>
          <Slot.Source name="footer-before">
            <div>Content 1</div>
          </Slot.Source>
          <Slot.Source name="footer-after">
            <div>Content 2</div>
          </Slot.Source>
          <Slot.Target name="footer-before" />
          <Slot.Target name="footer-after" />
        </>,
      );

      expect(screen.getByText("Content 1")).toBeInTheDocument();
      expect(screen.getByText("Content 2")).toBeInTheDocument();
    });

    it("handles slots with same name but different targets", async () => {
      await render(
        <>
          <Slot.Source name="footer-after">
            <div>Shared content</div>
          </Slot.Source>
          <div data-testid="target-1">
            <Slot.Target name="footer-after" />
          </div>
          <div data-testid="target-2">
            <Slot.Target name="footer-after" />
          </div>
        </>,
      );

      const targets = screen.getAllByText("Shared content");
      expect(targets).toHaveLength(2);
    });

    it("handles nested slots", async () => {
      await render(
        <>
          <Slot.Source name="content-before">
            <div>
              Outer content
              <Slot.Source name="content-after">
                <div>Inner content</div>
              </Slot.Source>
            </div>
          </Slot.Source>
          <Slot.Target name="content-before" />
          <Slot.Target name="content-after" />
        </>,
      );

      expect(screen.getByText("Outer content")).toBeInTheDocument();
      expect(screen.getByText("Inner content")).toBeInTheDocument();
    });
  });

  describe("Edge cases", () => {
    it("handles deep nesting of slots", async () => {
      await render(
        <>
          <Slot.Source name="content-before">
            <div>
              Level 1
              <Slot.Source name="content-after">
                <div>
                  Level 2
                  <Slot.Source name="navigation-before">
                    <div>Level 3</div>
                  </Slot.Source>
                </div>
              </Slot.Source>
            </div>
          </Slot.Source>
          <Slot.Target name="content-before" />
          <Slot.Target name="content-after" />
          <Slot.Target name="navigation-before" />
        </>,
      );

      expect(screen.getByText("Level 1")).toBeInTheDocument();
      expect(screen.getByText("Level 2")).toBeInTheDocument();
      expect(screen.getByText("Level 3")).toBeInTheDocument();
    });

    it("handles many slots", async () => {
      const manySlots = Array.from({ length: 50 }, (_, i) => `slot-${i}`);

      await render(
        <>
          {manySlots.map((name) => (
            // biome-ignore lint/suspicious/noExplicitAny: Allow any type
            <Slot.Source key={name} name={name as any}>
              <div>Content {name}</div>
            </Slot.Source>
          ))}
          {manySlots.map((name) => (
            // biome-ignore lint/suspicious/noExplicitAny: Allow any type
            <Slot.Target key={name} name={name as any} />
          ))}
        </>,
      );

      manySlots.forEach((name) => {
        expect(screen.getByText(`Content ${name}`)).toBeInTheDocument();
      });
    });
  });

  describe("Integration cases", () => {
    it("handles updates", async () => {
      const { rerender } = await render(
        <>
          <Slot.Source name="content-before">
            <div>Initial content</div>
          </Slot.Source>
          <Slot.Target name="content-before" />
        </>,
      );

      expect(screen.getByText("Initial content")).toBeInTheDocument();

      rerender(
        <>
          <Slot.Source name="content-before">
            <div>Updated content</div>
          </Slot.Source>
          <Slot.Target name="content-before" />
        </>,
      );

      expect(screen.getByText("Updated content")).toBeInTheDocument();
    });

    it("handles async content", async () => {
      vi.useFakeTimers();

      const AsyncContent = () => {
        const [content, setContent] = useState("Loading...");

        useEffect(() => {
          setTimeout(() => setContent("Loaded content"), 250);
        }, []);

        return <div>{content}</div>;
      };

      await render(
        <>
          <Slot.Source name="content-before">
            <AsyncContent />
          </Slot.Source>
          <Slot.Target name="content-before" />
        </>,
      );

      expect(screen.getByText("Loading...")).toBeInTheDocument();

      await act(async () => {
        vi.advanceTimersToNextTimer();
      });

      expect(screen.getByText("Loaded content")).toBeInTheDocument();

      vi.useRealTimers();
    });

    it("renders render functions", async () => {
      await render(
        <>
          <Slot.Source name="content-before">
            {(props) => `Current path: ${props.location.pathname}`}
          </Slot.Source>
          <Slot.Target name="content-before" />
        </>,
        {},
      );

      expect(screen.getByText("Current path: /page")).toBeInTheDocument();
    });
  });
});
