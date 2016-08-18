/// <reference path="typings/main.d.ts" />

var PLUGIN_NAME = "gulp-vue-template2js",
    through = require('through2'),
    File = require('vinyl'),
    path = require('path'),
    fs = require('fs'),
    htmlJsStr = require('js-string-escape'),
    htmlclean = require('htmlclean'),
    async = require("async"),
    PluginError = require('gulp-util').PluginError;
    
module.exports = function(options) {
    options = options || {
        sourceRoot: false,
    };
    
    var transform = function(file, encoding, callback) {
        var self = this;
        var reg = /template\s*?:\s*?["']@(.*?)(@into\((.*?)\)|)["']/ig;
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
            callback();
        } else  {
            var dir = file.path.replace(/[^\\/]+\.js$/ig, ''),
                content = file.contents.toString(),
                htmlPath;
            
            if(options.sourceRoot){
                dir = path.join(options.sourceRoot, file.relative.substring(0, file.relative.indexOf(file.basename)))
            }
            
            var match = reg.exec(content);
            
            if(match && match[1]){
                htmlPath = path.join(dir, match[1]);
            } else if(match) {
                htmlPath = path.join(dir, file.basename.replace(file.extname, '.html'));
            } else{
                self.push(file);
                callback();
                
                return;
            }

            if(fs.existsSync(htmlPath)){
                fs.readFile(htmlPath, function(err, data){
                    if(!err){
                         if(match[2]) {
                            var extensions = match[2].split('@into');
                            var funcs = [];
                            
                            for(var i in extensions){
                                if(extensions[i]){
                                    var dest = extensions[i].substring(1, extensions[i].length - 1);
                                    
                                    funcs.push(((dest) =>{
                                         return function(cb){
                                            fs.readFile(path.join(dir, dest), cb)
                                        }
                                    })(dest));
                                }
                            }
                            async.parallel(funcs, function(err, files){
                                if(err){
                                    self.emit('error', new PluginError(PLUGIN_NAME, err));
                                    self.push(file);
                                    callback();
                                } else {
                                    var html = files.reduce(function (source, dest, i) {
                                        return inject(source, dest.toString());
                                    }, data.toString() );
                                    submitContent(html, content, callback);
                                }
                            });
                        } else{
                            submitContent(data.toString(), content, callback);
                        }
                    } else{
                        callback(err);
                    }
                });
            } else {
                this.emit('error', new PluginError(PLUGIN_NAME, htmlPath + ' is not found'));
                self.push(file);
                callback();
            }
        } 
        
        function submitContent(html, fileContent, cb){
            html = html.toString().replace(/<style\s*.*\s*>[\s\S]*<\/style\s*>/, '');
            var htmlContent = htmlclean(html);
            fileContent = fileContent.replace(reg, 'template: "' + htmlJsStr(htmlContent) + '"');
            
            self.push( new File({
                cwd: file.cwd,
                base: file.base,
                path: file.path,
                contents: new Buffer(fileContent)
            }));
            
            cb();
        }
    };

    return through.obj(transform);
};

function inject(sourceContents, destinationContents){
    
    var regInsertion = function(target){
        return new RegExp('<!--\\s*@insertion\\s*'+ (target ? ':' : '') +'\\s*' + target + '\\s*-->([\\s\\S]*?)<!--\\s*@endinsertion\\s*-->', "gi");
    }, regInto = /<!--\s*@into\s*(:?\s*(.*?))\s*-->([\s\S]*?)<!--\s*@endinto\s*-->/gi,
        match = regInto.exec(sourceContents);
    
    if(!match){ //there is no @into but maybe there is an default insertion point
        destinationContents = destinationContents.replace(
            regInsertion(''), sourceContents
        );
    }
    
    while(match){
        destinationContents = destinationContents.replace(
            regInsertion(match[2]), match[3]
        );
        match = regInto.exec(sourceContents);
    }
    
    return destinationContents;
}
