
export enum DeviceType {
  RAC = 'Doméstico (RAC)',
  CAC = 'Comercial (CAC)',
  DVM = 'Sistemas VRF (DVM S)',
  FJM = 'Multi-Split (FJM)',
  EHS = 'Aerotermia (EHS)'
}

export interface TroubleshootingStep {
  instruction: string;
  detail: string;
}

export interface ErrorDiagnosis {
  code: string;
  title: string;
  description: string;
  possibleCauses: string[];
  steps: TroubleshootingStep[];
  severity: 'low' | 'medium' | 'high';
}

export interface SearchHistory {
  code: string;
  timestamp: number;
  deviceType: DeviceType;
}
