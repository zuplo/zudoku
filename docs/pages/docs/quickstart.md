---
title: Quickstart
description: Get started with Zudoku by creating a new Zudoku app using the `create-zudoku` tool.
sidebar_icon: circle-play
zuplo: false
---

Ready to build beautiful API documentation and developer portals in minutes? Zudoku's CLI tool will
have you up and running with a modern, customizable site that your developers will love.

## Prerequisites

- **Node.js** `22.12.0+` (or `20.19+`) - [Download here](https://nodejs.org/)
- A terminal or command prompt
- Your favorite code editor

## Getting Started

<Stepper>

1. **Create your new Zudoku project:**

   ```bash
   npm create zudoku@latest
   ```

   The CLI will walk you through setting up your project with interactive prompts. Choose from
   templates like API documentation, developer portals, or start from scratch.

1. **Navigate to your project:**

   ```bash
   cd your-project-name
   ```

1. **Launch the development server:**

   ```bash
   npm run dev
   ```

   🎉 **That's it!** Your Zudoku site is now running at `http://localhost:3000`. You'll see hot
   reloading as you make changes, so you can iterate quickly.

1. **What's next?**
   - Customize your [theme and colors](./customization/colors-theme.mdx)
   - Add your [OpenAPI specifications](./configuration/api-reference.md)
   - Set up [authentication](./configuration/authentication.md)
   - [Deploy your site](./deployment.md) when you're ready to go live

</Stepper>

## 🚀 Pro Tips

- Use `npm run build` to create a production build
- Check out our [examples](https://github.com/zuplo/zudoku/tree/main/examples) for inspiration
- Join our [Discord community](https://discord.zudoku.dev) for support and tips
