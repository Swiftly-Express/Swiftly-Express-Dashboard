import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';

const HowItWorks = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>How It Works</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageWrapper className="py-10 max-w-4xl mx-auto">
          <YummyText className="text-3xl font-medium mb-4">How It Works</YummyText>
          <YummyText className="text-gray-600 mb-6">Simple steps: Book → Track → Deliver. Use the app to schedule pickups and monitor progress in real time.</YummyText>
        </PageWrapper>
      </IonContent>
    </IonPage>
  );
};

export default HowItWorks;
