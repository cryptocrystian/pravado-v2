/**
 * App shell layout with sidebar navigation
 */

import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getCurrentUser } from '@/lib/getCurrentUser';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getCurrentUser();

  if (!session) {
    redirect('/login');
  }

  if (!session.activeOrg) {
    redirect('/onboarding');
  }

  const navItems = [
    {
      name: 'Dashboard',
      href: '/app',
      icon: '📊',
      active: true,
    },
    {
      name: 'PR',
      href: '/app/pr',
      icon: '📰',
      active: false,
    },
    {
      name: 'Content',
      href: '/app/content',
      icon: '✍️',
      active: false,
    },
    {
      name: 'SEO',
      href: '/app/seo',
      icon: '🔍',
      active: false,
    },
    {
      name: 'Playbooks',
      href: '/app/playbooks',
      icon: '📚',
      active: false,
    },
    {
      name: 'Agents',
      href: '/app/agents',
      icon: '🤖',
      active: false,
    },
    {
      name: 'Analytics',
      href: '/app/analytics',
      icon: '📈',
      active: false,
    },
  ];

  const settingsItems = [
    {
      name: 'Team',
      href: '/app/team',
      icon: '👥',
      active: false,
    },
    {
      name: 'Settings',
      href: '/app/settings',
      icon: '⚙️',
      active: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Pravado</h1>
        </div>

        {/* Organization */}
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-semibold text-sm">
              {session.activeOrg.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.activeOrg.name}
              </p>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${
                  item.active
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}

          {/* Settings Section */}
          <div className="pt-4 mt-4 border-t border-gray-200">
            {settingsItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`
                  flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${
                    item.active
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User Info */}
        <div className="px-4 py-4 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            {session.user.avatarUrl ? (
              <img
                src={session.user.avatarUrl}
                alt={session.user.fullName || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                {session.user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {session.user.fullName || 'User'}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center px-8">
          <div className="flex-1">
            {/* Breadcrumbs or page title can go here */}
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
