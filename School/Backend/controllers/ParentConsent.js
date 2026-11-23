import crypto from "crypto";
import ParentConsent from "../models/ParentConsent.js";
import mailSender from "../utils/mailSender.js";
import { parentConsentTemplate } from "../mail/templates/parentConsent.js";
import { textField } from "../utils/textInput.js";

const CODE_TTL_MS = 15 * 60 * 1000;
const RESEND_AFTER_MS = 60 * 1000;
const MAX_ATTEMPTS = 5;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const termsVersion = () => process.env.CONSENT_TERMS_VERSION || "2026-11";
const hashCode = (userId, code) =>
  crypto.createHmac("sha256", process.env.JWT_SECRET || "").update(`${userId}:${code}`).digest("hex");

const maskEmail = (email = "") => {
  const [name, domain] = String(email).split("@");
  if (!domain) return "";
  return `${name.slice(0, 2)}${"*".repeat(Math.max(1, name.length - 2))}@${domain}`;
};

const publicView = (consent) =>
  consent
    ? {
        status: consent.status,
        parentName: consent.parentName,
        parentEmail: maskEmail(consent.parentEmail),
        approvedAt: consent.approvedAt,
        withdrawnAt: consent.withdrawnAt,
      }
    : { status: "none" };

export const getConsent = async (req, res) => {
  try {
    const consent = await ParentConsent.findOne({ user: req.user._id });
    return res.status(200).json({ success: true, consent: publicView(consent) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const requestConsent = async (req, res) => {
  try {
    const parentName = textField(req.body?.parentName);
    const parentEmail = textField(req.body?.parentEmail).toLowerCase();
    if (parentName.length < 2 || parentName.length > 80) {
      return res.status(400).json({ success: false, message: "Enter your parent's or guardian's full name." });
    }
    if (!EMAIL.test(parentEmail)) {
      return res.status(400).json({ success: false, message: "Enter your parent's email address." });
    }
    if (parentEmail === String(req.user.email || "").toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: "Use your parent's own email address, not the one on your account.",
      });
    }

    let consent = await ParentConsent.findOne({ user: req.user._id });
    if (consent?.status === "approved") {
      return res.status(409).json({ success: false, message: "A parent has already approved." });
    }
    if (consent?.codeSentAt && Date.now() - consent.codeSentAt.getTime() < RESEND_AFTER_MS) {
      return res.status(429).json({ success: false, message: "A code was just sent. Wait a minute before asking again." });
    }

    const code = String(crypto.randomInt(100000, 1000000));
    consent = consent || new ParentConsent({ user: req.user._id });
    Object.assign(consent, {
      parentName,
      parentEmail,
      status: "pending",
      codeHash: hashCode(req.user._id, code),
      codeExpiresAt: new Date(Date.now() + CODE_TTL_MS),
      codeSentAt: new Date(),
      attempts: 0,
      withdrawnAt: null,
    });
    await consent.save();

    try {
      await mailSender(
        parentEmail,
        "Approve Doubts on Kanthast School for your child",
        parentConsentTemplate({
          parentName,
          studentName: req.user.firstName,
          schoolClass: req.user.schoolClass,
          code,
        })
      );
    } catch {
      // Let the student retry straight away instead of waiting out the resend delay.
      consent.codeSentAt = null;
      await consent.save();
      return res.status(502).json({ success: false, message: "We couldn't send the email. Check the address and try again." });
    }

    return res.status(200).json({ success: true, consent: publicView(consent) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyConsent = async (req, res) => {
  try {
    const code = textField(req.body?.code);
    // Claim one try in a single atomic step before the code is compared. Reading the count and saving it
    // later would let many requests sent at once all see a low count and all get a guess.
    const consent = await ParentConsent.findOneAndUpdate(
      {
        user: req.user._id,
        status: "pending",
        codeHash: { $ne: "" },
        codeExpiresAt: { $gt: new Date() },
        attempts: { $lt: MAX_ATTEMPTS },
      },
      { $inc: { attempts: 1 } },
      { new: true }
    );
    if (!consent) {
      // Nothing was claimed: read the record only to say why.
      const current = await ParentConsent.findOne({ user: req.user._id });
      if (!current || current.status !== "pending" || !current.codeHash) {
        return res.status(400).json({ success: false, message: "Ask for a code first." });
      }
      if (!current.codeExpiresAt || current.codeExpiresAt.getTime() <= Date.now()) {
        return res.status(410).json({ success: false, message: "That code has expired. Ask for a new one." });
      }
      return res.status(429).json({ success: false, message: "Too many wrong tries. Ask for a new code." });
    }

    const expected = Buffer.from(consent.codeHash, "hex");
    const given = Buffer.from(hashCode(req.user._id, code), "hex");
    if (!/^\d{6}$/.test(code) || expected.length !== given.length || !crypto.timingSafeEqual(expected, given)) {
      // The try was already counted above.
      return res.status(400).json({ success: false, message: "That code is not right." });
    }

    Object.assign(consent, {
      status: "approved",
      approvedAt: new Date(),
      codeHash: "",
      codeExpiresAt: null,
      attempts: 0,
      termsVersion: termsVersion(),
    });
    await consent.save();
    return res.status(200).json({ success: true, consent: publicView(consent) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const withdrawConsent = async (req, res) => {
  try {
    const consent = await ParentConsent.findOne({ user: req.user._id });
    if (!consent || consent.status !== "approved") {
      return res.status(400).json({ success: false, message: "There is no approval to withdraw." });
    }
    Object.assign(consent, { status: "withdrawn", withdrawnAt: new Date() });
    await consent.save();
    return res.status(200).json({ success: true, consent: publicView(consent) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
