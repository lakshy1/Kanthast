import './App.css'
import { Route, Routes} from "react-router-dom"
import { useState, useEffect } from "react"
import { AnimatePresence } from "framer-motion"
import Homepage from './pages/Homepage'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import About from './pages/About'
import Contact from './pages/Contact'
import Courses from './pages/Courses'
import Login from './pages/Login'
import Signup from './pages/Signup'
import PageLoader from './pages/PageLoader'


function App() {

   const [loading, setLoading] = useState(false);

  useEffect(() => {
    const hasLoaded = sessionStorage.getItem("kanthastLoaded");

    if (!hasLoaded) {
      setLoading(true);

      const timer = setTimeout(() => {
        setLoading(false);
        sessionStorage.setItem("kanthastLoaded", "true");
      }, 2000); // duration of intro animation

      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      
       <div className="min-h-screen w-screen">

      <Navbar />

      <AnimatePresence>
        {loading && <PageLoader />}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/courses" element={<Courses />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>

      <Footer />

    </div>
    </>
    
)}

export default App
