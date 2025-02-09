import esbuild from 'esbuild';
import copy from 'esbuild-plugin-copy';

esbuild.build({
  entryPoints: [
    './src/index.ts',
    './src/options/options.ts',
  ],
  outdir: '../dist', // 出力先ディレクトリ
  outbase: './src', // outbaseを指定することで指定したディレクトリの構造が出力先ディレクトリに反映されるようになる,
  platform: 'node', // 'node' 'browser' 'neutral' のいずれかを指定,
  external: ['manifest.json'], // バンドルに含めたくないライブラリがある場合は、パッケージ名を文字列で列挙する,
  bundle: true,
  plugins: [copy({
    assets: [
      {
        from: ['./public/manifest.json'],
        to: ['./'],
      },
      {
        from: [
          './src/options/options.html',
          './src/options/options.css',
        ],
        to: ['./options'],
      },
    ],
  })],
});
