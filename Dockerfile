FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy all static files
COPY . /usr/share/nginx/html/

# Nginx config: serve index.html, gzip, cache headers
RUN printf 'server {\n\
    listen $PORT;\n\
    root /usr/share/nginx/html;\n\
    index painel_atrix.html;\n\
    gzip on;\n\
    gzip_types text/html text/css application/javascript;\n\
    location / {\n\
        try_files $uri $uri/ /painel_atrix.html;\n\
    }\n\
}\n' > /etc/nginx/conf.d/default.conf

# Railway injects $PORT at runtime — use envsubst to expand it
CMD sh -c "envsubst '\$PORT' < /etc/nginx/conf.d/default.conf > /etc/nginx/conf.d/app.conf \
    && rm /etc/nginx/conf.d/default.conf \
    && nginx -g 'daemon off;'"
