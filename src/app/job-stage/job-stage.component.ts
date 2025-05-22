// job-list.component.ts
import { Component, OnInit } from '@angular/core';
import { JobStageService } from '../services/job-stage.service';
import { Job } from '../../models/job.model';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, RouterModule,HttpClientModule],
  templateUrl: './job-stage.component.html',
  styleUrls: ['./job-stage.component.scss']
})
export class JobListComponent implements OnInit {
  jobs: Job[] = [];

  constructor(private jobService: JobStageService) {}

  ngOnInit(): void {
    this.jobService.getJobs().subscribe(jobs => {
      this.jobs = jobs;
    });
  }
}
