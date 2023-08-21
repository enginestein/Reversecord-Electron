/**
 * Determine is localStorage can be used.
 */
function localStorageTest() {
  const test = 'test';
  try {
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  }
  catch (e) {
    return false;
  }
}

/**
 * Store everything in local storage.
 */
class LocalStorage {
  /**
   * Get an item from the store.
   *
   * @param {String} key
   * @return {Object|null}
   */
  get(key) {
    let value = localStorage.getItem(key);
    try {
      value = JSON.parse(value);
    }
    catch (e) {}
    return value;
  }

  /**
   * Set an item in the store.
   *
   * @param {String} key
   * @param {Object} value
   */
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Remove an item from the store.
   *
   * @param {String} key
   */
  remove(key) {
    localStorage.removeItem(key);
  }

  /**
   * Clear all items at the store.
   */
  clear() {
    localStorage.clear();
  }
}

/**
 * Mock store that puts everything in an object if localStorage is disabled.
 */
class ObjectStorage {
  constructor() {
    this.storage = {};
  }

  /**
   * Get an item from the store.
   *
   * @param {String} key
   * @return {Object|null}
   */
  get(key) {
    return this.storage[key];
  }

  /**
   * Set an item in the store.
   *
   * @param {String} key
   * @param {Object} value
   */
  set(key, value) {
    this.storage[key] = value;
  }

  /**
   * Remove an item from the store.
   *
   * @param {String} key
   */
  remove(key) {
    delete this.storage[key];
  }

  /**
   * Clear all items at the store.
   */
  clear() {
    this.storage = {};
  }
}

export default localStorageTest() ? new LocalStorage : new ObjectStorage;



/** WEBPACK FOOTER **
 ** ./discord_app/lib/web/Storage.js
 **/