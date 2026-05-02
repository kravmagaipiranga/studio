'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/**
 * Listens for globally emitted 'permission-error' events and logs them.
 * Errors are already handled per-hook (data=null, error state set).
 * We intentionally do NOT throw here — throwing crashes the entire React tree.
 */
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: FirestorePermissionError) => {
      console.warn('[FirebaseErrorListener] Firestore permission denied:', error.message);
    };
    errorEmitter.on('permission-error', handleError);
    return () => {
      errorEmitter.off('permission-error', handleError);
    };
  }, []);

  return null;
}
