import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/api/users';
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Initialize currentUserSubject based on the platform
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('currentUser');
      this.currentUserSubject = new BehaviorSubject<any>(
        storedUser ? JSON.parse(storedUser) : null
      );
    } else {
      this.currentUserSubject = new BehaviorSubject<any>(null);
    }
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  getUserDetails(): Observable<any> {
    const token = localStorage.getItem('currentUser')
      ? JSON.parse(localStorage.getItem('currentUser') || '{}').token
      : null;
    return this.http.get<any>(`${this.apiUrl}/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  // ✅ Fixing Login: Returning Observable instead of subscribing inside service
  login(identifier: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${this.apiUrl}/login`, { identifier, password }) // Send identifier instead of email
      .pipe(
        tap((response) => {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('currentUser', JSON.stringify(response));
          }
          this.currentUserSubject.next(response);
        })
      );
  }

  // ✅ Register: No need to change
  register(
    username: string,
    email: string,
    password: string,
    imageUrl: string | null
  ) {
    return this.http.post<any>(`${this.apiUrl}/register`, {
      username,
      email,
      password,
      profileImage: imageUrl, // Send profile image URL
    });
  }

  // ✅ Logout: Works fine
  logout() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('currentUser');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }
}
