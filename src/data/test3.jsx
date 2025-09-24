// src/data/test3.jsx
const test3 = {
  id: 'test3',
  title: 'TEST 3 — Listening (Voice)',
  parts: [
    {
      // SECTION 1 — Temporary Patient Record Form (Q1–10)
      title: 'Section 1 — Clinic: Temporary Patient Record Form',
      audioSrc: '/audio/test 2.m4a', // put your audio in public/audio/ (see notes below)
      passage: `Complete the form and notes. Write NO MORE THAN THREE WORDS AND/OR A NUMBER for each answer.`,
      questions: [
        { id: 1,  type: 'written', question: 'Street address:' },
        { id: 2,  type: 'written', question: 'Suburb:' },
        { id: 3,  type: 'written', question: 'Phone number:' },
        { id: 4,  type: 'written', question: 'Type of injury (sprained ______):' },
        { id: 5,  type: 'written', question: 'Date of injury:' },
        { id: 6,  type: 'written', question: 'Doctor advised treatment with ______.' },
        { id: 7,  type: 'written', question: 'The patient is unable to ______.' },
        { id: 8,  type: 'written', question: 'He is experiencing pain in his ______ at night.' },
        { id: 9,  type: 'written', question: 'Advice: Stop using the ______.' },
        { id: 10, type: 'written', question: 'Advice: Do regular ______ at home.' },
      ],
    },

    {
      // SECTION 2 — Gisborne talk (Q11–20)
      title: 'Section 2 — Gisborne Talk',
      audioSrc: '/audio/test 2.m4a',
      passage: `Q11–16 Choose the correct letter A, B or C. Q17–20 Match attractions to the right group (A–G).`,
      questions: [
        // MCQ 11–16
        { id: 11, type: 'mcq', question: 'Main topic of today’s talk', options: ['A', 'B', 'C'] },
        { id: 12, type: 'mcq', question: 'Meaning of the Māori name for Gisborne', options: ['A', 'B', 'C'] },
        { id: 13, type: 'mcq', question: 'Early exports from Gisborne', options: ['A', 'B', 'C'] },
        { id: 14, type: 'mcq', question: 'Current exports to Asia', options: ['A', 'B', 'C'] },
        { id: 15, type: 'mcq', question: 'Gisborne Summer Concert takes place in', options: ['A', 'B', 'C'] },
        { id: 16, type: 'mcq', question: 'On wet days the announcer recommends', options: ['A', 'B', 'C'] },

        // Matching 17–20 (write a single letter A–G)
        // A disabled people | B elderly people | C recently married couples | D pregnant women
        // E secondary school children | F young school children | G young adults
        { id: 17, type: 'written', question: 'Hot Springs Reserve — which group? (A–G)' },
        { id: 18, type: 'written', question: 'Mahia Peninsula — which group? (A–G)' },
        { id: 19, type: 'written', question: 'Motu River Rafting — which group? (A–G)' },
        { id: 20, type: 'written', question: 'Eden Woodlands Park — which group? (A–G)' },
      ],
    },

    {
      // SECTION 3 — SUVs (Q21–30)
      title: 'Section 3 — SUVs (Sports Utility Vehicles)',
      audioSrc: '/audio/test 2.m4a',
      passage: `Complete the notes. Write NO MORE THAN THREE WORDS for each answer.`,
      questions: [
        { id: 21, type: 'written', question: 'Now widely used in ______.' },
        { id: 22, type: 'written', question: 'Useful for ______ purposes.' },
        { id: 23, type: 'written', question: 'Larger ______ capacity.' },
        { id: 24, type: 'written', question: 'Seen as ______ by mothers.' },
        { id: 25, type: 'written', question: 'Drivers prefer the ______.' },
        { id: 26, type: 'written', question: 'SUVs can be ______ in urban centres.' },
        { id: 27, type: 'written', question: 'Because of their ______.' },
        { id: 28, type: 'written', question: 'Liable to ______ easily.' },
        { id: 29, type: 'written', question: 'Limit use to those who need them (e.g., ______).' },
        { id: 30, type: 'written', question: 'Raise cost of ______ paid by SUV drivers.' },
      ],
    },

    {
      // SECTION 4 — Influence of Children on Adult Diet (Q31–40)
      title: 'Section 4 — The Influence of Children on Adult Diet',
      audioSrc: '/audio/test 2.m4a',
      passage: `Complete the notes. Write NO MORE THAN TWO WORDS for each answer.`,
      questions: [
        { id: 31, type: 'written', question: 'The age group that eat most fat is ______.' },
        { id: 32, type: 'written', question: 'Family members living together show ______ levels of fat.' },
        { id: 33, type: 'written', question: 'Other variables include age, education, race, ______.' },
        { id: 34, type: 'written', question: '______ held at Mobile Examination Centres.' },
        { id: 35, type: 'written', question: 'Adults with children are more likely to ______.' },
        { id: 36, type: 'written', question: 'Parents have little ______.' },
        { id: 37, type: 'written', question: 'The study did not consider the ______ of children in each family.' },
        { id: 38, type: 'written', question: 'The ______ between the adults and children.' },
        { id: 39, type: 'written', question: 'Influence may decrease with ______.' },
        { id: 40, type: 'written', question: 'How our ______ affect our diet.' },
      ],
    },
  ],
};

export default test3;
