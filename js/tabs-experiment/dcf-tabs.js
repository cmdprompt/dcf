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

	function _export(tabGroup) {
		if (!(this instanceof _export)) {
			throw 'Tabs must be instantiated with new keyword.';
		}
		this._tabGroup = tabGroup;
		this._config = {};
		this._tabs = null;

		this._lock = new Lock();
	};

	_export.prototype.getTabs = function () {
		return this._tabs;
	};

	_export.prototype.getLock = function () {
		return this._lock;
	};

	_export.prototype.init = function (args) {
		let self = this;

		let tabList = this._tabGroup.querySelector('.dcf-tabs > ol, .dcf-tabs > ul');
		tabList.classList.add('dcf-tabs-last', 'dcf-list-bar', 'dcf-mb-0');
		tabList.setAttribute('role', 'tablist');

		this._tabs = tabList.querySelectorAll('a');
		console.log(this._tabs);
		$.extend(this._config, {
			focus: true,
			scrollTo: true,
			hashChange: true,
			hashChangeHistory: true,
			onLoadHashSet: true,
			defaultIndex: 0
		}, args);

		Array.prototype.forEach.call(this._tabs, (tab, tabIndex) => {
			let id = Util.getOrCreateID(tab);

			tab.classList.add('dcf-tab', 'dcf-d-block');
			tab.setAttribute('role', 'tab');
			tab.setAttribute('tabindex', '-1');

			tab.parentNode.classList.add('dcf-tabs-list-item', 'dcf-mb-0');
			tab.parentNode.setAttribute('role', 'presentation');

			tab.addEventListener('click', (e) => {
				e.preventDefault();
				if (this._lock.getLock()) {
					console.log('Click Tab(' + tab.getAttribute('id') + ')');
					this.switchTab(tab);
				}
			});

			tab.addEventListener('keydown', (e) => {
				let dir = null;
				if (e.which == 37) {
					//left
					dir = tabIndex - 1;
				} else if (e.which == 39) {
					//right
					dir = tabIndex + 1;
				} else if (e.which == 40) {
					dir = 'down';
				} else {
					dir = null;
				}

				if (dir !== null) {
					e.preventDefault();
					e.stopPropagation();

					if (this._lock.getLock()) {
						if (dir === 'down') {
							//document.getElementById(stripHash(tab.getAttribute('href'))).focus();
							getById(tab.getAttribute('href')).focus();
							this._lock.unlock();
						} else {
							dir = Util.clamp(dir, 0, this._tabs.length - 1);
							this.switchTab(this._tabs[dir]);
						}
					}
				}
			});
			//let panel = document.getElementById(stripHash(tab.getAttribute('href')));
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
		});

		let initTab = Array.prototype.filter.call(this._tabs, (tab) => {
			return tab.getAttribute('href') == window.location.hash;
		})[0];

		
		if (!this._config.onLoadHashSet || typeof (initTab) == 'undefined') {
			initTab = this._tabs[Util.clamp(this._config.defaultIndex, 0, this._tabs.length - 1)];
		}

		initTab.removeAttribute('tabindex');
		initTab.setAttribute('aria-selected', 'true');
		//document.getElementById(stripHash(initTab.getAttribute('href'))).hidden = false;
		getById(initTab.getAttribute('href')).hidden = false;

		window.addEventListener('hashchange', () => {
			console.log('HashChange');
			let hashTab = Array.prototype.filter.call(self._tabs, (tab) => {
				return tab.getAttribute('href') == window.location.hash;
			})[0];


			if (typeof (hashTab) == 'undefined') {
				hashTab = self._tabs[Util.clamp(self._config.defaultIndex, 0, self._tabs.length - 1)];
			}

			self.switchTab(hashTab, {
				hashChange: false,
				scrollTo: false,
				focus: false
			});
		});
	};


	_export.prototype.switchTab = function (newTab, args) {
		let opt = {};
		let inst = this;

		$.extend(true, opt, this._config, args);

		let oldTab = Array.prototype.filter.call(this._tabs, (tab) => {
			return tab.getAttribute('aria-selected') == 'true';
		})[0];

		if (newTab.getAttribute('id') === oldTab.getAttribute('id')) {
			this._lock.unlock();
			return;
		}

		//let newPanel = document.getElementById(stripHash(newTab.getAttribute('href')));
		let newPanel = getById(newTab.getAttribute('href'));
		//let oldPanel = document.getElementById(stripHash(oldTab.getAttribute('href')));
		let oldPanel = getById(oldTab.getAttribute('href'));

		let callBackAfter = function () {
			inst._lock.unlock();
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

	return _export;
});