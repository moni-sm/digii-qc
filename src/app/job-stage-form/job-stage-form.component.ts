import { Component, OnInit } from '@angular/core';
import { JobStageService } from '../services/job-stage.service';
import { Job, JobStage } from '../../models/job.model';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule, FormBuilder, FormGroup, Validators,
  AbstractControl, ValidationErrors, ValidatorFn
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-stage-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, HttpClientModule],
  templateUrl: './job-stage-form.component.html',
  styleUrls: ['./job-stage-form.component.scss']
})
export class JobStageFormComponent implements OnInit {
  jobs: Job[] = [];
  allQAPs: any[] = [];
  filteredQAPs: any[] = [];
  existingStages: JobStage[] = [];
  minStartDate: string = '';
  currentJobDepartment: string = '';
  Infinity = Infinity;
  stageForm: FormGroup;
  isEditMode = false;
  currentStageNo: number | null = null;

  constructor(
    private readonly jobService: JobStageService,
    private readonly fb: FormBuilder,
    private readonly route: ActivatedRoute,
    private readonly router: Router
  ) {
    this.stageForm = this.fb.group({
      jobNo: ['', Validators.required],
      stageNo: [null, [Validators.required, Validators.min(1)]],
      stageDesc: ['', [Validators.required, Validators.maxLength(20)]],
      precedingStage: ['---'],
      startDate: ['', [Validators.required]],
      endDate: ['', [Validators.required]],
      qap: ['', Validators.required]
    }, {
      validators: [
        this.validateStartEndDateRange()
      ]
    });
  }

  ngOnInit(): void {
    this.jobService.getJobs().subscribe((jobs: Job[]) => {
      this.jobs = jobs;

      // Add uniqueness validator after jobs load
      this.stageForm.addValidators(this.createStageNumberUniquenessValidator());
      this.stageForm.updateValueAndValidity({ onlySelf: true });
    });

    this.jobService.getQAPs().subscribe((qaps: any[]) => {
      this.allQAPs = qaps;
      this.filteredQAPs = qaps;
    });

    // Optimized jobNo valueChanges to reduce latency
    this.stageForm.get('jobNo')?.valueChanges.pipe(
      distinctUntilChanged(),
      debounceTime(200)
    ).subscribe(jobNo => {
      if (!jobNo) {
        this.disableControlsExceptJobNo();
        this.resetJobDependentFields({ emitEvent: false });
        return;
      }

      this.route.params.subscribe(params => {
        const jobNo = params['jobNo'];
        const stageNo = params['stageNo'];

        if (jobNo && stageNo) {
          this.isEditMode = true;
          this.currentStageNo = +stageNo;
          this.loadStageForEdit(jobNo, +stageNo);
        } else {
          this.isEditMode = false;
          this.currentStageNo = null;
        }
      });

      // Direct synchronous update instead of microtask queue
      const job = this.jobs.find(j => j.jobno === jobNo);
      if (job) {
        this.existingStages = job.stages || [];
        this.minStartDate = job.qcstartdate;
        this.currentJobDepartment = job.department;

        this.filteredQAPs = this.allQAPs.filter(qap =>
          qap.department === this.currentJobDepartment
        );

        // Patch related controls efficiently with emitEvent: false
        this.stageForm.patchValue({
          stageNo: null,
          precedingStage: '---',
          startDate: '',
          endDate: '',
          qap: ''
        }, { emitEvent: false });

        this.enableAllControls();
        this.stageForm.setErrors(null);
      } else {
        this.existingStages = [];
        this.minStartDate = '';
        this.currentJobDepartment = '';
        this.filteredQAPs = this.allQAPs;

        this.resetJobDependentFields({ emitEvent: false });
        this.disableControlsExceptJobNo();
      }
    });

    if (!this.stageForm.get('jobNo')?.value) {
      this.disableControlsExceptJobNo();
    }

    this.stageForm.get('stageNo')?.valueChanges.subscribe(() => {
      this.updatePrecedingStageOptions();
    });

    this.stageForm.get('precedingStage')?.valueChanges.subscribe(value => {
      const startDateControl = this.stageForm.get('startDate');

      if (value !== '---') {
        const precedingStage = this.existingStages.find(s => s.stageNo.toString() === value);
        if (precedingStage) {
          startDateControl?.setValidators([
            Validators.required,
            this.validateStartDateAfterPreceding.bind(this, precedingStage.endDate)
          ]);
        }
      } else {
        startDateControl?.setValidators([
          Validators.required,
          this.validateStartDate.bind(this)
        ]);
      }

      startDateControl?.updateValueAndValidity({ emitEvent: false });
    });

    this.stageForm.get('startDate')?.valueChanges.subscribe(startDate => {
      const endDateControl = this.stageForm.get('endDate');
      const endDate = endDateControl?.value;

      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        endDateControl?.setValue(startDate, { emitEvent: false });
      }
    });

