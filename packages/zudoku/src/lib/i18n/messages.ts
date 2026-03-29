export const defaultMessages = {
  // Common
  "common.copy": "Copy",
  "common.copyCode": "Copy code",
  "common.copyToClipboard": "Copy to clipboard",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.error": "Error",
  "common.send": "Send",
  "common.name": "Name",
  "common.value": "Value",

  // Code blocks
  "code.copy": "Copy",
  "code.copyCode": "Copy code",
  "code.defaultTitle": "Code",
  "code.clickToExpand": "Click to expand",
  "code.collapse": "Collapse",

  // OpenAPI Playground - General
  "openapi.playground.send": "Send",
  "openapi.playground.cancel": "Cancel",
  "openapi.playground.authentication": "Authentication",
  "openapi.playground.pathParameters": "Path Parameters",
  "openapi.playground.queryParameters": "Query Parameters",
  "openapi.playground.headers": "Headers",
  "openapi.playground.body": "Body",
  "openapi.playground.sendHint": "to send a request",
  "openapi.playground.requestFailedNetwork":
    "The request failed, possibly due to network issues or CORS policy.",

  // OpenAPI Playground - Path/Query/Header fields
  "openapi.playground.field.name": "Name",
  "openapi.playground.field.value": "Value",
  "openapi.playground.field.key": "Key",
  "openapi.playground.field.requiredField": "Required field",
  "openapi.playground.field.queryParamValue": "Query parameter value",
  "openapi.playground.header.lockedByAuth":
    "This header is set by the selected authentication.",
  "openapi.playground.header.overwrittenByAuth":
    "This header will be overwritten by the selected authentication.",

  // OpenAPI Playground - Body
  "openapi.playground.body.text": "Text",
  "openapi.playground.body.file": "File",
  "openapi.playground.body.multipart": "Multipart",
  "openapi.playground.body.placeholder": "Body content",
  "openapi.playground.body.fileDropZone": "File upload drop zone",
  "openapi.playground.body.selectOrDropFile": "Select or drop a file",
  "openapi.playground.body.attachFile": "Attach file",

  // OpenAPI Playground - Result Panel
  "openapi.playground.result.requestFailed": "Request failed",
  "openapi.playground.result.sendFirstRequest": "Send your first request",
  "openapi.playground.result.longRunning":
    "Looks like the request is taking longer than expected.",
  "openapi.playground.result.sendingRequest": "Sending Request...",

  // OpenAPI Playground - Response Tab
  "openapi.playground.response.requestHeaders": "Request Headers",
  "openapi.playground.response.responseHeaders": "Response Headers",
  "openapi.playground.response.responseBody": "Response body",
  "openapi.playground.response.view": "View",
  "openapi.playground.response.formatted": "Formatted",
  "openapi.playground.response.raw": "Raw",
  "openapi.playground.response.types": "Types",
  "openapi.playground.response.binaryContent": "Binary Content",
  "openapi.playground.response.binaryDescription":
    "This response contains binary data that cannot be displayed as text.",
  "openapi.playground.response.download": "Download {fileName} ({fileSize})",
  "openapi.playground.response.showMoreHeaders": "Show {count} more headers",
  "openapi.playground.response.hideHeaders": "Hide {count} headers",
  "openapi.playground.response.size": "Size",
  "openapi.playground.response.time": "Time",

  // OpenAPI Playground - Login Dialog
  "openapi.playground.login.title": "Welcome to the Playground!",
  "openapi.playground.login.description":
    "The Playground is a tool for developers to test and explore our APIs. To use the Playground, you need to login.",
  "openapi.playground.login.dontShowAgain": "Don't show this again",
  "openapi.playground.login.skip": "Skip",
  "openapi.playground.login.signUp": "Sign Up",
  "openapi.playground.login.login": "Login",

  // OpenAPI Playground - Identity
  "openapi.playground.identity.selectTitle": "Select an auth identity",
  "openapi.playground.identity.selectDescription":
    "Please select an identity for this request.",
  "openapi.playground.identity.rememberChoice": "Remember my choice",
  "openapi.playground.identity.none": "None",

  // OpenAPI Playground - Examples
  "openapi.playground.examples.useExample": "Use Example",

  // OpenAPI Playground - HTTP Status Messages
  "openapi.httpStatus.200": "OK",
  "openapi.httpStatus.201": "Created",
  "openapi.httpStatus.202": "Accepted",
  "openapi.httpStatus.204": "No Content",
  "openapi.httpStatus.400": "Bad Request",
  "openapi.httpStatus.401": "Unauthorized",
  "openapi.httpStatus.403": "Forbidden",
  "openapi.httpStatus.404": "Not Found",
  "openapi.httpStatus.405": "Method Not Allowed",
  "openapi.httpStatus.500": "Internal Server Error",

  // OpenAPI Schema
  "openapi.schema.required": "required",
  "openapi.schema.deprecated": "deprecated",
  "openapi.schema.circular": "circular",
  "openapi.schema.noDataReturned": "No data returned",
  "openapi.schema.additionalProperties": "Additional properties are allowed",
  "openapi.schema.hideDeprecatedFields": "Hide deprecated fields",
  "openapi.schema.showDeprecatedFields": "Show {count} deprecated field{s}",
  "openapi.schema.toggleProperties": "Toggle properties",
  "openapi.schema.example": "Example: ",
  "openapi.schema.default": "Default: ",
  "openapi.schema.enumValues": "Enum values:",
  "openapi.schema.showMore": "show {count} more",
  "openapi.schema.showLess": "show less",

  // OpenAPI Parameters
  "openapi.parameters.headers": "Headers",
  "openapi.parameters.groupParameters": "{group} Parameters",
  "openapi.parameters.toggleParameter": "Toggle parameter",

  // OpenAPI Download
  "openapi.download.schema": "Download schema",
  "openapi.download.openInNewTab": "Open in new tab",

  // OpenAPI Version
  "openapi.version.select": "Select version",

  // OpenAPI Sidecars & Examples
  "openapi.sidecar.exampleRequestBody": "Example Request Body",
  "openapi.sidecar.exampleResponses": "Example Responses",
  "openapi.sidecar.toggleRequestBodyExamples": "Toggle request body examples",
  "openapi.sidecar.toggleResponseExamples": "Toggle response examples",
  "openapi.sidecar.autoGenerated":
    "This example is auto-generated from the schema.",

  // Search
  "search.placeholder": "Search...",
  "search.noResults": "No results found.",
  "search.clearSearch": "Clear search",
  "search.startTyping": "Start typing to search",
  "search.errorLoading": "An error occurred while loading search.",
  "search.navigate": "Navigate",
  "search.select": "Select",
  "search.closeDialog": "Close dialog",
  "search.buildIndex": "Build Search Index",

  // API Keys
  "apiKeys.title": "API Keys",
  "apiKeys.description": "Create, manage, and monitor your API keys",
  "apiKeys.createKey": "Create API Key",
  "apiKeys.generateKey": "Generate Key",
  "apiKeys.name": "Name",
  "apiKeys.expiration": "Expiration",
  "apiKeys.days": "{count} days",
  "apiKeys.never": "Never",
  "apiKeys.defaultName": "Secret Key",
  "apiKeys.emptyState": "You have no API keys yet.",
  "apiKeys.emptyStateHint": "Get started and create your first key.",
  "apiKeys.editLabel": "Edit label",
  "apiKeys.rollKey": "Roll key",
  "apiKeys.rollKeyTooltip": "Roll this key",
  "apiKeys.rollDialog.title": "Roll API Key",
  "apiKeys.rollDialog.description":
    "Are you sure you want to roll this API key?",
  "apiKeys.rollDialog.confirm": "Roll Key",
  "apiKeys.deleteDialog.title": "Delete API Key",
  "apiKeys.deleteDialog.description":
    "Are you sure you want to delete this API key?",
  "apiKeys.created": "Created {timeAgo}.",
  "apiKeys.expiresIn": "Expires in {count} {dayLabel}.",
  "apiKeys.expiredToday": "Expired today.",
  "apiKeys.expiredDaysAgo": "Expired {count} days ago.",
  "apiKeys.emailVerification.required": "Verified email required",
  "apiKeys.emailVerification.message":
    "You need to verify your email to access API keys.",
  "apiKeys.refresh": "Refresh",
  "apiKeys.requestVerification": "Request verification",

  // Auth
  "auth.signIn": "Sign in",
  "auth.signUp": "Sign up",
  "auth.signIn.title": "Sign in",
  "auth.signIn.description": "Sign in to your account to continue.",
  "auth.signIn.submit": "Sign in",
  "auth.signUp.title": "Sign up",
  "auth.signUp.description": "Sign up to your account to continue.",
  "auth.signUp.submit": "Sign up",
  "auth.forgotPassword": "Forgot password?",
  "auth.emailLinkSignIn": "Sign in with email link",
  "auth.noAccount": "Don't have an account? Sign up.",
  "auth.hasAccount": "Already have an account? Sign in.",
  "auth.orContinueWith": "or continue with",
  "auth.form.email": "E-Mail",
  "auth.form.emailPlaceholder": "Email",
  "auth.form.password": "Password",
  "auth.form.passwordPlaceholder": "Password",
  "auth.passwordReset.title": "Reset password",
  "auth.passwordReset.description":
    "Enter your email address and we'll send you a link to reset your password.",
  "auth.passwordReset.descriptionSubmitted":
    "Check your email for a password reset link.",
  "auth.passwordReset.emailSent": "Email sent",
  "auth.passwordReset.emailSentDescription":
    "If an account exists with that email address, you will receive a password reset link shortly.",
  "auth.passwordReset.backToSignIn": "Back to sign in",
  "auth.passwordReset.emailLabel": "Email",
  "auth.passwordReset.emailPlaceholder": "you@example.com",
  "auth.passwordReset.submit": "Reset password",
  "auth.passwordUpdate.title": "Set new password",
  "auth.passwordUpdate.description": "Enter your new password below.",
  "auth.passwordUpdate.descriptionSubmitted":
    "Your password has been updated successfully.",
  "auth.passwordUpdate.success": "Password updated",
  "auth.passwordUpdate.successDescription":
    "Your password has been successfully updated. You can now sign in with your new password.",
  "auth.passwordUpdate.newPassword": "New password",
  "auth.passwordUpdate.newPasswordPlaceholder": "Enter new password",
  "auth.passwordUpdate.confirmPassword": "Confirm password",
  "auth.passwordUpdate.confirmPasswordPlaceholder": "Confirm new password",
  "auth.passwordUpdate.submit": "Update password",
  "auth.passwordUpdate.passwordMismatch": "Passwords do not match",
  "auth.provider.google": "Google",
  "auth.provider.github": "GitHub",
  "auth.provider.facebook": "Facebook",
  "auth.provider.twitter": "X",
  "auth.provider.x": "X",
  "auth.provider.microsoft": "Microsoft",
  "auth.provider.apple": "Apple",
  "auth.provider.yahoo": "Yahoo",

  // Status pages
  "status.400.title": "Bad Request",
  "status.400.message":
    "The request could not be understood by the server due to malformed syntax.",
  "status.403.title": "Forbidden",
  "status.403.message": "You don't have permission to access this resource.",
  "status.404.title": "Not Found",
  "status.404.message": "The requested resource could not be found.",
  "status.405.title": "Method Not Allowed",
  "status.405.message":
    "The request method is not supported for the requested resource.",
  "status.414.title": "Request URI Too Large",
  "status.414.message": "The request URI is too large.",
  "status.416.title": "Range Not Satisfiable",
  "status.416.message": "The server cannot satisfy the request range.",
  "status.500.title": "Internal Server Error",
  "status.500.message":
    "An unexpected error occurred while processing your request.",
  "status.501.title": "Not Implemented",
  "status.501.message":
    "The server does not support the functionality required to fulfill the request.",
  "status.502.title": "Bad Gateway",
  "status.502.message":
    "The server received an invalid response from the upstream server.",
  "status.503.title": "Service Unavailable",
  "status.503.message":
    "The server is temporarily unable to handle the request.",
  "status.504.title": "Gateway Timeout",
  "status.504.message":
    "The server did not receive a timely response from the upstream server.",
  "status.default.title": "An error occurred",
  "status.default.message":
    "Something went wrong while processing your request.",

  // Not Found page
  "notFound.title": "Page not found",
  "notFound.description":
    "It seems that the page you are looking for does not exist or may have been moved. Please check the URL for any typos or use the navigation menu to find the correct page.",
  "notFound.goHome": "Go back home",

  // Markdown pages
  "docs.editThisPage": "Edit this page",
  "docs.copyPage": "Copy page",
  "docs.copyLinkToPage": "Copy link to page",
  "docs.openMarkdownPage": "Open Markdown page",
  "docs.pageActions": "Page actions",
  "docs.lastModifiedOn": "Last modified on ",
  "docs.draft": "This page is a draft and is not visible in production.",

  // MCP Endpoint
  "mcp.endpointTitle": "MCP Endpoint",
  "mcp.endpointDescription":
    "Copy the url to connect any MCP-compatible AI tool",
  "mcp.configurationTitle": "AI Tool Configuration",
  "mcp.configurationDescription":
    "Choose your AI tool and copy the configuration to get started.",
  "mcp.tab.claude": "Claude",
  "mcp.tab.chatgpt": "ChatGPT",
  "mcp.tab.cursor": "Cursor",
  "mcp.tab.vscode": "VS Code",
  "mcp.viewOfficialDocs": "View official docs",
} as const;

export type MessageKey = keyof typeof defaultMessages;
