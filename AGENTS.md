<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- The Fornece Já app is a single-screen state machine in src/components/fornece, talking to the database directly with RLS; privileged actions (view counts, order status) go through SECURITY DEFINER RPCs. Why: mirrors the original mobile-style app with minimal routing.
- One login can hold both roles: profiles.tipos lists enabled roles and profiles.tipo is the active one (a trigger keeps tipos in sync). Why: lets the same email switch between comprador and fornecedor without a second account.
- The app frame uses dynamic viewport height with independently scrollable screens and touch-sized controls below the desktop breakpoint. Why: browser bars and on-screen keyboards must not shrink or clip mobile content.
- Product photos are stored privately and displayed through refreshed signed URLs in ProductPhoto. Why: storage policies block public buckets while authenticated catalog users still need to see images.
