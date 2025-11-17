import { useMutation } from "@tanstack/react-query";
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

export const AUTH_PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  twitter: "X",
  microsoft: "Microsoft",
  apple: "Apple",
  yahoo: "Yahoo",
};

export type AuthProviderType =
  (typeof AUTH_PROVIDER_NAMES)[keyof typeof AUTH_PROVIDER_NAMES];

const AuthProviderButton = ({
  providerId,
}: { providerId: string } & ButtonProps) => {
  return (
    <Button variant="outline" key={providerId} className="gap-2">
      {providerId === "google" && (
        <GoogleIcon className="w-4 h-4 fill-foreground" />
      )}
      {providerId === "github" && (
        <GithubIcon className="w-4 h-4 fill-foreground" />
      )}
      {providerId === "facebook" && (
        <FacebookIcon className="w-4 h-4 fill-foreground" />
      )}
      {(providerId === "twitter" || providerId === "x") && (
        <XIcon className="w-3.5 h-3.5 fill-foreground" />
      )}

      {providerId === "apple" && (
        <AppleIcon className="w-4 h-4 fill-foreground" />
      )}
      {providerId === "microsoft" && (
        <MicrosoftIcon className="fill-foreground" width={19.5} height={19.5} />
      )}
      {AUTH_PROVIDER_NAMES[providerId]}
    </Button>
  );
};

export const ZudokuSignInUi = ({
  providers,
  onOAuthSignIn,
  onUsernamePasswordSignIn,
}: {
  providers: AuthProviderType[];
  onOAuthSignIn: (providerId: string) => Promise<void>;
  onUsernamePasswordSignIn: (email: string, password: string) => Promise<void>;
}) => {
  const navigate = useNavigate();

  const signInUsernameMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
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

  const form = useForm<{ email: string; password: string }>({
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
          <AuthProviderButton key={provider} providerId={provider} />
        ))}
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error?.message}</AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (data) =>
                void signInUsernameMutation.mutate({
                  email: data.email,
                  password: data.password,
                }),
            )}
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
            <ActionButton type="submit" isPending={pending}>
              Sign in
            </ActionButton>
          </form>
        </Form>
        <Link to="/signup" className="text-sm text-muted-foreground">
          Don't have an account? Sign up
        </Link>
      </div>
    </div>
  );
};

export const ZudokuSignUpUi = ({
  providers,
  onOAuthSignUp: onOAuthSignIn,
  onUsernamePasswordSignUp,
}: {
  providers: AuthProviderType[];
  onOAuthSignUp: (providerId: string) => Promise<void>;
  onUsernamePasswordSignUp: (email: string, password: string) => Promise<void>;
}) => {
  const form = useForm<{ email: string; password: string }>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const signInUsernameMutation = useMutation({
    mutationFn: async ({
      email,
      password,
    }: {
      email: string;
      password: string;
    }) => {
      await onUsernamePasswordSignUp(email, password);
    },
  });

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10 flex flex-col gap-2">
        <Heading level={1}>Sign up</Heading>
        {providers.map((provider) => (
          <Button
            variant="outline"
            key={provider}
            onClick={() => onOAuthSignIn(provider)}
          >
            {AUTH_PROVIDER_NAMES[provider]}
          </Button>
        ))}
        {signInUsernameMutation.error && (
          <Alert variant="destructive">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {signInUsernameMutation.error?.message}
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(
              (data) =>
                void signInUsernameMutation.mutate({
                  email: data.email,
                  password: data.password,
                }),
            )}
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
            <ActionButton
              type="submit"
              isPending={signInUsernameMutation.isPending}
            >
              Sign in
            </ActionButton>
          </form>
        </Form>
      </div>
    </div>
  );
};
