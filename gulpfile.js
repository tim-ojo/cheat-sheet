'use strict';
/* jshint node:true */

var electron = require('gulp-electron');
var gulp = require('gulp');

var packageJson = require('./src/package.json');

process.NODE_ENV = 'test';

gulp.task('electron', function() {

    gulp.src("")
    .pipe(electron({
        src: './src',
        packageJson: packageJson,
        release: './release',
        cache: './cache',
        version: 'v0.35.2',
        rebuild: false,
        packaging: true,
        asar: false,
        platforms: ['linux-x64'],
        platformResources: {
            darwin: {
                CFBundleDisplayName: packageJson.name,
                CFBundleIdentifier: packageJson.name,
                CFBundleName: packageJson.name,
                CFBundleVersion: packageJson.version,
                icon: 'gulp-electron.icns'
            },
            win: {
                "version-string": packageJson.version,
                "file-version": packageJson.version,
                "product-version": packageJson.version,
                "icon": 'gulp-electron.ico'
            }
        }
    }))
    .pipe(gulp.dest(""));
});

gulp.task('default', ['electron']);
