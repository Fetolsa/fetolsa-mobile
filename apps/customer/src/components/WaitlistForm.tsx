import { useState, type FormEvent } from "react";
import { submitWaitlist, validatePhone, validateEmail, normalizePhone } from "../lib/waitlist";

type Status = "idle" | "submitting" | "success" | "error";

const COUNTRY_CODE = "+234";

export function WaitlistForm() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const fullPhone = normalizePhone(phone, COUNTRY_CODE);
    if (!validatePhone(fullPhone)) {
      setStatus("error");
      setErrorMsg("Please enter a valid phone number");
      return;
    }

    if (email && !validateEmail(email)) {
      setStatus("error");
      setErrorMsg("Please enter a valid email or leave it blank");
      return;
    }

    if (!consent) {
      setStatus("error");
      setErrorMsg("Please agree to receive updates to continue");
      return;
    }

    setStatus("submitting");
    const result = await submitWaitlist({
      phone: fullPhone,
      name: name.trim() || undefined,
      email: email.trim() || undefined,
      consent,
    });

    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setErrorMsg(
        result.error === "rate_limited"
          ? "Too many tries. Please wait a moment and try again."
          : result.error === "network_error"
            ? "Connection lost. Check your internet and try again."
            : "Something went wrong. Please try again.",
      );
    }
  }

  if (status === "success") {
    return (
      <div className="bg-accent rounded p-6 text-center">
        <div className="text-2xl mb-2">You are on the list</div>
        <p className="text-foreground/70 mb-4">
          We will message you on WhatsApp the moment the app goes live.
        </p>
        <button
          className="text-primary underline text-sm"
          onClick={() => {
            setStatus("idle");
            setPhone("");
            setName("");
            setEmail("");
            setConsent(true);
            setErrorMsg("");
          }}
        >
          Add another number
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="phone">
          Phone number <span className="text-primary">*</span>
        </label>
        <div className="flex">
          <span className="inline-flex items-center px-3 bg-accent rounded-l border border-r-0 border-foreground/20 text-foreground/70">
            {COUNTRY_CODE}
          </span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            placeholder="805 215 0719"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={status === "submitting"}
            required
            className="flex-1 px-3 py-2 rounded-r border border-foreground/20 focus:border-primary focus:outline-none disabled:bg-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="name">
          Name <span className="text-foreground/50 font-normal">(optional)</span>
        </label>
        <input
          id="name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={status === "submitting"}
          className="w-full px-3 py-2 rounded border border-foreground/20 focus:border-primary focus:outline-none disabled:bg-accent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1" htmlFor="email">
          Email <span className="text-foreground/50 font-normal">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={status === "submitting"}
          className="w-full px-3 py-2 rounded border border-foreground/20 focus:border-primary focus:outline-none disabled:bg-accent"
        />
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          disabled={status === "submitting"}
          className="mt-1 w-4 h-4 accent-primary"
        />
        <span className="text-sm text-foreground/70">
          I agree to receive order updates and offers via WhatsApp, SMS, or email.
          You can opt out anytime.
        </span>
      </label>

      {status === "error" && errorMsg && (
        <div className="text-sm text-primary bg-primary/5 border border-primary/20 rounded px-3 py-2">
          {errorMsg}
        </div>
      )}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {status === "submitting" ? "Submitting..." : "Notify me when it launches"}
      </button>
    </form>
  );
}