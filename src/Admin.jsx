import React, { useEffect, useMemo, useState } from 'react'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { db } from './firebaseConfig'
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { useParams } from 'react-router-dom'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'
import LoaderOverlay from './components/LoaderOverlay.jsx'

const QUESTION_TYPES = [
    { value: 'mcq', label: 'Multiple Choice (TRUE/FALSE/NOT GIVEN or options)' },
    { value: 'written', label: 'Written (Short Text Answer)' },
    { value: 'dropdown', label: 'Dropdown (Choose One)' },
    { value: 'matchinggroup', label: 'Matching Group (Rows ↔ Columns)' },
    { value: 'info', label: 'Info/Instruction (No answer)' }
]

const buildValidationSchema = () =>
    yup.object({
        testMeta: yup.object({
            title: yup.string().trim().required('Test title is required'),
            number: yup.number()
                .transform((value, originalValue) => originalValue === '' ? undefined : value)
                .typeError('Test number must be a number')
                .integer('Test number must be an integer')
                .positive('Test number must be positive')
                .required('Test number is required'),
            type: yup.string().oneOf(['audio', 'non-audio']).required('Test type is required')
        }),
        parts: yup.array().of(
            yup.object({
                title: yup.string().required('Part title is required'),
                passage: yup.string().required('Passage is required'),
                audioSrc: yup.string().trim().notRequired(),
                questions: yup.array().min(1, 'At least one question is required').of(
                    yup.object({
                        id: yup.mixed().notRequired(),
                        type: yup.string().oneOf(['mcq', 'written', 'dropdown', 'matchinggroup', 'info']).required('Type is required'),
                        question: yup.string().required('Question text is required'),
                        options: yup.array()
                            .when('type', {
                                is: (t) => t === 'mcq' || t === 'dropdown',
                                then: (schema) => schema.min(2, 'Provide at least 2 options').of(
                                    yup.string().trim().required('Option cannot be empty')
                                ),
                                otherwise: (schema) => schema.strip()
                            }),
                        answer: yup.string().trim().when('type', {
                            is: (t) => t === 'mcq' || t === 'dropdown' || t === 'written',
                            then: (schema) => schema.required('Answer is required'),
                            otherwise: (schema) => schema.strip()
                        }).when(['type', 'options'], (values, schema) => {
                            const [type, options] = Array.isArray(values) ? values : [undefined, undefined]
                            if ((type === 'mcq' || type === 'dropdown') && Array.isArray(options) && options.length > 0) {
                                return schema.oneOf(options, 'Answer must match one of the options')
                            }
                            return schema
                        }),
                        displayId: yup.string().trim().when('type', {
                            is: 'matchinggroup',
                            then: (s) => s.notRequired(),
                            otherwise: (s) => s.strip()
                        }),
                        columns: yup.array().when('type', {
                            is: 'matchinggroup',
                            then: (s) => s.min(2, 'At least 2 columns (options) required').of(yup.string().trim().required('Column cannot be empty')),
                            otherwise: (s) => s.strip()
                        }),
                        rows: yup.array().when('type', {
                            is: 'matchinggroup',
                            then: (s) => s.min(1, 'Add at least 1 row').of(yup.string().trim().required('Row cannot be empty')),
                            otherwise: (s) => s.strip()
                        }),
                        answers: yup.array().when(['type', 'rows'], {
                            is: (vals) => {
                                const [type, rows] = Array.isArray(vals) ? vals : [undefined, undefined]
                                return type === 'matchinggroup' && Array.isArray(rows) && rows.length > 0
                            },
                            then: (s) => s.of(yup.string().trim().required('Answer cannot be empty')).test('answers-length', 'Answers must match number of rows', function (val) {
                                const rows = this.parent.rows || []
                                return Array.isArray(val) && val.length === rows.length
                            }),
                            otherwise: (s) => s.strip()
                        })
                    })
                )
            })
        ).min(1, 'At least one part is required')
    })

const defaultValues = {
    testMeta: { title: '', number: '', type: 'non-audio' },
    parts: [
        {
            title: '',
            passage: '',
            audioSrc: '',
            questions: []
        }
    ]
}

