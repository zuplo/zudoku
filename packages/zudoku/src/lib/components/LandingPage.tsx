import type { ReactNode } from "react";
import { Link } from "react-router";
import { Button, type ButtonProps } from "../ui/Button.js";
import { cn } from "../util/cn.js";

export type LandingPageAction = {
  label: ReactNode;
  /** Internal path (rendered as client-side link) or external URL (opens in a new tab) */
  href: string;
  variant?: ButtonProps["variant"];
};

export type LandingPageFeature = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Renders the feature as a clickable card linking to this path or URL */
  href?: string;
};

export type LandingPageProps = {
  /**
   * - `hero`: centered hero with actions and a feature grid below (default)
   * - `split`: two-column hero with custom content (image, code sample, …) on the side
   * - `grid`: compact header with prominent feature cards, ideal as a documentation hub
   */
  variant?: "hero" | "split" | "grid";
  /** Short label displayed above the title */
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Call-to-action buttons. The first action uses the primary button style by default. */
  actions?: LandingPageAction[];
  features?: LandingPageFeature[];
  /** Content displayed next to the text in the `split` variant */
  aside?: ReactNode;
  /** Additional content rendered below the page sections */
  children?: ReactNode;
  className?: string;
};

const isExternal = (href: string) => /^(https?:)?\/\//.test(href);

const SmartLink = ({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) =>
  isExternal(href) ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
    >
      {children}
    </a>
  ) : (
    <Link to={href} className={className}>
      {children}
    </Link>
  );

const Actions = ({
  actions,
  size = "xl",
  className,
}: {
  actions?: LandingPageAction[];
  size?: ButtonProps["size"];
  className?: string;
}) => {
  if (!actions?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center gap-4", className)}>
      {actions.map((action, index) => (
        <Button
          key={action.href}
          size={size}
          variant={action.variant ?? (index === 0 ? "default" : "outline")}
          asChild
        >
          <SmartLink href={action.href}>{action.label}</SmartLink>
        </Button>
      ))}
    </div>
  );
};

const FeatureGrid = ({
  features,
  prominent,
}: {
  features?: LandingPageFeature[];
  prominent?: boolean;
}) => {
  if (!features?.length) return null;

  return (
    <div
      className={cn(
        "grid gap-4 sm:grid-cols-2",
        prominent ? "lg:gap-5" : "lg:grid-cols-3",
      )}
    >
      {features.map((feature, index) => {
        const content = (
          <>
            {feature.icon && (
              <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary [&_svg]:size-5">
                {feature.icon}
              </div>
            )}
            <div className="font-semibold">{feature.title}</div>
            {feature.description && (
              <p className="mt-1.5 text-sm text-muted-foreground">
                {feature.description}
              </p>
            )}
          </>
        );
        const classes = cn(
          "rounded-xl border bg-card p-5 text-card-foreground",
          prominent && "p-6",
          feature.href &&
            "transition-colors hover:border-primary/50 hover:bg-muted/50",
        );

        return feature.href ? (
          <SmartLink key={feature.href} href={feature.href} className={classes}>
            {content}
          </SmartLink>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: Stable because it's statically defined in the config
          <div key={index} className={classes}>
            {content}
          </div>
        );
      })}
    </div>
  );
};

const Eyebrow = ({ children }: { children: ReactNode }) =>
  children ? (
    <span className="text-sm font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  ) : null;

export const LandingPage = ({
  variant = "hero",
  eyebrow,
  title,
  description,
  actions,
  features,
  aside,
  children,
  className,
}: LandingPageProps) => {
  if (variant === "split") {
    return (
      <section
        className={cn(
          "not-prose flex flex-col gap-12 py-10 lg:py-16",
          className,
        )}
      >
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            <Eyebrow>{eyebrow}</Eyebrow>
            <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl">
              {title}
            </h1>
            {description && (
              <p className="text-lg text-muted-foreground">{description}</p>
            )}
            <Actions actions={actions} />
          </div>
          {aside && <div className="w-full">{aside}</div>}
        </div>
        <FeatureGrid features={features} />
        {children}
      </section>
    );
  }

  if (variant === "grid") {
    return (
      <section
        className={cn(
          "not-prose flex flex-col gap-10 py-8 lg:py-12",
          className,
        )}
      >
        <div className="flex flex-col items-start gap-4">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="text-3xl font-bold tracking-tight text-balance md:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-lg text-muted-foreground">
              {description}
            </p>
          )}
          <Actions actions={actions} size="default" className="gap-2" />
        </div>
        <FeatureGrid features={features} prominent />
        {children}
      </section>
    );
  }

  return (
    <section
      className={cn("not-prose flex flex-col gap-16 py-12 lg:py-20", className)}
    >
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h1 className="text-4xl font-extrabold tracking-tight text-balance md:text-5xl xl:text-6xl">
          {title}
        </h1>
        {description && (
          <p className="text-lg text-muted-foreground md:text-xl">
            {description}
          </p>
        )}
        <Actions actions={actions} className="justify-center" />
      </div>
      <FeatureGrid features={features} />
      {children}
    </section>
  );
};
