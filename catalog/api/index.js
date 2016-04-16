/*
  # server side
  #
  # for produce thumbnails install
  # 'gm' module
  # Graphics Magick
  #
  # andy-pro 2016
*/

var fs = require("fs"),
    path = require("path"),
    colors = require("colors"),
    gm = require('gm'),
    name = 'catalog',
    projects = 'projects',

    getImages = function(fp) {
      return fs.readdirSync(fp).filter(function(_f) {
        return (exts.indexOf(path.extname(_f).toLowerCase()) > -1);
      });
    },

    isDir = function(fp) {
      try { return fs.statSync(fp).isDirectory(); }
      catch (err) { return false; }
    },

    deleteFolderRecursive = function(fp) {
      if( fs.existsSync(fp) ) {
        fs.readdirSync(fp).forEach(function(file,index){
          var curPath = path.join(fp, file);
          if(fs.lstatSync(curPath).isDirectory()) { // recurse
            deleteFolderRecursive(curPath);
          } else { // delete file
            fs.unlinkSync(curPath);
          }
        });
        fs.rmdirSync(fp);
      }
    },

    writeThumbs = function (images, src, dst, size) {
      console.log('Resize images:'.bold.green, size, 'px', src);
      try {
        deleteFolderRecursive(dst);
        fs.mkdirSync(dst);
        images.forEach(function(img) {
          __writeThumb(img, src, dst, size);
        });
      } catch (err) {
        console.log('Error:'.bold.red, err);
      }
    },

    __writeThumb = function (img, src, dst, size) {
      gm(path.join(src, img))
        .resize(size, size)
        .quality(80)
        .noProfile()
        .stream(function(err, stdout, stderr) {
          if (err) {
            console.log(err);
          } else {
            var writeStream = fs.createWriteStream(path.join(dst, img));
            stdout.pipe(writeStream);
            // stdout.pipe(response);
          }
        });
    },

    writePrjThumbs = function(images, src, client, prj) {

      function __write(_dst, _size) {
        try {
          process.stdout.write(_dst+' '+_size+' px ..... ');
          var dst = path.join(src, _dst);
          fs.mkdirSync(dst);
          images.forEach(function(img) {
            __writeThumb(img, src, dst, _size);
          });
          console.log('OK');
        } catch (err) { console.log('Error:'.bold.red, err.Error); }
      }

      console.log('Resize images:'.bold.bgYellow, client, prj);
      __write(thdir, thsize);
      __write(pvdir, pvsize);

    },

    getCategory = function(mask, map, after) {
      var _header = header;
      fs.readdir(root, function(err, clients) { // obtain clients
        console.time('run for');
        console.log();
        console.log(('Category: ' + _header).bold.bgCyan);
        var prj_cnt = 0;
        clients.forEach(function(client) {
          var cd = path.join(root, client); // client dir
          if (isDir(cd)) { // client dir?
            var prjs = fs.readdirSync(cd); // client's projects
            prjs.forEach(function(prj) {
              var cp = path.join(cd, prj); // client project
              if (isDir(cp)) {
                if (mask.test(prj)) {
                  var images = getImages(cp); // project's photos
                  if (images.length) {
                    prj_cnt++;
                    map(images, cp, client, prj);
                  } else console.log('No photos:'.bold.red, client, prj);
                }
              }
            });
          }
        });
        console.log('Count of projects:'.bold.yellow, prj_cnt);
        console.timeEnd('run for');
        // console.log();
        if (typeof after =='function') return after();
      });
    },

    clearPrjThumbs = function(images, cp) {
      deleteFolderRecursive(path.join(cp, thdir));
      deleteFolderRecursive(path.join(cp, pvdir));
      console.log('Deleted:'.bold.red, cp.bold);
    },

    mebcat = ['Кухня классика', 'Кухня модерн', 'Шкаф-купе', 'Прихожая', 'Гостиная', 'Офис', 'Детская', 'Разное'],
    titles = ['Кухни "Классика"', 'Кухни "Модерн"', 'Шкафы-купе', 'Прихожие', 'Гостиные', 'Офисная', 'Детские', 'Разное'],
    cat_cnt = mebcat.length,
    // prj_cnt = 0, id = 0, title, mask, root,
    exts = ['.jpg', '.jpeg'],
    thdir = 'thumbnails', // thumbnails
    thsize = 144,
    pvdir = 'images', // previews
    pvsize = 640,

    init = function(_id, serv) { // set module context enviroment
      this.id = _id;
      this.title = mebcat[_id];
      this.mask = new RegExp("^" + this.title);
      this.header = titles[id];
      setRoot(serv);
    },

    setRoot = function(serv) {
      this.root = path.join(process.cwd(), serv ? name : '', 'static', 'img', projects);
    },

    api = {

      //=================================================

      category: function(req, res) {

        var projects = [];
        init(req.args[0], true);
        if (!id || id >= cat_cnt) {
          return res([]);
        }

        function getProject(images, cp, client, prj) {
          var i, len = images.length;
          for(i=0; i<len; i++) if (images[i].charAt(0) == '_') break;
          projects.push({
            client: client,
            project: prj,
            thumb: images[i==len ? 0 : i]
          });
        }

        getCategory(mask, getProject, function() {
          return res(projects);
        });

      },

      //=================================================

      project: function(req, res) {

        setRoot(true);
        var thumbs = [],
            pt = path.join(root, req.args[0], req.args[1], thdir);

        // console.log('project thumbs', pt);

        var images = getImages(pt); // obtain project's thumbnails
        images.forEach(function(image) {
          thumbs.push({ thumb: image });
        });

        return res(thumbs);

      },

      //=================================================

      deleteThumbs: function(_id) {
        console.log('Deleting thumbnails & preview'.bold.bgRed);
        var readline = require('readline');
        var rl = readline.createInterface(process.stdin, process.stdout);
        rl.question("Delete thumbnails? yes/no: ", function(answer) {
          if (answer === 'yes') {
            init(_id, false);
            if (title) getCategory(mask, clearPrjThumbs);
          }
          rl.close();
        });
      },

      createThumbs: function(_id) {
        console.log('Creating thumbnails & preview'.bold.bgGreen);
        init(_id, false);
        if (title) getCategory(mask, writePrjThumbs);
      },

      updateThumbs: function(_id) {
        console.log('Updating thumbnails & preview'.bold.bgMagenta);
        init(_id, false);
        if (title) {
          getCategory(mask, clearPrjThumbs);
          getCategory(mask, writePrjThumbs);
        }
      }

    }

module.exports = api;
