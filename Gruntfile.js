/* global module */

'use strict';

module.exports = function(grunt) {
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  grunt.initConfig({
    clean: {
      dist: [
        'dist/*',
        'dist/**'
      ]
    },
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
    },
    concat: {
      options: {
        separator: "\n"
      },
      js: {
        src: [
          'src/js/module.js',
          'src/js/service/**/*.js',
          'src/js/directive/**/*.js',
          'src/js/filter/**/*.js'
        ],
        dest: 'dist/js/nbUseful.js'
      },
      css: {
        src: [
          'src/css/**/*.css'
        ],
        dest: 'dist/css/nbUseful.css'
      }
    }
  });
    
  grunt.registerTask('dist', function () {
    grunt.task.run(['clean:dist', 'uglify:src', 'cssmin:src', 'concat:js', 'concat:css']);
  });
};