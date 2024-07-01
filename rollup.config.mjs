import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import { babel } from "@rollup/plugin-babel";
import typescript from "rollup-plugin-typescript2";

export default [
    {
        input: "src/index.ts",
        output: {
            file: "dist/esm/index.js",
            format: "esm",
        },
        plugins: [
            resolve(),
            commonjs(),
            babel({ babelHelpers: "bundled" }),
            typescript({
                tsconfig: "./tsconfig.json",
                useTsconfigDeclarationDir: true,
            }),
        ],
    },
    {
        input: "src/index.ts",
        output: {
            file: "dist/cjs/index.js",
            format: "cjs",
        },
        plugins: [
            resolve(),
            commonjs(),
            babel({ babelHelpers: "bundled" }),
            typescript({
                tsconfig: "./tsconfig.json",
                useTsconfigDeclarationDir: true,
            }),
        ],
    },
];
