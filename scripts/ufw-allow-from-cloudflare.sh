#!/bin/bash

set -e

echo "Fetching Cloudflare IP ranges..."
IPSv4="$( curl -sw '\n' https://www.cloudflare.com/ips-v4 )"
IPSv6="$( curl -sw '\n' https://www.cloudflare.com/ips-v6 )"

echo "Adding UFW rules for Cloudflare IPv4 ranges..."
for ip in $IPSv4; do
    ufw allow from "$ip" to any port 80,443 proto tcp comment 'cfipv4'
done

echo "Adding UFW rules for Cloudflare IPv6 ranges..."
for ip in $IPSv6; do
    ufw allow from "$ip" to any port 80,443 proto tcp comment 'cfipv6'
done

echo "✓ Cloudflare IP ranges added to UFW"
echo "Run 'ufw status' to verify"
