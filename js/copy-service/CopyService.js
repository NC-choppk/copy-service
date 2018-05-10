import _ from 'lodash';

import Parser from './Parser/Parser';

class CopyService {
  constructor(options = {}) {
    /**
     * The store of parsed copy.
     * @type {object}
     */
    this._parsedCopy = {};

    this.registerCopy(options.copy);

    /**
     * Evaluates the parsed copy.
     * @type {Evaluator}
     */
    this.Evaluator = options.Evaluator;
  }

  /**
   * Parses copy into ASTs and stores it.
   * @param  {object} jsonCopyConfig A json object containing copy.
   */
  registerCopy(jsonCopyConfig) {
    if (!jsonCopyConfig) {
      return;
    }

    _.merge(this._parsedCopy, Parser.parseLeaves(jsonCopyConfig));
  }

  /**
   * Evaluates the copy AST at a given key using passed substitutions, returning a plain string of
   * copy. The Evaluator will not include HTML tags and will not evaluate functions. Instead, it
   * will simply return the copy of an Formatting or Functional classes.
   * @param  {string} key
   * @param  {object} [substitutions] Substitutions to be used by the Evaluator when evaluating the
   *                                    AST.
   * @return {string} The evaluated plain-text copy string.
   */
  getCopy(key, substitutions) {
    const ast = this._getAstForKey(key);
    return this.Evaluator.evalAST(this.Evaluator._getInitialResult(), ast, substitutions);
  }

  /**
   * Recursivey builds all subkeys at which copy exists.
   * @param  {string} key
   * @return {Object>} An object of the same structure where the value is the copy key path.
   */
  buildSubkeys(key) {
    const subkeys = this.getSubkeys(key);

    return _.mapValues(subkeys, (obj, path) => {
      const subPath = `${key}.${path}`;
      if (_.isPlainObject(obj)) {
        return this.buildSubkeys(subPath);
      }

      return subPath;
    });
  }

  /**
   * Returns the value at a passed key
   * @param  {string} key
   * @return {object|string} The copy object or copy AST at a given key.
   */
  getSubkeys(key) {
    return _.get(this._parsedCopy, key);
  }

  /**
   * Determines if the key exists in the registered copy.
   * @param  {string} key
   * @return {boolean}
   */
  hasKey(key) {
    return _.some(this.getSubkeys(key));
  }

  /**
   * Returns the AST at a given key. Logs error if key is not found in the parsed copy.
   * @param  {string} key
   * @return {Formatting|Functional|Newline|Reference|Substitute|Switch|Verbatim}
   */
  _getAstForKey(key) {
    const result = _.get(this._parsedCopy, key);

    if (_.isUndefined(result)) {
      this._handleError(`No AST found for copy key: ${key}`);
      return null;
    }

    return result;
  }

  /**
   * When in dev mode, log errors to the console.
   * @param {string} error            The error message to display
   * @param {object} [options]
   * @param {boolean} [options.halt]  Whether or not to throw a halting error.
   * @private
   */
  _handleError(error, options = {}) {
    const message = `CopyService: ${error}`;
    if (options.halt) {
      throw new Error(message);
    } else if (this._isInDevMode()) {
      console.error(message); // eslint-disable-line no-console
    }
  }

  /**
   * Returns the global boolean DEV_MODE set via webpack.
   * @return {boolean} DEV_MODE
   */
  _isInDevMode() {
    return DEV_MODE;
  }
}

export default CopyService;
