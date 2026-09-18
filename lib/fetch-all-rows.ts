/** PostgREST (Supabase) default max_rows per request — paginate past this to load full tables. */
const SUPABASE_PAGE_SIZE = 1000

/**
 * Fetches all rows from a Supabase query by paging with `.range(from, to)`.
 * Use whenever a table may exceed PostgREST's 1000-row default limit.
 *
 * Note: Supabase's PostgrestFilterBuilder is thenable (PromiseLike) but not a full
 * Promise — so we accept PromiseLike here to keep call sites type-safe without casts.
 */
export async function fetchAllRows<T>(
  queryPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  while (true) {
    const to = from + SUPABASE_PAGE_SIZE - 1
    const { data, error } = await queryPage(from, to)
    if (error) throw error
    const batch = data ?? []
    all.push(...batch)
    if (batch.length < SUPABASE_PAGE_SIZE) break
    from += SUPABASE_PAGE_SIZE
  }
  return all
}
