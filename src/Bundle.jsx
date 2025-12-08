import React, { useEffect, useState } from 'react'
import { db } from './firebaseConfig'
import { collection, getDocs, setDoc, doc, serverTimestamp } from 'firebase/firestore'
import { toast } from 'react-toastify'
import LoaderOverlay from './components/LoaderOverlay.jsx'

const Bundle = () => {
    const [bundles, setBundles] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [isOpen, setIsOpen] = useState(false)

    const [name, setName] = useState('')
    const [price, setPrice] = useState('')
    const [externalId, setExternalId] = useState('')
    // removed metadata field per request
    const [saving, setSaving] = useState(false)

    // Manage tests modal state
    const [isTestsOpen, setIsTestsOpen] = useState(false)
    const [testsLoading, setTestsLoading] = useState(false)
    const [testsError, setTestsError] = useState('')
    const [allTests, setAllTests] = useState([])
    const [selectedTestIds, setSelectedTestIds] = useState(new Set())
    const [activeBundle, setActiveBundle] = useState(null)

    // Edit bundle modal state
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editName, setEditName] = useState('')
    const [editPrice, setEditPrice] = useState('')
    const [editExternalId, setEditExternalId] = useState('')
    const [savingEdit, setSavingEdit] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const col = collection(db, 'bundles')
                const snap = await getDocs(col)
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() }))
                setBundles(items)
            } catch (e) {
                setError('Failed to load bundles')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const resetForm = () => {
        setName('')
        setPrice('')
        setExternalId('')
        // no metadata
    }

    const handleSave = async () => {
        // basic validation
        const n = name.trim()
        if (!n) {
            toast.error('Bundle name is required')
            return
        }
        const p = Number(price)
        if (!Number.isFinite(p) || p < 0) {
            toast.error('Price must be a non-negative number')
            return
        }
        const generatedId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`

        try {
            setSaving(true)
            const payload = {
                id: generatedId,
                name: n,
                price: p,
                externalId: externalId.trim() || null,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }
            await setDoc(doc(db, 'bundles', generatedId), payload)
            toast.success('Bundle added')
            setBundles(prev => [{ ...payload, createdAt: null, updatedAt: null }, ...prev])
            setIsOpen(false)
            resetForm()
        } catch (e) {
            toast.error('Failed to add bundle')
        } finally {
            setSaving(false)
        }
    }

    const openManageTests = async (bundle) => {
        setActiveBundle(bundle)
        setIsTestsOpen(true)
        setTestsLoading(true)
        setTestsError('')
        try {
            const snap = await getDocs(collection(db, 'tests'))
            const tests = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setAllTests(tests)
            const preset = new Set(Array.isArray(bundle.testIds) ? bundle.testIds : [])
            setSelectedTestIds(preset)
        } catch (e) {
            setTestsError('Failed to load tests')
        } finally {
            setTestsLoading(false)
        }
    }

    const toggleTestId = (id) => {
        setSelectedTestIds(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const selectAll = () => {
        setSelectedTestIds(new Set(allTests.map(t => t.id)))
    }

    const clearAll = () => {
        setSelectedTestIds(new Set())
    }

    const saveBundleTests = async () => {
        if (!activeBundle) return
        try {
            await setDoc(doc(db, 'bundles', activeBundle.id), {
                testIds: Array.from(selectedTestIds),
                updatedAt: serverTimestamp()
            }, { merge: true })
            // update local state
            setBundles(prev => prev.map(b => b.id === activeBundle.id ? { ...b, testIds: Array.from(selectedTestIds) } : b))
            toast.success('Bundle tests updated')
            setIsTestsOpen(false)
            setActiveBundle(null)
        } catch (e) {
            toast.error('Failed to update bundle tests')
        }
    }

    return (
        <>
            <div style={{ padding: '16px', maxWidth: 1100, margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h2 style={{ margin: 0 }}>Bundles</h2>
                    <button onClick={() => setIsOpen(true)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid #cfe3ff', background: '#f0f7ff', cursor: 'pointer' }}>+ Add Bundle</button>
                </div>

                {loading && <LoaderOverlay text="Loading bundles…" />}
                {error && <div style={{ color: 'crimson' }}>{error}</div>}
                {!loading && !error && bundles.length === 0 && <div>No bundles found.</div>}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                    {/* Free Bundles */}
                    {bundles.some(b => Number(b.price || 0) === 0) && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, color: '#28a745' }}>Free Bundles</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                                {bundles.filter(b => Number(b.price || 0) === 0).map(b => (
                                    <div key={b.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12 }}>
                                        <div style={{ fontWeight: 700 }}>{b.name}</div>
                                        <div style={{ marginTop: 6 }}>Price: ₹{Number(b.price).toLocaleString()}</div>
                                        {b.externalId ? <div style={{ marginTop: 4, fontSize: 12, color: '#444' }}>Ext ID: {b.externalId}</div> : null}
                                        <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>Tests: {Array.isArray(b.testIds) ? b.testIds.length : 0}</div>
                                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                            <button onClick={() => openManageTests(b)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdcdc', cursor: 'pointer' }}>Manage Tests</button>
                                            <button onClick={() => { setIsEditOpen(true); setActiveBundle(b); setEditName(b.name || ''); setEditPrice(String(b.price ?? '')); setEditExternalId(b.externalId || ''); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdcdc', cursor: 'pointer' }}>Edit</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Premium Bundles */}
                    {bundles.some(b => Number(b.price || 0) > 0) && (
                        <div>
                            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18, color: '#b30000' }}>Premium Bundles</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                                {bundles.filter(b => Number(b.price || 0) > 0).map(b => (
                                    <div key={b.id} style={{ border: '1px solid #e0e0e0', borderRadius: 8, padding: 12 }}>
                                        <div style={{ fontWeight: 700 }}>{b.name}</div>
                                        <div style={{ marginTop: 6 }}>Price: ₹{Number(b.price).toLocaleString()}</div>
                                        {b.externalId ? <div style={{ marginTop: 4, fontSize: 12, color: '#444' }}>Ext ID: {b.externalId}</div> : null}
                                        <div style={{ marginTop: 6, fontSize: 12, color: '#555' }}>Tests: {Array.isArray(b.testIds) ? b.testIds.length : 0}</div>
                                        <div style={{ marginTop: 10, display: 'flex', gap: 8 }}>
                                            <button onClick={() => openManageTests(b)} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdcdc', cursor: 'pointer' }}>Manage Tests</button>
                                            <button onClick={() => { setIsEditOpen(true); setActiveBundle(b); setEditName(b.name || ''); setEditPrice(String(b.price ?? '')); setEditExternalId(b.externalId || ''); }} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #dcdcdc', cursor: 'pointer' }}>Edit</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {isOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                        <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 620, padding: 0, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 12px 24px rgba(0,0,0,0.15)', border: '1px solid #eaeaea' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #eee' }}>
                                <h3 style={{ margin: 0, fontSize: 20 }}>Add Bundle</h3>
                                <button onClick={() => { if (!saving) { setIsOpen(false); resetForm() } }} style={{ border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#555' }} aria-label="Close">×</button>
                            </div>
                            <div style={{ padding: 16, overflowY: 'auto' }}>
                                <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Bundle Name</label>
                                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Premium Bundle" style={{ width: '100%', padding: '10px 12px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Price</label>
                                        <input value={price} onChange={(e) => setPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="999" style={{ width: '100%', padding: '10px 12px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Some ID (optional)</label>
                                        <input value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder="SKU-123" style={{ width: '100%', padding: '10px 12px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', borderTop: '1px solid #eee' }}>
                                <button onClick={() => { if (!saving) { setIsOpen(false); resetForm() } }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={handleSave} disabled={saving} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #8ddf8d', background: '#e6ffe6', cursor: 'pointer', fontWeight: 600 }}>{saving ? 'Saving…' : 'Save Bundle'}</button>
                            </div>
                        </div>
                    </div>
                )}
                {isEditOpen && (
                    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                        <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 620, padding: 0, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 12px 24px rgba(0,0,0,0.15)', border: '1px solid #eaeaea' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #eee' }}>
                                <h3 style={{ margin: 0, fontSize: 20 }}>Edit Bundle</h3>
                                <button onClick={() => { if (!savingEdit) { setIsEditOpen(false); setActiveBundle(null) } }} style={{ border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#555' }} aria-label="Close">×</button>
                            </div>
                            <div style={{ padding: 16, overflowY: 'auto' }}>
                                <div style={{ maxWidth: 520, margin: '0 auto', display: 'grid', gap: 12 }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Bundle Name</label>
                                        <input value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Premium Bundle" style={{ width: '100%', padding: '10px 12px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Price</label>
                                        <input value={editPrice} onChange={(e) => setEditPrice(e.target.value)} type="number" step="0.01" min="0" placeholder="999" style={{ width: '100%', padding: '10px 12px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 600, fontSize: 14, marginBottom: 6 }}>Some ID (optional)</label>
                                        <input value={editExternalId} onChange={(e) => setEditExternalId(e.target.value)} placeholder="SKU-123" style={{ width: '100%', padding: '10px 12px', maxWidth: '100%', border: '1px solid #ddd', borderRadius: 8 }} />
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', borderTop: '1px solid #eee' }}>
                                <button onClick={() => { if (!savingEdit) { setIsEditOpen(false); setActiveBundle(null) } }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>Cancel</button>
                                <button onClick={async () => {
                                    if (!activeBundle) return
                                    const n = editName.trim()
                                    const p = Number(editPrice)
                                    if (!n) { toast.error('Bundle name is required'); return }
                                    if (!Number.isFinite(p) || p < 0) { toast.error('Price must be a non-negative number'); return }
                                    try {
                                        setSavingEdit(true)
                                        await setDoc(doc(db, 'bundles', activeBundle.id), {
                                            name: n,
                                            price: p,
                                            externalId: editExternalId.trim() || null,
                                            updatedAt: serverTimestamp()
                                        }, { merge: true })
                                        setBundles(prev => prev.map(b => b.id === activeBundle.id ? { ...b, name: n, price: p, externalId: editExternalId.trim() || null } : b))
                                        toast.success('Bundle updated')
                                        setIsEditOpen(false)
                                        setActiveBundle(null)
                                    } catch (e) {
                                        toast.error('Failed to update bundle')
                                    } finally {
                                        setSavingEdit(false)
                                    }
                                }} disabled={savingEdit} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #8ddf8d', background: '#e6ffe6', cursor: 'pointer', fontWeight: 600 }}>{savingEdit ? 'Saving…' : 'Save Changes'}</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
            {isTestsOpen && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
                    <div style={{ background: '#fff', borderRadius: 12, width: '100%', maxWidth: 760, padding: 0, maxHeight: '90vh', overflow: 'hidden', boxShadow: '0 12px 24px rgba(0,0,0,0.15)', border: '1px solid #eaeaea' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #eee' }}>
                            <h3 style={{ margin: 0, fontSize: 20 }}>Manage Tests {activeBundle ? `— ${activeBundle.name}` : ''}</h3>
                            <button onClick={() => { setIsTestsOpen(false); setActiveBundle(null) }} style={{ border: 'none', background: 'transparent', fontSize: 22, lineHeight: 1, cursor: 'pointer', color: '#555' }} aria-label="Close">×</button>
                        </div>
                        <div style={{ padding: 16, overflowY: 'auto' }}>
                            {testsLoading && <div style={{ position: 'relative' }}><LoaderOverlay text="Loading tests…" fullscreen={false} /></div>}
                            {testsError && <div style={{ color: 'crimson' }}>{testsError}</div>}
                            {!testsLoading && !testsError && (
                                <>
                                    <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                        <button onClick={selectAll} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>Select All</button>
                                        <button onClick={clearAll} style={{ padding: '6px 10px', borderRadius: 6, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>Clear</button>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
                                        {allTests.map(t => (
                                            <label key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid #eee', padding: 10, borderRadius: 8 }}>
                                                <input type="checkbox" checked={selectedTestIds.has(t.id)} onChange={() => toggleTestId(t.id)} />
                                                <div>
                                                    <div style={{ fontWeight: 600 }}>{t.title || 'Untitled'}</div>
                                                    <div style={{ fontSize: 12, color: '#555' }}>#{t.number || '-'} • {t.type === 'audio' ? 'Audio' : 'Non-audio'}</div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '12px 16px', borderTop: '1px solid #eee' }}>
                            <button onClick={() => { setIsTestsOpen(false); setActiveBundle(null) }} style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>Cancel</button>
                            <button onClick={saveBundleTests} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid #8ddf8d', background: '#e6ffe6', cursor: 'pointer', fontWeight: 600 }}>Add to Bundle</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default Bundle