const currentPath = process.cwd(),
  fs = require(`fs`),
  filetree = require(`ps-filetree`),
  pathLib = require(`path`),
  ultility = require(`ps-ultility`);
let basePath = `./ps-core/json`;
function stringify(obj){
  return JSON.stringify(obj, null, 2);
}
function parse(str){
  return JSON.parse(str);
}
function random(length){
  var chars = `abcdedfghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890`,
    rs = "", rnd, len = chars.length;
  for(var i = 0; i < length; i++){
    rnd = parseInt( Math.random() * len );
    rs += chars[rnd];
  }
  console.dir(rs);
  return rs;
}
function writeFile(viewId, option, callback){
  fs.writeFile(pathLib.resolve(currentPath, basePath, "./json_" + viewId + ".json"), option, (e)=>{
    callback(stringify( e || {
      code : 0,
      message : null,
      data : parse(option)
    }))
  });
}
function readFile(viewId, callback){
  readFileData(viewId, (d)=>{
    callback(stringify(d));
  })
}
function readFileData(viewId, callback){
  fs.readFile(pathLib.resolve(currentPath, basePath, "./json_" + viewId + ".json"), (e, d)=>{
    callback( e || {
      code : 0,
      message : null,
      data : parse(d)
    } );
  });
}
function deleteFile(viewId, callback){
  fs.unlink(pathLib.resolve(currentPath, basePath, "./json_" + viewId + ".json"),(e)=>{
    callback(stringify( e || {
      code : 0,
      message : null,
      data : null
    }))
  });
}
function addView(option, callback){
  let viewId = random(32);
  option.viewId = viewId;
  console.log("viewId", viewId);
  writeFile(viewId, stringify(option), (e)=>{
    callback(e);
  });
}
function updateView(viewId, option, callback){
  writeFile(viewId, stringify(option),(e)=>{
    callback(e);
  });
}
function getViewById(viewId, callback){
  readFile(viewId, (e)=>{
    callback(e);
  });
}
function getAllMyView(callback){
  let ins = filetree(pathLib.resolve(currentPath, basePath)),
    regex = /json_(\w+)\.json$/g,
    arr = [], match, viewId;
  ins.on("start",(d)=>{
    ultility.each(d.allChildren(), (n)=>{
      regex.lastIndex = 0;
      match = regex.exec(n.abspath);
      if(match){
        let promise = new Promise((res, rej) => {
          viewId = match[1];
          readFileData(viewId, (d) => {
            res(d);
          })
        })
        arr.push(promise);
      }
    })
    Promise.all(arr).then((d)=>{
      callback(stringify({
        code : 0,
        message : null,
        data : d.map((n)=>{
          return n.data;
        })
      }));
    });
  });
}
function getData(callback){
  let rs = "";
  this.on("data", (d)=>{
    rs += d;
  });
  this.on("end", (e)=>{
    console.log(rs);
    callback(JSON.parse(rs));
  });
}
function save2JSON(app, option){
  option = option || {};
  basePath = option.basePath || `./ps-core/json`;
  app.post("/api/node/smart/addView", (req, res) => {
    getData.call(req, (postData) => {
      addView(postData, (e)=>{
        res.write(e);
        res.end();
      })
    })
  });
  app.post("/api/node/smart/getAllMyView", (req, res) => {
    getAllMyView((d) => {
      res.write(d);
      res.end();
    })
  });
  app.post("/api/node/smart/updateView", (req, res) => {
    let viewId;
    getData.call(req, (postData) => {
      viewId = postData.viewId;
      updateView(viewId, postData, (e)=>{
        res.write(e);
        res.end();
      })
    })
  });
  app.post("/api/node/smart/deleteView/:viewId", (req, res) => {
    let viewId = req.params.viewId;
    deleteFile(viewId, (e)=>{
      res.write(e);
      res.end();
    })
  });
  app.post("/api/node/smart/getViewById/:viewId", (req, res) => {
    let viewId = req.params.viewId;
    getViewById(viewId, (e)=>{
      res.write(e);
      res.end();
    })
  });
}
module.exports = save2JSON;