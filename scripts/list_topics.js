const fs = require('fs');
const files = ['adf.js','architect.js','architecture.js','behavioral.js','cicd-fabric.js','delta.js','governance.js','modeling.js','pyspark.js','scenario.js','spark.js','sql.js','streaming.js'];
files.forEach(f => {
  try {
    const c = fs.readFileSync(f, 'utf8');
    const m = c.match(/name:\s*"([^"]+)"/);
    if (m) console.log(f + ':' + m[1]);
  } catch (e) { }
});