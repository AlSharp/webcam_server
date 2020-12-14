exports.getImacHostName = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('imac-dev');
    return 'imac-dev';
  }
  if (process.argv[2] === '--demo') {
    console.log('imac-dev');
    return 'imac-dev';
  }
  console.log('imac-dev');
  return 'imac-dev';
}