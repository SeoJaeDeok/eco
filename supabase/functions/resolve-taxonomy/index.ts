import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import {
  type AcceptedTaxonCandidate,
  createCandidateResult,
  interpretGbifSpeciesMatch,
} from "./gbif_mapper.ts";
import {
  createSourceAttribution,
  deriveBroadTaxonFromLineage,
  GBIF_CHECKLIST_KEY,
  GBIF_MATCH_ENDPOINT,
  GBIF_REQUEST_TIMEOUT_MS,
  normalizeScientificNameInput,
  TAXONOMY_SOURCE_NAME,
  type TaxonomyLineage,
} from "./taxonomy_core.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TaxonomyActionRequest =
  | {
    action: "resolve";
    scientificName: string;
  }
  | {
    action: "confirm";
    scientificName: string;
    acceptedSourceTaxonKey: string;
  };

interface TaxaRow {
  id: string;
  source: string;
  source_checklist_key: string;
  source_taxon_key: string;
  accepted_scientific_name: string;
  canonical_name: string | null;
  terminal_rank: string;
  taxonomic_status: string;
  kingdom_key: string | null;
  kingdom_name: string | null;
  phylum_key: string | null;
  phylum_name: string | null;
  class_key: string | null;
  class_name: string | null;
  order_key: string | null;
  order_name: string | null;
  family_key: string | null;
  family_name: string | null;
  genus_key: string | null;
  genus_name: string | null;
  species_key: string | null;
  species_name: string | null;
  classification_json: unknown;
  resolved_at: string;
  updated_at: string;
}

interface ResolutionCacheRow {
  id: string;
  source: string;
  source_checklist_key: string;
  normalized_input: string;
  reported_scientific_name: string;
  taxon_id: string;
  match_type: string;
  confidence: number | null;
  synonym: boolean;
  requires_confirmation: boolean;
  issues_json: unknown;
  resolved_at: string;
  updated_at: string;
}

