import { Component, OnInit } from '@angular/core';
import { JobStageService } from '../services/job-stage.service';
import { Job, JobStage } from '../../models/job.model';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';

interface StageWithJob extends JobStage {
  jobNo: string;
}

@Component({
  selector: 'app-job-stage-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  providers: [DatePipe],
  templateUrl: './job-stage-list.component.html',
  styleUrls: ['./job-stage-list.component.scss']
})
export class JobStageListComponent implements OnInit {
  jobs: Job[] = [];
  stages: StageWithJob[] = [];
  selectedJobNo: string = '';
  uniqueJobNumbers: string[] = [];

  constructor(
    private readonly jobStageService: JobStageService,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.selectedJobNo = params.get('jobNo') || '';
      this.loadStages();
    });
  }

  loadStages(): void {
    this.jobStageService.getJobs().subscribe(jobs => {
      this.jobs = jobs;
      this.uniqueJobNumbers = [...new Set(jobs.map(job => job.jobno))];
      this.filterStages();
    });
  }

  filterStages(): void {
    this.stages = [];
    this.jobs.forEach(job => {
      if (!this.selectedJobNo || job.jobno === this.selectedJobNo) {
        job.stages?.forEach(stage => {
          this.stages.push({
            jobNo: job.jobno,
            ...stage
          });
        });
      }
    });
  }

  // Rename method in TS file:
deleteJobStage(jobNo: string, stageNo: number): void {
  const stagesOfJob = this.jobs.find(job => job.jobno === jobNo)?.stages || [];

  const targetStage = stagesOfJob.find(stage => stage.stageNo === stageNo);
  if (!targetStage) return;

  // Check 1: Prevent deleting the only "----" stage
  if (targetStage.precedingStage === '----') {
    const otherRootStages = stagesOfJob.filter(
      s => s.stageNo !== stageNo && s.precedingStage === '----'
    );
    if (otherRootStages.length === 0) {
      alert('At least one stage in a job should have preceding stage as "----".');
      return;
    }
  }

  // Check 2: Prevent deleting a stage that's a dependency
  const dependentStage = stagesOfJob.find(s => s.precedingStage === stageNo.toString());
  if (dependentStage) {
    alert(
      `Cannot delete stage ${stageNo} because it is a preceding stage for stage ${dependentStage.stageNo}. Please update dependent stages first.`
    );
    return;
  }

  // Proceed with delete
  if (confirm(`Are you sure you want to delete stage ${stageNo} from job ${jobNo}?`)) {
    this.jobStageService.deleteStage(jobNo, stageNo).subscribe({
      next: () => this.loadStages(),
      error: (err: any) => console.error('Error deleting stage:', err)
    });
  }
}


}
