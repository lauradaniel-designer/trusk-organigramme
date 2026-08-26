import { createClient } from "@supabase/supabase-js";

/* Le Marketplace Vercel injecte les identifiants Supabase sous des noms
   variables selon l'intégration ; seules les variables préfixées VITE_ sont
   exposées au navigateur, les autres ne servent qu'au build. */
const env = import.meta.env;
const url = env.VITE_SUPABASE_URL || env.VITE_PUBLIC_SUPABASE_URL;
const key =
  env.VITE_SUPABASE_ANON_KEY ||
  env.VITE_PUBLIC_SUPABASE_ANON_KEY ||
  env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  throw new Error(
    "Variables d'environnement manquantes : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY. " +
      "Voir .env.example et le README."
  );
}

export const supabase = createClient(url, key);

/* L'organigramme entier tient dans une ligne : à cette échelle (une centaine
   de fiches, quelques modifications par mois), un document JSON est plus
   simple à maintenir qu'un schéma relationnel, et rend l'export trivial. */
const ROW_ID = 1;

export async function loadState() {
  const { data, error } = await supabase
    .from("org_state")
    .select("data")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) throw error;
  return data?.data ?? null;
}

export async function saveState(payload) {
  const { error } = await supabase
    .from("org_state")
    .upsert({ id: ROW_ID, data: payload, updated_at: new Date().toISOString() });
  if (error) throw error;
}

/* Authentification — remplace le code d'accès en clair de la version artifact */
export function onAuth(cb) {
  supabase.auth.getSession().then(({ data }) => cb(data.session));
  const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => cb(session));
  return () => sub.subscription.unsubscribe();
}

export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOut() {
  await supabase.auth.signOut();
}
