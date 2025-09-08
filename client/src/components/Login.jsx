import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Lock } from 'lucide-react';
import LoginParticles from './LoginParticles';
import { useAuth } from '../context/AuthContext'; // ✅ Import useAuth

export default function Login({ showModal, setShowModal }) {
	const { login, authLoading } = useAuth(); // ✅ Get login function from context
	const [form, setForm] = useState({ email: '', password: '' });
	const [error, setError] = useState('');

	const handleChange = (e) => {
		setForm({ ...form, [e.target.name]: e.target.value });
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError(''); // Clear previous errors
		if (!form.email || !form.password) {
			setError("Email and password are required.");
			return;
		}
		const result = await login(form);
		if (!result.success) {
			setError(result.message);
		} else {
			setShowModal(false); // Close modal on success
		}
	};

	return (
		<AnimatePresence>
			{showModal && (
				<motion.div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					onClick={() => setShowModal(false)} // Close modal on overlay click
				>
					<div className="absolute inset-0 z-0 pointer-events-none"><LoginParticles /></div>
					<motion.div
						initial={{ scale: 0.9, opacity: 0 }}
						animate={{ scale: 1, opacity: 1 }}
						exit={{ scale: 0.9, opacity: 0 }}
						transition={{ type: 'spring', stiffness: 200 }}
						className="relative z-10 w-full max-w-md px-8 py-10 rounded-2xl bg-[#111111]/90 backdrop-blur-md border border-cyan-500 shadow-[0_0_30px_rgba(0,255,255,0.4)]"
						onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the form
					>
						<button onClick={() => setShowModal(false)} className="absolute top-3 right-4 text-white text-2xl hover:text-red-400">&times;</button>
						<h2 className="text-3xl font-bold text-center text-cyan-300 mb-6">Login</h2>
						<form onSubmit={handleSubmit} className="space-y-4 text-white">
							{error && <p className="text-red-400 text-sm text-center bg-red-500/20 p-2 rounded-md">{error}</p>}
							<div className="relative">
								<User className="absolute left-3 top-2.5 text-cyan-400 w-5 h-5" />
								<input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-md bg-[#222] border border-cyan-600 placeholder-gray-400 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"/>
							</div>
							<div className="relative">
								<Lock className="absolute left-3 top-2.5 text-cyan-400 w-5 h-5" />
								<input type="password" name="password" placeholder="Password" value={form.password} onChange={handleChange} required className="w-full pl-10 pr-4 py-2 rounded-md bg-[#222] border border-cyan-600 placeholder-gray-400 text-white focus:ring-2 focus:ring-cyan-400 focus:outline-none"/>
							</div>
							<button type="submit" disabled={authLoading} className="w-full bg-cyan-500 hover:bg-cyan-600 text-black py-2 rounded-md text-lg font-semibold shadow-md transition disabled:bg-gray-500 disabled:cursor-not-allowed">
								{authLoading ? 'Logging in...' : 'Login'}
							</button>
						</form>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}