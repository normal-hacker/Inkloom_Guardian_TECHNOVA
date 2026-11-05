export interface DiffToken {
  type: 'equal' | 'insert' | 'delete';
  value: string;
}

/**
 * Computes word-level diff between two versions of text
 */
export function diffWords(oldText: string, newText: string): DiffToken[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);

  const diffs: DiffToken[] = [];
  let i = 0;
  let j = 0;

  while (i < oldWords.length && j < newWords.length) {
    if (oldWords[i] === newWords[j]) {
      diffs.push({ type: 'equal', value: oldWords[i] });
      i++;
      j++;
    } else {
      // Lookahead matching
      const nextMatchInNew = newWords.indexOf(oldWords[i], j);
      const nextMatchInOld = oldWords.indexOf(newWords[j], i);

      if (nextMatchInNew !== -1 && (nextMatchInOld === -1 || nextMatchInNew - j <= nextMatchInOld - i)) {
        while (j < nextMatchInNew) {
          diffs.push({ type: 'insert', value: newWords[j] });
          j++;
        }
      } else if (nextMatchInOld !== -1) {
        while (i < nextMatchInOld) {
          diffs.push({ type: 'delete', value: oldWords[i] });
          i++;
        }
      } else {
        diffs.push({ type: 'delete', value: oldWords[i] });
        diffs.push({ type: 'insert', value: newWords[j] });
        i++;
        j++;
      }
    }
  }

  while (i < oldWords.length) {
    diffs.push({ type: 'delete', value: oldWords[i] });
    i++;
  }

  while (j < newWords.length) {
    diffs.push({ type: 'insert', value: newWords[j] });
    j++;
  }

  return diffs;
}
