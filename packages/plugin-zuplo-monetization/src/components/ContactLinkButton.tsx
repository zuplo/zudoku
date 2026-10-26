import { Link } from "zudoku/router";
import { Button, type ButtonProps } from "zudoku/ui/Button";
import type { PlanContact } from "../utils/planContact.js";

/**
 * CTA for a contact-sales plan. External targets open in a new tab, `mailto:`
 * links hand off to the mail client, and in-app paths route through the
 * client-side router.
 */
export const ContactLinkButton = ({
  contact,
  variant = "default",
  size,
}: {
  contact: PlanContact;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
}) => (
  <Button variant={variant} size={size} asChild>
    {contact.isExternal ? (
      <a href={contact.href} target="_blank" rel="noopener noreferrer">
        {contact.label}
      </a>
    ) : contact.href.startsWith("mailto:") ? (
      <a href={contact.href}>{contact.label}</a>
    ) : (
      <Link to={contact.href}>{contact.label}</Link>
    )}
  </Button>
);
