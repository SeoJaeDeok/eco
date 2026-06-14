import type { CreateObservationInput } from '../types';

type RequiredObservationInputField = 'name' | 'taxon' | 'location' | 'date' | 'coords';

export interface ObservationValidationResult {
  isValid: boolean;
  missingFields: RequiredObservationInputField[];
}

export const validateObservationInput = (input: Partial<CreateObservationInput>): ObservationValidationResult => {
  const missingFields: RequiredObservationInputField[] = [];

  if (!input.name?.trim()) missingFields.push('name');
  if (!input.taxon) missingFields.push('taxon');
  if (!input.location?.trim()) missingFields.push('location');
  if (!input.date?.trim()) missingFields.push('date');
  if (!input.coords) missingFields.push('coords');

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
};
