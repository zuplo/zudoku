/**
 * @vitest-environment happy-dom
 *
 * Canary test for a React Router bug.
 *
 * `useBlocker` strips the router `basename` from the `nextLocation` it passes
 * to the `shouldBlock` predicate, but does NOT strip it from the `location`
 * it exposes on the returned `Blocker`. This is inconsistent with
 * `useLocation`, which strips.
 *
 * `RouteGuard.tsx` works around this with `stripBasePath`. When/if RR fixes
 * the inconsistency upstream, this test will fail and we can drop the
 * workaround.
 */

import {
  act,
  render as testRender,
  screen,
  waitFor,
} from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { useState } from "react";
import {
  createMemoryRouter,
  Link,
  RouterProvider,
  useBlocker,
} from "react-router";
import { describe, expect, it } from "vitest";

const Probe = () => {
  const [predicateNextPath, setPredicateNextPath] = useState<string | null>(
    null,
  );
  const blocker = useBlocker(({ nextLocation }) => {
    setPredicateNextPath(nextLocation.pathname);
    return true;
  });

  return (
    <div>
      <Link to="/protected">Go</Link>
      <div data-testid="predicate-next-path">{predicateNextPath ?? ""}</div>
      <div data-testid="blocker-pathname">
        {blocker.location?.pathname ?? ""}
      </div>
    </div>
  );
};

describe("React Router useBlocker basename inconsistency (canary)", () => {
  it("predicate's nextLocation strips basename but blocker.location does not", async () => {
    const router = createMemoryRouter(
      [
        { path: "/", element: <Probe /> },
        { path: "/protected", element: <div>Protected</div> },
      ],
      { initialEntries: ["/docs/"], basename: "/docs" },
    );

    await act(async () => {
      testRender(<RouterProvider router={router} />);
    });

    await userEvent.click(screen.getByText("Go"));

    await waitFor(() => {
      expect(screen.getByTestId("blocker-pathname")).not.toBeEmptyDOMElement();
    });

    expect(screen.getByTestId("predicate-next-path")).toHaveTextContent(
      "/protected",
    );
    // If this assertion ever fails (i.e. RR strips basename here too), drop
    // the `stripBasePath` workaround in RouteGuard.tsx.
    expect(screen.getByTestId("blocker-pathname")).toHaveTextContent(
      "/docs/protected",
    );
  });
});
