import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeGeneralTraining } from './services/generalTrainingService';

const formatDate = (ts) => {
    try {
        if (!ts) return '';
        if (typeof ts.toDate === 'function') return ts.toDate().toLocaleDateString();
        return new Date(ts).toLocaleDateString();
    } catch {
        return '';
    }
};

function stripHtml(html) {
    if (!html) return '';
    const el = document.createElement('div');
    el.innerHTML = html;
    return (el.textContent || el.innerText || '').trim();
}

const GeneralTraining = () => {
    const [items, setItems] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = subscribeGeneralTraining(setItems);
        return () => {
            if (typeof unsub === 'function') unsub();
        };
    }, []);

    const cards = useMemo(() => {
        return items.map((item) => {
            const baseExcerpt =
                item.excerpt && item.excerpt.trim().length > 0
                    ? item.excerpt
                    : stripHtml(item.contentHtml).slice(0, 160);
            const excerpt = baseExcerpt + (baseExcerpt.length >= 160 ? '…' : '');
            return { ...item, excerpt };
        });
    }, [items]);

    return (
        <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ marginTop: 8, marginBottom: 16 }}>General Training</h2>
            {cards.length === 0 ? (
                <div style={{ color: '#666' }}>No general training content yet.</div>
            ) : (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                        gap: 16,
                    }}
                >
                    {cards.map((item) => (
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
                                <h3 style={{ margin: 0, fontSize: 18 }}>{item.title}</h3>
                                <div style={{ fontSize: 12, color: '#777' }}>{formatDate(item.createdAt)}</div>
                                <p style={{ margin: 0, color: '#444' }}>{item.excerpt}</p>
                                <div>
                                    <button
                                        onClick={() => navigate(`/general-training/${item.id}`)}
                                        style={{
                                            marginTop: 8,
                                            background: '#f0f7ff',
                                            border: '1px solid #cfe3ff',
                                            padding: '8px 12px',
                                            borderRadius: 6,
                                            cursor: 'pointer',
                                        }}
                                    >
                                        Read more
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GeneralTraining;



