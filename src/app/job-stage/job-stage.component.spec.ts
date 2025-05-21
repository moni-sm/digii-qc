import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JobStageComponent } from './job-stage.component';

describe('JobStageComponent', () => {
  let component: JobStageComponent;
  let fixture: ComponentFixture<JobStageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobStageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JobStageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
