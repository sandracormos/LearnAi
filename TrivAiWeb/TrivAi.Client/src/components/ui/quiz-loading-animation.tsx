import Lottie from 'lottie-react';
import loadingAnimation from '../../../../LottieAnimations/Loading.json';

export function QuizLoadingAnimation() {
  return (
    <div className="quiz-loading-animation" aria-hidden="true">
      <Lottie animationData={loadingAnimation} autoplay loop />
    </div>
  );
}
