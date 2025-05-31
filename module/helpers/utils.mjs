export function range(begin, end, interval = 1) {
  const agg = [];

  for (let i = begin; i <= end; i += interval) {
    agg.push(i);
  }

  return agg;
}
