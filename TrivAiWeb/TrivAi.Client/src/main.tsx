import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { onAuthStateChanged, type User } from 'firebase/auth';
import 'animate.css';
import categoriesText from './categories.txt?raw';
import {
  auth,
  canClaimDailyReward,
  checkPublishedTestAnswer,
  claimDailyReward,
  dailyRewardPoints,
  deleteCustomTest,
  getLeaderboard,
  getCustomTestDrafts,
  getPublishedTests,
  getRecentSessions,
  getUserProfile,
  isFirebaseConfigured,
  loginWithEmail,
  logout,
  registerWithEmail,
  resetPassword,
  saveCompletedSession,
  saveCustomTestDraft,
  saveOpenAiPreviousResponseId,
  updateUserProfileSettings,
  defaultAvatar,
  type AvatarConfig,
  type CustomTestDraft,
  type CustomTestQuestion,
  type PublishedTest,
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
import { BrainAnimation } from './components/ui/brain-animation';
import { ConfettiAnimation } from './components/ui/confetti-animation';
import { ConnectionErrorPage } from './components/ui/connection-error-page';
import { InteractiveRobotSpline } from './components/ui/interactive-3d-robot';
import { QuizLoadingAnimation } from './components/ui/quiz-loading-animation';
import { TrivAiDock } from './components/ui/trivai-dock';
import { WinnerAnimation } from './components/ui/winner-animation';
import './styles.css';

const robotSceneUrl = 'https://prod.spline.design/PyzDhpQ9E5f1E3MT/scene.splinecode';

type Difficulty = 'Easy' | 'Medium' | 'Hard';
type Duration = 'Custom' | 'Short Version' | 'Medium Version' | 'Long Version';

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
  questionCount: number;
};

type UsedHelpers = {
  fiftyFifty: boolean;
  revealAnswer: boolean;
  hint: boolean;
};

type AuthMode = 'login' | 'register';
type AppView = 'setup' | 'custom-test' | 'upload-test' | 'my-tests' | 'user-tests' | 'dashboard' | 'settings';
type ConnectionIssue = {
  service: 'Firebase' | 'OpenAI';
  message: string;
};

type AvatarOption = {
  id: string;
  label: string;
  minLevel?: number;
};

type AvatarPart = Exclude<
  keyof AvatarConfig,
  | 'style'
  | 'seed'
  | 'gender'
  | 'backgroundColor'
  | 'top'
  | 'hairStyle'
  | 'headwear'
  | 'eyesVariant'
  | 'eyebrows'
  | 'mouthVariant'
  | 'accessoriesVariant'
  | 'clothing'
  | 'clothingGraphic'
  | 'clothingColor'
  | 'hatColor'
  | 'accessoriesColor'
  | 'facialHair'
  | 'facialHairColor'
  | 'skinColor'
  | 'hairColor'
  | 'loreleiHair'
  | 'loreleiHead'
  | 'loreleiEyes'
  | 'loreleiEyebrows'
  | 'loreleiMouth'
  | 'loreleiNose'
  | 'loreleiGlasses'
  | 'loreleiEarrings'
  | 'loreleiBeard'
  | 'loreleiFreckles'
  | 'loreleiHairAccessories'
  | 'loreleiHairColor'
  | 'loreleiSkinColor'
  | 'loreleiFeatureColor'
  | 'notionistsHair'
  | 'notionistsClothes'
  | 'notionistsClothesGraphic'
  | 'notionistsEyes'
  | 'notionistsEyebrows'
  | 'notionistsMouth'
  | 'notionistsNose'
  | 'notionistsGlasses'
  | 'notionistsBeard'
  | 'notionistsGesture'
  | 'openPeepsHead'
  | 'openPeepsExpression'
  | 'openPeepsAccessories'
  | 'openPeepsFacialHair'
  | 'openPeepsMask'
  | 'openPeepsClothingColor'
  | 'openPeepsHeadContrastColor'
  | 'openPeepsSkinColor'
>;

const durationToQuestions: Record<Exclude<Duration, 'Custom'>, number> = {
  'Short Version': 10,
  'Medium Version': 20,
  'Long Version': 30
};

function getQuestionCount(setup: GameSetup) {
  return setup.duration === 'Custom' ? setup.questionCount : durationToQuestions[setup.duration];
}

const combinedCategories = [...new Set(
  categoriesText
    .split(/\r?\n/)
    .map((category) => category.trim())
    .filter(Boolean)
)];

const randomNames = ['Nova', 'RoboFan', 'Pixel', 'Astra', 'Quizzer'];

const diceBearStyles = [
  { id: 'avataaars', label: 'Classic Avatar', minLevel: 1 },
  { id: 'lorelei', label: 'Dreamer', minLevel: 15 },
  { id: 'open-peeps', label: 'Hand-Drawn', minLevel: 25 },
  { id: 'notionists', label: 'Notion Sketch', minLevel: 35 }
];

const diceBearPartOptions: {
  key: keyof Pick<AvatarConfig, 'hairStyle' | 'headwear' | 'eyesVariant' | 'eyebrows' | 'mouthVariant' | 'accessoriesVariant' | 'clothing' | 'clothingGraphic' | 'clothingColor' | 'hatColor' | 'accessoriesColor' | 'facialHair' | 'facialHairColor' | 'skinColor' | 'hairColor'>;
  label: string;
  values: { id: string; label: string; minLevel?: number }[];
}[] = [
  { key: 'hairStyle', label: 'Hair', values: [
    { id: 'none', label: 'None' },
    { id: 'shortFlat', label: 'Short Flat' }, { id: 'shortRound', label: 'Short Round' },
    { id: 'shortWaved', label: 'Short Waved' }, { id: 'longButNotTooLong', label: 'Long' },
    { id: 'bigHair', label: 'Big Hair', minLevel: 15 }, { id: 'bob', label: 'Bob' },
    { id: 'curly', label: 'Curly', minLevel: 8 }, { id: 'dreads', label: 'Dreads', minLevel: 20 }
  ] },
  { key: 'headwear', label: 'Headwear', values: [
    { id: 'none', label: 'None' }, { id: 'hat', label: 'Hat' },
    { id: 'hijab', label: 'Hijab' }, { id: 'turban', label: 'Turban' },
    { id: 'winterHat1', label: 'Winter Hat 1', minLevel: 6 }, { id: 'winterHat02', label: 'Winter Hat 2', minLevel: 10 },
    { id: 'winterHat03', label: 'Winter Hat 3', minLevel: 15 }, { id: 'winterHat04', label: 'Winter Hat 4', minLevel: 20 }
  ] },
  { key: 'eyesVariant', label: 'Eyes', values: [
    { id: 'default', label: 'Default' }, { id: 'happy', label: 'Happy' },
    { id: 'wink', label: 'Wink' }, { id: 'surprised', label: 'Surprised' },
    { id: 'hearts', label: 'Hearts', minLevel: 20 }, { id: 'squint', label: 'Squint', minLevel: 10 }
  ] },
  { key: 'eyebrows', label: 'Eyebrows', values: [
    { id: 'default', label: 'Default' }, { id: 'raisedExcited', label: 'Excited' },
    { id: 'sadConcerned', label: 'Concerned' }, { id: 'unibrowNatural', label: 'Natural' },
    { id: 'upDown', label: 'Up Down' }
  ] },
  { key: 'mouthVariant', label: 'Mouth', values: [
    { id: 'smile', label: 'Smile' }, { id: 'default', label: 'Default' },
    { id: 'twinkle', label: 'Twinkle', minLevel: 15 }, { id: 'serious', label: 'Serious' },
    { id: 'tongue', label: 'Tongue', minLevel: 10 }, { id: 'concerned', label: 'Concerned' }
  ] },
  { key: 'accessoriesVariant', label: 'Accessories', values: [
    { id: 'none', label: 'None' }, { id: 'prescription01', label: 'Glasses 1' },
    { id: 'prescription02', label: 'Glasses 2' }, { id: 'round', label: 'Round Glasses' },
    { id: 'sunglasses', label: 'Sunglasses', minLevel: 20 }, { id: 'wayfarers', label: 'Wayfarers', minLevel: 12 }
  ] },
  { key: 'clothing', label: 'Clothing', values: [
    { id: 'hoodie', label: 'Hoodie' }, { id: 'blazerAndShirt', label: 'Blazer' },
    { id: 'collarAndSweater', label: 'Sweater' }, { id: 'graphicShirt', label: 'Graphic Shirt' },
    { id: 'overall', label: 'Overall', minLevel: 8 }, { id: 'shirtCrewNeck', label: 'Crew Neck' }
  ] },
  { key: 'clothingGraphic', label: 'Shirt Graphic', values: [
    { id: 'bat', label: 'Bat' }, { id: 'bear', label: 'Bear' },
    { id: 'cumbia', label: 'Cumbia' }, { id: 'deer', label: 'Deer' },
    { id: 'diamond', label: 'Diamond' }, { id: 'hola', label: 'Hola' },
    { id: 'pizza', label: 'Pizza', minLevel: 8 }, { id: 'resist', label: 'Resist', minLevel: 15 },
    { id: 'skull', label: 'Skull', minLevel: 25 }, { id: 'skullOutline', label: 'Skull Outline', minLevel: 18 }
  ] },
  { key: 'clothingColor', label: 'Clothing Color', values: [
    { id: '262e33', label: 'Black' }, { id: '25557c', label: 'Blue' },
    { id: 'e6e6e6', label: 'White' }, { id: 'ff488e', label: 'Pink' },
    { id: 'ffafb9', label: 'Rose' }, { id: '65c9ff', label: 'Sky' }
  ] },
  { key: 'hatColor', label: 'Hat Color', values: [
    { id: '262e33', label: 'Black' }, { id: '25557c', label: 'Blue' },
    { id: 'e6e6e6', label: 'White' }, { id: 'ff488e', label: 'Pink' },
    { id: 'ffafb9', label: 'Rose' }, { id: '65c9ff', label: 'Sky' }
  ] },
  { key: 'accessoriesColor', label: 'Accessory Color', values: [
    { id: '262e33', label: 'Black' }, { id: '25557c', label: 'Blue' },
    { id: 'e6e6e6', label: 'White' }, { id: 'ff488e', label: 'Pink' },
    { id: 'ffafb9', label: 'Rose' }, { id: '65c9ff', label: 'Sky' }
  ] },
  { key: 'facialHair', label: 'Facial Hair', values: [
    { id: 'none', label: 'None' }, { id: 'beardLight', label: 'Light Beard' },
    { id: 'beardMedium', label: 'Medium Beard', minLevel: 8 }, { id: 'beardMajestic', label: 'Large Beard', minLevel: 18 },
    { id: 'moustacheFancy', label: 'Fancy Moustache', minLevel: 12 }, { id: 'moustacheMagnum', label: 'Magnum Moustache', minLevel: 22 }
  ] },
  { key: 'facialHairColor', label: 'Facial Hair Color', values: [
    { id: '2c1b18', label: 'Black' }, { id: '4a312c', label: 'Brown' },
    { id: 'a55728', label: 'Auburn' }, { id: 'b58143', label: 'Blonde' },
    { id: 'd6b370', label: 'Light Blonde' }, { id: '724133', label: 'Chestnut' }
  ] },
  { key: 'skinColor', label: 'Skin', values: [
    { id: 'ffdbb4', label: 'Light' }, { id: 'edb98a', label: 'Warm' },
    { id: 'd08b5b', label: 'Tan' }, { id: 'ae5d29', label: 'Brown' },
    { id: '614335', label: 'Deep' }
  ] },
  { key: 'hairColor', label: 'Hair Color', values: [
    { id: '2c1b18', label: 'Black' }, { id: '4a312c', label: 'Brown' },
    { id: 'a55728', label: 'Auburn' }, { id: 'b58143', label: 'Blonde' },
    { id: 'd6b370', label: 'Light Blonde' }, { id: '724133', label: 'Chestnut' }
  ] }
];