interface FunctionEnv {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface HandlerDependencies {
  fetch: typeof fetch;
  getEnv: (key: keyof FunctionEnv) => string | undefined;
  createClient: typeof createClient;
  now: () => string;
}

const defaultDependencies: HandlerDependencies = {
  fetch,
  getEnv: (key) => Deno.env.get(key),
  createClient,
  now: () => new Date().toISOString(),
};

const jsonResponse = (body: unknown, init: ResponseInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");

  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
};

const errorResult = (
  reason:
    | "invalid_input"
    | "unauthorized"
    | "rate_limited"
    | "timeout"
    | "upstream_failure"
    | "database_failure"
    | "malformed_response"
    | "invalid_confirmation",
  retryable: boolean,
) => ({
  status: "error",
  reason,
  retryable,
  messageKey: "taxonomy.error",
} as const);

const blockedResult = (
  reason:
    | "higher_rank_only"
    | "no_match"
    | "unsupported_terminal_rank"
    | "ambiguous_result"
    | "incomplete_accepted_identity"
    | "malformed_upstream_response",
  reportedScientificName: string,
  matchType: string | null,
) => ({
  status: "blocked",
  reason,
  reportedScientificName,
  matchType,
  retryable: false,
  messageKey: "taxonomy.blocked",
} as const);

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const readRequestBody = async (
  request: Request,
): Promise<TaxonomyActionRequest | null> => {
  try {
    const body = await request.json();

    if (
      !isObject(body) || typeof body.action !== "string" ||
      typeof body.scientificName !== "string"
    ) {
      return null;
    }

    if (body.action === "resolve") {
      return {
        action: "resolve",
        scientificName: body.scientificName,
      };
    }

    if (
      body.action === "confirm" &&
      typeof body.acceptedSourceTaxonKey === "string"
    ) {
      return {
        action: "confirm",
        scientificName: body.scientificName,
        acceptedSourceTaxonKey: body.acceptedSourceTaxonKey,
      };
    }

    return null;
  } catch {
    return null;
  }
};

const getRequiredEnv = (deps: HandlerDependencies): FunctionEnv | null => {
  const SUPABASE_URL = deps.getEnv("SUPABASE_URL");
  const SUPABASE_ANON_KEY = deps.getEnv("SUPABASE_ANON_KEY");
  const SUPABASE_SERVICE_ROLE_KEY = deps.getEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  return {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
  };
};

const authenticateRequest = async (
  request: Request,
  env: FunctionEnv,
  deps: HandlerDependencies,
) => {
  const authorization = request.headers.get("Authorization") ?? "";

  if (!authorization.toLocaleLowerCase("en-US").startsWith("bearer ")) {
    return false;
  }

  const userClient = deps.createClient(
    env.SUPABASE_URL,
    env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );

  const { data, error } = await userClient.auth.getUser();
  return !error && Boolean(data.user);
};

const createAdminClient = (env: FunctionEnv, deps: HandlerDependencies) => {
  return deps.createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
};

const lineageFromTaxaRow = (row: TaxaRow): TaxonomyLineage => ({
  kingdom: { key: row.kingdom_key, name: row.kingdom_name },
  phylum: { key: row.phylum_key, name: row.phylum_name },
  class: { key: row.class_key, name: row.class_name },
  order: { key: row.order_key, name: row.order_name },
  family: { key: row.family_key, name: row.family_name },
  genus: { key: row.genus_key, name: row.genus_name },
  species: { key: row.species_key, name: row.species_name },
});

const resolvedResultFromTaxaRow = (
  row: TaxaRow,
  metadata: {
    reportedScientificName: string;
    matchType: string;
    confidence: number | null;
    synonym: boolean;
    cacheHit: boolean;
    resolvedAt?: string;
  },
) => {
  const lineage = lineageFromTaxaRow(row);

  return {
    status: "resolved",
    taxonId: row.id,
    reportedScientificName: metadata.reportedScientificName,
    acceptedScientificName: row.accepted_scientific_name,
    canonicalName: row.canonical_name,
    terminalRank: row.terminal_rank,
    taxonomicStatus: row.taxonomic_status,
    lineage,
    matchType: metadata.matchType,
    confidence: metadata.confidence,
    synonym: metadata.synonym,
    broadTaxon: deriveBroadTaxonFromLineage(lineage),
    source: createSourceAttribution(row.source_taxon_key),
    resolvedAt: metadata.resolvedAt ?? row.resolved_at,
    cacheHit: metadata.cacheHit,
    messageKey: "taxonomy.resolved",
  } as const;
};

const candidateResultFromCachedRows = (
  reportedScientificName: string,
  taxon: TaxaRow,
  resolution: ResolutionCacheRow,
) => {
  const lineage = lineageFromTaxaRow(taxon);

  return {
    status: "needsConfirmation",
    reportedScientificName,
    candidate: {
      acceptedSourceTaxonKey: taxon.source_taxon_key,
      acceptedScientificName: taxon.accepted_scientific_name,
      canonicalName: taxon.canonical_name,
      terminalRank: taxon.terminal_rank,
      taxonomicStatus: taxon.taxonomic_status,
      lineage,
      matchType: resolution.match_type,
      confidence: resolution.confidence,
      synonym: resolution.synonym,
      reason: resolution.synonym ? "synonym" : "variant",
      broadTaxon: deriveBroadTaxonFromLineage(lineage),
      source: createSourceAttribution(taxon.source_taxon_key),
    },
    cacheHit: true,
    retryable: false,
    messageKey: "taxonomy.confirmationRequired",
  } as const;
};

const getCachedResolution = async (
  adminClient: SupabaseClient,
  normalizedInput: string,
) => {
  const { data, error } = await adminClient
    .from("taxonomy_name_resolutions")
    .select("*")
    .eq("source", TAXONOMY_SOURCE_NAME)
    .eq("source_checklist_key", GBIF_CHECKLIST_KEY)
    .eq("normalized_input", normalizedInput)
    .maybeSingle();

  if (error) {
    throw new Error("resolution_cache_read_failed");
  }

  return data as ResolutionCacheRow | null;
};

const getTaxonById = async (adminClient: SupabaseClient, taxonId: string) => {
  const { data, error } = await adminClient
    .from("taxa")
    .select("*")
    .eq("id", taxonId)
    .maybeSingle();

  if (error) {
    throw new Error("taxa_read_failed");
  }

  return data as TaxaRow | null;
};

const getAcceptedTaxonByInput = async (
  adminClient: SupabaseClient,
  normalizedInput: string,
) => {
  const escapedInput = normalizedInput.replace(
    /[\\%_]/g,
    (value) => `\\${value}`,
  );

  const { data: acceptedNameData, error: acceptedNameError } = await adminClient
    .from("taxa")
    .select("*")
    .eq("source", TAXONOMY_SOURCE_NAME)
    .eq("source_checklist_key", GBIF_CHECKLIST_KEY)
    .ilike("accepted_scientific_name", escapedInput)
    .limit(2);

  if (acceptedNameError) {
    throw new Error("taxa_read_failed");
  }

  const { data: canonicalNameData, error: canonicalNameError } =
    await adminClient
      .from("taxa")
      .select("*")
      .eq("source", TAXONOMY_SOURCE_NAME)
      .eq("source_checklist_key", GBIF_CHECKLIST_KEY)
      .ilike("canonical_name", escapedInput)
      .limit(2);

  if (canonicalNameError) {
    throw new Error("taxa_read_failed");
  }

  const rowsById = new Map<string, TaxaRow>();
  for (
    const row of [
      ...(acceptedNameData ?? []),
      ...(canonicalNameData ?? []),
    ] as TaxaRow[]
  ) {
    rowsById.set(row.id, row);
  }

  const rows = [...rowsById.values()];
  if (rows.length === 1) {
    return rows[0];
  }

  if (rows.length > 1) {
    throw new Error("taxa_ambiguous_cache_hit");
  }

  return null;
};

const fetchGbifSpeciesMatch = async (
  reportedScientificName: string,
  deps: HandlerDependencies,
) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    GBIF_REQUEST_TIMEOUT_MS,
  );

  try {
    const url = new URL(GBIF_MATCH_ENDPOINT);
    url.searchParams.set("scientificName", reportedScientificName);
    url.searchParams.set("checklistKey", GBIF_CHECKLIST_KEY);

    const response = await deps.fetch(url, {
      method: "GET",
      signal: controller.signal,
    });

    if (response.status === 429) {
      return { ok: false, reason: "rate_limited" as const };
    }

    if (!response.ok) {
      return { ok: false, reason: "upstream_failure" as const };
    }

    try {
      return {
        ok: true,
        data: await response.json(),
      } as const;
    } catch {
      return { ok: false, reason: "malformed_response" as const };
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "timeout" as const };
    }

    return { ok: false, reason: "upstream_failure" as const };
  } finally {
    clearTimeout(timeoutId);
  }
};

