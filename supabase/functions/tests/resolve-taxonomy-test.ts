import { assertEquals } from "@std/assert";
import { createClient } from "@supabase/supabase-js";
import { handleRequest } from "../resolve-taxonomy/index.ts";
import { interpretGbifSpeciesMatch } from "../resolve-taxonomy/gbif_mapper.ts";
import {
  deriveBroadTaxonFromLineage,
  normalizeScientificNameInput,
} from "../resolve-taxonomy/taxonomy_core.ts";

Deno.test("normalizes scientific-name input for the resolver", () => {
  const result = normalizeScientificNameInput("  Homo   sapiens  ");

  assertEquals(result.ok, true);
  if (result.ok) {
    assertEquals(result.reportedScientificName, "Homo sapiens");
    assertEquals(result.normalizedInput, "homo sapiens");
  }
});

Deno.test("derives supported broad taxon groups deterministically", () => {
  assertEquals(
    deriveBroadTaxonFromLineage({ class: { key: "IN", name: "Insecta" } }),
    "곤충",
  );
  assertEquals(
    deriveBroadTaxonFromLineage({ class: { key: "AV", name: "Aves" } }),
    "조류",
  );
  assertEquals(
    deriveBroadTaxonFromLineage({ class: { key: "MM", name: "Mammalia" } }),
    "포유류",
  );
  assertEquals(
    deriveBroadTaxonFromLineage({ class: { key: "AM", name: "Amphibia" } }),
    "양서/파충류",
  );
  assertEquals(
    deriveBroadTaxonFromLineage({ kingdom: { key: "P", name: "Plantae" } }),
    "식물",
  );
  assertEquals(
    deriveBroadTaxonFromLineage({ kingdom: { key: "F", name: "Fungi" } }),
    "균류",
  );
  assertEquals(deriveBroadTaxonFromLineage({}), "기타");
});

Deno.test("maps exact GBIF species match to resolved interpretation", () => {
  const result = interpretGbifSpeciesMatch("Homo sapiens", {
    usage: {
      key: "6MB3T",
      name: "Homo sapiens Linnaeus, 1758",
      canonicalName: "Homo sapiens",
      rank: "SPECIES",
      status: "ACCEPTED",
    },
    classification: [
      { key: "N", name: "Animalia", rank: "KINGDOM" },
      { key: "CH2", name: "Chordata", rank: "PHYLUM" },
      { key: "MM", name: "Mammalia", rank: "CLASS" },
      { key: "PR", name: "Primates", rank: "ORDER" },
      { key: "HM", name: "Hominidae", rank: "FAMILY" },
      { key: "H", name: "Homo", rank: "GENUS" },
      { key: "6MB3T", name: "Homo sapiens", rank: "SPECIES" },
    ],
    diagnostics: { matchType: "EXACT", confidence: 99 },
    synonym: false,
  });

  assertEquals(result.kind, "resolved");
});

Deno.test("returns HTTP 409 for mismatched confirmation candidate", async () => {
  interface EmptySelection {
    select: () => EmptySelection;
    eq: () => EmptySelection;
    maybeSingle: () => Promise<{ data: null; error: null }>;
  }

  const createEmptySelection = (): EmptySelection => {
    const selection: EmptySelection = {
      select: () => selection,
      eq: () => selection,
      maybeSingle: () => Promise.resolve({ data: null, error: null }),
    };
    return selection;
  };

  const createClientMock = ((_: string, key: string) => {
    if (key === "local-anon-placeholder") {
      return {
        auth: {
          getUser: () =>
            Promise.resolve({
              data: { user: { id: "local-user" } },
              error: null,
            }),
        },
      } as unknown as ReturnType<typeof createClient>;
    }

    return {
      from: () => createEmptySelection(),
    } as unknown as ReturnType<typeof createClient>;
  }) as typeof createClient;

  const response = await handleRequest(
    new Request("http://local.test/resolve-taxonomy", {
      method: "POST",
      headers: {
        Authorization: "Bearer local-placeholder",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action: "confirm",
        scientificName: "Homo sapines",
        acceptedSourceTaxonKey: "different-safe-key",
      }),
    }),
    {
      fetch: () =>
        Promise.resolve(Response.json({
          usage: {
            key: "expected-safe-key",
            name: "Homo sapiens Linnaeus, 1758",
            canonicalName: "Homo sapiens",
            rank: "SPECIES",
            status: "ACCEPTED",
          },
          classification: [
            { key: "N", name: "Animalia", rank: "KINGDOM" },
            { key: "CH", name: "Chordata", rank: "PHYLUM" },
            { key: "MM", name: "Mammalia", rank: "CLASS" },
            { key: "PR", name: "Primates", rank: "ORDER" },
            { key: "HM", name: "Hominidae", rank: "FAMILY" },
            { key: "H", name: "Homo", rank: "GENUS" },
            { key: "expected-safe-key", name: "Homo sapiens", rank: "SPECIES" },
          ],
          diagnostics: { matchType: "VARIANT", confidence: 90 },
          synonym: false,
        })),
      getEnv: (
        key: "SUPABASE_URL" | "SUPABASE_ANON_KEY" | "SUPABASE_SERVICE_ROLE_KEY",
      ) =>
        ({
          SUPABASE_URL: "local-url-placeholder",
          SUPABASE_ANON_KEY: "local-anon-placeholder",
          SUPABASE_SERVICE_ROLE_KEY: "local-server-placeholder",
        })[key],
      createClient: createClientMock,
      now: () => "2026-01-01T00:00:00.000Z",
    },
  );

  const body = await response.json();

  assertEquals(response.status, 409);
  assertEquals(body.status, "error");
  assertEquals(body.reason, "invalid_confirmation");
});
