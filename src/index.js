const isObject = require('lodash.isobject');
const forEach = require('lodash.foreach');

module.exports = function deepMapper(
  parent,
  mapper = (x) => x,
  itemToMapped = new Map()
) {
  itemToMapped.set(parent, mapper(parent));
  const mappedParent = itemToMapped.get(parent);
  if (isObject(mappedParent)) {
    forEach(mappedParent, (child, parentLink) => {
      if (!itemToMapped.has(child)) {
        deepMapper(child, mapper, itemToMapped);
      }
      mappedParent[parentLink] = itemToMapped.get(child);
    });
  }

  return mappedParent;
};
