import React from 'react';
import Sidebar from '../components/Sidebar.jsx';
import { useTheme } from '../hooks/useTheme.js';

const StudentDash = () => {
	const { theme } = useTheme();

	const headerEl = (
		<div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
			<img
				src="/logo192.png"
				alt="Student"
				style={{ width: 32, height: 32, borderRadius: 8 }}
			/>
			<div style={{ fontWeight: 800, letterSpacing: 0.2 }}>Student Portal</div>
		</div>
	);

	return (
		<div className="student-dash" style={{ background: 'var(--bg)', color: 'var(--text)' }}>
			<Sidebar
				useOutlet
				header={headerEl}
				width={260}
				collapsedWidth={76}
				theme={theme}
				items={[
					{ key: 'home', label: 'Dashboard', icon: '🏠', to: '.' },
					{ key: 'exams', label: 'Exams', icon: '📝', to: 'exams' },
					{ key: 'results', label: 'Results', icon: '📊', to: 'results' },
					{ key: 'issues', label: 'Issues', icon: '🛠️', to: 'issues' },
					{ key: 'settings', label: 'Settings', icon: '⚙️', to: 'settings' },
				]}
			/>
		</div>
	);
};

export default StudentDash;
