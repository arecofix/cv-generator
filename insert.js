const fs = require('fs');
const data = JSON.parse(fs.readFileSync('/home/ubuntu/master_cv.json', 'utf8')).experiencia_laboral;
fetch('http://localhost:8000/rest/v1/experiencia_laboral', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjUyODAwMH0.rha7mrp1HqZTonRVvRMUNlWGTT1wQr28XT9yOum1xAA',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE2NDA5OTUyMDAsImV4cCI6MTk1NjUyODAwMH0.rha7mrp1HqZTonRVvRMUNlWGTT1wQr28XT9yOum1xAA',
        'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
})
.then(res => res.json())
.then(console.log)
.catch(console.error);