const dependentDiceBearParts = new Set([
  'clothingGraphic',
  'hatColor',
  'accessoriesColor',
  'facialHairColor'
]);

const orderedDiceBearPartOptions = [
  ...diceBearPartOptions.filter((part) => !dependentDiceBearParts.has(part.key)),
  ...diceBearPartOptions.filter((part) => dependentDiceBearParts.has(part.key))
];

type LoreleiPartKey = keyof Pick<
  AvatarConfig,
  | 'loreleiHair'
  | 'loreleiHead'
  | 'loreleiEyes'
  | 'loreleiEyebrows'
  | 'loreleiMouth'
  | 'loreleiNose'
  | 'loreleiGlasses'
  | 'loreleiEarrings'
  | 'loreleiBeard'
  | 'loreleiFreckles'
  | 'loreleiHairAccessories'
  | 'loreleiHairColor'
  | 'loreleiSkinColor'
  | 'loreleiFeatureColor'
>;

const numberedLoreleiOptions = (count: number, prefix = 'variant') =>
  Array.from({ length: count }, (_, index) => {
    const number = String(index + 1).padStart(2, '0');
    return { id: `${prefix}${number}`, label: `Style ${index + 1}` };
  });

const optionalLoreleiOptions = (count: number) => [
  { id: 'none', label: 'None' },
  ...numberedLoreleiOptions(count)
];

const loreleiColorOptions = [
  { id: '000000', label: 'Black' },
  { id: '2c1b18', label: 'Dark Brown' },
  { id: '4a312c', label: 'Brown' },
  { id: 'a55728', label: 'Auburn' },
  { id: 'b58143', label: 'Blonde' },
  { id: 'ff488e', label: 'Pink' },
  { id: '25557c', label: 'Blue' }
];

const loreleiSkinOptions = [
  { id: 'ffdbb4', label: 'Light' },
  { id: 'edb98a', label: 'Warm' },
  { id: 'd08b5b', label: 'Tan' },
  { id: 'ae5d29', label: 'Brown' },
  { id: '614335', label: 'Deep' }
];

const loreleiPartOptions: { key: LoreleiPartKey; label: string; values: AvatarOption[] }[] = [
  { key: 'loreleiHair', label: 'Hair', values: numberedLoreleiOptions(48) },
  { key: 'loreleiHead', label: 'Head shape', values: numberedLoreleiOptions(4) },
  { key: 'loreleiEyes', label: 'Eyes', values: numberedLoreleiOptions(24) },
  { key: 'loreleiEyebrows', label: 'Eyebrows', values: numberedLoreleiOptions(13) },
  {
    key: 'loreleiMouth',
    label: 'Mouth',
    values: [...numberedLoreleiOptions(18, 'happy'), ...numberedLoreleiOptions(9, 'sad')]
  },
  { key: 'loreleiNose', label: 'Nose', values: numberedLoreleiOptions(6) },
  { key: 'loreleiGlasses', label: 'Glasses', values: optionalLoreleiOptions(5) },
  { key: 'loreleiEarrings', label: 'Earrings', values: optionalLoreleiOptions(3) },
  { key: 'loreleiBeard', label: 'Beard', values: optionalLoreleiOptions(2) },
  { key: 'loreleiFreckles', label: 'Freckles', values: optionalLoreleiOptions(1) },
  {
    key: 'loreleiHairAccessories',
    label: 'Hair accessory',
    values: [{ id: 'none', label: 'None' }, { id: 'flowers', label: 'Flowers' }]
  },
  { key: 'loreleiHairColor', label: 'Hair color', values: loreleiColorOptions },
  { key: 'loreleiSkinColor', label: 'Skin color', values: loreleiSkinOptions },
  { key: 'loreleiFeatureColor', label: 'Feature color', values: loreleiColorOptions }
];

type OtherStylePartKey = keyof Pick<
  AvatarConfig,
  | 'notionistsHair'
  | 'notionistsClothes'
  | 'notionistsClothesGraphic'
  | 'notionistsEyes'
  | 'notionistsEyebrows'
  | 'notionistsMouth'
  | 'notionistsNose'
  | 'notionistsGlasses'
  | 'notionistsBeard'
  | 'notionistsGesture'
  | 'openPeepsHead'
  | 'openPeepsExpression'
  | 'openPeepsAccessories'
  | 'openPeepsFacialHair'
  | 'openPeepsMask'
  | 'openPeepsClothingColor'
  | 'openPeepsHeadContrastColor'
  | 'openPeepsSkinColor'
>;

type OtherStylePart = { key: OtherStylePartKey; label: string; values: AvatarOption[] };
const namedOptions = (values: string[]) => values.map((id) => ({
  id,
  label: id.replace(/([A-Z0-9])/g, ' $1').replace(/^./, (letter) => letter.toUpperCase())
}));
const optionalNamedOptions = (values: string[]) => [{ id: 'none', label: 'None' }, ...namedOptions(values)];
const openPeepsClothingColors: AvatarOption[] = [
  { id: '8fa7df', label: 'Blue' },
  { id: '78e185', label: 'Mint' },
  { id: 'ffcf77', label: 'Gold' },
  { id: 'e279c7', label: 'Purple' },
  { id: 'e78276', label: 'Coral' },
  { id: '9ddadb', label: 'Aqua' },
  { id: 'fdea6b', label: 'Yellow' }
];
const openPeepsHairColors: AvatarOption[] = [
  { id: '2c1b18', label: 'Black' },
  { id: 'e8e1e1', label: 'Silver' },
  { id: 'ecdcbf', label: 'Platinum' },
  { id: 'd6b370', label: 'Blonde' },
  { id: 'f59797', label: 'Pink' },
  { id: 'b58143', label: 'Golden Brown' },
  { id: 'a55728', label: 'Auburn' },
  { id: '724133', label: 'Chestnut' },
  { id: '4a312c', label: 'Dark Brown' },
  { id: 'c93305', label: 'Red' }
];

const notionistsPartOptions: OtherStylePart[] = [
  { key: 'notionistsHair', label: 'Hair', values: [{ id: 'hat', label: 'Hat' }, ...numberedLoreleiOptions(63)] },
  { key: 'notionistsClothes', label: 'Clothes', values: numberedLoreleiOptions(25) },
  { key: 'notionistsClothesGraphic', label: 'Clothes graphic', values: optionalNamedOptions(['electric', 'galaxy', 'saturn']) },
  { key: 'notionistsEyes', label: 'Eyes', values: numberedLoreleiOptions(5) },
  { key: 'notionistsEyebrows', label: 'Eyebrows', values: numberedLoreleiOptions(13) },
  { key: 'notionistsMouth', label: 'Mouth', values: numberedLoreleiOptions(30) },
  { key: 'notionistsNose', label: 'Nose', values: numberedLoreleiOptions(20) },
  { key: 'notionistsGlasses', label: 'Glasses', values: optionalLoreleiOptions(11) },
  { key: 'notionistsBeard', label: 'Beard', values: optionalLoreleiOptions(12) },
  {
    key: 'notionistsGesture',
    label: 'Gesture',
    values: optionalNamedOptions(['hand', 'handPhone', 'ok', 'okLongArm', 'point', 'pointLongArm', 'waveLongArm', 'waveLongArms', 'waveOkLongArms', 'wavePointLongArms'])
  }
];

