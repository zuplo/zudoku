import type { TranslationCatalog } from "../../core/i18n.js";

export const apiKeysTranslations: TranslationCatalog = {
  en: {
    // Profile menu / page
    "apiKeys.title": "API Keys",
    "apiKeys.subtitle": "Create, manage, and monitor your API keys",
    "apiKeys.verifiedEmailRequired": "Verified email required",
    "apiKeys.verifiedEmailRequiredDescription":
      "You need to verify your email to access API keys.",
    "apiKeys.refresh": "Refresh",
    "apiKeys.requestVerification": "Request verification",

    // Empty state
    "apiKeys.empty": "You have no API keys yet.",
    "apiKeys.emptyGetStarted": "Get started and create your first key.",

    // Create
    "apiKeys.create": "Create API Key",
    "apiKeys.error": "Error",
    "apiKeys.name": "Name",
    "apiKeys.expiration": "Expiration",
    "apiKeys.days": "{count} days",
    "apiKeys.never": "Never",
    "apiKeys.cancel": "Cancel",
    "apiKeys.generateKey": "Generate Key",
    "apiKeys.defaultDescription": "Secret Key",
    "apiKeys.fallbackLabel": "API Key",

    // Edit / actions
    "apiKeys.save": "Save",
    "apiKeys.editLabel": "Edit label",
    "apiKeys.createdOn": "Created on {date}",
    "apiKeys.expiresOn": "Expires on {date}",

    // Roll
    "apiKeys.rollKeyTitle": "Roll this key",
    "apiKeys.rollKey": "Roll key",
    "apiKeys.rollDialogTitle": "Roll API Key",
    "apiKeys.rollDialogDescription":
      "Are you sure you want to roll this API key?",
    "apiKeys.rollKeyConfirm": "Roll Key",

    // Reveal / status
    "apiKeys.created": "Created {timeAgo}.",
    "apiKeys.expiresInOne": "Expires in 1 day.",
    "apiKeys.expiresIn": "Expires in {count} days.",
    "apiKeys.expiredToday": "Expired today.",
    "apiKeys.expiredDaysAgo": "Expired {count} days ago.",

    // Delete
    "apiKeys.deleteApiKey": "Delete API key",
    "apiKeys.deleteDialogTitle": "Delete API Key",
    "apiKeys.deleteDialogDescription":
      "Are you sure you want to delete this API key?",
    "apiKeys.delete": "Delete",
  },
};
