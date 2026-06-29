import type { TaxonomyTreeNode, TaxonomyTreeParent } from '../features/taxonomy/taxonomyTree';
import type { ObservationRepositoryKind } from './observationRepository';

export type TaxonomyTreeRepositoryKind = ObservationRepositoryKind;

export interface TaxonomyTreeRepository {
  getRootNodes(): Promise<TaxonomyTreeNode[]>;
  getChildren(parent: TaxonomyTreeParent): Promise<TaxonomyTreeNode[]>;
}
