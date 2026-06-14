export interface Observation {
  id: string;
  name: string;
  scientificName: string;
  taxon: string;
  location: string;
  date: string;
  description: string;
  coords: { lat: number; lng: number };
  imageUrl: string;
  isFixed?: boolean;
  createdAt?: any;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
  }
}
