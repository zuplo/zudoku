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
import { useTranslation } from "../../components/context/useTranslation.js";
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
  const { t } = useTranslation();
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
        <CardTitle>{t("auth.signInWithEmailLink")}</CardTitle>
        <CardDescription>
          {t("auth.emailLinkSignInDescription")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {mutation.error && (
          <Alert variant="destructive">
            <AlertTitle>{t("auth.error")}</AlertTitle>
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
              <FormLabel>{t("auth.email")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("auth.emailExamplePlaceholder")}
                  type="email"
                  required
                  {...form.register("email", { required: true })}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
            <ActionButton type="submit" isPending={mutation.isPending}>
              {t("auth.sendSignInLink")}
            </ActionButton>
          </form>
        </Form>
        <Link to="/signin" className="text-sm text-muted-foreground">
          {t("auth.backToSignIn")}
        </Link>
      </CardContent>
    </AuthCard>
  );
};
