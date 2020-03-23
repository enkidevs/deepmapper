const isObject = require('lodash.isobject');
const deepMapper = require('..');

describe('deepMapper should map arbitrary nested structures', () => {
  test('should do nothing without a mapper function', () => {
    const obj = {};
    expect(deepMapper(obj)).toBe(obj);
  });

  test('should map a primitive', () => {
    expect(deepMapper(1, (n) => n + 1)).toEqual(2);
  });

  test('should map a single array', () => {
    const arr = [1, 2, 3];
    const result = deepMapper(arr, (n) =>
      typeof n === 'number' ? n + 1 : n.slice()
    );
    expect(result).toEqual(arr.map((n) => n + 1));
  });

  test('should map a single object', () => {
    const obj = { a: 1, b: 2, c: 3 };
    const result = deepMapper(obj, (n) =>
      typeof n === 'number' ? n + 1 : { ...n }
    );
    expect(result).toEqual({ a: 2, b: 3, c: 4 });
  });

  test('should map parent before a child', () => {
    expect(
      deepMapper({ child: { value: 'x' } }, (item) => {
        if (isObject(item)) {
          return {
            child: 'I am changed',
          };
        }
        return item;
      })
    ).toEqual({
      child: 'I am changed',
    });
  });

  test('should map every object in array', () => {
    const arr = [{ a: 1 }, { b: 2 }, { c: 3 }];
    expect(
      deepMapper(arr, (item) => {
        if (Array.isArray(item)) {
          return item.slice();
        }
        if (isObject(item)) {
          return { ...item };
        }
        return item + 1;
      })
    ).toEqual([{ a: 2 }, { b: 3 }, { c: 4 }]);
  });

  test('should map a nested structure', () => {
    const arr = [{ a: [1, 2, 3] }, { b: '1' }, { c: { value: '2' } }];
    expect(
      deepMapper(arr, (item) => {
        if (Array.isArray(item)) {
          return item.slice();
        }
        if (isObject(item)) {
          return { ...item };
        }
        return Number(item) + 1;
      })
    ).toEqual([{ a: [2, 3, 4] }, { b: 2 }, { c: { value: 3 } }]);
  });

  test('should map a nested structure containg same references without a loop', () => {
    const ref = { a: [1, 2, 3] };
    const arr = [ref, ref, { b: ref }, { c: { value: ref } }];
    expect(
      deepMapper(arr, (item) => {
        if (Array.isArray(item)) {
          return item.slice();
        }
        if (isObject(item)) {
          return { ...item };
        }
        return item + 1;
      })
    ).toEqual([
      { a: [2, 3, 4] },
      { a: [2, 3, 4] },
      { b: { a: [2, 3, 4] } },
      { c: { value: { a: [2, 3, 4] } } },
    ]);
  });

  test('shoud map a nested structure but skip circular references', () => {
    const obj = { a: [1, 2, 3], b: { loop: null } };
    obj.b.loop = obj.a;
    const expected = {
      a: [2, 3, 4],
      b: {
        loop: null,
      },
    };
    expected.b.loop = expected.a;
    expect(
      deepMapper(obj, (item) => {
        if (Array.isArray(item)) {
          return item.slice();
        }
        if (isObject(item)) {
          return { ...item };
        }
        return item + 1;
      })
    ).toEqual(expected);
  });
});
