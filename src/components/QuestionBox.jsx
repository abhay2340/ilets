import React from 'react';

const QuestionBox = ({ question, answer, setAnswer, onVisited, setAnswerForId }) => {
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

  // Hide the header line for inline paragraph types to avoid duplication
  const hasInlineBlanks = /_{3,}/.test(String(question.question || ''));
  const hideHeader =
    (question.type === 'written' && hasInlineBlanks) ||
    question.type === 'summarydrag' ||
    question.type === 'sentencefill';

  return (
    <div id={`q-${question.id}`} style={{ marginBottom: '25px' }}>
      {!hideHeader && (
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
        const blankRegex = /_{3,}/g; // three or more underscores, global
        if (blankRegex.test(question.question)) {
          const chunks = String(question.question || '').split(/_{3,}/);
          // For legacy 'written' with multiple blanks, render inputs but store a single joined answer string for this question only (no subIds).
          const vals = typeof answer === 'string' ? answer.split('|') : [];
          const [localVals, setLocalVals] = React.useState(vals.length ? vals : Array(chunks.length - 1).fill(''));
          React.useEffect(() => {
            const next = (typeof answer === 'string' && answer.length) ? answer.split('|') : Array(chunks.length - 1).fill('');
            setLocalVals(next);
            // eslint-disable-next-line react-hooks/exhaustive-deps
          }, [answer]);
          const change = (idx, v) => {
            const next = [...localVals];
            next[idx] = v;
            setLocalVals(next);
            onVisited?.(question.id);
            setAnswer(next.join('|'));
          };
          return (
            <div style={{ marginTop: '10px', marginLeft: '10px', lineHeight: 1.8 }}>
              <span style={{ fontWeight: 700, marginRight: 6 }}>•</span>
              {chunks.map((c, i) => {
                if (i === chunks.length - 1) return <span key={`w-c-${i}`}>{c}</span>;
                return (
                  <React.Fragment key={`w-c-${i}`}>
                    <span>{c}</span>
                    <input
                      type="text"
                      value={localVals[i] || ''}
                      onChange={(e) => change(i, e.target.value)}
                      style={{
                        padding: '4px 10px',
                        minWidth: 110,
                        borderRadius: '5px',
                        border: '1px solid #ccc',
                        margin: '0 6px',
                        verticalAlign: 'middle'
                      }}
                      placeholder={`${(question.displayId ?? question.id)}.${i + 1}`}
                    />
                  </React.Fragment>
                );
              })}
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
        const parsedCols = React.useMemo(() => cols.map((c, idx) => {
          const text = String(c ?? '').trim();
          const [first, ...rest] = text.split(' ');
          // If author provided "A the Chinese" pattern, use it
          if (first && first.length === 1 && /[A-Z]/i.test(first)) {
            return { letter: first.toUpperCase(), label: rest.join(' ').trim() };
          }
          // Otherwise, auto-assign letters A, B, C... and treat whole text as label
          const autoLetter = String.fromCharCode(65 + idx);
          return { letter: autoLetter, label: text };
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
          // Also persist per-subId so scoring works on numeric ids
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[rowIdx] === 'number' && typeof setAnswerForId === 'function') {
              setAnswerForId(question.subIds[rowIdx], colLetter);
            }
          } catch { }
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

            {/* Extra prompt box under matrix as requested */}
            <div style={{ marginTop: '14px', border: '1px solid #e5e5e5', borderRadius: 8, padding: 10, background: '#fafafa' }}>
              <div style={{ fontWeight: 800, marginBottom: 8 }}>{String(question.question || '')}</div>
              <div style={{ display: 'grid', gap: 6 }}>
                {parsedCols.map((c, i) => (
                  <div key={`legend-inline-${i}`} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontWeight: 800, width: 22, textAlign: 'center' }}>{c.letter}</span>
                    <span>{c.label || ''}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: '8px', color: '#666', fontSize: '12px' }}>
              Your selections: {localSel.filter(Boolean).length > 0 ? localSel.join(' | ') : 'None'}
            </div>
          </div>
        );
      })()}

      {/* Plan/Map/Diagram labelling (matrix + optional image) */}
      {question.type === 'maplabel' && (() => {
        const rows = Array.isArray(question.rows) ? question.rows : [];
        const cols = Array.isArray(question.columns) ? question.columns : [];

        const parsedCols = React.useMemo(() => cols.map((c) => {
          const text = String(c ?? '').trim();
          const [first, ...rest] = text.split(' ');
          if (first && first.length === 1 && /[A-Z]/i.test(first)) {
            return { letter: first.toUpperCase(), label: rest.join(' ').trim() };
          }
          return { letter: text.toUpperCase(), label: '' };
        }), [cols.join('|')]);

        const selections = React.useMemo(() => {
          const initial = Array(rows.length).fill('');
          if (typeof answer === 'string' && answer.length > 0) {
            const parts = answer.split('|');
            for (let i = 0; i < initial.length; i++) initial[i] = parts[i] || '';
          }
          return initial;
        }, [answer, rows.length]);

        const [localSel, setLocalSel] = React.useState(selections);
        React.useEffect(() => { setLocalSel(selections); }, [selections.join('|')]);

        const choose = (rowIdx, colLetter) => {
          const next = [...localSel];
          next[rowIdx] = colLetter;
          setLocalSel(next);
          onVisited?.(question.id);
          setAnswer(next.join('|'));
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[rowIdx] === 'number' && typeof setAnswerForId === 'function') {
              setAnswerForId(question.subIds[rowIdx], colLetter);
            }
          } catch { }
        };

        return (
          <div style={{ marginTop: '10px' }}>
            {question.imageSrc ? (
              <div style={{ marginBottom: 12 }}>
                <img src={question.imageSrc} alt="" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #eee' }} />
              </div>
            ) : null}
            <div style={{ overflowX: 'auto' }}>
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
            </div>
          </div>
        );
      })()}

      {/* Matching sentence endings - drag & drop */}
      {question.type === 'matchingdrag' && (() => {
        const rows = Array.isArray(question.rows) ? question.rows : [];
        const opts = Array.isArray(question.options) ? question.options : [];
        const letters = opts.map((_, idx) => String.fromCharCode(65 + idx));

        // Parse existing selections from joined answer "A|C|"
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

        // Determine which options are unassigned (in bank)
        const assigned = new Set(localSel.filter(Boolean));
        const bank = letters
          .map((L, i) => ({ letter: L, text: String(opts[i] ?? '') }))
          .filter(o => !assigned.has(o.letter));

        const onDropToRow = (rowIdx, letter) => {
          const next = [...localSel];
          const prevAtRow = next[rowIdx];
          next[rowIdx] = letter;
          // if letter existed in another row, clear it there
          const otherIdx = next.findIndex((l, idx) => idx !== rowIdx && l === letter);
          if (otherIdx >= 0) next[otherIdx] = '';
          setLocalSel(next);
          onVisited?.(Array.isArray(question.subIds) ? question.subIds[rowIdx] : question.id);
          setAnswer(next.join('|'));
          // Persist per-subId too
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[rowIdx] === 'number' && typeof setAnswerForId === 'function') {
              setAnswerForId(question.subIds[rowIdx], letter);
            }
            if (Array.isArray(question.subIds) && typeof question.subIds.find === 'function' && prevAtRow) {
              const prevIdx = selections.findIndex((l, idx) => l === prevAtRow && idx !== rowIdx);
              if (prevIdx >= 0 && typeof question.subIds[prevIdx] === 'number') {
                setAnswerForId?.(question.subIds[prevIdx], prevAtRow);
              }
            }
          } catch { }
        };

        const clearRow = (rowIdx) => {
          const next = [...localSel];
          next[rowIdx] = '';
          setLocalSel(next);
          setAnswer(next.join('|'));
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[rowIdx] === 'number') {
              setAnswerForId?.(question.subIds[rowIdx], '');
            }
          } catch { }
        };

        return (
          <div style={{ marginTop: '10px' }}>
            {/* Rows with droppable boxes */}
            <div style={{ display: 'grid', gap: 10, marginBottom: 12 }}>
              {rows.map((rowText, idx) => {
                const letter = localSel[idx];
                const text = letter ? (opts[letters.indexOf(letter)] ?? '') : '';
                return (
                  <div key={idx} style={{ display: 'grid', gap: 8 }}>
                    <div style={{ fontWeight: 600 }}>
                      {Array.isArray(question.subIds) ? `${question.subIds[idx]}. ` : `${idx + 1}. `}
                      {String(rowText ?? '')}
                    </div>
                    <div
                      data-dnd="dropzone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const L = e.dataTransfer.getData('text/plain');
                        if (!letters.includes(L)) return;
                        onDropToRow(idx, L);
                      }}
                      style={{
                        border: '2px dashed #bbb',
                        borderRadius: 8,
                        minHeight: 44,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        padding: '6px 10px',
                        background: '#fff'
                      }}
                    >
                      {letter ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div>{text}</div>
                        </div>
                      ) : (
                        <span style={{ color: '#777' }}>Drop an answer here</span>
                      )}
                      {letter ? (
                        <button onClick={() => clearRow(idx)} style={{ background: '#ffecec', border: '1px solid #ffd4d4', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>
                          Clear
                        </button>
                      ) : null}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Answer bank below rows */}
            <div>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Answer bank</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {bank.map((o) => (
                  <div
                    key={o.letter}
                    draggable
                    data-dnd="chip"
                    onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', o.letter); }}
                    style={{ padding: '6px 10px', border: '1px solid #bbb', borderRadius: 16, background: '#f8fafc', cursor: 'grab' }}
                    title={o.text}
                  >
                    {o.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Summary completion - drag words into inline blanks */}
      {question.type === 'summarydrag' && (() => {
        const bank = Array.isArray(question.options) ? question.options.map((t) => String(t ?? '')) : [];
        const parts = String(question.question || '').split(/_{3,}/);
        const blankCount = Math.max(0, parts.length - 1);

        const selections = React.useMemo(() => {
          const initial = Array(blankCount).fill('');
          if (typeof answer === 'string' && answer.length > 0) {
            const arr = answer.split('|');
            for (let i = 0; i < initial.length; i++) initial[i] = arr[i] || '';
          }
          return initial;
        }, [answer, blankCount]);

        const [localSel, setLocalSel] = React.useState(selections);

        React.useEffect(() => {
          setLocalSel(selections);
        }, [selections.join('|')]);

        const assigned = new Set(localSel.filter(Boolean));
        const bankRemaining = bank.filter(w => !assigned.has(w));

        const onDropToBlank = (idx, word) => {
          const next = [...localSel];
          // If word is already used elsewhere, clear there
          const otherIdx = next.findIndex((w, i) => i !== idx && w === word);
          if (otherIdx >= 0) next[otherIdx] = '';
          next[idx] = word;
          setLocalSel(next);
          // Persist parent joined answer
          onVisited?.(Array.isArray(question.subIds) ? question.subIds[idx] : question.id);
          setAnswer(next.join('|'));
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[idx] === 'number' && typeof setAnswerForId === 'function') {
              setAnswerForId(question.subIds[idx], word);
            }
          } catch { }
        };

        const clearBlank = (idx) => {
          const next = [...localSel];
          next[idx] = '';
          setLocalSel(next);
          setAnswer(next.join('|'));
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[idx] === 'number') {
              setAnswerForId?.(question.subIds[idx], '');
            }
          } catch { }
        };

        return (
          <div style={{ marginTop: 10 }}>
            {/* Render sentence with inline dropzones */}
            <div style={{ marginLeft: 10, lineHeight: 1.8 }}>
              {parts.map((chunk, i) => {
                if (i === parts.length - 1) return <span key={`c-${i}`}>{chunk}</span>;
                const word = localSel[i];
                return (
                  <React.Fragment key={`c-${i}`}>
                    <span>{chunk}</span>
                    <span
                      data-dnd="dropzone"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const w = e.dataTransfer.getData('text/plain');
                        if (!bank.includes(w)) return;
                        onDropToBlank(i, w);
                      }}
                      style={{
                        display: 'inline-flex',
                        minWidth: 80,
                        minHeight: 32,
                        padding: '4px 8px',
                        border: '2px dashed #bbb',
                        borderRadius: 8,
                        margin: '0 6px',
                        verticalAlign: 'middle',
                        background: '#fff',
                        alignItems: 'center',
                        gap: 8
                      }}
                      title="Drop here"
                    >
                      {word ? (
                        <>
                          <span>{word}</span>
                          <button type="button" onClick={() => clearBlank(i)} style={{ marginLeft: 8, background: '#ffecec', border: '1px solid #ffd4d4', padding: '2px 6px', borderRadius: 6, cursor: 'pointer' }}>
                            ×
                          </button>
                        </>
                      ) : (
                        <span style={{ color: '#777' }}>Drop word</span>
                      )}
                    </span>
                  </React.Fragment>
                );
              })}
            </div>

            {/* Bank */}
            <div style={{ marginTop: 12 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Word list</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {bankRemaining.map((w, idx) => (
                  <div
                    key={`${w}-${idx}`}
                    draggable
                    data-dnd="chip"
                    onDragStart={(e) => { e.stopPropagation(); e.dataTransfer.setData('text/plain', w); }}
                    style={{ padding: '6px 10px', border: '1px solid #bbb', borderRadius: 16, background: '#f8fafc', cursor: 'grab' }}
                    title={w}
                  >
                    {w}
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Sentence completion - inline text inputs into blanks */}
      {question.type === 'sentencefill' && (() => {
        const parts = String(question.question || '').split(/_{3,}/);
        const blankCount = Math.max(0, parts.length - 1);
        const selections = React.useMemo(() => {
          const initial = Array(blankCount).fill('');
          if (typeof answer === 'string' && answer.length > 0) {
            const arr = answer.split('|');
            for (let i = 0; i < initial.length; i++) initial[i] = arr[i] || '';
          }
          return initial;
        }, [answer, blankCount]);
        const [localSel, setLocalSel] = React.useState(selections);
        React.useEffect(() => { setLocalSel(selections); }, [selections.join('|')]);

        const onChangeBlank = (idx, val) => {
          const next = [...localSel];
          next[idx] = val;
          setLocalSel(next);
          setAnswer(next.join('|'));
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[idx] === 'number' && typeof setAnswerForId === 'function') {
              setAnswerForId(question.subIds[idx], val);
            }
          } catch { }
        };

        return (
          <div style={{ marginTop: '10px', marginLeft: '10px', lineHeight: 1.8 }}>
            {parts.map((chunk, i) => {
              if (i === parts.length - 1) return <span key={`sf-c-${i}`}>{chunk}</span>;
              return (
                <React.Fragment key={`sf-c-${i}`}>
                  <span>{chunk}</span>
                  <input
                    type="text"
                    value={localSel[i] || ''}
                    onChange={(e) => onChangeBlank(i, e.target.value)}
                    style={{
                      padding: '4px 10px',
                      minWidth: 100,
                      borderRadius: '5px',
                      border: '1px solid #ccc',
                      margin: '0 6px',
                      verticalAlign: 'middle'
                    }}
                    placeholder={`${(question.displayId ?? question.id)}.${i + 1}`}
                  />
                </React.Fragment>
              );
            })}
          </div>
        );
      })()}

      {/* Table fill - blanks inside table cells */}
      {question.type === 'tablefill' && (() => {
        const table = question.table || {};
        const rows = Array.isArray(table.rows) ? table.rows : [];
        // Build selections array from joined answer "a|b|c" pattern
        // We will maintain row-major blank order
        const computeBlankCount = React.useCallback(() => {
          let cnt = 0;
          for (const rr of rows) {
            for (const cell of (rr || [])) {
              const m = String(cell || '').match(/_{3,}/g) || [];
              cnt += m.length;
            }
          }
          return cnt;
        }, [rows]);

        const selections = React.useMemo(() => {
          const initialCount = computeBlankCount();
          const initial = Array(initialCount).fill('');
          if (typeof answer === 'string' && answer.length > 0) {
            const parts = answer.split('|');
            for (let i = 0; i < initial.length; i++) initial[i] = parts[i] || '';
          }
          return initial;
        }, [answer, computeBlankCount]);

        const [localSel, setLocalSel] = React.useState(selections);
        React.useEffect(() => { setLocalSel(selections); }, [selections.join('|')]);

        let globalIdx = -1;
        const onChangeBlank = (val, idx) => {
          const next = [...localSel];
          next[idx] = val;
          setLocalSel(next);
          setAnswer(next.join('|'));
          try {
            if (Array.isArray(question.subIds) && typeof question.subIds[idx] === 'number' && typeof setAnswerForId === 'function') {
              setAnswerForId(question.subIds[idx], val);
            }
          } catch { }
        };

        return (
          <div style={{ marginTop: '10px' }}>
            <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <tbody>
                  {rows.map((rr, rIdx) => (
                    <tr key={rIdx}>
                      {(rr || []).map((cell, cIdx) => {
                        const chunks = String(cell ?? '').split(/_{3,}/);
                        return (
                          <td key={cIdx} style={{ border: '1px solid #e3e3e3', padding: 8, lineHeight: 1.8 }}>
                            {chunks.map((ch, i) => {
                              if (i === chunks.length - 1) return <span key={`tf-${rIdx}-${cIdx}-${i}`}>{ch}</span>;
                              globalIdx += 1;
                              const idx = globalIdx;
                              return (
                                <React.Fragment key={`tf-${rIdx}-${cIdx}-${i}`}>
                                  <span>{ch}</span>
                                  <input
                                    type="text"
                                    value={localSel[idx] || ''}
                                    onChange={(e) => onChangeBlank(e.target.value, idx)}
                                    style={{ padding: '4px 10px', minWidth: 90, borderRadius: '5px', border: '1px solid #ccc', margin: '0 6px', verticalAlign: 'middle' }}
                                    placeholder={`${(question.displayId ?? question.id)}.${idx + 1}`}
                                  />
                                </React.Fragment>
                              );
                            })}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
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
