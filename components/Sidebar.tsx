'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import LogoutButton from '@/app/dashboard/LogoutButton';

interface SidebarProps {
  userEmail: string;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
  nextDeadlineMins?: number;
  nextDeadlineTitle?: string;
}

export default function Sidebar({
  userEmail,
  isMobileOpen,
  setIsMobileOpen,
  nextDeadlineMins = 25,
  nextDeadlineTitle = 'Focus Session',
}: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Overview',
      href: '/dashboard',
      icon: 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z',
    },
    {
      label: "Today's Plan",
      href: '/today',
      icon: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    },
    {
      label: 'All Tasks',
      href: '/tasks',
      icon: 'M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm0 5.25h.007v.008H3.75V12zm0 5.25h.007v.008H3.75v-.008z',
    },
    {
      label: 'Stats',
      href: '/stats',
      icon: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z',
    },
  ];

  return (
    <>
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 flex-col justify-between border-r border-white/10 bg-[#0D0A0B]/85 backdrop-blur-2xl transition-transform duration-300 md:flex ${
          isMobileOpen ? 'flex translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-6">
          {/* Brand Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 mb-10 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E62429] font-black text-white shadow-lg shadow-[#E62429]/30 transition group-hover:scale-105">
              P
            </div>
            <span className="text-xl font-extrabold tracking-tight text-foreground">
              Plan<span style={{ color: '#E62429' }}>R</span>
            </span>
          </Link>

          {/* Nav Items */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? 'bg-[#E62429]/15 text-[#E62429] border border-[#E62429]/30 shadow-md shadow-[#E62429]/10'
                      : 'text-foreground/60 hover:bg-white/5 hover:text-foreground'
                  }`}
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom Cards */}
        <div className="p-4 space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md p-4 shadow-inner">
            <div className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">
              Next Deadline
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#E62429]">{nextDeadlineMins}</span>
              <span className="text-xs font-medium text-foreground/50">mins</span>
            </div>
            <p className="mt-1 truncate text-xs text-foreground/60 font-medium">
              {nextDeadlineTitle}
            </p>
          </div>

          <div className="flex items-center justify-between border-t border-white/10 pt-4 px-1">
            <div className="truncate pr-2">
              <p className="text-xs font-semibold text-foreground truncate">{userEmail.split('@')[0]}</p>
              <p className="text-[10px] text-foreground/40 truncate">{userEmail}</p>
            </div>
            <LogoutButton className="rounded-lg border border-[#E62429]/40 px-2.5 py-1 text-[11px] font-semibold text-[#E62429] hover:bg-[#E62429]/10 transition" />
          </div>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}
    </>
  );
}
