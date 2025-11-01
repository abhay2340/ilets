import React, { useEffect, useState } from 'react'
import { db } from './firebaseConfig'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'

const Tests = () => {
    const [tests, setTests] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

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
        <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>

            <h2 style={{ marginBottom: 16 }}>Tests</h2>
            {loading && <div>Loading…</div>}
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
                            <button onClick={() => navigate(`/admin/${test.id}`)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdcdc', cursor: 'pointer' }}>Edit</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Tests