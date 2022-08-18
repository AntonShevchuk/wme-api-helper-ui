// ==UserScript==
// @name         APIHelperUI
// @version      0.4.6
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

/* global require, window, $, W, I18n */

/**
 * God class, create it once
 */
class APIHelperUI {
  constructor (uid) {
    this.uid = APIHelper.normalize(uid)
    this.index = 0
  }

  generateId () {
    this.index++
    return this.uid + '-' + this.index
  }

  createPanel (title, description = null, icon = null) {
    return new APIHelperUIPanel(this.uid, this.generateId(), title, description, icon)
  }

  createTab (title, description = null, icon = null) {
    return new APIHelperUITab(this.uid, this.generateId(), title, description, icon)
  }

  createModal (title, description = null) {
    return new APIHelperUIModal(this.uid, this.generateId(), title, description)
  }

  createFieldset (title, description = null) {
    return new APIHelperUIFieldset(this.uid, this.generateId(), title, description)
  }
}

/**
 * Sorry, I copied this class from WazeWrap as is
 */
class APIHelperUIShortcut {
  constructor (name, desc, group, title, shortcut, callback, scope) {
    if ('string' === typeof name && name.length > 0 && 'string' === typeof shortcut && 'function' === typeof callback) {
      this.name = name
      this.desc = desc
      this.group = group || this.defaults.group
      this.title = title
      this.callback = callback
      this.shortcut = {}
      if (shortcut.length > 0)
        this.shortcut[shortcut] = name
      if ('object' !== typeof scope)
        this.scope = null
      else
        this.scope = scope
      this.groupExists = false
      this.actionExists = false
      this.eventExists = false
      this.defaults = { group: 'default' }

      return this
    }
  }

  /**
   * Determines if the shortcut's action already exists.
   * @private
   */
  doesGroupExist () {
    this.groupExists = 'undefined' !== typeof W.accelerators.Groups[this.group] &&
      undefined !== typeof W.accelerators.Groups[this.group].members
    return this.groupExists
  }

  /**
   * Determines if the shortcut's action already exists.
   * @private
   */
  doesActionExist () {
    this.actionExists = 'undefined' !== typeof W.accelerators.Actions[this.name]
    return this.actionExists
  }

  /**
   * Determines if the shortcut's event already exists.
   * @private
   */
  doesEventExist () {
    this.eventExists = 'undefined' !== typeof W.accelerators.events.dispatcher._events[this.name] &&
      W.accelerators.events.dispatcher._events[this.name].length > 0 &&
      this.callback === W.accelerators.events.dispatcher._events[this.name][0].func &&
      this.scope === W.accelerators.events.dispatcher._events[this.name][0].obj
    return this.eventExists
  }

  /**
   * Creates the shortcut's group.
   * @private
   */
  createGroup () {
    W.accelerators.Groups[this.group] = []
    W.accelerators.Groups[this.group].members = []

    if (this.title && !I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group]) {
      I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group] = []
      I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].description = this.title
      I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].members = []
    }
  }

  /**
   * Registers the shortcut's action.
   * @private
   */
  addAction () {
    if (this.title)
      I18n.translations[I18n.currentLocale()].keyboard_shortcuts.groups[this.group].members[this.name] = this.desc
    W.accelerators.addAction(this.name, { group: this.group })
  }

  /**
   * Registers the shortcut's event.
   * @private
   */
  addEvent () {
    W.accelerators.events.register(this.name, this.scope, this.callback)
  }

  /**
   * Registers the shortcut's keyboard shortcut.
   * @private
   */
  registerShortcut () {
    W.accelerators._registerShortcuts(this.shortcut)
  }

  /**
   * Adds the keyboard shortcut to the map.
   * @return {APIHelperUIShortcut} The keyboard shortcut.
   */
  add () {
    /* If the group is not already defined, initialize the group. */
    if (!this.doesGroupExist()) {
      this.createGroup()
    }

    /* Clear existing actions with same name */
    if (this.doesActionExist()) {
      W.accelerators.Actions[this.name] = null
    }
    this.addAction()

    /* Register event only if it's not already registered */
    if (!this.doesEventExist()) {
      this.addEvent()
    }

    /* Finally, register the shortcut. */
    this.registerShortcut()
    return this
  }

  /**
   * Removes the keyboard shortcut from the map.
   * @return {APIHelperUIShortcut} The keyboard shortcut.
   */
  remove () {
    if (this.doesEventExist()) {
      W.accelerators.events.unregister(this.name, this.scope, this.callback)
    }
    if (this.doesActionExist()) {
      delete W.accelerators.Actions[this.name]
    }
    //remove shortcut?
    return this
  }

  /**
   * Changes the keyboard shortcut and applies changes to the map.
   * @return {APIHelperUIShortcut} The keyboard shortcut.
   */
  change (shortcut) {
    if (shortcut) {
      this.shortcut = {}
      this.shortcut[shortcut] = this.name
      this.registerShortcut()
    }
    return this
  }
}

