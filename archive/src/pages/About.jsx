import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const About = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">About Page</YummyText>
          {/* TODO: Implement About page content */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default About;
