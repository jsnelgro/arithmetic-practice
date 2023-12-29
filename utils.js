export function expect(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

export function withLRUCache(store, key, fn, maxSize = 100) {
    // Ensure the key is a string, throw an error otherwise
    // make sure the key is a string so iteration is via insertion order
    if (typeof key !== 'string') {
        throw new Error('withLRUCache: Key must be a string to ensure proper cache behavior.');
    }

    // if the key is already in the cache, move it to the "front"
    if (store[key]) {
        // kinda hacky since it relies on the fact that ecmascript's Object.keys
        // returns an iterator based on insertion order for string keys
        const value = store[key];
        delete store[key];
        store[key] = value;
        return value;
    }
    const res = fn(); // cache miss, compute the value

    // if the cache is full, remove the last item
    const keys = Object.keys(store)
    if (keys.length >= maxSize) {
        const lastKey = keys[keys.length - 1];
        delete store[lastKey];
    }
    store[key] = res;
    return res;
}

const _appCache = window._appCache = {}
export function withGlobalCache(key, fn) {
    return withLRUCache(_appCache, key, fn, 1000)
}

export function formatMsAsS(ms) {
    const res = (ms / 1000)
    return Number.isNaN(res) ? undefined : res.toFixed(2) + "s";
}

export function evaluate(a, b, op) {
    switch (op) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return a / b;
    }
}

export function ifNaN(a, b) {
    return Number.isNaN(a) || a === undefined ? b : a;
}

export function weightedRandomSample(items, weights) {
    const cumulativeWeights = [];
    let totalWeight = 0;

    weights.forEach(weight => {
        totalWeight += weight;
        cumulativeWeights.push(totalWeight);
    })

    const randomNumber = Math.random() * totalWeight;

    for (let i = 0; i < items.length; i++) {
        if (cumulativeWeights[i] >= randomNumber) {
            return items[i];
        }
    }

    console.error("weightedRandomSample: this should never happen");
    return items[items.length - 1];
}