import { IonText } from "@ionic/react";

export const BricolageText = ({ children, className }) => {
  return (
    <IonText className={`bricolage-font ${className || ""}`}>
      {children}
    </IonText>
  );
};
