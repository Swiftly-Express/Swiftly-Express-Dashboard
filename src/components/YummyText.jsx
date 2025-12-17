import React from "react";
import { IonText } from "@ionic/react";

export const YummyText = ({ children, className = "", style = {} }) => {
  return (
    <IonText className={`bricolage-font ${className}`} style={style}>
      <span className="block whitespace-normal">
        {children}
      </span>
    </IonText>
  );
};
