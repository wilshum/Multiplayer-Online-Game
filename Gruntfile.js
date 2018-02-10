module.exports = function (grunt) {

    grunt.registerTask('default', function () {
        console.log("DEFAULT");
    });

    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: ';',
            },
            // cilent: {
            //     src: ['cilent/js/**/*.js'],
            //     dest: 'build/cilentScript.js',
            // },
            server: {
                src: ['server/**/*.js','app.js'],
                dest: 'completeApp.js',
            }
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};