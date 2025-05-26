import { Component, OnInit } from '@angular/core';
import { JobStageService } from '../services/job-stage.service';
import { Job, JobStage } from '../../models/job.model';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormControl
} from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';

interface QAP {
  qapNumber: string;
  department: string;
}

@Component({
  selector: 'app-stage-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './job-stage-form.component.html',
  styleUrls: ['./job-stage-form.component.scss']
})
export class JobStageFormComponent implements OnInit {
  jobs: Job[] = [];
  allQAPs: QAP[] = [];
  filteredQAPs: QAP[] = [];
  existingStages: JobStage[] = [];
  precedingStageOptions: string[] = [];
  minStartDate: string = '';
  currentJobDepartment: string = '';
  currentJob: Job | null = null;

  isEditMode = false;
  editingStageIndex: number | null = null;

  stageForm: FormGroup;

  constructor(
    private readonly jobService: JobStageService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.stageForm = this.fb.group({
      jobNo: new FormControl({ value: '', disabled: false }, Validators.required),
      stageNo: new FormControl({ value: null, disabled: true }, [Validators.required, Validators.min(1)]),
      stageDesc: new FormControl({ value: '', disabled: true }, [Validators.required, Validators.maxLength(20)]),
      precedingStage: new FormControl({ value: '---', disabled: true }),
      startDate: new FormControl({ value: '', disabled: true }, [Validators.required, this.validateStartDate.bind(this)]),
      endDate: new FormControl({ value: '', disabled: true }, Validators.required),
      qap: new FormControl({ value: '', disabled: true }, Validators.required)
    }, { validators: [this.validateStageNumberUniqueness.bind(this), this.validateDateRange.bind(this)] });
  }

  ngOnInit(): void {
    this.jobService.getJobs().subscribe(jobs => {
      this.jobs = jobs;

      this.route.paramMap.subscribe(params => {
        const jobNo = params.get('jobNo');
        const stageNo = params.get('stageNo');

        if (jobNo && stageNo) {
          this.isEditMode = true;
          const job = this.jobs.find(j => j.jobno === jobNo);

          if (!job) {
            alert(`Job ${jobNo} not found`);
            this.router.navigate(['/jobs']);
            return;
          }

          const stageIndex = job.stages?.findIndex(s => s.stageNo.toString() === stageNo) ?? -1;
          if (stageIndex < 0) {
            alert(`Stage ${stageNo} not found`);
            this.router.navigate(['/jobs']);
            return;
          }

          this.editingStageIndex = stageIndex;
          this.currentJob = job;
          this.existingStages = job.stages?.filter(s => s.stageNo !== +stageNo) || [];
          this.minStartDate = job.qcstartdate;
          this.currentJobDepartment = job.department;
          this.filterQAPsByDepartment();

          const stage = job.stages![stageIndex];
          this.stageForm.patchValue({
            jobNo: job.jobno,
            stageNo: stage.stageNo,
            stageDesc: stage.stageDesc,
            precedingStage: stage.precedingStage ?? '---',
            startDate: stage.startDate,
            endDate: stage.endDate,
            qap: stage.qap
          });

          this.stageForm.get('jobNo')?.disable();
          this.stageForm.get('stageNo')?.disable();
          this.enableAllControls();
          this.updatePrecedingStageOptions();
        } else {
          this.isEditMode = false;
          this.editingStageIndex = null;
          this.resetForm();
        }
      });
    });

    this.jobService.getQAPs().subscribe(qaps => {
      this.allQAPs = qaps;
      this.filteredQAPs = qaps;
    });

    this.stageForm.get('jobNo')?.valueChanges.subscribe(jobNo => {
      this.currentJob = this.jobs.find(j => j.jobno === jobNo) ?? null;
      this.existingStages = this.currentJob?.stages || [];
      this.minStartDate = this.currentJob?.qcstartdate || '';
      this.currentJobDepartment = this.currentJob?.department || '';
      this.filterQAPsByDepartment();

      if (jobNo) {
        this.enableAllControls();
        this.updatePrecedingStageOptions();
      } else {
        this.disableControlsExceptJobNo();
        this.resetEditMode();
        this.clearDependentFields();
      }
    });

    this.stageForm.get('stageNo')?.valueChanges.subscribe(() => {
      this.updatePrecedingStageOptions();
      this.stageForm.updateValueAndValidity();
    });

    this.stageForm.get('precedingStage')?.valueChanges.subscribe(value => {
      this.updateStartDateValidatorBasedOnPreceding(value);
    });

    if (!this.stageForm.get('jobNo')?.value) {
      this.disableControlsExceptJobNo();
    }
  }

  private validateStageNumberUniqueness(formGroup: FormGroup): ValidationErrors | null {
    const stageNo = formGroup.get('stageNo')?.value;
    const jobNo = formGroup.get('jobNo')?.value;

    if (!stageNo || !jobNo) return null;

    if (this.isEditMode && this.editingStageIndex !== null && this.currentJob) {
      const editingStage = this.currentJob.stages?.[this.editingStageIndex];
      if (editingStage && editingStage.stageNo === stageNo) {
        return null;
      }
    }

    const job = this.jobs.find(j => j.jobno === jobNo);
    const isStageNoUnique = !job?.stages?.some(s => s.stageNo === stageNo);
    return isStageNoUnique ? null : { stageNumberNotUnique: true };
  }

