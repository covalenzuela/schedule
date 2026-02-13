import { Navbar, SkipToMain } from "@/components/layout";
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
      <SkipToMain />
      <Navbar userName={userName} />
      <main 
        id="main-content" 
        className="min-h-screen" 
        style={{ background: "#000" }}
        role="main"
        aria-label="Contenido principal"
      >
        {children}
      </main>
      <Modal />
    </ModalProvider>
  );
}
