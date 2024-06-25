export const PayPalAPI = process.env.NODE_ENV === 'development' ? 'https://api-m.sandbox.paypal.com' : 'https://api-m.paypal.com'
export const SubscriptionPlans =
    process.env.NODE_ENV === 'development'
        ? {
              Monthly: 'P-9TH11058LS923283HMZRULMQ',
              Annual: ''
          }
        : {}

export interface HATEOASLink {
    href: string
    rel: HATEOASLinkRel
    method: HATEOASLinkType
}

export type HATEOASLinkRel = 'self' | 'approve' | 'edit' | 'update' | 'capture'

export type HATEOASLinkType = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'CONNECT' | 'OPTIONS' | 'PATCH'
