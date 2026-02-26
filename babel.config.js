module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@': './src',
            '@/components': './src/components',
            '@/screens': './src/screens',
            '@/context': './src/context',
            '@/navigation': './src/navigation',
            '@/lib': './src/lib',
            '@/types': './src/types',
          },
        },
      ],
    ],
  };
};
