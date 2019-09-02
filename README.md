# WME API Helper UI
## Require Script
```javascript
// @require https://greasyfork.org/scripts/24851-wazewrap/code/WazeWrap.js
// @require https://greasyfork.org/scripts/389117-apihelper/code/APIHelper.js?version=729351
// @require https://greasyfork.org/scripts/389577-apihelperui/code/APIHelperUI.js?version=729353
```
> See last available version on the GreasyFork homepage

## Initialisation of the API Helper
For initial helper use method `APIHelper.bootstrap()`:
```javascript
(function () {
  'use strict';
  APIHelper.bootstrap();
})();
```

## UI Helper

## Example

```javascript
(function () {
  'use strict';

  let helper, panel, modal, tab;

  // uniq script name
  const NAME = 'Some Script';
  // translation structure
  const TRANSLATION = {
    'en': {
      title: 'Title example',
      buttons: {
        A: {
          title: 'But 1 EN',
          description: 'Button 1 can do smth in EN'
        },
        B: {
          title: 'But 2 EN',
          description: 'Button 2 can do smth in EN'
        },
      }
    },
    'uk': {
      title: 'Приклад назви',
      buttons: {
        A: {
          title: 'Кнопка 1',
          description: 'Кнопка 1 щось має робити'
        },
        B: {
          title: 'Кнопка 2',
          description: 'Кнопка 2 щось має робити'
        },
      }
    },
    'ru': {
      title: 'Пример названия',
      buttons: {
        A: {
          title: 'Кнопка 1',
          description: 'Кнопка 1 должна что-то делать'
        },
        B: {
          title: 'Кнопка 2',
          description: 'Кнопка 2 должна что-то делать'
        },
      }
    }
  };

  APIHelper.bootstrap();
  APIHelper.addTranslation(NAME, TRANSLATION);
  
  // buttons structure
  let buttons = {
    A: {
      title: I180n.t(NAME).buttons.A.title,
      description: I180n.t(NAME).buttons.A.description,
      shortcut: 'S+49',
      callback: function() {
        console.log('Button 1');
        return false;
      }
    },
    B: {
      title: I180n.t(NAME).buttons.B.title,
      description: I180n.t(NAME).buttons.B.description,
      shortcut: 'S+50',
      callback: function() {
        console.log('Button 2');
        return false;
      }
    },
  };


  $(document)
      .on('ready.apihelper', function () {
        console.info('@ready');

        helper = new APIHelperUI('Example Script');

        panel = helper.createPanel(I18n.t(NAME).title);
        panel.addButtons(buttons);

        modal = helper.createModal(I18n.t(NAME).title);
        modal.addButtons(buttons);

        tab = helper.createTab(I18n.t(NAME).title);
        tab.addButtons(buttons);
        tab.init();
      })
      .on('segment.apihelper', (e, el) => {
        console.log('@segment', el);
        panel.init(el);
      })
      .on('landmark.apihelper', (e, el) => {
        console.info('@landmark', el);
        panel.init(el);
      })
      .on('landmark-collection.apihelper', (e, el) => {
        console.info('@landmark-collection', el)
        panel.init(el);
      });
})();

```

## Links
Author homepage: http://anton.shevchuk.name/  
Script homepage: https://github.com/AntonShevchuk/wme-api-helper-ui/  
GreasyFork: https://greasyfork.org/uk/scripts/389577-apihelperui/
