# Vanilla Modal

[![npm version](https://badge.fury.io/js/vanilla-modal.svg)](https://www.npmjs.com/package/vanilla-modal)

[See the demo.](http://benceg.github.io/vanilla-modal/)

# Note: This is no longer under active maintenance.

### A tiny, flexible, completely dependency-free CSS-powered JavaScript modal.

Written in ECMAScript 2015 and transpiled for universal use with Babel 6.


> ### Please be aware of recent breaking changes.
>
> #### If importing using a `<script/>` tag
> `new VanillaModal()` will now be `new VanillaModal.default()`. This is due to the way in which Babel 6
> handles default exports.
>
> #### The semantically-unsound `[rel="modal:open"]` and `[rel="modal:close"]` default listeners have been deprecated
> They have been replaced by `[data-modal-open]` and `[data-modal-close]`.
> Please update your codebase if you were not supplying `open` or `close` parameters to the modal.


## License

[MIT](https://github.com/benceg/vanilla-modal/blob/master/LICENSE). Please feel free to offer any assistance - pull requests, bug tracking, suggestions are all welcome. The issue tracker is over [here](https://github.com/benceg/vanilla-modal/issues).


## Q & A

#### Why?

I was pretty fed up looking for a modal script that wasn't variously:

a) Bloated.
b) Inaccessible.
c) Needlessly complicated.
d) Riddled with third party dependencies (here's looking at you, jQuery).
e) Trying to hijack beautiful hardware-accelerated CSS transitions using JavaScript.

#### Can I integrate this with a single page app framework?

Since the modal's `open` and `close` event listeners are delegated from the document, you can use this script with any client-side routing or DOM-affecting framework.

If you're concerned about garbage collection, you may be pleased to know there's a `modal.destroy()` method baked in, which removes all internal events and references.

## Usage and Examples

#### 1. Install the script.

* Using NPM:
  ```sh
  npm install vanilla-modal --save
  ```

* Using Bower:
  ```sh
  bower install vanilla-modal --save
  ```

#### 2. Include the script in your project.

* The script is compiled using UMD module declarations. Use it with Webpack, Browserify, RequireJS or by simply including a `<script>` tag.

* ES 2015
  ```javascript
  import VanillaModal from 'vanilla-modal';
  ```

* CommonJS:
	```javascript
	const VanillaModal = require('vanilla-modal');
	```

* AMD
	```javascript
	require(['/node_modules/vanilla-modal/dist/index.js'], function(VanillaModal) {
    const vanillaModal = new VanillaModal();
  });
	```

* Browser
	```html
	<script src="/node_modules/vanilla-modal/dist/index.js"></script>
  <script>var vanillaModal = new VanillaModal.default()</script>
	```

#### 3. Create the modal's container using HTML.

This part is important. *Vanilla Modal* doesn't use any template strings or DOM building algorithms (although this is on the roadmap for version 2).

As a result, you will need to add your modal's _container_ HTML to your document - by using JavaScript ahead of the modal's instantiation, or by writing HTML into your document.

The payoff is that you can make the modal look any way you wish.

```html
<div class="modal">
  <div class="modal-inner">
    <a data-modal-close>Close</a>
    <div class="modal-content"></div>
  </div>
</div>
```

Following this, create some off-screen containers to house your modal's content. Give each an ID to make them selectable via anchor elements, and accessible using JavaScript-disabled browsers.

The modal will pick up the contents that are _inside_ the container with the ID specified by the triggering anchor's `href` attribute. It will place them in the `modalContent` container specified by your settings object. In the example above, the default container class of `.modal-content` is used.

```html
<div id="modal-1" class="modal-hider">Modal 1 content</div>
<div id="modal-2" class="modal-hider">Modal 2 content</div>
```

> Note: Vanilla Modal applies the class specified by `loadClass` to the `page` element.
  Both are specified in settings, and default respectively to `vanilla-modal` and `body`.
  This is done in order to make the modal as accessible as possible for all use cases.

```html
<style type="text/css">
  body.vanilla-modal .modal-hider {
    position: absolute;
    left: -99999em;
  }
</style>
```

#### 4. Create a VanillaModal instance.

```javascript
const modal = new VanillaModal(options);
```

> (Where `options` is a configuration hash. The full list of options, as well as their defaults, are listed below under the "Options and Defaults" heading.)


#### 5. Add your own CSS rules.

