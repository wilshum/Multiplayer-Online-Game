

module.exports = function(grunt) {

    grunt.registerTask('default', function(){
        console.log("DEFAULT");
    });

    // Project configuration.
    grunt.initConfig({
        concat: {
            options: {
                separator: ';',
            },
            dist: {
                src: ['app.js', 'js/*.js'],
                dest: 'build/script.js',
            },
        },
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
};