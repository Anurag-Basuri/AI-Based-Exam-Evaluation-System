import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

let _transporter = null;
let _etherealAccount = null;

/**
 * Creates (or reuses) a Nodemailer transporter.
 * • Production: uses SMTP vars from .env (Resend, SendGrid, etc.)
 * • Development: auto-creates an Ethereal test account so you can
 *   preview every email in the browser without sending real mail.
 */
async function getTransporter() {
	if (_transporter) return _transporter;

	// ── Production / configured SMTP ──────────────────────────────
	if (process.env.SMTP_HOST) {
		_transporter = nodemailer.createTransport({
			host: process.env.SMTP_HOST,
			port: Number(process.env.SMTP_PORT || 465),
			secure: process.env.SMTP_SECURE !== 'false', // true for 465
			auth: {
				user: process.env.SMTP_USER,
				pass: process.env.SMTP_PASS,
			},
			pool: true, // reuse connections
			maxConnections: 5,
			maxMessages: 100,
		});

		try {
			await _transporter.verify();
			console.log('[EMAIL] ✅ SMTP transport verified');
		} catch (err) {
			console.error('[EMAIL] ❌ SMTP verification failed:', err.message);
			// Fall through — emails will still be attempted
		}

		return _transporter;
	}

	// ── Development fallback: Ethereal ───────────────────────────
	if (!_etherealAccount) {
		_etherealAccount = await nodemailer.createTestAccount();
		console.log('[EMAIL] 🧪 Ethereal test account created');
		console.log(`[EMAIL]    User: ${_etherealAccount.user}`);
		console.log(`[EMAIL]    Pass: ${_etherealAccount.pass}`);
	}

	_transporter = nodemailer.createTransport({
		host: 'smtp.ethereal.email',
		port: 587,
		secure: false,
		auth: {
			user: _etherealAccount.user,
			pass: _etherealAccount.pass,
		},
	});

	return _transporter;
}

// ── Helpers ──────────────────────────────────────────────────────

const FROM = () => process.env.EMAIL_FROM || '"Exam System" <noreply@exam-system.local>';
const FRONTEND = () => process.env.FRONTEND_URL || 'http://localhost:5173';

function logPreviewUrl(info) {
	if (!process.env.SMTP_HOST && info) {
		const url = nodemailer.getTestMessageUrl(info);
		if (url) console.log(`[EMAIL] 📧 Preview: ${url}`);
	}
}

// ── Base HTML wrapper ────────────────────────────────────────────