[Here's the demo's stylesheet](http://benceg.github.io/vanilla-modal/modal.css).

Vanilla Modal handles display logic using CSS. Hardware acceleration via CSS transforms comes highly recommended, for a smooth device-agnostic experience.

Two things to keep in mind:

* Using `display: none;` on any element will efface transitions you might otherwise wish to use.

* Whatever property you're using when closing the modal (`z-index` in the example below) will need a `transition-length` of `0` and a `transition-delay` property of the length of the longest other transition. This prevents the modal's obfuscating property from kicking in ahead of the closing animation (e.g. changing the `z-index` before the `opacity` animation has played out).

```
transition: opacity 0.2s, z-index 0s 0.2s;
```


#### 6. Delegation and Built-in Methods

Default delegate targets are as follows:

* `[data-modal-open]` triggers `modal.open()`.

* `[data-modal-close]` triggers `modal.close()`.

Examples follow:

The following element will open `#modal-1` using VanillaModal.

```html
<a href="#modal-1" data-modal-open>Modal 1</a>
```

The element below will close the modal.

```html
<a data-modal-close>Close</a>
```

These defaults can easily be changed at instantiation:

```js
const modal = new VanillaModal({
  open: '.my-open-class',
  close: '.my-close-class'
});
```


#### 7. Programmatically opening a modal

If you need to open the modal automatically, you can do so by passing a DOM ID string to the `open()` function.

For example:

```js
const modal = new VanillaModal();
modal.open('#foo');
```

The modal can likewise be closed programmatically using the `close()` method.


## VanillaModal Public Properties

* `{Boolean} isOpen`

  `true` if the modal is open.

* `{Node} current`

  The DOM node currently displayed in the modal. `null` if not set.

* `{Function} close()`

  The modal's callable `close` method.

* `{Function} open(String)`

  The modal's callable `open` method.
  This requires the passed DOM ID target to be present on the page.

* `{Function} destroy()`

  Closes the modal and removes all event listeners and internal references.
  This releases an instantiated modal to the next garbage collection cycle.


## Options and Defaults

The options object contains DOM selector strings and bindings.
Defaults are overridden by providing an `options` object to a new VanillaModal instance.

> Note: this API is feature-frozen for the 1.x release, but subject to change at 2.x.

#### Defaults:

```js
{
  modal: '.modal',
  modalInner: '.modal-inner',
  modalContent: '.modal-content',
  open: '[data-modal-open]',
  close: '[data-modal-close]',
  page: 'body',
  loadClass: 'vanilla-modal',
  class: 'modal-visible',
  clickOutside: false,
  closeKeys: [27],
  transitions: true,
  onBeforeOpen: null,
  onBeforeClose: null,
  onOpen: null,
  onClose: null
}
```

* `{String} modal`

  The class of the outer modal container. This is usually a fixed position element that takes up the whole screen.
  It doesn't have to be, though - the modal can take the form of a toast popup, for example, or any type of overlay you can think of.

* `{String} modalInner`

  The inner container of the modal.
  This usually houses a close button at the very least (see HTML above).
  It should also contain the `modalContent` element.

* `{String} modalContent`

  The container used to house the modal's content when it's transferred to the modal.
  This must be a child of `modalInner`.

* `{String} open`

  The selector to bind the `open()` event to.

* `{String} close`

  The selector to bind the `close()` event to.

* `{String} page`

  The outermost DOM selector to apply the `loadClass` and `class` classes to.
  This is `body` by default but could just as easily be `html` or `main` in any common web app.

* `{String} loadClass`

  The class to apply to the `page` DOM node at the moment the script loads.

* `{String} class`

  The class to apply to the `parent` container when the modal is open.

* `{Boolean} clickOutside`

  If set to `true`, a click in the area outside the `modalInner` container will fire a `close()` event.

* `{Array} closeKeys`

  Hitting any keycodes contained within this array while the modal is open will fire a `close()` event.
  Set this to `false` or an empty array to disable keyboard modal closure. Defaults to [27], which is `esc` on a traditional keyboard.

* `{Boolean} transitions`

  If set to `false`, the modal will treat every browser like IE 9 and ignore transitions when opening and closing.

* `{Function} onBeforeOpen`
  `{Function} onBeforeClose`
  `{Function} onOpen`
  `{Function} onClose`

  Hooks that fire before their respective events. These are context-bound to the VanillaModal instance, and receive their triggering events (e.g. `click` or `keydown`) as its only arguments.


## Compatibility

This script works in the evergreen mobile & desktop browsers, as well as IE 11, 10, and 9 (the last has no support for transitions).

It is not compatible with Opera Mini or the Blackberry browser, and there are currently no plans afoot to support either.
