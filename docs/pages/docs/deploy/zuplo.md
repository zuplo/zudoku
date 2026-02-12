---
title: Zuplo
zuplo: false
---

[Zuplo](https://zuplo.com) offers a fully managed hosting solution for your Zudoku-powered
documentation, combined with a complete API gateway and management platform. When you deploy to
Zuplo, you get more than just hosting—you get a production-ready developer portal with built-in API
key management, rate limiting, analytics, and more.

## Why Deploy to Zuplo?

Deploying your Zudoku documentation to Zuplo provides several advantages:

### Fully Managed Hosting

- **Global Edge Network**: Your documentation is served from 300+ data centers worldwide, ensuring
  fast load times for users everywhere
- **Automatic SSL**: SSL certificates are automatically provisioned and renewed—no configuration
  needed
- **Custom Domains**: Easily configure custom domains for both your API gateway and developer portal
- **Zero Infrastructure**: No servers to manage, scale, or maintain

### Integrated API Gateway

When your documentation lives alongside your API gateway, you unlock powerful capabilities:

- **API Key Management**: Let developers self-serve their API keys directly from the documentation
  portal
- **Rate Limiting**: Protect your APIs with precise, edge-deployed rate limiting
- **Authentication**: Support for API keys, JWT, OAuth, mTLS, and more
- **Real-time Analytics**: Monitor API usage and performance in real-time

### Developer Portal Features

- **OpenAPI Integration**: Documentation is automatically generated and stays in sync with your
  OpenAPI specifications
- **Self-Service Keys**: Developers can create, view, and manage their API keys without waiting for
  manual provisioning
- **Usage Analytics**: Developers can see their own API usage and debug issues directly in the
  portal
- **Monetization Ready**: Create pricing plans and usage limits for your API products

## Getting Started

To deploy your Zudoku documentation to Zuplo:

1. **Create a Zuplo Account**: Sign up for free at [zuplo.com](https://zuplo.com)
2. **Create a New Project**: Set up a new project in the Zuplo Portal
3. **Configure Your Developer Portal**: Enable the developer portal and customize it with your
   Zudoku configuration
4. **Deploy**: Push your changes and Zuplo handles the rest—your documentation is live globally in
   seconds

For detailed setup instructions, see the
[Zuplo Developer Portal documentation](https://zuplo.com/docs/dev-portal/introduction).

## Custom Domains

You can configure custom domains for your developer portal in the Zuplo Portal:

1. Go to **Settings** → **Custom Domain** in your project
2. Click **Add New Custom Domain**
3. Select **Developer Portal** as the domain type
4. Enter your domain (e.g., `docs.example.com`)
5. Add the CNAME record to your DNS provider:
   ```
   CNAME docs.example.com cname.zuplodocs.com
   ```
6. Redeploy your project to activate the custom domain

SSL certificates are automatically provisioned and renewed for your custom domains.

## Static Assets

Place static files (images, PDFs, etc.) in a `public` directory in your project root. These files
are served at the root path and can be referenced with absolute paths:

```
your-project/
├── public/
│   ├── images/
│   │   └── diagram.png
│   └── documents/
│       └── api-spec.pdf
└── ...
```

Reference them in your documentation:

```markdown
![API Architecture](/images/diagram.png)
```

## Pricing

Zuplo offers multiple pricing tiers to fit your needs:

- **Free**: Get started at no cost with essential features
- **Builder**: For individual developers and small teams
- **Enterprise**: Custom solutions with advanced analytics and support

Visit [zuplo.com/pricing](https://zuplo.com/pricing) for current pricing details.

## Learn More

- [Zuplo Documentation](https://zuplo.com/docs)
- [Developer Portal Guide](https://zuplo.com/docs/dev-portal/introduction)
- [API Key Management](https://zuplo.com/features/api-key-management)
- [Custom Domains](https://zuplo.com/docs/articles/custom-domains)
