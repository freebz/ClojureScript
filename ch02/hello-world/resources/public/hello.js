var COMPILED = false;
var goog = goog || {};
goog.global = this;
goog.DEBUG = true;
goog.LOCALE = "en";
goog.provide = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      throw Error('Namespace "' + name + '" already declared.');
    }
    delete goog.implicitNamespaces_[name];
    var namespace = name;
    while(namespace = namespace.substring(0, namespace.lastIndexOf("."))) {
      if(goog.getObjectByName(namespace)) {
        break
      }
      goog.implicitNamespaces_[namespace] = true
    }
  }
  goog.exportPath_(name)
};
goog.setTestOnly = function(opt_message) {
  if(COMPILED && !goog.DEBUG) {
    opt_message = opt_message || "";
    throw Error("Importing test-only code into non-debug environment" + opt_message ? ": " + opt_message : ".");
  }
};
if(!COMPILED) {
  goog.isProvided_ = function(name) {
    return!goog.implicitNamespaces_[name] && !!goog.getObjectByName(name)
  };
  goog.implicitNamespaces_ = {}
}
goog.exportPath_ = function(name, opt_object, opt_objectToExportTo) {
  var parts = name.split(".");
  var cur = opt_objectToExportTo || goog.global;
  if(!(parts[0] in cur) && cur.execScript) {
    cur.execScript("var " + parts[0])
  }
  for(var part;parts.length && (part = parts.shift());) {
    if(!parts.length && goog.isDef(opt_object)) {
      cur[part] = opt_object
    }else {
      if(cur[part]) {
        cur = cur[part]
      }else {
        cur = cur[part] = {}
      }
    }
  }
};
goog.getObjectByName = function(name, opt_obj) {
  var parts = name.split(".");
  var cur = opt_obj || goog.global;
  for(var part;part = parts.shift();) {
    if(goog.isDefAndNotNull(cur[part])) {
      cur = cur[part]
    }else {
      return null
    }
  }
  return cur
};
goog.globalize = function(obj, opt_global) {
  var global = opt_global || goog.global;
  for(var x in obj) {
    global[x] = obj[x]
  }
};
goog.addDependency = function(relPath, provides, requires) {
  if(!COMPILED) {
    var provide, require;
    var path = relPath.replace(/\\/g, "/");
    var deps = goog.dependencies_;
    for(var i = 0;provide = provides[i];i++) {
      deps.nameToPath[provide] = path;
      if(!(path in deps.pathToNames)) {
        deps.pathToNames[path] = {}
      }
      deps.pathToNames[path][provide] = true
    }
    for(var j = 0;require = requires[j];j++) {
      if(!(path in deps.requires)) {
        deps.requires[path] = {}
      }
      deps.requires[path][require] = true
    }
  }
};
goog.ENABLE_DEBUG_LOADER = true;
goog.require = function(name) {
  if(!COMPILED) {
    if(goog.isProvided_(name)) {
      return
    }
    if(goog.ENABLE_DEBUG_LOADER) {
      var path = goog.getPathFromDeps_(name);
      if(path) {
        goog.included_[path] = true;
        goog.writeScripts_();
        return
      }
    }
    var errorMessage = "goog.require could not find: " + name;
    if(goog.global.console) {
      goog.global.console["error"](errorMessage)
    }
    throw Error(errorMessage);
  }
};
goog.basePath = "";
goog.global.CLOSURE_BASE_PATH;
goog.global.CLOSURE_NO_DEPS;
goog.global.CLOSURE_IMPORT_SCRIPT;
goog.nullFunction = function() {
};
goog.identityFunction = function(var_args) {
  return arguments[0]
};
goog.abstractMethod = function() {
  throw Error("unimplemented abstract method");
};
goog.addSingletonGetter = function(ctor) {
  ctor.getInstance = function() {
    return ctor.instance_ || (ctor.instance_ = new ctor)
  }
};
if(!COMPILED && goog.ENABLE_DEBUG_LOADER) {
  goog.included_ = {};
  goog.dependencies_ = {pathToNames:{}, nameToPath:{}, requires:{}, visited:{}, written:{}};
  goog.inHtmlDocument_ = function() {
    var doc = goog.global.document;
    return typeof doc != "undefined" && "write" in doc
  };
  goog.findBasePath_ = function() {
    if(goog.global.CLOSURE_BASE_PATH) {
      goog.basePath = goog.global.CLOSURE_BASE_PATH;
      return
    }else {
      if(!goog.inHtmlDocument_()) {
        return
      }
    }
    var doc = goog.global.document;
    var scripts = doc.getElementsByTagName("script");
    for(var i = scripts.length - 1;i >= 0;--i) {
      var src = scripts[i].src;
      var qmark = src.lastIndexOf("?");
      var l = qmark == -1 ? src.length : qmark;
      if(src.substr(l - 7, 7) == "base.js") {
        goog.basePath = src.substr(0, l - 7);
        return
      }
    }
  };
  goog.importScript_ = function(src) {
    var importScript = goog.global.CLOSURE_IMPORT_SCRIPT || goog.writeScriptTag_;
    if(!goog.dependencies_.written[src] && importScript(src)) {
      goog.dependencies_.written[src] = true
    }
  };
  goog.writeScriptTag_ = function(src) {
    if(goog.inHtmlDocument_()) {
      var doc = goog.global.document;
      doc.write('<script type="text/javascript" src="' + src + '"></' + "script>");
      return true
    }else {
      return false
    }
  };
  goog.writeScripts_ = function() {
    var scripts = [];
    var seenScript = {};
    var deps = goog.dependencies_;
    function visitNode(path) {
      if(path in deps.written) {
        return
      }
      if(path in deps.visited) {
        if(!(path in seenScript)) {
          seenScript[path] = true;
          scripts.push(path)
        }
        return
      }
      deps.visited[path] = true;
      if(path in deps.requires) {
        for(var requireName in deps.requires[path]) {
          if(!goog.isProvided_(requireName)) {
            if(requireName in deps.nameToPath) {
              visitNode(deps.nameToPath[requireName])
            }else {
              throw Error("Undefined nameToPath for " + requireName);
            }
          }
        }
      }
      if(!(path in seenScript)) {
        seenScript[path] = true;
        scripts.push(path)
      }
    }
    for(var path in goog.included_) {
      if(!deps.written[path]) {
        visitNode(path)
      }
    }
    for(var i = 0;i < scripts.length;i++) {
      if(scripts[i]) {
        goog.importScript_(goog.basePath + scripts[i])
      }else {
        throw Error("Undefined script input");
      }
    }
  };
  goog.getPathFromDeps_ = function(rule) {
    if(rule in goog.dependencies_.nameToPath) {
      return goog.dependencies_.nameToPath[rule]
    }else {
      return null
    }
  };
  goog.findBasePath_();
  if(!goog.global.CLOSURE_NO_DEPS) {
    goog.importScript_(goog.basePath + "deps.js")
  }
}
goog.typeOf = function(value) {
  var s = typeof value;
  if(s == "object") {
    if(value) {
      if(value instanceof Array) {
        return"array"
      }else {
        if(value instanceof Object) {
          return s
        }
      }
      var className = Object.prototype.toString.call(value);
      if(className == "[object Window]") {
        return"object"
      }
      if(className == "[object Array]" || typeof value.length == "number" && typeof value.splice != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("splice")) {
        return"array"
      }
      if(className == "[object Function]" || typeof value.call != "undefined" && typeof value.propertyIsEnumerable != "undefined" && !value.propertyIsEnumerable("call")) {
        return"function"
      }
    }else {
      return"null"
    }
  }else {
    if(s == "function" && typeof value.call == "undefined") {
      return"object"
    }
  }
  return s
};
goog.propertyIsEnumerableCustom_ = function(object, propName) {
  if(propName in object) {
    for(var key in object) {
      if(key == propName && Object.prototype.hasOwnProperty.call(object, propName)) {
        return true
      }
    }
  }
  return false
};
goog.propertyIsEnumerable_ = function(object, propName) {
  if(object instanceof Object) {
    return Object.prototype.propertyIsEnumerable.call(object, propName)
  }else {
    return goog.propertyIsEnumerableCustom_(object, propName)
  }
};
goog.isDef = function(val) {
  return val !== undefined
};
goog.isNull = function(val) {
  return val === null
};
goog.isDefAndNotNull = function(val) {
  return val != null
};
goog.isArray = function(val) {
  return goog.typeOf(val) == "array"
};
goog.isArrayLike = function(val) {
  var type = goog.typeOf(val);
  return type == "array" || type == "object" && typeof val.length == "number"
};
goog.isDateLike = function(val) {
  return goog.isObject(val) && typeof val.getFullYear == "function"
};
goog.isString = function(val) {
  return typeof val == "string"
};
goog.isBoolean = function(val) {
  return typeof val == "boolean"
};
goog.isNumber = function(val) {
  return typeof val == "number"
};
goog.isFunction = function(val) {
  return goog.typeOf(val) == "function"
};
goog.isObject = function(val) {
  var type = goog.typeOf(val);
  return type == "object" || type == "array" || type == "function"
};
goog.getUid = function(obj) {
  return obj[goog.UID_PROPERTY_] || (obj[goog.UID_PROPERTY_] = ++goog.uidCounter_)
};
goog.removeUid = function(obj) {
  if("removeAttribute" in obj) {
    obj.removeAttribute(goog.UID_PROPERTY_)
  }
  try {
    delete obj[goog.UID_PROPERTY_]
  }catch(ex) {
  }
};
goog.UID_PROPERTY_ = "closure_uid_" + Math.floor(Math.random() * 2147483648).toString(36);
goog.uidCounter_ = 0;
goog.getHashCode = goog.getUid;
goog.removeHashCode = goog.removeUid;
goog.cloneObject = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.cloneObject(obj[key])
    }
    return clone
  }
  return obj
};
Object.prototype.clone;
goog.bindNative_ = function(fn, selfObj, var_args) {
  return fn.call.apply(fn.bind, arguments)
};
goog.bindJs_ = function(fn, selfObj, var_args) {
  if(!fn) {
    throw new Error;
  }
  if(arguments.length > 2) {
    var boundArgs = Array.prototype.slice.call(arguments, 2);
    return function() {
      var newArgs = Array.prototype.slice.call(arguments);
      Array.prototype.unshift.apply(newArgs, boundArgs);
      return fn.apply(selfObj, newArgs)
    }
  }else {
    return function() {
      return fn.apply(selfObj, arguments)
    }
  }
};
goog.bind = function(fn, selfObj, var_args) {
  if(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code") != -1) {
    goog.bind = goog.bindNative_
  }else {
    goog.bind = goog.bindJs_
  }
  return goog.bind.apply(null, arguments)
};
goog.partial = function(fn, var_args) {
  var args = Array.prototype.slice.call(arguments, 1);
  return function() {
    var newArgs = Array.prototype.slice.call(arguments);
    newArgs.unshift.apply(newArgs, args);
    return fn.apply(this, newArgs)
  }
};
goog.mixin = function(target, source) {
  for(var x in source) {
    target[x] = source[x]
  }
};
goog.now = Date.now || function() {
  return+new Date
};
goog.globalEval = function(script) {
  if(goog.global.execScript) {
    goog.global.execScript(script, "JavaScript")
  }else {
    if(goog.global.eval) {
      if(goog.evalWorksForGlobals_ == null) {
        goog.global.eval("var _et_ = 1;");
        if(typeof goog.global["_et_"] != "undefined") {
          delete goog.global["_et_"];
          goog.evalWorksForGlobals_ = true
        }else {
          goog.evalWorksForGlobals_ = false
        }
      }
      if(goog.evalWorksForGlobals_) {
        goog.global.eval(script)
      }else {
        var doc = goog.global.document;
        var scriptElt = doc.createElement("script");
        scriptElt.type = "text/javascript";
        scriptElt.defer = false;
        scriptElt.appendChild(doc.createTextNode(script));
        doc.body.appendChild(scriptElt);
        doc.body.removeChild(scriptElt)
      }
    }else {
      throw Error("goog.globalEval not available");
    }
  }
};
goog.evalWorksForGlobals_ = null;
goog.cssNameMapping_;
goog.cssNameMappingStyle_;
goog.getCssName = function(className, opt_modifier) {
  var getMapping = function(cssName) {
    return goog.cssNameMapping_[cssName] || cssName
  };
  var renameByParts = function(cssName) {
    var parts = cssName.split("-");
    var mapped = [];
    for(var i = 0;i < parts.length;i++) {
      mapped.push(getMapping(parts[i]))
    }
    return mapped.join("-")
  };
  var rename;
  if(goog.cssNameMapping_) {
    rename = goog.cssNameMappingStyle_ == "BY_WHOLE" ? getMapping : renameByParts
  }else {
    rename = function(a) {
      return a
    }
  }
  if(opt_modifier) {
    return className + "-" + rename(opt_modifier)
  }else {
    return rename(className)
  }
};
goog.setCssNameMapping = function(mapping, opt_style) {
  goog.cssNameMapping_ = mapping;
  goog.cssNameMappingStyle_ = opt_style
};
goog.global.CLOSURE_CSS_NAME_MAPPING;
if(!COMPILED && goog.global.CLOSURE_CSS_NAME_MAPPING) {
  goog.cssNameMapping_ = goog.global.CLOSURE_CSS_NAME_MAPPING
}
goog.getMsg = function(str, opt_values) {
  var values = opt_values || {};
  for(var key in values) {
    var value = ("" + values[key]).replace(/\$/g, "$$$$");
    str = str.replace(new RegExp("\\{\\$" + key + "\\}", "gi"), value)
  }
  return str
};
goog.exportSymbol = function(publicPath, object, opt_objectToExportTo) {
  goog.exportPath_(publicPath, object, opt_objectToExportTo)
};
goog.exportProperty = function(object, publicName, symbol) {
  object[publicName] = symbol
};
goog.inherits = function(childCtor, parentCtor) {
  function tempCtor() {
  }
  tempCtor.prototype = parentCtor.prototype;
  childCtor.superClass_ = parentCtor.prototype;
  childCtor.prototype = new tempCtor;
  childCtor.prototype.constructor = childCtor
};
goog.base = function(me, opt_methodName, var_args) {
  var caller = arguments.callee.caller;
  if(caller.superClass_) {
    return caller.superClass_.constructor.apply(me, Array.prototype.slice.call(arguments, 1))
  }
  var args = Array.prototype.slice.call(arguments, 2);
  var foundCaller = false;
  for(var ctor = me.constructor;ctor;ctor = ctor.superClass_ && ctor.superClass_.constructor) {
    if(ctor.prototype[opt_methodName] === caller) {
      foundCaller = true
    }else {
      if(foundCaller) {
        return ctor.prototype[opt_methodName].apply(me, args)
      }
    }
  }
  if(me[opt_methodName] === caller) {
    return me.constructor.prototype[opt_methodName].apply(me, args)
  }else {
    throw Error("goog.base called from a method of one name " + "to a method of a different name");
  }
};
goog.scope = function(fn) {
  fn.call(goog.global)
};
goog.provide("goog.string");
goog.provide("goog.string.Unicode");
goog.string.Unicode = {NBSP:"\u00a0"};
goog.string.startsWith = function(str, prefix) {
  return str.lastIndexOf(prefix, 0) == 0
};
goog.string.endsWith = function(str, suffix) {
  var l = str.length - suffix.length;
  return l >= 0 && str.indexOf(suffix, l) == l
};
goog.string.caseInsensitiveStartsWith = function(str, prefix) {
  return goog.string.caseInsensitiveCompare(prefix, str.substr(0, prefix.length)) == 0
};
goog.string.caseInsensitiveEndsWith = function(str, suffix) {
  return goog.string.caseInsensitiveCompare(suffix, str.substr(str.length - suffix.length, suffix.length)) == 0
};
goog.string.subs = function(str, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var replacement = String(arguments[i]).replace(/\$/g, "$$$$");
    str = str.replace(/\%s/, replacement)
  }
  return str
};
goog.string.collapseWhitespace = function(str) {
  return str.replace(/[\s\xa0]+/g, " ").replace(/^\s+|\s+$/g, "")
};
goog.string.isEmpty = function(str) {
  return/^[\s\xa0]*$/.test(str)
};
goog.string.isEmptySafe = function(str) {
  return goog.string.isEmpty(goog.string.makeSafe(str))
};
goog.string.isBreakingWhitespace = function(str) {
  return!/[^\t\n\r ]/.test(str)
};
goog.string.isAlpha = function(str) {
  return!/[^a-zA-Z]/.test(str)
};
goog.string.isNumeric = function(str) {
  return!/[^0-9]/.test(str)
};
goog.string.isAlphaNumeric = function(str) {
  return!/[^a-zA-Z0-9]/.test(str)
};
goog.string.isSpace = function(ch) {
  return ch == " "
};
goog.string.isUnicodeChar = function(ch) {
  return ch.length == 1 && ch >= " " && ch <= "~" || ch >= "\u0080" && ch <= "\ufffd"
};
goog.string.stripNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)+/g, " ")
};
goog.string.canonicalizeNewlines = function(str) {
  return str.replace(/(\r\n|\r|\n)/g, "\n")
};
goog.string.normalizeWhitespace = function(str) {
  return str.replace(/\xa0|\s/g, " ")
};
goog.string.normalizeSpaces = function(str) {
  return str.replace(/\xa0|[ \t]+/g, " ")
};
goog.string.collapseBreakingSpaces = function(str) {
  return str.replace(/[\t\r\n ]+/g, " ").replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, "")
};
goog.string.trim = function(str) {
  return str.replace(/^[\s\xa0]+|[\s\xa0]+$/g, "")
};
goog.string.trimLeft = function(str) {
  return str.replace(/^[\s\xa0]+/, "")
};
goog.string.trimRight = function(str) {
  return str.replace(/[\s\xa0]+$/, "")
};
goog.string.caseInsensitiveCompare = function(str1, str2) {
  var test1 = String(str1).toLowerCase();
  var test2 = String(str2).toLowerCase();
  if(test1 < test2) {
    return-1
  }else {
    if(test1 == test2) {
      return 0
    }else {
      return 1
    }
  }
};
goog.string.numerateCompareRegExp_ = /(\.\d+)|(\d+)|(\D+)/g;
goog.string.numerateCompare = function(str1, str2) {
  if(str1 == str2) {
    return 0
  }
  if(!str1) {
    return-1
  }
  if(!str2) {
    return 1
  }
  var tokens1 = str1.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var tokens2 = str2.toLowerCase().match(goog.string.numerateCompareRegExp_);
  var count = Math.min(tokens1.length, tokens2.length);
  for(var i = 0;i < count;i++) {
    var a = tokens1[i];
    var b = tokens2[i];
    if(a != b) {
      var num1 = parseInt(a, 10);
      if(!isNaN(num1)) {
        var num2 = parseInt(b, 10);
        if(!isNaN(num2) && num1 - num2) {
          return num1 - num2
        }
      }
      return a < b ? -1 : 1
    }
  }
  if(tokens1.length != tokens2.length) {
    return tokens1.length - tokens2.length
  }
  return str1 < str2 ? -1 : 1
};
goog.string.encodeUriRegExp_ = /^[a-zA-Z0-9\-_.!~*'()]*$/;
goog.string.urlEncode = function(str) {
  str = String(str);
  if(!goog.string.encodeUriRegExp_.test(str)) {
    return encodeURIComponent(str)
  }
  return str
};
goog.string.urlDecode = function(str) {
  return decodeURIComponent(str.replace(/\+/g, " "))
};
goog.string.newLineToBr = function(str, opt_xml) {
  return str.replace(/(\r\n|\r|\n)/g, opt_xml ? "<br />" : "<br>")
};
goog.string.htmlEscape = function(str, opt_isLikelyToContainHtmlChars) {
  if(opt_isLikelyToContainHtmlChars) {
    return str.replace(goog.string.amperRe_, "&amp;").replace(goog.string.ltRe_, "&lt;").replace(goog.string.gtRe_, "&gt;").replace(goog.string.quotRe_, "&quot;")
  }else {
    if(!goog.string.allRe_.test(str)) {
      return str
    }
    if(str.indexOf("&") != -1) {
      str = str.replace(goog.string.amperRe_, "&amp;")
    }
    if(str.indexOf("<") != -1) {
      str = str.replace(goog.string.ltRe_, "&lt;")
    }
    if(str.indexOf(">") != -1) {
      str = str.replace(goog.string.gtRe_, "&gt;")
    }
    if(str.indexOf('"') != -1) {
      str = str.replace(goog.string.quotRe_, "&quot;")
    }
    return str
  }
};
goog.string.amperRe_ = /&/g;
goog.string.ltRe_ = /</g;
goog.string.gtRe_ = />/g;
goog.string.quotRe_ = /\"/g;
goog.string.allRe_ = /[&<>\"]/;
goog.string.unescapeEntities = function(str) {
  if(goog.string.contains(str, "&")) {
    if("document" in goog.global) {
      return goog.string.unescapeEntitiesUsingDom_(str)
    }else {
      return goog.string.unescapePureXmlEntities_(str)
    }
  }
  return str
};
goog.string.unescapeEntitiesUsingDom_ = function(str) {
  var seen = {"&amp;":"&", "&lt;":"<", "&gt;":">", "&quot;":'"'};
  var div = document.createElement("div");
  return str.replace(goog.string.HTML_ENTITY_PATTERN_, function(s, entity) {
    var value = seen[s];
    if(value) {
      return value
    }
    if(entity.charAt(0) == "#") {
      var n = Number("0" + entity.substr(1));
      if(!isNaN(n)) {
        value = String.fromCharCode(n)
      }
    }
    if(!value) {
      div.innerHTML = s + " ";
      value = div.firstChild.nodeValue.slice(0, -1)
    }
    return seen[s] = value
  })
};
goog.string.unescapePureXmlEntities_ = function(str) {
  return str.replace(/&([^;]+);/g, function(s, entity) {
    switch(entity) {
      case "amp":
        return"&";
      case "lt":
        return"<";
      case "gt":
        return">";
      case "quot":
        return'"';
      default:
        if(entity.charAt(0) == "#") {
          var n = Number("0" + entity.substr(1));
          if(!isNaN(n)) {
            return String.fromCharCode(n)
          }
        }
        return s
    }
  })
};
goog.string.HTML_ENTITY_PATTERN_ = /&([^;\s<&]+);?/g;
goog.string.whitespaceEscape = function(str, opt_xml) {
  return goog.string.newLineToBr(str.replace(/  /g, " &#160;"), opt_xml)
};
goog.string.stripQuotes = function(str, quoteChars) {
  var length = quoteChars.length;
  for(var i = 0;i < length;i++) {
    var quoteChar = length == 1 ? quoteChars : quoteChars.charAt(i);
    if(str.charAt(0) == quoteChar && str.charAt(str.length - 1) == quoteChar) {
      return str.substring(1, str.length - 1)
    }
  }
  return str
};
goog.string.truncate = function(str, chars, opt_protectEscapedCharacters) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(str.length > chars) {
    str = str.substring(0, chars - 3) + "..."
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.truncateMiddle = function(str, chars, opt_protectEscapedCharacters, opt_trailingChars) {
  if(opt_protectEscapedCharacters) {
    str = goog.string.unescapeEntities(str)
  }
  if(opt_trailingChars && str.length > chars) {
    if(opt_trailingChars > chars) {
      opt_trailingChars = chars
    }
    var endPoint = str.length - opt_trailingChars;
    var startPoint = chars - opt_trailingChars;
    str = str.substring(0, startPoint) + "..." + str.substring(endPoint)
  }else {
    if(str.length > chars) {
      var half = Math.floor(chars / 2);
      var endPos = str.length - half;
      half += chars % 2;
      str = str.substring(0, half) + "..." + str.substring(endPos)
    }
  }
  if(opt_protectEscapedCharacters) {
    str = goog.string.htmlEscape(str)
  }
  return str
};
goog.string.specialEscapeChars_ = {"\x00":"\\0", "\u0008":"\\b", "\u000c":"\\f", "\n":"\\n", "\r":"\\r", "\t":"\\t", "\x0B":"\\x0B", '"':'\\"', "\\":"\\\\"};
goog.string.jsEscapeCache_ = {"'":"\\'"};
goog.string.quote = function(s) {
  s = String(s);
  if(s.quote) {
    return s.quote()
  }else {
    var sb = ['"'];
    for(var i = 0;i < s.length;i++) {
      var ch = s.charAt(i);
      var cc = ch.charCodeAt(0);
      sb[i + 1] = goog.string.specialEscapeChars_[ch] || (cc > 31 && cc < 127 ? ch : goog.string.escapeChar(ch))
    }
    sb.push('"');
    return sb.join("")
  }
};
goog.string.escapeString = function(str) {
  var sb = [];
  for(var i = 0;i < str.length;i++) {
    sb[i] = goog.string.escapeChar(str.charAt(i))
  }
  return sb.join("")
};
goog.string.escapeChar = function(c) {
  if(c in goog.string.jsEscapeCache_) {
    return goog.string.jsEscapeCache_[c]
  }
  if(c in goog.string.specialEscapeChars_) {
    return goog.string.jsEscapeCache_[c] = goog.string.specialEscapeChars_[c]
  }
  var rv = c;
  var cc = c.charCodeAt(0);
  if(cc > 31 && cc < 127) {
    rv = c
  }else {
    if(cc < 256) {
      rv = "\\x";
      if(cc < 16 || cc > 256) {
        rv += "0"
      }
    }else {
      rv = "\\u";
      if(cc < 4096) {
        rv += "0"
      }
    }
    rv += cc.toString(16).toUpperCase()
  }
  return goog.string.jsEscapeCache_[c] = rv
};
goog.string.toMap = function(s) {
  var rv = {};
  for(var i = 0;i < s.length;i++) {
    rv[s.charAt(i)] = true
  }
  return rv
};
goog.string.contains = function(s, ss) {
  return s.indexOf(ss) != -1
};
goog.string.removeAt = function(s, index, stringLength) {
  var resultStr = s;
  if(index >= 0 && index < s.length && stringLength > 0) {
    resultStr = s.substr(0, index) + s.substr(index + stringLength, s.length - index - stringLength)
  }
  return resultStr
};
goog.string.remove = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "");
  return s.replace(re, "")
};
goog.string.removeAll = function(s, ss) {
  var re = new RegExp(goog.string.regExpEscape(ss), "g");
  return s.replace(re, "")
};
goog.string.regExpEscape = function(s) {
  return String(s).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, "\\$1").replace(/\x08/g, "\\x08")
};
goog.string.repeat = function(string, length) {
  return(new Array(length + 1)).join(string)
};
goog.string.padNumber = function(num, length, opt_precision) {
  var s = goog.isDef(opt_precision) ? num.toFixed(opt_precision) : String(num);
  var index = s.indexOf(".");
  if(index == -1) {
    index = s.length
  }
  return goog.string.repeat("0", Math.max(0, length - index)) + s
};
goog.string.makeSafe = function(obj) {
  return obj == null ? "" : String(obj)
};
goog.string.buildString = function(var_args) {
  return Array.prototype.join.call(arguments, "")
};
goog.string.getRandomString = function() {
  var x = 2147483648;
  return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ goog.now()).toString(36)
};
goog.string.compareVersions = function(version1, version2) {
  var order = 0;
  var v1Subs = goog.string.trim(String(version1)).split(".");
  var v2Subs = goog.string.trim(String(version2)).split(".");
  var subCount = Math.max(v1Subs.length, v2Subs.length);
  for(var subIdx = 0;order == 0 && subIdx < subCount;subIdx++) {
    var v1Sub = v1Subs[subIdx] || "";
    var v2Sub = v2Subs[subIdx] || "";
    var v1CompParser = new RegExp("(\\d*)(\\D*)", "g");
    var v2CompParser = new RegExp("(\\d*)(\\D*)", "g");
    do {
      var v1Comp = v1CompParser.exec(v1Sub) || ["", "", ""];
      var v2Comp = v2CompParser.exec(v2Sub) || ["", "", ""];
      if(v1Comp[0].length == 0 && v2Comp[0].length == 0) {
        break
      }
      var v1CompNum = v1Comp[1].length == 0 ? 0 : parseInt(v1Comp[1], 10);
      var v2CompNum = v2Comp[1].length == 0 ? 0 : parseInt(v2Comp[1], 10);
      order = goog.string.compareElements_(v1CompNum, v2CompNum) || goog.string.compareElements_(v1Comp[2].length == 0, v2Comp[2].length == 0) || goog.string.compareElements_(v1Comp[2], v2Comp[2])
    }while(order == 0)
  }
  return order
};
goog.string.compareElements_ = function(left, right) {
  if(left < right) {
    return-1
  }else {
    if(left > right) {
      return 1
    }
  }
  return 0
};
goog.string.HASHCODE_MAX_ = 4294967296;
goog.string.hashCode = function(str) {
  var result = 0;
  for(var i = 0;i < str.length;++i) {
    result = 31 * result + str.charCodeAt(i);
    result %= goog.string.HASHCODE_MAX_
  }
  return result
};
goog.string.uniqueStringCounter_ = Math.random() * 2147483648 | 0;
goog.string.createUniqueString = function() {
  return"goog_" + goog.string.uniqueStringCounter_++
};
goog.string.toNumber = function(str) {
  var num = Number(str);
  if(num == 0 && goog.string.isEmpty(str)) {
    return NaN
  }
  return num
};
goog.string.toCamelCaseCache_ = {};
goog.string.toCamelCase = function(str) {
  return goog.string.toCamelCaseCache_[str] || (goog.string.toCamelCaseCache_[str] = String(str).replace(/\-([a-z])/g, function(all, match) {
    return match.toUpperCase()
  }))
};
goog.string.toSelectorCaseCache_ = {};
goog.string.toSelectorCase = function(str) {
  return goog.string.toSelectorCaseCache_[str] || (goog.string.toSelectorCaseCache_[str] = String(str).replace(/([A-Z])/g, "-$1").toLowerCase())
};
goog.provide("goog.debug.Error");
goog.debug.Error = function(opt_msg) {
  this.stack = (new Error).stack || "";
  if(opt_msg) {
    this.message = String(opt_msg)
  }
};
goog.inherits(goog.debug.Error, Error);
goog.debug.Error.prototype.name = "CustomError";
goog.provide("goog.asserts");
goog.provide("goog.asserts.AssertionError");
goog.require("goog.debug.Error");
goog.require("goog.string");
goog.asserts.ENABLE_ASSERTS = goog.DEBUG;
goog.asserts.AssertionError = function(messagePattern, messageArgs) {
  messageArgs.unshift(messagePattern);
  goog.debug.Error.call(this, goog.string.subs.apply(null, messageArgs));
  messageArgs.shift();
  this.messagePattern = messagePattern
};
goog.inherits(goog.asserts.AssertionError, goog.debug.Error);
goog.asserts.AssertionError.prototype.name = "AssertionError";
goog.asserts.doAssertFailure_ = function(defaultMessage, defaultArgs, givenMessage, givenArgs) {
  var message = "Assertion failed";
  if(givenMessage) {
    message += ": " + givenMessage;
    var args = givenArgs
  }else {
    if(defaultMessage) {
      message += ": " + defaultMessage;
      args = defaultArgs
    }
  }
  throw new goog.asserts.AssertionError("" + message, args || []);
};
goog.asserts.assert = function(condition, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !condition) {
    goog.asserts.doAssertFailure_("", null, opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return condition
};
goog.asserts.fail = function(opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS) {
    throw new goog.asserts.AssertionError("Failure" + (opt_message ? ": " + opt_message : ""), Array.prototype.slice.call(arguments, 1));
  }
};
goog.asserts.assertNumber = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isNumber(value)) {
    goog.asserts.doAssertFailure_("Expected number but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertString = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isString(value)) {
    goog.asserts.doAssertFailure_("Expected string but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertFunction = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isFunction(value)) {
    goog.asserts.doAssertFailure_("Expected function but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertObject = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isObject(value)) {
    goog.asserts.doAssertFailure_("Expected object but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertArray = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isArray(value)) {
    goog.asserts.doAssertFailure_("Expected array but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertBoolean = function(value, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !goog.isBoolean(value)) {
    goog.asserts.doAssertFailure_("Expected boolean but got %s: %s.", [goog.typeOf(value), value], opt_message, Array.prototype.slice.call(arguments, 2))
  }
  return value
};
goog.asserts.assertInstanceof = function(value, type, opt_message, var_args) {
  if(goog.asserts.ENABLE_ASSERTS && !(value instanceof type)) {
    goog.asserts.doAssertFailure_("instanceof check failed.", null, opt_message, Array.prototype.slice.call(arguments, 3))
  }
};
goog.provide("goog.array");
goog.provide("goog.array.ArrayLike");
goog.require("goog.asserts");
goog.NATIVE_ARRAY_PROTOTYPES = true;
goog.array.ArrayLike;
goog.array.peek = function(array) {
  return array[array.length - 1]
};
goog.array.ARRAY_PROTOTYPE_ = Array.prototype;
goog.array.indexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.indexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.indexOf.call(arr, obj, opt_fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? 0 : opt_fromIndex < 0 ? Math.max(0, arr.length + opt_fromIndex) : opt_fromIndex;
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.indexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i < arr.length;i++) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.lastIndexOf = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.lastIndexOf ? function(arr, obj, opt_fromIndex) {
  goog.asserts.assert(arr.length != null);
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  return goog.array.ARRAY_PROTOTYPE_.lastIndexOf.call(arr, obj, fromIndex)
} : function(arr, obj, opt_fromIndex) {
  var fromIndex = opt_fromIndex == null ? arr.length - 1 : opt_fromIndex;
  if(fromIndex < 0) {
    fromIndex = Math.max(0, arr.length + fromIndex)
  }
  if(goog.isString(arr)) {
    if(!goog.isString(obj) || obj.length != 1) {
      return-1
    }
    return arr.lastIndexOf(obj, fromIndex)
  }
  for(var i = fromIndex;i >= 0;i--) {
    if(i in arr && arr[i] === obj) {
      return i
    }
  }
  return-1
};
goog.array.forEach = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.forEach ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.forEach.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.forEachRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;--i) {
    if(i in arr2) {
      f.call(opt_obj, arr2[i], i, arr)
    }
  }
};
goog.array.filter = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.filter ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.filter.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = [];
  var resLength = 0;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      var val = arr2[i];
      if(f.call(opt_obj, val, i, arr)) {
        res[resLength++] = val
      }
    }
  }
  return res
};
goog.array.map = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.map ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.map.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var res = new Array(l);
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2) {
      res[i] = f.call(opt_obj, arr2[i], i, arr)
    }
  }
  return res
};
goog.array.reduce = function(arr, f, val, opt_obj) {
  if(arr.reduce) {
    if(opt_obj) {
      return arr.reduce(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduce(f, val)
    }
  }
  var rval = val;
  goog.array.forEach(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.reduceRight = function(arr, f, val, opt_obj) {
  if(arr.reduceRight) {
    if(opt_obj) {
      return arr.reduceRight(goog.bind(f, opt_obj), val)
    }else {
      return arr.reduceRight(f, val)
    }
  }
  var rval = val;
  goog.array.forEachRight(arr, function(val, index) {
    rval = f.call(opt_obj, rval, val, index, arr)
  });
  return rval
};
goog.array.some = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.some ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.some.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return true
    }
  }
  return false
};
goog.array.every = goog.NATIVE_ARRAY_PROTOTYPES && goog.array.ARRAY_PROTOTYPE_.every ? function(arr, f, opt_obj) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.every.call(arr, f, opt_obj)
} : function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && !f.call(opt_obj, arr2[i], i, arr)) {
      return false
    }
  }
  return true
};
goog.array.find = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndex = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = 0;i < l;i++) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.findRight = function(arr, f, opt_obj) {
  var i = goog.array.findIndexRight(arr, f, opt_obj);
  return i < 0 ? null : goog.isString(arr) ? arr.charAt(i) : arr[i]
};
goog.array.findIndexRight = function(arr, f, opt_obj) {
  var l = arr.length;
  var arr2 = goog.isString(arr) ? arr.split("") : arr;
  for(var i = l - 1;i >= 0;i--) {
    if(i in arr2 && f.call(opt_obj, arr2[i], i, arr)) {
      return i
    }
  }
  return-1
};
goog.array.contains = function(arr, obj) {
  return goog.array.indexOf(arr, obj) >= 0
};
goog.array.isEmpty = function(arr) {
  return arr.length == 0
};
goog.array.clear = function(arr) {
  if(!goog.isArray(arr)) {
    for(var i = arr.length - 1;i >= 0;i--) {
      delete arr[i]
    }
  }
  arr.length = 0
};
goog.array.insert = function(arr, obj) {
  if(!goog.array.contains(arr, obj)) {
    arr.push(obj)
  }
};
goog.array.insertAt = function(arr, obj, opt_i) {
  goog.array.splice(arr, opt_i, 0, obj)
};
goog.array.insertArrayAt = function(arr, elementsToAdd, opt_i) {
  goog.partial(goog.array.splice, arr, opt_i, 0).apply(null, elementsToAdd)
};
goog.array.insertBefore = function(arr, obj, opt_obj2) {
  var i;
  if(arguments.length == 2 || (i = goog.array.indexOf(arr, opt_obj2)) < 0) {
    arr.push(obj)
  }else {
    goog.array.insertAt(arr, obj, i)
  }
};
goog.array.remove = function(arr, obj) {
  var i = goog.array.indexOf(arr, obj);
  var rv;
  if(rv = i >= 0) {
    goog.array.removeAt(arr, i)
  }
  return rv
};
goog.array.removeAt = function(arr, i) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.call(arr, i, 1).length == 1
};
goog.array.removeIf = function(arr, f, opt_obj) {
  var i = goog.array.findIndex(arr, f, opt_obj);
  if(i >= 0) {
    goog.array.removeAt(arr, i);
    return true
  }
  return false
};
goog.array.concat = function(var_args) {
  return goog.array.ARRAY_PROTOTYPE_.concat.apply(goog.array.ARRAY_PROTOTYPE_, arguments)
};
goog.array.clone = function(arr) {
  if(goog.isArray(arr)) {
    return goog.array.concat(arr)
  }else {
    var rv = [];
    for(var i = 0, len = arr.length;i < len;i++) {
      rv[i] = arr[i]
    }
    return rv
  }
};
goog.array.toArray = function(object) {
  if(goog.isArray(object)) {
    return goog.array.concat(object)
  }
  return goog.array.clone(object)
};
goog.array.extend = function(arr1, var_args) {
  for(var i = 1;i < arguments.length;i++) {
    var arr2 = arguments[i];
    var isArrayLike;
    if(goog.isArray(arr2) || (isArrayLike = goog.isArrayLike(arr2)) && arr2.hasOwnProperty("callee")) {
      arr1.push.apply(arr1, arr2)
    }else {
      if(isArrayLike) {
        var len1 = arr1.length;
        var len2 = arr2.length;
        for(var j = 0;j < len2;j++) {
          arr1[len1 + j] = arr2[j]
        }
      }else {
        arr1.push(arr2)
      }
    }
  }
};
goog.array.splice = function(arr, index, howMany, var_args) {
  goog.asserts.assert(arr.length != null);
  return goog.array.ARRAY_PROTOTYPE_.splice.apply(arr, goog.array.slice(arguments, 1))
};
goog.array.slice = function(arr, start, opt_end) {
  goog.asserts.assert(arr.length != null);
  if(arguments.length <= 2) {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start)
  }else {
    return goog.array.ARRAY_PROTOTYPE_.slice.call(arr, start, opt_end)
  }
};
goog.array.removeDuplicates = function(arr, opt_rv) {
  var returnArray = opt_rv || arr;
  var seen = {}, cursorInsert = 0, cursorRead = 0;
  while(cursorRead < arr.length) {
    var current = arr[cursorRead++];
    var key = goog.isObject(current) ? "o" + goog.getUid(current) : (typeof current).charAt(0) + current;
    if(!Object.prototype.hasOwnProperty.call(seen, key)) {
      seen[key] = true;
      returnArray[cursorInsert++] = current
    }
  }
  returnArray.length = cursorInsert
};
goog.array.binarySearch = function(arr, target, opt_compareFn) {
  return goog.array.binarySearch_(arr, opt_compareFn || goog.array.defaultCompare, false, target)
};
goog.array.binarySelect = function(arr, evaluator, opt_obj) {
  return goog.array.binarySearch_(arr, evaluator, true, undefined, opt_obj)
};
goog.array.binarySearch_ = function(arr, compareFn, isEvaluator, opt_target, opt_selfObj) {
  var left = 0;
  var right = arr.length;
  var found;
  while(left < right) {
    var middle = left + right >> 1;
    var compareResult;
    if(isEvaluator) {
      compareResult = compareFn.call(opt_selfObj, arr[middle], middle, arr)
    }else {
      compareResult = compareFn(opt_target, arr[middle])
    }
    if(compareResult > 0) {
      left = middle + 1
    }else {
      right = middle;
      found = !compareResult
    }
  }
  return found ? left : ~left
};
goog.array.sort = function(arr, opt_compareFn) {
  goog.asserts.assert(arr.length != null);
  goog.array.ARRAY_PROTOTYPE_.sort.call(arr, opt_compareFn || goog.array.defaultCompare)
};
goog.array.stableSort = function(arr, opt_compareFn) {
  for(var i = 0;i < arr.length;i++) {
    arr[i] = {index:i, value:arr[i]}
  }
  var valueCompareFn = opt_compareFn || goog.array.defaultCompare;
  function stableCompareFn(obj1, obj2) {
    return valueCompareFn(obj1.value, obj2.value) || obj1.index - obj2.index
  }
  goog.array.sort(arr, stableCompareFn);
  for(var i = 0;i < arr.length;i++) {
    arr[i] = arr[i].value
  }
};
goog.array.sortObjectsByKey = function(arr, key, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  goog.array.sort(arr, function(a, b) {
    return compare(a[key], b[key])
  })
};
goog.array.isSorted = function(arr, opt_compareFn, opt_strict) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  for(var i = 1;i < arr.length;i++) {
    var compareResult = compare(arr[i - 1], arr[i]);
    if(compareResult > 0 || compareResult == 0 && opt_strict) {
      return false
    }
  }
  return true
};
goog.array.equals = function(arr1, arr2, opt_equalsFn) {
  if(!goog.isArrayLike(arr1) || !goog.isArrayLike(arr2) || arr1.length != arr2.length) {
    return false
  }
  var l = arr1.length;
  var equalsFn = opt_equalsFn || goog.array.defaultCompareEquality;
  for(var i = 0;i < l;i++) {
    if(!equalsFn(arr1[i], arr2[i])) {
      return false
    }
  }
  return true
};
goog.array.compare = function(arr1, arr2, opt_equalsFn) {
  return goog.array.equals(arr1, arr2, opt_equalsFn)
};
goog.array.compare3 = function(arr1, arr2, opt_compareFn) {
  var compare = opt_compareFn || goog.array.defaultCompare;
  var l = Math.min(arr1.length, arr2.length);
  for(var i = 0;i < l;i++) {
    var result = compare(arr1[i], arr2[i]);
    if(result != 0) {
      return result
    }
  }
  return goog.array.defaultCompare(arr1.length, arr2.length)
};
goog.array.defaultCompare = function(a, b) {
  return a > b ? 1 : a < b ? -1 : 0
};
goog.array.defaultCompareEquality = function(a, b) {
  return a === b
};
goog.array.binaryInsert = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  if(index < 0) {
    goog.array.insertAt(array, value, -(index + 1));
    return true
  }
  return false
};
goog.array.binaryRemove = function(array, value, opt_compareFn) {
  var index = goog.array.binarySearch(array, value, opt_compareFn);
  return index >= 0 ? goog.array.removeAt(array, index) : false
};
goog.array.bucket = function(array, sorter) {
  var buckets = {};
  for(var i = 0;i < array.length;i++) {
    var value = array[i];
    var key = sorter(value, i, array);
    if(goog.isDef(key)) {
      var bucket = buckets[key] || (buckets[key] = []);
      bucket.push(value)
    }
  }
  return buckets
};
goog.array.repeat = function(value, n) {
  var array = [];
  for(var i = 0;i < n;i++) {
    array[i] = value
  }
  return array
};
goog.array.flatten = function(var_args) {
  var result = [];
  for(var i = 0;i < arguments.length;i++) {
    var element = arguments[i];
    if(goog.isArray(element)) {
      result.push.apply(result, goog.array.flatten.apply(null, element))
    }else {
      result.push(element)
    }
  }
  return result
};
goog.array.rotate = function(array, n) {
  goog.asserts.assert(array.length != null);
  if(array.length) {
    n %= array.length;
    if(n > 0) {
      goog.array.ARRAY_PROTOTYPE_.unshift.apply(array, array.splice(-n, n))
    }else {
      if(n < 0) {
        goog.array.ARRAY_PROTOTYPE_.push.apply(array, array.splice(0, -n))
      }
    }
  }
  return array
};
goog.array.zip = function(var_args) {
  if(!arguments.length) {
    return[]
  }
  var result = [];
  for(var i = 0;true;i++) {
    var value = [];
    for(var j = 0;j < arguments.length;j++) {
      var arr = arguments[j];
      if(i >= arr.length) {
        return result
      }
      value.push(arr[i])
    }
    result.push(value)
  }
};
goog.array.shuffle = function(arr, opt_randFn) {
  var randFn = opt_randFn || Math.random;
  for(var i = arr.length - 1;i > 0;i--) {
    var j = Math.floor(randFn() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp
  }
};
goog.provide("goog.object");
goog.object.forEach = function(obj, f, opt_obj) {
  for(var key in obj) {
    f.call(opt_obj, obj[key], key, obj)
  }
};
goog.object.filter = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      res[key] = obj[key]
    }
  }
  return res
};
goog.object.map = function(obj, f, opt_obj) {
  var res = {};
  for(var key in obj) {
    res[key] = f.call(opt_obj, obj[key], key, obj)
  }
  return res
};
goog.object.some = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(f.call(opt_obj, obj[key], key, obj)) {
      return true
    }
  }
  return false
};
goog.object.every = function(obj, f, opt_obj) {
  for(var key in obj) {
    if(!f.call(opt_obj, obj[key], key, obj)) {
      return false
    }
  }
  return true
};
goog.object.getCount = function(obj) {
  var rv = 0;
  for(var key in obj) {
    rv++
  }
  return rv
};
goog.object.getAnyKey = function(obj) {
  for(var key in obj) {
    return key
  }
};
goog.object.getAnyValue = function(obj) {
  for(var key in obj) {
    return obj[key]
  }
};
goog.object.contains = function(obj, val) {
  return goog.object.containsValue(obj, val)
};
goog.object.getValues = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = obj[key]
  }
  return res
};
goog.object.getKeys = function(obj) {
  var res = [];
  var i = 0;
  for(var key in obj) {
    res[i++] = key
  }
  return res
};
goog.object.getValueByKeys = function(obj, var_args) {
  var isArrayLike = goog.isArrayLike(var_args);
  var keys = isArrayLike ? var_args : arguments;
  for(var i = isArrayLike ? 0 : 1;i < keys.length;i++) {
    obj = obj[keys[i]];
    if(!goog.isDef(obj)) {
      break
    }
  }
  return obj
};
goog.object.containsKey = function(obj, key) {
  return key in obj
};
goog.object.containsValue = function(obj, val) {
  for(var key in obj) {
    if(obj[key] == val) {
      return true
    }
  }
  return false
};
goog.object.findKey = function(obj, f, opt_this) {
  for(var key in obj) {
    if(f.call(opt_this, obj[key], key, obj)) {
      return key
    }
  }
  return undefined
};
goog.object.findValue = function(obj, f, opt_this) {
  var key = goog.object.findKey(obj, f, opt_this);
  return key && obj[key]
};
goog.object.isEmpty = function(obj) {
  for(var key in obj) {
    return false
  }
  return true
};
goog.object.clear = function(obj) {
  for(var i in obj) {
    delete obj[i]
  }
};
goog.object.remove = function(obj, key) {
  var rv;
  if(rv = key in obj) {
    delete obj[key]
  }
  return rv
};
goog.object.add = function(obj, key, val) {
  if(key in obj) {
    throw Error('The object already contains the key "' + key + '"');
  }
  goog.object.set(obj, key, val)
};
goog.object.get = function(obj, key, opt_val) {
  if(key in obj) {
    return obj[key]
  }
  return opt_val
};
goog.object.set = function(obj, key, value) {
  obj[key] = value
};
goog.object.setIfUndefined = function(obj, key, value) {
  return key in obj ? obj[key] : obj[key] = value
};
goog.object.clone = function(obj) {
  var res = {};
  for(var key in obj) {
    res[key] = obj[key]
  }
  return res
};
goog.object.unsafeClone = function(obj) {
  var type = goog.typeOf(obj);
  if(type == "object" || type == "array") {
    if(obj.clone) {
      return obj.clone()
    }
    var clone = type == "array" ? [] : {};
    for(var key in obj) {
      clone[key] = goog.object.unsafeClone(obj[key])
    }
    return clone
  }
  return obj
};
goog.object.transpose = function(obj) {
  var transposed = {};
  for(var key in obj) {
    transposed[obj[key]] = key
  }
  return transposed
};
goog.object.PROTOTYPE_FIELDS_ = ["constructor", "hasOwnProperty", "isPrototypeOf", "propertyIsEnumerable", "toLocaleString", "toString", "valueOf"];
goog.object.extend = function(target, var_args) {
  var key, source;
  for(var i = 1;i < arguments.length;i++) {
    source = arguments[i];
    for(key in source) {
      target[key] = source[key]
    }
    for(var j = 0;j < goog.object.PROTOTYPE_FIELDS_.length;j++) {
      key = goog.object.PROTOTYPE_FIELDS_[j];
      if(Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key]
      }
    }
  }
};
goog.object.create = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.create.apply(null, arguments[0])
  }
  if(argLength % 2) {
    throw Error("Uneven number of arguments");
  }
  var rv = {};
  for(var i = 0;i < argLength;i += 2) {
    rv[arguments[i]] = arguments[i + 1]
  }
  return rv
};
goog.object.createSet = function(var_args) {
  var argLength = arguments.length;
  if(argLength == 1 && goog.isArray(arguments[0])) {
    return goog.object.createSet.apply(null, arguments[0])
  }
  var rv = {};
  for(var i = 0;i < argLength;i++) {
    rv[arguments[i]] = true
  }
  return rv
};
goog.provide("goog.string.format");
goog.require("goog.string");
goog.string.format = function(formatString, var_args) {
  var args = Array.prototype.slice.call(arguments);
  var template = args.shift();
  if(typeof template == "undefined") {
    throw Error("[goog.string.format] Template required");
  }
  var formatRe = /%([0\-\ \+]*)(\d+)?(\.(\d+))?([%sfdiu])/g;
  function replacerDemuxer(match, flags, width, dotp, precision, type, offset, wholeString) {
    if(type == "%") {
      return"%"
    }
    var value = args.shift();
    if(typeof value == "undefined") {
      throw Error("[goog.string.format] Not enough arguments");
    }
    arguments[0] = value;
    return goog.string.format.demuxes_[type].apply(null, arguments)
  }
  return template.replace(formatRe, replacerDemuxer)
};
goog.string.format.demuxes_ = {};
goog.string.format.demuxes_["s"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value;
  if(isNaN(width) || width == "" || replacement.length >= width) {
    return replacement
  }
  if(flags.indexOf("-", 0) > -1) {
    replacement = replacement + goog.string.repeat(" ", width - replacement.length)
  }else {
    replacement = goog.string.repeat(" ", width - replacement.length) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["f"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  var replacement = value.toString();
  if(!(isNaN(precision) || precision == "")) {
    replacement = value.toFixed(precision)
  }
  var sign;
  if(value < 0) {
    sign = "-"
  }else {
    if(flags.indexOf("+") >= 0) {
      sign = "+"
    }else {
      if(flags.indexOf(" ") >= 0) {
        sign = " "
      }else {
        sign = ""
      }
    }
  }
  if(value >= 0) {
    replacement = sign + replacement
  }
  if(isNaN(width) || replacement.length >= width) {
    return replacement
  }
  replacement = isNaN(precision) ? Math.abs(value).toString() : Math.abs(value).toFixed(precision);
  var padCount = width - replacement.length - sign.length;
  if(flags.indexOf("-", 0) >= 0) {
    replacement = sign + replacement + goog.string.repeat(" ", padCount)
  }else {
    var paddingChar = flags.indexOf("0", 0) >= 0 ? "0" : " ";
    replacement = sign + goog.string.repeat(paddingChar, padCount) + replacement
  }
  return replacement
};
goog.string.format.demuxes_["d"] = function(value, flags, width, dotp, precision, type, offset, wholeString) {
  return goog.string.format.demuxes_["f"](parseInt(value, 10), flags, width, dotp, 0, type, offset, wholeString)
};
goog.string.format.demuxes_["i"] = goog.string.format.demuxes_["d"];
goog.string.format.demuxes_["u"] = goog.string.format.demuxes_["d"];
goog.provide("goog.userAgent.jscript");
goog.require("goog.string");
goog.userAgent.jscript.ASSUME_NO_JSCRIPT = false;
goog.userAgent.jscript.init_ = function() {
  var hasScriptEngine = "ScriptEngine" in goog.global;
  goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ = hasScriptEngine && goog.global["ScriptEngine"]() == "JScript";
  goog.userAgent.jscript.DETECTED_VERSION_ = goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_ ? goog.global["ScriptEngineMajorVersion"]() + "." + goog.global["ScriptEngineMinorVersion"]() + "." + goog.global["ScriptEngineBuildVersion"]() : "0"
};
if(!goog.userAgent.jscript.ASSUME_NO_JSCRIPT) {
  goog.userAgent.jscript.init_()
}
goog.userAgent.jscript.HAS_JSCRIPT = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? false : goog.userAgent.jscript.DETECTED_HAS_JSCRIPT_;
goog.userAgent.jscript.VERSION = goog.userAgent.jscript.ASSUME_NO_JSCRIPT ? "0" : goog.userAgent.jscript.DETECTED_VERSION_;
goog.userAgent.jscript.isVersion = function(version) {
  return goog.string.compareVersions(goog.userAgent.jscript.VERSION, version) >= 0
};
goog.provide("goog.string.StringBuffer");
goog.require("goog.userAgent.jscript");
goog.string.StringBuffer = function(opt_a1, var_args) {
  this.buffer_ = goog.userAgent.jscript.HAS_JSCRIPT ? [] : "";
  if(opt_a1 != null) {
    this.append.apply(this, arguments)
  }
};
goog.string.StringBuffer.prototype.set = function(s) {
  this.clear();
  this.append(s)
};
if(goog.userAgent.jscript.HAS_JSCRIPT) {
  goog.string.StringBuffer.prototype.bufferLength_ = 0;
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    if(opt_a2 == null) {
      this.buffer_[this.bufferLength_++] = a1
    }else {
      this.buffer_.push.apply(this.buffer_, arguments);
      this.bufferLength_ = this.buffer_.length
    }
    return this
  }
}else {
  goog.string.StringBuffer.prototype.append = function(a1, opt_a2, var_args) {
    this.buffer_ += a1;
    if(opt_a2 != null) {
      for(var i = 1;i < arguments.length;i++) {
        this.buffer_ += arguments[i]
      }
    }
    return this
  }
}
goog.string.StringBuffer.prototype.clear = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    this.buffer_.length = 0;
    this.bufferLength_ = 0
  }else {
    this.buffer_ = ""
  }
};
goog.string.StringBuffer.prototype.getLength = function() {
  return this.toString().length
};
goog.string.StringBuffer.prototype.toString = function() {
  if(goog.userAgent.jscript.HAS_JSCRIPT) {
    var str = this.buffer_.join("");
    this.clear();
    if(str) {
      this.append(str)
    }
    return str
  }else {
    return this.buffer_
  }
};
goog.provide("cljs.core");
goog.require("goog.array");
goog.require("goog.object");
goog.require("goog.string.format");
goog.require("goog.string.StringBuffer");
goog.require("goog.string");
cljs.core._STAR_unchecked_if_STAR_ = false;
cljs.core._STAR_print_fn_STAR_ = function _STAR_print_fn_STAR_(_) {
  throw new Error("No *print-fn* fn set for evaluation environment");
};
cljs.core.truth_ = function truth_(x) {
  return x != null && x !== false
};
cljs.core.type_satisfies_ = function type_satisfies_(p, x) {
  var x__6067 = x == null ? null : x;
  if(p[goog.typeOf(x__6067)]) {
    return true
  }else {
    if(p["_"]) {
      return true
    }else {
      if("\ufdd0'else") {
        return false
      }else {
        return null
      }
    }
  }
};
cljs.core.is_proto_ = function is_proto_(x) {
  return x.constructor.prototype === x
};
cljs.core._STAR_main_cli_fn_STAR_ = null;
cljs.core.missing_protocol = function missing_protocol(proto, obj) {
  return Error(["No protocol method ", proto, " defined for type ", goog.typeOf(obj), ": ", obj].join(""))
};
cljs.core.aclone = function aclone(array_like) {
  return array_like.slice()
};
cljs.core.array = function array(var_args) {
  return Array.prototype.slice.call(arguments)
};
cljs.core.make_array = function() {
  var make_array = null;
  var make_array__1 = function(size) {
    return new Array(size)
  };
  var make_array__2 = function(type, size) {
    return make_array.call(null, size)
  };
  make_array = function(type, size) {
    switch(arguments.length) {
      case 1:
        return make_array__1.call(this, type);
      case 2:
        return make_array__2.call(this, type, size)
    }
    throw"Invalid arity: " + arguments.length;
  };
  make_array.cljs$lang$arity$1 = make_array__1;
  make_array.cljs$lang$arity$2 = make_array__2;
  return make_array
}();
cljs.core.aget = function() {
  var aget = null;
  var aget__2 = function(array, i) {
    return array[i]
  };
  var aget__3 = function() {
    var G__6068__delegate = function(array, i, idxs) {
      return cljs.core.apply.call(null, aget, aget.call(null, array, i), idxs)
    };
    var G__6068 = function(array, i, var_args) {
      var idxs = null;
      if(goog.isDef(var_args)) {
        idxs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6068__delegate.call(this, array, i, idxs)
    };
    G__6068.cljs$lang$maxFixedArity = 2;
    G__6068.cljs$lang$applyTo = function(arglist__6069) {
      var array = cljs.core.first(arglist__6069);
      var i = cljs.core.first(cljs.core.next(arglist__6069));
      var idxs = cljs.core.rest(cljs.core.next(arglist__6069));
      return G__6068__delegate(array, i, idxs)
    };
    G__6068.cljs$lang$arity$variadic = G__6068__delegate;
    return G__6068
  }();
  aget = function(array, i, var_args) {
    var idxs = var_args;
    switch(arguments.length) {
      case 2:
        return aget__2.call(this, array, i);
      default:
        return aget__3.cljs$lang$arity$variadic(array, i, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  aget.cljs$lang$maxFixedArity = 2;
  aget.cljs$lang$applyTo = aget__3.cljs$lang$applyTo;
  aget.cljs$lang$arity$2 = aget__2;
  aget.cljs$lang$arity$variadic = aget__3.cljs$lang$arity$variadic;
  return aget
}();
cljs.core.aset = function aset(array, i, val) {
  return array[i] = val
};
cljs.core.alength = function alength(array) {
  return array.length
};
cljs.core.into_array = function() {
  var into_array = null;
  var into_array__1 = function(aseq) {
    return into_array.call(null, null, aseq)
  };
  var into_array__2 = function(type, aseq) {
    return cljs.core.reduce.call(null, function(a, x) {
      a.push(x);
      return a
    }, [], aseq)
  };
  into_array = function(type, aseq) {
    switch(arguments.length) {
      case 1:
        return into_array__1.call(this, type);
      case 2:
        return into_array__2.call(this, type, aseq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  into_array.cljs$lang$arity$1 = into_array__1;
  into_array.cljs$lang$arity$2 = into_array__2;
  return into_array
}();
cljs.core.IFn = {};
cljs.core._invoke = function() {
  var _invoke = null;
  var _invoke__1 = function(this$) {
    if(function() {
      var and__3941__auto____6154 = this$;
      if(and__3941__auto____6154) {
        return this$.cljs$core$IFn$_invoke$arity$1
      }else {
        return and__3941__auto____6154
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$1(this$)
    }else {
      var x__2312__auto____6155 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6156 = cljs.core._invoke[goog.typeOf(x__2312__auto____6155)];
        if(or__3943__auto____6156) {
          return or__3943__auto____6156
        }else {
          var or__3943__auto____6157 = cljs.core._invoke["_"];
          if(or__3943__auto____6157) {
            return or__3943__auto____6157
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$)
    }
  };
  var _invoke__2 = function(this$, a) {
    if(function() {
      var and__3941__auto____6158 = this$;
      if(and__3941__auto____6158) {
        return this$.cljs$core$IFn$_invoke$arity$2
      }else {
        return and__3941__auto____6158
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$2(this$, a)
    }else {
      var x__2312__auto____6159 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6160 = cljs.core._invoke[goog.typeOf(x__2312__auto____6159)];
        if(or__3943__auto____6160) {
          return or__3943__auto____6160
        }else {
          var or__3943__auto____6161 = cljs.core._invoke["_"];
          if(or__3943__auto____6161) {
            return or__3943__auto____6161
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a)
    }
  };
  var _invoke__3 = function(this$, a, b) {
    if(function() {
      var and__3941__auto____6162 = this$;
      if(and__3941__auto____6162) {
        return this$.cljs$core$IFn$_invoke$arity$3
      }else {
        return and__3941__auto____6162
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$3(this$, a, b)
    }else {
      var x__2312__auto____6163 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6164 = cljs.core._invoke[goog.typeOf(x__2312__auto____6163)];
        if(or__3943__auto____6164) {
          return or__3943__auto____6164
        }else {
          var or__3943__auto____6165 = cljs.core._invoke["_"];
          if(or__3943__auto____6165) {
            return or__3943__auto____6165
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b)
    }
  };
  var _invoke__4 = function(this$, a, b, c) {
    if(function() {
      var and__3941__auto____6166 = this$;
      if(and__3941__auto____6166) {
        return this$.cljs$core$IFn$_invoke$arity$4
      }else {
        return and__3941__auto____6166
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$4(this$, a, b, c)
    }else {
      var x__2312__auto____6167 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6168 = cljs.core._invoke[goog.typeOf(x__2312__auto____6167)];
        if(or__3943__auto____6168) {
          return or__3943__auto____6168
        }else {
          var or__3943__auto____6169 = cljs.core._invoke["_"];
          if(or__3943__auto____6169) {
            return or__3943__auto____6169
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c)
    }
  };
  var _invoke__5 = function(this$, a, b, c, d) {
    if(function() {
      var and__3941__auto____6170 = this$;
      if(and__3941__auto____6170) {
        return this$.cljs$core$IFn$_invoke$arity$5
      }else {
        return and__3941__auto____6170
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$5(this$, a, b, c, d)
    }else {
      var x__2312__auto____6171 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6172 = cljs.core._invoke[goog.typeOf(x__2312__auto____6171)];
        if(or__3943__auto____6172) {
          return or__3943__auto____6172
        }else {
          var or__3943__auto____6173 = cljs.core._invoke["_"];
          if(or__3943__auto____6173) {
            return or__3943__auto____6173
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d)
    }
  };
  var _invoke__6 = function(this$, a, b, c, d, e) {
    if(function() {
      var and__3941__auto____6174 = this$;
      if(and__3941__auto____6174) {
        return this$.cljs$core$IFn$_invoke$arity$6
      }else {
        return and__3941__auto____6174
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$6(this$, a, b, c, d, e)
    }else {
      var x__2312__auto____6175 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6176 = cljs.core._invoke[goog.typeOf(x__2312__auto____6175)];
        if(or__3943__auto____6176) {
          return or__3943__auto____6176
        }else {
          var or__3943__auto____6177 = cljs.core._invoke["_"];
          if(or__3943__auto____6177) {
            return or__3943__auto____6177
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e)
    }
  };
  var _invoke__7 = function(this$, a, b, c, d, e, f) {
    if(function() {
      var and__3941__auto____6178 = this$;
      if(and__3941__auto____6178) {
        return this$.cljs$core$IFn$_invoke$arity$7
      }else {
        return and__3941__auto____6178
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$7(this$, a, b, c, d, e, f)
    }else {
      var x__2312__auto____6179 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6180 = cljs.core._invoke[goog.typeOf(x__2312__auto____6179)];
        if(or__3943__auto____6180) {
          return or__3943__auto____6180
        }else {
          var or__3943__auto____6181 = cljs.core._invoke["_"];
          if(or__3943__auto____6181) {
            return or__3943__auto____6181
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f)
    }
  };
  var _invoke__8 = function(this$, a, b, c, d, e, f, g) {
    if(function() {
      var and__3941__auto____6182 = this$;
      if(and__3941__auto____6182) {
        return this$.cljs$core$IFn$_invoke$arity$8
      }else {
        return and__3941__auto____6182
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$8(this$, a, b, c, d, e, f, g)
    }else {
      var x__2312__auto____6183 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6184 = cljs.core._invoke[goog.typeOf(x__2312__auto____6183)];
        if(or__3943__auto____6184) {
          return or__3943__auto____6184
        }else {
          var or__3943__auto____6185 = cljs.core._invoke["_"];
          if(or__3943__auto____6185) {
            return or__3943__auto____6185
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g)
    }
  };
  var _invoke__9 = function(this$, a, b, c, d, e, f, g, h) {
    if(function() {
      var and__3941__auto____6186 = this$;
      if(and__3941__auto____6186) {
        return this$.cljs$core$IFn$_invoke$arity$9
      }else {
        return and__3941__auto____6186
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$9(this$, a, b, c, d, e, f, g, h)
    }else {
      var x__2312__auto____6187 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6188 = cljs.core._invoke[goog.typeOf(x__2312__auto____6187)];
        if(or__3943__auto____6188) {
          return or__3943__auto____6188
        }else {
          var or__3943__auto____6189 = cljs.core._invoke["_"];
          if(or__3943__auto____6189) {
            return or__3943__auto____6189
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h)
    }
  };
  var _invoke__10 = function(this$, a, b, c, d, e, f, g, h, i) {
    if(function() {
      var and__3941__auto____6190 = this$;
      if(and__3941__auto____6190) {
        return this$.cljs$core$IFn$_invoke$arity$10
      }else {
        return and__3941__auto____6190
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$10(this$, a, b, c, d, e, f, g, h, i)
    }else {
      var x__2312__auto____6191 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6192 = cljs.core._invoke[goog.typeOf(x__2312__auto____6191)];
        if(or__3943__auto____6192) {
          return or__3943__auto____6192
        }else {
          var or__3943__auto____6193 = cljs.core._invoke["_"];
          if(or__3943__auto____6193) {
            return or__3943__auto____6193
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i)
    }
  };
  var _invoke__11 = function(this$, a, b, c, d, e, f, g, h, i, j) {
    if(function() {
      var and__3941__auto____6194 = this$;
      if(and__3941__auto____6194) {
        return this$.cljs$core$IFn$_invoke$arity$11
      }else {
        return and__3941__auto____6194
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$11(this$, a, b, c, d, e, f, g, h, i, j)
    }else {
      var x__2312__auto____6195 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6196 = cljs.core._invoke[goog.typeOf(x__2312__auto____6195)];
        if(or__3943__auto____6196) {
          return or__3943__auto____6196
        }else {
          var or__3943__auto____6197 = cljs.core._invoke["_"];
          if(or__3943__auto____6197) {
            return or__3943__auto____6197
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j)
    }
  };
  var _invoke__12 = function(this$, a, b, c, d, e, f, g, h, i, j, k) {
    if(function() {
      var and__3941__auto____6198 = this$;
      if(and__3941__auto____6198) {
        return this$.cljs$core$IFn$_invoke$arity$12
      }else {
        return and__3941__auto____6198
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$12(this$, a, b, c, d, e, f, g, h, i, j, k)
    }else {
      var x__2312__auto____6199 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6200 = cljs.core._invoke[goog.typeOf(x__2312__auto____6199)];
        if(or__3943__auto____6200) {
          return or__3943__auto____6200
        }else {
          var or__3943__auto____6201 = cljs.core._invoke["_"];
          if(or__3943__auto____6201) {
            return or__3943__auto____6201
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k)
    }
  };
  var _invoke__13 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l) {
    if(function() {
      var and__3941__auto____6202 = this$;
      if(and__3941__auto____6202) {
        return this$.cljs$core$IFn$_invoke$arity$13
      }else {
        return and__3941__auto____6202
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$13(this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }else {
      var x__2312__auto____6203 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6204 = cljs.core._invoke[goog.typeOf(x__2312__auto____6203)];
        if(or__3943__auto____6204) {
          return or__3943__auto____6204
        }else {
          var or__3943__auto____6205 = cljs.core._invoke["_"];
          if(or__3943__auto____6205) {
            return or__3943__auto____6205
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l)
    }
  };
  var _invoke__14 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m) {
    if(function() {
      var and__3941__auto____6206 = this$;
      if(and__3941__auto____6206) {
        return this$.cljs$core$IFn$_invoke$arity$14
      }else {
        return and__3941__auto____6206
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$14(this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }else {
      var x__2312__auto____6207 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6208 = cljs.core._invoke[goog.typeOf(x__2312__auto____6207)];
        if(or__3943__auto____6208) {
          return or__3943__auto____6208
        }else {
          var or__3943__auto____6209 = cljs.core._invoke["_"];
          if(or__3943__auto____6209) {
            return or__3943__auto____6209
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m)
    }
  };
  var _invoke__15 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n) {
    if(function() {
      var and__3941__auto____6210 = this$;
      if(and__3941__auto____6210) {
        return this$.cljs$core$IFn$_invoke$arity$15
      }else {
        return and__3941__auto____6210
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$15(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }else {
      var x__2312__auto____6211 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6212 = cljs.core._invoke[goog.typeOf(x__2312__auto____6211)];
        if(or__3943__auto____6212) {
          return or__3943__auto____6212
        }else {
          var or__3943__auto____6213 = cljs.core._invoke["_"];
          if(or__3943__auto____6213) {
            return or__3943__auto____6213
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n)
    }
  };
  var _invoke__16 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o) {
    if(function() {
      var and__3941__auto____6214 = this$;
      if(and__3941__auto____6214) {
        return this$.cljs$core$IFn$_invoke$arity$16
      }else {
        return and__3941__auto____6214
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$16(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }else {
      var x__2312__auto____6215 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6216 = cljs.core._invoke[goog.typeOf(x__2312__auto____6215)];
        if(or__3943__auto____6216) {
          return or__3943__auto____6216
        }else {
          var or__3943__auto____6217 = cljs.core._invoke["_"];
          if(or__3943__auto____6217) {
            return or__3943__auto____6217
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
    }
  };
  var _invoke__17 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p) {
    if(function() {
      var and__3941__auto____6218 = this$;
      if(and__3941__auto____6218) {
        return this$.cljs$core$IFn$_invoke$arity$17
      }else {
        return and__3941__auto____6218
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$17(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }else {
      var x__2312__auto____6219 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6220 = cljs.core._invoke[goog.typeOf(x__2312__auto____6219)];
        if(or__3943__auto____6220) {
          return or__3943__auto____6220
        }else {
          var or__3943__auto____6221 = cljs.core._invoke["_"];
          if(or__3943__auto____6221) {
            return or__3943__auto____6221
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p)
    }
  };
  var _invoke__18 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q) {
    if(function() {
      var and__3941__auto____6222 = this$;
      if(and__3941__auto____6222) {
        return this$.cljs$core$IFn$_invoke$arity$18
      }else {
        return and__3941__auto____6222
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$18(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }else {
      var x__2312__auto____6223 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6224 = cljs.core._invoke[goog.typeOf(x__2312__auto____6223)];
        if(or__3943__auto____6224) {
          return or__3943__auto____6224
        }else {
          var or__3943__auto____6225 = cljs.core._invoke["_"];
          if(or__3943__auto____6225) {
            return or__3943__auto____6225
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q)
    }
  };
  var _invoke__19 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s) {
    if(function() {
      var and__3941__auto____6226 = this$;
      if(and__3941__auto____6226) {
        return this$.cljs$core$IFn$_invoke$arity$19
      }else {
        return and__3941__auto____6226
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$19(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }else {
      var x__2312__auto____6227 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6228 = cljs.core._invoke[goog.typeOf(x__2312__auto____6227)];
        if(or__3943__auto____6228) {
          return or__3943__auto____6228
        }else {
          var or__3943__auto____6229 = cljs.core._invoke["_"];
          if(or__3943__auto____6229) {
            return or__3943__auto____6229
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s)
    }
  };
  var _invoke__20 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t) {
    if(function() {
      var and__3941__auto____6230 = this$;
      if(and__3941__auto____6230) {
        return this$.cljs$core$IFn$_invoke$arity$20
      }else {
        return and__3941__auto____6230
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$20(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }else {
      var x__2312__auto____6231 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6232 = cljs.core._invoke[goog.typeOf(x__2312__auto____6231)];
        if(or__3943__auto____6232) {
          return or__3943__auto____6232
        }else {
          var or__3943__auto____6233 = cljs.core._invoke["_"];
          if(or__3943__auto____6233) {
            return or__3943__auto____6233
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t)
    }
  };
  var _invoke__21 = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    if(function() {
      var and__3941__auto____6234 = this$;
      if(and__3941__auto____6234) {
        return this$.cljs$core$IFn$_invoke$arity$21
      }else {
        return and__3941__auto____6234
      }
    }()) {
      return this$.cljs$core$IFn$_invoke$arity$21(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }else {
      var x__2312__auto____6235 = this$ == null ? null : this$;
      return function() {
        var or__3943__auto____6236 = cljs.core._invoke[goog.typeOf(x__2312__auto____6235)];
        if(or__3943__auto____6236) {
          return or__3943__auto____6236
        }else {
          var or__3943__auto____6237 = cljs.core._invoke["_"];
          if(or__3943__auto____6237) {
            return or__3943__auto____6237
          }else {
            throw cljs.core.missing_protocol.call(null, "IFn.-invoke", this$);
          }
        }
      }().call(null, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
  };
  _invoke = function(this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest) {
    switch(arguments.length) {
      case 1:
        return _invoke__1.call(this, this$);
      case 2:
        return _invoke__2.call(this, this$, a);
      case 3:
        return _invoke__3.call(this, this$, a, b);
      case 4:
        return _invoke__4.call(this, this$, a, b, c);
      case 5:
        return _invoke__5.call(this, this$, a, b, c, d);
      case 6:
        return _invoke__6.call(this, this$, a, b, c, d, e);
      case 7:
        return _invoke__7.call(this, this$, a, b, c, d, e, f);
      case 8:
        return _invoke__8.call(this, this$, a, b, c, d, e, f, g);
      case 9:
        return _invoke__9.call(this, this$, a, b, c, d, e, f, g, h);
      case 10:
        return _invoke__10.call(this, this$, a, b, c, d, e, f, g, h, i);
      case 11:
        return _invoke__11.call(this, this$, a, b, c, d, e, f, g, h, i, j);
      case 12:
        return _invoke__12.call(this, this$, a, b, c, d, e, f, g, h, i, j, k);
      case 13:
        return _invoke__13.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l);
      case 14:
        return _invoke__14.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m);
      case 15:
        return _invoke__15.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n);
      case 16:
        return _invoke__16.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o);
      case 17:
        return _invoke__17.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p);
      case 18:
        return _invoke__18.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q);
      case 19:
        return _invoke__19.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s);
      case 20:
        return _invoke__20.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t);
      case 21:
        return _invoke__21.call(this, this$, a, b, c, d, e, f, g, h, i, j, k, l, m, n, o, p, q, s, t, rest)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _invoke.cljs$lang$arity$1 = _invoke__1;
  _invoke.cljs$lang$arity$2 = _invoke__2;
  _invoke.cljs$lang$arity$3 = _invoke__3;
  _invoke.cljs$lang$arity$4 = _invoke__4;
  _invoke.cljs$lang$arity$5 = _invoke__5;
  _invoke.cljs$lang$arity$6 = _invoke__6;
  _invoke.cljs$lang$arity$7 = _invoke__7;
  _invoke.cljs$lang$arity$8 = _invoke__8;
  _invoke.cljs$lang$arity$9 = _invoke__9;
  _invoke.cljs$lang$arity$10 = _invoke__10;
  _invoke.cljs$lang$arity$11 = _invoke__11;
  _invoke.cljs$lang$arity$12 = _invoke__12;
  _invoke.cljs$lang$arity$13 = _invoke__13;
  _invoke.cljs$lang$arity$14 = _invoke__14;
  _invoke.cljs$lang$arity$15 = _invoke__15;
  _invoke.cljs$lang$arity$16 = _invoke__16;
  _invoke.cljs$lang$arity$17 = _invoke__17;
  _invoke.cljs$lang$arity$18 = _invoke__18;
  _invoke.cljs$lang$arity$19 = _invoke__19;
  _invoke.cljs$lang$arity$20 = _invoke__20;
  _invoke.cljs$lang$arity$21 = _invoke__21;
  return _invoke
}();
cljs.core.ICounted = {};
cljs.core._count = function _count(coll) {
  if(function() {
    var and__3941__auto____6242 = coll;
    if(and__3941__auto____6242) {
      return coll.cljs$core$ICounted$_count$arity$1
    }else {
      return and__3941__auto____6242
    }
  }()) {
    return coll.cljs$core$ICounted$_count$arity$1(coll)
  }else {
    var x__2312__auto____6243 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6244 = cljs.core._count[goog.typeOf(x__2312__auto____6243)];
      if(or__3943__auto____6244) {
        return or__3943__auto____6244
      }else {
        var or__3943__auto____6245 = cljs.core._count["_"];
        if(or__3943__auto____6245) {
          return or__3943__auto____6245
        }else {
          throw cljs.core.missing_protocol.call(null, "ICounted.-count", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IEmptyableCollection = {};
cljs.core._empty = function _empty(coll) {
  if(function() {
    var and__3941__auto____6250 = coll;
    if(and__3941__auto____6250) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1
    }else {
      return and__3941__auto____6250
    }
  }()) {
    return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
  }else {
    var x__2312__auto____6251 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6252 = cljs.core._empty[goog.typeOf(x__2312__auto____6251)];
      if(or__3943__auto____6252) {
        return or__3943__auto____6252
      }else {
        var or__3943__auto____6253 = cljs.core._empty["_"];
        if(or__3943__auto____6253) {
          return or__3943__auto____6253
        }else {
          throw cljs.core.missing_protocol.call(null, "IEmptyableCollection.-empty", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ICollection = {};
cljs.core._conj = function _conj(coll, o) {
  if(function() {
    var and__3941__auto____6258 = coll;
    if(and__3941__auto____6258) {
      return coll.cljs$core$ICollection$_conj$arity$2
    }else {
      return and__3941__auto____6258
    }
  }()) {
    return coll.cljs$core$ICollection$_conj$arity$2(coll, o)
  }else {
    var x__2312__auto____6259 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6260 = cljs.core._conj[goog.typeOf(x__2312__auto____6259)];
      if(or__3943__auto____6260) {
        return or__3943__auto____6260
      }else {
        var or__3943__auto____6261 = cljs.core._conj["_"];
        if(or__3943__auto____6261) {
          return or__3943__auto____6261
        }else {
          throw cljs.core.missing_protocol.call(null, "ICollection.-conj", coll);
        }
      }
    }().call(null, coll, o)
  }
};
cljs.core.IIndexed = {};
cljs.core._nth = function() {
  var _nth = null;
  var _nth__2 = function(coll, n) {
    if(function() {
      var and__3941__auto____6270 = coll;
      if(and__3941__auto____6270) {
        return coll.cljs$core$IIndexed$_nth$arity$2
      }else {
        return and__3941__auto____6270
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
    }else {
      var x__2312__auto____6271 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6272 = cljs.core._nth[goog.typeOf(x__2312__auto____6271)];
        if(or__3943__auto____6272) {
          return or__3943__auto____6272
        }else {
          var or__3943__auto____6273 = cljs.core._nth["_"];
          if(or__3943__auto____6273) {
            return or__3943__auto____6273
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n)
    }
  };
  var _nth__3 = function(coll, n, not_found) {
    if(function() {
      var and__3941__auto____6274 = coll;
      if(and__3941__auto____6274) {
        return coll.cljs$core$IIndexed$_nth$arity$3
      }else {
        return and__3941__auto____6274
      }
    }()) {
      return coll.cljs$core$IIndexed$_nth$arity$3(coll, n, not_found)
    }else {
      var x__2312__auto____6275 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6276 = cljs.core._nth[goog.typeOf(x__2312__auto____6275)];
        if(or__3943__auto____6276) {
          return or__3943__auto____6276
        }else {
          var or__3943__auto____6277 = cljs.core._nth["_"];
          if(or__3943__auto____6277) {
            return or__3943__auto____6277
          }else {
            throw cljs.core.missing_protocol.call(null, "IIndexed.-nth", coll);
          }
        }
      }().call(null, coll, n, not_found)
    }
  };
  _nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return _nth__2.call(this, coll, n);
      case 3:
        return _nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _nth.cljs$lang$arity$2 = _nth__2;
  _nth.cljs$lang$arity$3 = _nth__3;
  return _nth
}();
cljs.core.ASeq = {};
cljs.core.ISeq = {};
cljs.core._first = function _first(coll) {
  if(function() {
    var and__3941__auto____6282 = coll;
    if(and__3941__auto____6282) {
      return coll.cljs$core$ISeq$_first$arity$1
    }else {
      return and__3941__auto____6282
    }
  }()) {
    return coll.cljs$core$ISeq$_first$arity$1(coll)
  }else {
    var x__2312__auto____6283 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6284 = cljs.core._first[goog.typeOf(x__2312__auto____6283)];
      if(or__3943__auto____6284) {
        return or__3943__auto____6284
      }else {
        var or__3943__auto____6285 = cljs.core._first["_"];
        if(or__3943__auto____6285) {
          return or__3943__auto____6285
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._rest = function _rest(coll) {
  if(function() {
    var and__3941__auto____6290 = coll;
    if(and__3941__auto____6290) {
      return coll.cljs$core$ISeq$_rest$arity$1
    }else {
      return and__3941__auto____6290
    }
  }()) {
    return coll.cljs$core$ISeq$_rest$arity$1(coll)
  }else {
    var x__2312__auto____6291 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6292 = cljs.core._rest[goog.typeOf(x__2312__auto____6291)];
      if(or__3943__auto____6292) {
        return or__3943__auto____6292
      }else {
        var or__3943__auto____6293 = cljs.core._rest["_"];
        if(or__3943__auto____6293) {
          return or__3943__auto____6293
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeq.-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.INext = {};
cljs.core._next = function _next(coll) {
  if(function() {
    var and__3941__auto____6298 = coll;
    if(and__3941__auto____6298) {
      return coll.cljs$core$INext$_next$arity$1
    }else {
      return and__3941__auto____6298
    }
  }()) {
    return coll.cljs$core$INext$_next$arity$1(coll)
  }else {
    var x__2312__auto____6299 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6300 = cljs.core._next[goog.typeOf(x__2312__auto____6299)];
      if(or__3943__auto____6300) {
        return or__3943__auto____6300
      }else {
        var or__3943__auto____6301 = cljs.core._next["_"];
        if(or__3943__auto____6301) {
          return or__3943__auto____6301
        }else {
          throw cljs.core.missing_protocol.call(null, "INext.-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ILookup = {};
cljs.core._lookup = function() {
  var _lookup = null;
  var _lookup__2 = function(o, k) {
    if(function() {
      var and__3941__auto____6310 = o;
      if(and__3941__auto____6310) {
        return o.cljs$core$ILookup$_lookup$arity$2
      }else {
        return and__3941__auto____6310
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$2(o, k)
    }else {
      var x__2312__auto____6311 = o == null ? null : o;
      return function() {
        var or__3943__auto____6312 = cljs.core._lookup[goog.typeOf(x__2312__auto____6311)];
        if(or__3943__auto____6312) {
          return or__3943__auto____6312
        }else {
          var or__3943__auto____6313 = cljs.core._lookup["_"];
          if(or__3943__auto____6313) {
            return or__3943__auto____6313
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k)
    }
  };
  var _lookup__3 = function(o, k, not_found) {
    if(function() {
      var and__3941__auto____6314 = o;
      if(and__3941__auto____6314) {
        return o.cljs$core$ILookup$_lookup$arity$3
      }else {
        return and__3941__auto____6314
      }
    }()) {
      return o.cljs$core$ILookup$_lookup$arity$3(o, k, not_found)
    }else {
      var x__2312__auto____6315 = o == null ? null : o;
      return function() {
        var or__3943__auto____6316 = cljs.core._lookup[goog.typeOf(x__2312__auto____6315)];
        if(or__3943__auto____6316) {
          return or__3943__auto____6316
        }else {
          var or__3943__auto____6317 = cljs.core._lookup["_"];
          if(or__3943__auto____6317) {
            return or__3943__auto____6317
          }else {
            throw cljs.core.missing_protocol.call(null, "ILookup.-lookup", o);
          }
        }
      }().call(null, o, k, not_found)
    }
  };
  _lookup = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return _lookup__2.call(this, o, k);
      case 3:
        return _lookup__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _lookup.cljs$lang$arity$2 = _lookup__2;
  _lookup.cljs$lang$arity$3 = _lookup__3;
  return _lookup
}();
cljs.core.IAssociative = {};
cljs.core._contains_key_QMARK_ = function _contains_key_QMARK_(coll, k) {
  if(function() {
    var and__3941__auto____6322 = coll;
    if(and__3941__auto____6322) {
      return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2
    }else {
      return and__3941__auto____6322
    }
  }()) {
    return coll.cljs$core$IAssociative$_contains_key_QMARK_$arity$2(coll, k)
  }else {
    var x__2312__auto____6323 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6324 = cljs.core._contains_key_QMARK_[goog.typeOf(x__2312__auto____6323)];
      if(or__3943__auto____6324) {
        return or__3943__auto____6324
      }else {
        var or__3943__auto____6325 = cljs.core._contains_key_QMARK_["_"];
        if(or__3943__auto____6325) {
          return or__3943__auto____6325
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-contains-key?", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core._assoc = function _assoc(coll, k, v) {
  if(function() {
    var and__3941__auto____6330 = coll;
    if(and__3941__auto____6330) {
      return coll.cljs$core$IAssociative$_assoc$arity$3
    }else {
      return and__3941__auto____6330
    }
  }()) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, k, v)
  }else {
    var x__2312__auto____6331 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6332 = cljs.core._assoc[goog.typeOf(x__2312__auto____6331)];
      if(or__3943__auto____6332) {
        return or__3943__auto____6332
      }else {
        var or__3943__auto____6333 = cljs.core._assoc["_"];
        if(or__3943__auto____6333) {
          return or__3943__auto____6333
        }else {
          throw cljs.core.missing_protocol.call(null, "IAssociative.-assoc", coll);
        }
      }
    }().call(null, coll, k, v)
  }
};
cljs.core.IMap = {};
cljs.core._dissoc = function _dissoc(coll, k) {
  if(function() {
    var and__3941__auto____6338 = coll;
    if(and__3941__auto____6338) {
      return coll.cljs$core$IMap$_dissoc$arity$2
    }else {
      return and__3941__auto____6338
    }
  }()) {
    return coll.cljs$core$IMap$_dissoc$arity$2(coll, k)
  }else {
    var x__2312__auto____6339 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6340 = cljs.core._dissoc[goog.typeOf(x__2312__auto____6339)];
      if(or__3943__auto____6340) {
        return or__3943__auto____6340
      }else {
        var or__3943__auto____6341 = cljs.core._dissoc["_"];
        if(or__3943__auto____6341) {
          return or__3943__auto____6341
        }else {
          throw cljs.core.missing_protocol.call(null, "IMap.-dissoc", coll);
        }
      }
    }().call(null, coll, k)
  }
};
cljs.core.IMapEntry = {};
cljs.core._key = function _key(coll) {
  if(function() {
    var and__3941__auto____6346 = coll;
    if(and__3941__auto____6346) {
      return coll.cljs$core$IMapEntry$_key$arity$1
    }else {
      return and__3941__auto____6346
    }
  }()) {
    return coll.cljs$core$IMapEntry$_key$arity$1(coll)
  }else {
    var x__2312__auto____6347 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6348 = cljs.core._key[goog.typeOf(x__2312__auto____6347)];
      if(or__3943__auto____6348) {
        return or__3943__auto____6348
      }else {
        var or__3943__auto____6349 = cljs.core._key["_"];
        if(or__3943__auto____6349) {
          return or__3943__auto____6349
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-key", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._val = function _val(coll) {
  if(function() {
    var and__3941__auto____6354 = coll;
    if(and__3941__auto____6354) {
      return coll.cljs$core$IMapEntry$_val$arity$1
    }else {
      return and__3941__auto____6354
    }
  }()) {
    return coll.cljs$core$IMapEntry$_val$arity$1(coll)
  }else {
    var x__2312__auto____6355 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6356 = cljs.core._val[goog.typeOf(x__2312__auto____6355)];
      if(or__3943__auto____6356) {
        return or__3943__auto____6356
      }else {
        var or__3943__auto____6357 = cljs.core._val["_"];
        if(or__3943__auto____6357) {
          return or__3943__auto____6357
        }else {
          throw cljs.core.missing_protocol.call(null, "IMapEntry.-val", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISet = {};
cljs.core._disjoin = function _disjoin(coll, v) {
  if(function() {
    var and__3941__auto____6362 = coll;
    if(and__3941__auto____6362) {
      return coll.cljs$core$ISet$_disjoin$arity$2
    }else {
      return and__3941__auto____6362
    }
  }()) {
    return coll.cljs$core$ISet$_disjoin$arity$2(coll, v)
  }else {
    var x__2312__auto____6363 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6364 = cljs.core._disjoin[goog.typeOf(x__2312__auto____6363)];
      if(or__3943__auto____6364) {
        return or__3943__auto____6364
      }else {
        var or__3943__auto____6365 = cljs.core._disjoin["_"];
        if(or__3943__auto____6365) {
          return or__3943__auto____6365
        }else {
          throw cljs.core.missing_protocol.call(null, "ISet.-disjoin", coll);
        }
      }
    }().call(null, coll, v)
  }
};
cljs.core.IStack = {};
cljs.core._peek = function _peek(coll) {
  if(function() {
    var and__3941__auto____6370 = coll;
    if(and__3941__auto____6370) {
      return coll.cljs$core$IStack$_peek$arity$1
    }else {
      return and__3941__auto____6370
    }
  }()) {
    return coll.cljs$core$IStack$_peek$arity$1(coll)
  }else {
    var x__2312__auto____6371 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6372 = cljs.core._peek[goog.typeOf(x__2312__auto____6371)];
      if(or__3943__auto____6372) {
        return or__3943__auto____6372
      }else {
        var or__3943__auto____6373 = cljs.core._peek["_"];
        if(or__3943__auto____6373) {
          return or__3943__auto____6373
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-peek", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._pop = function _pop(coll) {
  if(function() {
    var and__3941__auto____6378 = coll;
    if(and__3941__auto____6378) {
      return coll.cljs$core$IStack$_pop$arity$1
    }else {
      return and__3941__auto____6378
    }
  }()) {
    return coll.cljs$core$IStack$_pop$arity$1(coll)
  }else {
    var x__2312__auto____6379 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6380 = cljs.core._pop[goog.typeOf(x__2312__auto____6379)];
      if(or__3943__auto____6380) {
        return or__3943__auto____6380
      }else {
        var or__3943__auto____6381 = cljs.core._pop["_"];
        if(or__3943__auto____6381) {
          return or__3943__auto____6381
        }else {
          throw cljs.core.missing_protocol.call(null, "IStack.-pop", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IVector = {};
cljs.core._assoc_n = function _assoc_n(coll, n, val) {
  if(function() {
    var and__3941__auto____6386 = coll;
    if(and__3941__auto____6386) {
      return coll.cljs$core$IVector$_assoc_n$arity$3
    }else {
      return and__3941__auto____6386
    }
  }()) {
    return coll.cljs$core$IVector$_assoc_n$arity$3(coll, n, val)
  }else {
    var x__2312__auto____6387 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6388 = cljs.core._assoc_n[goog.typeOf(x__2312__auto____6387)];
      if(or__3943__auto____6388) {
        return or__3943__auto____6388
      }else {
        var or__3943__auto____6389 = cljs.core._assoc_n["_"];
        if(or__3943__auto____6389) {
          return or__3943__auto____6389
        }else {
          throw cljs.core.missing_protocol.call(null, "IVector.-assoc-n", coll);
        }
      }
    }().call(null, coll, n, val)
  }
};
cljs.core.IDeref = {};
cljs.core._deref = function _deref(o) {
  if(function() {
    var and__3941__auto____6394 = o;
    if(and__3941__auto____6394) {
      return o.cljs$core$IDeref$_deref$arity$1
    }else {
      return and__3941__auto____6394
    }
  }()) {
    return o.cljs$core$IDeref$_deref$arity$1(o)
  }else {
    var x__2312__auto____6395 = o == null ? null : o;
    return function() {
      var or__3943__auto____6396 = cljs.core._deref[goog.typeOf(x__2312__auto____6395)];
      if(or__3943__auto____6396) {
        return or__3943__auto____6396
      }else {
        var or__3943__auto____6397 = cljs.core._deref["_"];
        if(or__3943__auto____6397) {
          return or__3943__auto____6397
        }else {
          throw cljs.core.missing_protocol.call(null, "IDeref.-deref", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IDerefWithTimeout = {};
cljs.core._deref_with_timeout = function _deref_with_timeout(o, msec, timeout_val) {
  if(function() {
    var and__3941__auto____6402 = o;
    if(and__3941__auto____6402) {
      return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3
    }else {
      return and__3941__auto____6402
    }
  }()) {
    return o.cljs$core$IDerefWithTimeout$_deref_with_timeout$arity$3(o, msec, timeout_val)
  }else {
    var x__2312__auto____6403 = o == null ? null : o;
    return function() {
      var or__3943__auto____6404 = cljs.core._deref_with_timeout[goog.typeOf(x__2312__auto____6403)];
      if(or__3943__auto____6404) {
        return or__3943__auto____6404
      }else {
        var or__3943__auto____6405 = cljs.core._deref_with_timeout["_"];
        if(or__3943__auto____6405) {
          return or__3943__auto____6405
        }else {
          throw cljs.core.missing_protocol.call(null, "IDerefWithTimeout.-deref-with-timeout", o);
        }
      }
    }().call(null, o, msec, timeout_val)
  }
};
cljs.core.IMeta = {};
cljs.core._meta = function _meta(o) {
  if(function() {
    var and__3941__auto____6410 = o;
    if(and__3941__auto____6410) {
      return o.cljs$core$IMeta$_meta$arity$1
    }else {
      return and__3941__auto____6410
    }
  }()) {
    return o.cljs$core$IMeta$_meta$arity$1(o)
  }else {
    var x__2312__auto____6411 = o == null ? null : o;
    return function() {
      var or__3943__auto____6412 = cljs.core._meta[goog.typeOf(x__2312__auto____6411)];
      if(or__3943__auto____6412) {
        return or__3943__auto____6412
      }else {
        var or__3943__auto____6413 = cljs.core._meta["_"];
        if(or__3943__auto____6413) {
          return or__3943__auto____6413
        }else {
          throw cljs.core.missing_protocol.call(null, "IMeta.-meta", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.IWithMeta = {};
cljs.core._with_meta = function _with_meta(o, meta) {
  if(function() {
    var and__3941__auto____6418 = o;
    if(and__3941__auto____6418) {
      return o.cljs$core$IWithMeta$_with_meta$arity$2
    }else {
      return and__3941__auto____6418
    }
  }()) {
    return o.cljs$core$IWithMeta$_with_meta$arity$2(o, meta)
  }else {
    var x__2312__auto____6419 = o == null ? null : o;
    return function() {
      var or__3943__auto____6420 = cljs.core._with_meta[goog.typeOf(x__2312__auto____6419)];
      if(or__3943__auto____6420) {
        return or__3943__auto____6420
      }else {
        var or__3943__auto____6421 = cljs.core._with_meta["_"];
        if(or__3943__auto____6421) {
          return or__3943__auto____6421
        }else {
          throw cljs.core.missing_protocol.call(null, "IWithMeta.-with-meta", o);
        }
      }
    }().call(null, o, meta)
  }
};
cljs.core.IReduce = {};
cljs.core._reduce = function() {
  var _reduce = null;
  var _reduce__2 = function(coll, f) {
    if(function() {
      var and__3941__auto____6430 = coll;
      if(and__3941__auto____6430) {
        return coll.cljs$core$IReduce$_reduce$arity$2
      }else {
        return and__3941__auto____6430
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$2(coll, f)
    }else {
      var x__2312__auto____6431 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6432 = cljs.core._reduce[goog.typeOf(x__2312__auto____6431)];
        if(or__3943__auto____6432) {
          return or__3943__auto____6432
        }else {
          var or__3943__auto____6433 = cljs.core._reduce["_"];
          if(or__3943__auto____6433) {
            return or__3943__auto____6433
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f)
    }
  };
  var _reduce__3 = function(coll, f, start) {
    if(function() {
      var and__3941__auto____6434 = coll;
      if(and__3941__auto____6434) {
        return coll.cljs$core$IReduce$_reduce$arity$3
      }else {
        return and__3941__auto____6434
      }
    }()) {
      return coll.cljs$core$IReduce$_reduce$arity$3(coll, f, start)
    }else {
      var x__2312__auto____6435 = coll == null ? null : coll;
      return function() {
        var or__3943__auto____6436 = cljs.core._reduce[goog.typeOf(x__2312__auto____6435)];
        if(or__3943__auto____6436) {
          return or__3943__auto____6436
        }else {
          var or__3943__auto____6437 = cljs.core._reduce["_"];
          if(or__3943__auto____6437) {
            return or__3943__auto____6437
          }else {
            throw cljs.core.missing_protocol.call(null, "IReduce.-reduce", coll);
          }
        }
      }().call(null, coll, f, start)
    }
  };
  _reduce = function(coll, f, start) {
    switch(arguments.length) {
      case 2:
        return _reduce__2.call(this, coll, f);
      case 3:
        return _reduce__3.call(this, coll, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  _reduce.cljs$lang$arity$2 = _reduce__2;
  _reduce.cljs$lang$arity$3 = _reduce__3;
  return _reduce
}();
cljs.core.IKVReduce = {};
cljs.core._kv_reduce = function _kv_reduce(coll, f, init) {
  if(function() {
    var and__3941__auto____6442 = coll;
    if(and__3941__auto____6442) {
      return coll.cljs$core$IKVReduce$_kv_reduce$arity$3
    }else {
      return and__3941__auto____6442
    }
  }()) {
    return coll.cljs$core$IKVReduce$_kv_reduce$arity$3(coll, f, init)
  }else {
    var x__2312__auto____6443 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6444 = cljs.core._kv_reduce[goog.typeOf(x__2312__auto____6443)];
      if(or__3943__auto____6444) {
        return or__3943__auto____6444
      }else {
        var or__3943__auto____6445 = cljs.core._kv_reduce["_"];
        if(or__3943__auto____6445) {
          return or__3943__auto____6445
        }else {
          throw cljs.core.missing_protocol.call(null, "IKVReduce.-kv-reduce", coll);
        }
      }
    }().call(null, coll, f, init)
  }
};
cljs.core.IEquiv = {};
cljs.core._equiv = function _equiv(o, other) {
  if(function() {
    var and__3941__auto____6450 = o;
    if(and__3941__auto____6450) {
      return o.cljs$core$IEquiv$_equiv$arity$2
    }else {
      return and__3941__auto____6450
    }
  }()) {
    return o.cljs$core$IEquiv$_equiv$arity$2(o, other)
  }else {
    var x__2312__auto____6451 = o == null ? null : o;
    return function() {
      var or__3943__auto____6452 = cljs.core._equiv[goog.typeOf(x__2312__auto____6451)];
      if(or__3943__auto____6452) {
        return or__3943__auto____6452
      }else {
        var or__3943__auto____6453 = cljs.core._equiv["_"];
        if(or__3943__auto____6453) {
          return or__3943__auto____6453
        }else {
          throw cljs.core.missing_protocol.call(null, "IEquiv.-equiv", o);
        }
      }
    }().call(null, o, other)
  }
};
cljs.core.IHash = {};
cljs.core._hash = function _hash(o) {
  if(function() {
    var and__3941__auto____6458 = o;
    if(and__3941__auto____6458) {
      return o.cljs$core$IHash$_hash$arity$1
    }else {
      return and__3941__auto____6458
    }
  }()) {
    return o.cljs$core$IHash$_hash$arity$1(o)
  }else {
    var x__2312__auto____6459 = o == null ? null : o;
    return function() {
      var or__3943__auto____6460 = cljs.core._hash[goog.typeOf(x__2312__auto____6459)];
      if(or__3943__auto____6460) {
        return or__3943__auto____6460
      }else {
        var or__3943__auto____6461 = cljs.core._hash["_"];
        if(or__3943__auto____6461) {
          return or__3943__auto____6461
        }else {
          throw cljs.core.missing_protocol.call(null, "IHash.-hash", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISeqable = {};
cljs.core._seq = function _seq(o) {
  if(function() {
    var and__3941__auto____6466 = o;
    if(and__3941__auto____6466) {
      return o.cljs$core$ISeqable$_seq$arity$1
    }else {
      return and__3941__auto____6466
    }
  }()) {
    return o.cljs$core$ISeqable$_seq$arity$1(o)
  }else {
    var x__2312__auto____6467 = o == null ? null : o;
    return function() {
      var or__3943__auto____6468 = cljs.core._seq[goog.typeOf(x__2312__auto____6467)];
      if(or__3943__auto____6468) {
        return or__3943__auto____6468
      }else {
        var or__3943__auto____6469 = cljs.core._seq["_"];
        if(or__3943__auto____6469) {
          return or__3943__auto____6469
        }else {
          throw cljs.core.missing_protocol.call(null, "ISeqable.-seq", o);
        }
      }
    }().call(null, o)
  }
};
cljs.core.ISequential = {};
cljs.core.IList = {};
cljs.core.IRecord = {};
cljs.core.IReversible = {};
cljs.core._rseq = function _rseq(coll) {
  if(function() {
    var and__3941__auto____6474 = coll;
    if(and__3941__auto____6474) {
      return coll.cljs$core$IReversible$_rseq$arity$1
    }else {
      return and__3941__auto____6474
    }
  }()) {
    return coll.cljs$core$IReversible$_rseq$arity$1(coll)
  }else {
    var x__2312__auto____6475 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6476 = cljs.core._rseq[goog.typeOf(x__2312__auto____6475)];
      if(or__3943__auto____6476) {
        return or__3943__auto____6476
      }else {
        var or__3943__auto____6477 = cljs.core._rseq["_"];
        if(or__3943__auto____6477) {
          return or__3943__auto____6477
        }else {
          throw cljs.core.missing_protocol.call(null, "IReversible.-rseq", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ISorted = {};
cljs.core._sorted_seq = function _sorted_seq(coll, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6482 = coll;
    if(and__3941__auto____6482) {
      return coll.cljs$core$ISorted$_sorted_seq$arity$2
    }else {
      return and__3941__auto____6482
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq$arity$2(coll, ascending_QMARK_)
  }else {
    var x__2312__auto____6483 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6484 = cljs.core._sorted_seq[goog.typeOf(x__2312__auto____6483)];
      if(or__3943__auto____6484) {
        return or__3943__auto____6484
      }else {
        var or__3943__auto____6485 = cljs.core._sorted_seq["_"];
        if(or__3943__auto____6485) {
          return or__3943__auto____6485
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq", coll);
        }
      }
    }().call(null, coll, ascending_QMARK_)
  }
};
cljs.core._sorted_seq_from = function _sorted_seq_from(coll, k, ascending_QMARK_) {
  if(function() {
    var and__3941__auto____6490 = coll;
    if(and__3941__auto____6490) {
      return coll.cljs$core$ISorted$_sorted_seq_from$arity$3
    }else {
      return and__3941__auto____6490
    }
  }()) {
    return coll.cljs$core$ISorted$_sorted_seq_from$arity$3(coll, k, ascending_QMARK_)
  }else {
    var x__2312__auto____6491 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6492 = cljs.core._sorted_seq_from[goog.typeOf(x__2312__auto____6491)];
      if(or__3943__auto____6492) {
        return or__3943__auto____6492
      }else {
        var or__3943__auto____6493 = cljs.core._sorted_seq_from["_"];
        if(or__3943__auto____6493) {
          return or__3943__auto____6493
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-sorted-seq-from", coll);
        }
      }
    }().call(null, coll, k, ascending_QMARK_)
  }
};
cljs.core._entry_key = function _entry_key(coll, entry) {
  if(function() {
    var and__3941__auto____6498 = coll;
    if(and__3941__auto____6498) {
      return coll.cljs$core$ISorted$_entry_key$arity$2
    }else {
      return and__3941__auto____6498
    }
  }()) {
    return coll.cljs$core$ISorted$_entry_key$arity$2(coll, entry)
  }else {
    var x__2312__auto____6499 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6500 = cljs.core._entry_key[goog.typeOf(x__2312__auto____6499)];
      if(or__3943__auto____6500) {
        return or__3943__auto____6500
      }else {
        var or__3943__auto____6501 = cljs.core._entry_key["_"];
        if(or__3943__auto____6501) {
          return or__3943__auto____6501
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-entry-key", coll);
        }
      }
    }().call(null, coll, entry)
  }
};
cljs.core._comparator = function _comparator(coll) {
  if(function() {
    var and__3941__auto____6506 = coll;
    if(and__3941__auto____6506) {
      return coll.cljs$core$ISorted$_comparator$arity$1
    }else {
      return and__3941__auto____6506
    }
  }()) {
    return coll.cljs$core$ISorted$_comparator$arity$1(coll)
  }else {
    var x__2312__auto____6507 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6508 = cljs.core._comparator[goog.typeOf(x__2312__auto____6507)];
      if(or__3943__auto____6508) {
        return or__3943__auto____6508
      }else {
        var or__3943__auto____6509 = cljs.core._comparator["_"];
        if(or__3943__auto____6509) {
          return or__3943__auto____6509
        }else {
          throw cljs.core.missing_protocol.call(null, "ISorted.-comparator", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IPrintable = {};
cljs.core._pr_seq = function _pr_seq(o, opts) {
  if(function() {
    var and__3941__auto____6514 = o;
    if(and__3941__auto____6514) {
      return o.cljs$core$IPrintable$_pr_seq$arity$2
    }else {
      return and__3941__auto____6514
    }
  }()) {
    return o.cljs$core$IPrintable$_pr_seq$arity$2(o, opts)
  }else {
    var x__2312__auto____6515 = o == null ? null : o;
    return function() {
      var or__3943__auto____6516 = cljs.core._pr_seq[goog.typeOf(x__2312__auto____6515)];
      if(or__3943__auto____6516) {
        return or__3943__auto____6516
      }else {
        var or__3943__auto____6517 = cljs.core._pr_seq["_"];
        if(or__3943__auto____6517) {
          return or__3943__auto____6517
        }else {
          throw cljs.core.missing_protocol.call(null, "IPrintable.-pr-seq", o);
        }
      }
    }().call(null, o, opts)
  }
};
cljs.core.IPending = {};
cljs.core._realized_QMARK_ = function _realized_QMARK_(d) {
  if(function() {
    var and__3941__auto____6522 = d;
    if(and__3941__auto____6522) {
      return d.cljs$core$IPending$_realized_QMARK_$arity$1
    }else {
      return and__3941__auto____6522
    }
  }()) {
    return d.cljs$core$IPending$_realized_QMARK_$arity$1(d)
  }else {
    var x__2312__auto____6523 = d == null ? null : d;
    return function() {
      var or__3943__auto____6524 = cljs.core._realized_QMARK_[goog.typeOf(x__2312__auto____6523)];
      if(or__3943__auto____6524) {
        return or__3943__auto____6524
      }else {
        var or__3943__auto____6525 = cljs.core._realized_QMARK_["_"];
        if(or__3943__auto____6525) {
          return or__3943__auto____6525
        }else {
          throw cljs.core.missing_protocol.call(null, "IPending.-realized?", d);
        }
      }
    }().call(null, d)
  }
};
cljs.core.IWatchable = {};
cljs.core._notify_watches = function _notify_watches(this$, oldval, newval) {
  if(function() {
    var and__3941__auto____6530 = this$;
    if(and__3941__auto____6530) {
      return this$.cljs$core$IWatchable$_notify_watches$arity$3
    }else {
      return and__3941__auto____6530
    }
  }()) {
    return this$.cljs$core$IWatchable$_notify_watches$arity$3(this$, oldval, newval)
  }else {
    var x__2312__auto____6531 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6532 = cljs.core._notify_watches[goog.typeOf(x__2312__auto____6531)];
      if(or__3943__auto____6532) {
        return or__3943__auto____6532
      }else {
        var or__3943__auto____6533 = cljs.core._notify_watches["_"];
        if(or__3943__auto____6533) {
          return or__3943__auto____6533
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-notify-watches", this$);
        }
      }
    }().call(null, this$, oldval, newval)
  }
};
cljs.core._add_watch = function _add_watch(this$, key, f) {
  if(function() {
    var and__3941__auto____6538 = this$;
    if(and__3941__auto____6538) {
      return this$.cljs$core$IWatchable$_add_watch$arity$3
    }else {
      return and__3941__auto____6538
    }
  }()) {
    return this$.cljs$core$IWatchable$_add_watch$arity$3(this$, key, f)
  }else {
    var x__2312__auto____6539 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6540 = cljs.core._add_watch[goog.typeOf(x__2312__auto____6539)];
      if(or__3943__auto____6540) {
        return or__3943__auto____6540
      }else {
        var or__3943__auto____6541 = cljs.core._add_watch["_"];
        if(or__3943__auto____6541) {
          return or__3943__auto____6541
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-add-watch", this$);
        }
      }
    }().call(null, this$, key, f)
  }
};
cljs.core._remove_watch = function _remove_watch(this$, key) {
  if(function() {
    var and__3941__auto____6546 = this$;
    if(and__3941__auto____6546) {
      return this$.cljs$core$IWatchable$_remove_watch$arity$2
    }else {
      return and__3941__auto____6546
    }
  }()) {
    return this$.cljs$core$IWatchable$_remove_watch$arity$2(this$, key)
  }else {
    var x__2312__auto____6547 = this$ == null ? null : this$;
    return function() {
      var or__3943__auto____6548 = cljs.core._remove_watch[goog.typeOf(x__2312__auto____6547)];
      if(or__3943__auto____6548) {
        return or__3943__auto____6548
      }else {
        var or__3943__auto____6549 = cljs.core._remove_watch["_"];
        if(or__3943__auto____6549) {
          return or__3943__auto____6549
        }else {
          throw cljs.core.missing_protocol.call(null, "IWatchable.-remove-watch", this$);
        }
      }
    }().call(null, this$, key)
  }
};
cljs.core.IEditableCollection = {};
cljs.core._as_transient = function _as_transient(coll) {
  if(function() {
    var and__3941__auto____6554 = coll;
    if(and__3941__auto____6554) {
      return coll.cljs$core$IEditableCollection$_as_transient$arity$1
    }else {
      return and__3941__auto____6554
    }
  }()) {
    return coll.cljs$core$IEditableCollection$_as_transient$arity$1(coll)
  }else {
    var x__2312__auto____6555 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6556 = cljs.core._as_transient[goog.typeOf(x__2312__auto____6555)];
      if(or__3943__auto____6556) {
        return or__3943__auto____6556
      }else {
        var or__3943__auto____6557 = cljs.core._as_transient["_"];
        if(or__3943__auto____6557) {
          return or__3943__auto____6557
        }else {
          throw cljs.core.missing_protocol.call(null, "IEditableCollection.-as-transient", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.ITransientCollection = {};
cljs.core._conj_BANG_ = function _conj_BANG_(tcoll, val) {
  if(function() {
    var and__3941__auto____6562 = tcoll;
    if(and__3941__auto____6562) {
      return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2
    }else {
      return and__3941__auto____6562
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
  }else {
    var x__2312__auto____6563 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6564 = cljs.core._conj_BANG_[goog.typeOf(x__2312__auto____6563)];
      if(or__3943__auto____6564) {
        return or__3943__auto____6564
      }else {
        var or__3943__auto____6565 = cljs.core._conj_BANG_["_"];
        if(or__3943__auto____6565) {
          return or__3943__auto____6565
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-conj!", tcoll);
        }
      }
    }().call(null, tcoll, val)
  }
};
cljs.core._persistent_BANG_ = function _persistent_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6570 = tcoll;
    if(and__3941__auto____6570) {
      return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1
    }else {
      return and__3941__auto____6570
    }
  }()) {
    return tcoll.cljs$core$ITransientCollection$_persistent_BANG_$arity$1(tcoll)
  }else {
    var x__2312__auto____6571 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6572 = cljs.core._persistent_BANG_[goog.typeOf(x__2312__auto____6571)];
      if(or__3943__auto____6572) {
        return or__3943__auto____6572
      }else {
        var or__3943__auto____6573 = cljs.core._persistent_BANG_["_"];
        if(or__3943__auto____6573) {
          return or__3943__auto____6573
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientCollection.-persistent!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientAssociative = {};
cljs.core._assoc_BANG_ = function _assoc_BANG_(tcoll, key, val) {
  if(function() {
    var and__3941__auto____6578 = tcoll;
    if(and__3941__auto____6578) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3
    }else {
      return and__3941__auto____6578
    }
  }()) {
    return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, key, val)
  }else {
    var x__2312__auto____6579 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6580 = cljs.core._assoc_BANG_[goog.typeOf(x__2312__auto____6579)];
      if(or__3943__auto____6580) {
        return or__3943__auto____6580
      }else {
        var or__3943__auto____6581 = cljs.core._assoc_BANG_["_"];
        if(or__3943__auto____6581) {
          return or__3943__auto____6581
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientAssociative.-assoc!", tcoll);
        }
      }
    }().call(null, tcoll, key, val)
  }
};
cljs.core.ITransientMap = {};
cljs.core._dissoc_BANG_ = function _dissoc_BANG_(tcoll, key) {
  if(function() {
    var and__3941__auto____6586 = tcoll;
    if(and__3941__auto____6586) {
      return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2
    }else {
      return and__3941__auto____6586
    }
  }()) {
    return tcoll.cljs$core$ITransientMap$_dissoc_BANG_$arity$2(tcoll, key)
  }else {
    var x__2312__auto____6587 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6588 = cljs.core._dissoc_BANG_[goog.typeOf(x__2312__auto____6587)];
      if(or__3943__auto____6588) {
        return or__3943__auto____6588
      }else {
        var or__3943__auto____6589 = cljs.core._dissoc_BANG_["_"];
        if(or__3943__auto____6589) {
          return or__3943__auto____6589
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientMap.-dissoc!", tcoll);
        }
      }
    }().call(null, tcoll, key)
  }
};
cljs.core.ITransientVector = {};
cljs.core._assoc_n_BANG_ = function _assoc_n_BANG_(tcoll, n, val) {
  if(function() {
    var and__3941__auto____6594 = tcoll;
    if(and__3941__auto____6594) {
      return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3
    }else {
      return and__3941__auto____6594
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, n, val)
  }else {
    var x__2312__auto____6595 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6596 = cljs.core._assoc_n_BANG_[goog.typeOf(x__2312__auto____6595)];
      if(or__3943__auto____6596) {
        return or__3943__auto____6596
      }else {
        var or__3943__auto____6597 = cljs.core._assoc_n_BANG_["_"];
        if(or__3943__auto____6597) {
          return or__3943__auto____6597
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-assoc-n!", tcoll);
        }
      }
    }().call(null, tcoll, n, val)
  }
};
cljs.core._pop_BANG_ = function _pop_BANG_(tcoll) {
  if(function() {
    var and__3941__auto____6602 = tcoll;
    if(and__3941__auto____6602) {
      return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1
    }else {
      return and__3941__auto____6602
    }
  }()) {
    return tcoll.cljs$core$ITransientVector$_pop_BANG_$arity$1(tcoll)
  }else {
    var x__2312__auto____6603 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6604 = cljs.core._pop_BANG_[goog.typeOf(x__2312__auto____6603)];
      if(or__3943__auto____6604) {
        return or__3943__auto____6604
      }else {
        var or__3943__auto____6605 = cljs.core._pop_BANG_["_"];
        if(or__3943__auto____6605) {
          return or__3943__auto____6605
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientVector.-pop!", tcoll);
        }
      }
    }().call(null, tcoll)
  }
};
cljs.core.ITransientSet = {};
cljs.core._disjoin_BANG_ = function _disjoin_BANG_(tcoll, v) {
  if(function() {
    var and__3941__auto____6610 = tcoll;
    if(and__3941__auto____6610) {
      return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2
    }else {
      return and__3941__auto____6610
    }
  }()) {
    return tcoll.cljs$core$ITransientSet$_disjoin_BANG_$arity$2(tcoll, v)
  }else {
    var x__2312__auto____6611 = tcoll == null ? null : tcoll;
    return function() {
      var or__3943__auto____6612 = cljs.core._disjoin_BANG_[goog.typeOf(x__2312__auto____6611)];
      if(or__3943__auto____6612) {
        return or__3943__auto____6612
      }else {
        var or__3943__auto____6613 = cljs.core._disjoin_BANG_["_"];
        if(or__3943__auto____6613) {
          return or__3943__auto____6613
        }else {
          throw cljs.core.missing_protocol.call(null, "ITransientSet.-disjoin!", tcoll);
        }
      }
    }().call(null, tcoll, v)
  }
};
cljs.core.IComparable = {};
cljs.core._compare = function _compare(x, y) {
  if(function() {
    var and__3941__auto____6618 = x;
    if(and__3941__auto____6618) {
      return x.cljs$core$IComparable$_compare$arity$2
    }else {
      return and__3941__auto____6618
    }
  }()) {
    return x.cljs$core$IComparable$_compare$arity$2(x, y)
  }else {
    var x__2312__auto____6619 = x == null ? null : x;
    return function() {
      var or__3943__auto____6620 = cljs.core._compare[goog.typeOf(x__2312__auto____6619)];
      if(or__3943__auto____6620) {
        return or__3943__auto____6620
      }else {
        var or__3943__auto____6621 = cljs.core._compare["_"];
        if(or__3943__auto____6621) {
          return or__3943__auto____6621
        }else {
          throw cljs.core.missing_protocol.call(null, "IComparable.-compare", x);
        }
      }
    }().call(null, x, y)
  }
};
cljs.core.IChunk = {};
cljs.core._drop_first = function _drop_first(coll) {
  if(function() {
    var and__3941__auto____6626 = coll;
    if(and__3941__auto____6626) {
      return coll.cljs$core$IChunk$_drop_first$arity$1
    }else {
      return and__3941__auto____6626
    }
  }()) {
    return coll.cljs$core$IChunk$_drop_first$arity$1(coll)
  }else {
    var x__2312__auto____6627 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6628 = cljs.core._drop_first[goog.typeOf(x__2312__auto____6627)];
      if(or__3943__auto____6628) {
        return or__3943__auto____6628
      }else {
        var or__3943__auto____6629 = cljs.core._drop_first["_"];
        if(or__3943__auto____6629) {
          return or__3943__auto____6629
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunk.-drop-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedSeq = {};
cljs.core._chunked_first = function _chunked_first(coll) {
  if(function() {
    var and__3941__auto____6634 = coll;
    if(and__3941__auto____6634) {
      return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1
    }else {
      return and__3941__auto____6634
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_first$arity$1(coll)
  }else {
    var x__2312__auto____6635 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6636 = cljs.core._chunked_first[goog.typeOf(x__2312__auto____6635)];
      if(or__3943__auto____6636) {
        return or__3943__auto____6636
      }else {
        var or__3943__auto____6637 = cljs.core._chunked_first["_"];
        if(or__3943__auto____6637) {
          return or__3943__auto____6637
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-first", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core._chunked_rest = function _chunked_rest(coll) {
  if(function() {
    var and__3941__auto____6642 = coll;
    if(and__3941__auto____6642) {
      return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1
    }else {
      return and__3941__auto____6642
    }
  }()) {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }else {
    var x__2312__auto____6643 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6644 = cljs.core._chunked_rest[goog.typeOf(x__2312__auto____6643)];
      if(or__3943__auto____6644) {
        return or__3943__auto____6644
      }else {
        var or__3943__auto____6645 = cljs.core._chunked_rest["_"];
        if(or__3943__auto____6645) {
          return or__3943__auto____6645
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedSeq.-chunked-rest", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.IChunkedNext = {};
cljs.core._chunked_next = function _chunked_next(coll) {
  if(function() {
    var and__3941__auto____6650 = coll;
    if(and__3941__auto____6650) {
      return coll.cljs$core$IChunkedNext$_chunked_next$arity$1
    }else {
      return and__3941__auto____6650
    }
  }()) {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }else {
    var x__2312__auto____6651 = coll == null ? null : coll;
    return function() {
      var or__3943__auto____6652 = cljs.core._chunked_next[goog.typeOf(x__2312__auto____6651)];
      if(or__3943__auto____6652) {
        return or__3943__auto____6652
      }else {
        var or__3943__auto____6653 = cljs.core._chunked_next["_"];
        if(or__3943__auto____6653) {
          return or__3943__auto____6653
        }else {
          throw cljs.core.missing_protocol.call(null, "IChunkedNext.-chunked-next", coll);
        }
      }
    }().call(null, coll)
  }
};
cljs.core.identical_QMARK_ = function identical_QMARK_(x, y) {
  return x === y
};
cljs.core._EQ_ = function() {
  var _EQ_ = null;
  var _EQ___1 = function(x) {
    return true
  };
  var _EQ___2 = function(x, y) {
    var or__3943__auto____6655 = x === y;
    if(or__3943__auto____6655) {
      return or__3943__auto____6655
    }else {
      return cljs.core._equiv.call(null, x, y)
    }
  };
  var _EQ___3 = function() {
    var G__6656__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__6657 = y;
            var G__6658 = cljs.core.first.call(null, more);
            var G__6659 = cljs.core.next.call(null, more);
            x = G__6657;
            y = G__6658;
            more = G__6659;
            continue
          }else {
            return _EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__6656 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6656__delegate.call(this, x, y, more)
    };
    G__6656.cljs$lang$maxFixedArity = 2;
    G__6656.cljs$lang$applyTo = function(arglist__6660) {
      var x = cljs.core.first(arglist__6660);
      var y = cljs.core.first(cljs.core.next(arglist__6660));
      var more = cljs.core.rest(cljs.core.next(arglist__6660));
      return G__6656__delegate(x, y, more)
    };
    G__6656.cljs$lang$arity$variadic = G__6656__delegate;
    return G__6656
  }();
  _EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ___1.call(this, x);
      case 2:
        return _EQ___2.call(this, x, y);
      default:
        return _EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ_.cljs$lang$maxFixedArity = 2;
  _EQ_.cljs$lang$applyTo = _EQ___3.cljs$lang$applyTo;
  _EQ_.cljs$lang$arity$1 = _EQ___1;
  _EQ_.cljs$lang$arity$2 = _EQ___2;
  _EQ_.cljs$lang$arity$variadic = _EQ___3.cljs$lang$arity$variadic;
  return _EQ_
}();
cljs.core.nil_QMARK_ = function nil_QMARK_(x) {
  return x == null
};
cljs.core.type = function type(x) {
  if(x == null) {
    return null
  }else {
    return x.constructor
  }
};
cljs.core.instance_QMARK_ = function instance_QMARK_(t, o) {
  return o instanceof t
};
cljs.core.IHash["null"] = true;
cljs.core._hash["null"] = function(o) {
  return 0
};
cljs.core.ILookup["null"] = true;
cljs.core._lookup["null"] = function() {
  var G__6661 = null;
  var G__6661__2 = function(o, k) {
    return null
  };
  var G__6661__3 = function(o, k, not_found) {
    return not_found
  };
  G__6661 = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6661__2.call(this, o, k);
      case 3:
        return G__6661__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6661
}();
cljs.core.IAssociative["null"] = true;
cljs.core._assoc["null"] = function(_, k, v) {
  return cljs.core.hash_map.call(null, k, v)
};
cljs.core.INext["null"] = true;
cljs.core._next["null"] = function(_) {
  return null
};
cljs.core.ICollection["null"] = true;
cljs.core._conj["null"] = function(_, o) {
  return cljs.core.list.call(null, o)
};
cljs.core.IReduce["null"] = true;
cljs.core._reduce["null"] = function() {
  var G__6662 = null;
  var G__6662__2 = function(_, f) {
    return f.call(null)
  };
  var G__6662__3 = function(_, f, start) {
    return start
  };
  G__6662 = function(_, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6662__2.call(this, _, f);
      case 3:
        return G__6662__3.call(this, _, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6662
}();
cljs.core.IPrintable["null"] = true;
cljs.core._pr_seq["null"] = function(o) {
  return cljs.core.list.call(null, "nil")
};
cljs.core.ISet["null"] = true;
cljs.core._disjoin["null"] = function(_, v) {
  return null
};
cljs.core.ICounted["null"] = true;
cljs.core._count["null"] = function(_) {
  return 0
};
cljs.core.IStack["null"] = true;
cljs.core._peek["null"] = function(_) {
  return null
};
cljs.core._pop["null"] = function(_) {
  return null
};
cljs.core.ISeq["null"] = true;
cljs.core._first["null"] = function(_) {
  return null
};
cljs.core._rest["null"] = function(_) {
  return cljs.core.list.call(null)
};
cljs.core.IEquiv["null"] = true;
cljs.core._equiv["null"] = function(_, o) {
  return o == null
};
cljs.core.IWithMeta["null"] = true;
cljs.core._with_meta["null"] = function(_, meta) {
  return null
};
cljs.core.IMeta["null"] = true;
cljs.core._meta["null"] = function(_) {
  return null
};
cljs.core.IIndexed["null"] = true;
cljs.core._nth["null"] = function() {
  var G__6663 = null;
  var G__6663__2 = function(_, n) {
    return null
  };
  var G__6663__3 = function(_, n, not_found) {
    return not_found
  };
  G__6663 = function(_, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6663__2.call(this, _, n);
      case 3:
        return G__6663__3.call(this, _, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6663
}();
cljs.core.IEmptyableCollection["null"] = true;
cljs.core._empty["null"] = function(_) {
  return null
};
cljs.core.IMap["null"] = true;
cljs.core._dissoc["null"] = function(_, k) {
  return null
};
Date.prototype.cljs$core$IEquiv$ = true;
Date.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var and__3941__auto____6664 = cljs.core.instance_QMARK_.call(null, Date, other);
  if(and__3941__auto____6664) {
    return o.toString() === other.toString()
  }else {
    return and__3941__auto____6664
  }
};
cljs.core.IHash["number"] = true;
cljs.core._hash["number"] = function(o) {
  return o
};
cljs.core.IEquiv["number"] = true;
cljs.core._equiv["number"] = function(x, o) {
  return x === o
};
cljs.core.IHash["boolean"] = true;
cljs.core._hash["boolean"] = function(o) {
  if(o === true) {
    return 1
  }else {
    return 0
  }
};
cljs.core.IHash["_"] = true;
cljs.core._hash["_"] = function(o) {
  return goog.getUid(o)
};
cljs.core.inc = function inc(x) {
  return x + 1
};
cljs.core.ci_reduce = function() {
  var ci_reduce = null;
  var ci_reduce__2 = function(cicoll, f) {
    var cnt__6677 = cljs.core._count.call(null, cicoll);
    if(cnt__6677 === 0) {
      return f.call(null)
    }else {
      var val__6678 = cljs.core._nth.call(null, cicoll, 0);
      var n__6679 = 1;
      while(true) {
        if(n__6679 < cnt__6677) {
          var nval__6680 = f.call(null, val__6678, cljs.core._nth.call(null, cicoll, n__6679));
          if(cljs.core.reduced_QMARK_.call(null, nval__6680)) {
            return cljs.core.deref.call(null, nval__6680)
          }else {
            var G__6689 = nval__6680;
            var G__6690 = n__6679 + 1;
            val__6678 = G__6689;
            n__6679 = G__6690;
            continue
          }
        }else {
          return val__6678
        }
        break
      }
    }
  };
  var ci_reduce__3 = function(cicoll, f, val) {
    var cnt__6681 = cljs.core._count.call(null, cicoll);
    var val__6682 = val;
    var n__6683 = 0;
    while(true) {
      if(n__6683 < cnt__6681) {
        var nval__6684 = f.call(null, val__6682, cljs.core._nth.call(null, cicoll, n__6683));
        if(cljs.core.reduced_QMARK_.call(null, nval__6684)) {
          return cljs.core.deref.call(null, nval__6684)
        }else {
          var G__6691 = nval__6684;
          var G__6692 = n__6683 + 1;
          val__6682 = G__6691;
          n__6683 = G__6692;
          continue
        }
      }else {
        return val__6682
      }
      break
    }
  };
  var ci_reduce__4 = function(cicoll, f, val, idx) {
    var cnt__6685 = cljs.core._count.call(null, cicoll);
    var val__6686 = val;
    var n__6687 = idx;
    while(true) {
      if(n__6687 < cnt__6685) {
        var nval__6688 = f.call(null, val__6686, cljs.core._nth.call(null, cicoll, n__6687));
        if(cljs.core.reduced_QMARK_.call(null, nval__6688)) {
          return cljs.core.deref.call(null, nval__6688)
        }else {
          var G__6693 = nval__6688;
          var G__6694 = n__6687 + 1;
          val__6686 = G__6693;
          n__6687 = G__6694;
          continue
        }
      }else {
        return val__6686
      }
      break
    }
  };
  ci_reduce = function(cicoll, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return ci_reduce__2.call(this, cicoll, f);
      case 3:
        return ci_reduce__3.call(this, cicoll, f, val);
      case 4:
        return ci_reduce__4.call(this, cicoll, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ci_reduce.cljs$lang$arity$2 = ci_reduce__2;
  ci_reduce.cljs$lang$arity$3 = ci_reduce__3;
  ci_reduce.cljs$lang$arity$4 = ci_reduce__4;
  return ci_reduce
}();
cljs.core.array_reduce = function() {
  var array_reduce = null;
  var array_reduce__2 = function(arr, f) {
    var cnt__6707 = arr.length;
    if(arr.length === 0) {
      return f.call(null)
    }else {
      var val__6708 = arr[0];
      var n__6709 = 1;
      while(true) {
        if(n__6709 < cnt__6707) {
          var nval__6710 = f.call(null, val__6708, arr[n__6709]);
          if(cljs.core.reduced_QMARK_.call(null, nval__6710)) {
            return cljs.core.deref.call(null, nval__6710)
          }else {
            var G__6719 = nval__6710;
            var G__6720 = n__6709 + 1;
            val__6708 = G__6719;
            n__6709 = G__6720;
            continue
          }
        }else {
          return val__6708
        }
        break
      }
    }
  };
  var array_reduce__3 = function(arr, f, val) {
    var cnt__6711 = arr.length;
    var val__6712 = val;
    var n__6713 = 0;
    while(true) {
      if(n__6713 < cnt__6711) {
        var nval__6714 = f.call(null, val__6712, arr[n__6713]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6714)) {
          return cljs.core.deref.call(null, nval__6714)
        }else {
          var G__6721 = nval__6714;
          var G__6722 = n__6713 + 1;
          val__6712 = G__6721;
          n__6713 = G__6722;
          continue
        }
      }else {
        return val__6712
      }
      break
    }
  };
  var array_reduce__4 = function(arr, f, val, idx) {
    var cnt__6715 = arr.length;
    var val__6716 = val;
    var n__6717 = idx;
    while(true) {
      if(n__6717 < cnt__6715) {
        var nval__6718 = f.call(null, val__6716, arr[n__6717]);
        if(cljs.core.reduced_QMARK_.call(null, nval__6718)) {
          return cljs.core.deref.call(null, nval__6718)
        }else {
          var G__6723 = nval__6718;
          var G__6724 = n__6717 + 1;
          val__6716 = G__6723;
          n__6717 = G__6724;
          continue
        }
      }else {
        return val__6716
      }
      break
    }
  };
  array_reduce = function(arr, f, val, idx) {
    switch(arguments.length) {
      case 2:
        return array_reduce__2.call(this, arr, f);
      case 3:
        return array_reduce__3.call(this, arr, f, val);
      case 4:
        return array_reduce__4.call(this, arr, f, val, idx)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_reduce.cljs$lang$arity$2 = array_reduce__2;
  array_reduce.cljs$lang$arity$3 = array_reduce__3;
  array_reduce.cljs$lang$arity$4 = array_reduce__4;
  return array_reduce
}();
cljs.core.IndexedSeq = function(a, i) {
  this.a = a;
  this.i = i;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 166199546
};
cljs.core.IndexedSeq.cljs$lang$type = true;
cljs.core.IndexedSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/IndexedSeq")
};
cljs.core.IndexedSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6725 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$INext$_next$arity$1 = function(_) {
  var this__6726 = this;
  if(this__6726.i + 1 < this__6726.a.length) {
    return new cljs.core.IndexedSeq(this__6726.a, this__6726.i + 1)
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6727 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__6728 = this;
  var c__6729 = coll.cljs$core$ICounted$_count$arity$1(coll);
  if(c__6729 > 0) {
    return new cljs.core.RSeq(coll, c__6729 - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.IndexedSeq.prototype.toString = function() {
  var this__6730 = this;
  var this__6731 = this;
  return cljs.core.pr_str.call(null, this__6731)
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__6732 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6732.a)) {
    return cljs.core.ci_reduce.call(null, this__6732.a, f, this__6732.a[this__6732.i], this__6732.i + 1)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, this__6732.a[this__6732.i], 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__6733 = this;
  if(cljs.core.counted_QMARK_.call(null, this__6733.a)) {
    return cljs.core.ci_reduce.call(null, this__6733.a, f, start, this__6733.i)
  }else {
    return cljs.core.ci_reduce.call(null, coll, f, start, 0)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__6734 = this;
  return this$
};
cljs.core.IndexedSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__6735 = this;
  return this__6735.a.length - this__6735.i
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(_) {
  var this__6736 = this;
  return this__6736.a[this__6736.i]
};
cljs.core.IndexedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(_) {
  var this__6737 = this;
  if(this__6737.i + 1 < this__6737.a.length) {
    return new cljs.core.IndexedSeq(this__6737.a, this__6737.i + 1)
  }else {
    return cljs.core.list.call(null)
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6738 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__6739 = this;
  var i__6740 = n + this__6739.i;
  if(i__6740 < this__6739.a.length) {
    return this__6739.a[i__6740]
  }else {
    return null
  }
};
cljs.core.IndexedSeq.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__6741 = this;
  var i__6742 = n + this__6741.i;
  if(i__6742 < this__6741.a.length) {
    return this__6741.a[i__6742]
  }else {
    return not_found
  }
};
cljs.core.IndexedSeq;
cljs.core.prim_seq = function() {
  var prim_seq = null;
  var prim_seq__1 = function(prim) {
    return prim_seq.call(null, prim, 0)
  };
  var prim_seq__2 = function(prim, i) {
    if(prim.length === 0) {
      return null
    }else {
      return new cljs.core.IndexedSeq(prim, i)
    }
  };
  prim_seq = function(prim, i) {
    switch(arguments.length) {
      case 1:
        return prim_seq__1.call(this, prim);
      case 2:
        return prim_seq__2.call(this, prim, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  prim_seq.cljs$lang$arity$1 = prim_seq__1;
  prim_seq.cljs$lang$arity$2 = prim_seq__2;
  return prim_seq
}();
cljs.core.array_seq = function() {
  var array_seq = null;
  var array_seq__1 = function(array) {
    return cljs.core.prim_seq.call(null, array, 0)
  };
  var array_seq__2 = function(array, i) {
    return cljs.core.prim_seq.call(null, array, i)
  };
  array_seq = function(array, i) {
    switch(arguments.length) {
      case 1:
        return array_seq__1.call(this, array);
      case 2:
        return array_seq__2.call(this, array, i)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_seq.cljs$lang$arity$1 = array_seq__1;
  array_seq.cljs$lang$arity$2 = array_seq__2;
  return array_seq
}();
cljs.core.IReduce["array"] = true;
cljs.core._reduce["array"] = function() {
  var G__6743 = null;
  var G__6743__2 = function(array, f) {
    return cljs.core.ci_reduce.call(null, array, f)
  };
  var G__6743__3 = function(array, f, start) {
    return cljs.core.ci_reduce.call(null, array, f, start)
  };
  G__6743 = function(array, f, start) {
    switch(arguments.length) {
      case 2:
        return G__6743__2.call(this, array, f);
      case 3:
        return G__6743__3.call(this, array, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6743
}();
cljs.core.ILookup["array"] = true;
cljs.core._lookup["array"] = function() {
  var G__6744 = null;
  var G__6744__2 = function(array, k) {
    return array[k]
  };
  var G__6744__3 = function(array, k, not_found) {
    return cljs.core._nth.call(null, array, k, not_found)
  };
  G__6744 = function(array, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6744__2.call(this, array, k);
      case 3:
        return G__6744__3.call(this, array, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6744
}();
cljs.core.IIndexed["array"] = true;
cljs.core._nth["array"] = function() {
  var G__6745 = null;
  var G__6745__2 = function(array, n) {
    if(n < array.length) {
      return array[n]
    }else {
      return null
    }
  };
  var G__6745__3 = function(array, n, not_found) {
    if(n < array.length) {
      return array[n]
    }else {
      return not_found
    }
  };
  G__6745 = function(array, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__6745__2.call(this, array, n);
      case 3:
        return G__6745__3.call(this, array, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__6745
}();
cljs.core.ICounted["array"] = true;
cljs.core._count["array"] = function(a) {
  return a.length
};
cljs.core.ISeqable["array"] = true;
cljs.core._seq["array"] = function(array) {
  return cljs.core.array_seq.call(null, array, 0)
};
cljs.core.RSeq = function(ci, i, meta) {
  this.ci = ci;
  this.i = i;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.RSeq.cljs$lang$type = true;
cljs.core.RSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/RSeq")
};
cljs.core.RSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__6746 = this;
  return cljs.core.hash_coll.call(null, coll)
};
cljs.core.RSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__6747 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.RSeq.prototype.toString = function() {
  var this__6748 = this;
  var this__6749 = this;
  return cljs.core.pr_str.call(null, this__6749)
};
cljs.core.RSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__6750 = this;
  return coll
};
cljs.core.RSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__6751 = this;
  return this__6751.i + 1
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__6752 = this;
  return cljs.core._nth.call(null, this__6752.ci, this__6752.i)
};
cljs.core.RSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__6753 = this;
  if(this__6753.i > 0) {
    return new cljs.core.RSeq(this__6753.ci, this__6753.i - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.RSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__6754 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, new_meta) {
  var this__6755 = this;
  return new cljs.core.RSeq(this__6755.ci, this__6755.i, new_meta)
};
cljs.core.RSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__6756 = this;
  return this__6756.meta
};
cljs.core.RSeq;
cljs.core.seq = function seq(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6760__6761 = coll;
      if(G__6760__6761) {
        if(function() {
          var or__3943__auto____6762 = G__6760__6761.cljs$lang$protocol_mask$partition0$ & 32;
          if(or__3943__auto____6762) {
            return or__3943__auto____6762
          }else {
            return G__6760__6761.cljs$core$ASeq$
          }
        }()) {
          return true
        }else {
          if(!G__6760__6761.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6760__6761)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ASeq, G__6760__6761)
      }
    }()) {
      return coll
    }else {
      return cljs.core._seq.call(null, coll)
    }
  }
};
cljs.core.first = function first(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6767__6768 = coll;
      if(G__6767__6768) {
        if(function() {
          var or__3943__auto____6769 = G__6767__6768.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6769) {
            return or__3943__auto____6769
          }else {
            return G__6767__6768.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6767__6768.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6767__6768)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6767__6768)
      }
    }()) {
      return cljs.core._first.call(null, coll)
    }else {
      var s__6770 = cljs.core.seq.call(null, coll);
      if(s__6770 == null) {
        return null
      }else {
        return cljs.core._first.call(null, s__6770)
      }
    }
  }
};
cljs.core.rest = function rest(coll) {
  if(!(coll == null)) {
    if(function() {
      var G__6775__6776 = coll;
      if(G__6775__6776) {
        if(function() {
          var or__3943__auto____6777 = G__6775__6776.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____6777) {
            return or__3943__auto____6777
          }else {
            return G__6775__6776.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__6775__6776.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6775__6776)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6775__6776)
      }
    }()) {
      return cljs.core._rest.call(null, coll)
    }else {
      var s__6778 = cljs.core.seq.call(null, coll);
      if(!(s__6778 == null)) {
        return cljs.core._rest.call(null, s__6778)
      }else {
        return cljs.core.List.EMPTY
      }
    }
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.next = function next(coll) {
  if(coll == null) {
    return null
  }else {
    if(function() {
      var G__6782__6783 = coll;
      if(G__6782__6783) {
        if(function() {
          var or__3943__auto____6784 = G__6782__6783.cljs$lang$protocol_mask$partition0$ & 128;
          if(or__3943__auto____6784) {
            return or__3943__auto____6784
          }else {
            return G__6782__6783.cljs$core$INext$
          }
        }()) {
          return true
        }else {
          if(!G__6782__6783.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6782__6783)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.INext, G__6782__6783)
      }
    }()) {
      return cljs.core._next.call(null, coll)
    }else {
      return cljs.core.seq.call(null, cljs.core.rest.call(null, coll))
    }
  }
};
cljs.core.second = function second(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.ffirst = function ffirst(coll) {
  return cljs.core.first.call(null, cljs.core.first.call(null, coll))
};
cljs.core.nfirst = function nfirst(coll) {
  return cljs.core.next.call(null, cljs.core.first.call(null, coll))
};
cljs.core.fnext = function fnext(coll) {
  return cljs.core.first.call(null, cljs.core.next.call(null, coll))
};
cljs.core.nnext = function nnext(coll) {
  return cljs.core.next.call(null, cljs.core.next.call(null, coll))
};
cljs.core.last = function last(s) {
  while(true) {
    var sn__6786 = cljs.core.next.call(null, s);
    if(!(sn__6786 == null)) {
      var G__6787 = sn__6786;
      s = G__6787;
      continue
    }else {
      return cljs.core.first.call(null, s)
    }
    break
  }
};
cljs.core.IEquiv["_"] = true;
cljs.core._equiv["_"] = function(x, o) {
  return x === o
};
cljs.core.not = function not(x) {
  if(cljs.core.truth_(x)) {
    return false
  }else {
    return true
  }
};
cljs.core.conj = function() {
  var conj = null;
  var conj__2 = function(coll, x) {
    return cljs.core._conj.call(null, coll, x)
  };
  var conj__3 = function() {
    var G__6788__delegate = function(coll, x, xs) {
      while(true) {
        if(cljs.core.truth_(xs)) {
          var G__6789 = conj.call(null, coll, x);
          var G__6790 = cljs.core.first.call(null, xs);
          var G__6791 = cljs.core.next.call(null, xs);
          coll = G__6789;
          x = G__6790;
          xs = G__6791;
          continue
        }else {
          return conj.call(null, coll, x)
        }
        break
      }
    };
    var G__6788 = function(coll, x, var_args) {
      var xs = null;
      if(goog.isDef(var_args)) {
        xs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6788__delegate.call(this, coll, x, xs)
    };
    G__6788.cljs$lang$maxFixedArity = 2;
    G__6788.cljs$lang$applyTo = function(arglist__6792) {
      var coll = cljs.core.first(arglist__6792);
      var x = cljs.core.first(cljs.core.next(arglist__6792));
      var xs = cljs.core.rest(cljs.core.next(arglist__6792));
      return G__6788__delegate(coll, x, xs)
    };
    G__6788.cljs$lang$arity$variadic = G__6788__delegate;
    return G__6788
  }();
  conj = function(coll, x, var_args) {
    var xs = var_args;
    switch(arguments.length) {
      case 2:
        return conj__2.call(this, coll, x);
      default:
        return conj__3.cljs$lang$arity$variadic(coll, x, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  conj.cljs$lang$maxFixedArity = 2;
  conj.cljs$lang$applyTo = conj__3.cljs$lang$applyTo;
  conj.cljs$lang$arity$2 = conj__2;
  conj.cljs$lang$arity$variadic = conj__3.cljs$lang$arity$variadic;
  return conj
}();
cljs.core.empty = function empty(coll) {
  return cljs.core._empty.call(null, coll)
};
cljs.core.accumulating_seq_count = function accumulating_seq_count(coll) {
  var s__6795 = cljs.core.seq.call(null, coll);
  var acc__6796 = 0;
  while(true) {
    if(cljs.core.counted_QMARK_.call(null, s__6795)) {
      return acc__6796 + cljs.core._count.call(null, s__6795)
    }else {
      var G__6797 = cljs.core.next.call(null, s__6795);
      var G__6798 = acc__6796 + 1;
      s__6795 = G__6797;
      acc__6796 = G__6798;
      continue
    }
    break
  }
};
cljs.core.count = function count(coll) {
  if(cljs.core.counted_QMARK_.call(null, coll)) {
    return cljs.core._count.call(null, coll)
  }else {
    return cljs.core.accumulating_seq_count.call(null, coll)
  }
};
cljs.core.linear_traversal_nth = function() {
  var linear_traversal_nth = null;
  var linear_traversal_nth__2 = function(coll, n) {
    if(coll == null) {
      throw new Error("Index out of bounds");
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          throw new Error("Index out of bounds");
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1)
          }else {
            if("\ufdd0'else") {
              throw new Error("Index out of bounds");
            }else {
              return null
            }
          }
        }
      }
    }
  };
  var linear_traversal_nth__3 = function(coll, n, not_found) {
    if(coll == null) {
      return not_found
    }else {
      if(n === 0) {
        if(cljs.core.seq.call(null, coll)) {
          return cljs.core.first.call(null, coll)
        }else {
          return not_found
        }
      }else {
        if(cljs.core.indexed_QMARK_.call(null, coll)) {
          return cljs.core._nth.call(null, coll, n, not_found)
        }else {
          if(cljs.core.seq.call(null, coll)) {
            return linear_traversal_nth.call(null, cljs.core.next.call(null, coll), n - 1, not_found)
          }else {
            if("\ufdd0'else") {
              return not_found
            }else {
              return null
            }
          }
        }
      }
    }
  };
  linear_traversal_nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return linear_traversal_nth__2.call(this, coll, n);
      case 3:
        return linear_traversal_nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  linear_traversal_nth.cljs$lang$arity$2 = linear_traversal_nth__2;
  linear_traversal_nth.cljs$lang$arity$3 = linear_traversal_nth__3;
  return linear_traversal_nth
}();
cljs.core.nth = function() {
  var nth = null;
  var nth__2 = function(coll, n) {
    if(coll == null) {
      return null
    }else {
      if(function() {
        var G__6805__6806 = coll;
        if(G__6805__6806) {
          if(function() {
            var or__3943__auto____6807 = G__6805__6806.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6807) {
              return or__3943__auto____6807
            }else {
              return G__6805__6806.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6805__6806.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6805__6806)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6805__6806)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n))
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n))
      }
    }
  };
  var nth__3 = function(coll, n, not_found) {
    if(!(coll == null)) {
      if(function() {
        var G__6808__6809 = coll;
        if(G__6808__6809) {
          if(function() {
            var or__3943__auto____6810 = G__6808__6809.cljs$lang$protocol_mask$partition0$ & 16;
            if(or__3943__auto____6810) {
              return or__3943__auto____6810
            }else {
              return G__6808__6809.cljs$core$IIndexed$
            }
          }()) {
            return true
          }else {
            if(!G__6808__6809.cljs$lang$protocol_mask$partition0$) {
              return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6808__6809)
            }else {
              return false
            }
          }
        }else {
          return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6808__6809)
        }
      }()) {
        return cljs.core._nth.call(null, coll, Math.floor(n), not_found)
      }else {
        return cljs.core.linear_traversal_nth.call(null, coll, Math.floor(n), not_found)
      }
    }else {
      return not_found
    }
  };
  nth = function(coll, n, not_found) {
    switch(arguments.length) {
      case 2:
        return nth__2.call(this, coll, n);
      case 3:
        return nth__3.call(this, coll, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  nth.cljs$lang$arity$2 = nth__2;
  nth.cljs$lang$arity$3 = nth__3;
  return nth
}();
cljs.core.get = function() {
  var get = null;
  var get__2 = function(o, k) {
    return cljs.core._lookup.call(null, o, k)
  };
  var get__3 = function(o, k, not_found) {
    return cljs.core._lookup.call(null, o, k, not_found)
  };
  get = function(o, k, not_found) {
    switch(arguments.length) {
      case 2:
        return get__2.call(this, o, k);
      case 3:
        return get__3.call(this, o, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get.cljs$lang$arity$2 = get__2;
  get.cljs$lang$arity$3 = get__3;
  return get
}();
cljs.core.assoc = function() {
  var assoc = null;
  var assoc__3 = function(coll, k, v) {
    return cljs.core._assoc.call(null, coll, k, v)
  };
  var assoc__4 = function() {
    var G__6813__delegate = function(coll, k, v, kvs) {
      while(true) {
        var ret__6812 = assoc.call(null, coll, k, v);
        if(cljs.core.truth_(kvs)) {
          var G__6814 = ret__6812;
          var G__6815 = cljs.core.first.call(null, kvs);
          var G__6816 = cljs.core.second.call(null, kvs);
          var G__6817 = cljs.core.nnext.call(null, kvs);
          coll = G__6814;
          k = G__6815;
          v = G__6816;
          kvs = G__6817;
          continue
        }else {
          return ret__6812
        }
        break
      }
    };
    var G__6813 = function(coll, k, v, var_args) {
      var kvs = null;
      if(goog.isDef(var_args)) {
        kvs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__6813__delegate.call(this, coll, k, v, kvs)
    };
    G__6813.cljs$lang$maxFixedArity = 3;
    G__6813.cljs$lang$applyTo = function(arglist__6818) {
      var coll = cljs.core.first(arglist__6818);
      var k = cljs.core.first(cljs.core.next(arglist__6818));
      var v = cljs.core.first(cljs.core.next(cljs.core.next(arglist__6818)));
      var kvs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__6818)));
      return G__6813__delegate(coll, k, v, kvs)
    };
    G__6813.cljs$lang$arity$variadic = G__6813__delegate;
    return G__6813
  }();
  assoc = function(coll, k, v, var_args) {
    var kvs = var_args;
    switch(arguments.length) {
      case 3:
        return assoc__3.call(this, coll, k, v);
      default:
        return assoc__4.cljs$lang$arity$variadic(coll, k, v, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  assoc.cljs$lang$maxFixedArity = 3;
  assoc.cljs$lang$applyTo = assoc__4.cljs$lang$applyTo;
  assoc.cljs$lang$arity$3 = assoc__3;
  assoc.cljs$lang$arity$variadic = assoc__4.cljs$lang$arity$variadic;
  return assoc
}();
cljs.core.dissoc = function() {
  var dissoc = null;
  var dissoc__1 = function(coll) {
    return coll
  };
  var dissoc__2 = function(coll, k) {
    return cljs.core._dissoc.call(null, coll, k)
  };
  var dissoc__3 = function() {
    var G__6821__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6820 = dissoc.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6822 = ret__6820;
          var G__6823 = cljs.core.first.call(null, ks);
          var G__6824 = cljs.core.next.call(null, ks);
          coll = G__6822;
          k = G__6823;
          ks = G__6824;
          continue
        }else {
          return ret__6820
        }
        break
      }
    };
    var G__6821 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6821__delegate.call(this, coll, k, ks)
    };
    G__6821.cljs$lang$maxFixedArity = 2;
    G__6821.cljs$lang$applyTo = function(arglist__6825) {
      var coll = cljs.core.first(arglist__6825);
      var k = cljs.core.first(cljs.core.next(arglist__6825));
      var ks = cljs.core.rest(cljs.core.next(arglist__6825));
      return G__6821__delegate(coll, k, ks)
    };
    G__6821.cljs$lang$arity$variadic = G__6821__delegate;
    return G__6821
  }();
  dissoc = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return dissoc__1.call(this, coll);
      case 2:
        return dissoc__2.call(this, coll, k);
      default:
        return dissoc__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  dissoc.cljs$lang$maxFixedArity = 2;
  dissoc.cljs$lang$applyTo = dissoc__3.cljs$lang$applyTo;
  dissoc.cljs$lang$arity$1 = dissoc__1;
  dissoc.cljs$lang$arity$2 = dissoc__2;
  dissoc.cljs$lang$arity$variadic = dissoc__3.cljs$lang$arity$variadic;
  return dissoc
}();
cljs.core.with_meta = function with_meta(o, meta) {
  return cljs.core._with_meta.call(null, o, meta)
};
cljs.core.meta = function meta(o) {
  if(function() {
    var G__6829__6830 = o;
    if(G__6829__6830) {
      if(function() {
        var or__3943__auto____6831 = G__6829__6830.cljs$lang$protocol_mask$partition0$ & 131072;
        if(or__3943__auto____6831) {
          return or__3943__auto____6831
        }else {
          return G__6829__6830.cljs$core$IMeta$
        }
      }()) {
        return true
      }else {
        if(!G__6829__6830.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6829__6830)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__6829__6830)
    }
  }()) {
    return cljs.core._meta.call(null, o)
  }else {
    return null
  }
};
cljs.core.peek = function peek(coll) {
  return cljs.core._peek.call(null, coll)
};
cljs.core.pop = function pop(coll) {
  return cljs.core._pop.call(null, coll)
};
cljs.core.disj = function() {
  var disj = null;
  var disj__1 = function(coll) {
    return coll
  };
  var disj__2 = function(coll, k) {
    return cljs.core._disjoin.call(null, coll, k)
  };
  var disj__3 = function() {
    var G__6834__delegate = function(coll, k, ks) {
      while(true) {
        var ret__6833 = disj.call(null, coll, k);
        if(cljs.core.truth_(ks)) {
          var G__6835 = ret__6833;
          var G__6836 = cljs.core.first.call(null, ks);
          var G__6837 = cljs.core.next.call(null, ks);
          coll = G__6835;
          k = G__6836;
          ks = G__6837;
          continue
        }else {
          return ret__6833
        }
        break
      }
    };
    var G__6834 = function(coll, k, var_args) {
      var ks = null;
      if(goog.isDef(var_args)) {
        ks = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6834__delegate.call(this, coll, k, ks)
    };
    G__6834.cljs$lang$maxFixedArity = 2;
    G__6834.cljs$lang$applyTo = function(arglist__6838) {
      var coll = cljs.core.first(arglist__6838);
      var k = cljs.core.first(cljs.core.next(arglist__6838));
      var ks = cljs.core.rest(cljs.core.next(arglist__6838));
      return G__6834__delegate(coll, k, ks)
    };
    G__6834.cljs$lang$arity$variadic = G__6834__delegate;
    return G__6834
  }();
  disj = function(coll, k, var_args) {
    var ks = var_args;
    switch(arguments.length) {
      case 1:
        return disj__1.call(this, coll);
      case 2:
        return disj__2.call(this, coll, k);
      default:
        return disj__3.cljs$lang$arity$variadic(coll, k, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  disj.cljs$lang$maxFixedArity = 2;
  disj.cljs$lang$applyTo = disj__3.cljs$lang$applyTo;
  disj.cljs$lang$arity$1 = disj__1;
  disj.cljs$lang$arity$2 = disj__2;
  disj.cljs$lang$arity$variadic = disj__3.cljs$lang$arity$variadic;
  return disj
}();
cljs.core.string_hash_cache = {};
cljs.core.string_hash_cache_count = 0;
cljs.core.add_to_string_hash_cache = function add_to_string_hash_cache(k) {
  var h__6840 = goog.string.hashCode(k);
  cljs.core.string_hash_cache[k] = h__6840;
  cljs.core.string_hash_cache_count = cljs.core.string_hash_cache_count + 1;
  return h__6840
};
cljs.core.check_string_hash_cache = function check_string_hash_cache(k) {
  if(cljs.core.string_hash_cache_count > 255) {
    cljs.core.string_hash_cache = {};
    cljs.core.string_hash_cache_count = 0
  }else {
  }
  var h__6842 = cljs.core.string_hash_cache[k];
  if(!(h__6842 == null)) {
    return h__6842
  }else {
    return cljs.core.add_to_string_hash_cache.call(null, k)
  }
};
cljs.core.hash = function() {
  var hash = null;
  var hash__1 = function(o) {
    return hash.call(null, o, true)
  };
  var hash__2 = function(o, check_cache) {
    if(function() {
      var and__3941__auto____6844 = goog.isString(o);
      if(and__3941__auto____6844) {
        return check_cache
      }else {
        return and__3941__auto____6844
      }
    }()) {
      return cljs.core.check_string_hash_cache.call(null, o)
    }else {
      return cljs.core._hash.call(null, o)
    }
  };
  hash = function(o, check_cache) {
    switch(arguments.length) {
      case 1:
        return hash__1.call(this, o);
      case 2:
        return hash__2.call(this, o, check_cache)
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash.cljs$lang$arity$1 = hash__1;
  hash.cljs$lang$arity$2 = hash__2;
  return hash
}();
cljs.core.empty_QMARK_ = function empty_QMARK_(coll) {
  return cljs.core.not.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.coll_QMARK_ = function coll_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6848__6849 = x;
    if(G__6848__6849) {
      if(function() {
        var or__3943__auto____6850 = G__6848__6849.cljs$lang$protocol_mask$partition0$ & 8;
        if(or__3943__auto____6850) {
          return or__3943__auto____6850
        }else {
          return G__6848__6849.cljs$core$ICollection$
        }
      }()) {
        return true
      }else {
        if(!G__6848__6849.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6848__6849)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ICollection, G__6848__6849)
    }
  }
};
cljs.core.set_QMARK_ = function set_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6854__6855 = x;
    if(G__6854__6855) {
      if(function() {
        var or__3943__auto____6856 = G__6854__6855.cljs$lang$protocol_mask$partition0$ & 4096;
        if(or__3943__auto____6856) {
          return or__3943__auto____6856
        }else {
          return G__6854__6855.cljs$core$ISet$
        }
      }()) {
        return true
      }else {
        if(!G__6854__6855.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6854__6855)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISet, G__6854__6855)
    }
  }
};
cljs.core.associative_QMARK_ = function associative_QMARK_(x) {
  var G__6860__6861 = x;
  if(G__6860__6861) {
    if(function() {
      var or__3943__auto____6862 = G__6860__6861.cljs$lang$protocol_mask$partition0$ & 512;
      if(or__3943__auto____6862) {
        return or__3943__auto____6862
      }else {
        return G__6860__6861.cljs$core$IAssociative$
      }
    }()) {
      return true
    }else {
      if(!G__6860__6861.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6860__6861)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IAssociative, G__6860__6861)
  }
};
cljs.core.sequential_QMARK_ = function sequential_QMARK_(x) {
  var G__6866__6867 = x;
  if(G__6866__6867) {
    if(function() {
      var or__3943__auto____6868 = G__6866__6867.cljs$lang$protocol_mask$partition0$ & 16777216;
      if(or__3943__auto____6868) {
        return or__3943__auto____6868
      }else {
        return G__6866__6867.cljs$core$ISequential$
      }
    }()) {
      return true
    }else {
      if(!G__6866__6867.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6866__6867)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISequential, G__6866__6867)
  }
};
cljs.core.counted_QMARK_ = function counted_QMARK_(x) {
  var G__6872__6873 = x;
  if(G__6872__6873) {
    if(function() {
      var or__3943__auto____6874 = G__6872__6873.cljs$lang$protocol_mask$partition0$ & 2;
      if(or__3943__auto____6874) {
        return or__3943__auto____6874
      }else {
        return G__6872__6873.cljs$core$ICounted$
      }
    }()) {
      return true
    }else {
      if(!G__6872__6873.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6872__6873)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ICounted, G__6872__6873)
  }
};
cljs.core.indexed_QMARK_ = function indexed_QMARK_(x) {
  var G__6878__6879 = x;
  if(G__6878__6879) {
    if(function() {
      var or__3943__auto____6880 = G__6878__6879.cljs$lang$protocol_mask$partition0$ & 16;
      if(or__3943__auto____6880) {
        return or__3943__auto____6880
      }else {
        return G__6878__6879.cljs$core$IIndexed$
      }
    }()) {
      return true
    }else {
      if(!G__6878__6879.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6878__6879)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IIndexed, G__6878__6879)
  }
};
cljs.core.reduceable_QMARK_ = function reduceable_QMARK_(x) {
  var G__6884__6885 = x;
  if(G__6884__6885) {
    if(function() {
      var or__3943__auto____6886 = G__6884__6885.cljs$lang$protocol_mask$partition0$ & 524288;
      if(or__3943__auto____6886) {
        return or__3943__auto____6886
      }else {
        return G__6884__6885.cljs$core$IReduce$
      }
    }()) {
      return true
    }else {
      if(!G__6884__6885.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6884__6885)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__6884__6885)
  }
};
cljs.core.map_QMARK_ = function map_QMARK_(x) {
  if(x == null) {
    return false
  }else {
    var G__6890__6891 = x;
    if(G__6890__6891) {
      if(function() {
        var or__3943__auto____6892 = G__6890__6891.cljs$lang$protocol_mask$partition0$ & 1024;
        if(or__3943__auto____6892) {
          return or__3943__auto____6892
        }else {
          return G__6890__6891.cljs$core$IMap$
        }
      }()) {
        return true
      }else {
        if(!G__6890__6891.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6890__6891)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IMap, G__6890__6891)
    }
  }
};
cljs.core.vector_QMARK_ = function vector_QMARK_(x) {
  var G__6896__6897 = x;
  if(G__6896__6897) {
    if(function() {
      var or__3943__auto____6898 = G__6896__6897.cljs$lang$protocol_mask$partition0$ & 16384;
      if(or__3943__auto____6898) {
        return or__3943__auto____6898
      }else {
        return G__6896__6897.cljs$core$IVector$
      }
    }()) {
      return true
    }else {
      if(!G__6896__6897.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6896__6897)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IVector, G__6896__6897)
  }
};
cljs.core.chunked_seq_QMARK_ = function chunked_seq_QMARK_(x) {
  var G__6902__6903 = x;
  if(G__6902__6903) {
    if(cljs.core.truth_(function() {
      var or__3943__auto____6904 = null;
      if(cljs.core.truth_(or__3943__auto____6904)) {
        return or__3943__auto____6904
      }else {
        return G__6902__6903.cljs$core$IChunkedSeq$
      }
    }())) {
      return true
    }else {
      if(!G__6902__6903.cljs$lang$protocol_mask$partition$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6902__6903)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedSeq, G__6902__6903)
  }
};
cljs.core.js_obj = function() {
  var js_obj = null;
  var js_obj__0 = function() {
    return{}
  };
  var js_obj__1 = function() {
    var G__6905__delegate = function(keyvals) {
      return cljs.core.apply.call(null, goog.object.create, keyvals)
    };
    var G__6905 = function(var_args) {
      var keyvals = null;
      if(goog.isDef(var_args)) {
        keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__6905__delegate.call(this, keyvals)
    };
    G__6905.cljs$lang$maxFixedArity = 0;
    G__6905.cljs$lang$applyTo = function(arglist__6906) {
      var keyvals = cljs.core.seq(arglist__6906);
      return G__6905__delegate(keyvals)
    };
    G__6905.cljs$lang$arity$variadic = G__6905__delegate;
    return G__6905
  }();
  js_obj = function(var_args) {
    var keyvals = var_args;
    switch(arguments.length) {
      case 0:
        return js_obj__0.call(this);
      default:
        return js_obj__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  js_obj.cljs$lang$maxFixedArity = 0;
  js_obj.cljs$lang$applyTo = js_obj__1.cljs$lang$applyTo;
  js_obj.cljs$lang$arity$0 = js_obj__0;
  js_obj.cljs$lang$arity$variadic = js_obj__1.cljs$lang$arity$variadic;
  return js_obj
}();
cljs.core.js_keys = function js_keys(obj) {
  var keys__6908 = [];
  goog.object.forEach(obj, function(val, key, obj) {
    return keys__6908.push(key)
  });
  return keys__6908
};
cljs.core.js_delete = function js_delete(obj, key) {
  return delete obj[key]
};
cljs.core.array_copy = function array_copy(from, i, to, j, len) {
  var i__6912 = i;
  var j__6913 = j;
  var len__6914 = len;
  while(true) {
    if(len__6914 === 0) {
      return to
    }else {
      to[j__6913] = from[i__6912];
      var G__6915 = i__6912 + 1;
      var G__6916 = j__6913 + 1;
      var G__6917 = len__6914 - 1;
      i__6912 = G__6915;
      j__6913 = G__6916;
      len__6914 = G__6917;
      continue
    }
    break
  }
};
cljs.core.array_copy_downward = function array_copy_downward(from, i, to, j, len) {
  var i__6921 = i + (len - 1);
  var j__6922 = j + (len - 1);
  var len__6923 = len;
  while(true) {
    if(len__6923 === 0) {
      return to
    }else {
      to[j__6922] = from[i__6921];
      var G__6924 = i__6921 - 1;
      var G__6925 = j__6922 - 1;
      var G__6926 = len__6923 - 1;
      i__6921 = G__6924;
      j__6922 = G__6925;
      len__6923 = G__6926;
      continue
    }
    break
  }
};
cljs.core.lookup_sentinel = {};
cljs.core.false_QMARK_ = function false_QMARK_(x) {
  return x === false
};
cljs.core.true_QMARK_ = function true_QMARK_(x) {
  return x === true
};
cljs.core.undefined_QMARK_ = function undefined_QMARK_(x) {
  return void 0 === x
};
cljs.core.seq_QMARK_ = function seq_QMARK_(s) {
  if(s == null) {
    return false
  }else {
    var G__6930__6931 = s;
    if(G__6930__6931) {
      if(function() {
        var or__3943__auto____6932 = G__6930__6931.cljs$lang$protocol_mask$partition0$ & 64;
        if(or__3943__auto____6932) {
          return or__3943__auto____6932
        }else {
          return G__6930__6931.cljs$core$ISeq$
        }
      }()) {
        return true
      }else {
        if(!G__6930__6931.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6930__6931)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__6930__6931)
    }
  }
};
cljs.core.seqable_QMARK_ = function seqable_QMARK_(s) {
  var G__6936__6937 = s;
  if(G__6936__6937) {
    if(function() {
      var or__3943__auto____6938 = G__6936__6937.cljs$lang$protocol_mask$partition0$ & 8388608;
      if(or__3943__auto____6938) {
        return or__3943__auto____6938
      }else {
        return G__6936__6937.cljs$core$ISeqable$
      }
    }()) {
      return true
    }else {
      if(!G__6936__6937.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6936__6937)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.ISeqable, G__6936__6937)
  }
};
cljs.core.boolean$ = function boolean$(x) {
  if(cljs.core.truth_(x)) {
    return true
  }else {
    return false
  }
};
cljs.core.string_QMARK_ = function string_QMARK_(x) {
  var and__3941__auto____6941 = goog.isString(x);
  if(and__3941__auto____6941) {
    return!function() {
      var or__3943__auto____6942 = x.charAt(0) === "\ufdd0";
      if(or__3943__auto____6942) {
        return or__3943__auto____6942
      }else {
        return x.charAt(0) === "\ufdd1"
      }
    }()
  }else {
    return and__3941__auto____6941
  }
};
cljs.core.keyword_QMARK_ = function keyword_QMARK_(x) {
  var and__3941__auto____6944 = goog.isString(x);
  if(and__3941__auto____6944) {
    return x.charAt(0) === "\ufdd0"
  }else {
    return and__3941__auto____6944
  }
};
cljs.core.symbol_QMARK_ = function symbol_QMARK_(x) {
  var and__3941__auto____6946 = goog.isString(x);
  if(and__3941__auto____6946) {
    return x.charAt(0) === "\ufdd1"
  }else {
    return and__3941__auto____6946
  }
};
cljs.core.number_QMARK_ = function number_QMARK_(n) {
  return goog.isNumber(n)
};
cljs.core.fn_QMARK_ = function fn_QMARK_(f) {
  return goog.isFunction(f)
};
cljs.core.ifn_QMARK_ = function ifn_QMARK_(f) {
  var or__3943__auto____6951 = cljs.core.fn_QMARK_.call(null, f);
  if(or__3943__auto____6951) {
    return or__3943__auto____6951
  }else {
    var G__6952__6953 = f;
    if(G__6952__6953) {
      if(function() {
        var or__3943__auto____6954 = G__6952__6953.cljs$lang$protocol_mask$partition0$ & 1;
        if(or__3943__auto____6954) {
          return or__3943__auto____6954
        }else {
          return G__6952__6953.cljs$core$IFn$
        }
      }()) {
        return true
      }else {
        if(!G__6952__6953.cljs$lang$protocol_mask$partition0$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6952__6953)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IFn, G__6952__6953)
    }
  }
};
cljs.core.integer_QMARK_ = function integer_QMARK_(n) {
  var and__3941__auto____6956 = cljs.core.number_QMARK_.call(null, n);
  if(and__3941__auto____6956) {
    return n == n.toFixed()
  }else {
    return and__3941__auto____6956
  }
};
cljs.core.contains_QMARK_ = function contains_QMARK_(coll, v) {
  if(cljs.core._lookup.call(null, coll, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return false
  }else {
    return true
  }
};
cljs.core.find = function find(coll, k) {
  if(cljs.core.truth_(function() {
    var and__3941__auto____6959 = coll;
    if(cljs.core.truth_(and__3941__auto____6959)) {
      var and__3941__auto____6960 = cljs.core.associative_QMARK_.call(null, coll);
      if(and__3941__auto____6960) {
        return cljs.core.contains_QMARK_.call(null, coll, k)
      }else {
        return and__3941__auto____6960
      }
    }else {
      return and__3941__auto____6959
    }
  }())) {
    return cljs.core.PersistentVector.fromArray([k, cljs.core._lookup.call(null, coll, k)], true)
  }else {
    return null
  }
};
cljs.core.distinct_QMARK_ = function() {
  var distinct_QMARK_ = null;
  var distinct_QMARK___1 = function(x) {
    return true
  };
  var distinct_QMARK___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var distinct_QMARK___3 = function() {
    var G__6969__delegate = function(x, y, more) {
      if(!cljs.core._EQ_.call(null, x, y)) {
        var s__6965 = cljs.core.PersistentHashSet.fromArray([y, x]);
        var xs__6966 = more;
        while(true) {
          var x__6967 = cljs.core.first.call(null, xs__6966);
          var etc__6968 = cljs.core.next.call(null, xs__6966);
          if(cljs.core.truth_(xs__6966)) {
            if(cljs.core.contains_QMARK_.call(null, s__6965, x__6967)) {
              return false
            }else {
              var G__6970 = cljs.core.conj.call(null, s__6965, x__6967);
              var G__6971 = etc__6968;
              s__6965 = G__6970;
              xs__6966 = G__6971;
              continue
            }
          }else {
            return true
          }
          break
        }
      }else {
        return false
      }
    };
    var G__6969 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__6969__delegate.call(this, x, y, more)
    };
    G__6969.cljs$lang$maxFixedArity = 2;
    G__6969.cljs$lang$applyTo = function(arglist__6972) {
      var x = cljs.core.first(arglist__6972);
      var y = cljs.core.first(cljs.core.next(arglist__6972));
      var more = cljs.core.rest(cljs.core.next(arglist__6972));
      return G__6969__delegate(x, y, more)
    };
    G__6969.cljs$lang$arity$variadic = G__6969__delegate;
    return G__6969
  }();
  distinct_QMARK_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return distinct_QMARK___1.call(this, x);
      case 2:
        return distinct_QMARK___2.call(this, x, y);
      default:
        return distinct_QMARK___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  distinct_QMARK_.cljs$lang$maxFixedArity = 2;
  distinct_QMARK_.cljs$lang$applyTo = distinct_QMARK___3.cljs$lang$applyTo;
  distinct_QMARK_.cljs$lang$arity$1 = distinct_QMARK___1;
  distinct_QMARK_.cljs$lang$arity$2 = distinct_QMARK___2;
  distinct_QMARK_.cljs$lang$arity$variadic = distinct_QMARK___3.cljs$lang$arity$variadic;
  return distinct_QMARK_
}();
cljs.core.compare = function compare(x, y) {
  if(x === y) {
    return 0
  }else {
    if(x == null) {
      return-1
    }else {
      if(y == null) {
        return 1
      }else {
        if(cljs.core.type.call(null, x) === cljs.core.type.call(null, y)) {
          if(function() {
            var G__6976__6977 = x;
            if(G__6976__6977) {
              if(cljs.core.truth_(function() {
                var or__3943__auto____6978 = null;
                if(cljs.core.truth_(or__3943__auto____6978)) {
                  return or__3943__auto____6978
                }else {
                  return G__6976__6977.cljs$core$IComparable$
                }
              }())) {
                return true
              }else {
                if(!G__6976__6977.cljs$lang$protocol_mask$partition$) {
                  return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6976__6977)
                }else {
                  return false
                }
              }
            }else {
              return cljs.core.type_satisfies_.call(null, cljs.core.IComparable, G__6976__6977)
            }
          }()) {
            return cljs.core._compare.call(null, x, y)
          }else {
            return goog.array.defaultCompare(x, y)
          }
        }else {
          if("\ufdd0'else") {
            throw new Error("compare on non-nil objects of different types");
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.compare_indexed = function() {
  var compare_indexed = null;
  var compare_indexed__2 = function(xs, ys) {
    var xl__6983 = cljs.core.count.call(null, xs);
    var yl__6984 = cljs.core.count.call(null, ys);
    if(xl__6983 < yl__6984) {
      return-1
    }else {
      if(xl__6983 > yl__6984) {
        return 1
      }else {
        if("\ufdd0'else") {
          return compare_indexed.call(null, xs, ys, xl__6983, 0)
        }else {
          return null
        }
      }
    }
  };
  var compare_indexed__4 = function(xs, ys, len, n) {
    while(true) {
      var d__6985 = cljs.core.compare.call(null, cljs.core.nth.call(null, xs, n), cljs.core.nth.call(null, ys, n));
      if(function() {
        var and__3941__auto____6986 = d__6985 === 0;
        if(and__3941__auto____6986) {
          return n + 1 < len
        }else {
          return and__3941__auto____6986
        }
      }()) {
        var G__6987 = xs;
        var G__6988 = ys;
        var G__6989 = len;
        var G__6990 = n + 1;
        xs = G__6987;
        ys = G__6988;
        len = G__6989;
        n = G__6990;
        continue
      }else {
        return d__6985
      }
      break
    }
  };
  compare_indexed = function(xs, ys, len, n) {
    switch(arguments.length) {
      case 2:
        return compare_indexed__2.call(this, xs, ys);
      case 4:
        return compare_indexed__4.call(this, xs, ys, len, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  compare_indexed.cljs$lang$arity$2 = compare_indexed__2;
  compare_indexed.cljs$lang$arity$4 = compare_indexed__4;
  return compare_indexed
}();
cljs.core.fn__GT_comparator = function fn__GT_comparator(f) {
  if(cljs.core._EQ_.call(null, f, cljs.core.compare)) {
    return cljs.core.compare
  }else {
    return function(x, y) {
      var r__6992 = f.call(null, x, y);
      if(cljs.core.number_QMARK_.call(null, r__6992)) {
        return r__6992
      }else {
        if(cljs.core.truth_(r__6992)) {
          return-1
        }else {
          if(cljs.core.truth_(f.call(null, y, x))) {
            return 1
          }else {
            return 0
          }
        }
      }
    }
  }
};
cljs.core.sort = function() {
  var sort = null;
  var sort__1 = function(coll) {
    return sort.call(null, cljs.core.compare, coll)
  };
  var sort__2 = function(comp, coll) {
    if(cljs.core.seq.call(null, coll)) {
      var a__6994 = cljs.core.to_array.call(null, coll);
      goog.array.stableSort(a__6994, cljs.core.fn__GT_comparator.call(null, comp));
      return cljs.core.seq.call(null, a__6994)
    }else {
      return cljs.core.List.EMPTY
    }
  };
  sort = function(comp, coll) {
    switch(arguments.length) {
      case 1:
        return sort__1.call(this, comp);
      case 2:
        return sort__2.call(this, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort.cljs$lang$arity$1 = sort__1;
  sort.cljs$lang$arity$2 = sort__2;
  return sort
}();
cljs.core.sort_by = function() {
  var sort_by = null;
  var sort_by__2 = function(keyfn, coll) {
    return sort_by.call(null, keyfn, cljs.core.compare, coll)
  };
  var sort_by__3 = function(keyfn, comp, coll) {
    return cljs.core.sort.call(null, function(x, y) {
      return cljs.core.fn__GT_comparator.call(null, comp).call(null, keyfn.call(null, x), keyfn.call(null, y))
    }, coll)
  };
  sort_by = function(keyfn, comp, coll) {
    switch(arguments.length) {
      case 2:
        return sort_by__2.call(this, keyfn, comp);
      case 3:
        return sort_by__3.call(this, keyfn, comp, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  sort_by.cljs$lang$arity$2 = sort_by__2;
  sort_by.cljs$lang$arity$3 = sort_by__3;
  return sort_by
}();
cljs.core.seq_reduce = function() {
  var seq_reduce = null;
  var seq_reduce__2 = function(f, coll) {
    var temp__4090__auto____7000 = cljs.core.seq.call(null, coll);
    if(temp__4090__auto____7000) {
      var s__7001 = temp__4090__auto____7000;
      return cljs.core.reduce.call(null, f, cljs.core.first.call(null, s__7001), cljs.core.next.call(null, s__7001))
    }else {
      return f.call(null)
    }
  };
  var seq_reduce__3 = function(f, val, coll) {
    var val__7002 = val;
    var coll__7003 = cljs.core.seq.call(null, coll);
    while(true) {
      if(coll__7003) {
        var nval__7004 = f.call(null, val__7002, cljs.core.first.call(null, coll__7003));
        if(cljs.core.reduced_QMARK_.call(null, nval__7004)) {
          return cljs.core.deref.call(null, nval__7004)
        }else {
          var G__7005 = nval__7004;
          var G__7006 = cljs.core.next.call(null, coll__7003);
          val__7002 = G__7005;
          coll__7003 = G__7006;
          continue
        }
      }else {
        return val__7002
      }
      break
    }
  };
  seq_reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return seq_reduce__2.call(this, f, val);
      case 3:
        return seq_reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  seq_reduce.cljs$lang$arity$2 = seq_reduce__2;
  seq_reduce.cljs$lang$arity$3 = seq_reduce__3;
  return seq_reduce
}();
cljs.core.shuffle = function shuffle(coll) {
  var a__7008 = cljs.core.to_array.call(null, coll);
  goog.array.shuffle(a__7008);
  return cljs.core.vec.call(null, a__7008)
};
cljs.core.reduce = function() {
  var reduce = null;
  var reduce__2 = function(f, coll) {
    if(function() {
      var G__7015__7016 = coll;
      if(G__7015__7016) {
        if(function() {
          var or__3943__auto____7017 = G__7015__7016.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7017) {
            return or__3943__auto____7017
          }else {
            return G__7015__7016.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7015__7016.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7015__7016)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7015__7016)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f)
    }else {
      return cljs.core.seq_reduce.call(null, f, coll)
    }
  };
  var reduce__3 = function(f, val, coll) {
    if(function() {
      var G__7018__7019 = coll;
      if(G__7018__7019) {
        if(function() {
          var or__3943__auto____7020 = G__7018__7019.cljs$lang$protocol_mask$partition0$ & 524288;
          if(or__3943__auto____7020) {
            return or__3943__auto____7020
          }else {
            return G__7018__7019.cljs$core$IReduce$
          }
        }()) {
          return true
        }else {
          if(!G__7018__7019.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7018__7019)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReduce, G__7018__7019)
      }
    }()) {
      return cljs.core._reduce.call(null, coll, f, val)
    }else {
      return cljs.core.seq_reduce.call(null, f, val, coll)
    }
  };
  reduce = function(f, val, coll) {
    switch(arguments.length) {
      case 2:
        return reduce__2.call(this, f, val);
      case 3:
        return reduce__3.call(this, f, val, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reduce.cljs$lang$arity$2 = reduce__2;
  reduce.cljs$lang$arity$3 = reduce__3;
  return reduce
}();
cljs.core.reduce_kv = function reduce_kv(f, init, coll) {
  return cljs.core._kv_reduce.call(null, coll, f, init)
};
cljs.core.Reduced = function(val) {
  this.val = val;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32768
};
cljs.core.Reduced.cljs$lang$type = true;
cljs.core.Reduced.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Reduced")
};
cljs.core.Reduced.prototype.cljs$core$IDeref$_deref$arity$1 = function(o) {
  var this__7021 = this;
  return this__7021.val
};
cljs.core.Reduced;
cljs.core.reduced_QMARK_ = function reduced_QMARK_(r) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Reduced, r)
};
cljs.core.reduced = function reduced(x) {
  return new cljs.core.Reduced(x)
};
cljs.core._PLUS_ = function() {
  var _PLUS_ = null;
  var _PLUS___0 = function() {
    return 0
  };
  var _PLUS___1 = function(x) {
    return x
  };
  var _PLUS___2 = function(x, y) {
    return x + y
  };
  var _PLUS___3 = function() {
    var G__7022__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _PLUS_, x + y, more)
    };
    var G__7022 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7022__delegate.call(this, x, y, more)
    };
    G__7022.cljs$lang$maxFixedArity = 2;
    G__7022.cljs$lang$applyTo = function(arglist__7023) {
      var x = cljs.core.first(arglist__7023);
      var y = cljs.core.first(cljs.core.next(arglist__7023));
      var more = cljs.core.rest(cljs.core.next(arglist__7023));
      return G__7022__delegate(x, y, more)
    };
    G__7022.cljs$lang$arity$variadic = G__7022__delegate;
    return G__7022
  }();
  _PLUS_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _PLUS___0.call(this);
      case 1:
        return _PLUS___1.call(this, x);
      case 2:
        return _PLUS___2.call(this, x, y);
      default:
        return _PLUS___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _PLUS_.cljs$lang$maxFixedArity = 2;
  _PLUS_.cljs$lang$applyTo = _PLUS___3.cljs$lang$applyTo;
  _PLUS_.cljs$lang$arity$0 = _PLUS___0;
  _PLUS_.cljs$lang$arity$1 = _PLUS___1;
  _PLUS_.cljs$lang$arity$2 = _PLUS___2;
  _PLUS_.cljs$lang$arity$variadic = _PLUS___3.cljs$lang$arity$variadic;
  return _PLUS_
}();
cljs.core._ = function() {
  var _ = null;
  var ___1 = function(x) {
    return-x
  };
  var ___2 = function(x, y) {
    return x - y
  };
  var ___3 = function() {
    var G__7024__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _, x - y, more)
    };
    var G__7024 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7024__delegate.call(this, x, y, more)
    };
    G__7024.cljs$lang$maxFixedArity = 2;
    G__7024.cljs$lang$applyTo = function(arglist__7025) {
      var x = cljs.core.first(arglist__7025);
      var y = cljs.core.first(cljs.core.next(arglist__7025));
      var more = cljs.core.rest(cljs.core.next(arglist__7025));
      return G__7024__delegate(x, y, more)
    };
    G__7024.cljs$lang$arity$variadic = G__7024__delegate;
    return G__7024
  }();
  _ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return ___1.call(this, x);
      case 2:
        return ___2.call(this, x, y);
      default:
        return ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _.cljs$lang$maxFixedArity = 2;
  _.cljs$lang$applyTo = ___3.cljs$lang$applyTo;
  _.cljs$lang$arity$1 = ___1;
  _.cljs$lang$arity$2 = ___2;
  _.cljs$lang$arity$variadic = ___3.cljs$lang$arity$variadic;
  return _
}();
cljs.core._STAR_ = function() {
  var _STAR_ = null;
  var _STAR___0 = function() {
    return 1
  };
  var _STAR___1 = function(x) {
    return x
  };
  var _STAR___2 = function(x, y) {
    return x * y
  };
  var _STAR___3 = function() {
    var G__7026__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _STAR_, x * y, more)
    };
    var G__7026 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7026__delegate.call(this, x, y, more)
    };
    G__7026.cljs$lang$maxFixedArity = 2;
    G__7026.cljs$lang$applyTo = function(arglist__7027) {
      var x = cljs.core.first(arglist__7027);
      var y = cljs.core.first(cljs.core.next(arglist__7027));
      var more = cljs.core.rest(cljs.core.next(arglist__7027));
      return G__7026__delegate(x, y, more)
    };
    G__7026.cljs$lang$arity$variadic = G__7026__delegate;
    return G__7026
  }();
  _STAR_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 0:
        return _STAR___0.call(this);
      case 1:
        return _STAR___1.call(this, x);
      case 2:
        return _STAR___2.call(this, x, y);
      default:
        return _STAR___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _STAR_.cljs$lang$maxFixedArity = 2;
  _STAR_.cljs$lang$applyTo = _STAR___3.cljs$lang$applyTo;
  _STAR_.cljs$lang$arity$0 = _STAR___0;
  _STAR_.cljs$lang$arity$1 = _STAR___1;
  _STAR_.cljs$lang$arity$2 = _STAR___2;
  _STAR_.cljs$lang$arity$variadic = _STAR___3.cljs$lang$arity$variadic;
  return _STAR_
}();
cljs.core._SLASH_ = function() {
  var _SLASH_ = null;
  var _SLASH___1 = function(x) {
    return _SLASH_.call(null, 1, x)
  };
  var _SLASH___2 = function(x, y) {
    return x / y
  };
  var _SLASH___3 = function() {
    var G__7028__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, _SLASH_, _SLASH_.call(null, x, y), more)
    };
    var G__7028 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7028__delegate.call(this, x, y, more)
    };
    G__7028.cljs$lang$maxFixedArity = 2;
    G__7028.cljs$lang$applyTo = function(arglist__7029) {
      var x = cljs.core.first(arglist__7029);
      var y = cljs.core.first(cljs.core.next(arglist__7029));
      var more = cljs.core.rest(cljs.core.next(arglist__7029));
      return G__7028__delegate(x, y, more)
    };
    G__7028.cljs$lang$arity$variadic = G__7028__delegate;
    return G__7028
  }();
  _SLASH_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _SLASH___1.call(this, x);
      case 2:
        return _SLASH___2.call(this, x, y);
      default:
        return _SLASH___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _SLASH_.cljs$lang$maxFixedArity = 2;
  _SLASH_.cljs$lang$applyTo = _SLASH___3.cljs$lang$applyTo;
  _SLASH_.cljs$lang$arity$1 = _SLASH___1;
  _SLASH_.cljs$lang$arity$2 = _SLASH___2;
  _SLASH_.cljs$lang$arity$variadic = _SLASH___3.cljs$lang$arity$variadic;
  return _SLASH_
}();
cljs.core._LT_ = function() {
  var _LT_ = null;
  var _LT___1 = function(x) {
    return true
  };
  var _LT___2 = function(x, y) {
    return x < y
  };
  var _LT___3 = function() {
    var G__7030__delegate = function(x, y, more) {
      while(true) {
        if(x < y) {
          if(cljs.core.next.call(null, more)) {
            var G__7031 = y;
            var G__7032 = cljs.core.first.call(null, more);
            var G__7033 = cljs.core.next.call(null, more);
            x = G__7031;
            y = G__7032;
            more = G__7033;
            continue
          }else {
            return y < cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7030 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7030__delegate.call(this, x, y, more)
    };
    G__7030.cljs$lang$maxFixedArity = 2;
    G__7030.cljs$lang$applyTo = function(arglist__7034) {
      var x = cljs.core.first(arglist__7034);
      var y = cljs.core.first(cljs.core.next(arglist__7034));
      var more = cljs.core.rest(cljs.core.next(arglist__7034));
      return G__7030__delegate(x, y, more)
    };
    G__7030.cljs$lang$arity$variadic = G__7030__delegate;
    return G__7030
  }();
  _LT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT___1.call(this, x);
      case 2:
        return _LT___2.call(this, x, y);
      default:
        return _LT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT_.cljs$lang$maxFixedArity = 2;
  _LT_.cljs$lang$applyTo = _LT___3.cljs$lang$applyTo;
  _LT_.cljs$lang$arity$1 = _LT___1;
  _LT_.cljs$lang$arity$2 = _LT___2;
  _LT_.cljs$lang$arity$variadic = _LT___3.cljs$lang$arity$variadic;
  return _LT_
}();
cljs.core._LT__EQ_ = function() {
  var _LT__EQ_ = null;
  var _LT__EQ___1 = function(x) {
    return true
  };
  var _LT__EQ___2 = function(x, y) {
    return x <= y
  };
  var _LT__EQ___3 = function() {
    var G__7035__delegate = function(x, y, more) {
      while(true) {
        if(x <= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7036 = y;
            var G__7037 = cljs.core.first.call(null, more);
            var G__7038 = cljs.core.next.call(null, more);
            x = G__7036;
            y = G__7037;
            more = G__7038;
            continue
          }else {
            return y <= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7035 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7035__delegate.call(this, x, y, more)
    };
    G__7035.cljs$lang$maxFixedArity = 2;
    G__7035.cljs$lang$applyTo = function(arglist__7039) {
      var x = cljs.core.first(arglist__7039);
      var y = cljs.core.first(cljs.core.next(arglist__7039));
      var more = cljs.core.rest(cljs.core.next(arglist__7039));
      return G__7035__delegate(x, y, more)
    };
    G__7035.cljs$lang$arity$variadic = G__7035__delegate;
    return G__7035
  }();
  _LT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _LT__EQ___1.call(this, x);
      case 2:
        return _LT__EQ___2.call(this, x, y);
      default:
        return _LT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _LT__EQ_.cljs$lang$maxFixedArity = 2;
  _LT__EQ_.cljs$lang$applyTo = _LT__EQ___3.cljs$lang$applyTo;
  _LT__EQ_.cljs$lang$arity$1 = _LT__EQ___1;
  _LT__EQ_.cljs$lang$arity$2 = _LT__EQ___2;
  _LT__EQ_.cljs$lang$arity$variadic = _LT__EQ___3.cljs$lang$arity$variadic;
  return _LT__EQ_
}();
cljs.core._GT_ = function() {
  var _GT_ = null;
  var _GT___1 = function(x) {
    return true
  };
  var _GT___2 = function(x, y) {
    return x > y
  };
  var _GT___3 = function() {
    var G__7040__delegate = function(x, y, more) {
      while(true) {
        if(x > y) {
          if(cljs.core.next.call(null, more)) {
            var G__7041 = y;
            var G__7042 = cljs.core.first.call(null, more);
            var G__7043 = cljs.core.next.call(null, more);
            x = G__7041;
            y = G__7042;
            more = G__7043;
            continue
          }else {
            return y > cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7040 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7040__delegate.call(this, x, y, more)
    };
    G__7040.cljs$lang$maxFixedArity = 2;
    G__7040.cljs$lang$applyTo = function(arglist__7044) {
      var x = cljs.core.first(arglist__7044);
      var y = cljs.core.first(cljs.core.next(arglist__7044));
      var more = cljs.core.rest(cljs.core.next(arglist__7044));
      return G__7040__delegate(x, y, more)
    };
    G__7040.cljs$lang$arity$variadic = G__7040__delegate;
    return G__7040
  }();
  _GT_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT___1.call(this, x);
      case 2:
        return _GT___2.call(this, x, y);
      default:
        return _GT___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT_.cljs$lang$maxFixedArity = 2;
  _GT_.cljs$lang$applyTo = _GT___3.cljs$lang$applyTo;
  _GT_.cljs$lang$arity$1 = _GT___1;
  _GT_.cljs$lang$arity$2 = _GT___2;
  _GT_.cljs$lang$arity$variadic = _GT___3.cljs$lang$arity$variadic;
  return _GT_
}();
cljs.core._GT__EQ_ = function() {
  var _GT__EQ_ = null;
  var _GT__EQ___1 = function(x) {
    return true
  };
  var _GT__EQ___2 = function(x, y) {
    return x >= y
  };
  var _GT__EQ___3 = function() {
    var G__7045__delegate = function(x, y, more) {
      while(true) {
        if(x >= y) {
          if(cljs.core.next.call(null, more)) {
            var G__7046 = y;
            var G__7047 = cljs.core.first.call(null, more);
            var G__7048 = cljs.core.next.call(null, more);
            x = G__7046;
            y = G__7047;
            more = G__7048;
            continue
          }else {
            return y >= cljs.core.first.call(null, more)
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7045 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7045__delegate.call(this, x, y, more)
    };
    G__7045.cljs$lang$maxFixedArity = 2;
    G__7045.cljs$lang$applyTo = function(arglist__7049) {
      var x = cljs.core.first(arglist__7049);
      var y = cljs.core.first(cljs.core.next(arglist__7049));
      var more = cljs.core.rest(cljs.core.next(arglist__7049));
      return G__7045__delegate(x, y, more)
    };
    G__7045.cljs$lang$arity$variadic = G__7045__delegate;
    return G__7045
  }();
  _GT__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _GT__EQ___1.call(this, x);
      case 2:
        return _GT__EQ___2.call(this, x, y);
      default:
        return _GT__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _GT__EQ_.cljs$lang$maxFixedArity = 2;
  _GT__EQ_.cljs$lang$applyTo = _GT__EQ___3.cljs$lang$applyTo;
  _GT__EQ_.cljs$lang$arity$1 = _GT__EQ___1;
  _GT__EQ_.cljs$lang$arity$2 = _GT__EQ___2;
  _GT__EQ_.cljs$lang$arity$variadic = _GT__EQ___3.cljs$lang$arity$variadic;
  return _GT__EQ_
}();
cljs.core.dec = function dec(x) {
  return x - 1
};
cljs.core.max = function() {
  var max = null;
  var max__1 = function(x) {
    return x
  };
  var max__2 = function(x, y) {
    return x > y ? x : y
  };
  var max__3 = function() {
    var G__7050__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, max, x > y ? x : y, more)
    };
    var G__7050 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7050__delegate.call(this, x, y, more)
    };
    G__7050.cljs$lang$maxFixedArity = 2;
    G__7050.cljs$lang$applyTo = function(arglist__7051) {
      var x = cljs.core.first(arglist__7051);
      var y = cljs.core.first(cljs.core.next(arglist__7051));
      var more = cljs.core.rest(cljs.core.next(arglist__7051));
      return G__7050__delegate(x, y, more)
    };
    G__7050.cljs$lang$arity$variadic = G__7050__delegate;
    return G__7050
  }();
  max = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return max__1.call(this, x);
      case 2:
        return max__2.call(this, x, y);
      default:
        return max__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max.cljs$lang$maxFixedArity = 2;
  max.cljs$lang$applyTo = max__3.cljs$lang$applyTo;
  max.cljs$lang$arity$1 = max__1;
  max.cljs$lang$arity$2 = max__2;
  max.cljs$lang$arity$variadic = max__3.cljs$lang$arity$variadic;
  return max
}();
cljs.core.min = function() {
  var min = null;
  var min__1 = function(x) {
    return x
  };
  var min__2 = function(x, y) {
    return x < y ? x : y
  };
  var min__3 = function() {
    var G__7052__delegate = function(x, y, more) {
      return cljs.core.reduce.call(null, min, x < y ? x : y, more)
    };
    var G__7052 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7052__delegate.call(this, x, y, more)
    };
    G__7052.cljs$lang$maxFixedArity = 2;
    G__7052.cljs$lang$applyTo = function(arglist__7053) {
      var x = cljs.core.first(arglist__7053);
      var y = cljs.core.first(cljs.core.next(arglist__7053));
      var more = cljs.core.rest(cljs.core.next(arglist__7053));
      return G__7052__delegate(x, y, more)
    };
    G__7052.cljs$lang$arity$variadic = G__7052__delegate;
    return G__7052
  }();
  min = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return min__1.call(this, x);
      case 2:
        return min__2.call(this, x, y);
      default:
        return min__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min.cljs$lang$maxFixedArity = 2;
  min.cljs$lang$applyTo = min__3.cljs$lang$applyTo;
  min.cljs$lang$arity$1 = min__1;
  min.cljs$lang$arity$2 = min__2;
  min.cljs$lang$arity$variadic = min__3.cljs$lang$arity$variadic;
  return min
}();
cljs.core.fix = function fix(q) {
  if(q >= 0) {
    return Math.floor.call(null, q)
  }else {
    return Math.ceil.call(null, q)
  }
};
cljs.core.int$ = function int$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.long$ = function long$(x) {
  return cljs.core.fix.call(null, x)
};
cljs.core.mod = function mod(n, d) {
  return n % d
};
cljs.core.quot = function quot(n, d) {
  var rem__7055 = n % d;
  return cljs.core.fix.call(null, (n - rem__7055) / d)
};
cljs.core.rem = function rem(n, d) {
  var q__7057 = cljs.core.quot.call(null, n, d);
  return n - d * q__7057
};
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return Math.random.call(null)
  };
  var rand__1 = function(n) {
    return n * rand.call(null)
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return cljs.core.fix.call(null, cljs.core.rand.call(null, n))
};
cljs.core.bit_xor = function bit_xor(x, y) {
  return x ^ y
};
cljs.core.bit_and = function bit_and(x, y) {
  return x & y
};
cljs.core.bit_or = function bit_or(x, y) {
  return x | y
};
cljs.core.bit_and_not = function bit_and_not(x, y) {
  return x & ~y
};
cljs.core.bit_clear = function bit_clear(x, n) {
  return x & ~(1 << n)
};
cljs.core.bit_flip = function bit_flip(x, n) {
  return x ^ 1 << n
};
cljs.core.bit_not = function bit_not(x) {
  return~x
};
cljs.core.bit_set = function bit_set(x, n) {
  return x | 1 << n
};
cljs.core.bit_test = function bit_test(x, n) {
  return(x & 1 << n) != 0
};
cljs.core.bit_shift_left = function bit_shift_left(x, n) {
  return x << n
};
cljs.core.bit_shift_right = function bit_shift_right(x, n) {
  return x >> n
};
cljs.core.bit_shift_right_zero_fill = function bit_shift_right_zero_fill(x, n) {
  return x >>> n
};
cljs.core.bit_count = function bit_count(v) {
  var v__7060 = v - (v >> 1 & 1431655765);
  var v__7061 = (v__7060 & 858993459) + (v__7060 >> 2 & 858993459);
  return(v__7061 + (v__7061 >> 4) & 252645135) * 16843009 >> 24
};
cljs.core._EQ__EQ_ = function() {
  var _EQ__EQ_ = null;
  var _EQ__EQ___1 = function(x) {
    return true
  };
  var _EQ__EQ___2 = function(x, y) {
    return cljs.core._equiv.call(null, x, y)
  };
  var _EQ__EQ___3 = function() {
    var G__7062__delegate = function(x, y, more) {
      while(true) {
        if(cljs.core.truth_(_EQ__EQ_.call(null, x, y))) {
          if(cljs.core.next.call(null, more)) {
            var G__7063 = y;
            var G__7064 = cljs.core.first.call(null, more);
            var G__7065 = cljs.core.next.call(null, more);
            x = G__7063;
            y = G__7064;
            more = G__7065;
            continue
          }else {
            return _EQ__EQ_.call(null, y, cljs.core.first.call(null, more))
          }
        }else {
          return false
        }
        break
      }
    };
    var G__7062 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7062__delegate.call(this, x, y, more)
    };
    G__7062.cljs$lang$maxFixedArity = 2;
    G__7062.cljs$lang$applyTo = function(arglist__7066) {
      var x = cljs.core.first(arglist__7066);
      var y = cljs.core.first(cljs.core.next(arglist__7066));
      var more = cljs.core.rest(cljs.core.next(arglist__7066));
      return G__7062__delegate(x, y, more)
    };
    G__7062.cljs$lang$arity$variadic = G__7062__delegate;
    return G__7062
  }();
  _EQ__EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return _EQ__EQ___1.call(this, x);
      case 2:
        return _EQ__EQ___2.call(this, x, y);
      default:
        return _EQ__EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  _EQ__EQ_.cljs$lang$maxFixedArity = 2;
  _EQ__EQ_.cljs$lang$applyTo = _EQ__EQ___3.cljs$lang$applyTo;
  _EQ__EQ_.cljs$lang$arity$1 = _EQ__EQ___1;
  _EQ__EQ_.cljs$lang$arity$2 = _EQ__EQ___2;
  _EQ__EQ_.cljs$lang$arity$variadic = _EQ__EQ___3.cljs$lang$arity$variadic;
  return _EQ__EQ_
}();
cljs.core.pos_QMARK_ = function pos_QMARK_(n) {
  return n > 0
};
cljs.core.zero_QMARK_ = function zero_QMARK_(n) {
  return n === 0
};
cljs.core.neg_QMARK_ = function neg_QMARK_(x) {
  return x < 0
};
cljs.core.nthnext = function nthnext(coll, n) {
  var n__7070 = n;
  var xs__7071 = cljs.core.seq.call(null, coll);
  while(true) {
    if(cljs.core.truth_(function() {
      var and__3941__auto____7072 = xs__7071;
      if(and__3941__auto____7072) {
        return n__7070 > 0
      }else {
        return and__3941__auto____7072
      }
    }())) {
      var G__7073 = n__7070 - 1;
      var G__7074 = cljs.core.next.call(null, xs__7071);
      n__7070 = G__7073;
      xs__7071 = G__7074;
      continue
    }else {
      return xs__7071
    }
    break
  }
};
cljs.core.str_STAR_ = function() {
  var str_STAR_ = null;
  var str_STAR___0 = function() {
    return""
  };
  var str_STAR___1 = function(x) {
    if(x == null) {
      return""
    }else {
      if("\ufdd0'else") {
        return x.toString()
      }else {
        return null
      }
    }
  };
  var str_STAR___2 = function() {
    var G__7075__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7076 = sb.append(str_STAR_.call(null, cljs.core.first.call(null, more)));
            var G__7077 = cljs.core.next.call(null, more);
            sb = G__7076;
            more = G__7077;
            continue
          }else {
            return str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str_STAR_.call(null, x)), ys)
    };
    var G__7075 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7075__delegate.call(this, x, ys)
    };
    G__7075.cljs$lang$maxFixedArity = 1;
    G__7075.cljs$lang$applyTo = function(arglist__7078) {
      var x = cljs.core.first(arglist__7078);
      var ys = cljs.core.rest(arglist__7078);
      return G__7075__delegate(x, ys)
    };
    G__7075.cljs$lang$arity$variadic = G__7075__delegate;
    return G__7075
  }();
  str_STAR_ = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str_STAR___0.call(this);
      case 1:
        return str_STAR___1.call(this, x);
      default:
        return str_STAR___2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str_STAR_.cljs$lang$maxFixedArity = 1;
  str_STAR_.cljs$lang$applyTo = str_STAR___2.cljs$lang$applyTo;
  str_STAR_.cljs$lang$arity$0 = str_STAR___0;
  str_STAR_.cljs$lang$arity$1 = str_STAR___1;
  str_STAR_.cljs$lang$arity$variadic = str_STAR___2.cljs$lang$arity$variadic;
  return str_STAR_
}();
cljs.core.str = function() {
  var str = null;
  var str__0 = function() {
    return""
  };
  var str__1 = function(x) {
    if(cljs.core.symbol_QMARK_.call(null, x)) {
      return x.substring(2, x.length)
    }else {
      if(cljs.core.keyword_QMARK_.call(null, x)) {
        return cljs.core.str_STAR_.call(null, ":", x.substring(2, x.length))
      }else {
        if(x == null) {
          return""
        }else {
          if("\ufdd0'else") {
            return x.toString()
          }else {
            return null
          }
        }
      }
    }
  };
  var str__2 = function() {
    var G__7079__delegate = function(x, ys) {
      return function(sb, more) {
        while(true) {
          if(cljs.core.truth_(more)) {
            var G__7080 = sb.append(str.call(null, cljs.core.first.call(null, more)));
            var G__7081 = cljs.core.next.call(null, more);
            sb = G__7080;
            more = G__7081;
            continue
          }else {
            return cljs.core.str_STAR_.call(null, sb)
          }
          break
        }
      }.call(null, new goog.string.StringBuffer(str.call(null, x)), ys)
    };
    var G__7079 = function(x, var_args) {
      var ys = null;
      if(goog.isDef(var_args)) {
        ys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__7079__delegate.call(this, x, ys)
    };
    G__7079.cljs$lang$maxFixedArity = 1;
    G__7079.cljs$lang$applyTo = function(arglist__7082) {
      var x = cljs.core.first(arglist__7082);
      var ys = cljs.core.rest(arglist__7082);
      return G__7079__delegate(x, ys)
    };
    G__7079.cljs$lang$arity$variadic = G__7079__delegate;
    return G__7079
  }();
  str = function(x, var_args) {
    var ys = var_args;
    switch(arguments.length) {
      case 0:
        return str__0.call(this);
      case 1:
        return str__1.call(this, x);
      default:
        return str__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  str.cljs$lang$maxFixedArity = 1;
  str.cljs$lang$applyTo = str__2.cljs$lang$applyTo;
  str.cljs$lang$arity$0 = str__0;
  str.cljs$lang$arity$1 = str__1;
  str.cljs$lang$arity$variadic = str__2.cljs$lang$arity$variadic;
  return str
}();
cljs.core.subs = function() {
  var subs = null;
  var subs__2 = function(s, start) {
    return s.substring(start)
  };
  var subs__3 = function(s, start, end) {
    return s.substring(start, end)
  };
  subs = function(s, start, end) {
    switch(arguments.length) {
      case 2:
        return subs__2.call(this, s, start);
      case 3:
        return subs__3.call(this, s, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subs.cljs$lang$arity$2 = subs__2;
  subs.cljs$lang$arity$3 = subs__3;
  return subs
}();
cljs.core.format = function() {
  var format__delegate = function(fmt, args) {
    return cljs.core.apply.call(null, goog.string.format, fmt, args)
  };
  var format = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return format__delegate.call(this, fmt, args)
  };
  format.cljs$lang$maxFixedArity = 1;
  format.cljs$lang$applyTo = function(arglist__7083) {
    var fmt = cljs.core.first(arglist__7083);
    var args = cljs.core.rest(arglist__7083);
    return format__delegate(fmt, args)
  };
  format.cljs$lang$arity$variadic = format__delegate;
  return format
}();
cljs.core.symbol = function() {
  var symbol = null;
  var symbol__1 = function(name) {
    if(cljs.core.symbol_QMARK_.call(null, name)) {
      name
    }else {
      if(cljs.core.keyword_QMARK_.call(null, name)) {
        cljs.core.str_STAR_.call(null, "\ufdd1", "'", cljs.core.subs.call(null, name, 2))
      }else {
      }
    }
    return cljs.core.str_STAR_.call(null, "\ufdd1", "'", name)
  };
  var symbol__2 = function(ns, name) {
    return symbol.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  symbol = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return symbol__1.call(this, ns);
      case 2:
        return symbol__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  symbol.cljs$lang$arity$1 = symbol__1;
  symbol.cljs$lang$arity$2 = symbol__2;
  return symbol
}();
cljs.core.keyword = function() {
  var keyword = null;
  var keyword__1 = function(name) {
    if(cljs.core.keyword_QMARK_.call(null, name)) {
      return name
    }else {
      if(cljs.core.symbol_QMARK_.call(null, name)) {
        return cljs.core.str_STAR_.call(null, "\ufdd0", "'", cljs.core.subs.call(null, name, 2))
      }else {
        if("\ufdd0'else") {
          return cljs.core.str_STAR_.call(null, "\ufdd0", "'", name)
        }else {
          return null
        }
      }
    }
  };
  var keyword__2 = function(ns, name) {
    return keyword.call(null, cljs.core.str_STAR_.call(null, ns, "/", name))
  };
  keyword = function(ns, name) {
    switch(arguments.length) {
      case 1:
        return keyword__1.call(this, ns);
      case 2:
        return keyword__2.call(this, ns, name)
    }
    throw"Invalid arity: " + arguments.length;
  };
  keyword.cljs$lang$arity$1 = keyword__1;
  keyword.cljs$lang$arity$2 = keyword__2;
  return keyword
}();
cljs.core.equiv_sequential = function equiv_sequential(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.sequential_QMARK_.call(null, y) ? function() {
    var xs__7086 = cljs.core.seq.call(null, x);
    var ys__7087 = cljs.core.seq.call(null, y);
    while(true) {
      if(xs__7086 == null) {
        return ys__7087 == null
      }else {
        if(ys__7087 == null) {
          return false
        }else {
          if(cljs.core._EQ_.call(null, cljs.core.first.call(null, xs__7086), cljs.core.first.call(null, ys__7087))) {
            var G__7088 = cljs.core.next.call(null, xs__7086);
            var G__7089 = cljs.core.next.call(null, ys__7087);
            xs__7086 = G__7088;
            ys__7087 = G__7089;
            continue
          }else {
            if("\ufdd0'else") {
              return false
            }else {
              return null
            }
          }
        }
      }
      break
    }
  }() : null)
};
cljs.core.hash_combine = function hash_combine(seed, hash) {
  return seed ^ hash + 2654435769 + (seed << 6) + (seed >> 2)
};
cljs.core.hash_coll = function hash_coll(coll) {
  return cljs.core.reduce.call(null, function(p1__7090_SHARP_, p2__7091_SHARP_) {
    return cljs.core.hash_combine.call(null, p1__7090_SHARP_, cljs.core.hash.call(null, p2__7091_SHARP_, false))
  }, cljs.core.hash.call(null, cljs.core.first.call(null, coll), false), cljs.core.next.call(null, coll))
};
cljs.core.hash_imap = function hash_imap(m) {
  var h__7095 = 0;
  var s__7096 = cljs.core.seq.call(null, m);
  while(true) {
    if(s__7096) {
      var e__7097 = cljs.core.first.call(null, s__7096);
      var G__7098 = (h__7095 + (cljs.core.hash.call(null, cljs.core.key.call(null, e__7097)) ^ cljs.core.hash.call(null, cljs.core.val.call(null, e__7097)))) % 4503599627370496;
      var G__7099 = cljs.core.next.call(null, s__7096);
      h__7095 = G__7098;
      s__7096 = G__7099;
      continue
    }else {
      return h__7095
    }
    break
  }
};
cljs.core.hash_iset = function hash_iset(s) {
  var h__7103 = 0;
  var s__7104 = cljs.core.seq.call(null, s);
  while(true) {
    if(s__7104) {
      var e__7105 = cljs.core.first.call(null, s__7104);
      var G__7106 = (h__7103 + cljs.core.hash.call(null, e__7105)) % 4503599627370496;
      var G__7107 = cljs.core.next.call(null, s__7104);
      h__7103 = G__7106;
      s__7104 = G__7107;
      continue
    }else {
      return h__7103
    }
    break
  }
};
cljs.core.extend_object_BANG_ = function extend_object_BANG_(obj, fn_map) {
  var G__7128__7129 = cljs.core.seq.call(null, fn_map);
  if(G__7128__7129) {
    var G__7131__7133 = cljs.core.first.call(null, G__7128__7129);
    var vec__7132__7134 = G__7131__7133;
    var key_name__7135 = cljs.core.nth.call(null, vec__7132__7134, 0, null);
    var f__7136 = cljs.core.nth.call(null, vec__7132__7134, 1, null);
    var G__7128__7137 = G__7128__7129;
    var G__7131__7138 = G__7131__7133;
    var G__7128__7139 = G__7128__7137;
    while(true) {
      var vec__7140__7141 = G__7131__7138;
      var key_name__7142 = cljs.core.nth.call(null, vec__7140__7141, 0, null);
      var f__7143 = cljs.core.nth.call(null, vec__7140__7141, 1, null);
      var G__7128__7144 = G__7128__7139;
      var str_name__7145 = cljs.core.name.call(null, key_name__7142);
      obj[str_name__7145] = f__7143;
      var temp__4092__auto____7146 = cljs.core.next.call(null, G__7128__7144);
      if(temp__4092__auto____7146) {
        var G__7128__7147 = temp__4092__auto____7146;
        var G__7148 = cljs.core.first.call(null, G__7128__7147);
        var G__7149 = G__7128__7147;
        G__7131__7138 = G__7148;
        G__7128__7139 = G__7149;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return obj
};
cljs.core.List = function(meta, first, rest, count, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.count = count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413358
};
cljs.core.List.cljs$lang$type = true;
cljs.core.List.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/List")
};
cljs.core.List.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7150 = this;
  var h__2141__auto____7151 = this__7150.__hash;
  if(!(h__2141__auto____7151 == null)) {
    return h__2141__auto____7151
  }else {
    var h__2141__auto____7152 = cljs.core.hash_coll.call(null, coll);
    this__7150.__hash = h__2141__auto____7152;
    return h__2141__auto____7152
  }
};
cljs.core.List.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7153 = this;
  if(this__7153.count === 1) {
    return null
  }else {
    return this__7153.rest
  }
};
cljs.core.List.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7154 = this;
  return new cljs.core.List(this__7154.meta, o, coll, this__7154.count + 1, null)
};
cljs.core.List.prototype.toString = function() {
  var this__7155 = this;
  var this__7156 = this;
  return cljs.core.pr_str.call(null, this__7156)
};
cljs.core.List.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7157 = this;
  return coll
};
cljs.core.List.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7158 = this;
  return this__7158.count
};
cljs.core.List.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7159 = this;
  return this__7159.first
};
cljs.core.List.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7160 = this;
  return coll.cljs$core$ISeq$_rest$arity$1(coll)
};
cljs.core.List.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7161 = this;
  return this__7161.first
};
cljs.core.List.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7162 = this;
  if(this__7162.count === 1) {
    return cljs.core.List.EMPTY
  }else {
    return this__7162.rest
  }
};
cljs.core.List.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7163 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.List.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7164 = this;
  return new cljs.core.List(meta, this__7164.first, this__7164.rest, this__7164.count, this__7164.__hash)
};
cljs.core.List.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7165 = this;
  return this__7165.meta
};
cljs.core.List.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7166 = this;
  return cljs.core.List.EMPTY
};
cljs.core.List;
cljs.core.EmptyList = function(meta) {
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65413326
};
cljs.core.EmptyList.cljs$lang$type = true;
cljs.core.EmptyList.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/EmptyList")
};
cljs.core.EmptyList.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7167 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7168 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7169 = this;
  return new cljs.core.List(this__7169.meta, o, null, 1, null)
};
cljs.core.EmptyList.prototype.toString = function() {
  var this__7170 = this;
  var this__7171 = this;
  return cljs.core.pr_str.call(null, this__7171)
};
cljs.core.EmptyList.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7172 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__7173 = this;
  return 0
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__7174 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__7175 = this;
  throw new Error("Can't pop empty list");
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7176 = this;
  return null
};
cljs.core.EmptyList.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7177 = this;
  return cljs.core.List.EMPTY
};
cljs.core.EmptyList.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7178 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.EmptyList.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7179 = this;
  return new cljs.core.EmptyList(meta)
};
cljs.core.EmptyList.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7180 = this;
  return this__7180.meta
};
cljs.core.EmptyList.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7181 = this;
  return coll
};
cljs.core.EmptyList;
cljs.core.List.EMPTY = new cljs.core.EmptyList(null);
cljs.core.reversible_QMARK_ = function reversible_QMARK_(coll) {
  var G__7185__7186 = coll;
  if(G__7185__7186) {
    if(function() {
      var or__3943__auto____7187 = G__7185__7186.cljs$lang$protocol_mask$partition0$ & 134217728;
      if(or__3943__auto____7187) {
        return or__3943__auto____7187
      }else {
        return G__7185__7186.cljs$core$IReversible$
      }
    }()) {
      return true
    }else {
      if(!G__7185__7186.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7185__7186)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IReversible, G__7185__7186)
  }
};
cljs.core.rseq = function rseq(coll) {
  return cljs.core._rseq.call(null, coll)
};
cljs.core.reverse = function reverse(coll) {
  if(cljs.core.reversible_QMARK_.call(null, coll)) {
    return cljs.core.rseq.call(null, coll)
  }else {
    return cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, coll)
  }
};
cljs.core.list = function() {
  var list = null;
  var list__0 = function() {
    return cljs.core.List.EMPTY
  };
  var list__1 = function(x) {
    return cljs.core.conj.call(null, cljs.core.List.EMPTY, x)
  };
  var list__2 = function(x, y) {
    return cljs.core.conj.call(null, list.call(null, y), x)
  };
  var list__3 = function(x, y, z) {
    return cljs.core.conj.call(null, list.call(null, y, z), x)
  };
  var list__4 = function() {
    var G__7188__delegate = function(x, y, z, items) {
      return cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.conj.call(null, cljs.core.reduce.call(null, cljs.core.conj, cljs.core.List.EMPTY, cljs.core.reverse.call(null, items)), z), y), x)
    };
    var G__7188 = function(x, y, z, var_args) {
      var items = null;
      if(goog.isDef(var_args)) {
        items = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7188__delegate.call(this, x, y, z, items)
    };
    G__7188.cljs$lang$maxFixedArity = 3;
    G__7188.cljs$lang$applyTo = function(arglist__7189) {
      var x = cljs.core.first(arglist__7189);
      var y = cljs.core.first(cljs.core.next(arglist__7189));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7189)));
      var items = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7189)));
      return G__7188__delegate(x, y, z, items)
    };
    G__7188.cljs$lang$arity$variadic = G__7188__delegate;
    return G__7188
  }();
  list = function(x, y, z, var_args) {
    var items = var_args;
    switch(arguments.length) {
      case 0:
        return list__0.call(this);
      case 1:
        return list__1.call(this, x);
      case 2:
        return list__2.call(this, x, y);
      case 3:
        return list__3.call(this, x, y, z);
      default:
        return list__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list.cljs$lang$maxFixedArity = 3;
  list.cljs$lang$applyTo = list__4.cljs$lang$applyTo;
  list.cljs$lang$arity$0 = list__0;
  list.cljs$lang$arity$1 = list__1;
  list.cljs$lang$arity$2 = list__2;
  list.cljs$lang$arity$3 = list__3;
  list.cljs$lang$arity$variadic = list__4.cljs$lang$arity$variadic;
  return list
}();
cljs.core.Cons = function(meta, first, rest, __hash) {
  this.meta = meta;
  this.first = first;
  this.rest = rest;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 65405164
};
cljs.core.Cons.cljs$lang$type = true;
cljs.core.Cons.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Cons")
};
cljs.core.Cons.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7190 = this;
  var h__2141__auto____7191 = this__7190.__hash;
  if(!(h__2141__auto____7191 == null)) {
    return h__2141__auto____7191
  }else {
    var h__2141__auto____7192 = cljs.core.hash_coll.call(null, coll);
    this__7190.__hash = h__2141__auto____7192;
    return h__2141__auto____7192
  }
};
cljs.core.Cons.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7193 = this;
  if(this__7193.rest == null) {
    return null
  }else {
    return cljs.core._seq.call(null, this__7193.rest)
  }
};
cljs.core.Cons.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7194 = this;
  return new cljs.core.Cons(null, o, coll, this__7194.__hash)
};
cljs.core.Cons.prototype.toString = function() {
  var this__7195 = this;
  var this__7196 = this;
  return cljs.core.pr_str.call(null, this__7196)
};
cljs.core.Cons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7197 = this;
  return coll
};
cljs.core.Cons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7198 = this;
  return this__7198.first
};
cljs.core.Cons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7199 = this;
  if(this__7199.rest == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7199.rest
  }
};
cljs.core.Cons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7200 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Cons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7201 = this;
  return new cljs.core.Cons(meta, this__7201.first, this__7201.rest, this__7201.__hash)
};
cljs.core.Cons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7202 = this;
  return this__7202.meta
};
cljs.core.Cons.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7203 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7203.meta)
};
cljs.core.Cons;
cljs.core.cons = function cons(x, coll) {
  if(function() {
    var or__3943__auto____7208 = coll == null;
    if(or__3943__auto____7208) {
      return or__3943__auto____7208
    }else {
      var G__7209__7210 = coll;
      if(G__7209__7210) {
        if(function() {
          var or__3943__auto____7211 = G__7209__7210.cljs$lang$protocol_mask$partition0$ & 64;
          if(or__3943__auto____7211) {
            return or__3943__auto____7211
          }else {
            return G__7209__7210.cljs$core$ISeq$
          }
        }()) {
          return true
        }else {
          if(!G__7209__7210.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7209__7210)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.ISeq, G__7209__7210)
      }
    }
  }()) {
    return new cljs.core.Cons(null, x, coll, null)
  }else {
    return new cljs.core.Cons(null, x, cljs.core.seq.call(null, coll), null)
  }
};
cljs.core.list_QMARK_ = function list_QMARK_(x) {
  var G__7215__7216 = x;
  if(G__7215__7216) {
    if(function() {
      var or__3943__auto____7217 = G__7215__7216.cljs$lang$protocol_mask$partition0$ & 33554432;
      if(or__3943__auto____7217) {
        return or__3943__auto____7217
      }else {
        return G__7215__7216.cljs$core$IList$
      }
    }()) {
      return true
    }else {
      if(!G__7215__7216.cljs$lang$protocol_mask$partition0$) {
        return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7215__7216)
      }else {
        return false
      }
    }
  }else {
    return cljs.core.type_satisfies_.call(null, cljs.core.IList, G__7215__7216)
  }
};
cljs.core.IReduce["string"] = true;
cljs.core._reduce["string"] = function() {
  var G__7218 = null;
  var G__7218__2 = function(string, f) {
    return cljs.core.ci_reduce.call(null, string, f)
  };
  var G__7218__3 = function(string, f, start) {
    return cljs.core.ci_reduce.call(null, string, f, start)
  };
  G__7218 = function(string, f, start) {
    switch(arguments.length) {
      case 2:
        return G__7218__2.call(this, string, f);
      case 3:
        return G__7218__3.call(this, string, f, start)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7218
}();
cljs.core.ILookup["string"] = true;
cljs.core._lookup["string"] = function() {
  var G__7219 = null;
  var G__7219__2 = function(string, k) {
    return cljs.core._nth.call(null, string, k)
  };
  var G__7219__3 = function(string, k, not_found) {
    return cljs.core._nth.call(null, string, k, not_found)
  };
  G__7219 = function(string, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7219__2.call(this, string, k);
      case 3:
        return G__7219__3.call(this, string, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7219
}();
cljs.core.IIndexed["string"] = true;
cljs.core._nth["string"] = function() {
  var G__7220 = null;
  var G__7220__2 = function(string, n) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return null
    }
  };
  var G__7220__3 = function(string, n, not_found) {
    if(n < cljs.core._count.call(null, string)) {
      return string.charAt(n)
    }else {
      return not_found
    }
  };
  G__7220 = function(string, n, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7220__2.call(this, string, n);
      case 3:
        return G__7220__3.call(this, string, n, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7220
}();
cljs.core.ICounted["string"] = true;
cljs.core._count["string"] = function(s) {
  return s.length
};
cljs.core.ISeqable["string"] = true;
cljs.core._seq["string"] = function(string) {
  return cljs.core.prim_seq.call(null, string, 0)
};
cljs.core.IHash["string"] = true;
cljs.core._hash["string"] = function(o) {
  return goog.string.hashCode(o)
};
cljs.core.Keyword = function(k) {
  this.k = k;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1
};
cljs.core.Keyword.cljs$lang$type = true;
cljs.core.Keyword.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Keyword")
};
cljs.core.Keyword.prototype.call = function() {
  var G__7232 = null;
  var G__7232__2 = function(this_sym7223, coll) {
    var this__7225 = this;
    var this_sym7223__7226 = this;
    var ___7227 = this_sym7223__7226;
    if(coll == null) {
      return null
    }else {
      var strobj__7228 = coll.strobj;
      if(strobj__7228 == null) {
        return cljs.core._lookup.call(null, coll, this__7225.k, null)
      }else {
        return strobj__7228[this__7225.k]
      }
    }
  };
  var G__7232__3 = function(this_sym7224, coll, not_found) {
    var this__7225 = this;
    var this_sym7224__7229 = this;
    var ___7230 = this_sym7224__7229;
    if(coll == null) {
      return not_found
    }else {
      return cljs.core._lookup.call(null, coll, this__7225.k, not_found)
    }
  };
  G__7232 = function(this_sym7224, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7232__2.call(this, this_sym7224, coll);
      case 3:
        return G__7232__3.call(this, this_sym7224, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7232
}();
cljs.core.Keyword.prototype.apply = function(this_sym7221, args7222) {
  var this__7231 = this;
  return this_sym7221.call.apply(this_sym7221, [this_sym7221].concat(args7222.slice()))
};
cljs.core.Keyword;
String.prototype.cljs$core$IFn$ = true;
String.prototype.call = function() {
  var G__7241 = null;
  var G__7241__2 = function(this_sym7235, coll) {
    var this_sym7235__7237 = this;
    var this__7238 = this_sym7235__7237;
    return cljs.core._lookup.call(null, coll, this__7238.toString(), null)
  };
  var G__7241__3 = function(this_sym7236, coll, not_found) {
    var this_sym7236__7239 = this;
    var this__7240 = this_sym7236__7239;
    return cljs.core._lookup.call(null, coll, this__7240.toString(), not_found)
  };
  G__7241 = function(this_sym7236, coll, not_found) {
    switch(arguments.length) {
      case 2:
        return G__7241__2.call(this, this_sym7236, coll);
      case 3:
        return G__7241__3.call(this, this_sym7236, coll, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__7241
}();
String.prototype.apply = function(this_sym7233, args7234) {
  return this_sym7233.call.apply(this_sym7233, [this_sym7233].concat(args7234.slice()))
};
String.prototype.apply = function(s, args) {
  if(cljs.core.count.call(null, args) < 2) {
    return cljs.core._lookup.call(null, args[0], s, null)
  }else {
    return cljs.core._lookup.call(null, args[0], s, args[1])
  }
};
cljs.core.lazy_seq_value = function lazy_seq_value(lazy_seq) {
  var x__7243 = lazy_seq.x;
  if(lazy_seq.realized) {
    return x__7243
  }else {
    lazy_seq.x = x__7243.call(null);
    lazy_seq.realized = true;
    return lazy_seq.x
  }
};
cljs.core.LazySeq = function(meta, realized, x, __hash) {
  this.meta = meta;
  this.realized = realized;
  this.x = x;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850700
};
cljs.core.LazySeq.cljs$lang$type = true;
cljs.core.LazySeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/LazySeq")
};
cljs.core.LazySeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__7244 = this;
  var h__2141__auto____7245 = this__7244.__hash;
  if(!(h__2141__auto____7245 == null)) {
    return h__2141__auto____7245
  }else {
    var h__2141__auto____7246 = cljs.core.hash_coll.call(null, coll);
    this__7244.__hash = h__2141__auto____7246;
    return h__2141__auto____7246
  }
};
cljs.core.LazySeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__7247 = this;
  return cljs.core._seq.call(null, coll.cljs$core$ISeq$_rest$arity$1(coll))
};
cljs.core.LazySeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__7248 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.LazySeq.prototype.toString = function() {
  var this__7249 = this;
  var this__7250 = this;
  return cljs.core.pr_str.call(null, this__7250)
};
cljs.core.LazySeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7251 = this;
  return cljs.core.seq.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7252 = this;
  return cljs.core.first.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7253 = this;
  return cljs.core.rest.call(null, cljs.core.lazy_seq_value.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7254 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.LazySeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__7255 = this;
  return new cljs.core.LazySeq(meta, this__7255.realized, this__7255.x, this__7255.__hash)
};
cljs.core.LazySeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7256 = this;
  return this__7256.meta
};
cljs.core.LazySeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__7257 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__7257.meta)
};
cljs.core.LazySeq;
cljs.core.ChunkBuffer = function(buf, end) {
  this.buf = buf;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2
};
cljs.core.ChunkBuffer.cljs$lang$type = true;
cljs.core.ChunkBuffer.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkBuffer")
};
cljs.core.ChunkBuffer.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7258 = this;
  return this__7258.end
};
cljs.core.ChunkBuffer.prototype.add = function(o) {
  var this__7259 = this;
  var ___7260 = this;
  this__7259.buf[this__7259.end] = o;
  return this__7259.end = this__7259.end + 1
};
cljs.core.ChunkBuffer.prototype.chunk = function(o) {
  var this__7261 = this;
  var ___7262 = this;
  var ret__7263 = new cljs.core.ArrayChunk(this__7261.buf, 0, this__7261.end);
  this__7261.buf = null;
  return ret__7263
};
cljs.core.ChunkBuffer;
cljs.core.chunk_buffer = function chunk_buffer(capacity) {
  return new cljs.core.ChunkBuffer(cljs.core.make_array.call(null, capacity), 0)
};
cljs.core.ArrayChunk = function(arr, off, end) {
  this.arr = arr;
  this.off = off;
  this.end = end;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 524306
};
cljs.core.ArrayChunk.cljs$lang$type = true;
cljs.core.ArrayChunk.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayChunk")
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__7264 = this;
  return cljs.core.ci_reduce.call(null, coll, f, this__7264.arr[this__7264.off], this__7264.off + 1)
};
cljs.core.ArrayChunk.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__7265 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start, this__7265.off)
};
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$ = true;
cljs.core.ArrayChunk.prototype.cljs$core$IChunk$_drop_first$arity$1 = function(coll) {
  var this__7266 = this;
  if(this__7266.off === this__7266.end) {
    throw new Error("-drop-first of empty chunk");
  }else {
    return new cljs.core.ArrayChunk(this__7266.arr, this__7266.off + 1, this__7266.end)
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, i) {
  var this__7267 = this;
  return this__7267.arr[this__7267.off + i]
};
cljs.core.ArrayChunk.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, i, not_found) {
  var this__7268 = this;
  if(function() {
    var and__3941__auto____7269 = i >= 0;
    if(and__3941__auto____7269) {
      return i < this__7268.end - this__7268.off
    }else {
      return and__3941__auto____7269
    }
  }()) {
    return this__7268.arr[this__7268.off + i]
  }else {
    return not_found
  }
};
cljs.core.ArrayChunk.prototype.cljs$core$ICounted$_count$arity$1 = function(_) {
  var this__7270 = this;
  return this__7270.end - this__7270.off
};
cljs.core.ArrayChunk;
cljs.core.array_chunk = function() {
  var array_chunk = null;
  var array_chunk__1 = function(arr) {
    return array_chunk.call(null, arr, 0, arr.length)
  };
  var array_chunk__2 = function(arr, off) {
    return array_chunk.call(null, arr, off, arr.length)
  };
  var array_chunk__3 = function(arr, off, end) {
    return new cljs.core.ArrayChunk(arr, off, end)
  };
  array_chunk = function(arr, off, end) {
    switch(arguments.length) {
      case 1:
        return array_chunk__1.call(this, arr);
      case 2:
        return array_chunk__2.call(this, arr, off);
      case 3:
        return array_chunk__3.call(this, arr, off, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  array_chunk.cljs$lang$arity$1 = array_chunk__1;
  array_chunk.cljs$lang$arity$2 = array_chunk__2;
  array_chunk.cljs$lang$arity$3 = array_chunk__3;
  return array_chunk
}();
cljs.core.ChunkedCons = function(chunk, more, meta) {
  this.chunk = chunk;
  this.more = more;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27656296
};
cljs.core.ChunkedCons.cljs$lang$type = true;
cljs.core.ChunkedCons.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedCons")
};
cljs.core.ChunkedCons.prototype.cljs$core$ICollection$_conj$arity$2 = function(this$, o) {
  var this__7271 = this;
  return cljs.core.cons.call(null, o, this$)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__7272 = this;
  return coll
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__7273 = this;
  return cljs.core._nth.call(null, this__7273.chunk, 0)
};
cljs.core.ChunkedCons.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__7274 = this;
  if(cljs.core._count.call(null, this__7274.chunk) > 1) {
    return new cljs.core.ChunkedCons(cljs.core._drop_first.call(null, this__7274.chunk), this__7274.more, this__7274.meta)
  }else {
    if(this__7274.more == null) {
      return cljs.core.List.EMPTY
    }else {
      return this__7274.more
    }
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__7275 = this;
  if(this__7275.more == null) {
    return null
  }else {
    return this__7275.more
  }
};
cljs.core.ChunkedCons.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__7276 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedCons.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__7277 = this;
  return new cljs.core.ChunkedCons(this__7277.chunk, this__7277.more, m)
};
cljs.core.ChunkedCons.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__7278 = this;
  return this__7278.meta
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__7279 = this;
  return this__7279.chunk
};
cljs.core.ChunkedCons.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__7280 = this;
  if(this__7280.more == null) {
    return cljs.core.List.EMPTY
  }else {
    return this__7280.more
  }
};
cljs.core.ChunkedCons;
cljs.core.chunk_cons = function chunk_cons(chunk, rest) {
  if(cljs.core._count.call(null, chunk) === 0) {
    return rest
  }else {
    return new cljs.core.ChunkedCons(chunk, rest, null)
  }
};
cljs.core.chunk_append = function chunk_append(b, x) {
  return b.add(x)
};
cljs.core.chunk = function chunk(b) {
  return b.chunk()
};
cljs.core.chunk_first = function chunk_first(s) {
  return cljs.core._chunked_first.call(null, s)
};
cljs.core.chunk_rest = function chunk_rest(s) {
  return cljs.core._chunked_rest.call(null, s)
};
cljs.core.chunk_next = function chunk_next(s) {
  if(function() {
    var G__7284__7285 = s;
    if(G__7284__7285) {
      if(cljs.core.truth_(function() {
        var or__3943__auto____7286 = null;
        if(cljs.core.truth_(or__3943__auto____7286)) {
          return or__3943__auto____7286
        }else {
          return G__7284__7285.cljs$core$IChunkedNext$
        }
      }())) {
        return true
      }else {
        if(!G__7284__7285.cljs$lang$protocol_mask$partition$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7284__7285)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IChunkedNext, G__7284__7285)
    }
  }()) {
    return cljs.core._chunked_next.call(null, s)
  }else {
    return cljs.core.seq.call(null, cljs.core._chunked_rest.call(null, s))
  }
};
cljs.core.to_array = function to_array(s) {
  var ary__7289 = [];
  var s__7290 = s;
  while(true) {
    if(cljs.core.seq.call(null, s__7290)) {
      ary__7289.push(cljs.core.first.call(null, s__7290));
      var G__7291 = cljs.core.next.call(null, s__7290);
      s__7290 = G__7291;
      continue
    }else {
      return ary__7289
    }
    break
  }
};
cljs.core.to_array_2d = function to_array_2d(coll) {
  var ret__7295 = cljs.core.make_array.call(null, cljs.core.count.call(null, coll));
  var i__7296 = 0;
  var xs__7297 = cljs.core.seq.call(null, coll);
  while(true) {
    if(xs__7297) {
      ret__7295[i__7296] = cljs.core.to_array.call(null, cljs.core.first.call(null, xs__7297));
      var G__7298 = i__7296 + 1;
      var G__7299 = cljs.core.next.call(null, xs__7297);
      i__7296 = G__7298;
      xs__7297 = G__7299;
      continue
    }else {
    }
    break
  }
  return ret__7295
};
cljs.core.long_array = function() {
  var long_array = null;
  var long_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return long_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("long-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var long_array__2 = function(size, init_val_or_seq) {
    var a__7307 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7308 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7309 = 0;
      var s__7310 = s__7308;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7311 = s__7310;
          if(and__3941__auto____7311) {
            return i__7309 < size
          }else {
            return and__3941__auto____7311
          }
        }())) {
          a__7307[i__7309] = cljs.core.first.call(null, s__7310);
          var G__7314 = i__7309 + 1;
          var G__7315 = cljs.core.next.call(null, s__7310);
          i__7309 = G__7314;
          s__7310 = G__7315;
          continue
        }else {
          return a__7307
        }
        break
      }
    }else {
      var n__2476__auto____7312 = size;
      var i__7313 = 0;
      while(true) {
        if(i__7313 < n__2476__auto____7312) {
          a__7307[i__7313] = init_val_or_seq;
          var G__7316 = i__7313 + 1;
          i__7313 = G__7316;
          continue
        }else {
        }
        break
      }
      return a__7307
    }
  };
  long_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return long_array__1.call(this, size);
      case 2:
        return long_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  long_array.cljs$lang$arity$1 = long_array__1;
  long_array.cljs$lang$arity$2 = long_array__2;
  return long_array
}();
cljs.core.double_array = function() {
  var double_array = null;
  var double_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return double_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("double-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var double_array__2 = function(size, init_val_or_seq) {
    var a__7324 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7325 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7326 = 0;
      var s__7327 = s__7325;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7328 = s__7327;
          if(and__3941__auto____7328) {
            return i__7326 < size
          }else {
            return and__3941__auto____7328
          }
        }())) {
          a__7324[i__7326] = cljs.core.first.call(null, s__7327);
          var G__7331 = i__7326 + 1;
          var G__7332 = cljs.core.next.call(null, s__7327);
          i__7326 = G__7331;
          s__7327 = G__7332;
          continue
        }else {
          return a__7324
        }
        break
      }
    }else {
      var n__2476__auto____7329 = size;
      var i__7330 = 0;
      while(true) {
        if(i__7330 < n__2476__auto____7329) {
          a__7324[i__7330] = init_val_or_seq;
          var G__7333 = i__7330 + 1;
          i__7330 = G__7333;
          continue
        }else {
        }
        break
      }
      return a__7324
    }
  };
  double_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return double_array__1.call(this, size);
      case 2:
        return double_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  double_array.cljs$lang$arity$1 = double_array__1;
  double_array.cljs$lang$arity$2 = double_array__2;
  return double_array
}();
cljs.core.object_array = function() {
  var object_array = null;
  var object_array__1 = function(size_or_seq) {
    if(cljs.core.number_QMARK_.call(null, size_or_seq)) {
      return object_array.call(null, size_or_seq, null)
    }else {
      if(cljs.core.seq_QMARK_.call(null, size_or_seq)) {
        return cljs.core.into_array.call(null, size_or_seq)
      }else {
        if("\ufdd0'else") {
          throw new Error("object-array called with something other than size or ISeq");
        }else {
          return null
        }
      }
    }
  };
  var object_array__2 = function(size, init_val_or_seq) {
    var a__7341 = cljs.core.make_array.call(null, size);
    if(cljs.core.seq_QMARK_.call(null, init_val_or_seq)) {
      var s__7342 = cljs.core.seq.call(null, init_val_or_seq);
      var i__7343 = 0;
      var s__7344 = s__7342;
      while(true) {
        if(cljs.core.truth_(function() {
          var and__3941__auto____7345 = s__7344;
          if(and__3941__auto____7345) {
            return i__7343 < size
          }else {
            return and__3941__auto____7345
          }
        }())) {
          a__7341[i__7343] = cljs.core.first.call(null, s__7344);
          var G__7348 = i__7343 + 1;
          var G__7349 = cljs.core.next.call(null, s__7344);
          i__7343 = G__7348;
          s__7344 = G__7349;
          continue
        }else {
          return a__7341
        }
        break
      }
    }else {
      var n__2476__auto____7346 = size;
      var i__7347 = 0;
      while(true) {
        if(i__7347 < n__2476__auto____7346) {
          a__7341[i__7347] = init_val_or_seq;
          var G__7350 = i__7347 + 1;
          i__7347 = G__7350;
          continue
        }else {
        }
        break
      }
      return a__7341
    }
  };
  object_array = function(size, init_val_or_seq) {
    switch(arguments.length) {
      case 1:
        return object_array__1.call(this, size);
      case 2:
        return object_array__2.call(this, size, init_val_or_seq)
    }
    throw"Invalid arity: " + arguments.length;
  };
  object_array.cljs$lang$arity$1 = object_array__1;
  object_array.cljs$lang$arity$2 = object_array__2;
  return object_array
}();
cljs.core.bounded_count = function bounded_count(s, n) {
  if(cljs.core.counted_QMARK_.call(null, s)) {
    return cljs.core.count.call(null, s)
  }else {
    var s__7355 = s;
    var i__7356 = n;
    var sum__7357 = 0;
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____7358 = i__7356 > 0;
        if(and__3941__auto____7358) {
          return cljs.core.seq.call(null, s__7355)
        }else {
          return and__3941__auto____7358
        }
      }())) {
        var G__7359 = cljs.core.next.call(null, s__7355);
        var G__7360 = i__7356 - 1;
        var G__7361 = sum__7357 + 1;
        s__7355 = G__7359;
        i__7356 = G__7360;
        sum__7357 = G__7361;
        continue
      }else {
        return sum__7357
      }
      break
    }
  }
};
cljs.core.spread = function spread(arglist) {
  if(arglist == null) {
    return null
  }else {
    if(cljs.core.next.call(null, arglist) == null) {
      return cljs.core.seq.call(null, cljs.core.first.call(null, arglist))
    }else {
      if("\ufdd0'else") {
        return cljs.core.cons.call(null, cljs.core.first.call(null, arglist), spread.call(null, cljs.core.next.call(null, arglist)))
      }else {
        return null
      }
    }
  }
};
cljs.core.concat = function() {
  var concat = null;
  var concat__0 = function() {
    return new cljs.core.LazySeq(null, false, function() {
      return null
    }, null)
  };
  var concat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return x
    }, null)
  };
  var concat__2 = function(x, y) {
    return new cljs.core.LazySeq(null, false, function() {
      var s__7366 = cljs.core.seq.call(null, x);
      if(s__7366) {
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7366)) {
          return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, s__7366), concat.call(null, cljs.core.chunk_rest.call(null, s__7366), y))
        }else {
          return cljs.core.cons.call(null, cljs.core.first.call(null, s__7366), concat.call(null, cljs.core.rest.call(null, s__7366), y))
        }
      }else {
        return y
      }
    }, null)
  };
  var concat__3 = function() {
    var G__7370__delegate = function(x, y, zs) {
      var cat__7369 = function cat(xys, zs) {
        return new cljs.core.LazySeq(null, false, function() {
          var xys__7368 = cljs.core.seq.call(null, xys);
          if(xys__7368) {
            if(cljs.core.chunked_seq_QMARK_.call(null, xys__7368)) {
              return cljs.core.chunk_cons.call(null, cljs.core.chunk_first.call(null, xys__7368), cat.call(null, cljs.core.chunk_rest.call(null, xys__7368), zs))
            }else {
              return cljs.core.cons.call(null, cljs.core.first.call(null, xys__7368), cat.call(null, cljs.core.rest.call(null, xys__7368), zs))
            }
          }else {
            if(cljs.core.truth_(zs)) {
              return cat.call(null, cljs.core.first.call(null, zs), cljs.core.next.call(null, zs))
            }else {
              return null
            }
          }
        }, null)
      };
      return cat__7369.call(null, concat.call(null, x, y), zs)
    };
    var G__7370 = function(x, y, var_args) {
      var zs = null;
      if(goog.isDef(var_args)) {
        zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7370__delegate.call(this, x, y, zs)
    };
    G__7370.cljs$lang$maxFixedArity = 2;
    G__7370.cljs$lang$applyTo = function(arglist__7371) {
      var x = cljs.core.first(arglist__7371);
      var y = cljs.core.first(cljs.core.next(arglist__7371));
      var zs = cljs.core.rest(cljs.core.next(arglist__7371));
      return G__7370__delegate(x, y, zs)
    };
    G__7370.cljs$lang$arity$variadic = G__7370__delegate;
    return G__7370
  }();
  concat = function(x, y, var_args) {
    var zs = var_args;
    switch(arguments.length) {
      case 0:
        return concat__0.call(this);
      case 1:
        return concat__1.call(this, x);
      case 2:
        return concat__2.call(this, x, y);
      default:
        return concat__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  concat.cljs$lang$maxFixedArity = 2;
  concat.cljs$lang$applyTo = concat__3.cljs$lang$applyTo;
  concat.cljs$lang$arity$0 = concat__0;
  concat.cljs$lang$arity$1 = concat__1;
  concat.cljs$lang$arity$2 = concat__2;
  concat.cljs$lang$arity$variadic = concat__3.cljs$lang$arity$variadic;
  return concat
}();
cljs.core.list_STAR_ = function() {
  var list_STAR_ = null;
  var list_STAR___1 = function(args) {
    return cljs.core.seq.call(null, args)
  };
  var list_STAR___2 = function(a, args) {
    return cljs.core.cons.call(null, a, args)
  };
  var list_STAR___3 = function(a, b, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, args))
  };
  var list_STAR___4 = function(a, b, c, args) {
    return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, args)))
  };
  var list_STAR___5 = function() {
    var G__7372__delegate = function(a, b, c, d, more) {
      return cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, more)))))
    };
    var G__7372 = function(a, b, c, d, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7372__delegate.call(this, a, b, c, d, more)
    };
    G__7372.cljs$lang$maxFixedArity = 4;
    G__7372.cljs$lang$applyTo = function(arglist__7373) {
      var a = cljs.core.first(arglist__7373);
      var b = cljs.core.first(cljs.core.next(arglist__7373));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7373)));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7373))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7373))));
      return G__7372__delegate(a, b, c, d, more)
    };
    G__7372.cljs$lang$arity$variadic = G__7372__delegate;
    return G__7372
  }();
  list_STAR_ = function(a, b, c, d, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return list_STAR___1.call(this, a);
      case 2:
        return list_STAR___2.call(this, a, b);
      case 3:
        return list_STAR___3.call(this, a, b, c);
      case 4:
        return list_STAR___4.call(this, a, b, c, d);
      default:
        return list_STAR___5.cljs$lang$arity$variadic(a, b, c, d, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  list_STAR_.cljs$lang$maxFixedArity = 4;
  list_STAR_.cljs$lang$applyTo = list_STAR___5.cljs$lang$applyTo;
  list_STAR_.cljs$lang$arity$1 = list_STAR___1;
  list_STAR_.cljs$lang$arity$2 = list_STAR___2;
  list_STAR_.cljs$lang$arity$3 = list_STAR___3;
  list_STAR_.cljs$lang$arity$4 = list_STAR___4;
  list_STAR_.cljs$lang$arity$variadic = list_STAR___5.cljs$lang$arity$variadic;
  return list_STAR_
}();
cljs.core.transient$ = function transient$(coll) {
  return cljs.core._as_transient.call(null, coll)
};
cljs.core.persistent_BANG_ = function persistent_BANG_(tcoll) {
  return cljs.core._persistent_BANG_.call(null, tcoll)
};
cljs.core.conj_BANG_ = function conj_BANG_(tcoll, val) {
  return cljs.core._conj_BANG_.call(null, tcoll, val)
};
cljs.core.assoc_BANG_ = function assoc_BANG_(tcoll, key, val) {
  return cljs.core._assoc_BANG_.call(null, tcoll, key, val)
};
cljs.core.dissoc_BANG_ = function dissoc_BANG_(tcoll, key) {
  return cljs.core._dissoc_BANG_.call(null, tcoll, key)
};
cljs.core.pop_BANG_ = function pop_BANG_(tcoll) {
  return cljs.core._pop_BANG_.call(null, tcoll)
};
cljs.core.disj_BANG_ = function disj_BANG_(tcoll, val) {
  return cljs.core._disjoin_BANG_.call(null, tcoll, val)
};
cljs.core.apply_to = function apply_to(f, argc, args) {
  var args__7415 = cljs.core.seq.call(null, args);
  if(argc === 0) {
    return f.call(null)
  }else {
    var a__7416 = cljs.core._first.call(null, args__7415);
    var args__7417 = cljs.core._rest.call(null, args__7415);
    if(argc === 1) {
      if(f.cljs$lang$arity$1) {
        return f.cljs$lang$arity$1(a__7416)
      }else {
        return f.call(null, a__7416)
      }
    }else {
      var b__7418 = cljs.core._first.call(null, args__7417);
      var args__7419 = cljs.core._rest.call(null, args__7417);
      if(argc === 2) {
        if(f.cljs$lang$arity$2) {
          return f.cljs$lang$arity$2(a__7416, b__7418)
        }else {
          return f.call(null, a__7416, b__7418)
        }
      }else {
        var c__7420 = cljs.core._first.call(null, args__7419);
        var args__7421 = cljs.core._rest.call(null, args__7419);
        if(argc === 3) {
          if(f.cljs$lang$arity$3) {
            return f.cljs$lang$arity$3(a__7416, b__7418, c__7420)
          }else {
            return f.call(null, a__7416, b__7418, c__7420)
          }
        }else {
          var d__7422 = cljs.core._first.call(null, args__7421);
          var args__7423 = cljs.core._rest.call(null, args__7421);
          if(argc === 4) {
            if(f.cljs$lang$arity$4) {
              return f.cljs$lang$arity$4(a__7416, b__7418, c__7420, d__7422)
            }else {
              return f.call(null, a__7416, b__7418, c__7420, d__7422)
            }
          }else {
            var e__7424 = cljs.core._first.call(null, args__7423);
            var args__7425 = cljs.core._rest.call(null, args__7423);
            if(argc === 5) {
              if(f.cljs$lang$arity$5) {
                return f.cljs$lang$arity$5(a__7416, b__7418, c__7420, d__7422, e__7424)
              }else {
                return f.call(null, a__7416, b__7418, c__7420, d__7422, e__7424)
              }
            }else {
              var f__7426 = cljs.core._first.call(null, args__7425);
              var args__7427 = cljs.core._rest.call(null, args__7425);
              if(argc === 6) {
                if(f__7426.cljs$lang$arity$6) {
                  return f__7426.cljs$lang$arity$6(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426)
                }else {
                  return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426)
                }
              }else {
                var g__7428 = cljs.core._first.call(null, args__7427);
                var args__7429 = cljs.core._rest.call(null, args__7427);
                if(argc === 7) {
                  if(f__7426.cljs$lang$arity$7) {
                    return f__7426.cljs$lang$arity$7(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428)
                  }else {
                    return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428)
                  }
                }else {
                  var h__7430 = cljs.core._first.call(null, args__7429);
                  var args__7431 = cljs.core._rest.call(null, args__7429);
                  if(argc === 8) {
                    if(f__7426.cljs$lang$arity$8) {
                      return f__7426.cljs$lang$arity$8(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430)
                    }else {
                      return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430)
                    }
                  }else {
                    var i__7432 = cljs.core._first.call(null, args__7431);
                    var args__7433 = cljs.core._rest.call(null, args__7431);
                    if(argc === 9) {
                      if(f__7426.cljs$lang$arity$9) {
                        return f__7426.cljs$lang$arity$9(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432)
                      }else {
                        return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432)
                      }
                    }else {
                      var j__7434 = cljs.core._first.call(null, args__7433);
                      var args__7435 = cljs.core._rest.call(null, args__7433);
                      if(argc === 10) {
                        if(f__7426.cljs$lang$arity$10) {
                          return f__7426.cljs$lang$arity$10(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434)
                        }else {
                          return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434)
                        }
                      }else {
                        var k__7436 = cljs.core._first.call(null, args__7435);
                        var args__7437 = cljs.core._rest.call(null, args__7435);
                        if(argc === 11) {
                          if(f__7426.cljs$lang$arity$11) {
                            return f__7426.cljs$lang$arity$11(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436)
                          }else {
                            return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436)
                          }
                        }else {
                          var l__7438 = cljs.core._first.call(null, args__7437);
                          var args__7439 = cljs.core._rest.call(null, args__7437);
                          if(argc === 12) {
                            if(f__7426.cljs$lang$arity$12) {
                              return f__7426.cljs$lang$arity$12(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438)
                            }else {
                              return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438)
                            }
                          }else {
                            var m__7440 = cljs.core._first.call(null, args__7439);
                            var args__7441 = cljs.core._rest.call(null, args__7439);
                            if(argc === 13) {
                              if(f__7426.cljs$lang$arity$13) {
                                return f__7426.cljs$lang$arity$13(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440)
                              }else {
                                return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440)
                              }
                            }else {
                              var n__7442 = cljs.core._first.call(null, args__7441);
                              var args__7443 = cljs.core._rest.call(null, args__7441);
                              if(argc === 14) {
                                if(f__7426.cljs$lang$arity$14) {
                                  return f__7426.cljs$lang$arity$14(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442)
                                }else {
                                  return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442)
                                }
                              }else {
                                var o__7444 = cljs.core._first.call(null, args__7443);
                                var args__7445 = cljs.core._rest.call(null, args__7443);
                                if(argc === 15) {
                                  if(f__7426.cljs$lang$arity$15) {
                                    return f__7426.cljs$lang$arity$15(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444)
                                  }else {
                                    return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444)
                                  }
                                }else {
                                  var p__7446 = cljs.core._first.call(null, args__7445);
                                  var args__7447 = cljs.core._rest.call(null, args__7445);
                                  if(argc === 16) {
                                    if(f__7426.cljs$lang$arity$16) {
                                      return f__7426.cljs$lang$arity$16(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446)
                                    }else {
                                      return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446)
                                    }
                                  }else {
                                    var q__7448 = cljs.core._first.call(null, args__7447);
                                    var args__7449 = cljs.core._rest.call(null, args__7447);
                                    if(argc === 17) {
                                      if(f__7426.cljs$lang$arity$17) {
                                        return f__7426.cljs$lang$arity$17(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448)
                                      }else {
                                        return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448)
                                      }
                                    }else {
                                      var r__7450 = cljs.core._first.call(null, args__7449);
                                      var args__7451 = cljs.core._rest.call(null, args__7449);
                                      if(argc === 18) {
                                        if(f__7426.cljs$lang$arity$18) {
                                          return f__7426.cljs$lang$arity$18(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448, r__7450)
                                        }else {
                                          return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448, r__7450)
                                        }
                                      }else {
                                        var s__7452 = cljs.core._first.call(null, args__7451);
                                        var args__7453 = cljs.core._rest.call(null, args__7451);
                                        if(argc === 19) {
                                          if(f__7426.cljs$lang$arity$19) {
                                            return f__7426.cljs$lang$arity$19(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448, r__7450, s__7452)
                                          }else {
                                            return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448, r__7450, s__7452)
                                          }
                                        }else {
                                          var t__7454 = cljs.core._first.call(null, args__7453);
                                          var args__7455 = cljs.core._rest.call(null, args__7453);
                                          if(argc === 20) {
                                            if(f__7426.cljs$lang$arity$20) {
                                              return f__7426.cljs$lang$arity$20(a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448, r__7450, s__7452, t__7454)
                                            }else {
                                              return f__7426.call(null, a__7416, b__7418, c__7420, d__7422, e__7424, f__7426, g__7428, h__7430, i__7432, j__7434, k__7436, l__7438, m__7440, n__7442, o__7444, p__7446, q__7448, r__7450, s__7452, t__7454)
                                            }
                                          }else {
                                            throw new Error("Only up to 20 arguments supported on functions");
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
cljs.core.apply = function() {
  var apply = null;
  var apply__2 = function(f, args) {
    var fixed_arity__7470 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7471 = cljs.core.bounded_count.call(null, args, fixed_arity__7470 + 1);
      if(bc__7471 <= fixed_arity__7470) {
        return cljs.core.apply_to.call(null, f, bc__7471, args)
      }else {
        return f.cljs$lang$applyTo(args)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, args))
    }
  };
  var apply__3 = function(f, x, args) {
    var arglist__7472 = cljs.core.list_STAR_.call(null, x, args);
    var fixed_arity__7473 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7474 = cljs.core.bounded_count.call(null, arglist__7472, fixed_arity__7473 + 1);
      if(bc__7474 <= fixed_arity__7473) {
        return cljs.core.apply_to.call(null, f, bc__7474, arglist__7472)
      }else {
        return f.cljs$lang$applyTo(arglist__7472)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7472))
    }
  };
  var apply__4 = function(f, x, y, args) {
    var arglist__7475 = cljs.core.list_STAR_.call(null, x, y, args);
    var fixed_arity__7476 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7477 = cljs.core.bounded_count.call(null, arglist__7475, fixed_arity__7476 + 1);
      if(bc__7477 <= fixed_arity__7476) {
        return cljs.core.apply_to.call(null, f, bc__7477, arglist__7475)
      }else {
        return f.cljs$lang$applyTo(arglist__7475)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7475))
    }
  };
  var apply__5 = function(f, x, y, z, args) {
    var arglist__7478 = cljs.core.list_STAR_.call(null, x, y, z, args);
    var fixed_arity__7479 = f.cljs$lang$maxFixedArity;
    if(cljs.core.truth_(f.cljs$lang$applyTo)) {
      var bc__7480 = cljs.core.bounded_count.call(null, arglist__7478, fixed_arity__7479 + 1);
      if(bc__7480 <= fixed_arity__7479) {
        return cljs.core.apply_to.call(null, f, bc__7480, arglist__7478)
      }else {
        return f.cljs$lang$applyTo(arglist__7478)
      }
    }else {
      return f.apply(f, cljs.core.to_array.call(null, arglist__7478))
    }
  };
  var apply__6 = function() {
    var G__7484__delegate = function(f, a, b, c, d, args) {
      var arglist__7481 = cljs.core.cons.call(null, a, cljs.core.cons.call(null, b, cljs.core.cons.call(null, c, cljs.core.cons.call(null, d, cljs.core.spread.call(null, args)))));
      var fixed_arity__7482 = f.cljs$lang$maxFixedArity;
      if(cljs.core.truth_(f.cljs$lang$applyTo)) {
        var bc__7483 = cljs.core.bounded_count.call(null, arglist__7481, fixed_arity__7482 + 1);
        if(bc__7483 <= fixed_arity__7482) {
          return cljs.core.apply_to.call(null, f, bc__7483, arglist__7481)
        }else {
          return f.cljs$lang$applyTo(arglist__7481)
        }
      }else {
        return f.apply(f, cljs.core.to_array.call(null, arglist__7481))
      }
    };
    var G__7484 = function(f, a, b, c, d, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__7484__delegate.call(this, f, a, b, c, d, args)
    };
    G__7484.cljs$lang$maxFixedArity = 5;
    G__7484.cljs$lang$applyTo = function(arglist__7485) {
      var f = cljs.core.first(arglist__7485);
      var a = cljs.core.first(cljs.core.next(arglist__7485));
      var b = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7485)));
      var c = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7485))));
      var d = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7485)))));
      var args = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7485)))));
      return G__7484__delegate(f, a, b, c, d, args)
    };
    G__7484.cljs$lang$arity$variadic = G__7484__delegate;
    return G__7484
  }();
  apply = function(f, a, b, c, d, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 2:
        return apply__2.call(this, f, a);
      case 3:
        return apply__3.call(this, f, a, b);
      case 4:
        return apply__4.call(this, f, a, b, c);
      case 5:
        return apply__5.call(this, f, a, b, c, d);
      default:
        return apply__6.cljs$lang$arity$variadic(f, a, b, c, d, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  apply.cljs$lang$maxFixedArity = 5;
  apply.cljs$lang$applyTo = apply__6.cljs$lang$applyTo;
  apply.cljs$lang$arity$2 = apply__2;
  apply.cljs$lang$arity$3 = apply__3;
  apply.cljs$lang$arity$4 = apply__4;
  apply.cljs$lang$arity$5 = apply__5;
  apply.cljs$lang$arity$variadic = apply__6.cljs$lang$arity$variadic;
  return apply
}();
cljs.core.vary_meta = function() {
  var vary_meta__delegate = function(obj, f, args) {
    return cljs.core.with_meta.call(null, obj, cljs.core.apply.call(null, f, cljs.core.meta.call(null, obj), args))
  };
  var vary_meta = function(obj, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return vary_meta__delegate.call(this, obj, f, args)
  };
  vary_meta.cljs$lang$maxFixedArity = 2;
  vary_meta.cljs$lang$applyTo = function(arglist__7486) {
    var obj = cljs.core.first(arglist__7486);
    var f = cljs.core.first(cljs.core.next(arglist__7486));
    var args = cljs.core.rest(cljs.core.next(arglist__7486));
    return vary_meta__delegate(obj, f, args)
  };
  vary_meta.cljs$lang$arity$variadic = vary_meta__delegate;
  return vary_meta
}();
cljs.core.not_EQ_ = function() {
  var not_EQ_ = null;
  var not_EQ___1 = function(x) {
    return false
  };
  var not_EQ___2 = function(x, y) {
    return!cljs.core._EQ_.call(null, x, y)
  };
  var not_EQ___3 = function() {
    var G__7487__delegate = function(x, y, more) {
      return cljs.core.not.call(null, cljs.core.apply.call(null, cljs.core._EQ_, x, y, more))
    };
    var G__7487 = function(x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__7487__delegate.call(this, x, y, more)
    };
    G__7487.cljs$lang$maxFixedArity = 2;
    G__7487.cljs$lang$applyTo = function(arglist__7488) {
      var x = cljs.core.first(arglist__7488);
      var y = cljs.core.first(cljs.core.next(arglist__7488));
      var more = cljs.core.rest(cljs.core.next(arglist__7488));
      return G__7487__delegate(x, y, more)
    };
    G__7487.cljs$lang$arity$variadic = G__7487__delegate;
    return G__7487
  }();
  not_EQ_ = function(x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 1:
        return not_EQ___1.call(this, x);
      case 2:
        return not_EQ___2.call(this, x, y);
      default:
        return not_EQ___3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  not_EQ_.cljs$lang$maxFixedArity = 2;
  not_EQ_.cljs$lang$applyTo = not_EQ___3.cljs$lang$applyTo;
  not_EQ_.cljs$lang$arity$1 = not_EQ___1;
  not_EQ_.cljs$lang$arity$2 = not_EQ___2;
  not_EQ_.cljs$lang$arity$variadic = not_EQ___3.cljs$lang$arity$variadic;
  return not_EQ_
}();
cljs.core.not_empty = function not_empty(coll) {
  if(cljs.core.seq.call(null, coll)) {
    return coll
  }else {
    return null
  }
};
cljs.core.every_QMARK_ = function every_QMARK_(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll) == null) {
      return true
    }else {
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, coll)))) {
        var G__7489 = pred;
        var G__7490 = cljs.core.next.call(null, coll);
        pred = G__7489;
        coll = G__7490;
        continue
      }else {
        if("\ufdd0'else") {
          return false
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.not_every_QMARK_ = function not_every_QMARK_(pred, coll) {
  return!cljs.core.every_QMARK_.call(null, pred, coll)
};
cljs.core.some = function some(pred, coll) {
  while(true) {
    if(cljs.core.seq.call(null, coll)) {
      var or__3943__auto____7492 = pred.call(null, cljs.core.first.call(null, coll));
      if(cljs.core.truth_(or__3943__auto____7492)) {
        return or__3943__auto____7492
      }else {
        var G__7493 = pred;
        var G__7494 = cljs.core.next.call(null, coll);
        pred = G__7493;
        coll = G__7494;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.not_any_QMARK_ = function not_any_QMARK_(pred, coll) {
  return cljs.core.not.call(null, cljs.core.some.call(null, pred, coll))
};
cljs.core.even_QMARK_ = function even_QMARK_(n) {
  if(cljs.core.integer_QMARK_.call(null, n)) {
    return(n & 1) === 0
  }else {
    throw new Error([cljs.core.str("Argument must be an integer: "), cljs.core.str(n)].join(""));
  }
};
cljs.core.odd_QMARK_ = function odd_QMARK_(n) {
  return!cljs.core.even_QMARK_.call(null, n)
};
cljs.core.identity = function identity(x) {
  return x
};
cljs.core.complement = function complement(f) {
  return function() {
    var G__7495 = null;
    var G__7495__0 = function() {
      return cljs.core.not.call(null, f.call(null))
    };
    var G__7495__1 = function(x) {
      return cljs.core.not.call(null, f.call(null, x))
    };
    var G__7495__2 = function(x, y) {
      return cljs.core.not.call(null, f.call(null, x, y))
    };
    var G__7495__3 = function() {
      var G__7496__delegate = function(x, y, zs) {
        return cljs.core.not.call(null, cljs.core.apply.call(null, f, x, y, zs))
      };
      var G__7496 = function(x, y, var_args) {
        var zs = null;
        if(goog.isDef(var_args)) {
          zs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
        }
        return G__7496__delegate.call(this, x, y, zs)
      };
      G__7496.cljs$lang$maxFixedArity = 2;
      G__7496.cljs$lang$applyTo = function(arglist__7497) {
        var x = cljs.core.first(arglist__7497);
        var y = cljs.core.first(cljs.core.next(arglist__7497));
        var zs = cljs.core.rest(cljs.core.next(arglist__7497));
        return G__7496__delegate(x, y, zs)
      };
      G__7496.cljs$lang$arity$variadic = G__7496__delegate;
      return G__7496
    }();
    G__7495 = function(x, y, var_args) {
      var zs = var_args;
      switch(arguments.length) {
        case 0:
          return G__7495__0.call(this);
        case 1:
          return G__7495__1.call(this, x);
        case 2:
          return G__7495__2.call(this, x, y);
        default:
          return G__7495__3.cljs$lang$arity$variadic(x, y, cljs.core.array_seq(arguments, 2))
      }
      throw"Invalid arity: " + arguments.length;
    };
    G__7495.cljs$lang$maxFixedArity = 2;
    G__7495.cljs$lang$applyTo = G__7495__3.cljs$lang$applyTo;
    return G__7495
  }()
};
cljs.core.constantly = function constantly(x) {
  return function() {
    var G__7498__delegate = function(args) {
      return x
    };
    var G__7498 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__7498__delegate.call(this, args)
    };
    G__7498.cljs$lang$maxFixedArity = 0;
    G__7498.cljs$lang$applyTo = function(arglist__7499) {
      var args = cljs.core.seq(arglist__7499);
      return G__7498__delegate(args)
    };
    G__7498.cljs$lang$arity$variadic = G__7498__delegate;
    return G__7498
  }()
};
cljs.core.comp = function() {
  var comp = null;
  var comp__0 = function() {
    return cljs.core.identity
  };
  var comp__1 = function(f) {
    return f
  };
  var comp__2 = function(f, g) {
    return function() {
      var G__7506 = null;
      var G__7506__0 = function() {
        return f.call(null, g.call(null))
      };
      var G__7506__1 = function(x) {
        return f.call(null, g.call(null, x))
      };
      var G__7506__2 = function(x, y) {
        return f.call(null, g.call(null, x, y))
      };
      var G__7506__3 = function(x, y, z) {
        return f.call(null, g.call(null, x, y, z))
      };
      var G__7506__4 = function() {
        var G__7507__delegate = function(x, y, z, args) {
          return f.call(null, cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__7507 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7507__delegate.call(this, x, y, z, args)
        };
        G__7507.cljs$lang$maxFixedArity = 3;
        G__7507.cljs$lang$applyTo = function(arglist__7508) {
          var x = cljs.core.first(arglist__7508);
          var y = cljs.core.first(cljs.core.next(arglist__7508));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7508)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7508)));
          return G__7507__delegate(x, y, z, args)
        };
        G__7507.cljs$lang$arity$variadic = G__7507__delegate;
        return G__7507
      }();
      G__7506 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7506__0.call(this);
          case 1:
            return G__7506__1.call(this, x);
          case 2:
            return G__7506__2.call(this, x, y);
          case 3:
            return G__7506__3.call(this, x, y, z);
          default:
            return G__7506__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7506.cljs$lang$maxFixedArity = 3;
      G__7506.cljs$lang$applyTo = G__7506__4.cljs$lang$applyTo;
      return G__7506
    }()
  };
  var comp__3 = function(f, g, h) {
    return function() {
      var G__7509 = null;
      var G__7509__0 = function() {
        return f.call(null, g.call(null, h.call(null)))
      };
      var G__7509__1 = function(x) {
        return f.call(null, g.call(null, h.call(null, x)))
      };
      var G__7509__2 = function(x, y) {
        return f.call(null, g.call(null, h.call(null, x, y)))
      };
      var G__7509__3 = function(x, y, z) {
        return f.call(null, g.call(null, h.call(null, x, y, z)))
      };
      var G__7509__4 = function() {
        var G__7510__delegate = function(x, y, z, args) {
          return f.call(null, g.call(null, cljs.core.apply.call(null, h, x, y, z, args)))
        };
        var G__7510 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7510__delegate.call(this, x, y, z, args)
        };
        G__7510.cljs$lang$maxFixedArity = 3;
        G__7510.cljs$lang$applyTo = function(arglist__7511) {
          var x = cljs.core.first(arglist__7511);
          var y = cljs.core.first(cljs.core.next(arglist__7511));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7511)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7511)));
          return G__7510__delegate(x, y, z, args)
        };
        G__7510.cljs$lang$arity$variadic = G__7510__delegate;
        return G__7510
      }();
      G__7509 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__7509__0.call(this);
          case 1:
            return G__7509__1.call(this, x);
          case 2:
            return G__7509__2.call(this, x, y);
          case 3:
            return G__7509__3.call(this, x, y, z);
          default:
            return G__7509__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7509.cljs$lang$maxFixedArity = 3;
      G__7509.cljs$lang$applyTo = G__7509__4.cljs$lang$applyTo;
      return G__7509
    }()
  };
  var comp__4 = function() {
    var G__7512__delegate = function(f1, f2, f3, fs) {
      var fs__7503 = cljs.core.reverse.call(null, cljs.core.list_STAR_.call(null, f1, f2, f3, fs));
      return function() {
        var G__7513__delegate = function(args) {
          var ret__7504 = cljs.core.apply.call(null, cljs.core.first.call(null, fs__7503), args);
          var fs__7505 = cljs.core.next.call(null, fs__7503);
          while(true) {
            if(fs__7505) {
              var G__7514 = cljs.core.first.call(null, fs__7505).call(null, ret__7504);
              var G__7515 = cljs.core.next.call(null, fs__7505);
              ret__7504 = G__7514;
              fs__7505 = G__7515;
              continue
            }else {
              return ret__7504
            }
            break
          }
        };
        var G__7513 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7513__delegate.call(this, args)
        };
        G__7513.cljs$lang$maxFixedArity = 0;
        G__7513.cljs$lang$applyTo = function(arglist__7516) {
          var args = cljs.core.seq(arglist__7516);
          return G__7513__delegate(args)
        };
        G__7513.cljs$lang$arity$variadic = G__7513__delegate;
        return G__7513
      }()
    };
    var G__7512 = function(f1, f2, f3, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7512__delegate.call(this, f1, f2, f3, fs)
    };
    G__7512.cljs$lang$maxFixedArity = 3;
    G__7512.cljs$lang$applyTo = function(arglist__7517) {
      var f1 = cljs.core.first(arglist__7517);
      var f2 = cljs.core.first(cljs.core.next(arglist__7517));
      var f3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7517)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7517)));
      return G__7512__delegate(f1, f2, f3, fs)
    };
    G__7512.cljs$lang$arity$variadic = G__7512__delegate;
    return G__7512
  }();
  comp = function(f1, f2, f3, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 0:
        return comp__0.call(this);
      case 1:
        return comp__1.call(this, f1);
      case 2:
        return comp__2.call(this, f1, f2);
      case 3:
        return comp__3.call(this, f1, f2, f3);
      default:
        return comp__4.cljs$lang$arity$variadic(f1, f2, f3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  comp.cljs$lang$maxFixedArity = 3;
  comp.cljs$lang$applyTo = comp__4.cljs$lang$applyTo;
  comp.cljs$lang$arity$0 = comp__0;
  comp.cljs$lang$arity$1 = comp__1;
  comp.cljs$lang$arity$2 = comp__2;
  comp.cljs$lang$arity$3 = comp__3;
  comp.cljs$lang$arity$variadic = comp__4.cljs$lang$arity$variadic;
  return comp
}();
cljs.core.partial = function() {
  var partial = null;
  var partial__2 = function(f, arg1) {
    return function() {
      var G__7518__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, args)
      };
      var G__7518 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7518__delegate.call(this, args)
      };
      G__7518.cljs$lang$maxFixedArity = 0;
      G__7518.cljs$lang$applyTo = function(arglist__7519) {
        var args = cljs.core.seq(arglist__7519);
        return G__7518__delegate(args)
      };
      G__7518.cljs$lang$arity$variadic = G__7518__delegate;
      return G__7518
    }()
  };
  var partial__3 = function(f, arg1, arg2) {
    return function() {
      var G__7520__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, args)
      };
      var G__7520 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7520__delegate.call(this, args)
      };
      G__7520.cljs$lang$maxFixedArity = 0;
      G__7520.cljs$lang$applyTo = function(arglist__7521) {
        var args = cljs.core.seq(arglist__7521);
        return G__7520__delegate(args)
      };
      G__7520.cljs$lang$arity$variadic = G__7520__delegate;
      return G__7520
    }()
  };
  var partial__4 = function(f, arg1, arg2, arg3) {
    return function() {
      var G__7522__delegate = function(args) {
        return cljs.core.apply.call(null, f, arg1, arg2, arg3, args)
      };
      var G__7522 = function(var_args) {
        var args = null;
        if(goog.isDef(var_args)) {
          args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
        }
        return G__7522__delegate.call(this, args)
      };
      G__7522.cljs$lang$maxFixedArity = 0;
      G__7522.cljs$lang$applyTo = function(arglist__7523) {
        var args = cljs.core.seq(arglist__7523);
        return G__7522__delegate(args)
      };
      G__7522.cljs$lang$arity$variadic = G__7522__delegate;
      return G__7522
    }()
  };
  var partial__5 = function() {
    var G__7524__delegate = function(f, arg1, arg2, arg3, more) {
      return function() {
        var G__7525__delegate = function(args) {
          return cljs.core.apply.call(null, f, arg1, arg2, arg3, cljs.core.concat.call(null, more, args))
        };
        var G__7525 = function(var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
          }
          return G__7525__delegate.call(this, args)
        };
        G__7525.cljs$lang$maxFixedArity = 0;
        G__7525.cljs$lang$applyTo = function(arglist__7526) {
          var args = cljs.core.seq(arglist__7526);
          return G__7525__delegate(args)
        };
        G__7525.cljs$lang$arity$variadic = G__7525__delegate;
        return G__7525
      }()
    };
    var G__7524 = function(f, arg1, arg2, arg3, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7524__delegate.call(this, f, arg1, arg2, arg3, more)
    };
    G__7524.cljs$lang$maxFixedArity = 4;
    G__7524.cljs$lang$applyTo = function(arglist__7527) {
      var f = cljs.core.first(arglist__7527);
      var arg1 = cljs.core.first(cljs.core.next(arglist__7527));
      var arg2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7527)));
      var arg3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7527))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7527))));
      return G__7524__delegate(f, arg1, arg2, arg3, more)
    };
    G__7524.cljs$lang$arity$variadic = G__7524__delegate;
    return G__7524
  }();
  partial = function(f, arg1, arg2, arg3, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return partial__2.call(this, f, arg1);
      case 3:
        return partial__3.call(this, f, arg1, arg2);
      case 4:
        return partial__4.call(this, f, arg1, arg2, arg3);
      default:
        return partial__5.cljs$lang$arity$variadic(f, arg1, arg2, arg3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  partial.cljs$lang$maxFixedArity = 4;
  partial.cljs$lang$applyTo = partial__5.cljs$lang$applyTo;
  partial.cljs$lang$arity$2 = partial__2;
  partial.cljs$lang$arity$3 = partial__3;
  partial.cljs$lang$arity$4 = partial__4;
  partial.cljs$lang$arity$variadic = partial__5.cljs$lang$arity$variadic;
  return partial
}();
cljs.core.fnil = function() {
  var fnil = null;
  var fnil__2 = function(f, x) {
    return function() {
      var G__7528 = null;
      var G__7528__1 = function(a) {
        return f.call(null, a == null ? x : a)
      };
      var G__7528__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b)
      };
      var G__7528__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b, c)
      };
      var G__7528__4 = function() {
        var G__7529__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b, c, ds)
        };
        var G__7529 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7529__delegate.call(this, a, b, c, ds)
        };
        G__7529.cljs$lang$maxFixedArity = 3;
        G__7529.cljs$lang$applyTo = function(arglist__7530) {
          var a = cljs.core.first(arglist__7530);
          var b = cljs.core.first(cljs.core.next(arglist__7530));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7530)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7530)));
          return G__7529__delegate(a, b, c, ds)
        };
        G__7529.cljs$lang$arity$variadic = G__7529__delegate;
        return G__7529
      }();
      G__7528 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 1:
            return G__7528__1.call(this, a);
          case 2:
            return G__7528__2.call(this, a, b);
          case 3:
            return G__7528__3.call(this, a, b, c);
          default:
            return G__7528__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7528.cljs$lang$maxFixedArity = 3;
      G__7528.cljs$lang$applyTo = G__7528__4.cljs$lang$applyTo;
      return G__7528
    }()
  };
  var fnil__3 = function(f, x, y) {
    return function() {
      var G__7531 = null;
      var G__7531__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7531__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c)
      };
      var G__7531__4 = function() {
        var G__7532__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c, ds)
        };
        var G__7532 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7532__delegate.call(this, a, b, c, ds)
        };
        G__7532.cljs$lang$maxFixedArity = 3;
        G__7532.cljs$lang$applyTo = function(arglist__7533) {
          var a = cljs.core.first(arglist__7533);
          var b = cljs.core.first(cljs.core.next(arglist__7533));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7533)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7533)));
          return G__7532__delegate(a, b, c, ds)
        };
        G__7532.cljs$lang$arity$variadic = G__7532__delegate;
        return G__7532
      }();
      G__7531 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7531__2.call(this, a, b);
          case 3:
            return G__7531__3.call(this, a, b, c);
          default:
            return G__7531__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7531.cljs$lang$maxFixedArity = 3;
      G__7531.cljs$lang$applyTo = G__7531__4.cljs$lang$applyTo;
      return G__7531
    }()
  };
  var fnil__4 = function(f, x, y, z) {
    return function() {
      var G__7534 = null;
      var G__7534__2 = function(a, b) {
        return f.call(null, a == null ? x : a, b == null ? y : b)
      };
      var G__7534__3 = function(a, b, c) {
        return f.call(null, a == null ? x : a, b == null ? y : b, c == null ? z : c)
      };
      var G__7534__4 = function() {
        var G__7535__delegate = function(a, b, c, ds) {
          return cljs.core.apply.call(null, f, a == null ? x : a, b == null ? y : b, c == null ? z : c, ds)
        };
        var G__7535 = function(a, b, c, var_args) {
          var ds = null;
          if(goog.isDef(var_args)) {
            ds = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7535__delegate.call(this, a, b, c, ds)
        };
        G__7535.cljs$lang$maxFixedArity = 3;
        G__7535.cljs$lang$applyTo = function(arglist__7536) {
          var a = cljs.core.first(arglist__7536);
          var b = cljs.core.first(cljs.core.next(arglist__7536));
          var c = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7536)));
          var ds = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7536)));
          return G__7535__delegate(a, b, c, ds)
        };
        G__7535.cljs$lang$arity$variadic = G__7535__delegate;
        return G__7535
      }();
      G__7534 = function(a, b, c, var_args) {
        var ds = var_args;
        switch(arguments.length) {
          case 2:
            return G__7534__2.call(this, a, b);
          case 3:
            return G__7534__3.call(this, a, b, c);
          default:
            return G__7534__4.cljs$lang$arity$variadic(a, b, c, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__7534.cljs$lang$maxFixedArity = 3;
      G__7534.cljs$lang$applyTo = G__7534__4.cljs$lang$applyTo;
      return G__7534
    }()
  };
  fnil = function(f, x, y, z) {
    switch(arguments.length) {
      case 2:
        return fnil__2.call(this, f, x);
      case 3:
        return fnil__3.call(this, f, x, y);
      case 4:
        return fnil__4.call(this, f, x, y, z)
    }
    throw"Invalid arity: " + arguments.length;
  };
  fnil.cljs$lang$arity$2 = fnil__2;
  fnil.cljs$lang$arity$3 = fnil__3;
  fnil.cljs$lang$arity$4 = fnil__4;
  return fnil
}();
cljs.core.map_indexed = function map_indexed(f, coll) {
  var mapi__7552 = function mapi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7560 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7560) {
        var s__7561 = temp__4092__auto____7560;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7561)) {
          var c__7562 = cljs.core.chunk_first.call(null, s__7561);
          var size__7563 = cljs.core.count.call(null, c__7562);
          var b__7564 = cljs.core.chunk_buffer.call(null, size__7563);
          var n__2476__auto____7565 = size__7563;
          var i__7566 = 0;
          while(true) {
            if(i__7566 < n__2476__auto____7565) {
              cljs.core.chunk_append.call(null, b__7564, f.call(null, idx + i__7566, cljs.core._nth.call(null, c__7562, i__7566)));
              var G__7567 = i__7566 + 1;
              i__7566 = G__7567;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7564), mapi.call(null, idx + size__7563, cljs.core.chunk_rest.call(null, s__7561)))
        }else {
          return cljs.core.cons.call(null, f.call(null, idx, cljs.core.first.call(null, s__7561)), mapi.call(null, idx + 1, cljs.core.rest.call(null, s__7561)))
        }
      }else {
        return null
      }
    }, null)
  };
  return mapi__7552.call(null, 0, coll)
};
cljs.core.keep = function keep(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____7577 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____7577) {
      var s__7578 = temp__4092__auto____7577;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__7578)) {
        var c__7579 = cljs.core.chunk_first.call(null, s__7578);
        var size__7580 = cljs.core.count.call(null, c__7579);
        var b__7581 = cljs.core.chunk_buffer.call(null, size__7580);
        var n__2476__auto____7582 = size__7580;
        var i__7583 = 0;
        while(true) {
          if(i__7583 < n__2476__auto____7582) {
            var x__7584 = f.call(null, cljs.core._nth.call(null, c__7579, i__7583));
            if(x__7584 == null) {
            }else {
              cljs.core.chunk_append.call(null, b__7581, x__7584)
            }
            var G__7586 = i__7583 + 1;
            i__7583 = G__7586;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7581), keep.call(null, f, cljs.core.chunk_rest.call(null, s__7578)))
      }else {
        var x__7585 = f.call(null, cljs.core.first.call(null, s__7578));
        if(x__7585 == null) {
          return keep.call(null, f, cljs.core.rest.call(null, s__7578))
        }else {
          return cljs.core.cons.call(null, x__7585, keep.call(null, f, cljs.core.rest.call(null, s__7578)))
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.keep_indexed = function keep_indexed(f, coll) {
  var keepi__7612 = function keepi(idx, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7622 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7622) {
        var s__7623 = temp__4092__auto____7622;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7623)) {
          var c__7624 = cljs.core.chunk_first.call(null, s__7623);
          var size__7625 = cljs.core.count.call(null, c__7624);
          var b__7626 = cljs.core.chunk_buffer.call(null, size__7625);
          var n__2476__auto____7627 = size__7625;
          var i__7628 = 0;
          while(true) {
            if(i__7628 < n__2476__auto____7627) {
              var x__7629 = f.call(null, idx + i__7628, cljs.core._nth.call(null, c__7624, i__7628));
              if(x__7629 == null) {
              }else {
                cljs.core.chunk_append.call(null, b__7626, x__7629)
              }
              var G__7631 = i__7628 + 1;
              i__7628 = G__7631;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7626), keepi.call(null, idx + size__7625, cljs.core.chunk_rest.call(null, s__7623)))
        }else {
          var x__7630 = f.call(null, idx, cljs.core.first.call(null, s__7623));
          if(x__7630 == null) {
            return keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7623))
          }else {
            return cljs.core.cons.call(null, x__7630, keepi.call(null, idx + 1, cljs.core.rest.call(null, s__7623)))
          }
        }
      }else {
        return null
      }
    }, null)
  };
  return keepi__7612.call(null, 0, coll)
};
cljs.core.every_pred = function() {
  var every_pred = null;
  var every_pred__1 = function(p) {
    return function() {
      var ep1 = null;
      var ep1__0 = function() {
        return true
      };
      var ep1__1 = function(x) {
        return cljs.core.boolean$.call(null, p.call(null, x))
      };
      var ep1__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7717 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7717)) {
            return p.call(null, y)
          }else {
            return and__3941__auto____7717
          }
        }())
      };
      var ep1__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7718 = p.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7718)) {
            var and__3941__auto____7719 = p.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7719)) {
              return p.call(null, z)
            }else {
              return and__3941__auto____7719
            }
          }else {
            return and__3941__auto____7718
          }
        }())
      };
      var ep1__4 = function() {
        var G__7788__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7720 = ep1.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7720)) {
              return cljs.core.every_QMARK_.call(null, p, args)
            }else {
              return and__3941__auto____7720
            }
          }())
        };
        var G__7788 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7788__delegate.call(this, x, y, z, args)
        };
        G__7788.cljs$lang$maxFixedArity = 3;
        G__7788.cljs$lang$applyTo = function(arglist__7789) {
          var x = cljs.core.first(arglist__7789);
          var y = cljs.core.first(cljs.core.next(arglist__7789));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7789)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7789)));
          return G__7788__delegate(x, y, z, args)
        };
        G__7788.cljs$lang$arity$variadic = G__7788__delegate;
        return G__7788
      }();
      ep1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep1__0.call(this);
          case 1:
            return ep1__1.call(this, x);
          case 2:
            return ep1__2.call(this, x, y);
          case 3:
            return ep1__3.call(this, x, y, z);
          default:
            return ep1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep1.cljs$lang$maxFixedArity = 3;
      ep1.cljs$lang$applyTo = ep1__4.cljs$lang$applyTo;
      ep1.cljs$lang$arity$0 = ep1__0;
      ep1.cljs$lang$arity$1 = ep1__1;
      ep1.cljs$lang$arity$2 = ep1__2;
      ep1.cljs$lang$arity$3 = ep1__3;
      ep1.cljs$lang$arity$variadic = ep1__4.cljs$lang$arity$variadic;
      return ep1
    }()
  };
  var every_pred__2 = function(p1, p2) {
    return function() {
      var ep2 = null;
      var ep2__0 = function() {
        return true
      };
      var ep2__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7732 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7732)) {
            return p2.call(null, x)
          }else {
            return and__3941__auto____7732
          }
        }())
      };
      var ep2__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7733 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7733)) {
            var and__3941__auto____7734 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7734)) {
              var and__3941__auto____7735 = p2.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7735)) {
                return p2.call(null, y)
              }else {
                return and__3941__auto____7735
              }
            }else {
              return and__3941__auto____7734
            }
          }else {
            return and__3941__auto____7733
          }
        }())
      };
      var ep2__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7736 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7736)) {
            var and__3941__auto____7737 = p1.call(null, y);
            if(cljs.core.truth_(and__3941__auto____7737)) {
              var and__3941__auto____7738 = p1.call(null, z);
              if(cljs.core.truth_(and__3941__auto____7738)) {
                var and__3941__auto____7739 = p2.call(null, x);
                if(cljs.core.truth_(and__3941__auto____7739)) {
                  var and__3941__auto____7740 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7740)) {
                    return p2.call(null, z)
                  }else {
                    return and__3941__auto____7740
                  }
                }else {
                  return and__3941__auto____7739
                }
              }else {
                return and__3941__auto____7738
              }
            }else {
              return and__3941__auto____7737
            }
          }else {
            return and__3941__auto____7736
          }
        }())
      };
      var ep2__4 = function() {
        var G__7790__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7741 = ep2.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7741)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7587_SHARP_) {
                var and__3941__auto____7742 = p1.call(null, p1__7587_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7742)) {
                  return p2.call(null, p1__7587_SHARP_)
                }else {
                  return and__3941__auto____7742
                }
              }, args)
            }else {
              return and__3941__auto____7741
            }
          }())
        };
        var G__7790 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7790__delegate.call(this, x, y, z, args)
        };
        G__7790.cljs$lang$maxFixedArity = 3;
        G__7790.cljs$lang$applyTo = function(arglist__7791) {
          var x = cljs.core.first(arglist__7791);
          var y = cljs.core.first(cljs.core.next(arglist__7791));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7791)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7791)));
          return G__7790__delegate(x, y, z, args)
        };
        G__7790.cljs$lang$arity$variadic = G__7790__delegate;
        return G__7790
      }();
      ep2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep2__0.call(this);
          case 1:
            return ep2__1.call(this, x);
          case 2:
            return ep2__2.call(this, x, y);
          case 3:
            return ep2__3.call(this, x, y, z);
          default:
            return ep2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep2.cljs$lang$maxFixedArity = 3;
      ep2.cljs$lang$applyTo = ep2__4.cljs$lang$applyTo;
      ep2.cljs$lang$arity$0 = ep2__0;
      ep2.cljs$lang$arity$1 = ep2__1;
      ep2.cljs$lang$arity$2 = ep2__2;
      ep2.cljs$lang$arity$3 = ep2__3;
      ep2.cljs$lang$arity$variadic = ep2__4.cljs$lang$arity$variadic;
      return ep2
    }()
  };
  var every_pred__3 = function(p1, p2, p3) {
    return function() {
      var ep3 = null;
      var ep3__0 = function() {
        return true
      };
      var ep3__1 = function(x) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7761 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7761)) {
            var and__3941__auto____7762 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7762)) {
              return p3.call(null, x)
            }else {
              return and__3941__auto____7762
            }
          }else {
            return and__3941__auto____7761
          }
        }())
      };
      var ep3__2 = function(x, y) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7763 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7763)) {
            var and__3941__auto____7764 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7764)) {
              var and__3941__auto____7765 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7765)) {
                var and__3941__auto____7766 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7766)) {
                  var and__3941__auto____7767 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7767)) {
                    return p3.call(null, y)
                  }else {
                    return and__3941__auto____7767
                  }
                }else {
                  return and__3941__auto____7766
                }
              }else {
                return and__3941__auto____7765
              }
            }else {
              return and__3941__auto____7764
            }
          }else {
            return and__3941__auto____7763
          }
        }())
      };
      var ep3__3 = function(x, y, z) {
        return cljs.core.boolean$.call(null, function() {
          var and__3941__auto____7768 = p1.call(null, x);
          if(cljs.core.truth_(and__3941__auto____7768)) {
            var and__3941__auto____7769 = p2.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7769)) {
              var and__3941__auto____7770 = p3.call(null, x);
              if(cljs.core.truth_(and__3941__auto____7770)) {
                var and__3941__auto____7771 = p1.call(null, y);
                if(cljs.core.truth_(and__3941__auto____7771)) {
                  var and__3941__auto____7772 = p2.call(null, y);
                  if(cljs.core.truth_(and__3941__auto____7772)) {
                    var and__3941__auto____7773 = p3.call(null, y);
                    if(cljs.core.truth_(and__3941__auto____7773)) {
                      var and__3941__auto____7774 = p1.call(null, z);
                      if(cljs.core.truth_(and__3941__auto____7774)) {
                        var and__3941__auto____7775 = p2.call(null, z);
                        if(cljs.core.truth_(and__3941__auto____7775)) {
                          return p3.call(null, z)
                        }else {
                          return and__3941__auto____7775
                        }
                      }else {
                        return and__3941__auto____7774
                      }
                    }else {
                      return and__3941__auto____7773
                    }
                  }else {
                    return and__3941__auto____7772
                  }
                }else {
                  return and__3941__auto____7771
                }
              }else {
                return and__3941__auto____7770
              }
            }else {
              return and__3941__auto____7769
            }
          }else {
            return and__3941__auto____7768
          }
        }())
      };
      var ep3__4 = function() {
        var G__7792__delegate = function(x, y, z, args) {
          return cljs.core.boolean$.call(null, function() {
            var and__3941__auto____7776 = ep3.call(null, x, y, z);
            if(cljs.core.truth_(and__3941__auto____7776)) {
              return cljs.core.every_QMARK_.call(null, function(p1__7588_SHARP_) {
                var and__3941__auto____7777 = p1.call(null, p1__7588_SHARP_);
                if(cljs.core.truth_(and__3941__auto____7777)) {
                  var and__3941__auto____7778 = p2.call(null, p1__7588_SHARP_);
                  if(cljs.core.truth_(and__3941__auto____7778)) {
                    return p3.call(null, p1__7588_SHARP_)
                  }else {
                    return and__3941__auto____7778
                  }
                }else {
                  return and__3941__auto____7777
                }
              }, args)
            }else {
              return and__3941__auto____7776
            }
          }())
        };
        var G__7792 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7792__delegate.call(this, x, y, z, args)
        };
        G__7792.cljs$lang$maxFixedArity = 3;
        G__7792.cljs$lang$applyTo = function(arglist__7793) {
          var x = cljs.core.first(arglist__7793);
          var y = cljs.core.first(cljs.core.next(arglist__7793));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7793)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7793)));
          return G__7792__delegate(x, y, z, args)
        };
        G__7792.cljs$lang$arity$variadic = G__7792__delegate;
        return G__7792
      }();
      ep3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return ep3__0.call(this);
          case 1:
            return ep3__1.call(this, x);
          case 2:
            return ep3__2.call(this, x, y);
          case 3:
            return ep3__3.call(this, x, y, z);
          default:
            return ep3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      ep3.cljs$lang$maxFixedArity = 3;
      ep3.cljs$lang$applyTo = ep3__4.cljs$lang$applyTo;
      ep3.cljs$lang$arity$0 = ep3__0;
      ep3.cljs$lang$arity$1 = ep3__1;
      ep3.cljs$lang$arity$2 = ep3__2;
      ep3.cljs$lang$arity$3 = ep3__3;
      ep3.cljs$lang$arity$variadic = ep3__4.cljs$lang$arity$variadic;
      return ep3
    }()
  };
  var every_pred__4 = function() {
    var G__7794__delegate = function(p1, p2, p3, ps) {
      var ps__7779 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var epn = null;
        var epn__0 = function() {
          return true
        };
        var epn__1 = function(x) {
          return cljs.core.every_QMARK_.call(null, function(p1__7589_SHARP_) {
            return p1__7589_SHARP_.call(null, x)
          }, ps__7779)
        };
        var epn__2 = function(x, y) {
          return cljs.core.every_QMARK_.call(null, function(p1__7590_SHARP_) {
            var and__3941__auto____7784 = p1__7590_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7784)) {
              return p1__7590_SHARP_.call(null, y)
            }else {
              return and__3941__auto____7784
            }
          }, ps__7779)
        };
        var epn__3 = function(x, y, z) {
          return cljs.core.every_QMARK_.call(null, function(p1__7591_SHARP_) {
            var and__3941__auto____7785 = p1__7591_SHARP_.call(null, x);
            if(cljs.core.truth_(and__3941__auto____7785)) {
              var and__3941__auto____7786 = p1__7591_SHARP_.call(null, y);
              if(cljs.core.truth_(and__3941__auto____7786)) {
                return p1__7591_SHARP_.call(null, z)
              }else {
                return and__3941__auto____7786
              }
            }else {
              return and__3941__auto____7785
            }
          }, ps__7779)
        };
        var epn__4 = function() {
          var G__7795__delegate = function(x, y, z, args) {
            return cljs.core.boolean$.call(null, function() {
              var and__3941__auto____7787 = epn.call(null, x, y, z);
              if(cljs.core.truth_(and__3941__auto____7787)) {
                return cljs.core.every_QMARK_.call(null, function(p1__7592_SHARP_) {
                  return cljs.core.every_QMARK_.call(null, p1__7592_SHARP_, args)
                }, ps__7779)
              }else {
                return and__3941__auto____7787
              }
            }())
          };
          var G__7795 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7795__delegate.call(this, x, y, z, args)
          };
          G__7795.cljs$lang$maxFixedArity = 3;
          G__7795.cljs$lang$applyTo = function(arglist__7796) {
            var x = cljs.core.first(arglist__7796);
            var y = cljs.core.first(cljs.core.next(arglist__7796));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7796)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7796)));
            return G__7795__delegate(x, y, z, args)
          };
          G__7795.cljs$lang$arity$variadic = G__7795__delegate;
          return G__7795
        }();
        epn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return epn__0.call(this);
            case 1:
              return epn__1.call(this, x);
            case 2:
              return epn__2.call(this, x, y);
            case 3:
              return epn__3.call(this, x, y, z);
            default:
              return epn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        epn.cljs$lang$maxFixedArity = 3;
        epn.cljs$lang$applyTo = epn__4.cljs$lang$applyTo;
        epn.cljs$lang$arity$0 = epn__0;
        epn.cljs$lang$arity$1 = epn__1;
        epn.cljs$lang$arity$2 = epn__2;
        epn.cljs$lang$arity$3 = epn__3;
        epn.cljs$lang$arity$variadic = epn__4.cljs$lang$arity$variadic;
        return epn
      }()
    };
    var G__7794 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7794__delegate.call(this, p1, p2, p3, ps)
    };
    G__7794.cljs$lang$maxFixedArity = 3;
    G__7794.cljs$lang$applyTo = function(arglist__7797) {
      var p1 = cljs.core.first(arglist__7797);
      var p2 = cljs.core.first(cljs.core.next(arglist__7797));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7797)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7797)));
      return G__7794__delegate(p1, p2, p3, ps)
    };
    G__7794.cljs$lang$arity$variadic = G__7794__delegate;
    return G__7794
  }();
  every_pred = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return every_pred__1.call(this, p1);
      case 2:
        return every_pred__2.call(this, p1, p2);
      case 3:
        return every_pred__3.call(this, p1, p2, p3);
      default:
        return every_pred__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  every_pred.cljs$lang$maxFixedArity = 3;
  every_pred.cljs$lang$applyTo = every_pred__4.cljs$lang$applyTo;
  every_pred.cljs$lang$arity$1 = every_pred__1;
  every_pred.cljs$lang$arity$2 = every_pred__2;
  every_pred.cljs$lang$arity$3 = every_pred__3;
  every_pred.cljs$lang$arity$variadic = every_pred__4.cljs$lang$arity$variadic;
  return every_pred
}();
cljs.core.some_fn = function() {
  var some_fn = null;
  var some_fn__1 = function(p) {
    return function() {
      var sp1 = null;
      var sp1__0 = function() {
        return null
      };
      var sp1__1 = function(x) {
        return p.call(null, x)
      };
      var sp1__2 = function(x, y) {
        var or__3943__auto____7878 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7878)) {
          return or__3943__auto____7878
        }else {
          return p.call(null, y)
        }
      };
      var sp1__3 = function(x, y, z) {
        var or__3943__auto____7879 = p.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7879)) {
          return or__3943__auto____7879
        }else {
          var or__3943__auto____7880 = p.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7880)) {
            return or__3943__auto____7880
          }else {
            return p.call(null, z)
          }
        }
      };
      var sp1__4 = function() {
        var G__7949__delegate = function(x, y, z, args) {
          var or__3943__auto____7881 = sp1.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7881)) {
            return or__3943__auto____7881
          }else {
            return cljs.core.some.call(null, p, args)
          }
        };
        var G__7949 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7949__delegate.call(this, x, y, z, args)
        };
        G__7949.cljs$lang$maxFixedArity = 3;
        G__7949.cljs$lang$applyTo = function(arglist__7950) {
          var x = cljs.core.first(arglist__7950);
          var y = cljs.core.first(cljs.core.next(arglist__7950));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7950)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7950)));
          return G__7949__delegate(x, y, z, args)
        };
        G__7949.cljs$lang$arity$variadic = G__7949__delegate;
        return G__7949
      }();
      sp1 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp1__0.call(this);
          case 1:
            return sp1__1.call(this, x);
          case 2:
            return sp1__2.call(this, x, y);
          case 3:
            return sp1__3.call(this, x, y, z);
          default:
            return sp1__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp1.cljs$lang$maxFixedArity = 3;
      sp1.cljs$lang$applyTo = sp1__4.cljs$lang$applyTo;
      sp1.cljs$lang$arity$0 = sp1__0;
      sp1.cljs$lang$arity$1 = sp1__1;
      sp1.cljs$lang$arity$2 = sp1__2;
      sp1.cljs$lang$arity$3 = sp1__3;
      sp1.cljs$lang$arity$variadic = sp1__4.cljs$lang$arity$variadic;
      return sp1
    }()
  };
  var some_fn__2 = function(p1, p2) {
    return function() {
      var sp2 = null;
      var sp2__0 = function() {
        return null
      };
      var sp2__1 = function(x) {
        var or__3943__auto____7893 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7893)) {
          return or__3943__auto____7893
        }else {
          return p2.call(null, x)
        }
      };
      var sp2__2 = function(x, y) {
        var or__3943__auto____7894 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7894)) {
          return or__3943__auto____7894
        }else {
          var or__3943__auto____7895 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7895)) {
            return or__3943__auto____7895
          }else {
            var or__3943__auto____7896 = p2.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7896)) {
              return or__3943__auto____7896
            }else {
              return p2.call(null, y)
            }
          }
        }
      };
      var sp2__3 = function(x, y, z) {
        var or__3943__auto____7897 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7897)) {
          return or__3943__auto____7897
        }else {
          var or__3943__auto____7898 = p1.call(null, y);
          if(cljs.core.truth_(or__3943__auto____7898)) {
            return or__3943__auto____7898
          }else {
            var or__3943__auto____7899 = p1.call(null, z);
            if(cljs.core.truth_(or__3943__auto____7899)) {
              return or__3943__auto____7899
            }else {
              var or__3943__auto____7900 = p2.call(null, x);
              if(cljs.core.truth_(or__3943__auto____7900)) {
                return or__3943__auto____7900
              }else {
                var or__3943__auto____7901 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7901)) {
                  return or__3943__auto____7901
                }else {
                  return p2.call(null, z)
                }
              }
            }
          }
        }
      };
      var sp2__4 = function() {
        var G__7951__delegate = function(x, y, z, args) {
          var or__3943__auto____7902 = sp2.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7902)) {
            return or__3943__auto____7902
          }else {
            return cljs.core.some.call(null, function(p1__7632_SHARP_) {
              var or__3943__auto____7903 = p1.call(null, p1__7632_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7903)) {
                return or__3943__auto____7903
              }else {
                return p2.call(null, p1__7632_SHARP_)
              }
            }, args)
          }
        };
        var G__7951 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7951__delegate.call(this, x, y, z, args)
        };
        G__7951.cljs$lang$maxFixedArity = 3;
        G__7951.cljs$lang$applyTo = function(arglist__7952) {
          var x = cljs.core.first(arglist__7952);
          var y = cljs.core.first(cljs.core.next(arglist__7952));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7952)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7952)));
          return G__7951__delegate(x, y, z, args)
        };
        G__7951.cljs$lang$arity$variadic = G__7951__delegate;
        return G__7951
      }();
      sp2 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp2__0.call(this);
          case 1:
            return sp2__1.call(this, x);
          case 2:
            return sp2__2.call(this, x, y);
          case 3:
            return sp2__3.call(this, x, y, z);
          default:
            return sp2__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp2.cljs$lang$maxFixedArity = 3;
      sp2.cljs$lang$applyTo = sp2__4.cljs$lang$applyTo;
      sp2.cljs$lang$arity$0 = sp2__0;
      sp2.cljs$lang$arity$1 = sp2__1;
      sp2.cljs$lang$arity$2 = sp2__2;
      sp2.cljs$lang$arity$3 = sp2__3;
      sp2.cljs$lang$arity$variadic = sp2__4.cljs$lang$arity$variadic;
      return sp2
    }()
  };
  var some_fn__3 = function(p1, p2, p3) {
    return function() {
      var sp3 = null;
      var sp3__0 = function() {
        return null
      };
      var sp3__1 = function(x) {
        var or__3943__auto____7922 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7922)) {
          return or__3943__auto____7922
        }else {
          var or__3943__auto____7923 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7923)) {
            return or__3943__auto____7923
          }else {
            return p3.call(null, x)
          }
        }
      };
      var sp3__2 = function(x, y) {
        var or__3943__auto____7924 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7924)) {
          return or__3943__auto____7924
        }else {
          var or__3943__auto____7925 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7925)) {
            return or__3943__auto____7925
          }else {
            var or__3943__auto____7926 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7926)) {
              return or__3943__auto____7926
            }else {
              var or__3943__auto____7927 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7927)) {
                return or__3943__auto____7927
              }else {
                var or__3943__auto____7928 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7928)) {
                  return or__3943__auto____7928
                }else {
                  return p3.call(null, y)
                }
              }
            }
          }
        }
      };
      var sp3__3 = function(x, y, z) {
        var or__3943__auto____7929 = p1.call(null, x);
        if(cljs.core.truth_(or__3943__auto____7929)) {
          return or__3943__auto____7929
        }else {
          var or__3943__auto____7930 = p2.call(null, x);
          if(cljs.core.truth_(or__3943__auto____7930)) {
            return or__3943__auto____7930
          }else {
            var or__3943__auto____7931 = p3.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7931)) {
              return or__3943__auto____7931
            }else {
              var or__3943__auto____7932 = p1.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7932)) {
                return or__3943__auto____7932
              }else {
                var or__3943__auto____7933 = p2.call(null, y);
                if(cljs.core.truth_(or__3943__auto____7933)) {
                  return or__3943__auto____7933
                }else {
                  var or__3943__auto____7934 = p3.call(null, y);
                  if(cljs.core.truth_(or__3943__auto____7934)) {
                    return or__3943__auto____7934
                  }else {
                    var or__3943__auto____7935 = p1.call(null, z);
                    if(cljs.core.truth_(or__3943__auto____7935)) {
                      return or__3943__auto____7935
                    }else {
                      var or__3943__auto____7936 = p2.call(null, z);
                      if(cljs.core.truth_(or__3943__auto____7936)) {
                        return or__3943__auto____7936
                      }else {
                        return p3.call(null, z)
                      }
                    }
                  }
                }
              }
            }
          }
        }
      };
      var sp3__4 = function() {
        var G__7953__delegate = function(x, y, z, args) {
          var or__3943__auto____7937 = sp3.call(null, x, y, z);
          if(cljs.core.truth_(or__3943__auto____7937)) {
            return or__3943__auto____7937
          }else {
            return cljs.core.some.call(null, function(p1__7633_SHARP_) {
              var or__3943__auto____7938 = p1.call(null, p1__7633_SHARP_);
              if(cljs.core.truth_(or__3943__auto____7938)) {
                return or__3943__auto____7938
              }else {
                var or__3943__auto____7939 = p2.call(null, p1__7633_SHARP_);
                if(cljs.core.truth_(or__3943__auto____7939)) {
                  return or__3943__auto____7939
                }else {
                  return p3.call(null, p1__7633_SHARP_)
                }
              }
            }, args)
          }
        };
        var G__7953 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__7953__delegate.call(this, x, y, z, args)
        };
        G__7953.cljs$lang$maxFixedArity = 3;
        G__7953.cljs$lang$applyTo = function(arglist__7954) {
          var x = cljs.core.first(arglist__7954);
          var y = cljs.core.first(cljs.core.next(arglist__7954));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7954)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7954)));
          return G__7953__delegate(x, y, z, args)
        };
        G__7953.cljs$lang$arity$variadic = G__7953__delegate;
        return G__7953
      }();
      sp3 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return sp3__0.call(this);
          case 1:
            return sp3__1.call(this, x);
          case 2:
            return sp3__2.call(this, x, y);
          case 3:
            return sp3__3.call(this, x, y, z);
          default:
            return sp3__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      sp3.cljs$lang$maxFixedArity = 3;
      sp3.cljs$lang$applyTo = sp3__4.cljs$lang$applyTo;
      sp3.cljs$lang$arity$0 = sp3__0;
      sp3.cljs$lang$arity$1 = sp3__1;
      sp3.cljs$lang$arity$2 = sp3__2;
      sp3.cljs$lang$arity$3 = sp3__3;
      sp3.cljs$lang$arity$variadic = sp3__4.cljs$lang$arity$variadic;
      return sp3
    }()
  };
  var some_fn__4 = function() {
    var G__7955__delegate = function(p1, p2, p3, ps) {
      var ps__7940 = cljs.core.list_STAR_.call(null, p1, p2, p3, ps);
      return function() {
        var spn = null;
        var spn__0 = function() {
          return null
        };
        var spn__1 = function(x) {
          return cljs.core.some.call(null, function(p1__7634_SHARP_) {
            return p1__7634_SHARP_.call(null, x)
          }, ps__7940)
        };
        var spn__2 = function(x, y) {
          return cljs.core.some.call(null, function(p1__7635_SHARP_) {
            var or__3943__auto____7945 = p1__7635_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7945)) {
              return or__3943__auto____7945
            }else {
              return p1__7635_SHARP_.call(null, y)
            }
          }, ps__7940)
        };
        var spn__3 = function(x, y, z) {
          return cljs.core.some.call(null, function(p1__7636_SHARP_) {
            var or__3943__auto____7946 = p1__7636_SHARP_.call(null, x);
            if(cljs.core.truth_(or__3943__auto____7946)) {
              return or__3943__auto____7946
            }else {
              var or__3943__auto____7947 = p1__7636_SHARP_.call(null, y);
              if(cljs.core.truth_(or__3943__auto____7947)) {
                return or__3943__auto____7947
              }else {
                return p1__7636_SHARP_.call(null, z)
              }
            }
          }, ps__7940)
        };
        var spn__4 = function() {
          var G__7956__delegate = function(x, y, z, args) {
            var or__3943__auto____7948 = spn.call(null, x, y, z);
            if(cljs.core.truth_(or__3943__auto____7948)) {
              return or__3943__auto____7948
            }else {
              return cljs.core.some.call(null, function(p1__7637_SHARP_) {
                return cljs.core.some.call(null, p1__7637_SHARP_, args)
              }, ps__7940)
            }
          };
          var G__7956 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__7956__delegate.call(this, x, y, z, args)
          };
          G__7956.cljs$lang$maxFixedArity = 3;
          G__7956.cljs$lang$applyTo = function(arglist__7957) {
            var x = cljs.core.first(arglist__7957);
            var y = cljs.core.first(cljs.core.next(arglist__7957));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7957)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7957)));
            return G__7956__delegate(x, y, z, args)
          };
          G__7956.cljs$lang$arity$variadic = G__7956__delegate;
          return G__7956
        }();
        spn = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return spn__0.call(this);
            case 1:
              return spn__1.call(this, x);
            case 2:
              return spn__2.call(this, x, y);
            case 3:
              return spn__3.call(this, x, y, z);
            default:
              return spn__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        spn.cljs$lang$maxFixedArity = 3;
        spn.cljs$lang$applyTo = spn__4.cljs$lang$applyTo;
        spn.cljs$lang$arity$0 = spn__0;
        spn.cljs$lang$arity$1 = spn__1;
        spn.cljs$lang$arity$2 = spn__2;
        spn.cljs$lang$arity$3 = spn__3;
        spn.cljs$lang$arity$variadic = spn__4.cljs$lang$arity$variadic;
        return spn
      }()
    };
    var G__7955 = function(p1, p2, p3, var_args) {
      var ps = null;
      if(goog.isDef(var_args)) {
        ps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__7955__delegate.call(this, p1, p2, p3, ps)
    };
    G__7955.cljs$lang$maxFixedArity = 3;
    G__7955.cljs$lang$applyTo = function(arglist__7958) {
      var p1 = cljs.core.first(arglist__7958);
      var p2 = cljs.core.first(cljs.core.next(arglist__7958));
      var p3 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7958)));
      var ps = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__7958)));
      return G__7955__delegate(p1, p2, p3, ps)
    };
    G__7955.cljs$lang$arity$variadic = G__7955__delegate;
    return G__7955
  }();
  some_fn = function(p1, p2, p3, var_args) {
    var ps = var_args;
    switch(arguments.length) {
      case 1:
        return some_fn__1.call(this, p1);
      case 2:
        return some_fn__2.call(this, p1, p2);
      case 3:
        return some_fn__3.call(this, p1, p2, p3);
      default:
        return some_fn__4.cljs$lang$arity$variadic(p1, p2, p3, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  some_fn.cljs$lang$maxFixedArity = 3;
  some_fn.cljs$lang$applyTo = some_fn__4.cljs$lang$applyTo;
  some_fn.cljs$lang$arity$1 = some_fn__1;
  some_fn.cljs$lang$arity$2 = some_fn__2;
  some_fn.cljs$lang$arity$3 = some_fn__3;
  some_fn.cljs$lang$arity$variadic = some_fn__4.cljs$lang$arity$variadic;
  return some_fn
}();
cljs.core.map = function() {
  var map = null;
  var map__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____7977 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____7977) {
        var s__7978 = temp__4092__auto____7977;
        if(cljs.core.chunked_seq_QMARK_.call(null, s__7978)) {
          var c__7979 = cljs.core.chunk_first.call(null, s__7978);
          var size__7980 = cljs.core.count.call(null, c__7979);
          var b__7981 = cljs.core.chunk_buffer.call(null, size__7980);
          var n__2476__auto____7982 = size__7980;
          var i__7983 = 0;
          while(true) {
            if(i__7983 < n__2476__auto____7982) {
              cljs.core.chunk_append.call(null, b__7981, f.call(null, cljs.core._nth.call(null, c__7979, i__7983)));
              var G__7995 = i__7983 + 1;
              i__7983 = G__7995;
              continue
            }else {
            }
            break
          }
          return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__7981), map.call(null, f, cljs.core.chunk_rest.call(null, s__7978)))
        }else {
          return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s__7978)), map.call(null, f, cljs.core.rest.call(null, s__7978)))
        }
      }else {
        return null
      }
    }, null)
  };
  var map__3 = function(f, c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7984 = cljs.core.seq.call(null, c1);
      var s2__7985 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____7986 = s1__7984;
        if(and__3941__auto____7986) {
          return s2__7985
        }else {
          return and__3941__auto____7986
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7984), cljs.core.first.call(null, s2__7985)), map.call(null, f, cljs.core.rest.call(null, s1__7984), cljs.core.rest.call(null, s2__7985)))
      }else {
        return null
      }
    }, null)
  };
  var map__4 = function(f, c1, c2, c3) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__7987 = cljs.core.seq.call(null, c1);
      var s2__7988 = cljs.core.seq.call(null, c2);
      var s3__7989 = cljs.core.seq.call(null, c3);
      if(function() {
        var and__3941__auto____7990 = s1__7987;
        if(and__3941__auto____7990) {
          var and__3941__auto____7991 = s2__7988;
          if(and__3941__auto____7991) {
            return s3__7989
          }else {
            return and__3941__auto____7991
          }
        }else {
          return and__3941__auto____7990
        }
      }()) {
        return cljs.core.cons.call(null, f.call(null, cljs.core.first.call(null, s1__7987), cljs.core.first.call(null, s2__7988), cljs.core.first.call(null, s3__7989)), map.call(null, f, cljs.core.rest.call(null, s1__7987), cljs.core.rest.call(null, s2__7988), cljs.core.rest.call(null, s3__7989)))
      }else {
        return null
      }
    }, null)
  };
  var map__5 = function() {
    var G__7996__delegate = function(f, c1, c2, c3, colls) {
      var step__7994 = function step(cs) {
        return new cljs.core.LazySeq(null, false, function() {
          var ss__7993 = map.call(null, cljs.core.seq, cs);
          if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__7993)) {
            return cljs.core.cons.call(null, map.call(null, cljs.core.first, ss__7993), step.call(null, map.call(null, cljs.core.rest, ss__7993)))
          }else {
            return null
          }
        }, null)
      };
      return map.call(null, function(p1__7798_SHARP_) {
        return cljs.core.apply.call(null, f, p1__7798_SHARP_)
      }, step__7994.call(null, cljs.core.conj.call(null, colls, c3, c2, c1)))
    };
    var G__7996 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__7996__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__7996.cljs$lang$maxFixedArity = 4;
    G__7996.cljs$lang$applyTo = function(arglist__7997) {
      var f = cljs.core.first(arglist__7997);
      var c1 = cljs.core.first(cljs.core.next(arglist__7997));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__7997)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7997))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__7997))));
      return G__7996__delegate(f, c1, c2, c3, colls)
    };
    G__7996.cljs$lang$arity$variadic = G__7996__delegate;
    return G__7996
  }();
  map = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return map__2.call(this, f, c1);
      case 3:
        return map__3.call(this, f, c1, c2);
      case 4:
        return map__4.call(this, f, c1, c2, c3);
      default:
        return map__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  map.cljs$lang$maxFixedArity = 4;
  map.cljs$lang$applyTo = map__5.cljs$lang$applyTo;
  map.cljs$lang$arity$2 = map__2;
  map.cljs$lang$arity$3 = map__3;
  map.cljs$lang$arity$4 = map__4;
  map.cljs$lang$arity$variadic = map__5.cljs$lang$arity$variadic;
  return map
}();
cljs.core.take = function take(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    if(n > 0) {
      var temp__4092__auto____8000 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8000) {
        var s__8001 = temp__4092__auto____8000;
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__8001), take.call(null, n - 1, cljs.core.rest.call(null, s__8001)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.drop = function drop(n, coll) {
  var step__8007 = function(n, coll) {
    while(true) {
      var s__8005 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8006 = n > 0;
        if(and__3941__auto____8006) {
          return s__8005
        }else {
          return and__3941__auto____8006
        }
      }())) {
        var G__8008 = n - 1;
        var G__8009 = cljs.core.rest.call(null, s__8005);
        n = G__8008;
        coll = G__8009;
        continue
      }else {
        return s__8005
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8007.call(null, n, coll)
  }, null)
};
cljs.core.drop_last = function() {
  var drop_last = null;
  var drop_last__1 = function(s) {
    return drop_last.call(null, 1, s)
  };
  var drop_last__2 = function(n, s) {
    return cljs.core.map.call(null, function(x, _) {
      return x
    }, s, cljs.core.drop.call(null, n, s))
  };
  drop_last = function(n, s) {
    switch(arguments.length) {
      case 1:
        return drop_last__1.call(this, n);
      case 2:
        return drop_last__2.call(this, n, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  drop_last.cljs$lang$arity$1 = drop_last__1;
  drop_last.cljs$lang$arity$2 = drop_last__2;
  return drop_last
}();
cljs.core.take_last = function take_last(n, coll) {
  var s__8012 = cljs.core.seq.call(null, coll);
  var lead__8013 = cljs.core.seq.call(null, cljs.core.drop.call(null, n, coll));
  while(true) {
    if(lead__8013) {
      var G__8014 = cljs.core.next.call(null, s__8012);
      var G__8015 = cljs.core.next.call(null, lead__8013);
      s__8012 = G__8014;
      lead__8013 = G__8015;
      continue
    }else {
      return s__8012
    }
    break
  }
};
cljs.core.drop_while = function drop_while(pred, coll) {
  var step__8021 = function(pred, coll) {
    while(true) {
      var s__8019 = cljs.core.seq.call(null, coll);
      if(cljs.core.truth_(function() {
        var and__3941__auto____8020 = s__8019;
        if(and__3941__auto____8020) {
          return pred.call(null, cljs.core.first.call(null, s__8019))
        }else {
          return and__3941__auto____8020
        }
      }())) {
        var G__8022 = pred;
        var G__8023 = cljs.core.rest.call(null, s__8019);
        pred = G__8022;
        coll = G__8023;
        continue
      }else {
        return s__8019
      }
      break
    }
  };
  return new cljs.core.LazySeq(null, false, function() {
    return step__8021.call(null, pred, coll)
  }, null)
};
cljs.core.cycle = function cycle(coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8026 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8026) {
      var s__8027 = temp__4092__auto____8026;
      return cljs.core.concat.call(null, s__8027, cycle.call(null, s__8027))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_at = function split_at(n, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take.call(null, n, coll), cljs.core.drop.call(null, n, coll)], true)
};
cljs.core.repeat = function() {
  var repeat = null;
  var repeat__1 = function(x) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, x, repeat.call(null, x))
    }, null)
  };
  var repeat__2 = function(n, x) {
    return cljs.core.take.call(null, n, repeat.call(null, x))
  };
  repeat = function(n, x) {
    switch(arguments.length) {
      case 1:
        return repeat__1.call(this, n);
      case 2:
        return repeat__2.call(this, n, x)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeat.cljs$lang$arity$1 = repeat__1;
  repeat.cljs$lang$arity$2 = repeat__2;
  return repeat
}();
cljs.core.replicate = function replicate(n, x) {
  return cljs.core.take.call(null, n, cljs.core.repeat.call(null, x))
};
cljs.core.repeatedly = function() {
  var repeatedly = null;
  var repeatedly__1 = function(f) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, f.call(null), repeatedly.call(null, f))
    }, null)
  };
  var repeatedly__2 = function(n, f) {
    return cljs.core.take.call(null, n, repeatedly.call(null, f))
  };
  repeatedly = function(n, f) {
    switch(arguments.length) {
      case 1:
        return repeatedly__1.call(this, n);
      case 2:
        return repeatedly__2.call(this, n, f)
    }
    throw"Invalid arity: " + arguments.length;
  };
  repeatedly.cljs$lang$arity$1 = repeatedly__1;
  repeatedly.cljs$lang$arity$2 = repeatedly__2;
  return repeatedly
}();
cljs.core.iterate = function iterate(f, x) {
  return cljs.core.cons.call(null, x, new cljs.core.LazySeq(null, false, function() {
    return iterate.call(null, f, f.call(null, x))
  }, null))
};
cljs.core.interleave = function() {
  var interleave = null;
  var interleave__2 = function(c1, c2) {
    return new cljs.core.LazySeq(null, false, function() {
      var s1__8032 = cljs.core.seq.call(null, c1);
      var s2__8033 = cljs.core.seq.call(null, c2);
      if(function() {
        var and__3941__auto____8034 = s1__8032;
        if(and__3941__auto____8034) {
          return s2__8033
        }else {
          return and__3941__auto____8034
        }
      }()) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s1__8032), cljs.core.cons.call(null, cljs.core.first.call(null, s2__8033), interleave.call(null, cljs.core.rest.call(null, s1__8032), cljs.core.rest.call(null, s2__8033))))
      }else {
        return null
      }
    }, null)
  };
  var interleave__3 = function() {
    var G__8036__delegate = function(c1, c2, colls) {
      return new cljs.core.LazySeq(null, false, function() {
        var ss__8035 = cljs.core.map.call(null, cljs.core.seq, cljs.core.conj.call(null, colls, c2, c1));
        if(cljs.core.every_QMARK_.call(null, cljs.core.identity, ss__8035)) {
          return cljs.core.concat.call(null, cljs.core.map.call(null, cljs.core.first, ss__8035), cljs.core.apply.call(null, interleave, cljs.core.map.call(null, cljs.core.rest, ss__8035)))
        }else {
          return null
        }
      }, null)
    };
    var G__8036 = function(c1, c2, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8036__delegate.call(this, c1, c2, colls)
    };
    G__8036.cljs$lang$maxFixedArity = 2;
    G__8036.cljs$lang$applyTo = function(arglist__8037) {
      var c1 = cljs.core.first(arglist__8037);
      var c2 = cljs.core.first(cljs.core.next(arglist__8037));
      var colls = cljs.core.rest(cljs.core.next(arglist__8037));
      return G__8036__delegate(c1, c2, colls)
    };
    G__8036.cljs$lang$arity$variadic = G__8036__delegate;
    return G__8036
  }();
  interleave = function(c1, c2, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return interleave__2.call(this, c1, c2);
      default:
        return interleave__3.cljs$lang$arity$variadic(c1, c2, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  interleave.cljs$lang$maxFixedArity = 2;
  interleave.cljs$lang$applyTo = interleave__3.cljs$lang$applyTo;
  interleave.cljs$lang$arity$2 = interleave__2;
  interleave.cljs$lang$arity$variadic = interleave__3.cljs$lang$arity$variadic;
  return interleave
}();
cljs.core.interpose = function interpose(sep, coll) {
  return cljs.core.drop.call(null, 1, cljs.core.interleave.call(null, cljs.core.repeat.call(null, sep), coll))
};
cljs.core.flatten1 = function flatten1(colls) {
  var cat__8047 = function cat(coll, colls) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____8045 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____8045) {
        var coll__8046 = temp__4090__auto____8045;
        return cljs.core.cons.call(null, cljs.core.first.call(null, coll__8046), cat.call(null, cljs.core.rest.call(null, coll__8046), colls))
      }else {
        if(cljs.core.seq.call(null, colls)) {
          return cat.call(null, cljs.core.first.call(null, colls), cljs.core.rest.call(null, colls))
        }else {
          return null
        }
      }
    }, null)
  };
  return cat__8047.call(null, null, colls)
};
cljs.core.mapcat = function() {
  var mapcat = null;
  var mapcat__2 = function(f, coll) {
    return cljs.core.flatten1.call(null, cljs.core.map.call(null, f, coll))
  };
  var mapcat__3 = function() {
    var G__8048__delegate = function(f, coll, colls) {
      return cljs.core.flatten1.call(null, cljs.core.apply.call(null, cljs.core.map, f, coll, colls))
    };
    var G__8048 = function(f, coll, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
      }
      return G__8048__delegate.call(this, f, coll, colls)
    };
    G__8048.cljs$lang$maxFixedArity = 2;
    G__8048.cljs$lang$applyTo = function(arglist__8049) {
      var f = cljs.core.first(arglist__8049);
      var coll = cljs.core.first(cljs.core.next(arglist__8049));
      var colls = cljs.core.rest(cljs.core.next(arglist__8049));
      return G__8048__delegate(f, coll, colls)
    };
    G__8048.cljs$lang$arity$variadic = G__8048__delegate;
    return G__8048
  }();
  mapcat = function(f, coll, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapcat__2.call(this, f, coll);
      default:
        return mapcat__3.cljs$lang$arity$variadic(f, coll, cljs.core.array_seq(arguments, 2))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapcat.cljs$lang$maxFixedArity = 2;
  mapcat.cljs$lang$applyTo = mapcat__3.cljs$lang$applyTo;
  mapcat.cljs$lang$arity$2 = mapcat__2;
  mapcat.cljs$lang$arity$variadic = mapcat__3.cljs$lang$arity$variadic;
  return mapcat
}();
cljs.core.filter = function filter(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____8059 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____8059) {
      var s__8060 = temp__4092__auto____8059;
      if(cljs.core.chunked_seq_QMARK_.call(null, s__8060)) {
        var c__8061 = cljs.core.chunk_first.call(null, s__8060);
        var size__8062 = cljs.core.count.call(null, c__8061);
        var b__8063 = cljs.core.chunk_buffer.call(null, size__8062);
        var n__2476__auto____8064 = size__8062;
        var i__8065 = 0;
        while(true) {
          if(i__8065 < n__2476__auto____8064) {
            if(cljs.core.truth_(pred.call(null, cljs.core._nth.call(null, c__8061, i__8065)))) {
              cljs.core.chunk_append.call(null, b__8063, cljs.core._nth.call(null, c__8061, i__8065))
            }else {
            }
            var G__8068 = i__8065 + 1;
            i__8065 = G__8068;
            continue
          }else {
          }
          break
        }
        return cljs.core.chunk_cons.call(null, cljs.core.chunk.call(null, b__8063), filter.call(null, pred, cljs.core.chunk_rest.call(null, s__8060)))
      }else {
        var f__8066 = cljs.core.first.call(null, s__8060);
        var r__8067 = cljs.core.rest.call(null, s__8060);
        if(cljs.core.truth_(pred.call(null, f__8066))) {
          return cljs.core.cons.call(null, f__8066, filter.call(null, pred, r__8067))
        }else {
          return filter.call(null, pred, r__8067)
        }
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.remove = function remove(pred, coll) {
  return cljs.core.filter.call(null, cljs.core.complement.call(null, pred), coll)
};
cljs.core.tree_seq = function tree_seq(branch_QMARK_, children, root) {
  var walk__8071 = function walk(node) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, node, cljs.core.truth_(branch_QMARK_.call(null, node)) ? cljs.core.mapcat.call(null, walk, children.call(null, node)) : null)
    }, null)
  };
  return walk__8071.call(null, root)
};
cljs.core.flatten = function flatten(x) {
  return cljs.core.filter.call(null, function(p1__8069_SHARP_) {
    return!cljs.core.sequential_QMARK_.call(null, p1__8069_SHARP_)
  }, cljs.core.rest.call(null, cljs.core.tree_seq.call(null, cljs.core.sequential_QMARK_, cljs.core.seq, x)))
};
cljs.core.into = function into(to, from) {
  if(function() {
    var G__8075__8076 = to;
    if(G__8075__8076) {
      if(function() {
        var or__3943__auto____8077 = G__8075__8076.cljs$lang$protocol_mask$partition1$ & 1;
        if(or__3943__auto____8077) {
          return or__3943__auto____8077
        }else {
          return G__8075__8076.cljs$core$IEditableCollection$
        }
      }()) {
        return true
      }else {
        if(!G__8075__8076.cljs$lang$protocol_mask$partition1$) {
          return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8075__8076)
        }else {
          return false
        }
      }
    }else {
      return cljs.core.type_satisfies_.call(null, cljs.core.IEditableCollection, G__8075__8076)
    }
  }()) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core.transient$.call(null, to), from))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, to, from)
  }
};
cljs.core.mapv = function() {
  var mapv = null;
  var mapv__2 = function(f, coll) {
    return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
      return cljs.core.conj_BANG_.call(null, v, f.call(null, o))
    }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
  };
  var mapv__3 = function(f, c1, c2) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2))
  };
  var mapv__4 = function(f, c1, c2, c3) {
    return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.map.call(null, f, c1, c2, c3))
  };
  var mapv__5 = function() {
    var G__8078__delegate = function(f, c1, c2, c3, colls) {
      return cljs.core.into.call(null, cljs.core.PersistentVector.EMPTY, cljs.core.apply.call(null, cljs.core.map, f, c1, c2, c3, colls))
    };
    var G__8078 = function(f, c1, c2, c3, var_args) {
      var colls = null;
      if(goog.isDef(var_args)) {
        colls = cljs.core.array_seq(Array.prototype.slice.call(arguments, 4), 0)
      }
      return G__8078__delegate.call(this, f, c1, c2, c3, colls)
    };
    G__8078.cljs$lang$maxFixedArity = 4;
    G__8078.cljs$lang$applyTo = function(arglist__8079) {
      var f = cljs.core.first(arglist__8079);
      var c1 = cljs.core.first(cljs.core.next(arglist__8079));
      var c2 = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8079)));
      var c3 = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8079))));
      var colls = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(arglist__8079))));
      return G__8078__delegate(f, c1, c2, c3, colls)
    };
    G__8078.cljs$lang$arity$variadic = G__8078__delegate;
    return G__8078
  }();
  mapv = function(f, c1, c2, c3, var_args) {
    var colls = var_args;
    switch(arguments.length) {
      case 2:
        return mapv__2.call(this, f, c1);
      case 3:
        return mapv__3.call(this, f, c1, c2);
      case 4:
        return mapv__4.call(this, f, c1, c2, c3);
      default:
        return mapv__5.cljs$lang$arity$variadic(f, c1, c2, c3, cljs.core.array_seq(arguments, 4))
    }
    throw"Invalid arity: " + arguments.length;
  };
  mapv.cljs$lang$maxFixedArity = 4;
  mapv.cljs$lang$applyTo = mapv__5.cljs$lang$applyTo;
  mapv.cljs$lang$arity$2 = mapv__2;
  mapv.cljs$lang$arity$3 = mapv__3;
  mapv.cljs$lang$arity$4 = mapv__4;
  mapv.cljs$lang$arity$variadic = mapv__5.cljs$lang$arity$variadic;
  return mapv
}();
cljs.core.filterv = function filterv(pred, coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(v, o) {
    if(cljs.core.truth_(pred.call(null, o))) {
      return cljs.core.conj_BANG_.call(null, v, o)
    }else {
      return v
    }
  }, cljs.core.transient$.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.partition = function() {
  var partition = null;
  var partition__2 = function(n, coll) {
    return partition.call(null, n, n, coll)
  };
  var partition__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8086 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8086) {
        var s__8087 = temp__4092__auto____8086;
        var p__8088 = cljs.core.take.call(null, n, s__8087);
        if(n === cljs.core.count.call(null, p__8088)) {
          return cljs.core.cons.call(null, p__8088, partition.call(null, n, step, cljs.core.drop.call(null, step, s__8087)))
        }else {
          return null
        }
      }else {
        return null
      }
    }, null)
  };
  var partition__4 = function(n, step, pad, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____8089 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____8089) {
        var s__8090 = temp__4092__auto____8089;
        var p__8091 = cljs.core.take.call(null, n, s__8090);
        if(n === cljs.core.count.call(null, p__8091)) {
          return cljs.core.cons.call(null, p__8091, partition.call(null, n, step, pad, cljs.core.drop.call(null, step, s__8090)))
        }else {
          return cljs.core.list.call(null, cljs.core.take.call(null, n, cljs.core.concat.call(null, p__8091, pad)))
        }
      }else {
        return null
      }
    }, null)
  };
  partition = function(n, step, pad, coll) {
    switch(arguments.length) {
      case 2:
        return partition__2.call(this, n, step);
      case 3:
        return partition__3.call(this, n, step, pad);
      case 4:
        return partition__4.call(this, n, step, pad, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition.cljs$lang$arity$2 = partition__2;
  partition.cljs$lang$arity$3 = partition__3;
  partition.cljs$lang$arity$4 = partition__4;
  return partition
}();
cljs.core.get_in = function() {
  var get_in = null;
  var get_in__2 = function(m, ks) {
    return cljs.core.reduce.call(null, cljs.core.get, m, ks)
  };
  var get_in__3 = function(m, ks, not_found) {
    var sentinel__8096 = cljs.core.lookup_sentinel;
    var m__8097 = m;
    var ks__8098 = cljs.core.seq.call(null, ks);
    while(true) {
      if(ks__8098) {
        var m__8099 = cljs.core._lookup.call(null, m__8097, cljs.core.first.call(null, ks__8098), sentinel__8096);
        if(sentinel__8096 === m__8099) {
          return not_found
        }else {
          var G__8100 = sentinel__8096;
          var G__8101 = m__8099;
          var G__8102 = cljs.core.next.call(null, ks__8098);
          sentinel__8096 = G__8100;
          m__8097 = G__8101;
          ks__8098 = G__8102;
          continue
        }
      }else {
        return m__8097
      }
      break
    }
  };
  get_in = function(m, ks, not_found) {
    switch(arguments.length) {
      case 2:
        return get_in__2.call(this, m, ks);
      case 3:
        return get_in__3.call(this, m, ks, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  get_in.cljs$lang$arity$2 = get_in__2;
  get_in.cljs$lang$arity$3 = get_in__3;
  return get_in
}();
cljs.core.assoc_in = function assoc_in(m, p__8103, v) {
  var vec__8108__8109 = p__8103;
  var k__8110 = cljs.core.nth.call(null, vec__8108__8109, 0, null);
  var ks__8111 = cljs.core.nthnext.call(null, vec__8108__8109, 1);
  if(cljs.core.truth_(ks__8111)) {
    return cljs.core.assoc.call(null, m, k__8110, assoc_in.call(null, cljs.core._lookup.call(null, m, k__8110, null), ks__8111, v))
  }else {
    return cljs.core.assoc.call(null, m, k__8110, v)
  }
};
cljs.core.update_in = function() {
  var update_in__delegate = function(m, p__8112, f, args) {
    var vec__8117__8118 = p__8112;
    var k__8119 = cljs.core.nth.call(null, vec__8117__8118, 0, null);
    var ks__8120 = cljs.core.nthnext.call(null, vec__8117__8118, 1);
    if(cljs.core.truth_(ks__8120)) {
      return cljs.core.assoc.call(null, m, k__8119, cljs.core.apply.call(null, update_in, cljs.core._lookup.call(null, m, k__8119, null), ks__8120, f, args))
    }else {
      return cljs.core.assoc.call(null, m, k__8119, cljs.core.apply.call(null, f, cljs.core._lookup.call(null, m, k__8119, null), args))
    }
  };
  var update_in = function(m, p__8112, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
    }
    return update_in__delegate.call(this, m, p__8112, f, args)
  };
  update_in.cljs$lang$maxFixedArity = 3;
  update_in.cljs$lang$applyTo = function(arglist__8121) {
    var m = cljs.core.first(arglist__8121);
    var p__8112 = cljs.core.first(cljs.core.next(arglist__8121));
    var f = cljs.core.first(cljs.core.next(cljs.core.next(arglist__8121)));
    var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__8121)));
    return update_in__delegate(m, p__8112, f, args)
  };
  update_in.cljs$lang$arity$variadic = update_in__delegate;
  return update_in
}();
cljs.core.Vector = function(meta, array, __hash) {
  this.meta = meta;
  this.array = array;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Vector.cljs$lang$type = true;
cljs.core.Vector.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Vector")
};
cljs.core.Vector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8124 = this;
  var h__2141__auto____8125 = this__8124.__hash;
  if(!(h__2141__auto____8125 == null)) {
    return h__2141__auto____8125
  }else {
    var h__2141__auto____8126 = cljs.core.hash_coll.call(null, coll);
    this__8124.__hash = h__2141__auto____8126;
    return h__2141__auto____8126
  }
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8127 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Vector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8128 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Vector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8129 = this;
  var new_array__8130 = this__8129.array.slice();
  new_array__8130[k] = v;
  return new cljs.core.Vector(this__8129.meta, new_array__8130, null)
};
cljs.core.Vector.prototype.call = function() {
  var G__8161 = null;
  var G__8161__2 = function(this_sym8131, k) {
    var this__8133 = this;
    var this_sym8131__8134 = this;
    var coll__8135 = this_sym8131__8134;
    return coll__8135.cljs$core$ILookup$_lookup$arity$2(coll__8135, k)
  };
  var G__8161__3 = function(this_sym8132, k, not_found) {
    var this__8133 = this;
    var this_sym8132__8136 = this;
    var coll__8137 = this_sym8132__8136;
    return coll__8137.cljs$core$ILookup$_lookup$arity$3(coll__8137, k, not_found)
  };
  G__8161 = function(this_sym8132, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8161__2.call(this, this_sym8132, k);
      case 3:
        return G__8161__3.call(this, this_sym8132, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8161
}();
cljs.core.Vector.prototype.apply = function(this_sym8122, args8123) {
  var this__8138 = this;
  return this_sym8122.call.apply(this_sym8122, [this_sym8122].concat(args8123.slice()))
};
cljs.core.Vector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8139 = this;
  var new_array__8140 = this__8139.array.slice();
  new_array__8140.push(o);
  return new cljs.core.Vector(this__8139.meta, new_array__8140, null)
};
cljs.core.Vector.prototype.toString = function() {
  var this__8141 = this;
  var this__8142 = this;
  return cljs.core.pr_str.call(null, this__8142)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8143 = this;
  return cljs.core.ci_reduce.call(null, this__8143.array, f)
};
cljs.core.Vector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8144 = this;
  return cljs.core.ci_reduce.call(null, this__8144.array, f, start)
};
cljs.core.Vector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8145 = this;
  if(this__8145.array.length > 0) {
    var vector_seq__8146 = function vector_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < this__8145.array.length) {
          return cljs.core.cons.call(null, this__8145.array[i], vector_seq.call(null, i + 1))
        }else {
          return null
        }
      }, null)
    };
    return vector_seq__8146.call(null, 0)
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8147 = this;
  return this__8147.array.length
};
cljs.core.Vector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8148 = this;
  var count__8149 = this__8148.array.length;
  if(count__8149 > 0) {
    return this__8148.array[count__8149 - 1]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8150 = this;
  if(this__8150.array.length > 0) {
    var new_array__8151 = this__8150.array.slice();
    new_array__8151.pop();
    return new cljs.core.Vector(this__8150.meta, new_array__8151, null)
  }else {
    throw new Error("Can't pop empty vector");
  }
};
cljs.core.Vector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8152 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Vector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8153 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Vector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8154 = this;
  return new cljs.core.Vector(meta, this__8154.array, this__8154.__hash)
};
cljs.core.Vector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8155 = this;
  return this__8155.meta
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8156 = this;
  if(function() {
    var and__3941__auto____8157 = 0 <= n;
    if(and__3941__auto____8157) {
      return n < this__8156.array.length
    }else {
      return and__3941__auto____8157
    }
  }()) {
    return this__8156.array[n]
  }else {
    return null
  }
};
cljs.core.Vector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8158 = this;
  if(function() {
    var and__3941__auto____8159 = 0 <= n;
    if(and__3941__auto____8159) {
      return n < this__8158.array.length
    }else {
      return and__3941__auto____8159
    }
  }()) {
    return this__8158.array[n]
  }else {
    return not_found
  }
};
cljs.core.Vector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8160 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8160.meta)
};
cljs.core.Vector;
cljs.core.Vector.EMPTY = new cljs.core.Vector(null, [], 0);
cljs.core.Vector.fromArray = function(xs) {
  return new cljs.core.Vector(null, xs, null)
};
cljs.core.VectorNode = function(edit, arr) {
  this.edit = edit;
  this.arr = arr
};
cljs.core.VectorNode.cljs$lang$type = true;
cljs.core.VectorNode.cljs$lang$ctorPrSeq = function(this__2259__auto__) {
  return cljs.core.list.call(null, "cljs.core/VectorNode")
};
cljs.core.VectorNode;
cljs.core.pv_fresh_node = function pv_fresh_node(edit) {
  return new cljs.core.VectorNode(edit, cljs.core.make_array.call(null, 32))
};
cljs.core.pv_aget = function pv_aget(node, idx) {
  return node.arr[idx]
};
cljs.core.pv_aset = function pv_aset(node, idx, val) {
  return node.arr[idx] = val
};
cljs.core.pv_clone_node = function pv_clone_node(node) {
  return new cljs.core.VectorNode(node.edit, node.arr.slice())
};
cljs.core.tail_off = function tail_off(pv) {
  var cnt__8163 = pv.cnt;
  if(cnt__8163 < 32) {
    return 0
  }else {
    return cnt__8163 - 1 >>> 5 << 5
  }
};
cljs.core.new_path = function new_path(edit, level, node) {
  var ll__8169 = level;
  var ret__8170 = node;
  while(true) {
    if(ll__8169 === 0) {
      return ret__8170
    }else {
      var embed__8171 = ret__8170;
      var r__8172 = cljs.core.pv_fresh_node.call(null, edit);
      var ___8173 = cljs.core.pv_aset.call(null, r__8172, 0, embed__8171);
      var G__8174 = ll__8169 - 5;
      var G__8175 = r__8172;
      ll__8169 = G__8174;
      ret__8170 = G__8175;
      continue
    }
    break
  }
};
cljs.core.push_tail = function push_tail(pv, level, parent, tailnode) {
  var ret__8181 = cljs.core.pv_clone_node.call(null, parent);
  var subidx__8182 = pv.cnt - 1 >>> level & 31;
  if(5 === level) {
    cljs.core.pv_aset.call(null, ret__8181, subidx__8182, tailnode);
    return ret__8181
  }else {
    var child__8183 = cljs.core.pv_aget.call(null, parent, subidx__8182);
    if(!(child__8183 == null)) {
      var node_to_insert__8184 = push_tail.call(null, pv, level - 5, child__8183, tailnode);
      cljs.core.pv_aset.call(null, ret__8181, subidx__8182, node_to_insert__8184);
      return ret__8181
    }else {
      var node_to_insert__8185 = cljs.core.new_path.call(null, null, level - 5, tailnode);
      cljs.core.pv_aset.call(null, ret__8181, subidx__8182, node_to_insert__8185);
      return ret__8181
    }
  }
};
cljs.core.array_for = function array_for(pv, i) {
  if(function() {
    var and__3941__auto____8189 = 0 <= i;
    if(and__3941__auto____8189) {
      return i < pv.cnt
    }else {
      return and__3941__auto____8189
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, pv)) {
      return pv.tail
    }else {
      var node__8190 = pv.root;
      var level__8191 = pv.shift;
      while(true) {
        if(level__8191 > 0) {
          var G__8192 = cljs.core.pv_aget.call(null, node__8190, i >>> level__8191 & 31);
          var G__8193 = level__8191 - 5;
          node__8190 = G__8192;
          level__8191 = G__8193;
          continue
        }else {
          return node__8190.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in vector of length "), cljs.core.str(pv.cnt)].join(""));
  }
};
cljs.core.do_assoc = function do_assoc(pv, level, node, i, val) {
  var ret__8196 = cljs.core.pv_clone_node.call(null, node);
  if(level === 0) {
    cljs.core.pv_aset.call(null, ret__8196, i & 31, val);
    return ret__8196
  }else {
    var subidx__8197 = i >>> level & 31;
    cljs.core.pv_aset.call(null, ret__8196, subidx__8197, do_assoc.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8197), i, val));
    return ret__8196
  }
};
cljs.core.pop_tail = function pop_tail(pv, level, node) {
  var subidx__8203 = pv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8204 = pop_tail.call(null, pv, level - 5, cljs.core.pv_aget.call(null, node, subidx__8203));
    if(function() {
      var and__3941__auto____8205 = new_child__8204 == null;
      if(and__3941__auto____8205) {
        return subidx__8203 === 0
      }else {
        return and__3941__auto____8205
      }
    }()) {
      return null
    }else {
      var ret__8206 = cljs.core.pv_clone_node.call(null, node);
      cljs.core.pv_aset.call(null, ret__8206, subidx__8203, new_child__8204);
      return ret__8206
    }
  }else {
    if(subidx__8203 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        var ret__8207 = cljs.core.pv_clone_node.call(null, node);
        cljs.core.pv_aset.call(null, ret__8207, subidx__8203, null);
        return ret__8207
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector = function(meta, cnt, shift, root, tail, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 167668511
};
cljs.core.PersistentVector.cljs$lang$type = true;
cljs.core.PersistentVector.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentVector")
};
cljs.core.PersistentVector.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8210 = this;
  return new cljs.core.TransientVector(this__8210.cnt, this__8210.shift, cljs.core.tv_editable_root.call(null, this__8210.root), cljs.core.tv_editable_tail.call(null, this__8210.tail))
};
cljs.core.PersistentVector.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8211 = this;
  var h__2141__auto____8212 = this__8211.__hash;
  if(!(h__2141__auto____8212 == null)) {
    return h__2141__auto____8212
  }else {
    var h__2141__auto____8213 = cljs.core.hash_coll.call(null, coll);
    this__8211.__hash = h__2141__auto____8213;
    return h__2141__auto____8213
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8214 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.PersistentVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8215 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.PersistentVector.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8216 = this;
  if(function() {
    var and__3941__auto____8217 = 0 <= k;
    if(and__3941__auto____8217) {
      return k < this__8216.cnt
    }else {
      return and__3941__auto____8217
    }
  }()) {
    if(cljs.core.tail_off.call(null, coll) <= k) {
      var new_tail__8218 = this__8216.tail.slice();
      new_tail__8218[k & 31] = v;
      return new cljs.core.PersistentVector(this__8216.meta, this__8216.cnt, this__8216.shift, this__8216.root, new_tail__8218, null)
    }else {
      return new cljs.core.PersistentVector(this__8216.meta, this__8216.cnt, this__8216.shift, cljs.core.do_assoc.call(null, coll, this__8216.shift, this__8216.root, k, v), this__8216.tail, null)
    }
  }else {
    if(k === this__8216.cnt) {
      return coll.cljs$core$ICollection$_conj$arity$2(coll, v)
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Index "), cljs.core.str(k), cljs.core.str(" out of bounds  [0,"), cljs.core.str(this__8216.cnt), cljs.core.str("]")].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentVector.prototype.call = function() {
  var G__8266 = null;
  var G__8266__2 = function(this_sym8219, k) {
    var this__8221 = this;
    var this_sym8219__8222 = this;
    var coll__8223 = this_sym8219__8222;
    return coll__8223.cljs$core$ILookup$_lookup$arity$2(coll__8223, k)
  };
  var G__8266__3 = function(this_sym8220, k, not_found) {
    var this__8221 = this;
    var this_sym8220__8224 = this;
    var coll__8225 = this_sym8220__8224;
    return coll__8225.cljs$core$ILookup$_lookup$arity$3(coll__8225, k, not_found)
  };
  G__8266 = function(this_sym8220, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8266__2.call(this, this_sym8220, k);
      case 3:
        return G__8266__3.call(this, this_sym8220, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8266
}();
cljs.core.PersistentVector.prototype.apply = function(this_sym8208, args8209) {
  var this__8226 = this;
  return this_sym8208.call.apply(this_sym8208, [this_sym8208].concat(args8209.slice()))
};
cljs.core.PersistentVector.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(v, f, init) {
  var this__8227 = this;
  var step_init__8228 = [0, init];
  var i__8229 = 0;
  while(true) {
    if(i__8229 < this__8227.cnt) {
      var arr__8230 = cljs.core.array_for.call(null, v, i__8229);
      var len__8231 = arr__8230.length;
      var init__8235 = function() {
        var j__8232 = 0;
        var init__8233 = step_init__8228[1];
        while(true) {
          if(j__8232 < len__8231) {
            var init__8234 = f.call(null, init__8233, j__8232 + i__8229, arr__8230[j__8232]);
            if(cljs.core.reduced_QMARK_.call(null, init__8234)) {
              return init__8234
            }else {
              var G__8267 = j__8232 + 1;
              var G__8268 = init__8234;
              j__8232 = G__8267;
              init__8233 = G__8268;
              continue
            }
          }else {
            step_init__8228[0] = len__8231;
            step_init__8228[1] = init__8233;
            return init__8233
          }
          break
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8235)) {
        return cljs.core.deref.call(null, init__8235)
      }else {
        var G__8269 = i__8229 + step_init__8228[0];
        i__8229 = G__8269;
        continue
      }
    }else {
      return step_init__8228[1]
    }
    break
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8236 = this;
  if(this__8236.cnt - cljs.core.tail_off.call(null, coll) < 32) {
    var new_tail__8237 = this__8236.tail.slice();
    new_tail__8237.push(o);
    return new cljs.core.PersistentVector(this__8236.meta, this__8236.cnt + 1, this__8236.shift, this__8236.root, new_tail__8237, null)
  }else {
    var root_overflow_QMARK___8238 = this__8236.cnt >>> 5 > 1 << this__8236.shift;
    var new_shift__8239 = root_overflow_QMARK___8238 ? this__8236.shift + 5 : this__8236.shift;
    var new_root__8241 = root_overflow_QMARK___8238 ? function() {
      var n_r__8240 = cljs.core.pv_fresh_node.call(null, null);
      cljs.core.pv_aset.call(null, n_r__8240, 0, this__8236.root);
      cljs.core.pv_aset.call(null, n_r__8240, 1, cljs.core.new_path.call(null, null, this__8236.shift, new cljs.core.VectorNode(null, this__8236.tail)));
      return n_r__8240
    }() : cljs.core.push_tail.call(null, coll, this__8236.shift, this__8236.root, new cljs.core.VectorNode(null, this__8236.tail));
    return new cljs.core.PersistentVector(this__8236.meta, this__8236.cnt + 1, new_shift__8239, new_root__8241, [o], null)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__8242 = this;
  if(this__8242.cnt > 0) {
    return new cljs.core.RSeq(coll, this__8242.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_key$arity$1 = function(coll) {
  var this__8243 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 0)
};
cljs.core.PersistentVector.prototype.cljs$core$IMapEntry$_val$arity$1 = function(coll) {
  var this__8244 = this;
  return coll.cljs$core$IIndexed$_nth$arity$2(coll, 1)
};
cljs.core.PersistentVector.prototype.toString = function() {
  var this__8245 = this;
  var this__8246 = this;
  return cljs.core.pr_str.call(null, this__8246)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$2 = function(v, f) {
  var this__8247 = this;
  return cljs.core.ci_reduce.call(null, v, f)
};
cljs.core.PersistentVector.prototype.cljs$core$IReduce$_reduce$arity$3 = function(v, f, start) {
  var this__8248 = this;
  return cljs.core.ci_reduce.call(null, v, f, start)
};
cljs.core.PersistentVector.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8249 = this;
  if(this__8249.cnt === 0) {
    return null
  }else {
    return cljs.core.chunked_seq.call(null, coll, 0, 0)
  }
};
cljs.core.PersistentVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8250 = this;
  return this__8250.cnt
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8251 = this;
  if(this__8251.cnt > 0) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, this__8251.cnt - 1)
  }else {
    return null
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8252 = this;
  if(this__8252.cnt === 0) {
    throw new Error("Can't pop empty vector");
  }else {
    if(1 === this__8252.cnt) {
      return cljs.core._with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8252.meta)
    }else {
      if(1 < this__8252.cnt - cljs.core.tail_off.call(null, coll)) {
        return new cljs.core.PersistentVector(this__8252.meta, this__8252.cnt - 1, this__8252.shift, this__8252.root, this__8252.tail.slice(0, -1), null)
      }else {
        if("\ufdd0'else") {
          var new_tail__8253 = cljs.core.array_for.call(null, coll, this__8252.cnt - 2);
          var nr__8254 = cljs.core.pop_tail.call(null, coll, this__8252.shift, this__8252.root);
          var new_root__8255 = nr__8254 == null ? cljs.core.PersistentVector.EMPTY_NODE : nr__8254;
          var cnt_1__8256 = this__8252.cnt - 1;
          if(function() {
            var and__3941__auto____8257 = 5 < this__8252.shift;
            if(and__3941__auto____8257) {
              return cljs.core.pv_aget.call(null, new_root__8255, 1) == null
            }else {
              return and__3941__auto____8257
            }
          }()) {
            return new cljs.core.PersistentVector(this__8252.meta, cnt_1__8256, this__8252.shift - 5, cljs.core.pv_aget.call(null, new_root__8255, 0), new_tail__8253, null)
          }else {
            return new cljs.core.PersistentVector(this__8252.meta, cnt_1__8256, this__8252.shift, new_root__8255, new_tail__8253, null)
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8258 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.PersistentVector.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8259 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentVector.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8260 = this;
  return new cljs.core.PersistentVector(meta, this__8260.cnt, this__8260.shift, this__8260.root, this__8260.tail, this__8260.__hash)
};
cljs.core.PersistentVector.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8261 = this;
  return this__8261.meta
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8262 = this;
  return cljs.core.array_for.call(null, coll, n)[n & 31]
};
cljs.core.PersistentVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8263 = this;
  if(function() {
    var and__3941__auto____8264 = 0 <= n;
    if(and__3941__auto____8264) {
      return n < this__8263.cnt
    }else {
      return and__3941__auto____8264
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.PersistentVector.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8265 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8265.meta)
};
cljs.core.PersistentVector;
cljs.core.PersistentVector.EMPTY_NODE = cljs.core.pv_fresh_node.call(null, null);
cljs.core.PersistentVector.EMPTY = new cljs.core.PersistentVector(null, 0, 5, cljs.core.PersistentVector.EMPTY_NODE, [], 0);
cljs.core.PersistentVector.fromArray = function(xs, no_clone) {
  var l__8270 = xs.length;
  var xs__8271 = no_clone === true ? xs : xs.slice();
  if(l__8270 < 32) {
    return new cljs.core.PersistentVector(null, l__8270, 5, cljs.core.PersistentVector.EMPTY_NODE, xs__8271, null)
  }else {
    var node__8272 = xs__8271.slice(0, 32);
    var v__8273 = new cljs.core.PersistentVector(null, 32, 5, cljs.core.PersistentVector.EMPTY_NODE, node__8272, null);
    var i__8274 = 32;
    var out__8275 = cljs.core._as_transient.call(null, v__8273);
    while(true) {
      if(i__8274 < l__8270) {
        var G__8276 = i__8274 + 1;
        var G__8277 = cljs.core.conj_BANG_.call(null, out__8275, xs__8271[i__8274]);
        i__8274 = G__8276;
        out__8275 = G__8277;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__8275)
      }
      break
    }
  }
};
cljs.core.vec = function vec(coll) {
  return cljs.core._persistent_BANG_.call(null, cljs.core.reduce.call(null, cljs.core._conj_BANG_, cljs.core._as_transient.call(null, cljs.core.PersistentVector.EMPTY), coll))
};
cljs.core.vector = function() {
  var vector__delegate = function(args) {
    return cljs.core.vec.call(null, args)
  };
  var vector = function(var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return vector__delegate.call(this, args)
  };
  vector.cljs$lang$maxFixedArity = 0;
  vector.cljs$lang$applyTo = function(arglist__8278) {
    var args = cljs.core.seq(arglist__8278);
    return vector__delegate(args)
  };
  vector.cljs$lang$arity$variadic = vector__delegate;
  return vector
}();
cljs.core.ChunkedSeq = function(vec, node, i, off, meta) {
  this.vec = vec;
  this.node = node;
  this.i = i;
  this.off = off;
  this.meta = meta;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 27525356
};
cljs.core.ChunkedSeq.cljs$lang$type = true;
cljs.core.ChunkedSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ChunkedSeq")
};
cljs.core.ChunkedSeq.prototype.cljs$core$INext$_next$arity$1 = function(coll) {
  var this__8279 = this;
  if(this__8279.off + 1 < this__8279.node.length) {
    var s__8280 = cljs.core.chunked_seq.call(null, this__8279.vec, this__8279.node, this__8279.i, this__8279.off + 1);
    if(s__8280 == null) {
      return null
    }else {
      return s__8280
    }
  }else {
    return coll.cljs$core$IChunkedNext$_chunked_next$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8281 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8282 = this;
  return coll
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8283 = this;
  return this__8283.node[this__8283.off]
};
cljs.core.ChunkedSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8284 = this;
  if(this__8284.off + 1 < this__8284.node.length) {
    var s__8285 = cljs.core.chunked_seq.call(null, this__8284.vec, this__8284.node, this__8284.i, this__8284.off + 1);
    if(s__8285 == null) {
      return cljs.core.List.EMPTY
    }else {
      return s__8285
    }
  }else {
    return coll.cljs$core$IChunkedSeq$_chunked_rest$arity$1(coll)
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedNext$_chunked_next$arity$1 = function(coll) {
  var this__8286 = this;
  var l__8287 = this__8286.node.length;
  var s__8288 = this__8286.i + l__8287 < cljs.core._count.call(null, this__8286.vec) ? cljs.core.chunked_seq.call(null, this__8286.vec, this__8286.i + l__8287, 0) : null;
  if(s__8288 == null) {
    return null
  }else {
    return s__8288
  }
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8289 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, m) {
  var this__8290 = this;
  return cljs.core.chunked_seq.call(null, this__8290.vec, this__8290.node, this__8290.i, this__8290.off, m)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IWithMeta$_meta$arity$1 = function(coll) {
  var this__8291 = this;
  return this__8291.meta
};
cljs.core.ChunkedSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8292 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.EMPTY, this__8292.meta)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_first$arity$1 = function(coll) {
  var this__8293 = this;
  return cljs.core.array_chunk.call(null, this__8293.node, this__8293.off)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IChunkedSeq$_chunked_rest$arity$1 = function(coll) {
  var this__8294 = this;
  var l__8295 = this__8294.node.length;
  var s__8296 = this__8294.i + l__8295 < cljs.core._count.call(null, this__8294.vec) ? cljs.core.chunked_seq.call(null, this__8294.vec, this__8294.i + l__8295, 0) : null;
  if(s__8296 == null) {
    return cljs.core.List.EMPTY
  }else {
    return s__8296
  }
};
cljs.core.ChunkedSeq;
cljs.core.chunked_seq = function() {
  var chunked_seq = null;
  var chunked_seq__3 = function(vec, i, off) {
    return chunked_seq.call(null, vec, cljs.core.array_for.call(null, vec, i), i, off, null)
  };
  var chunked_seq__4 = function(vec, node, i, off) {
    return chunked_seq.call(null, vec, node, i, off, null)
  };
  var chunked_seq__5 = function(vec, node, i, off, meta) {
    return new cljs.core.ChunkedSeq(vec, node, i, off, meta)
  };
  chunked_seq = function(vec, node, i, off, meta) {
    switch(arguments.length) {
      case 3:
        return chunked_seq__3.call(this, vec, node, i);
      case 4:
        return chunked_seq__4.call(this, vec, node, i, off);
      case 5:
        return chunked_seq__5.call(this, vec, node, i, off, meta)
    }
    throw"Invalid arity: " + arguments.length;
  };
  chunked_seq.cljs$lang$arity$3 = chunked_seq__3;
  chunked_seq.cljs$lang$arity$4 = chunked_seq__4;
  chunked_seq.cljs$lang$arity$5 = chunked_seq__5;
  return chunked_seq
}();
cljs.core.Subvec = function(meta, v, start, end, __hash) {
  this.meta = meta;
  this.v = v;
  this.start = start;
  this.end = end;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32400159
};
cljs.core.Subvec.cljs$lang$type = true;
cljs.core.Subvec.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Subvec")
};
cljs.core.Subvec.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8299 = this;
  var h__2141__auto____8300 = this__8299.__hash;
  if(!(h__2141__auto____8300 == null)) {
    return h__2141__auto____8300
  }else {
    var h__2141__auto____8301 = cljs.core.hash_coll.call(null, coll);
    this__8299.__hash = h__2141__auto____8301;
    return h__2141__auto____8301
  }
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8302 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.Subvec.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8303 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, key, val) {
  var this__8304 = this;
  var v_pos__8305 = this__8304.start + key;
  return new cljs.core.Subvec(this__8304.meta, cljs.core._assoc.call(null, this__8304.v, v_pos__8305, val), this__8304.start, this__8304.end > v_pos__8305 + 1 ? this__8304.end : v_pos__8305 + 1, null)
};
cljs.core.Subvec.prototype.call = function() {
  var G__8331 = null;
  var G__8331__2 = function(this_sym8306, k) {
    var this__8308 = this;
    var this_sym8306__8309 = this;
    var coll__8310 = this_sym8306__8309;
    return coll__8310.cljs$core$ILookup$_lookup$arity$2(coll__8310, k)
  };
  var G__8331__3 = function(this_sym8307, k, not_found) {
    var this__8308 = this;
    var this_sym8307__8311 = this;
    var coll__8312 = this_sym8307__8311;
    return coll__8312.cljs$core$ILookup$_lookup$arity$3(coll__8312, k, not_found)
  };
  G__8331 = function(this_sym8307, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8331__2.call(this, this_sym8307, k);
      case 3:
        return G__8331__3.call(this, this_sym8307, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8331
}();
cljs.core.Subvec.prototype.apply = function(this_sym8297, args8298) {
  var this__8313 = this;
  return this_sym8297.call.apply(this_sym8297, [this_sym8297].concat(args8298.slice()))
};
cljs.core.Subvec.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8314 = this;
  return new cljs.core.Subvec(this__8314.meta, cljs.core._assoc_n.call(null, this__8314.v, this__8314.end, o), this__8314.start, this__8314.end + 1, null)
};
cljs.core.Subvec.prototype.toString = function() {
  var this__8315 = this;
  var this__8316 = this;
  return cljs.core.pr_str.call(null, this__8316)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$2 = function(coll, f) {
  var this__8317 = this;
  return cljs.core.ci_reduce.call(null, coll, f)
};
cljs.core.Subvec.prototype.cljs$core$IReduce$_reduce$arity$3 = function(coll, f, start) {
  var this__8318 = this;
  return cljs.core.ci_reduce.call(null, coll, f, start)
};
cljs.core.Subvec.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8319 = this;
  var subvec_seq__8320 = function subvec_seq(i) {
    if(i === this__8319.end) {
      return null
    }else {
      return cljs.core.cons.call(null, cljs.core._nth.call(null, this__8319.v, i), new cljs.core.LazySeq(null, false, function() {
        return subvec_seq.call(null, i + 1)
      }, null))
    }
  };
  return subvec_seq__8320.call(null, this__8319.start)
};
cljs.core.Subvec.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8321 = this;
  return this__8321.end - this__8321.start
};
cljs.core.Subvec.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8322 = this;
  return cljs.core._nth.call(null, this__8322.v, this__8322.end - 1)
};
cljs.core.Subvec.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8323 = this;
  if(this__8323.start === this__8323.end) {
    throw new Error("Can't pop empty vector");
  }else {
    return new cljs.core.Subvec(this__8323.meta, this__8323.v, this__8323.start, this__8323.end - 1, null)
  }
};
cljs.core.Subvec.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(coll, n, val) {
  var this__8324 = this;
  return coll.cljs$core$IAssociative$_assoc$arity$3(coll, n, val)
};
cljs.core.Subvec.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8325 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.Subvec.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8326 = this;
  return new cljs.core.Subvec(meta, this__8326.v, this__8326.start, this__8326.end, this__8326.__hash)
};
cljs.core.Subvec.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8327 = this;
  return this__8327.meta
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8328 = this;
  return cljs.core._nth.call(null, this__8328.v, this__8328.start + n)
};
cljs.core.Subvec.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8329 = this;
  return cljs.core._nth.call(null, this__8329.v, this__8329.start + n, not_found)
};
cljs.core.Subvec.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8330 = this;
  return cljs.core.with_meta.call(null, cljs.core.Vector.EMPTY, this__8330.meta)
};
cljs.core.Subvec;
cljs.core.subvec = function() {
  var subvec = null;
  var subvec__2 = function(v, start) {
    return subvec.call(null, v, start, cljs.core.count.call(null, v))
  };
  var subvec__3 = function(v, start, end) {
    return new cljs.core.Subvec(null, v, start, end, null)
  };
  subvec = function(v, start, end) {
    switch(arguments.length) {
      case 2:
        return subvec__2.call(this, v, start);
      case 3:
        return subvec__3.call(this, v, start, end)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subvec.cljs$lang$arity$2 = subvec__2;
  subvec.cljs$lang$arity$3 = subvec__3;
  return subvec
}();
cljs.core.tv_ensure_editable = function tv_ensure_editable(edit, node) {
  if(edit === node.edit) {
    return node
  }else {
    return new cljs.core.VectorNode(edit, node.arr.slice())
  }
};
cljs.core.tv_editable_root = function tv_editable_root(node) {
  return new cljs.core.VectorNode({}, node.arr.slice())
};
cljs.core.tv_editable_tail = function tv_editable_tail(tl) {
  var ret__8333 = cljs.core.make_array.call(null, 32);
  cljs.core.array_copy.call(null, tl, 0, ret__8333, 0, tl.length);
  return ret__8333
};
cljs.core.tv_push_tail = function tv_push_tail(tv, level, parent, tail_node) {
  var ret__8337 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, parent);
  var subidx__8338 = tv.cnt - 1 >>> level & 31;
  cljs.core.pv_aset.call(null, ret__8337, subidx__8338, level === 5 ? tail_node : function() {
    var child__8339 = cljs.core.pv_aget.call(null, ret__8337, subidx__8338);
    if(!(child__8339 == null)) {
      return tv_push_tail.call(null, tv, level - 5, child__8339, tail_node)
    }else {
      return cljs.core.new_path.call(null, tv.root.edit, level - 5, tail_node)
    }
  }());
  return ret__8337
};
cljs.core.tv_pop_tail = function tv_pop_tail(tv, level, node) {
  var node__8344 = cljs.core.tv_ensure_editable.call(null, tv.root.edit, node);
  var subidx__8345 = tv.cnt - 2 >>> level & 31;
  if(level > 5) {
    var new_child__8346 = tv_pop_tail.call(null, tv, level - 5, cljs.core.pv_aget.call(null, node__8344, subidx__8345));
    if(function() {
      var and__3941__auto____8347 = new_child__8346 == null;
      if(and__3941__auto____8347) {
        return subidx__8345 === 0
      }else {
        return and__3941__auto____8347
      }
    }()) {
      return null
    }else {
      cljs.core.pv_aset.call(null, node__8344, subidx__8345, new_child__8346);
      return node__8344
    }
  }else {
    if(subidx__8345 === 0) {
      return null
    }else {
      if("\ufdd0'else") {
        cljs.core.pv_aset.call(null, node__8344, subidx__8345, null);
        return node__8344
      }else {
        return null
      }
    }
  }
};
cljs.core.editable_array_for = function editable_array_for(tv, i) {
  if(function() {
    var and__3941__auto____8352 = 0 <= i;
    if(and__3941__auto____8352) {
      return i < tv.cnt
    }else {
      return and__3941__auto____8352
    }
  }()) {
    if(i >= cljs.core.tail_off.call(null, tv)) {
      return tv.tail
    }else {
      var root__8353 = tv.root;
      var node__8354 = root__8353;
      var level__8355 = tv.shift;
      while(true) {
        if(level__8355 > 0) {
          var G__8356 = cljs.core.tv_ensure_editable.call(null, root__8353.edit, cljs.core.pv_aget.call(null, node__8354, i >>> level__8355 & 31));
          var G__8357 = level__8355 - 5;
          node__8354 = G__8356;
          level__8355 = G__8357;
          continue
        }else {
          return node__8354.arr
        }
        break
      }
    }
  }else {
    throw new Error([cljs.core.str("No item "), cljs.core.str(i), cljs.core.str(" in transient vector of length "), cljs.core.str(tv.cnt)].join(""));
  }
};
cljs.core.TransientVector = function(cnt, shift, root, tail) {
  this.cnt = cnt;
  this.shift = shift;
  this.root = root;
  this.tail = tail;
  this.cljs$lang$protocol_mask$partition0$ = 275;
  this.cljs$lang$protocol_mask$partition1$ = 22
};
cljs.core.TransientVector.cljs$lang$type = true;
cljs.core.TransientVector.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientVector")
};
cljs.core.TransientVector.prototype.call = function() {
  var G__8397 = null;
  var G__8397__2 = function(this_sym8360, k) {
    var this__8362 = this;
    var this_sym8360__8363 = this;
    var coll__8364 = this_sym8360__8363;
    return coll__8364.cljs$core$ILookup$_lookup$arity$2(coll__8364, k)
  };
  var G__8397__3 = function(this_sym8361, k, not_found) {
    var this__8362 = this;
    var this_sym8361__8365 = this;
    var coll__8366 = this_sym8361__8365;
    return coll__8366.cljs$core$ILookup$_lookup$arity$3(coll__8366, k, not_found)
  };
  G__8397 = function(this_sym8361, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8397__2.call(this, this_sym8361, k);
      case 3:
        return G__8397__3.call(this, this_sym8361, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8397
}();
cljs.core.TransientVector.prototype.apply = function(this_sym8358, args8359) {
  var this__8367 = this;
  return this_sym8358.call.apply(this_sym8358, [this_sym8358].concat(args8359.slice()))
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8368 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, null)
};
cljs.core.TransientVector.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8369 = this;
  return coll.cljs$core$IIndexed$_nth$arity$3(coll, k, not_found)
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$2 = function(coll, n) {
  var this__8370 = this;
  if(this__8370.root.edit) {
    return cljs.core.array_for.call(null, coll, n)[n & 31]
  }else {
    throw new Error("nth after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$IIndexed$_nth$arity$3 = function(coll, n, not_found) {
  var this__8371 = this;
  if(function() {
    var and__3941__auto____8372 = 0 <= n;
    if(and__3941__auto____8372) {
      return n < this__8371.cnt
    }else {
      return and__3941__auto____8372
    }
  }()) {
    return coll.cljs$core$IIndexed$_nth$arity$2(coll, n)
  }else {
    return not_found
  }
};
cljs.core.TransientVector.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8373 = this;
  if(this__8373.root.edit) {
    return this__8373.cnt
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3 = function(tcoll, n, val) {
  var this__8374 = this;
  if(this__8374.root.edit) {
    if(function() {
      var and__3941__auto____8375 = 0 <= n;
      if(and__3941__auto____8375) {
        return n < this__8374.cnt
      }else {
        return and__3941__auto____8375
      }
    }()) {
      if(cljs.core.tail_off.call(null, tcoll) <= n) {
        this__8374.tail[n & 31] = val;
        return tcoll
      }else {
        var new_root__8380 = function go(level, node) {
          var node__8378 = cljs.core.tv_ensure_editable.call(null, this__8374.root.edit, node);
          if(level === 0) {
            cljs.core.pv_aset.call(null, node__8378, n & 31, val);
            return node__8378
          }else {
            var subidx__8379 = n >>> level & 31;
            cljs.core.pv_aset.call(null, node__8378, subidx__8379, go.call(null, level - 5, cljs.core.pv_aget.call(null, node__8378, subidx__8379)));
            return node__8378
          }
        }.call(null, this__8374.shift, this__8374.root);
        this__8374.root = new_root__8380;
        return tcoll
      }
    }else {
      if(n === this__8374.cnt) {
        return tcoll.cljs$core$ITransientCollection$_conj_BANG_$arity$2(tcoll, val)
      }else {
        if("\ufdd0'else") {
          throw new Error([cljs.core.str("Index "), cljs.core.str(n), cljs.core.str(" out of bounds for TransientVector of length"), cljs.core.str(this__8374.cnt)].join(""));
        }else {
          return null
        }
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientVector$_pop_BANG_$arity$1 = function(tcoll) {
  var this__8381 = this;
  if(this__8381.root.edit) {
    if(this__8381.cnt === 0) {
      throw new Error("Can't pop empty vector");
    }else {
      if(1 === this__8381.cnt) {
        this__8381.cnt = 0;
        return tcoll
      }else {
        if((this__8381.cnt - 1 & 31) > 0) {
          this__8381.cnt = this__8381.cnt - 1;
          return tcoll
        }else {
          if("\ufdd0'else") {
            var new_tail__8382 = cljs.core.editable_array_for.call(null, tcoll, this__8381.cnt - 2);
            var new_root__8384 = function() {
              var nr__8383 = cljs.core.tv_pop_tail.call(null, tcoll, this__8381.shift, this__8381.root);
              if(!(nr__8383 == null)) {
                return nr__8383
              }else {
                return new cljs.core.VectorNode(this__8381.root.edit, cljs.core.make_array.call(null, 32))
              }
            }();
            if(function() {
              var and__3941__auto____8385 = 5 < this__8381.shift;
              if(and__3941__auto____8385) {
                return cljs.core.pv_aget.call(null, new_root__8384, 1) == null
              }else {
                return and__3941__auto____8385
              }
            }()) {
              var new_root__8386 = cljs.core.tv_ensure_editable.call(null, this__8381.root.edit, cljs.core.pv_aget.call(null, new_root__8384, 0));
              this__8381.root = new_root__8386;
              this__8381.shift = this__8381.shift - 5;
              this__8381.cnt = this__8381.cnt - 1;
              this__8381.tail = new_tail__8382;
              return tcoll
            }else {
              this__8381.root = new_root__8384;
              this__8381.cnt = this__8381.cnt - 1;
              this__8381.tail = new_tail__8382;
              return tcoll
            }
          }else {
            return null
          }
        }
      }
    }
  }else {
    throw new Error("pop! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8387 = this;
  return tcoll.cljs$core$ITransientVector$_assoc_n_BANG_$arity$3(tcoll, key, val)
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8388 = this;
  if(this__8388.root.edit) {
    if(this__8388.cnt - cljs.core.tail_off.call(null, tcoll) < 32) {
      this__8388.tail[this__8388.cnt & 31] = o;
      this__8388.cnt = this__8388.cnt + 1;
      return tcoll
    }else {
      var tail_node__8389 = new cljs.core.VectorNode(this__8388.root.edit, this__8388.tail);
      var new_tail__8390 = cljs.core.make_array.call(null, 32);
      new_tail__8390[0] = o;
      this__8388.tail = new_tail__8390;
      if(this__8388.cnt >>> 5 > 1 << this__8388.shift) {
        var new_root_array__8391 = cljs.core.make_array.call(null, 32);
        var new_shift__8392 = this__8388.shift + 5;
        new_root_array__8391[0] = this__8388.root;
        new_root_array__8391[1] = cljs.core.new_path.call(null, this__8388.root.edit, this__8388.shift, tail_node__8389);
        this__8388.root = new cljs.core.VectorNode(this__8388.root.edit, new_root_array__8391);
        this__8388.shift = new_shift__8392;
        this__8388.cnt = this__8388.cnt + 1;
        return tcoll
      }else {
        var new_root__8393 = cljs.core.tv_push_tail.call(null, tcoll, this__8388.shift, this__8388.root, tail_node__8389);
        this__8388.root = new_root__8393;
        this__8388.cnt = this__8388.cnt + 1;
        return tcoll
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientVector.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8394 = this;
  if(this__8394.root.edit) {
    this__8394.root.edit = null;
    var len__8395 = this__8394.cnt - cljs.core.tail_off.call(null, tcoll);
    var trimmed_tail__8396 = cljs.core.make_array.call(null, len__8395);
    cljs.core.array_copy.call(null, this__8394.tail, 0, trimmed_tail__8396, 0, len__8395);
    return new cljs.core.PersistentVector(null, this__8394.cnt, this__8394.shift, this__8394.root, trimmed_tail__8396, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientVector;
cljs.core.PersistentQueueSeq = function(meta, front, rear, __hash) {
  this.meta = meta;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.PersistentQueueSeq.cljs$lang$type = true;
cljs.core.PersistentQueueSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueueSeq")
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8398 = this;
  var h__2141__auto____8399 = this__8398.__hash;
  if(!(h__2141__auto____8399 == null)) {
    return h__2141__auto____8399
  }else {
    var h__2141__auto____8400 = cljs.core.hash_coll.call(null, coll);
    this__8398.__hash = h__2141__auto____8400;
    return h__2141__auto____8400
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8401 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentQueueSeq.prototype.toString = function() {
  var this__8402 = this;
  var this__8403 = this;
  return cljs.core.pr_str.call(null, this__8403)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8404 = this;
  return coll
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8405 = this;
  return cljs.core._first.call(null, this__8405.front)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8406 = this;
  var temp__4090__auto____8407 = cljs.core.next.call(null, this__8406.front);
  if(temp__4090__auto____8407) {
    var f1__8408 = temp__4090__auto____8407;
    return new cljs.core.PersistentQueueSeq(this__8406.meta, f1__8408, this__8406.rear, null)
  }else {
    if(this__8406.rear == null) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      return new cljs.core.PersistentQueueSeq(this__8406.meta, this__8406.rear, null, null)
    }
  }
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8409 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8410 = this;
  return new cljs.core.PersistentQueueSeq(meta, this__8410.front, this__8410.rear, this__8410.__hash)
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8411 = this;
  return this__8411.meta
};
cljs.core.PersistentQueueSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8412 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8412.meta)
};
cljs.core.PersistentQueueSeq;
cljs.core.PersistentQueue = function(meta, count, front, rear, __hash) {
  this.meta = meta;
  this.count = count;
  this.front = front;
  this.rear = rear;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31858766
};
cljs.core.PersistentQueue.cljs$lang$type = true;
cljs.core.PersistentQueue.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentQueue")
};
cljs.core.PersistentQueue.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8413 = this;
  var h__2141__auto____8414 = this__8413.__hash;
  if(!(h__2141__auto____8414 == null)) {
    return h__2141__auto____8414
  }else {
    var h__2141__auto____8415 = cljs.core.hash_coll.call(null, coll);
    this__8413.__hash = h__2141__auto____8415;
    return h__2141__auto____8415
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8416 = this;
  if(cljs.core.truth_(this__8416.front)) {
    return new cljs.core.PersistentQueue(this__8416.meta, this__8416.count + 1, this__8416.front, cljs.core.conj.call(null, function() {
      var or__3943__auto____8417 = this__8416.rear;
      if(cljs.core.truth_(or__3943__auto____8417)) {
        return or__3943__auto____8417
      }else {
        return cljs.core.PersistentVector.EMPTY
      }
    }(), o), null)
  }else {
    return new cljs.core.PersistentQueue(this__8416.meta, this__8416.count + 1, cljs.core.conj.call(null, this__8416.front, o), cljs.core.PersistentVector.EMPTY, null)
  }
};
cljs.core.PersistentQueue.prototype.toString = function() {
  var this__8418 = this;
  var this__8419 = this;
  return cljs.core.pr_str.call(null, this__8419)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8420 = this;
  var rear__8421 = cljs.core.seq.call(null, this__8420.rear);
  if(cljs.core.truth_(function() {
    var or__3943__auto____8422 = this__8420.front;
    if(cljs.core.truth_(or__3943__auto____8422)) {
      return or__3943__auto____8422
    }else {
      return rear__8421
    }
  }())) {
    return new cljs.core.PersistentQueueSeq(null, this__8420.front, cljs.core.seq.call(null, rear__8421), null)
  }else {
    return null
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8423 = this;
  return this__8423.count
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_peek$arity$1 = function(coll) {
  var this__8424 = this;
  return cljs.core._first.call(null, this__8424.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$IStack$_pop$arity$1 = function(coll) {
  var this__8425 = this;
  if(cljs.core.truth_(this__8425.front)) {
    var temp__4090__auto____8426 = cljs.core.next.call(null, this__8425.front);
    if(temp__4090__auto____8426) {
      var f1__8427 = temp__4090__auto____8426;
      return new cljs.core.PersistentQueue(this__8425.meta, this__8425.count - 1, f1__8427, this__8425.rear, null)
    }else {
      return new cljs.core.PersistentQueue(this__8425.meta, this__8425.count - 1, cljs.core.seq.call(null, this__8425.rear), cljs.core.PersistentVector.EMPTY, null)
    }
  }else {
    return coll
  }
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8428 = this;
  return cljs.core.first.call(null, this__8428.front)
};
cljs.core.PersistentQueue.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8429 = this;
  return cljs.core.rest.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentQueue.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8430 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentQueue.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8431 = this;
  return new cljs.core.PersistentQueue(meta, this__8431.count, this__8431.front, this__8431.rear, this__8431.__hash)
};
cljs.core.PersistentQueue.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8432 = this;
  return this__8432.meta
};
cljs.core.PersistentQueue.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8433 = this;
  return cljs.core.PersistentQueue.EMPTY
};
cljs.core.PersistentQueue;
cljs.core.PersistentQueue.EMPTY = new cljs.core.PersistentQueue(null, 0, null, cljs.core.PersistentVector.EMPTY, 0);
cljs.core.NeverEquiv = function() {
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2097152
};
cljs.core.NeverEquiv.cljs$lang$type = true;
cljs.core.NeverEquiv.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/NeverEquiv")
};
cljs.core.NeverEquiv.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__8434 = this;
  return false
};
cljs.core.NeverEquiv;
cljs.core.never_equiv = new cljs.core.NeverEquiv;
cljs.core.equiv_map = function equiv_map(x, y) {
  return cljs.core.boolean$.call(null, cljs.core.map_QMARK_.call(null, y) ? cljs.core.count.call(null, x) === cljs.core.count.call(null, y) ? cljs.core.every_QMARK_.call(null, cljs.core.identity, cljs.core.map.call(null, function(xkv) {
    return cljs.core._EQ_.call(null, cljs.core._lookup.call(null, y, cljs.core.first.call(null, xkv), cljs.core.never_equiv), cljs.core.second.call(null, xkv))
  }, x)) : null : null)
};
cljs.core.scan_array = function scan_array(incr, k, array) {
  var len__8437 = array.length;
  var i__8438 = 0;
  while(true) {
    if(i__8438 < len__8437) {
      if(k === array[i__8438]) {
        return i__8438
      }else {
        var G__8439 = i__8438 + incr;
        i__8438 = G__8439;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.obj_map_compare_keys = function obj_map_compare_keys(a, b) {
  var a__8442 = cljs.core.hash.call(null, a);
  var b__8443 = cljs.core.hash.call(null, b);
  if(a__8442 < b__8443) {
    return-1
  }else {
    if(a__8442 > b__8443) {
      return 1
    }else {
      if("\ufdd0'else") {
        return 0
      }else {
        return null
      }
    }
  }
};
cljs.core.obj_map__GT_hash_map = function obj_map__GT_hash_map(m, k, v) {
  var ks__8451 = m.keys;
  var len__8452 = ks__8451.length;
  var so__8453 = m.strobj;
  var out__8454 = cljs.core.with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, cljs.core.meta.call(null, m));
  var i__8455 = 0;
  var out__8456 = cljs.core.transient$.call(null, out__8454);
  while(true) {
    if(i__8455 < len__8452) {
      var k__8457 = ks__8451[i__8455];
      var G__8458 = i__8455 + 1;
      var G__8459 = cljs.core.assoc_BANG_.call(null, out__8456, k__8457, so__8453[k__8457]);
      i__8455 = G__8458;
      out__8456 = G__8459;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, out__8456, k, v))
    }
    break
  }
};
cljs.core.obj_clone = function obj_clone(obj, ks) {
  var new_obj__8465 = {};
  var l__8466 = ks.length;
  var i__8467 = 0;
  while(true) {
    if(i__8467 < l__8466) {
      var k__8468 = ks[i__8467];
      new_obj__8465[k__8468] = obj[k__8468];
      var G__8469 = i__8467 + 1;
      i__8467 = G__8469;
      continue
    }else {
    }
    break
  }
  return new_obj__8465
};
cljs.core.ObjMap = function(meta, keys, strobj, update_count, __hash) {
  this.meta = meta;
  this.keys = keys;
  this.strobj = strobj;
  this.update_count = update_count;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.ObjMap.cljs$lang$type = true;
cljs.core.ObjMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ObjMap")
};
cljs.core.ObjMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8472 = this;
  return cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.hash_map.call(null), coll))
};
cljs.core.ObjMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8473 = this;
  var h__2141__auto____8474 = this__8473.__hash;
  if(!(h__2141__auto____8474 == null)) {
    return h__2141__auto____8474
  }else {
    var h__2141__auto____8475 = cljs.core.hash_imap.call(null, coll);
    this__8473.__hash = h__2141__auto____8475;
    return h__2141__auto____8475
  }
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8476 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.ObjMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8477 = this;
  if(function() {
    var and__3941__auto____8478 = goog.isString(k);
    if(and__3941__auto____8478) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8477.keys) == null)
    }else {
      return and__3941__auto____8478
    }
  }()) {
    return this__8477.strobj[k]
  }else {
    return not_found
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8479 = this;
  if(goog.isString(k)) {
    if(function() {
      var or__3943__auto____8480 = this__8479.update_count > cljs.core.ObjMap.HASHMAP_THRESHOLD;
      if(or__3943__auto____8480) {
        return or__3943__auto____8480
      }else {
        return this__8479.keys.length >= cljs.core.ObjMap.HASHMAP_THRESHOLD
      }
    }()) {
      return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
    }else {
      if(!(cljs.core.scan_array.call(null, 1, k, this__8479.keys) == null)) {
        var new_strobj__8481 = cljs.core.obj_clone.call(null, this__8479.strobj, this__8479.keys);
        new_strobj__8481[k] = v;
        return new cljs.core.ObjMap(this__8479.meta, this__8479.keys, new_strobj__8481, this__8479.update_count + 1, null)
      }else {
        var new_strobj__8482 = cljs.core.obj_clone.call(null, this__8479.strobj, this__8479.keys);
        var new_keys__8483 = this__8479.keys.slice();
        new_strobj__8482[k] = v;
        new_keys__8483.push(k);
        return new cljs.core.ObjMap(this__8479.meta, new_keys__8483, new_strobj__8482, this__8479.update_count + 1, null)
      }
    }
  }else {
    return cljs.core.obj_map__GT_hash_map.call(null, coll, k, v)
  }
};
cljs.core.ObjMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8484 = this;
  if(function() {
    var and__3941__auto____8485 = goog.isString(k);
    if(and__3941__auto____8485) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8484.keys) == null)
    }else {
      return and__3941__auto____8485
    }
  }()) {
    return true
  }else {
    return false
  }
};
cljs.core.ObjMap.prototype.call = function() {
  var G__8507 = null;
  var G__8507__2 = function(this_sym8486, k) {
    var this__8488 = this;
    var this_sym8486__8489 = this;
    var coll__8490 = this_sym8486__8489;
    return coll__8490.cljs$core$ILookup$_lookup$arity$2(coll__8490, k)
  };
  var G__8507__3 = function(this_sym8487, k, not_found) {
    var this__8488 = this;
    var this_sym8487__8491 = this;
    var coll__8492 = this_sym8487__8491;
    return coll__8492.cljs$core$ILookup$_lookup$arity$3(coll__8492, k, not_found)
  };
  G__8507 = function(this_sym8487, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8507__2.call(this, this_sym8487, k);
      case 3:
        return G__8507__3.call(this, this_sym8487, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8507
}();
cljs.core.ObjMap.prototype.apply = function(this_sym8470, args8471) {
  var this__8493 = this;
  return this_sym8470.call.apply(this_sym8470, [this_sym8470].concat(args8471.slice()))
};
cljs.core.ObjMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8494 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.ObjMap.prototype.toString = function() {
  var this__8495 = this;
  var this__8496 = this;
  return cljs.core.pr_str.call(null, this__8496)
};
cljs.core.ObjMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8497 = this;
  if(this__8497.keys.length > 0) {
    return cljs.core.map.call(null, function(p1__8460_SHARP_) {
      return cljs.core.vector.call(null, p1__8460_SHARP_, this__8497.strobj[p1__8460_SHARP_])
    }, this__8497.keys.sort(cljs.core.obj_map_compare_keys))
  }else {
    return null
  }
};
cljs.core.ObjMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8498 = this;
  return this__8498.keys.length
};
cljs.core.ObjMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8499 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.ObjMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8500 = this;
  return new cljs.core.ObjMap(meta, this__8500.keys, this__8500.strobj, this__8500.update_count, this__8500.__hash)
};
cljs.core.ObjMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8501 = this;
  return this__8501.meta
};
cljs.core.ObjMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8502 = this;
  return cljs.core.with_meta.call(null, cljs.core.ObjMap.EMPTY, this__8502.meta)
};
cljs.core.ObjMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8503 = this;
  if(function() {
    var and__3941__auto____8504 = goog.isString(k);
    if(and__3941__auto____8504) {
      return!(cljs.core.scan_array.call(null, 1, k, this__8503.keys) == null)
    }else {
      return and__3941__auto____8504
    }
  }()) {
    var new_keys__8505 = this__8503.keys.slice();
    var new_strobj__8506 = cljs.core.obj_clone.call(null, this__8503.strobj, this__8503.keys);
    new_keys__8505.splice(cljs.core.scan_array.call(null, 1, k, new_keys__8505), 1);
    cljs.core.js_delete.call(null, new_strobj__8506, k);
    return new cljs.core.ObjMap(this__8503.meta, new_keys__8505, new_strobj__8506, this__8503.update_count + 1, null)
  }else {
    return coll
  }
};
cljs.core.ObjMap;
cljs.core.ObjMap.EMPTY = new cljs.core.ObjMap(null, [], {}, 0, 0);
cljs.core.ObjMap.HASHMAP_THRESHOLD = 32;
cljs.core.ObjMap.fromObject = function(ks, obj) {
  return new cljs.core.ObjMap(null, ks, obj, 0, null)
};
cljs.core.HashMap = function(meta, count, hashobj, __hash) {
  this.meta = meta;
  this.count = count;
  this.hashobj = hashobj;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 15075087
};
cljs.core.HashMap.cljs$lang$type = true;
cljs.core.HashMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashMap")
};
cljs.core.HashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8511 = this;
  var h__2141__auto____8512 = this__8511.__hash;
  if(!(h__2141__auto____8512 == null)) {
    return h__2141__auto____8512
  }else {
    var h__2141__auto____8513 = cljs.core.hash_imap.call(null, coll);
    this__8511.__hash = h__2141__auto____8513;
    return h__2141__auto____8513
  }
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8514 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.HashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8515 = this;
  var bucket__8516 = this__8515.hashobj[cljs.core.hash.call(null, k)];
  var i__8517 = cljs.core.truth_(bucket__8516) ? cljs.core.scan_array.call(null, 2, k, bucket__8516) : null;
  if(cljs.core.truth_(i__8517)) {
    return bucket__8516[i__8517 + 1]
  }else {
    return not_found
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8518 = this;
  var h__8519 = cljs.core.hash.call(null, k);
  var bucket__8520 = this__8518.hashobj[h__8519];
  if(cljs.core.truth_(bucket__8520)) {
    var new_bucket__8521 = bucket__8520.slice();
    var new_hashobj__8522 = goog.object.clone(this__8518.hashobj);
    new_hashobj__8522[h__8519] = new_bucket__8521;
    var temp__4090__auto____8523 = cljs.core.scan_array.call(null, 2, k, new_bucket__8521);
    if(cljs.core.truth_(temp__4090__auto____8523)) {
      var i__8524 = temp__4090__auto____8523;
      new_bucket__8521[i__8524 + 1] = v;
      return new cljs.core.HashMap(this__8518.meta, this__8518.count, new_hashobj__8522, null)
    }else {
      new_bucket__8521.push(k, v);
      return new cljs.core.HashMap(this__8518.meta, this__8518.count + 1, new_hashobj__8522, null)
    }
  }else {
    var new_hashobj__8525 = goog.object.clone(this__8518.hashobj);
    new_hashobj__8525[h__8519] = [k, v];
    return new cljs.core.HashMap(this__8518.meta, this__8518.count + 1, new_hashobj__8525, null)
  }
};
cljs.core.HashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8526 = this;
  var bucket__8527 = this__8526.hashobj[cljs.core.hash.call(null, k)];
  var i__8528 = cljs.core.truth_(bucket__8527) ? cljs.core.scan_array.call(null, 2, k, bucket__8527) : null;
  if(cljs.core.truth_(i__8528)) {
    return true
  }else {
    return false
  }
};
cljs.core.HashMap.prototype.call = function() {
  var G__8553 = null;
  var G__8553__2 = function(this_sym8529, k) {
    var this__8531 = this;
    var this_sym8529__8532 = this;
    var coll__8533 = this_sym8529__8532;
    return coll__8533.cljs$core$ILookup$_lookup$arity$2(coll__8533, k)
  };
  var G__8553__3 = function(this_sym8530, k, not_found) {
    var this__8531 = this;
    var this_sym8530__8534 = this;
    var coll__8535 = this_sym8530__8534;
    return coll__8535.cljs$core$ILookup$_lookup$arity$3(coll__8535, k, not_found)
  };
  G__8553 = function(this_sym8530, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8553__2.call(this, this_sym8530, k);
      case 3:
        return G__8553__3.call(this, this_sym8530, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8553
}();
cljs.core.HashMap.prototype.apply = function(this_sym8509, args8510) {
  var this__8536 = this;
  return this_sym8509.call.apply(this_sym8509, [this_sym8509].concat(args8510.slice()))
};
cljs.core.HashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8537 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.HashMap.prototype.toString = function() {
  var this__8538 = this;
  var this__8539 = this;
  return cljs.core.pr_str.call(null, this__8539)
};
cljs.core.HashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8540 = this;
  if(this__8540.count > 0) {
    var hashes__8541 = cljs.core.js_keys.call(null, this__8540.hashobj).sort();
    return cljs.core.mapcat.call(null, function(p1__8508_SHARP_) {
      return cljs.core.map.call(null, cljs.core.vec, cljs.core.partition.call(null, 2, this__8540.hashobj[p1__8508_SHARP_]))
    }, hashes__8541)
  }else {
    return null
  }
};
cljs.core.HashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8542 = this;
  return this__8542.count
};
cljs.core.HashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8543 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.HashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8544 = this;
  return new cljs.core.HashMap(meta, this__8544.count, this__8544.hashobj, this__8544.__hash)
};
cljs.core.HashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8545 = this;
  return this__8545.meta
};
cljs.core.HashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8546 = this;
  return cljs.core.with_meta.call(null, cljs.core.HashMap.EMPTY, this__8546.meta)
};
cljs.core.HashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8547 = this;
  var h__8548 = cljs.core.hash.call(null, k);
  var bucket__8549 = this__8547.hashobj[h__8548];
  var i__8550 = cljs.core.truth_(bucket__8549) ? cljs.core.scan_array.call(null, 2, k, bucket__8549) : null;
  if(cljs.core.not.call(null, i__8550)) {
    return coll
  }else {
    var new_hashobj__8551 = goog.object.clone(this__8547.hashobj);
    if(3 > bucket__8549.length) {
      cljs.core.js_delete.call(null, new_hashobj__8551, h__8548)
    }else {
      var new_bucket__8552 = bucket__8549.slice();
      new_bucket__8552.splice(i__8550, 2);
      new_hashobj__8551[h__8548] = new_bucket__8552
    }
    return new cljs.core.HashMap(this__8547.meta, this__8547.count - 1, new_hashobj__8551, null)
  }
};
cljs.core.HashMap;
cljs.core.HashMap.EMPTY = new cljs.core.HashMap(null, 0, {}, 0);
cljs.core.HashMap.fromArrays = function(ks, vs) {
  var len__8554 = ks.length;
  var i__8555 = 0;
  var out__8556 = cljs.core.HashMap.EMPTY;
  while(true) {
    if(i__8555 < len__8554) {
      var G__8557 = i__8555 + 1;
      var G__8558 = cljs.core.assoc.call(null, out__8556, ks[i__8555], vs[i__8555]);
      i__8555 = G__8557;
      out__8556 = G__8558;
      continue
    }else {
      return out__8556
    }
    break
  }
};
cljs.core.array_map_index_of = function array_map_index_of(m, k) {
  var arr__8562 = m.arr;
  var len__8563 = arr__8562.length;
  var i__8564 = 0;
  while(true) {
    if(len__8563 <= i__8564) {
      return-1
    }else {
      if(cljs.core._EQ_.call(null, arr__8562[i__8564], k)) {
        return i__8564
      }else {
        if("\ufdd0'else") {
          var G__8565 = i__8564 + 2;
          i__8564 = G__8565;
          continue
        }else {
          return null
        }
      }
    }
    break
  }
};
cljs.core.PersistentArrayMap = function(meta, cnt, arr, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.arr = arr;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentArrayMap.cljs$lang$type = true;
cljs.core.PersistentArrayMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentArrayMap")
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8568 = this;
  return new cljs.core.TransientArrayMap({}, this__8568.arr.length, this__8568.arr.slice())
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8569 = this;
  var h__2141__auto____8570 = this__8569.__hash;
  if(!(h__2141__auto____8570 == null)) {
    return h__2141__auto____8570
  }else {
    var h__2141__auto____8571 = cljs.core.hash_imap.call(null, coll);
    this__8569.__hash = h__2141__auto____8571;
    return h__2141__auto____8571
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8572 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8573 = this;
  var idx__8574 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8574 === -1) {
    return not_found
  }else {
    return this__8573.arr[idx__8574 + 1]
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8575 = this;
  var idx__8576 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8576 === -1) {
    if(this__8575.cnt < cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
      return new cljs.core.PersistentArrayMap(this__8575.meta, this__8575.cnt + 1, function() {
        var G__8577__8578 = this__8575.arr.slice();
        G__8577__8578.push(k);
        G__8577__8578.push(v);
        return G__8577__8578
      }(), null)
    }else {
      return cljs.core.persistent_BANG_.call(null, cljs.core.assoc_BANG_.call(null, cljs.core.transient$.call(null, cljs.core.into.call(null, cljs.core.PersistentHashMap.EMPTY, coll)), k, v))
    }
  }else {
    if(v === this__8575.arr[idx__8576 + 1]) {
      return coll
    }else {
      if("\ufdd0'else") {
        return new cljs.core.PersistentArrayMap(this__8575.meta, this__8575.cnt, function() {
          var G__8579__8580 = this__8575.arr.slice();
          G__8579__8580[idx__8576 + 1] = v;
          return G__8579__8580
        }(), null)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8581 = this;
  return!(cljs.core.array_map_index_of.call(null, coll, k) === -1)
};
cljs.core.PersistentArrayMap.prototype.call = function() {
  var G__8613 = null;
  var G__8613__2 = function(this_sym8582, k) {
    var this__8584 = this;
    var this_sym8582__8585 = this;
    var coll__8586 = this_sym8582__8585;
    return coll__8586.cljs$core$ILookup$_lookup$arity$2(coll__8586, k)
  };
  var G__8613__3 = function(this_sym8583, k, not_found) {
    var this__8584 = this;
    var this_sym8583__8587 = this;
    var coll__8588 = this_sym8583__8587;
    return coll__8588.cljs$core$ILookup$_lookup$arity$3(coll__8588, k, not_found)
  };
  G__8613 = function(this_sym8583, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8613__2.call(this, this_sym8583, k);
      case 3:
        return G__8613__3.call(this, this_sym8583, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8613
}();
cljs.core.PersistentArrayMap.prototype.apply = function(this_sym8566, args8567) {
  var this__8589 = this;
  return this_sym8566.call.apply(this_sym8566, [this_sym8566].concat(args8567.slice()))
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8590 = this;
  var len__8591 = this__8590.arr.length;
  var i__8592 = 0;
  var init__8593 = init;
  while(true) {
    if(i__8592 < len__8591) {
      var init__8594 = f.call(null, init__8593, this__8590.arr[i__8592], this__8590.arr[i__8592 + 1]);
      if(cljs.core.reduced_QMARK_.call(null, init__8594)) {
        return cljs.core.deref.call(null, init__8594)
      }else {
        var G__8614 = i__8592 + 2;
        var G__8615 = init__8594;
        i__8592 = G__8614;
        init__8593 = G__8615;
        continue
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8595 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentArrayMap.prototype.toString = function() {
  var this__8596 = this;
  var this__8597 = this;
  return cljs.core.pr_str.call(null, this__8597)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8598 = this;
  if(this__8598.cnt > 0) {
    var len__8599 = this__8598.arr.length;
    var array_map_seq__8600 = function array_map_seq(i) {
      return new cljs.core.LazySeq(null, false, function() {
        if(i < len__8599) {
          return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([this__8598.arr[i], this__8598.arr[i + 1]], true), array_map_seq.call(null, i + 2))
        }else {
          return null
        }
      }, null)
    };
    return array_map_seq__8600.call(null, 0)
  }else {
    return null
  }
};
cljs.core.PersistentArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8601 = this;
  return this__8601.cnt
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8602 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8603 = this;
  return new cljs.core.PersistentArrayMap(meta, this__8603.cnt, this__8603.arr, this__8603.__hash)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8604 = this;
  return this__8604.meta
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8605 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentArrayMap.EMPTY, this__8605.meta)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8606 = this;
  var idx__8607 = cljs.core.array_map_index_of.call(null, coll, k);
  if(idx__8607 >= 0) {
    var len__8608 = this__8606.arr.length;
    var new_len__8609 = len__8608 - 2;
    if(new_len__8609 === 0) {
      return coll.cljs$core$IEmptyableCollection$_empty$arity$1(coll)
    }else {
      var new_arr__8610 = cljs.core.make_array.call(null, new_len__8609);
      var s__8611 = 0;
      var d__8612 = 0;
      while(true) {
        if(s__8611 >= len__8608) {
          return new cljs.core.PersistentArrayMap(this__8606.meta, this__8606.cnt - 1, new_arr__8610, null)
        }else {
          if(cljs.core._EQ_.call(null, k, this__8606.arr[s__8611])) {
            var G__8616 = s__8611 + 2;
            var G__8617 = d__8612;
            s__8611 = G__8616;
            d__8612 = G__8617;
            continue
          }else {
            if("\ufdd0'else") {
              new_arr__8610[d__8612] = this__8606.arr[s__8611];
              new_arr__8610[d__8612 + 1] = this__8606.arr[s__8611 + 1];
              var G__8618 = s__8611 + 2;
              var G__8619 = d__8612 + 2;
              s__8611 = G__8618;
              d__8612 = G__8619;
              continue
            }else {
              return null
            }
          }
        }
        break
      }
    }
  }else {
    return coll
  }
};
cljs.core.PersistentArrayMap;
cljs.core.PersistentArrayMap.EMPTY = new cljs.core.PersistentArrayMap(null, 0, [], null);
cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD = 16;
cljs.core.PersistentArrayMap.fromArrays = function(ks, vs) {
  var len__8620 = cljs.core.count.call(null, ks);
  var i__8621 = 0;
  var out__8622 = cljs.core.transient$.call(null, cljs.core.PersistentArrayMap.EMPTY);
  while(true) {
    if(i__8621 < len__8620) {
      var G__8623 = i__8621 + 1;
      var G__8624 = cljs.core.assoc_BANG_.call(null, out__8622, ks[i__8621], vs[i__8621]);
      i__8621 = G__8623;
      out__8622 = G__8624;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8622)
    }
    break
  }
};
cljs.core.TransientArrayMap = function(editable_QMARK_, len, arr) {
  this.editable_QMARK_ = editable_QMARK_;
  this.len = len;
  this.arr = arr;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientArrayMap.cljs$lang$type = true;
cljs.core.TransientArrayMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientArrayMap")
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8625 = this;
  if(cljs.core.truth_(this__8625.editable_QMARK_)) {
    var idx__8626 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8626 >= 0) {
      this__8625.arr[idx__8626] = this__8625.arr[this__8625.len - 2];
      this__8625.arr[idx__8626 + 1] = this__8625.arr[this__8625.len - 1];
      var G__8627__8628 = this__8625.arr;
      G__8627__8628.pop();
      G__8627__8628.pop();
      G__8627__8628;
      this__8625.len = this__8625.len - 2
    }else {
    }
    return tcoll
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8629 = this;
  if(cljs.core.truth_(this__8629.editable_QMARK_)) {
    var idx__8630 = cljs.core.array_map_index_of.call(null, tcoll, key);
    if(idx__8630 === -1) {
      if(this__8629.len + 2 <= 2 * cljs.core.PersistentArrayMap.HASHMAP_THRESHOLD) {
        this__8629.len = this__8629.len + 2;
        this__8629.arr.push(key);
        this__8629.arr.push(val);
        return tcoll
      }else {
        return cljs.core.assoc_BANG_.call(null, cljs.core.array__GT_transient_hash_map.call(null, this__8629.len, this__8629.arr), key, val)
      }
    }else {
      if(val === this__8629.arr[idx__8630 + 1]) {
        return tcoll
      }else {
        this__8629.arr[idx__8630 + 1] = val;
        return tcoll
      }
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__8631 = this;
  if(cljs.core.truth_(this__8631.editable_QMARK_)) {
    if(function() {
      var G__8632__8633 = o;
      if(G__8632__8633) {
        if(function() {
          var or__3943__auto____8634 = G__8632__8633.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8634) {
            return or__3943__auto____8634
          }else {
            return G__8632__8633.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8632__8633.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8632__8633)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8632__8633)
      }
    }()) {
      return tcoll.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll, cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8635 = cljs.core.seq.call(null, o);
      var tcoll__8636 = tcoll;
      while(true) {
        var temp__4090__auto____8637 = cljs.core.first.call(null, es__8635);
        if(cljs.core.truth_(temp__4090__auto____8637)) {
          var e__8638 = temp__4090__auto____8637;
          var G__8644 = cljs.core.next.call(null, es__8635);
          var G__8645 = tcoll__8636.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3(tcoll__8636, cljs.core.key.call(null, e__8638), cljs.core.val.call(null, e__8638));
          es__8635 = G__8644;
          tcoll__8636 = G__8645;
          continue
        }else {
          return tcoll__8636
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8639 = this;
  if(cljs.core.truth_(this__8639.editable_QMARK_)) {
    this__8639.editable_QMARK_ = false;
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, this__8639.len, 2), this__8639.arr, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8640 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, k, null)
};
cljs.core.TransientArrayMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8641 = this;
  if(cljs.core.truth_(this__8641.editable_QMARK_)) {
    var idx__8642 = cljs.core.array_map_index_of.call(null, tcoll, k);
    if(idx__8642 === -1) {
      return not_found
    }else {
      return this__8641.arr[idx__8642 + 1]
    }
  }else {
    throw new Error("lookup after persistent!");
  }
};
cljs.core.TransientArrayMap.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__8643 = this;
  if(cljs.core.truth_(this__8643.editable_QMARK_)) {
    return cljs.core.quot.call(null, this__8643.len, 2)
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientArrayMap;
cljs.core.array__GT_transient_hash_map = function array__GT_transient_hash_map(len, arr) {
  var out__8648 = cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY);
  var i__8649 = 0;
  while(true) {
    if(i__8649 < len) {
      var G__8650 = cljs.core.assoc_BANG_.call(null, out__8648, arr[i__8649], arr[i__8649 + 1]);
      var G__8651 = i__8649 + 2;
      out__8648 = G__8650;
      i__8649 = G__8651;
      continue
    }else {
      return out__8648
    }
    break
  }
};
cljs.core.Box = function(val) {
  this.val = val
};
cljs.core.Box.cljs$lang$type = true;
cljs.core.Box.cljs$lang$ctorPrSeq = function(this__2259__auto__) {
  return cljs.core.list.call(null, "cljs.core/Box")
};
cljs.core.Box;
cljs.core.key_test = function key_test(key, other) {
  if(goog.isString(key)) {
    return key === other
  }else {
    return cljs.core._EQ_.call(null, key, other)
  }
};
cljs.core.mask = function mask(hash, shift) {
  return hash >>> shift & 31
};
cljs.core.clone_and_set = function() {
  var clone_and_set = null;
  var clone_and_set__3 = function(arr, i, a) {
    var G__8656__8657 = arr.slice();
    G__8656__8657[i] = a;
    return G__8656__8657
  };
  var clone_and_set__5 = function(arr, i, a, j, b) {
    var G__8658__8659 = arr.slice();
    G__8658__8659[i] = a;
    G__8658__8659[j] = b;
    return G__8658__8659
  };
  clone_and_set = function(arr, i, a, j, b) {
    switch(arguments.length) {
      case 3:
        return clone_and_set__3.call(this, arr, i, a);
      case 5:
        return clone_and_set__5.call(this, arr, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  clone_and_set.cljs$lang$arity$3 = clone_and_set__3;
  clone_and_set.cljs$lang$arity$5 = clone_and_set__5;
  return clone_and_set
}();
cljs.core.remove_pair = function remove_pair(arr, i) {
  var new_arr__8661 = cljs.core.make_array.call(null, arr.length - 2);
  cljs.core.array_copy.call(null, arr, 0, new_arr__8661, 0, 2 * i);
  cljs.core.array_copy.call(null, arr, 2 * (i + 1), new_arr__8661, 2 * i, new_arr__8661.length - 2 * i);
  return new_arr__8661
};
cljs.core.bitmap_indexed_node_index = function bitmap_indexed_node_index(bitmap, bit) {
  return cljs.core.bit_count.call(null, bitmap & bit - 1)
};
cljs.core.bitpos = function bitpos(hash, shift) {
  return 1 << (hash >>> shift & 31)
};
cljs.core.edit_and_set = function() {
  var edit_and_set = null;
  var edit_and_set__4 = function(inode, edit, i, a) {
    var editable__8664 = inode.ensure_editable(edit);
    editable__8664.arr[i] = a;
    return editable__8664
  };
  var edit_and_set__6 = function(inode, edit, i, a, j, b) {
    var editable__8665 = inode.ensure_editable(edit);
    editable__8665.arr[i] = a;
    editable__8665.arr[j] = b;
    return editable__8665
  };
  edit_and_set = function(inode, edit, i, a, j, b) {
    switch(arguments.length) {
      case 4:
        return edit_and_set__4.call(this, inode, edit, i, a);
      case 6:
        return edit_and_set__6.call(this, inode, edit, i, a, j, b)
    }
    throw"Invalid arity: " + arguments.length;
  };
  edit_and_set.cljs$lang$arity$4 = edit_and_set__4;
  edit_and_set.cljs$lang$arity$6 = edit_and_set__6;
  return edit_and_set
}();
cljs.core.inode_kv_reduce = function inode_kv_reduce(arr, f, init) {
  var len__8672 = arr.length;
  var i__8673 = 0;
  var init__8674 = init;
  while(true) {
    if(i__8673 < len__8672) {
      var init__8677 = function() {
        var k__8675 = arr[i__8673];
        if(!(k__8675 == null)) {
          return f.call(null, init__8674, k__8675, arr[i__8673 + 1])
        }else {
          var node__8676 = arr[i__8673 + 1];
          if(!(node__8676 == null)) {
            return node__8676.kv_reduce(f, init__8674)
          }else {
            return init__8674
          }
        }
      }();
      if(cljs.core.reduced_QMARK_.call(null, init__8677)) {
        return cljs.core.deref.call(null, init__8677)
      }else {
        var G__8678 = i__8673 + 2;
        var G__8679 = init__8677;
        i__8673 = G__8678;
        init__8674 = G__8679;
        continue
      }
    }else {
      return init__8674
    }
    break
  }
};
cljs.core.BitmapIndexedNode = function(edit, bitmap, arr) {
  this.edit = edit;
  this.bitmap = bitmap;
  this.arr = arr
};
cljs.core.BitmapIndexedNode.cljs$lang$type = true;
cljs.core.BitmapIndexedNode.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/BitmapIndexedNode")
};
cljs.core.BitmapIndexedNode.prototype.edit_and_remove_pair = function(e, bit, i) {
  var this__8680 = this;
  var inode__8681 = this;
  if(this__8680.bitmap === bit) {
    return null
  }else {
    var editable__8682 = inode__8681.ensure_editable(e);
    var earr__8683 = editable__8682.arr;
    var len__8684 = earr__8683.length;
    editable__8682.bitmap = bit ^ editable__8682.bitmap;
    cljs.core.array_copy.call(null, earr__8683, 2 * (i + 1), earr__8683, 2 * i, len__8684 - 2 * (i + 1));
    earr__8683[len__8684 - 2] = null;
    earr__8683[len__8684 - 1] = null;
    return editable__8682
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8685 = this;
  var inode__8686 = this;
  var bit__8687 = 1 << (hash >>> shift & 31);
  var idx__8688 = cljs.core.bitmap_indexed_node_index.call(null, this__8685.bitmap, bit__8687);
  if((this__8685.bitmap & bit__8687) === 0) {
    var n__8689 = cljs.core.bit_count.call(null, this__8685.bitmap);
    if(2 * n__8689 < this__8685.arr.length) {
      var editable__8690 = inode__8686.ensure_editable(edit);
      var earr__8691 = editable__8690.arr;
      added_leaf_QMARK_.val = true;
      cljs.core.array_copy_downward.call(null, earr__8691, 2 * idx__8688, earr__8691, 2 * (idx__8688 + 1), 2 * (n__8689 - idx__8688));
      earr__8691[2 * idx__8688] = key;
      earr__8691[2 * idx__8688 + 1] = val;
      editable__8690.bitmap = editable__8690.bitmap | bit__8687;
      return editable__8690
    }else {
      if(n__8689 >= 16) {
        var nodes__8692 = cljs.core.make_array.call(null, 32);
        var jdx__8693 = hash >>> shift & 31;
        nodes__8692[jdx__8693] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
        var i__8694 = 0;
        var j__8695 = 0;
        while(true) {
          if(i__8694 < 32) {
            if((this__8685.bitmap >>> i__8694 & 1) === 0) {
              var G__8748 = i__8694 + 1;
              var G__8749 = j__8695;
              i__8694 = G__8748;
              j__8695 = G__8749;
              continue
            }else {
              nodes__8692[i__8694] = !(this__8685.arr[j__8695] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, cljs.core.hash.call(null, this__8685.arr[j__8695]), this__8685.arr[j__8695], this__8685.arr[j__8695 + 1], added_leaf_QMARK_) : this__8685.arr[j__8695 + 1];
              var G__8750 = i__8694 + 1;
              var G__8751 = j__8695 + 2;
              i__8694 = G__8750;
              j__8695 = G__8751;
              continue
            }
          }else {
          }
          break
        }
        return new cljs.core.ArrayNode(edit, n__8689 + 1, nodes__8692)
      }else {
        if("\ufdd0'else") {
          var new_arr__8696 = cljs.core.make_array.call(null, 2 * (n__8689 + 4));
          cljs.core.array_copy.call(null, this__8685.arr, 0, new_arr__8696, 0, 2 * idx__8688);
          new_arr__8696[2 * idx__8688] = key;
          new_arr__8696[2 * idx__8688 + 1] = val;
          cljs.core.array_copy.call(null, this__8685.arr, 2 * idx__8688, new_arr__8696, 2 * (idx__8688 + 1), 2 * (n__8689 - idx__8688));
          added_leaf_QMARK_.val = true;
          var editable__8697 = inode__8686.ensure_editable(edit);
          editable__8697.arr = new_arr__8696;
          editable__8697.bitmap = editable__8697.bitmap | bit__8687;
          return editable__8697
        }else {
          return null
        }
      }
    }
  }else {
    var key_or_nil__8698 = this__8685.arr[2 * idx__8688];
    var val_or_node__8699 = this__8685.arr[2 * idx__8688 + 1];
    if(key_or_nil__8698 == null) {
      var n__8700 = val_or_node__8699.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8700 === val_or_node__8699) {
        return inode__8686
      }else {
        return cljs.core.edit_and_set.call(null, inode__8686, edit, 2 * idx__8688 + 1, n__8700)
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8698)) {
        if(val === val_or_node__8699) {
          return inode__8686
        }else {
          return cljs.core.edit_and_set.call(null, inode__8686, edit, 2 * idx__8688 + 1, val)
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return cljs.core.edit_and_set.call(null, inode__8686, edit, 2 * idx__8688, null, 2 * idx__8688 + 1, cljs.core.create_node.call(null, edit, shift + 5, key_or_nil__8698, val_or_node__8699, hash, key, val))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_seq = function() {
  var this__8701 = this;
  var inode__8702 = this;
  return cljs.core.create_inode_seq.call(null, this__8701.arr)
};
cljs.core.BitmapIndexedNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8703 = this;
  var inode__8704 = this;
  var bit__8705 = 1 << (hash >>> shift & 31);
  if((this__8703.bitmap & bit__8705) === 0) {
    return inode__8704
  }else {
    var idx__8706 = cljs.core.bitmap_indexed_node_index.call(null, this__8703.bitmap, bit__8705);
    var key_or_nil__8707 = this__8703.arr[2 * idx__8706];
    var val_or_node__8708 = this__8703.arr[2 * idx__8706 + 1];
    if(key_or_nil__8707 == null) {
      var n__8709 = val_or_node__8708.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
      if(n__8709 === val_or_node__8708) {
        return inode__8704
      }else {
        if(!(n__8709 == null)) {
          return cljs.core.edit_and_set.call(null, inode__8704, edit, 2 * idx__8706 + 1, n__8709)
        }else {
          if(this__8703.bitmap === bit__8705) {
            return null
          }else {
            if("\ufdd0'else") {
              return inode__8704.edit_and_remove_pair(edit, bit__8705, idx__8706)
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8707)) {
        removed_leaf_QMARK_[0] = true;
        return inode__8704.edit_and_remove_pair(edit, bit__8705, idx__8706)
      }else {
        if("\ufdd0'else") {
          return inode__8704
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.ensure_editable = function(e) {
  var this__8710 = this;
  var inode__8711 = this;
  if(e === this__8710.edit) {
    return inode__8711
  }else {
    var n__8712 = cljs.core.bit_count.call(null, this__8710.bitmap);
    var new_arr__8713 = cljs.core.make_array.call(null, n__8712 < 0 ? 4 : 2 * (n__8712 + 1));
    cljs.core.array_copy.call(null, this__8710.arr, 0, new_arr__8713, 0, 2 * n__8712);
    return new cljs.core.BitmapIndexedNode(e, this__8710.bitmap, new_arr__8713)
  }
};
cljs.core.BitmapIndexedNode.prototype.kv_reduce = function(f, init) {
  var this__8714 = this;
  var inode__8715 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8714.arr, f, init)
};
cljs.core.BitmapIndexedNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8716 = this;
  var inode__8717 = this;
  var bit__8718 = 1 << (hash >>> shift & 31);
  if((this__8716.bitmap & bit__8718) === 0) {
    return not_found
  }else {
    var idx__8719 = cljs.core.bitmap_indexed_node_index.call(null, this__8716.bitmap, bit__8718);
    var key_or_nil__8720 = this__8716.arr[2 * idx__8719];
    var val_or_node__8721 = this__8716.arr[2 * idx__8719 + 1];
    if(key_or_nil__8720 == null) {
      return val_or_node__8721.inode_find(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8720)) {
        return cljs.core.PersistentVector.fromArray([key_or_nil__8720, val_or_node__8721], true)
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_without = function(shift, hash, key) {
  var this__8722 = this;
  var inode__8723 = this;
  var bit__8724 = 1 << (hash >>> shift & 31);
  if((this__8722.bitmap & bit__8724) === 0) {
    return inode__8723
  }else {
    var idx__8725 = cljs.core.bitmap_indexed_node_index.call(null, this__8722.bitmap, bit__8724);
    var key_or_nil__8726 = this__8722.arr[2 * idx__8725];
    var val_or_node__8727 = this__8722.arr[2 * idx__8725 + 1];
    if(key_or_nil__8726 == null) {
      var n__8728 = val_or_node__8727.inode_without(shift + 5, hash, key);
      if(n__8728 === val_or_node__8727) {
        return inode__8723
      }else {
        if(!(n__8728 == null)) {
          return new cljs.core.BitmapIndexedNode(null, this__8722.bitmap, cljs.core.clone_and_set.call(null, this__8722.arr, 2 * idx__8725 + 1, n__8728))
        }else {
          if(this__8722.bitmap === bit__8724) {
            return null
          }else {
            if("\ufdd0'else") {
              return new cljs.core.BitmapIndexedNode(null, this__8722.bitmap ^ bit__8724, cljs.core.remove_pair.call(null, this__8722.arr, idx__8725))
            }else {
              return null
            }
          }
        }
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8726)) {
        return new cljs.core.BitmapIndexedNode(null, this__8722.bitmap ^ bit__8724, cljs.core.remove_pair.call(null, this__8722.arr, idx__8725))
      }else {
        if("\ufdd0'else") {
          return inode__8723
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8729 = this;
  var inode__8730 = this;
  var bit__8731 = 1 << (hash >>> shift & 31);
  var idx__8732 = cljs.core.bitmap_indexed_node_index.call(null, this__8729.bitmap, bit__8731);
  if((this__8729.bitmap & bit__8731) === 0) {
    var n__8733 = cljs.core.bit_count.call(null, this__8729.bitmap);
    if(n__8733 >= 16) {
      var nodes__8734 = cljs.core.make_array.call(null, 32);
      var jdx__8735 = hash >>> shift & 31;
      nodes__8734[jdx__8735] = cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      var i__8736 = 0;
      var j__8737 = 0;
      while(true) {
        if(i__8736 < 32) {
          if((this__8729.bitmap >>> i__8736 & 1) === 0) {
            var G__8752 = i__8736 + 1;
            var G__8753 = j__8737;
            i__8736 = G__8752;
            j__8737 = G__8753;
            continue
          }else {
            nodes__8734[i__8736] = !(this__8729.arr[j__8737] == null) ? cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, cljs.core.hash.call(null, this__8729.arr[j__8737]), this__8729.arr[j__8737], this__8729.arr[j__8737 + 1], added_leaf_QMARK_) : this__8729.arr[j__8737 + 1];
            var G__8754 = i__8736 + 1;
            var G__8755 = j__8737 + 2;
            i__8736 = G__8754;
            j__8737 = G__8755;
            continue
          }
        }else {
        }
        break
      }
      return new cljs.core.ArrayNode(null, n__8733 + 1, nodes__8734)
    }else {
      var new_arr__8738 = cljs.core.make_array.call(null, 2 * (n__8733 + 1));
      cljs.core.array_copy.call(null, this__8729.arr, 0, new_arr__8738, 0, 2 * idx__8732);
      new_arr__8738[2 * idx__8732] = key;
      new_arr__8738[2 * idx__8732 + 1] = val;
      cljs.core.array_copy.call(null, this__8729.arr, 2 * idx__8732, new_arr__8738, 2 * (idx__8732 + 1), 2 * (n__8733 - idx__8732));
      added_leaf_QMARK_.val = true;
      return new cljs.core.BitmapIndexedNode(null, this__8729.bitmap | bit__8731, new_arr__8738)
    }
  }else {
    var key_or_nil__8739 = this__8729.arr[2 * idx__8732];
    var val_or_node__8740 = this__8729.arr[2 * idx__8732 + 1];
    if(key_or_nil__8739 == null) {
      var n__8741 = val_or_node__8740.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
      if(n__8741 === val_or_node__8740) {
        return inode__8730
      }else {
        return new cljs.core.BitmapIndexedNode(null, this__8729.bitmap, cljs.core.clone_and_set.call(null, this__8729.arr, 2 * idx__8732 + 1, n__8741))
      }
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8739)) {
        if(val === val_or_node__8740) {
          return inode__8730
        }else {
          return new cljs.core.BitmapIndexedNode(null, this__8729.bitmap, cljs.core.clone_and_set.call(null, this__8729.arr, 2 * idx__8732 + 1, val))
        }
      }else {
        if("\ufdd0'else") {
          added_leaf_QMARK_.val = true;
          return new cljs.core.BitmapIndexedNode(null, this__8729.bitmap, cljs.core.clone_and_set.call(null, this__8729.arr, 2 * idx__8732, null, 2 * idx__8732 + 1, cljs.core.create_node.call(null, shift + 5, key_or_nil__8739, val_or_node__8740, hash, key, val)))
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8742 = this;
  var inode__8743 = this;
  var bit__8744 = 1 << (hash >>> shift & 31);
  if((this__8742.bitmap & bit__8744) === 0) {
    return not_found
  }else {
    var idx__8745 = cljs.core.bitmap_indexed_node_index.call(null, this__8742.bitmap, bit__8744);
    var key_or_nil__8746 = this__8742.arr[2 * idx__8745];
    var val_or_node__8747 = this__8742.arr[2 * idx__8745 + 1];
    if(key_or_nil__8746 == null) {
      return val_or_node__8747.inode_lookup(shift + 5, hash, key, not_found)
    }else {
      if(cljs.core.key_test.call(null, key, key_or_nil__8746)) {
        return val_or_node__8747
      }else {
        if("\ufdd0'else") {
          return not_found
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.BitmapIndexedNode;
cljs.core.BitmapIndexedNode.EMPTY = new cljs.core.BitmapIndexedNode(null, 0, cljs.core.make_array.call(null, 0));
cljs.core.pack_array_node = function pack_array_node(array_node, edit, idx) {
  var arr__8763 = array_node.arr;
  var len__8764 = 2 * (array_node.cnt - 1);
  var new_arr__8765 = cljs.core.make_array.call(null, len__8764);
  var i__8766 = 0;
  var j__8767 = 1;
  var bitmap__8768 = 0;
  while(true) {
    if(i__8766 < len__8764) {
      if(function() {
        var and__3941__auto____8769 = !(i__8766 === idx);
        if(and__3941__auto____8769) {
          return!(arr__8763[i__8766] == null)
        }else {
          return and__3941__auto____8769
        }
      }()) {
        new_arr__8765[j__8767] = arr__8763[i__8766];
        var G__8770 = i__8766 + 1;
        var G__8771 = j__8767 + 2;
        var G__8772 = bitmap__8768 | 1 << i__8766;
        i__8766 = G__8770;
        j__8767 = G__8771;
        bitmap__8768 = G__8772;
        continue
      }else {
        var G__8773 = i__8766 + 1;
        var G__8774 = j__8767;
        var G__8775 = bitmap__8768;
        i__8766 = G__8773;
        j__8767 = G__8774;
        bitmap__8768 = G__8775;
        continue
      }
    }else {
      return new cljs.core.BitmapIndexedNode(edit, bitmap__8768, new_arr__8765)
    }
    break
  }
};
cljs.core.ArrayNode = function(edit, cnt, arr) {
  this.edit = edit;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.ArrayNode.cljs$lang$type = true;
cljs.core.ArrayNode.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNode")
};
cljs.core.ArrayNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8776 = this;
  var inode__8777 = this;
  var idx__8778 = hash >>> shift & 31;
  var node__8779 = this__8776.arr[idx__8778];
  if(node__8779 == null) {
    var editable__8780 = cljs.core.edit_and_set.call(null, inode__8777, edit, idx__8778, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_));
    editable__8780.cnt = editable__8780.cnt + 1;
    return editable__8780
  }else {
    var n__8781 = node__8779.inode_assoc_BANG_(edit, shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8781 === node__8779) {
      return inode__8777
    }else {
      return cljs.core.edit_and_set.call(null, inode__8777, edit, idx__8778, n__8781)
    }
  }
};
cljs.core.ArrayNode.prototype.inode_seq = function() {
  var this__8782 = this;
  var inode__8783 = this;
  return cljs.core.create_array_node_seq.call(null, this__8782.arr)
};
cljs.core.ArrayNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8784 = this;
  var inode__8785 = this;
  var idx__8786 = hash >>> shift & 31;
  var node__8787 = this__8784.arr[idx__8786];
  if(node__8787 == null) {
    return inode__8785
  }else {
    var n__8788 = node__8787.inode_without_BANG_(edit, shift + 5, hash, key, removed_leaf_QMARK_);
    if(n__8788 === node__8787) {
      return inode__8785
    }else {
      if(n__8788 == null) {
        if(this__8784.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8785, edit, idx__8786)
        }else {
          var editable__8789 = cljs.core.edit_and_set.call(null, inode__8785, edit, idx__8786, n__8788);
          editable__8789.cnt = editable__8789.cnt - 1;
          return editable__8789
        }
      }else {
        if("\ufdd0'else") {
          return cljs.core.edit_and_set.call(null, inode__8785, edit, idx__8786, n__8788)
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.ArrayNode.prototype.ensure_editable = function(e) {
  var this__8790 = this;
  var inode__8791 = this;
  if(e === this__8790.edit) {
    return inode__8791
  }else {
    return new cljs.core.ArrayNode(e, this__8790.cnt, this__8790.arr.slice())
  }
};
cljs.core.ArrayNode.prototype.kv_reduce = function(f, init) {
  var this__8792 = this;
  var inode__8793 = this;
  var len__8794 = this__8792.arr.length;
  var i__8795 = 0;
  var init__8796 = init;
  while(true) {
    if(i__8795 < len__8794) {
      var node__8797 = this__8792.arr[i__8795];
      if(!(node__8797 == null)) {
        var init__8798 = node__8797.kv_reduce(f, init__8796);
        if(cljs.core.reduced_QMARK_.call(null, init__8798)) {
          return cljs.core.deref.call(null, init__8798)
        }else {
          var G__8817 = i__8795 + 1;
          var G__8818 = init__8798;
          i__8795 = G__8817;
          init__8796 = G__8818;
          continue
        }
      }else {
        return null
      }
    }else {
      return init__8796
    }
    break
  }
};
cljs.core.ArrayNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8799 = this;
  var inode__8800 = this;
  var idx__8801 = hash >>> shift & 31;
  var node__8802 = this__8799.arr[idx__8801];
  if(!(node__8802 == null)) {
    return node__8802.inode_find(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode.prototype.inode_without = function(shift, hash, key) {
  var this__8803 = this;
  var inode__8804 = this;
  var idx__8805 = hash >>> shift & 31;
  var node__8806 = this__8803.arr[idx__8805];
  if(!(node__8806 == null)) {
    var n__8807 = node__8806.inode_without(shift + 5, hash, key);
    if(n__8807 === node__8806) {
      return inode__8804
    }else {
      if(n__8807 == null) {
        if(this__8803.cnt <= 8) {
          return cljs.core.pack_array_node.call(null, inode__8804, null, idx__8805)
        }else {
          return new cljs.core.ArrayNode(null, this__8803.cnt - 1, cljs.core.clone_and_set.call(null, this__8803.arr, idx__8805, n__8807))
        }
      }else {
        if("\ufdd0'else") {
          return new cljs.core.ArrayNode(null, this__8803.cnt, cljs.core.clone_and_set.call(null, this__8803.arr, idx__8805, n__8807))
        }else {
          return null
        }
      }
    }
  }else {
    return inode__8804
  }
};
cljs.core.ArrayNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8808 = this;
  var inode__8809 = this;
  var idx__8810 = hash >>> shift & 31;
  var node__8811 = this__8808.arr[idx__8810];
  if(node__8811 == null) {
    return new cljs.core.ArrayNode(null, this__8808.cnt + 1, cljs.core.clone_and_set.call(null, this__8808.arr, idx__8810, cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_)))
  }else {
    var n__8812 = node__8811.inode_assoc(shift + 5, hash, key, val, added_leaf_QMARK_);
    if(n__8812 === node__8811) {
      return inode__8809
    }else {
      return new cljs.core.ArrayNode(null, this__8808.cnt, cljs.core.clone_and_set.call(null, this__8808.arr, idx__8810, n__8812))
    }
  }
};
cljs.core.ArrayNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8813 = this;
  var inode__8814 = this;
  var idx__8815 = hash >>> shift & 31;
  var node__8816 = this__8813.arr[idx__8815];
  if(!(node__8816 == null)) {
    return node__8816.inode_lookup(shift + 5, hash, key, not_found)
  }else {
    return not_found
  }
};
cljs.core.ArrayNode;
cljs.core.hash_collision_node_find_index = function hash_collision_node_find_index(arr, cnt, key) {
  var lim__8821 = 2 * cnt;
  var i__8822 = 0;
  while(true) {
    if(i__8822 < lim__8821) {
      if(cljs.core.key_test.call(null, key, arr[i__8822])) {
        return i__8822
      }else {
        var G__8823 = i__8822 + 2;
        i__8822 = G__8823;
        continue
      }
    }else {
      return-1
    }
    break
  }
};
cljs.core.HashCollisionNode = function(edit, collision_hash, cnt, arr) {
  this.edit = edit;
  this.collision_hash = collision_hash;
  this.cnt = cnt;
  this.arr = arr
};
cljs.core.HashCollisionNode.cljs$lang$type = true;
cljs.core.HashCollisionNode.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/HashCollisionNode")
};
cljs.core.HashCollisionNode.prototype.inode_assoc_BANG_ = function(edit, shift, hash, key, val, added_leaf_QMARK_) {
  var this__8824 = this;
  var inode__8825 = this;
  if(hash === this__8824.collision_hash) {
    var idx__8826 = cljs.core.hash_collision_node_find_index.call(null, this__8824.arr, this__8824.cnt, key);
    if(idx__8826 === -1) {
      if(this__8824.arr.length > 2 * this__8824.cnt) {
        var editable__8827 = cljs.core.edit_and_set.call(null, inode__8825, edit, 2 * this__8824.cnt, key, 2 * this__8824.cnt + 1, val);
        added_leaf_QMARK_.val = true;
        editable__8827.cnt = editable__8827.cnt + 1;
        return editable__8827
      }else {
        var len__8828 = this__8824.arr.length;
        var new_arr__8829 = cljs.core.make_array.call(null, len__8828 + 2);
        cljs.core.array_copy.call(null, this__8824.arr, 0, new_arr__8829, 0, len__8828);
        new_arr__8829[len__8828] = key;
        new_arr__8829[len__8828 + 1] = val;
        added_leaf_QMARK_.val = true;
        return inode__8825.ensure_editable_array(edit, this__8824.cnt + 1, new_arr__8829)
      }
    }else {
      if(this__8824.arr[idx__8826 + 1] === val) {
        return inode__8825
      }else {
        return cljs.core.edit_and_set.call(null, inode__8825, edit, idx__8826 + 1, val)
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(edit, 1 << (this__8824.collision_hash >>> shift & 31), [null, inode__8825, null, null])).inode_assoc_BANG_(edit, shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_seq = function() {
  var this__8830 = this;
  var inode__8831 = this;
  return cljs.core.create_inode_seq.call(null, this__8830.arr)
};
cljs.core.HashCollisionNode.prototype.inode_without_BANG_ = function(edit, shift, hash, key, removed_leaf_QMARK_) {
  var this__8832 = this;
  var inode__8833 = this;
  var idx__8834 = cljs.core.hash_collision_node_find_index.call(null, this__8832.arr, this__8832.cnt, key);
  if(idx__8834 === -1) {
    return inode__8833
  }else {
    removed_leaf_QMARK_[0] = true;
    if(this__8832.cnt === 1) {
      return null
    }else {
      var editable__8835 = inode__8833.ensure_editable(edit);
      var earr__8836 = editable__8835.arr;
      earr__8836[idx__8834] = earr__8836[2 * this__8832.cnt - 2];
      earr__8836[idx__8834 + 1] = earr__8836[2 * this__8832.cnt - 1];
      earr__8836[2 * this__8832.cnt - 1] = null;
      earr__8836[2 * this__8832.cnt - 2] = null;
      editable__8835.cnt = editable__8835.cnt - 1;
      return editable__8835
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable = function(e) {
  var this__8837 = this;
  var inode__8838 = this;
  if(e === this__8837.edit) {
    return inode__8838
  }else {
    var new_arr__8839 = cljs.core.make_array.call(null, 2 * (this__8837.cnt + 1));
    cljs.core.array_copy.call(null, this__8837.arr, 0, new_arr__8839, 0, 2 * this__8837.cnt);
    return new cljs.core.HashCollisionNode(e, this__8837.collision_hash, this__8837.cnt, new_arr__8839)
  }
};
cljs.core.HashCollisionNode.prototype.kv_reduce = function(f, init) {
  var this__8840 = this;
  var inode__8841 = this;
  return cljs.core.inode_kv_reduce.call(null, this__8840.arr, f, init)
};
cljs.core.HashCollisionNode.prototype.inode_find = function(shift, hash, key, not_found) {
  var this__8842 = this;
  var inode__8843 = this;
  var idx__8844 = cljs.core.hash_collision_node_find_index.call(null, this__8842.arr, this__8842.cnt, key);
  if(idx__8844 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8842.arr[idx__8844])) {
      return cljs.core.PersistentVector.fromArray([this__8842.arr[idx__8844], this__8842.arr[idx__8844 + 1]], true)
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_without = function(shift, hash, key) {
  var this__8845 = this;
  var inode__8846 = this;
  var idx__8847 = cljs.core.hash_collision_node_find_index.call(null, this__8845.arr, this__8845.cnt, key);
  if(idx__8847 === -1) {
    return inode__8846
  }else {
    if(this__8845.cnt === 1) {
      return null
    }else {
      if("\ufdd0'else") {
        return new cljs.core.HashCollisionNode(null, this__8845.collision_hash, this__8845.cnt - 1, cljs.core.remove_pair.call(null, this__8845.arr, cljs.core.quot.call(null, idx__8847, 2)))
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.inode_assoc = function(shift, hash, key, val, added_leaf_QMARK_) {
  var this__8848 = this;
  var inode__8849 = this;
  if(hash === this__8848.collision_hash) {
    var idx__8850 = cljs.core.hash_collision_node_find_index.call(null, this__8848.arr, this__8848.cnt, key);
    if(idx__8850 === -1) {
      var len__8851 = this__8848.arr.length;
      var new_arr__8852 = cljs.core.make_array.call(null, len__8851 + 2);
      cljs.core.array_copy.call(null, this__8848.arr, 0, new_arr__8852, 0, len__8851);
      new_arr__8852[len__8851] = key;
      new_arr__8852[len__8851 + 1] = val;
      added_leaf_QMARK_.val = true;
      return new cljs.core.HashCollisionNode(null, this__8848.collision_hash, this__8848.cnt + 1, new_arr__8852)
    }else {
      if(cljs.core._EQ_.call(null, this__8848.arr[idx__8850], val)) {
        return inode__8849
      }else {
        return new cljs.core.HashCollisionNode(null, this__8848.collision_hash, this__8848.cnt, cljs.core.clone_and_set.call(null, this__8848.arr, idx__8850 + 1, val))
      }
    }
  }else {
    return(new cljs.core.BitmapIndexedNode(null, 1 << (this__8848.collision_hash >>> shift & 31), [null, inode__8849])).inode_assoc(shift, hash, key, val, added_leaf_QMARK_)
  }
};
cljs.core.HashCollisionNode.prototype.inode_lookup = function(shift, hash, key, not_found) {
  var this__8853 = this;
  var inode__8854 = this;
  var idx__8855 = cljs.core.hash_collision_node_find_index.call(null, this__8853.arr, this__8853.cnt, key);
  if(idx__8855 < 0) {
    return not_found
  }else {
    if(cljs.core.key_test.call(null, key, this__8853.arr[idx__8855])) {
      return this__8853.arr[idx__8855 + 1]
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.HashCollisionNode.prototype.ensure_editable_array = function(e, count, array) {
  var this__8856 = this;
  var inode__8857 = this;
  if(e === this__8856.edit) {
    this__8856.arr = array;
    this__8856.cnt = count;
    return inode__8857
  }else {
    return new cljs.core.HashCollisionNode(this__8856.edit, this__8856.collision_hash, count, array)
  }
};
cljs.core.HashCollisionNode;
cljs.core.create_node = function() {
  var create_node = null;
  var create_node__6 = function(shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8862 = cljs.core.hash.call(null, key1);
    if(key1hash__8862 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8862, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8863 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc(shift, key1hash__8862, key1, val1, added_leaf_QMARK___8863).inode_assoc(shift, key2hash, key2, val2, added_leaf_QMARK___8863)
    }
  };
  var create_node__7 = function(edit, shift, key1, val1, key2hash, key2, val2) {
    var key1hash__8864 = cljs.core.hash.call(null, key1);
    if(key1hash__8864 === key2hash) {
      return new cljs.core.HashCollisionNode(null, key1hash__8864, 2, [key1, val1, key2, val2])
    }else {
      var added_leaf_QMARK___8865 = new cljs.core.Box(false);
      return cljs.core.BitmapIndexedNode.EMPTY.inode_assoc_BANG_(edit, shift, key1hash__8864, key1, val1, added_leaf_QMARK___8865).inode_assoc_BANG_(edit, shift, key2hash, key2, val2, added_leaf_QMARK___8865)
    }
  };
  create_node = function(edit, shift, key1, val1, key2hash, key2, val2) {
    switch(arguments.length) {
      case 6:
        return create_node__6.call(this, edit, shift, key1, val1, key2hash, key2);
      case 7:
        return create_node__7.call(this, edit, shift, key1, val1, key2hash, key2, val2)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_node.cljs$lang$arity$6 = create_node__6;
  create_node.cljs$lang$arity$7 = create_node__7;
  return create_node
}();
cljs.core.NodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.NodeSeq.cljs$lang$type = true;
cljs.core.NodeSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/NodeSeq")
};
cljs.core.NodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8866 = this;
  var h__2141__auto____8867 = this__8866.__hash;
  if(!(h__2141__auto____8867 == null)) {
    return h__2141__auto____8867
  }else {
    var h__2141__auto____8868 = cljs.core.hash_coll.call(null, coll);
    this__8866.__hash = h__2141__auto____8868;
    return h__2141__auto____8868
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8869 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.NodeSeq.prototype.toString = function() {
  var this__8870 = this;
  var this__8871 = this;
  return cljs.core.pr_str.call(null, this__8871)
};
cljs.core.NodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8872 = this;
  return this$
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8873 = this;
  if(this__8873.s == null) {
    return cljs.core.PersistentVector.fromArray([this__8873.nodes[this__8873.i], this__8873.nodes[this__8873.i + 1]], true)
  }else {
    return cljs.core.first.call(null, this__8873.s)
  }
};
cljs.core.NodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8874 = this;
  if(this__8874.s == null) {
    return cljs.core.create_inode_seq.call(null, this__8874.nodes, this__8874.i + 2, null)
  }else {
    return cljs.core.create_inode_seq.call(null, this__8874.nodes, this__8874.i, cljs.core.next.call(null, this__8874.s))
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8875 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.NodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8876 = this;
  return new cljs.core.NodeSeq(meta, this__8876.nodes, this__8876.i, this__8876.s, this__8876.__hash)
};
cljs.core.NodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8877 = this;
  return this__8877.meta
};
cljs.core.NodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8878 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8878.meta)
};
cljs.core.NodeSeq;
cljs.core.create_inode_seq = function() {
  var create_inode_seq = null;
  var create_inode_seq__1 = function(nodes) {
    return create_inode_seq.call(null, nodes, 0, null)
  };
  var create_inode_seq__3 = function(nodes, i, s) {
    if(s == null) {
      var len__8885 = nodes.length;
      var j__8886 = i;
      while(true) {
        if(j__8886 < len__8885) {
          if(!(nodes[j__8886] == null)) {
            return new cljs.core.NodeSeq(null, nodes, j__8886, null, null)
          }else {
            var temp__4090__auto____8887 = nodes[j__8886 + 1];
            if(cljs.core.truth_(temp__4090__auto____8887)) {
              var node__8888 = temp__4090__auto____8887;
              var temp__4090__auto____8889 = node__8888.inode_seq();
              if(cljs.core.truth_(temp__4090__auto____8889)) {
                var node_seq__8890 = temp__4090__auto____8889;
                return new cljs.core.NodeSeq(null, nodes, j__8886 + 2, node_seq__8890, null)
              }else {
                var G__8891 = j__8886 + 2;
                j__8886 = G__8891;
                continue
              }
            }else {
              var G__8892 = j__8886 + 2;
              j__8886 = G__8892;
              continue
            }
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.NodeSeq(null, nodes, i, s, null)
    }
  };
  create_inode_seq = function(nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_inode_seq__1.call(this, nodes);
      case 3:
        return create_inode_seq__3.call(this, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_inode_seq.cljs$lang$arity$1 = create_inode_seq__1;
  create_inode_seq.cljs$lang$arity$3 = create_inode_seq__3;
  return create_inode_seq
}();
cljs.core.ArrayNodeSeq = function(meta, nodes, i, s, __hash) {
  this.meta = meta;
  this.nodes = nodes;
  this.i = i;
  this.s = s;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850572
};
cljs.core.ArrayNodeSeq.cljs$lang$type = true;
cljs.core.ArrayNodeSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/ArrayNodeSeq")
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8893 = this;
  var h__2141__auto____8894 = this__8893.__hash;
  if(!(h__2141__auto____8894 == null)) {
    return h__2141__auto____8894
  }else {
    var h__2141__auto____8895 = cljs.core.hash_coll.call(null, coll);
    this__8893.__hash = h__2141__auto____8895;
    return h__2141__auto____8895
  }
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8896 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.ArrayNodeSeq.prototype.toString = function() {
  var this__8897 = this;
  var this__8898 = this;
  return cljs.core.pr_str.call(null, this__8898)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__8899 = this;
  return this$
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(coll) {
  var this__8900 = this;
  return cljs.core.first.call(null, this__8900.s)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(coll) {
  var this__8901 = this;
  return cljs.core.create_array_node_seq.call(null, null, this__8901.nodes, this__8901.i, cljs.core.next.call(null, this__8901.s))
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8902 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8903 = this;
  return new cljs.core.ArrayNodeSeq(meta, this__8903.nodes, this__8903.i, this__8903.s, this__8903.__hash)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8904 = this;
  return this__8904.meta
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8905 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__8905.meta)
};
cljs.core.ArrayNodeSeq;
cljs.core.create_array_node_seq = function() {
  var create_array_node_seq = null;
  var create_array_node_seq__1 = function(nodes) {
    return create_array_node_seq.call(null, null, nodes, 0, null)
  };
  var create_array_node_seq__4 = function(meta, nodes, i, s) {
    if(s == null) {
      var len__8912 = nodes.length;
      var j__8913 = i;
      while(true) {
        if(j__8913 < len__8912) {
          var temp__4090__auto____8914 = nodes[j__8913];
          if(cljs.core.truth_(temp__4090__auto____8914)) {
            var nj__8915 = temp__4090__auto____8914;
            var temp__4090__auto____8916 = nj__8915.inode_seq();
            if(cljs.core.truth_(temp__4090__auto____8916)) {
              var ns__8917 = temp__4090__auto____8916;
              return new cljs.core.ArrayNodeSeq(meta, nodes, j__8913 + 1, ns__8917, null)
            }else {
              var G__8918 = j__8913 + 1;
              j__8913 = G__8918;
              continue
            }
          }else {
            var G__8919 = j__8913 + 1;
            j__8913 = G__8919;
            continue
          }
        }else {
          return null
        }
        break
      }
    }else {
      return new cljs.core.ArrayNodeSeq(meta, nodes, i, s, null)
    }
  };
  create_array_node_seq = function(meta, nodes, i, s) {
    switch(arguments.length) {
      case 1:
        return create_array_node_seq__1.call(this, meta);
      case 4:
        return create_array_node_seq__4.call(this, meta, nodes, i, s)
    }
    throw"Invalid arity: " + arguments.length;
  };
  create_array_node_seq.cljs$lang$arity$1 = create_array_node_seq__1;
  create_array_node_seq.cljs$lang$arity$4 = create_array_node_seq__4;
  return create_array_node_seq
}();
cljs.core.PersistentHashMap = function(meta, cnt, root, has_nil_QMARK_, nil_val, __hash) {
  this.meta = meta;
  this.cnt = cnt;
  this.root = root;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 16123663
};
cljs.core.PersistentHashMap.cljs$lang$type = true;
cljs.core.PersistentHashMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashMap")
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__8922 = this;
  return new cljs.core.TransientHashMap({}, this__8922.root, this__8922.cnt, this__8922.has_nil_QMARK_, this__8922.nil_val)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8923 = this;
  var h__2141__auto____8924 = this__8923.__hash;
  if(!(h__2141__auto____8924 == null)) {
    return h__2141__auto____8924
  }else {
    var h__2141__auto____8925 = cljs.core.hash_imap.call(null, coll);
    this__8923.__hash = h__2141__auto____8925;
    return h__2141__auto____8925
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__8926 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__8927 = this;
  if(k == null) {
    if(this__8927.has_nil_QMARK_) {
      return this__8927.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8927.root == null) {
      return not_found
    }else {
      if("\ufdd0'else") {
        return this__8927.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__8928 = this;
  if(k == null) {
    if(function() {
      var and__3941__auto____8929 = this__8928.has_nil_QMARK_;
      if(and__3941__auto____8929) {
        return v === this__8928.nil_val
      }else {
        return and__3941__auto____8929
      }
    }()) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8928.meta, this__8928.has_nil_QMARK_ ? this__8928.cnt : this__8928.cnt + 1, this__8928.root, true, v, null)
    }
  }else {
    var added_leaf_QMARK___8930 = new cljs.core.Box(false);
    var new_root__8931 = (this__8928.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8928.root).inode_assoc(0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8930);
    if(new_root__8931 === this__8928.root) {
      return coll
    }else {
      return new cljs.core.PersistentHashMap(this__8928.meta, added_leaf_QMARK___8930.val ? this__8928.cnt + 1 : this__8928.cnt, new_root__8931, this__8928.has_nil_QMARK_, this__8928.nil_val, null)
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__8932 = this;
  if(k == null) {
    return this__8932.has_nil_QMARK_
  }else {
    if(this__8932.root == null) {
      return false
    }else {
      if("\ufdd0'else") {
        return!(this__8932.root.inode_lookup(0, cljs.core.hash.call(null, k), k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel)
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.call = function() {
  var G__8955 = null;
  var G__8955__2 = function(this_sym8933, k) {
    var this__8935 = this;
    var this_sym8933__8936 = this;
    var coll__8937 = this_sym8933__8936;
    return coll__8937.cljs$core$ILookup$_lookup$arity$2(coll__8937, k)
  };
  var G__8955__3 = function(this_sym8934, k, not_found) {
    var this__8935 = this;
    var this_sym8934__8938 = this;
    var coll__8939 = this_sym8934__8938;
    return coll__8939.cljs$core$ILookup$_lookup$arity$3(coll__8939, k, not_found)
  };
  G__8955 = function(this_sym8934, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__8955__2.call(this, this_sym8934, k);
      case 3:
        return G__8955__3.call(this, this_sym8934, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__8955
}();
cljs.core.PersistentHashMap.prototype.apply = function(this_sym8920, args8921) {
  var this__8940 = this;
  return this_sym8920.call.apply(this_sym8920, [this_sym8920].concat(args8921.slice()))
};
cljs.core.PersistentHashMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__8941 = this;
  var init__8942 = this__8941.has_nil_QMARK_ ? f.call(null, init, null, this__8941.nil_val) : init;
  if(cljs.core.reduced_QMARK_.call(null, init__8942)) {
    return cljs.core.deref.call(null, init__8942)
  }else {
    if(!(this__8941.root == null)) {
      return this__8941.root.kv_reduce(f, init__8942)
    }else {
      if("\ufdd0'else") {
        return init__8942
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__8943 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentHashMap.prototype.toString = function() {
  var this__8944 = this;
  var this__8945 = this;
  return cljs.core.pr_str.call(null, this__8945)
};
cljs.core.PersistentHashMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__8946 = this;
  if(this__8946.cnt > 0) {
    var s__8947 = !(this__8946.root == null) ? this__8946.root.inode_seq() : null;
    if(this__8946.has_nil_QMARK_) {
      return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([null, this__8946.nil_val], true), s__8947)
    }else {
      return s__8947
    }
  }else {
    return null
  }
};
cljs.core.PersistentHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8948 = this;
  return this__8948.cnt
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__8949 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__8950 = this;
  return new cljs.core.PersistentHashMap(meta, this__8950.cnt, this__8950.root, this__8950.has_nil_QMARK_, this__8950.nil_val, this__8950.__hash)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__8951 = this;
  return this__8951.meta
};
cljs.core.PersistentHashMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__8952 = this;
  return cljs.core._with_meta.call(null, cljs.core.PersistentHashMap.EMPTY, this__8952.meta)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__8953 = this;
  if(k == null) {
    if(this__8953.has_nil_QMARK_) {
      return new cljs.core.PersistentHashMap(this__8953.meta, this__8953.cnt - 1, this__8953.root, false, null, null)
    }else {
      return coll
    }
  }else {
    if(this__8953.root == null) {
      return coll
    }else {
      if("\ufdd0'else") {
        var new_root__8954 = this__8953.root.inode_without(0, cljs.core.hash.call(null, k), k);
        if(new_root__8954 === this__8953.root) {
          return coll
        }else {
          return new cljs.core.PersistentHashMap(this__8953.meta, this__8953.cnt - 1, new_root__8954, this__8953.has_nil_QMARK_, this__8953.nil_val, null)
        }
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentHashMap;
cljs.core.PersistentHashMap.EMPTY = new cljs.core.PersistentHashMap(null, 0, null, false, null, 0);
cljs.core.PersistentHashMap.fromArrays = function(ks, vs) {
  var len__8956 = ks.length;
  var i__8957 = 0;
  var out__8958 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
  while(true) {
    if(i__8957 < len__8956) {
      var G__8959 = i__8957 + 1;
      var G__8960 = cljs.core.assoc_BANG_.call(null, out__8958, ks[i__8957], vs[i__8957]);
      i__8957 = G__8959;
      out__8958 = G__8960;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__8958)
    }
    break
  }
};
cljs.core.TransientHashMap = function(edit, root, count, has_nil_QMARK_, nil_val) {
  this.edit = edit;
  this.root = root;
  this.count = count;
  this.has_nil_QMARK_ = has_nil_QMARK_;
  this.nil_val = nil_val;
  this.cljs$lang$protocol_mask$partition1$ = 14;
  this.cljs$lang$protocol_mask$partition0$ = 258
};
cljs.core.TransientHashMap.cljs$lang$type = true;
cljs.core.TransientHashMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashMap")
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientMap$_dissoc_BANG_$arity$2 = function(tcoll, key) {
  var this__8961 = this;
  return tcoll.without_BANG_(key)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientAssociative$_assoc_BANG_$arity$3 = function(tcoll, key, val) {
  var this__8962 = this;
  return tcoll.assoc_BANG_(key, val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, val) {
  var this__8963 = this;
  return tcoll.conj_BANG_(val)
};
cljs.core.TransientHashMap.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__8964 = this;
  return tcoll.persistent_BANG_()
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, k) {
  var this__8965 = this;
  if(k == null) {
    if(this__8965.has_nil_QMARK_) {
      return this__8965.nil_val
    }else {
      return null
    }
  }else {
    if(this__8965.root == null) {
      return null
    }else {
      return this__8965.root.inode_lookup(0, cljs.core.hash.call(null, k), k)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, k, not_found) {
  var this__8966 = this;
  if(k == null) {
    if(this__8966.has_nil_QMARK_) {
      return this__8966.nil_val
    }else {
      return not_found
    }
  }else {
    if(this__8966.root == null) {
      return not_found
    }else {
      return this__8966.root.inode_lookup(0, cljs.core.hash.call(null, k), k, not_found)
    }
  }
};
cljs.core.TransientHashMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__8967 = this;
  if(this__8967.edit) {
    return this__8967.count
  }else {
    throw new Error("count after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.conj_BANG_ = function(o) {
  var this__8968 = this;
  var tcoll__8969 = this;
  if(this__8968.edit) {
    if(function() {
      var G__8970__8971 = o;
      if(G__8970__8971) {
        if(function() {
          var or__3943__auto____8972 = G__8970__8971.cljs$lang$protocol_mask$partition0$ & 2048;
          if(or__3943__auto____8972) {
            return or__3943__auto____8972
          }else {
            return G__8970__8971.cljs$core$IMapEntry$
          }
        }()) {
          return true
        }else {
          if(!G__8970__8971.cljs$lang$protocol_mask$partition0$) {
            return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8970__8971)
          }else {
            return false
          }
        }
      }else {
        return cljs.core.type_satisfies_.call(null, cljs.core.IMapEntry, G__8970__8971)
      }
    }()) {
      return tcoll__8969.assoc_BANG_(cljs.core.key.call(null, o), cljs.core.val.call(null, o))
    }else {
      var es__8973 = cljs.core.seq.call(null, o);
      var tcoll__8974 = tcoll__8969;
      while(true) {
        var temp__4090__auto____8975 = cljs.core.first.call(null, es__8973);
        if(cljs.core.truth_(temp__4090__auto____8975)) {
          var e__8976 = temp__4090__auto____8975;
          var G__8987 = cljs.core.next.call(null, es__8973);
          var G__8988 = tcoll__8974.assoc_BANG_(cljs.core.key.call(null, e__8976), cljs.core.val.call(null, e__8976));
          es__8973 = G__8987;
          tcoll__8974 = G__8988;
          continue
        }else {
          return tcoll__8974
        }
        break
      }
    }
  }else {
    throw new Error("conj! after persistent");
  }
};
cljs.core.TransientHashMap.prototype.assoc_BANG_ = function(k, v) {
  var this__8977 = this;
  var tcoll__8978 = this;
  if(this__8977.edit) {
    if(k == null) {
      if(this__8977.nil_val === v) {
      }else {
        this__8977.nil_val = v
      }
      if(this__8977.has_nil_QMARK_) {
      }else {
        this__8977.count = this__8977.count + 1;
        this__8977.has_nil_QMARK_ = true
      }
      return tcoll__8978
    }else {
      var added_leaf_QMARK___8979 = new cljs.core.Box(false);
      var node__8980 = (this__8977.root == null ? cljs.core.BitmapIndexedNode.EMPTY : this__8977.root).inode_assoc_BANG_(this__8977.edit, 0, cljs.core.hash.call(null, k), k, v, added_leaf_QMARK___8979);
      if(node__8980 === this__8977.root) {
      }else {
        this__8977.root = node__8980
      }
      if(added_leaf_QMARK___8979.val) {
        this__8977.count = this__8977.count + 1
      }else {
      }
      return tcoll__8978
    }
  }else {
    throw new Error("assoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.without_BANG_ = function(k) {
  var this__8981 = this;
  var tcoll__8982 = this;
  if(this__8981.edit) {
    if(k == null) {
      if(this__8981.has_nil_QMARK_) {
        this__8981.has_nil_QMARK_ = false;
        this__8981.nil_val = null;
        this__8981.count = this__8981.count - 1;
        return tcoll__8982
      }else {
        return tcoll__8982
      }
    }else {
      if(this__8981.root == null) {
        return tcoll__8982
      }else {
        var removed_leaf_QMARK___8983 = new cljs.core.Box(false);
        var node__8984 = this__8981.root.inode_without_BANG_(this__8981.edit, 0, cljs.core.hash.call(null, k), k, removed_leaf_QMARK___8983);
        if(node__8984 === this__8981.root) {
        }else {
          this__8981.root = node__8984
        }
        if(cljs.core.truth_(removed_leaf_QMARK___8983[0])) {
          this__8981.count = this__8981.count - 1
        }else {
        }
        return tcoll__8982
      }
    }
  }else {
    throw new Error("dissoc! after persistent!");
  }
};
cljs.core.TransientHashMap.prototype.persistent_BANG_ = function() {
  var this__8985 = this;
  var tcoll__8986 = this;
  if(this__8985.edit) {
    this__8985.edit = null;
    return new cljs.core.PersistentHashMap(null, this__8985.count, this__8985.root, this__8985.has_nil_QMARK_, this__8985.nil_val, null)
  }else {
    throw new Error("persistent! called twice");
  }
};
cljs.core.TransientHashMap;
cljs.core.tree_map_seq_push = function tree_map_seq_push(node, stack, ascending_QMARK_) {
  var t__8991 = node;
  var stack__8992 = stack;
  while(true) {
    if(!(t__8991 == null)) {
      var G__8993 = ascending_QMARK_ ? t__8991.left : t__8991.right;
      var G__8994 = cljs.core.conj.call(null, stack__8992, t__8991);
      t__8991 = G__8993;
      stack__8992 = G__8994;
      continue
    }else {
      return stack__8992
    }
    break
  }
};
cljs.core.PersistentTreeMapSeq = function(meta, stack, ascending_QMARK_, cnt, __hash) {
  this.meta = meta;
  this.stack = stack;
  this.ascending_QMARK_ = ascending_QMARK_;
  this.cnt = cnt;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 31850570
};
cljs.core.PersistentTreeMapSeq.cljs$lang$type = true;
cljs.core.PersistentTreeMapSeq.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMapSeq")
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__8995 = this;
  var h__2141__auto____8996 = this__8995.__hash;
  if(!(h__2141__auto____8996 == null)) {
    return h__2141__auto____8996
  }else {
    var h__2141__auto____8997 = cljs.core.hash_coll.call(null, coll);
    this__8995.__hash = h__2141__auto____8997;
    return h__2141__auto____8997
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__8998 = this;
  return cljs.core.cons.call(null, o, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.toString = function() {
  var this__8999 = this;
  var this__9000 = this;
  return cljs.core.pr_str.call(null, this__9000)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeqable$_seq$arity$1 = function(this$) {
  var this__9001 = this;
  return this$
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9002 = this;
  if(this__9002.cnt < 0) {
    return cljs.core.count.call(null, cljs.core.next.call(null, coll)) + 1
  }else {
    return this__9002.cnt
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_first$arity$1 = function(this$) {
  var this__9003 = this;
  return cljs.core.peek.call(null, this__9003.stack)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$ISeq$_rest$arity$1 = function(this$) {
  var this__9004 = this;
  var t__9005 = cljs.core.first.call(null, this__9004.stack);
  var next_stack__9006 = cljs.core.tree_map_seq_push.call(null, this__9004.ascending_QMARK_ ? t__9005.right : t__9005.left, cljs.core.next.call(null, this__9004.stack), this__9004.ascending_QMARK_);
  if(!(next_stack__9006 == null)) {
    return new cljs.core.PersistentTreeMapSeq(null, next_stack__9006, this__9004.ascending_QMARK_, this__9004.cnt - 1, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9007 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9008 = this;
  return new cljs.core.PersistentTreeMapSeq(meta, this__9008.stack, this__9008.ascending_QMARK_, this__9008.cnt, this__9008.__hash)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9009 = this;
  return this__9009.meta
};
cljs.core.PersistentTreeMapSeq;
cljs.core.create_tree_map_seq = function create_tree_map_seq(tree, ascending_QMARK_, cnt) {
  return new cljs.core.PersistentTreeMapSeq(null, cljs.core.tree_map_seq_push.call(null, tree, null, ascending_QMARK_), ascending_QMARK_, cnt, null)
};
cljs.core.balance_left = function balance_left(key, val, ins, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
      return new cljs.core.RedNode(ins.key, ins.val, ins.left.blacken(), new cljs.core.BlackNode(key, val, ins.right, right, null), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
        return new cljs.core.RedNode(ins.right.key, ins.right.val, new cljs.core.BlackNode(ins.key, ins.val, ins.left, ins.right.left, null), new cljs.core.BlackNode(key, val, ins.right.right, right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, ins, right, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, ins, right, null)
  }
};
cljs.core.balance_right = function balance_right(key, val, left, ins) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins)) {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.right)) {
      return new cljs.core.RedNode(ins.key, ins.val, new cljs.core.BlackNode(key, val, left, ins.left, null), ins.right.blacken(), null)
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, ins.left)) {
        return new cljs.core.RedNode(ins.left.key, ins.left.val, new cljs.core.BlackNode(key, val, left, ins.left.left, null), new cljs.core.BlackNode(ins.key, ins.val, ins.left.right, ins.right, null), null)
      }else {
        if("\ufdd0'else") {
          return new cljs.core.BlackNode(key, val, left, ins, null)
        }else {
          return null
        }
      }
    }
  }else {
    return new cljs.core.BlackNode(key, val, left, ins, null)
  }
};
cljs.core.balance_left_del = function balance_left_del(key, val, del, right) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, del.blacken(), right, null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right)) {
      return cljs.core.balance_right.call(null, key, val, del, right.redden())
    }else {
      if(function() {
        var and__3941__auto____9011 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right);
        if(and__3941__auto____9011) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, right.left)
        }else {
          return and__3941__auto____9011
        }
      }()) {
        return new cljs.core.RedNode(right.left.key, right.left.val, new cljs.core.BlackNode(key, val, del, right.left.left, null), cljs.core.balance_right.call(null, right.key, right.val, right.left.right, right.right.redden()), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.balance_right_del = function balance_right_del(key, val, left, del) {
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, del)) {
    return new cljs.core.RedNode(key, val, left, del.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left)) {
      return cljs.core.balance_left.call(null, key, val, left.redden(), del)
    }else {
      if(function() {
        var and__3941__auto____9013 = cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left);
        if(and__3941__auto____9013) {
          return cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, left.right)
        }else {
          return and__3941__auto____9013
        }
      }()) {
        return new cljs.core.RedNode(left.right.key, left.right.val, cljs.core.balance_left.call(null, left.key, left.val, left.left.redden(), left.right.left), new cljs.core.BlackNode(key, val, left.right.right, del, null), null)
      }else {
        if("\ufdd0'else") {
          throw new Error("red-black tree invariant violation");
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_kv_reduce = function tree_map_kv_reduce(node, f, init) {
  var init__9017 = f.call(null, init, node.key, node.val);
  if(cljs.core.reduced_QMARK_.call(null, init__9017)) {
    return cljs.core.deref.call(null, init__9017)
  }else {
    var init__9018 = !(node.left == null) ? tree_map_kv_reduce.call(null, node.left, f, init__9017) : init__9017;
    if(cljs.core.reduced_QMARK_.call(null, init__9018)) {
      return cljs.core.deref.call(null, init__9018)
    }else {
      var init__9019 = !(node.right == null) ? tree_map_kv_reduce.call(null, node.right, f, init__9018) : init__9018;
      if(cljs.core.reduced_QMARK_.call(null, init__9019)) {
        return cljs.core.deref.call(null, init__9019)
      }else {
        return init__9019
      }
    }
  }
};
cljs.core.BlackNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.BlackNode.cljs$lang$type = true;
cljs.core.BlackNode.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/BlackNode")
};
cljs.core.BlackNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9022 = this;
  var h__2141__auto____9023 = this__9022.__hash;
  if(!(h__2141__auto____9023 == null)) {
    return h__2141__auto____9023
  }else {
    var h__2141__auto____9024 = cljs.core.hash_coll.call(null, coll);
    this__9022.__hash = h__2141__auto____9024;
    return h__2141__auto____9024
  }
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9025 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.BlackNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9026 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.BlackNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9027 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9027.key, this__9027.val], true), k, v)
};
cljs.core.BlackNode.prototype.call = function() {
  var G__9075 = null;
  var G__9075__2 = function(this_sym9028, k) {
    var this__9030 = this;
    var this_sym9028__9031 = this;
    var node__9032 = this_sym9028__9031;
    return node__9032.cljs$core$ILookup$_lookup$arity$2(node__9032, k)
  };
  var G__9075__3 = function(this_sym9029, k, not_found) {
    var this__9030 = this;
    var this_sym9029__9033 = this;
    var node__9034 = this_sym9029__9033;
    return node__9034.cljs$core$ILookup$_lookup$arity$3(node__9034, k, not_found)
  };
  G__9075 = function(this_sym9029, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9075__2.call(this, this_sym9029, k);
      case 3:
        return G__9075__3.call(this, this_sym9029, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9075
}();
cljs.core.BlackNode.prototype.apply = function(this_sym9020, args9021) {
  var this__9035 = this;
  return this_sym9020.call.apply(this_sym9020, [this_sym9020].concat(args9021.slice()))
};
cljs.core.BlackNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9036 = this;
  return cljs.core.PersistentVector.fromArray([this__9036.key, this__9036.val, o], true)
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9037 = this;
  return this__9037.key
};
cljs.core.BlackNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9038 = this;
  return this__9038.val
};
cljs.core.BlackNode.prototype.add_right = function(ins) {
  var this__9039 = this;
  var node__9040 = this;
  return ins.balance_right(node__9040)
};
cljs.core.BlackNode.prototype.redden = function() {
  var this__9041 = this;
  var node__9042 = this;
  return new cljs.core.RedNode(this__9041.key, this__9041.val, this__9041.left, this__9041.right, null)
};
cljs.core.BlackNode.prototype.remove_right = function(del) {
  var this__9043 = this;
  var node__9044 = this;
  return cljs.core.balance_right_del.call(null, this__9043.key, this__9043.val, this__9043.left, del)
};
cljs.core.BlackNode.prototype.replace = function(key, val, left, right) {
  var this__9045 = this;
  var node__9046 = this;
  return new cljs.core.BlackNode(key, val, left, right, null)
};
cljs.core.BlackNode.prototype.kv_reduce = function(f, init) {
  var this__9047 = this;
  var node__9048 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9048, f, init)
};
cljs.core.BlackNode.prototype.remove_left = function(del) {
  var this__9049 = this;
  var node__9050 = this;
  return cljs.core.balance_left_del.call(null, this__9049.key, this__9049.val, del, this__9049.right)
};
cljs.core.BlackNode.prototype.add_left = function(ins) {
  var this__9051 = this;
  var node__9052 = this;
  return ins.balance_left(node__9052)
};
cljs.core.BlackNode.prototype.balance_left = function(parent) {
  var this__9053 = this;
  var node__9054 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, node__9054, parent.right, null)
};
cljs.core.BlackNode.prototype.toString = function() {
  var G__9076 = null;
  var G__9076__0 = function() {
    var this__9055 = this;
    var this__9057 = this;
    return cljs.core.pr_str.call(null, this__9057)
  };
  G__9076 = function() {
    switch(arguments.length) {
      case 0:
        return G__9076__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9076
}();
cljs.core.BlackNode.prototype.balance_right = function(parent) {
  var this__9058 = this;
  var node__9059 = this;
  return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9059, null)
};
cljs.core.BlackNode.prototype.blacken = function() {
  var this__9060 = this;
  var node__9061 = this;
  return node__9061
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9062 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.BlackNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9063 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.BlackNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9064 = this;
  return cljs.core.list.call(null, this__9064.key, this__9064.val)
};
cljs.core.BlackNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9065 = this;
  return 2
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9066 = this;
  return this__9066.val
};
cljs.core.BlackNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9067 = this;
  return cljs.core.PersistentVector.fromArray([this__9067.key], true)
};
cljs.core.BlackNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9068 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9068.key, this__9068.val], true), n, v)
};
cljs.core.BlackNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9069 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.BlackNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9070 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9070.key, this__9070.val], true), meta)
};
cljs.core.BlackNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9071 = this;
  return null
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9072 = this;
  if(n === 0) {
    return this__9072.key
  }else {
    if(n === 1) {
      return this__9072.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9073 = this;
  if(n === 0) {
    return this__9073.key
  }else {
    if(n === 1) {
      return this__9073.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.BlackNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9074 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.BlackNode;
cljs.core.RedNode = function(key, val, left, right, __hash) {
  this.key = key;
  this.val = val;
  this.left = left;
  this.right = right;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32402207
};
cljs.core.RedNode.cljs$lang$type = true;
cljs.core.RedNode.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/RedNode")
};
cljs.core.RedNode.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9079 = this;
  var h__2141__auto____9080 = this__9079.__hash;
  if(!(h__2141__auto____9080 == null)) {
    return h__2141__auto____9080
  }else {
    var h__2141__auto____9081 = cljs.core.hash_coll.call(null, coll);
    this__9079.__hash = h__2141__auto____9081;
    return h__2141__auto____9081
  }
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$2 = function(node, k) {
  var this__9082 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, null)
};
cljs.core.RedNode.prototype.cljs$core$ILookup$_lookup$arity$3 = function(node, k, not_found) {
  var this__9083 = this;
  return node.cljs$core$IIndexed$_nth$arity$3(node, k, not_found)
};
cljs.core.RedNode.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(node, k, v) {
  var this__9084 = this;
  return cljs.core.assoc.call(null, cljs.core.PersistentVector.fromArray([this__9084.key, this__9084.val], true), k, v)
};
cljs.core.RedNode.prototype.call = function() {
  var G__9132 = null;
  var G__9132__2 = function(this_sym9085, k) {
    var this__9087 = this;
    var this_sym9085__9088 = this;
    var node__9089 = this_sym9085__9088;
    return node__9089.cljs$core$ILookup$_lookup$arity$2(node__9089, k)
  };
  var G__9132__3 = function(this_sym9086, k, not_found) {
    var this__9087 = this;
    var this_sym9086__9090 = this;
    var node__9091 = this_sym9086__9090;
    return node__9091.cljs$core$ILookup$_lookup$arity$3(node__9091, k, not_found)
  };
  G__9132 = function(this_sym9086, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9132__2.call(this, this_sym9086, k);
      case 3:
        return G__9132__3.call(this, this_sym9086, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9132
}();
cljs.core.RedNode.prototype.apply = function(this_sym9077, args9078) {
  var this__9092 = this;
  return this_sym9077.call.apply(this_sym9077, [this_sym9077].concat(args9078.slice()))
};
cljs.core.RedNode.prototype.cljs$core$ICollection$_conj$arity$2 = function(node, o) {
  var this__9093 = this;
  return cljs.core.PersistentVector.fromArray([this__9093.key, this__9093.val, o], true)
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_key$arity$1 = function(node) {
  var this__9094 = this;
  return this__9094.key
};
cljs.core.RedNode.prototype.cljs$core$IMapEntry$_val$arity$1 = function(node) {
  var this__9095 = this;
  return this__9095.val
};
cljs.core.RedNode.prototype.add_right = function(ins) {
  var this__9096 = this;
  var node__9097 = this;
  return new cljs.core.RedNode(this__9096.key, this__9096.val, this__9096.left, ins, null)
};
cljs.core.RedNode.prototype.redden = function() {
  var this__9098 = this;
  var node__9099 = this;
  throw new Error("red-black tree invariant violation");
};
cljs.core.RedNode.prototype.remove_right = function(del) {
  var this__9100 = this;
  var node__9101 = this;
  return new cljs.core.RedNode(this__9100.key, this__9100.val, this__9100.left, del, null)
};
cljs.core.RedNode.prototype.replace = function(key, val, left, right) {
  var this__9102 = this;
  var node__9103 = this;
  return new cljs.core.RedNode(key, val, left, right, null)
};
cljs.core.RedNode.prototype.kv_reduce = function(f, init) {
  var this__9104 = this;
  var node__9105 = this;
  return cljs.core.tree_map_kv_reduce.call(null, node__9105, f, init)
};
cljs.core.RedNode.prototype.remove_left = function(del) {
  var this__9106 = this;
  var node__9107 = this;
  return new cljs.core.RedNode(this__9106.key, this__9106.val, del, this__9106.right, null)
};
cljs.core.RedNode.prototype.add_left = function(ins) {
  var this__9108 = this;
  var node__9109 = this;
  return new cljs.core.RedNode(this__9108.key, this__9108.val, ins, this__9108.right, null)
};
cljs.core.RedNode.prototype.balance_left = function(parent) {
  var this__9110 = this;
  var node__9111 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9110.left)) {
    return new cljs.core.RedNode(this__9110.key, this__9110.val, this__9110.left.blacken(), new cljs.core.BlackNode(parent.key, parent.val, this__9110.right, parent.right, null), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9110.right)) {
      return new cljs.core.RedNode(this__9110.right.key, this__9110.right.val, new cljs.core.BlackNode(this__9110.key, this__9110.val, this__9110.left, this__9110.right.left, null), new cljs.core.BlackNode(parent.key, parent.val, this__9110.right.right, parent.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, node__9111, parent.right, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.toString = function() {
  var G__9133 = null;
  var G__9133__0 = function() {
    var this__9112 = this;
    var this__9114 = this;
    return cljs.core.pr_str.call(null, this__9114)
  };
  G__9133 = function() {
    switch(arguments.length) {
      case 0:
        return G__9133__0.call(this)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9133
}();
cljs.core.RedNode.prototype.balance_right = function(parent) {
  var this__9115 = this;
  var node__9116 = this;
  if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9115.right)) {
    return new cljs.core.RedNode(this__9115.key, this__9115.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9115.left, null), this__9115.right.blacken(), null)
  }else {
    if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, this__9115.left)) {
      return new cljs.core.RedNode(this__9115.left.key, this__9115.left.val, new cljs.core.BlackNode(parent.key, parent.val, parent.left, this__9115.left.left, null), new cljs.core.BlackNode(this__9115.key, this__9115.val, this__9115.left.right, this__9115.right, null), null)
    }else {
      if("\ufdd0'else") {
        return new cljs.core.BlackNode(parent.key, parent.val, parent.left, node__9116, null)
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.blacken = function() {
  var this__9117 = this;
  var node__9118 = this;
  return new cljs.core.BlackNode(this__9117.key, this__9117.val, this__9117.left, this__9117.right, null)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$2 = function(node, f) {
  var this__9119 = this;
  return cljs.core.ci_reduce.call(null, node, f)
};
cljs.core.RedNode.prototype.cljs$core$IReduce$_reduce$arity$3 = function(node, f, start) {
  var this__9120 = this;
  return cljs.core.ci_reduce.call(null, node, f, start)
};
cljs.core.RedNode.prototype.cljs$core$ISeqable$_seq$arity$1 = function(node) {
  var this__9121 = this;
  return cljs.core.list.call(null, this__9121.key, this__9121.val)
};
cljs.core.RedNode.prototype.cljs$core$ICounted$_count$arity$1 = function(node) {
  var this__9122 = this;
  return 2
};
cljs.core.RedNode.prototype.cljs$core$IStack$_peek$arity$1 = function(node) {
  var this__9123 = this;
  return this__9123.val
};
cljs.core.RedNode.prototype.cljs$core$IStack$_pop$arity$1 = function(node) {
  var this__9124 = this;
  return cljs.core.PersistentVector.fromArray([this__9124.key], true)
};
cljs.core.RedNode.prototype.cljs$core$IVector$_assoc_n$arity$3 = function(node, n, v) {
  var this__9125 = this;
  return cljs.core._assoc_n.call(null, cljs.core.PersistentVector.fromArray([this__9125.key, this__9125.val], true), n, v)
};
cljs.core.RedNode.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9126 = this;
  return cljs.core.equiv_sequential.call(null, coll, other)
};
cljs.core.RedNode.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(node, meta) {
  var this__9127 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentVector.fromArray([this__9127.key, this__9127.val], true), meta)
};
cljs.core.RedNode.prototype.cljs$core$IMeta$_meta$arity$1 = function(node) {
  var this__9128 = this;
  return null
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$2 = function(node, n) {
  var this__9129 = this;
  if(n === 0) {
    return this__9129.key
  }else {
    if(n === 1) {
      return this__9129.val
    }else {
      if("\ufdd0'else") {
        return null
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IIndexed$_nth$arity$3 = function(node, n, not_found) {
  var this__9130 = this;
  if(n === 0) {
    return this__9130.key
  }else {
    if(n === 1) {
      return this__9130.val
    }else {
      if("\ufdd0'else") {
        return not_found
      }else {
        return null
      }
    }
  }
};
cljs.core.RedNode.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(node) {
  var this__9131 = this;
  return cljs.core.PersistentVector.EMPTY
};
cljs.core.RedNode;
cljs.core.tree_map_add = function tree_map_add(comp, tree, k, v, found) {
  if(tree == null) {
    return new cljs.core.RedNode(k, v, null, null, null)
  }else {
    var c__9137 = comp.call(null, k, tree.key);
    if(c__9137 === 0) {
      found[0] = tree;
      return null
    }else {
      if(c__9137 < 0) {
        var ins__9138 = tree_map_add.call(null, comp, tree.left, k, v, found);
        if(!(ins__9138 == null)) {
          return tree.add_left(ins__9138)
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var ins__9139 = tree_map_add.call(null, comp, tree.right, k, v, found);
          if(!(ins__9139 == null)) {
            return tree.add_right(ins__9139)
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }
};
cljs.core.tree_map_append = function tree_map_append(left, right) {
  if(left == null) {
    return right
  }else {
    if(right == null) {
      return left
    }else {
      if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, left)) {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          var app__9142 = tree_map_append.call(null, left.right, right.left);
          if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9142)) {
            return new cljs.core.RedNode(app__9142.key, app__9142.val, new cljs.core.RedNode(left.key, left.val, left.left, app__9142.left, null), new cljs.core.RedNode(right.key, right.val, app__9142.right, right.right, null), null)
          }else {
            return new cljs.core.RedNode(left.key, left.val, left.left, new cljs.core.RedNode(right.key, right.val, app__9142, right.right, null), null)
          }
        }else {
          return new cljs.core.RedNode(left.key, left.val, left.left, tree_map_append.call(null, left.right, right), null)
        }
      }else {
        if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, right)) {
          return new cljs.core.RedNode(right.key, right.val, tree_map_append.call(null, left, right.left), right.right, null)
        }else {
          if("\ufdd0'else") {
            var app__9143 = tree_map_append.call(null, left.right, right.left);
            if(cljs.core.instance_QMARK_.call(null, cljs.core.RedNode, app__9143)) {
              return new cljs.core.RedNode(app__9143.key, app__9143.val, new cljs.core.BlackNode(left.key, left.val, left.left, app__9143.left, null), new cljs.core.BlackNode(right.key, right.val, app__9143.right, right.right, null), null)
            }else {
              return cljs.core.balance_left_del.call(null, left.key, left.val, left.left, new cljs.core.BlackNode(right.key, right.val, app__9143, right.right, null))
            }
          }else {
            return null
          }
        }
      }
    }
  }
};
cljs.core.tree_map_remove = function tree_map_remove(comp, tree, k, found) {
  if(!(tree == null)) {
    var c__9149 = comp.call(null, k, tree.key);
    if(c__9149 === 0) {
      found[0] = tree;
      return cljs.core.tree_map_append.call(null, tree.left, tree.right)
    }else {
      if(c__9149 < 0) {
        var del__9150 = tree_map_remove.call(null, comp, tree.left, k, found);
        if(function() {
          var or__3943__auto____9151 = !(del__9150 == null);
          if(or__3943__auto____9151) {
            return or__3943__auto____9151
          }else {
            return!(found[0] == null)
          }
        }()) {
          if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.left)) {
            return cljs.core.balance_left_del.call(null, tree.key, tree.val, del__9150, tree.right)
          }else {
            return new cljs.core.RedNode(tree.key, tree.val, del__9150, tree.right, null)
          }
        }else {
          return null
        }
      }else {
        if("\ufdd0'else") {
          var del__9152 = tree_map_remove.call(null, comp, tree.right, k, found);
          if(function() {
            var or__3943__auto____9153 = !(del__9152 == null);
            if(or__3943__auto____9153) {
              return or__3943__auto____9153
            }else {
              return!(found[0] == null)
            }
          }()) {
            if(cljs.core.instance_QMARK_.call(null, cljs.core.BlackNode, tree.right)) {
              return cljs.core.balance_right_del.call(null, tree.key, tree.val, tree.left, del__9152)
            }else {
              return new cljs.core.RedNode(tree.key, tree.val, tree.left, del__9152, null)
            }
          }else {
            return null
          }
        }else {
          return null
        }
      }
    }
  }else {
    return null
  }
};
cljs.core.tree_map_replace = function tree_map_replace(comp, tree, k, v) {
  var tk__9156 = tree.key;
  var c__9157 = comp.call(null, k, tk__9156);
  if(c__9157 === 0) {
    return tree.replace(tk__9156, v, tree.left, tree.right)
  }else {
    if(c__9157 < 0) {
      return tree.replace(tk__9156, tree.val, tree_map_replace.call(null, comp, tree.left, k, v), tree.right)
    }else {
      if("\ufdd0'else") {
        return tree.replace(tk__9156, tree.val, tree.left, tree_map_replace.call(null, comp, tree.right, k, v))
      }else {
        return null
      }
    }
  }
};
cljs.core.PersistentTreeMap = function(comp, tree, cnt, meta, __hash) {
  this.comp = comp;
  this.tree = tree;
  this.cnt = cnt;
  this.meta = meta;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 418776847
};
cljs.core.PersistentTreeMap.cljs$lang$type = true;
cljs.core.PersistentTreeMap.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeMap")
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9160 = this;
  var h__2141__auto____9161 = this__9160.__hash;
  if(!(h__2141__auto____9161 == null)) {
    return h__2141__auto____9161
  }else {
    var h__2141__auto____9162 = cljs.core.hash_imap.call(null, coll);
    this__9160.__hash = h__2141__auto____9162;
    return h__2141__auto____9162
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, k) {
  var this__9163 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, k, null)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, k, not_found) {
  var this__9164 = this;
  var n__9165 = coll.entry_at(k);
  if(!(n__9165 == null)) {
    return n__9165.val
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_assoc$arity$3 = function(coll, k, v) {
  var this__9166 = this;
  var found__9167 = [null];
  var t__9168 = cljs.core.tree_map_add.call(null, this__9166.comp, this__9166.tree, k, v, found__9167);
  if(t__9168 == null) {
    var found_node__9169 = cljs.core.nth.call(null, found__9167, 0);
    if(cljs.core._EQ_.call(null, v, found_node__9169.val)) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9166.comp, cljs.core.tree_map_replace.call(null, this__9166.comp, this__9166.tree, k, v), this__9166.cnt, this__9166.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9166.comp, t__9168.blacken(), this__9166.cnt + 1, this__9166.meta, null)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IAssociative$_contains_key_QMARK_$arity$2 = function(coll, k) {
  var this__9170 = this;
  return!(coll.entry_at(k) == null)
};
cljs.core.PersistentTreeMap.prototype.call = function() {
  var G__9204 = null;
  var G__9204__2 = function(this_sym9171, k) {
    var this__9173 = this;
    var this_sym9171__9174 = this;
    var coll__9175 = this_sym9171__9174;
    return coll__9175.cljs$core$ILookup$_lookup$arity$2(coll__9175, k)
  };
  var G__9204__3 = function(this_sym9172, k, not_found) {
    var this__9173 = this;
    var this_sym9172__9176 = this;
    var coll__9177 = this_sym9172__9176;
    return coll__9177.cljs$core$ILookup$_lookup$arity$3(coll__9177, k, not_found)
  };
  G__9204 = function(this_sym9172, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9204__2.call(this, this_sym9172, k);
      case 3:
        return G__9204__3.call(this, this_sym9172, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9204
}();
cljs.core.PersistentTreeMap.prototype.apply = function(this_sym9158, args9159) {
  var this__9178 = this;
  return this_sym9158.call.apply(this_sym9158, [this_sym9158].concat(args9159.slice()))
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IKVReduce$_kv_reduce$arity$3 = function(coll, f, init) {
  var this__9179 = this;
  if(!(this__9179.tree == null)) {
    return cljs.core.tree_map_kv_reduce.call(null, this__9179.tree, f, init)
  }else {
    return init
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, entry) {
  var this__9180 = this;
  if(cljs.core.vector_QMARK_.call(null, entry)) {
    return coll.cljs$core$IAssociative$_assoc$arity$3(coll, cljs.core._nth.call(null, entry, 0), cljs.core._nth.call(null, entry, 1))
  }else {
    return cljs.core.reduce.call(null, cljs.core._conj, coll, entry)
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9181 = this;
  if(this__9181.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9181.tree, false, this__9181.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.toString = function() {
  var this__9182 = this;
  var this__9183 = this;
  return cljs.core.pr_str.call(null, this__9183)
};
cljs.core.PersistentTreeMap.prototype.entry_at = function(k) {
  var this__9184 = this;
  var coll__9185 = this;
  var t__9186 = this__9184.tree;
  while(true) {
    if(!(t__9186 == null)) {
      var c__9187 = this__9184.comp.call(null, k, t__9186.key);
      if(c__9187 === 0) {
        return t__9186
      }else {
        if(c__9187 < 0) {
          var G__9205 = t__9186.left;
          t__9186 = G__9205;
          continue
        }else {
          if("\ufdd0'else") {
            var G__9206 = t__9186.right;
            t__9186 = G__9206;
            continue
          }else {
            return null
          }
        }
      }
    }else {
      return null
    }
    break
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9188 = this;
  if(this__9188.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9188.tree, ascending_QMARK_, this__9188.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9189 = this;
  if(this__9189.cnt > 0) {
    var stack__9190 = null;
    var t__9191 = this__9189.tree;
    while(true) {
      if(!(t__9191 == null)) {
        var c__9192 = this__9189.comp.call(null, k, t__9191.key);
        if(c__9192 === 0) {
          return new cljs.core.PersistentTreeMapSeq(null, cljs.core.conj.call(null, stack__9190, t__9191), ascending_QMARK_, -1, null)
        }else {
          if(cljs.core.truth_(ascending_QMARK_)) {
            if(c__9192 < 0) {
              var G__9207 = cljs.core.conj.call(null, stack__9190, t__9191);
              var G__9208 = t__9191.left;
              stack__9190 = G__9207;
              t__9191 = G__9208;
              continue
            }else {
              var G__9209 = stack__9190;
              var G__9210 = t__9191.right;
              stack__9190 = G__9209;
              t__9191 = G__9210;
              continue
            }
          }else {
            if("\ufdd0'else") {
              if(c__9192 > 0) {
                var G__9211 = cljs.core.conj.call(null, stack__9190, t__9191);
                var G__9212 = t__9191.right;
                stack__9190 = G__9211;
                t__9191 = G__9212;
                continue
              }else {
                var G__9213 = stack__9190;
                var G__9214 = t__9191.left;
                stack__9190 = G__9213;
                t__9191 = G__9214;
                continue
              }
            }else {
              return null
            }
          }
        }
      }else {
        if(stack__9190 == null) {
          return new cljs.core.PersistentTreeMapSeq(null, stack__9190, ascending_QMARK_, -1, null)
        }else {
          return null
        }
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9193 = this;
  return cljs.core.key.call(null, entry)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9194 = this;
  return this__9194.comp
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9195 = this;
  if(this__9195.cnt > 0) {
    return cljs.core.create_tree_map_seq.call(null, this__9195.tree, true, this__9195.cnt)
  }else {
    return null
  }
};
cljs.core.PersistentTreeMap.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9196 = this;
  return this__9196.cnt
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9197 = this;
  return cljs.core.equiv_map.call(null, coll, other)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9198 = this;
  return new cljs.core.PersistentTreeMap(this__9198.comp, this__9198.tree, this__9198.cnt, meta, this__9198.__hash)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9199 = this;
  return this__9199.meta
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9200 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeMap.EMPTY, this__9200.meta)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IMap$_dissoc$arity$2 = function(coll, k) {
  var this__9201 = this;
  var found__9202 = [null];
  var t__9203 = cljs.core.tree_map_remove.call(null, this__9201.comp, this__9201.tree, k, found__9202);
  if(t__9203 == null) {
    if(cljs.core.nth.call(null, found__9202, 0) == null) {
      return coll
    }else {
      return new cljs.core.PersistentTreeMap(this__9201.comp, null, 0, this__9201.meta, null)
    }
  }else {
    return new cljs.core.PersistentTreeMap(this__9201.comp, t__9203.blacken(), this__9201.cnt - 1, this__9201.meta, null)
  }
};
cljs.core.PersistentTreeMap;
cljs.core.PersistentTreeMap.EMPTY = new cljs.core.PersistentTreeMap(cljs.core.compare, null, 0, null, 0);
cljs.core.hash_map = function() {
  var hash_map__delegate = function(keyvals) {
    var in__9217 = cljs.core.seq.call(null, keyvals);
    var out__9218 = cljs.core.transient$.call(null, cljs.core.PersistentHashMap.EMPTY);
    while(true) {
      if(in__9217) {
        var G__9219 = cljs.core.nnext.call(null, in__9217);
        var G__9220 = cljs.core.assoc_BANG_.call(null, out__9218, cljs.core.first.call(null, in__9217), cljs.core.second.call(null, in__9217));
        in__9217 = G__9219;
        out__9218 = G__9220;
        continue
      }else {
        return cljs.core.persistent_BANG_.call(null, out__9218)
      }
      break
    }
  };
  var hash_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return hash_map__delegate.call(this, keyvals)
  };
  hash_map.cljs$lang$maxFixedArity = 0;
  hash_map.cljs$lang$applyTo = function(arglist__9221) {
    var keyvals = cljs.core.seq(arglist__9221);
    return hash_map__delegate(keyvals)
  };
  hash_map.cljs$lang$arity$variadic = hash_map__delegate;
  return hash_map
}();
cljs.core.array_map = function() {
  var array_map__delegate = function(keyvals) {
    return new cljs.core.PersistentArrayMap(null, cljs.core.quot.call(null, cljs.core.count.call(null, keyvals), 2), cljs.core.apply.call(null, cljs.core.array, keyvals), null)
  };
  var array_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return array_map__delegate.call(this, keyvals)
  };
  array_map.cljs$lang$maxFixedArity = 0;
  array_map.cljs$lang$applyTo = function(arglist__9222) {
    var keyvals = cljs.core.seq(arglist__9222);
    return array_map__delegate(keyvals)
  };
  array_map.cljs$lang$arity$variadic = array_map__delegate;
  return array_map
}();
cljs.core.obj_map = function() {
  var obj_map__delegate = function(keyvals) {
    var ks__9226 = [];
    var obj__9227 = {};
    var kvs__9228 = cljs.core.seq.call(null, keyvals);
    while(true) {
      if(kvs__9228) {
        ks__9226.push(cljs.core.first.call(null, kvs__9228));
        obj__9227[cljs.core.first.call(null, kvs__9228)] = cljs.core.second.call(null, kvs__9228);
        var G__9229 = cljs.core.nnext.call(null, kvs__9228);
        kvs__9228 = G__9229;
        continue
      }else {
        return cljs.core.ObjMap.fromObject.call(null, ks__9226, obj__9227)
      }
      break
    }
  };
  var obj_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return obj_map__delegate.call(this, keyvals)
  };
  obj_map.cljs$lang$maxFixedArity = 0;
  obj_map.cljs$lang$applyTo = function(arglist__9230) {
    var keyvals = cljs.core.seq(arglist__9230);
    return obj_map__delegate(keyvals)
  };
  obj_map.cljs$lang$arity$variadic = obj_map__delegate;
  return obj_map
}();
cljs.core.sorted_map = function() {
  var sorted_map__delegate = function(keyvals) {
    var in__9233 = cljs.core.seq.call(null, keyvals);
    var out__9234 = cljs.core.PersistentTreeMap.EMPTY;
    while(true) {
      if(in__9233) {
        var G__9235 = cljs.core.nnext.call(null, in__9233);
        var G__9236 = cljs.core.assoc.call(null, out__9234, cljs.core.first.call(null, in__9233), cljs.core.second.call(null, in__9233));
        in__9233 = G__9235;
        out__9234 = G__9236;
        continue
      }else {
        return out__9234
      }
      break
    }
  };
  var sorted_map = function(var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_map__delegate.call(this, keyvals)
  };
  sorted_map.cljs$lang$maxFixedArity = 0;
  sorted_map.cljs$lang$applyTo = function(arglist__9237) {
    var keyvals = cljs.core.seq(arglist__9237);
    return sorted_map__delegate(keyvals)
  };
  sorted_map.cljs$lang$arity$variadic = sorted_map__delegate;
  return sorted_map
}();
cljs.core.sorted_map_by = function() {
  var sorted_map_by__delegate = function(comparator, keyvals) {
    var in__9240 = cljs.core.seq.call(null, keyvals);
    var out__9241 = new cljs.core.PersistentTreeMap(comparator, null, 0, null, 0);
    while(true) {
      if(in__9240) {
        var G__9242 = cljs.core.nnext.call(null, in__9240);
        var G__9243 = cljs.core.assoc.call(null, out__9241, cljs.core.first.call(null, in__9240), cljs.core.second.call(null, in__9240));
        in__9240 = G__9242;
        out__9241 = G__9243;
        continue
      }else {
        return out__9241
      }
      break
    }
  };
  var sorted_map_by = function(comparator, var_args) {
    var keyvals = null;
    if(goog.isDef(var_args)) {
      keyvals = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_map_by__delegate.call(this, comparator, keyvals)
  };
  sorted_map_by.cljs$lang$maxFixedArity = 1;
  sorted_map_by.cljs$lang$applyTo = function(arglist__9244) {
    var comparator = cljs.core.first(arglist__9244);
    var keyvals = cljs.core.rest(arglist__9244);
    return sorted_map_by__delegate(comparator, keyvals)
  };
  sorted_map_by.cljs$lang$arity$variadic = sorted_map_by__delegate;
  return sorted_map_by
}();
cljs.core.keys = function keys(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.first, hash_map))
};
cljs.core.key = function key(map_entry) {
  return cljs.core._key.call(null, map_entry)
};
cljs.core.vals = function vals(hash_map) {
  return cljs.core.seq.call(null, cljs.core.map.call(null, cljs.core.second, hash_map))
};
cljs.core.val = function val(map_entry) {
  return cljs.core._val.call(null, map_entry)
};
cljs.core.merge = function() {
  var merge__delegate = function(maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      return cljs.core.reduce.call(null, function(p1__9245_SHARP_, p2__9246_SHARP_) {
        return cljs.core.conj.call(null, function() {
          var or__3943__auto____9248 = p1__9245_SHARP_;
          if(cljs.core.truth_(or__3943__auto____9248)) {
            return or__3943__auto____9248
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), p2__9246_SHARP_)
      }, maps)
    }else {
      return null
    }
  };
  var merge = function(var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return merge__delegate.call(this, maps)
  };
  merge.cljs$lang$maxFixedArity = 0;
  merge.cljs$lang$applyTo = function(arglist__9249) {
    var maps = cljs.core.seq(arglist__9249);
    return merge__delegate(maps)
  };
  merge.cljs$lang$arity$variadic = merge__delegate;
  return merge
}();
cljs.core.merge_with = function() {
  var merge_with__delegate = function(f, maps) {
    if(cljs.core.truth_(cljs.core.some.call(null, cljs.core.identity, maps))) {
      var merge_entry__9257 = function(m, e) {
        var k__9255 = cljs.core.first.call(null, e);
        var v__9256 = cljs.core.second.call(null, e);
        if(cljs.core.contains_QMARK_.call(null, m, k__9255)) {
          return cljs.core.assoc.call(null, m, k__9255, f.call(null, cljs.core._lookup.call(null, m, k__9255, null), v__9256))
        }else {
          return cljs.core.assoc.call(null, m, k__9255, v__9256)
        }
      };
      var merge2__9259 = function(m1, m2) {
        return cljs.core.reduce.call(null, merge_entry__9257, function() {
          var or__3943__auto____9258 = m1;
          if(cljs.core.truth_(or__3943__auto____9258)) {
            return or__3943__auto____9258
          }else {
            return cljs.core.ObjMap.EMPTY
          }
        }(), cljs.core.seq.call(null, m2))
      };
      return cljs.core.reduce.call(null, merge2__9259, maps)
    }else {
      return null
    }
  };
  var merge_with = function(f, var_args) {
    var maps = null;
    if(goog.isDef(var_args)) {
      maps = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return merge_with__delegate.call(this, f, maps)
  };
  merge_with.cljs$lang$maxFixedArity = 1;
  merge_with.cljs$lang$applyTo = function(arglist__9260) {
    var f = cljs.core.first(arglist__9260);
    var maps = cljs.core.rest(arglist__9260);
    return merge_with__delegate(f, maps)
  };
  merge_with.cljs$lang$arity$variadic = merge_with__delegate;
  return merge_with
}();
cljs.core.select_keys = function select_keys(map, keyseq) {
  var ret__9265 = cljs.core.ObjMap.EMPTY;
  var keys__9266 = cljs.core.seq.call(null, keyseq);
  while(true) {
    if(keys__9266) {
      var key__9267 = cljs.core.first.call(null, keys__9266);
      var entry__9268 = cljs.core._lookup.call(null, map, key__9267, "\ufdd0'cljs.core/not-found");
      var G__9269 = cljs.core.not_EQ_.call(null, entry__9268, "\ufdd0'cljs.core/not-found") ? cljs.core.assoc.call(null, ret__9265, key__9267, entry__9268) : ret__9265;
      var G__9270 = cljs.core.next.call(null, keys__9266);
      ret__9265 = G__9269;
      keys__9266 = G__9270;
      continue
    }else {
      return ret__9265
    }
    break
  }
};
cljs.core.PersistentHashSet = function(meta, hash_map, __hash) {
  this.meta = meta;
  this.hash_map = hash_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 1;
  this.cljs$lang$protocol_mask$partition0$ = 15077647
};
cljs.core.PersistentHashSet.cljs$lang$type = true;
cljs.core.PersistentHashSet.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentHashSet")
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEditableCollection$_as_transient$arity$1 = function(coll) {
  var this__9274 = this;
  return new cljs.core.TransientHashSet(cljs.core.transient$.call(null, this__9274.hash_map))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9275 = this;
  var h__2141__auto____9276 = this__9275.__hash;
  if(!(h__2141__auto____9276 == null)) {
    return h__2141__auto____9276
  }else {
    var h__2141__auto____9277 = cljs.core.hash_iset.call(null, coll);
    this__9275.__hash = h__2141__auto____9277;
    return h__2141__auto____9277
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9278 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9279 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9279.hash_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentHashSet.prototype.call = function() {
  var G__9300 = null;
  var G__9300__2 = function(this_sym9280, k) {
    var this__9282 = this;
    var this_sym9280__9283 = this;
    var coll__9284 = this_sym9280__9283;
    return coll__9284.cljs$core$ILookup$_lookup$arity$2(coll__9284, k)
  };
  var G__9300__3 = function(this_sym9281, k, not_found) {
    var this__9282 = this;
    var this_sym9281__9285 = this;
    var coll__9286 = this_sym9281__9285;
    return coll__9286.cljs$core$ILookup$_lookup$arity$3(coll__9286, k, not_found)
  };
  G__9300 = function(this_sym9281, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9300__2.call(this, this_sym9281, k);
      case 3:
        return G__9300__3.call(this, this_sym9281, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9300
}();
cljs.core.PersistentHashSet.prototype.apply = function(this_sym9272, args9273) {
  var this__9287 = this;
  return this_sym9272.call.apply(this_sym9272, [this_sym9272].concat(args9273.slice()))
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9288 = this;
  return new cljs.core.PersistentHashSet(this__9288.meta, cljs.core.assoc.call(null, this__9288.hash_map, o, null), null)
};
cljs.core.PersistentHashSet.prototype.toString = function() {
  var this__9289 = this;
  var this__9290 = this;
  return cljs.core.pr_str.call(null, this__9290)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9291 = this;
  return cljs.core.keys.call(null, this__9291.hash_map)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9292 = this;
  return new cljs.core.PersistentHashSet(this__9292.meta, cljs.core.dissoc.call(null, this__9292.hash_map, v), null)
};
cljs.core.PersistentHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9293 = this;
  return cljs.core.count.call(null, cljs.core.seq.call(null, coll))
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9294 = this;
  var and__3941__auto____9295 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9295) {
    var and__3941__auto____9296 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9296) {
      return cljs.core.every_QMARK_.call(null, function(p1__9271_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9271_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9296
    }
  }else {
    return and__3941__auto____9295
  }
};
cljs.core.PersistentHashSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9297 = this;
  return new cljs.core.PersistentHashSet(meta, this__9297.hash_map, this__9297.__hash)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9298 = this;
  return this__9298.meta
};
cljs.core.PersistentHashSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9299 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentHashSet.EMPTY, this__9299.meta)
};
cljs.core.PersistentHashSet;
cljs.core.PersistentHashSet.EMPTY = new cljs.core.PersistentHashSet(null, cljs.core.hash_map.call(null), 0);
cljs.core.PersistentHashSet.fromArray = function(items) {
  var len__9301 = cljs.core.count.call(null, items);
  var i__9302 = 0;
  var out__9303 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
  while(true) {
    if(i__9302 < len__9301) {
      var G__9304 = i__9302 + 1;
      var G__9305 = cljs.core.conj_BANG_.call(null, out__9303, items[i__9302]);
      i__9302 = G__9304;
      out__9303 = G__9305;
      continue
    }else {
      return cljs.core.persistent_BANG_.call(null, out__9303)
    }
    break
  }
};
cljs.core.TransientHashSet = function(transient_map) {
  this.transient_map = transient_map;
  this.cljs$lang$protocol_mask$partition0$ = 259;
  this.cljs$lang$protocol_mask$partition1$ = 34
};
cljs.core.TransientHashSet.cljs$lang$type = true;
cljs.core.TransientHashSet.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/TransientHashSet")
};
cljs.core.TransientHashSet.prototype.call = function() {
  var G__9323 = null;
  var G__9323__2 = function(this_sym9309, k) {
    var this__9311 = this;
    var this_sym9309__9312 = this;
    var tcoll__9313 = this_sym9309__9312;
    if(cljs.core._lookup.call(null, this__9311.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return null
    }else {
      return k
    }
  };
  var G__9323__3 = function(this_sym9310, k, not_found) {
    var this__9311 = this;
    var this_sym9310__9314 = this;
    var tcoll__9315 = this_sym9310__9314;
    if(cljs.core._lookup.call(null, this__9311.transient_map, k, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
      return not_found
    }else {
      return k
    }
  };
  G__9323 = function(this_sym9310, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9323__2.call(this, this_sym9310, k);
      case 3:
        return G__9323__3.call(this, this_sym9310, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9323
}();
cljs.core.TransientHashSet.prototype.apply = function(this_sym9307, args9308) {
  var this__9316 = this;
  return this_sym9307.call.apply(this_sym9307, [this_sym9307].concat(args9308.slice()))
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(tcoll, v) {
  var this__9317 = this;
  return tcoll.cljs$core$ILookup$_lookup$arity$3(tcoll, v, null)
};
cljs.core.TransientHashSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(tcoll, v, not_found) {
  var this__9318 = this;
  if(cljs.core._lookup.call(null, this__9318.transient_map, v, cljs.core.lookup_sentinel) === cljs.core.lookup_sentinel) {
    return not_found
  }else {
    return v
  }
};
cljs.core.TransientHashSet.prototype.cljs$core$ICounted$_count$arity$1 = function(tcoll) {
  var this__9319 = this;
  return cljs.core.count.call(null, this__9319.transient_map)
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientSet$_disjoin_BANG_$arity$2 = function(tcoll, v) {
  var this__9320 = this;
  this__9320.transient_map = cljs.core.dissoc_BANG_.call(null, this__9320.transient_map, v);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_conj_BANG_$arity$2 = function(tcoll, o) {
  var this__9321 = this;
  this__9321.transient_map = cljs.core.assoc_BANG_.call(null, this__9321.transient_map, o, null);
  return tcoll
};
cljs.core.TransientHashSet.prototype.cljs$core$ITransientCollection$_persistent_BANG_$arity$1 = function(tcoll) {
  var this__9322 = this;
  return new cljs.core.PersistentHashSet(null, cljs.core.persistent_BANG_.call(null, this__9322.transient_map), null)
};
cljs.core.TransientHashSet;
cljs.core.PersistentTreeSet = function(meta, tree_map, __hash) {
  this.meta = meta;
  this.tree_map = tree_map;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 417730831
};
cljs.core.PersistentTreeSet.cljs$lang$type = true;
cljs.core.PersistentTreeSet.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/PersistentTreeSet")
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IHash$_hash$arity$1 = function(coll) {
  var this__9326 = this;
  var h__2141__auto____9327 = this__9326.__hash;
  if(!(h__2141__auto____9327 == null)) {
    return h__2141__auto____9327
  }else {
    var h__2141__auto____9328 = cljs.core.hash_iset.call(null, coll);
    this__9326.__hash = h__2141__auto____9328;
    return h__2141__auto____9328
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$2 = function(coll, v) {
  var this__9329 = this;
  return coll.cljs$core$ILookup$_lookup$arity$3(coll, v, null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ILookup$_lookup$arity$3 = function(coll, v, not_found) {
  var this__9330 = this;
  if(cljs.core.truth_(cljs.core._contains_key_QMARK_.call(null, this__9330.tree_map, v))) {
    return v
  }else {
    return not_found
  }
};
cljs.core.PersistentTreeSet.prototype.call = function() {
  var G__9356 = null;
  var G__9356__2 = function(this_sym9331, k) {
    var this__9333 = this;
    var this_sym9331__9334 = this;
    var coll__9335 = this_sym9331__9334;
    return coll__9335.cljs$core$ILookup$_lookup$arity$2(coll__9335, k)
  };
  var G__9356__3 = function(this_sym9332, k, not_found) {
    var this__9333 = this;
    var this_sym9332__9336 = this;
    var coll__9337 = this_sym9332__9336;
    return coll__9337.cljs$core$ILookup$_lookup$arity$3(coll__9337, k, not_found)
  };
  G__9356 = function(this_sym9332, k, not_found) {
    switch(arguments.length) {
      case 2:
        return G__9356__2.call(this, this_sym9332, k);
      case 3:
        return G__9356__3.call(this, this_sym9332, k, not_found)
    }
    throw"Invalid arity: " + arguments.length;
  };
  return G__9356
}();
cljs.core.PersistentTreeSet.prototype.apply = function(this_sym9324, args9325) {
  var this__9338 = this;
  return this_sym9324.call.apply(this_sym9324, [this_sym9324].concat(args9325.slice()))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICollection$_conj$arity$2 = function(coll, o) {
  var this__9339 = this;
  return new cljs.core.PersistentTreeSet(this__9339.meta, cljs.core.assoc.call(null, this__9339.tree_map, o, null), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IReversible$_rseq$arity$1 = function(coll) {
  var this__9340 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core.rseq.call(null, this__9340.tree_map))
};
cljs.core.PersistentTreeSet.prototype.toString = function() {
  var this__9341 = this;
  var this__9342 = this;
  return cljs.core.pr_str.call(null, this__9342)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq$arity$2 = function(coll, ascending_QMARK_) {
  var this__9343 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq.call(null, this__9343.tree_map, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_sorted_seq_from$arity$3 = function(coll, k, ascending_QMARK_) {
  var this__9344 = this;
  return cljs.core.map.call(null, cljs.core.key, cljs.core._sorted_seq_from.call(null, this__9344.tree_map, k, ascending_QMARK_))
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_entry_key$arity$2 = function(coll, entry) {
  var this__9345 = this;
  return entry
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISorted$_comparator$arity$1 = function(coll) {
  var this__9346 = this;
  return cljs.core._comparator.call(null, this__9346.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISeqable$_seq$arity$1 = function(coll) {
  var this__9347 = this;
  return cljs.core.keys.call(null, this__9347.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ISet$_disjoin$arity$2 = function(coll, v) {
  var this__9348 = this;
  return new cljs.core.PersistentTreeSet(this__9348.meta, cljs.core.dissoc.call(null, this__9348.tree_map, v), null)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$ICounted$_count$arity$1 = function(coll) {
  var this__9349 = this;
  return cljs.core.count.call(null, this__9349.tree_map)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(coll, other) {
  var this__9350 = this;
  var and__3941__auto____9351 = cljs.core.set_QMARK_.call(null, other);
  if(and__3941__auto____9351) {
    var and__3941__auto____9352 = cljs.core.count.call(null, coll) === cljs.core.count.call(null, other);
    if(and__3941__auto____9352) {
      return cljs.core.every_QMARK_.call(null, function(p1__9306_SHARP_) {
        return cljs.core.contains_QMARK_.call(null, coll, p1__9306_SHARP_)
      }, other)
    }else {
      return and__3941__auto____9352
    }
  }else {
    return and__3941__auto____9351
  }
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(coll, meta) {
  var this__9353 = this;
  return new cljs.core.PersistentTreeSet(meta, this__9353.tree_map, this__9353.__hash)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IMeta$_meta$arity$1 = function(coll) {
  var this__9354 = this;
  return this__9354.meta
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(coll) {
  var this__9355 = this;
  return cljs.core.with_meta.call(null, cljs.core.PersistentTreeSet.EMPTY, this__9355.meta)
};
cljs.core.PersistentTreeSet;
cljs.core.PersistentTreeSet.EMPTY = new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map.call(null), 0);
cljs.core.hash_set = function() {
  var hash_set = null;
  var hash_set__0 = function() {
    return cljs.core.PersistentHashSet.EMPTY
  };
  var hash_set__1 = function() {
    var G__9361__delegate = function(keys) {
      var in__9359 = cljs.core.seq.call(null, keys);
      var out__9360 = cljs.core.transient$.call(null, cljs.core.PersistentHashSet.EMPTY);
      while(true) {
        if(cljs.core.seq.call(null, in__9359)) {
          var G__9362 = cljs.core.next.call(null, in__9359);
          var G__9363 = cljs.core.conj_BANG_.call(null, out__9360, cljs.core.first.call(null, in__9359));
          in__9359 = G__9362;
          out__9360 = G__9363;
          continue
        }else {
          return cljs.core.persistent_BANG_.call(null, out__9360)
        }
        break
      }
    };
    var G__9361 = function(var_args) {
      var keys = null;
      if(goog.isDef(var_args)) {
        keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9361__delegate.call(this, keys)
    };
    G__9361.cljs$lang$maxFixedArity = 0;
    G__9361.cljs$lang$applyTo = function(arglist__9364) {
      var keys = cljs.core.seq(arglist__9364);
      return G__9361__delegate(keys)
    };
    G__9361.cljs$lang$arity$variadic = G__9361__delegate;
    return G__9361
  }();
  hash_set = function(var_args) {
    var keys = var_args;
    switch(arguments.length) {
      case 0:
        return hash_set__0.call(this);
      default:
        return hash_set__1.cljs$lang$arity$variadic(cljs.core.array_seq(arguments, 0))
    }
    throw"Invalid arity: " + arguments.length;
  };
  hash_set.cljs$lang$maxFixedArity = 0;
  hash_set.cljs$lang$applyTo = hash_set__1.cljs$lang$applyTo;
  hash_set.cljs$lang$arity$0 = hash_set__0;
  hash_set.cljs$lang$arity$variadic = hash_set__1.cljs$lang$arity$variadic;
  return hash_set
}();
cljs.core.set = function set(coll) {
  return cljs.core.apply.call(null, cljs.core.hash_set, coll)
};
cljs.core.sorted_set = function() {
  var sorted_set__delegate = function(keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, cljs.core.PersistentTreeSet.EMPTY, keys)
  };
  var sorted_set = function(var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return sorted_set__delegate.call(this, keys)
  };
  sorted_set.cljs$lang$maxFixedArity = 0;
  sorted_set.cljs$lang$applyTo = function(arglist__9365) {
    var keys = cljs.core.seq(arglist__9365);
    return sorted_set__delegate(keys)
  };
  sorted_set.cljs$lang$arity$variadic = sorted_set__delegate;
  return sorted_set
}();
cljs.core.sorted_set_by = function() {
  var sorted_set_by__delegate = function(comparator, keys) {
    return cljs.core.reduce.call(null, cljs.core._conj, new cljs.core.PersistentTreeSet(null, cljs.core.sorted_map_by.call(null, comparator), 0), keys)
  };
  var sorted_set_by = function(comparator, var_args) {
    var keys = null;
    if(goog.isDef(var_args)) {
      keys = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return sorted_set_by__delegate.call(this, comparator, keys)
  };
  sorted_set_by.cljs$lang$maxFixedArity = 1;
  sorted_set_by.cljs$lang$applyTo = function(arglist__9367) {
    var comparator = cljs.core.first(arglist__9367);
    var keys = cljs.core.rest(arglist__9367);
    return sorted_set_by__delegate(comparator, keys)
  };
  sorted_set_by.cljs$lang$arity$variadic = sorted_set_by__delegate;
  return sorted_set_by
}();
cljs.core.replace = function replace(smap, coll) {
  if(cljs.core.vector_QMARK_.call(null, coll)) {
    var n__9373 = cljs.core.count.call(null, coll);
    return cljs.core.reduce.call(null, function(v, i) {
      var temp__4090__auto____9374 = cljs.core.find.call(null, smap, cljs.core.nth.call(null, v, i));
      if(cljs.core.truth_(temp__4090__auto____9374)) {
        var e__9375 = temp__4090__auto____9374;
        return cljs.core.assoc.call(null, v, i, cljs.core.second.call(null, e__9375))
      }else {
        return v
      }
    }, coll, cljs.core.take.call(null, n__9373, cljs.core.iterate.call(null, cljs.core.inc, 0)))
  }else {
    return cljs.core.map.call(null, function(p1__9366_SHARP_) {
      var temp__4090__auto____9376 = cljs.core.find.call(null, smap, p1__9366_SHARP_);
      if(cljs.core.truth_(temp__4090__auto____9376)) {
        var e__9377 = temp__4090__auto____9376;
        return cljs.core.second.call(null, e__9377)
      }else {
        return p1__9366_SHARP_
      }
    }, coll)
  }
};
cljs.core.distinct = function distinct(coll) {
  var step__9407 = function step(xs, seen) {
    return new cljs.core.LazySeq(null, false, function() {
      return function(p__9400, seen) {
        while(true) {
          var vec__9401__9402 = p__9400;
          var f__9403 = cljs.core.nth.call(null, vec__9401__9402, 0, null);
          var xs__9404 = vec__9401__9402;
          var temp__4092__auto____9405 = cljs.core.seq.call(null, xs__9404);
          if(temp__4092__auto____9405) {
            var s__9406 = temp__4092__auto____9405;
            if(cljs.core.contains_QMARK_.call(null, seen, f__9403)) {
              var G__9408 = cljs.core.rest.call(null, s__9406);
              var G__9409 = seen;
              p__9400 = G__9408;
              seen = G__9409;
              continue
            }else {
              return cljs.core.cons.call(null, f__9403, step.call(null, cljs.core.rest.call(null, s__9406), cljs.core.conj.call(null, seen, f__9403)))
            }
          }else {
            return null
          }
          break
        }
      }.call(null, xs, seen)
    }, null)
  };
  return step__9407.call(null, coll, cljs.core.PersistentHashSet.EMPTY)
};
cljs.core.butlast = function butlast(s) {
  var ret__9412 = cljs.core.PersistentVector.EMPTY;
  var s__9413 = s;
  while(true) {
    if(cljs.core.next.call(null, s__9413)) {
      var G__9414 = cljs.core.conj.call(null, ret__9412, cljs.core.first.call(null, s__9413));
      var G__9415 = cljs.core.next.call(null, s__9413);
      ret__9412 = G__9414;
      s__9413 = G__9415;
      continue
    }else {
      return cljs.core.seq.call(null, ret__9412)
    }
    break
  }
};
cljs.core.name = function name(x) {
  if(cljs.core.string_QMARK_.call(null, x)) {
    return x
  }else {
    if(function() {
      var or__3943__auto____9418 = cljs.core.keyword_QMARK_.call(null, x);
      if(or__3943__auto____9418) {
        return or__3943__auto____9418
      }else {
        return cljs.core.symbol_QMARK_.call(null, x)
      }
    }()) {
      var i__9419 = x.lastIndexOf("/");
      if(i__9419 < 0) {
        return cljs.core.subs.call(null, x, 2)
      }else {
        return cljs.core.subs.call(null, x, i__9419 + 1)
      }
    }else {
      if("\ufdd0'else") {
        throw new Error([cljs.core.str("Doesn't support name: "), cljs.core.str(x)].join(""));
      }else {
        return null
      }
    }
  }
};
cljs.core.namespace = function namespace(x) {
  if(function() {
    var or__3943__auto____9422 = cljs.core.keyword_QMARK_.call(null, x);
    if(or__3943__auto____9422) {
      return or__3943__auto____9422
    }else {
      return cljs.core.symbol_QMARK_.call(null, x)
    }
  }()) {
    var i__9423 = x.lastIndexOf("/");
    if(i__9423 > -1) {
      return cljs.core.subs.call(null, x, 2, i__9423)
    }else {
      return null
    }
  }else {
    throw new Error([cljs.core.str("Doesn't support namespace: "), cljs.core.str(x)].join(""));
  }
};
cljs.core.zipmap = function zipmap(keys, vals) {
  var map__9430 = cljs.core.ObjMap.EMPTY;
  var ks__9431 = cljs.core.seq.call(null, keys);
  var vs__9432 = cljs.core.seq.call(null, vals);
  while(true) {
    if(function() {
      var and__3941__auto____9433 = ks__9431;
      if(and__3941__auto____9433) {
        return vs__9432
      }else {
        return and__3941__auto____9433
      }
    }()) {
      var G__9434 = cljs.core.assoc.call(null, map__9430, cljs.core.first.call(null, ks__9431), cljs.core.first.call(null, vs__9432));
      var G__9435 = cljs.core.next.call(null, ks__9431);
      var G__9436 = cljs.core.next.call(null, vs__9432);
      map__9430 = G__9434;
      ks__9431 = G__9435;
      vs__9432 = G__9436;
      continue
    }else {
      return map__9430
    }
    break
  }
};
cljs.core.max_key = function() {
  var max_key = null;
  var max_key__2 = function(k, x) {
    return x
  };
  var max_key__3 = function(k, x, y) {
    if(k.call(null, x) > k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var max_key__4 = function() {
    var G__9439__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9424_SHARP_, p2__9425_SHARP_) {
        return max_key.call(null, k, p1__9424_SHARP_, p2__9425_SHARP_)
      }, max_key.call(null, k, x, y), more)
    };
    var G__9439 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9439__delegate.call(this, k, x, y, more)
    };
    G__9439.cljs$lang$maxFixedArity = 3;
    G__9439.cljs$lang$applyTo = function(arglist__9440) {
      var k = cljs.core.first(arglist__9440);
      var x = cljs.core.first(cljs.core.next(arglist__9440));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9440)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9440)));
      return G__9439__delegate(k, x, y, more)
    };
    G__9439.cljs$lang$arity$variadic = G__9439__delegate;
    return G__9439
  }();
  max_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return max_key__2.call(this, k, x);
      case 3:
        return max_key__3.call(this, k, x, y);
      default:
        return max_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  max_key.cljs$lang$maxFixedArity = 3;
  max_key.cljs$lang$applyTo = max_key__4.cljs$lang$applyTo;
  max_key.cljs$lang$arity$2 = max_key__2;
  max_key.cljs$lang$arity$3 = max_key__3;
  max_key.cljs$lang$arity$variadic = max_key__4.cljs$lang$arity$variadic;
  return max_key
}();
cljs.core.min_key = function() {
  var min_key = null;
  var min_key__2 = function(k, x) {
    return x
  };
  var min_key__3 = function(k, x, y) {
    if(k.call(null, x) < k.call(null, y)) {
      return x
    }else {
      return y
    }
  };
  var min_key__4 = function() {
    var G__9441__delegate = function(k, x, y, more) {
      return cljs.core.reduce.call(null, function(p1__9437_SHARP_, p2__9438_SHARP_) {
        return min_key.call(null, k, p1__9437_SHARP_, p2__9438_SHARP_)
      }, min_key.call(null, k, x, y), more)
    };
    var G__9441 = function(k, x, y, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9441__delegate.call(this, k, x, y, more)
    };
    G__9441.cljs$lang$maxFixedArity = 3;
    G__9441.cljs$lang$applyTo = function(arglist__9442) {
      var k = cljs.core.first(arglist__9442);
      var x = cljs.core.first(cljs.core.next(arglist__9442));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9442)));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9442)));
      return G__9441__delegate(k, x, y, more)
    };
    G__9441.cljs$lang$arity$variadic = G__9441__delegate;
    return G__9441
  }();
  min_key = function(k, x, y, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return min_key__2.call(this, k, x);
      case 3:
        return min_key__3.call(this, k, x, y);
      default:
        return min_key__4.cljs$lang$arity$variadic(k, x, y, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  min_key.cljs$lang$maxFixedArity = 3;
  min_key.cljs$lang$applyTo = min_key__4.cljs$lang$applyTo;
  min_key.cljs$lang$arity$2 = min_key__2;
  min_key.cljs$lang$arity$3 = min_key__3;
  min_key.cljs$lang$arity$variadic = min_key__4.cljs$lang$arity$variadic;
  return min_key
}();
cljs.core.partition_all = function() {
  var partition_all = null;
  var partition_all__2 = function(n, coll) {
    return partition_all.call(null, n, n, coll)
  };
  var partition_all__3 = function(n, step, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9445 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9445) {
        var s__9446 = temp__4092__auto____9445;
        return cljs.core.cons.call(null, cljs.core.take.call(null, n, s__9446), partition_all.call(null, n, step, cljs.core.drop.call(null, step, s__9446)))
      }else {
        return null
      }
    }, null)
  };
  partition_all = function(n, step, coll) {
    switch(arguments.length) {
      case 2:
        return partition_all__2.call(this, n, step);
      case 3:
        return partition_all__3.call(this, n, step, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  partition_all.cljs$lang$arity$2 = partition_all__2;
  partition_all.cljs$lang$arity$3 = partition_all__3;
  return partition_all
}();
cljs.core.take_while = function take_while(pred, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9449 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9449) {
      var s__9450 = temp__4092__auto____9449;
      if(cljs.core.truth_(pred.call(null, cljs.core.first.call(null, s__9450)))) {
        return cljs.core.cons.call(null, cljs.core.first.call(null, s__9450), take_while.call(null, pred, cljs.core.rest.call(null, s__9450)))
      }else {
        return null
      }
    }else {
      return null
    }
  }, null)
};
cljs.core.mk_bound_fn = function mk_bound_fn(sc, test, key) {
  return function(e) {
    var comp__9452 = cljs.core._comparator.call(null, sc);
    return test.call(null, comp__9452.call(null, cljs.core._entry_key.call(null, sc, e), key), 0)
  }
};
cljs.core.subseq = function() {
  var subseq = null;
  var subseq__3 = function(sc, test, key) {
    var include__9464 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._GT_, cljs.core._GT__EQ_]).call(null, test))) {
      var temp__4092__auto____9465 = cljs.core._sorted_seq_from.call(null, sc, key, true);
      if(cljs.core.truth_(temp__4092__auto____9465)) {
        var vec__9466__9467 = temp__4092__auto____9465;
        var e__9468 = cljs.core.nth.call(null, vec__9466__9467, 0, null);
        var s__9469 = vec__9466__9467;
        if(cljs.core.truth_(include__9464.call(null, e__9468))) {
          return s__9469
        }else {
          return cljs.core.next.call(null, s__9469)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9464, cljs.core._sorted_seq.call(null, sc, true))
    }
  };
  var subseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9470 = cljs.core._sorted_seq_from.call(null, sc, start_key, true);
    if(cljs.core.truth_(temp__4092__auto____9470)) {
      var vec__9471__9472 = temp__4092__auto____9470;
      var e__9473 = cljs.core.nth.call(null, vec__9471__9472, 0, null);
      var s__9474 = vec__9471__9472;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, end_test, end_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, start_test, start_key).call(null, e__9473)) ? s__9474 : cljs.core.next.call(null, s__9474))
    }else {
      return null
    }
  };
  subseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return subseq__3.call(this, sc, start_test, start_key);
      case 5:
        return subseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  subseq.cljs$lang$arity$3 = subseq__3;
  subseq.cljs$lang$arity$5 = subseq__5;
  return subseq
}();
cljs.core.rsubseq = function() {
  var rsubseq = null;
  var rsubseq__3 = function(sc, test, key) {
    var include__9486 = cljs.core.mk_bound_fn.call(null, sc, test, key);
    if(cljs.core.truth_(cljs.core.PersistentHashSet.fromArray([cljs.core._LT_, cljs.core._LT__EQ_]).call(null, test))) {
      var temp__4092__auto____9487 = cljs.core._sorted_seq_from.call(null, sc, key, false);
      if(cljs.core.truth_(temp__4092__auto____9487)) {
        var vec__9488__9489 = temp__4092__auto____9487;
        var e__9490 = cljs.core.nth.call(null, vec__9488__9489, 0, null);
        var s__9491 = vec__9488__9489;
        if(cljs.core.truth_(include__9486.call(null, e__9490))) {
          return s__9491
        }else {
          return cljs.core.next.call(null, s__9491)
        }
      }else {
        return null
      }
    }else {
      return cljs.core.take_while.call(null, include__9486, cljs.core._sorted_seq.call(null, sc, false))
    }
  };
  var rsubseq__5 = function(sc, start_test, start_key, end_test, end_key) {
    var temp__4092__auto____9492 = cljs.core._sorted_seq_from.call(null, sc, end_key, false);
    if(cljs.core.truth_(temp__4092__auto____9492)) {
      var vec__9493__9494 = temp__4092__auto____9492;
      var e__9495 = cljs.core.nth.call(null, vec__9493__9494, 0, null);
      var s__9496 = vec__9493__9494;
      return cljs.core.take_while.call(null, cljs.core.mk_bound_fn.call(null, sc, start_test, start_key), cljs.core.truth_(cljs.core.mk_bound_fn.call(null, sc, end_test, end_key).call(null, e__9495)) ? s__9496 : cljs.core.next.call(null, s__9496))
    }else {
      return null
    }
  };
  rsubseq = function(sc, start_test, start_key, end_test, end_key) {
    switch(arguments.length) {
      case 3:
        return rsubseq__3.call(this, sc, start_test, start_key);
      case 5:
        return rsubseq__5.call(this, sc, start_test, start_key, end_test, end_key)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rsubseq.cljs$lang$arity$3 = rsubseq__3;
  rsubseq.cljs$lang$arity$5 = rsubseq__5;
  return rsubseq
}();
cljs.core.Range = function(meta, start, end, step, __hash) {
  this.meta = meta;
  this.start = start;
  this.end = end;
  this.step = step;
  this.__hash = __hash;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 32375006
};
cljs.core.Range.cljs$lang$type = true;
cljs.core.Range.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Range")
};
cljs.core.Range.prototype.cljs$core$IHash$_hash$arity$1 = function(rng) {
  var this__9497 = this;
  var h__2141__auto____9498 = this__9497.__hash;
  if(!(h__2141__auto____9498 == null)) {
    return h__2141__auto____9498
  }else {
    var h__2141__auto____9499 = cljs.core.hash_coll.call(null, rng);
    this__9497.__hash = h__2141__auto____9499;
    return h__2141__auto____9499
  }
};
cljs.core.Range.prototype.cljs$core$INext$_next$arity$1 = function(rng) {
  var this__9500 = this;
  if(this__9500.step > 0) {
    if(this__9500.start + this__9500.step < this__9500.end) {
      return new cljs.core.Range(this__9500.meta, this__9500.start + this__9500.step, this__9500.end, this__9500.step, null)
    }else {
      return null
    }
  }else {
    if(this__9500.start + this__9500.step > this__9500.end) {
      return new cljs.core.Range(this__9500.meta, this__9500.start + this__9500.step, this__9500.end, this__9500.step, null)
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICollection$_conj$arity$2 = function(rng, o) {
  var this__9501 = this;
  return cljs.core.cons.call(null, o, rng)
};
cljs.core.Range.prototype.toString = function() {
  var this__9502 = this;
  var this__9503 = this;
  return cljs.core.pr_str.call(null, this__9503)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$2 = function(rng, f) {
  var this__9504 = this;
  return cljs.core.ci_reduce.call(null, rng, f)
};
cljs.core.Range.prototype.cljs$core$IReduce$_reduce$arity$3 = function(rng, f, s) {
  var this__9505 = this;
  return cljs.core.ci_reduce.call(null, rng, f, s)
};
cljs.core.Range.prototype.cljs$core$ISeqable$_seq$arity$1 = function(rng) {
  var this__9506 = this;
  if(this__9506.step > 0) {
    if(this__9506.start < this__9506.end) {
      return rng
    }else {
      return null
    }
  }else {
    if(this__9506.start > this__9506.end) {
      return rng
    }else {
      return null
    }
  }
};
cljs.core.Range.prototype.cljs$core$ICounted$_count$arity$1 = function(rng) {
  var this__9507 = this;
  if(cljs.core.not.call(null, rng.cljs$core$ISeqable$_seq$arity$1(rng))) {
    return 0
  }else {
    return Math.ceil((this__9507.end - this__9507.start) / this__9507.step)
  }
};
cljs.core.Range.prototype.cljs$core$ISeq$_first$arity$1 = function(rng) {
  var this__9508 = this;
  return this__9508.start
};
cljs.core.Range.prototype.cljs$core$ISeq$_rest$arity$1 = function(rng) {
  var this__9509 = this;
  if(!(rng.cljs$core$ISeqable$_seq$arity$1(rng) == null)) {
    return new cljs.core.Range(this__9509.meta, this__9509.start + this__9509.step, this__9509.end, this__9509.step, null)
  }else {
    return cljs.core.List.EMPTY
  }
};
cljs.core.Range.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(rng, other) {
  var this__9510 = this;
  return cljs.core.equiv_sequential.call(null, rng, other)
};
cljs.core.Range.prototype.cljs$core$IWithMeta$_with_meta$arity$2 = function(rng, meta) {
  var this__9511 = this;
  return new cljs.core.Range(meta, this__9511.start, this__9511.end, this__9511.step, this__9511.__hash)
};
cljs.core.Range.prototype.cljs$core$IMeta$_meta$arity$1 = function(rng) {
  var this__9512 = this;
  return this__9512.meta
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$2 = function(rng, n) {
  var this__9513 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9513.start + n * this__9513.step
  }else {
    if(function() {
      var and__3941__auto____9514 = this__9513.start > this__9513.end;
      if(and__3941__auto____9514) {
        return this__9513.step === 0
      }else {
        return and__3941__auto____9514
      }
    }()) {
      return this__9513.start
    }else {
      throw new Error("Index out of bounds");
    }
  }
};
cljs.core.Range.prototype.cljs$core$IIndexed$_nth$arity$3 = function(rng, n, not_found) {
  var this__9515 = this;
  if(n < rng.cljs$core$ICounted$_count$arity$1(rng)) {
    return this__9515.start + n * this__9515.step
  }else {
    if(function() {
      var and__3941__auto____9516 = this__9515.start > this__9515.end;
      if(and__3941__auto____9516) {
        return this__9515.step === 0
      }else {
        return and__3941__auto____9516
      }
    }()) {
      return this__9515.start
    }else {
      return not_found
    }
  }
};
cljs.core.Range.prototype.cljs$core$IEmptyableCollection$_empty$arity$1 = function(rng) {
  var this__9517 = this;
  return cljs.core.with_meta.call(null, cljs.core.List.EMPTY, this__9517.meta)
};
cljs.core.Range;
cljs.core.range = function() {
  var range = null;
  var range__0 = function() {
    return range.call(null, 0, Number.MAX_VALUE, 1)
  };
  var range__1 = function(end) {
    return range.call(null, 0, end, 1)
  };
  var range__2 = function(start, end) {
    return range.call(null, start, end, 1)
  };
  var range__3 = function(start, end, step) {
    return new cljs.core.Range(null, start, end, step, null)
  };
  range = function(start, end, step) {
    switch(arguments.length) {
      case 0:
        return range__0.call(this);
      case 1:
        return range__1.call(this, start);
      case 2:
        return range__2.call(this, start, end);
      case 3:
        return range__3.call(this, start, end, step)
    }
    throw"Invalid arity: " + arguments.length;
  };
  range.cljs$lang$arity$0 = range__0;
  range.cljs$lang$arity$1 = range__1;
  range.cljs$lang$arity$2 = range__2;
  range.cljs$lang$arity$3 = range__3;
  return range
}();
cljs.core.take_nth = function take_nth(n, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9520 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9520) {
      var s__9521 = temp__4092__auto____9520;
      return cljs.core.cons.call(null, cljs.core.first.call(null, s__9521), take_nth.call(null, n, cljs.core.drop.call(null, n, s__9521)))
    }else {
      return null
    }
  }, null)
};
cljs.core.split_with = function split_with(pred, coll) {
  return cljs.core.PersistentVector.fromArray([cljs.core.take_while.call(null, pred, coll), cljs.core.drop_while.call(null, pred, coll)], true)
};
cljs.core.partition_by = function partition_by(f, coll) {
  return new cljs.core.LazySeq(null, false, function() {
    var temp__4092__auto____9528 = cljs.core.seq.call(null, coll);
    if(temp__4092__auto____9528) {
      var s__9529 = temp__4092__auto____9528;
      var fst__9530 = cljs.core.first.call(null, s__9529);
      var fv__9531 = f.call(null, fst__9530);
      var run__9532 = cljs.core.cons.call(null, fst__9530, cljs.core.take_while.call(null, function(p1__9522_SHARP_) {
        return cljs.core._EQ_.call(null, fv__9531, f.call(null, p1__9522_SHARP_))
      }, cljs.core.next.call(null, s__9529)));
      return cljs.core.cons.call(null, run__9532, partition_by.call(null, f, cljs.core.seq.call(null, cljs.core.drop.call(null, cljs.core.count.call(null, run__9532), s__9529))))
    }else {
      return null
    }
  }, null)
};
cljs.core.frequencies = function frequencies(coll) {
  return cljs.core.persistent_BANG_.call(null, cljs.core.reduce.call(null, function(counts, x) {
    return cljs.core.assoc_BANG_.call(null, counts, x, cljs.core._lookup.call(null, counts, x, 0) + 1)
  }, cljs.core.transient$.call(null, cljs.core.ObjMap.EMPTY), coll))
};
cljs.core.reductions = function() {
  var reductions = null;
  var reductions__2 = function(f, coll) {
    return new cljs.core.LazySeq(null, false, function() {
      var temp__4090__auto____9547 = cljs.core.seq.call(null, coll);
      if(temp__4090__auto____9547) {
        var s__9548 = temp__4090__auto____9547;
        return reductions.call(null, f, cljs.core.first.call(null, s__9548), cljs.core.rest.call(null, s__9548))
      }else {
        return cljs.core.list.call(null, f.call(null))
      }
    }, null)
  };
  var reductions__3 = function(f, init, coll) {
    return cljs.core.cons.call(null, init, new cljs.core.LazySeq(null, false, function() {
      var temp__4092__auto____9549 = cljs.core.seq.call(null, coll);
      if(temp__4092__auto____9549) {
        var s__9550 = temp__4092__auto____9549;
        return reductions.call(null, f, f.call(null, init, cljs.core.first.call(null, s__9550)), cljs.core.rest.call(null, s__9550))
      }else {
        return null
      }
    }, null))
  };
  reductions = function(f, init, coll) {
    switch(arguments.length) {
      case 2:
        return reductions__2.call(this, f, init);
      case 3:
        return reductions__3.call(this, f, init, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  reductions.cljs$lang$arity$2 = reductions__2;
  reductions.cljs$lang$arity$3 = reductions__3;
  return reductions
}();
cljs.core.juxt = function() {
  var juxt = null;
  var juxt__1 = function(f) {
    return function() {
      var G__9553 = null;
      var G__9553__0 = function() {
        return cljs.core.vector.call(null, f.call(null))
      };
      var G__9553__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x))
      };
      var G__9553__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y))
      };
      var G__9553__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z))
      };
      var G__9553__4 = function() {
        var G__9554__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args))
        };
        var G__9554 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9554__delegate.call(this, x, y, z, args)
        };
        G__9554.cljs$lang$maxFixedArity = 3;
        G__9554.cljs$lang$applyTo = function(arglist__9555) {
          var x = cljs.core.first(arglist__9555);
          var y = cljs.core.first(cljs.core.next(arglist__9555));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9555)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9555)));
          return G__9554__delegate(x, y, z, args)
        };
        G__9554.cljs$lang$arity$variadic = G__9554__delegate;
        return G__9554
      }();
      G__9553 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9553__0.call(this);
          case 1:
            return G__9553__1.call(this, x);
          case 2:
            return G__9553__2.call(this, x, y);
          case 3:
            return G__9553__3.call(this, x, y, z);
          default:
            return G__9553__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9553.cljs$lang$maxFixedArity = 3;
      G__9553.cljs$lang$applyTo = G__9553__4.cljs$lang$applyTo;
      return G__9553
    }()
  };
  var juxt__2 = function(f, g) {
    return function() {
      var G__9556 = null;
      var G__9556__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null))
      };
      var G__9556__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x))
      };
      var G__9556__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y))
      };
      var G__9556__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z))
      };
      var G__9556__4 = function() {
        var G__9557__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args))
        };
        var G__9557 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9557__delegate.call(this, x, y, z, args)
        };
        G__9557.cljs$lang$maxFixedArity = 3;
        G__9557.cljs$lang$applyTo = function(arglist__9558) {
          var x = cljs.core.first(arglist__9558);
          var y = cljs.core.first(cljs.core.next(arglist__9558));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9558)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9558)));
          return G__9557__delegate(x, y, z, args)
        };
        G__9557.cljs$lang$arity$variadic = G__9557__delegate;
        return G__9557
      }();
      G__9556 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9556__0.call(this);
          case 1:
            return G__9556__1.call(this, x);
          case 2:
            return G__9556__2.call(this, x, y);
          case 3:
            return G__9556__3.call(this, x, y, z);
          default:
            return G__9556__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9556.cljs$lang$maxFixedArity = 3;
      G__9556.cljs$lang$applyTo = G__9556__4.cljs$lang$applyTo;
      return G__9556
    }()
  };
  var juxt__3 = function(f, g, h) {
    return function() {
      var G__9559 = null;
      var G__9559__0 = function() {
        return cljs.core.vector.call(null, f.call(null), g.call(null), h.call(null))
      };
      var G__9559__1 = function(x) {
        return cljs.core.vector.call(null, f.call(null, x), g.call(null, x), h.call(null, x))
      };
      var G__9559__2 = function(x, y) {
        return cljs.core.vector.call(null, f.call(null, x, y), g.call(null, x, y), h.call(null, x, y))
      };
      var G__9559__3 = function(x, y, z) {
        return cljs.core.vector.call(null, f.call(null, x, y, z), g.call(null, x, y, z), h.call(null, x, y, z))
      };
      var G__9559__4 = function() {
        var G__9560__delegate = function(x, y, z, args) {
          return cljs.core.vector.call(null, cljs.core.apply.call(null, f, x, y, z, args), cljs.core.apply.call(null, g, x, y, z, args), cljs.core.apply.call(null, h, x, y, z, args))
        };
        var G__9560 = function(x, y, z, var_args) {
          var args = null;
          if(goog.isDef(var_args)) {
            args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
          }
          return G__9560__delegate.call(this, x, y, z, args)
        };
        G__9560.cljs$lang$maxFixedArity = 3;
        G__9560.cljs$lang$applyTo = function(arglist__9561) {
          var x = cljs.core.first(arglist__9561);
          var y = cljs.core.first(cljs.core.next(arglist__9561));
          var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9561)));
          var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9561)));
          return G__9560__delegate(x, y, z, args)
        };
        G__9560.cljs$lang$arity$variadic = G__9560__delegate;
        return G__9560
      }();
      G__9559 = function(x, y, z, var_args) {
        var args = var_args;
        switch(arguments.length) {
          case 0:
            return G__9559__0.call(this);
          case 1:
            return G__9559__1.call(this, x);
          case 2:
            return G__9559__2.call(this, x, y);
          case 3:
            return G__9559__3.call(this, x, y, z);
          default:
            return G__9559__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
        }
        throw"Invalid arity: " + arguments.length;
      };
      G__9559.cljs$lang$maxFixedArity = 3;
      G__9559.cljs$lang$applyTo = G__9559__4.cljs$lang$applyTo;
      return G__9559
    }()
  };
  var juxt__4 = function() {
    var G__9562__delegate = function(f, g, h, fs) {
      var fs__9552 = cljs.core.list_STAR_.call(null, f, g, h, fs);
      return function() {
        var G__9563 = null;
        var G__9563__0 = function() {
          return cljs.core.reduce.call(null, function(p1__9533_SHARP_, p2__9534_SHARP_) {
            return cljs.core.conj.call(null, p1__9533_SHARP_, p2__9534_SHARP_.call(null))
          }, cljs.core.PersistentVector.EMPTY, fs__9552)
        };
        var G__9563__1 = function(x) {
          return cljs.core.reduce.call(null, function(p1__9535_SHARP_, p2__9536_SHARP_) {
            return cljs.core.conj.call(null, p1__9535_SHARP_, p2__9536_SHARP_.call(null, x))
          }, cljs.core.PersistentVector.EMPTY, fs__9552)
        };
        var G__9563__2 = function(x, y) {
          return cljs.core.reduce.call(null, function(p1__9537_SHARP_, p2__9538_SHARP_) {
            return cljs.core.conj.call(null, p1__9537_SHARP_, p2__9538_SHARP_.call(null, x, y))
          }, cljs.core.PersistentVector.EMPTY, fs__9552)
        };
        var G__9563__3 = function(x, y, z) {
          return cljs.core.reduce.call(null, function(p1__9539_SHARP_, p2__9540_SHARP_) {
            return cljs.core.conj.call(null, p1__9539_SHARP_, p2__9540_SHARP_.call(null, x, y, z))
          }, cljs.core.PersistentVector.EMPTY, fs__9552)
        };
        var G__9563__4 = function() {
          var G__9564__delegate = function(x, y, z, args) {
            return cljs.core.reduce.call(null, function(p1__9541_SHARP_, p2__9542_SHARP_) {
              return cljs.core.conj.call(null, p1__9541_SHARP_, cljs.core.apply.call(null, p2__9542_SHARP_, x, y, z, args))
            }, cljs.core.PersistentVector.EMPTY, fs__9552)
          };
          var G__9564 = function(x, y, z, var_args) {
            var args = null;
            if(goog.isDef(var_args)) {
              args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
            }
            return G__9564__delegate.call(this, x, y, z, args)
          };
          G__9564.cljs$lang$maxFixedArity = 3;
          G__9564.cljs$lang$applyTo = function(arglist__9565) {
            var x = cljs.core.first(arglist__9565);
            var y = cljs.core.first(cljs.core.next(arglist__9565));
            var z = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9565)));
            var args = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9565)));
            return G__9564__delegate(x, y, z, args)
          };
          G__9564.cljs$lang$arity$variadic = G__9564__delegate;
          return G__9564
        }();
        G__9563 = function(x, y, z, var_args) {
          var args = var_args;
          switch(arguments.length) {
            case 0:
              return G__9563__0.call(this);
            case 1:
              return G__9563__1.call(this, x);
            case 2:
              return G__9563__2.call(this, x, y);
            case 3:
              return G__9563__3.call(this, x, y, z);
            default:
              return G__9563__4.cljs$lang$arity$variadic(x, y, z, cljs.core.array_seq(arguments, 3))
          }
          throw"Invalid arity: " + arguments.length;
        };
        G__9563.cljs$lang$maxFixedArity = 3;
        G__9563.cljs$lang$applyTo = G__9563__4.cljs$lang$applyTo;
        return G__9563
      }()
    };
    var G__9562 = function(f, g, h, var_args) {
      var fs = null;
      if(goog.isDef(var_args)) {
        fs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 3), 0)
      }
      return G__9562__delegate.call(this, f, g, h, fs)
    };
    G__9562.cljs$lang$maxFixedArity = 3;
    G__9562.cljs$lang$applyTo = function(arglist__9566) {
      var f = cljs.core.first(arglist__9566);
      var g = cljs.core.first(cljs.core.next(arglist__9566));
      var h = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9566)));
      var fs = cljs.core.rest(cljs.core.next(cljs.core.next(arglist__9566)));
      return G__9562__delegate(f, g, h, fs)
    };
    G__9562.cljs$lang$arity$variadic = G__9562__delegate;
    return G__9562
  }();
  juxt = function(f, g, h, var_args) {
    var fs = var_args;
    switch(arguments.length) {
      case 1:
        return juxt__1.call(this, f);
      case 2:
        return juxt__2.call(this, f, g);
      case 3:
        return juxt__3.call(this, f, g, h);
      default:
        return juxt__4.cljs$lang$arity$variadic(f, g, h, cljs.core.array_seq(arguments, 3))
    }
    throw"Invalid arity: " + arguments.length;
  };
  juxt.cljs$lang$maxFixedArity = 3;
  juxt.cljs$lang$applyTo = juxt__4.cljs$lang$applyTo;
  juxt.cljs$lang$arity$1 = juxt__1;
  juxt.cljs$lang$arity$2 = juxt__2;
  juxt.cljs$lang$arity$3 = juxt__3;
  juxt.cljs$lang$arity$variadic = juxt__4.cljs$lang$arity$variadic;
  return juxt
}();
cljs.core.dorun = function() {
  var dorun = null;
  var dorun__1 = function(coll) {
    while(true) {
      if(cljs.core.seq.call(null, coll)) {
        var G__9569 = cljs.core.next.call(null, coll);
        coll = G__9569;
        continue
      }else {
        return null
      }
      break
    }
  };
  var dorun__2 = function(n, coll) {
    while(true) {
      if(cljs.core.truth_(function() {
        var and__3941__auto____9568 = cljs.core.seq.call(null, coll);
        if(and__3941__auto____9568) {
          return n > 0
        }else {
          return and__3941__auto____9568
        }
      }())) {
        var G__9570 = n - 1;
        var G__9571 = cljs.core.next.call(null, coll);
        n = G__9570;
        coll = G__9571;
        continue
      }else {
        return null
      }
      break
    }
  };
  dorun = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return dorun__1.call(this, n);
      case 2:
        return dorun__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  dorun.cljs$lang$arity$1 = dorun__1;
  dorun.cljs$lang$arity$2 = dorun__2;
  return dorun
}();
cljs.core.doall = function() {
  var doall = null;
  var doall__1 = function(coll) {
    cljs.core.dorun.call(null, coll);
    return coll
  };
  var doall__2 = function(n, coll) {
    cljs.core.dorun.call(null, n, coll);
    return coll
  };
  doall = function(n, coll) {
    switch(arguments.length) {
      case 1:
        return doall__1.call(this, n);
      case 2:
        return doall__2.call(this, n, coll)
    }
    throw"Invalid arity: " + arguments.length;
  };
  doall.cljs$lang$arity$1 = doall__1;
  doall.cljs$lang$arity$2 = doall__2;
  return doall
}();
cljs.core.regexp_QMARK_ = function regexp_QMARK_(o) {
  return o instanceof RegExp
};
cljs.core.re_matches = function re_matches(re, s) {
  var matches__9573 = re.exec(s);
  if(cljs.core._EQ_.call(null, cljs.core.first.call(null, matches__9573), s)) {
    if(cljs.core.count.call(null, matches__9573) === 1) {
      return cljs.core.first.call(null, matches__9573)
    }else {
      return cljs.core.vec.call(null, matches__9573)
    }
  }else {
    return null
  }
};
cljs.core.re_find = function re_find(re, s) {
  var matches__9575 = re.exec(s);
  if(matches__9575 == null) {
    return null
  }else {
    if(cljs.core.count.call(null, matches__9575) === 1) {
      return cljs.core.first.call(null, matches__9575)
    }else {
      return cljs.core.vec.call(null, matches__9575)
    }
  }
};
cljs.core.re_seq = function re_seq(re, s) {
  var match_data__9580 = cljs.core.re_find.call(null, re, s);
  var match_idx__9581 = s.search(re);
  var match_str__9582 = cljs.core.coll_QMARK_.call(null, match_data__9580) ? cljs.core.first.call(null, match_data__9580) : match_data__9580;
  var post_match__9583 = cljs.core.subs.call(null, s, match_idx__9581 + cljs.core.count.call(null, match_str__9582));
  if(cljs.core.truth_(match_data__9580)) {
    return new cljs.core.LazySeq(null, false, function() {
      return cljs.core.cons.call(null, match_data__9580, re_seq.call(null, re, post_match__9583))
    }, null)
  }else {
    return null
  }
};
cljs.core.re_pattern = function re_pattern(s) {
  var vec__9590__9591 = cljs.core.re_find.call(null, /^(?:\(\?([idmsux]*)\))?(.*)/, s);
  var ___9592 = cljs.core.nth.call(null, vec__9590__9591, 0, null);
  var flags__9593 = cljs.core.nth.call(null, vec__9590__9591, 1, null);
  var pattern__9594 = cljs.core.nth.call(null, vec__9590__9591, 2, null);
  return new RegExp(pattern__9594, flags__9593)
};
cljs.core.pr_sequential = function pr_sequential(print_one, begin, sep, end, opts, coll) {
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray([begin], true), cljs.core.flatten1.call(null, cljs.core.interpose.call(null, cljs.core.PersistentVector.fromArray([sep], true), cljs.core.map.call(null, function(p1__9584_SHARP_) {
    return print_one.call(null, p1__9584_SHARP_, opts)
  }, coll))), cljs.core.PersistentVector.fromArray([end], true))
};
cljs.core.string_print = function string_print(x) {
  cljs.core._STAR_print_fn_STAR_.call(null, x);
  return null
};
cljs.core.flush = function flush() {
  return null
};
cljs.core.pr_seq = function pr_seq(obj, opts) {
  if(obj == null) {
    return cljs.core.list.call(null, "nil")
  }else {
    if(void 0 === obj) {
      return cljs.core.list.call(null, "#<undefined>")
    }else {
      if("\ufdd0'else") {
        return cljs.core.concat.call(null, cljs.core.truth_(function() {
          var and__3941__auto____9604 = cljs.core._lookup.call(null, opts, "\ufdd0'meta", null);
          if(cljs.core.truth_(and__3941__auto____9604)) {
            var and__3941__auto____9608 = function() {
              var G__9605__9606 = obj;
              if(G__9605__9606) {
                if(function() {
                  var or__3943__auto____9607 = G__9605__9606.cljs$lang$protocol_mask$partition0$ & 131072;
                  if(or__3943__auto____9607) {
                    return or__3943__auto____9607
                  }else {
                    return G__9605__9606.cljs$core$IMeta$
                  }
                }()) {
                  return true
                }else {
                  if(!G__9605__9606.cljs$lang$protocol_mask$partition0$) {
                    return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9605__9606)
                  }else {
                    return false
                  }
                }
              }else {
                return cljs.core.type_satisfies_.call(null, cljs.core.IMeta, G__9605__9606)
              }
            }();
            if(cljs.core.truth_(and__3941__auto____9608)) {
              return cljs.core.meta.call(null, obj)
            }else {
              return and__3941__auto____9608
            }
          }else {
            return and__3941__auto____9604
          }
        }()) ? cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["^"], true), pr_seq.call(null, cljs.core.meta.call(null, obj), opts), cljs.core.PersistentVector.fromArray([" "], true)) : null, function() {
          var and__3941__auto____9609 = !(obj == null);
          if(and__3941__auto____9609) {
            return obj.cljs$lang$type
          }else {
            return and__3941__auto____9609
          }
        }() ? obj.cljs$lang$ctorPrSeq(obj) : function() {
          var G__9610__9611 = obj;
          if(G__9610__9611) {
            if(function() {
              var or__3943__auto____9612 = G__9610__9611.cljs$lang$protocol_mask$partition0$ & 536870912;
              if(or__3943__auto____9612) {
                return or__3943__auto____9612
              }else {
                return G__9610__9611.cljs$core$IPrintable$
              }
            }()) {
              return true
            }else {
              if(!G__9610__9611.cljs$lang$protocol_mask$partition0$) {
                return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9610__9611)
              }else {
                return false
              }
            }
          }else {
            return cljs.core.type_satisfies_.call(null, cljs.core.IPrintable, G__9610__9611)
          }
        }() ? cljs.core._pr_seq.call(null, obj, opts) : cljs.core.truth_(cljs.core.regexp_QMARK_.call(null, obj)) ? cljs.core.list.call(null, '#"', obj.source, '"') : "\ufdd0'else" ? cljs.core.list.call(null, "#<", [cljs.core.str(obj)].join(""), ">") : null)
      }else {
        return null
      }
    }
  }
};
cljs.core.pr_sb = function pr_sb(objs, opts) {
  var sb__9632 = new goog.string.StringBuffer;
  var G__9633__9634 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9633__9634) {
    var string__9635 = cljs.core.first.call(null, G__9633__9634);
    var G__9633__9636 = G__9633__9634;
    while(true) {
      sb__9632.append(string__9635);
      var temp__4092__auto____9637 = cljs.core.next.call(null, G__9633__9636);
      if(temp__4092__auto____9637) {
        var G__9633__9638 = temp__4092__auto____9637;
        var G__9651 = cljs.core.first.call(null, G__9633__9638);
        var G__9652 = G__9633__9638;
        string__9635 = G__9651;
        G__9633__9636 = G__9652;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9639__9640 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9639__9640) {
    var obj__9641 = cljs.core.first.call(null, G__9639__9640);
    var G__9639__9642 = G__9639__9640;
    while(true) {
      sb__9632.append(" ");
      var G__9643__9644 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9641, opts));
      if(G__9643__9644) {
        var string__9645 = cljs.core.first.call(null, G__9643__9644);
        var G__9643__9646 = G__9643__9644;
        while(true) {
          sb__9632.append(string__9645);
          var temp__4092__auto____9647 = cljs.core.next.call(null, G__9643__9646);
          if(temp__4092__auto____9647) {
            var G__9643__9648 = temp__4092__auto____9647;
            var G__9653 = cljs.core.first.call(null, G__9643__9648);
            var G__9654 = G__9643__9648;
            string__9645 = G__9653;
            G__9643__9646 = G__9654;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9649 = cljs.core.next.call(null, G__9639__9642);
      if(temp__4092__auto____9649) {
        var G__9639__9650 = temp__4092__auto____9649;
        var G__9655 = cljs.core.first.call(null, G__9639__9650);
        var G__9656 = G__9639__9650;
        obj__9641 = G__9655;
        G__9639__9642 = G__9656;
        continue
      }else {
      }
      break
    }
  }else {
  }
  return sb__9632
};
cljs.core.pr_str_with_opts = function pr_str_with_opts(objs, opts) {
  return[cljs.core.str(cljs.core.pr_sb.call(null, objs, opts))].join("")
};
cljs.core.prn_str_with_opts = function prn_str_with_opts(objs, opts) {
  var sb__9658 = cljs.core.pr_sb.call(null, objs, opts);
  sb__9658.append("\n");
  return[cljs.core.str(sb__9658)].join("")
};
cljs.core.pr_with_opts = function pr_with_opts(objs, opts) {
  var G__9677__9678 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, cljs.core.first.call(null, objs), opts));
  if(G__9677__9678) {
    var string__9679 = cljs.core.first.call(null, G__9677__9678);
    var G__9677__9680 = G__9677__9678;
    while(true) {
      cljs.core.string_print.call(null, string__9679);
      var temp__4092__auto____9681 = cljs.core.next.call(null, G__9677__9680);
      if(temp__4092__auto____9681) {
        var G__9677__9682 = temp__4092__auto____9681;
        var G__9695 = cljs.core.first.call(null, G__9677__9682);
        var G__9696 = G__9677__9682;
        string__9679 = G__9695;
        G__9677__9680 = G__9696;
        continue
      }else {
      }
      break
    }
  }else {
  }
  var G__9683__9684 = cljs.core.seq.call(null, cljs.core.next.call(null, objs));
  if(G__9683__9684) {
    var obj__9685 = cljs.core.first.call(null, G__9683__9684);
    var G__9683__9686 = G__9683__9684;
    while(true) {
      cljs.core.string_print.call(null, " ");
      var G__9687__9688 = cljs.core.seq.call(null, cljs.core.pr_seq.call(null, obj__9685, opts));
      if(G__9687__9688) {
        var string__9689 = cljs.core.first.call(null, G__9687__9688);
        var G__9687__9690 = G__9687__9688;
        while(true) {
          cljs.core.string_print.call(null, string__9689);
          var temp__4092__auto____9691 = cljs.core.next.call(null, G__9687__9690);
          if(temp__4092__auto____9691) {
            var G__9687__9692 = temp__4092__auto____9691;
            var G__9697 = cljs.core.first.call(null, G__9687__9692);
            var G__9698 = G__9687__9692;
            string__9689 = G__9697;
            G__9687__9690 = G__9698;
            continue
          }else {
          }
          break
        }
      }else {
      }
      var temp__4092__auto____9693 = cljs.core.next.call(null, G__9683__9686);
      if(temp__4092__auto____9693) {
        var G__9683__9694 = temp__4092__auto____9693;
        var G__9699 = cljs.core.first.call(null, G__9683__9694);
        var G__9700 = G__9683__9694;
        obj__9685 = G__9699;
        G__9683__9686 = G__9700;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.newline = function newline(opts) {
  cljs.core.string_print.call(null, "\n");
  if(cljs.core.truth_(cljs.core._lookup.call(null, opts, "\ufdd0'flush-on-newline", null))) {
    return cljs.core.flush.call(null)
  }else {
    return null
  }
};
cljs.core._STAR_flush_on_newline_STAR_ = true;
cljs.core._STAR_print_readably_STAR_ = true;
cljs.core._STAR_print_meta_STAR_ = false;
cljs.core._STAR_print_dup_STAR_ = false;
cljs.core.pr_opts = function pr_opts() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'flush-on-newline", "\ufdd0'readably", "\ufdd0'meta", "\ufdd0'dup"], {"\ufdd0'flush-on-newline":cljs.core._STAR_flush_on_newline_STAR_, "\ufdd0'readably":cljs.core._STAR_print_readably_STAR_, "\ufdd0'meta":cljs.core._STAR_print_meta_STAR_, "\ufdd0'dup":cljs.core._STAR_print_dup_STAR_})
};
cljs.core.pr_str = function() {
  var pr_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr_str__delegate.call(this, objs)
  };
  pr_str.cljs$lang$maxFixedArity = 0;
  pr_str.cljs$lang$applyTo = function(arglist__9701) {
    var objs = cljs.core.seq(arglist__9701);
    return pr_str__delegate(objs)
  };
  pr_str.cljs$lang$arity$variadic = pr_str__delegate;
  return pr_str
}();
cljs.core.prn_str = function() {
  var prn_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var prn_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn_str__delegate.call(this, objs)
  };
  prn_str.cljs$lang$maxFixedArity = 0;
  prn_str.cljs$lang$applyTo = function(arglist__9702) {
    var objs = cljs.core.seq(arglist__9702);
    return prn_str__delegate(objs)
  };
  prn_str.cljs$lang$arity$variadic = prn_str__delegate;
  return prn_str
}();
cljs.core.pr = function() {
  var pr__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null))
  };
  var pr = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return pr__delegate.call(this, objs)
  };
  pr.cljs$lang$maxFixedArity = 0;
  pr.cljs$lang$applyTo = function(arglist__9703) {
    var objs = cljs.core.seq(arglist__9703);
    return pr__delegate(objs)
  };
  pr.cljs$lang$arity$variadic = pr__delegate;
  return pr
}();
cljs.core.print = function() {
  var cljs_core_print__delegate = function(objs) {
    return cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var cljs_core_print = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return cljs_core_print__delegate.call(this, objs)
  };
  cljs_core_print.cljs$lang$maxFixedArity = 0;
  cljs_core_print.cljs$lang$applyTo = function(arglist__9704) {
    var objs = cljs.core.seq(arglist__9704);
    return cljs_core_print__delegate(objs)
  };
  cljs_core_print.cljs$lang$arity$variadic = cljs_core_print__delegate;
  return cljs_core_print
}();
cljs.core.print_str = function() {
  var print_str__delegate = function(objs) {
    return cljs.core.pr_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var print_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return print_str__delegate.call(this, objs)
  };
  print_str.cljs$lang$maxFixedArity = 0;
  print_str.cljs$lang$applyTo = function(arglist__9705) {
    var objs = cljs.core.seq(arglist__9705);
    return print_str__delegate(objs)
  };
  print_str.cljs$lang$arity$variadic = print_str__delegate;
  return print_str
}();
cljs.core.println = function() {
  var println__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var println = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println__delegate.call(this, objs)
  };
  println.cljs$lang$maxFixedArity = 0;
  println.cljs$lang$applyTo = function(arglist__9706) {
    var objs = cljs.core.seq(arglist__9706);
    return println__delegate(objs)
  };
  println.cljs$lang$arity$variadic = println__delegate;
  return println
}();
cljs.core.println_str = function() {
  var println_str__delegate = function(objs) {
    return cljs.core.prn_str_with_opts.call(null, objs, cljs.core.assoc.call(null, cljs.core.pr_opts.call(null), "\ufdd0'readably", false))
  };
  var println_str = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return println_str__delegate.call(this, objs)
  };
  println_str.cljs$lang$maxFixedArity = 0;
  println_str.cljs$lang$applyTo = function(arglist__9707) {
    var objs = cljs.core.seq(arglist__9707);
    return println_str__delegate(objs)
  };
  println_str.cljs$lang$arity$variadic = println_str__delegate;
  return println_str
}();
cljs.core.prn = function() {
  var prn__delegate = function(objs) {
    cljs.core.pr_with_opts.call(null, objs, cljs.core.pr_opts.call(null));
    return cljs.core.newline.call(null, cljs.core.pr_opts.call(null))
  };
  var prn = function(var_args) {
    var objs = null;
    if(goog.isDef(var_args)) {
      objs = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
    }
    return prn__delegate.call(this, objs)
  };
  prn.cljs$lang$maxFixedArity = 0;
  prn.cljs$lang$applyTo = function(arglist__9708) {
    var objs = cljs.core.seq(arglist__9708);
    return prn__delegate(objs)
  };
  prn.cljs$lang$arity$variadic = prn__delegate;
  return prn
}();
cljs.core.printf = function() {
  var printf__delegate = function(fmt, args) {
    return cljs.core.print.call(null, cljs.core.apply.call(null, cljs.core.format, fmt, args))
  };
  var printf = function(fmt, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return printf__delegate.call(this, fmt, args)
  };
  printf.cljs$lang$maxFixedArity = 1;
  printf.cljs$lang$applyTo = function(arglist__9709) {
    var fmt = cljs.core.first(arglist__9709);
    var args = cljs.core.rest(arglist__9709);
    return printf__delegate(fmt, args)
  };
  printf.cljs$lang$arity$variadic = printf__delegate;
  return printf
}();
cljs.core.HashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.HashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9710 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9710, "{", ", ", "}", opts, coll)
};
cljs.core.IPrintable["number"] = true;
cljs.core._pr_seq["number"] = function(n, opts) {
  return cljs.core.list.call(null, [cljs.core.str(n)].join(""))
};
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.IndexedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Subvec.prototype.cljs$core$IPrintable$ = true;
cljs.core.Subvec.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedCons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9711 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9711, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentArrayMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9712 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9712, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentQueue.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#queue [", " ", "]", opts, cljs.core.seq.call(null, coll))
};
cljs.core.LazySeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.LazySeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.RSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.IPrintable["boolean"] = true;
cljs.core._pr_seq["boolean"] = function(bool, opts) {
  return cljs.core.list.call(null, [cljs.core.str(bool)].join(""))
};
cljs.core.IPrintable["string"] = true;
cljs.core._pr_seq["string"] = function(obj, opts) {
  if(cljs.core.keyword_QMARK_.call(null, obj)) {
    return cljs.core.list.call(null, [cljs.core.str(":"), cljs.core.str(function() {
      var temp__4092__auto____9713 = cljs.core.namespace.call(null, obj);
      if(cljs.core.truth_(temp__4092__auto____9713)) {
        var nspc__9714 = temp__4092__auto____9713;
        return[cljs.core.str(nspc__9714), cljs.core.str("/")].join("")
      }else {
        return null
      }
    }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
  }else {
    if(cljs.core.symbol_QMARK_.call(null, obj)) {
      return cljs.core.list.call(null, [cljs.core.str(function() {
        var temp__4092__auto____9715 = cljs.core.namespace.call(null, obj);
        if(cljs.core.truth_(temp__4092__auto____9715)) {
          var nspc__9716 = temp__4092__auto____9715;
          return[cljs.core.str(nspc__9716), cljs.core.str("/")].join("")
        }else {
          return null
        }
      }()), cljs.core.str(cljs.core.name.call(null, obj))].join(""))
    }else {
      if("\ufdd0'else") {
        return cljs.core.list.call(null, cljs.core.truth_((new cljs.core.Keyword("\ufdd0'readably")).call(null, opts)) ? goog.string.quote(obj) : obj)
      }else {
        return null
      }
    }
  }
};
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.NodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.RedNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.RedNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ChunkedSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9717 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9717, "{", ", ", "}", opts, coll)
};
cljs.core.Vector.prototype.cljs$core$IPrintable$ = true;
cljs.core.Vector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentHashSet.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#{", " ", "}", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
cljs.core.List.prototype.cljs$core$IPrintable$ = true;
cljs.core.List.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.IPrintable["array"] = true;
cljs.core._pr_seq["array"] = function(a, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "#<Array [", ", ", "]>", opts, a)
};
cljs.core.IPrintable["function"] = true;
cljs.core._pr_seq["function"] = function(this$) {
  return cljs.core.list.call(null, "#<", [cljs.core.str(this$)].join(""), ">")
};
cljs.core.EmptyList.prototype.cljs$core$IPrintable$ = true;
cljs.core.EmptyList.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.list.call(null, "()")
};
cljs.core.BlackNode.prototype.cljs$core$IPrintable$ = true;
cljs.core.BlackNode.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "[", " ", "]", opts, coll)
};
Date.prototype.cljs$core$IPrintable$ = true;
Date.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(d, _) {
  var normalize__9719 = function(n, len) {
    var ns__9718 = [cljs.core.str(n)].join("");
    while(true) {
      if(cljs.core.count.call(null, ns__9718) < len) {
        var G__9721 = [cljs.core.str("0"), cljs.core.str(ns__9718)].join("");
        ns__9718 = G__9721;
        continue
      }else {
        return ns__9718
      }
      break
    }
  };
  return cljs.core.list.call(null, [cljs.core.str('#inst "'), cljs.core.str(d.getUTCFullYear()), cljs.core.str("-"), cljs.core.str(normalize__9719.call(null, d.getUTCMonth() + 1, 2)), cljs.core.str("-"), cljs.core.str(normalize__9719.call(null, d.getUTCDate(), 2)), cljs.core.str("T"), cljs.core.str(normalize__9719.call(null, d.getUTCHours(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9719.call(null, d.getUTCMinutes(), 2)), cljs.core.str(":"), cljs.core.str(normalize__9719.call(null, d.getUTCSeconds(), 
  2)), cljs.core.str("."), cljs.core.str(normalize__9719.call(null, d.getUTCMilliseconds(), 3)), cljs.core.str("-"), cljs.core.str('00:00"')].join(""))
};
cljs.core.Cons.prototype.cljs$core$IPrintable$ = true;
cljs.core.Cons.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.Range.prototype.cljs$core$IPrintable$ = true;
cljs.core.Range.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.ArrayNodeSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.ObjMap.prototype.cljs$core$IPrintable$ = true;
cljs.core.ObjMap.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  var pr_pair__9720 = function(keyval) {
    return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "", " ", "", opts, keyval)
  };
  return cljs.core.pr_sequential.call(null, pr_pair__9720, "{", ", ", "}", opts, coll)
};
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$ = true;
cljs.core.PersistentTreeMapSeq.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(coll, opts) {
  return cljs.core.pr_sequential.call(null, cljs.core.pr_seq, "(", " ", ")", opts, coll)
};
cljs.core.PersistentVector.prototype.cljs$core$IComparable$ = true;
cljs.core.PersistentVector.prototype.cljs$core$IComparable$_compare$arity$2 = function(x, y) {
  return cljs.core.compare_indexed.call(null, x, y)
};
cljs.core.Atom = function(state, meta, validator, watches) {
  this.state = state;
  this.meta = meta;
  this.validator = validator;
  this.watches = watches;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 2690809856
};
cljs.core.Atom.cljs$lang$type = true;
cljs.core.Atom.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Atom")
};
cljs.core.Atom.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9722 = this;
  return goog.getUid(this$)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_notify_watches$arity$3 = function(this$, oldval, newval) {
  var this__9723 = this;
  var G__9724__9725 = cljs.core.seq.call(null, this__9723.watches);
  if(G__9724__9725) {
    var G__9727__9729 = cljs.core.first.call(null, G__9724__9725);
    var vec__9728__9730 = G__9727__9729;
    var key__9731 = cljs.core.nth.call(null, vec__9728__9730, 0, null);
    var f__9732 = cljs.core.nth.call(null, vec__9728__9730, 1, null);
    var G__9724__9733 = G__9724__9725;
    var G__9727__9734 = G__9727__9729;
    var G__9724__9735 = G__9724__9733;
    while(true) {
      var vec__9736__9737 = G__9727__9734;
      var key__9738 = cljs.core.nth.call(null, vec__9736__9737, 0, null);
      var f__9739 = cljs.core.nth.call(null, vec__9736__9737, 1, null);
      var G__9724__9740 = G__9724__9735;
      f__9739.call(null, key__9738, this$, oldval, newval);
      var temp__4092__auto____9741 = cljs.core.next.call(null, G__9724__9740);
      if(temp__4092__auto____9741) {
        var G__9724__9742 = temp__4092__auto____9741;
        var G__9749 = cljs.core.first.call(null, G__9724__9742);
        var G__9750 = G__9724__9742;
        G__9727__9734 = G__9749;
        G__9724__9735 = G__9750;
        continue
      }else {
        return null
      }
      break
    }
  }else {
    return null
  }
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_add_watch$arity$3 = function(this$, key, f) {
  var this__9743 = this;
  return this$.watches = cljs.core.assoc.call(null, this__9743.watches, key, f)
};
cljs.core.Atom.prototype.cljs$core$IWatchable$_remove_watch$arity$2 = function(this$, key) {
  var this__9744 = this;
  return this$.watches = cljs.core.dissoc.call(null, this__9744.watches, key)
};
cljs.core.Atom.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(a, opts) {
  var this__9745 = this;
  return cljs.core.concat.call(null, cljs.core.PersistentVector.fromArray(["#<Atom: "], true), cljs.core._pr_seq.call(null, this__9745.state, opts), ">")
};
cljs.core.Atom.prototype.cljs$core$IMeta$_meta$arity$1 = function(_) {
  var this__9746 = this;
  return this__9746.meta
};
cljs.core.Atom.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9747 = this;
  return this__9747.state
};
cljs.core.Atom.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(o, other) {
  var this__9748 = this;
  return o === other
};
cljs.core.Atom;
cljs.core.atom = function() {
  var atom = null;
  var atom__1 = function(x) {
    return new cljs.core.Atom(x, null, null, null)
  };
  var atom__2 = function() {
    var G__9762__delegate = function(x, p__9751) {
      var map__9757__9758 = p__9751;
      var map__9757__9759 = cljs.core.seq_QMARK_.call(null, map__9757__9758) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9757__9758) : map__9757__9758;
      var validator__9760 = cljs.core._lookup.call(null, map__9757__9759, "\ufdd0'validator", null);
      var meta__9761 = cljs.core._lookup.call(null, map__9757__9759, "\ufdd0'meta", null);
      return new cljs.core.Atom(x, meta__9761, validator__9760, null)
    };
    var G__9762 = function(x, var_args) {
      var p__9751 = null;
      if(goog.isDef(var_args)) {
        p__9751 = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9762__delegate.call(this, x, p__9751)
    };
    G__9762.cljs$lang$maxFixedArity = 1;
    G__9762.cljs$lang$applyTo = function(arglist__9763) {
      var x = cljs.core.first(arglist__9763);
      var p__9751 = cljs.core.rest(arglist__9763);
      return G__9762__delegate(x, p__9751)
    };
    G__9762.cljs$lang$arity$variadic = G__9762__delegate;
    return G__9762
  }();
  atom = function(x, var_args) {
    var p__9751 = var_args;
    switch(arguments.length) {
      case 1:
        return atom__1.call(this, x);
      default:
        return atom__2.cljs$lang$arity$variadic(x, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  atom.cljs$lang$maxFixedArity = 1;
  atom.cljs$lang$applyTo = atom__2.cljs$lang$applyTo;
  atom.cljs$lang$arity$1 = atom__1;
  atom.cljs$lang$arity$variadic = atom__2.cljs$lang$arity$variadic;
  return atom
}();
cljs.core.reset_BANG_ = function reset_BANG_(a, new_value) {
  var temp__4092__auto____9767 = a.validator;
  if(cljs.core.truth_(temp__4092__auto____9767)) {
    var validate__9768 = temp__4092__auto____9767;
    if(cljs.core.truth_(validate__9768.call(null, new_value))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str("Validator rejected reference state"), cljs.core.str("\n"), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'validate", "\ufdd1'new-value"), cljs.core.hash_map("\ufdd0'line", 6440, "\ufdd0'column", 13))))].join(""));
    }
  }else {
  }
  var old_value__9769 = a.state;
  a.state = new_value;
  cljs.core._notify_watches.call(null, a, old_value__9769, new_value);
  return new_value
};
cljs.core.swap_BANG_ = function() {
  var swap_BANG_ = null;
  var swap_BANG___2 = function(a, f) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state))
  };
  var swap_BANG___3 = function(a, f, x) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x))
  };
  var swap_BANG___4 = function(a, f, x, y) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y))
  };
  var swap_BANG___5 = function(a, f, x, y, z) {
    return cljs.core.reset_BANG_.call(null, a, f.call(null, a.state, x, y, z))
  };
  var swap_BANG___6 = function() {
    var G__9770__delegate = function(a, f, x, y, z, more) {
      return cljs.core.reset_BANG_.call(null, a, cljs.core.apply.call(null, f, a.state, x, y, z, more))
    };
    var G__9770 = function(a, f, x, y, z, var_args) {
      var more = null;
      if(goog.isDef(var_args)) {
        more = cljs.core.array_seq(Array.prototype.slice.call(arguments, 5), 0)
      }
      return G__9770__delegate.call(this, a, f, x, y, z, more)
    };
    G__9770.cljs$lang$maxFixedArity = 5;
    G__9770.cljs$lang$applyTo = function(arglist__9771) {
      var a = cljs.core.first(arglist__9771);
      var f = cljs.core.first(cljs.core.next(arglist__9771));
      var x = cljs.core.first(cljs.core.next(cljs.core.next(arglist__9771)));
      var y = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9771))));
      var z = cljs.core.first(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9771)))));
      var more = cljs.core.rest(cljs.core.next(cljs.core.next(cljs.core.next(cljs.core.next(arglist__9771)))));
      return G__9770__delegate(a, f, x, y, z, more)
    };
    G__9770.cljs$lang$arity$variadic = G__9770__delegate;
    return G__9770
  }();
  swap_BANG_ = function(a, f, x, y, z, var_args) {
    var more = var_args;
    switch(arguments.length) {
      case 2:
        return swap_BANG___2.call(this, a, f);
      case 3:
        return swap_BANG___3.call(this, a, f, x);
      case 4:
        return swap_BANG___4.call(this, a, f, x, y);
      case 5:
        return swap_BANG___5.call(this, a, f, x, y, z);
      default:
        return swap_BANG___6.cljs$lang$arity$variadic(a, f, x, y, z, cljs.core.array_seq(arguments, 5))
    }
    throw"Invalid arity: " + arguments.length;
  };
  swap_BANG_.cljs$lang$maxFixedArity = 5;
  swap_BANG_.cljs$lang$applyTo = swap_BANG___6.cljs$lang$applyTo;
  swap_BANG_.cljs$lang$arity$2 = swap_BANG___2;
  swap_BANG_.cljs$lang$arity$3 = swap_BANG___3;
  swap_BANG_.cljs$lang$arity$4 = swap_BANG___4;
  swap_BANG_.cljs$lang$arity$5 = swap_BANG___5;
  swap_BANG_.cljs$lang$arity$variadic = swap_BANG___6.cljs$lang$arity$variadic;
  return swap_BANG_
}();
cljs.core.compare_and_set_BANG_ = function compare_and_set_BANG_(a, oldval, newval) {
  if(cljs.core._EQ_.call(null, a.state, oldval)) {
    cljs.core.reset_BANG_.call(null, a, newval);
    return true
  }else {
    return false
  }
};
cljs.core.deref = function deref(o) {
  return cljs.core._deref.call(null, o)
};
cljs.core.set_validator_BANG_ = function set_validator_BANG_(iref, val) {
  return iref.validator = val
};
cljs.core.get_validator = function get_validator(iref) {
  return iref.validator
};
cljs.core.alter_meta_BANG_ = function() {
  var alter_meta_BANG___delegate = function(iref, f, args) {
    return iref.meta = cljs.core.apply.call(null, f, iref.meta, args)
  };
  var alter_meta_BANG_ = function(iref, f, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 2), 0)
    }
    return alter_meta_BANG___delegate.call(this, iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$maxFixedArity = 2;
  alter_meta_BANG_.cljs$lang$applyTo = function(arglist__9772) {
    var iref = cljs.core.first(arglist__9772);
    var f = cljs.core.first(cljs.core.next(arglist__9772));
    var args = cljs.core.rest(cljs.core.next(arglist__9772));
    return alter_meta_BANG___delegate(iref, f, args)
  };
  alter_meta_BANG_.cljs$lang$arity$variadic = alter_meta_BANG___delegate;
  return alter_meta_BANG_
}();
cljs.core.reset_meta_BANG_ = function reset_meta_BANG_(iref, m) {
  return iref.meta = m
};
cljs.core.add_watch = function add_watch(iref, key, f) {
  return cljs.core._add_watch.call(null, iref, key, f)
};
cljs.core.remove_watch = function remove_watch(iref, key) {
  return cljs.core._remove_watch.call(null, iref, key)
};
cljs.core.gensym_counter = null;
cljs.core.gensym = function() {
  var gensym = null;
  var gensym__0 = function() {
    return gensym.call(null, "G__")
  };
  var gensym__1 = function(prefix_string) {
    if(cljs.core.gensym_counter == null) {
      cljs.core.gensym_counter = cljs.core.atom.call(null, 0)
    }else {
    }
    return cljs.core.symbol.call(null, [cljs.core.str(prefix_string), cljs.core.str(cljs.core.swap_BANG_.call(null, cljs.core.gensym_counter, cljs.core.inc))].join(""))
  };
  gensym = function(prefix_string) {
    switch(arguments.length) {
      case 0:
        return gensym__0.call(this);
      case 1:
        return gensym__1.call(this, prefix_string)
    }
    throw"Invalid arity: " + arguments.length;
  };
  gensym.cljs$lang$arity$0 = gensym__0;
  gensym.cljs$lang$arity$1 = gensym__1;
  return gensym
}();
cljs.core.fixture1 = 1;
cljs.core.fixture2 = 2;
cljs.core.Delay = function(state, f) {
  this.state = state;
  this.f = f;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 1073774592
};
cljs.core.Delay.cljs$lang$type = true;
cljs.core.Delay.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/Delay")
};
cljs.core.Delay.prototype.cljs$core$IPending$_realized_QMARK_$arity$1 = function(d) {
  var this__9773 = this;
  return(new cljs.core.Keyword("\ufdd0'done")).call(null, cljs.core.deref.call(null, this__9773.state))
};
cljs.core.Delay.prototype.cljs$core$IDeref$_deref$arity$1 = function(_) {
  var this__9774 = this;
  return(new cljs.core.Keyword("\ufdd0'value")).call(null, cljs.core.swap_BANG_.call(null, this__9774.state, function(p__9775) {
    var map__9776__9777 = p__9775;
    var map__9776__9778 = cljs.core.seq_QMARK_.call(null, map__9776__9777) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9776__9777) : map__9776__9777;
    var curr_state__9779 = map__9776__9778;
    var done__9780 = cljs.core._lookup.call(null, map__9776__9778, "\ufdd0'done", null);
    if(cljs.core.truth_(done__9780)) {
      return curr_state__9779
    }else {
      return cljs.core.ObjMap.fromObject(["\ufdd0'done", "\ufdd0'value"], {"\ufdd0'done":true, "\ufdd0'value":this__9774.f.call(null)})
    }
  }))
};
cljs.core.Delay;
cljs.core.delay_QMARK_ = function delay_QMARK_(x) {
  return cljs.core.instance_QMARK_.call(null, cljs.core.Delay, x)
};
cljs.core.force = function force(x) {
  if(cljs.core.delay_QMARK_.call(null, x)) {
    return cljs.core.deref.call(null, x)
  }else {
    return x
  }
};
cljs.core.realized_QMARK_ = function realized_QMARK_(d) {
  return cljs.core._realized_QMARK_.call(null, d)
};
cljs.core.js__GT_clj = function() {
  var js__GT_clj__delegate = function(x, options) {
    var map__9809__9810 = options;
    var map__9809__9811 = cljs.core.seq_QMARK_.call(null, map__9809__9810) ? cljs.core.apply.call(null, cljs.core.hash_map, map__9809__9810) : map__9809__9810;
    var keywordize_keys__9812 = cljs.core._lookup.call(null, map__9809__9811, "\ufdd0'keywordize-keys", null);
    var keyfn__9813 = cljs.core.truth_(keywordize_keys__9812) ? cljs.core.keyword : cljs.core.str;
    var f__9836 = function thisfn(x) {
      if(cljs.core.seq_QMARK_.call(null, x)) {
        return cljs.core.doall.call(null, cljs.core.map.call(null, thisfn, x))
      }else {
        if(cljs.core.coll_QMARK_.call(null, x)) {
          return cljs.core.into.call(null, cljs.core.empty.call(null, x), cljs.core.map.call(null, thisfn, x))
        }else {
          if(cljs.core.truth_(goog.isArray(x))) {
            return cljs.core.vec.call(null, cljs.core.map.call(null, thisfn, x))
          }else {
            if(cljs.core.type.call(null, x) === Object) {
              return cljs.core.into.call(null, cljs.core.ObjMap.EMPTY, function() {
                var iter__2411__auto____9835 = function iter__9825(s__9826) {
                  return new cljs.core.LazySeq(null, false, function() {
                    var s__9826__9831 = s__9826;
                    while(true) {
                      var temp__4092__auto____9832 = cljs.core.seq.call(null, s__9826__9831);
                      if(temp__4092__auto____9832) {
                        var xs__4579__auto____9833 = temp__4092__auto____9832;
                        var k__9834 = cljs.core.first.call(null, xs__4579__auto____9833);
                        return cljs.core.cons.call(null, cljs.core.PersistentVector.fromArray([keyfn__9813.call(null, k__9834), thisfn.call(null, x[k__9834])], true), iter__9825.call(null, cljs.core.rest.call(null, s__9826__9831)))
                      }else {
                        return null
                      }
                      break
                    }
                  }, null)
                };
                return iter__2411__auto____9835.call(null, cljs.core.js_keys.call(null, x))
              }())
            }else {
              if("\ufdd0'else") {
                return x
              }else {
                return null
              }
            }
          }
        }
      }
    };
    return f__9836.call(null, x)
  };
  var js__GT_clj = function(x, var_args) {
    var options = null;
    if(goog.isDef(var_args)) {
      options = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return js__GT_clj__delegate.call(this, x, options)
  };
  js__GT_clj.cljs$lang$maxFixedArity = 1;
  js__GT_clj.cljs$lang$applyTo = function(arglist__9837) {
    var x = cljs.core.first(arglist__9837);
    var options = cljs.core.rest(arglist__9837);
    return js__GT_clj__delegate(x, options)
  };
  js__GT_clj.cljs$lang$arity$variadic = js__GT_clj__delegate;
  return js__GT_clj
}();
cljs.core.memoize = function memoize(f) {
  var mem__9842 = cljs.core.atom.call(null, cljs.core.ObjMap.EMPTY);
  return function() {
    var G__9846__delegate = function(args) {
      var temp__4090__auto____9843 = cljs.core._lookup.call(null, cljs.core.deref.call(null, mem__9842), args, null);
      if(cljs.core.truth_(temp__4090__auto____9843)) {
        var v__9844 = temp__4090__auto____9843;
        return v__9844
      }else {
        var ret__9845 = cljs.core.apply.call(null, f, args);
        cljs.core.swap_BANG_.call(null, mem__9842, cljs.core.assoc, args, ret__9845);
        return ret__9845
      }
    };
    var G__9846 = function(var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 0), 0)
      }
      return G__9846__delegate.call(this, args)
    };
    G__9846.cljs$lang$maxFixedArity = 0;
    G__9846.cljs$lang$applyTo = function(arglist__9847) {
      var args = cljs.core.seq(arglist__9847);
      return G__9846__delegate(args)
    };
    G__9846.cljs$lang$arity$variadic = G__9846__delegate;
    return G__9846
  }()
};
cljs.core.trampoline = function() {
  var trampoline = null;
  var trampoline__1 = function(f) {
    while(true) {
      var ret__9849 = f.call(null);
      if(cljs.core.fn_QMARK_.call(null, ret__9849)) {
        var G__9850 = ret__9849;
        f = G__9850;
        continue
      }else {
        return ret__9849
      }
      break
    }
  };
  var trampoline__2 = function() {
    var G__9851__delegate = function(f, args) {
      return trampoline.call(null, function() {
        return cljs.core.apply.call(null, f, args)
      })
    };
    var G__9851 = function(f, var_args) {
      var args = null;
      if(goog.isDef(var_args)) {
        args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
      }
      return G__9851__delegate.call(this, f, args)
    };
    G__9851.cljs$lang$maxFixedArity = 1;
    G__9851.cljs$lang$applyTo = function(arglist__9852) {
      var f = cljs.core.first(arglist__9852);
      var args = cljs.core.rest(arglist__9852);
      return G__9851__delegate(f, args)
    };
    G__9851.cljs$lang$arity$variadic = G__9851__delegate;
    return G__9851
  }();
  trampoline = function(f, var_args) {
    var args = var_args;
    switch(arguments.length) {
      case 1:
        return trampoline__1.call(this, f);
      default:
        return trampoline__2.cljs$lang$arity$variadic(f, cljs.core.array_seq(arguments, 1))
    }
    throw"Invalid arity: " + arguments.length;
  };
  trampoline.cljs$lang$maxFixedArity = 1;
  trampoline.cljs$lang$applyTo = trampoline__2.cljs$lang$applyTo;
  trampoline.cljs$lang$arity$1 = trampoline__1;
  trampoline.cljs$lang$arity$variadic = trampoline__2.cljs$lang$arity$variadic;
  return trampoline
}();
cljs.core.rand = function() {
  var rand = null;
  var rand__0 = function() {
    return rand.call(null, 1)
  };
  var rand__1 = function(n) {
    return Math.random.call(null) * n
  };
  rand = function(n) {
    switch(arguments.length) {
      case 0:
        return rand__0.call(this);
      case 1:
        return rand__1.call(this, n)
    }
    throw"Invalid arity: " + arguments.length;
  };
  rand.cljs$lang$arity$0 = rand__0;
  rand.cljs$lang$arity$1 = rand__1;
  return rand
}();
cljs.core.rand_int = function rand_int(n) {
  return Math.floor.call(null, Math.random.call(null) * n)
};
cljs.core.rand_nth = function rand_nth(coll) {
  return cljs.core.nth.call(null, coll, cljs.core.rand_int.call(null, cljs.core.count.call(null, coll)))
};
cljs.core.group_by = function group_by(f, coll) {
  return cljs.core.reduce.call(null, function(ret, x) {
    var k__9854 = f.call(null, x);
    return cljs.core.assoc.call(null, ret, k__9854, cljs.core.conj.call(null, cljs.core._lookup.call(null, ret, k__9854, cljs.core.PersistentVector.EMPTY), x))
  }, cljs.core.ObjMap.EMPTY, coll)
};
cljs.core.make_hierarchy = function make_hierarchy() {
  return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'descendants", "\ufdd0'ancestors"], {"\ufdd0'parents":cljs.core.ObjMap.EMPTY, "\ufdd0'descendants":cljs.core.ObjMap.EMPTY, "\ufdd0'ancestors":cljs.core.ObjMap.EMPTY})
};
cljs.core.global_hierarchy = cljs.core.atom.call(null, cljs.core.make_hierarchy.call(null));
cljs.core.isa_QMARK_ = function() {
  var isa_QMARK_ = null;
  var isa_QMARK___2 = function(child, parent) {
    return isa_QMARK_.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), child, parent)
  };
  var isa_QMARK___3 = function(h, child, parent) {
    var or__3943__auto____9863 = cljs.core._EQ_.call(null, child, parent);
    if(or__3943__auto____9863) {
      return or__3943__auto____9863
    }else {
      var or__3943__auto____9864 = cljs.core.contains_QMARK_.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h).call(null, child), parent);
      if(or__3943__auto____9864) {
        return or__3943__auto____9864
      }else {
        var and__3941__auto____9865 = cljs.core.vector_QMARK_.call(null, parent);
        if(and__3941__auto____9865) {
          var and__3941__auto____9866 = cljs.core.vector_QMARK_.call(null, child);
          if(and__3941__auto____9866) {
            var and__3941__auto____9867 = cljs.core.count.call(null, parent) === cljs.core.count.call(null, child);
            if(and__3941__auto____9867) {
              var ret__9868 = true;
              var i__9869 = 0;
              while(true) {
                if(function() {
                  var or__3943__auto____9870 = cljs.core.not.call(null, ret__9868);
                  if(or__3943__auto____9870) {
                    return or__3943__auto____9870
                  }else {
                    return i__9869 === cljs.core.count.call(null, parent)
                  }
                }()) {
                  return ret__9868
                }else {
                  var G__9871 = isa_QMARK_.call(null, h, child.call(null, i__9869), parent.call(null, i__9869));
                  var G__9872 = i__9869 + 1;
                  ret__9868 = G__9871;
                  i__9869 = G__9872;
                  continue
                }
                break
              }
            }else {
              return and__3941__auto____9867
            }
          }else {
            return and__3941__auto____9866
          }
        }else {
          return and__3941__auto____9865
        }
      }
    }
  };
  isa_QMARK_ = function(h, child, parent) {
    switch(arguments.length) {
      case 2:
        return isa_QMARK___2.call(this, h, child);
      case 3:
        return isa_QMARK___3.call(this, h, child, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  isa_QMARK_.cljs$lang$arity$2 = isa_QMARK___2;
  isa_QMARK_.cljs$lang$arity$3 = isa_QMARK___3;
  return isa_QMARK_
}();
cljs.core.parents = function() {
  var parents = null;
  var parents__1 = function(tag) {
    return parents.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var parents__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, null))
  };
  parents = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return parents__1.call(this, h);
      case 2:
        return parents__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  parents.cljs$lang$arity$1 = parents__1;
  parents.cljs$lang$arity$2 = parents__2;
  return parents
}();
cljs.core.ancestors = function() {
  var ancestors = null;
  var ancestors__1 = function(tag) {
    return ancestors.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var ancestors__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, null))
  };
  ancestors = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return ancestors__1.call(this, h);
      case 2:
        return ancestors__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  ancestors.cljs$lang$arity$1 = ancestors__1;
  ancestors.cljs$lang$arity$2 = ancestors__2;
  return ancestors
}();
cljs.core.descendants = function() {
  var descendants = null;
  var descendants__1 = function(tag) {
    return descendants.call(null, cljs.core.deref.call(null, cljs.core.global_hierarchy), tag)
  };
  var descendants__2 = function(h, tag) {
    return cljs.core.not_empty.call(null, cljs.core._lookup.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h), tag, null))
  };
  descendants = function(h, tag) {
    switch(arguments.length) {
      case 1:
        return descendants__1.call(this, h);
      case 2:
        return descendants__2.call(this, h, tag)
    }
    throw"Invalid arity: " + arguments.length;
  };
  descendants.cljs$lang$arity$1 = descendants__1;
  descendants.cljs$lang$arity$2 = descendants__2;
  return descendants
}();
cljs.core.derive = function() {
  var derive = null;
  var derive__2 = function(tag, parent) {
    if(cljs.core.truth_(cljs.core.namespace.call(null, parent))) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'namespace", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6724, "\ufdd0'column", 12))))].join(""));
    }
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, derive, tag, parent);
    return null
  };
  var derive__3 = function(h, tag, parent) {
    if(cljs.core.not_EQ_.call(null, tag, parent)) {
    }else {
      throw new Error([cljs.core.str("Assert failed: "), cljs.core.str(cljs.core.pr_str.call(null, cljs.core.with_meta(cljs.core.list("\ufdd1'not=", "\ufdd1'tag", "\ufdd1'parent"), cljs.core.hash_map("\ufdd0'line", 6728, "\ufdd0'column", 12))))].join(""));
    }
    var tp__9881 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var td__9882 = (new cljs.core.Keyword("\ufdd0'descendants")).call(null, h);
    var ta__9883 = (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h);
    var tf__9884 = function(m, source, sources, target, targets) {
      return cljs.core.reduce.call(null, function(ret, k) {
        return cljs.core.assoc.call(null, ret, k, cljs.core.reduce.call(null, cljs.core.conj, cljs.core._lookup.call(null, targets, k, cljs.core.PersistentHashSet.EMPTY), cljs.core.cons.call(null, target, targets.call(null, target))))
      }, m, cljs.core.cons.call(null, source, sources.call(null, source)))
    };
    var or__3943__auto____9885 = cljs.core.contains_QMARK_.call(null, tp__9881.call(null, tag), parent) ? null : function() {
      if(cljs.core.contains_QMARK_.call(null, ta__9883.call(null, tag), parent)) {
        throw new Error([cljs.core.str(tag), cljs.core.str("already has"), cljs.core.str(parent), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      if(cljs.core.contains_QMARK_.call(null, ta__9883.call(null, parent), tag)) {
        throw new Error([cljs.core.str("Cyclic derivation:"), cljs.core.str(parent), cljs.core.str("has"), cljs.core.str(tag), cljs.core.str("as ancestor")].join(""));
      }else {
      }
      return cljs.core.ObjMap.fromObject(["\ufdd0'parents", "\ufdd0'ancestors", "\ufdd0'descendants"], {"\ufdd0'parents":cljs.core.assoc.call(null, (new cljs.core.Keyword("\ufdd0'parents")).call(null, h), tag, cljs.core.conj.call(null, cljs.core._lookup.call(null, tp__9881, tag, cljs.core.PersistentHashSet.EMPTY), parent)), "\ufdd0'ancestors":tf__9884.call(null, (new cljs.core.Keyword("\ufdd0'ancestors")).call(null, h), tag, td__9882, parent, ta__9883), "\ufdd0'descendants":tf__9884.call(null, (new cljs.core.Keyword("\ufdd0'descendants")).call(null, 
      h), parent, ta__9883, tag, td__9882)})
    }();
    if(cljs.core.truth_(or__3943__auto____9885)) {
      return or__3943__auto____9885
    }else {
      return h
    }
  };
  derive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return derive__2.call(this, h, tag);
      case 3:
        return derive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  derive.cljs$lang$arity$2 = derive__2;
  derive.cljs$lang$arity$3 = derive__3;
  return derive
}();
cljs.core.underive = function() {
  var underive = null;
  var underive__2 = function(tag, parent) {
    cljs.core.swap_BANG_.call(null, cljs.core.global_hierarchy, underive, tag, parent);
    return null
  };
  var underive__3 = function(h, tag, parent) {
    var parentMap__9890 = (new cljs.core.Keyword("\ufdd0'parents")).call(null, h);
    var childsParents__9891 = cljs.core.truth_(parentMap__9890.call(null, tag)) ? cljs.core.disj.call(null, parentMap__9890.call(null, tag), parent) : cljs.core.PersistentHashSet.EMPTY;
    var newParents__9892 = cljs.core.truth_(cljs.core.not_empty.call(null, childsParents__9891)) ? cljs.core.assoc.call(null, parentMap__9890, tag, childsParents__9891) : cljs.core.dissoc.call(null, parentMap__9890, tag);
    var deriv_seq__9893 = cljs.core.flatten.call(null, cljs.core.map.call(null, function(p1__9873_SHARP_) {
      return cljs.core.cons.call(null, cljs.core.first.call(null, p1__9873_SHARP_), cljs.core.interpose.call(null, cljs.core.first.call(null, p1__9873_SHARP_), cljs.core.second.call(null, p1__9873_SHARP_)))
    }, cljs.core.seq.call(null, newParents__9892)));
    if(cljs.core.contains_QMARK_.call(null, parentMap__9890.call(null, tag), parent)) {
      return cljs.core.reduce.call(null, function(p1__9874_SHARP_, p2__9875_SHARP_) {
        return cljs.core.apply.call(null, cljs.core.derive, p1__9874_SHARP_, p2__9875_SHARP_)
      }, cljs.core.make_hierarchy.call(null), cljs.core.partition.call(null, 2, deriv_seq__9893))
    }else {
      return h
    }
  };
  underive = function(h, tag, parent) {
    switch(arguments.length) {
      case 2:
        return underive__2.call(this, h, tag);
      case 3:
        return underive__3.call(this, h, tag, parent)
    }
    throw"Invalid arity: " + arguments.length;
  };
  underive.cljs$lang$arity$2 = underive__2;
  underive.cljs$lang$arity$3 = underive__3;
  return underive
}();
cljs.core.reset_cache = function reset_cache(method_cache, method_table, cached_hierarchy, hierarchy) {
  cljs.core.swap_BANG_.call(null, method_cache, function(_) {
    return cljs.core.deref.call(null, method_table)
  });
  return cljs.core.swap_BANG_.call(null, cached_hierarchy, function(_) {
    return cljs.core.deref.call(null, hierarchy)
  })
};
cljs.core.prefers_STAR_ = function prefers_STAR_(x, y, prefer_table) {
  var xprefs__9901 = cljs.core.deref.call(null, prefer_table).call(null, x);
  var or__3943__auto____9903 = cljs.core.truth_(function() {
    var and__3941__auto____9902 = xprefs__9901;
    if(cljs.core.truth_(and__3941__auto____9902)) {
      return xprefs__9901.call(null, y)
    }else {
      return and__3941__auto____9902
    }
  }()) ? true : null;
  if(cljs.core.truth_(or__3943__auto____9903)) {
    return or__3943__auto____9903
  }else {
    var or__3943__auto____9905 = function() {
      var ps__9904 = cljs.core.parents.call(null, y);
      while(true) {
        if(cljs.core.count.call(null, ps__9904) > 0) {
          if(cljs.core.truth_(prefers_STAR_.call(null, x, cljs.core.first.call(null, ps__9904), prefer_table))) {
          }else {
          }
          var G__9908 = cljs.core.rest.call(null, ps__9904);
          ps__9904 = G__9908;
          continue
        }else {
          return null
        }
        break
      }
    }();
    if(cljs.core.truth_(or__3943__auto____9905)) {
      return or__3943__auto____9905
    }else {
      var or__3943__auto____9907 = function() {
        var ps__9906 = cljs.core.parents.call(null, x);
        while(true) {
          if(cljs.core.count.call(null, ps__9906) > 0) {
            if(cljs.core.truth_(prefers_STAR_.call(null, cljs.core.first.call(null, ps__9906), y, prefer_table))) {
            }else {
            }
            var G__9909 = cljs.core.rest.call(null, ps__9906);
            ps__9906 = G__9909;
            continue
          }else {
            return null
          }
          break
        }
      }();
      if(cljs.core.truth_(or__3943__auto____9907)) {
        return or__3943__auto____9907
      }else {
        return false
      }
    }
  }
};
cljs.core.dominates = function dominates(x, y, prefer_table) {
  var or__3943__auto____9911 = cljs.core.prefers_STAR_.call(null, x, y, prefer_table);
  if(cljs.core.truth_(or__3943__auto____9911)) {
    return or__3943__auto____9911
  }else {
    return cljs.core.isa_QMARK_.call(null, x, y)
  }
};
cljs.core.find_and_cache_best_method = function find_and_cache_best_method(name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  var best_entry__9929 = cljs.core.reduce.call(null, function(be, p__9921) {
    var vec__9922__9923 = p__9921;
    var k__9924 = cljs.core.nth.call(null, vec__9922__9923, 0, null);
    var ___9925 = cljs.core.nth.call(null, vec__9922__9923, 1, null);
    var e__9926 = vec__9922__9923;
    if(cljs.core.isa_QMARK_.call(null, dispatch_val, k__9924)) {
      var be2__9928 = cljs.core.truth_(function() {
        var or__3943__auto____9927 = be == null;
        if(or__3943__auto____9927) {
          return or__3943__auto____9927
        }else {
          return cljs.core.dominates.call(null, k__9924, cljs.core.first.call(null, be), prefer_table)
        }
      }()) ? e__9926 : be;
      if(cljs.core.truth_(cljs.core.dominates.call(null, cljs.core.first.call(null, be2__9928), k__9924, prefer_table))) {
      }else {
        throw new Error([cljs.core.str("Multiple methods in multimethod '"), cljs.core.str(name), cljs.core.str("' match dispatch value: "), cljs.core.str(dispatch_val), cljs.core.str(" -> "), cljs.core.str(k__9924), cljs.core.str(" and "), cljs.core.str(cljs.core.first.call(null, be2__9928)), cljs.core.str(", and neither is preferred")].join(""));
      }
      return be2__9928
    }else {
      return be
    }
  }, null, cljs.core.deref.call(null, method_table));
  if(cljs.core.truth_(best_entry__9929)) {
    if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, cached_hierarchy), cljs.core.deref.call(null, hierarchy))) {
      cljs.core.swap_BANG_.call(null, method_cache, cljs.core.assoc, dispatch_val, cljs.core.second.call(null, best_entry__9929));
      return cljs.core.second.call(null, best_entry__9929)
    }else {
      cljs.core.reset_cache.call(null, method_cache, method_table, cached_hierarchy, hierarchy);
      return find_and_cache_best_method.call(null, name, dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy)
    }
  }else {
    return null
  }
};
cljs.core.IMultiFn = {};
cljs.core._reset = function _reset(mf) {
  if(function() {
    var and__3941__auto____9934 = mf;
    if(and__3941__auto____9934) {
      return mf.cljs$core$IMultiFn$_reset$arity$1
    }else {
      return and__3941__auto____9934
    }
  }()) {
    return mf.cljs$core$IMultiFn$_reset$arity$1(mf)
  }else {
    var x__2312__auto____9935 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9936 = cljs.core._reset[goog.typeOf(x__2312__auto____9935)];
      if(or__3943__auto____9936) {
        return or__3943__auto____9936
      }else {
        var or__3943__auto____9937 = cljs.core._reset["_"];
        if(or__3943__auto____9937) {
          return or__3943__auto____9937
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-reset", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._add_method = function _add_method(mf, dispatch_val, method) {
  if(function() {
    var and__3941__auto____9942 = mf;
    if(and__3941__auto____9942) {
      return mf.cljs$core$IMultiFn$_add_method$arity$3
    }else {
      return and__3941__auto____9942
    }
  }()) {
    return mf.cljs$core$IMultiFn$_add_method$arity$3(mf, dispatch_val, method)
  }else {
    var x__2312__auto____9943 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9944 = cljs.core._add_method[goog.typeOf(x__2312__auto____9943)];
      if(or__3943__auto____9944) {
        return or__3943__auto____9944
      }else {
        var or__3943__auto____9945 = cljs.core._add_method["_"];
        if(or__3943__auto____9945) {
          return or__3943__auto____9945
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-add-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, method)
  }
};
cljs.core._remove_method = function _remove_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9950 = mf;
    if(and__3941__auto____9950) {
      return mf.cljs$core$IMultiFn$_remove_method$arity$2
    }else {
      return and__3941__auto____9950
    }
  }()) {
    return mf.cljs$core$IMultiFn$_remove_method$arity$2(mf, dispatch_val)
  }else {
    var x__2312__auto____9951 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9952 = cljs.core._remove_method[goog.typeOf(x__2312__auto____9951)];
      if(or__3943__auto____9952) {
        return or__3943__auto____9952
      }else {
        var or__3943__auto____9953 = cljs.core._remove_method["_"];
        if(or__3943__auto____9953) {
          return or__3943__auto____9953
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-remove-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._prefer_method = function _prefer_method(mf, dispatch_val, dispatch_val_y) {
  if(function() {
    var and__3941__auto____9958 = mf;
    if(and__3941__auto____9958) {
      return mf.cljs$core$IMultiFn$_prefer_method$arity$3
    }else {
      return and__3941__auto____9958
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefer_method$arity$3(mf, dispatch_val, dispatch_val_y)
  }else {
    var x__2312__auto____9959 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9960 = cljs.core._prefer_method[goog.typeOf(x__2312__auto____9959)];
      if(or__3943__auto____9960) {
        return or__3943__auto____9960
      }else {
        var or__3943__auto____9961 = cljs.core._prefer_method["_"];
        if(or__3943__auto____9961) {
          return or__3943__auto____9961
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefer-method", mf);
        }
      }
    }().call(null, mf, dispatch_val, dispatch_val_y)
  }
};
cljs.core._get_method = function _get_method(mf, dispatch_val) {
  if(function() {
    var and__3941__auto____9966 = mf;
    if(and__3941__auto____9966) {
      return mf.cljs$core$IMultiFn$_get_method$arity$2
    }else {
      return and__3941__auto____9966
    }
  }()) {
    return mf.cljs$core$IMultiFn$_get_method$arity$2(mf, dispatch_val)
  }else {
    var x__2312__auto____9967 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9968 = cljs.core._get_method[goog.typeOf(x__2312__auto____9967)];
      if(or__3943__auto____9968) {
        return or__3943__auto____9968
      }else {
        var or__3943__auto____9969 = cljs.core._get_method["_"];
        if(or__3943__auto____9969) {
          return or__3943__auto____9969
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-get-method", mf);
        }
      }
    }().call(null, mf, dispatch_val)
  }
};
cljs.core._methods = function _methods(mf) {
  if(function() {
    var and__3941__auto____9974 = mf;
    if(and__3941__auto____9974) {
      return mf.cljs$core$IMultiFn$_methods$arity$1
    }else {
      return and__3941__auto____9974
    }
  }()) {
    return mf.cljs$core$IMultiFn$_methods$arity$1(mf)
  }else {
    var x__2312__auto____9975 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9976 = cljs.core._methods[goog.typeOf(x__2312__auto____9975)];
      if(or__3943__auto____9976) {
        return or__3943__auto____9976
      }else {
        var or__3943__auto____9977 = cljs.core._methods["_"];
        if(or__3943__auto____9977) {
          return or__3943__auto____9977
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-methods", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._prefers = function _prefers(mf) {
  if(function() {
    var and__3941__auto____9982 = mf;
    if(and__3941__auto____9982) {
      return mf.cljs$core$IMultiFn$_prefers$arity$1
    }else {
      return and__3941__auto____9982
    }
  }()) {
    return mf.cljs$core$IMultiFn$_prefers$arity$1(mf)
  }else {
    var x__2312__auto____9983 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9984 = cljs.core._prefers[goog.typeOf(x__2312__auto____9983)];
      if(or__3943__auto____9984) {
        return or__3943__auto____9984
      }else {
        var or__3943__auto____9985 = cljs.core._prefers["_"];
        if(or__3943__auto____9985) {
          return or__3943__auto____9985
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-prefers", mf);
        }
      }
    }().call(null, mf)
  }
};
cljs.core._dispatch = function _dispatch(mf, args) {
  if(function() {
    var and__3941__auto____9990 = mf;
    if(and__3941__auto____9990) {
      return mf.cljs$core$IMultiFn$_dispatch$arity$2
    }else {
      return and__3941__auto____9990
    }
  }()) {
    return mf.cljs$core$IMultiFn$_dispatch$arity$2(mf, args)
  }else {
    var x__2312__auto____9991 = mf == null ? null : mf;
    return function() {
      var or__3943__auto____9992 = cljs.core._dispatch[goog.typeOf(x__2312__auto____9991)];
      if(or__3943__auto____9992) {
        return or__3943__auto____9992
      }else {
        var or__3943__auto____9993 = cljs.core._dispatch["_"];
        if(or__3943__auto____9993) {
          return or__3943__auto____9993
        }else {
          throw cljs.core.missing_protocol.call(null, "IMultiFn.-dispatch", mf);
        }
      }
    }().call(null, mf, args)
  }
};
cljs.core.do_dispatch = function do_dispatch(mf, dispatch_fn, args) {
  var dispatch_val__9996 = cljs.core.apply.call(null, dispatch_fn, args);
  var target_fn__9997 = cljs.core._get_method.call(null, mf, dispatch_val__9996);
  if(cljs.core.truth_(target_fn__9997)) {
  }else {
    throw new Error([cljs.core.str("No method in multimethod '"), cljs.core.str(cljs.core.name), cljs.core.str("' for dispatch value: "), cljs.core.str(dispatch_val__9996)].join(""));
  }
  return cljs.core.apply.call(null, target_fn__9997, args)
};
cljs.core.MultiFn = function(name, dispatch_fn, default_dispatch_val, hierarchy, method_table, prefer_table, method_cache, cached_hierarchy) {
  this.name = name;
  this.dispatch_fn = dispatch_fn;
  this.default_dispatch_val = default_dispatch_val;
  this.hierarchy = hierarchy;
  this.method_table = method_table;
  this.prefer_table = prefer_table;
  this.method_cache = method_cache;
  this.cached_hierarchy = cached_hierarchy;
  this.cljs$lang$protocol_mask$partition0$ = 4194304;
  this.cljs$lang$protocol_mask$partition1$ = 64
};
cljs.core.MultiFn.cljs$lang$type = true;
cljs.core.MultiFn.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/MultiFn")
};
cljs.core.MultiFn.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__9998 = this;
  return goog.getUid(this$)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_reset$arity$1 = function(mf) {
  var this__9999 = this;
  cljs.core.swap_BANG_.call(null, this__9999.method_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9999.method_cache, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9999.prefer_table, function(mf) {
    return cljs.core.ObjMap.EMPTY
  });
  cljs.core.swap_BANG_.call(null, this__9999.cached_hierarchy, function(mf) {
    return null
  });
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_add_method$arity$3 = function(mf, dispatch_val, method) {
  var this__10000 = this;
  cljs.core.swap_BANG_.call(null, this__10000.method_table, cljs.core.assoc, dispatch_val, method);
  cljs.core.reset_cache.call(null, this__10000.method_cache, this__10000.method_table, this__10000.cached_hierarchy, this__10000.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_remove_method$arity$2 = function(mf, dispatch_val) {
  var this__10001 = this;
  cljs.core.swap_BANG_.call(null, this__10001.method_table, cljs.core.dissoc, dispatch_val);
  cljs.core.reset_cache.call(null, this__10001.method_cache, this__10001.method_table, this__10001.cached_hierarchy, this__10001.hierarchy);
  return mf
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_get_method$arity$2 = function(mf, dispatch_val) {
  var this__10002 = this;
  if(cljs.core._EQ_.call(null, cljs.core.deref.call(null, this__10002.cached_hierarchy), cljs.core.deref.call(null, this__10002.hierarchy))) {
  }else {
    cljs.core.reset_cache.call(null, this__10002.method_cache, this__10002.method_table, this__10002.cached_hierarchy, this__10002.hierarchy)
  }
  var temp__4090__auto____10003 = cljs.core.deref.call(null, this__10002.method_cache).call(null, dispatch_val);
  if(cljs.core.truth_(temp__4090__auto____10003)) {
    var target_fn__10004 = temp__4090__auto____10003;
    return target_fn__10004
  }else {
    var temp__4090__auto____10005 = cljs.core.find_and_cache_best_method.call(null, this__10002.name, dispatch_val, this__10002.hierarchy, this__10002.method_table, this__10002.prefer_table, this__10002.method_cache, this__10002.cached_hierarchy);
    if(cljs.core.truth_(temp__4090__auto____10005)) {
      var target_fn__10006 = temp__4090__auto____10005;
      return target_fn__10006
    }else {
      return cljs.core.deref.call(null, this__10002.method_table).call(null, this__10002.default_dispatch_val)
    }
  }
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefer_method$arity$3 = function(mf, dispatch_val_x, dispatch_val_y) {
  var this__10007 = this;
  if(cljs.core.truth_(cljs.core.prefers_STAR_.call(null, dispatch_val_x, dispatch_val_y, this__10007.prefer_table))) {
    throw new Error([cljs.core.str("Preference conflict in multimethod '"), cljs.core.str(this__10007.name), cljs.core.str("': "), cljs.core.str(dispatch_val_y), cljs.core.str(" is already preferred to "), cljs.core.str(dispatch_val_x)].join(""));
  }else {
  }
  cljs.core.swap_BANG_.call(null, this__10007.prefer_table, function(old) {
    return cljs.core.assoc.call(null, old, dispatch_val_x, cljs.core.conj.call(null, cljs.core._lookup.call(null, old, dispatch_val_x, cljs.core.PersistentHashSet.EMPTY), dispatch_val_y))
  });
  return cljs.core.reset_cache.call(null, this__10007.method_cache, this__10007.method_table, this__10007.cached_hierarchy, this__10007.hierarchy)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_methods$arity$1 = function(mf) {
  var this__10008 = this;
  return cljs.core.deref.call(null, this__10008.method_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_prefers$arity$1 = function(mf) {
  var this__10009 = this;
  return cljs.core.deref.call(null, this__10009.prefer_table)
};
cljs.core.MultiFn.prototype.cljs$core$IMultiFn$_dispatch$arity$2 = function(mf, args) {
  var this__10010 = this;
  return cljs.core.do_dispatch.call(null, mf, this__10010.dispatch_fn, args)
};
cljs.core.MultiFn;
cljs.core.MultiFn.prototype.call = function() {
  var G__10012__delegate = function(_, args) {
    var self__10011 = this;
    return cljs.core._dispatch.call(null, self__10011, args)
  };
  var G__10012 = function(_, var_args) {
    var args = null;
    if(goog.isDef(var_args)) {
      args = cljs.core.array_seq(Array.prototype.slice.call(arguments, 1), 0)
    }
    return G__10012__delegate.call(this, _, args)
  };
  G__10012.cljs$lang$maxFixedArity = 1;
  G__10012.cljs$lang$applyTo = function(arglist__10013) {
    var _ = cljs.core.first(arglist__10013);
    var args = cljs.core.rest(arglist__10013);
    return G__10012__delegate(_, args)
  };
  G__10012.cljs$lang$arity$variadic = G__10012__delegate;
  return G__10012
}();
cljs.core.MultiFn.prototype.apply = function(_, args) {
  var self__10014 = this;
  return cljs.core._dispatch.call(null, self__10014, args)
};
cljs.core.remove_all_methods = function remove_all_methods(multifn) {
  return cljs.core._reset.call(null, multifn)
};
cljs.core.remove_method = function remove_method(multifn, dispatch_val) {
  return cljs.core._remove_method.call(null, multifn, dispatch_val)
};
cljs.core.prefer_method = function prefer_method(multifn, dispatch_val_x, dispatch_val_y) {
  return cljs.core._prefer_method.call(null, multifn, dispatch_val_x, dispatch_val_y)
};
cljs.core.methods$ = function methods$(multifn) {
  return cljs.core._methods.call(null, multifn)
};
cljs.core.get_method = function get_method(multifn, dispatch_val) {
  return cljs.core._get_method.call(null, multifn, dispatch_val)
};
cljs.core.prefers = function prefers(multifn) {
  return cljs.core._prefers.call(null, multifn)
};
cljs.core.UUID = function(uuid) {
  this.uuid = uuid;
  this.cljs$lang$protocol_mask$partition1$ = 0;
  this.cljs$lang$protocol_mask$partition0$ = 543162368
};
cljs.core.UUID.cljs$lang$type = true;
cljs.core.UUID.cljs$lang$ctorPrSeq = function(this__2258__auto__) {
  return cljs.core.list.call(null, "cljs.core/UUID")
};
cljs.core.UUID.prototype.cljs$core$IHash$_hash$arity$1 = function(this$) {
  var this__10015 = this;
  return goog.string.hashCode(cljs.core.pr_str.call(null, this$))
};
cljs.core.UUID.prototype.cljs$core$IPrintable$_pr_seq$arity$2 = function(_10017, _) {
  var this__10016 = this;
  return cljs.core.list.call(null, [cljs.core.str('#uuid "'), cljs.core.str(this__10016.uuid), cljs.core.str('"')].join(""))
};
cljs.core.UUID.prototype.cljs$core$IEquiv$_equiv$arity$2 = function(_, other) {
  var this__10018 = this;
  var and__3941__auto____10019 = cljs.core.instance_QMARK_.call(null, cljs.core.UUID, other);
  if(and__3941__auto____10019) {
    return this__10018.uuid === other.uuid
  }else {
    return and__3941__auto____10019
  }
};
cljs.core.UUID.prototype.toString = function() {
  var this__10020 = this;
  var this__10021 = this;
  return cljs.core.pr_str.call(null, this__10021)
};
cljs.core.UUID;
goog.provide("hello_world.hello");
goog.require("cljs.core");
document.write("<p>Hello, world!</p>");
