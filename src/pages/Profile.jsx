import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonAvatar, IonItem, IonLabel, IonButton, IonIcon, IonList } from '@ionic/react';
import { mail, call, location } from 'ionicons/icons';

const Profile = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '20px', textAlign: 'center' }}>
          <IonCard>
            <IonCardHeader>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
                <IonAvatar style={{ width: '80px', height: '80px', marginBottom: '16px' }}>
                  <img src="https://via.placeholder.com/80" alt="Profile" />
                </IonAvatar>
                <IonCardTitle>John Doe</IonCardTitle>
                <p style={{ color: '#666', margin: '8px 0' }}>Software Developer</p>
              </div>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonIcon icon={mail} slot="start" />
                  <IonLabel>
                    <h3>Email</h3>
                    <p>john.doe@example.com</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={call} slot="start" />
                  <IonLabel>
                    <h3>Phone</h3>
                    <p>+1 (555) 123-4567</p>
                  </IonLabel>
                </IonItem>
                <IonItem>
                  <IonIcon icon={location} slot="start" />
                  <IonLabel>
                    <h3>Location</h3>
                    <p>San Francisco, CA</p>
                  </IonLabel>
                </IonItem>
              </IonList>
              
              <div style={{ marginTop: '20px' }}>
                <IonButton expand="block" color="primary">
                  Edit Profile
                </IonButton>
                <IonButton expand="block" fill="outline" color="medium">
                  Sign Out
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Profile;
