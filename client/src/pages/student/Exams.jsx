import React from 'react';
import {
  safeApiCall,
  getStudentExams,
  startSubmission,
} from '../../services/studentServices.js';

const statusStyles = {
  active: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', label: 'Active', icon: '🟢' },
  live: { bg: '#ecfdf5', border: '#6ee7b7', color: '#047857', label: 'Live', icon: '🟢' },
  completed: { bg: '#f3e8ff', border: '#c4b5fd', color: '#7c3aed', label: 'Completed', icon: '✅' },
  scheduled: { bg: '#dbeafe', border: '#93c5fd', color: '#1d4ed8', label: 'Scheduled', icon: '🗓️' },
  upcoming: { bg: '#fff7ed', border: '#fed7aa', color: '#9a3412', label: 'Upcoming', icon: '🕐' },
  draft: { bg: '#f1f5f9', border: '#cbd5e1', color: '#475569', label: 'Draft', icon: '📄' },
};

const ExamCard = ({ exam, onStart, isStarting }) => {
  const config = statusStyles[exam.status] || statusStyles.upcoming;
  const canStart = ['upcoming', 'scheduled', 'active', 'live'].includes(exam.status);
  const canContinue = ['active', 'live'].includes(exam.status);
  
  return (
    <article
      style={{
        background: '#ffffff',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        boxShadow: '0 4px 16px rgba(15,23,42,0.06)',
        padding: '24px',
        transition: 'all 0.2s ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 28px rgba(15,23,42,0.12)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(15,23,42,0.06)';
      }}
    >
      {/* Status Indicator */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '4px',
          height: '100%',
          background: config.color,
        }}
      />
      
      <header style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <h3 style={{ 
            margin: 0, 
            fontSize: '18px', 
            fontWeight: 700,
            color: '#0f172a',
            flex: 1,
          }}>
            {exam.title}
          </h3>
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              padding: '6px 12px',
              borderRadius: '20px',
              border: `1px solid ${config.border}`,
              background: config.bg,
              color: config.color,
              fontWeight: 700,
            }}
          >
            <span>{config.icon}</span>
            {config.label}
          </span>
        </div>
        
        {exam.description && (
          <p style={{ 
            margin: '0 0 12px 0', 
            color: '#64748b', 
            fontSize: '14px',
            lineHeight: 1.5 
          }}>
            {exam.description}
          </p>
        )}
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
          gap: '12px',
          color: '#64748b',
          fontSize: '14px',
        }}>
          {exam.duration > 0 && (
            <div>
              <strong style={{ color: '#374151' }}>Duration:</strong> {exam.duration} min
            </div>
          )}
          {exam.totalQuestions > 0 && (
            <div>
              <strong style={{ color: '#374151' }}>Questions:</strong> {exam.totalQuestions}
            </div>
          )}
          {exam.maxScore > 0 && (
            <div>
              <strong style={{ color: '#374151' }}>Max Score:</strong> {exam.maxScore}
            </div>
          )}
          {exam.startAt && exam.startAt !== '—' && (
            <div>
              <strong style={{ color: '#374151' }}>Start:</strong> {exam.startAt}
            </div>
          )}
        </div>
      </header>

      <div style={{ 
        display: 'flex', 
        gap: '10px', 
        flexWrap: 'wrap',
        paddingTop: '16px',
        borderTop: '1px solid #f1f5f9',
        justifyContent: 'flex-end',
      }}>
        {canStart && (
          <button
            onClick={() => onStart(exam)}
            disabled={isStarting}
            style={{
              flex: '1 1 120px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: 'none',
              background: isStarting ? '#9ca3af' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#ffffff',
              cursor: isStarting ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              boxShadow: isStarting ? 'none' : '0 4px 12px rgba(16,185,129,0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {isStarting ? (
              <>⏳ Starting...</>
            ) : canContinue ? (
              <>▶️ Continue</>
            ) : (
              <>🚀 Start Exam</>
            )}
          </button>
        )}
        
        {exam.status === 'completed' && (
          <button
            onClick={() => alert('View detailed results (to be implemented)')}
            style={{
              flex: '1 1 120px',
              padding: '12px 16px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              color: '#374151',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            📊 View Result
          </button>
        )}
      </div>
    </article>
  );
};

