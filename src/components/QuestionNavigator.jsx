import React from 'react';

const QuestionNavigator = ({ allQuestions, answers = {}, visited = {}, onVisit }) => {
  // Build items with metadata for matching groups
  const items = [];
  allQuestions.forEach((q) => {
    if (Array.isArray(q.subIds) && q.subIds.length) {
      q.subIds.forEach((num, idx) => {
        if (typeof num === 'number') items.push({ num, target: q.id, q, subIndex: idx });
      });
    } else if (typeof q.id === 'number') {
      items.push({ num: q.id, target: q.id, q, subIndex: null });
    }
  });

  const getStatus = (it) => {
    const q = it.q || {};
    const targetId = it.target;
    const raw = answers[targetId];
    const isVisited = !!visited[targetId];

    let isAttempted = false;
    if (q.type === 'matchinggroup' && typeof raw === 'string') {
      const parts = raw.split('|');
      if (typeof it.subIndex === 'number') isAttempted = !!(parts[it.subIndex] || '').trim();
      else isAttempted = parts.some(p => (p || '').trim());
    } else if (typeof raw === 'string') {
      isAttempted = !!raw.trim();
    } else if (raw != null) {
      isAttempted = true;
    }

    if (isAttempted) return 'attempted';
    if (isVisited) return 'visited';
    return 'unvisited';
  };

  const styleFor = (status) => {
    if (status === 'attempted') {
      return { backgroundColor: '#e8f5e9', border: '1px solid #2e7d32', color: '#2e7d32' };
    }
    if (status === 'visited') {
      return { backgroundColor: '#e0f2fe', border: '1px solid #0284c7', color: '#0369a1' };
    }
    return { backgroundColor: '#eee', border: '1px solid #999', color: '#333' };
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {items.sort((a, b) => a.num - b.num).map((it) => {
        const status = getStatus(it);
        const style = styleFor(status);
        return (
          <button
            key={`${it.target}-${it.num}`}
            style={{
              margin: '4px',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              ...style
            }}
            onClick={() => {
              if (typeof onVisit === 'function') onVisit(it.target);
              const el = document.getElementById(`q-${it.target}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          >
            {it.num}
          </button>
        );
      })}
    </div>
  );
};

export default QuestionNavigator;
