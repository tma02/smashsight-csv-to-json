const fs = require('fs');
const csvParse = require('csv-parse');
const cli = require('commander');

cli
  .action(function (inputDir, outputDir) {
    fs.readFile(inputDir, (err, data) => {
      if (err)
        throw err;
      parseToArray(data.toString('utf8'), (meta, frames) => {
        let json = {
          meta: csvArrayToJson(meta),
          frames: csvArrayToJson(frames),
        };
        console.log(`Parsed with meta: ${JSON.stringify(json.meta, null, 2)}`);
        fs.writeFile(outputDir, JSON.stringify(json, null, 2), 'utf8', (err) => {
          if (err)
            throw err;
        });
      });
    });
  })
;

cli.parse(process.argv);

function parseToArray(csvString, callback) {
  const rawCsvRecords = csvString.split('\n');
  const rawMetaRecords = rawCsvRecords.slice(0, 2).join('\n');
  const rawFrameRecords = rawCsvRecords.slice(2).join('\n');

  let metaRecords = [];
  csvParse(rawMetaRecords, {
    trim: true,
    skip_empty_lines: true,
  })
  .on('readable', function() {
    let record;
    while (record = this.read()) { 
      metaRecords.push(record);
    }
  })
  .on('end', function() {
    // Parse frame records now
    let frameRecords = [];
    csvParse(rawFrameRecords, {
      trim: true,
      skip_empty_lines: true,
    })
    .on('readable', function() {
      let record;
      while (record = this.read()) {
        frameRecords.push(record);
      }
    })
    .on('end', function() {
      callback(metaRecords, frameRecords);
    });
  });
}

/*
 * array is 2d array of records where first array are key values
 */
function csvArrayToJson(array) {
  let keys = [];
  array[0].forEach((keyName) => {
    keys.push(jsonKeyName(keyName));
  });

  let obj = [];
  array.slice(1).forEach((record, recordIndex) => {
    obj.push({});
    record.forEach((element, elementIndex) => {
      obj[recordIndex][keys[elementIndex]] = element;
    });
  });
  return obj;
}

function jsonKeyName(csvKey) {
  return (csvKey[0].toLowerCase() + csvKey.substring(1)).replace(/\W/g, '');
}
