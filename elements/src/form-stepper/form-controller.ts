import { defaultForms } from './default-forms';
import { IForms, IForm, IUserData, ISubmit } from './types';
import { FormUserData } from './form-user-data';

export class FormController {
  static instance: FormController;
  currentForm: string = '';
  currentFormType: string = '';
  document: HTMLElement;

  forms: IForms;
  steps: string[] = Object.keys(defaultForms);

  _docGotoStepListener = (event: any) => this.initForm(event.detail);

  _docClickListener = (event: any) => {
    if (event.target.classList.contains('form-review')) {
      const isCurrentReviewForm = (this.forms[this.currentForm] as IForm).type === 'review';
      this.initForm('review'); 
    } else if (event.target.classList.contains('form-submit')) {
      this.initForm('submit');
    } else if (event.target.classList.contains('form-prev')) {
      this.initForm('prev'); 
    } else if (event.target.classList.contains('form-next')) { 
      const errors = this.setErrors();
      if (!errors) { // set error classes and contents of .form-errors 
        const formEl = this.document.querySelector('form.form-flow') as HTMLFormElement;
        const formElData = Object.fromEntries(new FormData(formEl).entries())
        if (Object.keys(formElData).length) {
          FormUserData.setUserData(this.currentForm, formElData);
        }
        this.initForm('next');
      }
    }
  }

  constructor() {
    if (!FormController.instance) {
      this.addEventListeners();
      FormController.instance = this;
    }
    this.forms = defaultForms;
    this.document = document.body;
    return FormController.instance;
  }

  addEventListeners() {
    if (!this.document) return;
    this.document.addEventListener('form-goto', this._docGotoStepListener);
    this.document.addEventListener('click', this._docClickListener);
  }

  removeEventListeners() {
    if (!this.document) return;
    this.document.removeEventListener('form-goto', this._docGotoStepListener);
    this.document.removeEventListener('click', this._docClickListener);
  }

  async initForm(target: string = 'auto') {
    if (!this.document) return;
    let nextFormIndex = 0;
    if (target === 'auto') {
      nextFormIndex = this.steps.findIndex(formId => this.getStatus(formId) !== 'complete');
    } else if (['review', 'submit', 'prev', 'next'].includes(target)) {
      const currentFormIndex = this.steps.indexOf(this.currentForm);

      if (target === 'review') {
        nextFormIndex = this.steps.findIndex(formId => (this.forms[formId] as IForm)?.type === 'review');
      } else if (target === 'submit') {
        await this.submitForm();
        nextFormIndex = this.steps.findIndex(formId => (this.forms[formId] as IForm)?.type === 'submit');
      } else if (target === 'prev') {
        nextFormIndex = (currentFormIndex - 1) % this.steps.length;
      } else if (target === 'next') {
        nextFormIndex = (currentFormIndex + 1) % this.steps.length;
      }
    } else if (this.steps.indexOf(target)) {
      nextFormIndex = this.steps.indexOf(target);
    }

    this.currentForm = this.steps[nextFormIndex];
    this.currentFormType = '' + (this.forms[this.currentForm] as IForm).type;
    this.initStepperEl();
    this.initFormEl();
    this.initButtonsEl();
  }

  getStatus(formId: string): 'complete' | 'incomplete'  { 
    const userData: IUserData = FormUserData.getUserData();
    if (userData?.[formId]) { // user has visited this formId already and saved data 
      return 'complete';
    } else {
      const currentFormIndex = Object.keys(this.forms).indexOf(this.currentForm);
      const formIndex = Object.keys(this.forms).indexOf(formId);
      return 'incomplete';
    }
  }

  initStepperEl(): void {
    const stepperEl: any = this.document.querySelector('form-stepper');
    
    stepperEl?.render();
  }

  async initFormEl(): Promise<void> { // set innerHTML of <form> element
    const formEl = this.document.querySelector('form.form-flow') as HTMLFormElement;
    const html = this.forms[this.currentForm].html;
    if (formEl) {
      if (typeof html === 'string' && html.match(/^http/)) {
        window.fetch(html)
          .then(resp => resp.text())
          .then(resp => formEl.innerHTML = resp)
          .catch(error => formEl.innerHTML = error)
      } else if (typeof html === 'function') {
        formEl.innerHTML = html();
      } else {
        formEl.innerHTML = html as string;
      }

      const formUserData: IUserData = FormUserData.getUserData() || {};
      for (var key in formUserData[this.currentForm]) {
        const el = formEl.elements[key as any] as HTMLInputElement;
        const value = formUserData[this.currentForm][key];
        if (el.type === 'checkbox') {
          el.checked = ['on', el.value].includes(value);
        } else if (el.type === 'radio') {
          el.checked = value === el.value;
        } else {
          el.value = value;
        }
      }
    }
  }  

