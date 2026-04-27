import { createClient } from '@supabase/supabase-js';

const url = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) throw new Error('Ambiente de backend incompleto');

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const users = [
  { email: 'diretoria@smellgo.local', password: 'iCruzeiro1547!', display_name: 'Diretoria', role: 'diretoria' },
  { email: 'comercial@smellgo.local', password: 'BeloHorizonte2026!', display_name: 'Comercial', role: 'comercial' },
];

for (const user of users) {
  const { data: existingList, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  const existing = existingList.users.find((u) => u.email?.toLowerCase() === user.email);
  let userId = existing?.id;
  if (userId) {
    const { error } = await admin.auth.admin.updateUserById(userId, { password: user.password, email_confirm: true, user_metadata: { display_name: user.display_name } });
    if (error) throw error;
  } else {
    const { data, error } = await admin.auth.admin.createUser({ email: user.email, password: user.password, email_confirm: true, user_metadata: { display_name: user.display_name } });
    if (error) throw error;
    userId = data.user.id;
  }

  const { error: profileError } = await admin.from('profiles').upsert({ user_id: userId, display_name: user.display_name }, { onConflict: 'user_id' });
  if (profileError) throw profileError;
  const { error: roleError } = await admin.from('user_roles').upsert({ user_id: userId, role: user.role }, { onConflict: 'user_id,role' });
  if (roleError) throw roleError;
}

console.log('USERS_READY');
