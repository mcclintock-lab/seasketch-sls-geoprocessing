require('dotenv').config()
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var wrap = require('async-middleware').wrap
const fs = require('fs');
const cors = require('cors')
const { fetchCacheOrGeometry } = require('./lib/cache');
const knex = require('./lib/knex');
const invoke = require('./lib/invoke');
const SSEventEmitter = require('./lib/sse');
const getStatus = require('./lib/getStatus');
const asInvocation = require('./lib/asInvocation');
const { initPriceMonitor } = require("./lib/ec2Pricing");

const { URL } = require('url');
const HOST = process.env.HOST || "http://localhost:3001";
const COST_PER_GB_SECOND = 0.00001667;
const APPROX_SQS_COST = 0.00000040 * (// per message
                        1 + // results message
                        3 // log messages
);

const COST_PER_REQUEST = 0.0000002;
require('./lib/sqsListeners').init((err) => {
  console.error(err);
  process.exit();
});
require('./lib/ec2InstanceMonitor').init((err) => {
  console.error(err);
  process.exit();
});

setInterval(require('./lib/timeoutMonitor'), 10000);

initPriceMonitor();

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors())

var router = express.Router();

router.get('/healthcheck', function(req, res, next) {
  res.send("OK");
});

router.get('/api', function(req, res, next) {
  res.json({ title: 'Express' });
});

router.get('/api/:project/functions/:func', wrap( async (req, res) => {
  const {project, func} = req.params;
  if (req.query && req.query.id) {
    const sketchId = req.query.id;
    const {cache, geometry} = await fetchCacheOrGeometry(project, func, sketchId);
    if (cache) {
      res.redirect(`/api/${project}/functions/${func}/status/${cache.uuid}`);
    } else {
      if (!geometry) {
        throw createError(404, "Could not find sketch with ID = " + sketchId);
      } else {
        const invocationId = await invoke(project, func, geometry, sketchId);
        res.redirect(`/api/${project}/functions/${func}/status/${invocationId}`);
      }
    }
  } else {
    // TODO: Replace with demo page
    throw createError(400, "Must provide a sketch id");
  }
}));

router.post('/api/:project/functions/:func', wrap( async (req, res) => {
  const {project, func} = req.params;
  const geojson = req.body;
  const invocationId = await invoke(project, func, geojson);
  res.redirect(`/api/${project}/functions/${func}/status/${invocationId}`);
}));

router.get('/api/:project/functions/:func/status/:invocationId', wrap( async (req, res) => {
  const {project, func, invocationId} = req.params;
  const data = await getStatus(invocationId);
  res.json(data);
}));

router.get('/api/invocations/:invocationId', wrap( async (req, res) => {
  const {project, func, invocationId} = req.params;
  const data = await getStatus(invocationId);
  res.json(data);
}));

router.get('/api/:project/functions/:func/events/:invocationId', (req, res) => {
  const {project, func, invocationId} = req.params;
  new SSEventEmitter(project, func, invocationId, req, res);
});

router.get('/api/projects', wrap( async (req, res) => {
  const projects = await knex('projects').select()
  const functions = await knex('functions').select();
  const stats = await knex('invocations')
    .select(knex.raw(`count(function) as invocations, project || '-geoprocessing-' || function as function_name, avg(max_memory_used_mb) as average_memory_use, percentile_cont(0.5) within group (order by billed_duration_ms) as billed_duration_50_percentile, percentile_cont(0.5) within group (order by duration) as duration_50_percentile`))
    .groupBy('project', 'function')
  for (var p of projects) {
    p.functions = functions.filter((f) => f.projectName === p.name)
    for (var f of p.functions) {
      const s = stats.find((s) => s.functionName === f.functionName);
      if (s) {
        f.invocations = s.invocations;
        f.averageMemoryUse = Math.round(s.averageMemoryUse);
        f.billedDuration50thPercentile = s.billedDuration_50Percentile;
        f.duration50thPercentile = s.duration_50Percentile;
      }
    }
  }
  res.json(projects);
}));

router.get('/api/recent-invocations', wrap( async (req, res) => {
  const invocations = await knex('invocations').select().whereNotIn('status', ['running','worker-booting', 'worker-running']).limit(10).orderBy('requested_at', 'desc');
  const outstanding = await knex('invocations').select().whereIn('status', ['running', 'worker-booting', 'worker-running']);
  res.json([...outstanding, ...invocations].map(asInvocation));
}));

router.get('/api/:project/functions/:func/metadata', wrap( async (req, res) => {
  const {project, func} = req.params;
  const functions = await knex('functions').where('project_name', project).where('name', func).select();
  if (functions.length === 0) {
    createError(404);
  } else {
    const f = functions[0];
    const stats = await knex('invocations')
      .select(knex.raw(`count(function) as invocations, project || '-geoprocessing-' || function as function_name, avg(max_memory_used_mb) as average_memory_use, percentile_cont(0.5) within group (order by billed_duration_ms) as billed_duration_50_percentile, percentile_cont(0.5) within group (order by duration) as duration_50_percentile`))
      .where('project', project)
      .where('function', func)
      .groupBy('project', 'function');
    const projectInfo = await knex('projects').select().where('name', project);
    // get cost info
    // get error counts and times
    res.json({
      ...projectInfo[0],
      name: f.name,
      projectName: f.projectName,
      functionName: f.functionName,
      description: f.description,
      timeout: f.timeout,
      memorySize: f.memorySize,
      outputs: f.outputs,
      launchTemplate: f.launchTemplate,
      instanceType: f.instanceType,
      workerTimeout: f.workerTimeout,
      stats: {
        invocations: stats[0] ? stats[0].invocations : 0,
        averageMemoryUse: stats[0] ? Math.round(stats[0].averageMemoryUse) : null,
        billedDuration50thPercentile: stats[0] ? stats[0].billedDuration_50Percentile : null,
        duration50thPercentile: stats[0] ? stats[0].duration_50Percentile : null
      }
    });
  }
}));

router.get('/api/:project/functions/:func/payload/:invocationId', wrap( async (req, res) => {
  const records = await knex('payloads').where('invocationUuid', req.params.invocationId);
  if (records.length > 0) {
    res.set("Content-Disposition", `attachment; filename=${req.params.invocationId}.json`)
    res.json(records[0].payload);  
  } else {
    createError(404);
  }
}));

app.use(router);

router.get('/favicon.ico', (req, res, next) => {
  res.sendFile(`${__dirname}/favicon.ico`, {maxAge: 31536000});
});

if (process.env.NODE_ENV === 'production') {
  app.use(require('./lib/indexHtmlFromS3'));
} else {
  // catch 404 and forward to error handler
  app.use(function(req, res, next) {
    next(createError(404));
  });
}

// error handler
app.use(function(err, req, res, next) {
  // render the error page
  res.status(err.status || 500);
  res.json({
    message: err.message,
    error: req.app.get('env') === 'development' ? err : null
  });
});

module.exports = app;
