import React, { useEffect, useMemo, useState } from 'react';
import { useForm, useFieldArray, Controller, useWatch } from 'react-hook-form';
import { toast } from 'react-toastify';
import { db, storage } from './firebaseConfig';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import LoaderOverlay from './components/LoaderOverlay.jsx';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const QUESTION_TYPES = [
  { value: 'mcq', label: 'Multiple Choice (TRUE/FALSE/NOT GIVEN or options)' },
  { value: 'multiselect', label: 'Multi Select (checkboxes, multiple correct)' },
  { value: 'written', label: 'Written (Short Text Answer)' },
  { value: 'dropdown', label: 'Dropdown (Choose One)' },
  { value: 'matchinggroup', label: 'Matching Group (Rows ↔ Columns)' },
  { value: 'matchingdrag', label: 'Matching Sentence Endings (Drag & Drop)' },
  { value: 'summarydrag', label: 'Summary Completion (Drag words into blanks)' },
  { value: 'flowchart', label: 'Flowchart (drag words into boxes)' },
  { value: 'sentencefill', label: 'Sentence Completion (typed words into blanks)' },
  { value: 'maplabel', label: 'Plan/Map/Diagram Labelling (matrix + image)' },
  { value: 'tablefill', label: 'Table Fill (typed blanks in table)' },
  { value: 'headingmatch', label: 'Heading Match (Drag headings to sections)' },
  { value: 'info', label: 'Info/Instruction (No answer)' },
];

const buildValidationSchema = () =>
  yup.object({
    testMeta: yup.object({
      title: yup.string().trim().required('Test title is required'),
      number: yup
        .number()
        .transform((value, originalValue) => (originalValue === '' ? undefined : value))
        .typeError('Test number must be a number')
        .integer('Test number must be an integer')
        .positive('Test number must be positive')
        .required('Test number is required'),
      type: yup.string().oneOf(['audio', 'non-audio']).required('Test type is required'),
    }),
    parts: yup
      .array()
      .of(
        yup.object({
          title: yup.string().required('Part title is required'),
          partInstructions: yup
            .array()
            .of(
              yup.object({
                text: yup.string().trim().required('Instruction text is required'),
                infoKind: yup.string().oneOf(['normal', 'bold']).default('normal'),
              })
            )
            .default([]),
          passage: yup.string().required('Passage is required'),
          audioSrc: yup.string().trim().notRequired(),
          questions: yup
            .array()
            .min(1, 'At least one question is required')
            .of(
              yup.object({
                id: yup.mixed().notRequired(),
                type: yup
                  .string()
                  .oneOf([
                    'mcq',
                    'written',
                    'multiselect',
                    'dropdown',
                    'matchinggroup',
                    'matchingdrag',
                    'headingmatch',
                    'summarydrag',
                    'flowchart',
                    'sentencefill',
                    'maplabel',
                    'tablefill',
                    'info',
                  ])
                  .required('Type is required'),
                question: yup.string().required('Question text is required'),
                table: yup
                  .object({
                    rows: yup
                      .array()
                      .of(yup.array().of(yup.string().default('')))
                      .default([]),
                  })
                  .when('type', {
                    is: 'tablefill',
                    then: (s) => s.required(),
                    otherwise: (s) => s.strip(),
                  }),
                options: yup.array().when('type', {
                  is: (t) =>
                    t === 'mcq' ||
                    t === 'multiselect' ||
                    t === 'dropdown' ||
                    t === 'matchingdrag' ||
                    t === 'headingmatch' ||
                    t === 'summarydrag' ||
                    t === 'flowchart',
                  then: (schema) =>
                    schema
                      .min(2, 'Provide at least 2 options')
                      .of(yup.string().trim().required('Option cannot be empty')),
                  otherwise: (schema) => schema.strip(),
                }),
                answer: yup
                  .string()
                  .trim()
                  .when('type', {
                    is: (t) => t === 'mcq' || t === 'dropdown' || t === 'written',
                    then: (schema) => schema.required('Answer is required'),
                    otherwise: (schema) => schema.strip(),
                  })
                  .when(['type', 'options'], (values, schema) => {
                    const [type, options] = Array.isArray(values) ? values : [undefined, undefined];
                    if (
                      (type === 'mcq' || type === 'dropdown') &&
                      Array.isArray(options) &&
                      options.length > 0
                    ) {
                      return schema.oneOf(options, 'Answer must match one of the options');
                    }
                    return schema;
                  }),
                displayId: yup
                  .string()
                  .trim()
                  .when('type', {
                    is: 'matchinggroup',
                    then: (s) => s.notRequired(),
                    otherwise: (s) => s.strip(),
                  }),
                imageSrc: yup
                  .string()
                  .trim()
                  .when('type', {
                    is: 'maplabel',
                    then: (s) => s.notRequired(),
                    otherwise: (s) => s.strip(),
                  }),
                columns: yup.array().when('type', {
                  is: (t) => t === 'matchinggroup' || t === 'maplabel',
                  then: (s) =>
                    s
                      .min(2, 'At least 2 columns (options) required')
                      .of(yup.string().trim().required('Column cannot be empty')),
                  otherwise: (s) => s.strip(),
                }),
                rows: yup.array().when('type', {
                  is: (t) =>
                    t === 'matchinggroup' ||
                    t === 'matchingdrag' ||
                    t === 'maplabel' ||
                    t === 'flowchart',
                  then: (s) =>
                    s
                      .min(1, 'Add at least 1 row')
                      .of(yup.string().trim().required('Row cannot be empty')),
                  otherwise: (s) => s.strip(),
                }),
                answers: yup.array().when(['type', 'rows', 'question', 'table', 'options'], {
                  is: (vals) => {
                    const [type] = Array.isArray(vals) ? vals : [];
                    return (
                      type === 'matchinggroup' ||
                      type === 'matchingdrag' ||
                      type === 'headingmatch' ||
                      type === 'summarydrag' ||
                      type === 'multiselect' ||
                      type === 'flowchart' ||
                      type === 'sentencefill' ||
                      type === 'maplabel' ||
                      type === 'tablefill'
                    );
                  },
                  then: (s) =>
                    s
                      .of(yup.string().trim().notRequired()) // Allow empty answers - they'll be filtered out during save
                      .test('answers-length', 'Answers must match number of items', function (val) {
                        const type = this.parent.type;
                        if (
                          type === 'matchinggroup' ||
                          type === 'matchingdrag' ||
                          type === 'maplabel'
                        ) {
                          const rows = this.parent.rows || [];
                          return Array.isArray(val) && val.length === rows.length;
                        }
                        if (type === 'multiselect') {
                          // require at least one correct option
                          const options = this.parent.options || [];
                          return (
                            Array.isArray(val) && val.length >= 1 && val.length <= options.length
                          );
                        }
                        if (type === 'summarydrag') {
                          const qtext = this.parent.question || '';
                          const blanks = (qtext.match(/_{3,}/g) || []).length;
                          return Array.isArray(val) && val.length === blanks;
                        }
                        if (type === 'headingmatch') {
                          // blanks are in the passage (part level), not in the question
                          // Since we can't easily access the passage here, skip strict length validation
                          return Array.isArray(val);
                        }
                        if (type === 'flowchart') {
                          const rows = this.parent.rows || [];
                          let blanks = 0;
                          for (const row of rows || []) {
                            const matches = String(row || '').match(/_{3,}/g) || [];
                            blanks += matches.length;
                          }
                          return Array.isArray(val) && val.length === blanks;
                        }
                        if (type === 'sentencefill') {
                          const qtext = this.parent.question || '';
                          const blanks = (qtext.match(/_{3,}/g) || []).length;
                          return Array.isArray(val) && val.length === blanks;
                        }
                        if (type === 'tablefill') {
                          const rows = this.parent.table?.rows || [];
                          let blanks = 0;
                          for (const row of rows) {
                            for (const cell of row || []) {
                              const matches = String(cell || '').match(/_{3,}/g) || [];
                              blanks += matches.length;
                            }
                          }
                          return Array.isArray(val) && val.length === blanks;
                        }
                        return true;
                      }),
                  otherwise: (s) => s.strip(),
                }),
              })
            ),
        })
      )
      .min(1, 'At least one part is required'),
  });

const defaultValues = {
  testMeta: { title: '', number: '', type: 'non-audio' },
  parts: [
    {
      title: '',
      partInstructions: [],
      passage: '',
      audioSrc: '',
      questions: [],
    },
  ],
};

