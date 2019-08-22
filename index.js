/* eslint no-bitwise: 0 */

const { parse } = require('graphql/language/parser');

function nonSecureHash(s) {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    let char = s.charCodeAt(i);
    const mixed = (hash << 5) - hash;
    hash = mixed + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

class NotFragment {
  constructor(value) {
    this.name = String(value);
  }

  collectFragments(acc) {
    return acc;
  }
}

class Fragment {
  constructor(segments, childFragments) {
    this.segments = segments;
    this.childFragments = childFragments.map(f => {
      if (!(f instanceof Fragment)) {
        return new NotFragment(f);
      }
      return f;
    });

    const hash = nonSecureHash([...segments, ...this.childNames()].join(''));
    this.name = `fragment_${Math.abs(hash).toString(36)}`;
  }

  format() {
    return `fragment ${this.name} ${interleaveStrings(
      this.segments,
      this.childNames()
    ).replace('...', '')}`;
  }

  childNames() {
    return this.childFragments.map(f => f.name);
  }

  collectFragments(acc) {
    const children = this.childFragments.reduce(
      (acc, f) => f.collectFragments(acc),
      acc
    );
    return [this, ...children];
  }
}

function createFragment(segments, ...childFragments) {
  return new Fragment(segments, childFragments);
}

function interleaveStrings(array1, array2) {
  return array1.map((string, i) => string + (array2[i] || '')).join('');
}

function uniqueFragments(collectedFragments) {
  const uniqueFragmentMap = {};
  for (const fragment of collectedFragments) {
    uniqueFragmentMap[fragment.name] = fragment;
  }
  return Object.keys(uniqueFragmentMap)
    .sort()
    .map(name => uniqueFragmentMap[name]);
}

function createQuery(segments, ...childFragments) {
  const root = new Fragment([], childFragments);
  const collectedFragments = root.collectFragments([]);
  collectedFragments.shift(); // Skip root

  const fragmentsString = uniqueFragments(collectedFragments)
    .map(fragment => fragment.format())
    .join('\n');
  const clonedSegments = segments.slice();
  clonedSegments[clonedSegments.length - 1] += fragmentsString;
  return parse(interleaveStrings(clonedSegments, root.childNames()));
}

module.exports = {
  createQuery,
  createFragment
};
