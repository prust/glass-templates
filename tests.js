var assert = require('assert');
var template = require('./glass-templates.js');

describe('glassTemplates', function() {
  it('should load in nested templates', function(done) {
    template('test.html', {'obj': {'team': 'Mariners'}}, function(err, html) {
      assert.equal(html, "We're going to see the <strong>Mariners</strong>!");
      done();
    });
  });

  it('should reset the regex lastIndex when templating a second time', function(done) {
    template('test.html', {'obj': {'team': 'Mariners'}}, function(err, html) {
      assert.equal(html, "We're going to see the <strong>Mariners</strong>!");
      template('test.html', {'obj': {'team': 'Mariners'}}, function(err, html) {
        assert.equal(html, "We're going to see the <strong>Mariners</strong>!");
        done();
      });
    });
  });

  it('should support inline nested templates', function(done) {
    template('inline_nested.html', {'teams': ['Mariners', 'Red Sox']}, function(err, html) {
      assert.equal(html, "<ul><li>Mariners</li><li>Red Sox</li></ul>")
      done();
    });
  });
});