const Admin = () => {
    const validationSchema = useMemo(() => buildValidationSchema(), [])

    const { control, register, handleSubmit, watch, reset, setValue, trigger, formState: { errors } } = useForm({
        defaultValues,
        resolver: yupResolver(validationSchema),
        mode: 'onChange',
        reValidateMode: 'onChange',
        shouldUnregister: false
    })
    useEffect(() => {
        console.log(errors)
    }, [errors])

    const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({
        control,
        name: 'parts'
    })

    const [generatedQuestionsJson, setGeneratedQuestionsJson] = useState('')
    const [generatedAnswersJson, setGeneratedAnswersJson] = useState('')
    const [audioPreviews, setAudioPreviews] = useState({})
    const [isSaving, setIsSaving] = useState(false)
    const { testId } = useParams()
    const isEditing = Boolean(testId)
    const [isLoadingExisting, setIsLoadingExisting] = useState(false)

    const onSubmit = async (values) => {
        const { testMeta } = values
        const answerMap = {}
        let nextId = 1

        if (testMeta.type === 'audio') {
            const missing = (values.parts || []).some((p) => !p.audioSrc || !p.audioSrc.trim())
            if (missing) {
                toast.error('Audio test selected: Please provide audioSrc for all parts')
                return
            }
        }

        const generatedId = isEditing ? testId : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`)

        const normalized = {
            id: generatedId,
            title: testMeta.title,
            number: testMeta.number,
            type: testMeta.type,
            parts: values.parts.map((part, partIndex) => ({
                title: part.title,
                passage: part.passage,
                ...(part.audioSrc ? { audioSrc: part.audioSrc } : {}),
                questions: part.questions.map((q) => {
                    if (q.type === 'matchinggroup') {
                        const rowCount = Array.isArray(q.rows) ? q.rows.length : 0
                        const subIds = Array.from({ length: rowCount }, (_, i) => nextId + i)
                        if (Array.isArray(q.answers)) {
                            q.answers.forEach((ans, idx) => {
                                const subId = subIds[idx]
                                if (subId != null) answerMap[subId] = ans
                            })
                        }
                        nextId += rowCount
                        const out = {
                            id: `${subIds[0]}-${subIds[subIds.length - 1]}`,
                            type: 'matchinggroup',
                            subIds,
                            displayId: q.displayId || undefined,
                            question: q.question,
                            columns: q.columns || [],
                            rows: q.rows || []
                        }
                        if (!out.displayId) delete out.displayId
                        return out
                    }

                    const id = nextId
                    nextId += 1
                    const base = {
                        id,
                        type: q.type,
                        question: q.question
                    }
                    if (q.type === 'mcq' || q.type === 'dropdown') {
                        if (Array.isArray(q.options)) base.options = q.options
                    }
                    if (q.type !== 'info') {
                        if (q.type === 'written' || q.type === 'mcq' || q.type === 'dropdown') {
                            if (q.answer != null && q.answer !== '') answerMap[id] = q.answer
                        }
                    }
                    return base
                })
            }))
        }

        try {
            setIsSaving(true)
            await setDoc(doc(db, 'tests', generatedId), {
                ...normalized,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            })
            await setDoc(doc(db, 'answers', generatedId), {
                testId: generatedId,
                answers: answerMap,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            })
            toast.success(isEditing ? 'Test updated' : 'Test created')
        } catch (e) {
            toast.error('Failed to save to Firebase')
        } finally {
            setIsSaving(false)
        }
    }

    // Load existing test for editing
    useEffect(() => {
        const loadExisting = async () => {
            if (!isEditing) return
            setIsLoadingExisting(true)
            try {
                const testSnap = await getDoc(doc(db, 'tests', testId))
                if (!testSnap.exists()) {
                    toast.error('Test not found')
                    setIsLoadingExisting(false)
                    return
                }
                const testData = testSnap.data()
                // answers
                let answersMap = {}
                try {
                    const ansSnap = await getDoc(doc(db, 'answers', testId))
                    if (ansSnap.exists()) {
                        const a = ansSnap.data()
                        answersMap = a?.answers || {}
                    }
                } catch { }

                const populatedParts = (testData.parts || []).map((part) => ({
                    title: part.title || '',
                    passage: part.passage || '',
                    audioSrc: part.audioSrc || '',
                    questions: (part.questions || []).map((q) => {
                        if (q.type === 'matchinggroup') {
                            const subIds = Array.isArray(q.subIds) ? q.subIds : []
                            const answers = subIds.map((sid) => answersMap[sid] || '')
                            return { ...q, answers }
                        }
                        if (q.type === 'info') return { ...q }
                        const ans = answersMap[q.id] || ''
                        return { ...q, answer: ans }
                    })
                }))

                reset({
                    testMeta: { title: testData.title || '', number: testData.number || '', type: testData.type || 'non-audio' },
                    parts: populatedParts
                })
            } catch (e) {
                toast.error('Failed to load test')
            } finally {
                setIsLoadingExisting(false)
            }
        }
        loadExisting()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditing, testId])

    const handleDownload = (content, filename) => {
        if (!content) return
        const blob = new Blob([content], { type: 'application/javascript;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = filename
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
    }

    const handleCopy = async (content) => {
        if (!content) return
        try {
            await navigator.clipboard.writeText(content)
        } catch (e) {
            // silently ignore
        }
    }

    const parts = watch('parts')

    return (
        <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ marginBottom: 16 }}>Admin: Dynamic Test Builder {isEditing && <span style={{ fontSize: 14, color: '#666' }}>(editing)</span>}</h2>

            <form onSubmit={handleSubmit(onSubmit)}>
                <div style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                    <h3 style={{ marginTop: 0, marginBottom: 12 }}>Test Meta</h3>
                    <div style={{ display: 'flex', gap: 1, justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600 }}>Test Title</label>
                            <input placeholder="TEST — Title" {...register('testMeta.title')} style={{ width: '100%', padding: 8 }} />
                            {errors.testMeta?.title && <span style={{ color: 'crimson' }}>{errors.testMeta?.title?.message}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600 }}>Test Number</label>
                            <input type="number" placeholder="1" {...register('testMeta.number')} style={{ width: '100%', padding: 8 }} />
                            {errors.testMeta?.number && <span style={{ color: 'crimson' }}>{errors.testMeta?.number?.message}</span>}
                        </div>
                        <div>
                            <label style={{ display: 'block', fontWeight: 600 }}>Test Type</label>
                            <select {...register('testMeta.type')} style={{ width: '100%', padding: 8 }}>
                                <option value="non-audio">Non-audio</option>
                                <option value="audio">Audio</option>
                            </select>
                            {errors.testMeta?.type && <span style={{ color: 'crimson' }}>{errors.testMeta?.type?.message}</span>}
                        </div>
                    </div>
                </div>
                {errors.parts?.message && (
                    <div style={{ color: 'crimson', marginBottom: 12 }}>{errors.parts.message}</div>
                )}

                {isLoadingExisting ? <LoaderOverlay text="Loading test…" /> : partFields.map((part, partIndex) => (
                    <div key={part.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 16, marginBottom: 20 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0 }}>Part {partIndex + 1}</h3>
                            <button type="button" onClick={() => removePart(partIndex)} style={{ background: '#ffe6e6', border: '1px solid #ffcccc', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove Part</button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginTop: 12 }}>
                            <div>
                                <label style={{ display: 'block', fontWeight: 600 }}>Title</label>
                                <input placeholder="PASSAGE 1" {...register(`parts.${partIndex}.title`)} style={{ width: '100%', padding: 8 }} />
                                {errors.parts?.[partIndex]?.title && (
                                    <span style={{ color: 'crimson' }}>{errors.parts?.[partIndex]?.title?.message}</span>
                                )}
                            </div>

                            <div>
                                <label style={{ display: 'block', fontWeight: 600 }}>Passage</label>
                                <textarea placeholder="Paste or write the passage text here" rows={8} {...register(`parts.${partIndex}.passage`)} style={{ width: '100%', padding: 8 }} />
                                {errors.parts?.[partIndex]?.passage && (
                                    <span style={{ color: 'crimson' }}>{errors.parts?.[partIndex]?.passage?.message}</span>
                                )}
                            </div>

                            {watch('testMeta.type') === 'audio' && (
                                <>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600 }}>Audio Src (optional)</label>
                                        <input placeholder="/audio/test-1.m4a" {...register(`parts.${partIndex}.audioSrc`)} style={{ width: '100%', padding: 8 }} />
                                        <small>Tip: Use the upload below to set this automatically to /audio/&lt;filename&gt; and then place the file in public/audio/.</small>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600 }}>Upload Audio (optional)</label>
                                        <input type="file" accept="audio/*" onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (!file) return
                                            const url = URL.createObjectURL(file)
                                            setAudioPreviews((prev) => ({ ...prev, [partIndex]: url }))
                                            setValue(`parts.${partIndex}.audioSrc`, `/audio/${file.name}`)
                                        }} />
                                        {audioPreviews[partIndex] && (
                                            <audio controls style={{ marginTop: 8, width: '100%' }} src={audioPreviews[partIndex]} />
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        <QuestionsSection
                            control={control}
                            register={register}
                            partIndex={partIndex}
                            errors={errors}
                        />
                    </div>
                ))}

                <button type="button" onClick={() => appendPart({ title: '', passage: '', audioSrc: '', questions: [] })} style={{ background: '#f0f7ff', border: '1px solid #cfe3ff', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>+ Add Part</button>
                <button type="submit" disabled={isSaving} style={{ background: '#e8ffe8', border: '1px solid #c1f0c1', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginRight: 8 }}>{isSaving ? 'Saving…' : 'Save Test'}</button>
                <button type="button" onClick={() => { reset(defaultValues); setGeneratedQuestionsJson(''); setGeneratedAnswersJson('') }} style={{ background: '#fff8e6', border: '1px solid #ffe8b3', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>Reset</button>
            </form>

        </div>
    )
}

const QuestionsSection = ({ control, register, partIndex, errors }) => {
    const { fields, append, remove } = useFieldArray({
        control,
        name: `parts.${partIndex}.questions`
    })

    return (
        <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0 }}>Questions</h4>
            </div>

            {errors.parts?.[partIndex]?.questions?.message && (
                <div style={{ color: 'crimson', marginTop: 8 }}>{errors.parts?.[partIndex]?.questions?.message}</div>
            )}

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {fields.map((q, qIndex) => (
                    <QuestionCard
                        key={q.id}
                        control={control}
                        register={register}
                        partIndex={partIndex}
                        qIndex={qIndex}
                        errors={errors}
                        remove={remove}
                    />
                ))}
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-start' }}>
                <button
                    type="button"
                    onClick={() => {
                        append({ type: 'mcq', question: '', options: ['TRUE', 'FALSE', 'NOT GIVEN'] })
                    }}
                    style={{ background: '#f0fff9', border: '1px solid #c7f7e3', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}
                >
                    + Add Question
                </button>
            </div>
        </div>
    )
}

const QuestionCard = ({ control, register, partIndex, qIndex, errors, remove }) => {
    const fieldName = `parts.${partIndex}.questions.${qIndex}`
    const questionTypeError = errors.parts?.[partIndex]?.questions?.[qIndex]?.type?.message
    const questionTextError = errors.parts?.[partIndex]?.questions?.[qIndex]?.question?.message
    const optionsError = errors.parts?.[partIndex]?.questions?.[qIndex]?.options?.message

    return (
        <div style={{ border: '1px dashed #e2e8f0', borderRadius: 8, padding: 12 }}>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontWeight: 600 }}>Type</label>
                    <Controller
                        control={control}
                        name={`${fieldName}.type`}
                        render={({ field }) => (
                            <select {...field} style={{ width: '100%', padding: 8 }}>
                                {QUESTION_TYPES.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        )}
                    />
                    {questionTypeError && <span style={{ color: 'crimson' }}>{questionTypeError}</span>}
                </div>

                <div style={{ width: 120, alignSelf: 'flex-end', textAlign: 'right' }}>
                    <button type="button" onClick={() => remove(qIndex)} style={{ background: '#ffecec', border: '1px solid #ffd4d4', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                </div>
            </div>

            <div style={{ marginTop: 12 }}>
                <label style={{ display: 'block', fontWeight: 600 }}>Question Text</label>
                <input placeholder="Enter question/instruction text" {...register(`${fieldName}.question`)} style={{ width: '100%', padding: 8 }} />
                {questionTextError && <span style={{ color: 'crimson' }}>{questionTextError}</span>}
            </div>

            <OptionsSection control={control} register={register} partIndex={partIndex} qIndex={qIndex} errors={errors} />

            <AnswerSection control={control} register={register} partIndex={partIndex} qIndex={qIndex} errors={errors} />
        </div>
    )
}

const OptionsSection = ({ control, register, partIndex, qIndex, errors }) => {
    const namePrefix = `parts.${partIndex}.questions.${qIndex}`

    // Read the type via a hidden Controller to drive conditional UI without extra re-renders
    return (
        <Controller
            control={control}
            name={`${namePrefix}.type`}
            render={({ field }) => {
                const type = field.value
                if (!(type === 'mcq' || type === 'dropdown')) return null

                return (
                    <OptionsEditor
                        control={control}
                        register={register}
                        namePrefix={namePrefix}
                        errors={errors}
                    />
                )
            }}
        />
    )
}

const OptionsEditor = ({ control, register, namePrefix, errors }) => {
    const { fields, append, remove } = useFieldArray({ control, name: `${namePrefix}.options` })
    const optionsError = errors?.parts && getNestedError(errors, `${namePrefix}.options`)

    return (
        <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontWeight: 600 }}>Options</label>
            {typeof optionsError === 'string' && (
                <div style={{ color: 'crimson', marginBottom: 8 }}>{optionsError}</div>
            )}
            <div style={{ display: 'grid', gap: 8 }}>
                {fields.map((opt, idx) => (
                    <div key={opt.id} style={{ display: 'flex', gap: 8 }}>
                        <input placeholder={`Option ${idx + 1}`} {...register(`${namePrefix}.options.${idx}`)} style={{ flex: 1, padding: 8 }} />
                        <button type="button" onClick={() => remove(idx)} style={{ background: '#fff2f2', border: '1px solid #ffdcdc', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                    </div>
                ))}
            </div>
            <button type="button" onClick={() => append('')} style={{ marginTop: 8, background: '#eefaff', border: '1px solid #d7f0ff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>+ Add Option</button>
        </div>
    )
}

const AnswerSection = ({ control, register, partIndex, qIndex, errors }) => {
    const namePrefix = `parts.${partIndex}.questions.${qIndex}`
    const fieldError = getNestedError(errors, `${namePrefix}.answer`)

    return (
        <Controller
            control={control}
            name={`${namePrefix}.type`}
            render={({ field }) => {
                const type = field.value
                if (type === 'info') return null
                if (type === 'matchinggroup') {
                    return <MatchingGroupEditor control={control} register={register} namePrefix={namePrefix} errors={errors} />
                }

                if (type === 'mcq' || type === 'dropdown') {
                    return (
                        <div style={{ marginTop: 12 }}>
                            <label style={{ display: 'block', fontWeight: 600 }}>Correct Answer</label>
                            <Controller
                                control={control}
                                name={`${namePrefix}.options`}
                                render={({ field: optsField }) => {
                                    const options = Array.isArray(optsField.value) ? optsField.value : []
                                    return (
                                        <Controller
                                            control={control}
                                            name={`${namePrefix}.answer`}
                                            render={({ field: ansField }) => (
                                                <select {...ansField} style={{ width: '100%', padding: 8 }}>
                                                    <option value="">Select correct option…</option>
                                                    {options.map((opt, idx) => (
                                                        <option key={`${opt}-${idx}`} value={opt}>{opt}</option>
                                                    ))}
                                                </select>
                                            )}
                                        />
                                    )
                                }}
                            />
                            {typeof fieldError === 'string' && <span style={{ color: 'crimson' }}>{fieldError}</span>}
                        </div>
                    )
                }

                // written
                return (
                    <div style={{ marginTop: 12 }}>
                        <label style={{ display: 'block', fontWeight: 600 }}>Answer</label>
                        <input placeholder="Enter the correct answer" {...register(`${namePrefix}.answer`)} style={{ width: '100%', padding: 8 }} />
                        {typeof fieldError === 'string' && <span style={{ color: 'crimson' }}>{fieldError}</span>}
                    </div>
                )
            }}
        />
    )
}

const MatchingGroupEditor = ({ control, register, namePrefix, errors }) => {
    const { fields: columnFields, append: appendColumn, remove: removeColumn } = useFieldArray({ control, name: `${namePrefix}.columns` })
    const { fields: rowFields, append: appendRow, remove: removeRow } = useFieldArray({ control, name: `${namePrefix}.rows` })
    const { fields: answerFields, append: appendAnswer, remove: removeAnswer } = useFieldArray({ control, name: `${namePrefix}.answers` })

    const columnsError = getNestedError(errors, `${namePrefix}.columns`)
    const rowsError = getNestedError(errors, `${namePrefix}.rows`)
    const answersError = getNestedError(errors, `${namePrefix}.answers`)

    const addRowWithAnswer = () => {
        appendRow('')
        appendAnswer('')
    }
    const removeRowWithAnswer = (idx) => {
        removeRow(idx)
        removeAnswer(idx)
    }

    return (
        <div style={{ marginTop: 12 }}>
            <label style={{ display: 'block', fontWeight: 600 }}>Matching Group</label>

            <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', fontWeight: 600 }}>Display ID (optional)</label>
                <input placeholder="e.g., 19–23" {...register(`${namePrefix}.displayId`)} style={{ width: '100%', padding: 8 }} />
            </div>

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                <div>
                    <label style={{ display: 'block', fontWeight: 600 }}>Columns (Options)</label>
                    {typeof columnsError === 'string' && <div style={{ color: 'crimson', marginBottom: 8 }}>{columnsError}</div>}
                    <div style={{ display: 'grid', gap: 8 }}>
                        {columnFields.map((col, idx) => (
                            <div key={col.id} style={{ display: 'flex', gap: 8 }}>
                                <input placeholder={`Option ${idx + 1}`} {...register(`${namePrefix}.columns.${idx}`)} style={{ flex: 1, padding: 8 }} />
                                <button type="button" onClick={() => removeColumn(idx)} style={{ background: '#fff2f2', border: '1px solid #ffdcdc', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={() => appendColumn('')} style={{ marginTop: 8, background: '#eefaff', border: '1px solid #d7f0ff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>+ Add Column</button>
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 600 }}>Rows (Questions)</label>
                    {typeof rowsError === 'string' && <div style={{ color: 'crimson', marginBottom: 8 }}>{rowsError}</div>}
                    <div style={{ display: 'grid', gap: 8 }}>
                        {rowFields.map((row, idx) => (
                            <div key={row.id} style={{ display: 'flex', gap: 8 }}>
                                <input placeholder={`Row ${idx + 1}`} {...register(`${namePrefix}.rows.${idx}`)} style={{ flex: 1, padding: 8 }} />
                                <button type="button" onClick={() => removeRowWithAnswer(idx)} style={{ background: '#fff2f2', border: '1px solid #ffdcdc', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addRowWithAnswer} style={{ marginTop: 8, background: '#eefaff', border: '1px solid #d7f0ff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>+ Add Row</button>
                </div>

                <div>
                    <label style={{ display: 'block', fontWeight: 600 }}>Answers (match each Row)</label>
                    {typeof answersError === 'string' && <div style={{ color: 'crimson', marginBottom: 8 }}>{answersError}</div>}
                    <div style={{ display: 'grid', gap: 8 }}>
                        {answerFields.map((ans, idx) => (
                            <div key={ans.id} style={{ display: 'flex', gap: 8 }}>
                                <input placeholder={`Answer for Row ${idx + 1}`} {...register(`${namePrefix}.answers.${idx}`)} style={{ flex: 1, padding: 8 }} />
                                <button type="button" onClick={() => removeRowWithAnswer(idx)} style={{ background: '#fff2f2', border: '1px solid #ffdcdc', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>Remove</button>
                            </div>
                        ))}
                    </div>
                    <button type="button" onClick={addRowWithAnswer} style={{ marginTop: 8, background: '#eefaff', border: '1px solid #d7f0ff', padding: '6px 10px', borderRadius: 6, cursor: 'pointer' }}>+ Add Answer</button>
                </div>
            </div>
        </div>
    )
}

function getNestedError(obj, path) {
    const keys = path.split('.')
    let current = obj
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        if (current == null) return undefined
        current = current[key]
    }
    if (typeof current === 'object' && current?.message) return current.message
    return current
}

export default Admin