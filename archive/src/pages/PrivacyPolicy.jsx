import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const PrivacyPolicy = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Privacy Policy</YummyText>
          {/* TODO: Add privacy policy content */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default PrivacyPolicy;