const StudentExams = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [exams, setExams] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('all');
  const [message, setMessage] = React.useState('');
  const [startingIds, setStartingIds] = React.useState(new Set());

  const loadExams = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await safeApiCall(getStudentExams);
      setExams(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.message || 'Failed to load exams');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadExams();
  }, [loadExams]);

  const filteredExams = React.useMemo(() => {
    const q = query.toLowerCase();
    return exams.filter(exam => {
      const matchesStatus = status === 'all' || exam.status === status;
      const matchesQuery = !q || 
        exam.title.toLowerCase().includes(q) ||
        (exam.description && exam.description.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [exams, status, query]);

  const statusCounts = React.useMemo(() => {
    const counts = { all: exams.length };
    exams.forEach(exam => {
      const examStatus = exam.status || 'upcoming';
      counts[examStatus] = (counts[examStatus] || 0) + 1;
    });
    return counts;
  }, [exams]);

  const handleStartExam = async (exam) => {
    const examId = exam.id;
    setStartingIds(prev => new Set([...prev, examId]));
    setMessage('');
    
    try {
      await safeApiCall(startSubmission, examId);
      setExams(prev => prev.map(e => 
        e.id === examId ? { ...e, status: 'active' } : e
      ));
      setMessage(`✅ Exam "${exam.title}" started successfully! You can now continue.`);
    } catch (e) {
      setMessage(`❌ ${e?.message || 'Failed to start exam'}`);
    } finally {
      setStartingIds(prev => {
        const next = new Set(prev);
        next.delete(examId);
        return next;
      });
    }
  };

  const filterOptions = [
    { key: 'all', label: 'All Exams' },
    { key: 'active', label: 'Active' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'completed', label: 'Completed' },
    { key: 'scheduled', label: 'Scheduled' },
  ];

  return (
    <div style={{ maxWidth: '1200px' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(59,130,246,0.05))',
        padding: '32px 28px',
        borderRadius: 20,
        border: '1px solid rgba(16,185,129,0.2)',
        marginBottom: 32,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20 }}>
          <div>
            <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: 800 }}>
              Available Exams
            </h1>
            <p style={{ margin: 0, color: '#64748b', fontSize: '16px' }}>
              Start new exams or continue active sessions.
            </p>
          </div>
          <button
            onClick={loadExams}
            disabled={loading}
            style={{
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #d1d5db',
              background: '#ffffff',
              color: '#374151',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              fontSize: '14px',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
      </header>

      {/* Status Message */}
      {message && (
        <div
          style={{
            marginBottom: 24,
            padding: '14px 18px',
            borderRadius: 12,
            background: '#f0f9ff',
            border: '1px solid #bae6fd',
            color: '#0c4a6e',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{message}</span>
          <button
            onClick={() => setMessage('')}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 800,
              fontSize: '16px',
              padding: '4px',
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div style={{ 
        background: '#ffffff',
        padding: '24px',
        borderRadius: 16,
        border: '1px solid #e5e7eb',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
      }}>
        <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: '1 1 300px' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search exams by title or description..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 48px',
                borderRadius: 12,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                outline: 'none',
                fontSize: '14px',
                fontWeight: 500,
              }}
            />
            <span
              style={{
                position: 'absolute',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#9ca3af',
                fontSize: '16px',
              }}
            >
              🔍
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {filterOptions.map(option => (
              <button
                key={option.key}
                onClick={() => setStatus(option.key)}
                style={{
                  padding: '10px 16px',
                  borderRadius: 25,
                  border: status === option.key ? '2px solid #10b981' : '1px solid #d1d5db',
                  background: status === option.key ? '#ecfdf5' : '#ffffff',
                  color: status === option.key ? '#047857' : '#374151',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                {option.label}
                <span style={{
                  background: status === option.key ? '#10b981' : '#6b7280',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: 700,
                  minWidth: '20px',
                  textAlign: 'center',
                }}>
                  {statusCounts[option.key] || 0}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div style={{
          padding: '20px',
          borderRadius: 12,
          background: '#fef2f2',
          border: '1px solid #fca5a5',
          color: '#b91c1c',
          textAlign: 'center',
          marginBottom: 24,
        }}>
          ❌ {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          color: '#64748b',
        }}>
          <div style={{ fontSize: '32px', marginBottom: 16 }}>⏳</div>
          <p style={{ margin: 0, fontWeight: 600 }}>Loading your exams...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredExams.length === 0 && (
        <div style={{
          padding: '60px 20px',
          textAlign: 'center',
          background: '#ffffff',
          borderRadius: 16,
          border: '2px dashed #d1d5db',
        }}>
          <div style={{ fontSize: '48px', marginBottom: 16 }}>📝</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
            {query || status !== 'all' ? 'No matching exams found' : 'No exams available'}
          </h3>
          <p style={{ margin: 0, color: '#6b7280' }}>
            {query || status !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Check back later or contact your instructor'
            }
          </p>
        </div>
      )}

      {/* Exams Grid */}
      {!loading && !error && filteredExams.length > 0 && (
        <div style={{
          display: 'grid',
          gap: 20,
          gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
        }}>
          {filteredExams.map(exam => (
            <ExamCard
              key={exam.id}
              exam={exam}
              onStart={handleStartExam}
              isStarting={startingIds.has(exam.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentExams;
