import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import {
  auth,
  getLeaderboard,
  getRecentSessions,
  getUserProfile,
  isFirebaseConfigured,
  loginWithEmail,
  logout,
  registerWithEmail,
  resetPassword,
  saveCompletedSession,
  saveOpenAiPreviousResponseId,
  updateUserProfileSettings,
  defaultAvatar,
  type AvatarConfig,
  type LeaderboardEntry,
  type SessionSummary,
  type UserProfile
} from './firebase';
import emptyAvatarImage from './assets/avatar/avatar.png';
import topHatImage from './assets/avatar/items/accessory/top-hat.png';
import wizardHatImage from './assets/avatar/items/accessory/wizard-hat.png';
import animeEyesImage from './assets/avatar/items/eyes/anime.png';
import surprisedEyesImage from './assets/avatar/items/eyes/surprised.png';
import bowHairImage from './assets/avatar/items/hair/bow.png';
import elvisHairImage from './assets/avatar/items/hair/clip-elvis-hair-1.png';
import brownHairImage from './assets/avatar/items/hair/hair-transparent-png-25.jpg';
import orangeHairImage from './assets/avatar/items/hair/orange-hair.png';
import cartoonHairImage from './assets/avatar/items/hair/transparent-cartoon-hair-15.jpg';
import teethMouthImage from './assets/avatar/items/mouth/77-774546_smiling-teeth-png-cartoon-mouth-smile.png';
import lipsMouthImage from './assets/avatar/items/mouth/NicePng_lips-png_67937.png';
import smileMouthImage from './assets/avatar/items/mouth/smile-clip-art-24.png';
import smallSmileMouthImage from './assets/avatar/items/mouth/smile-clip-art-73.png';
import heroImage from './assets/trivai-hero.png';
import './styles.css';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Duration = 'Short Version' | 'Medium Version' | 'Long Version';

type Answer = {
  text: string;
  isCorrect: boolean;
};

type Question = {
  questionName: string;
  answers: Answer[];
  tipForAnsweringQuestion: string;
  openAiPreviousResponseId?: string;
};

type GameSetup = {
  username: string;
  categories: string;
  difficulty: Difficulty;
  duration: Duration;
};

type UsedHelpers = {
  fiftyFifty: boolean;
  revealAnswer: boolean;
  hint: boolean;
};

type AuthMode = 'login' | 'register';
type AppView = 'setup' | 'dashboard' | 'settings';

type AvatarOption = {
  id: string;
  label: string;
  minLevel?: number;
};

type AvatarPart = keyof AvatarConfig;

const durationToQuestions: Record<Duration, number> = {
  'Short Version': 10,
  'Medium Version': 20,
  'Long Version': 30
};

const combinedCategories = [
  'history',
  'geography',
  'science',
  'sport',
  'music',
  'movies',
  'technology',
  'art',
  'literature',
  'nature',
  'video games',
  'space'
];

const randomNames = ['Nova', 'RoboFan', 'Pixel', 'Astra', 'Quizzer'];

const avatarParts: { id: AvatarPart; label: string; icon: string }[] = [
  { id: 'background', label: 'Backdrop', icon: '▣' },
  { id: 'eyes', label: 'Eyes', icon: '◉' },
  { id: 'mouth', label: 'Mouth', icon: '◡' },
  { id: 'nose', label: 'Nose', icon: '⌁' },
  { id: 'hair', label: 'Hair', icon: '≋' },
  { id: 'accessory', label: 'Accessory', icon: '★' },
  { id: 'item', label: 'Item', icon: '◆' }
];

const avatarOptions: Record<AvatarPart, AvatarOption[]> = {
  base: [
    { id: 'gold', label: 'Gold' },
    { id: 'rose', label: 'Rose' },
    { id: 'sky', label: 'Sky' },
    { id: 'violet', label: 'Violet' },
    { id: 'lime', label: 'Lime' },
    { id: 'cocoa', label: 'Cocoa' },
    { id: 'ember', label: 'Ember', minLevel: 4 }
  ],
  face: [
    { id: 'bright', label: 'Bright' },
    { id: 'calm', label: 'Calm' },
    { id: 'focus', label: 'Focus' },
    { id: 'wink', label: 'Wink' },
    { id: 'spark', label: 'Spark', minLevel: 3 },
    { id: 'smirk', label: 'Smirk', minLevel: 5 }
  ],
  eyes: [
    { id: 'bright', label: 'Bright' },
    { id: 'calm', label: 'Calm' },
    { id: 'focus', label: 'Focus' },
    { id: 'wink', label: 'Wink' },
    { id: 'spark', label: 'Spark', minLevel: 3 },
    { id: 'anime', label: 'Anime' },
    { id: 'surprised', label: 'Surprised' }
  ],
  mouth: [
    { id: 'smile', label: 'Smile' },
    { id: 'flat', label: 'Flat' },
    { id: 'smirk', label: 'Smirk', minLevel: 4 },
    { id: 'open', label: 'Open', minLevel: 6 },
    { id: 'teeth', label: 'Teeth' },
    { id: 'lips', label: 'Lips' },
    { id: 'wide-smile', label: 'Wide Smile' },
    { id: 'small-smile', label: 'Small Smile' }
  ],
  nose: [
    { id: 'soft', label: 'Soft' },
    { id: 'button', label: 'Button' },
    { id: 'sharp', label: 'Sharp', minLevel: 3 },
    { id: 'none', label: 'None' }
  ],
  hair: [
    { id: 'short', label: 'Short' },
    { id: 'bob', label: 'Bob' },
    { id: 'curly', label: 'Curly', minLevel: 2 },
    { id: 'swoop', label: 'Swoop', minLevel: 3 },
    { id: 'spikes', label: 'Spikes', minLevel: 5 },
    { id: 'mohawk', label: 'Mohawk', minLevel: 7 },
    { id: 'bow', label: 'Bow' },
    { id: 'elvis', label: 'Elvis' },
    { id: 'brown-hair', label: 'Brown Hair' },
    { id: 'orange-hair', label: 'Orange Hair' },
    { id: 'cartoon-hair', label: 'Cartoon Hair' },
    { id: 'none', label: 'None' }
  ],
  accessory: [
    { id: 'none', label: 'None' },
    { id: 'glasses', label: 'Glasses', minLevel: 2 },
    { id: 'visor', label: 'Visor', minLevel: 3 },
    { id: 'headphones', label: 'Headphones', minLevel: 4 },
    { id: 'cap', label: 'Cap', minLevel: 6 },
    { id: 'top-hat', label: 'Top Hat' },
    { id: 'wizard-hat', label: 'Wizard Hat' },
    { id: 'crown', label: 'Crown', minLevel: 8 },
    { id: 'star', label: 'Star', minLevel: 9 }
  ],
  background: [
    { id: 'mint', label: 'Mint' },
    { id: 'sun', label: 'Sun' },
    { id: 'coral', label: 'Coral' },
    { id: 'lavender', label: 'Lavender' },
    { id: 'limewash', label: 'Limewash' },
    { id: 'ocean', label: 'Ocean', minLevel: 3 },
    { id: 'plum', label: 'Plum', minLevel: 5 },
    { id: 'paper', label: 'Paper', minLevel: 7 },
    { id: 'arcade', label: 'Arcade', minLevel: 9 }
  ],
  outfit: [
    { id: 'hoodie', label: 'Hoodie' },
    { id: 'jacket', label: 'Jacket' },
    { id: 'armor', label: 'Armor', minLevel: 4 },
    { id: 'wizard', label: 'Wizard', minLevel: 6 },
    { id: 'space', label: 'Space Suit', minLevel: 8 }
  ],
  item: [
    { id: 'none', label: 'None' },
    { id: 'book', label: 'Book', minLevel: 2 },
    { id: 'bolt', label: 'Bolt', minLevel: 3 },
    { id: 'gem', label: 'Gem', minLevel: 5 },
    { id: 'trophy', label: 'Trophy', minLevel: 7 }
  ]
};

