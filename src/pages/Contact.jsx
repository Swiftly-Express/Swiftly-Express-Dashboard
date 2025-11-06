import React from 'react';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonItem, IonLabel, IonList, IonButton } from '@ionic/react';
import PageWrapper from '../components/PageWrapper';
import { YummyText } from '../components/YummyText';

const Contact = () => {
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Contact Us</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <PageWrapper className="py-10 max-w-4xl mx-auto">
          <YummyText className="text-3xl font-medium mb-4">Get in touch</YummyText>
          <YummyText className="text-gray-600 mb-6">We’d love to hear from you. Reach out for support, partnerships or press inquiries.</YummyText>

          <IonList>
            <IonItem>
              <IonLabel>
                <strong>Address</strong>
                <div>123 Logistics Avenue, Suite 100</div>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <strong>Phone</strong>
                <div>+1 (800) SWIFTLY</div>
              </IonLabel>
            </IonItem>
            <IonItem>
              <IonLabel>
                <strong>Email</strong>
                <div>support@swiftlyexpress.com</div>
              </IonLabel>
            </IonItem>
          </IonList>

          <div className="mt-8">
            <IonButton routerLink="/" color="primary">Back to Home</IonButton>
          </div>
        </PageWrapper>
      </IonContent>
    </IonPage>
  );
};

export default Contact;
