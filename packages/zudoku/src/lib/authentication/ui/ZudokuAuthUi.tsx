import { useMutation } from "@tanstack/react-query";
import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router";
import { ActionButton } from "zudoku/ui/ActionButton.js";
import { Alert, AlertDescription, AlertTitle } from "zudoku/ui/Alert.js";
import { Button, type ButtonProps } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Heading } from "../../components/Heading.js";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../ui/Form.js";
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
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <Input placeholder="Email" {...form.register("email")} />
          </FormControl>
          <FormMessage />
        </FormItem>
        <FormItem>
          <FormLabel>Password</FormLabel>
          <FormControl>
            <Input
              placeholder="Password"
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
}: {
  providers: AuthProviderId[];
  onOAuthSignIn: (providerId: string) => Promise<void>;
  onUsernamePasswordSignIn: (email: string, password: string) => Promise<void>;
}) => {
  const navigate = useNavigate();

  const signInUsernameMutation = useMutation({
    mutationFn: async ({ email, password }: FormFields) => {
      await onUsernamePasswordSignIn(email, password);
    },
    onSuccess: () => {
      void navigate("/");
    },
  });
  const signInByProviderMutation = useMutation({
    mutationFn: async ({ providerId }: { providerId: string }) => {
      await onOAuthSignIn(providerId);
    },
    onSuccess: () => {
      void navigate("/");
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

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10 flex flex-col gap-2">
        <Heading level={1}>Sign in</Heading>
        {providers.map((provider) => (
          <AuthProviderButton
            key={provider}
            providerId={provider}
            onClick={() =>
              void signInByProviderMutation.mutate({ providerId: provider })
            }
          />
        ))}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        <EmailPasswordForm
          form={form}
          onSubmit={(data) =>
            void signInUsernameMutation.mutate({
              email: data.email,
              password: data.password,
            })
          }
          submitLabel="Sign in"
          isPending={pending}
        />
        <Link to="/signup" className="text-sm text-muted-foreground">
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
};

export const ZudokuSignUpUi = ({
  providers,
  onOAuthSignUp,
  onUsernamePasswordSignUp,
}: {
  providers: AuthProviderId[];
  onOAuthSignUp: (providerId: string) => Promise<void>;
  onUsernamePasswordSignUp: (email: string, password: string) => Promise<void>;
}) => {
  const signUpUsernameMutation = useMutation({
    mutationFn: async ({ email, password }: FormFields) => {
      await onUsernamePasswordSignUp(email, password);
    },
  });

  const signUpByProviderMutation = useMutation({
    mutationFn: async ({ providerId }: { providerId: string }) => {
      await onOAuthSignUp(providerId);
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

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10 flex flex-col gap-2">
        <Heading level={1}>Sign up</Heading>
        {providers.map((provider) => (
          <AuthProviderButton
            key={provider}
            providerId={provider}
            onClick={() =>
              void signUpByProviderMutation.mutate({ providerId: provider })
            }
          />
        ))}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        <EmailPasswordForm
          form={form}
          onSubmit={(data) =>
            void signUpUsernameMutation.mutate({
              email: data.email,
              password: data.password,
            })
          }
          submitLabel="Sign up"
          isPending={pending}
        />
        <Link to="/signin" className="text-sm text-muted-foreground">
          Already have an account? Sign in
        </Link>
      </div>
    </div>
  );
};
