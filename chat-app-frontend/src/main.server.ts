import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ToastrModule, provideToastr } from 'ngx-toastr'; // ✅ Add Toastr
import { AppComponent } from './app/app.component';
import { routes } from './app/app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';

const bootstrap = () =>
  bootstrapApplication(AppComponent, {
    providers: [
      provideHttpClient(),
      provideRouter(routes),
      provideAnimations(),
      provideToastr(), // ✅ Fix Toastr error
    ],
  }).catch((err) => console.error(err));

export default bootstrap;