/**
 * Basic for all UI elements
 */
class APIHelperUIElement {
  constructor (uid, id, title, description = null, icon = null) {
    this.uid = uid
    this.id = id
    this.title = title
    this.description = description
    this.icon = icon ? icon : ''
    this.domElement = null
  }

  html () {
    if (!this.domElement) {
      this.domElement = this.toHTML()
      this.domElement.className += ' ' + this._className()
    }
    return this.domElement
  }

  toHTML () {
    throw new Error('Abstract method')
  }

  _className () {
    return this.uid + ' ' + this.uid + '-' + this.id
  }
}

/**
 * Basic for all UI containers
 */
class APIHelperUIContainer extends APIHelperUIElement {
  constructor (uid, id, title, description = null, icon = null) {
    super(uid, id, title, description, icon)
    this.elements = []
    if (description) {
      this.addText('description', description)
    }
  }

  addElement (element) {
    this.elements.push(element)
  }

  // For Tab Panel Modal Fieldset
  addText (id, text) {
    return this.addElement(new APIHelperUIText(this.uid, id, null, text))
  }

  // For Tab Panel Modal
  addFieldset (id, title, description) {
    return this.addElement(new APIHelperUIFieldset(this.uid, id, title, description))
  }

  // For Tab Panel Modal Fieldset
  addCheckbox (id, title, description, callback, checked = false) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '-' + id,
        'onclick': callback,
        'type': 'checkbox',
        'value': 1,
        'checked': checked,
      })
    )
  }

  addRadio (id, title, description, callback, value, checked = false) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '-' + id + '-' + value,
        'onclick': callback,
        'type': 'radio',
        'value': value,
        'checked': checked,
      })
    )
  }

  addRange (id, title, description, callback, min, max, value, step = 10) {
    return this.addElement(
      new APIHelperUIInput(this.uid, id, title, description, {
        'id': this.uid + '-' + id,
        'onchange': callback,
        'type': 'range',
        'min': min,
        'max': max,
        'value': value,
        'step': step,
      })
    )
  }

  // For Tab Panel Modal Fieldset
  addButton (id, title, description, callback, shortcut = null) {
    return this.addElement(new APIHelperUIButton(this.uid, id, title, description, callback, shortcut))
  }

  addButtons (buttons) {
    for (let btn in buttons) {
      if (buttons.hasOwnProperty(btn)) {
        this.addButton(
          btn,
          buttons[btn].title,
          buttons[btn].description,
          buttons[btn].callback,
          buttons[btn].shortcut,
        )
      }
    }
  }
}

class APIHelperUITab extends APIHelperUIContainer {
  container () {
    return document.querySelector('.tab-content')
  }

  inject () {
    this.container().append(this.html())
  }

