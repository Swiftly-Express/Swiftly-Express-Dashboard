import React from "react";
import { IonText } from "@ionic/react";

export const YummyText = ({ children, className = "" }) => {
  return (
    <IonText className={`bricolage-font ${className}`}>
      <span className="block whitespace-normal">
        {children}
      </span>
    </IonText>
  );
};
