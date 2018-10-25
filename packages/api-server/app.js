require('dotenv').config()
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const wrap = require('async-middleware').wrap
const cors = require('cors')
const { fetchCacheOrGeometry } = require('./lib/cache');
const knex = require('./lib/knex');
const invoke = require('./lib/invoke');
const SSEventEmitter = require('./lib/sse');
const getStatus = require('./lib/getStatus');
const asInvocation = require('./lib/asInvocation');
const { initPriceMonitor } = require("./lib/ec2Pricing");
const passport = require('passport');
const BearerStrategy = require('passport-http-bearer').Strategy;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const mongoose = require('./lib/mongoose');
const rateLimit = require("express-rate-limit");
const debug = require('./lib/debug')
const ms = require('ms');

const jwksClient = require('jwks-rsa')({
  cache: true,
  jwksUri: 'https://www.seasketch.org/.well-known/jwks.json'
});

if (!process.env.SECRET_KEY) {
  throw new Error(`SECRET_KEY environment variable not set`);
}

passport.use('token', new BearerStrategy(
  function(token, done) {
    if (token) {
      const data = jwt.decode(token, {complete: true});
      if (data && data.header && data.payload) {
        const contents = data.payload;
        const header = data.header;
        if (contents && contents.iss === 'https://analysis.seasketch.org') {
          jwt.verify(token, process.env.SECRET_KEY, function(err, decoded) {
            if (err) {
              done(null, false);
            } else {
              if (decoded.superuser) {
                decoded.token = token;
                done(null, decoded);
              } else {
                done(null, false);
              }
            }
          });
        } else if (contents && contents.iss === 'https://www.seasketch.org') {
          jwksClient.getSigningKey(header.kid, (err, key) => {
            const signingKey = key.publicKey || key.rsaPublicKey;
            jwt.verify(token, signingKey, function(err, decoded) {
              if (err) {
                done(null, false);
              } else {
                done(null, decoded);
              }
            });
            // Now I can use this to configure my Express or Hapi middleware
          });      
        } else {
          done(null, false);
        }
      } else {
        done(null, false);
      }  
    } else {
      done(null, false)
    }
  }
));

const optionalAuthMiddleware = function(req, res, next) {
  passport.authenticate('token', {session: false}, function(err, user, info) {
    req.authenticated = !! user;
    req.user = user;
    req.info = info;
    next();
  })(req, res, next);
};

const requireSuperuserMiddleware = (req, res, next) => {
  optionalAuthMiddleware(req, res, async () => {
    if (req.user && req.user.superuser) {
      next(null);
    } else {
      next(createError(403, `Unauthorized`));
    }
  })
}

const requireProjectPermission = (req, res, next) => {
  optionalAuthMiddleware(req, res, async () => {
    if (req.user && req.user.superuser) {
      next(null);
    } else {
      if (!req.params.project) {
        next(createError(400, "No project specified"))
      } else {
        const project = await knex('projects').where({name: req.params.project}).first();
        if (!project) {
          next(createError(404, `No project named ${req.params.project}`));
        } else {
          if (!project.requireAuth) {
            next(null);
          } else if (req.user && req.user.project && project.authorizedClients.indexOf(req.user.project) !== -1) {
            next(null);
          } else {
            next(createError(403, `Unauthorized`));
          }
        }
      }  
    }
  })
}


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
app.use(cors({credentials: true, origin: [
  "http://localhost:3000", 
  "https://localhost:3001",
  "https://www.seasketch.org", 
  "https://seasketch.org"
]}));

app.enable("trust proxy");

const apiLimiter = rateLimit({
  windowMs: ms('1m'),
  max: 100
});

const invocationLimiter = rateLimit({
  windowMs: ms('10m'),
  max: 100,
  message: "You may only request 100 reports every 10 minutes."
});

const resetCostMetadata = async () => knex.raw("select reset_function_cost_metadata()")


resetCostMetadata();
setInterval(resetCostMetadata, ms('5m'));

const invocationCostLimiter = async (req, res, next) => {
  if (!req.params.project || !req.params.func) {
    next(createError(400, 'No project or function specified'));
  } else {
    const func = await knex('functions').select('costPerInvocation', 'invocationsThisMonth', 'costLimitUsd').where('functionName', [req.params.project, 'geoprocessing', req.params.func].join('-')).first();
    const invocations = func.invocationsThisMonth + 1;
    if (parseFloat(func.costPerInvocation) * invocations > func.costLimitUsd) {
      const invocationLimit = Math.round(func.costLimitUsd / func.costPerInvocation);
      res.set('x-ratelimit-limit', invocationLimit);
      res.set('x-ratelimit-remaining', invocationLimit - func.invocationsThisMonth);
      res.set('x-ratelimit-reset', Math.round(new Date(new Date().getUTCFullYear(), (new Date().getMonth()+1)%12, 1).getTime()/ 1000));
      next(createError(429, `Cost limit of $${func.costLimitUsd}.00 exceeded for this month`));
    } else {
      next();
    }
  }
}

