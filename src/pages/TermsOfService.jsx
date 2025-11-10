import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const TermsOfService = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Terms of Service</YummyText>
          {/* TODO: Add terms of service content */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TermsOfService;