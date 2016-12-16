var otsimo = function() {
    "use strict";
    if (typeof otsimo !== "undefined") {
        return otsimo
    }
    var __isloaded = false;
    var __callbackStack = [];
    var __settingsCallbacks = [];
    var __saveCallbacks = []
    var __resolutionCallbacks = [];

    var otemp = {
        settings: {},
        kv: {},
        child: {},
        manifest: {},
        debug: false,
        sound: true
    }

    Object.defineProperty(otemp, "isWKWebView", {
        value: !!(window.webkit && window.webkit.messageHandlers)
    });
    Object.defineProperty(otemp, "isUIWebView", {
        value: (typeof otsimonative !== 'undefined')
    });
    Object.defineProperty(otemp, "iOS", {
        value: (navigator.userAgent.match(/(iPad|iPhone|iPod)/g) ? true : false)
    });

    var getJSON = function(url, res) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.onreadystatechange = function() {
            var status;
            var data;
            if (xmlhttp.readyState == 4) {
                status = xmlhttp.status;
                if (status === 200 || status === 0) {
                    data = JSON.parse(xmlhttp.responseText);
                    res && res(null, data);
                } else {
                    res && res(status, null);
                }
            }
        };
        xmlhttp.open("GET", url, true);
        xmlhttp.send();
    }

    var __registerLoadingCallback = function(fn) {
        __callbackStack.push(fn)
    }

    var __callLoadingCallbacks = function() {
        __isloaded = true
        for (var i = 0; i < __callbackStack.length; i++) {
            __callbackStack[i]()
        }
        __callbackStack.splice(0, __callbackStack.length)
    }

    otemp.log = function() {
        if (otemp.isWKWebView) {
            console.log.apply(console, arguments)
            window.webkit.messageHandlers.console.postMessage(JSON.stringify(arguments));
        } else {
            console.log.apply(console, arguments)
        }
    }

    otemp.customevent = function(eventName, data) {
        if (otemp.isWKWebView) {
            window.webkit.messageHandlers.analytics.postMessage({
                event: eventName,
                data: data
            });
        } else if (otemp.isUIWebView) {
            otsimonative.customevent({
                event: eventName,
                data: data
            })
        } else {
            otemp.log("customevent", eventName, data)
        }
    }

    otemp.quitgame = function() {
        if (otemp.isWKWebView) {
            window.webkit.messageHandlers.player.postMessage({
                event: "quitgame"
            });
        } else if (otemp.isUIWebView) {
            otsimonative.player({
                event: "quitgame"
            })
        } else {
            otemp.log("quit game called")
        }
    }

    otemp.run = function(fn) {
        otemp.log("register function to run")

        if (__isloaded) {
            if (fn) {
                fn()
            }
        } else {
            __registerLoadingCallback(fn)
        }
    }

    otemp.onSettingsChanged = function(fn) {
        __settingsCallbacks.push(fn)
    }

    otemp.onResolutionChanged = function(fn) {
        __resolutionCallbacks.push(fn)
    }

    otemp.__callSettingsCallbacks = function(settings, sound) {
        if (settings) {
            otemp.settings = settings
        }
        otemp.sound = sound

        for (var i = 0; i < __settingsCallbacks.length; i++) {
            __settingsCallbacks[i](settings, sound)
        }
    }

    otemp.__callResolutionCallbacks = function(width, height, orientation) {
        for (var i = 0; i < __resolutionCallbacks.length; i++) {
            __resolutionCallbacks[i](width, height, orientation)
        }
    }

    otemp.init = function(options) {
        if (!options) {
            options = {}
        }
        otemp.log("initialize of bundle otsimo.js")

        if (otemp.isWKWebView && !options.isTestApp) {
            otemp.log("sandbox won't be initializing")
            return
        }

        if (otemp.isUIWebView && !options.isTestApp) {
            otemp.log("sandbox won't be initializing")
            return
        }

        otemp.child.firstname = options.firstname || "debug"
        otemp.child.lastname = options.lastname || "user"
        otemp.child.language = options.language || otemp.getLanguages()[0]
        otemp.width = options.width || 1024
        otemp.height = options.height || 768
        if (options.capabilities && Array === options.capabilities.constructor) {
            Object.defineProperty(otemp, "capabilities", {
                value: options.capabilities
            });
        } else {
            Object.defineProperty(otemp, "capabilities", {
                value: ["sandbox"]
            });
        }
        if (typeof options.debug != "undefined" && options.debug == false) {
            otemp.debug = false
        } else {
            otemp.debug = true
        }
        getJSON("otsimo.json", otemp.__initManifest)
    }

    otemp.getLanguages = function() {
        var found = []
        if (typeof navigator !== 'undefined') {
            if (navigator.languages) { // chrome only; not an array, so can't use .push.apply instead of iterating
                for (var i = 0; i < navigator.languages.length; i++) {
                    found.push(navigator.languages[i]);
                }
            }
            if (navigator.userLanguage) {
                found.push(navigator.userLanguage);
            }
            if (navigator.language) {
                found.push(navigator.language);
            }
        }
        return found
    }

    otemp.saveLocalSettings = function(data) {
        var sdata = JSON.stringify(data)
        if (otemp.isWKWebView) {
            window.webkit.messageHandlers.save.postMessage({
                event: "save",
                data: sdata
            });
        } else if (otemp.isUIWebView) {
            otsimonative.saveLocalSettings({
                data: sdata
            })
        } else {
            otemp.log("saveLocalSettings", data)
            localStorage.setItem(otemp.__storageKey(), sdata);
        }
    }

    otemp.loadLocalSettings = function(callback) {
        if (otemp.isWKWebView) {
            var id = otemp.__addSaveCallback(callback)
            window.webkit.messageHandlers.save.postMessage({
                event: "load",
                id: id
            });
        } else if (otemp.isUIWebView) {
            otsimonative.loadLocalSettings(callback)
        } else {
            try {
                var sdata = localStorage.getItem(otemp.__storageKey());
                var data = JSON.parse(sdata)
                callback(null, data);
            } catch (err) {
                callback(err, null);
            }
        }
    }

    function makeid(length) {
        if (!length) {
            length = 5
        }
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < length; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }

    otemp.__addSaveCallback = function(callback) {
        var id = makeid(4)
        __saveCallbacks.push({
            id: id,
            callback: callback
        })
        return id
    }

    otemp.__storageKey = function() {
        return otemp.manifest.unique_name
    }

    otemp.__callSaveCallback = function(err, data, id) {
        for (var i = 0; i < __saveCallbacks.length; i++) {
            var cc = ___saveCallbacks[i]
            if (cc.id == id) {
                ___saveCallbacks.splice(i, 1);
                if (data == "" || err == "") {
                    cc.callback(err, null);
                } else {
                    try {
                        var odata = JSON.parse(data)
                        cc.callback(null, odata);
                    } catch (error) {
                        cc.callback(error, null);
                    }
                }
                return
            }
        }
    }

    otemp.__init = function(options) {
        otemp.log("__init called", options)
        otemp.settings = options.settings
        otemp.child = options.child
        otemp.width = options.screen.width
        otemp.height = options.screen.height
        otemp.sound = options.sound
        otemp.root = options.root
        if (options.capabilities && Array === options.capabilities.constructor) {
            Object.defineProperty(otemp, "capabilities", {
                value: options.capabilities
            });
        } else {
            Object.defineProperty(otemp, "capabilities", {
                value: ["sandbox"]
            });
        }
        getJSON(otemp.root + "otsimo.json", function(err, manifest) {
            if (err) {
                otemp.log("Failed to get otsimo.json, status=", err)
            } else {
                otemp.manifest = manifest
                var langFile = otemp.root + manifest.kv_path + "/" + otemp.child.language + ".json"
                getJSON(langFile, function(err, data) {
                    if (err) {
                        otemp.log("failed to get kv, status", err)
                    } else {
                        otemp.kv = data
                        otemp.log("initialized", otemp)
                        __callLoadingCallbacks()
                    }
                })
            }
        })
        return true
    }

    otemp.__initManifest = function(err, data) {
        if (err) {
            otemp.log("Failed to get otsimo.json, status=", err)
        } else {
            otemp.manifest = data
            getJSON(otemp.manifest.settings, otemp.__initSettings)
        }
    }

    otemp.__loadKeyValueStore = function() {
        var sy = otemp.getLanguages()
        var lang = otemp.child.language || otemp.manifest.default_language;
        var langFile = otemp.manifest.kv_path + "/" + lang + ".json"

        if (sy.length > 0 && !otemp.child.language) {
            for (var i = 0; i < sy.length; ++i) {
                var nextLang = otemp.manifest.languages[sy[i].substring(0, 2)];
                if (nextLang) {
                    langFile = otemp.manifest.kv_path + "/" + nextLang + ".json"
                    break;
                }
            }
        }
        getJSON(langFile, function(err, data) {
            if (err) {
                otemp.log("failed to get kv, status", err)
            } else {
                otemp.kv = data
                otemp.log("initialized", otemp)
                __callLoadingCallbacks()
            }
        })
    }

    otemp.__initSettings = function(err, data) {
        if (err) {
            otemp.log("failed to get settings,status", err)
        } else {
            otemp.log("settings", data)
            var ks = Object.keys(data.properties)
            for (var i = 0; i < ks.length; ++i) {
                var p = data.properties[ks[i]]
                otemp.settings[p.id] = p.default
            }
            otemp.__loadKeyValueStore()
        }
    }
    var tts = {
        __driver: null
    }
    tts.speak = function(text) {
        if (tts.__driver) {
            return tts.__driver.speak(text);
        }
        return new Error("TTS Driver is not set")
    }
    tts.setVoice = function(voice) {
        if (tts.__driver) {
            return tts.__driver.setVoice(voice);
        }
        return new Error("TTS Driver is not set")
    }
    tts.getVoice = function() {
        if (tts.__driver) {
            return tts.__driver.getVoice();
        }
        return new Error("TTS Driver is not set")
    }
    tts.voiceList = function() {
        if (tts.__driver) {
            return tts.__driver.voiceList();
        }
        return new Error("TTS Driver is not set")
    }
    tts.setDriver = function(driver) {
        tts.__driver = driver;
    }
    tts.getDriver = function() {
        return tts.__driver;
    }
    Object.defineProperty(otemp, "tts", {
        value: tts,
        writable: false
    });
    return otemp
}()
