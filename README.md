# Appify This

faça esse arquivo vira um aplicativo funcional

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://forneceja.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/68332066-9bcf-4cae-ab77-904c3818d033).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Mercado Pago marketplace

The checkout sends each payment to the Mercado Pago account connected by the supplier. Buyers are redirected to Mercado Pago Checkout Pro, where the payment methods available to that supplier and buyer (including cards, Pix, and boleto when enabled by Mercado Pago) are shown. The app only marks an order as paid after validating the signed Mercado Pago webhook and the payment against the order.

Before enabling payments:

1. Create/configure a Mercado Pago marketplace application with OAuth and Checkout Pro enabled.
2. Set its OAuth redirect URI to `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/mercado-pago-callback`.
3. Configure the Mercado Pago payment webhook for `https://<SUPABASE_PROJECT_REF>.supabase.co/functions/v1/mercado-pago-webhook` and copy its signing secret.
4. Set these secrets in the Supabase project (never expose them as `VITE_*` variables):
   - `MP_CLIENT_ID`
   - `MP_CLIENT_SECRET`
   - `MP_REDIRECT_URI` (the exact callback URL above)
   - `MP_WEBHOOK_SECRET`
   - `APP_URL` (the public app origin, for example `https://forneceja.lovable.app`)
5. Apply the new database migration and deploy `mercado-pago-connect`, `mercado-pago-callback`, `mercado-pago-checkout`, and `mercado-pago-webhook`.

Suppliers must connect their own Mercado Pago account from their profile before buyers can check out. Do not mark payments as paid manually; the verified webhook is the payment source of truth.
