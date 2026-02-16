import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export async function getAuthContext() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { authUser: null, appUser: null };
  }

  const appUser = await prisma.user.upsert({
    where: { supabaseUserId: user.id },
    update: {},
    create: { supabaseUserId: user.id }
  });

  return { authUser: user, appUser };
}
