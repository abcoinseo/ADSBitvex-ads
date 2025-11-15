// src/firebase.d.ts

// Declare modules to provide type information for Firebase SDK imports
// This is necessary because in Applet environments, node_modules (and their @types) are not directly managed
// within the project structure, but the TypeScript compiler still needs type definitions.

declare module 'firebase/app' {
  // Using an internal Firebase type reference to get core interfaces.
  // In a regular npm setup, these would come from `@firebase/app-types`.
  // For this environment, we're mimicking what's needed.
  interface FirebaseAppInternal {
    name: string;
    options: any;
    automaticDataCollectionEnabled: boolean;
    delete(): Promise<void>;
  }
  export interface FirebaseApp extends FirebaseAppInternal {}
  export function initializeApp(options: any, name?: string): FirebaseApp;
}

declare module 'firebase/database' {
  // Mimic necessary types from `@firebase/database-types`
  interface DatabaseInternal {
    app: import('firebase/app').FirebaseApp;
  }
  export interface Database extends DatabaseInternal {}

  interface DataSnapshotInternal {
    val(): any;
    exists(): boolean;
    key: string | null;
    forEach(action: (child: DataSnapshot) => boolean | void): boolean;
  }
  export interface DataSnapshot extends DataSnapshotInternal {}

  // Simplified functions based on common usage in the app
  export function getDatabase(app: import('firebase/app').FirebaseApp): Database;
  export function ref(db: Database, path: string): any; // DatabaseReference type is complex, using 'any'
  export function set(ref: any, value: any): Promise<void>;
  export function get(ref: any): Promise<DataSnapshot>;
  export function update(ref: any, value: any): Promise<void>;
  export function remove(ref: any): Promise<void>;
  export function push(ref: any): { key: string | null }; // Simplified PushPromise type
  export function onValue(ref: any, callback: (snapshot: DataSnapshot) => any, errorCallback?: (error: Error) => any): () => void;
}

declare module 'firebase/auth' {
  // Mimic necessary types from `@firebase/auth-types`
  interface UserInternal {
    uid: string;
    email: string | null;
    // Add other properties if actively used and type-checked
  }
  export interface User extends UserInternal {}

  interface AuthInternal {
    app: import('firebase/app').FirebaseApp;
    currentUser: User | null;
  }
  export interface Auth extends AuthInternal {}

  // Simplified functions based on common usage in the app
  export function getAuth(app: import('firebase/app').FirebaseApp): Auth;
  export function createUserWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
  export function signInWithEmailAndPassword(auth: Auth, email: string, password: string): Promise<any>;
  export function signOut(auth: Auth): Promise<void>;
  export function onAuthStateChanged(auth: Auth, observer: (user: User | null) => any): () => void;

  // Persistence types
  export const browserSessionPersistence: any; // Simplified
  export function setPersistence(auth: Auth, persistence: any): Promise<void>;
}
