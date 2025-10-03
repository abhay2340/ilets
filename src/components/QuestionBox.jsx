import React from 'react';

const QuestionBox = ({ question, answer, setAnswer, onVisited }) => {
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

      {/* Multiple choice (TRUE/FALSE/NOT GIVEN or 4 options). For standard MCQs, store letter A/B/C/D. */}
      {question.type === 'mcq' && (() => {
        const opts = Array.isArray(question.options) ? question.options : [];
        const normalized = opts.map(o => String(o ?? '').trim().toUpperCase());
        const tfngSet = new Set(['TRUE', 'FALSE', 'NOT GIVEN', 'YES', 'NO']);
        const isTFNG = normalized.every(o => tfngSet.has(o));

        return opts.map((opt, i) => {
          const letter = String.fromCharCode(65 + i); // A, B, C, D ...
          const inputValue = isTFNG ? opt : letter;
          const isChecked = isTFNG ? (answer === opt) : (answer === letter);
          // Strip leading letter labels like "A.", "B)", or just "C" from option text
          let displayText = String(opt ?? '');
          if (!isTFNG) {
            const match = displayText.match(/^([A-Za-z])\s*[\.)\-:]?\s*(.*)$/);
            if (match && match[1].toUpperCase() === letter) {
              displayText = match[2] || '';
            }
          }
          return (
            <label key={i} style={{ display: 'block', marginLeft: '20px', cursor: 'pointer' }}>
              <input
                type="radio"
                name={`q-${question.id}`}  // MUST be unique per question
                value={inputValue}
                checked={isChecked}
                onChange={() => { onVisited?.(question.id); setAnswer(inputValue); }}
                style={{ cursor: 'pointer', marginRight: '8px' }}
              />
              {!isTFNG && <span style={{ fontWeight: 700, marginRight: 6 }}>{letter}.</span>}
              {isTFNG ? (
                <span>{opt}</span>
              ) : (
                displayText ? <span>{displayText}</span> : null
              )}
            </label>
          );
        });
      })()}

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
                onChange={(e) => { onVisited?.(question.id); setAnswer(e.target.value); }}
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
            onChange={(e) => { onVisited?.(question.id); setAnswer(e.target.value); }}
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
          onVisited?.(question.id);
          setAnswer(next.join('|'));
        };

        return (
          <div style={{ marginTop: '10px', overflowX: 'auto' }}>
            {/* Matrix with only letter headers */}
            <table style={{ borderCollapse: 'collapse', minWidth: '420px' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '8px', borderBottom: '2px solid #000' }}></th>
                  {parsedCols.map((c, i) => (
                    <th key={i} style={{ width: 36, textAlign: 'center', padding: '6px', borderBottom: '2px solid #000' }}>{c.letter}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((label, rIdx) => (
                  <tr key={rIdx}>
                    <td style={{ padding: '8px 6px', borderBottom: '1px solid #ccc', fontWeight: 600 }}>
                      {Array.isArray(question.subIds) ? `${question.subIds[rIdx]}. ` : `${rIdx + 1} `}
                      {typeof label === 'string' ? label : (label?.label ?? '')}
                    </td>
                    {parsedCols.map((c, cIdx) => (
                      <td key={cIdx} style={{ textAlign: 'center', padding: '6px 4px', borderBottom: '1px solid #eee', cursor: 'pointer' }}>
                        <input
                          type="radio"
                          name={`q-${question.id}-row-${rIdx}`}
                          value={c.letter}
                          checked={localSel[rIdx] === c.letter}
                          onChange={() => choose(rIdx, c.letter)}
                          style={{ transform: 'scale(0.9)', cursor: 'pointer' }}
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
                <table style={{ borderCollapse: 'collapse', minWidth: '280px' }}>
                  <tbody>
                    {parsedCols.map((c, i) => (
                      <tr key={i}>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd', fontWeight: 700, width: 34 }}>{c.letter}</td>
                        <td style={{ padding: '4px 6px', border: '1px solid #ddd' }}>{c.label || ''}</td>
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
      {question.type === 'dropdown' && (() => {
        // Parse options like "ii How hurricanes form" → value "ii", label full text
        const parsedOptions = (question.options || []).map((opt) => {
          const text = String(opt ?? '');
          const firstSpace = text.indexOf(' ');
          if (firstSpace > 0) {
            const code = text.slice(0, firstSpace).trim();
            return { value: code, label: text };
          }
          // Fallback: whole string as value
          return { value: text, label: text };
        });

        // Support previously-saved full-label answers by normalizing to code
        const labelToValue = parsedOptions.reduce((acc, o) => { acc[o.label] = o.value; return acc; }, {});
        const valueSet = new Set(parsedOptions.map(o => o.value));
        const normalizedValue = (() => {
          if (!answer) return '';
          if (valueSet.has(answer)) return answer; // already code
          // If stored as full label, map back to code
          if (labelToValue[answer]) return labelToValue[answer];
          return '';
        })();

        return (
          <select
            name={`q-${question.id}`}
            value={normalizedValue}
            onChange={(e) => { onVisited?.(question.id); setAnswer(e.target.value); }}
            style={{
              marginLeft: '20px',
              marginTop: '10px',
              padding: '6px 12px',
              width: '80%',
              borderRadius: '5px',
              border: '1px solid #aaa',
              cursor: 'pointer'
            }}
          >
            <option value="">-- Select heading --</option>
            {parsedOptions.map((opt, index) => (
              <option key={index} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      })()}
    </div>
  );
};

export default QuestionBox;
