import { FloatingCart } from "@/components/public/FloatingCart";
import { FloatingCartaButton } from "@/components/public/FloatingCartaButton";
import { SiteFooter } from "@/components/public/SiteFooter";
import { SiteHeader } from "@/components/public/SiteHeader";
import { WelcomeModal } from "@/components/public/WelcomeModal";
import { CartProvider } from "@/lib/cart";
import { CartaOrderProvider } from "@/lib/cartaOrder";
import { VisitorProvider } from "@/lib/visitor";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <VisitorProvider>
      <CartProvider>
        <CartaOrderProvider>
          <div className="flex min-h-full flex-col">
            <SiteHeader />
            <main className="flex-1">{children}</main>
            <SiteFooter />
            <FloatingCart />
            <FloatingCartaButton />
            <WelcomeModal />
          </div>
        </CartaOrderProvider>
      </CartProvider>
    </VisitorProvider>
  );
}
