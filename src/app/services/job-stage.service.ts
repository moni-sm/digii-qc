import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Job, JobStage } from '../../models/job.model';
import { Observable, map, switchMap, throwError } from 'rxjs';
import { QAP } from '../../models/qap.model';


@Injectable({
  providedIn: 'root'
})
export class JobStageService {
  private readonly apiUrl = 'http://localhost:3000/jobs';
  private readonly qapApiUrl = 'http://localhost:3000/qap';

  constructor(private readonly http: HttpClient) { }

  getJobs(): Observable<Job[]> {
    return this.http.get<Job[]>(this.apiUrl);
  }

  getJobByNo(jobno: string): Observable<Job | undefined> {
    return this.getJobs().pipe(
      map(jobs => jobs.find(job => job.jobno === jobno))
    );
  }

  addJob(job: Job): Observable<Job> {
    return this.http.post<Job>(this.apiUrl, job);
  }

  updateJob(job: Job): Observable<Job> {
    return this.http.put<Job>(`${this.apiUrl}/${job.id}`, job);
  }

  deleteJob(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }

  addStage(jobno: string, stage: JobStage): Observable<Job> {
    return this.getJobByNo(jobno).pipe(
      switchMap(job => {
        if (!job) return throwError(() => new Error('Job not found'));
        job.stages = job.stages || [];

        if (job.stages.some(s => s.stageNo === stage.stageNo)) {
          return throwError(() => new Error('Stage number already exists'));
        }

        job.stages.push(stage);
        return this.updateJob(job);
      })
    );
  }

  deleteStage(jobno: string, stageNo: number): Observable<Job> {
    return this.getJobByNo(jobno).pipe(
      switchMap(job => {
        if (!job) return throwError(() => new Error('Job not found'));
        job.stages = (job.stages || []).filter(stage => stage.stageNo !== stageNo);
        return this.updateJob(job);
      })
    );
  }

  updateStage(jobno: string, stageNo: number, updatedStage: JobStage): Observable<Job> {
    return this.getJobByNo(jobno).pipe(
      switchMap(job => {
        if (!job) return throwError(() => new Error('Job not found'));
        const index = job.stages?.findIndex(s => s.stageNo === stageNo);
        if (index === undefined || index < 0) {
          return throwError(() => new Error('Stage not found'));
        }
        job.stages[index] = updatedStage;
        return this.updateJob(job);
      })
    );
  }


  getQAPs(): Observable<QAP[]> {
    return this.http.get<QAP[]>(this.qapApiUrl);
  }

}
