(function(root) {

if (typeof require != 'undefined')
  module.exports = template;
else
  root.glassTemplate = template;

var _ = root._ || require('underscore');

var triple_brace = /\{\{\{\s*(.+?)\s*\}\}\}/g;
var double_brace = /\{\{\s*(.+?)\s*\}\}/g;
var templates = {};
var children = {};

function template(tmpl_path, obj, callback) {
  if (isLoaded(tmpl_path)) {
    return callback(null, _template(templates[tmpl_path], obj));
  }

  if (!(tmpl_path in templates))
    loadTemplates(tmpl_path);

  onTemplatesLoaded(function() {
    var tmpl = templates[tmpl_path];
    if (!tmpl)
      throw new Error('Template "' + tmpl_path + '" not loaded.');
    callback(null, _template(tmpl, obj));
  });
}

var path_root;
template.setRoot = function(new_root) { path_root = new_root; };

function isLoaded(path) {
  return templates[path] && _.all(children[path], isLoaded);
}

function _template(tmpl, obj) {
  var html = tmpl.replace(triple_brace, function(match, key) {
    var separator_ix = key.indexOf(' ');
    if (separator_ix == -1)
      return getValue(key, obj);

    var nested_tmpl = key.slice(separator_ix + 1);
    key = key.slice(0, separator_ix)

    var val = getValue(key, obj);
    if (!val)
      return '';
    
    if (nested_tmpl.slice(-5) == '.html') {
      if (!templates[nested_tmpl])
        throw new Error('Template "' + nested_tmpl + '" not loaded.');
      nested_tmpl = templates[nested_tmpl];
    }

    if (_.isArray(val)) {
      return val.map(function(obj) {
        return _template(nested_tmpl, obj);
      }).join('');
    }
    else {
      return _template(nested_tmpl, val);
    }
  });

  // 2nd pass: double braces
  return html.replace(double_brace, function(match, key) {
    var val = getValue(key, obj);
    switch (typeof val) {
      case 'string': return escape(val);
      case 'number': return val;
      case 'boolean': return val ? 'true' : 'false';
      default: throw new Error('Unsupported type: ' + typeof val);
    }
  });
}

function getValue(key, ctx) {
  if (key != '.') {  
    key = key + '.';
    while (key.length) {
      var dot_ix = key.indexOf('.');
      ctx = ctx[key.slice(0, dot_ix)]
      key = key.slice(dot_ix + 1);
      if (ctx == null)
        return '';
    }
  }
  return ctx;
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
    while (match = triple_brace.exec(template)) {
      var key = match[1];
      var separator_ix = key.indexOf(' ');
      if (separator_ix == -1)
        continue;

      var nested_path = key.slice(separator_ix + 1);
      if (nested_path.slice(-5) == '.html') {
        children[path].push(nested_path);
        if (!(nested_path in templates))
          loadTemplates(nested_path);
      }
    }

    // if all are loaded, call the loaded_handlers
    for (var tmpl_path in templates)
      if (!templates[tmpl_path])
        return;

    // clear list of queued handlers *before* calling handler fns
    // b/c sometimes the handler fns queue more handlers
    var handlers = loaded_handlers.slice();
    loaded_handlers = [];
    handlers.forEach(function(handler) {
      handler();
    });
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
