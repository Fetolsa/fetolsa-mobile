import { WaitlistForm } from "../components/WaitlistForm";
import { tenant } from "../tenant.generated";

export default function WaitlistPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl text-primary tracking-wider uppercase">
            {tenant.displayName}
          </h1>
          <p className="text-muted-foreground mt-2 font-condensed">
            Order your favorites. Coming soon to your phone.
          </p>
        </div>
        <WaitlistForm />
      </div>
    </div>
  );
}