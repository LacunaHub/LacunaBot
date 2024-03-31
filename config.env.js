require('dotenv').config()

process.env.LCN_WEBSITE_PORT ??= '8000'
process.env.LCN_API_URL =
    process.env.NODE_ENV === 'development'
        ? `http://${process.env.LCN_ROOT_DOMAIN}:${process.env.LCN_API_PORT}`
        : `https://api.${process.env.LCN_ROOT_DOMAIN}`
process.env.LCN_WEBSITE_URL =
    process.env.NODE_ENV === 'development'
        ? `http://${process.env.LCN_ROOT_DOMAIN}:${process.env.LCN_WEBSITE_PORT}`
        : `https://${process.env.LCN_ROOT_DOMAIN}`
