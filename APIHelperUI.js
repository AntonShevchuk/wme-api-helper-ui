// ==UserScript==
// @name         APIHelperUI
// @version      0.1.0
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
  }
  createPanel(title) {
    return new APIHelperUIPanel(this.uid, title);
  }
  createTab(title) {
    return new APIHelperUITab(this.uid, title);
  }
}

class APIHelperUIElement {
  constructor(uid, title) {
    this.uid = uid;
    this.title = title;
    this.buttons = {};
  }
  addButton(id, title, description, shortcut, callback) {
    this.buttons[id] = new APIHelperUIButton(this.uid, id, title, description, shortcut, callback);
  }
  addButtons(buttons) {
    for (let btn in buttons) {
      this.addButton(
          btn,
          buttons[btn].title,
          buttons[btn].description,
          buttons[btn].shortcut,
          buttons[btn].callback,
      );
    }
  }
}

class APIHelperUITab extends APIHelperUIElement {
  init() {
    // Tab toggler
    let li = document.createElement('li');
        li.innerHTML = '<a href="#sidepanel-' + this.uid + '" id="' + this.uid + '" data-toggle="tab">'+ this.title + '</a>';
    document.querySelector('#user-tabs .nav-tabs').appendChild(li);
    document.querySelector('.tab-content').appendChild(this.toHTML());
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
    for (let btn in this.buttons) {
      let p = document.createElement('p');
          p.innerHTML = this.buttons[btn].description;
          p.prepend(this.buttons[btn].toHTML());
      controls.appendChild(p);
    }
    // Build panel
    let group = document.createElement('div');
        group.className = 'form-group ' + APIHelper.normalize(this.uid);
        group.appendChild(label);
        group.appendChild(controls);
    pane.append(group);
    return pane;
  }
}

class APIHelperUIPanel extends APIHelperUIElement {
  init(element) {
    element.prepend(this.toHTML())
  }
  toHTML() {
    // Label of the panel
    let label = document.createElement('label');
        label.className = 'control-label';
        label.innerHTML = this.title;
    // Container for buttons
    let controls = document.createElement('div');
        controls.className = 'controls';
    // Append buttons to panel
    for (let btn in this.buttons) {
      controls.appendChild(this.buttons[btn].toHTML());
    }
    // Build panel
    let group = document.createElement('div');
        group.className = 'form-group ' + APIHelper.normalize(this.uid);
        group.appendChild(label);
        group.appendChild(controls);
    return group;
  }
}

class APIHelperUIButton {
  constructor(uid, id, title, description, shortcut, callback) {
    this.uid = uid;
    this.id = id;
    this.title = title;
    this.description = description;
    this.shortcut = shortcut;
    this.callback = callback;
    if (this.shortcut) {
      this.addShortcut();
    }
  }
  addShortcut() {
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
  toHTML() {
    let button = document.createElement('button');
      button.className = 'waze-btn waze-btn-small ' + this.uid + ' ' + this.uid + '-' + this.id;
      button.innerHTML = this.title;
      button.title = this.description;
      button.onclick = this.callback;
    return button;
  }
}
