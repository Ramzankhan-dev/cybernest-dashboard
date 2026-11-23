// Sits under an email input: "Send Code" -> code box -> "Verify".
// The parent keeps `verified` and resets it to false whenever the email changes.

import { useEffect, useState } from "react";
import { sendEmailCode, confirmEmailCode } from "../../services/emailVerificationService";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const RESEND_SECONDS = 60;

export function EmailVerify({ token, email, verified, onVerified }) {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // A different email needs its own code
  useEffect(() => {
    setCodeSent(false);
    setCode("");
    setMessage("");
  }, [email]);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const trimmed = (email || "").trim();
  const validFormat = EMAIL_REGEX.test(trimmed);

  function show(msg, error) {
    setMessage(msg);
    setIsError(error);
  }

  async function handleSend() {
    if (!validFormat) { show("Enter a valid email first", true); return; }
    setBusy(true);
    try {
      await sendEmailCode(token, trimmed);
      setCodeSent(true);
      setCode("");
      setCooldown(RESEND_SECONDS);
      show(`Code sent to ${trimmed}. It expires in 10 minutes.`, false);
    } catch (err) {
      show(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!/^\d{6}$/.test(code.trim())) { show("Enter the 6-digit code", true); return; }
    setBusy(true);
    try {
      await confirmEmailCode(token, trimmed, code.trim());
      show("", false);
      onVerified(true);
    } catch (err) {
      show(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  if (verified) {
    return <p style={{ fontSize: "0.78rem", color: "var(--success, #16a34a)", margin: "0.3rem 0 0" }}>✓ Email verified</p>;
  }

  return (
    <div style={{ marginTop: "0.35rem" }}>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", alignItems: "center" }}>
        <button type="button" className="ghost-dark" onClick={handleSend} disabled={busy || !validFormat || cooldown > 0}>
          {cooldown > 0 ? `Resend in ${cooldown}s` : codeSent ? "Resend Code" : "Send Code"}
        </button>
        {codeSent && (
          <>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              style={{ width: "8rem" }}
            />
            <button type="button" onClick={handleVerify} disabled={busy || code.length !== 6}>
              {busy ? "..." : "Verify"}
            </button>
          </>
        )}
      </div>
      {message && (
        <p className={isError ? "error-text" : undefined}
           style={{ fontSize: "0.75rem", margin: "0.25rem 0 0", color: isError ? undefined : "var(--text-muted)" }}>
          {message}
        </p>
      )}
    </div>
  );
}