const taxonRowFromCandidate = (taxon: AcceptedTaxonCandidate, now: string) => ({
  source: TAXONOMY_SOURCE_NAME,
  source_checklist_key: GBIF_CHECKLIST_KEY,
  source_taxon_key: taxon.sourceTaxonKey,
  accepted_scientific_name: taxon.acceptedScientificName,
  canonical_name: taxon.canonicalName,
  terminal_rank: taxon.terminalRank,
  taxonomic_status: taxon.taxonomicStatus,
  kingdom_key: taxon.lineage.kingdom.key,
  kingdom_name: taxon.lineage.kingdom.name,
  phylum_key: taxon.lineage.phylum.key,
  phylum_name: taxon.lineage.phylum.name,
  class_key: taxon.lineage.class.key,
  class_name: taxon.lineage.class.name,
  order_key: taxon.lineage.order.key,
  order_name: taxon.lineage.order.name,
  family_key: taxon.lineage.family.key,
  family_name: taxon.lineage.family.name,
  genus_key: taxon.lineage.genus.key,
  genus_name: taxon.lineage.genus.name,
  species_key: taxon.lineage.species.key,
  species_name: taxon.lineage.species.name,
  classification_json: {
    source: TAXONOMY_SOURCE_NAME,
    checklistKey: GBIF_CHECKLIST_KEY,
    sourceTaxonKey: taxon.sourceTaxonKey,
    acceptedScientificName: taxon.acceptedScientificName,
    canonicalName: taxon.canonicalName,
    terminalRank: taxon.terminalRank,
    taxonomicStatus: taxon.taxonomicStatus,
    lineage: taxon.lineage,
  },
  resolved_at: now,
});

const upsertTaxon = async (
  adminClient: SupabaseClient,
  taxon: AcceptedTaxonCandidate,
  now: string,
) => {
  const { data, error } = await adminClient
    .from("taxa")
    .upsert(taxonRowFromCandidate(taxon, now), {
      onConflict: "source,source_checklist_key,source_taxon_key",
    })
    .select("*")
    .single();

  if (error) {
    throw new Error("taxa_upsert_failed");
  }

  return data as TaxaRow;
};

