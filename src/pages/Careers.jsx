import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const Careers = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Careers Page</YummyText>
          {/* TODO: Implement Careers page content */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Careers;