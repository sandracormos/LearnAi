import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User
} from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured ? initializeApp(firebaseConfig) : null;
export const auth = firebaseApp ? getAuth(firebaseApp) : null;
export const db = firebaseApp ? getFirestore(firebaseApp) : null;

export type AvatarConfig = {
  base: string;
  face: string;
  eyes: string;
  mouth: string;
  nose: string;
  hair: string;
  accessory: string;
  background: string;
  outfit: string;
  item: string;
};

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string;
  avatar: AvatarConfig;
  level: number;
  score: number;
  bestPlatformScore: number;
  gamesPlayed: number;
  totalAnsweredQuestions: number;
  totalCorrectAnswers: number;
  bestCorrectAnswers: number;
  bestAccuracy: number;
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt?: Date;
  openAiPreviousResponseId?: string;
};

export type LeaderboardEntry = {
  uid: string;
  displayName: string;
  platformScore: number;
  level: number;
  score: number;
};

export type CompletedSession = {
  categories: string;
  difficulty: string;
  totalQuestions: number;
  answeredQuestions: number;
  correctAnswers: number;
  level: number;
  score: number;
  platformScore: number;
};

export type SessionSummary = CompletedSession & {
  id: string;
  completedAt?: Date;
};

export type CustomTestQuestion = {
  prompt: string;
  answers: string[];
  correctAnswer: number;
};

export type CustomTestDraft = {
  id: string;
  title: string;
  description: string;
  category: string;
  visibility: string;
  status: 'draft' | 'published';
  questions: CustomTestQuestion[];
  updatedAt?: Date;
  publishedAt?: Date;
};

export type PublishedTest = CustomTestDraft & {
  authorId: string;
  authorName: string;
};

function requireFirebase() {
  if (!auth || !db) {
    throw new Error('Firebase is not configured. Fill TrivAi.Client/.env with your Firebase web app settings.');
  }

  return { auth, db };
}

function fallbackName(user: User) {
  return user.displayName || user.email?.split('@')[0] || 'Player';
}

export const defaultAvatar: AvatarConfig = {
  base: 'gold',
  face: 'bright',
  eyes: 'bright',
  mouth: 'smile',
  nose: 'soft',
  hair: 'short',
  accessory: 'none',
  background: 'mint',
  outfit: 'hoodie',
  item: 'none'
};

