/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	/* global AFRAME */

	if (typeof AFRAME === 'undefined') {
	  throw new Error('Component attempted to register before AFRAME was available.');
	}

	__webpack_require__(1);
	__webpack_require__(2);
	__webpack_require__(3);
	__webpack_require__(4);
	__webpack_require__(5);
	__webpack_require__(6);
	__webpack_require__(7);
	__webpack_require__(8);

	/**
	 * Super Hands component for A-Frame.
	 */
	AFRAME.registerComponent('super-hands', {
	  schema: {
	    colliderState: { default: 'collided' },
	    colliderEvent: { default: 'hit' },
	    colliderEventProperty: { default: 'el' },
	    grabStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown']
	    },
	    grabEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup']
	    },
	    stretchStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown']
	    },
	    stretchEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup']
	    },
	    dragDropStartButtons: {
	      default: ['gripdown', 'trackpaddown', 'triggerdown', 'gripclose', 'pointup', 'thumbup', 'pointingstart', 'pistolstart', 'thumbstickdown']
	    },
	    dragDropEndButtons: {
	      default: ['gripup', 'trackpadup', 'triggerup', 'gripopen', 'pointdown', 'thumbdown', 'pointingend', 'pistolend', 'thumbstickup']
	    }
	  },

	  /**
	   * Set if component needs multiple instancing.
	   */
	  multiple: false,

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   */
	  init: function init() {
	    // constants
	    this.HOVER_EVENT = 'hover-start';
	    this.UNHOVER_EVENT = 'hover-end';
	    this.GRAB_EVENT = 'grab-start';
	    this.UNGRAB_EVENT = 'grab-end';
	    this.STRETCH_EVENT = 'stretch-start';
	    this.UNSTRETCH_EVENT = 'stretch-end';
	    this.DRAG_EVENT = 'drag-start';
	    this.UNDRAG_EVENT = 'drag-end';
	    this.DRAGOVER_EVENT = 'dragover-start';
	    this.UNDRAGOVER_EVENT = 'dragover-end';
	    this.DRAGDROP_EVENT = 'drag-drop';

	    // links to other systems/components
	    this.otherSuperHand = null;

	    // state tracking - global event handlers (GEH)
	    this.gehDragged = new Set();
	    this.gehClicking = new Set();

	    // state tracking - reaction components
	    this.hoverEls = [];
	    this.state = new Map();
	    this.grabbing = false;
	    this.stretching = false;
	    this.dragging = false;

	    this.unHover = this.unHover.bind(this);
	    this.unWatch = this.unWatch.bind(this);
	    this.onHit = this.onHit.bind(this);
	    this.onGrabStartButton = this.onGrabStartButton.bind(this);
	    this.onGrabEndButton = this.onGrabEndButton.bind(this);
	    this.onStretchStartButton = this.onStretchStartButton.bind(this);
	    this.onStretchEndButton = this.onStretchEndButton.bind(this);
	    this.onDragDropStartButton = this.onDragDropStartButton.bind(this);
	    this.onDragDropEndButton = this.onDragDropEndButton.bind(this);
	    this.system.registerMe(this);
	  },

	  /**
	   * Called when component is attached and when component data changes.
	   * Generally modifies the entity based on the data.
	   */
	  update: function update(oldData) {
	    this.unRegisterListeners(oldData);
	    this.registerListeners();
	  },

	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function remove() {
	    this.system.unregisterMe(this);
	    // move listener registration to init/remove
	    // as described in according to AFRAME 0.5.0 component guide
	    this.unRegisterListeners();
	  },
	  /**
	   * Called when entity pauses.
	   * Use to stop or remove any dynamic or background behavior such as events.
	   */
	  pause: function pause() {},

	  /**
	   * Called when entity resumes.
	   * Use to continue or add any dynamic or background behavior such as events.
	   */
	  play: function play() {},
	  onGrabStartButton: function onGrabStartButton(evt) {
	    this.grabbing = true;
	    this.dispatchMouseEventAll('mousedown', this.el);
	    this.gehClicking = new Set(this.hoverEls);
	    this.updateGrabbed();
	  },
	  onGrabEndButton: function onGrabEndButton(evt) {
	    var _this = this;

	    var clickables = this.hoverEls.filter(function (h) {
	      return _this.gehClicking.has(h);
	    });
	    this.dispatchMouseEventAll('mouseup', this.el, true);
	    for (var i = 0; i < clickables.length; i++) {
	      this.dispatchMouseEvent(clickables[i], 'click', this.el);
	    }
	    this.gehClicking.clear();
	    if (this.state.has(this.GRAB_EVENT)) {
	      this.state.get(this.GRAB_EVENT).emit(this.UNGRAB_EVENT, { hand: this.el });
	      /* push to top of stack so a drop followed by re-grab gets the same
	         target */
	      this.promoteHoveredEl(this.state.get(this.GRAB_EVENT));
	      this.state.delete(this.GRAB_EVENT);
	      this.hover();
	    }
	    this.grabbing = false;
	  },
	  onStretchStartButton: function onStretchStartButton(evt) {
	    this.stretching = true;
	    this.updateStretched();
	  },
	  onStretchEndButton: function onStretchEndButton(evt) {
	    var stretched = this.state.get(this.STRETCH_EVENT);
	    if (stretched) {
	      stretched.emit(this.UNSTRETCH_EVENT, { hand: this.el });
	      this.promoteHoveredEl(stretched);
	      this.state.delete(this.STRETCH_EVENT);
	      this.hover();
	    }
	    this.stretching = false;
	  },
	  onDragDropStartButton: function onDragDropStartButton(evt) {
	    this.dragging = true;
	    if (this.hoverEls.length) {
	      this.gehDragged = new Set(this.hoverEls);
	      this.dispatchMouseEventAll('dragstart', this.el);
	    }
	    this.updateDragged();
	  },
	  onDragDropEndButton: function onDragDropEndButton(evt) {
	    var _this2 = this;

	    var ddevt;
	    var dropTarget;
	    var carried = this.state.get(this.DRAG_EVENT);
	    this.dragging = false; // keep _unHover() from activating another droptarget
	    this.gehDragged.forEach(function (carried) {
	      _this2.dispatchMouseEvent(carried, 'dragend', _this2.el);
	      // fire event both ways for all intersected targets
	      _this2.dispatchMouseEventAll('drop', carried, true, true);
	      _this2.dispatchMouseEventAll('dragleave', carried, true, true);
	    });
	    this.gehDragged.clear();
	    if (carried) {
	      ddevt = { hand: this.el, dropped: carried, on: null };
	      dropTarget = this.findTarget(this.DRAGDROP_EVENT, ddevt, true);
	      if (dropTarget) {
	        ddevt.on = dropTarget;
	        this.emitCancelable(carried, this.DRAGDROP_EVENT, ddevt);
	        this._unHover(dropTarget);
	      }
	      carried.emit(this.UNDRAG_EVENT, { hand: this.el });
	      this.promoteHoveredEl(carried);
	      this.state.delete(this.DRAG_EVENT);
	      this.hover();
	    }
	  },
	  onHit: function onHit(evt) {
	    var _this3 = this;

	    var hitEl = evt.detail[this.data.colliderEventProperty];
	    var hitElIndex;
	    if (!hitEl) {
	      return;
	    }
	    hitElIndex = this.hoverEls.indexOf(hitEl);
	    if (hitElIndex === -1) {
	      this.hoverEls.push(hitEl);
	      // later loss of collision will remove from hoverEls
	      hitEl.addEventListener('stateremoved', this.unWatch);
	      this.dispatchMouseEvent(hitEl, 'mouseover', this.el);
	      if (this.dragging && this.gehDragged.size) {
	        // events on targets and on dragged
	        this.gehDragged.forEach(function (dragged) {
	          _this3.dispatchMouseEventAll('dragenter', dragged, true, true);
	        });
	      }
	      this.updateGrabbed();
	      this.updateStretched();
	      this.updateDragged();
	      this.hover();
	    }
	  },
	  updateGrabbed: function updateGrabbed() {
	    var carried = this.state.get(this.GRAB_EVENT);
	    if (this.grabbing && !carried) {
	      carried = this.findTarget(this.GRAB_EVENT, { hand: this.el });
	      if (carried) {
	        this.state.set(this.GRAB_EVENT, carried);
	        this._unHover(carried);
	      }
	    }
	  },
	  updateStretched: function updateStretched() {
	    var stretched = this.state.get(this.STRETCH_EVENT);
	    if (this.stretching && !stretched) {
	      stretched = this.findTarget(this.STRETCH_EVENT, { hand: this.el });
	      if (stretched) {
	        this.state.set(this.STRETCH_EVENT, stretched);
	        this._unHover(stretched);
	      }
	    }
	  },
	  updateDragged: function updateDragged() {
	    var dragged = this.state.get(this.DRAG_EVENT);
	    if (this.dragging && !dragged) {
	      /* prefer carried so that a drag started after a grab will work
	       with carried element rather than a currently intersected drop target.
	       fall back to queue in case a drag is initiated independent
	       of a grab */
	      if (this.state.get(this.GRAB_EVENT) && !this.emitCancelable(this.state.get(this.GRAB_EVENT), this.DRAG_EVENT, { hand: this.el })) {
	        dragged = this.state.get(this.GRAB_EVENT);
	      } else {
	        dragged = this.findTarget(this.DRAG_EVENT, { hand: this.el });
	      }
	      if (dragged) {
	        this.state.set(this.DRAG_EVENT, dragged);
	        this._unHover(dragged);
	      }
	    }
	  },
	  /* search collided entities for target to hover/dragover */
	  hover: function hover() {
	    var hvrevt, hoverEl;
	    // end previous hover
	    if (this.state.has(this.HOVER_EVENT)) {
	      this._unHover(this.state.get(this.HOVER_EVENT), true);
	    }
	    if (this.state.has(this.DRAGOVER_EVENT)) {
	      this._unHover(this.state.get(this.DRAGOVER_EVENT), true);
	    }
	    if (this.dragging && this.state.get(this.DRAG_EVENT)) {
	      hvrevt = {
	        hand: this.el,
	        hovered: hoverEl,
	        carried: this.state.get(this.DRAG_EVENT)
	      };
	      hoverEl = this.findTarget(this.DRAGOVER_EVENT, hvrevt, true);
	      if (hoverEl) {
	        hoverEl.addEventListener('stateremoved', this.unHover);
	        this.emitCancelable(this.state.get(this.DRAG_EVENT), this.DRAGOVER_EVENT, hvrevt);
	        this.state.set(this.DRAGOVER_EVENT, hoverEl);
	      }
	    }
	    // fallback to hover if not dragging or dragover wasn't successful
	    if (!this.state.has(this.DRAGOVER_EVENT)) {
	      hoverEl = this.findTarget(this.HOVER_EVENT, { hand: this.el }, true);
	      if (hoverEl) {
	        hoverEl.addEventListener('stateremoved', this.unHover);
	        this.state.set(this.HOVER_EVENT, hoverEl);
	      }
	    }
	  },
	  /* tied to 'stateremoved' event for hovered entities,
	     called when controller moves out of collision range of entity */
	  unHover: function unHover(evt) {
	    if (evt.detail.state === this.data.colliderState) {
	      this._unHover(evt.target);
	    }
	  },
	  /* inner unHover steps needed regardless of cause of unHover */
	  _unHover: function _unHover(el, skipNextHover) {
	    var evt;
	    el.removeEventListener('stateremoved', this.unHover);
	    if (el === this.state.get(this.DRAGOVER_EVENT)) {
	      this.state.delete(this.DRAGOVER_EVENT);
	      evt = {
	        hand: this.el,
	        hovered: el,
	        carried: this.state.get(this.DRAG_EVENT)
	      };
	      this.emitCancelable(el, this.UNDRAGOVER_EVENT, evt);
	      if (this.state.has(this.DRAG_EVENT)) {
	        this.emitCancelable(this.state.get(this.DRAG_EVENT), this.UNDRAGOVER_EVENT, evt);
	      }
	    }
	    if (el === this.state.get(this.HOVER_EVENT)) {
	      this.state.delete(this.HOVER_EVENT);
	      this.emitCancelable(el, this.UNHOVER_EVENT, { hand: this.el });
	    }
	    // activate next target, if present
	    if (!skipNextHover) {
	      this.hover();
	    }
	  },
	  unWatch: function unWatch(evt) {
	    if (evt.detail.state === this.data.colliderState) {
	      this._unWatch(evt.target);
	    }
	  },
	  _unWatch: function _unWatch(target) {
	    var _this4 = this;

	    var hoverIndex = this.hoverEls.indexOf(target);
	    target.removeEventListener('stateremoved', this.unWatch);
	    if (hoverIndex !== -1) {
	      this.hoverEls.splice(hoverIndex, 1);
	    }
	    this.gehDragged.forEach(function (dragged) {
	      _this4.dispatchMouseEvent(target, 'dragleave', dragged);
	      _this4.dispatchMouseEvent(dragged, 'dragleave', target);
	    });
	    this.dispatchMouseEvent(target, 'mouseout', this.el);
	  },
	  registerListeners: function registerListeners() {
	    var _this5 = this;

	    this.el.addEventListener(this.data.colliderEvent, this.onHit);

	    this.data.grabStartButtons.forEach(function (b) {
	      _this5.el.addEventListener(b, _this5.onGrabStartButton);
	    });
	    this.data.grabEndButtons.forEach(function (b) {
	      _this5.el.addEventListener(b, _this5.onGrabEndButton);
	    });
	    this.data.stretchStartButtons.forEach(function (b) {
	      _this5.el.addEventListener(b, _this5.onStretchStartButton);
	    });
	    this.data.stretchEndButtons.forEach(function (b) {
	      _this5.el.addEventListener(b, _this5.onStretchEndButton);
	    });
	    this.data.dragDropStartButtons.forEach(function (b) {
	      _this5.el.addEventListener(b, _this5.onDragDropStartButton);
	    });
	    this.data.dragDropEndButtons.forEach(function (b) {
	      _this5.el.addEventListener(b, _this5.onDragDropEndButton);
	    });
	  },
	  unRegisterListeners: function unRegisterListeners(data) {
	    var _this6 = this;

	    data = data || this.data;
	    if (Object.keys(data).length === 0) {
	      // Empty object passed on initalization
	      return;
	    }
	    this.el.removeEventListener(data.colliderEvent, this.onHit);

	    data.grabStartButtons.forEach(function (b) {
	      _this6.el.removeEventListener(b, _this6.onGrabStartButton);
	    });
	    data.grabEndButtons.forEach(function (b) {
	      _this6.el.removeEventListener(b, _this6.onGrabEndButton);
	    });
	    data.stretchStartButtons.forEach(function (b) {
	      _this6.el.removeEventListener(b, _this6.onStretchStartButton);
	    });
	    data.stretchEndButtons.forEach(function (b) {
	      _this6.el.removeEventListener(b, _this6.onStretchEndButton);
	    });
	    data.dragDropStartButtons.forEach(function (b) {
	      _this6.el.removeEventListener(b, _this6.onDragDropStartButton);
	    });
	    data.dragDropEndButtons.forEach(function (b) {
	      _this6.el.removeEventListener(b, _this6.onDragDropEndButton);
	    });
	  },
	  emitCancelable: function emitCancelable(target, name, detail) {
	    var data, evt;
	    detail = detail || {};
	    data = { bubbles: true, cancelable: true, detail: detail };
	    data.detail.target = data.detail.target || target;
	    evt = new window.CustomEvent(name, data);
	    return target.dispatchEvent(evt);
	  },
	  dispatchMouseEvent: function dispatchMouseEvent(target, name, relatedTarget) {
	    var mEvt = new window.MouseEvent(name, { relatedTarget: relatedTarget });
	    target.dispatchEvent(mEvt);
	  },
	  dispatchMouseEventAll: function dispatchMouseEventAll(name, relatedTarget, filterUsed, alsoReverse) {
	    var _this7 = this;

	    var els = this.hoverEls;
	    if (filterUsed) {
	      els = els.filter(function (el) {
	        return el !== _this7.state.get(_this7.GRAB_EVENT) && el !== _this7.state.get(_this7.DRAG_EVENT) && el !== _this7.state.get(_this7.STRETCH_EVENT) && !_this7.gehDragged.has(el);
	      });
	    }
	    if (alsoReverse) {
	      for (var i = 0; i < els.length; i++) {
	        this.dispatchMouseEvent(els[i], name, relatedTarget);
	        this.dispatchMouseEvent(relatedTarget, name, els[i]);
	      }
	    } else {
	      for (var _i = 0; _i < els.length; _i++) {
	        this.dispatchMouseEvent(els[_i], name, relatedTarget);
	      }
	    }
	  },
	  findTarget: function findTarget(evType, detail, filterUsed) {
	    var _this8 = this;

	    var elIndex;
	    var eligibleEls = this.hoverEls;
	    if (filterUsed) {
	      eligibleEls = eligibleEls.filter(function (el) {
	        return el !== _this8.state.get(_this8.GRAB_EVENT) && el !== _this8.state.get(_this8.DRAG_EVENT) && el !== _this8.state.get(_this8.STRETCH_EVENT);
	      });
	    }
	    for (elIndex = eligibleEls.length - 1; elIndex >= 0; elIndex--) {
	      if (!this.emitCancelable(eligibleEls[elIndex], evType, detail)) {
	        return eligibleEls[elIndex];
	      }
	    }
	    return null;
	  },
	  promoteHoveredEl: function promoteHoveredEl(el) {
	    var hoverIndex = this.hoverEls.indexOf(el);
	    if (hoverIndex !== -1) {
	      this.hoverEls.splice(hoverIndex, 1);
	      this.hoverEls.push(el);
	    }
	  }
	});

