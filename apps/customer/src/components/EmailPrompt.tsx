import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, Mail } from "lucide-react";
import { useCustomer } from "../context/CustomerContext";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function EmailPrompt({ open, onClose }: Props) {
  const { updateEmail } = useCustomer();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await updateEmail(trimmed);
      setEmail("");
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save email");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    setEmail("");
    setError("");
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
        onClick={handleSkip}
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
            onClick={handleSkip}
            className="absolute top-4 right-4 p-1 hover:bg-muted rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>

          <h2 className="font-display text-2xl tracking-wider text-primary mb-1">
            ADD YOUR EMAIL
          </h2>
          <p className="text-muted-foreground text-sm mb-5">
            Get order receipts and updates by email
          </p>

          <div className="relative mb-3">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="w-full bg-muted rounded-lg pl-10 pr-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-secondary text-secondary-foreground font-condensed font-bold uppercase tracking-wider py-3 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
          <button
            onClick={handleSkip}
            className="w-full mt-2 text-muted-foreground text-sm hover:text-foreground transition-colors py-2"
          >
            Maybe later
          </button>

          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}