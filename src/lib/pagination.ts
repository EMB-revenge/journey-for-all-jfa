/**
 * One page from rows fetched with `take: pageSize + 1`. The extra row only
 * proves a next page exists; the cursor is the last returned row so the next
 * query (`skip: 1`) starts on the following row with no gaps.
 */
export function pageOf<T extends { id: string }>(rows: T[], pageSize: number) {
  const items = rows.slice(0, pageSize);
  return {
    items,
    nextCursor: rows.length > pageSize ? items.at(-1)?.id : undefined,
  };
}