function LocalAvatar({ avatar, label }: { avatar?: AvatarConfig; label: string }) {
  const activeAvatar = avatar ?? defaultAvatar;
  const backgroundColors: Record<string, string> = {
    mint: '#8de8d2',
    sun: '#ffd35a',
    coral: '#ff9f8f',
    lavender: '#c9b6ff',
    limewash: '#d7ef7a',
    ocean: '#79b9ef',
    plum: '#b89df2',
    paper: '#f5f1e8',
    arcade: '#253858'
  };
  const bg = backgroundColors[activeAvatar.background] ?? backgroundColors.mint;

  function renderHair() {
    switch (activeAvatar.hair) {
      case 'bow':
        return <image href={bowHairImage} x="34" y="0" width="52" height="38" preserveAspectRatio="xMidYMid meet" />;
      case 'elvis':
        return <image href={elvisHairImage} x="29" y="2" width="62" height="44" preserveAspectRatio="xMidYMid meet" />;
      case 'brown-hair':
        return <image href={brownHairImage} x="29" y="-1" width="62" height="46" preserveAspectRatio="xMidYMid meet" />;
      case 'orange-hair':
        return <image href={orangeHairImage} x="-25" y="-10" width="170" height="128" preserveAspectRatio="xMidYMid meet" />;
      case 'cartoon-hair':
        return <image href={cartoonHairImage} x="26" y="-2" width="68" height="50" preserveAspectRatio="xMidYMid meet" />;
      case 'bob':
        return <path d="M36 34c2-20 46-21 49 0v24H36Z" fill="#17314f" />;
        case 'curly':
            return (
                <g transform="translate(60 -2) scale(0.9 1) translate(-60 0)">
                    <path d="M35 35c2-18 48-18 50 0-7-4-10 5-16 0-5-5-11 5-17 0-7-5-10 4-17 0Z" fill="#17314f" />
                </g>
            );
        case 'swoop':
            return (
                <g transform="translate(60 -0) scale(0.8 1) translate(-60 0)">
                    <path d="M32 36c7-24 50-20 57-3-24-2-31 10-57 3Z" fill="#17314f" />
                </g>
            );

      case 'spikes':
        return <path d="M35 37 41 17l8 18 10-22 9 22 10-18 8 20Z" fill="#17314f" />;
      case 'mohawk':
        return <path d="M54 32 60 10l6 22Z" fill="#ff8fc4" stroke="#17314f" strokeWidth="5" strokeLinejoin="round" />;
      case 'none':
        return null;
      default:
            return (
                <g transform="translate(0 -5)">
                    <path d="M35 35c5-17 46-17 50 0v8H35Z" fill="#17314f" />
                </g> );
    }
  }

  function renderFace() {
    const eyes = activeAvatar.eyes === 'anime'
      ? <image href={animeEyesImage} x="42" y="40" width="38" height="22" preserveAspectRatio="xMidYMid meet" />
      : activeAvatar.eyes === 'surprised'
        ? <image href={surprisedEyesImage} x="43" y="42" width="36" height="20" preserveAspectRatio="xMidYMid meet" />
      : activeAvatar.eyes === 'calm'
      ? (
          <>
            <path d="M48 50h8" stroke="#17314f" strokeWidth="3" strokeLinecap="round" />
            <path d="M65 50h8" stroke="#17314f" strokeWidth="3" strokeLinecap="round" />
          </>
        )
      : activeAvatar.eyes === 'wink'
        ? (
            <>
              <circle cx="52" cy="50" r="3" fill="#17314f" />
              <path d="M66 50h9" stroke="#17314f" strokeWidth="3" strokeLinecap="round" />
            </>
          )
        : activeAvatar.eyes === 'spark'
          ? (
              <>
                <path d="M51 45 54 50l-5 3-3-5Z" fill="#17314f" />
                <path d="M69 45 74 48l-3 5-5-3Z" fill="#17314f" />
              </>
            )
          : (
              <>
                <circle cx="52" cy="50" r="3" fill="#17314f" />
                <circle cx="70" cy="50" r="3" fill="#17314f" />
              </>
            );

    const mouth = activeAvatar.mouth === 'teeth'
      ? <image href={teethMouthImage} x="51" y="60" width="24" height="12" preserveAspectRatio="xMidYMid meet" />
      : activeAvatar.mouth === 'lips'
        ? <image href={lipsMouthImage} x="50" y="59" width="26" height="12" preserveAspectRatio="xMidYMid meet" />
      : activeAvatar.mouth === 'wide-smile'
        ? <image href={smileMouthImage} x="50" y="59" width="28" height="14" preserveAspectRatio="xMidYMid meet" />
      : activeAvatar.mouth === 'small-smile'
        ? <image href={smallSmileMouthImage} x="54" y="60" width="18" height="10" preserveAspectRatio="xMidYMid meet" />
      : activeAvatar.mouth === 'flat'
      ? <path d="M54 65h16" stroke="#17314f" strokeWidth="3" strokeLinecap="round" />
      : activeAvatar.mouth === 'smirk'
        ? <path d="M53 63c8 7 17 4 22-2" stroke="#17314f" strokeWidth="3" strokeLinecap="round" fill="none" />
        : activeAvatar.mouth === 'open'
          ? <ellipse cx="63" cy="65" rx="6" ry="4" fill="#17314f" />
        : <path d="M53 62c6 8 19 8 25 0" stroke="#17314f" strokeWidth="3" strokeLinecap="round" fill="none" />;

    const nose = activeAvatar.nose === 'button'
      ? <circle cx="61" cy="57" r="2" fill="rgba(23,49,79,0.34)" />
      : activeAvatar.nose === 'sharp'
        ? <path d="M62 53 58 61h6" stroke="rgba(23,49,79,0.34)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        : activeAvatar.nose === 'none'
          ? null
          : <path d="M61 54c-2 3-2 5 1 7" stroke="rgba(23,49,79,0.28)" strokeWidth="2" strokeLinecap="round" fill="none" />;

    return (
      <>
        {eyes}
        {nose}
        {mouth}
      </>
    );
  }

  function renderAccessory() {
    switch (activeAvatar.accessory) {
      case 'glasses':
        return <path d="M43 50h14m7 0h14M46 46h9v9h-9zm21 0h9v9h-9z" stroke="#17314f" strokeWidth="3" fill="none" strokeLinecap="round" />;
      case 'visor':
        return <path d="M40 45h40v11H40Z" fill="rgba(37, 56, 88, 0.72)" />;
      case 'headphones':
        return <path d="M38 54v-9c0-23 44-23 44 0v9M34 52h8v18h-8zm44 0h8v18h-8z" stroke="#17314f" strokeWidth="5" fill="#ffd35a" strokeLinejoin="round" />;
      case 'cap':
        return <path d="M36 33c8-18 40-18 48 0H36Zm43 0h16" stroke="#17314f" strokeWidth="5" fill="#ff8fc4" strokeLinecap="round" strokeLinejoin="round" />;
      case 'top-hat':
        return <image href={topHatImage} x="34" y="1" width="52" height="46" preserveAspectRatio="xMidYMid meet" />;
      case 'wizard-hat':
        return <image href={wizardHatImage} x="-8" y="-30" width="135" height="96"  />;
      case 'crown':
        return <path d="M42 30 50 15l10 14 10-14 8 15Z" fill="#ffd35a" stroke="#17314f" strokeWidth="4" strokeLinejoin="round" />;
      case 'star':
        return <path d="m84 23 4 8 9 1-7 6 2 9-8-4-8 4 2-9-7-6 9-1Z" fill="#ffd35a" stroke="#17314f" strokeWidth="3" strokeLinejoin="round" />;
      default:
        return null;
    }
  }

  function renderItem() {
    switch (activeAvatar.item) {
      case 'book':
        return <path d="M18 78h18c5 0 8 3 8 8v18H26c-5 0-8-3-8-8Zm58 0h18v18c0 5-3 8-8 8H68V86c0-5 3-8 8-8Z" fill="#ffffff" stroke="#17314f" strokeWidth="4" />;
      case 'bolt':
        return <path d="M89 72 76 94h12l-8 20 24-31H91l10-11Z" fill="#ffd35a" stroke="#17314f" strokeWidth="4" strokeLinejoin="round" />;
      case 'gem':
        return <path d="M88 78 104 91 90 110 76 91Z" fill="#79e2c9" stroke="#17314f" strokeWidth="4" strokeLinejoin="round" />;
      case 'trophy':
        return <path d="M82 78h23v10c0 10-6 17-15 18v7h9v5H87v-12c-9-1-15-8-15-18V78h10Z" fill="#ffd35a" stroke="#17314f" strokeWidth="4" strokeLinejoin="round" />;
      default:
        return null;
    }
  }

  return (
    <span
      className="local-avatar"
      aria-label={`${label} avatar`}
      role="img"
    >
      <svg aria-hidden="true" viewBox="0 0 120 120">
        <rect width="120" height="120" rx="16" fill={bg} />
        <image href={emptyAvatarImage} x="0" y="0" width="120" height="120" preserveAspectRatio="xMidYMid slice" />
        {renderHair()}
        {renderFace()}
        {renderAccessory()}
        {renderItem()}
      </svg>
    </span>
  );
}

