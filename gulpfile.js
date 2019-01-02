'use strict';

var
/** Modules */
lib = {
    gulp: require('gulp'),
    fs: require('fs'),
    clean: require('del'),
    sass: require('gulp-sass'),
    autoprefixer: require('gulp-autoprefixer'),
    uglify: require('gulp-uglify'),
    concat: require('gulp-concat'),
    sourcemaps: require('gulp-sourcemaps')
},

/** Configuration */
parameters = require('yargs').argv,
dir = {
    modules: parameter('source', '') + parameter('source-modules', 'node_modules/'), // source libraries (CSS/JS)
    styles: parameter('source', '') + parameter('source-styles', 'src/Style/'), // source CSS
    scripts: parameter('source', '') + parameter('source-scripts', 'src/Script/'), // source JS
    resources: parameter('source', '') + parameter('source-assets', 'src/Resources/'), // source assets
    css: parameter('target', '') + parameter('target-css', 'public/css/'), // target CSS
    js: parameter('target', '') + parameter('target-js', 'public/js/'), // target JS
    dist: parameter('target', '') + parameter('target-dist', 'public/dist/') // target distribution
},
options = {
    sass: {
        outputStyle: parameter('css-style', 'compressed'),
        includePaths: parameter('css-paths', [dir.modules]),
        errLogToConsole: true
    },
    autoprefixer: {
        browsers: parameter('css-autoprefixer', ['last 100 versions', '> 1%']),
        cascade: false
    },
    uglify: {
        preserveComments: parameter('js-comments', 'off')
    }
},
themes = parameter('themes', []),
environment = parameter('environment', ''),
styles, scripts;

/** Helpers */
function parameter(key, value, callback)
{
    if (!parameters[key]) {
        return typeof value !== 'undefined' ? value : null;
    }

    if (typeof callback === 'undefined' && Array.isArray(value)) {
        callback = function(p) {
            return p.split(',');
        };
    }

    return callback
        ? callback(parameters[key])
        : parameters[key];
} // get parameter

function version(done) {
    var file = lib.fs.readFileSync('dot.env', 'utf8');
    environment = file.split('=v')[1].trim();

    done();
} // Retrieve version info

function read(folder, filter, callback)
{
    return lib.fs.readdirSync(folder).forEach(function(filename) {
        var file = filename.split('.');

        if (
            file.pop() === filter && (
                themes.length === 0 ||
                themes.indexOf(file[0]) !== -1 ||
                themes.indexOf(filename) !== -1
            )
        ) {
            callback(file[0]);
        }
    });
} // Read file or folder

function load(done) {
    styles = [];
    scripts = [];

    read(dir.styles, 'scss', function(file) {
        styles.push({
            name: file,
            files: dir.styles + file + '.scss'
        });
    });

    read(dir.scripts, 'js', function(file) {
        var scriptName = './' + dir.scripts + file + '.js';
        delete require.cache[require.resolve(scriptName)];

        scripts.push({
            name: file,
            files: require(scriptName).scripts(dir)
        });
    });

    log('Environment: ' + (environment ? 'prod' : 'dev') + '' + (environment ? ' / Version: ' + environment : ''));
    log('Themes loaded: ' + (themes.length ? themes.join(', ') : 'all'));

    done();
} // Config style/script themes

function resources(done) {
    lib.gulp.src([dir.resources + '**/*'])
        .pipe(lib.gulp.dest(dir.dist + environment));

    log('Resources copied');

    done();
}

function clean() {
    var target = [
        dir.dist + environment,
        dir.js + '*.js',
        dir.css + '*.css'
    ];

    log('Cleaning target folders: "' + target.join('", "') + '"');

    return lib.clean(target);
}

function watcher(done) {
    lib.gulp.watch(dir.styles + '**/*.scss').on('change', css);
    lib.gulp.watch(dir.scripts + '**/*.js').on('change', js);

    done();
}

