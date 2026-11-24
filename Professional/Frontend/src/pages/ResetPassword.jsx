import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button, Field } from "../components/ui";
import { resetPassword } from "../utils/authApi";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: "", confirm: "" });
  const [error, setError] = useState("");
  const [status, setStatus] = useState("idle"); // idle | loading | done

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) return setError("Use at least 8 characters");
    if (form.password !== form.confirm) return setError("The two passwords don't match");
    setStatus("loading");
    setError("");
    try {
      await resetPassword(token, form.password);
      setStatus("done");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus("idle");
      setError(err.message || "This link is invalid or has expired.");
    }
  };

  return (
    <div className="min-h-screen bg-surface-sunken px-4 py-12 flex items-center justify-center">
      <Helmet>
        <title>Choose a new password | Kanthast</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      <div className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 md:p-9 shadow-e5">
        <h1 className="text-3xl font-black text-ink">Choose a new password</h1>
        {status === "done" ? (
          <p className="mt-4 text-ink-muted" role="status">
            Password updated. You have been signed out everywhere. Taking you to log in...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4" noValidate>
            <Field label="New password" id="reset-password" name="password" type="password" autoComplete="new-password"
              value={form.password} onChange={(e) => { setForm((f) => ({ ...f, password: e.target.value })); setError(""); }} />
            <Field label="Confirm new password" id="reset-confirm" name="confirm" type="password" autoComplete="new-password"
              value={form.confirm} onChange={(e) => { setForm((f) => ({ ...f, confirm: e.target.value })); setError(""); }} error={error} />
            <Button type="submit" fullWidth loading={status === "loading"} loadingText="Saving...">Update password</Button>
            <p className="text-center text-sm text-ink-muted">
              Link expired? <Link to="/forgot-password" className="font-semibold text-blue-700 hover:text-blue-800">Request a new one</Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
