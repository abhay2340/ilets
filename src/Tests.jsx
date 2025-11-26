import React, { useEffect, useState } from 'react'
import { db } from './firebaseConfig'
import { useNavigate } from 'react-router-dom'
import { collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import LoaderOverlay from './components/LoaderOverlay.jsx'

const Tests = () => {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [confirmDelete, setConfirmDelete] = useState(null) // { id, title } | null
    const [deletingId, setDeletingId] = useState(null)

    const navigate = useNavigate()

    useEffect(() => {
        const load = async () => {
            try {
                const col = collection(db, 'tests')
                const snap = await getDocs(col)
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                setTests(items)
            } catch (e) {
                setError('Failed to load tests')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return (
        <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto', position: 'relative' }}>

            <h2 style={{ marginBottom: 16 }}>Tests</h2>
            {loading && <LoaderOverlay text="Loading tests…" />}
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
            {!loading && !error && tests.length === 0 && (
                <div>No tests found.</div>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {tests.map(test => (
                    <div key={test.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12 }}>
                        <div style={{ fontSize: 14, color: '#666', marginBottom: 4 }}>#{test.number || '-'}</div>
                        <div style={{ fontWeight: 700, marginBottom: 6 }}>{test.title || 'Untitled Test'}</div>
                        <div style={{ fontSize: 13, padding: '2px 8px', display: 'inline-block', borderRadius: 999, background: test.type === 'audio' ? '#e8f5ff' : '#e9ffe9', border: `1px solid ${test.type === 'audio' ? '#cfe8ff' : '#c8f2c8'}` }}>
                            {test.type === 'audio' ? 'Audio' : 'Non-audio'}
                        </div>
                        <div style={{ marginTop: 10 }}>
                            <button onClick={() => navigate(`/admin/${test.id}`)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdcdc', cursor: 'pointer', marginRight: 8 }}>Edit</button>
                            <button
                                onClick={() => setConfirmDelete({ id: test.id, title: test.title || `#${test.number || ''}` })}
                                style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ffd4d4', cursor: 'pointer', background: '#ffecec', color: '#7a0000', fontWeight: 600 }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {Boolean(confirmDelete) && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        background: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10000,
                        padding: 20
                    }}
                    onContextMenu={(e) => e.preventDefault()}
                >
                    <div style={{ background: '#fff', padding: '20px 24px', borderRadius: 10, width: 400, maxWidth: '90vw', boxShadow: '0 12px 28px rgba(0,0,0,0.25)' }}>
                        <h3 style={{ marginTop: 0, marginBottom: 8 }}>Delete Test?</h3>
                        <p style={{ marginTop: 0, marginBottom: 18 }}>
                            This will permanently delete “{confirmDelete?.title}”. The associated answer key will also be removed. This action cannot be undone.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                           <button
                                onClick={() => setConfirmDelete(null)}
                                style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #bbb', background: '#f4f4f4', cursor: 'pointer', fontWeight: 700 }}
                                disabled={Boolean(deletingId)}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    if (!confirmDelete?.id) return;
                                    const id = confirmDelete.id;
                                    try {
                                        setDeletingId(id);
                                        // delete test doc
                                        await deleteDoc(doc(db, 'tests', id));
                                        // delete answers doc (if exists)
                                        try { await deleteDoc(doc(db, 'answers', id)); } catch (_) { }
                                        setTests(prev => prev.filter(t => t.id !== id));
                                        setConfirmDelete(null);
                                    } catch (_) {
                                        alert('Failed to delete test. Please try again.');
                                    } finally {
                                        setDeletingId(null);
                                    }
                                }}
                                style={{ padding: '8px 12px', borderRadius: 6, border: 'none', background: '#b30000', color: '#fff', cursor: 'pointer', fontWeight: 800 }}
                                disabled={Boolean(deletingId)}
                            >
                                {deletingId ? 'Deleting…' : 'Yes, Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Tests