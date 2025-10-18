import React from 'react';
import { Link } from 'react-router-dom';

const Crumb = ({ to, label, current }) => {
	const common = {
		color: current ? 'var(--text)' : 'var(--text-muted)',
		fontWeight: current ? 800 : 700,
		fontSize: 13,
		textDecoration: 'none',
	};
	return to && !current ? (
		<Link to={to} style={common}>
			{label}
		</Link>
	) : (
		<span style={common}>{label}</span>
	);
};

const Breadcrumbs = ({ items = [] }) => {
	if (!items.length) return null;
	return (
		<nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
			{items.map((it, i) => (
				<React.Fragment key={i}>
					<Crumb to={it.to} label={it.label} current={i === items.length - 1} />
					{i < items.length - 1 && (
						<span aria-hidden style={{ color: 'var(--text-muted)' }}>
							/
						</span>
					)}
				</React.Fragment>
			))}
		</nav>
	);
};

export default Breadcrumbs;
