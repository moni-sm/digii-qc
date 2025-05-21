import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-job-stage',
  standalone: true,
  imports: [CommonModule, HttpClientModule],
  templateUrl: './job-stage.component.html',
  styleUrls: ['./job-stage.component.scss']
})
export class JobStageComponent implements OnInit {
  jobs: any[] = [];

  constructor(private readonly http: HttpClient) {}

  ngOnInit(): void {
    this.http.get('assets/jobs.json').subscribe(data => {
      this.jobs = data as any[];
    });
  }
}
