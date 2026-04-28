import { tenant } from "../tenant.generated";

export function Footer() {
  return (
    <footer className="text-center text-xs text-foreground/50 mt-12 space-y-2">
      {tenant.contact.phone && <div>{tenant.contact.phone}</div>}
      {tenant.contact.address && <div>{tenant.contact.address}</div>}
      <div className="pt-2">Powered by Fetolsa</div>
    </footer>
  );
}