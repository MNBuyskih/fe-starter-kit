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
                files: ['<%= imagemin.static.src %>'],
                tasks: ['imagemin'],
                options: {spawn: false},
            },
            icons: {
                files: ['<%= sprite.icons.src %>'],
                tasks: ['sprite', 'icons', 'stylus', 'concat:css'],
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
            options: {
                use: [require('imagemin-mozjpeg')()],
            },
            static: {
                expand: true,
                cwd: 'src',
                src: ['**/*.{png,jpg,gif}', '!**/icons/*.{png,jpg,gif}'],
                dest,
            },
            icons: {
                files: {
                    '<%= sprite.icons.dest %>': '<%= sprite.icons.dest %>'
                }
            }
        },

        sprite: {
            icons: {
                src: 'src/css/images/icons/*',
                dest: `${dest}/css/images/icons.png`,
                destCss: 'src/css/sprites.styl',
                imgPath: 'images/icons.png',
                algorithm: 'top-down',
                padding: 10,
            },
        },
    });

    require('load-grunt-tasks')(grunt);

    grunt.registerTask('icons', 'Генерировать все доступные иконки автоматически', function () {
        let srcDir = grunt.template.process('<%= sprite.icons.src %>'),
            srcIcons = `${srcDir}`,
            iconPaths = grunt.file.expand({}, srcIcons),
            icons = iconPaths.reduce((icons, iconPath) => {
                let icon = path.basename(iconPath, path.extname(iconPath));
                icons.push(`$${icon}`);
                return icons;
            }, []),
            text = "\n\n\n// Автоматически генерируем все доступные иконки\nsprites(" + icons.join(' ') + ")",
            cssFile = grunt.template.process('<%= sprite.icons.destCss %>'),
            content = grunt.file.read(cssFile).toString() + text;

        if (!icons.length) content = "// Добавте иконки в папку src/css/images/icons или удалите этот файл и закоментируйте его подключение в style.styl";
        grunt.file.write(cssFile, content);
    });

    grunt.registerTask('dev', ['sprite', 'icons', 'stylus', 'jade', 'imagemin', 'concat', 'copy']);
    grunt.registerTask('build', ['dev', 'postcss']);
    grunt.registerTask('default', ['dev', 'browserSync', 'watch']);
};