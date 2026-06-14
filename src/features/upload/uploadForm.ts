import type { CreateObservationFormValues, CreateObservationInput } from '../../types';

const createDefaultUploadDate = () => new Date().toISOString().slice(0, 16).replace('T', ' ');

export const DEFAULT_UPLOAD_FORM_VALUES: CreateObservationFormValues = {
  name: '',
  scientificName: '',
  taxon: '식물',
  location: '경북대학교 캠퍼스',
  date: '',
  description: '',
  coords: null,
  imageFile: null,
  imagePreviewUrl: null,
};

export const createDefaultUploadFormValues = (): CreateObservationFormValues => ({
  ...DEFAULT_UPLOAD_FORM_VALUES,
  date: createDefaultUploadDate(),
});

export const createImagePreviewUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(reader.error ?? new Error('Failed to create image preview.'));
    reader.readAsDataURL(file);
  });
};

export const createObservationInputFromForm = (values: CreateObservationFormValues): CreateObservationInput | null => {
  if (!values.coords) return null;

  return {
    name: values.name,
    scientificName: values.scientificName.trim() ? values.scientificName : undefined,
    taxon: values.taxon,
    location: values.location,
    date: values.date,
    description: values.description.trim() ? values.description : undefined,
    coords: values.coords,
    imageFile: values.imageFile ?? undefined,
    imagePreviewUrl: values.imagePreviewUrl ?? undefined,
  };
};
