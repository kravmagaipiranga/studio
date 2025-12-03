'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getApps, initializeApp } from 'firebase/app';
import { firebaseConfig } from './config';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    if (getApps().length === 0) {
       try {
        // Important! initializeApp() is called without any arguments because Firebase App Hosting
        // integrates with the initializeApp() function to provide the environment variables needed to
        // populate the FirebaseOptions in production. It is critical that we attempt to call initializeApp()
        // without arguments.
        initializeApp();
      } catch (e) {
        // Only warn in production because it's normal to use the firebaseConfig to initialize
        // during development
        if (process.env.NODE_ENV === "production") {
          console.warn('Automatic initialization failed. Falling back to firebase config object.', e);
        }
        initializeApp(firebaseConfig);
      }
    }
    const app = getApps()[0];
    return {
      firebaseApp: app,
      auth: getAuth(app),
      firestore: getFirestore(app),
    };
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
}
