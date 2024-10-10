/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ 7:
/***/ ((module) => {

// #region eventListener
var R = typeof Reflect === 'object' ? Reflect : null
var ReflectApply = R && typeof R.apply === 'function'
  ? R.apply
  : function ReflectApply(target, receiver, args) {
	return Function.prototype.apply.call(target, receiver, args);
  }

var ReflectOwnKeys
if (R && typeof R.ownKeys === 'function') {
  ReflectOwnKeys = R.ownKeys
} else if (Object.getOwnPropertySymbols) {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
	return Object.getOwnPropertyNames(target)
	  .concat(Object.getOwnPropertySymbols(target));
  };
} else {
  ReflectOwnKeys = function ReflectOwnKeys(target) {
	return Object.getOwnPropertyNames(target);
  };
}

function ProcessEmitWarning(warning) {
  if (console && console.warn) console.warn(warning);
}

var NumberIsNaN = Number.isNaN || function NumberIsNaN(value) {
  return value !== value;
}

function EventEmitter() {
  EventEmitter.init.call(this);
}
module.exports = EventEmitter;
module.exports.once = once;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._eventsCount = 0;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
var defaultMaxListeners = 10;

function checkListener(listener) {
  if (typeof listener !== 'function') {
	throw new TypeError('The "listener" argument must be of type Function. Received type ' + typeof listener);
  }
}

Object.defineProperty(EventEmitter, 'defaultMaxListeners', {
  enumerable: true,
  get: function() {
	return defaultMaxListeners;
  },
  set: function(arg) {
	if (typeof arg !== 'number' || arg < 0 || NumberIsNaN(arg)) {
	  throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received ' + arg + '.');
	}
	defaultMaxListeners = arg;
  }
});

EventEmitter.init = function() {

  if (this._events === undefined ||
	  this._events === Object.getPrototypeOf(this)._events) {
	this._events = Object.create(null);
	this._eventsCount = 0;
  }

  this._maxListeners = this._maxListeners || undefined;
};

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
  if (typeof n !== 'number' || n < 0 || NumberIsNaN(n)) {
	throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received ' + n + '.');
  }
  this._maxListeners = n;
  return this;
};

function _getMaxListeners(that) {
  if (that._maxListeners === undefined)
	return EventEmitter.defaultMaxListeners;
  return that._maxListeners;
}

EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
  return _getMaxListeners(this);
};

EventEmitter.prototype.emit = function emit(type) {
  var args = [];
  for (var i = 1; i < arguments.length; i++) args.push(arguments[i]);
  var doError = (type === 'error');

  var events = this._events;
  if (events !== undefined)
	doError = (doError && events.error === undefined);
  else if (!doError)
	return false;

  // If there is no 'error' event listener then throw.
  if (doError) {
	var er;
	if (args.length > 0)
	  er = args[0];
	if (er instanceof Error) {
	  // Note: The comments on the `throw` lines are intentional, they show
	  // up in Node's output if this results in an unhandled exception.
	  throw er; // Unhandled 'error' event
	}
	// At least give some kind of context to the user
	var err = new Error('Unhandled error.' + (er ? ' (' + er.message + ')' : ''));
	err.context = er;
	throw err; // Unhandled 'error' event
  }

  var handler = events[type];

  if (handler === undefined)
	return false;

  if (typeof handler === 'function') {
	ReflectApply(handler, this, args);
  } else {
	var len = handler.length;
	var listeners = arrayClone(handler, len);
	for (var i = 0; i < len; ++i)
	  ReflectApply(listeners[i], this, args);
  }

  return true;
};

function _addListener(target, type, listener, prepend) {
  var m;
  var events;
  var existing;

  checkListener(listener);

  events = target._events;
  if (events === undefined) {
	events = target._events = Object.create(null);
	target._eventsCount = 0;
  } else {
	// To avoid recursion in the case that type === "newListener"! Before
	// adding it to the listeners, first emit "newListener".
	if (events.newListener !== undefined) {
	  target.emit('newListener', type,
				  listener.listener ? listener.listener : listener);

	  // Re-assign `events` because a newListener handler could have caused the
	  // this._events to be assigned to a new object
	  events = target._events;
	}
	existing = events[type];
  }

  if (existing === undefined) {
	// Optimize the case of one listener. Don't need the extra array object.
	existing = events[type] = listener;
	++target._eventsCount;
  } else {
	if (typeof existing === 'function') {
	  // Adding the second element, need to change to array.
	  existing = events[type] =
		prepend ? [listener, existing] : [existing, listener];
	  // If we've already got an array, just append.
	} else if (prepend) {
	  existing.unshift(listener);
	} else {
	  existing.push(listener);
	}

	// Check for listener leak
	m = _getMaxListeners(target);
	if (m > 0 && existing.length > m && !existing.warned) {
	  existing.warned = true;
	  // No error code for this since it is a Warning
	  // eslint-disable-next-line no-restricted-syntax
	  var w = new Error('Possible EventEmitter memory leak detected. ' +
						  existing.length + ' ' + String(type) + ' listeners ' +
						  'added. Use emitter.setMaxListeners() to ' +
						  'increase limit');
	  w.name = 'MaxListenersExceededWarning';
	  w.emitter = target;
	  w.type = type;
	  w.count = existing.length;
	  ProcessEmitWarning(w);
	}
  }

  return target;
}

