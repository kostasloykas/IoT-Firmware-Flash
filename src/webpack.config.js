const path = require('path');

module.exports = {
    mode: "development",
    entry: '../build/project.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, '../build/')
    },
};