app.use("/api", apiLimiter);

var router = express.Router();

router.get('/healthcheck', function(req, res, next) {
  res.send("OK");
});

router.get('/api', function(req, res, next) {
  res.json({ title: 'Express' });
});

// # Invoke function

router.get('/api/:project/functions/:func', invocationLimiter, invocationCostLimiter, requireProjectPermission, wrap( async (req, res) => {
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

router.post('/api/:project/functions/:func', invocationLimiter, invocationCostLimiter, requireProjectPermission, wrap( async (req, res) => {
  const {project, func} = req.params;
  const geojson = req.body;
  const invocationId = await invoke(project, func, geojson);
  res.redirect(`/api/${project}/functions/${func}/status/${invocationId}`);
}));

// Get invocation progress

router.get('/api/:project/functions/:func/status/:invocationId', wrap( async (req, res) => {
  const {project, func, invocationId} = req.params;
  const data = await getStatus(invocationId);
  res.json(data);
}));

router.get('/api/invocations/:invocationId', wrap( async (req, res) => {
  const {invocationId} = req.params;
  const data = await getStatus(invocationId);
  res.json(data);
}));

router.get('/api/:project/functions/:func/events/:invocationId', (req, res) => {
  const {project, func, invocationId} = req.params;
  new SSEventEmitter(project, func, invocationId, req, res);
});

// Project list

router.get('/api/projects', optionalAuthMiddleware, wrap( async (req, res) => {
  let projects = await knex('projects').select()
  const functions = await knex('functions').select();
  if (req.user && req.user.superuser) {
    // gets access to everything
  } else if (req.user && req.user.admin) {
    // gets access to protected project reports
    projects = projects.filter((p) => !p.requireAuth || p.authorizedClients.indexOf(req.user.admin) !== -1)
  } else {
    // no access to any acl projects
    // filter all requireAuth
    projects = projects.filter((p) => !p.requireAuth)
  }
  functions.forEach((f) => f.costPerInvocation = parseFloat(f.costPerInvocation))
  for (var p of projects) {
    p.functions = functions.filter((f) => f.projectName === p.name)
  }
  res.json(projects);
}));

// Invocations list (admins only)

router.get('/api/recent-invocations', requireSuperuserMiddleware, wrap( async (req, res) => {
  const invocations = await knex('invocations').select().whereNotIn('status', ['running','worker-booting', 'worker-running']).limit(10).orderBy('requested_at', 'desc');
  const outstanding = await knex('invocations').select().whereIn('status', ['running', 'worker-booting', 'worker-running']);
  res.json([...outstanding, ...invocations].map(asInvocation));
}));

// Get payload of an invocation

router.get('/api/:project/functions/:func/payload/:invocationId', wrap( async (req, res) => {
  const records = await knex('payloads').where('invocationUuid', req.params.invocationId);
  if (records.length > 0) {
    res.set("Content-Disposition", `attachment; filename=${req.params.invocationId}.json`)
    res.json(records[0].payload);  
  } else {
    throw createError(404);
  }
}));

const User = mongoose.model("User", {
  email: {type: String, unique: true},
  hash: String,
  salt: String,
  likeABoss: Boolean
});

router.post('/api/getToken', wrap( async (req, res) => {
  const {email, password} = req.body;
  if (email && password && email.length && password.length) {
    const user = await User.findOne({email});
    if (!user || !user.likeABoss) {
      throw createError(401);
    } else {
      const authenticated = await bcrypt.compare(password, user.hash);
      if (authenticated) {
        const token = {
          iss: "https://analysis.seasketch.org",
          sub: user.email,
          superuser: user.likeABoss
        }
        res.send(jwt.sign(token, process.env.SECRET_KEY));
      } else {
        throw createError(401);
      }
    }
  } else {
    throw createError(401);
  }
}));

router.post('/api/project', requireSuperuserMiddleware, wrap( async (req, res) => {
  const {requireAuth, authorizedClients, name, costLimitUsd} = req.body;
  await knex('projects').update({requireAuth, authorizedClients, costLimitUsd}).where({name})
  res.send('ok');
}));

router.post('/api/costLimit', requireSuperuserMiddleware, wrap ( async (req, res) => {
  const {costLimitUsd, functionName} = req.body;
  await knex('functions').update({costLimitUsd}).where({functionName});
  res.send('ok');
}));

const SeaSketchProject = mongoose.model("Project", {
  name: String
});

router.get('/api/seasketch_projects', wrap( async (req, res) => {
  const projects = await SeaSketchProject.find({}, {name: true});
  res.json(projects);
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
