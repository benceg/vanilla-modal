const { hasOwnProperty: has, toString } = Object.prototype;
const html = document.documentElement;
const {
  0: transitionEnd,
  1: transitionDuration,
} = (() => {
  const el = document.createElement("div");
  if ("transition" in el.style) {
    return ["transitionend", "transitionDuration"];
  }
  if ("OTransition" in el.style) {
    if (Number(opera.version().split(".")[0]) > 11) {
      return ["otransitionend", "OTransitionDuration"];
    }
    return ["oTransitionEnd", "OTransitionDuration"];
  }
  if ("MozTransition" in el.style) {
    return ["transitionend", "MozTransitionDuration"];
  }
  if ("WebkitTransition" in el.style) {
    return ["webkitTransitionEnd", "WebkitTransitionDuration"];
  }
  return {};
})();
const trimRegex = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
const whitespaceRegex = /\s+/;

const defaults = {
  modal: ".modal",
  modalInner: ".modal-inner",
  modalContent: ".modal-content",
  open: "[data-modal-open]",
  close: "[data-modal-close]",
  page: "body",
  class: "modal-visible",
  loadClass: "vanilla-modal",
  clickOutside: true,
  closeKeys: [27],
  transitions: true,
  onbeforeopen: null,
  onbeforeclose: null,
  onopen: null,
  onclose: null,
};

function isArray(obj) {
  return toString.call(obj) === "[object Array]";
}

function throwError(message) {
  console.error(`VanillaModal: ${message}`);
}

function getNode(selector, parent) {
  const targetNode = parent || document;
  const node = targetNode.querySelector(selector);
  if (!node) {
    throwError(`${selector} not found in document`);
  }
  return node;
}

function trim(str) {
  return str.replace(trimRegex, "");
}

function addClass(el, _class) {
  if (!el.hasAttribute("class")) return void el.setAttribute("class", _class);
  const classNames = trim(el.getAttribute("class")).split(whitespaceRegex);
  if (classNames.indexOf(_class) >= 0) return;
  classNames.push(_class);
  el.setAttribute("class", classNames.join(" "));
}

function removeClass(el, _class) {
  if (!el.hasAttribute("class")) return;
  const classNames = trim(el.getAttribute("class")).split(whitespaceRegex);
  const idx = classNames.indexOf(_class);
  if (idx < 0) return;
  classNames.splice(idx, 1);
  el.setAttribute("class", classNames.join(" "));
}

function getElementContext(e) {
  if (e && typeof e.hash === "string") {
    return document.querySelector(e.hash);
  }
  else if (typeof e === "string") {
    return document.querySelector(e);
  }
  throwError("No selector supplied to open()");
}

function applyUserSettings(settings) {
  const obj = {};
  let k;
  for (k in defaults) if (has.call(defaults, k)) obj[k] = defaults[k];
  for (k in settings) if (has.call(settings, k)) obj[k] = settings[k];
  return obj;
}

function matches(target, selector) {
  const allMatches = target.ownerDocument.querySelectorAll(selector);
  if (!allMatches) return;
  for (let i = -1, match; match = allMatches.item(++i); ) {
    let node = target;
    do { if (node === html) break; if (node === match) return node; }
    while (node = node.parentNode);
  }
}

function prepend(target, source) {
  const fragment = document.createDocumentFragment();
  let el;
  while (el = source.firstChild) fragment.appendChild(el);
  target.insertBefore(fragment, target.firstChild);
}

function getDomNodes(settings) {
  const {
    modal,
    page,
    modalInner,
    modalContent,
  } = settings;
  const modalEl = getNode(modal);
  return {
    modal: modalEl,
    page: getNode(page),
    modalInner: getNode(modalInner, modalEl),
    modalContent: getNode(modalContent, modalEl),
  };
}

function hasTransition(el) {
  const css = window.getComputedStyle(el, null)[transitionDuration];
  return typeof css === "string" && parseFloat(css) > 0;
}

function crankshaftTryCatch(fn, context, event) {
  try { fn.call(context, event); }
  catch (err) { throwError(err); }
}

