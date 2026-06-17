/** URL-safe, collision-resistant id without extra deps. */
export function createId(prefix = ""): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  const id = `${time}${rand}`;
  return prefix ? `${prefix}_${id}` : id;
}
