// ==UserScript==
// @name         APIHelperUI
// @version      0.4.0
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
    this.id = 0;
  }
  generateId() {
    this.id++;
    return this.uid + '-' + this.id;
  }
  createPanel(title) {
    return new APIHelperUIPanel(this.uid, this.generateId(), title);
  }
  createTab(title) {
    return new APIHelperUITab(this.uid, this.generateId(), title);
  }
  createModal(title) {
    return new APIHelperUIModal(this.uid, this.generateId(), title);
  }
  createFieldset(title) {
    return new APIHelperUIFieldset(this.uid, this.generateId(), title);
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
    }
    return this.domElement;
  }
  toHTML() {
    throw new Error('Abstract method');
  }
}

/**
 * Basic for all UI containers
 */
class APIHelperUIContainer extends APIHelperUIElement {
  constructor(uid, id, title, description = null) {
    super(uid, id, title, description);
    this.elements = [];
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
        'id': this.uid + '_' + id,
        'onclick': callback,
        'type': 'checkbox',
        'value': 1,
        'checked': checked
      })
    );
  }
  addRadio(id, title, description, callback, value, checked = false) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '_' + id + '_' + value,
        'onclick': callback,
        'type': 'radio',
        'value': value,
        'checked': checked
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
    this.container().append(this.toHTML());
  }
  toHTML() {
    // Create tab toggler
    let li = document.createElement('li');
    li.innerHTML = '<a href="#sidepanel-' + this.uid + '" id="' + this.uid + '" data-toggle="tab">'+ this.title + '</a>';
    document.querySelector('#user-tabs .nav-tabs').append(li);
    // Section
    let pane = document.createElement('div');
    pane.id = 'sidepanel-' + this.uid;
    pane.className = 'tab-pane';
    // Label of the panel
    let label = document.createElement('label');
    label.className = 'control-label';
    label.innerHTML = this.title;
    // Container for buttons
    let controls = document.createElement('div');
    controls.className = 'button-toolbar';
    // Append buttons to container
    this.elements.forEach(element => controls.append(element.toHTML()));
    // Build panel
    let group = document.createElement('div');
    group.className = 'form-group ' + APIHelper.normalize(this.uid);
    group.append(label);
    group.append(controls);
    pane.append(group);
    return pane;
  }
}

class APIHelperUIModal extends APIHelperUIContainer {
  container() {
    return document.getElementById('panel-container');
  }
  inject() {
    this.container().append(this.toHTML());
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
    this.elements.forEach(element => body.append(element.toHTML()));

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
    this.elements.forEach(element => controls.append(element.toHTML()));
    // Build panel
    let group = document.createElement('div');
    group.className = 'form-group ' + APIHelper.normalize(this.uid);
    group.append(label);
    group.append(controls);
    return group;
  }
}

class APIHelperUIFieldset extends APIHelperUIContainer {
  toHTML() {
    let fieldset = document.createElement('fieldset');
    fieldset.className = this.uid;

    let legend = document.createElement('legend');
    legend.innerHTML = this.title;

    fieldset.append(legend);

    if (this.description) {
      let description = document.createElement('p');
      description.innerHTML = this.description;
      fieldset.append(description);
    }
    // Container for buttons
    let controls = document.createElement('div');
    controls.className = 'controls';
    // Append buttons to panel
    this.elements.forEach(element => controls.append(element.toHTML()));
    fieldset.append(controls);
    return fieldset;
  }
}

class APIHelperUIText extends APIHelperUIElement {
  toHTML() {
    let p = document.createElement('p');
    p.className = this.uid + ' ' + this.uid + '-' + this.id;
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
    container.className = 'controls-container ';
    container.append(input, label);
    return container;
  }
}

class APIHelperUIButton extends APIHelperUIControl {
  constructor(uid, id, title, description, callback, shortcut = null) {
    super(uid, id, title, description, callback);
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
    button.className = 'waze-btn waze-btn-small ' + this.uid + ' ' + this.uid + '-' + this.id;
    button.innerHTML = this.title;
    button.title = this.description;
    button.onclick = this.callback;
    return button;
  }
}
