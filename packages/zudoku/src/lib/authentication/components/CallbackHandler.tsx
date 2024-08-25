import logger from "loglevel";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DeveloperHint } from "../../components/DeveloperHint.js";
import { ErrorPage } from "../../components/ErrorPage.js";
import { Spinner } from "../../components/Spinner.js";
import { SyntaxHighlight } from "../../components/SyntaxHighlight.js";

export function CallbackHandler({
  handleCallback,
}: {
  handleCallback: () => Promise<string>;
}) {
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();
  // Deal with double mount in dev mode which will break
  // the OAuth flow because you can only use the code once
  const didInitialize = useRef(false);

  useEffect(() => {
    if (didInitialize.current) {
      return;
    }
    didInitialize.current = true;
    handleCallback()
      .then((redirect) => {
        navigate(redirect);
      })
      .catch((err) => {
        logger.error(err);
        setError(err);
      });
  }, [navigate, handleCallback]);

  if (error) {
    return (
      <ErrorPage
        category="Error"
        title="Authentication Error"
        message={
          <>
            <DeveloperHint className="mb-4">
              Check the configuration of your authorization provider and ensure
              all settings such as the callback URL are configured correctly.
            </DeveloperHint>
            An error occurred while authorizing the user.
            <SyntaxHighlight code={error.toString()} language="plain" />
          </>
        }
      />
    );
  }

  return (
    <div className="grid h-full place-items-center">
      <Spinner />
    </div>
  );
}
