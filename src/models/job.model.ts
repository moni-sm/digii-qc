export interface JobStage {  // Renamed from 'Stage'
  stageNo: number;
  stageDesc: string;
  precedingStage: string | number;
  startDate: string;
  endDate: string;
  qap: string;
}

export interface Job {
  id: string;
  jobno: string;
  jobdescription: string;
  shipid: string;
  shipdesc: string;
  qcstartdate: string;
  department: string;
  stages: JobStage[];
}
