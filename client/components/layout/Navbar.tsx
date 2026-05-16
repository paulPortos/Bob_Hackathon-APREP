'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Button from '@/components/ui/Button';
import { LogOut, Home, History, Plus, User, Menu, X } from 'lucide-react';
import toast from 'react-hot-toast';

interface NavbarProps {
  onCreateProject?: () => void;
}

export default function Navbar({ onCreateProject }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/auth');
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and Nav Links */}
          <div className="flex items-center">
            {/* Logo */}
            <Link href="/home" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                APREP
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex ml-10 space-x-4">
              <Link
                href="/home"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/home')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Home className="inline h-4 w-4 mr-1" />
                Home
              </Link>
              <Link
                href="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-primary-50 text-primary-600'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <History className="inline h-4 w-4 mr-1" />
                History
              </Link>
            </div>
          </div>

          {/* Right side - Create Project and User Menu */}
          <div className="flex items-center space-x-4">
            {/* Create Project Button */}
            {onCreateProject && (
              <Button
                onClick={onCreateProject}
                size="sm"
                className="hidden sm:flex"
              >
                <Plus className="h-4 w-4 mr-1" />
                Create Project
              </Button>
            )}

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors"
              >
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4" />
                </div>
                <span className="hidden md:block text-sm font-medium">
                  {user?.email}
                </span>
              </button>

              {/* User Dropdown */}
              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm text-gray-500">Signed in as</p>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user?.email}
                      </p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Logout
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 hover:bg-gray-100"
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

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200">
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link
              href="/home"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/home')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Home className="inline h-4 w-4 mr-2" />
              Home
            </Link>
            <Link
              href="/history"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/history')
                  ? 'bg-primary-50 text-primary-600'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <History className="inline h-4 w-4 mr-2" />
              History
            </Link>
            {onCreateProject && (
              <button
                onClick={() => {
                  onCreateProject();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-100"
              >
                <Plus className="inline h-4 w-4 mr-2" />
                Create Project
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

// Made with Bob
