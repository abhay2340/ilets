import React, { useState, useEffect, useRef, useMemo } from 'react';
import test1 from '../data/test1.jsx';
import test2 from '../data/test2.jsx';
import test3 from '../data/test3.jsx';
import test4 from '../data/test4.jsx';
import test5 from '../data/test5.jsx';
import test6 from '../data/test6.jsx';
import test7 from '../data/test7.jsx';
import test8 from '../data/test8.jsx';
import test9 from '../data/test9.jsx';
import answerKey from '../data/answerkey';
import QuestionBox from '../components/QuestionBox';
import QuestionNavigator from '../components/QuestionNavigator';
import { useNavigate, useLocation } from 'react-router-dom';

// 🔥 Firebase
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebaseConfig.jsx';


// Payment and access control
import { useAuth } from '../AuthContext';
import { usePurchases } from '../hooks/usePurchases';
import { isTestFree } from '../config/pricing';
import { FaBan } from 'react-icons/fa';

const TEST_MAP = { test1, test2, test3, test4, test5, test6, test7, test8, test9 };

const TestPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { hasAccess } = usePurchases();

  const params = new URLSearchParams(location.search);
  const currentTestId = params.get('testId') || 'test1';
  const testData = TEST_MAP[currentTestId] ?? TEST_MAP['test1'];

  const [accessChecked, setAccessChecked] = useState(false);
  const [hasTestAccess, setHasTestAccess] = useState(false);

  console.log(testData);
  // Ensure we always work with a safe parts array
  const parts = testData?.parts ?? [];
  // pick the first available audio from any part
  const persistentAudioSrc = useMemo(() => {
    const withAudio = parts.find(p => p.audioSrc);
    return withAudio ? withAudio.audioSrc : null;
  }, [parts]);
  const isListening = !!persistentAudioSrc;

  const TOTAL_DURATION = 60 * 60; // 1 hour

  const [partIndex, setPartIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(TOTAL_DURATION);
  const [submitted, setSubmitted] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [showFocusWarning, setShowFocusWarning] = useState(false);
  const focusWarningTimerRef = useRef(null);
  const lostFocusRef = useRef(false);
  const fullscreenRequiredRef = useRef(true);
  const [needsFullscreen, setNeedsFullscreen] = useState(false);

  const timerRef = useRef(null);
  // new ref to always hold latest timeLeft
  const timeLeftRef = useRef(TOTAL_DURATION);
  // persistent deadline and session key
  const deadlineRef = useRef(null);
  const sessionKeyRef = useRef(null);
  // --- LISTENING LOCK: once started, user can't pause/seek ---
  const audioRef = useRef(null);
  const [listeningStarted, setListeningStarted] = useState(false);
  const lastTimeRef = useRef(0); // last allowed playback time

  // Resizable vertical splitter between passage and questions
  const [passageWidth, setPassageWidth] = useState(50); // percentage
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(50);

  const onSplitterMouseDown = (e) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = passageWidth;
    e.preventDefault();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizingRef.current) return;
      const container = document.querySelector('.test-content-container');
      const containerRect = container ? container.getBoundingClientRect() : null;
      const containerWidth = containerRect ? containerRect.width : window.innerWidth;

      // Calculate delta from start position
      const deltaX = e.clientX - startXRef.current;
      const deltaPercent = (deltaX / containerWidth) * 100;
      let next = startWidthRef.current + deltaPercent;

      if (next < 20) next = 20; // min 20%
      if (next > 80) next = 80; // max 80%
      setPassageWidth(next);
    };

    const handleMouseUp = () => {
      isResizingRef.current = false;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [passageWidth]);

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


  const currentPart = parts[partIndex] ?? parts[0] ?? { title: '', passage: '', questions: [] };
  const hasQuestions = Array.isArray(currentPart.questions) && currentPart.questions.length > 0;

  // Check user access to the test
  useEffect(() => {
    const checkAccess = async () => {
      if (authLoading) return; // wait until auth state is resolved
      if (!user) {
        navigate('/login');
        return;
      }

      // Free tests are always accessible
      if (isTestFree(currentTestId)) {
        setHasTestAccess(true);
        setAccessChecked(true);
        return;
      }

      // Check if user has purchased the test
      const access = await hasAccess(currentTestId);
      if (access) {
        setHasTestAccess(true);
      } else {
        // Redirect to payment page
        navigate(`/payment?testId=${currentTestId}`);
        return;
      }

      setAccessChecked(true);
    };

    checkAccess();
  }, [authLoading, user, currentTestId, hasAccess, navigate]);

  // Submit handler defined before any conditional returns to keep hooks stable
  const handleSubmit = async () => {
    if (submitted) return;
    setSubmitted(true);
    clearInterval(timerRef.current);
    // clear persisted session so it doesn't resume after submission
    try { if (sessionKeyRef.current) localStorage.removeItem(sessionKeyRef.current); } catch (_) { }
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

  // Initialize or resume timer session (disable refresh reset)
  useEffect(() => {
    if (!hasTestAccess) return;

    const makeSessionKey = (uid, testId) => `testSession:${uid || 'anon'}:${testId}`;
    const key = makeSessionKey(auth?.currentUser?.uid, currentTestId);
    sessionKeyRef.current = key;

    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(key) || 'null'); } catch (_) { saved = null; }

    let deadline = saved?.deadline;
    if (!deadline) {
      // create a new deadline (seconds -> ms)
      deadline = Date.now() + TOTAL_DURATION * 1000;
      try { localStorage.setItem(key, JSON.stringify({ deadline })); } catch (_) { }
    }

    deadlineRef.current = deadline;

    // compute remaining from wall clock
    const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
    setTimeLeft(remaining);
    timeLeftRef.current = remaining;

    // Optional: restore UI state if present
    if (saved?.answers && typeof saved.answers === 'object') {
      setAnswers(saved.answers);
    }
    if (typeof saved?.partIndex === 'number') {
      setPartIndex(saved.partIndex);
    }

    if (remaining <= 0) {
      // time already up, auto-submit immediately
      handleSubmit();
    }
  }, [currentTestId, hasTestAccess]);

  // Timer effect must be declared unconditionally; gate logic inside
  useEffect(() => {
    if (!hasTestAccess) return;
    timerRef.current = setInterval(() => {
      const deadline = deadlineRef.current;
      const remaining = Math.max(0, Math.ceil(((deadline || 0) - Date.now()) / 1000));
      setTimeLeft(remaining);
      timeLeftRef.current = remaining;

      if (remaining <= 0) {
        clearInterval(timerRef.current);
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentTestId, hasTestAccess]);

  // Persist minimal state so a refresh resumes seamlessly
  useEffect(() => {
    const key = sessionKeyRef.current;
    if (!key) return;
    try {
      const prev = JSON.parse(localStorage.getItem(key) || '{}');
      localStorage.setItem(key, JSON.stringify({
        ...prev,
        deadline: deadlineRef.current,
        answers,
        partIndex,
      }));
    } catch (_) { }
  }, [answers, partIndex]);

  // Detect tab/window switches and transiently warn the user (on return)
  useEffect(() => {
    const showWarn = () => {
      setShowFocusWarning(true);
      clearTimeout(focusWarningTimerRef.current);
      focusWarningTimerRef.current = setTimeout(() => setShowFocusWarning(false), 2000);
    };

    const onVisibility = () => {
      if (document.hidden) {
        lostFocusRef.current = true;
      } else if (!document.hidden && lostFocusRef.current) {
        lostFocusRef.current = false;
        showWarn();
      }
    };
    const onBlur = () => {
      // window lost focus (alt-tab, other window, etc.)
      lostFocusRef.current = true;
    };
    const onFocus = () => {
      if (lostFocusRef.current) {
        lostFocusRef.current = false;
        showWarn();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      clearTimeout(focusWarningTimerRef.current);
    };
  }, []);

  // Disable copying globally within the test page and block context menu on main container
  useEffect(() => {
    const onCopy = (e) => {
      e.preventDefault();
    };
    const onKeydown = (e) => {
      const isCopy = (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'C');
      if (isCopy) e.preventDefault();
    };
    document.addEventListener('copy', onCopy);
    window.addEventListener('keydown', onKeydown, { capture: true });
    return () => {
      document.removeEventListener('copy', onCopy);
      window.removeEventListener('keydown', onKeydown, { capture: true });
    };
  }, []);

  // Fullscreen enforcement
  useEffect(() => {
    if (!hasTestAccess) return;
    const isFs = () => !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
    const checkFs = () => {
      if (fullscreenRequiredRef.current) setNeedsFullscreen(!isFs());
    };
    checkFs();
    const onFsChange = () => checkFs();
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    document.addEventListener('mozfullscreenchange', onFsChange);
    document.addEventListener('MSFullscreenChange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      document.removeEventListener('mozfullscreenchange', onFsChange);
      document.removeEventListener('MSFullscreenChange', onFsChange);
    };
  }, [hasTestAccess]);

  const requestFullscreen = () => {
    const el = document.documentElement;
    if (el.requestFullscreen) return el.requestFullscreen();
    if (el.webkitRequestFullscreen) return el.webkitRequestFullscreen();
    if (el.mozRequestFullScreen) return el.mozRequestFullScreen();
    if (el.msRequestFullscreen) return el.msRequestFullscreen();
  };

  // Periodic autosave of progress (answers + time left)
  useEffect(() => {
    if (!hasTestAccess) return;
    const key = sessionKeyRef.current;
    if (!key) return;
    const interval = setInterval(() => {
      try {
        const prev = JSON.parse(localStorage.getItem(key) || '{}');
        localStorage.setItem(key, JSON.stringify({
          ...prev,
          deadline: deadlineRef.current,
          answers,
          partIndex,
          timeLeft: timeLeftRef.current,
          savedAt: Date.now(),
        }));
      } catch (_) { }
    }, 5000);
    return () => clearInterval(interval);
  }, [answers, partIndex, hasTestAccess]);

  // Show loading while checking access
  if (!accessChecked) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{
          width: '50px',
          height: '50px',
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #b30000',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
        <p>Verifying access...</p>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show access denied if user doesn't have access
  if (!hasTestAccess) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '20px',
        textAlign: 'center',
        padding: '20px'
      }}>
        <h2>Access Required</h2>
        <p>You need to purchase this test to access it.</p>
        <button
          onClick={() => navigate(`/payment?testId=${currentTestId}`)}
          style={{
            backgroundColor: '#b30000',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Purchase Test
        </button>
      </div>
    );
  }

  const handleSetAnswer = (id, val) => {
    setAnswers(prev => ({ ...prev, [id]: val }));
  };

  return (
    <div style={{ padding: '30px', marginTop: '-20px', maxHeight: '100vh', paddingBottom: '0px' }}>
      {/* Fullscreen required overlay */}
      {needsFullscreen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10001,
            textAlign: 'center',
            padding: 24
          }}
          onContextMenu={(e) => e.preventDefault()}
        >
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ marginBottom: 10 }}>Enter Fullscreen to Continue</h2>
            <p style={{ marginBottom: 18 }}>This test requires fullscreen mode to prevent distractions.</p>
            <button
              onClick={requestFullscreen}
              style={{
                backgroundColor: '#b30000',
                color: '#fff',
                border: 'none',
                padding: '12px 24px',
                borderRadius: 8,
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Enter Fullscreen
            </button>
          </div>
        </div>
      )}
      {/* Tabs + Timer */}
      {/* Tabs + Timer */}
      {/* Tabs + Timer */}
      {/* Timer only (tabs moved to bottom strip) */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginBottom: '15px' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px', color: timeLeft <= 300 ? 'red' : 'black' }}>
          Time Remaining: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </div>
      </div>

      {/* Focus change warning at top-level so it shows even without audio */}
      {showFocusWarning && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: 20
          }}
        >
          <div
            style={{
              background: '#ffffff',
              color: '#333',
              padding: '20px 28px',
              borderRadius: 8,
              boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              fontWeight: 800,
              textAlign: 'center',
              maxWidth: 520
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <FaBan size={36} color="#b30000" />
              <div style={{ fontSize: 18 }}>Tab/Window Switch Detected</div>
            </div>
            <div style={{ fontSize: 14, marginTop: 6, fontWeight: 600 }}>Switching tabs or windows is not allowed during the test.</div>
            <div style={{ fontSize: 13, marginTop: 2 }}>Please return and stay on this page to continue.</div>
          </div>
        </div>
      )}

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


      {/* Content layout: Listening -> single column; Writing -> split */}
      {isListening ? (
        <div className="test-content-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '80vh' }} onContextMenu={(e) => e.preventDefault()}>
          {/* Single column: Passage followed by Questions */}
          <div
            style={{
              background: '#f9f9f9',
              padding: '15px',
              borderRadius: '8px',
              border: '1px solid #ddd',
              marginBottom: '12px',
              maxHeight: '35vh',
              overflowY: 'auto',
              flex: '0 0 auto'
            }}
          >
            <h3>{currentPart.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{currentPart.passage}</p>
          </div>

          {hasQuestions && (
            <div
              style={{
                background: '#ffffff',
                padding: '15px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                overflowY: 'auto',
                flex: '1 1 0',
                minHeight: 0
              }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
            >
              <p>
                <strong>
                  Questions {currentPart.questions[0].id}–{currentPart.questions.at(-1).id}
                </strong>
              </p>
              {currentPart.questions.map((q) => (
                <div
                  key={`qb-wrap-${q.id}`}
                  style={{ userSelect: 'none' }}
                  onMouseDown={(e) => {
                    const tag = (e.target?.tagName || '').toLowerCase();
                    if (tag === 'input' || tag === 'textarea') return;
                    e.preventDefault();
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <QuestionBox
                    key={q.id}
                    question={q}
                    answer={answers[q.id]}
                    setAnswer={(val) => handleSetAnswer(q.id, val)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="test-content-container" style={{ display: 'flex', width: '100%', height: '80vh', userSelect: isResizingRef.current ? 'none' : 'auto' }} onContextMenu={(e) => e.preventDefault()}>
          {/* Passage panel */}
          <div
            style={{
              flexBasis: `${passageWidth}%`,
              background: '#f9f9f9',
              padding: '15px',
              borderRadius: '8px',
              overflowY: 'scroll',
              border: '1px solid #ddd'
            }}
          >
            <h3>{currentPart.title}</h3>
            <p style={{ whiteSpace: 'pre-wrap' }}>{currentPart.passage}</p>
          </div>

          {/* Vertical splitter */}
          <div
            onMouseDown={onSplitterMouseDown}
            style={{
              width: '6px',
              cursor: 'col-resize',
              background: '#ccc',
              margin: '0 8px',
              borderRadius: '3px'
            }}
            title="Drag to resize"
          />

          {/* Questions panel */}
          {hasQuestions && (
            <div
              style={{
                flexGrow: 1,
                background: '#ffffff',
                padding: '15px',
                borderRadius: '8px',
                overflowY: 'scroll',
                border: '1px solid #ddd'
              }}
              onCopy={(e) => e.preventDefault()}
              onCut={(e) => e.preventDefault()}
              onPaste={(e) => e.preventDefault()}
            >
              <p>
                <strong>
                  Questions {currentPart.questions[0].id}–{currentPart.questions.at(-1).id}
                </strong>
              </p>
              {currentPart.questions.map((q) => (
                <div
                  key={`qb-wrap-${q.id}`}
                  style={{ userSelect: 'none' }}
                  onMouseDown={(e) => {
                    const tag = (e.target?.tagName || '').toLowerCase();
                    if (tag === 'input' || tag === 'textarea') return; // allow editing/selection inside inputs
                    e.preventDefault();
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <QuestionBox
                    key={q.id}
                    question={q}
                    answer={answers[q.id]}
                    setAnswer={(val) => handleSetAnswer(q.id, val)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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