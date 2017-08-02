const defaults = {
  modal: '.modal',
  modalInner: '.modal-inner',
  modalContent: '.modal-content',
  open: '[data-modal-open]',
  close: '[data-modal-close]',
  page: 'body',
  class: 'modal-visible',
  loadClass: 'vanilla-modal',
  clickOutside: true,
  closeKeys: [27],
  transitions: true,
  transitionEnd: null,
  onBeforeOpen: null,
  onBeforeClose: null,
  onOpen: null,
  onClose: null,
};

function throwError(message) {
  // eslint-disable-next-line no-console
  console.error(`VanillaModal: ${message}`);
}

function find(arr, callback) {
  return (key) => {
    const filteredArray = arr.filter(callback);
    return (filteredArray[0] ? filteredArray[0][key] : undefined);
  };
}

function transitionEndVendorSniff() {
  const el = document.createElement('div');
  const transitions = [
    { key: 'transition', value: 'transitionend' },
    { key: 'OTransition', value: 'otransitionend' },
    { key: 'MozTransition', value: 'transitionend' },
    { key: 'WebkitTransition', value: 'webkitTransitionEnd' },
  ];
  return find(transitions, ({ key }) => (typeof el.style[key] !== 'undefined'))('value');
}

function isPopulatedArray(arr) {
  return Object.prototype.toString.call(arr) === '[object Array]' && arr.length;
}

function getNode(selector, parent) {
  const targetNode = parent || document;
  const node = targetNode.querySelector(selector);
  if (!node) {
    throwError(`${selector} not found in document.`);
  }
  return node;
}

function addClass(el, className) {
  if (!(el instanceof HTMLElement)) {
    throwError('Not a valid HTML element.');
  }
  el.setAttribute(
    'class',
    el.className.split(' ').filter(cn => cn !== className).concat(className).join(' '),
  );
}

function removeClass(el, className) {
  if (!(el instanceof HTMLElement)) {
    throwError('Not a valid HTML element.');
  }
  el.setAttribute(
    'class',
    el.className.split(' ').filter(cn => cn !== className).join(' '),
  );
}

function getElementContext(e) {
  if (e && typeof e.hash === 'string') {
    return document.querySelector(e.hash);
  } else if (typeof e === 'string') {
    return document.querySelector(e);
  }
  throwError('No selector supplied to open()');
  return null;
}

function applyUserSettings(settings) {
  return {
    ...defaults,
    ...settings,
    transitionEnd: transitionEndVendorSniff(),
  };
}

function matches(e, selector) {
  const allMatches = (e.target.document || e.target.ownerDocument).querySelectorAll(selector);
  for (let i = 0; i < allMatches.length; i += 1) {
    let node = e.target;
    while (node && node !== document.body) {
      if (node === allMatches[i]) {
        return node;
      }
      node = node.parentNode;
    }
  }
  return null;
}

export default class VanillaModal {

  constructor(settings) {
    this.isOpen = false;
    this.current = null;
    this.isListening = false;

    this.settings = applyUserSettings(settings);
    this.dom = this.getDomNodes();

    this.open = this.open.bind(this);
    this.close = this.close.bind(this);
    this.closeKeyHandler = this.closeKeyHandler.bind(this);
    this.outsideClickHandler = this.outsideClickHandler.bind(this);
    this.delegateOpen = this.delegateOpen.bind(this);
    this.delegateClose = this.delegateClose.bind(this);
    this.listen = this.listen.bind(this);
    this.destroy = this.destroy.bind(this);

    this.addLoadedCssClass();
    this.listen();
  }

  getDomNodes() {
    const {
      modal,
      page,
      modalInner,
      modalContent,
    } = this.settings;
    return {
      modal: getNode(modal),
      page: getNode(page),
      modalInner: getNode(modalInner, getNode(modal)),
      modalContent: getNode(modalContent, getNode(modal)),
    };
  }

  addLoadedCssClass() {
    addClass(this.dom.page, this.settings.loadClass);
  }

  setOpenId(id) {
    const { page } = this.dom;
    page.setAttribute('data-current-modal', id || 'anonymous');
  }

  removeOpenId() {
    const { page } = this.dom;
    page.removeAttribute('data-current-modal');
  }

