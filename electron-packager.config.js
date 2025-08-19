module.exports = {
  // Configuración para empaquetar la aplicación
  appName: 'Informe Productos Laboratorio',
  appVersion: '1.0.0',
  platform: 'win32',
  arch: 'x64',
  out: 'dist-package',
  overwrite: true,
  asar: true,
  ignore: [
    'dist-package',
    'dist-build',
    'dist-build-new',
    'src',
    'node_modules',
    '*.log',
    '*.md',
    '.git',
    '.gitignore'
  ],
  extraResource: [
    'dbconfig.json'
  ]
};