EventEmitter.prototype.addListener = function addListener(type, listener) {
  return _addListener(this, type, listener, false);
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.prependListener =
	function prependListener(type, listener) {
	  return _addListener(this, type, listener, true);
	};

function onceWrapper() {
  if (!this.fired) {
	this.target.removeListener(this.type, this.wrapFn);
	this.fired = true;
	if (arguments.length === 0)
	  return this.listener.call(this.target);
	return this.listener.apply(this.target, arguments);
  }
}

function _onceWrap(target, type, listener) {
  var state = { fired: false, wrapFn: undefined, target: target, type: type, listener: listener };
  var wrapped = onceWrapper.bind(state);
  wrapped.listener = listener;
  state.wrapFn = wrapped;
  return wrapped;
}

EventEmitter.prototype.once = function once(type, listener) {
  checkListener(listener);
  this.on(type, _onceWrap(this, type, listener));
  return this;
};

EventEmitter.prototype.prependOnceListener =
	function prependOnceListener(type, listener) {
	  checkListener(listener);
	  this.prependListener(type, _onceWrap(this, type, listener));
	  return this;
	};

// Emits a 'removeListener' event if and only if the listener was removed.
EventEmitter.prototype.removeListener =
	function removeListener(type, listener) {
	  var list, events, position, i, originalListener;

	  checkListener(listener);

	  events = this._events;
	  if (events === undefined)
		return this;

	  list = events[type];
	  if (list === undefined)
		return this;

	  if (list === listener || list.listener === listener) {
		if (--this._eventsCount === 0)
		  this._events = Object.create(null);
		else {
		  delete events[type];
		  if (events.removeListener)
			this.emit('removeListener', type, list.listener || listener);
		}
	  } else if (typeof list !== 'function') {
		position = -1;

		for (i = list.length - 1; i >= 0; i--) {
		  if (list[i] === listener || list[i].listener === listener) {
			originalListener = list[i].listener;
			position = i;
			break;
		  }
		}

		if (position < 0)
		  return this;

		if (position === 0)
		  list.shift();
		else {
		  spliceOne(list, position);
		}

		if (list.length === 1)
		  events[type] = list[0];

		if (events.removeListener !== undefined)
		  this.emit('removeListener', type, originalListener || listener);
	  }

	  return this;
	};

EventEmitter.prototype.off = EventEmitter.prototype.removeListener;

EventEmitter.prototype.removeAllListeners =
	function removeAllListeners(type) {
	  var listeners, events, i;

	  events = this._events;
	  if (events === undefined)
		return this;

	  // not listening for removeListener, no need to emit
	  if (events.removeListener === undefined) {
		if (arguments.length === 0) {
		  this._events = Object.create(null);
		  this._eventsCount = 0;
		} else if (events[type] !== undefined) {
		  if (--this._eventsCount === 0)
			this._events = Object.create(null);
		  else
			delete events[type];
		}
		return this;
	  }

	  // emit removeListener for all listeners on all events
	  if (arguments.length === 0) {
		var keys = Object.keys(events);
		var key;
		for (i = 0; i < keys.length; ++i) {
		  key = keys[i];
		  if (key === 'removeListener') continue;
		  this.removeAllListeners(key);
		}
		this.removeAllListeners('removeListener');
		this._events = Object.create(null);
		this._eventsCount = 0;
		return this;
	  }

	  listeners = events[type];

	  if (typeof listeners === 'function') {
		this.removeListener(type, listeners);
	  } else if (listeners !== undefined) {
		// LIFO order
		for (i = listeners.length - 1; i >= 0; i--) {
		  this.removeListener(type, listeners[i]);
		}
	  }

	  return this;
	};

function _listeners(target, type, unwrap) {
  var events = target._events;

  if (events === undefined)
	return [];

  var evlistener = events[type];
  if (evlistener === undefined)
	return [];

  if (typeof evlistener === 'function')
	return unwrap ? [evlistener.listener || evlistener] : [evlistener];

  return unwrap ?
	unwrapListeners(evlistener) : arrayClone(evlistener, evlistener.length);
}

EventEmitter.prototype.listeners = function listeners(type) {
  return _listeners(this, type, true);
};

EventEmitter.prototype.rawListeners = function rawListeners(type) {
  return _listeners(this, type, false);
};

EventEmitter.listenerCount = function(emitter, type) {
  if (typeof emitter.listenerCount === 'function') {
	return emitter.listenerCount(type);
  } else {
	return listenerCount.call(emitter, type);
  }
};

EventEmitter.prototype.listenerCount = listenerCount;
function listenerCount(type) {
  var events = this._events;

  if (events !== undefined) {
	var evlistener = events[type];

	if (typeof evlistener === 'function') {
	  return 1;
	} else if (evlistener !== undefined) {
	  return evlistener.length;
	}
  }

  return 0;
}

EventEmitter.prototype.eventNames = function eventNames() {
  return this._eventsCount > 0 ? ReflectOwnKeys(this._events) : [];
};

function arrayClone(arr, n) {
  var copy = new Array(n);
  for (var i = 0; i < n; ++i)
	copy[i] = arr[i];
  return copy;
}

function spliceOne(list, index) {
  for (; index + 1 < list.length; index++)
	list[index] = list[index + 1];
  list.pop();
}

function unwrapListeners(arr) {
  var ret = new Array(arr.length);
  for (var i = 0; i < ret.length; ++i) {
	ret[i] = arr[i].listener || arr[i];
  }
  return ret;
}

function once(emitter, name) {
  return new Promise(function (resolve, reject) {
	function errorListener(err) {
	  emitter.removeListener(name, resolver);
	  reject(err);
	}

	function resolver() {
	  if (typeof emitter.removeListener === 'function') {
		emitter.removeListener('error', errorListener);
	  }
	  resolve([].slice.call(arguments));
	};

	eventTargetAgnosticAddListener(emitter, name, resolver, { once: true });
	if (name !== 'error') {
	  addErrorHandlerIfEventEmitter(emitter, errorListener, { once: true });
	}
  });
}

function addErrorHandlerIfEventEmitter(emitter, handler, flags) {
  if (typeof emitter.on === 'function') {
	eventTargetAgnosticAddListener(emitter, 'error', handler, flags);
  }
}

function eventTargetAgnosticAddListener(emitter, name, listener, flags) {
  if (typeof emitter.on === 'function') {
	if (flags.once) {
	  emitter.once(name, listener);
	} else {
	  emitter.on(name, listener);
	}
  } else if (typeof emitter.addEventListener === 'function') {
	// EventTarget does not have `error` event semantics like Node
	// EventEmitters, we do not listen for `error` events here.
	emitter.addEventListener(name, function wrapListener(arg) {
	  // IE does not have builtin `{ once: true }` support so we
	  // have to do it manually.
	  if (flags.once) {
		emitter.removeEventListener(name, wrapListener);
	  }
	  listener(arg);
	});
  } else {
	throw new TypeError('The "emitter" argument must be of type EventEmitter. Received type ' + typeof emitter);
  }
}

// #endregion

/***/ }),

