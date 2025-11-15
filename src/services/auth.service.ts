import { Injectable, signal, inject } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { Database, ref, set, get } from 'firebase/database';
import { auth, db } from '../firebase-config';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { from } from 'rxjs';
import { DataService } from './data.service'; // Import DataService

export interface UserProfile {
  uid: string;
  email: string | null;
  role: 'advertiser' | 'publisher' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private firebaseAuth: Auth = auth;
  private firebaseDb: Database = db;
  private router = inject(Router);
  private dataService = inject(DataService); // Inject DataService

  currentUser = signal<User | null>(null);
  userRole = signal<'advertiser' | 'publisher' | 'admin' | null>(null);
  userProfile = signal<UserProfile | null>(null);

  constructor() {
    setPersistence(this.firebaseAuth, browserSessionPersistence);
  }

  initAuthState() {
    onAuthStateChanged(this.firebaseAuth, async (user) => {
      this.currentUser.set(user);
      if (user) {
        await this.fetchUserProfile(user.uid);
      } else {
        this.userRole.set(null);
        this.userProfile.set(null);
      }
    });
  }

  async fetchUserProfile(uid: string) {
    const userRef = ref(this.firebaseDb, `users/${uid}`);
    const snapshot = await get(userRef);
    if (snapshot.exists()) {
      const profile: UserProfile = snapshot.val();
      // Special check for admin email
      if (profile.email === 'abcoinseo@gmail.com') {
        profile.role = 'admin';
      }
      this.userProfile.set(profile);
      this.userRole.set(profile.role);
    } else {
      console.warn('User profile not found for UID:', uid);
      this.userRole.set(null);
      this.userProfile.set(null);
    }
  }

  async register(email: string, password: string, role: 'advertiser' | 'publisher') {
    try {
      const userCredential = await createUserWithEmailAndPassword(this.firebaseAuth, email, password);
      const user = userCredential.user;
      const userProfile: UserProfile = { uid: user.uid, email: user.email, role: role };

      await set(ref(this.firebaseDb, `users/${user.uid}`), userProfile);
      await this.dataService.set(`users/${user.uid}/balance`, 0); // Initialize balance to 0

      this.userProfile.set(userProfile);
      this.userRole.set(role);
      this.router.navigate([`/${role}`]);
      return true;
    } catch (error: any) {
      console.error('Registration failed:', error.message);
      throw error;
    }
  }

  async login(email: string, password: string) {
    try {
      const userCredential = await signInWithEmailAndPassword(this.firebaseAuth, email, password);
      const user = userCredential.user;
      await this.fetchUserProfile(user.uid); // Fetch profile to get role
      const role = this.userRole();
      if (role) {
        this.router.navigate([`/${role}`]);
      } else {
        // Should not happen if profile is created on register
        this.router.navigate(['/']);
      }
      return true;
    } catch (error: any) {
      console.error('Login failed:', error.message);
      throw error;
    }
  }

  async logout() {
    try {
      await signOut(this.firebaseAuth);
      this.currentUser.set(null);
      this.userRole.set(null);
      this.userProfile.set(null);
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Logout failed:', error.message);
    }
  }

  redirectToLogin(): boolean {
    this.router.navigate(['/login']);
    return false;
  }

  redirectToDashboard(role: 'advertiser' | 'publisher' | 'admin' | null): void {
    if (role === 'admin') {
      this.router.navigate(['/admin']);
    } else if (role === 'advertiser') {
      this.router.navigate(['/advertiser']);
    } else if (role === 'publisher') {
      this.router.navigate(['/publisher']);
    } else {
      this.router.navigate(['/']);
    }
  }
}