const upsertResolutionCache = async (
  adminClient: SupabaseClient,
  input: {
    normalizedInput: string;
    reportedScientificName: string;
    taxonId: string;
    taxon: AcceptedTaxonCandidate;
    requiresConfirmation: boolean;
    now: string;
  },
) => {
  const { error } = await adminClient
    .from("taxonomy_name_resolutions")
    .upsert({
      source: TAXONOMY_SOURCE_NAME,
      source_checklist_key: GBIF_CHECKLIST_KEY,
      normalized_input: input.normalizedInput,
      reported_scientific_name: input.reportedScientificName,
      taxon_id: input.taxonId,
      match_type: input.taxon.matchType,
      confidence: input.taxon.confidence,
      synonym: input.taxon.synonym,
      requires_confirmation: input.requiresConfirmation,
      issues_json: input.taxon.issues,
      resolved_at: input.now,
    }, {
      onConflict: "source,source_checklist_key,normalized_input",
    });

  if (error) {
    throw new Error("resolution_cache_upsert_failed");
  }
};

const resolveFromCache = async (
  adminClient: SupabaseClient,
  normalizedInput: string,
  reportedScientificName: string,
) => {
  const cachedResolution = await getCachedResolution(
    adminClient,
    normalizedInput,
  );

  if (cachedResolution) {
    const taxon = await getTaxonById(adminClient, cachedResolution.taxon_id);

    if (!taxon) {
      throw new Error("resolution_cache_taxon_missing");
    }

    if (cachedResolution.requires_confirmation) {
      return candidateResultFromCachedRows(
        reportedScientificName,
        taxon,
        cachedResolution,
      );
    }

    return resolvedResultFromTaxaRow(taxon, {
      reportedScientificName,
      matchType: cachedResolution.match_type,
      confidence: cachedResolution.confidence,
      synonym: cachedResolution.synonym,
      cacheHit: true,
      resolvedAt: cachedResolution.resolved_at,
    });
  }

  const acceptedTaxon = await getAcceptedTaxonByInput(
    adminClient,
    normalizedInput,
  );

  if (!acceptedTaxon) {
    return null;
  }

  return resolvedResultFromTaxaRow(acceptedTaxon, {
    reportedScientificName,
    matchType: "EXACT",
    confidence: null,
    synonym: false,
    cacheHit: true,
  });
};

const resolveScientificName = async (
  adminClient: SupabaseClient,
  request: Extract<TaxonomyActionRequest, { action: "resolve" }>,
  deps: HandlerDependencies,
) => {
  const normalized = normalizeScientificNameInput(request.scientificName);

  if (!normalized.ok) {
    return errorResult("invalid_input", false);
  }

  try {
    const cacheResult = await resolveFromCache(
      adminClient,
      normalized.normalizedInput,
      normalized.reportedScientificName,
    );

    if (cacheResult) {
      return cacheResult;
    }
  } catch (error) {
    if (
      error instanceof Error && error.message === "taxa_ambiguous_cache_hit"
    ) {
      return blockedResult(
        "ambiguous_result",
        normalized.reportedScientificName,
        null,
      );
    }

    return errorResult("database_failure", true);
  }

  const gbifResult = await fetchGbifSpeciesMatch(
    normalized.reportedScientificName,
    deps,
  );

  if (!gbifResult.ok) {
    return errorResult(
      gbifResult.reason,
      gbifResult.reason !== "malformed_response",
    );
  }

  const interpretation = interpretGbifSpeciesMatch(
    normalized.reportedScientificName,
    gbifResult.data,
  );

  if (interpretation.kind === "blocked") {
    return blockedResult(
      interpretation.reason,
      interpretation.reportedScientificName,
      interpretation.matchType,
    );
  }

  if (interpretation.kind === "needsConfirmation") {
    return createCandidateResult(
      normalized.reportedScientificName,
      interpretation.taxon,
      false,
    );
  }

  try {
    const now = deps.now();
    const taxon = await upsertTaxon(adminClient, interpretation.taxon, now);
    await upsertResolutionCache(adminClient, {
      normalizedInput: normalized.normalizedInput,
      reportedScientificName: normalized.reportedScientificName,
      taxonId: taxon.id,
      taxon: interpretation.taxon,
      requiresConfirmation: false,
      now,
    });

    return resolvedResultFromTaxaRow(taxon, {
      reportedScientificName: normalized.reportedScientificName,
      matchType: interpretation.taxon.matchType,
      confidence: interpretation.taxon.confidence,
      synonym: interpretation.taxon.synonym,
      cacheHit: false,
      resolvedAt: now,
    });
  } catch {
    return errorResult("database_failure", true);
  }
};

