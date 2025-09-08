import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, GraduationCap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Footer from './Footer';
import TestimonialChat from './TestimonialChat';
import Login from './Login';

import img1 from '../assets/image1.jpg';
import img2 from '../assets/image2.jpg';
import img3 from '../assets/image3.jpg';
import img4 from '../assets/image4.jpg';
import img5 from '../assets/image5.jpg';
import img6 from '../assets/image6.jpg';
import img7 from '../assets/image7.jpg';
import img8 from '../assets/image8.jpg';

// ✅ Pass user & setUser as props
export default function RoleSelector({ user, setUser }) {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // ✅ Redirect to dashboard on successful login
  useEffect(() => {
    if (user?.role === 'student') {
      navigate('/student-dashboard');
    } else if (user?.role === 'teacher') {
      navigate('/teacher-dashboard');
    }
  }, [user, navigate]);

  const handleSelect = (role) => {
    navigate(role === 'student' ? '/student-login' : '/teacher-login');
  };

  const imageSets = [
    [img1, img2, img3, img4, img5, img6, img7, img8],
    [img5, img6, img7, img8, img1, img2, img3, img4],
    [img3, img4, img1, img2, img7, img8, img5, img6],
  ];
  const [currentSet, setCurrentSet] = useState(0);
  const [lineIndex, setLineIndex] = useState(0);

  const heroLines = [
    'Loved by millions of students and teachers.',
    'Making learning fun and smarter.',
    'Trusted by educators worldwide.',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSet((prev) => (prev + 1) % imageSets.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setLineIndex((prev) => (prev + 1) % heroLines.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const images = imageSets[currentSet];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ☁️ Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute w-[300%] h-full animate-cloudScroll opacity-40 bg-repeat-x"
          style={{
            backgroundImage: `url("https://www.svgbackgrounds.com/wp-content/uploads/2021/05/cloudy.svg")`,
            backgroundSize: 'contain',
          }}
        />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 w-full flex justify-between items-center px-6 py-4 shadow-sm border-b bg-white">
        <h1 className="text-2xl font-bold text-blue-600">ExamDay</h1>
        <button
          onClick={() => setShowLoginModal(true)}
          className="px-4 py-2 rounded-md font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition"
        >
          Sign In
        </button>
      </nav>

      {/* Hero Section */}
      <div className="relative z-10 px-4 py-16 flex flex-col items-center bg-gradient-to-b from-sky-100 to-white">
        <h1 className="text-4xl md:text-5xl font-extrabold text-center text-gray-900 leading-tight">
          Where classrooms <br /> become communities
        </h1>

        <AnimatePresence mode="wait">
          <motion.p
            key={lineIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.6 }}
            className="mt-4 text-lg md:text-xl text-center text-gray-600"
          >
            {heroLines[lineIndex]}
            <br />
            <span className="font-semibold text-blue-600">
              Free for everyone, forever.
            </span>
          </motion.p>
        </AnimatePresence>

        <h2 className="mt-10 text-lg font-semibold text-gray-800">It’s time to start SignUp as...</h2>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <button
            onClick={() => handleSelect('student')}
            className="w-64 h-40 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md bg-white flex flex-col items-center justify-center space-y-2 transition"
          >
            <GraduationCap className="w-10 h-10 text-green-500" />
            <span className="text-lg font-semibold text-gray-800">Student</span>
            <span className="text-sm text-blue-500">→</span>
          </button>

          <button
            onClick={() => handleSelect('teacher')}
            className="w-64 h-40 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md bg-white flex flex-col items-center justify-center space-y-2 transition"
          >
            <User className="w-10 h-10 text-pink-500" />
            <span className="text-lg font-semibold text-gray-800">Teacher</span>
            <span className="text-sm text-blue-500">→</span>
          </button>
        </div>
      </div>

      {/* Images */}
      <div className="relative bg-sky-100 py-16 overflow-hidden z-10">
        <div className="relative z-10 flex justify-start flex-wrap gap-x-10 gap-y-12 px-6 max-w-6xl mx-auto">
          {images.map((img, index) => (
            <div key={index} className="flex flex-col items-center swing">
              <div className="w-1 h-10 bg-blue-300" />
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white -mt-2 z-10 shadow" />
              <img
                src={img}
                alt={`Hanging ${index + 1}`}
                className="w-44 h-44 object-cover rounded-xl border-4 border-white shadow-md transform hover:rotate-0 transition duration-500"
              />
            </div>
          ))}
        </div>
        <h2 className="mt-16 text-2xl md:text-3xl font-bold text-center text-slate-800">
          Keeping teachers and students connected
        </h2>
      </div>

      <TestimonialChat />
      <Footer />

      {/* Login Modal */}
      <Login
        showModal={showLoginModal}
        setShowModal={setShowLoginModal}
        setUser={setUser} // ✅ capture user here
      />

      {/* Animations */}
      <style>{`
        @keyframes swing {
          0% { transform: rotate(1deg); }
          50% { transform: rotate(-1.5deg); }
          100% { transform: rotate(1deg); }
        }
        .swing {
          animation: swing 4s ease-in-out infinite;
        }

        @keyframes cloudScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-66.66%); }
        }
        .animate-cloudScroll {
          animation: cloudScroll 80s linear infinite;
        }
      `}</style>
    </div>
  );
}
