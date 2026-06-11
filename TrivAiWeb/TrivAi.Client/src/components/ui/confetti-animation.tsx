import Lottie from 'lottie-react';
import confettiAnimation from '../../../../LottieAnimations/Confetti.json';

export function ConfettiAnimation() {
  return (
    <div className="confetti-animation" aria-hidden="true">
      <Lottie animationData={confettiAnimation} autoplay loop={false} />
    </div>
  );
}
