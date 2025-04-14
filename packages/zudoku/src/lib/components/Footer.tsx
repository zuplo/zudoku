import { ExternalLink as ExternalLinkIcon } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import type { FooterSocialIcons } from "../../config/validators/common.js";
import { cn } from "../util/cn.js";
import { AnchorLink } from "./AnchorLink.js";
import { useZudoku } from "./index.js";
import { Slotlet } from "./SlotletProvider.js";

const SocialIcon = ({
  icon,
}: {
  icon: (typeof FooterSocialIcons)[number] | ReactNode;
}) => {
  if (typeof icon === "string") {
    return (
      <img
        src={`https://cdn.simpleicons.org/${icon}/000000/ffffff`}
        className="size-5"
        alt={icon}
      />
    );
  }
  return icon;
};

const isExternalUrl = (href: string) => /^https?:/.test(href);

export const Footer = () => {
  const { page } = useZudoku();
  const footer = page?.footer;

  if (!footer) return null;

  return (
    <footer className="border-t bg-background">
      <div className="mx-auto max-w-screen-2xl px-4 lg:px-8 py-8 pt-20">
        <div
          className={cn("flex flex-row gap-8", {
            "justify-center": !footer.position || footer.position === "center",
            "justify-start": footer.position === "start",
            "justify-end": footer.position === "end",
          })}
        >
          <Slotlet name="footer-before" />
          {footer.columns && (
            <div
              className="w-full md:max-w-screen-md grid grid-cols-[1fr_1fr] gap-8 md:grid-cols-[repeat(var(--columns),minmax(0,1fr))]"
              style={{ "--columns": footer.columns.length } as CSSProperties}
            >
              {footer.columns.map((column) => (
                <div
                  className={cn({
                    "justify-self-center":
                      !column.position || column.position === "center",
                    "justify-self-start": column.position === "start",
                    "justify-self-end": column.position === "end",
                  })}
                  key={column.title}
                >
                  <span className="text-sm font-semibold">{column.title}</span>
                  <ul className="mt-4 space-y-2">
                    {column.links.map((link, i) => {
                      const className =
                        "flex flex-row gap-1 items-center text-sm text-muted-foreground hover:text-accent-foreground";

                      return (
                        <li key={link.href + i}>
                          {isExternalUrl(link.href) ? (
                            <a
                              href={link.href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={className}
                            >
                              <span>{link.label}</span>
                              <ExternalLinkIcon size={12} />
                            </a>
                          ) : (
                            <AnchorLink
                              to={link.href + i}
                              className={className}
                            >
                              <span>{link.label}</span>
                            </AnchorLink>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
          <Slotlet name="footer-after" />
        </div>
        <div
          className={cn(
            "flex items-center justify-between",
            footer.columns && "border-t mt-8 pt-8",
          )}
        >
          {footer.logo && (
            <>
              <img
                src={footer.logo.src.light}
                alt={footer.logo.alt}
                className="w-8 dark:hidden"
                style={{ width: footer.logo.width }}
              />
              <img
                src={footer.logo.src.dark}
                alt={footer.logo.alt}
                className="w-8 hidden dark:block"
                style={{ width: footer.logo.width }}
              />
            </>
          )}
          {footer.copyright && (
            <p className="text-sm text-muted-foreground">{footer.copyright}</p>
          )}
          <div className="flex items-center gap-2">
            {footer.social?.map((social) => (
              <a
                key={social.href}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="w-auto gap-2 flex text-muted-foreground hover:text-accent-foreground"
              >
                <SocialIcon icon={social.icon} />
                {social.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};
