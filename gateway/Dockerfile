FROM nginx:stable-alpine

# Copy React build
COPY dist/ /usr/share/nginx/html

# Copy custom NGINX config
COPY default.conf /etc/nginx/conf.d/default.conf
