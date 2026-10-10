import { Link, Outlet } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Logo } from '../components/ui/Logo';

const HIGHLIGHTS = [
  'Curated templates for SaaS, e-commerce, portfolios and more',
  'Search and filter the catalog in seconds',
  'Save favorites and come back to them anytime',
];

export function AuthLayout() {
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-40 [background-image:linear-gradient(to_right,rgb(255_255_255/0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.06)_1px,transparent_1px)] [background-size:40px_40px]"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -top-40 -left-32 size-[28rem] rounded-full bg-brand-600/30 blur-3xl" />

        <Link to="/templates" className="relative w-fit rounded-md" aria-label="Template Store home">
          <Logo inverted />
        </Link>

        <div className="relative max-w-md">
          <h2 className="text-3xl leading-tight font-semibold tracking-tight text-white">
            Launch your next website with a head start.
          </h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex gap-3 text-sm text-zinc-300">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-brand-200" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-zinc-500">© {new Date().getFullYear()} Template Store</p>
      </aside>

      <main className="flex flex-col justify-center bg-white px-4 py-12 sm:px-8">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/templates" className="mb-10 inline-flex rounded-md lg:hidden" aria-label="Template Store home">
            <Logo />
          </Link>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
