(function(root) {

if (typeof require != 'undefined')
  module.exports = GlassTemplates;
else
  root.GlassTemplates = GlassTemplates;

var regex = /\{\{(\{)?\s*(.+?)\s*\}\}\}?/g;
var nested_regex = /\{\{ (.+?)\.html \}\}?/gi;

function GlassTemplates(templates) {
  if (typeof templates == 'string')
    templates = {'default': templates};

  function template(obj, tmpl_name) {
    var tmpl = templates[tmpl_name || 'default'];
    if (!tmpl)
      throw new Error('Template "' + (tmpl_name || 'default') + '" not found.');

    return tmpl.replace(regex, function(match, third_brace, key) {
      if (nested_regex.test(match)) {
        var separator_ix = key.indexOf(' ');
        if (separator_ix > -1) {
          var nested_tmpl = key.slice(separator_ix + 1);
          key = key.slice(0, separator_ix)
          var nested_obj = key == '.' ? obj : obj[key];
          if (!nested_obj)
            return '';
        }
        else {
          var nested_tmpl = key;
        }

        if (!(nested_tmpl in templates))
          throw new Error('template "' + nested_tmpl + '" not preloaded');
        
        if (nested_obj && Array.isArray(nested_obj)) {
          return nested_obj.map(function(obj) {
            return template(obj, nested_tmpl);
          }).join('\n');
        }
        else {
          return template(nested_obj || obj, nested_tmpl);
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