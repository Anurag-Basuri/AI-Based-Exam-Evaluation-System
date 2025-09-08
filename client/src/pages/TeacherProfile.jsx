import React from 'react';
import { Mail, Shield, Briefcase, Star, UserCheck, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function TeacherProfile() {
    const { user } = useAuth();

    if (!user) {
        return <div className="text-center p-10">Loading profile...</div>;
    }

    const initials = (user.firstName.charAt(0) + user.lastName.charAt(0)).toUpperCase();

    // Animation variants for Framer Motion
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 }
    };

    return (
        <motion.div 
            className="w-full"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* Profile Header Card */}
            <motion.div 
                variants={itemVariants}
                className="bg-white rounded-2xl shadow-lg p-8 mb-8 flex flex-col md:flex-row items-center gap-8 border border-gray-200"
            >
                <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center text-5xl font-bold shadow-lg">
                        {initials}
                    </div>
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-800">{`${user.firstName} ${user.lastName}`}</h2>
                    <p className="text-lg text-indigo-600 font-medium mt-1">{user.title}</p>
                </div>
                <button className="ml-auto mt-4 md:mt-0 flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition font-semibold text-sm">
                    <Edit size={16} /> Edit Profile
                </button>
            </motion.div>

            {/* Professional Information Card */}
            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-700 mb-6">Professional Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <InfoRow icon={<Mail />} label="Email Address" value={user.email} />
                    <InfoRow icon={<Shield />} label="Employee ID" value={user.employeeID} />
                    <InfoRow icon={<Briefcase />} label="Department" value={user.department} />
                    <InfoRow icon={<UserCheck />} label="Experience" value={`${user.experienceYears} years`} />
                    <div className="md:col-span-2">
                        <InfoRow icon={<Star />} label="Specializations" value={user.specialization.join(', ')} />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// Helper component for consistent info rows
const InfoRow = ({ icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl mt-1">
            {React.cloneElement(icon, { size: 20 })}
        </div>
        <div>
            <p className="text-sm text-gray-500">{label}</p>
            <p className="font-semibold text-gray-800">{value}</p>
        </div>
    </div>
);
