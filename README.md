deepmapper
=============

[![CircleCI](https://circleci.com/gh/enkidevs/deepmapper.svg?style=svg)](https://circleci.com/gh/enkidevs/deepmapper)
[![npm version](https://img.shields.io/npm/v/@enkidevs/deepmapper.svg?style=flat-square)](https://www.npmjs.com/package/@enkidevs/deepmapper)

Map an arbitrary JS structure by altering any portion of it, including itself.

```js
const obj = {
  a: [
    1,
    2,
    {
      value: 3
    },
    {
      child: [
        4,
        {
          value: 5
        }
      ]
    }
  ],
  b: 6,
  c: {
    value: 7
  }
};

const result = deepMapper(x => {
  if (Array.isArray(x)) {
    return x.slice();
  }
  if (typeof x === "number") {
    return 2 ** x;
  }
  return { ...x };
});

// gives
/*
const obj = {
  a: [
    2,
    4,
    {
      value: 8,
    },
    {
      child: [
        16,
        {
          value: 32
        }
      ]
    },
  ],
  b: 64,
  c: {
    value: 128
  }
};
*/
```

The mapping is done as a [pre-order traversal](https://en.wikipedia.org/wiki/Tree_traversal#Pre-order_(NLR)).
This means that, if you change the parent by removing some of its children, the removed children won't be mapped.

```js
deepMapper({ child: { value: 'x' }}, item => ({
  child: 'I am changed'
}))

// gives
/*
{
  child: 'I am changed'
}
*/
```

Commonly, you'd want to do mapping in an immutable fashion:

```js
deepMapper({
  nested: [
    1,
    'test',
    {
      bottom: true
    }
  ]
}, item => {
  if (Array.isArray(item)) {
    return item.slice() // this will do a shallow copy of the nested array but not its values
  }
  if (item && typeof item === 'object') {
    return { ...item }; // this will do a shallow copy of the top object, and the object with the 'bottom' key
  }
  // primitives in JS are immutable so we're fine here
  return item;
})
```

The above will essentially perform a clone operation on the above object.

Here's how you'd write a deep clone function using `deepmapper` and `shallow-clone` to handle all possible values:

```js
const deepMapper = require("@enkidevs/deepmapper");
const shallowClone = require("shallow-clone");

const obj = { a: [{ b: "test" }, 1, /abc/], c: false, d: new Date(2) };
const cloned = deepMapper(obj, shallowClone);
```

## Features

- Can map any primitive value

```js
deepMapper(1, n => n + 1) === 2        // true
deepMapper('a', s => s + 'b') === 'ab' // true
deepMapper(true, b => !b) === false    // true
// ...
```

- Handles circular references

```js
// circular references get properly mapped
const obj = { a: [1, 2, 3], b: { loop: null } };
obj.b.loop = obj.a;

const result = deepMapper(obj, item => {
  if (Array.isArray(item)) {
    return item.slice();
  }
  if (item && typeof item === 'object') {
    return { ...item };
  }
  return item + 1;
})

// gives
/*
{
  a: [2, 3, 4],
  b: {
    loop: // points to the mapped result.a, not the original obj.a
  },
};
*/
```

- Doesn't break on repeated references

```js
const ref = { a: [1, 2, 3] };
const arr = [ref, ref, { b: ref }, { c: { value: ref } }];

const result = deepMapper(arr, item => {
  if (Array.isArray(item)) {
    return item.slice();
  }
  if (item && typeof item === 'object') {
    return { ...item };
  }
  return item + 1;
});

// gives
/*
{ a: [2, 3, 4] },
{ a: [2, 3, 4] },
{ b: { a: [2, 3, 4] } },
{ c: { value: { a: [2, 3, 4] } } },
*/
```

## Practical examples

- Obfuscate MongoDB object by changing all MongoDB ObjectID `_id` keys to `id`:

```js
function cleanMongoId(item) {
  if (Array.isArray(item)) {
    return item.slice();
  }
  if (isObject(item)) {
    if (ObjectId.isValid(item)) {
      return item;
    }
    // only change the _id property if it's a valid ObjectId
    if (ObjectId.isValid(item._id)) {
      const { _id, ...cleanItem } = item;
      if (_id) {
        cleanItem.id = _id;
      }
      return cleanItem;
    }
    return { ...item };
  }
  return item;
}

const id1 = ObjectId();
const id2 = ObjectId();
const doc = [
  { nested1: { _id: id1, whatever: 5 } },
  { nested2: { _id: id2, whatever: 5 } },
];

const result = deepMapper(doc, cleanMongoId);

// gives
/*
[
  { nested1: { id: id1, whatever: 5 } },
  { nested2: { id: id2, whatever: 5 } },
]
*/
```

- Changing state structures in a Redux reducer:

```js
// ...
const state = {
  items: [
    {
      id: 'todo-1',
      data: {
        createdAt: Date,
        updatedAt: Date,
        order: Number,
        text: 'yipikaye'
      }
    },
    // ...
  ]
}
// ... somewhere in a reducer for action { type: 'CHANGE_UPDATED_AT' id: 'todo-1', updatedAt: new Date() }
case [CHANGE_UPDATED_AT]:
  return deepMapper(state, chunk => {
    if (Array.isArray(chunk)) {
      return chunk.slice();
    }
    if (chunk && typeof chunk === 'object') {
      if (chunk.id === action.id) {
        return {...chunk, updatedAt: action.updatedAt };
      }
      return {...chunk };
    }
    return chunk;
  })
```

## License

MIT
