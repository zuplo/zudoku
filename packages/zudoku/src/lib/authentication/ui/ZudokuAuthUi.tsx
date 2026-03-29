import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button, type ButtonProps } from "zudoku/ui/Button.js";
import {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "zudoku/ui/Card.js";
import { Input } from "zudoku/ui/Input.js";
import { Separator } from "zudoku/ui/Separator.js";
import { useTranslation } from "../../i18n/I18nContext.js";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/Form.js";
import { cn } from "../../util/cn.js";
import { getRelativeRedirectUrl } from "../utils/relativeRedirectUrl.js";
import { AuthCard } from "./AuthCard.js";
import AppleIcon from "./icons/Apple.js";
import FacebookIcon from "./icons/Facebook.js";
import GithubIcon from "./icons/Github.js";
import GoogleIcon from "./icons/Google.js";
import MicrosoftIcon from "./icons/Microsoft.js";
import XIcon from "./icons/X.js";

export const AUTH_PROVIDER_NAMES: Record<AuthProviderId, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  twitter: "X",
  x: "X",
  microsoft: "Microsoft",
  apple: "Apple",
  yahoo: "Yahoo",
};

export type AuthProviderId = keyof typeof ProviderIcons;

const ProviderIcons = {
  google: GoogleIcon,
  github: GithubIcon,
  facebook: FacebookIcon,
  twitter: XIcon,
  x: XIcon,
  apple: AppleIcon,
  microsoft: MicrosoftIcon,
  yahoo: React.Fragment,
} as const;

const isValidAuthProviderId = (
  provider: string,
): provider is AuthProviderId => {
  return provider in ProviderIcons;
};

const isAuthProviderIdArray = (
  providers: string[],
): providers is AuthProviderId[] => {
  return providers.every(isValidAuthProviderId);
};

const AuthProviderButton = ({
  providerId,
  onClick,
  ...buttonProps
}: { providerId: AuthProviderId; onClick?: () => void } & ButtonProps) => {
  const IconRenderer = ProviderIcons[providerId];
  return (
    <Button
      variant="outline"
      className="gap-2"
      onClick={onClick}
      {...buttonProps}
    >
      <IconRenderer className="w-4 h-4 fill-foreground" />
      {AUTH_PROVIDER_NAMES[providerId]}
    </Button>
  );
};

type FormFields = {
  email: string;
  password: string;
};

const EmailPasswordForm = ({
  form,
  onSubmit,
  submitLabel,
  isPending,
}: {
  form: ReturnType<typeof useForm<FormFields>>;
  onSubmit: (data: FormFields) => void;
  submitLabel: string;
  isPending: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <FormItem>
          <FormLabel>{t("auth.form.email")}</FormLabel>
          <FormControl>
            <Input
              placeholder={t("auth.form.emailPlaceholder")}
              {...form.register("email")}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>{t("auth.form.password")}</FormLabel>
          <FormControl>
            <Input
              placeholder={t("auth.form.passwordPlaceholder")}
              {...form.register("password")}
              type="password"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
        <ActionButton type="submit" isPending={isPending}>
          {submitLabel}
        </ActionButton>
      </form>
    </Form>
  );
};