  private validateStartDate(control: AbstractControl): ValidationErrors | null {
    const startDate = control.value;
    if (!startDate || !this.minStartDate) return null;

    const start = new Date(startDate);
    const min = new Date(this.minStartDate);
    return start < min ? { startDateTooEarly: true } : null;
  }

  private validateDateRange(formGroup: FormGroup): ValidationErrors | null {
    const startDate = formGroup.get('startDate')?.value;
    const endDate = formGroup.get('endDate')?.value;

    if (!startDate || !endDate) return null;

    return new Date(startDate) > new Date(endDate) ? { dateRangeInvalid: true } : null;
  }

  onSubmit(): void {
    this.stageForm.markAllAsTouched();
    if (this.stageForm.invalid) return;

    const formValue = this.stageForm.getRawValue();
    const newStage: JobStage = {
      stageNo: formValue.stageNo,
      stageDesc: formValue.stageDesc,
      precedingStage: formValue.precedingStage === '---' ? null : formValue.precedingStage,
      startDate: formValue.startDate,
      endDate: formValue.endDate,
      qap: formValue.qap
    };

    const job = this.jobs.find(j => j.jobno === formValue.jobNo);
    if (!job) return;

    if (this.isEditMode && this.editingStageIndex !== null) {
      this.jobService.updateStage(job.jobno, newStage.stageNo, newStage).subscribe({
        next: () => {
          alert('Stage updated successfully!');
          job.stages![this.editingStageIndex!] = newStage;
          this.resetForm();
          this.router.navigate(['/jobs']);
        },
        error: err => console.error('Error updating stage:', err)
      });
    } else {
      this.jobService.addStage(job.jobno, newStage).subscribe({
        next: () => {
          alert('Stage added successfully!');
          this.resetForm();
          this.router.navigate(['/jobs']);
        },
        error: err => console.error('Error adding stage:', err)
      });
    }
  }

  private resetForm(): void {
    const currentJobNo = this.stageForm.getRawValue().jobNo || '';
    this.stageForm.reset({
      jobNo: currentJobNo,
      stageNo: null,
      stageDesc: '',
      precedingStage: '---',
      startDate: '',
      endDate: '',
      qap: ''
    });
    this.resetEditMode();

    const job = this.jobs.find(j => j.jobno === currentJobNo);
    this.currentJob = job ?? null;
    this.existingStages = job?.stages || [];
    this.minStartDate = job?.qcstartdate || '';
    this.currentJobDepartment = job?.department || '';
    this.filterQAPsByDepartment();
    this.updatePrecedingStageOptions();

    if (currentJobNo) {
      this.enableAllControls();
    } else {
      this.disableControlsExceptJobNo();
    }
  }

  private resetEditMode(): void {
    this.isEditMode = false;
    this.editingStageIndex = null;
  }

  private enableAllControls(): void {
    Object.keys(this.stageForm.controls).forEach(controlName => {
      this.stageForm.get(controlName)?.enable();
    });
  }

  private disableControlsExceptJobNo(): void {
    ['stageNo', 'stageDesc', 'precedingStage', 'startDate', 'endDate', 'qap'].forEach(controlName => {
      this.stageForm.get(controlName)?.disable();
      this.stageForm.get(controlName)?.reset();
    });
  }

  private filterQAPsByDepartment(): void {
    this.filteredQAPs = this.currentJobDepartment
      ? this.allQAPs.filter(qap => qap.department === this.currentJobDepartment)
      : [];
  }

  private clearDependentFields(): void {
    this.stageForm.patchValue({
      stageNo: null,
      stageDesc: '',
      precedingStage: '---',
      startDate: '',
      endDate: '',
      qap: ''
    });
    this.filteredQAPs = [];
    this.existingStages = [];
    this.minStartDate = '';
    this.currentJobDepartment = '';
    this.currentJob = null;
  }

  private updatePrecedingStageOptions(): void {
    const currentStageNo = this.stageForm.get('stageNo')?.value;
    this.precedingStageOptions = this.existingStages
      .filter(stage => stage.stageNo !== currentStageNo)
      .map(stage => stage.stageNo.toString());

    this.precedingStageOptions.unshift('---');
  }

  private updateStartDateValidatorBasedOnPreceding(precedingStageNo: string): void {
    if (precedingStageNo && precedingStageNo !== '---') {
      const precedingStage = this.existingStages.find(s => s.stageNo.toString() === precedingStageNo);
      if (precedingStage?.endDate) {
        this.minStartDate = precedingStage.endDate;
        this.stageForm.get('startDate')?.updateValueAndValidity();
      }
    } else {
      this.minStartDate = this.currentJob?.qcstartdate || '';
      this.stageForm.get('startDate')?.updateValueAndValidity();
    }
  }
}
