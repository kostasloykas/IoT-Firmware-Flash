FROM nginx

COPY public /usr/share/nginx/html

# Copy the htpasswd file to the container
COPY docker/htpasswd /etc/nginx/.htpasswd

COPY docker/http_keys/localhost.crt etc/nginx/certs/certificate.crt
COPY docker/http_keys/localhost.key /etc/nginx/certs/certificate.key

# Copy your Nginx configuration file for credentials authedication
COPY docker/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 443
