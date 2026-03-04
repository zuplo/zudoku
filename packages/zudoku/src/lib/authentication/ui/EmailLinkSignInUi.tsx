import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { Input } from "zudoku/ui/Input.js";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/Form.js";
import { AuthCard } from "./AuthCard.js";

type EmailLinkFormFields = {
  email: string;
};

export const EmailLinkSignInUi = ({
  onSubmit,
}: {
  onSubmit: (email: string, redirectTo?: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const mutation = useMutation({
    mutationFn: ({ email }: EmailLinkFormFields) =>
      onSubmit(email, redirectTo ?? undefined),
    onSuccess: () => {
      void navigate(
        redirectTo
          ? `/signin/email-link-sent?redirectTo=${encodeURIComponent(redirectTo)}`
          : "/signin/email-link-sent",
      );
    },
  });

  const form = useForm<EmailLinkFormFields>({
    defaultValues: { email: "" },
  });

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>Sign in with email link</CardTitle>
        <CardDescription>
          Enter your email and we'll send you a link to sign in.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mutation.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{mutation.error.message}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) =>
              mutation.mutate({ email: data.email }),
            )}
            className="flex flex-col gap-2"
          >
            <FormItem>
              <FormLabel>E-Mail</FormLabel>
              <FormControl>
                <Input
                  placeholder="you@example.com"
                  type="email"
                  required
                  {...form.register("email", { required: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <ActionButton type="submit" isPending={mutation.isPending}>
              Send sign-in link
            </ActionButton>
          </form>
        </Form>
        <Link to="/signin" className="text-sm text-muted-foreground">
          Back to sign in
        </Link>
      </CardContent>
    </AuthCard>
  );
};