export const ZudokuSignInUi = ({
  providers,
  onOAuthSignIn,
  onUsernamePasswordSignIn,
  enableUsernamePassword,
  enableEmailLink,
}: {
  providers: string[];
  enableUsernamePassword: boolean;
  enableEmailLink?: boolean;
  onOAuthSignIn: (providerId: string) => Promise<void>;
  onUsernamePasswordSignIn: (email: string, password: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const relativeRedirectTo = getRelativeRedirectUrl(redirectTo);

  const invalidProviders = providers.filter(
    (provider) => !isValidAuthProviderId(provider),
  );

  if (invalidProviders.length > 0) {
    throw new Error(
      `Unsupported auth provider: ${invalidProviders.join(", ")}`,
    );
  }

  if (!isAuthProviderIdArray(providers)) {
    throw new Error(`Unsupported auth provider: ${providers.join(", ")}`);
  }

  const signInUsernameMutation = useMutation({
    mutationFn: ({ email, password }: FormFields) =>
      onUsernamePasswordSignIn(email, password),
    onSuccess: () => {
      void navigate(relativeRedirectTo);
    },
  });
  const signInByProviderMutation = useMutation({
    mutationFn: ({ providerId }: { providerId: string }) =>
      onOAuthSignIn(providerId),
    onSuccess: () => {
      void navigate(relativeRedirectTo);
    },
  });
  const form = useForm<FormFields>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pending =
    signInUsernameMutation.isPending || signInByProviderMutation.isPending;

  const error = signInUsernameMutation.error ?? signInByProviderMutation.error;

  const hasEmailMethod = enableUsernamePassword || enableEmailLink;

  const { t } = useTranslation();

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>{t("auth.signIn.title")}</CardTitle>
        <CardDescription>{t("auth.signIn.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        {enableUsernamePassword && (
          <>
            <EmailPasswordForm
              form={form}
              onSubmit={(data) =>
                void signInUsernameMutation.mutate({
                  email: data.email,
                  password: data.password,
                })
              }
              submitLabel={t("auth.signIn.submit")}
              isPending={pending}
            />
            <Link
              to="/reset-password"
              className="text-sm text-muted-foreground text-right -mt-2"
            >
              {t("auth.forgotPassword")}
            </Link>
          </>
        )}
        {hasEmailMethod && providers.length > 0 && (
          <ProviderSeparator providers={providers} />
        )}
        {providers.length > 0 && (
          <ProviderButtons
            providers={providers}
            onClick={(providerId) =>
              signInByProviderMutation.mutate({ providerId })
            }
          />
        )}
        <div className="flex flex-col gap-1">
          {enableEmailLink && (
            <Link
              to={
                redirectTo
                  ? `/signin/email-link?redirectTo=${encodeURIComponent(redirectTo)}`
                  : "/signin/email-link"
              }
              className="text-sm text-muted-foreground"
            >
              {t("auth.emailLinkSignIn")}
            </Link>
          )}
          <Link to="/signup" className="text-sm text-muted-foreground">
            {t("auth.noAccount")}
          </Link>
        </div>
      </CardContent>
    </AuthCard>
  );
};

export const ZudokuSignUpUi = ({
  providers,
  enableUsernamePassword,
  enableEmailLink,
  onOAuthSignUp,
  onUsernamePasswordSignUp,
}: {
  providers: string[];
  enableUsernamePassword: boolean;
  enableEmailLink?: boolean;
  onOAuthSignUp: (providerId: string) => Promise<void>;
  onUsernamePasswordSignUp: (email: string, password: string) => Promise<void>;
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get("redirectTo");

  const relativeRedirectTo = getRelativeRedirectUrl(redirectTo);

  if (!isAuthProviderIdArray(providers)) {
    throw new Error("Invalid auth provider IDs");
  }

  const signUpUsernameMutation = useMutation({
    mutationFn: async ({ email, password }: FormFields) => {
      await onUsernamePasswordSignUp(email, password);
    },
    onSuccess: () => {
      void navigate(relativeRedirectTo);
    },
  });

  const signUpByProviderMutation = useMutation({
    mutationFn: async ({ providerId }: { providerId: string }) => {
      await onOAuthSignUp(providerId);
    },
    onSuccess: () => {
      void navigate(relativeRedirectTo);
    },
  });

  const form = useForm<FormFields>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const pending =
    signUpUsernameMutation.isPending || signUpByProviderMutation.isPending;

  const error = signUpUsernameMutation.error ?? signUpByProviderMutation.error;

  const hasEmailMethod = enableUsernamePassword || enableEmailLink;

  const { t } = useTranslation();

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>{t("auth.signUp.title")}</CardTitle>
        <CardDescription>{t("auth.signUp.description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}

        {enableUsernamePassword && (
          <EmailPasswordForm
            form={form}
            onSubmit={(data) =>
              void signUpUsernameMutation.mutate({
                email: data.email,
                password: data.password,
              })
            }
            submitLabel={t("auth.signUp.submit")}
            isPending={pending}
          />
        )}
        {hasEmailMethod && providers.length > 0 && (
          <ProviderSeparator providers={providers} />
        )}
        {providers.length > 0 && (
          <ProviderButtons
            providers={providers}
            onClick={(providerId) =>
              signUpByProviderMutation.mutate({ providerId })
            }
          />
        )}
        <div className="flex flex-col gap-1">
          {enableEmailLink && (
            <Link
              to={
                redirectTo
                  ? `/signin/email-link?redirectTo=${encodeURIComponent(redirectTo)}`
                  : "/signin/email-link"
              }
              className="text-sm text-muted-foreground"
            >
              {t("auth.emailLinkSignIn")}
            </Link>
          )}
          <Link to="/signin" className="text-sm text-muted-foreground">
            {t("auth.hasAccount")}
          </Link>
        </div>
      </CardContent>
    </AuthCard>
  );
};

const ProviderButtons = ({
  providers,
  onClick,
}: {
  providers: AuthProviderId[];
  onClick: (providerId: string) => void;
}) => {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2",
        providers.length % 2 === 0 ? "grid-cols-2" : "grid-cols-1",
      )}
    >
      {providers.map((provider) => (
        <AuthProviderButton
          key={provider}
          providerId={provider}
          onClick={() => onClick(provider)}
        />
      ))}
    </div>
  );
};