function readAvatarConfig(value: unknown): AvatarConfig {
  if (!value || typeof value !== 'object') {
    return defaultAvatar;
  }

  const avatar = value as Partial<Record<keyof AvatarConfig, unknown>>;

  return {
    base: typeof avatar.base === 'string' ? avatar.base : defaultAvatar.base,
    face: typeof avatar.face === 'string' ? avatar.face : defaultAvatar.face,
    eyes: typeof avatar.eyes === 'string'
      ? avatar.eyes
      : typeof avatar.face === 'string'
        ? avatar.face
        : defaultAvatar.eyes,
    mouth: typeof avatar.mouth === 'string'
      ? avatar.mouth
      : typeof avatar.face === 'string' && avatar.face === 'focus'
        ? 'flat'
        : defaultAvatar.mouth,
    nose: typeof avatar.nose === 'string' ? avatar.nose : defaultAvatar.nose,
    hair: typeof avatar.hair === 'string' ? avatar.hair : defaultAvatar.hair,
    accessory: typeof avatar.accessory === 'string' ? avatar.accessory : defaultAvatar.accessory,
    background: typeof avatar.background === 'string' ? avatar.background : defaultAvatar.background,
    outfit: typeof avatar.outfit === 'string' ? avatar.outfit : defaultAvatar.outfit,
    item: typeof avatar.item === 'string' ? avatar.item : defaultAvatar.item
  };
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getNextStreak(lastPlayedAt: Date | undefined, currentStreak: number) {
  if (!lastPlayedAt) {
    return 1;
  }

  const today = startOfLocalDay(new Date());
  const lastPlayedDay = startOfLocalDay(lastPlayedAt);
  const oneDay = 24 * 60 * 60 * 1000;
  const dayGap = Math.round((today - lastPlayedDay) / oneDay);

  if (dayGap <= 0) {
    return Math.max(currentStreak, 1);
  }

  if (dayGap === 1) {
    return currentStreak + 1;
  }

  return 1;
}

export async function registerWithEmail(email: string, password: string, displayName: string) {
  const { auth } = requireFirebase();
  const result = await createUserWithEmailAndPassword(auth, email, password);
  const name = displayName.trim() || fallbackName(result.user);
  await updateProfile(result.user, { displayName: name });
  await ensureUserProfile(result.user, name);
  return result.user;
}

export async function loginWithEmail(email: string, password: string) {
  const { auth } = requireFirebase();
  const result = await signInWithEmailAndPassword(auth, email, password);
  await ensureUserProfile(result.user);
  return result.user;
}

export async function resetPassword(email: string) {
  const { auth } = requireFirebase();
  await sendPasswordResetEmail(auth, email);
}

export async function logout() {
  const { auth } = requireFirebase();
  await signOut(auth);
}

export async function ensureUserProfile(user: User, displayName = fallbackName(user)) {
  const { db } = requireFirebase();
  const profileRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(profileRef);

  if (!snapshot.exists()) {
    const profile: Omit<UserProfile, 'uid'> = {
      email: user.email ?? '',
      displayName,
      avatar: defaultAvatar,
      level: 1,
      score: 0,
      bestPlatformScore: 0,
      gamesPlayed: 0,
      totalAnsweredQuestions: 0,
      totalCorrectAnswers: 0,
      bestCorrectAnswers: 0,
      bestAccuracy: 0,
      currentStreak: 0,
      bestStreak: 0
    };

    await setDoc(profileRef, {
      ...profile,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    await setDoc(doc(db, 'leaderboard', user.uid), {
      uid: user.uid,
      displayName,
      platformScore: profile.bestPlatformScore,
      level: profile.level,
      score: profile.score,
      updatedAt: serverTimestamp()
    });
  }
}

export async function getUserProfile(user: User): Promise<UserProfile> {
  const { db } = requireFirebase();
  await ensureUserProfile(user);
  const snapshot = await getDoc(doc(db, 'users', user.uid));
  const data = snapshot.data() ?? {};
  const lastPlayedAt = data.lastPlayedAt && typeof data.lastPlayedAt.toDate === 'function'
    ? data.lastPlayedAt.toDate()
    : undefined;

  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: String(data.displayName ?? fallbackName(user)),
    avatar: readAvatarConfig(data.avatar),
    level: Number(data.level ?? 1),
    score: Number(data.score ?? 0),
    bestPlatformScore: Number(data.bestPlatformScore ?? 0),
    gamesPlayed: Number(data.gamesPlayed ?? 0),
    totalAnsweredQuestions: Number(data.totalAnsweredQuestions ?? 0),
    totalCorrectAnswers: Number(data.totalCorrectAnswers ?? 0),
    bestCorrectAnswers: Number(data.bestCorrectAnswers ?? 0),
    bestAccuracy: Number(data.bestAccuracy ?? 0),
    currentStreak: Number(data.currentStreak ?? 0),
    bestStreak: Number(data.bestStreak ?? 0),
    lastPlayedAt,
    openAiPreviousResponseId:
      typeof data.openAiPreviousResponseId === 'string' ? data.openAiPreviousResponseId : undefined
  };
}

export async function saveOpenAiPreviousResponseId(user: User, responseId: string) {
  const { db } = requireFirebase();
  await setDoc(
    doc(db, 'users', user.uid),
    {
      openAiPreviousResponseId: responseId,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
}

export async function updateUserProfileSettings(user: User, displayName: string, avatar: AvatarConfig) {
  const { db } = requireFirebase();
  const name = displayName.trim() || fallbackName(user);

  await updateProfile(user, {
    displayName: name
  });

  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email ?? '',
      displayName: name,
      avatar,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await setDoc(
    doc(db, 'leaderboard', user.uid),
    {
      uid: user.uid,
      displayName: name,
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  return {
    displayName: name,
    avatar
  };
}

export async function saveCompletedSession(user: User, profile: UserProfile, session: CompletedSession) {
  const { db } = requireFirebase();
  const bestPlatformScore = Math.max(profile.bestPlatformScore, session.platformScore);
  const sessionAccuracy = session.answeredQuestions > 0
    ? Math.round((session.correctAnswers / session.answeredQuestions) * 100)
    : 0;
  const nextStreak = getNextStreak(profile.lastPlayedAt, profile.currentStreak);
  const nextProfile: UserProfile = {
    ...profile,
    level: session.level,
    score: session.score,
    bestPlatformScore,
    gamesPlayed: profile.gamesPlayed + 1,
    totalAnsweredQuestions: profile.totalAnsweredQuestions + session.answeredQuestions,
    totalCorrectAnswers: profile.totalCorrectAnswers + session.correctAnswers,
    bestCorrectAnswers: Math.max(profile.bestCorrectAnswers, session.correctAnswers),
    bestAccuracy: Math.max(profile.bestAccuracy, sessionAccuracy),
    currentStreak: nextStreak,
    bestStreak: Math.max(profile.bestStreak, nextStreak),
    lastPlayedAt: new Date()
  };

  await setDoc(
    doc(db, 'users', user.uid),
    {
      email: user.email ?? '',
      displayName: profile.displayName,
      level: nextProfile.level,
      score: nextProfile.score,
      bestPlatformScore,
      gamesPlayed: nextProfile.gamesPlayed,
      totalAnsweredQuestions: nextProfile.totalAnsweredQuestions,
      totalCorrectAnswers: nextProfile.totalCorrectAnswers,
      bestCorrectAnswers: nextProfile.bestCorrectAnswers,
      bestAccuracy: nextProfile.bestAccuracy,
      currentStreak: nextProfile.currentStreak,
      bestStreak: nextProfile.bestStreak,
      lastPlayedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );

  await setDoc(doc(db, 'leaderboard', user.uid), {
    uid: user.uid,
    displayName: profile.displayName,
    platformScore: bestPlatformScore,
    level: session.level,
    score: session.score,
    updatedAt: serverTimestamp()
  });

  await addDoc(collection(db, 'users', user.uid, 'sessions'), {
    ...session,
    completedAt: serverTimestamp()
  });

  return nextProfile;
}

export async function getRecentSessions(user: User, maxCount = 5): Promise<SessionSummary[]> {
  const { db } = requireFirebase();
  const sessionsQuery = query(
    collection(db, 'users', user.uid, 'sessions'),
    orderBy('completedAt', 'desc'),
    limit(maxCount)
  );
  const snapshot = await getDocs(sessionsQuery);

  return snapshot.docs.map((entry) => {
    const data = entry.data();
    const completedAt = data.completedAt && typeof data.completedAt.toDate === 'function'
      ? data.completedAt.toDate()
      : undefined;

    return {
      id: entry.id,
      categories: String(data.categories ?? ''),
      difficulty: String(data.difficulty ?? ''),
      totalQuestions: Number(data.totalQuestions ?? 0),
      answeredQuestions: Number(data.answeredQuestions ?? 0),
      correctAnswers: Number(data.correctAnswers ?? 0),
      level: Number(data.level ?? 1),
      score: Number(data.score ?? 0),
      platformScore: Number(data.platformScore ?? 0),
      completedAt
    };
  });
}

export async function saveCustomTestDraft(user: User, draft: CustomTestDraft): Promise<CustomTestDraft> {
  const { db } = requireFirebase();
  const draftRef = draft.id
    ? doc(db, 'users', user.uid, 'customTests', draft.id)
    : doc(collection(db, 'users', user.uid, 'customTests'));

  await setDoc(
    draftRef,
    {
      title: draft.title,
      description: draft.description,
      category: draft.category,
      visibility: draft.visibility,
      status: draft.status,
      questions: draft.questions,
      updatedAt: serverTimestamp(),
      ...(draft.status === 'published' ? { publishedAt: serverTimestamp() } : {})
    },
    { merge: true }
  );

  const publishedRef = doc(db, 'publishedTests', draftRef.id);

  if (draft.status === 'published') {
    await setDoc(publishedRef, {
      authorId: user.uid,
      authorName: fallbackName(user),
      title: draft.title,
      description: draft.description,
      category: draft.category,
      visibility: draft.visibility,
      status: 'published' as const,
      questions: draft.questions,
      updatedAt: serverTimestamp(),
      publishedAt: serverTimestamp()
    });
  }

  return {
    ...draft,
    id: draftRef.id,
    updatedAt: new Date()
  };
}

export async function getPublishedTests(user: User): Promise<PublishedTest[]> {
  const { db } = requireFirebase();
  const publishedTestsRef = collection(db, 'publishedTests');
  const [publicSnapshot, ownSnapshot] = await Promise.all([
    getDocs(query(publishedTestsRef, where('visibility', '==', 'Public'))),
    getDocs(query(publishedTestsRef, where('authorId', '==', user.uid)))
  ]);
  const entries = new Map([...publicSnapshot.docs, ...ownSnapshot.docs].map((entry) => [entry.id, entry]));

  return [...entries.values()].map((entry) => {
    const data = entry.data();
    const questions = Array.isArray(data.questions)
      ? data.questions.map((question: Record<string, unknown>) => ({
          prompt: String(question.prompt ?? ''),
          answers: Array.isArray(question.answers)
            ? question.answers.map((answer) => String(answer))
            : [],
          correctAnswer: Number(question.correctAnswer ?? 0)
        }))
      : [];

    return {
      id: entry.id,
      authorId: String(data.authorId ?? ''),
      authorName: String(data.authorName ?? 'Player'),
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      category: String(data.category ?? ''),
      visibility: String(data.visibility ?? 'Private'),
      status: 'published' as const,
      questions,
      updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function'
        ? data.updatedAt.toDate()
        : undefined,
      publishedAt: data.publishedAt && typeof data.publishedAt.toDate === 'function'
        ? data.publishedAt.toDate()
        : undefined
    };
  }).sort((left, right) => (right.updatedAt?.getTime() ?? 0) - (left.updatedAt?.getTime() ?? 0));
}

export async function getCustomTestDrafts(user: User): Promise<CustomTestDraft[]> {
  const { db } = requireFirebase();
  const draftsQuery = query(
    collection(db, 'users', user.uid, 'customTests'),
    orderBy('updatedAt', 'desc')
  );
  const snapshot = await getDocs(draftsQuery);

  return snapshot.docs.map((entry) => {
    const data = entry.data();
    const questions = Array.isArray(data.questions)
      ? data.questions.map((question: Record<string, unknown>) => ({
          prompt: String(question.prompt ?? ''),
          answers: Array.isArray(question.answers)
            ? question.answers.map((answer) => String(answer))
            : ['', '', '', ''],
          correctAnswer: Number(question.correctAnswer ?? 0)
        }))
      : [];

    return {
      id: entry.id,
      title: String(data.title ?? ''),
      description: String(data.description ?? ''),
      category: String(data.category ?? ''),
      visibility: String(data.visibility ?? 'Private'),
      status: data.status === 'published' ? 'published' : 'draft',
      questions,
      updatedAt: data.updatedAt && typeof data.updatedAt.toDate === 'function'
        ? data.updatedAt.toDate()
        : undefined,
      publishedAt: data.publishedAt && typeof data.publishedAt.toDate === 'function'
        ? data.publishedAt.toDate()
        : undefined
    };
  });
}

export async function deleteCustomTest(user: User, testId: string) {
  const { db } = requireFirebase();

  await Promise.all([
    deleteDoc(doc(db, 'users', user.uid, 'customTests', testId)),
    deleteDoc(doc(db, 'publishedTests', testId))
  ]);
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { db } = requireFirebase();
  const leaderboardQuery = query(collection(db, 'leaderboard'), orderBy('platformScore', 'desc'), limit(10));
  const snapshot = await getDocs(leaderboardQuery);

  return snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      uid: String(data.uid ?? entry.id),
      displayName: String(data.displayName ?? 'Player'),
      platformScore: Number(data.platformScore ?? 0),
      level: Number(data.level ?? 1),
      score: Number(data.score ?? 0)
    };
  });
}
