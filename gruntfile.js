'use strict';

let os = require('os'),
    path = require('path');

module.exports = function (grunt) {

    let dest = grunt.option('dest') || path.normalize(__dirname + '/dest/'),
        compress = grunt.option('compress') || false,
        tmp = os.tmpdir(),
        cssVendors = [];

    grunt.initConfig({
        watch: {
            configFiles: {
                files: 'gruntfile.js',
                tasks: ['build'],
                options: {reload: true, spawn: false}
            },
            js: {
                files: ['src/**/*.js'],
                tasks: ['js'],
                options: {spawn: false},
            },
            jade: {
                files: ['src/**/*.jade'],
                tasks: ['jade'],
                options: {spawn: false},
            },
            stylus: {
                files: ['src/**/*.styl'],
                tasks: ['stylus', 'concat:css'],
                options: {spawn: false},
            },
            copy: {
                files: ['src/**/*.{html,css}'],
                tasks: ['copy:originals'],
                options: {spawn: false},
            },
            images: {
                files: ['src/**/*.{png,jpg,gif}'],
                tasks: ['imagemin'],
                options: {spawn: false},
            }
        },
        browserSync: {
            bsFiles: {
                src: [`js`, `html`, `css`].reduce((paths, ext) => {
                    paths.push(`${dest}/**/*.${ext}`);
                    return paths;
                }, []),
            },
            options: {
                server: {
                    baseDir: dest,
                    directory: true
                },
                watchTask: true,
            }
        },

        stylus: {
            build: {
                src: 'src/css/style.styl',
                dest: `${tmp}/stylus.css`,
                options: {
                    paths: ['bower_components/bootstrap-stylus'],
                    compress,
                    'resolve url': true,
                    'include css': true,
                }
            },
        },

        copy: {
            originals: {
                cwd: 'src',
                expand: true,
                src: ['**/*.html', '**/*.css', '!**/_*.html', '!**/_*.css'],
                dest
            },
            fa: {
                cwd: 'bower_components/Font-Awesome-Stylus/fonts',
                expand: true,
                src: ['**/*'],
                dest: `${dest}/css/fonts`
            }
        },

        jade: {
            build: {
                cwd: 'src',
                expand: true,
                src: ['**/*.jade', '!**/_*.jade'],
                ext: ".html",
                extDot: "last",
                options: {pretty: !compress},
                dest
            }
        },

        concat: {
            css: {
                src: ['<%= stylus.build.dest %>'].concat(cssVendors),
                dest: `${dest}/css/style.css`,
            }
        },

        postcss: {
            options: {
                processors: [
                    require('autoprefixer')({browsers: 'last 5 versions'}),
                ]
            },
            dist: {
                src: '<%= concat.css.dest %>'
            }
        },

        imagemin: {
            static: {
                options: {
                    use: [require('imagemin-mozjpeg')()],
                },
                expand: true,
                cwd: 'src',
                src: ['**/*.{png,jpg,gif}', '**/*.{png,jpg,gif}'],
                dest,
            },
        }
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('dev', ['stylus', 'jade', 'imagemin', 'concat', 'copy']);
    grunt.registerTask('build', ['dev', 'postcss']);
    grunt.registerTask('default', ['dev', 'browserSync', 'watch']);
};