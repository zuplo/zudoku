import {
  PlaygroundDialog,
  PlaygroundProvider,
  type PlaygroundContentProps,
} from "@zudoku/playground";
import { CirclePlayIcon } from "lucide-react";
import { type PropsWithChildren, Suspense, lazy } from "react";
import { useAuth } from "../../authentication/hook.js";
import { useApiIdentities } from "../../components/context/ZudokuContext.js";
import { Button } from "../../ui/Button.js";

const SyntaxHighlight = lazy(() =>
  import("../../ui/SyntaxHighlight.js").then((m) => ({
    default: m.SyntaxHighlight,
  })),
);

export const OpenPlaygroundButton = ({
  server,
  method = "get",
  url = "/",
  children,
  ...props
}: PropsWithChildren<Partial<PlaygroundContentProps>>) => {
  if (!server) {
    throw new Error("Server is required");
  }

  const identities = useApiIdentities();
  const { isAuthEnabled, login, signup, isPending, isAuthenticated } =
    useAuth();

  return (
    <Suspense>
      <PlaygroundProvider
        renderCodeBlock={(codeProps) => (
          <Suspense>
            <SyntaxHighlight
              className={codeProps.className}
              embedded={codeProps.embedded}
              fullHeight={codeProps.fullHeight}
              language={codeProps.language}
              code={codeProps.code}
            />
          </Suspense>
        )}
      >
        <PlaygroundDialog
          url={url}
          method={method}
          server={server}
          identities={identities.data ?? []}
          requiresLogin={isAuthEnabled && !isAuthenticated && !isPending}
          onLogin={() => login()}
          onSignUp={() => signup()}
          {...props}
        >
          <Button className="gap-2 items-center" variant="outline">
            {children ?? (
              <>
                Open in Playground
                <CirclePlayIcon size={16} />
              </>
            )}
          </Button>
        </PlaygroundDialog>
      </PlaygroundProvider>
    </Suspense>
  );
};
