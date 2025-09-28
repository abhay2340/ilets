import React from 'react';

const QuestionBox = ({ question, answer, setAnswer }) => {
  // Info blocks: headings or bullet lines
  if (question.type === 'info') {
    const kind = question.infoKind || 'bullet';
    if (kind === 'heading') {
      return (
        <div style={{ margin: '12px 0 6px 0' }}>
          <div style={{ fontWeight: 800, fontSize: '18px' }}>{question.question}</div>
        </div>
      );
    }
    // bullet
    return (
      <div style={{ marginBottom: '8px', marginLeft: '10px' }}>
        <span style={{ fontWeight: 700, marginRight: 6 }}>•</span>
        <span>{question.question}</span>
      </div>
    );
  }

  const isInlineBlank = question.type === 'written' && /_{3,}/.test(question.question);

  return (
    <div id={`q-${question.id}`} style={{ marginBottom: '25px' }}>
      {!isInlineBlank && (
        <p><strong>{(question.displayId ?? question.id)}. {question.question}</strong></p>
      )}

      {/* Multiple choice (TRUE/FALSE/NOT GIVEN or 4 options) */}
      {question.type === 'mcq' &&
        question.options.map((opt, i) => (
          <label key={i} style={{ display: 'block', marginLeft: '20px' }}>
            <input
              type="radio"
              name={`q-${question.id}`}  // MUST be unique per question
              value={opt}
              checked={answer === opt}
              onChange={() => setAnswer(opt)}
            /> {opt}
          </label>
        ))
      }

      {/* Fill in the blank (supports inline blanks like ______) */}
      {question.type === 'written' && (() => {
        const blankRegex = /_{3,}/; // three or more underscores
        if (blankRegex.test(question.question)) {
          const parts = question.question.split(/_{3,}/);
          return (
            <div style={{ marginTop: '10px', marginLeft: '10px' }}>
              <span style={{ fontWeight: 700, marginRight: 6 }}>•</span>
              <span>{parts[0]}</span>
              <input
                type="text"
                value={answer || ''}
                onChange={(e) => setAnswer(e.target.value)}
                style={{
                  padding: '6px 12px',
                  minWidth: 160,
                  borderRadius: '5px',
                  border: '1px solid #ccc',
                  margin: '0 8px'
                }}
                placeholder={`${question.displayId ?? question.id}`}
              />
              <span>{parts.slice(1).join('')}</span>
            </div>
          );
        }
        return (
          <input
            type="text"
            value={answer || ''}
            onChange={(e) => setAnswer(e.target.value)}
            style={{
              marginLeft: '20px',
              marginTop: '10px',
              padding: '6px 12px',
              width: '80%',
              borderRadius: '5px',
              border: '1px solid #ccc'
            }}
            placeholder={`${question.displayId ?? question.id}`}
          />
        );
      })()}

      {/* Matching group (radio matrix) */}
      {question.type === 'matchinggroup' && (() => {
        const rows = Array.isArray(question.rows) ? question.rows : [];
        const cols = Array.isArray(question.columns) ? question.columns : [];

        // Parse columns into letter + label
        const parsedCols = React.useMemo(() => cols.map((c) => {
          const text = String(c ?? '').trim();
          const [first, ...rest] = text.split(' ');
          if (first && first.length === 1 && /[A-Z]/i.test(first)) {
            return { letter: first.toUpperCase(), label: rest.join(' ').trim() };
          }
          return { letter: text, label: '' };
        }), [cols.join('|')]);

        // Parse existing answer string like "B|A|C|E" into per-row selections
        const selections = React.useMemo(() => {
          const initial = Array(rows.length).fill('');
          if (typeof answer === 'string' && answer.length > 0) {
            const parts = answer.split('|');
            for (let i = 0; i < initial.length; i++) initial[i] = parts[i] || '';
          }
          return initial;
        }, [answer, rows.length]);

        const [localSel, setLocalSel] = React.useState(selections);

        React.useEffect(() => {
          setLocalSel(selections);
        }, [selections.join('|')]);

        const choose = (rowIdx, colLetter) => {
          const next = [...localSel];
          next[rowIdx] = colLetter;
          setLocalSel(next);
          // store as ordered string, using | so our equality check preserves order
          setAnswer(next.join('|'));
        };

        return (
          <div style={{ marginTop: '10px', overflowX: 'auto' }}>
            {/* Matrix with only letter headers */}
            <table style={{ borderCollapse: 'collapse', minWidth: '520px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #000' }}></th>
                  {parsedCols.map((c, i) => (
                    <th key={i} style={{ width: 70, textAlign: 'center', padding: '8px', borderBottom: '2px solid #000' }}>{c.letter}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((label, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ padding: '10px 8px', borderBottom: '1px solid #ccc', fontWeight: 600 }}>
                      {Array.isArray(question.subIds) ? `${question.subIds[rIdx]}. ` : `${rIdx + 1} `}
                      {typeof label === 'string' ? label : (label?.label ?? '')}
                    </td>
                    {parsedCols.map((c, cIdx) => (
                      <td key={cIdx} style={{ textAlign: 'center', padding: '10px 8px', borderBottom: '1px solid #eee' }}>
                        <input
                          type="radio"
                          name={`q-${question.id}-row-${rIdx}`}
                          value={c.letter}
                          checked={localSel[rIdx] === c.letter}
                          onChange={() => choose(rIdx, c.letter)}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Legend: two columns letter + description */}
            {parsedCols.some(pc => pc.label) && (
              <div style={{ marginTop: '14px' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px' }}>Options</div>
                <table style={{ borderCollapse: 'collapse', minWidth: '320px' }}>
                  <tbody>
                    {parsedCols.map((c, i) => (
                      <tr key={i}>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd', fontWeight: 700, width: 40 }}>{c.letter}</td>
                        <td style={{ padding: '6px 8px', border: '1px solid #ddd' }}>{c.label || ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
              Your selections: {localSel.filter(Boolean).length > 0 ? localSel.join(' | ') : 'None'}
            </div>
          </div>
        );
      })()}

      {/* Dropdown for heading matching */}
      {question.type === 'dropdown' &&
        <select
          name={`q-${question.id}`} // ensure uniqueness here too
          value={answer || ''}
          onChange={(e) => setAnswer(e.target.value)}
          style={{
            marginLeft: '20px',
            marginTop: '10px',
            padding: '6px 12px',
            width: '80%',
            borderRadius: '5px',
            border: '1px solid #aaa'
          }}
        >
          <option value="">-- Select heading --</option>
          {question.options.map((opt, index) => (
            <option key={index} value={opt}>{opt}</option>
          ))}
        </select>
      }
    </div>
  );
};

export default QuestionBox;
