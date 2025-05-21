import { Component } from '@angular/core';
import { JobStageComponent } from './job-stage/job-stage.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [JobStageComponent],
  template: `<app-job-stage />`,
  styleUrls: ['./app.component.scss']
})
export class AppComponent {}
