// src/data/test5.jsx
const test5 = {
  id: 'test5',
  title: 'TEST 5 — Listening (Voice)',
  parts: [
    {
      // SECTION 1 — Student Accommodation (Q1–10)
      title: 'Section 1 — Student Accommodation',
      audioSrc: '/audio/test4.m4a', // put file in public/audio/ (see step 4)
      passage: 'Complete the table. Write NO MORE THAN TWO WORDS AND/OR A NUMBER for each answer.',
      questions: [
        { id: 1,  type: 'written', question: 'En‑suite: £ ______ per year' },
        { id: 2,  type: 'written', question: 'Rooms not available during the ______' },
        { id: 3,  type: 'written', question: 'Room with a family: ______ (provider name)' },
        { id: 4,  type: 'written', question: 'Arrangements are ______' },
        { id: 5,  type: 'written', question: 'Private renting option (a ______)' },
        { id: 6,  type: 'written', question: 'Gas & electricity £ ______ per month approx' },
        { id: 7,  type: 'written', question: '£9 for ______' },
        { id: 8,  type: 'written', question: 'Additional cost item: ______' },
        { id: 9,  type: 'written', question: 'Need a ______' },
        { id: 10, type: 'written', question: '…and two ______' },
      ],
    },

    {
      // SECTION 2 — Museum / Heritage (Q11–20)
      title: 'Section 2 — Heritage Museum',
      audioSrc: '/audio/test4.m4a',
      passage: 'Q11–18 Choose A, B or C. Q19–20 Complete the sentences (NO MORE THAN TWO WORDS).',
      questions: [
        { id: 11, type: 'mcq',    question: 'The Heritage Clothes exhibition was put together by', options: ['A','B','C'] },
        { id: 12, type: 'mcq',    question: 'The photographs show the clothes worn by', options: ['A','B','C'] },
        { id: 13, type: 'mcq',    question: '“Toys from the Past” is', options: ['A','B','C'] },
        { id: 14, type: 'mcq',    question: 'Visitors are recommended to', options: ['A','B','C'] },
        { id: 15, type: 'mcq',    question: 'The miniature toys have been', options: ['A','B','C'] },
        { id: 16, type: 'mcq',    question: 'The biscuit factory made tins', options: ['A','B','C'] },
        { id: 17, type: 'mcq',    question: 'People’s favourite biscuit used to be', options: ['A','B','C'] },
        { id: 18, type: 'mcq',    question: 'The hands‑on activity allows people to', options: ['A','B','C'] },
        { id: 19, type: 'written', question: 'The gift shop is beside the ______ on the ground floor.' },
        { id: 20, type: 'written', question: 'Free ______ are available for visitors’ belongings.' },
      ],
    },

    {
      // SECTION 3 — Pacific tapa cloth (Q21–30)
      title: 'Section 3 — Pacific tapa cloth',
      audioSrc: '/audio/test4.m4a',
      passage: 'Q21–24 Choose A, B or C. Q25–30 Match countries to function (A–D).',
      questions: [
        { id: 21, type: 'mcq', question: 'How Pacific tapa differs', options: ['A','B','C'] },
        { id: 22, type: 'mcq', question: 'About the paper mulberry tree', options: ['A','B','C'] },
        { id: 23, type: 'mcq', question: 'Why Māori stopped making tapa', options: ['A','B','C'] },
        { id: 24, type: 'mcq', question: 'Large pieces made from smaller pieces that are', options: ['A','B','C'] },

        // Functions: A recreational | B practical | C spiritual | D commercial
        { id: 25, type: 'written', question: 'Samoa — function (A–D):' },
        { id: 26, type: 'written', question: 'Tonga — function (A–D):' },
        { id: 27, type: 'written', question: 'Cook Islands — function (A–D):' },
        { id: 28, type: 'written', question: 'Fiji — function (A–D):' },
        { id: 29, type: 'written', question: 'Tahiti — function (A–D):' },
        { id: 30, type: 'written', question: 'Tikopia — function (A–D):' },
      ],
    },

    {
      // SECTION 4 — Learner Persistence (Q31–40)
      title: 'Section 4 — Learner Persistence study',
      audioSrc: '/audio/test4.m4a',
      passage: 'Q31–32 Choose A/B/C. Q33–40 Complete notes/tables.',
      questions: [
        { id: 31, type: 'mcq',    question: 'Participants were drawn from the same…', options: ['A','B','C'] },
        { id: 32, type: 'mcq',    question: 'Older students were most concerned about…', options: ['A','B','C'] },

        { id: 33, type: 'written', question: 'Enjoyment of a ______ (personal characteristic).' },
        { id: 34, type: 'written', question: 'Positive experiences at ______ (social/env factors).' },
        { id: 35, type: 'written', question: 'Good ______ (other factors).' },
        { id: 36, type: 'written', question: 'Many ______ in daily life (personal characteristic).' },
        { id: 37, type: 'written', question: 'Good interaction with the ______ (social/env).' },

        { id: 38, type: 'written', question: 'Gauge level of ______ (questionnaires).' },
        { id: 39, type: 'written', question: 'Train selected students to act as ______.' },
        { id: 40, type: 'written', question: 'Outside office hours, offer ______ help.' },
      ],
    },
  ],
};

export default test5;
