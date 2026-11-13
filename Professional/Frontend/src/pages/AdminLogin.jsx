import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Field } from "../components/ui";
import { adminLogin } from "../utils/authApi";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ adminId: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await adminLogin(form);
      localStorage.setItem("kanthastAdminToken", data.token);
      localStorage.setItem("kanthastAdminUser", JSON.stringify(data.user));
      toast.success("Admin login successful");
      navigate("/admin");
    } catch (error) {
      toast.error(error.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#cffafe,_#e2e8f0_55%,_#f8fafc)] grid place-items-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-3xl border border-line bg-surface p-7 shadow-e4"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-cyan-700 uppercase">Admin Access</p>
        <h1 className="mt-2 text-3xl font-black text-ink">Admin Login</h1>
        <p className="text-sm text-ink-muted mt-1">Secure access to Kanthast control panel.</p>

        <Field
          label="Admin ID"
          id="admin-id"
          name="adminId"
          autoComplete="username"
          containerClassName="mt-5"
          value={form.adminId}
          onChange={(e) => setForm((prev) => ({ ...prev, adminId: e.target.value }))}
          placeholder="Enter admin ID"
        />

        <Field
          label="Password"
          id="admin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          containerClassName="mt-3"
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
          placeholder="Enter password"
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          loadingText="Signing in..."
          className="mt-6"
        >
          Login to Admin Panel
        </Button>
      </motion.form>
    </div>
  );
}
