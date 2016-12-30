/**
 * grunt-svg-adobe-cleaner
 * 
 *
 * @author 2015 Jaie Wilson
 */

'use strict';

module.exports = function(grunt) {

  //var xml2js = require('xml2js');

  //var parser = new xml2js.Parser();

  var DOMParser = require('xmldom').DOMParser;

  grunt.registerMultiTask('svg_adobe_cleaner', 'Cleans up adobe tags from svg files', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({});

    var log = grunt.log;
    var ADOBE_ATTRS = ["x", "i", "graph"];
    var ADOBE_NS = {
      "x": "&ns_extend;",
      "i": "&ns_ai;",
      "graph": "&ns_graphs;"
    };
    var SVG_NS = "http://www.w3.org/2000/svg";

    var errorHandler = function(file) {
      return {
        'warning': function(w) {  
          // do nothing.
        },
        'error': function(e) {
          if (e.match('entity not found')) {
            return;
          }
          log.writeln("Error processing file: " + file);
          log.writeln(e);
        },
        'fateError': function(fe) {
          log.writeln("Error processing file: " + file);
          log.writeln(fe);
          throw new Error(fe);
        }
      }
    }

    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      // Concat specified files.
      var src = f.src.filter(function(filepath) {
        // Warn on and remove invalid source files (if nonull was set).
        if (!grunt.file.exists(filepath)) {
          grunt.log.warn('Source file "' + filepath + '" not found.');
          return false;
        } else {
          return true;
        }
      }).map(function(filepath) {
        // Read file source.
        var fileContents = grunt.file.read(filepath);
        var doc = new DOMParser({errorHandler: errorHandler(filepath)}).parseFromString(fileContents, 'text/xml');

        var childNodes = doc.childNodes;
        for(var i = 0; i < childNodes.length; i++) {
          var node = childNodes.item(i);
          if (node.nodeType == 8) { //COMMENT_NODE
            node.parentNode.removeChild(node);
          }
        }

        var foreignObjects = doc.documentElement.getElementsByTagName("foreignObject");
        for (var i = 0; i < foreignObjects.length; i++) {
          var node = foreignObjects.item(i);
          node.parentNode.removeChild(node);
        }

        var adobePgf = doc.getElementById("adobe_illustrator_pgf");
        if (adobePgf) {
          adobePgf.parentNode.removeChild(adobePgf);
        }

        function removeAttr(el, name, value) {
          if (el.hasAttribute(name)) {
            var attrNode = svg.getAttributeNode(name);
            if (svg.getAttributeNode(name).value == value || typeof value === 'undefined') {
              svg.removeAttributeNode(svg.getAttributeNode(name));
            }
          }
        }

        var svg = doc.getElementsByTagName("svg")[0];

        for(var i = 0; i < ADOBE_ATTRS.length; i++) {
          removeAttr(svg, "xmlns:" + ADOBE_ATTRS[i], ADOBE_NS[ADOBE_ATTRS[i]]);
        }

        removeAttr(svg, "id");

        var gs = svg.getElementsByTagName("g");
        for (var i = 0; i< gs.length; i++) {
          var g = gs.item(i);
          if (g.hasAttributeNS(ADOBE_NS.i, "extraneous")) {
            g.removeAttributeNode(g.getAttributeNodeNS(ADOBE_NS.i, "extraneous"));
          }
        }

        function findFirstNode(nodes) {
          for(var i = 0; i< nodes.length; i++) {
            var node = nodes[i];
            if (node.nodeType === 1) {
              return node;
            }
          }
          return null;
        }

        return doc.toString();
      });

      // Write the destination file.
      grunt.file.write(f.dest, src);

      // Print a success message.
      // grunt.log.writeln('File "' + f.dest + '" created.');
    });
  });

};
