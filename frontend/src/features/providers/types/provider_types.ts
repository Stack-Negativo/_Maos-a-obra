import type { Specialty } from "@/features/specialties/types/specialty_types";

export type ProviderProfile = {
  id: string;
  userId?: string;
  name: string;
  photoUrl?: string;
  bio: string;
  specialties: Specialty[];
  ratingAverage: number;
  completedServices: number;
  isSuspended: boolean;
};

export type ProviderPayload = {
  name: string;
  bio: string;
  specialties: Specialty[];
};
