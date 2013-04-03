(function(root) {

var is_node = typeof require != 'undefined';
if (is_node)
  module.exports = template;
else
  root.template = template;

var cache = {};
var regex = /\{\{(\{)?(.+?)\}\}\}?/g;
var html_regex = /\{\{(\{)?(.+?)\.html\}\}\}?/gi;

function template(path, obj, callback) {
  preload(path, function(err) {
    if (err) return callback(err);
    _template(cache[path], obj, callback);
  });
}

function templateSync(path, obj) {
  return _template(cache[path], obj);
}

function _template(template, obj, callback) {
  var result = template.replace(regex, function(match, third_brace, key) {
    if (key.slice(-5).toLowerCase() == '.html') {
      if (!(key in cache))
        throw new Error('template "' + key + '" not preloaded');
      return _template(cache[key], obj[key.slice(0, -5)] || obj);
    }

    var val = obj[key];
    if (val == null)
      return '';

    return third_brace ? val : escape(val);
  });
  
  if (callback)
    callback(null, result);
  else
    return result;
}

function preload(path, callback) {
  function cb(err, template) {
    if (err) return callback(err);

    cache[path] = template;

    var nested_templates = template.match(html_regex);
    if (!nested_templates.length)
      return callback();

    // TODO: inline _.after() to remove the underscore dependency
    var cb = _.after(nested_templates.length, callback);
    nested_templates.forEach(function(path) {
      preload(path, cb);
    });
  }

  if (is_node)
    require('fs').readFile(path, 'utf-8', cb);
  else if (root.$)
    $.ajax(path, ajaxSettings(cb));
  else
    throw new Error('When running in the browser, jQuery/Zepto is necessary to pull in templates via ajax');
}

function ajaxSettings(callback) {
  return {
    'success': function(data) {
      callback(null, data);
    },
    'error': function(jqXHR, textStatus, errorThrown) {
      callback(errorThrown);
    }
  }
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

})(this);