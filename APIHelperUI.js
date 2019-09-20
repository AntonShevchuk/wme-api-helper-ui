
// ==UserScript==
// @name         APIHelperUI
// @version      0.4.2
// @description  API Helper UI
// @author       Anton Shevchuk
// @license      MIT License
// @include      https://www.waze.com/editor*
// @include      https://www.waze.com/*/editor*
// @include      https://beta.waze.com/editor*
// @include      https://beta.waze.com/*/editor*
// @exclude      https://www.waze.com/user/editor*
// @exclude      https://beta.waze.com/user/editor*
// @grant        none
// @namespace    https://greasyfork.org/users/227648
// ==/UserScript==

/* jshint esversion: 6 */
/* global require, window, $, W, I18n, WazeWrap */

/**
 * God class, create it once
 */
class APIHelperUI {
  constructor(uid) {
    this.uid = APIHelper.normalize(uid);
    this.index = 0;
  }
  generateId() {
    this.index++;
    return this.uid + '-' + this.index;
  }
  createPanel(title, description = null) {
    return new APIHelperUIPanel(this.uid, this.generateId(), title, description);
  }
  createTab(title, description = null) {
    return new APIHelperUITab(this.uid, this.generateId(), title, description);
  }
  createModal(title, description = null) {
    return new APIHelperUIModal(this.uid, this.generateId(), title, description);
  }
  createFieldset(title, description = null) {
    return new APIHelperUIFieldset(this.uid, this.generateId(), title, description);
  }
}

/**
 * Basic for all UI elements
 */
class APIHelperUIElement {
  constructor(uid, id, title, description = null) {
    this.uid = uid;
    this.id = id;
    this.title = title;
    this.description = description;
    this.domElement = null;
  }
  html() {
    if (!this.domElement) {
      this.domElement = this.toHTML();
      this.domElement.className +=  ' ' + this._className();
    }
    return this.domElement;
  }
  toHTML() {
    throw new Error('Abstract method');
  }
  _className() {
    return this.uid + ' ' + this.uid + '-' + this.id;
  }
}

/**
 * Basic for all UI containers
 */
class APIHelperUIContainer extends APIHelperUIElement {
  constructor(uid, id, title, description = null) {
    super(uid, id, title, description);
    this.elements = [];
    if (description) {
      this.addText('description', description);
    }
  }
  addElement(element) {
    this.elements.push(element);
  }
  // For Tab Panel Modal Fieldset
  addText(id, text) {
    return this.addElement(new APIHelperUIText(this.uid, id, null, text));
  }
  // For Tab Panel Modal
  addFieldset(id, title, description) {
    return this.addElement(new APIHelperUIFieldset(this.uid, id, title, description));
  }
  // For Tab Panel Modal Fieldset
  addCheckbox(id, title, description, callback, checked = false) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '-' + id,
        'onclick': callback,
        'type': 'checkbox',
        'value': 1,
        'checked': checked,
      })
    );
  }
  addRadio(id, title, description, callback, value, checked = false) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '-' + id + '-' + value,
        'onclick': callback,
        'type': 'radio',
        'value': value,
        'checked': checked,
      })
    );
  }
  addRange(id, title, description, callback, min, max, value, step = 10) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '-' + id,
        'onclick': callback,
        'type': 'range',
        'min': min,
        'max': max,
        'value': value,
        'step': step,
      })
    );
  }
  // For Tab Panel Modal Fieldset
  addButton(id, title, description, callback, shortcut = null) {
    return this.addElement(new APIHelperUIButton(this.uid, id, title, description, callback, shortcut));
  }
  addButtons(buttons) {
    for (let btn in buttons) {
      if (buttons.hasOwnProperty(btn)) {
        this.addButton(
          btn,
          buttons[btn].title,
          buttons[btn].description,
          buttons[btn].callback,
          buttons[btn].shortcut,
        );
      }
    }
  }
}

