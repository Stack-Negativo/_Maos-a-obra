export type Specialty = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
};

export type SpecialtyRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type SpecialtyRequest = {
  id: string;
  name: string;
  description: string;
  requestedBy: string;
  requestedByName: string;
  status: SpecialtyRequestStatus;
  createdAt: string;
  reviewedAt?: string;
};
