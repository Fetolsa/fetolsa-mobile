import { tenant } from "./tenant.generated";

export function App() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-foreground mb-2">
          {tenant.displayName}
        </h1>
        <p className="text-foreground/70 mb-6">B1 shell live</p>
        <button
          className="bg-primary text-primary-foreground px-6 py-3 rounded font-semibold"
          onClick={() => alert(`Theme works. Primary = ${tenant.theme.primary}`)}
        >
          Test theme
        </button>
        <p className="mt-8 text-sm text-foreground/50">
          {tenant.contact.phone} &middot; {tenant.contact.address}
        </p>
      </div>
    </div>
  );
}