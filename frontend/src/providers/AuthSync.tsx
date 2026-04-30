'use client';

import { useEffect } from 'react';
import { useActiveAccount, useActiveWallet } from 'thirdweb/react';
import { getProfiles } from 'thirdweb/wallets';
import { supabase } from '@/lib/supabase';
import { client } from './web3-provider';

export function AuthSync() {
  const account = useActiveAccount();
  const wallet = useActiveWallet();

  useEffect(() => {
    const syncUser = async () => {
      if (account?.address && wallet) {
        console.log('--- INICIO SINCRONIZACIÓN ---');
        console.log('Wallet ID detectado:', wallet.id);
        
        try {
          let userEmail = null;

          // En Thirdweb v5, el ID es "inApp"
          if (wallet.id === "inApp" || wallet.id === "embedded" || wallet.id === "in-app") {
            try {
              const profiles = await getProfiles({ client });
              console.log('Perfiles detectados en Thirdweb:', profiles);
              
              // Buscamos cualquier perfil que tenga email
              const emailProfile = profiles.find(p => p.type === "email" || p.type === "google" || p.type === "apple");
              
              if (emailProfile && emailProfile.details) {
                // @ts-ignore
                userEmail = emailProfile.details.email || emailProfile.details.contactInfo;
              }
            } catch (profileError) {
              console.error('Error recuperando perfiles:', profileError);
            }
          }

          console.log('Email final para Supabase:', userEmail);

          const { error } = await supabase
            .from('profiles')
            .upsert(
              { 
                wallet_address: account.address.toLowerCase(),
                email: userEmail,
                last_login: new Date().toISOString()
              }, 
              { onConflict: 'wallet_address' }
            );

          if (error) {
            console.error('Error Supabase:', error.message);
          } else {
            console.log('✓ Sincronización exitosa para:', account.address);
          }
        } catch (err: any) {
          console.error('Error en syncUser:', err.message);
        }
        console.log('--- FIN SINCRONIZACIÓN ---');
      }
    };

    syncUser();
  }, [account?.address, wallet]);

  return null;
}