    this.stageForm.get('endDate')?.valueChanges.subscribe(endDate => {
      const startDateControl = this.stageForm.get('startDate');
      const startDate = startDateControl?.value;

      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        startDateControl?.setValue(endDate, { emitEvent: false });
      }
    });
  }

  // Helper to reset fields depending on job selection without full reset
  private resetJobDependentFields(opts?: { emitEvent?: boolean }) {
    this.stageForm.patchValue({
      stageNo: null,
      stageDesc: '',
      precedingStage: '---',
      startDate: '',
      endDate: '',
      qap: ''
    }, opts);
  }

  private loadStageForEdit(jobNo: string, stageNo: number): void {
    this.jobService.getJobs().subscribe((jobs: Job[]) => {
      this.jobs = jobs;
      const job = jobs.find(j => j.jobno === jobNo);

      if (job && job.stages) {
        this.existingStages = job.stages;
        const stageToEdit = job.stages.find(s => s.stageNo === stageNo);

        if (stageToEdit) {
          this.stageForm.patchValue({
            jobNo: jobNo,
            stageNo: stageToEdit.stageNo,
            stageDesc: stageToEdit.stageDesc,
            precedingStage: stageToEdit.precedingStage,
            startDate: stageToEdit.startDate,
            endDate: stageToEdit.endDate,
            qap: stageToEdit.qap
          });

          // Disable jobNo and stageNo in edit mode
          this.stageForm.get('jobNo')?.disable();
          this.stageForm.get('stageNo')?.disable();

          this.minStartDate = job.qcstartdate;
          this.currentJobDepartment = job.department;
          this.filteredQAPs = this.allQAPs.filter(qap =>
            qap.department === this.currentJobDepartment
          );
        }
      }
    });
  }

  private disableControlsExceptJobNo() {
    Object.keys(this.stageForm.controls).forEach(controlName => {
      if (controlName !== 'jobNo') {
        const control = this.stageForm.get(controlName);
        if (control?.enabled) {
          control.disable({ emitEvent: false });
        }
      }
    });
  }

  private enableAllControls() {
    Object.keys(this.stageForm.controls).forEach(controlName => {
      const control = this.stageForm.get(controlName);
      if (control?.disabled) {
        control.enable({ emitEvent: false });
      }
    });
  }

  private updatePrecedingStageOptions(): void {
    const currentStageNo = this.stageForm.get('stageNo')?.value;
    if (currentStageNo) {
      const availableStages = this.existingStages.filter(stage =>
        stage.stageNo < currentStageNo
      );
      const currentPreceding = this.stageForm.get('precedingStage')?.value;
      if (currentPreceding !== '---' &&
        !availableStages.some(s => s.stageNo.toString() === currentPreceding)) {
        this.stageForm.get('precedingStage')?.setValue('---', { emitEvent: false });
      }
    }
  }

  private createStageNumberUniquenessValidator(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const jobNo = group.get('jobNo')?.value;
      const stageNo = group.get('stageNo')?.value;

      if (!jobNo || !stageNo) return null;

      const job = this.jobs.find(j => j.jobno === jobNo);
      if (job?.stages) {
        const isDuplicate = job.stages.some(s => s.stageNo === stageNo);
        return isDuplicate ? { stageNumberNotUnique: true } : null;
      }
      return null;
    };
  }

  private validateStartDate(control: AbstractControl): ValidationErrors | null {
    const startDate = new Date(control.value);
    const qcStartDate = new Date(this.minStartDate);
    const precedingStage = this.stageForm?.get('precedingStage')?.value;

    if (precedingStage === '---' && startDate < qcStartDate) {
      return { invalidStartDate: true };
    }
    return null;
  }

  private validateStartDateAfterPreceding(precedingEndDate: string, control: AbstractControl): ValidationErrors | null {
    const startDate = new Date(control.value);
    const endDate = new Date(precedingEndDate);

    if (startDate < endDate) {
      return { startDateBeforePreceding: true };
    }
    return null;
  }

  private validateStartEndDateRange(): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
      const start = group.get('startDate')?.value;
      const end = group.get('endDate')?.value;
      if (start && end && new Date(start) > new Date(end)) {
        return { dateRangeInvalid: true };
      }
      return null;
    };
  }

  onSubmit(): void {
  if (this.stageForm.invalid) {
    this.stageForm.markAllAsTouched();
    return;
  }

  const formValue = this.stageForm.getRawValue();
  const stageData: JobStage = {
    stageNo: formValue.stageNo,
    stageDesc: formValue.stageDesc,
    precedingStage: formValue.precedingStage,
    startDate: formValue.startDate,
    endDate: formValue.endDate,
    qap: formValue.qap
  };

  if (this.isEditMode) {
    this.updateStage(formValue.jobNo, stageData);
  } else {
    this.addNewStage(formValue.jobNo, stageData);
  }
}


private updateStage(jobNo: string, stageData: JobStage): void {
  if (stageData.precedingStage !== '---') {
    const job = this.jobs.find(j => j.jobno === jobNo);
    const otherRootStages = job?.stages?.filter(s =>
      s.stageNo !== this.currentStageNo && s.precedingStage === '---'
    ) || [];

    if (otherRootStages.length === 0) {
      alert('At least one stage in a job should have preceding stage as "---".');
      return;
    }
  }

  this.jobService.updateStage(jobNo, this.currentStageNo!, stageData).subscribe({
    next: () => {
      alert('Stage updated successfully!');
      // Navigate back to list or reset form as needed
    },
    error: (err) => console.error('Error updating stage:', err)
  });
}

private addNewStage(jobNo: string, stageData: JobStage): void {
  this.jobService.addStage(jobNo, stageData).subscribe({
    next: () => {
      alert('Stage added successfully!');

      const currentJobNo = this.stageForm.get('jobNo')?.value;

      this.stageForm.reset({
        jobNo: currentJobNo,
        stageNo: null,
        stageDesc: '',
        precedingStage: '---',
        startDate: '',
        endDate: '',
        qap: ''
      });

      this.existingStages = [];
      this.filteredQAPs = this.allQAPs;
      this.minStartDate = '';
      this.currentJobDepartment = '';
    },
    error: (err: any) => console.error('Error adding stage:', err)
  });
}

}
