export function* range(begin, end, interval = 1) {
  for (let i = begin; i <= end; i += interval) {
    yield i;
  }
}

export function transformAsChoices(values) {
  const choices = {};

  for (const i of values) {
    choices[i] = i;
  }

  return choices;
}
