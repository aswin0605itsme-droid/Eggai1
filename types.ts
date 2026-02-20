
export interface GenderPredictionResult {
  predictedGender: 'Male' | 'Female' | 'Uncertain';
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

export interface AnalysisRecord {
  timestamp: string;
  batchNumber: string;
  analysisType: 'Image' | 'Live Camera' | 'Calculator';
  gender: string;
  confidence: string;
  reasoning: string;
}

export interface GroundingSource {
  web?: {
    uri: string;
    title: string;
  };
}
