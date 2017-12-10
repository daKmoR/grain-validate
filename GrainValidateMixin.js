import GrainTranslateMixin from '../grain-translate/GrainTranslateMixin.js';

const GrainValidateMixin = superclass => class extends GrainTranslateMixin(superclass) {
  static get properties() {
    return {
      ...super.properties,
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
      okValidators: {
        type: 'Array'
      },
      okList: {
        type: 'Array',
        value: []
      },
      ok: {
        type: 'Object'
      },
      autoValidate: {
        type: 'Boolean',
        value: false
      }
    };
  }

  _onBlur() {
    if (this.value !== '') {
      this.validate();
    }
  }

  _onInput() {
    if (this.autoValidate) {
      this.validate();
    }
  }

  /**
   * Order is: Error, Warning, Info
   * Transition from Error, Warning, Info to "nothing" results in Ok
   */
  validate() {
    this.hadValidationMessage = !!this.validationMessage;

    this.validateType('error');
    if (!this.error) {
      this.validateType('warning');
    }

    this.validationMessageList = [
      ...this.errorList,
      ...this.warningList,
    ];
    this.validationMessage = this.validationMessageList.length > 0 ? this.validationMessageList[0] : false;

    if (this.hadValidationMessage && !this.validationMessage) {
      this.validateType('ok');
      if (this.ok) {
        this.validationMessageList = this.okList;
        this.validationMessage = this.ok;
      }
    }
    if (this.validationMessage) {
      this.autoValidate = true;
    }
  }

  getErrorTranslationsKeys(data) {
    return [`errors.${data.validator}`, `grain-validate:errors.${data.validator}`]
  }

  getWarningTranslationsKeys(data) {
    return [`warnings.${data.validator}`, `grain-validate:warnings.${data.validator}`]
  }

  getOkTranslationsKeys(data) {
    return [`oks.${data.validator}`, `grain-validate:oks.${data.validator}`]
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
    const resultPropertyFirstLetterUppercase = resultProperty.charAt(0).toUpperCase() + resultProperty.slice(1);
    const translationKeysGetFunctionName = `get${resultPropertyFirstLetterUppercase}TranslationsKeys`;

    let validators = this[validatorsProperty];
    if (!validators) {
      return;
    }
    let resultList = [];
    let value = this.jsValue;
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
          let data = {
            validator: validatorFunction.name,
            validatorParams,
            validatorType: type,
            fieldName: this.getFieldName(),
            name: this.$$slot.input.name,
            value
          };
          resultList.push({
            data,
            translationKeys: this[translationKeysGetFunctionName](data)
          });
        }
      } else {
        console.warn('That does not look like a validator function', validatorFunction);
        console.warn('You should provide options like so errorValidators=${[[functionName, {min: 5, max: 10}]]}');
      }
    }
    this[listProperty] = resultList;
    this[resultProperty] = resultList.length > 0 ? resultList[0] : false;
    return this[resultProperty];
  }

}

export default GrainValidateMixin;
