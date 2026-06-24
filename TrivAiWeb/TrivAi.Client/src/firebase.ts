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
  runTransaction,
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
  style: string;
  seed: string;
  gender: string;
  backgroundColor: string;
  top: string;
  hairStyle: string;
  headwear: string;
  eyesVariant: string;
  eyebrows: string;
  mouthVariant: string;
  accessoriesVariant: string;
  clothing: string;
  clothingGraphic: string;
  clothingColor: string;
  hatColor: string;
  accessoriesColor: string;
  facialHair: string;
  facialHairColor: string;
  skinColor: string;
  hairColor: string;
  loreleiHair: string;
  loreleiHead: string;
  loreleiEyes: string;
  loreleiEyebrows: string;
  loreleiMouth: string;
  loreleiNose: string;
  loreleiGlasses: string;
  loreleiEarrings: string;
  loreleiBeard: string;
  loreleiFreckles: string;
  loreleiHairAccessories: string;
  loreleiHairColor: string;
  loreleiSkinColor: string;
  loreleiFeatureColor: string;
  notionistsHair: string;
  notionistsClothes: string;
  notionistsClothesGraphic: string;
  notionistsEyes: string;
  notionistsEyebrows: string;
  notionistsMouth: string;
  notionistsNose: string;
  notionistsGlasses: string;
  notionistsBeard: string;
  notionistsGesture: string;
  openPeepsHead: string;
  openPeepsExpression: string;
  openPeepsAccessories: string;
  openPeepsFacialHair: string;
  openPeepsMask: string;
  openPeepsClothingColor: string;
  openPeepsHeadContrastColor: string;
  openPeepsSkinColor: string;
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
  dailyRewardStreak: number;
  lastDailyRewardDate?: string;
  openAiPreviousResponseId?: string;
};

export type DailyRewardClaim = {
  profile: UserProfile;
  reward: number;
  streak: number;
};

export const dailyRewardPoints = [25, 35, 50, 65, 85, 110, 150];

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

