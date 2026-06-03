import type { ReactNode } from "react";
import { Button } from "zudoku/components";
import { CheckIcon } from "zudoku/icons";
import { Link } from "zudoku/router";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert";
import { Card } from "zudoku/ui/Card";

/**
 * Shared chrome for the checkout and plan-change confirmation pages: the
 * centered card with a check-mark header, title/message, a summary slot
 * (`children`, typically a {@link PlanSummaryCard}), confirm/cancel actions
 * and a terms note. Keeping this in one place means both confirmation flows
 * stay visually and behaviorally consistent.
 */
export const ConfirmationScreen = ({
  title,
  message,
  errorMessage,
  children,
  confirmLabel,
  pendingLabel,
  onConfirm,
  isPending,
  confirmDisabled = false,
  cancelTo,
  cancelLabel = "Cancel",
  termsNote,
  footer,
}: {
  title: string;
  /** Subtitle paragraph(s) under the title. */
  message: ReactNode;
  /** When set, shows a destructive alert above the card. */
  errorMessage?: string;
  /** Summary content (e.g. a `PlanSummaryCard`). */
  children: ReactNode;
  confirmLabel: string;
  pendingLabel: string;
  onConfirm: () => void;
  isPending: boolean;
  confirmDisabled?: boolean;
  cancelTo: string;
  cancelLabel?: string;
  termsNote: ReactNode;
  /** Optional content rendered below the card (e.g. a "secured by Stripe" note). */
  footer?: ReactNode;
}) => {
  return (
    <div className="w-full bg-muted min-h-screen flex items-center justify-center px-4 py-12 gap-4">
      <div className="max-w-2xl w-full">
        {errorMessage && (
          <Alert className="mb-4" variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        <Card className="p-8 w-full max-w-7xl">
          <div className="flex justify-center mb-6">
            <div className="rounded-full bg-primary/10 p-3">
              <CheckIcon className="size-9 text-primary" />
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-card-foreground mb-3">
              {title}
            </h1>
            {message}
          </div>

          {children}

          <div className="space-y-3 mt-4">
            <Button
              className="w-full"
              onClick={onConfirm}
              disabled={isPending || confirmDisabled}
            >
              {isPending ? pendingLabel : confirmLabel}
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              disabled={isPending}
              asChild={!isPending}
            >
              {/* While pending the Button renders a real <button>, so render
                  plain text rather than a nested <Link> (<a>) — that would be
                  invalid interactive nesting and stay navigable when disabled. */}
              {isPending ? (
                cancelLabel
              ) : (
                <Link to={cancelTo}>{cancelLabel}</Link>
              )}
            </Button>
          </div>

          <div className="mt-6 pt-6 border-t text-center">
            <p className="text-xs text-muted-foreground">{termsNote}</p>
          </div>
        </Card>
        {footer}
      </div>
    </div>
  );
};
