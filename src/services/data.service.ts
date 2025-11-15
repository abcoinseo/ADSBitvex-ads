
import { Injectable, signal } from '@angular/core';
import { Database, ref, set, get, update, remove, push, onValue, DataSnapshot } from 'firebase/database';
import { db } from '../firebase-config';
import { toObservable } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class DataService {
  private firebaseDb: Database = db;

  // Generic function to set data
  async set<T>(path: string, data: T): Promise<void> {
    await set(ref(this.firebaseDb, path), data);
  }

  // Generic function to push data (generates a unique key)
  async push<T>(path: string, data: T): Promise<string | null> {
    const newRef = push(ref(this.firebaseDb, path));
    await set(newRef, data);
    return newRef.key;
  }

  // Generic function to get data once
  async get<T>(path: string): Promise<T | null> {
    const snapshot = await get(ref(this.firebaseDb, path));
    return snapshot.exists() ? snapshot.val() : null;
  }

  // Generic function to update data
  async update<T>(path: string, data: Partial<T>): Promise<void> {
    await update(ref(this.firebaseDb, path), data);
  }

  // Generic function to remove data
  async remove(path: string): Promise<void> {
    await remove(ref(this.firebaseDb, path));
  }

  // Generic function to listen for real-time data changes
  // Returns an Observable that emits the data
  listen<T>(path: string): Observable<T | null> {
    return new Observable<T | null>(observer => {
      const dataRef = ref(this.firebaseDb, path);
      const unsubscribe = onValue(dataRef, (snapshot: DataSnapshot) => {
        observer.next(snapshot.exists() ? snapshot.val() : null);
      }, (error) => {
        observer.error(error);
      });
      // Return a cleanup function
      return { unsubscribe: unsubscribe };
    });
  }

  // Utility to convert snapshot of objects to array with keys
  snapshotToArray<T>(snapshot: DataSnapshot): (T & { id: string })[] {
    const items: (T & { id: string })[] = [];
    snapshot.forEach(childSnapshot => {
      items.push({ id: childSnapshot.key!, ...childSnapshot.val() });
    });
    return items;
  }
}
