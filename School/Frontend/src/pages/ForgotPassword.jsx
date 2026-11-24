import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button, Field } from "../components/ui";
import { requestPasswordReset } from "../utils/authApi";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | sent
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email");
      return;
    }
    setStatus("loading");
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setStatus("sent");
    } catch (err) {
      setStatus("idle");
      setError(err.message || "Could not send the reset link. Try again.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-sunken px-4 py-12 flex items-center justify-center">
      <Helmet>
        <title>Reset password | Kanthast</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 md:p-9 shadow-e5">
        <h1 className="text-3xl font-black text-ink">Reset your password</h1>
        {status === "sent" ? (
          <div className="mt-4 space-y-4" role="status">
            <p className="text-ink-muted">
              If <strong className="text-ink">{email}</strong> has an account, we have sent a reset link. It expires in 1 hour.
              Check your spam folder if it does not arrive.
            </p>
            <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">Back to log in</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <p className="text-sm text-ink-muted">Enter your account email and we will send you a link to choose a new password.</p>
            <Field
              label="Email"
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(""); }}
              error={error}
            />
            <Button type="submit" fullWidth loading={status === "loading"} loadingText="Sending...">
              Send reset link
            </Button>
            <p className="text-center text-sm text-ink-muted">
              <Link to="/login" className="font-semibold text-blue-700 hover:text-blue-800">Back to log in</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
