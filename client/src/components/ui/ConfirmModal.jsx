import React, { useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

export default function ConfirmModal({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'danger',
}) {
	// Close on escape key
	useEffect(() => {
		const handleEsc = e => {
			if (e.key === 'Escape') onClose();
		};
		window.addEventListener('keydown', handleEsc);
		return () => window.removeEventListener('keydown', handleEsc);
	}, [onClose]);

	if (!isOpen) return null;

	const isDanger = variant === 'danger';

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
			{/* Backdrop */}
			<div
				className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity dark:bg-gray-900/60"
				onClick={onClose}
			/>

			{/* Modal Content */}
			<div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 overflow-hidden rounded-2xl border border-gray-200 bg-white/80 p-6 shadow-xl backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90 sm:p-8">
				<button
					onClick={onClose}
					className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300"
				>
					<X className="h-5 w-5" />
				</button>

				<div className="flex flex-col items-center text-center">
					<div
						className={`mb-4 flex h-14 w-14 items-center justify-center rounded-full ${
							isDanger
								? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400'
								: 'bg-primary/10 text-primary dark:bg-primary/20'
						}`}
					>
						{isDanger ? (
							<AlertTriangle className="h-7 w-7" />
						) : (
							<Info className="h-7 w-7" />
						)}
					</div>
					<h3 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">
						{title}
					</h3>
					<p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{message}</p>

					<div className="flex w-full flex-col-reverse gap-3 sm:flex-row">
						<button
							type="button"
							onClick={onClose}
							className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
						>
							{cancelText}
						</button>
						<button
							type="button"
							onClick={() => {
								onConfirm();
								onClose();
							}}
							className={`w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-900 ${
								isDanger
									? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
									: 'bg-primary hover:bg-primary/90 focus:ring-primary'
							}`}
						>
							{confirmText}
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
