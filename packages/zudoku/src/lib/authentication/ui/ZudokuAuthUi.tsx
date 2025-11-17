import { useForm } from "react-hook-form";
import { Button } from "zudoku/ui/Button.js";
import { Input } from "zudoku/ui/Input.js";
import { Heading } from "../../components/Heading.js";
import { FormControl, FormControl, FormItem, FormLabel, FormMessage } from "../../ui/Form.js";

export const AUTH_PROVIDER_NAMES: Record<string, string> = {
  google: "Google",
  github: "GitHub",
  facebook: "Facebook",
  twitter: "Twitter",
  microsoft: "Microsoft",
  apple: "Apple",
  yahoo: "Yahoo",
  password: "Email",
  phone: "Phone",
};

export type AuthProviderType =
  (typeof AUTH_PROVIDER_NAMES)[keyof typeof AUTH_PROVIDER_NAMES];

export const ZudokuLoginUi = ({
  providers,
  onOAuthSignIn,
  onUsernamePasswordSignIn,
}: {
  providers: AuthProviderType[];
  onOAuthSignIn: (providerId: string) => Promise<void>;
  onUsernamePasswordSignIn: (email: string, password: string) => Promise<void>;
}) => {
  const form = useForm<{ email: string; password: string }>({
    defaultValues: {
      email: "",
      password: "",
    },

  });

  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10">
        <Heading level={1}>Sign in</Heading>
        {providers.map((provider) => (
          <Button key={provider} onClick={() => onOAuthSignIn(provider)}>
            {AUTH_PROVIDER_NAMES[provider]}
          </Button>
        ))}
        <Form {...form}>  
          <form onSubmit={form.handleSubmit(onUsernamePasswordSignIn)}>
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
              <Input placeholder="Password" {...form.register("password")} />
            </FormControl>
            <FormMessage />
          </FormItem>
          <Button type="submit">Sign in</Button>
          </form>
        </Form>
      </div>
    </div>
  );
};

export const ZudokuSignUpUi = () => {
  return (
    <div className="flex items-center justify-center">
      <div className="max-w-md w-full mt-10">
        <Heading level={1}>Sign up</Heading>
        <Input placeholder="Email" />
        <Input placeholder="Password" />
        <Button>Sign up</Button>
      </div>
    </div>
  );
};