const ProviderSeparator = ({ providers }: { providers: AuthProviderId[] }) => {
  const { t } = useTranslation();
  return (
    providers.length > 0 && (
      <Separator className="my-3 relative">
        <span className="bg-card text-muted-foreground text-sm px-2 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {t("auth.orContinueWith")}
        </span>
      </Separator>
    )
  );
};

export const ZudokuPasswordResetUi = ({
  onPasswordReset,
}: {
  onPasswordReset: (email: string) => Promise<void>;
}) => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const passwordResetMutation = useMutation({
    mutationFn: async ({ email }: { email: string }) => {
      await onPasswordReset(email);
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const form = useForm<{ email: string }>({
    defaultValues: {
      email: "",
    },
  });

  const error = passwordResetMutation.error;

  const { t } = useTranslation();

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>{t("auth.passwordReset.title")}</CardTitle>
        <CardDescription>
          {isSubmitted
            ? t("auth.passwordReset.descriptionSubmitted")
            : t("auth.passwordReset.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        {isSubmitted ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>{t("auth.passwordReset.emailSent")}</AlertTitle>
              <AlertDescription>
                {t("auth.passwordReset.emailSentDescription")}
              </AlertDescription>
            </Alert>
            <Link to="/signin">
              <Button variant="outline" className="w-full">
                {t("auth.passwordReset.backToSignIn")}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((data) =>
                  passwordResetMutation.mutate({ email: data.email }),
                )}
                className="flex flex-col gap-2"
              >
                <FormItem>
                  <FormLabel>{t("auth.passwordReset.emailLabel")}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t("auth.passwordReset.emailPlaceholder")}
                      {...form.register("email")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
                <ActionButton
                  type="submit"
                  isPending={passwordResetMutation.isPending}
                >
                  {t("auth.passwordReset.submit")}
                </ActionButton>
              </form>
            </Form>
            <Link to="/signin" className="text-sm text-muted-foreground">
              {t("auth.passwordReset.backToSignIn")}
            </Link>
          </>
        )}
      </CardContent>
    </AuthCard>
  );
};

export const ZudokuPasswordUpdateUi = ({
  onPasswordUpdate,
}: {
  onPasswordUpdate: (password: string) => Promise<void>;
}) => {
  const [isSubmitted, setIsSubmitted] = React.useState(false);

  const passwordUpdateMutation = useMutation({
    mutationFn: async ({ password }: { password: string }) => {
      await onPasswordUpdate(password);
    },
    onSuccess: () => {
      setIsSubmitted(true);
    },
  });

  const form = useForm<{ password: string; confirmPassword: string }>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const error = passwordUpdateMutation.error;

  const { t } = useTranslation();

  const onSubmit = (data: { password: string; confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      form.setError("confirmPassword", {
        message: t("auth.passwordUpdate.passwordMismatch"),
      });
      return;
    }
    passwordUpdateMutation.mutate({ password: data.password });
  };

  return (
    <AuthCard>
      <CardHeader>
        <CardTitle>{t("auth.passwordUpdate.title")}</CardTitle>
        <CardDescription>
          {isSubmitted
            ? t("auth.passwordUpdate.descriptionSubmitted")
            : t("auth.passwordUpdate.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertTitle>{t("common.error")}</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        {isSubmitted ? (
          <div className="flex flex-col gap-4">
            <Alert>
              <AlertTitle>{t("auth.passwordUpdate.success")}</AlertTitle>
              <AlertDescription>
                {t("auth.passwordUpdate.successDescription")}
              </AlertDescription>
            </Alert>
            <Link to="/signin">
              <Button variant="outline" className="w-full">
                {t("auth.signIn.title")}
              </Button>
            </Link>
          </div>
        ) : (
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="flex flex-col gap-2"
            >
              <FormItem>
                <FormLabel>{t("auth.passwordUpdate.newPassword")}</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t(
                      "auth.passwordUpdate.newPasswordPlaceholder",
                    )}
                    {...form.register("password")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <FormItem>
                <FormLabel>
                  {t("auth.passwordUpdate.confirmPassword")}
                </FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder={t(
                      "auth.passwordUpdate.confirmPasswordPlaceholder",
                    )}
                    {...form.register("confirmPassword")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
              <ActionButton
                type="submit"
                isPending={passwordUpdateMutation.isPending}
              >
                {t("auth.passwordUpdate.submit")}
              </ActionButton>
            </form>
          </Form>
        )}
      </CardContent>
    </AuthCard>
  );
};
