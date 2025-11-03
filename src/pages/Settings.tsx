import React from 'react';
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonList, IonItem, IonLabel, IonToggle, IonSelect, IonSelectOption, IonButton } from '@ionic/react';

const Settings: React.FC = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen>
        <div style={{ padding: '20px' }}>
          <IonList>
            <IonItem>
              <IonLabel>Dark Mode</IonLabel>
              <IonToggle slot="end"></IonToggle>
            </IonItem>
            <IonItem>
              <IonLabel>Notifications</IonLabel>
              <IonToggle slot="end" checked></IonToggle>
            </IonItem>
            <IonItem>
              <IonLabel>Language</IonLabel>
              <IonSelect placeholder="Select Language" slot="end">
                <IonSelectOption value="en">English</IonSelectOption>
                <IonSelectOption value="es">Spanish</IonSelectOption>
                <IonSelectOption value="fr">French</IonSelectOption>
              </IonSelect>
            </IonItem>
          </IonList>
          
          <div style={{ marginTop: '20px' }}>
            <IonButton expand="block" color="primary">
              Save Settings
            </IonButton>
            <IonButton expand="block" fill="outline" color="medium">
              Reset to Default
            </IonButton>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Settings;
