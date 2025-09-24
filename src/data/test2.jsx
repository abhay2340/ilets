// src/data/test2.jsx

 // Adjust path as needed

const test2 = {
  id: 'test2',
  title: 'TEST 2 — Listening (Voice)',
  parts: [
    {
      // SECTION 1
      title: 'Section 1 — Manor Farm: Application + Notes',
      audioSrc: '/audio/test 1.mp3', // place your mp3 here (see notes below)
      passage: `You will hear a conversation about summer fruit picking at Manor Farm.
Complete the form (Q1–3) and notes (Q4–10). Write NO MORE THAN TWO WORDS and/or A NUMBER.`,
      questions: [
        // Q1–3: FORM (written answers)
        { id: 1,  type: 'written', question: 'Visa valid until:' },
        { id: 2,  type: 'written', question: 'Availability for work: from ______ to ______ (write the START month only here)' },
        { id: 3,  type: 'written', question: 'Availability for work: from ______ to ______ (write the END month only here)' },

        // Q4–10: NOTES (written answers)
        { id: 4,  type: 'written', question: 'Busiest month is ______.' },
        { id: 5,  type: 'written', question: 'Exact picking dates depend on the ______.' },
        { id: 6,  type: 'written', question: 'Pickers over 18 will earn ______ an hour.' },
        { id: 7,  type: 'written', question: 'No accommodation on the farm but there is a ______ nearby.' },
        { id: 8,  type: 'written', question: 'Pickers are advised to travel around by ______.' },
        { id: 9,  type: 'written', question: 'Only pickers with a ______ will be allowed to work.' },
        { id: 10, type: 'written', question: 'Pickers must bring lunch and a day’s supply of ______.' },
      ]
    },

    {
      // SECTION 2
      title: 'Section 2 — Karrara Sports & Leisure Centre',
      audioSrc: '/audio/test 1.mp3', // place your mp3 here (see notes below)
      passage: `You will hear a guide talking about the Karrara Sports & Leisure Centre.
Q11–16: Label the plan with A–I. Write ONE LETTER for each answer.
Q17–20: Choose TWO letters (A–E). For Q17 and Q18, type your two letters separated by a comma (e.g., "B,D").`,
      questions: [
        // Plan labels (letters A–I)
        { id: 11, type: 'written', question: 'Plan label for SEATING (write a letter A–I):' },
        { id: 12, type: 'written', question: 'Plan label for Shop (write a letter A–I):' },
        { id: 13, type: 'written', question: 'Plan label for Playground (write a letter A–I):' },
        { id: 14, type: 'written', question: 'Plan label for Spa (write a letter A–I):' },
        { id: 15, type: 'written', question: 'Plan label for Weights room (write a letter A–I):' },
        { id: 16, type: 'written', question: 'Plan label for Gym (write a letter A–I):' },

        // Two‑answer questions (type the two letters)
        { id: 17, type: 'written', question: 'Which TWO memberships have a special introductory price? (A–E, e.g., "B,D")' },
        { id: 18, type: 'written', question: 'Which TWO memberships have a special introductory price? (A–E, e.g., "B,D")' },

        { id: 19, type: 'written', question: 'Which TWO free gifts will new members get? (A–E, e.g., "A,C")' },
        { id: 20, type: 'written', question: 'Which TWO free gifts will new members get? (A–E, e.g., "A,C")' },
      ]
    },

    {
      // SECTION 3
      title: 'Section 3 — The Value Survey on House Prices',
      audioSrc: '/audio/test 1.mp3', // place your mp3 here (see notes below)
      passage: `You will hear two students, James and Anna, discussing a Value Survey on house prices.
Q21–25: Choose the correct letter A, B, or C.
Q26–30: Match people to criticisms A–G.`,
      questions: [
        // MCQ (A/B/C)
        { id: 21, type: 'mcq', question: 'According to James and Anna, the Value Survey measured the cost of houses by calculating…', options: ['A', 'B', 'C'] },
        { id: 22, type: 'mcq', question: 'Anna says the Value Survey is unusual because…', options: ['A', 'B', 'C'] },
        { id: 23, type: 'mcq', question: 'The students decide that New Zealand house prices are high because of…', options: ['A', 'B', 'C'] },
        { id: 24, type: 'mcq', question: 'When the students talk about transport they are…', options: ['A', 'B', 'C'] },
        { id: 25, type: 'mcq', question: 'The students agree that the next Value Survey will…', options: ['A', 'B', 'C'] },

        // Matching Q26–30 (write a letter A–G)
        { id: 26, type: 'written', question: 'Andrew Coleman criticized (A–G):' },
        { id: 27, type: 'written', question: 'Professor Massey criticized (A–G):' },
        { id: 28, type: 'written', question: 'Richard Bernard criticized (A–G):' },
        { id: 29, type: 'written', question: 'Professor Lowndes criticized (A–G):' },
        { id: 30, type: 'written', question: 'Maria Darling criticized (A–G):' },

        // For reference while listening:
        // A organization of final text
        // B researchers' qualifications
        // C period covered
        // D level of funding
        // E lack of public access to full information
        // F old-fashioned systems of data analysis
        // G way of defining home-buyers' wealth
      ]
    }
  ]
};

export default test2;
