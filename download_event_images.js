const fs = require('fs');
const https = require('https');
const path = require('path');

const images = {
    "97_7": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/d826e5ad-a626-4c3c-8673-d5caf444d144",
    "97_11": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/03f44e86-5413-4aed-ba2d-78c8a72946b1",
    "97_15": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/69fa82e5-5543-42e1-aad6-2b63906f5d83",
    "97_19": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b250e87d-b417-476b-b33a-428f01decdb2",
    "97_23": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/155c0bf1-d96e-437a-b926-3a5c4d14503d",
    "97_27": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/6d503aca-b15b-42a4-bc02-a623056fdbdc",
    "97_31": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/cac88199-5184-4eec-947e-fe9a259c7587",
    "97_35": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/5ed356ef-1abf-42af-903d-327a5db17fed",
    "97_39": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/4c6bf5af-9b5f-4782-99cf-9e0fe58eb027",
    "97_43": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/ca835b74-1b7d-449c-bd63-6fc00f37c8e4",
    "97_47": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/63563775-9c21-4c0c-899b-dd9d390b1cdb",
    "97_51": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/1f00e4a9-fa82-4627-b2c2-dea84d867007",
    "97_55": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/281386e8-1751-4fd7-ba82-e17beb48fc71",
    "badge": "https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/b52407e2-b5bd-4c4e-ada9-eee14123cb80"
};

const targetDir = path.join(__dirname, 'public', 'images', 'event');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

Object.entries(images).forEach(([key, url]) => {
    const dest = path.join(targetDir, `${key}.jpg`);
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
        response.pipe(file);
        file.on('finish', () => {
            file.close();
            console.log(`Downloaded ${key}.jpg`);
        });
    }).on('error', (err) => {
        fs.unlink(dest, () => {});
        console.error(`Error downloading ${key}: ${err.message}`);
    });
});
