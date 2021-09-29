const yaml = require('js-yaml');
const fs = require('fs');
// require('dotenv').config();
const path= require('path');
const { Console } = require('console');



let command = process.argv[3]?process.argv[3]:'';
let spec = process.argv[2]?process.argv[2]:'';

if(spec==''){
    console.log('Must pass the Kong config as first argument');
    process.exit(1);
}

if(command==''){
    console.log('Must pass the command as second argument');
    process.exit(1);
}

var specPath = path.resolve("./",spec); 
console.log('Kong conf yaml path ' + specPath);

try
{
    var conf = yaml.load(fs.readFileSync(specPath, "utf8"));

    switch(command)
    {
        case 'remove-upstream':
            removeUpstream(conf);
            break;
        case 'add-route-header':
            addRouteHeader(conf);
            break;
        case 'add-route-host':
                addRouteHost(conf);
                break;
        case 'check-route':
                checkRouteConflict(conf);
                break;
        default:
            console.log("No valid option is selected. Valid options are one of '\n' remove-upstream '\n' add-route-header '\n' add-route-host '\n' check-route-conflict");
            process.exit(1);
    } 
}catch(e)
{
    console.error(e);
    process.exit(1);
}

 

//console.log(yaml.dump(conf));
fs.writeFileSync(path.resolve("./", 'insoplus_' +spec), yaml.dump(conf));
console.log("new config file is written in insoplus_" + spec );


function removeUpstream(conf)
 {
    
    console.log( "this will remove all upstream and associated targets and replace service.host with the first target. Only use this if you have a load balancer pointing to the target");
    if(!conf.upstreams){
        console.log( "No upstreams present");
        process.exit(1);

    } 
    if(conf.upstreams.length==0){
        console.log( "No upstreams present")
        process.exit(1);
    }

    if(conf.upstreams[0].targets.length==0){
        console.log( "No target present in top upstream")
        process.exit(1);
    }

    var firstTarget = conf.upstreams[0].targets[0].target;
    console.log("first target " + firstTarget);
    //take out port if any
    conf.services[0].host = firstTarget.split(":")[0];
    delete conf.upstreams;


 
}

function addRouteHeader(conf){

    var header = process.argv[4]?process.argv[4]:'';

    if(header==''){
    console.log("expecting header name and value as 3rd argument, separated by colon");
    process.exit(1);
    }
    var headerValues = header.split(":");
    if(headerValues.length!=2){
    console.log("expecting header name and value as 3rd argument, separated by colon. For example x-service-name:myservice");
    process.exit(1);
    }

    var routeName = process.argv[5]?process.argv[5]:'';
    if(routeName!=''){
    console.log("Route Name supplied. New header " + header + " will only be added for route " + routeName);
    
    }else{
    console.log("No route Name supplied. New header " + header + " will be added for all routes for first service");
    }




    conf.services[0].routes.map(x=>addHeaders(x, headerValues[0], headerValues[1], routeName));

    function addHeaders(route, headerName, headerValue, routeName) {
        if(routeName ==  '' || routeName == route.name){
            route.headers = { [headerName]: [headerValue]} ;
        }
        return route;
    }
}

function addRouteHost(conf){
    var route_host = process.argv[4]?process.argv[4]:'';
 
    if(route_host==''){
     console.log("expecting route host name as 3rd argument");
     process.exit(1);
    }

 
    var routeName = process.argv[5]?process.argv[5]:'';
    if(routeName!=''){
     console.log("Route Name supplied. New host " + route_host + " will only be added for route " + routeName);
     
    }else{
     console.log("No route Name supplied. New host " + route_host + " will be added for all routes for first service");
    }
 
     conf.services[0].routes.map(x=>addHost(x, route_host, routeName));
 
     function addHost(route, route_host, routeName) {
         if(routeName == '' || routeName == route.name){
             route.host = route_host ;
         }
         return route;
   }
}


function checkRouteConflict(conf)
 {
    
    console.log( "this will check all existing routes and compare them with inso config to ensure that will not be any conflicting route.");
    console.warn( "Ensure that supplied dump file is for the whole workspace.");
    var dumpFile = process.argv[4]?process.argv[4]:'';
    if(dumpFile==''){
        console.log("expecting Kong dump file name as 3rd argument");
        process.exit(1);
       }

    var dumpPath = path.resolve("./",dumpFile); 
    console.log(" deck dump file :" + dumpPath);
    var dump = yaml.load(fs.readFileSync(dumpPath, "utf8"));
    
    // looping through dump file to get all routes in an array.
    var dumpRoutes = [];
    // compares only the first set of route attributes. Using Inso generate config there is limited option to declare more.
    dump.services.forEach(s=> {
        s.routes.forEach(r=>{
         var path = r.paths?r.paths[0]:'';
         var host = r.hosts?r.hosts[0]:'';
         var method = r.methods?r.methods[0]:'';
         var header = r.headers?r.headers[0]:'';

         dumpRoutes.push({path:path,host:host, method:method, header: header});

        })
    });
    // now looping through spec routes to see if there is any conflict.
    conf.services[0].routes.forEach( cr => {
        var specpath = cr.paths?cr.paths[0]:'';
        var spechost = cr.hosts?cr.hosts[0]:'';
        var specmethod = cr.methods?cr.methods[0]:'';
        var specheader = cr.headers?cr.headers[0]:'';

        var conflict = dumpRoutes.filter( d=> (d.path == specpath && d.host == spechost && d.method == specmethod && d.header == specheader ));
        if (conflict.length>0) {
            console.warn("Following routes already exists in your workspace. Please fix them before you run deck sync")
            conflict.forEach( con =>{
                console.warn( "Route detail: " + JSON.stringify(con));
            })
            console.warn( conflict);
        }
    
    })

    console.log("program exiting now."); process.exit(1);

    


 
}
