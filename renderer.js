// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

const d3 = require('d3');
const $ = require('jquery');
require('./plugin/d3-transform');
require('./plugin/d3-adjacency-matrix-layout');
require('./plugin/dat.gui.min.js');

const log = require('electron-log');

var headerData, fData;

//load data
d3.text('./data/noheader.csv', function(matrix_text) {
    fData = d3.csvParseRows(matrix_text);
    
    d3.text('./data/header.csv', function (header_text) {
        headerData = d3.csvParseRows(header_text);

        console.log(headerData, fData)
    })
})