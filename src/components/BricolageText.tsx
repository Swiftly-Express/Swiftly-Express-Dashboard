import React from "react";
import { IonText } from "@ionic/react";

export const BricolageText: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className }) => {
  return (
    <IonText className={`bricolage-font ${className}`}>
      {children}
    </IonText>
  );
};