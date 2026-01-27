module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      const rules = webpackConfig?.module?.rules;
      if (Array.isArray(rules)) {
        const sourceMapLoaderRule = rules.find((rule) => {
          if (rule?.enforce !== 'pre') return false;
          const use = rule?.use;
          if (!Array.isArray(use)) return false;
          return use.some((entry) => typeof entry?.loader === 'string' && entry.loader.includes('source-map-loader'));
        });

        if (sourceMapLoaderRule) {
          sourceMapLoaderRule.exclude = /node_modules/;
        }
      }

      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings ?? []),
        (warning) => typeof warning?.message === 'string' && warning.message.includes('Failed to parse source map'),
      ];

      return webpackConfig;
    },
  },
};

