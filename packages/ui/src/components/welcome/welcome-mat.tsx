import * as React from 'react';

// TODO: WelcomeMat component was removed when atomic/ directory was deleted.
// Need to recreate WelcomeMat component in design-system/components/
// export { WelcomeMat } from "../../atomic/00-Global/organisms/welcome-mat";
// export type { WelcomeMatProps } from "../../atomic/00-Global/organisms/welcome-mat";
export { useWelcomeMat } from "../../hooks/use-welcome-mat";

export interface WelcomeMatProps {
  onDismiss?: () => void;
  userName?: string;
  className?: string;
}

// Temporary placeholder to prevent import errors
export const WelcomeMat: React.FC<WelcomeMatProps> = () => {
  return (
    <div className="p-8 bg-background-secondary rounded-lg border-2 border-dashed border-border-default">
      <p className="text-text-secondary text-center">
        WelcomeMat component needs to be recreated in design-system/components/
      </p>
    </div>
  );
};
