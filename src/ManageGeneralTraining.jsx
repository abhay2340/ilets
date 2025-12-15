import React, { useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import {
    createGeneralTraining,
    deleteGeneralTraining,
    subscribeGeneralTraining,
    updateGeneralTraining,
} from './services/generalTrainingService';

const ToolbarButton = ({ label, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        style={{ padding: '6px 10px', border: '1px solid #ddd', background: '#fff', borderRadius: 6, cursor: 'pointer' }}
    >
        {label}
    </button>
);

const ManageGeneralTraining = () => {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [title, setTitle] = useState('');
    const [excerpt, setExcerpt] = useState('');
    const [coverImageUrl, setCoverImageUrl] = useState('');
    const editorRef = useRef(null);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        const unsub = subscribeGeneralTraining(setItems);
        return () => {
            if (typeof unsub === 'function') unsub();
        };
    }, []);

    const exec = (cmd, value = null) => {
        try {
            document.execCommand(cmd, false, value);
        } catch {
            // ignore
        }
    };

    const handleSave = async () => {
        const contentHtml = editorRef.current?.innerHTML || '';
        if (!title.trim()) {
            alert('Title is required');
            return;
        }
        if (!contentHtml || contentHtml.replace(/<[^>]*>/g, '').trim().length === 0) {
            alert('Content is required');
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await updateGeneralTraining(editingId, { title, contentHtml, excerpt, coverImageUrl });
            } else {
                await createGeneralTraining({
                    title,
                    contentHtml,
                    excerpt,
                    coverImageUrl,
                    authorEmail: user?.email || null,
                });
            }
            resetForm();
        } catch {
            alert('Failed to save general training item');
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setEditingId(null);
        setTitle('');
        setExcerpt('');
        setCoverImageUrl('');
        if (editorRef.current) editorRef.current.innerHTML = '';
    };

    const startEdit = (item) => {
        setEditingId(item.id);
        setTitle(item.title || '');
        setExcerpt(item.excerpt || '');
        setCoverImageUrl(item.coverImageUrl || '');
        if (editorRef.current) editorRef.current.innerHTML = item.contentHtml || '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id) => {
        const ok = confirm('Delete this item? This action cannot be undone.');
        if (!ok) return;
        try {
            await deleteGeneralTraining(id);
            if (editingId === id) resetForm();
        } catch {
            alert('Failed to delete item');
        }
    };

    return (
        <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ border: '1px solid #eee', borderRadius: 10, padding: 16 }}>
                <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit General Training Article' : 'Add General Training Article'}</h3>

                <div style={{ display: 'grid', gap: 12 }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600 }}>Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Title"
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600 }}>Excerpt (optional)</label>
                        <textarea
                            value={excerpt}
                            onChange={(e) => setExcerpt(e.target.value)}
                            placeholder="Short summary shown on cards"
                            rows={3}
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: 600 }}>Cover Image URL (optional)</label>
                        <input
                            value={coverImageUrl}
                            onChange={(e) => setCoverImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            style={{ width: '100%', padding: 8 }}
                        />
                    </div>
                    {coverImageUrl ? (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: 480,
                                aspectRatio: '16/9',
                                overflow: 'hidden',
                                borderRadius: 10,
                                border: '1px solid #eee',
                            }}
                        >
                            <img
                                src={coverImageUrl}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                        </div>
                    ) : null}

                    <div>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: 8 }}>Content</label>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                            <ToolbarButton label="B" onClick={() => exec('bold')} />
                            <ToolbarButton label="I" onClick={() => exec('italic')} />
                            <ToolbarButton label="U" onClick={() => exec('underline')} />
                            <ToolbarButton label="H2" onClick={() => exec('formatBlock', '<h2>')} />
                            <ToolbarButton label="H3" onClick={() => exec('formatBlock', '<h3>')} />
                            <ToolbarButton label="UL" onClick={() => exec('insertUnorderedList')} />
                            <ToolbarButton label="OL" onClick={() => exec('insertOrderedList')} />
                            <ToolbarButton
                                label="Link"
                                onClick={() => {
                                    const url = prompt('Enter URL');
                                    if (url) exec('createLink', url);
                                }}
                            />
                            <ToolbarButton
                                label="Clear"
                                onClick={() => {
                                    if (editorRef.current) editorRef.current.innerHTML = '';
                                }}
                            />
                        </div>
                        <div
                            ref={editorRef}
                            contentEditable
                            suppressContentEditableWarning
                            style={{
                                minHeight: 200,
                                border: '1px solid #ddd',
                                borderRadius: 8,
                                padding: 12,
                                background: '#fff',
                            }}
                            placeholder="Write content here…"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                background: '#e8ffe8',
                                border: '1px solid #c1f0c1',
                                padding: '8px 12px',
                                borderRadius: 6,
                                cursor: 'pointer',
                            }}
                        >
                            {saving ? 'Saving…' : editingId ? 'Update Article' : 'Publish Article'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
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
                    </div>
                </div>
            </div>

            <div>
                <h3 style={{ marginTop: 0 }}>All General Training Articles</h3>
                {items.length === 0 ? (
                    <div style={{ color: '#666' }}>No general training content yet.</div>
                ) : (
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                            gap: 16,
                        }}
                    >
                        {items.map((item) => (
                            <article
                                key={item.id}
                                style={{
                                    border: '1px solid #eee',
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    background: '#fff',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                            >
                                {item.coverImageUrl ? (
                                    <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                                        <img
                                            src={item.coverImageUrl}
                                            alt=""
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                display: 'block',
                                            }}
                                        />
                                    </div>
                                ) : null}
                                <div style={{ padding: 12, display: 'grid', gap: 8 }}>
                                    <h4 style={{ margin: 0 }}>{item.title}</h4>
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <button
                                            onClick={() => startEdit(item)}
                                            style={{
                                                background: '#f0f7ff',
                                                border: '1px solid #cfe3ff',
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            style={{
                                                background: '#ffecec',
                                                border: '1px solid #ffd4d4',
                                                padding: '6px 10px',
                                                borderRadius: 6,
                                                cursor: 'pointer',
                                            }}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageGeneralTraining;



