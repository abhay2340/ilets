import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getBlog } from './services/blogService';

const formatDate = (ts) => {
    try {
        if (!ts) return '';
        if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString();
        return new Date(ts).toLocaleString();
    } catch {
        return '';
    }
};

const BlogDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [blog, setBlog] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const run = async () => {
            setLoading(true);
            const b = await getBlog(id);
            setBlog(b);
            setLoading(false);
        };
        run();
    }, [id]);

    if (loading) {
        return (
            <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
                <div>Loading blog…</div>
            </div>
        );
    }

    if (!blog) {
        return (
            <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
                <div style={{ marginBottom: 16 }}>Blog not found.</div>
                <button onClick={() => navigate('/blogs')} style={{ background: '#f0f7ff', border: '1px solid #cfe3ff', padding: '8px 12px', borderRadius: 6, cursor: 'pointer' }}>
                    Back to Blogs
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, maxWidth: 900, margin: '0 auto' }}>
            <button onClick={() => navigate('/blogs')} style={{ background: '#f0f7ff', border: '1px solid #cfe3ff', padding: '8px 12px', borderRadius: 6, cursor: 'pointer', marginBottom: 12 }}>
                ← Back
            </button>
            <h1 style={{ marginTop: 0 }}>{blog.title}</h1>
            <div style={{ color: '#777', fontSize: 13, marginBottom: 16 }}>
                {formatDate(blog.createdAt)}{blog.authorEmail ? ` • ${blog.authorEmail}` : ''}
            </div>
            {blog.coverImageUrl ? (
                <div style={{ width: '100%', aspectRatio: '16/9', overflow: 'hidden', borderRadius: 10, marginBottom: 16 }}>
                    <img src={blog.coverImageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            ) : null}
            <div
                style={{ lineHeight: 1.6 }}
                dangerouslySetInnerHTML={{ __html: blog.contentHtml || '' }}
            />
        </div>
    );
};

export default BlogDetail;


