import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { JobStageListComponent } from '../app/job-stage-list/job-stage-list.component';
import { JobStageFormComponent } from '../app/job-stage-form/job-stage-form.component';
import { JobListComponent } from './job-stage/job-stage.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  {
    path: 'jobs',
    children: [
      { path: '', component: JobListComponent },
      { path: 'create-stage', component: JobStageFormComponent },
      { path: ':jobNo/edit-stage/:stageNo', component: JobStageFormComponent },
      { path: ':jobNo/stages', component: JobStageListComponent }
    ]
  },
  { path: '**', redirectTo: '/home' }
];