const Admin = () => {
  const validationSchema = useMemo(() => buildValidationSchema(), []);

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues,
    resolver: yupResolver(validationSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    shouldUnregister: false,
  });
  useEffect(() => {
    console.log(errors);
  }, [errors]);

  const {
    fields: partFields,
    append: appendPart,
    remove: removePart,
  } = useFieldArray({
    control,
    name: 'parts',
  });

  const [generatedQuestionsJson, setGeneratedQuestionsJson] = useState('');
  const [, setGeneratedAnswersJson] = useState('');
  const [audioPreviews, setAudioPreviews] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const { testId } = useParams();
  const isEditing = Boolean(testId);
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const onSubmit = async (values) => {
    const { testMeta } = values;
    const answerMap = {};
    let nextId = 1;

    if (testMeta.type === 'audio') {
      const missing = (values.parts || []).some((p) => !p.audioSrc || !p.audioSrc.trim());
      if (missing) {
        toast.error('Audio test selected: Please provide audioSrc for all parts');
        return;
      }
    }

    const generatedId = isEditing
      ? testId
      : typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    const normalized = {
      id: generatedId,
      title: testMeta.title,
      number: testMeta.number,
      type: testMeta.type,
      parts: values.parts.map((part, partIdx) => {
        console.log(`📝 SAVING passage[${partIdx}]:`, JSON.stringify(part.passage).slice(0, 300));
        return {
          title: part.title,
          passage: part.passage,
          ...(Array.isArray(part.partInstructions) && part.partInstructions.length > 0
            ? { partInstructions: part.partInstructions }
            : {}),
          ...(part.audioSrc ? { audioSrc: part.audioSrc } : {}),
          questions: part.questions.map((q, qIdx) => {
            if (q.type === 'matchinggroup') {
              const rowCount = Array.isArray(q.rows) ? q.rows.length : 0;
              const subIds = Array.from({ length: rowCount }, (_, i) => nextId + i);

              // Read answers directly from form values using getValues (q.answers might not be in values object)
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              // Save answers to answerMap
              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                    console.log(
                      `  ✓ Saved matchinggroup answer for subId ${subId}:`,
                      String(ans).trim()
                    );
                  }
                });
              } else {
                console.warn('  ⚠️ No answers found for matchinggroup question:', q.question);
              }

              nextId += rowCount;
              const out = {
                id: `${subIds[0]}-${subIds[subIds.length - 1]}`,
                type: 'matchinggroup',
                subIds,
                displayId: q.displayId || undefined,
                question: q.question,
                columns: q.columns || [],
                rows: q.rows || [],
              };
              if (!out.displayId) delete out.displayId;
              return out;
            }
            if (q.type === 'maplabel') {
              const rowCount = Array.isArray(q.rows) ? q.rows.length : 0;
              const subIds = Array.from({ length: rowCount }, (_, i) => nextId + i);

              // Read answers directly from form values using getValues (q.answers might not be in values object)
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              // Save answers to answerMap
              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                  }
                });
              }

              nextId += rowCount;
              return {
                id: `${subIds[0]}-${subIds[subIds.length - 1]}`,
                type: 'maplabel',
                subIds,
                question: q.question,
                columns: Array.isArray(q.columns) ? q.columns : [],
                rows: Array.isArray(q.rows) ? q.rows : [],
                ...(q.imageSrc ? { imageSrc: q.imageSrc } : {}),
              };
            }
            if (q.type === 'multiselect') {
              const opts = Array.isArray(q.options) ? q.options : [];

              // Fetch latest answers from form state
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers.filter(Boolean)
                : Array.isArray(q.answers)
                  ? q.answers.filter(Boolean)
                  : [];

              const sorted = [...answers].sort((a, b) => String(a).localeCompare(String(b)));
              const ansString = sorted.join(',');

              if (ansString) {
                answerMap[nextId] = ansString;
              }

              const base = {
                id: nextId,
                type: 'multiselect',
                question: q.question,
                options: opts,
                answer: ansString,
                answers: sorted, // Persist array as well for easier loading
              };
              nextId += 1;
              return base;
            }
            if (q.type === 'matchingdrag') {
              const rowCount = Array.isArray(q.rows) ? q.rows.length : 0;
              const subIds = Array.from({ length: rowCount }, (_, i) => nextId + i);

              // Read answers directly from form values using getValues (q.answers might not be in values object)
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              // Save answers to answerMap
              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                    console.log(`  ✓ Saved answer for subId ${subId}:`, String(ans).trim());
                  }
                });
              } else {
                console.warn('  ⚠️ No answers found for matchingdrag question:', q.question);
              }

              nextId += rowCount;
              return {
                id: `${subIds[0]}-${subIds[subIds.length - 1]}`,
                type: 'matchingdrag',
                subIds,
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [],
                rows: Array.isArray(q.rows) ? q.rows : [],
              };
            }
            if (q.type === 'headingmatch') {
              // Count blanks (___) from the PASSAGE, not the question text
              const passageText = part.passage || '';
              const blanks = (String(passageText).match(/_{3,}/g) || []).length;
              const count = Math.max(0, blanks);
              const subIds = Array.from({ length: count }, (_, i) => nextId + i);

              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                  }
                });
              }

              nextId += count;
              return {
                id: subIds.length > 0 ? `${subIds[0]}-${subIds[subIds.length - 1]}` : `${nextId}`,
                type: 'headingmatch',
                subIds,
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [],
              };
            }
            if (q.type === 'summarydrag') {
              const blanks = (String(q.question || '').match(/_{3,}/g) || []).length;
              const count = Math.max(0, blanks);
              const subIds = Array.from({ length: count }, (_, i) => nextId + i);

              // Read answers directly from form values using getValues (q.answers might not be in values object)
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              // Save answers to answerMap
              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                    console.log(`  ✓ Saved answer for subId ${subId}:`, String(ans).trim());
                  }
                });
              } else {
                console.warn('  ⚠️ No answers found for summarydrag question:', q.question);
              }

              nextId += count;
              return {
                id: subIds.length > 0 ? `${subIds[0]}-${subIds[subIds.length - 1]}` : `${nextId}`,
                type: 'summarydrag',
                subIds,
                question: q.question,
                options: Array.isArray(q.options) ? q.options : [],
              };
            }
            if (q.type === 'flowchart') {
              const rows = Array.isArray(q.rows) ? q.rows : [];
              let count = 0;
              for (const row of rows) {
                const matches = String(row || '').match(/_{3,}/g) || [];
                count += matches.length;
              }
              const subIds = Array.from({ length: count }, (_, i) => nextId + i);

              // Read answers directly from form values
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                  }
                });
              }

              nextId += count;
              return {
                id: subIds.length > 0 ? `${subIds[0]}-${subIds[subIds.length - 1]}` : `${nextId}`,
                type: 'flowchart',
                subIds,
                question: q.question,
                rows,
                options: Array.isArray(q.options) ? q.options : [],
              };
            }
            if (q.type === 'sentencefill') {
              const blanks = (String(q.question || '').match(/_{3,}/g) || []).length;
              const count = Math.max(0, blanks);
              const subIds = Array.from({ length: count }, (_, i) => nextId + i);

              // Read answers directly from form values using getValues (q.answers might not be in values object)
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                  }
                });
              }
              nextId += count;
              return {
                id: subIds.length > 0 ? `${subIds[0]}-${subIds[subIds.length - 1]}` : `${nextId}`,
                type: 'sentencefill',
                subIds,
                question: q.question,
              };
            }
            if (q.type === 'tablefill') {
              const rows = q.table?.rows || [];
              // Sanitize rows: ensure all cells are strings, filter out undefined/null
              const sanitizedRows = rows.map((row) => {
                if (!Array.isArray(row)) return [];
                return row.map((cell) => String(cell ?? ''));
              });
              // Firestore doesn't support nested arrays, so serialize each row as JSON string
              const serializedRows = sanitizedRows.map((row) => JSON.stringify(row));
              let count = 0;
              for (const rr of sanitizedRows) {
                for (const cell of rr || []) {
                  const matches = String(cell || '').match(/_{3,}/g) || [];
                  count += matches.length;
                }
              }
              const subIds = Array.from({ length: count }, (_, i) => nextId + i);

              // Read answers directly from form values using getValues (q.answers might not be in values object)
              const answersPath = `parts.${partIdx}.questions.${qIdx}.answers`;
              const formAnswers = getValues(answersPath);
              const answers = Array.isArray(formAnswers)
                ? formAnswers
                : Array.isArray(q.answers)
                  ? q.answers
                  : [];

              console.log('Tablefill question:', q.question);
              console.log('Answers path:', answersPath);
              console.log('Answers from getValues:', formAnswers);
              console.log('Answers from q.answers:', q.answers);
              console.log('Final answers array:', answers);
              console.log('Blank count:', count, 'SubIds:', subIds);

              // Save answers to answerMap - only save non-empty answers
              if (answers.length > 0) {
                answers.forEach((ans, idx) => {
                  const subId = subIds[idx];
                  if (subId != null && ans != null && String(ans).trim() !== '') {
                    answerMap[subId] = String(ans).trim();
                    console.log(`Saved answer for subId ${subId}:`, String(ans).trim());
                  }
                });
                console.log(
                  'Final answerMap for this question:',
                  Object.fromEntries(
                    Object.entries(answerMap).filter(([k]) => subIds.includes(Number(k)))
                  )
                );
              } else {
                console.warn(
                  'Tablefill question has no answers array or it is empty. Question:',
                  q.question
                );
                console.warn('Tried to read from path:', answersPath);
                console.warn('Full question object keys:', Object.keys(q));
              }

              nextId += count;
              return {
                id: subIds.length > 0 ? `${subIds[0]}-${subIds[subIds.length - 1]}` : `${nextId}`,
                type: 'tablefill',
                subIds,
                question: q.question || '',
                table: { rows: serializedRows }, // Store as array of JSON strings
              };
            }

            if (q.type === 'info') {
              return {
                id: `info-${partIdx}-${qIdx}`,
                type: 'info',
                question: q.question,
                infoKind: q.infoKind || 'normal',
              };
            }

            const id = nextId;
            nextId += 1;
            const base = {
              id,
              type: q.type,
              question: q.question,
            };
            if (q.type === 'mcq' || q.type === 'dropdown') {
              if (Array.isArray(q.options)) base.options = q.options;
            }
            if (q.type === 'written' || q.type === 'mcq' || q.type === 'dropdown') {
              if (q.answer != null && q.answer !== '') answerMap[id] = q.answer;
            }

            return base;
          }),
        };
      }),
    };

    try {
      setIsSaving(true);
      await setDoc(doc(db, 'tests', generatedId), {
        ...normalized,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await setDoc(doc(db, 'answers', generatedId), {
        testId: generatedId,
        answers: answerMap,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast.success(isEditing ? 'Test updated' : 'Test created');
    } catch (e) {
      console.error('Firebase save error:', e);
      toast.error(`Failed to save to Firebase: ${e.message || String(e)}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Load existing test for editing
  useEffect(() => {
    const loadExisting = async () => {
      if (!isEditing) return;
      setIsLoadingExisting(true);
      try {
        const testSnap = await getDoc(doc(db, 'tests', testId));
        if (!testSnap.exists()) {
          toast.error('Test not found');
          setIsLoadingExisting(false);
          return;
        }
        const testData = testSnap.data();
        // answers
        let answersMap = {};
        try {
          const ansSnap = await getDoc(doc(db, 'answers', testId));
          if (ansSnap.exists()) {
            const a = ansSnap.data();
            answersMap = a?.answers || {};
          }
        } catch {}

        const populatedParts = (testData.parts || []).map((part) => ({
          title: part.title || '',
          partInstructions: Array.isArray(part.partInstructions) ? part.partInstructions : [],
          passage: part.passage || '',
          audioSrc: part.audioSrc || '',
          questions: (part.questions || []).map((q) => {
            if (q.type === 'multiselect') {
              const ansStr = answersMap[q.id] || q.answer || '';
              const answers = ansStr
                ? ansStr
                    .split(',')
                    .map((s) => s.trim())
                    .filter(Boolean)
                : [];
              return {
                ...q,
                options: Array.isArray(q.options) ? q.options : [],
                answers,
              };
            }

            if (q.type === 'mcq' || q.type === 'dropdown') {
              const ans = answersMap[q.id] || '';
              return {
                ...q,
                options: Array.isArray(q.options) ? q.options : [],
                answer: ans,
              };
            }

            if (q.type === 'matchinggroup') {
              const subIds = Array.isArray(q.subIds) ? q.subIds : [];
              const answers = subIds.map((sid) => answersMap[sid] || '');
              return { ...q, answers };
            }
            if (
              q.type === 'matchingdrag' ||
              q.type === 'headingmatch' ||
              q.type === 'summarydrag' ||
              q.type === 'flowchart' ||
              q.type === 'sentencefill' ||
              q.type === 'maplabel' ||
              q.type === 'tablefill'
            ) {
              const subIds = Array.isArray(q.subIds) ? q.subIds : [];
              const answers = subIds.map((sid) => answersMap[sid] || '');

              if (q.type === 'matchingdrag') {
                console.log('📥 Admin: Loading matchingdrag question', {
                  question: q.question,
                  subIds,
                  answersFromMap: subIds.map((sid) => ({ subId: sid, answer: answersMap[sid] })),
                  finalAnswers: answers,
                  rowsCount: q.rows?.length || 0,
                  answersCount: answers.length,
                });
              }

              if (q.type === 'summarydrag') {
                const blankCount = (String(q.question || '').match(/_{3,}/g) || []).length;
                console.log('📥 Admin: Loading summarydrag question', {
                  question: q.question,
                  subIds,
                  blankCount,
                  answersFromMap: subIds.map((sid) => ({ subId: sid, answer: answersMap[sid] })),
                  finalAnswers: answers,
                  answersCount: answers.length,
                });
              }

              // For tablefill, deserialize rows from JSON strings back to nested arrays
              if (q.type === 'tablefill' && q.table?.rows) {
                try {
                  const deserializedRows = q.table.rows.map((rowStr) => {
                    if (typeof rowStr === 'string') {
                      try {
                        return JSON.parse(rowStr);
                      } catch {
                        return [];
                      }
                    }
                    // If already an array (legacy data), return as-is
                    if (Array.isArray(rowStr)) return rowStr;
                    return [];
                  });
                  return { ...q, answers, table: { rows: deserializedRows } };
                } catch {
                  return { ...q, answers, table: { rows: [] } };
                }
              }
              return { ...q, answers };
            }
            if (q.type === 'info') return { ...q, infoKind: q.infoKind || 'normal' };
            const ans = answersMap[q.id] || '';
            return { ...q, answer: ans };
          }),
        }));

        reset({
          testMeta: {
            title: testData.title || '',
            number: testData.number || '',
            type: testData.type || 'non-audio',
          },
          parts: populatedParts,
        });
      } catch (e) {
        toast.error('Failed to load test');
      } finally {
        setIsLoadingExisting(false);
      }
    };
    loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, testId]);

  return (
    <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 16 }}>
        Admin: Dynamic Test Builder{' '}
        {isEditing && <span style={{ fontSize: 14, color: '#666' }}>(editing)</span>}
      </h2>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div
          style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 20 }}
        >
          <h3 style={{ marginTop: 0, marginBottom: 12 }}>Test Meta</h3>
          <div
            style={{
              display: 'flex',
              gap: 1,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <label style={{ display: 'block', fontWeight: 600 }}>Test Title</label>
              <input
                placeholder="TEST — Title"
                {...register('testMeta.title')}
                style={{ width: '100%', padding: 8 }}
              />
              {errors.testMeta?.title && (
                <span style={{ color: 'crimson' }}>{errors.testMeta?.title?.message}</span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600 }}>Test Number</label>
              <input
                type="number"
                placeholder="1"
                {...register('testMeta.number')}
                style={{ width: '100%', padding: 8 }}
              />
              {errors.testMeta?.number && (
                <span style={{ color: 'crimson' }}>{errors.testMeta?.number?.message}</span>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontWeight: 600 }}>Test Type</label>
              <select {...register('testMeta.type')} style={{ width: '100%', padding: 8 }}>
                <option value="non-audio">Non-audio</option>
                <option value="audio">Audio</option>
              </select>
              {errors.testMeta?.type && (
                <span style={{ color: 'crimson' }}>{errors.testMeta?.type?.message}</span>
              )}
            </div>
          </div>
        </div>
        {errors.parts?.message && (
          <div style={{ color: 'crimson', marginBottom: 12 }}>{errors.parts.message}</div>
        )}

        {isLoadingExisting ? (
          <LoaderOverlay text="Loading test…" />
        ) : (
          partFields.map((part, partIndex) => (
            <div
              key={part.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 8,
                padding: 16,
                marginBottom: 20,
              }}
            >
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <h3 style={{ margin: 0 }}>Part {partIndex + 1}</h3>
                <button
                  type="button"
                  onClick={() => removePart(partIndex)}
                  style={{
                    background: '#ffe6e6',
                    border: '1px solid #ffcccc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove Part
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 12 }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600 }}>Title</label>
                  <input
                    placeholder="PASSAGE 1"
                    {...register(`parts.${partIndex}.title`)}
                    style={{ width: '100%', padding: 8 }}
                  />
                  {errors.parts?.[partIndex]?.title && (
                    <span style={{ color: 'crimson' }}>
                      {errors.parts?.[partIndex]?.title?.message}
                    </span>
                  )}
                </div>

                <PartInstructionsEditor
                  control={control}
                  register={register}
                  watch={watch}
                  setValue={setValue}
                  partIndex={partIndex}
                  errors={errors}
                />

                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>
                    Passage
                  </label>
                  <Controller
                    control={control}
                    name={`parts.${partIndex}.passage`}
                    render={({ field }) => (
                      <div className="passage-editor-wrapper">
                        <ReactQuill
                          theme="snow"
                          value={field.value || ''}
                          onChange={field.onChange}
                          modules={{
                            toolbar: [
                              ['bold', 'italic', 'underline'],
                              [{ list: 'ordered' }, { list: 'bullet' }],
                              [{ indent: '-1' }, { indent: '+1' }],
                              ['clean'],
                            ],
                          }}
                          formats={['bold', 'italic', 'underline', 'list', 'indent']}
                          placeholder="Paste or write the passage text here"
                          style={{ background: '#fff', minHeight: 200 }}
                        />
                      </div>
                    )}
                  />
                  {errors.parts?.[partIndex]?.passage && (
                    <span style={{ color: 'crimson' }}>
                      {errors.parts?.[partIndex]?.passage?.message}
                    </span>
                  )}
                </div>

                {watch('testMeta.type') === 'audio' && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600 }}>Audio Src</label>
                      <input
                        placeholder="Will be set after upload"
                        {...register(`parts.${partIndex}.audioSrc`)}
                        style={{ width: '100%', padding: 8 }}
                      />
                      <small>
                        Uploads to Firebase Storage and sets a streaming URL automatically.
                      </small>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontWeight: 600 }}>
                        Upload Audio (optional)
                      </label>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          // show local preview immediately
                          try {
                            const localUrl = URL.createObjectURL(file);
                            setAudioPreviews((prev) => ({ ...prev, [partIndex]: localUrl }));
                          } catch {}
                          // upload to Firebase Storage
                          try {
                            const safeName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
                            const path = `tests/audio/${safeName}`;
                            const ref = storageRef(storage, path);
                            await uploadBytes(ref, file, {
                              contentType: file.type || 'audio/mpeg',
                            });
                            const downloadURL = await getDownloadURL(ref);
                            setValue(`parts.${partIndex}.audioSrc`, downloadURL);
                            try {
                              toast.success('Audio uploaded');
                            } catch {}
                          } catch (err) {
                            console.error('Audio upload failed', err);
                            try {
                              toast.error('Audio upload failed');
                            } catch {}
                          }
                        }}
                      />
                      {audioPreviews[partIndex] && (
                        <audio
                          controls
                          style={{ marginTop: 8, width: '100%' }}
                          src={audioPreviews[partIndex]}
                        />
                      )}
                    </div>
                  </>
                )}
              </div>

              <QuestionsSection
                control={control}
                register={register}
                watch={watch}
                partIndex={partIndex}
                errors={errors}
                setValue={setValue}
              />
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() =>
            appendPart({
              title: '',
              partInstructions: [],
              passage: '',
              audioSrc: '',
              questions: [],
            })
          }
          style={{
            background: '#f0f7ff',
            border: '1px solid #cfe3ff',
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          + Add Part
        </button>
        <button
          type="submit"
          disabled={isSaving}
          style={{
            background: '#e8ffe8',
            border: '1px solid #c1f0c1',
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
            marginRight: 8,
          }}
        >
          {isSaving ? 'Saving…' : 'Save Test'}
        </button>
        <button
          type="button"
          onClick={() => {
            reset(defaultValues);
            setGeneratedQuestionsJson('');
            setGeneratedAnswersJson('');
          }}
          style={{
            background: '#fff8e6',
            border: '1px solid #ffe8b3',
            padding: '8px 12px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      </form>
    </div>
  );
};

const QuestionsSection = ({ control, register, watch, partIndex, errors, setValue }) => {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `parts.${partIndex}.questions`,
  });

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4 style={{ margin: 0 }}>Questions</h4>
      </div>

      {errors.parts?.[partIndex]?.questions?.message && (
        <div style={{ color: 'crimson', marginTop: 8 }}>
          {errors.parts?.[partIndex]?.questions?.message}
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {fields.map((q, qIndex) => (
          <QuestionCard
            key={q.id}
            control={control}
            register={register}
            watch={watch}
            partIndex={partIndex}
            qIndex={qIndex}
            errors={errors}
            remove={remove}
            setValue={setValue}
          />
        ))}
      </div>

      <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
        <button
          type="button"
          onClick={() => {
            append({ type: 'mcq', question: '', options: ['TRUE', 'FALSE', 'NOT GIVEN'] });
          }}
          style={{
            background: '#f0fff9',
            border: '1px solid #c7f7e3',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          + Add Question
        </button>
      </div>
    </div>
  );
};

const QuestionCard = ({
  control,
  register,
  watch,
  partIndex,
  qIndex,
  errors,
  remove,
  setValue,
}) => {
  const fieldName = `parts.${partIndex}.questions.${qIndex}`;
  const questionTypeError = errors.parts?.[partIndex]?.questions?.[qIndex]?.type?.message;
  const questionTextError = errors.parts?.[partIndex]?.questions?.[qIndex]?.question?.message;

  return (
    <div style={{ border: '1px dashed #e2e8f0', borderRadius: 8, padding: 12 }}>
      <div
        style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div style={{ flex: 1 }}>
          <label style={{ display: 'block', fontWeight: 600 }}>Type</label>
          <Controller
            control={control}
            name={`${fieldName}.type`}
            render={({ field }) => (
              <select {...field} style={{ width: '100%', padding: 8 }}>
                {QUESTION_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            )}
          />
          {questionTypeError && <span style={{ color: 'crimson' }}>{questionTypeError}</span>}
        </div>

        <div style={{ width: 120, alignSelf: 'flex-end', textAlign: 'right' }}>
          <button
            type="button"
            onClick={() => remove(qIndex)}
            style={{
              background: '#ffecec',
              border: '1px solid #ffd4d4',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            Remove
          </button>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontWeight: 600, marginBottom: 4 }}>Question Text</label>
        <Controller
          control={control}
          name={`${fieldName}.question`}
          render={({ field }) => (
            <ReactQuill
              theme="snow"
              value={field.value || ''}
              onChange={field.onChange}
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline'],
                  [{ list: 'ordered' }, { list: 'bullet' }],
                  [{ indent: '-1' }, { indent: '+1' }],
                  ['clean'],
                ],
              }}
              formats={['bold', 'italic', 'underline', 'list', 'indent']}
              placeholder="Enter question/instruction text"
              style={{ background: '#fff' }}
            />
          )}
        />
        {questionTextError && <span style={{ color: 'crimson' }}>{questionTextError}</span>}
      </div>

      <OptionsSection
        control={control}
        register={register}
        partIndex={partIndex}
        qIndex={qIndex}
        errors={errors}
      />

      <InfoStyleSection
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        partIndex={partIndex}
        qIndex={qIndex}
        errors={errors}
      />

      <AnswerSection
        control={control}
        register={register}
        watch={watch}
        setValue={setValue}
        partIndex={partIndex}
        qIndex={qIndex}
        errors={errors}
      />
    </div>
  );
};

const OptionsSection = ({ control, register, partIndex, qIndex, errors }) => {
  const namePrefix = `parts.${partIndex}.questions.${qIndex}`;

  // Read the type via a hidden Controller to drive conditional UI without extra re-renders
  return (
    <Controller
      control={control}
      name={`${namePrefix}.type`}
      render={({ field }) => {
        const type = field.value;
        if (!(type === 'mcq' || type === 'dropdown' || type === 'multiselect')) return null;

        return (
          <OptionsEditor
            control={control}
            register={register}
            namePrefix={namePrefix}
            errors={errors}
          />
        );
      }}
    />
  );
};

const OptionsEditor = ({ control, register, namePrefix, errors }) => {
  const { fields, append, remove } = useFieldArray({ control, name: `${namePrefix}.options` });
  const optionsError = errors?.parts && getNestedError(errors, `${namePrefix}.options`);

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600 }}>Options</label>
      {typeof optionsError === 'string' && (
        <div style={{ color: 'crimson', marginBottom: 8 }}>{optionsError}</div>
      )}
      <div style={{ display: 'grid', gap: 8 }}>
        {fields.map((opt, idx) => (
          <div key={opt.id} style={{ display: 'flex', gap: 8 }}>
            <input
              placeholder={`Option ${idx + 1}`}
              {...register(`${namePrefix}.options.${idx}`)}
              style={{ flex: 1, padding: 8 }}
            />
            <button
              type="button"
              onClick={() => remove(idx)}
              style={{
                background: '#fff2f2',
                border: '1px solid #ffdcdc',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => append('')}
        style={{
          marginTop: 8,
          background: '#eefaff',
          border: '1px solid #d7f0ff',
          padding: '6px 10px',
          borderRadius: 6,
          cursor: 'pointer',
        }}
      >
        + Add Option
      </button>
    </div>
  );
};

const PartInstructionsEditor = ({ control, register, watch, setValue, partIndex, errors }) => {
  const namePrefix = `parts.${partIndex}.partInstructions`;
  const { fields, append, remove } = useFieldArray({ control, name: namePrefix });

  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
        Instructions (Above Passage)
      </label>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {fields.map((field, idx) => {
          const instructionText = watch(`${namePrefix}.${idx}.text`) || '';
          const infoKind = watch(`${namePrefix}.${idx}.infoKind`) || 'normal';
          return (
            <div
              key={field.id}
              style={{
                border: '1px solid #e0e0e0',
                borderRadius: 6,
                padding: 12,
                background: '#fafafa',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span style={{ fontWeight: 600, fontSize: 14 }}>Instruction {idx + 1}</span>
                <button
                  type="button"
                  onClick={() => remove(idx)}
                  style={{
                    background: '#ffe6e6',
                    border: '1px solid #ffcccc',
                    padding: '4px 8px',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  Remove
                </button>
              </div>
              <div style={{ marginBottom: 8 }}>
                <input
                  placeholder="Enter instruction text"
                  {...register(`${namePrefix}.${idx}.text`)}
                  style={{ width: '100%', padding: 8 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    {...register(`${namePrefix}.${idx}.infoKind`)}
                    value="normal"
                    checked={infoKind === 'normal' || (!infoKind && infoKind !== 'bold')}
                    onChange={() =>
                      setValue(`${namePrefix}.${idx}.infoKind`, 'normal', { shouldDirty: true })
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <span>Normal</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                  <input
                    type="radio"
                    {...register(`${namePrefix}.${idx}.infoKind`)}
                    value="bold"
                    checked={infoKind === 'bold'}
                    onChange={() =>
                      setValue(`${namePrefix}.${idx}.infoKind`, 'bold', { shouldDirty: true })
                    }
                    style={{ cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 800 }}>Bold</span>
                </label>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => append({ text: '', infoKind: 'normal' })}
          style={{
            background: '#eefaff',
            border: '1px solid #d7f0ff',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            alignSelf: 'flex-start',
          }}
        >
          + Add Instruction
        </button>
      </div>
    </div>
  );
};

const InfoStyleSection = ({ control, register, watch, setValue, partIndex, qIndex, errors }) => {
  const namePrefix = `parts.${partIndex}.questions.${qIndex}`;
  const questionType = watch(`${namePrefix}.type`);

  if (questionType !== 'info') return null;

  const infoKind = watch(`${namePrefix}.infoKind`) || 'normal';

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Text Style</label>
      <div style={{ display: 'flex', gap: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="radio"
            {...register(`${namePrefix}.infoKind`)}
            value="normal"
            checked={infoKind === 'normal' || (!infoKind && infoKind !== 'bold')}
            onChange={() => setValue(`${namePrefix}.infoKind`, 'normal', { shouldDirty: true })}
            style={{ cursor: 'pointer' }}
          />
          <span>Normal</span>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="radio"
            {...register(`${namePrefix}.infoKind`)}
            value="bold"
            checked={infoKind === 'bold'}
            onChange={() => setValue(`${namePrefix}.infoKind`, 'bold', { shouldDirty: true })}
            style={{ cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 800 }}>Bold</span>
        </label>
      </div>
    </div>
  );
};

const HeadingMatchEditor = ({
  control,
  register,
  namePrefix,
  errors,
  watch,
  setValue,
  blankCount,
}) => {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: `${namePrefix}.options` });
  const { fields: answerFields } = useFieldArray({ control, name: `${namePrefix}.answers` });

  const optionsError = getNestedError(errors, `${namePrefix}.options`);
  const answersError = getNestedError(errors, `${namePrefix}.answers`);
  const currentOptions = watch(`${namePrefix}.options`) || [];

  // Sync answers array with passage blank count
  React.useEffect(() => {
    if (blankCount > 0 && answerFields.length !== blankCount) {
      const newAnswers = Array(blankCount).fill('');
      answerFields.forEach((_, idx) => {
        if (idx < newAnswers.length) {
          const existingValue = watch(`${namePrefix}.answers.${idx}`) || '';
          newAnswers[idx] = existingValue;
        }
      });
      setValue(`${namePrefix}.answers`, newAnswers, { shouldDirty: true, shouldValidate: true });
    }
  }, [blankCount, answerFields.length, namePrefix, setValue, watch]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8, color: '#555' }}>
        Put three or more underscores <strong>___</strong> in the <strong>Passage</strong> above to
        mark each heading drop zone. Then add heading options below and select the correct heading
        for each blank.
      </div>
      {blankCount > 0 && (
        <div
          style={{
            marginBottom: 8,
            padding: '6px 10px',
            background: '#eef2ff',
            borderRadius: 6,
            color: '#3730a3',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Detected {blankCount} blank{blankCount !== 1 ? 's' : ''} in the passage
        </div>
      )}
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>
            Heading Options (draggable bank)
          </label>
          {typeof optionsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{optionsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {optionFields.map((opt, idx) => (
              <div key={opt.id} style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Heading ${idx + 1}`}
                  {...register(`${namePrefix}.options.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendOption('')}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Heading
          </button>
        </div>
        {blankCount > 0 && (
          <div>
            <label style={{ display: 'block', fontWeight: 600 }}>
              Correct Answer for each blank (in passage order)
            </label>
            {typeof answersError === 'string' && (
              <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {Array.from({ length: blankCount }, (_, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ fontWeight: 600, minWidth: 70 }}>Blank {idx + 1}:</span>
                  <select
                    {...register(`${namePrefix}.answers.${idx}`)}
                    style={{ flex: 1, padding: 8 }}
                  >
                    <option value="">-- Select correct heading --</option>
                    {currentOptions.filter(Boolean).map((opt, optIdx) => (
                      <option key={optIdx} value={String(opt).trim()}>
                        {String(opt).trim()}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const AnswerSection = ({ control, register, watch, setValue, partIndex, qIndex, errors }) => {
  const namePrefix = `parts.${partIndex}.questions.${qIndex}`;
  const fieldError = getNestedError(errors, `${namePrefix}.answer`);

  const questionType = watch(`${namePrefix}.type`);
  const options = watch(`${namePrefix}.options`) || [];

  if (questionType === 'info') return null;

  if (questionType === 'matchinggroup') {
    return (
      <MatchingGroupEditor
        control={control}
        register={register}
        watch={watch}
        namePrefix={namePrefix}
        errors={errors}
      />
    );
  }
  if (questionType === 'matchingdrag') {
    return (
      <DragMatchEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />
    );
  }
  if (questionType === 'headingmatch') {
    // Custom editor: blanks are in the PASSAGE, not in question text
    const passageText = watch(`parts.${partIndex}.passage`) || '';
    const blankCount = (String(passageText).match(/_{3,}/g) || []).length;

    return (
      <HeadingMatchEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        watch={watch}
        setValue={setValue}
        blankCount={blankCount}
      />
    );
  }
  if (questionType === 'multiselect') {
    return (
      <MultiSelectEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        setValue={setValue}
      />
    );
  }
  if (questionType === 'summarydrag') {
    return (
      <SummaryDragEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />
    );
  }
  if (questionType === 'flowchart') {
    return (
      <FlowchartEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        setValue={setValue}
        watch={watch}
      />
    );
  }
  if (questionType === 'sentencefill') {
    return (
      <SentenceFillEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        watch={watch}
        setValue={setValue}
      />
    );
  }
  if (questionType === 'maplabel') {
    return (
      <MapLabelEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        setValue={setValue}
        watch={watch}
      />
    );
  }
  if (questionType === 'tablefill') {
    return (
      <TableFillEditor
        control={control}
        register={register}
        namePrefix={namePrefix}
        errors={errors}
        setValue={setValue}
      />
    );
  }

  if (questionType === 'mcq' || questionType === 'dropdown') {
    return (
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Correct Answer</label>
        <select {...register(`${namePrefix}.answer`)} style={{ width: '100%', padding: 8 }}>
          <option value="">Select correct option…</option>
          {options.map((opt, idx) => (
            <option key={`${opt}-${idx}`} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {typeof fieldError === 'string' && <span style={{ color: 'crimson' }}>{fieldError}</span>}
      </div>
    );
  }

  // written
  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600 }}>Answer</label>
      <input
        placeholder="Enter the correct answer"
        {...register(`${namePrefix}.answer`)}
        style={{ width: '100%', padding: 8 }}
      />
      {typeof fieldError === 'string' && <span style={{ color: 'crimson' }}>{fieldError}</span>}
    </div>
  );
};

const MatchingGroupEditor = ({ control, register, watch, namePrefix, errors }) => {
  const {
    fields: columnFields,
    append: appendColumn,
    remove: removeColumn,
  } = useFieldArray({ control, name: `${namePrefix}.columns` });
  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow,
  } = useFieldArray({ control, name: `${namePrefix}.rows` });
  const {
    // Used via appendAnswer/removeAnswer
    append: appendAnswer,
    remove: removeAnswer,
  } = useFieldArray({ control, name: `${namePrefix}.answers` });

  const columnsError = getNestedError(errors, `${namePrefix}.columns`);
  const rowsError = getNestedError(errors, `${namePrefix}.rows`);
  const answersError = getNestedError(errors, `${namePrefix}.answers`);

  // Get current columns from form state
  const currentColumns = watch(`${namePrefix}.columns`) || [];

  // Generate column labels dynamically based on actual column count
  // This ensures labels are always A, B, C, D, E, F, G, H, I... regardless of state
  const columnLabels = React.useMemo(() => {
    const count = columnFields.length || currentColumns.length || 5;
    return Array.from({ length: count }, (_, i) => String.fromCharCode(65 + i));
  }, [columnFields.length, currentColumns.length]);

  const addRowWithAnswer = () => {
    appendRow('');
    appendAnswer('');
  };
  const removeRowWithAnswer = (idx) => {
    removeRow(idx);
    removeAnswer(idx);
  };

  const addColumnLabel = () => {
    appendColumn('');
  };

  const removeColumnLabel = (idx) => {
    removeColumn(idx);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Matching Group</label>
      <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
        Add a heading for the options table, column labels (A, B, C...) with their descriptions,
        then add rows (questions), and finally specify which column is correct for each row.
      </div>

      <div style={{ display: 'grid', gap: 16, marginTop: 12 }}>
        {/* Columns Section with Heading */}
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 12,
            background: '#fafafa',
          }}
        >
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Options</label>

          {/* Options Table Heading Field */}
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 4, fontSize: 14 }}>
              Table Heading (optional)
            </label>
            <input
              placeholder="e.g., First invented or used by"
              {...register(`${namePrefix}.displayId`)}
              style={{ width: '100%', padding: 8 }}
            />
            <div style={{ fontSize: 11, color: '#999', marginTop: 4 }}>
              This heading will appear above the options table
            </div>
          </div>

          {/* Column Options */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontWeight: 500, marginBottom: 8, fontSize: 14 }}>
              Column Options
            </label>
            {typeof columnsError === 'string' && (
              <div style={{ color: 'crimson', marginBottom: 8 }}>{columnsError}</div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
              {columnFields.map((col, idx) => (
                <div key={col.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      minWidth: 40,
                      fontWeight: 600,
                      fontSize: 16,
                      color: '#333',
                      textAlign: 'center',
                    }}
                  >
                    {columnLabels[idx] || String.fromCharCode(65 + idx)}
                  </span>
                  <input
                    placeholder={`Description for ${columnLabels[idx] || String.fromCharCode(65 + idx)} (e.g., "the Chinese")`}
                    {...register(`${namePrefix}.columns.${idx}`)}
                    style={{ flex: 1, padding: 8 }}
                  />
                  <button
                    type="button"
                    onClick={() => removeColumnLabel(idx)}
                    style={{
                      background: '#fff2f2',
                      border: '1px solid #ffdcdc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addColumnLabel}
              style={{
                marginTop: 8,
                background: '#eefaff',
                border: '1px solid #d7f0ff',
                padding: '6px 10px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              + Add Column
            </button>
          </div>
        </div>

        {/* Rows Section */}
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 12,
            background: '#fafafa',
          }}
        >
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Rows (Questions/Items)
          </label>
          {typeof rowsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{rowsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {rowFields.map((row, idx) => (
              <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span
                  style={{
                    minWidth: 40,
                    fontWeight: 600,
                    fontSize: 16,
                    color: '#333',
                    textAlign: 'center',
                  }}
                >
                  {idx + 1}
                </span>
                <input
                  placeholder={`Question ${idx + 1} (e.g., "black powder")`}
                  {...register(`${namePrefix}.rows.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeRowWithAnswer(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRowWithAnswer}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Row
          </button>
        </div>

        {/* Table Heading Preview Section */}
        {(watch(`${namePrefix}.displayId`) || columnFields.length > 0) && (
          <div
            style={{
              border: '1px solid #e0e0e0',
              borderRadius: 8,
              padding: 12,
              background: '#fff9f0',
            }}
          >
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
              Table Heading Preview
            </label>
            <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
              This is how the options table will appear in the test
            </div>

            {watch(`${namePrefix}.displayId`) && (
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  marginBottom: 12,
                  padding: 8,
                  background: '#fff',
                  border: '1px solid #e0e0e0',
                  borderRadius: 4,
                }}
              >
                {watch(`${namePrefix}.displayId`)}
              </div>
            )}

            {columnFields.length > 0 && (
              <div
                style={{
                  border: '1px solid #ddd',
                  borderRadius: 4,
                  overflow: 'hidden',
                  background: '#fff',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <tbody>
                    {columnFields.map((col, idx) => (
                      <tr key={col.id}>
                        <td
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            fontWeight: 600,
                            width: 60,
                            textAlign: 'center',
                            background: '#f9f9f9',
                          }}
                        >
                          {columnLabels[idx] || String.fromCharCode(65 + idx)}
                        </td>
                        <td
                          style={{
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                          }}
                        >
                          {watch(`${namePrefix}.columns.${idx}`) || '(empty)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Answers Section */}
        <div
          style={{
            border: '1px solid #e0e0e0',
            borderRadius: 8,
            padding: 12,
            background: '#f0fff4',
          }}
        >
          <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>
            Answers (Which column for each row?)
          </label>
          {typeof answersError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>
          )}
          {rowFields.length === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', padding: 8 }}>
              Add rows above to specify answers
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {rowFields.map((row, idx) => (
                <div key={row.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ minWidth: 100, color: '#666', fontWeight: 500 }}>
                    Row {idx + 1}:
                  </span>
                  <input
                    placeholder={`Enter column letter (e.g., ${columnLabels[0] || 'A'})`}
                    {...register(`${namePrefix}.answers.${idx}`)}
                    style={{ flex: 1, padding: 8, maxWidth: 200 }}
                  />
                  <span style={{ fontSize: 12, color: '#999' }}>
                    Available: {columnLabels.slice(0, columnFields.length).join(', ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MapLabelEditor = ({ control, register, namePrefix, errors, setValue, watch }) => {
  const {
    fields: columnFields,
    append: appendColumn,
    remove: removeColumn,
  } = useFieldArray({ control, name: `${namePrefix}.columns` });
  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow,
  } = useFieldArray({ control, name: `${namePrefix}.rows` });
  const { fields: answerFields, replace: replaceAnswers } = useFieldArray({
    control,
    name: `${namePrefix}.answers`,
  });

  const columnsError = getNestedError(errors, `${namePrefix}.columns`);
  const rowsError = getNestedError(errors, `${namePrefix}.rows`);
  const answersError = getNestedError(errors, `${namePrefix}.answers`);

  // Watch current columns for dropdowns
  const currentColumns = watch(`${namePrefix}.columns`) || [];

  // Watch rows to sync answers array length
  const watchedRows = useWatch({ control, name: `${namePrefix}.rows` });
  const watchedAnswers = useWatch({ control, name: `${namePrefix}.answers` });

  // Sync answers array length with rows array length
  React.useEffect(() => {
    const rowCount = Array.isArray(watchedRows) ? watchedRows.length : 0;
    const currentAnswers = Array.isArray(watchedAnswers) ? watchedAnswers : [];

    if (rowCount !== currentAnswers.length) {
      const newAnswers = Array(rowCount).fill('');
      // Preserve existing answers if they exist
      currentAnswers.forEach((ans, idx) => {
        if (idx < newAnswers.length) {
          newAnswers[idx] = ans || '';
        }
      });
      replaceAnswers(newAnswers);
      setValue(`${namePrefix}.answers`, newAnswers, { shouldDirty: true, shouldValidate: true });
    }
  }, [watchedRows?.length, answerFields.length, namePrefix, setValue, replaceAnswers]);

  const addRowWithAnswer = () => {
    appendRow('');
    // Answer will be auto-added by the useEffect above
  };
  const removeRowWithAnswer = (idx) => {
    removeRow(idx);
    // Answer will be auto-removed by the useEffect above
  };

  const [previewUrl, setPreviewUrl] = React.useState('');
  const [isImageUploading, setIsImageUploading] = React.useState(false);
  const watchedImageSrc = useWatch({ control, name: `${namePrefix}.imageSrc` });
  const displayImageSrc =
    previewUrl ||
    (typeof watchedImageSrc === 'string' && watchedImageSrc.trim().length > 0
      ? watchedImageSrc.trim()
      : '');

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600 }}>Plan/Map/Diagram Labelling</label>

      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Image URL (optional)</label>
        <input
          placeholder="/images/map-1.png"
          {...register(`${namePrefix}.imageSrc`)}
          style={{ width: '100%', padding: 8 }}
        />
        <small>
          Tip: Use the upload below to set this automatically to /images/&lt;filename&gt; and place
          the file in public/images/.
        </small>
      </div>
      <div style={{ marginTop: 8 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>Upload Image (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setIsImageUploading(true);
            try {
              const storagePath = `maps/${Date.now()}_${file.name}`;
              const ref = storageRef(storage, storagePath);
              await uploadBytes(ref, file);
              const downloadUrl = await getDownloadURL(ref);
              setPreviewUrl(downloadUrl);
              setValue(`${namePrefix}.imageSrc`, downloadUrl, { shouldDirty: true });
            } catch (_) {
              toast.error('Failed to upload image');
            } finally {
              setIsImageUploading(false);
            }
          }}
        />
        {isImageUploading && <div style={{ marginTop: 6, color: '#555' }}>Uploading…</div>}
      </div>

      {displayImageSrc && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 600, marginBottom: 6 }}>Image preview</div>
          <img
            src={displayImageSrc}
            alt=""
            style={{ maxWidth: 260, borderRadius: 8, border: '1px solid #eee' }}
          />
        </div>
      )}

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Columns (A–H, etc.)</label>
          {typeof columnsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{columnsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {columnFields.map((col, idx) => (
              <div key={col.id} style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Letter ${idx + 1} (e.g., A)`}
                  {...register(`${namePrefix}.columns.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeColumn(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendColumn('')}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Column
          </button>
        </div>

        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Rows (items to label)</label>
          {typeof rowsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{rowsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {rowFields.map((row, idx) => {
              const currentAnswer = watch(`${namePrefix}.answers.${idx}`) || '';
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    gap: 32,
                    alignItems: 'flex-start',
                    justifyContent: 'flex-start',
                  }}
                >
                  <input
                    placeholder={`Row ${idx + 1}`}
                    {...register(`${namePrefix}.rows.${idx}`)}
                    style={{ flex: 1, padding: 8 }}
                  />
                  <select
                    {...register(`${namePrefix}.answers.${idx}`)}
                    style={{ width: 150, padding: 8 }}
                  >
                    <option value="">Select answer...</option>
                    {currentColumns.map((col, colIdx) => {
                      const colVal = String(col || '').trim();
                      if (!colVal) return null;
                      return (
                        <option key={`col-${colIdx}`} value={colVal}>
                          {colVal}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRowWithAnswer(idx)}
                    style={{
                      background: '#fff2f2',
                      border: '1px solid #ffdcdc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addRowWithAnswer}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Row
          </button>
        </div>
      </div>
    </div>
  );
};

const DragMatchEditor = ({ control, register, namePrefix, errors, watch, setValue }) => {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: `${namePrefix}.options` });
  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow,
  } = useFieldArray({ control, name: `${namePrefix}.rows` });
  const {
    fields: answerFields,
    append: appendAnswer,
    remove: removeAnswer,
  } = useFieldArray({ control, name: `${namePrefix}.answers` });

  const optionsError = getNestedError(errors, `${namePrefix}.options`);
  const rowsError = getNestedError(errors, `${namePrefix}.rows`);
  const answersError = getNestedError(errors, `${namePrefix}.answers`);

  // Watch current options for dropdowns
  const currentOptions = watch(`${namePrefix}.options`) || [];
  const watchedRows = watch(`${namePrefix}.rows`) || [];
  const watchedAnswers = watch(`${namePrefix}.answers`) || [];

  // Sync answers array length with rows when loading existing data
  React.useEffect(() => {
    const rowsCount = watchedRows.length;
    const answersCount = watchedAnswers.length;

    if (rowsCount > answersCount) {
      // Add missing answer fields
      for (let i = answersCount; i < rowsCount; i++) {
        appendAnswer('');
      }
    } else if (rowsCount < answersCount) {
      // Remove extra answer fields (shouldn't happen, but handle it)
      for (let i = answersCount - 1; i >= rowsCount; i--) {
        removeAnswer(i);
      }
    }
  }, [watchedRows.length, watchedAnswers.length, appendAnswer, removeAnswer]);

  const addRowWithAnswer = () => {
    appendRow('');
    appendAnswer('');
  };
  const removeRowWithAnswer = (idx) => {
    removeRow(idx);
    removeAnswer(idx);
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600 }}>
        Matching Sentence Endings (Drag & Drop)
      </label>

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {/* Rows (Sentence starts) - First */}
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Rows (Sentence starts)</label>
          {typeof rowsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{rowsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {rowFields.map((row, idx) => {
              const currentAnswer = watch(`${namePrefix}.answers.${idx}`) || '';
              return (
                <div
                  key={row.id}
                  style={{
                    display: 'flex',
                    gap: 8,
                    justifyContent: 'flex-start',
                    alignItems: 'flex-start',
                  }}
                >
                  <input
                    placeholder={`Row ${idx + 1}`}
                    {...register(`${namePrefix}.rows.${idx}`)}
                    style={{ width: '70%', padding: 8 }}
                  />
                  <select
                    {...register(`${namePrefix}.answers.${idx}`)}
                    style={{ width: '30%', padding: 8 }}
                  >
                    <option value="">Select ending...</option>
                    {currentOptions.map((opt, optIdx) => {
                      const optVal = String(opt || '').trim();
                      if (!optVal) return null;
                      return (
                        <option key={`opt-${optIdx}`} value={optVal}>
                          {optVal}
                        </option>
                      );
                    })}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeRowWithAnswer(idx)}
                    style={{
                      background: '#fff2f2',
                      border: '1px solid #ffdcdc',
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </div>
              );
            })}
          </div>
          <button
            type="button"
            onClick={addRowWithAnswer}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Row
          </button>
        </div>

        {/* Answer Bank (Endings) - Last */}
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Answer Bank (Endings)</label>
          {typeof optionsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{optionsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {optionFields.map((opt, idx) => (
              <div key={opt.id} style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Ending ${idx + 1}`}
                  {...register(`${namePrefix}.options.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendOption('')}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Option
          </button>
        </div>
      </div>
    </div>
  );
};

const MultiSelectEditor = ({ control, namePrefix, errors, setValue }) => {
  const options = useWatch({ control, name: `${namePrefix}.options` }) || [];
  const answersError = getNestedError(errors, `${namePrefix}.answers`);
  const selected = useWatch({ control, name: `${namePrefix}.answers` }) || [];

  const toggle = (opt) => {
    const current = Array.isArray(selected) ? selected : [];
    const next = [...current];
    const idx = next.indexOf(opt);
    if (idx >= 0) {
      next.splice(idx, 1);
    } else {
      next.push(opt);
    }
    setValue(`${namePrefix}.answers`, next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <div style={{ marginTop: 12 }}>
      <label style={{ display: 'block', fontWeight: 600 }}>Multi Select (Checkboxes)</label>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Correct Answers (select all that apply)
        </label>
        {typeof answersError === 'string' && <div style={{ color: 'crimson' }}>{answersError}</div>}
        <div
          style={{
            display: 'flex',
            gap: 1,
            alignItems: 'flex-start',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          {options.length === 0 && (
            <div style={{ color: '#888', fontStyle: 'italic' }}>
              Add options first in the Options section above.
            </div>
          )}
          {options.map((opt, idx) => {
            const optVal = opt || '';
            const checked = Array.isArray(selected) && selected.includes(optVal);
            return (
              <label
                key={`${optVal}-${idx}`}
                style={{ display: 'flex', gap: 16, justifyContent: 'flex-start' }}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(optVal)}
                  style={{ transform: 'scale(1.05)' }}
                />
                <span>{optVal || `(option ${idx + 1})`}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const SummaryDragEditor = ({ control, register, namePrefix, errors, watch, setValue }) => {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: `${namePrefix}.options` });
  const {
    fields: answerFields,
    append: appendAnswer,
    remove: removeAnswer,
  } = useFieldArray({ control, name: `${namePrefix}.answers` });

  const optionsError = getNestedError(errors, `${namePrefix}.options`);
  const answersError = getNestedError(errors, `${namePrefix}.answers`);

  // Watch question text to count blanks
  const questionText = watch(`${namePrefix}.question`) || '';
  const blankCount = (String(questionText).match(/_{3,}/g) || []).length;

  // Watch current options for dropdowns
  const currentOptions = watch(`${namePrefix}.options`) || [];

  // Track if we've seen answers with values (to avoid overwriting on initial load)
  const answersInitializedRef = React.useRef(false);

  // Sync answers array length with blank count
  React.useEffect(() => {
    if (blankCount > 0) {
      // Check if we have any existing answers with values
      const hasAnswers = answerFields.some((_, idx) => {
        const val = watch(`${namePrefix}.answers.${idx}`) || '';
        return String(val).trim() !== '';
      });

      if (hasAnswers) {
        answersInitializedRef.current = true;
      }

      // Only sync length if blank count changed or if we haven't initialized yet
      if (answerFields.length !== blankCount) {
        const newAnswers = Array(blankCount).fill('');
        // Preserve existing answers if they exist
        answerFields.forEach((ans, idx) => {
          if (idx < newAnswers.length) {
            const existingValue = watch(`${namePrefix}.answers.${idx}`) || '';
            newAnswers[idx] = existingValue;
          }
        });
        // Only update if we have values or if this is the first time
        if (hasAnswers || !answersInitializedRef.current) {
          setValue(`${namePrefix}.answers`, newAnswers, {
            shouldDirty: true,
            shouldValidate: true,
          });
          if (hasAnswers) {
            answersInitializedRef.current = true;
          }
        }
      }
    }
  }, [blankCount, answerFields.length, namePrefix, setValue, watch]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8, color: '#555' }}>
        Use three or more underscores ___ in the Question Text to mark each blank. Add the words
        below for the answer bank, and select the correct answer for each blank from the dropdown.
      </div>
      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Answer Bank (words/phrases)</label>
          {typeof optionsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{optionsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {optionFields.map((opt, idx) => (
              <div key={opt.id} style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Word ${idx + 1}`}
                  {...register(`${namePrefix}.options.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendOption('')}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Word
          </button>
        </div>
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>
            Answers (select from Answer Bank for each blank, in order)
          </label>
          {typeof answersError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>
          )}
          {blankCount === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', padding: 8 }}>
              Add underscores (___) in the Question Text to create blanks
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {answerFields.map((ans, idx) => {
                const currentAnswer = watch(`${namePrefix}.answers.${idx}`) || '';
                return (
                  <div key={ans.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ minWidth: 120, fontWeight: 500 }}>Blank {idx + 1}:</label>
                    <select
                      {...register(`${namePrefix}.answers.${idx}`)}
                      style={{ flex: 1, padding: 8 }}
                    >
                      <option value="">Select answer...</option>
                      {currentOptions.map((opt, optIdx) => {
                        const optVal = String(opt || '').trim();
                        if (!optVal) return null;
                        return (
                          <option key={`opt-${optIdx}`} value={optVal}>
                            {optVal}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const FlowchartEditor = ({ control, register, namePrefix, errors, setValue, watch }) => {
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: `${namePrefix}.options` });
  const {
    fields: rowFields,
    append: appendRow,
    remove: removeRow,
  } = useFieldArray({ control, name: `${namePrefix}.rows` });
  const { fields: answerFields, replace: replaceAnswers } = useFieldArray({
    control,
    name: `${namePrefix}.answers`,
  });

  const optionsError = getNestedError(errors, `${namePrefix}.options`);
  const rowsError = getNestedError(errors, `${namePrefix}.rows`);
  const answersError = getNestedError(errors, `${namePrefix}.answers`);

  const watchedRows = useWatch({ control, name: `${namePrefix}.rows` });
  const watchedAnswers = useWatch({ control, name: `${namePrefix}.answers` });

  // Watch current options for dropdowns
  const currentOptions = watch(`${namePrefix}.options`) || [];

  const blankCount = React.useMemo(() => {
    const rows = Array.isArray(watchedRows) ? watchedRows : [];
    let blanks = 0;
    for (const row of rows) {
      blanks += (String(row || '').match(/_{3,}/g) || []).length;
    }
    return blanks;
  }, [JSON.stringify(watchedRows)]);

  React.useEffect(() => {
    const current = Array.isArray(watchedAnswers) ? watchedAnswers : [];
    if (blankCount === current.length && answerFields.length === blankCount) return;
    const next = Array.from({ length: blankCount }, (_, i) => current[i] || '');
    replaceAnswers(next);
    try {
      setValue(`${namePrefix}.answers`, next, {
        shouldDirty: true,
        shouldTouch: false,
        shouldValidate: false,
      });
    } catch (_) {}
  }, [blankCount, replaceAnswers, watchedAnswers, answerFields.length, namePrefix, setValue]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8, color: '#555' }}>
        Add each flow-chart box below. Use three or more underscores ___ inside a box to mark a
        blank. Add the answer bank words, and select answers from the dropdown for each blank.
      </div>

      <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        {/* Flowchart boxes - First */}
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Flowchart boxes</label>
          {typeof rowsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{rowsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {rowFields.map((row, idx) => (
              <div key={row.id} style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Box ${idx + 1} text (use ___ for blanks)`}
                  {...register(`${namePrefix}.rows.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeRow(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendRow('')}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Box
          </button>
        </div>

        {/* Answer Bank - Second */}
        <div>
          <label style={{ display: 'block', fontWeight: 600 }}>Answer Bank (words/phrases)</label>
          {typeof optionsError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{optionsError}</div>
          )}
          <div style={{ display: 'grid', gap: 8 }}>
            {optionFields.map((opt, idx) => (
              <div key={opt.id} style={{ display: 'flex', gap: 8 }}>
                <input
                  placeholder={`Word ${idx + 1}`}
                  {...register(`${namePrefix}.options.${idx}`)}
                  style={{ flex: 1, padding: 8 }}
                />
                <button
                  type="button"
                  onClick={() => removeOption(idx)}
                  style={{
                    background: '#fff2f2',
                    border: '1px solid #ffdcdc',
                    padding: '6px 10px',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => appendOption('')}
            style={{
              marginTop: 8,
              background: '#eefaff',
              border: '1px solid #d7f0ff',
              padding: '6px 10px',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            + Add Word
          </button>
        </div>

        {/* Answers - Third */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'block', fontWeight: 600 }}>Answers (auto-synced)</label>
            <span style={{ color: '#555', fontSize: 13 }}>Blanks detected: {blankCount}</span>
          </div>
          {typeof answersError === 'string' && (
            <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>
          )}
          {blankCount === 0 ? (
            <div style={{ color: '#999', fontStyle: 'italic', padding: 8 }}>
              Add ___ placeholders in the boxes to enable answers.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {answerFields.map((ans, idx) => {
                const currentAnswer = watch(`${namePrefix}.answers.${idx}`) || '';
                return (
                  <div
                    key={ans.id}
                    style={{
                      display: 'flex',
                      gap: 8,
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                    }}
                  >
                    <label style={{ width: 110, color: '#666', fontWeight: 500 }}>
                      Blank {idx + 1}:
                    </label>
                    <select
                      {...register(`${namePrefix}.answers.${idx}`)}
                      style={{ flex: 1, padding: 8 }}
                    >
                      <option value="">Select answer...</option>
                      {currentOptions.map((opt, optIdx) => {
                        const optVal = String(opt || '').trim();
                        if (!optVal) return null;
                        return (
                          <option key={`opt-${optIdx}`} value={optVal}>
                            {optVal}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SentenceFillEditor = ({ control, register, namePrefix, errors, watch, setValue }) => {
  const {
    fields: answerFields,
    // append: appendAnswer, // Manual control removed
    // remove: removeAnswer, // Manual control removed
  } = useFieldArray({ control, name: `${namePrefix}.answers` });
  const answersError = getNestedError(errors, `${namePrefix}.answers`);

  // Watch question text to count blanks
  const questionText = watch(`${namePrefix}.question`) || '';
  const blankCount = (String(questionText).match(/_{3,}/g) || []).length;

  // Track if we've seen answers with values (to avoid overwriting on initial load)
  const answersInitializedRef = React.useRef(false);

  // Sync answers array length with blank count
  React.useEffect(() => {
    // Check if we have any existing answers with values
    const hasAnswers = answerFields.some((_, idx) => {
      const val = watch(`${namePrefix}.answers.${idx}`) || '';
      return String(val).trim() !== '';
    });

    if (hasAnswers) {
      answersInitializedRef.current = true;
    }

    if (blankCount >= 0) {
      // Only sync length if blank count changed or logic dictates
      // (Using blankCount as the truth)
      if (answerFields.length !== blankCount) {
        const newAnswers = Array(blankCount).fill('');
        // Preserve existing answers if they exist
        answerFields.forEach((ans, idx) => {
          if (idx < newAnswers.length) {
            const existingValue = watch(`${namePrefix}.answers.${idx}`) || '';
            newAnswers[idx] = existingValue;
          }
        });

        // Only update if we have values or if this is the first time/user is editing
        // If it's a new question (no answers yet), we just set the empty slots
        if (hasAnswers || !answersInitializedRef.current || blankCount > 0) {
          setValue(`${namePrefix}.answers`, newAnswers, { shouldValidate: true });
          if (hasAnswers) {
            answersInitializedRef.current = true;
          }
        }
      }
    }
  }, [blankCount, answerFields.length, namePrefix, setValue, watch]);

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 8, color: '#555' }}>
        Use three or more underscores ___ in the Question Text to mark each blank. Provide the
        correct typed answer for each blank in order.
      </div>
      <div>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Answers (one per blank, in order)
        </label>
        {typeof answersError === 'string' && (
          <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {answerFields.map((ans, idx) => (
            <div key={ans.id} style={{ display: 'flex', gap: 8 }}>
              <input
                placeholder={`Answer for blank ${idx + 1}`}
                {...register(`${namePrefix}.answers.${idx}`)}
                style={{ flex: 1, padding: 8 }}
              />
              {/* Manual remove button removed as it's auto-synced */}
            </div>
          ))}
          {answerFields.length === 0 && (
            <div style={{ fontStyle: 'italic', color: '#888' }}>
              No blanks detected yet. Add ___ to the question text.
            </div>
          )}
        </div>
        {/* Manual add button removed */}
      </div>
    </div>
  );
};

const TableFillEditor = ({ register, namePrefix, errors, setValue, control }) => {
  const answersError = getNestedError(errors, `${namePrefix}.answers`);
  // helper to read current rows
  const [_, force] = React.useState(0);

  const rowsRef = React.useRef([]); // we keep a mirror for ease
  const initializedRef = React.useRef(false);

  // Watch the form values to sync when editing existing questions
  const watchedRows = useWatch({ control, name: `${namePrefix}.table.rows` });
  const watchedAnswers = useWatch({ control, name: `${namePrefix}.answers` });

  const getBlankCount = () => {
    const rows = rowsRef.current || [];
    let blanks = 0;
    for (const row of rows) {
      for (const cell of row || []) {
        const m = String(cell || '').match(/_{3,}/g) || [];
        blanks += m.length;
      }
    }
    return blanks;
  };

  const ensureInit = () => {
    const path = `${namePrefix}.table.rows`;
    try {
      // First, try to read from watched form values (for editing)
      if (watchedRows && Array.isArray(watchedRows) && watchedRows.length > 0) {
        // Deserialize if stored as JSON strings from Firestore
        const deserialized = watchedRows.map((row) => {
          if (typeof row === 'string') {
            try {
              return JSON.parse(row);
            } catch {
              return [];
            }
          }
          if (Array.isArray(row)) return row;
          return [];
        });

        // Only update if we have valid data and it's different from current
        if (deserialized.length > 0 && deserialized.some((r) => Array.isArray(r) && r.length > 0)) {
          const currentStr = JSON.stringify(rowsRef.current);
          const newStr = JSON.stringify(deserialized);
          if (currentStr !== newStr) {
            rowsRef.current = deserialized;
            setValue(path, deserialized, { shouldValidate: false });
            force((x) => x + 1);
            initializedRef.current = true;
            return;
          }
        }
      }

      // Otherwise, initialize with empty table if not already initialized
      if (!initializedRef.current) {
        const current = rowsRef.current;
        if (!Array.isArray(current) || current.length === 0) {
          rowsRef.current = [['']];
          setValue(path, [['']], { shouldValidate: false });
          initializedRef.current = true;
        }
      }
    } catch {}
  };

  const lastBlankCountRef = React.useRef(-1);
  const hasSeenAnswersWithValuesRef = React.useRef(false);

  React.useEffect(() => {
    ensureInit();

    // Track blank count changes (but don't auto-sync answers on initial load)
    if (initializedRef.current && rowsRef.current.length > 0) {
      const count = getBlankCount();
      // Only sync if blank count changed AND we've already initialized once
      // This prevents overwriting answers on initial load
      if (lastBlankCountRef.current >= 0 && count !== lastBlankCountRef.current && count > 0) {
        const currentAnswers = watchedAnswers;
        if (Array.isArray(currentAnswers)) {
          // Preserve existing answers, adjust length
          const newAnswers = Array.from({ length: count }, (_, i) =>
            i < currentAnswers.length && currentAnswers[i] != null ? currentAnswers[i] : ''
          );
          setValue(`${namePrefix}.answers`, newAnswers, { shouldValidate: false });
        }
      }
      // Initialize the ref after first render (don't sync on first render)
      if (lastBlankCountRef.current === -1) {
        lastBlankCountRef.current = count;
      }
    }
  }, [namePrefix, watchedRows]);

  // Separate effect to handle answers being loaded from form (when editing)
  // Track if we've seen answers with actual values - never overwrite them
  React.useEffect(() => {
    if (initializedRef.current && rowsRef.current.length > 0) {
      const count = getBlankCount();
      if (count > 0) {
        // Check if answers have actual non-empty values
        const hasValues =
          Array.isArray(watchedAnswers) &&
          watchedAnswers.some((ans) => ans != null && String(ans).trim() !== '');

        if (hasValues) {
          hasSeenAnswersWithValuesRef.current = true;
          // Answers with values exist - only sync length if needed, preserve all values
          if (watchedAnswers.length !== count) {
            const newAnswers = Array.from({ length: count }, (_, i) =>
              i < watchedAnswers.length && watchedAnswers[i] != null ? watchedAnswers[i] : ''
            );
            setValue(`${namePrefix}.answers`, newAnswers, { shouldValidate: false });
          }
          if (lastBlankCountRef.current === -1) {
            lastBlankCountRef.current = count;
          }
        } else if (!hasSeenAnswersWithValuesRef.current) {
          // Never seen answers with values - might be new question or still loading
          // Wait a bit for form to load, then check again
          const timer = setTimeout(() => {
            const finalAnswers = watchedAnswers;
            const finalHasValues =
              Array.isArray(finalAnswers) &&
              finalAnswers.some((ans) => ans != null && String(ans).trim() !== '');

            if (finalHasValues) {
              // Answers loaded! Preserve them
              hasSeenAnswersWithValuesRef.current = true;
              if (finalAnswers.length !== count) {
                const newAnswers = Array.from({ length: count }, (_, i) =>
                  i < finalAnswers.length && finalAnswers[i] != null ? finalAnswers[i] : ''
                );
                setValue(`${namePrefix}.answers`, newAnswers, { shouldValidate: false });
              }
            } else {
              // Truly no answers - only create empty array if this is a new question
              // (we can tell because we've never seen answers with values)
              const newAnswers = Array.from({ length: count }, () => '');
              setValue(`${namePrefix}.answers`, newAnswers, { shouldValidate: false });
            }
            if (lastBlankCountRef.current === -1) {
              lastBlankCountRef.current = count;
            }
          }, 1000); // Wait longer for form to fully load
          return () => clearTimeout(timer);
        }
      }
    }
  }, [namePrefix, watchedAnswers, watchedRows]);

  const getColCount = () => {
    const rows = rowsRef.current || [];
    return rows.reduce((m, r) => Math.max(m, Array.isArray(r) ? r.length : 0), 0) || 1;
  };

  const addRow = () => {
    const cols = getColCount();
    const next = [...(rowsRef.current || [])];
    next.push(Array.from({ length: cols }, () => ''));
    rowsRef.current = next;
    setValue(`${namePrefix}.table.rows`, next);
    force((x) => x + 1);
  };
  const addCol = () => {
    const next = (rowsRef.current || []).map((r) => {
      const row = Array.isArray(r) ? [...r] : [];
      row.push('');
      return row;
    });
    if (next.length === 0) next.push(['']);
    rowsRef.current = next;
    setValue(`${namePrefix}.table.rows`, next);
    force((x) => x + 1);
  };
  const removeRow = (idx) => {
    const next = [...(rowsRef.current || [])];
    next.splice(idx, 1);
    if (next.length === 0) next.push(['']);
    rowsRef.current = next;
    setValue(`${namePrefix}.table.rows`, next);
    force((x) => x + 1);
  };
  const removeCol = (idx) => {
    const base = rowsRef.current || [];
    const next = base.map((r) => {
      const row = Array.isArray(r) ? [...r] : [];
      if (row.length > 1) row.splice(idx, 1);
      return row.length === 0 ? [''] : row;
    });
    rowsRef.current = next;
    setValue(`${namePrefix}.table.rows`, next);
    force((x) => x + 1);
  };
  const setCell = (r, c, v) => {
    const next = (rowsRef.current || []).map((row, ri) => {
      if (ri !== r) return row;
      const copy = Array.isArray(row) ? [...row] : [];
      copy[c] = v;
      return copy;
    });
    rowsRef.current = next;
    setValue(`${namePrefix}.table.rows`, next);
    force((x) => x + 1);
  };

  const getBlankCoords = () => {
    const rows = rowsRef.current || [];
    const coords = [];
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r] || [];
      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] ?? '');
        const m = cell.match(/_{3,}/g) || [];
        for (let k = 0; k < m.length; k++) {
          coords.push({ r: r + 1, c: c + 1, k: k + 1 });
        }
      }
    }
    return coords;
  };

  const syncAnswers = () => {
    const count = getBlankCount();
    const path = `${namePrefix}.answers`;
    // Preserve existing answers when syncing
    const currentAnswers = watchedAnswers;
    const arr = Array.from({ length: count }, (_, i) =>
      Array.isArray(currentAnswers) && i < currentAnswers.length && currentAnswers[i] != null
        ? currentAnswers[i]
        : ''
    );
    setValue(path, arr);
    force((x) => x + 1);
    lastBlankCountRef.current = count; // Update ref so we don't auto-sync again
  };

  const rows = rowsRef.current || [];
  const colCount = getColCount();

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ marginBottom: 6, color: '#555' }}>
        Use three or more underscores ___ inside any cell to mark a blank. Students will see inputs
        inline.
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        <button
          type="button"
          onClick={addRow}
          style={{
            background: '#eefaff',
            border: '1px solid #d7f0ff',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          + Add Row
        </button>
        <button
          type="button"
          onClick={addCol}
          style={{
            background: '#eefaff',
            border: '1px solid #d7f0ff',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          + Add Column
        </button>
        <button
          type="button"
          onClick={syncAnswers}
          style={{
            background: '#f0fff5',
            border: '1px solid #c8f0d2',
            padding: '6px 10px',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          Sync Answers to Blanks
        </button>
        <div style={{ fontSize: 13, color: '#555', alignSelf: 'center' }}>
          Blanks detected: {getBlankCount()}
        </div>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #eee', borderRadius: 8 }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr>
              <th
                style={{
                  width: 50,
                  textAlign: 'center',
                  border: '1px solid #e3e3e3',
                  background: '#fafafa',
                }}
              >
                r\\c
              </th>
              {Array.from({ length: colCount }).map((_, cIdx) => (
                <th
                  key={cIdx}
                  style={{
                    textAlign: 'center',
                    border: '1px solid #e3e3e3',
                    background: '#fafafa',
                    padding: '6px 8px',
                  }}
                >
                  {cIdx + 1}
                </th>
              ))}
              <th style={{ width: 120, border: '1px solid #e3e3e3', background: '#fafafa' }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rIdx) => (
              <tr key={rIdx}>
                <td
                  style={{
                    textAlign: 'center',
                    border: '1px solid #e3e3e3',
                    padding: '6px 8px',
                    background: '#fafafa',
                    fontWeight: 600,
                  }}
                >
                  {rIdx + 1}
                </td>
                {Array.from({ length: Math.max(colCount, row?.length || 0) }).map((_, cIdx) => (
                  <td key={cIdx} style={{ border: '1px solid #e3e3e3', padding: 0 }}>
                    <input
                      value={String(row?.[cIdx] ?? '')}
                      onChange={(e) => setCell(rIdx, cIdx, e.target.value)}
                      placeholder="Cell"
                      style={{ width: '100%', padding: 8, border: 'none', outline: 'none' }}
                    />
                  </td>
                ))}
                <td style={{ padding: 6, whiteSpace: 'nowrap' }}>
                  <button
                    type="button"
                    onClick={() => removeRow(rIdx)}
                    style={{
                      background: '#fff2f2',
                      border: '1px solid #ffdcdc',
                      padding: '6px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    Remove Row
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Remove Column</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {Array.from({ length: colCount }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => removeCol(idx)}
              style={{
                background: '#fff8e6',
                border: '1px solid #ffe8b3',
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
              }}
            >
              Column {idx + 1}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontWeight: 600 }}>
          Answers (row-major, one per blank)
        </label>
        {typeof answersError === 'string' && (
          <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>
        )}
        <div style={{ display: 'grid', gap: 8 }}>
          {(() => {
            const coords = getBlankCoords();
            return coords.map((pos, idx) => (
              <div
                key={`${pos.r}-${pos.c}-${pos.k}-${idx}`}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <div style={{ width: 150, color: '#666' }}>
                  Blank ({pos.r},{pos.c}){pos.k > 1 ? ` #${pos.k}` : ''}
                </div>
                <input
                  {...register(`${namePrefix}.answers.${idx}`)}
                  placeholder={`Answer (${pos.r},${pos.c})${pos.k > 1 ? ` #${pos.k}` : ''}`}
                  style={{ flex: 1, padding: 8 }}
                />
              </div>
            ));
          })()}
          <small style={{ color: '#666' }}>
            Order: row-major (left→right, top→bottom). Coordinates are 1-based (row,col).
          </small>
        </div>
      </div>
    </div>
  );
};

function getNestedError(obj, path) {
  const keys = path.split('.');
  let current = obj;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (current == null) return undefined;
    current = current[key];
  }
  if (typeof current === 'object' && current?.message) return current.message;
  return current;
}

export default Admin;
