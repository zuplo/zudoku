nx run zudoku:build || exit 1

rm -rf /Users/ntotten/dev/temp/zudoku-test/node_modules/zudoku/dist
rm -rf /Users/ntotten/dev/temp/zudoku-test/node_modules/zudoku/src
rm -rf /Users/ntotten/dev/temp/zudoku-test/node_modules/zudoku/lib

cp -r /Users/ntotten/zuplo/projects/zudoku/packages/zudoku/dist /Users/ntotten/dev/temp/zudoku-test/node_modules/zudoku/dist
cp -r /Users/ntotten/zuplo/projects/zudoku/packages/zudoku/src /Users/ntotten/dev/temp/zudoku-test/node_modules/zudoku/src
cp -r /Users/ntotten/zuplo/projects/zudoku/packages/zudoku/lib /Users/ntotten/dev/temp/zudoku-test/node_modules/zudoku/lib

cd /Users/ntotten/dev/temp/zudoku-test
npm run dev