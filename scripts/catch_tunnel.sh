#!/bin/bash
# scripts/catch_tunnel.sh

echo "🔍 Monitoring Cloudflare tunnel URL..."

# Wait for container to exist
while ! docker ps | grep -q cloudflared; do
  sleep 2
done

# Grab the first match and send to backend
docker logs -f cloudflared 2>&1 | grep --line-buffered -m 1 -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' | while read -r url; do
    echo "🎉 Tunnel active: $url"
    curl -s -X POST "http://127.0.0.1:7051/api/v1/system/public-tunnel" \
         -H "Content-Type: application/json" \
         -d "{\"tunnel_url\": \"$url\"}"
done
