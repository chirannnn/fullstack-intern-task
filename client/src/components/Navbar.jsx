import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Heart, LayoutGrid, LogOut, Menu, X } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../utils/cn';
import { Logo } from './ui/Logo';
import { buttonClasses } from './ui/buttonClasses';

const NAV_ITEMS = [
  { to: '/templates', label: 'Templates', icon: LayoutGrid },
  { to: '/favorites', label: 'Favorites', icon: Heart },
];

const navLinkClasses = ({ isActive }) =>
  cn(
    'inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
  );

function initials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    toast.success('You have been logged out.');
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link to="/templates" className="rounded-md" aria-label="Template Store home">
            <Logo />
          </Link>
          <div className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClasses}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {isAuthenticated ? (
            <>
              <div className="flex items-center gap-2.5 pr-1">
                <span
                  className="flex size-8 items-center justify-center rounded-full bg-brand-50 text-xs font-semibold text-brand-700 ring-1 ring-brand-100"
                  aria-hidden="true"
                >
                  {initials(user.name)}
                </span>
                <div className="leading-tight">
                  <p className="max-w-40 truncate text-sm font-medium text-zinc-900">{user.name}</p>
                  <p className="max-w-40 truncate text-xs text-zinc-500">{user.email}</p>
                </div>
              </div>
              <button type="button" onClick={handleLogout} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                <LogOut className="size-4" aria-hidden="true" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={buttonClasses({ variant: 'ghost', size: 'sm' })}>
                Log in
              </Link>
              <Link to="/register" className={buttonClasses({ size: 'sm' })}>
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className="inline-flex size-10 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 md:hidden"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
        </button>
      </nav>

      {menuOpen && (
        <div id="mobile-menu" className="border-t border-zinc-200 bg-white px-4 pt-3 pb-4 md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={navLinkClasses} onClick={closeMenu}>
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </div>
          <div className="mt-3 border-t border-zinc-100 pt-3">
            {isAuthenticated ? (
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-900">{user.name}</p>
                  <p className="truncate text-xs text-zinc-500">{user.email}</p>
                </div>
                <button type="button" onClick={handleLogout} className={buttonClasses({ variant: 'secondary', size: 'sm' })}>
                  <LogOut className="size-4" aria-hidden="true" />
                  Log out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link to="/login" className={buttonClasses({ variant: 'secondary' })} onClick={closeMenu}>
                  Log in
                </Link>
                <Link to="/register" className={buttonClasses()} onClick={closeMenu}>
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
