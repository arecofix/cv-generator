const fs = require('fs');
let data = JSON.parse(fs.readFileSync('n8n_workflow_cv.json', 'utf8'));

data.nodes.forEach(node => {
  if (node.name === 'Unificar CV') {
    let jsCode = node.parameters.jsCode;
    
    // We need to fix the syntax error introduced by the regex replace
    // The broken code looks like:
    //     });
    //   }));
    //   }
    //   if (userProfile.educations && userProfile.educations.length > 0) {
    //     finalEducacion = userProfile.educations.map((edu, i) => ({ id: 'u-edu'+i, titulo: edu.degree, institucion: edu.institution, fechas: edu.start + ' - ' + edu.end }));
    //   }
    
    // So we'll replace everything from '  }));' to the next '  }' with just '  }'
    
    jsCode = jsCode.replace(/    \}\);\n  \}\)\);\n  \}\n  if \(userProfile\.educations && userProfile\.educations\.length > 0\) \{\n    finalEducacion = userProfile\.educations\.map\(\(edu, i\) => \(\{ id: 'u-edu'\+i, titulo: edu\.degree, institucion: edu\.institution, fechas: edu\.start \+ ' - ' \+ edu\.end \}\)\);\n  \}/g, "    });\n  }");
    
    node.parameters.jsCode = jsCode;
  }
});

fs.writeFileSync('n8n_workflow_cv.json', JSON.stringify(data, null, 2));
