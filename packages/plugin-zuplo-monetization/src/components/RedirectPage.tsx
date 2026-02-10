import { type LucideIcon } from "zudoku/icons";

const RedirectPage = ({
  icon: Icon,
  title,
  description,
  url,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  url?: string;
}) => {
  if (url) {
    window.location.href = url;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted">
      <div className="flex max-w-md flex-col items-center space-y-6 text-center">
        <div className="relative">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-foreground/10">
            <Icon className="w-12 h-12 text-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-card-foreground">{title}</h2>
          <p className="text-muted-foreground">{description}</p>
          <p className="text-sm text-muted-foreground">
            Powered by Stripe for maximum security
          </p>
        </div>

        <div className="flex space-x-2">
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.3s]" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary [animation-delay:-0.15s]" />
          <div className="h-3 w-3 animate-pulse rounded-full bg-primary" />
        </div>
      </div>
    </div>
  );
};

export { RedirectPage };
