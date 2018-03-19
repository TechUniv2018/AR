var HTML = require('html-parse-stringify');
var html='';
var fs = require('fs')
const shell = require('shelljs');

componentCount = {};
fileLineCounter = {};

function nthIndex(str, pat, n){
    var L= str.length, i= -1;
    while(n-- && i++<L){
        i= str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}


function walkTheDOM(node, func) {
    func(node);
    if(node.type==='text')
    {return;}
    node.children.forEach(element => {
        walkTheDOM(element, func);
    });
}

function makeComponent(node){
  console.log('making components');
    if(node.type==='tag'){
    if (node.attrs.class)
    {
        node.attrs.classBackup = node.attrs.class
        node.attrs.class = node.attrs.class.split(' ').join('').toUpperCase().replace(/-/g,'')
        if(!componentCount[node.attrs.class])
        {
            componentCount[node.attrs.class] = 1;
            fs.mkdirSync(`../${process.argv[2]}/src/Components/${node.attrs.class}`);
            fs.writeFileSync(`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`,"import React from 'react';\nimport './"+node.attrs.class+".css';\nexport default class "+node.attrs.class+" extends React.Component {\nrender() {\nreturn (\n);\n}}");
            fs.writeFileSync(`../${process.argv[2]}/src/Components/${node.attrs.class}/${node.attrs.class}.css`,'');
        }
        else{
          componentCount[node.attrs.class]++;
        }
    }
}
fs.writeFileSync(`../${process.argv[2]}/src/App.js`, `import React, { Component } from 'react';
import CONTAINER from './Components/CONTAINER';

class App extends Component {
  render() {
    return (
      <div className="App">
        <CONTAINER />
      </div>
    );
  }
}

export default App;`);
fs.writeFileSync(`../${process.argv[2]}/public/index.html`, `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
    <meta name="theme-color" content="#000000">
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json">
    <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css" integrity="sha384-BVYiiSIFeK1dGmJRAkycuHAHRg32OmUcww7on3RYdg4Va+PmSTsz/K68vbdEjh4u" crossorigin="anonymous">
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap-theme.min.css" integrity="sha384-rHyoN1iRsVXV4nD0JutlnGaslCJuC7uwjduW9SVrLvRYooPp2bWYgmgJQIXwl/Sp" crossorigin="anonymous">
    <title>React App</title>
  </head>
  <body>
    <noscript>
      You need to enable JavaScript to run this app.
    </noscript>
    <div id="root"></div>
  </body>
</html>
`);
}



function secondIteration(node, func, parentFile, searchString, currentFile) {

    let insert = func(node,currentFile, searchString, parentFile);
    // console.log('THE CURRENT FILE IS: ',currentFile);
    if(node.type==='text')
    {return;}
    let marker = 'return (';
    if(insert.type === 1)
    {
      marker = 'return (';
    }
    else {
      marker = insert.search;
    }
    marker2 = 'return (';
    node.children.forEach(element => {
        // console.log('the name is: ',element.name);
        // console.log('the children are: ',element);
        // console.log('the type is: ', insert.type);
        if(insert.type === 1)
        {
          // console.log(element.attrs.class);
          marker2 = secondIteration(element, func,currentFile, marker2, `../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`);
          // marker = insert.search;
        }
        else{
          // console.log('INSIDE ITERATION 4');
          marker = secondIteration(element, func,parentFile, marker, currentFile);
        }

    });
    if((insert.type === 2)||(insert.type === 3)){
      fileLineCounter[currentFile]+=1;
    }
    return insert.search;
}
let temp;
function insertCode(node,currentFile, searchString,parentFile) {
  console.log('THE current file is: ', currentFile);
  if(node.type==='tag'){
    if(node.attrs.class)
    {

      if(componentCount[node.attrs.class] === 1)
      {
        try{
          temp = fs.readFileSync(currentFile);
        }catch(e) {
          console.log('readfile error',e);
        }
        if(currentFile.includes('App.js'))
        {
          filePath = `./Components/${node.attrs.class}/`
        }
        else{
          filePath = `../${node.attrs.class}/`
        }
        temp = `import ${node.attrs.class} from "${filePath}"\n`+ temp;
        fileLineCounter[currentFile]+=1;
        pos = nthIndex(temp.toString(),'\n',fileLineCounter[currentFile]);
        pos=pos+1;
        temp = temp.toString().substr(0,pos)+`<${node.attrs.class}/>\n`+temp.toString().substr(pos);
        fileLineCounter[currentFile]+=1;
        try{
          fs.writeFileSync(currentFile, temp)
        }catch(e) {
          console.log('writefile error',e);
        }

        try{
          temp = fs.readFileSync(`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`);
        }catch(e) {
          console.log('readfile error',e);
        }
        pos = nthIndex(temp.toString(),'\n',fileLineCounter[`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`]);
        pos=pos+1;
        temp = temp.toString().substr(0,pos)+`<${node.name} className="${node.attrs.classBackup}">\n</${node.name}>\n`+temp.toString().substr(pos);
        fileLineCounter[`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`]+=1;
        try{
          fs.writeFileSync(`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`, temp)
        }catch(e) {
          console.log('writefile error',e);
        }
        // temp = temp.toString().replace(`${searchString}`,`${searchString}\n<${node.name} className="${node.attrs.class}"/>`)


        // console.log(temp.toString().replace(`${searchString}`,`<${node.name} className="${node.attrs.class}" />`));
        // console.log(`<${node.name} className="${node.attrs.class}"/>`);
        return {
          type: 1,
          search: `<${node.name} className="${node.attrs.classBackup}"/>`
        };
      }
      else{
        temp = fs.readFileSync(currentFile);

        if(currentFile.includes('App.js'))
        {
          filePath = `./Components/${node.attrs.class}/`
        }
        else{
          filePath = `../${node.attrs.class}/`
        }
        if(temp.indexOf(`import ${node.attrs.class} from "${filePath}"\n`)===-1)
        {
          temp = `import ${node.attrs.class} from "${filePath}"\n`+ temp;
          fileLineCounter[currentFile]+=1;
        }

        pos = nthIndex(temp,'\n',fileLineCounter[currentFile]);
        pos=pos+1;
        temp = temp.toString().substr(0,pos)+`<${node.attrs.class}>\n</${node.attrs.class}>\n`+temp.toString().substr(pos);

        // temp = temp.toString().replace(`${searchString}`,`${searchString}\n<${node.name} className="${node.attrs.class}"> </${node.name}>`)
        fs.writeFileSync(currentFile, temp)


        if(fileLineCounter[`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`] === 5)
        {
          temp = fs.readFileSync(`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`);
          pos = nthIndex(temp,'\n',fileLineCounter[`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`]);
          pos=pos+1;
          temp = temp.toString().substr(0,pos)+`<${node.name} className="${node.attrs.classBackup}">\n {this.props.children}\n</${node.name}>\n`+temp.toString().substr(pos);
          fs.writeFileSync(`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`, temp)
          fileLineCounter[`../${process.argv[2]}/src/Components/${node.attrs.class}/index.js`]+=1;
        }



        // console.log(temp.toString().replace(`${searchString}`,`<${node.name} className="${node.attrs.class}" />`));
        // console.log(`<${node.name} className="${node.attrs.class}"/>`);
        if(node.children.length === 0)
        {
          fileLineCounter[currentFile]+=2;
          return {
            type: 5,
            search: `</${node.name}">`
          };
        }
        fileLineCounter[currentFile]+=1;
        return {
          type: 2,
          search: `<${node.name} className="${node.attrs.classBackup}">`
        };
      }

    }
    else{
      temp = fs.readFileSync(currentFile);
      pos = nthIndex(temp,'\n',fileLineCounter[currentFile]);
      pos=pos+1;
      temp = temp.toString().substr(0,pos)+`<${node.name}>\n</${node.name}>\n`+temp.toString().substr(pos);

      // temp = temp.toString().replace(`${searchString}`,`${searchString}\n<${node.name}></${node.name}>`)
      fs.writeFileSync(currentFile, temp)
      // console.log(`<${node.name} />`);
      if(node.children.length === 0)
      {
        fileLineCounter[currentFile]+=2;
        return {
          type: 5,
          search: `</${node.name}>`
        };
      }
      fileLineCounter[currentFile]+=1;
      return {
        type: 3,
        search: `<${node.name}>`
      };
    }
  }
  else{
    temp = fs.readFileSync(currentFile);
    pos = nthIndex(temp,'\n',fileLineCounter[currentFile]);
    pos=pos+1;
    temp = temp.toString().substr(0,pos)+`${node.content}\n`+temp.toString().substr(pos);
    fileLineCounter[currentFile]+=1;
    // temp = temp.toString().replace(`${searchString}`,`${searchString}\n${node.content}`)
    fs.writeFileSync(currentFile, temp)
    // console.log(`<${node.name}/>`);
    // console.log(node.content);
    return {
      type: 4,
      search: `${node.content}`
    };
  }
}



function createReactApp (appName) {
  shell.cd('~/Documents/');
  // await shell.exec(`create-react-app ${appName}`);
  if (shell.exec(`create-react-app ${appName}`).code === 0) {
    shell.cd(`~/Documents/html2React`);
    fs.mkdirSync(`../${process.argv[2]}/src/Components`);
    fs.readFile('./index.html',(err,data)=>{
       console.log('wrewe');
       str  = data.toString()
       html=str.replace(/\n/g, "").replace(/[\t ]+\</g, "<").replace(/\>[\t ]+\</g, "><").replace(/\>[\t ]+$/g, ">");
       htmlCopy = html;
       let mainCropped = "<main" + html.split("<main")[1];
       html = mainCropped.split("</main>")[0]+"</main>";
       let styles = htmlCopy.split("<style>")[1];
       styles = styles.split("</style>")[0];
       // html = mainCropped2;
       var ast = HTML.parse(html);
       // console.log(ast)
       
       walkTheDOM(ast[0],makeComponent);
       fileLineCounter[`../${process.argv[2]}/App.js`] = 1;
       Object.keys(componentCount).forEach((key)=>{
         fileLineCounter[`../${process.argv[2]}/src/Components/${key}/index.js`] = 5;
       })
       // console.log('component counter is: ',Object.keys(componentCount));
       secondIteration(ast[0],insertCode,null,'return (','./App.js')
       // console.log(temp);
       Object.keys(componentCount).forEach((key)=>{
         let file = fs.readFileSync(`../${process.argv[2]}/src/Components/${key}/index.js`);
         str = file.toString();
         var regex = /className/gi, result, indices = [];
         while ( (result = regex.exec(str)) ) {
           indices.push(result.index);
         }
         // console.log(indices);
         indices.forEach((index)=>{
           str.slice(index+11).split("\"")[0].split(" ").forEach((className)=>{
             if(styles.split(className).length>1){
               console.log(`.${className}`+styles.split(className)[1].split('}')[0]+'}');
               cssData = fs.readFileSync(`../${process.argv[2]}/src/Components/${key}/${key}.css`);
               cssData = cssData.toString();
               cssData = styles.substr(styles.indexOf(className)-1,styles.substring(styles.indexOf(className)).indexOf('}')+2);
               //cssData = `.${className}`+styles.split(className)[1].split('}')[0]+'}\n'+cssData;
               fs.writeFileSync(`../${process.argv[2]}/src/Components/${key}/${key}.css`,cssData);
             }
             // console.log(className,styles.split(className).length,"\n\n\n");
           })
           // console.log(str.slice(index+11).split("\"")[0].split(" "));
         })

       })

       // console.log(componentCount)
    })
  }
  
};


createReactApp(process.argv[2]);
