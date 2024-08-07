Nginx config

    location / {
        root /home/site/html;

        if ($request_uri ~* "\/\/") {
            rewrite ^/(.*) $scheme://$host/$1 permanent;
        }

        rewrite ^([^.]*[^/])$ $1/ permanent;
        if ($request_uri ~ "^(.*)\?$") {
            return 301 $1;
        }

        rewrite ^/news/$ /blog/ permanent;
        rewrite ^/news-mass-media/$ /blog/ permanent;
        rewrite ^/news-ecom-delivery/$ /blog/ permanent;
        rewrite ^/news-company/$ /blog/ permanent;
        rewrite ^/courier-delivery-cfo-msk/$ /uslugi/ permanent;
        rewrite ^/courier-delivery-cfo-spb/$ /uslugi/ permanent;

        set $isbot 0;
        if ($http_user_agent ~* "googlebot|yahoo|bingbot|baiduspider|yandex|yeti|yodaobot|gigabot|ia_archiver|bot|curl|wget|facebookexternalhit|twitterbot|developers\.google\.com") {
            set $isbot 1;
        }

        if ($request_uri ~* "/(media|static|favicon)") {
            set $isbot 0;
        }

        if ($request_uri ~* "\.(txt|xml|json|xls|xlsx|doc|docx|pdf|ico|jpg|png)$") {
            set $isbot 0;
        }

        if ($isbot) {
            # SSR configuration
            rewrite ^ /render?url=$scheme://$host$request_uri last;
        }

        try_files $uri $uri/ /index.html;
    }

    location /render {
        proxy_pass http://dalli-ssr:3000;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Host $host;
        proxy_set_header X-NginX-Proxy true;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_connect_timeout 90s;
        proxy_read_timeout 90s;
    }
