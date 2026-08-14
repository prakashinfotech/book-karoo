import { Header } from './Header';
import { Footer } from './Footer';
import { MobileNav } from './MobileNav';

interface PublicLayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

export function PublicLayout({ children, hideFooter = false }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-bg-base">
      <Header />
      <main id="main-content" className="flex-1 pb-16 md:pb-0">{children}</main>
      {!hideFooter && <Footer />}
      <MobileNav />
    </div>
  );
}
