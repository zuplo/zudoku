---
title: Apache & Nginx
---

Zudoku generates static HTML files for each page during build. Your server must be configured to
serve these files correctly.

## Apache

Create a `.htaccess` file in your document root (alongside `index.html`):

```apache
RewriteEngine On

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME}.html -f
RewriteRule ^(.*)$ $1.html [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]
```

Requires `mod_rewrite` enabled and `AllowOverride All` in your Apache configuration.

## Nginx

Add a `try_files` directive to your server block:

```nginx
server {
    listen 80;
    server_name example.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri.html $uri/ /index.html;
    }
}
```
