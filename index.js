const express = require('express');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const path = require('path');
const bodyParser = require('body-parser');

const qG = require('./original/queryGen.js');

require('dotenv').config();

const app = express();
app.use(express.static('public'));
app.use('/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')));
app.use('/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')));
app.use('/d3', express.static(path.join(__dirname, 'node_modules/d3')));

app.set('view engine', 'pug');


const sqlConfig = {
  server: process.env.MSSQL_SERVER,
  authentication: {
    type: 'default',
    options: {
      userName: process.env.MSSQL_USERNAME,
      password: process.env.MSSQL_PASSWORD
    }
  },
  options: {
    instanceName: process.env.MSSQL_INSTANCE,
    trustServerCertificate: true, 
    database: process.env.MSSQL_DBNAME,
    //requestTimeout: 0   // for debug when query slow
  }
};

const connection = new Connection(sqlConfig);
connection.on('connect', function(err) {
  if (err) console.log(err);
  else console.log('Connected to JR_OMNI database.');
  // as this app mainly uses data from the DB, let's connect it first.
  executeStatement(qG.getLatestWeek(), weeks => {
    app.get('/', (_, res) => {
      //res.json(weeks);
      mainDashboard(weeks[1].weeknum, weeks[0].weeknum, res, 1);
    });

    app.post("/select", bodyParser.urlencoded({extended: false}), (req, res) => {
      //res.json(req.body);   // startWeek and endWeek
      mainDashboard(req.body.startWeek, req.body.endWeek, res, 0);
    });
    
    app.listen(3000, () => {
      console.log('Listening on port 3000...');
    });
  });
});
connection.connect();

function executeStatement(sqlQuery, callback) {
  let request = new Request(sqlQuery, (e) => {
    if (e) console.log(e);
  });
  let rowNumber = 0;
  const queryOutput = [];
  request.on('row', (columns) => {
    queryOutput.push({});
    columns.forEach((column) => {
      queryOutput[rowNumber][column.metadata.colName] = (column.value === null ? 'NULL':column.value);
    });
    rowNumber++;
  });
  request.on('requestCompleted', () => {
    callback(queryOutput);
  });
  connection.execSql(request);
}

// main data process, type = 0 is FA
function mainDashboard(startWeek, endWeek, res, type) {
  executeStatement(qG.defectParetoWeeks(startWeek, endWeek), (defectsPareto) => {
    executeStatement(qG.dailyRecordWeeks(startWeek, endWeek), (dailyRecords) => {
      const data = digestData(type, {
        defectsPareto: defectsPareto,
        dailyRecords: dailyRecords
      });
      res.render('index', { 
        weeklyFOR: data.weeklyFOR,
        model_qty: data.model_qty,
        defects: data.defectsPareto,
        totalDefects: data.totalDefects,
        PDdata: data.dailyRecords,
        startWeek: startWeek,
        endWeek: endWeek });
      });
    });
}

function digestData (type, data) {
  // adjust data filtering on type parameter
  let dataFilter;
  if (type == 0) dataFilter = (d) => d.pdtypeID == 3;
  else dataFilter = (d) => d.pdtypeID != 3;

  const defects = data.defectsPareto.filter(dataFilter);
  const dailyPD = data.dailyRecords.filter(dataFilter);
  const totalInput = dailyPD.reduce((ttl, d) => ttl + d.PDinput, 0);
  const totalDefects = defects.reduce((ttl, d) => ttl + d.quantity, 0);
  const weeklyFOR = {};
  const model_qty = {};

  // take out 10th+ pareto data
  if (defects.length > 10) defects.splice(9, defects.length - 10)
  defects.push({
    criteria: 'TOTAL',
    quantity: totalDefects
  });
  // calculate dppm
  // what if there's no defects? to add a condition later.
  defects.forEach(d => {
    d.dppm = Math.round(d.quantity * 1000000 / totalInput);
  });
  dailyPD.forEach(d => {
    if (weeklyFOR[d.weeknum] === undefined) weeklyFOR[d.weeknum] = [ d.defect_qty == 'NULL' ? 0:d.defect_qty, d.PDinput];
    else {
      weeklyFOR[d.weeknum][0] += d.defect_qty == 'NULL' ? 0:d.defect_qty;
      weeklyFOR[d.weeknum][1] += d.PDinput;
    }
    if (model_qty[d.model_name] === undefined) model_qty[d.model_name] = d.PDoutput;
    else model_qty[d.model_name] += d.PDoutput;
  });

  return {
    weeklyFOR: weeklyFOR,
    model_qty: model_qty,
    defectsPareto: defects,
    dailyRecords: dailyPD,
    totalDefects: totalDefects
  };
}