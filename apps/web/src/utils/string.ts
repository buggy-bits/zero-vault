export function truncateString(input: string | undefined, maxLength: number = 100): string {
  if (input === undefined) {
    return '';
  }

  if (input.length <= maxLength) {
    return input;
  }

  return input.slice(0, maxLength) + '...';
}
