import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth
import img1 from '../assets/image1.jpg';
import img2 from '../assets/image2.jpg';
import img3 from '../assets/image3.jpg';

export default function TeacherLogin() {
  const { signup, authLoading } = useAuth(); // ✅ Get signup function
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    employeeID: '',
    title: '',
    department: '',
    experienceYears: 0,
    specialization: [],
    phoneNumber: '',
    gender: '',
    // Add other fields from your model as needed
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSpecializationChange = (e) => {
    // Assuming specialization is a comma-separated string
    const specializations = e.target.value.split(',').map(s => s.trim());
    setFormData(prev => ({ ...prev, specialization: specializations }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const result = await signup(formData, 'teacher');
    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className="w-full relative overflow-hidden bg-white">
      {/* Hero Section */}
      <div className="h-[70vh] bg-cover bg-center relative flex items-center justify-center" style={{ backgroundImage: `url(${img1})` }}>
        <div className="absolute inset-0 bg-black opacity-60 z-0" />
        <div className="relative z-10 text-white text-center px-4 max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4">Empower Your Teaching</h1>
          <p className="text-lg md:text-xl">Join a community of educators using AI to create dynamic exams, provide instant feedback, and inspire students.</p>
        </div>
      </div>
      
      {/* Signup Form Section */}
      <div className="max-w-4xl mx-auto p-6 md:p-10">
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white p-8 rounded-2xl shadow-2xl w-full relative border"
        >
          <h2 className="text-3xl font-bold text-blue-600 mb-6 text-center">Create Your Teacher Account</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
              {error && <p className="col-span-2 text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}
              <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <input type="email" name="email" placeholder="Email Address" value={formData.email} onChange={handleChange} required className="col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <input type="password" name="password" placeholder="Create Password (min. 8 characters)" value={formData.password} onChange={handleChange} required className="col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <input type="text" name="employeeID" placeholder="Employee ID (e.g., T-12345)" value={formData.employeeID} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <select name="title" value={formData.title} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Select Title...</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Lecturer">Lecturer</option>
              </select>
              <select name="department" value={formData.department} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Select Department...</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Information Technology">Information Technology</option>
                  <option value="Electronics">Electronics</option>
                  {/* Add other departments */}
              </select>
              <input type="number" name="experienceYears" placeholder="Years of Experience" value={formData.experienceYears} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <input type="text" name="specialization" placeholder="Specializations (e.g., AI, Data Science)" onChange={handleSpecializationChange} required className="col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400" />
              <select name="gender" value={formData.gender} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 bg-white">
                  <option value="">Select Gender...</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
              </select>
              <button type="submit" disabled={authLoading} className="col-span-2 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-md disabled:bg-gray-400">
                  {authLoading ? 'Creating Account...' : 'Create Account'}
              </button>
          </form>
        </motion.div>
      </div>

       {/* Feature Sections */}
       <div className="flex flex-col md:flex-row items-center justify-center px-6 py-16 gap-10 bg-gray-50 relative z-10">
          <div className="w-full md:w-1/2 flex justify-center">
              <motion.img src={img2} alt="Step 1" className="w-80 h-80 object-cover transform -rotate-3 shadow-lg rounded-xl" whileHover={{ scale: 1.05, rotate: -5 }} transition={{ type: 'spring', stiffness: 300 }} />
          </div>
          <div className="w-full md:w-1/2 text-center md:text-left max-w-md">
              <h2 className="text-3xl font-bold mb-4 text-blue-600">Upload Tests with Ease</h2>
              <p className="text-gray-600 text-lg leading-relaxed">Create and upload theory exams in minutes. Our platform intelligently manages and evaluates them for you.</p>
          </div>
      </div>
    </div>
  );
}