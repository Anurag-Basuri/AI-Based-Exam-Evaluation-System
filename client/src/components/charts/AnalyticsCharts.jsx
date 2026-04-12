import React from 'react';
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	LineChart,
	Line,
	Area,
	AreaChart,
} from 'recharts';

/* ─── Score Distribution Histogram ──────────────────────────────── */
export const ScoreHistogram = ({ data = [] }) => {
	if (!data.length) {
		return (
			<div style={styles.empty}>
				<span style={styles.emptyIcon}>📊</span>
				<p style={styles.emptyText}>No score data yet</p>
			</div>
		);
	}

	return (
		<div style={styles.chartWrap}>
			<h3 style={styles.chartTitle}>Score Distribution</h3>
			<ResponsiveContainer width="100%" height={260}>
				<BarChart data={data} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
					<XAxis dataKey="range" tick={styles.tick} />
					<YAxis allowDecimals={false} tick={styles.tick} />
					<Tooltip
						contentStyle={styles.tooltip}
						cursor={{ fill: 'rgba(99,102,241,0.08)' }}
					/>
					<Bar
						dataKey="count"
						name="Students"
						fill="url(#barGrad)"
						radius={[6, 6, 0, 0]}
						maxBarSize={48}
					/>
					<defs>
						<linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#818cf8" stopOpacity={0.9} />
							<stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
						</linearGradient>
					</defs>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
};

/* ─── Exam Performance Line Chart ───────────────────────────────── */
export const PerformanceLine = ({ data = [] }) => {
	if (!data.length) {
		return (
			<div style={styles.empty}>
				<span style={styles.emptyIcon}>📈</span>
				<p style={styles.emptyText}>No exam performance data yet</p>
			</div>
		);
	}

	// Reverse so oldest is on the left
	const reversed = [...data].reverse();

	return (
		<div style={styles.chartWrap}>
			<h3 style={styles.chartTitle}>Average Score by Exam</h3>
			<ResponsiveContainer width="100%" height={260}>
				<AreaChart data={reversed} margin={{ top: 8, right: 12, left: -10, bottom: 0 }}>
					<defs>
						<linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
							<stop offset="0%" stopColor="#34d399" stopOpacity={0.3} />
							<stop offset="100%" stopColor="#34d399" stopOpacity={0.02} />
						</linearGradient>
					</defs>
					<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
					<XAxis
						dataKey="examTitle"
						tick={styles.tick}
						interval={0}
						angle={-20}
						textAnchor="end"
						height={60}
					/>
					<YAxis allowDecimals={false} tick={styles.tick} />
					<Tooltip contentStyle={styles.tooltip} />
					<Area
						type="monotone"
						dataKey="avgScore"
						name="Avg Score"
						stroke="#10b981"
						strokeWidth={2.5}
						fill="url(#areaGrad)"
						dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }}
						activeDot={{ r: 6 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</div>
	);
};

/* ─── Activity Feed ─────────────────────────────────────────────── */
export const ActivityFeed = ({ items = [], onItemClick }) => {
	if (!items.length) {
		return (
			<div style={styles.empty}>
				<span style={styles.emptyIcon}>📋</span>
				<p style={styles.emptyText}>No recent activity</p>
			</div>
		);
	}

	const getStatusStyle = status => {
		const s = String(status ?? '').toLowerCase();
		const map = {
			'in-progress': { bg: '#fef3c7', color: '#d97706', icon: '⏳' },
			submitted: { bg: '#dbeafe', color: '#2563eb', icon: '📥' },
			evaluating: { bg: '#e0e7ff', color: '#4f46e5', icon: '🤖' },
			evaluated: { bg: '#dcfce7', color: '#16a34a', icon: '✅' },
			published: { bg: '#ede9fe', color: '#7c3aed', icon: '📢' },
		};
		return map[s] || map.submitted;
	};

	const formatTime = v => {
		if (!v) return '—';
		try {
			return new Date(v).toLocaleString(undefined, {
				month: 'short',
				day: 'numeric',
				hour: '2-digit',
				minute: '2-digit',
			});
		} catch {
			return String(v);
		}
	};

	return (
		<div style={styles.feedWrap}>
			{items.map((item, i) => {
				const st = getStatusStyle(item.status);
				return (
					<div
						key={item._id || i}
						style={styles.feedItem}
						onClick={() => onItemClick?.(item)}
					>
						<div style={{ ...styles.feedDot, background: st.color }} />
						<div style={styles.feedContent}>
							<div style={styles.feedRow}>
								<span style={styles.feedTitle}>
									{item.student?.fullname ||
										item.student?.username ||
										item.examTitle ||
										'Submission'}
								</span>
								<span
									style={{
										...styles.feedBadge,
										background: st.bg,
										color: st.color,
									}}
								>
									{st.icon} {item.status}
								</span>
							</div>
							<span style={styles.feedSub}>
								{item.exam?.title || item.examTitle || ''} ·{' '}
								{formatTime(item.createdAt || item.submittedAt)}
							</span>
						</div>
					</div>
				);
			})}
		</div>
	);
};

/* ─── Styles ──────────────────────────────────────────────────────── */
const styles = {
	chartWrap: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 16,
		padding: '20px 16px 12px',
	},
	chartTitle: {
		fontSize: 15,
		fontWeight: 700,
		color: 'var(--text)',
		margin: '0 0 12px 4px',
	},
	tick: {
		fontSize: 11,
		fill: 'var(--text-muted)',
	},
	tooltip: {
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 10,
		fontSize: 13,
		boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
	},
	empty: {
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: '40px 20px',
		background: 'var(--surface)',
		border: '1px solid var(--border)',
		borderRadius: 16,
		minHeight: 180,
	},
	emptyIcon: { fontSize: 32, marginBottom: 8 },
	emptyText: { fontSize: 14, color: 'var(--text-muted)', margin: 0 },
	feedWrap: {
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
	},
	feedItem: {
		display: 'flex',
		alignItems: 'flex-start',
		gap: 12,
		padding: '12px 8px',
		borderRadius: 10,
		cursor: 'pointer',
		transition: 'background 0.15s',
	},
	feedDot: {
		width: 8,
		height: 8,
		borderRadius: '50%',
		marginTop: 6,
		flexShrink: 0,
	},
	feedContent: {
		flex: 1,
		display: 'flex',
		flexDirection: 'column',
		gap: 2,
	},
	feedRow: {
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		gap: 8,
	},
	feedTitle: {
		fontSize: 13,
		fontWeight: 600,
		color: 'var(--text)',
	},
	feedBadge: {
		fontSize: 11,
		fontWeight: 600,
		padding: '2px 8px',
		borderRadius: 999,
		whiteSpace: 'nowrap',
	},
	feedSub: {
		fontSize: 12,
		color: 'var(--text-muted)',
	},
};
