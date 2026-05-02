import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { vaultId, emails, title } = await req.json();
    
    if (!vaultId || !emails || !Array.isArray(emails)) {
      return NextResponse.json({ success: false, error: "Bad request" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.warn("Supabase keys missing. Simulating invitations.");
      return NextResponse.json({ success: true, count: emails.length, simulated: true });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const invitations = emails.map((email: string) => ({
      vault_id: vaultId.toLowerCase(),
      email: email.trim(),
      invite_token: crypto.randomUUID(),
      status: 'pending'
    }));
    
    // In a real production app, we would loop through and trigger Resend for each email.
    // Example: await resend.emails.send({ to: email, subject: "Has sido invitado", html: `Entra aquí: /market/${vaultId}?token=${invite_token}` })
    console.log(`[Resend Webhook Mock] Sending ${invitations.length} invitations for ${title} (${vaultId})`);

    const { error } = await supabase.from('vault_invitations').insert(invitations);
    
    if (error) {
      console.error("Error inserting invitations:", error);
      // Even if it fails (e.g. table doesn't exist yet), we return a warning instead of a 500
      // so the frontend doesn't crash the user experience completely.
      return NextResponse.json({ success: false, error: error.message }, { status: 200 });
    }
    
    return NextResponse.json({ success: true, count: invitations.length });
  } catch (e: any) {
    console.error("Invite route error:", e);
    return NextResponse.json({ success: false, error: e.message }, { status: 500 });
  }
}
