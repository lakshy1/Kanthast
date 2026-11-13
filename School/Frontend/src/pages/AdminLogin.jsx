import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, Field } from "../components/ui";
import { adminLogin } from "../utils/authApi";
import { Eyebrow, Accent } from "../components/ui/Brandmarks";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ adminId: "", password: "" });
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await adminLogin(form);
      localStorage.setItem("kanthastSchoolAdminToken", data.token);
      localStorage.setItem("kanthastSchoolAdminUser", JSON.stringify(data.user));
      toast.success("Admin login successful");
      navigate("/admin");
    } catch (error) {
      toast.error(error.message || "Admin login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(60%_60%_at_75%_25%,rgba(147,180,255,0.35),transparent_70%),#eef3fd] grid place-items-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-sheet border border-[#edf1fa] bg-surface p-7 shadow-e5"
      >
        <Eyebrow>Admin Access</Eyebrow>
        <h1 className="kx-title mt-4 text-3xl">Admin <Accent>Login</Accent></h1>
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