const openPeepsPartOptions: OtherStylePart[] = [
  {
    key: 'openPeepsHead',
    label: 'Head and hair',
    values: namedOptions(['afro', 'bangs', 'bangs2', 'bantuKnots', 'bear', 'bun', 'bun2', 'buns', 'cornrows', 'cornrows2', 'dreads1', 'dreads2', 'flatTop', 'flatTopLong', 'grayBun', 'grayMedium', 'grayShort', 'hatBeanie', 'hatHip', 'hijab', 'long', 'longAfro', 'longBangs', 'longCurly', 'medium1', 'medium2', 'medium3', 'mediumBangs', 'mediumBangs2', 'mediumBangs3', 'mediumStraight', 'mohawk', 'mohawk2', 'noHair1', 'noHair2', 'noHair3', 'pomp', 'shaved1', 'shaved2', 'shaved3', 'short1', 'short2', 'short3', 'short4', 'short5', 'turban', 'twists', 'twists2'])
  },
  {
    key: 'openPeepsExpression',
    label: 'Expression',
    values: namedOptions(['angryWithFang', 'awe', 'blank', 'calm', 'cheeky', 'concerned', 'concernedFear', 'contempt', 'cute', 'cyclops', 'driven', 'eatingHappy', 'explaining', 'eyesClosed', 'fear', 'hectic', 'lovingGrin1', 'lovingGrin2', 'monster', 'old', 'rage', 'serious', 'smile', 'smileBig', 'smileLOL', 'smileTeethGap', 'solemn', 'suspicious', 'tired', 'veryAngry'])
  },
  { key: 'openPeepsAccessories', label: 'Accessories', values: optionalNamedOptions(['eyepatch', 'glasses', 'glasses2', 'glasses3', 'glasses4', 'glasses5', 'sunglasses', 'sunglasses2']) },
  { key: 'openPeepsFacialHair', label: 'Facial hair', values: optionalNamedOptions(['chin', 'full', 'full2', 'full3', 'full4', 'goatee1', 'goatee2', 'moustache1', 'moustache2', 'moustache3', 'moustache4', 'moustache5', 'moustache6', 'moustache7', 'moustache8', 'moustache9']) },
  { key: 'openPeepsMask', label: 'Mask', values: optionalNamedOptions(['medicalMask', 'respirator']) },
  { key: 'openPeepsClothingColor', label: 'Clothing color', values: openPeepsClothingColors },
  { key: 'openPeepsHeadContrastColor', label: 'Hair color', values: openPeepsHairColors },
  { key: 'openPeepsSkinColor', label: 'Skin color', values: loreleiSkinOptions }
];

const customizableStyleParts: Record<string, OtherStylePart[]> = {
  notionists: notionistsPartOptions,
  'open-peeps': openPeepsPartOptions
};

const openPeepsColorableHeads = new Set([
  'bangs',
  'cornrows',
  'grayBun',
  'grayMedium',
  'grayShort',
  'mediumBangs2',
  'mohawk',
  'mohawk2',
  'noHair3',
  'short4'
]);

const diceBearBackgrounds = [
  { id: '8de8d2', label: 'Mint' },
  { id: 'ffd35a', label: 'Sun' },
  { id: 'ff9f8f', label: 'Coral' },
  { id: 'c9b6ff', label: 'Lavender' },
  { id: '79b9ef', label: 'Ocean' },
  { id: 'f5f1e8', label: 'Paper' }
];

