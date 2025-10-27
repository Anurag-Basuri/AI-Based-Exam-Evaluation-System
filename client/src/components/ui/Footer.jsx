import React from 'react';
import { useTheme } from '../../hooks/useTheme.js';

const Footer = () => {
	const { theme } = useTheme();
	const year = new Date().getFullYear();

	return (
		<footer
			style={{
				backgroundColor: 'var(--surface)',
				color: 'var(--text)',
				padding: '2rem',
				borderTop: '1px solid var(--border)',
			}}
		>
			<div
				style={{
					maxWidth: 1200,
					margin: '0 auto',
					display: 'flex',
					flexWrap: 'wrap',
					gap: '1rem',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<div style={{ fontSize: '0.95rem', color: 'var(--text-muted)' }}>
					© {year} AI Exam System
				</div>

				<nav
					aria-label="Footer navigation"
					style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
				>
					<a href="/" style={linkStyle(theme)}>
						Home
					</a>
					<a href="/student/exams" style={linkStyle(theme)}>
						Student
					</a>
					<a href="/teacher/exams" style={linkStyle(theme)}>
						Teacher
					</a>
					<a
						href="https://reactjs.org/"
						target="_blank"
						rel="noreferrer"
						style={linkStyle(theme)}
					>
						Docs
					</a>
				</nav>
			</div>
		</footer>
	);
};

const linkStyle = theme => ({
	color: 'var(--text-muted)',
	textDecoration: 'none',
	borderBottom: '1px dashed transparent',
	paddingBottom: 2,
	transition: 'color 150ms ease, border-color 150ms ease',
	cursor: 'pointer',
	outline: 'none',
});

export default Footer;
