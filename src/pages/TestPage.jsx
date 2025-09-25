import React, { useState, useEffect, useRef } from 'react';
import test1 from '../data/test1.jsx';
import test2 from '../data/test2.jsx';
import test3 from '../data/test3.jsx';
import answerKey from '../data/answerkey';
import QuestionBox from '../components/QuestionBox';
import QuestionNavigator from '../components/QuestionNavigator';
import { useNavigate, useLocation } from 'react-router-dom';

// 🔥 Firebase
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig.jsx';
import test4 from '../data/test4.jsx';
import test5 from '../data/test5.jsx';
import test6 from '../data/test6.jsx';
import test7 from '../data/test7.jsx';

const TEST_MAP = { test1, test2, test3, test4, test5, test6, test7 };

const TestPage = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const currentTestId = params.get('testId') || 'test1';
  const testData = TEST_MAP[currentTestId] ?? TEST_MAP['test1'];
  console.log(testData);
  // Ensure we always work with a safe parts array
  const parts = testData?.parts ?? [];
  // pick the first available audio from any part
  const persistentAudioSrc = React.useMemo(() => {
    const withAudio = parts.find(p => p.audioSrc);
    return withAudio ? withAudio.audioSrc : null;
  }, [parts]);

  const TOTAL_DURATION = 60 * 60; // 1 hour

  const [partIndex, setPartIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [submitted, setSubmitted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const timerRef = useRef(null);
  // new ref to always hold latest timeLeft
  const timeLeftRef = useRef(TOTAL_DURATION);
  // --- LISTENING LOCK: once started, user can't pause/seek ---
  const audioRef = useRef(null);
  const [listeningStarted, setListeningStarted] = useState(false);
  const lastTimeRef = useRef(0); // last allowed playback time
  // Resizable passage width
  const [passageWidth, setPassageWidth] = useState(50); // default 50%
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isResizing.current) return;
    const containerWidth = document.querySelector(".test-content-container")?.offsetWidth || window.innerWidth;
    let newWidth = (e.clientX / containerWidth) * 100;
    if (newWidth < 20) newWidth = 20; // min 20%
    if (newWidth > 80) newWidth = 80; // max 80%
    setPassageWidth(newWidth);
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const startListening = async () => {
    if (!audioRef.current) return;
    try {
      audioRef.current.currentTime = 0;
      await audioRef.current.play();   // must be called from a user click
      setListeningStarted(true);
    } catch (e) {
      console.error('Audio play blocked:', e);
    }
  };

  // keep audio un‑pausable and prevent seeking forward
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    // no native UI or PiP/remote options
    el.controls = false;
    try {
      el.setAttribute('controlsList', 'nodownload noplaybackrate noremoteplayback');
      el.disablePictureInPicture = true;
    } catch { }

    const onPause = () => {
      // If user pauses before it finishes, instantly resume
      if (!el.ended && listeningStarted) {
        setTimeout(() => el.play().catch(() => { }), 0);
      }
    };

    const onSeeking = () => {
      // Block jumping ahead; snap back to last allowed position
      const diff = el.currentTime - lastTimeRef.current;
      if (diff > 0.75) el.currentTime = lastTimeRef.current;
    };

    const onTimeUpdate = () => {
      lastTimeRef.current = el.currentTime; // allow progress only forward in time
    };

    el.addEventListener('pause', onPause);
    el.addEventListener('seeking', onSeeking);
    el.addEventListener('timeupdate', onTimeUpdate);

    // Also override OS/media‑key actions (Chrome/Edge/Android/iOS Safari)
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('pause', () => el.play().catch(() => { }));
        navigator.mediaSession.setActionHandler('stop', () => el.play().catch(() => { }));
        navigator.mediaSession.setActionHandler('seekforward', () => (el.currentTime = lastTimeRef.current));
        navigator.mediaSession.setActionHandler('seekto', (e) => {
          if (e.seekTime > lastTimeRef.current) el.currentTime = lastTimeRef.current;
        });
        navigator.mediaSession.setActionHandler('seekbackward', () => {
          // optional: disallow going back too (comment out if you want to allow back)
          el.currentTime = Math.max(0, lastTimeRef.current);
        });
        navigator.mediaSession.setActionHandler('previoustrack', () => { });
        navigator.mediaSession.setActionHandler('nexttrack', () => { });
      } catch { }
    }

    // block context menu on the audio (no tricks)
    const preventContext = (e) => e.preventDefault();
    el.addEventListener('contextmenu', preventContext);

    return () => {
      el.removeEventListener('pause', onPause);
      el.removeEventListener('seeking', onSeeking);
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('contextmenu', preventContext);
    };
  }, [listeningStarted, persistentAudioSrc]);

  // --- Listening lock: once started, user can't pause/seek ---


  const navigate = useNavigate();
  const currentPart = parts[partIndex] ?? parts[0] ?? { title: '', passage: '', questions: [] };
  const hasQuestions = Array.isArray(currentPart.questions) && currentPart.questions.length > 0;

  const handleSetAnswer = (id, val) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    // stop/pause audio when the test ends (optional)
    try { audioRef.current?.pause(); } catch (_) { }

    // compute time taken from the latest ref value
    const timeTaken = TOTAL_DURATION - timeLeftRef.current;

    const allQuestions = parts.flatMap(p => p.questions);
    const userAnswers = {};
    allQuestions.forEach(q => {
      if (typeof q.id === 'number') userAnswers[q.id] = answers[q.id];
    });

    const correctAnswers = answerKey[currentTestId] || {};
    let correct = 0, wrong = 0;
    const qIds = Object.keys(correctAnswers).map(Number);
    const total = qIds.length || allQuestions.filter(q => typeof q.id === 'number').length;

    qIds.forEach(id => {
      const userAns = (userAnswers[id] || '')?.trim();
      const keyAns = (correctAnswers[id] || '')?.trim();

      if (!userAns) return;
      // simple normalization for two-letter multi answers like "B,D"
      const norm = s => s.toUpperCase().replace(/\s+/g, '').split(',').sort().join(',');
      if (norm(userAns) === norm(keyAns)) correct++;
      else wrong++;
    });

    const answered = correct + wrong;
    const unanswered = Math.max(total - answered, 0);
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // 🔥 Save to Firestore
    if (auth?.currentUser) {
      const resultData = {
        user: auth.currentUser.uid,
        test: currentTestId.toUpperCase(),
        correct,
        wrong,
        unanswered,
        total,
        score: correct,
        accuracy,
        timeTaken,          // <-- add this
        submittedAt: new Date()
      };
      const resultId = `${auth.currentUser.uid}_${currentTestId}_${Date.now()}`;
      await setDoc(doc(db, 'results', resultId), resultData);
    }

    // 👉 Navigate to result page
    navigate('/results', {
      state: {
        userAnswers,
        testId: currentTestId,
        timeTaken           // <-- add this
      }
    });

  };

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        const next = prev - 1;

        // keep the ref in sync
        timeLeftRef.current = Math.max(next, 0);

        if (prev <= 1) {
          clearInterval(timerRef.current);
          // when time finishes, submit with correct remaining seconds
          handleSubmit();
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentTestId]);

  return (
    <div style={{ padding: '30px', marginTop: '-20px', maxHeight: '100vh', paddingBottom: '0px' }}>
      {/* Tabs + Timer */}
      {/* Tabs + Timer */}
      {/* Tabs + Timer */}
      {/* Timer only (tabs moved to bottom strip) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: timeLeft <= 300 ? 'red' : 'black' }}>
          Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Persistent, locked audio player for the entire test */}
      {/* Persistent, locked audio for the entire test */}
      {persistentAudioSrc && (
        <div
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 3,
            background: '#fff',
            padding: '10px 0',
            marginBottom: '12px',
            borderBottom: '1px solid #eee',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            userSelect: 'none'
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          {/* Overlay to start listening */}
          {showOverlay && (
            <div
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: 'rgba(0,0,0,0.9)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                flexDirection: 'column',
                textAlign: 'center',
                padding: '20px'
              }}
            >
              <h1 style={{ fontSize: '28px', marginBottom: '20px' }}>Listening Test</h1>
              <p style={{ maxWidth: '600px', marginBottom: '30px', lineHeight: 1.6 }}>
                Once you start, the audio will play continuously and cannot be paused or stopped.
                Please ensure you are ready before beginning.
              </p>
              <button
                onClick={() => {
                  startListening();
                  setShowOverlay(false);
                }}
                style={{
                  backgroundColor: '#b30000',
                  padding: '12px 30px',
                  fontSize: '18px',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Start Listening
              </button>
            </div>
          )}


          {/* Hidden, locked audio (NO controls) */}
          <audio
            ref={audioRef}
            src={persistentAudioSrc}
            preload="auto"
          // no controls -> no play/pause UI
          // we also block pause/seek via events + MediaSession
          />
        </div>
      )}


      {/* Persistent audio player for the entire test (if any) */}
      {/* {persistentAudioSrc && (
  <div style={{
    position: 'sticky',
    top: 0,
    zIndex: 3,
    background: '#fff',
    padding: '8px 0',
    marginBottom: '12px',
    borderBottom: '1px solid #eee'
  }}>
    <audio
      ref={(el) => { if (el) window.__TEST_AUDIO_EL__ = el; }}
      controls
      src={persistentAudioSrc}
      style={{ width: '100%' }}
    >
      Your browser does not support audio playback.
    </audio>
  </div>
)} */}


      {/* Passage & Questions */}
      {/* Passage & Questions */}
      <div className="test-content-container" style={{ display: 'flex', width: '100%', height: '80vh' }}>
        {/* Passage panel */}
        <div
          style={{
            flexBasis: `${passageWidth}%`,
            background: '#f9f9f9',
            padding: '15px',
            borderRadius: '8px',
            overflowY: 'scroll'
          }}
        >
          <h3>{currentPart.title}</h3>
          <p style={{ whiteSpace: 'pre-wrap' }}>{currentPart.passage}</p>
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '5px',
            cursor: 'col-resize',
            background: '#ccc',
            margin: '0 5px'
          }}
        ></div>

        {/* Questions panel */}
        {hasQuestions && (
          <div
            style={{
              flexGrow: 1,
              background: '#ffffff',
              padding: '15px',
              borderRadius: '8px',
              overflowY: 'scroll'
            }}
          >
            <p>
              <strong>
                Questions {currentPart.questions[0].id}–{currentPart.questions.at(-1).id}
              </strong>
            </p>
            {currentPart.questions.map((q) => (
              <QuestionBox
                key={q.id}
                question={q}
                answer={answers[q.id]}
                setAnswer={(val) => handleSetAnswer(q.id, val)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Row: Submit + Navigator */}
      {/* Inline strip: Part buttons, then active part’s numbers, then Submit */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          flexWrap: 'wrap',
          marginTop: 16,
          borderTop: '1px solid #eee',
          paddingTop: 12
        }}
      >
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {/* Part button */}
            <button
              onClick={() => {
                setPartIndex(i);
                // optional: scroll questions into view
                const el = document.querySelector('.test-content-container');
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              style={{
                padding: '8px 12px',
                borderRadius: 16,
                border: '1px solid #bbb',
                background: i === partIndex ? '#b30000' : '#eee',
                color: i === partIndex ? '#fff' : '#333',
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Part {i + 1}
            </button>

            {/* Inline numbers ONLY for the active part */}
            {i === partIndex && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <QuestionNavigator allQuestions={p.questions} />
              </div>
            )}
          </React.Fragment>
        ))}

        {/* Submit pinned to the right (wraps on small screens) */}
        <div style={{ marginLeft: 'auto' }}>
          <button
            onClick={handleSubmit}
            style={{
              backgroundColor: '#b30000',
              padding: '10px 20px',
              fontSize: '15px',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Submit Test
          </button>
        </div>
      </div>

    </div>
  );
};

export default TestPage;