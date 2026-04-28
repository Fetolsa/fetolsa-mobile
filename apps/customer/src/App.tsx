import { HashRouter, Route, Routes, Navigate } from "react-router-dom";
import { BranchProvider } from "./context/BranchContext";
import MenuPage from "./pages/MenuPage";
import WaitlistPage from "./pages/WaitlistPage";
import { tenant } from "./tenant.generated";

export default function App() {
  const homeElement =
    tenant.launchMode === "live" ? <MenuPage /> : <WaitlistPage />;

  return (
    <BranchProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={homeElement} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/waitlist" element={<WaitlistPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </BranchProvider>
  );
}