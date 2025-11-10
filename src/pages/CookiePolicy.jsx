import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const CookiePolicy = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Cookie Policy</YummyText>
          {/* TODO: Add cookie policy content */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default CookiePolicy;