function css(done) {
    for (var i in styles) {
        var source = styles[i],
            stream;

        if (environment) {
            stream = lib.gulp.src(source.files)
                .pipe(lib.sass(options.sass).on('error', lib.sass.logError))
                .pipe(lib.autoprefixer(options.autoprefixer));

        } else {
            stream = lib.gulp.src(source.files)
                .pipe(lib.sourcemaps.init())
                .pipe(lib.sass(options.sass).on('error', lib.sass.logError))
                .pipe(lib.autoprefixer(options.autoprefixer))
                .pipe(lib.sourcemaps.write());
        }

        write(stream, source.name, 'css');
    }

    if (typeof done === 'function') {
        done();
    }
} // Compile/Unify/Minify CSS

function js(done) {
    for (var i in scripts) {
        var source = scripts[i],
            stream;

        if (environment) {
            stream = lib.gulp.src(source.files)
                .pipe(lib.concat(source.name + '.js'))
                .pipe(lib.uglify(options.uglify));
        } else {
            stream = lib.gulp.src(source.files)
                .pipe(lib.sourcemaps.init())
                .pipe(lib.concat(source.name + '.js'))
                .pipe(lib.gulp.dest(dir.js))
                .pipe(lib.uglify(options.uglify))
                .pipe(lib.sourcemaps.write());
        }

        write(stream, source.name, 'js');
    }

    if (typeof done === 'function') {
        done();
    }
} // Obfuscate/Unify/minify JS

function write(stream, name, type)
{
    if (environment) {
        stream
            .pipe(lib.gulp.dest(dir.dist + environment + '/' + type + '/'))
            .pipe(lib.gulp.dest(dir[type]));
    } else {
        stream.pipe(lib.gulp.dest(dir[type]));
    }

    stream.on('end', function() {
        notification(name, type);
    });
}

function notification(name, type)
{
    log(environment
        ? name + '.' + type + ' compiled'
        : name + '.' + type + ' compiled/mapped'
    , true);
}

function log(message, output)
{
    var line = output ? '[------->] ' : '[<-------] ';

    console.log(line + message);
}

/** Tasks */
lib.gulp.task(
    'clean',
    lib.gulp.series([version, clean])
); // Clean targets

lib.gulp.task(
    'build',
    lib.gulp.series([version, resources, load, css, js])
); // Main production task (clean outputs and compile once)

lib.gulp.task(
    'watch',
    lib.gulp.series([load, css, js, watcher])
); // Main development task (compile on each source change)

lib.gulp.task('default', function() {
    console.log('');
    console.log('USE:');
    console.log('node_modules/.bin/gulp <task> [parameters]');
    console.log('gulp <task> [parameters] (if gulp globally installed)');
    console.log('');
    console.log('TASKS:');
    console.log('build | Install dependencies, clean target directories and compile assets');
    console.log('watch | Compile assets on each saving resource file');
    console.log('clean | Removes target files');
    console.log('');
    console.log('PARAMETERS:');
    console.log('--themes | custom themes (e.g: "styleguide,default")');
    console.log('--environment | compile environment (default: null)');
    console.log('--css-style | output css format (values: nested/expanded/compact/compressed; default: "compressed")');
    console.log('--css-paths | include base paths (default: "node_modules/")');
    console.log('--css-autoprefixer | vendors for browsers support (default: "last 100 versions,> 1%" (default)');
    console.log('--js-comments | preserve js comments (values: some/preserve/off/license; default: "off")');
    console.log('--source | relative path for base source (e.g: "../assets/"; default: "")');
    console.log('--target | relative path for assets deployment (e.g: "../"; default: "")');
    console.log('--source-modules | relative path to base source for external modules (default : "node_modules/")');
    console.log('--source-styles | relative path to base source for input css (default : "src/Style/")');
    console.log('--source-scripts | relative path to base source for input js (default : "src/Script/")');
    console.log('--source-assets | relative path to base resources to copy (default : "src/Resources/")');
    console.log('--target-css | relative path to target source for output css (default : "public/css/")');
    console.log('--target-js | relative path to target source for output js (default : "public/js/")');
    console.log('--target-dist | relative path to target source for releases distribution (default : "public/dist/")');
    console.log('');
}); // Main task: command help list