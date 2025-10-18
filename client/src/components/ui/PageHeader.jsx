import React from 'react';
import Breadcrumbs from './Breadcrumbs.jsx';

const PageHeader = ({ title, subtitle, breadcrumbs, actions }) => (
	<header
		style={{
			display: 'grid',
			gap: 8,
			gridTemplateColumns: '1fr auto',
			alignItems: 'center',
			marginBottom: 16,
			rowGap: 10,
		}}
	>
		<div style={{ minWidth: 0 }}>
			{breadcrumbs && (
				<div style={{ marginBottom: 6 }}>
					<Breadcrumbs items={breadcrumbs} />
				</div>
			)}
			<h1 style={{ margin: 0, fontSize: 26, fontWeight: 900, color: 'var(--text)' }}>
				{title}
			</h1>
			{subtitle && (
				<p style={{ margin: '6px 0 0 0', color: 'var(--text-muted)', fontSize: 14 }}>
					{subtitle}
				</p>
			)}
		</div>
		{actions && (
			<div style={{ display: 'flex', gap: 8, justifySelf: 'end', flexWrap: 'wrap' }}>
				{actions}
			</div>
		)}
	</header>
);

export default PageHeader;
