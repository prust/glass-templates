(function(root) {

if (typeof require != 'undefined')
  module.exports = GlassTemplates;
else
  root.GlassTemplates = GlassTemplates;

var regex = /\{\{(\{)?\s*(.+?)\s*\}\}\}?/g;
var nested_regex = /\{\{(\{)?\s*(.+?)\.html\s*\}\}\}?/gi;

function GlassTemplates(templates) {
  if (typeof templates == 'string')
    templates = {'default': templates};

  function template(obj, tmpl_name) {
    var template = templates[tmpl_name || 'default'];
    if (!template)
      throw new Error('Template "' + (tmpl_name || 'default') + '" not found.');

    return template.replace(regex, function(match, third_brace, key) {
      if (nested_regex.test(match)) {
        var separator_ix = key.indexOf(' ');
        if (separator_ix > -1) {
          var nested_obj = obj[key.slice(0, separator_ix)];
          key = key.slice(separator_ix + 1);
        }

        if (!(key in templates))
          throw new Error('template "' + key + '" not preloaded');
        return template(templates[key], nested_obj || obj);
      }

      var val = obj[key];
      if (val == null)
        return '';

      return third_brace ? val : escape(val);
    });
  }

  return {'template': template};
}

GlassTemplates.template = function(templ, obj) {
  return GlassTemplates(templ).template(obj);
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