import type { PGlite } from "@electric-sql/pglite";
import type { Sql } from "../src/db.js";

/** Adapts PGlite to the Sql interface. Statements without parameters go through `exec`, which allows several statements (as the pg driver does). */
export function fromPglite(db: PGlite): Sql {
  return {
    query: async (text, params) => {
      if (params === undefined) {
        const results = await db.exec(text);
        return { rows: (results[results.length - 1]?.rows ?? []) as never[] };
      }
      return { rows: (await db.query(text, params as unknown[])).rows as never[] };
    },
  };
}