/***/ 58:
/***/ ((module, __unused_webpack_exports, __webpack_require__) => {

module.exports = __webpack_require__.p + "3fe9f0f9e254e41ba4b4.wasm";

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = __webpack_modules__;
/******/
/************************************************************************/
/******/ 	/* webpack/runtime/global */
/******/ 	(() => {
/******/ 		__webpack_require__.g = (function() {
/******/ 			if (typeof globalThis === 'object') return globalThis;
/******/ 			try {
/******/ 				return this || new Function('return this')();
/******/ 			} catch (e) {
/******/ 				if (typeof window === 'object') return window;
/******/ 			}
/******/ 		})();
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/publicPath */
/******/ 	(() => {
/******/ 		var scriptUrl;
/******/ 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
/******/ 		var document = __webpack_require__.g.document;
/******/ 		if (!scriptUrl && document) {
/******/ 			if (document.currentScript && document.currentScript.tagName.toUpperCase() === 'SCRIPT')
/******/ 				scriptUrl = document.currentScript.src;
/******/ 			if (!scriptUrl) {
/******/ 				var scripts = document.getElementsByTagName("script");
/******/ 				if(scripts.length) {
/******/ 					var i = scripts.length - 1;
/******/ 					while (i > -1 && (!scriptUrl || !/^http(s?):/.test(scriptUrl))) scriptUrl = scripts[i--].src;
/******/ 				}
/******/ 			}
/******/ 		}
/******/ 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
/******/ 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
/******/ 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
/******/ 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
/******/ 		__webpack_require__.p = scriptUrl;
/******/ 	})();
/******/
/******/ 	/* webpack/runtime/jsonp chunk loading */
/******/ 	(() => {
/******/ 		__webpack_require__.b = document.baseURI || self.location.href;
/******/
/******/ 		// object to store loaded and loading chunks
/******/ 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
/******/ 		// [resolve, reject, Promise] = chunk loading, 0 = chunk loaded
/******/ 		var installedChunks = {
/******/ 			792: 0
/******/ 		};
/******/
/******/ 		// no chunk on demand loading
/******/
/******/ 		// no prefetching
/******/
/******/ 		// no preloaded
/******/
/******/ 		// no HMR
/******/
/******/ 		// no HMR manifest
/******/
/******/ 		// no on chunks loaded
/******/
/******/ 		// no jsonp function
/******/ 	})();
/******/
/************************************************************************/

// EXTERNAL MODULE: ./node_modules/events/events.js
var events = __webpack_require__(7);
;// CONCATENATED MODULE: ./src/control.js

class Control extends events.EventEmitter {
	constructor() {
		super();
		this.state = null;
		this.player_index = null;
		this._assets_url = null;

		this.addListener("state", (data) => {
			this.state = data;
		});
		// When we receive log slices, when executing a move
		this.addListener("gamelog", (logData) => {
			// Ignore the log data and tell the backend we want the new state
			this.emit("fetchState");
		});
		this.addListener("state:updated", () => {
			this.emit("fetchState");
		});
		this.addListener("player", (player) => {
			this.player_index = player.index;
		});
	}

	receive_state() {
		const state = this.state;
		this.state = null;
		return state;
	}

	receive_player_index() {
		const index = this.player_index;
		this.player_index = null;
		return index;
	}

	send_move(move) {
		this.emit("move", move);
	}

	send_ready() {
		console.log("Sending ready");
		this.emit("ready");
	}

	get assets_url() {
		return this._assets_url;
	}

	set assets_url(value) {
		this._assets_url = value;
	}
}

function get_control() {
	return window.clash_control;
}


;// CONCATENATED MODULE: ../dist/snippets/client-cda1b8d006d10648/js/src/control.js


function control_get_control() {
	return window.clash_control;
}


;// CONCATENATED MODULE: ../dist/remote_client.js


let wasm; const set_wasm = (w) => wasm = w;

const heap = new Array(128).fill(undefined);

heap.push(undefined, null, true, false);

function getObject(idx) { return heap[idx]; }

function isLikeNone(x) {
	return x === undefined || x === null;
}

function _assertNum(n) {
	if (typeof(n) !== 'number') throw new Error(`expected a number argument, found ${typeof(n)}`);
}

let cachedDataViewMemory0 = null;

function getDataViewMemory0() {
	if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
		cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
	}
	return cachedDataViewMemory0;
}

function _assertBoolean(n) {
	if (typeof(n) !== 'boolean') {
		throw new Error(`expected a boolean argument, found ${typeof(n)}`);
	}
}

const cachedTextDecoder = (typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }) : { decode: () => { throw Error('TextDecoder not available') } } );

if (typeof TextDecoder !== 'undefined') { cachedTextDecoder.decode(); };

let cachedUint8ArrayMemory0 = null;

function getUint8ArrayMemory0() {
	if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
		cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
	}
	return cachedUint8ArrayMemory0;
}