  open(allMatches, e) {
    const { page } = this.dom;
    const { onBeforeOpen, onOpen } = this.settings;
    if (!(this.current instanceof HTMLElement === false)) {
      throwError('VanillaModal target must exist on page.');
      return;
    }
    this.releaseNode(this.current);
    this.current = getElementContext(allMatches);
    if (typeof onBeforeOpen === 'function') {
      onBeforeOpen.call(this, e);
    }
    this.captureNode(this.current);
    addClass(page, this.settings.class);
    this.setOpenId(this.current.id);
    this.isOpen = true;
    if (typeof onOpen === 'function') {
      onOpen.call(this, e);
    }
  }

  detectTransition() {
    const { modal } = this.dom;
    const css = window.getComputedStyle(modal, null);
    return Boolean([
      'transitionDuration',
      'oTransitionDuration',
      'MozTransitionDuration',
      'webkitTransitionDuration',
    ]
      .filter(i => typeof css[i] === 'string' && parseFloat(css[i]) > 0)
      .length);
  }

  close(e) {
    const {
      transitions,
      transitionEnd,
      onBeforeClose,
    } = this.settings;
    const hasTransition = this.detectTransition();
    if (this.isOpen) {
      this.isOpen = false;
      if (typeof onBeforeClose === 'function') {
        onBeforeClose.call(this, e);
      }
      removeClass(this.dom.page, this.settings.class);
      if (transitions && transitionEnd && hasTransition) {
        this.closeModalWithTransition(e);
      } else {
        this.closeModal(e);
      }
    }
  }

  closeModal(e) {
    const { onClose } = this.settings;
    this.removeOpenId(this.dom.page);
    this.releaseNode(this.current);
    this.isOpen = false;
    this.current = null;
    if (typeof onClose === 'function') {
      onClose.call(this, e);
    }
  }

  closeModalWithTransition(e) {
    const { modal } = this.dom;
    const { transitionEnd } = this.settings;
    const closeTransitionHandler = () => {
      modal.removeEventListener(transitionEnd, closeTransitionHandler);
      this.closeModal(e);
    };
    modal.addEventListener(transitionEnd, closeTransitionHandler);
  }

  captureNode(node) {
    const { modalContent } = this.dom;
    while (node.childNodes.length) {
      modalContent.appendChild(node.childNodes[0]);
    }
  }

  releaseNode(node) {
    const { modalContent } = this.dom;
    while (modalContent.childNodes.length) {
      node.appendChild(modalContent.childNodes[0]);
    }
  }

  closeKeyHandler(e) {
    const { closeKeys } = this.settings;
    if (
      isPopulatedArray(closeKeys) &&
      closeKeys.indexOf(e.which) > -1 &&
      this.isOpen === true
    ) {
      e.preventDefault();
      this.close(e);
    }
  }

  outsideClickHandler(e) {
    const { clickOutside } = this.settings;
    const { modalInner } = this.dom;
    if (clickOutside) {
      let node = e.target;
      while (node && node !== document.body) {
        if (node === modalInner) {
          return;
        }
        node = node.parentNode;
      }
      this.close(e);
    }
  }

  delegateOpen(e) {
    const { open } = this.settings;
    const matchedNode = matches(e, open);
    if (matchedNode) {
      e.preventDefault();
      this.closeModal(e);
      this.open(matchedNode, e);
    }
  }

  delegateClose(e) {
    const { close } = this.settings;
    if (matches(e, close)) {
      e.preventDefault();
      this.close(e);
    }
  }

  listen() {
    const { modal } = this.dom;
    if (!this.isListening) {
      modal.addEventListener('click', this.outsideClickHandler, false);
      document.addEventListener('keydown', this.closeKeyHandler, false);
      document.addEventListener('click', this.delegateOpen, false);
      document.addEventListener('click', this.delegateClose, false);
      this.isListening = true;
    } else {
      throwError('Event listeners already applied.');
    }
  }

  destroy() {
    const { modal } = this.dom;
    if (this.isListening) {
      this.close();
      modal.removeEventListener('click', this.outsideClickHandler);
      document.removeEventListener('keydown', this.closeKeyHandler);
      document.removeEventListener('click', this.delegateOpen);
      document.removeEventListener('click', this.delegateClose);
      this.isListening = false;
    } else {
      throwError('Event listeners already removed.');
    }
  }
}
