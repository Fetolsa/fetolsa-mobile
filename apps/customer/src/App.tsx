import { useEffect } from "react";
import { HashRouter, Route, Routes, Navigate, useNavigate } from "react-router-dom";
import { BranchProvider } from "./context/BranchContext";
import { CartProvider } from "./context/CartContext";
import { CustomerProvider } from "./context/CustomerContext";
import MenuPage from "./pages/MenuPage";
import WaitlistPage from "./pages/WaitlistPage";
import OrderCallbackPage from "./pages/OrderCallbackPage";
import TrackPage from "./pages/TrackPage";
import { tenant } from "./tenant.generated";
import { setupDeepLinkHandler } from "./lib/deep-links";

function DeepLinkRouter() {
  const navigate = useNavigate();
  useEffect(() => {
    const cleanup = setupDeepLinkHandler((path) => {
      // Path arrives like "/payment/callback?order_id=X&status=Y"
      // Map vchief://payment/callback?order_id=X&status=Y -> /order/X?status=Y
      const url = new URL(`https://placeholder${path}`);
      const orderId = url.searchParams.get("order_id");
      const status = url.searchParams.get("status");
      if (orderId) {
        const search = status ? `?status=${status}` : "";
        navigate(`/order/${orderId}${search}`);
      }
    });
    return cleanup;
  }, [navigate]);
  return null;
}

export default function App() {
  const homeElement =
    tenant.launchMode === "live" ? <MenuPage /> : <WaitlistPage />;

  return (
    <BranchProvider>
      <CustomerProvider>
        <CartProvider>
          <HashRouter>
            <DeepLinkRouter />
            <Routes>
              <Route path="/" element={homeElement} />
              <Route path="/menu" element={<MenuPage />} />
              <Route path="/waitlist" element={<WaitlistPage />} />
              <Route path="/order/:orderId" element={<OrderCallbackPage />} />
              <Route path="/track/:orderId" element={<TrackPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </HashRouter>
        </CartProvider>
      </CustomerProvider>
    </BranchProvider>
  );
}