
var fsMock = jest.genMockFromModule('fs');

var path = require.requireActual('path');

// This is a custom function that our tests can use during setup to specify
// what the files on the "mock" filesystem should look like when any of the
// `fs` APIs are used.
var _mockFiles = [];
function __setMockFiles(newMockFiles) {
	_mockFiles = newMockFiles;
};

fsMock.existsSync.mockImplementation(function(filePath) {
	filePath = path.normalize(filePath);
	var exists = filePath in _mockFiles;
	console.log('[mock] [fs] path', filePath, 'exists =', exists);
	return filePath in _mockFiles;
});

fsMock.readFileSync.mockImplementation(function(filePath) {
	filePath = path.normalize(filePath);
	var contents = _mockFiles[filePath] || '';
	console.log('[mock] [fs] readFile', filePath, '=', contents);
	return _mockFiles[filePath] || '';
});

// Add a custom method to the mock
fsMock.__setMockFiles = __setMockFiles;

module.exports = fsMock;