export type PublishedTestQuestion = {
  prompt: string;
  answers: string[];
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

export type PublishedTest = Omit<CustomTestDraft, 'questions'> & {
  authorId: string;
  authorName: string;
  questions: PublishedTestQuestion[];
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
  style: 'avataaars',
  seed: 'TrivAI Player',
  gender: 'masculine',
  backgroundColor: '8de8d2',
  top: 'shortFlat',
  hairStyle: 'shortFlat',
  headwear: 'none',
  eyesVariant: 'default',
  eyebrows: 'default',
  mouthVariant: 'smile',
  accessoriesVariant: 'none',
  clothing: 'hoodie',
  clothingGraphic: 'diamond',
  clothingColor: '262e33',
  hatColor: '25557c',
  accessoriesColor: '262e33',
  facialHair: 'none',
  facialHairColor: '2c1b18',
  skinColor: 'edb98a',
  hairColor: '2c1b18',
  loreleiHair: 'variant01',
  loreleiHead: 'variant01',
  loreleiEyes: 'variant01',
  loreleiEyebrows: 'variant01',
  loreleiMouth: 'happy01',
  loreleiNose: 'variant01',
  loreleiGlasses: 'none',
  loreleiEarrings: 'none',
  loreleiBeard: 'none',
  loreleiFreckles: 'none',
  loreleiHairAccessories: 'none',
  loreleiHairColor: '2c1b18',
  loreleiSkinColor: 'edb98a',
  loreleiFeatureColor: '000000',
  notionistsHair: 'variant01',
  notionistsClothes: 'variant01',
  notionistsClothesGraphic: 'none',
  notionistsEyes: 'variant01',
  notionistsEyebrows: 'variant01',
  notionistsMouth: 'variant01',
  notionistsNose: 'variant01',
  notionistsGlasses: 'none',
  notionistsBeard: 'none',
  notionistsGesture: 'none',
  openPeepsHead: 'afro',
  openPeepsExpression: 'smile',
  openPeepsAccessories: 'none',
  openPeepsFacialHair: 'none',
  openPeepsMask: 'none',
  openPeepsClothingColor: '8fa7df',
  openPeepsHeadContrastColor: '2c1b18',
  openPeepsSkinColor: 'edb98a',
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

function readAvatarConfig(value: unknown, fallbackSeed = defaultAvatar.seed): AvatarConfig {
  if (!value || typeof value !== 'object') {
    return { ...defaultAvatar, seed: fallbackSeed };
  }

  const avatar = value as Partial<Record<keyof AvatarConfig, unknown>>;

  return {
    style: typeof avatar.style === 'string' ? avatar.style : defaultAvatar.style,
    seed: typeof avatar.seed === 'string' ? avatar.seed : fallbackSeed,
    gender: typeof avatar.gender === 'string' ? avatar.gender : defaultAvatar.gender,
    backgroundColor: typeof avatar.backgroundColor === 'string'
      ? avatar.backgroundColor
      : defaultAvatar.backgroundColor,
    top: typeof avatar.top === 'string' ? avatar.top : defaultAvatar.top,
    hairStyle: typeof avatar.hairStyle === 'string'
      ? avatar.hairStyle
      : typeof avatar.top === 'string'
        ? avatar.top
        : defaultAvatar.hairStyle,
    headwear: typeof avatar.headwear === 'string' ? avatar.headwear : defaultAvatar.headwear,
    eyesVariant: typeof avatar.eyesVariant === 'string' ? avatar.eyesVariant : defaultAvatar.eyesVariant,
    eyebrows: typeof avatar.eyebrows === 'string' ? avatar.eyebrows : defaultAvatar.eyebrows,
    mouthVariant: typeof avatar.mouthVariant === 'string' ? avatar.mouthVariant : defaultAvatar.mouthVariant,
    accessoriesVariant: typeof avatar.accessoriesVariant === 'string'
      ? avatar.accessoriesVariant
      : defaultAvatar.accessoriesVariant,
    clothing: typeof avatar.clothing === 'string' ? avatar.clothing : defaultAvatar.clothing,
    clothingGraphic: typeof avatar.clothingGraphic === 'string'
      ? avatar.clothingGraphic
      : defaultAvatar.clothingGraphic,
    clothingColor: typeof avatar.clothingColor === 'string' ? avatar.clothingColor : defaultAvatar.clothingColor,
    hatColor: typeof avatar.hatColor === 'string' ? avatar.hatColor : defaultAvatar.hatColor,
    accessoriesColor: typeof avatar.accessoriesColor === 'string'
      ? avatar.accessoriesColor
      : defaultAvatar.accessoriesColor,
    facialHair: typeof avatar.facialHair === 'string' ? avatar.facialHair : defaultAvatar.facialHair,
    facialHairColor: typeof avatar.facialHairColor === 'string'
      ? avatar.facialHairColor
      : defaultAvatar.facialHairColor,
    skinColor: typeof avatar.skinColor === 'string' ? avatar.skinColor : defaultAvatar.skinColor,
    hairColor: typeof avatar.hairColor === 'string' ? avatar.hairColor : defaultAvatar.hairColor,
    loreleiHair: typeof avatar.loreleiHair === 'string' ? avatar.loreleiHair : defaultAvatar.loreleiHair,
    loreleiHead: typeof avatar.loreleiHead === 'string' ? avatar.loreleiHead : defaultAvatar.loreleiHead,
    loreleiEyes: typeof avatar.loreleiEyes === 'string' ? avatar.loreleiEyes : defaultAvatar.loreleiEyes,
    loreleiEyebrows: typeof avatar.loreleiEyebrows === 'string'
      ? avatar.loreleiEyebrows
      : defaultAvatar.loreleiEyebrows,
    loreleiMouth: typeof avatar.loreleiMouth === 'string' ? avatar.loreleiMouth : defaultAvatar.loreleiMouth,
    loreleiNose: typeof avatar.loreleiNose === 'string' ? avatar.loreleiNose : defaultAvatar.loreleiNose,
    loreleiGlasses: typeof avatar.loreleiGlasses === 'string'
      ? avatar.loreleiGlasses
      : defaultAvatar.loreleiGlasses,
    loreleiEarrings: typeof avatar.loreleiEarrings === 'string'
      ? avatar.loreleiEarrings
      : defaultAvatar.loreleiEarrings,
    loreleiBeard: typeof avatar.loreleiBeard === 'string' ? avatar.loreleiBeard : defaultAvatar.loreleiBeard,
    loreleiFreckles: typeof avatar.loreleiFreckles === 'string'
      ? avatar.loreleiFreckles
      : defaultAvatar.loreleiFreckles,
    loreleiHairAccessories: avatar.loreleiHairAccessories === 'variant01'
      ? 'flowers'
      : typeof avatar.loreleiHairAccessories === 'string'
        ? avatar.loreleiHairAccessories
        : defaultAvatar.loreleiHairAccessories,
    loreleiHairColor: typeof avatar.loreleiHairColor === 'string'
      ? avatar.loreleiHairColor
      : defaultAvatar.loreleiHairColor,
    loreleiSkinColor: typeof avatar.loreleiSkinColor === 'string'
      ? avatar.loreleiSkinColor
      : defaultAvatar.loreleiSkinColor,
    loreleiFeatureColor: typeof avatar.loreleiFeatureColor === 'string'
      ? avatar.loreleiFeatureColor
      : defaultAvatar.loreleiFeatureColor,
    notionistsHair: typeof avatar.notionistsHair === 'string' ? avatar.notionistsHair : defaultAvatar.notionistsHair,
    notionistsClothes: typeof avatar.notionistsClothes === 'string'
      ? avatar.notionistsClothes
      : defaultAvatar.notionistsClothes,
    notionistsClothesGraphic: typeof avatar.notionistsClothesGraphic === 'string'
      ? avatar.notionistsClothesGraphic
      : defaultAvatar.notionistsClothesGraphic,
    notionistsEyes: typeof avatar.notionistsEyes === 'string' ? avatar.notionistsEyes : defaultAvatar.notionistsEyes,
    notionistsEyebrows: typeof avatar.notionistsEyebrows === 'string'
      ? avatar.notionistsEyebrows
      : defaultAvatar.notionistsEyebrows,
    notionistsMouth: typeof avatar.notionistsMouth === 'string'
      ? avatar.notionistsMouth
      : defaultAvatar.notionistsMouth,
    notionistsNose: typeof avatar.notionistsNose === 'string' ? avatar.notionistsNose : defaultAvatar.notionistsNose,
    notionistsGlasses: typeof avatar.notionistsGlasses === 'string'
      ? avatar.notionistsGlasses
      : defaultAvatar.notionistsGlasses,
    notionistsBeard: typeof avatar.notionistsBeard === 'string' ? avatar.notionistsBeard : defaultAvatar.notionistsBeard,
    notionistsGesture: typeof avatar.notionistsGesture === 'string'
      ? avatar.notionistsGesture
      : defaultAvatar.notionistsGesture,
    openPeepsHead: typeof avatar.openPeepsHead === 'string' ? avatar.openPeepsHead : defaultAvatar.openPeepsHead,
    openPeepsExpression: typeof avatar.openPeepsExpression === 'string'
      ? avatar.openPeepsExpression
      : defaultAvatar.openPeepsExpression,
    openPeepsAccessories: typeof avatar.openPeepsAccessories === 'string'
      ? avatar.openPeepsAccessories
      : defaultAvatar.openPeepsAccessories,
    openPeepsFacialHair: typeof avatar.openPeepsFacialHair === 'string'
      ? avatar.openPeepsFacialHair
      : defaultAvatar.openPeepsFacialHair,
    openPeepsMask: typeof avatar.openPeepsMask === 'string' ? avatar.openPeepsMask : defaultAvatar.openPeepsMask,
    openPeepsClothingColor: typeof avatar.openPeepsClothingColor === 'string'
      ? avatar.openPeepsClothingColor
      : defaultAvatar.openPeepsClothingColor,
    openPeepsHeadContrastColor: typeof avatar.openPeepsHeadContrastColor === 'string'
      ? avatar.openPeepsHeadContrastColor
      : defaultAvatar.openPeepsHeadContrastColor,
    openPeepsSkinColor: typeof avatar.openPeepsSkinColor === 'string'
      ? avatar.openPeepsSkinColor
      : defaultAvatar.openPeepsSkinColor,
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

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function previousLocalDateKey(date = new Date()) {
  const previous = new Date(date);
  previous.setDate(previous.getDate() - 1);
  return localDateKey(previous);
}

export function canClaimDailyReward(profile: UserProfile) {
  return profile.lastDailyRewardDate !== localDateKey();
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
      avatar: { ...defaultAvatar, seed: user.uid },
      level: 1,
      score: 0,
      bestPlatformScore: 0,
      gamesPlayed: 0,
      totalAnsweredQuestions: 0,
      totalCorrectAnswers: 0,
      bestCorrectAnswers: 0,
      bestAccuracy: 0,
      currentStreak: 0,
      bestStreak: 0,
      dailyRewardStreak: 0
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
    avatar: readAvatarConfig(data.avatar, user.uid),
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
    dailyRewardStreak: Number(data.dailyRewardStreak ?? 0),
    lastDailyRewardDate:
      typeof data.lastDailyRewardDate === 'string' ? data.lastDailyRewardDate : undefined,
    openAiPreviousResponseId:
      typeof data.openAiPreviousResponseId === 'string' ? data.openAiPreviousResponseId : undefined
  };
}

export async function claimDailyReward(user: User): Promise<DailyRewardClaim> {
  const { db } = requireFirebase();
  const profileRef = doc(db, 'users', user.uid);
  const leaderboardRef = doc(db, 'leaderboard', user.uid);

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(profileRef);
    const data = snapshot.data() ?? {};
    const today = localDateKey();
    const lastClaimDate = typeof data.lastDailyRewardDate === 'string' ? data.lastDailyRewardDate : undefined;

    if (lastClaimDate === today) {
      throw new Error('Today’s daily reward has already been claimed.');
    }

    const previousStreak = Number(data.dailyRewardStreak ?? 0);
    const streak = lastClaimDate === previousLocalDateKey() ? previousStreak + 1 : 1;
    const reward = dailyRewardPoints[(streak - 1) % dailyRewardPoints.length];
    let level = Number(data.level ?? 1);
    let score = Number(data.score ?? 0) + reward;

    while (score >= level * 150) {
      score -= level * 150;
      level += 1;
    }

    transaction.set(profileRef, {
      level,
      score,
      dailyRewardStreak: streak,
      lastDailyRewardDate: today,
      updatedAt: serverTimestamp()
    }, { merge: true });

    transaction.set(leaderboardRef, {
      uid: user.uid,
      displayName: String(data.displayName ?? fallbackName(user)),
      level,
      score,
      updatedAt: serverTimestamp()
    }, { merge: true });

    return {
      profile: {
        uid: user.uid,
        email: user.email ?? '',
        displayName: String(data.displayName ?? fallbackName(user)),
        avatar: readAvatarConfig(data.avatar, user.uid),
        level,
        score,
        bestPlatformScore: Number(data.bestPlatformScore ?? 0),
        gamesPlayed: Number(data.gamesPlayed ?? 0),
        totalAnsweredQuestions: Number(data.totalAnsweredQuestions ?? 0),
        totalCorrectAnswers: Number(data.totalCorrectAnswers ?? 0),
        bestCorrectAnswers: Number(data.bestCorrectAnswers ?? 0),
        bestAccuracy: Number(data.bestAccuracy ?? 0),
        currentStreak: Number(data.currentStreak ?? 0),
        bestStreak: Number(data.bestStreak ?? 0),
        lastPlayedAt: data.lastPlayedAt?.toDate?.(),
        dailyRewardStreak: streak,
        lastDailyRewardDate: today,
        openAiPreviousResponseId:
          typeof data.openAiPreviousResponseId === 'string' ? data.openAiPreviousResponseId : undefined
      },
      reward,
      streak
    };
  });
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
  return customTestApi<CustomTestDraft>(user, '', {
    method: 'POST',
    body: JSON.stringify(draft)
  });
}

export async function getPublishedTests(user: User): Promise<PublishedTest[]> {
  return mapCustomTestDates(await customTestApi<PublishedTest[]>(user, '/published'));
}

export async function getCustomTestDrafts(user: User): Promise<CustomTestDraft[]> {
  return mapCustomTestDates(await customTestApi<CustomTestDraft[]>(user));
}

export async function deleteCustomTest(user: User, testId: string) {
  await customTestApi<void>(user, `/${encodeURIComponent(testId)}`, { method: 'DELETE' });
}

export async function checkPublishedTestAnswer(
  user: User,
  testId: string,
  questionIndex: number,
  answerIndex: number
): Promise<boolean> {
  const result = await customTestApi<{ isCorrect: boolean }>(
    user,
    `/published/${encodeURIComponent(testId)}/answers`,
    {
      method: 'POST',
      body: JSON.stringify({ questionIndex, answerIndex })
    }
  );

  return result.isCorrect;
}

async function customTestApi<T>(user: User, path = '', init: RequestInit = {}): Promise<T> {
  const token = await user.getIdToken();
  const response = await fetch(`/api/custom-tests${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...init.headers
    }
  });

  if (!response.ok) {
    const problem = await response.text();
    throw new Error(problem || 'Custom test request failed.');
  }

  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}

function mapCustomTestDates<T extends { updatedAt?: Date; publishedAt?: Date }>(tests: T[]): T[] {
  return tests.map((test) => ({
    ...test,
    updatedAt: test.updatedAt ? new Date(test.updatedAt) : undefined,
    publishedAt: test.publishedAt ? new Date(test.publishedAt) : undefined
  })) as T[];
}

export async function getLeaderboard(): Promise<LeaderboardEntry[]> {
  const { db } = requireFirebase();
  const snapshot = await getDocs(collection(db, 'leaderboard'));

  const realEntries = snapshot.docs.map((entry) => {
    const data = entry.data();
    return {
      uid: String(data.uid ?? entry.id),
      displayName: String(data.displayName ?? 'Player'),
      platformScore: Number(data.platformScore ?? 0),
      level: Number(data.level ?? 1),
      score: Number(data.score ?? 0)
    };
  });

  return realEntries
    .sort((left, right) => {
      if (right.platformScore !== left.platformScore) {
        return right.platformScore - left.platformScore;
      }

      if (right.level !== left.level) {
        return right.level - left.level;
      }

      if (right.score !== left.score) {
        return right.score - left.score;
      }

      const nameOrder = left.displayName.localeCompare(right.displayName);
      return nameOrder !== 0 ? nameOrder : left.uid.localeCompare(right.uid);
    })
    .slice(0, 10);
}
