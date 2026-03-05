import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
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
        className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(15,23,42,0.12)]"
      >
        <p className="text-xs font-semibold tracking-[0.18em] text-cyan-700 uppercase">Admin Access</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Admin Login</h1>
        <p className="text-sm text-slate-600 mt-1">Secure access to Kanthast control panel.</p>

        <label className="block mt-5">
          <span className="text-sm font-medium text-slate-700">Admin ID</span>
          <input
            value={form.adminId}
            onChange={(e) => setForm((prev) => ({ ...prev, adminId: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-cyan-400 outline-none"
            placeholder="Admin"
          />
        </label>

        <label className="block mt-3">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 focus:ring-2 focus:ring-cyan-400 outline-none"
            placeholder="Admin123456789"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-6 w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Login to Admin Panel"}
        </button>
      </motion.form>
    </div>
  );
}
