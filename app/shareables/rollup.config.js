const typescript = require("@rollup/plugin-typescript");
const pkg = require("./package.json");

module.exports = {
  input: pkg.source,
  output: {
    file: pkg.main,
    format: "cjs",
    sourcemap: true,
  },
  plugins: [
    typescript({
      tsconfig: "./tsconfig.json",
    }),
  ],
};
