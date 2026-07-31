'use client';

import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface LogoutButtonProps {
  className?: string;
}

export default function LogoutButton({ className }: LogoutButtonProps) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className={
        className ||
        "rounded-lg border border-[#E62429]/40 px-3.5 py-1.5 text-xs font-semibold text-[#E62429] transition-all duration-200 hover:bg-[#E62429]/10 active:scale-[0.98]"
      }
    >
      Log Out
    </button>
  );
}
