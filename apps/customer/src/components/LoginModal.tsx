import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Phone, KeyRound } from "lucide-react";
import { requestOtp, verifyOtp } from "../lib/auth-api";
import { useCustomer } from "../context/CustomerContext";

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function LoginModal({ open, onClose, onSuccess }: Props) {
  const { login } = useCustomer();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setStep("phone");
    setPhone("");
    setOtp("");
    setName("");
    setError("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSendOtp = async () => {
    const trimmed = phone.trim();
    if (!trimmed || trimmed.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await requestOtp(trimmed);
      if (result?.status === "ok") {
        setStep("otp");
      } else {
        setError(result?.message || "Failed to send OTP");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setError("Please enter the 6-digit code");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const result = await verifyOtp({
        phone: phone.trim(),
        otp,
        name: name.trim() || undefined,
      });
      if (result?.status === "ok" && result.token && result.customer_id) {
        login(
          result.token,
          {
            id: result.customer_id,
            name: result.customer_name || name || phone,
            phone: result.phone || phone,
            email: result.email || null,
          },
          [],
        );
        resetForm();
        onClose();
        onSuccess?.();
      } else {
        setError(result?.message || "Verification failed");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code, try again");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  const inputClass =
    "w-full bg-muted rounded-lg px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{ backgroundColor: "#ffffff" }}
          className="rounded-xl w-full max-w-sm p-6 relative shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <h2 className="font-display text-2xl tracking-wider text-primary mb-1">
            {step === "phone" ? "SIGN IN" : "VERIFY"}
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            {step === "phone"
              ? "Enter your phone number to get started"
              : `We sent a code to ${phone}`}
          </p>

          {step === "phone" ? (
            <div className="space-y-3">
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, ""))}
                  placeholder="08012345678"
                  type="tel"
                  inputMode="tel"
                  pattern="[0-9+]*"
                  autoComplete="tel"
                  enterKeyHint="send"
                  className={`${inputClass} pl-10`}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Send Code
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  value={otp}
                  onChange={(e) =>
                    setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  placeholder="6-digit code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className={`${inputClass} pl-10 tracking-[0.3em] text-center font-mono`}
                  onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                />
              </div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name (optional, for new accounts)"
                autoCapitalize="words"
                autoComplete="name"
                className={inputClass}
              />
              <button
                onClick={handleVerify}
                disabled={loading}
                className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Verify &amp; Continue
              </button>
              <button
                onClick={() => setStep("phone")}
                className="w-full text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
              >
                &larr; Use a different number
              </button>
            </div>
          )}

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}