  initButtonsEl(): void { // set buttons text and availability
    const reviewButtonEl = this.document.querySelector('.form-buttons .form-review') as HTMLButtonElement;
    const submitButtonEl = this.document.querySelector('.form-buttons .form-submit') as HTMLButtonElement;
    const prevButtonEl = this.document.querySelector('.form-buttons .form-prev') as HTMLButtonElement;
    const nextButtonEl = this.document.querySelector('.form-buttons .form-next') as HTMLButtonElement;
    const currentFormIndex = this.steps.indexOf(this.currentForm);

    // 0-1-2-3-current -> enabled,  current-1-2-3-review -> disabled
    if (prevButtonEl) {
      prevButtonEl.disabled = !(currentFormIndex > 0) || this.currentFormType === 'submit';
    }
    // 0-1-2-3-current -> disabled, current-1-2-3-review -> enabled
    nextButtonEl && (nextButtonEl.disabled = !(currentFormIndex !== this.steps.length - 1));
    if (submitButtonEl) {
      submitButtonEl.disabled = this.currentFormType !== 'review';
    }
    if (reviewButtonEl) {
      reviewButtonEl.disabled = this.currentFormType === 'review' || !this.isReviewable();
    }
  }

  setErrors(): string[] | void {
    const formEl = this.document.querySelector('form.form-flow') as HTMLFormElement;
    const errorsEl = this.document.querySelector('.form-errors') as HTMLElement;
    errorsEl && (errorsEl.innerHTML = '');
    formEl.classList.add('error-checked');

    const nativeErrors: string[] = [];
    Array.from(formEl.elements).forEach( (el: any) => {
      el.classList.remove('error');
      if (!el.checkValidity()) {
        el.classList.add('error');
        const errorMessage = `${el.name || el.tagName}: ${el.validationMessage}`;
        !nativeErrors.includes(errorMessage) && nativeErrors.push(errorMessage);
      }
    });
    if (errorsEl && nativeErrors.length) {
      nativeErrors.forEach(el => errorsEl.insertAdjacentHTML('beforeend', `<div class="error">${el}</div>`))
      return nativeErrors;
    }

    const formElData = Object.fromEntries(new FormData(formEl).entries());
    const getErrorFunc = (this.forms[this.currentForm] as IForm).getErrors;
    const customUserErrors = getErrorFunc && getErrorFunc(formElData);
    if (errorsEl && customUserErrors) {
      customUserErrors.forEach( (el: any) => {
        errorsEl.insertAdjacentHTML('beforeend', `<div class="error">${el}</div>`);
      })
      return customUserErrors;
    }
  }

  isReviewable(): boolean {
    // complete - skippable - skippable - review => true
    // incomplete - skippable - skippable - review => false
    for (var i = 0; i < this.steps.length; i++) {
      const stepName = this.steps[i];
      const stepStatus = this.getStatus(stepName);
      const form = this.forms[stepName] as IForm;
      if (form.type === 'review') {
        return true;
      } else if (!(stepStatus === 'complete' || form.skippable)) {
        return false;
      } else {
        console.debug('FormController.isReviewable()', {stepStatus})
      }
    }
    return false;
  }

  submitForm(): Promise<any> {
    // const submitFormName = this.steps.find(formId => this.forms[formId]?.type === 'submit') as string;
    const formUserData: IUserData = FormUserData.getUserData() || {};
    // const form = this.forms[submitFormName];
    const submitForm: ISubmit = 
      Object.entries(this.forms).find( ([key, form]) => (form as ISubmit).type === 'submit') as any;
    if (submitForm) {
      const payload = typeof submitForm.payload === 'function' ? 
        JSON.stringify(submitForm.payload(formUserData)) : JSON.stringify(formUserData);

      this.document.querySelectorAll('.form-buttons button').forEach( (el: any) => el.disabled = true);
      return window.fetch(submitForm.url, { method: submitForm.method, headers: submitForm.headers, body: payload })
        .then(response => response.json())
        .then(response => {
          submitForm.onSuccess?.(response);
          formUserData.delete();
        })
        .catch(error => submitForm.onError?.(error))
        .finally(() => {})
    } else {
      return Promise.reject('Could not find form type "submit"')
    }
  }

  showStep(step: string) {
    this.currentForm = step;
    this.initStepperEl();
    this.initFormEl();
    this.initButtonsEl();
  }
}
