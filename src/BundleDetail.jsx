import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebaseConfig'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import LoaderOverlay from './components/LoaderOverlay.jsx'

const BundleDetail = () => {
    const { bundleId } = useParams()
    const navigate = useNavigate()
    const [bundle, setBundle] = React.useState(null)
    const [tests, setTests] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')

    React.useEffect(() => {
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'bundles', bundleId))
                if (!snap.exists()) {
                    setError('Bundle not found')
                    setLoading(false)
                    return
                }
                const b = { id: snap.id, ...snap.data() }
                setBundle(b)
                // Load tests listed in bundle.testIds
                let items = []
                if (Array.isArray(b.testIds) && b.testIds.length > 0) {
                    // Fallback simple approach: fetch all tests and filter (works without composite indices)
                    const all = await getDocs(collection(db, 'tests'))
                    const allItems = all.docs.map(d => ({ id: d.id, ...d.data() }))
                    items = allItems.filter(t => b.testIds.includes(t.id))
                }
                setTests(items)
            } catch (e) {
                setError('Failed to load bundle')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [bundleId])

    return (
        <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>← Back</button>
            {loading && <LoaderOverlay text="Loading bundle…" />}
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
            {bundle && (
                <div style={{ marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>{bundle.name || 'Bundle'}</h2>
                    <div style={{ marginTop: 6 }}>Price: ₹{Number(bundle.price || 0).toLocaleString()}</div>
                    <div style={{ marginTop: 6, fontSize: 13, color: '#555' }}>{Array.isArray(bundle.testIds) ? `${bundle.testIds.length} tests` : '0 tests'}</div>
                </div>
            )}

            {!loading && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {tests.map(t => (
                        <div key={t.id} style={{ border: '1px solid #eaeaea', borderRadius: 10, padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h3 style={{ margin: 0, fontSize: 18 }}>{t.title || 'Untitled Test'}</h3>
                                <div style={{ fontSize: 12, color: '#555' }}>#{t.number || '-'}</div>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13, padding: '2px 8px', display: 'inline-block', borderRadius: 999, background: t.type === 'audio' ? '#e8f5ff' : '#e9ffe9', border: `1px solid ${t.type === 'audio' ? '#cfe8ff' : '#c8f2c8'}` }}>
                                {t.type === 'audio' ? 'Audio' : 'Non-audio'}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                <button
                                    onClick={() => navigate(`/test?dbId=${t.id}`)}
                                    style={{
                                        background: 'linear-gradient(135deg, #b30000, #ff0002)',
                                        color: '#fff',
                                        border: 'none',
                                        padding: '8px 12px',
                                        borderRadius: 12,
                                        fontSize: 13,
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                    }}
                                >
                                    Start test
                                </button>
                            </div>
                        </div>
                    ))}
                    {tests.length === 0 && <div>No tests in this bundle.</div>}
                </div>
            )}
        </div>
    )
}

export default BundleDetail


