module.exports = function (grunt) {

    require("matchdep").filterDev("grunt-*").forEach(grunt.loadNpmTasks);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        karma: {
            options: {
                configFile: 'karma.conf.js'
            },
            unit: {
                background: true,
                singleRun: false
            }
        },
        less: {
            development: {
                options: {
                    compress: true,
                    yuicompress: true,
                    optimization: 2,
                    cleancss: false,
                    paths: ["dist/*.less"],
                    syncImport: false,
                    strictUnits: false,
                    strictMath: true,
                    strictImports: true,
                    ieCompat: false
                },
                files: {
                    "dist/css/<%= pkg.name %>.css": "dist/less/<%= pkg.name %>.less"
                }
            }
        },
        uglify: {
            options: {
                // the banner is inserted at the top of the output
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("dd-mm-yyyy") %> */\n',
                mangle: true
            },
            dist: {
                files: {
                    'dist/js/<%= pkg.name %>.min.js': ['lookup-directive.js']
                }
            }
        },
        jshint: {
            all: ["*.js"],
            options: {
                // options here to override JSHint defaults
                globals: {
                    "angular": true
                }
            }
        },
        watch: {
            scripts: {
                files: ["lookup-directive.js"],
                tasks: ["jshint"]
            },
            less: {
                files: ["dist/less/*.less"],
                tasks: ["less"],
                options: {
                    nospawn: true
                }
            }
        }
    });

    grunt.registerTask("prod", ["jshint", "less", "karma", "uglify", "watch"]);
};