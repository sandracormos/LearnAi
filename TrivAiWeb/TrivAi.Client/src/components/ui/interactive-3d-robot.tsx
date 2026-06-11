import { Suspense, lazy } from 'react';

const Spline = lazy(() => import('@splinetool/react-spline'));

interface InteractiveRobotSplineProps {
  scene: string;
  className?: string;
}

export function InteractiveRobotSpline({ scene, className }: InteractiveRobotSplineProps) {
  return (
    <Suspense
      fallback={
        <div className={`interactive-robot-loading ${className ?? ''}`}>
          <span aria-label="Loading interactive robot" className="interactive-robot-spinner" role="status" />
        </div>
      }
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
