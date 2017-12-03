import GrainTranslateMixin from '../grain-translate/GrainTranslateMixin.js';

const GrainValidateMixin = superclass => class extends GrainTranslateMixin(superclass) {
  static get properties() {
    return Object.assign(super.properties, {
      errorValidators: {
        type: 'Array'
      },
      errorList: {
        type: 'Array',
        value: []
      },
      error: {
        type: 'Object'
      },
      warningValidators: {
        type: 'Array'
      },
      warningList: {
        type: 'Array',
        value: []
      },
      warning: {
        type: 'Object'
      },
    });
  }

  /**
   * Order is: Error, Warning, Info
   * Transition from Error, Warning, Info to "nothing" results in Ok
   */
  validate() {
    this.validateType('error');
    if (!this.error) {
      this.validateType('warning');
    }
  }

  getErrorTranslationsKeys(data) {
    return [`errors.${data.validator}`, `global-errors:errors.${data.validator}`]
  }

  /**
   * type can be 'error', 'warning', 'info', 'ok'
   *
   * a Validator can be
   * - special
   *     e.g. 'required', 'optional'
   * - function
   *     e.g. required, isEmail, isEmpty
   * - array
   *     e.g. [isLength, {min: 10}], [isLength, {min: 5, max: 10}], [contains, 'me']
   */
  validateType(type) {
    let validatorsProperty = `${type}Validators`;
    let listProperty = `${type}List`;
    let resultProperty = `${type}`;

    let validators = this[validatorsProperty];
    if (!validators) {
      return;
    }
    let resultList = [];
    let value = this.$$slot.input.value;
    let optional = false;
    let required = function(value) {
      return (typeof value === 'string' && value !== '') || (typeof value !== 'string' && typeof value !== 'undefined');
    }

    for (let i=0; i < validators.length; i++) {
      if (typeof validators[i] === 'string') {
        optional = validators[i] === 'optional';
        if (validators[i] === 'required') {
          validators[i] = required;
        }
      }
      let validatorArray = Array.isArray(validators[i]) ? validators[i] : [validators[i]];
      let validatorFunction = validatorArray[0];
      let validatorParams = validatorArray[1];

      if (typeof validatorFunction === 'function') {
        if (!validatorFunction(value, validatorParams) && !(optional === true && typeof value === 'string' && value === '')) {
          let data = Object.assign({}, validatorParams, {
            validator: validatorFunction.name,
            fieldName: this.getFieldName(),
            name: this.$$slot.input.name,
            value
          });
          resultList.push({
            data,
            translationKeys: this.getErrorTranslationsKeys(data)
          });
        }
      }
    }
    this[listProperty] = resultList;
    this[resultProperty] = resultList.length > 0 ? resultList[0] : false;
  }

}

export default GrainValidateMixin;