  toHTML () {
    // Create tab toggler
    let li = document.createElement('li')
    li.innerHTML = '<a href="#sidepanel-' + this.uid + '" id="' + this.uid + '" data-toggle="tab">' + this.title + '</a>'
    document.querySelector('#user-tabs .nav-tabs').append(li)

    // Label of the panel
    let header = document.createElement('div')
    header.className = 'panel-header-component settings-header'
    header.innerHTML = '<div class="panel-header-component-main">' + this.icon + '<div class="feature-id-container"><wz-overline>' + this.title + '</wz-overline></div></div>'

    // Container for buttons
    let controls = document.createElement('div')
    controls.className = 'button-toolbar'

    // Append buttons to container
    this.elements.forEach(element => controls.append(element.html()))

    // Build form group
    let group = document.createElement('div')
    group.className = 'form-group'
    group.append(header)
    group.append(controls)

    // Section
    let pane = document.createElement('div')
    pane.id = 'sidepanel-' + this.uid // required by tab toggle, see above
    pane.className = 'tab-pane'
    pane.append(group)
    return pane
  }
}

class APIHelperUIModal extends APIHelperUIContainer {
  container () {
    return document.getElementById('panel-container')
  }

  inject () {
    this.container().append(this.html())
  }

  toHTML () {
    // Header and close button
    let close = document.createElement('a')
    close.className = 'close-panel'
    close.onclick = function () {
      panel.remove()
    }

    let header = document.createElement('div')
    header.className = 'header'
    header.innerHTML = this.title
    header.prepend(close)

    // Body
    let body = document.createElement('div')
    body.className = 'body'

    // Append buttons to panel
    this.elements.forEach(element => body.append(element.html()))

    // Container
    let archivePanel = document.createElement('div')
    archivePanel.className = 'archive-panel'
    archivePanel.append(header)
    archivePanel.append(body)

    let panel = document.createElement('div')
    panel.className = 'panel show'
    panel.append(archivePanel)

    return panel
  }
}

class APIHelperUIPanel extends APIHelperUIContainer {
  toHTML () {
    // Label of the panel
    let label = document.createElement('label')
    label.className = 'control-label'
    label.innerHTML = this.title
    // Container for buttons
    let controls = document.createElement('div')
    controls.className = 'controls'
    // Append buttons to panel
    this.elements.forEach(element => controls.append(element.html()))
    // Build panel
    let group = document.createElement('div')
    group.className = 'form-group'
    group.append(label)
    group.append(controls)
    return group
  }
}

class APIHelperUIFieldset extends APIHelperUIContainer {
  toHTML () {
    // Fieldset legend
    let legend = document.createElement('legend')
    legend.innerHTML = this.title

    // Container for buttons
    let controls = document.createElement('div')
    controls.className = 'controls'
    // Append buttons to container
    this.elements.forEach(element => controls.append(element.html()))

    let fieldset = document.createElement('fieldset')
    fieldset.append(legend, controls)
    return fieldset
  }
}

class APIHelperUIText extends APIHelperUIElement {
  toHTML () {
    let p = document.createElement('p')
    p.innerHTML = this.description
    return p
  }
}

class APIHelperUIControl extends APIHelperUIElement {
  constructor (uid, id, title, description, attributes = {}) {
    super(uid, id, title, description)
    this.attributes = attributes
    this.attributes.name = this.id
  }

  _prepare (dom) {
    for (let attr in this.attributes) {
      if (this.attributes.hasOwnProperty(attr)) {
        dom[attr] = this.attributes[attr]
      }
    }
    return dom
  }
}

class APIHelperUIInput extends APIHelperUIControl {
  toHTML () {
    let input = this._prepare(document.createElement('input'))
    let label = document.createElement('label')
    label.htmlFor = input.id
    label.innerHTML = this.title

    let container = document.createElement('div')
    container.title = this.description
    container.className = 'controls-container'
    container.append(input, label)
    return container
  }
}

class APIHelperUIButton extends APIHelperUIElement {
  constructor (uid, id, title, description, callback, shortcut = null, icon = null) {
    super(uid, id, title, description, icon)
    this.callback = callback
    if (shortcut) {
      /* name, desc, group, title, shortcut, callback, scope */
      new APIHelperUIShortcut(
        this.uid + '-' + this.id,
        this.description,
        this.uid,
        this.uid,
        shortcut,
        this.callback,
        null
      ).add()
    }
  }

  toHTML () {
    let button = document.createElement('button')
    button.className = 'waze-btn waze-btn-small waze-btn-white'
    button.innerHTML = this.title
    button.title = this.description
    button.onclick = this.callback
    return button
  }
}
