import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobStageFormComponent } from './job-stage-form.component';

describe('JobStageFormComponent', () => {
  let component: JobStageFormComponent;
  let fixture: ComponentFixture<JobStageFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobStageFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JobStageFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
