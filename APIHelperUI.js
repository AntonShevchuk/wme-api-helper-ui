// ==UserScript==
// @name         APIHelperUI
// @version      0.3.0
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

class APIHelperUIElement {
  constructor(uid, id, title, description = null) {
    this.uid = uid;
    this.id = id;
    this.title = title;
    this.description = description;
  }
  toHTML() {
    throw new Error('Abstract method');
  }
}

class APIHelperUIContainer extends APIHelperUIElement {
  constructor(uid, id, title, description = null) {
    super(uid, id, title, description);
    this.elements = {};
  }
  addElement(element) {
    this.elements[element.id] = element;
    return this.elements[element.id];
  }
  // For Tab Panel Modal
  addFieldset(id, title, description) {
    return this.addElement(new APIHelperUIFieldset(this.uid, id, title, description));

  }
  // For Tab Panel Modal Fieldset
  addCheckbox(id, title, description, callback) {
    return this.addElement(new APIHelperUICheckbox(this.uid, id, title, description, callback));
  }
  // For Tab Panel Modal Fieldset
  addButton(id, title, description, callback, shortcut = null) {
    return this.addElement(new APIHelperUIButton(this.uid, id, title, description, callback, shortcut));
  }
  addButtons(buttons) {
    for (let btn in buttons) {
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

class APIHelperUITab extends APIHelperUIContainer {
  constructor(uid, id, title, description = null) {
    super(uid, id, title, description);
    // Create tab toggler
    let li = document.createElement('li');
    li.innerHTML = '<a href="#sidepanel-' + this.uid + '" id="' + this.uid + '" data-toggle="tab">'+ this.title + '</a>';
    document.querySelector('#user-tabs .nav-tabs').append(li);
  }
  inject() {
    this.container().append(this.toHTML());
  }
  container() {
    return document.querySelector('.tab-content');
  }
  toHTML() {
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
    for (let el in this.elements) {
      controls.append(this.elements[el].toHTML());
    }
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
  inject() {
    this.container().append(this.toHTML());
  }
  container() {
    return document.getElementById('panel-container');
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
    for (let el in this.elements) {
      body.append(this.elements[el].toHTML());
    }

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
    for (let el in this.elements) {
      controls.append(this.elements[el].toHTML());
    }
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
    for (let el in this.elements) {
      controls.append(this.elements[el].toHTML());
    }
    fieldset.append(controls);
    return fieldset;
  }
}

class APIHelperUIControl extends APIHelperUIElement {
  constructor(uid, id, title, description, callback) {
    super(uid, id, title, description);
    this.callback = callback;
  }
}

class APIHelperUICheckbox extends APIHelperUIControl {
  toHTML() {
    let id = this.uid + '_' + this.id;
    let checkbox = document.createElement('input');
    checkbox.id = '_' + id;
    checkbox.type = 'checkbox';
    checkbox.name = id;
    checkbox.value = 1;
    checkbox.onclick = this.callback;

    let label = document.createElement('label');
    label.htmlFor = '_' + id;
    label.innerHTML = this.title;

    let container = document.createElement('div');
    container.title = this.description;
    container.id = id;
    container.className = 'controls-container ';
    container.append(checkbox, label);
    return container;
  }
}

class APIHelperUIButton extends APIHelperUIControl {
  constructor(uid, id, title, description, callback, shortcut = null) {
    super(uid, id, title, description, callback);
    if (this.shortcut) {
      /* name, desc, group, title, shortcut, callback, scope */
      new WazeWrap.Interface.Shortcut(
        this.uid + '-' + this.id,
        this.description,
        this.uid,
        this.uid,
        this.shortcut,
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
