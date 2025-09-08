import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'ptt-test',
  },
  {
    path: 'ptt-test',
    loadComponent: () => import('./ptt/ptt-test/ptt-test').then(m => m.PttTest),
  },

];
