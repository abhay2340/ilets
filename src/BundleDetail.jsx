import React from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebaseConfig'
import { doc, getDoc, getDocs, collection } from 'firebase/firestore'
import LoaderOverlay from './components/LoaderOverlay.jsx'
import ConfirmationModal from './components/ConfirmationModal.jsx'

import { usePurchases } from './hooks/usePurchases'
import { useAuth } from './AuthContext'

const BundleDetail = () => {
    const { bundleId } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const { hasAccess } = usePurchases()

    const [bundle, setBundle] = React.useState(null)
    const [tests, setTests] = React.useState([])
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState('')
    const [hasBundleAccess, setHasBundleAccess] = React.useState(false)
    const [showLoginModal, setShowLoginModal] = React.useState(false)
    const [showStartTestModal, setShowStartTestModal] = React.useState(false)
    const [pendingTestId, setPendingTestId] = React.useState(null)

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

                // Check access
                if (user) {
                    // If price is 0, it's free. If > 0, check purchase.
                    // IMPORTANT: We treat bundleId as the purchasable item ID.
                    const access = Number(b.price || 0) === 0 ? true : await hasAccess(b.id);
                    setHasBundleAccess(!!access);
                } else {
                    // Not logged in, if free -> ok, else -> false
                    setHasBundleAccess(Number(b.price || 0) === 0);
                }

                // Load tests listed in bundle.testIds
                let items = []
                if (Array.isArray(b.testIds) && b.testIds.length > 0) {
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
    }, [bundleId, user, hasAccess])

    return (
        <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: 12, padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>← Back</button>
            {loading && <LoaderOverlay text="Loading bundle…" />}
            {error && <div style={{ color: 'crimson' }}>{error}</div>}
            {bundle && (
                <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ margin: 0 }}>{bundle.name || 'Bundle'}</h2>
                            <div style={{ marginTop: 6, fontSize: '1.2em', fontWeight: 'bold', color: '#b30000' }}>
                                {Number(bundle.price || 0) > 0 ? `₹${Number(bundle.price).toLocaleString()}` : 'FREE'}
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13, color: '#555' }}>
                                {Array.isArray(bundle.testIds) ? `${bundle.testIds.length} tests` : '0 tests'}
                            </div>
                        </div>

                        {!loading && !hasBundleAccess && Number(bundle.price || 0) > 0 && (
                            <button
                                onClick={() => {
                                    if (!user) {
                                        setShowLoginModal(true);
                                    } else {
                                        navigate(`/payment?bundleId=${bundle.id}`);
                                    }
                                }}
                                style={{
                                    backgroundColor: '#b30000',
                                    color: 'white',
                                    border: 'none',
                                    padding: '12px 24px',
                                    borderRadius: '8px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer',
                                    fontSize: '16px'
                                }}
                            >
                                Buy Subscription
                            </button>
                        )}
                    </div>
                </div>
            )}

            {!loading && !error && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {tests.map(t => (
                        <div key={t.id} style={{ border: '1px solid #eaeaea', borderRadius: 10, padding: 16, background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', opacity: hasBundleAccess ? 1 : 0.6, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                                <h3 style={{ margin: 0, fontSize: 18 }}>{t.title || 'Untitled Test'}</h3>
                                <div style={{ fontSize: 12, color: '#555' }}>#{t.number || '-'}</div>
                            </div>
                            <div style={{ marginTop: 6, fontSize: 13, padding: '2px 8px', display: 'inline-block', borderRadius: 999, background: t.type === 'audio' ? '#e8f5ff' : '#e9ffe9', border: `1px solid ${t.type === 'audio' ? '#cfe8ff' : '#c8f2c8'}` }}>
                                {t.type === 'audio' ? 'Audio' : 'Non-audio'}
                            </div>
                            <div style={{ marginTop: 12 }}>
                                {(!user || hasBundleAccess) ? (
                                    <button
                                        onClick={() => {
                                            if (!user) {
                                                setPendingTestId(t.id);
                                                setShowStartTestModal(true);
                                            } else {
                                                navigate(`/security?dbId=${t.id}`);
                                            }
                                        }}
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
                                ) : (
                                    <div style={{ fontSize: 13, fontWeight: 'bold', color: '#666', marginTop: 6 }}>
                                        <span style={{ marginRight: 6 }}>🔒</span>
                                        {Number(bundle.price || 0) > 0 ? "Locked" : "Login to Access"}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {tests.length === 0 && <div>No tests in this bundle.</div>}
                </div>
            )}

            <ConfirmationModal
                isOpen={showLoginModal}
                onClose={() => setShowLoginModal(false)}
                onConfirm={() => {
                    setShowLoginModal(false);
                    navigate('/login', { state: { from: { pathname: '/payment', search: `?bundleId=${bundle?.id}` } } });
                }}
                title="Login Required"
                message="You need to login to buy a test. Would you like to go to the login page?"
                confirmText="Go to Login"
                cancelText="Cancel"
            />

            <ConfirmationModal
                isOpen={showStartTestModal}
                onClose={() => {
                    setShowStartTestModal(false);
                    setPendingTestId(null);
                }}
                onConfirm={() => {
                    setShowStartTestModal(false);
                    const testId = pendingTestId;
                    setPendingTestId(null);
                    navigate('/login', { state: { from: { pathname: '/security', search: `?dbId=${testId}` } } });
                }}
                title="Login Required"
                message="You need to login to start a test. Would you like to go to the login page?"
                confirmText="Go to Login"
                cancelText="Cancel"
            />
        </div>
    )
}

export default BundleDetail


