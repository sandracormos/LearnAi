import Lottie from 'lottie-react';
import winnerAnimation from '../../../../LottieAnimations/Winner.json';

export function WinnerAnimation() {
  return (
    <span className="winner-animation" aria-label="You are number one">
      <Lottie animationData={winnerAnimation} autoplay loop />
    </span>
  );
}
