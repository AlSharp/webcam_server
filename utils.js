exports.getImacHostName = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('imac-dev.local');
    return 'imac-dev.local';
  }
  if (process.argv[2] === '--demo') {
    console.log('imac-demo.local');
    return 'imac-demo.local';
  }
  console.log('imac-dev.local');
  return 'imac-dev.local';
}