# gulp-vue-template2js

Inject HTML templates into your [vue](http://vuejs.org/) component files.

## Install

```bash
npm install gulp-vue-template2js
```

## How to use 

### Your code


To inject HTML inside your javacript, you must put "@" inside your template definition. 

If your javascript file is named foo.js, gulp-vue-template2js will be inject foo.html.


```javascript
export default Vue.extends({
    template: "@"
});
```


The "@" can be followed by the relative path of the HTML file.
```javascript
export default Vue.extends({
    template: "@../component.html"
});
```

### Gulp task

```javascript
var gulp = require('gulp');
var tpl2js = require('gulp-vue-template2js');

gulp.task('default', function () {
    gulp.src('src/**/*.js')
        .pipe(tpl2js())
        .pipe(gulp.dest('out'));
});
```