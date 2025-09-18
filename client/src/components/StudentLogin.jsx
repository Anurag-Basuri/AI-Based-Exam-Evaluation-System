import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Award, MessageSquare, X, ChevronRight, ChevronLeft } from 'lucide-react';
import Globe from 'react-globe.gl';
import { useAuth } from '../context/AuthContext';

// --- Mock Data & Child Components (No changes needed here) ---
const testimonials = [
    { name: 'Sarah L.', quote: "AiEXAM's personalized feedback helped me identify my weak spots and improve my scores dramatically. It's a game-changer!", image: 'https://i.pravatar.cc/150?img=1' },
    { name: 'David C.', quote: "The interface is so intuitive and the exams are actually engaging. I've never felt more prepared.", image: 'https://i.pravatar.cc/150?img=2' },
    { name: 'Maria G.', quote: 'The instant results and detailed analytics are incredible. I can track my progress and focus my efforts where it matters most.', image: 'https://i.pravatar.cc/150?img=3' },
];
const HeroSection = ({ onGetStarted }) => {
    return (
        <div className="h-screen bg-gray-900 relative flex items-center justify-center text-white text-center overflow-hidden">
            <div className="absolute inset-0 z-0">
                <Globe globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg" atmosphereColor="rgba(88, 81, 216, 0.7)" atmosphereAltitude={0.25} />
            </div>
            <div className="relative z-10 p-4">
                <motion.h1 initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut" }} className="text-5xl md:text-7xl font-extrabold mb-4">A New World of Learning</motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1, delay: 0.5 }} className="text-lg md:text-xl max-w-3xl mx-auto mb-8">Step into a smarter, more personalized educational experience. AiEXAM adapts to you, so you can achieve more.</motion.p>
                <motion.button onClick={onGetStarted} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="px-8 py-3 rounded-full bg-indigo-500 text-white font-bold text-lg hover:bg-indigo-600 transition-all duration-300 shadow-lg">Begin Your Journey</motion.button>
            </div>
        </div>
    );
};
const FeaturesSection = () => (
    <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
            <h2 className="text-4xl font-bold text-center text-gray-800 mb-12">Why Students Thrive with AiEXAM</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <FeatureCard icon={<BookOpen />} title="Adaptive Learning" description="Our AI curates study paths just for you, turning weaknesses into strengths." />
                <FeatureCard icon={<Award />} title="Intelligent Exams" description="Experience fair, challenging exams that provide instant, actionable feedback." />
                <FeatureCard icon={<MessageSquare />} title="Real-Time Insights" description="Track your progress with detailed analytics and understand exactly where you stand." />
            </div>
        </div>
    </section>
);
const FeatureCard = ({ icon, title, description }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.5 }} transition={{ duration: 0.6 }} className="bg-gray-50 p-8 rounded-xl text-center flex flex-col items-center hover:shadow-xl transition-shadow">
        <div className="text-indigo-500 text-4xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </motion.div>
);
const TestimonialsSection = () => {
    const [current, setCurrent] = useState(0);
    const nextTestimonial = () => setCurrent(current === testimonials.length - 1 ? 0 : current + 1);
    const prevTestimonial = () => setCurrent(current === 0 ? testimonials.length - 1 : current - 1);
    useEffect(() => {
        const timer = setTimeout(nextTestimonial, 5000);
        return () => clearTimeout(timer);
    }, [current]);
    return (
        <section className="py-20 bg-indigo-50">
            <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold text-gray-800 mb-12">From Our Students</h2>
                <div className="relative max-w-2xl mx-auto h-64">
                    <AnimatePresence>
                        <motion.div key={current} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="absolute inset-0 flex flex-col items-center justify-center">
                            <img src={testimonials[current].image} alt={testimonials[current].name} className="w-20 h-20 rounded-full mb-4 shadow-lg" />
                            <p className="text-xl italic text-gray-700">"{testimonials[current].quote}"</p>
                            <h4 className="mt-4 text-lg font-bold text-indigo-600">- {testimonials[current].name}</h4>
                        </motion.div>
                    </AnimatePresence>
                    <button onClick={prevTestimonial} className="absolute left-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/50 hover:bg-white transition"><ChevronLeft /></button>
                    <button onClick={nextTestimonial} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/50 hover:bg-white transition"><ChevronRight /></button>
                </div>
            </div>
        </section>
    );
};


