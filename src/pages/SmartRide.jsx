import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/react';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';

const SmartRide = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Smart Ride</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageWrapper className="py-10 max-w-4xl mx-auto">
          <YummyText className="text-3xl font-medium mb-4">Smart Ride</YummyText>
          <YummyText className="text-gray-600 mb-6">Information about our Smart Ride feature will be available here. Smart routing and optimized drivers for fast delivery.</YummyText>
        </PageWrapper>
      </IonContent>
    </IonPage>
  );
};

export default SmartRide;
