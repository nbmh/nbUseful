/* global module */

'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    uglify: {
      src: {
        options: {
          sourceMap: false,
          preserveComments: false,
          report: 'gzip'
        },
        files: {
          'dist/js/nbUseful.min.js': [
            'src/js/module.js',
            'src/js/**/*.js'
          ]
        }
      }
    },
    cssmin: {
      options: {
        sourceMap: false,
        preserveComments: false,
        report: 'gzip'
      },
      src: {
        files: {
          'dist/css/nbUseful.min.css': [
            'src/css/*.css',
            'src/css/**/*.css'
          ]
        }
      }
    }
  });
    
  grunt.registerTask('dist', function () {
    grunt.task.run(['uglify:src', 'cssmin:src']);
  });
};