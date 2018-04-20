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

## saving outputs

The handler that wraps each geoprocessing function will take care of saving outputs to s3 and ensuring cached results are served up. For additional outputs such as map data you will be able to import `putS3` from the framework [todo]. Data will be saved to a publicly accessible but unlisted bucket, and the url will be returned so it can be included in the results.

## managing data

A `data/` folder is created by the function generator and contains a `data/src` folder for raw data like shapefiles. Ideally, source data is included in the repo along with a script to generate files like geojson or spatial indexes that are ready to use and stored in `data/dist`. Source files will be committed to the repo using LFS and will not be distributed to lambda [todo], so there's no need to worry about file size in `data/src`.

A lot of the work in developing geoprocessing functions will be in figuring out the best way to represent data. Raw data in geojson format may be used by *turf.js* but in many cases some preprocessing will need to be done to add the data to something like [rbush](https://github.com/mourner/rbush).

## running the functions

For now, `sls invoke local -f area -p functions/area/examples/sketch.json` will have to be used until *studio* is available. `data/examples` should be used to store geojson representations of test sketches. 

## tests

`npm test` will run [jest](https://facebook.github.io/jest/) but currently no affordances are made for bootstrapping the environment that the handler needs [todo].

# Developing Report Visualizations

Much like in the original [seasketch-reporting-api](https://github.com/mcclintock-lab/seasketch-reporting-api) the author of a report will need to create client code that visualizes outputs. Eventually a couple packages will be available to facilitate this work.

`@seasketch-sls-geoprocessing/client` will contain a set of React components that form a core UI library to speed the development of new reports.

`@seasketch-sls-geoprocessing/studio` will be a development server that hosts a UI for running geoprocessing functions and visualizing these reports. The goal will be to create a tight code->eval->visualize loop that will be more efficient than using the production seasketch app.

## Deploying client-side reports

There are actually a lot of reports that this may be appropriate for. We'll need a special webpack target to enable this.


# Under the hood

`seasketch-sls-geoprocessing` contains a serverless template and a plugin. The template just has the basics of a module and a package.json that includes the necessary dependencies, including itself as a plugin. The plugin enables the `add_function` serverless command which adds some directory scaffolding + entries into serverless.yml. The "magic" is kept to a minimum. It's just serverless configuration in the end so there's a lot of flexibility. Dependencies like `@seasketch-sls-geoprocessing/client` and `@seasketch-sls-geoprocessing/studio` will be kept seperate so they don't have to be deployed to lambda unnecessarily. Eventually as we develop analytical tools that may be reusable they should be added to indivual packages under the `@seasketch-sls-geoprocessing` organization.
