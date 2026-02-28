import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaEye, FaEyeSlash, FaCheck } from "react-icons/fa";

export default function Signup() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    otp: "",
    phone: "",
    password: "",
    role: "Student",
  });

  const [generatedOtp, setGeneratedOtp] = useState(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState("idle"); // idle | loading | sent
  const [signupStatus, setSignupStatus] = useState("idle"); // idle | loading | success
  const [showPassword, setShowPassword] = useState(false);
  const [toast, setToast] = useState(null);

  // ---------------- HANDLE CHANGE ----------------
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ---------------- SEND OTP ----------------
  const sendOtp = () => {
    if (!form.email) {
      setToast("Enter email before sending OTP");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setOtpStatus("loading");

    setTimeout(() => {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otp);
      setOtpSent(true);
      setOtpStatus("sent");

      console.log("Generated OTP:", otp);

      setToast("OTP sent successfully!");
      setTimeout(() => setToast(null), 3000);
    }, 1200);
  };

  // ---------------- SIGNUP ----------------
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!otpSent || form.otp !== generatedOtp) {
      setToast("Invalid OTP");
      setTimeout(() => setToast(null), 3000);
      return;
    }

    setSignupStatus("loading");

    setTimeout(() => {
      console.log("Signup Data:", form);
      setSignupStatus("success");

      setToast("Account created successfully!");
      setTimeout(() => {
        setToast(null);
        setSignupStatus("idle");
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-50 via-white to-cyan-50 relative overflow-hidden">

      <div className="absolute w-150 h-150 bg-cyan-300/30 blur-3xl rounded-full pointer-events-none"></div>

      <motion.div
        initial={{ opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-10 shadow-[0_40px_80px_rgba(0,0,0,0.08)]"
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center">
          Create Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Names */}
          <div className="grid grid-cols-2 gap-4">
            <input name="firstName" placeholder="First Name" onChange={handleChange} className="inputStyle"/>
            <input name="lastName" placeholder="Last Name" onChange={handleChange} className="inputStyle"/>
          </div>

          {/* Email + OTP */}
          <div className="flex gap-3">
            <input name="email" placeholder="Email" onChange={handleChange} className="inputStyle flex-1"/>
            
            <motion.button
              type="button"
              onClick={sendOtp}
              whileTap={{ scale: 0.95 }}
              className="px-4 rounded-xl bg-blue-950 text-white min-w-28 flex items-center justify-center"
            >
              {otpStatus === "loading" ? "Sending..." : otpStatus === "sent" ? "Sent ✓" : "Send OTP"}
            </motion.button>
          </div>

          <AnimatePresence>
            {otpSent && (
              <motion.input
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                name="otp"
                placeholder="Enter OTP"
                onChange={handleChange}
                className="inputStyle"
              />
            )}
          </AnimatePresence>

          {/* Phone */}
          <input name="phone" placeholder="Phone Number" onChange={handleChange} className="inputStyle"/>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              onChange={handleChange}
              className="inputStyle"
            />
            <div
              className="absolute right-4 top-4 cursor-pointer text-slate-500"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          {/* Role */}
          <select name="role" onChange={handleChange} className="inputStyle">
            <option>Student</option>
            <option>Instructor</option>
          </select>

          {/* Signup Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full py-4 rounded-xl font-semibold bg-yellow-400 text-black shadow-lg flex items-center justify-center gap-2"
          >
            {signupStatus === "loading" && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-5 h-5 border-2 border-black border-t-transparent rounded-full"
              />
            )}

            {signupStatus === "success" && <FaCheck />}

            {signupStatus === "idle" && "Sign Up"}
            {signupStatus === "loading" && "Creating..."}
            {signupStatus === "success" && "Success"}
          </motion.button>

        </form>
      </motion.div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 right-6 bg-green-500 text-white px-6 py-4 rounded-xl shadow-2xl z-9999"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <style>
        {`
          .inputStyle {
            width: 100%;
            padding: 12px 16px;
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            outline: none;
            transition: all 0.3s ease;
          }
          .inputStyle:focus {
            border-color: #06b6d4;
            box-shadow: 0 0 0 2px rgba(6,182,212,0.2);
          }
        `}
      </style>
    </div>
  );
}