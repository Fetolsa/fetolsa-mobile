import { Logo } from "./components/Logo";
import { WaitlistForm } from "./components/WaitlistForm";
import { Footer } from "./components/Footer";
import { tenant } from "./tenant.generated";

export function App() {
  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-12">
      <div className="w-full max-w-md flex-1">
        <header className="text-center mb-8">
          <Logo className="mb-6" />
          <h1 className="text-3xl font-bold mb-2">{tenant.displayName}</h1>
          <p className="text-foreground/70">
            Order your favorites. Coming soon to your phone.
          </p>
        </header>

        <WaitlistForm />

        <Footer />
      </div>
    </div>
  );
}