class APIHelperUITab extends APIHelperUIContainer {
  container() {
    return document.querySelector('.tab-content');
  }
  inject() {
    this.container().append(this.html());
  }
  toHTML() {
    // Create tab toggler
    let li = document.createElement('li');
    li.innerHTML = '<a href="#sidepanel-' + this.uid + '" id="' + this.uid + '" data-toggle="tab">'+ this.title + '</a>';
    document.querySelector('#user-tabs .nav-tabs').append(li);

    // Label of the panel
    let label = document.createElement('label');
    label.className = 'control-label';
    label.innerHTML = this.title;

    // Container for buttons
    let controls = document.createElement('div');
    controls.className = 'button-toolbar';

    // Append buttons to container
    this.elements.forEach(element => controls.append(element.html()));

    // Build form group
    let group = document.createElement('div');
    group.className = 'form-group';
    group.append(label);
    group.append(controls);

    // Section
    let pane = document.createElement('div');
    pane.id = 'sidepanel-' + this.uid; // required by tab toggle, see above
    pane.className = 'tab-pane';
    pane.append(group);
    return pane;
  }
}

class APIHelperUIModal extends APIHelperUIContainer {
  container() {
    return document.getElementById('panel-container');
  }
  inject() {
    this.container().append(this.html());
  }
  toHTML() {
    // Header and close button
    let close = document.createElement('a');
    close.className = 'close-panel';

    let header = document.createElement('div');
    header.className = 'header';
    header.innerHTML = this.title;
    header.prepend(close);

    // Body
    let body = document.createElement('div');
    body.className = 'body';

    // Append buttons to panel
    this.elements.forEach(element => body.append(element.html()));

    // Container
    let archivePanel = document.createElement('div');
    archivePanel.className = 'archive-panel';
    archivePanel.append(header);
    archivePanel.append(body);

    let panel = document.createElement('div');
    panel.className = 'panel show';
    panel.append(archivePanel);

    return panel;
  }
}

class APIHelperUIPanel extends APIHelperUIContainer {
  toHTML() {
    // Label of the panel
    let label = document.createElement('label');
    label.className = 'control-label';
    label.innerHTML = this.title;
    // Container for buttons
    let controls = document.createElement('div');
    controls.className = 'controls';
    // Append buttons to panel
    this.elements.forEach(element => controls.append(element.html()));
    // Build panel
    let group = document.createElement('div');
    group.className = 'form-group';
    group.append(label);
    group.append(controls);
    return group;
  }
}

class APIHelperUIFieldset extends APIHelperUIContainer {
  toHTML() {
    // Fieldset legend
    let legend = document.createElement('legend');
    legend.innerHTML = this.title;

    // Container for buttons
    let controls = document.createElement('div');
    controls.className = 'controls';
    // Append buttons to container
    this.elements.forEach(element => controls.append(element.html()));

    let fieldset = document.createElement('fieldset');
    fieldset.append(legend, controls);
    return fieldset;
  }
}

class APIHelperUIText extends APIHelperUIElement {
  toHTML() {
    let p = document.createElement('p');
    p.innerHTML = this.description;
    return p;
  }
}

class APIHelperUIControl extends APIHelperUIElement {
  constructor(uid, id, title, description, attributes = {}) {
    super(uid, id, title, description);
    this.attributes = attributes;
    this.attributes.name = this.id;
  }
  _prepare(dom) {
    for (let attr in this.attributes) {
      if (this.attributes.hasOwnProperty(attr)) {
        dom[attr] = this.attributes[attr];
      }
    }
    return dom;
  }
}

class APIHelperUIInput extends APIHelperUIControl {
  toHTML() {
    let input = this._prepare(document.createElement('input'));
    let label = document.createElement('label');
    label.htmlFor = input.id;
    label.innerHTML = this.title;

    let container = document.createElement('div');
    container.title = this.description;
    container.className = 'controls-container';
    container.append(input, label);
    return container;
  }
}

class APIHelperUIButton extends APIHelperUIElement {
  constructor(uid, id, title, description, callback, shortcut = null) {
    super(uid, id, title, description);
    this.callback = callback;
    if (shortcut) {
      /* name, desc, group, title, shortcut, callback, scope */
      new WazeWrap.Interface.Shortcut(
        this.uid + '-' + this.id,
        this.description,
        this.uid,
        this.uid,
        shortcut,
        this.callback,
        null
      ).add();
    }
  }
  toHTML() {
    let button = document.createElement('button');
    button.className = 'waze-btn waze-btn-small';
    button.innerHTML = this.title;
    button.title = this.description;
    button.onclick = this.callback;
    return button;
  }
}