export default class VanillaModal {
  constructor(settings) {
    this.isOpen =
    this.isListening = false;
    this.current = null;
    this.listeners = [];

    this.dom = getDomNodes(this.settings = applyUserSettings(settings));

    addClass(this.dom.page, this.settings.loadClass);
    this.listen();
  }

  open(selector, e) {
    const { page } = this.dom;
    const { onbeforeopen, onopen, class: _class } = this.settings;
    this.releaseNode(this.current);
    this.current = getElementContext(selector);
    if (!this.current) {
      return throwError("VanillaModal target must exist on page");
    }
    if (typeof onbeforeopen === "function") {
      crankshaftTryCatch(onbeforeopen, this, e);
    }
    this.captureNode(this.current);
    addClass(page, _class);
    page.setAttribute("data-current-modal", this.current.id || "anonymous");
    this.isOpen = true;
    if (typeof onopen === "function") {
      crankshaftTryCatch(onopen, this, e);
    }
  }

  close(e) {
    if (!this.isOpen) return;
    const {
      settings: { transitions, onbeforeclose, class: _class },
      dom,
    } = this;
    this.isOpen = false;
    if (typeof onbeforeclose === "function") {
      crankshaftTryCatch(onbeforeclose, this, e);
    }
    removeClass(dom.page, _class);
    if (
      transitions &&
      transitionEnd &&
      hasTransition(dom.modal)
    ) {
      return this.closeModalWithTransition(e);
    }
    this.closeModal(e);
  }

  closeModal(e) {
    const { onclose } = this.settings;
    this.dom.page.removeAttribute("data-current-modal");
    this.releaseNode(this.current);
    this.isOpen = false;
    this.current = null;
    if (typeof onclose === "function") {
      crankshaftTryCatch(onclose, this, e);
    }
  }

  closeModalWithTransition(e) {
    const that = this;
    const { modal } = this.dom;
    function closeHandler() {
      modal.removeEventListener(transitionEnd, closeHandler, false);
      that.closeModal(e);
    }
    modal.addEventListener(transitionEnd, closeHandler, false);
  }

  captureNode(node) {
    if (node) prepend(this.dom.modalContent, node);
  }

  releaseNode(node) {
    if (node) prepend(node, this.dom.modalContent);
  }

  closeKeyHandler(e) {
    const { closeKeys } = this.settings;
    if (
      this.isOpen &&
      isArray(closeKeys) &&
      closeKeys.length &&
      closeKeys.indexOf(e.which) >= 0
    ) {
      e.preventDefault();
      this.close(e);
    }
  }

  outsideClickHandler(e) {
    if (!this.settings.clickOutside) return;
    const { modalInner } = this.dom;
    let node = e.target;
    do { if (node === html) break; if (node === modalInner) return; }
    while (node = node.parentNode);
    this.close(e);
  }

  delegateOpen(e) {
    const matchedNode = matches(e.target, this.settings.open);
    if (!matchedNode) return;
    e.preventDefault();
    this.open(matchedNode, e);
  }

  delegateClose(e) {
    if (!matches(e.target, this.settings.close)) return;
    e.preventDefault();
    this.close(e);
  }

  listen() {
    if (this.isListening) return throwError("Event listeners already applied");
    const that = this;
    function modalClick(e) { that.outsideClickHandler(e); }
    function docKeydown(e) { that.closeKeyHandler(e); }
    function docClick(e) { that.delegateOpen(e); that.delegateClose(e); }
    const { dom: { modal }, listeners } = this;
    listeners.push(modalClick, docKeydown, docClick);
    modal.addEventListener("click", modalClick, false);
    document.addEventListener("keydown", docKeydown, false);
    document.addEventListener("click", docClick, false);
    this.isListening = true;
  }

  destroy() {
    if (!this.isListening) return throwError("Event listeners already removed");
    const { dom: { modal }, listeners } = this;
    this.close();
    document.removeEventListener("click", listeners.pop(), false);
    document.removeEventListener("keydown", listeners.pop(), false);
    modal.removeEventListener("click", listeners.pop(), false);
    this.isListening = false;
  }
}
