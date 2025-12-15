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

const GENERAL_TRAINING_COLLECTION = 'generalTraining';

export function subscribeGeneralTraining(callback) {
    const q = query(collection(db, GENERAL_TRAINING_COLLECTION), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map((d) => {
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
        callback(items);
    });
}

export async function getGeneralTraining(id) {
    const snap = await getDoc(doc(db, GENERAL_TRAINING_COLLECTION, id));
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() || {}) };
}

export async function createGeneralTraining({ title, contentHtml, excerpt, coverImageUrl, authorEmail }) {
    const ref = await addDoc(collection(db, GENERAL_TRAINING_COLLECTION), {
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

export async function updateGeneralTraining(id, updates) {
    const safe = { ...updates, updatedAt: serverTimestamp() };
    await updateDoc(doc(db, GENERAL_TRAINING_COLLECTION, id), safe);
}

export async function deleteGeneralTraining(id) {
    await deleteDoc(doc(db, GENERAL_TRAINING_COLLECTION, id));
}



