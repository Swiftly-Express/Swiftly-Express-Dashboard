import { IonPage, IonContent } from '@ionic/react';
import React from 'react';
import { YummyText } from '../components/YummyText';

const Blog = () => {
  return (
    <IonPage>
      <IonContent>
        <div className="p-8">
          <YummyText className="text-2xl">Blog Page</YummyText>
          {/* TODO: Implement Blog page content */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Blog;
