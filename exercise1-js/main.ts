const fakeFetch = (id: number): Promise<string> => new Promise((resolve) => setTimeout(() => resolve(`result ${id}`), 100));

function createRateLimitedFetcher(
  fetchFn: (id: number) => Promise<string>,
  { maxRequests, perMilliseconds }: { maxRequests: number; perMilliseconds: number },
): (id: number) => Promise<string> {
  return;
}

function main() {
  const limitedFetch: (id: number) => Promise<string> = createRateLimitedFetcher(fakeFetch, {
    maxRequests: 2,
    perMilliseconds: 2000,
  });

  limitedFetch(1).then(console.log);
  limitedFetch(2).then(console.log);
  limitedFetch(3).then(console.log);
  limitedFetch(4).then(console.log);
  limitedFetch(5).then(console.log);
}

main();
