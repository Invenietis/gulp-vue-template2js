var fs = require('fs');
var assert = require('assert');
var gutil = require('gulp-util');
var tpl2js = require('./index');

it('should inject component.html into component.js', function (cb) {
	var stream = tpl2js();
	stream.on('data', function (file) {
		assert.equal(file.contents.toString(), 'export default Vue.extends({\r\n    template: "<h1>Hello World</h1>"\r\n});')
		cb();
	});

	stream.write(new gutil.File({
		path: __dirname + '/sample/component.js',
		contents: fs.readFileSync(__dirname + '/sample/component.js')
	}));
});

it('should inject component.html into another.js', function (cb) {
	var stream = tpl2js();
	stream.on('data', function (file) {
		assert.equal(file.contents.toString(), 'export default Vue.extends({\r\n    template: "<h1>Hello World</h1>"\r\n});')
		cb();
	});

	stream.write(new gutil.File({
		path: __dirname + '/sample/another.js',
		contents: fs.readFileSync(__dirname + '/sample/another.js')
	}));
});