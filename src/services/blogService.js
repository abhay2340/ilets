import { db } from '../firebaseConfig';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc,
} from 'firebase/firestore';

const BLOGS_COLLECTION = 'blogs';

export function subscribeBlogs(callback) {
    const q = query(collection(db, BLOGS_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const blogs = snapshot.docs.map((d) => {
            const data = d.data() || {};
            return {
                id: d.id,
                title: data.title || '',
                excerpt: data.excerpt || '',
                contentHtml: data.contentHtml || '',
                coverImageUrl: data.coverImageUrl || '',
                createdAt: data.createdAt || null,
                updatedAt: data.updatedAt || null,
                authorEmail: data.authorEmail || null,
            };
        });
        callback(blogs);
    });
}

export async function getBlog(blogId) {
    const snap = await getDoc(doc(db, BLOGS_COLLECTION, blogId));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() || {}) };
}

export async function createBlog({ title, contentHtml, excerpt, coverImageUrl, authorEmail }) {
    const ref = await addDoc(collection(db, BLOGS_COLLECTION), {
        title: title || '',
        contentHtml: contentHtml || '',
        excerpt: excerpt || '',
        coverImageUrl: coverImageUrl || '',
        authorEmail: authorEmail || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
    });
    return ref.id;
}

export async function updateBlog(blogId, updates) {
    const safe = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, BLOGS_COLLECTION, blogId), safe);
}

export async function deleteBlog(blogId) {
    await deleteDoc(doc(db, BLOGS_COLLECTION, blogId));
}


