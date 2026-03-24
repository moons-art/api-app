// Deployment Timestamp: 2026-03-23 21:14:00
export const dynamic = "force-dynamic";
import { auth, signIn, signOut } from "@/auth";
import MainApp from "@/components/MainApp";

export default async function Home() {
  const session = await auth();

  const signInAction = async () => {
    "use server";
    await signIn("google");
  };

  const signOutAction = async () => {
    "use server";
    await signOut();
  };

  return <MainApp session={session} signInAction={signInAction} signOutAction={signOutAction} />;
}
