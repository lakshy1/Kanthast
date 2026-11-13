// Loads this app's settings before anything else reads process.env.
// kanthast.in is one Vercel project, so both backends share one set of env
// vars. This app's values are stored with the PRO_ prefix and copied to
// their plain names here; the other app's values are never read.
import dotenv from "dotenv";

dotenv.config();

const PREFIX = "PRO_";
for (const [key, value] of Object.entries(process.env)) {
  if (key.startsWith(PREFIX)) process.env[key.slice(PREFIX.length)] = value;
}
