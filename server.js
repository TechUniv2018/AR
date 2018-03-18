var HTML = require('html-parse-stringify')
var html='';
var fs = require('fs')

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

    if(node.type==='tag'){
    if (node.attrs.class)
    {
        node.attrs.classBackup = node.attrs.class
        node.attrs.class = node.attrs.class.split(' ').join('').toUpperCase().replace(/-/g,'')
        if(!componentCount[node.attrs.class])
        {
            componentCount[node.attrs.class] = 1;
            fs.mkdirSync(node.attrs.class);
            fs.writeFileSync(`${node.attrs.class}/index.js`,"import React from 'react';\nimport './"+node.attrs.class+".css';\nexport default class "+node.attrs.class+" extends React.Component {\nrender() {\nreturn (\n);\n}}");
            fs.writeFileSync(`${node.attrs.class}/${node.attrs.class}.css`,'');
        }
        else{
          componentCount[node.attrs.class]++;
        }
    }
}
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
          marker2 = secondIteration(element, func,currentFile, marker2, `./${node.attrs.class}/index.js`);
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
          temp = fs.readFileSync(`./${node.attrs.class}/index.js`);
        }catch(e) {
          console.log('readfile error',e);
        }
        pos = nthIndex(temp.toString(),'\n',fileLineCounter[`./${node.attrs.class}/index.js`]);
        pos=pos+1;
        temp = temp.toString().substr(0,pos)+`<${node.name} className="${node.attrs.classBackup}">\n</${node.name}>\n`+temp.toString().substr(pos);
        fileLineCounter[`./${node.attrs.class}/index.js`]+=1;
        try{
          fs.writeFileSync(`./${node.attrs.class}/index.js`, temp)
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


        if(fileLineCounter[`./${node.attrs.class}/index.js`] === 5)
        {
          temp = fs.readFileSync(`./${node.attrs.class}/index.js`);
          pos = nthIndex(temp,'\n',fileLineCounter[`./${node.attrs.class}/index.js`]);
          pos=pos+1;
          temp = temp.toString().substr(0,pos)+`<${node.name} className="${node.attrs.classBackup}">\n {this.props.children}\n</${node.name}>\n`+temp.toString().substr(pos);
          fs.writeFileSync(`./${node.attrs.class}/index.js`, temp)
          fileLineCounter[`./${node.attrs.class}/index.js`]+=1;
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





 fs.readFile('./index.html',(err,data)=>{
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
    walkTheDOM(ast[0],makeComponent)
    fileLineCounter['./App.js'] = 1;
    Object.keys(componentCount).forEach((key)=>{
      fileLineCounter[`./${key}/index.js`] = 5;
    })
    // console.log('component counter is: ',Object.keys(componentCount));
    secondIteration(ast[0],insertCode,null,'return (','./App.js')
    // console.log(temp);
    Object.keys(componentCount).forEach((key)=>{
      let file = fs.readFileSync(`./${key}/index.js`);
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
            cssData = fs.readFileSync(`./${key}/${key}.css`);
            cssData = cssData.toString();
            cssData = `.${className}`+styles.split(className)[1].split('}')[0]+'}\n'+cssData;
            fs.writeFileSync(`./${key}/${key}.css`,cssData);
          }
          // console.log(className,styles.split(className).length,"\n\n\n");
        })
        // console.log(str.slice(index+11).split("\"")[0].split(" "));
      })

    })

    // console.log(componentCount)
 })
