define([
	'/lib/js/lock/lock.js',
	'jquery',
	'util',
], function (Lock, $, Util) {
	"use strict";

	function stripHash(text) {
		return /^(?:#)?(.*)$/.exec(text)[1];
	};

	function getById(id) {
		return document.getElementById(stripHash(id));
	};

	let alreadyRan = false;
	let instRef = [];

	function runOnce() {
		if (!alreadyRan) {
			console.log('RunOnce');
			alreadyRan = true;

			window.addEventListener('hashchange', () => {
				console.log('Hash Change');
				//let inst = instRef[window.location.hash];
				//if (typeof (inst) == 'undefined') {
				//	// hash is not part of a tabs object
				//	return;
				//}

				//let hashTab = Array.prototype.filter.call(inst.getTabs(), (tab) => {
				//	return tab.getAttribute('href') == window.location.hash;
				//})[0];

				//if (typeof (hashTab) == 'undefined') {
				//	hashTab = inst.getTabs()[Util.clamp(inst.getConfig().defaultIndex, 0, inst.getTabs().length - 1)];
				//}

				//// no scrolling or focus
				//// from scripts should be triggered
				//// by a back/forward browser button
				//inst.switchTab(hashTab, {
				//	hashChange: false,
				//	scrollTo: false,
				//	focus: false
				//});

				if (/^\s*$/.test(window.location.hash)) {
					// default for all tabs
					Array.prototype.forEach.call(instRef, (inst) => {
						let defaultTab = inst.getTabs()[Util.clamp(inst.getConfig().defaultIndex, 0, inst.getTabs().length - 1)];
						inst.switchTab(defaultTab, {
							hashChange: false,
							scrollTo: false,
							focus: false
						});
					});
				} else {
					// test for tabs
					let inst = null;
					let hashTab = null;
					for (let i = 0; i < instRef.length - 1 && inst == null; i++) {
						hashTab = Array.prototype.filter.call(instRef[i].getTabs(), (tab) => {
							return tab.getAttribute('href') == window.location.hash;
						})[0];

						if (typeof (hashTab) != 'undefined') {
							inst = instRef[i];
							break;
						}
					}

					if (inst == null) {
						// hash not part of tabs
						return;
					}

					inst.switchTab(hashTab, {
						hashChange: false,
						scrollTo: false,
						focus: false
					});
				}
			});
		}
	};

	var _export = function (tabGroup) {

		var _self = this;

		if (!(this instanceof _export)) {
			throw 'Tabs must be instantiated with new keyword.';
		}

		var _tabGroup = tabGroup;
		var _config = {};
		var _tabs = null;

		var _lock = new Lock();

		this.getTabs = function () {
			return _tabs;
		};

		this.getLock = function () {
			return _lock;
		};

		this.getConfig = function () {
			return _config;
		};

		this.init = function (args) {

			let tabList = _tabGroup.querySelector('.dcf-tabs > ol, .dcf-tabs > ul');
			tabList.classList.add('dcf-tabs-last', 'dcf-list-bar', 'dcf-mb-0');
			tabList.setAttribute('role', 'tablist');

			_tabs = tabList.querySelectorAll('a');
			
			$.extend(_config, {
				focus: true,
				scrollTo: true,
				hashChange: true,
				hashChangeHistory: true,
				onLoadHashSet: true,
				defaultIndex: 0
			}, args);

			Array.prototype.forEach.call(_tabs, (tab, tabIndex) => {
				let id = Util.getOrCreateID(tab);

				tab.classList.add('dcf-tab', 'dcf-d-block');
				tab.setAttribute('role', 'tab');
				tab.setAttribute('tabindex', '-1');

				tab.parentNode.classList.add('dcf-tabs-list-item', 'dcf-mb-0');
				tab.parentNode.setAttribute('role', 'presentation');

				tab.addEventListener('click', (e) => {
					e.preventDefault();
					if (_lock.getLock()) {
						this.switchTab(tab);
					}
				});

				tab.addEventListener('keydown', (e) => {
					let dir = null;
					if (e.which == 37) {
						// left
						dir = tabIndex - 1;
					} else if (e.which == 39) {
						// right
						dir = tabIndex + 1;
					} else if (e.which == 40) {
						// down
						dir = 'down';
					} else {
						dir = null;
					}

					if (dir !== null) {
						e.preventDefault();
						e.stopPropagation();

						if (_lock.getLock()) {
							if (dir === 'down') {
								getById(tab.getAttribute('href')).focus();
								_lock.unlock();
							} else {
								dir = Util.clamp(dir, 0, _tabs.length - 1);
								this.switchTab(_tabs[dir]);
							}
						}
					}
				});
				
				let panel = getById(tab.getAttribute('href'));
				panel.setAttribute('role', 'tabpanel')
				panel.setAttribute('tabindex', '-1');
				panel.setAttribute('aria-labeledby', id);
				panel.classList.add('dcf-tabs-panel');
				panel.hidden = true;

				panel.addEventListener('keydown', (e) => {
					if (e.which === 38) {
						// up arrow
						tab.focus();
					}
				});

				// reference for hashchange
				//instRef[tab.getAttribute('href')] = _self;
				instRef.push(_self);
			});

			let initTab = Array.prototype.filter.call(_tabs, (tab) => {
				return tab.getAttribute('href') == window.location.hash;
			})[0];


			if (!_config.onLoadHashSet || typeof (initTab) == 'undefined') {
				initTab = _tabs[Util.clamp(_config.defaultIndex, 0, _tabs.length - 1)];
			}

			initTab.removeAttribute('tabindex');
			initTab.setAttribute('aria-selected', 'true');
			
			getById(initTab.getAttribute('href')).hidden = false;

			runOnce();
		};

		this.switchTab = function (newTab, args) {
			let opt = {};
			
			$.extend(true, opt, _config, args);

			let oldTab = Array.prototype.filter.call(_tabs, (tab) => {
				return tab.getAttribute('aria-selected') == 'true';
			})[0];

			if (newTab.getAttribute('id') === oldTab.getAttribute('id')) {
				_lock.unlock();
				return;
			}

			let newPanel = getById(newTab.getAttribute('href'));
			let oldPanel = getById(oldTab.getAttribute('href'));

			let callBackAfter = function () {
				_lock.unlock();
			};

			let callBackBefore = function () {
				newTab.setAttribute('tabindex', '0');
				newTab.setAttribute('aria-selected', 'true');

				oldTab.removeAttribute('aria-selected');
				oldTab.setAttribute('tabindex', '-1');

				newPanel.hidden = false;
				oldPanel.hidden = true;

				if (opt.focus) {
					newTab.focus();
				}

				if (opt.scrollTo) {
					Util.scrollTo(newTab, 300);
				}

				if (history.pushState) {
					if (opt.hashChange) {
						let hash = window.location.pathname + window.location.search + newTab.getAttribute('href');
						if (opt.hashChangeHistory) {
							history.pushState(null, document.title, hash);
						} else {
							history.replaceState(null, document.title, hash);
						}
					}
				}

				if (opt.onAfterShow) {
					opt.onAfterShow(callBackAfter, {
						'newTab': newTab,
						'oldTab': oldTab,
						'newPanel': newPanel,
						'oldPanel': oldPanel
					});
				} else {
					callBackAfter();
				}
			};

			if (opt.onBeforeShow) {
				opt.onBeforeShow(callBackBefore, {
					'newTab': newTab,
					'oldTab': oldTab,
					'newPanel': newPanel,
					'oldPanel': oldPanel
				});
			} else {
				callBackBefore();
			}
		};

	};

	return _export;
});