function getDiceBearAvatarUrl(avatar: AvatarConfig) {
  const style = diceBearStyles.some((option) => option.id === avatar.style) ? avatar.style : 'lorelei';
  const parameters = new URLSearchParams({
    seed: avatar.seed || defaultAvatar.seed,
    backgroundColor: avatar.backgroundColor || defaultAvatar.backgroundColor,
    radius: '16'
  });

  if (style === 'avataaars') {
    const topVariant = avatar.headwear !== 'none'
      ? avatar.headwear
      : avatar.hairStyle !== 'none'
        ? avatar.hairStyle
        : avatar.top;
    parameters.set('topVariant', topVariant);
    parameters.set('eyesVariant', avatar.eyesVariant);
    parameters.set('eyebrowsVariant', avatar.eyebrows);
    parameters.set('mouthVariant', avatar.mouthVariant);
    parameters.set('clothesVariant', avatar.clothing);
    parameters.set('clothesGraphicVariant', avatar.clothingGraphic);
    parameters.set('clothesColor', avatar.clothingColor);
    parameters.set('hatColor', avatar.hatColor);
    parameters.set('accessoriesColor', avatar.accessoriesColor);
    parameters.set('skinColor', avatar.skinColor);
    parameters.set('hairColor', avatar.hairColor);
    if (avatar.accessoriesVariant !== 'none') {
      parameters.set('accessoriesVariant', avatar.accessoriesVariant);
      parameters.set('accessoriesProbability', '100');
    } else {
      parameters.set('accessoriesProbability', '0');
    }
    if (avatar.facialHair !== 'none') {
      parameters.set('facialHairVariant', avatar.facialHair);
      parameters.set('facialHairColor', avatar.facialHairColor);
      parameters.set('facialHairProbability', '100');
    } else {
      parameters.set('facialHairProbability', '0');
    }
  } else if (style === 'lorelei') {
    parameters.set('hairVariant', avatar.loreleiHair);
    parameters.set('headVariant', avatar.loreleiHead);
    parameters.set('eyesVariant', avatar.loreleiEyes);
    parameters.set('eyebrowsVariant', avatar.loreleiEyebrows);
    parameters.set('mouthVariant', avatar.loreleiMouth);
    parameters.set('noseVariant', avatar.loreleiNose);
    parameters.set('hairColor', avatar.loreleiHairColor);
    parameters.set('skinColor', avatar.loreleiSkinColor);
    parameters.set('eyesColor', avatar.loreleiFeatureColor);
    parameters.set('eyebrowsColor', avatar.loreleiFeatureColor);
    parameters.set('mouthColor', avatar.loreleiFeatureColor);
    parameters.set('noseColor', avatar.loreleiFeatureColor);
    parameters.set('glassesColor', avatar.loreleiFeatureColor);
    parameters.set('earringsColor', avatar.loreleiFeatureColor);
    parameters.set('frecklesColor', avatar.loreleiFeatureColor);
    parameters.set('hairAccessoriesColor', avatar.loreleiFeatureColor);

    const optionalParts = [
      ['glasses', avatar.loreleiGlasses],
      ['earrings', avatar.loreleiEarrings],
      ['beard', avatar.loreleiBeard],
      ['freckles', avatar.loreleiFreckles],
      ['hairAccessories', avatar.loreleiHairAccessories]
    ];
    optionalParts.forEach(([part, value]) => {
      parameters.set(`${part}Probability`, value === 'none' ? '0' : '100');
      if (value !== 'none') {
        parameters.set(`${part}Variant`, value);
      }
    });
  } else if (style === 'notionists') {
    parameters.set('hairVariant', avatar.notionistsHair);
    parameters.set('clothesVariant', avatar.notionistsClothes);
    parameters.set('eyesVariant', avatar.notionistsEyes);
    parameters.set('eyebrowsVariant', avatar.notionistsEyebrows);
    parameters.set('mouthVariant', avatar.notionistsMouth);
    parameters.set('noseVariant', avatar.notionistsNose);
    [
      ['clothesGraphic', avatar.notionistsClothesGraphic],
      ['glasses', avatar.notionistsGlasses],
      ['beard', avatar.notionistsBeard],
      ['gesture', avatar.notionistsGesture]
    ].forEach(([part, value]) => {
      parameters.set(`${part}Probability`, value === 'none' ? '0' : '100');
      if (value !== 'none') parameters.set(`${part}Variant`, value);
    });
  } else if (style === 'open-peeps') {
    parameters.set('headVariant', avatar.openPeepsHead);
    parameters.set('expressionVariant', avatar.openPeepsExpression);
    parameters.set('clothingColor', avatar.openPeepsClothingColor);
    parameters.set('headContrastColor', avatar.openPeepsHeadContrastColor);
    parameters.set('skinColor', avatar.openPeepsSkinColor);
    [
      ['accessories', avatar.openPeepsAccessories],
      ['facialHair', avatar.openPeepsFacialHair],
      ['mask', avatar.openPeepsMask]
    ].forEach(([part, value]) => {
      parameters.set(`${part}Probability`, value === 'none' ? '0' : '100');
      if (value !== 'none') parameters.set(`${part}Variant`, value);
    });
  }

  return `https://api.dicebear.com/10.x/${style}/svg?${parameters}`;
}

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
  return (
    <span className="local-avatar">
      <img alt={`${label} avatar`} src={getDiceBearAvatarUrl(activeAvatar)} />
    </span>
  );

  /* Legacy renderer retained temporarily for existing asset migration. */
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
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('trivai-theme');
    return savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
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
  const [customTest, setCustomTest] = useState({
    title: '',
    description: '',
    category: '',
    visibility: 'Private',
    questions: [
      {
        prompt: '',
        answers: ['', '', '', ''],
        correctAnswer: 0
      }
    ] as CustomTestQuestion[]
  });
  const [customTestMessage, setCustomTestMessage] = useState('');
  const [customTestId, setCustomTestId] = useState('');
  const [customTestStatus, setCustomTestStatus] = useState<'draft' | 'published'>('draft');
  const [customTestSaving, setCustomTestSaving] = useState(false);
  const [deletingCustomTestId, setDeletingCustomTestId] = useState('');
  const [customTestDrafts, setCustomTestDrafts] = useState<CustomTestDraft[]>([]);
  const [publishedTests, setPublishedTests] = useState<PublishedTest[]>([]);
  const [activePublishedTest, setActivePublishedTest] = useState<PublishedTest | null>(null);
  const [publishedQuestionIndex, setPublishedQuestionIndex] = useState(0);
  const [publishedSelectedAnswer, setPublishedSelectedAnswer] = useState<number | null>(null);
  const [publishedAnswerSubmitted, setPublishedAnswerSubmitted] = useState(false);
  const [publishedAnswerCorrect, setPublishedAnswerCorrect] = useState<boolean | null>(null);
  const [publishedAnswerChecking, setPublishedAnswerChecking] = useState(false);
  const [publishedTestScore, setPublishedTestScore] = useState(0);
  const [userTestsFilter, setUserTestsFilter] = useState<'all' | 'mine'>('all');
  const [uploadedTestFile, setUploadedTestFile] = useState<File | null>(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [sessionSaved, setSessionSaved] = useState(false);
  const [leveledUpTo, setLeveledUpTo] = useState<number | null>(null);
  const [setup, setSetup] = useState<GameSetup>({
    username: '',
    categories: 'history, geography, science',
    difficulty: 'Medium',
    duration: 'Custom',
    questionCount: 10
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
  const [showDailyReward, setShowDailyReward] = useState(false);
  const [dailyRewardClaiming, setDailyRewardClaiming] = useState(false);
  const [dailyRewardMessage, setDailyRewardMessage] = useState('');
  const [connectionIssue, setConnectionIssue] = useState<ConnectionIssue | null>(null);
  const openAiPreviousResponseIdRef = useRef<string | undefined>(undefined);

  const totalQuestions = game ? getQuestionCount(game) : getQuestionCount(setup);
  const progress = Math.min(answered, totalQuestions);
  const progressPercent = totalQuestions > 0 ? (progress / totalQuestions) * 100 : 0;
  const displayLeaderboard = useMemo(() => {
    const currentUserId = currentUser?.uid;
    const boostedScore = 2000;
    const entries = [...leaderboard];

    if (currentUserId && profile) {
      const profileEntry = {
        uid: currentUserId,
        displayName: profile.displayName,
        platformScore: profile.bestPlatformScore,
        level: profile.level,
        score: profile.score
      };
      const existingIndex = entries.findIndex((entry) => entry.uid === currentUserId);

      if (existingIndex >= 0) {
        entries[existingIndex] = profileEntry;
      } else {
        entries.unshift(profileEntry);
      }
    }

    return entries
      .map((entry) =>
        entry.uid === currentUserId
          ? {
              ...entry,
              platformScore: entry.platformScore + boostedScore
            }
          : entry
      )
      .sort((left, right) => {
        if (left.uid === currentUserId) {
          return -1;
        }

        if (right.uid === currentUserId) {
          return 1;
        }

        return right.platformScore - left.platformScore;
      });
  }, [currentUser?.uid, leaderboard, profile]);
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
    document.documentElement.dataset.theme = darkMode ? 'dark' : 'light';
    localStorage.setItem('trivai-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

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
        setCustomTestDrafts([]);
        setPublishedTests([]);
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
      const [loadedProfile, loadedLeaderboard, loadedSessions, loadedCustomTests, loadedPublishedTests] = await Promise.all([
        getUserProfile(user),
        getLeaderboard(),
        getRecentSessions(user),
        getCustomTestDrafts(user),
        getPublishedTests(user)
      ]);

      setProfile(loadedProfile);
      setShowDailyReward(canClaimDailyReward(loadedProfile));
      setDailyRewardMessage('');
      setConnectionIssue(null);
      openAiPreviousResponseIdRef.current = loadedProfile.openAiPreviousResponseId;
      setLeaderboard(loadedLeaderboard);
      setRecentSessions(loadedSessions);
      setCustomTestDrafts(loadedCustomTests);
      setPublishedTests(loadedPublishedTests);
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
      const message = err instanceof Error ? err.message : 'Could not load Firebase data.';
      setAuthMessage(message);
      setConnectionIssue({ service: 'Firebase', message });
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
      setConnectionIssue(null);
      const nextHistory = [nextQuestion.questionName, ...history].slice(0, 10);
      setQuestion(nextQuestion);
      setPreviousQuestions(nextHistory);
      preloadQuestion(activeSetup, nextHistory);
    } catch (err) {
      setQuestion(null);
      const message = err instanceof Error ? err.message : 'Something went wrong.';
      setError(message);
      setConnectionIssue({ service: 'OpenAI', message });
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
      const selectedStyle = diceBearStyles.find((style) => style.id === settingsForm.avatar.style);
      if (selectedStyle && selectedStyle.minLevel > (profile?.level ?? 1)) {
        setSettingsMessage(`Reach level ${selectedStyle.minLevel} to save the ${selectedStyle.label} style.`);
        return;
      }

      const lockedDiceBearOption = settingsForm.avatar.style === 'avataaars'
        ? diceBearPartOptions
            .flatMap((part) => part.values.map((option) => ({ part, option })))
            .find(({ part, option }) =>
              settingsForm.avatar[part.key] === option.id &&
              (option.minLevel ?? 1) > (profile?.level ?? 1)
            )
        : undefined;

      if (lockedDiceBearOption) {
        setSettingsMessage(
          `Reach level ${lockedDiceBearOption.option.minLevel} to save ${lockedDiceBearOption.option.label}.`
        );
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
    setShowDailyReward(false);
    setDailyRewardMessage('');
  }

  async function handleDailyRewardClaim() {
    if (!currentUser || !profile || dailyRewardClaiming) {
      return;
    }

    setDailyRewardClaiming(true);
    setDailyRewardMessage('');

    try {
      const claim = await claimDailyReward(currentUser);
      setProfile(claim.profile);
      setLevel(claim.profile.level);
      setScore(claim.profile.score);
      setDailyRewardMessage(`Claimed ${claim.reward} XP. Day ${claim.streak} streak!`);
      setLeaderboard(await getLeaderboard());
    } catch (err) {
      setDailyRewardMessage(err instanceof Error ? err.message : 'Could not claim the daily reward.');
    } finally {
      setDailyRewardClaiming(false);
    }
  }

  async function finishQuiz() {
    if (!currentUser || !profile || !game || sessionSaved) {
      return;
    }

    setSaveStatus('Saving progress...');

    try {
      let nextLevel = profile.level;
      let nextPlayerXp = profile.score + score;

      while (nextPlayerXp >= nextLevel * 150) {
        nextPlayerXp -= nextLevel * 150;
        nextLevel += 1;
      }

      const platformScore = nextLevel * 100 + nextPlayerXp;
      const nextProfile = await saveCompletedSession(currentUser, profile, {
        categories: game.categories,
        difficulty: game.difficulty,
        totalQuestions,
        answeredQuestions: answered,
        correctAnswers,
        level: nextLevel,
        score: nextPlayerXp,
        platformScore
      });

      setProfile(nextProfile);
      setLevel(nextProfile.level);
      setLeveledUpTo(nextProfile.level > profile.level ? nextProfile.level : null);
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
    setLevel(activeProfile?.level ?? 1);
    setAnswered(0);
    setCorrectAnswers(0);
    setSaveStatus('');
    setSessionSaved(false);
    setLeveledUpTo(null);
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
    setScore(0);
    setLevel(profile?.level ?? 1);
    setAnswered(0);
    setCorrectAnswers(0);
    setError('');
    setSaveStatus('');
    setSessionSaved(false);
    setLeveledUpTo(null);
    setShowQuitDialog(false);
  }

  function chooseCombinedCategories() {
    const shuffled = [...combinedCategories].sort(() => Math.random() - 0.5);
    setSetup((current) => ({
      ...current,
      categories: shuffled.slice(0, 3).join(', ')
    }));
  }

  function updateDiceBearAvatar(update: Partial<AvatarConfig>) {
    setSettingsForm((current) => ({
      ...current,
      avatar: {
        ...current.avatar,
        ...update
      }
    }));
  }

  function cycleDiceBearPart(
    part: (typeof diceBearPartOptions)[number],
    direction: -1 | 1
  ) {
    if (getDiceBearPartDisabledReason(part.key)) {
      return;
    }

    const currentValue = settingsForm.avatar[part.key];
    const currentIndex = Math.max(0, part.values.findIndex((option) => option.id === currentValue));
    const nextIndex = (currentIndex + direction + part.values.length) % part.values.length;
    const nextValue = part.values[nextIndex].id;
    if (part.key === 'hairStyle') {
      updateDiceBearAvatar({
        hairStyle: nextValue,
        headwear: 'none',
        top: nextValue === 'none' ? settingsForm.avatar.top : nextValue
      });
      return;
    }
    if (part.key === 'headwear') {
      updateDiceBearAvatar({
        headwear: nextValue,
        top: nextValue === 'none' ? settingsForm.avatar.hairStyle : nextValue
      });
      return;
    }

    updateDiceBearAvatar({ [part.key]: nextValue });
  }

  function cycleLoreleiPart(part: (typeof loreleiPartOptions)[number], direction: -1 | 1) {
    const currentValue = settingsForm.avatar[part.key];
    const currentIndex = Math.max(0, part.values.findIndex((option) => option.id === currentValue));
    const nextIndex = (currentIndex + direction + part.values.length) % part.values.length;
    updateDiceBearAvatar({ [part.key]: part.values[nextIndex].id });
  }

  function cycleOtherStylePart(part: OtherStylePart, direction: -1 | 1) {
    if (getOtherStylePartDisabledReason(part)) {
      return;
    }

    const currentValue = settingsForm.avatar[part.key];
    const currentIndex = Math.max(0, part.values.findIndex((option) => option.id === currentValue));
    const nextIndex = (currentIndex + direction + part.values.length) % part.values.length;
    updateDiceBearAvatar({ [part.key]: part.values[nextIndex].id });
  }

  function getOtherStylePartDisabledReason(part: OtherStylePart) {
    if (
      part.key === 'openPeepsHeadContrastColor' &&
      !openPeepsColorableHeads.has(settingsForm.avatar.openPeepsHead)
    ) {
      return 'This Open Peeps head style has a fixed hair color.';
    }

    return '';
  }

  function getDiceBearPartDisabledReason(part: (typeof diceBearPartOptions)[number]['key']) {
    const avatar = settingsForm.avatar;
    switch (part) {
      case 'hatColor':
        return avatar.headwear !== 'none' ? '' : 'Choose headwear first.';
      case 'hairColor':
        return avatar.hairStyle === 'none' || avatar.headwear !== 'none'
          ? 'Choose visible hair first.'
          : '';
      case 'facialHairColor':
        return avatar.facialHair === 'none' ? 'Choose facial hair first.' : '';
      case 'accessoriesColor':
        return avatar.accessoriesVariant === 'none' ? 'Choose an accessory first.' : '';
      case 'clothingGraphic':
        return avatar.clothing === 'graphicShirt' ? '' : 'Choose Graphic Shirt clothing first.';
      default:
        return '';
    }
  }

  function randomizeDiceBearAvatar() {
    if (settingsForm.avatar.style === 'lorelei') {
      const randomParts = Object.fromEntries(
        loreleiPartOptions.map((part) => [
          part.key,
          part.values[Math.floor(Math.random() * part.values.length)]?.id
        ])
      ) as Partial<AvatarConfig>;

      updateDiceBearAvatar({
        ...randomParts,
        seed: `${settingsForm.displayName || 'Player'}-${crypto.randomUUID()}`
      });
      return;
    }

    const otherStyleParts = customizableStyleParts[settingsForm.avatar.style];
    if (otherStyleParts) {
      const randomParts = Object.fromEntries(
        otherStyleParts.map((part) => [
          part.key,
          part.values[Math.floor(Math.random() * part.values.length)]?.id
        ])
      ) as Partial<AvatarConfig>;
      updateDiceBearAvatar({
        ...randomParts,
        seed: `${settingsForm.displayName || 'Player'}-${crypto.randomUUID()}`
      });
      return;
    }

    const level = profile?.level ?? 1;
    const randomParts = Object.fromEntries(
      diceBearPartOptions.map((part) => {
        const availableValues = part.values.filter((option) => (option.minLevel ?? 1) <= level);
        const randomValue = availableValues[Math.floor(Math.random() * availableValues.length)]?.id;
        return [part.key, randomValue];
      })
    ) as Partial<AvatarConfig>;

    const randomizedHeadwear = randomParts.headwear ?? 'none';
    const randomizedHair = randomizedHeadwear === 'none' ? randomParts.hairStyle ?? 'shortFlat' : 'none';

    updateDiceBearAvatar({
      ...randomParts,
      seed: `${settingsForm.displayName || 'Player'}-${crypto.randomUUID()}`,
      hairStyle: randomizedHair,
      headwear: randomizedHeadwear,
      top: randomizedHeadwear !== 'none' ? randomizedHeadwear : randomizedHair
    });
  }

  function clearDiceBearOptionalItems() {
    if (settingsForm.avatar.style === 'lorelei') {
      updateDiceBearAvatar({
        loreleiGlasses: 'none',
        loreleiEarrings: 'none',
        loreleiBeard: 'none',
        loreleiFreckles: 'none',
        loreleiHairAccessories: 'none'
      });
      return;
    }

    if (settingsForm.avatar.style === 'notionists') {
      updateDiceBearAvatar({
        notionistsClothesGraphic: 'none',
        notionistsGlasses: 'none',
        notionistsBeard: 'none',
        notionistsGesture: 'none'
      });
      return;
    }

    if (settingsForm.avatar.style === 'open-peeps') {
      updateDiceBearAvatar({
        openPeepsAccessories: 'none',
        openPeepsFacialHair: 'none',
        openPeepsMask: 'none'
      });
      return;
    }

    updateDiceBearAvatar({
      hairStyle: 'none',
      headwear: 'none',
      accessoriesVariant: 'none',
      facialHair: 'none',
      clothing: 'shirtCrewNeck'
    });
  }

  function toggleCategory(category: string) {
    setSetup((current) => {
      const selectedCategories = current.categories
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
      const isSelected = selectedCategories.some(
        (item) => item.toLocaleLowerCase() === category.toLocaleLowerCase()
      );
      const nextCategories = isSelected
        ? selectedCategories.filter((item) => item.toLocaleLowerCase() !== category.toLocaleLowerCase())
        : [...selectedCategories, category];

      return {
        ...current,
        categories: nextCategories.join(', ')
      };
    });
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
      <>
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
            <button className="secondary compact" type="button" onClick={handleLogout}>
              Sign out
            </button>
          </div>
        </nav>
        <TrivAiDock
          activeApp={appView}
          apps={[
            {
              id: 'custom-test',
              name: 'Create test',
              icon: (
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
                </svg>
              )
            },
            {
              id: 'upload-test',
              name: 'Upload test',
              icon: (
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v12" />
                  <path d="m17 8-5-5-5 5" />
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                </svg>
              )
            },
            {
              id: 'my-tests',
              name: 'My Tests',
              icon: (
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M11.5 15H7a4 4 0 0 0-4 4v2" />
                  <path d="M21.378 16.626a1 1 0 0 0-3.004-3.004l-4.01 4.012a2 2 0 0 0-.506.854l-.837 2.87a.5.5 0 0 0 .62.62l2.87-.837a2 2 0 0 0 .854-.506z" />
                  <circle cx="10" cy="7" r="4" />
                </svg>
              )
            },
            {
              id: 'user-tests',
              name: 'User Tests',
              icon: (
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              )
            },
            {
              id: 'dashboard',
              name: 'Dashboard',
              icon: (
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M13 17V9" />
                  <path d="M18 17v-3" />
                  <path d="M3 3v16a2 2 0 0 0 2 2h16" />
                  <path d="M8 17V5" />
                </svg>
              )
            },
            {
              id: 'settings',
              name: 'Settings',
              icon: (
                <svg
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )
            }
          ]}
          onAppClick={(appId) => {
            if (appId === 'user-tests') {
              setActivePublishedTest(null);
            }
            setAppView(appId as AppView);
          }}
        />
        {showDailyReward && profile && (
          <div className="modal-backdrop daily-reward-backdrop" role="presentation">
            <section className="modal daily-reward-modal" role="dialog" aria-modal="true" aria-labelledby="daily-reward-title">
              <div>
                <p className="eyebrow">Daily login reward</p>
                <h2 id="daily-reward-title">Keep your streak going</h2>
              </div>
              <div className="daily-reward-calendar">
                {dailyRewardPoints.map((reward, index) => {
                  const justClaimed = dailyRewardMessage.startsWith('Claimed');
                  const activeDay = justClaimed
                    ? (profile.dailyRewardStreak - 1) % dailyRewardPoints.length
                    : profile.dailyRewardStreak % dailyRewardPoints.length;
                  const isClaimed = justClaimed ? index <= activeDay : index < activeDay;
                  const isToday = index === activeDay;

                  return (
                    <div className={`daily-reward-day${isClaimed ? ' claimed' : ''}${isToday ? ' today' : ''}`} key={reward}>
                      <span>Day {index + 1}</span>
                      <strong>{reward} XP</strong>
                      <small>
                        {isClaimed ? (
                          'Claimed'
                        ) : isToday ? (
                          'Today'
                        ) : (
                          <span className="daily-reward-lock" aria-label="Locked day" title="Locked day">
                            <svg
                              aria-hidden="true"
                              fill="none"
                              stroke="currentColor"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                          </span>
                        )}
                      </small>
                    </div>
                  );
                })}
              </div>
              {dailyRewardMessage && <p className="daily-reward-message">{dailyRewardMessage}</p>}
              <div className="modal-actions">
                <button className="secondary" type="button" onClick={() => setShowDailyReward(false)}>
                  {dailyRewardMessage.startsWith('Claimed') ? 'Continue' : 'Later'}
                </button>
                {!dailyRewardMessage.startsWith('Claimed') && (
                  <button type="button" disabled={dailyRewardClaiming} onClick={() => void handleDailyRewardClaim()}>
                    {dailyRewardClaiming
                      ? 'Claiming...'
                      : `Claim ${dailyRewardPoints[profile.dailyRewardStreak % dailyRewardPoints.length]} XP`}
                  </button>
                )}
              </div>
            </section>
          </div>
        )}
      </>
    );
  }

  function updateCustomQuestion(index: number, update: Partial<CustomTestQuestion>) {
    setCustomTest((current) => ({
      ...current,
      questions: current.questions.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...update } : question
      )
    }));
    setCustomTestMessage('');
  }

  function updateCustomAnswer(questionIndex: number, answerIndex: number, value: string) {
    const question = customTest.questions[questionIndex];
    updateCustomQuestion(questionIndex, {
      answers: question.answers.map((answer, index) => (index === answerIndex ? value : answer))
    });
  }

  function addCustomQuestion() {
    setCustomTest((current) => ({
      ...current,
      questions: [
        ...current.questions,
        { prompt: '', answers: ['', '', '', ''], correctAnswer: 0 }
      ]
    }));
    setCustomTestMessage('');
  }

  function removeCustomQuestion(index: number) {
    setCustomTest((current) => ({
      ...current,
      questions: current.questions.filter((_, questionIndex) => questionIndex !== index)
    }));
    setCustomTestMessage('');
  }

  function openCustomTestDraft(draft: CustomTestDraft) {
    setCustomTestId(draft.id);
    setCustomTestStatus(draft.status);
    setCustomTest({
      title: draft.title,
      description: draft.description,
      category: draft.category,
      visibility: draft.visibility,
      questions: draft.questions.length > 0
        ? draft.questions
        : [{ prompt: '', answers: ['', '', '', ''], correctAnswer: 0 }]
    });
    setCustomTestMessage('');
    setAppView('custom-test');
  }

  function startNewCustomTest() {
    setCustomTestId('');
    setCustomTestStatus('draft');
    setCustomTest({
      title: '',
      description: '',
      category: '',
      visibility: 'Private',
      questions: [{ prompt: '', answers: ['', '', '', ''], correctAnswer: 0 }]
    });
    setCustomTestMessage('');
    setAppView('custom-test');
  }

  async function handleSaveCustomTest(status: 'draft' | 'published') {
    if (!currentUser) {
      return;
    }

    if (!customTest.title.trim()) {
      setCustomTestMessage(`Add a title before ${status === 'published' ? 'publishing' : 'saving the draft'}.`);
      return;
    }

    const isComplete = customTest.questions.length > 0 && customTest.questions.every(
      (question) => question.prompt.trim() && question.answers.every((answer) => answer.trim())
    );

    if (status === 'published' && !isComplete) {
      setCustomTestMessage('Complete every question and answer before publishing.');
      return;
    }

    setCustomTestSaving(true);
    setCustomTestMessage('');

    try {
      const savedDraft = await saveCustomTestDraft(currentUser, {
        id: customTestId,
        ...customTest,
        title: customTest.title.trim(),
        visibility: customTest.visibility,
        status
      });
      setCustomTestId(savedDraft.id);
      setCustomTestStatus(savedDraft.status);
      setCustomTest((current) => ({ ...current, visibility: savedDraft.visibility }));
      setCustomTestDrafts(await getCustomTestDrafts(currentUser));
      setPublishedTests(await getPublishedTests(currentUser));
      setCustomTestMessage(status === 'published' ? 'Test published.' : 'Draft saved in My Tests.');
    } catch (err) {
      setCustomTestMessage(err instanceof Error ? err.message : 'Could not save draft.');
    } finally {
      setCustomTestSaving(false);
    }
  }

  async function handleDeleteCustomTest(draft: CustomTestDraft) {
    if (!currentUser || !window.confirm(`Delete "${draft.title || 'Untitled test'}"? This cannot be undone.`)) {
      return;
    }

    setDeletingCustomTestId(draft.id);

    try {
      await deleteCustomTest(currentUser, draft.id);
      setCustomTestDrafts((drafts) => drafts.filter((item) => item.id !== draft.id));
      setPublishedTests((tests) => tests.filter((item) => item.id !== draft.id));

      if (customTestId === draft.id) {
        startNewCustomTest();
      }
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Could not delete test.');
    } finally {
      setDeletingCustomTestId('');
    }
  }

  function startPublishedTest(test: PublishedTest) {
    setActivePublishedTest(test);
    setPublishedQuestionIndex(0);
    setPublishedSelectedAnswer(null);
    setPublishedAnswerSubmitted(false);
    setPublishedAnswerCorrect(null);
    setPublishedAnswerChecking(false);
    setPublishedTestScore(0);
  }

  async function submitPublishedAnswer() {
    if (!currentUser || !activePublishedTest || publishedSelectedAnswer === null) {
      return;
    }

    setPublishedAnswerChecking(true);

    try {
      const isCorrect = await checkPublishedTestAnswer(
        currentUser,
        activePublishedTest.id,
        publishedQuestionIndex,
        publishedSelectedAnswer
      );
      setPublishedAnswerCorrect(isCorrect);
      if (isCorrect) {
        setPublishedTestScore((score) => score + 1);
      }
      setPublishedAnswerSubmitted(true);
    } catch (err) {
      setAuthMessage(err instanceof Error ? err.message : 'Could not check answer.');
    } finally {
      setPublishedAnswerChecking(false);
    }
  }

  function nextPublishedQuestion() {
    if (!activePublishedTest) {
      return;
    }

    setPublishedQuestionIndex((index) => index + 1);
    setPublishedSelectedAnswer(null);
    setPublishedAnswerSubmitted(false);
    setPublishedAnswerCorrect(null);
  }

  function renderSiteHeader() {
    return (
      <header className="site-header">
        <a className="site-brand" href="#top" aria-label="LearnAi home">
          <span>LearnAi</span>
        </a>
        <nav className="site-nav" aria-label="Site navigation">
          <button
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            className="secondary compact theme-toggle"
            type="button"
            onClick={() => setDarkMode((current) => !current)}
          >
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
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
      setScore((value) => value + 100);
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
      <ConnectionErrorPage
        service="Firebase"
        message="Configure the VITE_FIREBASE_* values in TrivAi.Client/.env, then restart the client."
        onHome={() => window.location.reload()}
      />
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

  if (connectionIssue) {
    return (
      <ConnectionErrorPage
        service={connectionIssue.service}
        message={connectionIssue.message}
        onRetry={() => {
          setConnectionIssue(null);
          if (connectionIssue.service === 'Firebase') {
            void loadUserData();
          } else if (game) {
            void fetchQuestion(game);
          }
        }}
        onHome={() => {
          setConnectionIssue(null);
          quitQuiz();
          setAppView('setup');
        }}
      />
    );
  }

  if (!currentUser) {
    return (
      <main className="site-shell" id="top">
        {renderSiteHeader()}
        <section className="site-hero" id="play">
          <div className="hero-copy-block">
            <p className="eyebrow">LearnAi Web</p>
            <h1>LearnAi</h1>
            <p className="hero-copy">
              AI-generated trivia sessions with saved progress, player stats, and a public leaderboard.
            </p>
            <div className="feature-strip" id="features">
              <span>AI questions</span>
              <span>Saved sessions</span>
              <span>Player dashboard</span>
            </div>
          </div>

          <figure className="hero-visual">
            <img src={heroImage} alt="" />
          </figure>

          <form className="panel auth-panel" id="auth" onSubmit={handleAuthSubmit}>
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

  if (!game && appView === 'custom-test') {
    const completedQuestions = customTest.questions.filter(
      (question) => question.prompt.trim() && question.answers.every((answer) => answer.trim())
    ).length;

    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="custom-test-header">
          <div>
            <p className="eyebrow">Test creator</p>
            <h1>Create your own challenge.</h1>
            <p className="hero-copy">
              Build a reusable test for friends, classmates, or a future public quiz library.
            </p>
          </div>
          <div className="custom-test-progress">
            <strong>{completedQuestions}/{customTest.questions.length}</strong>
            <span>questions ready</span>
          </div>
        </section>

        <section className="custom-test-layout">
          <div className="custom-test-main">
            <section className="panel custom-test-details">
              <div>
                <p className="eyebrow">Test details</p>
                <h2>Start with the basics</h2>
              </div>
              <label>
                Test title
                <input
                  value={customTest.title}
                  onChange={(event) => {
                    setCustomTest({ ...customTest, title: event.target.value });
                    setCustomTestMessage('');
                  }}
                  placeholder="Example: European capitals"
                />
              </label>
              <label>
                Description
                <textarea
                  value={customTest.description}
                  onChange={(event) => setCustomTest({ ...customTest, description: event.target.value })}
                  placeholder="What should players expect from this test?"
                  rows={3}
                />
              </label>
              <div className="grid-two">
                <label>
                  Category
                  <input
                    value={customTest.category}
                    onChange={(event) => setCustomTest({ ...customTest, category: event.target.value })}
                    placeholder="Geography"
                  />
                </label>
                <label>
                  Visibility
                  <select
                    value={customTest.visibility}
                    onChange={(event) => setCustomTest({ ...customTest, visibility: event.target.value })}
                  >
                    <option>Private</option>
                    <option>Unlisted</option>
                    <option>Public</option>
                  </select>
                </label>
              </div>
            </section>

            <div className="custom-question-list">
              {customTest.questions.map((question, questionIndex) => (
                <section className="panel custom-question-card" key={questionIndex}>
                  <div className="brand-row">
                    <div>
                      <p className="eyebrow">Question {questionIndex + 1}</p>
                      <h2>{question.prompt.trim() || 'Untitled question'}</h2>
                    </div>
                    {customTest.questions.length > 1 && (
                      <button
                        className="secondary compact"
                        type="button"
                        onClick={() => removeCustomQuestion(questionIndex)}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <label>
                    Question
                    <textarea
                      value={question.prompt}
                      onChange={(event) => updateCustomQuestion(questionIndex, { prompt: event.target.value })}
                      placeholder="Write your question here"
                      rows={2}
                    />
                  </label>
                  <div className="custom-answer-grid">
                    {question.answers.map((answer, answerIndex) => (
                      <label className="custom-answer" key={answerIndex}>
                        <span>
                          <input
                            checked={question.correctAnswer === answerIndex}
                            name={`correct-answer-${questionIndex}`}
                            type="radio"
                            onChange={() => updateCustomQuestion(questionIndex, { correctAnswer: answerIndex })}
                          />
                          Answer {answerIndex + 1}
                        </span>
                        <input
                          value={answer}
                          onChange={(event) => updateCustomAnswer(questionIndex, answerIndex, event.target.value)}
                          placeholder={answerIndex === question.correctAnswer ? 'Correct answer' : 'Answer option'}
                        />
                      </label>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <button className="secondary custom-add-question" type="button" onClick={addCustomQuestion}>
              Add another question
            </button>
          </div>

          <aside className="panel custom-test-sidebar">
            <div>
              <p className="eyebrow">Draft overview</p>
              <h2>{customTest.title.trim() || 'Untitled test'}</h2>
              <p className="muted">{customTest.description.trim() || 'Add a short description for your players.'}</p>
            </div>
            <div className="dashboard-grid">
              <div className="dashboard-stat">
                <p className="eyebrow">Questions</p>
                <strong>{customTest.questions.length}</strong>
              </div>
              <div className="dashboard-stat">
                <p className="eyebrow">Ready</p>
                <strong>{completedQuestions}</strong>
              </div>
            </div>
            <div className="setup-summary">
              <span>{customTest.category.trim() || 'No category'}</span>
              <span>{customTest.visibility}</span>
              <span>{customTestStatus === 'published' ? 'Published' : 'Draft'}</span>
            </div>
            <div className="account-note">
              <p className="muted">
                Custom tests are validated by the API and saved securely in Firebase.
              </p>
            </div>
            {customTestMessage && (
              <p className={customTestMessage.includes('saved') || customTestMessage.includes('published') ? 'success' : 'error'}>
                {customTestMessage}
              </p>
            )}
            <div className="custom-test-actions">
              <button
                className="secondary"
                type="button"
                disabled={customTestSaving}
                onClick={() => void handleSaveCustomTest('draft')}
              >
                Save draft
              </button>
              <button
                type="button"
                disabled={customTestSaving}
                onClick={() => void handleSaveCustomTest('published')}
              >
                {customTestSaving ? 'Saving...' : customTestStatus === 'published' ? 'Update published test' : 'Publish'}
              </button>
            </div>
          </aside>
        </section>
      </main>
    );
  }

  if (!game && appView === 'upload-test') {
    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="upload-test-page">
          <div className="upload-test-copy">
            <p className="eyebrow">Upload your test</p>
            <h1>Turn a document into a quiz.</h1>
            <p className="hero-copy">
              Upload a PDF with questions or learning material. Automatic extraction and quiz creation will be added here.
            </p>
          </div>

          <section className="panel upload-test-card">
            <div className="upload-test-animation" aria-hidden="true">
              <strong>Not discovered yet</strong>
            </div>
            <label className="upload-test-dropzone">
              <span>{uploadedTestFile ? uploadedTestFile.name : 'Drop a PDF here or choose a file'}</span>
              <small>{uploadedTestFile ? `${Math.ceil(uploadedTestFile.size / 1024)} KB selected` : 'PDF files up to 20 MB'}</small>
              <input
                accept="application/pdf,.pdf"
                type="file"
                onChange={(event) => setUploadedTestFile(event.target.files?.[0] ?? null)}
              />
            </label>
            <button type="button" disabled={!uploadedTestFile}>
              Generate test from PDF
            </button>
            <p className="muted">This is currently a visual preview. PDF processing will be connected later.</p>
          </section>
        </section>
      </main>
    );
  }

  if (!game && appView === 'my-tests') {
    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="custom-test-header">
          <div>
            <p className="eyebrow">My Tests</p>
            <h1>Your saved drafts.</h1>
            <p className="hero-copy">Continue building a test or start a new one.</p>
          </div>
          <button type="button" onClick={startNewCustomTest}>Create new test</button>
        </section>

        {customTestDrafts.length === 0 ? (
          <section className="panel empty-tests">
            <p className="eyebrow">No drafts yet</p>
            <h2>Your saved tests will appear here.</h2>
            <button type="button" onClick={startNewCustomTest}>Create your first test</button>
          </section>
        ) : (
          <section className="my-tests-grid">
            {customTestDrafts.map((draft) => (
              <article className="panel my-test-card" key={draft.id}>
                <div>
                  <p className="eyebrow">{draft.category || 'Uncategorized'}</p>
                  <h2>{draft.title || 'Untitled test'}</h2>
                  <p className="muted">{draft.description || 'No description yet.'}</p>
                </div>
                <div className="setup-summary">
                  <span>{draft.questions.length} questions</span>
                  <span>{draft.visibility}</span>
                  <span>{draft.status === 'published' ? 'Published' : 'Draft'}</span>
                </div>
                <p className="muted">Updated {formatDate(draft.updatedAt)}</p>
                <div className="my-test-actions">
                  <button type="button" onClick={() => openCustomTestDraft(draft)}>Continue editing</button>
                  <button
                    className="danger"
                    type="button"
                    disabled={deletingCustomTestId === draft.id}
                    onClick={() => void handleDeleteCustomTest(draft)}
                  >
                    {deletingCustomTestId === draft.id ? 'Deleting...' : 'Delete test'}
                  </button>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    );
  }

  if (!game && appView === 'user-tests') {
    if (activePublishedTest) {
      const testFinished = publishedQuestionIndex >= activePublishedTest.questions.length;
      const activeQuestion = activePublishedTest.questions[publishedQuestionIndex];

      return (
        <main className="app-shell logged-in-shell">
          {renderHotbar()}
          {testFinished ? (
            <section className="panel published-test-result">
              <p className="eyebrow">Test complete</p>
              <h1>{activePublishedTest.title}</h1>
              <strong>{publishedTestScore}/{activePublishedTest.questions.length}</strong>
              <p className="muted">Correct answers</p>
              <div className="form-actions">
                <button type="button" onClick={() => startPublishedTest(activePublishedTest)}>Try again</button>
                <button className="secondary" type="button" onClick={() => setActivePublishedTest(null)}>
                  Back to User Tests
                </button>
              </div>
            </section>
          ) : (
            <section className="published-test-player">
              <div className="quiz-header">
                <div>
                  <p className="eyebrow">Question {publishedQuestionIndex + 1} of {activePublishedTest.questions.length}</p>
                  <h1>{activePublishedTest.title}</h1>
                </div>
                <button className="secondary compact" type="button" onClick={() => setActivePublishedTest(null)}>
                  Leave test
                </button>
              </div>
              <section className="panel published-question-card">
                <p className="eyebrow">By {activePublishedTest.authorName}</p>
                <h2>{activeQuestion.prompt}</h2>
                <div className="published-answer-list">
                  {activeQuestion.answers.map((answer, answerIndex) => {
                    const isSelected = answerIndex === publishedSelectedAnswer;
                    const answerClass = publishedAnswerSubmitted
                      ? isSelected
                        ? publishedAnswerCorrect
                          ? 'correct'
                          : 'wrong'
                        : ''
                      : isSelected
                        ? 'selected'
                        : '';

                    return (
                      <button
                        className={`secondary published-answer ${answerClass}`}
                        disabled={publishedAnswerSubmitted}
                        key={answerIndex}
                        type="button"
                        onClick={() => setPublishedSelectedAnswer(answerIndex)}
                      >
                        {answer}
                      </button>
                    );
                  })}
                </div>
                {!publishedAnswerSubmitted ? (
                  <button
                    type="button"
                    disabled={publishedSelectedAnswer === null || publishedAnswerChecking}
                    onClick={() => void submitPublishedAnswer()}
                  >
                    {publishedAnswerChecking ? 'Checking...' : 'Submit answer'}
                  </button>
                ) : (
                  <button type="button" onClick={nextPublishedQuestion}>
                    {publishedQuestionIndex + 1 === activePublishedTest.questions.length ? 'See results' : 'Next question'}
                  </button>
                )}
              </section>
            </section>
          )}
        </main>
      );
    }

    const filteredPublishedTests = userTestsFilter === 'mine'
      ? publishedTests.filter((test) => test.authorId === currentUser.uid)
      : publishedTests;

    return (
      <main className="app-shell logged-in-shell">
        {renderHotbar()}
        <section className="custom-test-header">
          <div>
            <p className="eyebrow">Community quizzes</p>
            <h1>User Tests.</h1>
            <p className="hero-copy">Play public community tests and your own private published tests.</p>
          </div>
          <button className="secondary" type="button" onClick={() => void loadUserData()}>Refresh</button>
        </section>

        <section className="test-filter-bar" aria-label="Test filters">
          <label>
            <input
              checked={userTestsFilter === 'all'}
              type="checkbox"
              onChange={() => setUserTestsFilter('all')}
            />
            All tests
          </label>
          <label>
            <input
              checked={userTestsFilter === 'mine'}
              type="checkbox"
              onChange={() => setUserTestsFilter('mine')}
            />
            My tests
          </label>
        </section>

        {filteredPublishedTests.length === 0 ? (
          <section className="panel empty-tests">
            <p className="eyebrow">No tests found</p>
            <h2>No published tests match this filter.</h2>
          </section>
        ) : (
          <section className="my-tests-grid">
            {filteredPublishedTests.map((test) => (
              <article className="panel my-test-card" key={test.id}>
                <div>
                  <p className="eyebrow">{test.category || 'Uncategorized'}</p>
                  <h2>{test.title}</h2>
                  <p className="muted">{test.description || 'No description.'}</p>
                </div>
                <div className="setup-summary">
                  <span>{test.questions.length} questions</span>
                  <span>By {test.authorName}</span>
                  <span>{test.visibility}</span>
                </div>
                <button type="button" onClick={() => startPublishedTest(test)}>Start test</button>
              </article>
            ))}
          </section>
        )}
      </main>
    );
  }

  if (!game && appView === 'settings') {
    const lockedAvatarSelections: ReturnType<typeof getLockedAvatarSelections> = [];
    const lockedDiceBearSelections = settingsForm.avatar.style === 'avataaars'
      ? diceBearPartOptions
          .flatMap((part) => part.values.map((option) => ({ part, option })))
          .filter(({ part, option }) =>
            settingsForm.avatar[part.key] === option.id &&
            (option.minLevel ?? 1) > (profile?.level ?? 1)
          )
      : [];
    const firstLockedDiceBearSelection = lockedDiceBearSelections[0];
    const selectedAvatarStyle = diceBearStyles.find((style) => style.id === settingsForm.avatar.style);
    const lockedAvatarStyle = selectedAvatarStyle && selectedAvatarStyle.minLevel > (profile?.level ?? 1)
      ? selectedAvatarStyle
      : undefined;

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
                {firstLockedDiceBearSelection && (
                  <div className="avatar-lock-warning">
                    <strong>Preview only</strong>
                    <span>
                      {firstLockedDiceBearSelection.option.label} unlocks at level{' '}
                      {firstLockedDiceBearSelection.option.minLevel}
                    </span>
                  </div>
                )}
                {lockedAvatarStyle && (
                  <div className="avatar-lock-warning">
                    <strong>Preview only</strong>
                    <span>{lockedAvatarStyle.label} unlocks at level {lockedAvatarStyle.minLevel}</span>
                  </div>
                )}
                <button className="secondary" type="button" onClick={randomizeDiceBearAvatar}>
                  Randomize avatar
                </button>
                <button className="secondary" type="button" onClick={clearDiceBearOptionalItems}>
                  Set optional items to none
                </button>
              </div>

              <div className="dicebear-controls">
                <label>
                  Avatar style
                  <select
                    value={settingsForm.avatar.style}
                    onChange={(event) => updateDiceBearAvatar({ style: event.target.value })}
                  >
                    {diceBearStyles.map((style) => (
                      <option
                        disabled={style.minLevel > (profile?.level ?? 1)}
                        key={style.id}
                        value={style.id}
                      >
                        {style.label}{style.minLevel > 1 ? ` - Level ${style.minLevel}` : ''}
                      </option>
                    ))}
                  </select>
                </label>

                <div>
                  <p className="dicebear-control-label">Background</p>
                  <div className="dicebear-backgrounds">
                    {diceBearBackgrounds.map((background) => (
                      <button
                        aria-label={background.label}
                        aria-pressed={settingsForm.avatar.backgroundColor === background.id}
                        className={settingsForm.avatar.backgroundColor === background.id ? 'selected' : ''}
                        key={background.id}
                        style={{ backgroundColor: `#${background.id}` }}
                        title={background.label}
                        type="button"
                        onClick={() => updateDiceBearAvatar({ backgroundColor: background.id })}
                      />
                    ))}
                  </div>
                </div>

                {settingsForm.avatar.style === 'avataaars' && (
                  <div className="dicebear-part-list">
                    {orderedDiceBearPartOptions.map((part) => {
                      const currentValue = settingsForm.avatar[part.key];
                      const currentOption = part.values.find((option) => option.id === currentValue) ?? part.values[0];
                      const disabledReason = getDiceBearPartDisabledReason(part.key);
                      const currentOptionLocked = (currentOption.minLevel ?? 1) > (profile?.level ?? 1);

                      return (
                        <div
                          className={`dicebear-part-row${disabledReason ? ' disabled' : ''}`}
                          key={part.key}
                          title={disabledReason}
                        >
                          <button
                            aria-label={`Previous ${part.label}`}
                            className="secondary avatar-icon-button"
                            disabled={Boolean(disabledReason)}
                            type="button"
                            onClick={() => cycleDiceBearPart(part, -1)}
                          >
                            ‹
                          </button>
                          <div>
                            <span>{part.label}</span>
                            <strong>{currentOption.label}</strong>
                            {currentOptionLocked && <small>Locked until level {currentOption.minLevel}</small>}
                            {disabledReason && <small>{disabledReason}</small>}
                          </div>
                          <button
                            aria-label={`Next ${part.label}`}
                            className="secondary avatar-icon-button"
                            disabled={Boolean(disabledReason)}
                            type="button"
                            onClick={() => cycleDiceBearPart(part, 1)}
                          >
                            ›
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {settingsForm.avatar.style === 'lorelei' && (
                  <div className="dicebear-part-list">
                    {loreleiPartOptions.map((part) => {
                      const currentValue = settingsForm.avatar[part.key];
                      const currentOption = part.values.find((option) => option.id === currentValue) ?? part.values[0];

                      return (
                        <div className="dicebear-part-row" key={part.key}>
                          <button
                            aria-label={`Previous ${part.label}`}
                            className="secondary avatar-icon-button"
                            type="button"
                            onClick={() => cycleLoreleiPart(part, -1)}
                          >
                            â€¹
                          </button>
                          <div>
                            <span>{part.label}</span>
                            <strong>{currentOption.label}</strong>
                          </div>
                          <button
                            aria-label={`Next ${part.label}`}
                            className="secondary avatar-icon-button"
                            type="button"
                            onClick={() => cycleLoreleiPart(part, 1)}
                          >
                            â€º
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {customizableStyleParts[settingsForm.avatar.style] && (
                  <div className="dicebear-part-list">
                    {customizableStyleParts[settingsForm.avatar.style].map((part) => {
                      const currentValue = settingsForm.avatar[part.key];
                      const currentOption = part.values.find((option) => option.id === currentValue) ?? part.values[0];
                      const disabledReason = getOtherStylePartDisabledReason(part);

                      return (
                        <div
                          className={`dicebear-part-row${disabledReason ? ' disabled' : ''}`}
                          key={part.key}
                          title={disabledReason}
                        >
                          <button
                            aria-label={`Previous ${part.label}`}
                            className="secondary avatar-icon-button"
                            disabled={Boolean(disabledReason)}
                            type="button"
                            onClick={() => cycleOtherStylePart(part, -1)}
                          >
                            â€¹
                          </button>
                          <div>
                            <span>{part.label}</span>
                            <strong>{currentOption.label}</strong>
                            {disabledReason && <small>{disabledReason}</small>}
                          </div>
                          <button
                            aria-label={`Next ${part.label}`}
                            className="secondary avatar-icon-button"
                            disabled={Boolean(disabledReason)}
                            type="button"
                            onClick={() => cycleOtherStylePart(part, 1)}
                          >
                            â€º
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
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
              <button
                type="submit"
                disabled={settingsSaving || lockedDiceBearSelections.length > 0 || Boolean(lockedAvatarStyle)}
              >
                {settingsSaving ? 'Saving...' : 'Save changes'}
              </button>
              <button className="secondary" type="button" onClick={() => setAppView('setup')}>
                Back to play
              </button>
            </div>
          </form>

          <section className="panel settings-panel">
            <div>
              <p className="eyebrow">Appearance</p>
              <h2>Theme</h2>
            </div>
            <button
              aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
              aria-pressed={darkMode}
              className={`theme-switch${darkMode ? ' dark' : ''}`}
              role="switch"
              type="button"
              onClick={() => setDarkMode((current) => !current)}
            >
              <span className="theme-switch-option" aria-hidden="true">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              </span>
              <span className="theme-switch-option" aria-hidden="true">
                <svg
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" />
                </svg>
              </span>
              <span className="theme-switch-thumb" aria-hidden="true" />
            </button>

            <div className="settings-divider" />

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
            <div className="dashboard-heading">
              <div>
                <p className="eyebrow">Dashboard</p>
                <h1>Your stats</h1>
              </div>
              <BrainAnimation />
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
          <figure className="hero-visual menu-robot">
            <InteractiveRobotSpline scene={robotSceneUrl} className="menu-robot-scene" />
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

            <details className="category-picker">
              <summary>Browse all categories</summary>
              <div className="category-picker-header">
                <span>Click categories to select or remove them.</span>
                <button
                  className="secondary compact"
                  type="button"
                  onClick={() => setSetup((current) => ({ ...current, categories: '' }))}
                >
                  Clear
                </button>
              </div>
              <div className="category-picker-list">
                {combinedCategories.map((category) => {
                  const isSelected = setup.categories
                    .split(',')
                    .some((item) => item.trim().toLocaleLowerCase() === category.toLocaleLowerCase());

                  return (
                    <button
                      className={`category-picker-option${isSelected ? ' selected' : ''}`}
                      key={category}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => toggleCategory(category)}
                    >
                      {category}
                    </button>
                  );
                })}
              </div>
            </details>

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
                    <option>Custom</option>
                    <option>Short Version</option>
                    <option>Medium Version</option>
                    <option>Long Version</option>
                  </select>
                </label>
              {setup.duration === 'Custom' && (
                <label>
                  Number of questions
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={setup.questionCount}
                    onChange={(event) =>
                      setSetup({
                        ...setup,
                        questionCount: Math.max(1, Number(event.target.value) || 1)
                      })
                    }
                  />
                </label>
              )}
            </div>

            <div className="setup-summary">
              <span>{getQuestionCount(setup)} questions</span>
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
                {displayLeaderboard.map((entry, index) => (
                  <li className={entry.uid === currentUser.uid ? 'current-player' : ''} key={entry.uid}>
                    <span className="rank">{index + 1}</span>
                    <span className="leaderboard-player">
                      <span>{entry.displayName}</span>
                      {index === 0 && entry.uid === currentUser.uid && <WinnerAnimation />}
                    </span>
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
          <p className="eyebrow">LearnAi Web</p>
          <h1>Quiz session</h1>
        </div>
        <div className="actions">
          <button
            aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}
            className="secondary compact theme-toggle"
            type="button"
            onClick={() => setDarkMode((current) => !current)}
          >
            {darkMode ? 'Light mode' : 'Dark mode'}
          </button>
          <button className="secondary compact" type="button" onClick={() => setShowQuitDialog(true)}>
            Quit quiz
          </button>
        </div>
      </section>

      <section className="topbar">
        <div className="stat-card">
          <p className="eyebrow">Player</p>
          <strong>{game.username}</strong>
        </div>
        <div className="stat-card">
          <p className="eyebrow">Quiz XP</p>
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
            {correctAnswers === totalQuestions && <ConfettiAnimation />}
            <div>
              <p className="eyebrow">Game over</p>
              <h1>Session complete</h1>
            </div>
            {leveledUpTo !== null && (
              <div className="level-up-message animate__animated animate__zoomInDown">
                <span>Leveled Up!</span>
                <strong>Level {leveledUpTo}</strong>
              </div>
            )}
            <p>
              You earned {score} XP in this quiz. Your player is now level {profile?.level ?? level}
              {' '}with {profile?.score ?? 0} XP on the current level.
            </p>
            {saveStatus && <p className={saveStatus === 'Progress saved.' ? 'success' : 'muted'}>{saveStatus}</p>}
            <button type="button" onClick={() => setGame(null)}>
              Back to setup
            </button>
          </div>
        ) : loading ? (
          <div className="centered">
            <QuizLoadingAnimation />
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
