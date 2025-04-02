import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ToastrModule, provideToastr } from 'ngx-toastr'; // ✅ Add Toastr
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideAnimations } from '@angular/platform-browser/animations';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideRouter(routes),
    provideToastr(), // ✅ Fix Toastr error
    provideAnimations(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: { preset: Aura, options: { darkModeSelector: '.p-dark' } },
    }),
  ],
}).catch((err) => console.error(err));