function getStringFromWasm0(ptr, len) {
	ptr = ptr >>> 0;
	return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

let heap_next = heap.length;

function addHeapObject(obj) {
	if (heap_next === heap.length) heap.push(heap.length + 1);
	const idx = heap_next;
	heap_next = heap[idx];

	if (typeof(heap_next) !== 'number') throw new Error('corrupt heap');

	heap[idx] = obj;
	return idx;
}

let WASM_VECTOR_LEN = 0;

const cachedTextEncoder = (typeof TextEncoder !== 'undefined' ? new TextEncoder('utf-8') : { encode: () => { throw Error('TextEncoder not available') } } );

const encodeString = (typeof cachedTextEncoder.encodeInto === 'function'
	? function (arg, view) {
	return cachedTextEncoder.encodeInto(arg, view);
}
	: function (arg, view) {
	const buf = cachedTextEncoder.encode(arg);
	view.set(buf);
	return {
		read: arg.length,
		written: buf.length
	};
});

function passStringToWasm0(arg, malloc, realloc) {

	if (typeof(arg) !== 'string') throw new Error(`expected a string argument, found ${typeof(arg)}`);

	if (realloc === undefined) {
		const buf = cachedTextEncoder.encode(arg);
		const ptr = malloc(buf.length, 1) >>> 0;
		getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
		WASM_VECTOR_LEN = buf.length;
		return ptr;
	}

	let len = arg.length;
	let ptr = malloc(len, 1) >>> 0;

	const mem = getUint8ArrayMemory0();

	let offset = 0;

	for (; offset < len; offset++) {
		const code = arg.charCodeAt(offset);
		if (code > 0x7F) break;
		mem[ptr + offset] = code;
	}

	if (offset !== len) {
		if (offset !== 0) {
			arg = arg.slice(offset);
		}
		ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
		const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
		const ret = encodeString(arg, view);
		if (ret.read !== arg.length) throw new Error('failed to pass whole string');
		offset += ret.written;
		ptr = realloc(ptr, len, offset, 1) >>> 0;
	}

	WASM_VECTOR_LEN = offset;
	return ptr;
}

function dropObject(idx) {
	if (idx < 132) return;
	heap[idx] = heap_next;
	heap_next = idx;
}

function takeObject(idx) {
	const ret = getObject(idx);
	dropObject(idx);
	return ret;
}

function debugString(val) {
	// primitive types
	const type = typeof val;
	if (type == 'number' || type == 'boolean' || val == null) {
		return  `${val}`;
	}
	if (type == 'string') {
		return `"${val}"`;
	}
	if (type == 'symbol') {
		const description = val.description;
		if (description == null) {
			return 'Symbol';
		} else {
			return `Symbol(${description})`;
		}
	}
	if (type == 'function') {
		const name = val.name;
		if (typeof name == 'string' && name.length > 0) {
			return `Function(${name})`;
		} else {
			return 'Function';
		}
	}
	// objects
	if (Array.isArray(val)) {
		const length = val.length;
		let debug = '[';
		if (length > 0) {
			debug += debugString(val[0]);
		}
		for(let i = 1; i < length; i++) {
			debug += ', ' + debugString(val[i]);
		}
		debug += ']';
		return debug;
	}
	// Test for built-in
	const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
	let className;
	if (builtInMatches.length > 1) {
		className = builtInMatches[1];
	} else {
		// Failed to match the standard '[object ClassName]'
		return toString.call(val);
	}
	if (className == 'Object') {
		// we're a user defined class or Object
		// JSON.stringify avoids problems with cycles, and is generally much
		// easier than looping through ownProperties of `val`.
		try {
			return 'Object(' + JSON.stringify(val) + ')';
		} catch (_) {
			return 'Object';
		}
	}
	// errors
	if (val instanceof Error) {
		return `${val.name}: ${val.message}\n${val.stack}`;
	}
	// TODO we could test for more things here, like `Set`s and `Map`s.
	return className;
}

function _assertBigInt(n) {
	if (typeof(n) !== 'bigint') throw new Error(`expected a bigint argument, found ${typeof(n)}`);
}

const CLOSURE_DTORS = (typeof FinalizationRegistry === 'undefined')
	? { register: () => {}, unregister: () => {} }
	: new FinalizationRegistry(state => {
	wasm.__wbindgen_export_2.get(state.dtor)(state.a, state.b)
});

function makeMutClosure(arg0, arg1, dtor, f) {
	const state = { a: arg0, b: arg1, cnt: 1, dtor };
	const real = (...args) => {
		// First up with a closure we increment the internal reference
		// count. This ensures that the Rust closure environment won't
		// be deallocated while we're invoking it.
		state.cnt++;
		const a = state.a;
		state.a = 0;
		try {
			return f(a, state.b, ...args);
		} finally {
			if (--state.cnt === 0) {
				wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
				CLOSURE_DTORS.unregister(state);
			} else {
				state.a = a;
			}
		}
	};
	real.original = state;
	CLOSURE_DTORS.register(real, state, state);
	return real;
}

function logError(f, args) {
	try {
		return f.apply(this, args);
	} catch (e) {
		let error = (function () {
			try {
				return e instanceof Error ? `${e.message}\n\nStack:\n${e.stack}` : e.toString();
			} catch(_) {
				return "<failed to stringify thrown value>";
			}
		}());
		console.error("wasm-bindgen: imported JS function that was not marked as `catch` threw an error:", error);
		throw e;
	}
}
function __wbg_adapter_48(arg0, arg1, arg2) {
	_assertNum(arg0);
	_assertNum(arg1);
	wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h3fa2d535db38cca6(arg0, arg1, addHeapObject(arg2));
}

/**
* @param {any} players
* @param {any} _expansions
* @param {any} _options
* @param {any} seed
* @param {any} _creator
* @returns {Promise<any>}
*/
function init(players, _expansions, _options, seed, _creator) {
	const ret = wasm.init(addHeapObject(players), addHeapObject(_expansions), addHeapObject(_options), addHeapObject(seed), addHeapObject(_creator));
	return takeObject(ret);
}

/**
* @param {any} game
* @param {any} move_data
* @param {any} player
* @returns {any}
*/
function move(game, move_data, player) {
	const ret = wasm.move(addHeapObject(game), addHeapObject(move_data), addHeapObject(player));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function ended(game) {
	const ret = wasm.ended(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function scores(game) {
	const ret = wasm.scores(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @param {any} player
* @returns {Promise<any>}
*/
function dropPlayer(game, player) {
	const ret = wasm.dropPlayer(addHeapObject(game), addHeapObject(player));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function currentPlayer(game) {
	const ret = wasm.currentPlayer(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function logLength(game) {
	const ret = wasm.logLength(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @param {any} options
* @returns {any}
*/
function logSlice(game, options) {
	const ret = wasm.logSlice(addHeapObject(game), addHeapObject(options));
	return takeObject(ret);
}

/**
* @param {any} game
* @param {any} player_index
* @param {any} meta_data
* @returns {any}
*/
function setPlayerMetaData(game, player_index, meta_data) {
	const ret = wasm.setPlayerMetaData(addHeapObject(game), addHeapObject(player_index), addHeapObject(meta_data));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function rankings(game) {
	const ret = wasm.rankings(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function roundNumber(game) {
	const ret = wasm.roundNumber(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function factions(game) {
	const ret = wasm.factions(addHeapObject(game));
	return takeObject(ret);
}

/**
* @param {any} game
* @param {any} player
* @returns {any}
*/
function stripSecret(game, player) {
	const ret = wasm.stripSecret(addHeapObject(game), addHeapObject(player));
	return takeObject(ret);
}

/**
* @param {any} game
* @returns {any}
*/
function messages(game) {
	const ret = wasm.messages(addHeapObject(game));
	return takeObject(ret);
}

function handleError(f, args) {
	try {
		return f.apply(this, args);
	} catch (e) {
		wasm.__wbindgen_exn_store(addHeapObject(e));
	}
}
function __wbg_adapter_121(arg0, arg1, arg2, arg3) {
	_assertNum(arg0);
	_assertNum(arg1);
	wasm.wasm_bindgen__convert__closures__invoke2_mut__h57a40dbe11a3c21c(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}


function __wbg_get_imports() {
	const imports = {};
	imports.wbg = {};
	imports.wbg.__wbg_log_4bdf1576e3317256 = function() { return logError(function (arg0, arg1) {
		console.log("__wbg_log_4bdf1576e3317256", arg1)
		console.log(getStringFromWasm0(arg0, arg1));
	}, arguments) };
	imports.wbg.__wbg_getcontrol_3264bfc667ef7fdf = function() { return logError(function () {
		console.log("__wbg_getcontrol_3264bfc667ef7fdf")
		const ret = control_get_control();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_receivestate_f4445fef81eefecf = function() { return logError(function (arg0) {
		console.log("__wbg_receivestate_f4445fef81eefecf")
		const ret = getObject(arg0).receive_state();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_receiveplayerindex_ab65cd651c6192b6 = function() { return logError(function (arg0) {
		console.log("__wbg_receiveplayerindex_ab65cd651c6192b6")
		const ret = getObject(arg0).receive_player_index();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_sendmove_fed46023fcc631cd = function() { return logError(function (arg0, arg1) {
		console.log("__wbg_sendmove_fed46023fcc631cd", arg1)
		getObject(arg0).send_move(takeObject(arg1));
	}, arguments) };
	imports.wbg.__wbg_sendready_b0dce48818afc6a8 = function() { return logError(function (arg0) {
		console.log("__wbg_sendready_b0dce48818afc6a8")
		getObject(arg0).send_ready();
	}, arguments) };
	imports.wbg.__wbg_assetsurl_f9692a68a8f05e40 = function() { return logError(function (arg0, arg1) {
		console.log("__wbg_assetsurl_f9692a68a8f05e40", arg1)
		const ret = getObject(arg1).assets_url;
		const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len1 = WASM_VECTOR_LEN;
		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	}, arguments) };
	imports.wbg.__wbindgen_number_get = function(arg0, arg1) {
		const obj = getObject(arg1);
		const ret = typeof(obj) === 'number' ? obj : undefined;
		if (!isLikeNone(ret)) {
			_assertNum(ret);
		}
		getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
		getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
	};
	imports.wbg.__wbindgen_is_object = function(arg0) {
		const val = getObject(arg0);
		const ret = typeof(val) === 'object' && val !== null;
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_error_new = function(arg0, arg1) {
		const ret = new Error(getStringFromWasm0(arg0, arg1));
		return addHeapObject(ret);
	};
	imports.wbg.__wbindgen_is_undefined = function(arg0) {
		const ret = getObject(arg0) === undefined;
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_as_number = function(arg0) {
		const ret = +getObject(arg0);
		return ret;
	};
	imports.wbg.__wbindgen_in = function(arg0, arg1) {
		const ret = getObject(arg0) in getObject(arg1);
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_boolean_get = function(arg0) {
		const v = getObject(arg0);
		const ret = typeof(v) === 'boolean' ? (v ? 1 : 0) : 2;
		_assertNum(ret);
		return ret;
	};
	imports.wbg.__wbindgen_number_new = function(arg0) {
		const ret = arg0;
		return addHeapObject(ret);
	};
	imports.wbg.__wbindgen_string_get = function(arg0, arg1) {
		const obj = getObject(arg1);
		const ret = typeof(obj) === 'string' ? obj : undefined;
		var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		var len1 = WASM_VECTOR_LEN;
		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	};
	imports.wbg.__wbindgen_is_bigint = function(arg0) {
		const ret = typeof(getObject(arg0)) === 'bigint';
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_is_string = function(arg0) {
		const ret = typeof(getObject(arg0)) === 'string';
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_object_clone_ref = function(arg0) {
		const ret = getObject(arg0);
		return addHeapObject(ret);
	};
	imports.wbg.__wbindgen_jsval_eq = function(arg0, arg1) {
		const ret = getObject(arg0) === getObject(arg1);
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_bigint_from_u64 = function(arg0) {
		const ret = BigInt.asUintN(64, arg0);
		return addHeapObject(ret);
	};
	imports.wbg.__wbindgen_is_function = function(arg0) {
		const ret = typeof(getObject(arg0)) === 'function';
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbindgen_cb_drop = function(arg0) {
		const obj = takeObject(arg0).original;
		if (obj.cnt-- == 1) {
			obj.a = 0;
			return true;
		}
		const ret = false;
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbg_queueMicrotask_12a30234db4045d3 = function() { return logError(function (arg0) {
		queueMicrotask(getObject(arg0));
	}, arguments) };
	imports.wbg.__wbg_queueMicrotask_48421b3cc9052b68 = function() { return logError(function (arg0) {
		const ret = getObject(arg0).queueMicrotask;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbindgen_string_new = function(arg0, arg1) {
		const ret = getStringFromWasm0(arg0, arg1);
		return addHeapObject(ret);
	};
	imports.wbg.__wbindgen_jsval_loose_eq = function(arg0, arg1) {
		const ret = getObject(arg0) == getObject(arg1);
		_assertBoolean(ret);
		return ret;
	};
	imports.wbg.__wbg_getwithrefkey_edc2c8960f0f1191 = function() { return logError(function (arg0, arg1) {
		const ret = getObject(arg0)[getObject(arg1)];
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_set_f975102236d3c502 = function() { return logError(function (arg0, arg1, arg2) {
		getObject(arg0)[takeObject(arg1)] = takeObject(arg2);
	}, arguments) };
	imports.wbg.__wbg_new_a220cf903aa02ca2 = function() { return logError(function () {
		const ret = new Array();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_get_3baa728f9d58d3f6 = function() { return logError(function (arg0, arg1) {
		const ret = getObject(arg0)[arg1 >>> 0];
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_set_673dda6c73d19609 = function() { return logError(function (arg0, arg1, arg2) {
		getObject(arg0)[arg1 >>> 0] = takeObject(arg2);
	}, arguments) };
	imports.wbg.__wbg_isArray_8364a5371e9737d8 = function() { return logError(function (arg0) {
		const ret = Array.isArray(getObject(arg0));
		_assertBoolean(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_length_ae22078168b726f5 = function() { return logError(function (arg0) {
		const ret = getObject(arg0).length;
		_assertNum(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_instanceof_ArrayBuffer_61dfc3198373c902 = function() { return logError(function (arg0) {
		let result;
		try {
			result = getObject(arg0) instanceof ArrayBuffer;
		} catch (_) {
			result = false;
		}
		const ret = result;
		_assertBoolean(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_newnoargs_76313bd6ff35d0f2 = function() { return logError(function (arg0, arg1) {
		const ret = new Function(getStringFromWasm0(arg0, arg1));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_call_1084a111329e68ce = function() { return handleError(function (arg0, arg1) {
		const ret = getObject(arg0).call(getObject(arg1));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_call_89af060b4e1523f2 = function() { return handleError(function (arg0, arg1, arg2) {
		const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_next_f9cb570345655b9a = function() { return handleError(function (arg0) {
		const ret = getObject(arg0).next();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_next_de3e9db4440638b2 = function() { return logError(function (arg0) {
		const ret = getObject(arg0).next;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_done_bfda7aa8f252b39f = function() { return logError(function (arg0) {
		const ret = getObject(arg0).done;
		_assertBoolean(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_value_6d39332ab4788d86 = function() { return logError(function (arg0) {
		const ret = getObject(arg0).value;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_isSafeInteger_7f1ed56200d90674 = function() { return logError(function (arg0) {
		const ret = Number.isSafeInteger(getObject(arg0));
		_assertBoolean(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_entries_7a0e06255456ebcd = function() { return logError(function (arg0) {
		const ret = Object.entries(getObject(arg0));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_new_525245e2b9901204 = function() { return logError(function () {
		const ret = new Object();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_iterator_888179a48810a9fe = function() { return logError(function () {
		const ret = Symbol.iterator;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_new_b85e72ed1bfd57f9 = function() { return logError(function (arg0, arg1) {
		try {
			var state0 = {a: arg0, b: arg1};
			var cb0 = (arg0, arg1) => {
				const a = state0.a;
				state0.a = 0;
				try {
					return __wbg_adapter_121(a, state0.b, arg0, arg1);
				} finally {
					state0.a = a;
				}
			};
			const ret = new Promise(cb0);
			return addHeapObject(ret);
		} finally {
			state0.a = state0.b = 0;
		}
	}, arguments) };
	imports.wbg.__wbg_resolve_570458cb99d56a43 = function() { return logError(function (arg0) {
		const ret = Promise.resolve(getObject(arg0));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_then_95e6edc0f89b73b1 = function() { return logError(function (arg0, arg1) {
		const ret = getObject(arg0).then(getObject(arg1));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_globalThis_86b222e13bdf32ed = function() { return handleError(function () {
		const ret = globalThis.globalThis;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_self_3093d5d1f7bcb682 = function() { return handleError(function () {
		const ret = self.self;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_window_3bcfc4d31bc012f8 = function() { return handleError(function () {
		const ret = window.window;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_global_e5a3fe56f8be9485 = function() { return handleError(function () {
		const ret = __webpack_require__.g.global;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_instanceof_Uint8Array_247a91427532499e = function() { return logError(function (arg0) {
		let result;
		try {
			result = getObject(arg0) instanceof Uint8Array;
		} catch (_) {
			result = false;
		}
		const ret = result;
		_assertBoolean(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_new_ea1883e1e5e86686 = function() { return logError(function (arg0) {
		const ret = new Uint8Array(getObject(arg0));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_length_8339fcf5d8ecd12e = function() { return logError(function (arg0) {
		const ret = getObject(arg0).length;
		_assertNum(ret);
		return ret;
	}, arguments) };
	imports.wbg.__wbg_set_d1e79e2388520f18 = function() { return logError(function (arg0, arg1, arg2) {
		getObject(arg0).set(getObject(arg1), arg2 >>> 0);
	}, arguments) };
	imports.wbg.__wbg_buffer_b7b08af79b0b0974 = function() { return logError(function (arg0) {
		const ret = getObject(arg0).buffer;
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_get_224d16597dbbfd96 = function() { return handleError(function (arg0, arg1) {
		const ret = Reflect.get(getObject(arg0), getObject(arg1));
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_error_f851667af71bcfc6 = function() { return logError(function (arg0, arg1) {
		let deferred0_0;
		let deferred0_1;
		try {
			deferred0_0 = arg0;
			deferred0_1 = arg1;
			console.error(getStringFromWasm0(arg0, arg1));
		} finally {
			wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
		}
	}, arguments) };
	imports.wbg.__wbg_new_abda76e883ba8a5f = function() { return logError(function () {
		const ret = new Error();
		return addHeapObject(ret);
	}, arguments) };
	imports.wbg.__wbg_stack_658279fe44541cf6 = function() { return logError(function (arg0, arg1) {
		const ret = getObject(arg1).stack;
		const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len1 = WASM_VECTOR_LEN;
		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	}, arguments) };
	imports.wbg.__wbindgen_debug_string = function(arg0, arg1) {
		const ret = debugString(getObject(arg1));
		const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
		const len1 = WASM_VECTOR_LEN;
		getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
		getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
	};
	imports.wbg.__wbindgen_bigint_get_as_i64 = function(arg0, arg1) {
		const v = getObject(arg1);
		const ret = typeof(v) === 'bigint' ? v : undefined;
		if (!isLikeNone(ret)) {
			_assertBigInt(ret);
		}
		getDataViewMemory0().setBigInt64(arg0 + 8 * 1, isLikeNone(ret) ? BigInt(0) : ret, true);
		getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
	};
	imports.wbg.__wbindgen_object_drop_ref = function(arg0) {
		takeObject(arg0);
	};
	imports.wbg.__wbindgen_throw = function(arg0, arg1) {
		throw new Error(getStringFromWasm0(arg0, arg1));
	};
	imports.wbg.__wbindgen_memory = function() {
		const ret = wasm.memory;
		return addHeapObject(ret);
	};
	imports.wbg.__wbindgen_closure_wrapper14642 = function() { return logError(function (arg0, arg1, arg2) {
		console.log("__wbindgen_closure_wrapper14642", arg1, arg2)
		const ret = makeMutClosure(arg0, arg1, 692, __wbg_adapter_48);
		return addHeapObject(ret);
	}, arguments) };
	return imports.wbg;
}

async function __wbg_init(module_or_path) {
	console.log("__wbg_init called", module_or_path);
	if (wasm !== undefined) return wasm;

	if (typeof module_or_path !== 'undefined' && Object.getPrototypeOf(module_or_path) === Object.prototype)
	({module_or_path} = module_or_path)
	else
	console.warn('using deprecated parameters for the initialization function; pass a single object instead')

	if (typeof module_or_path === 'undefined') {
		module_or_path = new URL(/* asset import */ __webpack_require__(58), __webpack_require__.b);
	}
	return __wbg_get_imports();
}

/* harmony default export */ const remote_client = (__wbg_init);

;// CONCATENATED MODULE: ./src/run.js

function dynamicallyLoadScript(url, onload) {
	const script = document.createElement("script");
	script.onload = onload;
	script.src = url;

	document.head.appendChild(script);
}

async function run({selector, control}) {
	const root = document.querySelector(selector);
	const canvas = document.createElement("canvas");
	canvas.setAttribute("id", "glcanvas");
	canvas.setAttribute("style", `
				margin: 0px;
				padding: 0px;
				width: 100%;
				height: 100%;
				overflow: hidden;
				position: absolute;
				z-index: 0;
	`);
	root.appendChild(canvas);

	dynamicallyLoadScript("/mq-bundle.js", async () => {
		let wbg = await remote_client();
		miniquad_add_plugin({
			register_plugin: (a) => {
				console.log("register_plugin", a);
				return (a.wbg = wbg)
			},
			on_init: () => {
				console.log("on_init 2", wasm_exports);
				window.clash_control.send_ready()
				return set_wasm(wasm_exports)
			},
			version: "0.0.1",
			name: "wbg",
		});
		const src = document.head.getElementsByTagName("script")[0].src;
		control.assets_url = src.replace("client.js", "assets/");
		const url = src.replace("client.js", "client.wasm");
		console.log("Loading wasm from", url);
		await load(url);
        console.log("loaded wasm");
	});
}

;// CONCATENATED MODULE: ./src/index.js


window.clash = {
	launch(selector) {
        console.log("launch called");
		const control = new Control();
        console.log("control created");
		window.clash_control = control;

		run({selector, control});

        console.log("run called");

		return control;
	},
};


/******/ })()
;