/***/ },
/* 1 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerSystem('super-hands', {
	  init: function init() {
	    this.superHands = [];
	  },
	  registerMe: function registerMe(comp) {
	    // when second hand registers, store links
	    if (this.superHands.length === 1) {
	      this.superHands[0].otherSuperHand = comp;
	      comp.otherSuperHand = this.superHands[0];
	    }
	    this.superHands.push(comp);
	  },
	  unregisterMe: function unregisterMe(comp) {
	    var index = this.superHands.indexOf(comp);
	    if (index !== -1) {
	      this.superHands.splice(index, 1);
	    }
	    this.superHands.forEach(function (x) {
	      if (x.otherSuperHand === comp) {
	        x.otherSuperHand = null;
	      }
	    });
	  }
	});

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('hoverable', {
	  init: function init() {
	    this.HOVERED_STATE = 'hovered';
	    this.HOVER_EVENT = 'hover-start';
	    this.UNHOVER_EVENT = 'hover-end';

	    this.hoverers = [];

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);

	    this.el.addEventListener(this.HOVER_EVENT, this.start);
	    this.el.addEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.start);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.end);
	  },
	  start: function start(evt) {
	    this.el.addState(this.HOVERED_STATE);
	    if (this.hoverers.indexOf(evt.detail.hand) === -1) {
	      this.hoverers.push(evt.detail.hand);
	    }
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  },
	  end: function end(evt) {
	    var handIndex = this.hoverers.indexOf(evt.detail.hand);
	    if (handIndex !== -1) {
	      this.hoverers.splice(handIndex, 1);
	    }
	    if (this.hoverers.length < 1) {
	      this.el.removeState(this.HOVERED_STATE);
	    }
	  }
	});

/***/ },
/* 3 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('grabbable', {
	  schema: {
	    usePhysics: { default: 'ifavailable' },
	    maxGrabbers: { type: 'int', default: NaN },
	    invert: { default: false },
	    suppressY: { default: false }
	  },
	  init: function init() {
	    var _this = this;

	    this.GRABBED_STATE = 'grabbed';
	    this.GRAB_EVENT = 'grab-start';
	    this.UNGRAB_EVENT = 'grab-end';
	    this.grabbed = false;
	    this.grabbers = [];
	    this.constraints = new Map();

	    this.el.addEventListener(this.GRAB_EVENT, function (e) {
	      return _this.start(e);
	    });
	    this.el.addEventListener(this.UNGRAB_EVENT, function (e) {
	      return _this.end(e);
	    });
	    this.el.addEventListener('mouseout', function (e) {
	      return _this.lostGrabber(e);
	    });
	  },
	  update: function update(oldDat) {
	    if (this.data.usePhysics === 'never' && this.constraints.size) {
	      this.clearConstraints();
	    }
	    this.xFactor = this.data.invert ? -1 : 1;
	    this.zFactor = this.data.invert ? -1 : 1;
	    this.yFactor = (this.data.invert ? -1 : 1) * !this.data.suppressY;
	  },
	  tick: function tick() {
	    if (this.grabber && !this.constraints.size && this.data.usePhysics !== 'only') {
	      var handPosition = this.grabber.object3D ? this.grabber.object3D.getWorldPosition() : this.grabber.getAttribute('position');
	      var previousPosition = this.previousPosition || handPosition;
	      var deltaPosition = {
	        x: handPosition.x - previousPosition.x,
	        y: handPosition.y - previousPosition.y,
	        z: handPosition.z - previousPosition.z
	      };
	      var position = this.el.getAttribute('position');
	      this.previousPosition = handPosition;
	      this.el.setAttribute('position', {
	        x: position.x + deltaPosition.x * this.xFactor,
	        y: position.y + deltaPosition.y * this.yFactor,
	        z: position.z + deltaPosition.z * this.zFactor
	      });
	    }
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.GRAB_EVENT, this.start);
	    this.el.removeEventListener(this.UNGRAB_EVENT, this.end);
	    this.clearConstraints();
	  },
	  start: function start(evt) {
	    // room for more grabbers?
	    var grabAvailable = !Number.isFinite(this.data.maxGrabbers) || this.grabbers.length < this.data.maxGrabbers;

	    if (this.grabbers.indexOf(evt.detail.hand) === -1 && grabAvailable) {
	      this.grabbers.push(evt.detail.hand);
	      // initiate physics constraint if available and not already existing
	      if (this.data.usePhysics !== 'never' && this.el.body && evt.detail.hand.body && !this.constraints.has(evt.detail.hand)) {
	        var newCon = new window.CANNON.LockConstraint(this.el.body, evt.detail.hand.body);
	        this.el.body.world.addConstraint(newCon);
	        this.constraints.set(evt.detail.hand, newCon);
	      } else if (!this.grabber) {
	        // otherwise, initiate manual grab if first grabber
	        this.grabber = evt.detail.hand;
	        this.previousPosition = null;
	      }
	      // notify super-hands that the gesture was accepted
	      if (evt.preventDefault) {
	        evt.preventDefault();
	      }
	      this.grabbed = true;
	      this.el.addState(this.GRABBED_STATE);
	    }
	  },
	  end: function end(evt) {
	    var handIndex = this.grabbers.indexOf(evt.detail.hand);
	    var constraint = this.constraints.get(evt.detail.hand);
	    if (handIndex !== -1) {
	      this.grabbers.splice(handIndex, 1);
	      this.grabber = this.grabbers[0];
	      this.previousPosition = null;
	    }
	    if (constraint) {
	      this.el.body.world.removeConstraint(constraint);
	      this.constraints.delete(evt.detail.hand);
	    }
	    if (!this.grabber) {
	      this.grabbed = false;
	      this.el.removeState(this.GRABBED_STATE);
	    }
	  },
	  clearConstraints: function clearConstraints() {
	    if (this.el.body) {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = this.constraints.values()[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var c = _step.value;

	          this.el.body.world.removeConstraint(c);
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }
	    }
	    this.constraints.clear();
	  },
	  lostGrabber: function lostGrabber(evt) {
	    var i = this.grabbers.indexOf(evt.relatedTarget);
	    // if a queued, non-physics grabber leaves the collision zone, forget it
	    if (i !== -1 && evt.relatedTarget !== this.grabber && !this.constraints.has(evt.relatedTarget)) {
	      this.grabbers.splice(i, 1);
	    }
	  }
	});

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME, THREE */
	AFRAME.registerComponent('stretchable', {
	  schema: {
	    usePhysics: { default: 'ifavailable' },
	    invert: { default: false }
	  },
	  init: function init() {
	    this.STRETCHED_STATE = 'stretched';
	    this.STRETCH_EVENT = 'stretch-start';
	    this.UNSTRETCH_EVENT = 'stretch-end';
	    this.stretched = false;
	    this.stretchers = [];

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);

	    this.el.addEventListener(this.STRETCH_EVENT, this.start);
	    this.el.addEventListener(this.UNSTRETCH_EVENT, this.end);
	  },
	  update: function update(oldDat) {},
	  tick: function tick() {
	    if (!this.stretched) {
	      return;
	    }
	    var scale = new THREE.Vector3().copy(this.el.getAttribute('scale'));
	    var handPos = new THREE.Vector3().copy(this.stretchers[0].getAttribute('position'));
	    var otherHandPos = new THREE.Vector3().copy(this.stretchers[1].getAttribute('position'));
	    var currentStretch = handPos.distanceTo(otherHandPos);
	    var deltaStretch = 1;
	    if (this.previousStretch !== null && currentStretch !== 0) {
	      deltaStretch = Math.pow(currentStretch / this.previousStretch, this.data.invert ? -1 : 1);
	    }
	    this.previousStretch = currentStretch;
	    scale = scale.multiplyScalar(deltaStretch);
	    this.el.setAttribute('scale', scale);
	    // force scale update for physics body
	    if (this.el.body && this.data.usePhysics !== 'never') {
	      var physicsShape = this.el.body.shapes[0];
	      if (physicsShape.halfExtents) {
	        physicsShape.halfExtents.scale(deltaStretch, physicsShape.halfExtents);
	        physicsShape.updateConvexPolyhedronRepresentation();
	      } else {
	        if (!this.shapeWarned) {
	          console.warn('Unable to stretch physics body: unsupported shape');
	          this.shapeWarned = true;
	        }
	        // todo: suport more shapes
	      }
	      this.el.body.updateBoundingRadius();
	    }
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.STRETCH_EVENT, this.start);
	    this.el.removeEventListener(this.UNSTRETCH_EVENT, this.end);
	  },
	  start: function start(evt) {
	    if (this.stretched || this.stretchers.includes(evt.detail.hand)) {
	      return;
	    } // already stretched or already captured this hand
	    this.stretchers.push(evt.detail.hand);
	    if (this.stretchers.length === 2) {
	      this.stretched = true;
	      this.previousStretch = null;
	      this.el.addState(this.STRETCHED_STATE);
	    }
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    } // gesture accepted
	  },
	  end: function end(evt) {
	    var stretcherIndex = this.stretchers.indexOf(evt.detail.hand);
	    if (stretcherIndex === -1) {
	      return;
	    }
	    this.stretchers.splice(stretcherIndex, 1);
	    this.stretched = false;
	    this.el.removeState(this.STRETCHED_STATE);
	  }
	});

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('drag-droppable', {
	  init: function init() {
	    this.HOVERED_STATE = 'dragover';
	    this.DRAGGED_STATE = 'dragged';
	    this.HOVER_EVENT = 'dragover-start';
	    this.UNHOVER_EVENT = 'dragover-end';
	    this.DRAG_EVENT = 'drag-start';
	    this.UNDRAG_EVENT = 'drag-end';
	    this.DRAGDROP_EVENT = 'drag-drop';

	    this.hoverStart = this.hoverStart.bind(this);
	    this.dragStart = this.dragStart.bind(this);
	    this.hoverEnd = this.hoverEnd.bind(this);
	    this.dragEnd = this.dragEnd.bind(this);
	    this.dragDrop = this.dragDrop.bind(this);

	    this.el.addEventListener(this.HOVER_EVENT, this.hoverStart);
	    this.el.addEventListener(this.DRAG_EVENT, this.dragStart);
	    this.el.addEventListener(this.UNHOVER_EVENT, this.hoverEnd);
	    this.el.addEventListener(this.UNDRAG_EVENT, this.dragEnd);
	    this.el.addEventListener(this.DRAGDROP_EVENT, this.dragDrop);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.HOVER_EVENT, this.hoverStart);
	    this.el.removeEventListener(this.DRAG_EVENT, this.dragStart);
	    this.el.removeEventListener(this.UNHOVER_EVENT, this.hoverEnd);
	    this.el.removeEventListener(this.UNDRAG_EVENT, this.dragEnd);
	    this.el.removeEventListener(this.DRAGDROP_EVENT, this.dragDrop);
	  },
	  hoverStart: function hoverStart(evt) {
	    this.el.addState(this.HOVERED_STATE);
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  },
	  dragStart: function dragStart(evt) {
	    this.el.addState(this.DRAGGED_STATE);
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  },
	  hoverEnd: function hoverEnd(evt) {
	    this.el.removeState(this.HOVERED_STATE);
	  },
	  dragEnd: function dragEnd(evt) {
	    this.el.removeState(this.DRAGGED_STATE);
	  },
	  dragDrop: function dragDrop(evt) {
	    if (evt.preventDefault) {
	      evt.preventDefault();
	    }
	  }
	});