function wrapHtml(body) {
	return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#f1f5f9;font-family:Inter,'Segoe UI',Roboto,system-ui,sans-serif;color:#0f172a}
  .container{max-width:520px;margin:40px auto;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 8px 30px rgba(15,23,42,0.08)}
  .header{background:linear-gradient(135deg,#4f46e5,#6366f1);padding:28px 32px;text-align:center}
  .header h1{margin:0;color:#fff;font-size:20px;font-weight:800;letter-spacing:.3px}
  .body{padding:32px}
  .body p{margin:0 0 16px;line-height:1.7;font-size:15px;color:#334155}
  .cta{display:inline-block;background:linear-gradient(135deg,#4f46e5,#6366f1);color:#fff!important;text-decoration:none;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;letter-spacing:.2px;box-shadow:0 6px 20px rgba(79,70,229,0.3)}
  .cta:hover{opacity:.92}
  .cta-wrap{text-align:center;margin:28px 0}
  .meta{font-size:13px;color:#64748b;margin-top:24px;line-height:1.6}
  .footer{background:#f8fafc;padding:20px 32px;text-align:center;font-size:12px;color:#94a3b8;border-top:1px solid #e2e8f0}
  .footer a{color:#6366f1;text-decoration:none}
</style>
</head>
<body>
<div class="container">
  <div class="header"><h1>🎓 AI Exam Evaluation System</h1></div>
  <div class="body">${body}</div>
  <div class="footer">
    <p>&copy; ${new Date().getFullYear()} AI-Based Exam Evaluation System. All rights reserved.</p>
  </div>
</div>
</body>
</html>`;
}

// ── Email Verification ───────────────────────────────────────────

export async function sendVerificationEmail(to, name, token, role) {
	const link = `${FRONTEND()}/auth/verify-email?token=${encodeURIComponent(token)}&role=${role}`;

	const html = wrapHtml(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Welcome to the AI‑Based Exam Evaluation System! Please verify your email address to unlock all features.</p>
    <div class="cta-wrap"><a href="${link}" class="cta">Verify My Email</a></div>
    <p class="meta">
      This link expires in <strong>1 hour</strong>.<br>
      If you didn't create an account, you can safely ignore this email.
    </p>
    <p class="meta" style="font-size:12px;word-break:break-all;color:#94a3b8;">
      Link not working? Copy and paste this URL into your browser:<br>${link}
    </p>
  `);

	const text = `Hi ${name},\n\nWelcome! Please verify your email by visiting:\n${link}\n\nThis link expires in 1 hour.\n\nIf you didn't create an account, ignore this email.`;

	try {
		const transporter = await getTransporter();
		const info = await transporter.sendMail({
			from: FROM(),
			to,
			subject: 'Verify Your Email — AI Exam System',
			text,
			html,
		});
		logPreviewUrl(info);
		console.log(`[EMAIL] ✅ Verification email sent to ${to}`);
		return { success: true, messageId: info.messageId };
	} catch (err) {
		console.error(`[EMAIL] ❌ Failed to send verification email to ${to}:`, err.message);
		return { success: false, error: err.message };
	}
}

// ── Password Reset ───────────────────────────────────────────────

export async function sendPasswordResetEmail(to, name, token, role) {
	const link = `${FRONTEND()}/auth/reset-password?token=${encodeURIComponent(token)}&role=${role}`;

	const html = wrapHtml(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>We received a request to reset your password. Click the button below to choose a new one.</p>
    <div class="cta-wrap"><a href="${link}" class="cta">Reset Password</a></div>
    <p class="meta">
      This link expires in <strong>10 minutes</strong> for security reasons.<br>
      If you didn't request a password reset, no action is needed — your account is safe.
    </p>
    <p class="meta" style="font-size:12px;word-break:break-all;color:#94a3b8;">
      Link not working? Copy and paste this URL into your browser:<br>${link}
    </p>
  `);

	const text = `Hi ${name},\n\nReset your password by visiting:\n${link}\n\nThis link expires in 10 minutes.\n\nIf you didn't request this, ignore this email.`;

	try {
		const transporter = await getTransporter();
		const info = await transporter.sendMail({
			from: FROM(),
			to,
			subject: 'Reset Your Password — AI Exam System',
			text,
			html,
		});
		logPreviewUrl(info);
		console.log(`[EMAIL] ✅ Password reset email sent to ${to}`);
		return { success: true, messageId: info.messageId };
	} catch (err) {
		console.error(`[EMAIL] ❌ Failed to send reset email to ${to}:`, err.message);
		return { success: false, error: err.message };
	}
}

// ── Password Changed Confirmation ────────────────────────────────

export async function sendPasswordChangedEmail(to, name) {
	const html = wrapHtml(`
    <p>Hi <strong>${name}</strong>,</p>
    <p>Your password has been successfully changed. If you made this change, no further action is needed.</p>
    <p class="meta" style="color:#dc2626;">
      ⚠️ If you did <strong>not</strong> change your password, please immediately
      <a href="${FRONTEND()}/auth/forgot-password" style="color:#dc2626;font-weight:700">reset it here</a>
      and consider updating your email security settings.
    </p>
  `);

	const text = `Hi ${name},\n\nYour password was successfully changed.\n\nIf you did NOT make this change, reset your password immediately at: ${FRONTEND()}/auth/forgot-password`;

	try {
		const transporter = await getTransporter();
		const info = await transporter.sendMail({
			from: FROM(),
			to,
			subject: 'Password Changed — AI Exam System',
			text,
			html,
		});
		logPreviewUrl(info);
		return { success: true, messageId: info.messageId };
	} catch (err) {
		console.error(`[EMAIL] ❌ Failed to send password-changed email to ${to}:`, err.message);
		return { success: false, error: err.message };
	}
}
