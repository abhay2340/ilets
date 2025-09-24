// src/data/test4.jsx
const test4 = {
  id: 'test4',
  title: 'TEST 4 — Listening (Voice)',
  parts: [
    {
      // SECTION 1 — WCS Membership form (Q1–10)
      title: 'Section 1 — Wildlife Conservation Society: Application for membership',
      audioSrc: '/audio/test3.m4a', // put file in public/audio/ (see step 4)
      passage:
        'Complete the form. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.',
      questions: [
        { id: 1,  type: 'written', question: 'Heard of WCS from:' },
        { id: 2,  type: 'written', question: 'Postcode:' },
        { id: 3,  type: 'written', question: 'Email address (domain after mj@):' },
        { id: 4,  type: 'written', question: 'Length of membership (Years):' },
        { id: 5,  type: 'written', question: 'Type of membership:' },
        { id: 6,  type: 'written', question: 'Fee (£):' },
        { id: 7,  type: 'written', question: 'Name of bank:' },
        { id: 8,  type: 'written', question: 'Date of first payment:' },
        { id: 9,  type: 'written', question: 'Reference number:' },
        { id: 10, type: 'written', question: 'Other request:' },
      ],
    },

    {
      // SECTION 2 — Spring Festival (Q11–20)
      title: 'Section 2 — Spring Festival notice',
      audioSrc: '/audio/test3.m4a',
      passage:
        'Q11–18 Complete the notes. NO MORE THAN TWO WORDS/NUMBER. Q19–20 Choose A, B or C.',
      questions: [
        { id: 11, type: 'written', question: 'Firework display location: Near the ______.' },
        { id: 12, type: 'written', question: 'Pack a ______ and blanket.' },
        { id: 13, type: 'written', question: 'Display of ______ (Central Park).' },
        { id: 14, type: 'written', question: 'Buses from town centre every ______ minutes.' },
        { id: 15, type: 'written', question: 'The ______ Show (Exhibition Centre).' },
        { id: 16, type: 'written', question: '\'Grow Your Imagination\' in the ______.' },
        { id: 17, type: 'written', question: '\'Swing in Spring\' in the ______.' },
        { id: 18, type: 'written', question: 'Saturday matinee performance at ______.' },
        { id: 19, type: 'mcq',    question: 'Spring Festival competition prize', options: ['A','B','C'] },
        { id: 20, type: 'mcq',    question: 'Where to get an entry form', options: ['A','B','C'] },
      ],
    },

    {
      // SECTION 3 — Archaeology Course (Q21–30)
      title: 'Section 3 — Archaeology Course notes',
      audioSrc: '/audio/test3.m4a',
      passage: 'Complete the notes. Write NO MORE THAN THREE WORDS for each answer.',
      questions: [
        { id: 21, type: 'written', question: 'Can be combined with any subject except ______.' },
        { id: 22, type: 'written', question: 'Has three ______ modules in first semester.' },
        { id: 23, type: 'written', question: 'Module 1 title:' },
        { id: 24, type: 'written', question: 'Content: recording, ______, interpretation, display.' },
        { id: 25, type: 'written', question: 'Assessment: by ______.' },
        { id: 26, type: 'written', question: 'Module 2 title:' },
        { id: 27, type: 'written', question: 'Content: ______ and development of built environments.' },
        { id: 28, type: 'written', question: 'Assessment: by ______ examination.' },
        { id: 29, type: 'written', question: 'Module 3 learning method: 50% lab work, 50% ______.' },
        { id: 30, type: 'written', question: 'Site survey at end of module (the ______ is to be announced later).' },
      ],
    },

    {
      // SECTION 4 — Digital tech & learning (Q31–40)
      title: 'Section 4 — Digital technology & learning theories',
      audioSrc: '/audio/test3.m4a',
      passage:
        'Q31–33 Choose A, B or C. Q34–40 Match points to theorists A (Allen), B (James), C (Vander).',
      questions: [
        { id: 31, type: 'mcq',    question: 'Impact on young people (Prensky)', options: ['A','B','C'] },
        { id: 32, type: 'mcq',    question: 'Digital immigrants access computers…', options: ['A','B','C'] },
        { id: 33, type: 'mcq',    question: 'Example of a “digital accent”', options: ['A','B','C'] },
        { id: 34, type: 'written', question: 'Current teaching methods don’t work — theorist (A/B/C):' },
        { id: 35, type: 'written', question: 'Many students don’t understand computers — theorist (A/B/C):' },
        { id: 36, type: 'written', question: 'Computer tech doesn’t interest all students — theorist (A/B/C):' },
        { id: 37, type: 'written', question: 'Students can still learn the traditional way — theorist (A/B/C):' },
        { id: 38, type: 'written', question: 'Students still need research skills — theorist (A/B/C):' },
        { id: 39, type: 'written', question: 'Use computer games to teach — theorist (A/B/C):' },
        { id: 40, type: 'written', question: 'Computers can’t replace educators — theorist (A/B/C):' },
      ],
    },
  ],
};

export default test4;
