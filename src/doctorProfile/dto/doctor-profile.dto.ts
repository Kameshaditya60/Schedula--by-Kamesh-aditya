export class CreateDoctorProfileDto {
  specialization: string;
  years_experience: number;
  qualifications: string;
  clinic_name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}
