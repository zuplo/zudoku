---
title: Apache & Nginx
---

Zudoku generates static HTML files for each page during build. Your server must be configured to
serve these files correctly.

## Apache

Create a `.htaccess` file in your document root (alongside `index.html`):

```apache
ErrorDocument 404 /404.html

RewriteEngine On

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]
```

Requires `mod_rewrite` enabled and `AllowOverride All` in your Apache configuration. Unknown paths
fall through to Apache's real `404` response, using Zudoku's generated `404.html` as the response
body.

## Nginx

Add a `try_files` directive to your server block:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ =404;
    }

    error_page 404 /404.html;

    location = /404.html {
        internal;
    }
}
```

Do not fall back unknown paths to `index.html`; that produces a soft 404 with status `200`, which
misleads search engines and agents into treating nonexistent pages as real content.

These examples serve the generated `.md` files at their explicit URLs but do not inspect the
`Accept` header. To serve Markdown from canonical documentation URLs, implement the general
[content-negotiation contract](/docs/configuration/docs#other-hosting-providers) in your web server
or an upstream proxy.
