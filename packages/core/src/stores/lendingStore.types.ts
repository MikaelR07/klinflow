// Strictly isolated types for the Lending Domain
export interface LendingState {
  isLoading: boolean;
  error: string | null;
  // Domain entities
  loans: any[];
}
