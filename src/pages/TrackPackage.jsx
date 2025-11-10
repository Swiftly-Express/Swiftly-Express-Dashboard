import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const TrackPackage = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Track Package Page</YummyText>
          {/* TODO: Implement package tracking functionality */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default TrackPackage;