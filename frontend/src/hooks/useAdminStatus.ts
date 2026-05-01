import { useState, useEffect } from 'react';
import { useActiveAccount } from 'thirdweb/react';
import { supabase } from '@/lib/supabase';

export function useAdminStatus() {
  const account = useActiveAccount();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      if (!account?.address) {
        setIsAdmin(false);
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('wallet_address', account.address.toLowerCase())
        .single();
      setIsAdmin(!!data?.is_admin);
    }
    checkAdmin();
  }, [account?.address]);

  return { isAdmin, address: account?.address };
}
