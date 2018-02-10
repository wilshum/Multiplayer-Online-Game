module.exports = function (grunt) {

    grunt.registerTask('default', 'concat');

    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: '\n'
            },
            server: {
                src: ['server/**/*.js', 'app.js'],
                dest: 'completeApp.js'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};