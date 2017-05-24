define(['connectionManager', 'loading', 'scroller', './focushandler', 'focusManager', 'scrollHelper', 'browser', './../skininfo', 'emby-button', 'scrollStyles'], function (connectionManager, loading, scroller, focusHandler, focusManager, scrollHelper, browser, skinInfo) {
    'use strict';

    function focusViewSlider() {

        var selected = this.querySelector('.selected');

        if (selected) {
            focusManager.focus(selected);
        } else {
            focusManager.autoFocus(this);
        }
    }

    function createHeaderScroller(view, instance, initialTabId) {

        var userViewNames = view.querySelector('.userViewNames');

        userViewNames.classList.add('smoothScrollY');
        userViewNames.classList.add('focusable');
        userViewNames.classList.add('focuscontainer-y');
        userViewNames.style.scrollBehavior = 'smooth';
        userViewNames.focus = focusViewSlider;

        loading.hide();

        var initialTab = initialTabId ? userViewNames.querySelector('.btnUserViewHeader[data-id=\'' + initialTabId + '\']') : null;

        if (!initialTab) {
            initialTab = userViewNames.querySelector('.btnUserViewHeader');
        }

        // In Edge the web components aren't always immediately accessible
        setTimeout(function () {
            instance.setFocusDelay(view, initialTab);
        }, 0);
    }

    function parentWithClass(elem, className) {

        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;

            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function initEvents(view, instance) {
        var apiClient = connectionManager.currentApiClient();

        // Catch events on the view headers
        var userViewNames = view.querySelector('.userViewNames');
        userViewNames.addEventListener('click', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                scrollHelper.toCenter(userViewNames, elem, true);
                instance.setFocusDelay(view, elem);
            }
        });

        userViewNames.addEventListener('focus', function (e) {

            var elem = parentWithClass(e.target, 'btnUserViewHeader');

            if (elem) {
                scrollHelper.toCenter(userViewNames, elem, true);
                instance.setFocusDelay(view, elem);
            }
        }, true);

        userViewNames.addEventListener('click', function (e) {
            var elem = parentWithClass(e.target, 'btnUserViewHeader');
            if (elem) {
                var viewId = elem.getAttribute('data-id');
                var viewType = elem.getAttribute('data-type');
                //console.log("viewType:" + viewType);
                switch(viewType) {
                	case 'movies':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'movies/movies.html?parentid=' + viewId));
                	    break;
                	case 'tvshows':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'tv/tv.html?parentid=' + viewId + '&serverId=' + apiClient.serverId()));
                	    break;
                  case 'livetv':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'livetv/guide.html?parentid=' + viewId + '&serverId=' + apiClient.serverId()));
                	    break;
                	case 'music':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'music/music.html?tab=albumartists&parentid=' + viewId));
                	    break;
                	case 'homevideos':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'list/list.html?parentid=' + viewId));
                	    break;
                	case 'folders':
                	    Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'list/list.html?parentid=' + viewId));
                	    break;
                	default:
                		Emby.Page.show(Emby.PluginManager.mapRoute(skinInfo.id, 'list/list.html?parentid=' + viewId));
                }
            }
        }, true);
    }

    function parentWithClass(elem, className) {
        while (!elem.classList || !elem.classList.contains(className)) {
            elem = elem.parentNode;
            if (!elem) {
                return null;
            }
        }

        return elem;
    }

    function selectUserView(page, id, self) {

        var btn = page.querySelector(".btnUserViewHeader[data-id='" + id + "']");

        // self.bodyScroller.slideTo(0, true);

        var contentScrollSlider = page.querySelector('.viewContentArea');
        contentScrollSlider.innerHTML = '';
        var promise = self.loadViewContent.call(self, page, id, btn.getAttribute('data-type'));

        // Only enable the fade if native WebAnimations are supported
        if (promise && browser.animate) {
            promise.then(function () {
                fadeInRight(contentScrollSlider);
            });
        }
    }

    function fadeInRight(elem) {

        var keyframes = [
          { opacity: '0', transform: 'translate3d(1%, 0, 0)', offset: 0 },
          { opacity: '1', transform: 'none', offset: 1 }];
        var timing = { duration: 300, iterations: 1 };
        elem.animate(keyframes, timing);
    }

    function tabbedPageVertical(page, pageOptions) {

        var self = this;
        pageOptions = pageOptions || {};

        console.log('pageOptions', pageOptions);

        // lock the height so that the location of the top tabs won't fluctuate
        var contentScrollSlider = page.querySelector('.viewContentArea');
        contentScrollSlider.classList.add('focuscontainer-y');

        var selectedItemInfoElement = page.querySelector('.selectedItemInfo');
        var selectedIndexElement = page.querySelector('.selectedIndex');

        var tagName = 'button';

        var icons = {};
        icons.default = '&#xE037;';
        icons.movies = '&#xE02C;';
        icons.tvshows = '&#xE333;';
        icons.livetv = '&#xE639;';
        icons.homevideos = '&#xE3AF;';
        icons.music = '&#xE32D;';
        icons.photos = '&#xE412;';

        self.renderTabs = function (tabs, initialTabId) {

            page.querySelector('.userViewNames').innerHTML = tabs.map(function (i) {

                return '<' + tagName + ' is="emby-button" class="flat btnUserViewHeader button-flat violet" data-id="' + i.Id + '" data-type="' + (i.CollectionType || '') + '"><h3 class="userViewButtonText"><i class="md-icon">' + icons[i.CollectionType || 'default'] + '</i>' + i.Name + '</h3></' + tagName + '>';

            }).join('');

            createHeaderScroller(page, self, initialTabId);
            //createHorizontalScroller(page);
            console.log('page', page);
            initEvents(page, self);
        };

        function onAlphaPickerValueChanged() {

            var value = pageOptions.alphaPicker.value();

            trySelectValue(value);
        }

        function trySelectValue(value) {

            var card;

            // If it's the symbol just pick the first card
            if (value === '#') {

                card = contentScrollSlider.querySelector('.card');

                if (card) {
                    self.bodyScroller.toCenter(card, false);
                    return;
                }
            }

            card = contentScrollSlider.querySelector('.card[data-prefix^=\'' + value + '\']');

            if (card) {
                self.bodyScroller.toCenter(card, false);
                return;
            }

            // go to the previous letter
            var values = pageOptions.alphaPicker.values();
            var index = values.indexOf(value);

            if (index < values.length - 2) {
                trySelectValue(values[index + 1]);
            } else {
                var all = contentScrollSlider.querySelectorAll('.card');
                card = all.length ? all[all.length - 1] : null;

                if (card) {
                    self.bodyScroller.toCenter(card, false);
                }
            }
        }

        if (pageOptions.alphaPicker) {
            pageOptions.alphaPicker.on('alphavaluechanged', onAlphaPickerValueChanged);
        }

        var focusTimeout;
        var focusDelay = 0;
        self.setFocusDelay = function (view, elem, immediate) {

            var viewId = elem.getAttribute('data-id');

            var btn = view.querySelector('.btnUserViewHeader.selected');

            if (btn) {

                if (viewId === btn.getAttribute('data-id')) {
                    return;
                }
            }

            if (elem !== btn) {
                if (btn) {
                    btn.classList.remove('selected');
                }
                elem.classList.add('selected');
            }

            if (focusTimeout) {
                clearTimeout(focusTimeout);
            }

            var onTimeout = function () {

                selectUserView(view, viewId, self);

            };

            if (immediate) {
                onTimeout();
            } else {
                focusTimeout = setTimeout(onTimeout, focusDelay);
            }

            // No delay the first time
            focusDelay = 700;
        };

        // function createHorizontalScroller(view) {
        //
        //     var scrollFrame = view.querySelector('.itemScrollFrame');
        //
        //     var options = {
        //         horizontal: 1,
        //         itemNav: 0,
        //         mouseDragging: 1,
        //         touchDragging: 1,
        //         slidee: view.querySelector('.contentScrollSlider'),
        //         itemSelector: '.card',
        //         smart: true,
        //         releaseSwing: true,
        //         scrollBy: 200,
        //         speed: 300,
        //         immediateSpeed: pageOptions.immediateSpeed,
        //         elasticBounds: 1,
        //         dragHandle: 1,
        //         dynamicHandle: 1,
        //         clickBar: 1,
        //         scrollWidth: 500000
        //     };
        //
        //     self.bodyScroller = new scroller(scrollFrame, options);
        //     self.bodyScroller.init();
        //     initFocusHandler(view, self.bodyScroller);
        // }

        function initFocusHandler(view) {

            if (pageOptions.handleFocus) {

                var scrollSlider = view.querySelector('.contentScrollSlider');

                self.focusHandler = new focusHandler({
                    parent: scrollSlider,
                    selectedItemInfoElement: selectedItemInfoElement,
                    selectedIndexElement: selectedIndexElement,
                    animateFocus: pageOptions.animateFocus,
                    scroller: self.bodyScroller,
                    enableBackdrops: true
                });
            }
        }

        self.destroy = function () {

            if (pageOptions.alphaPicker) {
                pageOptions.alphaPicker.off('alphavaluechanged', onAlphaPickerValueChanged);
            }

            if (self.focusHandler) {
                self.focusHandler.destroy();
                self.focusHandler = null;
            }
            if (self.bodyScroller) {
                self.bodyScroller.destroy();
                self.bodyScroller = null;
            }
        };
    }

    return tabbedPageVertical;
});
