**insoplus**

A node js module for for add on functions on top of inso

Install
Save this localally and either add this in the path or call using the full path.
Before first use, need to call npm install that will install the libraries/node modules.

N.B. InsoPlus will only work if there's one service on the kong.yaml.
**Usage**

Step 1: Run inso generate config. This will generate the output file, normally named as kong.yaml.

Step 2:Now run insoplus for additional configuration. This will generate a new yaml named insoplus_kong.yaml
**Examples**

node insoplus.js kong.yaml remove-upstream ( this will remove upstream object and replace service.host with the first target found in upstream)   
node insoplus.js kong.yaml add-route-header ( this will add a route header for all routes found in service)   
node insoplus.js kong.yaml add-route-header route-name ( this will add a route header for the route named route-name)  
node insoplus.js kong.yaml add-route-host ( this will add a route host for all routes found in service)   
node insoplus.js kong.yaml add-route-host route-name ( this will add a route host for the route named route-name)  
**Examples**
Step 3: Run Deck Sync to upload the new config insoplus_kong.yaml to Kong Manager.



