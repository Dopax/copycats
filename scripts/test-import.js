const fs = require('fs');
const path = require('path');

async function testImport() {
    try {
        const filePath = path.join(process.cwd(), 'AdSpy 25.11.25.htm');
        console.log(`Reading file from ${filePath}...`);

        const fileContent = fs.readFileSync(filePath);
        const blob = new Blob([fileContent], { type: 'text/html' });

        const formData = new FormData();
        formData.append('file', blob, 'AdSpy 25.11.25.htm');

        console.log(`Sending file to API...`);

        const res = await fetch('http://localhost:3005/api/import', {
            method: 'POST',
            body: formData,
        });

        console.log(`Status: ${res.status} ${res.statusText}`);

        if (res.ok) {
            const data = await res.json();
            console.log('Response:', JSON.stringify(data, null, 2));
        } else {
            const text = await res.text();
            console.log('Error Body:', text.substring(0, 500));
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

testImport();
