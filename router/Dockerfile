FROM nginx:alpine

RUN apk update && apk add --no-cache bash

COPY nginx.conf.template /nginx.conf.template

EXPOSE 8000

CMD ["/bin/sh", "-c", \
  "envsubst '$FRONTEND_SERVICE $BACKEND_SERVICE' < /nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]
