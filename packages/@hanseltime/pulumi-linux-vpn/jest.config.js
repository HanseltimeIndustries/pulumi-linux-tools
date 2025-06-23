const path = require("path");
const {
	getJestNodeModulesTransformIgnore,
} = require("@hanseltime/esm-interop-tools");

const testTSConfig = "tsconfig.test.json";

module.exports = {
	rootDir: path.resolve(__dirname, "src"),
	testTimeout: 15000,
	testEnvironment: "node",
	testPathIgnorePatterns: ["/node_modules/"],
	verbose: true,
	transform: {
		"\\.tsx?$": [
			"jest-chain-transform",
			{
				transformers: [
					[
						"ts-jest",
						{
							tsconfig: testTSConfig,
						},
					],
					// Use the cliTransformer on the transpiled code before this call
					// [
					// 	path.join(__dirname, "dist", "cjs", "cliTransformer.js"),
					// 	{
					// 		cliScripts: [
					// 			// asyncCLIScript does not have the specific comment
					// 			/.*src\/tests\/scripts\/asyncCLIScript.[jt]s/,
					// 		],
					// 		ecmaVersion: getEcmaVersionFromTsConfig(testTSConfig),
					// 	},
					// ],
				],
			},
		],
		// Until jest mocking is non-experimental and stable, we apply babel jest to ensure we get cjs compatible mocks
		"\\.jsx?$": [
			"babel-jest",
			{
				plugins: ["@babel/plugin-transform-modules-commonjs"],
			},
		],
	},
	transformIgnorePatterns: [
		// Populated by your yarn afterInstall command to scan esm modules
		getJestNodeModulesTransformIgnore({
			file: "esm-packages.json",
		}),
	],
};
