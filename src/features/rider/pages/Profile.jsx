import React from 'react';
import { IonPage, IonContent } from '@ionic/react';
import RiderLayout from '../components/RiderLayout';
import { YummyText } from '../../../components/YummyText';

const Profile = () => {
  return (
    <IonPage>
      <RiderLayout>
        <IonContent className="ion-no-padding">
          <div>
            <YummyText className="text-2xl font-semibold mb-2">Profile</YummyText>
            <YummyText className="text-sm text-[#64748B] mb-6">Manage your rider profile</YummyText>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <YummyText>Profile settings placeholder.</YummyText>
            </div>
          </div>
        </IonContent>
      </RiderLayout>
    </IonPage>
  );
};

export default Profile;
