(function(root) {

if (typeof require != 'undefined')
  module.exports = template;
else
  root.glassTemplate = template;

var _ = root._ || require('underscore');

var regex = /\{\{(\{)?\s*(.+?)\s*\}\}\}?/g;
var templates = {};
var children = {};

function template(tmpl_path, obj, callback) {
  if (isLoaded(tmpl_path))
    return callback(null, _template(tmpl_path, obj));

  if (!(tmpl_path in templates))
    loadTemplates(tmpl_path);

  onTemplatesLoaded(function() {
    callback(null, _template(tmpl_path, obj));
  });
}

var path_root;
template.setRoot = function(new_root) { path_root = new_root; };

function isLoaded(path) {
  return templates[path] && _.all(children[path], isLoaded);
}

function _template(tmpl_path, obj) {
  var tmpl = templates[tmpl_path];
  if (!tmpl)
    throw new Error('Template "' + tmpl_path + '" not preloaded.');

  return tmpl.replace(regex, function(match, third_brace, key) {
    var separator_ix = key.indexOf(' ');
    if (separator_ix > -1) {
      var nested_tmpl = key.slice(separator_ix + 1);
      key = key.slice(0, separator_ix)
      var nested_obj = key == '.' ? obj : obj[key];
      if (!nested_obj)
        return '';
      
      if (nested_obj && Array.isArray(nested_obj)) {
        return nested_obj.map(function(obj) {
          return _template(nested_tmpl, obj);
        }).join('\n');
      }
      else {
        return _template(nested_tmpl, nested_obj || obj);
      }
    }

    var val;
    if (key == '.') {
      val = obj;
    }
    else {
      var deep_obj = obj;
      var key_parts = key.split('.');
      key_parts.forEach(function(key, i) {
        if (deep_obj)
          deep_obj = deep_obj[key];
        if (i == key_parts.length - 1)
          val = deep_obj;
      });
    }
    
    if (val == null)
      return '';

    if (typeof str != "string")
      val = val.toString();

    return (third_brace || typeof val == 'number') ? val : escape(val);
  });
}

// from _.template()
var charCodes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};
function escape(str) {
  return str.replace(/[&<>"'\/]/g, function(s) {
    return charCodes[s];
  });
}

function loadTemplates(path) {
  templates[path] = null;
  var full_path = path_root ? (path_root + '/' + path) : path;

  if (typeof require != 'undefined')
    require('fs').readFile(full_path, 'utf-8', cb);
  else if (root.$)
    $.ajax(ajaxSettings({'url': full_path}, cb));
  else
    throw new Error('When running in the browser, jQuery/Zepto is necessary to pull in templates via ajax');

  function cb(err, template) {
    if (err) throw err;

    templates[path] = template;
    children[path] = [];

    var match;
    while (match = regex.exec(template)) {
      var key = match[2];
      var separator_ix = key.indexOf(' ');
      if (separator_ix == -1)
        continue;

      var nested_path = key.slice(separator_ix + 1);
      children[path].push(nested_path);
      if (!(nested_path in templates))
        loadTemplates(nested_path);
    }

    // if all are loaded, call the loaded_handlers
    for (var tmpl_path in templates)
      if (!templates[tmpl_path])
        return;

    loaded_handlers.forEach(function(handler) {
      handler();
    });
    loaded_handlers = [];
  }
}

var loaded_handlers = [];
function onTemplatesLoaded(handler) {
  loaded_handlers.push(handler);
}

function ajaxSettings(opts, callback) {
  opts.success = function(data) {
    callback(null, data);
  };
  opts.error = function(jqXHR, textStatus, errorThrown) {
    callback(errorThrown || jqXHR.status || textStatus);
  };
  return opts;
}

})(this);