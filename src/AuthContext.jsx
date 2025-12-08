import { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null); // 'ADMIN' | 'USER' | null
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let roleUnsub = null;
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setRole(null);
      if (currentUser) {
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            // Seed default role USER for legacy users
            await setDoc(userRef, {
              email: currentUser.email || null,
              role: 'USER',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp()
            });
            setRole('USER');
          } else {
            // live subscribe to role changes
            await new Promise((resolve) => {
              roleUnsub = onSnapshot(userRef, (docSnap) => {
                const data = docSnap.data() || {};
                const r = (data.role === 'ADMIN' || data.role === 'USER') ? data.role : 'USER';
                // If legacy doc missing role, backfill to USER
                if (!data.role) {
                  setDoc(userRef, { role: 'USER', updatedAt: serverTimestamp() }, { merge: true });
                }
                setRole(r);
                resolve();
              });
            });
          }
        } catch (e) {
          setRole('USER');
        }
      }
      setLoading(false);
    });
    return () => { if (roleUnsub) roleUnsub(); unsub(); };
  }, []);

  // Persist a lightweight session for quick client-side checks
  useEffect(() => {
    try {
      if (user) {
        const payload = { uid: user.uid, email: user.email || null, role };
        localStorage.setItem('sessionUser', JSON.stringify(payload));
      } else {
        localStorage.removeItem('sessionUser');
      }
    } catch { }
  }, [user, role]);

  return (
    <AuthContext.Provider value={{ user, role, loading, isAdmin: role === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
