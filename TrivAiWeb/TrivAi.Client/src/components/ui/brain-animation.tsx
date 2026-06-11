import Lottie from 'lottie-react';
import brainAnimation from '../../../../LottieAnimations/Brain.json';

export function BrainAnimation() {
  return (
    <div className="brain-animation" aria-hidden="true">
      <Lottie animationData={brainAnimation} autoplay loop />
    </div>
  );
}
