import { Routes } from '@angular/router';
import { JobStageComponent } from './job-stage/job-stage.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'jobs', component: JobStageComponent },
];
