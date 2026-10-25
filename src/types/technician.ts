// A person who does the work. Technicians are records only in v0.1: they do not sign in.
export type Technician = {
  id: string;
  name: string;
  specialty: string | null;
  // Technicians who leave are deactivated, not deleted, so old jobs keep their history.
  active: boolean;
};
