import { motion } from "framer-motion";
import { useLocation, Link } from "react-router-dom";
import { FaArrowLeft, FaBookOpen, FaClock, FaExpand, FaLayerGroup } from "react-icons/fa";
import Image1 from "../assets/images/Image-1.png";
import Image2 from "../assets/images/Image-2.png";
import Image3 from "../assets/images/Image-3.png";
import Image4 from "../assets/images/Image-4.png";
import Image5 from "../assets/images/Image-5.png";

function useLectureQuery() {
  const { search } = useLocation();
  const query = new URLSearchParams(search);
  return {
    module: query.get("module") || "Module",
    section: query.get("section") || "Section",
    title: query.get("title") || "Lecture",
    duration: query.get("duration") || "--:--",
  };
}

const gallery = [Image1, Image2, Image3, Image4, Image5, Image2];

export default function ImagesPage() {
  const data = useLectureQuery();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,_#dbeafe,_#f8fafc_40%,_#ecfeff_90%)] px-4 md:px-8 py-8">
      <div className="max-w-7xl mx-auto">
        <Link
          to="/lists"
          className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
        >
          <FaArrowLeft /> Back to Lists
        </Link>

        <motion.header
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="mt-4 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_22px_55px_rgba(15,23,42,0.08)]"
        >
          <p className="text-sm uppercase tracking-[0.22em] text-cyan-700 font-semibold">Image Library</p>
          <h1 className="mt-2 text-3xl md:text-4xl font-black text-slate-900">{data.title}</h1>
          <div className="mt-4 flex flex-wrap gap-3">
            <Chip icon={<FaLayerGroup />} label={data.module} />
            <Chip icon={<FaBookOpen />} label={data.section} />
            <Chip icon={<FaClock />} label={data.duration} />
          </div>
        </motion.header>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.45, ease: "easeOut" }}
          className="mt-6 grid sm:grid-cols-2 xl:grid-cols-3 gap-5"
        >
          {gallery.map((src, idx) => (
            <motion.article
              key={`${src}-${idx}`}
              whileHover={{ y: -4 }}
              className="group rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.08)]"
            >
              <div className="relative">
                <img src={src} alt={`${data.title} visual ${idx + 1}`} className="w-full h-52 object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 transition" />
                <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 text-slate-700 grid place-items-center opacity-0 group-hover:opacity-100 transition">
                  <FaExpand />
                </button>
              </div>
              <div className="p-4">
                <p className="font-semibold text-slate-900">Slide {idx + 1}</p>
                <p className="text-sm text-slate-600 mt-1">Key visual aid for rapid recall.</p>
              </div>
            </motion.article>
          ))}
        </motion.section>
      </div>
    </div>
  );
}

function Chip({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-slate-700 font-medium">
      {icon}
      {label}
    </span>
  );
}

