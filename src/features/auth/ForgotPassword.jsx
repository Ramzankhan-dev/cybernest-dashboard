// Forgot-password flow: email -> OTP verification -> new password.

import { useEffect, useState } from "react";
import { BrandMark } from "../../components/icons";
import { forgotPassword, resetPassword, verifyOtp } from "./authService";

export function ForgotPasswordFlow({ onBackToLogin }) {
  const [step, setStep] = useState("email"); // email | otp | reset | done
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  async function handleSendOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setStep("otp");
      setResendTimer(60);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email, otp, password);
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      className="login-card"
      onSubmit={step === "email" ? handleSendOtp : step === "otp" ? handleVerifyOtp : handleResetPassword}
    >
      <h1><BrandMark size={34} /><span>Cyber<span className="brand-accent">Nest</span></span></h1>

      {step === "email" && (
        <>
          <p className="subtitle">Enter your registered email</p>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </>
      )}

      {step === "otp" && (
        <>
          <p className="subtitle">Enter the 6-digit code sent to {email}</p>
          <label>Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            required
          />
          <p
            className="forgot-link"
            style={{ opacity: resendTimer > 0 ? 0.5 : 1, pointerEvents: resendTimer > 0 ? "none" : "auto" }}
            onClick={() => { if (resendTimer <= 0) handleSendOtp({ preventDefault: () => {} }); }}
          >
            {resendTimer > 0 ? `Resend code in ${resendTimer}s` : "Resend code"}
          </p>
        </>
      )}

      {step === "reset" && (
        <>
          <p className="subtitle">Choose a new password</p>
          <label>New password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <label>Confirm password</label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
        </>
      )}

      {step === "done" && (
        <p className="subtitle">Password updated. You can now sign in with your new password.</p>
      )}

      {error && <p className="error-text">{error}</p>}

      {step !== "done" && (
        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : step === "email" ? "Send code" : step === "otp" ? "Verify code" : "Reset password"}
        </button>
      )}

      <p
        className="forgot-link"
        role="button"
        tabIndex={0}
        onClick={onBackToLogin}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onBackToLogin(); } }}
      >
        {step === "done" ? "Back to login" : "Back to login"}
      </p>
    </form>
  );
}