/***/ },
/* 6 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('clickable', {
	  schema: {
	    onclick: { type: 'string' }
	  },
	  init: function init() {
	    this.CLICKED_STATE = 'clicked';
	    this.CLICK_EVENT = 'grab-start';
	    this.UNCLICK_EVENT = 'grab-end';
	    this.clickers = [];

	    this.start = this.start.bind(this);
	    this.end = this.end.bind(this);
	    this.el.addEventListener(this.CLICK_EVENT, this.start);
	    this.el.addEventListener(this.UNCLICK_EVENT, this.end);
	  },
	  remove: function remove() {
	    this.el.removeEventListener(this.CLICK_EVENT, this.start);
	    this.el.removeEventListener(this.UNCLICK_EVENT, this.end);
	  },
	  start: function start(evt) {
	    this.el.addState(this.CLICKED_STATE);
	    if (this.clickers.indexOf(evt.detail.hand) === -1) {
	      this.clickers.push(evt.detail.hand);
	      if (evt.preventDefault) {
	        evt.preventDefault();
	      }
	    }
	  },
	  end: function end(evt) {
	    var handIndex = this.clickers.indexOf(evt.detail.hand);
	    if (handIndex !== -1) {
	      this.clickers.splice(handIndex, 1);
	    }
	    if (this.clickers.length < 1) {
	      this.el.removeState(this.CLICKED_STATE);
	    }
	  }
	});

/***/ },
/* 7 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	AFRAME.registerComponent('locomotor-auto-config', {
	  schema: {
	    camera: { default: true },
	    stretch: { default: true },
	    move: { default: true },
	    collider: { default: true }
	  },
	  init: function init() {
	    var _this = this;

	    var ready = true;
	    if (!this.data.stretch) {
	      this.el.removeComponent('stretchable');
	    }
	    if (!this.data.move) {
	      this.el.removeComponent('grabbable');
	    }
	    if (this.data.collider) {
	      // make sure locomotor is collidable
	      this.el.childNodes.forEach(function (el) {
	        var col = el.getAttribute && el.getAttribute('sphere-collider');
	        if (col && col.objects.indexOf('a-locomotor') === -1) {
	          el.setAttribute('sphere-collider', {
	            objects: col.objects === '' ?
	            // empty objects property will collide with everything
	            col.objects
	            // otherwise add self to selector string
	            : col.objects + ', a-locomotor'
	          });
	        }
	      });
	    }
	    if (this.data.camera) {
	      // this step has to be done asnychronously
	      ready = false;
	      this.el.addEventListener('loaded', function (e) {
	        if (!document.querySelector('a-camera, [camera]')) {
	          var cam = document.createElement('a-camera');
	          _this.el.appendChild(cam);
	        }
	        _this.ready();
	      });
	    }
	    if (ready) {
	      this.ready();
	    }
	  },
	  ready: function ready() {
	    this.el.emit('locomotor-ready', {});
	  }
	});

/***/ },
/* 8 */
/***/ function(module, exports) {

	'use strict';

	/* global AFRAME */
	var extendDeep = AFRAME.utils.extendDeep;
	// The mesh mixin provides common material properties for creating mesh-based primitives.
	// This makes the material component a default component and maps all the base material properties.
	var meshMixin = AFRAME.primitives.getMeshMixin();
	AFRAME.registerPrimitive('a-locomotor', extendDeep({}, meshMixin, {
	  // Preset default components. These components and component properties will be attached to the entity out-of-the-box.
	  defaultComponents: {
	    geometry: {
	      primitive: 'sphere',
	      radius: 100
	    },
	    material: {
	      visible: false
	    },
	    grabbable: {
	      usePhysics: 'never',
	      invert: true,
	      suppressY: true
	    },
	    stretchable: {
	      invert: true
	    },
	    'locomotor-auto-config': {}
	  },
	  mappings: {
	    'fetch-camera': 'locomotor-auto-config.camera',
	    'add-to-colliders': 'locomotor-auto-config.collider',
	    'allow-movement': 'locomotor-auto-config.move',
	    'horizontal-only': 'grabbable.suppressY',
	    'allow-scaling': 'locomotor-auto-config.stretch'
	  }
	}));

/***/ }
/******/ ]);