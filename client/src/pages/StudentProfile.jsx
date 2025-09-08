import React, { useRef, useState } from 'react';
import { Mail, Phone, MapPin, User, Hash, Award, BookOpen, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

export default function StudentProfile() {
    const { user } = useAuth();
    const fileInputRef = useRef(null);
    
    // Fallback for when user data is loading
    if (!user) {
        return <div className="text-center p-10">Loading profile...</div>;
    }

    // Initialize profileImage state after checking for user
    const [profileImage, setProfileImage] = useState(user.profilePicture || `https://i.pravatar.cc/150?u=${user.email}`);

    const handlePictureChangeClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfileImage(reader.result);
                // TODO: Add API call to upload image and update user profile
            };
            reader.readAsDataURL(file);
        }
    };

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
        <motion.section 
            id="profile"
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
                    <img
                        className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl"
                        src={profileImage}
                        alt="Profile"
                    />
                    <button 
                        onClick={handlePictureChangeClick}
                        className="absolute -bottom-1 -right-1 bg-indigo-600 text-white rounded-full p-2 hover:bg-indigo-700 transition shadow-md border-2 border-white"
                        aria-label="Change profile picture"
                    >
                        <Edit size={16} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/*" 
                        className="hidden"
                    />
                </div>
                <div className="text-center md:text-left">
                    <h2 className="text-3xl font-bold text-gray-800">{user.firstName} {user.lastName}</h2>
                    <p className="text-lg text-indigo-600 font-medium mt-1">{user.department}</p>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Contact Details Card */}
                <motion.div variants={itemVariants} className="lg:col-span-1 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-700 mb-6">Contact Details</h3>
                    <div className="space-y-5">
                        <InfoRow icon={<Mail />} label="Email Address" value={user.email} />
                        <InfoRow icon={<Phone />} label="Phone Number" value={user.phoneNumber} />
                        <InfoRow icon={<MapPin />} label="Location" value={`${user.address.city}, ${user.address.state}`} />
                    </div>
                </motion.div>

                {/* Academic Information Card */}
                <motion.div variants={itemVariants} className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
                     <h3 className="text-xl font-bold text-gray-700 mb-6">Academic Information</h3>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <InfoCard icon={<User />} label="Year & Section" value={`${user.year} / ${user.section.toUpperCase()}`} />
                        <InfoCard icon={<BookOpen />} label="Semester" value={user.semester} />
                        <InfoCard icon={<Hash />} label="Roll Number" value={user.rollNumber.toUpperCase()} />
                        <InfoCard icon={<Award />} label="Registration ID" value={user.registrationID} />
                    </div>
                </motion.div>
            </div>
        </motion.section>
    );
}

// Helper component for list-style info
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

// Helper component for card-style info
const InfoCard = ({ icon, label, value }) => (
    <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-4 border border-gray-200 hover:shadow-sm transition-shadow">
        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-full">
            {React.cloneElement(icon, { size: 22 })}
        </div>
        <div>
            <strong className="text-gray-500 text-sm font-medium">{label}</strong>
            <p className="text-lg font-bold text-gray-900">{value}</p>
        </div>
    </div>
);
