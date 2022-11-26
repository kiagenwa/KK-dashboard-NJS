const express = require('express');
const Connection = require('tedious').Connection;
const Request = require('tedious').Request;
const path = require('path');

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
    database: process.env.MSSQL_DBNAME
  }
};

const connection = new Connection(sqlConfig);
connection.on('connect', function(err) {
  if (err) console.log(err);
  else console.log('Connected to JR_OMNI database.');
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

app.get('/', (_, res) => {
  executeStatement(qG.defectPareto(7, 3), (defectsPareto) => {
    // take out 10th+ pareto data
    if (defectsPareto.length > 11) defectsPareto.splice(10, defectsPareto.length - 11)
    executeStatement(qG.dailyRecord(7, 3), (dailyRecords) => {
      const weeklyFOR = {};
      const model_qty = {};
      dailyRecords.forEach(d => {
        if (weeklyFOR[d.weeknum] === undefined) weeklyFOR[d.weeknum] = [ d.defect_qty, d.PDinput];
        else {
          weeklyFOR[d.weeknum][0] += d.defect_qty;
          weeklyFOR[d.weeknum][1] += d.PDinput;
        }
        if (model_qty[d.model_name] === undefined) model_qty[d.model_name] = d.PDoutput;
        else model_qty[d.model_name] += d.PDoutput;
      });
      //res.json(model_qty);
      res.render('index', { 
        weeklyFOR: weeklyFOR,
        model_qty: model_qty,
        defects: defectsPareto,
        PDdata: dailyRecords });
      });
    });
});

app.listen(3000, () => {
  console.log('Listening on port 3000...');
})