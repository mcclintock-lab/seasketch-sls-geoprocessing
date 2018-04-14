# seasketch-sls-geoprocessing
Serverless geoprocessing platform for SeaSketch

# Usage

```
sls create --name MyReports --template-url https://github.com/mcclintock-lab/seasketch-sls-geoprocessing/tree/master/template
cd MyReports
npm install
sls add_function -n area
# modify functions/area/index.js as needed to implement the geoprocessing function
sls invoke local -f area -p functions/area/examples/sketch.json
```

# Developing New Services

When creating a new function using `sls add_function`, some scaffolding will be generated that enables the new function and encourages best practices. The geoprocessing function itself can be found in `functions/${name}/index.js`, tests should be put into `index.test.js`, and an area to store source and distributed data is created. Much of this is a work in progress.

## geoprocessing functions

Geoprocessing functions can either return a result directly (sync) or return a Promise (async protocol). Functions using the sync protocol should always return within a second. Any reports writing to s3 or performing asynchorous work must return a Promise. The `handler` method handles most of the plumbing to fulfill the seasketch-next [report request protocol](https://github.com/mcclintock-lab/seasketch-next/wiki/Report-Request-Protocol), so it's only necessary for the developer to concern themselves with the analysis itself.

## managing data

A `data/` folder is created by the function generator and contains a `data/src` folder for raw data like shapefiles. Ideally, source data is included in the repo along with a script to generate files like geojson or spatial indexes that are ready to use and stored in `data/dist`. Source files will be committed to the repo using LFS and will not be distributed to lambda [todo], so there's no need to worry about file size in `data/src`.

## running the functions

For now, `sls invoke local -f area -p functions/area/examples/sketch.json` will have to be used until *studio* is available. `data/examples` should be used to store geojson representations of test sketches. 

## tests

`npm test` will run [jest](https://facebook.github.io/jest/) but currently no affordances are made for bootstrapping the environment that the handler needs [todo].

# Developing Report Visualizations

Much like in the original [seasketch-reporting-api](https://github.com/mcclintock-lab/seasketch-reporting-api) the author of a report will need to create client code that visualizes outputs. Eventually a couple packages will be available to facilitate this work.

`@seasketch-sls-geoprocessing/client` will contain a set of React components that form a core UI library to speed the development of new reports.

`@seasketch-sls-geoprocessing/studio` will be a development server that hosts a UI for running geoprocessing functions and visualizing these reports. The goal will be to create a tight code->eval->visualize loop that will be more efficient than using the production seasketch app.