const confirmScientificName = async (
  adminClient: SupabaseClient,
  request: Extract<TaxonomyActionRequest, { action: "confirm" }>,
  deps: HandlerDependencies,
) => {
  const normalized = normalizeScientificNameInput(request.scientificName);
  const acceptedSourceTaxonKey = request.acceptedSourceTaxonKey.trim();

  if (!normalized.ok || !acceptedSourceTaxonKey) {
    return errorResult("invalid_input", false);
  }

  try {
    const cachedResolution = await getCachedResolution(
      adminClient,
      normalized.normalizedInput,
    );
    if (cachedResolution) {
      const taxon = await getTaxonById(adminClient, cachedResolution.taxon_id);
      if (taxon?.source_taxon_key === acceptedSourceTaxonKey) {
        return resolvedResultFromTaxaRow(taxon, {
          reportedScientificName: normalized.reportedScientificName,
          matchType: cachedResolution.match_type,
          confidence: cachedResolution.confidence,
          synonym: cachedResolution.synonym,
          cacheHit: true,
          resolvedAt: cachedResolution.resolved_at,
        });
      }
    }
  } catch {
    return errorResult("database_failure", true);
  }

  const gbifResult = await fetchGbifSpeciesMatch(
    normalized.reportedScientificName,
    deps,
  );

  if (!gbifResult.ok) {
    return errorResult(
      gbifResult.reason,
      gbifResult.reason !== "malformed_response",
    );
  }

  const interpretation = interpretGbifSpeciesMatch(
    normalized.reportedScientificName,
    gbifResult.data,
  );

  if (interpretation.kind === "blocked") {
    return blockedResult(
      interpretation.reason,
      interpretation.reportedScientificName,
      interpretation.matchType,
    );
  }

  const taxon = interpretation.taxon;

  if (taxon.sourceTaxonKey !== acceptedSourceTaxonKey) {
    return errorResult("invalid_confirmation", false);
  }

  try {
    const now = deps.now();
    const taxonRow = await upsertTaxon(adminClient, taxon, now);
    await upsertResolutionCache(adminClient, {
      normalizedInput: normalized.normalizedInput,
      reportedScientificName: normalized.reportedScientificName,
      taxonId: taxonRow.id,
      taxon,
      requiresConfirmation: interpretation.kind === "needsConfirmation",
      now,
    });

    return resolvedResultFromTaxaRow(taxonRow, {
      reportedScientificName: normalized.reportedScientificName,
      matchType: taxon.matchType,
      confidence: taxon.confidence,
      synonym: taxon.synonym,
      cacheHit: false,
      resolvedAt: now,
    });
  } catch {
    return errorResult("database_failure", true);
  }
};

export const handleRequest = async (
  request: Request,
  deps: HandlerDependencies = defaultDependencies,
) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return jsonResponse(errorResult("invalid_input", false), { status: 405 });
  }

  const env = getRequiredEnv(deps);
  if (!env) {
    return jsonResponse(errorResult("database_failure", true), { status: 500 });
  }

  const isAuthenticated = await authenticateRequest(request, env, deps);
  if (!isAuthenticated) {
    return jsonResponse(errorResult("unauthorized", false), { status: 401 });
  }

  const body = await readRequestBody(request);
  if (!body) {
    return jsonResponse(errorResult("invalid_input", false), { status: 400 });
  }

  const adminClient = createAdminClient(env, deps);
  const result = body.action === "resolve"
    ? await resolveScientificName(adminClient, body, deps)
    : await confirmScientificName(adminClient, body, deps);
  const responseStatus = result.status === "error" &&
      result.reason === "invalid_confirmation"
    ? 409
    : 200;

  return jsonResponse(result, { status: responseStatus });
};

if (import.meta.main) {
  Deno.serve((request) => handleRequest(request));
}
