import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../../../components/YummyText';

const ForgotPassword = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Forgot Password</YummyText>
          {/* TODO: Implement password reset functionality */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ForgotPassword;