'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import {
  ChevronDown,
  Clock3,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';

interface NavbarProps {
  onCreateProject?: () => void;
}

export default function Navbar({ onCreateProject }: NavbarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    queryClient.clear();
    toast.success('Logged out successfully');
    router.push('/auth');
  };

  const isActive = (path: string) => pathname === path;
  const userInitial = user?.email?.charAt(0).toUpperCase() ?? 'U';

  const navLinkClass = (path: string) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-slate-100 text-slate-950'
        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <nav className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-12">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/home" className="flex items-center gap-2.5" aria-label="APREP home">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 shadow-sm shadow-slate-900/20">
                <Image src="/brand/aprep-mark.png" alt="APREP" width={30} height={30} />
              </div>
              <span className="hidden text-lg font-bold tracking-tight text-slate-950 sm:block">
                APREP
              </span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <Link href="/home" className={navLinkClass('/home')}>
                <LayoutDashboard className="h-4 w-4" strokeWidth={1.8} />
                Projects
              </Link>
              <Link href="/history" className={navLinkClass('/history')}>
                <Clock3 className="h-4 w-4" strokeWidth={1.8} />
                History
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {onCreateProject && (
              <Button
                onClick={onCreateProject}
                size="sm"
                className="hidden rounded-xl bg-slate-950 px-3.5 hover:bg-slate-800 focus:ring-slate-500 sm:flex"
                data-tour="new-project"
              >
                <Plus className="mr-1.5 h-4 w-4" strokeWidth={2} />
                New project
              </Button>
            )}

            {onCreateProject && (
              <Button
                onClick={onCreateProject}
                size="sm"
                className="h-9 w-9 rounded-xl bg-slate-950 p-0 hover:bg-slate-800 focus:ring-slate-500 sm:hidden"
                aria-label="New project"
                data-tour="new-project"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
              </Button>
            )}

            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex max-w-[240px] items-center gap-2 rounded-xl px-2 py-1.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus:outline-none focus:ring-2 focus:ring-slate-300"
                aria-expanded={userMenuOpen}
                aria-haspopup="menu"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-xs font-semibold text-white">
                  {userInitial}
                </div>
                <span className="hidden truncate text-sm font-medium lg:block">
                  {user?.email}
                </span>
                <ChevronDown className="hidden h-3.5 w-3.5 lg:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-900/10"
                    role="menu"
                  >
                    <div className="border-b border-slate-100 px-3 py-2.5">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Account</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-900">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-1 flex w-full items-center rounded-xl px-3 py-2 text-left text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                      role="menuitem"
                    >
                      <LogOut className="mr-2 h-4 w-4" strokeWidth={1.8} />
                      Log out
                    </button>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Toggle navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="border-t border-slate-200 bg-white md:hidden">
          <div className="space-y-1 px-4 py-3">
            <Link
              href="/home"
              className={navLinkClass('/home')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-4 w-4" strokeWidth={1.8} />
              Projects
            </Link>
            <Link
              href="/history"
              className={navLinkClass('/history')}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Clock3 className="h-4 w-4" strokeWidth={1.8} />
              History
            </Link>
            {onCreateProject && (
              <button
                onClick={() => {
                  onCreateProject();
                  setMobileMenuOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
                data-tour="new-project"
              >
                <Plus className="h-4 w-4" strokeWidth={2} />
                New project
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Made with Bob