// --- Main Component ---
export default function StudentLogin() {
    const handleGetStarted = () => {
        const signupSection = document.getElementById('signup');
        if (signupSection) {
            signupSection.scrollIntoView({ behavior: 'smooth' });
        }
    };
    return (
        <div className="w-full relative overflow-hidden bg-white">
            <HeroSection onGetStarted={handleGetStarted} />
            <FeaturesSection />
            <SignupForm />
            <TestimonialsSection />
        </div>
    );
}

// --- Signup Form Component with Fixes ---
const SignupForm = () => {
    const { signup, authLoading } = useAuth();
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        rollNumber: '',
        registrationID: '',
        phoneNumber: '',
        gender: 'male',
        year: '1',
        semester: '1', // ✅ Initial value
        section: 'A',    // ✅ Initial value
        department: 'Computer Science',
        address: {
            street: '', city: '', state: '', postalCode: '', country: 'India'
        }
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, [name]: value }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const result = await signup(formData, 'student');
        if (!result.success) {
            setError(result.message);
        }
    };

    return (
        <section className="py-20 bg-gray-50" id="signup">
            <div className="container mx-auto px-6 max-w-4xl">
                 <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.6 }}
                    className="bg-white p-8 rounded-2xl shadow-2xl w-full relative border"
                >
                    <h2 className="text-3xl font-bold text-indigo-600 mb-6 text-center">Create Your Student Account</h2>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                        {error && <p className="md:col-span-2 text-red-500 text-sm text-center bg-red-100 p-3 rounded-lg">{error}</p>}
                        
                        {/* Personal Info */}
                        <input type="text" name="firstName" placeholder="First Name" value={formData.firstName} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="text" name="lastName" placeholder="Last Name" value={formData.lastName} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="email" name="email" placeholder="University Email Address" value={formData.email} onChange={handleChange} required className="md:col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="password" name="password" placeholder="Create Password (min. 8 characters)" value={formData.password} onChange={handleChange} required className="md:col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        
                        {/* Academic Info */}
                        <input type="text" name="rollNumber" placeholder="University Roll Number" value={formData.rollNumber} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="text" name="registrationID" placeholder="Unique Registration ID" value={formData.registrationID} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <select name="department" value={formData.department} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400">
                            <option value="Computer Science">Computer Science</option>
                            <option value="Information Technology">Information Technology</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Mechanical">Mechanical</option>
                            <option value="Civil">Civil</option>
                        </select>
                        <select name="year" value={formData.year} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400">
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </select>

                        {/* ✅ FIXED: Added Semester and Section fields */}
                        <select name="semester" value={formData.semester} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400">
                            <option value="1">Semester 1</option>
                            <option value="2">Semester 2</option>
                            <option value="3">Semester 3</option>
                            <option value="4">Semester 4</option>
                            <option value="5">Semester 5</option>
                            <option value="6">Semester 6</option>
                            <option value="7">Semester 7</option>
                            <option value="8">Semester 8</option>
                        </select>
                        <input type="text" name="section" placeholder="Section (e.g., A, B)" value={formData.section} onChange={handleChange} required maxLength="1" className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>

                        {/* Contact & Other Info */}
                        <input type="tel" name="phoneNumber" placeholder="Phone Number" value={formData.phoneNumber} onChange={handleChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <select name="gender" value={formData.gender} onChange={handleChange} className="border border-gray-300 p-3 rounded-lg bg-white focus:ring-2 focus:ring-indigo-400">
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="other">Other</option>
                        </select>
                        
                        {/* Address Fields */}
                        <input type="text" name="street" placeholder="Street Address" value={formData.address.street} onChange={handleAddressChange} required className="md:col-span-2 border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="text" name="city" placeholder="City" value={formData.address.city} onChange={handleAddressChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="text" name="state" placeholder="State" value={formData.address.state} onChange={handleAddressChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="text" name="postalCode" placeholder="Postal Code" value={formData.address.postalCode} onChange={handleAddressChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>
                        <input type="text" name="country" placeholder="Country" value={formData.address.country} onChange={handleAddressChange} required className="border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-400"/>

                        <button type="submit" disabled={authLoading} className="md:col-span-2 w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition shadow-md disabled:bg-gray-400">
                             {authLoading ? 'Creating Account...' : 'Sign Up Now'}
                        </button>
                    </form>
                </motion.div>
            </div>
        </section>
    );
};