function App() {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({
    email: '',
    password: '',
    displayName: ''
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [authLoading, setAuthLoading] = useState(false);
  const [authMessage, setAuthMessage] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [recentSessions, setRecentSessions] = useState<SessionSummary[]>([]);
  const [appView, setAppView] = useState<AppView>('setup');
  const [settingsForm, setSettingsForm] = useState({
    displayName: '',
    avatar: defaultAvatar
  });
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState('');
  const [sessionSaved, setSessionSaved] = useState(false);
  const [setup, setSetup] = useState<GameSetup>({
    username: '',
    categories: 'history, geography, science',
    difficulty: 'Medium',
    duration: 'Short Version'
  });
  const [game, setGame] = useState<GameSetup | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [preloadedQuestion, setPreloadedQuestion] = useState<Question | null>(null);
  const [previousQuestions, setPreviousQuestions] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [hiddenAnswers, setHiddenAnswers] = useState<number[]>([]);
  const [usedHelpers, setUsedHelpers] = useState<UsedHelpers>({
    fiftyFifty: false,
    revealAnswer: false,
    hint: false
  });
  const [showTip, setShowTip] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [answered, setAnswered] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [preloading, setPreloading] = useState(false);
  const [error, setError] = useState('');
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const openAiPreviousResponseIdRef = useRef<string | undefined>(undefined);

  const totalQuestions = game ? durationToQuestions[game.duration] : durationToQuestions[setup.duration];
  const progress = Math.min(answered, totalQuestions);
  const progressPercent = totalQuestions > 0 ? (progress / totalQuestions) * 100 : 0;
  const categoryTags = (game?.categories ?? setup.categories)
    .split(',')
    .map((category) => category.trim())
    .filter(Boolean)
    .slice(0, 6);
  const correctIndex = useMemo(
    () => question?.answers.findIndex((answer) => answer.isCorrect) ?? -1,
    [question]
  );

  useEffect(() => {
    if (!auth) {
      return;
    }

    return onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setAuthReady(true);
      setAuthMessage('');

      if (!user) {
        setProfile(null);
        setLeaderboard([]);
        setRecentSessions([]);
        setAppView('setup');
        openAiPreviousResponseIdRef.current = undefined;
        return;
      }

      await loadUserData(user);
    });
  }, []);

  async function loadUserData(user = currentUser) {
    if (!user) {
      return;
    }

    setProfileLoading(true);

    try {
      const [loadedProfile, loadedLeaderboard, loadedSessions] = await Promise.all([
        getUserProfile(user),
        getLeaderboard(),
        getRecentSessions(user)
      ]);

      setProfile(loadedProfile);
      openAiPreviousResponseIdRef.current = loadedProfile.openAiPreviousResponseId;
      setLeaderboard(loadedLeaderboard);
      setRecentSessions(loadedSessions);
      setScore(loadedProfile.score);
      setLevel(loadedProfile.level);
      setSetup((current) => ({
        ...current,
        username: loadedProfile.displayName
      }));
      setSettingsForm({
        displayName: loadedProfile.displayName,
        avatar: loadedProfile.avatar
      });
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Could not load Firebase data.');
    } finally {
      setProfileLoading(false);
    }
  }

  function resetQuestionUi() {
    setSelectedAnswer(null);
    setHiddenAnswers([]);
    setShowTip(false);
    setSubmitted(false);
  }

  async function requestQuestion(activeSetup: GameSetup, history = previousQuestions) {
    const response = await fetch('/api/trivia/question', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories: activeSetup.categories,
        difficulty: activeSetup.difficulty,
        previousQuestions: history,
        openAiPreviousResponseId: openAiPreviousResponseIdRef.current
      })
    });

    if (!response.ok) {
      const problem = await response.text();
      throw new Error(problem || 'Could not generate a question.');
    }

    const nextQuestion = (await response.json()) as Question;

    if (nextQuestion.openAiPreviousResponseId && currentUser) {
      openAiPreviousResponseIdRef.current = nextQuestion.openAiPreviousResponseId;
      await saveOpenAiPreviousResponseId(currentUser, nextQuestion.openAiPreviousResponseId);
      setProfile((current) =>
        current
          ? {
              ...current,
              openAiPreviousResponseId: nextQuestion.openAiPreviousResponseId
            }
          : current
      );
    }

    return nextQuestion;
  }

  async function fetchQuestion(activeSetup: GameSetup, history = previousQuestions) {
    setLoading(true);
    setError('');
    resetQuestionUi();

    try {
      const nextQuestion = await requestQuestion(activeSetup, history);
      const nextHistory = [nextQuestion.questionName, ...history].slice(0, 10);
      setQuestion(nextQuestion);
      setPreviousQuestions(nextHistory);
      preloadQuestion(activeSetup, nextHistory);
    } catch (err) {
      setQuestion(null);
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  async function preloadQuestion(activeSetup: GameSetup, history: string[]) {
    setPreloadedQuestion(null);
    setPreloading(true);

    try {
      const nextQuestion = await requestQuestion(activeSetup, history);
      setPreloadedQuestion(nextQuestion);
    } catch {
      setPreloadedQuestion(null);
    } finally {
      setPreloading(false);
    }
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthMessage('');

    try {
      if (authMode === 'register') {
        await registerWithEmail(authForm.email, authForm.password, authForm.displayName);
      } else {
        await loginWithEmail(authForm.email, authForm.password);
      }
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handlePasswordReset() {
    if (!authForm.email.trim()) {
      setAuthMessage('Enter your email first.');
      return;
    }

    setAuthLoading(true);
    setAuthMessage('');

    try {
      await resetPassword(authForm.email);
      setAuthMessage('Password reset email sent.');
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Could not send password reset email.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSettingsSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!currentUser) {
      return;
    }

    setSettingsSaving(true);
    setSettingsMessage('');

    try {
      const lockedSelections = getLockedAvatarSelections(settingsForm.avatar);

      if (lockedSelections.length > 0) {
        setSettingsMessage(`Reach level ${lockedSelections[0].option.minLevel} to save ${lockedSelections[0].option.label}.`);
        return;
      }

      const updatedProfile = await updateUserProfileSettings(
        currentUser,
        settingsForm.displayName,
        settingsForm.avatar
      );

      setSettingsForm((current) => ({
        ...current,
        avatar: updatedProfile.avatar
      }));
      setProfile((current) =>
        current
          ? {
              ...current,
              displayName: updatedProfile.displayName,
              avatar: updatedProfile.avatar
            }
          : current
      );
      setSetup((current) => ({
        ...current,
        username: updatedProfile.displayName
      }));
      setLeaderboard(await getLeaderboard());
      setSettingsMessage('Account settings saved.');
    } catch (err) {
      setSettingsMessage(err instanceof Error ? err.message : 'Could not save account settings.');
    } finally {
      setSettingsSaving(false);
    }
  }

  function updateAvatarPart(part: AvatarPart, value: string) {
    setSettingsForm((current) => ({
      ...current,
      avatar: {
        ...current.avatar,
        [part]: value
      }
    }));
  }

  function canUseAvatarOption(option: AvatarOption) {
    return (profile?.level ?? 1) >= (option.minLevel ?? 1);
  }

  function getAvatarOption(part: AvatarPart, value: string) {
    return avatarOptions[part].find((option) => option.id === value) ?? avatarOptions[part][0];
  }

  function getLockedAvatarSelections(avatar: AvatarConfig) {
    return avatarParts
      .map((part) => ({
        part,
        option: getAvatarOption(part.id, avatar[part.id])
      }))
      .filter((selection) => !canUseAvatarOption(selection.option));
  }

  function cycleAvatarPart(part: AvatarPart, direction: -1 | 1) {
    const unlockedOptions = avatarOptions[part];

    if (unlockedOptions.length === 0) {
      return;
    }

    const currentValue = settingsForm.avatar[part];
    const currentIndex = Math.max(0, unlockedOptions.findIndex((option) => option.id === currentValue));
    const nextIndex = (currentIndex + direction + unlockedOptions.length) % unlockedOptions.length;
    updateAvatarPart(part, unlockedOptions[nextIndex].id);
  }

  async function handleLogout() {
    await logout();
    setGame(null);
    setQuestion(null);
    setPreloadedQuestion(null);
    setPreviousQuestions([]);
    openAiPreviousResponseIdRef.current = undefined;
    setProfile(null);
    setRecentSessions([]);
    setAppView('setup');
    setScore(0);
    setLevel(1);
    setAnswered(0);
    setCorrectAnswers(0);
    setSessionSaved(false);
  }

  async function finishQuiz() {
    if (!currentUser || !profile || !game || sessionSaved) {
      return;
    }

    setSaveStatus('Saving progress...');

    try {
      const platformScore = level * 100 + score;
      const nextProfile = await saveCompletedSession(currentUser, profile, {
        categories: game.categories,
        difficulty: game.difficulty,
        totalQuestions,
        answeredQuestions: answered,
        correctAnswers,
        level,
        score,
        platformScore
      });

      setProfile(nextProfile);
      setRecentSessions(await getRecentSessions(currentUser));
      setSessionSaved(true);
      setSaveStatus('Progress saved.');
      setLeaderboard(await getLeaderboard());
    } catch (err) {
      setSaveStatus(err instanceof Error ? err.message : 'Could not save progress.');
    }
  }

  function startGame() {
    const username = setup.username.trim() || randomNames[Math.floor(Math.random() * randomNames.length)];
    const activeSetup = { ...setup, username };
    const activeProfile = profile ? { ...profile, displayName: username } : null;
    setSetup(activeSetup);
    setAppView('setup');
    if (activeProfile) {
      setProfile(activeProfile);
    }
    setGame(activeSetup);
    setQuestion(null);
    setPreloadedQuestion(null);
    setPreviousQuestions([]);
    setUsedHelpers({ fiftyFifty: false, revealAnswer: false, hint: false });
    resetQuestionUi();
    setScore(0);
    setLevel(1);
    setAnswered(0);
    setCorrectAnswers(0);
    setSaveStatus('');
    setSessionSaved(false);
    if (activeProfile) {
      setScore(activeProfile.score);
      setLevel(activeProfile.level);
    }
    setShowQuitDialog(false);
    void fetchQuestion(activeSetup, []);
  }

  function quitQuiz() {
    setGame(null);
    setQuestion(null);
    setPreloadedQuestion(null);
    setPreviousQuestions([]);
    setUsedHelpers({ fiftyFifty: false, revealAnswer: false, hint: false });
    resetQuestionUi();
    setScore(profile?.score ?? 0);
    setLevel(profile?.level ?? 1);
    setAnswered(0);
    setCorrectAnswers(0);
    setError('');
    setSaveStatus('');
    setSessionSaved(false);
    setShowQuitDialog(false);
  }

  function chooseCombinedCategories() {
    const shuffled = [...combinedCategories].sort(() => Math.random() - 0.5);
    setSetup((current) => ({
      ...current,
      categories: shuffled.slice(0, 4).join(', ')
    }));
  }

  function formatDate(date?: Date) {
    if (!date) {
      return 'No sessions yet';
    }

    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  function getProfileAccuracy() {
    if (!profile || profile.totalAnsweredQuestions <= 0) {
      return 0;
    }

    return Math.round((profile.totalCorrectAnswers / profile.totalAnsweredQuestions) * 100);
  }

  function renderHotbar() {
    return (
      <nav className="hotbar" aria-label="Player navigation">
        <div className="hotbar-player">
          <LocalAvatar avatar={profile?.avatar} label={profile?.displayName ?? currentUser?.email ?? 'Player'} />
          <div>
            <p className="eyebrow">Player</p>
            <strong>{profile?.displayName ?? currentUser?.email}</strong>
          </div>
        </div>

        <div className="hotbar-stats">
          <span>Level {profile?.level ?? 1}</span>
          <span>Best score {profile?.bestPlatformScore ?? 0}</span>
          <span>{profile?.currentStreak ?? 0} day streak</span>
          <span>{profile?.gamesPlayed ?? 0} games</span>
        </div>

        <div className="hotbar-actions">
          <button
            className={appView === 'setup' ? 'compact' : 'secondary compact'}
            type="button"
            onClick={() => setAppView('setup')}
          >
            Play
          </button>
          <button
            className={appView === 'dashboard' ? 'compact' : 'secondary compact'}
            type="button"
            onClick={() => setAppView('dashboard')}
          >
            Dashboard
          </button>
          <button
            className={appView === 'settings' ? 'compact' : 'secondary compact'}
            type="button"
            onClick={() => setAppView('settings')}
          >
            Account
          </button>
          <button className="secondary compact" type="button" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </nav>
    );
  }

  function renderSiteHeader() {
    return (
      <header className="site-header">
        <a className="site-brand" href="#top" aria-label="TrivAI home">
          <span className="brand-mark">T</span>
          <span>TrivAI</span>
        </a>
        <nav className="site-nav" aria-label="Site navigation">
          <a href="#play">Play</a>
          <a href="#features">Features</a>
          <a href="#leaderboard">Leaderboard</a>
        </nav>
      </header>
    );
  }

  function submitAnswer() {
    if (!question || selectedAnswer === null) {
      setError('Choose an answer before submitting.');
      return;
    }

    setError('');
    setSubmitted(true);
    setAnswered((value) => value + 1);

    if (question.answers[selectedAnswer].isCorrect) {
      setCorrectAnswers((value) => value + 1);
      setScore((value) => {
        const nextScore = value + 100;
        if (nextScore >= level * 150) {
          setLevel((current) => current + 1);
          return 0;
        }
        return nextScore;
      });
    }
  }

  async function nextQuestion() {
    if (!game) {
      return;
    }

    if (answered >= totalQuestions) {
      await finishQuiz();
      setQuestion(null);
      return;
    }

    if (preloadedQuestion) {
      const readyQuestion = preloadedQuestion;
      const nextHistory = [readyQuestion.questionName, ...previousQuestions].slice(0, 10);
      setPreloadedQuestion(null);
      setQuestion(readyQuestion);
      setPreviousQuestions(nextHistory);
      resetQuestionUi();
      preloadQuestion(game, nextHistory);
      return;
    }

    void fetchQuestion(game);
  }

  function useFiftyFifty() {
    if (!question) {
      return;
    }

    const wrongIndexes = question.answers
      .map((answer, index) => ({ answer, index }))
      .filter((item) => !item.answer.isCorrect)
      .map((item) => item.index)
      .sort(() => Math.random() - 0.5);

    setUsedHelpers((helpers) => ({ ...helpers, fiftyFifty: true }));
    setHiddenAnswers(wrongIndexes.slice(0, 2));
  }

  function showCorrectAnswer() {
    if (!question) {
      return;
    }

    setUsedHelpers((helpers) => ({ ...helpers, revealAnswer: true }));
    setHiddenAnswers(question.answers.map((_, index) => index).filter((index) => index !== correctIndex));
  }

  if (!isFirebaseConfigured) {
    return (
      <main className="site-shell" id="top">
        {renderSiteHeader()}
        <section className="site-hero single-hero">
          <div className="hero-copy-block">
            <p className="eyebrow">Firebase setup</p>
            <h1>Connect Firebase before playing.</h1>
            <p className="hero-copy">
              Create a Firebase web app, enable Email/Password Authentication and Cloud Firestore, then fill the
              `VITE_FIREBASE_*` values in `TrivAi.Client/.env`.
            </p>
          </div>
          <figure className="hero-visual">
            <img src={heroImage} alt="" />
          </figure>
        </section>
      </main>
    );
  }

  if (!authReady || profileLoading) {
    return (
      <main className="app-shell setup-shell">
        <section className="panel auth-panel centered">
          <div className="loader" />
          <p>Loading your player profile...</p>
        </section>
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="site-shell" id="top">
        {renderSiteHeader()}
        <section className="site-hero" id="play">
          <div className="hero-copy-block">
            <p className="eyebrow">TrivAI Web</p>
            <h1>TrivAI</h1>
            <p className="hero-copy">
              AI-generated trivia sessions with saved progress, player stats, and a public leaderboard.
            </p>
            <div className="hero-actions">
              <a className="hero-link primary-link" href="#play">Start playing</a>
              <a className="hero-link" href="#features">View features</a>
            </div>
            <div className="feature-strip" id="features">
              <span>AI questions</span>
              <span>Saved sessions</span>
              <span>Player dashboard</span>
            </div>
          </div>

          <figure className="hero-visual">
            <img src={heroImage} alt="" />
          </figure>

          <form className="panel auth-panel" onSubmit={handleAuthSubmit}>
            <div className="brand-row">
              <div>
                <p className="eyebrow">{authMode === 'login' ? 'Welcome back' : 'Create account'}</p>
                <h2>{authMode === 'login' ? 'Login' : 'Register'}</h2>
              </div>
              <span className="badge">Firebase</span>
            </div>

            {authMode === 'register' && (
              <label>
                Display name
                <input
                  value={authForm.displayName}
                  onChange={(event) => setAuthForm({ ...authForm, displayName: event.target.value })}
                  placeholder="Nova"
                />
              </label>
            )}

            <label>
              Email
              <input
                autoComplete="email"
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })}
                placeholder="you@example.com"
                required
              />
            </label>

            <label>
              Password
              <input
                autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })}
                placeholder="Minimum 6 characters"
                required
              />
            </label>

            {authMessage && <p className="error">{authMessage}</p>}

            <button type="submit" disabled={authLoading}>
              {authLoading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Create account'}
            </button>

            <div className="auth-actions">
              <button
                className="secondary"
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthMessage('');
                }}
              >
                {authMode === 'login' ? 'Need an account?' : 'Already have an account?'}
              </button>
              {authMode === 'login' && (
                <button className="secondary" type="button" onClick={handlePasswordReset}>
                  Reset password
                </button>
              )}
            </div>
          </form>
        </section>

        <section className="site-band" id="leaderboard">
          <div>
            <p className="eyebrow">Live profile storage</p>
            <h2>Login keeps level, XP, streaks, sessions, and leaderboard entries connected.</h2>
          </div>
          <div className="site-metrics">
            <span>Firebase Auth</span>
            <span>Cloud Firestore</span>
            <span>OpenAI Responses</span>
          </div>
        </section>
      </main>
    );
  }

  if (!game && appView === 'settings') {
    const lockedAvatarSelections = getLockedAvatarSelections(settingsForm.avatar);

    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="settings-layout">
          <form className="panel settings-panel" onSubmit={handleSettingsSubmit}>
            <div>
              <p className="eyebrow">Account settings</p>
              <h1>Your profile</h1>
              <p className="muted">Update the player identity used across your dashboard and leaderboard.</p>
            </div>

            <div className="account-preview">
              <LocalAvatar avatar={settingsForm.avatar} label={settingsForm.displayName || 'Player'} />
              <div>
                <strong>{settingsForm.displayName || profile?.displayName || 'Player'}</strong>
                <span>{currentUser.email}</span>
              </div>
            </div>

            <label>
              Display name
              <input
                value={settingsForm.displayName}
                onChange={(event) => setSettingsForm({ ...settingsForm, displayName: event.target.value })}
                placeholder="Player name"
              />
            </label>

            <div className="avatar-creator" aria-label="Avatar creator">
              <div className="avatar-stage">
                <LocalAvatar avatar={settingsForm.avatar} label={settingsForm.displayName || 'Player'} />
              </div>

              <div className="avatar-control-list" aria-label="Avatar categories">
                {avatarParts.map((part) => (
                  <div className="avatar-control-row" key={part.id}>
                    <button
                      aria-label={`Previous ${part.label}`}
                      className="secondary avatar-icon-button"
                      title={`Previous ${part.label}`}
                      type="button"
                      onClick={() => cycleAvatarPart(part.id, -1)}
                    >
                      ‹
                    </button>
                    <div>
                      <p className="avatar-category-icon" aria-label={part.label} title={part.label}>
                        {part.icon}
                      </p>
                      <strong>{getAvatarOption(part.id, settingsForm.avatar[part.id]).label}</strong>
                      {getAvatarOption(part.id, settingsForm.avatar[part.id]).minLevel && (
                        <span>Level {getAvatarOption(part.id, settingsForm.avatar[part.id]).minLevel}</span>
                      )}
                    </div>
                    <button
                      aria-label={`Next ${part.label}`}
                      className="secondary avatar-icon-button"
                      title={`Next ${part.label}`}
                      type="button"
                      onClick={() => cycleAvatarPart(part.id, 1)}
                    >
                      ›
                    </button>
                  </div>
                ))}
                {lockedAvatarSelections.length > 0 && (
                  <p className="locked-preview">
                    Previewing locked gear. Unlock it before saving.
                  </p>
                )}
              </div>
            </div>

            {settingsMessage && (
              <p className={settingsMessage === 'Account settings saved.' ? 'success' : 'error'}>{settingsMessage}</p>
            )}

            <div className="form-actions">
              <button type="submit" disabled={settingsSaving || lockedAvatarSelections.length > 0}>
                {settingsSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button className="secondary" type="button" onClick={() => setAppView('setup')}>
                Back to play
              </button>
            </div>
          </form>

          <section className="panel settings-panel">
            <div>
              <p className="eyebrow">Profile summary</p>
              <h2>Saved progress</h2>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-stat">
                <p className="eyebrow">Level</p>
                <strong>{profile?.level ?? 1}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Best score</p>
                <strong>{profile?.bestPlatformScore ?? 0}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Streak</p>
                <strong>{profile?.currentStreak ?? 0} days</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Accuracy</p>
                <strong>{getProfileAccuracy()}%</strong>
              </div>
            </div>
            <div className="account-note">
              <p className="muted">
                Avatars are saved as small profile settings in Firestore. No image uploads or Firebase Storage bucket are needed.
              </p>
            </div>
          </section>
        </section>
      </main>
    );
  }

  if (!game && appView === 'dashboard') {
    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="dashboard-layout">
          <div className="panel dashboard-panel">
            <div>
              <p className="eyebrow">Dashboard</p>
              <h1>Your stats</h1>
            </div>

            <div className="dashboard-grid">
              <div className="dashboard-stat">
                <p className="eyebrow">Level</p>
                <strong>{profile?.level ?? 1}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Current XP</p>
                <strong>{profile?.score ?? 0}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Best score</p>
                <strong>{profile?.bestPlatformScore ?? 0}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Games played</p>
                <strong>{profile?.gamesPlayed ?? 0}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Current streak</p>
                <strong>{profile?.currentStreak ?? 0} days</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Best streak</p>
                <strong>{profile?.bestStreak ?? 0} days</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Accuracy</p>
                <strong>{getProfileAccuracy()}%</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Best quiz</p>
                <strong>{profile?.bestAccuracy ?? 0}%</strong>
              </div>
            </div>

            <div className="dashboard-row">
              <div>
                <p className="eyebrow">Correct answers</p>
                <strong>{profile?.totalCorrectAnswers ?? 0}/{profile?.totalAnsweredQuestions ?? 0}</strong>
              </div>
              <div>
                <p className="eyebrow">Last played</p>
                <strong>{formatDate(profile?.lastPlayedAt)}</strong>
              </div>
            </div>
          </div>

          <section className="panel dashboard-panel">
            <div className="brand-row">
              <div>
                <p className="eyebrow">History</p>
                <h2>Recent sessions</h2>
              </div>
              <button className="secondary compact" type="button" onClick={() => void loadUserData()}>
                Refresh
              </button>
            </div>

            {recentSessions.length === 0 ? (
              <p className="muted">No completed sessions yet.</p>
            ) : (
              <ol className="session-list">
                {recentSessions.map((session) => {
                  const accuracy = session.answeredQuestions > 0
                    ? Math.round((session.correctAnswers / session.answeredQuestions) * 100)
                    : 0;

                  return (
                    <li key={session.id}>
                      <div>
                        <strong>{session.difficulty} quiz</strong>
                        <span>{session.categories}</span>
                      </div>
                      <div>
                        <strong>{accuracy}%</strong>
                        <span>{session.correctAnswers}/{session.answeredQuestions} correct</span>
                      </div>
                      <div>
                        <strong>{session.platformScore}</strong>
                        <span>{formatDate(session.completedAt)}</span>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </section>
      </main>
    );
  }

  if (!game) {
    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="site-hero signed-in-hero">
          <div className="hero-copy-block">
            <p className="eyebrow">Ready to play</p>
            <h1>Build a fresh quiz in seconds.</h1>
            <p className="hero-copy">
              Pick a topic mix, choose the pace, and start a generated trivia session from your saved profile.
            </p>
          </div>
          <figure className="hero-visual">
            <img src={heroImage} alt="" />
          </figure>
        </section>
        <section className="setup-layout">
          <div className="panel setup-panel">
            <div className="brand-row">
              <div>
                <p className="eyebrow">Game setup</p>
                <h2>New quiz</h2>
              </div>
              <button className="secondary compact" type="button" onClick={() => setAppView('settings')}>
                Account
              </button>
            </div>

            <div className="profile-card">
              <div>
                <p className="eyebrow">Signed in as</p>
                <strong>{profile?.displayName ?? currentUser.email}</strong>
              </div>
              <div>
                <p className="eyebrow">Saved level</p>
                <strong>{profile?.level ?? 1}</strong>
              </div>
              <div>
                <p className="eyebrow">Saved XP</p>
                <strong>{profile?.score ?? 0}</strong>
              </div>
            </div>
            <div className="feature-strip">
              <span>AI questions</span>
              <span>One-use helpers</span>
              <span>Fast preloading</span>
            </div>

            <label>
              Name
              <input
                value={setup.username}
                onChange={(event) => setSetup({ ...setup, username: event.target.value })}
                placeholder="Optional"
              />
            </label>

            <label>
              Categories
              <textarea
                value={setup.categories}
                onChange={(event) => setSetup({ ...setup, categories: event.target.value })}
                rows={3}
              />
            </label>

            <button className="secondary" type="button" onClick={chooseCombinedCategories}>
              Pick combined categories
            </button>

            <div className="grid-two">
              <label>
                Difficulty
                <select
                  value={setup.difficulty}
                  onChange={(event) => setSetup({ ...setup, difficulty: event.target.value as Difficulty })}
                >
                  <option>Easy</option>
                  <option>Medium</option>
                  <option>Hard</option>
                </select>
              </label>

              <label>
                Duration
                <select
                  value={setup.duration}
                  onChange={(event) => setSetup({ ...setup, duration: event.target.value as Duration })}
                >
                  <option>Short Version</option>
                  <option>Medium Version</option>
                  <option>Long Version</option>
                </select>
              </label>
            </div>

            <div className="setup-summary">
              <span>{durationToQuestions[setup.duration]} questions</span>
              <span>{setup.difficulty}</span>
            </div>

            <button type="button" onClick={startGame}>
              Start game
            </button>
          </div>

          <aside className="panel leaderboard-panel setup-leaderboard">
            <div className="brand-row">
              <div>
                <p className="eyebrow">Top players</p>
                <h2>Leaderboard</h2>
              </div>
              <button className="secondary compact" type="button" onClick={() => void loadUserData()}>
                Refresh
              </button>
            </div>
            {leaderboard.length === 0 ? (
              <p className="muted">No leaderboard entries yet.</p>
            ) : (
              <ol className="leaderboard-list">
                {leaderboard.map((entry, index) => (
                  <li className={entry.uid === currentUser.uid ? 'current-player' : ''} key={entry.uid}>
                    <span className="rank">{index + 1}</span>
                    <span>{entry.displayName}</span>
                    <strong>{entry.platformScore}</strong>
                  </li>
                ))}
              </ol>
            )}
          </aside>
        </section>
      </main>
    );
  }

  const gameFinished = answered >= totalQuestions && !question;

  return (
    <main className="app-shell quiz-shell">
      <section className="quiz-header">
        <div>
          <p className="eyebrow">TrivAI Web</p>
          <h1>Quiz session</h1>
        </div>
        <button className="secondary compact" type="button" onClick={() => setShowQuitDialog(true)}>
          Quit quiz
        </button>
      </section>

      <section className="topbar">
        <div className="stat-card">
          <p className="eyebrow">Player</p>
          <strong>{game.username}</strong>
        </div>
        <div className="stat-card">
          <p className="eyebrow">XP Score</p>
          <strong>{score}</strong>
        </div>
        <div className="stat-card">
          <p className="eyebrow">Level</p>
          <strong>{level}</strong>
        </div>
        <div className="stat-card">
          <p className="eyebrow">Questions</p>
          <strong>
            {progress}/{totalQuestions}
          </strong>
        </div>
      </section>

      <div className="progress-track" aria-label="Quiz progress">
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <section className="panel quiz-panel">
        <div className="category-tags">
          {categoryTags.map((category) => (
            <span key={category}>{category}</span>
          ))}
        </div>

        {gameFinished ? (
          <div className="centered">
            <div>
              <p className="eyebrow">Game over</p>
              <h1>Session complete</h1>
            </div>
            <p>You reached level {level} with {score} XP left on the current level.</p>
            {saveStatus && <p className={saveStatus === 'Progress saved.' ? 'success' : 'muted'}>{saveStatus}</p>}
            <button type="button" onClick={() => setGame(null)}>
              Back to setup
            </button>
          </div>
        ) : loading ? (
          <div className="centered">
            <div className="loader" />
            <p>Generating a new question...</p>
          </div>
        ) : question ? (
          <>
            <h1 className="question-title">{question.questionName}</h1>

            <div className="answers">
              {question.answers.map((answer, index) => {
                const isHidden = hiddenAnswers.includes(index);
                const isSelected = selectedAnswer === index;
                const stateClass = submitted
                  ? answer.isCorrect
                    ? 'correct'
                    : isSelected
                      ? 'wrong'
                      : ''
                  : isSelected
                    ? 'selected'
                    : '';

                return (
                  <button
                    className={`answer ${stateClass}`}
                    disabled={submitted || isHidden}
                    key={answer.text}
                    type="button"
                    onClick={() => setSelectedAnswer(index)}
                  >
                    {isHidden ? 'Answer hidden' : answer.text}
                  </button>
                );
              })}
            </div>

            {showTip && <p className="tip">{question.tipForAnsweringQuestion}</p>}
            {error && <p className="error">{error}</p>}

            <div className="actions">
              <button className="secondary" disabled={submitted || usedHelpers.fiftyFifty || hiddenAnswers.length > 0} onClick={useFiftyFifty}>
                50/50
              </button>
              <button className="secondary" disabled={submitted || usedHelpers.revealAnswer || hiddenAnswers.length > 0} onClick={showCorrectAnswer}>
                Reveal answer
              </button>
              <button
                className="secondary"
                disabled={submitted || usedHelpers.hint || showTip}
                onClick={() => {
                  setUsedHelpers((helpers) => ({ ...helpers, hint: true }));
                  setShowTip(true);
                }}
              >
                Hint
              </button>
              {submitted ? (
                <button type="button" disabled={preloading && !preloadedQuestion} onClick={nextQuestion}>
                  {preloadedQuestion ? 'Next' : preloading ? 'Next is loading...' : 'Next'}
                </button>
              ) : (
                <button type="button" onClick={submitAnswer}>
                  Submit
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="centered">
            {error && <p className="error">{error}</p>}
            <button type="button" onClick={() => void fetchQuestion(game)}>
              Try again
            </button>
            <button className="secondary" type="button" onClick={() => setGame(null)}>
              Back to setup
            </button>
          </div>
        )}
      </section>

      {showQuitDialog && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" role="dialog" aria-modal="true" aria-labelledby="quit-title">
            <h2 id="quit-title">Are you sure?</h2>
            <p>You will lose all points from this quiz session.</p>
            <div className="modal-actions">
              <button className="secondary" type="button" onClick={() => setShowQuitDialog(false)}>
                Keep playing
              </button>
              <button className="danger" type="button" onClick={quitQuiz}>
                Quit quiz
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
