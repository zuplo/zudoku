import type { BeforeCheckoutProps } from "@zuplo/zudoku-plugin-monetization";
import { Controller, useForm } from "react-hook-form";
import { useAuth } from "zudoku/hooks";
import { Alert, AlertDescription } from "zudoku/ui/Alert";
import { Button } from "zudoku/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card";
import { Label } from "zudoku/ui/Label";
import { RadioGroup, RadioGroupItem } from "zudoku/ui/RadioGroup";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "zudoku/ui/Select";
import { Textarea } from "zudoku/ui/Textarea";

type Answers = {
  companySize: string;
  useCase: string;
  details: string;
};

const COMPANY_SIZES = [
  { value: "1", label: "Just me" },
  { value: "2-10", label: "2–10 people" },
  { value: "11-50", label: "11–50 people" },
  { value: "51-200", label: "51–200 people" },
  { value: "200+", label: "More than 200 people" },
];

const USE_CASES = [
  { value: "internal-tooling", label: "Internal tooling" },
  { value: "customer-facing", label: "A customer-facing product" },
  { value: "data-pipeline", label: "Data pipeline / batch processing" },
  { value: "evaluating", label: "Just evaluating for now" },
];

/**
 * Replace this with a request to wherever your qualification data belongs — your
 * own API, a CRM, a warehouse. Whatever it is, it must resolve before the user
 * is sent to Stripe, so `onComplete()` runs only once it succeeded.
 */
const submitAnswers = async (payload: Answers & { planKey: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 600));

  // Throwing here keeps the user on this form with the error shown, and no
  // Stripe Checkout Session is ever created.
  if (payload.useCase === "") {
    throw new Error("Could not save your answers. Please try again.");
  }

  // biome-ignore lint/suspicious/noConsole: stands in for a real request
  console.log("qualification answers", payload);
};

/**
 * Asked after "Subscribe" and before Stripe, in place of a separate landing
 * page with an embedded form. Wired up via the monetization plugin's
 * `checkout.renderBeforeCheckout` option — see `zudoku.config.tsx`.
 */
export const SubscribeQuestionnaire = ({
  plan,
  onComplete,
  onCancel,
}: BeforeCheckoutProps) => {
  const auth = useAuth();
  const form = useForm<Answers>({
    defaultValues: { companySize: "", useCase: "", details: "" },
  });

  const onSubmit = form.handleSubmit(async (answers) => {
    try {
      await submitAnswers({ ...answers, planKey: plan.key });
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error ? error.message : "Something went wrong.",
      });
      return;
    }
    onComplete();
  });

  const rootError = form.formState.errors.root?.message;

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>Before you subscribe to {plan.name}</CardTitle>
          <CardDescription>
            Three quick questions so we can set up your account correctly.
            {auth.profile?.email
              ? ` Subscribing as ${auth.profile.email}.`
              : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex flex-col gap-8">
            <Controller
              control={form.control}
              name="companySize"
              rules={{ required: "Pick the option closest to your team size." }}
              render={({ field, fieldState }) => (
                <fieldset className="flex flex-col gap-3">
                  <legend className="font-medium text-sm mb-3">
                    How big is your team?
                  </legend>
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="gap-3"
                  >
                    {COMPANY_SIZES.map((size) => (
                      <div key={size.value} className="flex items-center gap-2">
                        <RadioGroupItem
                          value={size.value}
                          id={`size-${size.value}`}
                        />
                        <Label
                          htmlFor={`size-${size.value}`}
                          className="font-normal"
                        >
                          {size.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                  {fieldState.error && (
                    <p className="text-destructive text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </fieldset>
              )}
            />

            <Controller
              control={form.control}
              name="useCase"
              rules={{ required: "Let us know what you're building." }}
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-3">
                  <Label htmlFor="use-case">
                    What are you going to use the API for?
                  </Label>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="use-case">
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {USE_CASES.map((useCase) => (
                        <SelectItem key={useCase.value} value={useCase.value}>
                          {useCase.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.error && (
                    <p className="text-destructive text-sm">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <div className="flex flex-col gap-3">
              <Label htmlFor="details">
                Anything else we should know?{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Textarea
                id="details"
                rows={3}
                placeholder="Expected traffic, launch timeline, integrations…"
                {...form.register("details")}
              />
            </div>

            {rootError && (
              <Alert variant="destructive">
                <AlertDescription>{rootError}</AlertDescription>
              </Alert>
            )}

            <div className="flex items-center justify-between gap-3">
              <Button type="button" variant="ghost" onClick={onCancel}>
                Back to pricing
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting
                  ? "Saving…"
                  : "Continue to checkout"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
