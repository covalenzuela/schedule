import { Navbar } from "@/components/layout/Navbar";
import { ModalProvider } from "@/contexts/ModalContext";
import { Modal } from "@/components/ui";
import { getSession } from "@/lib/session";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const userName = session?.name || session?.email || undefined;

  return (
    <ModalProvider>
      <Navbar userName={userName} />
      <main className="min-h-screen" style={{ background: "#000" }}>
        {children}
      </main>
      <Modal />
    </ModalProvider>
  );
}
