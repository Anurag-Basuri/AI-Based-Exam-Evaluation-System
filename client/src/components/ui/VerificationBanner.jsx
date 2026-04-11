import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth.js';
import {
	resendStudentVerification,
	resendTeacherVerification,
} from '../../services/apiServices.js';

/**
 * A dismissible warning banner that appears at the top of the dashboard
 * when the user's email is not verified. Offers one-click resend + link
 * to the verification page.
 */
const VerificationBanner = () => {
	const navigate = useNavigate();
	const { user, role } = useAuth();
	const [dismissed, setDismissed] = useState(false);
	const [sending, setSending] = useState(false);
	const [sent, setSent] = useState(false);
	const [error, setError] = useState('');

	// Don't render if verified or dismissed
	if (!user || user.isEmailVerified || dismissed) return null;

	const handleResend = async () => {
		setSending(true);
		setError('');
		try {
			const fn = role === 'teacher' ? resendTeacherVerification : resendStudentVerification;
			await fn();
			setSent(true);
		} catch (err) {
			setError(err?.message || 'Failed to send email');
		} finally {
			setSending(false);
		}
	};

	return (
		<div style={styles.banner}>
			<div style={styles.inner}>
				<div style={styles.left}>
					<span style={styles.icon}>⚠️</span>
					<div>
						<strong style={styles.title}>Email not verified</strong>
						<p style={styles.desc}>
							{sent
								? 'Verification email sent! Check your inbox.'
								: 'Verify your email to unlock all features like starting and publishing exams.'}
						</p>
						{error && <p style={styles.errText}>{error}</p>}
					</div>
				</div>
				<div style={styles.right}>
					{!sent && (
						<button
							type="button"
							onClick={handleResend}
							disabled={sending}
							style={styles.btn}
						>
							{sending ? 'Sending...' : 'Resend Email'}
						</button>
					)}
					<button
						type="button"
						onClick={() => setDismissed(true)}
						style={styles.closeBtn}
						aria-label="Dismiss"
						title="Dismiss"
					>
						✕
					</button>
				</div>
			</div>
		</div>
	);
};

const styles = {
	banner: {
		background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
		borderBottom: '1px solid #fbbf24',
		padding: '10px 20px',
		fontFamily: "Inter, 'Segoe UI', Roboto, system-ui, sans-serif",
	},
	inner: {
		maxWidth: 1200,
		margin: '0 auto',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		gap: 16,
		flexWrap: 'wrap',
	},
	left: {
		display: 'flex',
		alignItems: 'center',
		gap: 12,
		flex: 1,
		minWidth: 200,
	},
	icon: {
		fontSize: 22,
		flexShrink: 0,
	},
	title: {
		fontSize: 14,
		color: '#92400e',
		display: 'block',
		marginBottom: 2,
	},
	desc: {
		fontSize: 13,
		color: '#78350f',
		margin: 0,
		lineHeight: 1.5,
	},
	errText: {
		fontSize: 12,
		color: '#dc2626',
		margin: '4px 0 0',
	},
	right: {
		display: 'flex',
		alignItems: 'center',
		gap: 8,
		flexShrink: 0,
	},
	btn: {
		padding: '7px 16px',
		borderRadius: 8,
		border: 'none',
		background: '#92400e',
		color: '#fff',
		fontWeight: 700,
		fontSize: 13,
		cursor: 'pointer',
		whiteSpace: 'nowrap',
		transition: 'opacity 0.2s',
	},
	closeBtn: {
		appearance: 'none',
		border: 'none',
		background: 'transparent',
		color: '#92400e',
		fontSize: 16,
		cursor: 'pointer',
		padding: '4px 6px',
		borderRadius: 6,
		fontWeight: 700,
		lineHeight: 1,
	},
};

export default VerificationBanner;
