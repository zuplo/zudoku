/**
 * @vitest-environment happy-dom
 */

import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ViewportAnchorProvider } from "../components/context/ViewportAnchorContext.js";
import { Stepper } from "./Stepper.js";

const calls = { observed: [] as Element[], unobserved: [] as Element[] };

class MockIntersectionObserver {
  observe(element: Element) {
    calls.observed.push(element);
  }
  unobserve(element: Element) {
    calls.unobserved.push(element);
  }
  disconnect() {}
  takeRecords() {
    return [];
  }
}

vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);

const ids = (elements: Element[]) => elements.map((element) => element.id);

const renderStepper = (children: ReactNode) =>
  render(<ViewportAnchorProvider>{children}</ViewportAnchorProvider>);

beforeEach(() => {
  calls.observed = [];
  calls.unobserved = [];
});

describe("Stepper anchor registration", () => {
  it("observes the anchors the toc plugin marks on each step", () => {
    renderStepper(
      <Stepper>
        <ol>
          {/* Loose step: the anchor sits on the title paragraph, because the
              step itself is too tall for the viewport observer to activate. */}
          <li>
            <p id="collect-the-records" data-toc-anchor="">
              Collect the Records
            </p>
            <pre>cosmocargo cargo list</pre>
          </li>
          {/* Tight step: inline-only, so the anchor sits on the item. */}
          <li id="book-your-shipment" data-toc-anchor="">
            Book Your Shipment
          </li>
        </ol>
      </Stepper>,
    );

    expect(ids(calls.observed)).toEqual([
      "collect-the-records",
      "book-your-shipment",
    ]);
  });

  it("observes nothing when the steps carry no anchors", () => {
    renderStepper(
      <Stepper toc={false}>
        <ol>
          <li>
            <p>Find the reason code</p>
          </li>
          <li>Look up the code</li>
        </ol>
      </Stepper>,
    );

    expect(calls.observed).toEqual([]);
  });

  it("leaves steps too deep for the toc untracked, but still linkable", () => {
    renderStepper(
      <Stepper>
        <ol>
          <li>
            <p id="open-the-amendment-window">Open the Amendment Window</p>
          </li>
          <li id="submit-the-delta">Submit the Delta</li>
        </ol>
      </Stepper>,
    );

    expect(calls.observed).toEqual([]);
  });

  it("ignores ids inside a step body, which register themselves", () => {
    renderStepper(
      <Stepper>
        <ol>
          <li>
            <p id="prepare-your-cargo" data-toc-anchor="">
              Prepare Your Cargo
            </p>
            <h3 id="a-heading-in-the-body">Buried heading</h3>
            <p id="a-later-paragraph">More body copy</p>
          </li>
        </ol>
      </Stepper>,
    );

    expect(ids(calls.observed)).toEqual(["prepare-your-cargo"]);
  });

  it("ignores items of a list nested inside a step", () => {
    renderStepper(
      <Stepper>
        <ol>
          <li>
            <p id="plot-a-warp-lane" data-toc-anchor="">
              Plot a Warp Lane
            </p>
            <ol>
              <li id="not-a-step" data-toc-anchor="">
                A nested item
              </li>
            </ol>
          </li>
        </ol>
      </Stepper>,
    );

    expect(ids(calls.observed)).toEqual(["plot-a-warp-lane"]);
  });

  it("stops observing its steps when unmounted", () => {
    const { unmount } = renderStepper(
      <Stepper>
        <ol>
          <li>
            <p id="seal-the-manifest" data-toc-anchor="">
              Seal the Manifest
            </p>
          </li>
          <li id="launch-and-track" data-toc-anchor="">
            Launch and Track
          </li>
        </ol>
      </Stepper>,
    );

    expect(calls.unobserved).toEqual([]);

    unmount();

    expect(ids(calls.unobserved)).toEqual([
      "seal-the-manifest",
      "launch-and-track",
    ]);
  });
});
