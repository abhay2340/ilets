import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { subscribeBlogs } from './services/blogService';

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

const Blogs = () => {
    const [blogs, setBlogs] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const unsub = subscribeBlogs(setBlogs);
        return () => { if (typeof unsub === 'function') unsub(); };
    }, []);

    const cards = useMemo(() => {
        return blogs.map((b) => {
            const baseExcerpt = b.excerpt && b.excerpt.trim().length > 0 ? b.excerpt : stripHtml(b.contentHtml).slice(0, 160);
            const excerpt = baseExcerpt + (baseExcerpt.length >= 160 ? '…' : '');
            return { ...b, excerpt };
        });
    }, [blogs]);

    return (
        <div style={{ padding: 16, maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ marginTop: 8, marginBottom: 16 }}>Blogs</h2>
            {cards.length === 0 ? (
                <div style={{ color: '#666' }}>No blogs yet.</div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {cards.map((blog) => (
                        <article key={blog.id} style={{ border: '1px solid #eee', borderRadius: 10, overflow: 'hidden', background: '#fff', display: 'flex', flexDirection: 'column' }}>
                            {blog.coverImageUrl ? (
                                <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden' }}>
                                    <img src={blog.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                </div>
                            ) : null}
                            <div style={{ padding: 12, display: 'grid', gap: 8 }}>
                                <h3 style={{ margin: 0, fontSize: 18 }}>{blog.title}</h3>
                                <div style={{ fontSize: 12, color: '#777' }}>{formatDate(blog.createdAt)}</div>
                                <p style={{ margin: 0, color: '#444' }}>{blog.excerpt}</p>
                                <div>
                                    <button
                                        onClick={() => navigate(`/blogs/${blog.id}`)}
                                        style={{ marginTop: 8, background: '#f0f7ff', border: '1px solid #cfe3ff', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}
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

export default Blogs;


